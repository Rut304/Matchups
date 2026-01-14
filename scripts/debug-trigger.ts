import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

// Use service role key for admin operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables')
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testInserts() {
  console.log('Testing different insert approaches...\n')
  
  // Get a capper
  const { data: cappers } = await supabase
    .from('cappers')
    .select('id, name')
    .limit(1)
  
  if (!cappers || cappers.length === 0) {
    console.log('No cappers found!')
    return
  }
  
  const capper = cappers[0]
  console.log('Using capper:', capper.name, '(', capper.id, ')\n')
  
  // Test 1: Insert with result = null
  console.log('Test 1: Insert with result = null')
  const { data: pick1, error: err1 } = await supabase
    .from('picks')
    .insert({
      capper_id: capper.id,
      sport: 'NFL',
      bet_type: 'spread',
      pick_description: 'Test1: Chiefs -3.5',
      units: 1.0,
      result: null,
      picked_at: new Date().toISOString(),
      game_date: '2026-01-10',
      source_type: 'manual'
    })
    .select()
  
  if (err1) {
    console.log('❌ Failed:', err1.message)
  } else {
    console.log('✅ Success:', pick1)
  }
  
  // Test 2: Minimal insert (just required fields)
  console.log('\nTest 2: Minimal insert (required fields only)')
  const { data: pick2, error: err2 } = await supabase
    .from('picks')
    .insert({
      capper_id: capper.id,
      sport: 'NFL',
      bet_type: 'spread',
      pick_description: 'Test2: Patriots +7',
      picked_at: new Date().toISOString()
    })
    .select()
  
  if (err2) {
    console.log('❌ Failed:', err2.message)
  } else {
    console.log('✅ Success:', pick2)
  }
}

testInserts()
