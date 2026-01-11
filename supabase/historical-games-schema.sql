-- Historical Game Scoring Data Schema
-- This stores actual play-by-play scoring data for queries

-- Historical games with scoring breakdown
CREATE TABLE IF NOT EXISTS public.historical_games (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  espn_game_id TEXT UNIQUE NOT NULL,
  sport TEXT NOT NULL, -- 'nfl', 'nba', 'nhl', 'mlb'
  season INTEGER NOT NULL,
  season_type TEXT NOT NULL, -- 'regular', 'postseason', 'preseason'
  week INTEGER, -- For NFL
  game_date DATE NOT NULL,
  
  -- Teams
  home_team_id TEXT NOT NULL,
  home_team_name TEXT NOT NULL,
  home_team_abbr TEXT NOT NULL,
  away_team_id TEXT NOT NULL,
  away_team_name TEXT NOT NULL,
  away_team_abbr TEXT NOT NULL,
  
  -- Final scores
  home_score INTEGER,
  away_score INTEGER,
  
  -- Quarter/Period scores (JSON arrays)
  home_scores_by_period JSONB, -- [7, 10, 3, 14] for NFL quarters
  away_scores_by_period JSONB,
  
  -- Scoring summary (detailed plays)
  scoring_plays JSONB, -- Array of scoring plays with details
  
  -- Metadata
  venue TEXT,
  attendance INTEGER,
  weather JSONB, -- For outdoor sports
  
  -- Computed flags for common queries
  home_rushing_td_count INTEGER DEFAULT 0,
  home_passing_td_count INTEGER DEFAULT 0,
  away_rushing_td_count INTEGER DEFAULT 0,
  away_passing_td_count INTEGER DEFAULT 0,
  home_field_goal_count INTEGER DEFAULT 0,
  away_field_goal_count INTEGER DEFAULT 0,
  total_points INTEGER,
  point_spread DECIMAL(4,1), -- Actual spread (home favored = negative)
  over_under DECIMAL(4,1),
  
  -- First/Second half breakdown
  home_first_half_score INTEGER,
  home_second_half_score INTEGER,
  away_first_half_score INTEGER,
  away_second_half_score INTEGER,
  home_rushing_td_first_half INTEGER DEFAULT 0,
  home_passing_td_first_half INTEGER DEFAULT 0,
  home_rushing_td_second_half INTEGER DEFAULT 0,
  home_passing_td_second_half INTEGER DEFAULT 0,
  away_rushing_td_first_half INTEGER DEFAULT 0,
  away_passing_td_first_half INTEGER DEFAULT 0,
  away_rushing_td_second_half INTEGER DEFAULT 0,
  away_passing_td_second_half INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_historical_games_sport ON public.historical_games(sport);
CREATE INDEX IF NOT EXISTS idx_historical_games_season ON public.historical_games(season);
CREATE INDEX IF NOT EXISTS idx_historical_games_season_type ON public.historical_games(season_type);
CREATE INDEX IF NOT EXISTS idx_historical_games_date ON public.historical_games(game_date);
CREATE INDEX IF NOT EXISTS idx_historical_games_teams ON public.historical_games(home_team_abbr, away_team_abbr);
CREATE INDEX IF NOT EXISTS idx_historical_games_sport_postseason ON public.historical_games(sport, season_type) WHERE season_type = 'postseason';

-- Individual scoring plays for detailed analysis
CREATE TABLE IF NOT EXISTS public.scoring_plays (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  game_id UUID REFERENCES public.historical_games(id) ON DELETE CASCADE,
  espn_game_id TEXT NOT NULL,
  
  -- Play details
  period INTEGER NOT NULL, -- Quarter for NFL, Period for NHL, Inning for MLB
  time_remaining TEXT, -- "12:34" format
  scoring_team_id TEXT NOT NULL,
  scoring_team_abbr TEXT NOT NULL,
  
  -- Score after play
  home_score_after INTEGER,
  away_score_after INTEGER,
  
  -- Play type
  play_type TEXT NOT NULL, -- 'rushing_td', 'passing_td', 'field_goal', 'safety', 'two_point', 'extra_point', etc.
  points INTEGER NOT NULL,
  
  -- Description
  description TEXT,
  
  -- Player info (if available)
  scorer_name TEXT,
  scorer_id TEXT,
  passer_name TEXT, -- For passing TDs
  passer_id TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scoring_plays_game ON public.scoring_plays(game_id);
CREATE INDEX IF NOT EXISTS idx_scoring_plays_type ON public.scoring_plays(play_type);
CREATE INDEX IF NOT EXISTS idx_scoring_plays_period ON public.scoring_plays(period);

-- Enable RLS
ALTER TABLE public.historical_games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scoring_plays ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Public read historical_games" ON public.historical_games FOR SELECT USING (true);
CREATE POLICY "Public read scoring_plays" ON public.scoring_plays FOR SELECT USING (true);

-- Service role write access (for data population)
CREATE POLICY "Service write historical_games" ON public.historical_games FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service write scoring_plays" ON public.scoring_plays FOR ALL USING (true) WITH CHECK (true);

-- Example query: Both teams score rushing TD and passing TD in both halves (NFL playoffs)
-- SELECT COUNT(*) FROM public.historical_games
-- WHERE sport = 'nfl' 
--   AND season_type = 'postseason'
--   AND home_rushing_td_first_half >= 1
--   AND home_passing_td_first_half >= 1
--   AND home_rushing_td_second_half >= 1
--   AND home_passing_td_second_half >= 1
--   AND away_rushing_td_first_half >= 1
--   AND away_passing_td_first_half >= 1
--   AND away_rushing_td_second_half >= 1
--   AND away_passing_td_second_half >= 1;

-- Verify tables
SELECT 'historical_games' as table_name, 'created' as status
UNION ALL
SELECT 'scoring_plays' as table_name, 'created' as status;
