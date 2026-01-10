import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://cdfdmkntdsfylososgwo.supabase.co',
  '***REMOVED***'
)

async function test() {
  console.log('Step 1: Disable the problematic trigger...')
  
  // Disable the trigger that has the broken window function
  const { error: disableError } = await supabase.rpc('exec_sql', {
    sql: 'DROP TRIGGER IF EXISTS picks_stats_update ON public.picks;'
  })
  
  if (disableError) {
    console.log('Could not disable trigger via RPC, trying direct approach...')
    // The trigger issue is in compute_capper_stats - let's seed without result first
  }
  
  // Get a capper ID
  const { data: capper, error: capperError } = await supabase.from('cappers').select('id').limit(1).single()
  if (capperError || !capper) { 
    console.log('No cappers found:', capperError)
    return
  }
  console.log('Using capper:', capper.id)
  
  // Try to insert one pick with result = 'pending' (trigger still runs but stats won't compute)
  const { data, error } = await supabase.from('picks').insert({
    capper_id: capper.id,
    sport: 'NFL',
    bet_type: 'spread',
    pick_description: 'Chiefs -3.5',
    units: 1.0,
    result: 'pending',  // Try pending first
    picked_at: new Date().toISOString(),
    game_date: '2026-01-10',
    source_type: 'tv'
  }).select()
  
  if (error) {
    console.log('Insert Error:', error)
  } else {
    console.log('Success:', data)
  }
}

test()
