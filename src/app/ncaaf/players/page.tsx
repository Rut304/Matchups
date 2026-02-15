'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { 
  ArrowLeft,
  Search,
  TrendingUp,
  Target,
  Users,
  Award,
  ChevronDown,
  Flame,
  Shield,
  Zap,
  AlertCircle,
  Loader2
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type StatCategory = 'passing' | 'rushing' | 'receiving' | 'defense'

interface PlayerStatRow {
  rank: number
  name: string
  team: string
  pos: string
  conf: string
  gp: number
  trend: 'up' | 'down' | 'neutral'
  // Passing stats
  cmp?: number
  att?: number
  pct?: number
  yds?: number
  td?: number
  int?: number
  rtg?: number
  ypa?: number
  // Rushing stats
  avg?: number
  lng?: number
  ypc?: number
  fumbles?: number
  // Receiving stats
  rec?: number
  tgt?: number
  ypr?: number
  ctchPct?: number
  // Defense stats
  tackles?: number
  tfl?: number
  sacks?: number
  ff?: number
  pd?: number
  solo?: number
}

interface PlayerStats {
  passing: PlayerStatRow[]
  rushing: PlayerStatRow[]
  receiving: PlayerStatRow[]
  defense: PlayerStatRow[]
}

// Empty default - data comes from database only
const emptyPlayerStats: PlayerStats = {
  passing: [],
  rushing: [],
  receiving: [],
  defense: [],
}

const conferences = ['All', 'SEC', 'Big Ten', 'Big 12', 'ACC', 'Pac-12', 'MWC', 'AAC', 'Sun Belt', 'C-USA', 'MAC', 'Ind']

export default function NCAAFPlayersPage() {
  const [category, setCategory] = useState<StatCategory>('passing')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedConf, setSelectedConf] = useState('All')
  const [sortBy, setSortBy] = useState('rank')
  const [playerStats, setPlayerStats] = useState<PlayerStats>(emptyPlayerStats)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch player stats from database
  useEffect(() => {
    async function fetchPlayerStats() {
      setLoading(true)
      setError(null)
      
      try {
        const supabase = createClient()
        
        // Fetch NCAAF player stats from player_stats_cache table
        const { data, error: fetchError } = await supabase
          .from('player_stats_cache')
          .select('*')
          .eq('sport', 'NCAAF')
          .order('updated_at', { ascending: false })
        
        if (fetchError) {
          console.error('Error fetching NCAAF player stats:', fetchError)
          setError('Failed to load player stats')
          setPlayerStats(emptyPlayerStats)
          return
        }

        if (!data || data.length === 0) {
          // No data available - show empty state
          setPlayerStats(emptyPlayerStats)
          return
        }

        // Transform database data into display format
        // Group by position category
        const passing: PlayerStatRow[] = []
        const rushing: PlayerStatRow[] = []
        const receiving: PlayerStatRow[] = []
        const defense: PlayerStatRow[] = []

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data.forEach((player: any, idx: number) => {
          const stats = player.stats as Record<string, number> || {}
          const baseRow: PlayerStatRow = {
            rank: idx + 1,
            name: player.player_name || '-',
            team: player.team || '-',
            pos: player.position || '-',
            conf: stats.conference?.toString() || '-',
            gp: stats.games_played || 0,
            trend: 'neutral' as const,
          }

          // Categorize by position
          const pos = (player.position || '').toUpperCase()
          if (pos === 'QB') {
            passing.push({
              ...baseRow,
              cmp: stats.completions || 0,
              att: stats.pass_attempts || 0,
              pct: stats.completion_pct || 0,
              yds: stats.pass_yards || 0,
              td: stats.pass_td || 0,
              int: stats.interceptions || 0,
              rtg: stats.passer_rating || 0,
              ypa: stats.yards_per_attempt || 0,
            })
          } else if (pos === 'RB' || pos === 'FB') {
            rushing.push({
              ...baseRow,
              att: stats.rush_attempts || 0,
              yds: stats.rush_yards || 0,
              avg: stats.yards_per_carry || 0,
              td: stats.rush_td || 0,
              lng: stats.longest_rush || 0,
              ypc: stats.rush_yards_per_game || 0,
              fumbles: stats.fumbles || 0,
            })
          } else if (pos === 'WR' || pos === 'TE') {
            receiving.push({
              ...baseRow,
              rec: stats.receptions || 0,
              tgt: stats.targets || 0,
              yds: stats.rec_yards || 0,
              avg: stats.yards_per_reception || 0,
              td: stats.rec_td || 0,
              lng: stats.longest_reception || 0,
              ypr: stats.rec_yards_per_game || 0,
              ctchPct: stats.catch_pct || 0,
            })
          } else if (['LB', 'DT', 'DE', 'CB', 'S', 'EDGE', 'DL', 'DB'].includes(pos)) {
            defense.push({
              ...baseRow,
              tackles: stats.tackles || 0,
              tfl: stats.tackles_for_loss || 0,
              sacks: stats.sacks || 0,
              int: stats.interceptions || 0,
              ff: stats.forced_fumbles || 0,
              pd: stats.passes_defended || 0,
              solo: stats.solo_tackles || 0,
            })
          }
        })

        // Sort and rank each category
        const sortAndRank = (arr: PlayerStatRow[]) => {
          return arr.map((p, i) => ({ ...p, rank: i + 1 }))
        }

        setPlayerStats({
          passing: sortAndRank(passing),
          rushing: sortAndRank(rushing),
          receiving: sortAndRank(receiving),
          defense: sortAndRank(defense),
        })
      } catch (err) {
        console.error('Error loading player stats:', err)
        setError('Failed to load player stats')
        setPlayerStats(emptyPlayerStats)
      } finally {
        setLoading(false)
      }
    }

    fetchPlayerStats()
  }, [])

  const currentStats = playerStats[category]
  const filteredStats = currentStats.filter(player => {
    const matchesSearch = player.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         player.team.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesConf = selectedConf === 'All' || player.conf === selectedConf
    return matchesSearch && matchesConf
  })

  return (
    <div className="min-h-screen" style={{ background: '#050508' }}>
      {/* Header */}
      <div className="border-b border-white/5" style={{ background: 'linear-gradient(180deg, #0a0a12 0%, #050508 100%)' }}>
        <div className="max-w-7xl mx-auto px-4 py-6">
          <Link href="/ncaaf" className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to NCAAF
          </Link>
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-4xl">🏈</span>
                <h1 className="text-3xl font-black text-white">NCAAF Player Stats</h1>
                <span className="px-2 py-1 rounded-md text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  2025 SEASON
                </span>
              </div>
              <p className="text-gray-400">Comprehensive college football player statistics</p>
            </div>
            
            <div className="flex items-center gap-3">
              {loading ? (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
                  <span className="text-blue-400 text-sm font-medium">Loading...</span>
                </div>
              ) : error ? (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20">
                  <AlertCircle className="w-4 h-4 text-red-400" />
                  <span className="text-red-400 text-sm font-medium">Error</span>
                </div>
              ) : currentStats.length > 0 ? (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-500/10 border border-green-500/20">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <span className="text-green-400 text-sm font-medium">Data Loaded</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <AlertCircle className="w-4 h-4 text-amber-400" />
                  <span className="text-amber-400 text-sm font-medium">No Data</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Category Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {[
            { id: 'passing', label: 'Passing', icon: Target },
            { id: 'rushing', label: 'Rushing', icon: Zap },
            { id: 'receiving', label: 'Receiving', icon: Users },
            { id: 'defense', label: 'Defense', icon: Shield },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategory(cat.id as StatCategory)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold transition-all ${
                category === cat.id
                  ? 'bg-amber-500 text-black'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
              }`}
            >
              <cat.icon className="w-4 h-4" />
              {cat.label}
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              placeholder="Search players or teams..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/50"
            />
          </div>
          
          <div className="relative">
            <select
              value={selectedConf}
              onChange={(e) => setSelectedConf(e.target.value)}
              className="appearance-none px-4 py-3 pr-10 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-amber-500/50 cursor-pointer"
            >
              {conferences.map(conf => (
                <option key={conf} value={conf} className="bg-[#0a0a12]">{conf}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
          </div>
        </div>

        {/* Stats Table */}
        {loading ? (
          <div className="rounded-2xl border border-white/10 p-12 text-center" style={{ background: '#0c0c14' }}>
            <Loader2 className="w-12 h-12 text-amber-400 animate-spin mx-auto mb-4" />
            <p className="text-gray-400">Loading player statistics...</p>
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-500/30 p-12 text-center" style={{ background: '#0c0c14' }}>
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <p className="text-red-400 font-semibold mb-2">Failed to load data</p>
            <p className="text-gray-500 text-sm">{error}</p>
          </div>
        ) : filteredStats.length === 0 ? (
          <div className="rounded-2xl border border-white/10 p-12 text-center" style={{ background: '#0c0c14' }}>
            <AlertCircle className="w-12 h-12 text-amber-400/50 mx-auto mb-4" />
            <p className="text-white font-semibold mb-2">No Player Data Available</p>
            <p className="text-gray-500 text-sm mb-4">NCAAF player statistics have not been populated yet.</p>
            <p className="text-gray-600 text-xs">Data will be available once the database is populated with real player stats.</p>
          </div>
        ) : (
        <div className="rounded-2xl border border-white/10 overflow-hidden" style={{ background: '#0c0c14' }}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="px-4 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Rank</th>
                  <th className="px-4 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Player</th>
                  <th className="px-4 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Team</th>
                  <th className="px-4 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">GP</th>
                  {category === 'passing' && (
                    <>
                      <th className="px-4 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">CMP/ATT</th>
                      <th className="px-4 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">PCT</th>
                      <th className="px-4 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">YDS</th>
                      <th className="px-4 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">TD</th>
                      <th className="px-4 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">INT</th>
                      <th className="px-4 py-4 text-center text-xs font-bold text-amber-500 uppercase tracking-wider">RTG</th>
                    </>
                  )}
                  {category === 'rushing' && (
                    <>
                      <th className="px-4 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">ATT</th>
                      <th className="px-4 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">YDS</th>
                      <th className="px-4 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">AVG</th>
                      <th className="px-4 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">TD</th>
                      <th className="px-4 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">LNG</th>
                      <th className="px-4 py-4 text-center text-xs font-bold text-amber-500 uppercase tracking-wider">YDS/G</th>
                    </>
                  )}
                  {category === 'receiving' && (
                    <>
                      <th className="px-4 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">REC</th>
                      <th className="px-4 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">TGT</th>
                      <th className="px-4 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">YDS</th>
                      <th className="px-4 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">TD</th>
                      <th className="px-4 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">AVG</th>
                      <th className="px-4 py-4 text-center text-xs font-bold text-amber-500 uppercase tracking-wider">YDS/G</th>
                    </>
                  )}
                  {category === 'defense' && (
                    <>
                      <th className="px-4 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">TCKL</th>
                      <th className="px-4 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">TFL</th>
                      <th className="px-4 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">SACKS</th>
                      <th className="px-4 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">INT</th>
                      <th className="px-4 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">FF</th>
                      <th className="px-4 py-4 text-center text-xs font-bold text-amber-500 uppercase tracking-wider">PD</th>
                    </>
                  )}
                  <th className="px-4 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Trend</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredStats.map((player, idx) => (
                  <tr key={player.name} className="hover:bg-white/5 transition-colors">
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg text-sm font-bold ${
                        player.rank <= 3 ? 'bg-amber-500/20 text-amber-400' : 'bg-white/10 text-gray-400'
                      }`}>
                        {player.rank}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center">
                          <Users className="w-5 h-5 text-amber-400" />
                        </div>
                        <div>
                          <div className="font-semibold text-white">{player.name}</div>
                          <div className="text-xs text-gray-500">{player.pos}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div>
                        <div className="font-medium text-white">{player.team}</div>
                        <div className="text-xs text-gray-500">{player.conf}</div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center text-gray-400">{player.gp}</td>
                    {category === 'passing' && (
                      <>
                        <td className="px-4 py-4 text-center text-gray-400">{(player as { cmp: number }).cmp}/{(player as { att: number }).att}</td>
                        <td className="px-4 py-4 text-center text-white font-medium">{(player as { pct: number }).pct}%</td>
                        <td className="px-4 py-4 text-center text-white font-semibold">{(player as { yds: number }).yds.toLocaleString()}</td>
                        <td className="px-4 py-4 text-center text-green-400 font-semibold">{(player as { td: number }).td}</td>
                        <td className="px-4 py-4 text-center text-red-400 font-semibold">{(player as { int: number }).int}</td>
                        <td className="px-4 py-4 text-center">
                          <span className="px-2 py-1 rounded-lg bg-amber-500/20 text-amber-400 font-bold">
                            {(player as { rtg: number }).rtg}
                          </span>
                        </td>
                      </>
                    )}
                    {category === 'rushing' && (
                      <>
                        <td className="px-4 py-4 text-center text-gray-400">{(player as { att: number }).att}</td>
                        <td className="px-4 py-4 text-center text-white font-semibold">{(player as { yds: number }).yds.toLocaleString()}</td>
                        <td className="px-4 py-4 text-center text-white font-medium">{(player as { avg: number }).avg}</td>
                        <td className="px-4 py-4 text-center text-green-400 font-semibold">{(player as { td: number }).td}</td>
                        <td className="px-4 py-4 text-center text-gray-400">{(player as { lng: number }).lng}</td>
                        <td className="px-4 py-4 text-center">
                          <span className="px-2 py-1 rounded-lg bg-amber-500/20 text-amber-400 font-bold">
                            {(player as { ypc: number }).ypc}
                          </span>
                        </td>
                      </>
                    )}
                    {category === 'receiving' && (
                      <>
                        <td className="px-4 py-4 text-center text-white font-semibold">{(player as { rec: number }).rec}</td>
                        <td className="px-4 py-4 text-center text-gray-400">{(player as { tgt: number }).tgt}</td>
                        <td className="px-4 py-4 text-center text-white font-semibold">{(player as { yds: number }).yds.toLocaleString()}</td>
                        <td className="px-4 py-4 text-center text-green-400 font-semibold">{(player as { td: number }).td}</td>
                        <td className="px-4 py-4 text-center text-white font-medium">{(player as { avg: number }).avg}</td>
                        <td className="px-4 py-4 text-center">
                          <span className="px-2 py-1 rounded-lg bg-amber-500/20 text-amber-400 font-bold">
                            {(player as { ypr: number }).ypr}
                          </span>
                        </td>
                      </>
                    )}
                    {category === 'defense' && (
                      <>
                        <td className="px-4 py-4 text-center text-white font-semibold">{(player as { tackles: number }).tackles}</td>
                        <td className="px-4 py-4 text-center text-white font-medium">{(player as { tfl: number }).tfl}</td>
                        <td className="px-4 py-4 text-center text-green-400 font-semibold">{(player as { sacks: number }).sacks}</td>
                        <td className="px-4 py-4 text-center text-blue-400 font-semibold">{(player as { int: number }).int}</td>
                        <td className="px-4 py-4 text-center text-orange-400 font-semibold">{(player as { ff: number }).ff}</td>
                        <td className="px-4 py-4 text-center">
                          <span className="px-2 py-1 rounded-lg bg-amber-500/20 text-amber-400 font-bold">
                            {(player as { pd: number }).pd}
                          </span>
                        </td>
                      </>
                    )}
                    <td className="px-4 py-4 text-center">
                      {player.trend === 'up' && (
                        <div className="inline-flex items-center gap-1 text-green-400">
                          <TrendingUp className="w-4 h-4" />
                        </div>
                      )}
                      {player.trend === 'down' && (
                        <div className="inline-flex items-center gap-1 text-red-400">
                          <TrendingUp className="w-4 h-4 rotate-180" />
                        </div>
                      )}
                      {player.trend === 'neutral' && (
                        <div className="w-4 h-0.5 bg-gray-600 mx-auto rounded"></div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        )}

        {/* Heisman Watch Widget - Data comes from database when available */}
        <div className="mt-8 rounded-2xl border border-amber-500/30 p-6" style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.1) 0%, rgba(217,119,6,0.05) 100%)' }}>
          <div className="flex items-center gap-3 mb-4">
            <Award className="w-6 h-6 text-amber-400" />
            <h3 className="text-xl font-bold text-white">Heisman Trophy Watch</h3>
          </div>
          <div className="text-center py-8">
            <p className="text-gray-400 mb-2">Heisman odds data not available</p>
            <p className="text-gray-600 text-xs">Data will be displayed once populated from the database.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
