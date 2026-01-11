/**
 * Real-Time Sports Data Service
 * 
 * Uses ESPN Public API to provide live game data, standings, and team info.
 * This service correctly uses the ESPN API types and transformations.
 */

import * as espn from './api/espn'
import type { SportKey, ESPNGame, ESPNTeam, ESPNStanding } from './api/espn'

// =============================================================================
// TYPES
// =============================================================================

export type Sport = 'NFL' | 'NBA' | 'NHL' | 'MLB'

export interface GameStatus {
  state: 'pre' | 'in' | 'post'
  completed: boolean
  period?: number
  clock?: string
  detail?: string
}

export interface TeamInfo {
  id: string
  name: string
  abbreviation: string
  logo?: string
  color?: string
  score: number | null
  record?: string
}

export interface OddsInfo {
  spread: number
  total: number
  homeML?: number
  awayML?: number
  details?: string
}

export interface LiveMatchup {
  id: string
  espnId: string
  sport: Sport
  name: string
  shortName: string
  status: GameStatus
  scheduledAt: string
  venue?: string
  broadcast?: string
  home: TeamInfo
  away: TeamInfo
  odds: OddsInfo | null
  weather?: {
    temp: number
    condition: string
  } | null
}

export interface TeamATS {
  teamId: string
  teamName: string
  sport: Sport
  season: number
  atsRecord: { wins: number; losses: number; pushes: number }
  homeAtsRecord: { wins: number; losses: number; pushes: number }
  awayAtsRecord: { wins: number; losses: number; pushes: number }
  ouRecord: { over: number; under: number; pushes: number }
  coverPct: number
  homeCoverPct: number
  awayCoverPct: number
  overPct: number
  atsStreak: number
  last10ATS: Array<'W' | 'L' | 'P'>
}

export interface EdgeSignal {
  id: string
  type: 'reverse_line' | 'steam_move' | 'sharp_action' | 'situational' | 'injury_impact'
  gameId: string
  sport: Sport
  description: string
  side: 'home' | 'away' | 'over' | 'under'
  confidence: number
  timestamp: string
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function mapStatus(status: ESPNGame['status']): GameStatus {
  return {
    state: status.type.state as 'pre' | 'in' | 'post',
    completed: status.type.completed,
    period: status.period > 0 ? status.period : undefined,
    clock: status.displayClock || undefined,
    detail: status.type.name,
  }
}

function transformToLiveMatchup(game: ESPNGame, sport: Sport): LiveMatchup {
  const competition = game.competitions[0]
  const homeComp = competition?.competitors.find(c => c.homeAway === 'home')
  const awayComp = competition?.competitors.find(c => c.homeAway === 'away')
  const odds = competition?.odds?.[0]

  return {
    id: game.id,
    espnId: game.id,
    sport,
    name: game.name,
    shortName: game.shortName,
    status: mapStatus(game.status),
    scheduledAt: game.date,
    venue: competition?.venue?.fullName,
    broadcast: competition?.broadcasts?.[0]?.names?.join(', '),
    home: {
      id: homeComp?.team.id || '',
      name: homeComp?.team.displayName || 'TBD',
      abbreviation: homeComp?.team.abbreviation || '',
      logo: homeComp?.team.logo,
      color: homeComp?.team.color,
      score: homeComp?.score ? parseInt(homeComp.score) : null,
      record: homeComp?.records?.find(r => r.type === 'total')?.summary,
    },
    away: {
      id: awayComp?.team.id || '',
      name: awayComp?.team.displayName || 'TBD',
      abbreviation: awayComp?.team.abbreviation || '',
      logo: awayComp?.team.logo,
      color: awayComp?.team.color,
      score: awayComp?.score ? parseInt(awayComp.score) : null,
      record: awayComp?.records?.find(r => r.type === 'total')?.summary,
    },
    odds: odds ? {
      spread: odds.spread,
      total: odds.overUnder,
      homeML: odds.homeTeamOdds?.moneyLine,
      awayML: odds.awayTeamOdds?.moneyLine,
      details: odds.details,
    } : null,
    weather: competition?.weather ? {
      temp: competition.weather.temperature,
      condition: competition.weather.displayValue,
    } : null,
  }
}

// =============================================================================
// LIVE MATCHUP DATA
// =============================================================================

/**
 * Get today's matchups for a sport with live odds and betting data
 */
export async function getLiveMatchups(sport: Sport): Promise<LiveMatchup[]> {
  try {
    const scoreboard = await espn.getScoreboard(sport as SportKey)
    return scoreboard.events.map(game => transformToLiveMatchup(game, sport))
  } catch (error) {
    console.error(`Error fetching live matchups for ${sport}:`, error)
    return []
  }
}

/**
 * Get matchups for a specific date
 */
export async function getMatchupsByDate(sport: Sport, date: string): Promise<LiveMatchup[]> {
  try {
    // Format date as YYYYMMDD for ESPN API
    const formattedDate = date.replace(/-/g, '')
    const scoreboard = await espn.getScoreboard(sport as SportKey, formattedDate)
    return scoreboard.events.map(game => transformToLiveMatchup(game, sport))
  } catch (error) {
    console.error(`Error fetching matchups for ${sport} on ${date}:`, error)
    return []
  }
}

/**
 * Get all matchups across all sports for today
 */
export async function getAllLiveMatchups(): Promise<Record<Sport, LiveMatchup[]>> {
  const sports: Sport[] = ['NFL', 'NBA', 'NHL', 'MLB']
  const results: Record<string, LiveMatchup[]> = {}

  await Promise.all(
    sports.map(async (sport) => {
      results[sport] = await getLiveMatchups(sport)
    })
  )

  return results as Record<Sport, LiveMatchup[]>
}

/**
 * Get a single game's details
 */
export async function getGameDetails(sport: Sport, gameId: string): Promise<LiveMatchup | null> {
  try {
    const game = await espn.getGameDetails(sport as SportKey, gameId)
    if (!game) return null
    return transformToLiveMatchup(game, sport)
  } catch (error) {
    console.error(`Error fetching game ${gameId}:`, error)
    return null
  }
}

// =============================================================================
// STANDINGS & TEAM DATA
// =============================================================================

export interface TeamStanding {
  team: ESPNTeam
  wins: number
  losses: number
  ties?: number
  pct: number
  streak?: string
  pointsFor?: number
  pointsAgainst?: number
}

/**
 * Get current standings from ESPN
 */
export async function getStandings(sport: Sport): Promise<TeamStanding[]> {
  try {
    const standings = await espn.getStandings(sport as SportKey)
    
    return standings.map(entry => {
      const getStat = (name: string): number => {
        const stat = entry.stats.find(s => s.name === name)
        return stat?.value ?? 0
      }
      
      const getStatDisplay = (name: string): string => {
        const stat = entry.stats.find(s => s.name === name)
        return stat?.displayValue ?? ''
      }
      
      return {
        team: entry.team,
        wins: getStat('wins'),
        losses: getStat('losses'),
        ties: sport === 'NFL' ? getStat('ties') : undefined,
        pct: getStat('winPercent') || (getStat('wins') / Math.max(1, getStat('wins') + getStat('losses'))),
        streak: getStatDisplay('streak'),
        pointsFor: getStat('pointsFor') || getStat('runsScored'),
        pointsAgainst: getStat('pointsAgainst') || getStat('runsAllowed'),
      }
    })
  } catch (error) {
    console.error(`Error fetching standings for ${sport}:`, error)
    return []
  }
}

/**
 * Get all teams for a sport
 */
export async function getTeams(sport: Sport): Promise<ESPNTeam[]> {
  try {
    return await espn.getTeams(sport as SportKey)
  } catch (error) {
    console.error(`Error fetching teams for ${sport}:`, error)
    return []
  }
}

// =============================================================================
// EDGE SIGNALS (Basic Detection)
// =============================================================================

/**
 * Detect edge signals from line movement and game data
 */
export async function detectEdgeSignals(
  sport: Sport,
  gameId: string
): Promise<EdgeSignal[]> {
  const signals: EdgeSignal[] = []
  
  try {
    const game = await getGameDetails(sport, gameId)
    if (!game || !game.odds) return signals

    // Significant spread (potential blowout)
    if (Math.abs(game.odds.spread) >= 10) {
      signals.push({
        id: `edge-${gameId}-spread`,
        type: 'situational',
        gameId,
        sport,
        description: `Large spread of ${Math.abs(game.odds.spread)} points indicates significant mismatch`,
        side: game.odds.spread < 0 ? 'home' : 'away',
        confidence: Math.min(Math.abs(game.odds.spread) / 20, 0.8),
        timestamp: new Date().toISOString(),
      })
    }

    // High total (potential shootout)
    const avgTotals: Record<Sport, number> = {
      NFL: 44,
      NBA: 220,
      NHL: 6,
      MLB: 8.5,
    }
    
    if (game.odds.total > avgTotals[sport] * 1.15) {
      signals.push({
        id: `edge-${gameId}-total`,
        type: 'situational',
        gameId,
        sport,
        description: `High total of ${game.odds.total} suggests high-scoring game expected`,
        side: 'over',
        confidence: 0.6,
        timestamp: new Date().toISOString(),
      })
    }

  } catch (error) {
    console.error(`Error detecting edge signals:`, error)
  }
  
  return signals
}

// =============================================================================
// SUMMARY DATA
// =============================================================================

export interface DailySummary {
  totalMatchups: number
  live: number
  upcoming: number
  final: number
  bySport: Record<Sport, {
    total: number
    live: number
    upcoming: number
    final: number
  }>
}

/**
 * Get summary of today's action across all sports
 */
export async function getTodaysSummary(): Promise<DailySummary> {
  const allGames = await getAllLiveMatchups()
  
  const bySport = {} as DailySummary['bySport']
  let totalMatchups = 0
  let live = 0
  let upcoming = 0
  let final = 0

  for (const sport of ['NFL', 'NBA', 'NHL', 'MLB'] as Sport[]) {
    const games = allGames[sport] || []
    const sportLive = games.filter(g => g.status.state === 'in').length
    const sportFinal = games.filter(g => g.status.completed).length
    const sportUpcoming = games.filter(g => g.status.state === 'pre' && !g.status.completed).length
    
    bySport[sport] = {
      total: games.length,
      live: sportLive,
      upcoming: sportUpcoming,
      final: sportFinal,
    }
    
    totalMatchups += games.length
    live += sportLive
    upcoming += sportUpcoming
    final += sportFinal
  }

  return { totalMatchups, live, upcoming, final, bySport }
}

// =============================================================================
// EXPORTS
// =============================================================================

export default {
  getLiveMatchups,
  getMatchupsByDate,
  getAllLiveMatchups,
  getGameDetails,
  getStandings,
  getTeams,
  detectEdgeSignals,
  getTodaysSummary,
}
