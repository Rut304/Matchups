-- Line snapshots schema for CLV and live line history
-- Captures book-level odds and timestamps so we can compute opening lines, live movement, and closing line value (CLV)

CREATE TABLE IF NOT EXISTS public.line_snapshots (
  id bigserial PRIMARY KEY,
  game_id text NOT NULL,
  sport text NOT NULL,
  provider text NOT NULL DEFAULT 'action_network', -- source of odds
  book_id text, -- sportsbook identifier (e.g., DraftKings)
  book_name text,
  snapshot_ts timestamptz NOT NULL DEFAULT now(), -- when the snapshot was taken

  -- standard market fields (nullable if market not offered by that book)
  spread_home numeric, -- home spread (positive if home is favorite)
  spread_away numeric,
  spread_home_odds integer,
  spread_away_odds integer,

  total_line numeric,
  total_over_odds integer,
  total_under_odds integer,

  home_ml integer,
  away_ml integer,

  is_open_snapshot boolean DEFAULT false, -- mark recorded opening snapshot
  is_close_snapshot boolean DEFAULT false, -- mark closing snapshot

  raw_payload jsonb, -- raw response for debugging/replay
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_line_snapshots_game_ts ON public.line_snapshots (game_id, snapshot_ts DESC);
CREATE INDEX IF NOT EXISTS idx_line_snapshots_provider ON public.line_snapshots (provider);
CREATE INDEX IF NOT EXISTS idx_line_snapshots_book ON public.line_snapshots (book_id);

-- View: opening_lines (first snapshot per game/provider/book where is_open_snapshot or earliest)
CREATE OR REPLACE VIEW public.opening_line_snapshots AS
SELECT DISTINCT ON (game_id, provider, book_id)
  id, game_id, sport, provider, book_id, book_name, snapshot_ts, spread_home, spread_away, total_line, home_ml, away_ml
FROM public.line_snapshots
ORDER BY game_id, provider, book_id, snapshot_ts ASC;

-- Utility function to compute simple CLV per book (current - open)
-- Note: More advanced CLV logic and consensus CLV to be added in application layer
