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
