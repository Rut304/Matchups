# Matchups Data Architecture

## Overview

Matchups uses a unified data layer that pulls from multiple sources and serves data through a consistent API. All pages consume data from the same source of truth.

## Data Sources

### 1. ESPN Public API (Primary - Free, Unlimited)

- **Games/Scores**: Live and historical game data
- **Standings**: Team records and rankings
- **Injuries**: Player injury reports
- **Teams**: Team info and rosters

### 2. The Odds API (Odds Data)

- **Betting Lines**: Spreads, totals, moneylines from 50+ books
- **Line History**: Opening lines for CLV tracking
- **Refresh**: Every 15 minutes via cron

### 3. API-Sports (Enrichment - 100 free/day)

- **Player Stats**: Detailed season/game stats
- **Team Stats**: Advanced metrics
- **Historical Data**: Past seasons

### 4. Supabase (Storage)

- **historical_games**: Game results with ATS/O-U outcomes
- **historical_trends**: Discovered betting trends
- **odds**: Current and opening lines
- **cappers**: Celebrity/pro capper profiles
- **picks**: Tracked picks with results

## Data Flow

```
┌──────────────────────────────────────────────────────────────────────┐
│                            DATA SOURCES                               │
├───────────────┬────────────────┬───────────────┬────────────────────┤
│   ESPN API    │  The Odds API  │  API-Sports   │     Supabase       │
│  (Free/Live)  │  (Odds/Lines)  │  (Stats)      │  (Historical)      │
└───────┬───────┴───────┬────────┴───────┬───────┴─────────┬──────────┘
        │               │                │                 │
        └───────────────┴────────────────┴─────────────────┘
                                 │
                                 ▼
┌──────────────────────────────────────────────────────────────────────┐
│                        UNIFIED DATA LAYER                             │
├──────────────────────────────────────────────────────────────────────┤
│  src/lib/api/data-layer.ts      - Game/odds merging                  │
│  src/lib/unified-data-store.ts  - Cache & aggregation                │
│  src/lib/services/real-analytics.ts - Analytics calculations         │
│  src/lib/historical-data.ts     - Trend & historical queries         │
└──────────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌──────────────────────────────────────────────────────────────────────┐
│                            API ROUTES                                 │
├────────────────────┬───────────────────────────────────────────────┤
│  /api/games        │ Live games with odds (ESPN + Odds API)         │
│  /api/analytics    │ Trends, matchups, cappers, summary             │
│  /api/stats        │ Standings and leaders (ESPN)                   │
│  /api/teams        │ Team analytics with ATS records                │
│  /api/matchups     │ Games by date/sport                            │
│  /api/markets      │ Prediction markets (Polymarket/Kalshi)         │
│  /api/data/import  │ Import historical games                        │
│  /api/data/discover-trends │ Run trend discovery                    │
│  /api/data/refresh │ Force cache refresh                            │
└────────────────────┴───────────────────────────────────────────────┘
                                 │
                                 ▼
┌──────────────────────────────────────────────────────────────────────┐
│                          REACT HOOKS                                  │
├────────────────────┬───────────────────────────────────────────────┤
│  useGames()        │ Live game data with auto-refresh               │
│  useAnalytics()    │ Trends, matchups, analytics                    │
│  useMatchupData()  │ Single game with analytics                     │
│  useTrends()       │ Historical trends                              │
│  useCappers()      │ Capper leaderboard data                        │
└────────────────────┴───────────────────────────────────────────────┘
                                 │
                                 ▼
┌──────────────────────────────────────────────────────────────────────┐
│                           PAGES                                       │
├────────────────────┬───────────────────────────────────────────────┤
│  /                 │ Dashboard with all sports summary              │
│  /nfl|nba|nhl|mlb  │ Sport pages with games and standings          │
│  /analytics        │ Edge Finder - trends, picks, AI               │
│  /trends           │ Historical trend analysis                     │
│  /leaderboard      │ Capper tracking and CLV                       │
│  /markets          │ Prediction market prices                      │
│  /[sport]/matchups/[id] │ Game detail with betting intelligence    │
└────────────────────┴───────────────────────────────────────────────┘
```

## Cron Jobs (vercel.json)

| Schedule | Path | Purpose |
|----------|------|---------|
| */15* ** * | /api/cron/refresh-odds | Update betting lines |
| */5* ** * | /api/cron/refresh-scores | Update live scores |
| 0 */6* ** | /api/cron/sync-games | Sync game schedule |
| 0 8 ** * | /api/cron/refresh-standings | Update standings |
| 0 */12* ** | /api/cron/refresh-injuries | Update injuries |

## Cache TTLs

| Data Type | TTL | Reason |
|-----------|-----|--------|
| Live Games | 30s | Real-time scores |
| Odds | 30s | Line movements |
| Injuries | 2min | Breaking news |
| Standings | 5min | Updates infrequently |
| News | 5min | Fresh content |
| Player Stats | 10min | Moderate updates |
| Trends | 15min | Analysis takes time |
| Historical | 1hr | Rarely changes |

## Database Schema

### historical_games

```sql
- id, sport, season_year, game_date
- home_team, away_team, home_score, away_score
- close_spread, close_total
- spread_result ('home_cover'|'away_cover'|'push')
- total_result ('over'|'under'|'push')
- public_spread_home_pct, primetime_game, divisional_game
```

### historical_trends

```sql
- trend_id, sport, category, bet_type
- trend_name, trend_description, trend_criteria
- l30_record, l30_roi, l90_record, l90_roi
- all_time_record, all_time_roi, all_time_sample_size
- confidence_score, hot_streak, is_active
```

### cappers

```sql
- id, slug, name, avatar_emoji, verified
- capper_type ('celebrity'|'pro'|'community'|'ai')
- network, role, primary_sport
- wins, losses, pushes, units_won, roi, avg_clv
```

### picks

```sql
- id, capper_id, game_id, sport, bet_type
- pick_team, odds, line, units
- open_line, close_line, clv
- result ('win'|'loss'|'push'|'pending')
- source, source_url, notes
```

## Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-key

# APIs
ODDS_API_KEY=your-odds-api-key
API_SPORTS_KEY=your-api-sports-key
X_BEARER_TOKEN=your-twitter-token

# Admin
ADMIN_SECRET=your-admin-secret
CRON_SECRET=your-cron-secret
```

## Initialization Steps

1. **Deploy Supabase Schemas**

   ```bash
   # Run in Supabase SQL Editor:
   # - supabase/schema.sql
   # - supabase/historical-data-schema.sql
   # - supabase/cappers-schema.sql
   ```

2. **Import Historical Data**

   ```bash
   curl -X POST "$URL/api/data/import" \
     -H "Authorization: Bearer $ADMIN_SECRET" \
     -d '{"sport":"NFL","startYear":2020,"endYear":2025}'
   ```

3. **Run Trend Discovery**

   ```bash
   curl -X POST "$URL/api/data/discover-trends" \
     -H "Authorization: Bearer $ADMIN_SECRET" \
     -d '{"minSampleSize":20,"minWinPct":53}'
   ```

4. **Verify Data Flow**

   ```bash
   curl "$URL/api/games?sport=NFL"
   curl "$URL/api/analytics?type=trends"
   curl "$URL/api/stats?sport=NFL"
   ```

## Adding New Data Sources

1. Create a service in `src/lib/services/`
2. Add to unified data layer in `src/lib/api/data-layer.ts`
3. Create API route in `src/app/api/`
4. Create hook in `src/hooks/`
5. Update relevant pages
