# Sharp Transformation Plan (The "Hell Week" Edition)

**Goal:** Transform Matchups into a high-ROI financial terminal.
**Timeline:** **1 Week (Aggressive)**
**Strategy:** Refactor & Purge (Do NOT Rewrite)
**Last Updated:** 2025-02-10 — Phase 2.1 complete: 7,171 games imported, schema fixed

---

## Phase 1: Demolition & Repair (Days 1-2)

*Focus: Kill the noise, fix the broken windows.*

### 1.1 The Great Purge (Day 1)

- [x] **Task:** Delete `mockPicks`, `mockPlayers`, and hardcoded alerts.
- [x] **Rule:** If an API endpoint returns mock data, it returns 404 or empty array.
- [x] **Result:** The site will look empty, but honest.
  - *Status:* **COMPLETED (Claude)**. Purged `analytics-data.ts` from 1,068 → 364 lines. All hardcoded team arrays (`nflTeams`, `nbaTeams`, `nhlTeams`, `mlbTeams`) and `capperSummaries` are now empty. Interfaces and async fetch functions preserved. Homepage fallback ticker replaced with neutral "Monitoring markets" message. AI Analysis placeholder hidden. Redundant "favored by X points" trends removed from games.ts.

### 1.2 Fix the Matchup Page Rendering (Day 1)

- [x] **Task:** Fix `src/app/game/[id]/page.tsx`.
- [x] **Fix:** Add null checks for `odds`, `score`, `results`. Implement Skeleton loaders.
- [x] **Result:** No more `NaN` or `0` odds.
  - *Status:* **COMPLETED (Gemini + Claude)**. `safeParseInt` added in `espn.ts`. Layout refactored to zone-based "Whale" spec. ArrowRight build breaker fixed. Empty H2H, Trends, and AI sections now hidden via conditional rendering.

### 1.3 Consolidate APIs (Day 2)

- [ ] **Task:** Merge `/api/odds`, `/api/lines`, `/api/edges` into a single efficient data layer.
- [ ] **Result:** Faster load times, single source of truth.
  - *Status:* **NOT STARTED**. Multiple API routes still exist independently.

---

## Phase 2: The Data Engine (Days 3-4)

*Focus: Real data or nothing.*

### 2.1 Historical Data Injection (Day 3)

- [x] **Task:** Run a script to populate `historical_games` with last 3 seasons of NFL data.
- [x] **Task:** Actually RUN the backfill to populate the database.
- [x] **Task:** Fix ALL schema mismatches (15 consumer files used wrong column names).
- [x] **Result:** We can calculate real ATS records.
  - *Status:* **COMPLETED (Claude, 7bf896a)**. 7,171 real games imported from ESPN:
    - NFL: 1,546 games (2020-2024 seasons)
    - NBA: 1,461 games (2024 season)
    - NHL: 1,482 games (2024 season)
    - MLB: 2,682 games (2024 season)
  - Fixed critical bug: migration SQL had WRONG column names vs actual production table.
    Every import endpoint AND every consumer file was using non-existent columns.
    Fixed 15+ files: ats-calculator, head-to-head, trend-matcher, ou-analysis,
    unified-data-store, pattern-discovery, matchup analytics, all API routes.

### 2.2 Trend Calculation (Day 4)

- [ ] **Task:** Update `TrendEngine` to query the DB, not the current line.
- [ ] **Result:** "KC is 12-5 ATS" instead of "KC favored by 3".
  - *Status:* **READY TO START**. Database populated with 7,171 games. Consumer files fixed. Real ATS records should now work for any team. Need to verify trend engine is pulling from DB correctly.

### 2.3 Unified AI Projection Algorithm (Added by Claude)

- [x] **Task:** Fix AI pick/projection contradiction — projected score and pick must be logically consistent.
- [x] **Problem:** `generateFallbackAnalysis` calculated projected score FROM the spread (tautological), then the pick just restated the spread. Example: SEA projected to win by 4, but pick was SEA -4.5.
- [x] **Fix:** Rewrote with independent projection algorithm:
  - Home-field advantage baseline (NFL 2.5, NBA 3.0, NHL 0.3, MLB 1.5)
  - Sharp money adjustments (RLM ±1.5, consensus ±1.0)
  - Injury differential (±1.5 if impact > 10)
  - CLV shift (0.5× line movement)
  - Pick DERIVED by comparing projected margin vs actual spread
- [x] **Result:** If AI projects Team A wins by 4 but spread is -4.5, pick correctly takes Team B +4.5.
  - *Status:* **COMPLETED (Claude, fc1e252)**. `generateFallbackAnalysis` in `betting-intelligence.ts` fully rewritten. `games.ts` `aiPick` no longer restates spread. Game page hides AI pick when no real pick exists.

---

## Phase 3: The "Whale" UI (Days 5-7)

*Focus: Information density.*

### 3.1 The Ticker (Day 5)

- [x] **Task:** Rebuild Matchup Page Header.
- [x] **Features:** Big Line Movement display, Money/Ticket split via GameBettingSplits.
  - *Status:* **COMPLETED (Gemini)**. `GameBettingSplits` component using Action Network data. Zone-based layout with Line Pulse in Zone 1.5.

### 3.2 Edge Signals (Day 6)

- [x] **Task:** Surface "Steam Moves" and "Reverse Line Movement".
- [x] **Implementation:** If Public > 70% & Line moves against → RLM Alert.
  - *Status:* **COMPLETED**. `src/lib/edge-features.ts` detects RLM and Steam moves. Alerts integrated into matchup page.

### 3.3 Deployment & Verify (Day 7)

- [x] **Task:** Build check and deploy.
- [ ] **Task:** Full regression test on production.
  - *Status:* **IN PROGRESS (Claude)**. Build verified, deploying to Vercel.

### 3.4 Animate Marquee (Added by Claude)

- [x] **Task:** Add `animate-marquee` keyframes to tailwind config.
  - *Status:* **COMPLETED (Claude)**. Marquee animation added to `tailwind.config.ts`. Used by homepage ticker, LiveGames, and GameView.

---

## Phase 4: The Home Page (The "Terminal" View)

*Focus: Immediate Actionability. Turn the landing page into a trading desk.*

### 4.1 The Market Pulse (Ticker)

- [x] **Concept:** A financial-style scrolling ticker at the top.
- [x] **Data:** Live Steam Moves, Key Injury Alerts (Impact > 4), and "Whale" bets (> $50k estimated).
  - *Status:* **COMPLETED**. Added scrolling ticker to `src/app/page.tsx` powered by real steam alerts.

### 4.2 "Top Edges" vs "Top Games"

- [x] **Change:** Stop sorting by "Game Popularity" (ESPN default). Sort by **Edge Score**.
- [x] **UI:** Dense table view. Columns: Time | Matchup | The Edge (e.g., "RLM") | Sharp Money % | Action.
- [x] **Goal:** User lands and sees *value* immediately, not just a schedule.
  - *Status:* **COMPLETED**. Reordered Home Page to show "Market Edges" first.

### 4.3 The Viral Sidebar

- [x] **Content:** "Sus Plays" of the day and "Expert Fades" (Cappers with <40% win rate).
- [x] **Why:** This is the "entertainment" that keeps users on site while they analyze data.
  - *Status:* **COMPLETED**. Added links to Sus Plays and Expert Tracker in the header/nav area.

---

## Why Not Rewrite?

1. **Infrastructure is Solid:** Next.js 16 + Supabase is the right stack.
2. **Database is Good:** The schema supports what we need; it's just empty.
3. **Time:** A rewrite is a minimum 2-week setup cost before features. We can fix the current site in 2 days.
