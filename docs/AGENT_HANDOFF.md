# Matchups - Agent Handoff Document

**Last Updated:** January 11, 2026  
**Status:** Game Matchup Page Broken - Critical Priority

---

## 🚨 CRITICAL ISSUES (Fix First)

### Game Matchup Page (`/game/[id]`) is Completely Broken

**What's Wrong:**

1. **Scores showing "NaN-NaN"** - Score transformation failing
2. **Odds showing 0s** - Spread: 0, Total: 0, ML: 0 instead of real lines
3. **Results showing "T"** - All games showing as Ties
4. **No injuries displayed** - API returns data but UI doesn't render
5. **No line movement** - Data exists but not displayed
6. **No AI insights** - Gemini integration not connected
7. **Live game tracking broken** - Shows "Waiting for plays..." forever
8. **No head-to-head history** - H2H section empty
9. **Win probability 50-50** - Fallback instead of ESPN predictor data

**Root Cause:** The API endpoints return data but the frontend components don't properly consume/transform it.

---

## 📁 Project Architecture

### Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Database:** Supabase (PostgreSQL)
- **Deployment:** Vercel
- **AI:** Google Gemini API (configured but not integrated)

### Key Directories

```
/src
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   │   ├── games/[id]/    # Game detail & summary endpoints
│   │   ├── team-history/  # Historical games from Supabase
│   │   └── markets/       # Prediction markets
│   ├── game/[id]/         # Game matchup page (BROKEN)
│   ├── nfl/, nba/, etc.   # Sport-specific pages
│   └── leaderboard/       # Expert tracker
├── components/            # React components
│   ├── game/             # Game-related components
│   └── ui/               # Shared UI components
├── lib/                   # Core libraries
│   ├── api/              # API clients & data fetching
│   │   ├── espn.ts       # ESPN API integration
│   │   ├── team-schedule.ts # Team schedule fetching
│   │   ├── the-odds-api.ts  # Odds API client
│   │   └── data-sources.ts  # Data source hierarchy
│   ├── supabase/         # Database clients
│   └── gemini.ts         # AI integration (not connected)
└── types/                # TypeScript types
```

---

## 🔌 Data Layer Architecture

### Data Source Hierarchy (Priority Order)

```typescript
// From /src/lib/api/data-sources.ts
const DATA_SOURCE_CONFIG = {
  'game-schedule': ['espn', 'supabase'],      // ESPN primary, Supabase fallback
  'live-scores': ['espn', 'supabase'],
  'betting-odds': ['odds-api', 'espn', 'supabase'],  // The Odds API → ESPN → Supabase
  'team-info': ['espn', 'supabase'],
  'historical-games': ['supabase', 'espn'],   // Supabase primary for history
}
```

### API Endpoints

| Endpoint | Purpose | Data Source |
|----------|---------|-------------|
| `/api/games/[id]` | Game details (teams, odds, status) | ESPN Scoreboard |
| `/api/games/[id]/summary` | Injuries, leaders, predictor, line movement, last 5 games | ESPN Summary API |
| `/api/team-history` | Historical game results with ATS/OU | Supabase `historical_games` |
| `/api/markets` | Prediction market data | Polymarket/Kalshi |

### ESPN API Endpoints Used

```typescript
// Scoreboard (live games, odds)
https://site.api.espn.com/apis/site/v2/sports/{sport}/{league}/scoreboard

// Game Summary (injuries, leaders, predictor, betting data)
https://site.api.espn.com/apis/site/v2/sports/{sport}/{league}/summary?event={gameId}

// Team Schedule
https://site.api.espn.com/apis/site/v2/sports/{sport}/{league}/teams/{teamId}/schedule?seasontype=2
```

### Supabase Tables

```sql
-- Historical games with betting results
historical_games (
  espn_game_id, sport, season, season_type,
  home_team_abbr, away_team_abbr,
  home_score, away_score,
  point_spread, over_under,
  -- Computed ATS/OU results
)

-- Betting consensus/splits (structure exists, needs data)
betting_splits (
  game_id, spread_home_pct, spread_away_pct,
  ml_home_pct, ml_away_pct,
  total_over_pct, total_under_pct
)
```

---

## 🔧 What Was Recently Fixed (But Still Broken)

### 1. Team Schedule - seasontype Parameter

**File:** `/src/lib/api/team-schedule.ts`

- Added `seasontype=2` (regular) and `seasontype=3` (postseason) to ESPN calls
- Merges both to get full season during playoffs
- **Status:** API works, but UI shows NaN scores

### 2. Line Movement Extraction  

**File:** `/src/app/api/games/[id]/summary/route.ts`

- Fixed to read from `pointSpread.home.open/close` structure
- **Status:** API returns correct data, UI doesn't display it

### 3. Last 5 Games

**File:** `/src/app/api/games/[id]/summary/route.ts`

- Added extraction from ESPN `lastFiveGames` array
- **Status:** API works, UI shows NaN-NaN

---

## 🐛 Debugging the Game Page

### The Main Problem: `/src/app/game/[id]/page.tsx`

This 1400+ line file has multiple issues:

1. **Score Transformation** (~line 350):

```typescript
// The schedule data comes back but scores aren't being parsed correctly
// Look for transformESPNEvent function in team-schedule.ts
```

1. **Odds Display** (~line 500):

```typescript
// gameSummary.odds exists but values show as 0
// Check if odds?.spread, odds?.overUnder are being read
```

1. **Result Determination** (~line 380):

```typescript
// All games showing "T" - the result logic is broken
// Check TeamGameResult interface and result field
```

### Data Flow to Debug

```
ESPN API → /api/games/[id]/summary → gameSummary state → UI components
         → /api/games/[id]         → game state        → UI components

getTeamSchedule() → TeamGameResult[] → homeSchedule/awaySchedule state → Schedule tables
```

### Quick Test Commands

```bash
# Test summary API (should return real data)
curl "https://matchups-eta.vercel.app/api/games/401772980/summary?sport=NFL" | jq '.lineMovement, .predictor, .lastFiveGames'

# Test game API
curl "https://matchups-eta.vercel.app/api/games/401772980?sport=NFL" | jq '.odds'

# Test team schedule
curl "https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams/25/schedule?seasontype=2" | jq '.events[0]'
```

---

## 🎯 What Needs to Be Done

### Priority 1: Fix Game Matchup Page Data Display

1. Debug why scores show "NaN-NaN" - trace from API to UI
2. Fix odds display (currently all 0s)
3. Fix result display (all showing "T")
4. Display line movement that API returns
5. Display predictor win probability
6. Display injuries from summary API

### Priority 2: Add Missing Features

1. **Head-to-Head History** - `getHeadToHead()` exists but doesn't work
2. **Live Play-by-Play** - Needs ESPN play-by-play API integration
3. **Live Alerts** - Scoring alerts, momentum shifts
4. **AI Insights** - Connect Gemini API (`/src/lib/gemini.ts`)

### Priority 3: Line Shop Real Data

- `/src/app/lineshop/page.tsx` uses mock data
- Need to connect The Odds API client (`/src/lib/api/the-odds-api.ts`)

---

## 🔑 Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://cdfdmkntdsfylososgwo.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

# The Odds API
ODDS_API_KEY=...

# Google Gemini
GOOGLE_GEMINI_API_KEY=...

# Stripe (for future premium)
STRIPE_SECRET_KEY=...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=...
```

---

## 📊 ESPN API Data Structure Reference

### Summary API Response (`/summary?event={id}`)

```typescript
{
  pickcenter: [{
    provider: { name: 'DraftKings' },
    spread: -3.5,
    overUnder: 45.5,
    homeTeamOdds: { moneyLine: -180 },
    awayTeamOdds: { moneyLine: 155 },
    pointSpread: {
      home: {
        open: { line: '-2.5' },
        close: { line: '-3.5' }
      }
    },
    total: {
      over: {
        open: { line: '44.5' },
        close: { line: '45.5' }
      }
    }
  }],
  predictor: {
    homeTeam: { gameProjection: 65.2 },
    awayTeam: { gameProjection: 34.8 }
  },
  injuries: [{ team: {...}, injuries: [...] }],
  leaders: [{ team: {...}, leaders: [...] }],
  lastFiveGames: [{ team: {...}, events: [...] }],
  againstTheSpread: [{ team: {...}, records: [...] }]
}
```

### Team Schedule Event

```typescript
{
  id: '401772828',
  date: '2025-09-07T17:00Z',
  name: 'Team A at Team B',
  week: { number: 1 },
  competitions: [{
    competitors: [{
      homeAway: 'home',
      team: { abbreviation: 'SF', displayName: 'San Francisco 49ers' },
      score: '24',
      winner: true
    }, {
      homeAway: 'away',
      team: { abbreviation: 'NYJ' },
      score: '17',
      winner: false
    }],
    status: { type: { completed: true } }
  }]
}
```

---

## 🧪 Testing

```bash
# Run E2E tests
npm run test:e2e

# Run dev server
npm run dev

# Type check
npm run type-check
```

---

## 📝 Key Files to Understand

| File | Purpose | Lines |
|------|---------|-------|
| `/src/app/game/[id]/page.tsx` | Main matchup page (BROKEN) | ~1400 |
| `/src/lib/api/team-schedule.ts` | Team schedule fetching | ~375 |
| `/src/app/api/games/[id]/summary/route.ts` | ESPN summary data | ~400 |
| `/src/lib/api/espn.ts` | ESPN API client | ~640 |
| `/src/lib/api/games.ts` | Game data transformation | ~1100 |
| `/src/lib/gemini.ts` | AI integration (unused) | ~200 |

---

## 🚀 Production URLs

- **Site:** <https://matchups-eta.vercel.app>
- **Supabase:** <https://cdfdmkntdsfylososgwo.supabase.co>
- **GitHub:** <https://github.com/Rut304/Matchups>

---

## ⚠️ Known Issues Log

1. **NaN-NaN Scores** - Score parsing broken in schedule transformation
2. **All Results = T** - Winner/loser logic not working
3. **Odds = 0** - Not reading from correct API response fields
4. **50-50 Predictor** - Using fallback instead of ESPN data
5. **Empty H2H** - `getHeadToHead()` relies on string matching that fails
6. **No Live Data** - Play-by-play API not integrated
7. **Line Shop Mock Data** - Not connected to The Odds API

---

*Document created for agent handoff on January 11, 2026*
