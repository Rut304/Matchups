-- Fix for capper_stats relationship issue
-- Run this in Supabase SQL Editor

-- First check if the tables exist
DO $$
BEGIN
  -- Create cappers table if not exists
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'cappers') THEN
    CREATE TABLE public.cappers (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      slug TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      avatar_emoji TEXT DEFAULT '🎯',
      avatar_url TEXT,
      verified BOOLEAN DEFAULT FALSE,
      capper_type TEXT NOT NULL DEFAULT 'community' CHECK (capper_type IN ('celebrity', 'pro', 'community', 'ai')),
      network TEXT,
      role TEXT,
      twitter_handle TEXT,
      followers_count TEXT,
      is_active BOOLEAN DEFAULT TRUE,
      is_featured BOOLEAN DEFAULT FALSE,
      bio TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    
    CREATE INDEX IF NOT EXISTS idx_cappers_slug ON public.cappers(slug);
    CREATE INDEX IF NOT EXISTS idx_cappers_type ON public.cappers(capper_type);
  END IF;
  
  -- Create capper_stats table if not exists
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'capper_stats') THEN
    CREATE TABLE public.capper_stats (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      capper_id UUID REFERENCES public.cappers(id) ON DELETE CASCADE UNIQUE NOT NULL,
      total_picks INTEGER DEFAULT 0,
      total_wins INTEGER DEFAULT 0,
      total_losses INTEGER DEFAULT 0,
      total_pushes INTEGER DEFAULT 0,
      win_percentage DECIMAL(5,2) DEFAULT 0,
      total_units_wagered DECIMAL(10,2) DEFAULT 0,
      total_units_won DECIMAL(10,2) DEFAULT 0,
      net_units DECIMAL(10,2) DEFAULT 0,
      roi_percentage DECIMAL(6,2) DEFAULT 0,
      current_streak TEXT,
      best_streak TEXT,
      worst_streak TEXT,
      overall_rank INTEGER,
      previous_rank INTEGER,
      rank_change INTEGER DEFAULT 0,
      last_pick_at TIMESTAMPTZ,
      picks_this_week INTEGER DEFAULT 0,
      picks_this_month INTEGER DEFAULT 0,
      computed_at TIMESTAMPTZ DEFAULT NOW()
    );
    
    CREATE INDEX IF NOT EXISTS idx_capper_stats_rank ON public.capper_stats(overall_rank);
    CREATE INDEX IF NOT EXISTS idx_capper_stats_units ON public.capper_stats(net_units DESC);
  END IF;
END $$;

-- Enable RLS
ALTER TABLE public.cappers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.capper_stats ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access
DROP POLICY IF EXISTS "Public read access" ON public.cappers;
CREATE POLICY "Public read access" ON public.cappers FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read access" ON public.capper_stats;
CREATE POLICY "Public read access" ON public.capper_stats FOR SELECT USING (true);

-- Insert demo data if tables are empty
INSERT INTO public.cappers (slug, name, avatar_emoji, verified, capper_type, network, role)
SELECT * FROM (VALUES
  ('sharpshooter-mike', 'SharpShooter_Mike', '🎯', true, 'pro', NULL, 'Sharp Bettor'),
  ('vegas-vince', 'VegasVince', '🎰', true, 'pro', NULL, 'Vegas Insider'),
  ('hoops-guru', 'HoopsGuru', '🏀', true, 'pro', NULL, 'NBA Specialist'),
  ('ice-cold-picks', 'IceColdPicks', '🏒', false, 'community', NULL, 'NHL Handicapper'),
  ('moneyline-maven', 'MoneyLine_Maven', '💰', true, 'pro', NULL, 'ML Expert'),
  ('stephen-a-smith', 'Stephen A. Smith', '📺', true, 'celebrity', 'ESPN', 'First Take Host'),
  ('shannon-sharpe', 'Shannon Sharpe', '🏈', true, 'celebrity', 'ESPN', 'First Take Analyst'),
  ('pat-mcafee', 'Pat McAfee', '🎙️', true, 'celebrity', 'ESPN', 'The Pat McAfee Show'),
  ('bill-simmons', 'Bill Simmons', '📝', true, 'celebrity', 'The Ringer', 'Podcast Host'),
  ('charles-barkley', 'Charles Barkley', '🏀', true, 'celebrity', 'TNT', 'Inside the NBA')
) AS v(slug, name, avatar_emoji, verified, capper_type, network, role)
WHERE NOT EXISTS (SELECT 1 FROM public.cappers LIMIT 1)
ON CONFLICT (slug) DO NOTHING;

-- Insert stats for each capper
INSERT INTO public.capper_stats (capper_id, total_picks, total_wins, total_losses, total_pushes, win_percentage, net_units, roi_percentage, current_streak, overall_rank)
SELECT 
  c.id,
  (50 + floor(random() * 150))::int as total_picks,
  (30 + floor(random() * 80))::int as total_wins,
  (20 + floor(random() * 60))::int as total_losses,
  floor(random() * 10)::int as total_pushes,
  (52 + random() * 15)::decimal(5,2) as win_percentage,
  (-10 + random() * 60)::decimal(10,2) as net_units,
  (-5 + random() * 20)::decimal(6,2) as roi_percentage,
  CASE WHEN random() > 0.5 THEN 'W' ELSE 'L' END || (1 + floor(random() * 7))::text,
  row_number() OVER (ORDER BY random())::int
FROM public.cappers c
WHERE NOT EXISTS (SELECT 1 FROM public.capper_stats WHERE capper_id = c.id);

-- Verify the setup
SELECT 'cappers' as table_name, count(*) as row_count FROM public.cappers
UNION ALL
SELECT 'capper_stats' as table_name, count(*) as row_count FROM public.capper_stats;
