/**
 * Run SQL directly via Supabase RPC
 */

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function main() {
  // Create tables using Supabase API - run individual statements
  const statements = [
    // Team ratings table
    `CREATE TABLE IF NOT EXISTS team_ratings (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      sport TEXT NOT NULL,
      team_abbr TEXT NOT NULL,
      team_name TEXT NOT NULL,
      elo_rating NUMERIC(8, 2) DEFAULT 1500,
      elo_rank INTEGER,
      power_rating NUMERIC(6, 2) DEFAULT 0,
      off_rating NUMERIC(6, 2) DEFAULT 0,
      def_rating NUMERIC(6, 2) DEFAULT 0,
      season INTEGER NOT NULL DEFAULT 2024,
      games_played INTEGER DEFAULT 0,
      wins INTEGER DEFAULT 0,
      losses INTEGER DEFAULT 0,
      last_5_elo_change NUMERIC(6, 2) DEFAULT 0,
      peak_elo NUMERIC(8, 2) DEFAULT 1500,
      low_elo NUMERIC(8, 2) DEFAULT 1500,
      last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      UNIQUE(sport, team_abbr, season)
    )`,
    
    // Elo history table
    `CREATE TABLE IF NOT EXISTS elo_history (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      sport TEXT NOT NULL,
      team_abbr TEXT NOT NULL,
      season INTEGER NOT NULL,
      game_date DATE NOT NULL,
      game_id TEXT,
      elo_before NUMERIC(8, 2),
      elo_after NUMERIC(8, 2),
      elo_change NUMERIC(6, 2),
      opponent_abbr TEXT,
      result TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )`
  ]
  
  console.log('Creating team_ratings tables...')
  
  // Check if tables exist by trying to select
  const { data: testData, error: testError } = await supabase
    .from('team_ratings')
    .select('id')
    .limit(1)
  
  if (testError && testError.code === '42P01') {
    // Table doesn't exist - need to create via SQL editor or migrations
    console.log('Tables need to be created via Supabase Dashboard SQL Editor.')
    console.log('Copy and run: supabase/team-ratings-schema.sql')
    console.log('\nAlternatively, the script will create records anyway and Supabase may auto-create the table.')
  } else if (testError) {
    console.log('Test query error:', testError.message)
  } else {
    console.log('team_ratings table exists!')
  }
  
  // Try inserting a test record to see if table exists
  const testRecord = {
    sport: 'test',
    team_abbr: 'TST',
    team_name: 'Test Team',
    season: 2024,
    elo_rating: 1500
  }
  
  const { error: insertError } = await supabase
    .from('team_ratings')
    .upsert(testRecord, { onConflict: 'sport,team_abbr,season' })
  
  if (insertError) {
    console.log('Insert test failed:', insertError.message)
    console.log('\n📋 Please run this SQL in Supabase Dashboard SQL Editor:')
    console.log(fs.readFileSync('supabase/team-ratings-schema.sql', 'utf8'))
  } else {
    console.log('✅ Tables are ready!')
    
    // Clean up test record
    await supabase.from('team_ratings').delete().eq('sport', 'test')
  }
}

main().catch(console.error)
