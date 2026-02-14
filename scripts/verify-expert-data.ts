import { createClient } from '@supabase/supabase-js'
const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string
)

async function main() {
  const { count: pickCount } = await sb.from('tracked_picks').select('*', { count: 'exact', head: true })
  console.log('tracked_picks:', pickCount)
  
  const { count: statCount } = await sb.from('tracked_expert_stats').select('*', { count: 'exact', head: true })
  console.log('tracked_expert_stats:', statCount)
  
  // Top performers
  const { data: topExperts } = await sb.from('tracked_expert_stats')
    .select('expert_slug, wins, losses, total_picks, win_pct, units_won, roi')
    .eq('period_type', 'all_time')
    .gt('total_picks', 5)
    .order('win_pct', { ascending: false })
    .limit(10)
  
  console.log('\nTop performing experts:')
  for (const e of topExperts || []) {
    console.log(`  ${e.expert_slug}: ${e.wins}W-${e.losses}L (${e.win_pct}%, ${e.units_won}u, ROI ${e.roi}%)`)
  }
  
  // Sports breakdown  
  const { data: picks } = await sb.from('tracked_picks').select('sport')
  const sportCounts = new Map<string, number>()
  for (const p of picks || []) {
    sportCounts.set(p.sport, (sportCounts.get(p.sport) || 0) + 1)
  }
  console.log('\nPicks by sport:')
  for (const [sport, count] of sportCounts) {
    console.log(`  ${sport}: ${count}`)
  }
}
main()
