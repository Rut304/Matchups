-- =============================================================================
-- COMPREHENSIVE SPORTS BETTING DATABASE SCHEMA
-- Supports 25 years of historical data for all 8 sports
-- Run this in Supabase SQL Editor
-- =============================================================================

-- Ensure existing columns exist on historical_games
DO $$
BEGIN
  -- Add spread_result if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' 
                 AND table_name = 'historical_games' 
                 AND column_name = 'spread_result') THEN
    ALTER TABLE public.historical_games ADD COLUMN spread_result TEXT;
  END IF;
  
  -- Add total_result if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' 
                 AND table_name = 'historical_games' 
                 AND column_name = 'total_result') THEN
    ALTER TABLE public.historical_games ADD COLUMN total_result TEXT;
  END IF;
  
  -- Add betting splits columns
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' 
                 AND table_name = 'historical_games' 
                 AND column_name = 'home_ticket_pct') THEN
    ALTER TABLE public.historical_games ADD COLUMN home_ticket_pct DECIMAL(5,2);
    ALTER TABLE public.historical_games ADD COLUMN away_ticket_pct DECIMAL(5,2);
    ALTER TABLE public.historical_games ADD COLUMN home_money_pct DECIMAL(5,2);
    ALTER TABLE public.historical_games ADD COLUMN away_money_pct DECIMAL(5,2);
  END IF;
  
  -- Add opening/closing lines
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' 
                 AND table_name = 'historical_games' 
                 AND column_name = 'opening_spread') THEN
    ALTER TABLE public.historical_games ADD COLUMN opening_spread DECIMAL(5,2);
    ALTER TABLE public.historical_games ADD COLUMN closing_spread DECIMAL(5,2);
    ALTER TABLE public.historical_games ADD COLUMN opening_total DECIMAL(5,2);
    ALTER TABLE public.historical_games ADD COLUMN closing_total DECIMAL(5,2);
  END IF;
END $$;

-- =============================================================================
-- TEAM RECORDS TABLE - Aggregated ATS/OU records by team and season
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.team_betting_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_abbr TEXT NOT NULL,
  team_name TEXT NOT NULL,
  sport TEXT NOT NULL,
  season INTEGER NOT NULL,
  
  -- Win-Loss Record
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  ties INTEGER DEFAULT 0,
  
  -- ATS Record
  ats_wins INTEGER DEFAULT 0,
  ats_losses INTEGER DEFAULT 0,
  ats_pushes INTEGER DEFAULT 0,
  
  -- Over/Under Record
  over_wins INTEGER DEFAULT 0,
  under_wins INTEGER DEFAULT 0,
  ou_pushes INTEGER DEFAULT 0,
  
  -- Home/Away ATS
  home_ats_wins INTEGER DEFAULT 0,
  home_ats_losses INTEGER DEFAULT 0,
  away_ats_wins INTEGER DEFAULT 0,
  away_ats_losses INTEGER DEFAULT 0,
  
  -- Favorite/Underdog ATS
  favorite_ats_wins INTEGER DEFAULT 0,
  favorite_ats_losses INTEGER DEFAULT 0,
  underdog_ats_wins INTEGER DEFAULT 0,
  underdog_ats_losses INTEGER DEFAULT 0,
  
  -- Points metrics
  avg_points_scored DECIMAL(5,2) DEFAULT 0,
  avg_points_allowed DECIMAL(5,2) DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(team_abbr, sport, season)
);

CREATE INDEX IF NOT EXISTS idx_team_records_sport_season ON public.team_betting_records(sport, season);
CREATE INDEX IF NOT EXISTS idx_team_records_team ON public.team_betting_records(team_abbr);

-- =============================================================================
-- BETTING TRENDS TABLE - Calculated trends from historical data
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.betting_trends (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sport TEXT NOT NULL,
  category TEXT NOT NULL, -- 'Home Favorites', 'Road Underdogs', etc.
  trend_name TEXT NOT NULL,
  description TEXT,
  
  -- Trend Statistics
  sample_size INTEGER NOT NULL,
  wins INTEGER NOT NULL,
  losses INTEGER NOT NULL,
  pushes INTEGER DEFAULT 0,
  win_pct DECIMAL(5,2),
  
  -- Profit metrics (to $100 bets at -110)
  units_profit DECIMAL(8,2),
  roi DECIMAL(5,2),
  
  -- Time range
  start_date DATE,
  end_date DATE,
  seasons TEXT[], -- Array of seasons this trend covers
  
  -- Filters used to calculate trend
  filters JSONB, -- Stores the criteria for this trend
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(sport, category, trend_name)
);

CREATE INDEX IF NOT EXISTS idx_betting_trends_sport ON public.betting_trends(sport);
CREATE INDEX IF NOT EXISTS idx_betting_trends_category ON public.betting_trends(category);
CREATE INDEX IF NOT EXISTS idx_betting_trends_winpct ON public.betting_trends(win_pct DESC);

-- =============================================================================
-- PLAYER PROPS TABLE - Historical prop bet results
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.player_props_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  game_id TEXT NOT NULL,
  sport TEXT NOT NULL,
  player_id TEXT NOT NULL,
  player_name TEXT NOT NULL,
  team_abbr TEXT NOT NULL,
  
  -- Prop details
  prop_type TEXT NOT NULL, -- 'passing_yards', 'points', 'goals', etc.
  line DECIMAL(6,2) NOT NULL,
  over_odds INTEGER,
  under_odds INTEGER,
  
  -- Result
  actual_value DECIMAL(8,2),
  result TEXT, -- 'over', 'under', 'push'
  
  -- Metadata
  game_date DATE NOT NULL,
  season INTEGER NOT NULL,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_props_history_player ON public.player_props_history(player_id);
CREATE INDEX IF NOT EXISTS idx_props_history_type ON public.player_props_history(prop_type);
CREATE INDEX IF NOT EXISTS idx_props_history_sport ON public.player_props_history(sport, game_date);

-- =============================================================================
-- PLAYER PROP TRENDS - Aggregated player prop statistics
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.player_prop_trends (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  player_id TEXT NOT NULL,
  player_name TEXT NOT NULL,
  team_abbr TEXT,
  sport TEXT NOT NULL,
  season INTEGER NOT NULL,
  
  -- Prop type specific stats
  prop_type TEXT NOT NULL,
  
  -- Performance metrics
  total_games INTEGER DEFAULT 0,
  over_count INTEGER DEFAULT 0,
  under_count INTEGER DEFAULT 0,
  push_count INTEGER DEFAULT 0,
  
  -- Statistical metrics
  avg_value DECIMAL(8,2),
  median_value DECIMAL(8,2),
  std_deviation DECIMAL(8,2),
  min_value DECIMAL(8,2),
  max_value DECIMAL(8,2),
  
  -- Home/Away splits
  home_avg DECIMAL(8,2),
  away_avg DECIMAL(8,2),
  
  -- Recent form (last 5, 10 games)
  last_5_avg DECIMAL(8,2),
  last_10_avg DECIMAL(8,2),
  
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(player_id, sport, season, prop_type)
);

CREATE INDEX IF NOT EXISTS idx_prop_trends_player ON public.player_prop_trends(player_id);
CREATE INDEX IF NOT EXISTS idx_prop_trends_sport ON public.player_prop_trends(sport, season);

-- =============================================================================
-- SYSTEMS TABLE - User-created betting systems with real backtests
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.betting_systems (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  sport TEXT NOT NULL,
  
  -- System criteria (stored as JSONB for flexibility)
  criteria JSONB NOT NULL,
  /*
    Example criteria:
    {
      "spread_range": [-7, -3],
      "home_away": "away",
      "favorite_underdog": "underdog",
      "total_range": [40, 50],
      "rest_days_min": 3,
      "public_ticket_pct_max": 40,
      "season_types": ["regular", "postseason"]
    }
  */
  
  -- Backtest results (calculated from historical_games)
  sample_size INTEGER,
  wins INTEGER,
  losses INTEGER,
  pushes INTEGER,
  win_pct DECIMAL(5,2),
  units_profit DECIMAL(8,2),
  roi DECIMAL(5,2),
  max_drawdown DECIMAL(8,2),
  longest_win_streak INTEGER,
  longest_lose_streak INTEGER,
  
  -- Backtest date range
  backtest_start DATE,
  backtest_end DATE,
  
  -- Performance by year
  yearly_performance JSONB,
  
  -- Status
  is_public BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_systems_user ON public.betting_systems(user_id);
CREATE INDEX IF NOT EXISTS idx_systems_sport ON public.betting_systems(sport);
CREATE INDEX IF NOT EXISTS idx_systems_public ON public.betting_systems(is_public) WHERE is_public = true;

-- =============================================================================
-- SPORT-SPECIFIC TEAM STATS - Additional metrics per sport
-- =============================================================================

-- NFL Team Stats
CREATE TABLE IF NOT EXISTS public.nfl_team_stats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_abbr TEXT NOT NULL,
  season INTEGER NOT NULL,
  
  -- Offensive stats
  points_per_game DECIMAL(5,2),
  rushing_yards_per_game DECIMAL(6,2),
  passing_yards_per_game DECIMAL(6,2),
  yards_per_play DECIMAL(5,2),
  third_down_pct DECIMAL(5,2),
  red_zone_pct DECIMAL(5,2),
  turnovers_per_game DECIMAL(4,2),
  
  -- Defensive stats
  points_allowed_per_game DECIMAL(5,2),
  rushing_yards_allowed DECIMAL(6,2),
  passing_yards_allowed DECIMAL(6,2),
  sacks_per_game DECIMAL(4,2),
  takeaways_per_game DECIMAL(4,2),
  
  -- Special teams
  field_goal_pct DECIMAL(5,2),
  punt_avg DECIMAL(5,2),
  
  -- Situational
  home_record TEXT,
  away_record TEXT,
  primetime_record TEXT,
  
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(team_abbr, season)
);

-- NBA Team Stats
CREATE TABLE IF NOT EXISTS public.nba_team_stats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_abbr TEXT NOT NULL,
  season INTEGER NOT NULL,
  
  -- Offensive
  points_per_game DECIMAL(6,2),
  offensive_rating DECIMAL(6,2),
  pace DECIMAL(5,2),
  effective_fg_pct DECIMAL(5,2),
  true_shooting_pct DECIMAL(5,2),
  assists_per_game DECIMAL(5,2),
  turnovers_per_game DECIMAL(4,2),
  
  -- Defensive
  defensive_rating DECIMAL(6,2),
  opponent_fg_pct DECIMAL(5,2),
  steals_per_game DECIMAL(4,2),
  blocks_per_game DECIMAL(4,2),
  
  -- Rebounding
  offensive_rebounds_per_game DECIMAL(5,2),
  defensive_rebounds_per_game DECIMAL(5,2),
  
  -- Situational
  home_record TEXT,
  away_record TEXT,
  b2b_record TEXT, -- Back-to-back record
  
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(team_abbr, season)
);

-- MLB Team Stats
CREATE TABLE IF NOT EXISTS public.mlb_team_stats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_abbr TEXT NOT NULL,
  season INTEGER NOT NULL,
  
  -- Batting
  runs_per_game DECIMAL(5,2),
  batting_avg DECIMAL(5,3),
  on_base_pct DECIMAL(5,3),
  slugging_pct DECIMAL(5,3),
  ops DECIMAL(5,3),
  home_runs_per_game DECIMAL(4,2),
  strikeouts_per_game DECIMAL(5,2),
  
  -- Pitching
  era DECIMAL(5,2),
  whip DECIMAL(5,3),
  strikeouts_per_9 DECIMAL(5,2),
  walks_per_9 DECIMAL(5,2),
  
  -- Defense
  fielding_pct DECIMAL(5,3),
  errors_per_game DECIMAL(4,2),
  
  -- Situational
  home_record TEXT,
  away_record TEXT,
  vs_lhp_record TEXT,
  vs_rhp_record TEXT,
  
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(team_abbr, season)
);

-- NHL Team Stats
CREATE TABLE IF NOT EXISTS public.nhl_team_stats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_abbr TEXT NOT NULL,
  season INTEGER NOT NULL,
  
  -- Offense
  goals_per_game DECIMAL(5,2),
  shots_per_game DECIMAL(5,2),
  power_play_pct DECIMAL(5,2),
  
  -- Defense
  goals_against_per_game DECIMAL(5,2),
  shots_against_per_game DECIMAL(5,2),
  penalty_kill_pct DECIMAL(5,2),
  save_pct DECIMAL(5,3),
  
  -- Advanced
  corsi_for_pct DECIMAL(5,2),
  fenwick_for_pct DECIMAL(5,2),
  expected_goals_for DECIMAL(5,2),
  expected_goals_against DECIMAL(5,2),
  
  -- Situational
  home_record TEXT,
  away_record TEXT,
  overtime_record TEXT,
  
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(team_abbr, season)
);

-- =============================================================================
-- RLS POLICIES
-- =============================================================================

ALTER TABLE public.team_betting_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.betting_trends ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_props_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_prop_trends ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.betting_systems ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nfl_team_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nba_team_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mlb_team_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nhl_team_stats ENABLE ROW LEVEL SECURITY;

-- Public read for all stats tables
CREATE POLICY "Public read team_betting_records" ON public.team_betting_records FOR SELECT USING (true);
CREATE POLICY "Public read betting_trends" ON public.betting_trends FOR SELECT USING (true);
CREATE POLICY "Public read player_props_history" ON public.player_props_history FOR SELECT USING (true);
CREATE POLICY "Public read player_prop_trends" ON public.player_prop_trends FOR SELECT USING (true);
CREATE POLICY "Public read nfl_team_stats" ON public.nfl_team_stats FOR SELECT USING (true);
CREATE POLICY "Public read nba_team_stats" ON public.nba_team_stats FOR SELECT USING (true);
CREATE POLICY "Public read mlb_team_stats" ON public.mlb_team_stats FOR SELECT USING (true);
CREATE POLICY "Public read nhl_team_stats" ON public.nhl_team_stats FOR SELECT USING (true);

-- Systems table: users can manage their own, read public systems
CREATE POLICY "Read own systems" ON public.betting_systems FOR SELECT 
  USING (user_id = auth.uid() OR is_public = true);
CREATE POLICY "Insert own systems" ON public.betting_systems FOR INSERT 
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "Update own systems" ON public.betting_systems FOR UPDATE 
  USING (user_id = auth.uid());
CREATE POLICY "Delete own systems" ON public.betting_systems FOR DELETE 
  USING (user_id = auth.uid());

-- Service role can write to all tables
CREATE POLICY "Service write team_betting_records" ON public.team_betting_records FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service write betting_trends" ON public.betting_trends FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service write player_props_history" ON public.player_props_history FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service write player_prop_trends" ON public.player_prop_trends FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service write nfl_team_stats" ON public.nfl_team_stats FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service write nba_team_stats" ON public.nba_team_stats FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service write mlb_team_stats" ON public.mlb_team_stats FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service write nhl_team_stats" ON public.nhl_team_stats FOR ALL USING (true) WITH CHECK (true);

-- =============================================================================
-- HELPER FUNCTIONS
-- =============================================================================

-- Function to calculate team ATS record from historical_games
CREATE OR REPLACE FUNCTION calculate_team_ats_record(
  p_team_abbr TEXT,
  p_sport TEXT,
  p_season INTEGER
) RETURNS TABLE (
  ats_wins INTEGER,
  ats_losses INTEGER,
  ats_pushes INTEGER,
  ou_overs INTEGER,
  ou_unders INTEGER,
  ou_pushes INTEGER
) LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(SUM(CASE 
      WHEN (home_team_abbr = p_team_abbr AND spread_result = 'home_cover') OR
           (away_team_abbr = p_team_abbr AND spread_result = 'away_cover')
      THEN 1 ELSE 0 END), 0)::INTEGER AS ats_wins,
    COALESCE(SUM(CASE 
      WHEN (home_team_abbr = p_team_abbr AND spread_result = 'away_cover') OR
           (away_team_abbr = p_team_abbr AND spread_result = 'home_cover')
      THEN 1 ELSE 0 END), 0)::INTEGER AS ats_losses,
    COALESCE(SUM(CASE WHEN spread_result = 'push' AND 
      (home_team_abbr = p_team_abbr OR away_team_abbr = p_team_abbr)
      THEN 1 ELSE 0 END), 0)::INTEGER AS ats_pushes,
    COALESCE(SUM(CASE WHEN total_result = 'over' AND 
      (home_team_abbr = p_team_abbr OR away_team_abbr = p_team_abbr)
      THEN 1 ELSE 0 END), 0)::INTEGER AS ou_overs,
    COALESCE(SUM(CASE WHEN total_result = 'under' AND 
      (home_team_abbr = p_team_abbr OR away_team_abbr = p_team_abbr)
      THEN 1 ELSE 0 END), 0)::INTEGER AS ou_unders,
    COALESCE(SUM(CASE WHEN total_result = 'push' AND 
      (home_team_abbr = p_team_abbr OR away_team_abbr = p_team_abbr)
      THEN 1 ELSE 0 END), 0)::INTEGER AS ou_pushes
  FROM public.historical_games
  WHERE sport = p_sport 
    AND season = p_season
    AND (home_team_abbr = p_team_abbr OR away_team_abbr = p_team_abbr);
END;
$$;

-- Function to run a system backtest
CREATE OR REPLACE FUNCTION run_system_backtest(
  p_criteria JSONB,
  p_sport TEXT,
  p_start_date DATE DEFAULT '2000-01-01',
  p_end_date DATE DEFAULT CURRENT_DATE
) RETURNS TABLE (
  total_games INTEGER,
  wins INTEGER,
  losses INTEGER,
  pushes INTEGER,
  win_pct DECIMAL,
  units_profit DECIMAL
) LANGUAGE plpgsql AS $$
DECLARE
  v_spread_min DECIMAL;
  v_spread_max DECIMAL;
  v_home_only BOOLEAN;
  v_away_only BOOLEAN;
  v_favorite_only BOOLEAN;
  v_underdog_only BOOLEAN;
BEGIN
  -- Parse criteria
  v_spread_min := (p_criteria->>'spread_min')::DECIMAL;
  v_spread_max := (p_criteria->>'spread_max')::DECIMAL;
  v_home_only := (p_criteria->>'home_only')::BOOLEAN;
  v_away_only := (p_criteria->>'away_only')::BOOLEAN;
  v_favorite_only := (p_criteria->>'favorite_only')::BOOLEAN;
  v_underdog_only := (p_criteria->>'underdog_only')::BOOLEAN;
  
  RETURN QUERY
  WITH filtered_games AS (
    SELECT 
      hg.*,
      CASE 
        WHEN v_home_only AND hg.point_spread < 0 THEN true
        WHEN v_away_only AND hg.point_spread > 0 THEN true
        WHEN NOT v_home_only AND NOT v_away_only THEN true
        ELSE false
      END AS matches_criteria,
      CASE 
        WHEN hg.point_spread < 0 THEN 
          CASE WHEN hg.spread_result = 'home_cover' THEN 1 
               WHEN hg.spread_result = 'away_cover' THEN -1
               ELSE 0 END
        ELSE 
          CASE WHEN hg.spread_result = 'away_cover' THEN 1 
               WHEN hg.spread_result = 'home_cover' THEN -1
               ELSE 0 END
      END AS bet_result
    FROM public.historical_games hg
    WHERE hg.sport = p_sport
      AND hg.game_date BETWEEN p_start_date AND p_end_date
      AND hg.spread_result IS NOT NULL
      AND (v_spread_min IS NULL OR ABS(hg.point_spread) >= v_spread_min)
      AND (v_spread_max IS NULL OR ABS(hg.point_spread) <= v_spread_max)
  )
  SELECT 
    COUNT(*)::INTEGER AS total_games,
    SUM(CASE WHEN bet_result = 1 THEN 1 ELSE 0 END)::INTEGER AS wins,
    SUM(CASE WHEN bet_result = -1 THEN 1 ELSE 0 END)::INTEGER AS losses,
    SUM(CASE WHEN bet_result = 0 THEN 1 ELSE 0 END)::INTEGER AS pushes,
    ROUND(
      SUM(CASE WHEN bet_result = 1 THEN 1 ELSE 0 END)::DECIMAL / 
      NULLIF(SUM(CASE WHEN bet_result != 0 THEN 1 ELSE 0 END), 0) * 100, 
    2) AS win_pct,
    ROUND(
      SUM(CASE WHEN bet_result = 1 THEN 0.91 WHEN bet_result = -1 THEN -1 ELSE 0 END),
    2) AS units_profit
  FROM filtered_games
  WHERE matches_criteria = true;
END;
$$;

-- =============================================================================
-- VERIFY SCHEMA
-- =============================================================================

SELECT 'Schema created successfully' AS status;
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'historical_games', 'team_betting_records', 'betting_trends',
  'player_props_history', 'player_prop_trends', 'betting_systems',
  'nfl_team_stats', 'nba_team_stats', 'mlb_team_stats', 'nhl_team_stats'
)
ORDER BY table_name;
