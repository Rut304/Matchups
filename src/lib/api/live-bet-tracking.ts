/**
 * LIVE BET TRACKING SYSTEM
 * Real-time tracking of user bets during games
 * 
 * Features:
 * - Bet status (covering/losing)
 * - Live win probability
 * - Player prop tracking
 * - Cash out calculations
 * - Settlement timeline
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

// =============================================================================
// TYPES
// =============================================================================

export interface UserBet {
  id: string
  oddsId: string
  gameId: string
  sport: string
  
  // Bet details
  betType: 'spread' | 'moneyline' | 'total' | 'prop' | 'parlay' | 'teaser'
  selection: string // "KC -7", "OVER 45.5", "Patrick Mahomes OVER 2.5 TD"
  line: number | null // The line/spread/total
  odds: number // American odds (-110, +150, etc.)
  
  // Stake and potential
  stake: number
  potentialPayout: number
  
  // Game context
  homeTeam: string
  awayTeam: string
  gameTime: string
  
  // Status
  status: 'pending' | 'live' | 'won' | 'lost' | 'push' | 'cashout'
  
  // Live tracking
  liveStatus?: LiveBetStatus
  
  createdAt: string
  settledAt?: string
}

export interface LiveBetStatus {
  // Current status
  isCovering: boolean
  currentMargin: number // How much you're winning/losing by
  
  // Win probability
  winProbability: number // 0-100
  probabilityChange: number // Change in last 5 mins
  probabilityTrend: 'improving' | 'worsening' | 'stable'
  
  // Game state
  currentScore: {
    home: number
    away: number
  }
  timeRemaining: string // "Q3 5:42" or "7th Inning"
  possession?: 'home' | 'away'
  
  // Key moments
  keyMoments: BetMoment[]
  
  // Cash out
  cashOutAvailable: boolean
  cashOutValue?: number
  cashOutChange?: number // vs 5 mins ago
  
  // Settlement
  estimatedSettlement: string // ISO timestamp
  settlementNote?: string
}

export interface BetMoment {
  timestamp: string
  description: string
  impact: 'positive' | 'negative' | 'neutral'
  probabilityBefore: number
  probabilityAfter: number
}

export interface PlayerPropTracker {
  playerId: string
  playerName: string
  team: string
  
  // Prop bet details
  propType: string // "passing_yards", "points", etc.
  line: number
  selection: 'over' | 'under'
  
  // Current stats
  currentValue: number
  projectedFinal: number
  
  // Status
  isCovering: boolean
  margin: number // How much over/under the line
  hitProbability: number
  
  // Game context
  timeRemaining: string
  pace: 'ahead' | 'on-pace' | 'behind'
  
  // Historical context
  seasonAverage: number
  last5Average: number
}

export interface BetPortfolio {
  userId: string
  
  // Summary
  totalAtRisk: number
  totalPotentialPayout: number
  
  // Live bets
  liveBets: UserBet[]
  pendingBets: UserBet[]
  
  // Aggregate status
  betsWinning: number
  betsLosing: number
  aggregateWinProbability: number
  
  // Today's P/L
  realizedPL: number
  unrealizedPL: number
  
  // Alerts
  alerts: BetAlert[]
}

export interface BetAlert {
  id: string
  betId: string
  type: 'covering' | 'losing' | 'close_call' | 'cash_out' | 'settled'
  message: string
  timestamp: string
  acknowledged: boolean
}

// =============================================================================
// MAIN API FUNCTIONS
// =============================================================================

/**
 * Get all bets for a user
 */
export async function getUserBets(
  userId: string,
  filters?: {
    status?: UserBet['status'][]
    sport?: string
    dateFrom?: string
    dateTo?: string
  }
): Promise<UserBet[]> {
  try {
    let query = supabase
      .from('user_bets')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    
    if (filters?.status) {
      query = query.in('status', filters.status)
    }
    if (filters?.sport) {
      query = query.eq('sport', filters.sport.toUpperCase())
    }
    if (filters?.dateFrom) {
      query = query.gte('created_at', filters.dateFrom)
    }
    if (filters?.dateTo) {
      query = query.lte('created_at', filters.dateTo)
    }
    
    const { data, error } = await query
    
    if (error) {
      console.error('Error fetching user bets:', error)
      return []
    }
    
    return (data || []).map(formatUserBet)
  } catch (error) {
    console.error('Error in getUserBets:', error)
    return []
  }
}

/**
 * Get live bet status for a specific bet
 */
export async function getLiveBetStatus(
  betId: string,
  currentGameState: {
    homeScore: number
    awayScore: number
    timeRemaining: string
    quarter?: number
    inning?: number
    period?: number
    possession?: 'home' | 'away'
  }
): Promise<LiveBetStatus | null> {
  try {
    const { data: bet } = await supabase
      .from('user_bets')
      .select('*')
      .eq('id', betId)
      .single()
    
    if (!bet) return null
    
    return calculateLiveBetStatus(formatUserBet(bet), currentGameState)
  } catch (error) {
    console.error('Error getting live bet status:', error)
    return null
  }
}

/**
 * Get full bet portfolio for a user
 */
export async function getBetPortfolio(userId: string): Promise<BetPortfolio> {
  const allBets = await getUserBets(userId)
  
  const liveBets = allBets.filter(b => b.status === 'live')
  const pendingBets = allBets.filter(b => b.status === 'pending')
  const settledToday = allBets.filter(b => {
    if (!b.settledAt) return false
    const today = new Date().toISOString().split('T')[0]
    return b.settledAt.startsWith(today)
  })
  
  // Calculate totals
  const totalAtRisk = [...liveBets, ...pendingBets].reduce((sum, b) => sum + b.stake, 0)
  const totalPotentialPayout = [...liveBets, ...pendingBets].reduce((sum, b) => sum + b.potentialPayout, 0)
  
  // Count winning/losing
  const betsWinning = liveBets.filter(b => b.liveStatus?.isCovering).length
  const betsLosing = liveBets.filter(b => b.liveStatus && !b.liveStatus.isCovering).length
  
  // Aggregate win probability
  const probabilities = liveBets
    .filter(b => b.liveStatus)
    .map(b => b.liveStatus!.winProbability)
  const aggregateWinProbability = probabilities.length > 0
    ? probabilities.reduce((a, b) => a + b, 0) / probabilities.length
    : 50
  
  // Today's P/L
  const realizedPL = settledToday.reduce((sum, b) => {
    if (b.status === 'won') return sum + (b.potentialPayout - b.stake)
    if (b.status === 'lost') return sum - b.stake
    return sum
  }, 0)
  
  // Unrealized P/L (estimated based on current status)
  const unrealizedPL = liveBets.reduce((sum, b) => {
    if (!b.liveStatus) return sum
    const expectedValue = b.liveStatus.isCovering
      ? (b.potentialPayout - b.stake) * (b.liveStatus.winProbability / 100)
      : -b.stake * ((100 - b.liveStatus.winProbability) / 100)
    return sum + expectedValue
  }, 0)
  
  // Generate alerts
  const alerts = generateBetAlerts(liveBets)
  
  return {
    userId,
    totalAtRisk,
    totalPotentialPayout,
    liveBets,
    pendingBets,
    betsWinning,
    betsLosing,
    aggregateWinProbability,
    realizedPL,
    unrealizedPL,
    alerts
  }
}

/**
 * Track a player prop during a game
 */
export async function trackPlayerProp(
  playerId: string,
  playerName: string,
  team: string,
  propType: string,
  line: number,
  selection: 'over' | 'under',
  currentStats: {
    currentValue: number
    timeRemaining: string
    gameProgress: number // 0-1, how much of game is complete
  },
  historicalData?: {
    seasonAverage: number
    last5Average: number
  }
): Promise<PlayerPropTracker> {
  const { currentValue, timeRemaining, gameProgress } = currentStats
  
  // Project final value based on current pace
  const projectionMultiplier = gameProgress > 0 ? 1 / gameProgress : 1
  const projectedFinal = Math.round(currentValue * projectionMultiplier * 10) / 10
  
  // Determine if covering
  const isCovering = selection === 'over' 
    ? currentValue > line || projectedFinal > line
    : currentValue < line && projectedFinal < line
  
  // Calculate margin
  const margin = selection === 'over'
    ? currentValue - line
    : line - currentValue
  
  // Estimate hit probability
  const hitProbability = calculatePropHitProbability(
    currentValue,
    line,
    selection,
    gameProgress
  )
  
  // Determine pace
  const expectedAtThisPoint = line * gameProgress
  let pace: 'ahead' | 'on-pace' | 'behind'
  if (selection === 'over') {
    pace = currentValue > expectedAtThisPoint * 1.1 ? 'ahead' :
           currentValue < expectedAtThisPoint * 0.9 ? 'behind' : 'on-pace'
  } else {
    pace = currentValue < expectedAtThisPoint * 0.9 ? 'ahead' :
           currentValue > expectedAtThisPoint * 1.1 ? 'behind' : 'on-pace'
  }
  
  return {
    playerId,
    playerName,
    team,
    propType,
    line,
    selection,
    currentValue,
    projectedFinal,
    isCovering,
    margin,
    hitProbability,
    timeRemaining,
    pace,
    seasonAverage: historicalData?.seasonAverage || line,
    last5Average: historicalData?.last5Average || line
  }
}

/**
 * Place a new bet (saves to database)
 */
export async function placeBet(
  userId: string,
  betData: {
    oddsId: string
    gameId: string
    sport: string
    betType: UserBet['betType']
    selection: string
    line: number | null
    odds: number
    stake: number
    homeTeam: string
    awayTeam: string
    gameTime: string
  }
): Promise<UserBet | null> {
  const potentialPayout = calculatePayout(betData.stake, betData.odds)
  
  try {
    const { data, error } = await supabase
      .from('user_bets')
      .insert({
        user_id: userId,
        odds_id: betData.oddsId,
        game_id: betData.gameId,
        sport: betData.sport.toUpperCase(),
        bet_type: betData.betType,
        selection: betData.selection,
        line: betData.line,
        odds: betData.odds,
        stake: betData.stake,
        potential_payout: potentialPayout,
        home_team: betData.homeTeam,
        away_team: betData.awayTeam,
        game_time: betData.gameTime,
        status: 'pending',
        created_at: new Date().toISOString()
      })
      .select()
      .single()
    
    if (error) {
      console.error('Error placing bet:', error)
      return null
    }
    
    return formatUserBet(data)
  } catch (error) {
    console.error('Error in placeBet:', error)
    return null
  }
}

/**
 * Update bet status (for settlement or status changes)
 */
export async function updateBetStatus(
  betId: string,
  status: UserBet['status'],
  settledAt?: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('user_bets')
      .update({
        status,
        settled_at: settledAt || (status === 'won' || status === 'lost' || status === 'push' 
          ? new Date().toISOString() 
          : null)
      })
      .eq('id', betId)
    
    return !error
  } catch (error) {
    console.error('Error updating bet status:', error)
    return false
  }
}

/**
 * Calculate cash out value for a bet
 */
export function calculateCashOutValue(
  bet: UserBet,
  currentWinProbability: number,
  houseEdge: number = 0.05 // 5% house edge
): number {
  // Expected value = (win probability * potential win) - (lose probability * stake)
  const winProb = currentWinProbability / 100
  const loseProb = 1 - winProb
  
  const potentialProfit = bet.potentialPayout - bet.stake
  const expectedValue = (winProb * potentialProfit) - (loseProb * bet.stake)
  
  // Cash out value = stake + expected value - house edge
  const cashOutValue = bet.stake + expectedValue - (bet.stake * houseEdge)
  
  // Don't return negative values
  return Math.max(0, Math.round(cashOutValue * 100) / 100)
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function formatUserBet(data: Record<string, unknown>): UserBet {
  return {
    id: data.id as string,
    oddsId: data.odds_id as string,
    gameId: data.game_id as string,
    sport: data.sport as string,
    betType: data.bet_type as UserBet['betType'],
    selection: data.selection as string,
    line: data.line as number | null,
    odds: data.odds as number,
    stake: data.stake as number,
    potentialPayout: data.potential_payout as number,
    homeTeam: data.home_team as string,
    awayTeam: data.away_team as string,
    gameTime: data.game_time as string,
    status: data.status as UserBet['status'],
    liveStatus: data.live_status as LiveBetStatus | undefined,
    createdAt: data.created_at as string,
    settledAt: data.settled_at as string | undefined
  }
}

function calculateLiveBetStatus(
  bet: UserBet,
  gameState: {
    homeScore: number
    awayScore: number
    timeRemaining: string
    quarter?: number
    inning?: number
    period?: number
    possession?: 'home' | 'away'
  }
): LiveBetStatus {
  const { homeScore, awayScore, timeRemaining, possession } = gameState
  const scoreDiff = homeScore - awayScore // Positive = home winning
  
  let isCovering = false
  let currentMargin = 0
  
  // Determine if covering based on bet type
  switch (bet.betType) {
    case 'spread':
      // Parse selection to determine side and line
      // e.g., "KC -7" or "BUF +3"
      const isHomeSpread = bet.selection.includes(bet.homeTeam)
      const spreadLine = bet.line || 0
      
      if (isHomeSpread) {
        // Home team with spread
        currentMargin = scoreDiff + spreadLine
        isCovering = currentMargin > 0
      } else {
        // Away team with spread
        currentMargin = -scoreDiff + spreadLine
        isCovering = currentMargin > 0
      }
      break
    
    case 'moneyline':
      const isHomeML = bet.selection.includes(bet.homeTeam)
      isCovering = isHomeML ? scoreDiff > 0 : scoreDiff < 0
      currentMargin = isHomeML ? scoreDiff : -scoreDiff
      break
    
    case 'total':
      const totalPoints = homeScore + awayScore
      const isOver = bet.selection.toLowerCase().includes('over')
      const totalLine = bet.line || 0
      currentMargin = isOver ? totalPoints - totalLine : totalLine - totalPoints
      isCovering = currentMargin > 0
      break
    
    default:
      // Props and other bet types
      isCovering = false
      currentMargin = 0
  }
  
  // Calculate win probability based on current margin and time remaining
  const winProbability = calculateWinProbability(bet, currentMargin, gameState)
  
  // Generate key moments (would come from game events in real implementation)
  const keyMoments: BetMoment[] = []
  
  // Calculate cash out
  const cashOutValue = calculateCashOutValue(bet, winProbability)
  
  return {
    isCovering,
    currentMargin,
    winProbability,
    probabilityChange: 0, // Would track historical
    probabilityTrend: 'stable',
    currentScore: { home: homeScore, away: awayScore },
    timeRemaining,
    possession,
    keyMoments,
    cashOutAvailable: winProbability > 10 && winProbability < 90,
    cashOutValue,
    estimatedSettlement: estimateSettlement(gameState)
  }
}

function calculateWinProbability(
  bet: UserBet,
  currentMargin: number,
  gameState: {
    homeScore: number
    awayScore: number
    timeRemaining: string
    quarter?: number
    inning?: number
    period?: number
  }
): number {
  // Simple probability model based on margin and time
  // In production, this would use sport-specific models
  
  const sport = bet.sport.toUpperCase()
  let gameProgress = 0.5 // Default
  
  if (sport === 'NFL') {
    const quarter = gameState.quarter || 2
    gameProgress = (quarter - 1) / 4 + (parseTimeRemaining(gameState.timeRemaining, 15) / 60)
  } else if (sport === 'NBA') {
    const quarter = gameState.quarter || 2
    gameProgress = (quarter - 1) / 4 + (parseTimeRemaining(gameState.timeRemaining, 12) / 48)
  } else if (sport === 'MLB') {
    const inning = gameState.inning || 5
    gameProgress = inning / 9
  } else if (sport === 'NHL') {
    const period = gameState.period || 2
    gameProgress = (period - 1) / 3 + (parseTimeRemaining(gameState.timeRemaining, 20) / 60)
  }
  
  // Base probability from current margin
  let probability = 50
  
  if (bet.betType === 'spread' || bet.betType === 'moneyline') {
    // Margin impact decreases as game progresses (current state matters more)
    const marginImpact = Math.min(currentMargin * 3, 40) * gameProgress
    probability = Math.min(95, Math.max(5, 50 + marginImpact))
  } else if (bet.betType === 'total') {
    // Total probability based on pace
    const marginImpact = currentMargin > 0 ? Math.min(currentMargin * 4, 40) : Math.max(currentMargin * 4, -40)
    probability = Math.min(95, Math.max(5, 50 + marginImpact * gameProgress))
  }
  
  return Math.round(probability * 10) / 10
}

function parseTimeRemaining(timeStr: string, quarterMinutes: number): number {
  // Parse time string like "5:42" to minutes remaining in quarter
  const parts = timeStr.split(':')
  if (parts.length === 2) {
    const mins = parseInt(parts[0]) || 0
    const secs = parseInt(parts[1]) || 0
    return quarterMinutes - mins - (secs / 60)
  }
  return quarterMinutes / 2 // Default to middle
}

function calculatePropHitProbability(
  currentValue: number,
  line: number,
  selection: 'over' | 'under',
  gameProgress: number
): number {
  if (selection === 'over') {
    // Already over the line?
    if (currentValue >= line) return 95
    
    // Project pace
    const neededRemaining = line - currentValue
    const currentPace = currentValue / gameProgress
    const projectedRemaining = currentPace * (1 - gameProgress)
    
    if (projectedRemaining >= neededRemaining * 1.2) return 75
    if (projectedRemaining >= neededRemaining) return 55
    if (projectedRemaining >= neededRemaining * 0.8) return 40
    return 25
  } else {
    // Under
    if (gameProgress > 0.9 && currentValue < line) return 90
    
    const neededBuffer = line - currentValue
    const projectedRemaining = (currentValue / gameProgress) * (1 - gameProgress)
    
    if (projectedRemaining < neededBuffer * 0.5) return 80
    if (projectedRemaining < neededBuffer) return 60
    return 40
  }
}

function calculatePayout(stake: number, americanOdds: number): number {
  if (americanOdds > 0) {
    return stake + (stake * (americanOdds / 100))
  } else {
    return stake + (stake * (100 / Math.abs(americanOdds)))
  }
}

function estimateSettlement(gameState: {
  timeRemaining: string
  quarter?: number
  inning?: number
  period?: number
}): string {
  // Estimate when game will end
  const now = new Date()
  
  // Rough estimate: 2-3 hours from now for most games
  const estimatedEnd = new Date(now.getTime() + 2 * 60 * 60 * 1000)
  return estimatedEnd.toISOString()
}

function generateBetAlerts(liveBets: UserBet[]): BetAlert[] {
  const alerts: BetAlert[] = []
  
  for (const bet of liveBets) {
    if (!bet.liveStatus) continue
    
    // Alert if just started covering
    if (bet.liveStatus.isCovering && bet.liveStatus.probabilityChange > 10) {
      alerts.push({
        id: `${bet.id}-covering`,
        betId: bet.id,
        type: 'covering',
        message: `Your ${bet.selection} bet is now COVERING! Win probability: ${bet.liveStatus.winProbability}%`,
        timestamp: new Date().toISOString(),
        acknowledged: false
      })
    }
    
    // Alert if started losing
    if (!bet.liveStatus.isCovering && bet.liveStatus.probabilityChange < -10) {
      alerts.push({
        id: `${bet.id}-losing`,
        betId: bet.id,
        type: 'losing',
        message: `Alert: Your ${bet.selection} bet is now LOSING. Current win probability: ${bet.liveStatus.winProbability}%`,
        timestamp: new Date().toISOString(),
        acknowledged: false
      })
    }
    
    // Close call alert (probability between 45-55)
    if (bet.liveStatus.winProbability >= 45 && bet.liveStatus.winProbability <= 55) {
      alerts.push({
        id: `${bet.id}-close`,
        betId: bet.id,
        type: 'close_call',
        message: `Close game! Your ${bet.selection} bet is a coin flip right now`,
        timestamp: new Date().toISOString(),
        acknowledged: false
      })
    }
    
    // Good cash out opportunity
    if (bet.liveStatus.cashOutAvailable && 
        bet.liveStatus.cashOutValue && 
        bet.liveStatus.cashOutValue > bet.stake * 1.5) {
      alerts.push({
        id: `${bet.id}-cashout`,
        betId: bet.id,
        type: 'cash_out',
        message: `Good cash out opportunity! Lock in $${bet.liveStatus.cashOutValue.toFixed(2)} profit on your ${bet.selection} bet`,
        timestamp: new Date().toISOString(),
        acknowledged: false
      })
    }
  }
  
  return alerts
}
