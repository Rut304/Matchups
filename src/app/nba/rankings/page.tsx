'use client'

import Link from 'next/link'
import { useState } from 'react'
import { ArrowLeft, Search, TrendingUp, Shield, Zap, ArrowUpRight, ArrowDownRight } from 'lucide-react'

const teamRankings = [
  { rank: 1, team: 'Oklahoma City Thunder', abbr: 'OKC', record: '38-8', ppg: 120.4, papg: 106.2, diff: '+14.2', ortg: 120.4, drtg: 106.2, netRtg: 12.8, change: 0 },
  { rank: 2, team: 'Cleveland Cavaliers', abbr: 'CLE', record: '36-9', ppg: 118.6, papg: 108.4, diff: '+10.2', ortg: 118.6, drtg: 108.4, netRtg: 10.4, change: 0 },
  { rank: 3, team: 'Boston Celtics', abbr: 'BOS', record: '33-14', ppg: 117.8, papg: 110.2, diff: '+7.6', ortg: 117.8, drtg: 110.2, netRtg: 8.2, change: 1 },
  { rank: 4, team: 'Memphis Grizzlies', abbr: 'MEM', record: '30-16', ppg: 119.2, papg: 112.8, diff: '+6.4', ortg: 119.2, drtg: 112.8, netRtg: 6.8, change: 2 },
  { rank: 5, team: 'Houston Rockets', abbr: 'HOU', record: '30-16', ppg: 112.4, papg: 107.2, diff: '+5.2', ortg: 112.4, drtg: 107.2, netRtg: 5.6, change: -2 },
  { rank: 6, team: 'New York Knicks', abbr: 'NYK', record: '30-17', ppg: 115.6, papg: 110.4, diff: '+5.2', ortg: 115.6, drtg: 110.4, netRtg: 5.4, change: -1 },
  { rank: 7, team: 'Denver Nuggets', abbr: 'DEN', record: '28-18', ppg: 116.2, papg: 112.6, diff: '+3.6', ortg: 116.2, drtg: 112.6, netRtg: 3.8, change: 0 },
  { rank: 8, team: 'LA Clippers', abbr: 'LAC', record: '26-20', ppg: 108.4, papg: 106.2, diff: '+2.2', ortg: 108.4, drtg: 106.2, netRtg: 2.4, change: 1 },
  { rank: 9, team: 'Dallas Mavericks', abbr: 'DAL', record: '26-21', ppg: 114.8, papg: 112.8, diff: '+2.0', ortg: 114.8, drtg: 112.8, netRtg: 2.2, change: -1 },
  { rank: 10, team: 'Milwaukee Bucks', abbr: 'MIL', record: '25-21', ppg: 112.6, papg: 111.2, diff: '+1.4', ortg: 112.6, drtg: 111.2, netRtg: 1.6, change: 0 },
]

export default function NBARankingsPage() {
  const [searchQuery, setSearchQuery] = useState('')

  const filteredRankings = teamRankings.filter(team =>
    team.team.toLowerCase().includes(searchQuery.toLowerCase()) ||
    team.abbr.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-[#050508]">
      <div className="border-b border-white/5 bg-gradient-to-b from-[#0a0a12] to-[#050508]">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <Link href="/nba" className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to NBA
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-4xl">🏀</span>
            <h1 className="text-3xl font-black text-white">NBA Team Rankings</h1>
            <span className="px-2 py-1 rounded-md text-xs font-bold bg-orange-500/20 text-orange-400 border border-orange-500/30">2024-25</span>
          </div>
          <p className="text-gray-400">Power rankings, offense & defense stats for all 30 teams</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input type="text" placeholder="Search teams..." value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500/50" />
        </div>

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
                  <th className="px-4 py-4 text-center text-xs font-bold text-green-500 uppercase">ORTG</th>
                  <th className="px-4 py-4 text-center text-xs font-bold text-red-500 uppercase">DRTG</th>
                  <th className="px-4 py-4 text-center text-xs font-bold text-orange-500 uppercase">NET RTG</th>
                  <th className="px-4 py-4 text-center text-xs font-bold text-gray-500 uppercase">Δ</th>
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
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500/20 to-red-500/20 flex items-center justify-center text-lg font-bold text-white">
                          {team.abbr.substring(0, 2)}
                        </div>
                        <div>
                          <div className="font-semibold text-white">{team.team}</div>
                          <div className="text-xs text-gray-500">{team.abbr}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center text-white font-medium">{team.record}</td>
                    <td className="px-4 py-4 text-center text-green-400 font-semibold">{team.ppg}</td>
                    <td className="px-4 py-4 text-center text-red-400 font-semibold">{team.papg}</td>
                    <td className="px-4 py-4 text-center"><span className={`font-bold ${team.diff.startsWith('+') ? 'text-green-400' : 'text-red-400'}`}>{team.diff}</span></td>
                    <td className="px-4 py-4 text-center"><span className="px-2 py-1 rounded-lg bg-green-500/20 text-green-400 font-bold">{team.ortg}</span></td>
                    <td className="px-4 py-4 text-center"><span className="px-2 py-1 rounded-lg bg-red-500/20 text-red-400 font-bold">{team.drtg}</span></td>
                    <td className="px-4 py-4 text-center"><span className="px-2 py-1 rounded-lg bg-orange-500/20 text-orange-400 font-bold">{team.netRtg}</span></td>
                    <td className="px-4 py-4 text-center">
                      {team.change > 0 && <div className="inline-flex items-center gap-1 text-green-400 text-sm"><ArrowUpRight className="w-4 h-4" />{team.change}</div>}
                      {team.change < 0 && <div className="inline-flex items-center gap-1 text-red-400 text-sm"><ArrowDownRight className="w-4 h-4" />{Math.abs(team.change)}</div>}
                      {team.change === 0 && <div className="w-4 h-0.5 bg-gray-600 mx-auto rounded"></div>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-8 grid md:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-gradient-to-br from-orange-500/10 to-red-500/5 border border-orange-500/20">
            <div className="flex items-center gap-2 mb-3"><Zap className="w-5 h-5 text-orange-400" /><h3 className="font-bold text-white">Best Offense</h3></div>
            <div className="text-2xl font-black text-orange-400">Oklahoma City</div>
            <div className="text-sm text-gray-400">120.4 ORTG • League-best efficiency</div>
          </div>
          <div className="p-5 rounded-2xl bg-gradient-to-br from-green-500/10 to-emerald-500/5 border border-green-500/20">
            <div className="flex items-center gap-2 mb-3"><Shield className="w-5 h-5 text-green-400" /><h3 className="font-bold text-white">Best Defense</h3></div>
            <div className="text-2xl font-black text-green-400">Oklahoma City</div>
            <div className="text-sm text-gray-400">106.2 DRTG • Elite on both ends</div>
          </div>
          <div className="p-5 rounded-2xl bg-gradient-to-br from-purple-500/10 to-pink-500/5 border border-purple-500/20">
            <div className="flex items-center gap-2 mb-3"><TrendingUp className="w-5 h-5 text-purple-400" /><h3 className="font-bold text-white">Championship Favorite</h3></div>
            <div className="text-2xl font-black text-purple-400">OKC Thunder</div>
            <div className="text-sm text-gray-400">+12.8 Net RTG • Historic pace</div>
          </div>
        </div>
      </div>
    </div>
  )
}
