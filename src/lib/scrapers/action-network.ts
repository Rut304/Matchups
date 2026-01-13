/**
 * Action Network Betting Splits API
 * 
 * Fetches real betting percentages (tickets % and money %) from Action Network's public API.
 * This is the REAL data that powers their subscription service - NOT contest picks.
 * 
 * Data includes:
 * - Ticket % (public bet count)
 * - Money % (dollar handle - what sharps watch)
 * - Full odds from multiple books
 * - Historical data back to 2017
 * 
 * API discovered via: https://github.com/john-b-edwards/anscrapR
 */

import type { BettingSplit } from './betting-splits'

// =============================================================================
// TYPES
// =============================================================================

interface ActionNetworkTeam {
  id: number
  full_name: string
  display_name: string
  abbr: string
}

interface BetInfo {
  money: { value: number; percent: number }
  tickets: { value: number; percent: number }
}

interface MarketOutcome {
  type: 'spread' | 'total' | 'moneyline'
  side: 'home' | 'away' | 'over' | 'under'
  odds: number
  value: number
  team_id?: number
  bet_info?: BetInfo
}

interface ActionNetworkMarket {
  event?: {
    spread?: MarketOutcome[]
    total?: MarketOutcome[]
    moneyline?: MarketOutcome[]
  }
}

interface ActionNetworkGame {
  id: number
  status: string
  start_time: string
  away_team_id: number
  home_team_id: number
  num_bets: number
  teams: ActionNetworkTeam[]
  markets?: Record<string, ActionNetworkMarket>
  boxscore?: {
    total_away_points: number
    total_home_points: number
  }
}

interface ActionNetworkResponse {
  games: ActionNetworkGame[]
  league: {
    name: string
  }
}

// Sport to API slug mapping
const SPORT_SLUGS: Record<string, string> = {
  'NFL': 'nfl',
  'NBA': 'nba',
  'NHL': 'nhl',
  'MLB': 'mlb',
  'NCAAF': 'ncaaf',
  'NCAAB': 'ncaab',
  'WNBA': 'wnba',
  'WNCAAB': 'ncaaw',
}

// =============================================================================
// CORE API FUNCTIONS
// =============================================================================

/**
 * Fetch games with betting data from Action Network
 */
export async function fetchActionNetworkGames(
  sport: string,
  date?: Date
): Promise<ActionNetworkGame[]> {
  const slug = SPORT_SLUGS[sport.toUpperCase()]
  if (!slug) {
    console.error(`Unknown sport: ${sport}`)
    return []
  }

  const dateStr = date
    ? date.toISOString().slice(0, 10).replace(/-/g, '')
    : new Date().toISOString().slice(0, 10).replace(/-/g, '')

  const url = `https://api.actionnetwork.com/web/v2/scoreboard/${slug}?date=${dateStr}&periods=event`

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'application/json',
      },
      next: { revalidate: 120 }, // Cache for 2 minutes
    })

    if (!response.ok) {
      console.error(`Action Network API error: ${response.status}`)
      return []
    }

    const data: ActionNetworkResponse = await response.json()
    return data.games || []
  } catch (error) {
    console.error(`Error fetching Action Network data:`, error)
    return []
  }
}

/**
 * Fetch NFL games by week (needed for NFL's different API structure)
 */
export async function fetchNFLGamesByWeek(
  week: number,
  seasonType: 'pre' | 'reg' | 'post' = 'reg',
  season?: number
): Promise<ActionNetworkGame[]> {
  const currentSeason = season || new Date().getFullYear()
  const url = `https://api.actionnetwork.com/web/v2/scoreboard/nfl?season=${currentSeason}&week=${week}&seasonType=${seasonType}&periods=event`

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'application/json',
      },
      next: { revalidate: 120 },
    })

    if (!response.ok) {
      console.error(`Action Network NFL API error: ${response.status}`)
      return []
    }

    const data: ActionNetworkResponse = await response.json()
    return data.games || []
  } catch (error) {
    console.error(`Error fetching Action Network NFL data:`, error)
    return []
  }
}

/**
 * Fetch CFB games by week
 */
export async function fetchCFBGamesByWeek(
  week: number,
  seasonType: 'reg' | 'post' = 'reg',
  season?: number,
  division: 'FBS' | 'FCS' | 'D2' = 'FBS'
): Promise<ActionNetworkGame[]> {
  const currentSeason = season || new Date().getFullYear()
  const url = `https://api.actionnetwork.com/web/v2/scoreboard/ncaaf?season=${currentSeason}&division=${division}&week=${week}&seasonType=${seasonType}&periods=event`

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'application/json',
      },
      next: { revalidate: 120 },
    })

    if (!response.ok) {
      console.error(`Action Network CFB API error: ${response.status}`)
      return []
    }

    const data: ActionNetworkResponse = await response.json()
    return data.games || []
  } catch (error) {
    console.error(`Error fetching Action Network CFB data:`, error)
    return []
  }
}

// =============================================================================
// DATA TRANSFORMATION
// =============================================================================

/**
 * Transform Action Network game to BettingSplit format
 */
export function transformToBettingSplit(
  game: ActionNetworkGame,
  sport: string
): BettingSplit | null {
  const homeTeam = game.teams?.find(t => t.id === game.home_team_id)
  const awayTeam = game.teams?.find(t => t.id === game.away_team_id)

  if (!homeTeam || !awayTeam) return null

  // Get the first available book's market data (book_id 15 is typically consensus)
  const markets = game.markets
  const marketData = markets ? Object.values(markets)[0]?.event : null

  // Default values if no bet info available
  const defaultBetInfo: BetInfo = {
    money: { value: 0, percent: 50 },
    tickets: { value: 0, percent: 50 },
  }

  // Extract spread data
  const spreadHome = marketData?.spread?.find(s => s.side === 'home')
  const spreadAway = marketData?.spread?.find(s => s.side === 'away')

  // Extract moneyline data
  const mlHome = marketData?.moneyline?.find(m => m.side === 'home')
  const mlAway = marketData?.moneyline?.find(m => m.side === 'away')

  // Extract total data
  const totalOver = marketData?.total?.find(t => t.side === 'over')
  const totalUnder = marketData?.total?.find(t => t.side === 'under')

  const split: BettingSplit = {
    gameId: `an-${game.id}`,
    sport: sport.toUpperCase() as BettingSplit['sport'],
    homeTeam: homeTeam.full_name,
    awayTeam: awayTeam.full_name,
    gameTime: game.start_time,
    spread: {
      homeBetPct: spreadHome?.bet_info?.tickets?.percent ?? 50,
      awayBetPct: spreadAway?.bet_info?.tickets?.percent ?? 50,
      homeMoneyPct: spreadHome?.bet_info?.money?.percent ?? 50,
      awayMoneyPct: spreadAway?.bet_info?.money?.percent ?? 50,
      line: spreadHome?.value ?? 0,
    },
    moneyline: {
      homeBetPct: mlHome?.bet_info?.tickets?.percent ?? 50,
      awayBetPct: mlAway?.bet_info?.tickets?.percent ?? 50,
      homeMoneyPct: mlHome?.bet_info?.money?.percent ?? 50,
      awayMoneyPct: mlAway?.bet_info?.money?.percent ?? 50,
      homeOdds: mlHome?.odds ?? -110,
      awayOdds: mlAway?.odds ?? 100,
    },
    total: {
      overBetPct: totalOver?.bet_info?.tickets?.percent ?? 50,
      underBetPct: totalUnder?.bet_info?.tickets?.percent ?? 50,
      overMoneyPct: totalOver?.bet_info?.money?.percent ?? 50,
      underMoneyPct: totalUnder?.bet_info?.money?.percent ?? 50,
      line: totalOver?.value ?? 0,
    },
    source: 'actionnetwork',
    fetchedAt: new Date().toISOString(),
  }

  return split
}

// =============================================================================
// HIGH-LEVEL FETCH FUNCTIONS
// =============================================================================

/**
 * Fetch all betting splits for a sport on a given date
 */
export async function fetchBettingSplitsFromActionNetwork(
  sport: string,
  date?: Date
): Promise<BettingSplit[]> {
  const games = await fetchActionNetworkGames(sport, date)

  const splits: BettingSplit[] = []
  for (const game of games) {
    const split = transformToBettingSplit(game, sport)
    if (split) {
      splits.push(split)
    }
  }

  return splits
}

/**
 * Fetch all games across multiple sports for today
 */
export async function fetchAllBettingSplitsToday(): Promise<BettingSplit[]> {
  const sports = ['NBA', 'NHL', 'MLB', 'NCAAB']
  const allSplits: BettingSplit[] = []

  // Fetch in parallel
  const results = await Promise.all(
    sports.map(sport => fetchBettingSplitsFromActionNetwork(sport))
  )

  for (const splits of results) {
    allSplits.push(...splits)
  }

  return allSplits
}

// =============================================================================
// SHARP MONEY DETECTION
// =============================================================================

interface SharpMoneySignal {
  gameId: string
  sport: string
  homeTeam: string
  awayTeam: string
  betType: 'spread' | 'moneyline' | 'total'
  publicSide: string
  publicPct: number
  moneyPct: number
  sharpSide: string
  confidence: 'low' | 'medium' | 'high'
  signal: string
}

/**
 * Detect sharp money signals from betting splits
 * Sharp money is indicated when:
 * - Money % and Ticket % diverge significantly
 * - More money on one side despite fewer tickets
 */
export function detectSharpMoney(splits: BettingSplit[]): SharpMoneySignal[] {
  const signals: SharpMoneySignal[] = []

  for (const split of splits) {
    // Check spread
    const spreadTicketPctDiff = Math.abs(split.spread.homeBetPct - split.spread.awayBetPct)
    const spreadMoneyPctDiff = Math.abs(split.spread.homeMoneyPct - split.spread.awayMoneyPct)

    // Sharp signal: Public betting one way, but money going the other
    if (split.spread.homeBetPct > 55 && split.spread.awayMoneyPct > 55) {
      signals.push({
        gameId: split.gameId,
        sport: split.sport,
        homeTeam: split.homeTeam,
        awayTeam: split.awayTeam,
        betType: 'spread',
        publicSide: split.homeTeam,
        publicPct: split.spread.homeBetPct,
        moneyPct: split.spread.awayMoneyPct,
        sharpSide: split.awayTeam,
        confidence: split.spread.awayMoneyPct > 60 ? 'high' : 'medium',
        signal: `${split.spread.homeBetPct}% public on ${split.homeTeam}, but ${split.spread.awayMoneyPct}% of money on ${split.awayTeam}`,
      })
    } else if (split.spread.awayBetPct > 55 && split.spread.homeMoneyPct > 55) {
      signals.push({
        gameId: split.gameId,
        sport: split.sport,
        homeTeam: split.homeTeam,
        awayTeam: split.awayTeam,
        betType: 'spread',
        publicSide: split.awayTeam,
        publicPct: split.spread.awayBetPct,
        moneyPct: split.spread.homeMoneyPct,
        sharpSide: split.homeTeam,
        confidence: split.spread.homeMoneyPct > 60 ? 'high' : 'medium',
        signal: `${split.spread.awayBetPct}% public on ${split.awayTeam}, but ${split.spread.homeMoneyPct}% of money on ${split.homeTeam}`,
      })
    }

    // Check moneyline
    if (split.moneyline.homeBetPct > 55 && split.moneyline.awayMoneyPct > 55) {
      signals.push({
        gameId: split.gameId,
        sport: split.sport,
        homeTeam: split.homeTeam,
        awayTeam: split.awayTeam,
        betType: 'moneyline',
        publicSide: split.homeTeam,
        publicPct: split.moneyline.homeBetPct,
        moneyPct: split.moneyline.awayMoneyPct,
        sharpSide: split.awayTeam,
        confidence: split.moneyline.awayMoneyPct > 60 ? 'high' : 'medium',
        signal: `${split.moneyline.homeBetPct}% public tickets on ${split.homeTeam} ML, but ${split.moneyline.awayMoneyPct}% of money on ${split.awayTeam}`,
      })
    } else if (split.moneyline.awayBetPct > 55 && split.moneyline.homeMoneyPct > 55) {
      signals.push({
        gameId: split.gameId,
        sport: split.sport,
        homeTeam: split.homeTeam,
        awayTeam: split.awayTeam,
        betType: 'moneyline',
        publicSide: split.awayTeam,
        publicPct: split.moneyline.awayBetPct,
        moneyPct: split.moneyline.homeMoneyPct,
        sharpSide: split.homeTeam,
        confidence: split.moneyline.homeMoneyPct > 60 ? 'high' : 'medium',
        signal: `${split.moneyline.awayBetPct}% public tickets on ${split.awayTeam} ML, but ${split.moneyline.homeMoneyPct}% of money on ${split.homeTeam}`,
      })
    }

    // Check totals
    if (split.total.overBetPct > 55 && split.total.underMoneyPct > 55) {
      signals.push({
        gameId: split.gameId,
        sport: split.sport,
        homeTeam: split.homeTeam,
        awayTeam: split.awayTeam,
        betType: 'total',
        publicSide: 'Over',
        publicPct: split.total.overBetPct,
        moneyPct: split.total.underMoneyPct,
        sharpSide: 'Under',
        confidence: split.total.underMoneyPct > 60 ? 'high' : 'medium',
        signal: `${split.total.overBetPct}% public on Over ${split.total.line}, but ${split.total.underMoneyPct}% of money on Under`,
      })
    } else if (split.total.underBetPct > 55 && split.total.overMoneyPct > 55) {
      signals.push({
        gameId: split.gameId,
        sport: split.sport,
        homeTeam: split.homeTeam,
        awayTeam: split.awayTeam,
        betType: 'total',
        publicSide: 'Under',
        publicPct: split.total.underBetPct,
        moneyPct: split.total.overMoneyPct,
        sharpSide: 'Over',
        confidence: split.total.overMoneyPct > 60 ? 'high' : 'medium',
        signal: `${split.total.underBetPct}% public on Under ${split.total.line}, but ${split.total.overMoneyPct}% of money on Over`,
      })
    }
  }

  return signals
}

// =============================================================================
// DATABASE STORAGE
// =============================================================================

/**
 * Store betting splits in Supabase
 * Note: Requires a 'betting_splits' table with appropriate columns
 */
export async function storeBettingSplitsInDB(
  splits: BettingSplit[],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any
): Promise<void> {
  const records = splits.map(split => ({
    game_id: split.gameId,
    sport: split.sport,
    home_team: split.homeTeam,
    away_team: split.awayTeam,
    game_time: split.gameTime,
    spread_home_bet_pct: split.spread.homeBetPct,
    spread_away_bet_pct: split.spread.awayBetPct,
    spread_home_money_pct: split.spread.homeMoneyPct,
    spread_away_money_pct: split.spread.awayMoneyPct,
    spread_line: split.spread.line,
    ml_home_bet_pct: split.moneyline.homeBetPct,
    ml_away_bet_pct: split.moneyline.awayBetPct,
    ml_home_money_pct: split.moneyline.homeMoneyPct,
    ml_away_money_pct: split.moneyline.awayMoneyPct,
    ml_home_odds: split.moneyline.homeOdds,
    ml_away_odds: split.moneyline.awayOdds,
    total_over_bet_pct: split.total.overBetPct,
    total_under_bet_pct: split.total.underBetPct,
    total_over_money_pct: split.total.overMoneyPct,
    total_under_money_pct: split.total.underMoneyPct,
    total_line: split.total.line,
    source: split.source,
    fetched_at: split.fetchedAt,
  }))

  const { error } = await supabase
    .from('betting_splits')
    .upsert(records, { onConflict: 'game_id' })

  if (error) {
    console.error('Error storing betting splits:', error)
    throw error
  }
}
