/**
 * Edge Features - Advanced betting intelligence signals
 * 
 * Features:
 * 1. RLM (Reverse Line Movement) - Line moves opposite to betting percentages
 * 2. Steam Moves - Sharp sudden line movements across multiple books
 * 3. CLV (Closing Line Value) - Track if picks beat the closing line
 * 4. Sharp vs Public - Compare sharp money to public betting
 * 5. Arbitrage Alerts - Cross-book arbitrage opportunities
 * 6. Props Comparison - Best odds across books for player props
 */

export type EdgeType = 'rlm' | 'steam' | 'clv' | 'sharp-public' | 'arbitrage' | 'props'

export type EdgeSeverity = 'critical' | 'major' | 'minor' | 'info'

export interface EdgeAlert {
  id: string
  type: EdgeType
  gameId: string
  sport: string
  severity: EdgeSeverity
  title: string
  description: string
  data: EdgeData
  timestamp: string
  expiresAt?: string
  confidence: number // 0-100
  expectedValue?: number // Expected ROI %
}

export interface EdgeData {
  // RLM specific
  lineOpenSpread?: number
  lineCurrentSpread?: number
  lineMove?: number
  publicBetPct?: number
  sharpBetPct?: number
  
  // Steam specific
  steamMagnitude?: number // How much line moved
  steamSpeed?: number // How fast (minutes)
  booksAffected?: number
  
  // CLV specific
  pickLine?: number
  closingLine?: number
  clvValue?: number
  
  // Sharp vs Public
  publicSide?: string // 'home', 'away', 'Over', 'Under', team name
  sharpSide?: string // 'home', 'away', 'Over', 'Under', team name
  publicPct?: number
  sharpPct?: number
  moneyPct?: number
  moneyDifferential?: number
  betType?: string
  fadeSide?: string
  line?: number
  
  // Arbitrage
  book1?: string
  book1Odds?: number
  book2?: string
  book2Odds?: number
  arbPercentage?: number
  
  // Props
  propType?: string
  playerName?: string
  bestBook?: string
  bestOdds?: number
  avgOdds?: number
  edgePct?: number
  
  // Data source
  source?: 'action-network' | 'database' | 'odds-api'
  
  // Allow additional properties
  [key: string]: unknown
}

// Edge feature configuration
export interface EdgeFeatureConfig {
  enabled: boolean
  minConfidence: number
  alertThreshold: EdgeSeverity
  notifications: boolean
}

export const defaultEdgeConfig: Record<EdgeType, EdgeFeatureConfig> = {
  rlm: { enabled: true, minConfidence: 60, alertThreshold: 'major', notifications: true },
  steam: { enabled: true, minConfidence: 70, alertThreshold: 'critical', notifications: true },
  clv: { enabled: true, minConfidence: 50, alertThreshold: 'minor', notifications: false },
  'sharp-public': { enabled: true, minConfidence: 65, alertThreshold: 'major', notifications: true },
  arbitrage: { enabled: true, minConfidence: 90, alertThreshold: 'critical', notifications: true },
  props: { enabled: true, minConfidence: 55, alertThreshold: 'minor', notifications: false },
}

// Severity colors for UI
export const severityColors: Record<EdgeSeverity, { bg: string; text: string; border: string }> = {
  critical: { bg: 'rgba(255,68,85,0.15)', text: '#FF4455', border: 'rgba(255,68,85,0.4)' },
  major: { bg: 'rgba(255,107,0,0.15)', text: '#FF6B00', border: 'rgba(255,107,0,0.4)' },
  minor: { bg: 'rgba(255,215,0,0.15)', text: '#FFD700', border: 'rgba(255,215,0,0.4)' },
  info: { bg: 'rgba(0,168,255,0.15)', text: '#00A8FF', border: 'rgba(0,168,255,0.4)' },
}

// Edge type icons
export const edgeTypeIcons: Record<EdgeType, string> = {
  rlm: '🔄',
  steam: '💨',
  clv: '📈',
  'sharp-public': '🎯',
  arbitrage: '💰',
  props: '📊',
}

// Edge type labels
export const edgeTypeLabels: Record<EdgeType, string> = {
  rlm: 'Reverse Line Movement',
  steam: 'Steam Move',
  clv: 'CLV Opportunity',
  'sharp-public': 'Sharp vs Public',
  arbitrage: 'Arbitrage Alert',
  props: 'Props Edge',
}

/**
 * Detect Reverse Line Movement (RLM)
 * When line moves opposite to public betting percentages
 */
export function detectRLM(
  gameId: string,
  sport: string,
  homeTeam: string,
  awayTeam: string,
  openSpread: number,
  currentSpread: number,
  publicHomePct: number,
): EdgeAlert | null {
  const lineMove = currentSpread - openSpread
  const publicFavoringSide = publicHomePct > 50 ? 'home' : 'away'
  
  // RLM: Public betting heavy on one side, but line moves toward that side
  // (Making the popular side more expensive = sharp money on other side)
  const isRLM = (publicHomePct > 60 && lineMove < -0.5) || 
                (publicHomePct < 40 && lineMove > 0.5)
  
  if (!isRLM) return null
  
  const severity: EdgeSeverity = 
    Math.abs(lineMove) >= 2 ? 'critical' :
    Math.abs(lineMove) >= 1 ? 'major' : 'minor'
  
  const confidence = Math.min(95, 50 + Math.abs(publicHomePct - 50) + Math.abs(lineMove) * 10)
  
  const sharpSide = publicFavoringSide === 'home' ? awayTeam : homeTeam
  
  return {
    id: `rlm-${gameId}-${Date.now()}`,
    type: 'rlm',
    gameId,
    sport,
    severity,
    title: `RLM Alert: Sharp money on ${sharpSide}`,
    description: `${publicHomePct}% of bets on ${publicFavoringSide === 'home' ? homeTeam : awayTeam}, but line moved ${lineMove > 0 ? '+' : ''}${lineMove.toFixed(1)} pts toward them. Sharps likely on ${sharpSide}.`,
    data: {
      lineOpenSpread: openSpread,
      lineCurrentSpread: currentSpread,
      lineMove,
      publicBetPct: publicHomePct,
      sharpSide: publicFavoringSide === 'home' ? 'away' : 'home',
    },
    timestamp: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(), // 4 hours
    confidence,
    expectedValue: Math.abs(lineMove) * 2.5, // Rough EV estimate
  }
}

/**
 * Detect Steam Moves
 * Sudden sharp line movements across multiple sportsbooks
 */
export function detectSteamMove(
  gameId: string,
  sport: string,
  homeTeam: string,
  awayTeam: string,
  lineBefore: number,
  lineAfter: number,
  minutesElapsed: number,
  booksMoving: number,
): EdgeAlert | null {
  const move = Math.abs(lineAfter - lineBefore)
  
  // Steam: 1+ point move in under 15 minutes across 3+ books
  const isSteam = move >= 1 && minutesElapsed <= 15 && booksMoving >= 3
  
  if (!isSteam) return null
  
  const severity: EdgeSeverity = 
    move >= 2.5 ? 'critical' :
    move >= 1.5 ? 'major' : 'minor'
  
  const movingToward = lineAfter < lineBefore ? homeTeam : awayTeam
  const confidence = Math.min(95, 60 + move * 10 + booksMoving * 5)
  
  return {
    id: `steam-${gameId}-${Date.now()}`,
    type: 'steam',
    gameId,
    sport,
    severity,
    title: `🚨 Steam Move: ${movingToward}`,
    description: `Line moved ${move.toFixed(1)} pts in ${minutesElapsed} min across ${booksMoving} books. Sharp action detected on ${movingToward}.`,
    data: {
      lineOpenSpread: lineBefore,
      lineCurrentSpread: lineAfter,
      lineMove: lineAfter - lineBefore,
      steamMagnitude: move,
      steamSpeed: minutesElapsed,
      booksAffected: booksMoving,
    },
    timestamp: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 1 * 60 * 60 * 1000).toISOString(), // 1 hour - steam expires fast
    confidence,
    expectedValue: move * 3, // Steam moves have higher EV
  }
}

/**
 * Calculate CLV (Closing Line Value)
 * Positive CLV means you got better odds than closing line
 */
export function calculateCLV(
  pickLine: number,
  closingLine: number,
  betType: 'spread' | 'total' | 'ml',
): { clv: number; isPositive: boolean; description: string } {
  const clv = pickLine - closingLine
  
  return {
    clv,
    isPositive: clv > 0,
    description: clv > 0 
      ? `+${clv.toFixed(1)} pts CLV (you beat the closing line)`
      : `${clv.toFixed(1)} pts CLV (closing line was better)`,
  }
}

/**
 * Detect Sharp vs Public disagreement
 * When sharp money and public money are on opposite sides
 */
export function detectSharpPublicSplit(
  gameId: string,
  sport: string,
  homeTeam: string,
  awayTeam: string,
  publicHomePct: number,
  publicAwayPct: number,
  moneyHomePct: number,
  moneyAwayPct: number,
): EdgeAlert | null {
  // Significant split: 60%+ public on one side, but money split opposite
  const publicSide = publicHomePct > publicAwayPct ? 'home' : 'away'
  const moneySide = moneyHomePct > moneyAwayPct ? 'home' : 'away'
  
  const publicDominance = Math.max(publicHomePct, publicAwayPct)
  const moneyDominance = Math.max(moneyHomePct, moneyAwayPct)
  
  // Sharp disagreement: public heavily on one side, money heavily on other
  const isSplit = publicDominance >= 60 && moneyDominance >= 55 && publicSide !== moneySide
  
  if (!isSplit) return null
  
  const severity: EdgeSeverity = 
    publicDominance >= 75 && moneyDominance >= 65 ? 'critical' :
    publicDominance >= 65 ? 'major' : 'minor'
  
  const sharpTeam = moneySide === 'home' ? homeTeam : awayTeam
  const publicTeam = publicSide === 'home' ? homeTeam : awayTeam
  const confidence = Math.min(90, 40 + (publicDominance - 50) + (moneyDominance - 50))
  
  return {
    id: `sharp-${gameId}-${Date.now()}`,
    type: 'sharp-public',
    gameId,
    sport,
    severity,
    title: `Sharp vs Public: Sharps on ${sharpTeam}`,
    description: `${publicDominance.toFixed(0)}% of bets on ${publicTeam}, but ${moneyDominance.toFixed(0)}% of money on ${sharpTeam}. Big money disagrees with public.`,
    data: {
      publicSide,
      sharpSide: moneySide,
      publicPct: publicDominance,
      sharpPct: moneyDominance,
      moneyDifferential: moneyDominance - publicDominance,
    },
    timestamp: new Date().toISOString(),
    confidence,
    expectedValue: (publicDominance - 50) * 0.2, // Fading public has positive EV historically
  }
}

/**
 * Detect Arbitrage Opportunities
 * When odds across books guarantee profit regardless of outcome
 */
export function detectArbitrage(
  gameId: string,
  sport: string,
  homeTeam: string,
  awayTeam: string,
  book1: string,
  book1HomeOdds: number,
  book2: string,
  book2AwayOdds: number,
): EdgeAlert | null {
  // Convert American odds to implied probability
  const impliedProb1 = book1HomeOdds > 0 
    ? 100 / (book1HomeOdds + 100)
    : Math.abs(book1HomeOdds) / (Math.abs(book1HomeOdds) + 100)
  
  const impliedProb2 = book2AwayOdds > 0
    ? 100 / (book2AwayOdds + 100)
    : Math.abs(book2AwayOdds) / (Math.abs(book2AwayOdds) + 100)
  
  const totalImplied = impliedProb1 + impliedProb2
  
  // Arb exists if total implied probability < 100%
  const arbPercentage = (1 - totalImplied) * 100
  
  if (arbPercentage <= 0) return null
  
  const severity: EdgeSeverity = 
    arbPercentage >= 3 ? 'critical' :
    arbPercentage >= 1.5 ? 'major' : 'minor'
  
  return {
    id: `arb-${gameId}-${Date.now()}`,
    type: 'arbitrage',
    gameId,
    sport,
    severity,
    title: `💰 Arb Found: ${arbPercentage.toFixed(2)}% guaranteed`,
    description: `${homeTeam} @ ${book1} (${book1HomeOdds > 0 ? '+' : ''}${book1HomeOdds}) vs ${awayTeam} @ ${book2} (${book2AwayOdds > 0 ? '+' : ''}${book2AwayOdds})`,
    data: {
      book1,
      book1Odds: book1HomeOdds,
      book2,
      book2Odds: book2AwayOdds,
      arbPercentage,
    },
    timestamp: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 min - arbs disappear fast
    confidence: 99, // Arbs are mathematically certain
    expectedValue: arbPercentage,
  }
}

// ============================================================================
// REAL DATA FUNCTIONS
// These fetch from The Odds API to detect real edge opportunities
// NO FAKE DATA - returns empty if real data isn't available
// ============================================================================

import { oddsClient } from './api/odds'

/**
 * Get REAL edge alerts from The Odds API data
 * Compares lines across multiple books to find real edges
 */
export async function getRealEdgeAlerts(sport: string): Promise<EdgeAlert[]> {
  const alerts: EdgeAlert[] = []
  
  try {
    // Fetch real odds from The Odds API
    const allOdds = await oddsClient.getOdds(sport)
    
    if (!allOdds || allOdds.length === 0) {
      console.log(`[Edge] No odds data available for ${sport}`)
      return []
    }
    
    // Group odds by game
    const gameOdds = new Map<string, typeof allOdds>()
    for (const odds of allOdds) {
      const existing = gameOdds.get(odds.gameId) || []
      existing.push(odds)
      gameOdds.set(odds.gameId, existing)
    }
    
    // Analyze each game for real edges
    for (const [gameId, bookLines] of gameOdds) {
      if (bookLines.length < 2) continue // Need multiple books to compare
      
      // Extract team names from odds (The Odds API includes this in the response)
      const homeTeam = 'Home' // Would come from game data
      const awayTeam = 'Away'
      
      // Check for line discrepancies (potential arb or steam indicator)
      const spreads = bookLines.map(b => b.spread.home)
      const minSpread = Math.min(...spreads)
      const maxSpread = Math.max(...spreads)
      const spreadDiff = maxSpread - minSpread
      
      // If spread varies by 1.5+ points across books, that's notable
      if (spreadDiff >= 1.5) {
        const bestBook = bookLines.find(b => b.spread.home === maxSpread)
        const worstBook = bookLines.find(b => b.spread.home === minSpread)
        
        alerts.push({
          id: `line-diff-${gameId}-${Date.now()}`,
          type: 'steam',
          gameId,
          sport,
          severity: spreadDiff >= 2.5 ? 'critical' : spreadDiff >= 2 ? 'major' : 'minor',
          title: `Line Discrepancy: ${spreadDiff.toFixed(1)} pt spread`,
          description: `${bestBook?.bookmaker}: ${maxSpread > 0 ? '+' : ''}${maxSpread} vs ${worstBook?.bookmaker}: ${minSpread > 0 ? '+' : ''}${minSpread}`,
          data: {
            lineOpenSpread: minSpread,
            lineCurrentSpread: maxSpread,
            lineMove: spreadDiff,
            booksAffected: bookLines.length,
          },
          timestamp: new Date().toISOString(),
          confidence: Math.min(85, 50 + spreadDiff * 15),
          expectedValue: spreadDiff * 1.5,
        })
      }
      
      // Check for arbitrage opportunities
      const homeMLs = bookLines.map(b => ({ ml: b.moneyline.home, book: b.bookmaker }))
      const awayMLs = bookLines.map(b => ({ ml: b.moneyline.away, book: b.bookmaker }))
      
      // Find best home ML and best away ML across books
      const bestHomeML = homeMLs.reduce((best, curr) => curr.ml > best.ml ? curr : best)
      const bestAwayML = awayMLs.reduce((best, curr) => curr.ml > best.ml ? curr : best)
      
      // Check if arbitrage exists
      const impliedHome = bestHomeML.ml > 0 
        ? 100 / (bestHomeML.ml + 100)
        : Math.abs(bestHomeML.ml) / (Math.abs(bestHomeML.ml) + 100)
      const impliedAway = bestAwayML.ml > 0
        ? 100 / (bestAwayML.ml + 100)
        : Math.abs(bestAwayML.ml) / (Math.abs(bestAwayML.ml) + 100)
      
      const totalImplied = impliedHome + impliedAway
      const arbPct = (1 - totalImplied) * 100
      
      if (arbPct > 0) {
        alerts.push({
          id: `arb-${gameId}-${Date.now()}`,
          type: 'arbitrage',
          gameId,
          sport,
          severity: arbPct >= 2 ? 'critical' : arbPct >= 1 ? 'major' : 'minor',
          title: `💰 Arbitrage: ${arbPct.toFixed(2)}% guaranteed`,
          description: `Home @ ${bestHomeML.book} (${bestHomeML.ml > 0 ? '+' : ''}${bestHomeML.ml}) + Away @ ${bestAwayML.book} (${bestAwayML.ml > 0 ? '+' : ''}${bestAwayML.ml})`,
          data: {
            book1: bestHomeML.book,
            book1Odds: bestHomeML.ml,
            book2: bestAwayML.book,
            book2Odds: bestAwayML.ml,
            arbPercentage: arbPct,
          },
          timestamp: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
          confidence: 99,
          expectedValue: arbPct,
        })
      }
    }
    
    // Sort by severity
    const severityOrder = { critical: 0, major: 1, minor: 2, info: 3 }
    return alerts.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity])
    
  } catch (error) {
    console.error(`[Edge] Error fetching edge alerts for ${sport}:`, error)
    return []
  }
}

/**
 * @deprecated Use getRealEdgeAlerts instead
 * This function generated FAKE data - keeping signature for backwards compatibility
 * but now returns empty array
 */
export function generateMockEdgeAlerts(sport: string = 'NFL', count: number = 5): EdgeAlert[] {
  console.warn('[Edge] generateMockEdgeAlerts is deprecated - use getRealEdgeAlerts for real data')
  // Return empty - no fake data
  return []
}

/**
 * Get edge alerts for a specific game
 * Returns empty array - real alerts should be fetched from database
 */
export function getGameEdgeAlerts(_gameId: string, _sport: string): EdgeAlert[] {
  // TODO: Fetch real alerts from database for this game
  // Mock data has been removed - return empty array
  console.log('[Edge] getGameEdgeAlerts called - no mock data, use getActiveEdgeAlerts for real data')
  return []
}

/**
 * Get all active edge alerts across all games
 * Uses real data from database - populated by cron jobs and real-time detection
 */
export async function getActiveEdgeAlerts(sport?: string): Promise<EdgeAlert[]> {
  try {
    // Fetch real alerts from database
    const { createClient } = await import('@/lib/supabase/client')
    const supabase = createClient()
    
    let query = supabase
      .from('edge_alerts')
      .select('*')
      .gt('expires_at', new Date().toISOString())
      .order('confidence', { ascending: false })
      .limit(20)
    
    if (sport) {
      query = query.eq('sport', sport.toUpperCase())
    }
    
    const { data: alerts, error } = await query
    
    if (error) {
      console.error('[Edge] Error fetching alerts:', error)
      return []
    }
    
    if (alerts && alerts.length > 0) {
      return alerts.map((a: Record<string, unknown>) => ({
        id: a.id as string,
        gameId: a.game_id as string,
        type: a.type as string,
        confidence: a.confidence as number,
        message: a.message as string,
        sport: a.sport as string,
        source: (a.source as string) || 'database',
        detectedAt: a.created_at as string,
        expiresAt: a.expires_at as string,
        data: (a.data as Record<string, unknown>) || {}
      })) as EdgeAlert[]
    }
    
    // If no alerts in DB, try the API
    const apiUrl = typeof window !== 'undefined' ? '/api/edge/alerts' : `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/edge/alerts`
    const res = await fetch(apiUrl)
    const data = await res.json()
    
    if (data.success && Array.isArray(data.alerts)) {
      return data.alerts.map((a: Record<string, unknown>) => ({
        id: a.id as string,
        gameId: a.gameId as string,
        type: a.type as string,
        confidence: (a.severity === 'critical' ? 95 : a.severity === 'high' ? 80 : 65) as number,
        message: a.message as string,
        sport: a.sport as string,
        source: 'api',
        detectedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
        data: {}
      })) as EdgeAlert[]
    }
    
    return []
  } catch (error) {
    console.error('[Edge] Error fetching active alerts:', error)
    return []
  }
}
