import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const ODDS_API_BASE = 'https://api.the-odds-api.com/v4'

const SPORT_KEYS: Record<string, string> = {
  nfl: 'americanfootball_nfl',
  nba: 'basketball_nba',
  nhl: 'icehockey_nhl',
  mlb: 'baseball_mlb',
  ncaaf: 'americanfootball_ncaaf',
  ncaab: 'basketball_ncaab',
}

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

function getApiKey() {
  return process.env.THE_ODDS_API_KEY || process.env.ODDS_API_KEY || ''
}

// GET: Check import status and quota
export async function GET() {
  try {
    const apiKey = getApiKey()
    if (!apiKey) {
      return NextResponse.json({ error: 'No Odds API key configured' }, { status: 500 })
    }

    // Check quota (free - sports endpoint doesn't cost credits)
    const quotaRes = await fetch(`${ODDS_API_BASE}/sports?apiKey=${apiKey}`)
    const remaining = parseInt(quotaRes.headers.get('x-requests-remaining') || '0')
    const used = parseInt(quotaRes.headers.get('x-requests-used') || '0')

    // Check import progress
    const supabase = getSupabase()
    const { data: logs, error: logError } = await supabase
      .from('odds_import_log')
      .select('sport, import_date, games_imported, credits_used, status')
      .order('import_date', { ascending: false })
      .limit(50)

    const { data: stats } = await supabase
      .from('game_odds')
      .select('sport, id')

    // Group stats by sport  
    const sportCounts: Record<string, number> = {}
    if (stats) {
      for (const row of stats) {
        sportCounts[row.sport] = (sportCounts[row.sport] || 0) + 1
      }
    }

    return NextResponse.json({
      quota: { used, remaining, total: used + remaining },
      importedGames: sportCounts,
      recentLogs: logError ? [] : logs,
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

// POST: Import odds for a specific sport/date range
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { sport, date, action } = body

    const apiKey = getApiKey()
    if (!apiKey) {
      return NextResponse.json({ error: 'No Odds API key configured' }, { status: 500 })
    }

    const supabase = getSupabase()

    // Action: create tables
    if (action === 'create-tables') {
      return handleCreateTables(supabase)
    }

    // Action: import a single date for a sport
    if (!sport || !date) {
      return NextResponse.json({ error: 'sport and date required' }, { status: 400 })
    }

    const sportKey = SPORT_KEYS[sport]
    if (!sportKey) {
      return NextResponse.json({ error: `Unknown sport: ${sport}` }, { status: 400 })
    }

    // Check if already imported
    const { data: existing } = await supabase
      .from('odds_import_log')
      .select('id')
      .eq('sport', sport)
      .eq('import_date', date)
      .eq('status', 'success')
      .limit(1)

    if (existing?.length) {
      return NextResponse.json({ status: 'already_imported', message: `${sport} ${date} already imported` })
    }

    // Fetch historical odds
    const queryDate = `${date}T12:00:00Z`
    const params = new URLSearchParams({
      apiKey,
      regions: 'us',
      markets: 'h2h,spreads,totals',
      oddsFormat: 'american',
      date: queryDate,
    })

    const res = await fetch(`${ODDS_API_BASE}/historical/sports/${sportKey}/odds?${params}`)
    const creditsUsed = parseInt(res.headers.get('x-requests-last') || '0')
    const creditsRemaining = parseInt(res.headers.get('x-requests-remaining') || '0')

    if (!res.ok) {
      const errText = await res.text()
      await supabase.from('odds_import_log').upsert({
        sport, import_date: date, status: 'error',
        error_message: `${res.status}: ${errText}`,
        credits_used: creditsUsed, credits_remaining: creditsRemaining,
      }, { onConflict: 'sport,import_date' })
      return NextResponse.json({ error: errText }, { status: res.status })
    }

    const result = await res.json()
    const games = result.data || []

    let imported = 0
    for (const game of games) {
      const odds = extractOdds(game)
      const gameDate = game.commence_time.split('T')[0]

      const { error } = await supabase.from('game_odds').upsert({
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

    await supabase.from('odds_import_log').upsert({
      sport, import_date: date,
      snapshot_time: result.timestamp,
      games_found: games.length,
      games_imported: imported,
      credits_used: creditsUsed,
      credits_remaining: creditsRemaining,
      status: 'success',
    }, { onConflict: 'sport,import_date' })

    return NextResponse.json({
      status: 'success',
      gamesFound: games.length,
      gamesImported: imported,
      creditsUsed,
      creditsRemaining,
      snapshotTime: result.timestamp,
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

function extractOdds(game: { home_team: string; away_team: string; bookmakers: Array<{ key: string; title: string; markets: Array<{ key: string; outcomes: Array<{ name: string; price: number; point?: number }> }> }> }) {
  const bookmakerOdds: Record<string, unknown> = {}
  const homeMLs: number[] = [], awayMLs: number[] = []
  const spreads: number[] = [], spreadHomeOdds: number[] = []
  const totals: number[] = [], overOddsList: number[] = [], underOddsList: number[] = []

  const specific: Record<string, Record<string, number | undefined>> = {
    fanduel: {}, draftkings: {}, betmgm: {}
  }
  let bestHomeML = -9999, bestAwayML = -9999

  for (const book of game.bookmakers) {
    const bd: Record<string, unknown> = { key: book.key, title: book.title }
    const h2h = book.markets.find(m => m.key === 'h2h')
    const sp = book.markets.find(m => m.key === 'spreads')
    const tot = book.markets.find(m => m.key === 'totals')

    if (h2h) {
      const h = h2h.outcomes.find(o => o.name === game.home_team)
      const a = h2h.outcomes.find(o => o.name === game.away_team)
      if (h) { homeMLs.push(h.price); bd.home_ml = h.price; if (h.price > bestHomeML) bestHomeML = h.price }
      if (a) { awayMLs.push(a.price); bd.away_ml = a.price; if (a.price > bestAwayML) bestAwayML = a.price }
    }
    if (sp) {
      const hs = sp.outcomes.find(o => o.name === game.home_team)
      if (hs?.point !== undefined) { spreads.push(hs.point); spreadHomeOdds.push(hs.price); bd.spread = hs.point }
    }
    if (tot) {
      const ov = tot.outcomes.find(o => o.name === 'Over')
      const un = tot.outcomes.find(o => o.name === 'Under')
      if (ov?.point !== undefined) { totals.push(ov.point); overOddsList.push(ov.price); bd.total = ov.point }
      if (un) { underOddsList.push(un.price) }
    }

    bookmakerOdds[book.key] = bd

    if (['fanduel', 'draftkings', 'betmgm'].includes(book.key)) {
      const s = specific[book.key]
      const h2hH = h2h?.outcomes.find(o => o.name === game.home_team)
      const h2hA = h2h?.outcomes.find(o => o.name === game.away_team)
      if (h2hH) s.home_ml = h2hH.price
      if (h2hA) s.away_ml = h2hA.price
      const sph = sp?.outcomes.find(o => o.name === game.home_team)
      if (sph) { s.spread = sph.point; s.spread_home_odds = sph.price }
      const ov = tot?.outcomes.find(o => o.name === 'Over')
      const un = tot?.outcomes.find(o => o.name === 'Under')
      if (ov) { s.total = ov.point; s.over_odds = ov.price }
      if (un) s.under_odds = un.price
    }
  }

  const avg = (a: number[]) => a.length ? Math.round(a.reduce((x, y) => x + y, 0) / a.length) : null
  const avgD = (a: number[]) => a.length ? Math.round((a.reduce((x, y) => x + y, 0) / a.length) * 2) / 2 : null

  return {
    consensus_home_ml: avg(homeMLs), consensus_away_ml: avg(awayMLs),
    consensus_spread: avgD(spreads), consensus_spread_home_odds: avg(spreadHomeOdds),
    consensus_total: avgD(totals), consensus_over_odds: avg(overOddsList),
    consensus_under_odds: avg(underOddsList),
    best_home_ml: bestHomeML !== -9999 ? bestHomeML : null,
    best_away_ml: bestAwayML !== -9999 ? bestAwayML : null,
    best_spread: spreads.length ? spreads[0] : null,
    best_total: totals.length ? Math.max(...totals) : null,
    fanduel_home_ml: specific.fanduel.home_ml ?? null,
    fanduel_away_ml: specific.fanduel.away_ml ?? null,
    fanduel_spread: specific.fanduel.spread ?? null,
    fanduel_spread_home_odds: specific.fanduel.spread_home_odds ?? null,
    fanduel_total: specific.fanduel.total ?? null,
    fanduel_over_odds: specific.fanduel.over_odds ?? null,
    fanduel_under_odds: specific.fanduel.under_odds ?? null,
    draftkings_home_ml: specific.draftkings.home_ml ?? null,
    draftkings_away_ml: specific.draftkings.away_ml ?? null,
    draftkings_spread: specific.draftkings.spread ?? null,
    draftkings_spread_home_odds: specific.draftkings.spread_home_odds ?? null,
    draftkings_total: specific.draftkings.total ?? null,
    draftkings_over_odds: specific.draftkings.over_odds ?? null,
    draftkings_under_odds: specific.draftkings.under_odds ?? null,
    betmgm_home_ml: specific.betmgm.home_ml ?? null,
    betmgm_away_ml: specific.betmgm.away_ml ?? null,
    betmgm_spread: specific.betmgm.spread ?? null,
    betmgm_spread_home_odds: specific.betmgm.spread_home_odds ?? null,
    betmgm_total: specific.betmgm.total ?? null,
    betmgm_over_odds: specific.betmgm.over_odds ?? null,
    betmgm_under_odds: specific.betmgm.under_odds ?? null,
    bookmaker_odds: bookmakerOdds,
    bookmaker_count: game.bookmakers.length,
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleCreateTables(supabase: any) {
  // Auto-create tables via REST API bootstrapping
  try {
    // Test if table exists
    const { error } = await supabase.from('game_odds').select('id').limit(1)
    if (!error) {
      return NextResponse.json({ status: 'tables_exist' })
    }

    return NextResponse.json({
      status: 'tables_needed',
      message: 'Run the SQL in supabase/migrations/game_odds.sql via Supabase Dashboard SQL Editor',
      sql_file: 'supabase/migrations/game_odds.sql',
    })
  } catch {
    return NextResponse.json({ error: 'Failed to check tables' }, { status: 500 })
  }
}
