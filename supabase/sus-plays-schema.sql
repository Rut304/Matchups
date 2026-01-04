-- Sus Plays table for tracking questionable player decisions
-- Run this in Supabase SQL editor to add the sus_plays table

CREATE TABLE IF NOT EXISTS sus_plays (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  sport TEXT NOT NULL DEFAULT 'nfl',
  player_name TEXT,
  team TEXT,
  game_id UUID REFERENCES games(id) ON DELETE SET NULL,
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
  moderation_status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_sus_plays_sport ON sus_plays(sport);
CREATE INDEX IF NOT EXISTS idx_sus_plays_player_name ON sus_plays(player_name);
CREATE INDEX IF NOT EXISTS idx_sus_plays_trending ON sus_plays(is_trending) WHERE is_trending = true;
CREATE INDEX IF NOT EXISTS idx_sus_plays_created ON sus_plays(created_at DESC);

-- Enable RLS
ALTER TABLE sus_plays ENABLE ROW LEVEL SECURITY;

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

-- Insert some sample sus plays for demo
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
