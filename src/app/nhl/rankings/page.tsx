'use client'

import Link from 'next/link'
import { useState } from 'react'
import { ArrowLeft, Search, TrendingUp, Shield, Zap, ArrowUpRight, ArrowDownRight } from 'lucide-react'

const teamRankings = [
  { rank: 1, team: 'Winnipeg Jets', abbr: 'WPG', record: '32-12-3', gf: 158, ga: 108, diff: '+50', ppPct: 24.8, pkPct: 84.2, corsi: 54.2, change: 0 },
  { rank: 2, team: 'Washington Capitals', abbr: 'WSH', record: '29-12-5', gf: 162, ga: 124, diff: '+38', ppPct: 26.4, pkPct: 81.6, corsi: 51.8, change: 1 },
  { rank: 3, team: 'Vegas Golden Knights', abbr: 'VGK', record: '28-13-5', gf: 148, ga: 112, diff: '+36', ppPct: 22.6, pkPct: 82.4, corsi: 52.4, change: -1 },
  { rank: 4, team: 'Toronto Maple Leafs', abbr: 'TOR', record: '28-16-2', gf: 156, ga: 128, diff: '+28', ppPct: 25.2, pkPct: 80.8, corsi: 53.6, change: 2 },
  { rank: 5, team: 'Carolina Hurricanes', abbr: 'CAR', record: '27-15-3', gf: 142, ga: 116, diff: '+26', ppPct: 21.4, pkPct: 83.6, corsi: 55.8, change: 0 },
  { rank: 6, team: 'Florida Panthers', abbr: 'FLA', record: '27-15-3', gf: 148, ga: 124, diff: '+24', ppPct: 23.8, pkPct: 79.2, corsi: 52.8, change: -2 },
  { rank: 7, team: 'Minnesota Wild', abbr: 'MIN', record: '27-14-4', gf: 138, ga: 118, diff: '+20', ppPct: 20.6, pkPct: 84.8, corsi: 50.4, change: 1 },
  { rank: 8, team: 'Dallas Stars', abbr: 'DAL', record: '27-16-1', gf: 136, ga: 118, diff: '+18', ppPct: 22.2, pkPct: 82.6, corsi: 53.2, change: -1 },
  { rank: 9, team: 'New Jersey Devils', abbr: 'NJD', record: '26-17-4', gf: 152, ga: 136, diff: '+16', ppPct: 24.4, pkPct: 78.4, corsi: 51.2, change: 0 },
  { rank: 10, team: 'Colorado Avalanche', abbr: 'COL', record: '26-18-2', gf: 162, ga: 146, diff: '+16', ppPct: 28.2, pkPct: 76.8, corsi: 52.6, change: 0 },
]

export default function NHLRankingsPage() {
  const [searchQuery, setSearchQuery] = useState('')

  const filteredRankings = teamRankings.filter(team =>
    team.team.toLowerCase().includes(searchQuery.toLowerCase()) ||
    team.abbr.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-[#050508]">
      <div className="border-b border-white/5 bg-gradient-to-b from-[#0a0a12] to-[#050508]">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <Link href="/nhl" className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to NHL
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-4xl">🏒</span>
            <h1 className="text-3xl font-black text-white">NHL Team Rankings</h1>
            <span className="px-2 py-1 rounded-md text-xs font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">2024-25</span>
          </div>
          <p className="text-gray-400">Power rankings, offense & defense stats for all 32 teams</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input type="text" placeholder="Search teams..." value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50" />
        </div>

        <div className="rounded-2xl border border-white/10 overflow-hidden bg-[#0c0c14]">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="px-4 py-4 text-left text-xs font-bold text-gray-500 uppercase">Rank</th>
                  <th className="px-4 py-4 text-left text-xs font-bold text-gray-500 uppercase">Team</th>
                  <th className="px-4 py-4 text-center text-xs font-bold text-gray-500 uppercase">Record</th>
                  <th className="px-4 py-4 text-center text-xs font-bold text-gray-500 uppercase">GF</th>
                  <th className="px-4 py-4 text-center text-xs font-bold text-gray-500 uppercase">GA</th>
                  <th className="px-4 py-4 text-center text-xs font-bold text-gray-500 uppercase">DIFF</th>
                  <th className="px-4 py-4 text-center text-xs font-bold text-gray-500 uppercase">PP%</th>
                  <th className="px-4 py-4 text-center text-xs font-bold text-gray-500 uppercase">PK%</th>
                  <th className="px-4 py-4 text-center text-xs font-bold text-blue-500 uppercase">CF%</th>
                  <th className="px-4 py-4 text-center text-xs font-bold text-gray-500 uppercase">Δ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredRankings.map((team) => (
                  <tr key={team.abbr} className="hover:bg-white/5 transition-colors">
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg text-sm font-bold ${
                        team.rank <= 3 ? 'bg-blue-500/20 text-blue-400' : 'bg-white/10 text-gray-400'
                      }`}>{team.rank}</span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 flex items-center justify-center text-lg font-bold text-white">
                          {team.abbr.substring(0, 2)}
                        </div>
                        <div>
                          <div className="font-semibold text-white">{team.team}</div>
                          <div className="text-xs text-gray-500">{team.abbr}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center text-white font-medium">{team.record}</td>
                    <td className="px-4 py-4 text-center text-green-400 font-semibold">{team.gf}</td>
                    <td className="px-4 py-4 text-center text-red-400 font-semibold">{team.ga}</td>
                    <td className="px-4 py-4 text-center"><span className={`font-bold ${team.diff.startsWith('+') ? 'text-green-400' : 'text-red-400'}`}>{team.diff}</span></td>
                    <td className="px-4 py-4 text-center text-white">{team.ppPct}%</td>
                    <td className="px-4 py-4 text-center text-white">{team.pkPct}%</td>
                    <td className="px-4 py-4 text-center"><span className="px-2 py-1 rounded-lg bg-blue-500/20 text-blue-400 font-bold">{team.corsi}%</span></td>
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
          <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-500/10 to-indigo-500/5 border border-blue-500/20">
            <div className="flex items-center gap-2 mb-3"><Zap className="w-5 h-5 text-blue-400" /><h3 className="font-bold text-white">Best Offense</h3></div>
            <div className="text-2xl font-black text-blue-400">Colorado Avalanche</div>
            <div className="text-sm text-gray-400">162 GF • 28.2% PP</div>
          </div>
          <div className="p-5 rounded-2xl bg-gradient-to-br from-green-500/10 to-emerald-500/5 border border-green-500/20">
            <div className="flex items-center gap-2 mb-3"><Shield className="w-5 h-5 text-green-400" /><h3 className="font-bold text-white">Best Defense</h3></div>
            <div className="text-2xl font-black text-green-400">Winnipeg Jets</div>
            <div className="text-sm text-gray-400">108 GA • 84.2% PK</div>
          </div>
          <div className="p-5 rounded-2xl bg-gradient-to-br from-orange-500/10 to-red-500/5 border border-orange-500/20">
            <div className="flex items-center gap-2 mb-3"><TrendingUp className="w-5 h-5 text-orange-400" /><h3 className="font-bold text-white">Best Corsi</h3></div>
            <div className="text-2xl font-black text-orange-400">Carolina Hurricanes</div>
            <div className="text-sm text-gray-400">55.8% CF • Puck possession kings</div>
          </div>
        </div>
      </div>
    </div>
  )
}
