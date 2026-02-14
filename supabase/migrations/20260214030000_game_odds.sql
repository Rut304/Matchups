-- Historical Game Odds Data
-- Stores closing/near-closing odds from The Odds API for historical analysis

CREATE TABLE IF NOT EXISTS public.game_odds (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Game identification
  sport TEXT NOT NULL, -- 'nfl', 'nba', 'nhl', 'mlb', 'ncaaf', 'ncaab'
  odds_api_game_id TEXT UNIQUE, -- The Odds API event ID
  espn_game_id TEXT, -- Link to historical_games
  
  -- Teams & timing
  home_team TEXT NOT NULL,
  away_team TEXT NOT NULL,
  commence_time TIMESTAMPTZ NOT NULL,
  game_date DATE NOT NULL,
  season INTEGER,
  
  -- Consensus (average across all bookmakers)
  consensus_home_ml INTEGER,
  consensus_away_ml INTEGER,
  consensus_spread DECIMAL(4,1),
  consensus_spread_home_odds INTEGER,
  consensus_spread_away_odds INTEGER,
  consensus_total DECIMAL(4,1),
  consensus_over_odds INTEGER,
  consensus_under_odds INTEGER,
  
  -- Best odds available (best line for bettor)
  best_home_ml INTEGER,
  best_away_ml INTEGER,
  best_spread DECIMAL(4,1),
  best_total DECIMAL(4,1),
  
  -- FanDuel specific
  fanduel_home_ml INTEGER,
  fanduel_away_ml INTEGER,
  fanduel_spread DECIMAL(4,1),
  fanduel_spread_home_odds INTEGER,
  fanduel_total DECIMAL(4,1),
  fanduel_over_odds INTEGER,
  fanduel_under_odds INTEGER,
  
  -- DraftKings specific
  draftkings_home_ml INTEGER,
  draftkings_away_ml INTEGER,
  draftkings_spread DECIMAL(4,1),
  draftkings_spread_home_odds INTEGER,
  draftkings_total DECIMAL(4,1),
  draftkings_over_odds INTEGER,
  draftkings_under_odds INTEGER,
  
  -- BetMGM specific
  betmgm_home_ml INTEGER,
  betmgm_away_ml INTEGER,
  betmgm_spread DECIMAL(4,1),
  betmgm_spread_home_odds INTEGER,
  betmgm_total DECIMAL(4,1),
  betmgm_over_odds INTEGER,
  betmgm_under_odds INTEGER,
  
  -- Full bookmaker data (JSON for all bookmakers)
  bookmaker_odds JSONB, -- Complete raw bookmaker data
  
  -- Metadata
  snapshot_time TIMESTAMPTZ, -- When this odds snapshot was taken
  bookmaker_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_game_odds_sport ON public.game_odds(sport);
CREATE INDEX IF NOT EXISTS idx_game_odds_date ON public.game_odds(game_date);
CREATE INDEX IF NOT EXISTS idx_game_odds_sport_date ON public.game_odds(sport, game_date);
CREATE INDEX IF NOT EXISTS idx_game_odds_teams ON public.game_odds(home_team, away_team);
CREATE INDEX IF NOT EXISTS idx_game_odds_commence ON public.game_odds(commence_time);
CREATE INDEX IF NOT EXISTS idx_game_odds_espn ON public.game_odds(espn_game_id);
CREATE INDEX IF NOT EXISTS idx_game_odds_season ON public.game_odds(season);

-- Enable RLS
ALTER TABLE public.game_odds ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Public read game_odds" ON public.game_odds FOR SELECT USING (true);

-- Service role write access
CREATE POLICY "Service write game_odds" ON public.game_odds FOR ALL USING (true) WITH CHECK (true);

-- Grant access
GRANT SELECT ON public.game_odds TO authenticated, anon;

-- Import progress tracking table
CREATE TABLE IF NOT EXISTS public.odds_import_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sport TEXT NOT NULL,
  import_date DATE NOT NULL,
  snapshot_time TIMESTAMPTZ,
  games_found INTEGER DEFAULT 0,
  games_imported INTEGER DEFAULT 0,
  credits_used INTEGER DEFAULT 0,
  credits_remaining INTEGER,
  status TEXT DEFAULT 'success', -- 'success', 'error', 'skipped'
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(sport, import_date)
);

ALTER TABLE public.odds_import_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read odds_import_log" ON public.odds_import_log FOR SELECT USING (true);
CREATE POLICY "Service write odds_import_log" ON public.odds_import_log FOR ALL USING (true) WITH CHECK (true);
GRANT SELECT ON public.odds_import_log TO authenticated, anon;
