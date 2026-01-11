# Matchups Data Flow Architecture

## Overview

Matchups is a sports betting analytics platform built with Next.js 15, Supabase, and multiple external APIs. This document details the complete data flow from sources to frontend.

---

## 1. Data Sources & External APIs

### Primary APIs (Free/Unlimited)

| API | Base URL | Auth | Use Case | Cache TTL |
|-----|----------|------|----------|-----------|
| **ESPN** | `site.api.espn.com/apis/site/v2/sports` | None | Games, scores, standings, injuries, news, teams | 5 min |
| **Polymarket** | `gamma-api.polymarket.com` | None | Prediction market prices/volume | 60 sec |
| **NHL API** | `api-web.nhle.com/v1` | None | NHL player stats | 10 min |
| **MLB Stats** | `statsapi.mlb.com/api/v1` | None | MLB player/team stats | 10 min |

### Paid/Limited APIs

| API | Base URL | Auth | Use Case | Limit |
|-----|----------|------|----------|-------|
| **The Odds API** | `api.the-odds-api.com/v4` | `ODDS_API_KEY` | Live betting odds from 40+ sportsbooks | 500/month |
| **API-Sports** | `v1.{sport}.api-sports.io` | `API_SPORTS_KEY` | Detailed stats, injuries, odds | 100/day |
| **X/Twitter** | `api.twitter.com/2` | `X_BEARER_TOKEN` | Social sentiment, breaking news | Rate limited |
| **Kalshi** | `api.elections.kalshi.com/trade-api/v2` | Optional | Prediction market data | N/A |

### Key API Files

```
src/lib/api/
├── espn.ts              # ESPN API client - schedules, scores, standings
├── the-odds-api.ts      # Odds from 40+ sportsbooks
├── api-sports.ts        # Detailed stats for NFL/NBA/NHL/MLB
├── twitter.ts           # X API for social sentiment
├── prediction-markets.ts # Polymarket + Kalshi integration
├── news.ts              # Aggregated sports news
├── live-sports.ts       # Real-time game data
├── odds.ts              # Odds normalization
└── edge-finder.ts       # Edge detection algorithms
```

---

## 2. Database Schema (Supabase/PostgreSQL)

### Core Tables

```
┌─────────────────┐       ┌─────────────────┐
│    profiles     │───────│ user_picks      │
│  (user data)    │       │ (user bets)     │
└─────────────────┘       └─────────────────┘
        │
        │        ┌─────────────────┐
        └────────│user_favorite_   │
                 │    teams        │
                 └─────────────────┘

┌─────────────────┐       ┌─────────────────┐
│     teams       │───────│     games       │
│ (NFL,NBA,etc)   │       │  (matchups)     │
└─────────────────┘       └─────────────────┘
                                 │
        ┌────────────────────────┼────────────────────────┐
        │                        │                        │
        ▼                        ▼                        ▼
┌─────────────────┐       ┌─────────────────┐     ┌─────────────────┐
│      odds       │       │ betting_splits  │     │    injuries     │
│  (sportsbook)   │       │  (public %)     │     │  (player)       │
└─────────────────┘       └─────────────────┘     └─────────────────┘

┌─────────────────┐       ┌─────────────────┐
│    cappers      │───────│     picks       │
│  (experts)      │       │ (capper bets)   │
└─────────────────┘       └─────────────────┘
        │
        └────────────┬─────────────┬─────────────┐
                     │             │             │
                     ▼             ▼             ▼
              ┌────────────┐ ┌────────────┐ ┌────────────┐
              │capper_stats│ │capper_stats│ │capper_stats│
              │  (overall) │ │ _by_sport  │ │_by_bet_type│
              └────────────┘ └────────────┘ └────────────┘
```

### Table Summary

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `profiles` | User accounts (extends auth.users) | `id, email, subscription_tier, preferences` |
| `teams` | All teams across sports | `external_id, sport, name, abbreviation, conference` |
| `games` | Scheduled/live/final games | `external_id, sport, status, scheduled_at, scores` |
| `odds` | Betting lines per sportsbook | `game_id, sportsbook, spread, total, moneyline` |
| `odds_history` | Line movement tracking | `game_id, line_type, old_value, new_value` |
| `betting_splits` | Public betting percentages | `game_id, spread_pct, moneyline_pct, total_pct` |
| `team_records` | ATS/OU records per season | `team_id, season, ats_wins, over_wins` |
| `ai_picks` | AI-generated predictions | `game_id, pick_type, confidence, reasoning` |
| `prediction_markets` | Polymarket/Kalshi markets | `platform, title, yes_price, volume` |
| `injuries` | Player injury reports | `team_id, player_name, status, impact_rating` |
| `cappers` | Expert handicappers | `slug, name, capper_type, network, verified` |
| `picks` | Individual capper picks | `capper_id, game_id, bet_type, result, units` |
| `capper_stats` | Aggregated capper performance | `win_percentage, net_units, roi_percentage` |

### Schema Files

```
supabase/
├── FULL_SCHEMA_RUN_THIS.sql  # Complete schema (run this first)
├── schema.sql                 # Core tables
├── cappers-schema.sql         # Capper/leaderboard tables
├── leaderboard-schema.sql     # Leaderboard views
├── marketplace-schema.sql     # User marketplace tables
├── prediction-markets-schema  # (in FULL_SCHEMA)
└── user-systems-schema.sql    # User betting systems
```

---

## 3. Cron Jobs (Vercel Scheduled Functions)

Configured in `vercel.json`:

| Job | Schedule | Endpoint | Purpose |
|-----|----------|----------|---------|
| **Update Scores** | Every min (3pm-6am) | `/api/cron/update-scores` | Live score updates |
| **Refresh Scores** | Every 2 min (3pm-6am) | `/api/cron/refresh-scores` | ESPN scoreboard sync |
| **Refresh Odds** | Every 5 min (3pm-6am) | `/api/cron/refresh-odds` | The Odds API sync |
| **Sync Games** | Every 4 hours | `/api/cron/sync-games` | Full game schedule sync |
| **Refresh Standings** | 10am & 10pm | `/api/cron/refresh-standings` | Team standings |
| **Refresh Injuries** | Every 6 hours | `/api/cron/refresh-injuries` | Injury report updates |
| **Discover Trends** | 7am daily | `/api/cron/discover-trends` | Betting trend analysis |
| **Grade Picks** | 8am, 2pm, 8pm | `/api/cron/grade-picks` | Settle capper picks, update stats |

### Cron Authentication

All cron endpoints verify `CRON_SECRET` via Bearer token:
```typescript
const authHeader = request.headers.get('authorization')
if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
```

---

## 4. API Routes (`/api/*`)

### Game & Sports Data

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/games` | GET | Fetch games by sport (`?sport=NFL`) |
| `/api/scores` | GET | Live scores |
| `/api/teams` | GET | Team information |
| `/api/stats` | GET | Team/player statistics |
| `/api/injuries` | GET | Injury reports by sport |
| `/api/matchup/[gameId]/analytics` | GET | Detailed matchup analysis |

### Betting Data

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/lines` | GET | Current betting lines |
| `/api/betting-splits` | GET | Public betting percentages |
| `/api/ou-analysis` | GET | Over/under analysis |
| `/api/confidence-scores` | GET | AI confidence scoring |
| `/api/line-predictor` | GET | Line movement predictions |

### Cappers & Leaderboard

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/leaderboard` | GET | Capper rankings (`?limit=50`) |
| `/api/cappers/[slug]` | GET | Individual capper profile |
| `/api/picks` | GET/POST | Capper picks CRUD |
| `/api/expert-picks` | GET | Sync expert picks from sources |
| `/api/follows` | GET/POST | User following cappers |

### Markets & Edge

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/markets` | GET | Prediction market data |
| `/api/edge` | GET | Edge signals & arbitrage |
| `/api/edges` | GET | Alternate edge endpoint |
| `/api/trend-finder` | GET | Betting trend discovery |

### User & Admin

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/user/systems` | GET/POST | User betting systems |
| `/api/user/systems/[id]` | GET/PUT/DELETE | Individual system |
| `/api/marketplace` | GET | Community marketplace |
| `/api/admin/settings` | GET/PUT | Admin configuration |
| `/api/admin/system` | GET | System health check |

### Utilities

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/health` | GET | Service health check |
| `/api/weather` | GET | Weather for outdoor games |
| `/api/game-news` | GET | Game-specific news |
| `/api/team-news` | GET | Team-specific news |
| `/api/og` | GET | OpenGraph image generation |

---

## 5. Data Processing Flow

### Real-Time Data Pipeline

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   ESPN API   │────▶│  data-layer  │────▶│   Supabase   │
│  (primary)   │     │    .ts       │     │   (cache)    │
└──────────────┘     └──────────────┘     └──────────────┘
                            │
┌──────────────┐            │
│ The Odds API │────────────┤
│  (odds)      │            │
└──────────────┘            │
                            ▼
                     ┌──────────────┐     ┌──────────────┐
                     │ UnifiedGame  │────▶│  Frontend    │
                     │   (merged)   │     │  Components  │
                     └──────────────┘     └──────────────┘
```

### Key Processing Modules

| Module | Purpose |
|--------|---------|
| [data-layer.ts](src/lib/api/data-layer.ts) | Merges ESPN + Odds API into `UnifiedGame` |
| [unified-data-store.ts](src/lib/unified-data-store.ts) | Centralized data access with caching |
| [data-fetchers.ts](src/lib/data-fetchers.ts) | Server actions for data fetching |
| [data-sources.ts](src/lib/api/data-sources.ts) | Game matching & deduplication |

### Data Merge Logic

```typescript
// From data-layer.ts - merges ESPN game with Odds API odds
const unified: UnifiedGame = {
  id: espnGame.id,
  sport,
  status: espnGame.status,
  homeTeam: { ...espnTeamData },
  awayTeam: { ...espnTeamData },
  odds: matchingOdds ? {
    spread: matchingOdds.spread,
    total: matchingOdds.total,
    homeML: matchingOdds.homeML,
    awayML: matchingOdds.awayML,
  } : espnGame.odds,
  sourceInfo: {
    primary: 'espn',
    backup: matchingOdds ? 'odds-api' : undefined,
    confidence: matchConfidence,
  }
}
```

### Cache TTLs (Unified Data Store)

```typescript
const TTL = {
  LIVE_GAMES: 30 * 1000,      // 30 seconds
  STANDINGS: 5 * 60 * 1000,   // 5 minutes
  INJURIES: 2 * 60 * 1000,    // 2 minutes
  ODDS: 30 * 1000,            // 30 seconds
  NEWS: 5 * 60 * 1000,        // 5 minutes
  PLAYER_STATS: 10 * 60 * 1000, // 10 minutes
  HISTORICAL: 60 * 60 * 1000, // 1 hour
}
```

---

## 6. Page Components & Data Sources

### Sport Pages (`/nfl`, `/nba`, `/nhl`, `/mlb`)

| Component | Data Source | Features |
|-----------|-------------|----------|
| Games list | ESPN Scoreboard API | Today's matchups, live scores |
| Team analytics | `getNFLTeams()` from analytics-data | ATS/OU records, trends |
| Standings | ESPN Standings API | Division/conference rankings |
| Injuries | Supabase `injuries` table | Player status by team |

### Homepage (`/`)

| Section | Data Source |
|---------|-------------|
| Top Matchups | `<TopMatchups>` → ESPN API |
| Edge Dashboard | `<EdgeDashboardWithFiltersWrapper>` → edge-finder.ts |
| Hot Trends | Static data (could be Supabase) |
| Top Cappers | Static data (could be API) |
| Standings | Static data |
| Injuries | Static data |

### Leaderboard (`/leaderboard`)

| Data | Source | Query |
|------|--------|-------|
| Capper rankings | Supabase `capper_stats` JOIN `cappers` | Order by ROI/units |
| Pick history | Supabase `picks` | By capper_id |
| Sport breakdown | Supabase `capper_stats_by_sport` | By capper_id |

### Markets (`/markets`)

| Data | Source |
|------|--------|
| Active markets | Polymarket Gamma API |
| Price history | Supabase `market_price_history` |
| Analytics | Kalshi API |

### Edge Finder (`/edge`)

| Data | Source |
|------|--------|
| Edge signals | `edge-finder.ts` algorithms |
| Backtest results | Computed from historical data |
| News correlation | X/Twitter API |

### Injuries (`/injuries`)

| Data | Source |
|------|--------|
| Injury list | Supabase `injuries` table |
| Impact analysis | Computed from injury status |

### Matchup Detail (`/game/[id]`)

| Data | Source |
|------|--------|
| Game info | ESPN Game Details API |
| Odds comparison | The Odds API (multiple books) |
| Public betting | Supabase `betting_splits` |
| AI picks | Supabase `ai_picks` |
| Team news | ESPN + Twitter aggregation |

---

## 7. Environment Variables

Required for production (set in Vercel Dashboard):

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx
SUPABASE_SERVICE_ROLE_KEY=eyJxxx

# Odds Data
ODDS_API_KEY=xxx           # the-odds-api.com (500/month free)
THE_ODDS_API_KEY=xxx       # Alternative key reference

# Sports Data
API_SPORTS_KEY=xxx         # api-sports.io (100/day free)

# Social
X_BEARER_TOKEN=xxx         # Twitter/X API

# Cron Security
CRON_SECRET=xxx            # Vercel cron authentication

# Feature Flags
ENABLE_LIVE_ODDS=true
ENABLE_PREDICTIONS=true
ENABLE_USER_AUTH=true
```

---

## 8. Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        EXTERNAL APIs                            │
├────────────┬────────────┬────────────┬────────────┬────────────┤
│   ESPN     │ The Odds   │ API-Sports │  Twitter   │ Polymarket │
│ (primary)  │   API      │  (stats)   │  (social)  │  (markets) │
└─────┬──────┴─────┬──────┴─────┬──────┴─────┬──────┴─────┬──────┘
      │            │            │            │            │
      ▼            ▼            ▼            ▼            ▼
┌─────────────────────────────────────────────────────────────────┐
│                     API CLIENTS (/lib/api/*)                     │
│  espn.ts | the-odds-api.ts | api-sports.ts | twitter.ts | ...   │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    DATA LAYER (/lib/)                            │
│   data-layer.ts | unified-data-store.ts | data-fetchers.ts      │
│                    (merging, caching, normalization)             │
└───────────────────────────────┬─────────────────────────────────┘
                                │
            ┌───────────────────┼───────────────────┐
            ▼                   ▼                   ▼
┌───────────────────┐  ┌───────────────────┐  ┌───────────────────┐
│    SUPABASE DB    │  │   API ROUTES      │  │  CRON JOBS        │
│  (PostgreSQL)     │  │  (/api/*)         │  │ (/api/cron/*)     │
│                   │  │                   │  │                   │
│ - games           │  │ - /api/games      │  │ - refresh-scores  │
│ - teams           │  │ - /api/leaderboard│  │ - refresh-odds    │
│ - odds            │  │ - /api/markets    │  │ - grade-picks     │
│ - cappers         │  │ - /api/edge       │  │ - sync-games      │
│ - picks           │  │ - /api/picks      │  │ - refresh-injuries│
└───────────────────┘  └─────────┬─────────┘  └───────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                    FRONTEND COMPONENTS                           │
│   /app/page.tsx | /app/nfl/page.tsx | /app/leaderboard/page.tsx │
│   /components/game/* | /components/edge/* | /components/ads/*   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 9. Key Functions Reference

### Data Fetching

| Function | File | Purpose |
|----------|------|---------|
| `syncGames(sport)` | data-layer.ts | Merge ESPN + Odds → UnifiedGame[] |
| `getScoreboard(sport)` | espn.ts | ESPN live scoreboard |
| `getOdds(sport)` | the-odds-api.ts | Betting odds from sportsbooks |
| `fetchGames(sport)` | data-fetchers.ts | Server action for games |
| `getGames(sport)` | unified-data-store.ts | Cached game retrieval |

### Database Operations

| Function | File | Purpose |
|----------|------|---------|
| `storeGames(games)` | data-layer.ts | Save games to Supabase |
| `compute_capper_stats()` | FULL_SCHEMA.sql | Postgres function for stats |

### Edge Detection

| Function | File | Purpose |
|----------|------|---------|
| `detectFavoriteLongshotBias()` | edge-finder.ts | Mispriced markets |
| `detectVolumeAnomaly()` | edge-finder.ts | Unusual volume signals |
| `edgeFinder.getTopEdges()` | edge-finder.ts | Ranked edge signals |

---

## 10. Testing & Monitoring

### Health Checks
- `/api/health` - Service status
- `/api/admin/system` - System diagnostics

### E2E Tests (Playwright)
```
e2e/
├── app.spec.ts         # Core app tests
├── full-site.spec.ts   # Full site navigation
├── edge-features.spec.ts # Edge finder tests
└── comprehensive.spec.ts # Full coverage
```

### Logs
- Vercel Dashboard → Functions → Logs
- Cron job execution tracked per run
- API quota usage logged (Odds API)

---

*Last Updated: January 2026*
