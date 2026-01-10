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

type StatCategory = 'scoring' | 'assists' | 'shooting' | 'plusminus' | 'toi' | 'advanced'

interface Skater {
  id: number
  name: string
  team: string
  teamAbbr: string
  position: string
  gp: number
  // Scoring
  goals: number
  assists: number
  points: number
  ppg: number // points per game
  gwg: number // game winning goals
  otg: number // overtime goals
  // Assists breakdown
  primaryAssists: number
  secondaryAssists: number
  ppAssists: number
  shAssists: number
  // Shooting
  shots: number
  shootingPct: number
  shotsPerGame: number
  ixg: number // individual expected goals
  // Plus/Minus
  plusMinus: number
  evenPlusMinus: number
  ppPlusMinus: number
  // Time on Ice
  toi: string // average per game
  evenToi: string
  ppToi: string
  shToi: string
  shifts: number
  // Advanced
  corsi: number
  fenwick: number
  pdo: number
  ozPct: number // offensive zone start %
  // Props
  pointsProp: number
  pointsHitRate: number
  shotsProp: number
  shotsHitRate: number
  sogProp: number
  sogHitRate: number
  trend: 'hot' | 'cold' | 'neutral'
  hotStreak?: string
}

// Mock data
const mockSkaters: Skater[] = [
  {
    id: 1,
    name: 'Nathan MacKinnon',
    team: 'Colorado Avalanche',
    teamAbbr: 'COL',
    position: 'C',
    gp: 48,
    goals: 28,
    assists: 52,
    points: 80,
    ppg: 1.67,
    gwg: 6,
    otg: 2,
    primaryAssists: 38,
    secondaryAssists: 14,
    ppAssists: 18,
    shAssists: 0,
    shots: 198,
    shootingPct: 14.1,
    shotsPerGame: 4.1,
    ixg: 24.2,
    plusMinus: 28,
    evenPlusMinus: 22,
    ppPlusMinus: 6,
    toi: '21:42',
    evenToi: '16:18',
    ppToi: '4:32',
    shToi: '0:52',
    shifts: 1104,
    corsi: 56.8,
    fenwick: 55.4,
    pdo: 102.4,
    ozPct: 62.4,
    pointsProp: 1.5,
    pointsHitRate: 68,
    shotsProp: 4.5,
    shotsHitRate: 48,
    sogProp: 3.5,
    sogHitRate: 62,
    trend: 'hot',
    hotStreak: '12-game point streak'
  },
  {
    id: 2,
    name: 'Nikita Kucherov',
    team: 'Tampa Bay Lightning',
    teamAbbr: 'TBL',
    position: 'RW',
    gp: 46,
    goals: 32,
    assists: 56,
    points: 88,
    ppg: 1.91,
    gwg: 5,
    otg: 1,
    primaryAssists: 42,
    secondaryAssists: 14,
    ppAssists: 22,
    shAssists: 0,
    shots: 168,
    shootingPct: 19.0,
    shotsPerGame: 3.7,
    ixg: 22.8,
    plusMinus: 24,
    evenPlusMinus: 18,
    ppPlusMinus: 6,
    toi: '20:24',
    evenToi: '14:48',
    ppToi: '4:52',
    shToi: '0:44',
    shifts: 1012,
    corsi: 54.2,
    fenwick: 53.8,
    pdo: 104.2,
    ozPct: 68.2,
    pointsProp: 1.5,
    pointsHitRate: 72,
    shotsProp: 4.5,
    shotsHitRate: 42,
    sogProp: 3.5,
    sogHitRate: 58,
    trend: 'hot',
    hotStreak: 'League leader in points'
  },
  {
    id: 3,
    name: 'Connor McDavid',
    team: 'Edmonton Oilers',
    teamAbbr: 'EDM',
    position: 'C',
    gp: 44,
    goals: 24,
    assists: 48,
    points: 72,
    ppg: 1.64,
    gwg: 4,
    otg: 3,
    primaryAssists: 36,
    secondaryAssists: 12,
    ppAssists: 16,
    shAssists: 1,
    shots: 156,
    shootingPct: 15.4,
    shotsPerGame: 3.5,
    ixg: 21.4,
    plusMinus: 18,
    evenPlusMinus: 14,
    ppPlusMinus: 4,
    toi: '22:08',
    evenToi: '16:42',
    ppToi: '4:24',
    shToi: '1:02',
    shifts: 1048,
    corsi: 58.2,
    fenwick: 57.6,
    pdo: 101.8,
    ozPct: 64.8,
    pointsProp: 1.5,
    pointsHitRate: 64,
    shotsProp: 4.5,
    shotsHitRate: 38,
    sogProp: 3.5,
    sogHitRate: 52,
    trend: 'neutral'
  },
  {
    id: 4,
    name: 'Leon Draisaitl',
    team: 'Edmonton Oilers',
    teamAbbr: 'EDM',
    position: 'C',
    gp: 46,
    goals: 34,
    assists: 38,
    points: 72,
    ppg: 1.57,
    gwg: 8,
    otg: 2,
    primaryAssists: 28,
    secondaryAssists: 10,
    ppAssists: 14,
    shAssists: 0,
    shots: 178,
    shootingPct: 19.1,
    shotsPerGame: 3.9,
    ixg: 26.4,
    plusMinus: 14,
    evenPlusMinus: 10,
    ppPlusMinus: 4,
    toi: '21:18',
    evenToi: '15:54',
    ppToi: '4:38',
    shToi: '0:46',
    shifts: 1068,
    corsi: 52.4,
    fenwick: 51.8,
    pdo: 103.2,
    ozPct: 58.6,
    pointsProp: 1.5,
    pointsHitRate: 58,
    shotsProp: 4.5,
    shotsHitRate: 44,
    sogProp: 3.5,
    sogHitRate: 56,
    trend: 'hot',
    hotStreak: 'League leader in goals'
  },
  {
    id: 5,
    name: 'Auston Matthews',
    team: 'Toronto Maple Leafs',
    teamAbbr: 'TOR',
    position: 'C',
    gp: 42,
    goals: 28,
    assists: 26,
    points: 54,
    ppg: 1.29,
    gwg: 6,
    otg: 1,
    primaryAssists: 20,
    secondaryAssists: 6,
    ppAssists: 8,
    shAssists: 0,
    shots: 188,
    shootingPct: 14.9,
    shotsPerGame: 4.5,
    ixg: 28.2,
    plusMinus: 8,
    evenPlusMinus: 6,
    ppPlusMinus: 2,
    toi: '20:48',
    evenToi: '16:12',
    ppToi: '3:48',
    shToi: '0:48',
    shifts: 988,
    corsi: 54.8,
    fenwick: 54.2,
    pdo: 100.6,
    ozPct: 56.4,
    pointsProp: 1.5,
    pointsHitRate: 48,
    shotsProp: 4.5,
    shotsHitRate: 52,
    sogProp: 4.5,
    sogHitRate: 48,
    trend: 'cold',
    hotStreak: '2 goals in last 8 games'
  },
  {
    id: 6,
    name: 'David Pastrnak',
    team: 'Boston Bruins',
    teamAbbr: 'BOS',
    position: 'RW',
    gp: 47,
    goals: 30,
    assists: 32,
    points: 62,
    ppg: 1.32,
    gwg: 5,
    otg: 2,
    primaryAssists: 24,
    secondaryAssists: 8,
    ppAssists: 12,
    shAssists: 0,
    shots: 212,
    shootingPct: 14.2,
    shotsPerGame: 4.5,
    ixg: 26.8,
    plusMinus: 12,
    evenPlusMinus: 8,
    ppPlusMinus: 4,
    toi: '19:42',
    evenToi: '14:48',
    ppToi: '4:12',
    shToi: '0:42',
    shifts: 1024,
    corsi: 52.6,
    fenwick: 52.2,
    pdo: 101.4,
    ozPct: 60.2,
    pointsProp: 1.5,
    pointsHitRate: 54,
    shotsProp: 4.5,
    shotsHitRate: 56,
    sogProp: 4.5,
    sogHitRate: 52,
    trend: 'neutral'
  },
  {
    id: 7,
    name: 'Cale Makar',
    team: 'Colorado Avalanche',
    teamAbbr: 'COL',
    position: 'D',
    gp: 46,
    goals: 18,
    assists: 42,
    points: 60,
    ppg: 1.30,
    gwg: 3,
    otg: 1,
    primaryAssists: 32,
    secondaryAssists: 10,
    ppAssists: 16,
    shAssists: 0,
    shots: 168,
    shootingPct: 10.7,
    shotsPerGame: 3.7,
    ixg: 14.2,
    plusMinus: 22,
    evenPlusMinus: 18,
    ppPlusMinus: 4,
    toi: '26:18',
    evenToi: '18:42',
    ppToi: '4:48',
    shToi: '2:48',
    shifts: 1242,
    corsi: 58.4,
    fenwick: 57.8,
    pdo: 102.8,
    ozPct: 54.6,
    pointsProp: 1.5,
    pointsHitRate: 52,
    shotsProp: 4.5,
    shotsHitRate: 42,
    sogProp: 3.5,
    sogHitRate: 58,
    trend: 'hot',
    hotStreak: 'Best +/- among D-men'
  },
  {
    id: 8,
    name: 'Quinn Hughes',
    team: 'Vancouver Canucks',
    teamAbbr: 'VAN',
    position: 'D',
    gp: 48,
    goals: 12,
    assists: 48,
    points: 60,
    ppg: 1.25,
    gwg: 2,
    otg: 0,
    primaryAssists: 36,
    secondaryAssists: 12,
    ppAssists: 18,
    shAssists: 0,
    shots: 142,
    shootingPct: 8.5,
    shotsPerGame: 3.0,
    ixg: 10.8,
    plusMinus: 18,
    evenPlusMinus: 14,
    ppPlusMinus: 4,
    toi: '25:36',
    evenToi: '17:48',
    ppToi: '5:12',
    shToi: '2:36',
    shifts: 1286,
    corsi: 55.2,
    fenwick: 54.8,
    pdo: 101.2,
    ozPct: 52.8,
    pointsProp: 1.5,
    pointsHitRate: 48,
    shotsProp: 3.5,
    shotsHitRate: 44,
    sogProp: 2.5,
    sogHitRate: 62,
    trend: 'neutral'
  }
]

const teams = ['All Teams', 'ANA', 'ARI', 'BOS', 'BUF', 'CAR', 'CBJ', 'CGY', 'CHI', 'COL', 'DAL', 'DET', 'EDM', 'FLA', 'LAK', 'MIN', 'MTL', 'NJD', 'NSH', 'NYI', 'NYR', 'OTT', 'PHI', 'PIT', 'SEA', 'SJS', 'STL', 'TBL', 'TOR', 'VAN', 'VGK', 'WPG', 'WSH']
const positions = ['All Positions', 'C', 'LW', 'RW', 'D']
const seasons = ['2024-25', '2023-24', '2022-23']

export default function NHLSkatersPage() {
  const [category, setCategory] = useState<StatCategory>('scoring')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTeam, setSelectedTeam] = useState('All Teams')
  const [selectedPosition, setSelectedPosition] = useState('All Positions')
  const [selectedSeason, setSelectedSeason] = useState('2024-25')
  const [sortColumn, setSortColumn] = useState('points')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')

  const filteredSkaters = useMemo(() => {
    return mockSkaters
      .filter(skater => {
        const matchesSearch = skater.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                             skater.team.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesTeam = selectedTeam === 'All Teams' || skater.teamAbbr === selectedTeam
        const matchesPosition = selectedPosition === 'All Positions' || skater.position === selectedPosition
        return matchesSearch && matchesTeam && matchesPosition
      })
      .sort((a, b) => {
        const aVal = a[sortColumn as keyof Skater]
        const bVal = b[sortColumn as keyof Skater]
        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return sortDirection === 'desc' ? bVal - aVal : aVal - bVal
        }
        return 0
      })
  }, [searchQuery, selectedTeam, selectedPosition, sortColumn, sortDirection])

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(prev => prev === 'desc' ? 'asc' : 'desc')
    } else {
      setSortColumn(column)
      setSortDirection('desc')
    }
  }

  const hotSkaters = mockSkaters.filter(s => s.trend === 'hot').slice(0, 5)
  const coldSkaters = mockSkaters.filter(s => s.trend === 'cold').slice(0, 3)

  const categoryConfig = {
    scoring: { icon: Target, label: 'Scoring', color: '#FF6B35' },
    assists: { icon: Zap, label: 'Assists', color: '#4ECDC4' },
    shooting: { icon: Activity, label: 'Shooting', color: '#FFD93D' },
    plusminus: { icon: TrendingUp, label: '+/-', color: '#6BCB77' },
    toi: { icon: Clock, label: 'Time on Ice', color: '#9B59B6' },
    advanced: { icon: BarChart3, label: 'Advanced', color: '#3498DB' }
  }

  return (
    <div className="min-h-screen" style={{ background: '#050508' }}>
      {/* Header */}
      <section className="relative overflow-hidden border-b border-white/10" style={{ background: 'linear-gradient(180deg, #0a0a12 0%, #050508 100%)' }}>
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-[600px] h-[400px] rounded-full opacity-10 blur-[100px]" style={{ background: '#041E42' }} />
          <div className="absolute bottom-0 right-1/4 w-[500px] h-[300px] rounded-full opacity-10 blur-[80px]" style={{ background: '#A6192E' }} />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
          <Link href="/nhl" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white mb-6 transition-colors">
            <ChevronLeft className="w-4 h-4" />
            Back to NHL
          </Link>

          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #041E42 0%, #A6192E 100%)' }}>
                  <Users className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-3xl md:text-4xl font-black text-white">NHL Skater Stats</h1>
              </div>
              <p className="text-gray-400">Comprehensive skater statistics with betting prop insights</p>
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
                    onClick={() => setCategory(cat)}
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
                  placeholder="Search skaters..."
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
                      {category === 'scoring' && (
                        <>
                          <th className="px-3 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white" onClick={() => handleSort('goals')}>
                            <div className="flex items-center justify-center gap-1">G <ArrowUpDown className="w-3 h-3" /></div>
                          </th>
                          <th className="px-3 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white" onClick={() => handleSort('assists')}>
                            <div className="flex items-center justify-center gap-1">A <ArrowUpDown className="w-3 h-3" /></div>
                          </th>
                          <th className="px-3 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white" onClick={() => handleSort('points')}>
                            <div className="flex items-center justify-center gap-1">PTS <ArrowUpDown className="w-3 h-3" /></div>
                          </th>
                          <th className="px-3 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white" onClick={() => handleSort('ppg')}>
                            <div className="flex items-center justify-center gap-1">P/GP <ArrowUpDown className="w-3 h-3" /></div>
                          </th>
                          <th className="px-3 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">GWG</th>
                          <th className="px-3 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">OTG</th>
                          <th className="px-3 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">GP</th>
                          <th className="px-3 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Pts Prop</th>
                          <th className="px-3 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Hit Rate</th>
                        </>
                      )}
                      {category === 'assists' && (
                        <>
                          <th className="px-3 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white" onClick={() => handleSort('assists')}>
                            <div className="flex items-center justify-center gap-1">A <ArrowUpDown className="w-3 h-3" /></div>
                          </th>
                          <th className="px-3 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white" onClick={() => handleSort('primaryAssists')}>
                            <div className="flex items-center justify-center gap-1">A1 <ArrowUpDown className="w-3 h-3" /></div>
                          </th>
                          <th className="px-3 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white" onClick={() => handleSort('secondaryAssists')}>
                            <div className="flex items-center justify-center gap-1">A2 <ArrowUpDown className="w-3 h-3" /></div>
                          </th>
                          <th className="px-3 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white" onClick={() => handleSort('ppAssists')}>
                            <div className="flex items-center justify-center gap-1">PP A <ArrowUpDown className="w-3 h-3" /></div>
                          </th>
                          <th className="px-3 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">SH A</th>
                          <th className="px-3 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">GP</th>
                        </>
                      )}
                      {category === 'shooting' && (
                        <>
                          <th className="px-3 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white" onClick={() => handleSort('shots')}>
                            <div className="flex items-center justify-center gap-1">SOG <ArrowUpDown className="w-3 h-3" /></div>
                          </th>
                          <th className="px-3 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white" onClick={() => handleSort('shootingPct')}>
                            <div className="flex items-center justify-center gap-1">SH% <ArrowUpDown className="w-3 h-3" /></div>
                          </th>
                          <th className="px-3 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white" onClick={() => handleSort('shotsPerGame')}>
                            <div className="flex items-center justify-center gap-1">S/GP <ArrowUpDown className="w-3 h-3" /></div>
                          </th>
                          <th className="px-3 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white" onClick={() => handleSort('ixg')}>
                            <div className="flex items-center justify-center gap-1">ixG <ArrowUpDown className="w-3 h-3" /></div>
                          </th>
                          <th className="px-3 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Goals</th>
                          <th className="px-3 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">SOG Prop</th>
                          <th className="px-3 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Hit Rate</th>
                        </>
                      )}
                      {category === 'plusminus' && (
                        <>
                          <th className="px-3 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white" onClick={() => handleSort('plusMinus')}>
                            <div className="flex items-center justify-center gap-1">+/- <ArrowUpDown className="w-3 h-3" /></div>
                          </th>
                          <th className="px-3 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white" onClick={() => handleSort('evenPlusMinus')}>
                            <div className="flex items-center justify-center gap-1">EV +/- <ArrowUpDown className="w-3 h-3" /></div>
                          </th>
                          <th className="px-3 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white" onClick={() => handleSort('ppPlusMinus')}>
                            <div className="flex items-center justify-center gap-1">PP +/- <ArrowUpDown className="w-3 h-3" /></div>
                          </th>
                          <th className="px-3 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Goals</th>
                          <th className="px-3 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">GP</th>
                        </>
                      )}
                      {category === 'toi' && (
                        <>
                          <th className="px-3 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white" onClick={() => handleSort('toi')}>
                            <div className="flex items-center justify-center gap-1">TOI/GP <ArrowUpDown className="w-3 h-3" /></div>
                          </th>
                          <th className="px-3 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">EV TOI</th>
                          <th className="px-3 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">PP TOI</th>
                          <th className="px-3 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">SH TOI</th>
                          <th className="px-3 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white" onClick={() => handleSort('shifts')}>
                            <div className="flex items-center justify-center gap-1">Shifts <ArrowUpDown className="w-3 h-3" /></div>
                          </th>
                          <th className="px-3 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">GP</th>
                        </>
                      )}
                      {category === 'advanced' && (
                        <>
                          <th className="px-3 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white" onClick={() => handleSort('corsi')}>
                            <div className="flex items-center justify-center gap-1">CF% <ArrowUpDown className="w-3 h-3" /></div>
                          </th>
                          <th className="px-3 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white" onClick={() => handleSort('fenwick')}>
                            <div className="flex items-center justify-center gap-1">FF% <ArrowUpDown className="w-3 h-3" /></div>
                          </th>
                          <th className="px-3 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white" onClick={() => handleSort('pdo')}>
                            <div className="flex items-center justify-center gap-1">PDO <ArrowUpDown className="w-3 h-3" /></div>
                          </th>
                          <th className="px-3 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white" onClick={() => handleSort('ozPct')}>
                            <div className="flex items-center justify-center gap-1">OZ% <ArrowUpDown className="w-3 h-3" /></div>
                          </th>
                          <th className="px-3 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">GP</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredSkaters.map((skater, index) => (
                      <tr 
                        key={skater.id}
                        className="hover:bg-white/5 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-gray-500 w-5">{index + 1}</span>
                            <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xs font-bold text-white" style={{ background: 'linear-gradient(135deg, #041E42 0%, #A6192E 100%)' }}>
                              {skater.teamAbbr}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-white">{skater.name}</span>
                                {skater.trend === 'hot' && <Flame className="w-4 h-4 text-orange-500" />}
                                {skater.trend === 'cold' && <TrendingDown className="w-4 h-4 text-blue-400" />}
                              </div>
                              <div className="text-xs text-gray-500">{skater.team} • {skater.position}</div>
                            </div>
                          </div>
                        </td>
                        {category === 'scoring' && (
                          <>
                            <td className="px-3 py-3 text-center font-bold text-white">{skater.goals}</td>
                            <td className="px-3 py-3 text-center text-gray-300">{skater.assists}</td>
                            <td className="px-3 py-3 text-center">
                              <span className="font-bold text-white text-lg">{skater.points}</span>
                            </td>
                            <td className="px-3 py-3 text-center text-gray-300">{skater.ppg.toFixed(2)}</td>
                            <td className="px-3 py-3 text-center text-gray-400">{skater.gwg}</td>
                            <td className="px-3 py-3 text-center text-gray-400">{skater.otg}</td>
                            <td className="px-3 py-3 text-center text-gray-400">{skater.gp}</td>
                            <td className="px-3 py-3 text-center">
                              <span className="px-2 py-1 rounded text-xs font-medium" style={{ background: 'rgba(255,107,53,0.2)', color: '#FF6B35' }}>
                                O/U {skater.pointsProp}
                              </span>
                            </td>
                            <td className="px-3 py-3 text-center">
                              <span className={`font-semibold ${skater.pointsHitRate >= 60 ? 'text-green-400' : skater.pointsHitRate >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                                {skater.pointsHitRate}%
                              </span>
                            </td>
                          </>
                        )}
                        {category === 'assists' && (
                          <>
                            <td className="px-3 py-3 text-center">
                              <span className="font-bold text-white text-lg">{skater.assists}</span>
                            </td>
                            <td className="px-3 py-3 text-center text-gray-300">{skater.primaryAssists}</td>
                            <td className="px-3 py-3 text-center text-gray-300">{skater.secondaryAssists}</td>
                            <td className="px-3 py-3 text-center text-gray-300">{skater.ppAssists}</td>
                            <td className="px-3 py-3 text-center text-gray-400">{skater.shAssists}</td>
                            <td className="px-3 py-3 text-center text-gray-400">{skater.gp}</td>
                          </>
                        )}
                        {category === 'shooting' && (
                          <>
                            <td className="px-3 py-3 text-center">
                              <span className="font-bold text-white text-lg">{skater.shots}</span>
                            </td>
                            <td className="px-3 py-3 text-center text-gray-300">{skater.shootingPct}%</td>
                            <td className="px-3 py-3 text-center text-gray-300">{skater.shotsPerGame}</td>
                            <td className="px-3 py-3 text-center text-gray-300">{skater.ixg}</td>
                            <td className="px-3 py-3 text-center text-gray-400">{skater.goals}</td>
                            <td className="px-3 py-3 text-center">
                              <span className="px-2 py-1 rounded text-xs font-medium" style={{ background: 'rgba(255,217,61,0.2)', color: '#FFD93D' }}>
                                O/U {skater.sogProp}
                              </span>
                            </td>
                            <td className="px-3 py-3 text-center">
                              <span className={`font-semibold ${skater.sogHitRate >= 60 ? 'text-green-400' : skater.sogHitRate >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                                {skater.sogHitRate}%
                              </span>
                            </td>
                          </>
                        )}
                        {category === 'plusminus' && (
                          <>
                            <td className="px-3 py-3 text-center">
                              <span className={`font-bold text-lg ${skater.plusMinus > 0 ? 'text-green-400' : skater.plusMinus < 0 ? 'text-red-400' : 'text-white'}`}>
                                {skater.plusMinus > 0 ? '+' : ''}{skater.plusMinus}
                              </span>
                            </td>
                            <td className="px-3 py-3 text-center">
                              <span className={`${skater.evenPlusMinus > 0 ? 'text-green-400' : skater.evenPlusMinus < 0 ? 'text-red-400' : 'text-gray-300'}`}>
                                {skater.evenPlusMinus > 0 ? '+' : ''}{skater.evenPlusMinus}
                              </span>
                            </td>
                            <td className="px-3 py-3 text-center">
                              <span className={`${skater.ppPlusMinus > 0 ? 'text-green-400' : skater.ppPlusMinus < 0 ? 'text-red-400' : 'text-gray-300'}`}>
                                {skater.ppPlusMinus > 0 ? '+' : ''}{skater.ppPlusMinus}
                              </span>
                            </td>
                            <td className="px-3 py-3 text-center text-gray-400">{skater.goals}</td>
                            <td className="px-3 py-3 text-center text-gray-400">{skater.gp}</td>
                          </>
                        )}
                        {category === 'toi' && (
                          <>
                            <td className="px-3 py-3 text-center">
                              <span className="font-bold text-white">{skater.toi}</span>
                            </td>
                            <td className="px-3 py-3 text-center text-gray-300">{skater.evenToi}</td>
                            <td className="px-3 py-3 text-center text-gray-300">{skater.ppToi}</td>
                            <td className="px-3 py-3 text-center text-gray-300">{skater.shToi}</td>
                            <td className="px-3 py-3 text-center text-gray-400">{skater.shifts}</td>
                            <td className="px-3 py-3 text-center text-gray-400">{skater.gp}</td>
                          </>
                        )}
                        {category === 'advanced' && (
                          <>
                            <td className="px-3 py-3 text-center">
                              <span className={`font-bold ${skater.corsi >= 55 ? 'text-green-400' : skater.corsi >= 50 ? 'text-white' : 'text-red-400'}`}>
                                {skater.corsi}%
                              </span>
                            </td>
                            <td className="px-3 py-3 text-center">
                              <span className={`${skater.fenwick >= 55 ? 'text-green-400' : skater.fenwick >= 50 ? 'text-gray-300' : 'text-red-400'}`}>
                                {skater.fenwick}%
                              </span>
                            </td>
                            <td className="px-3 py-3 text-center">
                              <span className={`${skater.pdo >= 102 ? 'text-green-400' : skater.pdo >= 98 ? 'text-gray-300' : 'text-red-400'}`}>
                                {skater.pdo}
                              </span>
                            </td>
                            <td className="px-3 py-3 text-center text-gray-300">{skater.ozPct}%</td>
                            <td className="px-3 py-3 text-center text-gray-400">{skater.gp}</td>
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
            {/* Hot Skaters */}
            <div className="rounded-xl border border-white/10 p-5" style={{ background: 'rgba(255,255,255,0.02)' }}>
              <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                <Flame className="w-4 h-4 text-orange-500" />
                HOT SKATERS - RIDE THE STREAK
              </h3>
              <div className="space-y-3">
                {hotSkaters.map(skater => (
                  <div key={skater.id} className="rounded-lg p-3 border border-orange-500/20" style={{ background: 'rgba(255,107,53,0.1)' }}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-white text-sm">{skater.name}</span>
                      <span className="text-xs px-2 py-0.5 rounded" style={{ background: 'rgba(255,107,53,0.3)', color: '#FF6B35' }}>
                        🔥 HOT
                      </span>
                    </div>
                    <div className="text-xs text-gray-400 mb-2">{skater.teamAbbr} • {skater.position}</div>
                    <div className="text-xs text-orange-400">{skater.hotStreak}</div>
                    <div className="mt-2 flex gap-2">
                      <span className="text-xs px-2 py-1 rounded bg-white/10 text-white">O {skater.pointsProp} pts</span>
                      <span className="text-xs text-green-400 font-medium">{skater.pointsHitRate}% hit</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Cold Skaters */}
            <div className="rounded-xl border border-white/10 p-5" style={{ background: 'rgba(255,255,255,0.02)' }}>
              <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-blue-400" />
                FADE ALERTS - COLD STREAKS
              </h3>
              <div className="space-y-3">
                {coldSkaters.map(skater => (
                  <div key={skater.id} className="rounded-lg p-3 border border-blue-500/20" style={{ background: 'rgba(59,130,246,0.1)' }}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-white text-sm">{skater.name}</span>
                      <span className="text-xs px-2 py-0.5 rounded" style={{ background: 'rgba(59,130,246,0.3)', color: '#3B82F6' }}>
                        ❄️ COLD
                      </span>
                    </div>
                    <div className="text-xs text-gray-400 mb-2">{skater.teamAbbr} • {skater.position}</div>
                    <div className="text-xs text-blue-400">{skater.hotStreak}</div>
                    <div className="mt-2 flex gap-2">
                      <span className="text-xs px-2 py-1 rounded bg-white/10 text-white">U {skater.pointsProp} pts</span>
                      <span className="text-xs text-red-400 font-medium">{100 - skater.pointsHitRate}% fade</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Links */}
            <div className="rounded-xl border border-white/10 p-5" style={{ background: 'rgba(255,255,255,0.02)' }}>
              <h3 className="text-sm font-bold text-white mb-4">Quick Links</h3>
              <div className="space-y-2">
                <Link href="/nhl/goalies" className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                  <span className="text-sm text-white">Goalie Stats</span>
                  <ChevronDown className="w-4 h-4 text-gray-400 rotate-[-90deg]" />
                </Link>
                <Link href="/scores?sport=nhl" className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                  <span className="text-sm text-white">Today&apos;s Matchups</span>
                  <ChevronDown className="w-4 h-4 text-gray-400 rotate-[-90deg]" />
                </Link>
                <Link href="/nhl" className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                  <span className="text-sm text-white">Team Stats</span>
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
