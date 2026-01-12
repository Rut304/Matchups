-- ============================================================================
-- ADVANCED BETTING INTELLIGENCE SCHEMA
-- Comprehensive schema for best-in-class betting analytics
-- SAFE TO RUN: Uses IF NOT EXISTS throughout
-- ============================================================================

-- ============================================================================
-- 1. USER BETS TRACKING
-- Track user's bets with real-time status updates
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_bets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Game reference
  game_id TEXT NOT NULL,
  sport TEXT NOT NULL,
  home_team TEXT NOT NULL,
  away_team TEXT NOT NULL,
  game_date TIMESTAMP WITH TIME ZONE,
  
  -- Bet details
  bet_type TEXT NOT NULL CHECK (bet_type IN ('spread', 'total', 'moneyline', 'prop', 'parlay', 'teaser')),
  pick TEXT NOT NULL, -- e.g., "KC -3.5", "Over 47.5", "Chiefs ML", "Mahomes O299.5 Pass Yds"
  pick_team TEXT, -- For spread/ML: team abbr
  line_value DECIMAL(10,2), -- The line taken (spread number, total number, prop line)
  
  -- Odds & Money
  odds INTEGER NOT NULL, -- American odds: -110, +150, etc.
  stake DECIMAL(10,2) NOT NULL,
  potential_win DECIMAL(10,2) NOT NULL,
  
  -- Sportsbook
  sportsbook TEXT,
  
  -- Status tracking
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'live', 'won', 'lost', 'push', 'cashed_out')),
  current_value DECIMAL(10,2), -- For cash out: current bet value
  cash_out_available BOOLEAN DEFAULT false,
  cash_out_value DECIMAL(10,2),
  
  -- Live tracking (updated during game)
  is_covering BOOLEAN, -- true = currently winning, false = currently losing, null = push/unclear
  cover_margin DECIMAL(10,2), -- How much they're winning/losing by
  win_probability DECIMAL(5,2), -- Real-time probability of bet hitting (0-100)
  
  -- Settlement
  settled_at TIMESTAMP WITH TIME ZONE,
  actual_result TEXT, -- Final result description
  profit_loss DECIMAL(10,2),
  
  -- Metadata
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_bets_user ON user_bets(user_id);
CREATE INDEX IF NOT EXISTS idx_user_bets_game ON user_bets(game_id);
CREATE INDEX IF NOT EXISTS idx_user_bets_sport ON user_bets(sport);
CREATE INDEX IF NOT EXISTS idx_user_bets_status ON user_bets(status);
CREATE INDEX IF NOT EXISTS idx_user_bets_user_status ON user_bets(user_id, status);
CREATE INDEX IF NOT EXISTS idx_user_bets_created ON user_bets(created_at DESC);

ALTER TABLE user_bets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own bets" ON user_bets;
CREATE POLICY "Users can view own bets" ON user_bets 
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own bets" ON user_bets;
CREATE POLICY "Users can insert own bets" ON user_bets 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own bets" ON user_bets;
CREATE POLICY "Users can update own bets" ON user_bets 
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role manages all bets" ON user_bets;
CREATE POLICY "Service role manages all bets" ON user_bets 
  FOR ALL USING (auth.role() = 'service_role');

-- ============================================================================
-- 2. FAVORITE PLAYERS
-- Track users' favorite players across all sports
-- ============================================================================
CREATE TABLE IF NOT EXISTS favorite_players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Player identification
  player_id TEXT NOT NULL, -- ESPN player ID or external ID
  player_name TEXT NOT NULL,
  player_position TEXT,
  player_team TEXT,
  player_team_abbr TEXT,
  player_headshot TEXT, -- URL to headshot image
  sport TEXT NOT NULL,
  
  -- Tracking preferences
  notify_on_game BOOLEAN DEFAULT true,
  notify_on_injury BOOLEAN DEFAULT true,
  notify_on_prop_movement BOOLEAN DEFAULT true,
  
  -- Last known stats (denormalized for quick access)
  last_game_stats JSONB,
  season_stats JSONB,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, player_id)
);

CREATE INDEX IF NOT EXISTS idx_favorite_players_user ON favorite_players(user_id);
CREATE INDEX IF NOT EXISTS idx_favorite_players_player ON favorite_players(player_id);
CREATE INDEX IF NOT EXISTS idx_favorite_players_sport ON favorite_players(sport);

ALTER TABLE favorite_players ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage favorite players" ON favorite_players;
CREATE POLICY "Users can manage favorite players" ON favorite_players 
  FOR ALL USING (auth.uid() = user_id);

-- ============================================================================
-- 3. OFFICIALS DATA
-- Referee/Umpire tendencies and betting records
-- ============================================================================
CREATE TABLE IF NOT EXISTS officials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Official identification
  external_id TEXT UNIQUE,
  name TEXT NOT NULL,
  sport TEXT NOT NULL,
  role TEXT NOT NULL, -- 'referee', 'umpire', 'head_linesman', etc.
  
  -- Career info
  years_experience INTEGER,
  conference TEXT, -- For college sports
  
  -- Betting tendencies (career)
  games_officiated INTEGER DEFAULT 0,
  home_team_wins INTEGER DEFAULT 0,
  away_team_wins INTEGER DEFAULT 0,
  home_cover_pct DECIMAL(5,2), -- Home team ATS %
  over_pct DECIMAL(5,2), -- Over hit %
  avg_total_points DECIMAL(6,2), -- Avg total points in games
  avg_penalties_per_game DECIMAL(5,2), -- NFL/NHL: penalties called
  avg_fouls_per_game DECIMAL(5,2), -- NBA: fouls called
  
  -- Season stats
  season_games INTEGER DEFAULT 0,
  season_home_cover_pct DECIMAL(5,2),
  season_over_pct DECIMAL(5,2),
  
  -- Sport-specific stats stored as JSON
  advanced_stats JSONB DEFAULT '{}',
  -- NFL: { penalty_yards_per_game, pass_interference_calls, holding_calls }
  -- NBA: { technical_fouls, offensive_fouls, shooting_fouls }
  -- MLB: { strike_zone_accuracy, balls_per_game, strikeouts_per_game }
  -- NHL: { penalty_minutes_per_game, major_penalties }
  
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_officials_sport ON officials(sport);
CREATE INDEX IF NOT EXISTS idx_officials_name ON officials(name);
CREATE INDEX IF NOT EXISTS idx_officials_external ON officials(external_id);

ALTER TABLE officials ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Officials are publicly readable" ON officials;
CREATE POLICY "Officials are publicly readable" ON officials 
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Service role manages officials" ON officials;
CREATE POLICY "Service role manages officials" ON officials 
  FOR ALL USING (auth.role() = 'service_role');

-- ============================================================================
-- 4. GAME OFFICIALS (Junction table)
-- Links officials to specific games
-- ============================================================================
CREATE TABLE IF NOT EXISTS game_officials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id TEXT NOT NULL,
  sport TEXT NOT NULL,
  official_id UUID REFERENCES officials(id) ON DELETE CASCADE,
  role TEXT, -- 'referee', 'umpire', 'back_judge', etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_game_officials_game ON game_officials(game_id);
CREATE INDEX IF NOT EXISTS idx_game_officials_official ON game_officials(official_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_game_officials_unique ON game_officials(game_id, official_id);

ALTER TABLE game_officials ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Game officials publicly readable" ON game_officials;
CREATE POLICY "Game officials publicly readable" ON game_officials 
  FOR SELECT USING (true);

-- ============================================================================
-- 5. HEAD TO HEAD CACHE
-- Cached H2H matchup data for quick retrieval
-- ============================================================================
CREATE TABLE IF NOT EXISTS head_to_head_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Teams (alphabetically ordered for consistent lookups)
  team_a TEXT NOT NULL, -- Alphabetically first team
  team_b TEXT NOT NULL, -- Alphabetically second team
  sport TEXT NOT NULL,
  
  -- Aggregated stats
  total_games INTEGER DEFAULT 0,
  team_a_wins INTEGER DEFAULT 0,
  team_b_wins INTEGER DEFAULT 0,
  ties INTEGER DEFAULT 0,
  
  -- ATS Records
  team_a_ats_wins INTEGER DEFAULT 0,
  team_a_ats_losses INTEGER DEFAULT 0,
  team_a_ats_pushes INTEGER DEFAULT 0,
  
  -- O/U Records
  overs INTEGER DEFAULT 0,
  unders INTEGER DEFAULT 0,
  total_pushes INTEGER DEFAULT 0,
  
  -- Scoring averages
  avg_total_points DECIMAL(6,2),
  avg_margin DECIMAL(5,2),
  team_a_avg_score DECIMAL(5,2),
  team_b_avg_score DECIMAL(5,2),
  
  -- Recent games (last 10)
  recent_games JSONB DEFAULT '[]',
  -- [{ date, team_a_score, team_b_score, spread, result, total, ou_result }]
  
  -- Venue splits
  team_a_home_record JSONB, -- { wins, losses, ats_wins, ats_losses }
  team_b_home_record JSONB,
  
  -- Metadata
  last_game_date DATE,
  cache_updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(team_a, team_b, sport)
);

CREATE INDEX IF NOT EXISTS idx_h2h_teams ON head_to_head_cache(team_a, team_b);
CREATE INDEX IF NOT EXISTS idx_h2h_sport ON head_to_head_cache(sport);

ALTER TABLE head_to_head_cache ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "H2H cache publicly readable" ON head_to_head_cache;
CREATE POLICY "H2H cache publicly readable" ON head_to_head_cache 
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Service role manages H2H cache" ON head_to_head_cache;
CREATE POLICY "Service role manages H2H cache" ON head_to_head_cache 
  FOR ALL USING (auth.role() = 'service_role');

-- ============================================================================
-- 6. BETTING SPLITS (Enhanced)
-- Public vs Sharp money with historical tracking
-- ============================================================================
CREATE TABLE IF NOT EXISTS betting_splits_enhanced (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id TEXT NOT NULL,
  sport TEXT NOT NULL,
  
  -- Teams
  home_team TEXT NOT NULL,
  away_team TEXT NOT NULL,
  
  -- Current lines
  spread DECIMAL(5,2),
  total DECIMAL(5,2),
  home_ml INTEGER,
  away_ml INTEGER,
  
  -- SPREAD SPLITS
  spread_public_home_pct INTEGER, -- % of bets on home spread
  spread_public_away_pct INTEGER,
  spread_money_home_pct INTEGER, -- % of MONEY on home spread (sharp indicator)
  spread_money_away_pct INTEGER,
  spread_tickets_total INTEGER, -- Total # of tickets
  
  -- TOTAL SPLITS
  total_public_over_pct INTEGER,
  total_public_under_pct INTEGER,
  total_money_over_pct INTEGER,
  total_money_under_pct INTEGER,
  total_tickets_total INTEGER,
  
  -- MONEYLINE SPLITS
  ml_public_home_pct INTEGER,
  ml_public_away_pct INTEGER,
  ml_money_home_pct INTEGER,
  ml_money_away_pct INTEGER,
  ml_tickets_total INTEGER,
  
  -- Sharp indicators
  is_reverse_line_movement BOOLEAN DEFAULT false, -- Line moving opposite of public
  sharp_side TEXT, -- 'home', 'away', 'over', 'under', or null
  steam_move_detected BOOLEAN DEFAULT false,
  
  -- Source
  source TEXT, -- 'action_network', 'covers', 'vegasinsider', etc.
  
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_splits_enhanced_game ON betting_splits_enhanced(game_id);
CREATE INDEX IF NOT EXISTS idx_splits_enhanced_sport ON betting_splits_enhanced(sport);
CREATE INDEX IF NOT EXISTS idx_splits_enhanced_recorded ON betting_splits_enhanced(recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_splits_enhanced_rlm ON betting_splits_enhanced(is_reverse_line_movement) WHERE is_reverse_line_movement = true;

ALTER TABLE betting_splits_enhanced ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Splits publicly readable" ON betting_splits_enhanced;
CREATE POLICY "Splits publicly readable" ON betting_splits_enhanced 
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Service role manages splits" ON betting_splits_enhanced;
CREATE POLICY "Service role manages splits" ON betting_splits_enhanced 
  FOR ALL USING (auth.role() = 'service_role');

-- ============================================================================
-- 7. PLAYER PROPS
-- Prop lines from multiple sportsbooks
-- ============================================================================
CREATE TABLE IF NOT EXISTS player_props (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Game & Player
  game_id TEXT NOT NULL,
  sport TEXT NOT NULL,
  player_id TEXT NOT NULL,
  player_name TEXT NOT NULL,
  player_team TEXT,
  
  -- Prop details
  prop_type TEXT NOT NULL, -- 'passing_yards', 'rushing_yards', 'points', 'rebounds', 'assists', etc.
  prop_category TEXT NOT NULL, -- 'passing', 'rushing', 'receiving', 'scoring', 'rebounding', etc.
  
  -- Lines from different books (JSONB for flexibility)
  lines JSONB NOT NULL,
  -- { "draftkings": { "line": 285.5, "over": -115, "under": -105 }, "fanduel": {...} }
  
  -- Best lines
  best_over_line DECIMAL(10,2),
  best_over_odds INTEGER,
  best_over_book TEXT,
  best_under_line DECIMAL(10,2),
  best_under_odds INTEGER,
  best_under_book TEXT,
  
  -- Historical performance
  season_avg DECIMAL(10,2),
  last_5_avg DECIMAL(10,2),
  hit_rate_season DECIMAL(5,2), -- % of times over has hit this season
  hit_rate_last_5 DECIMAL(5,2),
  
  -- Against opponent
  vs_opponent_avg DECIMAL(10,2),
  vs_opponent_games INTEGER,
  
  -- Movement tracking
  opening_line DECIMAL(10,2),
  line_movement DECIMAL(10,2), -- Current - Opening
  
  -- Metadata
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_props_game ON player_props(game_id);
CREATE INDEX IF NOT EXISTS idx_props_player ON player_props(player_id);
CREATE INDEX IF NOT EXISTS idx_props_sport ON player_props(sport);
CREATE INDEX IF NOT EXISTS idx_props_type ON player_props(prop_type);
CREATE INDEX IF NOT EXISTS idx_props_recorded ON player_props(recorded_at DESC);

ALTER TABLE player_props ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Props publicly readable" ON player_props;
CREATE POLICY "Props publicly readable" ON player_props 
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Service role manages props" ON player_props;
CREATE POLICY "Service role manages props" ON player_props 
  FOR ALL USING (auth.role() = 'service_role');

-- ============================================================================
-- 8. TEAM STATS (Advanced)
-- Pace, tempo, efficiency metrics per sport
-- ============================================================================
CREATE TABLE IF NOT EXISTS team_advanced_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  team_id TEXT NOT NULL,
  team_name TEXT NOT NULL,
  team_abbr TEXT NOT NULL,
  sport TEXT NOT NULL,
  season_year INTEGER NOT NULL,
  
  -- Universal stats
  games_played INTEGER DEFAULT 0,
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  
  -- Pace & Tempo (varies by sport)
  pace DECIMAL(6,2), -- Possessions per game (NBA), plays per game (NFL)
  tempo_rank INTEGER,
  
  -- Scoring
  points_per_game DECIMAL(6,2),
  points_allowed_per_game DECIMAL(6,2),
  point_differential DECIMAL(6,2),
  
  -- Efficiency
  offensive_efficiency DECIMAL(8,4), -- Points per 100 possessions (NBA) or per play (NFL)
  defensive_efficiency DECIMAL(8,4),
  net_efficiency DECIMAL(8,4),
  
  -- Sport-specific stats (stored as JSONB for flexibility)
  sport_stats JSONB DEFAULT '{}',
  -- NFL: { rush_pct, pass_pct, yards_per_play, third_down_pct, red_zone_pct, turnover_margin }
  -- NBA: { true_shooting_pct, rebound_rate, assist_pct, turnover_pct, three_point_rate }
  -- MLB: { runs_per_game, era, whip, batting_avg, ops, bullpen_era }
  -- NHL: { goals_per_game, shots_per_game, power_play_pct, penalty_kill_pct, save_pct }
  
  -- Situational stats
  home_record TEXT, -- "10-3"
  away_record TEXT,
  vs_spread_home TEXT, -- "8-5"
  vs_spread_away TEXT,
  over_under_home TEXT, -- "7-6"
  over_under_away TEXT,
  
  -- Rest/Schedule factors
  avg_rest_days DECIMAL(4,2),
  back_to_back_record TEXT,
  
  -- Rankings
  overall_rank INTEGER,
  offensive_rank INTEGER,
  defensive_rank INTEGER,
  
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(team_abbr, sport, season_year)
);

CREATE INDEX IF NOT EXISTS idx_team_stats_team ON team_advanced_stats(team_abbr);
CREATE INDEX IF NOT EXISTS idx_team_stats_sport ON team_advanced_stats(sport);
CREATE INDEX IF NOT EXISTS idx_team_stats_season ON team_advanced_stats(season_year);
CREATE INDEX IF NOT EXISTS idx_team_stats_sport_season ON team_advanced_stats(sport, season_year);

ALTER TABLE team_advanced_stats ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Team stats publicly readable" ON team_advanced_stats;
CREATE POLICY "Team stats publicly readable" ON team_advanced_stats 
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Service role manages team stats" ON team_advanced_stats;
CREATE POLICY "Service role manages team stats" ON team_advanced_stats 
  FOR ALL USING (auth.role() = 'service_role');

-- ============================================================================
-- 9. SCHEDULE FACTORS
-- Rest days, travel distance, situational factors per game
-- ============================================================================
CREATE TABLE IF NOT EXISTS schedule_factors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  game_id TEXT NOT NULL UNIQUE,
  sport TEXT NOT NULL,
  
  -- Teams
  home_team TEXT NOT NULL,
  away_team TEXT NOT NULL,
  
  -- Rest days
  home_rest_days INTEGER, -- Days since last game
  away_rest_days INTEGER,
  rest_advantage TEXT, -- 'home', 'away', 'even'
  rest_advantage_days INTEGER,
  
  -- Travel
  away_travel_distance INTEGER, -- Miles traveled
  away_time_zone_change INTEGER, -- -3, -2, -1, 0, 1, 2, 3
  away_travel_direction TEXT, -- 'east', 'west', 'none'
  
  -- Back-to-back / Schedule spots
  home_is_back_to_back BOOLEAN DEFAULT false,
  away_is_back_to_back BOOLEAN DEFAULT false,
  home_games_in_week INTEGER, -- Games in last 7 days
  away_games_in_week INTEGER,
  
  -- Situational factors
  is_rivalry_game BOOLEAN DEFAULT false,
  is_revenge_game BOOLEAN DEFAULT false, -- Lost to this team recently
  home_last_result TEXT, -- 'W', 'L'
  away_last_result TEXT,
  home_streak INTEGER, -- Positive = win streak, negative = lose streak
  away_streak INTEGER,
  
  -- Look-ahead / Let-down spots
  home_next_game_quality TEXT, -- 'divisional_leader', 'playoff_team', 'rivalry', 'bottom_feeder'
  away_next_game_quality TEXT,
  is_look_ahead_spot BOOLEAN DEFAULT false,
  is_let_down_spot BOOLEAN DEFAULT false,
  
  -- Calculated factors
  schedule_edge TEXT, -- 'strong_home', 'slight_home', 'even', 'slight_away', 'strong_away'
  schedule_edge_score INTEGER, -- -100 to 100
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_schedule_game ON schedule_factors(game_id);
CREATE INDEX IF NOT EXISTS idx_schedule_sport ON schedule_factors(sport);

ALTER TABLE schedule_factors ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Schedule factors publicly readable" ON schedule_factors;
CREATE POLICY "Schedule factors publicly readable" ON schedule_factors 
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Service role manages schedule" ON schedule_factors;
CREATE POLICY "Service role manages schedule" ON schedule_factors 
  FOR ALL USING (auth.role() = 'service_role');

-- ============================================================================
-- 10. LIVE GAME PLAYER STATS
-- Real-time player stats during live games
-- ============================================================================
CREATE TABLE IF NOT EXISTS live_player_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  game_id TEXT NOT NULL,
  player_id TEXT NOT NULL,
  sport TEXT NOT NULL,
  
  -- Player info
  player_name TEXT NOT NULL,
  team TEXT,
  position TEXT,
  
  -- Current game stats (JSONB for sport flexibility)
  stats JSONB NOT NULL,
  -- NFL QB: { passing_yards, passing_tds, interceptions, completions, attempts, rushing_yards }
  -- NBA: { points, rebounds, assists, steals, blocks, turnovers, minutes, fouls }
  -- MLB: { at_bats, hits, runs, rbis, walks, strikeouts, home_runs, stolen_bases }
  -- NHL: { goals, assists, shots, plus_minus, penalty_minutes, time_on_ice }
  
  -- Prop tracking (does current stat beat the prop line?)
  prop_status JSONB DEFAULT '{}',
  -- { "passing_yards": { "line": 285.5, "current": 212, "is_over": false, "pace": 318 } }
  
  -- Timestamps
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(game_id, player_id)
);

CREATE INDEX IF NOT EXISTS idx_live_stats_game ON live_player_stats(game_id);
CREATE INDEX IF NOT EXISTS idx_live_stats_player ON live_player_stats(player_id);
CREATE INDEX IF NOT EXISTS idx_live_stats_updated ON live_player_stats(last_updated DESC);

ALTER TABLE live_player_stats ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Live stats publicly readable" ON live_player_stats;
CREATE POLICY "Live stats publicly readable" ON live_player_stats 
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Service role manages live stats" ON live_player_stats;
CREATE POLICY "Service role manages live stats" ON live_player_stats 
  FOR ALL USING (auth.role() = 'service_role');

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to relevant tables
DO $$
BEGIN
  -- user_bets
  DROP TRIGGER IF EXISTS update_user_bets_updated_at ON user_bets;
  CREATE TRIGGER update_user_bets_updated_at
    BEFORE UPDATE ON user_bets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    
  -- favorite_players
  DROP TRIGGER IF EXISTS update_favorite_players_updated_at ON favorite_players;
  CREATE TRIGGER update_favorite_players_updated_at
    BEFORE UPDATE ON favorite_players
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    
  -- officials
  DROP TRIGGER IF EXISTS update_officials_updated_at ON officials;
  CREATE TRIGGER update_officials_updated_at
    BEFORE UPDATE ON officials
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    
  -- team_advanced_stats
  DROP TRIGGER IF EXISTS update_team_stats_updated_at ON team_advanced_stats;
  CREATE TRIGGER update_team_stats_updated_at
    BEFORE UPDATE ON team_advanced_stats
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
END $$;

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================
COMMENT ON TABLE user_bets IS 'User bet tracking with real-time status (covering/losing), win probability, and cash out values';
COMMENT ON TABLE favorite_players IS 'Users favorite players to track across all games with notification preferences';
COMMENT ON TABLE officials IS 'Referee and umpire data with betting tendencies (over %, home cover %, penalties per game)';
COMMENT ON TABLE game_officials IS 'Links officials to specific games for pre-game analysis';
COMMENT ON TABLE head_to_head_cache IS 'Cached head-to-head matchup history between teams';
COMMENT ON TABLE betting_splits_enhanced IS 'Public vs sharp money percentages with reverse line movement detection';
COMMENT ON TABLE player_props IS 'Player prop lines from multiple sportsbooks with historical performance';
COMMENT ON TABLE team_advanced_stats IS 'Advanced team stats including pace, efficiency, and situational records';
COMMENT ON TABLE schedule_factors IS 'Rest days, travel, back-to-back, and situational factors per game';
COMMENT ON TABLE live_player_stats IS 'Real-time player stats during live games for prop tracking';
