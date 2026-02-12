# Tools & Feature Pages Audit

**Generated:** February 11, 2026  
**Total Pages Audited:** 50+

---

## SUMMARY

### Duplicate Categories Identified

1. **Dashboard vs Control Panel** - Very similar functionality
2. **Picks vs My-Picks** - Overlapping pick tracking
3. **Trends vs Trend-Finder** - Related but different approaches
4. **Analytics vs Edge** - Overlap in edge-finding features
5. **Markets vs Marketplace** - Confusing naming (different purposes)
6. **Alerts (multiple)** - alerts/, markets/edge/alerts/, edge (alerts section)

### Consolidation Candidates

- `/edge` redirects to `/markets/edge` - can remove
- `/dashboard` and `/control-panel` - consolidate into one
- Multiple alerts pages - unify
- `/trends` and `/trend-finder` - consider consolidation

---

## CALCULATORS SECTION

### ROUTE: /calculators

**PURPOSE:** All-in-one betting calculators hub
**COMPONENTS:** Parlay calculator, Hedge calculator, Kelly Criterion, EV calculator, Arbitrage finder, Odds converter
**STATUS:** ✅ Active
**NOTES:** Well-designed, comprehensive tool with 6 calculators in tabs

---

## EDGE / ANALYTICS SECTION

### ROUTE: /edge

**PURPOSE:** Redirect to /markets/edge
**COMPONENTS:** Simple redirect
**DUPLICATE OF:** Redirects to /markets/edge
**STATUS:** ⚠️ Redirect only - can be removed or kept for backward compatibility

### ROUTE: /edge/splits

**PURPOSE:** Public & Sharp Money Betting Splits page
**COMPONENTS:** BettingSplitsTable - shows betting percentages, RLM, steam moves across sports
**STATUS:** ✅ Active
**NOTES:** Real data from SportsBettingDime, The Odds API

### ROUTE: /markets/edge

**PURPOSE:** Sports betting analytics & sharp money signals (THE EDGE)
**COMPONENTS:** Sharp money signals, RLM detection, steam moves, contrarian plays
**STATUS:** ✅ Active
**NOTES:** Toggle between sports betting and prediction markets modes

### ROUTE: /markets/edge/alerts

**PURPOSE:** Configure alert preferences for prediction market edges
**COMPONENTS:** AlertPreference settings, signal notifications (email, push, SMS)
**STATUS:** ✅ Active
**POTENTIAL DUPLICATE:** Similar to /alerts

### ROUTE: /analytics

**PURPOSE:** Comprehensive analytics dashboard with tabs
**COMPONENTS:** Edge Finder, Live Intel (news), Matchups, AI tabs
**STATUS:** ✅ Active
**POTENTIAL DUPLICATE:** Overlaps significantly with /markets/edge and /edge/splits
**NOTES:** 839 lines, complex multi-tab page

---

## TRENDS SECTION

### ROUTE: /trends

**PURPOSE:** Historical trends with today's games and sports filters
**COMPONENTS:** HistoricalTrend data, date picker, sport filters
**STATUS:** ✅ Active
**NOTES:** 940 lines, shows trends filtered by date

### ROUTE: /trends/all

**PURPOSE:** Full database of all historical trends with sortable table
**COMPONENTS:** Sortable table, search, filters by sport/bet type/category
**STATUS:** ✅ Active
**NOTES:** More comprehensive view than /trends

### ROUTE: /trend-finder

**PURPOSE:** AI-powered natural language trend search
**COMPONENTS:** Chat interface, AI query system, save system modal
**STATUS:** ✅ Active
**NOTES:** Different UX approach - chat-based discovery

---

## PATTERNS & SYSTEMS SECTION

### ROUTE: /patterns

**PURPOSE:** Historical betting patterns with current matches
**COMPONENTS:** Pattern matching (situational, trend, revenge, rest, weather, divisional)
**STATUS:** ✅ Active
**POTENTIAL DUPLICATE:** Conceptually similar to /trends but different data structure

### ROUTE: /systems

**PURPOSE:** Betting system builder and backtester
**COMPONENTS:** System criteria builder, backtest results, monthly/seasonal performance
**STATUS:** ✅ Active
**NOTES:** 968 lines, comprehensive system building tool

---

## LINE SHOPPING & ODDS

### ROUTE: /lineshop

**PURPOSE:** Multi-book odds comparison with line movement history
**COMPONENTS:** Line movement modal, book comparison table
**STATUS:** ✅ Active
**NOTES:** Real data from The Odds API, 856 lines

---

## SUS (SUSPICIOUS PLAYS)

### ROUTE: /sus

**PURPOSE:** Suspicious plays tracker with video/social evidence
**COMPONENTS:** SusSearchCompact, Twitter embeds, video support
**STATUS:** ✅ Active
**NOTES:** Unique feature - no duplicates

---

## PERFORMANCE TRACKING

### ROUTE: /performance

**PURPOSE:** 20-year track record visualization (DEMO DATA)
**COMPONENTS:** Yearly performance table, sport breakdown, pick type breakdown
**STATUS:** ⚠️ Demo mode (banner indicates simulated data)
**NOTES:** Static server component

### ROUTE: /performance/clv

**PURPOSE:** Closing Line Value (CLV) dashboard
**COMPONENTS:** CLV summary, distribution charts, recent picks with CLV
**STATUS:** ✅ Active
**NOTES:** Client-side, fetches from /api/clv

---

## LIVE & SCORES

### ROUTE: /live

**PURPOSE:** Live games dashboard with edge alerts
**COMPONENTS:** LiveScoresTicker, live games list, upcoming games, edge alerts
**STATUS:** ✅ Active

### ROUTE: /scores

**PURPOSE:** Comprehensive scores page with filters
**COMPONENTS:** Date picker, sport filter, status filter, game cards
**STATUS:** ✅ Active
**POTENTIAL DUPLICATE:** Overlaps with /live but more focused on scores

---

## ALERTS

### ROUTE: /alerts

**PURPOSE:** Betting alerts hub (line moves, sharp action, injuries, weather)
**COMPONENTS:** Alert list with type filtering, severity indicators
**STATUS:** ✅ Active
**POTENTIAL DUPLICATE:** Similar functionality exists in /markets/edge/alerts and /live

---

## WEATHER

### ROUTE: /weather

**PURPOSE:** Weather impact on outdoor games (NFL, MLB)
**COMPONENTS:** WeatherWidget, game weather cards, betting impact indicators
**STATUS:** ✅ Active
**NOTES:** Unique feature, relevant for outdoor sports

---

## NEWS

### ROUTE: /news

**PURPOSE:** Latest sports news aggregator
**COMPONENTS:** NewsPageClient (client), getAllSportsNews (server)
**STATUS:** ✅ Active
**NOTES:** SSR with dynamic rendering, force-dynamic

---

## MARKETPLACE & MARKETS (DIFFERENT PURPOSES)

### ROUTE: /marketplace

**PURPOSE:** User-created betting systems marketplace (buy/sell systems)
**COMPONENTS:** MarketplaceListing cards, filtering, copy/like actions
**STATUS:** ✅ Active
**NOTES:** Social feature for sharing betting systems

### ROUTE: /marketplace/bankroll-systems

**PURPOSE:** Educational bankroll management systems reference
**COMPONENTS:** BANKROLL_MANAGEMENT_SYSTEMS data, sortable table
**STATUS:** ✅ Active
**NOTES:** Educational/reference content

### ROUTE: /markets

**PURPOSE:** Prediction markets hub (Polymarket, Kalshi)
**COMPONENTS:** PredictionMarket data from real APIs, category filtering
**STATUS:** ✅ Active
**NOTES:** 729 lines, comprehensive prediction market browser
**CONFUSING NAMING:** Different from /marketplace (betting systems)

### ROUTE: /markets/analytics

**PURPOSE:** Prediction market analytics (volume, liquidity stats)
**COMPONENTS:** MarketStats, CategoryStats, PlatformStats
**STATUS:** ⚠️ Uses mock data
**NOTES:** Dashboard for prediction market performance

### ROUTE: /markets/trending

**PURPOSE:** Hot/trending prediction markets
**COMPONENTS:** TrendingMarket cards with volume surge indicators
**STATUS:** ⚠️ Uses mock data

### ROUTE: /markets/insights

**PURPOSE:** Research-backed prediction market edges
**COMPONENTS:** Academic research insights, actionable strategies
**STATUS:** ✅ Active
**NOTES:** Educational content with citations

### ROUTE: /markets/politics

**PURPOSE:** Politics-focused prediction markets
**COMPONENTS:** Market cards for political events
**STATUS:** ⚠️ Uses mock data

### ROUTE: /markets/crypto

**PURPOSE:** Crypto-focused prediction markets
**COMPONENTS:** Market cards for crypto events
**STATUS:** ⚠️ Uses mock data

### ROUTE: /markets/entertainment

**PURPOSE:** Entertainment prediction markets (movies, TV, music, awards)
**COMPONENTS:** Category-filtered market cards
**STATUS:** ⚠️ Uses mock data

### ROUTE: /markets/economics

**PURPOSE:** Economics prediction markets (Fed, inflation, markets)
**COMPONENTS:** Category-filtered market cards
**STATUS:** ⚠️ Uses mock data

### ROUTE: /markets/tech

**PURPOSE:** Tech/AI prediction markets
**COMPONENTS:** Category-filtered market cards
**STATUS:** ⚠️ Uses mock data

### ROUTE: /markets/news

**PURPOSE:** News/world events prediction markets
**COMPONENTS:** Breaking news, geopolitics, disasters markets
**STATUS:** ⚠️ Uses mock data

---

## PICKS TRACKING

### ROUTE: /picks

**PURPOSE:** Browse all picks from cappers (community feed)
**COMPONENTS:** Pick cards with capper info, create pick modal
**STATUS:** ✅ Active
**NOTES:** Public feed of picks from all cappers

### ROUTE: /my-picks

**PURPOSE:** Personal pick tracking and performance
**COMPONENTS:** UserPick management, stats dashboard, add pick modal
**STATUS:** ✅ Active
**POTENTIAL DUPLICATE:** Conceptually similar to /picks but personal
**NOTES:** 796 lines - could potentially be combined with /picks using tabs

---

## DASHBOARD / CONTROL PANEL

### ROUTE: /dashboard

**PURPOSE:** User dashboard with followed games, teams, players, systems
**COMPONENTS:** GamesWidget, TeamsWidget, PlayersWidget, TrendsWidget, AlertsWidget
**STATUS:** ✅ Active
**NOTES:** 1008 lines, comprehensive user home

### ROUTE: /control-panel

**PURPOSE:** Live monitoring with tracked bets and favorites
**COMPONENTS:** Live games, tracked bets, favorite teams/players, trends, alerts
**STATUS:** ✅ Active
**POTENTIAL DUPLICATE:** Very similar to /dashboard - different UI approach
**NOTES:** 862 lines - significant overlap with /dashboard

---

## LEADERBOARD

### ROUTE: /leaderboard

**PURPOSE:** Capper rankings and performance tracking
**COMPONENTS:** Sports betting leaderboard + prediction market cappers
**STATUS:** ✅ Active
**NOTES:** 1566 lines - massive page with hot/cold streaks, hall of shame

---

## PROPS

### ROUTE: /props

**PURPOSE:** Player props browser with edge indicators
**COMPONENTS:** Game-by-game props, book comparison, season/L5 averages
**STATUS:** ✅ Active

### ROUTE: /props/correlations

**PURPOSE:** Prop correlation analysis for parlays
**COMPONENTS:** Positive/negative correlations, parlay builder suggestions
**STATUS:** ✅ Active

---

## RECOMMENDATIONS

### HIGH PRIORITY - Consolidate Duplicates

1. **Merge /dashboard and /control-panel**
   - Both serve same purpose: user's personal betting hub
   - Pick best features from each, consolidate into /dashboard
   - Redirect /control-panel to /dashboard

2. **Clean up /edge redirect**
   - Either remove /edge entirely OR make it a proper page
   - Currently just redirects to /markets/edge

3. **Unify alerts functionality**
   - /alerts, /markets/edge/alerts, and alerts in /live overlap
   - Consider single /alerts page with sections for sports + markets

### MEDIUM PRIORITY - Clarify Naming

1. **Rename /markets or /marketplace**
   - Confusing: /markets = prediction markets, /marketplace = betting systems
   - Suggestion: Rename /marketplace to /systems-market or /community-systems

2. **Consider /trends and /trend-finder relationship**
   - Keep both but improve cross-linking
   - /trends = browse pre-built trends
   - /trend-finder = AI discovery

### LOW PRIORITY - Mock Data

1. **Replace mock data in /markets/* subpages**
   - /markets/analytics, /markets/trending use mock data
   - Category pages (politics, crypto, etc.) use mock data
   - Either fetch real data or remove pages

---

## PAGE COUNT BY STATUS

| Status | Count |
|--------|-------|
| ✅ Active (Real Data) | 28 |
| ⚠️ Mock Data / Demo | 8 |
| ⚠️ Redirect Only | 1 |
| **Total Tools/Features** | **37** |

---

## FILE SIZE COMPARISON (Lines of Code)

| Route | Lines | Complexity |
|-------|-------|------------|
| /leaderboard | 1566 | Very High |
| /dashboard | 1008 | Very High |
| /systems | 968 | High |
| /trends | 940 | High |
| /control-panel | 862 | High |
| /lineshop | 856 | High |
| /analytics | 839 | High |
| /sus | 811 | High |
| /my-picks | 796 | High |
| /markets | 729 | High |
| /scores | 703 | High |
| /trend-finder | 689 | High |
| /calculators | 580 | Medium |
| /picks | 554 | Medium |
| /trends/all | 551 | Medium |
| /marketplace | 563 | Medium |
