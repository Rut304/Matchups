import Link from 'next/link'
import { 
  TrendingUp, 
  TrendingDown,
  Zap, 
  ArrowRight,
  AlertCircle,
  Clock,
  BarChart3,
  Flame,
  Target,
  Trophy,
  Star,
  Users,
  Medal,
  ChevronRight,
  Calendar
} from 'lucide-react'

// Mock data - will be replaced with real API calls
const todaysGames = [
  {
    id: 'nfl-det-min-1', sport: 'NFL', sportIcon: '🏈',
    away: { abbr: 'MIN', record: '14-3', ats: '11-6', ou: '8-9' },
    home: { abbr: 'DET', record: '15-2', ats: '12-5', ou: '10-7' },
    time: '1:00 PM', spread: -3.5, total: 51.5, 
    moneyline: { away: +150, home: -175 },
    aiPick: 'DET -3.5', aiConf: 72, isHot: true
  },
  {
    id: 'nfl-kc-buf-1', sport: 'NFL', sportIcon: '🏈',
    away: { abbr: 'KC', record: '15-2', ats: '9-8', ou: '7-10' },
    home: { abbr: 'BUF', record: '13-4', ats: '10-7', ou: '8-9' },
    time: '4:25 PM', spread: -2.5, total: 47.5,
    moneyline: { away: +115, home: -135 },
    aiPick: 'BUF -2.5', aiConf: 64, isHot: true
  },
  {
    id: 'nba-bos-lal-1', sport: 'NBA', sportIcon: '🏀',
    away: { abbr: 'BOS', record: '28-9', ats: '21-16', ou: '18-19' },
    home: { abbr: 'LAL', record: '22-15', ats: '18-19', ou: '20-17' },
    time: '8:30 PM', spread: -4.5, total: 222.5,
    moneyline: { away: -195, home: +165 },
    aiPick: 'LAL +4.5', aiConf: 58, isHot: true
  },
  {
    id: 'nhl-nyr-bos-1', sport: 'NHL', sportIcon: '🏒',
    away: { abbr: 'NYR', record: '23-15-3', ats: '19-19', ou: '17-20' },
    home: { abbr: 'BOS', record: '24-14-4', ats: '20-18', ou: '16-22' },
    time: '7:00 PM', spread: -1.5, total: 5.5,
    moneyline: { away: +125, home: -145 },
    aiPick: 'UNDER 5.5', aiConf: 66, isHot: true
  },
  {
    id: 'mlb-nyy-bos-1', sport: 'MLB', sportIcon: '⚾',
    away: { abbr: 'NYY', record: '7-3', ats: '6-4', ou: '5-5' },
    home: { abbr: 'BOS', record: '6-4', ats: '5-5', ou: '6-4' },
    time: '4:10 PM', spread: -1.5, total: 9.5,
    moneyline: { away: -150, home: +130 },
    aiPick: 'OVER 9.5', aiConf: 62, isHot: false
  },
  {
    id: 'nba-okc-gsw-1', sport: 'NBA', sportIcon: '🏀',
    away: { abbr: 'OKC', record: '30-6', ats: '22-14', ou: '18-18' },
    home: { abbr: 'GSW', record: '20-17', ats: '17-20', ou: '19-18' },
    time: '10:00 PM', spread: -5.5, total: 226.5,
    moneyline: { away: -210, home: +175 },
    aiPick: 'OKC -5.5', aiConf: 70, isHot: false
  },
]

// Top Leaderboard Data
const topCappers = [
  { rank: 1, name: 'SharpShooter_Mike', avatar: '🎯', record: '156-98', winPct: 61.4, units: +42.3, streak: 'W5', sport: 'All' },
  { rank: 2, name: 'VegasVince', avatar: '🎰', record: '89-52', winPct: 63.1, units: +38.7, streak: 'W3', sport: 'NFL' },
  { rank: 3, name: 'HoopsGuru', avatar: '🏀', record: '124-87', winPct: 58.8, units: +28.4, streak: 'L1', sport: 'NBA' },
  { rank: 4, name: 'IceColdPicks', avatar: '🏒', record: '67-45', winPct: 59.8, units: +22.1, streak: 'W7', sport: 'NHL' },
  { rank: 5, name: 'MoneyLine_Maven', avatar: '💰', record: '201-156', winPct: 56.3, units: +19.8, streak: 'W2', sport: 'All' },
]

const hotTrends = [
  { id: '1', trend: 'NFL home underdogs', record: '18-6', pct: 75, edge: '+12.4%', sport: 'NFL' },
  { id: '2', trend: 'Thunder road games', record: '9-1', pct: 90, edge: '+8.7%', sport: 'NBA' },
  { id: '3', trend: 'NHL January overs', record: '14-10', pct: 58, edge: '+5.2%', sport: 'NHL' },
  { id: '4', trend: 'Week 18 unders', record: '24-12', pct: 67, edge: '+6.8%', sport: 'NFL' },
  { id: '5', trend: 'Celtics vs +.500 teams', record: '16-4', pct: 80, edge: '+9.3%', sport: 'NBA' },
  { id: '6', trend: 'Jets under 6 goals', record: '12-5', pct: 71, edge: '+7.1%', sport: 'NHL' },
  { id: '7', trend: 'Sunday night dogs', record: '8-3', pct: 73, edge: '+10.5%', sport: 'NFL' },
  { id: '8', trend: 'Lakers 1Q unders', record: '11-6', pct: 65, edge: '+4.8%', sport: 'NBA' },
]

// League Standings (condensed)
const standings = {
  NFL: [
    { team: 'DET', record: '14-2', pf: 512, pa: 298 },
    { team: 'KC', record: '14-2', pf: 438, pa: 286 },
    { team: 'PHI', record: '13-3', pf: 466, pa: 298 },
    { team: 'BUF', record: '13-3', pf: 502, pa: 318 },
  ],
  NBA: [
    { team: 'OKC', record: '27-5', pf: 120.2, pa: 106.8 },
    { team: 'CLE', record: '26-6', pf: 119.5, pa: 108.2 },
    { team: 'BOS', record: '25-8', pf: 118.8, pa: 110.1 },
    { team: 'MEM', record: '23-10', pf: 117.2, pa: 111.5 },
  ]
}

const injuries = [
  { player: 'Brock Purdy', team: 'SF', status: 'Q', injury: 'Elbow' },
  { player: 'Stephen Curry', team: 'GSW', status: 'O', injury: 'Knee' },
  { player: 'Luka Doncic', team: 'DAL', status: 'Q', injury: 'Calf' },
  { player: 'Puka Nacua', team: 'LAR', status: 'O', injury: 'Knee' },
  { player: 'Tyreek Hill', team: 'MIA', status: 'Q', injury: 'Ankle' },
  { player: 'Ja Morant', team: 'MEM', status: 'O', injury: 'Hip' },
  { player: 'Jaylen Brown', team: 'BOS', status: 'Q', injury: 'Back' },
  { player: 'Tee Higgins', team: 'CIN', status: 'D', injury: 'Quad' },
]

export default function Home() {
  return (
    <div className="min-h-screen" style={{ background: '#050508' }}>
      {/* Hero Section - BOLD & IMPACTFUL */}
      <section className="relative overflow-hidden" style={{ background: 'linear-gradient(180deg, #0a0a12 0%, #050508 100%)' }}>
        {/* Animated gradient orbs */}
        <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full opacity-20 blur-3xl pointer-events-none" 
             style={{ background: 'radial-gradient(circle, #FF6B00 0%, transparent 70%)' }} />
        <div className="absolute top-20 right-1/4 w-80 h-80 rounded-full opacity-15 blur-3xl pointer-events-none" 
             style={{ background: 'radial-gradient(circle, #00A8FF 0%, transparent 70%)' }} />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            {/* FREE Banner - Eye Catching */}
            <div className="inline-flex items-center gap-3 px-6 py-2.5 rounded-full mb-6 animate-pulse"
                 style={{ 
                   background: 'linear-gradient(135deg, rgba(0,255,136,0.2), rgba(0,200,100,0.1))', 
                   border: '2px solid rgba(0,255,136,0.5)',
                   boxShadow: '0 0 30px rgba(0,255,136,0.3)'
                 }}>
              <span style={{ fontSize: '1.25rem' }}>🎉</span>
              <span style={{ color: '#00FF88', fontSize: '1rem', fontWeight: 800, letterSpacing: '0.05em' }}>100% FREE — NO SIGN UP REQUIRED</span>
              <span style={{ fontSize: '1.25rem' }}>🎉</span>
            </div>
            
            {/* AI Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 ml-3"
                 style={{ background: 'linear-gradient(135deg, rgba(255,107,0,0.15), rgba(0,168,255,0.15))', border: '1px solid rgba(255,107,0,0.3)' }}>
              <Zap style={{ color: '#FF6B00', width: '16px', height: '16px' }} />
              <span style={{ color: '#FF6B00', fontSize: '0.875rem', fontWeight: 600 }}>AI-Powered Analysis</span>
            </div>
            
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black mb-6" style={{ color: '#FFFFFF', letterSpacing: '-0.03em', lineHeight: 1.1 }}>
              Find Your{' '}
              <span style={{ 
                background: 'linear-gradient(135deg, #FF6B00, #FF3366)', 
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                filter: 'drop-shadow(0 0 30px rgba(255,107,0,0.5))'
              }}>Edge</span>
            </h1>
            
            <p className="text-xl mb-8" style={{ color: '#A0A0B0', maxWidth: '600px', margin: '0 auto 2rem' }}>
              Real-time matchup analysis, betting trends, and AI picks.
              Make smarter decisions with data.
            </p>

            {/* Value Props */}
            <div className="flex flex-wrap justify-center gap-6 mb-10 text-sm" style={{ color: '#808090' }}>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ background: '#00FF88' }}></div>
                <span>Free Forever</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ background: '#00A8FF' }}></div>
                <span>No Account Needed</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ background: '#FF6B00' }}></div>
                <span>Updated in Real-Time</span>
              </div>
            </div>
            
            {/* CTA Buttons - More Prominent */}
            <div className="flex flex-wrap justify-center gap-4 mb-12">
              <Link href="/sus"
                    className="inline-flex items-center gap-3 px-8 py-4 rounded-xl font-bold text-lg transition-all hover:scale-105"
                    style={{ 
                      background: 'linear-gradient(135deg, #FF3366, #FF6B00)', 
                      color: '#FFF',
                      boxShadow: '0 0 40px rgba(255,51,102,0.5)'
                    }}>
                <AlertCircle style={{ width: '22px', height: '22px' }} />
                View Sus Plays
                <ArrowRight style={{ width: '20px', height: '20px' }} />
              </Link>
              <Link href="/leaderboard"
                    className="inline-flex items-center gap-3 px-8 py-4 rounded-xl font-bold text-lg transition-all hover:scale-105"
                    style={{ 
                      background: 'linear-gradient(135deg, #FFD700, #FF8C00)', 
                      color: '#000',
                      boxShadow: '0 0 30px rgba(255,215,0,0.4)'
                    }}>
                <Trophy style={{ width: '20px', height: '20px' }} />
                Check The Expert
              </Link>
              <Link href="/nfl"
                    className="inline-flex items-center gap-3 px-8 py-4 rounded-xl font-bold text-lg transition-all hover:scale-105"
                    style={{ 
                      background: 'rgba(255,255,255,0.05)', 
                      color: '#FFF',
                      border: '1px solid rgba(255,255,255,0.2)'
                    }}>
                <span style={{ fontSize: '1.25rem' }}>🏈</span>
                NFL Playoffs
              </Link>
            </div>
            
            {/* Stats Row - THE HOOK */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
              <div className="p-4 rounded-xl text-center" style={{ background: 'rgba(255,107,0,0.1)', border: '1px solid rgba(255,107,0,0.2)' }}>
                <div className="text-3xl font-black mb-1" style={{ color: '#FF6B00', textShadow: '0 0 20px rgba(255,107,0,0.5)' }}>67.3%</div>
                <div className="text-xs uppercase tracking-wider" style={{ color: '#808090' }}>AI Win Rate</div>
              </div>
              <div className="p-4 rounded-xl text-center" style={{ background: 'rgba(0,255,136,0.1)', border: '1px solid rgba(0,255,136,0.2)' }}>
                <div className="text-3xl font-black mb-1" style={{ color: '#00FF88', textShadow: '0 0 20px rgba(0,255,136,0.5)' }}>+12.4%</div>
                <div className="text-xs uppercase tracking-wider" style={{ color: '#808090' }}>Best Edge Today</div>
              </div>
              <div className="p-4 rounded-xl text-center" style={{ background: 'rgba(0,168,255,0.1)', border: '1px solid rgba(0,168,255,0.2)' }}>
                <div className="text-3xl font-black mb-1" style={{ color: '#00A8FF', textShadow: '0 0 20px rgba(0,168,255,0.5)' }}>847</div>
                <div className="text-xs uppercase tracking-wider" style={{ color: '#808090' }}>Active Markets</div>
              </div>
              <div className="p-4 rounded-xl text-center" style={{ background: 'rgba(255,51,102,0.1)', border: '1px solid rgba(255,51,102,0.2)' }}>
                <div className="text-3xl font-black mb-1" style={{ color: '#FF3366', textShadow: '0 0 20px rgba(255,51,102,0.5)' }}>24</div>
                <div className="text-xs uppercase tracking-wider" style={{ color: '#808090' }}>Hot Trends</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Today's Games - COMPACT GRID */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Clock style={{ color: '#FF6B00', width: '20px', height: '20px' }} />
            <h2 className="text-xl font-bold" style={{ color: '#FFF' }}>Today&apos;s Games</h2>
            <span className="text-sm" style={{ color: '#606070' }}>({todaysGames.length} matchups)</span>
          </div>
          <Link href="/nfl" className="flex items-center gap-1 text-sm font-semibold"
                style={{ color: '#FF6B00' }}>
            All Games <ChevronRight style={{ width: '16px', height: '16px' }} />
          </Link>
        </div>

        {/* Compact Matchup Grid - 2-3 columns */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
          {todaysGames.map((game) => (
            <Link key={game.id} href={`/game/${game.id}`}
                  className="block rounded-xl p-4 transition-all hover:scale-[1.02]"
                  style={{ 
                    background: '#0c0c14',
                    border: game.isHot ? '1px solid rgba(255,107,0,0.4)' : '1px solid rgba(255,255,255,0.06)'
                  }}>
              {/* Header Row */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span>{game.sportIcon}</span>
                  <span className="text-xs font-semibold" style={{ color: '#808090' }}>{game.time}</span>
                  {game.isHot && (
                    <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold"
                          style={{ background: 'rgba(255,107,0,0.2)', color: '#FF6B00' }}>
                      <Flame style={{ width: '10px', height: '10px' }} /> HOT
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1 px-2 py-1 rounded"
                     style={{ background: 'rgba(255,107,0,0.1)' }}>
                  <Zap style={{ color: '#FF6B00', width: '12px', height: '12px' }} />
                  <span className="text-xs font-bold" style={{ color: '#FF6B00' }}>{game.aiConf}%</span>
                </div>
              </div>
              
              {/* Teams with Full Stats */}
              <div className="space-y-2">
                {/* Away Team */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-10 text-center font-bold" style={{ color: '#FFF' }}>{game.away.abbr}</span>
                    <span className="text-xs" style={{ color: '#606070' }}>{game.away.record}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <span style={{ color: '#808090' }}>ATS: <span style={{ color: '#A0A0B0' }}>{game.away.ats}</span></span>
                    <span className="font-mono font-bold px-2 py-0.5 rounded"
                          style={{ 
                            background: game.moneyline.away > 0 ? 'rgba(0,255,136,0.1)' : 'rgba(255,68,85,0.1)',
                            color: game.moneyline.away > 0 ? '#00FF88' : '#FF4455'
                          }}>
                      {game.moneyline.away > 0 ? '+' : ''}{game.moneyline.away}
                    </span>
                  </div>
                </div>
                
                {/* Home Team */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-10 text-center font-bold" style={{ color: '#FFF' }}>{game.home.abbr}</span>
                    <span className="text-xs" style={{ color: '#606070' }}>{game.home.record}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <span style={{ color: '#808090' }}>ATS: <span style={{ color: '#A0A0B0' }}>{game.home.ats}</span></span>
                    <span className="font-mono font-bold px-2 py-0.5 rounded"
                          style={{ 
                            background: game.moneyline.home > 0 ? 'rgba(0,255,136,0.1)' : 'rgba(255,68,85,0.1)',
                            color: game.moneyline.home > 0 ? '#00FF88' : '#FF4455'
                          }}>
                      {game.moneyline.home > 0 ? '+' : ''}{game.moneyline.home}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Spread & Total Row */}
              <div className="flex items-center justify-between mt-3 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <div className="flex gap-3">
                  <span className="text-xs px-2 py-1 rounded" style={{ background: 'rgba(0,168,255,0.1)', color: '#00A8FF' }}>
                    {game.spread > 0 ? '+' : ''}{game.spread}
                  </span>
                  <span className="text-xs px-2 py-1 rounded" style={{ background: 'rgba(255,255,255,0.05)', color: '#A0A0B0' }}>
                    O/U {game.total}
                  </span>
                </div>
                <span className="text-xs font-bold" style={{ color: '#FF6B00' }}>{game.aiPick}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* LEADERBOARD - THE VIRAL FEATURE */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="rounded-2xl p-6" style={{ 
          background: 'linear-gradient(135deg, #0c0c14 0%, #101018 100%)',
          border: '1px solid rgba(255,215,0,0.2)'
        }}>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg" style={{ background: 'rgba(255,215,0,0.15)' }}>
                <Trophy style={{ color: '#FFD700', width: '24px', height: '24px' }} />
              </div>
              <div>
                <h2 className="text-xl font-bold" style={{ color: '#FFF' }}>Top Cappers Leaderboard</h2>
                <p className="text-xs" style={{ color: '#808090' }}>Track the best handicappers • January 2026</p>
              </div>
            </div>
            <Link href="/leaderboard" className="flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-all hover:scale-105"
                  style={{ background: 'rgba(255,215,0,0.15)', color: '#FFD700', border: '1px solid rgba(255,215,0,0.3)' }}>
              <Users style={{ width: '16px', height: '16px' }} />
              Full Rankings
            </Link>
          </div>
          
          {/* Leaderboard Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <th className="text-left py-3 px-2 text-xs font-semibold" style={{ color: '#606070' }}>RANK</th>
                  <th className="text-left py-3 px-2 text-xs font-semibold" style={{ color: '#606070' }}>CAPPER</th>
                  <th className="text-center py-3 px-2 text-xs font-semibold" style={{ color: '#606070' }}>RECORD</th>
                  <th className="text-center py-3 px-2 text-xs font-semibold" style={{ color: '#606070' }}>WIN %</th>
                  <th className="text-center py-3 px-2 text-xs font-semibold" style={{ color: '#606070' }}>UNITS</th>
                  <th className="text-center py-3 px-2 text-xs font-semibold" style={{ color: '#606070' }}>STREAK</th>
                </tr>
              </thead>
              <tbody>
                {topCappers.map((capper) => (
                  <tr key={capper.rank} className="transition-all hover:bg-white/[0.02]" 
                      style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                    <td className="py-3 px-2">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold"
                           style={{ 
                             background: capper.rank === 1 ? 'rgba(255,215,0,0.2)' : 
                                        capper.rank === 2 ? 'rgba(192,192,192,0.2)' : 
                                        capper.rank === 3 ? 'rgba(205,127,50,0.2)' : 'rgba(255,255,255,0.05)',
                             color: capper.rank === 1 ? '#FFD700' : 
                                    capper.rank === 2 ? '#C0C0C0' : 
                                    capper.rank === 3 ? '#CD7F32' : '#808090'
                           }}>
                        {capper.rank === 1 ? '🥇' : capper.rank === 2 ? '🥈' : capper.rank === 3 ? '🥉' : capper.rank}
                      </div>
                    </td>
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{capper.avatar}</span>
                        <div>
                          <div className="font-semibold" style={{ color: '#FFF' }}>{capper.name}</div>
                          <div className="text-xs" style={{ color: '#606070' }}>{capper.sport}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-2 text-center font-mono font-semibold" style={{ color: '#A0A0B0' }}>
                      {capper.record}
                    </td>
                    <td className="py-3 px-2 text-center">
                      <span className="font-bold" style={{ color: capper.winPct >= 60 ? '#00FF88' : capper.winPct >= 55 ? '#FFD700' : '#A0A0B0' }}>
                        {capper.winPct}%
                      </span>
                    </td>
                    <td className="py-3 px-2 text-center">
                      <span className="font-bold" style={{ color: capper.units > 0 ? '#00FF88' : '#FF4455' }}>
                        {capper.units > 0 ? '+' : ''}{capper.units}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-center">
                      <span className="px-2 py-1 rounded text-xs font-bold"
                            style={{ 
                              background: capper.streak.startsWith('W') ? 'rgba(0,255,136,0.15)' : 'rgba(255,68,85,0.15)',
                              color: capper.streak.startsWith('W') ? '#00FF88' : '#FF4455'
                            }}>
                        {capper.streak}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* CTA to join */}
          <div className="mt-6 pt-4 flex items-center justify-between" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <span className="text-sm" style={{ color: '#808090' }}>Track your picks and compete for the top spot</span>
            <Link href="/leaderboard" className="text-sm font-bold" style={{ color: '#FFD700' }}>
              Start Tracking Your Picks →
            </Link>
          </div>
        </div>
      </section>

      {/* Three Column Layout: Trends, Standings, Sidebar */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="grid lg:grid-cols-3 gap-6">
          
          {/* Hot Trends */}
          <div className="rounded-2xl p-5" style={{ background: '#0c0c14', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <BarChart3 style={{ color: '#00FF88', width: '18px', height: '18px' }} />
                <h3 className="font-bold" style={{ color: '#FFF' }}>Hot Trends</h3>
              </div>
              <Link href="/trends" className="text-xs font-semibold" style={{ color: '#00FF88' }}>View All</Link>
            </div>
            
            <div className="space-y-2 max-h-[320px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
              {hotTrends.map((trend) => (
                <Link key={trend.id} href={`/trends?sport=${trend.sport.toLowerCase()}`} 
                      className="block p-3 rounded-lg transition-all hover:bg-white/5" 
                      style={{ background: 'rgba(255,255,255,0.02)' }}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs px-1.5 py-0.5 rounded font-semibold"
                          style={{ 
                            background: trend.sport === 'NFL' ? 'rgba(255,107,0,0.15)' : 
                                       trend.sport === 'NBA' ? 'rgba(0,168,255,0.15)' : 'rgba(255,51,102,0.15)',
                            color: trend.sport === 'NFL' ? '#FF6B00' : 
                                   trend.sport === 'NBA' ? '#00A8FF' : '#FF3366'
                          }}>
                      {trend.sport}
                    </span>
                    <span className="text-lg font-black" style={{ color: '#00FF88' }}>{trend.edge}</span>
                  </div>
                  <div className="text-sm" style={{ color: '#A0A0B0' }}>{trend.trend}</div>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
                      <div className="h-full rounded-full" style={{ width: `${trend.pct}%`, background: '#00FF88' }} />
                    </div>
                    <span className="text-xs font-mono" style={{ color: '#00FF88' }}>{trend.record}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
          
          {/* League Standings - DATA DRIVEN */}
          <div className="rounded-2xl p-5" style={{ background: '#0c0c14', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Medal style={{ color: '#00A8FF', width: '18px', height: '18px' }} />
                <h3 className="font-bold" style={{ color: '#FFF' }}>Standings</h3>
              </div>
              <Link href="/stats?view=standings" className="text-xs font-semibold" style={{ color: '#00A8FF' }}>
                Full Standings
              </Link>
            </div>
            
            <div className="max-h-[320px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
              {/* NFL Standings */}
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <span>🏈</span>
                  <span className="text-xs font-semibold" style={{ color: '#FF6B00' }}>NFL LEADERS</span>
                </div>
                <div className="space-y-1">
                  {standings.NFL.map((team, i) => (
                    <Link key={team.team} href={`/nfl?team=${team.team}`}
                          className="flex items-center justify-between py-1.5 px-2 rounded transition-all hover:bg-white/10"
                          style={{ background: i === 0 ? 'rgba(255,107,0,0.1)' : 'transparent' }}>
                      <div className="flex items-center gap-2">
                        <span className="w-4 text-xs text-center" style={{ color: '#606070' }}>{i + 1}</span>
                        <span className="font-semibold" style={{ color: '#FFF' }}>{team.team}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs">
                        <span style={{ color: '#A0A0B0' }}>{team.record}</span>
                        <span style={{ color: '#606070' }}>{team.pf}-{team.pa}</span>
                        <ChevronRight style={{ width: '12px', height: '12px', color: '#606070' }} />
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
              
              {/* NBA Standings */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span>🏀</span>
                  <span className="text-xs font-semibold" style={{ color: '#00A8FF' }}>NBA LEADERS</span>
                </div>
                <div className="space-y-1">
                  {standings.NBA.map((team, i) => (
                    <Link key={team.team} href={`/nba?team=${team.team}`}
                          className="flex items-center justify-between py-1.5 px-2 rounded transition-all hover:bg-white/10"
                          style={{ background: i === 0 ? 'rgba(0,168,255,0.1)' : 'transparent' }}>
                      <div className="flex items-center gap-2">
                        <span className="w-4 text-xs text-center" style={{ color: '#606070' }}>{i + 1}</span>
                        <span className="font-semibold" style={{ color: '#FFF' }}>{team.team}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs">
                        <span style={{ color: '#A0A0B0' }}>{team.record}</span>
                        <span style={{ color: '#606070' }}>{team.pf.toFixed(1)}</span>
                        <ChevronRight style={{ width: '12px', height: '12px', color: '#606070' }} />
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
          
          {/* Sidebar - Injuries & Quick Links */}
          <div className="space-y-4">
            {/* Key Injuries */}
            <div className="rounded-2xl p-5" style={{ background: '#0c0c14', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <AlertCircle style={{ color: '#FF4455', width: '18px', height: '18px' }} />
                  <h3 className="font-bold" style={{ color: '#FFF' }}>Key Injuries</h3>
                </div>
                <Link href="/stats?view=injuries" className="text-xs font-semibold" style={{ color: '#FF4455' }}>
                  All Injuries
                </Link>
              </div>
              
              <div className="space-y-2 max-h-[200px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
                {injuries.map((injury, i) => (
                  <div key={i} className="flex items-center justify-between py-2 hover:bg-white/5 transition-colors">
                    <div>
                      <div className="font-semibold text-sm" style={{ color: '#FFF' }}>{injury.player}</div>
                      <div className="text-xs" style={{ color: '#606070' }}>{injury.team} • {injury.injury}</div>
                    </div>
                    <span className="w-6 h-6 rounded flex items-center justify-center text-xs font-bold"
                          style={{ 
                            background: injury.status === 'O' ? 'rgba(255,68,85,0.2)' : 'rgba(255,107,0,0.2)',
                            color: injury.status === 'O' ? '#FF4455' : '#FF6B00'
                          }}>
                      {injury.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Quick Links */}
            <div className="rounded-2xl p-5" style={{ background: '#0c0c14', border: '1px solid rgba(255,255,255,0.06)' }}>
              <h3 className="font-bold mb-4" style={{ color: '#FFF' }}>Quick Links</h3>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: '🏈 NFL', href: '/nfl' },
                  { label: '🏀 NBA', href: '/nba' },
                  { label: '🏒 NHL', href: '/nhl' },
                  { label: '⚾ MLB', href: '/mlb' },
                  { label: '📊 Stats', href: '/stats' },
                  { label: '📈 Markets', href: '/markets' },
                  { label: '� Experts', href: '/leaderboard' },
                  { label: '🔥 Trends', href: '/trends' },
                ].map((link) => (
                  <Link key={link.href} href={link.href}
                        className="p-3 rounded-lg text-center text-sm font-semibold transition-all hover:scale-105 hover:bg-white/10"
                        style={{ background: 'rgba(255,255,255,0.03)', color: '#FFF' }}>
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
