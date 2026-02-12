# Homepage Redesign & Tool Consolidation Plan

**Date:** February 11, 2026  
**Goal:** Transform the homepage into an impressive first impression for Sports Gambler Intelligence

---

## 1. BRAND RENAME: "MATCHUPS TERMINAL" → "Sports Gambler Intelligence"

### Files to Update

- `src/app/page.tsx` - Homepage title
- `src/app/layout.tsx` - Metadata title
- `src/components/layout/Navbar.tsx` - Logo/title
- Any other "Terminal" references in docs

### New Branding

- **Main Title:** "MATCHUPS" with tagline "Sports Gambler Intelligence"
- **Shorter:** "SGI" or just "MATCHUPS"

---

## 2. DUPLICATE TOOLS TO CONSOLIDATE

### PRIORITY 1: Dashboard + Control Panel → Single Dashboard

| Route | Keep/Remove | Action |
|-------|-------------|--------|
| `/dashboard` | **KEEP** | As the main user dashboard |
| `/control-panel` | **REMOVE** | Merge best features into dashboard |

**Best features to merge:**

- From dashboard: Clean layout, followed teams
- From control-panel: Custom alerts, bet tracker

### PRIORITY 2: Multiple Alerts → Single `/alerts`

| Route | Keep/Remove | Action |
|-------|-------------|--------|
| `/alerts` | **KEEP** | Main alerts hub |
| `/markets/edge/alerts` | **REDIRECT** | Redirect to /alerts |
| `/live` (alerts section) | **REUSE** | Component shared |

### PRIORITY 3: Trends → Consolidate Naming

| Route | Keep/Remove | Action |
|-------|-------------|--------|
| `/trends` | **KEEP** | Historical trends with filters |
| `/trend-finder` | **KEEP** | AI-powered search (different UX) |
| `/patterns` | **RENAME** | To `/trends/patterns` (sub-route) |

### PRIORITY 4: Edge Redirect  

| Route | Keep/Remove | Action |
|-------|-------------|--------|
| `/edge` | **REDIRECT** | Points to `/markets/edge`, keep for SEO |

### PRIORITY 5: Marketplace Naming Confusion

| Route | Current Name | New Name |
|-------|--------------|----------|
| `/marketplace` | marketplace | `/systems` (betting systems marketplace) |
| `/markets` | markets | Keep as-is (prediction markets) |

---

## 3. HOMEPAGE REDESIGN

### Current Issues

1. "MATCHUPS TERMINAL" sounds generic
2. Too much content competing for attention
3. Trend Finder needs to work AND be prominent
4. Edge Dashboard should be the hero, not buried
5. Too many quick links at bottom

### NEW HOMEPAGE STRUCTURE

```
┌─────────────────────────────────────────────────────────────┐
│ MARKET PULSE TICKER (Real steam moves - keep if working)   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  SPORTS GAMBLER INTELLIGENCE                                │
│  ────────────────────────────────────────────────────────   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  🔍 TREND FINDER (AI Search Box - HERO)              │   │
│  │  "Ask any betting question..."                       │   │
│  │  [Example chips: NFL underdogs ATS, NBA B2B, etc.]   │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  TODAY'S TOP EDGES (Main value proposition)                 │
│  ┌─────────────┬─────────────┬─────────────┬────────────┐  │
│  │ Edge Card 1 │ Edge Card 2 │ Edge Card 3 │ Edge Card 4│  │
│  │ Sharp action│ Weather edge│ Trend match │ CLV value  │  │
│  └─────────────┴─────────────┴─────────────┴────────────┘  │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────┐  ┌──────────────────────────────┐ │
│  │ LIVE GAMES          │  │  LEADERBOARD (Quick View)    │ │
│  │ - Game 1 (LIVE)     │  │  1. @SharpBettor  +42.8u     │ │
│  │ - Game 2 (LIVE)     │  │  2. @EdgeKing     +38.2u     │ │
│  │ - Game 3 (Soon)     │  │  3. @TrendMaster  +35.1u     │ │
│  │ [View All Scores →] │  │  [Full Leaderboard →]        │ │
│  └─────────────────────┘  └──────────────────────────────┘ │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┬─────────────┬─────────────┐               │
│  │ HOT TRENDS  │ KEY INJURIES│ QUICK TOOLS │               │
│  │ - Trend 1   │ - Injury 1  │ • Line Shop │               │
│  │ - Trend 2   │ - Injury 2  │ • Calculators│              │
│  │ - Trend 3   │ - Injury 3  │ • Sus Plays │               │
│  └─────────────┴─────────────┴─────────────┘               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### KEY CHANGES

1. **Trend Finder is THE HERO** - Big, prominent, first thing you see
2. **Edges are immediately visible** - No scrolling needed
3. **Live games visible** - Gamblers want to see action
4. **Leaderboard = Social proof** - Show experts winning
5. **Condensed footer tools** - Less overwhelming

---

## 4. IMPLEMENTATION ORDER

### Phase 1: Branding (Quick Wins)

- [ ] Rename "MATCHUPS TERMINAL" to "Sports Gambler Intelligence"
- [ ] Update metadata, navbar, layout

### Phase 2: Tool Consolidation

- [ ] Remove `/control-panel` (redirect to `/dashboard`)
- [ ] Remove `/markets/edge/alerts` (redirect to `/alerts`)
- [ ] Rename `/marketplace` to `/systems`
- [ ] Move `/patterns` to `/trends/patterns`

### Phase 3: Homepage Redesign

- [ ] Reduce visual noise - fewer sections
- [ ] Make Trend Finder the HERO
- [ ] Show edges immediately (above the fold)
- [ ] Add live game widget
- [ ] Condense bottom sections

### Phase 4: Verify Everything Works

- [ ] Test Trend Finder with Gemini API
- [ ] Test Edge Dashboard loads real data
- [ ] Test all redirects work
- [ ] Run full site check

---

## 5. TOOLS TO KEEP (CORE VALUE)

### Tier 1 - Primary (Homepage Features)

1. **Trend Finder** - AI search (hero)
2. **Edge Dashboard** - Sharp money, edges
3. **Live Scores** - Current action
4. **Leaderboard** - Expert tracking

### Tier 2 - Secondary (Navigation)

5. **Line Shop** - Odds comparison
2. **Calculators** - Bet math
3. **Sus Plays** - Unique differentiator
4. **Injuries** - Betting impact
5. **Trends** - Historical patterns
6. **Weather** - Outdoor sports impact

### Tier 3 - Advanced (Sub-menus)

11. **Systems** - Build & backtest
2. **Props** - Correlations
3. **Markets** - Prediction markets
4. **Analytics** - Deep dive
5. **Alerts** - Notifications

---

## NEXT STEPS

Start with Phase 1 (branding rename), then consolidate tools, then redesign homepage.
