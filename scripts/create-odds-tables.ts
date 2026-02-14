import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.join(process.cwd(), '.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function main() {
  console.log('Checking if game_odds table exists...')
  
  const { error: checkError } = await supabase.from('game_odds').select('id').limit(1)
  
  if (!checkError) {
    console.log('game_odds table already exists!')
    return
  }
  
  console.log('Table not found. Attempting to create via exec_sql RPC...')
  
  const { error: rpcTest } = await supabase.rpc('exec_sql', { sql_text: 'SELECT 1' })
  
  if (rpcTest) {
    console.log('exec_sql RPC not available:', rpcTest.message)
    console.log('')
    console.log('Please create the tables manually in Supabase Dashboard:')
    console.log('  1. Go to https://supabase.com/dashboard')
    console.log('  2. Open your project > SQL Editor')
    console.log('  3. Paste the contents of: supabase/migrations/game_odds.sql')
    console.log('  4. Click "Run"')
    process.exit(1)
  }

  // Create game_odds table
  const createGameOdds = `
    CREATE TABLE IF NOT EXISTS public.game_odds (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      sport TEXT NOT NULL,
      odds_api_game_id TEXT UNIQUE,
      espn_game_id TEXT,
      home_team TEXT NOT NULL,
      away_team TEXT NOT NULL,
      commence_time TIMESTAMPTZ NOT NULL,
      game_date DATE NOT NULL,
      season INTEGER,
      consensus_home_ml INTEGER,
      consensus_away_ml INTEGER,
      consensus_spread DECIMAL(4,1),
      consensus_spread_home_odds INTEGER,
      consensus_spread_away_odds INTEGER,
      consensus_total DECIMAL(4,1),
      consensus_over_odds INTEGER,
      consensus_under_odds INTEGER,
      best_home_ml INTEGER,
      best_away_ml INTEGER,
      best_spread DECIMAL(4,1),
      best_total DECIMAL(4,1),
      fanduel_home_ml INTEGER,
      fanduel_away_ml INTEGER,
      fanduel_spread DECIMAL(4,1),
      fanduel_spread_home_odds INTEGER,
      fanduel_total DECIMAL(4,1),
      fanduel_over_odds INTEGER,
      fanduel_under_odds INTEGER,
      draftkings_home_ml INTEGER,
      draftkings_away_ml INTEGER,
      draftkings_spread DECIMAL(4,1),
      draftkings_spread_home_odds INTEGER,
      draftkings_total DECIMAL(4,1),
      draftkings_over_odds INTEGER,
      draftkings_under_odds INTEGER,
      betmgm_home_ml INTEGER,
      betmgm_away_ml INTEGER,
      betmgm_spread DECIMAL(4,1),
      betmgm_spread_home_odds INTEGER,
      betmgm_total DECIMAL(4,1),
      betmgm_over_odds INTEGER,
      betmgm_under_odds INTEGER,
      bookmaker_odds JSONB,
      snapshot_time TIMESTAMPTZ,
      bookmaker_count INTEGER DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `
  
  const { error: e1 } = await supabase.rpc('exec_sql', { sql_text: createGameOdds })
  if (e1) { console.error('Failed:', e1.message); process.exit(1) }
  console.log('Created game_odds table')

  // Create odds_import_log 
  const createLog = `
    CREATE TABLE IF NOT EXISTS public.odds_import_log (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      sport TEXT NOT NULL,
      import_date DATE NOT NULL,
      snapshot_time TIMESTAMPTZ,
      games_found INTEGER DEFAULT 0,
      games_imported INTEGER DEFAULT 0,
      credits_used INTEGER DEFAULT 0,
      credits_remaining INTEGER,
      status TEXT DEFAULT 'success',
      error_message TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(sport, import_date)
    )
  `
  const { error: e2 } = await supabase.rpc('exec_sql', { sql_text: createLog })
  if (e2) { console.error('Failed:', e2.message); process.exit(1) }
  console.log('Created odds_import_log table')

  // RLS + policies + indexes
  const stmts = [
    'ALTER TABLE public.game_odds ENABLE ROW LEVEL SECURITY',
    'ALTER TABLE public.odds_import_log ENABLE ROW LEVEL SECURITY',
    'CREATE POLICY "read_game_odds" ON public.game_odds FOR SELECT USING (true)',
    'CREATE POLICY "write_game_odds" ON public.game_odds FOR ALL USING (true) WITH CHECK (true)',
    'CREATE POLICY "read_odds_log" ON public.odds_import_log FOR SELECT USING (true)',
    'CREATE POLICY "write_odds_log" ON public.odds_import_log FOR ALL USING (true) WITH CHECK (true)',
    'CREATE INDEX IF NOT EXISTS idx_game_odds_sport ON public.game_odds(sport)',
    'CREATE INDEX IF NOT EXISTS idx_game_odds_date ON public.game_odds(game_date)',
    'CREATE INDEX IF NOT EXISTS idx_game_odds_sport_date ON public.game_odds(sport, game_date)',
    'CREATE INDEX IF NOT EXISTS idx_game_odds_teams ON public.game_odds(home_team, away_team)',
    'CREATE INDEX IF NOT EXISTS idx_game_odds_commence ON public.game_odds(commence_time)',
    'CREATE INDEX IF NOT EXISTS idx_game_odds_season ON public.game_odds(season)',
  ]

  for (const sql of stmts) {
    const { error } = await supabase.rpc('exec_sql', { sql_text: sql })
    if (error && !error.message.includes('already exists')) {
      console.log('Warning:', error.message)
    }
  }
  console.log('RLS, policies, and indexes configured')

  // Final verify
  const { error: finalCheck } = await supabase.from('game_odds').select('id').limit(1)
  if (finalCheck) {
    console.log('Verification failed:', finalCheck.message)
  } else {
    console.log('All tables ready!')
  }
}

main().catch(console.error)
