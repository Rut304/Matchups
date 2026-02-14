import { createClient } from '@supabase/supabase-js'

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function main() {
  // Sample recent NFL games
  const { data: sample } = await sb
    .from('historical_games')
    .select('home_team_abbr, away_team_abbr, home_team_name, away_team_name, point_spread, spread_result, total_result, game_date, season, home_score, away_score')
    .eq('sport', 'nfl')
    .order('game_date', { ascending: false })
    .limit(5)
  
  console.log('=== Recent NFL games ===')
  console.log(JSON.stringify(sample, null, 2))

  // Check distinct seasons
  const { data: seasons } = await sb
    .from('historical_games')
    .select('season')
    .eq('sport', 'nfl')
  const uniqueSeasons = [...new Set((seasons || []).map((s: any) => s.season))].sort()
  console.log('\nNFL seasons in historical_games:', uniqueSeasons)

  // Count per season
  for (const s of [2024, 2025]) {
    const { count } = await sb
      .from('historical_games')
      .select('*', { count: 'exact', head: true })
      .eq('sport', 'nfl')
      .eq('season', s)
    console.log(`NFL games season=${s}: ${count}`)
  }

  // Check PHI specifically - season 2025
  const { data: phiGames } = await sb
    .from('historical_games')
    .select('home_team_abbr, away_team_abbr, point_spread, spread_result, game_date')
    .eq('sport', 'nfl')
    .eq('season', 2025)
    .or('home_team_abbr.eq.PHI,away_team_abbr.eq.PHI')
    .order('game_date', { ascending: false })
    .limit(10)
  
  console.log('\n=== PHI games (season 2025) ===')
  console.log(`Count: ${phiGames?.length}`)
  if (phiGames) {
    for (const g of phiGames) {
      const isHome = g.home_team_abbr === 'PHI'
      console.log(`${g.game_date} | ${isHome ? 'HOME' : 'AWAY'} | spread: ${g.point_spread} | result: ${g.spread_result}`)
    }
  }

  // Check what the season auto-detection would give us
  const now = new Date()
  const year = now.getFullYear()
  const autoSeason = now.getMonth() < 6 ? year - 1 : year
  console.log(`\nAuto-detected season: ${autoSeason} (month: ${now.getMonth()}, year: ${year})`)

  // Check BUF game count in season 2025 (API shows 44 total which is too many)
  const { data: bufGames, count: bufCount } = await sb
    .from('historical_games')
    .select('game_date, home_team_abbr, away_team_abbr, home_team_name, away_team_name, point_spread, spread_result', { count: 'exact' })
    .eq('sport', 'nfl')
    .eq('season', 2025)
    .or('home_team_abbr.eq.BUF,away_team_abbr.eq.BUF')
    .order('game_date', { ascending: false })

  console.log(`\n=== BUF games season 2025 count: ${bufCount} ===`)
  if (bufGames) {
    for (const g of bufGames) {
      const isHome = g.home_team_abbr === 'BUF'
      console.log(`${g.game_date} | ${isHome ? 'HOME' : 'AWAY'} | ${g.home_team_name} vs ${g.away_team_name} | spread: ${g.point_spread} | result: ${g.spread_result}`)
    }
  }
  
  // Check total game count and uniqueness
  const { count: totalNFL } = await sb
    .from('historical_games')
    .select('*', { count: 'exact', head: true })
    .eq('sport', 'nfl')
    .eq('season', 2025)
  console.log(`\nTotal NFL games season 2025: ${totalNFL}`)
  
  // Check for duplicates: group by game_date + home_team
  const { data: allNFL } = await sb
    .from('historical_games')
    .select('game_date, home_team_abbr, away_team_abbr')
    .eq('sport', 'nfl')
    .eq('season', 2025)
    .order('game_date', { ascending: false })
    .limit(1000)
  
  if (allNFL) {
    const seen = new Map<string, number>()
    for (const g of allNFL) {
      const key = `${g.game_date}|${g.home_team_abbr}|${g.away_team_abbr}`
      seen.set(key, (seen.get(key) || 0) + 1)
    }
    const dupes = [...seen.entries()].filter(([, count]) => count > 1)
    console.log(`\nDuplicate games found: ${dupes.length}`)
    for (const [key, count] of dupes.slice(0, 10)) {
      console.log(`  ${key}: ${count}x`)
    }
  }

  // Test the last10ATS logic directly for PHI
  const { data: phiAllGames } = await sb
    .from('historical_games')
    .select('game_date, home_team_abbr, away_team_abbr, point_spread, spread_result, total_result, home_score, away_score')
    .eq('sport', 'nfl')
    .eq('season', 2025)
    .or('home_team_abbr.eq.PHI,away_team_abbr.eq.PHI')
    .order('game_date', { ascending: false })

  console.log(`\n=== PHI last10 ATS trace (total games: ${phiAllGames?.length}) ===`)
  if (phiAllGames) {
    const recent10 = phiAllGames.slice(0, 10)
    const last10ATS = { wins: 0, losses: 0, pushes: 0 }
    for (const g of recent10) {
      const isHome = g.home_team_abbr?.toUpperCase() === 'PHI'
      if (isHome) {
        if (g.spread_result === 'home_cover') last10ATS.wins++
        else if (g.spread_result === 'away_cover') last10ATS.losses++
        else if (g.spread_result === 'push') last10ATS.pushes++
      } else {
        if (g.spread_result === 'away_cover') last10ATS.wins++
        else if (g.spread_result === 'home_cover') last10ATS.losses++
        else if (g.spread_result === 'push') last10ATS.pushes++
      }
      console.log(`  ${g.game_date} | ${isHome ? 'HOME' : 'AWAY'} | spread: ${g.point_spread} | result: ${g.spread_result} | running: ${JSON.stringify(last10ATS)}`)
    }
    console.log(`\nFinal last10ATS: ${JSON.stringify(last10ATS)}`)
  }
}

main().catch(console.error)
