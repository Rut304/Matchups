-- =============================================================================
-- Matchups Sports Betting Analytics Platform
-- SAFE SCHEMA - Handles existing objects gracefully
-- Run this file in Supabase SQL Editor
-- =============================================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ===========================================
-- USERS & AUTHENTICATION
-- ===========================================

-- User profiles (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'pro', 'admin', 'super_admin')),
  subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro', 'premium')),
  subscription_status TEXT DEFAULT 'active' CHECK (subscription_status IN ('active', 'canceled', 'past_due')),
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT,
  preferences JSONB DEFAULT '{"theme": "dark", "notifications": true, "favoriteSports": ["NFL", "NBA"]}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User favorite teams
CREATE TABLE IF NOT EXISTS public.user_favorite_teams (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  sport TEXT NOT NULL CHECK (sport IN ('NFL', 'NBA', 'NHL', 'MLB')),
  team_id TEXT NOT NULL,
  team_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, sport, team_id)
);

-- ===========================================
-- SPORTS DATA
-- ===========================================

-- Teams
CREATE TABLE IF NOT EXISTS public.teams (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  external_id TEXT UNIQUE NOT NULL,
  sport TEXT NOT NULL CHECK (sport IN ('NFL', 'NBA', 'NHL', 'MLB')),
  name TEXT NOT NULL,
  abbreviation TEXT NOT NULL,
  city TEXT,
  conference TEXT,
  division TEXT,
  logo_url TEXT,
  primary_color TEXT,
  secondary_color TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_teams_sport ON public.teams(sport);

-- Games/Matchups
CREATE TABLE IF NOT EXISTS public.games (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  external_id TEXT UNIQUE NOT NULL,
  sport TEXT NOT NULL CHECK (sport IN ('NFL', 'NBA', 'NHL', 'MLB')),
  home_team_id UUID REFERENCES public.teams(id),
  away_team_id UUID REFERENCES public.teams(id),
  venue TEXT,
  scheduled_at TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'live', 'final', 'postponed', 'canceled')),
  home_score INTEGER,
  away_score INTEGER,
  period TEXT,
  week_number INTEGER,
  season_year INTEGER NOT NULL,
  season_type TEXT DEFAULT 'regular' CHECK (season_type IN ('preseason', 'regular', 'postseason')),
  broadcast TEXT,
  weather JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_games_sport ON public.games(sport);
CREATE INDEX IF NOT EXISTS idx_games_scheduled ON public.games(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_games_status ON public.games(status);
CREATE INDEX IF NOT EXISTS idx_games_sport_date ON public.games(sport, scheduled_at);

-- ===========================================
-- ODDS & BETTING LINES
-- ===========================================

CREATE TABLE IF NOT EXISTS public.odds (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  game_id UUID REFERENCES public.games(id) ON DELETE CASCADE,
  sportsbook TEXT NOT NULL,
  spread_home DECIMAL(5,2),
  spread_away DECIMAL(5,2),
  spread_home_odds INTEGER,
  spread_away_odds INTEGER,
  moneyline_home INTEGER,
  moneyline_away INTEGER,
  total_line DECIMAL(5,2),
  total_over_odds INTEGER,
  total_under_odds INTEGER,
  fetched_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(game_id, sportsbook, fetched_at)
);

CREATE INDEX IF NOT EXISTS idx_odds_game ON public.odds(game_id);
CREATE INDEX IF NOT EXISTS idx_odds_sportsbook ON public.odds(sportsbook);

CREATE TABLE IF NOT EXISTS public.odds_history (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  game_id UUID REFERENCES public.games(id) ON DELETE CASCADE,
  sportsbook TEXT NOT NULL,
  line_type TEXT NOT NULL CHECK (line_type IN ('spread', 'total', 'moneyline')),
  old_value DECIMAL(10,2),
  new_value DECIMAL(10,2),
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_odds_history_game ON public.odds_history(game_id);

-- ===========================================
-- BETTING TRENDS & PUBLIC DATA
-- ===========================================

CREATE TABLE IF NOT EXISTS public.betting_splits (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  game_id UUID REFERENCES public.games(id) ON DELETE CASCADE,
  spread_home_pct INTEGER,
  spread_away_pct INTEGER,
  moneyline_home_pct INTEGER,
  moneyline_away_pct INTEGER,
  total_over_pct INTEGER,
  total_under_pct INTEGER,
  ticket_count INTEGER,
  money_pct_spread_home INTEGER,
  money_pct_total_over INTEGER,
  source TEXT,
  fetched_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_betting_splits_game ON public.betting_splits(game_id);

-- Team ATS/OU records
CREATE TABLE IF NOT EXISTS public.team_records (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
  season_year INTEGER NOT NULL,
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  ties INTEGER DEFAULT 0,
  ats_wins INTEGER DEFAULT 0,
  ats_losses INTEGER DEFAULT 0,
  ats_pushes INTEGER DEFAULT 0,
  over_wins INTEGER DEFAULT 0,
  under_wins INTEGER DEFAULT 0,
  ou_pushes INTEGER DEFAULT 0,
  home_ats_wins INTEGER DEFAULT 0,
  home_ats_losses INTEGER DEFAULT 0,
  away_ats_wins INTEGER DEFAULT 0,
  away_ats_losses INTEGER DEFAULT 0,
  favorite_ats_wins INTEGER DEFAULT 0,
  favorite_ats_losses INTEGER DEFAULT 0,
  underdog_ats_wins INTEGER DEFAULT 0,
  underdog_ats_losses INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(team_id, season_year)
);

CREATE INDEX IF NOT EXISTS idx_team_records_team ON public.team_records(team_id);

-- ===========================================
-- AI PICKS & PREDICTIONS
-- ===========================================

CREATE TABLE IF NOT EXISTS public.ai_picks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  game_id UUID REFERENCES public.games(id) ON DELETE CASCADE,
  pick_type TEXT NOT NULL CHECK (pick_type IN ('spread', 'total', 'moneyline', 'prop')),
  pick_value TEXT NOT NULL,
  confidence INTEGER CHECK (confidence >= 0 AND confidence <= 100),
  reasoning TEXT,
  factors JSONB,
  model_version TEXT,
  is_best_bet BOOLEAN DEFAULT FALSE,
  result TEXT CHECK (result IN ('win', 'loss', 'push', 'pending')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_picks_game ON public.ai_picks(game_id);
CREATE INDEX IF NOT EXISTS idx_ai_picks_result ON public.ai_picks(result);

-- ===========================================
-- PREDICTION MARKETS
-- ===========================================

CREATE TABLE IF NOT EXISTS public.prediction_markets (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  external_id TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('polymarket', 'kalshi')),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  subcategory TEXT,
  image_url TEXT,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'closed', 'resolved')),
  resolution TEXT,
  end_date TIMESTAMPTZ,
  volume DECIMAL(15,2),
  liquidity DECIMAL(15,2),
  yes_price DECIMAL(5,4),
  no_price DECIMAL(5,4),
  num_traders INTEGER,
  is_sports_related BOOLEAN DEFAULT FALSE,
  related_game_id UUID REFERENCES public.games(id),
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(external_id, platform)
);

CREATE INDEX IF NOT EXISTS idx_prediction_markets_platform ON public.prediction_markets(platform);
CREATE INDEX IF NOT EXISTS idx_prediction_markets_category ON public.prediction_markets(category);
CREATE INDEX IF NOT EXISTS idx_prediction_markets_status ON public.prediction_markets(status);

CREATE TABLE IF NOT EXISTS public.market_price_history (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  market_id UUID REFERENCES public.prediction_markets(id) ON DELETE CASCADE,
  yes_price DECIMAL(5,4),
  no_price DECIMAL(5,4),
  volume_24h DECIMAL(15,2),
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_market_price_history_market ON public.market_price_history(market_id);
CREATE INDEX IF NOT EXISTS idx_market_price_history_time ON public.market_price_history(recorded_at);

-- ===========================================
-- INJURIES & NEWS
-- ===========================================

CREATE TABLE IF NOT EXISTS public.injuries (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  external_id TEXT,
  team_id UUID REFERENCES public.teams(id),
  player_name TEXT NOT NULL,
  player_position TEXT,
  injury_type TEXT,
  status TEXT CHECK (status IN ('out', 'doubtful', 'questionable', 'probable', 'day-to-day', 'ir')),
  description TEXT,
  expected_return DATE,
  impact_rating INTEGER CHECK (impact_rating >= 1 AND impact_rating <= 5),
  reported_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_injuries_team ON public.injuries(team_id);
CREATE INDEX IF NOT EXISTS idx_injuries_status ON public.injuries(status);

-- ===========================================
-- USER TRACKING & ANALYTICS
-- ===========================================

CREATE TABLE IF NOT EXISTS public.user_picks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  game_id UUID REFERENCES public.games(id),
  market_id UUID REFERENCES public.prediction_markets(id),
  pick_type TEXT NOT NULL,
  pick_value TEXT NOT NULL,
  odds_at_pick INTEGER,
  stake DECIMAL(10,2),
  result TEXT CHECK (result IN ('win', 'loss', 'push', 'pending')),
  payout DECIMAL(10,2),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_picks_user ON public.user_picks(user_id);
CREATE INDEX IF NOT EXISTS idx_user_picks_result ON public.user_picks(result);

-- ===========================================
-- TRENDS TABLE (for discovered betting trends)
-- ===========================================

CREATE TABLE IF NOT EXISTS public.trends (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  sport TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  conditions JSONB NOT NULL,
  win_count INTEGER DEFAULT 0,
  loss_count INTEGER DEFAULT 0,
  push_count INTEGER DEFAULT 0,
  win_pct DECIMAL(5,2),
  roi DECIMAL(6,2),
  units_won DECIMAL(10,2) DEFAULT 0,
  sample_size INTEGER DEFAULT 0,
  start_date DATE,
  end_date DATE,
  is_active BOOLEAN DEFAULT true,
  last_hit DATE,
  streak INTEGER DEFAULT 0,
  confidence_level TEXT DEFAULT 'medium',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_trends_sport ON public.trends(sport);
CREATE INDEX IF NOT EXISTS idx_trends_win_pct ON public.trends(win_pct DESC);
CREATE INDEX IF NOT EXISTS idx_trends_active ON public.trends(is_active);

-- ===========================================
-- ROW LEVEL SECURITY
-- ===========================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_favorite_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_picks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.odds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.betting_splits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_picks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prediction_markets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.injuries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trends ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist, then recreate
DO $$ 
BEGIN
  -- Profiles policies
  DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
  DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
  
  -- User favorites policies
  DROP POLICY IF EXISTS "Users can view their own favorites" ON public.user_favorite_teams;
  DROP POLICY IF EXISTS "Users can insert their own favorites" ON public.user_favorite_teams;
  DROP POLICY IF EXISTS "Users can delete their own favorites" ON public.user_favorite_teams;
  
  -- User picks policies
  DROP POLICY IF EXISTS "Users can view their own picks" ON public.user_picks;
  DROP POLICY IF EXISTS "Users can insert their own picks" ON public.user_picks;
  DROP POLICY IF EXISTS "Users can update their own picks" ON public.user_picks;
  
  -- Public data policies
  DROP POLICY IF EXISTS "Sports data is publicly readable" ON public.teams;
  DROP POLICY IF EXISTS "Games are publicly readable" ON public.games;
  DROP POLICY IF EXISTS "Odds are publicly readable" ON public.odds;
  DROP POLICY IF EXISTS "Betting splits are publicly readable" ON public.betting_splits;
  DROP POLICY IF EXISTS "Team records are publicly readable" ON public.team_records;
  DROP POLICY IF EXISTS "AI picks are publicly readable" ON public.ai_picks;
  DROP POLICY IF EXISTS "Prediction markets are publicly readable" ON public.prediction_markets;
  DROP POLICY IF EXISTS "Injuries are publicly readable" ON public.injuries;
  DROP POLICY IF EXISTS "Trends are publicly readable" ON public.trends;
END $$;

-- Recreate policies
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can view their own favorites" ON public.user_favorite_teams FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own favorites" ON public.user_favorite_teams FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own favorites" ON public.user_favorite_teams FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Users can view their own picks" ON public.user_picks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own picks" ON public.user_picks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own picks" ON public.user_picks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Sports data is publicly readable" ON public.teams FOR SELECT USING (true);
CREATE POLICY "Games are publicly readable" ON public.games FOR SELECT USING (true);
CREATE POLICY "Odds are publicly readable" ON public.odds FOR SELECT USING (true);
CREATE POLICY "Betting splits are publicly readable" ON public.betting_splits FOR SELECT USING (true);
CREATE POLICY "Team records are publicly readable" ON public.team_records FOR SELECT USING (true);
CREATE POLICY "AI picks are publicly readable" ON public.ai_picks FOR SELECT USING (true);
CREATE POLICY "Prediction markets are publicly readable" ON public.prediction_markets FOR SELECT USING (true);
CREATE POLICY "Injuries are publicly readable" ON public.injuries FOR SELECT USING (true);
CREATE POLICY "Trends are publicly readable" ON public.trends FOR SELECT USING (true);

-- ===========================================
-- FUNCTIONS & TRIGGERS
-- ===========================================

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers then recreate
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
DROP TRIGGER IF EXISTS update_teams_updated_at ON public.teams;
DROP TRIGGER IF EXISTS update_games_updated_at ON public.games;
DROP TRIGGER IF EXISTS update_prediction_markets_updated_at ON public.prediction_markets;
DROP TRIGGER IF EXISTS update_injuries_updated_at ON public.injuries;
DROP TRIGGER IF EXISTS update_trends_updated_at ON public.trends;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON public.teams FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_games_updated_at BEFORE UPDATE ON public.games FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_prediction_markets_updated_at BEFORE UPDATE ON public.prediction_markets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_injuries_updated_at BEFORE UPDATE ON public.injuries FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_trends_updated_at BEFORE UPDATE ON public.trends FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Function to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, username)
  VALUES (
    NEW.id,
    NEW.email,
    LOWER(SPLIT_PART(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ===========================================
-- VIEWS (drop and recreate safely)
-- ===========================================

DROP VIEW IF EXISTS public.upcoming_games_with_odds CASCADE;
DROP VIEW IF EXISTS public.ai_picks_performance CASCADE;
DROP VIEW IF EXISTS public.hot_prediction_markets CASCADE;

-- Create views in a DO block to handle type mismatches gracefully
DO $$ 
BEGIN
  -- Only create views if teams table has UUID id (our schema)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'teams' 
    AND column_name = 'id' 
    AND data_type = 'uuid'
  ) THEN
    EXECUTE '
      CREATE VIEW public.upcoming_games_with_odds AS
      SELECT 
        g.id,
        g.sport,
        g.scheduled_at,
        g.venue,
        g.status,
        ht.name AS home_team_name,
        ht.abbreviation AS home_team_abbr,
        ht.logo_url AS home_team_logo,
        at.name AS away_team_name,
        at.abbreviation AS away_team_abbr,
        at.logo_url AS away_team_logo,
        o.spread_home,
        o.spread_away,
        o.moneyline_home,
        o.moneyline_away,
        o.total_line,
        o.sportsbook
      FROM public.games g
      JOIN public.teams ht ON g.home_team_id = ht.id
      JOIN public.teams at ON g.away_team_id = at.id
      LEFT JOIN LATERAL (
        SELECT * FROM public.odds 
        WHERE game_id = g.id 
        ORDER BY fetched_at DESC 
        LIMIT 1
      ) o ON true
      WHERE g.status = ''scheduled'' AND g.scheduled_at > NOW()
      ORDER BY g.scheduled_at
    ';
    RAISE NOTICE 'Created upcoming_games_with_odds view';
  ELSE
    RAISE NOTICE 'Skipped upcoming_games_with_odds view - teams.id is not UUID type';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Could not create upcoming_games_with_odds view: %', SQLERRM;
END $$;

-- AI picks performance view (no team dependency)
CREATE OR REPLACE VIEW public.ai_picks_performance AS
SELECT 
  DATE_TRUNC('month', created_at) AS month,
  COUNT(*) AS total_picks,
  COUNT(*) FILTER (WHERE result = 'win') AS wins,
  COUNT(*) FILTER (WHERE result = 'loss') AS losses,
  COUNT(*) FILTER (WHERE result = 'push') AS pushes,
  ROUND(
    (COUNT(*) FILTER (WHERE result = 'win')::DECIMAL / 
     NULLIF(COUNT(*) FILTER (WHERE result IN ('win', 'loss')), 0)) * 100, 1
  ) AS win_percentage
FROM public.ai_picks
WHERE result IS NOT NULL AND result != 'pending'
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY month DESC;

-- Hot prediction markets view (no team dependency)
CREATE OR REPLACE VIEW public.hot_prediction_markets AS
SELECT *
FROM public.prediction_markets
WHERE status = 'open'
ORDER BY volume DESC, num_traders DESC
LIMIT 50;

-- ===========================================
-- SEED DATA
-- ===========================================

INSERT INTO public.teams (external_id, sport, name, abbreviation, city, conference, division) VALUES
('nfl_kc', 'NFL', 'Chiefs', 'KC', 'Kansas City', 'AFC', 'West'),
('nfl_buf', 'NFL', 'Bills', 'BUF', 'Buffalo', 'AFC', 'East'),
('nfl_phi', 'NFL', 'Eagles', 'PHI', 'Philadelphia', 'NFC', 'East'),
('nfl_sf', 'NFL', 'Niners', 'SF', 'San Francisco', 'NFC', 'West'),
('nfl_det', 'NFL', 'Lions', 'DET', 'Detroit', 'NFC', 'North'),
('nfl_gb', 'NFL', 'Packers', 'GB', 'Green Bay', 'NFC', 'North'),
('nfl_dal', 'NFL', 'Cowboys', 'DAL', 'Dallas', 'NFC', 'East'),
('nfl_bal', 'NFL', 'Ravens', 'BAL', 'Baltimore', 'AFC', 'North')
ON CONFLICT (external_id) DO NOTHING;

-- Grant service role full access for API updates
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
