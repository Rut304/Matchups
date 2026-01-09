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
  publicSide?: 'home' | 'away'
  sharpSide?: 'home' | 'away'
  publicPct?: number
  sharpPct?: number
  moneyDifferential?: number
  
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
// MOCK DATA GENERATION - For demo/testing
// In production, these would come from real betting data APIs
// ============================================================================

const NFL_TEAMS = ['Patriots', 'Bills', 'Dolphins', 'Jets', 'Chiefs', 'Raiders', 'Chargers', 'Broncos', 
                   'Ravens', 'Steelers', 'Browns', 'Bengals', 'Titans', 'Colts', 'Jaguars', 'Texans',
                   'Cowboys', 'Eagles', 'Giants', 'Commanders', 'Packers', 'Bears', 'Vikings', 'Lions',
                   'Buccaneers', 'Saints', 'Falcons', 'Panthers', '49ers', 'Seahawks', 'Rams', 'Cardinals']

const NBA_TEAMS = ['Celtics', 'Nets', 'Knicks', '76ers', 'Raptors', 'Bulls', 'Cavaliers', 'Pistons',
                   'Pacers', 'Bucks', 'Heat', 'Magic', 'Hawks', 'Hornets', 'Wizards', 'Nuggets',
                   'Timberwolves', 'Thunder', 'Trail Blazers', 'Jazz', 'Warriors', 'Clippers', 'Lakers',
                   'Suns', 'Kings', 'Mavericks', 'Rockets', 'Grizzlies', 'Pelicans', 'Spurs']

const BOOKS = ['DraftKings', 'FanDuel', 'BetMGM', 'Caesars', 'PointsBet', 'BetRivers']

export function generateMockEdgeAlerts(sport: string = 'NFL', count: number = 5): EdgeAlert[] {
  const alerts: EdgeAlert[] = []
  const teams = sport === 'NFL' ? NFL_TEAMS : NBA_TEAMS
  
  for (let i = 0; i < count; i++) {
    const homeTeam = teams[Math.floor(Math.random() * teams.length)]
    let awayTeam = teams[Math.floor(Math.random() * teams.length)]
    while (awayTeam === homeTeam) {
      awayTeam = teams[Math.floor(Math.random() * teams.length)]
    }
    
    const gameId = `game-${Date.now()}-${i}`
    const alertType = Math.random()
    
    if (alertType < 0.3) {
      // RLM Alert
      const openSpread = -3 + Math.random() * 6
      const move = (Math.random() - 0.5) * 3
      const publicPct = 55 + Math.random() * 30
      
      const alert = detectRLM(gameId, sport, homeTeam, awayTeam, openSpread, openSpread + move, publicPct)
      if (alert) alerts.push(alert)
    } else if (alertType < 0.5) {
      // Steam Move
      const lineBefore = -3 + Math.random() * 6
      const move = 1 + Math.random() * 2
      const minutes = 5 + Math.floor(Math.random() * 10)
      const books = 3 + Math.floor(Math.random() * 3)
      
      const alert = detectSteamMove(gameId, sport, homeTeam, awayTeam, lineBefore, lineBefore - move, minutes, books)
      if (alert) alerts.push(alert)
    } else if (alertType < 0.75) {
      // Sharp vs Public
      const publicHome = 60 + Math.random() * 25
      const publicAway = 100 - publicHome
      const moneyHome = 35 + Math.random() * 25
      const moneyAway = 100 - moneyHome
      
      const alert = detectSharpPublicSplit(gameId, sport, homeTeam, awayTeam, publicHome, publicAway, moneyHome, moneyAway)
      if (alert) alerts.push(alert)
    } else {
      // Arbitrage (rare)
      const book1 = BOOKS[Math.floor(Math.random() * BOOKS.length)]
      let book2 = BOOKS[Math.floor(Math.random() * BOOKS.length)]
      while (book2 === book1) {
        book2 = BOOKS[Math.floor(Math.random() * BOOKS.length)]
      }
      
      // Generate odds that might create arb
      const homeOdds = 100 + Math.floor(Math.random() * 150)
      const awayOdds = 100 + Math.floor(Math.random() * 150)
      
      const alert = detectArbitrage(gameId, sport, homeTeam, awayTeam, book1, homeOdds, book2, awayOdds)
      if (alert) alerts.push(alert)
    }
  }
  
  // Sort by severity
  const severityOrder = { critical: 0, major: 1, minor: 2, info: 3 }
  return alerts.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity])
}

/**
 * Get edge alerts for a specific game
 */
export function getGameEdgeAlerts(gameId: string, sport: string): EdgeAlert[] {
  // In production, this would fetch from database/cache
  // For now, generate consistent mock data based on gameId
  const seed = gameId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  const hasRLM = seed % 3 === 0
  const hasSteam = seed % 5 === 0
  const hasSharpSplit = seed % 4 === 0
  
  const alerts: EdgeAlert[] = []
  
  if (hasRLM) {
    alerts.push({
      id: `rlm-${gameId}`,
      type: 'rlm',
      gameId,
      sport,
      severity: 'major',
      title: 'RLM Detected',
      description: '72% of bets on favorite, but line moved from -6 to -4.5. Sharp action on underdog.',
      data: {
        lineOpenSpread: -6,
        lineCurrentSpread: -4.5,
        lineMove: 1.5,
        publicBetPct: 72,
        sharpSide: 'away',
      },
      timestamp: new Date().toISOString(),
      confidence: 78,
      expectedValue: 3.5,
    })
  }
  
  if (hasSteam) {
    alerts.push({
      id: `steam-${gameId}`,
      type: 'steam',
      gameId,
      sport,
      severity: 'critical',
      title: '🚨 Steam Move Alert',
      description: 'Line moved 2 pts in 8 minutes across 5 books. Major sharp action.',
      data: {
        steamMagnitude: 2,
        steamSpeed: 8,
        booksAffected: 5,
        lineMove: -2,
      },
      timestamp: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 45 * 60 * 1000).toISOString(),
      confidence: 88,
      expectedValue: 6,
    })
  }
  
  if (hasSharpSplit) {
    alerts.push({
      id: `sharp-${gameId}`,
      type: 'sharp-public',
      gameId,
      sport,
      severity: 'minor',
      title: 'Sharp/Public Split',
      description: '68% of bets on home team, but 61% of money on away team.',
      data: {
        publicSide: 'home',
        sharpSide: 'away',
        publicPct: 68,
        sharpPct: 61,
      },
      timestamp: new Date().toISOString(),
      confidence: 65,
      expectedValue: 2.2,
    })
  }
  
  return alerts
}

/**
 * Get all active edge alerts across all games
 */
export async function getActiveEdgeAlerts(sport?: string): Promise<EdgeAlert[]> {
  // In production: fetch from database where expiresAt > now
  // For demo: generate mock alerts
  const sports = sport ? [sport] : ['NFL', 'NBA', 'NHL']
  const allAlerts: EdgeAlert[] = []
  
  for (const s of sports) {
    allAlerts.push(...generateMockEdgeAlerts(s, 3))
  }
  
  return allAlerts.slice(0, 10) // Limit to 10 most important
}
