/**
 * COMPREHENSIVE HISTORICAL DATA IMPORT
 * 
 * Data Source Priority:
 * 1. Action Network - Betting splits, odds (2017-present)
 * 2. ESPN - Scores, schedules, stats (2000-present)
 * 3. The Odds API - Fallback for odds (paid API)
 * 
 * Imports 25 years of data for all 8 sports:
 * - NFL, NBA, NHL, MLB (major sports)
 * - NCAAF, NCAAB (college sports)
 * - WNBA, WNCAAB (women's sports)
 */

import { createClient } from '@supabase/supabase-js'

// Initialize Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// =============================================================================
// SPORT-SPECIFIC ANALYTICS DEFINITIONS
// Each sport tracks different key metrics for betting analysis
// =============================================================================

export const SPORT_ANALYTICS = {
  NFL: {
    name: 'National Football League',
    seasons: { start: 2000, end: 2025 },
    gamesPerTeam: 17, // Regular season (was 16 before 2021)
    teams: 32,
    keyStats: [
      'points_scored', 'points_allowed', 'rushing_yards', 'passing_yards',
      'turnovers', 'sacks', 'third_down_pct', 'red_zone_pct', 'time_of_possession',
      'yards_per_play', 'first_downs'
    ],
    bettingMetrics: [
      'ats_record', 'ou_record', 'home_ats', 'away_ats', 'favorite_ats', 'underdog_ats',
      'divisional_ats', 'primetime_ats', 'after_bye_ats', 'revenge_spot_ats'
    ],
    trendCategories: [
      'Home/Away', 'Favorite/Underdog', 'Division', 'Conference',
      'Primetime', 'After Bye', 'Revenge', 'Weather', 'Rest Advantage'
    ]
  },
  NBA: {
    name: 'National Basketball Association',
    seasons: { start: 2000, end: 2025 },
    gamesPerTeam: 82,
    teams: 30,
    keyStats: [
      'points_per_game', 'rebounds', 'assists', 'steals', 'blocks', 'turnovers',
      'field_goal_pct', 'three_point_pct', 'free_throw_pct', 'pace', 'offensive_rating',
      'defensive_rating', 'net_rating', 'effective_fg_pct', 'true_shooting_pct'
    ],
    bettingMetrics: [
      'ats_record', 'ou_record', 'home_ats', 'away_ats', 'favorite_ats', 'underdog_ats',
      'b2b_ats', 'rest_advantage_ats', '3_in_4_nights_ats', 'vs_division_ats'
    ],
    trendCategories: [
      'Home/Away', 'Favorite/Underdog', 'Back-to-Back', 'Rest Days',
      'Division', 'Conference', 'Altitude', 'Travel Distance'
    ]
  },
  NHL: {
    name: 'National Hockey League',
    seasons: { start: 2000, end: 2025 },
    gamesPerTeam: 82,
    teams: 32,
    keyStats: [
      'goals_for', 'goals_against', 'shots_on_goal', 'power_play_pct', 'penalty_kill_pct',
      'faceoff_win_pct', 'hits', 'blocked_shots', 'save_pct', 'corsi', 'fenwick', 'expected_goals'
    ],
    bettingMetrics: [
      'ats_record', 'ou_record', 'puckline_record', 'home_ats', 'away_ats',
      'b2b_ats', 'rest_advantage_ats', 'divisional_ats'
    ],
    trendCategories: [
      'Home/Away', 'Puck Line', 'Back-to-Back', 'Rest Days',
      'Division', 'Conference', 'Goalie Starter'
    ]
  },
  MLB: {
    name: 'Major League Baseball',
    seasons: { start: 2000, end: 2025 },
    gamesPerTeam: 162,
    teams: 30,
    keyStats: [
      'runs_scored', 'runs_allowed', 'batting_avg', 'on_base_pct', 'slugging_pct',
      'ops', 'era', 'whip', 'strikeouts', 'walks', 'home_runs', 'stolen_bases',
      'fielding_pct', 'run_differential'
    ],
    bettingMetrics: [
      'moneyline_record', 'runline_record', 'ou_record', 'home_ml', 'away_ml',
      'favorite_ml', 'underdog_ml', 'vs_lhp_ats', 'vs_rhp_ats', 'day_game_ats', 'night_game_ats'
    ],
    trendCategories: [
      'Home/Away', 'Run Line', 'vs LHP/RHP', 'Day/Night',
      'Division', 'Interleague', 'Series Opener', 'After Loss'
    ]
  },
  NCAAF: {
    name: 'College Football',
    seasons: { start: 2000, end: 2025 },
    gamesPerTeam: 12, // Regular season
    teams: 134, // FBS teams
    keyStats: [
      'points_scored', 'points_allowed', 'rushing_yards', 'passing_yards',
      'turnovers', 'sacks', 'third_down_pct', 'red_zone_pct'
    ],
    bettingMetrics: [
      'ats_record', 'ou_record', 'home_ats', 'away_ats', 'favorite_ats', 'underdog_ats',
      'conference_ats', 'non_conference_ats', 'ranked_vs_ranked_ats'
    ],
    trendCategories: [
      'Home/Away', 'Favorite/Underdog', 'Conference', 'Non-Conference',
      'Ranked Matchups', 'Bowl Games', 'Rivalry Games'
    ]
  },
  NCAAB: {
    name: 'College Basketball',
    seasons: { start: 2000, end: 2025 },
    gamesPerTeam: 30,
    teams: 363, // D1 teams
    keyStats: [
      'points_per_game', 'rebounds', 'assists', 'field_goal_pct', 'three_point_pct',
      'free_throw_pct', 'turnovers', 'kenpom_rating', 'tempo'
    ],
    bettingMetrics: [
      'ats_record', 'ou_record', 'home_ats', 'away_ats', 'favorite_ats', 'underdog_ats',
      'conference_ats', 'non_conference_ats', 'tournament_ats'
    ],
    trendCategories: [
      'Home/Away', 'Favorite/Underdog', 'Conference', 'Non-Conference',
      'March Madness', 'Conference Tournament', 'Road Underdog'
    ]
  },
  WNBA: {
    name: "Women's National Basketball Association",
    seasons: { start: 2000, end: 2025 },
    gamesPerTeam: 40,
    teams: 12,
    keyStats: [
      'points_per_game', 'rebounds', 'assists', 'steals', 'blocks',
      'field_goal_pct', 'three_point_pct', 'free_throw_pct'
    ],
    bettingMetrics: [
      'ats_record', 'ou_record', 'home_ats', 'away_ats', 'favorite_ats', 'underdog_ats'
    ],
    trendCategories: [
      'Home/Away', 'Favorite/Underdog', 'Rest Days', 'Back-to-Back'
    ]
  },
  WNCAAB: {
    name: "Women's College Basketball",
    seasons: { start: 2000, end: 2025 },
    gamesPerTeam: 30,
    teams: 363,
    keyStats: [
      'points_per_game', 'rebounds', 'assists', 'field_goal_pct',
      'three_point_pct', 'free_throw_pct', 'turnovers'
    ],
    bettingMetrics: [
      'ats_record', 'ou_record', 'home_ats', 'away_ats'
    ],
    trendCategories: [
      'Home/Away', 'Favorite/Underdog', 'Conference', 'Tournament'
    ]
  }
}

// =============================================================================
// ESPN API HELPERS
// =============================================================================

const ESPN_BASE = 'https://site.api.espn.com/apis/site/v2/sports'
const ESPN_SPORTS_MAP: Record<string, { sport: string; league: string }> = {
  NFL: { sport: 'football', league: 'nfl' },
  NBA: { sport: 'basketball', league: 'nba' },
  NHL: { sport: 'hockey', league: 'nhl' },
  MLB: { sport: 'baseball', league: 'mlb' },
  NCAAF: { sport: 'football', league: 'college-football' },
  NCAAB: { sport: 'basketball', league: 'mens-college-basketball' },
  WNBA: { sport: 'basketball', league: 'wnba' },
  WNCAAB: { sport: 'basketball', league: 'womens-college-basketball' }
}

interface ESPNGame {
  id: string
  date: string
  competitions: Array<{
    competitors: Array<{
      homeAway: 'home' | 'away'
      team: { id: string; abbreviation: string; displayName: string }
      score?: string
    }>
    venue?: { fullName: string }
  }>
  status: { type: { completed: boolean } }
}

async function fetchESPNScoreboard(sport: string, date: string): Promise<ESPNGame[]> {
  const config = ESPN_SPORTS_MAP[sport]
  if (!config) return []
  
  const url = `${ESPN_BASE}/${config.sport}/${config.league}/scoreboard?dates=${date.replace(/-/g, '')}`
  
  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    })
    if (!response.ok) return []
    const data = await response.json()
    return data.events || []
  } catch {
    return []
  }
}

// Fetch full season schedule from ESPN
async function fetchESPNSeason(sport: string, season: number): Promise<ESPNGame[]> {
  const config = ESPN_SPORTS_MAP[sport]
  if (!config) return []
  
  // ESPN has different endpoints for historical data
  const url = `https://site.api.espn.com/apis/site/v2/sports/${config.sport}/${config.league}/scoreboard?dates=${season}&seasontype=2&limit=1000`
  
  try {
    const response = await fetch(url)
    if (!response.ok) return []
    const data = await response.json()
    return data.events || []
  } catch {
    return []
  }
}

// =============================================================================
// ACTION NETWORK API HELPERS
// =============================================================================

const ACTION_NETWORK_BASE = 'https://api.actionnetwork.com/web/v2'
const AN_SPORT_SLUGS: Record<string, string> = {
  NFL: 'nfl',
  NBA: 'nba',
  NHL: 'nhl',
  MLB: 'mlb',
  NCAAF: 'ncaaf',
  NCAAB: 'ncaab',
  WNBA: 'wnba',
  WNCAAB: 'ncaaw'
}

interface ActionNetworkGame {
  id: number
  status: string
  start_time: string
  away_team_id: number
  home_team_id: number
  teams: Array<{ id: number; abbr: string; full_name: string }>
  boxscore?: { total_away_points: number; total_home_points: number }
  markets?: Record<string, {
    event?: {
      spread?: Array<{ side: string; value: number; odds: number; bet_info?: { tickets: { percent: number }; money: { percent: number } } }>
      total?: Array<{ side: string; value: number; odds: number; bet_info?: { tickets: { percent: number }; money: { percent: number } } }>
    }
  }>
}

async function fetchActionNetworkGames(sport: string, date: Date): Promise<ActionNetworkGame[]> {
  const slug = AN_SPORT_SLUGS[sport]
  if (!slug) return []
  
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '')
  const url = `${ACTION_NETWORK_BASE}/scoreboard/${slug}?date=${dateStr}&periods=event`
  
  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0', Accept: 'application/json' }
    })
    if (!response.ok) return []
    const data = await response.json()
    return data.games || []
  } catch {
    return []
  }
}

// Fetch historical games from Action Network (has data back to 2017)
async function fetchActionNetworkHistorical(sport: string, date: Date): Promise<ActionNetworkGame[]> {
  // Action Network stores historical completed games
  return fetchActionNetworkGames(sport, date)
}

// =============================================================================
// DATA TRANSFORMATION
// =============================================================================

interface HistoricalGame {
  espn_game_id: string
  sport: string
  season: number
  season_type: string
  week?: number
  game_date: string
  home_team_id: string
  home_team_name: string
  home_team_abbr: string
  away_team_id: string
  away_team_name: string
  away_team_abbr: string
  home_score: number | null
  away_score: number | null
  total_points: number | null
  point_spread: number | null
  over_under: number | null
  spread_result: 'home_cover' | 'away_cover' | 'push' | null
  total_result: 'over' | 'under' | 'push' | null
  // Additional betting data
  home_ticket_pct?: number
  away_ticket_pct?: number
  home_money_pct?: number
  away_money_pct?: number
  opening_spread?: number
  closing_spread?: number
  opening_total?: number
  closing_total?: number
}

function calculateSpreadResult(
  homeScore: number,
  awayScore: number,
  spread: number
): 'home_cover' | 'away_cover' | 'push' {
  // spread is from home team perspective (negative = home favored)
  const homeMargin = homeScore - awayScore
  const adjustedMargin = homeMargin + spread
  
  if (adjustedMargin > 0) return 'home_cover'
  if (adjustedMargin < 0) return 'away_cover'
  return 'push'
}

function calculateTotalResult(
  homeScore: number,
  awayScore: number,
  total: number
): 'over' | 'under' | 'push' {
  const actualTotal = homeScore + awayScore
  if (actualTotal > total) return 'over'
  if (actualTotal < total) return 'under'
  return 'push'
}

function transformESPNToHistorical(game: ESPNGame, sport: string, season: number): HistoricalGame | null {
  const comp = game.competitions?.[0]
  if (!comp) return null
  
  const home = comp.competitors.find(c => c.homeAway === 'home')
  const away = comp.competitors.find(c => c.homeAway === 'away')
  
  if (!home || !away) return null
  
  const homeScore = home.score ? parseInt(home.score) : null
  const awayScore = away.score ? parseInt(away.score) : null
  
  return {
    espn_game_id: game.id,
    sport: sport.toLowerCase(),
    season,
    season_type: 'regular',
    game_date: game.date.slice(0, 10),
    home_team_id: home.team.id,
    home_team_name: home.team.displayName,
    home_team_abbr: home.team.abbreviation,
    away_team_id: away.team.id,
    away_team_name: away.team.displayName,
    away_team_abbr: away.team.abbreviation,
    home_score: homeScore,
    away_score: awayScore,
    total_points: homeScore && awayScore ? homeScore + awayScore : null,
    point_spread: null, // ESPN doesn't always have odds
    over_under: null,
    spread_result: null,
    total_result: null
  }
}

function transformActionNetworkToHistorical(game: ActionNetworkGame, sport: string, season: number): HistoricalGame | null {
  const homeTeam = game.teams?.find(t => t.id === game.home_team_id)
  const awayTeam = game.teams?.find(t => t.id === game.away_team_id)
  
  if (!homeTeam || !awayTeam) return null
  
  const homeScore = game.boxscore?.total_home_points ?? null
  const awayScore = game.boxscore?.total_away_points ?? null
  
  // Extract betting data from markets (book 15 is consensus)
  const markets = game.markets?.['15']?.event
  const spreadHome = markets?.spread?.find(s => s.side === 'home')
  const totalOver = markets?.total?.find(t => t.side === 'over')
  
  const spread = spreadHome?.value ?? null
  const total = totalOver?.value ?? null
  
  let spreadResult: 'home_cover' | 'away_cover' | 'push' | null = null
  let totalResult: 'over' | 'under' | 'push' | null = null
  
  if (homeScore !== null && awayScore !== null && spread !== null) {
    spreadResult = calculateSpreadResult(homeScore, awayScore, spread)
  }
  
  if (homeScore !== null && awayScore !== null && total !== null) {
    totalResult = calculateTotalResult(homeScore, awayScore, total)
  }
  
  return {
    espn_game_id: `an-${game.id}`,
    sport: sport.toLowerCase(),
    season,
    season_type: 'regular',
    game_date: new Date(game.start_time).toISOString().slice(0, 10),
    home_team_id: String(game.home_team_id),
    home_team_name: homeTeam.full_name,
    home_team_abbr: homeTeam.abbr,
    away_team_id: String(game.away_team_id),
    away_team_name: awayTeam.full_name,
    away_team_abbr: awayTeam.abbr,
    home_score: homeScore,
    away_score: awayScore,
    total_points: homeScore !== null && awayScore !== null ? homeScore + awayScore : null,
    point_spread: spread,
    over_under: total,
    spread_result: spreadResult,
    total_result: totalResult,
    home_ticket_pct: spreadHome?.bet_info?.tickets?.percent,
    away_ticket_pct: 100 - (spreadHome?.bet_info?.tickets?.percent ?? 50),
    home_money_pct: spreadHome?.bet_info?.money?.percent,
    away_money_pct: 100 - (spreadHome?.bet_info?.money?.percent ?? 50)
  }
}

// =============================================================================
// DATABASE OPERATIONS
// =============================================================================

async function upsertHistoricalGames(games: HistoricalGame[]): Promise<void> {
  if (games.length === 0) return
  
  // Filter out games with null required fields
  const validGames = games.filter(g => 
    g.espn_game_id && g.home_team_abbr && g.away_team_abbr && g.game_date
  )
  
  const { error } = await supabase
    .from('historical_games')
    .upsert(validGames, { onConflict: 'espn_game_id' })
  
  if (error) {
    console.error('Error upserting games:', error)
  }
}

// =============================================================================
// MAIN IMPORT FUNCTIONS
// =============================================================================

/**
 * Import historical data for a single sport and season
 */
async function importSportSeason(sport: string, season: number): Promise<number> {
  console.log(`Importing ${sport} ${season}...`)
  
  const games: HistoricalGame[] = []
  
  // Determine date range for the season
  const seasonDates = getSeasonDates(sport, season)
  
  // Try Action Network first (has betting data, back to 2017)
  if (season >= 2017) {
    let currentDate = new Date(seasonDates.start)
    const endDate = new Date(seasonDates.end)
    
    while (currentDate <= endDate) {
      const anGames = await fetchActionNetworkHistorical(sport, currentDate)
      
      for (const anGame of anGames) {
        const transformed = transformActionNetworkToHistorical(anGame, sport, season)
        if (transformed && transformed.home_score !== null) {
          games.push(transformed)
        }
      }
      
      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1)
      
      // Rate limiting
      await sleep(100)
    }
  }
  
  // Fall back to ESPN for older data or missing games
  if (games.length < 50 || season < 2017) {
    const espnGames = await fetchESPNSeason(sport, season)
    
    for (const espnGame of espnGames) {
      // Only add if not already from Action Network
      const existing = games.find(g => 
        g.home_team_abbr === espnGame.competitions?.[0]?.competitors?.find(c => c.homeAway === 'home')?.team?.abbreviation &&
        g.game_date === espnGame.date.slice(0, 10)
      )
      
      if (!existing && espnGame.status?.type?.completed) {
        const transformed = transformESPNToHistorical(espnGame, sport, season)
        if (transformed && transformed.home_score !== null) {
          games.push(transformed)
        }
      }
    }
  }
  
  // Batch upsert to database
  if (games.length > 0) {
    await upsertHistoricalGames(games)
    console.log(`  Imported ${games.length} games for ${sport} ${season}`)
  }
  
  return games.length
}

/**
 * Get season date range for each sport
 */
function getSeasonDates(sport: string, season: number): { start: string; end: string } {
  switch (sport) {
    case 'NFL':
    case 'NCAAF':
      return {
        start: `${season}-09-01`,
        end: `${season + 1}-02-15` // Through Super Bowl / CFP
      }
    case 'NBA':
    case 'NCAAB':
      return {
        start: `${season}-10-15`,
        end: `${season + 1}-06-30` // Through Finals / March Madness
      }
    case 'NHL':
      return {
        start: `${season}-10-01`,
        end: `${season + 1}-06-30` // Through Stanley Cup
      }
    case 'MLB':
      return {
        start: `${season}-03-20`,
        end: `${season}-11-15` // Through World Series
      }
    case 'WNBA':
      return {
        start: `${season}-05-01`,
        end: `${season}-10-31`
      }
    case 'WNCAAB':
      return {
        start: `${season}-11-01`,
        end: `${season + 1}-04-15`
      }
    default:
      return {
        start: `${season}-01-01`,
        end: `${season}-12-31`
      }
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Full import of all historical data
 */
async function importAllHistoricalData(): Promise<void> {
  const startYear = 2000
  const endYear = 2025
  
  const sports = ['NFL', 'NBA', 'NHL', 'MLB', 'NCAAF', 'NCAAB', 'WNBA', 'WNCAAB']
  
  let totalGames = 0
  
  for (const sport of sports) {
    console.log(`\n=== Importing ${sport} (${startYear}-${endYear}) ===`)
    
    for (let season = startYear; season <= endYear; season++) {
      try {
        const count = await importSportSeason(sport, season)
        totalGames += count
        
        // Rate limiting between seasons
        await sleep(500)
      } catch (error) {
        console.error(`Error importing ${sport} ${season}:`, error)
      }
    }
  }
  
  console.log(`\n=== IMPORT COMPLETE ===`)
  console.log(`Total games imported: ${totalGames}`)
}

/**
 * Import recent games (last 30 days) - for daily updates
 */
async function importRecentGames(): Promise<void> {
  const sports = ['NFL', 'NBA', 'NHL', 'MLB', 'NCAAF', 'NCAAB', 'WNBA', 'WNCAAB']
  const today = new Date()
  const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
  
  for (const sport of sports) {
    console.log(`Importing recent ${sport} games...`)
    
    let currentDate = new Date(thirtyDaysAgo)
    const games: HistoricalGame[] = []
    
    while (currentDate <= today) {
      const anGames = await fetchActionNetworkHistorical(sport, currentDate)
      
      for (const anGame of anGames) {
        if (anGame.status === 'complete') {
          const transformed = transformActionNetworkToHistorical(anGame, sport, today.getFullYear())
          if (transformed) {
            games.push(transformed)
          }
        }
      }
      
      currentDate.setDate(currentDate.getDate() + 1)
      await sleep(100)
    }
    
    if (games.length > 0) {
      await upsertHistoricalGames(games)
      console.log(`  Imported ${games.length} recent ${sport} games`)
    }
  }
}

// =============================================================================
// CLI INTERFACE
// =============================================================================

const command = process.argv[2]

switch (command) {
  case 'all':
    importAllHistoricalData()
      .then(() => process.exit(0))
      .catch(err => { console.error(err); process.exit(1) })
    break
  case 'recent':
    importRecentGames()
      .then(() => process.exit(0))
      .catch(err => { console.error(err); process.exit(1) })
    break
  case 'sport':
    const sport = process.argv[3]?.toUpperCase()
    const startSeason = parseInt(process.argv[4]) || 2020
    const endSeason = parseInt(process.argv[5]) || 2025
    
    if (!sport) {
      console.error('Usage: npx ts-node import-historical-data.ts sport <SPORT> [startYear] [endYear]')
      process.exit(1)
    }
    
    (async () => {
      for (let season = startSeason; season <= endSeason; season++) {
        await importSportSeason(sport, season)
      }
    })()
      .then(() => process.exit(0))
      .catch(err => { console.error(err); process.exit(1) })
    break
  default:
    console.log(`
Historical Data Import Tool

Usage:
  npx ts-node import-historical-data.ts all                    # Import all sports 2000-2025
  npx ts-node import-historical-data.ts recent                 # Import last 30 days
  npx ts-node import-historical-data.ts sport NFL 2020 2025    # Import specific sport/years
    `)
}

export { importAllHistoricalData, importRecentGames, importSportSeason }
