-- Edge Alerts Schema
-- Stores real-time betting edge alerts (RLM, Steam, CLV, Arbitrage)
-- SAFE TO RUN: Uses IF NOT EXISTS and handles existing tables

-- Create edge_alerts table
CREATE TABLE IF NOT EXISTS edge_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id TEXT NOT NULL,
  sport TEXT NOT NULL DEFAULT 'NFL',
  type TEXT NOT NULL CHECK (type IN ('rlm', 'steam', 'sharp', 'clv', 'arbitrage', 'injury', 'weather')),
  severity TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('critical', 'high', 'medium', 'low')),
  confidence INTEGER DEFAULT 0 CHECK (confidence >= 0 AND confidence <= 100),
  message TEXT NOT NULL,
  home_team TEXT,
  away_team TEXT,
  source TEXT DEFAULT 'system',
  data JSONB DEFAULT '{}',
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '6 hours'),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes (safe - only if not exists)
CREATE INDEX IF NOT EXISTS idx_edge_alerts_game_id ON edge_alerts(game_id);
CREATE INDEX IF NOT EXISTS idx_edge_alerts_sport ON edge_alerts(sport);
CREATE INDEX IF NOT EXISTS idx_edge_alerts_type ON edge_alerts(type);
CREATE INDEX IF NOT EXISTS idx_edge_alerts_expires_at ON edge_alerts(expires_at);
CREATE INDEX IF NOT EXISTS idx_edge_alerts_created_at ON edge_alerts(created_at DESC);

-- Enable RLS
ALTER TABLE edge_alerts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Edge alerts are publicly readable" ON edge_alerts;
DROP POLICY IF EXISTS "Service role can manage edge alerts" ON edge_alerts;

-- Allow public read access
CREATE POLICY "Edge alerts are publicly readable" 
  ON edge_alerts FOR SELECT 
  USING (expires_at > NOW());

-- Allow service role to insert/update/delete
CREATE POLICY "Service role can manage edge alerts"
  ON edge_alerts FOR ALL 
  USING (auth.role() = 'service_role');

-- ============================================================================
-- Add sport column to existing odds_history if missing
-- ============================================================================
DO $$
BEGIN
  -- Add sport column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'odds_history' AND column_name = 'sport'
  ) THEN
    ALTER TABLE odds_history ADD COLUMN sport TEXT DEFAULT 'NFL';
  END IF;
  
  -- Add home_team column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'odds_history' AND column_name = 'home_team'
  ) THEN
    ALTER TABLE odds_history ADD COLUMN home_team TEXT;
  END IF;
  
  -- Add away_team column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'odds_history' AND column_name = 'away_team'
  ) THEN
    ALTER TABLE odds_history ADD COLUMN away_team TEXT;
  END IF;
  
  -- Add spread column if it doesn't exist  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'odds_history' AND column_name = 'spread'
  ) THEN
    ALTER TABLE odds_history ADD COLUMN spread DECIMAL(5,2);
  END IF;
  
  -- Add total column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'odds_history' AND column_name = 'total'
  ) THEN
    ALTER TABLE odds_history ADD COLUMN total DECIMAL(5,2);
  END IF;

  -- Add timestamp column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'odds_history' AND column_name = 'timestamp'
  ) THEN
    ALTER TABLE odds_history ADD COLUMN timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;
END $$;

-- Create indexes on odds_history for the new columns
CREATE INDEX IF NOT EXISTS idx_odds_history_sport ON odds_history(sport);
CREATE INDEX IF NOT EXISTS idx_odds_history_timestamp ON odds_history(timestamp DESC);

-- ============================================================================
-- Add sport column to existing betting_splits if missing
-- ============================================================================
DO $$
BEGIN
  -- Add sport column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'betting_splits' AND column_name = 'sport'
  ) THEN
    ALTER TABLE betting_splits ADD COLUMN sport TEXT DEFAULT 'NFL';
  END IF;
  
  -- Add home_team column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'betting_splits' AND column_name = 'home_team'
  ) THEN
    ALTER TABLE betting_splits ADD COLUMN home_team TEXT;
  END IF;
  
  -- Add away_team column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'betting_splits' AND column_name = 'away_team'
  ) THEN
    ALTER TABLE betting_splits ADD COLUMN away_team TEXT;
  END IF;
END $$;

-- Create index on betting_splits sport
CREATE INDEX IF NOT EXISTS idx_betting_splits_sport ON betting_splits(sport);

-- ============================================================================
-- Line Movement Tracking Table (for detailed line history per book)
-- ============================================================================
CREATE TABLE IF NOT EXISTS line_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id TEXT NOT NULL,
  sport TEXT NOT NULL DEFAULT 'NFL',
  sportsbook TEXT NOT NULL,
  home_team TEXT,
  away_team TEXT,
  line_type TEXT NOT NULL CHECK (line_type IN ('spread', 'total', 'moneyline')),
  line_value DECIMAL(10,2),
  odds INTEGER,
  -- For spread: positive = home favored, negative = away favored
  -- For total: the O/U number
  -- For moneyline: the juice
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_line_movements_game ON line_movements(game_id);
CREATE INDEX IF NOT EXISTS idx_line_movements_sport ON line_movements(sport);
CREATE INDEX IF NOT EXISTS idx_line_movements_book ON line_movements(sportsbook);
CREATE INDEX IF NOT EXISTS idx_line_movements_time ON line_movements(recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_line_movements_game_book ON line_movements(game_id, sportsbook, line_type);

-- Enable RLS
ALTER TABLE line_movements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Line movements are publicly readable" ON line_movements;
CREATE POLICY "Line movements are publicly readable" 
  ON line_movements FOR SELECT USING (true);

DROP POLICY IF EXISTS "Service role can manage line movements" ON line_movements;
CREATE POLICY "Service role can manage line movements"
  ON line_movements FOR ALL USING (auth.role() = 'service_role');

-- ============================================================================
-- Historical Games Table (for 25 years of data)
-- ============================================================================
CREATE TABLE IF NOT EXISTS historical_games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id TEXT,
  sport TEXT NOT NULL,
  season_year INTEGER NOT NULL,
  season_type TEXT DEFAULT 'regular' CHECK (season_type IN ('preseason', 'regular', 'postseason')),
  week_number INTEGER,
  game_date DATE NOT NULL,
  
  -- Teams
  home_team TEXT NOT NULL,
  away_team TEXT NOT NULL,
  home_team_abbr TEXT,
  away_team_abbr TEXT,
  
  -- Final scores
  home_score INTEGER NOT NULL,
  away_score INTEGER NOT NULL,
  
  -- Opening lines
  open_spread DECIMAL(5,2),
  open_total DECIMAL(5,2),
  open_home_ml INTEGER,
  open_away_ml INTEGER,
  
  -- Closing lines
  close_spread DECIMAL(5,2),
  close_total DECIMAL(5,2),
  close_home_ml INTEGER,
  close_away_ml INTEGER,
  
  -- Results
  spread_result TEXT CHECK (spread_result IN ('home_cover', 'away_cover', 'push')),
  total_result TEXT CHECK (total_result IN ('over', 'under', 'push')),
  
  -- Betting metrics
  public_spread_pct INTEGER, -- % on favorite
  public_total_pct INTEGER, -- % on over
  
  -- Weather (for outdoor sports)
  temperature INTEGER,
  wind_speed INTEGER,
  precipitation TEXT,
  
  -- Venue
  venue TEXT,
  is_neutral_site BOOLEAN DEFAULT false,
  
  -- Metadata
  data_source TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_historical_sport ON historical_games(sport);
CREATE INDEX IF NOT EXISTS idx_historical_season ON historical_games(season_year);
CREATE INDEX IF NOT EXISTS idx_historical_date ON historical_games(game_date);
CREATE INDEX IF NOT EXISTS idx_historical_teams ON historical_games(home_team, away_team);
CREATE INDEX IF NOT EXISTS idx_historical_sport_season ON historical_games(sport, season_year);
CREATE INDEX IF NOT EXISTS idx_historical_spread_result ON historical_games(spread_result);
CREATE INDEX IF NOT EXISTS idx_historical_total_result ON historical_games(total_result);

-- Enable RLS
ALTER TABLE historical_games ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Historical games are publicly readable" ON historical_games;
CREATE POLICY "Historical games are publicly readable" 
  ON historical_games FOR SELECT USING (true);

DROP POLICY IF EXISTS "Service role can manage historical games" ON historical_games;
CREATE POLICY "Service role can manage historical games"
  ON historical_games FOR ALL USING (auth.role() = 'service_role');

-- ============================================================================
-- Discovered Trends Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS discovered_trends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  sport TEXT NOT NULL,
  
  -- Trend criteria (stored as JSON for flexibility)
  criteria JSONB NOT NULL,
  -- Example: {"home_favorite": true, "spread_range": [-7, -3], "conference_game": true}
  
  -- Performance metrics
  sample_size INTEGER NOT NULL,
  wins INTEGER NOT NULL,
  losses INTEGER NOT NULL,
  pushes INTEGER DEFAULT 0,
  win_rate DECIMAL(5,2) NOT NULL,
  roi DECIMAL(8,2), -- Return on investment percentage
  
  -- Statistical significance
  z_score DECIMAL(6,3),
  p_value DECIMAL(6,4),
  is_statistically_significant BOOLEAN DEFAULT false,
  
  -- Time range
  start_year INTEGER NOT NULL,
  end_year INTEGER NOT NULL,
  
  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'testing')),
  last_verified_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_trends_sport ON discovered_trends(sport);
CREATE INDEX IF NOT EXISTS idx_trends_win_rate ON discovered_trends(win_rate DESC);
CREATE INDEX IF NOT EXISTS idx_trends_significant ON discovered_trends(is_statistically_significant);

-- Enable RLS
ALTER TABLE discovered_trends ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Trends are publicly readable" ON discovered_trends;
CREATE POLICY "Trends are publicly readable" 
  ON discovered_trends FOR SELECT USING (true);

DROP POLICY IF EXISTS "Service role can manage trends" ON discovered_trends;
CREATE POLICY "Service role can manage trends"
  ON discovered_trends FOR ALL USING (auth.role() = 'service_role');

-- Function to auto-cleanup expired alerts
CREATE OR REPLACE FUNCTION cleanup_expired_alerts()
RETURNS void AS $$
BEGIN
  DELETE FROM edge_alerts WHERE expires_at < NOW() - INTERVAL '1 day';
END;
$$ LANGUAGE plpgsql;

-- Comments for documentation
COMMENT ON TABLE edge_alerts IS 'Real-time edge alerts for betting opportunities (RLM, Steam, CLV, Arbitrage)';
COMMENT ON TABLE line_movements IS 'Detailed line movement history per sportsbook';
COMMENT ON TABLE historical_games IS '25 years of historical game data for trend analysis';
COMMENT ON TABLE discovered_trends IS 'AI-discovered betting trends from historical analysis';
