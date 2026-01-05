'use client'

import Link from 'next/link'
import { useState } from 'react'
import { ArrowLeft, Search, TrendingUp, Shield, Zap, ArrowUpRight, ArrowDownRight } from 'lucide-react'

const teamRankings = [
  { rank: 1, team: 'Los Angeles Dodgers', abbr: 'LAD', record: '98-64', rs: 842, ra: 638, diff: '+204', era: 3.48, ops: .788, war: 58.2, change: 0 },
  { rank: 2, team: 'Philadelphia Phillies', abbr: 'PHI', record: '95-67', rs: 798, ra: 652, diff: '+146', era: 3.72, ops: .752, war: 52.4, change: 1 },
  { rank: 3, team: 'New York Yankees', abbr: 'NYY', record: '94-68', rs: 806, ra: 678, diff: '+128', era: 3.84, ops: .768, war: 48.6, change: -1 },
  { rank: 4, team: 'Cleveland Guardians', abbr: 'CLE', record: '92-70', rs: 714, ra: 624, diff: '+90', era: 3.56, ops: .712, war: 46.8, change: 2 },
  { rank: 5, team: 'Milwaukee Brewers', abbr: 'MIL', record: '93-69', rs: 758, ra: 678, diff: '+80', era: 3.98, ops: .736, war: 44.2, change: 0 },
  { rank: 6, team: 'Baltimore Orioles', abbr: 'BAL', record: '91-71', rs: 784, ra: 716, diff: '+68', era: 4.12, ops: .758, war: 42.8, change: -2 },
  { rank: 7, team: 'Atlanta Braves', abbr: 'ATL', record: '89-73', rs: 762, ra: 698, diff: '+64', era: 3.92, ops: .742, war: 41.4, change: 1 },
  { rank: 8, team: 'Houston Astros', abbr: 'HOU', record: '88-74', rs: 746, ra: 694, diff: '+52', era: 3.86, ops: .734, war: 40.2, change: -1 },
  { rank: 9, team: 'San Diego Padres', abbr: 'SD', record: '93-69', rs: 772, ra: 724, diff: '+48', era: 4.02, ops: .748, war: 38.6, change: 0 },
  { rank: 10, team: 'Kansas City Royals', abbr: 'KC', record: '86-76', rs: 702, ra: 656, diff: '+46', era: 3.78, ops: .708, war: 36.8, change: 0 },
]

export default function MLBRankingsPage() {
  const [searchQuery, setSearchQuery] = useState('')

  const filteredRankings = teamRankings.filter(team =>
    team.team.toLowerCase().includes(searchQuery.toLowerCase()) ||
    team.abbr.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-[#050508]">
      <div className="border-b border-white/5 bg-gradient-to-b from-[#0a0a12] to-[#050508]">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <Link href="/mlb" className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to MLB
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-4xl">⚾</span>
            <h1 className="text-3xl font-black text-white">MLB Team Rankings</h1>
            <span className="px-2 py-1 rounded-md text-xs font-bold bg-red-500/20 text-red-400 border border-red-500/30">2024</span>
          </div>
          <p className="text-gray-400">Power rankings, offense & pitching stats for all 30 teams</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input type="text" placeholder="Search teams..." value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-red-500/50" />
        </div>

        <div className="rounded-2xl border border-white/10 overflow-hidden bg-[#0c0c14]">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="px-4 py-4 text-left text-xs font-bold text-gray-500 uppercase">Rank</th>
                  <th className="px-4 py-4 text-left text-xs font-bold text-gray-500 uppercase">Team</th>
                  <th className="px-4 py-4 text-center text-xs font-bold text-gray-500 uppercase">Record</th>
                  <th className="px-4 py-4 text-center text-xs font-bold text-gray-500 uppercase">RS</th>
                  <th className="px-4 py-4 text-center text-xs font-bold text-gray-500 uppercase">RA</th>
                  <th className="px-4 py-4 text-center text-xs font-bold text-gray-500 uppercase">DIFF</th>
                  <th className="px-4 py-4 text-center text-xs font-bold text-gray-500 uppercase">ERA</th>
                  <th className="px-4 py-4 text-center text-xs font-bold text-gray-500 uppercase">OPS</th>
                  <th className="px-4 py-4 text-center text-xs font-bold text-red-500 uppercase">WAR</th>
                  <th className="px-4 py-4 text-center text-xs font-bold text-gray-500 uppercase">Δ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredRankings.map((team) => (
                  <tr key={team.abbr} className="hover:bg-white/5 transition-colors">
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg text-sm font-bold ${
                        team.rank <= 3 ? 'bg-red-500/20 text-red-400' : 'bg-white/10 text-gray-400'
                      }`}>{team.rank}</span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500/20 to-orange-500/20 flex items-center justify-center text-lg font-bold text-white">
                          {team.abbr.substring(0, 2)}
                        </div>
                        <div>
                          <div className="font-semibold text-white">{team.team}</div>
                          <div className="text-xs text-gray-500">{team.abbr}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center text-white font-medium">{team.record}</td>
                    <td className="px-4 py-4 text-center text-green-400 font-semibold">{team.rs}</td>
                    <td className="px-4 py-4 text-center text-red-400 font-semibold">{team.ra}</td>
                    <td className="px-4 py-4 text-center"><span className={`font-bold ${team.diff.startsWith('+') ? 'text-green-400' : 'text-red-400'}`}>{team.diff}</span></td>
                    <td className="px-4 py-4 text-center text-white">{team.era.toFixed(2)}</td>
                    <td className="px-4 py-4 text-center text-white">{team.ops.toFixed(3)}</td>
                    <td className="px-4 py-4 text-center"><span className="px-2 py-1 rounded-lg bg-red-500/20 text-red-400 font-bold">{team.war}</span></td>
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
          <div className="p-5 rounded-2xl bg-gradient-to-br from-red-500/10 to-orange-500/5 border border-red-500/20">
            <div className="flex items-center gap-2 mb-3"><Zap className="w-5 h-5 text-red-400" /><h3 className="font-bold text-white">Best Offense</h3></div>
            <div className="text-2xl font-black text-red-400">Los Angeles Dodgers</div>
            <div className="text-sm text-gray-400">842 RS • .788 OPS</div>
          </div>
          <div className="p-5 rounded-2xl bg-gradient-to-br from-green-500/10 to-emerald-500/5 border border-green-500/20">
            <div className="flex items-center gap-2 mb-3"><Shield className="w-5 h-5 text-green-400" /><h3 className="font-bold text-white">Best Pitching</h3></div>
            <div className="text-2xl font-black text-green-400">Los Angeles Dodgers</div>
            <div className="text-sm text-gray-400">3.48 ERA • 638 RA</div>
          </div>
          <div className="p-5 rounded-2xl bg-gradient-to-br from-purple-500/10 to-pink-500/5 border border-purple-500/20">
            <div className="flex items-center gap-2 mb-3"><TrendingUp className="w-5 h-5 text-purple-400" /><h3 className="font-bold text-white">Best WAR</h3></div>
            <div className="text-2xl font-black text-purple-400">Los Angeles Dodgers</div>
            <div className="text-sm text-gray-400">58.2 WAR • Most valuable roster</div>
          </div>
        </div>
      </div>
    </div>
  )
}
