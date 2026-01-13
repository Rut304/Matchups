/**
 * Betting Splits API Route
 * Fetches REAL betting percentages from Action Network's public API
 * 
 * Data includes:
 * - Ticket % (public bet count)
 * - Money % (dollar handle - what sharps watch)
 * - Sharp money signals when ticket/money diverge
 */

import { NextResponse } from 'next/server'
import { 
  fetchBettingSplitsFromActionNetwork,
  fetchNFLGamesByWeek,
  fetchCFBGamesByWeek,
  detectSharpMoney,
  transformToBettingSplit
} from '@/lib/scrapers/action-network'
import type { BettingSplit } from '@/lib/scrapers/betting-splits'

export const dynamic = 'force-dynamic'
export const revalidate = 120 // 2 minutes - betting data updates frequently

interface BettingSplitsResponse {
  success: boolean
  data: {
    splits: BettingSplit[]
    sharpSignals: {
      gameId: string
      sport: string
      homeTeam: string
      awayTeam: string
      betType: string
      publicSide: string
      publicPct: number
      moneyPct: number
      sharpSide: string
      confidence: string
      signal: string
    }[]
    totalGames: number
    lastUpdated: string
  }
  source: string
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const sport = searchParams.get('sport')?.toUpperCase() || 'NFL'
  const gameId = searchParams.get('gameId') // Optional: filter to specific game
  const week = searchParams.get('week') // For NFL/CFB week-based queries
  const season = searchParams.get('season')
  const date = searchParams.get('date') // YYYYMMDD format
  
  try {
    let splits: BettingSplit[] = []
    
    // Determine which fetch method to use
    if (sport === 'NFL' && week) {
      const seasonType = searchParams.get('seasonType') as 'pre' | 'reg' | 'post' || 'reg'
      const games = await fetchNFLGamesByWeek(
        parseInt(week),
        seasonType,
        season ? parseInt(season) : undefined
      )
      splits = games.map(g => transformToBettingSplit(g, 'NFL')).filter(Boolean) as BettingSplit[]
    } else if (sport === 'NCAAF' && week) {
      const seasonType = searchParams.get('seasonType') as 'reg' | 'post' || 'reg'
      const games = await fetchCFBGamesByWeek(
        parseInt(week),
        seasonType,
        season ? parseInt(season) : undefined
      )
      splits = games.map(g => transformToBettingSplit(g, 'NCAAF')).filter(Boolean) as BettingSplit[]
    } else {
      // Date-based fetch for NBA, NHL, MLB, NCAAB, etc.
      const queryDate = date ? new Date(
        parseInt(date.slice(0, 4)),
        parseInt(date.slice(4, 6)) - 1,
        parseInt(date.slice(6, 8))
      ) : new Date()
      splits = await fetchBettingSplitsFromActionNetwork(sport, queryDate)
    }
    
    // Filter to specific game if requested
    if (gameId && splits.length > 0) {
      // Match by Action Network ID or by team names
      splits = splits.filter(s => 
        s.gameId === gameId || 
        s.gameId === `an-${gameId}` ||
        gameId.includes(s.homeTeam.toLowerCase().replace(/\s+/g, '-')) ||
        gameId.includes(s.awayTeam.toLowerCase().replace(/\s+/g, '-'))
      )
    }
    
    // Detect sharp money signals
    const sharpSignals = detectSharpMoney(splits)
    
    const response: BettingSplitsResponse = {
      success: true,
      data: {
        splits,
        sharpSignals,
        totalGames: splits.length,
        lastUpdated: new Date().toISOString()
      },
      source: 'actionnetwork'
    }
    
    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching betting splits:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch betting splits', message: String(error) },
      { status: 500 }
    )
  }
}
