-- ===========================================
-- HISTORICAL DATA SCHEMA (2 Years: 2024-2026)
-- Provides backtesting data for Edge Finder, Trends, and Prediction Markets
-- ===========================================

-- Enable extensions if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===========================================
-- HISTORICAL GAMES & RESULTS (2024-2026)
-- ===========================================

CREATE TABLE IF NOT EXISTS public.historical_games (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  external_id TEXT UNIQUE,
  sport TEXT NOT NULL CHECK (sport IN ('NFL', 'NBA', 'NHL', 'MLB', 'NCAAF', 'NCAAB')),
  season_year INTEGER NOT NULL,
  season_type TEXT DEFAULT 'regular' CHECK (season_type IN ('preseason', 'regular', 'postseason')),
  week_number INTEGER, -- For football
  
  -- Team info
  home_team TEXT NOT NULL,
  away_team TEXT NOT NULL,
  home_team_abbrev TEXT,
  away_team_abbrev TEXT,
  
  -- Game details
  game_date TIMESTAMPTZ NOT NULL,
  venue TEXT,
  is_neutral_site BOOLEAN DEFAULT FALSE,
  
  -- Final scores
  home_score INTEGER NOT NULL,
  away_score INTEGER NOT NULL,
  
  -- Opening lines (consensus)
  open_spread DECIMAL(5,1), -- Positive = home underdog
  open_total DECIMAL(5,1),
  open_home_ml INTEGER,
  open_away_ml INTEGER,
  
  -- Closing lines (consensus)
  close_spread DECIMAL(5,1),
  close_total DECIMAL(5,1),
  close_home_ml INTEGER,
  close_away_ml INTEGER,
  
  -- Results
  spread_result TEXT CHECK (spread_result IN ('home_cover', 'away_cover', 'push')),
  total_result TEXT CHECK (total_result IN ('over', 'under', 'push')),
  home_ml_result TEXT CHECK (home_ml_result IN ('win', 'loss')),
  
  -- Public betting percentages
  public_spread_home_pct INTEGER, -- % of bets on home spread
  public_money_home_pct INTEGER, -- % of money on home spread
  public_total_over_pct INTEGER,
  public_ml_home_pct INTEGER,
  
  -- Additional context
  home_team_record TEXT, -- e.g., "8-3"
  away_team_record TEXT,
  rivalry_game BOOLEAN DEFAULT FALSE,
  primetime_game BOOLEAN DEFAULT FALSE, -- SNF, MNF, TNF
  divisional_game BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for historical games
CREATE INDEX IF NOT EXISTS idx_hist_games_sport ON public.historical_games(sport);
CREATE INDEX IF NOT EXISTS idx_hist_games_date ON public.historical_games(game_date);
CREATE INDEX IF NOT EXISTS idx_hist_games_season ON public.historical_games(season_year, sport);
CREATE INDEX IF NOT EXISTS idx_hist_games_teams ON public.historical_games(home_team, away_team);

-- ===========================================
-- HISTORICAL TRENDS ANALYSIS
-- Pre-computed trend performance over 2 years
-- ===========================================

CREATE TABLE IF NOT EXISTS public.historical_trends (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  trend_id TEXT UNIQUE NOT NULL,
  sport TEXT NOT NULL CHECK (sport IN ('NFL', 'NBA', 'NHL', 'MLB', 'NCAAF', 'NCAAB', 'ALL')),
  category TEXT NOT NULL CHECK (category IN ('situational', 'team', 'public_fade', 'sharp', 'timing', 'weather', 'revenge', 'rest', 'travel', 'contrarian', 'value')),
  bet_type TEXT NOT NULL CHECK (bet_type IN ('spread', 'total', 'moneyline', 'first_half', 'first_quarter')),
  
  -- Trend definition
  trend_name TEXT NOT NULL,
  trend_description TEXT NOT NULL,
  trend_criteria JSONB NOT NULL, -- Detailed criteria for matching
  
  -- Performance metrics by time period
  -- Last 30 days
  l30_record TEXT, -- "15-8"
  l30_units DECIMAL(6,2),
  l30_roi DECIMAL(5,2),
  l30_avg_odds INTEGER,
  
  -- Last 90 days
  l90_record TEXT,
  l90_units DECIMAL(6,2),
  l90_roi DECIMAL(5,2),
  l90_avg_odds INTEGER,
  
  -- Last 365 days (1 year)
  l365_record TEXT,
  l365_units DECIMAL(6,2),
  l365_roi DECIMAL(5,2),
  l365_avg_odds INTEGER,
  
  -- Full 2 years
  all_time_record TEXT,
  all_time_units DECIMAL(6,2),
  all_time_roi DECIMAL(5,2),
  all_time_avg_odds INTEGER,
  all_time_sample_size INTEGER,
  
  -- Current status
  is_active BOOLEAN DEFAULT TRUE,
  hot_streak BOOLEAN DEFAULT FALSE,
  cold_streak BOOLEAN DEFAULT FALSE,
  confidence_score INTEGER CHECK (confidence_score BETWEEN 0 AND 100),
  
  -- Monthly breakdown for charting
  monthly_performance JSONB, -- Array of {month, year, record, units, roi}
  
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hist_trends_sport ON public.historical_trends(sport);
CREATE INDEX IF NOT EXISTS idx_hist_trends_category ON public.historical_trends(category);
CREATE INDEX IF NOT EXISTS idx_hist_trends_active ON public.historical_trends(is_active);

-- ===========================================
-- HISTORICAL PREDICTION MARKET DATA
-- Polymarket, Kalshi, PredictIt historical prices
-- ===========================================

CREATE TABLE IF NOT EXISTS public.historical_prediction_markets (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  external_id TEXT,
  platform TEXT NOT NULL CHECK (platform IN ('polymarket', 'kalshi', 'predictit', 'metaculus')),
  market_category TEXT NOT NULL CHECK (market_category IN ('sports', 'politics', 'crypto', 'entertainment', 'finance', 'world_events', 'elections')),
  
  -- Market details
  market_title TEXT NOT NULL,
  market_description TEXT,
  market_slug TEXT,
  
  -- Sports-specific
  sport TEXT CHECK (sport IN ('NFL', 'NBA', 'NHL', 'MLB', 'NCAAF', 'NCAAB', 'Soccer', 'Golf', 'Tennis', NULL)),
  event_name TEXT, -- "Super Bowl LVIII", "2024 NBA Finals"
  
  -- Timeline
  created_at TIMESTAMPTZ NOT NULL,
  resolved_at TIMESTAMPTZ,
  resolution_date TIMESTAMPTZ,
  
  -- Resolution
  resolved BOOLEAN DEFAULT FALSE,
  resolution TEXT CHECK (resolution IN ('yes', 'no', 'partial', 'void', NULL)),
  
  -- Volume & liquidity
  total_volume DECIMAL(15,2),
  total_shares_traded BIGINT,
  
  -- Price history (stored as JSONB for flexibility)
  -- Format: [{timestamp, yes_price, no_price, volume_24h}]
  price_history JSONB,
  
  -- Key price points
  initial_yes_price DECIMAL(5,4), -- 0-1
  final_yes_price DECIMAL(5,4),
  peak_yes_price DECIMAL(5,4),
  low_yes_price DECIMAL(5,4),
  
  -- Calculated metrics
  price_volatility DECIMAL(5,4),
  sharpe_ratio DECIMAL(5,2),
  
  -- Our system's performance on this market
  our_prediction TEXT CHECK (our_prediction IN ('yes', 'no', NULL)),
  our_confidence INTEGER CHECK (our_confidence BETWEEN 0 AND 100),
  our_entry_price DECIMAL(5,4),
  our_exit_price DECIMAL(5,4),
  our_pnl_pct DECIMAL(6,2),
  
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hist_pm_platform ON public.historical_prediction_markets(platform);
CREATE INDEX IF NOT EXISTS idx_hist_pm_category ON public.historical_prediction_markets(market_category);
CREATE INDEX IF NOT EXISTS idx_hist_pm_sport ON public.historical_prediction_markets(sport);
CREATE INDEX IF NOT EXISTS idx_hist_pm_resolved ON public.historical_prediction_markets(resolved);

-- ===========================================
-- EDGE FINDER HISTORICAL PERFORMANCE
-- Track our system's recommendations over 2 years
-- ===========================================

CREATE TABLE IF NOT EXISTS public.historical_edge_picks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  pick_date DATE NOT NULL,
  sport TEXT NOT NULL CHECK (sport IN ('NFL', 'NBA', 'NHL', 'MLB', 'NCAAF', 'NCAAB')),
  game_id UUID REFERENCES public.historical_games(id),
  
  -- Pick details
  pick_type TEXT NOT NULL CHECK (pick_type IN ('spread', 'total', 'moneyline', 'prop', 'parlay_leg', 'puckline', 'runline', 'first_half', 'first_quarter', 'player_prop')),
  selection TEXT NOT NULL, -- "Chiefs -3", "Over 47.5", "Lakers ML"
  odds INTEGER NOT NULL,
  
  -- Edge analysis
  edge_source TEXT NOT NULL CHECK (edge_source IN ('ai_model', 'trend', 'sharp_money', 'clv', 'contrarian', 'situational', 'value')),
  edge_score INTEGER CHECK (edge_score BETWEEN 0 AND 100),
  confidence INTEGER CHECK (confidence BETWEEN 0 AND 100),
  
  -- Calculated edges
  model_probability DECIMAL(5,4), -- Our model's win probability
  implied_probability DECIMAL(5,4), -- Odds-implied probability
  edge_percentage DECIMAL(5,2), -- Model prob - implied prob
  
  -- CLV tracking
  odds_at_pick INTEGER,
  closing_line INTEGER,
  clv_cents INTEGER, -- Closing line value gained
  beat_close BOOLEAN,
  
  -- Result
  result TEXT CHECK (result IN ('win', 'loss', 'push', 'pending')),
  units_wagered DECIMAL(4,2) DEFAULT 1.0,
  units_won_lost DECIMAL(6,2),
  
  -- Supporting data
  supporting_trends TEXT[], -- Array of trend IDs that supported this pick
  public_side BOOLEAN, -- Were we with or against public?
  sharp_side BOOLEAN, -- Were we with sharps?
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hist_edge_date ON public.historical_edge_picks(pick_date);
CREATE INDEX IF NOT EXISTS idx_hist_edge_sport ON public.historical_edge_picks(sport);
CREATE INDEX IF NOT EXISTS idx_hist_edge_result ON public.historical_edge_picks(result);
CREATE INDEX IF NOT EXISTS idx_hist_edge_source ON public.historical_edge_picks(edge_source);

-- ===========================================
-- SYSTEM PERFORMANCE SUMMARY
-- Aggregated stats for quick dashboard display
-- ===========================================

CREATE TABLE IF NOT EXISTS public.system_performance_summary (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  period_type TEXT NOT NULL CHECK (period_type IN ('daily', 'weekly', 'monthly', 'quarterly', 'yearly', 'all_time')),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  sport TEXT CHECK (sport IN ('NFL', 'NBA', 'NHL', 'MLB', 'NCAAF', 'NCAAB', 'ALL')),
  
  -- Edge Finder performance
  edge_total_picks INTEGER DEFAULT 0,
  edge_wins INTEGER DEFAULT 0,
  edge_losses INTEGER DEFAULT 0,
  edge_pushes INTEGER DEFAULT 0,
  edge_win_rate DECIMAL(5,2),
  edge_units DECIMAL(8,2),
  edge_roi DECIMAL(5,2),
  edge_avg_odds INTEGER,
  edge_clv_avg DECIMAL(5,2),
  
  -- Trend performance
  trend_total_picks INTEGER DEFAULT 0,
  trend_wins INTEGER DEFAULT 0,
  trend_losses INTEGER DEFAULT 0,
  trend_win_rate DECIMAL(5,2),
  trend_units DECIMAL(8,2),
  trend_roi DECIMAL(5,2),
  
  -- Prediction market performance
  pm_total_markets INTEGER DEFAULT 0,
  pm_correct INTEGER DEFAULT 0,
  pm_roi DECIMAL(5,2),
  
  -- Streak tracking
  current_streak INTEGER DEFAULT 0,
  best_streak INTEGER DEFAULT 0,
  worst_streak INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(period_type, period_start, sport)
);

-- ===========================================
-- INSERT 2 YEARS OF SAMPLE HISTORICAL DATA
-- ===========================================

-- NFL Historical Games (2024 Season Sample)
INSERT INTO public.historical_games (
  sport, season_year, season_type, week_number, home_team, away_team, 
  home_team_abbrev, away_team_abbrev, game_date, home_score, away_score,
  open_spread, open_total, close_spread, close_total,
  spread_result, total_result, home_ml_result,
  public_spread_home_pct, public_money_home_pct, primetime_game, divisional_game
) VALUES 
-- 2024 NFL Season Week 1
('NFL', 2024, 'regular', 1, 'Kansas City Chiefs', 'Baltimore Ravens', 'KC', 'BAL', '2024-09-05 20:20:00', 27, 20, -3.5, 47.5, -3, 46.5, 'home_cover', 'over', 'win', 68, 72, TRUE, FALSE),
('NFL', 2024, 'regular', 1, 'Philadelphia Eagles', 'Green Bay Packers', 'PHI', 'GB', '2024-09-06 20:15:00', 34, 29, -2.5, 49, -3, 48.5, 'home_cover', 'over', 'win', 55, 48, TRUE, FALSE),
('NFL', 2024, 'regular', 1, 'Dallas Cowboys', 'Cleveland Browns', 'DAL', 'CLE', '2024-09-08 16:25:00', 33, 17, -5.5, 45, -6, 44.5, 'home_cover', 'over', 'win', 71, 78, FALSE, FALSE),
('NFL', 2024, 'regular', 1, 'San Francisco 49ers', 'New York Jets', 'SF', 'NYJ', '2024-09-09 20:15:00', 32, 19, -4, 43.5, -4.5, 44, 'home_cover', 'over', 'win', 62, 65, TRUE, FALSE),
-- Week 2
('NFL', 2024, 'regular', 2, 'Buffalo Bills', 'Miami Dolphins', 'BUF', 'MIA', '2024-09-12 20:15:00', 31, 10, -2.5, 52, -2.5, 51.5, 'home_cover', 'under', 'win', 45, 42, TRUE, TRUE),
('NFL', 2024, 'regular', 2, 'Detroit Lions', 'Tampa Bay Buccaneers', 'DET', 'TB', '2024-09-15 13:00:00', 20, 16, -7, 51.5, -7.5, 52, 'away_cover', 'under', 'win', 73, 80, FALSE, FALSE),
('NFL', 2024, 'regular', 2, 'Cincinnati Bengals', 'Kansas City Chiefs', 'CIN', 'KC', '2024-09-15 16:25:00', 25, 26, 5.5, 47, 5, 46.5, 'home_cover', 'over', 'loss', 38, 35, FALSE, FALSE),
-- Continue through season...
('NFL', 2024, 'regular', 17, 'Las Vegas Raiders', 'Denver Broncos', 'LV', 'DEN', '2024-12-29 16:25:00', 17, 23, 2.5, 41.5, 3, 41, 'away_cover', 'under', 'loss', 42, 38, FALSE, TRUE),
('NFL', 2024, 'regular', 18, 'Seattle Seahawks', 'Los Angeles Rams', 'SEA', 'LAR', '2025-01-05 16:25:00', 30, 25, -1, 48, -1.5, 47.5, 'home_cover', 'over', 'win', 54, 51, FALSE, TRUE),

-- 2024-25 NBA Season Sample
('NBA', 2024, 'regular', NULL, 'Boston Celtics', 'New York Knicks', 'BOS', 'NYK', '2024-10-22 19:30:00', 132, 109, -9.5, 224.5, -10, 225, 'home_cover', 'over', 'win', 75, 82, TRUE, FALSE),
('NBA', 2024, 'regular', NULL, 'Los Angeles Lakers', 'Minnesota Timberwolves', 'LAL', 'MIN', '2024-10-22 22:00:00', 110, 103, 1.5, 218, 1, 217.5, 'home_cover', 'under', 'win', 68, 72, TRUE, FALSE),
('NBA', 2024, 'regular', NULL, 'Denver Nuggets', 'Oklahoma City Thunder', 'DEN', 'OKC', '2024-10-24 21:00:00', 102, 87, -4.5, 223, -5, 222.5, 'home_cover', 'under', 'win', 58, 62, FALSE, FALSE),
('NBA', 2024, 'regular', NULL, 'Milwaukee Bucks', 'Philadelphia 76ers', 'MIL', 'PHI', '2024-10-26 19:30:00', 124, 109, -6, 228.5, -6.5, 228, 'home_cover', 'over', 'win', 66, 70, FALSE, FALSE),
('NBA', 2024, 'regular', NULL, 'Phoenix Suns', 'Dallas Mavericks', 'PHX', 'DAL', '2024-10-28 21:30:00', 118, 120, -2, 230, -2.5, 229.5, 'away_cover', 'over', 'loss', 61, 58, FALSE, FALSE),
('NBA', 2024, 'regular', NULL, 'Golden State Warriors', 'Cleveland Cavaliers', 'GSW', 'CLE', '2024-11-02 20:30:00', 104, 136, -3, 227, -2.5, 226.5, 'away_cover', 'over', 'loss', 69, 74, FALSE, FALSE),

-- 2024 NHL Season Sample
('NHL', 2024, 'regular', NULL, 'Colorado Avalanche', 'Vegas Golden Knights', 'COL', 'VGK', '2024-10-09 21:00:00', 4, 3, -1.5, 6.5, -1.5, 6.5, 'push', 'over', 'win', 60, 58, FALSE, TRUE),
('NHL', 2024, 'regular', NULL, 'Edmonton Oilers', 'Winnipeg Jets', 'EDM', 'WPG', '2024-10-09 21:00:00', 3, 0, -1.5, 6, -1.5, 6, 'home_cover', 'under', 'win', 62, 65, FALSE, TRUE),
('NHL', 2024, 'regular', NULL, 'Toronto Maple Leafs', 'Montreal Canadiens', 'TOR', 'MTL', '2024-10-12 19:00:00', 1, 0, -1.5, 6, -1.5, 5.5, 'away_cover', 'under', 'win', 72, 78, TRUE, TRUE),
('NHL', 2024, 'regular', NULL, 'Boston Bruins', 'Florida Panthers', 'BOS', 'FLA', '2024-10-14 19:00:00', 2, 5, -1.5, 6, -1.5, 6, 'away_cover', 'over', 'loss', 68, 70, FALSE, TRUE),

-- 2024 MLB Season Sample
('MLB', 2024, 'regular', NULL, 'Los Angeles Dodgers', 'San Diego Padres', 'LAD', 'SD', '2024-04-01 19:10:00', 7, 4, -1.5, 8, -1.5, 8.5, 'home_cover', 'over', 'win', 75, 80, FALSE, TRUE),
('MLB', 2024, 'regular', NULL, 'New York Yankees', 'Boston Red Sox', 'NYY', 'BOS', '2024-04-05 19:05:00', 5, 3, -1.5, 9, -1.5, 8.5, 'home_cover', 'under', 'win', 68, 72, TRUE, TRUE),
('MLB', 2024, 'regular', NULL, 'Atlanta Braves', 'Philadelphia Phillies', 'ATL', 'PHI', '2024-04-10 19:20:00', 8, 9, -1.5, 8.5, -1.5, 9, 'away_cover', 'over', 'loss', 62, 58, FALSE, TRUE),
('MLB', 2024, 'regular', NULL, 'Houston Astros', 'Texas Rangers', 'HOU', 'TEX', '2024-04-15 20:10:00', 4, 2, -1.5, 8, -1.5, 7.5, 'home_cover', 'under', 'win', 58, 55, FALSE, TRUE),

-- 2025 Season Games (current year)
('NFL', 2025, 'regular', 1, 'Kansas City Chiefs', 'Detroit Lions', 'KC', 'DET', '2025-09-04 20:20:00', 24, 21, -2.5, 50.5, -2.5, 51, 'home_cover', 'under', 'win', 58, 62, TRUE, FALSE),
('NFL', 2025, 'regular', 1, 'Buffalo Bills', 'Philadelphia Eagles', 'BUF', 'PHI', '2025-09-07 20:15:00', 31, 28, -3, 52, -3.5, 51.5, 'home_cover', 'over', 'win', 52, 55, TRUE, FALSE),
('NBA', 2025, 'regular', NULL, 'Boston Celtics', 'Milwaukee Bucks', 'BOS', 'MIL', '2025-10-21 19:30:00', 118, 112, -5.5, 230, -6, 229.5, 'home_cover', 'over', 'win', 64, 68, TRUE, FALSE),
('NBA', 2025, 'regular', NULL, 'Oklahoma City Thunder', 'Denver Nuggets', 'OKC', 'DEN', '2025-10-23 21:00:00', 125, 118, -1.5, 228, -2, 227, 'home_cover', 'over', 'win', 48, 45, FALSE, FALSE);

-- ===========================================
-- HISTORICAL TRENDS (Pre-computed 2-year analysis)
-- ===========================================

INSERT INTO public.historical_trends (
  trend_id, sport, category, bet_type, trend_name, trend_description, trend_criteria,
  l30_record, l30_units, l30_roi, l30_avg_odds,
  l90_record, l90_units, l90_roi, l90_avg_odds,
  l365_record, l365_units, l365_roi, l365_avg_odds,
  all_time_record, all_time_units, all_time_roi, all_time_avg_odds, all_time_sample_size,
  is_active, hot_streak, confidence_score, monthly_performance
) VALUES 
-- NFL Trends
('nfl-home-dog-ats', 'NFL', 'situational', 'spread', 'NFL Home Underdogs ATS', 
 'Home underdogs of +3 or more points against the spread in regular season games',
 '{"spread_min": 3, "location": "home", "season_type": "regular"}',
 '8-4', 4.2, 12.8, -108, '24-16', 8.5, 10.2, -110, '89-62', 28.4, 11.2, -109, '178-124', 56.8, 10.8, -109, 302,
 TRUE, TRUE, 88,
 '[{"month": "Sep", "year": 2025, "record": "3-1", "units": 2.1}, {"month": "Oct", "year": 2025, "record": "5-3", "units": 2.1}]'),

('nfl-road-fav-playoffs', 'NFL', 'situational', 'spread', 'NFL Road Favorites in Playoffs',
 'Road favorites in NFL playoff games historically cover at a high rate',
 '{"spread_min": -1, "location": "away", "season_type": "postseason"}',
 '2-1', 1.5, 18.2, -115, '6-3', 3.2, 14.5, -112, '15-9', 7.8, 12.8, -110, '31-18', 15.2, 14.2, -111, 49,
 TRUE, FALSE, 82,
 '[{"month": "Jan", "year": 2025, "record": "2-1", "units": 1.5}]'),

('nfl-primetime-under', 'NFL', 'timing', 'total', 'NFL Primetime Unders',
 'Under bets in Sunday/Monday/Thursday Night Football games',
 '{"primetime": true, "bet": "under"}',
 '6-4', 2.1, 8.4, -110, '18-14', 4.8, 7.2, -110, '68-52', 18.5, 8.8, -110, '142-108', 38.2, 9.2, -110, 250,
 TRUE, FALSE, 76,
 '[{"month": "Sep", "year": 2025, "record": "2-1", "units": 1.2}, {"month": "Oct", "year": 2025, "record": "4-3", "units": 0.9}]'),

('nfl-divisional-dog', 'NFL', 'situational', 'spread', 'NFL Divisional Underdogs',
 'Underdogs in divisional matchups tend to keep games close',
 '{"divisional": true, "spread_min": 3}',
 '5-3', 2.4, 11.5, -108, '16-11', 6.2, 10.8, -108, '62-45', 20.8, 11.2, -108, '128-92', 42.5, 11.5, -108, 220,
 TRUE, FALSE, 79,
 '[{"month": "Oct", "year": 2025, "record": "5-3", "units": 2.4}]'),

-- NBA Trends
('nba-b2b-fade', 'NBA', 'rest', 'spread', 'Fade NBA Back-to-Backs',
 'Bet against teams playing second night of back-to-back, especially on the road',
 '{"rest_days": 0, "location": "away"}',
 '12-6', 6.8, 15.2, -108, '38-22', 18.5, 14.8, -108, '156-98', 68.2, 14.2, -108, '312-196', 136.8, 14.5, -108, 508,
 TRUE, TRUE, 91,
 '[{"month": "Nov", "year": 2025, "record": "6-2", "units": 4.2}, {"month": "Dec", "year": 2025, "record": "6-4", "units": 2.6}]'),

('nba-home-dog-3plus', 'NBA', 'situational', 'spread', 'NBA Home Dogs +3 or More',
 'Home underdogs getting 3+ points in NBA regular season',
 '{"spread_min": 3, "location": "home"}',
 '10-7', 3.8, 9.2, -110, '32-24', 10.2, 8.5, -110, '128-96', 38.5, 10.2, -110, '258-194', 78.2, 10.8, -110, 452,
 TRUE, FALSE, 84,
 '[{"month": "Nov", "year": 2025, "record": "4-3", "units": 1.2}, {"month": "Dec", "year": 2025, "record": "6-4", "units": 2.6}]'),

('nba-revenge-spots', 'NBA', 'revenge', 'spread', 'NBA Revenge Game Spots',
 'Teams playing opponent that beat them by 15+ in last matchup',
 '{"revenge_margin": 15, "days_since": 30}',
 '8-3', 5.4, 18.5, -108, '26-14', 14.2, 16.2, -108, '98-62', 42.5, 15.8, -109, '198-122', 88.2, 16.2, -109, 320,
 TRUE, TRUE, 86,
 '[{"month": "Nov", "year": 2025, "record": "3-1", "units": 2.2}, {"month": "Dec", "year": 2025, "record": "5-2", "units": 3.2}]'),

-- NHL Trends
('nhl-road-fav-b2b', 'NHL', 'rest', 'spread', 'Fade NHL Road Favorites on B2B',
 'Road favorites playing second night of back-to-back',
 '{"rest_days": 0, "location": "away", "favorite": true}',
 '7-4', 3.5, 12.8, -115, '22-14', 9.8, 11.5, -115, '88-56', 38.2, 14.2, -114, '178-112', 78.5, 14.8, -114, 290,
 TRUE, FALSE, 81,
 '[{"month": "Nov", "year": 2025, "record": "4-2", "units": 2.2}, {"month": "Dec", "year": 2025, "record": "3-2", "units": 1.3}]'),

('nhl-divisional-over', 'NHL', 'situational', 'total', 'NHL Divisional Game Overs',
 'Over bets in divisional rivalry games tend to cash',
 '{"divisional": true, "bet": "over"}',
 '6-5', 1.2, 5.2, -110, '20-15', 5.8, 8.2, -110, '78-58', 22.5, 9.5, -110, '162-118', 48.2, 10.2, -110, 280,
 TRUE, FALSE, 74,
 '[{"month": "Nov", "year": 2025, "record": "3-2", "units": 0.8}, {"month": "Dec", "year": 2025, "record": "3-3", "units": 0.4}]'),

-- MLB Trends
('mlb-dog-plus150', 'MLB', 'contrarian', 'moneyline', 'MLB Big Underdogs +150 or More',
 'Heavy underdogs in MLB provide value due to any team can win on any day',
 '{"odds_min": 150, "bet": "moneyline"}',
 '8-18', 2.8, 5.2, 168, '28-62', 10.5, 4.8, 172, '112-248', 42.8, 5.5, 175, '228-502', 88.5, 5.8, 178, 730,
 TRUE, FALSE, 72,
 '[{"month": "Aug", "year": 2025, "record": "3-8", "units": 0.8}, {"month": "Sep", "year": 2025, "record": "5-10", "units": 2.0}]'),

('mlb-first-5-home', 'MLB', 'timing', 'moneyline', 'MLB First 5 Innings Home Favorites',
 'First 5 inning money lines on home favorites with ace pitchers',
 '{"bet": "first_5", "location": "home", "favorite": true}',
 '10-6', 4.2, 12.5, -125, '32-20', 13.8, 11.8, -122, '128-82', 52.5, 12.2, -120, '262-168', 108.2, 12.8, -118, 430,
 TRUE, FALSE, 80,
 '[{"month": "Aug", "year": 2025, "record": "5-3", "units": 2.2}, {"month": "Sep", "year": 2025, "record": "5-3", "units": 2.0}]'),

-- Cross-Sport Trends
('all-public-fade', 'ALL', 'public_fade', 'spread', 'Fade Heavy Public Sides',
 'Bet against teams receiving 75%+ of public bets',
 '{"public_pct_min": 75, "fade": true}',
 '14-8', 7.2, 12.5, -108, '45-28', 20.5, 11.8, -108, '178-112', 78.5, 13.2, -108, '362-228', 158.2, 13.8, -108, 590,
 TRUE, TRUE, 89,
 '[{"month": "Nov", "year": 2025, "record": "6-3", "units": 3.5}, {"month": "Dec", "year": 2025, "record": "8-5", "units": 3.7}]'),

('all-sharp-follow', 'ALL', 'sharp', 'spread', 'Follow Sharp Money Movement',
 'Follow line moves that indicate sharp bettor action',
 '{"sharp_indicator": true, "line_move_min": 1.5}',
 '12-6', 6.8, 15.2, -110, '42-24', 21.5, 14.5, -110, '168-96', 82.5, 15.8, -110, '342-194', 168.2, 16.2, -110, 536,
 TRUE, TRUE, 92,
 '[{"month": "Nov", "year": 2025, "record": "5-2", "units": 3.2}, {"month": "Dec", "year": 2025, "record": "7-4", "units": 3.6}]');

-- ===========================================
-- HISTORICAL PREDICTION MARKETS
-- ===========================================

INSERT INTO public.historical_prediction_markets (
  platform, market_category, market_title, market_description, sport, event_name,
  created_at, resolved_at, resolved, resolution, total_volume,
  initial_yes_price, final_yes_price, peak_yes_price, low_yes_price,
  our_prediction, our_confidence, our_entry_price, our_exit_price, our_pnl_pct,
  price_history
) VALUES 
-- 2024 Sports Markets
('polymarket', 'sports', 'Kansas City Chiefs to win Super Bowl LVIII', 'Will the Kansas City Chiefs win Super Bowl LVIII?', 'NFL', 'Super Bowl LVIII',
 '2023-09-01', '2024-02-11', TRUE, 'yes', 45000000,
 0.12, 1.00, 1.00, 0.08, 'yes', 78, 0.35, 0.92, 162.8,
 '[{"date": "2023-09-01", "price": 0.12}, {"date": "2023-12-01", "price": 0.18}, {"date": "2024-01-15", "price": 0.35}, {"date": "2024-02-11", "price": 1.00}]'),

('polymarket', 'sports', 'Boston Celtics to win 2024 NBA Championship', 'Will the Boston Celtics win the 2024 NBA Finals?', 'NBA', '2024 NBA Finals',
 '2023-10-15', '2024-06-17', TRUE, 'yes', 28000000,
 0.15, 1.00, 1.00, 0.10, 'yes', 82, 0.22, 0.95, 331.8,
 '[{"date": "2023-10-15", "price": 0.15}, {"date": "2024-02-01", "price": 0.25}, {"date": "2024-05-01", "price": 0.42}, {"date": "2024-06-17", "price": 1.00}]'),

('kalshi', 'sports', 'Caitlin Clark Rookie of the Year', 'Will Caitlin Clark win WNBA Rookie of the Year?', 'NBA', '2024 WNBA ROY',
 '2024-04-01', '2024-09-20', TRUE, 'yes', 8500000,
 0.65, 1.00, 1.00, 0.58, 'yes', 88, 0.68, 0.98, 44.1,
 '[{"date": "2024-04-01", "price": 0.65}, {"date": "2024-06-01", "price": 0.72}, {"date": "2024-08-01", "price": 0.85}, {"date": "2024-09-20", "price": 1.00}]'),

('polymarket', 'sports', 'Shohei Ohtani MVP', 'Will Shohei Ohtani win NL MVP in 2024?', 'MLB', '2024 NL MVP',
 '2024-03-15', '2024-11-21', TRUE, 'yes', 15000000,
 0.45, 1.00, 1.00, 0.38, 'yes', 75, 0.52, 0.96, 84.6,
 '[{"date": "2024-03-15", "price": 0.45}, {"date": "2024-06-01", "price": 0.55}, {"date": "2024-09-01", "price": 0.78}, {"date": "2024-11-21", "price": 1.00}]'),

-- 2025 Sports Markets (still active or recently resolved)
('polymarket', 'sports', 'Detroit Lions to win Super Bowl LIX', 'Will the Detroit Lions win Super Bowl LIX?', 'NFL', 'Super Bowl LIX',
 '2024-09-01', NULL, FALSE, NULL, 62000000,
 0.08, 0.18, 0.22, 0.06, 'yes', 72, 0.12, NULL, NULL,
 '[{"date": "2024-09-01", "price": 0.08}, {"date": "2024-12-01", "price": 0.15}, {"date": "2025-01-01", "price": 0.18}]'),

('kalshi', 'sports', 'Philadelphia Eagles to win NFC', 'Will the Philadelphia Eagles win the NFC Championship?', 'NFL', '2025 NFC Championship',
 '2024-09-01', NULL, FALSE, NULL, 18000000,
 0.12, 0.22, 0.28, 0.10, 'yes', 68, 0.15, NULL, NULL,
 '[{"date": "2024-09-01", "price": 0.12}, {"date": "2024-12-01", "price": 0.20}, {"date": "2025-01-01", "price": 0.22}]'),

('polymarket', 'sports', 'Oklahoma City Thunder to win 2025 NBA Championship', 'Will OKC win the 2025 NBA Finals?', 'NBA', '2025 NBA Finals',
 '2024-10-15', NULL, FALSE, NULL, 35000000,
 0.18, 0.28, 0.32, 0.15, 'yes', 76, 0.20, NULL, NULL,
 '[{"date": "2024-10-15", "price": 0.18}, {"date": "2024-12-15", "price": 0.25}, {"date": "2025-01-01", "price": 0.28}]'),

-- Political markets for comparison
('polymarket', 'politics', 'Trump to win 2024 Presidential Election', 'Will Donald Trump win the 2024 US Presidential Election?', NULL, '2024 US Election',
 '2024-01-01', '2024-11-06', TRUE, 'yes', 850000000,
 0.38, 1.00, 1.00, 0.32, 'yes', 65, 0.42, 0.95, 126.2,
 '[{"date": "2024-01-01", "price": 0.38}, {"date": "2024-07-01", "price": 0.58}, {"date": "2024-10-01", "price": 0.52}, {"date": "2024-11-06", "price": 1.00}]'),

('kalshi', 'politics', 'Republicans to win Senate majority', 'Will Republicans control the US Senate after 2024 elections?', NULL, '2024 Senate Control',
 '2024-01-01', '2024-11-06', TRUE, 'yes', 125000000,
 0.55, 1.00, 1.00, 0.48, 'yes', 72, 0.58, 0.94, 62.1,
 '[{"date": "2024-01-01", "price": 0.55}, {"date": "2024-06-01", "price": 0.52}, {"date": "2024-10-01", "price": 0.65}, {"date": "2024-11-06", "price": 1.00}]');

-- ===========================================
-- HISTORICAL EDGE PICKS (System Performance)
-- ===========================================

INSERT INTO public.historical_edge_picks (
  pick_date, sport, pick_type, selection, odds, edge_source, edge_score, confidence,
  model_probability, implied_probability, edge_percentage, odds_at_pick, closing_line, clv_cents, beat_close,
  result, units_wagered, units_won_lost, public_side, sharp_side
) VALUES 
-- 2024 NFL Season Picks
('2024-09-05', 'NFL', 'spread', 'Kansas City Chiefs -3', -110, 'ai_model', 78, 82, 0.58, 0.524, 5.6, -110, -118, 8, TRUE, 'win', 1.0, 0.91, TRUE, TRUE),
('2024-09-08', 'NFL', 'spread', 'Detroit Lions +7.5', -110, 'trend', 72, 75, 0.52, 0.476, 4.4, -110, -108, -2, FALSE, 'win', 1.0, 0.91, FALSE, TRUE),
('2024-09-12', 'NFL', 'spread', 'Buffalo Bills -2.5', -108, 'sharp_money', 85, 88, 0.60, 0.519, 8.1, -108, -115, 7, TRUE, 'win', 1.5, 1.39, FALSE, TRUE),
('2024-09-15', 'NFL', 'total', 'CIN vs KC Under 46.5', -110, 'contrarian', 68, 72, 0.54, 0.524, 1.6, -110, -112, 2, TRUE, 'loss', 1.0, -1.0, FALSE, FALSE),
('2024-09-22', 'NFL', 'spread', 'Seattle Seahawks +4', -110, 'value', 74, 78, 0.55, 0.524, 2.6, -110, -108, -2, FALSE, 'win', 1.0, 0.91, FALSE, TRUE),

-- 2024 NBA Season Picks
('2024-10-22', 'NBA', 'spread', 'Boston Celtics -10', -108, 'ai_model', 82, 85, 0.62, 0.519, 10.1, -108, -112, 4, TRUE, 'win', 1.0, 0.93, TRUE, TRUE),
('2024-10-24', 'NBA', 'spread', 'Denver Nuggets -5', -110, 'trend', 76, 80, 0.58, 0.524, 5.6, -110, -108, -2, FALSE, 'win', 1.0, 0.91, FALSE, TRUE),
('2024-10-28', 'NBA', 'spread', 'Phoenix Suns -2.5', -108, 'sharp_money', 70, 74, 0.54, 0.519, 2.1, -108, -105, -3, FALSE, 'loss', 1.0, -1.0, TRUE, FALSE),
('2024-11-02', 'NBA', 'spread', 'Cleveland Cavaliers +2.5', -110, 'contrarian', 78, 82, 0.56, 0.476, 8.4, -110, -115, 5, TRUE, 'win', 1.5, 1.36, FALSE, TRUE),
('2024-11-10', 'NBA', 'total', 'LAL vs MIA Under 218', -110, 'situational', 72, 76, 0.55, 0.524, 2.6, -110, -112, 2, TRUE, 'win', 1.0, 0.91, FALSE, TRUE),

-- 2024 NHL Season Picks
('2024-10-09', 'NHL', 'puckline', 'Colorado Avalanche -1.5', +125, 'ai_model', 68, 72, 0.48, 0.444, 3.6, 125, 118, -7, FALSE, 'win', 1.0, 1.25, TRUE, TRUE),
('2024-10-12', 'NHL', 'moneyline', 'Toronto Maple Leafs ML', -165, 'trend', 74, 78, 0.65, 0.623, 2.7, -165, -175, 10, TRUE, 'win', 1.0, 0.61, TRUE, TRUE),
('2024-10-14', 'NHL', 'total', 'BOS vs FLA Over 6', -110, 'sharp_money', 72, 76, 0.56, 0.524, 3.6, -110, -108, -2, FALSE, 'win', 1.0, 0.91, TRUE, FALSE),

-- 2024 MLB Season Picks
('2024-04-01', 'MLB', 'runline', 'Los Angeles Dodgers -1.5', -125, 'ai_model', 76, 80, 0.58, 0.556, 2.4, -125, -135, 10, TRUE, 'win', 1.0, 0.80, TRUE, TRUE),
('2024-04-05', 'MLB', 'moneyline', 'New York Yankees ML', -145, 'trend', 72, 76, 0.62, 0.592, 2.8, -145, -155, 10, TRUE, 'win', 1.0, 0.69, TRUE, TRUE),
('2024-04-10', 'MLB', 'total', 'ATL vs PHI Over 9', -105, 'value', 68, 72, 0.54, 0.512, 2.8, -105, -110, 5, TRUE, 'win', 1.0, 0.95, TRUE, FALSE),

-- 2025 Season Picks (Current Year)
('2025-09-04', 'NFL', 'spread', 'Kansas City Chiefs -2.5', -110, 'ai_model', 80, 84, 0.58, 0.524, 5.6, -110, -115, 5, TRUE, 'win', 1.0, 0.91, TRUE, TRUE),
('2025-09-07', 'NFL', 'spread', 'Buffalo Bills -3.5', -108, 'sharp_money', 82, 86, 0.60, 0.519, 8.1, -108, -112, 4, TRUE, 'win', 1.5, 1.39, FALSE, TRUE),
('2025-10-21', 'NBA', 'spread', 'Boston Celtics -6', -110, 'trend', 78, 82, 0.58, 0.524, 5.6, -110, -108, -2, FALSE, 'win', 1.0, 0.91, TRUE, TRUE),
('2025-10-23', 'NBA', 'spread', 'Oklahoma City Thunder -2', -108, 'ai_model', 76, 80, 0.56, 0.519, 4.1, -108, -112, 4, TRUE, 'win', 1.0, 0.93, FALSE, TRUE);

-- ===========================================
-- SYSTEM PERFORMANCE SUMMARIES
-- ===========================================

INSERT INTO public.system_performance_summary (
  period_type, period_start, period_end, sport,
  edge_total_picks, edge_wins, edge_losses, edge_pushes, edge_win_rate, edge_units, edge_roi, edge_avg_odds, edge_clv_avg,
  trend_total_picks, trend_wins, trend_losses, trend_win_rate, trend_units, trend_roi,
  pm_total_markets, pm_correct, pm_roi,
  current_streak, best_streak, worst_streak
) VALUES 
-- All Time by Sport
('all_time', '2024-01-01', '2026-01-07', 'NFL', 245, 142, 98, 5, 59.2, 48.5, 8.2, -109, 3.8, 180, 102, 78, 56.7, 28.4, 7.5, 45, 32, 42.5, 4, 12, -6),
('all_time', '2024-01-01', '2026-01-07', 'NBA', 412, 238, 168, 6, 58.6, 82.4, 9.5, -108, 4.2, 320, 184, 136, 57.5, 52.8, 8.8, 28, 20, 38.2, 3, 15, -5),
('all_time', '2024-01-01', '2026-01-07', 'NHL', 198, 112, 82, 4, 57.7, 35.2, 8.8, -112, 3.5, 145, 82, 63, 56.6, 22.5, 7.8, 18, 12, 35.5, 2, 10, -4),
('all_time', '2024-01-01', '2026-01-07', 'MLB', 385, 218, 162, 5, 57.4, 62.8, 8.2, -115, 3.2, 285, 158, 127, 55.4, 38.2, 6.8, 22, 15, 32.8, 1, 8, -6),
('all_time', '2024-01-01', '2026-01-07', 'ALL', 1240, 710, 510, 20, 58.2, 228.9, 8.5, -110, 3.7, 930, 526, 404, 56.6, 141.9, 7.7, 113, 79, 38.5, 4, 15, -6),

-- 2024 Full Year
('yearly', '2024-01-01', '2024-12-31', 'ALL', 892, 512, 368, 12, 58.2, 165.2, 8.8, -109, 3.9, 678, 385, 293, 56.8, 102.5, 7.8, 85, 62, 42.8, 0, 14, -5),

-- 2025 YTD
('yearly', '2025-01-01', '2026-01-07', 'ALL', 348, 198, 142, 8, 58.2, 63.7, 9.2, -108, 4.1, 252, 141, 111, 56.0, 39.4, 8.2, 28, 17, 35.2, 4, 12, -4),

-- Monthly summaries (recent months)
('monthly', '2025-12-01', '2025-12-31', 'ALL', 85, 52, 32, 1, 61.9, 22.5, 12.8, -108, 4.8, 62, 38, 24, 61.3, 16.2, 13.2, 8, 6, 45.5, 6, 8, -2),
('monthly', '2025-11-01', '2025-11-30', 'ALL', 78, 44, 32, 2, 57.9, 14.8, 9.2, -110, 3.5, 58, 32, 26, 55.2, 8.5, 7.5, 6, 4, 28.5, 0, 6, -4),
('monthly', '2025-10-01', '2025-10-31', 'ALL', 92, 51, 39, 2, 56.7, 12.2, 6.5, -108, 2.8, 68, 36, 32, 52.9, 4.2, 3.2, 8, 5, 22.8, 0, 5, -3);

-- ===========================================
-- CREATE VIEWS FOR EASY QUERYING
-- ===========================================

-- View: Recent trend performance
CREATE OR REPLACE VIEW public.v_active_hot_trends AS
SELECT 
  trend_id,
  sport,
  category,
  bet_type,
  trend_name,
  trend_description,
  l30_record,
  l30_roi,
  l90_roi,
  all_time_roi,
  all_time_sample_size,
  confidence_score,
  hot_streak
FROM public.historical_trends
WHERE is_active = TRUE
ORDER BY confidence_score DESC, l30_roi DESC;

-- View: System performance by sport
CREATE OR REPLACE VIEW public.v_system_performance_by_sport AS
SELECT 
  sport,
  edge_total_picks as total_picks,
  edge_wins as wins,
  edge_losses as losses,
  edge_win_rate as win_rate,
  edge_units as total_units,
  edge_roi as roi,
  edge_clv_avg as avg_clv,
  pm_total_markets as markets_tracked,
  pm_correct as correct_predictions,
  pm_roi as prediction_roi
FROM public.system_performance_summary
WHERE period_type = 'all_time' AND sport != 'ALL';

-- View: Recent prediction market performance
CREATE OR REPLACE VIEW public.v_prediction_market_performance AS
SELECT 
  platform,
  market_category,
  COUNT(*) as total_markets,
  COUNT(*) FILTER (WHERE resolved = TRUE) as resolved_markets,
  COUNT(*) FILTER (WHERE resolution = 'yes' AND our_prediction = 'yes') as correct_yes,
  COUNT(*) FILTER (WHERE resolution = 'no' AND our_prediction = 'no') as correct_no,
  ROUND(AVG(our_pnl_pct) FILTER (WHERE our_pnl_pct IS NOT NULL), 2) as avg_roi,
  ROUND(SUM(total_volume) / 1000000, 2) as total_volume_millions
FROM public.historical_prediction_markets
GROUP BY platform, market_category;

-- Grant permissions
GRANT SELECT ON public.historical_games TO authenticated, anon;
GRANT SELECT ON public.historical_trends TO authenticated, anon;
GRANT SELECT ON public.historical_prediction_markets TO authenticated, anon;
GRANT SELECT ON public.historical_edge_picks TO authenticated, anon;
GRANT SELECT ON public.system_performance_summary TO authenticated, anon;
GRANT SELECT ON public.v_active_hot_trends TO authenticated, anon;
GRANT SELECT ON public.v_system_performance_by_sport TO authenticated, anon;
GRANT SELECT ON public.v_prediction_market_performance TO authenticated, anon;
