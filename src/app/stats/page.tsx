'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { 
  TrendingUp, 
  Trophy, 
  Users, 
  Activity,
  ChevronDown,
  Search,
  Filter,
  ArrowUpDown,
  RefreshCw
} from 'lucide-react'

// =============================================================================
// TYPES
// =============================================================================

interface TeamStats {
  rank: number
  team: string
  teamFull: string
  logo?: string
  wins: number
  losses: number
  ties?: number
  pct: number
  streak: string
  last10: string
  conf?: string
  div?: string
  pts?: number
  gf?: number
  ga?: number
  diff?: number
  home?: string
  away?: string
}

interface PlayerStats {
  rank: number
  name: string
  team: string
  position: string
  photo?: string
  stats: Record<string, string | number>
}

type Sport = 'nfl' | 'nba' | 'nhl' | 'mlb'
type StatsView = 'standings' | 'leaders'

// =============================================================================
// EMPTY DATA - Real data should be fetched from API
// Mock data has been removed - fetch from /api/standings and /api/stats
// =============================================================================

const emptyStandings: Record<Sport, TeamStats[]> = {
  nfl: [],
  nba: [],
  nhl: [],
  mlb: [],
}

const emptyLeaders: Record<Sport, Record<string, PlayerStats[]>> = {
  nfl: {
    'Passing Yards': [],
    'Rushing Yards': [],
    'Receiving Yards': [],
  },
  nba: {
    'Points': [],
    'Rebounds': [],
    'Assists': [],
  },
  nhl: {
    'Points': [],
    'Goals': [],
    'Assists': [],
  },
  mlb: {
    'Batting Average': [],
    'Home Runs': [],
    'RBI': [],
  },
}

// =============================================================================
// SPORT TABS
// =============================================================================

const sportColors: Record<Sport, string> = {
  nfl: '#FF6B00',
  nba: '#00A8FF',
  nhl: '#FF3366',
  mlb: '#00FF88',
}

const sportNames: Record<Sport, string> = {
  nfl: 'NFL',
  nba: 'NBA',
  nhl: 'NHL',
  mlb: 'MLB',
}

// =============================================================================
// STATS PAGE CONTENT
// =============================================================================

function StatsPageContent() {
  const searchParams = useSearchParams()
  const initialSport = (searchParams.get('sport') as Sport) || 'nfl'
  const initialView = (searchParams.get('view') as StatsView) || 'standings'
  
  const [activeSport, setActiveSport] = useState<Sport>(initialSport)
  const [activeView, setActiveView] = useState<StatsView>(initialView)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<string>('rank')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [filterConf, setFilterConf] = useState<string>('all')
  const [isRefreshing, setIsRefreshing] = useState(false)
  
  // Active stat category for leaders
  const leaderCategories = Object.keys(emptyLeaders[activeSport])
  const [activeCategory, setActiveCategory] = useState(leaderCategories[0])
  
  useEffect(() => {
    setActiveCategory(Object.keys(emptyLeaders[activeSport])[0])
  }, [activeSport])
  
  const handleRefresh = async () => {
    setIsRefreshing(true)
    // Simulate API refresh
    await new Promise(resolve => setTimeout(resolve, 1000))
    setIsRefreshing(false)
  }
  
  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(column)
      setSortDir('desc')
    }
  }
  
  // Get standings data (empty - fetch from API)
  const standings = emptyStandings[activeSport]
  const filteredStandings = standings
    .filter(team => {
      if (filterConf === 'all') return true
      return team.conf === filterConf
    })
    .filter(team => {
      if (!searchQuery) return true
      return team.team.toLowerCase().includes(searchQuery.toLowerCase()) ||
             team.teamFull.toLowerCase().includes(searchQuery.toLowerCase())
    })
    .sort((a, b) => {
      type TeamKey = keyof typeof a
      const key = sortBy as TeamKey
      const aVal = a[key] ?? 0
      const bVal = b[key] ?? 0
      if (sortDir === 'asc') {
        return aVal > bVal ? 1 : -1
      }
      return aVal < bVal ? 1 : -1
    })
  
  // Get leaders data (empty - fetch from API)
  const leaders = emptyLeaders[activeSport][activeCategory] || []

  return (
    <div className="min-h-screen" style={{ background: '#08080c' }}>
      {/* Header */}
      <div className="border-b" style={{ borderColor: 'rgba(255,255,255,0.06)', background: '#0c0c14' }}>
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-black" style={{ color: '#FFF' }}>
                Stats Center
              </h1>
              <p className="text-sm mt-1" style={{ color: '#606070' }}>
                Real-time standings, leaders, and player statistics
              </p>
            </div>
            <button
              onClick={handleRefresh}
              className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all hover:bg-white/10"
              style={{ background: 'rgba(255,255,255,0.05)', color: '#A0A0B0' }}
              disabled={isRefreshing}
            >
              <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>
          
          {/* Sport Tabs */}
          <div className="flex gap-2 mb-4">
            {(Object.keys(sportColors) as Sport[]).map(sport => (
              <button
                key={sport}
                onClick={() => setActiveSport(sport)}
                className="px-6 py-2.5 rounded-lg font-bold text-sm transition-all"
                style={{
                  background: activeSport === sport ? `${sportColors[sport]}20` : 'transparent',
                  color: activeSport === sport ? sportColors[sport] : '#606070',
                  border: activeSport === sport ? `1px solid ${sportColors[sport]}40` : '1px solid transparent',
                }}
              >
                {sportNames[sport]}
              </button>
            ))}
          </div>
          
          {/* View Tabs */}
          <div className="flex gap-4">
            {[
              { key: 'standings', label: 'Standings', icon: Trophy },
              { key: 'leaders', label: 'Leaders', icon: TrendingUp },
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveView(key as StatsView)}
                className="flex items-center gap-2 px-4 py-2 transition-all"
                style={{
                  color: activeView === key ? '#FFF' : '#606070',
                  borderBottom: activeView === key ? `2px solid ${sportColors[activeSport]}` : '2px solid transparent',
                }}
              >
                <Icon size={16} />
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Filters */}
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#606070' }} />
            <input
              type="text"
              placeholder={`Search ${activeView}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg text-sm focus:outline-none"
              style={{ 
                background: 'rgba(255,255,255,0.05)', 
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#FFF',
              }}
            />
          </div>
          
          {activeView === 'standings' && (
            <div className="relative">
              <select
                value={filterConf}
                onChange={(e) => setFilterConf(e.target.value)}
                className="appearance-none px-4 py-2.5 pr-10 rounded-lg text-sm focus:outline-none cursor-pointer"
                style={{ 
                  background: 'rgba(255,255,255,0.05)', 
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#FFF',
                }}
              >
                <option value="all">All Conferences</option>
                <option value={activeSport === 'nfl' || activeSport === 'mlb' ? 'AFC' : 'East'}>
                  {activeSport === 'nfl' ? 'AFC' : activeSport === 'mlb' ? 'AL' : 'Eastern'}
                </option>
                <option value={activeSport === 'nfl' || activeSport === 'mlb' ? 'NFC' : 'West'}>
                  {activeSport === 'nfl' ? 'NFC' : activeSport === 'mlb' ? 'NL' : 'Western'}
                </option>
              </select>
              <Filter size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#606070' }} />
            </div>
          )}
          
          {activeView === 'leaders' && (
            <div className="relative">
              <select
                value={activeCategory}
                onChange={(e) => setActiveCategory(e.target.value)}
                className="appearance-none px-4 py-2.5 pr-10 rounded-lg text-sm focus:outline-none cursor-pointer"
                style={{ 
                  background: 'rgba(255,255,255,0.05)', 
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#FFF',
                }}
              >
                {leaderCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#606070' }} />
            </div>
          )}
        </div>

        {/* Standings Table */}
        {activeView === 'standings' && (
          <div className="rounded-xl overflow-hidden" style={{ background: '#0c0c14', border: '1px solid rgba(255,255,255,0.06)' }}>
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  {['Rank', 'Team', 'W', 'L', activeSport === 'nhl' ? 'OTL' : null, 'PCT', 'Streak', 'L10', 'DIFF'].filter(Boolean).map((col) => (
                    <th
                      key={col}
                      onClick={() => handleSort(col?.toLowerCase().replace(/[^a-z]/g, '') || '')}
                      className="px-4 py-3 text-left text-xs font-semibold cursor-pointer hover:bg-white/5 transition-colors"
                      style={{ color: '#606070' }}
                    >
                      <div className="flex items-center gap-1">
                        {col}
                        <ArrowUpDown size={12} />
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredStandings.map((team, idx) => (
                  <tr 
                    key={team.team} 
                    className="hover:bg-white/5 transition-colors cursor-pointer"
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}
                  >
                    <td className="px-4 py-3 text-sm" style={{ color: '#606070' }}>{idx + 1}</td>
                    <td className="px-4 py-3">
                      <Link href={`/${activeSport}?team=${team.team}`} className="flex items-center gap-3">
                        <div 
                          className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs"
                          style={{ background: `${sportColors[activeSport]}20`, color: sportColors[activeSport] }}
                        >
                          {team.team}
                        </div>
                        <div>
                          <div className="font-semibold text-sm" style={{ color: '#FFF' }}>{team.teamFull}</div>
                          <div className="text-xs" style={{ color: '#606070' }}>{team.conf} {team.div}</div>
                        </div>
                      </Link>
                    </td>
                    <td className="px-4 py-3 font-semibold" style={{ color: '#00FF88' }}>{team.wins}</td>
                    <td className="px-4 py-3 font-semibold" style={{ color: '#FF4455' }}>{team.losses}</td>
                    {activeSport === 'nhl' && <td className="px-4 py-3" style={{ color: '#A0A0B0' }}>{team.ties || 0}</td>}
                    <td className="px-4 py-3 font-mono text-sm" style={{ color: '#A0A0B0' }}>.{(team.pct * 1000).toFixed(0).padStart(3, '0')}</td>
                    <td className="px-4 py-3">
                      <span 
                        className="text-sm font-semibold"
                        style={{ color: team.streak.startsWith('W') ? '#00FF88' : '#FF4455' }}
                      >
                        {team.streak}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm" style={{ color: '#A0A0B0' }}>{team.last10}</td>
                    <td className="px-4 py-3">
                      <span 
                        className="font-semibold"
                        style={{ color: (team.diff || 0) > 0 ? '#00FF88' : (team.diff || 0) < 0 ? '#FF4455' : '#A0A0B0' }}
                      >
                        {(team.diff || 0) > 0 ? '+' : ''}{team.diff}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Leaders Grid */}
        {activeView === 'leaders' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Main Leaders Table */}
            <div className="col-span-1 lg:col-span-2 rounded-xl overflow-hidden" style={{ background: '#0c0c14', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <h2 className="text-lg font-bold" style={{ color: '#FFF' }}>{activeCategory}</h2>
              </div>
              <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.03)' }}>
                {leaders.map((player, idx) => (
                  <div 
                    key={player.name}
                    className="flex items-center gap-4 px-5 py-4 hover:bg-white/5 transition-colors cursor-pointer"
                  >
                    <span 
                      className="w-8 h-8 rounded-full flex items-center justify-center font-black text-sm"
                      style={{ 
                        background: idx < 3 ? `${sportColors[activeSport]}20` : 'rgba(255,255,255,0.05)',
                        color: idx < 3 ? sportColors[activeSport] : '#606070',
                      }}
                    >
                      {idx + 1}
                    </span>
                    
                    <div className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold" 
                      style={{ background: 'rgba(255,255,255,0.05)', color: '#FFF' }}
                    >
                      {player.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    
                    <div className="flex-1">
                      <div className="font-semibold" style={{ color: '#FFF' }}>{player.name}</div>
                      <div className="text-sm" style={{ color: '#606070' }}>{player.team} · {player.position}</div>
                    </div>
                    
                    <div className="flex items-center gap-6">
                      {Object.entries(player.stats).slice(0, 4).map(([key, val]) => (
                        <div key={key} className="text-right">
                          <div className="font-bold" style={{ color: key === Object.keys(player.stats)[0] ? sportColors[activeSport] : '#FFF' }}>
                            {typeof val === 'number' && val < 1 && val > 0 
                              ? `.${(val * 1000).toFixed(0).padStart(3, '0')}` 
                              : val}
                          </div>
                          <div className="text-xs uppercase" style={{ color: '#606070' }}>{key}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}


      </div>
    </div>
  )
}

// =============================================================================
// MAIN PAGE EXPORT
// =============================================================================

export default function StatsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#08080c' }}>
        <div className="animate-spin w-8 h-8 border-2 rounded-full" style={{ borderColor: '#FF6B00', borderTopColor: 'transparent' }} />
      </div>
    }>
      <StatsPageContent />
    </Suspense>
  )
}
