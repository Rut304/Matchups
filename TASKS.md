# Matchups - Project Task Tracker

> **Last Updated:** January 12, 2026  
> **Production URL:** <https://matchups-eta.vercel.app>
> **Supabase Project:** Matchups (cdfdmkntdsfylososgwo)

---

## ✅ Game Matchup Page - WORKING

The `/game/[id]` page is fully functional with real ESPN data:
- ✅ Team scores from ESPN
- ✅ Odds from ESPN DraftKings  
- ✅ Predictor win probabilities
- ✅ Injuries with player details
- ✅ Team leaders
- ✅ Line movement (open vs close)
- ✅ Multi-book odds comparison
- ✅ ATS Records (calculated from historical_games if ESPN doesn't provide)

### Key Files
- `/src/app/game/[id]/page.tsx` - Main page
- `/src/app/api/games/[id]/summary/route.ts` - Summary API
- `/src/lib/api/ats-calculator.ts` - ATS calculation from historical data

---

## ✅ COMPLETED (P0 - Critical)

### Core Platform

- [x] **Next.js 16 Setup** - App Router, TypeScript, Tailwind
- [x] **Vercel Deployment** - Production deploy with CI/CD
- [x] **Homepage Redesign** - Compact matchup cards, data-driven stats
- [x] **Bold Color System** - Orange #FF6B00, Blue #00A8FF, Green #00FF88, Pink #FF3366

### Sport Pages (All Complete with Consistent Styling)

- [x] **NFL Page** - Wild Card games, playoff standings, trends sidebar
- [x] **NBA Page** - Compact game cards, ATS stats, league standings
- [x] **NHL Page** - Puck line, totals, league points standings
- [x] **MLB Page** - Run line, pitcher matchups, playoff picture
- [x] **NCAAF Page** - College Football with AP Top 25, Heisman Watch, CFP Preview ✅ NEW
- [x] **NCAAB Page** - College Basketball with POY Watch, Bracketology, Conference Rankings ✅ NEW

### Key Features

- [x] **Leaderboard Page** - THE VIRAL FEATURE 🏆
  - Full capper rankings table
  - Record, Win %, Units, ROI, Streak columns
  - Time filters (Today, Week, Month, Season, All Time)
  - Sport filters (All, NFL, NBA, NHL, MLB)
  - Hot Streaks & Sport Leaders sidebars
  - Rank change indicators, verified badges
- [x] **Markets Page** - Polymarket/Kalshi prediction markets with AI edge
- [x] **Trends Page** - Betting trends by sport with ROI, confidence bars
- [x] **Analytics Page** - Dashboard with news sentiment & market data ✅ NEW
- [x] **Players Page** - Player lookup and stats ✅ NEW
- [x] **Admin Dashboard** - Basic admin interface
- [x] **Admin Docs Page** - Infrastructure & workflow documentation
- [x] **Admin Picks Page** - Pick management interface ✅ NEW

### Data & Stats

- [x] **ATS Records** - Against the spread records on all matchups
- [x] **O/U Records** - Over/under records for teams
- [x] **Moneylines** - ML odds with color coding (+green, -red)
- [x] **Public Betting %** - Progress bars showing public money
- [x] **Spread Movement** - Line movement indicators
- [x] **AI Pick Toggle** - Show/hide AI recommendations

### Infrastructure

- [x] **Supabase Schema** - Database tables deployed to Matchups project ✅ MIGRATED
- [x] **Supabase Connection** - Connected to cdfdmkntdsfylososgwo.supabase.co ✅ NEW
- [x] **Playwright Tests** - 40+ E2E tests covering all routes ✅ UPDATED
- [x] **Footer Component** - Admin link moved to footer
- [x] **Navbar Updated** - Leaderboard CTA, NCAAF/NCAAB links added
- [x] **Vercel Environment Variables** - All API keys configured ✅ NEW
- [x] **MCP Servers** - GitHub, Supabase, Vercel MCP configured ✅ NEW
- [x] **Live Sports API Layer** - ESPN, NHL, MLB, Ball Don't Lie APIs ✅ NEW

### Security

- [x] **.env removed from Git** - Environment variables secured
- [x] **.gitignore updated** - Proper ignore patterns
- [x] **Supabase RLS** - Row Level Security policies enabled ✅ NEW

---

## ✅ RECENTLY COMPLETED (January 4, 2026)

### Sus Plays Feature ✅ NEW

- [x] **Sus Plays Page** - /sus - Viral content tracking questionable plays
  - Monitor X/Twitter for trending sports videos
  - Players being questioned for throwing games/props
  - Community voting (Sus vs Legit)
  - Filtering by sport, bet type, trending
  - Video thumbnails, view counts, source links
  - Sus Score algorithm (1-100)
  - Submit your own sus play feature

### API Integrations - ALL LIVE ✅

- [x] **The Odds API** - Live odds fetching (key in Vercel)
- [x] **API-Sports** - Comprehensive sports data (key in Vercel)
- [x] **ESPN API** - Free live scores and schedules
- [x] **NHL Official API** - Free hockey data
- [x] **MLB Stats API** - Free baseball data
- [x] **Ball Don't Lie** - Free NBA player data
- [x] **Polymarket API** - Prediction markets
- [x] **Kalshi API** - Prediction markets

### Database Migration ✅

- [x] **New Supabase Project** - Created "Matchups" project on correct account
- [x] **Full Schema Deployed** - All tables, indexes, triggers, RLS
- [x] **Seed Data Loaded** - 8 NFL teams in database
- [x] **Old Project Separated** - PolyParlay project untouched

---

## 🔄 IN PROGRESS (P1 - High Priority)

### User Features

- [x] **User Authentication** - Supabase Auth setup ✅ COMPLETED
  - Auth context and provider
  - Login/Signup page with OAuth
  - Middleware for session refresh
  - Callback handler for OAuth
- [x] **Pick Tracking** - Users can log their picks ✅ COMPLETED
  - /picks page with stats dashboard
  - Create pick modal
  - Filter by sport/status
  - Win rate tracking
- [x] **Leaderboard Backend** - Connect to Supabase cappers/picks tables ✅ COMPLETED
  - /api/leaderboard endpoint
  - /api/cappers/[slug] endpoint
  - Sport/timeframe filtering
- [x] **Profile Pages** - Individual capper profiles (/leaderboard/[slug]) ✅ COMPLETED
  - User profile settings at /profile
  - Notification preferences
  - Subscription management UI

### Research Complete ✅

- [x] **Bettor Research** - See docs/BETTOR-RESEARCH.md
  - 12 essential data points bettors need
  - Competitive analysis (Action Network, OddsJam, SBR)
  - Feature prioritization for next phases
  - Monetization model ($19 Pro / $49 Elite)

---

## ✅ RECENTLY COMPLETED (January 2026)

### Line Shop & Calculators ✅ NEW

- [x] **Line Shop Widget** - /lineshop
  - Compare odds across 8 sportsbooks
  - DraftKings, FanDuel, BetMGM, Caesars, etc.
  - Spread/Total/Moneyline views
  - Best odds highlighting
- [x] **Odds Calculator Suite** - /calculators
  - Parlay calculator (multi-leg)
  - Hedge calculator (guaranteed profit)
  - Kelly Criterion (optimal bet sizing)
  - EV Calculator (expected value)
  - Odds Converter (American/Decimal/Fractional)

### Weather & Injuries ✅ NEW

- [x] **Weather Widget** - /weather
  - Outdoor game conditions
  - Impact assessment (low/medium/high)
  - Betting tips per game
- [x] **Injury Tracker** - /injuries
  - Real-time injury updates
  - Betting impact ratings (1-5)
  - Line movement tracking
  - Star player filtering

### Alerts & Notifications ✅ NEW

- [x] **Live Alerts** - /alerts
  - Line movement alerts
  - Sharp action detection
  - Injury updates
  - Public money tracking
  - Severity levels

### Admin Management ✅ NEW

- [x] **Admin Content Management** - /admin/manage
  - CRUD for cappers
  - Pick result updates
  - Sus play moderation
  - Verification management

### API Routes ✅ NEW

- [x] /api/leaderboard - Capper rankings
- [x] /api/picks - User picks CRUD
- [x] /api/cappers/[slug] - Capper profiles
- [x] /api/injuries - Injury data
- [x] /api/alerts - Live alerts

---

## 📋 BACKLOG (P2 - Medium Priority)

### Phase 1: Core Value (From Research)

- [x] **Line Shop Widget** - Show best odds across all books ✅ COMPLETED
- [x] **Odds Calculator Suite** - Parlay, hedge, Kelly, EV calculators ✅ COMPLETED
- [x] **Injury Tracker** - Real-time with impact ratings ✅ COMPLETED
- [x] **Weather Widget** - For NFL/MLB outdoor games ✅ COMPLETED

### Phase 2: Engagement Features

- [x] **Email Alerts** - Line moves, sharp action, injuries ✅ (UI Complete, email integration pending)
- [ ] **Mobile App** - React Native or PWA
- [ ] **Social Sharing** - Share picks to Twitter/X
- [ ] **Push Notifications** - Real-time alerts

### Content

- [ ] **Blog/Articles** - Expert analysis content
- [ ] **Video Picks** - YouTube/TikTok integration
- [ ] **Discord Bot** - Community picks channel
- [ ] **Newsletter** - Weekly picks roundup

### Advanced

- [ ] **AI Model Training** - Improve pick accuracy
- [ ] **Historical Data** - Past seasons analysis
- [ ] **Arbitrage Finder** - Cross-book opportunities
- [ ] **Live Betting** - In-game odds tracking

---

## 🎯 FUTURE IDEAS (P3)

### Pro Features (Monetization)

- [ ] Arbitrage Scanner
- [ ] Positive EV Finder
- [ ] API Access for Developers
- [ ] Custom Alert System
- [ ] Historical Database

### Content & Community

- [ ] Blog/Articles - Expert analysis
- [ ] Video Picks - YouTube/TikTok
- [ ] Discord Bot - Community picks
- [ ] Newsletter - Weekly roundup

### Advanced Analytics

- [ ] Prop Bet Builder
- [ ] Betting Simulator
- [ ] Fantasy Integration
- [ ] Referee/Umpire Trends

---

## 📊 Metrics & Goals

| Metric | Current | Target |
| ------ | ------- | ------ |
| AI Pick Win Rate | 58% | 60%+ |
| Pages Complete | 15 | 15 ✅ |
| E2E Tests | 40+ | 50 |
| API Integrations | 8 (live) | 8 ✅ |
| Active Users | 0 | 1,000 |
| Supabase Tables | 20+ | 20+ ✅ |

---

## 🚀 Deployment Checklist

Before each deploy:

1. [ ] Run `npm run build` locally
2. [ ] Run `npm run test` - all tests pass
3. [ ] Check for TypeScript errors
4. [ ] Verify env variables are set
5. [ ] Run `vercel --prod`
6. [ ] Verify production site loads

---

## 📝 Notes

- **Design System:** Inline styles used for guaranteed color visibility
- **Leaderboard is the viral feature** - Focus on making this shareable
- **Data-driven approach** - Gamblers want stats, not just AI picks
- **Mobile-first** - All pages responsive

---

*This document is actively maintained. Check back for updates.*
