'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  ArrowLeft,
  Search,
  TrendingUp,
  TrendingDown,
  Target,
  BarChart3,
  Users,
  Award,
  Loader2
} from 'lucide-react'

interface Player {
  id: string
  name: string
  team: string
  teamAbbr: string
  position: string
  gp: number
  ppg: number
  rpg: number
  apg: number
  fgPct: number
  trend: 'hot' | 'cold' | 'neutral'
}

export default function WNCAABPlayersPage() {
  const [players, setPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'ppg' | 'rpg' | 'apg'>('ppg')

  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        const res = await fetch('/api/players?sport=wncaab&limit=50')
        if (res.ok) {
          const data = await res.json()
          if (data.players && data.players.length > 0) {
            setPlayers(data.players)
            setLoading(false)
            return
          }
        }
        
        // Try ESPN
        const espnRes = await fetch('https://site.api.espn.com/apis/site/v2/sports/basketball/womens-college-basketball/athletes?limit=50')
        if (espnRes.ok) {
          const espnData = await espnRes.json()
          if (espnData.athletes) {
            setPlayers(espnData.athletes.map((a: any) => ({
              id: a.id,
              name: a.displayName || a.fullName,
              team: a.team?.displayName || 'Unknown',
              teamAbbr: a.team?.abbreviation || '—',
              position: a.position?.abbreviation || 'G',
              gp: 0,
              ppg: 0,
              rpg: 0,
              apg: 0,
              fgPct: 0,
              trend: 'neutral' as const
            })))
            setLoading(false)
            return
          }
        }
        
        setError('Unable to load player data')
      } catch (e) {
        console.error('Failed to fetch WNCAAB players:', e)
        setError('Failed to load players')
      } finally {
        setLoading(false)
      }
    }
    
    fetchPlayers()
  }, [])

  const filteredPlayers = players
    .filter(p => 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.team.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => b[sortBy] - a[sortBy])

  return (
    <div className="min-h-screen bg-[#050508] pt-16">
      {/* Header */}
      <div className="border-b border-white/5 bg-gradient-to-b from-[#0a0a12] to-[#050508]">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <Link href="/wncaab" className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to WNCAAB
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-4xl">🏀</span>
            <h1 className="text-3xl font-black text-white">WNCAAB Player Stats</h1>
            <span className="px-2 py-1 rounded-md text-xs font-bold bg-orange-500/20 text-orange-400 border border-orange-500/30">2025-26</span>
          </div>
          <p className="text-gray-400">Women&apos;s college basketball player statistics & trends</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Search & Filters */}
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
              { key: 'rpg', label: 'Rebounds', icon: BarChart3 },
              { key: 'apg', label: 'Assists', icon: Users }
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

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <BarChart3 className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">{error}</p>
            <p className="text-gray-500 text-sm mt-2">Player stats available during the season (November-April)</p>
          </div>
        ) : filteredPlayers.length === 0 ? (
          <div className="text-center py-20">
            <Users className="w-12 h-12 text-gray-600 mx-auto mb-4" />
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
                    <th className="px-4 py-4 text-left text-xs font-bold text-gray-500 uppercase">Team</th>
                    <th className="px-4 py-4 text-center text-xs font-bold text-gray-500 uppercase">Pos</th>
                    <th className="px-4 py-4 text-center text-xs font-bold text-orange-500 uppercase">PPG</th>
                    <th className="px-4 py-4 text-center text-xs font-bold text-blue-500 uppercase">RPG</th>
                    <th className="px-4 py-4 text-center text-xs font-bold text-green-500 uppercase">APG</th>
                    <th className="px-4 py-4 text-center text-xs font-bold text-gray-500 uppercase">FG%</th>
                    <th className="px-4 py-4 text-center text-xs font-bold text-gray-500 uppercase">Trend</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredPlayers.map((player, idx) => (
                    <tr key={player.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-4 py-4 text-gray-500 text-sm">{idx + 1}</td>
                      <td className="px-4 py-4">
                        <Link href={`/player/wncaab/${player.id}`} className="flex items-center gap-3 hover:text-orange-400 transition-colors">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                            <span className="text-white font-bold text-sm">{player.name.split(' ').map(n => n[0]).join('')}</span>
                          </div>
                          <span className="font-semibold text-white">{player.name}</span>
                        </Link>
                      </td>
                      <td className="px-4 py-4 text-gray-400">{player.team}</td>
                      <td className="px-4 py-4 text-center text-gray-500">{player.position}</td>
                      <td className="px-4 py-4 text-center font-bold text-orange-400">{player.ppg > 0 ? player.ppg.toFixed(1) : '—'}</td>
                      <td className="px-4 py-4 text-center font-bold text-blue-400">{player.rpg > 0 ? player.rpg.toFixed(1) : '—'}</td>
                      <td className="px-4 py-4 text-center font-bold text-green-400">{player.apg > 0 ? player.apg.toFixed(1) : '—'}</td>
                      <td className="px-4 py-4 text-center text-gray-400">{player.fgPct > 0 ? `${player.fgPct.toFixed(1)}%` : '—'}</td>
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

        {/* March Madness CTA */}
        <div className="mt-8 p-6 rounded-2xl bg-gradient-to-br from-purple-500/5 to-pink-500/5 border border-purple-500/10">
          <div className="flex items-start gap-4">
            <Award className="w-8 h-8 text-purple-400 shrink-0" />
            <div>
              <h3 className="font-bold text-white mb-2">Women&apos;s March Madness</h3>
              <p className="text-gray-400 text-sm">
                The NCAA Women&apos;s Tournament takes place in March/April. Look for bracket predictions,
                upset alerts, and betting analysis as the tournament approaches.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
