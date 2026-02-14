import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function check() {
  // Check recent historical_games with all columns
  const { data: sample } = await supabase
    .from('historical_games')
    .select('*')
    .not('home_team', 'eq', 'TBD')
    .order('game_date', { ascending: false })
    .limit(3)
    
  console.log('Sample complete game:', JSON.stringify(sample?.[0], null, 2))
  
  // Count completed games (with scores)
  const { count: completed } = await supabase
    .from('historical_games')
    .select('*', { count: 'exact', head: true })
    .not('home_score', 'is', null)
    .not('away_score', 'is', null)
  console.log('Games with scores:', completed)
  
  // Games by sport
  for (const sport of ['nfl', 'nba', 'mlb', 'nhl', 'ncaaf', 'ncaab']) {
    const { count } = await supabase
      .from('historical_games')
      .select('*', { count: 'exact', head: true })
      .eq('sport', sport)
      .not('home_score', 'is', null)
    console.log(`${sport}: ${count} completed games`)
  }
  
  // Check team_ratings
  const { data: ratings, count: ratingsCount } = await supabase
    .from('team_ratings')
    .select('*', { count: 'exact' })
    .limit(5)
  console.log('Team ratings count:', ratingsCount)
}

check()
