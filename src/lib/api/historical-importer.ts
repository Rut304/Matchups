/**
 * Historical Data Importer
 * 
 * Imports historical game data from 2000-present into Supabase
 * Uses ESPN for game results (free, unlimited)
 * Uses The Odds API for historical lines (June 2020+, paid)
 * 
 * Strategy:
 * - 2000-2020: ESPN only (game results, no betting lines)
 * - 2020-present: ESPN + The Odds API (full data with lines)
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const theOddsApiKey = process.env.ODDS_API_KEY || process.env.THE_ODDS_API_KEY || ''

// ===========================================
// TYPES
// ===========================================

interface HistoricalGame {
  espn_game_id: string
  sport: string // lowercase
  season: number
  season_type: string
  game_date: string
  home_team_id: string
  home_team_name: string
  home_team_abbr: string
  away_team_id: string
  away_team_name: string
  away_team_abbr: string
  home_score: number | null
  away_score: number | null
  venue?: string
  total_points?: number | null
  // Betting data (null for pre-2020)
  point_spread?: number | null
  over_under?: number | null
  // Results
  spread_result?: 'home_cover' | 'away_cover' | 'push' | null
  total_result?: 'over' | 'under' | 'push' | null
}

interface ESPNScoreboard {
  events: Array<{
    id: string
    date: string
    name: string
    competitions: Array<{
      id: string
      venue?: { fullName: string; capacity?: number }
      attendance?: number
      competitors: Array<{
        id: string
        team: { id: string; displayName: string; abbreviation: string }
        homeAway: 'home' | 'away'
        score?: string
        winner?: boolean
      }>
      status: {
        type: { completed: boolean; name: string }
      }
    }>
    season?: {
      year: number
      type: number
    }
  }>
}

interface TheOddsHistoricalEvent {
  id: string
  sport_key: string
  sport_title: string
  commence_time: string
  home_team: string
  away_team: string
  bookmakers: Array<{
    key: string
    title: string
    last_update: string
    markets: Array<{
      key: string
      outcomes: Array<{
        name: string
        price: number
        point?: number
      }>
    }>
  }>
  scores?: Array<{
    name: string
    score: string
  }>
}

// ===========================================
// ESPN DATA FETCHING
// ===========================================

const ESPN_BASE = 'https://site.api.espn.com/apis/site/v2/sports'

const SPORT_PATHS: Record<string, string> = {
  NFL: 'football/nfl',
  NBA: 'basketball/nba',
  NHL: 'hockey/nhl',
  MLB: 'baseball/mlb',
  NCAAF: 'football/college-football',
  NCAAB: 'basketball/mens-college-basketball',
}

/**
 * Fetch ESPN scoreboard for a specific date
 */
async function fetchESPNScoreboard(
  sport: string,
  date: string // YYYYMMDD format
): Promise<ESPNScoreboard | null> {
  const path = SPORT_PATHS[sport]
  if (!path) return null

  try {
    const url = `${ESPN_BASE}/${path}/scoreboard?dates=${date}`
    const response = await fetch(url)
    
    if (!response.ok) {
      console.error(`ESPN error for ${sport} ${date}: ${response.status}`)
      return null
    }

    return await response.json()
  } catch (error) {
    console.error(`ESPN fetch error for ${sport} ${date}:`, error)
    return null
  }
}

/**
 * Fetch games for an entire season
 */
async function fetchSeasonGames(
  sport: string,
  year: number,
  seasonType: number = 2 // 1=preseason, 2=regular, 3=postseason
): Promise<ESPNScoreboard | null> {
  const path = SPORT_PATHS[sport]
  if (!path) return null

  try {
    const url = `${ESPN_BASE}/${path}/scoreboard?dates=${year}&seasontype=${seasonType}&limit=1000`
    const response = await fetch(url)
    
    if (!response.ok) {
      console.error(`ESPN season error: ${response.status}`)
      return null
    }

    return await response.json()
  } catch (error) {
    console.error(`ESPN season fetch error:`, error)
    return null
  }
}

/**
 * Transform ESPN data to our format
 */
function transformESPNGame(
  event: ESPNScoreboard['events'][0],
  sport: string
): HistoricalGame | null {
  const competition = event.competitions?.[0]
  if (!competition) return null

  const homeTeam = competition.competitors.find(c => c.homeAway === 'home')
  const awayTeam = competition.competitors.find(c => c.homeAway === 'away')
  
  if (!homeTeam || !awayTeam) return null

  const homeScore = homeTeam.score ? parseInt(homeTeam.score) : null
  const awayScore = awayTeam.score ? parseInt(awayTeam.score) : null

  const seasonTypeMap: Record<number, string> = {
    1: 'preseason',
    2: 'regular',
    3: 'postseason',
  }

  return {
    espn_game_id: event.id,
    sport: sport.toLowerCase(),
    season: event.season?.year || new Date(event.date).getFullYear(),
    season_type: seasonTypeMap[event.season?.type || 2] || 'regular',
    game_date: event.date,
    home_team_id: homeTeam.team.id,
    home_team_name: homeTeam.team.displayName,
    home_team_abbr: homeTeam.team.abbreviation,
    away_team_id: awayTeam.team.id,
    away_team_name: awayTeam.team.displayName,
    away_team_abbr: awayTeam.team.abbreviation,
    home_score: homeScore,
    away_score: awayScore,
    venue: competition.venue?.fullName,
    total_points: homeScore !== null && awayScore !== null ? homeScore + awayScore : null,
    // No betting data from ESPN basic scoreboard
    point_spread: null,
    over_under: null,
    spread_result: null,
    total_result: null,
  }
}

// ===========================================
// THE ODDS API DATA FETCHING
// ===========================================

const ODDS_API_BASE = 'https://api.the-odds-api.com/v4'

const ODDS_SPORT_KEYS: Record<string, string> = {
  NFL: 'americanfootball_nfl',
  NBA: 'basketball_nba',
  NHL: 'icehockey_nhl',
  MLB: 'baseball_mlb',
  NCAAF: 'americanfootball_ncaaf',
  NCAAB: 'basketball_ncaab',
}

/**
 * Fetch historical odds for a specific date
 * Note: Historical odds API costs 10x quota per request
 */
async function fetchHistoricalOdds(
  sport: string,
  date: string // ISO format YYYY-MM-DDTHH:MM:SSZ
): Promise<TheOddsHistoricalEvent[]> {
  const sportKey = ODDS_SPORT_KEYS[sport]
  if (!sportKey || !theOddsApiKey) return []

  try {
    const url = `${ODDS_API_BASE}/historical/sports/${sportKey}/odds?apiKey=${theOddsApiKey}&regions=us&markets=spreads,totals,h2h&oddsFormat=american&date=${date}`
    
    const response = await fetch(url)
    
    if (!response.ok) {
      console.error(`The Odds API error: ${response.status}`)
      return []
    }

    const data = await response.json()
    return data.data || []
  } catch (error) {
    console.error(`The Odds API fetch error:`, error)
    return []
  }
}

/**
 * Extract odds from bookmaker data
 */
function extractOdds(
  bookmakers: TheOddsHistoricalEvent['bookmakers'],
  homeTeam: string
): {
  spread?: number
  total?: number
  homeMl?: number
  awayMl?: number
} {
  // Prefer DraftKings, then FanDuel, then any
  const preferredBooks = ['draftkings', 'fanduel', 'betmgm', 'caesars']
  
  let selectedBook = bookmakers.find(b => preferredBooks.includes(b.key)) || bookmakers[0]
  if (!selectedBook) return {}

  const result: ReturnType<typeof extractOdds> = {}

  for (const market of selectedBook.markets) {
    if (market.key === 'spreads') {
      const homeSpread = market.outcomes.find(o => o.name === homeTeam)
      if (homeSpread?.point !== undefined) {
        result.spread = homeSpread.point
      }
    }
    
    if (market.key === 'totals') {
      const over = market.outcomes.find(o => o.name === 'Over')
      if (over?.point !== undefined) {
        result.total = over.point
      }
    }
    
    if (market.key === 'h2h') {
      const homeMl = market.outcomes.find(o => o.name === homeTeam)
      const awayMl = market.outcomes.find(o => o.name !== homeTeam)
      if (homeMl) result.homeMl = homeMl.price
      if (awayMl) result.awayMl = awayMl.price
    }
  }

  return result
}

/**
 * Calculate betting results based on final score and lines
 */
function calculateBettingResults(
  homeScore: number,
  awayScore: number,
  spread: number | null | undefined,
  total: number | null | undefined
): {
  spreadResult: 'home_cover' | 'away_cover' | 'push' | null
  totalResult: 'over' | 'under' | 'push' | null
} {
  const result: { spreadResult: 'home_cover' | 'away_cover' | 'push' | null; totalResult: 'over' | 'under' | 'push' | null } = {
    spreadResult: null,
    totalResult: null,
  }

  if (spread !== null && spread !== undefined) {
    const adjustedHomeScore = homeScore + spread
    if (adjustedHomeScore > awayScore) {
      result.spreadResult = 'home_cover'
    } else if (adjustedHomeScore < awayScore) {
      result.spreadResult = 'away_cover'
    } else {
      result.spreadResult = 'push'
    }
  }

  if (total !== null && total !== undefined) {
    const totalScore = homeScore + awayScore
    if (totalScore > total) {
      result.totalResult = 'over'
    } else if (totalScore < total) {
      result.totalResult = 'under'
    } else {
      result.totalResult = 'push'
    }
  }

  return result
}

// ===========================================
// IMPORT FUNCTIONS
// ===========================================

/**
 * Import a single season's data
 */
export async function importSeason(
  sport: string,
  year: number,
  options: {
    includeOdds?: boolean
    seasonType?: number
    dryRun?: boolean
  } = {}
): Promise<{ imported: number; errors: number }> {
  const { includeOdds = year >= 2020, seasonType = 2, dryRun = false } = options
  
  console.log(`\nImporting ${sport} ${year} season (type: ${seasonType}, odds: ${includeOdds})...`)
  
  let imported = 0
  let errors = 0

  // Fetch season games from ESPN
  const scoreboard = await fetchSeasonGames(sport, year, seasonType)
  
  if (!scoreboard?.events?.length) {
    console.log(`No games found for ${sport} ${year}`)
    return { imported: 0, errors: 0 }
  }

  console.log(`Found ${scoreboard.events.length} games`)

  // Transform games
  const games: HistoricalGame[] = []
  
  for (const event of scoreboard.events) {
    const game = transformESPNGame(event, sport)
    if (game) {
      games.push(game)
    } else {
      errors++
    }
  }

  // Fetch historical odds if needed (2020+)
  if (includeOdds && year >= 2020) {
    console.log('Fetching historical odds...')
    
    // Group games by date
    const gamesByDate = new Map<string, HistoricalGame[]>()
    for (const game of games) {
      const date = new Date(game.game_date).toISOString().split('T')[0]
      if (!gamesByDate.has(date)) {
        gamesByDate.set(date, [])
      }
      gamesByDate.get(date)!.push(game)
    }

    // Fetch odds for each date (rate limited)
    for (const [date, dateGames] of gamesByDate) {
      // Add 1 second delay between requests
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const oddsDate = `${date}T12:00:00Z`
      const oddsData = await fetchHistoricalOdds(sport, oddsDate)
      
      // Match odds to games
      for (const game of dateGames) {
        const matchingOdds = oddsData.find(
          o => o.home_team.includes(game.home_team_name.split(' ').pop() || '') ||
               game.home_team_name.includes(o.home_team.split(' ').pop() || '')
        )
        
        if (matchingOdds) {
          const odds = extractOdds(matchingOdds.bookmakers, matchingOdds.home_team)
          game.point_spread = odds.spread ?? null
          game.over_under = odds.total ?? null
          
          // Calculate results if game is final
          if (game.home_score !== null && game.away_score !== null) {
            const results = calculateBettingResults(
              game.home_score,
              game.away_score,
              game.point_spread,
              game.over_under
            )
            game.spread_result = results.spreadResult
            game.total_result = results.totalResult
          }
        }
      }
    }
  }

  // Insert into Supabase
  if (!dryRun) {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Insert in batches of 100
    const batchSize = 100
    for (let i = 0; i < games.length; i += batchSize) {
      const batch = games.slice(i, i + batchSize)
      
      const { error } = await supabase
        .from('historical_games')
        .upsert(batch, { onConflict: 'espn_game_id' })
      
      if (error) {
        console.error(`Batch insert error:`, error)
        errors += batch.length
      } else {
        imported += batch.length
      }
    }
  } else {
    console.log(`[DRY RUN] Would insert ${games.length} games`)
    imported = games.length
  }

  console.log(`✓ Imported: ${imported}, Errors: ${errors}`)
  return { imported, errors }
}

/**
 * Import all historical data for a sport (2000-present)
 */
export async function importAllHistory(
  sport: string,
  options: {
    startYear?: number
    endYear?: number
    dryRun?: boolean
  } = {}
): Promise<{ imported: number; errors: number }> {
  const {
    startYear = 2000,
    endYear = new Date().getFullYear(),
    dryRun = false,
  } = options

  console.log(`\n${'='.repeat(50)}`)
  console.log(`Importing ${sport} history from ${startYear} to ${endYear}`)
  console.log(`${'='.repeat(50)}`)

  let totalImported = 0
  let totalErrors = 0

  for (let year = startYear; year <= endYear; year++) {
    // Import regular season
    const regular = await importSeason(sport, year, { 
      seasonType: 2, 
      dryRun,
      includeOdds: year >= 2020,
    })
    totalImported += regular.imported
    totalErrors += regular.errors

    // Import postseason
    const postseason = await importSeason(sport, year, { 
      seasonType: 3, 
      dryRun,
      includeOdds: year >= 2020,
    })
    totalImported += postseason.imported
    totalErrors += postseason.errors

    // Add delay between seasons to avoid rate limits
    await new Promise(resolve => setTimeout(resolve, 2000))
  }

  console.log(`\n${'='.repeat(50)}`)
  console.log(`${sport} COMPLETE: ${totalImported} games, ${totalErrors} errors`)
  console.log(`${'='.repeat(50)}`)

  return { imported: totalImported, errors: totalErrors }
}

/**
 * Import recent games (last 7 days) - for daily updates
 */
export async function importRecentGames(
  sports: string[] = ['NFL', 'NBA', 'NHL', 'MLB']
): Promise<{ imported: number; errors: number }> {
  let totalImported = 0
  let totalErrors = 0

  const today = new Date()
  
  for (const sport of sports) {
    for (let i = 0; i < 7; i++) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0].replace(/-/g, '')
      
      const scoreboard = await fetchESPNScoreboard(sport, dateStr)
      
      if (scoreboard?.events?.length) {
        for (const event of scoreboard.events) {
          const game = transformESPNGame(event, sport)
          if (game && game.home_score !== null) {
            // Would insert here
            totalImported++
          }
        }
      }
      
      // Small delay
      await new Promise(resolve => setTimeout(resolve, 500))
    }
  }

  return { imported: totalImported, errors: totalErrors }
}

// ===========================================
// EXPORTS
// ===========================================

export default {
  importSeason,
  importAllHistory,
  importRecentGames,
  fetchESPNScoreboard,
  fetchSeasonGames,
  fetchHistoricalOdds,
}
