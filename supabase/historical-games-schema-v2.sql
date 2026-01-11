-- Historical Game Scoring Data Schema v2
-- Clean install - drops and recreates tables

-- Drop existing tables first
DROP TABLE IF EXISTS public.scoring_plays CASCADE;
DROP TABLE IF EXISTS public.historical_games CASCADE;

-- Historical games with scoring breakdown
CREATE TABLE public.historical_games (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  espn_game_id TEXT UNIQUE NOT NULL,
  sport TEXT NOT NULL,
  season INTEGER NOT NULL,
  season_type TEXT NOT NULL,
  week INTEGER,
  game_date DATE NOT NULL,
  
  home_team_id TEXT,
  home_team_name TEXT,
  home_team_abbr TEXT,
  away_team_id TEXT,
  away_team_name TEXT,
  away_team_abbr TEXT,
  
  home_score INTEGER DEFAULT 0,
  away_score INTEGER DEFAULT 0,
  
  home_scores_by_period INTEGER[],
  away_scores_by_period INTEGER[],
  
  scoring_plays JSONB DEFAULT '[]',
  
  venue TEXT,
  attendance INTEGER,
  
  home_rushing_td_count INTEGER DEFAULT 0,
  home_passing_td_count INTEGER DEFAULT 0,
  away_rushing_td_count INTEGER DEFAULT 0,
  away_passing_td_count INTEGER DEFAULT 0,
  home_field_goal_count INTEGER DEFAULT 0,
  away_field_goal_count INTEGER DEFAULT 0,
  total_points INTEGER DEFAULT 0,
  
  home_first_half_score INTEGER DEFAULT 0,
  home_second_half_score INTEGER DEFAULT 0,
  away_first_half_score INTEGER DEFAULT 0,
  away_second_half_score INTEGER DEFAULT 0,
  
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

-- Indexes
CREATE INDEX idx_hg_sport ON public.historical_games(sport);
CREATE INDEX idx_hg_season ON public.historical_games(season);
CREATE INDEX idx_hg_season_type ON public.historical_games(season_type);
CREATE INDEX idx_hg_date ON public.historical_games(game_date);
CREATE INDEX idx_hg_teams ON public.historical_games(home_team_abbr, away_team_abbr);

-- Scoring plays table
CREATE TABLE public.scoring_plays (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  game_id UUID REFERENCES public.historical_games(id) ON DELETE CASCADE,
  espn_game_id TEXT,
  period INTEGER,
  time_remaining TEXT,
  scoring_team_id TEXT,
  scoring_team_abbr TEXT,
  home_score_after INTEGER,
  away_score_after INTEGER,
  play_type TEXT,
  points INTEGER,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sp_game ON public.scoring_plays(game_id);
CREATE INDEX idx_sp_type ON public.scoring_plays(play_type);

-- RLS
ALTER TABLE public.historical_games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scoring_plays ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_historical_games" ON public.historical_games;
DROP POLICY IF EXISTS "write_historical_games" ON public.historical_games;
DROP POLICY IF EXISTS "read_scoring_plays" ON public.scoring_plays;
DROP POLICY IF EXISTS "write_scoring_plays" ON public.scoring_plays;

CREATE POLICY "read_historical_games" ON public.historical_games FOR SELECT USING (true);
CREATE POLICY "write_historical_games" ON public.historical_games FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "read_scoring_plays" ON public.scoring_plays FOR SELECT USING (true);
CREATE POLICY "write_scoring_plays" ON public.scoring_plays FOR ALL USING (true) WITH CHECK (true);

-- Verify
SELECT 'Tables created successfully' as status;
