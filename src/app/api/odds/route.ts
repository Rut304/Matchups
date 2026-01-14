// =============================================================================
// MULTI-BOOK ODDS API
// GET /api/odds
// Returns odds from 40+ sportsbooks via The Odds API
// =============================================================================

import { NextRequest, NextResponse } from 'next/server'
import { getOdds, getLiveOdds, ODDS_API_SPORTS } from '@/lib/api/the-odds-api'

export const dynamic = 'force-dynamic'

// Cache for 5 minutes to avoid burning through API quota
const cache = new Map<string, { data: unknown; timestamp: number }>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  
  // Support both our sport format and Odds API format
  const sport = searchParams.get('sport') || 'americanfootball_nfl'
  const markets = searchParams.get('markets') || 'spreads,totals,h2h'
  const live = searchParams.get('live') === 'true'
  
  try {
    
    // Check cache
    const cacheKey = `${sport}-${markets}-${live}`
    const cached = cache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return NextResponse.json({
        success: true,
        odds: cached.data,
        cached: true,
        sport,
        markets: markets.split(','),
        timestamp: new Date().toISOString()
      })
    }

    // Map common sport names to Odds API format
    const sportMap: Record<string, string> = {
      'NFL': 'americanfootball_nfl',
      'NBA': 'basketball_nba',
      'NHL': 'icehockey_nhl',
      'MLB': 'baseball_mlb',
      'NCAAF': 'americanfootball_ncaaf',
      'NCAAB': 'basketball_ncaab',
      'WNBA': 'basketball_wnba',
      // Pass through if already in Odds API format
      'americanfootball_nfl': 'americanfootball_nfl',
      'basketball_nba': 'basketball_nba',
      'icehockey_nhl': 'icehockey_nhl',
      'baseball_mlb': 'baseball_mlb',
      'americanfootball_ncaaf': 'americanfootball_ncaaf',
      'basketball_ncaab': 'basketball_ncaab',
    }
    
    const oddsSport = sportMap[sport.toUpperCase()] || sportMap[sport] || sport
    
    // Validate sport
    if (!Object.values(ODDS_API_SPORTS).includes(oddsSport as typeof ODDS_API_SPORTS[keyof typeof ODDS_API_SPORTS])) {
      return NextResponse.json({
        success: false,
        error: `Invalid sport: ${sport}. Supported: NFL, NBA, NHL, MLB, NCAAF, NCAAB`,
        supportedSports: Object.keys(sportMap).filter(k => k === k.toUpperCase())
      }, { status: 400 })
    }

    // Check for API key
    if (!process.env.ODDS_API_KEY) {
      return NextResponse.json({
        success: false,
        error: 'ODDS_API_KEY not configured',
        hint: 'Add ODDS_API_KEY to your environment variables'
      }, { status: 503 })
    }

    // Fetch odds
    let odds
    if (live) {
      odds = await getLiveOdds(oddsSport as keyof typeof ODDS_API_SPORTS)
    } else {
      odds = await getOdds(oddsSport as keyof typeof ODDS_API_SPORTS, { 
        markets: markets.split(',') as ('spreads' | 'totals' | 'h2h')[]
      })
    }

    // Cache the result
    cache.set(cacheKey, { data: odds, timestamp: Date.now() })

    return NextResponse.json({
      success: true,
      odds,
      cached: false,
      sport: oddsSport,
      markets: markets.split(','),
      gameCount: Array.isArray(odds) ? odds.length : 0,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Odds API error:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    // Check if it's a rate limit or quota error - return empty data gracefully
    if (errorMessage.includes('429') || errorMessage.includes('401') || errorMessage.includes('quota') || errorMessage.includes('OUT_OF_USAGE')) {
      // Return empty odds array instead of error - don't break the UI
      return NextResponse.json({
        success: true,
        odds: [],
        cached: false,
        sport: searchParams.get('sport') || 'unknown',
        markets: (searchParams.get('markets') || 'spreads,totals,h2h').split(','),
        gameCount: 0,
        quotaExhausted: true,
        timestamp: new Date().toISOString()
      })
    }

    return NextResponse.json({
      success: false,
      error: errorMessage
    }, { status: 500 })
  }
}
