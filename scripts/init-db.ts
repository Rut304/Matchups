// Script to initialize the historical_games table via Supabase REST API
// Run with: npx tsx scripts/init-db.ts

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://cdfdmkntdsfylososgwo.supabase.co'
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

async function initializeDatabase() {
  if (!supabaseKey) {
    console.error('SUPABASE_SERVICE_ROLE_KEY not set')
    console.log('\nPlease run the SQL manually in Supabase SQL Editor:')
    console.log('https://supabase.com/dashboard/project/cdfdmkntdsfylososgwo/sql/new')
    console.log('\nCopy the contents of: supabase/historical-games-schema-v2.sql')
    return
  }

  const supabase = createClient(supabaseUrl, supabaseKey)

  // Test connection by checking if table exists
  const { data, error } = await supabase
    .from('historical_games')
    .select('id')
    .limit(1)

  if (error?.code === '42P01') {
    console.log('Table does not exist yet. Please run the SQL schema first.')
    console.log('\nRun this SQL in Supabase SQL Editor:')
    console.log('https://supabase.com/dashboard/project/cdfdmkntdsfylososgwo/sql/new')
    return
  }

  if (error) {
    console.error('Error:', error.message)
    return
  }

  console.log('✅ historical_games table exists')
  
  // Check count
  const { count } = await supabase
    .from('historical_games')
    .select('*', { count: 'exact', head: true })
  
  console.log(`📊 Current records: ${count || 0}`)
  
  if ((count || 0) === 0) {
    console.log('\n⚠️  No data yet. Populate with:')
    console.log('curl -X POST "https://matchups-eta.vercel.app/api/historical-data/populate" \\')
    console.log('  -H "Content-Type: application/json" \\')
    console.log('  -d \'{"sport": "nfl", "seasons": [2024, 2023, 2022], "seasonType": "postseason"}\'')
  }
}

initializeDatabase()
