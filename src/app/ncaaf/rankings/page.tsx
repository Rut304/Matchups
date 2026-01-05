'use client'

import Link from 'next/link'
import { useState } from 'react'
import { ArrowLeft, Search, TrendingUp, Shield, Zap, ArrowUpRight, ArrowDownRight } from 'lucide-react'

const teamRankings = [
  { rank: 1, team: 'Georgia Bulldogs', abbr: 'UGA', conf: 'SEC', record: '12-1', ppg: 38.4, papg: 16.2, diff: '+22.2', ypg: 468, oypg: 278, change: 0 },
  { rank: 2, team: 'Ohio State Buckeyes', abbr: 'OSU', conf: 'B1G', record: '11-2', ppg: 41.8, papg: 18.6, diff: '+23.2', ypg: 482, oypg: 294, change: 1 },
  { rank: 3, team: 'Texas Longhorns', abbr: 'TEX', conf: 'SEC', record: '12-2', ppg: 36.2, papg: 14.8, diff: '+21.4', ypg: 442, oypg: 268, change: -1 },
  { rank: 4, team: 'Penn State Nittany Lions', abbr: 'PSU', conf: 'B1G', record: '11-2', ppg: 34.6, papg: 17.4, diff: '+17.2', ypg: 424, oypg: 286, change: 2 },
  { rank: 5, team: 'Notre Dame Fighting Irish', abbr: 'ND', conf: 'IND', record: '12-1', ppg: 32.8, papg: 15.2, diff: '+17.6', ypg: 406, oypg: 272, change: 0 },
  { rank: 6, team: 'Oregon Ducks', abbr: 'ORE', conf: 'B1G', record: '13-0', ppg: 38.6, papg: 19.8, diff: '+18.8', ypg: 458, oypg: 312, change: -2 },
  { rank: 7, team: 'Tennessee Volunteers', abbr: 'TENN', conf: 'SEC', record: '10-3', ppg: 35.4, papg: 20.2, diff: '+15.2', ypg: 446, oypg: 324, change: 1 },
  { rank: 8, team: 'Alabama Crimson Tide', abbr: 'ALA', conf: 'SEC', record: '9-4', ppg: 33.8, papg: 21.4, diff: '+12.4', ypg: 432, oypg: 336, change: -1 },
  { rank: 9, team: 'Ole Miss Rebels', abbr: 'MISS', conf: 'SEC', record: '9-4', ppg: 37.2, papg: 22.6, diff: '+14.6', ypg: 478, oypg: 348, change: 0 },
  { rank: 10, team: 'Boise State Broncos', abbr: 'BSU', conf: 'MWC', record: '12-1', ppg: 36.8, papg: 18.4, diff: '+18.4', ypg: 452, oypg: 298, change: 0 },
]

export default function NCAAFRankingsPage() {
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
          <Link href="/ncaaf" className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to NCAAF
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-4xl">🏈</span>
            <h1 className="text-3xl font-black text-white">NCAAF Team Rankings</h1>
            <span className="px-2 py-1 rounded-md text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">2024</span>
          </div>
          <p className="text-gray-400">College Football Playoff rankings, offense & defense stats</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input type="text" placeholder="Search teams..." value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/50" />
          </div>
          <select value={confFilter} onChange={(e) => setConfFilter(e.target.value)} aria-label="Filter by conference"
            className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-amber-500/50">
            <option value="all">All Conferences</option>
            <option value="SEC">SEC</option>
            <option value="B1G">Big Ten</option>
            <option value="ACC">ACC</option>
            <option value="Big 12">Big 12</option>
            <option value="MWC">Mountain West</option>
            <option value="IND">Independent</option>
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
                  <th className="px-4 py-4 text-center text-xs font-bold text-gray-500 uppercase">YPG</th>
                  <th className="px-4 py-4 text-center text-xs font-bold text-amber-500 uppercase">OYPG</th>
                  <th className="px-4 py-4 text-center text-xs font-bold text-gray-500 uppercase">Δ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredRankings.map((team) => (
                  <tr key={team.abbr} className="hover:bg-white/5 transition-colors">
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg text-sm font-bold ${
                        team.rank <= 4 ? 'bg-amber-500/20 text-amber-400' : 'bg-white/10 text-gray-400'
                      }`}>{team.rank}</span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center text-lg font-bold text-white">
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
                    <td className="px-4 py-4 text-center text-white">{team.ypg}</td>
                    <td className="px-4 py-4 text-center"><span className="px-2 py-1 rounded-lg bg-amber-500/20 text-amber-400 font-bold">{team.oypg}</span></td>
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
          <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-500/10 to-orange-500/5 border border-amber-500/20">
            <div className="flex items-center gap-2 mb-3"><Zap className="w-5 h-5 text-amber-400" /><h3 className="font-bold text-white">Best Offense</h3></div>
            <div className="text-2xl font-black text-amber-400">Ohio State</div>
            <div className="text-sm text-gray-400">41.8 PPG • 482 YPG</div>
          </div>
          <div className="p-5 rounded-2xl bg-gradient-to-br from-green-500/10 to-emerald-500/5 border border-green-500/20">
            <div className="flex items-center gap-2 mb-3"><Shield className="w-5 h-5 text-green-400" /><h3 className="font-bold text-white">Best Defense</h3></div>
            <div className="text-2xl font-black text-green-400">Texas</div>
            <div className="text-sm text-gray-400">14.8 PAPG • 268 OYPG</div>
          </div>
          <div className="p-5 rounded-2xl bg-gradient-to-br from-purple-500/10 to-pink-500/5 border border-purple-500/20">
            <div className="flex items-center gap-2 mb-3"><TrendingUp className="w-5 h-5 text-purple-400" /><h3 className="font-bold text-white">CFP Bound</h3></div>
            <div className="text-2xl font-black text-purple-400">Oregon</div>
            <div className="text-sm text-gray-400">13-0 • Only undefeated P4 team</div>
          </div>
        </div>
      </div>
    </div>
  )
}
