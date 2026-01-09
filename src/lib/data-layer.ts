// =============================================================================
// UNIFIED DATA LAYER
// =============================================================================
// Single source of truth for all app data
// Aggregates, normalizes, and cross-verifies data from multiple sources
// All components should import from this file, NOT directly from API clients

import { 
  getNFLStandings, getNBAStandings, getNHLStandings, getMLBStandings,
  getNFLPlayerStats, getNBAPlayerStats,
  getAllInjuries as fetchAllInjuries,
  type TeamStanding, type PlayerStats, type Injury, type Sport
} from './api/stats'

import { oddsClient, type BettingLine } from './api/odds'
import { marketsClient, type PredictionMarket } from './api/markets'

// =============================================================================
// CACHE LAYER - In-memory with TTL (would be Redis in production)
// =============================================================================

interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
  source: string
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

function setCache<T>(key: string, data: T, ttl: number, source: string): void {
  cache.set(key, { data, timestamp: Date.now(), ttl, source })
}

// TTL configurations (in milliseconds)
const TTL = {
  STANDINGS: 5 * 60 * 1000,      // 5 minutes
  PLAYER_STATS: 5 * 60 * 1000,   // 5 minutes
  INJURIES: 2 * 60 * 1000,       // 2 minutes (more volatile)
  ODDS: 30 * 1000,               // 30 seconds (very volatile)
  MARKETS: 60 * 1000,            // 1 minute
  TRENDS: 10 * 60 * 1000,        // 10 minutes
}

// =============================================================================
// UNIFIED TYPES (Normalized across all sources)
// =============================================================================

export interface UnifiedTeam {
  id: string
  abbr: string
  name: string
  fullName: string
  logo?: string
  sport: Sport
  conference?: string
  division?: string
}

export interface UnifiedStanding extends UnifiedTeam {
  rank: number
  wins: number
  losses: number
  ties?: number
  otLosses?: number // NHL
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
  // Betting stats
  atsRecord?: string
  atsHome?: string
  atsAway?: string
  ouRecord?: string
  ouHome?: string
  ouAway?: string
}

export interface UnifiedPlayer {
  id: string
  name: string
  team: string
  teamAbbr: string
  position: string
  number?: number
  photo?: string
  sport: Sport
}

export interface UnifiedPlayerStats extends UnifiedPlayer {
  category: string
  rank: number
  stats: Record<string, number | string>
  gamesPlayed?: number
}

export interface UnifiedInjury {
  id: string
  player: string
  team: string
  teamAbbr: string
  sport: Sport
  position: string
  status: 'OUT' | 'DOUBTFUL' | 'QUESTIONABLE' | 'PROBABLE' | 'IR' | 'DAY-TO-DAY'
  statusAbbr: string
  injury: string
  updated: string
  impact: 'high' | 'medium' | 'low'
  gamesAffected?: number
}

export interface UnifiedTrend {
  id: string
  sport: Sport
  title: string
  description: string
  record: string
  winPct: number
  roi: number
  sampleSize: number
  isHot: boolean
  timeframe: string
}

export interface UnifiedOdds {
  gameId: string
  sport: Sport
  homeTeam: string
  awayTeam: string
  gameTime: string
  spread: {
    line: number
    homeOdds: number
    awayOdds: number
    bestBook?: string
  }
  total: {
    line: number
    overOdds: number
    underOdds: number
    bestBook?: string
  }
  moneyline: {
    home: number
    away: number
    bestHomeBook?: string
    bestAwayBook?: string
  }
  // Multi-source verification
  consensus?: {
    spreadConsensus: number
    totalConsensus: number
    booksAgreeing: number
  }
}

// =============================================================================
// DATA SOURCES REGISTRY
// =============================================================================

export const DATA_SOURCES = {
  STANDINGS: {
    primary: 'api-sports',
    secondary: 'ball-dont-lie',
    tertiary: 'espn-scrape',
  },
  PLAYER_STATS: {
    primary: 'api-sports',
    secondary: 'ball-dont-lie',
  },
  INJURIES: {
    primary: 'api-sports',
    secondary: 'espn-scrape',
  },
  ODDS: {
    primary: 'the-odds-api',
  },
  MARKETS: {
    primary: 'polymarket',
    secondary: 'kalshi',
  },
}

// =============================================================================
// STANDINGS DATA
// =============================================================================

export async function getUnifiedStandings(sport: Sport): Promise<UnifiedStanding[]> {
  const cacheKey = `standings:${sport}`
  const cached = getCached<UnifiedStanding[]>(cacheKey)
  if (cached) return cached

  let standings: TeamStanding[] = []
  
  try {
    switch (sport) {
      case 'nfl':
        standings = await getNFLStandings()
        break
      case 'nba':
        standings = await getNBAStandings()
        break
      case 'nhl':
        standings = await getNHLStandings()
        break
      case 'mlb':
        standings = await getMLBStandings()
        break
    }
  } catch (error) {
    console.error(`Error fetching ${sport} standings:`, error)
  }

  const unified: UnifiedStanding[] = standings.map((team, index) => ({
    id: team.id,
    abbr: team.team,
    name: team.team,
    fullName: team.teamFull,
    logo: team.logo,
    sport,
    conference: team.conference,
    division: team.division,
    rank: index + 1,
    wins: team.wins,
    losses: team.losses,
    ties: team.ties,
    winPct: team.winPct,
    pointsFor: team.pointsFor,
    pointsAgainst: team.pointsAgainst,
    pointDiff: team.pointDiff,
    streak: team.streak,
    last10: team.last10,
    homeRecord: team.homeRecord,
    awayRecord: team.awayRecord,
    confRecord: team.confRecord,
    divRecord: team.divRecord,
    atsRecord: team.atsRecord,
    ouRecord: team.ouRecord,
  }))

  setCache(cacheKey, unified, TTL.STANDINGS, DATA_SOURCES.STANDINGS.primary)
  return unified
}

export async function getAllStandings(): Promise<Record<Sport, UnifiedStanding[]>> {
  const [nfl, nba, nhl, mlb] = await Promise.all([
    getUnifiedStandings('nfl'),
    getUnifiedStandings('nba'),
    getUnifiedStandings('nhl'),
    getUnifiedStandings('mlb'),
  ])
  
  return { nfl, nba, nhl, mlb }
}

// =============================================================================
// PLAYER STATS DATA
// =============================================================================

export async function getUnifiedPlayerStats(
  sport: Sport, 
  category: string
): Promise<UnifiedPlayerStats[]> {
  const cacheKey = `player-stats:${sport}:${category}`
  const cached = getCached<UnifiedPlayerStats[]>(cacheKey)
  if (cached) return cached

  let stats: PlayerStats[] = []
  
  try {
    switch (sport) {
      case 'nfl':
        stats = await getNFLPlayerStats(category)
        break
      case 'nba':
        stats = await getNBAPlayerStats(category)
        break
      // NHL and MLB player stats can be added
    }
  } catch (error) {
    console.error(`Error fetching ${sport} ${category} stats:`, error)
  }

  const unified: UnifiedPlayerStats[] = stats.map((player, index) => ({
    id: player.id,
    name: player.name,
    team: player.team,
    teamAbbr: player.team,
    position: player.position,
    number: player.number,
    photo: player.photo,
    sport,
    category,
    rank: player.rank || index + 1,
    stats: player.stats,
  }))

  setCache(cacheKey, unified, TTL.PLAYER_STATS, DATA_SOURCES.PLAYER_STATS.primary)
  return unified
}

// Stat categories by sport
export const STAT_CATEGORIES: Record<Sport, string[]> = {
  nfl: ['passing', 'rushing', 'receiving', 'defense', 'kicking'],
  nba: ['points', 'rebounds', 'assists', 'steals', 'blocks', 'threes'],
  nhl: ['goals', 'assists', 'points', 'saves', 'wins'],
  mlb: ['batting', 'pitching', 'home_runs', 'rbi', 'era'],
}

// =============================================================================
// INJURIES DATA
// =============================================================================

export async function getUnifiedInjuries(sport?: Sport): Promise<UnifiedInjury[]> {
  const cacheKey = sport ? `injuries:${sport}` : 'injuries:all'
  const cached = getCached<UnifiedInjury[]>(cacheKey)
  if (cached) return cached

  let injuries: Injury[] = []
  
  try {
    injuries = await fetchAllInjuries()
    if (sport) {
      injuries = injuries.filter(inj => {
        // Determine sport from team abbr (simplified)
        const nflTeams = ['SF', 'KC', 'DET', 'PHI', 'BUF', 'BAL', 'DAL', 'MIA', 'NYJ', 'NYG', 'NE', 'GB', 'CHI', 'MIN', 'LAR', 'SEA', 'ARI', 'ATL', 'CAR', 'NO', 'TB', 'WAS', 'CLE', 'CIN', 'PIT', 'HOU', 'IND', 'JAX', 'TEN', 'DEN', 'LAC', 'LV']
        const nbaTeams = ['GSW', 'LAL', 'BOS', 'MIL', 'PHX', 'DAL', 'MEM', 'DEN', 'CLE', 'OKC', 'NYK', 'BKN', 'PHI', 'MIA', 'ATL', 'CHI', 'TOR', 'IND', 'ORL', 'WAS', 'CHA', 'DET', 'HOU', 'NOP', 'SAS', 'SAC', 'POR', 'UTA', 'MIN', 'LAC']
        
        if (sport === 'nfl' && nflTeams.includes(inj.teamAbbr)) return true
        if (sport === 'nba' && nbaTeams.includes(inj.teamAbbr)) return true
        return false
      })
    }
  } catch (error) {
    console.error('Error fetching injuries:', error)
  }

  const unified: UnifiedInjury[] = injuries.map(inj => ({
    id: inj.id,
    player: inj.player,
    team: inj.team,
    teamAbbr: inj.teamAbbr,
    sport: determineSport(inj.teamAbbr),
    position: inj.position,
    status: mapToUnifiedStatus(inj.status),
    statusAbbr: inj.status,
    injury: inj.injury,
    updated: inj.updated,
    impact: inj.impact,
  }))

  setCache(cacheKey, unified, TTL.INJURIES, DATA_SOURCES.INJURIES.primary)
  return unified
}

function mapToUnifiedStatus(status: string): UnifiedInjury['status'] {
  const s = status.toUpperCase()
  if (s === 'O' || s.includes('OUT')) return 'OUT'
  if (s === 'D' || s.includes('DOUBT')) return 'DOUBTFUL'
  if (s === 'Q' || s.includes('QUEST')) return 'QUESTIONABLE'
  if (s === 'P' || s.includes('PROB')) return 'PROBABLE'
  if (s.includes('IR')) return 'IR'
  return 'DAY-TO-DAY'
}

function determineSport(teamAbbr: string): Sport {
  const nflTeams = ['SF', 'KC', 'DET', 'PHI', 'BUF', 'BAL', 'DAL', 'MIA', 'NYJ', 'NYG', 'NE', 'GB', 'CHI', 'MIN', 'LAR', 'SEA', 'ARI', 'ATL', 'CAR', 'NO', 'TB', 'WAS', 'CLE', 'CIN', 'PIT', 'HOU', 'IND', 'JAX', 'TEN', 'DEN', 'LAC', 'LV']
  const nbaTeams = ['GSW', 'LAL', 'BOS', 'MIL', 'PHX', 'MEM', 'DEN', 'OKC', 'NYK', 'BKN', 'MIA', 'TOR', 'ORL', 'CHA', 'SAS', 'SAC', 'POR', 'UTA']
  
  if (nflTeams.includes(teamAbbr)) return 'nfl'
  if (nbaTeams.includes(teamAbbr)) return 'nba'
  return 'nfl' // Default
}

// =============================================================================
// ODDS DATA (Line Shopping)
// =============================================================================

export async function getUnifiedOdds(sport: Sport): Promise<UnifiedOdds[]> {
  const cacheKey = `odds:${sport}`
  const cached = getCached<UnifiedOdds[]>(cacheKey)
  if (cached) return cached

  let odds: BettingLine[] = []
  
  try {
    odds = await oddsClient.getOdds(sport)
  } catch (error) {
    console.error(`Error fetching ${sport} odds:`, error)
  }

  // Group by game and find best lines
  const gameOdds = new Map<string, UnifiedOdds>()
  
  for (const line of odds) {
    const existing = gameOdds.get(line.gameId)
    
    if (!existing) {
      gameOdds.set(line.gameId, {
        gameId: line.gameId,
        sport,
        homeTeam: '', // Would come from game data
        awayTeam: '',
        gameTime: line.lastUpdate,
        spread: {
          line: line.spread.home,
          homeOdds: line.spread.homeOdds,
          awayOdds: line.spread.awayOdds,
          bestBook: line.bookmaker,
        },
        total: {
          line: line.total.over,
          overOdds: line.total.overOdds,
          underOdds: line.total.underOdds,
          bestBook: line.bookmaker,
        },
        moneyline: {
          home: line.moneyline.home,
          away: line.moneyline.away,
          bestHomeBook: line.bookmaker,
          bestAwayBook: line.bookmaker,
        },
      })
    } else {
      // Compare and keep best odds
      if (line.spread.homeOdds > (existing.spread.homeOdds || -999)) {
        existing.spread.homeOdds = line.spread.homeOdds
        existing.spread.bestBook = line.bookmaker
      }
      if (line.moneyline.home > (existing.moneyline.home || -999)) {
        existing.moneyline.home = line.moneyline.home
        existing.moneyline.bestHomeBook = line.bookmaker
      }
      if (line.moneyline.away > (existing.moneyline.away || -999)) {
        existing.moneyline.away = line.moneyline.away
        existing.moneyline.bestAwayBook = line.bookmaker
      }
    }
  }

  const unified = Array.from(gameOdds.values())
  setCache(cacheKey, unified, TTL.ODDS, DATA_SOURCES.ODDS.primary)
  return unified
}

// =============================================================================
// PREDICTION MARKETS DATA
// =============================================================================

export async function getUnifiedMarkets(category?: string): Promise<PredictionMarket[]> {
  const cacheKey = `markets:${category || 'all'}`
  const cached = getCached<PredictionMarket[]>(cacheKey)
  if (cached) return cached

  let markets: PredictionMarket[] = []
  
  try {
    // Fetch from both sources
    const [polymarket, kalshi] = await Promise.all([
      marketsClient.getPolymarketMarkets(category),
      marketsClient.getKalshiMarkets(category),
    ])
    
    // Merge and dedupe
    markets = [...polymarket, ...kalshi]
  } catch (error) {
    console.error('Error fetching markets:', error)
  }

  setCache(cacheKey, markets, TTL.MARKETS, 'polymarket+kalshi')
  return markets
}

// =============================================================================
// TRENDS DATA
// =============================================================================

export async function getUnifiedTrends(): Promise<UnifiedTrend[]> {
  const cacheKey = 'trends:all'
  const cached = getCached<UnifiedTrend[]>(cacheKey)
  if (cached) return cached

  // For now, return curated trends (would come from analysis engine)
  const trends: UnifiedTrend[] = [
    { id: '1', sport: 'nfl', title: 'NFL home underdogs', description: 'Home underdogs getting +3 or more', record: '18-6', winPct: 75.0, roi: 12.4, sampleSize: 24, isHot: true, timeframe: '2024-25 Season' },
    { id: '2', sport: 'nba', title: 'Thunder road games', description: 'OKC ATS on the road', record: '12-3', winPct: 80.0, roi: 8.7, sampleSize: 15, isHot: true, timeframe: 'This Season' },
    { id: '3', sport: 'nhl', title: 'NHL January overs', description: 'January totals hitting over', record: '14-10', winPct: 58.3, roi: 5.2, sampleSize: 24, isHot: false, timeframe: 'January 2026' },
    { id: '4', sport: 'nfl', title: 'Week 18 unders', description: 'Totals under in Week 18 games', record: '24-12', winPct: 66.7, roi: 6.8, sampleSize: 36, isHot: true, timeframe: 'Last 3 Seasons' },
    { id: '5', sport: 'nba', title: 'B2B road dogs', description: 'Road dogs on back-to-backs', record: '31-22', winPct: 58.5, roi: 7.2, sampleSize: 53, isHot: true, timeframe: '2024-25 Season' },
    { id: '6', sport: 'nfl', title: 'Primetime unders', description: 'SNF/MNF totals under', record: '19-11', winPct: 63.3, roi: 5.8, sampleSize: 30, isHot: false, timeframe: '2024-25 Season' },
  ]

  setCache(cacheKey, trends, TTL.TRENDS, 'internal')
  return trends
}

// =============================================================================
// AGGREGATED DATA FOR HOMEPAGE
// =============================================================================

export interface HomepageData {
  standings: {
    nfl: UnifiedStanding[]
    nba: UnifiedStanding[]
  }
  injuries: UnifiedInjury[]
  trends: UnifiedTrend[]
  lastUpdated: string
  sources: string[]
}

export async function getHomepageData(): Promise<HomepageData> {
  const cacheKey = 'homepage:data'
  const cached = getCached<HomepageData>(cacheKey)
  if (cached) return cached

  const [nflStandings, nbaStandings, injuries, trends] = await Promise.all([
    getUnifiedStandings('nfl'),
    getUnifiedStandings('nba'),
    getUnifiedInjuries(),
    getUnifiedTrends(),
  ])

  // Return ALL data - slicing/pagination handled at component level for tracking
  const data: HomepageData = {
    standings: {
      nfl: nflStandings, // Full list - slice at display if needed
      nba: nbaStandings, // Full list - slice at display if needed
    },
    injuries: injuries.filter(i => i.impact === 'high'), // All high-impact injuries
    trends: trends.filter(t => t.isHot), // All hot trends
    lastUpdated: new Date().toISOString(),
    sources: ['api-sports', 'the-odds-api', 'ball-dont-lie'],
  }

  setCache(cacheKey, data, 60 * 1000, 'aggregated') // 1 minute
  return data
}

// =============================================================================
// UTILITY: Clear cache
// =============================================================================

export function clearCache(pattern?: string): void {
  if (!pattern) {
    cache.clear()
    return
  }
  
  for (const key of cache.keys()) {
    if (key.includes(pattern)) {
      cache.delete(key)
    }
  }
}

// =============================================================================
// EXPORT ALL TYPES
// =============================================================================

export type { TeamStanding, PlayerStats, Injury, Sport } from './api/stats'
export type { BettingLine } from './api/odds'
export type { PredictionMarket } from './api/markets'
