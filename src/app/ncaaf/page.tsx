import Link from 'next/link'
import {
  TrendingUp,
  Trophy,
  Clock,
  Calendar,
  ChevronRight,
  BarChart3,
  Flame,
  Users,
  Activity,
  Star,
} from 'lucide-react'
import { getGames, getAllStandings, getNews, type LiveGame, type Standing } from '@/lib/api/live-sports'

// NCAA Conference Rankings
const conferences = [
  { name: 'SEC', rank: 1, record: '67-23', bowl: '8-2', color: '#FF6B00' },
  { name: 'Big Ten', rank: 2, record: '61-27', bowl: '6-4', color: '#00A8FF' },
  { name: 'Big 12', rank: 3, record: '54-30', bowl: '5-3', color: '#00FF88' },
  { name: 'ACC', rank: 4, record: '49-35', bowl: '4-4', color: '#FFD700' },
  { name: 'Pac-12', rank: 5, record: '12-8', bowl: '1-1', color: '#FF3366' },
]

// AP Top 25 mock data (would come from API)
const top25 = [
  { rank: 1, team: 'Ohio State', record: '13-1', conf: 'Big Ten', change: 0 },
  { rank: 2, team: 'Texas', record: '13-2', conf: 'SEC', change: 1 },
  { rank: 3, team: 'Penn State', record: '13-2', conf: 'Big Ten', change: -1 },
  { rank: 4, team: 'Notre Dame', record: '12-1', conf: 'Ind', change: 0 },
  { rank: 5, team: 'Georgia', record: '11-2', conf: 'SEC', change: 2 },
  { rank: 6, team: 'Oregon', record: '12-2', conf: 'Big Ten', change: -1 },
  { rank: 7, team: 'Tennessee', record: '10-3', conf: 'SEC', change: 3 },
  { rank: 8, team: 'Indiana', record: '11-2', conf: 'Big Ten', change: -2 },
  { rank: 9, team: 'Boise State', record: '12-2', conf: 'MWC', change: 1 },
  { rank: 10, team: 'SMU', record: '11-3', conf: 'ACC', change: -1 },
]

// Heisman Watch
const heismanWatch = [
  { name: 'Ashton Jeanty', team: 'Boise State', pos: 'RB', yards: 2601, td: 29, odds: '-150' },
  { name: 'Travis Hunter', team: 'Colorado', pos: 'WR/CB', yards: 1258, td: 15, odds: '+200' },
  { name: 'Cam Ward', team: 'Miami', pos: 'QB', yards: 4313, td: 39, odds: '+500' },
  { name: 'Dillon Gabriel', team: 'Oregon', pos: 'QB', yards: 3558, td: 28, odds: '+1200' },
]

export default async function NCAAFPage() {
  // Fetch live data from ESPN
  const [games, news] = await Promise.all([
    getGames('ncaaf'),
    getNews('ncaaf', 5),
  ])
  
  const liveGames = games.filter(g => g.status === 'in_progress')
  const upcomingGames = games.filter(g => g.status === 'scheduled').slice(0, 8)
  
  return (
    <div className="min-h-screen" style={{ background: '#050508' }}>
      {/* Hero Section */}
      <section className="relative overflow-hidden" style={{ background: 'linear-gradient(180deg, #0a0a12 0%, #050508 100%)' }}>
        <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full opacity-20 blur-3xl pointer-events-none" 
             style={{ background: 'radial-gradient(circle, #FF6B00 0%, transparent 70%)' }} />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center gap-4 mb-6">
            <span className="text-5xl">🏈</span>
            <div>
              <h1 className="text-4xl font-black" style={{ color: '#FFF' }}>
                College Football
              </h1>
              <p className="text-lg" style={{ color: '#808090' }}>
                NCAAF 2025-26 Season • Bowl Games & CFP
              </p>
            </div>
          </div>
          
          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl text-center" style={{ background: 'rgba(255,107,0,0.1)', border: '1px solid rgba(255,107,0,0.2)' }}>
              <div className="text-2xl font-black" style={{ color: '#FF6B00' }}>{games.length}</div>
              <div className="text-xs uppercase tracking-wider" style={{ color: '#808090' }}>Games Today</div>
            </div>
            <div className="p-4 rounded-xl text-center" style={{ background: 'rgba(0,255,136,0.1)', border: '1px solid rgba(0,255,136,0.2)' }}>
              <div className="text-2xl font-black" style={{ color: '#00FF88' }}>{liveGames.length}</div>
              <div className="text-xs uppercase tracking-wider" style={{ color: '#808090' }}>Live Now</div>
            </div>
            <div className="p-4 rounded-xl text-center" style={{ background: 'rgba(0,168,255,0.1)', border: '1px solid rgba(0,168,255,0.2)' }}>
              <div className="text-2xl font-black" style={{ color: '#00A8FF' }}>CFP</div>
              <div className="text-xs uppercase tracking-wider" style={{ color: '#808090' }}>Championship</div>
            </div>
            <div className="p-4 rounded-xl text-center" style={{ background: 'rgba(255,51,102,0.1)', border: '1px solid rgba(255,51,102,0.2)' }}>
              <div className="text-2xl font-black" style={{ color: '#FF3366' }}>12</div>
              <div className="text-xs uppercase tracking-wider" style={{ color: '#808090' }}>Teams in CFP</div>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Today's Games */}
            <div className="rounded-2xl p-6" style={{ background: '#0c0c14', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Clock style={{ color: '#FF6B00', width: '20px', height: '20px' }} />
                  <h2 className="text-xl font-bold" style={{ color: '#FFF' }}>Today&apos;s Games</h2>
                  {liveGames.length > 0 && (
                    <span className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold animate-pulse"
                          style={{ background: 'rgba(255,68,85,0.2)', color: '#FF4455' }}>
                      <span className="w-2 h-2 rounded-full bg-red-500" /> {liveGames.length} LIVE
                    </span>
                  )}
                </div>
              </div>
              
              {games.length === 0 ? (
                <div className="text-center py-8">
                  <Activity className="w-12 h-12 mx-auto mb-4 opacity-30" style={{ color: '#808090' }} />
                  <p className="text-lg font-semibold" style={{ color: '#A0A0B0' }}>No games scheduled today</p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-3">
                  {games.slice(0, 6).map((game, idx) => (
                    <GameCard key={`${game.id}-${idx}`} game={game} />
                  ))}
                </div>
              )}
            </div>

            {/* AP Top 25 */}
            <div className="rounded-2xl p-6" style={{ background: '#0c0c14', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Trophy style={{ color: '#FFD700', width: '20px', height: '20px' }} />
                  <h2 className="text-xl font-bold" style={{ color: '#FFF' }}>AP Top 25</h2>
                </div>
              </div>
              
              <div className="space-y-2">
                {top25.map((team) => (
                  <div key={team.rank} className="flex items-center justify-between p-3 rounded-lg transition-colors hover:bg-white/[0.02]"
                       style={{ background: 'rgba(255,255,255,0.02)' }}>
                    <div className="flex items-center gap-3">
                      <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${
                        team.rank <= 4 ? 'bg-orange-500/20 text-orange-400' : 'bg-white/5 text-gray-400'
                      }`}>
                        {team.rank}
                      </span>
                      <div>
                        <span className="font-semibold" style={{ color: '#FFF' }}>{team.team}</span>
                        <span className="text-xs ml-2" style={{ color: '#606070' }}>{team.conf}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-mono" style={{ color: '#A0A0B0' }}>{team.record}</span>
                      {team.change !== 0 && (
                        <span className={`text-xs font-bold ${team.change > 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {team.change > 0 ? `↑${team.change}` : `↓${Math.abs(team.change)}`}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Sidebar */}
          <div className="space-y-6">
            {/* Heisman Watch */}
            <div className="rounded-2xl p-6" style={{ background: '#0c0c14', border: '1px solid rgba(255,215,0,0.2)' }}>
              <div className="flex items-center gap-2 mb-4">
                <Star style={{ color: '#FFD700', width: '20px', height: '20px' }} />
                <h3 className="font-bold" style={{ color: '#FFF' }}>Heisman Watch</h3>
              </div>
              
              <div className="space-y-3">
                {heismanWatch.map((player, idx) => (
                  <div key={idx} className="p-3 rounded-lg" style={{ background: 'rgba(255,215,0,0.05)' }}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-sm" style={{ color: '#FFF' }}>{player.name}</span>
                      <span className="text-xs font-bold px-2 py-0.5 rounded" 
                            style={{ background: 'rgba(0,255,136,0.1)', color: '#00FF88' }}>
                        {player.odds}
                      </span>
                    </div>
                    <div className="text-xs" style={{ color: '#808090' }}>
                      {player.team} • {player.pos} • {player.yards} yds • {player.td} TD
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Conference Rankings */}
            <div className="rounded-2xl p-6" style={{ background: '#0c0c14', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 style={{ color: '#00A8FF', width: '20px', height: '20px' }} />
                <h3 className="font-bold" style={{ color: '#FFF' }}>Conference Power Rankings</h3>
              </div>
              
              <div className="space-y-3">
                {conferences.map((conf) => (
                  <div key={conf.name} className="flex items-center justify-between p-2 rounded-lg"
                       style={{ background: 'rgba(255,255,255,0.02)' }}>
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded flex items-center justify-center text-xs font-bold"
                            style={{ background: `${conf.color}20`, color: conf.color }}>
                        {conf.rank}
                      </span>
                      <span className="font-semibold text-sm" style={{ color: '#FFF' }}>{conf.name}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-mono" style={{ color: '#A0A0B0' }}>{conf.record}</div>
                      <div className="text-xs" style={{ color: '#606070' }}>Bowl: {conf.bowl}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Links */}
            <div className="rounded-2xl p-6" style={{ background: '#0c0c14', border: '1px solid rgba(255,255,255,0.06)' }}>
              <h3 className="font-bold mb-4" style={{ color: '#FFF' }}>Quick Links</h3>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: '🏆 CFP Bracket', href: '#' },
                  { label: '📊 Team Stats', href: '#' },
                  { label: '🎯 Props', href: '/players' },
                  { label: '🔥 Trends', href: '/trends' },
                  { label: '📈 Systems', href: '/systems' },
                  { label: '👥 Leaderboard', href: '/leaderboard' },
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
      </div>
    </div>
  )
}

function GameCard({ game }: { game: LiveGame }) {
  const isLive = game.status === 'in_progress'
  const isFinal = game.status === 'final'
  
  const formatTime = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    } catch { return '' }
  }
  
  return (
    <Link href={`/game/${game.id}`} 
          className="block p-4 rounded-xl transition-all hover:scale-[1.02]"
          style={{ 
            background: 'rgba(255,255,255,0.02)',
            border: isLive ? '1px solid rgba(255,68,85,0.5)' : '1px solid rgba(255,255,255,0.04)'
          }}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold" style={{ color: isLive ? '#FF4455' : '#808090' }}>
          {isLive ? (
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              {game.period}Q {game.clock}
            </span>
          ) : isFinal ? 'FINAL' : formatTime(game.startTime)}
        </span>
        {game.broadcast && (
          <span className="text-xs" style={{ color: '#606070' }}>📺 {game.broadcast}</span>
        )}
      </div>
      
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {game.awayTeam.logo && <img src={game.awayTeam.logo} alt="" className="w-6 h-6" />}
            <span className="font-bold" style={{ color: '#FFF' }}>{game.awayTeam.abbreviation}</span>
            {game.awayTeam.seed && (
              <span className="text-xs px-1 rounded" style={{ background: 'rgba(255,107,0,0.2)', color: '#FF6B00' }}>
                #{game.awayTeam.seed}
              </span>
            )}
          </div>
          {(isLive || isFinal) && <span className="font-bold" style={{ color: '#FFF' }}>{game.awayTeam.score}</span>}
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {game.homeTeam.logo && <img src={game.homeTeam.logo} alt="" className="w-6 h-6" />}
            <span className="font-bold" style={{ color: '#FFF' }}>{game.homeTeam.abbreviation}</span>
            {game.homeTeam.seed && (
              <span className="text-xs px-1 rounded" style={{ background: 'rgba(255,107,0,0.2)', color: '#FF6B00' }}>
                #{game.homeTeam.seed}
              </span>
            )}
          </div>
          {(isLive || isFinal) && <span className="font-bold" style={{ color: '#FFF' }}>{game.homeTeam.score}</span>}
        </div>
      </div>
      
      {game.venue && (
        <div className="mt-2 text-xs text-center" style={{ color: '#606070' }}>{game.venue}</div>
      )}
    </Link>
  )
}
