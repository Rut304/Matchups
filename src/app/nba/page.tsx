'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { 
  TrendingUp,
  TrendingDown,
  Target,
  BarChart3,
  Calendar,
  Flame,
  Snowflake,
  ChevronDown,
  ChevronRight,
  Filter,
  Clock,
  Users,
  Trophy,
  Activity,
  Zap,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  Home,
  Plane,
  DollarSign,
  Info,
  Search,
  Star
} from 'lucide-react'
import { getNBATeams, getTeamByAbbreviation, type TeamAnalytics } from '@/lib/analytics-data'

type TimeFrame = 'season' | 'last30' | 'last14' | 'last7'
type BetType = 'ats' | 'ou' | 'ml'
type Situation = 'all' | 'home' | 'away' | 'favorite' | 'underdog' | 'b2b'

// Helper functions to calculate percentages
const calcWinPct = (wins: number, losses: number): number => {
  const total = wins + losses
  return total > 0 ? (wins / total) * 100 : 0
}

const calcOverPct = (overs: number, unders: number): number => {
  const total = overs + unders
  return total > 0 ? (overs / total) * 100 : 0
}

// Helper to get team emoji based on abbreviation
const getTeamEmoji = (abbr: string): string => {
  const emojis: Record<string, string> = {
    LAL: '💜', BOS: '☘️', GSW: '💛', MIA: '🔥', PHI: '🔔', DEN: '⛰️',
    MIL: '🦌', PHX: '☀️', DAL: '🐎', MEM: '🐻', CLE: '🍷', NYK: '🗽',
    ATL: '🦅', CHI: '🐂', SAC: '👑', OKC: '⚡', MIN: '🐺', NOP: '⚜️',
    LAC: '⛵', TOR: '🦖', BKN: '🏀', IND: '🏎️', ORL: '✨', CHA: '🐝',
    WAS: '🧙', DET: '🔧', HOU: '🚀', SAS: '⭐', POR: '🌲', UTA: '🎵'
  }
  return emojis[abbr] || '🏀'
}

export default function NBAAnalyticsPage() {
  const [timeframe, setTimeframe] = useState<TimeFrame>('season')
  const [betType, setBetType] = useState<BetType>('ats')
  const [situation, setSituation] = useState<Situation>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'winPct' | 'profit' | 'name'>('winPct')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [selectedTeam, setSelectedTeam] = useState<TeamAnalytics | null>(null)
  const [activeView, setActiveView] = useState<'teams' | 'games' | 'props'>('teams')
  
  const allTeams = getNBATeams()
  
  // Filter and sort teams
  const filteredTeams = useMemo(() => {
    let teams = [...allTeams]
    
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      teams = teams.filter(t => 
        t.name.toLowerCase().includes(q) || 
        t.city.toLowerCase().includes(q) ||
        t.abbr.toLowerCase().includes(q)
      )
    }
    
    teams.sort((a, b) => {
      let aVal: number | string = 0
      let bVal: number | string = 0
      
      if (sortBy === 'winPct') {
        if (betType === 'ats') {
          const getATSPct = (t: TeamAnalytics) => {
            if (situation === 'home') return calcWinPct(t.ats.home.wins, t.ats.home.losses)
            if (situation === 'away') return calcWinPct(t.ats.away.wins, t.ats.away.losses)
            if (situation === 'favorite') return calcWinPct(t.ats.asFavorite.wins, t.ats.asFavorite.losses)
            if (situation === 'underdog') return calcWinPct(t.ats.asUnderdog.wins, t.ats.asUnderdog.losses)
            return calcWinPct(t.ats.overall.wins, t.ats.overall.losses)
          }
          aVal = getATSPct(a)
          bVal = getATSPct(b)
        } else if (betType === 'ou') {
          aVal = calcOverPct(a.ou.overall.overs, a.ou.overall.unders)
          bVal = calcOverPct(b.ou.overall.overs, b.ou.overall.unders)
        } else {
          aVal = calcWinPct(a.ml.asFavorite.wins + a.ml.asUnderdog.wins, a.ml.asFavorite.losses + a.ml.asUnderdog.losses)
          bVal = calcWinPct(b.ml.asFavorite.wins + b.ml.asUnderdog.wins, b.ml.asFavorite.losses + b.ml.asUnderdog.losses)
        }
      } else if (sortBy === 'profit') {
        // Estimate profit based on win pct
        aVal = calcWinPct(a.ats.overall.wins, a.ats.overall.losses) - 50
        bVal = calcWinPct(b.ats.overall.wins, b.ats.overall.losses) - 50
      } else {
        aVal = a.name
        bVal = b.name
      }
      
      if (sortDir === 'asc') {
        return aVal > bVal ? 1 : -1
      }
      return aVal < bVal ? 1 : -1
    })
    
    return teams
  }, [allTeams, searchQuery, sortBy, sortDir, betType, situation])
  
  // Get top trends
  const topATSTeams = [...allTeams].sort((a, b) => 
    calcWinPct(b.ats.overall.wins, b.ats.overall.losses) - calcWinPct(a.ats.overall.wins, a.ats.overall.losses)
  ).slice(0, 3)
  const topOverTeams = [...allTeams].sort((a, b) => 
    calcOverPct(b.ou.overall.overs, b.ou.overall.unders) - calcOverPct(a.ou.overall.overs, a.ou.overall.unders)
  ).slice(0, 3)
  const hotTeams = allTeams.filter(t => t.isHot)
  const coldTeams = allTeams.filter(t => t.isCold)

  // Sample today's games
  const todaysGames = [
    {
      id: '1',
      time: '7:30 PM ET',
      away: { team: 'MIA', name: 'Heat', emoji: '🔥', spread: '+9.5', ml: '+330', record: '21-18' },
      home: { team: 'BOS', name: 'Celtics', emoji: '☘️', spread: '-9.5', ml: '-420', record: '32-10' },
      total: '218.5',
      publicSpread: 72,
      aiPick: 'MIA +9.5',
      aiConfidence: 64,
      isHot: true,
    },
    {
      id: '2',
      time: '10:00 PM ET',
      away: { team: 'OKC', name: 'Thunder', emoji: '⚡', spread: '-4.5', ml: '-195', record: '34-8' },
      home: { team: 'GSW', name: 'Warriors', emoji: '⚔️', spread: '+4.5', ml: '+165', record: '22-20' },
      total: '224.5',
      publicSpread: 65,
      aiPick: 'UNDER 224.5',
      aiConfidence: 68,
      isHot: true,
    },
    {
      id: '3',
      time: '10:30 PM ET',
      away: { team: 'PHX', name: 'Suns', emoji: '☀️', spread: '-2.5', ml: '-135', record: '24-18' },
      home: { team: 'LAL', name: 'Lakers', emoji: '💜', spread: '+2.5', ml: '+115', record: '24-17' },
      total: '228.0',
      publicSpread: 58,
      aiPick: 'LAL +2.5',
      aiConfidence: 62,
      isHot: false,
    },
  ]

  return (
    <div className="min-h-screen" style={{ background: '#050508' }}>
      {/* Hero Section */}
      <section className="relative overflow-hidden" style={{ background: 'linear-gradient(180deg, #0a0a12 0%, #050508 100%)' }}>
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full opacity-15 blur-[100px] pointer-events-none" 
               style={{ background: 'radial-gradient(circle, #FF6B00 0%, transparent 70%)' }} />
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-5xl">🏀</span>
            <div>
              <h1 className="text-4xl font-black" style={{ color: '#FFF' }}>NBA Analytics</h1>
              <p className="text-sm" style={{ color: '#808090' }}>Team trends, player props, and edge-finding data for basketball bettors</p>
            </div>
          </div>
          
          {/* View Toggle */}
          <div className="flex gap-2 mt-6 mb-4">
            {(['teams', 'games', 'props'] as const).map((view) => (
              <button
                key={view}
                onClick={() => setActiveView(view)}
                className="px-4 py-2 rounded-lg text-sm font-semibold capitalize transition-all"
                style={{
                  background: activeView === view ? 'rgba(255,107,0,0.2)' : 'rgba(255,255,255,0.05)',
                  color: activeView === view ? '#FF6B00' : '#808090',
                  border: activeView === view ? '1px solid rgba(255,107,0,0.3)' : '1px solid rgba(255,255,255,0.1)',
                }}
              >
                {view === 'teams' && '📊 Team Analytics'}
                {view === 'games' && '🎯 Today\'s Games'}
                {view === 'props' && '👤 Player Props'}
              </button>
            ))}
          </div>
          
          {/* Quick Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <QuickStat label="Best ATS" value={topATSTeams[0]?.abbr || '-'} subValue={`${topATSTeams[0] ? calcWinPct(topATSTeams[0].ats.overall.wins, topATSTeams[0].ats.overall.losses).toFixed(1) : '0'}%`} color="#00FF88" />
            <QuickStat label="Most Overs" value={topOverTeams[0]?.abbr || '-'} subValue={`${topOverTeams[0] ? calcOverPct(topOverTeams[0].ou.overall.overs, topOverTeams[0].ou.overall.unders).toFixed(1) : '0'}%`} color="#00A8FF" />
            <QuickStat label="Hot Streaks" value={`${hotTeams.length}`} subValue="teams" color="#FF6B00" />
            <QuickStat label="Cold Streaks" value={`${coldTeams.length}`} subValue="teams" color="#FF4455" />
          </div>
        </div>
      </section>
      
      {/* Main Content */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Teams View */}
        {activeView === 'teams' && (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Main Panel - Team List */}
            <div className="lg:col-span-2 space-y-6">
              {/* Filters */}
              <div className="p-4 rounded-2xl" style={{ background: '#0c0c14', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex-1 min-w-[200px] relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#606070' }} />
                    <input 
                      type="text"
                      placeholder="Search teams..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 rounded-lg text-sm"
                      style={{ background: 'rgba(255,255,255,0.05)', color: '#FFF', border: '1px solid rgba(255,255,255,0.1)' }}
                    />
                  </div>
                  
                  <div className="flex rounded-lg overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
                    {(['ats', 'ou', 'ml'] as BetType[]).map((type) => (
                      <button
                        key={type}
                        onClick={() => setBetType(type)}
                        className="px-4 py-2 text-xs font-bold uppercase"
                        style={{
                          background: betType === type ? 'rgba(255,107,0,0.3)' : 'transparent',
                          color: betType === type ? '#FF6B00' : '#808090',
                        }}
                      >
                        {type === 'ats' ? 'ATS' : type === 'ou' ? 'O/U' : 'ML'}
                      </button>
                    ))}
                  </div>
                  
                  <select 
                    value={situation}
                    onChange={(e) => setSituation(e.target.value as Situation)}
                    className="px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer"
                    style={{ background: 'rgba(255,255,255,0.05)', color: '#FFF', border: '1px solid rgba(255,255,255,0.1)' }}
                  >
                    <option value="all">All Games</option>
                    <option value="home">Home Only</option>
                    <option value="away">Away Only</option>
                    <option value="favorite">As Favorite</option>
                    <option value="underdog">As Underdog</option>
                    <option value="b2b">Back-to-Back</option>
                  </select>
                </div>
              </div>
              
              {/* Team Table */}
              <div className="rounded-2xl overflow-hidden" style={{ background: '#0c0c14', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                  <h2 className="font-bold text-lg" style={{ color: '#FFF' }}>
                    {betType === 'ats' ? 'Against The Spread' : betType === 'ou' ? 'Over/Under' : 'Moneyline'} Records
                  </h2>
                </div>
                
                <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.03)' }}>
                  {filteredTeams.map((team) => (
                    <TeamRow 
                      key={team.abbr} 
                      team={team} 
                      betType={betType}
                      situation={situation}
                      onClick={() => setSelectedTeam(team)}
                      isSelected={selectedTeam?.abbr === team.abbr}
                    />
                  ))}
                </div>
              </div>
            </div>
            
            {/* Side Panel */}
            <div className="space-y-6">
              {/* Hot & Cold */}
              <div className="rounded-2xl p-5" style={{ background: '#0c0c14', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="flex items-center gap-2 mb-4">
                  <Flame className="w-5 h-5" style={{ color: '#FF6B00' }} />
                  <h2 className="font-bold" style={{ color: '#FFF' }}>Hot Streaks (ATS)</h2>
                </div>
                {hotTeams.length > 0 ? (
                  <div className="space-y-2">
                    {hotTeams.map((team) => (
                      <div key={team.abbr} 
                           className="flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all hover:bg-white/[0.03]"
                           style={{ background: 'rgba(0,255,136,0.05)' }}
                           onClick={() => setSelectedTeam(team)}>
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{getTeamEmoji(team.abbr)}</span>
                          <span className="font-semibold text-sm" style={{ color: '#FFF' }}>{team.abbr}</span>
                        </div>
                        <span className="px-2 py-1 rounded text-xs font-bold" style={{ background: 'rgba(0,255,136,0.2)', color: '#00FF88' }}>
                          {team.streak}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-center py-4" style={{ color: '#606070' }}>No hot streaks right now</p>
                )}
                
                <div className="flex items-center gap-2 mt-6 mb-4">
                  <Snowflake className="w-5 h-5" style={{ color: '#00A8FF' }} />
                  <h2 className="font-bold" style={{ color: '#FFF' }}>Cold Streaks (ATS)</h2>
                </div>
                {coldTeams.length > 0 ? (
                  <div className="space-y-2">
                    {coldTeams.map((team) => (
                      <div key={team.abbr} 
                           className="flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all hover:bg-white/[0.03]"
                           style={{ background: 'rgba(255,68,85,0.05)' }}
                           onClick={() => setSelectedTeam(team)}>
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{getTeamEmoji(team.abbr)}</span>
                          <span className="font-semibold text-sm" style={{ color: '#FFF' }}>{team.abbr}</span>
                        </div>
                        <span className="px-2 py-1 rounded text-xs font-bold" style={{ background: 'rgba(255,68,85,0.2)', color: '#FF4455' }}>
                          {team.streak}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-center py-4" style={{ color: '#606070' }}>No cold streaks right now</p>
                )}
              </div>
              
              {selectedTeam && (
                <TeamDetailCard team={selectedTeam} onClose={() => setSelectedTeam(null)} sport="nba" />
              )}
              
              {/* NBA Tips */}
              <div className="rounded-2xl p-5" style={{ background: 'rgba(138,43,226,0.1)', border: '1px solid rgba(138,43,226,0.2)' }}>
                <div className="flex items-center gap-2 mb-3">
                  <Info className="w-5 h-5" style={{ color: '#9B59B6' }} />
                  <h2 className="font-bold" style={{ color: '#9B59B6' }}>NBA Edge Tips</h2>
                </div>
                <ul className="space-y-2 text-sm" style={{ color: '#E0E0E0' }}>
                  <li className="flex items-start gap-2">
                    <span style={{ color: '#00FF88' }}>•</span>
                    Back-to-back unders hit 56% - tired legs = lower scores
                  </li>
                  <li className="flex items-start gap-2">
                    <span style={{ color: '#FF6B00' }}>•</span>
                    Home underdogs cover 54% in nationally televised games
                  </li>
                  <li className="flex items-start gap-2">
                    <span style={{ color: '#00A8FF' }}>•</span>
                    Teams off 3+ day rest cover spreads at 55%
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}
        
        {/* Games View */}
        {activeView === 'games' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold" style={{ color: '#FFF' }}>Today&apos;s NBA Games</h2>
              <span className="text-sm" style={{ color: '#808090' }}>January 15, 2026 • {todaysGames.length} Games</span>
            </div>
            
            {todaysGames.map((game) => (
              <div key={game.id} className="rounded-2xl overflow-hidden" style={{ background: '#0c0c14', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="p-4">
                  {/* Time & Tags */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" style={{ color: '#808090' }} />
                      <span className="text-sm font-semibold" style={{ color: '#808090' }}>{game.time}</span>
                      {game.isHot && (
                        <span className="px-2 py-0.5 rounded text-xs font-bold flex items-center gap-1" 
                              style={{ background: 'rgba(255,107,0,0.2)', color: '#FF6B00' }}>
                          <Flame className="w-3 h-3" /> HOT
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2 py-1 rounded" style={{ background: 'rgba(0,168,255,0.2)', color: '#00A8FF' }}>
                        {game.publicSpread}% public on {game.away.team}
                      </span>
                    </div>
                  </div>
                  
                  {/* Matchup */}
                  <div className="grid grid-cols-3 gap-4 items-center">
                    {/* Away Team */}
                    <div className="text-center">
                      <span className="text-3xl">{game.away.emoji}</span>
                      <div className="font-bold mt-1" style={{ color: '#FFF' }}>{game.away.team}</div>
                      <div className="text-xs" style={{ color: '#808090' }}>{game.away.record}</div>
                      <div className="mt-2 grid grid-cols-2 gap-1">
                        <div className="p-2 rounded" style={{ background: 'rgba(255,255,255,0.05)' }}>
                          <div className="text-xs" style={{ color: '#606070' }}>Spread</div>
                          <div className="font-bold text-sm" style={{ color: '#00FF88' }}>{game.away.spread}</div>
                        </div>
                        <div className="p-2 rounded" style={{ background: 'rgba(255,255,255,0.05)' }}>
                          <div className="text-xs" style={{ color: '#606070' }}>ML</div>
                          <div className="font-bold text-sm" style={{ color: '#FFF' }}>{game.away.ml}</div>
                        </div>
                      </div>
                    </div>
                    
                    {/* VS */}
                    <div className="text-center">
                      <div className="text-2xl font-black" style={{ color: '#606070' }}>VS</div>
                      <div className="mt-2 p-2 rounded" style={{ background: 'rgba(255,255,255,0.05)' }}>
                        <div className="text-xs" style={{ color: '#606070' }}>Total</div>
                        <div className="font-bold" style={{ color: '#FFF' }}>O/U {game.total}</div>
                      </div>
                    </div>
                    
                    {/* Home Team */}
                    <div className="text-center">
                      <span className="text-3xl">{game.home.emoji}</span>
                      <div className="font-bold mt-1" style={{ color: '#FFF' }}>{game.home.team}</div>
                      <div className="text-xs" style={{ color: '#808090' }}>{game.home.record}</div>
                      <div className="mt-2 grid grid-cols-2 gap-1">
                        <div className="p-2 rounded" style={{ background: 'rgba(255,255,255,0.05)' }}>
                          <div className="text-xs" style={{ color: '#606070' }}>Spread</div>
                          <div className="font-bold text-sm" style={{ color: '#FF4455' }}>{game.home.spread}</div>
                        </div>
                        <div className="p-2 rounded" style={{ background: 'rgba(255,255,255,0.05)' }}>
                          <div className="text-xs" style={{ color: '#606070' }}>ML</div>
                          <div className="font-bold text-sm" style={{ color: '#FFF' }}>{game.home.ml}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* AI Pick */}
                  <div className="mt-4 p-3 rounded-xl flex items-center justify-between"
                       style={{ background: 'rgba(255,107,0,0.1)', border: '1px solid rgba(255,107,0,0.2)' }}>
                    <div className="flex items-center gap-2">
                      <Zap className="w-5 h-5" style={{ color: '#FF6B00' }} />
                      <span className="font-bold" style={{ color: '#FF6B00' }}>AI Pick:</span>
                      <span className="font-bold" style={{ color: '#FFF' }}>{game.aiPick}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm" style={{ color: '#808090' }}>Confidence:</span>
                      <span className="font-bold" style={{ color: game.aiConfidence >= 65 ? '#00FF88' : '#FFD700' }}>
                        {game.aiConfidence}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Props View */}
        {activeView === 'props' && (
          <div className="text-center py-16">
            <Users className="w-16 h-16 mx-auto mb-4" style={{ color: '#606070' }} />
            <h2 className="text-xl font-bold mb-2" style={{ color: '#FFF' }}>Player Props Coming Soon</h2>
            <p style={{ color: '#808090' }}>Advanced player prop analysis with hit rates and trends is in development.</p>
          </div>
        )}
      </section>
    </div>
  )
}

// Quick Stat Component
function QuickStat({ label, value, subValue, color }: { label: string; value: string; subValue: string; color: string }) {
  return (
    <div className="p-4 rounded-xl text-center" style={{ background: '#0c0c14', border: '1px solid rgba(255,255,255,0.06)' }}>
      <div className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: '#606070' }}>{label}</div>
      <div className="text-2xl font-black" style={{ color }}>{value}</div>
      <div className="text-xs" style={{ color: '#808090' }}>{subValue}</div>
    </div>
  )
}

// Team Row Component
function TeamRow({ 
  team, 
  betType, 
  situation,
  onClick,
  isSelected
}: { 
  team: TeamAnalytics
  betType: BetType
  situation: Situation
  onClick: () => void
  isSelected: boolean
}) {
  let wins = 0, losses = 0, pushes = 0, winPct = 0
  
  if (betType === 'ats') {
    const data = situation === 'home' ? team.ats.home :
                 situation === 'away' ? team.ats.away :
                 situation === 'favorite' ? team.ats.asFavorite :
                 situation === 'underdog' ? team.ats.asUnderdog :
                 team.ats.overall
    wins = data.wins
    losses = data.losses
    pushes = data.pushes
    winPct = calcWinPct(wins, losses)
  } else if (betType === 'ou') {
    wins = team.ou.overall.overs
    losses = team.ou.overall.unders
    pushes = team.ou.overall.pushes
    winPct = calcOverPct(wins, losses)
  } else {
    wins = team.ml.asFavorite.wins + team.ml.asUnderdog.wins
    losses = team.ml.asFavorite.losses + team.ml.asUnderdog.losses
    pushes = 0
    winPct = calcWinPct(wins, losses)
  }
  
  const netProfit = winPct > 50 ? (winPct - 50) * 0.2 : (winPct - 50) * 0.2
  
  return (
    <div 
      className={`p-4 flex items-center gap-4 transition-all cursor-pointer hover:bg-white/[0.02] ${isSelected ? 'bg-white/[0.04]' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-center gap-3 min-w-[180px]">
        <span className="text-2xl">{getTeamEmoji(team.abbr)}</span>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm" style={{ color: '#FFF' }}>{team.city} {team.name}</span>
            {team.isHot && <Flame className="w-4 h-4" style={{ color: '#FF6B00' }} />}
            {team.isCold && <Snowflake className="w-4 h-4" style={{ color: '#00A8FF' }} />}
          </div>
          <div className="text-xs" style={{ color: '#606070' }}>{team.conference}</div>
        </div>
      </div>
      
      <div className="flex-1 text-center">
        <div className="font-mono font-bold" style={{ color: '#FFF' }}>
          {wins}-{losses}{pushes > 0 ? `-${pushes}` : ''}
        </div>
        <div className="text-xs" style={{ color: '#606070' }}>Record</div>
      </div>
      
      <div className="flex-1 text-center">
        <div className="font-bold" style={{ color: winPct >= 55 ? '#00FF88' : winPct >= 50 ? '#FFD700' : '#FF4455' }}>
          {winPct.toFixed(1)}%
        </div>
        <div className="text-xs" style={{ color: '#606070' }}>{betType === 'ou' ? 'Over %' : 'Win %'}</div>
      </div>
      
      <div className="flex-1 text-right">
        <div className="font-bold" style={{ color: netProfit > 0 ? '#00FF88' : netProfit < 0 ? '#FF4455' : '#808090' }}>
          {netProfit > 0 ? '+' : ''}{netProfit.toFixed(1)}u
        </div>
        <div className="text-xs" style={{ color: '#606070' }}>Profit</div>
      </div>
      
      <ChevronRight className="w-5 h-5" style={{ color: '#606070' }} />
    </div>
  )
}

// Team Detail Card Component  
function TeamDetailCard({ team, onClose, sport }: { team: TeamAnalytics; onClose: () => void; sport: string }) {
  const atsOverallPct = calcWinPct(team.ats.overall.wins, team.ats.overall.losses)
  const atsHomePct = calcWinPct(team.ats.home.wins, team.ats.home.losses)
  const atsAwayPct = calcWinPct(team.ats.away.wins, team.ats.away.losses)
  const ouOverallPct = calcOverPct(team.ou.overall.overs, team.ou.overall.unders)
  
  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: '#0c0c14', border: '1px solid rgba(255,107,0,0.3)' }}>
      <div className="p-4 flex items-center justify-between" style={{ background: 'rgba(255,107,0,0.1)' }}>
        <div className="flex items-center gap-3">
          <span className="text-3xl">{getTeamEmoji(team.abbr)}</span>
          <div>
            <h3 className="font-bold" style={{ color: '#FFF' }}>{team.city} {team.name}</h3>
            <p className="text-xs" style={{ color: '#808090' }}>{team.conference}</p>
          </div>
        </div>
        <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10 transition-all">
          <ChevronDown className="w-5 h-5" style={{ color: '#808090' }} />
        </button>
      </div>
      
      <div className="p-4 space-y-4">
        <div>
          <div className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: '#FF6B00' }}>Against The Spread</div>
          <div className="grid grid-cols-2 gap-2">
            <MiniStat label="Overall" value={`${team.ats.overall.wins}-${team.ats.overall.losses}`} pct={atsOverallPct} />
            <MiniStat label="Home" value={`${team.ats.home.wins}-${team.ats.home.losses}`} pct={atsHomePct} />
            <MiniStat label="Away" value={`${team.ats.away.wins}-${team.ats.away.losses}`} pct={atsAwayPct} />
            {team.streak && (
              <div className="p-2 rounded-lg text-center" style={{ background: 'rgba(255,255,255,0.03)' }}>
                <div className="text-xs" style={{ color: '#606070' }}>Streak</div>
                <div className="font-bold" style={{ color: team.streak.startsWith('W') ? '#00FF88' : '#FF4455' }}>
                  {team.streak}
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div>
          <div className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: '#00A8FF' }}>Over/Under</div>
          <div className="grid grid-cols-2 gap-2">
            <MiniStat label="Overs" value={`${team.ou.overall.overs}-${team.ou.overall.unders}`} pct={ouOverallPct} />
            <div className="p-2 rounded-lg text-center" style={{ background: 'rgba(255,255,255,0.03)' }}>
              <div className="text-xs" style={{ color: '#606070' }}>PPG</div>
              <div className="font-bold" style={{ color: '#FFF' }}>{team.scoring.ppg.toFixed(1)}</div>
            </div>
          </div>
        </div>
        
        <Link 
          href={`/${sport}/${team.abbr.toLowerCase()}`}
          className="block w-full py-3 rounded-xl text-center text-sm font-bold transition-all hover:opacity-80"
          style={{ background: 'rgba(255,107,0,0.2)', color: '#FF6B00' }}
        >
          View Full Team Profile →
        </Link>
      </div>
    </div>
  )
}

function MiniStat({ label, value, pct }: { label: string; value: string; pct: number }) {
  return (
    <div className="p-2 rounded-lg text-center" style={{ background: 'rgba(255,255,255,0.03)' }}>
      <div className="text-xs" style={{ color: '#606070' }}>{label}</div>
      <div className="font-bold text-sm" style={{ color: '#FFF' }}>{value}</div>
      <div className="text-xs font-semibold" style={{ color: pct >= 55 ? '#00FF88' : pct >= 50 ? '#FFD700' : '#FF4455' }}>
        {pct.toFixed(1)}%
      </div>
    </div>
  )
}
