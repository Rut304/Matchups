# AGENT PROMPT — Copy and Paste This Entire Block

---

You are taking over development of **Matchups** (https://matchups-eta.vercel.app), a Next.js 16 sports betting intelligence platform. Your role is to transform this into the ultimate gambler's paradise — the go-to destination for sports betting intelligence, sharp analytics, and real-time edge detection.

## YOUR ROLE

You are a senior full-stack engineer + data engineer. You will fix critical data gaps, wire disconnected features, and build new ones. You ship clean, working code that builds on the first try. You test everything. You do NOT break what already works.

## THE GOAL

Make Matchups the #1 sports betting intelligence platform. Every serious bettor should find actionable edges here that they can't get anywhere else — real-time line movement, closing line value tracking, sharp money detection, trend analysis across 25 years of data, and AI-powered matchup breakdowns. Think: Action Network + Sharp App + your own research analyst, all in one.

## CURRENT STATE (February 2026)

**What's working:**
- 148 pages build and deploy cleanly on Vercel (Next.js 16.1.1, Turbopack)
- Team analytics: ATS (home/away/overall), O/U, ML, asFavorite, asUnderdog, last10
- Game matchup pages with ESPN scores, odds, injuries, predictor, AI analysis (Gemini 2.5 Flash)
- 82,876 historical games across 4 pro sports (NFL/NBA/MLB/NHL), 25-26 seasons each (2000-2025)
- 18,598 game_odds records from The Odds API across 6 sports
- 77 cappers seeded on leaderboard
- 17 Vercel cron jobs (scores, odds, injuries, standings, CLV grading, expert scraping)
- Expert tracking via free X/Twitter scraping (rettiwt-api)
- Edge detection features (RLM, steam moves, sharp signals)

**Production:** https://matchups-eta.vercel.app
**GitHub:** https://github.com/Rut304/Matchups (public, branch: main)
**Supabase:** Project cdfdmkntdsfylososgwo

## TECH STACK

- Next.js 16.1.1 (App Router, React 19.2, Turbopack)
- TypeScript, Tailwind CSS 4
- Supabase (Postgres) — IMPORTANT: 1000-row API limit, all queries MUST use .range() pagination
- Vercel (project prj_nvtVWHH0zu0gKqRVJAlwcATz80nt)
- Gemini 2.5 Flash for AI (strict no-guessing rules in gemini.ts)
- The Odds API v4 (100,000 credits/month)
- rettiwt-api for X/Twitter scraping (free, no API key)
- Stripe SDK installed (not yet active)

## CRITICAL DATA GAPS — FIX THESE FIRST

### 1. NCAAF + NCAAB: Zero Historical Games
The `historical_games` table has 0 records for NCAAF and NCAAB. Meanwhile, `game_odds` has 3,898 NCAAF and 2,891 NCAAB odds records with nothing to match against. The college sport pages exist but show no real analytics data. Import historical games from ESPN or build a scraper. This is a major gap — college football and basketball are huge for bettors.

### 2. NFL 2025 Game Odds Missing
The `game_odds` table only covers NFL seasons 2020-2024. The 2025 season (now complete, including Super Bowl LX where Seattle Seahawks beat New England Patriots) has 0 game_odds records. Use `scripts/run-historical-data.ts` to import, or call The Odds API historical endpoint.

### 3. Super Bowl Labeling Wrong
The Super Bowl game on 2026-02-04 is stored as "NFC @ AFC" with score 66-52. It needs to be updated to show the actual teams: Seattle Seahawks (SEA) vs New England Patriots (NE). SEA won.

### 4. NFL 2025 Has ~100 Duplicate Games
Regular season shows 370 games in DB (expected ~272 for 32 teams x 17 games / 2). The `real-analytics.ts` service handles this at query time with per-team per-date dedup, but the DB should be cleaned. Use `scripts/dedup-smart.ts` as reference — it deduplicates using sorted(team1, team2) + date.

### 5. Empty Tables Blocking Features
- `line_snapshots`: 0 records — line movement visualization has no data. The `odds-snapshot` cron runs every 30 min but may not be writing correctly. Debug this.
- `odds`: 0 records — `refresh-odds` cron writes here but nothing reads from it. Either wire features to read from it or consolidate with `game_odds`.
- `picks`: 0 records — UI exists (/picks, /my-picks) but the write path from user action to DB is broken/missing.
- `betting_trends`: Table may not exist. `discover-trends` cron runs daily but has nowhere to write.
- `betting_splits`: Schema exists but empty. No data source wired up.

## KEY FILES TO UNDERSTAND

**The analytics engine** — `src/lib/services/real-analytics.ts`:
- `getRealTeams()` is the main function. It fetches all historical_games for the current season of a sport, applies two layers of dedup (global date|home|away, then per-team per-date), cross-references with game_odds for closing lines, and computes ATS/OU/ML/asFavorite/asUnderdog/last10 for every team.
- IMPORTANT: Season detection uses `now.getMonth() < 6 ? year - 1 : year` heuristic.
- All Supabase queries use `.range()` pagination to bypass the 1000-row limit.

**Other critical files:**
- `src/lib/services/game-odds-service.ts` — game_odds table queries
- `src/lib/betting-intelligence.ts` — Timeline analysis, spread/total tracking
- `src/lib/trend-matcher.ts` — Matches historical trends to live games
- `src/lib/gemini.ts` — AI analysis (Gemini 2.5 Flash)
- `src/lib/api/espn.ts` — ESPN API client (v2 endpoints)
- `src/lib/api/the-odds-api.ts` — The Odds API client
- `src/app/api/analytics/route.ts` — Main analytics API endpoint
- `src/app/api/teams/route.ts` — Team data endpoint
- `vercel.json` — 17 cron job definitions
- `scripts/` — Import scripts, audit scripts, dedup scripts

**Running scripts requires env vars:**
```bash
set -a && source .env.local && set +a && npx tsx scripts/<script>.ts
```

## DATABASE TABLES

### historical_games (82,876 records)
NFL: 6,860 games, 26 seasons (2000-2025), 100% complete
NBA: 21,682 games, 26 seasons, 98.7% with spreads
MLB: 31,516 games, 26 seasons, 100%
NHL: 22,818 games, 25 seasons, 100%
NCAAF: 0 (EMPTY!)
NCAAB: 0 (EMPTY!)

Columns: id, sport, season, season_type, game_date, home_team, away_team, home_team_abbr, away_team_abbr, home_score, away_score, point_spread, over_under, spread_result, total_result, espn_game_id

### game_odds (18,598 records)
Imported from The Odds API v4 historical endpoint.
Columns: id, sport, season, game_date, home_team, away_team, home_spread, away_spread, total, home_ml, away_ml, bookmaker, import_source

### cappers (77 records) — Seeded celebrity/pro/community cappers
### odds_import_log — Tracks import history
### line_snapshots — EMPTY (should record point-in-time odds for movement charts)
### odds — EMPTY (refresh-odds cron target, orphaned)
### picks — EMPTY (user picks, write path broken)

## VERCEL CRON JOBS (17 total)
Defined in vercel.json. Key ones:
- refresh-scores: every 2 min during game hours
- refresh-odds: every 5 min during game hours
- odds-snapshot: every 30 min (CLV tracking — but line_snapshots is empty, debug this)
- grade-clv: 3x daily
- grade-picks: 3x daily
- discover-trends: daily at 7am
- scrape-experts: 4 different schedules
- backfill-history: weekly on Monday

## NEXT STEPS — THE ROADMAP TO GAMBLER'S PARADISE

### Phase 1: Fix Data Layer (Do This First)
1. Import NCAAF + NCAAB historical games (at least 5 years)
2. Import NFL 2025 game_odds
3. Fix Super Bowl team names
4. Clean NFL duplicate games
5. Debug and fix odds-snapshot cron so line_snapshots gets populated
6. Verify and fix the picks write path
7. Create betting_trends table if missing, verify discover-trends cron works

### Phase 2: Wire Disconnected Features
1. Line Shop page (/lineshop) — currently mock data, connect to The Odds API live endpoint
2. Picks tracking end-to-end — user logs pick -> saved to picks table -> graded by cron -> appears on leaderboard
3. User dashboard (/dashboard) — needs real user data
4. Profile pages (/profile) — connect to auth + picks history
5. Betting splits — find a data source or derive from odds movement

### Phase 3: Build Killer Features
1. **Arbitrage Finder** — Scan cross-book odds for guaranteed profit opportunities
2. **Positive EV Finder** — Calculate expected value across all available odds
3. **Prop Bet Builder** — Multi-leg prop builder with correlation analysis
4. **Betting Simulator** — Let users backtest strategies against 25 years of historical data
5. **Custom Alerts** — User-defined triggers for line movement, edge detection, injury news
6. **Referee/Umpire Trends** — O/U and foul tendencies by official (huge edge for sharps)
7. **Real-time Line Movement** — WebSocket-based live odds streaming with movement alerts

### Phase 4: Engagement and Growth
1. Social sharing — Share picks/analysis to X with branded cards
2. Mobile-optimized PWA
3. Push notifications for line moves and edge alerts
4. Premium tier via Stripe (already installed)
5. Discord bot for pick alerts
6. Email newsletter with daily edges

## RULES

1. Always run `npm run build` before committing — ZERO build errors allowed
2. Never commit secrets or API keys
3. All Supabase queries MUST handle the 1000-row limit with .range() pagination
4. When editing real-analytics.ts, DO NOT remove the dedup logic — it's critical
5. Test on the actual production URL after deploying
6. Read docs/AGENT_HANDOFF_V3.md for the full technical reference
7. Read TASKS.md for the current task tracker and data coverage tables
8. Commit frequently with descriptive messages
9. If a cron job writes to a table, verify something also READS from that table

## VERIFICATION

After making changes, verify with:
```bash
# Build check
npm run build

# Analytics API returns real data
curl -s "https://matchups-eta.vercel.app/api/analytics?type=teams&sport=NFL" | head -200

# Full data audit
set -a && source .env.local && set +a && npx tsx scripts/full-audit.ts

# E2E tests
npx playwright test
```

Start by reading docs/AGENT_HANDOFF_V3.md and TASKS.md, then begin with Phase 1 tasks.

---
