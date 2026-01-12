/**
 * BETTING SPLITS DATA LAYER
 * Public vs Sharp money percentages with Reverse Line Movement detection
 * 
 * Key Metrics:
 * - Public betting % (ticket count)
 * - Sharp money % (actual dollars wagered)
 * - Reverse Line Movement (RLM) - when line moves opposite of public
 * - Steam moves - sudden sharp action
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

// =============================================================================
// TYPES
// =============================================================================

export interface BettingSplit {
  // Identifiers
  gameId: string
  sport: string
  homeTeam: string
  awayTeam: string
  
  // Current lines
  spread: number
  total: number
  homeML: number
  awayML: number
  
  // Spread splits
  spreadSplits: {
    publicHomePct: number
    publicAwayPct: number
    moneyHomePct: number
    moneyAwayPct: number
    totalTickets: number
    sharpSide: 'home' | 'away' | null
  }
  
  // Total splits
  totalSplits: {
    publicOverPct: number
    publicUnderPct: number
    moneyOverPct: number
    moneyUnderPct: number
    totalTickets: number
    sharpSide: 'over' | 'under' | null
  }
  
  // Moneyline splits
  mlSplits: {
    publicHomePct: number
    publicAwayPct: number
    moneyHomePct: number
    moneyAwayPct: number
    totalTickets: number
  }
  
  // Sharp indicators
  sharpIndicators: {
    isReverseLineMovement: boolean
    rlmSide: string | null
    steamMoveDetected: boolean
    steamSide: string | null
    sharpConsensus: string | null // "HOME -3", "AWAY +3", "OVER 45", etc.
  }
  
  // Metadata
  source: string
  recordedAt: string
}

export interface SharpPlay {
  gameId: string
  sport: string
  homeTeam: string
  awayTeam: string
  playType: 'spread' | 'total' | 'moneyline'
  pick: string
  confidence: number // 1-100
  reasoning: string[]
  indicators: {
    rlm: boolean
    steam: boolean
    moneyPctDiff: number // Difference between public % and money %
  }
}

export interface PublicFadePlay {
  gameId: string
  sport: string
  homeTeam: string
  awayTeam: string
  publicSide: string
  publicPct: number
  fadeSide: string
  historicalEdge: number // ROI of fading this % historically
}

// =============================================================================
// SHARP MONEY DETECTION THRESHOLDS
// =============================================================================

const THRESHOLDS = {
  // If public % vs money % difference exceeds this, sharp action detected
  SHARP_MONEY_DIFF: 15, // 15% difference
  
  // Public betting percentage to consider "heavy public"
  HEAVY_PUBLIC_PCT: 70,
  
  // Steam move = line moves 0.5+ points in short time
  STEAM_MOVE_POINTS: 0.5,
  
  // RLM confidence threshold
  RLM_MIN_PUBLIC_PCT: 60, // Public needs to be at least 60% on one side
  
  // Minimum tickets for reliable data
  MIN_TICKETS_RELIABLE: 1000
}

// =============================================================================
// MAIN API FUNCTIONS
// =============================================================================

/**
 * Get betting splits for a game
 */
export async function getBettingSplits(gameId: string, sport: string): Promise<BettingSplit | null> {
  try {
    // Try to get from enhanced splits table
    const { data } = await supabase
      .from('betting_splits_enhanced')
      .select('*')
      .eq('game_id', gameId)
      .order('recorded_at', { ascending: false })
      .limit(1)
      .single()
    
    if (data) {
      return formatBettingSplit(data)
    }
    
    // Fall back to basic betting_splits table
    const { data: basicData } = await supabase
      .from('betting_splits')
      .select('*')
      .eq('game_id', gameId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
    
    if (basicData) {
      return formatBasicBettingSplit(basicData)
    }
    
    return null
  } catch (error) {
    console.error('Error fetching betting splits:', error)
    return null
  }
}

/**
 * Get all sharp plays for today's games
 */
export async function getSharpPlays(sport?: string): Promise<SharpPlay[]> {
  const sharpPlays: SharpPlay[] = []
  
  try {
    let query = supabase
      .from('betting_splits_enhanced')
      .select('*')
      .gte('recorded_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .order('recorded_at', { ascending: false })
    
    if (sport) {
      query = query.eq('sport', sport.toUpperCase())
    }
    
    const { data } = await query
    
    if (!data) return []
    
    for (const split of data) {
      // Check for sharp spread plays
      const spreadMoneyDiff = Math.abs(
        (split.spread_money_home_pct || 50) - (split.spread_public_home_pct || 50)
      )
      
      if (spreadMoneyDiff >= THRESHOLDS.SHARP_MONEY_DIFF || split.is_reverse_line_movement) {
        const isSharpOnHome = (split.spread_money_home_pct || 50) > (split.spread_public_home_pct || 50)
        
        sharpPlays.push({
          gameId: split.game_id,
          sport: split.sport,
          homeTeam: split.home_team,
          awayTeam: split.away_team,
          playType: 'spread',
          pick: isSharpOnHome 
            ? `${split.home_team} ${split.spread > 0 ? '+' : ''}${split.spread}`
            : `${split.away_team} ${split.spread > 0 ? '-' : '+'}${Math.abs(split.spread)}`,
          confidence: calculateSharpConfidence(spreadMoneyDiff, split.is_reverse_line_movement, split.steam_move_detected),
          reasoning: generateSharpReasoning(split, 'spread', isSharpOnHome),
          indicators: {
            rlm: split.is_reverse_line_movement || false,
            steam: split.steam_move_detected || false,
            moneyPctDiff: spreadMoneyDiff
          }
        })
      }
      
      // Check for sharp total plays
      const totalMoneyDiff = Math.abs(
        (split.total_money_over_pct || 50) - (split.total_public_over_pct || 50)
      )
      
      if (totalMoneyDiff >= THRESHOLDS.SHARP_MONEY_DIFF) {
        const isSharpOnOver = (split.total_money_over_pct || 50) > (split.total_public_over_pct || 50)
        
        sharpPlays.push({
          gameId: split.game_id,
          sport: split.sport,
          homeTeam: split.home_team,
          awayTeam: split.away_team,
          playType: 'total',
          pick: isSharpOnOver ? `OVER ${split.total}` : `UNDER ${split.total}`,
          confidence: calculateSharpConfidence(totalMoneyDiff, false, false),
          reasoning: generateSharpReasoning(split, 'total', isSharpOnOver),
          indicators: {
            rlm: false,
            steam: false,
            moneyPctDiff: totalMoneyDiff
          }
        })
      }
    }
    
    // Sort by confidence
    return sharpPlays.sort((a, b) => b.confidence - a.confidence)
  } catch (error) {
    console.error('Error fetching sharp plays:', error)
    return []
  }
}

/**
 * Get public fade opportunities (heavy public on one side)
 */
export async function getPublicFades(sport?: string): Promise<PublicFadePlay[]> {
  const fades: PublicFadePlay[] = []
  
  try {
    let query = supabase
      .from('betting_splits_enhanced')
      .select('*')
      .gte('recorded_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
    
    if (sport) {
      query = query.eq('sport', sport.toUpperCase())
    }
    
    const { data } = await query
    
    if (!data) return []
    
    for (const split of data) {
      // Check spread for heavy public
      const publicHomePct = split.spread_public_home_pct || 50
      const publicAwayPct = split.spread_public_away_pct || 50
      
      if (publicHomePct >= THRESHOLDS.HEAVY_PUBLIC_PCT) {
        fades.push({
          gameId: split.game_id,
          sport: split.sport,
          homeTeam: split.home_team,
          awayTeam: split.away_team,
          publicSide: `${split.home_team} ${split.spread > 0 ? '+' : ''}${split.spread}`,
          publicPct: publicHomePct,
          fadeSide: `${split.away_team} ${split.spread > 0 ? '-' : '+'}${Math.abs(split.spread)}`,
          historicalEdge: getHistoricalFadeROI(publicHomePct)
        })
      } else if (publicAwayPct >= THRESHOLDS.HEAVY_PUBLIC_PCT) {
        fades.push({
          gameId: split.game_id,
          sport: split.sport,
          homeTeam: split.home_team,
          awayTeam: split.away_team,
          publicSide: `${split.away_team} ${split.spread > 0 ? '-' : '+'}${Math.abs(split.spread)}`,
          publicPct: publicAwayPct,
          fadeSide: `${split.home_team} ${split.spread > 0 ? '+' : ''}${split.spread}`,
          historicalEdge: getHistoricalFadeROI(publicAwayPct)
        })
      }
      
      // Check total for heavy public
      const publicOverPct = split.total_public_over_pct || 50
      const publicUnderPct = split.total_public_under_pct || 50
      
      if (publicOverPct >= THRESHOLDS.HEAVY_PUBLIC_PCT) {
        fades.push({
          gameId: split.game_id,
          sport: split.sport,
          homeTeam: split.home_team,
          awayTeam: split.away_team,
          publicSide: `OVER ${split.total}`,
          publicPct: publicOverPct,
          fadeSide: `UNDER ${split.total}`,
          historicalEdge: getHistoricalFadeROI(publicOverPct)
        })
      } else if (publicUnderPct >= THRESHOLDS.HEAVY_PUBLIC_PCT) {
        fades.push({
          gameId: split.game_id,
          sport: split.sport,
          homeTeam: split.home_team,
          awayTeam: split.away_team,
          publicSide: `UNDER ${split.total}`,
          publicPct: publicUnderPct,
          fadeSide: `OVER ${split.total}`,
          historicalEdge: getHistoricalFadeROI(publicUnderPct)
        })
      }
    }
    
    // Sort by public percentage (fade the heaviest public sides)
    return fades.sort((a, b) => b.publicPct - a.publicPct)
  } catch (error) {
    console.error('Error fetching public fades:', error)
    return []
  }
}

/**
 * Detect Reverse Line Movement for a game
 */
export async function detectRLM(
  gameId: string,
  sport: string,
  currentSpread: number,
  openingSpread: number,
  publicHomePct: number
): Promise<{ isRLM: boolean; rlmSide: string | null; explanation: string }> {
  // RLM occurs when:
  // - Line moves TOWARD the team getting minority of bets
  // Example: Public is 65% on Home -3, but line moves to Home -2.5 (less attractive for home bettors)
  
  const lineMovement = currentSpread - openingSpread
  const publicOnHome = publicHomePct >= 50
  const publicPct = publicOnHome ? publicHomePct : (100 - publicHomePct)
  
  // Need significant public lean (at least 60%)
  if (publicPct < THRESHOLDS.RLM_MIN_PUBLIC_PCT) {
    return {
      isRLM: false,
      rlmSide: null,
      explanation: 'Public betting is too split to detect RLM'
    }
  }
  
  // Check if line moved opposite to public
  // If public on HOME (negative spread means home favored)
  // Line moving MORE negative = more attractive to home bettors = NOT RLM
  // Line moving MORE positive = less attractive to home bettors = IS RLM
  
  const isRLM = (publicOnHome && lineMovement > 0) || (!publicOnHome && lineMovement < 0)
  
  if (!isRLM) {
    return {
      isRLM: false,
      rlmSide: null,
      explanation: 'Line movement aligns with public betting'
    }
  }
  
  const rlmSide = publicOnHome ? 'away' : 'home'
  const explanation = publicOnHome
    ? `Public is ${publicPct}% on ${publicOnHome ? 'home' : 'away'} but line moved ${Math.abs(lineMovement).toFixed(1)} points away from them - SHARP ACTION on away`
    : `Public is ${publicPct}% on ${publicOnHome ? 'home' : 'away'} but line moved ${Math.abs(lineMovement).toFixed(1)} points away from them - SHARP ACTION on home`
  
  return { isRLM, rlmSide, explanation }
}

/**
 * Get splits history for a game (for charting)
 */
export async function getSplitsHistory(gameId: string): Promise<{
  timestamps: string[]
  spreadHomePct: number[]
  spreadMoneyHomePct: number[]
  totalOverPct: number[]
  totalMoneyOverPct: number[]
}> {
  const { data } = await supabase
    .from('betting_splits_enhanced')
    .select('recorded_at, spread_public_home_pct, spread_money_home_pct, total_public_over_pct, total_money_over_pct')
    .eq('game_id', gameId)
    .order('recorded_at', { ascending: true })
  
  if (!data || data.length === 0) {
    return {
      timestamps: [],
      spreadHomePct: [],
      spreadMoneyHomePct: [],
      totalOverPct: [],
      totalMoneyOverPct: []
    }
  }
  
  return {
    timestamps: data.map(d => d.recorded_at),
    spreadHomePct: data.map(d => d.spread_public_home_pct || 50),
    spreadMoneyHomePct: data.map(d => d.spread_money_home_pct || 50),
    totalOverPct: data.map(d => d.total_public_over_pct || 50),
    totalMoneyOverPct: data.map(d => d.total_money_over_pct || 50)
  }
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function formatBettingSplit(data: Record<string, unknown>): BettingSplit {
  const spreadPublicHomePct = (data.spread_public_home_pct as number) || 50
  const spreadPublicAwayPct = (data.spread_public_away_pct as number) || 50
  const spreadMoneyHomePct = (data.spread_money_home_pct as number) || 50
  const spreadMoneyAwayPct = (data.spread_money_away_pct as number) || 50
  
  const totalPublicOverPct = (data.total_public_over_pct as number) || 50
  const totalPublicUnderPct = (data.total_public_under_pct as number) || 50
  const totalMoneyOverPct = (data.total_money_over_pct as number) || 50
  const totalMoneyUnderPct = (data.total_money_under_pct as number) || 50
  
  // Determine sharp sides
  const spreadSharpSide = detectSharpSide(spreadPublicHomePct, spreadMoneyHomePct)
  const totalSharpSide = detectTotalSharpSide(totalPublicOverPct, totalMoneyOverPct)
  
  return {
    gameId: data.game_id as string,
    sport: data.sport as string,
    homeTeam: data.home_team as string,
    awayTeam: data.away_team as string,
    spread: (data.spread as number) || 0,
    total: (data.total as number) || 0,
    homeML: (data.home_ml as number) || 0,
    awayML: (data.away_ml as number) || 0,
    spreadSplits: {
      publicHomePct: spreadPublicHomePct,
      publicAwayPct: spreadPublicAwayPct,
      moneyHomePct: spreadMoneyHomePct,
      moneyAwayPct: spreadMoneyAwayPct,
      totalTickets: (data.spread_tickets_total as number) || 0,
      sharpSide: spreadSharpSide
    },
    totalSplits: {
      publicOverPct: totalPublicOverPct,
      publicUnderPct: totalPublicUnderPct,
      moneyOverPct: totalMoneyOverPct,
      moneyUnderPct: totalMoneyUnderPct,
      totalTickets: (data.total_tickets_total as number) || 0,
      sharpSide: totalSharpSide
    },
    mlSplits: {
      publicHomePct: (data.ml_public_home_pct as number) || 50,
      publicAwayPct: (data.ml_public_away_pct as number) || 50,
      moneyHomePct: (data.ml_money_home_pct as number) || 50,
      moneyAwayPct: (data.ml_money_away_pct as number) || 50,
      totalTickets: (data.ml_tickets_total as number) || 0
    },
    sharpIndicators: {
      isReverseLineMovement: (data.is_reverse_line_movement as boolean) || false,
      rlmSide: (data.sharp_side as string) || null,
      steamMoveDetected: (data.steam_move_detected as boolean) || false,
      steamSide: null,
      sharpConsensus: determineSharpConsensus(data)
    },
    source: (data.source as string) || 'unknown',
    recordedAt: (data.recorded_at as string) || new Date().toISOString()
  }
}

function formatBasicBettingSplit(data: Record<string, unknown>): BettingSplit {
  return {
    gameId: data.game_id as string,
    sport: (data.sport as string) || 'NFL',
    homeTeam: (data.home_team as string) || '',
    awayTeam: (data.away_team as string) || '',
    spread: 0,
    total: 0,
    homeML: 0,
    awayML: 0,
    spreadSplits: {
      publicHomePct: 50,
      publicAwayPct: 50,
      moneyHomePct: 50,
      moneyAwayPct: 50,
      totalTickets: 0,
      sharpSide: null
    },
    totalSplits: {
      publicOverPct: 50,
      publicUnderPct: 50,
      moneyOverPct: 50,
      moneyUnderPct: 50,
      totalTickets: 0,
      sharpSide: null
    },
    mlSplits: {
      publicHomePct: 50,
      publicAwayPct: 50,
      moneyHomePct: 50,
      moneyAwayPct: 50,
      totalTickets: 0
    },
    sharpIndicators: {
      isReverseLineMovement: false,
      rlmSide: null,
      steamMoveDetected: false,
      steamSide: null,
      sharpConsensus: null
    },
    source: 'basic',
    recordedAt: (data.created_at as string) || new Date().toISOString()
  }
}

function detectSharpSide(publicHomePct: number, moneyHomePct: number): 'home' | 'away' | null {
  const diff = moneyHomePct - publicHomePct
  if (diff >= THRESHOLDS.SHARP_MONEY_DIFF) return 'home'
  if (diff <= -THRESHOLDS.SHARP_MONEY_DIFF) return 'away'
  return null
}

function detectTotalSharpSide(publicOverPct: number, moneyOverPct: number): 'over' | 'under' | null {
  const diff = moneyOverPct - publicOverPct
  if (diff >= THRESHOLDS.SHARP_MONEY_DIFF) return 'over'
  if (diff <= -THRESHOLDS.SHARP_MONEY_DIFF) return 'under'
  return null
}

function determineSharpConsensus(data: Record<string, unknown>): string | null {
  const parts: string[] = []
  
  // Check spread sharp
  const spreadMoneyHomePct = (data.spread_money_home_pct as number) || 50
  const spreadPublicHomePct = (data.spread_public_home_pct as number) || 50
  const spreadDiff = spreadMoneyHomePct - spreadPublicHomePct
  
  if (Math.abs(spreadDiff) >= THRESHOLDS.SHARP_MONEY_DIFF) {
    const spread = (data.spread as number) || 0
    if (spreadDiff > 0) {
      parts.push(`${data.home_team} ${spread > 0 ? '+' : ''}${spread}`)
    } else {
      parts.push(`${data.away_team} ${spread > 0 ? '-' : '+'}${Math.abs(spread)}`)
    }
  }
  
  // Check total sharp
  const totalMoneyOverPct = (data.total_money_over_pct as number) || 50
  const totalPublicOverPct = (data.total_public_over_pct as number) || 50
  const totalDiff = totalMoneyOverPct - totalPublicOverPct
  
  if (Math.abs(totalDiff) >= THRESHOLDS.SHARP_MONEY_DIFF) {
    const total = (data.total as number) || 0
    if (totalDiff > 0) {
      parts.push(`OVER ${total}`)
    } else {
      parts.push(`UNDER ${total}`)
    }
  }
  
  return parts.length > 0 ? parts.join(' + ') : null
}

function calculateSharpConfidence(moneyPctDiff: number, hasRLM: boolean, hasSteam: boolean): number {
  let confidence = 50
  
  // Money % difference (max +30)
  confidence += Math.min(30, moneyPctDiff)
  
  // RLM bonus (+15)
  if (hasRLM) confidence += 15
  
  // Steam move bonus (+10)
  if (hasSteam) confidence += 10
  
  return Math.min(100, confidence)
}

function generateSharpReasoning(
  split: Record<string, unknown>,
  type: 'spread' | 'total',
  isSharpOnPositive: boolean
): string[] {
  const reasons: string[] = []
  
  if (type === 'spread') {
    const publicPct = isSharpOnPositive 
      ? (split.spread_public_home_pct as number) || 50
      : (split.spread_public_away_pct as number) || 50
    const moneyPct = isSharpOnPositive
      ? (split.spread_money_home_pct as number) || 50
      : (split.spread_money_away_pct as number) || 50
    
    reasons.push(`Sharp money at ${moneyPct.toFixed(0)}% vs public at ${publicPct.toFixed(0)}%`)
    
    if (split.is_reverse_line_movement) {
      reasons.push('Reverse line movement detected')
    }
    
    if (split.steam_move_detected) {
      reasons.push('Steam move detected - sudden sharp action')
    }
  } else {
    const publicPct = isSharpOnPositive
      ? (split.total_public_over_pct as number) || 50
      : (split.total_public_under_pct as number) || 50
    const moneyPct = isSharpOnPositive
      ? (split.total_money_over_pct as number) || 50
      : (split.total_money_under_pct as number) || 50
    
    reasons.push(`Sharp money at ${moneyPct.toFixed(0)}% vs public at ${publicPct.toFixed(0)}%`)
  }
  
  return reasons
}

function getHistoricalFadeROI(publicPct: number): number {
  // Based on historical data, fading heavy public sides has positive ROI
  // These numbers are approximations based on industry research
  if (publicPct >= 80) return 8.5 // 8.5% ROI fading 80%+ public
  if (publicPct >= 75) return 5.2
  if (publicPct >= 70) return 3.1
  return 1.5
}

/**
 * Generate betting split insights for a game
 */
export function generateSplitsInsights(splits: BettingSplit): string[] {
  const insights: string[] = []
  
  // Spread insights
  const spreadPublicDiff = Math.abs(splits.spreadSplits.publicHomePct - 50)
  if (spreadPublicDiff >= 20) {
    const heavySide = splits.spreadSplits.publicHomePct > 50 ? 'home' : 'away'
    insights.push(`Heavy public action (${Math.max(splits.spreadSplits.publicHomePct, splits.spreadSplits.publicAwayPct)}%) on ${heavySide}`)
  }
  
  if (splits.spreadSplits.sharpSide) {
    insights.push(`Sharp money favoring ${splits.spreadSplits.sharpSide.toUpperCase()} spread`)
  }
  
  // Total insights
  const totalPublicDiff = Math.abs(splits.totalSplits.publicOverPct - 50)
  if (totalPublicDiff >= 20) {
    const heavySide = splits.totalSplits.publicOverPct > 50 ? 'OVER' : 'UNDER'
    insights.push(`Heavy public action (${Math.max(splits.totalSplits.publicOverPct, splits.totalSplits.publicUnderPct)}%) on ${heavySide}`)
  }
  
  if (splits.totalSplits.sharpSide) {
    insights.push(`Sharp money favoring ${splits.totalSplits.sharpSide.toUpperCase()}`)
  }
  
  // Sharp indicators
  if (splits.sharpIndicators.isReverseLineMovement) {
    insights.push('⚠️ REVERSE LINE MOVEMENT - Line moving opposite of public betting')
  }
  
  if (splits.sharpIndicators.steamMoveDetected) {
    insights.push('🔥 STEAM MOVE - Sudden sharp action detected')
  }
  
  if (splits.sharpIndicators.sharpConsensus) {
    insights.push(`💰 Sharp consensus: ${splits.sharpIndicators.sharpConsensus}`)
  }
  
  return insights
}
