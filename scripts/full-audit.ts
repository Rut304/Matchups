/**
 * Full data audit: historical games, odds, seasons per sport
 */
import { createClient } from '@supabase/supabase-js'

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function audit() {
  const sports = ['nfl', 'nba', 'mlb', 'nhl', 'ncaaf', 'ncaab']

  console.log('=== HISTORICAL GAMES AUDIT ===\n')
  for (const sport of sports) {
    // Total count
    const { count: totalCount } = await sb.from('historical_games')
      .select('*', { count: 'exact', head: true })
      .eq('sport', sport)

    // Get distinct seasons
    let allGames: any[] = []
    let offset = 0
    while (true) {
      const { data } = await sb.from('historical_games')
        .select('season, game_date, home_team_abbr, away_team_abbr, point_spread, spread_result, total_result, home_score, away_score')
        .eq('sport', sport)
        .order('season', { ascending: true })
        .range(offset, offset + 999)
      if (!data || data.length === 0) break
      allGames = allGames.concat(data)
      if (data.length < 1000) break
      offset += 1000
    }

    const seasons = [...new Set(allGames.map(g => g.season))].sort((a, b) => a - b)
    const withSpread = allGames.filter(g => g.point_spread !== null).length
    const withResult = allGames.filter(g => g.spread_result !== null).length
    const withScores = allGames.filter(g => g.home_score !== null).length
    const withTotalResult = allGames.filter(g => g.total_result !== null).length

    console.log(`${sport.toUpperCase()}:`)
    console.log(`  Total games: ${totalCount}`)
    console.log(`  Seasons: ${seasons.length} (${seasons[0]} - ${seasons[seasons.length - 1]})`)
    console.log(`  With point_spread: ${withSpread} (${(withSpread / allGames.length * 100).toFixed(1)}%)`)
    console.log(`  With spread_result: ${withResult} (${(withResult / allGames.length * 100).toFixed(1)}%)`)
    console.log(`  With total_result: ${withTotalResult} (${(withTotalResult / allGames.length * 100).toFixed(1)}%)`)
    console.log(`  With scores: ${withScores} (${(withScores / allGames.length * 100).toFixed(1)}%)`)

    // Show games per season for last 5 seasons
    const recentSeasons = seasons.slice(-5)
    for (const s of recentSeasons) {
      const seasonGames = allGames.filter(g => g.season === s)
      console.log(`    Season ${s}: ${seasonGames.length} games`)
    }
    console.log()
  }

  console.log('\n=== GAME_ODDS AUDIT ===\n')
  for (const sport of sports) {
    const { count: oddsCount } = await sb.from('game_odds')
      .select('*', { count: 'exact', head: true })
      .eq('sport', sport)

    let allOdds: any[] = []
    let offset = 0
    while (true) {
      const { data } = await sb.from('game_odds')
        .select('season, game_date, home_team, away_team, consensus_spread, consensus_total')
        .eq('sport', sport)
        .order('season', { ascending: true })
        .range(offset, offset + 999)
      if (!data || data.length === 0) break
      allOdds = allOdds.concat(data)
      if (data.length < 1000) break
      offset += 1000
    }

    const oddSeasons = [...new Set(allOdds.map(o => o.season))].sort((a, b) => a - b)
    const withConsSpread = allOdds.filter(o => o.consensus_spread !== null).length
    const withConsTotal = allOdds.filter(o => o.consensus_total !== null).length

    console.log(`${sport.toUpperCase()}:`)
    console.log(`  Total odds records: ${oddsCount}`)
    if (oddSeasons.length > 0) {
      console.log(`  Seasons: ${oddSeasons.length} (${oddSeasons[0]} - ${oddSeasons[oddSeasons.length - 1]})`)
    } else {
      console.log(`  Seasons: 0`)
    }
    console.log(`  With consensus_spread: ${withConsSpread} (${allOdds.length > 0 ? (withConsSpread / allOdds.length * 100).toFixed(1) : 0}%)`)
    console.log(`  With consensus_total: ${withConsTotal} (${allOdds.length > 0 ? (withConsTotal / allOdds.length * 100).toFixed(1) : 0}%)`)
    console.log()
  }

  // Check NFL 2025 Super Bowl
  console.log('\n=== NFL 2025 SUPER BOWL CHECK ===\n')
  const { data: sbGames } = await sb.from('historical_games')
    .select('*')
    .eq('sport', 'nfl')
    .eq('season', 2025)
    .eq('season_type', 'post')
    .order('game_date', { ascending: false })
    .limit(10)
  
  if (sbGames && sbGames.length > 0) {
    console.log(`Playoff games found: ${sbGames.length}`)
    sbGames.forEach(g => console.log(`  ${g.game_date} ${g.away_team_name} @ ${g.home_team_name} | ${g.away_score}-${g.home_score} | spread: ${g.point_spread}`))
  } else {
    console.log('No playoff games found with season_type=post')
  }

  // Check for Seahawks and Patriots in Super Bowl area (late Jan / early Feb)
  const { data: sbCheck } = await sb.from('historical_games')
    .select('*')
    .eq('sport', 'nfl')
    .eq('season', 2025)
    .or('home_team_abbr.eq.SEA,away_team_abbr.eq.SEA')
    .order('game_date', { ascending: false })
    .limit(5)

  console.log('\nSEA most recent games (season 2025):')
  sbCheck?.forEach(g => console.log(`  ${g.game_date} ${g.away_team_abbr} @ ${g.home_team_abbr} | ${g.away_score}-${g.home_score} | type: ${g.season_type}`))

  const { data: neCheck } = await sb.from('historical_games')
    .select('*')
    .eq('sport', 'nfl')
    .eq('season', 2025)
    .or('home_team_abbr.eq.NE,away_team_abbr.eq.NE')
    .order('game_date', { ascending: false })
    .limit(5)

  console.log('\nNE most recent games (season 2025):')
  neCheck?.forEach(g => console.log(`  ${g.game_date} ${g.away_team_abbr} @ ${g.home_team_abbr} | ${g.away_score}-${g.home_score} | type: ${g.season_type}`))

  // Check line_snapshots
  console.log('\n\n=== LINE_SNAPSHOTS AUDIT ===\n')
  const { count: snapCount } = await sb.from('line_snapshots')
    .select('*', { count: 'exact', head: true })
  console.log(`Total snapshots: ${snapCount}`)
  
  const { data: snapSample } = await sb.from('line_snapshots')
    .select('sport, sportsbook')
    .limit(1000)
  if (snapSample) {
    const snapSports = [...new Set(snapSample.map(s => s.sport))]
    const snapBooks = [...new Set(snapSample.map(s => s.sportsbook))]
    console.log(`Sports: ${snapSports.join(', ')}`)
    console.log(`Sportsbooks: ${snapBooks.join(', ')}`)
  }

  // Check odds table
  console.log('\n\n=== ODDS TABLE AUDIT ===\n')
  const { count: oddsTableCount } = await sb.from('odds')
    .select('*', { count: 'exact', head: true })
  console.log(`Total odds records: ${oddsTableCount}`)

  // Check game_odds sample for NFL to see team name format
  console.log('\n\n=== GAME_ODDS TEAM NAME FORMAT (NFL sample) ===\n')
  const { data: oddsSample } = await sb.from('game_odds')
    .select('home_team, away_team, game_date, consensus_spread, consensus_total')
    .eq('sport', 'nfl')
    .eq('season', 2025)
    .order('game_date', { ascending: false })
    .limit(10)
  oddsSample?.forEach(o => console.log(`  ${o.game_date} ${o.away_team} @ ${o.home_team} | spread: ${o.consensus_spread} | total: ${o.consensus_total}`))

  // Check picks table
  console.log('\n\n=== PICKS TABLE ===\n')
  const { count: picksCount } = await sb.from('picks')
    .select('*', { count: 'exact', head: true })
  console.log(`Total picks: ${picksCount}`)

  // Check cappers table
  console.log('\n\n=== CAPPERS TABLE ===\n')
  const { count: cappersCount } = await sb.from('cappers')
    .select('*', { count: 'exact', head: true })
  console.log(`Total cappers: ${cappersCount}`)

  // Check trends table  
  console.log('\n\n=== TRENDS TABLE ===\n')
  const { count: trendsCount } = await sb.from('betting_trends')
    .select('*', { count: 'exact', head: true })
  console.log(`Total trends: ${trendsCount}`)
}

audit().catch(console.error)
