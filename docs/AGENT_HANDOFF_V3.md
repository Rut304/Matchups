# Matchups — Agent Handoff V3

**Date:** February 2026  
**Production URL:** https://matchups-eta.vercel.app  
**GitHub:** https://github.com/Rut304/Matchups  
**Status:** Live & Deployed — Data Layer Needs Completion

---

## Executive Summary

Matchups is a Next.js 16 sports betting intelligence platform with 148 pages across 6 sports (NFL, NBA, MLB, NHL, NCAAF, NCAAB). The site is live on Vercel with Supabase as the data store, ESPN for live game data, The Odds API for betting lines, and Gemini 2.5 Flash for AI analysis.

**What works:** Team analytics (ATS, O/U, ML, asFavorite/asUnderdog, last10), game matchup pages, live scores, odds display, AI analysis, expert tracking, cron jobs, 148 static pages building cleanly.

**What needs work:** Major data gaps in the database, several features are wired up in the UI but have no underlying data, and college sports (NCAAF/NCAAB) have zero historical games.

---

## Tech Stack

| Component | Technology | Details |
|-----------|-----------|---------|
| Framework | Next.js 16.1.1 | App Router, Turbopack, React 19.2 |
| Language | TypeScript | Strict mode |
| Styling | Tailwind CSS 4 | Custom color system (Orange #FF6B00, Blue #00A8FF, Green #00FF88, Pink #FF3366) |
| Database | Supabase (Postgres) | Project: `cdfdmkntdsfylososgwo` |
| Hosting | Vercel | Project: `prj_nvtVWHH0zu0gKqRVJAlwcATz80nt` |
| AI | Gemini 2.5 Flash | `@google/generative-ai` — strict no-guessing rules |
| Auth | Supabase Auth | Configured but minimal user base |
| Payments | Stripe | SDK installed, not yet active |
| X/Twitter | rettiwt-api | Free scraping, no API key needed |

---

## Infrastructure

### Vercel Deployment
- **Team:** `team_25BKCm9rNi2FRW0gcF4rbCj0`
- **Latest Commit:** `5d08098` — "fix: per-team per-date dedup to fix inflated game totals"
- **Build:** 148/148 pages, zero errors
- **17 Cron Jobs** in `vercel.json` (see Cron Jobs section below)

### Supabase
- **URL:** `https://cdfdmkntdsfylososgwo.supabase.co`
- **Keys:** In `.env.local` (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY)
- **Important:** Supabase REST API has a 1000-row limit per query. All services MUST use `.range()` pagination to fetch complete datasets.

### API Keys (in .env.local and Vercel env vars)
- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY`
- `THE_ODDS_API_KEY` — The Odds API v4 (100,000 credits/month)
- `GOOGLE_GEMINI_API_KEY` — Gemini 2.5 Flash
- `CRON_SECRET` — Validates cron job requests
- `ADMIN_SECRET` — Admin route protection
- `STRIPE_SECRET_KEY` / `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` — Payments (inactive)

---

## Database State — COMPREHENSIVE AUDIT (Feb 2026)

### historical_games (82,876 total records)

| Sport | Games | Seasons | Range | Spreads | Results | Scores |
|-------|-------|---------|-------|---------|---------|--------|
| NFL | 6,860 | 26 | 2000–2025 | 100% | 100% | 100% |
| NBA | 21,682 | 26 | 2000–2025 | 98.7% | 98.7% | 100% |
| MLB | 31,516 | 26 | 2000–2025 | 100% | 100% | 100% |
| NHL | 22,818 | 25 | 2000–2025 | 100% | 100% | 100% |
| **NCAAF** | **0** | **0** | **EMPTY** | — | — | — |
| **NCAAB** | **0** | **0** | **EMPTY** | — | — | — |

**Key columns:** `id, sport, season, season_type, game_date, home_team, away_team, home_team_abbr, away_team_abbr, home_score, away_score, point_spread, over_under, spread_result, total_result, espn_game_id`

### game_odds (18,598 total records — from The Odds API historical imports)

| Sport | Records | Seasons | Range | Has Spread | Has Total |
|-------|---------|---------|-------|------------|-----------|
| NFL | 1,707 | 5 | 2020–2024 | 100% | 87.5% |
| NBA | 2,692 | 5 | 2021–2025 | 99.8% | 94.9% |
| MLB | 3,945 | 5 | 2020–2024 | 96.6% | 97.1% |
| NHL | 3,465 | 5 | 2021–2025 | 80.1% | 79.3% |
| NCAAF | 3,898 | 6 | 2020–2025 | 99.7% | 95.1% |
| NCAAB | 2,891 | 5 | 2021–2025 | 99.6% | 97.9% |

**Key columns:** `id, sport, season, game_date, home_team, away_team, home_spread, away_spread, total, home_ml, away_ml, bookmaker, import_source`

### EMPTY Tables (Critical Gaps)

| Table | Status | Impact |
|-------|--------|--------|
| `line_snapshots` | **0 records** | Line movement charts show nothing |
| `odds` | **0 records** | `refresh-odds` cron writes here but nothing reads from it |
| `picks` | **0 records** | No user picks tracked at all |
| `betting_trends` | **null/doesn't exist** | Trend discovery has no persistent storage |
| `betting_splits` | **Schema exists, no data** | Public vs sharp money features empty |

### Other Tables
| Table | Records | Notes |
|-------|---------|-------|
| cappers | 77 | Celebrity/pro/community cappers seeded |
| odds_import_log | Has history | Tracks import runs |
| admin_settings | Exists | App config storage |

---

## NFL 2025 Season Data — Known Issues

1. **Super Bowl is in the data** but labeled `NFC @ AFC` instead of `SEA @ NE`
   - Game date: 2026-02-04, Score: 66-52, spread: 12.5
   - Conference Championships confirmed: SEA beat LAR 31-27, NE beat DEN 10-7
   - **Fix needed:** Update home_team/away_team from NFC/AFC to SEA/NE

2. **Regular season count inflated:** 370 games (expected ~272 for 32 teams × 17 games / 2)
   - DB-level duplicates remain from overlapping import sources
   - Per-team per-date dedup in `real-analytics.ts` handles this at query time
   - **Fix needed:** DB-level cleanup of remaining ~100 duplicate games

3. **NFL game_odds:** 0 records for season 2025 (only has 2020–2024)
   - The Odds API historical import never ran for 2025
   - **Fix needed:** Import NFL 2025 game_odds

---

## Key Source Files

### Core Services (src/lib/services/)
| File | Purpose |
|------|---------|
| `real-analytics.ts` | **THE main analytics engine** — team ATS, O/U, ML, trends, with per-team per-date dedup |
| `game-odds-service.ts` | Queries game_odds table, cross-references with historical_games |
| `edge-service.ts` | Edge detection (RLM, steam moves, sharp signals) |
| `leaderboard-service.ts` | Capper leaderboard data |
| `pattern-discovery.ts` | Automated trend/pattern finder |
| `social-media-content.ts` | X/Twitter content scraping |

### API Layer (src/lib/api/)
| File | Purpose |
|------|---------|
| `espn.ts` | ESPN API client (v2 endpoints) — scores, standings, injuries |
| `the-odds-api.ts` / `odds.ts` | The Odds API client — betting lines |
| `data-sources.ts` | Data source priority hierarchy |
| `data-layer.ts` | Game/odds merging layer |
| `team-schedule.ts` | Team schedule fetching |

### Key Libraries (src/lib/)
| File | Purpose |
|------|---------|
| `betting-intelligence.ts` | Timeline analysis, spread/total tracking |
| `trend-matcher.ts` | Matches historical trends to live games |
| `gemini.ts` | AI analysis (Gemini 2.5 Flash, strict no-guessing) |
| `edge-features.ts` | Edge detection data interfaces |
| `historical-data.ts` | Trend & historical queries from Supabase |

### Important API Routes (src/app/api/)
| Route | Purpose |
|-------|---------|
| `/api/analytics` | Main analytics endpoint (teams, trends, summary) |
| `/api/teams` | Team data with ATS/OU — accepts `?sport=NFL&season=2025` |
| `/api/games/[id]` | Single game details |
| `/api/games/[id]/summary` | ESPN summary (injuries, leaders, predictor) |
| `/api/game-trends` | Per-game historical trend matching |
| `/api/edges/today` | Today's edge detection signals |
| `/api/admin/import-odds` | Admin: import historical odds from The Odds API |

---

## Cron Jobs (17 total in vercel.json)

| Schedule | Path | Purpose |
|----------|------|---------|
| `* 15-23,0-6 * * *` | `/api/cron/update-scores` | Live score updates (game hours) |
| `*/2 15-23,0-6 * * *` | `/api/cron/refresh-scores` | Score refresh every 2 min |
| `*/5 15-23,0-6 * * *` | `/api/cron/refresh-odds` | Odds refresh every 5 min |
| `*/30 10-23,0-6 * * *` | `/api/cron/odds-snapshot` | Odds snapshot for CLV tracking |
| `0 */4 * * *` | `/api/cron/sync-games` | Sync game schedule |
| `0 10,22 * * *` | `/api/cron/refresh-standings` | Standings refresh |
| `0 */6 * * *` | `/api/cron/refresh-injuries` | Injury report refresh |
| `0 7 * * *` | `/api/cron/discover-trends` | Daily trend discovery |
| `0 8,14,20 * * *` | `/api/cron/grade-picks` | Grade completed picks |
| `0 9,15,21 * * *` | `/api/cron/grade-clv` | CLV grading |
| `0 13 * * *` | `/api/cron/scrape-experts?job=morning` | Morning expert scrape |
| `0 16 * * 0` | `/api/cron/scrape-experts?job=pregame-nfl` | NFL pregame experts |
| `30 23 * * 1-5` | `/api/cron/scrape-experts?job=pregame-weekday` | Weekday pregame |
| `30 4 * * *` | `/api/cron/scrape-experts?job=postgame` | Postgame expert results |
| `0 8 * * *` | `/api/cron/daily-expert-scraper` | Daily expert aggregation |
| `0 12,16,20 * * *` | `/api/cron/collect-props` | Props collection |
| `0 6 * * 1` | `/api/cron/backfill-history` | Weekly history backfill |

---

## Directory Structure

```
/src
├── app/
│   ├── api/                    # 60+ API route folders
│   │   ├── analytics/          # Main analytics endpoint
│   │   ├── cron/               # 14 cron job handlers
│   │   ├── admin/              # Admin routes (import-odds, settings)
│   │   ├── games/[id]/         # Game detail + summary
│   │   ├── teams/              # Team analytics
│   │   └── ...
│   ├── game/[id]/              # Game matchup page
│   ├── nfl/, nba/, nhl/, mlb/  # Sport pages
│   ├── ncaaf/, ncaab/          # College sport pages
│   ├── leaderboard/            # THE viral feature
│   ├── markets/                # Prediction markets
│   ├── picks/, my-picks/       # Pick tracking
│   ├── analytics/, patterns/   # Analytics dashboards
│   ├── lineshop/               # Line shopping
│   └── ...28 more page folders
├── components/                 # UI components
├── hooks/                      # React hooks (useGames, useAnalytics, etc.)
├── lib/                        # Core logic
│   ├── api/                    # External API clients
│   ├── services/               # Business logic services
│   ├── supabase/               # DB clients (server/client/middleware)
│   ├── edge/                   # Edge detection logic
│   ├── grading/                # Pick grading
│   └── ...
└── types/                      # TypeScript types

/supabase                       # 25+ SQL schema files
/scripts                        # Data import/audit scripts
/docs                           # Architecture & handoff docs
/e2e                            # Playwright E2E tests
```

---

## What's Working (Verified Feb 2026)

- ✅ **148 pages build and deploy** with zero errors
- ✅ **Team analytics** — ATS (home/away/overall), O/U, ML, asFavorite, asUnderdog, last10
- ✅ **Per-team per-date dedup** — Prevents inflated game counts from duplicate DB records
- ✅ **Game matchup pages** — Scores, odds, predictor, injuries, leaders, line movement
- ✅ **ESPN integration** — v2 API endpoints for scores, standings, injuries
- ✅ **AI analysis** — Gemini 2.5 Flash with strict no-guessing rules
- ✅ **Expert tracking** — X/Twitter scraping via rettiwt-api, admin feed monitor
- ✅ **17 Vercel crons** — Scores, odds, injuries, standings, expert scraping, CLV grading
- ✅ **Historical data** — 82,876 games across 4 pro sports (NFL, NBA, MLB, NHL), 25-26 seasons each
- ✅ **Game odds** — 18,598 records from The Odds API across 6 sports
- ✅ **Supabase 1000-row pagination** — All services use `.range()` to bypass API limits
- ✅ **CLV post-game grading cron** — Compares picks against closing lines

---

## What's NOT Working / Missing

### Critical Data Gaps
1. **NCAAF/NCAAB historical_games: EMPTY** — 0 games despite having game_odds data (3,898 NCAAF + 2,891 NCAAB odds records)
2. **NFL 2025 game_odds: 0 records** — Historical import only covers 2020–2024
3. **line_snapshots: 0 records** — Line movement visualization has no data
4. **odds table: 0 records** — `refresh-odds` cron writes here but nothing reads from it
5. **picks table: 0 records** — No user picks being tracked
6. **betting_trends: null** — Table doesn't exist or is empty

### Data Quality Issues
7. **Super Bowl labeled "NFC @ AFC"** instead of actual team names (SEA @ NE)
8. **NFL 2025 regular season: 370 games** in DB (expected ~272) — still ~100 duplicates
9. **NBA spreads: 98.7%** — ~1.3% of games missing spread data

### Feature Gaps
10. **Line Shop** — Page exists but uses mock data; not connected to The Odds API
11. **Picks tracking** — UI exists but `picks` table is empty, no write path verified
12. **Betting splits** — Schema exists, table empty, features show nothing
13. **User profiles/dashboard** — Auth configured but minimal functionality
14. **Mobile optimization** — Responsive but not truly mobile-optimized
15. **Social sharing** — Not implemented
16. **Push notifications** — Not implemented

---

## Recent Git History

| Commit | Description |
|--------|-------------|
| `5d08098` | fix: per-team per-date dedup to fix inflated game totals |
| `6ee2528` | fix: build errors for import-odds and betting-intelligence types |
| Earlier | Homepage redesign, Gemini upgrade, X/Twitter scraping, historical odds import |

---

## Scripts (in /scripts)

| Script | Purpose |
|--------|---------|
| `full-audit.ts` | Comprehensive data audit across all tables/sports |
| `check-postseason.ts` | NFL postseason/Super Bowl validation |
| `check-season.ts` | Season count checker per sport |
| `dedup-smart.ts` | DB-level dedup using sorted team pairs + date |
| `dedup-historical.ts` | Original dedup by date|home|away key |
| `run-historical-data.ts` | Import historical betting data from The Odds API |
| `backfill-closing-odds.ts` | Backfill closing odds from game_odds to historical_games |
| `seed-picks.ts` | Seed sample picks data |
| `seed-more-cappers.ts` | Seed additional capper profiles |
| `init-db.ts` | Initialize database tables |

**Running scripts:** Scripts require env vars. Use:
```bash
set -a && source .env.local && set +a && npx tsx scripts/<script>.ts
```

---

## Environment Setup

```bash
# Clone & install
git clone https://github.com/Rut304/Matchups.git
cd Matchups
npm install

# Environment variables
cp .env.example .env.local
# Fill in: SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY,
#          THE_ODDS_API_KEY, GOOGLE_GEMINI_API_KEY, CRON_SECRET, ADMIN_SECRET

# Dev server
npm run dev

# Production build
npm run build

# E2E tests
npx playwright test

# Type check
npx tsc --noEmit
```

---
