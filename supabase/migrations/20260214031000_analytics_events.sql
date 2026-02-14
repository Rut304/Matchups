-- Analytics Events Table
-- Stores all client-side tracking events: page views, clicks, sessions, etc.

CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL,           -- 'pageview', 'click', 'session_start', 'page_exit'
  page TEXT NOT NULL,                 -- URL path
  session_id TEXT,                     -- Unique per browser session
  visitor_id TEXT,                     -- Persistent across sessions (localStorage)
  referrer TEXT,                       -- Where they came from
  
  -- Device info
  browser TEXT,
  os TEXT,
  is_mobile BOOLEAN DEFAULT false,
  is_tablet BOOLEAN DEFAULT false,
  screen_width INTEGER,
  screen_height INTEGER,
  viewport_width INTEGER,
  viewport_height INTEGER,
  language TEXT,
  timezone TEXT,
  
  -- Geo (from Vercel headers)
  country TEXT,
  region TEXT,
  city TEXT,
  ip_hash TEXT,                        -- Hashed IP for privacy (not raw IP)
  
  -- UTM tracking
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  
  -- Flexible event data (clicks, scroll depth, time on page, etc.)
  event_data JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_analytics_event_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_created_at ON analytics_events(created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_page ON analytics_events(page);
CREATE INDEX IF NOT EXISTS idx_analytics_visitor ON analytics_events(visitor_id);
CREATE INDEX IF NOT EXISTS idx_analytics_session ON analytics_events(session_id);
CREATE INDEX IF NOT EXISTS idx_analytics_country ON analytics_events(country);

-- Composite index for date-range + type queries (most common)
CREATE INDEX IF NOT EXISTS idx_analytics_type_date ON analytics_events(event_type, created_at DESC);

-- RLS: Allow service role to insert (from API route)
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- Service role can do everything
CREATE POLICY "Service role full access" ON analytics_events
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Anon can insert (for tracking)
CREATE POLICY "Anon can insert analytics" ON analytics_events
  FOR INSERT
  WITH CHECK (true);

-- Anon can read (for admin dashboard - admin check is in API)
CREATE POLICY "Anon can read analytics" ON analytics_events
  FOR SELECT
  USING (true);
