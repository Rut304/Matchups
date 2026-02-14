import { createClient } from '@supabase/supabase-js'

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string
)

async function main() {
  const sports = ['nfl', 'nba', 'nhl', 'mlb', 'ncaaf', 'ncaab']
  console.log('=== HISTORICAL_GAMES COUNTS ===')
  let grandTotal = 0
  for (const s of sports) {
    const { count: total } = await sb.from('historical_games').select('*', { count: 'exact', head: true }).eq('sport', s)
    const { count: scheduled } = await sb.from('historical_games').select('*', { count: 'exact', head: true }).eq('sport', s).eq('season_type', 'scheduled')
    const hist = (total || 0) - (scheduled || 0)
    console.log(`  ${s.toUpperCase().padEnd(6)}: ${String(total).padStart(6)} total (${hist} historical, ${scheduled || 0} scheduled)`)
    grandTotal += (total || 0)
  }
  console.log(`  TOTAL: ${grandTotal} games`)

  console.log('\n=== GAME_ODDS COUNTS ===')
  let oddsTotal = 0
  for (const s of sports) {
    const { count } = await sb.from('game_odds').select('*', { count: 'exact', head: true }).eq('sport', s)
    console.log(`  ${s.toUpperCase().padEnd(6)}: ${String(count).padStart(6)} records`)
    oddsTotal += (count || 0)
  }
  console.log(`  TOTAL: ${oddsTotal} records`)
}

main()
