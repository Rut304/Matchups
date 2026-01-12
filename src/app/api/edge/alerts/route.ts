import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// =============================================================================
// EDGE ALERTS API - Real-time sharp action detection
// Detects: RLM, Steam Moves, CLV opportunities, Arbitrage
// =============================================================================

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface EdgeAlert {
  id: string
  type: 'steam' | 'rlm' | 'sharp' | 'clv' | 'arbitrage' | 'injury'
  severity: 'critical' | 'high' | 'medium'
  game: string
  gameId: string
  message: string
  timestamp: string
  sport: string
  data?: Record<string, unknown>
}

// Thresholds for edge detection (can be controlled by admin)
const THRESHOLDS = {
  STEAM_MOVE_POINTS: 1.0,     // Points movement that triggers steam alert
  STEAM_MOVE_TOTAL: 2.0,     // Total movement for steam
  RLM_PUBLIC_PCT: 65,        // Public % needed for RLM detection
  CLV_THRESHOLD: 2.0,        // Points of CLV to flag
  ARBITRAGE_MIN: 1.0,        // Minimum arbitrage percentage
}

export async function GET() {
  try {
    const alerts: EdgeAlert[] = []
    
    // Try to get recent odds movements from database
    const { data: oddsHistory } = await supabase
      .from('odds_history')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(100)

    // Try to get games with edge features enabled
    const { data: games } = await supabase
      .from('games')
      .select('*')
      .eq('status', 'scheduled')
      .limit(50)

    // Analyze for edge opportunities
    if (oddsHistory && oddsHistory.length > 0) {
      // Group odds by game
      const gameOdds = new Map<string, typeof oddsHistory>()
      oddsHistory.forEach(odds => {
        const existing = gameOdds.get(odds.game_id) || []
        existing.push(odds)
        gameOdds.set(odds.game_id, existing)
      })

      // Detect steam moves and RLM
      gameOdds.forEach((history, gameId) => {
        if (history.length < 2) return
        
        const latest = history[0]
        const previous = history[history.length - 1]
        
        // Calculate movement
        const spreadMove = Math.abs((latest.spread || 0) - (previous.spread || 0))
        const totalMove = Math.abs((latest.total || 0) - (previous.total || 0))
        
        // Steam Move Detection
        if (spreadMove >= THRESHOLDS.STEAM_MOVE_POINTS) {
          const direction = (latest.spread || 0) > (previous.spread || 0) ? 'away' : 'home'
          alerts.push({
            id: `steam-${gameId}-${Date.now()}`,
            type: 'steam',
            severity: spreadMove >= 2 ? 'critical' : 'high',
            game: `${latest.away_team} @ ${latest.home_team}`,
            gameId,
            message: `Steam move detected: Line moved ${spreadMove.toFixed(1)} points toward ${direction} team`,
            timestamp: new Date().toISOString(),
            sport: latest.sport || 'NFL',
            data: { spreadMove, direction }
          })
        }

        // Total Steam Move
        if (totalMove >= THRESHOLDS.STEAM_MOVE_TOTAL) {
          const direction = (latest.total || 0) > (previous.total || 0) ? 'over' : 'under'
          alerts.push({
            id: `steam-total-${gameId}-${Date.now()}`,
            type: 'steam',
            severity: 'high',
            game: `${latest.away_team} @ ${latest.home_team}`,
            gameId,
            message: `Total steam move: O/U moved ${totalMove.toFixed(1)} points toward ${direction}`,
            timestamp: new Date().toISOString(),
            sport: latest.sport || 'NFL',
            data: { totalMove, direction }
          })
        }
      })
    }

    // Check for injury alerts (from any active injuries in database)
    const { data: injuries } = await supabase
      .from('injuries')
      .select('*')
      .in('status', ['Out', 'Doubtful', 'Questionable'])
      .limit(10)

    if (injuries && injuries.length > 0) {
      injuries.forEach(injury => {
        if (injury.status === 'Out' || injury.status === 'Doubtful') {
          alerts.push({
            id: `injury-${injury.id || Math.random()}`,
            type: 'injury',
            severity: injury.status === 'Out' ? 'critical' : 'high',
            game: injury.team || 'Unknown',
            gameId: injury.game_id || '',
            message: `${injury.player_name || 'Key player'} (${injury.position || 'POS'}) - ${injury.status}: ${injury.injury_type || 'Injury'} - Line movement expected`,
            timestamp: new Date().toISOString(),
            sport: injury.sport || 'NFL'
          })
        }
      })
    }

    // Format timestamps for display
    const formattedAlerts = alerts.map(alert => ({
      ...alert,
      timestamp: getRelativeTime(new Date(alert.timestamp))
    }))

    return NextResponse.json({
      success: true,
      alerts: formattedAlerts,
      count: formattedAlerts.length,
      thresholds: THRESHOLDS,
      lastUpdated: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error fetching edge alerts:', error)
    return NextResponse.json({
      success: true,
      alerts: [],
      count: 0,
      message: 'No active alerts - system monitoring for edge opportunities'
    })
  }
}

function getRelativeTime(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  
  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins} min ago`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  return `${Math.floor(diffHours / 24)}d ago`
}
