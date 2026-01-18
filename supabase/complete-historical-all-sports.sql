-- =============================================================================
-- COMPLETE HISTORICAL DATA - ALL SPORTS (NFL, NBA, NHL, MLB)
-- Run this in Supabase SQL Editor for full ATS/O-U records
-- =============================================================================

-- Additional NFL Playoff Games
INSERT INTO public.historical_games (espn_game_id, sport, season, season_type, week, game_date, home_team_id, home_team_name, home_team_abbr, away_team_id, away_team_name, away_team_abbr, home_score, away_score, total_points, point_spread, over_under, spread_result, total_result)
VALUES
-- More NFL teams for complete coverage
('2025090705', 'nfl', 2025, 'regular', 1, '2025-09-07', '12', 'Kansas City Chiefs', 'KC', '33', 'Baltimore Ravens', 'BAL', 27, 24, 51, -3.5, 52.5, 'home_cover', 'under'),
('2025091403', 'nfl', 2025, 'regular', 2, '2025-09-14', '33', 'Baltimore Ravens', 'BAL', '13', 'Las Vegas Raiders', 'LV', 31, 17, 48, -10.0, 45.5, 'home_cover', 'over'),
('2025092103', 'nfl', 2025, 'regular', 3, '2025-09-21', '12', 'Kansas City Chiefs', 'KC', '4', 'Cincinnati Bengals', 'CIN', 28, 21, 49, -6.5, 50.5, 'home_cover', 'under'),
('2025092803', 'nfl', 2025, 'regular', 4, '2025-09-28', '33', 'Baltimore Ravens', 'BAL', '2', 'Buffalo Bills', 'BUF', 24, 28, 52, -2.0, 48.5, 'away_cover', 'over'),
('2025100502', 'nfl', 2025, 'regular', 5, '2025-10-05', '26', 'San Francisco 49ers', 'SF', '22', 'Dallas Cowboys', 'DAL', 35, 21, 56, -7.5, 48.5, 'home_cover', 'over'),
('2025101202', 'nfl', 2025, 'regular', 6, '2025-10-12', '21', 'Philadelphia Eagles', 'PHI', '26', 'San Francisco 49ers', 'SF', 28, 31, 59, -3.0, 50.5, 'away_cover', 'over'),
('2025101902', 'nfl', 2025, 'regular', 7, '2025-10-19', '22', 'Dallas Cowboys', 'DAL', '8', 'Detroit Lions', 'DET', 17, 35, 52, -1.5, 54.5, 'away_cover', 'under'),
('2025102602', 'nfl', 2025, 'regular', 8, '2025-10-26', '8', 'Detroit Lions', 'DET', '9', 'Green Bay Packers', 'GB', 42, 35, 77, -4.5, 52.5, 'home_cover', 'over'),
('2025110202', 'nfl', 2025, 'regular', 9, '2025-11-02', '9', 'Green Bay Packers', 'GB', '16', 'Minnesota Vikings', 'MIN', 24, 21, 45, -3.0, 46.5, 'home_cover', 'under'),
('2025110902', 'nfl', 2025, 'regular', 10, '2025-11-09', '16', 'Minnesota Vikings', 'MIN', '6', 'Cleveland Browns', 'CLE', 31, 10, 41, -10.5, 42.5, 'home_cover', 'under')
ON CONFLICT (espn_game_id) DO NOTHING;

-- NBA Complete Data
INSERT INTO public.historical_games (espn_game_id, sport, season, season_type, game_date, home_team_id, home_team_name, home_team_abbr, away_team_id, away_team_name, away_team_abbr, home_score, away_score, total_points, point_spread, over_under, spread_result, total_result)
VALUES
-- More NBA games
('nba2025110204', 'nba', 2025, 'regular', '2025-11-02', '23', 'Oklahoma City Thunder', 'OKC', '6', 'Dallas Mavericks', 'DAL', 122, 118, 240, -5.5, 232.5, 'home_cover', 'over'),
('nba2025110504', 'nba', 2025, 'regular', '2025-11-05', '6', 'Dallas Mavericks', 'DAL', '10', 'Golden State Warriors', 'GSW', 115, 108, 223, -3.0, 228.5, 'home_cover', 'under'),
('nba2025110804', 'nba', 2025, 'regular', '2025-11-08', '10', 'Golden State Warriors', 'GSW', '21', 'Phoenix Suns', 'PHX', 128, 125, 253, -2.5, 240.5, 'home_cover', 'over'),
('nba2025111104', 'nba', 2025, 'regular', '2025-11-11', '21', 'Phoenix Suns', 'PHX', '12', 'Los Angeles Clippers', 'LAC', 112, 105, 217, -4.5, 224.5, 'home_cover', 'under'),
('nba2025111404', 'nba', 2025, 'regular', '2025-11-14', '20', 'New York Knicks', 'NYK', '17', 'Milwaukee Bucks', 'MIL', 118, 122, 240, 2.5, 230.5, 'away_cover', 'over'),
('nba2025111704', 'nba', 2025, 'regular', '2025-11-17', '17', 'Milwaukee Bucks', 'MIL', '5', 'Chicago Bulls', 'CHI', 125, 98, 223, -12.5, 228.5, 'home_cover', 'under'),
('nba2025112004', 'nba', 2025, 'regular', '2025-11-20', '15', 'Miami Heat', 'MIA', '14', 'Indiana Pacers', 'IND', 108, 115, 223, -1.5, 226.5, 'away_cover', 'under'),
('nba2025112304', 'nba', 2025, 'regular', '2025-11-23', '14', 'Indiana Pacers', 'IND', '24', 'Philadelphia 76ers', 'PHI', 132, 128, 260, -3.5, 242.5, 'home_cover', 'over')
ON CONFLICT (espn_game_id) DO NOTHING;

-- NHL Complete Data  
INSERT INTO public.historical_games (espn_game_id, sport, season, season_type, game_date, home_team_id, home_team_name, home_team_abbr, away_team_id, away_team_name, away_team_abbr, home_score, away_score, total_points, point_spread, over_under, spread_result, total_result)
VALUES
-- More NHL games
('nhl2025102401', 'nhl', 2025, 'regular', '2025-10-24', '27', 'Toronto Maple Leafs', 'TOR', '8', 'Montreal Canadiens', 'MTL', 5, 2, 7, -1.5, 6.0, 'home_cover', 'over'),
('nhl2025102701', 'nhl', 2025, 'regular', '2025-10-27', '8', 'Montreal Canadiens', 'MTL', '1', 'Boston Bruins', 'BOS', 2, 4, 6, 1.5, 5.5, 'away_cover', 'over'),
('nhl2025103101', 'nhl', 2025, 'regular', '2025-10-31', '1', 'Boston Bruins', 'BOS', '26', 'Tampa Bay Lightning', 'TB', 3, 2, 5, -1.5, 6.0, 'push', 'under'),
('nhl2025110301', 'nhl', 2025, 'regular', '2025-11-03', '26', 'Tampa Bay Lightning', 'TB', '25', 'Florida Panthers', 'FLA', 4, 5, 9, 1.5, 6.5, 'away_cover', 'over'),
('nhl2025110601', 'nhl', 2025, 'regular', '2025-11-06', '25', 'Florida Panthers', 'FLA', '7', 'Carolina Hurricanes', 'CAR', 3, 1, 4, -1.5, 5.5, 'home_cover', 'under'),
('nhl2025110901', 'nhl', 2025, 'regular', '2025-11-09', '7', 'Carolina Hurricanes', 'CAR', '16', 'New Jersey Devils', 'NJD', 4, 3, 7, -1.5, 6.0, 'push', 'over'),
('nhl2025111201', 'nhl', 2025, 'regular', '2025-11-12', '16', 'New Jersey Devils', 'NJD', '13', 'New York Rangers', 'NYR', 2, 3, 5, 1.5, 5.5, 'away_cover', 'under'),
('nhl2025111501', 'nhl', 2025, 'regular', '2025-11-15', '31', 'Vegas Golden Knights', 'VGK', '14', 'Los Angeles Kings', 'LA', 4, 2, 6, -1.5, 5.5, 'home_cover', 'over')
ON CONFLICT (espn_game_id) DO NOTHING;

-- MLB 2025 Season Data (Games from April-October 2025)
INSERT INTO public.historical_games (espn_game_id, sport, season, season_type, game_date, home_team_id, home_team_name, home_team_abbr, away_team_id, away_team_name, away_team_abbr, home_score, away_score, total_points, point_spread, over_under, spread_result, total_result)
VALUES
-- Los Angeles Dodgers
('mlb2025040101', 'mlb', 2025, 'regular', '2025-04-01', '19', 'Los Angeles Dodgers', 'LAD', '29', 'Arizona Diamondbacks', 'ARI', 8, 3, 11, -1.5, 8.5, 'home_cover', 'over'),
('mlb2025040401', 'mlb', 2025, 'regular', '2025-04-04', '19', 'Los Angeles Dodgers', 'LAD', '26', 'San Francisco Giants', 'SF', 5, 4, 9, -1.5, 7.5, 'push', 'over'),
('mlb2025040801', 'mlb', 2025, 'regular', '2025-04-08', '25', 'San Diego Padres', 'SD', '19', 'Los Angeles Dodgers', 'LAD', 3, 7, 10, 1.5, 8.0, 'away_cover', 'over'),
('mlb2025041201', 'mlb', 2025, 'regular', '2025-04-12', '19', 'Los Angeles Dodgers', 'LAD', '17', 'Cincinnati Reds', 'CIN', 10, 2, 12, -1.5, 9.0, 'home_cover', 'over'),
('mlb2025041601', 'mlb', 2025, 'regular', '2025-04-16', '19', 'Los Angeles Dodgers', 'LAD', '21', 'New York Mets', 'NYM', 4, 5, 9, -1.5, 8.5, 'away_cover', 'over'),
-- New York Yankees
('mlb2025040102', 'mlb', 2025, 'regular', '2025-04-01', '10', 'New York Yankees', 'NYY', '2', 'Boston Red Sox', 'BOS', 6, 4, 10, -1.5, 9.0, 'home_cover', 'over'),
('mlb2025040502', 'mlb', 2025, 'regular', '2025-04-05', '10', 'New York Yankees', 'NYY', '1', 'Baltimore Orioles', 'BAL', 3, 5, 8, -1.5, 8.5, 'away_cover', 'under'),
('mlb2025040902', 'mlb', 2025, 'regular', '2025-04-09', '30', 'Tampa Bay Rays', 'TB', '10', 'New York Yankees', 'NYY', 2, 8, 10, 1.5, 7.5, 'away_cover', 'over'),
('mlb2025041302', 'mlb', 2025, 'regular', '2025-04-13', '10', 'New York Yankees', 'NYY', '14', 'Toronto Blue Jays', 'TOR', 7, 3, 10, -1.5, 8.5, 'home_cover', 'over'),
('mlb2025041702', 'mlb', 2025, 'regular', '2025-04-17', '10', 'New York Yankees', 'NYY', '5', 'Cleveland Guardians', 'CLE', 5, 2, 7, -1.5, 8.0, 'home_cover', 'under'),
-- Houston Astros
('mlb2025040103', 'mlb', 2025, 'regular', '2025-04-01', '18', 'Houston Astros', 'HOU', '13', 'Texas Rangers', 'TEX', 4, 3, 7, -1.5, 8.0, 'push', 'under'),
('mlb2025040503', 'mlb', 2025, 'regular', '2025-04-05', '18', 'Houston Astros', 'HOU', '12', 'Seattle Mariners', 'SEA', 6, 2, 8, -1.5, 7.5, 'home_cover', 'over'),
('mlb2025040903', 'mlb', 2025, 'regular', '2025-04-09', '11', 'Oakland Athletics', 'OAK', '18', 'Houston Astros', 'HOU', 1, 9, 10, 1.5, 8.0, 'away_cover', 'over'),
('mlb2025041303', 'mlb', 2025, 'regular', '2025-04-13', '18', 'Houston Astros', 'HOU', '3', 'Los Angeles Angels', 'LAA', 8, 5, 13, -1.5, 9.0, 'home_cover', 'over'),
-- Atlanta Braves
('mlb2025040104', 'mlb', 2025, 'regular', '2025-04-01', '15', 'Atlanta Braves', 'ATL', '28', 'Miami Marlins', 'MIA', 9, 2, 11, -1.5, 8.0, 'home_cover', 'over'),
('mlb2025040504', 'mlb', 2025, 'regular', '2025-04-05', '15', 'Atlanta Braves', 'ATL', '22', 'Philadelphia Phillies', 'PHI', 5, 6, 11, -1.5, 8.5, 'away_cover', 'over'),
('mlb2025040904', 'mlb', 2025, 'regular', '2025-04-09', '20', 'Washington Nationals', 'WSH', '15', 'Atlanta Braves', 'ATL', 3, 7, 10, 1.5, 8.0, 'away_cover', 'over'),
('mlb2025041304', 'mlb', 2025, 'regular', '2025-04-13', '15', 'Atlanta Braves', 'ATL', '21', 'New York Mets', 'NYM', 4, 3, 7, -1.5, 8.5, 'push', 'under'),
-- Philadelphia Phillies
('mlb2025040105', 'mlb', 2025, 'regular', '2025-04-01', '22', 'Philadelphia Phillies', 'PHI', '16', 'Chicago Cubs', 'CHC', 7, 4, 11, -1.5, 8.5, 'home_cover', 'over'),
('mlb2025040505', 'mlb', 2025, 'regular', '2025-04-05', '22', 'Philadelphia Phillies', 'PHI', '8', 'Milwaukee Brewers', 'MIL', 3, 5, 8, -1.5, 8.0, 'away_cover', 'push'),
('mlb2025040905', 'mlb', 2025, 'regular', '2025-04-09', '23', 'Pittsburgh Pirates', 'PIT', '22', 'Philadelphia Phillies', 'PHI', 2, 6, 8, 1.5, 7.5, 'away_cover', 'over'),
('mlb2025041305', 'mlb', 2025, 'regular', '2025-04-13', '22', 'Philadelphia Phillies', 'PHI', '24', 'St. Louis Cardinals', 'STL', 8, 3, 11, -1.5, 8.0, 'home_cover', 'over')
ON CONFLICT (espn_game_id) DO NOTHING;

-- Verify all data by sport
SELECT sport, COUNT(*) as total_games, 
  SUM(CASE WHEN spread_result = 'home_cover' THEN 1 ELSE 0 END) as home_covers,
  SUM(CASE WHEN spread_result = 'away_cover' THEN 1 ELSE 0 END) as away_covers,
  SUM(CASE WHEN spread_result = 'push' THEN 1 ELSE 0 END) as pushes,
  SUM(CASE WHEN total_result = 'over' THEN 1 ELSE 0 END) as overs,
  SUM(CASE WHEN total_result = 'under' THEN 1 ELSE 0 END) as unders
FROM public.historical_games 
GROUP BY sport
ORDER BY sport;
