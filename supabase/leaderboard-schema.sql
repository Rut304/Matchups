-- ===========================================
-- LEADERBOARD & CAPPER TRACKING SYSTEM
-- ===========================================

-- Cappers (TV personalities, sharps, community members)
CREATE TABLE public.cappers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL, -- URL-friendly identifier
  name TEXT NOT NULL,
  avatar_emoji TEXT DEFAULT '🎯',
  avatar_url TEXT,
  verified BOOLEAN DEFAULT FALSE,
  
  -- Type classification
  capper_type TEXT NOT NULL CHECK (capper_type IN ('celebrity', 'pro', 'community', 'ai')),
  
  -- Platform/Network info (for celebrities)
  network TEXT, -- ESPN, FOX, TNT, CBS, FS1, Podcast, etc.
  role TEXT, -- "First Take Host", "NFL Analyst", etc.
  
  -- Social/Following
  twitter_handle TEXT,
  followers_count TEXT, -- "6.2M", "245K" etc.
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  is_featured BOOLEAN DEFAULT FALSE, -- Show on homepage
  
  -- Bio & Notes
  bio TEXT,
  admin_notes TEXT, -- Internal notes for admins
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_cappers_slug ON public.cappers(slug);
CREATE INDEX idx_cappers_type ON public.cappers(capper_type);
CREATE INDEX idx_cappers_network ON public.cappers(network);
CREATE INDEX idx_cappers_active ON public.cappers(is_active) WHERE is_active = TRUE;

-- ===========================================
-- PICKS & WAGERS
-- ===========================================

-- Bet types
CREATE TYPE bet_type AS ENUM (
  'spread',      -- Against the spread
  'moneyline',   -- Straight up winner
  'over_under',  -- Total points
  'prop',        -- Player/team props
  'parlay',      -- Multiple legs
  'teaser',      -- Adjusted spreads
  'futures'      -- Season-long bets
);

-- Individual picks/wagers
CREATE TABLE public.picks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  capper_id UUID REFERENCES public.cappers(id) ON DELETE CASCADE NOT NULL,
  
  -- Game reference (optional - some picks may be futures/props not tied to specific game)
  game_id UUID REFERENCES public.games(id) ON DELETE SET NULL,
  
  -- Sport & Event
  sport TEXT NOT NULL CHECK (sport IN ('NFL', 'NBA', 'NHL', 'MLB', 'NCAAF', 'NCAAB', 'Soccer', 'Other')),
  event_name TEXT, -- For futures/props: "Super Bowl Winner", "NFL MVP"
  
  -- Pick details
  bet_type bet_type NOT NULL,
  pick_description TEXT NOT NULL, -- "Chiefs -3.5", "LeBron O 25.5 pts", "KC/SF Parlay"
  
  -- For spread bets
  team_picked TEXT, -- Team abbreviation
  spread_line DECIMAL(5,2), -- The spread at time of pick
  
  -- For moneyline
  moneyline_odds INTEGER, -- -150, +200, etc.
  
  -- For over/under
  total_line DECIMAL(5,2),
  over_under TEXT CHECK (over_under IN ('over', 'under')),
  
  -- For props
  prop_type TEXT, -- "player_points", "player_yards", "team_total", etc.
  prop_player TEXT,
  prop_line DECIMAL(6,2),
  
  -- For parlays/teasers
  parlay_legs JSONB, -- Array of leg details
  parlay_odds INTEGER, -- Combined odds
  
  -- Unit sizing (1-5 typically, or custom)
  units DECIMAL(4,2) DEFAULT 1.0,
  
  -- Timing
  picked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), -- When pick was made public
  game_date DATE,
  
  -- Odds at time of pick
  odds_at_pick INTEGER, -- -110, +150, etc.
  
  -- Source of pick
  source_url TEXT, -- Link to tweet, show clip, article
  source_type TEXT CHECK (source_type IN ('tv', 'podcast', 'twitter', 'article', 'manual', 'other')),
  
  -- Result
  result TEXT CHECK (result IN ('win', 'loss', 'push', 'pending', 'void')),
  result_notes TEXT,
  settled_at TIMESTAMPTZ,
  
  -- Verification
  verified_by UUID REFERENCES auth.users(id),
  verified_at TIMESTAMPTZ,
  
  -- Admin
  admin_notes TEXT,
  is_hidden BOOLEAN DEFAULT FALSE, -- Hide disputed picks
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_picks_capper ON public.picks(capper_id);
CREATE INDEX idx_picks_sport ON public.picks(sport);
CREATE INDEX idx_picks_bet_type ON public.picks(bet_type);
CREATE INDEX idx_picks_result ON public.picks(result);
CREATE INDEX idx_picks_game ON public.picks(game_id);
CREATE INDEX idx_picks_date ON public.picks(picked_at);
CREATE INDEX idx_picks_capper_sport ON public.picks(capper_id, sport);
CREATE INDEX idx_picks_capper_type ON public.picks(capper_id, bet_type);

-- ===========================================
-- CAPPER STATISTICS (Materialized/Cached)
-- ===========================================

-- Overall stats per capper (refreshed periodically)
CREATE TABLE public.capper_stats (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  capper_id UUID REFERENCES public.cappers(id) ON DELETE CASCADE UNIQUE NOT NULL,
  
  -- Overall record
  total_picks INTEGER DEFAULT 0,
  total_wins INTEGER DEFAULT 0,
  total_losses INTEGER DEFAULT 0,
  total_pushes INTEGER DEFAULT 0,
  win_percentage DECIMAL(5,2) DEFAULT 0,
  
  -- Units tracking
  total_units_wagered DECIMAL(10,2) DEFAULT 0,
  total_units_won DECIMAL(10,2) DEFAULT 0,
  net_units DECIMAL(10,2) DEFAULT 0,
  roi_percentage DECIMAL(6,2) DEFAULT 0,
  
  -- Streaks
  current_streak TEXT, -- "W5", "L3"
  best_streak TEXT,
  worst_streak TEXT,
  
  -- Ranking
  overall_rank INTEGER,
  previous_rank INTEGER,
  rank_change INTEGER DEFAULT 0,
  
  -- Activity
  last_pick_at TIMESTAMPTZ,
  picks_this_week INTEGER DEFAULT 0,
  picks_this_month INTEGER DEFAULT 0,
  
  -- Computed at
  computed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_capper_stats_rank ON public.capper_stats(overall_rank);
CREATE INDEX idx_capper_stats_units ON public.capper_stats(net_units DESC);

-- Stats broken down by sport
CREATE TABLE public.capper_stats_by_sport (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  capper_id UUID REFERENCES public.cappers(id) ON DELETE CASCADE NOT NULL,
  sport TEXT NOT NULL CHECK (sport IN ('NFL', 'NBA', 'NHL', 'MLB', 'NCAAF', 'NCAAB', 'Soccer', 'Other')),
  
  -- Record
  total_picks INTEGER DEFAULT 0,
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  pushes INTEGER DEFAULT 0,
  win_percentage DECIMAL(5,2) DEFAULT 0,
  
  -- Units
  net_units DECIMAL(10,2) DEFAULT 0,
  roi_percentage DECIMAL(6,2) DEFAULT 0,
  
  computed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(capper_id, sport)
);

CREATE INDEX idx_capper_stats_sport_capper ON public.capper_stats_by_sport(capper_id);

-- Stats broken down by bet type
CREATE TABLE public.capper_stats_by_bet_type (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  capper_id UUID REFERENCES public.cappers(id) ON DELETE CASCADE NOT NULL,
  bet_type bet_type NOT NULL,
  
  -- Record
  total_picks INTEGER DEFAULT 0,
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  pushes INTEGER DEFAULT 0,
  win_percentage DECIMAL(5,2) DEFAULT 0,
  
  -- Units
  net_units DECIMAL(10,2) DEFAULT 0,
  roi_percentage DECIMAL(6,2) DEFAULT 0,
  
  computed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(capper_id, bet_type)
);

CREATE INDEX idx_capper_stats_bet_type_capper ON public.capper_stats_by_bet_type(capper_id);

-- ===========================================
-- ADMIN / AUDIT
-- ===========================================

-- Record modifications (audit trail)
CREATE TABLE public.record_modifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  capper_id UUID REFERENCES public.cappers(id) ON DELETE CASCADE,
  pick_id UUID REFERENCES public.picks(id) ON DELETE SET NULL,
  
  modification_type TEXT NOT NULL CHECK (modification_type IN ('add_pick', 'edit_pick', 'delete_pick', 'change_result', 'bulk_update', 'manual_adjustment')),
  
  -- What changed
  field_changed TEXT,
  old_value TEXT,
  new_value TEXT,
  
  -- Why
  reason TEXT,
  
  -- Who
  modified_by UUID REFERENCES auth.users(id),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_record_mods_capper ON public.record_modifications(capper_id);
CREATE INDEX idx_record_mods_pick ON public.record_modifications(pick_id);

-- ===========================================
-- VIEWS FOR EASY QUERYING
-- ===========================================

-- Leaderboard view (ranked cappers)
CREATE OR REPLACE VIEW public.leaderboard AS
SELECT 
  c.id,
  c.slug,
  c.name,
  c.avatar_emoji,
  c.avatar_url,
  c.verified,
  c.capper_type,
  c.network,
  c.role,
  c.followers_count,
  cs.total_picks,
  cs.total_wins,
  cs.total_losses,
  cs.total_pushes,
  cs.win_percentage,
  cs.net_units,
  cs.roi_percentage,
  cs.current_streak,
  cs.overall_rank,
  cs.rank_change,
  cs.last_pick_at
FROM public.cappers c
LEFT JOIN public.capper_stats cs ON c.id = cs.capper_id
WHERE c.is_active = TRUE
ORDER BY cs.net_units DESC NULLS LAST;

-- ===========================================
-- FUNCTIONS FOR STATS COMPUTATION
-- ===========================================

-- Function to recalculate capper stats
CREATE OR REPLACE FUNCTION compute_capper_stats(p_capper_id UUID)
RETURNS void AS $$
DECLARE
  v_wins INTEGER;
  v_losses INTEGER;
  v_pushes INTEGER;
  v_total INTEGER;
  v_units_won DECIMAL;
  v_units_wagered DECIMAL;
  v_streak TEXT;
BEGIN
  -- Calculate overall stats
  SELECT 
    COUNT(*) FILTER (WHERE result = 'win'),
    COUNT(*) FILTER (WHERE result = 'loss'),
    COUNT(*) FILTER (WHERE result = 'push'),
    COUNT(*) FILTER (WHERE result IN ('win', 'loss', 'push')),
    COALESCE(SUM(CASE 
      WHEN result = 'win' THEN units * (CASE WHEN odds_at_pick > 0 THEN odds_at_pick::decimal/100 ELSE 100.0/ABS(odds_at_pick) END)
      WHEN result = 'loss' THEN -units
      ELSE 0 
    END), 0),
    COALESCE(SUM(units) FILTER (WHERE result IN ('win', 'loss')), 0)
  INTO v_wins, v_losses, v_pushes, v_total, v_units_won, v_units_wagered
  FROM public.picks
  WHERE capper_id = p_capper_id AND result IS NOT NULL;
  
  -- Calculate current streak
  SELECT 
    CASE 
      WHEN result = 'win' THEN 'W' || COUNT(*)
      WHEN result = 'loss' THEN 'L' || COUNT(*)
      ELSE 'P' || COUNT(*)
    END
  INTO v_streak
  FROM (
    SELECT result, 
           SUM(CASE WHEN result != LAG(result) OVER (ORDER BY picked_at DESC) THEN 1 ELSE 0 END) OVER (ORDER BY picked_at DESC) as grp
    FROM public.picks 
    WHERE capper_id = p_capper_id AND result IN ('win', 'loss', 'push')
    ORDER BY picked_at DESC
  ) sub
  WHERE grp = 0
  GROUP BY result
  LIMIT 1;
  
  -- Upsert stats
  INSERT INTO public.capper_stats (
    capper_id, total_picks, total_wins, total_losses, total_pushes,
    win_percentage, total_units_wagered, total_units_won, net_units, roi_percentage,
    current_streak, computed_at
  ) VALUES (
    p_capper_id, v_total, v_wins, v_losses, v_pushes,
    CASE WHEN (v_wins + v_losses) > 0 THEN ROUND(v_wins::decimal / (v_wins + v_losses) * 100, 1) ELSE 0 END,
    v_units_wagered, v_units_won, ROUND(v_units_won, 1),
    CASE WHEN v_units_wagered > 0 THEN ROUND(v_units_won / v_units_wagered * 100, 1) ELSE 0 END,
    COALESCE(v_streak, 'N/A'), NOW()
  )
  ON CONFLICT (capper_id) DO UPDATE SET
    total_picks = EXCLUDED.total_picks,
    total_wins = EXCLUDED.total_wins,
    total_losses = EXCLUDED.total_losses,
    total_pushes = EXCLUDED.total_pushes,
    win_percentage = EXCLUDED.win_percentage,
    total_units_wagered = EXCLUDED.total_units_wagered,
    total_units_won = EXCLUDED.total_units_won,
    net_units = EXCLUDED.net_units,
    roi_percentage = EXCLUDED.roi_percentage,
    current_streak = EXCLUDED.current_streak,
    computed_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Trigger to update stats when picks change
CREATE OR REPLACE FUNCTION trigger_update_capper_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM compute_capper_stats(OLD.capper_id);
    RETURN OLD;
  ELSE
    PERFORM compute_capper_stats(NEW.capper_id);
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER picks_stats_update
AFTER INSERT OR UPDATE OR DELETE ON public.picks
FOR EACH ROW EXECUTE FUNCTION trigger_update_capper_stats();

-- ===========================================
-- ROW LEVEL SECURITY
-- ===========================================

ALTER TABLE public.cappers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.picks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.capper_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.capper_stats_by_sport ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.capper_stats_by_bet_type ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.record_modifications ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Public can view cappers" ON public.cappers FOR SELECT USING (is_active = TRUE);
CREATE POLICY "Public can view picks" ON public.picks FOR SELECT USING (is_hidden = FALSE);
CREATE POLICY "Public can view stats" ON public.capper_stats FOR SELECT USING (TRUE);
CREATE POLICY "Public can view sport stats" ON public.capper_stats_by_sport FOR SELECT USING (TRUE);
CREATE POLICY "Public can view bet type stats" ON public.capper_stats_by_bet_type FOR SELECT USING (TRUE);

-- Admin write access (using custom claim or role)
CREATE POLICY "Admins can manage cappers" ON public.cappers FOR ALL USING (
  auth.jwt() ->> 'role' = 'admin' OR auth.jwt() -> 'user_metadata' ->> 'is_admin' = 'true'
);
CREATE POLICY "Admins can manage picks" ON public.picks FOR ALL USING (
  auth.jwt() ->> 'role' = 'admin' OR auth.jwt() -> 'user_metadata' ->> 'is_admin' = 'true'
);
CREATE POLICY "Admins can view modifications" ON public.record_modifications FOR SELECT USING (
  auth.jwt() ->> 'role' = 'admin' OR auth.jwt() -> 'user_metadata' ->> 'is_admin' = 'true'
);
