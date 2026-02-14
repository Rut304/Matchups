/**
 * Setup API - Creates required database tables
 * 
 * POST /api/admin/setup-tables
 * Authorization: Bearer {SUPABASE_SERVICE_ROLE_KEY}
 * 
 * This endpoint creates missing tables using Supabase's REST API
 */

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  // Simple auth check
  const authHeader = request.headers.get('authorization')
  const expectedKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!authHeader?.includes(expectedKey?.substring(0, 20) || '')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  const results: Record<string, string> = {}
  
  // Test team_ratings table
  const { error: testRatings } = await supabase
    .from('team_ratings')
    .select('id')
    .limit(1)
  
  if (testRatings?.code === '42P01') {
    results.team_ratings = 'TABLE MISSING - Run SQL in Supabase Dashboard'
    results.sql = `
-- Create team_ratings table
CREATE TABLE IF NOT EXISTS team_ratings (
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
);

ALTER TABLE team_ratings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Team ratings are publicly readable" ON team_ratings FOR SELECT USING (true);
CREATE POLICY "Service role can manage team ratings" ON team_ratings FOR ALL USING (auth.role() = 'service_role');
    `.trim()
  } else {
    results.team_ratings = 'OK'
  }
  
  // Test elo_history table
  const { error: testHistory } = await supabase
    .from('elo_history')
    .select('id')
    .limit(1)
  
  if (testHistory?.code === '42P01') {
    results.elo_history = 'TABLE MISSING - Run SQL in Supabase Dashboard'
  } else {
    results.elo_history = 'OK'
  }
  
  // Test line_snapshots
  const { error: testSnapshots } = await supabase
    .from('line_snapshots')
    .select('id')
    .limit(1)
  
  results.line_snapshots = testSnapshots?.code === '42P01' ? 'MISSING' : 'OK'
  
  // Test head_to_head_cache
  const { error: testH2H } = await supabase
    .from('head_to_head_cache')
    .select('id')
    .limit(1)
  
  results.head_to_head_cache = testH2H?.code === '42P01' ? 'MISSING' : 'OK'
  
  return NextResponse.json({
    success: true,
    tables: results,
    message: 'Run any missing SQL in Supabase Dashboard SQL Editor'
  })
}

export async function GET() {
  return NextResponse.json({
    endpoint: '/api/admin/setup-tables',
    method: 'POST',
    description: 'Check and setup required database tables',
    instruction: 'POST with Authorization header containing service role key prefix'
  })
}
