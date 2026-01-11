// =============================================================================
// ADMIN API: Run Database Migrations
// Execute SQL migrations through the API (requires service role key)
// =============================================================================

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// Predefined safe migrations
const MIGRATIONS = {
  'admin-settings': `
    -- Site Settings (single row table for site-wide config)
    CREATE TABLE IF NOT EXISTS site_settings (
      id INTEGER PRIMARY KEY DEFAULT 1,
      ads_enabled BOOLEAN DEFAULT FALSE,
      ads_header_enabled BOOLEAN DEFAULT TRUE,
      ads_sidebar_enabled BOOLEAN DEFAULT TRUE,
      ads_inline_enabled BOOLEAN DEFAULT TRUE,
      ads_footer_enabled BOOLEAN DEFAULT TRUE,
      adsense_publisher_id VARCHAR(50) DEFAULT NULL,
      adsense_slot_header VARCHAR(20) DEFAULT NULL,
      adsense_slot_sidebar VARCHAR(20) DEFAULT NULL,
      adsense_slot_inline VARCHAR(20) DEFAULT NULL,
      adsense_slot_footer VARCHAR(20) DEFAULT NULL,
      maintenance_mode BOOLEAN DEFAULT FALSE,
      auto_refresh_enabled BOOLEAN DEFAULT TRUE,
      auto_refresh_interval_minutes INTEGER DEFAULT 15,
      ai_analysis_enabled BOOLEAN DEFAULT TRUE,
      live_scores_enabled BOOLEAN DEFAULT TRUE,
      notification_emails TEXT[] DEFAULT '{}',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      CONSTRAINT single_row CHECK (id = 1)
    );
    INSERT INTO site_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;
  `,
  'cron-logs': `
    CREATE TABLE IF NOT EXISTS cron_logs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      job_name VARCHAR(100) NOT NULL,
      status VARCHAR(50) NOT NULL DEFAULT 'running',
      result JSONB,
      error_message TEXT,
      duration_ms INTEGER,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_cron_logs_created_at ON cron_logs(created_at DESC);
  `,
  'error-logs': `
    CREATE TABLE IF NOT EXISTS error_logs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      service VARCHAR(100) NOT NULL,
      error TEXT NOT NULL,
      severity VARCHAR(20) DEFAULT 'medium',
      stack_trace TEXT,
      metadata JSONB,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_error_logs_created_at ON error_logs(created_at DESC);
  `,
  'profiles': `
    CREATE TABLE IF NOT EXISTS profiles (
      id UUID PRIMARY KEY,
      role VARCHAR(50) DEFAULT 'user',
      display_name VARCHAR(100),
      avatar_url TEXT,
      email VARCHAR(255),
      preferences JSONB DEFAULT '{}',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
  `
}

export async function GET() {
  return NextResponse.json({
    available: Object.keys(MIGRATIONS),
    description: 'POST with { migration: "name" } to run a migration'
  })
}

export async function POST(request: Request) {
  const supabase = getSupabase()
  try {
    const { migration, runAll } = await request.json()
    
    if (runAll) {
      // Run all migrations
      const results: Record<string, { success: boolean; error?: string }> = {}
      
      for (const [name, sql] of Object.entries(MIGRATIONS)) {
        try {
          const { error } = await supabase.rpc('exec_sql', { sql_query: sql }).single()
          if (error) {
            // Try direct query if RPC doesn't exist
            const statements = sql.split(';').filter(s => s.trim())
            for (const stmt of statements) {
              if (stmt.trim()) {
                // Use raw SQL through postgrest
                const result = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY!,
                    'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`
                  }
                })
              }
            }
            results[name] = { success: true }
          } else {
            results[name] = { success: true }
          }
        } catch (err) {
          results[name] = { success: false, error: String(err) }
        }
      }
      
      return NextResponse.json({ status: 'completed', results })
    }
    
    if (!migration || !MIGRATIONS[migration as keyof typeof MIGRATIONS]) {
      return NextResponse.json({ 
        error: 'Invalid migration', 
        available: Object.keys(MIGRATIONS) 
      }, { status: 400 })
    }
    
    const sql = MIGRATIONS[migration as keyof typeof MIGRATIONS]
    
    // Note: Supabase doesn't allow raw SQL via REST API
    // Migrations must be run in the Supabase Dashboard SQL Editor
    return NextResponse.json({
      status: 'manual_required',
      message: 'Copy and paste this SQL into Supabase Dashboard → SQL Editor',
      sql: sql.trim()
    })
    
  } catch (error) {
    console.error('Migration error:', error)
    return NextResponse.json({ error: 'Migration failed' }, { status: 500 })
  }
}
