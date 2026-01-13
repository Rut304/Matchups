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
  Target,
} from 'lucide-react'
import { getGames, getNews, type LiveGame } from '@/lib/api/live-sports'

// AP Top 25 Men's Basketball
const top25 = [
  { rank: 1, team: 'Auburn', record: '16-1', conf: 'SEC', change: 0 },
  { rank: 2, team: 'Duke', record: '15-2', conf: 'ACC', change: 1 },
  { rank: 3, team: 'Iowa State', record: '15-2', conf: 'Big 12', change: -1 },
  { rank: 4, team: 'Alabama', record: '14-3', conf: 'SEC', change: 2 },
  { rank: 5, team: 'Florida', record: '15-2', conf: 'SEC', change: 0 },
  { rank: 6, team: 'Tennessee', record: '15-2', conf: 'SEC', change: 3 },
  { rank: 7, team: 'Houston', record: '13-4', conf: 'Big 12', change: -2 },
  { rank: 8, team: 'Michigan State', record: '14-3', conf: 'Big Ten', change: 1 },
  { rank: 9, team: 'Kansas', record: '13-4', conf: 'Big 12', change: -1 },
  { rank: 10, team: 'Marquette', record: '14-3', conf: 'Big East', change: 0 },
]

// Conference standings
const conferences = [
  { name: 'SEC', teams: 16, avgRank: 4.2, tourney: 7, color: '#FF6B00' },
  { name: 'Big 12', teams: 16, avgRank: 5.8, tourney: 6, color: '#00A8FF' },
  { name: 'Big Ten', teams: 18, avgRank: 6.1, tourney: 6, color: '#00FF88' },
  { name: 'ACC', teams: 18, avgRank: 7.4, tourney: 5, color: '#FFD700' },
  { name: 'Big East', teams: 11, avgRank: 8.2, tourney: 5, color: '#FF3366' },
]

// Player of the Year Watch
const poyWatch = [
  { name: 'Cooper Flagg', team: 'Duke', pos: 'F', ppg: 18.6, rpg: 8.4, odds: '+150' },
  { name: 'Johni Broome', team: 'Auburn', pos: 'C', ppg: 17.2, rpg: 10.8, odds: '+200' },
  { name: 'Dylan Harper', team: 'Rutgers', pos: 'G', ppg: 21.3, rpg: 5.2, odds: '+400' },
  { name: 'Ace Bailey', team: 'Rutgers', pos: 'F', ppg: 18.1, rpg: 6.7, odds: '+600' },
]

// Bracketology preview
const bracketPreview = [
  { seed: '1', teams: ['Auburn', 'Duke', 'Iowa State', 'Alabama'] },
  { seed: '2', teams: ['Florida', 'Tennessee', 'Houston', 'Michigan State'] },
  { seed: '3', teams: ['Kansas', 'Marquette', 'Kentucky', 'Oregon'] },
  { seed: '4', teams: ['UConn', 'Purdue', 'St. Johns', 'Texas A&M'] },
]

export default async function NCAABPage() {
  // Fetch live data from ESPN
  const [games, news] = await Promise.all([
    getGames('ncaab'),
    getNews('ncaab', 5),
  ])
  
  const liveGames = games.filter(g => g.status === 'in_progress')
  
  return (
    <div className="min-h-screen" style={{ background: '#050508' }}>
      {/* Hero Section */}
      <section className="relative overflow-hidden" style={{ background: 'linear-gradient(180deg, #0a0a12 0%, #050508 100%)' }}>
        <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full opacity-20 blur-3xl pointer-events-none" 
             style={{ background: 'radial-gradient(circle, #FF6B00 0%, transparent 70%)' }} />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center gap-4 mb-6">
            <span className="text-5xl">🏀</span>
            <div>
              <h1 className="text-4xl font-black" style={{ color: '#FFF' }}>
                Men&apos;s College Basketball
              </h1>
              <p className="text-lg" style={{ color: '#808090' }}>
                NCAAM 2025-26 Season • Road to March Madness
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
              <div className="text-2xl font-black" style={{ color: '#00A8FF' }}>68</div>
              <div className="text-xs uppercase tracking-wider" style={{ color: '#808090' }}>Tournament Teams</div>
            </div>
            <div className="p-4 rounded-xl text-center" style={{ background: 'rgba(255,51,102,0.1)', border: '1px solid rgba(255,51,102,0.2)' }}>
              <div className="text-2xl font-black" style={{ color: '#FF3366' }}>47</div>
              <div className="text-xs uppercase tracking-wider" style={{ color: '#808090' }}>Days to March</div>
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
                  {games.slice(0, 8).map((game, idx) => (
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

            {/* Bracketology Preview */}
            <div className="rounded-2xl p-6" style={{ background: '#0c0c14', border: '1px solid rgba(255,107,0,0.2)' }}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Target style={{ color: '#FF6B00', width: '20px', height: '20px' }} />
                  <h2 className="text-xl font-bold" style={{ color: '#FFF' }}>Bracketology Preview</h2>
                </div>
                <span className="text-xs" style={{ color: '#808090' }}>Updated Today</span>
              </div>
              
              <div className="space-y-3">
                {bracketPreview.map((line) => (
                  <div key={line.seed} className="flex items-center gap-4 p-3 rounded-lg"
                       style={{ background: 'rgba(255,107,0,0.05)' }}>
                    <span className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm"
                          style={{ background: 'rgba(255,107,0,0.2)', color: '#FF6B00' }}>
                      {line.seed}
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {line.teams.map((team) => (
                        <span key={team} className="text-sm px-2 py-1 rounded"
                              style={{ background: 'rgba(255,255,255,0.05)', color: '#FFF' }}>
                          {team}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Sidebar */}
          <div className="space-y-6">
            {/* Player of the Year Watch */}
            <div className="rounded-2xl p-6" style={{ background: '#0c0c14', border: '1px solid rgba(255,215,0,0.2)' }}>
              <div className="flex items-center gap-2 mb-4">
                <Star style={{ color: '#FFD700', width: '20px', height: '20px' }} />
                <h3 className="font-bold" style={{ color: '#FFF' }}>Player of the Year</h3>
              </div>
              
              <div className="space-y-3">
                {poyWatch.map((player, idx) => (
                  <div key={idx} className="p-3 rounded-lg" style={{ background: 'rgba(255,215,0,0.05)' }}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-sm" style={{ color: '#FFF' }}>{player.name}</span>
                      <span className="text-xs font-bold px-2 py-0.5 rounded" 
                            style={{ background: 'rgba(0,255,136,0.1)', color: '#00FF88' }}>
                        {player.odds}
                      </span>
                    </div>
                    <div className="text-xs" style={{ color: '#808090' }}>
                      {player.team} • {player.pos} • {player.ppg} PPG • {player.rpg} RPG
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
                {conferences.map((conf, idx) => (
                  <div key={conf.name} className="flex items-center justify-between p-2 rounded-lg"
                       style={{ background: 'rgba(255,255,255,0.02)' }}>
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded flex items-center justify-center text-xs font-bold"
                            style={{ background: `${conf.color}20`, color: conf.color }}>
                        {idx + 1}
                      </span>
                      <span className="font-semibold text-sm" style={{ color: '#FFF' }}>{conf.name}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-mono" style={{ color: '#A0A0B0' }}>
                        {conf.teams} teams
                      </div>
                      <div className="text-xs" style={{ color: '#606070' }}>
                        ~{conf.tourney} bids
                      </div>
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
                  { label: '🏆 Bracket', href: '#' },
                  { label: '📊 Stats', href: '#' },
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
    <Link href={`/game/${game.id}?sport=ncaab`} 
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
              {game.period ? `${game.period}H` : 'LIVE'} {game.clock}
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
            {game.awayTeam.record && (
              <span className="text-xs" style={{ color: '#606070' }}>{game.awayTeam.record}</span>
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
            {game.homeTeam.record && (
              <span className="text-xs" style={{ color: '#606070' }}>{game.homeTeam.record}</span>
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
