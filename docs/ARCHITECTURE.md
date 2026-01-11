# Matchups - Complete System Architecture & Data Flow

> **Last Updated**: January 11, 2026  
> **Production URL**: https://matchups.vercel.app

---

## 📊 System Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           MATCHUPS ARCHITECTURE                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌───────────┐ │
│  │   ESPN API   │    │  Odds API    │    │  Twitter/X   │    │ Polymarket│ │
│  │   (Games)    │    │  (Lines)     │    │  (News)      │    │ (Markets) │ │
│  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘    └─────┬─────┘ │
│         │                   │                   │                  │        │
│         ▼                   ▼                   ▼                  ▼        │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                    NEXT.JS API ROUTES (/api/*)                        │  │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────────────┐ │  │
│  │  │ /games  │ │ /odds   │ │ /news   │ │/markets │ │ /cron/* (8 jobs)│ │  │
│  │  └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘ └────────┬────────┘ │  │
│  └───────┼───────────┼───────────┼───────────┼───────────────┼──────────┘  │
│          │           │           │           │               │             │
│          ▼           ▼           ▼           ▼               ▼             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                         SUPABASE (PostgreSQL)                         │  │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────────────┐ │  │
│  │  │ games   │ │  odds   │ │ cappers │ │ markets │ │ historical_data │ │  │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────────────┘ │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                    │                                        │
│                                    ▼                                        │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                    DATA PROCESSING LAYER                              │  │
│  │  ┌────────────────┐ ┌────────────────┐ ┌────────────────────────────┐│  │
│  │  │ Edge Analysis  │ │ Trend Finder   │ │ Line Movement Detection   ││  │
│  │  │ (ai-edge.ts)   │ │ (trends.ts)    │ │ (line-movement.ts)        ││  │
│  │  └────────────────┘ └────────────────┘ └────────────────────────────┘│  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                    │                                        │
│                                    ▼                                        │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                         FRONTEND (Next.js 16)                         │  │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────────────┐ │  │
│  │  │ Sports  │ │ Edge    │ │ Leader- │ │ Markets │ │ Dashboard       │ │  │
│  │  │ Pages   │ │ Finder  │ │ board   │ │         │ │                 │ │  │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────────────┘ │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🔌 External Data Sources

### 1. ESPN API (Primary Game Data)
| Endpoint | Data | Rate Limit | Cache |
|----------|------|------------|-------|
| `/scoreboard` | Live scores, game status | Unlimited | 30s |
| `/standings` | Team standings | Unlimited | 1hr |
| `/injuries` | Injury reports | Unlimited | 6hr |
| `/news` | Headlines | Unlimited | 15min |

**File**: `src/lib/api/espn.ts`

### 2. The Odds API (Betting Lines)
| Endpoint | Data | Rate Limit | Cache |
|----------|------|------------|-------|
| `/odds` | Spreads, totals, moneylines | 500/month | 5min |
| `/historical` | Line movement | 500/month | 1hr |

**File**: `src/lib/api/odds.ts`  
**API Key**: `ODDS_API_KEY`

### 3. Twitter/X API (Social/News)
| Endpoint | Data | Rate Limit | Cache |
|----------|------|------------|-------|
| `/tweets/search/recent` | Breaking news | 450/15min | 5min |
| `/users/{id}/tweets` | Account feeds | 1500/15min | 5min |

**File**: `src/lib/api/twitter.ts`  
**API Key**: `X_BEARER_TOKEN`

### 4. Prediction Markets
| Source | Data | Rate Limit | Cache |
|--------|------|------------|-------|
| Polymarket | Sports/Politics odds | Unlimited | 5min |
| Kalshi | Event contracts | Unlimited | 5min |

**File**: `src/lib/prediction-market-data.ts`

---

## 🗄️ Database Schema (Supabase)

### Core Tables

```sql
-- Games & Scores
CREATE TABLE games (
  id UUID PRIMARY KEY,
  sport VARCHAR(10),
  home_team_id VARCHAR(50),
  away_team_id VARCHAR(50),
  home_score INTEGER,
  away_score INTEGER,
  status VARCHAR(20),        -- scheduled, in_progress, final
  scheduled_at TIMESTAMPTZ,
  venue VARCHAR(255),
  broadcast VARCHAR(100),
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);

-- Betting Odds
CREATE TABLE odds (
  id UUID PRIMARY KEY,
  game_id UUID REFERENCES games(id),
  sportsbook VARCHAR(50),
  spread DECIMAL(4,1),
  spread_odds INTEGER,
  total DECIMAL(4,1),
  over_odds INTEGER,
  under_odds INTEGER,
  home_ml INTEGER,
  away_ml INTEGER,
  timestamp TIMESTAMPTZ
);

-- Line History (for movement tracking)
CREATE TABLE odds_history (
  id UUID PRIMARY KEY,
  game_id UUID REFERENCES games(id),
  sportsbook VARCHAR(50),
  spread DECIMAL(4,1),
  total DECIMAL(4,1),
  recorded_at TIMESTAMPTZ
);

-- Betting Splits (public vs sharp)
CREATE TABLE betting_splits (
  id UUID PRIMARY KEY,
  game_id UUID REFERENCES games(id),
  spread_public_pct INTEGER,
  spread_money_pct INTEGER,
  total_over_pct INTEGER,
  total_money_over_pct INTEGER,
  timestamp TIMESTAMPTZ
);
```

### Cappers/Leaderboard Tables

```sql
-- Capper Profiles
CREATE TABLE cappers (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  username VARCHAR(50) UNIQUE,
  display_name VARCHAR(100),
  bio TEXT,
  avatar_url TEXT,
  twitter_handle VARCHAR(50),
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ
);

-- Individual Picks
CREATE TABLE picks (
  id UUID PRIMARY KEY,
  capper_id UUID REFERENCES cappers(id),
  game_id UUID REFERENCES games(id),
  sport VARCHAR(10),
  pick_type VARCHAR(20),    -- spread, total, ml
  pick_value VARCHAR(50),   -- "Bills -3", "Over 45.5"
  odds INTEGER,
  units DECIMAL(3,1),
  result VARCHAR(10),       -- win, loss, push, pending
  created_at TIMESTAMPTZ,
  graded_at TIMESTAMPTZ
);

-- Aggregated Stats (materialized for performance)
CREATE TABLE capper_stats (
  capper_id UUID PRIMARY KEY REFERENCES cappers(id),
  total_picks INTEGER,
  wins INTEGER,
  losses INTEGER,
  pushes INTEGER,
  win_pct DECIMAL(5,2),
  units_won DECIMAL(8,2),
  roi DECIMAL(5,2),
  current_streak INTEGER,
  best_streak INTEGER,
  updated_at TIMESTAMPTZ
);

-- Stats by Sport
CREATE TABLE capper_stats_by_sport (
  id UUID PRIMARY KEY,
  capper_id UUID REFERENCES cappers(id),
  sport VARCHAR(10),
  picks INTEGER,
  wins INTEGER,
  losses INTEGER,
  win_pct DECIMAL(5,2),
  units DECIMAL(8,2),
  roi DECIMAL(5,2)
);
```

### Prediction Markets Tables

```sql
-- Market Data
CREATE TABLE prediction_markets (
  id UUID PRIMARY KEY,
  source VARCHAR(20),       -- polymarket, kalshi
  external_id VARCHAR(100),
  title TEXT,
  category VARCHAR(50),
  yes_price DECIMAL(5,2),
  no_price DECIMAL(5,2),
  volume DECIMAL(15,2),
  liquidity DECIMAL(15,2),
  end_date TIMESTAMPTZ,
  resolved BOOLEAN,
  resolution VARCHAR(10),
  updated_at TIMESTAMPTZ
);

-- Price History
CREATE TABLE market_price_history (
  id UUID PRIMARY KEY,
  market_id UUID REFERENCES prediction_markets(id),
  yes_price DECIMAL(5,2),
  volume_24h DECIMAL(15,2),
  recorded_at TIMESTAMPTZ
);
```

### Historical Trends Tables

```sql
-- Discovered Trends
CREATE TABLE historical_trends (
  trend_id UUID PRIMARY KEY,
  trend_name VARCHAR(255),
  sport VARCHAR(10),
  category VARCHAR(50),
  bet_type VARCHAR(20),
  hot_streak BOOLEAN,
  confidence_score DECIMAL(5,2),
  l30_record VARCHAR(20),
  l30_roi DECIMAL(5,2),
  all_time_record VARCHAR(20),
  all_time_roi DECIMAL(5,2),
  all_time_sample_size INTEGER,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);

-- AI-Generated Picks
CREATE TABLE ai_picks (
  id UUID PRIMARY KEY,
  game_id UUID REFERENCES games(id),
  sport VARCHAR(10),
  pick_type VARCHAR(20),
  pick VARCHAR(100),
  confidence INTEGER,
  reasoning TEXT,
  trends_used JSONB,
  created_at TIMESTAMPTZ
);
```

---

## ⚡ API Routes

### Game Data
| Route | Method | Description | Data Source |
|-------|--------|-------------|-------------|
| `/api/games` | GET | All games by sport/date | ESPN + Odds API |
| `/api/games/[id]` | GET | Single game details | ESPN + Odds API |
| `/api/scores` | GET | Live scores | ESPN |
| `/api/live` | GET | In-progress games | ESPN |

### Betting Data
| Route | Method | Description | Data Source |
|-------|--------|-------------|-------------|
| `/api/odds` | GET | Current odds | The Odds API |
| `/api/lines` | GET | Line comparison | The Odds API |
| `/api/betting-splits` | GET | Public/sharp splits | Supabase |
| `/api/public-betting` | GET | Public % by game | Calculated |

### Analysis
| Route | Method | Description | Data Source |
|-------|--------|-------------|-------------|
| `/api/edges` | GET | Edge finder results | Algorithm |
| `/api/edges/today` | GET | Today's top edges | Algorithm |
| `/api/edge` | GET | Single edge detail | Algorithm |
| `/api/ou-analysis` | GET | Over/under analysis | Historical |
| `/api/trend-finder` | POST | Custom trend search | Supabase |
| `/api/line-predictor` | POST | Line movement AI | ML Model |

### Cappers/Leaderboard
| Route | Method | Description | Data Source |
|-------|--------|-------------|-------------|
| `/api/leaderboard` | GET | Top cappers | Supabase |
| `/api/cappers/[slug]` | GET | Capper profile | Supabase |
| `/api/picks` | GET/POST | User picks | Supabase |
| `/api/bets` | GET/POST | Bet tracking | Supabase |

### Markets
| Route | Method | Description | Data Source |
|-------|--------|-------------|-------------|
| `/api/markets` | GET | All prediction markets | Polymarket/Kalshi |
| `/api/markets/[id]` | GET | Market details | Polymarket/Kalshi |

### Cron Jobs (Scheduled Tasks)
| Route | Schedule | Description |
|-------|----------|-------------|
| `/api/cron/refresh-scores` | Every 2 min* | Update live scores |
| `/api/cron/refresh-odds` | Every 5 min | Fetch latest odds |
| `/api/cron/sync-games` | Every 15 min | Sync game schedule |
| `/api/cron/refresh-injuries` | Every 6 hrs | Update injury reports |
| `/api/cron/refresh-standings` | Every 6 hrs | Update standings |
| `/api/cron/grade-picks` | 3x daily | Grade completed picks |
| `/api/cron/discover-trends` | Daily | Run trend discovery |
| `/api/cron/update-scores` | Every 1 min* | Live score updates |

*Only during active game hours

---

## 🔄 Data Flow by Feature

### 1. Homepage Edge Cards
```
┌─────────────────────────────────────────────────────────────┐
│                    EDGE CARD DATA FLOW                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. Page Load                                                │
│     └─► EdgeDashboardWithFiltersWrapper (Server Component)   │
│                                                              │
│  2. Data Fetch                                               │
│     └─► GET /api/edges/today?limit=12&minScore=60           │
│                                                              │
│  3. API Route Processing                                     │
│     ├─► Fetch games from ESPN                               │
│     ├─► Fetch odds from The Odds API                        │
│     ├─► Fetch betting splits from Supabase                  │
│     └─► Run edge detection algorithm                        │
│                                                              │
│  4. Edge Detection Algorithm (ai-edge-analysis.ts)          │
│     ├─► Calculate line movement (RLM detection)             │
│     ├─► Compare public vs sharp money                       │
│     ├─► Match historical trends                             │
│     ├─► Score confidence (0-100)                            │
│     └─► Return sorted edges                                 │
│                                                              │
│  5. Render                                                   │
│     └─► EdgeDashboardFiltered (Client Component)            │
│         └─► EdgeCard components with filters                │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 2. Sport Matchups Page (NFL/NBA/NHL/MLB)
```
┌─────────────────────────────────────────────────────────────┐
│                  MATCHUPS PAGE DATA FLOW                     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. Page Load                                                │
│     └─► /nfl/matchups (Client Component)                    │
│                                                              │
│  2. useEffect Data Fetch                                     │
│     └─► GET /api/games?sport=nfl                            │
│                                                              │
│  3. API Route Processing (/api/games)                        │
│     ├─► Check cache (30 second TTL)                         │
│     ├─► If miss: ESPN API /scoreboard?sport=football        │
│     ├─► If miss: Odds API /odds?sport=americanfootball      │
│     └─► Merge & normalize response                          │
│                                                              │
│  4. Data Structure                                           │
│     {                                                        │
│       games: [                                               │
│         {                                                    │
│           id, status, scheduledAt, venue, broadcast,        │
│           homeTeam: { id, name, abbrev, logo, score },      │
│           awayTeam: { id, name, abbrev, logo, score },      │
│           odds: { spread, total, homeML, awayML }           │
│         }                                                    │
│       ]                                                      │
│     }                                                        │
│                                                              │
│  5. Auto-Refresh                                             │
│     └─► setInterval(fetchGames, 60000) // 1 minute          │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 3. Game Detail Page
```
┌─────────────────────────────────────────────────────────────┐
│                 GAME DETAIL DATA FLOW                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. Page Load                                                │
│     └─► /game/[id] (Dynamic Route)                          │
│                                                              │
│  2. Parallel Data Fetches                                    │
│     ├─► GET /api/games/[id]           (game data)           │
│     ├─► GET /api/matchup/[id]/analytics (intelligence)      │
│     ├─► GET /api/injuries?gameId=[id]  (injury report)      │
│     ├─► GET /api/weather?venue=[v]     (weather data)       │
│     └─► GET /api/game-news?gameId=[id] (related news)       │
│                                                              │
│  3. Analytics Processing                                     │
│     ├─► Historical H2H records                              │
│     ├─► ATS performance                                     │
│     ├─► Over/under trends                                   │
│     ├─► Public betting %                                    │
│     ├─► Line movement history                               │
│     └─► AI confidence score                                 │
│                                                              │
│  4. Display Components                                       │
│     ├─► GameHeader (teams, score, status)                   │
│     ├─► OddsComparison (line shop)                          │
│     ├─► BettingTrends (public/sharp)                        │
│     ├─► InjuryReport (impact analysis)                      │
│     ├─► WeatherWidget (outdoor games)                       │
│     └─► NewsCarousel (related articles)                     │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 4. Leaderboard
```
┌─────────────────────────────────────────────────────────────┐
│                  LEADERBOARD DATA FLOW                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. Page Load                                                │
│     └─► /leaderboard (Server Component)                     │
│                                                              │
│  2. Data Fetch                                               │
│     └─► Supabase direct query                               │
│         SELECT c.*, cs.*                                    │
│         FROM cappers c                                       │
│         JOIN capper_stats cs ON c.id = cs.capper_id         │
│         ORDER BY cs.units_won DESC                          │
│         LIMIT 100                                            │
│                                                              │
│  3. Filtering/Sorting (Client-side)                         │
│     ├─► By sport (All, NFL, NBA, NHL, MLB)                  │
│     ├─► By timeframe (7d, 30d, Season, All-time)            │
│     ├─► By metric (Units, Win%, ROI)                        │
│     └─► Search by username                                  │
│                                                              │
│  4. Capper Profile Link                                     │
│     └─► /leaderboard/[slug] → Full profile page             │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 5. Prediction Markets
```
┌─────────────────────────────────────────────────────────────┐
│               PREDICTION MARKETS DATA FLOW                   │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. Page Load                                                │
│     └─► /markets (Client Component)                         │
│                                                              │
│  2. Data Fetch                                               │
│     └─► GET /api/markets?category=sports                    │
│                                                              │
│  3. API Route Processing                                     │
│     ├─► Fetch Polymarket API (sports markets)               │
│     ├─► Fetch Kalshi API (event contracts)                  │
│     ├─► Normalize to common format                          │
│     └─► Calculate price changes (24h)                       │
│                                                              │
│  4. Categories                                               │
│     ├─► Sports (Championships, MVPs, Awards)                │
│     ├─► Politics (Elections, Policy)                        │
│     ├─► Crypto (Price targets)                              │
│     └─► Trending (Volume movers)                            │
│                                                              │
│  5. Display                                                  │
│     ├─► MarketCard (price, volume, chart)                   │
│     ├─► PriceHistory (sparkline)                            │
│     └─► External links to trade                             │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 6. News Feed
```
┌─────────────────────────────────────────────────────────────┐
│                    NEWS FEED DATA FLOW                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. Page Load                                                │
│     └─► /news (Dynamic - force-dynamic)                     │
│                                                              │
│  2. Data Fetch (getAllSportsNews)                           │
│     ├─► ESPN News API (articles)                            │
│     ├─► Twitter/X API (social posts)                        │
│     └─► API-Sports (injury updates)                         │
│                                                              │
│  3. Aggregation                                              │
│     ├─► Normalize to NewsItem format                        │
│     ├─► Sort by publishedAt (newest first)                  │
│     ├─► Deduplicate similar stories                         │
│     └─► Tag with sport/team                                 │
│                                                              │
│  4. Filtering (Client-side)                                 │
│     └─► By sport tab (All, NFL, NBA, NHL, MLB)              │
│                                                              │
│  5. Refresh                                                  │
│     └─► revalidate: 300 (ISR every 5 minutes)               │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## ⏰ Cron Job Schedule

```
┌─────────────────────────────────────────────────────────────┐
│                    CRON JOB TIMELINE                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Every 1 minute (during games):                             │
│  └─► /api/cron/update-scores                                │
│      └─► Updates live scores for in-progress games          │
│                                                              │
│  Every 2 minutes (during games):                            │
│  └─► /api/cron/refresh-scores                               │
│      └─► Full score refresh with box scores                 │
│                                                              │
│  Every 5 minutes:                                           │
│  └─► /api/cron/refresh-odds                                 │
│      └─► Fetch latest odds from all sportsbooks             │
│      └─► Record to odds_history for movement tracking       │
│                                                              │
│  Every 15 minutes:                                          │
│  └─► /api/cron/sync-games                                   │
│      └─► Sync game schedule for next 7 days                 │
│      └─► Update venue, broadcast info                       │
│                                                              │
│  Every 6 hours:                                             │
│  └─► /api/cron/refresh-injuries                             │
│      └─► Update injury reports                              │
│      └─► Calculate impact scores                            │
│                                                              │
│  └─► /api/cron/refresh-standings                            │
│      └─► Update team standings                              │
│      └─► Calculate playoff scenarios                        │
│                                                              │
│  3x daily (9 AM, 3 PM, 11 PM ET):                           │
│  └─► /api/cron/grade-picks                                  │
│      └─► Grade completed picks                              │
│      └─► Update capper_stats                                │
│      └─► Recalculate leaderboard                            │
│                                                              │
│  Daily (4 AM ET):                                           │
│  └─► /api/cron/discover-trends                              │
│      └─► Run trend discovery algorithms                     │
│      └─► Update historical_trends table                     │
│      └─► Identify new hot streaks                           │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🧠 Edge Detection Algorithm

```typescript
// Simplified edge scoring algorithm (ai-edge-analysis.ts)

interface EdgeFactors {
  lineMovement: number      // -10 to +10 (RLM bonus)
  publicSharpSplit: number  // -10 to +10 (sharp side bonus)
  historicalTrends: number  // 0 to +20 (matching trends)
  situational: number       // 0 to +10 (rest, travel, etc.)
  weatherImpact: number     // -5 to +5 (outdoor games)
}

function calculateEdgeScore(game: Game, factors: EdgeFactors): number {
  let score = 50 // Base score

  // Reverse Line Movement (biggest factor)
  if (isRLM(game)) {
    score += factors.lineMovement * 2 // Up to +20
  }

  // Sharp vs Public divergence
  const divergence = game.sharpMoney - game.publicMoney
  if (divergence > 20) {
    score += Math.min(divergence / 2, 15) // Up to +15
  }

  // Historical trend matching
  const matchingTrends = findMatchingTrends(game)
  score += matchingTrends.length * 3 // +3 per trend, max +15

  // Situational factors
  score += calculateSituational(game) // Rest, travel, etc.

  // Weather (outdoor sports)
  if (game.sport === 'NFL' || game.sport === 'MLB') {
    score += calculateWeatherImpact(game)
  }

  return Math.min(Math.max(score, 0), 100) // Clamp 0-100
}

function isRLM(game: Game): boolean {
  // Reverse Line Movement: Line moves opposite to public betting
  const lineDirection = game.currentSpread - game.openingSpread
  const publicSide = game.publicPct > 50 ? 'favorite' : 'dog'
  
  return (
    (publicSide === 'favorite' && lineDirection > 0.5) ||
    (publicSide === 'dog' && lineDirection < -0.5)
  )
}
```

---

## 📱 Page Component Map

| Page | Route | Type | Data Source |
|------|-------|------|-------------|
| Home | `/` | Server | Demo data (build) / API (runtime) |
| NFL Hub | `/nfl` | Static | Hardcoded + Client fetch |
| NFL Matchups | `/nfl/matchups` | Client | `/api/games?sport=nfl` |
| NFL Game | `/nfl/matchups/[gameId]` | Client | `/api/games` + `/api/matchup/*/analytics` |
| NBA Hub | `/nba` | Static | Hardcoded + Client fetch |
| NBA Matchups | `/nba/matchups` | Client | `/api/games?sport=nba` |
| NHL Hub | `/nhl` | Static | Hardcoded + Client fetch |
| NHL Matchups | `/nhl/matchups` | Client | `/api/games?sport=nhl` |
| MLB Hub | `/mlb` | Static | Hardcoded + Client fetch |
| MLB Matchups | `/mlb/matchups` | Client | `/api/games?sport=mlb` |
| NCAAB Hub | `/ncaab` | ISR 60s | Static |
| NCAAF Hub | `/ncaaf` | ISR 60s | Static |
| Leaderboard | `/leaderboard` | Server | Supabase direct |
| Capper Profile | `/leaderboard/[slug]` | Dynamic | Supabase direct |
| Markets | `/markets` | Client | `/api/markets` |
| News | `/news` | Dynamic | Twitter + ESPN APIs |
| Edge Finder | `/edge/[gameId]` | Dynamic | Algorithm |
| Trend Finder | `/trend-finder` | Client | `/api/trend-finder` |
| Dashboard | `/dashboard` | Client | Auth + Supabase |
| Picks | `/picks` | Static | Demo data |
| Calculator | `/calculators` | Static | Client-side math |
| Live | `/live` | Client | `/api/live` |
| Injuries | `/injuries` | Client | `/api/injuries` |

---

## 🔐 Environment Variables

### Required for Production
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# External APIs
ODDS_API_KEY=xxx                    # The Odds API
X_BEARER_TOKEN=xxx                  # Twitter/X API
ESPN_API_KEY=xxx                    # ESPN (if required)

# Optional
NEXT_PUBLIC_BASE_URL=https://matchups.vercel.app
GEMINI_API_KEY=xxx                  # Google AI
STRIPE_SECRET_KEY=xxx               # Payments
STRIPE_WEBHOOK_SECRET=xxx
```

### Vercel System Variables (Auto-set)
```env
VERCEL=1
VERCEL_ENV=production
VERCEL_URL=matchups-xxx.vercel.app
CI=1                                # During builds only
```

---

## 🔧 Development Commands

```bash
# Local development
npm run dev                 # Start dev server on :3000

# Build & test
npm run build              # Production build
npm run start              # Start production server
npm run lint               # ESLint
npm run test               # Jest tests
npm run test:e2e           # Playwright E2E

# Database
npx supabase start         # Local Supabase
npx supabase db reset      # Reset local DB
npx supabase gen types     # Generate TypeScript types

# Deployment
git push origin main       # Auto-deploy to Vercel
```

---

## 📊 Monitoring & Health

### Health Check Endpoint
```
GET /api/health

Response:
{
  "status": "healthy",
  "timestamp": "2026-01-11T...",
  "services": {
    "database": "connected",
    "espn": "ok",
    "oddsApi": "ok",
    "twitter": "rate_limited"
  },
  "version": "1.0.0"
}
```

### Admin Endpoints
- `/admin` - Admin dashboard
- `/admin/diagnostics` - System diagnostics
- `/admin/health` - Detailed health check
- `/api/admin/system` - System metrics

---

## 🚨 Error Handling

### API Error Responses
```typescript
// Standard error format
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "status": 400 | 401 | 403 | 404 | 429 | 500
}

// Rate limit response
{
  "error": "Rate limit exceeded",
  "code": "RATE_LIMITED",
  "retryAfter": 60,
  "status": 429
}
```

### Fallback Behavior
| Scenario | Fallback |
|----------|----------|
| ESPN API down | Show cached data + "Last updated X ago" |
| Odds API rate limit | Show last cached odds |
| Twitter rate limit | Hide social section |
| Supabase down | Show static demo data |
| Build time | Use demo data (CI=1 check) |

---

*This document is auto-updated. Last generated: January 11, 2026*
