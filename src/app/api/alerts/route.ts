import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * GET /api/alerts - Real-time betting alerts
 * 
 * Proxies to the real /api/edges system which uses:
 * 1. Action Network (real-time sharp money, RLM, betting splits)
 * 2. Supabase edge_alerts table
 * 
 * No mock data. Returns empty array when no active alerts.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type')
  const sport = searchParams.get('sport')
  const severity = searchParams.get('severity')

  try {
    // Build edges API URL with matching filters
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 
                    'http://localhost:3000'
    
    const edgesUrl = new URL('/api/edges', baseUrl)
    if (sport && sport !== 'all') edgesUrl.searchParams.set('sport', sport.toUpperCase())
    if (severity) {
      // Map severity to edges severity format
      const severityMap: Record<string, string> = {
        'critical': 'critical',
        'high': 'major',
        'medium': 'minor',
        'low': 'info'
      }
      edgesUrl.searchParams.set('severity', severityMap[severity] || severity)
    }

    const edgesRes = await fetch(edgesUrl.toString(), {
      next: { revalidate: 120 }
    })
    const edgesData = await edgesRes.json()

    // Transform edge alerts into the alert format the frontend expects
    const alerts = (edgesData.edges || []).map((edge: {
      id: string
      type: string
      sport: string
      title: string
      description: string
      gameId: string
      timestamp: string
      severity: string
      confidence: number
      data?: {
        publicPct?: number
        moneyPct?: number
        line?: number
      }
    }) => {
      // Map edge types to alert types
      const typeMap: Record<string, string> = {
        'sharp-public': 'sharp_action',
        'rlm': 'line_move',
        'steam': 'line_move',
        'clv': 'line_move',
        'arbitrage': 'sharp_action',
        'props': 'sharp_action'
      }

      const severityMap: Record<string, string> = {
        'critical': 'critical',
        'major': 'high',
        'minor': 'medium',
        'info': 'low'
      }

      return {
        id: edge.id,
        type: typeMap[edge.type] || 'sharp_action',
        sport: edge.sport,
        title: edge.title,
        description: edge.description,
        game: edge.gameId,
        timestamp: edge.timestamp,
        severity: severityMap[edge.severity] || 'medium',
        data: {
          percentage: edge.data?.publicPct || edge.data?.moneyPct,
          movement: edge.data?.line,
        },
        confidence: edge.confidence,
        source: 'action-network'
      }
    })

    // Filter by alert type if specified
    let filtered = alerts
    if (type && type !== 'all') {
      filtered = filtered.filter((a: { type: string }) => a.type === type)
    }

    return NextResponse.json({
      alerts: filtered,
      count: filtered.length,
      lastUpdated: new Date().toISOString(),
      source: edgesData.sources || { primary: 'action-network' }
    })
  } catch (error) {
    console.error('Alerts API error:', error)
    return NextResponse.json({
      alerts: [],
      count: 0,
      lastUpdated: new Date().toISOString(),
      source: 'none',
      message: 'No active alerts at this time'
    })
  }
}
