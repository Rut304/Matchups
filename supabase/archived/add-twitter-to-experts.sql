-- =============================================================================
-- ADD TWITTER/X TRACKING TO EXPERT RECORDS
-- Run this AFTER expert-tracking-schema.sql
-- =============================================================================

-- Add Twitter/X columns to expert_records
ALTER TABLE expert_records 
ADD COLUMN IF NOT EXISTS twitter_handle VARCHAR(50),
ADD COLUMN IF NOT EXISTS twitter_user_id VARCHAR(50),
ADD COLUMN IF NOT EXISTS twitter_last_scraped TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS twitter_last_tweet_id VARCHAR(50);

-- Index for Twitter lookups
CREATE INDEX IF NOT EXISTS idx_er_twitter ON expert_records(twitter_handle) WHERE twitter_handle IS NOT NULL;

-- =============================================================================
-- TWITTER PICKS TABLE
-- Raw tweets that contain potential picks
-- =============================================================================
CREATE TABLE IF NOT EXISTS expert_tweets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Tweet identification
  tweet_id VARCHAR(50) NOT NULL UNIQUE,
  twitter_handle VARCHAR(50) NOT NULL,
  twitter_user_id VARCHAR(50),
  
  -- Tweet content
  tweet_text TEXT NOT NULL,
  tweet_url TEXT,
  created_at_twitter TIMESTAMPTZ,
  
  -- Engagement metrics
  like_count INTEGER DEFAULT 0,
  retweet_count INTEGER DEFAULT 0,
  reply_count INTEGER DEFAULT 0,
  
  -- Pick parsing
  parsed_pick JSONB, -- Structured pick data if we could parse it
  is_pick BOOLEAN DEFAULT false, -- Did this tweet contain a pick?
  pick_confidence DECIMAL(3,2), -- 0-1 confidence we parsed it correctly
  
  -- Link to expert_picks if we created one
  expert_pick_id UUID REFERENCES expert_picks(id),
  
  -- Processing
  processed BOOLEAN DEFAULT false,
  processed_at TIMESTAMPTZ,
  
  -- Meta
  scraped_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_et_handle ON expert_tweets(twitter_handle);
CREATE INDEX IF NOT EXISTS idx_et_created ON expert_tweets(created_at_twitter DESC);
CREATE INDEX IF NOT EXISTS idx_et_unprocessed ON expert_tweets(processed) WHERE processed = false;

-- RLS
ALTER TABLE expert_tweets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read expert_tweets" ON expert_tweets;
CREATE POLICY "Public read expert_tweets" ON expert_tweets FOR SELECT USING (true);

DROP POLICY IF EXISTS "Service write expert_tweets" ON expert_tweets;
CREATE POLICY "Service write expert_tweets" ON expert_tweets FOR ALL USING (true);

-- =============================================================================
-- UPDATE SEED DATA WITH TWITTER HANDLES
-- =============================================================================

-- NFL Experts
UPDATE expert_records SET twitter_handle = 'The_Oddsmaker' WHERE name = 'Sean Koerner' AND source = 'action_network';
UPDATE expert_records SET twitter_handle = 'ChrisRaybon' WHERE name = 'Chris Raybon' AND source = 'action_network';
UPDATE expert_records SET twitter_handle = 'Stuckey2' WHERE name = 'Stuckey' AND source = 'action_network';
UPDATE expert_records SET twitter_handle = 'MattBowen41' WHERE name = 'Matt Bowen' AND source = 'espn';
UPDATE expert_records SET twitter_handle = 'MikeClayNFL' WHERE name = 'Mike Clay' AND source = 'espn';

-- Insert additional popular experts with Twitter handles
INSERT INTO expert_records (name, source, sport, title, twitter_handle, is_verified) VALUES
-- ESPN Talking Heads
('Stephen A Smith', 'espn', 'NFL', 'First Take Host', 'stephenasmith', false),
('Stephen A Smith', 'espn', 'NBA', 'First Take Host', 'stephenasmith', false),
('Dan Orlovsky', 'espn', 'NFL', 'NFL Analyst/Former QB', 'daborlovsky7', false),
('Mina Kimes', 'espn', 'NFL', 'NFL Analyst', 'minakimes', false),
('Field Yates', 'espn', 'NFL', 'NFL Nation Reporter', 'FieldYates', false),
('Adam Schefter', 'espn', 'NFL', 'NFL Insider', 'AdamSchefter', false),
('Kirk Herbstreit', 'espn', 'NCAAF', 'College GameDay Analyst', 'KirkHerbstreit', false),
('Desmond Howard', 'espn', 'NCAAF', 'College GameDay Analyst', 'DesmondHoward', false),

-- Fox Sports
('Skip Bayless', 'fox', 'NFL', 'Undisputed Host', 'RealSkipBayless', false),
('Skip Bayless', 'fox', 'NBA', 'Undisputed Host', 'RealSkipBayless', false),
('Shannon Sharpe', 'espn', 'NFL', 'First Take', 'ShannonSharpe', false),
('Shannon Sharpe', 'espn', 'NBA', 'First Take', 'ShannonSharpe', false),
('Colin Cowherd', 'fox', 'NFL', 'The Herd Host', 'ColinCowherd', false),
('Nick Wright', 'fox', 'NFL', 'First Things First Host', 'gaboretaw', false),
('Nick Wright', 'fox', 'NBA', 'First Things First Host', 'gaboretaw', false),
('Emmanuel Acho', 'fox', 'NFL', 'Speak Host', 'EmmanuelAcho', false),
('Joy Taylor', 'fox', 'NFL', 'Speak Host', 'JoyTaylorTalks', false),

-- Action Network Experts
('Matt Moore', 'action_network', 'NBA', 'Senior NBA Writer', 'HPbasketball', false),
('Brandon Anderson', 'action_network', 'NBA', 'Futures Specialist', 'wheatonbrando', false),
('Brandon Anderson', 'action_network', 'NFL', 'Futures Specialist', 'wheatonbrando', false),
('Sean Zerillo', 'action_network', 'MLB', 'MLB PRO Projections', 'SeanZerillo', false),
('Collin Wilson', 'action_network', 'NCAAF', 'College Football Analyst', '_collin1', false),
('PJ Walsh', 'action_network', 'NFL', 'PRO Projections', 'pjwalsh24', false),

-- Pat McAfee Show
('Pat McAfee', 'espn', 'NFL', 'Pat McAfee Show', 'PatMcAfeeShow', false),
('AJ Hawk', 'espn', 'NFL', 'Pat McAfee Show', 'OfficialAJHawk', false),

-- Other Popular Personalities
('Bill Simmons', 'ringer', 'NBA', 'The Ringer Founder', 'BillSimmons', false),
('Bill Simmons', 'ringer', 'NFL', 'The Ringer Founder', 'BillSimmons', false),
('Darren Rovell', 'action_network', 'NFL', 'Sports Business Reporter', 'darrenrovell', false),
('Todd Fuhrman', 'fox', 'NFL', 'Fox Bet Live', 'ToddFuhrman', false),

-- NBA Specific
('Zach Lowe', 'espn', 'NBA', 'NBA Analyst', 'ZachLowe_NBA', false),
('Woj', 'espn', 'NBA', 'NBA Insider', 'wojespn', false),
('Shams Charania', 'espn', 'NBA', 'NBA Insider', 'ShamsCharania', false),

-- MLB
('Buster Olney', 'espn', 'MLB', 'MLB Insider', 'Buster_ESPN', false),
('Jeff Passan', 'espn', 'MLB', 'MLB Reporter', 'JeffPassan', false)

ON CONFLICT (name, source, sport) DO UPDATE SET
  twitter_handle = EXCLUDED.twitter_handle,
  title = EXCLUDED.title;

-- =============================================================================
-- COMMENTS
-- =============================================================================
COMMENT ON TABLE expert_tweets IS 'Raw tweets from experts that may contain picks';
COMMENT ON COLUMN expert_records.twitter_handle IS 'X/Twitter handle without @ symbol';
COMMENT ON COLUMN expert_records.twitter_last_tweet_id IS 'Last tweet ID we processed, for pagination';
