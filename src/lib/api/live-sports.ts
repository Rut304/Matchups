// =============================================================================
// LIVE SPORTS API SERVICE
// Fetches real-time data from free/paid APIs
// =============================================================================

import { config, isConfigured } from '../config'

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

export interface LiveGame {
  id: string
  sport: string
  status: 'scheduled' | 'in_progress' | 'final' | 'postponed' | 'delayed'
  startTime: string
  venue: string
  broadcast?: string
  homeTeam: {
    id: string
    name: string
    abbreviation: string
    logo?: string
    score?: number
    record?: string
    seed?: number
  }
  awayTeam: {
    id: string
    name: string
    abbreviation: string
    logo?: string
    score?: number
    record?: string
    seed?: number
  }
  period?: string
  clock?: string
  odds?: GameOdds
  weather?: Weather
}

export interface GameOdds {
  spread: { home: number; away: number; homeOdds: number; awayOdds: number }
  total: { line: number; overOdds: number; underOdds: number }
  moneyline: { home: number; away: number }
  source: string
  lastUpdate: string
}

export interface Weather {
  temp: number
  condition: string
  wind: string
  dome: boolean
}

export interface LiveTeam {
  id: string
  name: string
  city: string
  abbreviation: string
  conference: string
  division: string
  logo?: string
  color?: string
  venue: string
  record: TeamRecord
}

export interface TeamRecord {
  wins: number
  losses: number
  ties?: number
  otLosses?: number
  pct: number
  home: string
  away: string
  conference?: string
  division?: string
  streak: string
  last10?: string
}

export interface LivePlayer {
  id: string
  firstName: string
  lastName: string
  fullName: string
  team: string
  teamId: string
  position: string
  number?: string
  height?: string
  weight?: string
  age?: number
  experience?: string
  college?: string
  imageUrl?: string
  status: 'active' | 'injured' | 'suspended' | 'practice-squad'
  injury?: {
    status: string
    type: string
    detail?: string
  }
}

export interface PlayerStats {
  [key: string]: number | string
}

export interface Standing {
  rank: number
  team: LiveTeam
  gamesPlayed: number
  gamesBack: number
  clinched?: string
  eliminated?: boolean
}

// =============================================================================
// ESPN FREE API
// =============================================================================

const ESPN_BASE = 'https://site.api.espn.com/apis/site/v2/sports'

const SPORT_MAP: Record<string, string> = {
  nfl: 'football/nfl',
  nba: 'basketball/nba',
  nhl: 'hockey/nhl',
  mlb: 'baseball/mlb',
  ncaaf: 'football/college-football',
  ncaab: 'basketball/mens-college-basketball',
  ncaaw: 'basketball/womens-college-basketball',
  wncaab: 'basketball/womens-college-basketball',
  wnba: 'basketball/wnba',
  mls: 'soccer/usa.1',
}

async function espnFetch<T>(endpoint: string): Promise<T | null> {
  try {
    const res = await fetch(`${ESPN_BASE}/${endpoint}`, {
      next: { revalidate: 60 }, // ISR: refresh every 60 seconds
      headers: { 'Accept': 'application/json' },
    })
    if (!res.ok) {
      console.error(`ESPN API ${res.status}: ${endpoint}`)
      return null
    }
    return res.json()
  } catch (err) {
    console.error(`ESPN API error: ${endpoint}`, err)
    return null
  }
}

export async function getESPNGames(sport: string, date?: string): Promise<LiveGame[]> {
  const sportPath = SPORT_MAP[sport.toLowerCase()]
  if (!sportPath) return []
  
  let endpoint = `${sportPath}/scoreboard`
  if (date) endpoint += `?dates=${date.replace(/-/g, '')}`
  
  const data = await espnFetch<any>(endpoint)
  if (!data?.events) return []
  
  return data.events.map((event: any): LiveGame => {
    const comp = event.competitions[0]
    const home = comp.competitors.find((c: any) => c.homeAway === 'home')
    const away = comp.competitors.find((c: any) => c.homeAway === 'away')
    
    // Extract odds if available
    let odds: GameOdds | undefined
    if (comp.odds?.length > 0) {
      const o = comp.odds[0]
      odds = {
        spread: {
          home: o.spread || 0,
          away: -(o.spread || 0),
          homeOdds: -110,
          awayOdds: -110,
        },
        total: {
          line: o.overUnder || 0,
          overOdds: -110,
          underOdds: -110,
        },
        moneyline: {
          home: o.homeTeamOdds?.moneyLine || 0,
          away: o.awayTeamOdds?.moneyLine || 0,
        },
        source: o.provider?.name || 'ESPN',
        lastUpdate: new Date().toISOString(),
      }
    }
    
    return {
      id: event.id,
      sport: sport.toUpperCase(),
      status: mapESPNStatus(event.status?.type?.name),
      startTime: event.date,
      venue: comp.venue?.fullName || '',
      broadcast: comp.broadcasts?.[0]?.names?.[0],
      homeTeam: {
        id: home.team.id,
        name: home.team.name,
        abbreviation: home.team.abbreviation,
        logo: home.team.logo,
        score: parseInt(home.score) || undefined,
        record: home.records?.[0]?.summary,
        seed: home.curatedRank?.current,
      },
      awayTeam: {
        id: away.team.id,
        name: away.team.name,
        abbreviation: away.team.abbreviation,
        logo: away.team.logo,
        score: parseInt(away.score) || undefined,
        record: away.records?.[0]?.summary,
        seed: away.curatedRank?.current,
      },
      period: event.status?.period?.toString(),
      clock: event.status?.displayClock,
      odds,
    }
  })
}

function mapESPNStatus(status?: string): LiveGame['status'] {
  if (!status) return 'scheduled'
  if (status === 'STATUS_FINAL' || status === 'STATUS_FINAL_OVERTIME') return 'final'
  if (status === 'STATUS_IN_PROGRESS' || status === 'STATUS_HALFTIME') return 'in_progress'
  if (status === 'STATUS_POSTPONED') return 'postponed'
  if (status === 'STATUS_DELAYED') return 'delayed'
  return 'scheduled'
}

export async function getESPNTeams(sport: string): Promise<LiveTeam[]> {
  const sportPath = SPORT_MAP[sport.toLowerCase()]
  if (!sportPath) return []
  
  const data = await espnFetch<any>(`${sportPath}/teams?limit=100`)
  if (!data?.sports?.[0]?.leagues?.[0]?.teams) return []
  
  return data.sports[0].leagues[0].teams.map((t: any): LiveTeam => ({
    id: t.team.id,
    name: t.team.name,
    city: t.team.location || '',
    abbreviation: t.team.abbreviation,
    conference: t.team.conference?.name || '',
    division: t.team.division?.name || '',
    logo: t.team.logos?.[0]?.href,
    color: t.team.color,
    venue: t.team.venue?.fullName || '',
    record: {
      wins: 0, losses: 0, pct: 0,
      home: '0-0', away: '0-0', streak: '',
    },
  }))
}

export async function getESPNNews(sport: string, limit = 10): Promise<any[]> {
  const sportPath = SPORT_MAP[sport.toLowerCase()]
  if (!sportPath) return []
  
  const data = await espnFetch<any>(`${sportPath}/news?limit=${limit}`)
  return data?.articles || []
}

// =============================================================================
// NHL OFFICIAL API (FREE)
// =============================================================================

const NHL_BASE = 'https://api-web.nhle.com/v1'

async function nhlFetch<T>(endpoint: string): Promise<T | null> {
  try {
    const res = await fetch(`${NHL_BASE}${endpoint}`, {
      next: { revalidate: 60 },
    })
    if (!res.ok) return null
    return res.json()
  } catch (err) {
    console.error(`NHL API error: ${endpoint}`, err)
    return null
  }
}

export async function getNHLGames(date?: string): Promise<LiveGame[]> {
  const targetDate = date || new Date().toISOString().split('T')[0]
  const data = await nhlFetch<any>(`/schedule/${targetDate}`)
  if (!data?.gameWeek?.[0]?.games) return []
  
  return data.gameWeek[0].games.map((g: any): LiveGame => ({
    id: g.id.toString(),
    sport: 'NHL',
    status: mapNHLStatus(g.gameState),
    startTime: g.startTimeUTC,
    venue: g.venue?.default || '',
    broadcast: g.tvBroadcasts?.[0]?.network,
    homeTeam: {
      id: g.homeTeam.id.toString(),
      name: g.homeTeam.placeName?.default || g.homeTeam.commonName?.default,
      abbreviation: g.homeTeam.abbrev,
      logo: g.homeTeam.logo,
      score: g.homeTeam.score,
      record: g.homeTeam.record,
    },
    awayTeam: {
      id: g.awayTeam.id.toString(),
      name: g.awayTeam.placeName?.default || g.awayTeam.commonName?.default,
      abbreviation: g.awayTeam.abbrev,
      logo: g.awayTeam.logo,
      score: g.awayTeam.score,
      record: g.awayTeam.record,
    },
    period: g.period?.toString(),
    clock: g.clock?.timeRemaining,
  }))
}

function mapNHLStatus(state?: string): LiveGame['status'] {
  if (!state) return 'scheduled'
  if (state === 'LIVE' || state === 'CRIT') return 'in_progress'
  if (state === 'OFF' || state === 'FINAL') return 'final'
  if (state === 'PPD') return 'postponed'
  return 'scheduled'
}

export async function getNHLStandings(): Promise<Standing[]> {
  const data = await nhlFetch<any>('/standings/now')
  if (!data?.standings) return []
  
  return data.standings.map((t: any, idx: number): Standing => ({
    rank: idx + 1,
    team: {
      id: t.teamAbbrev?.default || '',
      name: t.teamName?.default || '',
      city: t.placeName?.default || '',
      abbreviation: t.teamAbbrev?.default || '',
      conference: t.conferenceName || '',
      division: t.divisionName || '',
      logo: t.teamLogo,
      venue: '',
      record: {
        wins: t.wins || 0,
        losses: t.losses || 0,
        otLosses: t.otLosses || 0,
        pct: t.pointPctg || 0,
        home: `${t.homeWins}-${t.homeLosses}-${t.homeOtLosses}`,
        away: `${t.roadWins}-${t.roadLosses}-${t.roadOtLosses}`,
        streak: t.streakCode || '',
        last10: `${t.l10Wins}-${t.l10Losses}-${t.l10OtLosses}`,
      },
    },
    gamesPlayed: t.gamesPlayed || 0,
    gamesBack: t.gamesBack || 0,
    clinched: t.clinchIndicator,
  }))
}

export async function getNHLPlayer(playerId: string): Promise<LivePlayer | null> {
  const data = await nhlFetch<any>(`/player/${playerId}/landing`)
  if (!data) return null
  
  return {
    id: playerId,
    firstName: data.firstName?.default || '',
    lastName: data.lastName?.default || '',
    fullName: `${data.firstName?.default} ${data.lastName?.default}`,
    team: data.currentTeamAbbrev || '',
    teamId: data.currentTeamId?.toString() || '',
    position: data.position || '',
    number: data.sweaterNumber?.toString(),
    height: data.heightInCentimeters ? `${Math.floor(data.heightInCentimeters / 2.54 / 12)}'${Math.round(data.heightInCentimeters / 2.54 % 12)}"` : undefined,
    weight: data.weightInPounds?.toString(),
    age: data.age,
    imageUrl: data.headshot,
    status: 'active',
  }
}

// =============================================================================
// MLB OFFICIAL API (FREE)
// =============================================================================

const MLB_BASE = 'https://statsapi.mlb.com/api/v1'

async function mlbFetch<T>(endpoint: string): Promise<T | null> {
  try {
    const res = await fetch(`${MLB_BASE}${endpoint}`, {
      next: { revalidate: 60 },
    })
    if (!res.ok) return null
    return res.json()
  } catch (err) {
    console.error(`MLB API error: ${endpoint}`, err)
    return null
  }
}

export async function getMLBGames(date?: string): Promise<LiveGame[]> {
  const targetDate = date || new Date().toISOString().split('T')[0]
  const data = await mlbFetch<any>(`/schedule?sportId=1&date=${targetDate}`)
  if (!data?.dates?.[0]?.games) return []
  
  return data.dates[0].games.map((g: any): LiveGame => ({
    id: g.gamePk.toString(),
    sport: 'MLB',
    status: mapMLBStatus(g.status?.abstractGameState),
    startTime: g.gameDate,
    venue: g.venue?.name || '',
    broadcast: g.broadcasts?.[0]?.name,
    homeTeam: {
      id: g.teams.home.team.id.toString(),
      name: g.teams.home.team.name,
      abbreviation: g.teams.home.team.abbreviation || g.teams.home.team.name.substring(0, 3).toUpperCase(),
      score: g.teams.home.score,
      record: g.teams.home.leagueRecord ? `${g.teams.home.leagueRecord.wins}-${g.teams.home.leagueRecord.losses}` : undefined,
    },
    awayTeam: {
      id: g.teams.away.team.id.toString(),
      name: g.teams.away.team.name,
      abbreviation: g.teams.away.team.abbreviation || g.teams.away.team.name.substring(0, 3).toUpperCase(),
      score: g.teams.away.score,
      record: g.teams.away.leagueRecord ? `${g.teams.away.leagueRecord.wins}-${g.teams.away.leagueRecord.losses}` : undefined,
    },
    period: g.linescore?.currentInning?.toString(),
    clock: g.linescore?.isTopInning ? 'Top' : 'Bot',
  }))
}

function mapMLBStatus(state?: string): LiveGame['status'] {
  if (!state) return 'scheduled'
  if (state === 'Live' || state === 'In Progress') return 'in_progress'
  if (state === 'Final') return 'final'
  if (state === 'Postponed') return 'postponed'
  return 'scheduled'
}

export async function getMLBStandings(): Promise<Standing[]> {
  const data = await mlbFetch<any>('/standings?leagueId=103,104&season=2025')
  if (!data?.records) return []
  
  const standings: Standing[] = []
  data.records.forEach((div: any) => {
    div.teamRecords?.forEach((t: any, idx: number) => {
      standings.push({
        rank: idx + 1,
        team: {
          id: t.team.id.toString(),
          name: t.team.name,
          city: t.team.locationName || '',
          abbreviation: t.team.abbreviation || '',
          conference: div.league?.name || '',
          division: div.division?.name || '',
          venue: '',
          record: {
            wins: t.wins || 0,
            losses: t.losses || 0,
            pct: parseFloat(t.winningPercentage) || 0,
            home: `${t.records?.splitRecords?.find((r: any) => r.type === 'home')?.wins || 0}-${t.records?.splitRecords?.find((r: any) => r.type === 'home')?.losses || 0}`,
            away: `${t.records?.splitRecords?.find((r: any) => r.type === 'away')?.wins || 0}-${t.records?.splitRecords?.find((r: any) => r.type === 'away')?.losses || 0}`,
            streak: t.streak?.streakCode || '',
            last10: `${t.records?.splitRecords?.find((r: any) => r.type === 'lastTen')?.wins || 0}-${t.records?.splitRecords?.find((r: any) => r.type === 'lastTen')?.losses || 0}`,
          },
        },
        gamesPlayed: t.gamesPlayed || 0,
        gamesBack: parseFloat(t.gamesBack) || 0,
        clinched: t.clinched ? 'y' : undefined,
        eliminated: t.eliminationNumber === '-',
      })
    })
  })
  
  return standings
}

export async function getMLBTeamRoster(teamId: string): Promise<LivePlayer[]> {
  const data = await mlbFetch<any>(`/teams/${teamId}/roster?rosterType=active`)
  if (!data?.roster) return []
  
  return data.roster.map((p: any): LivePlayer => ({
    id: p.person.id.toString(),
    firstName: p.person.firstName || '',
    lastName: p.person.lastName || '',
    fullName: p.person.fullName || `${p.person.firstName} ${p.person.lastName}`,
    team: '',
    teamId: teamId,
    position: p.position?.abbreviation || '',
    number: p.jerseyNumber,
    status: p.status?.code === 'A' ? 'active' : 'injured',
  }))
}

// =============================================================================
// BALL DON'T LIE API (NBA - Free Tier)
// =============================================================================

const BDL_BASE = 'https://www.balldontlie.io/api/v1'

async function bdlFetch<T>(endpoint: string): Promise<T | null> {
  try {
    const res = await fetch(`${BDL_BASE}${endpoint}`, {
      next: { revalidate: 300 }, // 5 min cache (free tier rate limits)
    })
    if (!res.ok) return null
    return res.json()
  } catch (err) {
    console.error(`Ball Dont Lie API error: ${endpoint}`, err)
    return null
  }
}

export async function getNBAPlayers(search?: string, page = 1): Promise<{ players: LivePlayer[], meta: any }> {
  const endpoint = search 
    ? `/players?search=${encodeURIComponent(search)}&per_page=25&page=${page}`
    : `/players?per_page=100&page=${page}`
  
  const data = await bdlFetch<any>(endpoint)
  if (!data?.data) return { players: [], meta: {} }
  
  return {
    players: data.data.map((p: any): LivePlayer => ({
      id: p.id.toString(),
      firstName: p.first_name,
      lastName: p.last_name,
      fullName: `${p.first_name} ${p.last_name}`,
      team: p.team?.full_name || '',
      teamId: p.team?.id?.toString() || '',
      position: p.position || '',
      height: p.height_feet && p.height_inches ? `${p.height_feet}'${p.height_inches}"` : undefined,
      weight: p.weight_pounds?.toString(),
      status: 'active',
    })),
    meta: data.meta,
  }
}

export async function getNBAPlayerSeasonAverages(playerId: string, season = 2025): Promise<PlayerStats | null> {
  const data = await bdlFetch<any>(`/season_averages?season=${season}&player_ids[]=${playerId}`)
  if (!data?.data?.[0]) return null
  
  const stats = data.data[0]
  return {
    gamesPlayed: stats.games_played,
    pts: stats.pts,
    reb: stats.reb,
    ast: stats.ast,
    stl: stats.stl,
    blk: stats.blk,
    turnover: stats.turnover,
    pf: stats.pf,
    fgm: stats.fgm,
    fga: stats.fga,
    fg_pct: stats.fg_pct,
    fg3m: stats.fg3m,
    fg3a: stats.fg3a,
    fg3_pct: stats.fg3_pct,
    ftm: stats.ftm,
    fta: stats.fta,
    ft_pct: stats.ft_pct,
    oreb: stats.oreb,
    dreb: stats.dreb,
    min: stats.min,
  }
}

// =============================================================================
// THE ODDS API (Paid - 500 free requests/month)
// =============================================================================

const ODDS_SPORTS: Record<string, string> = {
  nfl: 'americanfootball_nfl',
  nba: 'basketball_nba',
  nhl: 'icehockey_nhl',
  mlb: 'baseball_mlb',
  ncaaf: 'americanfootball_ncaaf',
  ncaab: 'basketball_ncaab',
}

async function oddsFetch<T>(endpoint: string): Promise<T | null> {
  if (!isConfigured.theOddsApi()) {
    console.log('The Odds API key not configured')
    return null
  }
  
  try {
    const url = `${config.theOddsApi.baseUrl}${endpoint}`
    const separator = endpoint.includes('?') ? '&' : '?'
    const res = await fetch(`${url}${separator}apiKey=${config.theOddsApi.key}`, {
      next: { revalidate: 300 },
    })
    if (!res.ok) return null
    return res.json()
  } catch (err) {
    console.error(`Odds API error: ${endpoint}`, err)
    return null
  }
}

export async function getLiveOdds(sport: string): Promise<GameOdds[]> {
  const sportKey = ODDS_SPORTS[sport.toLowerCase()]
  if (!sportKey) return []
  
  const data = await oddsFetch<any[]>(`/sports/${sportKey}/odds?regions=us&markets=spreads,totals,h2h&oddsFormat=american`)
  if (!data) return []
  
  return data.map((game): GameOdds => {
    const bookmaker = game.bookmakers?.[0]
    const spreads = bookmaker?.markets?.find((m: any) => m.key === 'spreads')
    const totals = bookmaker?.markets?.find((m: any) => m.key === 'totals')
    const h2h = bookmaker?.markets?.find((m: any) => m.key === 'h2h')
    
    return {
      spread: {
        home: spreads?.outcomes?.[0]?.point || 0,
        away: spreads?.outcomes?.[1]?.point || 0,
        homeOdds: spreads?.outcomes?.[0]?.price || -110,
        awayOdds: spreads?.outcomes?.[1]?.price || -110,
      },
      total: {
        line: totals?.outcomes?.[0]?.point || 0,
        overOdds: totals?.outcomes?.[0]?.price || -110,
        underOdds: totals?.outcomes?.[1]?.price || -110,
      },
      moneyline: {
        home: h2h?.outcomes?.[0]?.price || 0,
        away: h2h?.outcomes?.[1]?.price || 0,
      },
      source: bookmaker?.title || 'Unknown',
      lastUpdate: bookmaker?.last_update || new Date().toISOString(),
    }
  })
}

// =============================================================================
// UNIFIED API - Single entry point for all sports data
// =============================================================================

export type SupportedSport = 'nfl' | 'nba' | 'nhl' | 'mlb' | 'ncaaf' | 'ncaab' | 'ncaaw' | 'wncaab' | 'wnba'

export async function getGames(sport: SupportedSport, date?: string): Promise<LiveGame[]> {
  const sportLower = sport.toLowerCase()
  
  // Use dedicated APIs for NHL/MLB, ESPN for everything else
  switch (sportLower) {
    case 'nhl':
      const nhlGames = await getNHLGames(date)
      // Enrich with ESPN data if available
      const espnNhl = await getESPNGames('nhl', date)
      return nhlGames.length > 0 ? nhlGames : espnNhl
    
    case 'mlb':
      const mlbGames = await getMLBGames(date)
      const espnMlb = await getESPNGames('mlb', date)
      return mlbGames.length > 0 ? mlbGames : espnMlb
    
    default:
      return getESPNGames(sportLower, date)
  }
}

export async function getTeams(sport: SupportedSport): Promise<LiveTeam[]> {
  return getESPNTeams(sport)
}

export async function getAllStandings(sport: SupportedSport): Promise<Standing[]> {
  const sportLower = sport.toLowerCase()
  
  switch (sportLower) {
    case 'nhl':
      return getNHLStandings()
    case 'mlb':
      return getMLBStandings()
    default:
      // ESPN doesn't have a clean standings API, use dedicated APIs
      return []
  }
}

export async function getNews(sport: SupportedSport, limit = 10): Promise<any[]> {
  return getESPNNews(sport, limit)
}

// =============================================================================
// RANKINGS (NCAA only)
// =============================================================================

export interface RankedTeam {
  rank: number
  team: string
  abbreviation?: string
  record: string
  conference: string
  change: number // +/- from previous week
  logo?: string
}

export async function getRankings(sport: 'ncaaf' | 'ncaab'): Promise<RankedTeam[]> {
  const sportPath = sport === 'ncaaf' 
    ? 'football/college-football'
    : 'basketball/mens-college-basketball'
  
  try {
    const res = await fetch(
      `https://site.api.espn.com/apis/site/v2/sports/${sportPath}/rankings`,
      { next: { revalidate: 3600 } } // Cache for 1 hour
    )
    
    if (!res.ok) {
      console.error(`Rankings API error: ${res.status}`)
      return []
    }
    
    const data = await res.json()
    
    // ESPN returns multiple rankings (AP, Coaches, CFP)
    // We'll use the first poll which is typically AP for regular season
    const poll = data.rankings?.[0]
    if (!poll?.ranks) return []
    
    return poll.ranks.slice(0, 25).map((entry: any) => {
      const t = entry.team || {}
      // ESPN rankings API: team has location, name, nickname, abbreviation, logos[], logo
      const teamName = t.location 
        ? `${t.location}${t.name ? ' ' + t.name : ''}`
        : t.nickname || t.abbreviation || 'Unknown'
      return {
        rank: entry.current,
        team: teamName,
        abbreviation: t.abbreviation,
        record: entry.recordSummary || '0-0',
        conference: t.conferenceId || '',
        change: entry.previous ? entry.previous - entry.current : 0,
        logo: t.logo || t.logos?.[0]?.href,
      }
    })
  } catch (error) {
    console.error('Failed to fetch rankings:', error)
    return []
  }
}

// =============================================================================
// AGGREGATE DASHBOARD
// =============================================================================

export interface SportsDashboard {
  sport: string
  games: LiveGame[]
  standings: Standing[]
  news: any[]
  lastUpdated: string
}

export async function getSportsDashboard(sport: SupportedSport): Promise<SportsDashboard> {
  const [games, standings, news] = await Promise.all([
    getGames(sport),
    getAllStandings(sport),
    getNews(sport, 5),
  ])
  
  return {
    sport: sport.toUpperCase(),
    games,
    standings,
    news,
    lastUpdated: new Date().toISOString(),
  }
}

export async function getTodaysGames(): Promise<Record<string, LiveGame[]>> {
  const sports: SupportedSport[] = ['nfl', 'nba', 'nhl', 'mlb']
  const results = await Promise.all(sports.map(async (sport) => ({
    sport,
    games: await getGames(sport),
  })))
  
  return Object.fromEntries(results.map(r => [r.sport, r.games]))
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

export function isGameLive(game: LiveGame): boolean {
  return game.status === 'in_progress'
}

export function isGameFinal(game: LiveGame): boolean {
  return game.status === 'final'
}

export function formatSpread(spread: number): string {
  if (spread === 0) return 'PK'
  return spread > 0 ? `+${spread}` : spread.toString()
}

export function formatMoneyline(ml: number): string {
  return ml > 0 ? `+${ml}` : ml.toString()
}

export function formatTotal(total: number): string {
  return `O/U ${total}`
}
