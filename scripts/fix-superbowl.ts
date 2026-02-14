import { createClient } from '@supabase/supabase-js'
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

async function fix() {
  // 1. Fix the Pro Bowl - relabel it correctly (it's not a playoff game)
  console.log('=== FIXING PRO BOWL ===')
  const proBowlId = 'b0b7b531-ddfd-4db1-94bb-4f9ffa1f882a'
  const { error: pbErr } = await sb.from('historical_games')
    .update({ 
      season_type: 'probowl',
      home_team: 'AFC All-Stars',
      away_team: 'NFC All-Stars',
      home_team_abbr: 'AFC',
      away_team_abbr: 'NFC'
    })
    .eq('id', proBowlId)
  if (pbErr) console.error('Pro Bowl fix error:', pbErr)
  else console.log('Pro Bowl relabeled to season_type: probowl')

  // 2. Insert the actual Super Bowl LX - SEA 29, NE 13 on Feb 8
  console.log('\n=== INSERTING SUPER BOWL LX ===')
  const { error: sbErr } = await sb.from('historical_games')
    .insert({
      sport: 'nfl',
      season: 2025,
      season_type: 'postseason',
      game_date: '2026-02-08',
      home_team: 'Seattle Seahawks',
      away_team: 'New England Patriots',
      home_team_abbr: 'SEA',
      away_team_abbr: 'NE',
      home_score: 29,
      away_score: 13,
      point_spread: null,  // We'll backfill from game_odds later
      over_under: null,
      spread_result: null,
      total_result: null
    })
  if (sbErr) {
    console.error('Super Bowl insert error:', sbErr)
  } else {
    console.log('Super Bowl LX inserted: SEA 29 - NE 13 (Feb 8, 2026)')
  }

  // 3. Verify
  console.log('\n=== VERIFICATION ===')
  const { data: post } = await sb.from('historical_games')
    .select('game_date, away_team_abbr, home_team_abbr, away_score, home_score, season_type')
    .eq('sport', 'nfl')
    .eq('season', 2025)
    .gte('game_date', '2026-01-20')
    .order('game_date', { ascending: true })
    .limit(10)
  post?.forEach(g => console.log(`  ${g.game_date} ${g.away_team_abbr} @ ${g.home_team_abbr} ${g.away_score}-${g.home_score} [${g.season_type}]`))

  // 4. Count postseason games now
  const { count: psCount } = await sb.from('historical_games')
    .select('*', { count: 'exact', head: true })
    .eq('sport', 'nfl')
    .eq('season', 2025)
    .eq('season_type', 'postseason')
  console.log(`\nTotal NFL 2025 postseason games: ${psCount}`)
}

fix().catch(console.error)
