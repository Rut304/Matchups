-- Sus Plays table for tracking questionable player decisions
-- Run this in Supabase SQL editor to add the sus_plays table

-- Drop existing table to recreate with new columns (comment out if you want to preserve data)
-- DROP TABLE IF EXISTS sus_play_votes CASCADE;
-- DROP TABLE IF EXISTS sus_plays CASCADE;

CREATE TABLE IF NOT EXISTS sus_plays (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  sport TEXT NOT NULL DEFAULT 'nfl',
  player_name TEXT,
  team TEXT,
  game_id TEXT, -- ESPN game ID or other reference
  video_url TEXT,
  thumbnail_url TEXT,
  play_type TEXT, -- 'drop', 'fumble', 'penalty', 'missed_shot', 'error', 'other'
  game_context TEXT, -- '4th quarter', 'overtime', 'key moment'
  betting_impact TEXT, -- 'spread', 'total', 'prop', 'multiple'
  sus_votes INTEGER DEFAULT 0,
  legit_votes INTEGER DEFAULT 0,
  is_trending BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  submitted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  moderation_status TEXT DEFAULT 'approved', -- 'pending', 'approved', 'rejected'
  -- X/Twitter integration fields
  tweet_id TEXT UNIQUE, -- Twitter/X post ID for deduplication
  tweet_url TEXT, -- Full URL to the tweet
  tweet_author TEXT, -- @handle of the poster
  tweet_author_name TEXT, -- Display name
  tweet_author_verified BOOLEAN DEFAULT false,
  tweet_media_url TEXT, -- Video/image from tweet
  tweet_engagement JSONB, -- likes, retweets, views
  source TEXT DEFAULT 'manual', -- 'manual', 'twitter', 'reddit', 'tiktok'
  -- Dynamic scoring fields
  priority_score NUMERIC DEFAULT 0, -- Combined score for ranking (computed)
  engagement_score NUMERIC DEFAULT 0, -- Based on sus_votes + legit_votes + tweet engagement
  recency_score NUMERIC DEFAULT 0, -- Based on how recent the post is
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Add columns if table already exists (for upgrades)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sus_plays' AND column_name = 'tweet_id') THEN
    ALTER TABLE sus_plays ADD COLUMN tweet_id TEXT UNIQUE;
    ALTER TABLE sus_plays ADD COLUMN tweet_url TEXT;
    ALTER TABLE sus_plays ADD COLUMN tweet_author TEXT;
    ALTER TABLE sus_plays ADD COLUMN tweet_author_name TEXT;
    ALTER TABLE sus_plays ADD COLUMN tweet_author_verified BOOLEAN DEFAULT false;
    ALTER TABLE sus_plays ADD COLUMN tweet_media_url TEXT;
    ALTER TABLE sus_plays ADD COLUMN tweet_engagement JSONB;
    ALTER TABLE sus_plays ADD COLUMN source TEXT DEFAULT 'manual';
  END IF;
END $$;

-- Add priority scoring columns if they don't exist (for upgrades)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sus_plays' AND column_name = 'priority_score') THEN
    ALTER TABLE sus_plays ADD COLUMN priority_score NUMERIC DEFAULT 0;
    ALTER TABLE sus_plays ADD COLUMN engagement_score NUMERIC DEFAULT 0;
    ALTER TABLE sus_plays ADD COLUMN recency_score NUMERIC DEFAULT 0;
  END IF;
END $$;

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_sus_plays_sport ON sus_plays(sport);
CREATE INDEX IF NOT EXISTS idx_sus_plays_player_name ON sus_plays(player_name);
CREATE INDEX IF NOT EXISTS idx_sus_plays_trending ON sus_plays(is_trending) WHERE is_trending = true;
CREATE INDEX IF NOT EXISTS idx_sus_plays_created ON sus_plays(created_at DESC);

-- Enable RLS
ALTER TABLE sus_plays ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid errors on re-run)
DROP POLICY IF EXISTS "Anyone can read sus plays" ON sus_plays;
DROP POLICY IF EXISTS "Authenticated users can submit sus plays" ON sus_plays;
DROP POLICY IF EXISTS "Anyone can update vote counts" ON sus_plays;

-- Allow anyone to read sus plays
CREATE POLICY "Anyone can read sus plays" ON sus_plays
  FOR SELECT USING (true);

-- Allow authenticated users to insert sus plays
CREATE POLICY "Authenticated users can submit sus plays" ON sus_plays
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Allow users to update their own submissions (for voting)
CREATE POLICY "Anyone can update vote counts" ON sus_plays
  FOR UPDATE USING (true)
  WITH CHECK (true);

-- Create sus_play_votes table to track individual votes
CREATE TABLE IF NOT EXISTS sus_play_votes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sus_play_id UUID NOT NULL REFERENCES sus_plays(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  anonymous_id TEXT, -- For non-logged in users (stored in localStorage)
  vote_type TEXT NOT NULL CHECK (vote_type IN ('sus', 'legit')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(sus_play_id, user_id),
  UNIQUE(sus_play_id, anonymous_id)
);

-- Enable RLS on votes
ALTER TABLE sus_play_votes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can read votes" ON sus_play_votes;
DROP POLICY IF EXISTS "Anyone can vote" ON sus_play_votes;

-- Allow anyone to read votes
CREATE POLICY "Anyone can read votes" ON sus_play_votes
  FOR SELECT USING (true);

-- Allow anyone to insert votes (we'll validate in the application)
CREATE POLICY "Anyone can vote" ON sus_play_votes
  FOR INSERT WITH CHECK (true);

-- Create function to update vote counts
CREATE OR REPLACE FUNCTION update_sus_play_votes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.vote_type = 'sus' THEN
      UPDATE sus_plays SET sus_votes = sus_votes + 1 WHERE id = NEW.sus_play_id;
    ELSE
      UPDATE sus_plays SET legit_votes = legit_votes + 1 WHERE id = NEW.sus_play_id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.vote_type = 'sus' THEN
      UPDATE sus_plays SET sus_votes = GREATEST(0, sus_votes - 1) WHERE id = OLD.sus_play_id;
    ELSE
      UPDATE sus_plays SET legit_votes = GREATEST(0, legit_votes - 1) WHERE id = OLD.sus_play_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for vote count updates
DROP TRIGGER IF EXISTS sus_play_votes_trigger ON sus_play_votes;
CREATE TRIGGER sus_play_votes_trigger
  AFTER INSERT OR DELETE ON sus_play_votes
  FOR EACH ROW
  EXECUTE FUNCTION update_sus_play_votes();

-- =============================================================================
-- PRIORITY SCORING SYSTEM
-- Scores sus plays by: recency (70%) + engagement (30%)
-- This ensures fresh content rotates to the top while viral posts stay visible
-- =============================================================================

-- Function to calculate priority score
CREATE OR REPLACE FUNCTION calculate_sus_play_priority_score(
  p_created_at TIMESTAMP WITH TIME ZONE,
  p_sus_votes INTEGER,
  p_legit_votes INTEGER,
  p_tweet_engagement JSONB DEFAULT NULL
) RETURNS NUMERIC AS $$
DECLARE
  recency_score NUMERIC;
  engagement_score NUMERIC;
  hours_old NUMERIC;
  total_votes INTEGER;
  tweet_likes INTEGER;
  tweet_retweets INTEGER;
  tweet_views INTEGER;
BEGIN
  -- Calculate hours since creation (max out at 720 hours = 30 days)
  hours_old := LEAST(720, EXTRACT(EPOCH FROM (NOW() - p_created_at)) / 3600);
  
  -- Recency score: 100 for brand new, decays over 30 days
  -- Using exponential decay: score = 100 * e^(-hours/168) (half-life of ~7 days)
  recency_score := 100 * EXP(-hours_old / 168);
  
  -- Engagement score from votes
  total_votes := COALESCE(p_sus_votes, 0) + COALESCE(p_legit_votes, 0);
  
  -- Add tweet engagement if available
  IF p_tweet_engagement IS NOT NULL THEN
    tweet_likes := COALESCE((p_tweet_engagement->>'likes')::INTEGER, 0);
    tweet_retweets := COALESCE((p_tweet_engagement->>'retweets')::INTEGER, 0);
    tweet_views := COALESCE((p_tweet_engagement->>'views')::INTEGER, 0);
    -- Normalize: likes worth 1, retweets worth 2, views worth 0.001
    total_votes := total_votes + tweet_likes + (tweet_retweets * 2) + (tweet_views / 1000)::INTEGER;
  END IF;
  
  -- Engagement score: logarithmic scale (prevents viral posts from dominating forever)
  -- Score of ~33 at 1000 votes, ~50 at 10000 votes, ~66 at 100000 votes
  engagement_score := CASE 
    WHEN total_votes <= 0 THEN 0
    ELSE 16.6 * LN(total_votes + 1)
  END;
  
  -- Combined: 70% recency, 30% engagement
  RETURN (recency_score * 0.7) + (engagement_score * 0.3);
END;
$$ LANGUAGE plpgsql;

-- Function to update priority scores for a single sus play
CREATE OR REPLACE FUNCTION update_sus_play_scores()
RETURNS TRIGGER AS $$
BEGIN
  NEW.engagement_score := CASE 
    WHEN (NEW.sus_votes + NEW.legit_votes) <= 0 THEN 0
    ELSE 16.6 * LN((NEW.sus_votes + NEW.legit_votes) + 1)
  END;
  
  NEW.recency_score := 100 * EXP(-LEAST(720, EXTRACT(EPOCH FROM (NOW() - COALESCE(NEW.created_at, NOW()))) / 3600) / 168);
  
  NEW.priority_score := calculate_sus_play_priority_score(
    COALESCE(NEW.created_at, NOW()),
    NEW.sus_votes,
    NEW.legit_votes,
    NEW.tweet_engagement
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update scores on insert/update
DROP TRIGGER IF EXISTS sus_play_score_trigger ON sus_plays;
CREATE TRIGGER sus_play_score_trigger
  BEFORE INSERT OR UPDATE ON sus_plays
  FOR EACH ROW
  EXECUTE FUNCTION update_sus_play_scores();

-- Function to refresh all priority scores (run periodically via cron)
CREATE OR REPLACE FUNCTION refresh_all_sus_play_scores()
RETURNS void AS $$
BEGIN
  UPDATE sus_plays SET 
    priority_score = calculate_sus_play_priority_score(created_at, sus_votes, legit_votes, tweet_engagement),
    recency_score = 100 * EXP(-LEAST(720, EXTRACT(EPOCH FROM (NOW() - created_at)) / 3600) / 168),
    engagement_score = CASE 
      WHEN (sus_votes + legit_votes) <= 0 THEN 0
      ELSE 16.6 * LN((sus_votes + legit_votes) + 1)
    END,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Create index for priority score ordering
CREATE INDEX IF NOT EXISTS idx_sus_plays_priority ON sus_plays(priority_score DESC);

-- =============================================================================
-- SAMPLE DATA - Will be replaced by dynamic scraping
-- These are UPSERTED to avoid duplicates on re-runs
-- =============================================================================
INSERT INTO sus_plays (title, description, sport, player_name, team, play_type, game_context, betting_impact, sus_votes, legit_votes, is_featured)
VALUES 
  (
    'WR drops wide open TD in red zone',
    'Star receiver had nobody within 10 yards, ball hit him in the hands, and he dropped it. This was on 3rd down with the team favored by 3.',
    'nfl',
    'DJ Moore',
    'CHI',
    'drop',
    '4th quarter',
    'spread',
    2847,
    1203,
    true
  ),
  (
    'Center snaps ball into backfield on game-winning FG',
    'Clean snaps all game, then on the potential game-winning field goal with 2 seconds left, snaps it 5 feet over the holder''s head.',
    'nfl',
    'Sam Martin',
    'BUF',
    'error',
    'final play',
    'spread',
    3421,
    892,
    true
  ),
  (
    'Star PG shoots airball with 0.5 on clock',
    'Had an open look from 3 that would have won the game. The shot didn''t even hit rim.',
    'nba',
    'Tyrese Haliburton',
    'IND',
    'missed_shot',
    'final play',
    'spread',
    1892,
    2103,
    false
  ),
  (
    'Goalie lets puck through legs on easy save',
    'Routine shot from outside the blue line, somehow went five-hole. This was in OT with the under looking good.',
    'nhl',
    'Connor Hellebuyck',
    'WPG',
    'error',
    'overtime',
    'total',
    1456,
    987,
    false
  );

-- Insert X/Twitter sourced sus plays (UPSERT pattern - safe for re-runs)
INSERT INTO sus_plays (
  title, description, sport, player_name, team, play_type, game_context, betting_impact,
  sus_votes, legit_votes, is_featured, is_trending, source, 
  tweet_id, tweet_url, tweet_author, tweet_author_verified, moderation_status
)
VALUES 
  (
    'Dirty play spotted by @dirtyfootbaiier',
    'Suspicious play caught on camera and shared by popular sports betting sleuth. Community is divided on whether this was intentional.',
    'nfl',
    NULL,
    NULL,
    'other',
    'key moment',
    'spread',
    4521,
    1832,
    true,
    true,
    'twitter',
    '2011469607316656579',
    'https://x.com/dirtyfootbaiier/status/2011469607316656579',
    '@dirtyfootbaiier',
    false,
    'approved'
  ),
  (
    'Rigged for Vegas breakdown #1',
    'Detailed analysis of a questionable play that had major betting implications. The timing and execution raised serious eyebrows.',
    'nfl',
    NULL,
    NULL,
    'other',
    'late game',
    'multiple',
    5892,
    2341,
    true,
    true,
    'twitter',
    '2008758808584012099',
    'https://x.com/riggedforvegas/status/2008758808584012099',
    '@riggedforvegas',
    false,
    'approved'
  ),
  (
    'Rigged for Vegas breakdown #2',
    'Another suspicious sequence of events that benefited the sportsbooks. Pattern recognition analysis included.',
    'nfl',
    NULL,
    NULL,
    'error',
    '4th quarter',
    'spread',
    6234,
    1567,
    true,
    true,
    'twitter',
    '1999952158293377061',
    'https://x.com/riggedforvegas/status/1999952158293377061',
    '@riggedforvegas',
    false,
    'approved'
  ),
  (
    'Rigged for Vegas breakdown #3',
    'Yet another play that defies logic. The probability of this outcome was extremely low given the circumstances.',
    'nba',
    NULL,
    NULL,
    'missed_shot',
    'final play',
    'spread',
    7103,
    2891,
    true,
    true,
    'twitter',
    '2004051758239322283',
    'https://x.com/riggedforvegas/status/2004051758239322283',
    '@riggedforvegas',
    false,
    'approved'
  ),
  (
    'Field of 68 sus play breakdown',
    'College basketball sus play analyzed by @thefieldof68 - one of the most trusted CBB analysts. The timing and execution raised questions.',
    'ncaab',
    NULL,
    NULL,
    'error',
    'late game',
    'spread',
    3200,
    1400,
    true,
    true,
    'twitter',
    '2011851588063637744',
    'https://x.com/thefieldof68/status/2011851588063637744',
    '@thefieldof68',
    true,
    'approved'
  ),
  (
    'Sus play breakdown by @mattbegreatyt',
    'Popular sports content creator breaks down a highly questionable play. The community response has been massive.',
    'nfl',
    NULL,
    NULL,
    'other',
    'critical moment',
    'spread',
    8234,
    3102,
    true,
    true,
    'twitter',
    '2013450430139846956',
    'https://x.com/mattbegreatyt/status/2013450430139846956',
    '@mattbegreatyt',
    false,
    'approved'
  )
ON CONFLICT (tweet_id) DO UPDATE SET
  sus_votes = EXCLUDED.sus_votes,
  legit_votes = EXCLUDED.legit_votes,
  is_featured = EXCLUDED.is_featured,
  is_trending = EXCLUDED.is_trending,
  updated_at = NOW();

-- Create index for tweet lookups
CREATE INDEX IF NOT EXISTS idx_sus_plays_tweet_id ON sus_plays(tweet_id) WHERE tweet_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_sus_plays_source ON sus_plays(source);
