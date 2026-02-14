import { createClient } from '@supabase/supabase-js'

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function check() {
  // Check season values for BUF games
  const { data, error } = await sb.from('historical_games')
    .select('season, game_date, home_team_abbr, away_team_abbr, point_spread, spread_result')
    .eq('sport', 'nfl')
    .eq('season', 2025)
    .or('home_team_abbr.eq.BUF,away_team_abbr.eq.BUF')
    .order('game_date', { ascending: true })
    .limit(100)
  
  console.log('BUF games with season=2025:', data?.length)
  if (data) {
    for (const g of data) {
      console.log(g.game_date, g.home_team_abbr, 'vs', g.away_team_abbr, 'spread:', g.point_spread, 'result:', g.spread_result)
    }
  }

  // Also check: what distinct seasons exist for NFL?
  const { data: seasons } = await sb.from('historical_games')
    .select('season')
    .eq('sport', 'nfl')
    .order('season', { ascending: true })
    .limit(5000)
  
  const uniqueSeasons = [...new Set(seasons?.map(s => s.season))]
  console.log('\nAll NFL seasons in DB:', uniqueSeasons)
  
  // Count games per season
  for (const s of uniqueSeasons.slice(-5)) {
    const { count } = await sb.from('historical_games')
      .select('*', { count: 'exact', head: true })
      .eq('sport', 'nfl')
      .eq('season', s)
    console.log(`Season ${s}: ${count} games`)
  }
}

check()
