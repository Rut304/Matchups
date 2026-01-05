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
  Calendar,
  Eye,
  DollarSign,
  Shield,
  ExternalLink,
  Info
} from 'lucide-react'

// Today's biggest games - ranked by estimated betting handle
// In production, this would come from ESPN + Odds API betting percentages
const biggestGames = [
  {
    id: 'nfl-det-min-1', sport: 'NFL', sportIcon: '🏈',
    rank: 1,
    away: { abbr: 'MIN', name: 'Vikings', record: '14-3' },
    home: { abbr: 'DET', name: 'Lions', record: '15-2' },
    time: '1:00 PM ET', spread: 'DET -3.5', total: 'O/U 51.5',
    estimatedHandle: '$48M',
    betPctHome: 68,
    publicPick: 'DET -3.5',
    sharpAction: 'MIN +3.5',
    headline: 'NFC Divisional - Rematch from Week 18'
  },
  {
    id: 'nfl-kc-buf-1', sport: 'NFL', sportIcon: '🏈',
    rank: 2,
    away: { abbr: 'KC', name: 'Chiefs', record: '15-2' },
    home: { abbr: 'BUF', name: 'Bills', record: '13-4' },
    time: '4:25 PM ET', spread: 'BUF -2.5', total: 'O/U 47.5',
    estimatedHandle: '$52M',
    betPctHome: 54,
    publicPick: 'BUF -2.5',
    sharpAction: 'KC +2.5',
    headline: 'AFC Championship Preview - Mahomes vs Allen IV'
  },
  {
    id: 'nba-bos-lal-1', sport: 'NBA', sportIcon: '🏀',
    rank: 3,
    away: { abbr: 'BOS', name: 'Celtics', record: '28-9' },
    home: { abbr: 'LAL', name: 'Lakers', record: '22-15' },
    time: '8:30 PM ET', spread: 'BOS -4.5', total: 'O/U 222.5',
    estimatedHandle: '$18M',
    betPctHome: 42,
    publicPick: 'LAL +4.5',
    sharpAction: 'BOS -4.5',
    headline: 'ABC Primetime - Historic Rivalry'
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
    <div className="min-h-screen bg-[#050508]">
      {/* Hero Section - Clearer Value Prop */}
      <section className="relative overflow-hidden" style={{ background: 'linear-gradient(180deg, #0a0a12 0%, #050508 100%)' }}>
        {/* Animated gradient orbs */}
        <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full opacity-20 blur-3xl pointer-events-none bg-gradient-to-r from-orange-500 to-transparent" />
        <div className="absolute top-20 right-1/4 w-80 h-80 rounded-full opacity-15 blur-3xl pointer-events-none bg-gradient-to-r from-blue-500 to-transparent" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            {/* FREE Banner */}
            <div className="inline-flex items-center gap-3 px-6 py-2.5 rounded-full mb-6 bg-green-500/10 border-2 border-green-500/50 shadow-[0_0_30px_rgba(0,255,136,0.3)]">
              <span className="text-xl">🎉</span>
              <span className="text-green-400 font-extrabold tracking-wide">100% FREE — NO SIGN UP REQUIRED</span>
              <span className="text-xl">🎉</span>
            </div>
            
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black mb-6 text-white tracking-tight leading-tight">
              Sports Betting{' '}
              <span className="bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(255,107,0,0.5)]">
                Intelligence
              </span>
            </h1>
            
            <p className="text-xl mb-8 text-gray-400 max-w-2xl mx-auto">
              Real-time odds, betting trends, expert picks, and market analysis. 
              Everything you need to make informed decisions — all in one place.
            </p>

            {/* What We Offer - Clear Value Props */}
            <div className="grid sm:grid-cols-3 gap-4 max-w-3xl mx-auto mb-10">
              <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                <BarChart3 className="w-6 h-6 text-blue-400 mx-auto mb-2" />
                <div className="font-bold text-white text-sm mb-1">Live Odds & Lines</div>
                <p className="text-xs text-gray-500">Compare lines across all major sportsbooks in real-time</p>
              </div>
              <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                <TrendingUp className="w-6 h-6 text-green-400 mx-auto mb-2" />
                <div className="font-bold text-white text-sm mb-1">Betting Trends</div>
                <p className="text-xs text-gray-500">ATS records, public betting %, and sharp money indicators</p>
              </div>
              <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                <Trophy className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
                <div className="font-bold text-white text-sm mb-1">Expert Tracker</div>
                <p className="text-xs text-gray-500">See how the "experts" actually perform — receipts included</p>
              </div>
            </div>
            
            {/* Primary CTAs - Much Clearer */}
            <div className="flex flex-wrap justify-center gap-4 mb-6">
              <Link href="/scores"
                    className="inline-flex items-center gap-3 px-8 py-4 rounded-xl font-bold text-lg transition-all hover:scale-105 bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-[0_0_30px_rgba(59,130,246,0.4)]">
                <Clock className="w-5 h-5" />
                Today&apos;s Scores & Odds
              </Link>
              <Link href="/leaderboard"
                    className="inline-flex items-center gap-3 px-8 py-4 rounded-xl font-bold text-lg transition-all hover:scale-105 bg-gradient-to-r from-yellow-500 to-orange-500 text-black shadow-[0_0_30px_rgba(255,215,0,0.4)]">
                <Trophy className="w-5 h-5" />
                Expert Tracker 🧾
              </Link>
            </div>
            
            {/* Secondary CTAs with descriptions */}
            <div className="flex flex-wrap justify-center gap-3">
              <Link href="/sus"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-sm transition-all hover:scale-105 bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20">
                <AlertCircle className="w-4 h-4" />
                Sus Plays
                <span className="text-xs text-red-400/70 hidden sm:inline">— Experts fading the public</span>
              </Link>
              <Link href="/trends"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-sm transition-all hover:scale-105 bg-green-500/10 border border-green-500/30 text-green-400 hover:bg-green-500/20">
                <TrendingUp className="w-4 h-4" />
                Hot Trends
                <span className="text-xs text-green-400/70 hidden sm:inline">— Systems beating the market</span>
              </Link>
              <Link href="/markets/edge"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-sm transition-all hover:scale-105 bg-purple-500/10 border border-purple-500/30 text-purple-400 hover:bg-purple-500/20">
                <Target className="w-4 h-4" />
                The Edge
                <span className="text-xs text-purple-400/70 hidden sm:inline">— Prediction market analytics</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* BIGGEST GAMES TODAY - Real value */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-orange-500/10 border border-orange-500/20">
              <Flame className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Biggest Games Today</h2>
              <p className="text-xs text-gray-500">Ranked by estimated betting handle</p>
            </div>
          </div>
          <Link href="/scores" className="flex items-center gap-1 text-sm font-semibold text-orange-400 hover:text-orange-300">
            All Games <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid lg:grid-cols-3 gap-4">
          {biggestGames.map((game) => (
            <Link key={game.id} href={`/game/${game.id}`}
                  className="block rounded-2xl p-5 transition-all hover:scale-[1.02] bg-[#0c0c14] border border-white/10 hover:border-orange-500/30">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-orange-500/20 flex items-center justify-center text-xs font-bold text-orange-400">
                    {game.rank}
                  </span>
                  <span className="text-lg">{game.sportIcon}</span>
                  <span className="text-xs text-gray-500">{game.time}</span>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-500">Est. Handle</div>
                  <div className="font-bold text-green-400">{game.estimatedHandle}</div>
                </div>
              </div>
              
              {/* Matchup */}
              <div className="flex items-center justify-between mb-3">
                <div className="text-center flex-1">
                  <div className="text-2xl font-black text-white">{game.away.abbr}</div>
                  <div className="text-xs text-gray-500">{game.away.record}</div>
                </div>
                <div className="px-4 text-gray-600 text-sm">@</div>
                <div className="text-center flex-1">
                  <div className="text-2xl font-black text-white">{game.home.abbr}</div>
                  <div className="text-xs text-gray-500">{game.home.record}</div>
                </div>
              </div>
              
              {/* Lines */}
              <div className="flex items-center justify-center gap-4 mb-3 text-sm">
                <span className="px-3 py-1 rounded-lg bg-white/5 text-gray-300">{game.spread}</span>
                <span className="px-3 py-1 rounded-lg bg-white/5 text-gray-300">{game.total}</span>
              </div>
              
              {/* Public vs Sharp */}
              <div className="p-3 rounded-xl bg-white/5 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500 flex items-center gap-1">
                    <Users className="w-3 h-3" /> Public ({game.betPctHome}%)
                  </span>
                  <span className="text-blue-400 font-semibold">{game.publicPick}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500 flex items-center gap-1">
                    <Target className="w-3 h-3" /> Sharp Money
                  </span>
                  <span className="text-green-400 font-semibold">{game.sharpAction}</span>
                </div>
              </div>
              
              {/* Headline */}
              <div className="mt-3 text-xs text-gray-500 text-center">{game.headline}</div>
            </Link>
          ))}
        </div>
        
        {/* Data source note */}
        <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-600">
          <Info className="w-3 h-3" />
          <span>Handle estimates based on market volume data. Public % from betting consensus.</span>
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
                <h2 className="text-xl font-bold" style={{ color: '#FFF' }}>Expert Tracker</h2>
                <p className="text-xs" style={{ color: '#808090' }}>How the "experts" are actually doing • Receipts don't lie</p>
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
            <span className="text-sm" style={{ color: '#808090' }}>No more hiding — every pick is tracked</span>
            <Link href="/leaderboard" className="text-sm font-bold" style={{ color: '#FFD700' }}>
              Check the Receipts →
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
