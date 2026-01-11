-- Add missing columns to existing historical_games table
-- Run this in Supabase SQL Editor

-- Add TD breakdown columns for detailed analysis
ALTER TABLE public.historical_games 
  ADD COLUMN IF NOT EXISTS espn_game_id TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS home_scores_by_period INTEGER[],
  ADD COLUMN IF NOT EXISTS away_scores_by_period INTEGER[],
  ADD COLUMN IF NOT EXISTS scoring_plays JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS home_rushing_td_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS home_passing_td_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS away_rushing_td_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS away_passing_td_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS home_field_goal_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS away_field_goal_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_points INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS home_first_half_score INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS home_second_half_score INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS away_first_half_score INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS away_second_half_score INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS home_rushing_td_first_half INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS home_passing_td_first_half INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS home_rushing_td_second_half INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS home_passing_td_second_half INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS away_rushing_td_first_half INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS away_passing_td_first_half INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS away_rushing_td_second_half INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS away_passing_td_second_half INTEGER DEFAULT 0;

-- Create a view that maps old column names to expected names
CREATE OR REPLACE VIEW public.historical_games_v2 AS
SELECT 
  id,
  external_id,
  espn_game_id,
  LOWER(sport) as sport,
  season_year as season,
  season_type,
  week_number as week,
  home_team as home_team_name,
  away_team as away_team_name,
  home_team_abbrev as home_team_abbr,
  away_team_abbrev as away_team_abbr,
  CAST(game_date AS DATE) as game_date,
  venue,
  COALESCE(home_score, 0) as home_score,
  COALESCE(away_score, 0) as away_score,
  home_scores_by_period,
  away_scores_by_period,
  scoring_plays,
  COALESCE(home_rushing_td_count, 0) as home_rushing_td_count,
  COALESCE(home_passing_td_count, 0) as home_passing_td_count,
  COALESCE(away_rushing_td_count, 0) as away_rushing_td_count,
  COALESCE(away_passing_td_count, 0) as away_passing_td_count,
  COALESCE(home_field_goal_count, 0) as home_field_goal_count,
  COALESCE(away_field_goal_count, 0) as away_field_goal_count,
  COALESCE(total_points, home_score + away_score, 0) as total_points,
  COALESCE(home_first_half_score, 0) as home_first_half_score,
  COALESCE(home_second_half_score, 0) as home_second_half_score,
  COALESCE(away_first_half_score, 0) as away_first_half_score,
  COALESCE(away_second_half_score, 0) as away_second_half_score,
  COALESCE(home_rushing_td_first_half, 0) as home_rushing_td_first_half,
  COALESCE(home_passing_td_first_half, 0) as home_passing_td_first_half,
  COALESCE(home_rushing_td_second_half, 0) as home_rushing_td_second_half,
  COALESCE(home_passing_td_second_half, 0) as home_passing_td_second_half,
  COALESCE(away_rushing_td_first_half, 0) as away_rushing_td_first_half,
  COALESCE(away_passing_td_first_half, 0) as away_passing_td_first_half,
  COALESCE(away_rushing_td_second_half, 0) as away_rushing_td_second_half,
  COALESCE(away_passing_td_second_half, 0) as away_passing_td_second_half,
  created_at
FROM public.historical_games;

-- Create indexes for the new columns
CREATE INDEX IF NOT EXISTS idx_hg_espn ON public.historical_games(espn_game_id);
CREATE INDEX IF NOT EXISTS idx_hg_season_year ON public.historical_games(season_year);

SELECT 'Schema updated successfully' as status;
