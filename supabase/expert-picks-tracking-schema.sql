-- ============================================
-- EXPERT PICKS TRACKING SYSTEM
-- Complete schema for tracking, verifying, and grading expert picks
-- ============================================

-- Enable UUID extension if not already
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. EXPERTS TABLE - Master list of tracked experts
-- (Named 'tracked_experts' to avoid conflicts)
-- ============================================
CREATE TABLE IF NOT EXISTS tracked_experts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT UNIQUE NOT NULL,  -- e.g., 'bill-simmons', 'skip-bayless'
  name TEXT NOT NULL,
  x_handle TEXT,  -- Twitter/X handle without @
  network TEXT NOT NULL,  -- ESPN, FOX, TNT, etc.
  shows TEXT[],  -- Array of shows they appear on
  sports TEXT[],  -- Sports they cover: NFL, NBA, MLB, NHL, CFB, CBB
  expert_type TEXT NOT NULL,  -- tv, radio, podcast, sharp, writer, social
  priority INTEGER DEFAULT 3,  -- 1-5, higher = more important
  headshot_url TEXT,
  espn_id TEXT,  -- ESPN's internal ID if available
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. EXPERT PICKS TRACKING TABLE
-- (Named 'tracked_picks' to avoid conflicts with existing expert_picks)
-- ============================================
CREATE TABLE IF NOT EXISTS tracked_picks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Expert reference
  expert_slug TEXT NOT NULL REFERENCES tracked_experts(slug),
  
  -- Pick identification
  pick_date DATE NOT NULL,  -- Date pick was made
  pick_timestamp TIMESTAMPTZ DEFAULT NOW(),  -- Exact timestamp
  
  -- Sport & Game Info
  sport TEXT NOT NULL,  -- NFL, NBA, MLB, NHL, CFB, CBB
  league TEXT,  -- Specific league if needed
  game_id TEXT,  -- External game ID (ESPN, etc.)
  game_date DATE NOT NULL,  -- Date of the actual game
  game_time TIMESTAMPTZ,  -- Scheduled game time
  
  -- Teams
  home_team TEXT NOT NULL,
  away_team TEXT NOT NULL,
  picked_team TEXT,  -- Which team they picked (for side bets)
  picked_side TEXT,  -- 'home', 'away', 'over', 'under', etc.
  
  -- THE LINE AT TIME OF PICK (CRITICAL)
  bet_type TEXT NOT NULL,  -- 'spread', 'moneyline', 'total', 'prop', 'parlay'
  line_at_pick DECIMAL(6,2),  -- The spread/total when pick was made (e.g., -3.5, 45.5)
  odds_at_pick INTEGER,  -- American odds when pick was made (e.g., -110, +150)
  
  -- For totals
  total_pick TEXT,  -- 'over' or 'under'
  total_number DECIMAL(6,2),  -- The total number (e.g., 223.5)
  
  -- For props
  prop_type TEXT,  -- 'first_td', 'passing_yards', etc.
  prop_player TEXT,  -- Player name for player props
  prop_line DECIMAL(8,2),  -- Prop line number
  
  -- Source tracking
  source TEXT NOT NULL,  -- 'x_twitter', 'espn', 'fox', 'podcast', etc.
  source_url TEXT,  -- Link to original pick
  source_tweet_id TEXT,  -- Twitter tweet ID if from X
  raw_text TEXT,  -- Original text of the pick
  
  -- Confidence & Units
  units DECIMAL(4,2) DEFAULT 1.0,  -- Units wagered (1u standard)
  confidence TEXT,  -- 'lock', 'best_bet', 'lean', etc.
  is_public BOOLEAN DEFAULT true,  -- Was this pick made publicly?
  
  -- Result tracking (filled in after game)
  status TEXT DEFAULT 'pending',  -- 'pending', 'won', 'lost', 'push', 'cancelled'
  
  -- Actual game results (for grading)
  home_score INTEGER,
  away_score INTEGER,
  final_spread DECIMAL(6,2),  -- Actual margin (home - away)
  final_total INTEGER,  -- Actual total points
  
  -- Outcome based on THEIR line
  result_vs_their_line TEXT,  -- 'cover', 'no_cover', 'push'
  units_won DECIMAL(6,2),  -- Units won/lost (+1.0, -1.0, 0)
  
  -- Timestamps
  graded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_sport CHECK (sport IN ('NFL', 'NBA', 'MLB', 'NHL', 'CFB', 'CBB', 'WNBA', 'NCAAW', 'Soccer', 'UFC', 'Other')),
  CONSTRAINT valid_bet_type CHECK (bet_type IN ('spread', 'moneyline', 'total', 'prop', 'parlay', 'teaser', 'future')),
  CONSTRAINT valid_status CHECK (status IN ('pending', 'won', 'lost', 'push', 'cancelled', 'void'))
);

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_tracked_picks_expert ON tracked_picks(expert_slug);
CREATE INDEX IF NOT EXISTS idx_tracked_picks_date ON tracked_picks(pick_date);
CREATE INDEX IF NOT EXISTS idx_tracked_picks_game_date ON tracked_picks(game_date);
CREATE INDEX IF NOT EXISTS idx_tracked_picks_sport ON tracked_picks(sport);
CREATE INDEX IF NOT EXISTS idx_tracked_picks_status ON tracked_picks(status);
CREATE INDEX IF NOT EXISTS idx_tracked_picks_expert_sport ON tracked_picks(expert_slug, sport);
CREATE INDEX IF NOT EXISTS idx_tracked_picks_expert_date ON tracked_picks(expert_slug, pick_date);

-- ============================================
-- 3. TRACKED EXPERT STATS - Aggregated performance
-- (Named 'tracked_expert_stats' to avoid conflicts)
-- ============================================
CREATE TABLE IF NOT EXISTS tracked_expert_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  expert_slug TEXT NOT NULL REFERENCES tracked_experts(slug),
  
  -- Time period
  period_type TEXT NOT NULL,  -- 'daily', 'weekly', 'monthly', 'yearly', 'all_time', 'season'
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  season TEXT,  -- e.g., '2025-26' for NBA
  
  -- Sport (null = all sports combined)
  sport TEXT,
  
  -- Bet type (null = all bet types combined)
  bet_type TEXT,
  
  -- Record
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  pushes INTEGER DEFAULT 0,
  total_picks INTEGER DEFAULT 0,
  
  -- Performance metrics
  win_pct DECIMAL(5,2),
  units_won DECIMAL(8,2) DEFAULT 0,
  units_wagered DECIMAL(8,2) DEFAULT 0,
  roi DECIMAL(6,2),  -- Return on investment %
  
  -- Streaks
  current_streak INTEGER DEFAULT 0,  -- Positive = wins, negative = losses
  longest_win_streak INTEGER DEFAULT 0,
  longest_lose_streak INTEGER DEFAULT 0,
  
  -- Advanced metrics
  avg_odds INTEGER,  -- Average odds of picks
  clv DECIMAL(6,2),  -- Closing Line Value (if we track line movement)
  
  -- Timestamps
  calculated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Unique constraint to prevent duplicates
  UNIQUE(expert_slug, period_type, period_start, sport, bet_type)
);

CREATE INDEX IF NOT EXISTS idx_tracked_stats_expert ON tracked_expert_stats(expert_slug);
CREATE INDEX IF NOT EXISTS idx_tracked_stats_period ON tracked_expert_stats(period_type, period_start);
CREATE INDEX IF NOT EXISTS idx_tracked_stats_sport ON tracked_expert_stats(sport);

-- ============================================
-- 4. SCRAPER RUNS - Track each scrape job
-- ============================================
CREATE TABLE IF NOT EXISTS expert_scraper_runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  run_type TEXT NOT NULL,  -- 'scheduled_3am', 'manual', 'backfill'
  source TEXT NOT NULL,  -- 'x_twitter', 'espn', 'all'
  
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  
  -- Results
  status TEXT DEFAULT 'running',  -- 'running', 'completed', 'failed'
  experts_scraped INTEGER DEFAULT 0,
  picks_found INTEGER DEFAULT 0,
  picks_new INTEGER DEFAULT 0,
  picks_duplicate INTEGER DEFAULT 0,
  games_graded INTEGER DEFAULT 0,
  
  -- Errors
  error_count INTEGER DEFAULT 0,
  error_messages TEXT[],
  
  -- Rate limiting
  rate_limited BOOLEAN DEFAULT false,
  rate_limit_reset TIMESTAMPTZ
);

-- ============================================
-- 5. CACHED GAME RESULTS - Cache of game outcomes for grading
-- (Named 'cached_game_results' to avoid conflicts)
-- ============================================
CREATE TABLE IF NOT EXISTS cached_game_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  game_id TEXT UNIQUE NOT NULL,
  sport TEXT NOT NULL,
  game_date DATE NOT NULL,
  game_time TIMESTAMPTZ,
  
  home_team TEXT NOT NULL,
  away_team TEXT NOT NULL,
  
  -- Final scores
  home_score INTEGER,
  away_score INTEGER,
  
  -- Calculated fields
  final_spread DECIMAL(6,2) GENERATED ALWAYS AS (home_score - away_score) STORED,
  final_total INTEGER GENERATED ALWAYS AS (home_score + away_score) STORED,
  winner TEXT,  -- 'home', 'away', 'tie'
  
  -- Status
  status TEXT DEFAULT 'scheduled',  -- 'scheduled', 'in_progress', 'final', 'postponed', 'cancelled'
  
  -- Source
  source TEXT,  -- Where we got the result
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cached_results_date ON cached_game_results(game_date);
CREATE INDEX IF NOT EXISTS idx_cached_results_sport ON cached_game_results(sport);
CREATE INDEX IF NOT EXISTS idx_cached_results_status ON cached_game_results(status);

-- ============================================
-- 6. Functions for calculating stats
-- ============================================

-- Function to grade a single pick
CREATE OR REPLACE FUNCTION grade_pick(
  p_pick_id UUID,
  p_home_score INTEGER,
  p_away_score INTEGER
) RETURNS void AS $$
DECLARE
  v_pick RECORD;
  v_result TEXT;
  v_units DECIMAL(6,2);
  v_spread DECIMAL(6,2);
  v_total INTEGER;
BEGIN
  -- Get the pick
  SELECT * INTO v_pick FROM tracked_picks WHERE id = p_pick_id;
  
  IF v_pick IS NULL THEN
    RETURN;
  END IF;
  
  -- Calculate actual spread and total
  v_spread := p_home_score - p_away_score;
  v_total := p_home_score + p_away_score;
  
  -- Grade based on bet type
  CASE v_pick.bet_type
    WHEN 'spread' THEN
      -- Check if picked team covered THEIR line
      IF v_pick.picked_side = 'home' THEN
        -- Home team needs to win by MORE than the spread (negative spread)
        -- Or lose by LESS than the spread (positive spread)
        IF v_spread > (v_pick.line_at_pick * -1) THEN
          v_result := 'won';
          v_units := v_pick.units * (CASE WHEN v_pick.odds_at_pick >= 100 THEN v_pick.odds_at_pick / 100.0 ELSE 100.0 / ABS(v_pick.odds_at_pick) END);
        ELSIF v_spread = (v_pick.line_at_pick * -1) THEN
          v_result := 'push';
          v_units := 0;
        ELSE
          v_result := 'lost';
          v_units := -v_pick.units;
        END IF;
      ELSE  -- away team
        IF (v_spread * -1) > v_pick.line_at_pick THEN
          v_result := 'won';
          v_units := v_pick.units * (CASE WHEN v_pick.odds_at_pick >= 100 THEN v_pick.odds_at_pick / 100.0 ELSE 100.0 / ABS(v_pick.odds_at_pick) END);
        ELSIF (v_spread * -1) = v_pick.line_at_pick THEN
          v_result := 'push';
          v_units := 0;
        ELSE
          v_result := 'lost';
          v_units := -v_pick.units;
        END IF;
      END IF;
      
    WHEN 'total' THEN
      IF v_pick.total_pick = 'over' THEN
        IF v_total > v_pick.total_number THEN
          v_result := 'won';
          v_units := v_pick.units * (CASE WHEN v_pick.odds_at_pick >= 100 THEN v_pick.odds_at_pick / 100.0 ELSE 100.0 / ABS(v_pick.odds_at_pick) END);
        ELSIF v_total = v_pick.total_number THEN
          v_result := 'push';
          v_units := 0;
        ELSE
          v_result := 'lost';
          v_units := -v_pick.units;
        END IF;
      ELSE  -- under
        IF v_total < v_pick.total_number THEN
          v_result := 'won';
          v_units := v_pick.units * (CASE WHEN v_pick.odds_at_pick >= 100 THEN v_pick.odds_at_pick / 100.0 ELSE 100.0 / ABS(v_pick.odds_at_pick) END);
        ELSIF v_total = v_pick.total_number THEN
          v_result := 'push';
          v_units := 0;
        ELSE
          v_result := 'lost';
          v_units := -v_pick.units;
        END IF;
      END IF;
      
    WHEN 'moneyline' THEN
      IF (v_pick.picked_side = 'home' AND p_home_score > p_away_score) OR
         (v_pick.picked_side = 'away' AND p_away_score > p_home_score) THEN
        v_result := 'won';
        v_units := v_pick.units * (CASE WHEN v_pick.odds_at_pick >= 100 THEN v_pick.odds_at_pick / 100.0 ELSE 100.0 / ABS(v_pick.odds_at_pick) END);
      ELSIF p_home_score = p_away_score THEN
        v_result := 'push';
        v_units := 0;
      ELSE
        v_result := 'lost';
        v_units := -v_pick.units;
      END IF;
      
    ELSE
      -- For props and other bet types, mark as needing manual grading
      v_result := 'pending';
      v_units := 0;
  END CASE;
  
  -- Update the pick
  UPDATE tracked_picks 
  SET 
    status = v_result,
    home_score = p_home_score,
    away_score = p_away_score,
    final_spread = v_spread,
    final_total = v_total,
    units_won = v_units,
    graded_at = NOW(),
    updated_at = NOW()
  WHERE id = p_pick_id;
  
END;
$$ LANGUAGE plpgsql;

-- Function to recalculate expert stats for a period
CREATE OR REPLACE FUNCTION calculate_tracked_expert_stats(
  p_expert_slug TEXT,
  p_period_type TEXT,
  p_period_start DATE,
  p_period_end DATE,
  p_sport TEXT DEFAULT NULL,
  p_bet_type TEXT DEFAULT NULL
) RETURNS void AS $$
DECLARE
  v_stats RECORD;
BEGIN
  -- Calculate stats from picks
  SELECT 
    COUNT(*) FILTER (WHERE status = 'won') as wins,
    COUNT(*) FILTER (WHERE status = 'lost') as losses,
    COUNT(*) FILTER (WHERE status = 'push') as pushes,
    COUNT(*) as total_picks,
    COALESCE(SUM(units_won), 0) as units_won,
    COALESCE(SUM(units), 0) as units_wagered,
    COALESCE(AVG(odds_at_pick), 0) as avg_odds
  INTO v_stats
  FROM tracked_picks
  WHERE expert_slug = p_expert_slug
    AND game_date BETWEEN p_period_start AND p_period_end
    AND status IN ('won', 'lost', 'push')
    AND (p_sport IS NULL OR sport = p_sport)
    AND (p_bet_type IS NULL OR bet_type = p_bet_type);
  
  -- Upsert stats
  INSERT INTO tracked_expert_stats (
    expert_slug, period_type, period_start, period_end, sport, bet_type,
    wins, losses, pushes, total_picks, win_pct, units_won, units_wagered, roi, avg_odds, calculated_at
  ) VALUES (
    p_expert_slug, p_period_type, p_period_start, p_period_end, p_sport, p_bet_type,
    v_stats.wins, v_stats.losses, v_stats.pushes, v_stats.total_picks,
    CASE WHEN (v_stats.wins + v_stats.losses) > 0 
         THEN ROUND(v_stats.wins::DECIMAL / (v_stats.wins + v_stats.losses) * 100, 2) 
         ELSE 0 END,
    v_stats.units_won,
    v_stats.units_wagered,
    CASE WHEN v_stats.units_wagered > 0 
         THEN ROUND(v_stats.units_won / v_stats.units_wagered * 100, 2) 
         ELSE 0 END,
    v_stats.avg_odds,
    NOW()
  )
  ON CONFLICT (expert_slug, period_type, period_start, sport, bet_type) 
  DO UPDATE SET
    wins = EXCLUDED.wins,
    losses = EXCLUDED.losses,
    pushes = EXCLUDED.pushes,
    total_picks = EXCLUDED.total_picks,
    win_pct = EXCLUDED.win_pct,
    units_won = EXCLUDED.units_won,
    units_wagered = EXCLUDED.units_wagered,
    roi = EXCLUDED.roi,
    avg_odds = EXCLUDED.avg_odds,
    calculated_at = NOW(),
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 7. Insert default experts from our database
-- ============================================
-- (This will be populated by the seed script)

-- ============================================
-- 8. Helpful views
-- ============================================

-- Active leaderboard by units won
CREATE OR REPLACE VIEW tracked_expert_leaderboard AS
SELECT 
  e.name,
  e.slug as expert_slug,
  e.network,
  e.x_handle,
  COALESCE(s.wins, 0) as wins,
  COALESCE(s.losses, 0) as losses,
  COALESCE(s.pushes, 0) as pushes,
  COALESCE(s.win_pct, 0) as win_pct,
  COALESCE(s.units_won, 0) as units_won,
  COALESCE(s.roi, 0) as roi,
  s.current_streak
FROM tracked_experts e
LEFT JOIN tracked_expert_stats s ON e.slug = s.expert_slug 
  AND s.period_type = 'all_time' 
  AND s.sport IS NULL
WHERE e.is_active = true
ORDER BY COALESCE(s.units_won, 0) DESC;

-- Recent picks view
CREATE OR REPLACE VIEW recent_tracked_picks AS
SELECT 
  p.id,
  e.name as expert_name,
  e.network,
  p.sport,
  p.home_team,
  p.away_team,
  p.picked_team,
  p.bet_type,
  p.line_at_pick,
  p.odds_at_pick,
  p.units,
  p.status,
  p.units_won,
  p.pick_date,
  p.game_date,
  p.source
FROM tracked_picks p
JOIN tracked_experts e ON p.expert_slug = e.slug
ORDER BY p.pick_timestamp DESC;

-- Monthly performance by expert
CREATE OR REPLACE VIEW tracked_expert_monthly AS
SELECT 
  e.name,
  e.slug as expert_slug,
  s.period_start as month,
  s.sport,
  s.wins,
  s.losses,
  s.win_pct,
  s.units_won,
  s.roi
FROM tracked_experts e
JOIN tracked_expert_stats s ON e.slug = s.expert_slug
WHERE s.period_type = 'monthly'
ORDER BY s.period_start DESC, s.units_won DESC;

COMMENT ON TABLE tracked_picks IS 'Tracks every pick made by an expert with full line/odds at time of pick for accurate grading';
COMMENT ON TABLE tracked_expert_stats IS 'Aggregated performance stats by period (daily, weekly, monthly, yearly, all-time)';
COMMENT ON TABLE cached_game_results IS 'Cached game outcomes for grading picks';
