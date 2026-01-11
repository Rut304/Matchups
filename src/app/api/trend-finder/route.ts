import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { createClient } from '@/lib/supabase/server'
import { ESPN_APIS } from '@/lib/api/free-sports-apis'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

const trendFinderModel = genAI.getGenerativeModel({ 
  model: 'gemini-2.0-flash-exp',
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
  
  // Check for both teams TD patterns
  if (lowerQuery.includes('both team') || lowerQuery.includes('each team')) {
    if (lowerQuery.includes('rushing') && lowerQuery.includes('passing') && lowerQuery.includes('touchdown') || 
        lowerQuery.includes('rush') && lowerQuery.includes('pass') && lowerQuery.includes('td')) {
      if (lowerQuery.includes('both half') || lowerQuery.includes('each half')) {
        conditions.push({ type: 'both_teams_rush_pass_td_both_halves' })
      } else {
        conditions.push({ type: 'both_teams_rush_pass_td' })
      }
    } else if (lowerQuery.includes('touchdown') || lowerQuery.includes('td')) {
      if (lowerQuery.includes('both half') || lowerQuery.includes('each half')) {
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
}> {
  const supabase = await createClient()
  
  // Build query
  let dbQuery = supabase.from('historical_games').select('*')
  
  dbQuery = dbQuery.eq('sport', parsedQuery.sport)
  
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
  
  for (const condition of parsedQuery.conditions) {
    switch (condition.type) {
      case 'both_teams_rush_pass_td_both_halves':
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
        break
      case 'both_teams_td_both_halves':
        filteredGames = filteredGames.filter(g => 
          (g.home_rushing_td_first_half + g.home_passing_td_first_half) >= 1 &&
          (g.home_rushing_td_second_half + g.home_passing_td_second_half) >= 1 &&
          (g.away_rushing_td_first_half + g.away_passing_td_first_half) >= 1 &&
          (g.away_rushing_td_second_half + g.away_passing_td_second_half) >= 1
        )
        break
      case 'high_scoring':
        filteredGames = filteredGames.filter(g => g.total_points >= (condition.min || 50))
        break
      case 'low_scoring':
        filteredGames = filteredGames.filter(g => g.total_points <= (condition.max || 30))
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
  const matchingGames = filteredGames.length
  const percentage = totalGames > 0 ? ((matchingGames / totalGames) * 100).toFixed(1) : '0'
  
  return {
    found: true,
    totalGames,
    matchingGames,
    percentage: `${percentage}%`,
    games: filteredGames.slice(0, 20).map(g => ({
      date: g.game_date,
      matchup: `${g.away_team_abbr} @ ${g.home_team_abbr}`,
      score: `${g.away_score}-${g.home_score}`,
      season: g.season,
    })),
    estimatedTime: `${Math.ceil(totalGames / 100)}s`
  }
}

// Check if we need more data and fetch it
async function ensureDataExists(sport: string, seasons: number[], seasonType: string): Promise<{
  needsData: boolean
  message: string
}> {
  const supabase = await createClient()
  
  // Check what data we have
  const { count } = await supabase
    .from('historical_games')
    .select('*', { count: 'exact', head: true })
    .eq('sport', sport)
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
const SYSTEM_PROMPT = `You are a sports statistics analyst with access to a REAL historical database.

CRITICAL RULES:
1. When historical query results are provided, USE THEM AS THE SOURCE OF TRUTH
2. DO NOT estimate or guess - use the actual numbers from the database
3. If the database shows 0 results, say "Based on our database of X games, this occurred 0 times"
4. Always cite the actual data: "Out of X games searched, Y matched (Z%)"

When database results are provided, structure your response as:
1. **Direct Answer**: "Based on {totalGames} games in our database, this has occurred {matchingGames} times ({percentage})"
2. **Game Examples**: List the specific games where this happened
3. **Analysis**: What this means for betting
4. **Note**: If data seems incomplete, mention we may need to fetch more historical data

If NO database results are available, you may provide estimates but CLEARLY state they are estimates.`

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
      enhancedQuery += `\n\n**DATABASE RESULTS (REAL DATA - USE THIS):**
Sport: ${parsedQuery?.sport.toUpperCase()}
Season Type: ${parsedQuery?.seasonType}
Seasons Searched: ${parsedQuery?.seasons.join(', ')}
Total Games in Database: ${historicalResults.totalGames}
Matching Games: ${historicalResults.matchingGames}
Percentage: ${historicalResults.percentage}

Example Games That Match:
${historicalResults.games.map((g: any) => `- ${g.date}: ${g.matchup} (${g.score}) - Season ${g.season}`).join('\n')}`
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

    // Get AI response
    const chat = trendFinderModel.startChat({
      history: messages.slice(0, -1) as any,
    })

    const result = await chat.sendMessage(enhancedQuery)
    const response = result.response.text()

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
    console.error('Trend finder error:', error)
    return NextResponse.json(
      { error: 'Failed to process query. Please try again.' },
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
