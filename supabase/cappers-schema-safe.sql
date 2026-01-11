-- =============================================================================
-- CAPPERS & PICKS SCHEMA - SAFE VERSION
-- Handles existing types and tables gracefully
-- Run this file in Supabase SQL Editor AFTER schema-safe.sql
-- =============================================================================

-- Create enum types only if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'capper_type') THEN
    CREATE TYPE capper_type AS ENUM ('celebrity', 'pro', 'community', 'ai');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'pick_result') THEN
    CREATE TYPE pick_result AS ENUM ('win', 'loss', 'push', 'pending');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'bet_type') THEN
    CREATE TYPE bet_type AS ENUM ('spread', 'total', 'moneyline', 'prop', 'parlay');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'sport_type') THEN
    CREATE TYPE sport_type AS ENUM ('NFL', 'NBA', 'NHL', 'MLB', 'NCAAF', 'NCAAB');
  END IF;
END $$;

-- =============================================================================
-- CAPPERS TABLE - Drop and recreate to ensure correct schema
-- =============================================================================
DROP TABLE IF EXISTS capper_daily_stats CASCADE;
DROP TABLE IF EXISTS picks CASCADE;
DROP TABLE IF EXISTS cappers_odds CASCADE;
DROP TABLE IF EXISTS cappers CASCADE;

CREATE TABLE cappers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  avatar_url TEXT,
  avatar_emoji TEXT DEFAULT '🎯',
  verified BOOLEAN DEFAULT false,
  capper_type capper_type NOT NULL DEFAULT 'community',
  network TEXT,
  role TEXT,
  bio TEXT,
  twitter_handle TEXT,
  followers_count TEXT,
  primary_sport sport_type,
  
  -- Stats (denormalized for performance)
  total_picks INTEGER DEFAULT 0,
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  pushes INTEGER DEFAULT 0,
  units_won DECIMAL(10,2) DEFAULT 0,
  roi DECIMAL(5,2) DEFAULT 0,
  avg_clv DECIMAL(5,2) DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes if not exist
CREATE INDEX IF NOT EXISTS idx_cappers_type ON cappers(capper_type);
CREATE INDEX IF NOT EXISTS idx_cappers_verified ON cappers(verified);
CREATE INDEX IF NOT EXISTS idx_cappers_roi ON cappers(roi DESC);
CREATE INDEX IF NOT EXISTS idx_cappers_units ON cappers(units_won DESC);

-- =============================================================================
-- PICKS TABLE
-- =============================================================================
CREATE TABLE picks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  capper_id UUID NOT NULL REFERENCES cappers(id) ON DELETE CASCADE,
  game_id TEXT,
  
  -- Pick details
  sport sport_type NOT NULL,
  bet_type bet_type NOT NULL,
  pick_team TEXT NOT NULL,
  odds INTEGER NOT NULL DEFAULT -110,
  line DECIMAL(5,2),
  units DECIMAL(5,2) NOT NULL DEFAULT 1,
  
  -- Game info at time of pick
  home_team TEXT NOT NULL,
  away_team TEXT NOT NULL,
  game_time TIMESTAMPTZ NOT NULL,
  
  -- Line tracking
  open_line DECIMAL(5,2),
  close_line DECIMAL(5,2),
  clv DECIMAL(5,2),
  
  -- Source
  source TEXT,
  source_url TEXT,
  source_timestamp TIMESTAMPTZ,
  notes TEXT,
  
  -- Result
  result pick_result DEFAULT 'pending',
  actual_score_home INTEGER,
  actual_score_away INTEGER,
  profit_loss DECIMAL(10,2),
  graded_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for picks
CREATE INDEX IF NOT EXISTS idx_picks_capper ON picks(capper_id);
CREATE INDEX IF NOT EXISTS idx_picks_sport ON picks(sport);
CREATE INDEX IF NOT EXISTS idx_picks_result ON picks(result);
CREATE INDEX IF NOT EXISTS idx_picks_game_time ON picks(game_time DESC);
CREATE INDEX IF NOT EXISTS idx_picks_created ON picks(created_at DESC);

-- =============================================================================
-- CAPPER DAILY STATS TABLE
-- =============================================================================
CREATE TABLE capper_daily_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  capper_id UUID NOT NULL REFERENCES cappers(id) ON DELETE CASCADE,
  stat_date DATE NOT NULL,
  sport sport_type,
  
  picks_count INTEGER DEFAULT 0,
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  pushes INTEGER DEFAULT 0,
  units_won DECIMAL(10,2) DEFAULT 0,
  
  UNIQUE(capper_id, stat_date, sport)
);

CREATE INDEX IF NOT EXISTS idx_daily_stats_capper_date ON capper_daily_stats(capper_id, stat_date DESC);

-- =============================================================================
-- CAPPERS ODDS TABLE (separate from main odds table)
-- =============================================================================
CREATE TABLE cappers_odds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id TEXT NOT NULL,
  sport sport_type NOT NULL,
  home_team TEXT NOT NULL,
  away_team TEXT NOT NULL,
  commence_time TIMESTAMPTZ,
  
  -- Best available lines
  spread DECIMAL(5,2),
  spread_odds INTEGER DEFAULT -110,
  total DECIMAL(5,2),
  total_over_odds INTEGER DEFAULT -110,
  total_under_odds INTEGER DEFAULT -110,
  home_ml INTEGER,
  away_ml INTEGER,
  
  -- Opening lines (for CLV tracking)
  open_spread DECIMAL(5,2),
  open_total DECIMAL(5,2),
  open_home_ml INTEGER,
  open_away_ml INTEGER,
  
  -- Bookmaker data (JSON for flexibility)
  bookmakers JSONB,
  
  last_update TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(event_id)
);

CREATE INDEX IF NOT EXISTS idx_cappers_odds_event ON cappers_odds(event_id);
CREATE INDEX IF NOT EXISTS idx_cappers_odds_sport ON cappers_odds(sport);
CREATE INDEX IF NOT EXISTS idx_cappers_odds_commence ON cappers_odds(commence_time);

-- =============================================================================
-- FUNCTIONS
-- =============================================================================

-- Update capper stats after pick is graded
CREATE OR REPLACE FUNCTION update_capper_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.result IS NOT NULL AND OLD.result = 'pending' THEN
    UPDATE cappers SET
      total_picks = total_picks + 1,
      wins = wins + CASE WHEN NEW.result = 'win' THEN 1 ELSE 0 END,
      losses = losses + CASE WHEN NEW.result = 'loss' THEN 1 ELSE 0 END,
      pushes = pushes + CASE WHEN NEW.result = 'push' THEN 1 ELSE 0 END,
      units_won = units_won + COALESCE(NEW.profit_loss, 0),
      roi = CASE 
        WHEN (wins + losses) > 0 
        THEN ((units_won + COALESCE(NEW.profit_loss, 0)) / (total_picks + 1)) * 100 
        ELSE 0 
      END,
      updated_at = NOW()
    WHERE id = NEW.capper_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_capper_stats ON picks;
CREATE TRIGGER trigger_update_capper_stats
AFTER UPDATE OF result ON picks
FOR EACH ROW
EXECUTE FUNCTION update_capper_stats();

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE cappers ENABLE ROW LEVEL SECURITY;
ALTER TABLE picks ENABLE ROW LEVEL SECURITY;
ALTER TABLE capper_daily_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE cappers_odds ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Cappers are publicly readable" ON cappers;
DROP POLICY IF EXISTS "Picks are publicly readable" ON picks;
DROP POLICY IF EXISTS "Capper stats are publicly readable" ON capper_daily_stats;
DROP POLICY IF EXISTS "Cappers odds are publicly readable" ON cappers_odds;

-- Recreate policies
CREATE POLICY "Cappers are publicly readable" ON cappers FOR SELECT USING (true);
CREATE POLICY "Picks are publicly readable" ON picks FOR SELECT USING (true);
CREATE POLICY "Capper stats are publicly readable" ON capper_daily_stats FOR SELECT USING (true);
CREATE POLICY "Cappers odds are publicly readable" ON cappers_odds FOR SELECT USING (true);

-- =============================================================================
-- SEED DATA - Insert celebrity cappers
-- =============================================================================

-- Insert Matchups AI
INSERT INTO cappers (slug, name, avatar_emoji, verified, capper_type, network, role, is_featured)
VALUES ('matchups-ai', 'Matchups AI', '🤖', true, 'ai', 'Website', 'AI Prediction Engine', true)
ON CONFLICT (slug) DO NOTHING;

-- Insert ESPN celebrities
INSERT INTO cappers (slug, name, avatar_emoji, verified, capper_type, network, role, followers_count, is_featured) VALUES
('stephen-a-smith', 'Stephen A. Smith', '📺', true, 'celebrity', 'ESPN', 'First Take Host', '6.2M', true),
('shannon-sharpe', 'Shannon Sharpe', '🏈', true, 'celebrity', 'ESPN', 'First Take', '4.1M', true),
('pat-mcafee', 'Pat McAfee', '🎙️', true, 'celebrity', 'ESPN', 'Pat McAfee Show', '5.8M', true),
('mina-kimes', 'Mina Kimes', '🧠', true, 'celebrity', 'ESPN', 'NFL Live', '890K', false),
('peyton-manning', 'Peyton Manning', '🏈', true, 'celebrity', 'ESPN', 'ManningCast', '3.8M', true)
ON CONFLICT (slug) DO NOTHING;

-- Insert FOX/FS1 celebrities
INSERT INTO cappers (slug, name, avatar_emoji, verified, capper_type, network, role, followers_count, is_featured) VALUES
('skip-bayless', 'Skip Bayless', '🎤', true, 'celebrity', 'FS1', 'Undisputed', '3.8M', true),
('colin-cowherd', 'Colin Cowherd', '📻', true, 'celebrity', 'FS1', 'The Herd', '2.9M', false),
('nick-wright', 'Nick Wright', '🔥', true, 'celebrity', 'FS1', 'First Things First', '1.2M', false)
ON CONFLICT (slug) DO NOTHING;

-- Insert TNT Inside the NBA
INSERT INTO cappers (slug, name, avatar_emoji, verified, capper_type, network, role, followers_count, is_featured) VALUES
('charles-barkley', 'Charles Barkley', '🏆', true, 'celebrity', 'TNT', 'Inside the NBA', '3.2M', true),
('shaq', 'Shaq', '🎯', true, 'celebrity', 'TNT', 'Inside the NBA', '24.8M', true),
('kenny-smith', 'Kenny Smith', '✈️', true, 'celebrity', 'TNT', 'Inside the NBA', '1.8M', false)
ON CONFLICT (slug) DO NOTHING;

-- Insert Pro Sharps
INSERT INTO cappers (slug, name, avatar_emoji, verified, capper_type, network, role, followers_count, is_featured) VALUES
('haralabos-voulgaris', 'Haralabos Voulgaris', '📊', true, 'pro', 'Independent', 'NBA Sharp', '245K', true),
('billy-walters', 'Billy Walters', '💰', true, 'pro', 'Independent', 'Legendary Sharp', '178K', true),
('warren-sharp', 'Warren Sharp', '📈', true, 'pro', 'The Athletic', 'Analytics Expert', '312K', true)
ON CONFLICT (slug) DO NOTHING;

-- Grant service role full access
GRANT ALL ON cappers TO service_role;
GRANT ALL ON picks TO service_role;
GRANT ALL ON capper_daily_stats TO service_role;
GRANT ALL ON cappers_odds TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
