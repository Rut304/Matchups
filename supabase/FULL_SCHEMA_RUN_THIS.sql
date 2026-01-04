-- ===========================================
-- MATCHUPS FULL DATABASE SCHEMA
-- Run this in your Supabase SQL Editor
-- Project: Matchups (cdfdmkntdsfylososgwo)
-- ===========================================

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
  period TEXT,
  week_number INTEGER,
  season_year INTEGER NOT NULL,
  season_type TEXT DEFAULT 'regular' CHECK (season_type IN ('preseason', 'regular', 'postseason')),
  broadcast TEXT,
  weather JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_games_sport ON public.games(sport);
CREATE INDEX idx_games_scheduled ON public.games(scheduled_at);
CREATE INDEX idx_games_status ON public.games(status);
CREATE INDEX idx_games_sport_date ON public.games(sport, scheduled_at);

-- ===========================================
-- ODDS & BETTING LINES
-- ===========================================

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

CREATE INDEX idx_odds_game ON public.odds(game_id);
CREATE INDEX idx_odds_sportsbook ON public.odds(sportsbook);

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

CREATE TABLE public.betting_splits (
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

CREATE INDEX idx_betting_splits_game ON public.betting_splits(game_id);

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

CREATE TABLE public.ai_picks (
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

CREATE INDEX idx_ai_picks_game ON public.ai_picks(game_id);
CREATE INDEX idx_ai_picks_result ON public.ai_picks(result);
CREATE INDEX idx_ai_picks_best_bet ON public.ai_picks(is_best_bet) WHERE is_best_bet = TRUE;

-- ===========================================
-- PREDICTION MARKETS
-- ===========================================

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

CREATE INDEX idx_prediction_markets_platform ON public.prediction_markets(platform);
CREATE INDEX idx_prediction_markets_category ON public.prediction_markets(category);
CREATE INDEX idx_prediction_markets_status ON public.prediction_markets(status);
CREATE INDEX idx_prediction_markets_sports ON public.prediction_markets(is_sports_related) WHERE is_sports_related = TRUE;

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
  impact_rating INTEGER CHECK (impact_rating >= 1 AND impact_rating <= 5),
  reported_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_injuries_team ON public.injuries(team_id);
CREATE INDEX idx_injuries_status ON public.injuries(status);

-- ===========================================
-- USER TRACKING & ANALYTICS
-- ===========================================

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
-- LEADERBOARD & CAPPER TRACKING
-- ===========================================

CREATE TABLE public.cappers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  avatar_emoji TEXT DEFAULT '🎯',
  avatar_url TEXT,
  verified BOOLEAN DEFAULT FALSE,
  capper_type TEXT NOT NULL CHECK (capper_type IN ('celebrity', 'pro', 'community', 'ai')),
  network TEXT,
  role TEXT,
  twitter_handle TEXT,
  followers_count TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  is_featured BOOLEAN DEFAULT FALSE,
  bio TEXT,
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_cappers_slug ON public.cappers(slug);
CREATE INDEX idx_cappers_type ON public.cappers(capper_type);
CREATE INDEX idx_cappers_network ON public.cappers(network);
CREATE INDEX idx_cappers_active ON public.cappers(is_active) WHERE is_active = TRUE;

-- Bet types enum
CREATE TYPE bet_type AS ENUM (
  'spread', 'moneyline', 'over_under', 'prop', 'parlay', 'teaser', 'futures'
);

-- Capper picks
CREATE TABLE public.picks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  capper_id UUID REFERENCES public.cappers(id) ON DELETE CASCADE NOT NULL,
  game_id UUID REFERENCES public.games(id) ON DELETE SET NULL,
  sport TEXT NOT NULL CHECK (sport IN ('NFL', 'NBA', 'NHL', 'MLB', 'NCAAF', 'NCAAB', 'Soccer', 'Other')),
  event_name TEXT,
  bet_type bet_type NOT NULL,
  pick_description TEXT NOT NULL,
  team_picked TEXT,
  spread_line DECIMAL(5,2),
  moneyline_odds INTEGER,
  total_line DECIMAL(5,2),
  over_under TEXT CHECK (over_under IN ('over', 'under')),
  prop_type TEXT,
  prop_player TEXT,
  prop_line DECIMAL(6,2),
  parlay_legs JSONB,
  parlay_odds INTEGER,
  units DECIMAL(4,2) DEFAULT 1.0,
  picked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  game_date DATE,
  odds_at_pick INTEGER,
  source_url TEXT,
  source_type TEXT CHECK (source_type IN ('tv', 'podcast', 'twitter', 'article', 'manual', 'other')),
  result TEXT CHECK (result IN ('win', 'loss', 'push', 'pending', 'void')),
  result_notes TEXT,
  settled_at TIMESTAMPTZ,
  verified_by UUID REFERENCES auth.users(id),
  verified_at TIMESTAMPTZ,
  admin_notes TEXT,
  is_hidden BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_picks_capper ON public.picks(capper_id);
CREATE INDEX idx_picks_sport ON public.picks(sport);
CREATE INDEX idx_picks_bet_type ON public.picks(bet_type);
CREATE INDEX idx_picks_result ON public.picks(result);
CREATE INDEX idx_picks_game ON public.picks(game_id);
CREATE INDEX idx_picks_date ON public.picks(picked_at);
CREATE INDEX idx_picks_capper_sport ON public.picks(capper_id, sport);
CREATE INDEX idx_picks_capper_type ON public.picks(capper_id, bet_type);

-- Capper stats
CREATE TABLE public.capper_stats (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
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

CREATE INDEX idx_capper_stats_rank ON public.capper_stats(overall_rank);
CREATE INDEX idx_capper_stats_units ON public.capper_stats(net_units DESC);

CREATE TABLE public.capper_stats_by_sport (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  capper_id UUID REFERENCES public.cappers(id) ON DELETE CASCADE NOT NULL,
  sport TEXT NOT NULL CHECK (sport IN ('NFL', 'NBA', 'NHL', 'MLB', 'NCAAF', 'NCAAB', 'Soccer', 'Other')),
  total_picks INTEGER DEFAULT 0,
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  pushes INTEGER DEFAULT 0,
  win_percentage DECIMAL(5,2) DEFAULT 0,
  net_units DECIMAL(10,2) DEFAULT 0,
  roi_percentage DECIMAL(6,2) DEFAULT 0,
  computed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(capper_id, sport)
);

CREATE INDEX idx_capper_stats_sport_capper ON public.capper_stats_by_sport(capper_id);

CREATE TABLE public.capper_stats_by_bet_type (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  capper_id UUID REFERENCES public.cappers(id) ON DELETE CASCADE NOT NULL,
  bet_type bet_type NOT NULL,
  total_picks INTEGER DEFAULT 0,
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  pushes INTEGER DEFAULT 0,
  win_percentage DECIMAL(5,2) DEFAULT 0,
  net_units DECIMAL(10,2) DEFAULT 0,
  roi_percentage DECIMAL(6,2) DEFAULT 0,
  computed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(capper_id, bet_type)
);

CREATE INDEX idx_capper_stats_bet_type_capper ON public.capper_stats_by_bet_type(capper_id);

-- Audit trail
CREATE TABLE public.record_modifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  capper_id UUID REFERENCES public.cappers(id) ON DELETE CASCADE,
  pick_id UUID REFERENCES public.picks(id) ON DELETE SET NULL,
  modification_type TEXT NOT NULL CHECK (modification_type IN ('add_pick', 'edit_pick', 'delete_pick', 'change_result', 'bulk_update', 'manual_adjustment')),
  field_changed TEXT,
  old_value TEXT,
  new_value TEXT,
  reason TEXT,
  modified_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_record_mods_capper ON public.record_modifications(capper_id);
CREATE INDEX idx_record_mods_pick ON public.record_modifications(pick_id);

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
ALTER TABLE public.cappers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.picks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.capper_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.capper_stats_by_sport ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.capper_stats_by_bet_type ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.record_modifications ENABLE ROW LEVEL SECURITY;

-- User policies
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can view their own favorites" ON public.user_favorite_teams FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own favorites" ON public.user_favorite_teams FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own favorites" ON public.user_favorite_teams FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Users can view their own picks" ON public.user_picks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own picks" ON public.user_picks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own picks" ON public.user_picks FOR UPDATE USING (auth.uid() = user_id);

-- Public read policies
CREATE POLICY "Sports data is publicly readable" ON public.teams FOR SELECT USING (true);
CREATE POLICY "Games are publicly readable" ON public.games FOR SELECT USING (true);
CREATE POLICY "Odds are publicly readable" ON public.odds FOR SELECT USING (true);
CREATE POLICY "Betting splits are publicly readable" ON public.betting_splits FOR SELECT USING (true);
CREATE POLICY "Team records are publicly readable" ON public.team_records FOR SELECT USING (true);
CREATE POLICY "AI picks are publicly readable" ON public.ai_picks FOR SELECT USING (true);
CREATE POLICY "Prediction markets are publicly readable" ON public.prediction_markets FOR SELECT USING (true);
CREATE POLICY "Injuries are publicly readable" ON public.injuries FOR SELECT USING (true);
CREATE POLICY "Public can view cappers" ON public.cappers FOR SELECT USING (is_active = TRUE);
CREATE POLICY "Public can view picks" ON public.picks FOR SELECT USING (is_hidden = FALSE);
CREATE POLICY "Public can view stats" ON public.capper_stats FOR SELECT USING (TRUE);
CREATE POLICY "Public can view sport stats" ON public.capper_stats_by_sport FOR SELECT USING (TRUE);
CREATE POLICY "Public can view bet type stats" ON public.capper_stats_by_bet_type FOR SELECT USING (TRUE);

-- Admin policies
CREATE POLICY "Admins can manage cappers" ON public.cappers FOR ALL USING (
  auth.jwt() ->> 'role' = 'admin' OR auth.jwt() -> 'user_metadata' ->> 'is_admin' = 'true'
);
CREATE POLICY "Admins can manage picks" ON public.picks FOR ALL USING (
  auth.jwt() ->> 'role' = 'admin' OR auth.jwt() -> 'user_metadata' ->> 'is_admin' = 'true'
);
CREATE POLICY "Admins can view modifications" ON public.record_modifications FOR SELECT USING (
  auth.jwt() ->> 'role' = 'admin' OR auth.jwt() -> 'user_metadata' ->> 'is_admin' = 'true'
);

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

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON public.teams FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_games_updated_at BEFORE UPDATE ON public.games FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_prediction_markets_updated_at BEFORE UPDATE ON public.prediction_markets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_injuries_updated_at BEFORE UPDATE ON public.injuries FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, username)
  VALUES (NEW.id, NEW.email, LOWER(SPLIT_PART(NEW.email, '@', 1)));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Capper stats computation
CREATE OR REPLACE FUNCTION compute_capper_stats(p_capper_id UUID)
RETURNS void AS $$
DECLARE
  v_wins INTEGER;
  v_losses INTEGER;
  v_pushes INTEGER;
  v_total INTEGER;
  v_units_won DECIMAL;
  v_units_wagered DECIMAL;
  v_streak TEXT;
BEGIN
  SELECT 
    COUNT(*) FILTER (WHERE result = 'win'),
    COUNT(*) FILTER (WHERE result = 'loss'),
    COUNT(*) FILTER (WHERE result = 'push'),
    COUNT(*) FILTER (WHERE result IN ('win', 'loss', 'push')),
    COALESCE(SUM(CASE 
      WHEN result = 'win' THEN units * (CASE WHEN odds_at_pick > 0 THEN odds_at_pick::decimal/100 ELSE 100.0/ABS(odds_at_pick) END)
      WHEN result = 'loss' THEN -units
      ELSE 0 
    END), 0),
    COALESCE(SUM(units) FILTER (WHERE result IN ('win', 'loss')), 0)
  INTO v_wins, v_losses, v_pushes, v_total, v_units_won, v_units_wagered
  FROM public.picks
  WHERE capper_id = p_capper_id AND result IS NOT NULL;
  
  SELECT 
    CASE 
      WHEN result = 'win' THEN 'W' || COUNT(*)
      WHEN result = 'loss' THEN 'L' || COUNT(*)
      ELSE 'P' || COUNT(*)
    END
  INTO v_streak
  FROM (
    SELECT result, 
           SUM(CASE WHEN result != LAG(result) OVER (ORDER BY picked_at DESC) THEN 1 ELSE 0 END) OVER (ORDER BY picked_at DESC) as grp
    FROM public.picks 
    WHERE capper_id = p_capper_id AND result IN ('win', 'loss', 'push')
    ORDER BY picked_at DESC
  ) sub
  WHERE grp = 0
  GROUP BY result
  LIMIT 1;
  
  INSERT INTO public.capper_stats (
    capper_id, total_picks, total_wins, total_losses, total_pushes,
    win_percentage, total_units_wagered, total_units_won, net_units, roi_percentage,
    current_streak, computed_at
  ) VALUES (
    p_capper_id, v_total, v_wins, v_losses, v_pushes,
    CASE WHEN (v_wins + v_losses) > 0 THEN ROUND(v_wins::decimal / (v_wins + v_losses) * 100, 1) ELSE 0 END,
    v_units_wagered, v_units_won, ROUND(v_units_won, 1),
    CASE WHEN v_units_wagered > 0 THEN ROUND(v_units_won / v_units_wagered * 100, 1) ELSE 0 END,
    COALESCE(v_streak, 'N/A'), NOW()
  )
  ON CONFLICT (capper_id) DO UPDATE SET
    total_picks = EXCLUDED.total_picks,
    total_wins = EXCLUDED.total_wins,
    total_losses = EXCLUDED.total_losses,
    total_pushes = EXCLUDED.total_pushes,
    win_percentage = EXCLUDED.win_percentage,
    total_units_wagered = EXCLUDED.total_units_wagered,
    total_units_won = EXCLUDED.total_units_won,
    net_units = EXCLUDED.net_units,
    roi_percentage = EXCLUDED.roi_percentage,
    current_streak = EXCLUDED.current_streak,
    computed_at = NOW();
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION trigger_update_capper_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM compute_capper_stats(OLD.capper_id);
    RETURN OLD;
  ELSE
    PERFORM compute_capper_stats(NEW.capper_id);
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER picks_stats_update AFTER INSERT OR UPDATE OR DELETE ON public.picks FOR EACH ROW EXECUTE FUNCTION trigger_update_capper_stats();

-- ===========================================
-- VIEWS
-- ===========================================

CREATE OR REPLACE VIEW public.leaderboard AS
SELECT 
  c.id, c.slug, c.name, c.avatar_emoji, c.avatar_url, c.verified,
  c.capper_type, c.network, c.role, c.followers_count,
  cs.total_picks, cs.total_wins, cs.total_losses, cs.total_pushes,
  cs.win_percentage, cs.net_units, cs.roi_percentage,
  cs.current_streak, cs.overall_rank, cs.rank_change, cs.last_pick_at
FROM public.cappers c
LEFT JOIN public.capper_stats cs ON c.id = cs.capper_id
WHERE c.is_active = TRUE
ORDER BY cs.net_units DESC NULLS LAST;

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

-- ===========================================
-- DONE! Your Matchups database is ready.
-- ===========================================
