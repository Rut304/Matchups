-- ===========================================
-- COMBINED DEPLOYMENT SCRIPT
-- Run this ONCE in Supabase SQL Editor
-- Contains: Matchup Analytics + Players & Props + Teams Seed Data
-- ===========================================

-- =====================================================================
-- PART 1: MATCHUP ANALYTICS FOUNDATION (from 2026-01-07)
-- =====================================================================

BEGIN;

-- 1) Canonical teams table
CREATE TABLE IF NOT EXISTS public.teams (
  id SERIAL PRIMARY KEY,
  sport TEXT NOT NULL,
  team_name TEXT NOT NULL,
  abbrev TEXT,
  alternate_names JSONB DEFAULT '[]'::jsonb,
  external_ids JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_teams_sport_abbrev ON public.teams(sport, abbrev);

-- 2) Add canonical team FKs to historical_games
ALTER TABLE public.historical_games
  ADD COLUMN IF NOT EXISTS home_team_id INTEGER REFERENCES public.teams(id),
  ADD COLUMN IF NOT EXISTS away_team_id INTEGER REFERENCES public.teams(id),
  ADD COLUMN IF NOT EXISTS canonical_game_id TEXT;

CREATE INDEX IF NOT EXISTS idx_historical_games_home_away ON public.historical_games(home_team_id, away_team_id, sport, game_date);

-- 3) Add game_id and provenance to historical_edge_picks
ALTER TABLE public.historical_edge_picks
  ADD COLUMN IF NOT EXISTS game_id UUID REFERENCES public.historical_games(id),
  ADD COLUMN IF NOT EXISTS home_team_id INTEGER REFERENCES public.teams(id),
  ADD COLUMN IF NOT EXISTS away_team_id INTEGER REFERENCES public.teams(id),
  ADD COLUMN IF NOT EXISTS source TEXT,
  ADD COLUMN IF NOT EXISTS source_id TEXT,
  ADD COLUMN IF NOT EXISTS raw_payload JSONB,
  ADD COLUMN IF NOT EXISTS imported_at TIMESTAMP WITH TIME ZONE DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_edge_picks_game_id ON public.historical_edge_picks(game_id);
CREATE INDEX IF NOT EXISTS idx_edge_picks_team ON public.historical_edge_picks(home_team_id, away_team_id);

-- 4) Add optional game link + provenance to prediction markets
ALTER TABLE public.historical_prediction_markets
  ADD COLUMN IF NOT EXISTS game_id UUID REFERENCES public.historical_games(id),
  ADD COLUMN IF NOT EXISTS source TEXT,
  ADD COLUMN IF NOT EXISTS source_id TEXT,
  ADD COLUMN IF NOT EXISTS raw_payload JSONB;

CREATE INDEX IF NOT EXISTS idx_pm_game_id ON public.historical_prediction_markets(game_id);

-- 5) Add matchup AI insights table
CREATE TABLE IF NOT EXISTS public.matchup_ai_insights (
  id SERIAL PRIMARY KEY,
  game_id UUID REFERENCES public.historical_games(id) ON DELETE CASCADE,
  model_version TEXT,
  prompt TEXT,
  insight_json JSONB,
  insight_text TEXT,
  score JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_matchup_ai_game ON public.matchup_ai_insights(game_id);

COMMIT;

-- =====================================================================
-- PART 2: PLAYERS AND PROPS (from 2026-01-08)
-- =====================================================================

BEGIN;

-- 1) Canonical players table
CREATE TABLE IF NOT EXISTS public.players (
  id SERIAL PRIMARY KEY,
  sport TEXT NOT NULL,
  full_name TEXT NOT NULL,
  short_name TEXT,
  team_id INTEGER REFERENCES public.teams(id),
  position TEXT,
  jersey_number TEXT,
  external_ids JSONB DEFAULT '{}'::jsonb,
  alternate_names JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_players_sport_name ON public.players(sport, full_name);

-- 2) Player game stats
CREATE TABLE IF NOT EXISTS public.player_game_stats (
  id SERIAL PRIMARY KEY,
  player_id INTEGER REFERENCES public.players(id) ON DELETE CASCADE,
  game_id UUID REFERENCES public.historical_games(id) ON DELETE CASCADE,
  sport TEXT NOT NULL,
  stat_date TIMESTAMP WITH TIME ZONE,
  stats JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  source TEXT,
  source_id TEXT,
  raw_payload JSONB
);

CREATE INDEX IF NOT EXISTS idx_player_game_stats_player_game ON public.player_game_stats(player_id, game_id);
CREATE INDEX IF NOT EXISTS idx_player_game_stats_game ON public.player_game_stats(game_id);

-- 3) Link prediction markets to players
ALTER TABLE public.historical_prediction_markets
  ADD COLUMN IF NOT EXISTS player_id INTEGER REFERENCES public.players(id),
  ADD COLUMN IF NOT EXISTS prop_type TEXT;

CREATE INDEX IF NOT EXISTS idx_pm_player_game ON public.historical_prediction_markets(player_id, game_id);

COMMIT;

-- =====================================================================
-- PART 3: SEED NFL TEAMS (32 Teams)
-- =====================================================================

INSERT INTO public.teams (sport, team_name, abbrev, alternate_names) VALUES
-- AFC East
('NFL', 'Buffalo Bills', 'BUF', '["Bills", "Buffalo"]'),
('NFL', 'Miami Dolphins', 'MIA', '["Dolphins", "Miami"]'),
('NFL', 'New England Patriots', 'NE', '["Patriots", "New England", "Pats"]'),
('NFL', 'New York Jets', 'NYJ', '["Jets", "NY Jets"]'),
-- AFC North
('NFL', 'Baltimore Ravens', 'BAL', '["Ravens", "Baltimore"]'),
('NFL', 'Cincinnati Bengals', 'CIN', '["Bengals", "Cincinnati"]'),
('NFL', 'Cleveland Browns', 'CLE', '["Browns", "Cleveland"]'),
('NFL', 'Pittsburgh Steelers', 'PIT', '["Steelers", "Pittsburgh"]'),
-- AFC South
('NFL', 'Houston Texans', 'HOU', '["Texans", "Houston"]'),
('NFL', 'Indianapolis Colts', 'IND', '["Colts", "Indianapolis", "Indy"]'),
('NFL', 'Jacksonville Jaguars', 'JAX', '["Jaguars", "Jacksonville", "Jags"]'),
('NFL', 'Tennessee Titans', 'TEN', '["Titans", "Tennessee"]'),
-- AFC West
('NFL', 'Denver Broncos', 'DEN', '["Broncos", "Denver"]'),
('NFL', 'Kansas City Chiefs', 'KC', '["Chiefs", "Kansas City"]'),
('NFL', 'Las Vegas Raiders', 'LV', '["Raiders", "Las Vegas", "Oakland Raiders"]'),
('NFL', 'Los Angeles Chargers', 'LAC', '["Chargers", "LA Chargers", "San Diego Chargers"]'),
-- NFC East
('NFL', 'Dallas Cowboys', 'DAL', '["Cowboys", "Dallas"]'),
('NFL', 'New York Giants', 'NYG', '["Giants", "NY Giants"]'),
('NFL', 'Philadelphia Eagles', 'PHI', '["Eagles", "Philadelphia", "Philly"]'),
('NFL', 'Washington Commanders', 'WAS', '["Commanders", "Washington", "Redskins", "Football Team"]'),
-- NFC North
('NFL', 'Chicago Bears', 'CHI', '["Bears", "Chicago"]'),
('NFL', 'Detroit Lions', 'DET', '["Lions", "Detroit"]'),
('NFL', 'Green Bay Packers', 'GB', '["Packers", "Green Bay"]'),
('NFL', 'Minnesota Vikings', 'MIN', '["Vikings", "Minnesota"]'),
-- NFC South
('NFL', 'Atlanta Falcons', 'ATL', '["Falcons", "Atlanta"]'),
('NFL', 'Carolina Panthers', 'CAR', '["Panthers", "Carolina"]'),
('NFL', 'New Orleans Saints', 'NO', '["Saints", "New Orleans"]'),
('NFL', 'Tampa Bay Buccaneers', 'TB', '["Buccaneers", "Tampa Bay", "Bucs"]'),
-- NFC West
('NFL', 'Arizona Cardinals', 'ARI', '["Cardinals", "Arizona"]'),
('NFL', 'Los Angeles Rams', 'LAR', '["Rams", "LA Rams", "St. Louis Rams"]'),
('NFL', 'San Francisco 49ers', 'SF', '["49ers", "San Francisco", "Niners"]'),
('NFL', 'Seattle Seahawks', 'SEA', '["Seahawks", "Seattle"]')
ON CONFLICT DO NOTHING;

-- =====================================================================
-- PART 4: SEED NBA TEAMS (30 Teams)
-- =====================================================================

INSERT INTO public.teams (sport, team_name, abbrev, alternate_names) VALUES
-- Atlantic
('NBA', 'Boston Celtics', 'BOS', '["Celtics", "Boston"]'),
('NBA', 'Brooklyn Nets', 'BKN', '["Nets", "Brooklyn", "New Jersey Nets"]'),
('NBA', 'New York Knicks', 'NYK', '["Knicks", "New York"]'),
('NBA', 'Philadelphia 76ers', 'PHI', '["76ers", "Sixers", "Philadelphia"]'),
('NBA', 'Toronto Raptors', 'TOR', '["Raptors", "Toronto"]'),
-- Central
('NBA', 'Chicago Bulls', 'CHI', '["Bulls", "Chicago"]'),
('NBA', 'Cleveland Cavaliers', 'CLE', '["Cavaliers", "Cleveland", "Cavs"]'),
('NBA', 'Detroit Pistons', 'DET', '["Pistons", "Detroit"]'),
('NBA', 'Indiana Pacers', 'IND', '["Pacers", "Indiana"]'),
('NBA', 'Milwaukee Bucks', 'MIL', '["Bucks", "Milwaukee"]'),
-- Southeast
('NBA', 'Atlanta Hawks', 'ATL', '["Hawks", "Atlanta"]'),
('NBA', 'Charlotte Hornets', 'CHA', '["Hornets", "Charlotte", "Bobcats"]'),
('NBA', 'Miami Heat', 'MIA', '["Heat", "Miami"]'),
('NBA', 'Orlando Magic', 'ORL', '["Magic", "Orlando"]'),
('NBA', 'Washington Wizards', 'WAS', '["Wizards", "Washington", "Bullets"]'),
-- Northwest
('NBA', 'Denver Nuggets', 'DEN', '["Nuggets", "Denver"]'),
('NBA', 'Minnesota Timberwolves', 'MIN', '["Timberwolves", "Minnesota", "Wolves"]'),
('NBA', 'Oklahoma City Thunder', 'OKC', '["Thunder", "OKC", "Seattle SuperSonics"]'),
('NBA', 'Portland Trail Blazers', 'POR', '["Trail Blazers", "Portland", "Blazers"]'),
('NBA', 'Utah Jazz', 'UTA', '["Jazz", "Utah"]'),
-- Pacific
('NBA', 'Golden State Warriors', 'GSW', '["Warriors", "Golden State"]'),
('NBA', 'Los Angeles Clippers', 'LAC', '["Clippers", "LA Clippers"]'),
('NBA', 'Los Angeles Lakers', 'LAL', '["Lakers", "LA Lakers"]'),
('NBA', 'Phoenix Suns', 'PHX', '["Suns", "Phoenix"]'),
('NBA', 'Sacramento Kings', 'SAC', '["Kings", "Sacramento"]'),
-- Southwest
('NBA', 'Dallas Mavericks', 'DAL', '["Mavericks", "Dallas", "Mavs"]'),
('NBA', 'Houston Rockets', 'HOU', '["Rockets", "Houston"]'),
('NBA', 'Memphis Grizzlies', 'MEM', '["Grizzlies", "Memphis"]'),
('NBA', 'New Orleans Pelicans', 'NOP', '["Pelicans", "New Orleans", "Hornets"]'),
('NBA', 'San Antonio Spurs', 'SAS', '["Spurs", "San Antonio"]')
ON CONFLICT DO NOTHING;

-- =====================================================================
-- PART 5: SEED NHL TEAMS (32 Teams)
-- =====================================================================

INSERT INTO public.teams (sport, team_name, abbrev, alternate_names) VALUES
-- Atlantic
('NHL', 'Boston Bruins', 'BOS', '["Bruins", "Boston"]'),
('NHL', 'Buffalo Sabres', 'BUF', '["Sabres", "Buffalo"]'),
('NHL', 'Detroit Red Wings', 'DET', '["Red Wings", "Detroit"]'),
('NHL', 'Florida Panthers', 'FLA', '["Panthers", "Florida"]'),
('NHL', 'Montreal Canadiens', 'MTL', '["Canadiens", "Montreal", "Habs"]'),
('NHL', 'Ottawa Senators', 'OTT', '["Senators", "Ottawa"]'),
('NHL', 'Tampa Bay Lightning', 'TBL', '["Lightning", "Tampa Bay"]'),
('NHL', 'Toronto Maple Leafs', 'TOR', '["Maple Leafs", "Toronto", "Leafs"]'),
-- Metropolitan
('NHL', 'Carolina Hurricanes', 'CAR', '["Hurricanes", "Carolina", "Canes"]'),
('NHL', 'Columbus Blue Jackets', 'CBJ', '["Blue Jackets", "Columbus"]'),
('NHL', 'New Jersey Devils', 'NJD', '["Devils", "New Jersey"]'),
('NHL', 'New York Islanders', 'NYI', '["Islanders", "NY Islanders"]'),
('NHL', 'New York Rangers', 'NYR', '["Rangers", "NY Rangers"]'),
('NHL', 'Philadelphia Flyers', 'PHI', '["Flyers", "Philadelphia"]'),
('NHL', 'Pittsburgh Penguins', 'PIT', '["Penguins", "Pittsburgh", "Pens"]'),
('NHL', 'Washington Capitals', 'WSH', '["Capitals", "Washington", "Caps"]'),
-- Central
('NHL', 'Arizona Coyotes', 'ARI', '["Coyotes", "Arizona", "Utah Hockey Club"]'),
('NHL', 'Chicago Blackhawks', 'CHI', '["Blackhawks", "Chicago"]'),
('NHL', 'Colorado Avalanche', 'COL', '["Avalanche", "Colorado", "Avs"]'),
('NHL', 'Dallas Stars', 'DAL', '["Stars", "Dallas"]'),
('NHL', 'Minnesota Wild', 'MIN', '["Wild", "Minnesota"]'),
('NHL', 'Nashville Predators', 'NSH', '["Predators", "Nashville", "Preds"]'),
('NHL', 'St. Louis Blues', 'STL', '["Blues", "St. Louis"]'),
('NHL', 'Winnipeg Jets', 'WPG', '["Jets", "Winnipeg"]'),
-- Pacific
('NHL', 'Anaheim Ducks', 'ANA', '["Ducks", "Anaheim"]'),
('NHL', 'Calgary Flames', 'CGY', '["Flames", "Calgary"]'),
('NHL', 'Edmonton Oilers', 'EDM', '["Oilers", "Edmonton"]'),
('NHL', 'Los Angeles Kings', 'LAK', '["Kings", "LA Kings"]'),
('NHL', 'San Jose Sharks', 'SJS', '["Sharks", "San Jose"]'),
('NHL', 'Seattle Kraken', 'SEA', '["Kraken", "Seattle"]'),
('NHL', 'Vancouver Canucks', 'VAN', '["Canucks", "Vancouver"]'),
('NHL', 'Vegas Golden Knights', 'VGK', '["Golden Knights", "Vegas"]')
ON CONFLICT DO NOTHING;

-- =====================================================================
-- PART 6: SEED MLB TEAMS (30 Teams)
-- =====================================================================

INSERT INTO public.teams (sport, team_name, abbrev, alternate_names) VALUES
-- AL East
('MLB', 'Baltimore Orioles', 'BAL', '["Orioles", "Baltimore", "Os"]'),
('MLB', 'Boston Red Sox', 'BOS', '["Red Sox", "Boston", "Sox"]'),
('MLB', 'New York Yankees', 'NYY', '["Yankees", "New York", "Yanks"]'),
('MLB', 'Tampa Bay Rays', 'TBR', '["Rays", "Tampa Bay"]'),
('MLB', 'Toronto Blue Jays', 'TOR', '["Blue Jays", "Toronto", "Jays"]'),
-- AL Central
('MLB', 'Chicago White Sox', 'CHW', '["White Sox", "Chicago", "ChiSox"]'),
('MLB', 'Cleveland Guardians', 'CLE', '["Guardians", "Cleveland", "Indians"]'),
('MLB', 'Detroit Tigers', 'DET', '["Tigers", "Detroit"]'),
('MLB', 'Kansas City Royals', 'KCR', '["Royals", "Kansas City"]'),
('MLB', 'Minnesota Twins', 'MIN', '["Twins", "Minnesota"]'),
-- AL West
('MLB', 'Houston Astros', 'HOU', '["Astros", "Houston"]'),
('MLB', 'Los Angeles Angels', 'LAA', '["Angels", "LA Angels", "Anaheim Angels"]'),
('MLB', 'Oakland Athletics', 'OAK', '["Athletics", "Oakland", "As"]'),
('MLB', 'Seattle Mariners', 'SEA', '["Mariners", "Seattle"]'),
('MLB', 'Texas Rangers', 'TEX', '["Rangers", "Texas"]'),
-- NL East
('MLB', 'Atlanta Braves', 'ATL', '["Braves", "Atlanta"]'),
('MLB', 'Miami Marlins', 'MIA', '["Marlins", "Miami", "Florida Marlins"]'),
('MLB', 'New York Mets', 'NYM', '["Mets", "New York"]'),
('MLB', 'Philadelphia Phillies', 'PHI', '["Phillies", "Philadelphia"]'),
('MLB', 'Washington Nationals', 'WSN', '["Nationals", "Washington", "Nats"]'),
-- NL Central
('MLB', 'Chicago Cubs', 'CHC', '["Cubs", "Chicago"]'),
('MLB', 'Cincinnati Reds', 'CIN', '["Reds", "Cincinnati"]'),
('MLB', 'Milwaukee Brewers', 'MIL', '["Brewers", "Milwaukee"]'),
('MLB', 'Pittsburgh Pirates', 'PIT', '["Pirates", "Pittsburgh"]'),
('MLB', 'St. Louis Cardinals', 'STL', '["Cardinals", "St. Louis", "Cards"]'),
-- NL West
('MLB', 'Arizona Diamondbacks', 'ARI', '["Diamondbacks", "Arizona", "DBacks"]'),
('MLB', 'Colorado Rockies', 'COL', '["Rockies", "Colorado"]'),
('MLB', 'Los Angeles Dodgers', 'LAD', '["Dodgers", "LA Dodgers"]'),
('MLB', 'San Diego Padres', 'SDP', '["Padres", "San Diego"]'),
('MLB', 'San Francisco Giants', 'SFG', '["Giants", "San Francisco"]')
ON CONFLICT DO NOTHING;

-- =====================================================================
-- PART 7: CREATE MATERIALIZED VIEWS
-- =====================================================================

-- Per-game aggregated edges/trends summary
CREATE MATERIALIZED VIEW IF NOT EXISTS public.mv_game_edges AS
SELECT
  g.id AS game_id,
  g.sport,
  g.game_date,
  g.home_team AS home_team_name,
  g.away_team AS away_team_name,
  COALESCE(g.home_team_id, NULL) AS home_team_id,
  COALESCE(g.away_team_id, NULL) AS away_team_id,
  COUNT(e.id) FILTER (WHERE e.result IS NOT NULL) AS picks_sample_size,
  SUM(CASE WHEN e.result = 'win' THEN 1 WHEN e.result = 'loss' THEN 0 ELSE 0 END) AS picks_wins,
  SUM(e.units_won_lost) AS units_won_lost,
  AVG(e.edge_score) AS avg_edge_score,
  AVG(e.confidence) AS avg_confidence,
  AVG(e.model_probability) AS avg_model_prob,
  AVG(e.implied_probability) AS avg_implied_prob,
  AVG(e.edge_percentage) AS avg_edge_pct,
  SUM(CASE WHEN e.sharp_side THEN 1 ELSE 0 END) AS sharp_signals,
  SUM(CASE WHEN e.public_side THEN 1 ELSE 0 END) AS public_signals
FROM public.historical_games g
LEFT JOIN public.historical_edge_picks e ON e.game_id = g.id
GROUP BY g.id, g.sport, g.game_date, g.home_team, g.away_team, g.home_team_id, g.away_team_id;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_game_edges_game_id ON public.mv_game_edges(game_id);

-- Team-vs-team historical aggregates
CREATE MATERIALIZED VIEW IF NOT EXISTS public.mv_team_vs_team_summary AS
SELECT
  COALESCE(g.home_team_id, 0) AS home_team_id,
  COALESCE(g.away_team_id, 0) AS away_team_id,
  g.sport,
  COUNT(*) AS games_played,
  SUM(CASE WHEN g.spread_result = 'home_cover' THEN 1 ELSE 0 END) AS home_covers,
  SUM(CASE WHEN g.spread_result = 'away_cover' THEN 1 ELSE 0 END) AS away_covers,
  SUM(CASE WHEN g.total_result = 'over' THEN 1 ELSE 0 END) AS overs,
  SUM(CASE WHEN g.total_result = 'under' THEN 1 ELSE 0 END) AS unders,
  AVG(g.home_score - g.away_score) AS avg_margin,
  AVG(g.home_score + g.away_score) AS avg_total
FROM public.historical_games g
WHERE g.home_team_id IS NOT NULL AND g.away_team_id IS NOT NULL
GROUP BY g.home_team_id, g.away_team_id, g.sport;

CREATE INDEX IF NOT EXISTS idx_mv_tvt_home_away ON public.mv_team_vs_team_summary(home_team_id, away_team_id);

-- Player prop performance summary
CREATE MATERIALIZED VIEW IF NOT EXISTS public.mv_player_prop_summary AS
SELECT
  p.id AS player_id,
  p.full_name,
  pm.sport,
  pm.prop_type,
  COUNT(*) AS markets_sample,
  AVG(pm.our_confidence) AS avg_confidence,
  AVG(pm.our_pnl_pct) AS avg_pnl_pct,
  AVG((pm.final_yes_price - pm.initial_yes_price)) AS avg_price_change
FROM public.historical_prediction_markets pm
JOIN public.players p ON pm.player_id = p.id
WHERE pm.player_id IS NOT NULL
GROUP BY p.id, p.full_name, pm.sport, pm.prop_type;

CREATE INDEX IF NOT EXISTS idx_mv_player_prop_player ON public.mv_player_prop_summary(player_id);

-- =====================================================================
-- PART 8: GRANT PERMISSIONS
-- =====================================================================

GRANT SELECT ON public.teams TO authenticated, anon;
GRANT SELECT ON public.players TO authenticated, anon;
GRANT SELECT ON public.player_game_stats TO authenticated, anon;
GRANT SELECT ON public.matchup_ai_insights TO authenticated, anon;
GRANT SELECT ON public.mv_game_edges TO authenticated, anon;
GRANT SELECT ON public.mv_team_vs_team_summary TO authenticated, anon;
GRANT SELECT ON public.mv_player_prop_summary TO authenticated, anon;

-- =====================================================================
-- PART 9: BACKFILL TEAM IDS ON HISTORICAL GAMES
-- =====================================================================

-- Match by full team name
UPDATE public.historical_games g
SET home_team_id = t.id
FROM public.teams t
WHERE g.home_team = t.team_name 
  AND g.sport = t.sport 
  AND g.home_team_id IS NULL;

UPDATE public.historical_games g
SET away_team_id = t.id
FROM public.teams t
WHERE g.away_team = t.team_name 
  AND g.sport = t.sport 
  AND g.away_team_id IS NULL;

-- Also try matching by abbreviation (if home_team matches abbrev)
UPDATE public.historical_games g
SET home_team_id = t.id
FROM public.teams t
WHERE g.home_team = t.abbrev 
  AND g.sport = t.sport 
  AND g.home_team_id IS NULL;

UPDATE public.historical_games g
SET away_team_id = t.id
FROM public.teams t
WHERE g.away_team = t.abbrev 
  AND g.sport = t.sport 
  AND g.away_team_id IS NULL;

-- =====================================================================
-- DONE! Refresh materialized views
-- =====================================================================

REFRESH MATERIALIZED VIEW public.mv_game_edges;
REFRESH MATERIALIZED VIEW public.mv_team_vs_team_summary;
-- mv_player_prop_summary will be empty until we link players to props

-- Verify counts
SELECT 'teams' as table_name, COUNT(*) as count FROM public.teams
UNION ALL
SELECT 'historical_games', COUNT(*) FROM public.historical_games
UNION ALL
SELECT 'games_with_team_ids', COUNT(*) FROM public.historical_games WHERE home_team_id IS NOT NULL;
