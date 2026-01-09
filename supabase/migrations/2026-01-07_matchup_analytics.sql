-- Migration: Matchup analytics foundation
-- Adds canonical teams, links picks/markets/trends to games, and materialized views for per-game / team-vs-team aggregates

BEGIN;

-- 1) Canonical teams table
CREATE TABLE IF NOT EXISTS public.teams (
  id SERIAL PRIMARY KEY,
  sport TEXT NOT NULL,
  team_name TEXT NOT NULL,
  abbrev TEXT,
  alternate_names JSONB DEFAULT '[]'::jsonb,
  external_ids JSONB DEFAULT '{}'::jsonb, -- map of provider->{id}
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_teams_sport_abbrev ON public.teams(sport, abbrev);

-- 2) Add canonical team FKs to historical_games
ALTER TABLE public.historical_games
  ADD COLUMN IF NOT EXISTS home_team_id INTEGER REFERENCES public.teams(id),
  ADD COLUMN IF NOT EXISTS away_team_id INTEGER REFERENCES public.teams(id),
  ADD COLUMN IF NOT EXISTS canonical_game_id TEXT; -- optional stable external id

CREATE INDEX IF NOT EXISTS idx_historical_games_home_away ON public.historical_games(home_team_id, away_team_id, sport, game_date);

-- 3) Add game_id and provenance to historical_edge_picks
ALTER TABLE public.historical_edge_picks
  ADD COLUMN IF NOT EXISTS game_id INTEGER REFERENCES public.historical_games(id),
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
  ADD COLUMN IF NOT EXISTS game_id INTEGER REFERENCES public.historical_games(id),
  ADD COLUMN IF NOT EXISTS source TEXT,
  ADD COLUMN IF NOT EXISTS source_id TEXT,
  ADD COLUMN IF NOT EXISTS raw_payload JSONB;

CREATE INDEX IF NOT EXISTS idx_pm_game_id ON public.historical_prediction_markets(game_id);

-- 5) Add matchup AI insights table (store model outputs separately with provenance)
CREATE TABLE IF NOT EXISTS public.matchup_ai_insights (
  id SERIAL PRIMARY KEY,
  game_id INTEGER REFERENCES public.historical_games(id) ON DELETE CASCADE,
  model_version TEXT,
  prompt TEXT,
  insight_json JSONB,
  insight_text TEXT,
  score JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_matchup_ai_game ON public.matchup_ai_insights(game_id);

-- 6) Materialized view: per-game aggregated edges/trends summary
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
GRANT SELECT ON public.mv_game_edges TO authenticated, anon;

-- 7) Materialized view: team-vs-team historical aggregates
CREATE MATERIALIZED VIEW IF NOT EXISTS public.mv_team_vs_team_summary AS
SELECT
  COALESCE(home_team_id, 0) AS home_team_id,
  COALESCE(away_team_id, 0) AS away_team_id,
  sport,
  COUNT(e.id) AS picks_sample_size,
  SUM(CASE WHEN e.result = 'win' THEN 1 ELSE 0 END) AS picks_wins,
  ROUND(100.0 * SUM(CASE WHEN e.result = 'win' THEN 1 ELSE 0 END) / NULLIF(COUNT(e.id),0),2) AS win_pct,
  SUM(e.units_won_lost) AS units_won_lost,
  AVG(e.edge_score) AS avg_edge_score,
  AVG(e.confidence) AS avg_confidence
FROM public.historical_edge_picks e
JOIN public.historical_games g ON e.game_id = g.id
GROUP BY home_team_id, away_team_id, sport;

CREATE INDEX IF NOT EXISTS idx_mv_tvt_home_away ON public.mv_team_vs_team_summary(home_team_id, away_team_id);
GRANT SELECT ON public.mv_team_vs_team_summary TO authenticated, anon;

-- 8) Backfill helper: placeholder function (run once after teams created)
-- NOTE: This is a helper snippet for manual use — DO NOT run automatically in a production migration without review
-- UPDATE public.historical_games SET home_team_id = t.id
-- FROM public.teams t WHERE public.historical_games.home_team = t.team_name AND public.historical_games.sport = t.sport;

-- 9) Refresh recommendations (call after backfill/import)
-- REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_game_edges;
-- REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_team_vs_team_summary;

COMMIT;
