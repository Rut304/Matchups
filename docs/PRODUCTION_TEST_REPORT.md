# Matchups Production Testing Report

**Date**: January 11, 2026  
**Tested URLs**:
- Production: https://matchups.vercel.app
- Git Branch: https://matchups-git-main-rut304s-projects.vercel.app

---

## 🚨 Critical Issues

### 1. Production Domain Cache Stale (CRITICAL)
**Status**: 🔴 BLOCKING  
**Impact**: Most pages return 404 on production domain

**Details**:
- `matchups.vercel.app` is serving stale cached 404s
- Cache age shows 7+ days old responses
- Git branch URL (`matchups-git-main-rut304s-projects.vercel.app`) works correctly

**Evidence**:
```
Production: /nfl/matchups → 404 (age: 647621 seconds)
Git Branch: /nfl/matchups → 200 ✅
```

**Fix Required**: 
1. Redeploy to production OR
2. Purge Vercel cache OR
3. Check production domain assignment in Vercel dashboard

---

### 2. Database Schema Missing Relationships (CRITICAL)
**Status**: 🔴 BLOCKING  
**Impact**: Leaderboard API returns 500 error

**Details**:
```json
{"error":"Could not find a relationship between 'capper_stats' and 'cappers' in the schema cache"}
```

**Fix Required**: 
Run the following SQL in Supabase:
```sql
ALTER TABLE capper_stats 
ADD CONSTRAINT fk_capper_stats_capper 
FOREIGN KEY (capper_id) REFERENCES cappers(id);
```

Or ensure the schema is properly applied from `/supabase/cappers-schema.sql`

---

## ⚠️ Warning Issues

### 3. Odds API Not Configured
**Status**: 🟡 DEGRADED  
**Impact**: Real-time odds not available

**Details**:
- Health check shows: "API key not configured - using mock data"
- `/api/odds` returns 404

**Fix Required**: 
Add `ODDS_API_KEY` to Vercel environment variables

---

### 4. Internal API Unhealthy
**Status**: 🟡 DEGRADED  
**Impact**: Some internal endpoints failing

**Details**:
- Health check shows: "HTTP 400" for Internal API
- May affect edge detection and other features

---

## ✅ Working Features

### Pages (on Git Branch URL)
| Page | Status | Notes |
|------|--------|-------|
| `/` (Homepage) | ✅ 200 | Edge cards loading with demo data |
| `/nfl` | ✅ 200 | NFL hub page |
| `/nfl/matchups` | ✅ 200 | Matchups display |
| `/nba` | ✅ 200 | NBA hub page |
| `/nba/matchups` | ✅ 200 | Matchups display |
| `/nhl` | ✅ 200 | NHL hub page |
| `/nhl/matchups` | ✅ 200 | Matchups display |
| `/mlb` | ✅ 200 | MLB hub page |
| `/mlb/matchups` | ✅ 200 | Matchups display |
| `/leaderboard` | ✅ 200 | Page loads (API errors on data) |
| `/markets` | ✅ 200 | Prediction markets |
| `/news` | ✅ 200 | News feed |
| `/picks` | ✅ 200 | Picks page |
| `/live` | ✅ 200 | Live scores |
| `/injuries` | ✅ 200 | Injury reports |
| `/analytics` | ✅ 200 | Analytics dashboard |
| `/calculators` | ✅ 200 | Betting calculators |
| `/dashboard` | ✅ 200 | User dashboard |
| `/trend-finder` | ✅ 200 | Trend discovery tool |
| `/admin` | ✅ 200 | Admin panel |
| `/auth` | ✅ 200 | Authentication page |
| `/trends` | ✅ 200 | Trends page |

### API Routes (on Git Branch URL)
| Endpoint | Status | Notes |
|----------|--------|-------|
| `/api/games?sport=nfl` | ✅ 200 | Returns game data |
| `/api/markets` | ✅ 200 | Returns market data |
| `/api/scores` | ✅ 200 | Returns scores |
| `/api/live` | ✅ 200 | Returns live games |
| `/api/edges/today` | ✅ 200 | Returns edge data |
| `/api/health` | ⚠️ 503 | Reports unhealthy (see issues above) |
| `/api/leaderboard` | ❌ 500 | Database relationship error |
| `/api/odds` | ❌ 404 | Missing API key |

### External Services Status
| Service | Status | Notes |
|---------|--------|-------|
| ESPN NFL | ✅ Healthy | 6 events found |
| ESPN NBA | ✅ Healthy | 6 events found |
| ESPN NHL | ✅ Healthy | 14 events found |
| ESPN NCAAF | ✅ Healthy | 54 events found |
| ESPN NCAAB | ✅ Healthy | 19 events found |
| Supabase | ✅ Healthy | Connected |
| Odds API | ⚠️ Degraded | Not configured |
| Internal API | ❌ Unhealthy | HTTP 400 |

---

## 📋 Action Items

### Immediate (Today)
1. [ ] **Fix production domain** - Redeploy or purge cache in Vercel dashboard
2. [ ] **Fix database schema** - Add foreign key relationship for capper_stats

### Short-term (This Week)
3. [ ] **Configure Odds API** - Add `ODDS_API_KEY` to Vercel env vars
4. [ ] **Debug Internal API** - Investigate HTTP 400 error
5. [ ] **Configure Twitter/X API** - Currently rate limited (causing news build issues)

### Medium-term
6. [ ] **Set up cron jobs** - Ensure Vercel cron is configured for:
   - `/api/cron/refresh-scores` (every 2 min)
   - `/api/cron/refresh-odds` (every 5 min)
   - `/api/cron/grade-picks` (3x daily)
7. [ ] **Add monitoring** - Set up uptime monitoring for critical endpoints
8. [ ] **Error tracking** - Consider adding Sentry for error visibility

---

## 🔧 Quick Fixes

### Fix Production Cache
In Vercel Dashboard:
1. Go to Project Settings → Functions
2. Click "Purge Cache" or redeploy
3. Or run: `vercel --prod` from CLI

### Fix Database Relationship
Run in Supabase SQL Editor:
```sql
-- Check if relationship exists
SELECT 
  tc.constraint_name, 
  kcu.column_name, 
  ccu.table_name AS foreign_table_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'capper_stats';

-- If missing, add it
ALTER TABLE capper_stats 
ADD CONSTRAINT fk_capper_stats_capper 
FOREIGN KEY (capper_id) REFERENCES cappers(id)
ON DELETE CASCADE;
```

### Configure Odds API
In Vercel Dashboard:
1. Go to Settings → Environment Variables
2. Add: `ODDS_API_KEY` = your-api-key-here

---

## 📊 Test Summary

| Category | Passed | Failed | Degraded |
|----------|--------|--------|----------|
| Pages | 22 | 0 | 0 |
| API Routes | 5 | 2 | 1 |
| External Services | 5 | 1 | 1 |

**Overall Status**: ⚠️ Functional with Issues

The site is functional on the git branch URL but the production domain is serving stale content. Database relationship issue affects the leaderboard feature. External API integrations need configuration.

---

*Report generated by automated testing*
