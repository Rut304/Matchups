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
  Flame,
  Shield,
  Zap
} from 'lucide-react'

type StatCategory = 'passing' | 'rushing' | 'receiving' | 'defense'

// Mock NCAAF player data
const playerStats = {
  passing: [
    { rank: 1, name: 'Cam Ward', team: 'Miami', pos: 'QB', conf: 'ACC', gp: 13, cmp: 346, att: 493, pct: 70.2, yds: 4313, td: 39, int: 7, rtg: 172.8, ypa: 8.7, trend: 'up' },
    { rank: 2, name: 'Shedeur Sanders', team: 'Colorado', pos: 'QB', conf: 'Big 12', gp: 12, cmp: 348, att: 477, pct: 73.0, yds: 4134, td: 37, int: 10, rtg: 168.4, ypa: 8.7, trend: 'up' },
    { rank: 3, name: 'Dillon Gabriel', team: 'Oregon', pos: 'QB', conf: 'Big Ten', gp: 14, cmp: 321, att: 437, pct: 73.5, yds: 3988, td: 33, int: 5, rtg: 175.1, ypa: 9.1, trend: 'up' },
    { rank: 4, name: 'Carson Beck', team: 'Georgia', pos: 'QB', conf: 'SEC', gp: 12, cmp: 298, att: 434, pct: 68.7, yds: 3941, td: 28, int: 12, rtg: 151.2, ypa: 9.1, trend: 'down' },
    { rank: 5, name: 'Drew Allar', team: 'Penn State', pos: 'QB', conf: 'Big Ten', gp: 13, cmp: 217, att: 318, pct: 68.2, yds: 2894, td: 24, int: 7, rtg: 162.5, ypa: 9.1, trend: 'neutral' },
    { rank: 6, name: 'Jalen Milroe', team: 'Alabama', pos: 'QB', conf: 'SEC', gp: 12, cmp: 186, att: 296, pct: 62.8, yds: 2652, td: 16, int: 9, rtg: 144.7, ypa: 9.0, trend: 'down' },
    { rank: 7, name: 'Quinn Ewers', team: 'Texas', pos: 'QB', conf: 'SEC', gp: 10, cmp: 192, att: 286, pct: 67.1, yds: 2601, td: 26, int: 9, rtg: 157.4, ypa: 9.1, trend: 'neutral' },
    { rank: 8, name: 'Will Howard', team: 'Ohio State', pos: 'QB', conf: 'Big Ten', gp: 13, cmp: 214, att: 299, pct: 71.6, yds: 2860, td: 26, int: 10, rtg: 159.8, ypa: 9.6, trend: 'up' },
    { rank: 9, name: 'Kyle McCord', team: 'Syracuse', pos: 'QB', conf: 'ACC', gp: 12, cmp: 346, att: 515, pct: 67.2, yds: 4326, td: 29, int: 12, rtg: 147.3, ypa: 8.4, trend: 'neutral' },
    { rank: 10, name: 'Jalon Daniels', team: 'Kansas', pos: 'QB', conf: 'Big 12', gp: 8, cmp: 132, att: 210, pct: 62.9, yds: 1787, td: 13, int: 7, rtg: 144.1, ypa: 8.5, trend: 'down' },
  ],
  rushing: [
    { rank: 1, name: 'Ashton Jeanty', team: 'Boise State', pos: 'RB', conf: 'MWC', gp: 14, att: 344, yds: 2601, avg: 7.6, td: 29, lng: 75, ypc: 185.8, fumbles: 2, trend: 'up' },
    { rank: 2, name: 'Kaleb Johnson', team: 'Iowa', pos: 'RB', conf: 'Big Ten', gp: 12, att: 225, yds: 1537, avg: 6.8, td: 21, lng: 86, ypc: 128.1, fumbles: 1, trend: 'up' },
    { rank: 3, name: 'Omarion Hampton', team: 'North Carolina', pos: 'RB', conf: 'ACC', gp: 12, att: 255, yds: 1660, avg: 6.5, td: 15, lng: 69, ypc: 138.3, fumbles: 3, trend: 'neutral' },
    { rank: 4, name: 'TreVeyon Henderson', team: 'Ohio State', pos: 'RB', conf: 'Big Ten', gp: 13, att: 172, yds: 1135, avg: 6.6, td: 14, lng: 75, ypc: 87.3, fumbles: 1, trend: 'up' },
    { rank: 5, name: 'Cam Skattebo', team: 'Arizona State', pos: 'RB', conf: 'Big 12', gp: 13, att: 274, yds: 1568, avg: 5.7, td: 19, lng: 52, ypc: 120.6, fumbles: 2, trend: 'up' },
    { rank: 6, name: 'Bhayshul Tuten', team: 'Virginia Tech', pos: 'RB', conf: 'ACC', gp: 12, att: 194, yds: 1286, avg: 6.6, td: 16, lng: 62, ypc: 107.2, fumbles: 0, trend: 'neutral' },
    { rank: 7, name: 'RJ Harvey', team: 'UCF', pos: 'RB', conf: 'Big 12', gp: 11, att: 189, yds: 1189, avg: 6.3, td: 15, lng: 58, ypc: 108.1, fumbles: 2, trend: 'down' },
    { rank: 8, name: 'Dylan Sampson', team: 'Tennessee', pos: 'RB', conf: 'SEC', gp: 13, att: 238, yds: 1485, avg: 6.2, td: 22, lng: 48, ypc: 114.2, fumbles: 1, trend: 'up' },
    { rank: 9, name: 'Trevor Etienne', team: 'Georgia', pos: 'RB', conf: 'SEC', gp: 12, att: 179, yds: 1148, avg: 6.4, td: 14, lng: 64, ypc: 95.7, fumbles: 2, trend: 'neutral' },
    { rank: 10, name: 'Devin Neal', team: 'Kansas', pos: 'RB', conf: 'Big 12', gp: 9, att: 164, yds: 921, avg: 5.6, td: 10, lng: 47, ypc: 102.3, fumbles: 1, trend: 'down' },
  ],
  receiving: [
    { rank: 1, name: 'Tetairoa McMillan', team: 'Arizona', pos: 'WR', conf: 'Big 12', gp: 12, rec: 84, tgt: 124, yds: 1319, avg: 15.7, td: 8, lng: 81, ypr: 109.9, ctchPct: 67.7, trend: 'up' },
    { rank: 2, name: 'Travis Hunter', team: 'Colorado', pos: 'WR', conf: 'Big 12', gp: 12, rec: 92, tgt: 123, yds: 1152, avg: 12.5, td: 14, lng: 61, ypr: 96.0, ctchPct: 74.8, trend: 'up' },
    { rank: 3, name: 'Luther Burden III', team: 'Missouri', pos: 'WR', conf: 'SEC', gp: 12, rec: 61, tgt: 96, yds: 676, avg: 11.1, td: 6, lng: 52, ypr: 56.3, ctchPct: 63.5, trend: 'down' },
    { rank: 4, name: 'Jayden Higgins', team: 'Iowa State', pos: 'WR', conf: 'Big 12', gp: 13, rec: 81, tgt: 108, yds: 968, avg: 12.0, td: 6, lng: 59, ypr: 74.5, ctchPct: 75.0, trend: 'neutral' },
    { rank: 5, name: 'Tre Harris', team: 'Ole Miss', pos: 'WR', conf: 'SEC', gp: 8, rec: 59, tgt: 78, yds: 987, avg: 16.7, td: 7, lng: 73, ypr: 123.4, ctchPct: 75.6, trend: 'up' },
    { rank: 6, name: 'Tez Johnson', team: 'Oregon', pos: 'WR', conf: 'Big Ten', gp: 14, rec: 81, tgt: 102, yds: 847, avg: 10.5, td: 7, lng: 47, ypr: 60.5, ctchPct: 79.4, trend: 'neutral' },
    { rank: 7, name: 'Evan Stewart', team: 'Oregon', pos: 'WR', conf: 'Big Ten', gp: 14, rec: 65, tgt: 90, yds: 834, avg: 12.8, td: 8, lng: 62, ypr: 59.6, ctchPct: 72.2, trend: 'up' },
    { rank: 8, name: 'Ja\'Corey Brooks', team: 'Louisville', pos: 'WR', conf: 'ACC', gp: 13, rec: 76, tgt: 105, yds: 996, avg: 13.1, td: 7, lng: 58, ypr: 76.6, ctchPct: 72.4, trend: 'neutral' },
    { rank: 9, name: 'Xavier Restrepo', team: 'Miami', pos: 'WR', conf: 'ACC', gp: 11, rec: 67, tgt: 91, yds: 1130, avg: 16.9, td: 11, lng: 67, ypr: 102.7, ctchPct: 73.6, trend: 'up' },
    { rank: 10, name: 'Jermaine Burton', team: 'Alabama', pos: 'WR', conf: 'SEC', gp: 12, rec: 51, tgt: 84, yds: 761, avg: 14.9, td: 6, lng: 72, ypr: 63.4, ctchPct: 60.7, trend: 'down' },
  ],
  defense: [
    { rank: 1, name: 'Nic Scourton', team: 'Texas A&M', pos: 'EDGE', conf: 'SEC', gp: 12, tackles: 52, tfl: 17.5, sacks: 9.5, int: 0, ff: 4, pd: 2, solo: 38, trend: 'up' },
    { rank: 2, name: 'Abdul Carter', team: 'Penn State', pos: 'LB', conf: 'Big Ten', gp: 13, tackles: 64, tfl: 15.0, sacks: 11.0, int: 0, ff: 2, pd: 3, solo: 47, trend: 'up' },
    { rank: 3, name: 'James Pearce Jr.', team: 'Tennessee', pos: 'EDGE', conf: 'SEC', gp: 13, tackles: 48, tfl: 12.0, sacks: 8.0, int: 0, ff: 3, pd: 1, solo: 34, trend: 'neutral' },
    { rank: 4, name: 'Mason Graham', team: 'Michigan', pos: 'DT', conf: 'Big Ten', gp: 12, tackles: 43, tfl: 9.0, sacks: 3.5, int: 0, ff: 0, pd: 3, solo: 26, trend: 'neutral' },
    { rank: 5, name: 'Jalon Walker', team: 'Georgia', pos: 'LB', conf: 'SEC', gp: 12, tackles: 72, tfl: 12.5, sacks: 7.0, int: 1, ff: 1, pd: 4, solo: 50, trend: 'up' },
    { rank: 6, name: 'Will Johnson', team: 'Michigan', pos: 'CB', conf: 'Big Ten', gp: 12, tackles: 24, tfl: 0.5, sacks: 0, int: 3, ff: 1, pd: 9, solo: 20, trend: 'up' },
    { rank: 7, name: 'Malaki Starks', team: 'Georgia', pos: 'S', conf: 'SEC', gp: 12, tackles: 62, tfl: 3.5, sacks: 0, int: 2, ff: 2, pd: 8, solo: 45, trend: 'neutral' },
    { rank: 8, name: 'Kyle Kennard', team: 'South Carolina', pos: 'EDGE', conf: 'SEC', gp: 12, tackles: 48, tfl: 18.0, sacks: 12.5, int: 1, ff: 2, pd: 2, solo: 32, trend: 'up' },
    { rank: 9, name: 'Laiatu Latu', team: 'UCLA', pos: 'EDGE', conf: 'Big Ten', gp: 12, tackles: 43, tfl: 13.5, sacks: 8.5, int: 0, ff: 3, pd: 2, solo: 29, trend: 'down' },
    { rank: 10, name: 'Denzel Burke', team: 'Ohio State', pos: 'CB', conf: 'Big Ten', gp: 13, tackles: 33, tfl: 1.0, sacks: 0, int: 4, ff: 0, pd: 12, solo: 26, trend: 'up' },
  ],
}

const conferences = ['All', 'SEC', 'Big Ten', 'Big 12', 'ACC', 'Pac-12', 'MWC', 'AAC', 'Sun Belt', 'C-USA', 'MAC', 'Ind']

export default function NCAAFPlayersPage() {
  const [category, setCategory] = useState<StatCategory>('passing')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedConf, setSelectedConf] = useState('All')
  const [sortBy, setSortBy] = useState('rank')

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
          <Link href="/ncaaf" className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to NCAAF
          </Link>
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-4xl">🏈</span>
                <h1 className="text-3xl font-black text-white">NCAAF Player Stats</h1>
                <span className="px-2 py-1 rounded-md text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  2025 SEASON
                </span>
              </div>
              <p className="text-gray-400">Comprehensive college football player statistics</p>
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
            { id: 'passing', label: 'Passing', icon: Target },
            { id: 'rushing', label: 'Rushing', icon: Zap },
            { id: 'receiving', label: 'Receiving', icon: Users },
            { id: 'defense', label: 'Defense', icon: Shield },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategory(cat.id as StatCategory)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold transition-all ${
                category === cat.id
                  ? 'bg-amber-500 text-black'
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
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/50"
            />
          </div>
          
          <div className="relative">
            <select
              value={selectedConf}
              onChange={(e) => setSelectedConf(e.target.value)}
              className="appearance-none px-4 py-3 pr-10 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-amber-500/50 cursor-pointer"
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
                  {category === 'passing' && (
                    <>
                      <th className="px-4 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">CMP/ATT</th>
                      <th className="px-4 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">PCT</th>
                      <th className="px-4 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">YDS</th>
                      <th className="px-4 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">TD</th>
                      <th className="px-4 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">INT</th>
                      <th className="px-4 py-4 text-center text-xs font-bold text-amber-500 uppercase tracking-wider">RTG</th>
                    </>
                  )}
                  {category === 'rushing' && (
                    <>
                      <th className="px-4 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">ATT</th>
                      <th className="px-4 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">YDS</th>
                      <th className="px-4 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">AVG</th>
                      <th className="px-4 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">TD</th>
                      <th className="px-4 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">LNG</th>
                      <th className="px-4 py-4 text-center text-xs font-bold text-amber-500 uppercase tracking-wider">YDS/G</th>
                    </>
                  )}
                  {category === 'receiving' && (
                    <>
                      <th className="px-4 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">REC</th>
                      <th className="px-4 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">TGT</th>
                      <th className="px-4 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">YDS</th>
                      <th className="px-4 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">TD</th>
                      <th className="px-4 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">AVG</th>
                      <th className="px-4 py-4 text-center text-xs font-bold text-amber-500 uppercase tracking-wider">YDS/G</th>
                    </>
                  )}
                  {category === 'defense' && (
                    <>
                      <th className="px-4 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">TCKL</th>
                      <th className="px-4 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">TFL</th>
                      <th className="px-4 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">SACKS</th>
                      <th className="px-4 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">INT</th>
                      <th className="px-4 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">FF</th>
                      <th className="px-4 py-4 text-center text-xs font-bold text-amber-500 uppercase tracking-wider">PD</th>
                    </>
                  )}
                  <th className="px-4 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Trend</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredStats.map((player, idx) => (
                  <tr key={player.name} className="hover:bg-white/5 transition-colors">
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg text-sm font-bold ${
                        player.rank <= 3 ? 'bg-amber-500/20 text-amber-400' : 'bg-white/10 text-gray-400'
                      }`}>
                        {player.rank}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center">
                          <Users className="w-5 h-5 text-amber-400" />
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
                    {category === 'passing' && (
                      <>
                        <td className="px-4 py-4 text-center text-gray-400">{(player as { cmp: number }).cmp}/{(player as { att: number }).att}</td>
                        <td className="px-4 py-4 text-center text-white font-medium">{(player as { pct: number }).pct}%</td>
                        <td className="px-4 py-4 text-center text-white font-semibold">{(player as { yds: number }).yds.toLocaleString()}</td>
                        <td className="px-4 py-4 text-center text-green-400 font-semibold">{(player as { td: number }).td}</td>
                        <td className="px-4 py-4 text-center text-red-400 font-semibold">{(player as { int: number }).int}</td>
                        <td className="px-4 py-4 text-center">
                          <span className="px-2 py-1 rounded-lg bg-amber-500/20 text-amber-400 font-bold">
                            {(player as { rtg: number }).rtg}
                          </span>
                        </td>
                      </>
                    )}
                    {category === 'rushing' && (
                      <>
                        <td className="px-4 py-4 text-center text-gray-400">{(player as { att: number }).att}</td>
                        <td className="px-4 py-4 text-center text-white font-semibold">{(player as { yds: number }).yds.toLocaleString()}</td>
                        <td className="px-4 py-4 text-center text-white font-medium">{(player as { avg: number }).avg}</td>
                        <td className="px-4 py-4 text-center text-green-400 font-semibold">{(player as { td: number }).td}</td>
                        <td className="px-4 py-4 text-center text-gray-400">{(player as { lng: number }).lng}</td>
                        <td className="px-4 py-4 text-center">
                          <span className="px-2 py-1 rounded-lg bg-amber-500/20 text-amber-400 font-bold">
                            {(player as { ypc: number }).ypc}
                          </span>
                        </td>
                      </>
                    )}
                    {category === 'receiving' && (
                      <>
                        <td className="px-4 py-4 text-center text-white font-semibold">{(player as { rec: number }).rec}</td>
                        <td className="px-4 py-4 text-center text-gray-400">{(player as { tgt: number }).tgt}</td>
                        <td className="px-4 py-4 text-center text-white font-semibold">{(player as { yds: number }).yds.toLocaleString()}</td>
                        <td className="px-4 py-4 text-center text-green-400 font-semibold">{(player as { td: number }).td}</td>
                        <td className="px-4 py-4 text-center text-white font-medium">{(player as { avg: number }).avg}</td>
                        <td className="px-4 py-4 text-center">
                          <span className="px-2 py-1 rounded-lg bg-amber-500/20 text-amber-400 font-bold">
                            {(player as { ypr: number }).ypr}
                          </span>
                        </td>
                      </>
                    )}
                    {category === 'defense' && (
                      <>
                        <td className="px-4 py-4 text-center text-white font-semibold">{(player as { tackles: number }).tackles}</td>
                        <td className="px-4 py-4 text-center text-white font-medium">{(player as { tfl: number }).tfl}</td>
                        <td className="px-4 py-4 text-center text-green-400 font-semibold">{(player as { sacks: number }).sacks}</td>
                        <td className="px-4 py-4 text-center text-blue-400 font-semibold">{(player as { int: number }).int}</td>
                        <td className="px-4 py-4 text-center text-orange-400 font-semibold">{(player as { ff: number }).ff}</td>
                        <td className="px-4 py-4 text-center">
                          <span className="px-2 py-1 rounded-lg bg-amber-500/20 text-amber-400 font-bold">
                            {(player as { pd: number }).pd}
                          </span>
                        </td>
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

        {/* Heisman Watch Widget */}
        <div className="mt-8 rounded-2xl border border-amber-500/30 p-6" style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.1) 0%, rgba(217,119,6,0.05) 100%)' }}>
          <div className="flex items-center gap-3 mb-4">
            <Award className="w-6 h-6 text-amber-400" />
            <h3 className="text-xl font-bold text-white">Heisman Trophy Watch</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { name: 'Travis Hunter', team: 'Colorado', pos: 'WR/CB', odds: '-350' },
              { name: 'Ashton Jeanty', team: 'Boise State', pos: 'RB', odds: '+350' },
              { name: 'Cam Ward', team: 'Miami', pos: 'QB', odds: '+1200' },
              { name: 'Dillon Gabriel', team: 'Oregon', pos: 'QB', odds: '+2000' },
              { name: 'Shedeur Sanders', team: 'Colorado', pos: 'QB', odds: '+2500' },
            ].map((player, idx) => (
              <div key={player.name} className="p-4 rounded-xl bg-black/30 border border-white/10">
                <div className="text-2xl font-black text-amber-400 mb-1">#{idx + 1}</div>
                <div className="font-semibold text-white text-sm">{player.name}</div>
                <div className="text-xs text-gray-500">{player.team} • {player.pos}</div>
                <div className="mt-2 text-xs font-bold text-green-400">{player.odds}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
