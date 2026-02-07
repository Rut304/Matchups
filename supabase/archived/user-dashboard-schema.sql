-- ============================================
-- USER DASHBOARD & BET TRACKING SCHEMA
-- Run this in Supabase SQL Editor
-- ============================================

-- ============================================
-- 1. USER FOLLOWS (Players, Teams, Experts)
-- ============================================

-- User follows table
CREATE TABLE IF NOT EXISTS public.user_follows (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  follow_type TEXT NOT NULL CHECK (follow_type IN ('player', 'team', 'expert', 'market')),
  entity_id TEXT NOT NULL, -- player_id, team_id, expert_slug, or market_id
  entity_name TEXT NOT NULL, -- Display name
  entity_data JSONB DEFAULT '{}', -- Additional metadata (logo, sport, etc.)
  notifications_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, follow_type, entity_id)
);

-- Enable RLS
ALTER TABLE public.user_follows ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Users can view own follows" ON public.user_follows;
CREATE POLICY "Users can view own follows" ON public.user_follows
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own follows" ON public.user_follows;
CREATE POLICY "Users can insert own follows" ON public.user_follows
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own follows" ON public.user_follows;
CREATE POLICY "Users can delete own follows" ON public.user_follows
  FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own follows" ON public.user_follows;
CREATE POLICY "Users can update own follows" ON public.user_follows
  FOR UPDATE USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_follows_user ON public.user_follows(user_id);
CREATE INDEX IF NOT EXISTS idx_user_follows_type ON public.user_follows(follow_type);
CREATE INDEX IF NOT EXISTS idx_user_follows_entity ON public.user_follows(entity_id);

-- ============================================
-- 2. USER BETS (Bet Tracking)
-- ============================================

CREATE TABLE IF NOT EXISTS public.user_bets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Bet details
  sport TEXT NOT NULL,
  game_id TEXT, -- Optional link to specific game
  bet_type TEXT NOT NULL CHECK (bet_type IN ('spread', 'moneyline', 'total', 'prop', 'parlay', 'teaser', 'future', 'live', 'other')),
  
  -- Selection
  selection TEXT NOT NULL, -- e.g., "Chiefs -3.5", "Over 45.5", "Mahomes ATTD"
  odds INTEGER NOT NULL, -- American odds: -110, +150, etc.
  
  -- Stakes
  stake DECIMAL(10,2) NOT NULL,
  potential_payout DECIMAL(10,2),
  actual_payout DECIMAL(10,2),
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'won', 'lost', 'push', 'cashout', 'void')),
  
  -- Parlay legs (for parlay bets)
  parlay_legs JSONB DEFAULT '[]',
  
  -- Metadata
  sportsbook TEXT, -- e.g., "DraftKings", "FanDuel"
  notes TEXT,
  confidence INTEGER CHECK (confidence >= 1 AND confidence <= 5), -- 1-5 star confidence
  tags TEXT[], -- User-defined tags like "fade", "sharp", "model pick"
  
  -- Timestamps
  placed_at TIMESTAMPTZ DEFAULT NOW(),
  settled_at TIMESTAMPTZ,
  game_date DATE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.user_bets ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Users can view own bets" ON public.user_bets;
CREATE POLICY "Users can view own bets" ON public.user_bets
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own bets" ON public.user_bets;
CREATE POLICY "Users can insert own bets" ON public.user_bets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own bets" ON public.user_bets;
CREATE POLICY "Users can update own bets" ON public.user_bets
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own bets" ON public.user_bets;
CREATE POLICY "Users can delete own bets" ON public.user_bets
  FOR DELETE USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_bets_user ON public.user_bets(user_id);
CREATE INDEX IF NOT EXISTS idx_user_bets_status ON public.user_bets(status);
CREATE INDEX IF NOT EXISTS idx_user_bets_sport ON public.user_bets(sport);
CREATE INDEX IF NOT EXISTS idx_user_bets_type ON public.user_bets(bet_type);
CREATE INDEX IF NOT EXISTS idx_user_bets_placed ON public.user_bets(placed_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_bets_game_date ON public.user_bets(game_date);

-- ============================================
-- 3. USER PREFERENCES
-- ============================================

CREATE TABLE IF NOT EXISTS public.user_preferences (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  
  -- Display preferences
  default_sport TEXT DEFAULT 'NFL',
  odds_format TEXT DEFAULT 'american' CHECK (odds_format IN ('american', 'decimal', 'fractional')),
  timezone TEXT DEFAULT 'America/New_York',
  
  -- Dashboard preferences
  dashboard_layout JSONB DEFAULT '{"widgets": ["recent_bets", "followed_games", "analytics_summary"]}',
  
  -- Notification preferences
  email_notifications BOOLEAN DEFAULT true,
  push_notifications BOOLEAN DEFAULT false,
  notify_game_start BOOLEAN DEFAULT true,
  notify_bet_result BOOLEAN DEFAULT true,
  notify_followed_picks BOOLEAN DEFAULT true,
  
  -- Bankroll tracking
  starting_bankroll DECIMAL(10,2) DEFAULT 1000.00,
  current_bankroll DECIMAL(10,2) DEFAULT 1000.00,
  unit_size DECIMAL(10,2) DEFAULT 100.00,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Users can view own preferences" ON public.user_preferences;
CREATE POLICY "Users can view own preferences" ON public.user_preferences
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own preferences" ON public.user_preferences;
CREATE POLICY "Users can insert own preferences" ON public.user_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own preferences" ON public.user_preferences;
CREATE POLICY "Users can update own preferences" ON public.user_preferences
  FOR UPDATE USING (auth.uid() = user_id);

-- Auto-create preferences on profile creation
CREATE OR REPLACE FUNCTION public.handle_new_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_profile_created ON public.profiles;
CREATE TRIGGER on_profile_created
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_profile();

-- ============================================
-- 4. HELPER FUNCTIONS FOR ANALYTICS
-- ============================================

-- Calculate bet profit/loss
CREATE OR REPLACE FUNCTION public.calculate_payout(odds INTEGER, stake DECIMAL)
RETURNS DECIMAL AS $$
BEGIN
  IF odds > 0 THEN
    RETURN stake * (odds / 100.0);
  ELSE
    RETURN stake * (100.0 / ABS(odds));
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Get user betting stats
CREATE OR REPLACE FUNCTION public.get_user_betting_stats(p_user_id UUID)
RETURNS TABLE (
  total_bets BIGINT,
  wins BIGINT,
  losses BIGINT,
  pushes BIGINT,
  pending BIGINT,
  win_rate DECIMAL,
  total_staked DECIMAL,
  total_profit DECIMAL,
  roi DECIMAL,
  avg_odds DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT as total_bets,
    COUNT(*) FILTER (WHERE status = 'won')::BIGINT as wins,
    COUNT(*) FILTER (WHERE status = 'lost')::BIGINT as losses,
    COUNT(*) FILTER (WHERE status = 'push')::BIGINT as pushes,
    COUNT(*) FILTER (WHERE status = 'pending')::BIGINT as pending,
    CASE 
      WHEN COUNT(*) FILTER (WHERE status IN ('won', 'lost')) > 0 
      THEN ROUND(COUNT(*) FILTER (WHERE status = 'won')::DECIMAL / COUNT(*) FILTER (WHERE status IN ('won', 'lost')) * 100, 2)
      ELSE 0 
    END as win_rate,
    COALESCE(SUM(stake), 0) as total_staked,
    COALESCE(SUM(
      CASE 
        WHEN status = 'won' THEN actual_payout - stake
        WHEN status = 'lost' THEN -stake
        ELSE 0
      END
    ), 0) as total_profit,
    CASE 
      WHEN SUM(stake) FILTER (WHERE status IN ('won', 'lost')) > 0 
      THEN ROUND(
        SUM(
          CASE 
            WHEN status = 'won' THEN actual_payout - stake
            WHEN status = 'lost' THEN -stake
            ELSE 0
          END
        ) / SUM(stake) FILTER (WHERE status IN ('won', 'lost')) * 100, 2
      )
      ELSE 0
    END as roi,
    ROUND(AVG(odds)::DECIMAL, 0) as avg_odds
  FROM public.user_bets
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 5. VERIFICATION
-- ============================================
-- Run these to verify setup:
-- SELECT * FROM public.user_follows LIMIT 5;
-- SELECT * FROM public.user_bets LIMIT 5;
-- SELECT * FROM public.user_preferences LIMIT 5;
