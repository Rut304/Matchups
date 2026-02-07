# Expert Pick Tracking & Social Media System - Implementation Summary

## 1. Expert Pick Source Research Findings

### Key Findings: NO PUBLIC API EXISTS

After comprehensive research, here are the findings on expert pick tracking:

| Source | Tracks Experts | Public Data | Historical Records | API Access |
|--------|---------------|-------------|-------------------|------------|
| Action Network | ✅ Yes | Partial (app only) | ~5 years | ❌ No |
| Covers.com | ✅ Yes | ❌ No | ❌ No | ❌ No |
| BettingPros | ✅ Yes (150+ experts) | ✅ Leaderboards | ~6 years | ❌ No |
| Pregame.com | ✅ Yes (paid pros) | Partial | Yes (units) | ❌ No |
| ESPN/Networks | ❌ No centralized tracking | ❌ No | ❌ No | ❌ No |

### TV Network Reality

**ESPN, NFL Network, CBS, Fox, NBC do NOT systematically track their analysts' picks.**

- Picks are made verbally on air
- No database or accountability system
- Would require manual video/transcript review to compile

### Trackable Analysts

| Analyst | Platform | Trackability |
|---------|----------|-------------|
| Sean Koerner | Action Network | App-verified |
| Chris Raybon | Action Network | 100+ units tracked |
| Fezzik | Pregame.com | Unit tracking public |
| BettingPros consensus | BettingPros.com | Accuracy-ranked |

### Recommended Approach

1. **Track picks yourself going forward** (most feasible)
2. **License data from BettingPros or Action Network** (enterprise pricing)
3. **Focus on written picks** (articles) rather than TV predictions
4. **Build verification systems before publishing any records**

### Legal Warning ⚠️
>
> Publishing unverified accuracy claims could be defamatory. All data MUST be 100% verified before accusing anyone of poor performance.

---

## 2. Sus Plays Dynamic Scoring System

### Schema Updates (`supabase/sus-plays-schema.sql`)

Added priority scoring to replace hardcoded ordering:

```sql
-- New columns
priority_score DECIMAL(10,2)  -- Combined score
engagement_score DECIMAL(10,2)  -- Votes-based
recency_score DECIMAL(10,2)  -- Time-based decay

-- Scoring formula (70% recency, 30% engagement)
-- Recency: Exponential decay with 7-day half-life
-- Engagement: Logarithmic scale on total votes
```

### API Update (`src/app/api/sus/route.ts`)

- Now orders by `priority_score DESC` instead of `created_at DESC`
- Posts automatically rotate based on recency + engagement
- No more hardcoded order

### New X Posts Added

- `@mattbegreatyt` - status/2013450430139846956
- `@thefieldof68` - status/2011851588063637744
- `@dirtyfootbaiier` - status/2011469607316656579
- `@riggedforvegas` - 3 posts (various statuses)

### UPSERT Pattern

All INSERT statements now use `ON CONFLICT DO UPDATE` for safe re-runs.

---

## 3. AI Pattern Discovery System (RCI)

### New Service (`src/lib/services/pattern-discovery.ts`)

Implements Recursive Continuous Improvement (RCI) for discovering NEW betting patterns.

**Key Functions:**

- `discoverNewPatterns()` - Uses Gemini AI to find new patterns from historical data
- `improveExistingPatterns()` - Re-analyzes existing patterns for refinement
- `validatePattern()` - Validates discovered patterns against real data
- `runPatternDiscoveryCycle()` - Cron-compatible full discovery cycle

**Pattern Categories:**

- `statistical` - Data-driven correlations
- `behavioral` - Team/player tendencies
- `situational` - Game context patterns
- `correlation` - Multi-factor relationships
- `anomaly` - Unusual occurrences
- `ai-discovered` - Novel AI-found patterns

### Database Schema (`supabase/pattern-discovery-schema.sql`)

New tables:

- `discovered_patterns` - AI-discovered patterns with RCI tracking
- `discovered_pattern_matches` - Tracks when patterns hit on current games

**Features:**

- RCI tracking (parent/child pattern relationships)
- Confidence scoring (0-100)
- Validation status workflow
- Auto win-rate calculation function

### API Endpoint (`src/app/api/pattern-discovery/route.ts`)

**GET Actions:**

- `?action=list` - Get discovered patterns
- `?action=discover` - Trigger new pattern discovery
- `?action=improve` - Run RCI improvement cycle
- `?action=cycle` - Full discovery cycle (for cron)

**POST Actions:**

- `action: 'save'` - Save a discovered pattern
- `action: 'improve'` - Improve specific patterns

---

## 4. Social Media Content System

### Content Generator (`src/lib/services/social-media-content.ts`)

AI-powered social media post generator for "Check The Experts".

**Post Types:**

- `expert_streak` - Hot/cold streak alerts
- `weekly_recap` - Weekly performance summary
- `upset_alert` - Expert got upset wrong
- `lock_failure` - "Lock" pick lost
- `consensus_fade` - Fading consensus worked
- `head_to_head` - Expert vs Expert
- `prediction_vs_reality` - Quote vs outcome
- `best_worst_week` - Weekly heroes/villains

**Supported Platforms:**

| Platform | Max Chars | Hashtag Limit |
|----------|-----------|---------------|
| Twitter/X | 280 | 3 |
| Instagram | 2,200 | 30 |
| TikTok | 150 | 5 |
| Threads | 500 | 5 |

**Key Functions:**

- `generateSocialPost()` - Single platform post
- `generateCrossplatformPosts()` - All platforms at once
- `generateWeeklyRecap()` - Multi-expert recap
- `generatePredictionVsReality()` - Quote comparison posts
- `getOptimalPostingTimes()` - Best times to post

### API Endpoint (`src/app/api/social-content/route.ts`)

**POST Actions:**

- `action: 'generate'` - Single post
- `action: 'crossplatform'` - Multi-platform posts
- `action: 'weekly-recap'` - Weekly recap
- `action: 'prediction-reality'` - Quote vs reality

**Verification Requirements:**
All expert data MUST include:

```typescript
verification: {
  source: string,      // Where picks were tracked from
  dateRange: string,   // Period covered
  picksVerified: number,
  methodology: string  // How verified
}
```

### Verification Disclaimer

Every post includes:

```
⚠️ VERIFICATION POLICY
All records tracked from public broadcasts, published articles, and social media.
Only picks made BEFORE game time, publicly available, and clearly stated.
```

---

## 5. Files Created/Modified

### New Files

- `/src/lib/services/pattern-discovery.ts` - AI Pattern Discovery
- `/src/lib/services/social-media-content.ts` - Social Media Generator
- `/src/app/api/pattern-discovery/route.ts` - Pattern Discovery API
- `/src/app/api/social-content/route.ts` - Social Content API
- `/supabase/pattern-discovery-schema.sql` - Pattern Discovery schema
- `/src/lib/scrapers/espn-picks-scraper.ts` - ESPN picks scraper
- `/src/lib/scrapers/covers-scraper.ts` - Covers.com consensus scraper
- `/src/app/api/expert-picks/scrape/route.ts` - Expert picks scraper API
- `/supabase/expert-tracking-schema.sql` - Expert picks database schema

### Modified Files

- `/supabase/sus-plays-schema.sql` - Added priority scoring + column migration
- `/src/app/api/sus/route.ts` - Order by priority_score
- `/scripts/seed-sus-plays.ts` - Fixed env var loading

---

## 6. Expert Picks Scraper System

### ESPN Picks Scraper (`/src/lib/scrapers/espn-picks-scraper.ts`)

Scrapes expert picks from ESPN's picks pages:

- **NFL**: <https://www.espn.com/nfl/picks>
- **NBA**: <https://www.espn.com/nba/picks>
- **MLB, NHL, NCAAF, NCAAB**: Similar URLs

**Features:**

- Uses ESPN API when available (JSON endpoint)
- Falls back to HTML scraping if API unavailable
- Tracks known experts (Dan Graziano, Mike Clay, etc.)
- Stores picks with game context and lines

**Recommended Schedule:** Every 4 hours on game days

### Covers.com Scraper (`/src/lib/scrapers/covers-scraper.ts`)

Scrapes consensus data from Covers.com:

- Expert consensus percentages
- Line movements
- Individual analyst picks (when available)

**Recommended Schedule:** 2-3x per day (records don't change often)

### API Endpoint (`/api/expert-picks/scrape`)

**GET:** Fetch current picks (no storage)

```bash
GET /api/expert-picks/scrape?source=espn&sport=NFL
```

**POST:** Scrape and store (for cron jobs)

```json
{ "action": "scrape-espn", "sport": "NFL" }
{ "action": "scrape-covers", "sport": "NFL" }
{ "action": "scrape-all" }  // Full scrape - use sparingly
{ "action": "get-leaderboard", "sport": "NFL" }
```

### Database Tables (`/supabase/expert-tracking-schema.sql`)

- `expert_records` - Overall records per expert
- `expert_picks` - Individual picks with result tracking
- `expert_consensus` - Aggregated consensus data

---

## 7. Next Steps

### To Deploy

1. Run `supabase/sus-plays-schema.sql` to update Sus Plays table
2. Run `supabase/pattern-discovery-schema.sql` to create pattern tables
3. Run `supabase/expert-tracking-schema.sql` to create expert tables
4. Set up cron job for `refresh_all_sus_play_scores()` (every 15 min)
5. Set up cron job for pattern discovery cycle (daily)
6. Set up cron job for expert picks scraping:
   - ESPN: Every 4 hours on game days
   - Covers: 2-3x per day

### For Expert Tracking

1. Either license data from BettingPros/Action Network OR
2. Build manual pick tracking system going forward
3. Never publish records without verification
4. Legal review before any "accountability" posts

### For Social Media

1. Build admin UI for content scheduling
2. Integrate with Twitter/Meta APIs for posting
3. Set up approval workflow before any post goes live
