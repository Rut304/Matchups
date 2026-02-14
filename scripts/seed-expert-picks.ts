/**
 * Seed Expert Picks from Historical Games
 * 
 * Uses actual historical game results to generate realistic picks for tracked experts.
 * Each expert gets picks based on their sport coverage, with randomized but plausible
 * win rates (TV experts ~48-55%, sharps ~54-60%).
 * 
 * Usage: npx tsx scripts/seed-expert-picks.ts
 */

import { createClient } from '@supabase/supabase-js'

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string
)

// Map expert sport coverage strings to DB sport values
// tracked_picks uses uppercase (NFL, NBA, etc.) and maps CFB→NCAAF, CBB→NCAAB  
// historical_games uses lowercase (nfl, nba, etc.)
const sportToPicksSport: Record<string, string> = {
  'NFL': 'NFL', 'NBA': 'NBA', 'MLB': 'MLB', 'NHL': 'NHL',
  'CFB': 'CFB', 'CBB': 'CBB',
}
const sportToHistSport: Record<string, string> = {
  'NFL': 'nfl', 'NBA': 'nba', 'MLB': 'mlb', 'NHL': 'nhl',
  'CFB': 'ncaaf', 'CBB': 'ncaab',
}

function randomBetween(min: number, max: number): number {
  return Math.random() * (max - min) + min
}

async function main() {
  console.log('Fetching tracked experts...')
  const { data: experts, error: expErr } = await sb
    .from('tracked_experts')
    .select('slug, name, sports, expert_type, priority')
    .eq('is_active', true)

  if (expErr || !experts) {
    console.error('Failed to fetch experts:', expErr?.message)
    return
  }
  console.log(`Found ${experts.length} experts`)

  // Fetch recent completed games (last 365 days) for all sports
  const lookback = new Date()
  lookback.setDate(lookback.getDate() - 365)
  const dateStr = lookback.toISOString().split('T')[0]

  console.log(`Fetching games since ${dateStr}...`)
  
  // Fetch in paginated batches to bypass Supabase 1000-row limit
  let allGames: any[] = []
  let offset = 0
  const batchSize = 1000
  while (true) {
    const { data: batch, error: batchErr } = await sb
      .from('historical_games')
      .select('espn_game_id, sport, game_date, home_team, away_team, home_team_abbrev, away_team_abbrev, home_score, away_score, point_spread, over_under, spread_result, total_result')
      .gte('game_date', dateStr)
      .neq('season_type', 'scheduled')
      .gt('home_score', 0)
      .order('game_date', { ascending: false })
      .range(offset, offset + batchSize - 1)
    
    if (batchErr) {
      console.error('  Batch fetch error:', batchErr.message)
      break
    }
    if (!batch || batch.length === 0) break
    allGames = allGames.concat(batch)
    console.log(`  Fetched ${allGames.length} games so far...`)
    if (batch.length < batchSize) break
    offset += batchSize
  }
  
  const games = allGames
  console.log(`Found ${games.length} recent completed games`)

  // Group games by sport
  const gamesBySport = new Map<string, typeof games>()
  for (const g of games) {
    const existing = gamesBySport.get(g.sport) || []
    existing.push(g)
    gamesBySport.set(g.sport, existing)
  }

  const allPicks: any[] = []
  const statsToUpdate: any[] = []

  for (const expert of experts) {
    // Determine win rate based on expert type
    let baseWinRate: number
    switch (expert.expert_type) {
      case 'sharp': baseWinRate = randomBetween(0.54, 0.60); break
      case 'writer': baseWinRate = randomBetween(0.50, 0.56); break
      case 'tv': baseWinRate = randomBetween(0.46, 0.54); break
      case 'podcast': baseWinRate = randomBetween(0.47, 0.53); break
      case 'social': baseWinRate = randomBetween(0.44, 0.52); break
      default: baseWinRate = randomBetween(0.48, 0.54)
    }

    // Higher priority experts get more picks
    const picksPerSport = expert.priority >= 5 ? 40 : expert.priority >= 4 ? 25 : 15
    
    let totalWins = 0, totalLosses = 0, totalPushes = 0, totalUnits = 0

    for (const sportStr of (expert.sports || [])) {
      const dbSport = sportToHistSport[sportStr]
      const picksSport = sportToPicksSport[sportStr]
      if (!dbSport || !picksSport) continue
      const sportGames = gamesBySport.get(dbSport)
      if (!sportGames || sportGames.length === 0) continue

      // Pick random games for this expert
      const shuffled = [...sportGames].sort(() => Math.random() - 0.5)
      const selectedGames = shuffled.slice(0, picksPerSport)

      for (const game of selectedGames) {
        if (!game.spread_result && !game.total_result) continue

        // Decide bet type: 70% spread, 20% total, 10% ML
        const rand = Math.random()
        let betType: string, pickedSide: string, pickedTeam: string | null, line: number | null
        let status: string

        if (rand < 0.7 && game.point_spread !== null) {
          // Spread bet
          betType = 'spread'
          const pickHome = Math.random() < 0.5
          pickedSide = pickHome ? 'home' : 'away'
          pickedTeam = pickHome ? game.home_team : game.away_team
          line = game.point_spread

          // Determine if expert wins based on their win rate
          const actualResult = game.spread_result
          if (actualResult === 'push') {
            status = 'push'
          } else {
            const homeCovers = actualResult === 'home_cover'
            const expertPickedCorrectly = (pickHome && homeCovers) || (!pickHome && !homeCovers)
            
            // Use win rate to decide if we "assign" the correct side to this expert
            if (Math.random() < baseWinRate) {
              // Expert wins - assign them the correct side
              pickedSide = homeCovers ? 'home' : 'away'
              pickedTeam = homeCovers ? game.home_team : game.away_team
              status = 'won'
            } else {
              // Expert loses - assign them the wrong side
              pickedSide = homeCovers ? 'away' : 'home'
              pickedTeam = homeCovers ? game.away_team : game.home_team
              status = 'lost'
            }
          }
        } else if (rand < 0.9 && game.over_under !== null && game.total_result) {
          // Total bet
          betType = 'total'
          pickedTeam = null
          line = game.over_under

          if (game.total_result === 'push') {
            pickedSide = 'over'
            status = 'push'
          } else {
            if (Math.random() < baseWinRate) {
              pickedSide = game.total_result // over or under
              status = 'won'
            } else {
              pickedSide = game.total_result === 'over' ? 'under' : 'over'
              status = 'lost'
            }
          }
        } else {
          // Moneyline
          betType = 'moneyline'
          line = null
          const homeWins = (game.home_score || 0) > (game.away_score || 0)

          if (Math.random() < baseWinRate) {
            pickedSide = homeWins ? 'home' : 'away'
            pickedTeam = homeWins ? game.home_team : game.away_team
            status = 'won'
          } else {
            pickedSide = homeWins ? 'away' : 'home'
            pickedTeam = homeWins ? game.away_team : game.home_team
            status = 'lost'
          }
        }

        const units = status === 'won' ? 1.0 : status === 'lost' ? -1.1 : 0
        if (status === 'won') totalWins++
        else if (status === 'lost') totalLosses++
        else totalPushes++
        totalUnits += units

        allPicks.push({
          expert_slug: expert.slug,
          pick_date: game.game_date,
          pick_timestamp: new Date(game.game_date + 'T12:00:00Z').toISOString(),
          sport: picksSport,
          game_id: game.espn_game_id,
          game_date: game.game_date,
          home_team: game.home_team,
          away_team: game.away_team,
          picked_team: pickedTeam,
          picked_side: pickedSide,
          bet_type: betType,
          line_at_pick: line,
          odds_at_pick: -110,
          total_pick: betType === 'total' ? pickedSide : null,
          total_number: betType === 'total' ? line : null,
          units: 1.0,
          confidence: expert.priority >= 5 ? 'best_bet' : 'lean',
          is_public: true,
          source: expert.expert_type === 'tv' ? 'espn' : 'x_twitter',
          status,
          units_won: status === 'won' ? 1 : status === 'lost' ? -1.1 : 0,
          graded_at: new Date(game.game_date + 'T23:00:00Z').toISOString(),
        })
      }
    }

    // Update expert stats
    const totalPick = totalWins + totalLosses + totalPushes
    if (totalPick > 0) {
      statsToUpdate.push({
        expert_slug: expert.slug,
        period_type: 'all_time',
        period_start: '2020-01-01',
        period_end: new Date().toISOString().split('T')[0],
        sport: null,
        bet_type: null,
        wins: totalWins,
        losses: totalLosses,
        pushes: totalPushes,
        total_picks: totalPick,
        win_pct: Math.round((totalWins / (totalWins + totalLosses)) * 1000) / 10,
        units_won: Math.round(totalUnits * 10) / 10,
        units_wagered: totalPick,
        roi: Math.round((totalUnits / totalPick) * 1000) / 10,
      })
    }

    console.log(`  ${expert.name}: ${totalWins}W-${totalLosses}L (${totalPick} picks, ${(baseWinRate * 100).toFixed(1)}% target)`)
  }

  // Insert picks in batches
  console.log(`\nInserting ${allPicks.length} picks...`)
  
  // First clear existing seeded picks
  const { error: clearErr } = await sb
    .from('tracked_picks')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000') // delete all rows
  if (clearErr) console.error(`  Clear error: ${clearErr.message}`)
  
  for (let i = 0; i < allPicks.length; i += 50) {
    const batch = allPicks.slice(i, i + 50)
    const { error } = await sb.from('tracked_picks').insert(batch)
    if (error) console.error(`  Batch ${i}: ${error.message}`)
    else process.stdout.write(`  ${Math.min(i + 50, allPicks.length)}/${allPicks.length}\r`)
  }
  console.log()

  // Update stats - first delete existing all_time stats, then insert fresh
  console.log(`Updating stats for ${statsToUpdate.length} experts...`)
  
  // Delete existing all_time stats for these experts
  const slugsToUpdate = statsToUpdate.map(s => s.expert_slug)
  const { error: delErr } = await sb
    .from('tracked_expert_stats')
    .delete()
    .eq('period_type', 'all_time')
    .in('expert_slug', slugsToUpdate)
  if (delErr) console.error(`  Delete old stats error: ${delErr.message}`)

  // Insert fresh stats
  for (const stat of statsToUpdate) {
    const { error } = await sb.from('tracked_expert_stats').insert(stat)
    if (error) console.error(`  Stats error for ${stat.expert_slug}: ${error.message}`)
  }

  // Summary
  const totalPicks = allPicks.length
  const totalW = allPicks.filter(p => p.status === 'won').length
  const totalL = allPicks.filter(p => p.status === 'lost').length
  console.log(`\nDone! ${totalPicks} picks seeded (${totalW}W-${totalL}L across ${experts.length} experts)`)
}

main().catch(console.error)
