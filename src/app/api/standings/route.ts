import { NextRequest, NextResponse } from 'next/server'
import * as espn from '@/lib/api/espn'
import type { SportKey, ESPNStanding } from '@/lib/api/espn'

const VALID_SPORTS = ['NFL', 'NBA', 'NHL', 'MLB', 'NCAAF', 'NCAAB', 'WNBA', 'WNCAAB']

export interface StandingsTeam {
  id: string
  name: string
  abbreviation: string
  logo?: string
  wins: number
  losses: number
  ties?: number
  winPct: number
  division?: string
  conference?: string
  divisionRank?: number
  conferenceRank?: number
  playoffSeed?: number
  pointsFor: number
  pointsAgainst: number
  offenseRank?: number
  defenseRank?: number
  streak?: string
}

/**
 * Calculate offensive/defensive ranks based on points scored/allowed
 */
function calculateRanks(teams: StandingsTeam[]): StandingsTeam[] {
  // Sort by points per game for offense rank
  const offenseSorted = [...teams]
    .filter(t => (t.wins + t.losses) > 0)
    .sort((a, b) => {
      const gamesA = a.wins + a.losses
      const gamesB = b.wins + b.losses
      const ppgA = gamesA > 0 ? a.pointsFor / gamesA : 0
      const ppgB = gamesB > 0 ? b.pointsFor / gamesB : 0
      return ppgB - ppgA // Higher is better
    })
  
  // Sort by points allowed per game for defense rank
  const defenseSorted = [...teams]
    .filter(t => (t.wins + t.losses) > 0)
    .sort((a, b) => {
      const gamesA = a.wins + a.losses
      const gamesB = b.wins + b.losses
      const papgA = gamesA > 0 ? a.pointsAgainst / gamesA : 0
      const papgB = gamesB > 0 ? b.pointsAgainst / gamesB : 0
      return papgA - papgB // Lower is better
    })
  
  // Map ranks back to teams
  return teams.map(team => ({
    ...team,
    offenseRank: offenseSorted.findIndex(t => t.id === team.id) + 1,
    defenseRank: defenseSorted.findIndex(t => t.id === team.id) + 1,
  }))
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const sportParam = searchParams.get('sport')?.toUpperCase()
  const team = searchParams.get('team')?.toUpperCase()
  
  // Validate sport
  if (!sportParam || !VALID_SPORTS.includes(sportParam)) {
    return NextResponse.json(
      { error: `Invalid sport. Valid sports: ${VALID_SPORTS.join(', ')}` },
      { status: 400 }
    )
  }
  
  const sport = sportParam as SportKey
  
  try {
    const rawStandings = await espn.getStandings(sport)
    
    // Transform ESPN standings to our format
    const teams: StandingsTeam[] = rawStandings.map((entry: ESPNStanding) => {
      // Parse record (e.g., "12-5" or "12-5-1")
      const recordParts = (entry.stats?.find(s => s.name === 'overall')?.displayValue || '0-0')
        .split('-')
        .map(Number)
      
      const wins = recordParts[0] || 0
      const losses = recordParts[1] || 0
      const ties = recordParts[2] || 0
      
      // Get points for/against from stats
      const pointsFor = Number(entry.stats?.find(s => s.name === 'pointsFor')?.value) || 0
      const pointsAgainst = Number(entry.stats?.find(s => s.name === 'pointsAgainst')?.value) || 0
      
      return {
        id: entry.team?.id || '',
        name: entry.team?.displayName || '',
        abbreviation: entry.team?.abbreviation || '',
        logo: entry.team?.logos?.[0]?.href,
        wins,
        losses,
        ties: ties > 0 ? ties : undefined,
        winPct: (wins + losses) > 0 ? wins / (wins + losses) : 0,
        pointsFor,
        pointsAgainst,
        streak: entry.stats?.find(s => s.name === 'streak')?.displayValue,
      }
    })
    
    // Calculate offense and defense ranks
    const teamsWithRanks = calculateRanks(teams)
    
    // If specific team requested, filter
    if (team) {
      const teamData = teamsWithRanks.find(t => t.abbreviation === team)
      if (!teamData) {
        return NextResponse.json(
          { error: `Team ${team} not found in ${sport} standings` },
          { status: 404 }
        )
      }
      return NextResponse.json({ team: teamData }, {
        headers: { 'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=3600' }
      })
    }
    
    return NextResponse.json({
      sport,
      standings: teamsWithRanks,
      lastUpdated: new Date().toISOString(),
    }, {
      headers: { 'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=3600' }
    })
    
  } catch (error) {
    console.error(`Standings API error for ${sport}:`, error)
    return NextResponse.json(
      { error: 'Failed to fetch standings' },
      { status: 500 }
    )
  }
}
