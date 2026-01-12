/**
 * TEAM STATS & PACE DATA
 * Advanced team statistics for betting analysis
 * 
 * Includes:
 * - Pace/tempo metrics
 * - Offensive/defensive efficiency
 * - Situational records
 * - Sport-specific advanced stats
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

// =============================================================================
// TYPES
// =============================================================================

// Base stats shared across sports
interface BaseTeamStats {
  teamId: string
  teamName: string
  teamAbbrev: string
  sport: string
  season: number
  
  // Record
  wins: number
  losses: number
  ties?: number
  
  // Betting Record
  atsWins: number
  atsLosses: number
  atsPushes: number
  atsWinPct: number
  
  overRecord: number // Overs hit
  underRecord: number // Unders hit
  pushRecord: number
  overPct: number
  
  // Scoring
  pointsFor: number
  pointsAgainst: number
  pointsPerGame: number
  pointsAllowedPerGame: number
  
  // Pace
  pace: number // Sport-specific pace metric
  paceRank: number
  
  lastUpdated: string
}

// NFL-specific stats
export interface NFLTeamStats extends BaseTeamStats {
  sport: 'NFL'
  
  // Offensive
  yardsPerGame: number
  passingYardsPerGame: number
  rushingYardsPerGame: number
  yardsPerPlay: number
  thirdDownPct: number
  redZoneScoringPct: number
  turnoversCommitted: number
  
  // Defensive
  yardsAllowedPerGame: number
  passingYardsAllowed: number
  rushingYardsAllowed: number
  turnoversForced: number
  sacksPerGame: number
  
  // Pace (plays per game)
  playsPerGame: number
  timeOfPossession: string // "32:15" format
  
  // Situational
  homeRecord: string
  awayRecord: string
  divisionRecord: string
  conferenceRecord: string
  oneScoreGameRecord: string
  asFavoriteRecord: string
  asUnderdogRecord: string
}

// NBA-specific stats
export interface NBATeamStats extends BaseTeamStats {
  sport: 'NBA'
  
  // Offensive
  fieldGoalPct: number
  threePtPct: number
  freeThrowPct: number
  assistsPerGame: number
  reboundsPerGame: number
  turnoversPerGame: number
  
  // Defensive
  stealsPerGame: number
  blocksPerGame: number
  defensiveRebounds: number
  opponentFgPct: number
  
  // Efficiency
  offensiveRating: number // Points per 100 possessions
  defensiveRating: number
  netRating: number
  trueShootingPct: number
  effectiveFgPct: number
  
  // Pace (possessions per game)
  possessionsPerGame: number
  
  // Situational
  homeRecord: string
  awayRecord: string
  lastThreeRecord: string
  last10Record: string
  vsAbove500: string
  vsBelow500: string
}

// MLB-specific stats
export interface MLBTeamStats extends BaseTeamStats {
  sport: 'MLB'
  
  // Offensive
  battingAverage: number
  onBasePct: number
  sluggingPct: number
  ops: number
  homeRuns: number
  runsPerGame: number
  rbiPerGame: number
  
  // Pitching
  era: number
  whip: number
  strikeoutsPerNine: number
  walksPerNine: number
  qualityStartPct: number
  bullpenEra: number
  saveConversionPct: number
  
  // Pace (average game time in minutes)
  averageGameTime: number
  
  // Situational
  homeRecord: string
  awayRecord: string
  vsLefties: string
  vsRighties: string
  dayGameRecord: string
  nightGameRecord: string
  oneRunGameRecord: string
}

// NHL-specific stats
export interface NHLTeamStats extends BaseTeamStats {
  sport: 'NHL'
  
  // Offensive
  goalsPerGame: number
  shotsPerGame: number
  shootingPct: number
  powerPlayPct: number
  powerPlayGoals: number
  
  // Defensive
  goalsAgainstPerGame: number
  shotsAgainstPerGame: number
  savePct: number
  penaltyKillPct: number
  
  // Special Teams
  powerPlayOpportunities: number
  shortHandedGoals: number
  
  // Pace
  corsiFor: number // Shot attempts for
  corsiAgainst: number
  fenwickPct: number
  
  // Situational
  homeRecord: string
  awayRecord: string
  overtimeRecord: string
  shootoutRecord: string
  lastThreeRecord: string
  divisionRecord: string
}

export type TeamStats = NFLTeamStats | NBATeamStats | MLBTeamStats | NHLTeamStats

export interface TeamStatComparison {
  homeTeam: TeamStats
  awayTeam: TeamStats
  
  // Computed edges
  paceAdvantage: 'home' | 'away' | 'neutral'
  paceDifferential: number
  
  offensiveEdge: 'home' | 'away' | 'neutral'
  defensiveEdge: 'home' | 'away' | 'neutral'
  
  atsEdge: 'home' | 'away' | 'neutral'
  totalProjection: number
  
  keyMatchupFactors: string[]
  bettingImplications: string[]
}

// =============================================================================
// SAMPLE DATA (Used when database is empty)
// =============================================================================

const NFL_SAMPLE_STATS: Partial<NFLTeamStats>[] = [
  {
    teamName: 'Kansas City Chiefs',
    teamAbbrev: 'KC',
    wins: 11, losses: 6, ties: 0,
    atsWins: 9, atsLosses: 8, atsPushes: 0, atsWinPct: 52.9,
    overRecord: 8, underRecord: 9, pushRecord: 0, overPct: 47.1,
    pointsPerGame: 27.2, pointsAllowedPerGame: 19.8,
    yardsPerGame: 368.5, passingYardsPerGame: 258.3, rushingYardsPerGame: 110.2,
    playsPerGame: 64.8, pace: 64.8, paceRank: 12
  },
  {
    teamName: 'Buffalo Bills',
    teamAbbrev: 'BUF',
    wins: 13, losses: 4, ties: 0,
    atsWins: 10, atsLosses: 7, atsPushes: 0, atsWinPct: 58.8,
    overRecord: 10, underRecord: 7, pushRecord: 0, overPct: 58.8,
    pointsPerGame: 30.5, pointsAllowedPerGame: 21.2,
    yardsPerGame: 385.2, passingYardsPerGame: 285.6, rushingYardsPerGame: 99.6,
    playsPerGame: 68.2, pace: 68.2, paceRank: 3
  }
]

const NBA_SAMPLE_STATS: Partial<NBATeamStats>[] = [
  {
    teamName: 'Boston Celtics',
    teamAbbrev: 'BOS',
    wins: 45, losses: 12,
    atsWins: 32, atsLosses: 24, atsPushes: 1, atsWinPct: 57.1,
    overRecord: 28, underRecord: 29, pushRecord: 0, overPct: 49.1,
    pointsPerGame: 120.5, pointsAllowedPerGame: 109.8,
    offensiveRating: 122.5, defensiveRating: 111.2, netRating: 11.3,
    possessionsPerGame: 100.2, pace: 100.2, paceRank: 8,
    trueShootingPct: 62.5, effectiveFgPct: 58.2
  },
  {
    teamName: 'Oklahoma City Thunder',
    teamAbbrev: 'OKC',
    wins: 48, losses: 10,
    atsWins: 35, atsLosses: 22, atsPushes: 1, atsWinPct: 61.4,
    overRecord: 26, underRecord: 31, pushRecord: 1, overPct: 44.8,
    pointsPerGame: 118.2, pointsAllowedPerGame: 105.5,
    offensiveRating: 118.8, defensiveRating: 106.2, netRating: 12.6,
    possessionsPerGame: 99.8, pace: 99.8, paceRank: 10,
    trueShootingPct: 59.8, effectiveFgPct: 55.4
  }
]

// =============================================================================
// MAIN API FUNCTIONS
// =============================================================================

/**
 * Get team stats by team name or abbreviation
 */
export async function getTeamStats(
  teamIdentifier: string,
  sport: string,
  season?: number
): Promise<TeamStats | null> {
  const currentSeason = season || getCurrentSeason(sport)
  
  try {
    const { data, error } = await supabase
      .from('team_advanced_stats')
      .select('*')
      .eq('sport', sport.toUpperCase())
      .eq('season', currentSeason)
      .or(`team_name.ilike.%${teamIdentifier}%,team_abbrev.ilike.${teamIdentifier}`)
      .single()
    
    if (error || !data) {
      return getSampleStats(teamIdentifier, sport)
    }
    
    return formatTeamStats(data, sport)
  } catch (error) {
    console.error('Error fetching team stats:', error)
    return getSampleStats(teamIdentifier, sport)
  }
}

/**
 * Get all teams' stats for a sport
 */
export async function getAllTeamStats(
  sport: string,
  season?: number
): Promise<TeamStats[]> {
  const currentSeason = season || getCurrentSeason(sport)
  
  try {
    const { data, error } = await supabase
      .from('team_advanced_stats')
      .select('*')
      .eq('sport', sport.toUpperCase())
      .eq('season', currentSeason)
      .order('wins', { ascending: false })
    
    if (error || !data || data.length === 0) {
      return getSampleStatsBySport(sport)
    }
    
    return data.map(d => formatTeamStats(d, sport))
  } catch (error) {
    console.error('Error fetching all team stats:', error)
    return getSampleStatsBySport(sport)
  }
}

/**
 * Compare two teams' stats for a matchup
 */
export async function compareTeams(
  homeTeamId: string,
  awayTeamId: string,
  sport: string
): Promise<TeamStatComparison | null> {
  const [homeTeam, awayTeam] = await Promise.all([
    getTeamStats(homeTeamId, sport),
    getTeamStats(awayTeamId, sport)
  ])
  
  if (!homeTeam || !awayTeam) {
    return null
  }
  
  return generateComparison(homeTeam, awayTeam)
}

/**
 * Get pace leaders for totals analysis
 */
export async function getPaceLeaders(
  sport: string,
  top: number = 10
): Promise<TeamStats[]> {
  const allStats = await getAllTeamStats(sport)
  return allStats
    .sort((a, b) => a.paceRank - b.paceRank)
    .slice(0, top)
}

/**
 * Get teams with best ATS records
 */
export async function getBestATSTeams(
  sport: string,
  top: number = 10
): Promise<TeamStats[]> {
  const allStats = await getAllTeamStats(sport)
  return allStats
    .filter(t => (t.atsWins + t.atsLosses) >= 10) // Minimum sample
    .sort((a, b) => b.atsWinPct - a.atsWinPct)
    .slice(0, top)
}

/**
 * Get teams that hit overs most often
 */
export async function getOverTeams(
  sport: string,
  top: number = 10
): Promise<TeamStats[]> {
  const allStats = await getAllTeamStats(sport)
  return allStats
    .filter(t => (t.overRecord + t.underRecord) >= 10)
    .sort((a, b) => b.overPct - a.overPct)
    .slice(0, top)
}

/**
 * Get teams that hit unders most often
 */
export async function getUnderTeams(
  sport: string,
  top: number = 10
): Promise<TeamStats[]> {
  const allStats = await getAllTeamStats(sport)
  return allStats
    .filter(t => (t.overRecord + t.underRecord) >= 10)
    .sort((a, b) => (100 - b.overPct) - (100 - a.overPct))
    .slice(0, top)
}

/**
 * Get sport-specific advanced stats
 */
export async function getAdvancedStats(
  teamId: string,
  sport: string
): Promise<Record<string, number | string> | null> {
  const stats = await getTeamStats(teamId, sport)
  if (!stats) return null
  
  switch (sport.toUpperCase()) {
    case 'NFL':
      const nflStats = stats as NFLTeamStats
      return {
        yardsPerPlay: nflStats.yardsPerPlay || 0,
        thirdDownPct: nflStats.thirdDownPct || 0,
        redZoneScoringPct: nflStats.redZoneScoringPct || 0,
        turnoverMargin: (nflStats.turnoversForced || 0) - (nflStats.turnoversCommitted || 0),
        timeOfPossession: nflStats.timeOfPossession || '30:00'
      }
    
    case 'NBA':
      const nbaStats = stats as NBATeamStats
      return {
        offensiveRating: nbaStats.offensiveRating || 0,
        defensiveRating: nbaStats.defensiveRating || 0,
        netRating: nbaStats.netRating || 0,
        trueShootingPct: nbaStats.trueShootingPct || 0,
        effectiveFgPct: nbaStats.effectiveFgPct || 0
      }
    
    case 'MLB':
      const mlbStats = stats as MLBTeamStats
      return {
        ops: mlbStats.ops || 0,
        era: mlbStats.era || 0,
        whip: mlbStats.whip || 0,
        bullpenEra: mlbStats.bullpenEra || 0,
        qualityStartPct: mlbStats.qualityStartPct || 0
      }
    
    case 'NHL':
      const nhlStats = stats as NHLTeamStats
      return {
        powerPlayPct: nhlStats.powerPlayPct || 0,
        penaltyKillPct: nhlStats.penaltyKillPct || 0,
        corsiFor: nhlStats.corsiFor || 0,
        fenwickPct: nhlStats.fenwickPct || 0,
        savePct: nhlStats.savePct || 0
      }
    
    default:
      return null
  }
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function getCurrentSeason(sport: string): number {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()
  
  switch (sport.toUpperCase()) {
    case 'NFL':
      // NFL season runs Sep-Feb, use start year
      return month >= 8 ? year : year - 1
    case 'NBA':
    case 'NHL':
      // NBA/NHL run Oct-Jun, use start year
      return month >= 9 ? year : year - 1
    case 'MLB':
      // MLB runs Mar-Oct, use current year
      return year
    default:
      return year
  }
}

function formatTeamStats(data: Record<string, unknown>, sport: string): TeamStats {
  const base: BaseTeamStats = {
    teamId: data.team_id as string,
    teamName: data.team_name as string,
    teamAbbrev: data.team_abbrev as string,
    sport: sport.toUpperCase(),
    season: data.season as number,
    wins: data.wins as number || 0,
    losses: data.losses as number || 0,
    ties: data.ties as number,
    atsWins: data.ats_wins as number || 0,
    atsLosses: data.ats_losses as number || 0,
    atsPushes: data.ats_pushes as number || 0,
    atsWinPct: data.ats_win_pct as number || 0,
    overRecord: data.over_record as number || 0,
    underRecord: data.under_record as number || 0,
    pushRecord: data.push_record as number || 0,
    overPct: data.over_pct as number || 0,
    pointsFor: data.points_for as number || 0,
    pointsAgainst: data.points_against as number || 0,
    pointsPerGame: data.points_per_game as number || 0,
    pointsAllowedPerGame: data.points_allowed_per_game as number || 0,
    pace: data.pace as number || 0,
    paceRank: data.pace_rank as number || 0,
    lastUpdated: data.updated_at as string
  }
  
  // Add sport-specific fields
  const sportSpecific = (data.stats as Record<string, unknown>) || {}
  
  return {
    ...base,
    ...sportSpecific
  } as TeamStats
}

function getSampleStats(teamIdentifier: string, sport: string): TeamStats | null {
  const samples = getSampleStatsBySport(sport)
  const normalizedId = teamIdentifier.toLowerCase()
  
  return samples.find(s => 
    s.teamName.toLowerCase().includes(normalizedId) ||
    s.teamAbbrev.toLowerCase() === normalizedId
  ) || null
}

function getSampleStatsBySport(sport: string): TeamStats[] {
  const currentSeason = getCurrentSeason(sport)
  
  switch (sport.toUpperCase()) {
    case 'NFL':
      return NFL_SAMPLE_STATS.map((s, i) => ({
        ...s,
        teamId: `nfl-${i}`,
        sport: 'NFL' as const,
        season: currentSeason,
        lastUpdated: new Date().toISOString()
      })) as NFLTeamStats[]
    
    case 'NBA':
      return NBA_SAMPLE_STATS.map((s, i) => ({
        ...s,
        teamId: `nba-${i}`,
        sport: 'NBA' as const,
        season: currentSeason,
        lastUpdated: new Date().toISOString()
      })) as NBATeamStats[]
    
    default:
      return []
  }
}

function generateComparison(homeTeam: TeamStats, awayTeam: TeamStats): TeamStatComparison {
  const paceDiff = homeTeam.pace - awayTeam.pace
  
  // Determine pace advantage
  let paceAdvantage: 'home' | 'away' | 'neutral' = 'neutral'
  if (Math.abs(paceDiff) >= 2) {
    paceAdvantage = paceDiff > 0 ? 'home' : 'away'
  }
  
  // Offensive edge (more points per game)
  const offensiveDiff = homeTeam.pointsPerGame - awayTeam.pointsPerGame
  const offensiveEdge: 'home' | 'away' | 'neutral' = 
    Math.abs(offensiveDiff) < 2 ? 'neutral' : offensiveDiff > 0 ? 'home' : 'away'
  
  // Defensive edge (fewer points allowed)
  const defensiveDiff = awayTeam.pointsAllowedPerGame - homeTeam.pointsAllowedPerGame
  const defensiveEdge: 'home' | 'away' | 'neutral' = 
    Math.abs(defensiveDiff) < 2 ? 'neutral' : defensiveDiff > 0 ? 'home' : 'away'
  
  // ATS edge
  const atsDiff = homeTeam.atsWinPct - awayTeam.atsWinPct
  const atsEdge: 'home' | 'away' | 'neutral' = 
    Math.abs(atsDiff) < 3 ? 'neutral' : atsDiff > 0 ? 'home' : 'away'
  
  // Project total (average of combined points)
  const avgPts = (homeTeam.pointsPerGame + awayTeam.pointsPerGame + 
    homeTeam.pointsAllowedPerGame + awayTeam.pointsAllowedPerGame) / 2
  const totalProjection = Math.round(avgPts * 2) / 2 // Round to nearest 0.5
  
  // Generate key factors
  const keyMatchupFactors = generateMatchupFactors(homeTeam, awayTeam)
  const bettingImplications = generateBettingImplications(
    homeTeam, awayTeam, paceAdvantage, offensiveEdge, defensiveEdge
  )
  
  return {
    homeTeam,
    awayTeam,
    paceAdvantage,
    paceDifferential: paceDiff,
    offensiveEdge,
    defensiveEdge,
    atsEdge,
    totalProjection,
    keyMatchupFactors,
    bettingImplications
  }
}

function generateMatchupFactors(home: TeamStats, away: TeamStats): string[] {
  const factors: string[] = []
  
  // Pace analysis
  if (home.paceRank <= 5 && away.paceRank <= 5) {
    factors.push('Both teams play at a fast pace - OVER value')
  } else if (home.paceRank >= 25 && away.paceRank >= 25) {
    factors.push('Both teams play slow - UNDER value')
  }
  
  // ATS records
  if (home.atsWinPct >= 55) {
    factors.push(`${home.teamAbbrev} covers at ${home.atsWinPct.toFixed(1)}% rate`)
  }
  if (away.atsWinPct >= 55) {
    factors.push(`${away.teamAbbrev} covers at ${away.atsWinPct.toFixed(1)}% rate`)
  }
  
  // Over/Under tendencies
  if (home.overPct >= 55 && away.overPct >= 55) {
    factors.push('Both teams lean OVER on totals')
  } else if (home.overPct <= 45 && away.overPct <= 45) {
    factors.push('Both teams lean UNDER on totals')
  }
  
  // Scoring differential
  const homeDiff = home.pointsPerGame - home.pointsAllowedPerGame
  const awayDiff = away.pointsPerGame - away.pointsAllowedPerGame
  if (homeDiff > 5) {
    factors.push(`${home.teamAbbrev} outscores opponents by ${homeDiff.toFixed(1)} PPG`)
  }
  if (awayDiff > 5) {
    factors.push(`${away.teamAbbrev} outscores opponents by ${awayDiff.toFixed(1)} PPG`)
  }
  
  return factors
}

function generateBettingImplications(
  home: TeamStats,
  away: TeamStats,
  paceAdv: 'home' | 'away' | 'neutral',
  offAdv: 'home' | 'away' | 'neutral',
  defAdv: 'home' | 'away' | 'neutral'
): string[] {
  const implications: string[] = []
  
  // Spread implications
  const homeAdvantages = [paceAdv, offAdv, defAdv].filter(a => a === 'home').length
  const awayAdvantages = [paceAdv, offAdv, defAdv].filter(a => a === 'away').length
  
  if (homeAdvantages >= 2) {
    implications.push(`${home.teamAbbrev} has multiple statistical edges - lean HOME`)
  } else if (awayAdvantages >= 2) {
    implications.push(`${away.teamAbbrev} has multiple statistical edges - lean AWAY`)
  }
  
  // Total implications
  const combinedPace = (home.pace + away.pace) / 2
  const avgOverPct = (home.overPct + away.overPct) / 2
  
  if (avgOverPct >= 55) {
    implications.push(`Combined ${avgOverPct.toFixed(0)}% OVER rate this season`)
  } else if (avgOverPct <= 45) {
    implications.push(`Combined ${(100 - avgOverPct).toFixed(0)}% UNDER rate this season`)
  }
  
  // Specific ATS edges
  if (Math.abs(home.atsWinPct - away.atsWinPct) >= 10) {
    const better = home.atsWinPct > away.atsWinPct ? home : away
    implications.push(`${better.teamAbbrev} significantly better ATS this season`)
  }
  
  return implications
}
