import { createClient } from '@supabase/supabase-js'

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string
)

async function main() {
  // Check sus_plays moderation status
  console.log('=== SUS PLAYS ===')
  const { data: sus, error: susErr } = await sb.from('sus_plays').select('id, title, moderation_status, source, sport').limit(20)
  if (susErr) console.log('Error:', susErr.message)
  else sus?.forEach(s => console.log(`  [${s.moderation_status}] ${s.title} (${s.sport}, ${s.source})`))

  // Check tracked_experts sample
  console.log('\n=== TRACKED EXPERTS (first 5) ===')
  const { data: experts } = await sb.from('tracked_experts').select('name, x_handle, is_active, expert_type').limit(5)
  experts?.forEach(e => console.log(`  ${e.name} (@${e.x_handle}) - ${e.expert_type} - active: ${e.is_active}`))

  // Check tracked_expert_stats sample
  console.log('\n=== EXPERT STATS (first 5) ===')
  const { data: stats } = await sb.from('tracked_expert_stats').select('expert_slug, wins, losses, total_picks').limit(5)
  stats?.forEach(s => console.log(`  ${s.expert_slug}: ${s.wins}W-${s.losses}L (${s.total_picks} picks)`))

  // Check expert_profiles
  console.log('\n=== EXPERT PROFILES (first 5) ===')
  const { data: profiles } = await sb.from('expert_profiles').select('name, platform, follower_count').limit(5)
  profiles?.forEach(p => console.log(`  ${p.name} - ${p.platform} - ${p.follower_count} followers`))

  // Check historical_trends
  console.log('\n=== HISTORICAL TRENDS ===')
  const { data: trends } = await sb.from('historical_trends').select('sport, name, record_wins, record_losses').limit(10)
  trends?.forEach(t => console.log(`  ${t.sport}: ${t.name} (${t.record_wins}-${t.record_losses})`))
  
  // Check what the /api/sus endpoint actually returns
  console.log('\n=== SUS API CHECK ===')
  const { data: approved } = await sb.from('sus_plays').select('*', { count: 'exact', head: true }).eq('moderation_status', 'approved')
  console.log('  Approved sus_plays:', approved)
  const { count: pendingCount } = await sb.from('sus_plays').select('*', { count: 'exact', head: true }).eq('moderation_status', 'pending')
  console.log('  Pending sus_plays:', pendingCount)
}

main()
