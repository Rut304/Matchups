/**
 * Stats API - Real Standings & Leaders
 * 
 * GET /api/stats?sport=NFL&type=standings|leaders
 */

import { NextRequest, NextResponse } from 'next/server'
import * as espn from '@/lib/api/espn'

type Sport = 'NFL' | 'NBA' | 'NHL' | 'MLB'

export interface TeamStanding {
  rank: number
  team: string
  teamCode: string
  logo: string
  wins: number
  losses: number
  ties?: number
  pct: number
  streak: string
  last10?: string
  homeRecord: string
  awayRecord: string
  pointsFor: number
  pointsAgainst: number
  division: string
  conference: string
}

export interface PlayerStat {
  rank: number
  player: string
  team: string
  teamCode: string
  position: string
  photo: string
  stat: number
  statLabel: string
  gamesPlayed: number
}

async function getStandings(sport: Sport): Promise<TeamStanding[]> {
  try {
    const standings = await espn.getStandings(sport)
    
    const allTeams: TeamStanding[] = []
    
    // ESPN returns flat array of ESPNStanding (team + stats)
    for (const entry of standings) {
      // Extract stats by name
      const getStat = (name: string): number => {
        const stat = entry.stats.find(s => s.name === name)
        return stat?.value ?? 0
      }
      
      const getStatDisplay = (name: string): string => {
        const stat = entry.stats.find(s => s.name === name)
        return stat?.displayValue ?? '-'
      }
      
      allTeams.push({
        rank: 0, // Will be set after sorting
        team: entry.team.displayName,
        teamCode: entry.team.abbreviation,
        logo: entry.team.logo || `https://a.espncdn.com/i/teamlogos/${sport.toLowerCase()}/500/${entry.team.abbreviation.toLowerCase()}.png`,
        wins: getStat('wins'),
        losses: getStat('losses'),
        ties: sport === 'NFL' ? getStat('ties') : undefined,
        pct: getStat('winPercent') || getStat('gamesBehind') ? 0 : getStat('wins') / Math.max(1, getStat('wins') + getStat('losses')),
        streak: getStatDisplay('streak'),
        last10: getStatDisplay('last10Record'),
        homeRecord: getStatDisplay('homeRecord') || getStatDisplay('home'),
        awayRecord: getStatDisplay('awayRecord') || getStatDisplay('road'),
        pointsFor: getStat('pointsFor') || getStat('pointsScored') || getStat('runsScored') || 0,
        pointsAgainst: getStat('pointsAgainst') || getStat('runsAllowed') || 0,
        division: entry.team.shortDisplayName || '',
        conference: entry.team.location || '',
      })
    }
    
    // Sort by win percentage
    allTeams.sort((a, b) => b.pct - a.pct)
    allTeams.forEach((t, i) => t.rank = i + 1)
    
    return allTeams
  } catch (error) {
    console.error(`Failed to fetch ${sport} standings:`, error)
    return []
  }
}

async function getLeaders(sport: Sport, category?: string): Promise<Record<string, PlayerStat[]>> {
  // ESPN public API doesn't have great leader endpoints
  // We'll use what's available and supplement with API-Sports
  
  const leaders: Record<string, PlayerStat[]> = {}
  
  try {
    // Define stat categories by sport
    const categories: Record<Sport, string[]> = {
      NFL: ['passing', 'rushing', 'receiving', 'tackles', 'sacks'],
      NBA: ['points', 'rebounds', 'assists', 'steals', 'blocks'],
      NHL: ['goals', 'assists', 'points', 'saves', 'wins'],
      MLB: ['avg', 'hr', 'rbi', 'era', 'wins'],
    }
    
    const sportCategories = categories[sport]
    
    // For now return placeholder - would integrate with API-Sports for full stats
    for (const cat of sportCategories) {
      leaders[cat] = []
    }
    
    return leaders
  } catch (error) {
    console.error(`Failed to fetch ${sport} leaders:`, error)
    return {}
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const sport = (searchParams.get('sport')?.toUpperCase() || 'NFL') as Sport
  const type = searchParams.get('type') || 'standings'
  const category = searchParams.get('category')
  
  if (!['NFL', 'NBA', 'NHL', 'MLB'].includes(sport)) {
    return NextResponse.json(
      { error: 'Invalid sport. Use NFL, NBA, NHL, or MLB' },
      { status: 400 }
    )
  }
  
  try {
    if (type === 'standings') {
      const standings = await getStandings(sport)
      
      return NextResponse.json({
        sport,
        standings,
        total: standings.length,
        lastUpdated: new Date().toISOString(),
      })
    }
    
    if (type === 'leaders') {
      const leaders = await getLeaders(sport, category || undefined)
      
      return NextResponse.json({
        sport,
        leaders,
        categories: Object.keys(leaders),
        lastUpdated: new Date().toISOString(),
      })
    }
    
    return NextResponse.json(
      { error: 'Invalid type. Use standings or leaders' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Stats API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    )
  }
}
