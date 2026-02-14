-- =============================================================================
-- OFFICIALS SCHEMA
-- Referee/Umpire data with betting tendencies
-- =============================================================================

-- Officials table
CREATE TABLE IF NOT EXISTS officials (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  external_id TEXT,
  name TEXT NOT NULL,
  sport TEXT NOT NULL,
  role TEXT DEFAULT 'referee',
  
  -- Experience
  years_experience INTEGER DEFAULT 0,
  first_season INTEGER,
  
  -- Career betting stats
  games_officiated INTEGER DEFAULT 0,
  home_team_wins INTEGER DEFAULT 0,
  away_team_wins INTEGER DEFAULT 0,
  home_cover_pct NUMERIC(5, 2) DEFAULT 50.0,
  over_pct NUMERIC(5, 2) DEFAULT 50.0,
  avg_total_points NUMERIC(6, 2) DEFAULT 0,
  
  -- Season stats (current season)
  season_games INTEGER DEFAULT 0,
  season_home_cover_pct NUMERIC(5, 2) DEFAULT 50.0,
  season_over_pct NUMERIC(5, 2) DEFAULT 50.0,
  
  -- Sport-specific JSON (penalties, fouls, strike zone, etc.)
  advanced_stats JSONB DEFAULT '{}',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(name, sport)
);

-- Game officials junction table
CREATE TABLE IF NOT EXISTS game_officials (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  game_id TEXT NOT NULL,
  official_id UUID REFERENCES officials(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'referee',
  sport TEXT NOT NULL,
  game_date DATE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(game_id, official_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_officials_sport ON officials(sport);
CREATE INDEX IF NOT EXISTS idx_officials_name ON officials(name);
CREATE INDEX IF NOT EXISTS idx_game_officials_game ON game_officials(game_id);
CREATE INDEX IF NOT EXISTS idx_game_officials_official ON game_officials(official_id);
CREATE INDEX IF NOT EXISTS idx_game_officials_date ON game_officials(game_date DESC);

-- Enable RLS
ALTER TABLE officials ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_officials ENABLE ROW LEVEL SECURITY;

-- Public read access
DROP POLICY IF EXISTS "Officials are publicly readable" ON officials;
CREATE POLICY "Officials are publicly readable"
  ON officials FOR SELECT USING (true);

DROP POLICY IF EXISTS "Game officials are publicly readable" ON game_officials;
CREATE POLICY "Game officials are publicly readable"
  ON game_officials FOR SELECT USING (true);

-- Service role write access
DROP POLICY IF EXISTS "Service role can manage officials" ON officials;
CREATE POLICY "Service role can manage officials"
  ON officials FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role can manage game officials" ON game_officials;
CREATE POLICY "Service role can manage game officials"
  ON game_officials FOR ALL USING (auth.role() = 'service_role');

-- Grant permissions
GRANT SELECT ON officials TO authenticated, anon;
GRANT SELECT ON game_officials TO authenticated, anon;

-- Comments
COMMENT ON TABLE officials IS 'Referee and umpire data with betting tendencies';
COMMENT ON TABLE game_officials IS 'Junction table linking games to assigned officials';
COMMENT ON COLUMN officials.home_cover_pct IS 'Percentage of games where home team covers the spread';
COMMENT ON COLUMN officials.over_pct IS 'Percentage of games that go over the total';
COMMENT ON COLUMN officials.advanced_stats IS 'Sport-specific stats (penalties, fouls, strike zones)';

-- =============================================================================
-- SEED DATA - NFL Referees (from officials.ts)
-- =============================================================================

INSERT INTO officials (name, sport, role, years_experience, home_cover_pct, over_pct, avg_total_points, advanced_stats)
VALUES
  ('Carl Cheffers', 'NFL', 'referee', 25, 51.2, 52.8, 46.8, '{"penaltyYardsPerGame": 98.5, "penaltiesPerGame": 11.2, "passInterferenceCalls": 1.3, "holdingCalls": 3.8, "avgPenaltiesHome": 5.4, "avgPenaltiesAway": 5.8}'),
  ('Bill Vinovich', 'NFL', 'referee', 20, 49.5, 54.2, 48.2, '{"penaltyYardsPerGame": 92.3, "penaltiesPerGame": 10.8, "passInterferenceCalls": 1.1, "holdingCalls": 3.5, "avgPenaltiesHome": 5.2, "avgPenaltiesAway": 5.6}'),
  ('John Hussey', 'NFL', 'referee', 16, 47.8, 48.5, 44.5, '{"penaltyYardsPerGame": 102.4, "penaltiesPerGame": 11.8, "passInterferenceCalls": 1.4, "holdingCalls": 4.0, "avgPenaltiesHome": 5.6, "avgPenaltiesAway": 6.2}'),
  ('Shawn Hochuli', 'NFL', 'referee', 8, 50.2, 57.5, 49.8, '{"penaltyYardsPerGame": 95.2, "penaltiesPerGame": 11.0, "passInterferenceCalls": 1.2, "holdingCalls": 3.7, "avgPenaltiesHome": 5.3, "avgPenaltiesAway": 5.7}'),
  ('Brad Rogers', 'NFL', 'referee', 7, 53.5, 51.2, 45.2, '{"penaltyYardsPerGame": 88.9, "penaltiesPerGame": 10.2, "passInterferenceCalls": 1.0, "holdingCalls": 3.4, "avgPenaltiesHome": 5.0, "avgPenaltiesAway": 5.2}'),
  ('Craig Wrolstad', 'NFL', 'referee', 13, 48.2, 49.8, 45.5, '{"penaltyYardsPerGame": 94.5, "penaltiesPerGame": 10.9, "passInterferenceCalls": 1.1, "holdingCalls": 3.6, "avgPenaltiesHome": 5.3, "avgPenaltiesAway": 5.6}'),
  ('Alex Kemp', 'NFL', 'referee', 10, 50.8, 53.2, 47.2, '{"penaltyYardsPerGame": 96.8, "penaltiesPerGame": 11.1, "passInterferenceCalls": 1.2, "holdingCalls": 3.7, "avgPenaltiesHome": 5.4, "avgPenaltiesAway": 5.7}'),
  ('Clete Blakeman', 'NFL', 'referee', 10, 46.5, 55.8, 48.5, '{"penaltyYardsPerGame": 91.2, "penaltiesPerGame": 10.5, "passInterferenceCalls": 1.0, "holdingCalls": 3.5, "avgPenaltiesHome": 5.1, "avgPenaltiesAway": 5.4}'),
  ('Land Clark', 'NFL', 'referee', 6, 48.9, 56.3, 49.2, '{"penaltyYardsPerGame": 108.5, "penaltiesPerGame": 12.4, "passInterferenceCalls": 1.5, "holdingCalls": 4.2, "avgPenaltiesHome": 6.0, "avgPenaltiesAway": 6.4}'),
  ('Tra Blake', 'NFL', 'referee', 4, 51.5, 49.2, 44.8, '{"penaltyYardsPerGame": 88.9, "penaltiesPerGame": 10.1, "passInterferenceCalls": 0.9, "holdingCalls": 3.3, "avgPenaltiesHome": 4.9, "avgPenaltiesAway": 5.2}')
ON CONFLICT (name, sport) DO UPDATE SET
  years_experience = EXCLUDED.years_experience,
  home_cover_pct = EXCLUDED.home_cover_pct,
  over_pct = EXCLUDED.over_pct,
  avg_total_points = EXCLUDED.avg_total_points,
  advanced_stats = EXCLUDED.advanced_stats,
  updated_at = NOW();

-- NBA Referees
INSERT INTO officials (name, sport, role, years_experience, home_cover_pct, over_pct, avg_total_points, advanced_stats)
VALUES
  ('Scott Foster', 'NBA', 'referee', 30, 46.2, 48.5, 218.4, '{"foulsPerGame": 42.8, "technicalFouls": 0.8, "offensiveFouls": 4.2, "shootingFouls": 28.5, "freeThrowsPerGame": 44.2, "avgFoulsHome": 20.8, "avgFoulsAway": 22.0}'),
  ('Tony Brothers', 'NBA', 'referee', 28, 52.8, 52.1, 224.6, '{"foulsPerGame": 45.2, "technicalFouls": 1.1, "offensiveFouls": 4.8, "shootingFouls": 30.2, "freeThrowsPerGame": 48.5, "avgFoulsHome": 21.5, "avgFoulsAway": 23.7}'),
  ('Marc Davis', 'NBA', 'referee', 25, 49.5, 50.2, 220.8, '{"foulsPerGame": 43.5, "technicalFouls": 0.6, "offensiveFouls": 4.0, "shootingFouls": 29.1, "freeThrowsPerGame": 45.8, "avgFoulsHome": 21.2, "avgFoulsAway": 22.3}'),
  ('Kane Fitzgerald', 'NBA', 'referee', 15, 50.8, 47.5, 216.2, '{"foulsPerGame": 41.2, "technicalFouls": 0.5, "offensiveFouls": 3.8, "shootingFouls": 27.8, "freeThrowsPerGame": 42.5, "avgFoulsHome": 20.2, "avgFoulsAway": 21.0}'),
  ('James Capers', 'NBA', 'referee', 28, 48.2, 51.8, 222.5, '{"foulsPerGame": 44.2, "technicalFouls": 0.7, "offensiveFouls": 4.1, "shootingFouls": 29.8, "freeThrowsPerGame": 46.2, "avgFoulsHome": 21.0, "avgFoulsAway": 23.2}'),
  ('Ed Malloy', 'NBA', 'referee', 20, 51.2, 49.8, 219.5, '{"foulsPerGame": 42.8, "technicalFouls": 0.4, "offensiveFouls": 3.9, "shootingFouls": 28.5, "freeThrowsPerGame": 44.5, "avgFoulsHome": 20.8, "avgFoulsAway": 22.0}')
ON CONFLICT (name, sport) DO UPDATE SET
  years_experience = EXCLUDED.years_experience,
  home_cover_pct = EXCLUDED.home_cover_pct,
  over_pct = EXCLUDED.over_pct,
  avg_total_points = EXCLUDED.avg_total_points,
  advanced_stats = EXCLUDED.advanced_stats,
  updated_at = NOW();

-- MLB Umpires
INSERT INTO officials (name, sport, role, years_experience, home_cover_pct, over_pct, avg_total_points, advanced_stats)
VALUES
  ('Angel Hernandez', 'MLB', 'umpire', 33, 48.5, 52.5, 8.8, '{"strikeZoneAccuracy": 88.2, "ballsPerGame": 142.5, "strikesPerGame": 176.2, "walksPerGame": 6.8, "strikeoutsPerGame": 14.2, "runsPerGame": 8.8, "calledStrikePct": 55.2}'),
  ('Joe West', 'MLB', 'umpire', 45, 50.2, 47.8, 8.2, '{"strikeZoneAccuracy": 91.5, "ballsPerGame": 138.2, "strikesPerGame": 182.5, "walksPerGame": 6.2, "strikeoutsPerGame": 15.5, "runsPerGame": 8.2, "calledStrikePct": 56.8}'),
  ('CB Bucknor', 'MLB', 'umpire', 25, 49.5, 54.2, 9.2, '{"strikeZoneAccuracy": 89.5, "ballsPerGame": 145.2, "strikesPerGame": 174.8, "walksPerGame": 7.2, "strikeoutsPerGame": 13.8, "runsPerGame": 9.2, "calledStrikePct": 54.5}'),
  ('Laz Diaz', 'MLB', 'umpire', 22, 51.8, 51.5, 8.5, '{"strikeZoneAccuracy": 90.2, "ballsPerGame": 140.8, "strikesPerGame": 178.5, "walksPerGame": 6.5, "strikeoutsPerGame": 14.8, "runsPerGame": 8.5, "calledStrikePct": 55.8}'),
  ('Ron Kulpa', 'MLB', 'umpire', 25, 47.2, 49.8, 8.4, '{"strikeZoneAccuracy": 91.8, "ballsPerGame": 136.5, "strikesPerGame": 184.2, "walksPerGame": 6.0, "strikeoutsPerGame": 15.8, "runsPerGame": 8.4, "calledStrikePct": 57.2}')
ON CONFLICT (name, sport) DO UPDATE SET
  years_experience = EXCLUDED.years_experience,
  home_cover_pct = EXCLUDED.home_cover_pct,
  over_pct = EXCLUDED.over_pct,
  avg_total_points = EXCLUDED.avg_total_points,
  advanced_stats = EXCLUDED.advanced_stats,
  updated_at = NOW();

-- NHL Referees
INSERT INTO officials (name, sport, role, years_experience, home_cover_pct, over_pct, avg_total_points, advanced_stats)
VALUES
  ('Wes McCauley', 'NHL', 'referee', 22, 49.8, 51.2, 6.2, '{"penaltyMinutesPerGame": 12.5, "minorPenalties": 8.2, "majorPenalties": 0.3, "powerPlaysPerGame": 6.5, "avgPenaltiesHome": 4.0, "avgPenaltiesAway": 4.2}'),
  ('Chris Rooney', 'NHL', 'referee', 20, 51.5, 48.5, 5.8, '{"penaltyMinutesPerGame": 10.8, "minorPenalties": 7.5, "majorPenalties": 0.2, "powerPlaysPerGame": 5.8, "avgPenaltiesHome": 3.6, "avgPenaltiesAway": 3.9}'),
  ('Kevin Pollock', 'NHL', 'referee', 18, 48.2, 53.8, 6.5, '{"penaltyMinutesPerGame": 14.2, "minorPenalties": 9.0, "majorPenalties": 0.4, "powerPlaysPerGame": 7.2, "avgPenaltiesHome": 4.3, "avgPenaltiesAway": 4.7}'),
  ('Francois St. Laurent', 'NHL', 'referee', 15, 50.5, 49.5, 6.0, '{"penaltyMinutesPerGame": 11.5, "minorPenalties": 7.8, "majorPenalties": 0.3, "powerPlaysPerGame": 6.0, "avgPenaltiesHome": 3.8, "avgPenaltiesAway": 4.0}')
ON CONFLICT (name, sport) DO UPDATE SET
  years_experience = EXCLUDED.years_experience,
  home_cover_pct = EXCLUDED.home_cover_pct,
  over_pct = EXCLUDED.over_pct,
  avg_total_points = EXCLUDED.avg_total_points,
  advanced_stats = EXCLUDED.advanced_stats,
  updated_at = NOW();
