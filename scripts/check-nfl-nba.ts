import { createClient } from '@supabase/supabase-js'
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

async function check() {
  // 1. All NFL 2025 games from Jan 25 onwards (playoffs/super bowl)
  console.log('=== ALL NFL GAMES AFTER JAN 20, 2026 ===')
  const { data: late } = await sb.from('historical_games')
    .select('id, game_date, home_team, away_team, home_team_abbr, away_team_abbr, home_score, away_score, season_type, point_spread, season')
    .eq('sport', 'nfl')
    .gte('game_date', '2026-01-20')
    .order('game_date', { ascending: true })
    .limit(50)
  console.log(`Found ${late?.length} games after Jan 20, 2026:`)
  late?.forEach(g => console.log(`  ${g.game_date} | ${g.away_team_abbr} @ ${g.home_team_abbr} | ${g.away_score}-${g.home_score} | type: ${g.season_type} | spread: ${g.point_spread} | id: ${g.id}`))

  // 2. Specifically look for Feb 8 or near it
  console.log('\n=== GAMES ON FEB 7-9 2026 ===')
  const { data: sb_games } = await sb.from('historical_games')
    .select('*')
    .eq('sport', 'nfl')
    .gte('game_date', '2026-02-07')
    .lte('game_date', '2026-02-09')
    .limit(10)
  console.log(`Found ${sb_games?.length} games:`)
  sb_games?.forEach(g => console.log(`  ${g.game_date} | ${g.away_team} @ ${g.home_team} | ${g.away_score}-${g.home_score} | type: ${g.season_type}`))

  // 3. Look for SEA or NE in any late January / February games
  console.log('\n=== SEA GAMES AFTER JAN 1 2026 ===')
  const { data: sea } = await sb.from('historical_games')
    .select('game_date, home_team_abbr, away_team_abbr, home_score, away_score, season_type')
    .eq('sport', 'nfl')
    .gte('game_date', '2026-01-01')
    .or('home_team_abbr.eq.SEA,away_team_abbr.eq.SEA')
    .order('game_date', { ascending: true })
    .limit(10)
  console.log(`SEA games:`)
  sea?.forEach(g => console.log(`  ${g.game_date} ${g.away_team_abbr} @ ${g.home_team_abbr} ${g.away_score}-${g.home_score} [${g.season_type}]`))

  console.log('\n=== NE GAMES AFTER JAN 1 2026 ===')
  const { data: ne } = await sb.from('historical_games')
    .select('game_date, home_team_abbr, away_team_abbr, home_score, away_score, season_type')
    .eq('sport', 'nfl')
    .gte('game_date', '2026-01-01')
    .or('home_team_abbr.eq.NE,away_team_abbr.eq.NE')
    .order('game_date', { ascending: true })
    .limit(10)
  console.log(`NE games:`)
  ne?.forEach(g => console.log(`  ${g.game_date} ${g.away_team_abbr} @ ${g.home_team_abbr} ${g.away_score}-${g.home_score} [${g.season_type}]`))

  // 4. Check ALL unique season_types in historical_games NFL 2025
  console.log('\n=== ALL DISTINCT season_type values NFL 2025 ===')
  const { data: allTypes } = await sb.from('historical_games')
    .select('season_type')
    .eq('sport', 'nfl')
    .eq('season', 2025)
    .limit(5000)
  const types = [...new Set(allTypes?.map(g => g.season_type))]
  console.log('Types:', types)

  // 5. Check NBA data status
  console.log('\n=== NBA STATUS ===')
  const { count: nbaTotal } = await sb.from('historical_games')
    .select('*', { count: 'exact', head: true })
    .eq('sport', 'nba')
  console.log('Total NBA games:', nbaTotal)

  // Get NBA seasons
  const { data: nbaSzns } = await sb.from('historical_games')
    .select('season')
    .eq('sport', 'nba')
    .limit(5000)
  const nbaSeasons = [...new Set(nbaSzns?.map(g => g.season))].sort()
  console.log('NBA seasons:', nbaSeasons)

  // NBA 2025 specifically
  const { count: nba2025 } = await sb.from('historical_games')
    .select('*', { count: 'exact', head: true })
    .eq('sport', 'nba')
    .eq('season', 2025)
  console.log('NBA 2025 games:', nba2025)

  // Latest NBA game
  const { data: latestNba } = await sb.from('historical_games')
    .select('game_date, season')
    .eq('sport', 'nba')
    .order('game_date', { ascending: false })
    .limit(3)
  console.log('Latest NBA games:', latestNba)

  // NBA game_odds
  const { data: nbaOddsSzns } = await sb.from('game_odds')
    .select('season')
    .eq('sport', 'nba')
    .limit(5000)
  const nbaOddSeasons = [...new Set(nbaOddsSzns?.map(o => o.season))].sort()
  console.log('NBA game_odds seasons:', nbaOddSeasons)

  // Check what NBA needs
  console.log('\n=== NBA MISSING SPREADS CHECK ===')
  const { count: nbaMissingSpreads } = await sb.from('historical_games')
    .select('*', { count: 'exact', head: true })
    .eq('sport', 'nba')
    .is('point_spread', null)
  console.log('NBA games missing spread:', nbaMissingSpreads, 'out of', nbaTotal)
}

check().catch(console.error)
