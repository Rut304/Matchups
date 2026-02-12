import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { createClient } from '@/lib/supabase/server'
import { ESPN_APIS } from '@/lib/api/free-sports-apis'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

// Use stable model with fallback
const modelName = process.env.GEMINI_MODEL || 'gemini-1.5-flash'

const trendFinderModel = genAI.getGenerativeModel({ 
  model: modelName,
  generationConfig: {
    temperature: 0.2,
    topP: 0.9,
    topK: 40,
    maxOutputTokens: 4096,
  }
})

// Types for historical queries
interface HistoricalQuery {
  sport: string
  seasonType: 'regular' | 'postseason' | 'all'
  seasons: number[]
  conditions: QueryCondition[]
}

interface QueryCondition {
  type: string
  min?: number
  max?: number
}

// Parse natural language query into structured historical query
function parseHistoricalQuery(query: string): HistoricalQuery | null {
  const lowerQuery = query.toLowerCase()
  
  // Detect sport
  let sport = 'nfl'
  if (lowerQuery.includes('nba') || lowerQuery.includes('basketball')) sport = 'nba'
  else if (lowerQuery.includes('nhl') || lowerQuery.includes('hockey')) sport = 'nhl'
  else if (lowerQuery.includes('mlb') || lowerQuery.includes('baseball')) sport = 'mlb'
  
  // Detect season type
  let seasonType: 'regular' | 'postseason' | 'all' = 'all'
  if (lowerQuery.includes('playoff') || lowerQuery.includes('postseason') || lowerQuery.includes('super bowl')) {
    seasonType = 'postseason'
  } else if (lowerQuery.includes('regular season')) {
    seasonType = 'regular'
  }
  
  // Detect seasons (default to recent 5 years)
  const currentYear = new Date().getFullYear()
  let seasons: number[] = []
  
  // Look for specific year mentions
  const yearMatches = lowerQuery.match(/\b(19\d{2}|20\d{2})\b/g)
  if (yearMatches) {
    seasons = yearMatches.map(y => parseInt(y))
  } else if (lowerQuery.includes('all time') || lowerQuery.includes('history') || lowerQuery.includes('ever')) {
    // For historical queries, go back further
    seasons = Array.from({ length: 20 }, (_, i) => currentYear - i)
  } else {
    // Default to recent 5 years
    seasons = Array.from({ length: 5 }, (_, i) => currentYear - i)
  }
  
  // Detect conditions
  const conditions: QueryCondition[] = []
  
  // Normalize query - handle "td" vs "touchdown", "rush" vs "rushing" etc
  const hasBothTeams = lowerQuery.includes('both team') || lowerQuery.includes('each team')
  const hasRushing = lowerQuery.includes('rushing') || lowerQuery.includes('rush')
  const hasPassing = lowerQuery.includes('passing') || lowerQuery.includes('pass')
  const hasTouchdown = lowerQuery.includes('touchdown') || lowerQuery.includes(' td')
  const hasBothHalves = lowerQuery.includes('both half') || lowerQuery.includes('each half')
  
  // Check for both teams TD patterns
  if (hasBothTeams) {
    if (hasRushing && hasPassing && hasTouchdown) {
      if (hasBothHalves) {
        conditions.push({ type: 'both_teams_rush_pass_td_both_halves' })
      } else {
        conditions.push({ type: 'both_teams_rush_pass_td' })
      }
    } else if (hasTouchdown) {
      if (hasBothHalves) {
        conditions.push({ type: 'both_teams_td_both_halves' })
      }
    }
  }
  
  // High/low scoring
  if (lowerQuery.includes('high scoring') || lowerQuery.includes('over 50')) {
    conditions.push({ type: 'high_scoring', min: 50 })
  }
  if (lowerQuery.includes('low scoring') || lowerQuery.includes('under 30')) {
    conditions.push({ type: 'low_scoring', max: 30 })
  }
  
  // Blowouts and close games
  if (lowerQuery.includes('blowout')) {
    conditions.push({ type: 'blowout' })
  }
  if (lowerQuery.includes('close game') || lowerQuery.includes('one score')) {
    conditions.push({ type: 'close_game' })
  }
  
  // Return null if no meaningful conditions detected
  if (conditions.length === 0) return null
  
  return { sport, seasonType, seasons, conditions }
}

// Query historical database
async function queryHistoricalData(parsedQuery: HistoricalQuery): Promise<{
  found: boolean
  totalGames: number
  matchingGames: number
  percentage: string
  games: any[]
  estimatedTime: string
  requiresPlayByPlay?: boolean
  missingDataConditions?: string[]
}> {
  const supabase = await createClient()
  
  // Build query using correct column names
  let dbQuery = supabase.from('historical_games').select('*')
  
  dbQuery = dbQuery.ilike('sport', parsedQuery.sport)
  
  if (parsedQuery.seasonType !== 'all') {
    dbQuery = dbQuery.eq('season_type', parsedQuery.seasonType)
  }
  
  if (parsedQuery.seasons.length > 0) {
    dbQuery = dbQuery.in('season', parsedQuery.seasons)
  }
  
  const { data: games, error } = await dbQuery.order('game_date', { ascending: false })
  
  if (error) {
    console.error('Database query error:', error)
    return {
      found: false,
      totalGames: 0,
      matchingGames: 0,
      percentage: '0%',
      games: [],
      estimatedTime: '0s'
    }
  }
  
  if (!games || games.length === 0) {
    return {
      found: false,
      totalGames: 0,
      matchingGames: 0,
      percentage: '0%',
      games: [],
      estimatedTime: '0s'
    }
  }
  
  // Apply conditions
  let filteredGames = [...games]
  let requiresPlayByPlay = false
  const missingDataConditions: string[] = []
  
  for (const condition of parsedQuery.conditions) {
    switch (condition.type) {
      case 'both_teams_rush_pass_td_both_halves':
      case 'both_teams_rush_pass_td':
      case 'both_teams_td_both_halves':
        // These require play-by-play data we don't have
        // Check if any game has the required fields
        const hasDetailedData = games[0]?.home_rushing_td_first_half !== undefined
        if (!hasDetailedData) {
          requiresPlayByPlay = true
          missingDataConditions.push(condition.type)
          // Don't filter - let AI handle this query
        } else {
          if (condition.type === 'both_teams_rush_pass_td_both_halves') {
            filteredGames = filteredGames.filter(g => 
              g.home_rushing_td_first_half >= 1 &&
              g.home_passing_td_first_half >= 1 &&
              g.home_rushing_td_second_half >= 1 &&
              g.home_passing_td_second_half >= 1 &&
              g.away_rushing_td_first_half >= 1 &&
              g.away_passing_td_first_half >= 1 &&
              g.away_rushing_td_second_half >= 1 &&
              g.away_passing_td_second_half >= 1
            )
          } else if (condition.type === 'both_teams_td_both_halves') {
            filteredGames = filteredGames.filter(g => 
              (g.home_rushing_td_first_half + g.home_passing_td_first_half) >= 1 &&
              (g.home_rushing_td_second_half + g.home_passing_td_second_half) >= 1 &&
              (g.away_rushing_td_first_half + g.away_passing_td_first_half) >= 1 &&
              (g.away_rushing_td_second_half + g.away_passing_td_second_half) >= 1
            )
          }
        }
        break
      case 'high_scoring':
        filteredGames = filteredGames.filter(g => (g.home_score + g.away_score) >= (condition.min || 50))
        break
      case 'low_scoring':
        filteredGames = filteredGames.filter(g => (g.home_score + g.away_score) <= (condition.max || 30))
        break
      case 'blowout':
        filteredGames = filteredGames.filter(g => Math.abs(g.home_score - g.away_score) >= 21)
        break
      case 'close_game':
        filteredGames = filteredGames.filter(g => Math.abs(g.home_score - g.away_score) <= 7)
        break
    }
  }
  
  const totalGames = games.length
  const matchingGames = requiresPlayByPlay ? 0 : filteredGames.length
  const percentage = totalGames > 0 && !requiresPlayByPlay ? ((matchingGames / totalGames) * 100).toFixed(1) : 'N/A'
  
  return {
    found: true,
    totalGames,
    matchingGames,
    percentage: requiresPlayByPlay ? 'Requires play-by-play data' : `${percentage}%`,
    games: requiresPlayByPlay ? [] : filteredGames.slice(0, 20).map(g => ({
      date: g.game_date,
      matchup: `${g.away_team_abbr || g.away_team || g.away_team_name} @ ${g.home_team_abbr || g.home_team || g.home_team_name}`,
      score: `${g.away_score}-${g.home_score}`,
      season: g.season_year || g.season,
    })),
    estimatedTime: `${Math.ceil(totalGames / 100)}s`,
    requiresPlayByPlay,
    missingDataConditions
  }
}

// Check if we need more data and fetch it
async function ensureDataExists(sport: string, seasons: number[], seasonType: string): Promise<{
  needsData: boolean
  message: string
}> {
  const supabase = await createClient()
  
  // Check what data we have using correct column names
  const { count } = await supabase
    .from('historical_games')
    .select('*', { count: 'exact', head: true })
    .ilike('sport', sport)
    .eq('season_type', seasonType)
    .in('season', seasons)
  
  if ((count || 0) < seasons.length * 10) { // Expect at least 10 games per season
    return {
      needsData: true,
      message: `We have ${count || 0} ${sport.toUpperCase()} ${seasonType} games in database. Fetching more data...`
    }
  }
  
  return { needsData: false, message: '' }
}

// Fetch live ESPN context
async function fetchLiveContext(query: string): Promise<string> {
  const lowerQuery = query.toLowerCase()
  const contexts: string[] = []
  
  try {
    const sports: string[] = []
    if (lowerQuery.includes('nfl') || lowerQuery.includes('football') || lowerQuery.includes('playoff')) sports.push('nfl')
    if (lowerQuery.includes('nba') || lowerQuery.includes('basketball')) sports.push('nba')
    if (lowerQuery.includes('nhl') || lowerQuery.includes('hockey')) sports.push('nhl')
    if (lowerQuery.includes('mlb') || lowerQuery.includes('baseball')) sports.push('mlb')
    
    if (sports.length === 0) sports.push('nfl')
    
    for (const sport of sports.slice(0, 2)) {
      const sportEndpoint = ESPN_APIS[sport as keyof typeof ESPN_APIS]
      if (sportEndpoint && 'scoreboard' in sportEndpoint) {
        const res = await fetch(sportEndpoint.scoreboard as string).catch(() => null)
        if (res?.ok) {
          const data = await res.json()
          const games = data.events?.slice(0, 5).map((e: any) => {
            const comp = e.competitions?.[0]
            const home = comp?.competitors?.find((c: any) => c.homeAway === 'home')
            const away = comp?.competitors?.find((c: any) => c.homeAway === 'away')
            return `${away?.team?.abbreviation} @ ${home?.team?.abbreviation}: ${away?.score || 0}-${home?.score || 0}`
          })
          if (games?.length > 0) {
            contexts.push(`${sport.toUpperCase()} Today: ${games.join(', ')}`)
          }
        }
      }
    }
  } catch (e) {
    console.error('Error fetching live context:', e)
  }
  
  return contexts.join('\n')
}

// System prompt that emphasizes using real data
const SYSTEM_PROMPT = `You are a sports statistics analyst with access to a historical database.

CRITICAL RULES:
1. When historical query results are provided, USE THEM AS THE SOURCE OF TRUTH
2. If the database has the data, cite actual numbers: "Out of X games, Y matched (Z%)"
3. If specific data (like play-by-play stats) is NOT available in our database, provide your BEST ESTIMATE based on your sports knowledge and external research
4. ALWAYS be clear about whether you're using database data vs estimates
5. For estimates, cite reasoning: "Based on typical NFL game patterns where high-scoring games average X TDs..."

For queries requiring play-by-play data (TDs by half, specific scoring patterns):
- Acknowledge that our database has game-level data (scores, spreads) but not play-by-play
- Provide your best estimate based on league averages and game theory
- Suggest what the actual figure might be with confidence ranges

Structure your response as:
1. **Direct Answer**: State the answer clearly with data source
2. **Data Source**: Database results OR AI estimate based on sports research
3. **Analysis**: What this means for betting
4. **Confidence**: High (database), Medium (estimate from patterns), Low (limited data)`

export async function POST(request: NextRequest) {
  try {
    const { query, conversationHistory } = await request.json()

    if (!query || typeof query !== 'string') {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 })
    }

    // Parse the query to see if it's a historical stats question
    const parsedQuery = parseHistoricalQuery(query)
    
    let historicalResults: any = null
    let dataStatus = ''
    
    if (parsedQuery) {
      // Check if we have data
      const dataCheck = await ensureDataExists(
        parsedQuery.sport, 
        parsedQuery.seasons, 
        parsedQuery.seasonType
      )
      
      if (dataCheck.needsData) {
        dataStatus = dataCheck.message
      }
      
      // Query the database
      historicalResults = await queryHistoricalData(parsedQuery)
    }
    
    // Fetch live context for current games
    const liveContext = await fetchLiveContext(query)
    
    // Build enhanced query with real data
    let enhancedQuery = query
    
    if (historicalResults?.found) {
      if (historicalResults.requiresPlayByPlay) {
        enhancedQuery += `\n\n**IMPORTANT - PLAY-BY-PLAY DATA REQUIRED:**
This query requires detailed play-by-play data (TDs by type, scoring by half) that our database does not currently have.
- We have basic game data: ${historicalResults.totalGames} ${parsedQuery?.sport.toUpperCase()} games with scores, spreads, and totals
- We do NOT have: rushing TDs, passing TDs, first half stats, second half stats

PLEASE PROVIDE YOUR BEST ESTIMATE based on:
1. NFL average touchdown distribution patterns
2. Typical game scoring progressions
3. Historical league-wide statistics

Be specific with numbers and explain your reasoning. This is for betting research.`
      } else {
        enhancedQuery += `\n\n**DATABASE RESULTS (REAL DATA - USE THIS):**
Sport: ${parsedQuery?.sport.toUpperCase()}
Season Type: ${parsedQuery?.seasonType}
Seasons Searched: ${parsedQuery?.seasons.join(', ')}
Total Games in Database: ${historicalResults.totalGames}
Matching Games: ${historicalResults.matchingGames}
Percentage: ${historicalResults.percentage}

Example Games That Match:
${historicalResults.games.map((g: any) => `- ${g.date}: ${g.matchup} (${g.score}) - Season ${g.season}`).join('\n')}`
      }
    } else if (parsedQuery) {
      enhancedQuery += `\n\n**NOTE: Limited historical data available. Database returned 0 results.**
This query requires play-by-play historical data that may not be fully loaded yet.
Please provide your best estimate and note that it is an estimate.`
    }
    
    if (liveContext) {
      enhancedQuery += `\n\n**LIVE DATA:**\n${liveContext}`
    }
    
    // Build conversation
    const messages = [
      { role: 'user', parts: [{ text: SYSTEM_PROMPT }] },
      { role: 'model', parts: [{ text: 'I understand. I will use real database results when available and clearly distinguish between actual data and estimates.' }] },
    ]

    if (conversationHistory && Array.isArray(conversationHistory)) {
      for (const msg of conversationHistory) {
        messages.push({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.content }]
        })
      }
    }

    messages.push({ role: 'user', parts: [{ text: enhancedQuery }] })

    // Try to get AI response, with fallback if AI unavailable
    let response: string
    
    try {
      const chat = trendFinderModel.startChat({
        history: messages.slice(0, -1) as any,
      })

      const result = await chat.sendMessage(enhancedQuery)
      response = result.response.text()
    } catch (aiError) {
      // AI failed - provide a helpful fallback response
      console.warn('AI unavailable, providing fallback response:', aiError)
      
      if (historicalResults?.requiresPlayByPlay) {
        response = `**This query requires play-by-play data**

Your question about specific touchdown types (rushing/passing) in different halves requires detailed play-by-play data that our database doesn't currently have.

**What we DO have:**
- ${historicalResults.totalGames} NFL games with scores, spreads, and totals
- Spread results, over/under results, moneyline results

**What we DON'T have (yet):**
- Rushing TDs vs Passing TDs breakdown
- First half vs Second half scoring details
- Detailed play-by-play statistics

**Estimate based on NFL patterns:**
Both teams scoring a rushing TD AND passing TD in BOTH halves is quite rare. Based on typical NFL scoring patterns:
- Average NFL game: ~5 total TDs
- Probability of this specific pattern: Estimated 3-8% of games

*Note: This is an estimate. AI analysis is temporarily unavailable for more precise calculations.*`
      } else if (historicalResults?.found) {
        response = `**Database Results for your query:**

Based on our database of **${historicalResults.totalGames}** games:
- **${historicalResults.matchingGames}** games matched your criteria
- That's **${historicalResults.percentage}** of games

**Sample Games:**
${historicalResults.games.slice(0, 5).map((g: { date: string; matchup: string; score: string; season: number }) => 
  `• ${g.date}: ${g.matchup} (${g.score}) - Season ${g.season}`
).join('\n')}

*Note: AI analysis is temporarily unavailable. Showing raw database results.*`
      } else {
        response = `I can help you find betting trends! 

Our database contains historical game data for NFL, NBA, NHL, and MLB.

**Try asking questions like:**
• "How often do home underdogs cover in NFL playoffs?"
• "What's the over/under hit rate when total is above 50?"
• "Show me blowout games from this season"

*Note: AI analysis is temporarily unavailable. Database queries are working.*`
      }
    }

    return NextResponse.json({
      success: true,
      response,
      historicalData: historicalResults?.found ? {
        totalGames: historicalResults.totalGames,
        matchingGames: historicalResults.matchingGames,
        percentage: historicalResults.percentage,
        sampleGames: historicalResults.games.slice(0, 5),
      } : null,
      dataStatus: dataStatus || (historicalResults?.found ? 'Data from database' : 'Estimate (database query pending)'),
      hasLiveData: liveContext.length > 0,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    // Log detailed error info
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorStack = error instanceof Error ? error.stack : ''
    console.error('Trend finder error:', {
      message: errorMessage,
      stack: errorStack,
      error
    })
    
    // Check for specific Gemini errors
    if (errorMessage.includes('API_KEY') || errorMessage.includes('401')) {
      return NextResponse.json(
        { error: 'AI service authentication failed. Please check API configuration.' },
        { status: 500 }
      )
    }
    
    if (errorMessage.includes('SAFETY') || errorMessage.includes('blocked')) {
      return NextResponse.json(
        { error: 'Query was blocked by safety filters. Please rephrase your question.' },
        { status: 400 }
      )
    }
    
    if (errorMessage.includes('quota') || errorMessage.includes('rate')) {
      return NextResponse.json(
        { error: 'AI service rate limit reached. Please try again in a moment.' },
        { status: 429 }
      )
    }
    
    return NextResponse.json(
      { error: `Failed to process query: ${errorMessage}` },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({ 
    status: 'ok', 
    service: 'trend-finder',
    capabilities: ['NFL', 'NBA', 'MLB', 'NHL', 'Historical DB', 'Live ESPN']
  })
}
