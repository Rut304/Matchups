/**
 * Universal ESPN Historical + Future Game Importer
 * 
 * Imports games from ESPN for ANY sport into historical_games.
 * Handles both completed (historical) and scheduled (future) games.
 * 
 * Usage:
 *   npx tsx scripts/import-espn-games.ts <sport> <startYear> <endYear> [--future]
 * 
 * Examples:
 *   npx tsx scripts/import-espn-games.ts ncaaf 2020 2025        # NCAAF historical
 *   npx tsx scripts/import-espn-games.ts ncaab 2020 2025        # NCAAB historical
 *   npx tsx scripts/import-espn-games.ts nfl 2025 2025 --future # NFL future games
 *   npx tsx scripts/import-espn-games.ts all 2025 2025 --future # All sports future
 * 
 * Sports: nfl, nba, nhl, mlb, ncaaf, ncaab, all
 */
import { createClient } from '@supabase/supabase-js'

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string
)

const ESPN_BASE = 'https://site.api.espn.com/apis/site/v2/sports'

const SPORT_CONFIG: Record<string, { espnPath: string; dbSport: string; seasonStart: (y: number) => Date; seasonEnd: (y: number) => Date; limit: number }> = {
  nfl: {
    espnPath: 'football/nfl',
    dbSport: 'nfl',
    seasonStart: (y) => new Date(y, 8, 1),    // Sep 1
    seasonEnd: (y) => new Date(y + 1, 1, 15), // Feb 15
    limit: 50,
  },
  nba: {
    espnPath: 'basketball/nba',
    dbSport: 'nba',
    seasonStart: (y) => new Date(y, 9, 1),    // Oct 1
    seasonEnd: (y) => new Date(y + 1, 5, 30), // Jun 30
    limit: 50,
  },
  nhl: {
    espnPath: 'hockey/nhl',
    dbSport: 'nhl',
    seasonStart: (y) => new Date(y, 9, 1),    // Oct 1
    seasonEnd: (y) => new Date(y + 1, 5, 30), // Jun 30
    limit: 50,
  },
  mlb: {
    espnPath: 'baseball/mlb',
    dbSport: 'mlb',
    seasonStart: (y) => new Date(y, 2, 15),   // Mar 15
    seasonEnd: (y) => new Date(y, 10, 15),     // Nov 15
    limit: 50,
  },
  ncaaf: {
    espnPath: 'football/college-football',
    dbSport: 'ncaaf',
    seasonStart: (y) => new Date(y, 7, 15),   // Aug 15
    seasonEnd: (y) => new Date(y + 1, 0, 25), // Jan 25
    limit: 200, // College has many games per day
  },
  ncaab: {
    espnPath: 'basketball/mens-college-basketball',
    dbSport: 'ncaab',
    seasonStart: (y) => new Date(y, 10, 1),   // Nov 1
    seasonEnd: (y) => new Date(y + 1, 3, 15), // Apr 15
    limit: 200,
  },
}

function formatDate(d: Date): string {
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`
}

function parseGame(game: any, sport: string, season: number, includeFuture: boolean) {
  const comp = game.competitions?.[0]
  if (!comp) return null

  const home = comp.competitors?.find((c: any) => c.homeAway === 'home')
  const away = comp.competitors?.find((c: any) => c.homeAway === 'away')
  if (!home || !away) return null

  const isCompleted = game.status?.type?.completed === true
  const state = game.status?.type?.state // 'pre', 'in', 'post'
  
  // For historical: only completed games. For future: only scheduled (pre) games.
  if (!includeFuture && !isCompleted) return null
  if (includeFuture && !isCompleted && state !== 'pre') return null

  const homeScore = isCompleted ? parseInt(home.score || '0') : null
  const awayScore = isCompleted ? parseInt(away.score || '0') : null
  const odds = comp.odds?.[0]
  const spread = odds?.spread ?? null
  const total = odds?.overUnder ?? null

  let spreadResult = null
  let totalResult = null
  if (isCompleted && homeScore !== null && awayScore !== null) {
    if (spread !== null) {
      const adj = homeScore + spread
      if (adj > awayScore) spreadResult = 'home_cover'
      else if (adj < awayScore) spreadResult = 'away_cover'
      else spreadResult = 'push'
    }
    if (total !== null) {
      const pts = homeScore + awayScore
      if (pts > total) totalResult = 'over'
      else if (pts < total) totalResult = 'under'
      else totalResult = 'push'
    }
  }

  const seasonTypeId = game.season?.type
  let seasonType = 'regular'
  if (seasonTypeId === 3) seasonType = 'postseason'
  else if (seasonTypeId === 4) seasonType = 'offseason'
  else if (game.status?.type?.name?.toLowerCase().includes('post')) seasonType = 'postseason'

  // For future games, mark as 'scheduled'
  if (!isCompleted) seasonType = 'scheduled'

  return {
    espn_game_id: game.id,
    sport,
    season,
    season_type: seasonType,
    season_year: season,
    game_date: game.date?.split('T')[0] || null,
    home_team_id: home.team?.id || '',
    home_team_name: home.team?.displayName || '',
    home_team_abbr: home.team?.abbreviation || '',
    home_team: home.team?.displayName || '',
    home_team_abbrev: home.team?.abbreviation || '',
    away_team_id: away.team?.id || '',
    away_team_name: away.team?.displayName || '',
    away_team_abbr: away.team?.abbreviation || '',
    away_team: away.team?.displayName || '',
    away_team_abbrev: away.team?.abbreviation || '',
    home_score: homeScore ?? 0,
    away_score: awayScore ?? 0,
    venue: comp.venue?.fullName ?? null,
    attendance: comp.attendance ?? null,
    total_points: (homeScore ?? 0) + (awayScore ?? 0),
    point_spread: spread,
    over_under: total,
    spread_result: spreadResult,
    total_result: totalResult,
    is_neutral_site: comp.neutralSite ?? false,
    primetime_game: false,
    divisional_game: false,
  }
}

async function fetchDay(espnPath: string, date: string, limit: number): Promise<any[]> {
  try {
    const url = `${ESPN_BASE}/${espnPath}/scoreboard?dates=${date}&limit=${limit}`
    const res = await fetch(url)
    if (!res.ok) {
      if (res.status === 404) return [] // No data for this date
      console.error(`  HTTP ${res.status} for ${date}`)
      return []
    }
    const data = await res.json()
    return data.events || []
  } catch (err: any) {
    console.error(`  Error fetching ${date}: ${err.message}`)
    return []
  }
}

async function importSeason(
  sportKey: string, 
  season: number, 
  includeFuture: boolean
): Promise<{ completed: number; scheduled: number }> {
  const config = SPORT_CONFIG[sportKey]
  const { start, end } = { start: config.seasonStart(season), end: config.seasonEnd(season) }
  
  // For future games, extend to end of season even if in the future
  // For historical, cap at today
  const now = new Date()
  const effectiveEnd = includeFuture ? end : (end > now ? now : end)
  
  const records: any[] = []
  const current = new Date(start)
  let dayCount = 0
  
  while (current <= effectiveEnd) {
    const dateStr = formatDate(current)
    const events = await fetchDay(config.espnPath, dateStr, config.limit)
    
    for (const game of events) {
      const record = parseGame(game, config.dbSport, season, includeFuture)
      if (record) records.push(record)
    }
    
    current.setDate(current.getDate() + 1)
    dayCount++
    
    // Rate limit: 80ms between requests for college (many more requests)
    await new Promise(r => setTimeout(r, 80))
    
    // Progress indicator every 30 days
    if (dayCount % 30 === 0) {
      process.stdout.write('.')
    }
  }

  // Deduplicate by espn_game_id (same game can appear on consecutive dates)
  const deduped = new Map<string, any>()
  for (const r of records) {
    deduped.set(r.espn_game_id, r) // last occurrence wins
  }
  const uniqueRecords = Array.from(deduped.values())

  // Upsert in batches
  let completed = 0
  let scheduled = 0
  const batchSize = 100
  for (let i = 0; i < uniqueRecords.length; i += batchSize) {
    const batch = uniqueRecords.slice(i, i + batchSize)
    const { error } = await sb
      .from('historical_games')
      .upsert(batch, { onConflict: 'espn_game_id' })
    
    if (error) {
      console.error(`  Batch error for ${sportKey} ${season}:`, error.message)
    } else {
      for (const r of batch) {
        if (r.season_type === 'scheduled') scheduled++
        else completed++
      }
    }
  }

  return { completed, scheduled }
}

async function main() {
  const sportArg = process.argv[2]?.toLowerCase()
  const startYear = parseInt(process.argv[3] || '2020')
  const endYear = parseInt(process.argv[4] || '2025')
  const includeFuture = process.argv.includes('--future')

  if (!sportArg || !['nfl', 'nba', 'nhl', 'mlb', 'ncaaf', 'ncaab', 'all'].includes(sportArg)) {
    console.log('Usage: npx tsx scripts/import-espn-games.ts <sport> <startYear> <endYear> [--future]')
    console.log('Sports: nfl, nba, nhl, mlb, ncaaf, ncaab, all')
    process.exit(1)
  }

  const sports = sportArg === 'all' ? Object.keys(SPORT_CONFIG) : [sportArg]

  for (const sportKey of sports) {
    console.log(`\n${'='.repeat(60)}`)
    console.log(`${sportKey.toUpperCase()} — Seasons ${startYear} to ${endYear}${includeFuture ? ' (+ future games)' : ''}`)
    console.log('='.repeat(60))

    // Check current counts
    for (let year = startYear; year <= endYear; year++) {
      const { count } = await sb.from('historical_games')
        .select('*', { count: 'exact', head: true })
        .eq('sport', SPORT_CONFIG[sportKey].dbSport).eq('season', year)
      process.stdout.write(`  ${year}: ${count || 0} existing`)

      // Import
      const result = await importSeason(sportKey, year, includeFuture)
      console.log(` → +${result.completed} completed, +${result.scheduled} scheduled`)

      // Brief pause between seasons
      await new Promise(r => setTimeout(r, 300))
    }

    // Final count
    const { count: finalTotal } = await sb.from('historical_games')
      .select('*', { count: 'exact', head: true })
      .eq('sport', SPORT_CONFIG[sportKey].dbSport)
    console.log(`\n  ${sportKey.toUpperCase()} total: ${finalTotal} games`)
  }

  console.log('\nDone!')
}

main().catch(console.error)
