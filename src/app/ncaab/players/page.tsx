'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
  ArrowLeft,
  Search,
  TrendingUp,
  Target,
  Users,
  Award,
  ChevronDown,
  Shield,
  Zap,
  Star,
  Loader2
} from 'lucide-react'

type StatCategory = 'scoring' | 'rebounds' | 'assists' | 'defense'

interface PlayerStat {
  rank: number
  name: string
  team: string
  pos: string
  conf: string
  gp: number
  trend: 'up' | 'down' | 'neutral'
  // Scoring
  ppg?: number
  pts?: number
  fg?: number
  threePt?: number
  ft?: number
  min?: number
  // Rebounds
  rpg?: number
  orpg?: number
  drpg?: number
  trb?: number
  mins?: number
  // Assists
  apg?: number
  tov?: number
  ast?: number
  astRatio?: number
  // Defense
  blkpg?: number
  stlpg?: number
  dws?: number
  dfgPct?: number
  blk?: number
  stl?: number
}

interface PlayerStats {
  scoring: PlayerStat[]
  rebounds: PlayerStat[]
  assists: PlayerStat[]
  defense: PlayerStat[]
}

const conferences = ['All', 'SEC', 'Big Ten', 'Big 12', 'ACC', 'Big East', 'Pac-12', 'MWC', 'AAC', 'A-10', 'WCC']

export default function NCAABPlayersPage() {
  const [category, setCategory] = useState<StatCategory>('scoring')
  const [playerStats, setPlayerStats] = useState<PlayerStats>({ scoring: [], rebounds: [], assists: [], defense: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchPlayers() {
      try {
        setLoading(true)
        const supabase = createClient()
        
        const { data, error: dbError } = await supabase
          .from('player_stats_cache')
          .select('*')
          .eq('sport', 'NCAAB')
          .order('updated_at', { ascending: false })
          .limit(100)

        if (dbError) throw dbError

        if (data && data.length > 0) {
          // Transform database data into category-based stats
          const scoring: PlayerStat[] = []
          const rebounds: PlayerStat[] = []
          const assists: PlayerStat[] = []
          const defense: PlayerStat[] = []

          interface PlayerStatsData {
            position?: string
            conference?: string
            games_played?: number
            trend?: string
            ppg?: number
            points_per_game?: number
            fg_pct?: number
            field_goal_pct?: number
            three_pt_pct?: number
            three_point_pct?: number
            ft_pct?: number
            free_throw_pct?: number
            mpg?: number
            minutes_per_game?: number
            rpg?: number
            rebounds_per_game?: number
            orpg?: number
            offensive_rebounds_per_game?: number
            drpg?: number
            defensive_rebounds_per_game?: number
            total_rebounds?: number
            apg?: number
            assists_per_game?: number
            tov?: number
            turnovers_per_game?: number
            total_assists?: number
            ast_ratio?: number
            assist_ratio?: number
            blkpg?: number
            blocks_per_game?: number
            stlpg?: number
            steals_per_game?: number
            dws?: number
            defensive_win_shares?: number
            dfg_pct?: number
            defensive_fg_pct?: number
            total_blocks?: number
            total_steals?: number
          }

          data.forEach((player: { player_name: string; team_name?: string; stats?: PlayerStatsData }, idx: number) => {
            const stats = player.stats || {}
            const trendValue = stats.trend
            const trend: 'up' | 'down' | 'neutral' = 
              trendValue === 'up' ? 'up' : 
              trendValue === 'down' ? 'down' : 'neutral'

            const basePlayer = {
              rank: idx + 1,
              name: player.player_name,
              team: player.team_name || 'Unknown',
              pos: String(stats.position || 'N/A'),
              conf: String(stats.conference || 'N/A'),
              gp: stats.games_played || 0,
              trend,
            }

            // Add to scoring if has PPG
            if (stats.ppg || stats.points_per_game) {
              scoring.push({
                ...basePlayer,
                ppg: stats.ppg || stats.points_per_game || 0,
                pts: stats.ppg || stats.points_per_game || 0,
                fg: stats.fg_pct || stats.field_goal_pct || 0,
                threePt: stats.three_pt_pct || stats.three_point_pct || 0,
                ft: stats.ft_pct || stats.free_throw_pct || 0,
                min: stats.mpg || stats.minutes_per_game || 0,
              })
            }

            // Add to rebounds if has RPG
            if (stats.rpg || stats.rebounds_per_game) {
              rebounds.push({
                ...basePlayer,
                rpg: stats.rpg || stats.rebounds_per_game || 0,
                orpg: stats.orpg || stats.offensive_rebounds_per_game || 0,
                drpg: stats.drpg || stats.defensive_rebounds_per_game || 0,
                trb: stats.total_rebounds || 0,
                mins: stats.mpg || stats.minutes_per_game || 0,
              })
            }

            // Add to assists if has APG
            if (stats.apg || stats.assists_per_game) {
              assists.push({
                ...basePlayer,
                apg: stats.apg || stats.assists_per_game || 0,
                tov: stats.tov || stats.turnovers_per_game || 0,
                ast: stats.total_assists || 0,
                astRatio: stats.ast_ratio || stats.assist_ratio || 0,
                min: stats.mpg || stats.minutes_per_game || 0,
              })
            }

            // Add to defense if has blocks or steals
            if (stats.blkpg || stats.stlpg || stats.blocks_per_game || stats.steals_per_game) {
              defense.push({
                ...basePlayer,
                blkpg: stats.blkpg || stats.blocks_per_game || 0,
                stlpg: stats.stlpg || stats.steals_per_game || 0,
                dws: stats.dws || stats.defensive_win_shares || 0,
                dfgPct: stats.dfg_pct || stats.defensive_fg_pct || 0,
                blk: stats.total_blocks || 0,
                stl: stats.total_steals || 0,
              })
            }
          })

          // Sort each category and re-rank
          scoring.sort((a, b) => (b.ppg || 0) - (a.ppg || 0))
          rebounds.sort((a, b) => (b.rpg || 0) - (a.rpg || 0))
          assists.sort((a, b) => (b.apg || 0) - (a.apg || 0))
          defense.sort((a, b) => (b.blkpg || 0) - (a.blkpg || 0))

          scoring.forEach((p, i) => p.rank = i + 1)
          rebounds.forEach((p, i) => p.rank = i + 1)
          assists.forEach((p, i) => p.rank = i + 1)
          defense.forEach((p, i) => p.rank = i + 1)

          setPlayerStats({ scoring, rebounds, assists, defense })
        }
      } catch (err) {
        console.error('Error fetching players:', err)
        setError('Failed to load player stats')
      } finally {
        setLoading(false)
      }
    }

    fetchPlayers()
  }, [])

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedConf, setSelectedConf] = useState('All')

  const currentStats = playerStats[category]
  const filteredStats = currentStats.filter(player => {
    const matchesSearch = player.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         player.team.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesConf = selectedConf === 'All' || player.conf === selectedConf
    return matchesSearch && matchesConf
  })

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#050508' }}>
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading NCAAB player stats...</p>
        </div>
      </div>
    )
  }

  // Error state  
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#050508' }}>
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <Link href="/ncaab" className="text-indigo-400 hover:text-indigo-300">
            Back to NCAAB
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: '#050508' }}>
      {/* Header */}
      <div className="border-b border-white/5" style={{ background: 'linear-gradient(180deg, #0a0a12 0%, #050508 100%)' }}>
        <div className="max-w-7xl mx-auto px-4 py-6">
          <Link href="/ncaab" className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to NCAAB
          </Link>
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-4xl">🏀</span>
                <h1 className="text-3xl font-black text-white">NCAAB Player Stats</h1>
                <span className="px-2 py-1 rounded-md text-xs font-bold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                  2024-25 SEASON
                </span>
              </div>
              <p className="text-gray-400">Comprehensive college basketball player statistics</p>
            </div>
            
            <div className="flex items-center gap-3">
              {currentStats.length > 0 ? (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-500/10 border border-green-500/20">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                  <span className="text-green-400 text-sm font-medium">Live</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                  <span className="text-yellow-400 text-sm font-medium">No Data</span>
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
            { id: 'scoring', label: 'Scoring', icon: Target },
            { id: 'rebounds', label: 'Rebounds', icon: Zap },
            { id: 'assists', label: 'Assists', icon: Users },
            { id: 'defense', label: 'Defense', icon: Shield },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategory(cat.id as StatCategory)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold transition-all ${
                category === cat.id
                  ? 'bg-indigo-500 text-white'
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
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500/50"
            />
          </div>
          
          <div className="relative">
            <select
              value={selectedConf}
              onChange={(e) => setSelectedConf(e.target.value)}
              aria-label="Filter by conference"
              className="appearance-none px-4 py-3 pr-10 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-indigo-500/50 cursor-pointer"
            >
              {conferences.map(conf => (
                <option key={conf} value={conf} className="bg-[#0a0a12]">{conf}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
          </div>
        </div>

        {/* Stats Table */}
        <div className="rounded-2xl border border-white/10 overflow-hidden" style={{ background: '#0c0c14' }}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="px-4 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Rank</th>
                  <th className="px-4 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Player</th>
                  <th className="px-4 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Team</th>
                  <th className="px-4 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">GP</th>
                  {category === 'scoring' && (
                    <>
                      <th className="px-4 py-4 text-center text-xs font-bold text-indigo-500 uppercase tracking-wider">PPG</th>
                      <th className="px-4 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">FG%</th>
                      <th className="px-4 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">3PT%</th>
                      <th className="px-4 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">FT%</th>
                      <th className="px-4 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">MIN</th>
                    </>
                  )}
                  {category === 'rebounds' && (
                    <>
                      <th className="px-4 py-4 text-center text-xs font-bold text-indigo-500 uppercase tracking-wider">RPG</th>
                      <th className="px-4 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">ORPG</th>
                      <th className="px-4 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">DRPG</th>
                      <th className="px-4 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">TRB</th>
                      <th className="px-4 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">MIN</th>
                    </>
                  )}
                  {category === 'assists' && (
                    <>
                      <th className="px-4 py-4 text-center text-xs font-bold text-indigo-500 uppercase tracking-wider">APG</th>
                      <th className="px-4 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">TOV</th>
                      <th className="px-4 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">AST</th>
                      <th className="px-4 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">AST%</th>
                      <th className="px-4 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">MIN</th>
                    </>
                  )}
                  {category === 'defense' && (
                    <>
                      <th className="px-4 py-4 text-center text-xs font-bold text-indigo-500 uppercase tracking-wider">BLK</th>
                      <th className="px-4 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">STL</th>
                      <th className="px-4 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">DFG%</th>
                      <th className="px-4 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">DWS</th>
                    </>
                  )}
                  <th className="px-4 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Trend</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredStats.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-4 py-12 text-center">
                      <Users className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                      <p className="text-gray-400 mb-2">No player stats available</p>
                      <p className="text-gray-500 text-sm">Player data will appear here once collected from APIs</p>
                    </td>
                  </tr>
                ) : (
                  filteredStats.map((player) => (
                  <tr key={player.name} className="hover:bg-white/5 transition-colors">
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg text-sm font-bold ${
                        player.rank <= 3 ? 'bg-indigo-500/20 text-indigo-400' : 'bg-white/10 text-gray-400'
                      }`}>
                        {player.rank}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center">
                          <Users className="w-5 h-5 text-indigo-400" />
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
                    {category === 'scoring' && (
                      <>
                        <td className="px-4 py-4 text-center">
                          <span className="px-2 py-1 rounded-lg bg-indigo-500/20 text-indigo-400 font-bold">
                            {(player as { ppg: number }).ppg}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-center text-white font-medium">{(player as { fg: number }).fg}%</td>
                        <td className="px-4 py-4 text-center text-white font-medium">{(player as { threePt: number }).threePt}%</td>
                        <td className="px-4 py-4 text-center text-white font-medium">{(player as { ft: number }).ft}%</td>
                        <td className="px-4 py-4 text-center text-gray-400">{(player as { min: number }).min}</td>
                      </>
                    )}
                    {category === 'rebounds' && (
                      <>
                        <td className="px-4 py-4 text-center">
                          <span className="px-2 py-1 rounded-lg bg-indigo-500/20 text-indigo-400 font-bold">
                            {(player as { rpg: number }).rpg}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-center text-white font-medium">{(player as { orpg: number }).orpg}</td>
                        <td className="px-4 py-4 text-center text-white font-medium">{(player as { drpg: number }).drpg}</td>
                        <td className="px-4 py-4 text-center text-gray-400">{(player as { trb: number }).trb}</td>
                        <td className="px-4 py-4 text-center text-gray-400">{(player as { mins: number }).mins}</td>
                      </>
                    )}
                    {category === 'assists' && (
                      <>
                        <td className="px-4 py-4 text-center">
                          <span className="px-2 py-1 rounded-lg bg-indigo-500/20 text-indigo-400 font-bold">
                            {(player as { apg: number }).apg}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-center text-red-400 font-medium">{(player as { tov: number }).tov}</td>
                        <td className="px-4 py-4 text-center text-white font-semibold">{(player as { ast: number }).ast}</td>
                        <td className="px-4 py-4 text-center text-white font-medium">{(player as { astRatio: number }).astRatio}%</td>
                        <td className="px-4 py-4 text-center text-gray-400">{(player as { min: number }).min}</td>
                      </>
                    )}
                    {category === 'defense' && (
                      <>
                        <td className="px-4 py-4 text-center">
                          <span className="px-2 py-1 rounded-lg bg-indigo-500/20 text-indigo-400 font-bold">
                            {(player as { blkpg: number }).blkpg}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-center text-green-400 font-semibold">{(player as { stlpg: number }).stlpg}</td>
                        <td className="px-4 py-4 text-center text-white font-medium">{(player as { dfgPct: number }).dfgPct}%</td>
                        <td className="px-4 py-4 text-center text-white font-medium">{(player as { dws: number }).dws}</td>
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
                )))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Draft Watch Widget */}
        <div className="mt-8 rounded-2xl border border-indigo-500/30 p-6" style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.1) 0%, rgba(79,70,229,0.05) 100%)' }}>
          <div className="flex items-center gap-3 mb-4">
            <Star className="w-6 h-6 text-indigo-400" />
            <h3 className="text-xl font-bold text-white">NBA Draft Prospects</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { name: 'Dylan Harper', team: 'Rutgers', pos: 'G', proj: '#1' },
              { name: 'Ace Bailey', team: 'Rutgers', pos: 'F', proj: '#2' },
              { name: 'Cooper Flagg', team: 'Duke', pos: 'F', proj: '#3' },
              { name: 'VJ Edgecombe', team: 'Baylor', pos: 'G', proj: '#4' },
              { name: 'Kasparas Jakucionis', team: 'Illinois', pos: 'G', proj: '#5' },
            ].map((player, idx) => (
              <div key={player.name} className="p-4 rounded-xl bg-black/30 border border-white/10">
                <div className="text-2xl font-black text-indigo-400 mb-1">{player.proj}</div>
                <div className="font-semibold text-white text-sm">{player.name}</div>
                <div className="text-xs text-gray-500">{player.team} • {player.pos}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Tournament Bracket Callout */}
        <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Award className="w-6 h-6 text-indigo-400" />
              <div>
                <div className="font-bold text-white">March Madness Predictions Coming Soon</div>
                <div className="text-sm text-gray-400">AI-powered bracket analysis and picks</div>
              </div>
            </div>
            <Link href="/ncaab/bracket" className="px-4 py-2 rounded-lg bg-indigo-500 text-white font-semibold hover:bg-indigo-600 transition-colors">
              View Bracket
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
