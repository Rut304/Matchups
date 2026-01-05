'use client'

import Link from 'next/link'
import { useState } from 'react'
import { 
  ArrowLeft,
  Search,
  TrendingUp,
  Shield,
  Zap,
  ChevronDown,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react'

type RankingCategory = 'overall' | 'offense' | 'defense' | 'ats'

// Mock NFL team rankings data
const teamRankings = {
  overall: [
    { rank: 1, team: 'Detroit Lions', abbr: 'DET', record: '15-2', pf: 564, pa: 302, diff: '+262', dvoa: 32.4, sos: 0.512, change: 0 },
    { rank: 2, team: 'Kansas City Chiefs', abbr: 'KC', record: '15-2', pf: 476, pa: 296, diff: '+180', dvoa: 28.6, sos: 0.498, change: 0 },
    { rank: 3, team: 'Philadelphia Eagles', abbr: 'PHI', record: '14-3', pf: 468, pa: 298, diff: '+170', dvoa: 24.8, sos: 0.524, change: 1 },
    { rank: 4, team: 'Buffalo Bills', abbr: 'BUF', record: '13-4', pf: 514, pa: 328, diff: '+186', dvoa: 23.2, sos: 0.486, change: -1 },
    { rank: 5, team: 'Baltimore Ravens', abbr: 'BAL', record: '12-5', pf: 508, pa: 342, diff: '+166', dvoa: 18.4, sos: 0.502, change: 2 },
    { rank: 6, team: 'Minnesota Vikings', abbr: 'MIN', record: '14-3', pf: 434, pa: 298, diff: '+136', dvoa: 16.8, sos: 0.478, change: 1 },
    { rank: 7, team: 'Green Bay Packers', abbr: 'GB', record: '11-6', pf: 408, pa: 358, diff: '+50', dvoa: 12.4, sos: 0.504, change: -2 },
    { rank: 8, team: 'Houston Texans', abbr: 'HOU', record: '10-7', pf: 378, pa: 324, diff: '+54', dvoa: 8.6, sos: 0.488, change: 0 },
    { rank: 9, team: 'Washington Commanders', abbr: 'WAS', record: '12-5', pf: 446, pa: 378, diff: '+68', dvoa: 7.2, sos: 0.512, change: 3 },
    { rank: 10, team: 'Los Angeles Chargers', abbr: 'LAC', record: '11-6', pf: 364, pa: 312, diff: '+52', dvoa: 6.8, sos: 0.496, change: -1 },
  ],
  offense: [
    { rank: 1, team: 'Detroit Lions', abbr: 'DET', ppg: 33.2, ypg: 408.6, passYpg: 262.4, rushYpg: 146.2, toGiven: 14, redzonePct: 68.4, thirdDownPct: 48.2, change: 0 },
    { rank: 2, team: 'Baltimore Ravens', abbr: 'BAL', ppg: 29.9, ypg: 394.2, passYpg: 218.6, rushYpg: 175.6, toGiven: 18, redzonePct: 64.2, thirdDownPct: 44.8, change: 1 },
    { rank: 3, team: 'Buffalo Bills', abbr: 'BUF', ppg: 30.2, ypg: 382.4, passYpg: 254.8, rushYpg: 127.6, toGiven: 16, redzonePct: 62.8, thirdDownPct: 46.2, change: -1 },
    { rank: 4, team: 'Tampa Bay Buccaneers', abbr: 'TB', ppg: 28.4, ypg: 374.6, passYpg: 278.2, rushYpg: 96.4, toGiven: 20, redzonePct: 58.6, thirdDownPct: 42.4, change: 2 },
    { rank: 5, team: 'Philadelphia Eagles', abbr: 'PHI', ppg: 27.5, ypg: 368.2, passYpg: 228.4, rushYpg: 139.8, toGiven: 15, redzonePct: 60.4, thirdDownPct: 44.6, change: 0 },
    { rank: 6, team: 'Kansas City Chiefs', abbr: 'KC', ppg: 28.0, ypg: 358.4, passYpg: 246.2, rushYpg: 112.2, toGiven: 12, redzonePct: 66.2, thirdDownPct: 47.8, change: 1 },
    { rank: 7, team: 'Miami Dolphins', abbr: 'MIA', ppg: 26.8, ypg: 366.8, passYpg: 262.4, rushYpg: 104.4, toGiven: 22, redzonePct: 54.2, thirdDownPct: 40.2, change: -3 },
    { rank: 8, team: 'Washington Commanders', abbr: 'WAS', ppg: 26.2, ypg: 352.4, passYpg: 248.6, rushYpg: 103.8, toGiven: 19, redzonePct: 56.8, thirdDownPct: 41.8, change: 4 },
    { rank: 9, team: 'Green Bay Packers', abbr: 'GB', ppg: 24.0, ypg: 346.2, passYpg: 232.8, rushYpg: 113.4, toGiven: 17, redzonePct: 52.4, thirdDownPct: 39.6, change: -1 },
    { rank: 10, team: 'San Francisco 49ers', abbr: 'SF', ppg: 24.8, ypg: 342.8, passYpg: 218.4, rushYpg: 124.4, toGiven: 21, redzonePct: 58.2, thirdDownPct: 43.2, change: -2 },
  ],
  defense: [
    { rank: 1, team: 'Philadelphia Eagles', abbr: 'PHI', ppgAllowed: 17.5, ypgAllowed: 278.4, passYpgAllowed: 186.2, rushYpgAllowed: 92.2, toTaken: 28, sacksTotal: 48, intTotal: 18, change: 0 },
    { rank: 2, team: 'Kansas City Chiefs', abbr: 'KC', ppgAllowed: 17.4, ypgAllowed: 296.2, passYpgAllowed: 198.4, rushYpgAllowed: 97.8, toTaken: 32, sacksTotal: 52, intTotal: 21, change: 1 },
    { rank: 3, team: 'Minnesota Vikings', abbr: 'MIN', ppgAllowed: 17.5, ypgAllowed: 308.6, passYpgAllowed: 212.4, rushYpgAllowed: 96.2, toTaken: 26, sacksTotal: 46, intTotal: 16, change: -1 },
    { rank: 4, team: 'Denver Broncos', abbr: 'DEN', ppgAllowed: 18.2, ypgAllowed: 298.4, passYpgAllowed: 194.6, rushYpgAllowed: 103.8, toTaken: 30, sacksTotal: 54, intTotal: 19, change: 2 },
    { rank: 5, team: 'Pittsburgh Steelers', abbr: 'PIT', ppgAllowed: 19.8, ypgAllowed: 302.6, passYpgAllowed: 208.2, rushYpgAllowed: 94.4, toTaken: 24, sacksTotal: 46, intTotal: 15, change: 0 },
    { rank: 6, team: 'Detroit Lions', abbr: 'DET', ppgAllowed: 17.8, ypgAllowed: 312.4, passYpgAllowed: 218.6, rushYpgAllowed: 93.8, toTaken: 22, sacksTotal: 42, intTotal: 14, change: 3 },
    { rank: 7, team: 'Houston Texans', abbr: 'HOU', ppgAllowed: 19.1, ypgAllowed: 308.2, passYpgAllowed: 202.4, rushYpgAllowed: 105.8, toTaken: 28, sacksTotal: 48, intTotal: 17, change: -2 },
    { rank: 8, team: 'Los Angeles Chargers', abbr: 'LAC', ppgAllowed: 18.4, ypgAllowed: 294.8, passYpgAllowed: 196.2, rushYpgAllowed: 98.6, toTaken: 26, sacksTotal: 44, intTotal: 16, change: 1 },
    { rank: 9, team: 'Buffalo Bills', abbr: 'BUF', ppgAllowed: 19.3, ypgAllowed: 318.6, passYpgAllowed: 224.4, rushYpgAllowed: 94.2, toTaken: 24, sacksTotal: 40, intTotal: 14, change: -3 },
    { rank: 10, team: 'Green Bay Packers', abbr: 'GB', ppgAllowed: 21.1, ypgAllowed: 324.2, passYpgAllowed: 228.6, rushYpgAllowed: 95.6, toTaken: 20, sacksTotal: 38, intTotal: 12, change: 0 },
  ],
  ats: [
    { rank: 1, team: 'Detroit Lions', abbr: 'DET', atsRecord: '12-5', atsWinPct: 70.6, coverMargin: 4.8, homeAts: '7-1', awayAts: '5-4', favAts: '10-4', dogAts: '2-1', change: 0 },
    { rank: 2, team: 'Minnesota Vikings', abbr: 'MIN', atsRecord: '11-6', atsWinPct: 64.7, coverMargin: 3.2, homeAts: '6-2', awayAts: '5-4', favAts: '7-4', dogAts: '4-2', change: 2 },
    { rank: 3, team: 'Washington Commanders', abbr: 'WAS', atsRecord: '11-6', atsWinPct: 64.7, coverMargin: 2.8, homeAts: '5-3', awayAts: '6-3', favAts: '5-3', dogAts: '6-3', change: 5 },
    { rank: 4, team: 'Philadelphia Eagles', abbr: 'PHI', atsRecord: '10-7', atsWinPct: 58.8, coverMargin: 2.4, homeAts: '5-3', awayAts: '5-4', favAts: '8-5', dogAts: '2-2', change: -1 },
    { rank: 5, team: 'Buffalo Bills', abbr: 'BUF', atsRecord: '10-7', atsWinPct: 58.8, coverMargin: 2.1, homeAts: '6-2', awayAts: '4-5', favAts: '8-6', dogAts: '2-1', change: -2 },
    { rank: 6, team: 'Denver Broncos', abbr: 'DEN', atsRecord: '10-7', atsWinPct: 58.8, coverMargin: 1.8, homeAts: '5-3', awayAts: '5-4', favAts: '4-3', dogAts: '6-4', change: 3 },
    { rank: 7, team: 'Green Bay Packers', abbr: 'GB', atsRecord: '9-8', atsWinPct: 52.9, coverMargin: 0.4, homeAts: '4-4', awayAts: '5-4', favAts: '5-5', dogAts: '4-3', change: -3 },
    { rank: 8, team: 'Kansas City Chiefs', abbr: 'KC', atsRecord: '9-8', atsWinPct: 52.9, coverMargin: 0.2, homeAts: '5-3', awayAts: '4-5', favAts: '8-7', dogAts: '1-1', change: -1 },
    { rank: 9, team: 'Houston Texans', abbr: 'HOU', atsRecord: '8-9', atsWinPct: 47.1, coverMargin: -0.4, homeAts: '4-4', awayAts: '4-5', favAts: '5-6', dogAts: '3-3', change: 0 },
    { rank: 10, team: 'Los Angeles Chargers', abbr: 'LAC', atsRecord: '9-8', atsWinPct: 52.9, coverMargin: 0.6, homeAts: '5-3', awayAts: '4-5', favAts: '6-5', dogAts: '3-3', change: 1 },
  ],
}

const divisions = ['All', 'AFC East', 'AFC North', 'AFC South', 'AFC West', 'NFC East', 'NFC North', 'NFC South', 'NFC West']

export default function NFLRankingsPage() {
  const [category, setCategory] = useState<RankingCategory>('overall')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedDivision, setSelectedDivision] = useState('All')

  const currentRankings = teamRankings[category]
  const filteredRankings = currentRankings.filter(team => {
    const matchesSearch = team.team.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         team.abbr.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesSearch
  })

  return (
    <div className="min-h-screen bg-[#050508]">
      {/* Header */}
      <div className="border-b border-white/5 bg-gradient-to-b from-[#0a0a12] to-[#050508]">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <Link href="/nfl" className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to NFL
          </Link>
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-4xl">🏈</span>
                <h1 className="text-3xl font-black text-white">NFL Team Rankings</h1>
                <span className="px-2 py-1 rounded-md text-xs font-bold bg-green-500/20 text-green-400 border border-green-500/30">
                  2025 PLAYOFFS
                </span>
              </div>
              <p className="text-gray-400">Offense, defense, and betting rankings for all 32 teams</p>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-500/10 border border-green-500/20">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                <span className="text-green-400 text-sm font-medium">Updated Daily</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Category Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {[
            { id: 'overall', label: 'Overall', icon: TrendingUp },
            { id: 'offense', label: 'Offense', icon: Zap },
            { id: 'defense', label: 'Defense', icon: Shield },
            { id: 'ats', label: 'ATS Records', icon: TrendingUp },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategory(cat.id as RankingCategory)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold transition-all ${
                category === cat.id
                  ? 'bg-green-500 text-black'
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
              placeholder="Search teams..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-green-500/50"
            />
          </div>
          
          <div className="relative">
            <select
              value={selectedDivision}
              onChange={(e) => setSelectedDivision(e.target.value)}
              aria-label="Filter by division"
              className="appearance-none px-4 py-3 pr-10 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-green-500/50 cursor-pointer"
            >
              {divisions.map(div => (
                <option key={div} value={div} className="bg-[#0a0a12]">{div}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
          </div>
        </div>

        {/* Rankings Table */}
        <div className="rounded-2xl border border-white/10 overflow-hidden bg-[#0c0c14]">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="px-4 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Rank</th>
                  <th className="px-4 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Team</th>
                  {category === 'overall' && (
                    <>
                      <th className="px-4 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Record</th>
                      <th className="px-4 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">PF</th>
                      <th className="px-4 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">PA</th>
                      <th className="px-4 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">DIFF</th>
                      <th className="px-4 py-4 text-center text-xs font-bold text-green-500 uppercase tracking-wider">DVOA</th>
                    </>
                  )}
                  {category === 'offense' && (
                    <>
                      <th className="px-4 py-4 text-center text-xs font-bold text-green-500 uppercase tracking-wider">PPG</th>
                      <th className="px-4 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">YPG</th>
                      <th className="px-4 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">PASS</th>
                      <th className="px-4 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">RUSH</th>
                      <th className="px-4 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">RZ%</th>
                      <th className="px-4 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">3RD%</th>
                    </>
                  )}
                  {category === 'defense' && (
                    <>
                      <th className="px-4 py-4 text-center text-xs font-bold text-green-500 uppercase tracking-wider">PPG</th>
                      <th className="px-4 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">YPG</th>
                      <th className="px-4 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">PASS</th>
                      <th className="px-4 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">RUSH</th>
                      <th className="px-4 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">SACKS</th>
                      <th className="px-4 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">INT</th>
                    </>
                  )}
                  {category === 'ats' && (
                    <>
                      <th className="px-4 py-4 text-center text-xs font-bold text-green-500 uppercase tracking-wider">ATS</th>
                      <th className="px-4 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">WIN%</th>
                      <th className="px-4 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">MARGIN</th>
                      <th className="px-4 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">HOME</th>
                      <th className="px-4 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">AWAY</th>
                      <th className="px-4 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">FAV</th>
                    </>
                  )}
                  <th className="px-4 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Δ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredRankings.map((team) => (
                  <tr key={team.abbr} className="hover:bg-white/5 transition-colors">
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg text-sm font-bold ${
                        team.rank <= 3 ? 'bg-green-500/20 text-green-400' : 
                        team.rank <= 10 ? 'bg-blue-500/20 text-blue-400' : 'bg-white/10 text-gray-400'
                      }`}>
                        {team.rank}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center text-lg font-bold text-white">
                          {team.abbr.substring(0, 2)}
                        </div>
                        <div>
                          <div className="font-semibold text-white">{team.team}</div>
                          <div className="text-xs text-gray-500">{team.abbr}</div>
                        </div>
                      </div>
                    </td>
                    {category === 'overall' && (
                      <>
                        <td className="px-4 py-4 text-center text-white font-medium">{(team as { record: string }).record}</td>
                        <td className="px-4 py-4 text-center text-green-400 font-semibold">{(team as { pf: number }).pf}</td>
                        <td className="px-4 py-4 text-center text-red-400 font-semibold">{(team as { pa: number }).pa}</td>
                        <td className="px-4 py-4 text-center">
                          <span className={`font-bold ${(team as { diff: string }).diff.startsWith('+') ? 'text-green-400' : 'text-red-400'}`}>
                            {(team as { diff: string }).diff}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span className="px-2 py-1 rounded-lg bg-green-500/20 text-green-400 font-bold">
                            {(team as { dvoa: number }).dvoa}%
                          </span>
                        </td>
                      </>
                    )}
                    {category === 'offense' && (
                      <>
                        <td className="px-4 py-4 text-center">
                          <span className="px-2 py-1 rounded-lg bg-green-500/20 text-green-400 font-bold">
                            {(team as { ppg: number }).ppg}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-center text-white font-semibold">{(team as { ypg: number }).ypg}</td>
                        <td className="px-4 py-4 text-center text-gray-400">{(team as { passYpg: number }).passYpg}</td>
                        <td className="px-4 py-4 text-center text-gray-400">{(team as { rushYpg: number }).rushYpg}</td>
                        <td className="px-4 py-4 text-center text-white">{(team as { redzonePct: number }).redzonePct}%</td>
                        <td className="px-4 py-4 text-center text-white">{(team as { thirdDownPct: number }).thirdDownPct}%</td>
                      </>
                    )}
                    {category === 'defense' && (
                      <>
                        <td className="px-4 py-4 text-center">
                          <span className="px-2 py-1 rounded-lg bg-green-500/20 text-green-400 font-bold">
                            {(team as { ppgAllowed: number }).ppgAllowed}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-center text-white font-semibold">{(team as { ypgAllowed: number }).ypgAllowed}</td>
                        <td className="px-4 py-4 text-center text-gray-400">{(team as { passYpgAllowed: number }).passYpgAllowed}</td>
                        <td className="px-4 py-4 text-center text-gray-400">{(team as { rushYpgAllowed: number }).rushYpgAllowed}</td>
                        <td className="px-4 py-4 text-center text-orange-400 font-semibold">{(team as { sacksTotal: number }).sacksTotal}</td>
                        <td className="px-4 py-4 text-center text-blue-400 font-semibold">{(team as { intTotal: number }).intTotal}</td>
                      </>
                    )}
                    {category === 'ats' && (
                      <>
                        <td className="px-4 py-4 text-center">
                          <span className="px-2 py-1 rounded-lg bg-green-500/20 text-green-400 font-bold">
                            {(team as { atsRecord: string }).atsRecord}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-center text-white font-semibold">{(team as { atsWinPct: number }).atsWinPct}%</td>
                        <td className="px-4 py-4 text-center">
                          <span className={`font-bold ${(team as { coverMargin: number }).coverMargin > 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {(team as { coverMargin: number }).coverMargin > 0 ? '+' : ''}{(team as { coverMargin: number }).coverMargin}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-center text-gray-400">{(team as { homeAts: string }).homeAts}</td>
                        <td className="px-4 py-4 text-center text-gray-400">{(team as { awayAts: string }).awayAts}</td>
                        <td className="px-4 py-4 text-center text-gray-400">{(team as { favAts: string }).favAts}</td>
                      </>
                    )}
                    <td className="px-4 py-4 text-center">
                      {team.change > 0 && (
                        <div className="inline-flex items-center gap-1 text-green-400 text-sm">
                          <ArrowUpRight className="w-4 h-4" />
                          <span>{team.change}</span>
                        </div>
                      )}
                      {team.change < 0 && (
                        <div className="inline-flex items-center gap-1 text-red-400 text-sm">
                          <ArrowDownRight className="w-4 h-4" />
                          <span>{Math.abs(team.change)}</span>
                        </div>
                      )}
                      {team.change === 0 && (
                        <div className="w-4 h-0.5 bg-gray-600 mx-auto rounded"></div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Key Insights */}
        <div className="mt-8 grid md:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-gradient-to-br from-green-500/10 to-emerald-500/5 border border-green-500/20">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-5 h-5 text-green-400" />
              <h3 className="font-bold text-white">Best Offense</h3>
            </div>
            <div className="text-2xl font-black text-green-400">Detroit Lions</div>
            <div className="text-sm text-gray-400">33.2 PPG • #1 in scoring</div>
          </div>
          
          <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-500/10 to-indigo-500/5 border border-blue-500/20">
            <div className="flex items-center gap-2 mb-3">
              <Shield className="w-5 h-5 text-blue-400" />
              <h3 className="font-bold text-white">Best Defense</h3>
            </div>
            <div className="text-2xl font-black text-blue-400">Philadelphia Eagles</div>
            <div className="text-sm text-gray-400">17.5 PPG allowed • #1 ranked</div>
          </div>
          
          <div className="p-5 rounded-2xl bg-gradient-to-br from-orange-500/10 to-red-500/5 border border-orange-500/20">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-5 h-5 text-orange-400" />
              <h3 className="font-bold text-white">Best ATS</h3>
            </div>
            <div className="text-2xl font-black text-orange-400">Detroit Lions</div>
            <div className="text-sm text-gray-400">12-5 ATS • 70.6% cover rate</div>
          </div>
        </div>
      </div>
    </div>
  )
}
