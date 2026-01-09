-- Expert Picks Tracking System
-- Stores aggregated picks from all sources (Twitter, ESPN, Covers, etc.)

-- =============================================================================
-- EXPERT PROFILES TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS expert_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  
  -- Source information
  source VARCHAR(50) NOT NULL, -- 'twitter', 'espn', 'covers', 'thescore', 'manual'
  twitter_handle VARCHAR(100),
  avatar_url TEXT,
  network VARCHAR(100), -- 'ESPN', 'FS1', 'TNT', 'Podcast', etc.
  role VARCHAR(100), -- 'NFL Analyst', 'NBA Insider', etc.
  
  -- Tracking settings
  is_tracked BOOLEAN DEFAULT true,
  sync_frequency VARCHAR(20) DEFAULT 'daily', -- 'realtime', 'hourly', 'daily'
  last_sync_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  followers_count VARCHAR(20),
  bio TEXT,
  verified BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- EXPERT PICKS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS expert_picks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expert_id UUID REFERENCES expert_profiles(id) ON DELETE CASCADE,
  
  -- Source tracking
  source VARCHAR(50) NOT NULL, -- 'twitter', 'espn', 'covers', etc.
  source_id VARCHAR(255), -- Tweet ID, article ID, etc.
  source_url TEXT, -- Link to original pick
  
  -- Game/Event information
  sport VARCHAR(20) NOT NULL, -- 'NFL', 'NBA', 'NHL', 'MLB', etc.
  league VARCHAR(50),
  game_id VARCHAR(100),
  game_time TIMESTAMP WITH TIME ZONE,
  home_team VARCHAR(100),
  away_team VARCHAR(100),
  
  -- Pick details
  pick_type VARCHAR(30) NOT NULL, -- 'spread', 'moneyline', 'total', 'prop', 'parlay', 'futures'
  pick_description TEXT NOT NULL, -- "Chiefs -3.5", "Over 47.5", "LeBron O25.5 pts"
  pick_side VARCHAR(100), -- Team/side picked
  line DECIMAL(10, 2), -- The line at time of pick
  odds INTEGER DEFAULT -110, -- American odds
  stake DECIMAL(10, 2) DEFAULT 1, -- Units wagered
  confidence INTEGER, -- 1-5 stars if provided
  
  -- Result tracking
  result VARCHAR(20) DEFAULT 'pending', -- 'win', 'loss', 'push', 'pending', 'void'
  actual_result TEXT, -- The actual game result
  payout DECIMAL(10, 2), -- Units won/lost
  clv DECIMAL(10, 2), -- Closing line value
  
  -- Timing
  picked_at TIMESTAMP WITH TIME ZONE NOT NULL,
  settled_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  analysis TEXT, -- Their reasoning if captured
  verified BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- EXPERT STATS TABLE (Cached/Aggregated)
-- =============================================================================
CREATE TABLE IF NOT EXISTS expert_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expert_id UUID REFERENCES expert_profiles(id) ON DELETE CASCADE,
  
  -- Time period
  timeframe VARCHAR(20) NOT NULL, -- 'today', 'week', 'month', 'season', 'all', 'ytd'
  sport VARCHAR(20), -- NULL for all sports combined
  
  -- Stats
  total_picks INTEGER DEFAULT 0,
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  pushes INTEGER DEFAULT 0,
  pending INTEGER DEFAULT 0,
  win_pct DECIMAL(5, 2),
  net_units DECIMAL(10, 2),
  roi_pct DECIMAL(5, 2),
  avg_odds INTEGER,
  clv_avg DECIMAL(10, 2),
  
  -- Streak tracking
  current_streak VARCHAR(10), -- 'W5', 'L3', etc.
  best_streak VARCHAR(10),
  worst_streak VARCHAR(10),
  
  -- Rankings
  rank INTEGER,
  rank_change INTEGER DEFAULT 0,
  
  -- Caching
  calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(expert_id, timeframe, sport)
);

-- =============================================================================
-- TWITTER SYNC LOG
-- =============================================================================
CREATE TABLE IF NOT EXISTS twitter_sync_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expert_id UUID REFERENCES expert_profiles(id) ON DELETE CASCADE,
  twitter_handle VARCHAR(100) NOT NULL,
  
  -- Sync details
  tweets_fetched INTEGER DEFAULT 0,
  picks_extracted INTEGER DEFAULT 0,
  last_tweet_id VARCHAR(100),
  
  -- Status
  status VARCHAR(20) DEFAULT 'success', -- 'success', 'failed', 'rate_limited'
  error_message TEXT,
  
  synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- SHAREABLE CARDS (for viral posts)
-- =============================================================================
CREATE TABLE IF NOT EXISTS share_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expert_id UUID REFERENCES expert_profiles(id) ON DELETE CASCADE,
  
  -- Card details
  timeframe VARCHAR(20) NOT NULL,
  sport VARCHAR(20),
  image_url TEXT,
  share_text TEXT NOT NULL,
  
  -- Engagement tracking
  view_count INTEGER DEFAULT 0,
  share_count INTEGER DEFAULT 0,
  click_count INTEGER DEFAULT 0,
  
  -- Generated details
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE
);

-- =============================================================================
-- INDEXES
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_expert_picks_expert_id ON expert_picks(expert_id);
CREATE INDEX IF NOT EXISTS idx_expert_picks_source ON expert_picks(source);
CREATE INDEX IF NOT EXISTS idx_expert_picks_sport ON expert_picks(sport);
CREATE INDEX IF NOT EXISTS idx_expert_picks_picked_at ON expert_picks(picked_at DESC);
CREATE INDEX IF NOT EXISTS idx_expert_picks_result ON expert_picks(result);
CREATE INDEX IF NOT EXISTS idx_expert_picks_game_time ON expert_picks(game_time);

CREATE INDEX IF NOT EXISTS idx_expert_stats_expert_timeframe ON expert_stats(expert_id, timeframe);
CREATE INDEX IF NOT EXISTS idx_expert_stats_rank ON expert_stats(rank);

CREATE INDEX IF NOT EXISTS idx_expert_profiles_source ON expert_profiles(source);
CREATE INDEX IF NOT EXISTS idx_expert_profiles_twitter ON expert_profiles(twitter_handle);
CREATE INDEX IF NOT EXISTS idx_expert_profiles_slug ON expert_profiles(slug);

-- =============================================================================
-- FUNCTIONS
-- =============================================================================

-- Function to update expert stats after pick settlement
CREATE OR REPLACE FUNCTION update_expert_stats_on_pick() RETURNS TRIGGER AS $$
BEGIN
  -- This would recalculate stats for the expert
  -- Simplified version - in production, use a background job
  UPDATE expert_stats
  SET 
    wins = CASE WHEN NEW.result = 'win' THEN wins + 1 ELSE wins END,
    losses = CASE WHEN NEW.result = 'loss' THEN losses + 1 ELSE losses END,
    pushes = CASE WHEN NEW.result = 'push' THEN pushes + 1 ELSE pushes END,
    pending = CASE WHEN OLD.result = 'pending' THEN pending - 1 ELSE pending END,
    total_picks = total_picks,
    net_units = net_units + COALESCE(NEW.payout, 0),
    win_pct = CASE WHEN (wins + losses) > 0 THEN (wins::DECIMAL / (wins + losses) * 100) ELSE 0 END,
    calculated_at = NOW()
  WHERE expert_id = NEW.expert_id 
    AND timeframe = 'all'
    AND (sport IS NULL OR sport = NEW.sport);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for pick updates
CREATE TRIGGER trg_update_expert_stats
AFTER UPDATE OF result ON expert_picks
FOR EACH ROW
WHEN (OLD.result = 'pending' AND NEW.result IN ('win', 'loss', 'push'))
EXECUTE FUNCTION update_expert_stats_on_pick();

-- =============================================================================
-- SEED DATA: Initial tracked experts
-- =============================================================================
INSERT INTO expert_profiles (slug, name, source, twitter_handle, network, role, is_tracked, verified)
VALUES
  -- TV Personalities
  ('stephen-a-smith', 'Stephen A. Smith', 'twitter', 'stephenasmith', 'ESPN', 'First Take Host', true, true),
  ('shannon-sharpe', 'Shannon Sharpe', 'twitter', 'ShannonSharpe', 'ESPN', 'First Take Co-Host', true, true),
  ('skip-bayless', 'Skip Bayless', 'twitter', 'RealSkipBayless', 'FS1', 'Undisputed Host', true, true),
  ('colin-cowherd', 'Colin Cowherd', 'twitter', 'ColinCowherd', 'FS1', 'The Herd Host', true, true),
  ('pat-mcafee', 'Pat McAfee', 'twitter', 'PatMcAfeeShow', 'ESPN', 'Pat McAfee Show', true, true),
  ('nick-wright', 'Nick Wright', 'twitter', 'gaborik', 'FS1', 'First Things First', true, true),
  ('chris-broussard', 'Chris Broussard', 'twitter', 'Chris_Broussard', 'FS1', 'First Things First', true, true),
  
  -- Known Betting Personalities
  ('wagertalk', 'WagerTalk', 'twitter', 'WagerTalk', 'Independent', 'Betting Analysis', true, true),
  ('bet-the-board', 'Bet The Board', 'twitter', 'BetTheBoard', 'Podcast', 'NFL Betting Podcast', true, true),
  ('rj-bell', 'RJ Bell', 'twitter', 'RJinVegas', 'Podcast', 'Pregame.com Founder', true, true),
  
  -- ESPN Analysts
  ('adam-schefter', 'Adam Schefter', 'twitter', 'AdamSchefter', 'ESPN', 'NFL Insider', true, true),
  ('woj', 'Adrian Wojnarowski', 'twitter', 'wojespn', 'ESPN', 'NBA Insider', true, true),
  ('dan-orlovsky', 'Dan Orlovsky', 'twitter', 'danorlovsky7', 'ESPN', 'NFL Analyst', true, true),
  
  -- CBS/FOX Analysts
  ('tony-romo', 'Tony Romo', 'manual', NULL, 'CBS', 'NFL Analyst', true, true),
  ('terry-bradshaw', 'Terry Bradshaw', 'manual', NULL, 'FOX', 'NFL Analyst', true, true)
ON CONFLICT (slug) DO NOTHING;

-- =============================================================================
-- RLS POLICIES
-- =============================================================================
ALTER TABLE expert_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE expert_picks ENABLE ROW LEVEL SECURITY;
ALTER TABLE expert_stats ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Public read expert_profiles" ON expert_profiles FOR SELECT USING (true);
CREATE POLICY "Public read expert_picks" ON expert_picks FOR SELECT USING (true);
CREATE POLICY "Public read expert_stats" ON expert_stats FOR SELECT USING (true);

-- Admin write access (would need proper auth setup)
CREATE POLICY "Admin write expert_profiles" ON expert_profiles FOR ALL USING (true);
CREATE POLICY "Admin write expert_picks" ON expert_picks FOR ALL USING (true);
CREATE POLICY "Admin write expert_stats" ON expert_stats FOR ALL USING (true);
