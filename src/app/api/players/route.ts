import { NextResponse } from 'next/server'

interface ESPNAthlete {
  id: string
  displayName: string
  position?: { abbreviation: string }
  team?: { 
    displayName: string
    abbreviation: string 
  }
  statistics?: any[]
}

interface Player {
  id: string
  name: string
  team: string
  teamAbbr: string
  position: string
  stats: Record<string, number>
}

const SPORT_CONFIGS: Record<string, { espnPath: string; statsMap: Record<string, string> }> = {
  nfl: {
    espnPath: 'football/nfl',
    statsMap: { passYds: 'passingYards', rushYds: 'rushingYards', recYds: 'receivingYards' }
  },
  nba: {
    espnPath: 'basketball/nba',
    statsMap: { ppg: 'points', rpg: 'rebounds', apg: 'assists' }
  },
  nhl: {
    espnPath: 'hockey/nhl', 
    statsMap: { goals: 'goals', assists: 'assists', points: 'points' }
  },
  mlb: {
    espnPath: 'baseball/mlb',
    statsMap: { avg: 'battingAverage', hr: 'homeRuns', rbi: 'rbi' }
  },
  ncaaf: {
    espnPath: 'football/college-football',
    statsMap: { passYds: 'passingYards', rushYds: 'rushingYards' }
  },
  ncaab: {
    espnPath: 'basketball/mens-college-basketball',
    statsMap: { ppg: 'points', rpg: 'rebounds' }
  },
  wnba: {
    espnPath: 'basketball/wnba',
    statsMap: { ppg: 'points', rpg: 'rebounds', apg: 'assists' }
  },
  wncaab: {
    espnPath: 'basketball/womens-college-basketball',
    statsMap: { ppg: 'points', rpg: 'rebounds' }
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const sport = searchParams.get('sport')?.toLowerCase() || 'nba'
  const limit = parseInt(searchParams.get('limit') || '25')
  const search = searchParams.get('search')?.toLowerCase()

  const config = SPORT_CONFIGS[sport]
  if (!config) {
    return NextResponse.json({ 
      error: `Unsupported sport: ${sport}`,
      supportedSports: Object.keys(SPORT_CONFIGS)
    }, { status: 400 })
  }

  try {
    // Fetch from ESPN athletes endpoint
    const url = `https://site.api.espn.com/apis/site/v2/sports/${config.espnPath}/athletes?limit=${limit}`
    const res = await fetch(url, {
      next: { revalidate: 300 } // Cache for 5 minutes
    })

    if (!res.ok) {
      // Don't throw on 404 - some sports endpoints don't exist or are seasonal
      if (res.status === 404) {
        console.warn(`[Players API] ESPN returned 404 for ${sport} - endpoint may not exist`)
        return NextResponse.json({
          sport,
          players: [],
          count: 0,
          message: `Player data not available for ${sport}`,
          source: 'espn-404'
        })
      }
      throw new Error(`ESPN API returned ${res.status}`)
    }

    const data = await res.json()
    
    let players: Player[] = (data.athletes || []).map((athlete: ESPNAthlete) => ({
      id: athlete.id,
      name: athlete.displayName,
      team: athlete.team?.displayName || 'Free Agent',
      teamAbbr: athlete.team?.abbreviation || 'FA',
      position: athlete.position?.abbreviation || 'N/A',
      stats: {}
    }))

    // Apply search filter
    if (search) {
      players = players.filter(p => 
        p.name.toLowerCase().includes(search) ||
        p.team.toLowerCase().includes(search)
      )
    }

    return NextResponse.json({
      sport,
      players,
      count: players.length,
      source: 'espn'
    })
  } catch (error) {
    console.error(`Failed to fetch ${sport} players:`, error)
    
    // Return empty array with error context
    return NextResponse.json({
      sport,
      players: [],
      count: 0,
      error: 'Failed to fetch player data',
      source: 'error'
    })
  }
}
