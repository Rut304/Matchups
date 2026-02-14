/**
 * Batch import game_odds from The Odds API for a given sport and season.
 * Uses the same logic as /api/admin/import-odds/route.ts but runs locally.
 * 
 * Usage: npx tsx scripts/import-game-odds.ts <sport> <startDate> <endDate>
 * Example: npx tsx scripts/import-game-odds.ts nfl 2025-09-04 2026-02-09
 */
import { createClient } from '@supabase/supabase-js'

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const API_BASE = 'https://api.the-odds-api.com/v4'

const SPORT_KEYS: Record<string, string> = {
  nfl: 'americanfootball_nfl',
  nba: 'basketball_nba',
  nhl: 'icehockey_nhl',
  mlb: 'baseball_mlb',
  ncaaf: 'americanfootball_ncaaf',
  ncaab: 'basketball_ncaab',
}

function getApiKey() {
  return process.env.THE_ODDS_API_KEY || process.env.ODDS_API_KEY || ''
}

function extractOdds(game: any) {
  const homeMLs: number[] = [], awayMLs: number[] = []
  const spreads: number[] = [], totals: number[] = []

  for (const book of (game.bookmakers || [])) {
    const h2h = book.markets?.find((m: any) => m.key === 'h2h')
    const sp = book.markets?.find((m: any) => m.key === 'spreads')
    const tot = book.markets?.find((m: any) => m.key === 'totals')

    if (h2h) {
      const h = h2h.outcomes?.find((o: any) => o.name === game.home_team)
      const a = h2h.outcomes?.find((o: any) => o.name === game.away_team)
      if (h) homeMLs.push(h.price)
      if (a) awayMLs.push(a.price)
    }
    if (sp) {
      const hs = sp.outcomes?.find((o: any) => o.name === game.home_team)
      if (hs?.point !== undefined) spreads.push(hs.point)
    }
    if (tot) {
      const ov = tot.outcomes?.find((o: any) => o.name === 'Over')
      if (ov?.point !== undefined) totals.push(ov.point)
    }
  }

  const avg = (a: number[]) => a.length ? Math.round(a.reduce((x, y) => x + y, 0) / a.length) : null
  const avgD = (a: number[]) => a.length ? Math.round((a.reduce((x, y) => x + y, 0) / a.length) * 2) / 2 : null

  return {
    consensus_home_ml: avg(homeMLs),
    consensus_away_ml: avg(awayMLs),
    consensus_spread: avgD(spreads),
    consensus_total: avgD(totals),
    bookmaker_count: game.bookmakers?.length || 0,
  }
}

async function importDate(sport: string, date: string, apiKey: string): Promise<{ imported: number; found: number; creditsLeft: number }> {
  const sportKey = SPORT_KEYS[sport]
  
  // Check if already imported
  const { data: existing } = await sb
    .from('odds_import_log')
    .select('id')
    .eq('sport', sport)
    .eq('import_date', date)
    .eq('status', 'success')
    .limit(1)

  if (existing?.length) {
    return { imported: 0, found: 0, creditsLeft: -1 } // skip
  }

  const queryDate = `${date}T12:00:00Z`
  const params = new URLSearchParams({
    apiKey,
    regions: 'us',
    markets: 'h2h,spreads,totals',
    oddsFormat: 'american',
    date: queryDate,
  })

  const res = await fetch(`${API_BASE}/historical/sports/${sportKey}/odds?${params}`)
  const creditsLeft = parseInt(res.headers.get('x-requests-remaining') || '0')
  const creditsUsed = parseInt(res.headers.get('x-requests-last') || '0')

  if (!res.ok) {
    const errText = await res.text()
    console.error(`  ERROR ${date}: ${res.status} ${errText.substring(0, 100)}`)
    await sb.from('odds_import_log').upsert({
      sport, import_date: date, status: 'error',
      error_message: `${res.status}: ${errText.substring(0, 200)}`,
      credits_used: creditsUsed, credits_remaining: creditsLeft,
    }, { onConflict: 'sport,import_date' })
    return { imported: 0, found: 0, creditsLeft }
  }

  const result = await res.json()
  const games = result.data || []

  let imported = 0
  for (const game of games) {
    const odds = extractOdds(game)
    const gameDate = game.commence_time?.split('T')[0] || date

    const { error } = await sb.from('game_odds').upsert({
      sport,
      odds_api_game_id: game.id,
      home_team: game.home_team,
      away_team: game.away_team,
      commence_time: game.commence_time,
      game_date: gameDate,
      ...odds,
      snapshot_time: result.timestamp,
    }, { onConflict: 'odds_api_game_id' })

    if (!error) imported++
  }

  await sb.from('odds_import_log').upsert({
    sport, import_date: date,
    snapshot_time: result.timestamp,
    games_found: games.length,
    games_imported: imported,
    credits_used: creditsUsed,
    credits_remaining: creditsLeft,
    status: 'success',
  }, { onConflict: 'sport,import_date' })

  return { imported, found: games.length, creditsLeft }
}

// Generate dates between start and end (weekly intervals for efficiency)
function generateDates(start: string, end: string, intervalDays: number = 7): string[] {
  const dates: string[] = []
  const current = new Date(start)
  const endDate = new Date(end)
  while (current <= endDate) {
    dates.push(current.toISOString().split('T')[0])
    current.setDate(current.getDate() + intervalDays)
  }
  return dates
}

async function main() {
  const sport = process.argv[2]
  const startDate = process.argv[3]
  const endDate = process.argv[4]
  const interval = parseInt(process.argv[5] || '7')

  if (!sport || !startDate || !endDate) {
    console.log('Usage: npx tsx scripts/import-game-odds.ts <sport> <startDate> <endDate> [intervalDays]')
    console.log('Example: npx tsx scripts/import-game-odds.ts nfl 2025-09-04 2026-02-09 7')
    console.log('Sports: nfl, nba, nhl, mlb, ncaaf, ncaab')
    process.exit(1)
  }

  const apiKey = getApiKey()
  if (!apiKey) {
    console.error('No API key found. Set THE_ODDS_API_KEY or ODDS_API_KEY in .env.local')
    process.exit(1)
  }

  const dates = generateDates(startDate, endDate, interval)
  console.log(`Importing ${sport.toUpperCase()} game_odds: ${dates.length} dates (every ${interval} days)`)
  console.log(`Range: ${startDate} to ${endDate}\n`)

  let totalImported = 0
  let totalFound = 0

  for (let i = 0; i < dates.length; i++) {
    const date = dates[i]
    const result = await importDate(sport, date, apiKey)
    
    if (result.creditsLeft === -1) {
      console.log(`  [${i + 1}/${dates.length}] ${date} — already imported, skipping`)
      continue
    }

    totalImported += result.imported
    totalFound += result.found
    console.log(`  [${i + 1}/${dates.length}] ${date} — ${result.found} found, ${result.imported} imported (credits left: ${result.creditsLeft})`)

    if (result.creditsLeft < 10) {
      console.log('\n⚠️  Low on API credits, stopping early.')
      break
    }

    // Rate limit: 1 request per second
    await new Promise(r => setTimeout(r, 1100))
  }

  console.log(`\nDone! Total: ${totalFound} found, ${totalImported} imported`)

  // Verify
  const { count } = await sb.from('game_odds').select('*', { count: 'exact', head: true }).eq('sport', sport)
  console.log(`${sport.toUpperCase()} game_odds total: ${count}`)
}

main().catch(console.error)
