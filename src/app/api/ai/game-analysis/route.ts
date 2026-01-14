import { NextRequest, NextResponse } from 'next/server'
import { geminiModel } from '@/lib/gemini'
import * as espn from '@/lib/api/espn'
import type { SportKey } from '@/lib/api/espn'

const VALID_SPORTS = ['NFL', 'NBA', 'NHL', 'MLB', 'NCAAF', 'NCAAB']

// Server-side cache for AI analysis
// Key: gameId, Value: { analysis, timestamp, lineSnapshot }
const analysisCache = new Map<string, {
  analysis: string
  timestamp: number
  lineSnapshot: string
}>()

const CACHE_DURATION = 30 * 60 * 1000 // 30 minutes

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const gameId = searchParams.get('gameId')
  const sportParam = searchParams.get('sport')?.toUpperCase()
  
  if (!gameId) {
    return NextResponse.json(
      { error: 'Missing required parameter: gameId' },
      { status: 400 }
    )
  }
  
  if (!sportParam || !VALID_SPORTS.includes(sportParam)) {
    return NextResponse.json(
      { error: `Invalid sport. Valid sports: ${VALID_SPORTS.join(', ')}` },
      { status: 400 }
    )
  }
  
  const sport = sportParam as SportKey
  
  try {
    // Fetch game details from ESPN
    const game = await espn.getGameDetails(sport, gameId)
    
    if (!game) {
      return NextResponse.json(
        { error: 'Game not found' },
        { status: 404 }
      )
    }
    
    const homeTeam = game.competitions[0]?.competitors?.find(c => c.homeAway === 'home')
    const awayTeam = game.competitions[0]?.competitors?.find(c => c.homeAway === 'away')
    const odds = game.competitions[0]?.odds?.[0]
    
    // Create a snapshot of current odds for cache invalidation
    const lineSnapshot = `${odds?.spread || 0}-${odds?.overUnder || 0}`
    
    // Check cache
    const cached = analysisCache.get(gameId)
    if (cached) {
      const isStillValid = Date.now() - cached.timestamp < CACHE_DURATION
      const lineUnchanged = cached.lineSnapshot === lineSnapshot
      
      if (isStillValid && lineUnchanged) {
        return NextResponse.json({
          gameId,
          analysis: cached.analysis,
          cached: true,
          cacheAge: Math.floor((Date.now() - cached.timestamp) / 1000),
          lineSnapshot,
        }, {
          headers: {
            'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
            'X-Cache-Status': 'HIT'
          }
        })
      }
    }
    
    // Generate new analysis with Gemini
    const matchupStr = `${awayTeam?.team.displayName || 'Away'} at ${homeTeam?.team.displayName || 'Home'}`
    const spreadStr = odds?.spread ? `${homeTeam?.team.abbreviation} ${odds.spread > 0 ? '+' : ''}${odds.spread}` : 'N/A'
    const totalStr = odds?.overUnder ? `${odds.overUnder}` : 'N/A'
    
    const prompt = `You are a sharp sports betting analyst. Provide a brief (2-3 sentences), insightful analysis for:

**${sport}: ${matchupStr}**
Spread: ${spreadStr}
Total: ${totalStr}
Home Record: ${homeTeam?.records?.[0]?.summary || 'N/A'}
Away Record: ${awayTeam?.records?.[0]?.summary || 'N/A'}

Focus on:
1. Key matchup factor affecting the spread
2. One trend or situational factor
3. A clear lean (if any edge exists)

Be concise, professional, and actionable. If no clear edge, say so. Do NOT make predictions about final scores.`

    let analysis = ''
    
    try {
      const result = await geminiModel.generateContent(prompt)
      analysis = result.response.text()
      
      // Clean up the analysis
      analysis = analysis
        .replace(/\*\*/g, '')
        .replace(/\n\n+/g, ' ')
        .trim()
      
      // Cache the result
      analysisCache.set(gameId, {
        analysis,
        timestamp: Date.now(),
        lineSnapshot,
      })
      
    } catch (aiError) {
      console.error('Gemini AI error:', aiError)
      
      // Fallback analysis without AI
      analysis = `${matchupStr}: The ${homeTeam?.team.abbreviation || 'home team'} hosts ${awayTeam?.team.abbreviation || 'away team'} with the spread at ${spreadStr} and total at ${totalStr}. Monitor line movement and injury reports for edge opportunities.`
    }
    
    return NextResponse.json({
      gameId,
      analysis,
      cached: false,
      lineSnapshot,
      matchup: matchupStr,
      spread: spreadStr,
      total: totalStr,
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        'X-Cache-Status': 'MISS'
      }
    })
    
  } catch (error) {
    console.error(`AI Game Analysis error for ${gameId}:`, error)
    return NextResponse.json(
      { error: 'Failed to generate analysis' },
      { status: 500 }
    )
  }
}
