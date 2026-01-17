# Matchups - Agent Handoff (Updated)

**Updated:** 2026-01-17
**Author:** Internal Ops / CTO Sprint

## Executive summary

Matchups is a sports-betting analysis app (Next.js + TypeScript + Supabase) focused on surfacing "The Edge" — betting edges, trends, and sharp-money signals. The current sprint prioritized: make Action Network the primary source for betting splits, implement per-game trend matching, ensure team analytics (ATS/OU) are accurate and timely, and add data provenance.

This document explains the architecture, current state, recent fixes, how to verify data relevance/topicality, and contains a copy-paste "perfect prompt" for the next agent.

---

## Recent Changes (This Sprint - 2026-01-17)

### Critical Fixes Applied

1. **ESPN API Endpoint Fix** (`src/lib/api/espn.ts`)
   - Fixed `getStandings()` to use ESPN's v2 API endpoint (`/apis/v2/sports/...`)
   - The site API (`/apis/site/v2/sports/.../standings`) now returns only a redirect link, breaking team data
   - This was causing `/api/teams?sport=NFL` to return empty `{ teams: [], total: 0 }`

2. **Season Override & Provenance** (`src/lib/services/real-analytics.ts`, `src/app/api/teams/route.ts`)
   - Added `GetRealTeamsOptions` interface with `season` and `seasonType` parameters
   - `getRealTeams()` now accepts either a sport string or options object
   - Added `ProvenanceMetadata` type with `source`, `fetchedAt`, `season`, `seasonType`
   - ATS and O/U data now includes provenance: `{ ats: { ..., provenance: { source: 'supabase', fetchedAt, season } } }`

3. **API Response Provenance** (`src/app/api/teams/route.ts`, `src/app/api/game-trends/route.ts`)
   - `/api/teams` now accepts `?season=YYYY&seasonType=regular|postseason` query params
   - Both APIs return `meta: { source, fetchedAt, season, seasonType }` for data traceability
   - Example: `GET /api/teams?sport=NFL&season=2025` filters historical_games to 2025 season only

4. **Playwright Smoke Tests** (`e2e/sports-pages-smoke.spec.ts`)
   - Tests all sport pages (NFL, NBA, NHL, MLB) load and display games
   - Tests that game links navigate to matchup page (`/game/[id]`)
   - Tests Teams API returns data with provenance metadata
   - Tests navigation flow: Homepage → Sport page → Game matchup page

---

## High-level architecture

- Frontend: Next.js App Router (React + Tailwind)
- Backend/data: Supabase (Postgres) for historical data and analytics; ESPN for schedules/standings; Action Network for betting splits; The Odds API for market odds (supplemental)
- CI/CD: Vercel
- AI: Gemini (experimental)

Key directories:

- `src/app/` — Next.js pages (sport-specific subfolders: `nfl`, `nba`, etc.)
- `src/lib/` — core logic, API clients, trend-matcher, edge-features
- `src/components/` — UI components and reusable widgets
- `supabase/` — SQL schema and migrations
- `docs/` — architecture and handoff docs

---

## Recent work (what I changed / why)

- Rewrote edges endpoints to use Action Network as PRIMARY for betting splits and sharp-money detection. Files: `src/app/api/edges/route.ts`, `src/app/api/edges/today/route.ts`.
- Broadened `EdgeData` interface in `src/lib/edge-features.ts` to accommodate additional fields from Action Network (moneyPct, betType, source, line, etc.).
- Created `/api/game-trends` endpoint (`src/app/api/game-trends/route.ts`) which matches historical trends (Supabase) to live games using Action Network betting splits when available.
- Fixed type mismatches and compilation errors (TS passes locally for changed files).
- Implemented a fix in `src/lib/services/real-analytics.ts` to compute ATS using team abbreviations and to restrict historical queries to the active season (heuristic by date).

Why these matter: Action Network is authoritative for splits and sharp signals — making it primary ensures live edge detection is relevant. Matching trends per-game surfaces immediately actionable insights on matchup pages.

---

## Data perspective & guidance for ensuring relevance, topicality, and accuracy

1. Source priority rules (enforced in code):
   - Betting splits / public vs money: Action Network (primary) → Supabase (cached) → Odds API (supplemental)
   - Live schedules / team metadata: ESPN (primary)
   - Historical trends and game results: Supabase (primary canonical source)

2. Freshness
   - Ensure historical queries are limited to the relevant season(s) for team-level aggregates.
   - For team analytics (ATS/OU), only include the current season (or last N seasons explicitly configured) unless the UI intentionally wants all-time analytics.
   - Action Network splits and Odds API should be polled frequently (30–60s TTL) for live games.

3. Identity mapping
   - Use canonical IDs or team abbreviations (not display names) to match across data sources (ESPN team.abbreviation ↔ historical_games.home_team_abbr).
   - Avoid fragile string contains matching (e.g., matching by displayName) for critical joins.

4. Confidence & provenance
   - Every computed stat (e.g., ATS win% or trend applicability) must include the source and timestamp in the API response: { value, source: 'supabase|actionNetwork|espn', ts }
   - When multiple sources disagree, present primary source value and show fallback with label.

5. Edge cases & season boundaries
   - Handle preseason / postseason separately. Use `season_type` to filter regular-season vs postseason statistics.
   - For January–June months, map ESPN season semantics appropriately (e.g., playoffs in Jan belong to previous season.year).

---

## Code review (critical hotspots to review first)

1. `src/lib/services/real-analytics.ts` — Team analytics & matchups. Recent fix: ATS calculation now uses `home_team_abbr` / `away_team_abbr` and filters by inferred season.
2. `src/app/api/edges/route.ts` & `src/app/api/edges/today/route.ts` — Edge detection pipelines, now Action Network first.
3. `src/lib/trend-matcher.ts` — Logic to match historical trend definitions to GameContext. Validate criteria mapping and ensure consistent field names (e.g., betting split properties).
4. `src/app/api/game-trends/route.ts` — New API returning per-game applicable trends; verify it returns both the matched trend metadata and the bettingSplit used.
5. `src/app/nfl/matchups/page.tsx` & `src/app/nfl/matchups/[gameId]/page.tsx` — UI flows for list → matchup. Verify links are present and server-side fetches populate `homeTeamTrends`/`awayTeamTrends` or client fetches `/api/game-trends`.
6. `supabase/*.sql` — Verify table columns: `historical_games` has `home_team_abbr`, `season`, `season_type` (use these for correct joins).

---

## How I will verify NFL pages (procedural checklist)

1. Data sanity checks:
   - For each team on the `/nfl` leaderboard and ATS list, fetch the API data (`/api/teams?sport=NFL`) and inspect `ats.overall` and `ats.home/away` counts. Confirm sample of games backing those counts exist for the current season (query `historical_games` by team_abbr & season).
   - Confirm `totalGames = wins + losses + pushes` > 0 and that win% is plausible.
2. Cross-source validation:
   - Compare `/api/teams` ATS with ESPN-derived last-10 and the raw `historical_games` rows. If mismatch > 5% or obviously stale, flag it.
3. UI navigation:
   - From `/nfl` page click a game → ensure it routes to `/nfl/matchups/[gameId]` and that page loads with trends & betting splits (or shows a clear loader and fails with a helpful message).
4. Automated smoke tests:
   - Add Playwright checks which assert: list items have hrefs, clicking a game loads the matchup page, and that `homeTeamTrends`/`awayTeamTrends` render.
5. Monitoring:
   - Add synthetic checks to every deployment (or an external uptime check) to call `/api/edges/today`, `/api/game-trends?gameId=...`, and `/api/teams?sport=NFL` and fail if data looks empty or aged beyond configurable TTL.

---

## Quick fixes to prevent stale/irrelevant data (practical changes you can make now)

1. ✅ Use season filtering in `real-analytics` (DONE). Accepts `season` query param for override.
2. ✅ Use standard team IDs/abbr for joins instead of display names (DONE - using `home_team_abbr`/`away_team_abbr`).
3. ✅ Add `source` & `fetchedAt` fields to API responses (DONE - both /api/teams and /api/game-trends).
4. Limit historical data window for leaderboards (e.g., last 1–3 seasons) and show a note when leaderboard is "last X seasons" vs "all-time".
5. ✅ Add Playwright smoke tests for navigation and trend presence (DONE - `e2e/sports-pages-smoke.spec.ts`).

---

## Files changed in this sprint (2026-01-17)

**New files:**

- `e2e/sports-pages-smoke.spec.ts` — Playwright smoke tests for all sport pages

**Modified files:**

- `src/lib/api/espn.ts` — fixed ESPN standings to use v2 API endpoint
- `src/lib/services/real-analytics.ts` — added `GetRealTeamsOptions`, `ProvenanceMetadata`, season override
- `src/app/api/teams/route.ts` — added season/seasonType params, meta response object
- `src/app/api/game-trends/route.ts` — added meta response with source info
- `docs/AGENT_HANDOFF_UPDATED.md` — updated documentation

**Previous sprint files (preserved):**

- `src/app/api/edges/route.ts` — prioritize Action Network
- `src/app/api/edges/today/route.ts` — prioritize Action Network
- `src/lib/edge-features.ts` — expanded EdgeData

---

## How to validate by hand (recommended commands)

Run these from a shell (replace domain if needed):

```bash
# 1) Teams and ATS (should now return data with provenance)
curl -s "https://matchups-eta.vercel.app/api/teams?sport=NFL" | jq '{total: .total, meta: .meta, sample: .teams[0] | {abbr, name, ats_overall: .ats.overall, ats_provenance: .ats.provenance}}'

# 2) Teams with season override (filter to specific season)
curl -s "https://matchups-eta.vercel.app/api/teams?sport=NFL&season=2025&seasonType=regular" | jq '.meta'

# 3) Edges today (Action Network primary)
curl -s "https://matchups-eta.vercel.app/api/edges/today?sport=nfl" | jq

# 4) Game trends for a sample game (check meta.source)
curl -s "https://matchups-eta.vercel.app/api/game-trends?gameId=401772982&sport=NFL&home=KC&away=LV" | jq '.meta'

# 5) Verify ESPN v2 API is working
curl -s "https://site.api.espn.com/apis/v2/sports/football/nfl/standings" | jq '.children[0].standings.entries[0].team.abbreviation'

# 6) Run Playwright smoke tests locally
npx playwright test e2e/sports-pages-smoke.spec.ts --headed

# 7) Spot-check historical rows for KC season (if you have SQL access)
# Run in Supabase SQL editor:
SELECT count(*), season FROM historical_games 
WHERE (home_team_abbr = 'KC' OR away_team_abbr = 'KC')
GROUP BY season ORDER BY season DESC LIMIT 5;
```

---

## Handoff: perfect prompt for the next agent

Below is a single, copy-pasteable prompt designed to get the next agent fully up to speed and productive quickly.

--- COPY-PASTE START ---

You are taking over maintenance and feature work for Matchups (<https://matchups-eta.vercel.app>), a Next.js + TypeScript sports betting analytics app backed by Supabase.

Primary objectives (start here):

1. Ensure NFL pages present relevant, topical, and accurate data. Fix any pipeline that uses stale or misjoined historical data and confirm UI navigation from `/nfl` to each matchup page works.
2. Ensure Action Network is the primary source for betting splits and sharp-money signals across `edges` APIs and per-game trend matching.
3. Add provenance and freshness metadata to team/trend/edge APIs and add/schedule smoke tests to catch regressions.

Key constraints and facts:

- Data sources (priority): Action Network (splits) → ESPN (schedules/standings/summary) → Supabase (historical_trends, historical_games) → Odds API (supplemental multi-book odds)
- Do NOT commit secrets to the repo. Use Vercel/Supabase secrets.
- Critical tables: `historical_games` (has columns `home_team_abbr`, `away_team_abbr`, `season`, `season_type`), `historical_trends`.
- Important files: `src/lib/services/real-analytics.ts`, `src/lib/trend-matcher.ts`, `src/app/api/edges/route.ts`, `src/app/api/game-trends/route.ts`, `src/app/nfl/matchups/page.tsx`, `src/app/nfl/matchups/[gameId]/page.tsx`.

First tasks (do not proceed until these are complete):
A. Reproduce "KC appears in ATS top list despite not being a top team this year". Steps:

   1. Call `/api/teams?sport=NFL` locally and in production and capture the ATS records for KC.
   2. Query Supabase `historical_games` for the current season for KC and confirm the rows used to compute ATS exist and belong to the season; if not, find code using wrong season or stray historical rows.
   3. Check any string-based team matching in `real-analytics` or `trend-matcher` and replace with exact `abbreviation` or canonical team ID.

B. Fix getRealTeams to:

- Use `home_team_abbr` / `away_team_abbr` for joins
- Filter `historical_games` to the active season (with an override query param)
- Return `{ ats: { overall: {...}, source: 'supabase', fetchedAt } }` to include provenance

C. Add a Playwright smoke test:

- Navigate to `/nfl`, assert at least one game link exists and is clickable, click it, assert page loads and trends or betting splits display.

Deliverables (what I expect in PR):

- A small, focused code change updating `real-analytics` and any other files that used display name matching.
- Unit or integration tests for the ATS calculation change.
- Playwright smoke test added to `e2e/` and CI pipeline updated.
- Updated `docs/AGENT_HANDOFF.md` summarizing the changes and verification steps.

--- COPY-PASTE END ---

---

## Next steps I will take (if you want me to continue)

- Finish the historical_games inspection and adjust the season window (TODO #2 & #3).
- Add provenance (source & fetchedAt) to the teams/trends APIs.
- Add Playwright smoke tests for navigation and trends.
- Update `docs/ARCHITECTURE.md` with flowcharts (I can generate simple diagrams and embed links to draw.io / mermaid).

---

If you'd like, I can implement the remaining code changes now (season override on API, provenance fields, and a Playwright smoke test) and open a PR. Tell me to proceed and I will continue.
