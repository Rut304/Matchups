# THE MATCHUPS MASTER PLAN

## From C+ to The Ultimate Edge: A Financial Terminal for Gamblers

**Date:** February 8, 2026  
**Synthesized From:** Sharp Transformation Plan, The Whale Review, Gambler Audit, Full Codebase Audit  
**Author:** Agent  
**Target:** Transform Matchups into the #1 game matchup research tool for serious sports bettors

---

## The Situation (Honest Assessment)

### What We Have (The Ferrari)

- Next.js 16 + Supabase + Vercel (production-grade stack)
- 91 API routes built
- ESPN API, Action Network, DraftKings props all **working and returning real data**
- Gemini AI integration wired and functional
- Edge engine calculating scores from 7 weighted components
- Clean dark UI with solid mobile responsiveness
- Supabase schema built for cappers, picks, leaderboard, odds history, line snapshots

### What's Missing (The Empty Tank)

- **Edge engine capped at 65/100** — Situational angles (15pts), Weather (10pts), H2H (10pts) all permanently return **zero**
- **`analytics-data.ts` is 1,068 lines of hardcoded mock data** — Team ATS records, trends, scoring stats are all fabricated
- **Historical betting database is empty** — No ATS records, no H2H, no trend calculations possible
- **Weather API not wired** — Returns "data unavailable" stub
- **Situational angles not wired** — Returns empty arrays
- **Betting Trends are reformatted odds** — Not calculated from real history
- **AI Analysis requires 2+ real data points** — Often fails quality check and shows placeholder
- **HTML scrapers (Covers, SportsBettingDime) are broken** — Rely on fragile CSS selectors

### The Core Problem

> The Whale said it best: "You're building a Ferrari but putting 87-octane gas in it."

We have 91 API routes, a sophisticated edge engine, and a beautiful UI — **feeding off empty databases and mock data.** Every "N/A", every placeholder, every fabricated trend is a user walking out the door.

---

## The Vision (Where We're Going)

**Not a sports site. A financial terminal for sports betting.**

When a gambler lands on a Matchups game page, within 5 seconds they should see:

1. **Who the sharp money is on** (Ticket % vs Money % divergence)
2. **Where the best price is** (multi-book comparison, best line highlighted)
3. **What the edge is** (Edge Score 0-100, powered by real data)
4. **Why** (AI analysis citing specific data points, not generic platitudes)

Within 30 seconds they should have:

- Full ATS records (overall, home/away, fav/dog, last 10)
- Line movement with key number analysis
- Injury impact quantified (not just a list)
- Historical H2H betting results
- Situational angles with backtested win rates
- Props with correlation data

**The goal: Replace Action Network ($30/mo) + OddsJam ($40-200/mo) + Covers + spreadsheets with ONE free tool.**

---

## The Master Plan: 4 Phases

### Estimated Total Timeline: **10-14 working sessions**

Each "session" = one focused conversation with sustained coding (3-6 hours of agent work). Some sessions can be consecutive if momentum is good.

---

## PHASE 1: THE PURGE & FOUNDATION

**Sessions: 1-3 | Priority: CRITICAL | Goal: Honest Data Only**

The Sharp Transformation Plan called this "Demolition & Repair." The Whale said "Kill the mock data immediately. A blank page is better than a lying page." Both are right.

### Session 1: Mock Data Purge + Null Safety

**1.1 Delete analytics-data.ts mock data**

- The 1,068-line file of hardcoded team stats is poisoning every component that imports it
- Replace with real-time API calls to ESPN team stats endpoint (already exists at `/api/team-stats`)
- Any component using `getTeamByAbbr()` switches to async fetch or shows "Loading"
- **Rule: If it can't fetch real data, show a clean empty state — never fake data**

**1.2 Null-safe the matchup page**

- Audit every field in `game/[id]/page.tsx` (2,237 lines)
- Every `game.X` access needs null checks
- Replace `NaN`, `0`, and empty strings with proper skeleton loaders
- Sections with no data show a clean "Data unavailable" card, not broken layouts

**1.3 Hide unpopulated sections**

- If H2H returns 0 games → hide the section entirely (don't show empty table)
- If Betting Trends only has reformatted odds → hide instead of showing useless data
- If AI Analysis can't generate → show "Analysis generating..." with a retry, not "requires integration"
- **Principle: Only show what adds value. Empty sections destroy trust.**

**1.4 Consolidate redundant API routes**

- `/api/odds`, `/api/lines`, `/api/edges`, `/api/edge`, `/api/edges/today` — too many overlapping routes
- Merge into unified data layer: `/api/games/[id]/intelligence` becomes the single source of truth
- Remove dead routes that return 404 or mock data

**Deliverable:** A site that shows ONLY real data. Some pages will look sparse. That's okay. Honesty > illusion.

---

### Session 2: Historical Data Engine

**This is THE critical blocker.** Without historical data, we can't compute:

- ATS records
- O/U trends
- H2H history
- Trend calculations
- Situational angle backtesting
- CLV tracking accuracy

**2.1 Build the historical data importer**

- **Source 1:** ESPN API already returns team schedules with scores. For each completed game, store in `historical_games` table
- **Source 2:** The Odds API has historical odds endpoints. Fetch closing lines for completed games
- **Source 3:** Pro-Football-Reference (structured data, scrapeable for non-commercial use)
- Target: **2023, 2024, 2025 seasons** for NFL, NBA, NHL, MLB (minimum NFL for Super Bowl)
- Schema already exists in Supabase. Just needs population.

**2.2 Backfill current season (2025-2026)**

- Run ESPN schedule API for each team → store all completed games
- Cross-reference with The Odds API for closing spreads/totals
- Calculate ATS result, O/U result for each game
- Goal: Every NFL team has 17+ regular season games + playoffs with betting results

**2.3 Build ATS/O-U calculation service**

- `calculateTeamATS()` already exists in `ats-calculator.ts`
- Wire it to actually query `historical_games` table
- Return: Overall, Home/Away, Favorite/Dog, Last 10, vs Division, in Primetime
- Cache results with 1-hour TTL (ATS doesn't change during the day)

**Deliverable:** Real ATS records for every NFL team. "SEA 10-7 ATS" instead of "N/A". Immediate upgrade to Betting Trends section.

---

### Session 3: Trend Engine Rebuild

**3.1 Replace fake trends with database-driven trends**

- Current: `homeTrends.push(\`${homeAbbr} favored by ${line} points\`)` — useless
- New: Query `historical_games` for patterns:
  - "SEA 7-3 ATS as road favorite this season"
  - "NE 5-1-1 ATS as home underdog"  
  - "UNDER 8-4 in SEA games this season"
  - "SEA 4-1 ATS after a loss"
- Each trend shows record + ROI percentage

**3.2 H2H History from database**

- Query `historical_games` for matchups between the two teams
- Return last 10 meetings with: date, score, spread, ATS result, total, O/U result
- Calculate: "SEA leads H2H 6-4 ATS last 10 meetings"

**3.3 Smart Trend Generation**

- Don't just dump records. Prioritize **actionable** trends:
  - ATS trends that show > 60% hit rate (statistically meaningful)
  - O/U trends that deviate from 50% by 15%+
  - Situational trends (after loss, on short rest, divisional, etc.)
- Sort by relevance to THIS specific game

**Deliverable:** Betting Trends section shows 5-8 real, data-backed, actionable trends per team. H2H section shows actual matchup history.

---

## PHASE 2: THE EDGE ENGINE

**Sessions: 4-6 | Priority: HIGH | Goal: Full 100-point Edge Score**

### Session 4: Wire the Missing 35 Points

The edge engine (`src/lib/edge/engine.ts`) scores 0-100 from 7 components. Three are permanently zero:

**4.1 Situational Angles (15 points)**

- Parse ESPN schedule to calculate:
  - Rest days (days since last game)
  - Back-to-back detection (NBA/NHL)
  - Travel distance (lookup table for city distances)
  - After win/loss record
  - Divisional game flag
  - Primetime flag
  - Revenge game detection (did they lose to this team recently?)
- Cross-reference with historical ATS in each situation
- Score based on how many angles align and their historical profit

**4.2 Weather Impact (10 points)**

- Wire OpenWeather API (free tier = 1,000 calls/day, plenty)
- Detect outdoor venues (lookup table: ~12 NFL stadiums are outdoor)
- Score wind impact on passing (>15mph = high impact for totals)
- Score temperature (extreme cold/heat affects totals)
- Score precipitation (rain/snow affects passing and totals)
- Output: "15mph crosswind — historical UNDER hits 62% in similar conditions"

**4.3 H2H Edge (10 points)**

- With historical data now populated (Phase 1), query H2H matchups
- Score based on: ATS trend strength, recent dominance, scoring pattern
- Example: "SEA 7-3 ATS in last 10 vs NE" → 7/10 points

**Deliverable:** Edge Score now uses all 7 components. A game with strong signals can actually hit 80-90+, not capped at 65.

---

### Session 5: AI Analysis That Always Delivers

**5.1 Fix the 2-data-point gate**

- Currently, AI won't generate if fewer than 2 of (splits, ATS, O/U, injuries) are available
- For high-profile games like the Super Bowl, we ALWAYS have injuries + splits data
- Lower threshold to 1 data point, or use a tiered system:
  - 3+ data points → Full AI analysis with specific picks
  - 1-2 data points → Condensed analysis with caveats noted
  - 0 data points → Template-based analysis using public info

**5.2 Eliminate placeholder text**

- The string "AI analysis requires Gemini API integration" must NEVER appear
- Fallback hierarchy:
  1. Full Gemini AI analysis (best)
  2. Rule-based analysis from edge engine data (good)
  3. Template combining available data points (acceptable)
  4. "Analysis will be available closer to game time" (last resort)

**5.3 Improve AI prompt quality**

- Current prompt sends 12 data points as raw JSON
- Better: Pre-process data into narrative context
- Tell AI: "You are writing for a bettor who wagers $1k+ per game. Be specific. Cite numbers."
- Add instruction: "Never say 'the home team' — always use team names"
- Add instruction: "If data is sparse, acknowledge it. Never make up statistics."

**5.4 Cache AI results**

- AI analysis for a game doesn't change every minute
- Cache for 30 minutes with Supabase or in-memory
- Reduces Gemini API costs and improves load time

**Deliverable:** Every game page shows meaningful AI analysis. No more placeholders. Quality scales with data availability.

---

### Session 6: Key Numbers + Line Movement Visualization

**6.1 Key Numbers Analysis**

- NFL key numbers: 3, 7, 10, 14 (most common margins of victory)
- NBA key numbers: 5, 7, 9
- When spread sits ON a key number → flag it prominently
- "Spread at 3 — games land on 3 exactly 15.5% of the time in NFL"
- Buy/sell point analysis: "Buying from -3 to -2.5 reduces push rate by 15.5%, costs -120 juice"

**6.2 Line Movement Timeline Chart**

- Store line snapshots every 30 minutes via cron (`/api/cron/refresh-odds`)
- Display as sparkline in game header (Whale's request)
- Mark key events on timeline: injury reported, sharp move, key number crossed
- **This is a KILLER feature.** Action Network charges $30/mo for this.

**6.3 Steam Move Detection**

- If spread moves 1+ point in < 30 minutes → "STEAM ALERT"
- Surface prominently at top of Edge section
- Store detection in Supabase for historical accuracy tracking

**Deliverable:** Visual line movement chart on every game. Key number alerts. Steam move notifications.

---

## PHASE 3: THE WHALE'S UI

**Sessions: 7-9 | Priority: HIGH | Goal: Financial Terminal Layout**

### Session 7: Matchup Page Reorganization

The Whale's layout was specific and deliberate. Implement it:

**Zone 1: The Market State (Hero Header)**

- Teams + Time + Venue + Weather badge
- **The Line:** Best available odds (highlighted green) vs market average
- **The Move:** Sparkline of spread movement. Flag if it crossed a key number (3 or 7)
- **The Split:** Ticket % vs Money % side-by-side with visual divergence indicator
- **Edge Score badge** in top-right corner

**Zone 2: The Edge (AI + Signals)**

- AI PICK with confidence bar (always shows something)
- SHARPEST PLAY with reasoning
- Active signals: Steam alerts, RLM, key number flags
- Key data points as scannable cards (not paragraphs)

**Zone 3: The Context (Data Deep Dive)**

- **ATS Deep Dive:** Collapsible table with Overall/Home/Away/Fav/Dog/L10 for both teams
- **O/U Deep Dive:** Same structure for totals
- **H2H History:** Table with last 5-10 meetings + betting results
- **Recent Form:** Last 10 games WITH full betting data (spread, ATS, total, O/U)
- **Situational Angles:** Flag active angles with historical win rate

**Zone 4: Execution**  

- **Line Shop Matrix:** All books in a clean grid. Best price highlighted.
- **Props comparison** (when available)
- **Injury impact** (sorted by WAR/position importance)

**Show value FIRST, details SECOND.** A bettor should get the answer in 5 seconds and the reasoning in 30.

---

### Session 8: Component Polish + Data Source Attribution

**8.1 Data provenance on every stat**

- The Whale's demand: "Where is this data from?"
- Every section gets a subtle attribution line:
  - "Public splits from Action Network"
  - "Odds from ESPN/DraftKings"
  - "ATS calculated from 2023-2025 games (n=51)"
- This builds trust. Sharp bettors need to know the source.

**8.2 Responsive financial terminal design**

- Monospace fonts for odds/numbers (already partially done)
- Color coding: Green = favorable, Red = unfavorable, Orange = neutral
- Dense information layout (less whitespace, more data per viewport)
- Collapsible sections so users control depth

**8.3 Loading states that feel professional**

- Replace spinning icons with skeleton loaders
- Progressive data loading: show what we have immediately, fill in async data
- No section should show empty for more than 2 seconds on broadband

**Deliverable:** A matchup page that LOOKS like a Bloomberg terminal for sports betting. Dense, clean, trustworthy.

---

### Session 9: Live Game Integration

**9.1 Live score updates**

- WebSocket or polling (every 30s) for in-progress games
- Show: current score, period, time remaining, current live odds
- Live line movement during the game

**9.2 Live Edge Signals**

- When live line deviates from model projection → "LIVE VALUE DETECTED"
- Pace analysis: "Current pace projects to 52 total points, line is 45.5 → value on OVER"
- Momentum tracking: scoring runs, possession metrics

**9.3 Box Score + Results for completed games**

- Full box score with individual stats
- Grade the AI pick: "AI picked SEA -4.5 → RESULT: WIN ✅"
- Track AI accuracy over time for credibility

**Deliverable:** The matchup page works pre-game, live, AND post-game. Full lifecycle.

---

## PHASE 4: THE MOAT (Competitive Advantages)

**Sessions: 10-14 | Priority: MEDIUM | Goal: Features Nobody Else Has**

### Session 10: CLV Tracking + Pick Grading

**10.1 CLV Leaderboard**

- For every pick (user or AI), record the line at time of pick AND the closing line
- Calculate CLV: Did the pick beat the close?
- Display CLV grade on every historical pick
- **This is the single best measure of betting skill** (per academic research)

**10.2 AI Pick Track Record**

- Grade every AI pick after game completion
- Show running record: "AI Picks: 127-103-8 (55.2%) | +14.3 units | CLV: +1.2%"
- This builds massive trust. No other site shows their AI's actual track record.

**10.3 User Pick Tracking with Auto-Grading**

- User logs a pick → system captures current line
- After game → auto-grade (win/loss/push, CLV)
- Monthly/seasonal P&L dashboard

---

### Session 11: Prop Lab + Correlations

**11.1 Player Prop Explorer**

- DraftKings props already working
- Add: historical hit rates ("Mahomes has thrown 280+ in 8 of last 10")
- Add: correlation data ("When KC totals 28+, Mahomes O280.5 hits 85%")
- Add: matchup-specific prop context ("NE allows 275 passing yards/game to QBs")

**11.2 Correlated Parlay Suggestions**

- Surface natural correlations:
  - QB passing yards + team total
  - RB rushing yards + team winning
  - Over/Under + specific player props
- Show: "If you like OVER 45.5, these props correlate: Mahomes O280.5 (r=0.78)"

---

### Session 12: Arbitrage + Positive EV Scanner

**12.1 Cross-book arbitrage detection**

- Compare multi-book odds for mathematical arbitrage
- Alert when guaranteed profit exists
- Show: stake amounts for each side to guarantee $X profit

**12.2 Positive EV identification**

- Calculate no-vig fair odds from sharp books (Pinnacle)
- Compare against soft books (DraftKings, FanDuel)
- Flag bets where soft book price > fair price = +EV
- **This is OddsJam's entire $200/mo product. We do it free.**

---

### Session 13: System Builder + Backtester

**13.1 Custom system creation**

- User selects filters: Sport, Home/Away, Favorite/Dog, Spread range, Rest days, Division game, etc.
- System queries `historical_games` to backtest
- Returns: Record, ROI, profit curve chart
- Example: "NFL road dogs +3 to +7 after a loss: 58-41 ATS (58.6%), +12.4 ROI"

**13.2 System tracking going forward**

- Once created, system auto-flags matching games each week
- Track live performance: "Your 'Tired Dogs' system is 4-1 this month"

---

### Session 14: Alerts + Notifications + Social

**14.1 Smart alert ecosystem**

- Combine multiple signals: "TRIPLE SIGNAL: Sharp money + RLM + key injury on NE"
- Push notifications (browser), email alerts
- Configurable thresholds per user

**14.2 Social sharing**

- One-click share pick card to Twitter/X
- Beautiful OG images auto-generated for each game
- "My Matchups pick: SEA -4.5 | Edge Score: 78 | Confidence: High"

**14.3 Expert accountability ("Check The Experts")**

- Public tracking of every expert's picks with verifiable timestamps
- CLV tracking per expert
- Expose touts who self-report inflated records

---

## TIMELINE SUMMARY

| Phase | Sessions | Calendar Time | What You Get |
|-------|----------|---------------|--------------|
| **Phase 1: Purge & Foundation** | 1-3 | **2-3 days** | Clean data, real ATS records, actual trends, H2H history |
| **Phase 2: Edge Engine** | 4-6 | **2-3 days** | Full 100-point Edge Score, AI that works, line movement charts |
| **Phase 3: Whale's UI** | 7-9 | **2-3 days** | Financial terminal layout, data provenance, live game support |
| **Phase 4: The Moat** | 10-14 | **3-5 days** | CLV tracking, prop lab, arb scanner, system builder, alerts |

### Total: **10-14 sessions over approximately 9-14 calendar days**

This assumes focused, consecutive sessions. With breaks, expect 2-3 weeks real-world time.

### Grade Progression

| After Phase | Grade | Status |
|-------------|-------|--------|
| Current | **C+** | Empty data, placeholder text, reformatted odds as "trends" |
| Phase 1 | **B** | Honest data, real ATS, actual trends, no mock/fake anything |
| Phase 2 | **B+/A-** | Full edge scoring, working AI, line movement visualization |
| Phase 3 | **A-** | Professional layout, dense information, financial terminal feel |
| Phase 4 | **A/A+** | Features nobody else has. Replaces $200/mo of tool subscriptions |

---

## What You DON'T Need (Save Time By Not Building)

1. **Generic win probability pie charts** — Unless backed by a 55%+ model, it's noise
2. **Team power rankings** — Every site has these, they add no edge
3. **News feed** — ESPN does this better, don't compete on content
4. **Podcast/video integration** — Not your competitive advantage
5. **Fantasy sports tools** — Different audience, different product
6. **Generic "AI says Chiefs look strong"** — Use AI to FIND data, not predict winners (The Whale's rule)

---

## Technical Prerequisites

Before starting, ensure these are in place:

| Requirement | Status | Action Needed |
|-------------|--------|---------------|
| Supabase `historical_games` table | Schema exists | Populate with data |
| Supabase `line_snapshots` table | Referenced in code | Verify exists, start populating |
| OpenWeather API key | Not configured | Sign up (free tier is enough) |
| Gemini API key | ✅ Configured | Working |
| The Odds API key | ✅ Configured | Has historical endpoints |
| ESPN API | ✅ No auth needed | Free, unlimited |
| Action Network | ✅ Working | Public API |
| Vercel cron jobs | Configured in vercel.json | Verify they're running |

---

## The North Star Metric

Track ONE number to measure success: **Average time on matchup page.**

- Current: Unknown (likely 15-30 seconds — scan, see empty data, leave)
- Phase 1 target: 60+ seconds (real data keeps them reading)
- Phase 2 target: 90+ seconds (AI analysis and edge score engage them)
- Phase 3 target: 2+ minutes (deep dive into trends, line movement, props)
- Phase 4 target: 5+ minutes (building systems, tracking picks, returning daily)

**When a gambler spends 5 minutes on your matchup page, you've won. That means they trust your data enough to bet on it.**

---

## The Bottom Line

The Sharp Transformation Plan's aggressive 7-day timeline was right in spirit — **the core fixes (Phases 1-2) really can be done in 4-6 sessions.** The Whale's vision of a financial terminal is the correct end state. The Gambler Audit identified exactly where the gaps are.

This plan synthesizes all three. Here's the honest truth:

- **Phase 1 alone makes this a B-grade product** and fixes the Super Bowl embarrassment
- **Phases 1+2 make this genuinely competitive** with Action Network's free tier
- **Phases 1+2+3 make this the best free tool on the market**
- **All four phases make this a product people would pay for**

The infrastructure is already built. The data layer is the gap. Let's fill the tank and drive this Ferrari.

---

*Ready when you are. Say the word and we start Phase 1, Session 1.*
