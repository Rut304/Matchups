-- =============================================================================
-- EXPERT PICKS TRACKING SCHEMA
-- Tables for tracking expert picks from ESPN, Covers.com, Action Network, etc.
-- =============================================================================

-- Drop existing tables for clean re-run (comment out in production)
DROP TABLE IF EXISTS expert_pick_results CASCADE;
DROP TABLE IF EXISTS expert_picks CASCADE;
DROP TABLE IF EXISTS expert_records CASCADE;
DROP TABLE IF EXISTS expert_consensus CASCADE;

-- =============================================================================
-- EXPERT RECORDS TABLE
-- Stores overall records for tracked experts
-- =============================================================================
CREATE TABLE expert_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Expert identification
  name VARCHAR(255) NOT NULL,
  source VARCHAR(50) NOT NULL, -- 'espn', 'covers', 'action_network', 'manual'
  sport VARCHAR(20) NOT NULL,
  
  -- Profile info
  title VARCHAR(255), -- "Senior NFL Analyst", etc.
  image_url TEXT,
  profile_url TEXT,
  
  -- Season record
  season_wins INTEGER DEFAULT 0,
  season_losses INTEGER DEFAULT 0,
  season_pushes INTEGER DEFAULT 0,
  season_win_pct DECIMAL(5,2) DEFAULT 0,
  season_units DECIMAL(10,2) DEFAULT 0, -- Profit/loss in units if tracked
  season_roi DECIMAL(5,2) DEFAULT 0,
  
  -- All-time record (if available)
  all_time_wins INTEGER DEFAULT 0,
  all_time_losses INTEGER DEFAULT 0,
  all_time_pushes INTEGER DEFAULT 0,
  all_time_win_pct DECIMAL(5,2) DEFAULT 0,
  
  -- Streak tracking
  current_streak_type VARCHAR(1), -- 'W' or 'L'
  current_streak_length INTEGER DEFAULT 0,
  
  -- Last week record (for weekly reporting)
  last_week_wins INTEGER DEFAULT 0,
  last_week_losses INTEGER DEFAULT 0,
  
  -- Meta
  is_verified BOOLEAN DEFAULT false, -- Have we manually verified their record?
  verification_notes TEXT,
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(name, source, sport)
);

-- =============================================================================
-- EXPERT PICKS TABLE  
-- Individual picks made by experts
-- =============================================================================
CREATE TABLE expert_picks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Expert reference
  expert_name VARCHAR(255) NOT NULL,
  source VARCHAR(50) NOT NULL,
  sport VARCHAR(20) NOT NULL,
  
  -- Game identification
  game_id VARCHAR(255) NOT NULL, -- External game ID
  espn_game_id VARCHAR(50), -- ESPN's game ID if available
  home_team VARCHAR(100) NOT NULL,
  away_team VARCHAR(100) NOT NULL,
  game_date DATE NOT NULL,
  game_time TIMESTAMPTZ,
  
  -- The pick
  pick VARCHAR(100) NOT NULL, -- Team name or "Over"/"Under"
  pick_type VARCHAR(20) NOT NULL, -- 'spread', 'moneyline', 'total', 'straight_up', 'ats'
  pick_side VARCHAR(20), -- 'home', 'away', 'over', 'under'
  
  -- Line at time of pick
  spread DECIMAL(5,2),
  total DECIMAL(5,2),
  moneyline INTEGER,
  
  -- Confidence indicators
  confidence VARCHAR(20) DEFAULT 'standard', -- 'lock', 'lean', 'upset', 'standard'
  is_lock BOOLEAN DEFAULT false,
  
  -- Result tracking (filled in after game)
  result VARCHAR(10), -- 'win', 'loss', 'push', 'pending'
  actual_spread_result VARCHAR(50), -- e.g., "Chiefs -7 (covered by 3)"
  result_updated_at TIMESTAMPTZ,
  
  -- Source details
  source_url TEXT, -- URL where pick was made
  quote TEXT, -- What they said about the pick
  
  -- Meta
  scraped_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(expert_name, source, game_id)
);

-- =============================================================================
-- EXPERT CONSENSUS TABLE
-- Aggregated consensus from multiple sources
-- =============================================================================
CREATE TABLE expert_consensus (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Game identification
  game_id VARCHAR(255) NOT NULL,
  sport VARCHAR(20) NOT NULL,
  home_team VARCHAR(100) NOT NULL,
  away_team VARCHAR(100) NOT NULL,
  game_date DATE NOT NULL,
  game_time TIMESTAMPTZ,
  
  -- Spread consensus
  spread_home_pct DECIMAL(5,2),
  spread_away_pct DECIMAL(5,2),
  spread_total_experts INTEGER,
  
  -- Total (O/U) consensus
  total_over_pct DECIMAL(5,2),
  total_under_pct DECIMAL(5,2),
  total_total_experts INTEGER,
  
  -- Moneyline consensus
  ml_home_pct DECIMAL(5,2),
  ml_away_pct DECIMAL(5,2),
  ml_total_experts INTEGER,
  
  -- Lines
  current_spread DECIMAL(5,2),
  current_total DECIMAL(5,2),
  opening_spread DECIMAL(5,2),
  opening_total DECIMAL(5,2),
  
  -- Source
  source VARCHAR(50) NOT NULL, -- 'covers', 'espn', 'action_network'
  
  -- Results (filled after game)
  spread_result VARCHAR(50), -- 'home_covered', 'away_covered', 'push'
  total_result VARCHAR(50), -- 'over', 'under', 'push'
  final_score VARCHAR(50), -- e.g., "Chiefs 34, Raiders 27"
  result_updated_at TIMESTAMPTZ,
  
  -- Meta
  scraped_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(game_id, source)
);

-- =============================================================================
-- INDEXES
-- =============================================================================

-- Expert records lookups
CREATE INDEX idx_er_source ON expert_records(source);
CREATE INDEX idx_er_sport ON expert_records(sport);
CREATE INDEX idx_er_win_pct ON expert_records(season_win_pct DESC);
CREATE INDEX idx_er_updated ON expert_records(last_updated);

-- Expert picks lookups
CREATE INDEX idx_ep_expert ON expert_picks(expert_name, source);
CREATE INDEX idx_ep_game ON expert_picks(game_id);
CREATE INDEX idx_ep_date ON expert_picks(game_date);
CREATE INDEX idx_ep_result ON expert_picks(result) WHERE result IS NOT NULL;
CREATE INDEX idx_ep_pending ON expert_picks(result) WHERE result = 'pending' OR result IS NULL;

-- Consensus lookups
CREATE INDEX idx_ec_game ON expert_consensus(game_id);
CREATE INDEX idx_ec_date ON expert_consensus(game_date);
CREATE INDEX idx_ec_sport ON expert_consensus(sport);

-- =============================================================================
-- RLS POLICIES
-- =============================================================================

ALTER TABLE expert_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE expert_picks ENABLE ROW LEVEL SECURITY;
ALTER TABLE expert_consensus ENABLE ROW LEVEL SECURITY;

-- Public read access
DROP POLICY IF EXISTS "Public read expert_records" ON expert_records;
CREATE POLICY "Public read expert_records" ON expert_records FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read expert_picks" ON expert_picks;
CREATE POLICY "Public read expert_picks" ON expert_picks FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read expert_consensus" ON expert_consensus;
CREATE POLICY "Public read expert_consensus" ON expert_consensus FOR SELECT USING (true);

-- Service role full access (for scrapers)
DROP POLICY IF EXISTS "Service write expert_records" ON expert_records;
CREATE POLICY "Service write expert_records" ON expert_records 
  FOR ALL USING (true);

DROP POLICY IF EXISTS "Service write expert_picks" ON expert_picks;
CREATE POLICY "Service write expert_picks" ON expert_picks 
  FOR ALL USING (true);

DROP POLICY IF EXISTS "Service write expert_consensus" ON expert_consensus;
CREATE POLICY "Service write expert_consensus" ON expert_consensus 
  FOR ALL USING (true);

-- =============================================================================
-- FUNCTIONS
-- =============================================================================

-- Update expert record when picks are graded
CREATE OR REPLACE FUNCTION update_expert_record_on_pick_result()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.result IS NOT NULL AND (OLD.result IS NULL OR OLD.result = 'pending') THEN
    -- Update the expert's record based on the result
    UPDATE expert_records
    SET 
      season_wins = season_wins + CASE WHEN NEW.result = 'win' THEN 1 ELSE 0 END,
      season_losses = season_losses + CASE WHEN NEW.result = 'loss' THEN 1 ELSE 0 END,
      season_pushes = season_pushes + CASE WHEN NEW.result = 'push' THEN 1 ELSE 0 END,
      season_win_pct = CASE 
        WHEN (season_wins + season_losses + CASE WHEN NEW.result IN ('win', 'loss') THEN 1 ELSE 0 END) > 0
        THEN (season_wins + CASE WHEN NEW.result = 'win' THEN 1 ELSE 0 END)::DECIMAL / 
             (season_wins + season_losses + CASE WHEN NEW.result IN ('win', 'loss') THEN 1 ELSE 0 END) * 100
        ELSE 0
      END,
      current_streak_type = CASE 
        WHEN NEW.result = 'win' AND (current_streak_type = 'W' OR current_streak_type IS NULL) THEN 'W'
        WHEN NEW.result = 'loss' AND (current_streak_type = 'L' OR current_streak_type IS NULL) THEN 'L'
        WHEN NEW.result IN ('win', 'loss') THEN UPPER(LEFT(NEW.result, 1))
        ELSE current_streak_type
      END,
      current_streak_length = CASE
        WHEN NEW.result = 'push' THEN current_streak_length
        WHEN (NEW.result = 'win' AND current_streak_type = 'W') OR
             (NEW.result = 'loss' AND current_streak_type = 'L') THEN current_streak_length + 1
        ELSE 1
      END,
      last_updated = NOW()
    WHERE name = NEW.expert_name 
      AND source = NEW.source 
      AND sport = NEW.sport;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS expert_pick_result_trigger ON expert_picks;
CREATE TRIGGER expert_pick_result_trigger
  AFTER UPDATE ON expert_picks
  FOR EACH ROW
  WHEN (NEW.result IS DISTINCT FROM OLD.result)
  EXECUTE FUNCTION update_expert_record_on_pick_result();

-- Function to get expert leaderboard
CREATE OR REPLACE FUNCTION get_expert_leaderboard(
  p_sport VARCHAR DEFAULT NULL,
  p_source VARCHAR DEFAULT NULL,
  p_min_picks INTEGER DEFAULT 10
)
RETURNS TABLE (
  name VARCHAR(255),
  source VARCHAR(50),
  sport VARCHAR(20),
  wins INTEGER,
  losses INTEGER,
  win_pct DECIMAL(5,2),
  units DECIMAL(10,2),
  streak VARCHAR(10)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    er.name,
    er.source,
    er.sport,
    er.season_wins,
    er.season_losses,
    er.season_win_pct,
    er.season_units,
    CONCAT(er.current_streak_type, er.current_streak_length::VARCHAR)
  FROM expert_records er
  WHERE (p_sport IS NULL OR er.sport = p_sport)
    AND (p_source IS NULL OR er.source = p_source)
    AND (er.season_wins + er.season_losses) >= p_min_picks
  ORDER BY er.season_win_pct DESC, er.season_wins DESC;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- SEED DATA: Known experts to track
-- =============================================================================

INSERT INTO expert_records (name, source, sport, title, is_verified) VALUES
-- ESPN NFL Experts
('Dan Graziano', 'espn', 'NFL', 'Senior NFL Writer', false),
('Jeremy Fowler', 'espn', 'NFL', 'NFL Nation Reporter', false),
('Matt Bowen', 'espn', 'NFL', 'Former NFL Safety', false),
('Mike Clay', 'espn', 'NFL', 'NFL Fantasy Analyst', false),
('Seth Walder', 'espn', 'NFL', 'Stats & Analytics Writer', false),

-- Covers.com Experts
('Jason Logan', 'covers', 'NFL', 'Senior Betting Analyst', false),
('Neil Parker', 'covers', 'NFL', 'Betting Analyst', false),
('Rohit Ponnaiya', 'covers', 'NFL', 'Betting Analyst', false),

-- Action Network (tracked from app)
('Sean Koerner', 'action_network', 'NFL', 'Director of Predictive Analytics', false),
('Chris Raybon', 'action_network', 'NFL', 'Staff Writer', false),
('Stuckey', 'action_network', 'NFL', 'Pro Bettor', false)

ON CONFLICT (name, source, sport) DO NOTHING;

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE expert_records IS 'Tracks overall records for sports betting experts from various sources';
COMMENT ON TABLE expert_picks IS 'Individual picks made by experts, with result tracking';
COMMENT ON TABLE expert_consensus IS 'Aggregated consensus data from multiple sources';
COMMENT ON COLUMN expert_picks.confidence IS 'lock=high confidence, lean=slight favorite, upset=going against consensus';
