/**
 * The Odds API Client
 * Primary source for: betting odds from 40+ sportsbooks
 * Docs: https://the-odds-api.com/liveapi/guides/v4/
 * 
 * Environment Variable Required: ODDS_API_KEY
 * Set in Vercel Dashboard → Settings → Environment Variables
 */

const ODDS_API_BASE = 'https://api.the-odds-api.com/v4'

// Sport keys for The Odds API (different from ESPN)
export const ODDS_API_SPORTS = {
  NFL: 'americanfootball_nfl',
  NBA: 'basketball_nba',
  NHL: 'icehockey_nhl',
  MLB: 'baseball_mlb',
  NCAAF: 'americanfootball_ncaaf',
  NCAAB: 'basketball_ncaab',
} as const

export type OddsSportKey = keyof typeof ODDS_API_SPORTS

// Market types
export type MarketKey = 'h2h' | 'spreads' | 'totals' | 'outrights' | 'alternate_spreads' | 'alternate_totals' | 'player_props'

// Popular US sportsbooks
export const US_BOOKMAKERS = [
  'fanduel',
  'draftkings',
  'betmgm',
  'caesars',
  'pointsbetus',
  'betrivers',
  'unibet_us',
  'wynnbet',
  'superbook',
] as const

export type BookmakerKey = (typeof US_BOOKMAKERS)[number]

// Types
export interface OddsOutcome {
  name: string
  price: number // American odds
  point?: number // Spread or total line
}

export interface OddsMarket {
  key: MarketKey
  last_update: string
  outcomes: OddsOutcome[]
}

export interface OddsBookmaker {
  key: string
  title: string
  last_update: string
  markets: OddsMarket[]
}

export interface OddsGame {
  id: string
  sport_key: string
  sport_title: string
  commence_time: string
  home_team: string
  away_team: string
  bookmakers: OddsBookmaker[]
}

export interface OddsApiResponse {
  data: OddsGame[]
  remaining_requests: number
  used_requests: number
}

// Get API key from environment
function getApiKey(): string {
  const key = process.env.ODDS_API_KEY
  if (!key) {
    throw new Error('ODDS_API_KEY environment variable is required')
  }
  return key
}

// Fetch odds for a sport
export async function getOdds(
  sport: OddsSportKey,
  options: {
    markets?: MarketKey[]
    regions?: string[]
    bookmakers?: BookmakerKey[]
    dateFormat?: 'iso' | 'unix'
  } = {}
): Promise<OddsGame[]> {
  const apiKey = getApiKey()
  const sportKey = ODDS_API_SPORTS[sport]
  
  const params = new URLSearchParams({
    apiKey,
    regions: options.regions?.join(',') || 'us',
    markets: options.markets?.join(',') || 'h2h,spreads,totals',
    dateFormat: options.dateFormat || 'iso',
  })
  
  if (options.bookmakers?.length) {
    params.set('bookmakers', options.bookmakers.join(','))
  }
  
  const url = `${ODDS_API_BASE}/sports/${sportKey}/odds?${params}`
  
  const res = await fetch(url, { 
    next: { revalidate: 300 }, // Cache for 5 min (save API calls)
    headers: { 'Accept': 'application/json' }
  })
  
  if (!res.ok) {
    const error = await res.text()
    throw new Error(`Odds API error: ${res.status} - ${error}`)
  }
  
  // Log remaining requests (useful for monitoring)
  const remaining = res.headers.get('x-requests-remaining')
  const used = res.headers.get('x-requests-used')
  console.log(`[Odds API] Requests: ${used} used, ${remaining} remaining`)
  
  return res.json()
}

// Get live/in-play odds (uses more quota)
export async function getLiveOdds(sport: OddsSportKey): Promise<OddsGame[]> {
  const apiKey = getApiKey()
  const sportKey = ODDS_API_SPORTS[sport]
  
  const params = new URLSearchParams({
    apiKey,
    regions: 'us',
    markets: 'h2h,spreads,totals',
    dateFormat: 'iso',
  })
  
  const url = `${ODDS_API_BASE}/sports/${sportKey}/odds-live?${params}`
  
  const res = await fetch(url, { 
    next: { revalidate: 30 }, // Shorter cache for live
  })
  
  if (!res.ok) {
    // Live endpoint may return 404 if no live games
    if (res.status === 404) return []
    throw new Error(`Odds API error: ${res.status}`)
  }
  
  return res.json()
}

// Get scores (also available from ESPN, but useful for cross-reference)
export async function getScores(
  sport: OddsSportKey,
  options: { daysFrom?: number; completed?: boolean } = {}
): Promise<OddsGame[]> {
  const apiKey = getApiKey()
  const sportKey = ODDS_API_SPORTS[sport]
  
  const params = new URLSearchParams({
    apiKey,
    daysFrom: String(options.daysFrom ?? 1),
  })
  
  const url = `${ODDS_API_BASE}/sports/${sportKey}/scores?${params}`
  
  const res = await fetch(url, { next: { revalidate: 60 } })
  if (!res.ok) throw new Error(`Odds API error: ${res.status}`)
  
  return res.json()
}

// Get historical odds (useful for line movement analysis)
export async function getHistoricalOdds(
  sport: OddsSportKey,
  date: string, // YYYY-MM-DD
  markets: MarketKey[] = ['h2h', 'spreads', 'totals']
): Promise<OddsGame[]> {
  const apiKey = getApiKey()
  const sportKey = ODDS_API_SPORTS[sport]
  
  const params = new URLSearchParams({
    apiKey,
    regions: 'us',
    markets: markets.join(','),
    date: new Date(date).toISOString(),
  })
  
  const url = `${ODDS_API_BASE}/historical/sports/${sportKey}/odds?${params}`
  
  const res = await fetch(url, { next: { revalidate: 86400 } }) // Cache 24hr
  if (!res.ok) throw new Error(`Odds API error: ${res.status}`)
  
  const data = await res.json()
  return data.data || []
}

// Transform odds data to our unified format
export function transformOddsGame(game: OddsGame, targetSport: OddsSportKey) {
  const bestOdds = findBestOdds(game)
  const consensus = calculateConsensusLine(game)
  
  return {
    id: game.id,
    externalId: `odds_${game.id}`,
    sport: targetSport,
    scheduledAt: game.commence_time,
    homeTeam: game.home_team,
    awayTeam: game.away_team,
    odds: {
      homeML: bestOdds.homeML,
      awayML: bestOdds.awayML,
      spread: bestOdds.spread,
      spreadOdds: bestOdds.spreadOdds,
      total: bestOdds.total,
      overOdds: bestOdds.overOdds,
      underOdds: bestOdds.underOdds,
    },
    consensus,
    bookmakers: game.bookmakers.map(b => ({
      name: b.title,
      key: b.key,
      lastUpdate: b.last_update,
      h2h: b.markets.find(m => m.key === 'h2h')?.outcomes,
      spreads: b.markets.find(m => m.key === 'spreads')?.outcomes,
      totals: b.markets.find(m => m.key === 'totals')?.outcomes,
    })),
  }
}

// Find best odds across all bookmakers
function findBestOdds(game: OddsGame) {
  let homeML = -999
  let awayML = -999
  let spread = 0
  let spreadOdds = -110
  let total = 0
  let overOdds = -110
  let underOdds = -110
  
  for (const book of game.bookmakers) {
    // Moneyline (h2h)
    const h2h = book.markets.find(m => m.key === 'h2h')
    if (h2h) {
      const home = h2h.outcomes.find(o => o.name === game.home_team)
      const away = h2h.outcomes.find(o => o.name === game.away_team)
      if (home && home.price > homeML) homeML = home.price
      if (away && away.price > awayML) awayML = away.price
    }
    
    // Spreads
    const spreads = book.markets.find(m => m.key === 'spreads')
    if (spreads) {
      const home = spreads.outcomes.find(o => o.name === game.home_team)
      if (home) {
        spread = home.point || 0
        spreadOdds = home.price
      }
    }
    
    // Totals
    const totals = book.markets.find(m => m.key === 'totals')
    if (totals) {
      const over = totals.outcomes.find(o => o.name === 'Over')
      const under = totals.outcomes.find(o => o.name === 'Under')
      if (over) {
        total = over.point || 0
        overOdds = over.price
      }
      if (under) {
        underOdds = under.price
      }
    }
  }
  
  return { homeML, awayML, spread, spreadOdds, total, overOdds, underOdds }
}

// Calculate consensus line from all bookmakers
function calculateConsensusLine(game: OddsGame) {
  const spreads: number[] = []
  const totals: number[] = []
  const homeMLs: number[] = []
  
  for (const book of game.bookmakers) {
    const spreadMarket = book.markets.find(m => m.key === 'spreads')
    const homeSpread = spreadMarket?.outcomes.find(o => o.name === game.home_team)?.point
    if (homeSpread) spreads.push(homeSpread)
    
    const totalMarket = book.markets.find(m => m.key === 'totals')
    const overTotal = totalMarket?.outcomes.find(o => o.name === 'Over')?.point
    if (overTotal) totals.push(overTotal)
    
    const h2hMarket = book.markets.find(m => m.key === 'h2h')
    const homeML = h2hMarket?.outcomes.find(o => o.name === game.home_team)?.price
    if (homeML) homeMLs.push(homeML)
  }
  
  return {
    spread: spreads.length ? average(spreads) : null,
    total: totals.length ? average(totals) : null,
    homeML: homeMLs.length ? Math.round(average(homeMLs)) : null,
    bookmakerCount: game.bookmakers.length,
  }
}

function average(nums: number[]): number {
  return nums.reduce((a, b) => a + b, 0) / nums.length
}

// Get available sports from The Odds API
export async function getAvailableSports(): Promise<Array<{ key: string; title: string; active: boolean }>> {
  const apiKey = getApiKey()
  const url = `${ODDS_API_BASE}/sports?apiKey=${apiKey}`
  
  const res = await fetch(url, { next: { revalidate: 86400 } })
  if (!res.ok) throw new Error(`Odds API error: ${res.status}`)
  
  return res.json()
}

// Helper to format American odds for display
export function formatAmericanOdds(odds: number): string {
  if (odds >= 0) return `+${odds}`
  return String(odds)
}

// Calculate implied probability from American odds
export function impliedProbability(americanOdds: number): number {
  if (americanOdds > 0) {
    return 100 / (americanOdds + 100)
  }
  return Math.abs(americanOdds) / (Math.abs(americanOdds) + 100)
}

// Calculate no-vig fair odds
export function calculateFairOdds(homeOdds: number, awayOdds: number): { home: number; away: number; vig: number } {
  const homeProb = impliedProbability(homeOdds)
  const awayProb = impliedProbability(awayOdds)
  const totalProb = homeProb + awayProb
  const vig = (totalProb - 1) * 100
  
  const fairHomeProb = homeProb / totalProb
  const fairAwayProb = awayProb / totalProb
  
  return {
    home: probabilityToAmerican(fairHomeProb),
    away: probabilityToAmerican(fairAwayProb),
    vig: Math.round(vig * 100) / 100,
  }
}

function probabilityToAmerican(prob: number): number {
  if (prob >= 0.5) {
    return Math.round(-100 * prob / (1 - prob))
  }
  return Math.round(100 * (1 - prob) / prob)
}
