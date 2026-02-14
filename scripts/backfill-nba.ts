/**
 * Backfill incomplete NBA historical_games from ESPN API.
 * Runs locally, fetching day-by-day scoreboard data.
 * 
 * Usage: npx tsx scripts/backfill-nba.ts [startYear] [endYear]
 * Default: all seasons 2000-2025
 */
import { createClient } from '@supabase/supabase-js'

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string
)

const ESPN_BASE = 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard'

function formatDate(d: Date): string {
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`
}

function getSeasonDates(season: number): { start: Date; end: Date } {
  return {
    start: new Date(season, 9, 1),   // October 1
    end: new Date(season + 1, 5, 30), // June 30
  }
}

function parseGame(game: any, season: number) {
  const comp = game.competitions?.[0]
  if (!comp) return null

  const home = comp.competitors?.find((c: any) => c.homeAway === 'home')
  const away = comp.competitors?.find((c: any) => c.homeAway === 'away')
  if (!home || !away) return null

  const homeScore = parseInt(home.score || '0')
  const awayScore = parseInt(away.score || '0')
  const odds = comp.odds?.[0]
  const spread = odds?.spread ?? null
  const total = odds?.overUnder ?? null

  let spreadResult = null
  if (spread !== null) {
    const adj = homeScore + spread
    if (adj > awayScore) spreadResult = 'home_cover'
    else if (adj < awayScore) spreadResult = 'away_cover'
    else spreadResult = 'push'
  }

  let totalResult = null
  if (total !== null) {
    const pts = homeScore + awayScore
    if (pts > total) totalResult = 'over'
    else if (pts < total) totalResult = 'under'
    else totalResult = 'push'
  }

  const isPost = game.season?.type === 3 || game.status?.type?.name?.toLowerCase().includes('post')
  const seasonType = isPost ? 'postseason' : 'regular'

  return {
    espn_game_id: game.id,
    sport: 'nba',
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
    home_score: homeScore,
    away_score: awayScore,
    venue: comp.venue?.fullName ?? null,
    attendance: comp.attendance ?? null,
    total_points: homeScore + awayScore,
    point_spread: spread,
    over_under: total,
    spread_result: spreadResult,
    total_result: totalResult,
    is_neutral_site: comp.neutralSite ?? false,
    primetime_game: false,
    divisional_game: false,
  }
}

async function fetchDay(date: string): Promise<any[]> {
  try {
    const res = await fetch(`${ESPN_BASE}?dates=${date}`)
    if (!res.ok) return []
    const data = await res.json()
    return data.events || []
  } catch {
    return []
  }
}

async function importSeason(season: number): Promise<number> {
  const { start, end } = getSeasonDates(season)
  const now = new Date()
  const effectiveEnd = end > now ? now : end
  
  const records: any[] = []
  const current = new Date(start)
  let dayCount = 0
  
  while (current <= effectiveEnd) {
    const dateStr = formatDate(current)
    const events = await fetchDay(dateStr)
    
    for (const game of events) {
      if (game.status?.type?.completed) {
        const record = parseGame(game, season)
        if (record) records.push(record)
      }
    }
    
    current.setDate(current.getDate() + 1)
    dayCount++
    
    // Rate limit: 100ms between requests  
    await new Promise(r => setTimeout(r, 100))
    
    // Progress indicator every 30 days
    if (dayCount % 30 === 0) {
      process.stdout.write('.')
    }
  }

  // Upsert in batches
  let imported = 0
  const batchSize = 100
  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize)
    const { error } = await sb
      .from('historical_games')
      .upsert(batch, { onConflict: 'espn_game_id' })
    
    if (error) {
      console.error(`  Batch error for season ${season}:`, error.message)
    } else {
      imported += batch.length
    }
  }

  return imported
}

async function main() {
  const startYear = parseInt(process.argv[2] || '2000')
  const endYear = parseInt(process.argv[3] || '2025')

  console.log(`NBA Historical Backfill: seasons ${startYear} to ${endYear}\n`)

  // First, check current counts
  console.log('Current NBA game counts:')
  const incomplete: number[] = []
  
  for (let year = startYear; year <= endYear; year++) {
    const { count } = await sb.from('historical_games')
      .select('*', { count: 'exact', head: true })
      .eq('sport', 'nba').eq('season', year)
    
    // Full NBA season: ~1230 regular + ~100 playoff = ~1330
    // Consider incomplete if < 1000 (some early/shortened seasons are exceptions)
    const status = (count || 0) < 1000 ? '← INCOMPLETE' : '✓'
    console.log(`  ${year}: ${count || 0} games ${status}`)
    
    if ((count || 0) < 1000) {
      incomplete.push(year)
    }
  }

  if (incomplete.length === 0) {
    console.log('\nAll seasons appear complete!')
    return
  }

  console.log(`\nBackfilling ${incomplete.length} incomplete seasons: ${incomplete.join(', ')}`)
  console.log('This will take ~30 seconds per season...\n')

  let totalImported = 0
  for (const year of incomplete) {
    process.stdout.write(`  ${year}: `)
    const count = await importSeason(year)
    totalImported += count
    console.log(` ${count} games imported/updated`)
    
    // Brief pause between seasons
    await new Promise(r => setTimeout(r, 500))
  }

  console.log(`\nDone! Total: ${totalImported} games imported/updated`)

  // Verify final counts
  console.log('\nFinal NBA game counts:')
  for (let year = startYear; year <= endYear; year++) {
    const { count } = await sb.from('historical_games')
      .select('*', { count: 'exact', head: true })
      .eq('sport', 'nba').eq('season', year)
    console.log(`  ${year}: ${count || 0} games`)
  }
}

main().catch(console.error)
