'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { 
  Search, ChevronDown, ChevronUp, TrendingUp, TrendingDown, 
  Target, Star, Shield, Activity, Flame, Snowflake,
  BarChart3, Filter
} from 'lucide-react'

// =============================================================================
// TYPES
// =============================================================================

interface GoalieStat {
  rank: number
  id: string
  name: string
  team: string
  teamFull: string
  age: number
  gp: number
  gs: number
  wins: number
  losses: number
  otl: number
  sv: number
  sa: number
  svPct: number
  gaa: number
  so: number
  toi: string
  qs: number
  qsPct: number
  rbs: number
  // Advanced
  gsaa: number // Goals Saved Above Average
  hdsv: number // High Danger Save %
  mdsv: number // Medium Danger Save %
  ldsv: number // Low Danger Save %
  // Betting
  winPct: number
  overPct: number
  propLine?: number
  propHitRate?: number
  trend: 'hot' | 'cold' | 'stable'
  streakType: 'W' | 'L'
  streakCount: number
  homeRecord: string
  awayRecord: string
}

// =============================================================================
// MOCK DATA
// =============================================================================

const goalieLeaders: GoalieStat[] = [
  {
    rank: 1, id: 'connor-hellebuyck', name: 'Connor Hellebuyck', team: 'WPG', teamFull: 'Winnipeg Jets', age: 30,
    gp: 45, gs: 44, wins: 32, losses: 8, otl: 4, sv: 1215, sa: 1298, svPct: 0.936, gaa: 2.12, so: 5, toi: '2678:42',
    qs: 34, qsPct: 77.3, rbs: 3, gsaa: 28.5, hdsv: 0.891, mdsv: 0.932, ldsv: 0.968,
    winPct: 72.7, overPct: 48, propLine: 28.5, propHitRate: 56, trend: 'hot', streakType: 'W', streakCount: 6, homeRecord: '18-3-1', awayRecord: '14-5-3'
  },
  {
    rank: 2, id: 'igor-shesterkin', name: 'Igor Shesterkin', team: 'NYR', teamFull: 'New York Rangers', age: 28,
    gp: 42, gs: 41, wins: 26, losses: 10, otl: 5, sv: 1142, sa: 1218, svPct: 0.938, gaa: 2.25, so: 4, toi: '2498:15',
    qs: 32, qsPct: 78.0, rbs: 2, gsaa: 24.2, hdsv: 0.895, mdsv: 0.935, ldsv: 0.970,
    winPct: 63.4, overPct: 52, propLine: 27.5, propHitRate: 54, trend: 'stable', streakType: 'W', streakCount: 2, homeRecord: '15-4-2', awayRecord: '11-6-3'
  },
  {
    rank: 3, id: 'thatcher-demko', name: 'Thatcher Demko', team: 'VAN', teamFull: 'Vancouver Canucks', age: 28,
    gp: 38, gs: 37, wins: 24, losses: 9, otl: 3, sv: 1045, sa: 1115, svPct: 0.937, gaa: 2.18, so: 3, toi: '2205:30',
    qs: 29, qsPct: 78.4, rbs: 2, gsaa: 21.8, hdsv: 0.888, mdsv: 0.930, ldsv: 0.965,
    winPct: 66.7, overPct: 45, propLine: 27.5, propHitRate: 58, trend: 'hot', streakType: 'W', streakCount: 4, homeRecord: '14-3-1', awayRecord: '10-6-2'
  },
  {
    rank: 4, id: 'sergei-bobrovsky', name: 'Sergei Bobrovsky', team: 'FLA', teamFull: 'Florida Panthers', age: 35,
    gp: 40, gs: 39, wins: 25, losses: 10, otl: 4, sv: 1020, sa: 1095, svPct: 0.932, gaa: 2.35, so: 3, toi: '2325:18',
    qs: 28, qsPct: 71.8, rbs: 4, gsaa: 18.5, hdsv: 0.875, mdsv: 0.925, ldsv: 0.962,
    winPct: 64.1, overPct: 55, propLine: 26.5, propHitRate: 52, trend: 'stable', streakType: 'L', streakCount: 1, homeRecord: '14-4-2', awayRecord: '11-6-2'
  },
  {
    rank: 5, id: 'jake-oettinger', name: 'Jake Oettinger', team: 'DAL', teamFull: 'Dallas Stars', age: 25,
    gp: 42, gs: 41, wins: 26, losses: 11, otl: 4, sv: 1118, sa: 1198, svPct: 0.933, gaa: 2.28, so: 4, toi: '2445:22',
    qs: 30, qsPct: 73.2, rbs: 3, gsaa: 19.2, hdsv: 0.882, mdsv: 0.928, ldsv: 0.964,
    winPct: 63.4, overPct: 50, propLine: 27.5, propHitRate: 55, trend: 'hot', streakType: 'W', streakCount: 3, homeRecord: '15-5-1', awayRecord: '11-6-3'
  },
  {
    rank: 6, id: 'andrei-vasilevskiy', name: 'Andrei Vasilevskiy', team: 'TBL', teamFull: 'Tampa Bay Lightning', age: 29,
    gp: 44, gs: 43, wins: 24, losses: 14, otl: 5, sv: 1185, sa: 1278, svPct: 0.927, gaa: 2.52, so: 2, toi: '2565:40',
    qs: 27, qsPct: 62.8, rbs: 5, gsaa: 12.8, hdsv: 0.868, mdsv: 0.920, ldsv: 0.958,
    winPct: 55.8, overPct: 58, propLine: 28.5, propHitRate: 48, trend: 'cold', streakType: 'L', streakCount: 2, homeRecord: '14-6-2', awayRecord: '10-8-3'
  },
  {
    rank: 7, id: 'juuse-saros', name: 'Juuse Saros', team: 'NSH', teamFull: 'Nashville Predators', age: 28,
    gp: 46, gs: 45, wins: 22, losses: 18, otl: 5, sv: 1298, sa: 1395, svPct: 0.930, gaa: 2.45, so: 3, toi: '2712:55',
    qs: 28, qsPct: 62.2, rbs: 6, gsaa: 15.5, hdsv: 0.872, mdsv: 0.922, ldsv: 0.960,
    winPct: 48.9, overPct: 54, propLine: 29.5, propHitRate: 51, trend: 'stable', streakType: 'W', streakCount: 1, homeRecord: '12-8-2', awayRecord: '10-10-3'
  },
  {
    rank: 8, id: 'jacob-markstrom', name: 'Jacob Markström', team: 'NJD', teamFull: 'New Jersey Devils', age: 33,
    gp: 38, gs: 37, wins: 21, losses: 12, otl: 4, sv: 985, sa: 1058, svPct: 0.931, gaa: 2.38, so: 4, toi: '2185:18',
    qs: 26, qsPct: 70.3, rbs: 3, gsaa: 14.2, hdsv: 0.878, mdsv: 0.925, ldsv: 0.962,
    winPct: 56.8, overPct: 52, propLine: 26.5, propHitRate: 53, trend: 'stable', streakType: 'W', streakCount: 2, homeRecord: '12-5-2', awayRecord: '9-7-2'
  },
  {
    rank: 9, id: 'adin-hill', name: 'Adin Hill', team: 'VGK', teamFull: 'Vegas Golden Knights', age: 27,
    gp: 35, gs: 33, wins: 22, losses: 8, otl: 3, sv: 892, sa: 958, svPct: 0.931, gaa: 2.32, so: 3, toi: '1975:42',
    qs: 24, qsPct: 72.7, rbs: 2, gsaa: 13.8, hdsv: 0.875, mdsv: 0.924, ldsv: 0.961,
    winPct: 66.7, overPct: 48, propLine: 25.5, propHitRate: 57, trend: 'hot', streakType: 'W', streakCount: 4, homeRecord: '13-3-1', awayRecord: '9-5-2'
  },
  {
    rank: 10, id: 'stuart-skinner', name: 'Stuart Skinner', team: 'EDM', teamFull: 'Edmonton Oilers', age: 25,
    gp: 42, gs: 40, wins: 24, losses: 12, otl: 5, sv: 1085, sa: 1175, svPct: 0.923, gaa: 2.65, so: 2, toi: '2398:30',
    qs: 25, qsPct: 62.5, rbs: 5, gsaa: 8.5, hdsv: 0.862, mdsv: 0.918, ldsv: 0.955,
    winPct: 58.5, overPct: 60, propLine: 27.5, propHitRate: 45, trend: 'cold', streakType: 'L', streakCount: 3, homeRecord: '14-5-2', awayRecord: '10-7-3'
  },
]

// =============================================================================
// COMPONENT
// =============================================================================

export default function NHLGoalieAnalysisPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [sortCol, setSortCol] = useState<string>('rank')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [view, setView] = useState<'standard' | 'advanced' | 'betting'>('standard')

  const filteredData = useMemo(() => {
    let data = [...goalieLeaders]
    
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      data = data.filter(g => 
        g.name.toLowerCase().includes(q) || 
        g.team.toLowerCase().includes(q) ||
        g.teamFull.toLowerCase().includes(q)
      )
    }
    
    if (sortCol !== 'rank') {
      data.sort((a, b) => {
        const aVal = (a as unknown as Record<string, unknown>)[sortCol]
        const bVal = (b as unknown as Record<string, unknown>)[sortCol]
        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return sortDir === 'asc' ? aVal - bVal : bVal - aVal
        }
        return 0
      })
    }
    
    return data
  }, [searchQuery, sortCol, sortDir])

  const handleSort = (col: string) => {
    if (sortCol === col) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    } else {
      setSortCol(col)
      setSortDir('desc')
    }
  }

  // Stats columns by view
  const getColumns = () => {
    const base = [
      { key: 'rank', label: 'RK', width: 'w-12' },
      { key: 'name', label: 'GOALIE', width: 'w-48' },
    ]
    
    if (view === 'standard') {
      return [...base,
        { key: 'gp', label: 'GP', width: 'w-12' },
        { key: 'wins', label: 'W', width: 'w-12' },
        { key: 'losses', label: 'L', width: 'w-12' },
        { key: 'otl', label: 'OTL', width: 'w-12' },
        { key: 'sv', label: 'SV', width: 'w-16' },
        { key: 'sa', label: 'SA', width: 'w-16' },
        { key: 'svPct', label: 'SV%', width: 'w-16', primary: true },
        { key: 'gaa', label: 'GAA', width: 'w-16' },
        { key: 'so', label: 'SO', width: 'w-12' },
        { key: 'qs', label: 'QS', width: 'w-12' },
        { key: 'qsPct', label: 'QS%', width: 'w-14' },
      ]
    }
    
    if (view === 'advanced') {
      return [...base,
        { key: 'gp', label: 'GP', width: 'w-12' },
        { key: 'svPct', label: 'SV%', width: 'w-16' },
        { key: 'gsaa', label: 'GSAA', width: 'w-16', primary: true },
        { key: 'hdsv', label: 'HDSV%', width: 'w-16' },
        { key: 'mdsv', label: 'MDSV%', width: 'w-16' },
        { key: 'ldsv', label: 'LDSV%', width: 'w-16' },
        { key: 'qs', label: 'QS', width: 'w-12' },
        { key: 'rbs', label: 'RBS', width: 'w-12' },
      ]
    }
    
    // Betting view
    return [...base,
      { key: 'winPct', label: 'WIN%', width: 'w-16', primary: true },
      { key: 'homeRecord', label: 'HOME', width: 'w-20' },
      { key: 'awayRecord', label: 'AWAY', width: 'w-20' },
      { key: 'overPct', label: 'OVER%', width: 'w-16' },
      { key: 'propLine', label: 'SV PROP', width: 'w-20', betting: true },
      { key: 'propHitRate', label: 'HIT%', width: 'w-16', betting: true },
    ]
  }

  const columns = getColumns()

  // Hot/Cold goalies
  const hotGoalies = filteredData.filter(g => g.trend === 'hot')
  const coldGoalies = filteredData.filter(g => g.trend === 'cold')

  return (
    <div className="min-h-screen bg-[#050508]">
      {/* Header */}
      <div className="border-b border-white/5 bg-[#0a0a12]">
        <div className="max-w-[1800px] mx-auto px-4 py-6">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-4xl">🥅</span>
            <div>
              <h1 className="text-3xl font-black text-white">NHL Goalie Analysis</h1>
              <p className="text-sm text-gray-500">Advanced goaltender stats & betting insights</p>
            </div>
          </div>

          {/* View Tabs */}
          <div className="flex flex-wrap gap-2 mt-6">
            {[
              { id: 'standard', label: 'Standard Stats', icon: BarChart3 },
              { id: 'advanced', label: 'Advanced', icon: Target },
              { id: 'betting', label: 'Betting', icon: Activity },
            ].map((v) => (
              <button
                key={v.id}
                onClick={() => { setView(v.id as typeof view); setSortCol('rank'); setSortDir('asc') }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                  view === v.id 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                }`}
              >
                <v.icon className="w-4 h-4" />
                {v.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="border-b border-white/5 bg-[#0a0a12]/50">
        <div className="max-w-[1800px] mx-auto px-4 py-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px] max-w-[300px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search goalies..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="ml-auto flex items-center gap-2">
              <Link href="/nhl" className="px-3 py-2 rounded-lg bg-white/5 text-gray-400 text-sm hover:bg-white/10 hover:text-white transition-all">
                Team Stats →
              </Link>
              <Link href="/nhl/players" className="px-3 py-2 rounded-lg bg-white/5 text-gray-400 text-sm hover:bg-white/10 hover:text-white transition-all">
                Skater Stats →
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1800px] mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Main Table */}
          <div className="lg:col-span-3">
            <div className="rounded-xl border border-white/10 overflow-hidden bg-[#0c0c14]">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      {columns.map((col) => (
                        <th
                          key={col.key}
                          onClick={() => handleSort(col.key)}
                          className={`px-3 py-3 text-left text-xs font-bold uppercase tracking-wider cursor-pointer hover:bg-white/5 transition-all ${col.width} ${
                            'betting' in col && col.betting ? 'bg-orange-500/10 text-orange-500' : 'text-gray-500'
                          } ${'primary' in col && col.primary ? 'text-white' : ''}`}
                        >
                          <div className="flex items-center gap-1">
                            {col.label}
                            {sortCol === col.key && (
                              sortDir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                            )}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredData.map((goalie) => (
                      <tr key={goalie.id} className="hover:bg-white/[0.02] transition-all cursor-pointer">
                        {columns.map((col) => {
                          const value = (goalie as unknown as Record<string, unknown>)[col.key]
                          
                          if (col.key === 'name') {
                            return (
                              <td key={col.key} className="px-3 py-3">
                                <Link href={`/nhl/goalies/${goalie.id}`} className="flex items-center gap-3 group">
                                  <div className="relative">
                                    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-sm font-bold text-white">
                                      {goalie.name.split(' ').map(n => n[0]).join('')}
                                    </div>
                                    {goalie.trend === 'hot' && (
                                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 rounded-full flex items-center justify-center">
                                        <Flame className="w-3 h-3 text-white" />
                                      </div>
                                    )}
                                    {goalie.trend === 'cold' && (
                                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                                        <Snowflake className="w-3 h-3 text-white" />
                                      </div>
                                    )}
                                  </div>
                                  <div>
                                    <div className="font-semibold text-white group-hover:text-blue-500 transition-colors">
                                      {goalie.name}
                                    </div>
                                    <div className="text-xs text-gray-500">{goalie.team} · {goalie.streakType}{goalie.streakCount}</div>
                                  </div>
                                </Link>
                              </td>
                            )
                          }
                          
                          if (col.key === 'svPct' || col.key === 'hdsv' || col.key === 'mdsv' || col.key === 'ldsv') {
                            const pct = value as number
                            return (
                              <td key={col.key} className={`px-3 py-3 font-mono ${
                                pct >= 0.930 ? 'text-green-400' : pct >= 0.910 ? 'text-yellow-400' : 'text-red-400'
                              } ${'primary' in col && col.primary ? 'font-bold' : ''}`}>
                                {pct.toFixed(3)}
                              </td>
                            )
                          }
                          
                          if (col.key === 'gaa') {
                            const gaa = value as number
                            return (
                              <td key={col.key} className={`px-3 py-3 font-mono ${
                                gaa <= 2.30 ? 'text-green-400' : gaa <= 2.70 ? 'text-yellow-400' : 'text-red-400'
                              }`}>
                                {gaa.toFixed(2)}
                              </td>
                            )
                          }
                          
                          if (col.key === 'gsaa') {
                            const gsaa = value as number
                            return (
                              <td key={col.key} className={`px-3 py-3 font-bold ${
                                gsaa >= 15 ? 'text-green-400' : gsaa >= 0 ? 'text-yellow-400' : 'text-red-400'
                              }`}>
                                {gsaa > 0 ? '+' : ''}{gsaa.toFixed(1)}
                              </td>
                            )
                          }
                          
                          if (col.key === 'propLine') {
                            return (
                              <td key={col.key} className="px-3 py-3">
                                <span className="font-mono font-bold text-orange-500">{String(value)}</span>
                              </td>
                            )
                          }
                          
                          if (col.key === 'propHitRate') {
                            const rate = value as number
                            return (
                              <td key={col.key} className="px-3 py-3">
                                <span className={`text-xs px-1.5 py-0.5 rounded ${
                                  rate >= 55 ? 'bg-green-500/20 text-green-400' : 
                                  rate >= 50 ? 'bg-yellow-500/20 text-yellow-400' : 
                                  'bg-red-500/20 text-red-400'
                                }`}>
                                  {rate}%
                                </span>
                              </td>
                            )
                          }
                          
                          if (col.key === 'winPct' || col.key === 'overPct' || col.key === 'qsPct') {
                            return (
                              <td key={col.key} className={`px-3 py-3 ${'primary' in col && col.primary ? 'font-bold text-white' : 'text-gray-300'}`}>
                                {(value as number).toFixed(1)}%
                              </td>
                            )
                          }
                          
                          return (
                            <td key={col.key} className={`px-3 py-3 text-sm ${col.key === 'rank' ? 'text-gray-500 font-mono' : 'text-gray-300'}`}>
                              {typeof value === 'number' ? value.toLocaleString() : value?.toString() ?? '-'}
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Hot Goalies */}
            <div className="rounded-xl p-4 bg-[#0c0c14] border border-white/10">
              <div className="flex items-center gap-2 mb-4">
                <Flame className="w-5 h-5 text-orange-500" />
                <h3 className="font-bold text-white">Hot Goalies 🔥</h3>
              </div>
              <div className="space-y-2">
                {hotGoalies.slice(0, 5).map(g => (
                  <div key={g.id} className="flex items-center justify-between p-2 rounded-lg bg-orange-500/5">
                    <div>
                      <div className="font-semibold text-sm text-white">{g.name}</div>
                      <div className="text-xs text-gray-500">{g.team} · {g.streakType}{g.streakCount}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-bold text-green-400">{g.svPct.toFixed(3)}</div>
                      <div className="text-xs text-gray-500">{g.wins}-{g.losses}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Cold Goalies */}
            <div className="rounded-xl p-4 bg-[#0c0c14] border border-white/10">
              <div className="flex items-center gap-2 mb-4">
                <Snowflake className="w-5 h-5 text-blue-500" />
                <h3 className="font-bold text-white">Cold Goalies ❄️</h3>
              </div>
              <div className="space-y-2">
                {coldGoalies.slice(0, 5).map(g => (
                  <div key={g.id} className="flex items-center justify-between p-2 rounded-lg bg-blue-500/5">
                    <div>
                      <div className="font-semibold text-sm text-white">{g.name}</div>
                      <div className="text-xs text-gray-500">{g.team} · {g.streakType}{g.streakCount}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-bold text-red-400">{g.svPct.toFixed(3)}</div>
                      <div className="text-xs text-gray-500">{g.wins}-{g.losses}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Betting Edge */}
            <div className="rounded-xl p-4 bg-[#0c0c14] border border-orange-500/30">
              <div className="flex items-center gap-2 mb-4">
                <Target className="w-5 h-5 text-orange-500" />
                <h3 className="font-bold text-orange-500">Betting Edge</h3>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <span className="text-green-500">•</span>
                  <p className="text-gray-300">Goalies on 3+ win streaks cover 57% at home</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-orange-500">•</span>
                  <p className="text-gray-300">GSAA above +15 correlates with 62% ML win rate</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-blue-500">•</span>
                  <p className="text-gray-300">High danger SV% predicts playoff success</p>
                </div>
              </div>
            </div>

            {/* Stat Glossary */}
            <div className="rounded-xl p-4 bg-[#0c0c14] border border-white/10">
              <h3 className="font-bold text-white mb-3">Stat Glossary</h3>
              <div className="space-y-2 text-xs text-gray-400">
                <div><span className="text-white font-semibold">GSAA:</span> Goals Saved Above Average</div>
                <div><span className="text-white font-semibold">HDSV%:</span> High Danger Save %</div>
                <div><span className="text-white font-semibold">QS:</span> Quality Starts (SV% ≥ .917 or GS ≤ 3)</div>
                <div><span className="text-white font-semibold">RBS:</span> Really Bad Starts</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
