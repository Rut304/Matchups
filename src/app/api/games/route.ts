import { NextResponse } from 'next/server'
import { syncGames, type SportKey, ESPN_SPORTS } from '@/lib/api/data-layer'

export const runtime = 'nodejs'

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
    const games = await syncGames(sport)
    
    return NextResponse.json({
      sport,
      count: games.length,
      games,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[API] Error fetching games:', error)
    return NextResponse.json(
      { error: 'Failed to fetch games' },
      { status: 500 }
    )
  }
}
