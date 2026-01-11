/**
 * Teams API - Real Data Endpoints
 * 
 * Serves real team analytics data
 * GET /api/teams?sport=NFL|NBA|NHL|MLB
 * GET /api/teams/[abbr]
 */

import { NextRequest, NextResponse } from 'next/server'
import { getRealTeams, type Sport } from '@/lib/services/real-analytics'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const sport = (searchParams.get('sport')?.toUpperCase() || 'NFL') as Sport
  const abbr = searchParams.get('abbr')

  try {
    const teams = await getRealTeams(sport)
    
    if (abbr) {
      const team = teams.find(t => t.abbr.toLowerCase() === abbr.toLowerCase())
      if (!team) {
        return NextResponse.json({ error: 'Team not found' }, { status: 404 })
      }
      return NextResponse.json({ team })
    }
    
    return NextResponse.json({
      teams,
      total: teams.length,
      sport,
    })
  } catch (error) {
    console.error('Teams API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch teams data' },
      { status: 500 }
    )
  }
}
