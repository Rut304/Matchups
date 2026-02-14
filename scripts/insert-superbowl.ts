import { createClient } from '@supabase/supabase-js'
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

async function go() {
  // Get odds from ESPN for Super Bowl LX
  const resp = await fetch('https://site.api.espn.com/apis/site/v2/sports/football/nfl/summary?event=401772988')
  const data = await resp.json()
  const pc = data.pickcenter?.[0]
  const spread = pc?.spread ?? null
  const total = pc?.overUnder ?? null
  console.log('ESPN pickcenter odds:', { spread, total })

  // SEA (home) 29, NE (away) 13
  const homeScore = 29
  const awayScore = 13
  const margin = homeScore - awayScore // +16

  let spreadResult: string | null = null
  if (spread != null) {
    if (margin + spread > 0) spreadResult = 'home_cover'
    else if (margin + spread < 0) spreadResult = 'away_cover'
    else spreadResult = 'push'
  }

  let totalResult: string | null = null
  if (total != null) {
    const totalPoints = homeScore + awayScore // 42
    if (totalPoints > total) totalResult = 'over'
    else if (totalPoints < total) totalResult = 'under'
    else totalResult = 'push'
  }
  console.log('Computed results:', { spreadResult, totalResult, margin })

  const { error } = await sb.from('historical_games').insert({
    espn_game_id: '401772988',
    sport: 'nfl',
    season: 2025,
    season_type: 'postseason',
    season_year: 2025,
    week: 5,
    week_number: 5,
    game_date: '2026-02-08',
    home_team: 'Seattle Seahawks',
    away_team: 'New England Patriots',
    home_team_id: '26',
    away_team_id: '17',
    home_team_name: 'Seattle Seahawks',
    away_team_name: 'New England Patriots',
    home_team_abbr: 'SEA',
    away_team_abbr: 'NE',
    home_team_abbrev: 'SEA',
    away_team_abbrev: 'NE',
    home_score: 29,
    away_score: 13,
    total_points: 42,
    point_spread: spread,
    over_under: total,
    spread_result: spreadResult,
    total_result: totalResult,
    venue: 'Levi\'s Stadium',
    is_neutral_site: true,
    primetime_game: true,
    divisional_game: false
  })

  if (error) {
    console.error('Insert error:', error)
  } else {
    console.log('Super Bowl LX inserted successfully: SEA 29 - NE 13')
  }

  // Verify
  const { data: verify } = await sb.from('historical_games')
    .select('game_date, away_team_abbr, home_team_abbr, away_score, home_score, season_type, point_spread, over_under, spread_result, total_result, espn_game_id')
    .eq('espn_game_id', '401772988')
  console.log('Verified:', verify)
}

go().catch(console.error)
