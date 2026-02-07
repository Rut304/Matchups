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
// MOCK DATA (Fallbacks when API fails or rate limited)
// =============================================================================

function getMockNFLStandings(): TeamStanding[] {
  return [
    { id: '1', team: 'DET', teamFull: 'Detroit Lions', conference: 'NFC', division: 'North', wins: 14, losses: 2, ties: 0, winPct: 87.5, pointsFor: 512, pointsAgainst: 298, pointDiff: 214, streak: 'W5', last10: '8-2', homeRecord: '8-0', awayRecord: '6-2', confRecord: '10-2', divRecord: '5-1' },
    { id: '2', team: 'KC', teamFull: 'Kansas City Chiefs', conference: 'AFC', division: 'West', wins: 14, losses: 2, ties: 0, winPct: 87.5, pointsFor: 438, pointsAgainst: 286, pointDiff: 152, streak: 'W3', last10: '7-3', homeRecord: '7-1', awayRecord: '7-1', confRecord: '9-3', divRecord: '6-0' },
    { id: '3', team: 'PHI', teamFull: 'Philadelphia Eagles', conference: 'NFC', division: 'East', wins: 13, losses: 3, ties: 0, winPct: 81.3, pointsFor: 466, pointsAgainst: 298, pointDiff: 168, streak: 'W2', last10: '8-2', homeRecord: '7-1', awayRecord: '6-2', confRecord: '9-3', divRecord: '4-2' },
    { id: '4', team: 'BUF', teamFull: 'Buffalo Bills', conference: 'AFC', division: 'East', wins: 13, losses: 3, ties: 0, winPct: 81.3, pointsFor: 502, pointsAgainst: 318, pointDiff: 184, streak: 'W4', last10: '9-1', homeRecord: '6-2', awayRecord: '7-1', confRecord: '10-2', divRecord: '5-1' },
    { id: '5', team: 'MIN', teamFull: 'Minnesota Vikings', conference: 'NFC', division: 'North', wins: 13, losses: 3, ties: 0, winPct: 81.3, pointsFor: 452, pointsAgainst: 328, pointDiff: 124, streak: 'L1', last10: '7-3', homeRecord: '7-1', awayRecord: '6-2', confRecord: '9-3', divRecord: '4-2' },
    { id: '6', team: 'BAL', teamFull: 'Baltimore Ravens', conference: 'AFC', division: 'North', wins: 11, losses: 5, ties: 0, winPct: 68.8, pointsFor: 478, pointsAgainst: 352, pointDiff: 126, streak: 'W1', last10: '6-4', homeRecord: '6-2', awayRecord: '5-3', confRecord: '7-5', divRecord: '4-2' },
    { id: '7', team: 'LAC', teamFull: 'Los Angeles Chargers', conference: 'AFC', division: 'West', wins: 10, losses: 6, ties: 0, winPct: 62.5, pointsFor: 391, pointsAgainst: 328, pointDiff: 63, streak: 'W2', last10: '6-4', homeRecord: '5-3', awayRecord: '5-3', confRecord: '8-4', divRecord: '3-3' },
    { id: '8', team: 'PIT', teamFull: 'Pittsburgh Steelers', conference: 'AFC', division: 'North', wins: 10, losses: 6, ties: 0, winPct: 62.5, pointsFor: 358, pointsAgainst: 312, pointDiff: 46, streak: 'L3', last10: '4-6', homeRecord: '5-3', awayRecord: '5-3', confRecord: '7-5', divRecord: '3-3' },
  ]
}

function getMockNBAStandings(): TeamStanding[] {
  return [
    { id: '1', team: 'OKC', teamFull: 'Oklahoma City Thunder', conference: 'West', wins: 27, losses: 5, winPct: 84.4, pointsFor: 120.2, pointsAgainst: 106.8, pointDiff: 13.4, streak: 'W6', last10: '9-1', homeRecord: '15-1', awayRecord: '12-4' },
    { id: '2', team: 'CLE', teamFull: 'Cleveland Cavaliers', conference: 'East', wins: 26, losses: 6, winPct: 81.3, pointsFor: 119.5, pointsAgainst: 108.2, pointDiff: 11.3, streak: 'W4', last10: '8-2', homeRecord: '15-2', awayRecord: '11-4' },
    { id: '3', team: 'BOS', teamFull: 'Boston Celtics', conference: 'East', wins: 25, losses: 8, winPct: 75.8, pointsFor: 118.8, pointsAgainst: 110.1, pointDiff: 8.7, streak: 'W2', last10: '7-3', homeRecord: '13-3', awayRecord: '12-5' },
    { id: '4', team: 'MEM', teamFull: 'Memphis Grizzlies', conference: 'West', wins: 23, losses: 10, winPct: 69.7, pointsFor: 117.2, pointsAgainst: 111.5, pointDiff: 5.7, streak: 'W1', last10: '6-4', homeRecord: '12-4', awayRecord: '11-6' },
    { id: '5', team: 'HOU', teamFull: 'Houston Rockets', conference: 'West', wins: 22, losses: 11, winPct: 66.7, pointsFor: 115.1, pointsAgainst: 110.2, pointDiff: 4.9, streak: 'L1', last10: '6-4', homeRecord: '13-4', awayRecord: '9-7' },
    { id: '6', team: 'NYK', teamFull: 'New York Knicks', conference: 'East', wins: 22, losses: 12, winPct: 64.7, pointsFor: 113.8, pointsAgainst: 109.6, pointDiff: 4.2, streak: 'W3', last10: '7-3', homeRecord: '12-5', awayRecord: '10-7' },
    { id: '7', team: 'DAL', teamFull: 'Dallas Mavericks', conference: 'West', wins: 20, losses: 13, winPct: 60.6, pointsFor: 114.5, pointsAgainst: 112.1, pointDiff: 2.4, streak: 'L2', last10: '5-5', homeRecord: '11-5', awayRecord: '9-8' },
    { id: '8', team: 'LAL', teamFull: 'Los Angeles Lakers', conference: 'West', wins: 19, losses: 13, winPct: 59.4, pointsFor: 113.2, pointsAgainst: 111.8, pointDiff: 1.4, streak: 'W1', last10: '5-5', homeRecord: '10-6', awayRecord: '9-7' },
  ]
}

function getMockNHLStandings(): TeamStanding[] {
  return [
    { id: '1', team: 'WPG', teamFull: 'Winnipeg Jets', conference: 'West', wins: 26, losses: 10, winPct: 72.2, pointsFor: 132, pointsAgainst: 92, pointDiff: 40, streak: 'W2', last10: '7-3', homeRecord: '14-4', awayRecord: '12-6' },
    { id: '2', team: 'VGK', teamFull: 'Vegas Golden Knights', conference: 'West', wins: 26, losses: 10, winPct: 72.2, pointsFor: 128, pointsAgainst: 98, pointDiff: 30, streak: 'W5', last10: '8-2', homeRecord: '15-3', awayRecord: '11-7' },
    { id: '3', team: 'WSH', teamFull: 'Washington Capitals', conference: 'East', wins: 24, losses: 11, winPct: 68.6, pointsFor: 121, pointsAgainst: 101, pointDiff: 20, streak: 'W3', last10: '7-3', homeRecord: '13-4', awayRecord: '11-7' },
    { id: '4', team: 'NJD', teamFull: 'New Jersey Devils', conference: 'East', wins: 23, losses: 14, winPct: 62.2, pointsFor: 119, pointsAgainst: 108, pointDiff: 11, streak: 'L1', last10: '6-4', homeRecord: '12-6', awayRecord: '11-8' },
    { id: '5', team: 'CAR', teamFull: 'Carolina Hurricanes', conference: 'East', wins: 22, losses: 14, winPct: 61.1, pointsFor: 115, pointsAgainst: 102, pointDiff: 13, streak: 'W1', last10: '5-5', homeRecord: '11-7', awayRecord: '11-7' },
    { id: '6', team: 'TOR', teamFull: 'Toronto Maple Leafs', conference: 'East', wins: 22, losses: 13, winPct: 62.9, pointsFor: 118, pointsAgainst: 106, pointDiff: 12, streak: 'W2', last10: '6-4', homeRecord: '12-5', awayRecord: '10-8' },
    { id: '7', team: 'COL', teamFull: 'Colorado Avalanche', conference: 'West', wins: 24, losses: 15, winPct: 61.5, pointsFor: 135, pointsAgainst: 122, pointDiff: 13, streak: 'W4', last10: '8-2', homeRecord: '13-6', awayRecord: '11-9' },
    { id: '8', team: 'FLA', teamFull: 'Florida Panthers', conference: 'East', wins: 21, losses: 14, winPct: 60.0, pointsFor: 112, pointsAgainst: 103, pointDiff: 9, streak: 'L2', last10: '5-5', homeRecord: '10-8', awayRecord: '11-6' },
  ]
}

function getMockMLBStandings(): TeamStanding[] {
  // Offseason mock data
  return [
    { id: '1', team: 'LAD', teamFull: 'Los Angeles Dodgers', conference: 'NL', division: 'West', wins: 98, losses: 64, winPct: 60.5, pointsFor: 842, pointsAgainst: 698, pointDiff: 144, streak: '-', last10: '-', homeRecord: '52-29', awayRecord: '46-35' },
    { id: '2', team: 'NYY', teamFull: 'New York Yankees', conference: 'AL', division: 'East', wins: 94, losses: 68, winPct: 58.0, pointsFor: 828, pointsAgainst: 712, pointDiff: 116, streak: '-', last10: '-', homeRecord: '50-31', awayRecord: '44-37' },
  ]
}

function getMockNFLPlayerStats(category: string): PlayerStats[] {
  if (category === 'passing') {
    return [
      { id: '1', name: 'Lamar Jackson', team: 'BAL', position: 'QB', stats: { yards: 3955, td: 39, int: 4, rating: 119.6 }, rank: 1 },
      { id: '2', name: 'Joe Burrow', team: 'CIN', position: 'QB', stats: { yards: 4641, td: 43, int: 9, rating: 111.2 }, rank: 2 },
      { id: '3', name: 'Josh Allen', team: 'BUF', position: 'QB', stats: { yards: 3731, td: 28, int: 6, rating: 101.4 }, rank: 3 },
      { id: '4', name: 'Jared Goff', team: 'DET', position: 'QB', stats: { yards: 4629, td: 37, int: 12, rating: 99.8 }, rank: 4 },
      { id: '5', name: 'Patrick Mahomes', team: 'KC', position: 'QB', stats: { yards: 3928, td: 26, int: 11, rating: 93.2 }, rank: 5 },
    ]
  }
  if (category === 'rushing') {
    return [
      { id: '1', name: 'Saquon Barkley', team: 'PHI', position: 'RB', stats: { yards: 2005, td: 13, ypc: 5.8, fumbles: 2 }, rank: 1 },
      { id: '2', name: 'Derrick Henry', team: 'BAL', position: 'RB', stats: { yards: 1921, td: 16, ypc: 5.2, fumbles: 3 }, rank: 2 },
      { id: '3', name: 'Josh Jacobs', team: 'GB', position: 'RB', stats: { yards: 1329, td: 15, ypc: 4.4, fumbles: 1 }, rank: 3 },
      { id: '4', name: 'Jahmyr Gibbs', team: 'DET', position: 'RB', stats: { yards: 1412, td: 16, ypc: 5.6, fumbles: 0 }, rank: 4 },
      { id: '5', name: 'Bijan Robinson', team: 'ATL', position: 'RB', stats: { yards: 1145, td: 11, ypc: 4.8, fumbles: 2 }, rank: 5 },
    ]
  }
  if (category === 'receiving') {
    return [
      { id: '1', name: 'Ja\'Marr Chase', team: 'CIN', position: 'WR', stats: { rec: 117, yards: 1708, td: 17, ypr: 14.6 }, rank: 1 },
      { id: '2', name: 'Amon-Ra St. Brown', team: 'DET', position: 'WR', stats: { rec: 115, yards: 1263, td: 12, ypr: 11.0 }, rank: 2 },
      { id: '3', name: 'Justin Jefferson', team: 'MIN', position: 'WR', stats: { rec: 103, yards: 1479, td: 10, ypr: 14.4 }, rank: 3 },
      { id: '4', name: 'Brian Thomas Jr.', team: 'JAX', position: 'WR', stats: { rec: 87, yards: 1282, td: 10, ypr: 14.7 }, rank: 4 },
      { id: '5', name: 'Terry McLaurin', team: 'WSH', position: 'WR', stats: { rec: 82, yards: 1218, td: 13, ypr: 14.9 }, rank: 5 },
    ]
  }
  return []
}

function getMockNBAPlayerStats(category: string): PlayerStats[] {
  if (category === 'points') {
    return [
      { id: '1', name: 'Giannis Antetokounmpo', team: 'MIL', position: 'PF', stats: { ppg: 31.5, rpg: 11.8, apg: 6.2 }, rank: 1 },
      { id: '2', name: 'Shai Gilgeous-Alexander', team: 'OKC', position: 'PG', stats: { ppg: 31.1, rpg: 5.5, apg: 6.0 }, rank: 2 },
      { id: '3', name: 'Donovan Mitchell', team: 'CLE', position: 'SG', stats: { ppg: 29.4, rpg: 4.2, apg: 4.8 }, rank: 3 },
      { id: '4', name: 'Jayson Tatum', team: 'BOS', position: 'SF', stats: { ppg: 28.2, rpg: 8.1, apg: 5.5 }, rank: 4 },
      { id: '5', name: 'Kevin Durant', team: 'PHX', position: 'SF', stats: { ppg: 27.8, rpg: 6.5, apg: 4.2 }, rank: 5 },
    ]
  }
  return []
}

function getMockInjuries(sport: string): Injury[] {
  if (sport === 'nfl') {
    return [
      { id: '1', player: 'Brock Purdy', team: 'San Francisco 49ers', teamAbbr: 'SF', position: 'QB', status: 'Q', injury: 'Elbow', updated: '2026-01-03', impact: 'high' },
      { id: '2', player: 'Tua Tagovailoa', team: 'Miami Dolphins', teamAbbr: 'MIA', position: 'QB', status: 'O', injury: 'Concussion', updated: '2026-01-02', impact: 'high' },
      { id: '3', player: 'Davante Adams', team: 'New York Jets', teamAbbr: 'NYJ', position: 'WR', status: 'Q', injury: 'Hip', updated: '2026-01-03', impact: 'medium' },
      { id: '4', player: 'Jonathan Taylor', team: 'Indianapolis Colts', teamAbbr: 'IND', position: 'RB', status: 'D', injury: 'Ankle', updated: '2026-01-02', impact: 'high' },
      { id: '5', player: 'Chris Olave', team: 'New Orleans Saints', teamAbbr: 'NO', position: 'WR', status: 'IR', injury: 'Concussion', updated: '2025-12-28', impact: 'high' },
    ]
  }
  if (sport === 'nba') {
    return [
      { id: '1', player: 'Stephen Curry', team: 'Golden State Warriors', teamAbbr: 'GSW', position: 'PG', status: 'O', injury: 'Knee', updated: '2026-01-03', impact: 'high' },
      { id: '2', player: 'Luka Doncic', team: 'Dallas Mavericks', teamAbbr: 'DAL', position: 'PG', status: 'Q', injury: 'Calf', updated: '2026-01-03', impact: 'high' },
      { id: '3', player: 'Joel Embiid', team: 'Philadelphia 76ers', teamAbbr: 'PHI', position: 'C', status: 'O', injury: 'Knee Management', updated: '2026-01-02', impact: 'high' },
      { id: '4', player: 'Kawhi Leonard', team: 'Los Angeles Clippers', teamAbbr: 'LAC', position: 'SF', status: 'O', injury: 'Knee', updated: '2026-01-01', impact: 'high' },
      { id: '5', player: 'Ja Morant', team: 'Memphis Grizzlies', teamAbbr: 'MEM', position: 'PG', status: 'P', injury: 'Shoulder', updated: '2026-01-03', impact: 'medium' },
    ]
  }
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
    default: return getMockInjuries(sport)
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
