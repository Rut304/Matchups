-- ============================================
-- USER BETTING SYSTEMS SCHEMA
-- Run this in Supabase SQL Editor
-- Allows users to create, name, track and backtest betting systems
-- ============================================

-- ============================================
-- 1. USER SYSTEMS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.user_systems (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- System identification
  name TEXT NOT NULL,
  description TEXT,
  
  -- System criteria
  sport TEXT NOT NULL CHECK (sport IN ('all', 'nfl', 'nba', 'nhl', 'mlb', 'ncaaf', 'ncaab')),
  bet_type TEXT NOT NULL CHECK (bet_type IN ('ats', 'ml', 'ou', 'all')),
  criteria JSONB NOT NULL DEFAULT '[]', -- Array of criteria strings
  custom_prompt TEXT, -- Natural language description
  situation_filters JSONB DEFAULT '[]', -- Array of situation tags
  
  -- Backtest results
  backtest_results JSONB DEFAULT '{}',
  backtest_completed_at TIMESTAMPTZ,
  
  -- Performance stats
  stats JSONB DEFAULT '{
    "record": "0-0-0",
    "winPct": 0,
    "roi": 0,
    "units": 0,
    "avgOdds": -110,
    "clv": 0,
    "maxDrawdown": 0,
    "sharpeRatio": 0,
    "kellyPct": 0
  }',
  
  -- Tracking
  is_active BOOLEAN DEFAULT true,
  is_public BOOLEAN DEFAULT false, -- Allow others to see/follow this system
  followers_count INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.user_systems ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Users can view own systems" ON public.user_systems;
CREATE POLICY "Users can view own systems" ON public.user_systems
  FOR SELECT USING (auth.uid() = user_id OR is_public = true);

DROP POLICY IF EXISTS "Users can insert own systems" ON public.user_systems;
CREATE POLICY "Users can insert own systems" ON public.user_systems
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own systems" ON public.user_systems;
CREATE POLICY "Users can update own systems" ON public.user_systems
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own systems" ON public.user_systems;
CREATE POLICY "Users can delete own systems" ON public.user_systems
  FOR DELETE USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_systems_user ON public.user_systems(user_id);
CREATE INDEX IF NOT EXISTS idx_user_systems_sport ON public.user_systems(sport);
CREATE INDEX IF NOT EXISTS idx_user_systems_public ON public.user_systems(is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_user_systems_active ON public.user_systems(is_active) WHERE is_active = true;

-- ============================================
-- 2. SYSTEM PICKS TABLE (Individual picks from system)
-- ============================================

CREATE TABLE IF NOT EXISTS public.system_picks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  system_id UUID REFERENCES public.user_systems(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Pick details
  game_id TEXT,
  game_date DATE NOT NULL,
  matchup TEXT NOT NULL, -- e.g., "TEN vs HOU"
  pick TEXT NOT NULL, -- e.g., "TEN +5.5"
  odds INTEGER DEFAULT -110,
  confidence INTEGER CHECK (confidence >= 1 AND confidence <= 100),
  
  -- Result
  result TEXT CHECK (result IN ('pending', 'win', 'loss', 'push', 'void')),
  profit DECIMAL(10,2),
  
  -- Timestamps
  picked_at TIMESTAMPTZ DEFAULT NOW(),
  settled_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.system_picks ENABLE ROW LEVEL SECURITY;

-- Policies (users can only see picks from their systems or public systems)
DROP POLICY IF EXISTS "Users can view system picks" ON public.system_picks;
CREATE POLICY "Users can view system picks" ON public.system_picks
  FOR SELECT USING (
    auth.uid() = user_id OR 
    EXISTS (SELECT 1 FROM public.user_systems WHERE id = system_id AND is_public = true)
  );

DROP POLICY IF EXISTS "Users can insert system picks" ON public.system_picks;
CREATE POLICY "Users can insert system picks" ON public.system_picks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update system picks" ON public.system_picks;
CREATE POLICY "Users can update system picks" ON public.system_picks
  FOR UPDATE USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_system_picks_system ON public.system_picks(system_id);
CREATE INDEX IF NOT EXISTS idx_system_picks_user ON public.system_picks(user_id);
CREATE INDEX IF NOT EXISTS idx_system_picks_date ON public.system_picks(game_date DESC);
CREATE INDEX IF NOT EXISTS idx_system_picks_result ON public.system_picks(result);

-- ============================================
-- 3. SYSTEM FOLLOWERS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.system_followers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  system_id UUID REFERENCES public.user_systems(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  notifications_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(system_id, user_id)
);

-- Enable RLS
ALTER TABLE public.system_followers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view system followers" ON public.system_followers;
CREATE POLICY "Users can view system followers" ON public.system_followers
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can follow systems" ON public.system_followers;
CREATE POLICY "Users can follow systems" ON public.system_followers
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can unfollow systems" ON public.system_followers;
CREATE POLICY "Users can unfollow systems" ON public.system_followers
  FOR DELETE USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_system_followers_system ON public.system_followers(system_id);
CREATE INDEX IF NOT EXISTS idx_system_followers_user ON public.system_followers(user_id);

-- ============================================
-- 4. TRIGGER TO UPDATE FOLLOWERS COUNT
-- ============================================

CREATE OR REPLACE FUNCTION public.update_system_followers_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.user_systems 
    SET followers_count = followers_count + 1 
    WHERE id = NEW.system_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.user_systems 
    SET followers_count = followers_count - 1 
    WHERE id = OLD.system_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_system_follower_change ON public.system_followers;
CREATE TRIGGER on_system_follower_change
  AFTER INSERT OR DELETE ON public.system_followers
  FOR EACH ROW EXECUTE FUNCTION public.update_system_followers_count();

-- ============================================
-- 5. FUNCTION TO UPDATE SYSTEM STATS
-- ============================================

CREATE OR REPLACE FUNCTION public.update_system_stats(p_system_id UUID)
RETURNS void AS $$
DECLARE
  v_wins INTEGER;
  v_losses INTEGER;
  v_pushes INTEGER;
  v_total_profit DECIMAL;
  v_total_bets INTEGER;
BEGIN
  SELECT 
    COUNT(*) FILTER (WHERE result = 'win'),
    COUNT(*) FILTER (WHERE result = 'loss'),
    COUNT(*) FILTER (WHERE result = 'push'),
    COALESCE(SUM(profit), 0),
    COUNT(*) FILTER (WHERE result IN ('win', 'loss', 'push'))
  INTO v_wins, v_losses, v_pushes, v_total_profit, v_total_bets
  FROM public.system_picks
  WHERE system_id = p_system_id;

  UPDATE public.user_systems
  SET 
    stats = jsonb_build_object(
      'record', v_wins || '-' || v_losses || '-' || v_pushes,
      'winPct', CASE WHEN (v_wins + v_losses) > 0 
                     THEN ROUND((v_wins::DECIMAL / (v_wins + v_losses)) * 100, 1) 
                     ELSE 0 END,
      'roi', CASE WHEN v_total_bets > 0 
                  THEN ROUND((v_total_profit / v_total_bets) * 100, 1) 
                  ELSE 0 END,
      'units', ROUND(v_total_profit, 2),
      'avgOdds', -110,
      'clv', 0,
      'maxDrawdown', 0,
      'sharpeRatio', 0,
      'kellyPct', 0
    ),
    updated_at = NOW()
  WHERE id = p_system_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 6. TRIGGER TO AUTO-UPDATE STATS ON PICK SETTLE
-- ============================================

CREATE OR REPLACE FUNCTION public.on_system_pick_settled()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.result IS DISTINCT FROM OLD.result AND NEW.result IN ('win', 'loss', 'push') THEN
    PERFORM public.update_system_stats(NEW.system_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_pick_settled ON public.system_picks;
CREATE TRIGGER on_pick_settled
  AFTER UPDATE ON public.system_picks
  FOR EACH ROW EXECUTE FUNCTION public.on_system_pick_settled();

-- ============================================
-- 7. VERIFICATION QUERIES
-- ============================================
-- Run these to verify setup:
-- SELECT * FROM public.user_systems LIMIT 5;
-- SELECT * FROM public.system_picks LIMIT 5;
-- SELECT * FROM public.system_followers LIMIT 5;
