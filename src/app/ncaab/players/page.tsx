'use client'

import Link from 'next/link'
import { useState } from 'react'
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
  Star
} from 'lucide-react'

type StatCategory = 'scoring' | 'rebounds' | 'assists' | 'defense'

// Mock NCAAB player data
const playerStats = {
  scoring: [
    { rank: 1, name: 'RJ Davis', team: 'North Carolina', pos: 'G', conf: 'ACC', gp: 28, pts: 21.4, fg: 44.2, threePt: 36.8, ft: 84.2, ppg: 21.4, min: 35.2, trend: 'up' },
    { rank: 2, name: 'Chaz Lanier', team: 'Tennessee', pos: 'G', conf: 'SEC', gp: 26, pts: 19.8, fg: 48.1, threePt: 42.3, ft: 81.7, ppg: 19.8, min: 32.4, trend: 'up' },
    { rank: 3, name: 'Johni Broome', team: 'Auburn', pos: 'F/C', conf: 'SEC', gp: 27, pts: 18.2, fg: 53.4, threePt: 31.2, ft: 77.8, ppg: 18.2, min: 28.6, trend: 'neutral' },
    { rank: 4, name: 'Mark Sears', team: 'Alabama', pos: 'G', conf: 'SEC', gp: 26, pts: 18.9, fg: 45.6, threePt: 38.9, ft: 86.4, ppg: 18.9, min: 33.1, trend: 'up' },
    { rank: 5, name: 'VJ Edgecombe', team: 'Baylor', pos: 'G', conf: 'Big 12', gp: 25, pts: 17.8, fg: 46.2, threePt: 33.4, ft: 79.2, ppg: 17.8, min: 31.8, trend: 'neutral' },
    { rank: 6, name: 'Kam Jones', team: 'Marquette', pos: 'G', conf: 'Big East', gp: 28, pts: 17.4, fg: 42.8, threePt: 35.1, ft: 82.6, ppg: 17.4, min: 34.2, trend: 'down' },
    { rank: 7, name: 'Ace Bailey', team: 'Rutgers', pos: 'F', conf: 'Big Ten', gp: 24, pts: 18.6, fg: 47.3, threePt: 36.8, ft: 75.4, ppg: 18.6, min: 30.2, trend: 'up' },
    { rank: 8, name: 'Dylan Harper', team: 'Rutgers', pos: 'G', conf: 'Big Ten', gp: 24, pts: 20.1, fg: 45.8, threePt: 34.2, ft: 81.3, ppg: 20.1, min: 32.6, trend: 'up' },
    { rank: 9, name: 'Hunter Dickinson', team: 'Kansas', pos: 'C', conf: 'Big 12', gp: 27, pts: 16.2, fg: 51.2, threePt: 28.4, ft: 73.8, ppg: 16.2, min: 29.4, trend: 'neutral' },
    { rank: 10, name: 'Kasparas Jakucionis', team: 'Illinois', pos: 'G', conf: 'Big Ten', gp: 26, pts: 15.8, fg: 44.6, threePt: 37.2, ft: 78.9, ppg: 15.8, min: 33.8, trend: 'up' },
  ],
  rebounds: [
    { rank: 1, name: 'Johni Broome', team: 'Auburn', pos: 'F/C', conf: 'SEC', gp: 27, rpg: 11.4, orpg: 3.2, drpg: 8.2, trb: 308, mins: 28.6, trend: 'up' },
    { rank: 2, name: 'Ryan Kalkbrenner', team: 'Creighton', pos: 'C', conf: 'Big East', gp: 26, rpg: 9.8, orpg: 2.8, drpg: 7.0, trb: 255, mins: 27.4, trend: 'neutral' },
    { rank: 3, name: 'Kyle Filipowski', team: 'Duke', pos: 'F/C', conf: 'ACC', gp: 28, rpg: 8.6, orpg: 1.8, drpg: 6.8, trb: 241, mins: 30.2, trend: 'down' },
    { rank: 4, name: 'Tre Mitchell', team: 'Wisconsin', pos: 'F', conf: 'Big Ten', gp: 27, rpg: 8.2, orpg: 2.4, drpg: 5.8, trb: 221, mins: 28.8, trend: 'up' },
    { rank: 5, name: 'Hunter Dickinson', team: 'Kansas', pos: 'C', conf: 'Big 12', gp: 27, rpg: 8.9, orpg: 2.1, drpg: 6.8, trb: 240, mins: 29.4, trend: 'neutral' },
    { rank: 6, name: 'Trey Alexander', team: 'Creighton', pos: 'G', conf: 'Big East', gp: 26, rpg: 5.2, orpg: 0.8, drpg: 4.4, trb: 135, mins: 34.6, trend: 'neutral' },
    { rank: 7, name: 'Donovan Clingan', team: 'UConn', pos: 'C', conf: 'Big East', gp: 25, rpg: 9.4, orpg: 3.6, drpg: 5.8, trb: 235, mins: 24.8, trend: 'up' },
    { rank: 8, name: 'Ace Bailey', team: 'Rutgers', pos: 'F', conf: 'Big Ten', gp: 24, rpg: 8.4, orpg: 2.2, drpg: 6.2, trb: 202, mins: 30.2, trend: 'up' },
    { rank: 9, name: 'Grant Nelson', team: 'Alabama', pos: 'F', conf: 'SEC', gp: 26, rpg: 7.8, orpg: 2.6, drpg: 5.2, trb: 203, mins: 27.6, trend: 'neutral' },
    { rank: 10, name: 'Zach Edey', team: 'Purdue', pos: 'C', conf: 'Big Ten', gp: 28, rpg: 12.2, orpg: 4.2, drpg: 8.0, trb: 342, mins: 30.4, trend: 'up' },
  ],
  assists: [
    { rank: 1, name: 'Boogie Fland', team: 'Arkansas', pos: 'G', conf: 'SEC', gp: 26, apg: 7.2, tov: 2.8, ast: 187, astRatio: 32.4, min: 34.2, trend: 'up' },
    { rank: 2, name: 'Mark Sears', team: 'Alabama', pos: 'G', conf: 'SEC', gp: 26, apg: 6.8, tov: 2.4, ast: 177, astRatio: 28.6, min: 33.1, trend: 'up' },
    { rank: 3, name: 'Tyrese Proctor', team: 'Duke', pos: 'G', conf: 'ACC', gp: 28, apg: 6.4, tov: 2.2, ast: 179, astRatio: 26.8, min: 32.4, trend: 'neutral' },
    { rank: 4, name: 'Isaiah Collier', team: 'USC', pos: 'G', conf: 'Pac-12', gp: 24, apg: 6.9, tov: 3.2, ast: 166, astRatio: 29.4, min: 31.8, trend: 'down' },
    { rank: 5, name: 'DJ Wagner', team: 'Kentucky', pos: 'G', conf: 'SEC', gp: 27, apg: 5.8, tov: 2.6, ast: 157, astRatio: 25.2, min: 30.6, trend: 'neutral' },
    { rank: 6, name: 'RJ Davis', team: 'North Carolina', pos: 'G', conf: 'ACC', gp: 28, apg: 5.4, tov: 1.8, ast: 151, astRatio: 23.8, min: 35.2, trend: 'up' },
    { rank: 7, name: 'Kam Jones', team: 'Marquette', pos: 'G', conf: 'Big East', gp: 28, apg: 5.2, tov: 2.4, ast: 146, astRatio: 22.4, min: 34.2, trend: 'neutral' },
    { rank: 8, name: 'Kasparas Jakucionis', team: 'Illinois', pos: 'G', conf: 'Big Ten', gp: 26, apg: 5.6, tov: 2.2, ast: 146, astRatio: 24.6, min: 33.8, trend: 'up' },
    { rank: 9, name: 'Otega Oweh', team: 'Oklahoma', pos: 'G', conf: 'Big 12', gp: 25, apg: 5.4, tov: 2.8, ast: 135, astRatio: 23.2, min: 32.4, trend: 'down' },
    { rank: 10, name: 'Dylan Harper', team: 'Rutgers', pos: 'G', conf: 'Big Ten', gp: 24, apg: 5.8, tov: 2.4, ast: 139, astRatio: 25.8, min: 32.6, trend: 'up' },
  ],
  defense: [
    { rank: 1, name: 'Johni Broome', team: 'Auburn', pos: 'F/C', conf: 'SEC', gp: 27, blkpg: 2.8, stlpg: 1.2, dws: 2.4, dfgPct: 42.3, blk: 76, stl: 32, trend: 'up' },
    { rank: 2, name: 'Donovan Clingan', team: 'UConn', pos: 'C', conf: 'Big East', gp: 25, blkpg: 3.2, stlpg: 0.8, dws: 2.6, dfgPct: 38.4, blk: 80, stl: 20, trend: 'up' },
    { rank: 3, name: 'Ryan Kalkbrenner', team: 'Creighton', pos: 'C', conf: 'Big East', gp: 26, blkpg: 2.4, stlpg: 0.6, dws: 2.1, dfgPct: 44.2, blk: 62, stl: 16, trend: 'neutral' },
    { rank: 4, name: 'Kyle Filipowski', team: 'Duke', pos: 'F/C', conf: 'ACC', gp: 28, blkpg: 1.8, stlpg: 1.2, dws: 1.9, dfgPct: 46.8, blk: 50, stl: 34, trend: 'neutral' },
    { rank: 5, name: 'Zach Edey', team: 'Purdue', pos: 'C', conf: 'Big Ten', gp: 28, blkpg: 2.6, stlpg: 0.4, dws: 2.8, dfgPct: 41.2, blk: 73, stl: 11, trend: 'up' },
    { rank: 6, name: 'Hunter Dickinson', team: 'Kansas', pos: 'C', conf: 'Big 12', gp: 27, blkpg: 1.6, stlpg: 0.8, dws: 1.7, dfgPct: 47.4, blk: 43, stl: 22, trend: 'down' },
    { rank: 7, name: 'Tre Mitchell', team: 'Wisconsin', pos: 'F', conf: 'Big Ten', gp: 27, blkpg: 1.4, stlpg: 1.0, dws: 1.5, dfgPct: 48.2, blk: 38, stl: 27, trend: 'neutral' },
    { rank: 8, name: 'Grant Nelson', team: 'Alabama', pos: 'F', conf: 'SEC', gp: 26, blkpg: 1.8, stlpg: 0.6, dws: 1.6, dfgPct: 45.6, blk: 47, stl: 16, trend: 'up' },
    { rank: 9, name: 'Ugonna Onyenso', team: 'Kentucky', pos: 'C', conf: 'SEC', gp: 24, blkpg: 2.2, stlpg: 0.4, dws: 1.8, dfgPct: 43.8, blk: 53, stl: 10, trend: 'neutral' },
    { rank: 10, name: 'Yves Missi', team: 'Baylor', pos: 'C', conf: 'Big 12', gp: 25, blkpg: 2.0, stlpg: 0.6, dws: 1.4, dfgPct: 44.6, blk: 50, stl: 15, trend: 'up' },
  ],
}

const conferences = ['All', 'SEC', 'Big Ten', 'Big 12', 'ACC', 'Big East', 'Pac-12', 'MWC', 'AAC', 'A-10', 'WCC']

export default function NCAABPlayersPage() {
  const [category, setCategory] = useState<StatCategory>('scoring')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedConf, setSelectedConf] = useState('All')

  const currentStats = playerStats[category]
  const filteredStats = currentStats.filter(player => {
    const matchesSearch = player.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         player.team.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesConf = selectedConf === 'All' || player.conf === selectedConf
    return matchesSearch && matchesConf
  })

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
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-500/10 border border-green-500/20">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                <span className="text-green-400 text-sm font-medium">Live Data</span>
              </div>
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
                {filteredStats.map((player) => (
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
                ))}
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
