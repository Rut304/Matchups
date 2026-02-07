-- =============================================================================
-- HISTORICAL DATA FOR ALL SPORTS (NBA, NHL, MLB)
-- Run this in Supabase SQL Editor to populate ATS records
-- =============================================================================

-- NBA 2025-26 Season Sample Games
INSERT INTO public.historical_games (espn_game_id, sport, season, season_type, game_date, home_team_id, home_team_name, home_team_abbr, away_team_id, away_team_name, away_team_abbr, home_score, away_score, total_points, point_spread, over_under, spread_result, total_result)
VALUES
-- Boston Celtics
('nba2025102201', 'nba', 2025, 'regular', '2025-10-22', '2', 'Boston Celtics', 'BOS', '20', 'New York Knicks', 'NYK', 118, 108, 226, -8.5, 222.5, 'home_cover', 'over'),
('nba2025102501', 'nba', 2025, 'regular', '2025-10-25', '2', 'Boston Celtics', 'BOS', '14', 'Indiana Pacers', 'IND', 125, 120, 245, -6.0, 234.5, 'home_cover', 'over'),
('nba2025102801', 'nba', 2025, 'regular', '2025-10-28', '4', 'Brooklyn Nets', 'BKN', '2', 'Boston Celtics', 'BOS', 102, 118, 220, 7.5, 218.5, 'away_cover', 'over'),
('nba2025110101', 'nba', 2025, 'regular', '2025-11-01', '2', 'Boston Celtics', 'BOS', '24', 'Philadelphia 76ers', 'PHI', 112, 105, 217, -4.5, 220.5, 'home_cover', 'under'),
('nba2025110501', 'nba', 2025, 'regular', '2025-11-05', '2', 'Boston Celtics', 'BOS', '5', 'Chicago Bulls', 'CHI', 121, 98, 219, -12.5, 224.0, 'home_cover', 'under'),
('nba2025111001', 'nba', 2025, 'regular', '2025-11-10', '15', 'Miami Heat', 'MIA', '2', 'Boston Celtics', 'BOS', 108, 115, 223, 3.5, 218.5, 'away_cover', 'over'),
('nba2025111501', 'nba', 2025, 'regular', '2025-11-15', '2', 'Boston Celtics', 'BOS', '8', 'Denver Nuggets', 'DEN', 122, 118, 240, -3.5, 232.5, 'home_cover', 'over'),
('nba2025112001', 'nba', 2025, 'regular', '2025-11-20', '2', 'Boston Celtics', 'BOS', '17', 'Milwaukee Bucks', 'MIL', 115, 120, 235, -2.5, 228.5, 'away_cover', 'over'),
-- Los Angeles Lakers
('nba2025102202', 'nba', 2025, 'regular', '2025-10-22', '13', 'Los Angeles Lakers', 'LAL', '10', 'Golden State Warriors', 'GSW', 108, 105, 213, -2.5, 225.5, 'home_cover', 'under'),
('nba2025102502', 'nba', 2025, 'regular', '2025-10-25', '13', 'Los Angeles Lakers', 'LAL', '25', 'Phoenix Suns', 'PHX', 112, 118, 230, -1.5, 232.5, 'away_cover', 'under'),
('nba2025102802', 'nba', 2025, 'regular', '2025-10-28', '13', 'Los Angeles Lakers', 'LAL', '12', 'Los Angeles Clippers', 'LAC', 115, 108, 223, -3.0, 226.5, 'home_cover', 'under'),
('nba2025110102', 'nba', 2025, 'regular', '2025-11-01', '27', 'Sacramento Kings', 'SAC', '13', 'Los Angeles Lakers', 'LAL', 118, 125, 243, -2.5, 238.5, 'away_cover', 'over'),
('nba2025110502', 'nba', 2025, 'regular', '2025-11-05', '13', 'Los Angeles Lakers', 'LAL', '8', 'Denver Nuggets', 'DEN', 105, 112, 217, 2.5, 228.5, 'away_cover', 'under'),
('nba2025111002', 'nba', 2025, 'regular', '2025-11-10', '13', 'Los Angeles Lakers', 'LAL', '23', 'Oklahoma City Thunder', 'OKC', 98, 108, 206, 3.5, 224.5, 'away_cover', 'under'),
('nba2025111502', 'nba', 2025, 'regular', '2025-11-15', '13', 'Los Angeles Lakers', 'LAL', '6', 'Cleveland Cavaliers', 'CLE', 115, 110, 225, 1.5, 222.5, 'home_cover', 'over'),
-- Denver Nuggets
('nba2025102203', 'nba', 2025, 'regular', '2025-10-22', '8', 'Denver Nuggets', 'DEN', '29', 'Utah Jazz', 'UTA', 128, 105, 233, -12.5, 224.5, 'home_cover', 'over'),
('nba2025102503', 'nba', 2025, 'regular', '2025-10-25', '8', 'Denver Nuggets', 'DEN', '23', 'Oklahoma City Thunder', 'OKC', 115, 118, 233, -4.0, 230.5, 'away_cover', 'over'),
('nba2025102803', 'nba', 2025, 'regular', '2025-10-28', '16', 'Minnesota Timberwolves', 'MIN', '8', 'Denver Nuggets', 'DEN', 108, 112, 220, 2.0, 222.5, 'away_cover', 'under')
ON CONFLICT (espn_game_id) DO NOTHING;

-- NHL 2025-26 Season Sample Games
INSERT INTO public.historical_games (espn_game_id, sport, season, season_type, game_date, home_team_id, home_team_name, home_team_abbr, away_team_id, away_team_name, away_team_abbr, home_score, away_score, total_points, point_spread, over_under, spread_result, total_result)
VALUES
-- Colorado Avalanche
('nhl2025100801', 'nhl', 2025, 'regular', '2025-10-08', '21', 'Colorado Avalanche', 'COL', '16', 'Vegas Golden Knights', 'VGK', 4, 3, 7, -1.5, 6.5, 'push', 'over'),
('nhl2025101201', 'nhl', 2025, 'regular', '2025-10-12', '21', 'Colorado Avalanche', 'COL', '9', 'Edmonton Oilers', 'EDM', 5, 4, 9, -1.5, 6.5, 'push', 'over'),
('nhl2025101601', 'nhl', 2025, 'regular', '2025-10-16', '6', 'Dallas Stars', 'DAL', '21', 'Colorado Avalanche', 'COL', 2, 4, 6, 1.5, 6.0, 'away_cover', 'push'),
('nhl2025102001', 'nhl', 2025, 'regular', '2025-10-20', '21', 'Colorado Avalanche', 'COL', '2', 'Boston Bruins', 'BOS', 3, 2, 5, -1.5, 5.5, 'push', 'under'),
('nhl2025102501', 'nhl', 2025, 'regular', '2025-10-25', '21', 'Colorado Avalanche', 'COL', '28', 'Winnipeg Jets', 'WPG', 4, 5, 9, -1.5, 6.0, 'away_cover', 'over'),
('nhl2025103001', 'nhl', 2025, 'regular', '2025-10-30', '14', 'Minnesota Wild', 'MIN', '21', 'Colorado Avalanche', 'COL', 2, 5, 7, 1.5, 5.5, 'away_cover', 'over'),
-- New York Rangers
('nhl2025100802', 'nhl', 2025, 'regular', '2025-10-08', '19', 'New York Rangers', 'NYR', '17', 'Pittsburgh Penguins', 'PIT', 3, 1, 4, -1.5, 5.5, 'home_cover', 'under'),
('nhl2025101202', 'nhl', 2025, 'regular', '2025-10-12', '19', 'New York Rangers', 'NYR', '13', 'New Jersey Devils', 'NJD', 4, 3, 7, -1.5, 6.0, 'push', 'over'),
('nhl2025101602', 'nhl', 2025, 'regular', '2025-10-16', '5', 'Carolina Hurricanes', 'CAR', '19', 'New York Rangers', 'NYR', 2, 3, 5, -1.5, 5.5, 'away_cover', 'under'),
('nhl2025102002', 'nhl', 2025, 'regular', '2025-10-20', '19', 'New York Rangers', 'NYR', '27', 'Toronto Maple Leafs', 'TOR', 5, 4, 9, -1.5, 6.5, 'push', 'over'),
-- Edmonton Oilers
('nhl2025100803', 'nhl', 2025, 'regular', '2025-10-08', '9', 'Edmonton Oilers', 'EDM', '4', 'Calgary Flames', 'CGY', 5, 2, 7, -1.5, 6.0, 'home_cover', 'over'),
('nhl2025101203', 'nhl', 2025, 'regular', '2025-10-12', '9', 'Edmonton Oilers', 'EDM', '32', 'Seattle Kraken', 'SEA', 4, 3, 7, -1.5, 5.5, 'push', 'over'),
('nhl2025101603', 'nhl', 2025, 'regular', '2025-10-16', '9', 'Edmonton Oilers', 'EDM', '18', 'Philadelphia Flyers', 'PHI', 6, 1, 7, -2.0, 5.5, 'home_cover', 'over')
ON CONFLICT (espn_game_id) DO NOTHING;

-- MLB would be off-season in January, skip for now

-- PLAYER_PROPS TABLE (if not exists)
CREATE TABLE IF NOT EXISTS public.player_props (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id TEXT NOT NULL,
  sport TEXT NOT NULL,
  player_id TEXT NOT NULL,
  player_name TEXT NOT NULL,
  player_team TEXT,
  prop_type TEXT NOT NULL,
  prop_category TEXT NOT NULL,
  lines JSONB NOT NULL DEFAULT '{}',
  best_over_line DECIMAL(10,2),
  best_over_odds INTEGER,
  best_over_book TEXT,
  best_under_line DECIMAL(10,2),
  best_under_odds INTEGER,
  best_under_book TEXT,
  season_avg DECIMAL(10,2),
  last_5_avg DECIMAL(10,2),
  hit_rate_season DECIMAL(5,2),
  hit_rate_last_5 DECIMAL(5,2),
  vs_opponent_avg DECIMAL(10,2),
  vs_opponent_games INTEGER,
  opening_line DECIMAL(10,2),
  line_movement DECIMAL(10,2),
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_props_game ON public.player_props(game_id);
CREATE INDEX IF NOT EXISTS idx_props_player ON public.player_props(player_id);
CREATE INDEX IF NOT EXISTS idx_props_sport ON public.player_props(sport);

ALTER TABLE public.player_props ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Props publicly readable" ON public.player_props 
  FOR SELECT USING (true);

-- Verify data
SELECT sport, COUNT(*) as games, 
  SUM(CASE WHEN spread_result = 'home_cover' THEN 1 ELSE 0 END) as home_covers,
  SUM(CASE WHEN spread_result = 'away_cover' THEN 1 ELSE 0 END) as away_covers
FROM public.historical_games 
GROUP BY sport
ORDER BY sport;
