# Matchups - Task Tracker

> **Last Updated:** February 2026
> **Production URL:** <https://matchups-eta.vercel.app>
> **Supabase Project:** Matchups (cdfdmkntdsfylososgwo)
> **Current Commit:** 5d08098

---

## CURRENT STATE: Data Layer Audit Complete

Full audit completed February 2026. The platform builds and deploys cleanly (148 pages), team analytics are accurate, but significant data gaps exist in the database layer.

---

## DATA COVERAGE SUMMARY

### historical_games - 82,876 total

| Sport | Games | Seasons | Coverage |
|-------|-------|---------|----------|
| NFL | 6,860 | 26 (2000-2025) | 100% spreads, results, scores |
| NBA | 21,682 | 26 (2000-2025) | 98.7% spreads |
| MLB | 31,516 | 26 (2000-2025) | 100% |
| NHL | 22,818 | 25 (2000-2025) | 100% |
| NCAAF | 0 | EMPTY | Nothing imported |
| NCAAB | 0 | EMPTY | Nothing imported |

### game_odds - 18,598 total (from The Odds API)

| Sport | Records | Seasons |
|-------|---------|---------|
| NFL | 1,707 | 5 (2020-2024) - Missing 2025! |
| NBA | 2,692 | 5 (2021-2025) |
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

- [x] Historical games imported: NFL, NBA, MLB, NHL (25-26 seasons each, 2000-2025)
- [x] NBA historical_games fully backfilled - 34,841 games across all 26 seasons
- [x] Game odds imported from The Odds API (6 sports, ~19,000+ records)
- [x] NFL 2025 game_odds imported (285 records, Sep 2025 - Feb 2026)
- [x] NBA 2025-26 game_odds imported (201 records, Oct 2025 - Feb 2026)
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

### P0: Data Gaps

- [ ] Import NCAAF historical games - Table is EMPTY (0 games). game_odds has 3,898 NCAAF records but no historical games to match. Import from ESPN or other source.

- [ ] Import NCAAB historical games - Same as NCAAF. EMPTY. game_odds has 2,891 records with no games.

- [ ] Import NFL 2025 game_odds - ~~Historical import only covers 2020-2024~~ **DONE** (285 records imported via scripts/import-game-odds.ts)

- [ ] ~~Fix Super Bowl labeling~~ **DONE** - Pro Bowl (Feb 4, NFC 66 - AFC 52) relabeled as `season_type: 'probowl'`. Actual Super Bowl LX (Feb 8, SEA 29 - NE 13, ESPN ID 401772988) inserted with full data.

- [x] NBA historical_games backfilled — All 26 seasons (2000-2025) now have complete data. Total: 34,841 games.

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

### Phase 1: Data Completeness

- [ ] All sports with 5+ years historical games
- [ ] All game_odds current through latest season
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

# Build
npm run build

# E2E tests
npx playwright test
```
