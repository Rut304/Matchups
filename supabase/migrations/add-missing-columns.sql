-- Migration: Add missing columns to historical_games table
-- Run this in Supabase SQL Editor to fix the schema

-- Add season column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' 
                 AND table_name = 'historical_games' 
                 AND column_name = 'season') THEN
    ALTER TABLE public.historical_games ADD COLUMN season INTEGER;
    RAISE NOTICE 'Added season column';
  END IF;
END $$;

-- Add season_type column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' 
                 AND table_name = 'historical_games' 
                 AND column_name = 'season_type') THEN
    ALTER TABLE public.historical_games ADD COLUMN season_type TEXT DEFAULT 'regular';
    RAISE NOTICE 'Added season_type column';
  END IF;
END $$;

-- Add spread_result column for ATS tracking (home_cover, away_cover, push)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' 
                 AND table_name = 'historical_games' 
                 AND column_name = 'spread_result') THEN
    ALTER TABLE public.historical_games ADD COLUMN spread_result TEXT;
    RAISE NOTICE 'Added spread_result column';
  END IF;
END $$;

-- Add total_result column for O/U tracking (over, under, push)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' 
                 AND table_name = 'historical_games' 
                 AND column_name = 'total_result') THEN
    ALTER TABLE public.historical_games ADD COLUMN total_result TEXT;
    RAISE NOTICE 'Added total_result column';
  END IF;
END $$;

-- Add week column for NFL
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' 
                 AND table_name = 'historical_games' 
                 AND column_name = 'week') THEN
    ALTER TABLE public.historical_games ADD COLUMN week INTEGER;
    RAISE NOTICE 'Added week column';
  END IF;
END $$;

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_historical_games_season ON public.historical_games(season);
CREATE INDEX IF NOT EXISTS idx_historical_games_season_type ON public.historical_games(season_type);
CREATE INDEX IF NOT EXISTS idx_historical_games_sport ON public.historical_games(sport);
CREATE INDEX IF NOT EXISTS idx_historical_games_teams ON public.historical_games(home_team_abbr, away_team_abbr);

-- Backfill season from game_date for existing records
UPDATE public.historical_games 
SET season = EXTRACT(YEAR FROM game_date)::INTEGER
WHERE season IS NULL AND game_date IS NOT NULL;

-- For games in Jan-Feb, they belong to the previous year's season (playoffs)
UPDATE public.historical_games 
SET season = season - 1,
    season_type = 'postseason'
WHERE season IS NOT NULL 
  AND EXTRACT(MONTH FROM game_date) IN (1, 2)
  AND sport IN ('nfl', 'nba', 'nhl');

-- Verify the changes
SELECT 
  column_name, 
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'historical_games'
ORDER BY ordinal_position;
