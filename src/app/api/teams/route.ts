/**
 * Teams API - Real Data Endpoints
 * 
 * Serves real team analytics data with provenance
 * GET /api/teams?sport=NFL|NBA|NHL|MLB&season=2025&seasonType=regular
 * GET /api/teams/[abbr]
 */

import { NextRequest, NextResponse } from 'next/server'
import { getRealTeams, type Sport, type GetRealTeamsOptions } from '@/lib/services/real-analytics'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const sport = (searchParams.get('sport')?.toUpperCase() || 'NFL') as Sport
  const abbr = searchParams.get('abbr')
  const seasonParam = searchParams.get('season')
  const seasonType = searchParams.get('seasonType') as 'regular' | 'postseason' | undefined
  
  // Build options object
  const options: GetRealTeamsOptions = {
    sport,
    season: seasonParam ? parseInt(seasonParam, 10) : undefined,
    seasonType,
  }

  try {
    const fetchedAt = new Date().toISOString()
    const teams = await getRealTeams(options)
    
    if (abbr) {
      const team = teams.find(t => t.abbr.toLowerCase() === abbr.toLowerCase())
      if (!team) {
        return NextResponse.json({ error: 'Team not found' }, { status: 404 })
      }
      return NextResponse.json({ 
        team,
        meta: {
          source: 'espn+supabase',
          fetchedAt,
          season: options.season,
          seasonType: options.seasonType,
        }
      })
    }
    
    return NextResponse.json({
      teams,
      total: teams.length,
      sport,
      meta: {
        source: 'espn+supabase',
        fetchedAt,
        season: options.season,
        seasonType: options.seasonType,
      }
    })
  } catch (error) {
    console.error('Teams API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch teams data' },
      { status: 500 }
    )
  }
}
