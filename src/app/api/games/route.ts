import { NextResponse } from 'next/server'
import { syncGames, type SportKey, ESPN_SPORTS } from '@/lib/api/data-layer'
import { getScoreboard, transformESPNGame } from '@/lib/api/espn'
import { fetchActionNetworkGames } from '@/lib/scrapers/action-network'

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
      console.warn('[API] Full sync timed out, falling back to ESPN + ActionNetwork merge:', syncError)
    }

    // Fallback: ESPN only, but attempt to merge Action Network odds (preferred)
    console.log('[API] Using ESPN fallback for', sport, 'and attempting Action Network merge')
    const espnData = await getScoreboard(sport)
    const espnGames = espnData.events.map(g => transformESPNGame(g, sport))

    // Try to enrich with Action Network odds (non-blocking)
    try {
      const anGames = await fetchActionNetworkGames(sport)
      if (anGames && anGames.length > 0) {
        // Map AN games by normalized team names
        const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '')
        for (const eg of espnGames) {
          const homeNorm = normalize(eg.home.name || '')
          const awayNorm = normalize(eg.away.name || '')
          const match = anGames.find(ag => {
            const homeTeam = ag.teams.find(t => t.id === ag.home_team_id)
            const awayTeam = ag.teams.find(t => t.id === ag.away_team_id)
            if (!homeTeam || !awayTeam) return false
            return normalize(homeTeam.full_name) === homeNorm && normalize(awayTeam.full_name) === awayNorm
          })
          if (match && match.markets) {
            const market = match.markets['15']?.event
            if (market) {
              const spreadHome = market.spread?.find(s => s.side === 'home')
              const totalOver = market.total?.find(t => t.side === 'over')
              eg.odds = {
                spread: spreadHome?.value ?? eg.odds?.spread ?? 0,
                total: totalOver?.value ?? eg.odds?.total ?? 0,
                details: spreadHome ? `AN spread ${spreadHome.value}` : (eg.odds?.details || ''),
                homeML: eg.odds?.homeML ?? 0,
                awayML: eg.odds?.awayML ?? 0,
              }
            }
          }
        }
      }
    } catch (anErr) {
      console.warn('[API] Action Network enrichment failed:', anErr)
    }

    const formatted = espnGames.map(game => ({
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
    }))

    return NextResponse.json({
      sport,
      count: formatted.length,
      games: formatted,
      timestamp: new Date().toISOString(),
      fallback: true, // Indicate this is fallback+enriched data
    })
  } catch (error) {
    console.error('[API] Error fetching games:', error)
    return NextResponse.json(
      { error: 'Failed to fetch games', games: [] },
      { status: 500 }
    )
  }
}
