// =============================================================================
// ENVIRONMENT CONFIGURATION
// Uses Vercel Environment Variables for production (set in Vercel Dashboard)
// Fallback to process.env for local development
// =============================================================================

// API Configuration - Set these in Vercel Dashboard > Settings > Environment Variables
export const config = {
  // Sports Data APIs
  theOddsApi: {
    key: process.env.ODDS_API_KEY || process.env.THE_ODDS_API_KEY || '',
    baseUrl: 'https://api.the-odds-api.com/v4',
  },
  apiSports: {
    key: process.env.API_SPORTS_KEY || '',
    nflUrl: 'https://v1.american-football.api-sports.io',
    nbaUrl: 'https://v1.basketball.api-sports.io',
    nhlUrl: 'https://v1.hockey.api-sports.io',
    mlbUrl: 'https://v1.baseball.api-sports.io',
    ncaafUrl: 'https://v1.american-football.api-sports.io',
    ncaabUrl: 'https://v1.basketball.api-sports.io',
  },
  
  // Prediction Markets (mostly public/free)
  polymarket: {
    baseUrl: 'https://gamma-api.polymarket.com', // FREE - No auth needed
    clobUrl: 'https://clob.polymarket.com',
  },
  kalshi: {
    baseUrl: 'https://api.elections.kalshi.com/trade-api/v2',
    wsUrl: 'wss://api.elections.kalshi.com/trade-api/ws/v2',
  },
  
  // Free/Public Sports APIs (no key needed)
  espn: {
    baseUrl: 'https://site.api.espn.com/apis/site/v2/sports',
  },
  ballDontLie: {
    baseUrl: 'https://api.balldontlie.io/v1', // NBA stats - free tier
  },
  nhlApi: {
    baseUrl: 'https://api-web.nhle.com/v1', // Official NHL API - free
  },
  mlbStats: {
    baseUrl: 'https://statsapi.mlb.com/api/v1', // Official MLB API - free
  },
  
  // Supabase (for data storage & user auth)
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  },
  
  // Feature Flags
  features: {
    liveOdds: process.env.ENABLE_LIVE_ODDS === 'true',
    predictions: process.env.ENABLE_PREDICTIONS === 'true',
    userAuth: process.env.ENABLE_USER_AUTH === 'true',
  }
}

// Helper to check if API is configured
export const isConfigured = {
  theOddsApi: () => !!config.theOddsApi.key,
  apiSports: () => !!config.apiSports.key,
  supabase: () => !!config.supabase.url && !!config.supabase.anonKey,
}

// =============================================================================
// VERCEL ENVIRONMENT VARIABLES SETUP GUIDE
// =============================================================================
// 
// Go to: https://vercel.com/[your-username]/matchups/settings/environment-variables
// 
// Add these variables:
// 
// THE_ODDS_API_KEY       - Get from https://the-odds-api.com (500 free requests/month)
// API_SPORTS_KEY         - Get from https://api-sports.io (100 free requests/day)
// NEXT_PUBLIC_SUPABASE_URL      - Your Supabase project URL
// NEXT_PUBLIC_SUPABASE_ANON_KEY - Your Supabase anon key
// ENABLE_LIVE_ODDS       - "true" to enable live odds features
// ENABLE_PREDICTIONS     - "true" to enable AI predictions
// ENABLE_USER_AUTH       - "true" to enable user authentication
//
// =============================================================================
