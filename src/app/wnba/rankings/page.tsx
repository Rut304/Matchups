'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Search, TrendingUp, TrendingDown, Shield, Zap, Loader2 } from 'lucide-react'

interface TeamRanking {
  rank: number
  team: string
  abbr: string
  record: string
  ppg: number
  papg: number
  diff: string
  streak: string
  change: number
}

export default function WNBARankingsPage() {
  const [rankings, setRankings] = useState<TeamRanking[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    const fetchRankings = async () => {
      try {
        // Try to get standings from API
        const res = await fetch('/api/standings?sport=wnba')
        if (res.ok) {
          const data = await res.json()
          if (data.standings && data.standings.length > 0) {
            setRankings(data.standings.map((t: any, idx: number) => ({
              rank: idx + 1,
              team: t.team?.displayName || t.name,
              abbr: t.team?.abbreviation || t.abbreviation,
              record: `${t.wins || 0}-${t.losses || 0}`,
              ppg: t.pointsFor || 0,
              papg: t.pointsAgainst || 0,
              diff: t.pointsDiff > 0 ? `+${t.pointsDiff.toFixed(1)}` : t.pointsDiff?.toFixed(1) || '0',
              streak: t.streak || '—',
              change: 0
            })))
            setLoading(false)
            return
          }
        }

        // Fallback to ESPN
        const espnRes = await fetch('https://site.api.espn.com/apis/v2/sports/basketball/wnba/standings')
        if (espnRes.ok) {
          const espnData = await espnRes.json()
          const teams: TeamRanking[] = []
          
          espnData.children?.forEach((conf: any) => {
            conf.standings?.entries?.forEach((entry: any) => {
              const stats = entry.stats || []
              const wins = stats.find((s: any) => s.name === 'wins')?.value || 0
              const losses = stats.find((s: any) => s.name === 'losses')?.value || 0
              const ppg = stats.find((s: any) => s.name === 'pointsFor')?.value || 0
              const papg = stats.find((s: any) => s.name === 'pointsAgainst')?.value || 0
              const streak = stats.find((s: any) => s.name === 'streak')?.displayValue || '—'
              
              teams.push({
                rank: 0,
                team: entry.team?.displayName || entry.team?.name,
                abbr: entry.team?.abbreviation,
                record: `${wins}-${losses}`,
                ppg: ppg / Math.max(wins + losses, 1),
                papg: papg / Math.max(wins + losses, 1),
                diff: ((ppg - papg) / Math.max(wins + losses, 1)).toFixed(1),
                streak,
                change: 0
              })
            })
          })
          
          // Sort by wins
          teams.sort((a, b) => {
            const aWins = parseInt(a.record.split('-')[0])
            const bWins = parseInt(b.record.split('-')[0])
            return bWins - aWins
          })
          
          teams.forEach((t, idx) => t.rank = idx + 1)
          setRankings(teams)
        }
      } catch (e) {
        console.error('Failed to fetch WNBA rankings:', e)
      } finally {
        setLoading(false)
      }
    }
    
    fetchRankings()
  }, [])

  const filteredRankings = rankings.filter(team =>
    team.team.toLowerCase().includes(searchQuery.toLowerCase()) ||
    team.abbr.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-[#050508] pt-16">
      <div className="border-b border-white/5 bg-gradient-to-b from-[#0a0a12] to-[#050508]">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <Link href="/wnba" className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to WNBA
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-4xl">🏀</span>
            <h1 className="text-3xl font-black text-white">WNBA Team Rankings</h1>
            <span className="px-2 py-1 rounded-md text-xs font-bold bg-orange-500/20 text-orange-400 border border-orange-500/30">2025</span>
          </div>
          <p className="text-gray-400">Power rankings & standings for all 12 WNBA teams</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input 
            type="text" 
            placeholder="Search teams..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500/50"
          />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
          </div>
        ) : filteredRankings.length === 0 ? (
          <div className="text-center py-20">
            <Shield className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">No rankings available</p>
            <p className="text-gray-500 text-sm mt-2">WNBA standings update during the season (May-September)</p>
          </div>
        ) : (
          <div className="rounded-2xl border border-white/10 overflow-hidden bg-[#0c0c14]">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="px-4 py-4 text-left text-xs font-bold text-gray-500 uppercase">Rank</th>
                    <th className="px-4 py-4 text-left text-xs font-bold text-gray-500 uppercase">Team</th>
                    <th className="px-4 py-4 text-center text-xs font-bold text-gray-500 uppercase">Record</th>
                    <th className="px-4 py-4 text-center text-xs font-bold text-gray-500 uppercase">PPG</th>
                    <th className="px-4 py-4 text-center text-xs font-bold text-gray-500 uppercase">PAPG</th>
                    <th className="px-4 py-4 text-center text-xs font-bold text-gray-500 uppercase">DIFF</th>
                    <th className="px-4 py-4 text-center text-xs font-bold text-gray-500 uppercase">Streak</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredRankings.map((team) => (
                    <tr key={team.abbr} className="hover:bg-white/5 transition-colors">
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg text-sm font-bold ${
                          team.rank <= 3 ? 'bg-orange-500/20 text-orange-400' : 'bg-white/10 text-gray-400'
                        }`}>{team.rank}</span>
                      </td>
                      <td className="px-4 py-4">
                        <Link href={`/team/wnba/${team.abbr.toLowerCase()}`} className="flex items-center gap-3 hover:text-orange-400">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500/20 to-pink-500/20 flex items-center justify-center text-lg font-bold text-white">
                            {team.abbr.substring(0, 2)}
                          </div>
                          <span className="font-semibold text-white">{team.team}</span>
                        </Link>
                      </td>
                      <td className="px-4 py-4 text-center font-bold text-white">{team.record}</td>
                      <td className="px-4 py-4 text-center text-green-400">{team.ppg > 0 ? team.ppg.toFixed(1) : '—'}</td>
                      <td className="px-4 py-4 text-center text-red-400">{team.papg > 0 ? team.papg.toFixed(1) : '—'}</td>
                      <td className="px-4 py-4 text-center">
                        <span className={parseFloat(team.diff) > 0 ? 'text-green-400' : parseFloat(team.diff) < 0 ? 'text-red-400' : 'text-gray-400'}>
                          {team.diff !== '0' ? team.diff : '—'}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className={team.streak.startsWith('W') ? 'text-green-400' : team.streak.startsWith('L') ? 'text-red-400' : 'text-gray-500'}>
                          {team.streak}
                        </span>
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
