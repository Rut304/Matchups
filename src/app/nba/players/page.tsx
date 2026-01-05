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
  Filter,
  ChevronDown,
  Star,
  Clock,
  Users,
  Shield,
  Crosshair,
  Activity
} from 'lucide-react'

type StatCategory = 'scoring' | 'rebounding' | 'playmaking' | 'defense' | 'efficiency' | 'clutch'

interface Player {
  id: number
  name: string
  team: string
  teamAbbr: string
  position: string
  gp: number
  mpg: number
  // Scoring stats
  ppg: number
  fgPct: number
  fg3Pct: number
  ftPct: number
  fga: number
  fg3a: number
  fta: number
  // Rebounding stats
  rpg: number
  orpg: number
  drpg: number
  // Playmaking stats
  apg: number
  tov: number
  astToRatio: number
  // Defense stats
  spg: number
  bpg: number
  dpg: number // deflections
  // Efficiency
  per: number
  ts: number
  usgPct: number
  offRtg: number
  defRtg: number
  netRtg: number
  // Clutch
  clutchPpg: number
  clutchFgPct: number
  fourthQtrPpg: number
  gwg: number // game winning plays
  // Props
  pointsProp: number
  pointsHitRate: number
  reboundsProp: number
  reboundsHitRate: number
  assistsProp: number
  assistsHitRate: number
  praProp: number // points + rebounds + assists
  praHitRate: number
  trend: 'hot' | 'cold' | 'neutral'
  hotStreak?: string
}

// Mock data - in production this would come from an API
const mockPlayers: Player[] = [
  {
    id: 1,
    name: 'Luka Dončić',
    team: 'Dallas Mavericks',
    teamAbbr: 'DAL',
    position: 'PG',
    gp: 45,
    mpg: 36.8,
    ppg: 34.2,
    fgPct: 49.1,
    fg3Pct: 38.5,
    ftPct: 78.6,
    fga: 22.4,
    fg3a: 9.2,
    fta: 8.1,
    rpg: 9.1,
    orpg: 0.8,
    drpg: 8.3,
    apg: 9.8,
    tov: 4.2,
    astToRatio: 2.33,
    spg: 1.4,
    bpg: 0.5,
    dpg: 3.2,
    per: 28.9,
    ts: 60.2,
    usgPct: 37.2,
    offRtg: 121,
    defRtg: 112,
    netRtg: 9.0,
    clutchPpg: 5.8,
    clutchFgPct: 46.2,
    fourthQtrPpg: 9.2,
    gwg: 8,
    pointsProp: 32.5,
    pointsHitRate: 68,
    reboundsProp: 8.5,
    reboundsHitRate: 62,
    assistsProp: 8.5,
    assistsHitRate: 72,
    praProp: 49.5,
    praHitRate: 58,
    trend: 'hot',
    hotStreak: '5 straight 30+ point games'
  },
  {
    id: 2,
    name: 'Shai Gilgeous-Alexander',
    team: 'Oklahoma City Thunder',
    teamAbbr: 'OKC',
    position: 'SG',
    gp: 48,
    mpg: 34.2,
    ppg: 31.8,
    fgPct: 53.4,
    fg3Pct: 35.8,
    ftPct: 87.4,
    fga: 20.1,
    fg3a: 4.8,
    fta: 9.6,
    rpg: 5.4,
    orpg: 0.9,
    drpg: 4.5,
    apg: 6.2,
    tov: 2.1,
    astToRatio: 2.95,
    spg: 2.0,
    bpg: 0.9,
    dpg: 4.1,
    per: 31.2,
    ts: 64.8,
    usgPct: 34.1,
    offRtg: 125,
    defRtg: 106,
    netRtg: 19.0,
    clutchPpg: 4.9,
    clutchFgPct: 52.1,
    fourthQtrPpg: 8.8,
    gwg: 11,
    pointsProp: 30.5,
    pointsHitRate: 72,
    reboundsProp: 5.5,
    reboundsHitRate: 48,
    assistsProp: 5.5,
    assistsHitRate: 65,
    praProp: 42.5,
    praHitRate: 64,
    trend: 'hot',
    hotStreak: 'MVP frontrunner'
  },
  {
    id: 3,
    name: 'Nikola Jokić',
    team: 'Denver Nuggets',
    teamAbbr: 'DEN',
    position: 'C',
    gp: 46,
    mpg: 35.8,
    ppg: 26.4,
    fgPct: 58.2,
    fg3Pct: 38.1,
    ftPct: 81.2,
    fga: 16.8,
    fg3a: 3.4,
    fta: 5.2,
    rpg: 12.8,
    orpg: 3.4,
    drpg: 9.4,
    apg: 10.2,
    tov: 3.6,
    astToRatio: 2.83,
    spg: 1.2,
    bpg: 0.8,
    dpg: 2.8,
    per: 32.4,
    ts: 66.1,
    usgPct: 28.2,
    offRtg: 128,
    defRtg: 114,
    netRtg: 14.0,
    clutchPpg: 4.2,
    clutchFgPct: 58.3,
    fourthQtrPpg: 7.4,
    gwg: 6,
    pointsProp: 25.5,
    pointsHitRate: 56,
    reboundsProp: 12.5,
    reboundsHitRate: 54,
    assistsProp: 9.5,
    assistsHitRate: 68,
    praProp: 48.5,
    praHitRate: 62,
    trend: 'neutral'
  },
  {
    id: 4,
    name: 'Giannis Antetokounmpo',
    team: 'Milwaukee Bucks',
    teamAbbr: 'MIL',
    position: 'PF',
    gp: 42,
    mpg: 35.4,
    ppg: 31.2,
    fgPct: 60.8,
    fg3Pct: 27.4,
    ftPct: 65.8,
    fga: 19.8,
    fg3a: 2.1,
    fta: 10.4,
    rpg: 11.6,
    orpg: 2.8,
    drpg: 8.8,
    apg: 6.4,
    tov: 3.4,
    astToRatio: 1.88,
    spg: 1.1,
    bpg: 1.4,
    dpg: 2.4,
    per: 30.8,
    ts: 62.4,
    usgPct: 35.8,
    offRtg: 118,
    defRtg: 108,
    netRtg: 10.0,
    clutchPpg: 5.4,
    clutchFgPct: 54.2,
    fourthQtrPpg: 8.6,
    gwg: 7,
    pointsProp: 30.5,
    pointsHitRate: 58,
    reboundsProp: 11.5,
    reboundsHitRate: 52,
    assistsProp: 5.5,
    assistsHitRate: 70,
    praProp: 47.5,
    praHitRate: 52,
    trend: 'neutral'
  },
  {
    id: 5,
    name: 'Jayson Tatum',
    team: 'Boston Celtics',
    teamAbbr: 'BOS',
    position: 'SF',
    gp: 47,
    mpg: 36.2,
    ppg: 27.8,
    fgPct: 47.2,
    fg3Pct: 37.8,
    ftPct: 83.4,
    fga: 21.2,
    fg3a: 8.4,
    fta: 6.8,
    rpg: 8.4,
    orpg: 1.2,
    drpg: 7.2,
    apg: 4.8,
    tov: 2.8,
    astToRatio: 1.71,
    spg: 1.0,
    bpg: 0.6,
    dpg: 2.6,
    per: 24.2,
    ts: 58.4,
    usgPct: 32.1,
    offRtg: 122,
    defRtg: 108,
    netRtg: 14.0,
    clutchPpg: 3.8,
    clutchFgPct: 42.1,
    fourthQtrPpg: 7.2,
    gwg: 5,
    pointsProp: 26.5,
    pointsHitRate: 62,
    reboundsProp: 8.5,
    reboundsHitRate: 48,
    assistsProp: 4.5,
    assistsHitRate: 58,
    praProp: 39.5,
    praHitRate: 56,
    trend: 'cold',
    hotStreak: 'Shooting 38% last 5 games'
  },
  {
    id: 6,
    name: 'Anthony Edwards',
    team: 'Minnesota Timberwolves',
    teamAbbr: 'MIN',
    position: 'SG',
    gp: 48,
    mpg: 35.8,
    ppg: 26.2,
    fgPct: 46.8,
    fg3Pct: 36.2,
    ftPct: 84.2,
    fga: 20.4,
    fg3a: 7.8,
    fta: 6.2,
    rpg: 5.6,
    orpg: 0.8,
    drpg: 4.8,
    apg: 5.4,
    tov: 2.6,
    astToRatio: 2.08,
    spg: 1.4,
    bpg: 0.4,
    dpg: 2.8,
    per: 23.8,
    ts: 58.2,
    usgPct: 31.4,
    offRtg: 116,
    defRtg: 106,
    netRtg: 10.0,
    clutchPpg: 4.6,
    clutchFgPct: 48.2,
    fourthQtrPpg: 8.1,
    gwg: 6,
    pointsProp: 25.5,
    pointsHitRate: 56,
    reboundsProp: 5.5,
    reboundsHitRate: 52,
    assistsProp: 5.5,
    assistsHitRate: 48,
    praProp: 36.5,
    praHitRate: 54,
    trend: 'hot',
    hotStreak: '3 straight 30+ games'
  },
  {
    id: 7,
    name: 'Kevin Durant',
    team: 'Phoenix Suns',
    teamAbbr: 'PHX',
    position: 'SF',
    gp: 38,
    mpg: 36.4,
    ppg: 28.4,
    fgPct: 52.8,
    fg3Pct: 41.2,
    ftPct: 86.8,
    fga: 18.6,
    fg3a: 5.2,
    fta: 6.4,
    rpg: 6.2,
    orpg: 0.4,
    drpg: 5.8,
    apg: 5.2,
    tov: 2.8,
    astToRatio: 1.86,
    spg: 0.8,
    bpg: 1.2,
    dpg: 2.2,
    per: 26.8,
    ts: 64.2,
    usgPct: 30.2,
    offRtg: 124,
    defRtg: 115,
    netRtg: 9.0,
    clutchPpg: 4.8,
    clutchFgPct: 51.4,
    fourthQtrPpg: 7.8,
    gwg: 4,
    pointsProp: 27.5,
    pointsHitRate: 58,
    reboundsProp: 6.5,
    reboundsHitRate: 44,
    assistsProp: 5.5,
    assistsHitRate: 46,
    praProp: 39.5,
    praHitRate: 52,
    trend: 'neutral'
  },
  {
    id: 8,
    name: 'LeBron James',
    team: 'Los Angeles Lakers',
    teamAbbr: 'LAL',
    position: 'SF',
    gp: 46,
    mpg: 35.2,
    ppg: 25.2,
    fgPct: 52.4,
    fg3Pct: 40.1,
    ftPct: 75.2,
    fga: 17.8,
    fg3a: 5.4,
    fta: 5.2,
    rpg: 7.4,
    orpg: 1.2,
    drpg: 6.2,
    apg: 8.8,
    tov: 3.8,
    astToRatio: 2.32,
    spg: 1.2,
    bpg: 0.6,
    dpg: 2.4,
    per: 25.4,
    ts: 62.8,
    usgPct: 28.4,
    offRtg: 118,
    defRtg: 112,
    netRtg: 6.0,
    clutchPpg: 3.2,
    clutchFgPct: 44.8,
    fourthQtrPpg: 6.4,
    gwg: 5,
    pointsProp: 24.5,
    pointsHitRate: 54,
    reboundsProp: 7.5,
    reboundsHitRate: 48,
    assistsProp: 8.5,
    assistsHitRate: 58,
    praProp: 40.5,
    praHitRate: 52,
    trend: 'neutral'
  },
  {
    id: 9,
    name: 'Tyrese Haliburton',
    team: 'Indiana Pacers',
    teamAbbr: 'IND',
    position: 'PG',
    gp: 44,
    mpg: 33.8,
    ppg: 20.4,
    fgPct: 47.2,
    fg3Pct: 38.6,
    ftPct: 85.4,
    fga: 14.8,
    fg3a: 7.2,
    fta: 3.4,
    rpg: 3.8,
    orpg: 0.4,
    drpg: 3.4,
    apg: 10.8,
    tov: 2.4,
    astToRatio: 4.5,
    spg: 1.2,
    bpg: 0.4,
    dpg: 3.6,
    per: 22.4,
    ts: 62.4,
    usgPct: 24.2,
    offRtg: 126,
    defRtg: 118,
    netRtg: 8.0,
    clutchPpg: 3.4,
    clutchFgPct: 46.2,
    fourthQtrPpg: 5.8,
    gwg: 4,
    pointsProp: 19.5,
    pointsHitRate: 56,
    reboundsProp: 3.5,
    reboundsHitRate: 58,
    assistsProp: 10.5,
    assistsHitRate: 56,
    praProp: 33.5,
    praHitRate: 52,
    trend: 'hot',
    hotStreak: 'League leader in assists'
  },
  {
    id: 10,
    name: 'Devin Booker',
    team: 'Phoenix Suns',
    teamAbbr: 'PHX',
    position: 'SG',
    gp: 42,
    mpg: 35.6,
    ppg: 27.2,
    fgPct: 49.8,
    fg3Pct: 36.4,
    ftPct: 88.2,
    fga: 19.2,
    fg3a: 6.4,
    fta: 5.8,
    rpg: 4.4,
    orpg: 0.6,
    drpg: 3.8,
    apg: 6.8,
    tov: 2.6,
    astToRatio: 2.62,
    spg: 0.8,
    bpg: 0.2,
    dpg: 2.2,
    per: 23.6,
    ts: 60.8,
    usgPct: 30.6,
    offRtg: 118,
    defRtg: 114,
    netRtg: 4.0,
    clutchPpg: 4.2,
    clutchFgPct: 48.6,
    fourthQtrPpg: 7.6,
    gwg: 5,
    pointsProp: 26.5,
    pointsHitRate: 54,
    reboundsProp: 4.5,
    reboundsHitRate: 48,
    assistsProp: 6.5,
    assistsHitRate: 56,
    praProp: 37.5,
    praHitRate: 52,
    trend: 'neutral'
  }
]

const teams = ['All Teams', 'ATL', 'BOS', 'BKN', 'CHA', 'CHI', 'CLE', 'DAL', 'DEN', 'DET', 'GSW', 'HOU', 'IND', 'LAC', 'LAL', 'MEM', 'MIA', 'MIL', 'MIN', 'NOP', 'NYK', 'OKC', 'ORL', 'PHI', 'PHX', 'POR', 'SAC', 'SAS', 'TOR', 'UTA', 'WAS']
const positions = ['All Positions', 'PG', 'SG', 'SF', 'PF', 'C']
const seasons = ['2024-25', '2023-24', '2022-23']

export default function NBAPlayerStatsPage() {
  const [category, setCategory] = useState<StatCategory>('scoring')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTeam, setSelectedTeam] = useState('All Teams')
  const [selectedPosition, setSelectedPosition] = useState('All Positions')
  const [selectedSeason, setSelectedSeason] = useState('2024-25')
  const [sortColumn, setSortColumn] = useState('ppg')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')

  const filteredPlayers = useMemo(() => {
    return mockPlayers
      .filter(player => {
        const matchesSearch = player.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                             player.team.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesTeam = selectedTeam === 'All Teams' || player.teamAbbr === selectedTeam
        const matchesPosition = selectedPosition === 'All Positions' || player.position === selectedPosition
        return matchesSearch && matchesTeam && matchesPosition
      })
      .sort((a, b) => {
        const aVal = a[sortColumn as keyof Player]
        const bVal = b[sortColumn as keyof Player]
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

  const hotPlayers = mockPlayers.filter(p => p.trend === 'hot').slice(0, 5)
  const coldPlayers = mockPlayers.filter(p => p.trend === 'cold').slice(0, 3)

  const categoryConfig = {
    scoring: { icon: Target, label: 'Scoring', color: '#FF6B35' },
    rebounding: { icon: Activity, label: 'Rebounding', color: '#4ECDC4' },
    playmaking: { icon: Zap, label: 'Playmaking', color: '#FFD93D' },
    defense: { icon: Shield, label: 'Defense', color: '#6BCB77' },
    efficiency: { icon: BarChart3, label: 'Efficiency', color: '#9B59B6' },
    clutch: { icon: Flame, label: 'Clutch', color: '#E74C3C' }
  }

  return (
    <div className="min-h-screen" style={{ background: '#050508' }}>
      {/* Header */}
      <section className="relative overflow-hidden border-b border-white/10" style={{ background: 'linear-gradient(180deg, #0a0a12 0%, #050508 100%)' }}>
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-[600px] h-[400px] rounded-full opacity-10 blur-[100px]" style={{ background: '#C8102E' }} />
          <div className="absolute bottom-0 right-1/4 w-[500px] h-[300px] rounded-full opacity-10 blur-[80px]" style={{ background: '#1D428A' }} />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
          <Link href="/nba" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white mb-6 transition-colors">
            <ChevronLeft className="w-4 h-4" />
            Back to NBA
          </Link>

          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #C8102E 0%, #1D428A 100%)' }}>
                  <Users className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-3xl md:text-4xl font-black text-white">NBA Player Stats</h1>
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
                      {category === 'scoring' && (
                        <>
                          <th className="px-3 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white" onClick={() => handleSort('ppg')}>
                            <div className="flex items-center justify-center gap-1">PPG <ArrowUpDown className="w-3 h-3" /></div>
                          </th>
                          <th className="px-3 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white" onClick={() => handleSort('fgPct')}>
                            <div className="flex items-center justify-center gap-1">FG% <ArrowUpDown className="w-3 h-3" /></div>
                          </th>
                          <th className="px-3 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white" onClick={() => handleSort('fg3Pct')}>
                            <div className="flex items-center justify-center gap-1">3P% <ArrowUpDown className="w-3 h-3" /></div>
                          </th>
                          <th className="px-3 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white" onClick={() => handleSort('ftPct')}>
                            <div className="flex items-center justify-center gap-1">FT% <ArrowUpDown className="w-3 h-3" /></div>
                          </th>
                          <th className="px-3 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">FGA</th>
                          <th className="px-3 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">3PA</th>
                          <th className="px-3 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">FTA</th>
                          <th className="px-3 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Pts Prop</th>
                          <th className="px-3 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Hit Rate</th>
                        </>
                      )}
                      {category === 'rebounding' && (
                        <>
                          <th className="px-3 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white" onClick={() => handleSort('rpg')}>
                            <div className="flex items-center justify-center gap-1">RPG <ArrowUpDown className="w-3 h-3" /></div>
                          </th>
                          <th className="px-3 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white" onClick={() => handleSort('orpg')}>
                            <div className="flex items-center justify-center gap-1">ORPG <ArrowUpDown className="w-3 h-3" /></div>
                          </th>
                          <th className="px-3 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white" onClick={() => handleSort('drpg')}>
                            <div className="flex items-center justify-center gap-1">DRPG <ArrowUpDown className="w-3 h-3" /></div>
                          </th>
                          <th className="px-3 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">GP</th>
                          <th className="px-3 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">MPG</th>
                          <th className="px-3 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Reb Prop</th>
                          <th className="px-3 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Hit Rate</th>
                        </>
                      )}
                      {category === 'playmaking' && (
                        <>
                          <th className="px-3 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white" onClick={() => handleSort('apg')}>
                            <div className="flex items-center justify-center gap-1">APG <ArrowUpDown className="w-3 h-3" /></div>
                          </th>
                          <th className="px-3 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white" onClick={() => handleSort('tov')}>
                            <div className="flex items-center justify-center gap-1">TOV <ArrowUpDown className="w-3 h-3" /></div>
                          </th>
                          <th className="px-3 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white" onClick={() => handleSort('astToRatio')}>
                            <div className="flex items-center justify-center gap-1">AST/TO <ArrowUpDown className="w-3 h-3" /></div>
                          </th>
                          <th className="px-3 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">GP</th>
                          <th className="px-3 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">MPG</th>
                          <th className="px-3 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Ast Prop</th>
                          <th className="px-3 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Hit Rate</th>
                        </>
                      )}
                      {category === 'defense' && (
                        <>
                          <th className="px-3 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white" onClick={() => handleSort('spg')}>
                            <div className="flex items-center justify-center gap-1">SPG <ArrowUpDown className="w-3 h-3" /></div>
                          </th>
                          <th className="px-3 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white" onClick={() => handleSort('bpg')}>
                            <div className="flex items-center justify-center gap-1">BPG <ArrowUpDown className="w-3 h-3" /></div>
                          </th>
                          <th className="px-3 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white" onClick={() => handleSort('dpg')}>
                            <div className="flex items-center justify-center gap-1">DFD <ArrowUpDown className="w-3 h-3" /></div>
                          </th>
                          <th className="px-3 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white" onClick={() => handleSort('defRtg')}>
                            <div className="flex items-center justify-center gap-1">DRTG <ArrowUpDown className="w-3 h-3" /></div>
                          </th>
                          <th className="px-3 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">GP</th>
                          <th className="px-3 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">MPG</th>
                        </>
                      )}
                      {category === 'efficiency' && (
                        <>
                          <th className="px-3 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white" onClick={() => handleSort('per')}>
                            <div className="flex items-center justify-center gap-1">PER <ArrowUpDown className="w-3 h-3" /></div>
                          </th>
                          <th className="px-3 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white" onClick={() => handleSort('ts')}>
                            <div className="flex items-center justify-center gap-1">TS% <ArrowUpDown className="w-3 h-3" /></div>
                          </th>
                          <th className="px-3 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white" onClick={() => handleSort('usgPct')}>
                            <div className="flex items-center justify-center gap-1">USG% <ArrowUpDown className="w-3 h-3" /></div>
                          </th>
                          <th className="px-3 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white" onClick={() => handleSort('offRtg')}>
                            <div className="flex items-center justify-center gap-1">ORTG <ArrowUpDown className="w-3 h-3" /></div>
                          </th>
                          <th className="px-3 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white" onClick={() => handleSort('defRtg')}>
                            <div className="flex items-center justify-center gap-1">DRTG <ArrowUpDown className="w-3 h-3" /></div>
                          </th>
                          <th className="px-3 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white" onClick={() => handleSort('netRtg')}>
                            <div className="flex items-center justify-center gap-1">NET <ArrowUpDown className="w-3 h-3" /></div>
                          </th>
                        </>
                      )}
                      {category === 'clutch' && (
                        <>
                          <th className="px-3 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white" onClick={() => handleSort('clutchPpg')}>
                            <div className="flex items-center justify-center gap-1">Clutch PPG <ArrowUpDown className="w-3 h-3" /></div>
                          </th>
                          <th className="px-3 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white" onClick={() => handleSort('clutchFgPct')}>
                            <div className="flex items-center justify-center gap-1">Clutch FG% <ArrowUpDown className="w-3 h-3" /></div>
                          </th>
                          <th className="px-3 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white" onClick={() => handleSort('fourthQtrPpg')}>
                            <div className="flex items-center justify-center gap-1">4Q PPG <ArrowUpDown className="w-3 h-3" /></div>
                          </th>
                          <th className="px-3 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white" onClick={() => handleSort('gwg')}>
                            <div className="flex items-center justify-center gap-1">GW Plays <ArrowUpDown className="w-3 h-3" /></div>
                          </th>
                          <th className="px-3 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">GP</th>
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
                            <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xs font-bold text-white" style={{ background: 'linear-gradient(135deg, #C8102E 0%, #1D428A 100%)' }}>
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
                        {category === 'scoring' && (
                          <>
                            <td className="px-3 py-3 text-center">
                              <span className="font-bold text-white text-lg">{player.ppg}</span>
                            </td>
                            <td className="px-3 py-3 text-center text-gray-300">{player.fgPct}%</td>
                            <td className="px-3 py-3 text-center text-gray-300">{player.fg3Pct}%</td>
                            <td className="px-3 py-3 text-center text-gray-300">{player.ftPct}%</td>
                            <td className="px-3 py-3 text-center text-gray-400">{player.fga}</td>
                            <td className="px-3 py-3 text-center text-gray-400">{player.fg3a}</td>
                            <td className="px-3 py-3 text-center text-gray-400">{player.fta}</td>
                            <td className="px-3 py-3 text-center">
                              <span className="px-2 py-1 rounded text-xs font-medium" style={{ background: 'rgba(255,107,53,0.2)', color: '#FF6B35' }}>
                                O/U {player.pointsProp}
                              </span>
                            </td>
                            <td className="px-3 py-3 text-center">
                              <span className={`font-semibold ${player.pointsHitRate >= 60 ? 'text-green-400' : player.pointsHitRate >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                                {player.pointsHitRate}%
                              </span>
                            </td>
                          </>
                        )}
                        {category === 'rebounding' && (
                          <>
                            <td className="px-3 py-3 text-center">
                              <span className="font-bold text-white text-lg">{player.rpg}</span>
                            </td>
                            <td className="px-3 py-3 text-center text-gray-300">{player.orpg}</td>
                            <td className="px-3 py-3 text-center text-gray-300">{player.drpg}</td>
                            <td className="px-3 py-3 text-center text-gray-400">{player.gp}</td>
                            <td className="px-3 py-3 text-center text-gray-400">{player.mpg}</td>
                            <td className="px-3 py-3 text-center">
                              <span className="px-2 py-1 rounded text-xs font-medium" style={{ background: 'rgba(78,205,196,0.2)', color: '#4ECDC4' }}>
                                O/U {player.reboundsProp}
                              </span>
                            </td>
                            <td className="px-3 py-3 text-center">
                              <span className={`font-semibold ${player.reboundsHitRate >= 60 ? 'text-green-400' : player.reboundsHitRate >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                                {player.reboundsHitRate}%
                              </span>
                            </td>
                          </>
                        )}
                        {category === 'playmaking' && (
                          <>
                            <td className="px-3 py-3 text-center">
                              <span className="font-bold text-white text-lg">{player.apg}</span>
                            </td>
                            <td className="px-3 py-3 text-center text-gray-300">{player.tov}</td>
                            <td className="px-3 py-3 text-center text-gray-300">{player.astToRatio.toFixed(2)}</td>
                            <td className="px-3 py-3 text-center text-gray-400">{player.gp}</td>
                            <td className="px-3 py-3 text-center text-gray-400">{player.mpg}</td>
                            <td className="px-3 py-3 text-center">
                              <span className="px-2 py-1 rounded text-xs font-medium" style={{ background: 'rgba(255,217,61,0.2)', color: '#FFD93D' }}>
                                O/U {player.assistsProp}
                              </span>
                            </td>
                            <td className="px-3 py-3 text-center">
                              <span className={`font-semibold ${player.assistsHitRate >= 60 ? 'text-green-400' : player.assistsHitRate >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                                {player.assistsHitRate}%
                              </span>
                            </td>
                          </>
                        )}
                        {category === 'defense' && (
                          <>
                            <td className="px-3 py-3 text-center">
                              <span className="font-bold text-white text-lg">{player.spg}</span>
                            </td>
                            <td className="px-3 py-3 text-center text-gray-300">{player.bpg}</td>
                            <td className="px-3 py-3 text-center text-gray-300">{player.dpg}</td>
                            <td className="px-3 py-3 text-center text-gray-300">{player.defRtg}</td>
                            <td className="px-3 py-3 text-center text-gray-400">{player.gp}</td>
                            <td className="px-3 py-3 text-center text-gray-400">{player.mpg}</td>
                          </>
                        )}
                        {category === 'efficiency' && (
                          <>
                            <td className="px-3 py-3 text-center">
                              <span className="font-bold text-white text-lg">{player.per}</span>
                            </td>
                            <td className="px-3 py-3 text-center text-gray-300">{player.ts}%</td>
                            <td className="px-3 py-3 text-center text-gray-300">{player.usgPct}%</td>
                            <td className="px-3 py-3 text-center text-gray-300">{player.offRtg}</td>
                            <td className="px-3 py-3 text-center text-gray-300">{player.defRtg}</td>
                            <td className="px-3 py-3 text-center">
                              <span className={`font-semibold ${player.netRtg > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                {player.netRtg > 0 ? '+' : ''}{player.netRtg}
                              </span>
                            </td>
                          </>
                        )}
                        {category === 'clutch' && (
                          <>
                            <td className="px-3 py-3 text-center">
                              <span className="font-bold text-white text-lg">{player.clutchPpg}</span>
                            </td>
                            <td className="px-3 py-3 text-center text-gray-300">{player.clutchFgPct}%</td>
                            <td className="px-3 py-3 text-center text-gray-300">{player.fourthQtrPpg}</td>
                            <td className="px-3 py-3 text-center">
                              <span className="px-2 py-1 rounded text-xs font-medium" style={{ background: 'rgba(231,76,60,0.2)', color: '#E74C3C' }}>
                                {player.gwg}
                              </span>
                            </td>
                            <td className="px-3 py-3 text-center text-gray-400">{player.gp}</td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* PRA Combo Props Section */}
            <div className="mt-8 rounded-xl border border-white/10 p-6" style={{ background: 'rgba(255,255,255,0.02)' }}>
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-purple-400" />
                PRA Combo Props (Points + Rebounds + Assists)
              </h3>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredPlayers.slice(0, 6).map(player => (
                  <div key={player.id} className="rounded-lg p-4 border border-white/10" style={{ background: 'rgba(255,255,255,0.02)' }}>
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <div className="font-semibold text-white">{player.name}</div>
                        <div className="text-xs text-gray-500">{player.teamAbbr} • {player.position}</div>
                      </div>
                      {player.trend === 'hot' && <Flame className="w-4 h-4 text-orange-500" />}
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-2xl font-bold text-purple-400">O/U {player.praProp}</div>
                        <div className="text-xs text-gray-500">Avg: {(player.ppg + player.rpg + player.apg).toFixed(1)} PRA</div>
                      </div>
                      <div className="text-right">
                        <div className={`text-lg font-bold ${player.praHitRate >= 60 ? 'text-green-400' : player.praHitRate >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                          {player.praHitRate}%
                        </div>
                        <div className="text-xs text-gray-500">Hit Rate</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="w-full lg:w-80 space-y-6">
            {/* Hot Props */}
            <div className="rounded-xl border border-white/10 p-5" style={{ background: 'rgba(255,255,255,0.02)' }}>
              <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                <Flame className="w-4 h-4 text-orange-500" />
                HOT PROPS - RIDE THE STREAK
              </h3>
              <div className="space-y-3">
                {hotPlayers.map(player => (
                  <div key={player.id} className="rounded-lg p-3 border border-orange-500/20" style={{ background: 'rgba(255,107,53,0.1)' }}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-white text-sm">{player.name}</span>
                      <span className="text-xs px-2 py-0.5 rounded" style={{ background: 'rgba(255,107,53,0.3)', color: '#FF6B35' }}>
                        🔥 HOT
                      </span>
                    </div>
                    <div className="text-xs text-gray-400 mb-2">{player.teamAbbr} • {player.position}</div>
                    <div className="text-xs text-orange-400">{player.hotStreak}</div>
                    <div className="mt-2 flex gap-2">
                      <span className="text-xs px-2 py-1 rounded bg-white/10 text-white">O {player.pointsProp} pts</span>
                      <span className="text-xs text-green-400 font-medium">{player.pointsHitRate}% hit</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Cold Props */}
            <div className="rounded-xl border border-white/10 p-5" style={{ background: 'rgba(255,255,255,0.02)' }}>
              <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-blue-400" />
                FADE ALERTS - COLD STREAKS
              </h3>
              <div className="space-y-3">
                {coldPlayers.map(player => (
                  <div key={player.id} className="rounded-lg p-3 border border-blue-500/20" style={{ background: 'rgba(59,130,246,0.1)' }}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-white text-sm">{player.name}</span>
                      <span className="text-xs px-2 py-0.5 rounded" style={{ background: 'rgba(59,130,246,0.3)', color: '#3B82F6' }}>
                        ❄️ COLD
                      </span>
                    </div>
                    <div className="text-xs text-gray-400 mb-2">{player.teamAbbr} • {player.position}</div>
                    <div className="text-xs text-blue-400">{player.hotStreak}</div>
                    <div className="mt-2 flex gap-2">
                      <span className="text-xs px-2 py-1 rounded bg-white/10 text-white">U {player.pointsProp} pts</span>
                      <span className="text-xs text-red-400 font-medium">{100 - player.pointsHitRate}% fade</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Links */}
            <div className="rounded-xl border border-white/10 p-5" style={{ background: 'rgba(255,255,255,0.02)' }}>
              <h3 className="text-sm font-bold text-white mb-4">Quick Links</h3>
              <div className="space-y-2">
                <Link href="/nba/matchups" className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                  <span className="text-sm text-white">Today&apos;s Matchups</span>
                  <ChevronDown className="w-4 h-4 text-gray-400 rotate-[-90deg]" />
                </Link>
                <Link href="/nba/teams" className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                  <span className="text-sm text-white">Team Stats</span>
                  <ChevronDown className="w-4 h-4 text-gray-400 rotate-[-90deg]" />
                </Link>
                <Link href="/nba/standings" className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
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
