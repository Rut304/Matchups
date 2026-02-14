// =============================================================================
// GAME ODDS SERVICE
// Queries game_odds table (historical odds from The Odds API) and
// line_snapshots table (live DK/FanDuel snapshots) for:
//   - Historical odds lookup for trend analysis
//   - Line movement timelines
//   - CLV (Closing Line Value) calculations
//   - Accurate closing lines for ATS/OU grading
// =============================================================================

import { createAdminClient } from '@/lib/supabase/server'

// ---- Types ----

export interface GameOdds {
  id: string
  sport: string
  odds_api_game_id: string
  home_team: string
  away_team: string
  commence_time: string
  game_date: string
  season: number
  consensus_spread: number | null
  consensus_total: number | null
  consensus_home_ml: number | null
  consensus_away_ml: number | null
  consensus_spread_home_odds: number | null
  consensus_spread_away_odds: number | null
  consensus_over_odds: number | null
  consensus_under_odds: number | null
  best_home_ml: number | null
  best_away_ml: number | null
  best_spread: number | null
  best_total: number | null
  fanduel_spread: number | null
  fanduel_home_ml: number | null
  fanduel_total: number | null
  draftkings_spread: number | null
  draftkings_home_ml: number | null
  draftkings_total: number | null
  betmgm_spread: number | null
  betmgm_home_ml: number | null
  betmgm_total: number | null
  bookmaker_count: number
  bookmaker_odds: Record<string, any> | null
}

export interface LineSnapshot {
  id: string
  game_id: string
  snapshot_ts: string
  spread_home: number | null
  spread_away: number | null
  total_line: number | null
  home_ml: number | null
  away_ml: number | null
  source: string
}

export interface LineTimeline {
  timestamps: string[]
  spreads: (number | null)[]
  totals: (number | null)[]
  homeMLs: (number | null)[]
  awayMLs: (number | null)[]
  source: string
}

export interface HistoricalOddsContext {
  sport: string
  totalGamesWithOdds: number
  averageSpread: number
  averageTotal: number
  spreadDistribution: { range: string; count: number; pct: string }[]
  totalDistribution: { range: string; count: number; pct: string }[]
  recentGames: {
    date: string
    home: string
    away: string
    spread: number | null
    total: number | null
    homeML: number | null
  }[]
}

// ---- Historical Odds Queries ----

/**
 * Get historical odds for a specific matchup (team vs team)
 */
export async function getH2HOddsHistory(
  sport: string,
  team1: string,
  team2: string,
  limit = 20
): Promise<GameOdds[]> {
  const supabase = await createAdminClient()
  
  // Match either direction (home/away)
  const { data, error } = await supabase
    .from('game_odds')
    .select('*')
    .eq('sport', sport.toLowerCase())
    .or(
      `and(home_team.ilike.%${team1}%,away_team.ilike.%${team2}%),` +
      `and(home_team.ilike.%${team2}%,away_team.ilike.%${team1}%)`
    )
    .order('game_date', { ascending: false })
    .limit(limit)
  
  if (error) {
    console.error('[GameOddsService] H2H query error:', error)
    return []
  }
  
  return data || []
}

/**
 * Get historical odds for a specific team (all games)
 */
export async function getTeamOddsHistory(
  sport: string,
  teamName: string,
  season?: number,
  limit = 50
): Promise<GameOdds[]> {
  const supabase = await createAdminClient()
  
  let query = supabase
    .from('game_odds')
    .select('*')
    .eq('sport', sport.toLowerCase())
    .or(`home_team.ilike.%${teamName}%,away_team.ilike.%${teamName}%`)
  
  if (season) {
    query = query.eq('season', season)
  }
  
  const { data, error } = await query
    .order('game_date', { ascending: false })
    .limit(limit)
  
  if (error) {
    console.error('[GameOddsService] team odds query error:', error)
    return []
  }
  
  return data || []
}

/**
 * Get closing odds for a specific game date and teams
 * Used to cross-reference historical_games with accurate closing lines
 */
export async function getClosingOdds(
  sport: string,
  homeTeam: string, 
  awayTeam: string,
  gameDate: string
): Promise<GameOdds | null> {
  const supabase = await createAdminClient()
  
  const { data, error } = await supabase
    .from('game_odds')
    .select('*')
    .eq('sport', sport.toLowerCase())
    .eq('game_date', gameDate)
    .ilike('home_team', `%${homeTeam}%`)
    .ilike('away_team', `%${awayTeam}%`)
    .limit(1)
    .single()
  
  if (error || !data) return null
  return data
}

/**
 * Get aggregate odds stats for a sport/season — used for trend analysis context
 */
export async function getOddsContext(
  sport: string,
  seasons?: number[]
): Promise<HistoricalOddsContext> {
  const supabase = await createAdminClient()
  
  // Paginate since Supabase caps at 1000 rows
  let allData: any[] = []
  let offset = 0
  while (true) {
    let pageQuery = supabase
      .from('game_odds')
      .select('game_date, home_team, away_team, consensus_spread, consensus_total, consensus_home_ml, season')
      .eq('sport', sport.toLowerCase())
      .not('consensus_spread', 'is', null)
      .order('game_date', { ascending: false })
      .range(offset, offset + 999)
    
    if (seasons && seasons.length > 0) {
      pageQuery = pageQuery.in('season', seasons)
    }
    
    const { data: page, error: pageError } = await pageQuery
    
    if (pageError || !page || page.length === 0) break
    allData.push(...page)
    if (page.length < 1000) break
    offset += 1000
  }
  
  const data = allData
  
  if (data.length === 0) {
    return {
      sport,
      totalGamesWithOdds: 0,
      averageSpread: 0,
      averageTotal: 0,
      spreadDistribution: [],
      totalDistribution: [],
      recentGames: []
    }
  }
  
  // Compute stats
  const spreads = data.filter(g => g.consensus_spread != null).map(g => g.consensus_spread!)
  const totals = data.filter(g => g.consensus_total != null).map(g => g.consensus_total!)
  
  const avgSpread = spreads.length > 0 ? spreads.reduce((a, b) => a + b, 0) / spreads.length : 0
  const avgTotal = totals.length > 0 ? totals.reduce((a, b) => a + b, 0) / totals.length : 0
  
  // Spread distribution
  const spreadBuckets = [
    { range: 'PK to -2.5', min: -2.5, max: 0 },
    { range: '-3 to -6.5', min: -6.5, max: -2.5 },
    { range: '-7 to -9.5', min: -9.5, max: -6.5 },
    { range: '-10 to -13.5', min: -13.5, max: -9.5 },
    { range: '-14+', min: -100, max: -13.5 },
  ]
  
  const spreadDistribution = spreadBuckets.map(bucket => {
    const count = spreads.filter(s => s >= bucket.min && s < bucket.max).length
    return {
      range: bucket.range,
      count,
      pct: spreads.length > 0 ? ((count / spreads.length) * 100).toFixed(1) : '0'
    }
  })
  
  // Total distribution
  const totalBuckets = [
    { range: 'Under 38', min: 0, max: 38 },
    { range: '38-42.5', min: 38, max: 42.5 },
    { range: '43-47.5', min: 42.5, max: 47.5 },
    { range: '48-52.5', min: 47.5, max: 52.5 },
    { range: 'Over 52.5', min: 52.5, max: 200 },
  ]
  
  const totalDistribution = totalBuckets.map(bucket => {
    const count = totals.filter(t => t >= bucket.min && t < bucket.max).length
    return {
      range: bucket.range,
      count,
      pct: totals.length > 0 ? ((count / totals.length) * 100).toFixed(1) : '0'
    }
  })
  
  return {
    sport,
    totalGamesWithOdds: data.length,
    averageSpread: Math.round(avgSpread * 10) / 10,
    averageTotal: Math.round(avgTotal * 10) / 10,
    spreadDistribution,
    totalDistribution,
    recentGames: data.slice(0, 10).map(g => ({
      date: g.game_date,
      home: g.home_team,
      away: g.away_team,
      spread: g.consensus_spread,
      total: g.consensus_total,
      homeML: g.consensus_home_ml,
    }))
  }
}

/**
 * Get all game_odds for a sport & season — used for accurate ATS/OU calculations
 * Returns a map keyed by "home_team|away_team|date" for fast lookups
 */
export async function getSeasonOddsMap(
  sport: string,
  season: number
): Promise<Map<string, GameOdds>> {
  const supabase = await createAdminClient()
  
  // Paginate since Supabase caps at 1000 rows
  let allData: GameOdds[] = []
  let offset = 0
  while (true) {
    const { data: page, error } = await supabase
      .from('game_odds')
      .select('*')
      .eq('sport', sport.toLowerCase())
      .eq('season', season)
      .not('consensus_spread', 'is', null)
      .range(offset, offset + 999)
    
    if (error || !page || page.length === 0) {
      if (error) console.error('[GameOddsService] season odds map error:', error)
      break
    }
    allData.push(...page)
    if (page.length < 1000) break
    offset += 1000
  }
  
  const map = new Map<string, GameOdds>()
  for (const row of allData) {
    // Key by normalized team names + date for matching
    const key = `${row.home_team.toLowerCase()}|${row.away_team.toLowerCase()}|${row.game_date}`
    map.set(key, row)
    
    // Also key by just date + partial team match for fuzzy lookups
    const dateKey = `${row.game_date}|${row.home_team.toLowerCase()}`
    map.set(dateKey, row)
  }
  
  return map
}

// ---- Line Snapshots (Live Timeline) ----

/**
 * Get full line movement timeline for a game from line_snapshots
 */
export async function getLineTimeline(gameId: string): Promise<LineTimeline | null> {
  const supabase = await createAdminClient()
  
  const { data, error } = await supabase
    .from('line_snapshots')
    .select('*')
    .eq('game_id', gameId)
    .order('snapshot_ts', { ascending: true })
  
  if (error || !data || data.length === 0) return null
  
  return {
    timestamps: data.map(d => d.snapshot_ts),
    spreads: data.map(d => d.spread_home),
    totals: data.map(d => d.total_line),
    homeMLs: data.map(d => d.home_ml),
    awayMLs: data.map(d => d.away_ml),
    source: data[0].source || 'line_snapshots'
  }
}

/**
 * Get opening and closing lines from line_snapshots for CLV calculation
 */
export async function getOpenClosingLines(gameId: string): Promise<{
  opening: LineSnapshot | null
  closing: LineSnapshot | null
  snapshotCount: number
} | null> {
  const supabase = await createAdminClient()
  
  // Get earliest (opening) and latest (closing) snapshots
  const [openingRes, closingRes, countRes] = await Promise.all([
    supabase
      .from('line_snapshots')
      .select('*')
      .eq('game_id', gameId)
      .order('snapshot_ts', { ascending: true })
      .limit(1),
    supabase
      .from('line_snapshots')
      .select('*')
      .eq('game_id', gameId)
      .order('snapshot_ts', { ascending: false })
      .limit(1),
    supabase
      .from('line_snapshots')
      .select('*', { count: 'exact', head: true })
      .eq('game_id', gameId)
  ])
  
  if (openingRes.error || closingRes.error) return null
  
  return {
    opening: openingRes.data?.[0] || null,
    closing: closingRes.data?.[0] || null,
    snapshotCount: countRes.count || 0
  }
}

/**
 * Calculate CLV grade for a bet placed at a given line
 */
export function calculateCLVGrade(
  betLine: number,
  closingLine: number,
  betType: 'spread' | 'total' | 'ml'
): { grade: string; value: number; description: string } {
  const diff = betType === 'total' 
    ? closingLine - betLine  // For totals, getting a lower number is better for over bets
    : betLine - closingLine  // For spreads, getting more points is better
  
  let grade: string
  let description: string
  
  if (diff >= 2) {
    grade = 'A+'
    description = `Outstanding CLV: ${diff > 0 ? '+' : ''}${diff.toFixed(1)} points of value`
  } else if (diff >= 1) {
    grade = 'A'
    description = `Excellent CLV: ${diff > 0 ? '+' : ''}${diff.toFixed(1)} points of value`
  } else if (diff >= 0.5) {
    grade = 'B+'
    description = `Good CLV: ${diff > 0 ? '+' : ''}${diff.toFixed(1)} points of value`
  } else if (diff >= 0) {
    grade = 'B'
    description = `Positive CLV: ${diff > 0 ? '+' : ''}${diff.toFixed(1)} points`
  } else if (diff >= -0.5) {
    grade = 'C'
    description = `Slight negative CLV: ${diff.toFixed(1)} points`
  } else if (diff >= -1) {
    grade = 'D'
    description = `Poor CLV: ${diff.toFixed(1)} points`
  } else {
    grade = 'F'
    description = `Bad CLV: ${diff.toFixed(1)} points of negative value`
  }
  
  return { grade, value: diff, description }
}

// ---- Cross-reference helpers ----

/**
 * Find game_odds record matching a historical_games record
 * Uses team name fuzzy matching + date
 */
export function findMatchingOdds(
  oddsMap: Map<string, GameOdds>,
  homeTeamName: string,
  awayTeamName: string | undefined,
  gameDate: string
): GameOdds | undefined {
  // Try exact match first
  const exactKey = `${homeTeamName.toLowerCase()}|${(awayTeamName || '').toLowerCase()}|${gameDate}`
  if (oddsMap.has(exactKey)) return oddsMap.get(exactKey)
  
  // Try date + home team partial match
  const dateKey = `${gameDate}|${homeTeamName.toLowerCase()}`
  if (oddsMap.has(dateKey)) return oddsMap.get(dateKey)
  
  // Fuzzy: try matching without city (e.g., "Eagles" instead of "Philadelphia Eagles")
  for (const [key, odds] of oddsMap) {
    if (!key.includes(gameDate)) continue
    const homeMatch = homeTeamName.toLowerCase().includes(odds.home_team.split(' ').pop()?.toLowerCase() || '') ||
                      odds.home_team.toLowerCase().includes(homeTeamName.split(' ').pop()?.toLowerCase() || '')
    if (homeMatch) return odds
  }
  
  return undefined
}
