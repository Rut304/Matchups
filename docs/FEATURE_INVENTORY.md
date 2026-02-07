# Matchups Feature Inventory

**Generated:** February 7, 2026  
**Purpose:** Comprehensive catalog of all features, tools, and services in the codebase

---

## Table of Contents

1. [Core Betting Features](#core-betting-features)
2. [Data Collection / APIs](#data-collection--apis)
3. [Player/Props Features](#playerprops-features)
4. [AI/Intelligence Features](#aiintelligence-features)
5. [User Features](#user-features)
6. [Admin Features](#admin-features)
7. [Database Schemas](#database-schemas)
8. [Scripts/Utilities](#scriptsutilities)
9. [Overlap Analysis & Recommendations](#overlap-analysis--recommendations)

---

## Core Betting Features

### 1. Scores & Odds Hub

| Item | Description | Status | Notes |
|------|-------------|--------|-------|
| `/scores` | Main scores page with live games, odds, betting data | ✅ Active | Central hub for today's games |
| `/nfl`, `/nba`, `/nhl`, `/mlb` | Sport-specific pages with matchups | ✅ Active | Include rankings, players subpages |
| `/ncaaf`, `/ncaab`, `/wnba`, `/wncaab` | College & women's sports | ✅ Active | Less comprehensive than major sports |
| `/game/[id]` | Individual game detail page | ✅ Active | Deep dive on single matchup |
| `/live/[gameId]` | Live game tracking with real-time updates | ✅ Active | Play-by-play, live odds |
| `/matchups` | General matchups overview | ✅ Active | Possible duplicate of scores |

### 2. Line Shopping & Odds

| Item | Description | Status | Notes |
|------|-------------|--------|-------|
| `/lineshop` | Multi-book odds comparison with line history | ✅ Active | Uses The Odds API - key feature |
| `/api/odds` | Odds API endpoint | ✅ Active | Fetches from The Odds API |
| `/api/lines` | Lines endpoint | ✅ Active | Similar to odds |
| `/api/line-snapshots` | Historical line data | ✅ Active | For CLV tracking |
| `/api/line-predictor` | Line movement prediction | ⚠️ Experimental | AI-based predictions |

### 3. THE EDGE (Sharp Money Intelligence)

| Item | Description | Status | Notes |
|------|-------------|--------|-------|
| `/edge/[gameId]` | Game-specific edge analysis | ✅ Active | Redirects to /markets/edge |
| `/edge/splits` | Betting splits viewer | ✅ Active | Public vs sharp money |
| `/markets/edge` | Sharp money signals & edge alerts | ✅ Active | RLM, steam moves, CLV |
| `src/lib/edge/engine.ts` | Edge score calculation engine | ✅ Active | Core algorithm |
| `src/lib/edge-features.ts` | Edge alert definitions | ✅ Active | RLM, steam, CLV, arbitrage |
| `src/lib/betting-intelligence.ts` | 12-point betting data layer | ✅ Active | 2000+ lines, comprehensive |
| `/api/edge` | Edge alerts API | ✅ Active | Returns edge signals |
| `/api/edges` | Alternative edge endpoint | ⚠️ Possible duplicate | Check if both needed |

### 4. Trends & Patterns

| Item | Description | Status | Notes |
|------|-------------|--------|-------|
| `/trends` | Betting trends with historical records | ✅ Active | Shows hot/cold trends |
| `/trends/[id]` | Individual trend detail | ✅ Active | Deep dive |
| `/trends/all` | All trends view | ✅ Active | |
| `/trend-finder` | AI trend search (chat interface) | ✅ Active | Natural language queries |
| `/patterns` | Historical betting patterns with matching games | ✅ Active | Pattern discovery UI |
| `/api/trends` | Trends API | ✅ Active | |
| `/api/game-trends` | Game-specific trends | ✅ Active | |
| `/api/patterns` | Patterns API | ✅ Active | |
| `/api/pattern-discovery` | AI pattern discovery | ✅ Active | Uses Gemini |
| `src/lib/services/pattern-discovery.ts` | Pattern AI service | ✅ Active | Discovers new patterns |

### 5. Betting Systems

| Item | Description | Status | Notes |
|------|-------------|--------|-------|
| `/systems` | Custom betting system builder | ✅ Active | Create & backtest systems |
| `/api/systems/backtest` | System backtesting API | ✅ Active | Tests against historical data |
| `/api/systems/popular` | Popular systems endpoint | ✅ Active | Community systems |
| `src/lib/data/standard-betting-systems.ts` | Pre-built systems | ✅ Active | Common angles |
| `src/lib/data/bankroll-management-systems.ts` | Bankroll strategies | ✅ Active | Kelly, martingale, etc. |

### 6. Expert/Capper Tracker

| Item | Description | Status | Notes |
|------|-------------|--------|-------|
| `/leaderboard` | Expert tracker with real records | ✅ Active | **Key feature** - tracks celebrities |
| `/leaderboard/[slug]` | Individual capper profile | ✅ Active | Detailed stats |
| `/picks` | Community picks page | ✅ Active | |
| `/api/leaderboard` | Leaderboard data | ✅ Active | |
| `/api/picks` | Picks API | ✅ Active | |
| `/api/cappers` | Cappers data | ✅ Active | |
| `/api/expert-picks` | Expert picks endpoint | ✅ Active | |
| `src/lib/leaderboard-data.ts` | Leaderboard data layer | ✅ Active | |
| `src/lib/services/leaderboard-service.ts` | Leaderboard service | ✅ Active | Supabase integration |

### 7. Suspicious Plays Tracker

| Item | Description | Status | Notes |
|------|-------------|--------|-------|
| `/sus` | Sus plays tracker (Shohei's Mizuhara reference) | ✅ Active | Unique feature |
| `/api/sus` | Sus plays API | ✅ Active | |
| `src/components/sus/*` | Sus components | ✅ Active | Search aggregator |
| `supabase/sus-plays-schema.sql` | Sus plays schema | ✅ Active | DB schema |

### 8. Calculators

| Item | Description | Status | Notes |
|------|-------------|--------|-------|
| `/calculators` | Betting calculators hub | ✅ Active | Parlay, hedge, Kelly, EV, arb |
| `/api/betting-intelligence` | Advanced calcs API | ✅ Active | |

### 9. Alerts System

| Item | Description | Status | Notes |
|------|-------------|--------|-------|
| `/alerts` | Betting alerts page | ✅ Active | Line moves, sharp action, injury |
| `/api/alerts` | Alerts API | ✅ Active | |
| `/api/edge/alerts` | Edge-specific alerts | ⚠️ Possible duplicate | Overlaps with /api/alerts |

---

## Data Collection / APIs

### Primary Data Sources

| Item | Description | Status | Notes |
|------|-------------|--------|-------|
| `src/lib/api/the-odds-api.ts` | The Odds API client (paid) | ✅ Active | Primary odds source |
| `src/lib/api/espn.ts` | ESPN API client (free) | ✅ Active | Scores, schedules, stats |
| `src/lib/api/free-sports-apis.ts` | Free API endpoints catalog | ✅ Active | ESPN, NHL, MLB endpoints |
| `src/lib/api/data-sources.ts` | Data source hierarchy manager | ✅ Active | Fallback logic |
| `src/lib/api/api-sports.ts` | API Sports client | ⚠️ Unknown | Check usage |

### Scrapers

| Item | Description | Status | Notes |
|------|-------------|--------|-------|
| `src/lib/scrapers/action-network.ts` | Action Network betting splits | ✅ Active | Real betting percentages |
| `src/lib/scrapers/x-scraper.ts` | X/Twitter scraper for picks | ✅ Active | Parses expert tweets |
| `src/lib/scrapers/betting-splits.ts` | Betting splits module | ✅ Active | |
| `src/lib/scrapers/covers-scraper.ts` | Covers.com scraper | ⚠️ Check if working | Consensus picks |
| `src/lib/scrapers/espn-picks-scraper.ts` | ESPN picks scraper | ⚠️ Check if working | |

### API Endpoints (Internal)

| Item | Description | Status | Notes |
|------|-------------|--------|-------|
| `/api/games` | Games listing | ✅ Active | Core endpoint |
| `/api/games/[id]/*` | Game details, props | ✅ Active | |
| `/api/matchup` | Matchup data | ✅ Active | |
| `/api/matchups` | Matchups listing | ⚠️ Duplicate | Same as /api/games? |
| `/api/scores` | Live scores | ✅ Active | |
| `/api/standings` | League standings | ✅ Active | |
| `/api/stats` | Stats endpoint | ✅ Active | |
| `/api/team/*` | Team endpoints | ✅ Active | stats, history, news |
| `/api/teams` | Teams listing | ✅ Active | |
| `/api/injuries` | Injury reports | ✅ Active | |
| `/api/weather` | Weather data | ✅ Active | |
| `/api/news` | News endpoint | ✅ Active | |
| `/api/game-news` | Game-specific news | ✅ Active | |
| `/api/team-news` | Team-specific news | ⚠️ Possible duplicate | |

### Data Layer Libraries

| Item | Description | Status | Notes |
|------|-------------|--------|-------|
| `src/lib/data-layer.ts` | Main data layer | ✅ Active | |
| `src/lib/unified-data-store.ts` | Unified data store | ⚠️ Check usage | May overlap with data-layer |
| `src/lib/data-fetchers.ts` | Data fetching utilities | ✅ Active | |
| `src/lib/api-service.ts` | General API service | ⚠️ Check usage | May be outdated |
| `src/lib/analytics-data.ts` | Analytics data module | ✅ Active | |
| `src/lib/sports-data.ts` | Sports data functions | ✅ Active | |
| `src/lib/live-sports-data.ts` | Live data functions | ✅ Active | |
| `src/lib/historical-data.ts` | Historical data layer | ✅ Active | |

---

## Player/Props Features

| Item | Description | Status | Notes |
|------|-------------|--------|-------|
| `/props` | Player props comparison | ✅ Active | Best odds across books |
| `/props/correlations` | Props correlations | ✅ Active | Related props |
| `/players` | Players listing | ✅ Active | |
| `/player/[sport]/[id]` | Player detail page | ✅ Active | |
| `/nfl/players` | NFL players | ✅ Active | |
| `/api/props` | Props API | ✅ Active | |
| `/api/props/correlations` | Correlations API | ✅ Active | |
| `src/lib/api/player-props.ts` | Player props module | ✅ Active | |

---

## AI/Intelligence Features

| Item | Description | Status | Notes |
|------|-------------|--------|-------|
| `src/lib/ai-edge-analysis.ts` | AI edge analysis (823 lines) | ✅ Active | Gemini-powered analysis |
| `src/lib/gemini.ts` | Gemini AI client | ✅ Active | Google AI integration |
| `src/lib/services/pattern-discovery.ts` | AI pattern discovery | ✅ Active | Finds new betting patterns |
| `/api/ai/game-analysis` | AI game analysis endpoint | ✅ Active | |
| `/trend-finder` | Natural language trend search | ✅ Active | Chat-style interface |
| `/api/trend-finder` | Trend finder API | ✅ Active | |
| `src/lib/ou-analysis.ts` | Over/under analysis | ✅ Active | |
| `src/lib/news-analytics.ts` | News analysis | ✅ Active | Sentiment, impact |
| `src/lib/models/*` | Prediction models | ⚠️ Check status | Line predictor models |

---

## User Features

| Item | Description | Status | Notes |
|------|-------------|--------|-------|
| `/dashboard` | User dashboard | ✅ Active | Followed games, teams, players |
| `/control-panel` | Advanced user control panel | ⚠️ Overlaps with dashboard | Similar to dashboard |
| `/my-picks` | User's picks tracking | ✅ Active | |
| `/profile` | User profile page | ✅ Active | |
| `/auth` | Authentication pages | ✅ Active | Supabase Auth |
| `/api/user/*` | User API endpoints | ✅ Active | |
| `/api/user-picks` | User picks API | ✅ Active | |
| `/api/follows` | Follow system API | ✅ Active | |
| `/api/bets` | Bet tracking API | ✅ Active | |
| `src/lib/auth-context.tsx` | Auth context | ✅ Active | |
| `src/lib/supabase/*` | Supabase clients | ✅ Active | |

### Marketplace (System Sharing)

| Item | Description | Status | Notes |
|------|-------------|--------|-------|
| `/marketplace` | Betting system marketplace | ✅ Active | Share/copy systems |
| `/marketplace/[id]` | System detail | ✅ Active | |
| `/marketplace/bankroll-systems` | Bankroll systems | ✅ Active | |
| `/api/marketplace` | Marketplace API | ✅ Active | |

---

## Admin Features

| Item | Description | Status | Notes |
|------|-------------|--------|-------|
| `/admin` | Admin dashboard | ✅ Active | Overview, settings |
| `/admin/api-usage` | API usage monitoring | ✅ Active | Rate limits, costs |
| `/admin/architecture` | Architecture docs | ✅ Active | |
| `/admin/diagnostics` | System diagnostics | ✅ Active | Health checks |
| `/admin/docs` | Documentation | ✅ Active | |
| `/admin/health` | Health monitoring | ✅ Active | |
| `/admin/manage` | Content management | ✅ Active | |
| `/admin/picks` | Pick management | ✅ Active | |
| `/admin/scrapers-tab.tsx` | Scraper management | ✅ Active | Run scrapers |
| `/api/admin/*` | Admin API endpoints | ✅ Active | Settings, users, scrapers |
| `/api/health` | Health check endpoint | ✅ Active | |

### Cron Jobs

| Item | Description | Status | Notes |
|------|-------------|--------|-------|
| `/api/cron/discover-trends` | Auto-discover trends | ✅ Active | |
| `/api/cron/grade-picks` | Auto-grade picks | ✅ Active | |
| `/api/cron/refresh-injuries` | Refresh injury data | ✅ Active | |
| `/api/cron/refresh-odds` | Refresh odds | ✅ Active | |
| `/api/cron/refresh-scores` | Refresh live scores | ✅ Active | |
| `/api/cron/refresh-standings` | Refresh standings | ✅ Active | |
| `/api/cron/scrape-experts` | Scrape expert picks | ✅ Active | |
| `/api/cron/sync-games` | Sync games data | ✅ Active | |
| `/api/cron/update-scores` | Update scores | ⚠️ Duplicate | Same as refresh-scores? |

---

## Database Schemas

### Core Schemas

| File | Description | Status | Notes |
|------|-------------|--------|-------|
| `FULL_SCHEMA_RUN_THIS.sql` | Master schema file | ✅ Active | Run this for full setup |
| `schema.sql` | Basic schema | ⚠️ Older | May be superseded |
| `schema-safe.sql` | Safe version | ⚠️ Older | |
| `auth-setup.sql` | Auth configuration | ✅ Active | |

### Feature Schemas

| File | Description | Status | Notes |
|------|-------------|--------|-------|
| `cappers-schema.sql` | Cappers/experts | ✅ Active | |
| `cappers-schema-safe.sql` | Safe version | ⚠️ Duplicate | |
| `leaderboard-schema.sql` | Leaderboard tables | ✅ Active | |
| `expert-picks-schema.sql` | Expert picks | ✅ Active | |
| `expert-tracking-schema.sql` | Expert tracking | ⚠️ Possible duplicate | |
| `add-twitter-to-experts.sql` | Twitter handles | ✅ Active | Migration |
| `add-more-cappers.sql` | More cappers | ✅ Active | Seed data |

### Historical Data Schemas

| File | Description | Status | Notes |
|------|-------------|--------|-------|
| `historical-games-schema.sql` | Historical games v1 | ⚠️ Older | |
| `historical-games-schema-v2.sql` | Historical games v2 | ✅ Active | |
| `historical-data-schema.sql` | Historical data | ✅ Active | |
| `historical-data-20years.sql` | 20 years data | ✅ Active | |
| `all-sports-historical.sql` | All sports historical | ⚠️ Possible duplicate | |
| `complete-historical-all-sports.sql` | Complete historical | ⚠️ Possible duplicate | |
| `full-season-historical-data.sql` | Full season data | ⚠️ Possible duplicate | |
| `alter-historical-games.sql` | Schema alterations | ✅ Active | Migration |

### Betting Feature Schemas

| File | Description | Status | Notes |
|------|-------------|--------|-------|
| `advanced-betting-schema.sql` | Advanced betting | ⚠️ Check | |
| `comprehensive-betting-schema.sql` | Comprehensive betting | ⚠️ Possible duplicate | |
| `edge-alerts-schema.sql` | Edge alerts | ✅ Active | |
| `confidence-score-schema.sql` | Confidence scores | ✅ Active | |
| `line_snapshots_schema.sql` | Line snapshots | ✅ Active | |
| `line-predictor-schema.sql` | Line predictions | ✅ Active | |
| `pattern-discovery-schema.sql` | Patterns | ✅ Active | |
| `sus-plays-schema.sql` | Sus plays | ✅ Active | |

### User Feature Schemas

| File | Description | Status | Notes |
|------|-------------|--------|-------|
| `user-dashboard-schema.sql` | User dashboard | ✅ Active | |
| `user-control-panel-schema.sql` | Control panel | ⚠️ Overlaps with dashboard | |
| `user-systems-schema.sql` | User systems | ✅ Active | |
| `marketplace-schema.sql` | Marketplace | ✅ Active | |
| `admin-settings-schema.sql` | Admin settings | ✅ Active | |

### Utility Schemas

| File | Description | Status | Notes |
|------|-------------|--------|-------|
| `fix-compute-stats.sql` | Fix stats computation | ✅ Migration | |
| `fix-leaderboard.sql` | Fix leaderboard | ✅ Migration | |
| `fix-trigger.sql` | Fix triggers | ✅ Migration | |
| `populate-capper-stats.sql` | Populate stats | ✅ Migration | |

---

## Scripts/Utilities

### Data Import Scripts

| Script | Description | Status | Notes |
|--------|-------------|--------|-------|
| `import-historical-data.ts` | Import 25 years of data | ✅ Active | Comprehensive |
| `import-25-years.sh` | Shell wrapper | ✅ Active | |
| `run-historical-data.ts` | Run historical import | ⚠️ Possible duplicate | |
| `populate-historical.sh` | Populate historical | ⚠️ Possible duplicate | |

### Seeding Scripts

| Script | Description | Status | Notes |
|--------|-------------|--------|-------|
| `seed-supabase.ts` | Main seed script | ✅ Active | |
| `seed-picks.ts` | Seed capper picks | ✅ Active | |
| `seed-more-cappers.ts` | Seed additional cappers | ✅ Active | |
| `seed-sus-plays.ts` | Seed sus plays | ✅ Active | |
| `init-db.ts` | Initialize database | ✅ Active | |
| `init-data.sh` | Initialize data | ✅ Active | |

### Scraping Scripts

| Script | Description | Status | Notes |
|--------|-------------|--------|-------|
| `scrape-experts.ts` | Expert scraper CLI | ✅ Active | Scheduled scraping |

### Utility Scripts

| Script | Description | Status | Notes |
|--------|-------------|--------|-------|
| `check-schema.ts` | Validate schema | ✅ Active | |
| `debug-trigger.ts` | Debug triggers | ✅ Active | |
| `edge-engine-smoke.ts` | Smoke test edge engine | ✅ Active | |
| `ingest-line-snapshots.ts` | Ingest line data | ✅ Active | |
| `test-insert.ts` | Test insert operations | ✅ Active | Development |

---

## Overlap Analysis & Recommendations

### 🔴 Critical Overlaps (Recommend Consolidation)

#### 1. Dashboard vs Control Panel

- **Files:** `/dashboard` and `/control-panel`
- **Issue:** Both provide user dashboard functionality with followed games, teams, alerts
- **Recommendation:** Merge into single `/dashboard` with tabs for different views
- **Lines affected:** ~1,800 combined

#### 2. Multiple API Endpoints for Same Data

| Duplicate Set | Files | Recommendation |
|--------------|-------|----------------|
| Games/Matchups | `/api/games`, `/api/matchups`, `/api/matchup` | Keep `/api/games`, deprecate others |
| Scores/Updates | `/api/cron/refresh-scores`, `/api/cron/update-scores` | Consolidate to single endpoint |
| Alerts | `/api/alerts`, `/api/edge/alerts` | Merge into `/api/alerts` |
| Team News | `/api/news`, `/api/game-news`, `/api/team-news` | Consolidate with query params |

#### 3. Historical Data Schemas (6+ files)

- **Files:** `historical-games-schema.sql`, `historical-games-schema-v2.sql`, `historical-data-schema.sql`, `all-sports-historical.sql`, `complete-historical-all-sports.sql`, `full-season-historical-data.sql`
- **Recommendation:** Archive old versions, keep only `FULL_SCHEMA_RUN_THIS.sql` and `historical-data-20years.sql`

#### 4. Data Layer Files

- **Files:** `data-layer.ts`, `unified-data-store.ts`, `api-service.ts`, `data-fetchers.ts`
- **Recommendation:** Audit usage, consolidate to single `data-layer.ts`

### 🟡 Moderate Overlaps (Consider Reviewing)

#### 1. Capper/Expert Schemas

- Multiple schema files for cappers (`cappers-schema.sql`, `cappers-schema-safe.sql`, `expert-picks-schema.sql`, `expert-tracking-schema.sql`)
- Review which are actively used

#### 2. Betting Schemas

- `advanced-betting-schema.sql` vs `comprehensive-betting-schema.sql`
- May have evolved separately

#### 3. Import Scripts

- `import-historical-data.ts`, `run-historical-data.ts`, `populate-historical.sh`
- Some may be older versions

### 🟢 Incomplete/Unused Features

| Feature | Path | Issue | Recommendation |
|---------|------|-------|----------------|
| API Sports client | `src/lib/api/api-sports.ts` | Unclear if used | Audit usage |
| Covers scraper | `src/lib/scrapers/covers-scraper.ts` | May not be working | Test or remove |
| ESPN picks scraper | `src/lib/scrapers/espn-picks-scraper.ts` | May not be working | Test or remove |
| Line predictor models | `src/lib/models/*` | Experimental | Review accuracy |
| Prediction market features | `/markets/*` subpages | May be underdeveloped | Complete or remove |

### 📊 Feature Count Summary

| Category | Active | Needs Review | Likely Duplicate |
|----------|--------|--------------|------------------|
| Pages | 45+ | 5 | 3 |
| API Endpoints | 60+ | 8 | 6 |
| Library Files | 35+ | 6 | 4 |
| Database Schemas | 25+ | 8 | 10 |
| Scripts | 16 | 2 | 2 |

### 🎯 Priority Recommendations

1. **Immediate:** Consolidate dashboard/control-panel into single feature
2. **Short-term:** Clean up duplicate API endpoints (games/matchups, alerts)
3. **Medium-term:** Archive old schema files, maintain only current versions
4. **Long-term:** Audit and consolidate data layer files
5. **Ongoing:** Test and verify all scrapers are functional

---

## Active Feature Matrix

✅ = Working  |  ⚠️ = Needs attention  |  ❌ = Broken/Unused

| Feature | Status | Data Source | Priority |
|---------|--------|-------------|----------|
| Live Scores | ✅ | ESPN | High |
| Odds Comparison | ✅ | The Odds API | High |
| Expert Leaderboard | ✅ | Supabase + Twitter | High |
| Betting Trends | ✅ | Action Network + DB | High |
| Sharp Money (Edge) | ✅ | Action Network | High |
| Sus Plays | ✅ | User submissions + DB | Medium |
| Pattern Discovery | ✅ | AI + Historical | Medium |
| Systems Builder | ✅ | DB + Backtesting | Medium |
| Marketplace | ✅ | DB | Medium |
| Calculators | ✅ | Client-side | Low |
| AI Analysis | ✅ | Gemini | Medium |
| User Dashboard | ⚠️ | Supabase | Medium - Duplicate |
| X/Twitter Scraper | ✅ | Twitter API | High |
| Covers Scraper | ⚠️ | Web scraping | Low - Test |
| Line Predictor | ⚠️ | AI Models | Low - Experimental |
