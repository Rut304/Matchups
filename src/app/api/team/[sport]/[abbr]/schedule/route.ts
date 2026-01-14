import { NextRequest, NextResponse } from 'next/server'
import { getTeamSchedule, getTeamId, NFL_TEAM_IDS, NBA_TEAM_IDS, NHL_TEAM_IDS, MLB_TEAM_IDS } from '@/lib/api/team-schedule'
import type { SportKey } from '@/lib/api/espn'

const VALID_SPORTS = ['nfl', 'nba', 'nhl', 'mlb', 'ncaaf', 'ncaab']

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sport: string; abbr: string }> }
) {
  const { sport, abbr } = await params
  const sportUpper = sport.toUpperCase() as SportKey
  const abbrUpper = abbr.toUpperCase()
  
  // Validate sport
  if (!VALID_SPORTS.includes(sport.toLowerCase())) {
    return NextResponse.json(
      { error: `Invalid sport: ${sport}. Valid sports: ${VALID_SPORTS.join(', ')}` },
      { status: 400 }
    )
  }
  
  // Get limit from query params
  const searchParams = request.nextUrl.searchParams
  const limit = parseInt(searchParams.get('limit') || '10', 10)
  
  // Get ESPN team ID from abbreviation
  const teamId = getTeamId(sportUpper, abbrUpper)
  
  if (!teamId) {
    // Return available team abbreviations for this sport
    const teamMaps: Record<string, Record<string, string>> = {
      NFL: NFL_TEAM_IDS,
      NBA: NBA_TEAM_IDS,
      NHL: NHL_TEAM_IDS,
      MLB: MLB_TEAM_IDS,
    }
    
    const availableTeams = Object.keys(teamMaps[sportUpper] || {})
    
    return NextResponse.json(
      { 
        error: `Unknown team abbreviation: ${abbrUpper}`,
        availableTeams,
        sport: sportUpper
      },
      { status: 404 }
    )
  }
  
  try {
    const schedule = await getTeamSchedule(sportUpper, teamId, limit)
    
    if (!schedule) {
      return NextResponse.json(
        { error: 'Failed to fetch team schedule', team: abbrUpper, sport: sportUpper },
        { status: 500 }
      )
    }
    
    return NextResponse.json(schedule, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600'
      }
    })
  } catch (error) {
    console.error(`Team schedule API error for ${abbrUpper} (${sportUpper}):`, error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
