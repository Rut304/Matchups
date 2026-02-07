-- =============================================================================
-- AI-DISCOVERED PATTERNS SCHEMA
-- Table for storing patterns discovered by AI Pattern Discovery system
-- Implements Recursive Continuous Improvement (RCI) tracking
-- =============================================================================

-- Drop existing objects for clean re-run
DROP TABLE IF EXISTS discovered_pattern_matches CASCADE;
DROP TABLE IF EXISTS discovered_patterns CASCADE;

-- Main patterns table
CREATE TABLE discovered_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Basic info
  name VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  sport TEXT[] NOT NULL, -- Array of sports (e.g., ['NFL', 'NBA'])
  category VARCHAR(50) NOT NULL CHECK (category IN (
    'statistical', 'behavioral', 'situational', 'correlation', 
    'anomaly', 'ai-discovered', 'user-submitted'
  )),
  
  -- Pattern conditions (array of condition strings)
  conditions TEXT[] NOT NULL,
  sql_query TEXT, -- Optional: SQL query that validates this pattern
  
  -- Historical performance
  historical_record JSONB NOT NULL DEFAULT '{
    "wins": 0,
    "losses": 0,
    "pushes": 0,
    "win_rate": 0,
    "roi": 0
  }'::jsonb,
  sample_size INTEGER NOT NULL DEFAULT 0,
  
  -- AI/Confidence scoring
  confidence_score INTEGER NOT NULL DEFAULT 50 CHECK (confidence_score >= 0 AND confidence_score <= 100),
  ai_reasoning TEXT, -- AI's explanation for why this pattern exists
  
  -- Lifecycle tracking
  discovery_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_validated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_active BOOLEAN NOT NULL DEFAULT true,
  validation_status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (validation_status IN (
    'pending', 'validated', 'rejected', 'needs_review', 'experimental'
  )),
  
  -- Human review
  human_notes TEXT,
  reviewed_by VARCHAR(255),
  reviewed_at TIMESTAMPTZ,
  
  -- RCI (Recursive Continuous Improvement) tracking
  improvement_count INTEGER NOT NULL DEFAULT 0,
  last_improved TIMESTAMPTZ,
  parent_pattern_id UUID REFERENCES discovered_patterns(id), -- If this is a refinement of another pattern
  child_pattern_ids UUID[], -- Patterns derived from this one
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table to track when patterns match current games
CREATE TABLE discovered_pattern_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pattern_id UUID NOT NULL REFERENCES discovered_patterns(id) ON DELETE CASCADE,
  
  -- Game info
  game_id VARCHAR(255) NOT NULL,
  sport VARCHAR(20) NOT NULL,
  home_team VARCHAR(100) NOT NULL,
  away_team VARCHAR(100) NOT NULL,
  game_date DATE NOT NULL,
  
  -- Match details
  matched_conditions TEXT[],
  confidence_score INTEGER NOT NULL DEFAULT 50,
  recommended_bet VARCHAR(100),
  predicted_edge DECIMAL(5,2),
  
  -- Result tracking (filled in after game completes)
  actual_result VARCHAR(20), -- 'win', 'loss', 'push', 'pending'
  actual_margin DECIMAL(5,2),
  
  -- Timestamps
  matched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  result_updated_at TIMESTAMPTZ
);

-- =============================================================================
-- INDEXES
-- =============================================================================

-- Pattern lookups
CREATE INDEX idx_dp_sport ON discovered_patterns USING GIN(sport);
CREATE INDEX idx_dp_category ON discovered_patterns(category);
CREATE INDEX idx_dp_validation_status ON discovered_patterns(validation_status);
CREATE INDEX idx_dp_confidence ON discovered_patterns(confidence_score DESC);
CREATE INDEX idx_dp_active ON discovered_patterns(is_active) WHERE is_active = true;
CREATE INDEX idx_dp_last_validated ON discovered_patterns(last_validated);

-- Match lookups
CREATE INDEX idx_dpm_pattern ON discovered_pattern_matches(pattern_id);
CREATE INDEX idx_dpm_game_date ON discovered_pattern_matches(game_date);
CREATE INDEX idx_dpm_result ON discovered_pattern_matches(actual_result) WHERE actual_result IS NOT NULL;

-- =============================================================================
-- RLS POLICIES
-- =============================================================================

ALTER TABLE discovered_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE discovered_pattern_matches ENABLE ROW LEVEL SECURITY;

-- Patterns: Anyone can read active validated patterns
DROP POLICY IF EXISTS "Public read validated patterns" ON discovered_patterns;
CREATE POLICY "Public read validated patterns" ON discovered_patterns
  FOR SELECT USING (is_active = true AND validation_status IN ('validated', 'experimental'));

-- Admin can do everything
DROP POLICY IF EXISTS "Admin full access patterns" ON discovered_patterns;
CREATE POLICY "Admin full access patterns" ON discovered_patterns
  FOR ALL USING (true);

-- Matches: Public read
DROP POLICY IF EXISTS "Public read pattern matches" ON discovered_pattern_matches;
CREATE POLICY "Public read pattern matches" ON discovered_pattern_matches
  FOR SELECT USING (true);

-- =============================================================================
-- FUNCTIONS
-- =============================================================================

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_discovered_pattern_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS dp_timestamp ON discovered_patterns;
CREATE TRIGGER dp_timestamp
  BEFORE UPDATE ON discovered_patterns
  FOR EACH ROW
  EXECUTE FUNCTION update_discovered_pattern_timestamp();

-- Function to calculate pattern win rate
CREATE OR REPLACE FUNCTION calculate_pattern_stats(p_pattern_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_record JSONB;
  v_wins INTEGER;
  v_losses INTEGER;
  v_pushes INTEGER;
  v_total INTEGER;
BEGIN
  SELECT 
    COUNT(*) FILTER (WHERE actual_result = 'win'),
    COUNT(*) FILTER (WHERE actual_result = 'loss'),
    COUNT(*) FILTER (WHERE actual_result = 'push'),
    COUNT(*) FILTER (WHERE actual_result IS NOT NULL)
  INTO v_wins, v_losses, v_pushes, v_total
  FROM discovered_pattern_matches
  WHERE pattern_id = p_pattern_id;
  
  v_record := jsonb_build_object(
    'wins', v_wins,
    'losses', v_losses,
    'pushes', v_pushes,
    'win_rate', CASE WHEN (v_wins + v_losses) > 0 
      THEN ROUND(v_wins::numeric / (v_wins + v_losses) * 100, 1) 
      ELSE 0 END,
    'sample_size', v_total
  );
  
  RETURN v_record;
END;
$$ LANGUAGE plpgsql;

-- Function to mark patterns needing review after poor performance
CREATE OR REPLACE FUNCTION check_pattern_performance()
RETURNS void AS $$
BEGIN
  -- Mark patterns with recent losing streak as needing review
  UPDATE discovered_patterns dp
  SET 
    validation_status = 'needs_review',
    updated_at = NOW()
  WHERE is_active = true
    AND validation_status = 'validated'
    AND EXISTS (
      SELECT 1 FROM discovered_pattern_matches dpm
      WHERE dpm.pattern_id = dp.id
        AND dpm.actual_result = 'loss'
        AND dpm.game_date >= CURRENT_DATE - INTERVAL '7 days'
      GROUP BY dpm.pattern_id
      HAVING COUNT(*) >= 5
        AND SUM(CASE WHEN actual_result = 'loss' THEN 1 ELSE 0 END)::float / COUNT(*) > 0.6
    );
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- SEED DATA: Initial AI-discovered patterns for demo
-- =============================================================================

INSERT INTO discovered_patterns (
  name, description, sport, category, conditions, 
  historical_record, sample_size, confidence_score, 
  ai_reasoning, validation_status
) VALUES
(
  'Monday Night Letdown Spot',
  'Teams coming off emotional division wins on Sunday tend to underperform in Monday night games the following week',
  ARRAY['NFL'],
  'behavioral',
  ARRAY['Won divisional game previous week', 'Playing Monday Night Football', 'Road team', 'Favored by less than 7'],
  '{"wins": 156, "losses": 112, "pushes": 8, "win_rate": 58.2, "roi": 11.4}'::jsonb,
  276,
  75,
  'Teams experience emotional hangover after big divisional wins. The national spotlight adds pressure, and short preparation for road games compounds the effect. Betting against these teams (taking the opponent) has shown consistent value.',
  'validated'
),
(
  'Cross-Country Flight Under',
  'Games where one team travels 2+ time zones tend to go under the total in first half',
  ARRAY['NBA', 'NHL'],
  'situational',
  ARRAY['One team traveled 2+ time zones', 'Game starts before 7pm local', 'First half total'],
  '{"wins": 423, "losses": 367, "pushes": 22, "win_rate": 53.5, "roi": 5.8}'::jsonb,
  812,
  68,
  'Circadian rhythm disruption affects early game performance. Teams tend to start slowly, leading to lower-scoring first halves. Effect is strongest for West Coast teams playing early East Coast games.',
  'validated'
),
(
  'Referee Crew Home Bias Fade',
  'Specific referee crews show consistent home team bias above league average, creating fade opportunities',
  ARRAY['NBA', 'NFL'],
  'statistical',
  ARRAY['Referee crew with >55% home foul differential', 'Home team favored by 5+', 'Division game'],
  '{"wins": 89, "losses": 67, "pushes": 4, "win_rate": 57.1, "roi": 9.2}'::jsonb,
  160,
  72,
  'Certain referee crews consistently call more fouls on road teams. When combined with large spreads in divisional games, fading the home team becomes profitable as the bias is already priced into lines.',
  'experimental'
),
(
  'Star Player Return Under',
  'Games where a star player returns from 5+ game absence tend to go under the total',
  ARRAY['NBA', 'NFL'],
  'correlation',
  ARRAY['Star player (top 20 in salary) returning', 'Missed 5+ consecutive games', 'Team total over 105'],
  '{"wins": 67, "losses": 51, "pushes": 3, "win_rate": 56.8, "roi": 8.9}'::jsonb,
  121,
  70,
  'Star players returning from extended absence disrupt team chemistry and offensive rhythm. Teams often run more plays through the returning player, reducing overall efficiency. The market tends to overreact to star returns.',
  'validated'
),
(
  'Post-Trade Deadline Momentum',
  'Teams that made significant trades perform well ATS in first 3 games after deadline',
  ARRAY['NBA', 'NHL', 'MLB'],
  'behavioral',
  ARRAY['Made significant acquisition at deadline', 'First 3 games post-deadline', 'Home game'],
  '{"wins": 234, "losses": 189, "pushes": 11, "win_rate": 55.3, "roi": 7.4}'::jsonb,
  434,
  69,
  'New acquisitions create energy and optimism. Teams often overperform early due to adrenaline and motivation. Market takes time to adjust to new team compositions. Effect fades after ~3 games.',
  'validated'
)
ON CONFLICT DO NOTHING;

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE discovered_patterns IS 'AI-discovered betting patterns with RCI tracking';
COMMENT ON TABLE discovered_pattern_matches IS 'Tracks when patterns match current games and results';
COMMENT ON COLUMN discovered_patterns.parent_pattern_id IS 'If this pattern is a refined version of another';
COMMENT ON COLUMN discovered_patterns.improvement_count IS 'Number of times this pattern has been improved by RCI';
