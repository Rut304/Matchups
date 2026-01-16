// =============================================================================
// MULTI-BOOK ODDS API
// GET /api/action-odds
// Returns odds from multiple sportsbooks
// =============================================================================

import { NextRequest, NextResponse } from 'next/server'
import { 
  fetchMultiBookOdds, 
  fetchNFLMultiBookOddsByWeek,
  fetchCFBMultiBookOddsByWeek,
  type ActionNetworkMultiBookOdds 
} from '@/lib/scrapers/action-network'

export const dynamic = 'force-dynamic'

// Cache for 2 minutes
const cache = new Map<string, { data: ActionNetworkMultiBookOdds[]; timestamp: number }>()
const CACHE_TTL = 2 * 60 * 1000

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    const sport = (searchParams.get('sport') || 'NFL').toUpperCase()
    const week = searchParams.get('week')
    const seasonType = (searchParams.get('seasonType') || 'reg') as 'pre' | 'reg' | 'post'
    const dateStr = searchParams.get('date')
    
    // Build cache key
    const cacheKey = `${sport}-${week || 'today'}-${seasonType}-${dateStr || 'now'}`
    
    // Check cache
    const cached = cache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return NextResponse.json({
        success: true,
        odds: cached.data,
        cached: true,
        sport,
        gameCount: cached.data.length,
        source: 'live',
        timestamp: new Date().toISOString()
      })
    }

    let odds: ActionNetworkMultiBookOdds[] = []
    
    // NFL and NCAAF use week-based API
    if (sport === 'NFL' && week) {
      odds = await fetchNFLMultiBookOddsByWeek(parseInt(week), seasonType)
    } else if ((sport === 'NCAAF' || sport === 'CFB') && week) {
      odds = await fetchCFBMultiBookOddsByWeek(parseInt(week), seasonType as 'reg' | 'post')
    } else {
      // Other sports use date-based API
      const date = dateStr ? new Date(dateStr) : undefined
      odds = await fetchMultiBookOdds(sport, date)
    }

    // Cache result
    cache.set(cacheKey, { data: odds, timestamp: Date.now() })

    return NextResponse.json({
      success: true,
      odds,
      cached: false,
      sport,
      gameCount: odds.length,
      source: 'live',
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Odds fetch error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch odds'
    }, { status: 500 })
  }
}
