// =============================================================================
// TREND MATCHER SERVICE
// Given a game, find all applicable trends from historical_trends
// =============================================================================

import { createClient } from './supabase/client'

export interface GameContext {
  sport: string
  homeTeam: string
  awayTeam: string
  homeTeamAbbrev?: string
  awayTeamAbbrev?: string
  gameDate: Date
  spread?: number // positive = home underdog
  total?: number
  isPlayoffs?: boolean
  isDivisional?: boolean
  isPrimetime?: boolean
  homeRestDays?: number
  awayRestDays?: number
  homeConsecutiveRoadGames?: number
  awayConsecutiveRoadGames?: number
  homeLastGameResult?: 'win' | 'loss'
  awayLastGameResult?: 'win' | 'loss'
  homeLastGameMargin?: number
  awayLastGameMargin?: number
  weather?: {
    temp?: number
    wind?: number
    conditions?: string
  }
  publicSpreadHomePct?: number
  publicMoneyHomePct?: number
  lineMovement?: number // positive = moved toward home
}

export interface MatchedTrend {
  trendId: string
  trendName: string
  description: string
  sport: string
  category: string
  betType: string
  pick: string // The actual pick this trend suggests
  
  // Performance
  allTimeRecord: string
  allTimeROI: number
  allTimeSampleSize: number
  allTimeUnits: number
  
  // Recent performance
  last30Record?: string
  last30ROI?: number
  last90Record?: string
  last90ROI?: number
  
  // Scoring
  confidenceScore: number
  matchStrength: number // 0-100 how well this game matches the criteria
  isHotStreak: boolean
}

export interface TrendMatchResult {
  game: GameContext
  matchedTrends: MatchedTrend[]
  aggregateConfidence: number
  topPick: {
    selection: string
    confidence: number
    supportingTrends: number
  } | null
  spreadTrends: MatchedTrend[]
  totalTrends: MatchedTrend[]
  mlTrends: MatchedTrend[]
}

// =============================================================================
// TREND MATCHING LOGIC
// =============================================================================

function matchesCriteria(trend: any, game: GameContext): { matches: boolean; strength: number; pick: string } {
  const criteria = trend.trend_criteria || {}
  let matchPoints = 0
  let totalPoints = 0
  let pick = ''

  // Sport must match
  if (trend.sport !== 'ALL' && trend.sport !== game.sport) {
    return { matches: false, strength: 0, pick: '' }
  }

  // Check various criteria
  
  // Spread-based criteria
  if (criteria.spread_min !== undefined && game.spread !== undefined) {
    totalPoints++
    if (Math.abs(game.spread) >= criteria.spread_min) {
      matchPoints++
      // Determine pick based on spread direction
      if (game.spread > 0) {
        pick = `${game.homeTeam} +${game.spread}`
      } else {
        pick = `${game.awayTeam} +${Math.abs(game.spread)}`
      }
    }
  }

  // Location criteria
  if (criteria.location) {
    totalPoints++
    if (criteria.location === 'home') {
      matchPoints++
      pick = pick || `${game.homeTeam}`
    }
  }

  // Rest days criteria
  if (criteria.rest_days_min !== undefined) {
    totalPoints++
    if ((game.homeRestDays && game.homeRestDays >= criteria.rest_days_min) ||
        (game.awayRestDays && game.awayRestDays >= criteria.rest_days_min)) {
      matchPoints++
    }
  }

  // Previous game margin (bounce back after blowout)
  if (criteria.prev_loss_margin_min !== undefined) {
    totalPoints++
    if ((game.homeLastGameResult === 'loss' && game.homeLastGameMargin && 
         Math.abs(game.homeLastGameMargin) >= criteria.prev_loss_margin_min) ||
        (game.awayLastGameResult === 'loss' && game.awayLastGameMargin && 
         Math.abs(game.awayLastGameMargin) >= criteria.prev_loss_margin_min)) {
      matchPoints++
      // Pick the team that had the blowout loss
      if (game.homeLastGameResult === 'loss' && game.homeLastGameMargin && 
          Math.abs(game.homeLastGameMargin) >= criteria.prev_loss_margin_min) {
        pick = `${game.homeTeam}`
      } else {
        pick = `${game.awayTeam}`
      }
    }
  }

  // Consecutive road games (fade tired road team)
  if (criteria.consecutive_road_games_min !== undefined) {
    totalPoints++
    if ((game.awayConsecutiveRoadGames && 
         game.awayConsecutiveRoadGames >= criteria.consecutive_road_games_min)) {
      matchPoints++
      if (criteria.fade) {
        pick = `${game.homeTeam}` // Fade the road team = take home team
      }
    }
  }

  // 3 in 4 nights
  if (criteria.games_in_days === '3in4') {
    totalPoints++
    // This would need schedule data - for now, assume it's provided
    // Mark as potential match
    matchPoints += 0.5
  }

  // Public percentage (contrarian)
  if (criteria.public_pct_min !== undefined && game.publicSpreadHomePct !== undefined) {
    totalPoints++
    if (game.publicSpreadHomePct >= criteria.public_pct_min || 
        (100 - game.publicSpreadHomePct) >= criteria.public_pct_min) {
      matchPoints++
      // Fade the public
      if (game.publicSpreadHomePct >= criteria.public_pct_min) {
        pick = `${game.awayTeam}`
      } else {
        pick = `${game.homeTeam}`
      }
    }
  }

  // Reverse line movement
  if (criteria.rlm === true) {
    totalPoints++
    // RLM: line moves opposite to public betting
    if (game.publicSpreadHomePct !== undefined && game.lineMovement !== undefined) {
      const publicOnHome = game.publicSpreadHomePct > 50
      const lineMovedTowardHome = game.lineMovement > 0
      if ((publicOnHome && !lineMovedTowardHome) || (!publicOnHome && lineMovedTowardHome)) {
        matchPoints++
        // Bet the side the line moved toward (sharp money)
        if (lineMovedTowardHome) {
          pick = `${game.homeTeam}`
        } else {
          pick = `${game.awayTeam}`
        }
      }
    }
  }

  // Weather criteria
  if (criteria.wind_mph_min !== undefined && game.weather?.wind !== undefined) {
    totalPoints++
    if (game.weather.wind >= criteria.wind_mph_min) {
      matchPoints++
      if (criteria.bet === 'under') {
        pick = `Under ${game.total}`
      }
    }
  }

  if (criteria.temp_max !== undefined && game.weather?.temp !== undefined) {
    totalPoints++
    if (game.weather.temp <= criteria.temp_max) {
      matchPoints++
      if (criteria.bet === 'under') {
        pick = `Under ${game.total}`
      }
    }
  }

  // Line movement steam
  if (criteria.line_move_min !== undefined && game.lineMovement !== undefined) {
    totalPoints++
    if (Math.abs(game.lineMovement) >= criteria.line_move_min) {
      matchPoints++
      // Follow the steam
      if (game.lineMovement > 0) {
        pick = `${game.homeTeam}`
      } else {
        pick = `${game.awayTeam}`
      }
    }
  }

  // Divisional game
  if (criteria.divisional === true && game.isDivisional) {
    totalPoints++
    matchPoints++
  }

  // Primetime
  if (criteria.primetime === true && game.isPrimetime) {
    totalPoints++
    matchPoints++
  }

  // Playoffs
  if (criteria.playoffs === true && game.isPlayoffs) {
    totalPoints++
    matchPoints++
  }

  // Calculate match strength
  const strength = totalPoints > 0 ? (matchPoints / totalPoints) * 100 : 0
  
  // Need at least 50% match to consider it applicable
  const matches = totalPoints > 0 && (matchPoints / totalPoints) >= 0.5

  // Default pick based on bet type if not set
  if (!pick && matches) {
    if (trend.bet_type === 'total' && criteria.bet === 'under') {
      pick = `Under ${game.total || 'TBD'}`
    } else if (trend.bet_type === 'total' && criteria.bet === 'over') {
      pick = `Over ${game.total || 'TBD'}`
    } else if (trend.bet_type === 'spread') {
      pick = game.spread && game.spread > 0 
        ? `${game.homeTeam} +${game.spread}` 
        : `${game.awayTeam} +${Math.abs(game.spread || 0)}`
    }
  }

  return { matches, strength, pick }
}

// =============================================================================
// MAIN EXPORT: Find matching trends for a game
// =============================================================================

export async function findMatchingTrends(game: GameContext): Promise<TrendMatchResult> {
  const supabase = createClient()
  
  // Fetch all active trends for this sport (or ALL sports)
  const { data: trends, error } = await supabase
    .from('historical_trends')
    .select('*')
    .eq('is_active', true)
    .or(`sport.eq.${game.sport},sport.eq.ALL`)
    .order('confidence_score', { ascending: false })
  
  if (error) {
    console.error('Error fetching trends:', error)
    return {
      game,
      matchedTrends: [],
      aggregateConfidence: 0,
      topPick: null,
      spreadTrends: [],
      totalTrends: [],
      mlTrends: []
    }
  }

  const matchedTrends: MatchedTrend[] = []
  
  for (const trend of trends || []) {
    const { matches, strength, pick } = matchesCriteria(trend, game)
    
    if (matches) {
      matchedTrends.push({
        trendId: trend.trend_id,
        trendName: trend.trend_name,
        description: trend.trend_description,
        sport: trend.sport,
        category: trend.category,
        betType: trend.bet_type,
        pick,
        allTimeRecord: trend.all_time_record || '0-0',
        allTimeROI: trend.all_time_roi || 0,
        allTimeSampleSize: trend.all_time_sample_size || 0,
        allTimeUnits: trend.all_time_units || 0,
        last30Record: trend.l30_record,
        last30ROI: trend.l30_roi,
        last90Record: trend.l90_record,
        last90ROI: trend.l90_roi,
        confidenceScore: trend.confidence_score || 70,
        matchStrength: strength,
        isHotStreak: trend.hot_streak || false
      })
    }
  }

  // Sort by confidence
  matchedTrends.sort((a, b) => b.confidenceScore - a.confidenceScore)

  // Categorize by bet type
  const spreadTrends = matchedTrends.filter(t => t.betType === 'spread')
  const totalTrends = matchedTrends.filter(t => t.betType === 'total')
  const mlTrends = matchedTrends.filter(t => t.betType === 'moneyline')

  // Calculate aggregate confidence
  const avgConfidence = matchedTrends.length > 0
    ? matchedTrends.reduce((sum, t) => sum + t.confidenceScore, 0) / matchedTrends.length
    : 0

  // Determine top pick by counting consensus
  const pickCounts: Record<string, { count: number; confidence: number }> = {}
  for (const trend of matchedTrends) {
    if (!pickCounts[trend.pick]) {
      pickCounts[trend.pick] = { count: 0, confidence: 0 }
    }
    pickCounts[trend.pick].count++
    pickCounts[trend.pick].confidence += trend.confidenceScore
  }

  let topPick: TrendMatchResult['topPick'] = null
  let maxCount = 0
  for (const [selection, data] of Object.entries(pickCounts)) {
    if (data.count > maxCount) {
      maxCount = data.count
      topPick = {
        selection,
        confidence: data.confidence / data.count,
        supportingTrends: data.count
      }
    }
  }

  return {
    game,
    matchedTrends,
    aggregateConfidence: avgConfidence,
    topPick,
    spreadTrends,
    totalTrends,
    mlTrends
  }
}

// =============================================================================
// HELPER: Get team H2H history
// =============================================================================

export async function getTeamVsTeamHistory(
  sport: string, 
  homeTeamAbbrev: string, 
  awayTeamAbbrev: string,
  limit: number = 10
): Promise<{
  games: any[]
  homeATS: { wins: number; losses: number; pushes: number }
  awayATS: { wins: number; losses: number; pushes: number }
  overs: number
  unders: number
  avgMargin: number
  avgTotal: number
}> {
  const supabase = createClient()
  
  // Get historical games between these teams
  const { data: games, error } = await supabase
    .from('historical_games')
    .select('*')
    .eq('sport', sport)
    .or(`and(home_team_abbrev.eq.${homeTeamAbbrev},away_team_abbrev.eq.${awayTeamAbbrev}),and(home_team_abbrev.eq.${awayTeamAbbrev},away_team_abbrev.eq.${homeTeamAbbrev})`)
    .order('game_date', { ascending: false })
    .limit(limit)

  if (error || !games) {
    return {
      games: [],
      homeATS: { wins: 0, losses: 0, pushes: 0 },
      awayATS: { wins: 0, losses: 0, pushes: 0 },
      overs: 0,
      unders: 0,
      avgMargin: 0,
      avgTotal: 0
    }
  }

  // Calculate stats
  let homeWins = 0, homeLosses = 0, homePushes = 0
  let overs = 0, unders = 0
  let totalMargin = 0, totalPoints = 0

  for (const game of games) {
    const isHome = game.home_team_abbrev === homeTeamAbbrev
    
    if (game.spread_result === 'home_cover') {
      if (isHome) homeWins++
      else homeLosses++
    } else if (game.spread_result === 'away_cover') {
      if (isHome) homeLosses++
      else homeWins++
    } else {
      homePushes++
    }

    if (game.total_result === 'over') overs++
    else if (game.total_result === 'under') unders++

    if (isHome) {
      totalMargin += (game.home_score - game.away_score)
    } else {
      totalMargin += (game.away_score - game.home_score)
    }
    totalPoints += (game.home_score + game.away_score)
  }

  return {
    games,
    homeATS: { wins: homeWins, losses: homeLosses, pushes: homePushes },
    awayATS: { wins: homeLosses, losses: homeWins, pushes: homePushes },
    overs,
    unders,
    avgMargin: games.length > 0 ? totalMargin / games.length : 0,
    avgTotal: games.length > 0 ? totalPoints / games.length : 0
  }
}
