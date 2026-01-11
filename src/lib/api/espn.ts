/**
 * ESPN API Client
 * Free, no API key required
 * Primary source for: schedules, scores, standings, teams, player info
 */

const ESPN_BASE = 'https://site.api.espn.com/apis/site/v2/sports'

// Sport/League mappings
export const ESPN_SPORTS = {
  NFL: { sport: 'football', league: 'nfl' },
  NBA: { sport: 'basketball', league: 'nba' },
  NHL: { sport: 'hockey', league: 'nhl' },
  MLB: { sport: 'baseball', league: 'mlb' },
  NCAAF: { sport: 'football', league: 'college-football' },
  NCAAB: { sport: 'basketball', league: 'mens-college-basketball' },
  WNBA: { sport: 'basketball', league: 'wnba' },
  WNCAAB: { sport: 'basketball', league: 'womens-college-basketball' },
} as const

export type SportKey = keyof typeof ESPN_SPORTS

// Types
export interface ESPNTeam {
  id: string
  abbreviation: string
  displayName: string
  shortDisplayName: string
  name: string
  location: string
  color?: string
  alternateColor?: string
  logo?: string
  record?: string
  conferenceId?: string
}

export interface ESPNGame {
  id: string
  date: string
  name: string
  shortName: string
  status: {
    type: {
      id: string
      name: string
      state: string // 'pre' | 'in' | 'post'
      completed: boolean
    }
    period: number
    displayClock: string
  }
  competitions: Array<{
    id: string
    date: string
    venue?: {
      fullName: string
      city: string
      state: string
    }
    competitors: Array<{
      id: string
      homeAway: 'home' | 'away'
      team: ESPNTeam
      score?: string
      records?: Array<{ summary: string; type: string }>
    }>
    odds?: Array<{
      provider: { name: string }
      details: string
      overUnder: number
      spread: number
      homeTeamOdds?: { moneyLine: number }
      awayTeamOdds?: { moneyLine: number }
    }>
    broadcasts?: Array<{ names: string[] }>
    weather?: {
      temperature: number
      conditionId: string
      displayValue: string
    }
  }>
}

export interface ESPNScoreboard {
  leagues: Array<{
    id: string
    name: string
    abbreviation: string
  }>
  events: ESPNGame[]
}

export interface ESPNStanding {
  team: ESPNTeam
  stats: Array<{
    name: string
    displayValue: string
    value: number
  }>
}

// ESPN API Functions
export async function getScoreboard(sport: SportKey, date?: string): Promise<ESPNScoreboard> {
  const { sport: s, league } = ESPN_SPORTS[sport]
  let url = `${ESPN_BASE}/${s}/${league}/scoreboard`
  
  if (date) {
    url += `?dates=${date.replace(/-/g, '')}`
  }
  
  const res = await fetch(url, { next: { revalidate: 300 } }) // Cache for 5 minutes
  if (!res.ok) throw new Error(`ESPN API error: ${res.status}`)
  return res.json()
}

export async function getTeams(sport: SportKey): Promise<ESPNTeam[]> {
  const { sport: s, league } = ESPN_SPORTS[sport]
  const url = `${ESPN_BASE}/${s}/${league}/teams`
  
  const res = await fetch(url, { next: { revalidate: 3600 } }) // Cache for 1 hour
  if (!res.ok) throw new Error(`ESPN API error: ${res.status}`)
  
  const data = await res.json()
  return data.sports?.[0]?.leagues?.[0]?.teams?.map((t: { team: ESPNTeam }) => t.team) || []
}

export async function getStandings(sport: SportKey): Promise<ESPNStanding[]> {
  const { sport: s, league } = ESPN_SPORTS[sport]
  const url = `${ESPN_BASE}/${s}/${league}/standings`
  
  const res = await fetch(url, { next: { revalidate: 1800 } }) // Cache for 30 min
  if (!res.ok) throw new Error(`ESPN API error: ${res.status}`)
  
  const data = await res.json()
  const standings: ESPNStanding[] = []
  
  // ESPN returns standings grouped by conference/division
  data.children?.forEach((group: { standings?: { entries: ESPNStanding[] } }) => {
    group.standings?.entries?.forEach((entry: ESPNStanding) => {
      standings.push(entry)
    })
  })
  
  return standings
}

export async function getGameDetails(sport: SportKey, gameId: string): Promise<ESPNGame | null> {
  const { sport: s, league } = ESPN_SPORTS[sport]
  const url = `${ESPN_BASE}/${s}/${league}/summary?event=${gameId}`
  
  const res = await fetch(url, { next: { revalidate: 30 } }) // Cache for 30 sec during games
  if (!res.ok) return null
  
  const data = await res.json()
  
  // The summary endpoint returns a different structure than the scoreboard
  // Transform it to match the ESPNGame format that transformESPNGame expects
  const competition = data.header?.competitions?.[0]
  if (!competition) return null
  
  // Map competitors to include team.logo field that transformESPNGame expects
  const mappedCompetitors = competition.competitors?.map((c: {
    id: string
    homeAway: string
    team: {
      id: string
      abbreviation: string
      displayName: string
      shortDisplayName?: string
      name: string
      location: string
      color?: string
      alternateColor?: string
      logos?: Array<{ href: string }>
    }
    score?: string
    record?: Array<{ type: string; summary: string }>
  }) => ({
    ...c,
    team: {
      ...c.team,
      logo: c.team.logos?.[0]?.href,
    },
    records: c.record,
  })) || []
  
  // Determine odds source - pickcenter is an array, odds may be empty array
  const oddsArray = (data.odds && data.odds.length > 0) ? data.odds : data.pickcenter
  
  return {
    id: competition.id,
    date: competition.date,
    name: `${competition.competitors?.find((c: { homeAway: string }) => c.homeAway === 'away')?.team?.displayName || ''} at ${competition.competitors?.find((c: { homeAway: string }) => c.homeAway === 'home')?.team?.displayName || ''}`,
    shortName: `${competition.competitors?.find((c: { homeAway: string }) => c.homeAway === 'away')?.team?.abbreviation || ''} @ ${competition.competitors?.find((c: { homeAway: string }) => c.homeAway === 'home')?.team?.abbreviation || ''}`,
    status: competition.status || { type: { state: 'pre', completed: false }, period: 0, displayClock: '' },
    competitions: [{
      ...competition,
      competitors: mappedCompetitors,
      venue: data.gameInfo?.venue,
      odds: oddsArray,
      broadcasts: competition.broadcasts,
      weather: data.gameInfo?.weather,
    }],
  } as ESPNGame
}

export async function getNews(sport: SportKey, limit = 10): Promise<Array<{ headline: string; description: string; link: string; published: string }>> {
  const { sport: s, league } = ESPN_SPORTS[sport]
  const url = `${ESPN_BASE}/${s}/${league}/news?limit=${limit}`
  
  const res = await fetch(url, { next: { revalidate: 300 } }) // Cache for 5 min
  if (!res.ok) return []
  
  const data = await res.json()
  return data.articles?.map((a: { headline: string; description: string; links: { web: { href: string } }; published: string }) => ({
    headline: a.headline,
    description: a.description,
    link: a.links?.web?.href,
    published: a.published,
  })) || []
}

// Helper to transform ESPN game to our format
export function transformESPNGame(game: ESPNGame, sport: SportKey) {
  const competition = game.competitions[0]
  const homeTeam = competition.competitors.find(c => c.homeAway === 'home')
  const awayTeam = competition.competitors.find(c => c.homeAway === 'away')
  const odds = competition.odds?.[0]
  
  return {
    id: game.id,
    externalId: `espn_${game.id}`,
    sport,
    name: game.name,
    shortName: game.shortName,
    scheduledAt: game.date,
    status: mapESPNStatus(game.status.type.state, game.status.type.completed),
    period: game.status.period > 0 ? `${game.status.period}` : null,
    clock: game.status.displayClock,
    venue: competition.venue?.fullName,
    broadcast: competition.broadcasts?.[0]?.names?.join(', '),
    weather: competition.weather ? {
      temp: competition.weather.temperature,
      condition: competition.weather.displayValue,
    } : null,
    home: {
      id: homeTeam?.team.id,
      name: homeTeam?.team.displayName,
      abbreviation: homeTeam?.team.abbreviation,
      logo: homeTeam?.team.logo,
      color: homeTeam?.team.color,
      score: homeTeam?.score ? parseInt(homeTeam.score) : null,
      record: homeTeam?.records?.find(r => r.type === 'total')?.summary,
    },
    away: {
      id: awayTeam?.team.id,
      name: awayTeam?.team.displayName,
      abbreviation: awayTeam?.team.abbreviation,
      logo: awayTeam?.team.logo,
      color: awayTeam?.team.color,
      score: awayTeam?.score ? parseInt(awayTeam.score) : null,
      record: awayTeam?.records?.find(r => r.type === 'total')?.summary,
    },
    odds: odds ? {
      spread: odds.spread,
      total: odds.overUnder,
      details: odds.details,
      homeML: odds.homeTeamOdds?.moneyLine,
      awayML: odds.awayTeamOdds?.moneyLine,
    } : null,
  }
}

function mapESPNStatus(state: string, completed: boolean): string {
  if (completed) return 'final'
  if (state === 'in') return 'live'
  if (state === 'pre') return 'scheduled'
  return 'scheduled'
}

// Get all games for today across all sports
export async function getTodaysGames(): Promise<Record<SportKey, ReturnType<typeof transformESPNGame>[]>> {
  const sports: SportKey[] = ['NFL', 'NBA', 'NHL', 'MLB']
  const results: Record<string, ReturnType<typeof transformESPNGame>[]> = {}
  
  await Promise.all(
    sports.map(async (sport) => {
      try {
        const scoreboard = await getScoreboard(sport)
        results[sport] = scoreboard.events.map(g => transformESPNGame(g, sport))
      } catch {
        results[sport] = []
      }
    })
  )
  
  return results as Record<SportKey, ReturnType<typeof transformESPNGame>[]>
}

// ===========================================
// EXTENDED ESPN API - INJURIES, NEWS, ATS, PLAY-BY-PLAY
// ===========================================

const ESPN_WEB_API = 'https://site.web.api.espn.com/apis/site/v2/sports'

export interface ESPNInjury {
  athlete: {
    id: string
    displayName: string
    position: { abbreviation: string }
    headshot?: { href: string }
  }
  status: string // 'Out', 'Doubtful', 'Questionable', 'Probable', 'Day-To-Day'
  type: {
    description: string // injury type
    abbreviation: string
  }
  details?: {
    detail: string
    returnDate?: string
  }
  date: string
}

export interface ESPNTeamInjuries {
  team: ESPNTeam
  injuries: ESPNInjury[]
}

export interface ESPNArticle {
  headline: string
  description: string
  published: string
  type: string
  premium: boolean
  links: { web: { href: string } }
  images?: Array<{ url: string; caption?: string }>
  categories?: Array<{ type: string; description: string; teamId?: string; athleteId?: string }>
}

export interface ESPNOddsDetailed {
  provider: { name: string; priority: number }
  details: string
  spread: number
  overUnder: number
  homeTeamOdds: {
    favorite: boolean
    moneyLine?: number
    spreadOdds?: number
    winPercentage?: number
    averageScore?: number
    spreadRecord?: { wins: number; losses: number; pushes: number; summary: string }
  }
  awayTeamOdds: {
    favorite: boolean
    moneyLine?: number
    spreadOdds?: number
    winPercentage?: number
    averageScore?: number
    spreadRecord?: { wins: number; losses: number; pushes: number; summary: string }
  }
}

export interface ESPNPlay {
  id: string
  type: { id: string; text: string }
  text: string
  homeScore: number
  awayScore: number
  period: { number: number; displayValue: string }
  clock: { displayValue: string }
  scoringPlay: boolean
  team?: { id: string; displayName: string }
  wallclock?: string
}

export interface ESPNGameSummary {
  header: {
    id: string
    competitions: Array<{
      id: string
      date: string
      competitors: Array<{
        id: string
        homeAway: string
        team: ESPNTeam & { logos?: Array<{ href: string }> }
        score?: string
        record?: Array<{ type: string; summary: string }>
      }>
      status: { type: { state: string; completed: boolean }; period: number; displayClock: string }
    }>
  }
  boxscore?: {
    teams: Array<{
      team: ESPNTeam
      statistics: Array<{ name: string; displayValue: string; abbreviation: string; label: string }>
      homeAway: string
    }>
    players?: Array<{
      team: { id: string; displayName: string }
      statistics: Array<{
        name: string
        labels: string[]
        athletes: Array<{
          athlete: { id: string; displayName: string; position: { abbreviation: string } }
          stats: string[]
        }>
      }>
    }>
  }
  gameInfo?: {
    venue: { id: string; fullName: string; address: { city: string; state: string } }
    attendance?: number
    weather?: { temperature: number; displayValue: string }
    officials?: Array<{ fullName: string; position: { name: string } }>
  }
  pickcenter?: ESPNOddsDetailed[]
  odds?: ESPNOddsDetailed[]
  againstTheSpread?: Array<{
    team: ESPNTeam
    records: Array<{ type: string; summary: string }>
  }>
  plays?: ESPNPlay[]
  drives?: Array<{
    id: string
    description: string
    team: { displayName: string; abbreviation: string }
    start: { period: { number: number }; yardLine: number }
    end: { period: { number: number }; yardLine: number }
    plays: ESPNPlay[]
    result: string
    yards: number
    isScore: boolean
  }>
  injuries?: Array<ESPNTeamInjuries>
  news?: { header: string; articles: ESPNArticle[] }
  standings?: unknown
  leaders?: unknown
}

/**
 * Get full game summary with box scores, play-by-play, ATS records, injuries, news
 */
export async function getFullGameSummary(sport: SportKey, gameId: string): Promise<ESPNGameSummary | null> {
  const { sport: s, league } = ESPN_SPORTS[sport]
  const url = `${ESPN_WEB_API}/${s}/${league}/summary?event=${gameId}`
  
  try {
    const res = await fetch(url, { next: { revalidate: 30 } })
    if (!res.ok) return null
    return await res.json()
  } catch (error) {
    console.error('ESPN getFullGameSummary error:', error)
    return null
  }
}

/**
 * Get ATS (Against the Spread) records for teams in a game
 * ESPN includes this in pickcenter with teamrankings/consensus providers
 */
export async function getATSRecords(sport: SportKey, gameId: string): Promise<{
  home: { wins: number; losses: number; pushes: number; summary: string } | null
  away: { wins: number; losses: number; pushes: number; summary: string } | null
  homeOU?: { over: number; under: number; push: number } | null
  awayOU?: { over: number; under: number; push: number } | null
}> {
  const summary = await getFullGameSummary(sport, gameId)
  
  if (!summary) return { home: null, away: null }
  
  const oddsArray = summary.pickcenter || summary.odds || []
  // Prefer teamrankings (has spread records), then consensus
  const odds = oddsArray.find((o: ESPNOddsDetailed) => o.provider.name === 'teamrankings')
    || oddsArray.find((o: ESPNOddsDetailed) => o.provider.name === 'consensus')
    || oddsArray[0]
  
  if (!odds) return { home: null, away: null }
  
  return {
    home: odds.homeTeamOdds.spreadRecord || null,
    away: odds.awayTeamOdds.spreadRecord || null,
  }
}

/**
 * Get detailed odds including win percentages and average scores
 */
export async function getDetailedOdds(sport: SportKey, gameId: string): Promise<ESPNOddsDetailed | null> {
  const summary = await getFullGameSummary(sport, gameId)
  
  if (!summary) return null
  
  const oddsArray = summary.pickcenter || summary.odds || []
  return oddsArray.find((o: ESPNOddsDetailed) => o.provider.name === 'teamrankings')
    || oddsArray.find((o: ESPNOddsDetailed) => o.provider.name === 'consensus')
    || oddsArray.find((o: ESPNOddsDetailed) => o.provider.name === 'numberfire')
    || oddsArray[0] || null
}

/**
 * Get play-by-play data for a game
 */
export async function getPlayByPlay(sport: SportKey, gameId: string): Promise<{
  plays: ESPNPlay[]
  drives?: ESPNGameSummary['drives']
}> {
  const summary = await getFullGameSummary(sport, gameId)
  
  if (!summary) return { plays: [] }
  
  return {
    plays: summary.plays || [],
    drives: summary.drives,
  }
}

/**
 * Get injuries for teams in a game
 */
export async function getGameInjuries(sport: SportKey, gameId: string): Promise<ESPNTeamInjuries[]> {
  const summary = await getFullGameSummary(sport, gameId)
  return summary?.injuries || []
}

/**
 * Get team news
 */
export async function getTeamNews(sport: SportKey, teamId: string, limit = 10): Promise<ESPNArticle[]> {
  const { sport: s, league } = ESPN_SPORTS[sport]
  const url = `${ESPN_BASE}/${s}/${league}/teams/${teamId}/news?limit=${limit}`
  
  try {
    const res = await fetch(url, { next: { revalidate: 300 } })
    if (!res.ok) return []
    const data = await res.json()
    return data.articles || []
  } catch {
    return []
  }
}

/**
 * Get injuries for a specific team
 */
export async function getTeamInjuries(sport: SportKey, teamId: string): Promise<ESPNInjury[]> {
  const { sport: s, league } = ESPN_SPORTS[sport]
  const url = `${ESPN_BASE}/${s}/${league}/teams/${teamId}/injuries`
  
  try {
    const res = await fetch(url, { next: { revalidate: 300 } })
    if (!res.ok) return []
    const data = await res.json()
    return data.injuries || data.items || []
  } catch {
    return []
  }
}

/**
 * Get historical games for backtesting (date format: YYYYMMDD)
 */
export async function getHistoricalGames(sport: SportKey, date: string): Promise<ESPNGame[]> {
  const scoreboard = await getScoreboard(sport, date)
  return scoreboard.events || []
}

/**
 * Get games for an entire season (use sparingly - many API calls)
 */
export async function getSeasonGames(
  sport: SportKey, 
  year: number, 
  seasonType: 'preseason' | 'regular' | 'postseason' = 'regular'
): Promise<ESPNGame[]> {
  const { sport: s, league } = ESPN_SPORTS[sport]
  const typeMap = { preseason: 1, regular: 2, postseason: 3 }
  const url = `${ESPN_BASE}/${s}/${league}/scoreboard?dates=${year}&seasontype=${typeMap[seasonType]}&limit=1000`
  
  try {
    const res = await fetch(url, { next: { revalidate: 3600 } })
    if (!res.ok) return []
    const data = await res.json()
    return data.events || []
  } catch {
    return []
  }
}

/**
 * Get team schedule
 */
export async function getTeamSchedule(sport: SportKey, teamId: string, year?: number): Promise<ESPNGame[]> {
  const { sport: s, league } = ESPN_SPORTS[sport]
  let url = `${ESPN_BASE}/${s}/${league}/teams/${teamId}/schedule`
  if (year) url += `?season=${year}`
  
  try {
    const res = await fetch(url, { next: { revalidate: 3600 } })
    if (!res.ok) return []
    const data = await res.json()
    return data.events || []
  } catch {
    return []
  }
}

/**
 * Format date for ESPN API (YYYYMMDD)
 */
export function formatESPNDate(date: Date): string {
  return `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`
}

/**
 * Get current season year for a sport
 */
export function getSeasonYear(sport: SportKey, date: Date = new Date()): number {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  
  switch (sport) {
    case 'NFL':
    case 'NCAAF':
      return month >= 3 && month <= 8 ? year : year
    case 'NBA':
    case 'NHL':
    case 'NCAAB':
    case 'WNBA':
    case 'WNCAAB':
      return month >= 7 ? year : year - 1
    case 'MLB':
      return year
    default:
      return year
  }
}
