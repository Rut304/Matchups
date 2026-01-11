/**
 * API-Sports Service
 * https://api-sports.io/documentation/nfl/v1
 * 
 * Provides: Games, Teams, Players, Standings, Injuries, Odds, Player Statistics
 * Supports: NFL, NBA, NHL, MLB (separate API endpoints for each)
 * 
 * FREE: 100 requests/day
 * PRO: Unlimited requests (~$24/mo)
 * 
 * Historical data available back to 2010 for most sports
 */

const API_SPORTS_KEY = process.env.API_SPORTS_KEY || ''

// API base URLs for each sport
const API_URLS = {
  NFL: 'https://v1.american-football.api-sports.io',
  NBA: 'https://v1.basketball.api-sports.io',
  NHL: 'https://v1.hockey.api-sports.io',
  MLB: 'https://v1.baseball.api-sports.io',
} as const

export type APISportKey = keyof typeof API_URLS

// League IDs
const LEAGUE_IDS = {
  NFL: 1,   // NFL
  NCAAF: 2, // NCAA Football
  NBA: 12,  // NBA
  NHL: 57,  // NHL
  MLB: 1,   // MLB
} as const

// ===========================================
// TYPES
// ===========================================

export interface APISportsGame {
  game: {
    id: number
    stage: string
    week: string
    date: {
      date: string
      time: string
      timestamp: number
      timezone: string
    }
    venue: {
      name: string
      city: string
    }
    status: {
      short: string // 'NS', 'Q1', 'Q2', 'Q3', 'Q4', 'HT', 'FT', 'OT', etc.
      long: string
      timer: string | null
    }
  }
  league: {
    id: number
    name: string
    season: number
    logo: string
  }
  country: {
    id: number
    name: string
    code: string
    flag: string
  }
  teams: {
    home: APISportsTeam
    away: APISportsTeam
  }
  scores: {
    home: {
      quarter_1: number | null
      quarter_2: number | null
      quarter_3: number | null
      quarter_4: number | null
      overtime: number | null
      total: number | null
    }
    away: {
      quarter_1: number | null
      quarter_2: number | null
      quarter_3: number | null
      quarter_4: number | null
      overtime: number | null
      total: number | null
    }
  }
}

export interface APISportsTeam {
  id: number
  name: string
  code: string
  logo: string
}

export interface APISportsTeamFull extends APISportsTeam {
  country: {
    id: number
    name: string
    code: string
    flag: string
  }
  founded: number
  national: boolean
  coach: {
    id: number
    name: string
  }
  owner: string
  stadium: string
  capacity: number
}

export interface APISportsPlayer {
  id: number
  name: string
  age: number | null
  height: string | null
  weight: string | null
  college: string | null
  group: string // position group
  position: string
  number: number | null
  salary: string | null
  experience: number | null
  image: string | null
}

export interface APISportsInjury {
  player: {
    id: number
    name: string
  }
  team: {
    id: number
    name: string
    logo: string
  }
  type: string // 'Knee', 'Ankle', etc.
  status: string // 'Out', 'Questionable', etc.
  date: string
  description: string
}

export interface APISportsStanding {
  position: number
  stage: string
  group: {
    name: string
    conference: string
    division: string
  }
  team: APISportsTeam
  league: {
    id: number
    name: string
    season: string
    logo: string
  }
  country: {
    id: number
    name: string
    code: string
    flag: string
  }
  games: {
    played: number
    win: { total: number; percentage: string }
    lose: { total: number; percentage: string }
  }
  points: {
    for: number
    against: number
  }
  records: {
    home: string
    road: string
    conference: string
    division: string
  }
  streak: string
  net_points: number
}

export interface APISportsOdds {
  game: {
    id: number
  }
  bookmaker: {
    id: number
    name: string
  }
  bets: Array<{
    id: number
    name: string // 'Home/Away', 'Handicap', 'Over/Under'
    values: Array<{
      value: string
      odd: string
    }>
  }>
  update: string
}

export interface APISportsPlayerStats {
  player: {
    id: number
    name: string
  }
  team: APISportsTeam
  statistics: Array<{
    group: string
    data: Record<string, number | string | null>
  }>
}

export interface APISportsEvent {
  type: string
  time: string
  team: {
    id: number
    name: string
    logo: string
  }
  player: {
    id: number
    name: string
  } | null
  comment: string
}

interface APISportsResponse<T> {
  get: string
  parameters: Record<string, string>
  errors: string[] | Record<string, string>
  results: number
  response: T
}

// ===========================================
// API FUNCTIONS
// ===========================================

async function apiRequest<T>(
  sport: APISportKey,
  endpoint: string,
  params: Record<string, string | number> = {}
): Promise<T[]> {
  if (!API_SPORTS_KEY) {
    console.warn('API_SPORTS_KEY not configured')
    return []
  }

  const baseUrl = API_URLS[sport]
  const url = new URL(`${baseUrl}/${endpoint}`)
  
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.append(key, String(value))
  })

  try {
    const response = await fetch(url.toString(), {
      headers: {
        'x-apisports-key': API_SPORTS_KEY,
      },
      next: { revalidate: 300 }, // Cache for 5 minutes
    })

    if (!response.ok) {
      throw new Error(`API-Sports error: ${response.status}`)
    }

    const data: APISportsResponse<T[]> = await response.json()
    
    // Log remaining requests for monitoring
    const remaining = response.headers.get('x-ratelimit-requests-remaining')
    const limit = response.headers.get('x-ratelimit-requests-limit')
    if (remaining && limit) {
      console.log(`API-Sports: ${remaining}/${limit} requests remaining`)
    }

    return data.response || []
  } catch (error) {
    console.error(`API-Sports ${endpoint} error:`, error)
    return []
  }
}

/**
 * Get API status and remaining quota
 */
export async function getStatus(sport: APISportKey = 'NFL'): Promise<{
  account: { email: string }
  subscription: { plan: string; active: boolean }
  requests: { current: number; limit_day: number }
} | null> {
  const results = await apiRequest<{
    account: { email: string }
    subscription: { plan: string; active: boolean }
    requests: { current: number; limit_day: number }
  }>(sport, 'status')
  return results[0] || null
}

/**
 * Get available seasons
 */
export async function getSeasons(sport: APISportKey): Promise<number[]> {
  return apiRequest<number>(sport, 'seasons')
}

/**
 * Get leagues
 */
export async function getLeagues(sport: APISportKey, params?: {
  id?: number
  season?: number
  current?: boolean
}): Promise<unknown[]> {
  const queryParams: Record<string, string | number> = {}
  if (params?.id) queryParams.id = params.id
  if (params?.season) queryParams.season = params.season
  if (params?.current !== undefined) queryParams.current = params.current ? 'true' : 'false'
  
  return apiRequest(sport, 'leagues', queryParams)
}

/**
 * Get games/matchups
 */
export async function getGames(sport: APISportKey, params: {
  id?: number
  date?: string // YYYY-MM-DD
  league?: number
  season?: number
  team?: number
  live?: boolean
  h2h?: string // "team1Id-team2Id"
}): Promise<APISportsGame[]> {
  const queryParams: Record<string, string | number> = {}
  
  if (params.id) queryParams.id = params.id
  if (params.date) queryParams.date = params.date
  if (params.league) queryParams.league = params.league
  if (params.season) queryParams.season = params.season
  if (params.team) queryParams.team = params.team
  if (params.live) queryParams.live = 'all'
  if (params.h2h) queryParams.h2h = params.h2h

  return apiRequest<APISportsGame>(sport, 'games', queryParams)
}

/**
 * Get live games
 */
export async function getLiveGames(sport: APISportKey): Promise<APISportsGame[]> {
  return getGames(sport, { live: true })
}

/**
 * Get games for a specific date
 */
export async function getGamesByDate(sport: APISportKey, date: string, league?: number): Promise<APISportsGame[]> {
  return getGames(sport, { date, league: league || LEAGUE_IDS[sport] })
}

/**
 * Get teams
 */
export async function getTeams(sport: APISportKey, params?: {
  id?: number
  league?: number
  season?: number
  name?: string
  search?: string
}): Promise<APISportsTeamFull[]> {
  const queryParams: Record<string, string | number> = {}
  
  if (params?.id) queryParams.id = params.id
  if (params?.league) queryParams.league = params.league
  if (params?.season) queryParams.season = params.season
  if (params?.name) queryParams.name = params.name
  if (params?.search) queryParams.search = params.search

  return apiRequest<APISportsTeamFull>(sport, 'teams', queryParams)
}

/**
 * Get all teams for a league
 */
export async function getAllTeams(sport: APISportKey, season?: number): Promise<APISportsTeamFull[]> {
  return getTeams(sport, { 
    league: LEAGUE_IDS[sport], 
    season: season || new Date().getFullYear() 
  })
}

/**
 * Get players
 */
export async function getPlayers(sport: APISportKey, params: {
  id?: number
  team?: number
  season?: number
  name?: string
  search?: string
}): Promise<APISportsPlayer[]> {
  const queryParams: Record<string, string | number> = {}
  
  if (params.id) queryParams.id = params.id
  if (params.team) queryParams.team = params.team
  if (params.season) queryParams.season = params.season
  if (params.name) queryParams.name = params.name
  if (params.search) queryParams.search = params.search

  return apiRequest<APISportsPlayer>(sport, 'players', queryParams)
}

/**
 * Get player statistics for a season
 */
export async function getPlayerStats(sport: APISportKey, params: {
  id?: number
  team?: number
  season: number
}): Promise<APISportsPlayerStats[]> {
  const queryParams: Record<string, string | number> = {
    season: params.season,
  }
  
  if (params.id) queryParams.id = params.id
  if (params.team) queryParams.team = params.team

  return apiRequest<APISportsPlayerStats>(sport, 'players/statistics', queryParams)
}

/**
 * Get injuries
 */
export async function getInjuries(sport: APISportKey, params?: {
  player?: number
  team?: number
}): Promise<APISportsInjury[]> {
  const queryParams: Record<string, string | number> = {}
  
  if (params?.player) queryParams.player = params.player
  if (params?.team) queryParams.team = params.team

  return apiRequest<APISportsInjury>(sport, 'injuries', queryParams)
}

/**
 * Get injuries for a team
 */
export async function getTeamInjuries(sport: APISportKey, teamId: number): Promise<APISportsInjury[]> {
  return getInjuries(sport, { team: teamId })
}

/**
 * Get standings
 */
export async function getStandings(sport: APISportKey, params: {
  league: number
  season: number
  team?: number
  conference?: string
  division?: string
}): Promise<APISportsStanding[]> {
  const queryParams: Record<string, string | number> = {
    league: params.league,
    season: params.season,
  }
  
  if (params.team) queryParams.team = params.team
  if (params.conference) queryParams.conference = params.conference
  if (params.division) queryParams.division = params.division

  return apiRequest<APISportsStanding>(sport, 'standings', queryParams)
}

/**
 * Get standings for current season
 */
export async function getCurrentStandings(sport: APISportKey): Promise<APISportsStanding[]> {
  return getStandings(sport, {
    league: LEAGUE_IDS[sport],
    season: new Date().getFullYear(),
  })
}

/**
 * Get odds for a game
 */
export async function getOdds(sport: APISportKey, params: {
  game: number
  bookmaker?: number
  bet?: number
}): Promise<APISportsOdds[]> {
  const queryParams: Record<string, string | number> = {
    game: params.game,
  }
  
  if (params.bookmaker) queryParams.bookmaker = params.bookmaker
  if (params.bet) queryParams.bet = params.bet

  return apiRequest<APISportsOdds>(sport, 'odds', queryParams)
}

/**
 * Get game events (scoring plays, etc.)
 */
export async function getGameEvents(sport: APISportKey, gameId: number): Promise<APISportsEvent[]> {
  return apiRequest<APISportsEvent>(sport, 'games/events', { id: gameId })
}

/**
 * Get team statistics for a game
 */
export async function getGameTeamStats(sport: APISportKey, gameId: number): Promise<unknown[]> {
  return apiRequest(sport, 'games/statistics/teams', { id: gameId })
}

/**
 * Get player statistics for a game
 */
export async function getGamePlayerStats(sport: APISportKey, gameId: number): Promise<unknown[]> {
  return apiRequest(sport, 'games/statistics/players', { id: gameId })
}

/**
 * Get head-to-head matchup history
 */
export async function getH2H(sport: APISportKey, team1Id: number, team2Id: number): Promise<APISportsGame[]> {
  return getGames(sport, { h2h: `${team1Id}-${team2Id}` })
}

/**
 * Get available bookmakers
 */
export async function getBookmakers(sport: APISportKey): Promise<Array<{ id: number; name: string }>> {
  return apiRequest<{ id: number; name: string }>(sport, 'odds/bookmakers')
}

/**
 * Get available bet types
 */
export async function getBetTypes(sport: APISportKey): Promise<Array<{ id: number; name: string }>> {
  return apiRequest<{ id: number; name: string }>(sport, 'odds/bets')
}

// ===========================================
// UTILITY FUNCTIONS
// ===========================================

/**
 * Transform API-Sports game to our standard format
 */
export function transformAPISportsGame(game: APISportsGame, sport: APISportKey) {
  const statusMap: Record<string, string> = {
    NS: 'scheduled',
    Q1: 'live',
    Q2: 'live',
    Q3: 'live',
    Q4: 'live',
    HT: 'live',
    OT: 'live',
    FT: 'final',
    AOT: 'final',
    POST: 'postponed',
    CANC: 'canceled',
  }

  return {
    id: String(game.game.id),
    externalId: `apisports_${game.game.id}`,
    sport,
    scheduledAt: new Date(game.game.date.timestamp * 1000).toISOString(),
    status: statusMap[game.game.status.short] || 'scheduled',
    period: game.game.status.short,
    venue: game.game.venue?.name,
    week: game.game.week,
    season: game.league.season,
    home: {
      id: String(game.teams.home.id),
      name: game.teams.home.name,
      abbreviation: game.teams.home.code,
      logo: game.teams.home.logo,
      score: game.scores.home.total,
      quarters: {
        q1: game.scores.home.quarter_1,
        q2: game.scores.home.quarter_2,
        q3: game.scores.home.quarter_3,
        q4: game.scores.home.quarter_4,
        ot: game.scores.home.overtime,
      },
    },
    away: {
      id: String(game.teams.away.id),
      name: game.teams.away.name,
      abbreviation: game.teams.away.code,
      logo: game.teams.away.logo,
      score: game.scores.away.total,
      quarters: {
        q1: game.scores.away.quarter_1,
        q2: game.scores.away.quarter_2,
        q3: game.scores.away.quarter_3,
        q4: game.scores.away.quarter_4,
        ot: game.scores.away.overtime,
      },
    },
  }
}

/**
 * Format date for API-Sports (YYYY-MM-DD)
 */
export function formatAPISportsDate(date: Date): string {
  return date.toISOString().split('T')[0]
}

export default {
  getStatus,
  getSeasons,
  getLeagues,
  getGames,
  getLiveGames,
  getGamesByDate,
  getTeams,
  getAllTeams,
  getPlayers,
  getPlayerStats,
  getInjuries,
  getTeamInjuries,
  getStandings,
  getCurrentStandings,
  getOdds,
  getGameEvents,
  getGameTeamStats,
  getGamePlayerStats,
  getH2H,
  getBookmakers,
  getBetTypes,
  transformAPISportsGame,
  formatAPISportsDate,
  LEAGUE_IDS,
}
