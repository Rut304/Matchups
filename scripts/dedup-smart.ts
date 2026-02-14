/**
 * Dedup historical_games by team+date
 * 
 * Problem: same game imported from multiple sources creates duplicates where:
 * 1. Same date, same teams but home/away flipped
 * 2. Same date, same team appears with different opponent (bad data)
 * 
 * Strategy: For each sport+season, group by sorted(team1, team2) + date.
 * Keep the first record (best data), delete the rest.
 */
import { createClient } from '@supabase/supabase-js'

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function dedup() {
  const sports = ['nfl', 'nba', 'mlb', 'nhl', 'ncaaf', 'ncaab']
  
  for (const sport of sports) {
    console.log(`\n=== ${sport.toUpperCase()} ===`)
    
    // Fetch all games for this sport (paginated)
    let allGames: any[] = []
    let offset = 0
    while (true) {
      const { data, error } = await sb.from('historical_games')
        .select('id, game_date, home_team_abbr, away_team_abbr, season, point_spread, spread_result, home_score, away_score')
        .eq('sport', sport)
        .order('game_date', { ascending: false })
        .range(offset, offset + 999)
      
      if (error) { console.error(error); break }
      if (!data || data.length === 0) break
      allGames = allGames.concat(data)
      if (data.length < 1000) break
      offset += 1000
    }
    
    console.log(`Total games: ${allGames.length}`)
    
    // Group by normalized key: date + sorted(team1, team2)
    const groups = new Map<string, any[]>()
    for (const game of allGames) {
      const teams = [game.home_team_abbr, game.away_team_abbr].sort().join('|')
      const key = `${game.game_date}|${teams}`
      if (!groups.has(key)) groups.set(key, [])
      groups.get(key)!.push(game)
    }
    
    // Find groups with more than 1 game (duplicates)
    let dupCount = 0
    const idsToDelete: string[] = []
    
    for (const [key, gamesInGroup] of groups) {
      if (gamesInGroup.length > 1) {
        dupCount += gamesInGroup.length - 1
        // Keep the best one: prefer one with spread_result populated, then with point_spread, then with scores
        gamesInGroup.sort((a: any, b: any) => {
          const scoreA = (a.spread_result ? 4 : 0) + (a.point_spread !== null ? 2 : 0) + (a.home_score !== null ? 1 : 0)
          const scoreB = (b.spread_result ? 4 : 0) + (b.point_spread !== null ? 2 : 0) + (b.home_score !== null ? 1 : 0)
          return scoreB - scoreA // higher score first
        })
        // Mark all but first for deletion
        for (let i = 1; i < gamesInGroup.length; i++) {
          idsToDelete.push(gamesInGroup[i].id)
        }
      }
    }
    
    console.log(`Duplicate groups: ${dupCount} extra games`)
    console.log(`Games to delete: ${idsToDelete.length}`)
    
    // Delete in batches of 100
    for (let i = 0; i < idsToDelete.length; i += 100) {
      const batch = idsToDelete.slice(i, i + 100)
      const { error } = await sb.from('historical_games')
        .delete()
        .in('id', batch)
      
      if (error) {
        console.error(`Error deleting batch ${i}:`, error)
      } else {
        console.log(`Deleted batch ${Math.floor(i/100) + 1}/${Math.ceil(idsToDelete.length/100)}`)
      }
    }
    
    console.log(`${sport.toUpperCase()} done. Remaining: ${allGames.length - idsToDelete.length}`)
  }
}

dedup()
