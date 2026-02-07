/**
 * Systems Backtest API
 * GET /api/systems/backtest - Run a backtest against real historical data
 * POST /api/systems - Save a new system
 * GET /api/systems - List user's systems
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

interface BacktestCriteria {
  sport: string
  betType: 'ats' | 'ml' | 'ou'
  // Spread filters
  spreadMin?: number
  spreadMax?: number
  // Location filters
  homeOnly?: boolean
  awayOnly?: boolean
  // Favorite/Underdog
  favoriteOnly?: boolean
  underdogOnly?: boolean
  // Total filters
  totalMin?: number
  totalMax?: number
  // Public betting filters
  publicTicketPctMax?: number
  publicTicketPctMin?: number
  // Sharp money (money % opposite of ticket %)
  sharpMoneyOnly?: boolean
  // Season filters
  seasonStart?: number
  seasonEnd?: number
  seasonType?: 'regular' | 'postseason' | 'all'
  // Game filters
  weekMin?: number
  weekMax?: number
  // Additional NFL-specific
  afterBye?: boolean
  divisionalGame?: boolean
  primetimeGame?: boolean
  // Additional NBA-specific
  backToBack?: boolean
  restDaysMin?: number
  restDaysMax?: number
}

interface BacktestResult {
  criteria: BacktestCriteria
  sampleSize: number
  wins: number
  losses: number
  pushes: number
  winPct: number
  unitsProfit: number
  roi: number
  confidence: 'Low' | 'Medium' | 'High' | 'Very High'
  // By season breakdown
  bySeasons: {
    season: number
    record: string
    winPct: number
    units: number
    roi: number
  }[]
  // Recent games that match criteria
  recentGames: {
    gameId: string
    date: string
    homeTeam: string
    awayTeam: string
    homeScore: number
    awayScore: number
    spread: number
    total: number
    result: 'W' | 'L' | 'P'
    pickSide: string
  }[]
  // Streaks
  currentStreak: number
  currentStreakType: 'W' | 'L'
  longestWinStreak: number
  longestLossStreak: number
  maxDrawdown: number
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  
  // Parse criteria from query params
  const criteria: BacktestCriteria = {
    sport: searchParams.get('sport')?.toLowerCase() || 'nfl',
    betType: (searchParams.get('betType') as 'ats' | 'ml' | 'ou') || 'ats',
    spreadMin: searchParams.get('spreadMin') ? parseFloat(searchParams.get('spreadMin')!) : undefined,
    spreadMax: searchParams.get('spreadMax') ? parseFloat(searchParams.get('spreadMax')!) : undefined,
    homeOnly: searchParams.get('homeOnly') === 'true',
    awayOnly: searchParams.get('awayOnly') === 'true',
    favoriteOnly: searchParams.get('favoriteOnly') === 'true',
    underdogOnly: searchParams.get('underdogOnly') === 'true',
    totalMin: searchParams.get('totalMin') ? parseFloat(searchParams.get('totalMin')!) : undefined,
    totalMax: searchParams.get('totalMax') ? parseFloat(searchParams.get('totalMax')!) : undefined,
    publicTicketPctMax: searchParams.get('publicTicketPctMax') ? parseFloat(searchParams.get('publicTicketPctMax')!) : undefined,
    seasonStart: searchParams.get('seasonStart') ? parseInt(searchParams.get('seasonStart')!) : 2017,
    seasonEnd: searchParams.get('seasonEnd') ? parseInt(searchParams.get('seasonEnd')!) : new Date().getFullYear(),
    seasonType: (searchParams.get('seasonType') as 'regular' | 'postseason' | 'all') || 'all',
  }
  
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey)
    
    // Build query
    let query = supabase
      .from('historical_games')
      .select('*')
      .eq('sport', criteria.sport)
      .gte('season', criteria.seasonStart || 2000)
      .lte('season', criteria.seasonEnd || 2025)
      .not('spread_result', 'is', null)
    
    // Season type filter
    if (criteria.seasonType && criteria.seasonType !== 'all') {
      query = query.eq('season_type', criteria.seasonType)
    }
    
    // Spread filters
    if (criteria.spreadMin !== undefined) {
      query = query.gte('point_spread', -criteria.spreadMin) // Negative spread = favorite
    }
    if (criteria.spreadMax !== undefined) {
      query = query.lte('point_spread', criteria.spreadMax)
    }
    
    // Total filters
    if (criteria.totalMin !== undefined) {
      query = query.gte('over_under', criteria.totalMin)
    }
    if (criteria.totalMax !== undefined) {
      query = query.lte('over_under', criteria.totalMax)
    }
    
    // Public betting filters (if we have the data)
    if (criteria.publicTicketPctMax !== undefined) {
      query = query.lte('home_ticket_pct', criteria.publicTicketPctMax)
    }
    
    const { data: games, error } = await query.order('game_date', { ascending: false })
    
    if (error) {
      console.error('Supabase query error:', error)
      return NextResponse.json({ error: 'Database query failed', details: error.message }, { status: 500 })
    }
    
    if (!games || games.length === 0) {
      return NextResponse.json({
        criteria,
        sampleSize: 0,
        wins: 0,
        losses: 0,
        pushes: 0,
        winPct: 0,
        unitsProfit: 0,
        roi: 0,
        confidence: 'Low' as const,
        bySeasons: [],
        recentGames: [],
        currentStreak: 0,
        currentStreakType: 'W' as const,
        longestWinStreak: 0,
        longestLossStreak: 0,
        maxDrawdown: 0,
        message: 'No games found matching criteria. Try adjusting your filters.'
      })
    }
    
    // Calculate results based on bet type
    const results = calculateBacktestResults(games, criteria)
    
    return NextResponse.json(results)
    
  } catch (err: unknown) {
    const error = err as Error
    console.error('Backtest error:', error)
    return NextResponse.json({ error: 'Backtest failed', details: error.message }, { status: 500 })
  }
}

function calculateBacktestResults(
  games: Array<{
    espn_game_id: string
    game_date: string
    home_team_abbr: string
    away_team_abbr: string
    home_score: number
    away_score: number
    point_spread: number
    over_under: number
    spread_result: string
    total_result: string
    season: number
    home_ticket_pct?: number
  }>,
  criteria: BacktestCriteria
): BacktestResult {
  let wins = 0
  let losses = 0
  let pushes = 0
  const seasonResults: Record<number, { wins: number; losses: number; pushes: number }> = {}
  const recentGames: BacktestResult['recentGames'] = []
  
  // Track streaks
  let currentStreak = 0
  let currentStreakType: 'W' | 'L' = 'W'
  let longestWinStreak = 0
  let longestLossStreak = 0
  let tempWinStreak = 0
  let tempLossStreak = 0
  
  // Track drawdown
  let runningProfit = 0
  let peakProfit = 0
  let maxDrawdown = 0
  
  // Process games in chronological order for streak tracking
  const sortedGames = [...games].sort((a, b) => 
    new Date(a.game_date).getTime() - new Date(b.game_date).getTime()
  )
  
  for (const game of sortedGames) {
    // Apply additional filters based on criteria
    const homeSpread = game.point_spread || 0
    
    // Home/Away filter
    if (criteria.homeOnly && criteria.favoriteOnly && homeSpread >= 0) continue
    if (criteria.homeOnly && criteria.underdogOnly && homeSpread < 0) continue
    if (criteria.awayOnly && criteria.favoriteOnly && homeSpread <= 0) continue
    if (criteria.awayOnly && criteria.underdogOnly && homeSpread > 0) continue
    
    // Just favorite/underdog without home/away
    if (!criteria.homeOnly && !criteria.awayOnly) {
      if (criteria.favoriteOnly && Math.abs(homeSpread) < (criteria.spreadMin || 0)) continue
      if (criteria.underdogOnly && Math.abs(homeSpread) > (criteria.spreadMax || 999)) continue
    }
    
    // Determine the pick and result
    let result: 'W' | 'L' | 'P' = 'P'
    let pickSide = ''
    
    if (criteria.betType === 'ats') {
      // ATS betting
      if (criteria.homeOnly || (criteria.favoriteOnly && homeSpread < 0) || (criteria.underdogOnly && homeSpread > 0)) {
        // Betting on home team
        pickSide = `${game.home_team_abbr} ${homeSpread > 0 ? '+' : ''}${homeSpread}`
        if (game.spread_result === 'home_cover') result = 'W'
        else if (game.spread_result === 'away_cover') result = 'L'
        else result = 'P'
      } else {
        // Betting on away team
        pickSide = `${game.away_team_abbr} ${homeSpread < 0 ? '+' : ''}${-homeSpread}`
        if (game.spread_result === 'away_cover') result = 'W'
        else if (game.spread_result === 'home_cover') result = 'L'
        else result = 'P'
      }
    } else if (criteria.betType === 'ou') {
      // Over/Under betting - for simplicity, assume Over is the pick
      pickSide = `O ${game.over_under}`
      if (game.total_result === 'over') result = 'W'
      else if (game.total_result === 'under') result = 'L'
      else result = 'P'
    }
    
    // Track stats
    if (result === 'W') {
      wins++
      runningProfit += 0.91 // Win at -110
      tempWinStreak++
      tempLossStreak = 0
      longestWinStreak = Math.max(longestWinStreak, tempWinStreak)
    } else if (result === 'L') {
      losses++
      runningProfit -= 1 // Lose 1 unit
      tempLossStreak++
      tempWinStreak = 0
      longestLossStreak = Math.max(longestLossStreak, tempLossStreak)
    } else {
      pushes++
    }
    
    // Track drawdown
    peakProfit = Math.max(peakProfit, runningProfit)
    const currentDrawdown = peakProfit - runningProfit
    maxDrawdown = Math.max(maxDrawdown, currentDrawdown)
    
    // Track by season
    if (!seasonResults[game.season]) {
      seasonResults[game.season] = { wins: 0, losses: 0, pushes: 0 }
    }
    if (result === 'W') seasonResults[game.season].wins++
    else if (result === 'L') seasonResults[game.season].losses++
    else seasonResults[game.season].pushes++
    
    // Add to recent games (only first 20)
    if (recentGames.length < 20) {
      recentGames.unshift({
        gameId: game.espn_game_id,
        date: game.game_date,
        homeTeam: game.home_team_abbr,
        awayTeam: game.away_team_abbr,
        homeScore: game.home_score,
        awayScore: game.away_score,
        spread: game.point_spread,
        total: game.over_under,
        result,
        pickSide
      })
    }
  }
  
  // Calculate current streak from recent games
  for (const game of recentGames) {
    if (currentStreak === 0) {
      currentStreakType = game.result === 'W' ? 'W' : 'L'
      if (game.result !== 'P') currentStreak = 1
    } else if (game.result === currentStreakType) {
      currentStreak++
    } else if (game.result !== 'P') {
      break
    }
  }
  
  const totalBets = wins + losses
  const winPct = totalBets > 0 ? (wins / totalBets) * 100 : 0
  const unitsProfit = wins * 0.91 - losses
  const roi = totalBets > 0 ? (unitsProfit / totalBets) * 100 : 0
  
  // Determine confidence level
  let confidence: 'Low' | 'Medium' | 'High' | 'Very High' = 'Low'
  if (totalBets >= 200) confidence = 'Very High'
  else if (totalBets >= 100) confidence = 'High'
  else if (totalBets >= 50) confidence = 'Medium'
  
  // Build season breakdown
  const bySeasons = Object.entries(seasonResults)
    .map(([season, stats]) => {
      const seasonTotal = stats.wins + stats.losses
      const seasonWinPct = seasonTotal > 0 ? (stats.wins / seasonTotal) * 100 : 0
      const seasonUnits = stats.wins * 0.91 - stats.losses
      const seasonRoi = seasonTotal > 0 ? (seasonUnits / seasonTotal) * 100 : 0
      return {
        season: parseInt(season),
        record: `${stats.wins}-${stats.losses}${stats.pushes ? `-${stats.pushes}` : ''}`,
        winPct: Math.round(seasonWinPct * 10) / 10,
        units: Math.round(seasonUnits * 10) / 10,
        roi: Math.round(seasonRoi * 10) / 10
      }
    })
    .sort((a, b) => b.season - a.season)
  
  return {
    criteria,
    sampleSize: wins + losses + pushes,
    wins,
    losses,
    pushes,
    winPct: Math.round(winPct * 10) / 10,
    unitsProfit: Math.round(unitsProfit * 10) / 10,
    roi: Math.round(roi * 10) / 10,
    confidence,
    bySeasons,
    recentGames,
    currentStreak,
    currentStreakType,
    longestWinStreak,
    longestLossStreak,
    maxDrawdown: Math.round(maxDrawdown * 10) / 10
  }
}

// POST - Save a new system
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description, criteria, sport, backtestResults } = body
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey)
    
    // Get user from auth header (if authenticated)
    const authHeader = request.headers.get('authorization')
    let userId = null
    
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice(7)
      const { data: { user } } = await supabase.auth.getUser(token)
      userId = user?.id
    }
    
    const { data, error } = await supabase
      .from('betting_systems')
      .insert({
        user_id: userId,
        name,
        description,
        sport,
        criteria,
        sample_size: backtestResults?.sampleSize,
        wins: backtestResults?.wins,
        losses: backtestResults?.losses,
        pushes: backtestResults?.pushes,
        win_pct: backtestResults?.winPct,
        units_profit: backtestResults?.unitsProfit,
        roi: backtestResults?.roi,
        max_drawdown: backtestResults?.maxDrawdown,
        longest_win_streak: backtestResults?.longestWinStreak,
        longest_lose_streak: backtestResults?.longestLossStreak,
        yearly_performance: backtestResults?.bySeasons,
        is_public: false,
        is_active: true
      })
      .select()
      .single()
    
    if (error) {
      console.error('Save system error:', error)
      return NextResponse.json({ error: 'Failed to save system' }, { status: 500 })
    }
    
    return NextResponse.json({ success: true, system: data })
    
  } catch (err: unknown) {
    const error = err as Error
    console.error('Save system error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
