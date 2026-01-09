-- Migration: players and player-game stats foundation
-- Adds canonical players, player-game stats, and links props/markets to players and games

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

-- 2) Player game stats (one row per player per game)
CREATE TABLE IF NOT EXISTS public.player_game_stats (
  id SERIAL PRIMARY KEY,
  player_id INTEGER REFERENCES public.players(id) ON DELETE CASCADE,
  game_id INTEGER REFERENCES public.historical_games(id) ON DELETE CASCADE,
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

-- 3) Link prediction markets (props) to players and games
ALTER TABLE public.historical_prediction_markets
  ADD COLUMN IF NOT EXISTS player_id INTEGER REFERENCES public.players(id),
  ADD COLUMN IF NOT EXISTS prop_type TEXT; -- e.g., 'points','rebounds','assists','goals'

CREATE INDEX IF NOT EXISTS idx_pm_player_game ON public.historical_prediction_markets(player_id, game_id);

-- 4) Materialized view: player prop performance summary
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
GRANT SELECT ON public.mv_player_prop_summary TO authenticated, anon;

-- 5) Backfill helper notes (manual steps)
-- 1) Populate `players` either via import CSV or mapping from external provider ids.
-- 2) Update `historical_prediction_markets` records that represent a player prop to set `player_id` and `prop_type`.
-- Example update snippet:
-- UPDATE public.historical_prediction_markets pm
-- SET player_id = p.id
-- FROM public.players p
-- WHERE pm.event_name ILIKE '%' || p.full_name || '%' AND pm.sport = p.sport;

-- 6) Refresh materialized view after imports
-- REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_player_prop_summary;

COMMIT;
