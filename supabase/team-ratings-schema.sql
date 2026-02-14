-- =============================================================================
-- TEAM RATINGS SCHEMA
-- Elo ratings and power rankings for all 6 sports
-- Updated after each game from historical_games data
-- =============================================================================

-- Team ratings table
CREATE TABLE IF NOT EXISTS team_ratings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sport TEXT NOT NULL,
  team_abbr TEXT NOT NULL,
  team_name TEXT NOT NULL,
  
  -- Elo rating (1500 = average)
  elo_rating NUMERIC(8, 2) DEFAULT 1500,
  elo_rank INTEGER,
  
  -- Power rating (offensive + defensive strength)
  power_rating NUMERIC(6, 2) DEFAULT 0,
  off_rating NUMERIC(6, 2) DEFAULT 0,  -- Points scored above/below average
  def_rating NUMERIC(6, 2) DEFAULT 0,  -- Points allowed above/below average
  
  -- Record context
  season INTEGER NOT NULL DEFAULT 2024,
  games_played INTEGER DEFAULT 0,
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  
  -- Trend data
  last_5_elo_change NUMERIC(6, 2) DEFAULT 0,
  peak_elo NUMERIC(8, 2) DEFAULT 1500,
  low_elo NUMERIC(8, 2) DEFAULT 1500,
  
  -- Timestamps
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Unique constraint
  UNIQUE(sport, team_abbr, season)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_team_ratings_sport ON team_ratings(sport);
CREATE INDEX IF NOT EXISTS idx_team_ratings_team ON team_ratings(team_abbr);
CREATE INDEX IF NOT EXISTS idx_team_ratings_elo ON team_ratings(elo_rating DESC);
CREATE INDEX IF NOT EXISTS idx_team_ratings_sport_season ON team_ratings(sport, season);

-- Enable RLS
ALTER TABLE team_ratings ENABLE ROW LEVEL SECURITY;

-- Public read access
DROP POLICY IF EXISTS "Team ratings are publicly readable" ON team_ratings;
CREATE POLICY "Team ratings are publicly readable"
  ON team_ratings FOR SELECT USING (true);

-- Service role write access
DROP POLICY IF EXISTS "Service role can manage team ratings" ON team_ratings;
CREATE POLICY "Service role can manage team ratings"
  ON team_ratings FOR ALL USING (auth.role() = 'service_role');

-- Grant permissions
GRANT SELECT ON team_ratings TO authenticated, anon;

-- Historical Elo snapshots (for trend charts)
CREATE TABLE IF NOT EXISTS elo_history (
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
  result TEXT, -- 'W' or 'L'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_elo_history_team ON elo_history(sport, team_abbr, season);
CREATE INDEX IF NOT EXISTS idx_elo_history_date ON elo_history(game_date DESC);

ALTER TABLE elo_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Elo history is publicly readable" ON elo_history;
CREATE POLICY "Elo history is publicly readable"
  ON elo_history FOR SELECT USING (true);

DROP POLICY IF EXISTS "Service role can manage elo history" ON elo_history;
CREATE POLICY "Service role can manage elo history"
  ON elo_history FOR ALL USING (auth.role() = 'service_role');

GRANT SELECT ON elo_history TO authenticated, anon;

-- Comments
COMMENT ON TABLE team_ratings IS 'Current Elo ratings and power rankings for all teams across 6 sports';
COMMENT ON TABLE elo_history IS 'Historical Elo rating changes after each game for trend analysis';
COMMENT ON COLUMN team_ratings.elo_rating IS '1500 = league average. Higher = better. Range typically 1200-1800';
COMMENT ON COLUMN team_ratings.power_rating IS 'Net points per game above/below average. Based on off_rating - def_rating adjusted';
