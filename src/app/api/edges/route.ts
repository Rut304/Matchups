import { NextResponse } from 'next/server'
import { 
  getActiveEdgeAlerts, 
  getGameEdgeAlerts, 
  EdgeType,
  EdgeAlert,
  defaultEdgeConfig 
} from '@/lib/edge-features'

export const dynamic = 'force-dynamic'

/**
 * GET /api/edges
 * 
 * Query params:
 * - sport: Filter by sport (NFL, NBA, NHL)
 * - gameId: Get alerts for specific game
 * - type: Filter by edge type (rlm, steam, clv, sharp-public, arbitrage, props)
 * - minConfidence: Minimum confidence threshold (0-100)
 * - severity: Filter by severity (critical, major, minor, info)
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const sport = searchParams.get('sport')?.toUpperCase()
    const gameId = searchParams.get('gameId')
    const type = searchParams.get('type') as EdgeType | null
    const minConfidence = parseInt(searchParams.get('minConfidence') || '0')
    const severity = searchParams.get('severity')
    
    let alerts: EdgeAlert[]
    
    if (gameId) {
      // Get alerts for specific game
      alerts = getGameEdgeAlerts(gameId, sport || 'NFL')
    } else {
      // Get all active alerts
      alerts = await getActiveEdgeAlerts(sport || undefined)
    }
    
    // Apply filters
    if (type) {
      alerts = alerts.filter(a => a.type === type)
    }
    
    if (minConfidence > 0) {
      alerts = alerts.filter(a => a.confidence >= minConfidence)
    }
    
    if (severity) {
      alerts = alerts.filter(a => a.severity === severity)
    }
    
    // Filter out expired alerts
    const now = new Date().toISOString()
    alerts = alerts.filter(a => !a.expiresAt || a.expiresAt > now)
    
    return NextResponse.json({
      count: alerts.length,
      alerts,
      config: defaultEdgeConfig,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error fetching edge alerts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch edge alerts' },
      { status: 500 }
    )
  }
}
