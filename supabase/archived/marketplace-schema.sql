-- Matchups System Marketplace Schema
-- Extension to main schema for user systems and marketplace functionality

-- ===========================================
-- USER SYSTEMS (Personal Saved Systems)
-- ===========================================

-- User created/saved betting systems
CREATE TABLE IF NOT EXISTS public.user_systems (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  sport TEXT NOT NULL CHECK (sport IN ('NFL', 'NBA', 'NHL', 'MLB', 'NCAAF', 'NCAAB', 'ALL')),
  bet_type TEXT NOT NULL CHECK (bet_type IN ('spread', 'total', 'moneyline', 'prop', 'mixed')),
  
  -- System definition
  criteria TEXT[] DEFAULT '{}', -- Array of criteria descriptions
  custom_prompt TEXT, -- Original query/prompt if from AI
  situation_filters JSONB DEFAULT '{}', -- Structured filters
  
  -- Performance tracking
  stats JSONB DEFAULT '{
    "record": "0-0-0",
    "wins": 0,
    "losses": 0,
    "pushes": 0,
    "winPct": 0,
    "roi": 0,
    "units": 0,
    "avgOdds": -110,
    "clv": 0,
    "maxDrawdown": 0,
    "sharpeRatio": 0,
    "kellyPct": 0
  }'::jsonb,
  
  -- Backtest data
  backtest_results JSONB DEFAULT '{}',
  backtest_completed_at TIMESTAMPTZ,
  
  -- Status flags
  is_active BOOLEAN DEFAULT true,
  is_public BOOLEAN DEFAULT false,
  is_verified BOOLEAN DEFAULT false, -- Admin verified
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_user_systems_user ON public.user_systems(user_id);
CREATE INDEX idx_user_systems_sport ON public.user_systems(sport);
CREATE INDEX idx_user_systems_public ON public.user_systems(is_public) WHERE is_public = true;

-- System picks/bets tracking
CREATE TABLE IF NOT EXISTS public.system_picks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  system_id UUID REFERENCES public.user_systems(id) ON DELETE CASCADE,
  game_id UUID REFERENCES public.games(id),
  pick_type TEXT NOT NULL,
  pick_value TEXT NOT NULL,
  odds INTEGER,
  result TEXT CHECK (result IN ('win', 'loss', 'push', 'pending', 'void')),
  picked_at TIMESTAMPTZ DEFAULT NOW(),
  settled_at TIMESTAMPTZ
);

CREATE INDEX idx_system_picks_system ON public.system_picks(system_id);
CREATE INDEX idx_system_picks_result ON public.system_picks(result);

-- ===========================================
-- SYSTEM MARKETPLACE
-- ===========================================

-- Published systems available for copying/purchasing
CREATE TABLE IF NOT EXISTS public.marketplace_listings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  system_id UUID REFERENCES public.user_systems(id) ON DELETE CASCADE UNIQUE,
  creator_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- Listing details
  title TEXT NOT NULL,
  short_description TEXT NOT NULL,
  full_description TEXT,
  preview_image_url TEXT,
  tags TEXT[] DEFAULT '{}',
  
  -- Pricing (for future monetization)
  is_free BOOLEAN DEFAULT true,
  price_cents INTEGER DEFAULT 0,
  subscription_required TEXT CHECK (subscription_required IN ('free', 'pro', 'premium')),
  
  -- Quality metrics (verified from system_picks)
  total_picks INTEGER DEFAULT 0,
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  pushes INTEGER DEFAULT 0,
  win_rate DECIMAL(5,2) DEFAULT 0,
  roi DECIMAL(8,2) DEFAULT 0,
  avg_odds INTEGER DEFAULT -110,
  streak INTEGER DEFAULT 0, -- Current streak (+/-)
  longest_win_streak INTEGER DEFAULT 0,
  
  -- Engagement metrics
  copies_count INTEGER DEFAULT 0,
  views_count INTEGER DEFAULT 0,
  likes_count INTEGER DEFAULT 0,
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'rejected', 'suspended')),
  rejection_reason TEXT,
  
  -- Featured/promoted
  is_featured BOOLEAN DEFAULT false,
  featured_at TIMESTAMPTZ,
  
  -- Timestamps
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Quality gate constraints
  -- System must have at least 5 tracked picks with 52%+ win rate to be published
  CONSTRAINT quality_gate_min_picks CHECK (total_picks >= 5),
  CONSTRAINT quality_gate_min_winrate CHECK (win_rate >= 52.0)
);

CREATE INDEX idx_marketplace_status ON public.marketplace_listings(status);
CREATE INDEX idx_marketplace_creator ON public.marketplace_listings(creator_id);
CREATE INDEX idx_marketplace_sport ON public.marketplace_listings USING GIN (tags);
CREATE INDEX idx_marketplace_winrate ON public.marketplace_listings(win_rate DESC) WHERE status = 'active';
CREATE INDEX idx_marketplace_roi ON public.marketplace_listings(roi DESC) WHERE status = 'active';
CREATE INDEX idx_marketplace_copies ON public.marketplace_listings(copies_count DESC) WHERE status = 'active';

-- User interactions with marketplace listings
CREATE TABLE IF NOT EXISTS public.marketplace_interactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  listing_id UUID REFERENCES public.marketplace_listings(id) ON DELETE CASCADE,
  interaction_type TEXT NOT NULL CHECK (interaction_type IN ('view', 'like', 'copy', 'purchase')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, listing_id, interaction_type)
);

CREATE INDEX idx_marketplace_interactions_user ON public.marketplace_interactions(user_id);
CREATE INDEX idx_marketplace_interactions_listing ON public.marketplace_interactions(listing_id);

-- System copies (when user copies a marketplace system)
CREATE TABLE IF NOT EXISTS public.system_copies (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  original_system_id UUID REFERENCES public.user_systems(id) ON DELETE SET NULL,
  original_listing_id UUID REFERENCES public.marketplace_listings(id) ON DELETE SET NULL,
  copied_system_id UUID REFERENCES public.user_systems(id) ON DELETE CASCADE,
  copier_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_system_copies_original ON public.system_copies(original_system_id);
CREATE INDEX idx_system_copies_copier ON public.system_copies(copier_id);

-- ===========================================
-- ROW LEVEL SECURITY
-- ===========================================

ALTER TABLE public.user_systems ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_picks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_copies ENABLE ROW LEVEL SECURITY;

-- User systems: Own systems or public ones
CREATE POLICY "Users can view own systems"
  ON public.user_systems FOR SELECT
  USING (auth.uid() = user_id OR is_public = true);

CREATE POLICY "Users can insert own systems"
  ON public.user_systems FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own systems"
  ON public.user_systems FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own systems"
  ON public.user_systems FOR DELETE
  USING (auth.uid() = user_id);

-- System picks: Only owner can see/modify
CREATE POLICY "Users can view own system picks"
  ON public.system_picks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_systems 
      WHERE id = system_picks.system_id 
      AND (user_id = auth.uid() OR is_public = true)
    )
  );

CREATE POLICY "Users can insert own system picks"
  ON public.system_picks FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_systems 
      WHERE id = system_picks.system_id 
      AND user_id = auth.uid()
    )
  );

-- Marketplace: Public read, owner manage
CREATE POLICY "Anyone can view active marketplace listings"
  ON public.marketplace_listings FOR SELECT
  USING (status = 'active' OR creator_id = auth.uid());

CREATE POLICY "Users can create listings for own systems"
  ON public.marketplace_listings FOR INSERT
  WITH CHECK (
    auth.uid() = creator_id AND
    EXISTS (
      SELECT 1 FROM public.user_systems 
      WHERE id = marketplace_listings.system_id 
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own listings"
  ON public.marketplace_listings FOR UPDATE
  USING (auth.uid() = creator_id);

CREATE POLICY "Users can delete own listings"
  ON public.marketplace_listings FOR DELETE
  USING (auth.uid() = creator_id);

-- Marketplace interactions: User's own
CREATE POLICY "Users can view own interactions"
  ON public.marketplace_interactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own interactions"
  ON public.marketplace_interactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- System copies: User's own
CREATE POLICY "Users can view own copies"
  ON public.system_copies FOR SELECT
  USING (auth.uid() = copier_id);

CREATE POLICY "Users can create own copies"
  ON public.system_copies FOR INSERT
  WITH CHECK (auth.uid() = copier_id);

-- ===========================================
-- FUNCTIONS
-- ===========================================

-- Function to update system stats from picks
CREATE OR REPLACE FUNCTION public.update_system_stats()
RETURNS TRIGGER AS $$
DECLARE
  v_wins INTEGER;
  v_losses INTEGER;
  v_pushes INTEGER;
  v_total INTEGER;
  v_win_pct DECIMAL(5,2);
BEGIN
  -- Calculate new stats
  SELECT 
    COUNT(*) FILTER (WHERE result = 'win'),
    COUNT(*) FILTER (WHERE result = 'loss'),
    COUNT(*) FILTER (WHERE result = 'push'),
    COUNT(*) FILTER (WHERE result IN ('win', 'loss', 'push'))
  INTO v_wins, v_losses, v_pushes, v_total
  FROM public.system_picks
  WHERE system_id = COALESCE(NEW.system_id, OLD.system_id)
  AND result IS NOT NULL;
  
  -- Calculate win percentage (wins / (wins + losses))
  IF (v_wins + v_losses) > 0 THEN
    v_win_pct := (v_wins::DECIMAL / (v_wins + v_losses)) * 100;
  ELSE
    v_win_pct := 0;
  END IF;
  
  -- Update the system stats
  UPDATE public.user_systems
  SET stats = jsonb_set(
    jsonb_set(
      jsonb_set(
        jsonb_set(
          stats,
          '{wins}', to_jsonb(v_wins)
        ),
        '{losses}', to_jsonb(v_losses)
      ),
      '{pushes}', to_jsonb(v_pushes)
    ),
    '{winPct}', to_jsonb(v_win_pct)
  ),
  updated_at = NOW()
  WHERE id = COALESCE(NEW.system_id, OLD.system_id);
  
  -- Also update marketplace listing if exists
  UPDATE public.marketplace_listings
  SET 
    wins = v_wins,
    losses = v_losses,
    pushes = v_pushes,
    total_picks = v_total,
    win_rate = v_win_pct,
    updated_at = NOW()
  WHERE system_id = COALESCE(NEW.system_id, OLD.system_id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update stats on pick changes
CREATE TRIGGER update_system_stats_on_pick
  AFTER INSERT OR UPDATE OF result OR DELETE ON public.system_picks
  FOR EACH ROW EXECUTE FUNCTION public.update_system_stats();

-- Function to increment marketplace metrics
CREATE OR REPLACE FUNCTION public.increment_marketplace_metric(
  p_listing_id UUID,
  p_metric TEXT
)
RETURNS VOID AS $$
BEGIN
  CASE p_metric
    WHEN 'views' THEN
      UPDATE public.marketplace_listings 
      SET views_count = views_count + 1 
      WHERE id = p_listing_id;
    WHEN 'copies' THEN
      UPDATE public.marketplace_listings 
      SET copies_count = copies_count + 1 
      WHERE id = p_listing_id;
    WHEN 'likes' THEN
      UPDATE public.marketplace_listings 
      SET likes_count = likes_count + 1 
      WHERE id = p_listing_id;
  END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for updated_at
CREATE TRIGGER update_user_systems_updated_at
  BEFORE UPDATE ON public.user_systems
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_marketplace_listings_updated_at
  BEFORE UPDATE ON public.marketplace_listings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ===========================================
-- VIEWS
-- ===========================================

-- View: Active marketplace listings with creator info
CREATE OR REPLACE VIEW public.marketplace_listings_view AS
SELECT 
  ml.*,
  p.username AS creator_username,
  p.avatar_url AS creator_avatar,
  us.sport,
  us.bet_type,
  us.criteria
FROM public.marketplace_listings ml
JOIN public.profiles p ON ml.creator_id = p.id
JOIN public.user_systems us ON ml.system_id = us.id
WHERE ml.status = 'active';

-- View: Top performing marketplace systems
CREATE OR REPLACE VIEW public.top_marketplace_systems AS
SELECT *
FROM public.marketplace_listings_view
ORDER BY 
  (win_rate * 0.4) + (roi * 0.3) + (copies_count * 0.2) + (CASE WHEN is_featured THEN 10 ELSE 0 END) DESC
LIMIT 50;

-- View: User's marketplace dashboard
CREATE OR REPLACE VIEW public.user_marketplace_stats AS
SELECT 
  creator_id,
  COUNT(*) AS total_listings,
  SUM(copies_count) AS total_copies,
  SUM(views_count) AS total_views,
  SUM(likes_count) AS total_likes,
  AVG(win_rate) AS avg_win_rate,
  AVG(roi) AS avg_roi
FROM public.marketplace_listings
WHERE status = 'active'
GROUP BY creator_id;
