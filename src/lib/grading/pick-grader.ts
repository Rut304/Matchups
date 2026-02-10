/**
 * Pick Grading System
 * 
 * Grades expert picks based on THE LINE THEY USED at time of pick.
 * This is critical - we can't just use game outcome, we must verify
 * if they covered the spread/total they specified.
 * 
 * Example:
 * - Expert picks Chiefs -3.5
 * - Chiefs win by 3 = LOSS (didn't cover their line)
 * - Chiefs win by 7 = WIN (covered their line)
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

// ESPN Scoreboard URLs
const ESPN_SCOREBOARD_URLS: Record<string, string> = {
  NFL: 'https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard',
  NBA: 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard',
  MLB: 'https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/scoreboard',
  NHL: 'https://site.api.espn.com/apis/site/v2/sports/hockey/nhl/scoreboard',
  CFB: 'https://site.api.espn.com/apis/site/v2/sports/football/college-football/scoreboard',
  CBB: 'https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/scoreboard',
}

// ============================================
// TYPES
// ============================================

interface GameResult {
  game_id: string
  sport: string
  home_team: string
  away_team: string
  home_score: number
  away_score: number
  status: 'final' | 'in_progress' | 'scheduled' | 'postponed'
  game_date: string
}

interface PendingPick {
  id: string
  expert_id: string
  sport: string
  bet_type: string
  home_team: string
  away_team: string
  picked_team: string | null
  picked_side: string | null
  line_at_pick: number | null
  odds_at_pick: number | null
  total_pick: string | null
  total_number: number | null
  units: number
  game_date: string
}

interface GradeResult {
  status: 'won' | 'lost' | 'push' | 'void'
  units_won: number
  home_score: number
  away_score: number
  final_spread: number
  final_total: number
  result_vs_their_line: string
}

// ============================================
// FETCH GAME RESULTS FROM ESPN
// ============================================

export async function fetchGameResults(sport: string, date: string): Promise<GameResult[]> {
  const url = ESPN_SCOREBOARD_URLS[sport.toUpperCase()]
  if (!url) {
    console.error(`[Grader] Unknown sport: ${sport}`)
    return []
  }
  
  // Format date as YYYYMMDD for ESPN API
  const formattedDate = date.replace(/-/g, '')
  
  try {
    const res = await fetch(`${url}?dates=${formattedDate}`)
    const data = await res.json()
    
    const results: GameResult[] = []
    
    for (const event of data.events || []) {
      const competition = event.competitions?.[0]
      if (!competition) continue
      
      const homeTeam = competition.competitors?.find((c: any) => c.homeAway === 'home')
      const awayTeam = competition.competitors?.find((c: any) => c.homeAway === 'away')
      
      if (!homeTeam || !awayTeam) continue
      
      const gameStatus = event.status?.type?.state || 'scheduled'
      
      results.push({
        game_id: event.id,
        sport: sport.toUpperCase(),
        home_team: homeTeam.team?.displayName || homeTeam.team?.name || 'Unknown',
        away_team: awayTeam.team?.displayName || awayTeam.team?.name || 'Unknown',
        home_score: parseInt(homeTeam.score) || 0,
        away_score: parseInt(awayTeam.score) || 0,
        status: gameStatus === 'post' ? 'final' : gameStatus === 'in' ? 'in_progress' : 'scheduled',
        game_date: date
      })
    }
    
    return results
    
  } catch (err) {
    console.error(`[Grader] Error fetching ${sport} scores:`, err)
    return []
  }
}

/**
 * Cache game results in our database
 */
export async function cacheGameResults(results: GameResult[]): Promise<void> {
  for (const result of results) {
    if (result.status !== 'final') continue
    
    // Calculate winner
    const winner = result.home_score > result.away_score 
      ? 'home' 
      : result.away_score > result.home_score 
        ? 'away' 
        : 'tie'
    
    await supabase
      .from('game_results')
      .upsert({
        game_id: result.game_id,
        sport: result.sport,
        game_date: result.game_date,
        home_team: result.home_team,
        away_team: result.away_team,
        home_score: result.home_score,
        away_score: result.away_score,
        winner,
        status: result.status,
        source: 'espn',
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'game_id'
      })
  }
}

// ============================================
// GRADE A SINGLE PICK
// ============================================

/**
 * Grade a pick against the actual game result
 * IMPORTANT: Uses THEIR line, not just game outcome
 */
export function gradePick(
  pick: PendingPick,
  homeScore: number,
  awayScore: number
): GradeResult {
  const finalSpread = homeScore - awayScore  // Positive = home won by X
  const finalTotal = homeScore + awayScore
  
  const defaultOdds = -110
  const odds = pick.odds_at_pick || defaultOdds
  
  // Calculate potential payout multiplier
  const payoutMultiplier = odds >= 100 
    ? odds / 100 
    : 100 / Math.abs(odds)
  
  let status: 'won' | 'lost' | 'push' | 'void' = 'void'
  let unitsWon = 0
  let resultVsLine = ''
  
  switch (pick.bet_type) {
    case 'spread':
      if (!pick.line_at_pick) {
        status = 'void'
        resultVsLine = 'No line recorded'
        break
      }
      
      // Determine which team they picked and if they covered
      // line_at_pick is from picked team's perspective (e.g., -3.5 means favorite by 3.5)
      const theirSpread = pick.line_at_pick
      
      // Did their team cover?
      // If they picked home: need (homeScore - awayScore) > -theirSpread
      // If they picked away: need (awayScore - homeScore) > -theirSpread
      let actualMargin: number
      
      if (pick.picked_side === 'home' || isHomeTeam(pick.picked_team, pick.home_team)) {
        actualMargin = finalSpread  // home perspective
      } else {
        actualMargin = -finalSpread  // away perspective
      }
      
      // They cover if their margin + their spread > 0
      // e.g., they took Chiefs -3.5, Chiefs won by 7: 7 + (-3.5) = 3.5 > 0 = COVER
      // e.g., they took Chiefs -3.5, Chiefs won by 3: 3 + (-3.5) = -0.5 < 0 = NO COVER
      const spreadResult = actualMargin + theirSpread
      
      if (spreadResult > 0) {
        status = 'won'
        unitsWon = pick.units * payoutMultiplier
        resultVsLine = `Covered by ${Math.abs(spreadResult).toFixed(1)}`
      } else if (spreadResult === 0) {
        status = 'push'
        unitsWon = 0
        resultVsLine = 'Push - exact spread'
      } else {
        status = 'lost'
        unitsWon = -pick.units
        resultVsLine = `Missed by ${Math.abs(spreadResult).toFixed(1)}`
      }
      break
      
    case 'total':
      if (!pick.total_number) {
        status = 'void'
        resultVsLine = 'No total recorded'
        break
      }
      
      if (pick.total_pick === 'over') {
        if (finalTotal > pick.total_number) {
          status = 'won'
          unitsWon = pick.units * payoutMultiplier
          resultVsLine = `Over hit by ${finalTotal - pick.total_number}`
        } else if (finalTotal === pick.total_number) {
          status = 'push'
          unitsWon = 0
          resultVsLine = 'Push - exact total'
        } else {
          status = 'lost'
          unitsWon = -pick.units
          resultVsLine = `Under by ${pick.total_number - finalTotal}`
        }
      } else {  // under
        if (finalTotal < pick.total_number) {
          status = 'won'
          unitsWon = pick.units * payoutMultiplier
          resultVsLine = `Under hit by ${pick.total_number - finalTotal}`
        } else if (finalTotal === pick.total_number) {
          status = 'push'
          unitsWon = 0
          resultVsLine = 'Push - exact total'
        } else {
          status = 'lost'
          unitsWon = -pick.units
          resultVsLine = `Over by ${finalTotal - pick.total_number}`
        }
      }
      break
      
    case 'moneyline':
      // Simple - did their team win?
      const pickedHome = pick.picked_side === 'home' || isHomeTeam(pick.picked_team, pick.home_team)
      const theirTeamWon = pickedHome 
        ? homeScore > awayScore 
        : awayScore > homeScore
      const tie = homeScore === awayScore
      
      if (theirTeamWon) {
        status = 'won'
        unitsWon = pick.units * payoutMultiplier
        resultVsLine = `${pick.picked_team || 'Team'} won`
      } else if (tie) {
        status = 'push'
        unitsWon = 0
        resultVsLine = 'Tie game'
      } else {
        status = 'lost'
        unitsWon = -pick.units
        resultVsLine = `${pick.picked_team || 'Team'} lost`
      }
      break
      
    default:
      // Props and other bet types need manual grading
      status = 'void'
      resultVsLine = 'Manual grading required'
  }
  
  return {
    status,
    units_won: Math.round(unitsWon * 100) / 100,  // Round to 2 decimals
    home_score: homeScore,
    away_score: awayScore,
    final_spread: finalSpread,
    final_total: finalTotal,
    result_vs_their_line: resultVsLine
  }
}

/**
 * Helper to check if picked team matches home team
 */
function isHomeTeam(pickedTeam: string | null, homeTeam: string): boolean {
  if (!pickedTeam) return false
  
  const picked = pickedTeam.toLowerCase()
  const home = homeTeam.toLowerCase()
  
  // Exact match
  if (picked === home) return true
  
  // Partial match (nickname vs full name)
  if (home.includes(picked) || picked.includes(home)) return true
  
  // Common nicknames
  const nicknames: Record<string, string[]> = {
    'kansas city chiefs': ['chiefs', 'kc'],
    'philadelphia eagles': ['eagles', 'philly'],
    'san francisco 49ers': ['49ers', 'niners', 'sf'],
    'los angeles lakers': ['lakers', 'la lakers'],
    'boston celtics': ['celtics', 'boston'],
    // Add more as needed
  }
  
  for (const [fullName, aliases] of Object.entries(nicknames)) {
    if (home.includes(fullName) || fullName.includes(home)) {
      return aliases.some(alias => picked.includes(alias))
    }
  }
  
  return false
}

// ============================================
// BATCH GRADING
// ============================================

/**
 * Grade all pending picks for a specific date
 */
export async function gradePendingPicks(date: string): Promise<{
  graded: number
  won: number
  lost: number
  pushed: number
  errors: number
}> {
  const stats = { graded: 0, won: 0, lost: 0, pushed: 0, errors: 0 }
  
  console.log(`[Grader] Grading pending picks for ${date}...`)
  
  // Get all pending picks for this date
  const { data: pendingPicks, error: fetchError } = await supabase
    .from('expert_picks')
    .select('*')
    .eq('game_date', date)
    .eq('status', 'pending')
  
  if (fetchError || !pendingPicks?.length) {
    console.log(`[Grader] No pending picks found for ${date}`)
    return stats
  }
  
  console.log(`[Grader] Found ${pendingPicks.length} pending picks`)
  
  // Get unique sports from picks
  const sports = [...new Set(pendingPicks.map(p => p.sport))]
  
  // Fetch game results for each sport
  const allResults: GameResult[] = []
  for (const sport of sports) {
    const results = await fetchGameResults(sport, date)
    allResults.push(...results)
    
    // Cache results
    await cacheGameResults(results)
  }
  
  console.log(`[Grader] Found ${allResults.length} game results`)
  
  // Grade each pick
  for (const pick of pendingPicks as PendingPick[]) {
    // Find matching game
    const game = findMatchingGame(pick, allResults)
    
    if (!game) {
      console.log(`[Grader] No matching game for pick ${pick.id}`)
      continue
    }
    
    if (game.status !== 'final') {
      console.log(`[Grader] Game ${game.game_id} not final yet`)
      continue
    }
    
    // Grade the pick
    const result = gradePick(pick, game.home_score, game.away_score)
    
    // Update pick in database
    const { error: updateError } = await supabase
      .from('expert_picks')
      .update({
        status: result.status,
        home_score: result.home_score,
        away_score: result.away_score,
        final_spread: result.final_spread,
        final_total: result.final_total,
        result_vs_their_line: result.result_vs_their_line,
        units_won: result.units_won,
        graded_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', pick.id)
    
    if (updateError) {
      console.error(`[Grader] Error updating pick ${pick.id}:`, updateError)
      stats.errors++
      continue
    }
    
    stats.graded++
    if (result.status === 'won') stats.won++
    else if (result.status === 'lost') stats.lost++
    else if (result.status === 'push') stats.pushed++
    
    console.log(`[Grader] Graded pick ${pick.id}: ${result.status} (${result.result_vs_their_line})`)
  }
  
  console.log(`[Grader] Complete: ${stats.graded} graded, ${stats.won}W-${stats.lost}L-${stats.pushed}P`)
  
  return stats
}

/**
 * Find the game that matches a pick
 */
function findMatchingGame(pick: PendingPick, games: GameResult[]): GameResult | null {
  // Filter by sport first
  const sportGames = games.filter(g => g.sport === pick.sport)
  
  // Try to match by team names
  for (const game of sportGames) {
    const homeMatch = teamMatches(pick.home_team, game.home_team) || 
                      teamMatches(pick.picked_team, game.home_team)
    const awayMatch = teamMatches(pick.away_team, game.away_team) || 
                      teamMatches(pick.picked_team, game.away_team)
    
    if (homeMatch || awayMatch) {
      return game
    }
  }
  
  return null
}

/**
 * Check if two team names match (fuzzy)
 */
function teamMatches(name1: string | null, name2: string): boolean {
  if (!name1) return false
  
  const n1 = name1.toLowerCase().trim()
  const n2 = name2.toLowerCase().trim()
  
  // Exact match
  if (n1 === n2) return true
  
  // One contains the other
  if (n1.includes(n2) || n2.includes(n1)) return true
  
  // Common word match (e.g., "Chiefs" matches "Kansas City Chiefs")
  const words1 = n1.split(/\s+/)
  const words2 = n2.split(/\s+/)
  
  return words1.some(w => w.length > 3 && words2.includes(w)) ||
         words2.some(w => w.length > 3 && words1.includes(w))
}

// ============================================
// STATS RECALCULATION
// ============================================

/**
 * Recalculate expert stats after grading
 */
export async function recalculateExpertStats(
  expertId: string,
  options: {
    sport?: string
    periodType?: string
    periodStart?: string
    periodEnd?: string
  } = {}
): Promise<void> {
  const { sport, periodType = 'all_time' } = options
  
  // Get all graded picks for this expert
  let query = supabase
    .from('expert_picks')
    .select('*')
    .eq('expert_id', expertId)
    .in('status', ['won', 'lost', 'push'])
  
  if (sport) {
    query = query.eq('sport', sport)
  }
  
  if (options.periodStart) {
    query = query.gte('game_date', options.periodStart)
  }
  
  if (options.periodEnd) {
    query = query.lte('game_date', options.periodEnd)
  }
  
  const { data: picks, error } = await query
  
  if (error || !picks) {
    console.error(`[Stats] Error fetching picks for ${expertId}:`, error)
    return
  }
  
  // Calculate stats
  const wins = picks.filter(p => p.status === 'won').length
  const losses = picks.filter(p => p.status === 'lost').length
  const pushes = picks.filter(p => p.status === 'push').length
  const totalPicks = picks.length
  const unitsWon = picks.reduce((sum, p) => sum + (p.units_won || 0), 0)
  const unitsWagered = picks.reduce((sum, p) => sum + (p.units || 1), 0)
  
  const winPct = (wins + losses) > 0 
    ? Math.round(wins / (wins + losses) * 10000) / 100 
    : 0
  
  const roi = unitsWagered > 0 
    ? Math.round(unitsWon / unitsWagered * 10000) / 100 
    : 0
  
  // Calculate streak
  const sortedPicks = [...picks].sort((a, b) => 
    new Date(b.game_date).getTime() - new Date(a.game_date).getTime()
  )
  
  let currentStreak = 0
  for (const pick of sortedPicks) {
    if (pick.status === 'push') continue
    if (currentStreak === 0) {
      currentStreak = pick.status === 'won' ? 1 : -1
    } else if (currentStreak > 0 && pick.status === 'won') {
      currentStreak++
    } else if (currentStreak < 0 && pick.status === 'lost') {
      currentStreak--
    } else {
      break
    }
  }
  
  // Upsert stats
  const now = new Date()
  const periodStart = options.periodStart || '2020-01-01'
  const periodEnd = options.periodEnd || now.toISOString().split('T')[0]
  
  await supabase
    .from('expert_stats')
    .upsert({
      expert_id: expertId,
      period_type: periodType,
      period_start: periodStart,
      period_end: periodEnd,
      sport: sport || null,
      bet_type: null,
      wins,
      losses,
      pushes,
      total_picks: totalPicks,
      win_pct: winPct,
      units_won: Math.round(unitsWon * 100) / 100,
      units_wagered: Math.round(unitsWagered * 100) / 100,
      roi,
      current_streak: currentStreak,
      calculated_at: now.toISOString()
    }, {
      onConflict: 'expert_id,period_type,period_start,sport,bet_type'
    })
  
  console.log(`[Stats] Updated ${expertId}: ${wins}W-${losses}L-${pushes}P (${winPct}%), ${unitsWon > 0 ? '+' : ''}${unitsWon}u`)
}

/**
 * Recalculate stats for ALL experts
 */
export async function recalculateAllExpertStats(): Promise<void> {
  const { data: experts, error } = await supabase
    .from('experts')
    .select('expert_id')
    .eq('is_active', true)
  
  if (error || !experts) {
    console.error('[Stats] Error fetching experts:', error)
    return
  }
  
  console.log(`[Stats] Recalculating stats for ${experts.length} experts...`)
  
  for (const expert of experts) {
    await recalculateExpertStats(expert.expert_id)
    
    // Also calculate by sport
    for (const sport of ['NFL', 'NBA', 'MLB', 'NHL', 'CFB', 'CBB']) {
      await recalculateExpertStats(expert.expert_id, { sport })
    }
  }
  
  console.log('[Stats] Done!')
}

// ============================================
// MAIN GRADING FUNCTION
// ============================================

export async function runDailyGrading(): Promise<{
  success: boolean
  stats: {
    datesProcessed: number
    picksGraded: number
    won: number
    lost: number
    pushed: number
    errors: number
  }
}> {
  console.log('\n========================================')
  console.log('DAILY PICK GRADING')
  console.log(`Time: ${new Date().toISOString()}`)
  console.log('========================================\n')
  
  const stats = {
    datesProcessed: 0,
    picksGraded: 0,
    won: 0,
    lost: 0,
    pushed: 0,
    errors: 0
  }
  
  try {
    // Grade picks from the last 7 days (to catch any missed)
    const dates: string[] = []
    for (let i = 1; i <= 7; i++) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      dates.push(date.toISOString().split('T')[0])
    }
    
    for (const date of dates) {
      const result = await gradePendingPicks(date)
      stats.datesProcessed++
      stats.picksGraded += result.graded
      stats.won += result.won
      stats.lost += result.lost
      stats.pushed += result.pushed
      stats.errors += result.errors
    }
    
    // Recalculate all expert stats
    await recalculateAllExpertStats()
    
    console.log('\n========================================')
    console.log('GRADING COMPLETE')
    console.log('========================================')
    console.log(`Dates Processed: ${stats.datesProcessed}`)
    console.log(`Picks Graded: ${stats.picksGraded}`)
    console.log(`Record: ${stats.won}W-${stats.lost}L-${stats.pushed}P`)
    console.log(`Errors: ${stats.errors}`)
    console.log('========================================\n')
    
    return { success: true, stats }
    
  } catch (err) {
    console.error('[Grader] Fatal error:', err)
    return { success: false, stats }
  }
}

// CLI entry point
if (require.main === module) {
  runDailyGrading().then(result => {
    process.exit(result.success ? 0 : 1)
  })
}
