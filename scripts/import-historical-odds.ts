/**
 * Historical Odds Import Script
 * 
 * Imports historical closing odds from The Odds API into Supabase.
 * Data available from June 6, 2020 onwards.
 * 
 * Usage:
 *   npx tsx scripts/import-historical-odds.ts [options]
 * 
 * Options:
 *   --sport=nfl,nba,mlb,nhl     Which sports (default: nfl,nba,mlb,nhl)
 *   --from=2024-09-01            Start date (default: 2020-06-06)
 *   --to=2025-02-14              End date (default: today)
 *   --dry-run                    Don't write to DB, just show what would happen
 *   --max-credits=5000           Stop after using this many credits
 *   --create-tables              Create the game_odds tables first
 * 
 * Credit costs: 30 per historical odds request (3 markets × 1 region × 10)
 * With 100,000 credits: ~3,333 requests possible
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'
import * as fs from 'fs'

// Load env
dotenv.config({ path: path.join(process.cwd(), '.env.local') })

const ODDS_API_BASE = 'https://api.the-odds-api.com/v4'
const API_KEY = process.env.THE_ODDS_API_KEY || process.env.ODDS_API_KEY || ''
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

if (!API_KEY) { console.error('❌ No THE_ODDS_API_KEY or ODDS_API_KEY found in .env.local'); process.exit(1) }
if (!SUPABASE_URL || !SUPABASE_KEY) { console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY'); process.exit(1) }

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

// Sport key mapping
const SPORT_KEYS: Record<string, string> = {
  nfl: 'americanfootball_nfl',
  nba: 'basketball_nba',
  nhl: 'icehockey_nhl',
  mlb: 'baseball_mlb',
  ncaaf: 'americanfootball_ncaaf',
  ncaab: 'basketball_ncaab',
}

// Season dates for each sport (approximate)
const SPORT_SEASONS: Record<string, Array<{ season: number; start: string; end: string }>> = {
  nfl: [
    { season: 2020, start: '2020-09-10', end: '2021-02-08' },
    { season: 2021, start: '2021-09-09', end: '2022-02-14' },
    { season: 2022, start: '2022-09-08', end: '2023-02-13' },
    { season: 2023, start: '2023-09-07', end: '2024-02-12' },
    { season: 2024, start: '2024-09-05', end: '2025-02-10' },
    { season: 2025, start: '2025-09-04', end: '2026-02-09' },
  ],
  nba: [
    { season: 2021, start: '2020-12-22', end: '2021-07-21' },
    { season: 2022, start: '2021-10-19', end: '2022-06-17' },
    { season: 2023, start: '2022-10-18', end: '2023-06-13' },
    { season: 2024, start: '2023-10-24', end: '2024-06-18' },
    { season: 2025, start: '2024-10-22', end: '2025-06-20' },
  ],
  mlb: [
    { season: 2020, start: '2020-07-23', end: '2020-10-28' },
    { season: 2021, start: '2021-04-01', end: '2021-11-03' },
    { season: 2022, start: '2022-04-07', end: '2022-11-06' },
    { season: 2023, start: '2023-03-30', end: '2023-11-02' },
    { season: 2024, start: '2024-03-28', end: '2024-10-31' },
    { season: 2025, start: '2025-03-27', end: '2025-10-31' },
  ],
  nhl: [
    { season: 2021, start: '2021-01-13', end: '2021-07-08' },
    { season: 2022, start: '2021-10-12', end: '2022-06-27' },
    { season: 2023, start: '2022-10-07', end: '2023-06-14' },
    { season: 2024, start: '2023-10-10', end: '2024-06-25' },
    { season: 2025, start: '2024-10-08', end: '2025-06-25' },
  ],
  ncaaf: [
    { season: 2020, start: '2020-09-03', end: '2021-01-12' },
    { season: 2021, start: '2021-09-02', end: '2022-01-11' },
    { season: 2022, start: '2022-09-01', end: '2023-01-10' },
    { season: 2023, start: '2023-08-26', end: '2024-01-09' },
    { season: 2024, start: '2024-08-24', end: '2025-01-21' },
    { season: 2025, start: '2025-08-23', end: '2026-01-20' },
  ],
  ncaab: [
    { season: 2021, start: '2020-11-25', end: '2021-04-06' },
    { season: 2022, start: '2021-11-09', end: '2022-04-05' },
    { season: 2023, start: '2022-11-07', end: '2023-04-04' },
    { season: 2024, start: '2023-11-06', end: '2024-04-09' },
    { season: 2025, start: '2024-11-04', end: '2025-04-08' },
  ],
}

// How often to sample odds (in days) - with 100k credits we can be denser
const SPORT_SAMPLE_INTERVAL: Record<string, number> = {
  nfl: 3, // NFL games mostly on Sun/Mon/Thu, sample every 3 days
  nba: 3, // NBA daily, sample every 3 days
  mlb: 3, // MLB daily, sample every 3 days
  nhl: 3, // NHL daily, sample every 3 days
  ncaaf: 7, // College - lots of games, weekly sampling
  ncaab: 7, // College - lots of games, weekly sampling
}

interface HistoricalOddsResponse {
  timestamp: string
  previous_timestamp: string | null
  next_timestamp: string | null
  data: Array<{
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
  }>
}

let totalCreditsUsed = 0
let totalGamesImported = 0

async function fetchHistoricalOdds(sportKey: string, date: string): Promise<HistoricalOddsResponse | null> {
  const params = new URLSearchParams({
    apiKey: API_KEY,
    regions: 'us',
    markets: 'h2h,spreads,totals',
    oddsFormat: 'american',
    date,
  })

  const url = `${ODDS_API_BASE}/historical/sports/${sportKey}/odds?${params}`
  
  try {
    const res = await fetch(url)
    
    const creditsUsed = parseInt(res.headers.get('x-requests-last') || '0')
    const remaining = parseInt(res.headers.get('x-requests-remaining') || '0')
    totalCreditsUsed += creditsUsed
    
    if (!res.ok) {
      if (res.status === 422) {
        // Date out of range or no data
        return null
      }
      if (res.status === 429) {
        console.log('  ⏳ Rate limited, waiting 60s...')
        await sleep(60000)
        return fetchHistoricalOdds(sportKey, date) // Retry
      }
      if (res.status === 401) {
        const text = await res.text()
        if (text.includes('OUT_OF_USAGE_CREDITS')) {
          console.error('❌ Out of API credits!')
          return null
        }
      }
      console.error(`  ❌ API error ${res.status}: ${await res.text()}`)
      return null
    }
    
    console.log(`  📊 Credits: ${creditsUsed} used this call, ${remaining} remaining`)
    return await res.json()
  } catch (err) {
    console.error(`  ❌ Fetch error:`, err)
    return null
  }
}

function extractOddsForGame(game: HistoricalOddsResponse['data'][0]) {
  const bookmakerData: Record<string, unknown> = {}
  
  let homeMLs: number[] = []
  let awayMLs: number[] = []
  let spreads: number[] = []
  let spreadHomeOdds: number[] = []
  let spreadAwayOdds: number[] = []
  let totals: number[] = []
  let overOdds: number[] = []
  let underOdds: number[] = []
  
  let bestHomeML = -9999
  let bestAwayML = -9999
  let bestSpread = 0
  let bestTotal = 0
  
  // FanDuel, DraftKings, BetMGM specific
  const specific: Record<string, {
    home_ml?: number; away_ml?: number
    spread?: number; spread_home_odds?: number
    total?: number; over_odds?: number; under_odds?: number
  }> = { fanduel: {}, draftkings: {}, betmgm: {} }
  
  for (const book of game.bookmakers) {
    const bookData: Record<string, unknown> = { key: book.key, title: book.title }
    
    // H2H (moneyline)
    const h2h = book.markets.find(m => m.key === 'h2h')
    if (h2h) {
      const home = h2h.outcomes.find(o => o.name === game.home_team)
      const away = h2h.outcomes.find(o => o.name === game.away_team)
      if (home) { homeMLs.push(home.price); bookData.home_ml = home.price }
      if (away) { awayMLs.push(away.price); bookData.away_ml = away.price }
      if (home && home.price > bestHomeML) bestHomeML = home.price
      if (away && away.price > bestAwayML) bestAwayML = away.price
    }
    
    // Spreads
    const spreadMarket = book.markets.find(m => m.key === 'spreads')
    if (spreadMarket) {
      const homeSpread = spreadMarket.outcomes.find(o => o.name === game.home_team)
      const awaySpread = spreadMarket.outcomes.find(o => o.name === game.away_team)
      if (homeSpread?.point !== undefined) {
        spreads.push(homeSpread.point)
        spreadHomeOdds.push(homeSpread.price)
        bookData.spread = homeSpread.point
        bookData.spread_home_odds = homeSpread.price
      }
      if (awaySpread) {
        spreadAwayOdds.push(awaySpread.price)
        bookData.spread_away_odds = awaySpread.price
      }
      if (homeSpread?.point !== undefined && Math.abs(homeSpread.point) > Math.abs(bestSpread)) {
        bestSpread = homeSpread.point
      }
    }
    
    // Totals
    const totalMarket = book.markets.find(m => m.key === 'totals')
    if (totalMarket) {
      const over = totalMarket.outcomes.find(o => o.name === 'Over')
      const under = totalMarket.outcomes.find(o => o.name === 'Under')
      if (over?.point !== undefined) {
        totals.push(over.point)
        overOdds.push(over.price)
        bookData.total = over.point
        bookData.over_odds = over.price
      }
      if (under) {
        underOdds.push(under.price)
        bookData.under_odds = under.price
      }
    }
    
    bookmakerData[book.key] = bookData
    
    // Extract specific bookmaker data
    if (book.key === 'fanduel' || book.key === 'draftkings' || book.key === 'betmgm') {
      const s = specific[book.key]
      const h = h2h?.outcomes.find(o => o.name === game.home_team)
      const a = h2h?.outcomes.find(o => o.name === game.away_team)
      if (h) s.home_ml = h.price
      if (a) s.away_ml = a.price
      
      const sp = spreadMarket?.outcomes.find(o => o.name === game.home_team)
      if (sp) { s.spread = sp.point; s.spread_home_odds = sp.price }
      
      const ov = totalMarket?.outcomes.find(o => o.name === 'Over')
      const un = totalMarket?.outcomes.find(o => o.name === 'Under')
      if (ov) { s.total = ov.point; s.over_odds = ov.price }
      if (un) s.under_odds = un.price
    }
  }
  
  const avg = (arr: number[]) => arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : null
  const avgDec = (arr: number[]) => arr.length ? Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 2) / 2 : null // Round to 0.5
  
  return {
    consensus_home_ml: avg(homeMLs),
    consensus_away_ml: avg(awayMLs),
    consensus_spread: avgDec(spreads),
    consensus_spread_home_odds: avg(spreadHomeOdds),
    consensus_spread_away_odds: avg(spreadAwayOdds),
    consensus_total: avgDec(totals),
    consensus_over_odds: avg(overOdds),
    consensus_under_odds: avg(underOdds),
    best_home_ml: bestHomeML !== -9999 ? bestHomeML : null,
    best_away_ml: bestAwayML !== -9999 ? bestAwayML : null,
    best_spread: spreads.length ? bestSpread : null,
    best_total: totals.length ? Math.max(...totals) : null,
    fanduel: specific.fanduel,
    draftkings: specific.draftkings,
    betmgm: specific.betmgm,
    bookmaker_odds: bookmakerData,
    bookmaker_count: game.bookmakers.length,
  }
}

function getSeason(sport: string, dateStr: string): number | null {
  const date = new Date(dateStr)
  const seasons = SPORT_SEASONS[sport] || []
  for (const s of seasons) {
    if (date >= new Date(s.start) && date <= new Date(s.end)) {
      return s.season
    }
  }
  // Fallback: use year
  return date.getFullYear()
}

async function createTables() {
  console.log('🏗️  Creating game_odds and odds_import_log tables...')
  
  const sqlPath = path.join(process.cwd(), 'supabase/migrations/game_odds.sql')
  const sql = fs.readFileSync(sqlPath, 'utf-8')
  
  // Split by semicolons and execute each statement
  const statements = sql.split(';').filter(s => s.trim() && !s.trim().startsWith('--'))
  
  for (const stmt of statements) {
    const trimmed = stmt.trim()
    if (!trimmed) continue
    
    const { error } = await supabase.rpc('exec_sql', { sql_text: trimmed + ';' }).single()
    if (error) {
      // Try direct table creation via REST if RPC not available
      console.log(`  ⚠️  RPC not available, tables may need manual creation`)
      break
    }
  }
  
  // Verify tables exist by trying to select
  const { error: checkError } = await supabase.from('game_odds').select('id').limit(1)
  if (checkError) {
    console.log('  ⚠️  game_odds table does not exist yet. Creating via insert...')
    // The API route will auto-create, or run the SQL manually
    console.log('  📋 Run this SQL in Supabase Dashboard → SQL Editor:')
    console.log('  📋 File: supabase/migrations/game_odds.sql')
    return false
  }
  
  console.log('  ✅ Tables ready')
  return true
}

async function checkAlreadyImported(sport: string, date: string): Promise<boolean> {
  const { data } = await supabase
    .from('odds_import_log')
    .select('id')
    .eq('sport', sport)
    .eq('import_date', date)
    .eq('status', 'success')
    .limit(1)
  
  return (data?.length || 0) > 0
}

async function importDateForSport(sport: string, dateStr: string, dryRun: boolean): Promise<number> {
  const sportKey = SPORT_KEYS[sport]
  if (!sportKey) {
    console.error(`  ❌ Unknown sport: ${sport}`)
    return 0
  }
  
  // Check if already imported
  const alreadyDone = await checkAlreadyImported(sport, dateStr)
  if (alreadyDone) {
    console.log(`  ⏭️  ${sport} ${dateStr} already imported, skipping`)
    return 0
  }
  
  // Query historical odds at noon UTC for this date (get closing-ish lines)
  const queryDate = `${dateStr}T12:00:00Z`
  
  console.log(`  🔍 Fetching ${sport.toUpperCase()} odds for ${dateStr}...`)
  const result = await fetchHistoricalOdds(sportKey, queryDate)
  
  if (!result || !result.data || result.data.length === 0) {
    // Log as skipped (no games that day)
    if (!dryRun) {
      await supabase.from('odds_import_log').upsert({
        sport,
        import_date: dateStr,
        games_found: 0,
        games_imported: 0,
        credits_used: 30,
        status: 'skipped',
        error_message: 'No games found for this date',
      }, { onConflict: 'sport,import_date' })
    }
    return 0
  }
  
  console.log(`  📋 Found ${result.data.length} games at snapshot ${result.timestamp}`)
  
  let imported = 0
  
  for (const game of result.data) {
    const odds = extractOddsForGame(game)
    const gameDate = game.commence_time.split('T')[0]
    const season = getSeason(sport, game.commence_time)
    
    const record = {
      sport,
      odds_api_game_id: game.id,
      home_team: game.home_team,
      away_team: game.away_team,
      commence_time: game.commence_time,
      game_date: gameDate,
      season,
      consensus_home_ml: odds.consensus_home_ml,
      consensus_away_ml: odds.consensus_away_ml,
      consensus_spread: odds.consensus_spread,
      consensus_spread_home_odds: odds.consensus_spread_home_odds,
      consensus_spread_away_odds: odds.consensus_spread_away_odds,
      consensus_total: odds.consensus_total,
      consensus_over_odds: odds.consensus_over_odds,
      consensus_under_odds: odds.consensus_under_odds,
      best_home_ml: odds.best_home_ml,
      best_away_ml: odds.best_away_ml,
      best_spread: odds.best_spread,
      best_total: odds.best_total,
      fanduel_home_ml: odds.fanduel.home_ml ?? null,
      fanduel_away_ml: odds.fanduel.away_ml ?? null,
      fanduel_spread: odds.fanduel.spread ?? null,
      fanduel_spread_home_odds: odds.fanduel.spread_home_odds ?? null,
      fanduel_total: odds.fanduel.total ?? null,
      fanduel_over_odds: odds.fanduel.over_odds ?? null,
      fanduel_under_odds: odds.fanduel.under_odds ?? null,
      draftkings_home_ml: odds.draftkings.home_ml ?? null,
      draftkings_away_ml: odds.draftkings.away_ml ?? null,
      draftkings_spread: odds.draftkings.spread ?? null,
      draftkings_spread_home_odds: odds.draftkings.spread_home_odds ?? null,
      draftkings_total: odds.draftkings.total ?? null,
      draftkings_over_odds: odds.draftkings.over_odds ?? null,
      draftkings_under_odds: odds.draftkings.under_odds ?? null,
      betmgm_home_ml: odds.betmgm.home_ml ?? null,
      betmgm_away_ml: odds.betmgm.away_ml ?? null,
      betmgm_spread: odds.betmgm.spread ?? null,
      betmgm_spread_home_odds: odds.betmgm.spread_home_odds ?? null,
      betmgm_total: odds.betmgm.total ?? null,
      betmgm_over_odds: odds.betmgm.over_odds ?? null,
      betmgm_under_odds: odds.betmgm.under_odds ?? null,
      bookmaker_odds: odds.bookmaker_odds,
      snapshot_time: result.timestamp,
      bookmaker_count: odds.bookmaker_count,
    }
    
    if (dryRun) {
      console.log(`    📝 [DRY RUN] ${game.away_team} @ ${game.home_team} | ML: ${odds.consensus_home_ml}/${odds.consensus_away_ml} | Spread: ${odds.consensus_spread} | Total: ${odds.consensus_total} | Books: ${odds.bookmaker_count}`)
      imported++
    } else {
      const { error } = await supabase
        .from('game_odds')
        .upsert(record, { onConflict: 'odds_api_game_id' })
      
      if (error) {
        console.error(`    ❌ Error inserting ${game.away_team} @ ${game.home_team}: ${error.message}`)
      } else {
        imported++
      }
    }
  }
  
  // Log the import
  if (!dryRun) {
    await supabase.from('odds_import_log').upsert({
      sport,
      import_date: dateStr,
      snapshot_time: result.timestamp,
      games_found: result.data.length,
      games_imported: imported,
      credits_used: 30,
      status: 'success',
    }, { onConflict: 'sport,import_date' })
  }
  
  totalGamesImported += imported
  console.log(`  ✅ Imported ${imported}/${result.data.length} games`)
  
  return imported
}

function generateDates(startDate: string, endDate: string, intervalDays: number): string[] {
  const dates: string[] = []
  const current = new Date(startDate)
  const end = new Date(endDate)
  
  while (current <= end) {
    dates.push(current.toISOString().split('T')[0])
    current.setDate(current.getDate() + intervalDays)
  }
  
  return dates
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function main() {
  console.log('🏈 Historical Odds Importer')
  console.log('=' .repeat(60))
  
  // Parse arguments
  const args = process.argv.slice(2)
  const getArg = (name: string) => {
    const arg = args.find(a => a.startsWith(`--${name}=`))
    return arg?.split('=')[1]
  }
  const hasFlag = (name: string) => args.includes(`--${name}`)
  
  const sports = (getArg('sport') || 'nfl,nba,mlb,nhl').split(',').map(s => s.trim().toLowerCase())
  const fromDate = getArg('from') || '2020-06-06'
  const toDate = getArg('to') || new Date().toISOString().split('T')[0]
  const dryRun = hasFlag('dry-run')
  const maxCredits = parseInt(getArg('max-credits') || '15000')
  const createTablesFlag = hasFlag('create-tables')
  
  console.log(`  Sports:      ${sports.join(', ')}`)
  console.log(`  Date range:  ${fromDate} → ${toDate}`)
  console.log(`  Max credits: ${maxCredits.toLocaleString()}`)
  console.log(`  Dry run:     ${dryRun}`)
  console.log()
  
  // Create tables if requested
  if (createTablesFlag) {
    const ok = await createTables()
    if (!ok) {
      console.log('\n⚠️  Tables could not be auto-created. Please create them manually first.')
      console.log('  Run the SQL in: supabase/migrations/game_odds.sql')
      process.exit(1)
    }
  }
  
  // Verify table exists
  if (!dryRun) {
    const { error } = await supabase.from('game_odds').select('id').limit(1)
    if (error && error.code === '42P01') {
      console.error('❌ game_odds table does not exist. Run with --create-tables or create manually.')
      console.error('  SQL file: supabase/migrations/game_odds.sql')
      process.exit(1)
    }
  }
  
  // Import for each sport
  for (const sport of sports) {
    console.log(`\n${'='.repeat(60)}`)
    console.log(`🏟️  Importing ${sport.toUpperCase()} odds`)
    console.log(`${'='.repeat(60)}`)
    
    const interval = SPORT_SAMPLE_INTERVAL[sport] || 7
    const seasons = SPORT_SEASONS[sport] || []
    
    // Generate dates within season boundaries only
    let allDates: string[] = []
    
    for (const season of seasons) {
      const seasonStart = new Date(Math.max(new Date(season.start).getTime(), new Date(fromDate).getTime()))
      const seasonEnd = new Date(Math.min(new Date(season.end).getTime(), new Date(toDate).getTime()))
      
      if (seasonStart > seasonEnd) continue
      
      const dates = generateDates(
        seasonStart.toISOString().split('T')[0],
        seasonEnd.toISOString().split('T')[0],
        interval
      )
      allDates.push(...dates)
    }
    
    console.log(`  📅 ${allDates.length} date samples across ${seasons.length} seasons (every ${interval} days)`)
    console.log(`  💰 Estimated max credit cost: ${allDates.length * 30} credits`)
    console.log()
    
    let sportGames = 0
    
    for (let i = 0; i < allDates.length; i++) {
      const date = allDates[i]
      
      // Check credit budget
      if (totalCreditsUsed >= maxCredits) {
        console.log(`\n⚠️  Credit limit reached (${totalCreditsUsed}/${maxCredits}). Stopping.`)
        console.log(`  Resume with: --from=${date} to continue from where we left off`)
        break
      }
      
      console.log(`\n[${i + 1}/${allDates.length}] ${sport.toUpperCase()} - ${date}`)
      
      const gamesImported = await importDateForSport(sport, date, dryRun)
      sportGames += gamesImported
      
      // Rate limiting: 1 second between requests
      if (i < allDates.length - 1) {
        await sleep(1000)
      }
    }
    
    console.log(`\n  📊 ${sport.toUpperCase()} total: ${sportGames} games imported`)
  }
  
  // Final summary
  console.log(`\n${'='.repeat(60)}`)
  console.log('📊 IMPORT SUMMARY')
  console.log(`${'='.repeat(60)}`)
  console.log(`  Total games imported: ${totalGamesImported}`)
  console.log(`  Total credits used:   ${totalCreditsUsed}`)
  console.log(`  Dry run:              ${dryRun}`)
  console.log()
}

main().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
