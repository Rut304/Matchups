'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { 
  ChevronLeft,
  Search,
  TrendingUp,
  TrendingDown,
  Flame,
  ArrowUpDown,
  Target,
  BarChart3,
  Zap,
  Award,
  Clock,
  Users,
  Shield,
  ChevronDown,
  Star,
  Activity
} from 'lucide-react'

type StatCategory = 'batting' | 'power' | 'discipline' | 'pitching' | 'advanced' | 'props'

interface Batter {
  id: number
  name: string
  team: string
  teamAbbr: string
  position: string
  gp: number
  pa: number
  ab: number
  // Batting
  avg: number
  obp: number
  slg: number
  ops: number
  hits: number
  doubles: number
  triples: number
  hr: number
  rbi: number
  runs: number
  sb: number
  // Discipline
  bb: number
  so: number
  bbPct: number
  kPct: number
  // Advanced
  war: number
  wrc: number
  babip: number
  iso: number
  // Props
  hitsProp: number
  hitsHitRate: number
  tbProp: number
  tbHitRate: number
  rbProp: number
  rbHitRate: number
  trend: 'hot' | 'cold' | 'neutral'
  hotStreak?: string
}

interface Pitcher {
  id: number
  name: string
  team: string
  teamAbbr: string
  position: string
  gp: number
  gs: number
  ip: number
  // Pitching
  wins: number
  losses: number
  era: number
  whip: number
  so: number
  bb: number
  hits: number
  hr: number
  // Rates
  k9: number
  bb9: number
  hr9: number
  kBbRatio: number
  // Advanced
  fip: number
  war: number
  babip: number
  // Props
  soProp: number
  soHitRate: number
  outsProp: number
  outsHitRate: number
  trend: 'hot' | 'cold' | 'neutral'
  hotStreak?: string
}

// Mock batters data
const mockBatters: Batter[] = [
  {
    id: 1,
    name: 'Shohei Ohtani',
    team: 'Los Angeles Dodgers',
    teamAbbr: 'LAD',
    position: 'DH',
    gp: 142,
    pa: 636,
    ab: 548,
    avg: 0.310,
    obp: 0.390,
    slg: 0.646,
    ops: 1.036,
    hits: 170,
    doubles: 38,
    triples: 8,
    hr: 54,
    rbi: 130,
    runs: 134,
    sb: 59,
    bb: 81,
    so: 142,
    bbPct: 12.7,
    kPct: 22.3,
    war: 9.2,
    wrc: 184,
    babip: 0.312,
    iso: 0.336,
    hitsProp: 1.5,
    hitsHitRate: 58,
    tbProp: 2.5,
    tbHitRate: 62,
    rbProp: 1.5,
    rbHitRate: 54,
    trend: 'hot',
    hotStreak: 'Historic 50-50 season'
  },
  {
    id: 2,
    name: 'Aaron Judge',
    team: 'New York Yankees',
    teamAbbr: 'NYY',
    position: 'RF',
    gp: 156,
    pa: 682,
    ab: 568,
    avg: 0.322,
    obp: 0.425,
    slg: 0.701,
    ops: 1.126,
    hits: 183,
    doubles: 32,
    triples: 1,
    hr: 58,
    rbi: 144,
    runs: 122,
    sb: 10,
    bb: 102,
    so: 158,
    bbPct: 15.0,
    kPct: 23.2,
    war: 10.8,
    wrc: 210,
    babip: 0.348,
    iso: 0.379,
    hitsProp: 1.5,
    hitsHitRate: 62,
    tbProp: 2.5,
    tbHitRate: 68,
    rbProp: 1.5,
    rbHitRate: 58,
    trend: 'hot',
    hotStreak: 'AL MVP frontrunner'
  },
  {
    id: 3,
    name: 'Mookie Betts',
    team: 'Los Angeles Dodgers',
    teamAbbr: 'LAD',
    position: 'SS',
    gp: 116,
    pa: 512,
    ab: 442,
    avg: 0.289,
    obp: 0.378,
    slg: 0.534,
    ops: 0.912,
    hits: 128,
    doubles: 26,
    triples: 1,
    hr: 24,
    rbi: 80,
    runs: 98,
    sb: 14,
    bb: 62,
    so: 78,
    bbPct: 12.1,
    kPct: 15.2,
    war: 6.2,
    wrc: 156,
    babip: 0.298,
    iso: 0.245,
    hitsProp: 1.5,
    hitsHitRate: 54,
    tbProp: 2.5,
    tbHitRate: 52,
    rbProp: 1.5,
    rbHitRate: 48,
    trend: 'neutral'
  },
  {
    id: 4,
    name: 'Corey Seager',
    team: 'Texas Rangers',
    teamAbbr: 'TEX',
    position: 'SS',
    gp: 148,
    pa: 624,
    ab: 552,
    avg: 0.278,
    obp: 0.358,
    slg: 0.542,
    ops: 0.900,
    hits: 154,
    doubles: 36,
    triples: 2,
    hr: 36,
    rbi: 112,
    runs: 98,
    sb: 4,
    bb: 62,
    so: 124,
    bbPct: 9.9,
    kPct: 19.9,
    war: 5.8,
    wrc: 148,
    babip: 0.284,
    iso: 0.264,
    hitsProp: 1.5,
    hitsHitRate: 52,
    tbProp: 2.5,
    tbHitRate: 56,
    rbProp: 1.5,
    rbHitRate: 52,
    trend: 'neutral'
  },
  {
    id: 5,
    name: 'Juan Soto',
    team: 'New York Yankees',
    teamAbbr: 'NYY',
    position: 'RF',
    gp: 156,
    pa: 714,
    ab: 568,
    avg: 0.288,
    obp: 0.419,
    slg: 0.569,
    ops: 0.988,
    hits: 164,
    doubles: 32,
    triples: 2,
    hr: 41,
    rbi: 109,
    runs: 128,
    sb: 7,
    bb: 129,
    so: 118,
    bbPct: 18.1,
    kPct: 16.5,
    war: 8.1,
    wrc: 176,
    babip: 0.292,
    iso: 0.281,
    hitsProp: 1.5,
    hitsHitRate: 54,
    tbProp: 2.5,
    tbHitRate: 58,
    rbProp: 1.5,
    rbHitRate: 52,
    trend: 'hot',
    hotStreak: '129 walks - best in MLB'
  },
  {
    id: 6,
    name: 'Bobby Witt Jr.',
    team: 'Kansas City Royals',
    teamAbbr: 'KC',
    position: 'SS',
    gp: 158,
    pa: 696,
    ab: 632,
    avg: 0.332,
    obp: 0.389,
    slg: 0.588,
    ops: 0.977,
    hits: 210,
    doubles: 45,
    triples: 11,
    hr: 32,
    rbi: 109,
    runs: 125,
    sb: 31,
    bb: 52,
    so: 128,
    bbPct: 7.5,
    kPct: 18.4,
    war: 8.4,
    wrc: 168,
    babip: 0.368,
    iso: 0.256,
    hitsProp: 1.5,
    hitsHitRate: 68,
    tbProp: 2.5,
    tbHitRate: 64,
    rbProp: 1.5,
    rbHitRate: 52,
    trend: 'hot',
    hotStreak: 'Batting title leader'
  }
]

// Mock pitchers data
const mockPitchers: Pitcher[] = [
  {
    id: 101,
    name: 'Tarik Skubal',
    team: 'Detroit Tigers',
    teamAbbr: 'DET',
    position: 'SP',
    gp: 31,
    gs: 31,
    ip: 192.0,
    wins: 18,
    losses: 4,
    era: 2.39,
    whip: 0.92,
    so: 228,
    bb: 36,
    hits: 142,
    hr: 20,
    k9: 10.7,
    bb9: 1.7,
    hr9: 0.9,
    kBbRatio: 6.33,
    fip: 2.68,
    war: 7.2,
    babip: 0.278,
    soProp: 6.5,
    soHitRate: 62,
    outsProp: 17.5,
    outsHitRate: 54,
    trend: 'hot',
    hotStreak: 'Cy Young frontrunner'
  },
  {
    id: 102,
    name: 'Chris Sale',
    team: 'Atlanta Braves',
    teamAbbr: 'ATL',
    position: 'SP',
    gp: 29,
    gs: 29,
    ip: 178.0,
    wins: 18,
    losses: 3,
    era: 2.38,
    whip: 0.98,
    so: 225,
    bb: 42,
    hits: 132,
    hr: 18,
    k9: 11.4,
    bb9: 2.1,
    hr9: 0.9,
    kBbRatio: 5.36,
    fip: 2.82,
    war: 6.8,
    babip: 0.268,
    soProp: 7.5,
    soHitRate: 58,
    outsProp: 18.5,
    outsHitRate: 52,
    trend: 'hot',
    hotStreak: 'Career resurgence'
  },
  {
    id: 103,
    name: 'Zack Wheeler',
    team: 'Philadelphia Phillies',
    teamAbbr: 'PHI',
    position: 'SP',
    gp: 32,
    gs: 32,
    ip: 200.0,
    wins: 16,
    losses: 7,
    era: 2.57,
    whip: 0.96,
    so: 224,
    bb: 48,
    hits: 144,
    hr: 16,
    k9: 10.1,
    bb9: 2.2,
    hr9: 0.7,
    kBbRatio: 4.67,
    fip: 2.64,
    war: 6.5,
    babip: 0.272,
    soProp: 7.5,
    soHitRate: 54,
    outsProp: 18.5,
    outsHitRate: 56,
    trend: 'neutral'
  },
  {
    id: 104,
    name: 'Seth Lugo',
    team: 'Kansas City Royals',
    teamAbbr: 'KC',
    position: 'SP',
    gp: 33,
    gs: 33,
    ip: 206.2,
    wins: 16,
    losses: 9,
    era: 3.00,
    whip: 1.09,
    so: 181,
    bb: 52,
    hits: 174,
    hr: 22,
    k9: 7.9,
    bb9: 2.3,
    hr9: 1.0,
    kBbRatio: 3.48,
    fip: 3.42,
    war: 5.2,
    babip: 0.282,
    soProp: 5.5,
    soHitRate: 48,
    outsProp: 18.5,
    outsHitRate: 58,
    trend: 'neutral'
  },
  {
    id: 105,
    name: 'Corbin Burnes',
    team: 'Baltimore Orioles',
    teamAbbr: 'BAL',
    position: 'SP',
    gp: 32,
    gs: 32,
    ip: 194.1,
    wins: 15,
    losses: 9,
    era: 2.92,
    whip: 1.10,
    so: 181,
    bb: 56,
    hits: 158,
    hr: 18,
    k9: 8.4,
    bb9: 2.6,
    hr9: 0.8,
    kBbRatio: 3.23,
    fip: 3.18,
    war: 5.0,
    babip: 0.276,
    soProp: 5.5,
    soHitRate: 52,
    outsProp: 18.5,
    outsHitRate: 52,
    trend: 'cold',
    hotStreak: 'Sub 5 Ks in 3 of last 5'
  }
]

const teams = ['All Teams', 'ARI', 'ATL', 'BAL', 'BOS', 'CHC', 'CHW', 'CIN', 'CLE', 'COL', 'DET', 'HOU', 'KC', 'LAA', 'LAD', 'MIA', 'MIL', 'MIN', 'NYM', 'NYY', 'OAK', 'PHI', 'PIT', 'SD', 'SF', 'SEA', 'STL', 'TB', 'TEX', 'TOR', 'WSH']
const positions = ['All Positions', 'C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF', 'DH', 'SP', 'RP']
const seasons = ['2024', '2023', '2022']

export default function MLBPlayerStatsPage() {
  const [category, setCategory] = useState<StatCategory>('batting')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTeam, setSelectedTeam] = useState('All Teams')
  const [selectedPosition, setSelectedPosition] = useState('All Positions')
  const [selectedSeason, setSelectedSeason] = useState('2024')
  const [sortColumn, setSortColumn] = useState('avg')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')

  const isPitching = category === 'pitching'

  const filteredPlayers = useMemo(() => {
    const players = isPitching ? mockPitchers : mockBatters
    return players
      .filter(player => {
        const matchesSearch = player.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                             player.team.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesTeam = selectedTeam === 'All Teams' || player.teamAbbr === selectedTeam
        const matchesPosition = selectedPosition === 'All Positions' || player.position === selectedPosition
        return matchesSearch && matchesTeam && matchesPosition
      })
      .sort((a, b) => {
        const aVal = a[sortColumn as keyof typeof a]
        const bVal = b[sortColumn as keyof typeof b]
        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return sortDirection === 'desc' ? bVal - aVal : aVal - bVal
        }
        return 0
      })
  }, [searchQuery, selectedTeam, selectedPosition, sortColumn, sortDirection, isPitching])

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(prev => prev === 'desc' ? 'asc' : 'desc')
    } else {
      setSortColumn(column)
      setSortDirection('desc')
    }
  }

  const hotBatters = mockBatters.filter(b => b.trend === 'hot').slice(0, 4)
  const hotPitchers = mockPitchers.filter(p => p.trend === 'hot').slice(0, 3)

  const categoryConfig = {
    batting: { icon: Target, label: 'Batting', color: '#FF6B35' },
    power: { icon: Zap, label: 'Power', color: '#E74C3C' },
    discipline: { icon: Activity, label: 'Discipline', color: '#4ECDC4' },
    pitching: { icon: Shield, label: 'Pitching', color: '#9B59B6' },
    advanced: { icon: BarChart3, label: 'Advanced', color: '#3498DB' },
    props: { icon: Star, label: 'Props', color: '#FFD93D' }
  }

  return (
    <div className="min-h-screen" style={{ background: '#050508' }}>
      {/* Header */}
      <section className="relative overflow-hidden border-b border-white/10" style={{ background: 'linear-gradient(180deg, #0a0a12 0%, #050508 100%)' }}>
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-[600px] h-[400px] rounded-full opacity-10 blur-[100px]" style={{ background: '#002D72' }} />
          <div className="absolute bottom-0 right-1/4 w-[500px] h-[300px] rounded-full opacity-10 blur-[80px]" style={{ background: '#D50032' }} />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
          <Link href="/mlb" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white mb-6 transition-colors">
            <ChevronLeft className="w-4 h-4" />
            Back to MLB
          </Link>

          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #002D72 0%, #D50032 100%)' }}>
                  <Users className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-3xl md:text-4xl font-black text-white">MLB Player Stats</h1>
              </div>
              <p className="text-gray-400">Comprehensive player statistics with betting prop insights</p>
            </div>

            {/* Season Selector */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">Season:</span>
              <select 
                value={selectedSeason}
                onChange={(e) => setSelectedSeason(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-orange-500"
                aria-label="Select season"
              >
                {seasons.map(season => (
                  <option key={season} value={season} className="bg-gray-900">{season}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main Content */}
          <div className="flex-1">
            {/* Category Tabs */}
            <div className="flex flex-wrap gap-2 mb-6">
              {(Object.keys(categoryConfig) as StatCategory[]).map((cat) => {
                const config = categoryConfig[cat]
                const Icon = config.icon
                return (
                  <button
                    key={cat}
                    onClick={() => {
                      setCategory(cat)
                      if (cat === 'pitching') {
                        setSortColumn('era')
                        setSortDirection('asc')
                      } else {
                        setSortColumn('avg')
                        setSortDirection('desc')
                      }
                    }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                      category === cat 
                        ? 'text-white' 
                        : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                    }`}
                    style={category === cat ? { background: `${config.color}20`, color: config.color, border: `1px solid ${config.color}40` } : {}}
                  >
                    <Icon className="w-4 h-4" />
                    {config.label}
                  </button>
                )
              })}
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-4 mb-6">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search players..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-white placeholder:text-gray-500 focus:outline-none focus:border-orange-500"
                />
              </div>
              <select 
                value={selectedTeam}
                onChange={(e) => setSelectedTeam(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-orange-500"
                aria-label="Filter by team"
              >
                {teams.map(team => (
                  <option key={team} value={team} className="bg-gray-900">{team}</option>
                ))}
              </select>
              <select 
                value={selectedPosition}
                onChange={(e) => setSelectedPosition(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-orange-500"
                aria-label="Filter by position"
              >
                {positions.map(pos => (
                  <option key={pos} value={pos} className="bg-gray-900">{pos}</option>
                ))}
              </select>
            </div>

            {/* Stats Table */}
            <div className="rounded-xl border border-white/10 overflow-hidden" style={{ background: 'rgba(255,255,255,0.02)' }}>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10" style={{ background: 'rgba(255,255,255,0.05)' }}>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Player</th>
                      {category === 'batting' && (
                        <>
                          <th className="px-3 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white" onClick={() => handleSort('avg')}>
                            <div className="flex items-center justify-center gap-1">AVG <ArrowUpDown className="w-3 h-3" /></div>
                          </th>
                          <th className="px-3 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white" onClick={() => handleSort('obp')}>
                            <div className="flex items-center justify-center gap-1">OBP <ArrowUpDown className="w-3 h-3" /></div>
                          </th>
                          <th className="px-3 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white" onClick={() => handleSort('slg')}>
                            <div className="flex items-center justify-center gap-1">SLG <ArrowUpDown className="w-3 h-3" /></div>
                          </th>
                          <th className="px-3 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white" onClick={() => handleSort('ops')}>
                            <div className="flex items-center justify-center gap-1">OPS <ArrowUpDown className="w-3 h-3" /></div>
                          </th>
                          <th className="px-3 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">H</th>
                          <th className="px-3 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">GP</th>
                          <th className="px-3 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Hits Prop</th>
                          <th className="px-3 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Hit Rate</th>
                        </>
                      )}
                      {category === 'power' && (
                        <>
                          <th className="px-3 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white" onClick={() => handleSort('hr')}>
                            <div className="flex items-center justify-center gap-1">HR <ArrowUpDown className="w-3 h-3" /></div>
                          </th>
                          <th className="px-3 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white" onClick={() => handleSort('rbi')}>
                            <div className="flex items-center justify-center gap-1">RBI <ArrowUpDown className="w-3 h-3" /></div>
                          </th>
                          <th className="px-3 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white" onClick={() => handleSort('runs')}>
                            <div className="flex items-center justify-center gap-1">R <ArrowUpDown className="w-3 h-3" /></div>
                          </th>
                          <th className="px-3 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">2B</th>
                          <th className="px-3 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">3B</th>
                          <th className="px-3 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white" onClick={() => handleSort('iso')}>
                            <div className="flex items-center justify-center gap-1">ISO <ArrowUpDown className="w-3 h-3" /></div>
                          </th>
                          <th className="px-3 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">TB Prop</th>
                          <th className="px-3 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Hit Rate</th>
                        </>
                      )}
                      {category === 'discipline' && (
                        <>
                          <th className="px-3 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white" onClick={() => handleSort('bb')}>
                            <div className="flex items-center justify-center gap-1">BB <ArrowUpDown className="w-3 h-3" /></div>
                          </th>
                          <th className="px-3 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white" onClick={() => handleSort('so')}>
                            <div className="flex items-center justify-center gap-1">SO <ArrowUpDown className="w-3 h-3" /></div>
                          </th>
                          <th className="px-3 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white" onClick={() => handleSort('bbPct')}>
                            <div className="flex items-center justify-center gap-1">BB% <ArrowUpDown className="w-3 h-3" /></div>
                          </th>
                          <th className="px-3 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white" onClick={() => handleSort('kPct')}>
                            <div className="flex items-center justify-center gap-1">K% <ArrowUpDown className="w-3 h-3" /></div>
                          </th>
                          <th className="px-3 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white" onClick={() => handleSort('sb')}>
                            <div className="flex items-center justify-center gap-1">SB <ArrowUpDown className="w-3 h-3" /></div>
                          </th>
                          <th className="px-3 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">PA</th>
                        </>
                      )}
                      {category === 'pitching' && (
                        <>
                          <th className="px-3 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">W-L</th>
                          <th className="px-3 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white" onClick={() => handleSort('era')}>
                            <div className="flex items-center justify-center gap-1">ERA <ArrowUpDown className="w-3 h-3" /></div>
                          </th>
                          <th className="px-3 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white" onClick={() => handleSort('whip')}>
                            <div className="flex items-center justify-center gap-1">WHIP <ArrowUpDown className="w-3 h-3" /></div>
                          </th>
                          <th className="px-3 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white" onClick={() => handleSort('so')}>
                            <div className="flex items-center justify-center gap-1">K <ArrowUpDown className="w-3 h-3" /></div>
                          </th>
                          <th className="px-3 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white" onClick={() => handleSort('ip')}>
                            <div className="flex items-center justify-center gap-1">IP <ArrowUpDown className="w-3 h-3" /></div>
                          </th>
                          <th className="px-3 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">K Prop</th>
                          <th className="px-3 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Hit Rate</th>
                        </>
                      )}
                      {category === 'advanced' && (
                        <>
                          <th className="px-3 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white" onClick={() => handleSort('war')}>
                            <div className="flex items-center justify-center gap-1">WAR <ArrowUpDown className="w-3 h-3" /></div>
                          </th>
                          <th className="px-3 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white" onClick={() => handleSort('wrc')}>
                            <div className="flex items-center justify-center gap-1">wRC+ <ArrowUpDown className="w-3 h-3" /></div>
                          </th>
                          <th className="px-3 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white" onClick={() => handleSort('babip')}>
                            <div className="flex items-center justify-center gap-1">BABIP <ArrowUpDown className="w-3 h-3" /></div>
                          </th>
                          <th className="px-3 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">OPS</th>
                          <th className="px-3 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">GP</th>
                        </>
                      )}
                      {category === 'props' && (
                        <>
                          <th className="px-3 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Hits Prop</th>
                          <th className="px-3 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Hits Hit%</th>
                          <th className="px-3 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">TB Prop</th>
                          <th className="px-3 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">TB Hit%</th>
                          <th className="px-3 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">R+RBI Prop</th>
                          <th className="px-3 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">R+RBI Hit%</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredPlayers.map((player, index) => (
                      <tr 
                        key={player.id}
                        className="hover:bg-white/5 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-gray-500 w-5">{index + 1}</span>
                            <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xs font-bold text-white" style={{ background: 'linear-gradient(135deg, #002D72 0%, #D50032 100%)' }}>
                              {player.teamAbbr}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-white">{player.name}</span>
                                {player.trend === 'hot' && <Flame className="w-4 h-4 text-orange-500" />}
                                {player.trend === 'cold' && <TrendingDown className="w-4 h-4 text-blue-400" />}
                              </div>
                              <div className="text-xs text-gray-500">{player.team} • {player.position}</div>
                            </div>
                          </div>
                        </td>
                        {category === 'batting' && !isPitching && (
                          <>
                            <td className="px-3 py-3 text-center">
                              <span className="font-bold text-white text-lg">{(player as Batter).avg.toFixed(3)}</span>
                            </td>
                            <td className="px-3 py-3 text-center text-gray-300">{(player as Batter).obp.toFixed(3)}</td>
                            <td className="px-3 py-3 text-center text-gray-300">{(player as Batter).slg.toFixed(3)}</td>
                            <td className="px-3 py-3 text-center font-semibold text-white">{(player as Batter).ops.toFixed(3)}</td>
                            <td className="px-3 py-3 text-center text-gray-400">{(player as Batter).hits}</td>
                            <td className="px-3 py-3 text-center text-gray-400">{(player as Batter).gp}</td>
                            <td className="px-3 py-3 text-center">
                              <span className="px-2 py-1 rounded text-xs font-medium" style={{ background: 'rgba(255,107,53,0.2)', color: '#FF6B35' }}>
                                O/U {(player as Batter).hitsProp}
                              </span>
                            </td>
                            <td className="px-3 py-3 text-center">
                              <span className={`font-semibold ${(player as Batter).hitsHitRate >= 60 ? 'text-green-400' : (player as Batter).hitsHitRate >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                                {(player as Batter).hitsHitRate}%
                              </span>
                            </td>
                          </>
                        )}
                        {category === 'power' && !isPitching && (
                          <>
                            <td className="px-3 py-3 text-center">
                              <span className="font-bold text-white text-lg">{(player as Batter).hr}</span>
                            </td>
                            <td className="px-3 py-3 text-center text-gray-300">{(player as Batter).rbi}</td>
                            <td className="px-3 py-3 text-center text-gray-300">{(player as Batter).runs}</td>
                            <td className="px-3 py-3 text-center text-gray-400">{(player as Batter).doubles}</td>
                            <td className="px-3 py-3 text-center text-gray-400">{(player as Batter).triples}</td>
                            <td className="px-3 py-3 text-center text-gray-300">{(player as Batter).iso.toFixed(3)}</td>
                            <td className="px-3 py-3 text-center">
                              <span className="px-2 py-1 rounded text-xs font-medium" style={{ background: 'rgba(231,76,60,0.2)', color: '#E74C3C' }}>
                                O/U {(player as Batter).tbProp}
                              </span>
                            </td>
                            <td className="px-3 py-3 text-center">
                              <span className={`font-semibold ${(player as Batter).tbHitRate >= 60 ? 'text-green-400' : (player as Batter).tbHitRate >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                                {(player as Batter).tbHitRate}%
                              </span>
                            </td>
                          </>
                        )}
                        {category === 'discipline' && !isPitching && (
                          <>
                            <td className="px-3 py-3 text-center">
                              <span className="font-bold text-white text-lg">{(player as Batter).bb}</span>
                            </td>
                            <td className="px-3 py-3 text-center text-gray-300">{(player as Batter).so}</td>
                            <td className="px-3 py-3 text-center">
                              <span className={`${(player as Batter).bbPct >= 12 ? 'text-green-400' : 'text-gray-300'}`}>
                                {(player as Batter).bbPct}%
                              </span>
                            </td>
                            <td className="px-3 py-3 text-center">
                              <span className={`${(player as Batter).kPct <= 18 ? 'text-green-400' : 'text-gray-300'}`}>
                                {(player as Batter).kPct}%
                              </span>
                            </td>
                            <td className="px-3 py-3 text-center text-gray-300">{(player as Batter).sb}</td>
                            <td className="px-3 py-3 text-center text-gray-400">{(player as Batter).pa}</td>
                          </>
                        )}
                        {category === 'pitching' && isPitching && (
                          <>
                            <td className="px-3 py-3 text-center text-white font-medium">
                              {(player as Pitcher).wins}-{(player as Pitcher).losses}
                            </td>
                            <td className="px-3 py-3 text-center">
                              <span className={`font-bold text-lg ${(player as Pitcher).era <= 3.00 ? 'text-green-400' : (player as Pitcher).era <= 4.00 ? 'text-white' : 'text-red-400'}`}>
                                {(player as Pitcher).era.toFixed(2)}
                              </span>
                            </td>
                            <td className="px-3 py-3 text-center">
                              <span className={`${(player as Pitcher).whip <= 1.10 ? 'text-green-400' : 'text-gray-300'}`}>
                                {(player as Pitcher).whip.toFixed(2)}
                              </span>
                            </td>
                            <td className="px-3 py-3 text-center font-semibold text-white">{(player as Pitcher).so}</td>
                            <td className="px-3 py-3 text-center text-gray-300">{(player as Pitcher).ip}</td>
                            <td className="px-3 py-3 text-center">
                              <span className="px-2 py-1 rounded text-xs font-medium" style={{ background: 'rgba(155,89,182,0.2)', color: '#9B59B6' }}>
                                O/U {(player as Pitcher).soProp}
                              </span>
                            </td>
                            <td className="px-3 py-3 text-center">
                              <span className={`font-semibold ${(player as Pitcher).soHitRate >= 60 ? 'text-green-400' : (player as Pitcher).soHitRate >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                                {(player as Pitcher).soHitRate}%
                              </span>
                            </td>
                          </>
                        )}
                        {category === 'advanced' && !isPitching && (
                          <>
                            <td className="px-3 py-3 text-center">
                              <span className="font-bold text-white text-lg">{(player as Batter).war.toFixed(1)}</span>
                            </td>
                            <td className="px-3 py-3 text-center">
                              <span className={`font-semibold ${(player as Batter).wrc >= 150 ? 'text-green-400' : 'text-white'}`}>
                                {(player as Batter).wrc}
                              </span>
                            </td>
                            <td className="px-3 py-3 text-center text-gray-300">{(player as Batter).babip.toFixed(3)}</td>
                            <td className="px-3 py-3 text-center text-gray-300">{(player as Batter).ops.toFixed(3)}</td>
                            <td className="px-3 py-3 text-center text-gray-400">{(player as Batter).gp}</td>
                          </>
                        )}
                        {category === 'props' && !isPitching && (
                          <>
                            <td className="px-3 py-3 text-center">
                              <span className="px-2 py-1 rounded text-xs font-medium" style={{ background: 'rgba(255,107,53,0.2)', color: '#FF6B35' }}>
                                O/U {(player as Batter).hitsProp}
                              </span>
                            </td>
                            <td className="px-3 py-3 text-center">
                              <span className={`font-semibold ${(player as Batter).hitsHitRate >= 60 ? 'text-green-400' : (player as Batter).hitsHitRate >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                                {(player as Batter).hitsHitRate}%
                              </span>
                            </td>
                            <td className="px-3 py-3 text-center">
                              <span className="px-2 py-1 rounded text-xs font-medium" style={{ background: 'rgba(231,76,60,0.2)', color: '#E74C3C' }}>
                                O/U {(player as Batter).tbProp}
                              </span>
                            </td>
                            <td className="px-3 py-3 text-center">
                              <span className={`font-semibold ${(player as Batter).tbHitRate >= 60 ? 'text-green-400' : (player as Batter).tbHitRate >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                                {(player as Batter).tbHitRate}%
                              </span>
                            </td>
                            <td className="px-3 py-3 text-center">
                              <span className="px-2 py-1 rounded text-xs font-medium" style={{ background: 'rgba(78,205,196,0.2)', color: '#4ECDC4' }}>
                                O/U {(player as Batter).rbProp}
                              </span>
                            </td>
                            <td className="px-3 py-3 text-center">
                              <span className={`font-semibold ${(player as Batter).rbHitRate >= 60 ? 'text-green-400' : (player as Batter).rbHitRate >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                                {(player as Batter).rbHitRate}%
                              </span>
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="w-full lg:w-80 space-y-6">
            {/* Hot Batters */}
            <div className="rounded-xl border border-white/10 p-5" style={{ background: 'rgba(255,255,255,0.02)' }}>
              <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                <Flame className="w-4 h-4 text-orange-500" />
                HOT BATS - RIDE THE STREAK
              </h3>
              <div className="space-y-3">
                {hotBatters.map(batter => (
                  <div key={batter.id} className="rounded-lg p-3 border border-orange-500/20" style={{ background: 'rgba(255,107,53,0.1)' }}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-white text-sm">{batter.name}</span>
                      <span className="text-xs px-2 py-0.5 rounded" style={{ background: 'rgba(255,107,53,0.3)', color: '#FF6B35' }}>
                        🔥 HOT
                      </span>
                    </div>
                    <div className="text-xs text-gray-400 mb-2">{batter.teamAbbr} • {batter.position}</div>
                    <div className="text-xs text-orange-400">{batter.hotStreak}</div>
                    <div className="mt-2 flex gap-2">
                      <span className="text-xs px-2 py-1 rounded bg-white/10 text-white">.{(batter.avg * 1000).toFixed(0)} AVG</span>
                      <span className="text-xs text-green-400 font-medium">{batter.hr} HR</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Hot Pitchers */}
            <div className="rounded-xl border border-white/10 p-5" style={{ background: 'rgba(255,255,255,0.02)' }}>
              <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                <Target className="w-4 h-4 text-purple-500" />
                ACE WATCH - TOP PITCHERS
              </h3>
              <div className="space-y-3">
                {hotPitchers.map(pitcher => (
                  <div key={pitcher.id} className="rounded-lg p-3 border border-purple-500/20" style={{ background: 'rgba(155,89,182,0.1)' }}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-white text-sm">{pitcher.name}</span>
                      <span className="text-xs px-2 py-0.5 rounded" style={{ background: 'rgba(155,89,182,0.3)', color: '#9B59B6' }}>
                        ⭐ ACE
                      </span>
                    </div>
                    <div className="text-xs text-gray-400 mb-2">{pitcher.teamAbbr} • {pitcher.position}</div>
                    <div className="text-xs text-purple-400">{pitcher.hotStreak}</div>
                    <div className="mt-2 flex gap-2">
                      <span className="text-xs px-2 py-1 rounded bg-white/10 text-white">{pitcher.era} ERA</span>
                      <span className="text-xs text-green-400 font-medium">{pitcher.so} K</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Links */}
            <div className="rounded-xl border border-white/10 p-5" style={{ background: 'rgba(255,255,255,0.02)' }}>
              <h3 className="text-sm font-bold text-white mb-4">Quick Links</h3>
              <div className="space-y-2">
                <Link href="/scores?sport=mlb" className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                  <span className="text-sm text-white">Today&apos;s Matchups</span>
                  <ChevronDown className="w-4 h-4 text-gray-400 rotate-[-90deg]" />
                </Link>
                <Link href="/mlb" className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                  <span className="text-sm text-white">Team Stats</span>
                  <ChevronDown className="w-4 h-4 text-gray-400 rotate-[-90deg]" />
                </Link>
                <Link href="/mlb" className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                  <span className="text-sm text-white">Standings</span>
                  <ChevronDown className="w-4 h-4 text-gray-400 rotate-[-90deg]" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
