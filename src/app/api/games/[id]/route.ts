import { NextResponse } from 'next/server'
import { getScoreboard, getGameDetails, transformESPNGame, ESPN_SPORTS, type SportKey } from '@/lib/api/espn'

export const runtime = 'nodejs'

// GET /api/games/[id]?sport=NFL
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { searchParams } = new URL(request.url)
  const sport = searchParams.get('sport')?.toUpperCase() as SportKey | null
  
  // If sport is provided, fetch specific game details
  if (sport && sport in ESPN_SPORTS) {
    try {
      const details = await getGameDetails(sport, id)
      if (!details) {
        return NextResponse.json({ error: 'Game not found' }, { status: 404 })
      }
      
      // Transform to our format
      const game = transformESPNGame(details as unknown as Parameters<typeof transformESPNGame>[0], sport)
      return NextResponse.json(game)
    } catch (error) {
      console.error('[API] Error fetching game:', error)
      return NextResponse.json({ error: 'Failed to fetch game' }, { status: 500 })
    }
  }
  
  // If no sport provided, search across all sports
  const sports: SportKey[] = ['NFL', 'NBA', 'NHL', 'MLB']
  
  for (const s of sports) {
    try {
      const scoreboard = await getScoreboard(s)
      const match = scoreboard.events.find(e => e.id === id)
      if (match) {
        const game = transformESPNGame(match, s)
        return NextResponse.json(game)
      }
    } catch {
      // Continue to next sport
    }
  }
  
  return NextResponse.json({ error: 'Game not found' }, { status: 404 })
}
