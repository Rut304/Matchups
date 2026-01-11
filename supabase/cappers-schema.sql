-- =============================================================================
-- CAPPERS & PICKS SCHEMA
-- Tracks celebrity/pro/community cappers and their picks for leaderboard
-- =============================================================================

-- Create enum types for cappers
CREATE TYPE capper_type AS ENUM ('celebrity', 'pro', 'community', 'ai');
CREATE TYPE pick_result AS ENUM ('win', 'loss', 'push', 'pending');
CREATE TYPE bet_type AS ENUM ('spread', 'total', 'moneyline', 'prop', 'parlay');
CREATE TYPE sport_type AS ENUM ('NFL', 'NBA', 'NHL', 'MLB', 'NCAAF', 'NCAAB');

-- =============================================================================
-- CAPPERS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS cappers (
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

-- Create index for common queries
CREATE INDEX idx_cappers_type ON cappers(capper_type);
CREATE INDEX idx_cappers_verified ON cappers(verified);
CREATE INDEX idx_cappers_roi ON cappers(roi DESC);
CREATE INDEX idx_cappers_units ON cappers(units_won DESC);

-- =============================================================================
-- PICKS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS picks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  capper_id UUID NOT NULL REFERENCES cappers(id) ON DELETE CASCADE,
  game_id TEXT, -- ESPN game ID or other identifier
  
  -- Pick details
  sport sport_type NOT NULL,
  bet_type bet_type NOT NULL,
  pick_team TEXT NOT NULL, -- Team or Over/Under side
  odds INTEGER NOT NULL DEFAULT -110, -- American odds
  line DECIMAL(5,2), -- Spread or total line
  units DECIMAL(5,2) NOT NULL DEFAULT 1,
  
  -- Game info at time of pick
  home_team TEXT NOT NULL,
  away_team TEXT NOT NULL,
  game_time TIMESTAMPTZ NOT NULL,
  
  -- Line tracking
  open_line DECIMAL(5,2),
  close_line DECIMAL(5,2),
  clv DECIMAL(5,2), -- Closing Line Value
  
  -- Source
  source TEXT, -- 'tv', 'podcast', 'twitter', 'article'
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
CREATE INDEX idx_picks_capper ON picks(capper_id);
CREATE INDEX idx_picks_sport ON picks(sport);
CREATE INDEX idx_picks_result ON picks(result);
CREATE INDEX idx_picks_game_time ON picks(game_time DESC);
CREATE INDEX idx_picks_created ON picks(created_at DESC);

-- =============================================================================
-- CAPPER DAILY STATS TABLE
-- For tracking performance over time
-- =============================================================================
CREATE TABLE IF NOT EXISTS capper_daily_stats (
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

CREATE INDEX idx_daily_stats_capper_date ON capper_daily_stats(capper_id, stat_date DESC);

-- =============================================================================
-- ODDS TABLE (if not exists from previous schema)
-- =============================================================================
CREATE TABLE IF NOT EXISTS odds (
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

CREATE INDEX idx_odds_event ON odds(event_id);
CREATE INDEX idx_odds_sport ON odds(sport);
CREATE INDEX idx_odds_commence ON odds(commence_time);

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

CREATE TRIGGER trigger_update_capper_stats
AFTER UPDATE OF result ON picks
FOR EACH ROW
EXECUTE FUNCTION update_capper_stats();

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

-- Grant permissions
GRANT ALL ON cappers TO authenticated;
GRANT ALL ON picks TO authenticated;
GRANT ALL ON capper_daily_stats TO authenticated;
GRANT ALL ON odds TO authenticated;
