# Matchups - Data Layer Architecture

## Overview

Matchups uses a hierarchical data fetching system with multiple sources and automatic fallbacks.

---

## Data Source Priority System

```
┌─────────────────────────────────────────────────────────────┐
│                    DATA REQUEST                              │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                 DATA SOURCE ROUTER                           │
│           /src/lib/api/data-sources.ts                       │
│                                                              │
│   Determines which sources to try based on data type:        │
│   - game-schedule → ESPN → Supabase                         │
│   - betting-odds → Odds API → ESPN → Supabase               │
│   - live-scores → ESPN → Supabase                           │
│   - historical → Supabase → ESPN                            │
└─────────────────────────────────────────────────────────────┘
                              │
          ┌───────────────────┼───────────────────┐
          ▼                   ▼                   ▼
   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
   │  ESPN API   │    │ The Odds    │    │  Supabase   │
   │  (Primary)  │    │    API      │    │  (Fallback) │
   └─────────────┘    └─────────────┘    └─────────────┘
```

---

## Adding a New Data Source

### Step 1: Create the API Client

```typescript
// /src/lib/api/new-source.ts

const BASE_URL = 'https://api.newsource.com/v1'

export interface NewSourceGame {
  id: string
  homeTeam: string
  awayTeam: string
  // ... fields
}

export async function fetchGames(sport: string): Promise<NewSourceGame[]> {
  const response = await fetch(`${BASE_URL}/games?sport=${sport}`, {
    headers: {
      'Authorization': `Bearer ${process.env.NEW_SOURCE_API_KEY}`,
      'Accept': 'application/json'
    }
  })
  
  if (!response.ok) {
    throw new Error(`New Source API error: ${response.status}`)
  }
  
  return response.json()
}
```

### Step 2: Add to Data Source Config

```typescript
// /src/lib/api/data-sources.ts

// Add to source definitions
const DATA_SOURCES = {
  'new-source': {
    name: 'New Source',
    baseUrl: 'https://api.newsource.com/v1',
    rateLimit: 100, // requests per minute
    priority: 2
  },
  // ... existing sources
}

// Add to data type routing
const DATA_SOURCE_CONFIG = {
  'game-schedule': ['espn', 'new-source', 'supabase'],  // Add new source
  // ...
}
```

### Step 3: Create Transformation Layer

```typescript
// /src/lib/api/transformers/new-source.ts

import type { NewSourceGame } from '../new-source'
import type { GameDetail } from '../games'

export function transformNewSourceToGameDetail(
  game: NewSourceGame
): GameDetail {
  return {
    id: game.id,
    sport: game.sport,
    home: {
      name: game.homeTeam,
      abbr: game.homeAbbr,
      // Map all fields
    },
    away: {
      // ...
    },
    odds: {
      spread: game.spread,
      total: game.total,
      // ...
    }
  }
}
```

### Step 4: Add API Route (if needed)

```typescript
// /src/app/api/new-source/route.ts

import { NextResponse } from 'next/server'
import { fetchGames } from '@/lib/api/new-source'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const sport = searchParams.get('sport') || 'nfl'
  
  try {
    const games = await fetchGames(sport)
    return NextResponse.json({ success: true, games })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
```

---

## Current Data Sources

### 1. ESPN API (Primary)

**Endpoints:**

```
Scoreboard:  /apis/site/v2/sports/{sport}/{league}/scoreboard
Summary:     /apis/site/v2/sports/{sport}/{league}/summary?event={id}
Schedule:    /apis/site/v2/sports/{sport}/{league}/teams/{id}/schedule
```

**Data Available:**

- Live scores and game status
- Team information and records
- Basic betting lines (spread, total, ML)
- Injuries and team leaders
- Win probability predictor
- Last 5 games per team
- ATS records

**Client File:** `/src/lib/api/espn.ts`

### 2. The Odds API

**Endpoints:**

```
Odds:        /v4/sports/{sport}/odds
Events:      /v4/sports/{sport}/events
Scores:      /v4/sports/{sport}/scores
```

**Data Available:**

- Multi-book odds comparison
- Live odds updates
- Historical odds
- Player props

**Client File:** `/src/lib/api/the-odds-api.ts`

**Rate Limits:** 500 requests/month (free tier)

### 3. Supabase (Database)

**Tables:**

```sql
historical_games    -- Past game results with betting outcomes
betting_splits      -- Public betting percentages
odds_history        -- Line movement tracking
user_picks          -- User betting history
cappers             -- Expert/celebrity tracker data
```

**Client Files:**

- `/src/lib/supabase/client.ts` (browser)
- `/src/lib/supabase/server.ts` (server)

---

## Data Flow Examples

### Example 1: Game Matchup Page Load

```
User visits /game/401772980
        │
        ▼
┌─────────────────────────────────┐
│  useEffect in page.tsx          │
│  1. getGameById(gameId, sport)  │
│  2. fetch /api/games/{id}/summary│
│  3. getTeamSchedule() x2        │
└─────────────────────────────────┘
        │
        ├─── /api/games/401772980 ───► ESPN Scoreboard ───► game state
        │
        ├─── /api/games/401772980/summary ───► ESPN Summary ───► gameSummary state
        │                                       │
        │                                       ├── injuries
        │                                       ├── leaders  
        │                                       ├── predictor
        │                                       ├── lineMovement
        │                                       └── lastFiveGames
        │
        └─── getTeamSchedule(sport, teamId) ───► ESPN Schedule ───► homeSchedule/awaySchedule
                                                      │
                                                      └── Falls back to /api/team-history
                                                          if ESPN returns limited data
```

### Example 2: Adding Historical Betting Data

```
1. Supabase stores historical_games with ATS/OU results
2. /api/team-history queries this data
3. team-schedule.ts calls getHistoricalTeamGames() as fallback
4. Data merges with ESPN schedule data
```

---

## Transformation Patterns

### ESPN → Internal Format

```typescript
// /src/lib/api/espn.ts - transformESPNGame()

// ESPN returns:
{
  competitions: [{
    competitors: [{
      homeAway: 'home',
      team: { abbreviation: 'SF', displayName: '49ers' },
      score: '24'
    }],
    odds: [{ spread: -3.5, overUnder: 45.5 }]
  }]
}

// Transformed to:
{
  id: '401772980',
  home: { abbr: 'SF', name: '49ers', score: 24 },
  away: { abbr: 'PHI', name: 'Eagles', score: 21 },
  odds: { spread: -3.5, total: 45.5 }
}
```

### Schedule Event → TeamGameResult

```typescript
// /src/lib/api/team-schedule.ts - transformESPNEvent()

// ESPN Schedule returns:
{
  id: '401772828',
  competitions: [{
    competitors: [
      { homeAway: 'home', score: '24', winner: true, team: {...} },
      { homeAway: 'away', score: '17', winner: false, team: {...} }
    ],
    status: { type: { completed: true } }
  }]
}

// Transformed to:
{
  id: '401772828',
  week: 1,
  opponent: '@NYJ',
  result: 'W',
  teamScore: 24,
  opponentScore: 17,
  score: '24-17',
  isCompleted: true
}
```

---

## Error Handling Strategy

```typescript
async function fetchWithFallback<T>(
  primary: () => Promise<T>,
  fallback: () => Promise<T>,
  dataType: string
): Promise<T> {
  try {
    const result = await primary()
    if (isValidData(result)) {
      return result
    }
    throw new Error('Invalid data from primary source')
  } catch (primaryError) {
    console.warn(`[${dataType}] Primary source failed, trying fallback`)
    try {
      return await fallback()
    } catch (fallbackError) {
      console.error(`[${dataType}] All sources failed`)
      throw fallbackError
    }
  }
}
```

---

## Caching Strategy

```typescript
// Next.js fetch caching
const response = await fetch(url, {
  next: { 
    revalidate: 60  // Cache for 60 seconds
  }
})

// For live data, use no-store
const response = await fetch(url, {
  cache: 'no-store'
})
```

---

## Rate Limiting Considerations

| Source | Limit | Strategy |
|--------|-------|----------|
| ESPN | No official limit | Cache aggressively |
| The Odds API | 500/month (free) | Use sparingly, cache |
| Supabase | Based on plan | Batch queries |

---

## Adding New Endpoints Checklist

- [ ] Create API client in `/src/lib/api/`
- [ ] Add TypeScript interfaces for response
- [ ] Create transformation function
- [ ] Add to data-sources.ts routing (if using hierarchy)
- [ ] Create API route in `/src/app/api/` (if needed for client)
- [ ] Add error handling and logging
- [ ] Add caching strategy
- [ ] Update this documentation
