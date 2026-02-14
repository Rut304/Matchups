import { createClient } from '@supabase/supabase-js'

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string
)

async function check() {
  const tables = [
    'sus_plays', 'sus_play_votes',
    'tracked_experts', 'tracked_picks', 'tracked_expert_stats',
    'line_snapshots', 'historical_trends', 'trends',
    'expert_picks', 'expert_profiles'
  ]
  console.log('=== TABLE STATUS ===')
  for (const t of tables) {
    const { count, error } = await sb.from(t).select('*', { count: 'exact', head: true })
    if (error) console.log(`  ${t.padEnd(25)} ERROR: ${error.message.substring(0, 60)}`)
    else console.log(`  ${t.padEnd(25)} ${count} rows`)
  }
}

check()
