-- =============================================================================
-- CONFIDENCE SCORE TRACKING SCHEMA
-- =============================================================================
-- Tracks confidence scores, actual results, and model weight evolution
-- for RSI (Recursive Self-Improvement) learning

-- Confidence predictions table
CREATE TABLE IF NOT EXISTS confidence_predictions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  game_id TEXT NOT NULL,
  sport TEXT NOT NULL CHECK (sport IN ('NFL', 'NBA', 'NHL', 'MLB', 'NCAAF', 'NCAAB')),
  home_team TEXT NOT NULL,
  away_team TEXT NOT NULL,
  game_date DATE NOT NULL,
  
  -- Spread prediction
  spread_pick TEXT CHECK (spread_pick IN ('home', 'away', 'avoid')),
  spread_confidence INTEGER CHECK (spread_confidence >= 0 AND spread_confidence <= 100),
  spread_line DECIMAL(4,1),
  spread_edge DECIMAL(4,1),
  
  -- Total prediction  
  total_pick TEXT CHECK (total_pick IN ('over', 'under', 'avoid')),
  total_confidence INTEGER CHECK (total_confidence >= 0 AND total_confidence <= 100),
  total_line DECIMAL(5,1),
  projected_total DECIMAL(5,1),
  
  -- Overall
  overall_confidence INTEGER CHECK (overall_confidence >= 0 AND overall_confidence <= 100),
  best_bet TEXT CHECK (best_bet IN ('spread', 'total', 'avoid')),
  reasoning JSONB DEFAULT '[]',
  
  -- Factor breakdown
  spread_factors JSONB DEFAULT '[]',
  total_factors JSONB DEFAULT '[]',
  
  -- Key inputs
  injuries JSONB DEFAULT '[]',
  weather JSONB,
  sharp_money JSONB,
  
  -- Model metadata
  model_version TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(game_id, model_version)
);

-- Actual results table
CREATE TABLE IF NOT EXISTS confidence_results (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  prediction_id UUID REFERENCES confidence_predictions(id) ON DELETE CASCADE,
  game_id TEXT NOT NULL,
  
  -- Actual outcomes
  home_score INTEGER NOT NULL,
  away_score INTEGER NOT NULL,
  actual_spread DECIMAL(4,1) GENERATED ALWAYS AS (home_score - away_score) STORED,
  actual_total INTEGER GENERATED ALWAYS AS (home_score + away_score) STORED,
  
  -- Did predictions hit?
  spread_correct BOOLEAN,
  total_correct BOOLEAN,
  
  -- Errors
  spread_error DECIMAL(4,1),
  total_error DECIMAL(4,1),
  
  -- Factor analysis (which factors were predictive)
  factor_analysis JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(prediction_id)
);

-- Model weights history (for RSI tracking)
CREATE TABLE IF NOT EXISTS confidence_model_weights (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  version TEXT NOT NULL,
  
  -- Factor weights
  injury_weight DECIMAL(4,3) NOT NULL,
  pace_weight DECIMAL(4,3) NOT NULL,
  location_weight DECIMAL(4,3) NOT NULL,
  matchup_weight DECIMAL(4,3) NOT NULL,
  weather_weight DECIMAL(4,3) NOT NULL,
  trend_weight DECIMAL(4,3) NOT NULL,
  sharp_money_weight DECIMAL(4,3) NOT NULL,
  
  -- Sport multipliers
  sport_multipliers JSONB DEFAULT '{"nfl":1.0,"nba":0.95,"nhl":0.90,"mlb":0.85,"ncaaf":1.05,"ncaab":0.80}',
  
  -- Thresholds
  high_conf_threshold INTEGER DEFAULT 72,
  med_conf_threshold INTEGER DEFAULT 55,
  avoid_threshold INTEGER DEFAULT 45,
  
  -- Performance at time of snapshot
  total_predictions INTEGER DEFAULT 0,
  correct_predictions INTEGER DEFAULT 0,
  accuracy DECIMAL(5,2) GENERATED ALWAYS AS (
    CASE WHEN total_predictions > 0 
    THEN (correct_predictions::DECIMAL / total_predictions) * 100 
    ELSE 0 END
  ) STORED,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(version)
);

-- Daily performance tracking
CREATE TABLE IF NOT EXISTS confidence_daily_performance (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  date DATE NOT NULL,
  sport TEXT,
  
  -- Spread performance
  spread_picks INTEGER DEFAULT 0,
  spread_wins INTEGER DEFAULT 0,
  spread_accuracy DECIMAL(5,2),
  
  -- Total performance
  total_picks INTEGER DEFAULT 0,
  total_wins INTEGER DEFAULT 0,
  total_accuracy DECIMAL(5,2),
  
  -- By confidence level
  high_conf_picks INTEGER DEFAULT 0,
  high_conf_wins INTEGER DEFAULT 0,
  med_conf_picks INTEGER DEFAULT 0,
  med_conf_wins INTEGER DEFAULT 0,
  low_conf_picks INTEGER DEFAULT 0,
  low_conf_wins INTEGER DEFAULT 0,
  
  -- Factor effectiveness
  factor_performance JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(date, sport)
);

-- Team style/pace metrics cache
CREATE TABLE IF NOT EXISTS team_style_metrics (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  team_abbr TEXT NOT NULL,
  sport TEXT NOT NULL CHECK (sport IN ('NFL', 'NBA', 'NHL', 'MLB', 'NCAAF', 'NCAAB')),
  season INTEGER NOT NULL,
  
  -- Pace metrics
  pace DECIMAL(5,1),
  pace_rank INTEGER,
  tempo TEXT CHECK (tempo IN ('fast', 'moderate', 'slow')),
  
  -- Scoring
  points_per_game DECIMAL(5,1),
  offensive_rating DECIMAL(5,1),
  defensive_rating DECIMAL(5,1),
  
  -- Sport-specific metrics (stored as JSONB for flexibility)
  -- NFL: no_huddle_rate, play_action_rate, rush_rate, pass_rate
  -- NBA: three_point_rate, fast_break_pts, pts_in_paint
  -- NHL: shots_per_game, faceoff_pct
  sport_specific JSONB DEFAULT '{}',
  
  -- Over/Under performance
  ou_record TEXT,
  home_ou_record TEXT,
  away_ou_record TEXT,
  avg_game_total DECIMAL(5,1),
  
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(team_abbr, sport, season)
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_predictions_game_date ON confidence_predictions(game_date);
CREATE INDEX IF NOT EXISTS idx_predictions_sport ON confidence_predictions(sport);
CREATE INDEX IF NOT EXISTS idx_predictions_confidence ON confidence_predictions(overall_confidence DESC);
CREATE INDEX IF NOT EXISTS idx_results_game_id ON confidence_results(game_id);
CREATE INDEX IF NOT EXISTS idx_daily_perf_date ON confidence_daily_performance(date);
CREATE INDEX IF NOT EXISTS idx_team_style_team ON team_style_metrics(team_abbr, sport);

-- Function to calculate daily performance
CREATE OR REPLACE FUNCTION compute_daily_confidence_performance(target_date DATE)
RETURNS VOID AS $$
BEGIN
  INSERT INTO confidence_daily_performance (date, sport, spread_picks, spread_wins, spread_accuracy, 
    total_picks, total_wins, total_accuracy, high_conf_picks, high_conf_wins, 
    med_conf_picks, med_conf_wins, low_conf_picks, low_conf_wins)
  SELECT 
    target_date,
    p.sport,
    COUNT(*) FILTER (WHERE p.spread_pick != 'avoid'),
    COUNT(*) FILTER (WHERE r.spread_correct = true),
    CASE 
      WHEN COUNT(*) FILTER (WHERE p.spread_pick != 'avoid') > 0 
      THEN (COUNT(*) FILTER (WHERE r.spread_correct = true)::DECIMAL / 
            COUNT(*) FILTER (WHERE p.spread_pick != 'avoid')) * 100
      ELSE 0 
    END,
    COUNT(*) FILTER (WHERE p.total_pick != 'avoid'),
    COUNT(*) FILTER (WHERE r.total_correct = true),
    CASE 
      WHEN COUNT(*) FILTER (WHERE p.total_pick != 'avoid') > 0 
      THEN (COUNT(*) FILTER (WHERE r.total_correct = true)::DECIMAL / 
            COUNT(*) FILTER (WHERE p.total_pick != 'avoid')) * 100
      ELSE 0 
    END,
    COUNT(*) FILTER (WHERE p.overall_confidence >= 72),
    COUNT(*) FILTER (WHERE p.overall_confidence >= 72 AND (r.spread_correct = true OR r.total_correct = true)),
    COUNT(*) FILTER (WHERE p.overall_confidence >= 55 AND p.overall_confidence < 72),
    COUNT(*) FILTER (WHERE p.overall_confidence >= 55 AND p.overall_confidence < 72 AND (r.spread_correct = true OR r.total_correct = true)),
    COUNT(*) FILTER (WHERE p.overall_confidence < 55),
    COUNT(*) FILTER (WHERE p.overall_confidence < 55 AND (r.spread_correct = true OR r.total_correct = true))
  FROM confidence_predictions p
  LEFT JOIN confidence_results r ON p.id = r.prediction_id
  WHERE p.game_date = target_date
  GROUP BY p.sport
  ON CONFLICT (date, sport) DO UPDATE SET
    spread_picks = EXCLUDED.spread_picks,
    spread_wins = EXCLUDED.spread_wins,
    spread_accuracy = EXCLUDED.spread_accuracy,
    total_picks = EXCLUDED.total_picks,
    total_wins = EXCLUDED.total_wins,
    total_accuracy = EXCLUDED.total_accuracy,
    high_conf_picks = EXCLUDED.high_conf_picks,
    high_conf_wins = EXCLUDED.high_conf_wins,
    med_conf_picks = EXCLUDED.med_conf_picks,
    med_conf_wins = EXCLUDED.med_conf_wins,
    low_conf_picks = EXCLUDED.low_conf_picks,
    low_conf_wins = EXCLUDED.low_conf_wins;
END;
$$ LANGUAGE plpgsql;

-- Insert initial model weights
INSERT INTO confidence_model_weights (
  version, injury_weight, pace_weight, location_weight, matchup_weight,
  weather_weight, trend_weight, sharp_money_weight
) VALUES (
  '1.0.0', 0.20, 0.15, 0.12, 0.18, 0.08, 0.12, 0.15
) ON CONFLICT (version) DO NOTHING;

-- Comments
COMMENT ON TABLE confidence_predictions IS 'Stores all confidence score predictions with factor breakdowns';
COMMENT ON TABLE confidence_results IS 'Tracks actual outcomes for RSI learning';
COMMENT ON TABLE confidence_model_weights IS 'Historical weight snapshots showing model evolution';
COMMENT ON TABLE confidence_daily_performance IS 'Aggregated daily performance metrics';
COMMENT ON TABLE team_style_metrics IS 'Cached team pace and style metrics for O/U analysis';
