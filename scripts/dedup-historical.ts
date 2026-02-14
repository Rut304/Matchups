import { createClient } from '@supabase/supabase-js'

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function dedup() {
  const sports = ['nfl', 'nba', 'mlb', 'nhl', 'ncaaf', 'ncaab']
  
  for (const sport of sports) {
    console.log(`\n=== Deduplicating ${sport.toUpperCase()} ===`)
    
    // Get all games (paginated)
    let allGames: any[] = []
    let offset = 0
    while (true) {
      const { data: page } = await sb
        .from('historical_games')
        .select('id, game_date, home_team_abbr, away_team_abbr')
        .eq('sport', sport)
        .order('id', { ascending: true })
        .range(offset, offset + 999)
      
      if (!page || page.length === 0) break
      allGames.push(...page)
      if (page.length < 1000) break
      offset += 1000
    }
    
    // Find duplicates: keep the first occurrence (lowest id)
    const seen = new Map<string, number>()
    const toDelete: number[] = []
    for (const g of allGames) {
      const key = `${g.game_date}|${g.home_team_abbr}|${g.away_team_abbr}`
      if (seen.has(key)) {
        toDelete.push(g.id)
      } else {
        seen.set(key, g.id)
      }
    }
    
    console.log(`  Total: ${allGames.length}, Unique: ${seen.size}, Duplicates: ${toDelete.length}`)
    
    if (toDelete.length > 0) {
      for (let i = 0; i < toDelete.length; i += 50) {
        const batch = toDelete.slice(i, i + 50)
        const { error } = await sb.from('historical_games').delete().in('id', batch)
        if (error) console.error('  Delete error:', error.message)
      }
      console.log(`  Deleted ${toDelete.length} duplicates`)
    }
  }
  
  // Final counts
  console.log('\n=== Final counts ===')
  for (const sport of sports) {
    const { count } = await sb
      .from('historical_games')
      .select('*', { count: 'exact', head: true })
      .eq('sport', sport)
    console.log(`  ${sport}: ${count}`)
  }
}

dedup().catch(console.error)
