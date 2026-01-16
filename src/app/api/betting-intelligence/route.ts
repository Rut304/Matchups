/**
 * Betting Intelligence API
 * Fetches and calculates:
 * - Public betting % (from free sources)
 * - Sharp money % (estimated from line movement)
 * - Reverse Line Movement (RLM) detection
 * - Steam moves (rapid line changes across books)
 * 
 * Data Sources:
 * - SportsBettingDime (public %)
 * - The Odds API (multi-book odds for line movement)
 * - Calculated: RLM, Steam, Sharp estimates
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { ODDS_API_SPORTS, type OddsSportKey } from '@/lib/api/the-odds-api'

// =============================================================================
// TYPES
// =============================================================================

interface BettingSplitData {
  gameId: string
  sport: string
  homeTeam: string
  awayTeam: string
  gameTime: string
  spread: {
    line: number
    homePublicPct: number
    awayPublicPct: number
    homeMoneyPct: number // Estimated sharp
    awayMoneyPct: number
  }
  total: {
    line: number
    overPublicPct: number
    underPublicPct: number
    overMoneyPct: number
    underMoneyPct: number
  }
  moneyline: {
    homeOdds: number
    awayOdds: number
    homePublicPct: number
    awayPublicPct: number
  }
  indicators: {
    rlm: boolean
    rlmSide: 'home' | 'away' | 'over' | 'under' | null
    rlmConfidence: number
    steamMove: boolean
    steamDirection: 'home' | 'away' | 'over' | 'under' | null
    sharpSide: 'home' | 'away' | 'over' | 'under' | null
    sharpConfidence: number
  }
  lineHistory: LineSnapshot[]
  source: string
  fetchedAt: string
}

interface LineSnapshot {
  timestamp: string
  book: string
  spread: number
  total: number
  homeML: number
  awayML: number
}

interface OpeningLine {
  spread: number
  total: number
  homeML: number
  awayML: number
  timestamp: string
}

// =============================================================================
// CONFIGURATION
// =============================================================================

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
const ODDS_API_KEY = process.env.ODDS_API_KEY

// Thresholds for detection
const THRESHOLDS = {
  // RLM: Line moves opposite direction of public betting
  RLM_MIN_PUBLIC_PCT: 60, // Public must be at least 60% on one side
  RLM_MIN_LINE_MOVE: 0.5, // Line must move at least 0.5 points against public
  
  // Steam: Rapid line movement across multiple books
  STEAM_MIN_BOOKS: 3, // At least 3 books must move
  STEAM_TIME_WINDOW: 15 * 60 * 1000, // Within 15 minutes
  STEAM_MIN_MOVE: 0.5, // Each book moves at least 0.5 points
  
  // Sharp money estimation
  SHARP_LINE_WEIGHT: 0.7, // Line movement is 70% of sharp estimate
  SHARP_PUBLIC_WEIGHT: 0.3, // Inverse of public is 30%
}

// =============================================================================
// SPORTSBETTINGDIME SCRAPER
// =============================================================================

async function fetchPublicBettingData(sport: string): Promise<Map<string, {
  homeTeam: string
  awayTeam: string
  spread: { homePct: number; awayPct: number }
  total: { overPct: number; underPct: number }
  moneyline: { homePct: number; awayPct: number }
}>> {
  const results = new Map()
  
  try {
    // SportsBettingDime URLs by sport
    const sportUrls: Record<string, string> = {
      NFL: 'https://www.sportsbettingdime.com/nfl/public-betting-trends/',
      NBA: 'https://www.sportsbettingdime.com/nba/public-betting-trends/',
      NHL: 'https://www.sportsbettingdime.com/nhl/public-betting-trends/',
      MLB: 'https://www.sportsbettingdime.com/mlb/public-betting-trends/',
      NCAAF: 'https://www.sportsbettingdime.com/college-football/public-betting-trends/',
      NCAAB: 'https://www.sportsbettingdime.com/college-basketball/public-betting-trends/',
    }
    
    const url = sportUrls[sport.toUpperCase()]
    if (!url) return results
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Cache-Control': 'no-cache',
      },
      next: { revalidate: 300 }, // Cache 5 min
    })
    
    if (!response.ok) {
      console.error(`[Betting Intel] Failed to fetch public data: ${response.status}`)
      return results
    }
    
    const html = await response.text()
    
    // Parse the betting percentages from HTML
    // SBD format: Each game has rows with team name, spread%, ML%, O/U%
    const gameMatches = html.matchAll(
      /data-away-team="([^"]+)"[^>]*data-home-team="([^"]+)"[^>]*data-spread-away="(\d+)"[^>]*data-spread-home="(\d+)"[^>]*data-ml-away="(\d+)"[^>]*data-ml-home="(\d+)"[^>]*data-total-over="(\d+)"[^>]*data-total-under="(\d+)"/gi
    )
    
    for (const match of gameMatches) {
      const [, awayTeam, homeTeam, spreadAway, spreadHome, mlAway, mlHome, totalOver, totalUnder] = match
      const key = `${awayTeam}@${homeTeam}`.toLowerCase()
      
      results.set(key, {
        homeTeam,
        awayTeam,
        spread: {
          homePct: parseInt(spreadHome) || 50,
          awayPct: parseInt(spreadAway) || 50,
        },
        total: {
          overPct: parseInt(totalOver) || 50,
          underPct: parseInt(totalUnder) || 50,
        },
        moneyline: {
          homePct: parseInt(mlHome) || 50,
          awayPct: parseInt(mlAway) || 50,
        },
      })
    }
    
    // Fallback: Try parsing table structure if data attributes not found
    if (results.size === 0) {
      // Parse traditional table format
      const tableRows = html.match(/<tr[^>]*class="[^"]*game-row[^"]*"[^>]*>[\s\S]*?<\/tr>/gi) || []
      
      for (const row of tableRows) {
        // Extract team names and percentages
        const teamMatch = row.match(/data-team="([^"]+)"/gi)
        const pctMatches = row.match(/(\d{1,3})%/g)
        
        if (teamMatch && pctMatches && pctMatches.length >= 2) {
          // Process and add to results
        }
      }
    }
    
    console.log(`[Betting Intel] Parsed ${results.size} games from public betting data`)
    return results
    
  } catch (error) {
    console.error('[Betting Intel] Error fetching public betting:', error)
    return results
  }
}

// =============================================================================
// THE ODDS API - LINE MOVEMENT
// =============================================================================

async function fetchOddsData(sport: string): Promise<{
  games: Map<string, {
    id: string
    homeTeam: string
    awayTeam: string
    commenceTime: string
    books: Array<{
      name: string
      spread: number
      total: number
      homeML: number
      awayML: number
      lastUpdate: string
    }>
  }>
  openingLines: Map<string, OpeningLine>
}> {
  const games = new Map()
  const openingLines = new Map()
  
  if (!ODDS_API_KEY) {
    console.warn('[Betting Intel] No ODDS_API_KEY - skipping odds fetch')
    return { games, openingLines }
  }
  
  try {
    const sportKey = ODDS_API_SPORTS[sport.toUpperCase() as OddsSportKey]
    if (!sportKey) return { games, openingLines }
    
    // Fetch current odds
    const url = `https://api.the-odds-api.com/v4/sports/${sportKey}/odds?` + new URLSearchParams({
      apiKey: ODDS_API_KEY,
      regions: 'us',
      markets: 'h2h,spreads,totals',
      oddsFormat: 'american',
    })
    
    const response = await fetch(url, { next: { revalidate: 300 } })
    
    if (!response.ok) {
      console.error(`[Betting Intel] Odds API error: ${response.status}`)
      return { games, openingLines }
    }
    
    const data = await response.json()
    
    // Process each game
    for (const game of data) {
      const gameKey = `${game.away_team}@${game.home_team}`.toLowerCase()
      const books: Array<{
        name: string
        spread: number
        total: number
        homeML: number
        awayML: number
        lastUpdate: string
      }> = []
      
      for (const bookmaker of game.bookmakers || []) {
        let spread = 0
        let total = 0
        let homeML = 0
        let awayML = 0
        
        for (const market of bookmaker.markets || []) {
          if (market.key === 'spreads') {
            const homeOutcome = market.outcomes.find((o: { name: string }) => o.name === game.home_team)
            spread = homeOutcome?.point || 0
          } else if (market.key === 'totals') {
            const overOutcome = market.outcomes.find((o: { name: string }) => o.name === 'Over')
            total = overOutcome?.point || 0
          } else if (market.key === 'h2h') {
            const homeOutcome = market.outcomes.find((o: { name: string }) => o.name === game.home_team)
            const awayOutcome = market.outcomes.find((o: { name: string }) => o.name === game.away_team)
            homeML = homeOutcome?.price || 0
            awayML = awayOutcome?.price || 0
          }
        }
        
        books.push({
          name: bookmaker.title,
          spread,
          total,
          homeML,
          awayML,
          lastUpdate: bookmaker.last_update,
        })
      }
      
      games.set(gameKey, {
        id: game.id,
        homeTeam: game.home_team,
        awayTeam: game.away_team,
        commenceTime: game.commence_time,
        books,
      })
      
      // Use consensus as "opening" (could be enhanced with historical API)
      if (books.length > 0) {
        const avgSpread = books.reduce((sum, b) => sum + b.spread, 0) / books.length
        const avgTotal = books.reduce((sum, b) => sum + b.total, 0) / books.length
        const avgHomeML = books.reduce((sum, b) => sum + b.homeML, 0) / books.length
        const avgAwayML = books.reduce((sum, b) => sum + b.awayML, 0) / books.length
        
        openingLines.set(gameKey, {
          spread: Math.round(avgSpread * 2) / 2,
          total: Math.round(avgTotal * 2) / 2,
          homeML: Math.round(avgHomeML),
          awayML: Math.round(avgAwayML),
          timestamp: new Date().toISOString(),
        })
      }
    }
    
    console.log(`[Betting Intel] Fetched odds for ${games.size} games from ${data[0]?.bookmakers?.length || 0} books`)
    return { games, openingLines }
    
  } catch (error) {
    console.error('[Betting Intel] Error fetching odds:', error)
    return { games, openingLines }
  }
}

// =============================================================================
// RLM & STEAM DETECTION
// =============================================================================

function detectReverseLineMovement(
  publicPct: number,
  publicSide: 'home' | 'away' | 'over' | 'under',
  openingLine: number,
  currentLine: number
): { detected: boolean; confidence: number } {
  // Public must be heavily on one side
  if (publicPct < THRESHOLDS.RLM_MIN_PUBLIC_PCT) {
    return { detected: false, confidence: 0 }
  }
  
  const lineMove = currentLine - openingLine
  const moveAgainstPublic = 
    (publicSide === 'home' && lineMove > 0) || // Public on home, line moves toward away
    (publicSide === 'away' && lineMove < 0) || // Public on away, line moves toward home
    (publicSide === 'over' && lineMove > 0) ||  // Public on over, total goes up (harder to hit)
    (publicSide === 'under' && lineMove < 0)    // Public on under, total goes down (harder to hit)
  
  if (!moveAgainstPublic || Math.abs(lineMove) < THRESHOLDS.RLM_MIN_LINE_MOVE) {
    return { detected: false, confidence: 0 }
  }
  
  // Calculate confidence based on public % and line movement magnitude
  const publicFactor = (publicPct - 50) / 50 // 0-1 scale
  const moveFactor = Math.min(Math.abs(lineMove) / 3, 1) // 3+ points = max confidence
  const confidence = Math.round((publicFactor * 0.6 + moveFactor * 0.4) * 100)
  
  return { detected: true, confidence }
}

function detectSteamMove(
  books: Array<{ name: string; spread: number; total: number; lastUpdate: string }>,
  previousSnapshot?: LineSnapshot[]
): { detected: boolean; direction: 'home' | 'away' | 'over' | 'under' | null } {
  if (books.length < THRESHOLDS.STEAM_MIN_BOOKS || !previousSnapshot) {
    return { detected: false, direction: null }
  }
  
  // Check if multiple books moved in same direction within time window
  const now = Date.now()
  const recentMoves = books.filter(book => {
    const updateTime = new Date(book.lastUpdate).getTime()
    return now - updateTime < THRESHOLDS.STEAM_TIME_WINDOW
  })
  
  if (recentMoves.length < THRESHOLDS.STEAM_MIN_BOOKS) {
    return { detected: false, direction: null }
  }
  
  // Check spread movement direction
  let homewardMoves = 0
  let awaywardMoves = 0
  
  for (const book of recentMoves) {
    const prev = previousSnapshot.find(s => s.book === book.name)
    if (!prev) continue
    
    const spreadChange = book.spread - prev.spread
    if (spreadChange <= -THRESHOLDS.STEAM_MIN_MOVE) homewardMoves++
    if (spreadChange >= THRESHOLDS.STEAM_MIN_MOVE) awaywardMoves++
  }
  
  if (homewardMoves >= THRESHOLDS.STEAM_MIN_BOOKS) {
    return { detected: true, direction: 'home' }
  }
  if (awaywardMoves >= THRESHOLDS.STEAM_MIN_BOOKS) {
    return { detected: true, direction: 'away' }
  }
  
  return { detected: false, direction: null }
}

function estimateSharpMoney(
  publicHomePct: number,
  openingSpread: number,
  currentSpread: number
): { side: 'home' | 'away' | null; confidence: number; moneyPct: number } {
  const publicAwayPct = 100 - publicHomePct
  const lineMove = currentSpread - openingSpread
  
  // Sharp money estimated by combining:
  // 1. Inverse of public (if public heavy on home, sharp likely on away)
  // 2. Line movement direction (money moves lines)
  
  // Line movement indicates sharp side
  const lineSide = lineMove < -0.5 ? 'home' : lineMove > 0.5 ? 'away' : null
  
  // Heavy public side (fade candidates)
  const publicSide = publicHomePct >= 65 ? 'home' : publicAwayPct >= 65 ? 'away' : null
  const sharpFromPublic = publicSide === 'home' ? 'away' : publicSide === 'away' ? 'home' : null
  
  // If line and public inverse agree, high confidence
  if (lineSide && lineSide === sharpFromPublic) {
    const sharpPct = Math.round(
      (100 - Math.max(publicHomePct, publicAwayPct)) * THRESHOLDS.SHARP_PUBLIC_WEIGHT +
      Math.min(Math.abs(lineMove) * 20, 50) * THRESHOLDS.SHARP_LINE_WEIGHT
    )
    return { 
      side: lineSide, 
      confidence: Math.min(90, sharpPct + 30),
      moneyPct: lineSide === 'home' ? Math.min(70, 50 + Math.abs(lineMove) * 10) : Math.min(70, 50 + Math.abs(lineMove) * 10)
    }
  }
  
  // Only line movement
  if (lineSide) {
    return {
      side: lineSide,
      confidence: Math.min(60, 40 + Math.abs(lineMove) * 10),
      moneyPct: lineSide === 'home' ? 55 : 55
    }
  }
  
  return { side: null, confidence: 0, moneyPct: 50 }
}

// =============================================================================
// MAIN API HANDLER
// =============================================================================

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const sport = searchParams.get('sport')?.toUpperCase() || 'NFL'
  const gameId = searchParams.get('gameId')
  
  try {
    // Fetch data from all sources in parallel
    const [publicData, { games: oddsData, openingLines }] = await Promise.all([
      fetchPublicBettingData(sport),
      fetchOddsData(sport),
    ])
    
    const results: BettingSplitData[] = []
    
    // Process each game from odds data
    for (const [gameKey, game] of oddsData) {
      // Get public betting data for this game
      const publicBetting = publicData.get(gameKey) || {
        spread: { homePct: 50, awayPct: 50 },
        total: { overPct: 50, underPct: 50 },
        moneyline: { homePct: 50, awayPct: 50 },
      }
      
      // Get opening line
      const opening = openingLines.get(gameKey) || {
        spread: 0,
        total: 0,
        homeML: -110,
        awayML: -110,
      }
      
      // Calculate consensus current lines
      const avgSpread = game.books.length > 0
        ? game.books.reduce((sum, b) => sum + b.spread, 0) / game.books.length
        : 0
      const avgTotal = game.books.length > 0
        ? game.books.reduce((sum, b) => sum + b.total, 0) / game.books.length
        : 0
      
      // Detect RLM
      const spreadRLM = detectReverseLineMovement(
        publicBetting.spread.homePct,
        publicBetting.spread.homePct > 50 ? 'home' : 'away',
        opening.spread,
        avgSpread
      )
      
      const totalRLM = detectReverseLineMovement(
        publicBetting.total.overPct,
        publicBetting.total.overPct > 50 ? 'over' : 'under',
        opening.total,
        avgTotal
      )
      
      // Estimate sharp money
      const sharpEstimate = estimateSharpMoney(
        publicBetting.spread.homePct,
        opening.spread,
        avgSpread
      )
      
      // Detect steam moves (would need historical snapshots for real detection)
      const steamDetection = detectSteamMove(game.books, [])
      
      const splitData: BettingSplitData = {
        gameId: game.id,
        sport,
        homeTeam: game.homeTeam,
        awayTeam: game.awayTeam,
        gameTime: game.commenceTime,
        spread: {
          line: Math.round(avgSpread * 2) / 2,
          homePublicPct: publicBetting.spread.homePct,
          awayPublicPct: publicBetting.spread.awayPct,
          homeMoneyPct: sharpEstimate.side === 'home' ? sharpEstimate.moneyPct : 100 - sharpEstimate.moneyPct,
          awayMoneyPct: sharpEstimate.side === 'away' ? sharpEstimate.moneyPct : 100 - sharpEstimate.moneyPct,
        },
        total: {
          line: Math.round(avgTotal * 2) / 2,
          overPublicPct: publicBetting.total.overPct,
          underPublicPct: publicBetting.total.underPct,
          overMoneyPct: 50, // Would need total-specific sharp detection
          underMoneyPct: 50,
        },
        moneyline: {
          homeOdds: Math.round(game.books.reduce((sum, b) => sum + b.homeML, 0) / game.books.length),
          awayOdds: Math.round(game.books.reduce((sum, b) => sum + b.awayML, 0) / game.books.length),
          homePublicPct: publicBetting.moneyline.homePct,
          awayPublicPct: publicBetting.moneyline.awayPct,
        },
        indicators: {
          rlm: spreadRLM.detected || totalRLM.detected,
          rlmSide: spreadRLM.detected 
            ? (publicBetting.spread.homePct > 50 ? 'away' : 'home')
            : totalRLM.detected 
              ? (publicBetting.total.overPct > 50 ? 'under' : 'over')
              : null,
          rlmConfidence: Math.max(spreadRLM.confidence, totalRLM.confidence),
          steamMove: steamDetection.detected,
          steamDirection: steamDetection.direction,
          sharpSide: sharpEstimate.side,
          sharpConfidence: sharpEstimate.confidence,
        },
        lineHistory: game.books.map(b => ({
          timestamp: b.lastUpdate,
          book: b.name,
          spread: b.spread,
          total: b.total,
          homeML: b.homeML,
          awayML: b.awayML,
        })),
        source: 'sportsbettingdime,the-odds-api',
        fetchedAt: new Date().toISOString(),
      }
      
      results.push(splitData)
    }
    
    // Filter by gameId if provided
    const filteredResults = gameId 
      ? results.filter(r => r.gameId === gameId)
      : results
    
    // Save to database
    if (filteredResults.length > 0) {
      await saveSplitsToDatabase(filteredResults)
    }
    
    return NextResponse.json({
      success: true,
      sport,
      count: filteredResults.length,
      data: filteredResults,
      sources: {
        publicBetting: 'sportsbettingdime.com',
        odds: 'the-odds-api.com',
        rlm: 'calculated',
        sharpEstimate: 'calculated (line movement + inverse public)',
      },
      note: 'Sharp money % is estimated. True sharp tracking requires premium services like DonBest or SportsInsights.',
    })
    
  } catch (error) {
    console.error('[Betting Intelligence API] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch betting intelligence', details: String(error) },
      { status: 500 }
    )
  }
}

// =============================================================================
// DATABASE STORAGE
// =============================================================================

async function saveSplitsToDatabase(splits: BettingSplitData[]) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.warn('[Betting Intel] No Supabase credentials - skipping save')
    return
  }
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  
  for (const split of splits) {
    try {
      await supabase.from('betting_splits_enhanced').upsert({
        game_id: split.gameId,
        sport: split.sport,
        home_team: split.homeTeam,
        away_team: split.awayTeam,
        spread: split.spread.line,
        total: split.total.line,
        home_ml: split.moneyline.homeOdds,
        away_ml: split.moneyline.awayOdds,
        spread_public_home_pct: split.spread.homePublicPct,
        spread_public_away_pct: split.spread.awayPublicPct,
        spread_money_home_pct: split.spread.homeMoneyPct,
        spread_money_away_pct: split.spread.awayMoneyPct,
        total_public_over_pct: split.total.overPublicPct,
        total_public_under_pct: split.total.underPublicPct,
        total_money_over_pct: split.total.overMoneyPct,
        total_money_under_pct: split.total.underMoneyPct,
        ml_public_home_pct: split.moneyline.homePublicPct,
        ml_public_away_pct: split.moneyline.awayPublicPct,
        is_reverse_line_movement: split.indicators.rlm,
        sharp_side: split.indicators.sharpSide,
        steam_move_detected: split.indicators.steamMove,
        source: split.source,
        recorded_at: split.fetchedAt,
      }, {
        onConflict: 'game_id',
        ignoreDuplicates: false,
      })
    } catch (err) {
      console.error(`[Betting Intel] Failed to save split for ${split.gameId}:`, err)
    }
  }
}
