import { NextResponse } from 'next/server'
import { syncGames, type SportKey, ESPN_SPORTS } from '@/lib/api/data-layer'
import { getScoreboard, transformESPNGame } from '@/lib/api/espn'

export const runtime = 'nodejs'
export const maxDuration = 25 // Allow up to 25 seconds for this API

// GET /api/games?sport=NFL&date=2024-01-15
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const sport = searchParams.get('sport')?.toUpperCase() as SportKey | null
  
  if (!sport || !(sport in ESPN_SPORTS)) {
    return NextResponse.json(
      { error: 'Invalid or missing sport parameter. Valid: NFL, NBA, NHL, MLB, NCAAF, NCAAB' },
      { status: 400 }
    )
  }
  
  try {
    // Try full sync (ESPN + Odds API) with a timeout
    const timeoutPromise = new Promise<null>((_, reject) => 
      setTimeout(() => reject(new Error('timeout')), 8000)
    )
    
    const gamesPromise = syncGames(sport)
    
    try {
      const games = await Promise.race([gamesPromise, timeoutPromise])
      if (games) {
        return NextResponse.json({
          sport,
          count: games.length,
          games,
          timestamp: new Date().toISOString(),
        })
      }
    } catch (syncError) {
      console.warn('[API] Full sync timed out, falling back to ESPN only:', syncError)
    }
    
    // Fallback: ESPN only (faster, no odds data)
    console.log('[API] Using ESPN-only fallback for', sport)
    const espnData = await getScoreboard(sport)
    const espnGames = espnData.events.map(g => {
      const game = transformESPNGame(g, sport)
      return {
        id: game.id,
        sport,
        status: game.status,
        scheduledAt: game.scheduledAt,
        homeTeam: {
          id: game.home.id || '',
          name: game.home.name || '',
          abbreviation: game.home.abbreviation || '',
          logo: game.home.logo,
          score: game.home.score,
          record: game.home.record,
        },
        awayTeam: {
          id: game.away.id || '',
          name: game.away.name || '',
          abbreviation: game.away.abbreviation || '',
          logo: game.away.logo,
          score: game.away.score,
          record: game.away.record,
        },
        venue: game.venue,
        broadcast: game.broadcast,
        odds: game.odds,
        lastUpdated: new Date().toISOString(),
      }
    })
    
    return NextResponse.json({
      sport,
      count: espnGames.length,
      games: espnGames,
      timestamp: new Date().toISOString(),
      fallback: true, // Indicate this is fallback data
    })
  } catch (error) {
    console.error('[API] Error fetching games:', error)
    return NextResponse.json(
      { error: 'Failed to fetch games', games: [] },
      { status: 500 }
    )
  }
}
