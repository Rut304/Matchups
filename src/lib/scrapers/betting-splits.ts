/**
 * Betting Splits Scraper
 * Fetches real-time public betting percentages from free sources
 * 
 * Primary Source: SportsBettingDime (aggregates multiple books)
 * Backup Source: Pregame.com Game Center
 */

import { createClient } from '@/lib/supabase/client'

export interface BettingSplit {
  gameId: string
  sport: 'NFL' | 'NBA' | 'NHL' | 'MLB' | 'NCAAF' | 'NCAAB'
  homeTeam: string
  awayTeam: string
  gameTime: string
  spread: {
    homeBetPct: number
    awayBetPct: number
    homeMoneyPct: number
    awayMoneyPct: number
    line: number
  }
  moneyline: {
    homeBetPct: number
    awayBetPct: number
    homeMoneyPct: number
    awayMoneyPct: number
    homeOdds: number
    awayOdds: number
  }
  total: {
    overBetPct: number
    underBetPct: number
    overMoneyPct: number
    underMoneyPct: number
    line: number
  }
  source: string
  fetchedAt: string
}

export interface ReverseLineMovement {
  gameId: string
  sport: string
  homeTeam: string
  awayTeam: string
  betType: 'spread' | 'total' | 'moneyline'
  publicPct: number
  publicSide: string
  lineMovement: {
    open: number
    current: number
    direction: 'toward_public' | 'against_public'
  }
  sharpConfidence: number // 0-100
  detectedAt: string
}

// =============================================================================
// SPORTSBETTINGDIME PARSER
// =============================================================================

/**
 * Parse betting splits from SportsBettingDime HTML
 * They aggregate from DraftKings, FanDuel, BetMGM, Caesars, etc.
 */
export function parseSportsBettingDimeData(html: string, sport: string): BettingSplit[] {
  const splits: BettingSplit[] = []
  
  // Parse the table structure from SBD
  // Their format: Team | Odds | Bet% | Money% for each bet type
  const gameRows = html.match(/<tr[^>]*>[\s\S]*?<\/tr>/gi) || []
  
  for (let i = 0; i < gameRows.length - 1; i += 2) {
    const awayRow = gameRows[i]
    const homeRow = gameRows[i + 1]
    
    if (!awayRow || !homeRow) continue
    
    // Extract team names
    const awayTeamMatch = awayRow.match(/alt="([^"]+)"/i)
    const homeTeamMatch = homeRow.match(/alt="([^"]+)"/i)
    
    if (!awayTeamMatch || !homeTeamMatch) continue
    
    // Extract percentages (format: XX%)
    const awayPcts = awayRow.match(/(\d{1,3})%/g) || []
    const homePcts = homeRow.match(/(\d{1,3})%/g) || []
    
    // Extract odds/lines
    const awayOdds = awayRow.match(/[+-]\d+\.?\d*/g) || []
    const homeOdds = homeRow.match(/[+-]\d+\.?\d*/g) || []
    
    const split: BettingSplit = {
      gameId: `${sport.toLowerCase()}-${Date.now()}-${i}`,
      sport: sport as BettingSplit['sport'],
      homeTeam: homeTeamMatch[1],
      awayTeam: awayTeamMatch[1],
      gameTime: new Date().toISOString(),
      spread: {
        homeBetPct: parseInt(homePcts[0]?.replace('%', '') || '50'),
        awayBetPct: parseInt(awayPcts[0]?.replace('%', '') || '50'),
        homeMoneyPct: parseInt(homePcts[1]?.replace('%', '') || '50'),
        awayMoneyPct: parseInt(awayPcts[1]?.replace('%', '') || '50'),
        line: parseFloat(homeOdds[0] || '0')
      },
      moneyline: {
        homeBetPct: parseInt(homePcts[2]?.replace('%', '') || '50'),
        awayBetPct: parseInt(awayPcts[2]?.replace('%', '') || '50'),
        homeMoneyPct: parseInt(homePcts[3]?.replace('%', '') || '50'),
        awayMoneyPct: parseInt(awayPcts[3]?.replace('%', '') || '50'),
        homeOdds: parseInt(homeOdds[1] || '-110'),
        awayOdds: parseInt(awayOdds[1] || '+100')
      },
      total: {
        overBetPct: parseInt(awayPcts[4]?.replace('%', '') || '50'),
        underBetPct: parseInt(homePcts[4]?.replace('%', '') || '50'),
        overMoneyPct: parseInt(awayPcts[5]?.replace('%', '') || '50'),
        underMoneyPct: parseInt(homePcts[5]?.replace('%', '') || '50'),
        line: parseFloat(homeOdds[2] || '0')
      },
      source: 'sportsbettingdime',
      fetchedAt: new Date().toISOString()
    }
    
    splits.push(split)
  }
  
  return splits
}

// =============================================================================
// FETCH BETTING SPLITS (SERVER-SIDE)
// =============================================================================

/**
 * Fetch betting splits from SportsBettingDime
 * Call this from API route or server component
 */
export async function fetchBettingSplits(sport: string): Promise<BettingSplit[]> {
  const sportSlug = sport.toLowerCase()
  const url = `https://www.sportsbettingdime.com/${sportSlug}/public-betting-trends/`
  
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml',
      },
      next: { revalidate: 300 } // Cache for 5 minutes
    })
    
    if (!response.ok) {
      console.error(`Failed to fetch ${sport} betting splits: ${response.status}`)
      return []
    }
    
    const html = await response.text()
    return parseSportsBettingDimeData(html, sport)
  } catch (error) {
    console.error(`Error fetching ${sport} betting splits:`, error)
    return []
  }
}

// =============================================================================
// REVERSE LINE MOVEMENT DETECTION
// =============================================================================

/**
 * Detect Reverse Line Movement (RLM)
 * When line moves OPPOSITE to where public money is going
 * This signals sharp/professional money on the other side
 */
export function detectReverseLineMovement(
  splits: BettingSplit[],
  oddsHistory: { gameId: string; openLine: number; currentLine: number; betType: string }[]
): ReverseLineMovement[] {
  const rlmAlerts: ReverseLineMovement[] = []
  
  for (const split of splits) {
    const history = oddsHistory.find(h => h.gameId === split.gameId)
    if (!history) continue
    
    // Check spread RLM
    const spreadPublicOnHome = split.spread.homeBetPct > 55
    const spreadPublicOnAway = split.spread.awayBetPct > 55
    const spreadLineMovedTowardHome = history.currentLine < history.openLine
    const spreadLineMovedTowardAway = history.currentLine > history.openLine
    
    // RLM: Public on home but line moved toward away (or vice versa)
    if (spreadPublicOnHome && spreadLineMovedTowardAway && Math.abs(history.currentLine - history.openLine) >= 0.5) {
      rlmAlerts.push({
        gameId: split.gameId,
        sport: split.sport,
        homeTeam: split.homeTeam,
        awayTeam: split.awayTeam,
        betType: 'spread',
        publicPct: split.spread.homeBetPct,
        publicSide: split.homeTeam,
        lineMovement: {
          open: history.openLine,
          current: history.currentLine,
          direction: 'against_public'
        },
        sharpConfidence: calculateSharpConfidence(split.spread.homeBetPct, split.spread.homeMoneyPct, history),
        detectedAt: new Date().toISOString()
      })
    }
    
    if (spreadPublicOnAway && spreadLineMovedTowardHome && Math.abs(history.currentLine - history.openLine) >= 0.5) {
      rlmAlerts.push({
        gameId: split.gameId,
        sport: split.sport,
        homeTeam: split.homeTeam,
        awayTeam: split.awayTeam,
        betType: 'spread',
        publicPct: split.spread.awayBetPct,
        publicSide: split.awayTeam,
        lineMovement: {
          open: history.openLine,
          current: history.currentLine,
          direction: 'against_public'
        },
        sharpConfidence: calculateSharpConfidence(split.spread.awayBetPct, split.spread.awayMoneyPct, history),
        detectedAt: new Date().toISOString()
      })
    }
  }
  
  return rlmAlerts.sort((a, b) => b.sharpConfidence - a.sharpConfidence)
}

/**
 * Calculate confidence that sharp money is on opposite side
 * Higher score = more likely sharps are fading the public
 */
function calculateSharpConfidence(
  betPct: number,
  moneyPct: number,
  history: { openLine: number; currentLine: number }
): number {
  let confidence = 0
  
  // Factor 1: Ticket/Money split (if high tickets but low money = square action)
  const ticketMoneyGap = betPct - moneyPct
  if (ticketMoneyGap > 20) confidence += 25 // Big ticket lead, small money = very square
  else if (ticketMoneyGap > 10) confidence += 15
  else if (ticketMoneyGap > 5) confidence += 10
  
  // Factor 2: Line movement magnitude
  const lineMove = Math.abs(history.currentLine - history.openLine)
  if (lineMove >= 1.5) confidence += 30 // Big move against public = strong sharp signal
  else if (lineMove >= 1) confidence += 20
  else if (lineMove >= 0.5) confidence += 10
  
  // Factor 3: Public betting percentage (more lopsided = more contrarian value)
  if (betPct >= 75) confidence += 25
  else if (betPct >= 65) confidence += 15
  else if (betPct >= 55) confidence += 5
  
  // Factor 4: Crossed key number (3, 7 in NFL)
  const crossedKeyNumber = 
    (history.openLine <= 3 && history.currentLine > 3) ||
    (history.openLine >= 3 && history.currentLine < 3) ||
    (history.openLine <= 7 && history.currentLine > 7) ||
    (history.openLine >= 7 && history.currentLine < 7)
  
  if (crossedKeyNumber) confidence += 15
  
  return Math.min(100, confidence)
}

// =============================================================================
// STORE SPLITS IN SUPABASE
// =============================================================================

export async function storeBettingSplits(splits: BettingSplit[]): Promise<void> {
  const supabase = createClient()
  
  for (const split of splits) {
    // First, find or create the game
    const { data: game } = await supabase
      .from('games')
      .select('id')
      .eq('external_id', split.gameId)
      .single()
    
    if (!game) continue
    
    // Store the betting split
    await supabase.from('betting_splits').upsert({
      game_id: game.id,
      spread_home_pct: split.spread.homeBetPct,
      spread_away_pct: split.spread.awayBetPct,
      moneyline_home_pct: split.moneyline.homeBetPct,
      moneyline_away_pct: split.moneyline.awayBetPct,
      total_over_pct: split.total.overBetPct,
      total_under_pct: split.total.underBetPct,
      money_pct_spread_home: split.spread.homeMoneyPct,
      money_pct_total_over: split.total.overMoneyPct,
      source: split.source,
      fetched_at: split.fetchedAt
    })
  }
}

// =============================================================================
// =============================================================================
// DEPRECATED: Mock data removed - use real betting splits from database/scrapers
// =============================================================================

export function getMockBettingSplits(_sport: string): BettingSplit[] {
  console.warn('[Betting Splits] getMockBettingSplits is deprecated - use real splits from database')
  // Return empty array - no fake betting splits, UI should show "no data available"
  return []
}

// =============================================================================
// EXPORT UTILITIES
// =============================================================================

export async function getBettingSplitsWithRLM(sport: string) {
  // Try to fetch real splits first, fallback to database
  let splits: BettingSplit[] = []
  
  try {
    // First try to get from database (populated by cron jobs)
    const supabase = createClient()
    const { data: dbSplits } = await supabase
      .from('betting_splits')
      .select('*')
      .eq('sport', sport.toUpperCase())
      .order('created_at', { ascending: false })
      .limit(20)
    
    if (dbSplits && dbSplits.length > 0) {
      splits = dbSplits.map((s: Record<string, unknown>) => ({
        gameId: s.game_id as string,
        sport: s.sport as BettingSplit['sport'],
        homeTeam: s.home_team as string,
        awayTeam: s.away_team as string,
        gameTime: s.game_time as string,
        spread: (s.spread_data as BettingSplit['spread']) || { homeBetPct: 50, awayBetPct: 50, homeMoneyPct: 50, awayMoneyPct: 50, line: 0 },
        moneyline: (s.moneyline_data as BettingSplit['moneyline']) || { homeBetPct: 50, awayBetPct: 50, homeMoneyPct: 50, awayMoneyPct: 50, homeOdds: 0, awayOdds: 0 },
        total: (s.total_data as BettingSplit['total']) || { overBetPct: 50, underBetPct: 50, overMoneyPct: 50, underMoneyPct: 50, line: 0 },
        source: (s.source as string) || 'database',
        fetchedAt: s.created_at as string
      }))
    } else {
      // Fallback to live scraping if database empty
      splits = await fetchBettingSplits(sport)
    }
  } catch (error) {
    console.error('Error fetching betting splits:', error)
    // Return empty array - no mock data fallback
    splits = []
  }
  
  // Get odds history from database for RLM detection
  let oddsHistory: { gameId: string; openLine: number; currentLine: number; betType: string }[] = []
  
  try {
    const supabase = createClient()
    const { data: history } = await supabase
      .from('odds_history')
      .select('*')
      .eq('sport', sport.toUpperCase())
      .order('timestamp', { ascending: true })
      .limit(100)
    
    if (history && history.length > 0) {
      // Group by game and calculate open vs current
      type HistoryItem = { game_id: string; spread?: number; [key: string]: unknown }
      const gameHistory = new Map<string, HistoryItem[]>()
      history.forEach((h: HistoryItem) => {
        const existing = gameHistory.get(h.game_id) || []
        existing.push(h)
        gameHistory.set(h.game_id, existing)
      })
      
      gameHistory.forEach((h, gameId) => {
        if (h.length >= 2) {
          const open = h[0]
          const current = h[h.length - 1]
          oddsHistory.push({
            gameId,
            openLine: open.spread || 0,
            currentLine: current.spread || 0,
            betType: 'spread'
          })
        }
      })
    }
  } catch (error) {
    console.error('Error fetching odds history:', error)
  }
  
  const rlmAlerts = detectReverseLineMovement(splits, oddsHistory)
  
  return { splits, rlmAlerts }
}
