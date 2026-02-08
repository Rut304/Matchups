/**
 * UNIFIED DATA STORE
 * ==================
 * Single source of truth for ALL app data
 * 
 * This module centralizes data from:
 * - ESPN Public API (free, unlimited) - games, standings, injuries, news, ATS
 * - API-Sports (100/day free) - detailed stats, odds, player data
 * - The Odds API - betting lines from multiple books
 * - Twitter/X - social sentiment
 * - Supabase - historical data (2000-present)
 * 
 * All components should import from HERE, not directly from API clients
 */

import { createClient } from '@supabase/supabase-js'

// API clients
import * as espn from './api/espn'
import * as apiSports from './api/api-sports'
import * as twitter from './api/twitter'
import * as news from './api/news'

// =============================================================================
// CONFIGURATION
// =============================================================================

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Lazy-initialized Supabase client (avoids build-time errors)
let _supabase: ReturnType<typeof createClient> | null = null
function getSupabase() {
  if (!_supabase && supabaseUrl && supabaseAnonKey) {
    _supabase = createClient(supabaseUrl, supabaseAnonKey)
  }
  return _supabase
}

// Cache TTLs (milliseconds)
const TTL = {
  LIVE_GAMES: 30 * 1000,         // 30 seconds - very volatile during games
  STANDINGS: 5 * 60 * 1000,      // 5 minutes
  INJURIES: 2 * 60 * 1000,       // 2 minutes
  ODDS: 30 * 1000,               // 30 seconds
  NEWS: 5 * 60 * 1000,           // 5 minutes
  PLAYER_STATS: 10 * 60 * 1000,  // 10 minutes
  HISTORICAL: 60 * 60 * 1000,    // 1 hour - doesn't change often
  TRENDS: 15 * 60 * 1000,        // 15 minutes
  ATS_RECORDS: 10 * 60 * 1000,   // 10 minutes
}

// =============================================================================
// TYPES
// =============================================================================

export type Sport = 'NFL' | 'NBA' | 'NHL' | 'MLB'
export type GameStatus = 'scheduled' | 'live' | 'final' | 'postponed'

export interface UnifiedGame {
  id: string
  espnId: string
  apiSportsId?: string
  sport: Sport
  status: GameStatus
  gameTime: string
  venue: string
  broadcast: string
  homeTeam: {
    id: string
    name: string
    abbreviation: string
    record: string
    score?: number
    logo?: string
  }
  awayTeam: {
    id: string
    name: string
    abbreviation: string
    record: string
    score?: number
    logo?: string
  }
  odds?: {
    spread: number
    total: number
    homeML: number
    awayML: number
    spreadHomeOdds?: number
    spreadAwayOdds?: number
    overOdds?: number
    underOdds?: number
  }
  betting?: {
    publicSpreadHome: number
    publicSpreadAway: number
    publicOver: number
    publicUnder: number
    sharpMoney?: 'home' | 'away' | 'over' | 'under'
  }
  atsRecords?: {
    home: string
    away: string
  }
  injuries?: UnifiedInjury[]
  weather?: {
    temp: number
    wind: number
    conditions: string
    dome: boolean
  }
}

export interface UnifiedTeam {
  id: string
  name: string
  abbreviation: string
  fullName: string
  logo?: string
  sport: Sport
  conference: string
  division: string
  record: {
    wins: number
    losses: number
    ties?: number
    otLosses?: number
    winPct: number
  }
  atsRecord: {
    wins: number
    losses: number
    pushes: number
    pct: number
  }
  ouRecord: {
    over: number
    under: number
    pushes: number
    overPct: number
  }
  homeAtsRecord?: {
    wins: number
    losses: number
    pushes: number
  }
  awayAtsRecord?: {
    wins: number
    losses: number
    pushes: number
  }
  last10ATS: Array<'W' | 'L' | 'P'>
  streak: string
  pointsFor: number
  pointsAgainst: number
  pointDiff: number
}

export interface UnifiedPlayer {
  id: string
  name: string
  team: string
  teamId: string
  sport: Sport
  position: string
  number?: number
  photo?: string
  stats: Record<string, number | string>
  injury?: {
    status: string
    type: string
    description?: string
  }
}

export interface UnifiedInjury {
  id: string
  playerId: string
  player: string
  team: string
  teamId: string
  sport: Sport
  position: string
  status: 'OUT' | 'DOUBTFUL' | 'QUESTIONABLE' | 'PROBABLE' | 'DAY-TO-DAY' | 'IR'
  injury: string
  description?: string
  impact: 'high' | 'medium' | 'low'
  updatedAt: string
}

export interface UnifiedTrend {
  id: string
  sport: Sport
  title: string
  description: string
  category: 'ats' | 'ou' | 'ml' | 'situational' | 'historical'
  record: {
    wins: number
    losses: number
    pushes: number
  }
  winPct: number
  roi: number
  sampleSize: number
  timeframe: string
  lastVerified: string
  isActive: boolean
  edgeRating: number // 1-5
}

export interface HistoricalGame {
  id: string
  sport: Sport
  season: number
  seasonType: 'regular' | 'postseason' | 'preseason'
  gameDate: string
  homeTeam: string
  awayTeam: string
  homeTeamId: string
  awayTeamId: string
  homeScore: number
  awayScore: number
  spread?: number
  total?: number
  spreadResult?: 'home' | 'away' | 'push'
  totalResult?: 'over' | 'under' | 'push'
  homeCovered?: boolean
  venue?: string
}

// =============================================================================
// IN-MEMORY CACHE
// =============================================================================

interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
}

const cache = new Map<string, CacheEntry<unknown>>()

function getCached<T>(key: string): T | null {
  const entry = cache.get(key)
  if (!entry) return null
  if (Date.now() - entry.timestamp > entry.ttl) {
    cache.delete(key)
    return null
  }
  return entry.data as T
}

function setCache<T>(key: string, data: T, ttl: number): void {
  cache.set(key, { data, timestamp: Date.now(), ttl })
}

function invalidateCache(pattern: string): void {
  for (const key of cache.keys()) {
    if (key.includes(pattern)) {
      cache.delete(key)
    }
  }
}

// =============================================================================
// LIVE GAMES
// =============================================================================

/**
 * Get today's games for a sport with full enrichment
 */
export async function getGames(sport: Sport, date?: Date): Promise<UnifiedGame[]> {
  const dateStr = date ? date.toISOString().split('T')[0] : 'today'
  const cacheKey = `games:${sport}:${dateStr}`
  
  const cached = getCached<UnifiedGame[]>(cacheKey)
  if (cached) return cached

  try {
    // Fetch from ESPN (primary source - free & unlimited)
    const scoreboard = date 
      ? await espn.getScoreboard(sport, date.toISOString().split('T')[0].replace(/-/g, ''))
      : await espn.getScoreboard(sport)

    // Transform to unified format
    const games: UnifiedGame[] = scoreboard.events.map(game => {
      const competition = game.competitions[0]
      const homeComp = competition?.competitors.find(c => c.homeAway === 'home')
      const awayComp = competition?.competitors.find(c => c.homeAway === 'away')
      const odds = competition?.odds?.[0]
      
      // Map ESPN status to our GameStatus
      const mapStatus = (status: typeof game.status): GameStatus => {
        if (status.type.completed) return 'final'
        if (status.type.state === 'in') return 'live'
        return 'scheduled'
      }
      
      return {
        id: game.id,
        espnId: game.id,
        sport,
        status: mapStatus(game.status),
        gameTime: game.date,
        venue: competition?.venue?.fullName || 'TBD',
        broadcast: competition?.broadcasts?.[0]?.names?.join(', ') || '',
        homeTeam: {
          id: homeComp?.team.id || '',
          name: homeComp?.team.displayName || 'TBD',
          abbreviation: homeComp?.team.abbreviation || '',
          record: homeComp?.records?.find(r => r.type === 'total')?.summary || '0-0',
          score: homeComp?.score ? parseInt(homeComp.score) : undefined,
          logo: homeComp?.team.logo,
        },
        awayTeam: {
          id: awayComp?.team.id || '',
          name: awayComp?.team.displayName || 'TBD',
          abbreviation: awayComp?.team.abbreviation || '',
          record: awayComp?.records?.find(r => r.type === 'total')?.summary || '0-0',
          score: awayComp?.score ? parseInt(awayComp.score) : undefined,
          logo: awayComp?.team.logo,
        },
        odds: odds ? {
          spread: odds.spread,
          total: odds.overUnder,
          homeML: odds.homeTeamOdds?.moneyLine ?? 0,
          awayML: odds.awayTeamOdds?.moneyLine ?? 0,
        } : undefined,
      }
    })

    // Enrich with additional data in parallel
    await Promise.allSettled(games.map(async (game) => {
      try {
        // Get ATS records
        const atsRecords = await espn.getATSRecords(sport, game.espnId)
        if (atsRecords && (atsRecords.home || atsRecords.away)) {
          game.atsRecords = {
            home: atsRecords.home?.summary || 'N/A',
            away: atsRecords.away?.summary || 'N/A',
          }
        }

        // Get detailed odds (win %, avg scores)
        const detailedOdds = await espn.getDetailedOdds(sport, game.espnId)
        if (detailedOdds && game.odds) {
          game.odds.spreadHomeOdds = -110
          game.odds.spreadAwayOdds = -110
          game.odds.overOdds = -110
          game.odds.underOdds = -110
        }

        // Get injuries for game
        const injuries = await espn.getGameInjuries(sport, game.espnId)
        if (injuries) {
          game.injuries = injuries.flatMap(team => 
            (team.injuries || []).map(inj => ({
              id: `${inj.athlete.id}-${Date.now()}`,
              playerId: inj.athlete.id,
              player: inj.athlete.displayName,
              team: team.team.displayName,
              teamId: team.team.id,
              sport,
              position: inj.athlete.position?.abbreviation || '',
              status: mapInjuryStatus(inj.status),
              injury: typeof inj.type === 'object' ? inj.type.description : (inj.type || 'Unknown'),
              description: inj.details?.detail,
              impact: determineInjuryImpact(inj),
              updatedAt: inj.date || new Date().toISOString(),
            }))
          )
        }
      } catch {
        // Skip enrichment if it fails
      }
    }))

    setCache(cacheKey, games, TTL.LIVE_GAMES)
    return games
  } catch (error) {
    console.error(`Error fetching games for ${sport}:`, error)
    return []
  }
}

/**
 * Get all games across all sports for today
 */
export async function getAllGamesToday(): Promise<Record<Sport, UnifiedGame[]>> {
  const sports: Sport[] = ['NFL', 'NBA', 'NHL', 'MLB']
  
  const results = await Promise.all(
    sports.map(async (sport) => ({
      sport,
      games: await getGames(sport),
    }))
  )

  return Object.fromEntries(
    results.map(r => [r.sport, r.games])
  ) as Record<Sport, UnifiedGame[]>
}

// =============================================================================
// STANDINGS
// =============================================================================

/**
 * Get current standings for a sport
 */
export async function getStandings(sport: Sport): Promise<UnifiedTeam[]> {
  const cacheKey = `standings:${sport}`
  
  const cached = getCached<UnifiedTeam[]>(cacheKey)
  if (cached) return cached

  try {
    const standings = await espn.getStandings(sport)
    
    // Transform to unified format
    const teams: UnifiedTeam[] = standings.map((entry: { team: { id: string; displayName: string; abbreviation: string; logo?: string }; stats: Array<{ name: string; value: number; displayValue?: string }> }) => {
      const stats = entry.stats.reduce((acc: Record<string, number | string>, stat: { name: string; value: number; displayValue?: string }) => {
        acc[stat.name] = stat.displayValue || stat.value
        return acc
      }, {})

      return {
        id: entry.team.id,
        name: entry.team.displayName,
        abbreviation: entry.team.abbreviation,
        fullName: entry.team.displayName,
        logo: entry.team.logo,
        sport,
        conference: '',
        division: '',
        record: {
          wins: Number(stats['wins']) || 0,
          losses: Number(stats['losses']) || 0,
          ties: Number(stats['ties']) || 0,
          winPct: Number(stats['winPercent']) || 0,
        },
        atsRecord: { wins: 0, losses: 0, pushes: 0, pct: 0 },
        ouRecord: { over: 0, under: 0, pushes: 0, overPct: 0 },
        last10ATS: [],
        streak: String(stats['streak'] || ''),
        pointsFor: Number(stats['pointsFor']) || 0,
        pointsAgainst: Number(stats['pointsAgainst']) || 0,
        pointDiff: Number(stats['pointDifferential']) || 0,
      }
    })

    setCache(cacheKey, teams, TTL.STANDINGS)
    return teams
  } catch (error) {
    console.error(`Error fetching standings for ${sport}:`, error)
    return []
  }
}

// =============================================================================
// INJURIES
// =============================================================================

/**
 * Get injuries for a sport or team
 */
export async function getInjuries(
  sport: Sport,
  teamId?: string
): Promise<UnifiedInjury[]> {
  const cacheKey = teamId ? `injuries:${sport}:${teamId}` : `injuries:${sport}`
  
  const cached = getCached<UnifiedInjury[]>(cacheKey)
  if (cached) return cached

  try {
    let unified: UnifiedInjury[]
    
    if (teamId) {
      // getTeamInjuries returns ESPNInjury[] (flat array)
      const injuries = await espn.getTeamInjuries(sport, teamId)
      unified = injuries.map(inj => ({
        id: `${inj.athlete.id}-${Date.now()}`,
        playerId: inj.athlete.id,
        player: inj.athlete.displayName,
        team: 'Unknown', // Team info not available in flat response
        teamId: teamId,
        sport,
        position: inj.athlete.position?.abbreviation || '',
        status: mapInjuryStatus(inj.status),
        injury: typeof inj.type === 'object' ? inj.type.description : (inj.type || 'Unknown'),
        description: inj.details?.detail,
        impact: determineInjuryImpact(inj),
        updatedAt: inj.date || new Date().toISOString(),
      }))
    } else {
      // API-Sports injuries
      const injuries = await apiSports.getInjuries(sport, {})
      unified = Array.isArray(injuries) ? injuries.map(inj => ({
        id: `apisports-${inj.player.id}-${Date.now()}`,
        playerId: String(inj.player.id),
        player: inj.player.name,
        team: inj.team.name,
        teamId: String(inj.team.id),
        sport,
        position: '',
        status: mapInjuryStatus(inj.status),
        injury: inj.type || 'Unknown',
        description: inj.description,
        impact: 'medium' as const,
        updatedAt: inj.date || new Date().toISOString(),
      })) : []
    }

    setCache(cacheKey, unified, TTL.INJURIES)
    return unified
  } catch (error) {
    console.error(`Error fetching injuries:`, error)
    return []
  }
}

// =============================================================================
// NEWS & SOCIAL
// =============================================================================

/**
 * Get aggregated news for a sport
 */
export async function getNews(sport: Sport, limit: number = 20) {
  const cacheKey = `news:${sport}:${limit}`
  
  const cached = getCached<news.NewsFeed>(cacheKey)
  if (cached) return cached

  try {
    const feed = await news.getSportNewsFeed(sport, {
      includeTwitter: true,
      includeInjuries: true,
      limit,
    })

    setCache(cacheKey, feed, TTL.NEWS)
    return feed
  } catch (error) {
    console.error(`Error fetching news for ${sport}:`, error)
    return { items: [], lastUpdated: new Date().toISOString() }
  }
}

/**
 * Get team-specific news and social
 */
export async function getTeamNews(
  sport: Sport,
  team: { id: string; name: string; abbreviation: string }
) {
  const cacheKey = `team-news:${sport}:${team.id}`
  
  const cached = getCached<news.NewsFeed>(cacheKey)
  if (cached) return cached

  try {
    const feed = await news.getTeamNewsFeed(sport, team, {
      includeTwitter: true,
      includeInjuries: true,
      limit: 15,
    })

    setCache(cacheKey, feed, TTL.NEWS)
    return feed
  } catch (error) {
    console.error(`Error fetching team news:`, error)
    return { items: [], lastUpdated: new Date().toISOString() }
  }
}

// =============================================================================
// HISTORICAL DATA (Supabase)
// =============================================================================

/**
 * Get historical games from database
 */
export async function getHistoricalGames(params: {
  sport?: Sport
  team?: string
  season?: number
  startDate?: string
  endDate?: string
  limit?: number
}): Promise<HistoricalGame[]> {
  const cacheKey = `historical:${JSON.stringify(params)}`
  
  const cached = getCached<HistoricalGame[]>(cacheKey)
  if (cached) return cached

  try {
    const supabase = getSupabase()
    if (!supabase) {
      console.warn('Supabase client not available')
      return []
    }
    
    let query = supabase
      .from('historical_games')
      .select('*')
      .order('game_date', { ascending: false })

    if (params.sport) query = query.eq('sport', params.sport)
    if (params.season) query = query.eq('season', params.season)
    if (params.team) {
      query = query.or(`home_team_name.ilike.%${params.team}%,away_team_name.ilike.%${params.team}%`)
    }
    if (params.startDate) query = query.gte('game_date', params.startDate)
    if (params.endDate) query = query.lte('game_date', params.endDate)
    if (params.limit) query = query.limit(params.limit)

    const { data, error } = await query

    if (error) throw error

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const games: HistoricalGame[] = (data || []).map((row: any) => ({
      id: row.id,
      sport: row.sport,
      season: row.season,
      seasonType: row.season_type,
      gameDate: row.game_date,
      homeTeam: row.home_team_name,
      awayTeam: row.away_team_name,
      homeTeamId: row.home_team_id,
      awayTeamId: row.away_team_id,
      homeScore: row.home_score,
      awayScore: row.away_score,
      spread: row.point_spread,
      total: row.over_under,
      spreadResult: row.spread_result,
      totalResult: row.total_result,
      homeCovered: row.spread_result === 'home_cover',
      venue: row.venue,
    }))

    setCache(cacheKey, games, TTL.HISTORICAL)
    return games
  } catch (error) {
    console.error('Error fetching historical games:', error)
    return []
  }
}

/**
 * Calculate ATS trends from historical data
 */
export async function calculateATSTrends(params: {
  sport: Sport
  team?: string
  season?: number
  isHome?: boolean
  minGames?: number
}): Promise<{
  record: { wins: number; losses: number; pushes: number }
  coverPct: number
  avgMargin: number
  roi: number
}> {
  const games = await getHistoricalGames({
    sport: params.sport,
    team: params.team,
    season: params.season,
  })

  let filtered = games.filter(g => g.spread !== undefined && g.spreadResult)
  
  if (params.team) {
    if (params.isHome === true) {
      filtered = filtered.filter(g => 
        g.homeTeam.toLowerCase().includes(params.team!.toLowerCase())
      )
    } else if (params.isHome === false) {
      filtered = filtered.filter(g => 
        g.awayTeam.toLowerCase().includes(params.team!.toLowerCase())
      )
    }
  }

  const minGames = params.minGames || 10
  if (filtered.length < minGames) {
    return {
      record: { wins: 0, losses: 0, pushes: 0 },
      coverPct: 0,
      avgMargin: 0,
      roi: 0,
    }
  }

  let wins = 0, losses = 0, pushes = 0
  let totalMargin = 0

  for (const game of filtered) {
    const isTeamHome = params.team 
      ? game.homeTeam.toLowerCase().includes(params.team.toLowerCase())
      : true
    
    if (game.spreadResult === 'push') {
      pushes++
    } else if (
      (isTeamHome && game.spreadResult === 'home') ||
      (!isTeamHome && game.spreadResult === 'away')
    ) {
      wins++
    } else {
      losses++
    }

    // Calculate margin
    if (isTeamHome) {
      totalMargin += (game.homeScore - game.awayScore) + (game.spread || 0)
    } else {
      totalMargin += (game.awayScore - game.homeScore) - (game.spread || 0)
    }
  }

  const coverPct = (wins / (wins + losses)) * 100
  const avgMargin = totalMargin / filtered.length
  // ROI assuming -110 odds
  const roi = ((wins * 100 - losses * 110) / ((wins + losses) * 110)) * 100

  return {
    record: { wins, losses, pushes },
    coverPct,
    avgMargin,
    roi,
  }
}

/**
 * Calculate O/U trends from historical data
 */
export async function calculateOUTrends(params: {
  sport: Sport
  team?: string
  season?: number
  isHome?: boolean
}): Promise<{
  record: { over: number; under: number; pushes: number }
  overPct: number
  avgTotal: number
}> {
  const games = await getHistoricalGames({
    sport: params.sport,
    team: params.team,
    season: params.season,
  })

  const filtered = games.filter(g => g.total !== undefined && g.totalResult)

  if (filtered.length < 10) {
    return {
      record: { over: 0, under: 0, pushes: 0 },
      overPct: 0,
      avgTotal: 0,
    }
  }

  let over = 0, under = 0, pushes = 0
  let totalScored = 0

  for (const game of filtered) {
    if (game.totalResult === 'push') {
      pushes++
    } else if (game.totalResult === 'over') {
      over++
    } else {
      under++
    }
    totalScored += game.homeScore + game.awayScore
  }

  return {
    record: { over, under, pushes },
    overPct: (over / (over + under)) * 100,
    avgTotal: totalScored / filtered.length,
  }
}

// =============================================================================
// TRENDS DISCOVERY
// =============================================================================

/**
 * Discover profitable trends from historical data
 */
export async function discoverTrends(
  sport: Sport,
  minSampleSize: number = 30,
  minWinPct: number = 53
): Promise<UnifiedTrend[]> {
  const cacheKey = `trends:${sport}:${minSampleSize}:${minWinPct}`
  
  const cached = getCached<UnifiedTrend[]>(cacheKey)
  if (cached) return cached

  const trends: UnifiedTrend[] = []

  // Get all teams
  const standings = await getStandings(sport)

  // Analyze each team's ATS performance
  for (const team of standings) {
    // Home ATS
    const homeATS = await calculateATSTrends({
      sport,
      team: team.name,
      isHome: true,
    })
    
    if (homeATS.coverPct >= minWinPct && homeATS.record.wins + homeATS.record.losses >= minSampleSize) {
      trends.push({
        id: `${sport}-${team.abbreviation}-home-ats`,
        sport,
        title: `${team.name} Home ATS`,
        description: `${team.name} covers the spread at home ${homeATS.coverPct.toFixed(1)}% of the time`,
        category: 'ats',
        record: homeATS.record,
        winPct: homeATS.coverPct,
        roi: homeATS.roi,
        sampleSize: homeATS.record.wins + homeATS.record.losses,
        timeframe: 'Historical',
        lastVerified: new Date().toISOString(),
        isActive: true,
        edgeRating: calculateEdgeRating(homeATS.coverPct, homeATS.roi),
      })
    }

    // Away ATS
    const awayATS = await calculateATSTrends({
      sport,
      team: team.name,
      isHome: false,
    })
    
    if (awayATS.coverPct >= minWinPct && awayATS.record.wins + awayATS.record.losses >= minSampleSize) {
      trends.push({
        id: `${sport}-${team.abbreviation}-away-ats`,
        sport,
        title: `${team.name} Away ATS`,
        description: `${team.name} covers the spread on the road ${awayATS.coverPct.toFixed(1)}% of the time`,
        category: 'ats',
        record: awayATS.record,
        winPct: awayATS.coverPct,
        roi: awayATS.roi,
        sampleSize: awayATS.record.wins + awayATS.record.losses,
        timeframe: 'Historical',
        lastVerified: new Date().toISOString(),
        isActive: true,
        edgeRating: calculateEdgeRating(awayATS.coverPct, awayATS.roi),
      })
    }

    // O/U trends
    const ouTrends = await calculateOUTrends({ sport, team: team.name })
    
    if (ouTrends.overPct >= 57 || ouTrends.overPct <= 43) {
      const isOver = ouTrends.overPct >= 57
      trends.push({
        id: `${sport}-${team.abbreviation}-ou`,
        sport,
        title: `${team.name} ${isOver ? 'Overs' : 'Unders'}`,
        description: `${team.name} games go ${isOver ? 'over' : 'under'} ${isOver ? ouTrends.overPct.toFixed(1) : (100 - ouTrends.overPct).toFixed(1)}% of the time`,
        category: 'ou',
        record: isOver 
          ? { wins: ouTrends.record.over, losses: ouTrends.record.under, pushes: ouTrends.record.pushes }
          : { wins: ouTrends.record.under, losses: ouTrends.record.over, pushes: ouTrends.record.pushes },
        winPct: isOver ? ouTrends.overPct : (100 - ouTrends.overPct),
        roi: ((isOver ? ouTrends.overPct : (100 - ouTrends.overPct)) - 52.4) * 2, // Approximate ROI
        sampleSize: ouTrends.record.over + ouTrends.record.under,
        timeframe: 'Historical',
        lastVerified: new Date().toISOString(),
        isActive: true,
        edgeRating: calculateEdgeRating(isOver ? ouTrends.overPct : (100 - ouTrends.overPct), 0),
      })
    }
  }

  // Sort by edge rating
  trends.sort((a, b) => b.edgeRating - a.edgeRating)

  setCache(cacheKey, trends, TTL.TRENDS)
  return trends
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

function mapInjuryStatus(status: string): UnifiedInjury['status'] {
  const s = status.toLowerCase()
  if (s.includes('out')) return 'OUT'
  if (s.includes('doubtful')) return 'DOUBTFUL'
  if (s.includes('questionable')) return 'QUESTIONABLE'
  if (s.includes('probable')) return 'PROBABLE'
  if (s.includes('ir') || s.includes('injured reserve')) return 'IR'
  return 'DAY-TO-DAY'
}

function determineInjuryImpact(injury: espn.ESPNInjury): 'high' | 'medium' | 'low' {
  const position = injury.athlete.position?.abbreviation || ''
  const status = injury.status.toLowerCase()
  
  // Key positions have high impact
  const keyPositions = ['QB', 'RB', 'WR', 'TE', 'PG', 'SG', 'C', 'G', 'LW', 'RW', 'P', 'SP']
  
  if (status.includes('out') && keyPositions.includes(position)) return 'high'
  if (status.includes('out')) return 'medium'
  if (status.includes('doubtful')) return 'medium'
  return 'low'
}

function calculateEdgeRating(winPct: number, roi: number): number {
  // 53% = 1 star, 57%+ = 5 stars
  let rating = Math.min(5, Math.max(1, Math.floor((winPct - 52) / 1.25) + 1))
  
  // Boost for positive ROI
  if (roi > 5) rating = Math.min(5, rating + 1)
  
  return rating
}

// =============================================================================
// DATA REFRESH / REAL-TIME UPDATES
// =============================================================================

/**
 * Refresh all cached data for a sport
 */
export async function refreshSportData(sport: Sport): Promise<void> {
  invalidateCache(sport)
  
  // Re-fetch everything
  await Promise.all([
    getGames(sport),
    getStandings(sport),
    getInjuries(sport),
    getNews(sport),
  ])
}

/**
 * Get data freshness status
 */
export function getDataFreshness(): Record<string, { age: number; fresh: boolean }> {
  const freshness: Record<string, { age: number; fresh: boolean }> = {}
  
  for (const [key, entry] of cache.entries()) {
    const age = Date.now() - entry.timestamp
    freshness[key] = {
      age,
      fresh: age < entry.ttl,
    }
  }
  
  return freshness
}

// =============================================================================
// EXPORTS
// =============================================================================

export const dataStore = {
  // Games
  getGames,
  getAllGamesToday,
  
  // Standings
  getStandings,
  
  // Injuries
  getInjuries,
  
  // News
  getNews,
  getTeamNews,
  
  // Historical
  getHistoricalGames,
  calculateATSTrends,
  calculateOUTrends,
  
  // Trends
  discoverTrends,
  
  // Utilities
  refreshSportData,
  getDataFreshness,
  invalidateCache,
}

export default dataStore
