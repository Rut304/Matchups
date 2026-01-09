# Matchups - Sports Betting Intelligence Platform

A comprehensive sports betting analytics platform built with Next.js, featuring real-time odds, expert pick tracking, and advanced edge detection.

## 🎯 Features

### Core Features

- **Live Games & Scores** - Real-time data for NFL, NBA, NHL, MLB, NCAAF, NCAAB
- **The Edge Leaderboard** - Track celebrity, sharp, and community cappers
- **Prediction Markets** - Polymarket, Kalshi, PredictIt tracking
- **AI Analysis** - Gemini-powered matchup analysis
- **Trends & Analytics** - Historical patterns and situational edges

### 🆕 Edge Detection Features (NEW)

Advanced betting intelligence signals to find value:

| Feature | Description |
|---------|-------------|
| 🔄 **RLM (Reverse Line Movement)** | Detects when lines move opposite to public betting percentages |
| 💨 **Steam Moves** | Sharp sudden line movements across multiple sportsbooks |
| 📈 **CLV Tracking** | Closing Line Value measurement for pick quality |
| 🎯 **Sharp vs Public** | Compare sharp money to recreational betting |
| 💰 **Arbitrage Alerts** | Cross-book guaranteed profit opportunities |
| 📊 **Props Comparison** | Best odds across books for player props |

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account (for database)

### Installation

```bash
# Clone the repository
git clone https://github.com/Rut304/Matchups.git
cd Matchups

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your API keys

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

### Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-key

# Optional: The Odds API (for live betting lines)
ODDS_API_KEY=your-odds-api-key

# Optional: Gemini AI (for matchup analysis)
GEMINI_API_KEY=your-gemini-key
```

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── admin/             # Admin panel
│   ├── api/               # API routes
│   │   ├── edges/         # Edge detection API
│   │   ├── games/         # Games data API
│   │   └── cron/          # Scheduled jobs
│   ├── leaderboard/       # The Edge - Sports & Markets
│   ├── nfl/, nba/, etc.   # Sport pages
│   └── ...
├── components/
│   ├── edge/              # Edge alert components
│   ├── layout/            # Navbar, Footer
│   └── ui/                # Reusable UI components
├── lib/
│   ├── edge-features.ts   # Edge detection logic
│   ├── api/               # Data layer & API clients
│   └── ...
└── types/                 # TypeScript types
```

## 🔧 Admin Panel

Access the admin panel at `/admin` to:

- Monitor data jobs and API health
- Manage edge feature toggles
- Configure notifications
- View system diagnostics
- Manage users

### Edge Features Admin

Navigate to Admin > Edge Features to control:

- Master toggle for all edge features
- Individual feature enable/disable
- Confidence thresholds
- Notification settings
- Alert retention period

## 📊 API Endpoints

### Games

- `GET /api/games?sport=NFL` - Get games for a sport

### Edge Alerts

- `GET /api/edges` - Get all active edge alerts
- `GET /api/edges?sport=NFL` - Filter by sport
- `GET /api/edges?type=rlm` - Filter by type
- `GET /api/edges?gameId=xxx` - Get alerts for specific game
- `GET /api/edges?minConfidence=70` - Filter by confidence

### Data Refresh (Cron)

- `GET /api/cron/refresh-odds` - Refresh betting odds
- `GET /api/cron/refresh-scores` - Refresh live scores
- `GET /api/cron/sync-games` - Sync game schedules

## 🧪 Testing

```bash
# Run Playwright E2E tests
npm run test:e2e

# Run specific test file
npx playwright test e2e/edge-features.spec.ts

# Run with UI
npx playwright test --ui
```

## 🗄️ Database Schema

Run the schema migrations in Supabase SQL Editor:

- `supabase/schema.sql` - Core tables
- `supabase/admin-settings-schema.sql` - Admin & edge settings
- `supabase/leaderboard-schema.sql` - Leaderboard tables

## 📦 Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import project to Vercel
3. Add environment variables
4. Deploy

Cron jobs are configured in `vercel.json`:

- Odds refresh: Every 15 minutes
- Scores refresh: Every 5 minutes
- Games sync: Every 6 hours
- Standings: Daily at 8am UTC
- Injuries: Every 12 hours

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Database**: Supabase (PostgreSQL)
- **Styling**: Tailwind CSS
- **Testing**: Playwright
- **AI**: Google Gemini
- **Data**: ESPN API, The Odds API

## 📝 License

MIT

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing`)
5. Open Pull Request
