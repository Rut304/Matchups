/**
 * PLAYER PROPS DATA LAYER
 * Prop lines from multiple sportsbooks with historical performance
 * 
 * Data Sources:
 * - The Odds API (player props markets)
 * - ESPN (player stats)
 * - Supabase (cached props, historical data)
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

// =============================================================================
// TYPES
// =============================================================================

export interface PropLine {
  book: string
  line: number
  overOdds: number
  underOdds: number
  lastUpdate: string
}

export interface PlayerProp {
  // Identifiers
  gameId: string
  sport: string
  playerId: string
  playerName: string
  playerTeam: string
  playerPosition: string
  playerHeadshot?: string
  
  // Prop details
  propType: string // 'passing_yards', 'rushing_yards', 'points', etc.
  propCategory: string // 'passing', 'rushing', 'scoring', etc.
  displayName: string // "Patrick Mahomes - Passing Yards"
  
  // Lines from different books
  lines: PropLine[]
  
  // Best lines
  bestOver: { book: string; line: number; odds: number } | null
  bestUnder: { book: string; line: number; odds: number } | null
  consensusLine: number
  
  // Historical performance
  seasonAvg: number
  last5Avg: number
  last10Avg: number
  hitRateSeason: number // % of games player went over this line
  hitRateLast5: number
  
  // vs Opponent
  vsOpponentAvg: number | null
  vsOpponentGames: number
  
  // Movement
  openingLine: number | null
  lineMovement: number // Current - Opening
  
  // Analysis
  edgeIndicator: 'over' | 'under' | 'neutral'
  confidenceScore: number // 1-100
  keyFactors: string[]
}

export interface PropComparison {
  propType: string
  displayName: string
  players: {
    playerId: string
    playerName: string
    team: string
    line: number
    seasonAvg: number
    hitRate: number
    edge: 'over' | 'under' | 'neutral'
  }[]
}

// Prop type configurations per sport
export const PROP_TYPES: Record<string, {
  category: string
  displayName: string
  unit: string
  defaultLine: number
}[]> = {
  NFL: [
    { category: 'passing', displayName: 'Passing Yards', unit: 'yards', defaultLine: 250 },
    { category: 'passing', displayName: 'Passing TDs', unit: 'TDs', defaultLine: 1.5 },
    { category: 'passing', displayName: 'Completions', unit: 'completions', defaultLine: 22.5 },
    { category: 'passing', displayName: 'Pass Attempts', unit: 'attempts', defaultLine: 34.5 },
    { category: 'passing', displayName: 'Interceptions', unit: 'INTs', defaultLine: 0.5 },
    { category: 'rushing', displayName: 'Rushing Yards', unit: 'yards', defaultLine: 50 },
    { category: 'rushing', displayName: 'Rushing Attempts', unit: 'carries', defaultLine: 12.5 },
    { category: 'rushing', displayName: 'Rushing TDs', unit: 'TDs', defaultLine: 0.5 },
    { category: 'receiving', displayName: 'Receiving Yards', unit: 'yards', defaultLine: 50 },
    { category: 'receiving', displayName: 'Receptions', unit: 'receptions', defaultLine: 4.5 },
    { category: 'receiving', displayName: 'Receiving TDs', unit: 'TDs', defaultLine: 0.5 },
    { category: 'defense', displayName: 'Tackles + Assists', unit: 'tackles', defaultLine: 5.5 },
    { category: 'defense', displayName: 'Sacks', unit: 'sacks', defaultLine: 0.5 },
  ],
  NBA: [
    { category: 'scoring', displayName: 'Points', unit: 'points', defaultLine: 20.5 },
    { category: 'rebounding', displayName: 'Rebounds', unit: 'rebounds', defaultLine: 6.5 },
    { category: 'assists', displayName: 'Assists', unit: 'assists', defaultLine: 5.5 },
    { category: 'scoring', displayName: 'Pts + Reb + Ast', unit: 'PRA', defaultLine: 30.5 },
    { category: 'scoring', displayName: 'Pts + Rebounds', unit: 'P+R', defaultLine: 25.5 },
    { category: 'scoring', displayName: 'Pts + Assists', unit: 'P+A', defaultLine: 25.5 },
    { category: 'defense', displayName: 'Steals', unit: 'steals', defaultLine: 1.5 },
    { category: 'defense', displayName: 'Blocks', unit: 'blocks', defaultLine: 0.5 },
    { category: 'other', displayName: 'Turnovers', unit: 'TOs', defaultLine: 2.5 },
    { category: 'scoring', displayName: '3-Pointers Made', unit: '3PM', defaultLine: 2.5 },
  ],
  MLB: [
    { category: 'hitting', displayName: 'Hits', unit: 'hits', defaultLine: 0.5 },
    { category: 'hitting', displayName: 'Total Bases', unit: 'bases', defaultLine: 1.5 },
    { category: 'hitting', displayName: 'RBIs', unit: 'RBIs', defaultLine: 0.5 },
    { category: 'hitting', displayName: 'Runs Scored', unit: 'runs', defaultLine: 0.5 },
    { category: 'hitting', displayName: 'Home Runs', unit: 'HRs', defaultLine: 0.5 },
    { category: 'hitting', displayName: 'Walks', unit: 'walks', defaultLine: 0.5 },
    { category: 'hitting', displayName: 'Stolen Bases', unit: 'SBs', defaultLine: 0.5 },
    { category: 'pitching', displayName: 'Strikeouts', unit: 'Ks', defaultLine: 5.5 },
    { category: 'pitching', displayName: 'Earned Runs', unit: 'ERs', defaultLine: 2.5 },
    { category: 'pitching', displayName: 'Hits Allowed', unit: 'hits', defaultLine: 5.5 },
    { category: 'pitching', displayName: 'Outs Recorded', unit: 'outs', defaultLine: 15.5 },
  ],
  NHL: [
    { category: 'scoring', displayName: 'Points', unit: 'points', defaultLine: 0.5 },
    { category: 'scoring', displayName: 'Goals', unit: 'goals', defaultLine: 0.5 },
    { category: 'scoring', displayName: 'Assists', unit: 'assists', defaultLine: 0.5 },
    { category: 'offense', displayName: 'Shots on Goal', unit: 'SOG', defaultLine: 3.5 },
    { category: 'defense', displayName: 'Blocked Shots', unit: 'blocks', defaultLine: 1.5 },
    { category: 'goalie', displayName: 'Saves', unit: 'saves', defaultLine: 25.5 },
    { category: 'goalie', displayName: 'Goals Against', unit: 'GA', defaultLine: 2.5 },
  ],
}

// =============================================================================
// MAIN API FUNCTIONS
// =============================================================================

/**
 * Get all props for a game
 */
export async function getGameProps(gameId: string, sport: string): Promise<PlayerProp[]> {
  try {
    // Try to get from database first
    const { data } = await supabase
      .from('player_props')
      .select('*')
      .eq('game_id', gameId)
      .order('prop_type', { ascending: true })
    
    if (data && data.length > 0) {
      return data.map(formatPlayerProp)
    }
    
    // If not in DB, try to fetch from The Odds API
    const apiProps = await fetchPropsFromOddsAPI(gameId, sport)
    return apiProps
  } catch (error) {
    console.error('Error fetching game props:', error)
    return []
  }
}

/**
 * Get props for a specific player
 */
export async function getPlayerProps(playerId: string, sport: string): Promise<PlayerProp[]> {
  try {
    const { data } = await supabase
      .from('player_props')
      .select('*')
      .eq('player_id', playerId)
      .order('recorded_at', { ascending: false })
      .limit(20)
    
    if (data && data.length > 0) {
      return data.map(formatPlayerProp)
    }
    
    return []
  } catch (error) {
    console.error('Error fetching player props:', error)
    return []
  }
}

/**
 * Get props by type across all games (e.g., all passing yards props)
 */
export async function getPropsByType(propType: string, sport: string): Promise<PlayerProp[]> {
  try {
    const { data } = await supabase
      .from('player_props')
      .select('*')
      .eq('sport', sport.toUpperCase())
      .eq('prop_type', propType)
      .gte('recorded_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .order('player_name', { ascending: true })
    
    if (data && data.length > 0) {
      return data.map(formatPlayerProp)
    }
    
    return []
  } catch (error) {
    console.error('Error fetching props by type:', error)
    return []
  }
}

/**
 * Compare prop across books for best line
 */
export function findBestPropLine(
  prop: PlayerProp,
  betType: 'over' | 'under'
): { book: string; line: number; odds: number } | null {
  if (!prop.lines || prop.lines.length === 0) return null
  
  if (betType === 'over') {
    // For OVER, we want lowest line with best odds
    let best: { book: string; line: number; odds: number } | null = null
    
    for (const line of prop.lines) {
      if (!best || 
          line.line < best.line || 
          (line.line === best.line && line.overOdds > best.odds)) {
        best = { book: line.book, line: line.line, odds: line.overOdds }
      }
    }
    
    return best
  } else {
    // For UNDER, we want highest line with best odds
    let best: { book: string; line: number; odds: number } | null = null
    
    for (const line of prop.lines) {
      if (!best || 
          line.line > best.line || 
          (line.line === best.line && line.underOdds > best.odds)) {
        best = { book: line.book, line: line.line, odds: line.underOdds }
      }
    }
    
    return best
  }
}

/**
 * Get prop value picks (props with significant edge)
 */
export async function getPropValuePicks(sport: string): Promise<{
  prop: PlayerProp
  edge: 'over' | 'under'
  reasons: string[]
}[]> {
  const valuePicks: { prop: PlayerProp; edge: 'over' | 'under'; reasons: string[] }[] = []
  
  try {
    const { data } = await supabase
      .from('player_props')
      .select('*')
      .eq('sport', sport.toUpperCase())
      .gte('recorded_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
    
    if (!data) return []
    
    for (const propData of data) {
      const prop = formatPlayerProp(propData)
      
      // Check for value
      const { edge, factors: reasons } = analyzeProValue(prop)
      
      if (edge !== 'neutral' && reasons.length >= 2) {
        valuePicks.push({ prop, edge, reasons })
      }
    }
    
    // Sort by confidence
    return valuePicks.sort((a, b) => b.prop.confidenceScore - a.prop.confidenceScore)
  } catch (error) {
    console.error('Error fetching prop value picks:', error)
    return []
  }
}

/**
 * Get hot prop trends (props with significant line movement)
 */
export async function getHotPropTrends(sport: string): Promise<PlayerProp[]> {
  try {
    const { data } = await supabase
      .from('player_props')
      .select('*')
      .eq('sport', sport.toUpperCase())
      .gte('recorded_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .not('opening_line', 'is', null)
    
    if (!data) return []
    
    return data
      .map(formatPlayerProp)
      .filter(prop => Math.abs(prop.lineMovement) >= 1) // At least 1 point movement
      .sort((a, b) => Math.abs(b.lineMovement) - Math.abs(a.lineMovement))
      .slice(0, 10)
  } catch (error) {
    console.error('Error fetching hot prop trends:', error)
    return []
  }
}

/**
 * Compare same prop across multiple players
 */
export async function comparePropAcrossPlayers(
  gameId: string,
  propType: string
): Promise<PropComparison | null> {
  try {
    const { data } = await supabase
      .from('player_props')
      .select('*')
      .eq('game_id', gameId)
      .eq('prop_type', propType)
    
    if (!data || data.length === 0) return null
    
    const props = data.map(formatPlayerProp)
    const propConfig = Object.values(PROP_TYPES)
      .flat()
      .find(p => p.displayName.toLowerCase().replace(/\s/g, '_') === propType)
    
    return {
      propType,
      displayName: propConfig?.displayName || propType,
      players: props.map(prop => ({
        playerId: prop.playerId,
        playerName: prop.playerName,
        team: prop.playerTeam,
        line: prop.consensusLine,
        seasonAvg: prop.seasonAvg,
        hitRate: prop.hitRateSeason,
        edge: prop.edgeIndicator
      }))
    }
  } catch (error) {
    console.error('Error comparing props:', error)
    return null
  }
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function formatPlayerProp(data: Record<string, unknown>): PlayerProp {
  const lines = (data.lines as PropLine[]) || []
  const seasonAvg = (data.season_avg as number) || 0
  const last5Avg = (data.last_5_avg as number) || 0
  const consensusLine = (data.best_over_line as number) || calculateConsensusLine(lines)
  
  // Calculate hit rates
  const hitRateSeason = (data.hit_rate_season as number) || calculateHitRate(seasonAvg, consensusLine)
  const hitRateLast5 = (data.hit_rate_last_5 as number) || calculateHitRate(last5Avg, consensusLine)
  
  // Determine edge
  const { edge, confidence, factors } = analyzeProValue({
    seasonAvg,
    last5Avg,
    consensusLine,
    hitRateSeason,
    hitRateLast5,
    vsOpponentAvg: (data.vs_opponent_avg as number) || null,
    lineMovement: (data.line_movement as number) || 0
  })
  
  return {
    gameId: data.game_id as string,
    sport: data.sport as string,
    playerId: data.player_id as string,
    playerName: data.player_name as string,
    playerTeam: (data.player_team as string) || '',
    playerPosition: '',
    playerHeadshot: undefined,
    propType: data.prop_type as string,
    propCategory: data.prop_category as string,
    displayName: `${data.player_name} - ${formatPropType(data.prop_type as string)}`,
    lines,
    bestOver: (data.best_over_line as number) ? {
      book: (data.best_over_book as string) || 'consensus',
      line: data.best_over_line as number,
      odds: (data.best_over_odds as number) || -110
    } : null,
    bestUnder: (data.best_under_line as number) ? {
      book: (data.best_under_book as string) || 'consensus',
      line: data.best_under_line as number,
      odds: (data.best_under_odds as number) || -110
    } : null,
    consensusLine,
    seasonAvg,
    last5Avg,
    last10Avg: (data.last_5_avg as number) || seasonAvg, // Using last5 as proxy
    hitRateSeason,
    hitRateLast5,
    vsOpponentAvg: (data.vs_opponent_avg as number) || null,
    vsOpponentGames: (data.vs_opponent_games as number) || 0,
    openingLine: (data.opening_line as number) || null,
    lineMovement: (data.line_movement as number) || 0,
    edgeIndicator: edge,
    confidenceScore: confidence,
    keyFactors: factors
  }
}

function calculateConsensusLine(lines: PropLine[]): number {
  if (!lines || lines.length === 0) return 0
  const sum = lines.reduce((acc, line) => acc + line.line, 0)
  return Math.round((sum / lines.length) * 10) / 10
}

function calculateHitRate(avg: number, line: number): number {
  if (line === 0) return 50
  // Simple estimation based on how far avg is from line
  const diff = avg - line
  const percentDiff = (diff / line) * 100
  
  // Map to probability (rough approximation)
  if (percentDiff >= 20) return 75
  if (percentDiff >= 10) return 65
  if (percentDiff >= 5) return 57
  if (percentDiff >= 0) return 52
  if (percentDiff >= -5) return 48
  if (percentDiff >= -10) return 40
  if (percentDiff >= -20) return 30
  return 25
}

function analyzeProValue(prop: {
  seasonAvg: number
  last5Avg: number
  consensusLine: number
  hitRateSeason: number
  hitRateLast5: number
  vsOpponentAvg: number | null
  lineMovement: number
}): { edge: 'over' | 'under' | 'neutral'; confidence: number; factors: string[] } {
  const factors: string[] = []
  let overScore = 0
  let underScore = 0
  
  const line = prop.consensusLine
  if (line === 0) {
    return { edge: 'neutral', confidence: 0, factors: [] }
  }
  
  // Season average vs line
  const seasonDiff = ((prop.seasonAvg - line) / line) * 100
  if (seasonDiff >= 10) {
    overScore += 25
    factors.push(`Season avg ${prop.seasonAvg.toFixed(1)} is ${seasonDiff.toFixed(0)}% above line`)
  } else if (seasonDiff <= -10) {
    underScore += 25
    factors.push(`Season avg ${prop.seasonAvg.toFixed(1)} is ${Math.abs(seasonDiff).toFixed(0)}% below line`)
  }
  
  // Recent form (last 5)
  const recentDiff = ((prop.last5Avg - line) / line) * 100
  if (recentDiff >= 15) {
    overScore += 30
    factors.push(`Hot streak: Last 5 avg ${prop.last5Avg.toFixed(1)} well above line`)
  } else if (recentDiff <= -15) {
    underScore += 30
    factors.push(`Cold streak: Last 5 avg ${prop.last5Avg.toFixed(1)} well below line`)
  }
  
  // Hit rate
  if (prop.hitRateSeason >= 65) {
    overScore += 20
    factors.push(`Over hits ${prop.hitRateSeason.toFixed(0)}% of the time`)
  } else if (prop.hitRateSeason <= 35) {
    underScore += 20
    factors.push(`Under hits ${(100 - prop.hitRateSeason).toFixed(0)}% of the time`)
  }
  
  // vs Opponent
  if (prop.vsOpponentAvg !== null) {
    const vsOppDiff = ((prop.vsOpponentAvg - line) / line) * 100
    if (vsOppDiff >= 15) {
      overScore += 15
      factors.push(`Averages ${prop.vsOpponentAvg.toFixed(1)} vs this opponent`)
    } else if (vsOppDiff <= -15) {
      underScore += 15
      factors.push(`Only averages ${prop.vsOpponentAvg.toFixed(1)} vs this opponent`)
    }
  }
  
  // Line movement (reverse movement is sharp indicator)
  if (prop.lineMovement >= 2) {
    underScore += 10
    factors.push(`Line moved UP ${prop.lineMovement.toFixed(1)} points - sharps on under?`)
  } else if (prop.lineMovement <= -2) {
    overScore += 10
    factors.push(`Line moved DOWN ${Math.abs(prop.lineMovement).toFixed(1)} points - sharps on over?`)
  }
  
  // Determine edge
  const scoreDiff = overScore - underScore
  if (scoreDiff >= 30) {
    return { edge: 'over', confidence: Math.min(85, 50 + scoreDiff), factors }
  } else if (scoreDiff <= -30) {
    return { edge: 'under', confidence: Math.min(85, 50 + Math.abs(scoreDiff)), factors }
  }
  
  return { edge: 'neutral', confidence: 50, factors }
}

function formatPropType(propType: string): string {
  return propType
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

/**
 * Fetch props from The Odds API
 */
async function fetchPropsFromOddsAPI(gameId: string, sport: string): Promise<PlayerProp[]> {
  // This would call The Odds API for player props
  // For now, return empty array - implement when API key is available
  console.log(`Would fetch props for game ${gameId} sport ${sport} from The Odds API`)
  return []
}

/**
 * Calculate prop arbitrage opportunities
 */
export function findPropArbitrage(prop: PlayerProp): {
  hasArb: boolean
  arbPct: number
  overBook: string
  underBook: string
  overOdds: number
  underOdds: number
  overLine: number
  underLine: number
} | null {
  if (!prop.lines || prop.lines.length < 2) return null
  
  // Sort lines by value
  const sortedByOver = [...prop.lines].sort((a, b) => a.line - b.line)
  const sortedByUnder = [...prop.lines].sort((a, b) => b.line - a.line)
  
  const bestOver = sortedByOver[0]
  const bestUnder = sortedByUnder[0]
  
  // Check if there's a gap in lines
  if (bestOver.line < bestUnder.line) {
    // Potential middle opportunity
    const overImplied = oddsToImplied(bestOver.overOdds)
    const underImplied = oddsToImplied(bestUnder.underOdds)
    const totalImplied = overImplied + underImplied
    
    if (totalImplied < 100) {
      return {
        hasArb: true,
        arbPct: 100 - totalImplied,
        overBook: bestOver.book,
        underBook: bestUnder.book,
        overOdds: bestOver.overOdds,
        underOdds: bestUnder.underOdds,
        overLine: bestOver.line,
        underLine: bestUnder.line
      }
    }
  }
  
  return null
}

function oddsToImplied(americanOdds: number): number {
  if (americanOdds > 0) {
    return 100 / (americanOdds + 100) * 100
  } else {
    return Math.abs(americanOdds) / (Math.abs(americanOdds) + 100) * 100
  }
}
