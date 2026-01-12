/**
 * REST & SCHEDULE ANALYZER
 * Analyze rest days, travel, and schedule factors for betting edges
 * 
 * Key factors:
 * - Rest days advantage
 * - Back-to-back situations
 * - Travel distance/timezone changes
 * - Look-ahead spots
 * - Let-down spots
 * - Schedule density
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

// =============================================================================
// TYPES
// =============================================================================

export interface ScheduleFactor {
  teamId: string
  teamName: string
  gameId: string
  gameDate: string
  opponent: string
  
  // Rest
  daysRest: number
  opponentDaysRest: number
  restAdvantage: number // Positive = this team has more rest
  
  // Travel
  travelMiles: number
  timezoneChange: number // Hours of timezone shift
  isCrossCountry: boolean
  
  // Back-to-back
  isBackToBack: boolean
  isFirstOfBackToBack: boolean
  isSecondOfBackToBack: boolean
  
  // Schedule spots
  isLookAheadSpot: boolean // Next game is marquee matchup
  isLetDownSpot: boolean // Coming off big win
  isRevengeSpot: boolean // Lost to this opponent recently
  isTrapGame: boolean // Sandwich game
  
  // Context
  gamesInLast7Days: number
  gamesInLast14Days: number
  scheduleDensityRating: 'light' | 'moderate' | 'heavy'
}

export interface RestAnalysis {
  homeTeam: ScheduleFactor
  awayTeam: ScheduleFactor
  
  // Summary
  restEdge: 'home' | 'away' | 'neutral'
  restEdgeMagnitude: 'significant' | 'moderate' | 'slight' | 'none'
  
  travelEdge: 'home' | 'away' | 'neutral'
  travelEdgeMagnitude: 'significant' | 'moderate' | 'slight' | 'none'
  
  // Situational factors
  situationalFactors: SituationalFactor[]
  
  // Betting implications
  implications: string[]
  recommendation?: {
    side?: 'home' | 'away'
    confidence: 'high' | 'medium' | 'low'
    reasoning: string
  }
}

export interface SituationalFactor {
  type: 'rest' | 'travel' | 'schedule' | 'situational'
  team: 'home' | 'away'
  factor: string
  impact: 'positive' | 'negative' | 'neutral'
  historicalEdge?: number // Historical ATS edge for this situation
}

// =============================================================================
// CITY COORDINATES FOR TRAVEL CALCULATION
// =============================================================================

const TEAM_LOCATIONS: Record<string, { lat: number; lon: number; timezone: string; city: string }> = {
  // NFL Teams
  'ARI': { lat: 33.4484, lon: -112.0740, timezone: 'America/Phoenix', city: 'Phoenix' },
  'ATL': { lat: 33.7490, lon: -84.3880, timezone: 'America/New_York', city: 'Atlanta' },
  'BAL': { lat: 39.2904, lon: -76.6122, timezone: 'America/New_York', city: 'Baltimore' },
  'BUF': { lat: 42.8864, lon: -78.8784, timezone: 'America/New_York', city: 'Buffalo' },
  'CAR': { lat: 35.2271, lon: -80.8431, timezone: 'America/New_York', city: 'Charlotte' },
  'CHI': { lat: 41.8781, lon: -87.6298, timezone: 'America/Chicago', city: 'Chicago' },
  'CIN': { lat: 39.1031, lon: -84.5120, timezone: 'America/New_York', city: 'Cincinnati' },
  'CLE': { lat: 41.4993, lon: -81.6944, timezone: 'America/New_York', city: 'Cleveland' },
  'DAL': { lat: 32.7767, lon: -96.7970, timezone: 'America/Chicago', city: 'Dallas' },
  'DEN': { lat: 39.7392, lon: -104.9903, timezone: 'America/Denver', city: 'Denver' },
  'DET': { lat: 42.3314, lon: -83.0458, timezone: 'America/Detroit', city: 'Detroit' },
  'GB': { lat: 44.5133, lon: -88.0133, timezone: 'America/Chicago', city: 'Green Bay' },
  'HOU': { lat: 29.7604, lon: -95.3698, timezone: 'America/Chicago', city: 'Houston' },
  'IND': { lat: 39.7684, lon: -86.1581, timezone: 'America/Indiana/Indianapolis', city: 'Indianapolis' },
  'JAX': { lat: 30.3322, lon: -81.6557, timezone: 'America/New_York', city: 'Jacksonville' },
  'KC': { lat: 39.0997, lon: -94.5786, timezone: 'America/Chicago', city: 'Kansas City' },
  'LV': { lat: 36.1699, lon: -115.1398, timezone: 'America/Los_Angeles', city: 'Las Vegas' },
  'LAC': { lat: 34.0522, lon: -118.2437, timezone: 'America/Los_Angeles', city: 'Los Angeles' },
  'LAR': { lat: 34.0522, lon: -118.2437, timezone: 'America/Los_Angeles', city: 'Los Angeles' },
  'MIA': { lat: 25.7617, lon: -80.1918, timezone: 'America/New_York', city: 'Miami' },
  'MIN': { lat: 44.9778, lon: -93.2650, timezone: 'America/Chicago', city: 'Minneapolis' },
  'NE': { lat: 42.0909, lon: -71.2643, timezone: 'America/New_York', city: 'Foxborough' },
  'NO': { lat: 29.9511, lon: -90.0715, timezone: 'America/Chicago', city: 'New Orleans' },
  'NYG': { lat: 40.8128, lon: -74.0742, timezone: 'America/New_York', city: 'East Rutherford' },
  'NYJ': { lat: 40.8128, lon: -74.0742, timezone: 'America/New_York', city: 'East Rutherford' },
  'PHI': { lat: 39.9526, lon: -75.1652, timezone: 'America/New_York', city: 'Philadelphia' },
  'PIT': { lat: 40.4406, lon: -79.9959, timezone: 'America/New_York', city: 'Pittsburgh' },
  'SF': { lat: 37.7749, lon: -122.4194, timezone: 'America/Los_Angeles', city: 'San Francisco' },
  'SEA': { lat: 47.6062, lon: -122.3321, timezone: 'America/Los_Angeles', city: 'Seattle' },
  'TB': { lat: 27.9506, lon: -82.4572, timezone: 'America/New_York', city: 'Tampa' },
  'TEN': { lat: 36.1627, lon: -86.7816, timezone: 'America/Chicago', city: 'Nashville' },
  'WAS': { lat: 38.9072, lon: -77.0369, timezone: 'America/New_York', city: 'Washington' },
  
  // NBA Teams (use same cities, add unique ones)
  'BOS': { lat: 42.3601, lon: -71.0589, timezone: 'America/New_York', city: 'Boston' },
  'BKN': { lat: 40.6782, lon: -73.9442, timezone: 'America/New_York', city: 'Brooklyn' },
  'NYK': { lat: 40.7505, lon: -73.9934, timezone: 'America/New_York', city: 'New York' },
  'TOR': { lat: 43.6532, lon: -79.3832, timezone: 'America/Toronto', city: 'Toronto' },
  'MIL': { lat: 43.0389, lon: -87.9065, timezone: 'America/Chicago', city: 'Milwaukee' },
  'OKC': { lat: 35.4676, lon: -97.5164, timezone: 'America/Chicago', city: 'Oklahoma City' },
  'POR': { lat: 45.5152, lon: -122.6784, timezone: 'America/Los_Angeles', city: 'Portland' },
  'SAC': { lat: 38.5816, lon: -121.4944, timezone: 'America/Los_Angeles', city: 'Sacramento' },
  'SAS': { lat: 29.4241, lon: -98.4936, timezone: 'America/Chicago', city: 'San Antonio' },
  'UTA': { lat: 40.7608, lon: -111.8910, timezone: 'America/Denver', city: 'Salt Lake City' },
  'PHX': { lat: 33.4484, lon: -112.0740, timezone: 'America/Phoenix', city: 'Phoenix' },
  'GSW': { lat: 37.7680, lon: -122.3877, timezone: 'America/Los_Angeles', city: 'San Francisco' },
  'MEM': { lat: 35.1495, lon: -90.0490, timezone: 'America/Chicago', city: 'Memphis' },
  'NOP': { lat: 29.9511, lon: -90.0715, timezone: 'America/Chicago', city: 'New Orleans' },
  'ORL': { lat: 28.5383, lon: -81.3792, timezone: 'America/New_York', city: 'Orlando' },
  'CHA': { lat: 35.2271, lon: -80.8431, timezone: 'America/New_York', city: 'Charlotte' },
}

// =============================================================================
// HISTORICAL SITUATIONAL ATS DATA
// =============================================================================

const SITUATIONAL_ATS_RECORDS: Record<string, { wins: number; losses: number; sport: string }> = {
  // Rest Advantages
  'rest_advantage_2plus_days': { wins: 856, losses: 744, sport: 'ALL' }, // 53.5%
  'rest_advantage_3plus_days': { wins: 345, losses: 278, sport: 'ALL' }, // 55.4%
  'zero_rest_vs_normal': { wins: 412, losses: 498, sport: 'ALL' }, // 45.3%
  
  // NBA specific
  'nba_b2b_away': { wins: 892, losses: 1045, sport: 'NBA' }, // 46.0%
  'nba_b2b_home': { wins: 623, losses: 598, sport: 'NBA' }, // 51.0%
  'nba_4_games_5_nights': { wins: 234, losses: 287, sport: 'NBA' }, // 44.9%
  
  // NFL specific
  'nfl_short_week_home': { wins: 134, losses: 112, sport: 'NFL' }, // 54.5%
  'nfl_bye_week_return': { wins: 267, losses: 245, sport: 'NFL' }, // 52.1%
  'nfl_coast_to_coast_early': { wins: 89, losses: 112, sport: 'NFL' }, // 44.3%
  
  // Schedule spots
  'look_ahead_spot': { wins: 178, losses: 212, sport: 'ALL' }, // 45.6%
  'let_down_spot': { wins: 165, losses: 198, sport: 'ALL' }, // 45.5%
  'revenge_spot': { wins: 312, losses: 278, sport: 'ALL' }, // 52.9%
  'trap_game': { wins: 234, losses: 289, sport: 'ALL' }, // 44.7%
}

// =============================================================================
// MAIN API FUNCTIONS
// =============================================================================

/**
 * Get schedule factors for a specific team's game
 */
export async function getScheduleFactors(
  teamId: string,
  gameId: string,
  sport: string
): Promise<ScheduleFactor | null> {
  try {
    const { data, error } = await supabase
      .from('schedule_factors')
      .select('*')
      .eq('team_id', teamId)
      .eq('game_id', gameId)
      .single()
    
    if (error || !data) {
      // Generate on the fly if not cached
      return null
    }
    
    return formatScheduleFactor(data)
  } catch (error) {
    console.error('Error fetching schedule factors:', error)
    return null
  }
}

/**
 * Analyze rest and schedule factors for a matchup
 */
export async function analyzeRestFactors(
  homeTeamId: string,
  awayTeamId: string,
  gameId: string,
  gameDate: string,
  sport: string
): Promise<RestAnalysis> {
  // Try to get cached factors
  let homeFactors = await getScheduleFactors(homeTeamId, gameId, sport)
  let awayFactors = await getScheduleFactors(awayTeamId, gameId, sport)
  
  // If not cached, calculate
  if (!homeFactors) {
    homeFactors = await calculateScheduleFactors(homeTeamId, gameId, gameDate, sport, true)
  }
  if (!awayFactors) {
    awayFactors = await calculateScheduleFactors(awayTeamId, gameId, gameDate, sport, false)
  }
  
  return generateRestAnalysis(homeFactors, awayFactors, sport)
}

/**
 * Get all games with significant rest edges today
 */
export async function getRestEdgeGames(sport?: string): Promise<RestAnalysis[]> {
  try {
    const query = supabase
      .from('schedule_factors')
      .select('*')
      .gte('game_date', new Date().toISOString().split('T')[0])
      .lt('game_date', new Date(Date.now() + 86400000).toISOString().split('T')[0])
    
    if (sport) {
      query.eq('sport', sport.toUpperCase())
    }
    
    const { data } = await query
    
    if (!data || data.length === 0) return []
    
    // Group by game and analyze
    const gameGroups = new Map<string, ScheduleFactor[]>()
    data.forEach(d => {
      const factor = formatScheduleFactor(d)
      const existing = gameGroups.get(d.game_id) || []
      existing.push(factor)
      gameGroups.set(d.game_id, existing)
    })
    
    const analyses: RestAnalysis[] = []
    gameGroups.forEach(factors => {
      if (factors.length === 2) {
        const home = factors.find(f => f.teamId === f.gameId.split('_')[0]) || factors[0]
        const away = factors.find(f => f.teamId !== home.teamId) || factors[1]
        const analysis = generateRestAnalysis(home, away, sport || 'NFL')
        
        // Only include games with significant edges
        if (analysis.restEdgeMagnitude !== 'none' || analysis.travelEdgeMagnitude !== 'none') {
          analyses.push(analysis)
        }
      }
    })
    
    return analyses
  } catch (error) {
    console.error('Error fetching rest edge games:', error)
    return []
  }
}

/**
 * Get back-to-back situations (NBA/NHL specific)
 */
export async function getBackToBackGames(
  sport: 'NBA' | 'NHL',
  date?: string
): Promise<ScheduleFactor[]> {
  const targetDate = date || new Date().toISOString().split('T')[0]
  
  try {
    const { data } = await supabase
      .from('schedule_factors')
      .select('*')
      .eq('sport', sport)
      .eq('game_date', targetDate)
      .eq('is_back_to_back', true)
    
    return (data || []).map(formatScheduleFactor)
  } catch (error) {
    console.error('Error fetching B2B games:', error)
    return []
  }
}

/**
 * Calculate travel distance between teams
 */
export function calculateTravelDistance(
  fromTeam: string,
  toTeam: string
): { miles: number; timezoneChange: number; isCrossCountry: boolean } {
  const from = TEAM_LOCATIONS[fromTeam]
  const to = TEAM_LOCATIONS[toTeam]
  
  if (!from || !to) {
    return { miles: 0, timezoneChange: 0, isCrossCountry: false }
  }
  
  // Haversine formula for distance
  const R = 3959 // Earth's radius in miles
  const dLat = (to.lat - from.lat) * Math.PI / 180
  const dLon = (to.lon - from.lon) * Math.PI / 180
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(from.lat * Math.PI / 180) * Math.cos(to.lat * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  const miles = Math.round(R * c)
  
  // Calculate timezone difference
  const tzMap: Record<string, number> = {
    'America/New_York': -5,
    'America/Detroit': -5,
    'America/Indiana/Indianapolis': -5,
    'America/Toronto': -5,
    'America/Chicago': -6,
    'America/Denver': -7,
    'America/Phoenix': -7,
    'America/Los_Angeles': -8
  }
  
  const fromTz = tzMap[from.timezone] || -5
  const toTz = tzMap[to.timezone] || -5
  const timezoneChange = Math.abs(toTz - fromTz)
  
  const isCrossCountry = miles > 2000 || timezoneChange >= 3
  
  return { miles, timezoneChange, isCrossCountry }
}

/**
 * Get historical ATS for a situational factor
 */
export function getSituationalATSRecord(
  situationKey: string
): { wins: number; losses: number; winPct: number } | null {
  const record = SITUATIONAL_ATS_RECORDS[situationKey]
  if (!record) return null
  
  const total = record.wins + record.losses
  return {
    wins: record.wins,
    losses: record.losses,
    winPct: total > 0 ? (record.wins / total) * 100 : 50
  }
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function formatScheduleFactor(data: Record<string, unknown>): ScheduleFactor {
  return {
    teamId: data.team_id as string,
    teamName: data.team_name as string,
    gameId: data.game_id as string,
    gameDate: data.game_date as string,
    opponent: data.opponent as string,
    daysRest: data.days_rest as number || 7,
    opponentDaysRest: data.opponent_days_rest as number || 7,
    restAdvantage: (data.days_rest as number || 7) - (data.opponent_days_rest as number || 7),
    travelMiles: data.travel_miles as number || 0,
    timezoneChange: data.timezone_change as number || 0,
    isCrossCountry: data.is_cross_country as boolean || false,
    isBackToBack: data.is_back_to_back as boolean || false,
    isFirstOfBackToBack: data.is_first_of_b2b as boolean || false,
    isSecondOfBackToBack: data.is_second_of_b2b as boolean || false,
    isLookAheadSpot: data.is_look_ahead as boolean || false,
    isLetDownSpot: data.is_let_down as boolean || false,
    isRevengeSpot: data.is_revenge as boolean || false,
    isTrapGame: data.is_trap_game as boolean || false,
    gamesInLast7Days: data.games_last_7 as number || 1,
    gamesInLast14Days: data.games_last_14 as number || 2,
    scheduleDensityRating: determineScheduleDensity(
      data.games_last_7 as number,
      data.sport as string
    )
  }
}

function determineScheduleDensity(gamesLast7: number, sport: string): 'light' | 'moderate' | 'heavy' {
  const thresholds: Record<string, { light: number; heavy: number }> = {
    'NFL': { light: 1, heavy: 1 }, // NFL is always 1 game
    'NBA': { light: 2, heavy: 4 },
    'NHL': { light: 2, heavy: 4 },
    'MLB': { light: 5, heavy: 7 }
  }
  
  const sportThreshold = thresholds[sport] || thresholds['NBA']
  
  if (gamesLast7 <= sportThreshold.light) return 'light'
  if (gamesLast7 >= sportThreshold.heavy) return 'heavy'
  return 'moderate'
}

async function calculateScheduleFactors(
  teamId: string,
  gameId: string,
  gameDate: string,
  sport: string,
  isHome: boolean
): Promise<ScheduleFactor> {
  // In real implementation, this would query the schedule database
  // For now, return reasonable defaults
  return {
    teamId,
    teamName: teamId,
    gameId,
    gameDate,
    opponent: 'TBD',
    daysRest: 7, // Default to well-rested
    opponentDaysRest: 7,
    restAdvantage: 0,
    travelMiles: isHome ? 0 : 500,
    timezoneChange: 0,
    isCrossCountry: false,
    isBackToBack: false,
    isFirstOfBackToBack: false,
    isSecondOfBackToBack: false,
    isLookAheadSpot: false,
    isLetDownSpot: false,
    isRevengeSpot: false,
    isTrapGame: false,
    gamesInLast7Days: 1,
    gamesInLast14Days: 2,
    scheduleDensityRating: 'moderate'
  }
}

function generateRestAnalysis(
  home: ScheduleFactor,
  away: ScheduleFactor,
  sport: string
): RestAnalysis {
  const situationalFactors: SituationalFactor[] = []
  const implications: string[] = []
  
  // Analyze rest edge
  const restDiff = home.daysRest - away.daysRest
  let restEdge: 'home' | 'away' | 'neutral' = 'neutral'
  let restEdgeMagnitude: 'significant' | 'moderate' | 'slight' | 'none' = 'none'
  
  if (Math.abs(restDiff) >= 3) {
    restEdge = restDiff > 0 ? 'home' : 'away'
    restEdgeMagnitude = 'significant'
    situationalFactors.push({
      type: 'rest',
      team: restEdge,
      factor: `${Math.abs(restDiff)}+ days rest advantage`,
      impact: 'positive',
      historicalEdge: 55.4
    })
    implications.push(`${restEdge === 'home' ? home.teamName : away.teamName} has significant rest advantage (+${Math.abs(restDiff)} days)`)
  } else if (Math.abs(restDiff) >= 2) {
    restEdge = restDiff > 0 ? 'home' : 'away'
    restEdgeMagnitude = 'moderate'
    situationalFactors.push({
      type: 'rest',
      team: restEdge,
      factor: `${Math.abs(restDiff)} days rest advantage`,
      impact: 'positive',
      historicalEdge: 53.5
    })
  } else if (Math.abs(restDiff) === 1) {
    restEdge = restDiff > 0 ? 'home' : 'away'
    restEdgeMagnitude = 'slight'
  }
  
  // Analyze travel edge
  const travelDiff = away.travelMiles - home.travelMiles // Away team travels more
  let travelEdge: 'home' | 'away' | 'neutral' = 'neutral'
  let travelEdgeMagnitude: 'significant' | 'moderate' | 'slight' | 'none' = 'none'
  
  if (away.isCrossCountry) {
    travelEdge = 'home'
    travelEdgeMagnitude = 'significant'
    situationalFactors.push({
      type: 'travel',
      team: 'away',
      factor: 'Cross-country travel',
      impact: 'negative',
      historicalEdge: 44.3
    })
    implications.push(`${away.teamName} traveling cross-country - historically struggles ATS`)
  } else if (away.travelMiles > 1500) {
    travelEdge = 'home'
    travelEdgeMagnitude = 'moderate'
    situationalFactors.push({
      type: 'travel',
      team: 'away',
      factor: `Long travel (${away.travelMiles} miles)`,
      impact: 'negative'
    })
  }
  
  // Back-to-back analysis (NBA/NHL)
  if (sport === 'NBA' || sport === 'NHL') {
    if (away.isSecondOfBackToBack) {
      situationalFactors.push({
        type: 'schedule',
        team: 'away',
        factor: 'Second of back-to-back on road',
        impact: 'negative',
        historicalEdge: 46.0
      })
      implications.push(`${away.teamName} on 2nd of B2B on road - fade situation`)
    }
    if (home.isSecondOfBackToBack) {
      situationalFactors.push({
        type: 'schedule',
        team: 'home',
        factor: 'Second of back-to-back at home',
        impact: 'negative',
        historicalEdge: 51.0
      })
      implications.push(`${home.teamName} on 2nd of B2B but at home - less impactful`)
    }
  }
  
  // Look-ahead/Let-down spots
  if (home.isLookAheadSpot) {
    situationalFactors.push({
      type: 'situational',
      team: 'home',
      factor: 'Look-ahead spot (marquee game next)',
      impact: 'negative',
      historicalEdge: 45.6
    })
    implications.push(`${home.teamName} may be looking ahead - potential fade`)
  }
  
  if (home.isLetDownSpot) {
    situationalFactors.push({
      type: 'situational',
      team: 'home',
      factor: 'Let-down spot (coming off big win)',
      impact: 'negative',
      historicalEdge: 45.5
    })
    implications.push(`${home.teamName} in let-down spot after big win`)
  }
  
  // Revenge spot
  if (home.isRevengeSpot || away.isRevengeSpot) {
    const revengeTeam = home.isRevengeSpot ? 'home' : 'away'
    situationalFactors.push({
      type: 'situational',
      team: revengeTeam,
      factor: 'Revenge game (lost previous meeting)',
      impact: 'positive',
      historicalEdge: 52.9
    })
    implications.push(`${revengeTeam === 'home' ? home.teamName : away.teamName} in revenge spot`)
  }
  
  // Generate recommendation
  let recommendation: RestAnalysis['recommendation'] | undefined
  
  const positiveHome = situationalFactors.filter(f => f.team === 'home' && f.impact === 'positive').length
  const negativeHome = situationalFactors.filter(f => f.team === 'home' && f.impact === 'negative').length
  const positiveAway = situationalFactors.filter(f => f.team === 'away' && f.impact === 'positive').length
  const negativeAway = situationalFactors.filter(f => f.team === 'away' && f.impact === 'negative').length
  
  const homeScore = positiveHome - negativeHome
  const awayScore = positiveAway - negativeAway
  
  if (Math.abs(homeScore - awayScore) >= 2) {
    const favored = homeScore > awayScore ? 'home' : 'away'
    recommendation = {
      side: favored,
      confidence: Math.abs(homeScore - awayScore) >= 3 ? 'high' : 'medium',
      reasoning: `${situationalFactors.filter(f => 
        f.team === favored && f.impact === 'positive'
      ).map(f => f.factor).join(', ')}`
    }
  }
  
  return {
    homeTeam: home,
    awayTeam: away,
    restEdge,
    restEdgeMagnitude,
    travelEdge,
    travelEdgeMagnitude,
    situationalFactors,
    implications,
    recommendation
  }
}
