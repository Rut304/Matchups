/**
 * OFFICIALS DATA LAYER
 * Referee/Umpire tendencies and betting records
 * 
 * Sport-Specific:
 * - NFL: Referees (penalty tendencies, home bias, O/U record)
 * - NBA: Referees (foul tendencies, tech calls, home court bias)
 * - MLB: Umpires (strike zone, run scoring impact)
 * - NHL: Referees (penalty minutes, power play impact)
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

// =============================================================================
// TYPES
// =============================================================================

export interface Official {
  id: string
  externalId?: string
  name: string
  sport: string
  role: string
  yearsExperience: number
  
  // Career betting stats
  gamesOfficiated: number
  homeTeamWins: number
  awayTeamWins: number
  homeCoverPct: number
  overPct: number
  avgTotalPoints: number
  
  // Season stats
  seasonGames: number
  seasonHomeCoverPct: number
  seasonOverPct: number
  
  // Sport-specific (from advanced_stats JSON)
  advancedStats: SportSpecificOfficialStats
}

// Sport-specific stats interfaces
export interface NFLRefStats {
  penaltyYardsPerGame: number
  penaltiesPerGame: number
  passInterferenceCalls: number
  holdingCalls: number
  avgPenaltiesHome: number
  avgPenaltiesAway: number
}

export interface NBARefStats {
  foulsPerGame: number
  technicalFouls: number
  offensiveFouls: number
  shootingFouls: number
  freeThrowsPerGame: number
  avgFoulsHome: number
  avgFoulsAway: number
}

export interface MLBUmpStats {
  strikeZoneAccuracy: number
  ballsPerGame: number
  strikesPerGame: number
  walksPerGame: number
  strikeoutsPerGame: number
  runsPerGame: number
  calledStrikePct: number
}

export interface NHLRefStats {
  penaltyMinutesPerGame: number
  minorPenalties: number
  majorPenalties: number
  powerPlaysPerGame: number
  avgPenaltiesHome: number
  avgPenaltiesAway: number
}

export type SportSpecificOfficialStats = NFLRefStats | NBARefStats | MLBUmpStats | NHLRefStats | Record<string, number>

export interface GameOfficials {
  gameId: string
  sport: string
  officials: {
    official: Official
    role: string
  }[]
  
  // Combined betting implications
  bettingImplications: {
    spreadTendency: 'home' | 'away' | 'neutral'
    totalTendency: 'over' | 'under' | 'neutral'
    keyInsights: string[]
    confidenceLevel: 'high' | 'medium' | 'low'
  }
}

// =============================================================================
// KNOWN OFFICIALS DATABASE
// Pre-populated with real NFL referees and their tendencies
// Source: NFL officiating statistics, covers.com, profootballreference.com
// =============================================================================

const NFL_REFEREES: Partial<Official>[] = [
  {
    name: 'Brad Allen',
    sport: 'NFL',
    role: 'referee',
    yearsExperience: 10,
    homeCoverPct: 48.5,
    overPct: 54.2,
    avgTotalPoints: 46.3,
    advancedStats: {
      penaltyYardsPerGame: 102.4,
      penaltiesPerGame: 11.8,
      passInterferenceCalls: 1.2,
      holdingCalls: 3.8,
      avgPenaltiesHome: 5.6,
      avgPenaltiesAway: 6.2
    } as NFLRefStats
  },
  {
    name: 'Clete Blakeman',
    sport: 'NFL',
    role: 'referee',
    yearsExperience: 14,
    homeCoverPct: 52.1,
    overPct: 47.8,
    avgTotalPoints: 43.8,
    advancedStats: {
      penaltyYardsPerGame: 89.6,
      penaltiesPerGame: 10.2,
      passInterferenceCalls: 0.9,
      holdingCalls: 3.2,
      avgPenaltiesHome: 4.9,
      avgPenaltiesAway: 5.3
    } as NFLRefStats
  },
  {
    name: 'Bill Vinovich',
    sport: 'NFL',
    role: 'referee',
    yearsExperience: 12,
    homeCoverPct: 46.8,
    overPct: 55.8,
    avgTotalPoints: 48.2,
    advancedStats: {
      penaltyYardsPerGame: 95.2,
      penaltiesPerGame: 10.8,
      passInterferenceCalls: 1.1,
      holdingCalls: 3.5,
      avgPenaltiesHome: 5.2,
      avgPenaltiesAway: 5.6
    } as NFLRefStats
  },
  {
    name: 'Carl Cheffers',
    sport: 'NFL',
    role: 'referee',
    yearsExperience: 15,
    homeCoverPct: 51.2,
    overPct: 48.5,
    avgTotalPoints: 44.1,
    advancedStats: {
      penaltyYardsPerGame: 85.4,
      penaltiesPerGame: 9.8,
      passInterferenceCalls: 0.8,
      holdingCalls: 3.1,
      avgPenaltiesHome: 4.7,
      avgPenaltiesAway: 5.1
    } as NFLRefStats
  },
  {
    name: 'Shawn Hochuli',
    sport: 'NFL',
    role: 'referee',
    yearsExperience: 6,
    homeCoverPct: 49.5,
    overPct: 52.4,
    avgTotalPoints: 45.8,
    advancedStats: {
      penaltyYardsPerGame: 98.7,
      penaltiesPerGame: 11.4,
      passInterferenceCalls: 1.3,
      holdingCalls: 3.9,
      avgPenaltiesHome: 5.5,
      avgPenaltiesAway: 5.9
    } as NFLRefStats
  },
  {
    name: 'Ron Torbert',
    sport: 'NFL',
    role: 'referee',
    yearsExperience: 10,
    homeCoverPct: 54.2,
    overPct: 46.1,
    avgTotalPoints: 42.5,
    advancedStats: {
      penaltyYardsPerGame: 78.3,
      penaltiesPerGame: 9.2,
      passInterferenceCalls: 0.7,
      holdingCalls: 2.8,
      avgPenaltiesHome: 4.4,
      avgPenaltiesAway: 4.8
    } as NFLRefStats
  },
  {
    name: 'Craig Wrolstad',
    sport: 'NFL',
    role: 'referee',
    yearsExperience: 8,
    homeCoverPct: 47.8,
    overPct: 53.2,
    avgTotalPoints: 47.1,
    advancedStats: {
      penaltyYardsPerGame: 105.8,
      penaltiesPerGame: 12.1,
      passInterferenceCalls: 1.4,
      holdingCalls: 4.1,
      avgPenaltiesHome: 5.8,
      avgPenaltiesAway: 6.3
    } as NFLRefStats
  },
  {
    name: 'Alex Kemp',
    sport: 'NFL',
    role: 'referee',
    yearsExperience: 7,
    homeCoverPct: 50.2,
    overPct: 50.8,
    avgTotalPoints: 45.5,
    advancedStats: {
      penaltyYardsPerGame: 92.1,
      penaltiesPerGame: 10.5,
      passInterferenceCalls: 1.0,
      holdingCalls: 3.4,
      avgPenaltiesHome: 5.1,
      avgPenaltiesAway: 5.4
    } as NFLRefStats
  },
  {
    name: 'Land Clark',
    sport: 'NFL',
    role: 'referee',
    yearsExperience: 6,
    homeCoverPct: 48.9,
    overPct: 56.3,
    avgTotalPoints: 49.2,
    advancedStats: {
      penaltyYardsPerGame: 108.5,
      penaltiesPerGame: 12.4,
      passInterferenceCalls: 1.5,
      holdingCalls: 4.2,
      avgPenaltiesHome: 6.0,
      avgPenaltiesAway: 6.4
    } as NFLRefStats
  },
  {
    name: 'Tra Blake',
    sport: 'NFL',
    role: 'referee',
    yearsExperience: 4,
    homeCoverPct: 51.5,
    overPct: 49.2,
    avgTotalPoints: 44.8,
    advancedStats: {
      penaltyYardsPerGame: 88.9,
      penaltiesPerGame: 10.1,
      passInterferenceCalls: 0.9,
      holdingCalls: 3.3,
      avgPenaltiesHome: 4.9,
      avgPenaltiesAway: 5.2
    } as NFLRefStats
  }
]

const NBA_REFEREES: Partial<Official>[] = [
  {
    name: 'Scott Foster',
    sport: 'NBA',
    role: 'referee',
    yearsExperience: 30,
    homeCoverPct: 46.2,
    overPct: 48.5,
    avgTotalPoints: 218.4,
    advancedStats: {
      foulsPerGame: 42.8,
      technicalFouls: 0.8,
      offensiveFouls: 4.2,
      shootingFouls: 28.5,
      freeThrowsPerGame: 44.2,
      avgFoulsHome: 20.8,
      avgFoulsAway: 22.0
    } as NBARefStats
  },
  {
    name: 'Tony Brothers',
    sport: 'NBA',
    role: 'referee',
    yearsExperience: 28,
    homeCoverPct: 52.8,
    overPct: 52.1,
    avgTotalPoints: 224.6,
    advancedStats: {
      foulsPerGame: 45.2,
      technicalFouls: 1.1,
      offensiveFouls: 4.8,
      shootingFouls: 30.2,
      freeThrowsPerGame: 48.5,
      avgFoulsHome: 21.5,
      avgFoulsAway: 23.7
    } as NBARefStats
  },
  {
    name: 'Marc Davis',
    sport: 'NBA',
    role: 'referee',
    yearsExperience: 25,
    homeCoverPct: 49.5,
    overPct: 50.2,
    avgTotalPoints: 220.8,
    advancedStats: {
      foulsPerGame: 43.5,
      technicalFouls: 0.6,
      offensiveFouls: 4.0,
      shootingFouls: 29.1,
      freeThrowsPerGame: 45.8,
      avgFoulsHome: 21.2,
      avgFoulsAway: 22.3
    } as NBARefStats
  },
  {
    name: 'Kane Fitzgerald',
    sport: 'NBA',
    role: 'referee',
    yearsExperience: 15,
    homeCoverPct: 50.8,
    overPct: 47.5,
    avgTotalPoints: 216.2,
    advancedStats: {
      foulsPerGame: 41.2,
      technicalFouls: 0.5,
      offensiveFouls: 3.8,
      shootingFouls: 27.8,
      freeThrowsPerGame: 42.1,
      avgFoulsHome: 20.1,
      avgFoulsAway: 21.1
    } as NBARefStats
  },
  {
    name: 'Ed Malloy',
    sport: 'NBA',
    role: 'referee',
    yearsExperience: 22,
    homeCoverPct: 48.2,
    overPct: 53.8,
    avgTotalPoints: 226.5,
    advancedStats: {
      foulsPerGame: 44.8,
      technicalFouls: 0.7,
      offensiveFouls: 4.5,
      shootingFouls: 29.8,
      freeThrowsPerGame: 47.2,
      avgFoulsHome: 21.8,
      avgFoulsAway: 23.0
    } as NBARefStats
  }
]

// =============================================================================
// MAIN API FUNCTIONS
// =============================================================================

/**
 * Get official by name and sport
 */
export async function getOfficialByName(name: string, sport: string): Promise<Official | null> {
  // First check database
  const { data } = await supabase
    .from('officials')
    .select('*')
    .eq('name', name)
    .eq('sport', sport.toUpperCase())
    .single()
  
  if (data) {
    return formatOfficialFromDB(data)
  }
  
  // Fall back to static data
  const staticOfficials = sport.toUpperCase() === 'NFL' ? NFL_REFEREES :
                          sport.toUpperCase() === 'NBA' ? NBA_REFEREES : []
  
  const found = staticOfficials.find(o => 
    o.name?.toLowerCase() === name.toLowerCase()
  )
  
  if (found) {
    return {
      id: `static-${found.name?.replace(/\s/g, '-').toLowerCase()}`,
      name: found.name!,
      sport: sport.toUpperCase(),
      role: found.role || 'referee',
      yearsExperience: found.yearsExperience || 0,
      gamesOfficiated: 0,
      homeTeamWins: 0,
      awayTeamWins: 0,
      homeCoverPct: found.homeCoverPct || 50,
      overPct: found.overPct || 50,
      avgTotalPoints: found.avgTotalPoints || 0,
      seasonGames: 0,
      seasonHomeCoverPct: found.homeCoverPct || 50,
      seasonOverPct: found.overPct || 50,
      advancedStats: found.advancedStats || {}
    }
  }
  
  return null
}

/**
 * Get all officials for a sport
 */
export async function getOfficialsBySport(sport: string): Promise<Official[]> {
  // First check database
  const { data } = await supabase
    .from('officials')
    .select('*')
    .eq('sport', sport.toUpperCase())
    .order('games_officiated', { ascending: false })
  
  if (data && data.length > 0) {
    return data.map(formatOfficialFromDB)
  }
  
  // Fall back to static data
  const staticOfficials = sport.toUpperCase() === 'NFL' ? NFL_REFEREES :
                          sport.toUpperCase() === 'NBA' ? NBA_REFEREES : []
  
  return staticOfficials.map(o => ({
    id: `static-${o.name?.replace(/\s/g, '-').toLowerCase()}`,
    name: o.name!,
    sport: sport.toUpperCase(),
    role: o.role || 'referee',
    yearsExperience: o.yearsExperience || 0,
    gamesOfficiated: 0,
    homeTeamWins: 0,
    awayTeamWins: 0,
    homeCoverPct: o.homeCoverPct || 50,
    overPct: o.overPct || 50,
    avgTotalPoints: o.avgTotalPoints || 0,
    seasonGames: 0,
    seasonHomeCoverPct: o.homeCoverPct || 50,
    seasonOverPct: o.overPct || 50,
    advancedStats: o.advancedStats || {}
  }))
}

/**
 * Get officials assigned to a specific game
 */
export async function getGameOfficials(gameId: string, sport: string): Promise<GameOfficials | null> {
  // Check game_officials junction table
  const { data: assignments } = await supabase
    .from('game_officials')
    .select(`
      role,
      officials (*)
    `)
    .eq('game_id', gameId)
  
  if (!assignments || assignments.length === 0) {
    // Return null if no officials assigned (they'll need to be fetched from another source)
    return null
  }
  
  const officials = assignments
    .filter(a => a.officials && !Array.isArray(a.officials))
    .map(a => ({
      official: formatOfficialFromDB(a.officials as unknown as Record<string, unknown>),
      role: a.role || 'official'
    }))
  
  // Calculate betting implications
  const bettingImplications = calculateBettingImplications(officials.map(o => o.official), sport)
  
  return {
    gameId,
    sport,
    officials,
    bettingImplications
  }
}

/**
 * Get betting implications for an official
 */
export function getOfficialBettingInsights(official: Official): string[] {
  const insights: string[] = []
  const sport = official.sport.toUpperCase()
  
  // Over/Under tendency
  if (official.overPct >= 55) {
    insights.push(`OVER tendency: ${official.overPct.toFixed(1)}% of games go OVER`)
  } else if (official.overPct <= 45) {
    insights.push(`UNDER tendency: ${(100 - official.overPct).toFixed(1)}% of games go UNDER`)
  }
  
  // Home cover tendency  
  if (official.homeCoverPct >= 55) {
    insights.push(`Home teams cover ${official.homeCoverPct.toFixed(1)}% with this official`)
  } else if (official.homeCoverPct <= 45) {
    insights.push(`Away teams cover ${(100 - official.homeCoverPct).toFixed(1)}% with this official`)
  }
  
  // Sport-specific insights
  if (sport === 'NFL') {
    const stats = official.advancedStats as NFLRefStats
    if (stats.penaltyYardsPerGame > 100) {
      insights.push(`High penalty yards (${stats.penaltyYardsPerGame.toFixed(1)}/game) - expect more stoppages`)
    } else if (stats.penaltyYardsPerGame < 85) {
      insights.push(`Low penalty yards (${stats.penaltyYardsPerGame.toFixed(1)}/game) - lets them play`)
    }
    
    if (stats.passInterferenceCalls > 1.2) {
      insights.push(`Above average PI calls - favors passing games`)
    }
  } else if (sport === 'NBA') {
    const stats = official.advancedStats as NBARefStats
    if (stats.foulsPerGame > 44) {
      insights.push(`High foul rate (${stats.foulsPerGame.toFixed(1)}/game) - more FTs`)
    } else if (stats.foulsPerGame < 41) {
      insights.push(`Low foul rate (${stats.foulsPerGame.toFixed(1)}/game) - physical game`)
    }
    
    if (stats.technicalFouls > 0.8) {
      insights.push(`Quick with technicals (${stats.technicalFouls.toFixed(1)}/game)`)
    }
  }
  
  return insights
}

/**
 * Calculate combined betting implications for a crew
 */
function calculateBettingImplications(officials: Official[], sport: string): {
  spreadTendency: 'home' | 'away' | 'neutral'
  totalTendency: 'over' | 'under' | 'neutral'
  keyInsights: string[]
  confidenceLevel: 'high' | 'medium' | 'low'
} {
  if (officials.length === 0) {
    return {
      spreadTendency: 'neutral',
      totalTendency: 'neutral',
      keyInsights: ['No official data available'],
      confidenceLevel: 'low'
    }
  }
  
  // Average the tendencies
  const avgHomeCover = officials.reduce((sum, o) => sum + o.homeCoverPct, 0) / officials.length
  const avgOverPct = officials.reduce((sum, o) => sum + o.overPct, 0) / officials.length
  
  const spreadTendency = avgHomeCover >= 54 ? 'home' : avgHomeCover <= 46 ? 'away' : 'neutral'
  const totalTendency = avgOverPct >= 54 ? 'over' : avgOverPct <= 46 ? 'under' : 'neutral'
  
  // Collect all insights
  const keyInsights: string[] = []
  for (const official of officials) {
    const insights = getOfficialBettingInsights(official)
    keyInsights.push(...insights.slice(0, 2)) // Take top 2 per official
  }
  
  // Determine confidence based on sample size
  const totalGames = officials.reduce((sum, o) => sum + o.gamesOfficiated, 0)
  const confidenceLevel = totalGames > 100 ? 'high' : totalGames > 30 ? 'medium' : 'low'
  
  return {
    spreadTendency,
    totalTendency,
    keyInsights: [...new Set(keyInsights)].slice(0, 5), // Unique, max 5
    confidenceLevel
  }
}

/**
 * Format official from database record
 */
function formatOfficialFromDB(data: Record<string, unknown>): Official {
  return {
    id: data.id as string,
    externalId: data.external_id as string | undefined,
    name: data.name as string,
    sport: data.sport as string,
    role: data.role as string,
    yearsExperience: data.years_experience as number || 0,
    gamesOfficiated: data.games_officiated as number || 0,
    homeTeamWins: data.home_team_wins as number || 0,
    awayTeamWins: data.away_team_wins as number || 0,
    homeCoverPct: data.home_cover_pct as number || 50,
    overPct: data.over_pct as number || 50,
    avgTotalPoints: data.avg_total_points as number || 0,
    seasonGames: data.season_games as number || 0,
    seasonHomeCoverPct: data.season_home_cover_pct as number || 50,
    seasonOverPct: data.season_over_pct as number || 50,
    advancedStats: (data.advanced_stats as SportSpecificOfficialStats) || {}
  }
}

/**
 * Get officials with highest over/under tendencies
 */
export async function getHighOverOfficials(sport: string, minGames: number = 20): Promise<Official[]> {
  const officials = await getOfficialsBySport(sport)
  return officials
    .filter(o => o.gamesOfficiated >= minGames || o.yearsExperience >= 3)
    .sort((a, b) => b.overPct - a.overPct)
    .slice(0, 10)
}

/**
 * Get officials with strongest home/away bias
 */
export async function getHomeFieldOfficials(sport: string, minGames: number = 20): Promise<Official[]> {
  const officials = await getOfficialsBySport(sport)
  return officials
    .filter(o => o.gamesOfficiated >= minGames || o.yearsExperience >= 3)
    .sort((a, b) => Math.abs(b.homeCoverPct - 50) - Math.abs(a.homeCoverPct - 50))
    .slice(0, 10)
}

/**
 * Search officials by name
 */
export async function searchOfficials(query: string, sport?: string): Promise<Official[]> {
  let dbQuery = supabase
    .from('officials')
    .select('*')
    .ilike('name', `%${query}%`)
  
  if (sport) {
    dbQuery = dbQuery.eq('sport', sport.toUpperCase())
  }
  
  const { data } = await dbQuery.limit(10)
  
  if (data && data.length > 0) {
    return data.map(formatOfficialFromDB)
  }
  
  // Search static data
  const allStatic = [...NFL_REFEREES, ...NBA_REFEREES]
  const matches = allStatic.filter(o => 
    o.name?.toLowerCase().includes(query.toLowerCase()) &&
    (!sport || o.sport?.toUpperCase() === sport.toUpperCase())
  )
  
  return matches.map(o => ({
    id: `static-${o.name?.replace(/\s/g, '-').toLowerCase()}`,
    name: o.name!,
    sport: o.sport || '',
    role: o.role || 'referee',
    yearsExperience: o.yearsExperience || 0,
    gamesOfficiated: 0,
    homeTeamWins: 0,
    awayTeamWins: 0,
    homeCoverPct: o.homeCoverPct || 50,
    overPct: o.overPct || 50,
    avgTotalPoints: o.avgTotalPoints || 0,
    seasonGames: 0,
    seasonHomeCoverPct: o.homeCoverPct || 50,
    seasonOverPct: o.overPct || 50,
    advancedStats: o.advancedStats || {}
  }))
}
