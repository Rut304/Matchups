# Deployment Guide - Autonomous 24/7 Operation

This guide covers deploying Matchups to run fully autonomously without relying on any local machine.

## Prerequisites

1. **Vercel Account** (Pro plan recommended for cron jobs)
2. **Supabase Project** with schemas deployed
3. **API Keys** for data sources

## Step 1: Deploy Database Schemas

Run these SQL files in order in your Supabase SQL Editor:

1. **schema-safe.sql** - Core tables (games, odds, teams, etc.)
2. **cappers-schema-safe.sql** - Cappers and picks tracking

Both files use `IF NOT EXISTS` patterns so they're safe to re-run.

## Step 2: Configure Environment Variables

Set these in **Vercel Dashboard → Settings → Environment Variables**:

### Required Variables

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...  # Keep this secret!

# Cron Security (generate a random string)
CRON_SECRET=your-secure-random-string-here

# Odds API (for betting lines)
THE_ODDS_API_KEY=your-odds-api-key
```

### Optional Variables

```bash
# Stripe (for payments)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...

# AI Features
GOOGLE_AI_API_KEY=AIza...  # For Gemini
OPENAI_API_KEY=sk-...      # If using OpenAI

# Analytics
NEXT_PUBLIC_GA_ID=G-...
```

## Step 3: Deploy to Vercel

```bash
# Connect repo and deploy
vercel

# Or link existing project
vercel link
vercel deploy --prod
```

## Step 4: Verify Cron Jobs

Cron jobs are defined in `vercel.json` and run automatically:

| Job | Schedule | Purpose |
|-----|----------|---------|
| `/api/cron/update-scores` | Every minute (active hours) | Real-time score updates |
| `/api/cron/refresh-odds` | Every 5 min (active hours) | Betting line updates |
| `/api/cron/refresh-scores` | Every 2 min (active hours) | ESPN score sync |
| `/api/cron/sync-games` | Every 4 hours | Full game data sync |
| `/api/cron/refresh-standings` | 10AM & 10PM UTC | Standings updates |
| `/api/cron/refresh-injuries` | Every 6 hours | Injury report updates |
| `/api/cron/discover-trends` | Daily 7AM UTC | Trend analysis |
| `/api/cron/grade-picks` | 8AM, 2PM, 8PM UTC | Grade completed picks |

### Cost-Saving Schedule

The cron jobs only run during peak hours:

- **Active Hours**: 3PM-7AM UTC (10AM-2AM ET)
- **Reduced Hours**: 7AM-3PM UTC (2AM-10AM ET)

This covers all major US sports scheduling while minimizing costs.

## Step 5: Verify Deployment

Test each endpoint:

```bash
# Live scores
curl https://your-domain.vercel.app/api/games?sport=NFL

# Analytics
curl https://your-domain.vercel.app/api/analytics?type=summary

# Manually trigger cron (for testing)
curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
  https://your-domain.vercel.app/api/cron/refresh-scores
```

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         VERCEL EDGE                             │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    Next.js App                            │   │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐     │   │
│  │  │ /api/   │  │ /api/   │  │ /api/   │  │  Pages  │     │   │
│  │  │ games   │  │ odds    │  │ cron/*  │  │  (SSR)  │     │   │
│  │  └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘     │   │
│  │       │            │            │            │           │   │
│  │       └────────────┴────────────┴────────────┘           │   │
│  │                         │                                 │   │
│  │                    Data Layer                             │   │
│  └──────────────────────────┼───────────────────────────────┘   │
└─────────────────────────────┼───────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              │               │               │
              ▼               ▼               ▼
        ┌──────────┐   ┌──────────┐   ┌──────────┐
        │ Supabase │   │   ESPN   │   │ The Odds │
        │ Database │   │   API    │   │   API    │
        └──────────┘   └──────────┘   └──────────┘
```

## Monitoring

### Vercel Dashboard

- View cron execution logs
- Monitor function invocations
- Check error rates

### Supabase Dashboard

- Monitor database connections
- Check data storage usage
- View real-time queries

## Troubleshooting

### Cron Jobs Not Running

1. Check `CRON_SECRET` is set in Vercel env vars
2. Verify Pro plan is active (free tier limits crons)
3. Check function logs for errors

### Database Errors

1. Verify `SUPABASE_SERVICE_ROLE_KEY` is correct
2. Check RLS policies allow service role access
3. Run schema migrations if tables missing

### API Rate Limits

- ESPN: ~100 req/min (unofficial)
- The Odds API: Check your plan limits
- Implement caching for high-traffic endpoints

## Scaling Considerations

### If Traffic Increases

1. Add Redis/Upstash for caching
2. Use Vercel Edge Config for feature flags
3. Consider dedicated Supabase instance

### If More Sports Needed

1. Add new sport to ESPN endpoints
2. Update cron schedules for sport's season
3. Add sport-specific trend analysis

## Security Checklist

- [ ] `SUPABASE_SERVICE_ROLE_KEY` is in env vars, not code
- [ ] `CRON_SECRET` is random, secure string
- [ ] RLS enabled on all tables
- [ ] API routes verify cron secret
- [ ] No sensitive data in client-side code
