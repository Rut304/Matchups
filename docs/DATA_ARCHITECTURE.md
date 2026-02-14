# Matchups Data Architecture

> **Last Updated:** February 2026
> **Data Audit Status:** Complete

## Overview

Matchups uses a multi-source data layer backed by Supabase (Postgres). ESPN provides live game data, The Odds API provides historical and live odds, and the analytics engine in `real-analytics.ts` computes all betting statistics.

## Data Sources

### 1. ESPN Public API (Primary - Free, Unlimited)
- **Games/Scores**: Live and historical game data via v2 endpoints
- **Standings**: Team records and rankings
- **Injuries**: Player injury reports
- **Teams**: Team info and rosters
- **File**: `src/lib/api/espn.ts`

### 2. The Odds API v4 (Odds Data - 100,000 credits/month)
- **Live Odds**: Spreads, totals, moneylines from 50+ books
- **Historical Odds**: Past season odds for CLV tracking
- **Key**: `THE_ODDS_API_KEY`
- **File**: `src/lib/api/the-odds-api.ts`

### 3. Supabase (Primary Data Store)
- **historical_games**: 82,876 game results with ATS/O-U outcomes
- **game_odds**: 18,598 imported odds records
- **cappers**: 77 capper profiles
- **IMPORTANT**: REST API has 1000-row limit per query. ALL queries must use .range() pagination.
- **Project**: cdfdmkntdsfylososgwo

### 4. X/Twitter (Expert Tracking)
- **Library**: rettiwt-api (free, no API key)
- **File**: `src/lib/services/social-media-content.ts`

### 5. Gemini 2.5 Flash (AI Analysis)
- **Library**: @google/generative-ai
- **File**: `src/lib/gemini.ts`
- **Rules**: Strict no-guessing policy, only analyzes available data

## Database Tables - Current State

### historical_games (82,876 records) - PRIMARY
The core table for all analytics calculations.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| sport | varchar | NFL, NBA, MLB, NHL (NCAAF/NCAAB: empty) |
| season | integer | Season year (2000-2025) |
| season_type | varchar | regular, postseason |
| game_date | date | Game date |
| home_team | varchar | Home team full name |
| away_team | varchar | Away team full name |
| home_team_abbr | varchar | Home team abbreviation |
| away_team_abbr | varchar | Away team abbreviation |
| home_score | integer | Home final score |
| away_score | integer | Away final score |
| point_spread | decimal | Closing spread (home perspective) |
| over_under | decimal | Closing total |
| spread_result | varchar | home_cover, away_cover, push |
| total_result | varchar | over, under, push |
| espn_game_id | varchar | ESPN event ID |

**Coverage:**
- NFL: 6,860 games, 26 seasons (2000-2025), 100% complete
- NBA: 21,682 games, 26 seasons, 98.7% with spreads
- MLB: 31,516 games, 26 seasons, 100%
- NHL: 22,818 games, 25 seasons, 100%
- NCAAF: 0 EMPTY
- NCAAB: 0 EMPTY

### game_odds (18,598 records)
Imported from The Odds API v4 historical endpoint. Used for CLV calculations and closing line cross-reference.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| sport | varchar | Sport identifier |
| season | integer | Season year |
| game_date | date | Game date |
| home_team | varchar | Home team |
| away_team | varchar | Away team |
| home_spread | decimal | Home spread |
| away_spread | decimal | Away spread |
| total | decimal | Over/under total |
| home_ml | integer | Home moneyline |
| away_ml | integer | Away moneyline |
| bookmaker | varchar | Sportsbook name |
| import_source | varchar | Import method |

**Coverage:** NFL 1,707 (2020-2024), NBA 2,692 (2021-2025), MLB 3,945 (2020-2024), NHL 3,465 (2021-2025), NCAAF 3,898 (2020-2025), NCAAB 2,891 (2021-2025)

### cappers (77 records)
Celebrity/pro/community capper profiles for the leaderboard.

### EMPTY Tables (Data Gaps)
| Table | Intended Purpose | Blocking Feature |
|-------|-----------------|-----------------|
| line_snapshots | Point-in-time odds for movement charts | Line movement visualization |
| odds | Live/current odds cache | Real-time odds display |
| picks | User and capper picks | Pick tracking, leaderboard grading |
| betting_trends | Discovered trend patterns | Trend finder persistence |
| betting_splits | Public vs sharp money % | Sharp money detection |

## Data Flow

```
ESPN API (live) -----> /api/games, /api/scores, /api/standings
                       |
The Odds API --------> /api/cron/refresh-odds --> odds table (EMPTY)
                       /api/admin/import-odds --> game_odds table
                       /api/cron/odds-snapshot --> line_snapshots (EMPTY)
                       |
Supabase <-----------> /api/analytics --> real-analytics.ts
                       /api/teams     --> real-analytics.ts
                       |
                       v
                    Frontend Pages (148 total)
```

## Analytics Engine (real-analytics.ts)

The `getRealTeams()` function is the heart of the analytics:

1. Fetches all `historical_games` for current season + sport (paginated, 1000-row batches)
2. Applies global dedup: Set of `${game_date}|${home}|${away}` keys
3. For each team, applies per-team per-date dedup (max 1 game per team per date)
4. Cross-references with `game_odds` for closing lines (with +/- 1 day fuzzy date matching)
5. Computes per team: overall ATS, home ATS, away ATS, last10 ATS, O/U, ML, asFavorite, asUnderdog
6. Season detection: `month < 6 ? year - 1 : year` (Jan-May maps to prior season)

## Cron Jobs (17 in vercel.json)

| Schedule | Route | Target Table | Status |
|----------|-------|-------------|--------|
| */2 15-23,0-6 | refresh-scores | (in-memory) | Working |
| */5 15-23,0-6 | refresh-odds | odds | Writes but nothing reads |
| */30 10-23,0-6 | odds-snapshot | line_snapshots | Table stays empty - debug |
| * 15-23,0-6 | update-scores | (in-memory) | Working |
| 0 */4 | sync-games | (in-memory) | Working |
| 0 10,22 | refresh-standings | (in-memory) | Working |
| 0 */6 | refresh-injuries | (in-memory) | Working |
| 0 7 | discover-trends | betting_trends | Table may not exist |
| 0 8,14,20 | grade-picks | picks | Table empty |
| 0 9,15,21 | grade-clv | picks/game_odds | Working (no picks to grade) |
| 0 13 | scrape-experts (morning) | (varies) | Working |
| 0 16 Sun | scrape-experts (nfl) | (varies) | Working |
| 30 23 Mon-Fri | scrape-experts (weekday) | (varies) | Working |
| 30 4 | scrape-experts (postgame) | (varies) | Working |
| 0 8 | daily-expert-scraper | (varies) | Working |
| 0 12,16,20 | collect-props | (varies) | Unknown |
| 0 6 Mon | backfill-history | historical_games | Working |

## API Routes

| Route | Purpose | Data Source |
|-------|---------|-------------|
| /api/analytics | Teams, trends, summary | real-analytics.ts + Supabase |
| /api/teams | Team data with ATS | real-analytics.ts |
| /api/games/[id] | Game details | ESPN Scoreboard |
| /api/games/[id]/summary | Injuries, leaders, predictor | ESPN Summary |
| /api/game-trends | Per-game trend matching | trend-matcher.ts |
| /api/edges/today | Edge detection signals | edge-service.ts |
| /api/admin/import-odds | Import historical odds | The Odds API |
| /api/matchups | Games by date/sport | ESPN |
| /api/markets | Prediction markets | Polymarket/Kalshi |
| /api/leaderboard | Capper rankings | Supabase cappers |

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
THE_ODDS_API_KEY
GOOGLE_GEMINI_API_KEY
CRON_SECRET
ADMIN_SECRET
STRIPE_SECRET_KEY (inactive)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY (inactive)
```

## Utility Scripts (in /scripts)

| Script | Purpose |
|--------|---------|
| full-audit.ts | Comprehensive data audit across all tables |
| check-postseason.ts | NFL postseason validation |
| dedup-smart.ts | DB-level dedup (sorted team pairs + date) |
| dedup-historical.ts | Original dedup (date|home|away) |
| run-historical-data.ts | Import historical odds from The Odds API |
| backfill-closing-odds.ts | Backfill closing lines to historical_games |
| init-db.ts | Initialize database tables |
| seed-picks.ts | Seed sample picks |
| seed-more-cappers.ts | Seed additional cappers |

Run scripts with: `set -a && source .env.local && set +a && npx tsx scripts/<name>.ts`
