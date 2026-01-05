'use client'

import Link from 'next/link'
import { useState } from 'react'
import { ArrowLeft, Search, TrendingUp, Shield, Zap, ArrowUpRight, ArrowDownRight } from 'lucide-react'

const teamRankings = [
  { rank: 1, team: 'Duke Blue Devils', abbr: 'DUKE', conf: 'ACC', record: '16-2', ppg: 82.4, papg: 64.2, diff: '+18.2', orpg: 12.8, drpg: 28.4, change: 0 },
  { rank: 2, team: 'Auburn Tigers', abbr: 'AUB', conf: 'SEC', record: '16-1', ppg: 78.6, papg: 62.8, diff: '+15.8', orpg: 11.4, drpg: 29.2, change: 1 },
  { rank: 3, team: 'Iowa State Cyclones', abbr: 'ISU', conf: 'Big 12', record: '15-2', ppg: 76.4, papg: 61.4, diff: '+15.0', orpg: 10.8, drpg: 27.6, change: -1 },
  { rank: 4, team: 'Alabama Crimson Tide', abbr: 'ALA', conf: 'SEC', record: '14-3', ppg: 84.2, papg: 70.6, diff: '+13.6', orpg: 13.2, drpg: 26.8, change: 2 },
  { rank: 5, team: 'Florida Gators', abbr: 'FLA', conf: 'SEC', record: '15-2', ppg: 80.4, papg: 68.2, diff: '+12.2', orpg: 12.4, drpg: 28.8, change: 0 },
  { rank: 6, team: 'Tennessee Volunteers', abbr: 'TENN', conf: 'SEC', record: '15-2', ppg: 75.8, papg: 62.4, diff: '+13.4', orpg: 11.6, drpg: 30.2, change: -2 },
  { rank: 7, team: 'Houston Cougars', abbr: 'HOU', conf: 'Big 12', record: '13-4', ppg: 72.6, papg: 59.8, diff: '+12.8', orpg: 10.2, drpg: 31.4, change: 1 },
  { rank: 8, team: 'Kansas Jayhawks', abbr: 'KU', conf: 'Big 12', record: '13-4', ppg: 79.4, papg: 68.6, diff: '+10.8', orpg: 11.8, drpg: 26.4, change: -1 },
  { rank: 9, team: 'UConn Huskies', abbr: 'UCONN', conf: 'Big East', record: '14-4', ppg: 81.2, papg: 72.4, diff: '+8.8', orpg: 12.2, drpg: 27.8, change: 0 },
  { rank: 10, team: 'Purdue Boilermakers', abbr: 'PUR', conf: 'Big Ten', record: '14-4', ppg: 77.6, papg: 69.2, diff: '+8.4', orpg: 10.6, drpg: 28.2, change: 0 },
]

export default function NCAABRankingsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [confFilter, setConfFilter] = useState('all')

  const filteredRankings = teamRankings.filter(team => {
    const matchesSearch = team.team.toLowerCase().includes(searchQuery.toLowerCase()) || team.abbr.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesConf = confFilter === 'all' || team.conf === confFilter
    return matchesSearch && matchesConf
  })

  return (
    <div className="min-h-screen bg-[#050508]">
      <div className="border-b border-white/5 bg-gradient-to-b from-[#0a0a12] to-[#050508]">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <Link href="/ncaab" className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to NCAAB
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-4xl">🏀</span>
            <h1 className="text-3xl font-black text-white">NCAAB Team Rankings</h1>
            <span className="px-2 py-1 rounded-md text-xs font-bold bg-orange-500/20 text-orange-400 border border-orange-500/30">2024-25</span>
          </div>
          <p className="text-gray-400">AP Top 25, offense & defense stats for all Division I teams</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input type="text" placeholder="Search teams..." value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500/50" />
          </div>
          <select value={confFilter} onChange={(e) => setConfFilter(e.target.value)} aria-label="Filter by conference"
            className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-orange-500/50">
            <option value="all">All Conferences</option>
            <option value="SEC">SEC</option>
            <option value="Big Ten">Big Ten</option>
            <option value="ACC">ACC</option>
            <option value="Big 12">Big 12</option>
            <option value="Big East">Big East</option>
            <option value="Pac-12">Pac-12</option>
          </select>
        </div>

        <div className="rounded-2xl border border-white/10 overflow-hidden bg-[#0c0c14]">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="px-4 py-4 text-left text-xs font-bold text-gray-500 uppercase">Rank</th>
                  <th className="px-4 py-4 text-left text-xs font-bold text-gray-500 uppercase">Team</th>
                  <th className="px-4 py-4 text-center text-xs font-bold text-gray-500 uppercase">Conf</th>
                  <th className="px-4 py-4 text-center text-xs font-bold text-gray-500 uppercase">Record</th>
                  <th className="px-4 py-4 text-center text-xs font-bold text-gray-500 uppercase">PPG</th>
                  <th className="px-4 py-4 text-center text-xs font-bold text-gray-500 uppercase">PAPG</th>
                  <th className="px-4 py-4 text-center text-xs font-bold text-gray-500 uppercase">DIFF</th>
                  <th className="px-4 py-4 text-center text-xs font-bold text-gray-500 uppercase">ORPG</th>
                  <th className="px-4 py-4 text-center text-xs font-bold text-orange-500 uppercase">DRPG</th>
                  <th className="px-4 py-4 text-center text-xs font-bold text-gray-500 uppercase">Δ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredRankings.map((team) => (
                  <tr key={team.abbr} className="hover:bg-white/5 transition-colors">
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg text-sm font-bold ${
                        team.rank <= 4 ? 'bg-orange-500/20 text-orange-400' : 'bg-white/10 text-gray-400'
                      }`}>{team.rank}</span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500/20 to-amber-500/20 flex items-center justify-center text-lg font-bold text-white">
                          {team.abbr.substring(0, 2)}
                        </div>
                        <div>
                          <div className="font-semibold text-white">{team.team}</div>
                          <div className="text-xs text-gray-500">{team.abbr}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center"><span className="px-2 py-1 rounded-lg bg-white/10 text-gray-300 text-sm">{team.conf}</span></td>
                    <td className="px-4 py-4 text-center text-white font-medium">{team.record}</td>
                    <td className="px-4 py-4 text-center text-green-400 font-semibold">{team.ppg}</td>
                    <td className="px-4 py-4 text-center text-red-400 font-semibold">{team.papg}</td>
                    <td className="px-4 py-4 text-center"><span className={`font-bold ${team.diff.startsWith('+') ? 'text-green-400' : 'text-red-400'}`}>{team.diff}</span></td>
                    <td className="px-4 py-4 text-center text-white">{team.orpg}</td>
                    <td className="px-4 py-4 text-center"><span className="px-2 py-1 rounded-lg bg-orange-500/20 text-orange-400 font-bold">{team.drpg}</span></td>
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
          <div className="p-5 rounded-2xl bg-gradient-to-br from-orange-500/10 to-amber-500/5 border border-orange-500/20">
            <div className="flex items-center gap-2 mb-3"><Zap className="w-5 h-5 text-orange-400" /><h3 className="font-bold text-white">Best Offense</h3></div>
            <div className="text-2xl font-black text-orange-400">Alabama</div>
            <div className="text-sm text-gray-400">84.2 PPG • 13.2 ORPG</div>
          </div>
          <div className="p-5 rounded-2xl bg-gradient-to-br from-green-500/10 to-emerald-500/5 border border-green-500/20">
            <div className="flex items-center gap-2 mb-3"><Shield className="w-5 h-5 text-green-400" /><h3 className="font-bold text-white">Best Defense</h3></div>
            <div className="text-2xl font-black text-green-400">Houston</div>
            <div className="text-sm text-gray-400">59.8 PAPG • 31.4 DRPG</div>
          </div>
          <div className="p-5 rounded-2xl bg-gradient-to-br from-purple-500/10 to-pink-500/5 border border-purple-500/20">
            <div className="flex items-center gap-2 mb-3"><TrendingUp className="w-5 h-5 text-purple-400" /><h3 className="font-bold text-white">March Madness Bound</h3></div>
            <div className="text-2xl font-black text-purple-400">Duke</div>
            <div className="text-sm text-gray-400">#1 seed projection • Coach K legacy</div>
          </div>
        </div>
      </div>
    </div>
  )
}
