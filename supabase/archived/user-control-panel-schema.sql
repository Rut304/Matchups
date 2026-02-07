-- User Control Panel Schema
-- Extended tables for tracking games, players, teams, and trends

-- ===========================================
-- USER FAVORITE PLAYERS
-- ===========================================

CREATE TABLE IF NOT EXISTS public.user_favorite_players (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  sport TEXT NOT NULL CHECK (sport IN ('NFL', 'NBA', 'NHL', 'MLB', 'NCAAF', 'NCAAB')),
  player_id TEXT NOT NULL, -- External ID from ESPN/API
  player_name TEXT NOT NULL,
  team_id TEXT,
  team_name TEXT,
  position TEXT,
  jersey_number TEXT,
  headshot_url TEXT,
  notifications_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, sport, player_id)
);

CREATE INDEX idx_user_favorite_players_user ON public.user_favorite_players(user_id);
CREATE INDEX idx_user_favorite_players_sport ON public.user_favorite_players(sport);

-- ===========================================
-- USER FOLLOWED GAMES
-- ===========================================

CREATE TABLE IF NOT EXISTS public.user_followed_games (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  sport TEXT NOT NULL CHECK (sport IN ('NFL', 'NBA', 'NHL', 'MLB', 'NCAAF', 'NCAAB')),
  game_id TEXT NOT NULL, -- External ID from ESPN/API
  home_team_name TEXT NOT NULL,
  away_team_name TEXT NOT NULL,
  home_team_logo TEXT,
  away_team_logo TEXT,
  scheduled_at TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'scheduled',
  notifications_enabled BOOLEAN DEFAULT true,
  bet_placed BOOLEAN DEFAULT false,
  bet_details JSONB, -- { type, selection, odds, stake }
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, game_id)
);

CREATE INDEX idx_user_followed_games_user ON public.user_followed_games(user_id);
CREATE INDEX idx_user_followed_games_date ON public.user_followed_games(scheduled_at);
CREATE INDEX idx_user_followed_games_status ON public.user_followed_games(status);

-- ===========================================
-- USER ALERTS / NOTIFICATIONS
-- ===========================================

CREATE TABLE IF NOT EXISTS public.user_alerts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  alert_type TEXT NOT NULL CHECK (alert_type IN ('game_start', 'line_move', 'injury', 'score_update', 'system_hit', 'player_news')),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('game', 'team', 'player', 'system')),
  entity_id TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_user_alerts_user ON public.user_alerts(user_id);
CREATE INDEX idx_user_alerts_read ON public.user_alerts(user_id, is_read);
CREATE INDEX idx_user_alerts_created ON public.user_alerts(created_at DESC);

-- ===========================================
-- SITE SETTINGS (Admin controlled)
-- ===========================================

-- Add marketplace settings to existing site_settings if not exists
DO $$
BEGIN
  -- Add marketplace columns if they don't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'site_settings' AND column_name = 'marketplace_enabled') THEN
    ALTER TABLE public.site_settings ADD COLUMN marketplace_enabled BOOLEAN DEFAULT true;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'site_settings' AND column_name = 'marketplace_monetization_enabled') THEN
    ALTER TABLE public.site_settings ADD COLUMN marketplace_monetization_enabled BOOLEAN DEFAULT false;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'site_settings' AND column_name = 'marketplace_min_win_rate') THEN
    ALTER TABLE public.site_settings ADD COLUMN marketplace_min_win_rate DECIMAL(5,2) DEFAULT 52.0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'site_settings' AND column_name = 'marketplace_min_picks') THEN
    ALTER TABLE public.site_settings ADD COLUMN marketplace_min_picks INTEGER DEFAULT 5;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'site_settings' AND column_name = 'marketplace_platform_fee_percent') THEN
    ALTER TABLE public.site_settings ADD COLUMN marketplace_platform_fee_percent DECIMAL(5,2) DEFAULT 10.0;
  END IF;
END $$;

-- ===========================================
-- MARKETPLACE PURCHASES (for monetization)
-- ===========================================

CREATE TABLE IF NOT EXISTS public.marketplace_purchases (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  buyer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  listing_id UUID REFERENCES public.marketplace_listings(id) ON DELETE SET NULL,
  seller_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  price_cents INTEGER NOT NULL,
  platform_fee_cents INTEGER NOT NULL DEFAULT 0,
  seller_payout_cents INTEGER NOT NULL DEFAULT 0,
  status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'refunded', 'failed')),
  stripe_payment_intent_id TEXT,
  purchased_at TIMESTAMPTZ DEFAULT NOW(),
  refunded_at TIMESTAMPTZ
);

CREATE INDEX idx_marketplace_purchases_buyer ON public.marketplace_purchases(buyer_id);
CREATE INDEX idx_marketplace_purchases_seller ON public.marketplace_purchases(seller_id);
CREATE INDEX idx_marketplace_purchases_listing ON public.marketplace_purchases(listing_id);

-- ===========================================
-- SELLER PAYOUTS
-- ===========================================

CREATE TABLE IF NOT EXISTS public.seller_payouts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  seller_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  amount_cents INTEGER NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  stripe_transfer_id TEXT,
  stripe_payout_id TEXT,
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

CREATE INDEX idx_seller_payouts_seller ON public.seller_payouts(seller_id);
CREATE INDEX idx_seller_payouts_status ON public.seller_payouts(status);

-- ===========================================
-- ROW LEVEL SECURITY
-- ===========================================

ALTER TABLE public.user_favorite_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_followed_games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seller_payouts ENABLE ROW LEVEL SECURITY;

-- User favorite players policies
CREATE POLICY "Users can view own favorite players"
  ON public.user_favorite_players FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own favorite players"
  ON public.user_favorite_players FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own favorite players"
  ON public.user_favorite_players FOR DELETE
  USING (auth.uid() = user_id);

-- User followed games policies
CREATE POLICY "Users can view own followed games"
  ON public.user_followed_games FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own followed games"
  ON public.user_followed_games FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own followed games"
  ON public.user_followed_games FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own followed games"
  ON public.user_followed_games FOR DELETE
  USING (auth.uid() = user_id);

-- User alerts policies
CREATE POLICY "Users can view own alerts"
  ON public.user_alerts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own alerts"
  ON public.user_alerts FOR UPDATE
  USING (auth.uid() = user_id);

-- Marketplace purchases policies  
CREATE POLICY "Users can view own purchases"
  ON public.marketplace_purchases FOR SELECT
  USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- Seller payouts policies
CREATE POLICY "Sellers can view own payouts"
  ON public.seller_payouts FOR SELECT
  USING (auth.uid() = seller_id);

-- ===========================================
-- HELPER FUNCTIONS
-- ===========================================

-- Function to get user dashboard stats
CREATE OR REPLACE FUNCTION public.get_user_dashboard_stats(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'favorite_teams', (SELECT COUNT(*) FROM public.user_favorite_teams WHERE user_id = p_user_id),
    'favorite_players', (SELECT COUNT(*) FROM public.user_favorite_players WHERE user_id = p_user_id),
    'followed_games', (SELECT COUNT(*) FROM public.user_followed_games WHERE user_id = p_user_id AND scheduled_at >= NOW()),
    'saved_systems', (SELECT COUNT(*) FROM public.user_systems WHERE user_id = p_user_id),
    'unread_alerts', (SELECT COUNT(*) FROM public.user_alerts WHERE user_id = p_user_id AND is_read = false),
    'total_bets', (SELECT COUNT(*) FROM public.user_bets WHERE user_id = p_user_id)
  ) INTO result;
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get marketplace seller stats
CREATE OR REPLACE FUNCTION public.get_seller_stats(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_listings', (SELECT COUNT(*) FROM public.marketplace_listings WHERE creator_id = p_user_id),
    'active_listings', (SELECT COUNT(*) FROM public.marketplace_listings WHERE creator_id = p_user_id AND status = 'active'),
    'total_copies', (SELECT COALESCE(SUM(copies_count), 0) FROM public.marketplace_listings WHERE creator_id = p_user_id),
    'total_likes', (SELECT COALESCE(SUM(likes_count), 0) FROM public.marketplace_listings WHERE creator_id = p_user_id),
    'total_views', (SELECT COALESCE(SUM(views_count), 0) FROM public.marketplace_listings WHERE creator_id = p_user_id),
    'total_earnings_cents', (SELECT COALESCE(SUM(seller_payout_cents), 0) FROM public.marketplace_purchases WHERE seller_id = p_user_id AND status = 'completed'),
    'pending_payout_cents', (SELECT COALESCE(SUM(amount_cents), 0) FROM public.seller_payouts WHERE seller_id = p_user_id AND status = 'pending')
  ) INTO result;
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
