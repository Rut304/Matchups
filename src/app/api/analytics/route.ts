/**
 * Analytics API - Real Data Endpoints
 * 
 * Serves real analytics data to client-side pages
 * GET /api/analytics?type=trends|matchups|cappers|summary
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  getRealTrends,
  getRealMatchups,
  getRealCappers,
  getRealAnalyticsSummary,
  getHighEdgeTrends,
  getRealLineMovements,
  type Sport,
} from '@/lib/services/real-analytics'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const type = searchParams.get('type') || 'summary'
  const sport = searchParams.get('sport') as Sport | null
  const limit = parseInt(searchParams.get('limit') || '50')

  try {
    switch (type) {
      case 'trends': {
        const trends = await getRealTrends(sport || undefined)
        return NextResponse.json({
          trends: trends.slice(0, limit),
          total: trends.length,
        })
      }

      case 'high-edge': {
        const trends = await getHighEdgeTrends(limit)
        return NextResponse.json({
          trends,
          total: trends.length,
        })
      }

      case 'matchups': {
        const matchups = await getRealMatchups(sport || undefined)
        return NextResponse.json({
          matchups: matchups.slice(0, limit),
          total: matchups.length,
        })
      }

      case 'cappers': {
        const cappers = await getRealCappers()
        return NextResponse.json({
          cappers: cappers.slice(0, limit),
          total: cappers.length,
        })
      }

      case 'line-movements': {
        const movements = await getRealLineMovements(sport || undefined)
        return NextResponse.json({
          movements: movements.slice(0, limit),
          total: movements.length,
        })
      }

      case 'summary':
      default: {
        const summary = await getRealAnalyticsSummary()
        return NextResponse.json(summary)
      }
    }
  } catch (error) {
    console.error('Analytics API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics data' },
      { status: 500 }
    )
  }
}
