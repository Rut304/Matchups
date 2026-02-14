# Matchups - Task Tracker

> **Last Updated:** February 2026
> **Production URL:** <https://matchups-eta.vercel.app>
> **Supabase Project:** Matchups (cdfdmkntdsfylososgwo)
> **Current Commit:** Latest

---

## CURRENT STATE: Full Data Coverage Across All 6 Sports

All 6 sports now have complete historical games AND game_odds. In-season sports (NBA, NHL, NCAAB) also have future/scheduled games imported so users can look ahead.

---

## DATA COVERAGE SUMMARY

### historical_games - 106,827 total

| Sport | Historical | Scheduled | Total | Seasons |
|-------|-----------|-----------|-------|---------|
| NFL | 6,748 | 0 | 6,748 | 26 (2000-2025) |
| NBA | 34,841 | 422 | 35,263 | 26 (2000-2025) + future |
| NHL | 21,011 | 404 | 21,415 | 25 (2000-2025) + future |
| MLB | 31,765 | 0 | 31,765 | 26 (2000-2025) |
| NCAAF | 5,284 | 0 | 5,284 | 6 (2020-2025) |
| NCAAB | 5,923 | 429 | 6,352 | 6 (2020-2025) + future |

*Scheduled = upcoming games with no scores yet. NBA/NHL/NCAAB are in-season.*
*NFL/MLB/NCAAF seasons are over; 2026 schedules not yet published by ESPN.*

### game_odds - 19,051 total (from The Odds API)

| Sport | Records | Seasons |
|-------|---------|---------|
| NFL | 1,992 | 6 (2020-2025) |
| NBA | 2,860 | 5 (2021-2025) |
| MLB | 3,945 | 5 (2020-2024) |
| NHL | 3,465 | 5 (2021-2025) |
| NCAAF | 3,898 | 6 (2020-2025) |
| NCAAB | 2,891 | 5 (2021-2025) |

### Empty Tables

- line_snapshots - 0 records (line movement broken)
- odds - 0 records (cron writes but nothing reads)
- picks - 0 records (no user picks)
- betting_trends - null/nonexistent
- betting_splits - schema only, no data

---

## COMPLETED

### Infrastructure (All Deployed)

- [x] Next.js 16.1.1 with Turbopack - 148 pages, zero build errors
- [x] Vercel deployment with 17 cron jobs
- [x] Supabase Postgres with RLS
- [x] Supabase 1000-row pagination fix (all services use .range())
- [x] Environment variables on Vercel

### Data Pipeline

- [x] Historical games imported: ALL 6 SPORTS complete
- [x] NFL: 6,748 games (26 seasons, 2000-2025)
- [x] NBA: 35,263 games (26 seasons + 422 future scheduled)
- [x] NHL: 21,415 games (25 seasons + 404 future scheduled)
- [x] MLB: 31,765 games (26 seasons, 2000-2025)
- [x] NCAAF: 5,284 games (6 seasons, 2020-2025) — NEW
- [x] NCAAB: 6,352 games (6 seasons + 429 future scheduled) — NEW
- [x] Future/scheduled games imported for NBA, NHL, NCAAB (1,255 games)
- [x] Game odds imported from The Odds API (6 sports, 19,051 records)
- [x] NFL 2025 game_odds imported (285 records, Sep 2025 - Feb 2026)
- [x] NBA 2025-26 game_odds imported (201 records, Oct 2025 - Feb 2026)
- [x] Universal ESPN import script: scripts/import-espn-games.ts (any sport, historical + future)
- [x] game_odds table created and populated
- [x] odds_import_log tracking imports
- [x] backfill-closing-odds.ts script
- [x] CLV grading cron (grade-clv) runs 3x daily
- [x] Super Bowl LX inserted: SEA 29 - NE 13, Feb 8, 2026 (ESPN ID 401772988)
- [x] Pro Bowl relabeled: season_type='probowl' (Feb 4, 2026, NFC 66 - AFC 52)

### Analytics Engine

- [x] real-analytics.ts - Complete team analytics (ATS, O/U, ML, asFavorite, asUnderdog, last10)
- [x] Per-team per-date dedup - prevents duplicate game counting
- [x] Global dedup (date|home|away) - prevents same-game duplicates
- [x] Season detection heuristic - handles Jan-Jun mapping to prior season
- [x] game-odds-service.ts - Cross-references game_odds with historical_games
- [x] Provenance metadata on API responses

### Game Matchup Pages

- [x] /game/[id] - Fully working with ESPN data
- [x] Scores, odds, predictor, injuries, leaders
- [x] Line movement (open vs close)
- [x] H2H history from historical_games
- [x] AI analysis (Gemini 2.5 Flash, strict no-guessing)
- [x] Situational angles (rest, B2B, travel, revenge/letdown/trap)

### Features

- [x] All 6 sport pages (NFL, NBA, NHL, MLB, NCAAF, NCAAB)
- [x] Leaderboard page - 77 cappers seeded
- [x] Markets page - Polymarket/Kalshi
- [x] Edge detection (RLM, steam moves, sharp signals)
- [x] Expert tracking via X/Twitter scraping (rettiwt-api)
- [x] Admin dashboard and admin docs
- [x] Calculators, alerts, weather, injuries pages
- [x] Homepage redesign - compact matchup cards

### Bug Fixes (This Sprint)

- [x] Build error: import-odds/route.ts SupabaseClient type
- [x] Build error: betting-intelligence.ts nullable timeline types
- [x] Inflated game totals (BUF 41 to 24 games) via per-team per-date dedup
- [x] NFL dedup: 6,868 to 6,860 (8 duplicates removed from DB)
- [x] Gemini API key rotation + model upgrade to 2.5-flash
- [x] GitHub Push Protection resolved

---

## CRITICAL - Fix These First

### P0: Data Gaps — ALL RESOLVED

- [x] Import NCAAF historical games — **DONE** 5,284 games (2020-2025, 6 seasons) via ESPN API
- [x] Import NCAAB historical games — **DONE** 5,923 games (2020-2025, 6 seasons) via ESPN API
- [x] Import future/scheduled games — **DONE** 1,255 games (NBA 422, NHL 404, NCAAB 429)
- [x] Import NFL 2025 game_odds — **DONE** (285 records)
- [x] Fix Super Bowl labeling — **DONE**
- [x] NBA historical_games backfilled — **DONE** 34,841 games

### P0: Empty Tables Blocking Features

- [ ] Populate line_snapshots - 0 records. odds-snapshot cron runs every 30 min but may not write to this table. Debug cron and verify writes.

- [ ] Wire up odds table - 0 records. refresh-odds cron writes but no feature reads. Consolidate with game_odds or wire features.

- [ ] Verify picks write path - picks table is empty. UI has /picks and /my-picks but picks never save.

---

## HIGH PRIORITY

- [ ] Fix NBA missing spreads (1.3% of games)
- [ ] Create/populate betting_trends table
- [ ] Create/populate betting_splits for public vs sharp money
- [ ] Connect Line Shop to The Odds API (currently mock data)
- [ ] End-to-end picks tracking: user to DB to grade to leaderboard
- [ ] User dashboard with real data
- [ ] Social sharing (X/Twitter)

---

## FUTURE - Gambler's Paradise

### Phase 1: Data Completeness — DONE

- [x] All 6 sports with 5+ years historical games (106,827 total)
- [x] All game_odds current through latest season (19,051 total)
- [x] Future/scheduled games for in-season sports (1,255 games)
- [ ] Live line_snapshots from crons
- [ ] Betting splits data source

### Phase 2: Killer Features

- [ ] Arbitrage Finder
- [ ] Positive EV Finder
- [ ] Prop Bet Builder with correlation analysis
- [ ] Betting Simulator (backtest historical)
- [ ] Custom line movement alerts
- [ ] Referee/Umpire O/U trends

### Phase 3: Engagement

- [ ] Mobile app (PWA)
- [ ] Push notifications
- [ ] Premium tier (Stripe)
- [ ] Discord bot
- [ ] Newsletter

---

## Verification Commands

```bash
# Analytics API
curl -s "https://matchups-eta.vercel.app/api/analytics?type=teams&sport=NFL" | head -200

# Full audit
set -a && source .env.local && set +a && npx tsx scripts/full-audit.ts

# Check game counts
npx tsx scripts/check-counts.ts

# Import games from ESPN (historical or future)
npx tsx scripts/import-espn-games.ts ncaaf 2020 2025        # Historical
npx tsx scripts/import-espn-games.ts all 2025 2025 --future  # Future games

# Build
npm run build

# E2E tests
npx playwright test
```
