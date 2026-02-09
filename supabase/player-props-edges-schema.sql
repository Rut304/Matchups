-- =============================================================================
-- PLAYER STATS & PROP EDGES SCHEMA
-- Stores player statistics and detected edges vs prop lines
-- =============================================================================

-- =============================================================================
-- PLAYER STATS CACHE - Aggregated player statistics
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.player_stats_cache (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  player_id TEXT NOT NULL,
  player_name TEXT NOT NULL,
  team TEXT,
  position TEXT,
  sport TEXT NOT NULL,
  
  -- Aggregated stats
  season_avg JSONB DEFAULT '{}',
  last_5_avg JSONB DEFAULT '{}',
  last_10_avg JSONB DEFAULT '{}',
  games_played INTEGER DEFAULT 0,
  
  -- Recent game log for quick access
  game_log JSONB DEFAULT '[]',
  
  -- Metadata
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(player_id, sport)
);

CREATE INDEX IF NOT EXISTS idx_stats_cache_player ON public.player_stats_cache(player_id);
CREATE INDEX IF NOT EXISTS idx_stats_cache_sport ON public.player_stats_cache(sport);
CREATE INDEX IF NOT EXISTS idx_stats_cache_team ON public.player_stats_cache(team);

-- =============================================================================
-- PLAYER PROP EDGES - Props where stats suggest value
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.player_prop_edges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  game_id TEXT NOT NULL,
  sport TEXT NOT NULL,
  player_id TEXT NOT NULL,
  player_name TEXT NOT NULL,
  team TEXT,
  position TEXT,
  
  -- Prop details
  prop_type TEXT NOT NULL, -- 'points', 'passing_yards', 'goals', etc.
  line DECIMAL(6,2) NOT NULL,
  
  -- Best lines across books
  best_over_odds INTEGER,
  best_under_odds INTEGER,
  best_over_book TEXT,
  best_under_book TEXT,
  
  -- Player stats
  season_avg DECIMAL(8,2),
  last_5_avg DECIMAL(8,2),
  last_10_avg DECIMAL(8,2),
  hit_rate_season DECIMAL(5,2), -- % of games hitting over
  hit_rate_last_5 DECIMAL(5,2),
  
  -- Edge analysis
  edge TEXT CHECK (edge IN ('over', 'under', 'none')),
  edge_percent DECIMAL(5,2), -- How much avg exceeds/trails line
  confidence INTEGER CHECK (confidence >= 0 AND confidence <= 100),
  factors TEXT[] DEFAULT '{}',
  
  -- Metadata
  collected_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(game_id, player_id, prop_type)
);

CREATE INDEX IF NOT EXISTS idx_prop_edges_sport ON public.player_prop_edges(sport);
CREATE INDEX IF NOT EXISTS idx_prop_edges_edge ON public.player_prop_edges(edge) WHERE edge != 'none';
CREATE INDEX IF NOT EXISTS idx_prop_edges_confidence ON public.player_prop_edges(confidence DESC);
CREATE INDEX IF NOT EXISTS idx_prop_edges_game ON public.player_prop_edges(game_id);
CREATE INDEX IF NOT EXISTS idx_prop_edges_date ON public.player_prop_edges(collected_at DESC);

-- =============================================================================
-- PLAYER PROP HISTORY - Track prop results for backtesting
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.player_prop_results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  game_id TEXT NOT NULL,
  sport TEXT NOT NULL,
  player_id TEXT NOT NULL,
  player_name TEXT NOT NULL,
  
  -- Prop details
  prop_type TEXT NOT NULL,
  line DECIMAL(6,2) NOT NULL,
  
  -- Actual performance
  actual_value DECIMAL(8,2),
  result TEXT CHECK (result IN ('over', 'under', 'push')),
  
  -- Edge prediction (if we had one)
  predicted_edge TEXT,
  edge_confidence INTEGER,
  
  -- Metadata
  game_date DATE NOT NULL,
  season INTEGER,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(game_id, player_id, prop_type)
);

CREATE INDEX IF NOT EXISTS idx_prop_results_player ON public.player_prop_results(player_id);
CREATE INDEX IF NOT EXISTS idx_prop_results_sport ON public.player_prop_results(sport, game_date);
CREATE INDEX IF NOT EXISTS idx_prop_results_predicted ON public.player_prop_results(predicted_edge) WHERE predicted_edge IS NOT NULL;

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE public.player_stats_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_prop_edges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_prop_results ENABLE ROW LEVEL SECURITY;

-- Public read policies (drop first to avoid conflicts)
DROP POLICY IF EXISTS "Public read player_stats_cache" ON public.player_stats_cache;
DROP POLICY IF EXISTS "Public read player_prop_edges" ON public.player_prop_edges;
DROP POLICY IF EXISTS "Public read player_prop_results" ON public.player_prop_results;

CREATE POLICY "Public read player_stats_cache" ON public.player_stats_cache FOR SELECT USING (true);
CREATE POLICY "Public read player_prop_edges" ON public.player_prop_edges FOR SELECT USING (true);
CREATE POLICY "Public read player_prop_results" ON public.player_prop_results FOR SELECT USING (true);

-- Service write policies (for crons)
DROP POLICY IF EXISTS "Service write player_stats_cache" ON public.player_stats_cache;
DROP POLICY IF EXISTS "Service write player_prop_edges" ON public.player_prop_edges;
DROP POLICY IF EXISTS "Service write player_prop_results" ON public.player_prop_results;

CREATE POLICY "Service write player_stats_cache" ON public.player_stats_cache FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service write player_prop_edges" ON public.player_prop_edges FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service write player_prop_results" ON public.player_prop_results FOR ALL USING (true) WITH CHECK (true);

-- =============================================================================
-- USEFUL VIEWS
-- =============================================================================

-- View: Today's top edges
CREATE OR REPLACE VIEW public.v_todays_prop_edges AS
SELECT 
  sport,
  player_name,
  team,
  prop_type,
  line,
  season_avg,
  last_5_avg,
  hit_rate_season,
  edge,
  edge_percent,
  confidence,
  best_over_odds,
  best_under_odds,
  best_over_book,
  best_under_book,
  factors
FROM public.player_prop_edges
WHERE collected_at::date = CURRENT_DATE
  AND edge != 'none'
ORDER BY confidence DESC, edge_percent DESC;

-- View: Edge performance tracking (how accurate are our edges)
CREATE OR REPLACE VIEW public.v_edge_performance AS
SELECT 
  sport,
  prop_type,
  predicted_edge,
  COUNT(*) as total_picks,
  SUM(CASE WHEN result = predicted_edge THEN 1 ELSE 0 END) as correct,
  ROUND(
    SUM(CASE WHEN result = predicted_edge THEN 1 ELSE 0 END)::DECIMAL / COUNT(*) * 100, 
    1
  ) as hit_rate
FROM public.player_prop_results
WHERE predicted_edge IS NOT NULL
GROUP BY sport, prop_type, predicted_edge
ORDER BY sport, hit_rate DESC;

-- =============================================================================
-- GRANTS
-- =============================================================================

GRANT SELECT ON public.player_stats_cache TO authenticated, anon;
GRANT SELECT ON public.player_prop_edges TO authenticated, anon;
GRANT SELECT ON public.player_prop_results TO authenticated, anon;
GRANT SELECT ON public.v_todays_prop_edges TO authenticated, anon;
GRANT SELECT ON public.v_edge_performance TO authenticated, anon;

-- =============================================================================
-- SAMPLE INSERT (for testing)
-- =============================================================================

-- Example edge: LeBron averaging 27.5 PPG but line is 24.5
/*
INSERT INTO public.player_prop_edges (
  game_id, sport, player_id, player_name, team, position,
  prop_type, line,
  best_over_odds, best_under_odds, best_over_book, best_under_book,
  season_avg, last_5_avg, last_10_avg, hit_rate_season, hit_rate_last_5,
  edge, edge_percent, confidence, factors
) VALUES (
  '401705123', 'NBA', '1966', 'LeBron James', 'LAL', 'SF',
  'points', 24.5,
  -115, -105, 'fanduel', 'draftkings',
  27.5, 29.2, 28.1, 72.0, 80.0,
  'over', 12.2, 82,
  ARRAY['Season avg 27.5 exceeds line 24.5 by 12%', 'Hot streak: L5 avg 29.2 > season 27.5', 'Strong over hit rate: 72%']
);
*/
