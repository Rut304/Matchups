import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

const trendFinderModel = genAI.getGenerativeModel({ 
  model: 'gemini-2.0-flash-exp',
  generationConfig: {
    temperature: 0.3, // Lower temp for more factual responses
    topP: 0.9,
    topK: 40,
    maxOutputTokens: 4096,
  }
})

// ESPN API endpoints for real data
const ESPN_ENDPOINTS = {
  nfl: {
    scoreboard: 'https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard',
    teams: 'https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams',
    standings: 'https://site.api.espn.com/apis/v2/sports/football/nfl/standings',
    news: 'https://site.api.espn.com/apis/site/v2/sports/football/nfl/news',
  },
  nba: {
    scoreboard: 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard',
    teams: 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba/teams',
    standings: 'https://site.api.espn.com/apis/v2/sports/basketball/nba/standings',
  },
  nhl: {
    scoreboard: 'https://site.api.espn.com/apis/site/v2/sports/hockey/nhl/scoreboard',
    teams: 'https://site.api.espn.com/apis/site/v2/sports/hockey/nhl/teams',
    standings: 'https://site.api.espn.com/apis/v2/sports/hockey/nhl/standings',
  },
  mlb: {
    scoreboard: 'https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/scoreboard',
    teams: 'https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/teams',
    standings: 'https://site.api.espn.com/apis/v2/sports/baseball/mlb/standings',
  },
}

// Fetch live sports data to provide context
async function fetchSportsContext(query: string): Promise<string> {
  const lowerQuery = query.toLowerCase()
  const contexts: string[] = []
  
  try {
    // Detect which sports to fetch based on query
    const sports = []
    if (lowerQuery.includes('nfl') || lowerQuery.includes('football') || lowerQuery.includes('playoff')) sports.push('nfl')
    if (lowerQuery.includes('nba') || lowerQuery.includes('basketball')) sports.push('nba')
    if (lowerQuery.includes('nhl') || lowerQuery.includes('hockey')) sports.push('nhl')
    if (lowerQuery.includes('mlb') || lowerQuery.includes('baseball')) sports.push('mlb')
    
    // Default to NFL if no sport detected and query mentions playoffs
    if (sports.length === 0 && (lowerQuery.includes('playoff') || lowerQuery.includes('super bowl'))) {
      sports.push('nfl')
    }
    
    // Fetch current scoreboard data for relevant sports
    for (const sport of sports) {
      const endpoint = ESPN_ENDPOINTS[sport as keyof typeof ESPN_ENDPOINTS]
      if (endpoint) {
        const [scoreboardRes, standingsRes] = await Promise.all([
          fetch(endpoint.scoreboard).then(r => r.json()).catch(() => null),
          fetch(endpoint.standings).then(r => r.json()).catch(() => null),
        ])
        
        if (scoreboardRes?.events) {
          const games = scoreboardRes.events.slice(0, 5).map((e: any) => {
            const comp = e.competitions?.[0]
            const home = comp?.competitors?.find((c: any) => c.homeAway === 'home')
            const away = comp?.competitors?.find((c: any) => c.homeAway === 'away')
            return `${away?.team?.displayName || 'TBD'} @ ${home?.team?.displayName || 'TBD'}: ${away?.score || 0}-${home?.score || 0} (${e.status?.type?.description || 'Scheduled'})`
          })
          if (games.length > 0) {
            contexts.push(`**Current ${sport.toUpperCase()} Games:**\n${games.join('\n')}`)
          }
        }
        
        if (standingsRes?.children) {
          const topTeams = standingsRes.children.flatMap((conf: any) => 
            conf.standings?.entries?.slice(0, 3).map((e: any) => 
              `${e.team?.displayName}: ${e.stats?.find((s: any) => s.name === 'wins')?.value || 0}-${e.stats?.find((s: any) => s.name === 'losses')?.value || 0}`
            ) || []
          ).slice(0, 6)
          if (topTeams.length > 0) {
            contexts.push(`**${sport.toUpperCase()} Standings (Top Teams):**\n${topTeams.join('\n')}`)
          }
        }
      }
    }
  } catch (error) {
    console.error('Error fetching sports context:', error)
  }
  
  return contexts.length > 0 ? `\n\n**LIVE DATA CONTEXT:**\n${contexts.join('\n\n')}` : ''
}

// System prompt for the trend finder AI
const SYSTEM_PROMPT = `You are an expert sports statistician and betting analyst with access to comprehensive historical sports data and LIVE ESPN data. Your role is to answer detailed statistical questions about sports betting trends, game outcomes, and player/team performance.

IMPORTANT GUIDELINES:
1. You have access to LIVE ESPN data for current games, standings, and stats. Use this data when relevant.
2. For historical questions about specific scenarios (like playoff scoring patterns), provide ACTUAL data when possible. For very specific queries, explain how to look up the data if you can't compute it exactly.
3. When you don't have exact historical data, be CLEAR about this limitation but still provide your best analysis.
4. Include relevant context about why certain trends exist.
5. Format numerical data clearly with percentages and counts.
6. Suggest related trends the user might find interesting.

DATA ACCESS:
- LIVE game scores from ESPN
- Current standings and records
- Team statistics and trends
- Player statistics
- Historical playoff data (major databases)

SPORTS COVERED:
- NFL (including playoffs, Super Bowls since 1966)
- NBA (including playoffs since 1946)
- MLB (including playoffs, World Series)
- NHL (including playoffs, Stanley Cup)
- College Football (NCAAF)
- College Basketball (NCAAB)
- WNBA

IMPORTANT FOR SPECIFIC QUERIES:
For very specific historical queries like "how many times have both teams scored a rushing TD and passing TD in both halves":
1. Acknowledge this requires play-by-play data from every playoff game
2. Recommend checking Pro Football Reference or StatHead for exact answers
3. Provide your best estimate based on known scoring patterns
4. Explain the methodology behind your estimate

When answering trend questions, structure your response with:
1. Direct Answer: The specific answer to the query (with data source noted)
2. Data Breakdown: Supporting statistics
3. Context: Why this trend exists or is significant
4. Betting Implications: How this information could be used
5. Related Trends: Other interesting patterns to explore
6. Data Sources: Where to find more detailed information`

export async function POST(request: NextRequest) {
  try {
    const { query, conversationHistory } = await request.json()

    if (!query || typeof query !== 'string') {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 })
    }

    // Fetch live sports context based on query
    const liveContext = await fetchSportsContext(query)

    // Build the conversation context
    const messages = [
      { role: 'user', parts: [{ text: SYSTEM_PROMPT }] },
      { role: 'model', parts: [{ text: 'I understand. I\'m ready to help analyze sports trends and statistics. I have access to live ESPN data and historical databases. I\'ll provide detailed, data-driven answers and be transparent about data sources. What would you like to explore?' }] },
    ]

    // Add conversation history if provided
    if (conversationHistory && Array.isArray(conversationHistory)) {
      for (const msg of conversationHistory) {
        messages.push({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.content }]
        })
      }
    }

    // Add the current query with live context
    const enhancedQuery = liveContext 
      ? `${query}\n\n${liveContext}`
      : query
    
    messages.push({ role: 'user', parts: [{ text: enhancedQuery }] })

    // Start chat session
    const chat = trendFinderModel.startChat({
      history: messages.slice(0, -1) as any, // All but the last message
    })

    // Send the current query
    const result = await chat.sendMessage(enhancedQuery)
    const response = result.response.text()

    // Extract any statistical data mentioned for structured display
    const extractedStats = extractStatistics(response)

    return NextResponse.json({
      success: true,
      response,
      extractedStats,
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

// Helper to extract key statistics from the response
function extractStatistics(text: string): { label: string; value: string }[] {
  const stats: { label: string; value: string }[] = []
  
  // Look for percentage patterns
  const percentMatches = text.match(/(\d+(?:\.\d+)?%)/g)
  
  // Look for count patterns like "X games" or "X times"
  const countMatches = text.match(/(\d+)\s+(games?|times?|instances?|occurrences?|matchups?)/gi)
  
  // Look for record patterns like "X-Y"
  const recordMatches = text.match(/(\d+-\d+(?:-\d+)?)\s+(record|ATS|O\/U|SU)/gi)

  if (percentMatches && percentMatches.length > 0) {
    stats.push({ label: 'Key Percentage', value: percentMatches[0] })
  }
  
  if (countMatches && countMatches.length > 0) {
    stats.push({ label: 'Sample Size', value: countMatches[0] })
  }

  if (recordMatches && recordMatches.length > 0) {
    stats.push({ label: 'Record', value: recordMatches[0] })
  }

  return stats
}

// GET endpoint for health check
export async function GET() {
  return NextResponse.json({ 
    status: 'ok', 
    service: 'trend-finder',
    capabilities: ['NFL', 'NBA', 'MLB', 'NHL', 'NCAAF', 'NCAAB', 'WNBA']
  })
}
