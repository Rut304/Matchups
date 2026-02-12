// Comprehensive Stats API Layer
// Aggregates data from multiple sources: API-Sports, The Odds API, Ball Don't Lie

import axios from 'axios'

// =============================================================================
// API CLIENTS - All use environment variables for keys
// =============================================================================

const apiSportsNFL = axios.create({
  baseURL: 'https://v1.american-football.api-sports.io',
  headers: { 'x-apisports-key': process.env.API_SPORTS_KEY || '' },
})

const apiSportsNBA = axios.create({
  baseURL: 'https://v1.basketball.api-sports.io',
  headers: { 'x-apisports-key': process.env.API_SPORTS_KEY || '' },
})

const apiSportsNHL = axios.create({
  baseURL: 'https://v1.hockey.api-sports.io',
  headers: { 'x-apisports-key': process.env.API_SPORTS_KEY || '' },
})

const apiSportsMLB = axios.create({
  baseURL: 'https://v1.baseball.api-sports.io',
  headers: { 'x-apisports-key': process.env.API_SPORTS_KEY || '' },
})

// Ball Don't Lie - Free NBA API (no key needed)
const ballDontLie = axios.create({
  baseURL: 'https://api.balldontlie.io/v1',
  headers: {
    'Authorization': process.env.BALL_DONT_LIE_KEY || '',
  },
})

// =============================================================================
// TYPES
// =============================================================================

export interface TeamStanding {
  id: string
  team: string
  teamFull: string
  logo?: string
  conference?: string
  division?: string
  wins: number
  losses: number
  ties?: number
  winPct: number
  pointsFor: number
  pointsAgainst: number
  pointDiff: number
  streak: string
  last10: string
  homeRecord: string
  awayRecord: string
  confRecord?: string
  divRecord?: string
  atsRecord?: string
  ouRecord?: string
}

export interface PlayerStats {
  id: string
  name: string
  team: string
  position: string
  number?: number
  photo?: string
  stats: Record<string, number | string>
  rank?: number
}

export interface TeamStats {
  id: string
  team: string
  teamFull: string
  logo?: string
  stats: Record<string, number | string>
}

export interface Injury {
  id: string
  player: string
  team: string
  teamAbbr: string
  position: string
  status: 'O' | 'D' | 'Q' | 'IR' | 'PUP' | 'P' // Out, Doubtful, Questionable, IR, PUP, Probable
  injury: string
  updated: string
  impact: 'high' | 'medium' | 'low'
}

export interface LeagueLeaders {
  category: string
  leaders: PlayerStats[]
}

// =============================================================================
// NFL STATS
// =============================================================================

export async function getNFLStandings(): Promise<TeamStanding[]> {
  try {
    const response = await apiSportsNFL.get('/standings', {
      params: { league: 1, season: 2024 },
    })
    
    const standings: TeamStanding[] = []
    const data = response.data?.response || []
    
    for (const conf of data) {
      for (const team of conf.teams || []) {
        standings.push({
          id: team.team?.id?.toString() || '',
          team: team.team?.code || team.team?.name?.slice(0, 3).toUpperCase(),
          teamFull: team.team?.name || '',
          logo: team.team?.logo,
          conference: conf.conference,
          division: conf.division,
          wins: team.won || 0,
          losses: team.lost || 0,
          ties: team.ties || 0,
          winPct: team.won ? (team.won / (team.won + team.lost + (team.ties || 0))) * 100 : 0,
          pointsFor: team.points?.for || 0,
          pointsAgainst: team.points?.against || 0,
          pointDiff: (team.points?.for || 0) - (team.points?.against || 0),
          streak: team.streak || '-',
          last10: '-',
          homeRecord: `${team.home?.win || 0}-${team.home?.lost || 0}`,
          awayRecord: `${team.away?.win || 0}-${team.away?.lost || 0}`,
        })
      }
    }
    
    return standings.sort((a, b) => b.winPct - a.winPct)
  } catch (error) {
    console.error('[Stats API] Error fetching NFL standings:', error)
    // Return empty array - no fake data, UI should show "data unavailable"
    return []
  }
}

export async function getNFLPlayerStats(category: string = 'passing'): Promise<PlayerStats[]> {
  try {
    const response = await apiSportsNFL.get('/players/statistics', {
      params: { league: 1, season: 2024 },
    })
    
    // Process based on category
    return processSportsStats(response.data?.response || [], category, 'nfl')
  } catch (error) {
    console.error('[Stats API] Error fetching NFL player stats:', error)
    // Return empty array - no fake data
    return []
  }
}

export async function getNFLInjuries(): Promise<Injury[]> {
  try {
    const response = await apiSportsNFL.get('/injuries', {
      params: { league: 1, season: 2024 },
    })
    
    return (response.data?.response || []).map((inj: Record<string, unknown>) => ({
      id: String(inj.id || Math.random()),
      player: String((inj.player as Record<string, unknown>)?.name || 'Unknown'),
      team: String((inj.team as Record<string, unknown>)?.name || ''),
      teamAbbr: String((inj.team as Record<string, unknown>)?.code || ''),
      position: String(inj.position || ''),
      status: mapInjuryStatus(String(inj.status || '')),
      injury: String(inj.injury || 'Undisclosed'),
      updated: String(inj.date || new Date().toISOString()),
      impact: calculateInjuryImpact(String((inj.player as Record<string, unknown>)?.position || ''), String(inj.status || '')),
    }))
  } catch (error) {
    console.error('[Stats API] Error fetching NFL injuries:', error)
    // Return empty array - no fake data
    return []
  }
}

// =============================================================================
// NBA STATS
// =============================================================================

export async function getNBAStandings(): Promise<TeamStanding[]> {
  try {
    // Try Ball Don't Lie first (free)
    const response = await ballDontLie.get('/standings', {
      params: { season: 2024 },
    })
    
    return (response.data?.data || []).map((team: Record<string, unknown>) => ({
      id: String(team.id || ''),
      team: String(team.team || ''),
      teamFull: String(team.team_full_name || team.team || ''),
      conference: String(team.conference || ''),
      division: String(team.division || ''),
      wins: Number(team.wins || 0),
      losses: Number(team.losses || 0),
      winPct: Number(team.win_pct || 0) * 100,
      pointsFor: Number(team.pts || 0),
      pointsAgainst: Number(team.opp_pts || 0),
      pointDiff: Number(team.pts || 0) - Number(team.opp_pts || 0),
      streak: String(team.streak || '-'),
      last10: String(team.last_10 || '-'),
      homeRecord: String(team.home || '-'),
      awayRecord: String(team.road || '-'),
      confRecord: String(team.conf || '-'),
    }))
  } catch {
    // Fallback to API-Sports
    try {
      const response = await apiSportsNBA.get('/standings', {
        params: { league: 12, season: '2024-2025' },
      })
      
      return (response.data?.response || []).flat().map((team: Record<string, unknown>) => {
        const games = team.games as Record<string, Record<string, unknown>> | undefined
        const points = team.points as Record<string, unknown> | undefined
        const teamData = team.team as Record<string, unknown> | undefined
        const groupData = team.group as Record<string, unknown> | undefined
        
        return {
          id: String(teamData?.id || ''),
          team: String(teamData?.code || ''),
          teamFull: String(teamData?.name || ''),
          logo: String(teamData?.logo || ''),
          conference: String(groupData?.name || ''),
          wins: Number(games?.win?.total || 0),
          losses: Number(games?.lose?.total || 0),
          winPct: Number(games?.win?.percentage || 0) * 100,
          pointsFor: Number(points?.for || 0),
          pointsAgainst: Number(points?.against || 0),
          pointDiff: Number(points?.for || 0) - Number(points?.against || 0),
          streak: '-',
          last10: '-',
          homeRecord: '-',
          awayRecord: '-',
        }
      })
    } catch (error) {
      console.error('[Stats API] Error fetching NBA standings:', error)
      // Return empty array - no fake data
      return []
    }
  }
}

export async function getNBAPlayerStats(category: string = 'points'): Promise<PlayerStats[]> {
  try {
    const response = await ballDontLie.get('/season_averages', {
      params: { season: 2024 },
    })
    
    return processBallDontLieStats(response.data?.data || [], category)
  } catch (error) {
    console.error('[Stats API] Error fetching NBA player stats:', error)
    // Return empty array - no fake data
    return []
  }
}

export async function getNBAInjuries(): Promise<Injury[]> {
  try {
    const response = await apiSportsNBA.get('/injuries', {
      params: { league: 12, season: '2024-2025' },
    })
    
    return (response.data?.response || []).map((inj: Record<string, unknown>) => ({
      id: String(inj.id || Math.random()),
      player: String((inj.player as Record<string, unknown>)?.name || 'Unknown'),
      team: String((inj.team as Record<string, unknown>)?.name || ''),
      teamAbbr: String((inj.team as Record<string, unknown>)?.code || ''),
      position: String(inj.type || ''),
      status: mapInjuryStatus(String(inj.status || '')),
      injury: String(inj.reason || 'Undisclosed'),
      updated: String(inj.date || new Date().toISOString()),
      impact: calculateInjuryImpact('', String(inj.status || '')),
    }))
  } catch (error) {
    console.error('[Stats API] Error fetching NBA injuries:', error)
    // Return empty array - no fake data
    return []
  }
}

// =============================================================================
// NHL STATS
// =============================================================================

export async function getNHLStandings(): Promise<TeamStanding[]> {
  try {
    const response = await apiSportsNHL.get('/standings', {
      params: { league: 57, season: 2024 },
    })
    
    return (response.data?.response || []).flat().map((team: Record<string, unknown>) => {
      const teamData = team.team as Record<string, unknown> | undefined
      const groupData = team.group as Record<string, unknown> | undefined
      const gamesData = team.games as Record<string, Record<string, unknown>> | undefined
      const goalsData = team.goals as Record<string, unknown> | undefined
      
      return {
        id: String(teamData?.id || ''),
        team: String(teamData?.code || ''),
        teamFull: String(teamData?.name || ''),
        logo: String(teamData?.logo || ''),
        conference: String(groupData?.name || ''),
        wins: Number(gamesData?.win?.total || 0),
        losses: Number(gamesData?.lose?.total || 0),
        winPct: Number(gamesData?.win?.percentage || 0) * 100,
        pointsFor: Number(goalsData?.for || 0),
        pointsAgainst: Number(goalsData?.against || 0),
        pointDiff: Number(goalsData?.for || 0) - Number(goalsData?.against || 0),
        streak: '-',
        last10: '-',
        homeRecord: '-',
        awayRecord: '-',
      }
    })
  } catch (error) {
    console.error('[Stats API] Error fetching NHL standings:', error)
    // Return empty array - no fake data
    return []
  }
}

// =============================================================================
// MLB STATS
// =============================================================================

export async function getMLBStandings(): Promise<TeamStanding[]> {
  try {
    const response = await apiSportsMLB.get('/standings', {
      params: { league: 1, season: 2024 },
    })
    
    return (response.data?.response || []).flat().map((team: Record<string, unknown>) => {
      const teamData = team.team as Record<string, unknown> | undefined
      const groupData = team.group as Record<string, unknown> | undefined
      const gamesData = team.games as Record<string, Record<string, unknown>> | undefined
      const runsData = team.runs as Record<string, unknown> | undefined
      
      return {
        id: String(teamData?.id || ''),
        team: String(teamData?.code || ''),
        teamFull: String(teamData?.name || ''),
        logo: String(teamData?.logo || ''),
        conference: String(groupData?.name || ''),
        division: String(groupData?.name || ''),
        wins: Number(gamesData?.win?.total || 0),
        losses: Number(gamesData?.lose?.total || 0),
        winPct: Number(gamesData?.win?.percentage || 0) * 100,
        pointsFor: Number(runsData?.for || 0),
        pointsAgainst: Number(runsData?.against || 0),
        pointDiff: Number(runsData?.for || 0) - Number(runsData?.against || 0),
        streak: '-',
        last10: '-',
        homeRecord: '-',
        awayRecord: '-',
      }
    })
  } catch (error) {
    console.error('[Stats API] Error fetching MLB standings:', error)
    // Return empty array - no fake data
    return []
  }
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function mapInjuryStatus(status: string): Injury['status'] {
  const s = status.toLowerCase()
  if (s.includes('out') || s === 'o') return 'O'
  if (s.includes('doubtful') || s === 'd') return 'D'
  if (s.includes('questionable') || s === 'q') return 'Q'
  if (s.includes('ir')) return 'IR'
  if (s.includes('pup')) return 'PUP'
  return 'P' // Probable
}

function calculateInjuryImpact(position: string, status: string): Injury['impact'] {
  const highImpactPositions = ['QB', 'RB1', 'WR1', 'LT', 'C', 'PG', 'SF', 'G', 'D', 'P']
  const isHighImpactPosition = highImpactPositions.some(p => position.toUpperCase().includes(p))
  const isOut = status.toLowerCase().includes('out') || status === 'O'
  
  if (isHighImpactPosition && isOut) return 'high'
  if (isHighImpactPosition || isOut) return 'medium'
  return 'low'
}

function processSportsStats(data: unknown[], category: string, sport: string): PlayerStats[] {
  // Process raw API data based on category
  console.log(`Processing ${sport} stats for category: ${category}`, data.length)
  return []
}

function processBallDontLieStats(data: unknown[], category: string): PlayerStats[] {
  console.log(`Processing NBA stats for category: ${category}`, data.length)
  return []
}

// =============================================================================
// UNIFIED STATS FETCHER
// =============================================================================

export type Sport = 'nfl' | 'nba' | 'nhl' | 'mlb'

export async function getStandings(sport: Sport): Promise<TeamStanding[]> {
  switch (sport) {
    case 'nfl': return getNFLStandings()
    case 'nba': return getNBAStandings()
    case 'nhl': return getNHLStandings()
    case 'mlb': return getMLBStandings()
    default: return []
  }
}

export async function getPlayerStats(sport: Sport, category: string): Promise<PlayerStats[]> {
  switch (sport) {
    case 'nfl': return getNFLPlayerStats(category)
    case 'nba': return getNBAPlayerStats(category)
    default: return []
  }
}

export async function getInjuries(sport: Sport): Promise<Injury[]> {
  switch (sport) {
    case 'nfl': return getNFLInjuries()
    case 'nba': return getNBAInjuries()
    // NO MOCK DATA - return empty for unsupported sports
    default: return []
  }
}

export async function getAllInjuries(): Promise<Injury[]> {
  const [nfl, nba] = await Promise.all([
    getInjuries('nfl'),
    getInjuries('nba'),
  ])
  return [...nfl, ...nba].sort((a, b) => {
    const impactOrder = { high: 0, medium: 1, low: 2 }
    return impactOrder[a.impact] - impactOrder[b.impact]
  })
}
