-- Matchups Sports Betting Analytics Platform
-- Database Schema for Supabase (PostgreSQL)

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For text search

-- ===========================================
-- USERS & AUTHENTICATION
-- ===========================================

-- User profiles (extends Supabase auth.users)
CREATE TABLE public.profiles (
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
CREATE TABLE public.user_favorite_teams (
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
CREATE TABLE public.teams (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  external_id TEXT UNIQUE NOT NULL, -- ID from external API
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

-- Create index for fast sport-based lookups
CREATE INDEX idx_teams_sport ON public.teams(sport);

-- Games/Matchups
CREATE TABLE public.games (
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
  period TEXT, -- Current period/quarter/inning
  week_number INTEGER, -- For NFL
  season_year INTEGER NOT NULL,
  season_type TEXT DEFAULT 'regular' CHECK (season_type IN ('preseason', 'regular', 'postseason')),
  broadcast TEXT,
  weather JSONB, -- For outdoor sports
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for game queries
CREATE INDEX idx_games_sport ON public.games(sport);
CREATE INDEX idx_games_scheduled ON public.games(scheduled_at);
CREATE INDEX idx_games_status ON public.games(status);
CREATE INDEX idx_games_sport_date ON public.games(sport, scheduled_at);

-- ===========================================
-- ODDS & BETTING LINES
-- ===========================================

-- Current odds from various sportsbooks
CREATE TABLE public.odds (
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

-- Create index for game odds lookup
CREATE INDEX idx_odds_game ON public.odds(game_id);
CREATE INDEX idx_odds_sportsbook ON public.odds(sportsbook);

-- Historical odds movements (for trend analysis)
CREATE TABLE public.odds_history (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  game_id UUID REFERENCES public.games(id) ON DELETE CASCADE,
  sportsbook TEXT NOT NULL,
  line_type TEXT NOT NULL CHECK (line_type IN ('spread', 'total', 'moneyline')),
  old_value DECIMAL(10,2),
  new_value DECIMAL(10,2),
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_odds_history_game ON public.odds_history(game_id);

-- ===========================================
-- BETTING TRENDS & PUBLIC DATA
-- ===========================================

-- Public betting percentages
CREATE TABLE public.betting_splits (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  game_id UUID REFERENCES public.games(id) ON DELETE CASCADE,
  spread_home_pct INTEGER, -- Percentage on home spread
  spread_away_pct INTEGER,
  moneyline_home_pct INTEGER,
  moneyline_away_pct INTEGER,
  total_over_pct INTEGER,
  total_under_pct INTEGER,
  ticket_count INTEGER, -- Total tickets if available
  money_pct_spread_home INTEGER, -- Money % (sharp indicator)
  money_pct_total_over INTEGER,
  source TEXT,
  fetched_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_betting_splits_game ON public.betting_splits(game_id);

-- Team ATS/OU records
CREATE TABLE public.team_records (
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

CREATE INDEX idx_team_records_team ON public.team_records(team_id);

-- ===========================================
-- AI PICKS & PREDICTIONS
-- ===========================================

-- AI-generated predictions
CREATE TABLE public.ai_picks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  game_id UUID REFERENCES public.games(id) ON DELETE CASCADE,
  pick_type TEXT NOT NULL CHECK (pick_type IN ('spread', 'total', 'moneyline', 'prop')),
  pick_value TEXT NOT NULL, -- e.g., "KC -3", "OVER 48.5", "KC ML"
  confidence INTEGER CHECK (confidence >= 0 AND confidence <= 100),
  reasoning TEXT,
  factors JSONB, -- Breakdown of factors
  model_version TEXT,
  is_best_bet BOOLEAN DEFAULT FALSE,
  result TEXT CHECK (result IN ('win', 'loss', 'push', 'pending')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ai_picks_game ON public.ai_picks(game_id);
CREATE INDEX idx_ai_picks_result ON public.ai_picks(result);
CREATE INDEX idx_ai_picks_best_bet ON public.ai_picks(is_best_bet) WHERE is_best_bet = TRUE;

-- ===========================================
-- PREDICTION MARKETS
-- ===========================================

-- Polymarket/Kalshi markets
CREATE TABLE public.prediction_markets (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  external_id TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('polymarket', 'kalshi')),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  subcategory TEXT,
  image_url TEXT,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'closed', 'resolved')),
  resolution TEXT, -- 'yes', 'no', or percentage
  end_date TIMESTAMPTZ,
  volume DECIMAL(15,2),
  liquidity DECIMAL(15,2),
  yes_price DECIMAL(5,4), -- 0.0000 to 1.0000
  no_price DECIMAL(5,4),
  num_traders INTEGER,
  is_sports_related BOOLEAN DEFAULT FALSE,
  related_game_id UUID REFERENCES public.games(id),
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(external_id, platform)
);

CREATE INDEX idx_prediction_markets_platform ON public.prediction_markets(platform);
CREATE INDEX idx_prediction_markets_category ON public.prediction_markets(category);
CREATE INDEX idx_prediction_markets_status ON public.prediction_markets(status);
CREATE INDEX idx_prediction_markets_sports ON public.prediction_markets(is_sports_related) WHERE is_sports_related = TRUE;

-- Market price history
CREATE TABLE public.market_price_history (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  market_id UUID REFERENCES public.prediction_markets(id) ON DELETE CASCADE,
  yes_price DECIMAL(5,4),
  no_price DECIMAL(5,4),
  volume_24h DECIMAL(15,2),
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_market_price_history_market ON public.market_price_history(market_id);
CREATE INDEX idx_market_price_history_time ON public.market_price_history(recorded_at);

-- ===========================================
-- INJURIES & NEWS
-- ===========================================

-- Player injuries
CREATE TABLE public.injuries (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  external_id TEXT,
  team_id UUID REFERENCES public.teams(id),
  player_name TEXT NOT NULL,
  player_position TEXT,
  injury_type TEXT,
  status TEXT CHECK (status IN ('out', 'doubtful', 'questionable', 'probable', 'day-to-day', 'ir')),
  description TEXT,
  expected_return DATE,
  impact_rating INTEGER CHECK (impact_rating >= 1 AND impact_rating <= 5), -- 1-5 scale
  reported_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_injuries_team ON public.injuries(team_id);
CREATE INDEX idx_injuries_status ON public.injuries(status);

-- ===========================================
-- USER TRACKING & ANALYTICS
-- ===========================================

-- User pick history
CREATE TABLE public.user_picks (
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

CREATE INDEX idx_user_picks_user ON public.user_picks(user_id);
CREATE INDEX idx_user_picks_result ON public.user_picks(result);

-- ===========================================
-- ROW LEVEL SECURITY
-- ===========================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_favorite_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_picks ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can read all profiles, but only update their own
CREATE POLICY "Public profiles are viewable by everyone" 
  ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile" 
  ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- User favorites: Users can only see/modify their own
CREATE POLICY "Users can view their own favorites" 
  ON public.user_favorite_teams FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own favorites" 
  ON public.user_favorite_teams FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own favorites" 
  ON public.user_favorite_teams FOR DELETE USING (auth.uid() = user_id);

-- User picks: Users can only see/modify their own
CREATE POLICY "Users can view their own picks" 
  ON public.user_picks FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own picks" 
  ON public.user_picks FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own picks" 
  ON public.user_picks FOR UPDATE USING (auth.uid() = user_id);

-- Public read access for sports data
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.odds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.betting_splits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_picks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prediction_markets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.injuries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sports data is publicly readable" ON public.teams FOR SELECT USING (true);
CREATE POLICY "Games are publicly readable" ON public.games FOR SELECT USING (true);
CREATE POLICY "Odds are publicly readable" ON public.odds FOR SELECT USING (true);
CREATE POLICY "Betting splits are publicly readable" ON public.betting_splits FOR SELECT USING (true);
CREATE POLICY "Team records are publicly readable" ON public.team_records FOR SELECT USING (true);
CREATE POLICY "AI picks are publicly readable" ON public.ai_picks FOR SELECT USING (true);
CREATE POLICY "Prediction markets are publicly readable" ON public.prediction_markets FOR SELECT USING (true);
CREATE POLICY "Injuries are publicly readable" ON public.injuries FOR SELECT USING (true);

-- ===========================================
-- FUNCTIONS & TRIGGERS
-- ===========================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to tables with updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_teams_updated_at
  BEFORE UPDATE ON public.teams
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_games_updated_at
  BEFORE UPDATE ON public.games
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_prediction_markets_updated_at
  BEFORE UPDATE ON public.prediction_markets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_injuries_updated_at
  BEFORE UPDATE ON public.injuries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Function to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, username)
  VALUES (
    NEW.id,
    NEW.email,
    LOWER(SPLIT_PART(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ===========================================
-- VIEWS FOR COMMON QUERIES
-- ===========================================

-- View: Upcoming games with odds
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
WHERE g.status = 'scheduled' AND g.scheduled_at > NOW()
ORDER BY g.scheduled_at;

-- View: AI picks performance
CREATE VIEW public.ai_picks_performance AS
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

-- View: Hot prediction markets
CREATE VIEW public.hot_prediction_markets AS
SELECT *
FROM public.prediction_markets
WHERE status = 'open'
ORDER BY volume DESC, num_traders DESC
LIMIT 50;

-- ===========================================
-- SEED DATA (Optional - for development)
-- ===========================================

-- Insert NFL teams
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
