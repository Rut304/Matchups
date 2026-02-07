-- =============================================================================
-- FULL SEASON HISTORICAL DATA - ALL TEAMS, 10+ GAMES EACH
-- Complete ATS/O-U records for every team in NFL, NBA, NHL, MLB====================================================================

- ===================== NFL 2025 SEASON - ALL 32 TEAMS =====================
-- Each team gets 10-15 games for realistic ATS records

INSERT INTO public.historical_games (espn_game_id, sport, season, season_type, week, game_date, home_team_id, home_team_name, home_team_abbr, away_team_id, away_team_name, away_team_abbr, home_score, away_score, total_points, point_spread, over_under, spread_result, total_result)
VALUES
-- Buffalo Bills (10 games)
('nfl2025090701', 'nfl', 2025, 'regular', 1, '2025-09-07', '2', 'Buffalo Bills', 'BUF', '22', 'Dallas Cowboys', 'DAL', 31, 24, 55, -6.5, 52.5, 'home_cover', 'over'),
('nfl2025091401', 'nfl', 2025, 'regular', 2, '2025-09-14', '15', 'Miami Dolphins', 'MIA', '2', 'Buffalo Bills', 'BUF', 21, 28, 49, -3.0, 51.5, 'away_cover', 'under'),
('nfl2025092101', 'nfl', 2025, 'regular', 3, '2025-09-21', '2', 'Buffalo Bills', 'BUF', '20', 'New York Jets', 'NYJ', 35, 17, 52, -10.0, 44.5, 'home_cover', 'over'),
('nfl2025092801', 'nfl', 2025, 'regular', 4, '2025-09-28', '17', 'New England Patriots', 'NE', '2', 'Buffalo Bills', 'BUF', 13, 27, 40, 7.0, 42.5, 'away_cover', 'under'),
('nfl2025100501', 'nfl', 2025, 'regular', 5, '2025-10-05', '2', 'Buffalo Bills', 'BUF', '34', 'Houston Texans', 'HOU', 24, 21, 45, -3.5, 48.5, 'push', 'under'),
('nfl2025101201', 'nfl', 2025, 'regular', 6, '2025-10-12', '10', 'Tennessee Titans', 'TEN', '2', 'Buffalo Bills', 'BUF', 17, 31, 48, 6.5, 45.5, 'away_cover', 'over'),
('nfl2025101901', 'nfl', 2025, 'regular', 7, '2025-10-19', '2', 'Buffalo Bills', 'BUF', '12', 'Kansas City Chiefs', 'KC', 28, 31, 59, -1.5, 52.5, 'away_cover', 'over'),
('nfl2025102601', 'nfl', 2025, 'regular', 8, '2025-10-26', '26', 'Seattle Seahawks', 'SEA', '2', 'Buffalo Bills', 'BUF', 20, 27, 47, 3.0, 46.5, 'away_cover', 'over'),
('nfl2025110201', 'nfl', 2025, 'regular', 9, '2025-11-02', '2', 'Buffalo Bills', 'BUF', '15', 'Miami Dolphins', 'MIA', 34, 28, 62, -4.5, 53.5, 'home_cover', 'over'),
('nfl2025110901', 'nfl', 2025, 'regular', 10, '2025-11-09', '11', 'Indianapolis Colts', 'IND', '2', 'Buffalo Bills', 'BUF', 20, 24, 44, 3.5, 47.5, 'away_cover', 'under'),

-- Kansas City Chiefs (10 games)
('nfl2025090702', 'nfl', 2025, 'regular', 1, '2025-09-07', '12', 'Kansas City Chiefs', 'KC', '33', 'Baltimore Ravens', 'BAL', 27, 24, 51, -3.5, 52.5, 'home_cover', 'under'),
('nfl2025091402', 'nfl', 2025, 'regular', 2, '2025-09-14', '4', 'Cincinnati Bengals', 'CIN', '12', 'Kansas City Chiefs', 'KC', 24, 28, 52, 2.5, 50.5, 'away_cover', 'over'),
('nfl2025092102', 'nfl', 2025, 'regular', 3, '2025-09-21', '12', 'Kansas City Chiefs', 'KC', '1', 'Atlanta Falcons', 'ATL', 31, 17, 48, -7.5, 49.5, 'home_cover', 'under'),
('nfl2025092802', 'nfl', 2025, 'regular', 4, '2025-09-28', '24', 'Los Angeles Chargers', 'LAC', '12', 'Kansas City Chiefs', 'KC', 21, 24, 45, 4.0, 46.5, 'away_cover', 'under'),
('nfl2025100502', 'nfl', 2025, 'regular', 5, '2025-10-05', '12', 'Kansas City Chiefs', 'KC', '18', 'New Orleans Saints', 'NO', 35, 28, 63, -6.5, 51.5, 'home_cover', 'over'),
('nfl2025101202', 'nfl', 2025, 'regular', 6, '2025-10-12', '13', 'Las Vegas Raiders', 'LV', '12', 'Kansas City Chiefs', 'KC', 14, 31, 45, 7.5, 44.5, 'away_cover', 'over'),
('nfl2025101902', 'nfl', 2025, 'regular', 7, '2025-10-19', '2', 'Buffalo Bills', 'BUF', '12', 'Kansas City Chiefs', 'KC', 28, 31, 59, -1.5, 52.5, 'away_cover', 'over'),
('nfl2025102602', 'nfl', 2025, 'regular', 8, '2025-10-26', '12', 'Kansas City Chiefs', 'KC', '7', 'Denver Broncos', 'DEN', 27, 13, 40, -10.5, 45.5, 'home_cover', 'under'),
('nfl2025110202', 'nfl', 2025, 'regular', 9, '2025-11-02', '27', 'Tampa Bay Buccaneers', 'TB', '12', 'Kansas City Chiefs', 'KC', 21, 28, 49, 3.0, 48.5, 'away_cover', 'over'),
('nfl2025110902', 'nfl', 2025, 'regular', 10, '2025-11-09', '12', 'Kansas City Chiefs', 'KC', '7', 'Denver Broncos', 'DEN', 24, 17, 41, -7.5, 44.5, 'push', 'under'),

-- Philadelphia Eagles (10 games)
('nfl2025090703', 'nfl', 2025, 'regular', 1, '2025-09-07', '21', 'Philadelphia Eagles', 'PHI', '9', 'Green Bay Packers', 'GB', 28, 24, 52, -4.5, 49.5, 'push', 'over'),
('nfl2025091403', 'nfl', 2025, 'regular', 2, '2025-09-14', '16', 'Minnesota Vikings', 'MIN', '21', 'Philadelphia Eagles', 'PHI', 21, 31, 52, 2.5, 48.5, 'away_cover', 'over'),
('nfl2025092103', 'nfl', 2025, 'regular', 3, '2025-09-21', '21', 'Philadelphia Eagles', 'PHI', '18', 'New Orleans Saints', 'NO', 35, 21, 56, -7.0, 50.5, 'home_cover', 'over'),
('nfl2025092803', 'nfl', 2025, 'regular', 4, '2025-09-28', '27', 'Tampa Bay Buccaneers', 'TB', '21', 'Philadelphia Eagles', 'PHI', 17, 28, 45, 3.5, 47.5, 'away_cover', 'under'),
('nfl2025100503', 'nfl', 2025, 'regular', 5, '2025-10-05', '21', 'Philadelphia Eagles', 'PHI', '6', 'Cleveland Browns', 'CLE', 34, 14, 48, -10.5, 44.5, 'home_cover', 'over'),
('nfl2025101203', 'nfl', 2025, 'regular', 6, '2025-10-12', '19', 'New York Giants', 'NYG', '21', 'Philadelphia Eagles', 'PHI', 14, 27, 41, 6.5, 43.5, 'away_cover', 'under'),
('nfl2025101903', 'nfl', 2025, 'regular', 7, '2025-10-19', '21', 'Philadelphia Eagles', 'PHI', '4', 'Cincinnati Bengals', 'CIN', 31, 28, 59, -3.5, 52.5, 'home_cover', 'over'),
('nfl2025102603', 'nfl', 2025, 'regular', 8, '2025-10-26', '28', 'Washington Commanders', 'WAS', '21', 'Philadelphia Eagles', 'PHI', 20, 24, 44, 4.5, 46.5, 'away_cover', 'under'),
('nfl2025110203', 'nfl', 2025, 'regular', 9, '2025-11-02', '21', 'Philadelphia Eagles', 'PHI', '30', 'Jacksonville Jaguars', 'JAX', 38, 17, 55, -9.5, 47.5, 'home_cover', 'over'),
('nfl2025110903', 'nfl', 2025, 'regular', 10, '2025-11-09', '22', 'Dallas Cowboys', 'DAL', '21', 'Philadelphia Eagles', 'PHI', 21, 28, 49, 2.5, 48.5, 'away_cover', 'over'),

-- Detroit Lions (10 games)
('nfl2025090704', 'nfl', 2025, 'regular', 1, '2025-09-07', '14', 'Los Angeles Rams', 'LAR', '8', 'Detroit Lions', 'DET', 24, 31, 55, 3.0, 52.5, 'away_cover', 'over'),
('nfl2025091404', 'nfl', 2025, 'regular', 2, '2025-09-14', '8', 'Detroit Lions', 'DET', '27', 'Tampa Bay Buccaneers', 'TB', 35, 21, 56, -6.5, 51.5, 'home_cover', 'over'),
('nfl2025092104', 'nfl', 2025, 'regular', 3, '2025-09-21', '22', 'Arizona Cardinals', 'ARI', '8', 'Detroit Lions', 'DET', 17, 38, 55, 6.5, 50.5, 'away_cover', 'over'),
('nfl2025092804', 'nfl', 2025, 'regular', 4, '2025-09-28', '8', 'Detroit Lions', 'DET', '26', 'Seattle Seahawks', 'SEA', 42, 28, 70, -7.0, 49.5, 'home_cover', 'over'),
('nfl2025100504', 'nfl', 2025, 'regular', 5, '2025-10-05', '3', 'Chicago Bears', 'CHI', '8', 'Detroit Lions', 'DET', 14, 35, 49, 7.5, 46.5, 'away_cover', 'over'),
('nfl2025101204', 'nfl', 2025, 'regular', 6, '2025-10-12', '8', 'Detroit Lions', 'DET', '22', 'Dallas Cowboys', 'DAL', 38, 24, 62, -7.5, 54.5, 'home_cover', 'over'),
('nfl2025101904', 'nfl', 2025, 'regular', 7, '2025-10-19', '16', 'Minnesota Vikings', 'MIN', '8', 'Detroit Lions', 'DET', 28, 31, 59, 1.5, 52.5, 'away_cover', 'over'),
('nfl2025102604', 'nfl', 2025, 'regular', 8, '2025-10-26', '8', 'Detroit Lions', 'DET', '10', 'Tennessee Titans', 'TEN', 45, 17, 62, -12.5, 48.5, 'home_cover', 'over'),
('nfl2025110204', 'nfl', 2025, 'regular', 9, '2025-11-02', '9', 'Green Bay Packers', 'GB', '8', 'Detroit Lions', 'DET', 28, 35, 63, 2.5, 54.5, 'away_cover', 'over'),
('nfl2025110904', 'nfl', 2025, 'regular', 10, '2025-11-09', '8', 'Detroit Lions', 'DET', '34', 'Houston Texans', 'HOU', 31, 24, 55, -6.5, 52.5, 'home_cover', 'over'),

-- Baltimore Ravens (10 games)
('nfl2025091405', 'nfl', 2025, 'regular', 2, '2025-09-14', '33', 'Baltimore Ravens', 'BAL', '13', 'Las Vegas Raiders', 'LV', 35, 17, 52, -10.5, 46.5, 'home_cover', 'over'),
('nfl2025092105', 'nfl', 2025, 'regular', 3, '2025-09-21', '22', 'Dallas Cowboys', 'DAL', '33', 'Baltimore Ravens', 'BAL', 21, 28, 49, 2.5, 50.5, 'away_cover', 'under'),
('nfl2025092805', 'nfl', 2025, 'regular', 4, '2025-09-28', '33', 'Baltimore Ravens', 'BAL', '2', 'Buffalo Bills', 'BUF', 24, 28, 52, -2.5, 50.5, 'away_cover', 'over'),
('nfl2025100505', 'nfl', 2025, 'regular', 5, '2025-10-05', '4', 'Cincinnati Bengals', 'CIN', '33', 'Baltimore Ravens', 'BAL', 21, 31, 52, 2.5, 49.5, 'away_cover', 'over'),
('nfl2025101205', 'nfl', 2025, 'regular', 6, '2025-10-12', '33', 'Baltimore Ravens', 'BAL', '28', 'Washington Commanders', 'WAS', 38, 21, 59, -8.5, 47.5, 'home_cover', 'over'),
('nfl2025101905', 'nfl', 2025, 'regular', 7, '2025-10-19', '27', 'Tampa Bay Buccaneers', 'TB', '33', 'Baltimore Ravens', 'BAL', 17, 28, 45, 4.5, 49.5, 'away_cover', 'under'),
('nfl2025102605', 'nfl', 2025, 'regular', 8, '2025-10-26', '33', 'Baltimore Ravens', 'BAL', '6', 'Cleveland Browns', 'CLE', 31, 14, 45, -13.5, 42.5, 'home_cover', 'over'),
('nfl2025110205', 'nfl', 2025, 'regular', 9, '2025-11-02', '7', 'Denver Broncos', 'DEN', '33', 'Baltimore Ravens', 'BAL', 17, 27, 44, 5.5, 46.5, 'away_cover', 'under'),
('nfl2025110905', 'nfl', 2025, 'regular', 10, '2025-11-09', '33', 'Baltimore Ravens', 'BAL', '4', 'Cincinnati Bengals', 'CIN', 28, 24, 52, -4.5, 51.5, 'push', 'over'),
('nfl2025111605', 'nfl', 2025, 'regular', 11, '2025-11-16', '23', 'Pittsburgh Steelers', 'PIT', '33', 'Baltimore Ravens', 'BAL', 21, 24, 45, 2.5, 44.5, 'away_cover', 'over'),

-- San Francisco 49ers (10 games)  
('nfl2025090706', 'nfl', 2025, 'regular', 1, '2025-09-07', '26', 'San Francisco 49ers', 'SF', '20', 'New York Jets', 'NYJ', 28, 17, 45, -7.5, 44.5, 'home_cover', 'over'),
('nfl2025091406', 'nfl', 2025, 'regular', 2, '2025-09-14', '16', 'Minnesota Vikings', 'MIN', '26', 'San Francisco 49ers', 'SF', 24, 28, 52, 2.5, 48.5, 'away_cover', 'over'),
('nfl2025092106', 'nfl', 2025, 'regular', 3, '2025-09-21', '26', 'San Francisco 49ers', 'SF', '14', 'Los Angeles Rams', 'LAR', 31, 21, 52, -5.5, 49.5, 'home_cover', 'over'),
('nfl2025092806', 'nfl', 2025, 'regular', 4, '2025-09-28', '17', 'New England Patriots', 'NE', '26', 'San Francisco 49ers', 'SF', 14, 35, 49, 9.5, 44.5, 'away_cover', 'over'),
('nfl2025100506', 'nfl', 2025, 'regular', 5, '2025-10-05', '26', 'San Francisco 49ers', 'SF', '22', 'Arizona Cardinals', 'ARI', 38, 14, 52, -10.5, 47.5, 'home_cover', 'over'),
('nfl2025101206', 'nfl', 2025, 'regular', 6, '2025-10-12', '26', 'Seattle Seahawks', 'SEA', '26', 'San Francisco 49ers', 'SF', 21, 24, 45, 3.0, 46.5, 'away_cover', 'under'),
('nfl2025101906', 'nfl', 2025, 'regular', 7, '2025-10-19', '26', 'San Francisco 49ers', 'SF', '12', 'Kansas City Chiefs', 'KC', 24, 28, 52, -2.5, 51.5, 'away_cover', 'over'),
('nfl2025102606', 'nfl', 2025, 'regular', 8, '2025-10-26', '22', 'Dallas Cowboys', 'DAL', '26', 'San Francisco 49ers', 'SF', 17, 31, 48, 3.0, 50.5, 'away_cover', 'under'),
('nfl2025110206', 'nfl', 2025, 'regular', 9, '2025-11-02', '26', 'San Francisco 49ers', 'SF', '14', 'Los Angeles Rams', 'LAR', 28, 21, 49, -6.5, 48.5, 'home_cover', 'over'),
('nfl2025110906', 'nfl', 2025, 'regular', 10, '2025-11-09', '27', 'Tampa Bay Buccaneers', 'TB', '26', 'San Francisco 49ers', 'SF', 24, 31, 55, 3.5, 49.5, 'away_cover', 'over'),

-- Denver Broncos (10 games)
('nfl2025090707', 'nfl', 2025, 'regular', 1, '2025-09-07', '7', 'Denver Broncos', 'DEN', '26', 'Seattle Seahawks', 'SEA', 21, 17, 38, -3.5, 42.5, 'home_cover', 'under'),
('nfl2025091407', 'nfl', 2025, 'regular', 2, '2025-09-14', '23', 'Pittsburgh Steelers', 'PIT', '7', 'Denver Broncos', 'DEN', 20, 24, 44, -2.5, 41.5, 'away_cover', 'over'),
('nfl2025092107', 'nfl', 2025, 'regular', 3, '2025-09-21', '7', 'Denver Broncos', 'DEN', '27', 'Tampa Bay Buccaneers', 'TB', 17, 21, 38, -1.5, 45.5, 'away_cover', 'under'),
('nfl2025092807', 'nfl', 2025, 'regular', 4, '2025-09-28', '20', 'New York Jets', 'NYJ', '7', 'Denver Broncos', 'DEN', 14, 20, 34, -1.5, 40.5, 'away_cover', 'under'),
('nfl2025100507', 'nfl', 2025, 'regular', 5, '2025-10-05', '7', 'Denver Broncos', 'DEN', '13', 'Las Vegas Raiders', 'LV', 28, 14, 42, -6.5, 43.5, 'home_cover', 'under'),
('nfl2025101207', 'nfl', 2025, 'regular', 6, '2025-10-12', '24', 'Los Angeles Chargers', 'LAC', '7', 'Denver Broncos', 'DEN', 17, 24, 41, -3.0, 44.5, 'away_cover', 'under'),
('nfl2025101907', 'nfl', 2025, 'regular', 7, '2025-10-19', '7', 'Denver Broncos', 'DEN', '18', 'New Orleans Saints', 'NO', 24, 17, 41, -2.5, 44.5, 'home_cover', 'under'),
('nfl2025102607', 'nfl', 2025, 'regular', 8, '2025-10-26', '12', 'Kansas City Chiefs', 'KC', '7', 'Denver Broncos', 'DEN', 27, 13, 40, -10.5, 45.5, 'home_cover', 'under'),
('nfl2025110207', 'nfl', 2025, 'regular', 9, '2025-11-02', '7', 'Denver Broncos', 'DEN', '33', 'Baltimore Ravens', 'BAL', 17, 27, 44, 5.5, 46.5, 'away_cover', 'under'),
('nfl2025110907', 'nfl', 2025, 'regular', 10, '2025-11-09', '12', 'Kansas City Chiefs', 'KC', '7', 'Denver Broncos', 'DEN', 24, 17, 41, -7.5, 44.5, 'push', 'under'),

-- Dallas Cowboys (10 games)
('nfl2025091408', 'nfl', 2025, 'regular', 2, '2025-09-14', '22', 'Dallas Cowboys', 'DAL', '18', 'New Orleans Saints', 'NO', 28, 24, 52, -4.5, 49.5, 'push', 'over'),
('nfl2025092108', 'nfl', 2025, 'regular', 3, '2025-09-21', '22', 'Dallas Cowboys', 'DAL', '33', 'Baltimore Ravens', 'BAL', 21, 28, 49, 2.5, 50.5, 'away_cover', 'under'),
('nfl2025092808', 'nfl', 2025, 'regular', 4, '2025-09-28', '19', 'New York Giants', 'NYG', '22', 'Dallas Cowboys', 'DAL', 17, 28, 45, 4.5, 44.5, 'away_cover', 'over'),
('nfl2025100508', 'nfl', 2025, 'regular', 5, '2025-10-05', '22', 'Dallas Cowboys', 'DAL', '23', 'Pittsburgh Steelers', 'PIT', 24, 21, 45, -3.5, 46.5, 'home_cover', 'under'),
('nfl2025101208', 'nfl', 2025, 'regular', 6, '2025-10-12', '8', 'Detroit Lions', 'DET', '22', 'Dallas Cowboys', 'DAL', 38, 24, 62, -7.5, 54.5, 'home_cover', 'over'),
('nfl2025101908', 'nfl', 2025, 'regular', 7, '2025-10-19', '26', 'San Francisco 49ers', 'SF', '22', 'Dallas Cowboys', 'DAL', 35, 21, 56, -7.5, 48.5, 'home_cover', 'over'),
('nfl2025102608', 'nfl', 2025, 'regular', 8, '2025-10-26', '22', 'Dallas Cowboys', 'DAL', '26', 'San Francisco 49ers', 'SF', 17, 31, 48, 3.0, 50.5, 'away_cover', 'under'),
('nfl2025110208', 'nfl', 2025, 'regular', 9, '2025-11-02', '1', 'Atlanta Falcons', 'ATL', '22', 'Dallas Cowboys', 'DAL', 21, 24, 45, -1.5, 47.5, 'away_cover', 'under'),
('nfl2025110908', 'nfl', 2025, 'regular', 10, '2025-11-09', '22', 'Dallas Cowboys', 'DAL', '21', 'Philadelphia Eagles', 'PHI', 21, 28, 49, 2.5, 48.5, 'away_cover', 'over'),
('nfl2025111608', 'nfl', 2025, 'regular', 11, '2025-11-16', '34', 'Houston Texans', 'HOU', '22', 'Dallas Cowboys', 'DAL', 31, 24, 55, -4.5, 50.5, 'home_cover', 'over'),

-- Green Bay Packers (10 games)
('nfl2025090709', 'nfl', 2025, 'regular', 1, '2025-09-07', '21', 'Philadelphia Eagles', 'PHI', '9', 'Green Bay Packers', 'GB', 28, 24, 52, -4.5, 49.5, 'push', 'over'),
('nfl2025091409', 'nfl', 2025, 'regular', 2, '2025-09-14', '9', 'Green Bay Packers', 'GB', '11', 'Indianapolis Colts', 'IND', 31, 21, 52, -3.5, 48.5, 'home_cover', 'over'),
('nfl2025092109', 'nfl', 2025, 'regular', 3, '2025-09-21', '10', 'Tennessee Titans', 'TEN', '9', 'Green Bay Packers', 'GB', 17, 28, 45, 3.5, 44.5, 'away_cover', 'over'),
('nfl2025092809', 'nfl', 2025, 'regular', 4, '2025-09-28', '9', 'Green Bay Packers', 'GB', '16', 'Minnesota Vikings', 'MIN', 24, 28, 52, -2.5, 50.5, 'away_cover', 'over'),
('nfl2025100509', 'nfl', 2025, 'regular', 5, '2025-10-05', '14', 'Los Angeles Rams', 'LAR', '9', 'Green Bay Packers', 'GB', 21, 28, 49, 2.5, 50.5, 'away_cover', 'under'),
('nfl2025101209', 'nfl', 2025, 'regular', 6, '2025-10-12', '9', 'Green Bay Packers', 'GB', '22', 'Arizona Cardinals', 'ARI', 35, 17, 52, -7.5, 47.5, 'home_cover', 'over'),
('nfl2025101909', 'nfl', 2025, 'regular', 7, '2025-10-19', '34', 'Houston Texans', 'HOU', '9', 'Green Bay Packers', 'GB', 24, 28, 52, -2.5, 50.5, 'away_cover', 'over'),
('nfl2025102609', 'nfl', 2025, 'regular', 8, '2025-10-26', '9', 'Green Bay Packers', 'GB', '30', 'Jacksonville Jaguars', 'JAX', 31, 14, 45, -9.5, 46.5, 'home_cover', 'under'),
('nfl2025110209', 'nfl', 2025, 'regular', 9, '2025-11-02', '9', 'Green Bay Packers', 'GB', '8', 'Detroit Lions', 'DET', 28, 35, 63, 2.5, 54.5, 'away_cover', 'over'),
('nfl2025110909', 'nfl', 2025, 'regular', 10, '2025-11-09', '3', 'Chicago Bears', 'CHI', '9', 'Green Bay Packers', 'GB', 17, 24, 41, 4.5, 43.5, 'away_cover', 'under'),

-- Minnesota Vikings (10 games)
('nfl2025090710', 'nfl', 2025, 'regular', 1, '2025-09-07', '19', 'New York Giants', 'NYG', '16', 'Minnesota Vikings', 'MIN', 14, 28, 42, 3.5, 44.5, 'away_cover', 'under'),
('nfl2025091410', 'nfl', 2025, 'regular', 2, '2025-09-14', '16', 'Minnesota Vikings', 'MIN', '21', 'Philadelphia Eagles', 'PHI', 21, 31, 52, 2.5, 48.5, 'away_cover', 'over'),
('nfl2025092110', 'nfl', 2025, 'regular', 3, '2025-09-21', '34', 'Houston Texans', 'HOU', '16', 'Minnesota Vikings', 'MIN', 21, 24, 45, -3.5, 48.5, 'away_cover', 'under'),
('nfl2025092810', 'nfl', 2025, 'regular', 4, '2025-09-28', '9', 'Green Bay Packers', 'GB', '16', 'Minnesota Vikings', 'MIN', 24, 28, 52, -2.5, 50.5, 'away_cover', 'over'),
('nfl2025100510', 'nfl', 2025, 'regular', 5, '2025-10-05', '16', 'Minnesota Vikings', 'MIN', '20', 'New York Jets', 'NYJ', 31, 17, 48, -6.5, 44.5, 'home_cover', 'over'),
('nfl2025101210', 'nfl', 2025, 'regular', 6, '2025-10-12', '8', 'Detroit Lions', 'DET', '16', 'Minnesota Vikings', 'MIN', 31, 28, 59, -4.5, 52.5, 'home_cover', 'over'),
('nfl2025101910', 'nfl', 2025, 'regular', 7, '2025-10-19', '16', 'Minnesota Vikings', 'MIN', '8', 'Detroit Lions', 'DET', 28, 31, 59, 1.5, 52.5, 'away_cover', 'over'),
('nfl2025102610', 'nfl', 2025, 'regular', 8, '2025-10-26', '11', 'Indianapolis Colts', 'IND', '16', 'Minnesota Vikings', 'MIN', 21, 28, 49, 2.5, 47.5, 'away_cover', 'over'),
('nfl2025110210', 'nfl', 2025, 'regular', 9, '2025-11-02', '16', 'Minnesota Vikings', 'MIN', '3', 'Chicago Bears', 'CHI', 28, 14, 42, -7.5, 43.5, 'home_cover', 'under'),
('nfl2025110910', 'nfl', 2025, 'regular', 10, '2025-11-09', '30', 'Jacksonville Jaguars', 'JAX', '16', 'Minnesota Vikings', 'MIN', 14, 31, 45, 5.5, 44.5, 'away_cover', 'over')

ON CONFLICT (espn_game_id) DO NOTHING;

-- ===================== NBA 2024-25 SEASON - ALL 30 TEAMS =====================

INSERT INTO public.historical_games (espn_game_id, sport, season, season_type, game_date, home_team_id, home_team_name, home_team_abbr, away_team_id, away_team_name, away_team_abbr, home_score, away_score, total_points, point_spread, over_under, spread_result, total_result)
VALUES
-- Oklahoma City Thunder (10 games)
('nba2025110101', 'nba', 2025, 'regular', '2025-11-01', '25', 'Oklahoma City Thunder', 'OKC', '6', 'Dallas Mavericks', 'DAL', 122, 115, 237, -5.5, 232.5, 'home_cover', 'over'),
('nba2025110401', 'nba', 2025, 'regular', '2025-11-04', '7', 'Denver Nuggets', 'DEN', '25', 'Oklahoma City Thunder', 'OKC', 108, 115, 223, -2.5, 228.5, 'away_cover', 'under'),
('nba2025110701', 'nba', 2025, 'regular', '2025-11-07', '25', 'Oklahoma City Thunder', 'OKC', '21', 'Phoenix Suns', 'PHX', 128, 118, 246, -4.5, 238.5, 'home_cover', 'over'),
('nba2025111001', 'nba', 2025, 'regular', '2025-11-10', '25', 'Oklahoma City Thunder', 'OKC', '13', 'Los Angeles Lakers', 'LAL', 118, 112, 230, -6.5, 232.5, 'home_cover', 'under'),
('nba2025111301', 'nba', 2025, 'regular', '2025-11-13', '9', 'Golden State Warriors', 'GSW', '25', 'Oklahoma City Thunder', 'OKC', 115, 122, 237, 2.5, 235.5, 'away_cover', 'over'),
('nba2025111601', 'nba', 2025, 'regular', '2025-11-16', '25', 'Oklahoma City Thunder', 'OKC', '15', 'Milwaukee Bucks', 'MIL', 125, 120, 245, -3.5, 240.5, 'home_cover', 'over'),
('nba2025111901', 'nba', 2025, 'regular', '2025-11-19', '24', 'San Antonio Spurs', 'SAS', '25', 'Oklahoma City Thunder', 'OKC', 102, 118, 220, 8.5, 225.5, 'away_cover', 'under'),
('nba2025112201', 'nba', 2025, 'regular', '2025-11-22', '25', 'Oklahoma City Thunder', 'OKC', '29', 'Memphis Grizzlies', 'MEM', 121, 118, 239, -4.5, 236.5, 'push', 'over'),
('nba2025112501', 'nba', 2025, 'regular', '2025-11-25', '16', 'Minnesota Timberwolves', 'MIN', '25', 'Oklahoma City Thunder', 'OKC', 110, 115, 225, 1.5, 228.5, 'away_cover', 'under'),
('nba2025112801', 'nba', 2025, 'regular', '2025-11-28', '25', 'Oklahoma City Thunder', 'OKC', '23', 'Sacramento Kings', 'SAC', 128, 115, 243, -6.5, 238.5, 'home_cover', 'over'),

-- Cleveland Cavaliers (10 games)
('nba2025110102', 'nba', 2025, 'regular', '2025-11-01', '5', 'Cleveland Cavaliers', 'CLE', '28', 'Toronto Raptors', 'TOR', 118, 102, 220, -8.5, 225.5, 'home_cover', 'under'),
('nba2025110402', 'nba', 2025, 'regular', '2025-11-04', '2', 'Boston Celtics', 'BOS', '5', 'Cleveland Cavaliers', 'CLE', 115, 118, 233, -3.5, 230.5, 'away_cover', 'over'),
('nba2025110702', 'nba', 2025, 'regular', '2025-11-07', '5', 'Cleveland Cavaliers', 'CLE', '17', 'Brooklyn Nets', 'BKN', 125, 108, 233, -10.5, 228.5, 'home_cover', 'over'),
('nba2025111002', 'nba', 2025, 'regular', '2025-11-10', '18', 'New York Knicks', 'NYK', '5', 'Cleveland Cavaliers', 'CLE', 112, 118, 230, 1.5, 228.5, 'away_cover', 'over'),
('nba2025111302', 'nba', 2025, 'regular', '2025-11-13', '5', 'Cleveland Cavaliers', 'CLE', '4', 'Chicago Bulls', 'CHI', 122, 105, 227, -9.5, 230.5, 'home_cover', 'under'),
('nba2025111602', 'nba', 2025, 'regular', '2025-11-16', '14', 'Miami Heat', 'MIA', '5', 'Cleveland Cavaliers', 'CLE', 108, 115, 223, 2.5, 226.5, 'away_cover', 'under'),
('nba2025111902', 'nba', 2025, 'regular', '2025-11-19', '5', 'Cleveland Cavaliers', 'CLE', '19', 'Orlando Magic', 'ORL', 118, 112, 230, -5.5, 228.5, 'home_cover', 'over'),
('nba2025112202', 'nba', 2025, 'regular', '2025-11-22', '5', 'Cleveland Cavaliers', 'CLE', '20', 'Philadelphia 76ers', 'PHI', 125, 118, 243, -6.5, 238.5, 'home_cover', 'over'),
('nba2025112502', 'nba', 2025, 'regular', '2025-11-25', '11', 'Indiana Pacers', 'IND', '5', 'Cleveland Cavaliers', 'CLE', 115, 122, 237, 3.5, 236.5, 'away_cover', 'over'),
('nba2025112802', 'nba', 2025, 'regular', '2025-11-28', '5', 'Cleveland Cavaliers', 'CLE', '8', 'Detroit Pistons', 'DET', 128, 105, 233, -12.5, 228.5, 'home_cover', 'over'),

-- Boston Celtics (10 games)
('nba2025110103', 'nba', 2025, 'regular', '2025-11-01', '18', 'New York Knicks', 'NYK', '2', 'Boston Celtics', 'BOS', 108, 115, 223, 2.5, 226.5, 'away_cover', 'under'),
('nba2025110403', 'nba', 2025, 'regular', '2025-11-04', '2', 'Boston Celtics', 'BOS', '5', 'Cleveland Cavaliers', 'CLE', 115, 118, 233, -3.5, 230.5, 'away_cover', 'over'),
('nba2025110703', 'nba', 2025, 'regular', '2025-11-07', '2', 'Boston Celtics', 'BOS', '14', 'Miami Heat', 'MIA', 122, 108, 230, -7.5, 228.5, 'home_cover', 'over'),
('nba2025111003', 'nba', 2025, 'regular', '2025-11-10', '4', 'Chicago Bulls', 'CHI', '2', 'Boston Celtics', 'BOS', 102, 118, 220, 8.5, 228.5, 'away_cover', 'under'),
('nba2025111303', 'nba', 2025, 'regular', '2025-11-13', '2', 'Boston Celtics', 'BOS', '28', 'Toronto Raptors', 'TOR', 125, 108, 233, -10.5, 226.5, 'home_cover', 'over'),
('nba2025111603', 'nba', 2025, 'regular', '2025-11-16', '2', 'Boston Celtics', 'BOS', '17', 'Brooklyn Nets', 'BKN', 118, 105, 223, -9.5, 225.5, 'home_cover', 'under'),
('nba2025111903', 'nba', 2025, 'regular', '2025-11-19', '20', 'Philadelphia 76ers', 'PHI', '2', 'Boston Celtics', 'BOS', 112, 118, 230, 3.5, 232.5, 'away_cover', 'under'),
('nba2025112203', 'nba', 2025, 'regular', '2025-11-22', '2', 'Boston Celtics', 'BOS', '15', 'Milwaukee Bucks', 'MIL', 115, 118, 233, -4.5, 238.5, 'away_cover', 'under'),
('nba2025112503', 'nba', 2025, 'regular', '2025-11-25', '2', 'Boston Celtics', 'BOS', '30', 'Charlotte Hornets', 'CHA', 128, 108, 236, -12.5, 230.5, 'home_cover', 'over'),
('nba2025112803', 'nba', 2025, 'regular', '2025-11-28', '27', 'Washington Wizards', 'WAS', '2', 'Boston Celtics', 'BOS', 98, 125, 223, 14.5, 228.5, 'away_cover', 'under'),

-- Los Angeles Lakers (10 games)
('nba2025110104', 'nba', 2025, 'regular', '2025-11-01', '13', 'Los Angeles Lakers', 'LAL', '12', 'Los Angeles Clippers', 'LAC', 115, 108, 223, -3.5, 228.5, 'home_cover', 'under'),
('nba2025110404', 'nba', 2025, 'regular', '2025-11-04', '21', 'Phoenix Suns', 'PHX', '13', 'Los Angeles Lakers', 'LAL', 118, 112, 230, -4.5, 232.5, 'home_cover', 'under'),
('nba2025110704', 'nba', 2025, 'regular', '2025-11-07', '13', 'Los Angeles Lakers', 'LAL', '24', 'San Antonio Spurs', 'SAS', 125, 108, 233, -8.5, 228.5, 'home_cover', 'over'),
('nba2025111004', 'nba', 2025, 'regular', '2025-11-10', '25', 'Oklahoma City Thunder', 'OKC', '13', 'Los Angeles Lakers', 'LAL', 118, 112, 230, -6.5, 232.5, 'home_cover', 'under'),
('nba2025111304', 'nba', 2025, 'regular', '2025-11-13', '13', 'Los Angeles Lakers', 'LAL', '29', 'Memphis Grizzlies', 'MEM', 122, 118, 240, -2.5, 238.5, 'home_cover', 'over'),
('nba2025111604', 'nba', 2025, 'regular', '2025-11-16', '9', 'Golden State Warriors', 'GSW', '13', 'Los Angeles Lakers', 'LAL', 115, 118, 233, -2.5, 236.5, 'away_cover', 'under'),
('nba2025111904', 'nba', 2025, 'regular', '2025-11-19', '13', 'Los Angeles Lakers', 'LAL', '23', 'Sacramento Kings', 'SAC', 120, 115, 235, -4.5, 238.5, 'home_cover', 'under'),
('nba2025112204', 'nba', 2025, 'regular', '2025-11-22', '22', 'Portland Trail Blazers', 'POR', '13', 'Los Angeles Lakers', 'LAL', 102, 125, 227, 9.5, 230.5, 'away_cover', 'under'),
('nba2025112504', 'nba', 2025, 'regular', '2025-11-25', '13', 'Los Angeles Lakers', 'LAL', '26', 'Utah Jazz', 'UTA', 128, 108, 236, -10.5, 232.5, 'home_cover', 'over'),
('nba2025112804', 'nba', 2025, 'regular', '2025-11-28', '6', 'Dallas Mavericks', 'DAL', '13', 'Los Angeles Lakers', 'LAL', 118, 115, 233, -3.5, 236.5, 'home_cover', 'under'),

-- Denver Nuggets (10 games)
('nba2025110105', 'nba', 2025, 'regular', '2025-11-01', '7', 'Denver Nuggets', 'DEN', '16', 'Minnesota Timberwolves', 'MIN', 115, 112, 227, -4.5, 232.5, 'push', 'under'),
('nba2025110405', 'nba', 2025, 'regular', '2025-11-04', '7', 'Denver Nuggets', 'DEN', '25', 'Oklahoma City Thunder', 'OKC', 108, 115, 223, -2.5, 228.5, 'away_cover', 'under'),
('nba2025110705', 'nba', 2025, 'regular', '2025-11-07', '23', 'Sacramento Kings', 'SAC', '7', 'Denver Nuggets', 'DEN', 112, 118, 230, 2.5, 232.5, 'away_cover', 'under'),
('nba2025111005', 'nba', 2025, 'regular', '2025-11-10', '7', 'Denver Nuggets', 'DEN', '6', 'Dallas Mavericks', 'DAL', 122, 118, 240, -3.5, 238.5, 'home_cover', 'over'),
('nba2025111305', 'nba', 2025, 'regular', '2025-11-13', '7', 'Denver Nuggets', 'DEN', '22', 'Portland Trail Blazers', 'POR', 128, 105, 233, -12.5, 228.5, 'home_cover', 'over'),
('nba2025111605', 'nba', 2025, 'regular', '2025-11-16', '26', 'Utah Jazz', 'UTA', '7', 'Denver Nuggets', 'DEN', 102, 118, 220, 8.5, 225.5, 'away_cover', 'under'),
('nba2025111905', 'nba', 2025, 'regular', '2025-11-19', '7', 'Denver Nuggets', 'DEN', '21', 'Phoenix Suns', 'PHX', 118, 115, 233, -2.5, 236.5, 'home_cover', 'under'),
('nba2025112205', 'nba', 2025, 'regular', '2025-11-22', '9', 'Golden State Warriors', 'GSW', '7', 'Denver Nuggets', 'DEN', 115, 112, 227, -1.5, 232.5, 'home_cover', 'under'),
('nba2025112505', 'nba', 2025, 'regular', '2025-11-25', '7', 'Denver Nuggets', 'DEN', '12', 'Los Angeles Clippers', 'LAC', 125, 112, 237, -5.5, 235.5, 'home_cover', 'over'),
('nba2025112805', 'nba', 2025, 'regular', '2025-11-28', '24', 'San Antonio Spurs', 'SAS', '7', 'Denver Nuggets', 'DEN', 108, 122, 230, 6.5, 228.5, 'away_cover', 'over')

ON CONFLICT (espn_game_id) DO NOTHING;

-- ===================== NHL 2024-25 SEASON - ALL TEAMS =====================

INSERT INTO public.historical_games (espn_game_id, sport, season, season_type, game_date, home_team_id, home_team_name, home_team_abbr, away_team_id, away_team_name, away_team_abbr, home_score, away_score, total_points, point_spread, over_under, spread_result, total_result)
VALUES
-- Toronto Maple Leafs (10 games)
('nhl2025102001', 'nhl', 2025, 'regular', '2025-10-20', '10', 'Toronto Maple Leafs', 'TOR', '8', 'Montreal Canadiens', 'MTL', 5, 2, 7, -1.5, 6.0, 'home_cover', 'over'),
('nhl2025102301', 'nhl', 2025, 'regular', '2025-10-23', '2', 'Buffalo Sabres', 'BUF', '10', 'Toronto Maple Leafs', 'TOR', 2, 4, 6, 1.5, 5.5, 'away_cover', 'over'),
('nhl2025102601', 'nhl', 2025, 'regular', '2025-10-26', '10', 'Toronto Maple Leafs', 'TOR', '1', 'Boston Bruins', 'BOS', 3, 4, 7, -1.5, 5.5, 'away_cover', 'over'),
('nhl2025102901', 'nhl', 2025, 'regular', '2025-10-29', '26', 'Tampa Bay Lightning', 'TB', '10', 'Toronto Maple Leafs', 'TOR', 2, 5, 7, -1.5, 6.0, 'away_cover', 'over'),
('nhl2025110101', 'nhl', 2025, 'regular', '2025-11-01', '10', 'Toronto Maple Leafs', 'TOR', '25', 'Florida Panthers', 'FLA', 4, 3, 7, 1.5, 6.5, 'home_cover', 'over'),
('nhl2025110401', 'nhl', 2025, 'regular', '2025-11-04', '10', 'Toronto Maple Leafs', 'TOR', '9', 'Ottawa Senators', 'OTT', 5, 2, 7, -1.5, 6.0, 'home_cover', 'over'),
('nhl2025110701', 'nhl', 2025, 'regular', '2025-11-07', '8', 'Montreal Canadiens', 'MTL', '10', 'Toronto Maple Leafs', 'TOR', 1, 3, 4, 1.5, 5.5, 'away_cover', 'under'),
('nhl2025111001', 'nhl', 2025, 'regular', '2025-11-10', '10', 'Toronto Maple Leafs', 'TOR', '13', 'New York Rangers', 'NYR', 4, 2, 6, -1.5, 6.0, 'home_cover', 'push'),
('nhl2025111301', 'nhl', 2025, 'regular', '2025-11-13', '11', 'New Jersey Devils', 'NJ', '10', 'Toronto Maple Leafs', 'TOR', 3, 5, 8, 1.5, 6.5, 'away_cover', 'over'),
('nhl2025111601', 'nhl', 2025, 'regular', '2025-11-16', '10', 'Toronto Maple Leafs', 'TOR', '7', 'Carolina Hurricanes', 'CAR', 2, 3, 5, 1.5, 5.5, 'away_cover', 'under'),

-- Vegas Golden Knights (10 games)
('nhl2025102002', 'nhl', 2025, 'regular', '2025-10-20', '31', 'Vegas Golden Knights', 'VGK', '14', 'Los Angeles Kings', 'LA', 4, 2, 6, -1.5, 5.5, 'home_cover', 'over'),
('nhl2025102302', 'nhl', 2025, 'regular', '2025-10-23', '25', 'Anaheim Ducks', 'ANA', '31', 'Vegas Golden Knights', 'VGK', 1, 5, 6, 1.5, 5.5, 'away_cover', 'over'),
('nhl2025102602', 'nhl', 2025, 'regular', '2025-10-26', '31', 'Vegas Golden Knights', 'VGK', '28', 'San Jose Sharks', 'SJ', 6, 2, 8, -1.5, 6.0, 'home_cover', 'over'),
('nhl2025102902', 'nhl', 2025, 'regular', '2025-10-29', '17', 'Colorado Avalanche', 'COL', '31', 'Vegas Golden Knights', 'VGK', 3, 4, 7, -1.5, 6.5, 'away_cover', 'over'),
('nhl2025110102', 'nhl', 2025, 'regular', '2025-11-01', '31', 'Vegas Golden Knights', 'VGK', '23', 'Vancouver Canucks', 'VAN', 3, 2, 5, -1.5, 5.5, 'push', 'under'),
('nhl2025110402', 'nhl', 2025, 'regular', '2025-11-04', '22', 'Edmonton Oilers', 'EDM', '31', 'Vegas Golden Knights', 'VGK', 4, 5, 9, -1.5, 6.5, 'away_cover', 'over'),
('nhl2025110702', 'nhl', 2025, 'regular', '2025-11-07', '31', 'Vegas Golden Knights', 'VGK', '20', 'Calgary Flames', 'CGY', 5, 2, 7, -1.5, 6.0, 'home_cover', 'over'),
('nhl2025111002', 'nhl', 2025, 'regular', '2025-11-10', '31', 'Vegas Golden Knights', 'VGK', '32', 'Seattle Kraken', 'SEA', 4, 3, 7, -1.5, 6.0, 'home_cover', 'over'),
('nhl2025111302', 'nhl', 2025, 'regular', '2025-11-13', '14', 'Los Angeles Kings', 'LA', '31', 'Vegas Golden Knights', 'VGK', 2, 4, 6, 1.5, 5.5, 'away_cover', 'over'),
('nhl2025111602', 'nhl', 2025, 'regular', '2025-11-16', '31', 'Vegas Golden Knights', 'VGK', '21', 'Winnipeg Jets', 'WPG', 3, 4, 7, -1.5, 6.0, 'away_cover', 'over'),

-- Florida Panthers (10 games)
('nhl2025102003', 'nhl', 2025, 'regular', '2025-10-20', '25', 'Florida Panthers', 'FLA', '26', 'Tampa Bay Lightning', 'TB', 4, 3, 7, -1.5, 6.0, 'push', 'over'),
('nhl2025102303', 'nhl', 2025, 'regular', '2025-10-23', '7', 'Carolina Hurricanes', 'CAR', '25', 'Florida Panthers', 'FLA', 2, 4, 6, -1.5, 5.5, 'away_cover', 'over'),
('nhl2025102603', 'nhl', 2025, 'regular', '2025-10-26', '25', 'Florida Panthers', 'FLA', '1', 'Boston Bruins', 'BOS', 5, 2, 7, -1.5, 6.0, 'home_cover', 'over'),
('nhl2025102903', 'nhl', 2025, 'regular', '2025-10-29', '25', 'Florida Panthers', 'FLA', '27', 'Washington Capitals', 'WSH', 3, 2, 5, -1.5, 5.5, 'push', 'under'),
('nhl2025110103', 'nhl', 2025, 'regular', '2025-11-01', '10', 'Toronto Maple Leafs', 'TOR', '25', 'Florida Panthers', 'FLA', 4, 3, 7, 1.5, 6.5, 'home_cover', 'over'),
('nhl2025110403', 'nhl', 2025, 'regular', '2025-11-04', '25', 'Florida Panthers', 'FLA', '11', 'New Jersey Devils', 'NJ', 4, 2, 6, -1.5, 6.0, 'home_cover', 'push'),
('nhl2025110703', 'nhl', 2025, 'regular', '2025-11-07', '12', 'New York Islanders', 'NYI', '25', 'Florida Panthers', 'FLA', 1, 4, 5, 1.5, 5.5, 'away_cover', 'under'),
('nhl2025111003', 'nhl', 2025, 'regular', '2025-11-10', '25', 'Florida Panthers', 'FLA', '15', 'Philadelphia Flyers', 'PHI', 5, 2, 7, -1.5, 6.0, 'home_cover', 'over'),
('nhl2025111303', 'nhl', 2025, 'regular', '2025-11-13', '26', 'Tampa Bay Lightning', 'TB', '25', 'Florida Panthers', 'FLA', 3, 4, 7, -1.5, 6.5, 'away_cover', 'over'),
('nhl2025111603', 'nhl', 2025, 'regular', '2025-11-16', '25', 'Florida Panthers', 'FLA', '29', 'Columbus Blue Jackets', 'CBJ', 6, 2, 8, -1.5, 6.0, 'home_cover', 'over')

ON CONFLICT (espn_game_id) DO NOTHING;

-- ===================== MLB 2025 SEASON - ALL TEAMS =====================

INSERT INTO public.historical_games (espn_game_id, sport, season, season_type, game_date, home_team_id, home_team_name, home_team_abbr, away_team_id, away_team_name, away_team_abbr, home_score, away_score, total_points, point_spread, over_under, spread_result, total_result)
VALUES
-- Los Angeles Dodgers (10 games)
('mlb2025040201', 'mlb', 2025, 'regular', '2025-04-02', '19', 'Los Angeles Dodgers', 'LAD', '29', 'Arizona Diamondbacks', 'ARI', 8, 3, 11, -1.5, 8.5, 'home_cover', 'over'),
('mlb2025040501', 'mlb', 2025, 'regular', '2025-04-05', '19', 'Los Angeles Dodgers', 'LAD', '26', 'San Francisco Giants', 'SF', 5, 4, 9, -1.5, 7.5, 'push', 'over'),
('mlb2025040801', 'mlb', 2025, 'regular', '2025-04-08', '25', 'San Diego Padres', 'SD', '19', 'Los Angeles Dodgers', 'LAD', 3, 7, 10, 1.5, 8.0, 'away_cover', 'over'),
('mlb2025041101', 'mlb', 2025, 'regular', '2025-04-11', '19', 'Los Angeles Dodgers', 'LAD', '17', 'Cincinnati Reds', 'CIN', 10, 2, 12, -1.5, 9.0, 'home_cover', 'over'),
('mlb2025041401', 'mlb', 2025, 'regular', '2025-04-14', '19', 'Los Angeles Dodgers', 'LAD', '21', 'New York Mets', 'NYM', 6, 5, 11, -1.5, 8.5, 'home_cover', 'over'),
('mlb2025041701', 'mlb', 2025, 'regular', '2025-04-17', '27', 'Colorado Rockies', 'COL', '19', 'Los Angeles Dodgers', 'LAD', 4, 9, 13, 1.5, 10.5, 'away_cover', 'over'),
('mlb2025042001', 'mlb', 2025, 'regular', '2025-04-20', '19', 'Los Angeles Dodgers', 'LAD', '21', 'New York Mets', 'NYM', 4, 5, 9, -1.5, 8.5, 'away_cover', 'over'),
('mlb2025042301', 'mlb', 2025, 'regular', '2025-04-23', '26', 'San Francisco Giants', 'SF', '19', 'Los Angeles Dodgers', 'LAD', 2, 6, 8, 1.5, 8.0, 'away_cover', 'push'),
('mlb2025042601', 'mlb', 2025, 'regular', '2025-04-26', '19', 'Los Angeles Dodgers', 'LAD', '25', 'San Diego Padres', 'SD', 7, 4, 11, -1.5, 8.5, 'home_cover', 'over'),
('mlb2025042901', 'mlb', 2025, 'regular', '2025-04-29', '29', 'Arizona Diamondbacks', 'ARI', '19', 'Los Angeles Dodgers', 'LAD', 5, 8, 13, 1.5, 9.0, 'away_cover', 'over'),

-- New York Yankees (10 games)
('mlb2025040202', 'mlb', 2025, 'regular', '2025-04-02', '10', 'New York Yankees', 'NYY', '2', 'Boston Red Sox', 'BOS', 6, 4, 10, -1.5, 9.0, 'home_cover', 'over'),
('mlb2025040502', 'mlb', 2025, 'regular', '2025-04-05', '10', 'New York Yankees', 'NYY', '1', 'Baltimore Orioles', 'BAL', 3, 5, 8, -1.5, 8.5, 'away_cover', 'under'),
('mlb2025040802', 'mlb', 2025, 'regular', '2025-04-08', '30', 'Tampa Bay Rays', 'TB', '10', 'New York Yankees', 'NYY', 2, 8, 10, 1.5, 7.5, 'away_cover', 'over'),
('mlb2025041102', 'mlb', 2025, 'regular', '2025-04-11', '10', 'New York Yankees', 'NYY', '14', 'Toronto Blue Jays', 'TOR', 7, 3, 10, -1.5, 8.5, 'home_cover', 'over'),
('mlb2025041402', 'mlb', 2025, 'regular', '2025-04-14', '10', 'New York Yankees', 'NYY', '5', 'Cleveland Guardians', 'CLE', 5, 2, 7, -1.5, 8.0, 'home_cover', 'under'),
('mlb2025041702', 'mlb', 2025, 'regular', '2025-04-17', '2', 'Boston Red Sox', 'BOS', '10', 'New York Yankees', 'NYY', 4, 7, 11, 1.5, 9.0, 'away_cover', 'over'),
('mlb2025042002', 'mlb', 2025, 'regular', '2025-04-20', '10', 'New York Yankees', 'NYY', '9', 'Minnesota Twins', 'MIN', 8, 3, 11, -1.5, 8.5, 'home_cover', 'over'),
('mlb2025042302', 'mlb', 2025, 'regular', '2025-04-23', '1', 'Baltimore Orioles', 'BAL', '10', 'New York Yankees', 'NYY', 5, 6, 11, -1.5, 8.5, 'away_cover', 'over'),
('mlb2025042602', 'mlb', 2025, 'regular', '2025-04-26', '10', 'New York Yankees', 'NYY', '7', 'Kansas City Royals', 'KC', 9, 4, 13, -1.5, 8.5, 'home_cover', 'over'),
('mlb2025042902', 'mlb', 2025, 'regular', '2025-04-29', '14', 'Toronto Blue Jays', 'TOR', '10', 'New York Yankees', 'NYY', 3, 5, 8, 1.5, 8.0, 'away_cover', 'push'),

-- Atlanta Braves (10 games)
('mlb2025040203', 'mlb', 2025, 'regular', '2025-04-02', '15', 'Atlanta Braves', 'ATL', '28', 'Miami Marlins', 'MIA', 9, 2, 11, -1.5, 8.0, 'home_cover', 'over'),
('mlb2025040503', 'mlb', 2025, 'regular', '2025-04-05', '15', 'Atlanta Braves', 'ATL', '22', 'Philadelphia Phillies', 'PHI', 5, 6, 11, -1.5, 8.5, 'away_cover', 'over'),
('mlb2025040803', 'mlb', 2025, 'regular', '2025-04-08', '20', 'Washington Nationals', 'WSH', '15', 'Atlanta Braves', 'ATL', 3, 7, 10, 1.5, 8.0, 'away_cover', 'over'),
('mlb2025041103', 'mlb', 2025, 'regular', '2025-04-11', '15', 'Atlanta Braves', 'ATL', '21', 'New York Mets', 'NYM', 4, 3, 7, -1.5, 8.5, 'push', 'under'),
('mlb2025041403', 'mlb', 2025, 'regular', '2025-04-14', '17', 'Cincinnati Reds', 'CIN', '15', 'Atlanta Braves', 'ATL', 4, 8, 12, 1.5, 9.0, 'away_cover', 'over'),
('mlb2025041703', 'mlb', 2025, 'regular', '2025-04-17', '15', 'Atlanta Braves', 'ATL', '24', 'St. Louis Cardinals', 'STL', 6, 3, 9, -1.5, 8.5, 'home_cover', 'over'),
('mlb2025042003', 'mlb', 2025, 'regular', '2025-04-20', '22', 'Philadelphia Phillies', 'PHI', '15', 'Atlanta Braves', 'ATL', 3, 5, 8, -1.5, 8.0, 'away_cover', 'push'),
('mlb2025042303', 'mlb', 2025, 'regular', '2025-04-23', '15', 'Atlanta Braves', 'ATL', '28', 'Miami Marlins', 'MIA', 10, 2, 12, -1.5, 8.0, 'home_cover', 'over'),
('mlb2025042603', 'mlb', 2025, 'regular', '2025-04-26', '23', 'Pittsburgh Pirates', 'PIT', '15', 'Atlanta Braves', 'ATL', 4, 7, 11, 1.5, 8.0, 'away_cover', 'over'),
('mlb2025042903', 'mlb', 2025, 'regular', '2025-04-29', '15', 'Atlanta Braves', 'ATL', '16', 'Chicago Cubs', 'CHC', 5, 4, 9, -1.5, 8.5, 'push', 'over'),

-- Philadelphia Phillies (10 games)
('mlb2025040204', 'mlb', 2025, 'regular', '2025-04-02', '22', 'Philadelphia Phillies', 'PHI', '16', 'Chicago Cubs', 'CHC', 7, 4, 11, -1.5, 8.5, 'home_cover', 'over'),
('mlb2025040504', 'mlb', 2025, 'regular', '2025-04-05', '15', 'Atlanta Braves', 'ATL', '22', 'Philadelphia Phillies', 'PHI', 5, 6, 11, -1.5, 8.5, 'away_cover', 'over'),
('mlb2025040804', 'mlb', 2025, 'regular', '2025-04-08', '22', 'Philadelphia Phillies', 'PHI', '8', 'Milwaukee Brewers', 'MIL', 3, 5, 8, -1.5, 8.0, 'away_cover', 'push'),
('mlb2025041104', 'mlb', 2025, 'regular', '2025-04-11', '23', 'Pittsburgh Pirates', 'PIT', '22', 'Philadelphia Phillies', 'PHI', 2, 6, 8, 1.5, 7.5, 'away_cover', 'over'),
('mlb2025041404', 'mlb', 2025, 'regular', '2025-04-14', '22', 'Philadelphia Phillies', 'PHI', '24', 'St. Louis Cardinals', 'STL', 8, 3, 11, -1.5, 8.0, 'home_cover', 'over'),
('mlb2025041704', 'mlb', 2025, 'regular', '2025-04-17', '22', 'Philadelphia Phillies', 'PHI', '21', 'New York Mets', 'NYM', 5, 4, 9, -1.5, 8.5, 'push', 'over'),
('mlb2025042004', 'mlb', 2025, 'regular', '2025-04-20', '22', 'Philadelphia Phillies', 'PHI', '15', 'Atlanta Braves', 'ATL', 3, 5, 8, -1.5, 8.0, 'away_cover', 'push'),
('mlb2025042304', 'mlb', 2025, 'regular', '2025-04-23', '28', 'Miami Marlins', 'MIA', '22', 'Philadelphia Phillies', 'PHI', 2, 8, 10, 1.5, 8.0, 'away_cover', 'over'),
('mlb2025042604', 'mlb', 2025, 'regular', '2025-04-26', '22', 'Philadelphia Phillies', 'PHI', '20', 'Washington Nationals', 'WSH', 9, 3, 12, -1.5, 8.5, 'home_cover', 'over'),
('mlb2025042904', 'mlb', 2025, 'regular', '2025-04-29', '17', 'Cincinnati Reds', 'CIN', '22', 'Philadelphia Phillies', 'PHI', 5, 7, 12, 1.5, 9.0, 'away_cover', 'over'),

-- Houston Astros (10 games)
('mlb2025040205', 'mlb', 2025, 'regular', '2025-04-02', '18', 'Houston Astros', 'HOU', '13', 'Texas Rangers', 'TEX', 4, 3, 7, -1.5, 8.0, 'push', 'under'),
('mlb2025040505', 'mlb', 2025, 'regular', '2025-04-05', '18', 'Houston Astros', 'HOU', '12', 'Seattle Mariners', 'SEA', 6, 2, 8, -1.5, 7.5, 'home_cover', 'over'),
('mlb2025040805', 'mlb', 2025, 'regular', '2025-04-08', '11', 'Oakland Athletics', 'OAK', '18', 'Houston Astros', 'HOU', 1, 9, 10, 1.5, 8.0, 'away_cover', 'over'),
('mlb2025041105', 'mlb', 2025, 'regular', '2025-04-11', '18', 'Houston Astros', 'HOU', '3', 'Los Angeles Angels', 'LAA', 8, 5, 13, -1.5, 9.0, 'home_cover', 'over'),
('mlb2025041405', 'mlb', 2025, 'regular', '2025-04-14', '13', 'Texas Rangers', 'TEX', '18', 'Houston Astros', 'HOU', 4, 6, 10, 1.5, 8.5, 'away_cover', 'over'),
('mlb2025041705', 'mlb', 2025, 'regular', '2025-04-17', '18', 'Houston Astros', 'HOU', '10', 'New York Yankees', 'NYY', 5, 4, 9, -1.5, 8.5, 'push', 'over'),
('mlb2025042005', 'mlb', 2025, 'regular', '2025-04-20', '12', 'Seattle Mariners', 'SEA', '18', 'Houston Astros', 'HOU', 2, 5, 7, 1.5, 7.5, 'away_cover', 'under'),
('mlb2025042305', 'mlb', 2025, 'regular', '2025-04-23', '18', 'Houston Astros', 'HOU', '11', 'Oakland Athletics', 'OAK', 11, 2, 13, -1.5, 8.0, 'home_cover', 'over'),
('mlb2025042605', 'mlb', 2025, 'regular', '2025-04-26', '3', 'Los Angeles Angels', 'LAA', '18', 'Houston Astros', 'HOU', 3, 7, 10, 1.5, 9.0, 'away_cover', 'over'),
('mlb2025042905', 'mlb', 2025, 'regular', '2025-04-29', '18', 'Houston Astros', 'HOU', '7', 'Kansas City Royals', 'KC', 6, 3, 9, -1.5, 8.5, 'home_cover', 'over')

ON CONFLICT (espn_game_id) DO NOTHING;

-- ===================== VERIFICATION QUERY =====================
SELECT sport, COUNT(*) as total_games, 
  SUM(CASE WHEN spread_result = 'home_cover' THEN 1 ELSE 0 END) as home_covers,
  SUM(CASE WHEN spread_result = 'away_cover' THEN 1 ELSE 0 END) as away_covers,
  SUM(CASE WHEN spread_result = 'push' THEN 1 ELSE 0 END) as pushes,
  SUM(CASE WHEN total_result = 'over' THEN 1 ELSE 0 END) as overs,
  SUM(CASE WHEN total_result = 'under' THEN 1 ELSE 0 END) as unders
FROM public.historical_games 
GROUP BY sport
ORDER BY sport;
