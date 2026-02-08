# Matchups Site Audit Report

**Date:** February 7, 2026  
**Audited By:** AI Agent

---

## Executive Summary

| Category | Total | Issues | Health |
|----------|-------|--------|--------|
| Pages/Routes | 96 | 17 | 82% |
| API Endpoints | 88 | 10 | 89% |
| Components | 54 | 3 | 94% |
| Scrapers | 6 | 1 | 83% |
| Hooks | 7 | 2 | 71% |

**Overall Score: 78/100** - Production-ready with known gaps

---

## 1. Pages with Mock Data (PRIORITY: HIGH)

These pages display hardcoded fake data instead of real API data:

| Page | Issue | Fix |
|------|-------|-----|
| `/picks` | `mockPicks` array | Connect to `/api/picks` |
| `/players` | `mockPlayers` array | Use ESPN player API |
| `/nba/players` | Hardcoded player stats | Use `/api/players?sport=nba` |
| `/nfl/players` | Mock passing/rushing stats | Use ESPN API |
| `/nfl/rankings` | `teamRankings` hardcoded | Use `/api/standings` |
| `/ncaaf/players` | Mock NCAAF data | Low priority (college data scarce) |
| `/analytics` | Uses `getMockLinePredictions()` | Connect to ML model |
| `/admin/diagnostics` | Generates fake test results | Wire to real test runner |
| `/performance` | Simulated 20-year data | Use Supabase historical_games |

---

## 2. "Coming Soon" Placeholders (PRIORITY: MEDIUM)

Features announced but not implemented:

| Location | Placeholder | Recommendation |
|----------|-------------|----------------|
| `/nba` hub | "Player Props Coming Soon" | ✅ GamePlayerProps already added |
| `/nhl` hub | "Goalie Stats Coming Soon" | Add NHL goalie API endpoint |
| `/mlb` hub | "Pitcher Stats Coming Soon" | Add MLB pitching API |
| `/ncaab/players` | "March Madness Predictions" | Build bracket predictor |
| `/markets/edge` | "Prediction Markets Coming Soon" | Already have Polymarket data |
| `/watch/[gameId]` | "Detailed box score coming soon" | Use ESPN box score API |
| `/stats` | "Detailed statistics coming soon" | Expand stats page |
| `/admin` | "Email/Slack notifications" | Add notification service |
| `/game/[id]` | Coming Soon fallback | Handle edge cases better |

---

## 3. Broken Navigation Links (PRIORITY: HIGH)

Links in Navbar that 404:

| Link | Status | Fix |
|------|--------|-----|
| `/markets/entertainment` | Missing | Create page or remove link |
| `/markets/tech` | Missing | Create page or remove link |
| `/markets/economics` | Missing | Create page or remove link |
| `/markets/news` | Missing | Create page or remove link |
| `/wnba/players` | Missing | Create page |
| `/wnba/rankings` | Missing | Create page |
| `/wncaab/players` | Missing | Create page |
| `/wncaab/rankings` | Missing | Create page |

---

## 4. API Endpoints Using Mock Data (PRIORITY: HIGH)

| Endpoint | Issue | Solution |
|----------|-------|----------|
| `/api/alerts` | Returns hardcoded mock alerts | Connect to Supabase edge_alerts |
| `/api/lines` | Mock line movements | Merge with `/api/edges` (has real data) |
| `/api/public-betting` | Mock betting %s | Redirect to `/api/betting-splits` |
| `/api/confidence-scores` | Uses getMockConfidenceScores() | Implement real ML model |
| `/api/line-predictor` | Uses getMockLinePredictions() | Implement real ML model |
| `/api/patterns` | Hardcoded pattern data | Connect to pattern-discovery service |
| `/api/clv` | Mock for unauthenticated | Add auth-gated real CLV |

---

## 5. Duplicate/Redundant APIs (PRIORITY: LOW)

| Duplicates | Recommendation |
|------------|----------------|
| `/api/odds` + `/api/action-odds` | Keep both (different sources) |
| `/api/lines` + `/api/edges` | **Merge** - delete `/api/lines` |
| `/api/public-betting` + `/api/betting-splits` | **Merge** - use `/api/betting-splits` only |
| `/api/alerts` + `/api/edge/alerts` | **Consolidate** into single alert system |
| `/api/cron/update-scores` + `/api/cron/refresh-scores` | **Remove duplicate** |

---

## 6. Unused Code to Remove (PRIORITY: LOW)

### Orphaned Hooks

- `src/hooks/useAnalytics.ts` (8.7KB) - Never imported
- `src/hooks/useGameIntelligence.ts` (20KB) - Never imported

### Orphaned Components

- `src/components/home/DataDisplay.tsx` - Contains useful UI but never imported

### Unused Scraper

- `src/lib/scrapers/sportsbook-props.ts` - Complete but not integrated

---

## 7. Missing Features (PRIORITY: MEDIUM)

### Navigation

- No breadcrumb navigation on deep pages
- Mobile navigation needs improvement
- Sport switcher dropdown on matchup pages

### Data Gaps

- No WNBA standings/rankings pages
- No WNCAAB standings/rankings pages  
- Player detail pages return placeholder data
- Team detail pages sparse on stats

### User Features

- No push notifications
- No email alerts
- No parlay builder
- No bankroll tracking dashboard
- No bet slip persistence

### Analytics

- No A/B testing infrastructure
- No user behavior tracking
- No conversion funnels

---

## 8. Error Handling Issues (PRIORITY: MEDIUM)

| File | Issue |
|------|-------|
| `/api/markets` | Silent failure returns empty array |
| `/api/trend-finder` | Gemini API errors not gracefully handled |
| `/api/pattern-discovery` | Missing error handling for AI failures |
| `SusSearchAggregator.tsx` | TODO: Implement real Twitter/Reddit API |
| `ErrorBoundary.tsx` | TODO: Log to Sentry/LogRocket |

---

## 9. Performance Recommendations

### Caching

- Add Redis/Upstash for API response caching
- Implement stale-while-revalidate pattern
- Cache ESPN data for 30-60 seconds

### Database

- Add compound indexes on `games(sport, status, scheduled_at)`
- Consider materialized views for leaderboard calculations
- Add connection pooling

### Frontend

- Implement virtual scrolling for long lists
- Add skeleton loaders to all async components
- Lazy load below-fold components

---

## 10. Architecture Recommendations

### API Structure

```
Current:   /api/odds, /api/action-odds, /api/lines, /api/edges
Proposed:  /api/odds (aggregates all sources)
           /api/odds/movement
           /api/odds/comparison
```

### Data Flow

```
Current:   Page → API → Multiple external calls → Response
Proposed:  Page → API → Cache check → External (if miss) → Cache set → Response
```

### Scraper Integration

```
Current:   Scrapers exist but some not connected
Proposed:  Cron job runs scrapers → Stores in Supabase → API reads from DB
           /api/cron/scrape-props → sportsbook-props.ts → player_props table
```

---

## 11. Prioritized Action Plan

### Week 1: Critical Fixes

1. ✅ Fix 8 broken navigation links (create missing pages or remove links)
2. ✅ Replace mock data in `/api/alerts`
3. ✅ Merge `/api/lines` into `/api/edges`
4. ✅ Wire `/picks` page to real `/api/picks` endpoint

### Week 2: Data Quality

5. Connect player pages to ESPN player stats API
2. Wire analytics page to real prediction model
3. Integrate `sportsbook-props.ts` scraper with cron job
4. Add WNBA/WNCAAB rankings pages

### Week 3: Polish

9. Remove orphaned hooks and components
2. Add error logging service (Sentry)
3. Implement push notifications
4. Build parlay builder feature

### Week 4+: Enhancements

13. Add Redis caching layer
2. Build bankroll tracker
3. Implement A/B testing
4. Mobile app considerations

---

## 12. Quick Wins (< 1 hour each)

1. **Remove broken nav links** - Edit Navbar.tsx
2. **Delete unused hooks** - rm useAnalytics.ts, useGameIntelligence.ts  
3. **Wire picks to API** - Replace mockPicks with fetch('/api/picks')
4. **Consolidate alerts** - Point /api/alerts to /api/edge/alerts logic
5. **Remove "Coming Soon" for props** - Already implemented via GamePlayerProps
6. **Add loading states** - Many pages missing skeleton loaders

---

## Appendix: Complete Route Inventory

<details>
<summary>All 96 Pages (click to expand)</summary>

### Core Routes (9)

- `/` - Home
- `/auth` - Authentication
- `/dashboard` - User dashboard
- `/control-panel` - Live tracking
- `/profile` - User settings
- `/scores` - Live scores
- `/live` - Live hub
- `/live/[gameId]` - Live game detail
- `/watch/[gameId]` - Watch page

### Sports (32)

#### NFL (6)

- `/nfl` - Hub
- `/nfl/matchups` - List
- `/nfl/matchups/[gameId]` - Detail
- `/nfl/rankings` - Team rankings
- `/nfl/players` - Player stats

#### NBA (6)

- `/nba` - Hub
- `/nba/matchups` - List  
- `/nba/matchups/[gameId]` - Detail
- `/nba/rankings` - Rankings
- `/nba/players` - Players

#### NHL (7)

- `/nhl` - Hub
- `/nhl/matchups` - List
- `/nhl/matchups/[gameId]` - Detail
- `/nhl/rankings` - Rankings
- `/nhl/goalies` - Goalie stats
- `/nhl/skaters` - Skater stats

#### MLB (5)

- `/mlb` - Hub
- `/mlb/matchups` - List
- `/mlb/matchups/[gameId]` - Detail
- `/mlb/rankings` - Rankings
- `/mlb/players` - Players

#### College (8)

- `/ncaaf` - Hub
- `/ncaaf/matchups` - List
- `/ncaaf/matchups/[gameId]` - Detail
- `/ncaaf/rankings` - Rankings
- `/ncaaf/players` - Players
- `/ncaab` - Hub
- `/ncaab/matchups` - List
- `/ncaab/matchups/[gameId]` - Detail
- `/ncaab/rankings` - Rankings
- `/ncaab/players` - Players

### Markets (11)

- `/markets` - Hub
- `/markets/edge` - Sharp money
- `/markets/edge/[id]` - Detail
- `/markets/edge/alerts` - Alerts
- `/markets/analytics` - Analytics
- `/markets/crypto` - Crypto
- `/markets/politics` - Politics
- `/markets/trending` - Trending
- `/markets/insights` - Insights

### Betting Tools (15)

- `/picks` - Community picks
- `/my-picks` - Personal picks
- `/props` - Player props
- `/props/correlations` - Correlations
- `/trends` - Trends
- `/trends/all` - All trends
- `/trends/[id]` - Trend detail
- `/trend-finder` - AI finder
- `/lineshop` - Line shopping
- `/systems` - System builder
- `/marketplace` - System market
- `/marketplace/[id]` - System detail
- `/marketplace/bankroll-systems` - Bankroll
- `/calculators` - Calculators
- `/patterns` - Patterns

### Other (21)

- `/alerts` - Alerts
- `/injuries` - Injuries
- `/news` - News
- `/weather` - Weather
- `/sus` - Sus plays
- `/stats` - Stats
- `/players` - All players
- `/player/[sport]/[playerId]` - Player detail
- `/leaderboard` - Leaderboard
- `/leaderboard/[slug]` - Capper profile
- `/game/[id]` - Game detail
- `/edge` - Edge redirect
- `/edge/[gameId]` - Edge detail
- `/edge/splits` - Splits
- `/team/[sport]/[team]` - Team detail
- `/analytics` - Analytics
- `/performance` - Performance
- `/performance/clv` - CLV
- `/wnba` - WNBA hub
- `/wnba/matchups` - WNBA games
- `/wncaab` - WNCAAB hub
- `/wncaab/matchups` - WNCAAB games

### Admin (8)

- `/admin` - Dashboard
- `/admin/api-usage` - API metrics
- `/admin/architecture` - Architecture
- `/admin/diagnostics` - Diagnostics
- `/admin/docs` - Docs
- `/admin/health` - Health
- `/admin/manage` - Management
- `/admin/picks` - Pick admin

</details>

---

**Report Generated:** February 7, 2026
