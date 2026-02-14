import { createClient } from '@supabase/supabase-js'
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

async function check() {
  // Check all postseason games
  const { data: post } = await sb.from('historical_games')
    .select('game_date, home_team_abbr, away_team_abbr, home_score, away_score, season_type, point_spread')
    .eq('sport', 'nfl')
    .eq('season', 2025)
    .in('season_type', ['post', 'postseason', 'playoffs', 'Post Season'])
    .order('game_date', { ascending: false })
    .limit(30)
  console.log('NFL 2025 postseason games:', post?.length)
  post?.forEach(g => console.log(`  ${g.game_date} ${g.away_team_abbr} @ ${g.home_team_abbr} ${g.away_score}-${g.home_score} [${g.season_type}] spread: ${g.point_spread}`))

  // Count season_types
  const { data: allGames } = await sb.from('historical_games')
    .select('season_type')
    .eq('sport', 'nfl')
    .eq('season', 2025)
    .limit(5000)
  const uniqueTypes = [...new Set(allGames?.map(t => t.season_type))]
  console.log('\nSeason types for NFL 2025:', uniqueTypes)

  for (const t of uniqueTypes) {
    const { count } = await sb.from('historical_games')
      .select('*', { count: 'exact', head: true })
      .eq('sport', 'nfl')
      .eq('season', 2025)
      .eq('season_type', t)
    console.log(`  ${t}: ${count} games`)
  }

  // Check latest game date in entire NFL 2025
  const { data: latest } = await sb.from('historical_games')
    .select('game_date, home_team_abbr, away_team_abbr, home_score, away_score, season_type')
    .eq('sport', 'nfl')
    .eq('season', 2025)
    .order('game_date', { ascending: false })
    .limit(5)
  console.log('\nLatest NFL 2025 games:')
  latest?.forEach(g => console.log(`  ${g.game_date} ${g.away_team_abbr} @ ${g.home_team_abbr} ${g.away_score}-${g.home_score} [${g.season_type}]`))

  // game_odds 2025 NFL 
  const { count: odds2025 } = await sb.from('game_odds')
    .select('*', { count: 'exact', head: true })
    .eq('sport', 'nfl')
    .eq('season', 2025)
  console.log('\nNFL game_odds for season 2025:', odds2025)

  // Verify the API returns the right data for current season
  console.log('\nNFL game_odds seasons:')
  const { data: oddsSzns } = await sb.from('game_odds')
    .select('season')
    .eq('sport', 'nfl')
    .limit(5000)
  const oddSeasons = [...new Set(oddsSzns?.map(o => o.season))].sort()
  console.log('  ', oddSeasons)
}
check()
