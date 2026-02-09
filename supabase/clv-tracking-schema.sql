-- ===========================================
-- CLV (CLOSING LINE VALUE) TRACKING SCHEMA
-- Stores odds snapshots for opening/closing line comparison
-- ===========================================

-- Table: line_snapshots - captures odds at regular intervals
CREATE TABLE IF NOT EXISTS public.line_snapshots (
  id BIGSERIAL PRIMARY KEY,
  game_id TEXT NOT NULL,                    -- ESPN game ID
  sport TEXT NOT NULL,                      -- NFL, NBA, etc.
  game_date TIMESTAMPTZ,                    -- When game starts
  home_team TEXT NOT NULL,
  away_team TEXT NOT NULL,
  
  -- Snapshot metadata
  provider TEXT NOT NULL DEFAULT 'consensus', -- draftkings, fanduel, consensus
  snapshot_ts TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_opening BOOLEAN DEFAULT FALSE,         -- First captured line for this game
  is_closing BOOLEAN DEFAULT FALSE,         -- Line at game start
  
  -- Spread market
  spread_home NUMERIC(5,2),                 -- Home team spread (e.g., -3.5)
  spread_home_odds INTEGER DEFAULT -110,    -- American odds
  spread_away NUMERIC(5,2),                 -- Away team spread (e.g., +3.5)
  spread_away_odds INTEGER DEFAULT -110,
  
  -- Totals market
  total_line NUMERIC(5,2),                  -- Over/under line
  total_over_odds INTEGER DEFAULT -110,
  total_under_odds INTEGER DEFAULT -110,
  
  -- Moneyline market
  home_ml INTEGER,                          -- Home moneyline (e.g., -150)
  away_ml INTEGER,                          -- Away moneyline (e.g., +130)
  
  -- Raw data for debugging
  raw_data JSONB,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_game_provider_snapshot UNIQUE (game_id, provider, snapshot_ts)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_line_snap_game ON public.line_snapshots(game_id);
CREATE INDEX IF NOT EXISTS idx_line_snap_sport_date ON public.line_snapshots(sport, game_date);
CREATE INDEX IF NOT EXISTS idx_line_snap_ts ON public.line_snapshots(snapshot_ts DESC);
CREATE INDEX IF NOT EXISTS idx_line_snap_opening ON public.line_snapshots(game_id, is_opening) WHERE is_opening = TRUE;
CREATE INDEX IF NOT EXISTS idx_line_snap_closing ON public.line_snapshots(game_id, is_closing) WHERE is_closing = TRUE;

-- View: Opening lines (first snapshot per game)
CREATE OR REPLACE VIEW public.opening_lines AS
SELECT DISTINCT ON (game_id, provider)
  game_id, sport, home_team, away_team, provider,
  spread_home AS open_spread,
  total_line AS open_total,
  home_ml AS open_home_ml,
  away_ml AS open_away_ml,
  snapshot_ts AS opened_at
FROM public.line_snapshots
WHERE is_opening = TRUE OR snapshot_ts = (
  SELECT MIN(snapshot_ts) FROM public.line_snapshots ls2 
  WHERE ls2.game_id = line_snapshots.game_id AND ls2.provider = line_snapshots.provider
)
ORDER BY game_id, provider, snapshot_ts ASC;

-- View: Closing lines (last snapshot before game start)
CREATE OR REPLACE VIEW public.closing_lines AS
SELECT DISTINCT ON (game_id, provider)
  game_id, sport, home_team, away_team, provider,
  spread_home AS close_spread,
  total_line AS close_total,
  home_ml AS close_home_ml,
  away_ml AS close_away_ml,
  snapshot_ts AS closed_at
FROM public.line_snapshots
WHERE is_closing = TRUE OR snapshot_ts = (
  SELECT MAX(snapshot_ts) FROM public.line_snapshots ls2 
  WHERE ls2.game_id = line_snapshots.game_id AND ls2.provider = line_snapshots.provider
)
ORDER BY game_id, provider, snapshot_ts DESC;

-- Table: User picks with CLV tracking
CREATE TABLE IF NOT EXISTS public.user_picks_clv (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  game_id TEXT NOT NULL,
  sport TEXT NOT NULL,
  
  -- Pick details
  pick_type TEXT NOT NULL,                  -- 'spread', 'total', 'moneyline'
  pick_side TEXT NOT NULL,                  -- 'home', 'away', 'over', 'under'
  pick_line NUMERIC(5,2),                   -- Line at time of pick (e.g., -3.5)
  pick_odds INTEGER DEFAULT -110,           -- Odds at time of pick
  pick_book TEXT DEFAULT 'consensus',       -- Where they got odds
  
  -- CLV tracking (populated after game starts)
  open_line NUMERIC(5,2),                   -- Opening line
  close_line NUMERIC(5,2),                  -- Closing line
  clv_points NUMERIC(5,2),                  -- Points of CLV (pick_line - close_line)
  clv_cents INTEGER,                        -- CLV in cents of juice
  beat_close BOOLEAN,                       -- Did pick beat closing line?
  
  -- Result (populated after game ends)
  result TEXT,                              -- 'win', 'loss', 'push'
  units NUMERIC(5,2) DEFAULT 1.0,
  profit NUMERIC(8,2),
  
  picked_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_picks_clv_user ON public.user_picks_clv(user_id);
CREATE INDEX IF NOT EXISTS idx_user_picks_clv_game ON public.user_picks_clv(game_id);
CREATE INDEX IF NOT EXISTS idx_user_picks_clv_clv ON public.user_picks_clv(clv_points DESC);

-- Function: Calculate CLV for a pick
CREATE OR REPLACE FUNCTION calculate_clv(
  p_pick_line NUMERIC,
  p_close_line NUMERIC,
  p_pick_type TEXT,
  p_pick_side TEXT
) RETURNS NUMERIC AS $$
DECLARE
  clv NUMERIC;
BEGIN
  -- For spreads: positive CLV means you got a better number
  -- If you took home -3 and it closed at -4, you got +1 CLV (good!)
  -- If you took away +3 and it closed at +2, you got +1 CLV (good!)
  IF p_pick_type = 'spread' THEN
    IF p_pick_side IN ('home', 'over') THEN
      clv := p_close_line - p_pick_line; -- Lower is better for home/over
    ELSE
      clv := p_pick_line - p_close_line; -- Higher is better for away/under
    END IF;
  -- For totals: similar logic
  ELSIF p_pick_type = 'total' THEN
    IF p_pick_side = 'over' THEN
      clv := p_close_line - p_pick_line; -- Lower close = CLV for over
    ELSE
      clv := p_pick_line - p_close_line; -- Higher close = CLV for under
    END IF;
  ELSE
    clv := 0; -- Moneyline CLV calculated differently
  END IF;
  
  RETURN ROUND(clv, 2);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Grant permissions
GRANT SELECT ON public.line_snapshots TO authenticated, anon;
GRANT SELECT ON public.opening_lines TO authenticated, anon;
GRANT SELECT ON public.closing_lines TO authenticated, anon;
GRANT ALL ON public.user_picks_clv TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- RLS policies
ALTER TABLE public.line_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_picks_clv ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read line snapshots" ON public.line_snapshots
  FOR SELECT USING (true);

CREATE POLICY "Users can read their own picks" ON public.user_picks_clv
  FOR SELECT USING (auth.uid() = user_id);
  
CREATE POLICY "Users can insert their own picks" ON public.user_picks_clv
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own picks" ON public.user_picks_clv
  FOR UPDATE USING (auth.uid() = user_id);
