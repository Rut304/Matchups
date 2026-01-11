/**
 * REAL DATA SERVICE
 * This module provides ONLY real data - NO fake data, NO Math.random()
 * All data comes from verified API sources:
 * - ESPN API (free) - schedules, scores, standings, team stats
 * - The Odds API - betting lines, spreads, totals, moneylines
 * - Gemini AI - analysis and predictions
 */

import { getScoreboard, getTeams, getStandings, getGameDetails, type SportKey, ESPN_SPORTS } from './espn'
import { oddsClient, type BettingLine } from './odds'

// =============================================================================
// TYPES
// =============================================================================

export interface RealTeamStats {
  teamId: string
  teamName: string
  abbreviation: string
  record: string  // "12-5" from ESPN
  homeRecord?: string
  awayRecord?: string
  conferenceRecord?: string
  // Rankings from standings
  offenseRank?: number
  defenseRank?: number
  pointsPerGame?: number
  pointsAllowedPerGame?: number
  // No fake ATS data - that requires historical betting database
}

export interface RealGameData {
  id: string
  sport: SportKey
  status: 'scheduled' | 'live' | 'final'
  scheduledAt: string
  
  homeTeam: RealTeamStats & {
    score?: number
    logo?: string
  }
  awayTeam: RealTeamStats & {
    score?: number
    logo?: string
  }
  
  // Real betting lines from The Odds API
  odds?: {
    spread: number
    spreadFavorite: string
    total: number
    homeML: number
    awayML: number
    bookmaker: string
    lastUpdate: string
  }
  
  // Consensus across multiple books
  consensus?: {
    spreadAvg: number
    totalAvg: number
    homeMLAvg: number
    awayMLAvg: number
    bookCount: number
  }
  
  // Venue/Weather from ESPN
  venue?: string
  weather?: {
    temp: number
    condition: string
  }
  broadcast?: string
  
  // Period/Clock for live games
  period?: string
  clock?: string
  
  // Data source info
  dataSource: {
    espnId: string
    oddsApiId?: string
    lastSync: string
  }
}

export interface RealBettingMetrics {
  gameId: string
  // From The Odds API - real line data
  openingLine?: {
    spread: number
    total: number
    timestamp: string
  }
  currentLine: {
    spread: number
    total: number
    homeML: number
    awayML: number
    timestamp: string
  }
  lineMovement?: {
    spreadMove: number
    totalMove: number
    direction: 'toward_home' | 'toward_away' | 'stable'
  }
  // Book-by-book comparison
  bookLines: Array<{
    bookmaker: string
    spread: number
    total: number
    homeML: number
    awayML: number
  }>
}

// =============================================================================
// ESPN REAL DATA
// =============================================================================

/**
 * Get real games from ESPN with current scores and status
 */
export async function getRealGames(sport: SportKey): Promise<RealGameData[]> {
  try {
    const scoreboard = await getScoreboard(sport)
    const games: RealGameData[] = []
    
    for (const event of scoreboard.events) {
      const competition = event.competitions[0]
      if (!competition) continue
      
      const homeComp = competition.competitors.find(c => c.homeAway === 'home')
      const awayComp = competition.competitors.find(c => c.homeAway === 'away')
      
      if (!homeComp || !awayComp) continue
      
      // Map status
      let status: 'scheduled' | 'live' | 'final' = 'scheduled'
      if (event.status.type.completed) status = 'final'
      else if (event.status.type.state === 'in') status = 'live'
      
      // Extract odds if available from ESPN
      const espnOdds = competition.odds?.[0]
      
      games.push({
        id: event.id,
        sport,
        status,
        scheduledAt: event.date,
        homeTeam: {
          teamId: homeComp.team.id,
          teamName: homeComp.team.displayName,
          abbreviation: homeComp.team.abbreviation,
          record: homeComp.records?.find(r => r.type === 'total')?.summary || '',
          score: homeComp.score ? parseInt(homeComp.score) : undefined,
          logo: homeComp.team.logo,
        },
        awayTeam: {
          teamId: awayComp.team.id,
          teamName: awayComp.team.displayName,
          abbreviation: awayComp.team.abbreviation,
          record: awayComp.records?.find(r => r.type === 'total')?.summary || '',
          score: awayComp.score ? parseInt(awayComp.score) : undefined,
          logo: awayComp.team.logo,
        },
        odds: espnOdds ? {
          spread: espnOdds.spread || 0,
          spreadFavorite: espnOdds.details?.split(' ')[0] || '',
          total: espnOdds.overUnder || 0,
          homeML: espnOdds.homeTeamOdds?.moneyLine || 0,
          awayML: espnOdds.awayTeamOdds?.moneyLine || 0,
          bookmaker: 'ESPN',
          lastUpdate: new Date().toISOString(),
        } : undefined,
        venue: competition.venue?.fullName,
        weather: competition.weather ? {
          temp: competition.weather.temperature,
          condition: competition.weather.displayValue,
        } : undefined,
        broadcast: competition.broadcasts?.[0]?.names?.join(', '),
        period: event.status.period > 0 ? `${event.status.period}` : undefined,
        clock: event.status.displayClock || undefined,
        dataSource: {
          espnId: event.id,
          lastSync: new Date().toISOString(),
        },
      })
    }
    
    return games
  } catch (error) {
    console.error(`[RealData] Error fetching ESPN games for ${sport}:`, error)
    return []
  }
}

/**
 * Get real team standings from ESPN
 */
export async function getRealStandings(sport: SportKey): Promise<RealTeamStats[]> {
  try {
    const standings = await getStandings(sport)
    const teams: RealTeamStats[] = []
    
    for (const entry of standings) {
      const stats: Record<string, string | number> = {}
      for (const stat of entry.stats || []) {
        stats[stat.name] = stat.value || stat.displayValue
      }
      
      teams.push({
        teamId: entry.team.id,
        teamName: entry.team.displayName,
        abbreviation: entry.team.abbreviation,
        record: `${stats.wins || 0}-${stats.losses || 0}`,
        homeRecord: stats.homeWins ? `${stats.homeWins}-${stats.homeLosses}` : undefined,
        awayRecord: stats.awayWins ? `${stats.awayWins}-${stats.awayLosses}` : undefined,
        pointsPerGame: typeof stats.pointsFor === 'number' 
          ? Number((stats.pointsFor / ((stats.wins as number || 0) + (stats.losses as number || 0) || 1)).toFixed(1))
          : undefined,
        pointsAllowedPerGame: typeof stats.pointsAgainst === 'number'
          ? Number((stats.pointsAgainst / ((stats.wins as number || 0) + (stats.losses as number || 0) || 1)).toFixed(1))
          : undefined,
      })
    }
    
    // Calculate rankings based on points
    teams.sort((a, b) => (b.pointsPerGame || 0) - (a.pointsPerGame || 0))
    teams.forEach((t, i) => t.offenseRank = i + 1)
    
    teams.sort((a, b) => (a.pointsAllowedPerGame || 0) - (b.pointsAllowedPerGame || 0))
    teams.forEach((t, i) => t.defenseRank = i + 1)
    
    return teams
  } catch (error) {
    console.error(`[RealData] Error fetching standings for ${sport}:`, error)
    return []
  }
}

// =============================================================================
// THE ODDS API REAL DATA
// =============================================================================

/**
 * Get real betting lines from The Odds API
 */
export async function getRealOdds(sport: string): Promise<BettingLine[]> {
  try {
    return await oddsClient.getOdds(sport)
  } catch (error) {
    console.error(`[RealData] Error fetching odds for ${sport}:`, error)
    return []
  }
}

/**
 * Get real betting metrics for a specific game
 */
export async function getRealBettingMetrics(sport: string, gameId: string): Promise<RealBettingMetrics | null> {
  try {
    const allOdds = await oddsClient.getOdds(sport)
    const gameOdds = allOdds.filter(o => o.gameId === gameId)
    
    if (gameOdds.length === 0) return null
    
    // Calculate consensus from all books
    const spreads = gameOdds.map(o => o.spread.home)
    const totals = gameOdds.map(o => o.total.over)
    const homeMLs = gameOdds.map(o => o.moneyline.home)
    const awayMLs = gameOdds.map(o => o.moneyline.away)
    
    const avg = (arr: number[]) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0
    
    return {
      gameId,
      currentLine: {
        spread: avg(spreads),
        total: avg(totals),
        homeML: Math.round(avg(homeMLs)),
        awayML: Math.round(avg(awayMLs)),
        timestamp: gameOdds[0].lastUpdate,
      },
      bookLines: gameOdds.map(o => ({
        bookmaker: o.bookmaker,
        spread: o.spread.home,
        total: o.total.over,
        homeML: o.moneyline.home,
        awayML: o.moneyline.away,
      })),
    }
  } catch (error) {
    console.error(`[RealData] Error fetching betting metrics:`, error)
    return null
  }
}

/**
 * Get best available lines across all books
 */
export async function getBestLines(sport: string): Promise<Record<string, {
  bestSpread: { value: number; book: string }
  bestTotal: { value: number; book: string }
  bestHomeML: { value: number; book: string }
  bestAwayML: { value: number; book: string }
}>> {
  try {
    const allOdds = await oddsClient.getOdds(sport)
    const bestByGame: Record<string, {
      bestSpread: { value: number; book: string }
      bestTotal: { value: number; book: string }
      bestHomeML: { value: number; book: string }
      bestAwayML: { value: number; book: string }
    }> = {}
    
    for (const odds of allOdds) {
      if (!bestByGame[odds.gameId]) {
        bestByGame[odds.gameId] = {
          bestSpread: { value: odds.spread.home, book: odds.bookmaker },
          bestTotal: { value: odds.total.over, book: odds.bookmaker },
          bestHomeML: { value: odds.moneyline.home, book: odds.bookmaker },
          bestAwayML: { value: odds.moneyline.away, book: odds.bookmaker },
        }
      } else {
        const best = bestByGame[odds.gameId]
        // For spread, higher (less negative) is better for the bettor
        if (odds.spread.home > best.bestSpread.value) {
          best.bestSpread = { value: odds.spread.home, book: odds.bookmaker }
        }
        // For ML, higher is better (less negative or more positive)
        if (odds.moneyline.home > best.bestHomeML.value) {
          best.bestHomeML = { value: odds.moneyline.home, book: odds.bookmaker }
        }
        if (odds.moneyline.away > best.bestAwayML.value) {
          best.bestAwayML = { value: odds.moneyline.away, book: odds.bookmaker }
        }
      }
    }
    
    return bestByGame
  } catch (error) {
    console.error(`[RealData] Error calculating best lines:`, error)
    return {}
  }
}

// =============================================================================
// COMBINED REAL GAME DATA
// =============================================================================

/**
 * Get games with merged ESPN + Odds data
 * This is the primary function for getting complete real game information
 */
export async function getCompleteGameData(sport: SportKey): Promise<RealGameData[]> {
  // Fetch both sources in parallel
  const [espnGames, oddsData] = await Promise.all([
    getRealGames(sport),
    getRealOdds(sport.toLowerCase()),
  ])
  
  // Create a map of odds by team names for matching
  const oddsMap = new Map<string, BettingLine[]>()
  for (const odds of oddsData) {
    // The Odds API uses slightly different team name formats
    // We'll create multiple keys for fuzzy matching
    const homeKey = normalizeTeamName(odds.gameId.split('_')[0] || '')
    if (!oddsMap.has(homeKey)) oddsMap.set(homeKey, [])
    oddsMap.get(homeKey)!.push(odds)
  }
  
  // Merge odds into ESPN games
  for (const game of espnGames) {
    // Find matching odds by team abbreviation
    const matchingOdds = oddsData.find(o => {
      // Match by game ID or team names
      return fuzzyMatchTeam(game.homeTeam.teamName, o.bookmaker) ||
             o.gameId.toLowerCase().includes(game.homeTeam.abbreviation.toLowerCase())
    })
    
    if (matchingOdds && !game.odds) {
      game.odds = {
        spread: matchingOdds.spread.home,
        spreadFavorite: matchingOdds.spread.home < 0 
          ? game.homeTeam.abbreviation 
          : game.awayTeam.abbreviation,
        total: matchingOdds.total.over,
        homeML: matchingOdds.moneyline.home,
        awayML: matchingOdds.moneyline.away,
        bookmaker: matchingOdds.bookmaker,
        lastUpdate: matchingOdds.lastUpdate,
      }
      game.dataSource.oddsApiId = matchingOdds.gameId
    }
    
    // Calculate consensus if we have multiple books
    const gameOdds = oddsData.filter(o => 
      o.gameId.toLowerCase().includes(game.homeTeam.abbreviation.toLowerCase()) ||
      o.gameId.toLowerCase().includes(game.awayTeam.abbreviation.toLowerCase())
    )
    
    if (gameOdds.length > 1) {
      const spreads = gameOdds.map(o => o.spread.home)
      const totals = gameOdds.map(o => o.total.over)
      const homeMLs = gameOdds.map(o => o.moneyline.home)
      const awayMLs = gameOdds.map(o => o.moneyline.away)
      
      game.consensus = {
        spreadAvg: Number((spreads.reduce((a, b) => a + b, 0) / spreads.length).toFixed(1)),
        totalAvg: Number((totals.reduce((a, b) => a + b, 0) / totals.length).toFixed(1)),
        homeMLAvg: Math.round(homeMLs.reduce((a, b) => a + b, 0) / homeMLs.length),
        awayMLAvg: Math.round(awayMLs.reduce((a, b) => a + b, 0) / awayMLs.length),
        bookCount: gameOdds.length,
      }
    }
  }
  
  return espnGames
}

// =============================================================================
// HELPERS
// =============================================================================

function normalizeTeamName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
}

function fuzzyMatchTeam(name1: string, name2: string): boolean {
  const n1 = normalizeTeamName(name1)
  const n2 = normalizeTeamName(name2)
  return n1.includes(n2) || n2.includes(n1) || n1 === n2
}

// =============================================================================
// DATA AVAILABILITY INDICATORS
// These help the UI show what data is real vs unavailable
// =============================================================================

export interface DataAvailability {
  hasRealScores: boolean
  hasRealOdds: boolean
  hasRealStandings: boolean
  hasHistoricalATS: boolean  // Requires historical database - currently false
  hasPublicBetting: boolean  // Requires premium API - currently false
  hasSharpMoney: boolean     // Requires premium API - currently false
  hasTrends: boolean         // Requires historical tracking - currently false
}

export function getDataAvailability(): DataAvailability {
  return {
    hasRealScores: true,        // ESPN provides real scores
    hasRealOdds: true,          // The Odds API provides real odds
    hasRealStandings: true,     // ESPN provides standings
    hasHistoricalATS: false,    // Would need to track over time
    hasPublicBetting: false,    // Would need Action Network or similar
    hasSharpMoney: false,       // Would need premium betting data
    hasTrends: false,           // Would need historical database
  }
}
