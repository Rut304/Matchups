-- =============================================================================
-- Site Settings & Admin Tables
-- Run this migration to enable admin panel features
-- =============================================================================

-- Site Settings (single row table for site-wide config)
CREATE TABLE IF NOT EXISTS site_settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  
  -- Ads configuration
  ads_enabled BOOLEAN DEFAULT FALSE,
  ads_header_enabled BOOLEAN DEFAULT TRUE,
  ads_sidebar_enabled BOOLEAN DEFAULT TRUE,
  ads_inline_enabled BOOLEAN DEFAULT TRUE,
  ads_footer_enabled BOOLEAN DEFAULT TRUE,
  adsense_publisher_id VARCHAR(50) DEFAULT NULL, -- ca-pub-XXXXXXXXXXXXXXXX
  adsense_slot_header VARCHAR(20) DEFAULT NULL,
  adsense_slot_sidebar VARCHAR(20) DEFAULT NULL,
  adsense_slot_inline VARCHAR(20) DEFAULT NULL,
  adsense_slot_footer VARCHAR(20) DEFAULT NULL,
  
  -- Site features
  maintenance_mode BOOLEAN DEFAULT FALSE,
  auto_refresh_enabled BOOLEAN DEFAULT TRUE,
  auto_refresh_interval_minutes INTEGER DEFAULT 15,
  ai_analysis_enabled BOOLEAN DEFAULT TRUE,
  live_scores_enabled BOOLEAN DEFAULT TRUE,
  
  -- Notifications
  notification_emails TEXT[] DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure only one row
  CONSTRAINT single_row CHECK (id = 1)
);

-- Insert default settings if not exists
INSERT INTO site_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- Cron Logs (track automated job runs)
CREATE TABLE IF NOT EXISTS cron_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_name VARCHAR(100) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'running',
  result JSONB,
  error_message TEXT,
  duration_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for recent logs
CREATE INDEX IF NOT EXISTS idx_cron_logs_created_at ON cron_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cron_logs_job_name ON cron_logs(job_name);

-- Error Logs (track application errors)
CREATE TABLE IF NOT EXISTS error_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service VARCHAR(100) NOT NULL,
  error TEXT NOT NULL,
  severity VARCHAR(20) DEFAULT 'medium',
  stack_trace TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for recent errors
CREATE INDEX IF NOT EXISTS idx_error_logs_created_at ON error_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_error_logs_severity ON error_logs(severity);

-- User Profiles (standalone - doesn't require auth.users foreign key)
-- This allows the table to work even without Supabase Auth enabled
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

-- Add role column if table exists but column doesn't
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'role'
  ) THEN
    ALTER TABLE profiles ADD COLUMN role VARCHAR(50) DEFAULT 'user';
  END IF;
END $$;

-- Create index for role lookups (only if column exists)
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- Grant permissions (use service role for admin operations)
GRANT ALL ON site_settings TO anon, authenticated;
GRANT ALL ON cron_logs TO anon, authenticated;
GRANT ALL ON error_logs TO anon, authenticated;
GRANT ALL ON profiles TO anon, authenticated;

-- =============================================================================
-- Edge Features Settings
-- Additional columns for site_settings to control edge feature toggles
-- =============================================================================

-- Add edge feature columns to site_settings
DO $$
BEGIN
  -- Master toggle for edge features
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'site_settings' AND column_name = 'edge_features_enabled') THEN
    ALTER TABLE site_settings ADD COLUMN edge_features_enabled BOOLEAN DEFAULT TRUE;
  END IF;
  
  -- RLM (Reverse Line Movement)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'site_settings' AND column_name = 'edge_rlm_enabled') THEN
    ALTER TABLE site_settings ADD COLUMN edge_rlm_enabled BOOLEAN DEFAULT TRUE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'site_settings' AND column_name = 'edge_rlm_min_confidence') THEN
    ALTER TABLE site_settings ADD COLUMN edge_rlm_min_confidence INTEGER DEFAULT 60;
  END IF;
  
  -- Steam Moves
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'site_settings' AND column_name = 'edge_steam_enabled') THEN
    ALTER TABLE site_settings ADD COLUMN edge_steam_enabled BOOLEAN DEFAULT TRUE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'site_settings' AND column_name = 'edge_steam_min_confidence') THEN
    ALTER TABLE site_settings ADD COLUMN edge_steam_min_confidence INTEGER DEFAULT 70;
  END IF;
  
  -- CLV (Closing Line Value)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'site_settings' AND column_name = 'edge_clv_enabled') THEN
    ALTER TABLE site_settings ADD COLUMN edge_clv_enabled BOOLEAN DEFAULT TRUE;
  END IF;
  
  -- Sharp vs Public
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'site_settings' AND column_name = 'edge_sharp_public_enabled') THEN
    ALTER TABLE site_settings ADD COLUMN edge_sharp_public_enabled BOOLEAN DEFAULT TRUE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'site_settings' AND column_name = 'edge_sharp_public_min_confidence') THEN
    ALTER TABLE site_settings ADD COLUMN edge_sharp_public_min_confidence INTEGER DEFAULT 65;
  END IF;
  
  -- Arbitrage
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'site_settings' AND column_name = 'edge_arbitrage_enabled') THEN
    ALTER TABLE site_settings ADD COLUMN edge_arbitrage_enabled BOOLEAN DEFAULT TRUE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'site_settings' AND column_name = 'edge_arbitrage_min_pct') THEN
    ALTER TABLE site_settings ADD COLUMN edge_arbitrage_min_pct DECIMAL(5,2) DEFAULT 0.5;
  END IF;
  
  -- Props
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'site_settings' AND column_name = 'edge_props_enabled') THEN
    ALTER TABLE site_settings ADD COLUMN edge_props_enabled BOOLEAN DEFAULT TRUE;
  END IF;
  
  -- Notifications for edge alerts
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'site_settings' AND column_name = 'edge_notifications_enabled') THEN
    ALTER TABLE site_settings ADD COLUMN edge_notifications_enabled BOOLEAN DEFAULT TRUE;
  END IF;
  
  -- Alert retention period (hours)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'site_settings' AND column_name = 'edge_alert_retention_hours') THEN
    ALTER TABLE site_settings ADD COLUMN edge_alert_retention_hours INTEGER DEFAULT 24;
  END IF;
END $$;

-- Edge Alerts table to store detected edge opportunities
CREATE TABLE IF NOT EXISTS edge_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(20) NOT NULL, -- rlm, steam, clv, sharp-public, arbitrage, props
  game_id VARCHAR(50) NOT NULL,
  sport VARCHAR(10) NOT NULL,
  severity VARCHAR(10) NOT NULL DEFAULT 'info', -- critical, major, minor, info
  title TEXT NOT NULL,
  description TEXT,
  data JSONB DEFAULT '{}',
  confidence INTEGER DEFAULT 50,
  expected_value DECIMAL(5,2),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE
);

-- Indexes for edge_alerts
CREATE INDEX IF NOT EXISTS idx_edge_alerts_type ON edge_alerts(type);
CREATE INDEX IF NOT EXISTS idx_edge_alerts_game_id ON edge_alerts(game_id);
CREATE INDEX IF NOT EXISTS idx_edge_alerts_sport ON edge_alerts(sport);
CREATE INDEX IF NOT EXISTS idx_edge_alerts_severity ON edge_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_edge_alerts_active ON edge_alerts(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_edge_alerts_created ON edge_alerts(created_at DESC);

-- Grant permissions
GRANT ALL ON edge_alerts TO anon, authenticated;
