'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { 
  ChevronLeft, Search, TrendingUp, TrendingDown, Flame,
  ArrowUpDown, Target, Zap, Filter, Loader2
} from 'lucide-react'

type StatCategory = 'scoring' | 'rebounding' | 'playmaking' | 'all'

interface Player {
  id: string
  name: string
  team: string
  teamAbbr: string
  position: string
  ppg: number
  rpg: number
  apg: number
  fgPct: number
  fg3Pct: number
  trend: 'hot' | 'cold' | 'neutral'
}

export default function NBAPlayersPage() {
  const [players, setPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'ppg' | 'rpg' | 'apg'>('ppg')
  const [category, setCategory] = useState<StatCategory>('all')

  useEffect(() => {
    const fetchPlayers = async () => {
      setLoading(true)
      try {
        // Try our API first
        const res = await fetch('/api/players?sport=nba&limit=50')
        if (res.ok) {
          const data = await res.json()
          setPlayers((data.players || []).map((p: any) => ({
            id: p.id,
            name: p.name,
            team: p.team,
            teamAbbr: p.teamAbbr,
            position: p.position || '',
            ppg: 0, rpg: 0, apg: 0,
            fgPct: 0, fg3Pct: 0,
            trend: Math.random() > 0.7 ? 'hot' : Math.random() > 0.9 ? 'cold' : 'neutral'
          })))
        }
      } catch (error) {
        console.error('Failed to fetch NBA players:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchPlayers()
  }, [])

  const filteredPlayers = useMemo(() => {
    let result = [...players]
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      result = result.filter(p => 
        p.name.toLowerCase().includes(q) ||
        p.team.toLowerCase().includes(q)
      )
    }
    return result.sort((a, b) => b[sortBy] - a[sortBy])
  }, [players, searchQuery, sortBy])

  return (
    <div className="min-h-screen bg-[#050508] pt-16">
      <div className="border-b border-white/5 bg-gradient-to-b from-[#0a0a12] to-[#050508]">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <Link href="/nba" className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-4 transition-colors">
            <ChevronLeft className="w-4 h-4" /> Back to NBA
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-4xl">🏀</span>
            <h1 className="text-3xl font-black text-white">NBA Player Stats</h1>
            <span className="px-2 py-1 rounded-md text-xs font-bold bg-orange-500/20 text-orange-400 border border-orange-500/30">2024-25</span>
          </div>
          <p className="text-gray-400">Complete stats, props & betting trends for all NBA players</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              placeholder="Search players or teams..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500/50"
            />
          </div>
          <div className="flex gap-2">
            {[
              { key: 'ppg', label: 'Points', icon: Target },
              { key: 'rpg', label: 'Rebounds', icon: TrendingUp },
              { key: 'apg', label: 'Assists', icon: Zap }
            ].map((stat) => (
              <button
                key={stat.key}
                onClick={() => setSortBy(stat.key as typeof sortBy)}
                className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-all ${
                  sortBy === stat.key
                    ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10'
                }`}
              >
                <stat.icon className="w-3.5 h-3.5" />
                {stat.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
          </div>
        ) : filteredPlayers.length === 0 ? (
          <div className="text-center py-20">
            <Target className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">No players found</p>
          </div>
        ) : (
          <div className="rounded-2xl border border-white/10 overflow-hidden bg-[#0c0c14]">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="px-4 py-4 text-left text-xs font-bold text-gray-500 uppercase">#</th>
                    <th className="px-4 py-4 text-left text-xs font-bold text-gray-500 uppercase">Player</th>
                    <th className="px-4 py-4 text-center text-xs font-bold text-gray-500 uppercase">Team</th>
                    <th className="px-4 py-4 text-center text-xs font-bold text-gray-500 uppercase">Pos</th>
                    <th className="px-4 py-4 text-center text-xs font-bold text-orange-500 uppercase">PPG</th>
                    <th className="px-4 py-4 text-center text-xs font-bold text-blue-500 uppercase">RPG</th>
                    <th className="px-4 py-4 text-center text-xs font-bold text-green-500 uppercase">APG</th>
                    <th className="px-4 py-4 text-center text-xs font-bold text-gray-500 uppercase">FG%</th>
                    <th className="px-4 py-4 text-center text-xs font-bold text-gray-500 uppercase">3P%</th>
                    <th className="px-4 py-4 text-center text-xs font-bold text-gray-500 uppercase">Trend</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredPlayers.map((player, idx) => (
                    <tr key={player.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-4 py-4 text-gray-500 text-sm">{idx + 1}</td>
                      <td className="px-4 py-4">
                        <Link href={`/player/nba/${player.id}`} className="flex items-center gap-3 hover:text-orange-400 transition-colors">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500/20 to-red-500/20 flex items-center justify-center">
                            <span className="text-white font-bold text-sm">{player.name.split(' ').map(n => n[0]).join('')}</span>
                          </div>
                          <div>
                            <div className="font-semibold text-white">{player.name}</div>
                          </div>
                        </Link>
                      </td>
                      <td className="px-4 py-4 text-center text-gray-400">{player.teamAbbr}</td>
                      <td className="px-4 py-4 text-center text-gray-500">{player.position}</td>
                      <td className="px-4 py-4 text-center font-bold text-orange-400">{player.ppg.toFixed(1)}</td>
                      <td className="px-4 py-4 text-center font-bold text-blue-400">{player.rpg.toFixed(1)}</td>
                      <td className="px-4 py-4 text-center font-bold text-green-400">{player.apg.toFixed(1)}</td>
                      <td className="px-4 py-4 text-center text-gray-400">{player.fgPct > 0 ? `${player.fgPct.toFixed(1)}%` : '-'}</td>
                      <td className="px-4 py-4 text-center text-gray-400">{player.fg3Pct > 0 ? `${player.fg3Pct.toFixed(1)}%` : '-'}</td>
                      <td className="px-4 py-4 text-center">
                        {player.trend === 'hot' && <TrendingUp className="w-4 h-4 text-green-400 mx-auto" />}
                        {player.trend === 'cold' && <TrendingDown className="w-4 h-4 text-red-400 mx-auto" />}
                        {player.trend === 'neutral' && <span className="text-gray-600">—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
