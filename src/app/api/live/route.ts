import { NextRequest, NextResponse } from 'next/server'
import { getLiveGameState, getAllLiveGames, pollGameUpdates } from '@/lib/live/play-by-play'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const gameId = searchParams.get('gameId')
  const sport = searchParams.get('sport')
  const lastSequence = parseInt(searchParams.get('lastSequence') || '0')
  const mode = searchParams.get('mode') || 'state' // 'state', 'poll', 'all'
  
  try {
    // Get all live games
    if (mode === 'all' || (!gameId && !sport)) {
      const liveGames = await getAllLiveGames()
      return NextResponse.json({
        success: true,
        count: liveGames.length,
        games: liveGames,
        timestamp: new Date().toISOString(),
      }, {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'X-Live-Update': 'true',
        }
      })
    }
    
    // Get specific game state or poll for updates
    if (gameId && sport) {
      if (mode === 'poll') {
        const result = await pollGameUpdates(gameId, sport, lastSequence)
        return NextResponse.json({
          success: true,
          hasUpdates: result.hasUpdates,
          newPlays: result.newPlays,
          state: result.state,
          timestamp: new Date().toISOString(),
        }, {
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
          }
        })
      }
      
      const state = await getLiveGameState(gameId, sport)
      
      if (!state) {
        return NextResponse.json({
          success: false,
          error: 'Game not found or not live',
        }, { status: 404 })
      }
      
      return NextResponse.json({
        success: true,
        game: state,
        timestamp: new Date().toISOString(),
      }, {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        }
      })
    }
    
    return NextResponse.json({
      success: false,
      error: 'Missing gameId or sport parameter',
    }, { status: 400 })
    
  } catch (error) {
    console.error('[Live API] Error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 })
  }
}
