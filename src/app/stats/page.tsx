'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { 
  TrendingUp, 
  Trophy, 
  Users, 
  Activity,
  ChevronDown,
  Search,
  Filter,
  ArrowUpDown,
  RefreshCw
} from 'lucide-react'

// =============================================================================
// TYPES
// =============================================================================

interface TeamStats {
  rank: number
  team: string
  teamFull: string
  logo?: string
  wins: number
  losses: number
  ties?: number
  pct: number
  streak: string
  last10: string
  conf?: string
  div?: string
  pts?: number
  gf?: number
  ga?: number
  diff?: number
  home?: string
  away?: string
}

interface PlayerStats {
  rank: number
  name: string
  team: string
  position: string
  photo?: string
  stats: Record<string, string | number>
}

type Sport = 'nfl' | 'nba' | 'nhl' | 'mlb'
type StatsView = 'standings' | 'leaders' | 'teams' | 'players'

// =============================================================================
// MOCK DATA (Replace with real API calls)
// =============================================================================

const mockStandings: Record<Sport, TeamStats[]> = {
  nfl: [
    { rank: 1, team: 'KC', teamFull: 'Kansas City Chiefs', wins: 11, losses: 1, pct: 0.917, streak: 'W8', last10: '9-1', conf: 'AFC', div: 'West', pts: 316, diff: 108 },
    { rank: 2, team: 'DET', teamFull: 'Detroit Lions', wins: 10, losses: 2, pct: 0.833, streak: 'W5', last10: '8-2', conf: 'NFC', div: 'North', pts: 364, diff: 142 },
    { rank: 3, team: 'PHI', teamFull: 'Philadelphia Eagles', wins: 10, losses: 2, pct: 0.833, streak: 'W7', last10: '8-2', conf: 'NFC', div: 'East', pts: 298, diff: 94 },
    { rank: 4, team: 'BUF', teamFull: 'Buffalo Bills', wins: 9, losses: 3, pct: 0.750, streak: 'W3', last10: '7-3', conf: 'AFC', div: 'East', pts: 328, diff: 102 },
    { rank: 5, team: 'BAL', teamFull: 'Baltimore Ravens', wins: 8, losses: 4, pct: 0.667, streak: 'L1', last10: '6-4', conf: 'AFC', div: 'North', pts: 341, diff: 75 },
    { rank: 6, team: 'MIN', teamFull: 'Minnesota Vikings', wins: 8, losses: 4, pct: 0.667, streak: 'W2', last10: '6-4', conf: 'NFC', div: 'North', pts: 289, diff: 45 },
    { rank: 7, team: 'GB', teamFull: 'Green Bay Packers', wins: 8, losses: 4, pct: 0.667, streak: 'W2', last10: '7-3', conf: 'NFC', div: 'North', pts: 301, diff: 65 },
    { rank: 8, team: 'LAC', teamFull: 'Los Angeles Chargers', wins: 8, losses: 4, pct: 0.667, streak: 'W1', last10: '7-3', conf: 'AFC', div: 'West', pts: 274, diff: 52 },
  ],
  nba: [
    { rank: 1, team: 'BOS', teamFull: 'Boston Celtics', wins: 20, losses: 5, pct: 0.800, streak: 'W4', last10: '8-2', conf: 'East', div: 'Atlantic', pts: 2678, diff: 252 },
    { rank: 2, team: 'CLE', teamFull: 'Cleveland Cavaliers', wins: 21, losses: 4, pct: 0.840, streak: 'W12', last10: '10-0', conf: 'East', div: 'Central', pts: 2692, diff: 305 },
    { rank: 3, team: 'OKC', teamFull: 'Oklahoma City Thunder', wins: 19, losses: 5, pct: 0.792, streak: 'W2', last10: '7-3', conf: 'West', div: 'Northwest', pts: 2641, diff: 278 },
    { rank: 4, team: 'HOU', teamFull: 'Houston Rockets', wins: 16, losses: 9, pct: 0.640, streak: 'L1', last10: '6-4', conf: 'West', div: 'Southwest', pts: 2578, diff: 124 },
    { rank: 5, team: 'MEM', teamFull: 'Memphis Grizzlies', wins: 16, losses: 10, pct: 0.615, streak: 'W3', last10: '7-3', conf: 'West', div: 'Southwest', pts: 2690, diff: 142 },
    { rank: 6, team: 'DAL', teamFull: 'Dallas Mavericks', wins: 15, losses: 9, pct: 0.625, streak: 'L2', last10: '5-5', conf: 'West', div: 'Southwest', pts: 2598, diff: 98 },
    { rank: 7, team: 'NYK', teamFull: 'New York Knicks', wins: 14, losses: 10, pct: 0.583, streak: 'W1', last10: '5-5', conf: 'East', div: 'Atlantic', pts: 2521, diff: 65 },
    { rank: 8, team: 'LAL', teamFull: 'Los Angeles Lakers', wins: 13, losses: 11, pct: 0.542, streak: 'W2', last10: '6-4', conf: 'West', div: 'Pacific', pts: 2574, diff: 42 },
  ],
  nhl: [
    { rank: 1, team: 'WPG', teamFull: 'Winnipeg Jets', wins: 21, losses: 7, ties: 0, pct: 0.750, streak: 'W3', last10: '7-3-0', conf: 'West', div: 'Central', gf: 112, ga: 68, diff: 44 },
    { rank: 2, team: 'NJD', teamFull: 'New Jersey Devils', wins: 18, losses: 10, ties: 2, pct: 0.633, streak: 'W2', last10: '6-4-0', conf: 'East', div: 'Metropolitan', gf: 105, ga: 82, diff: 23 },
    { rank: 3, team: 'FLA', teamFull: 'Florida Panthers', wins: 17, losses: 9, ties: 2, pct: 0.643, streak: 'L1', last10: '5-4-1', conf: 'East', div: 'Atlantic', gf: 98, ga: 76, diff: 22 },
    { rank: 4, team: 'MIN', teamFull: 'Minnesota Wild', wins: 17, losses: 8, ties: 4, pct: 0.655, streak: 'W1', last10: '6-3-1', conf: 'West', div: 'Central', gf: 95, ga: 75, diff: 20 },
    { rank: 5, team: 'VGK', teamFull: 'Vegas Golden Knights', wins: 17, losses: 8, ties: 3, pct: 0.661, streak: 'W4', last10: '8-2-0', conf: 'West', div: 'Pacific', gf: 102, ga: 78, diff: 24 },
    { rank: 6, team: 'CAR', teamFull: 'Carolina Hurricanes', wins: 16, losses: 10, ties: 1, pct: 0.611, streak: 'W2', last10: '6-4-0', conf: 'East', div: 'Metropolitan', gf: 89, ga: 72, diff: 17 },
    { rank: 7, team: 'DAL', teamFull: 'Dallas Stars', wins: 16, losses: 10, ties: 0, pct: 0.615, streak: 'L2', last10: '5-5-0', conf: 'West', div: 'Central', gf: 94, ga: 78, diff: 16 },
    { rank: 8, team: 'COL', teamFull: 'Colorado Avalanche', wins: 15, losses: 12, ties: 0, pct: 0.556, streak: 'W1', last10: '5-5-0', conf: 'West', div: 'Central', gf: 98, ga: 88, diff: 10 },
  ],
  mlb: [
    { rank: 1, team: 'LAD', teamFull: 'Los Angeles Dodgers', wins: 98, losses: 64, pct: 0.605, streak: '-', last10: '-', conf: 'NL', div: 'West', pts: 906, diff: 168 },
    { rank: 2, team: 'PHI', teamFull: 'Philadelphia Phillies', wins: 95, losses: 67, pct: 0.586, streak: '-', last10: '-', conf: 'NL', div: 'East', pts: 799, diff: 133 },
    { rank: 3, team: 'NYY', teamFull: 'New York Yankees', wins: 94, losses: 68, pct: 0.580, streak: '-', last10: '-', conf: 'AL', div: 'East', pts: 867, diff: 158 },
    { rank: 4, team: 'CLE', teamFull: 'Cleveland Guardians', wins: 92, losses: 70, pct: 0.568, streak: '-', last10: '-', conf: 'AL', div: 'Central', pts: 725, diff: 104 },
    { rank: 5, team: 'MIL', teamFull: 'Milwaukee Brewers', wins: 91, losses: 71, pct: 0.562, streak: '-', last10: '-', conf: 'NL', div: 'Central', pts: 753, diff: 98 },
    { rank: 6, team: 'BAL', teamFull: 'Baltimore Orioles', wins: 91, losses: 71, pct: 0.562, streak: '-', last10: '-', conf: 'AL', div: 'East', pts: 786, diff: 121 },
    { rank: 7, team: 'HOU', teamFull: 'Houston Astros', wins: 88, losses: 74, pct: 0.543, streak: '-', last10: '-', conf: 'AL', div: 'West', pts: 746, diff: 82 },
    { rank: 8, team: 'SD', teamFull: 'San Diego Padres', wins: 87, losses: 75, pct: 0.537, streak: '-', last10: '-', conf: 'NL', div: 'West', pts: 729, diff: 71 },
  ],
}

const mockLeaders: Record<Sport, Record<string, PlayerStats[]>> = {
  nfl: {
    'Passing Yards': [
      { rank: 1, name: 'Joe Burrow', team: 'CIN', position: 'QB', stats: { yards: 3337, td: 27, int: 5, rating: 108.2 } },
      { rank: 2, name: 'Lamar Jackson', team: 'BAL', position: 'QB', stats: { yards: 3290, td: 29, int: 3, rating: 119.0 } },
      { rank: 3, name: 'Jared Goff', team: 'DET', position: 'QB', stats: { yards: 3263, td: 24, int: 8, rating: 102.8 } },
      { rank: 4, name: 'Patrick Mahomes', team: 'KC', position: 'QB', stats: { yards: 2992, td: 19, int: 11, rating: 88.5 } },
      { rank: 5, name: 'Josh Allen', team: 'BUF', position: 'QB', stats: { yards: 2876, td: 20, int: 5, rating: 104.2 } },
    ],
    'Rushing Yards': [
      { rank: 1, name: 'Derrick Henry', team: 'BAL', position: 'RB', stats: { yards: 1407, td: 13, avg: 5.8, att: 243 } },
      { rank: 2, name: 'Saquon Barkley', team: 'PHI', position: 'RB', stats: { yards: 1392, td: 10, avg: 5.8, att: 240 } },
      { rank: 3, name: 'Josh Jacobs', team: 'GB', position: 'RB', stats: { yards: 1061, td: 9, avg: 4.4, att: 241 } },
      { rank: 4, name: 'Jahmyr Gibbs', team: 'DET', position: 'RB', stats: { yards: 966, td: 10, avg: 5.6, att: 173 } },
      { rank: 5, name: 'Bijan Robinson', team: 'ATL', position: 'RB', stats: { yards: 936, td: 6, avg: 4.6, att: 204 } },
    ],
    'Receiving Yards': [
      { rank: 1, name: "Ja'Marr Chase", team: 'CIN', position: 'WR', stats: { yards: 1282, td: 13, rec: 84, avg: 15.3 } },
      { rank: 2, name: 'Amon-Ra St. Brown', team: 'DET', position: 'WR', stats: { yards: 999, td: 7, rec: 93, avg: 10.7 } },
      { rank: 3, name: 'AJ Brown', team: 'PHI', position: 'WR', stats: { yards: 997, td: 6, rec: 60, avg: 16.6 } },
      { rank: 4, name: 'Tee Higgins', team: 'CIN', position: 'WR', stats: { yards: 911, td: 8, rec: 61, avg: 14.9 } },
      { rank: 5, name: 'Terry McLaurin', team: 'WAS', position: 'WR', stats: { yards: 893, td: 10, rec: 66, avg: 13.5 } },
    ],
  },
  nba: {
    'Points': [
      { rank: 1, name: 'Giannis Antetokounmpo', team: 'MIL', position: 'PF', stats: { ppg: 32.7, rpg: 11.5, apg: 6.1, fg: 0.614 } },
      { rank: 2, name: 'Shai Gilgeous-Alexander', team: 'OKC', position: 'SG', stats: { ppg: 31.3, rpg: 5.5, apg: 6.0, fg: 0.527 } },
      { rank: 3, name: 'Jayson Tatum', team: 'BOS', position: 'SF', stats: { ppg: 28.3, rpg: 8.6, apg: 5.7, fg: 0.448 } },
      { rank: 4, name: 'Anthony Edwards', team: 'MIN', position: 'SG', stats: { ppg: 28.0, rpg: 5.6, apg: 4.1, fg: 0.461 } },
      { rank: 5, name: 'Donovan Mitchell', team: 'CLE', position: 'SG', stats: { ppg: 24.2, rpg: 4.5, apg: 4.4, fg: 0.463 } },
    ],
    'Rebounds': [
      { rank: 1, name: 'Domantas Sabonis', team: 'SAC', position: 'C', stats: { rpg: 14.2, ppg: 19.8, apg: 6.5, fg: 0.602 } },
      { rank: 2, name: 'Anthony Davis', team: 'LAL', position: 'C', stats: { rpg: 11.9, ppg: 25.8, apg: 3.5, fg: 0.548 } },
      { rank: 3, name: 'Giannis Antetokounmpo', team: 'MIL', position: 'PF', stats: { rpg: 11.5, ppg: 32.7, apg: 6.1, fg: 0.614 } },
      { rank: 4, name: 'Nikola Jokic', team: 'DEN', position: 'C', stats: { rpg: 11.3, ppg: 28.9, apg: 10.2, fg: 0.564 } },
      { rank: 5, name: 'Alperen Sengun', team: 'HOU', position: 'C', stats: { rpg: 10.6, ppg: 19.0, apg: 5.0, fg: 0.521 } },
    ],
    'Assists': [
      { rank: 1, name: 'Tyrese Haliburton', team: 'IND', position: 'PG', stats: { apg: 10.8, ppg: 18.5, rpg: 3.9, fg: 0.442 } },
      { rank: 2, name: 'Nikola Jokic', team: 'DEN', position: 'C', stats: { apg: 10.2, ppg: 28.9, rpg: 11.3, fg: 0.564 } },
      { rank: 3, name: 'Trae Young', team: 'ATL', position: 'PG', stats: { apg: 10.0, ppg: 22.8, rpg: 3.2, fg: 0.424 } },
      { rank: 4, name: 'LaMelo Ball', team: 'CHA', position: 'PG', stats: { apg: 8.2, ppg: 20.4, rpg: 5.8, fg: 0.425 } },
      { rank: 5, name: 'Domantas Sabonis', team: 'SAC', position: 'C', stats: { apg: 6.5, ppg: 19.8, rpg: 14.2, fg: 0.602 } },
    ],
  },
  nhl: {
    'Points': [
      { rank: 1, name: 'Nikita Kucherov', team: 'TBL', position: 'RW', stats: { pts: 42, g: 12, a: 30, plusMinus: 12 } },
      { rank: 2, name: 'Nathan MacKinnon', team: 'COL', position: 'C', stats: { pts: 41, g: 14, a: 27, plusMinus: 8 } },
      { rank: 3, name: 'Kirill Kaprizov', team: 'MIN', position: 'LW', stats: { pts: 39, g: 18, a: 21, plusMinus: 14 } },
      { rank: 4, name: 'Kyle Connor', team: 'WPG', position: 'LW', stats: { pts: 38, g: 19, a: 19, plusMinus: 22 } },
      { rank: 5, name: 'Leon Draisaitl', team: 'EDM', position: 'C', stats: { pts: 36, g: 17, a: 19, plusMinus: -2 } },
    ],
    'Goals': [
      { rank: 1, name: 'Kyle Connor', team: 'WPG', position: 'LW', stats: { g: 19, a: 19, pts: 38, plusMinus: 22 } },
      { rank: 2, name: 'Kirill Kaprizov', team: 'MIN', position: 'LW', stats: { g: 18, a: 21, pts: 39, plusMinus: 14 } },
      { rank: 3, name: 'Leon Draisaitl', team: 'EDM', position: 'C', stats: { g: 17, a: 19, pts: 36, plusMinus: -2 } },
      { rank: 4, name: 'Brock Boeser', team: 'VAN', position: 'RW', stats: { g: 16, a: 10, pts: 26, plusMinus: 8 } },
      { rank: 5, name: 'Sam Reinhart', team: 'FLA', position: 'C', stats: { g: 15, a: 18, pts: 33, plusMinus: 10 } },
    ],
    'Assists': [
      { rank: 1, name: 'Nikita Kucherov', team: 'TBL', position: 'RW', stats: { a: 30, g: 12, pts: 42, plusMinus: 12 } },
      { rank: 2, name: 'Nathan MacKinnon', team: 'COL', position: 'C', stats: { a: 27, g: 14, pts: 41, plusMinus: 8 } },
      { rank: 3, name: 'Quinn Hughes', team: 'VAN', position: 'D', stats: { a: 24, g: 4, pts: 28, plusMinus: 6 } },
      { rank: 4, name: 'Kirill Kaprizov', team: 'MIN', position: 'LW', stats: { a: 21, g: 18, pts: 39, plusMinus: 14 } },
      { rank: 5, name: 'Cale Makar', team: 'COL', position: 'D', stats: { a: 21, g: 7, pts: 28, plusMinus: 4 } },
    ],
  },
  mlb: {
    'Batting Average': [
      { rank: 1, name: 'Luis Arraez', team: 'SD', position: '1B', stats: { avg: 0.314, hr: 4, rbi: 46, hits: 194 } },
      { rank: 2, name: 'Bobby Witt Jr.', team: 'KC', position: 'SS', stats: { avg: 0.332, hr: 32, rbi: 109, hits: 211 } },
      { rank: 3, name: 'Shohei Ohtani', team: 'LAD', position: 'DH', stats: { avg: 0.310, hr: 54, rbi: 130, hits: 197 } },
      { rank: 4, name: 'Steven Kwan', team: 'CLE', position: 'LF', stats: { avg: 0.292, hr: 14, rbi: 49, hits: 180 } },
      { rank: 5, name: 'Marcell Ozuna', team: 'ATL', position: 'DH', stats: { avg: 0.302, hr: 39, rbi: 104, hits: 178 } },
    ],
    'Home Runs': [
      { rank: 1, name: 'Aaron Judge', team: 'NYY', position: 'CF', stats: { hr: 58, avg: 0.322, rbi: 144, slg: 0.701 } },
      { rank: 2, name: 'Shohei Ohtani', team: 'LAD', position: 'DH', stats: { hr: 54, avg: 0.310, rbi: 130, slg: 0.646 } },
      { rank: 3, name: 'Marcell Ozuna', team: 'ATL', position: 'DH', stats: { hr: 39, avg: 0.302, rbi: 104, slg: 0.539 } },
      { rank: 4, name: 'Kyle Schwarber', team: 'PHI', position: 'LF', stats: { hr: 38, avg: 0.250, rbi: 104, slg: 0.547 } },
      { rank: 5, name: 'Pete Alonso', team: 'NYM', position: '1B', stats: { hr: 34, avg: 0.240, rbi: 88, slg: 0.459 } },
    ],
    'RBI': [
      { rank: 1, name: 'Aaron Judge', team: 'NYY', position: 'CF', stats: { rbi: 144, hr: 58, avg: 0.322, hits: 180 } },
      { rank: 2, name: 'Shohei Ohtani', team: 'LAD', position: 'DH', stats: { rbi: 130, hr: 54, avg: 0.310, hits: 197 } },
      { rank: 3, name: 'Bobby Witt Jr.', team: 'KC', position: 'SS', stats: { rbi: 109, hr: 32, avg: 0.332, hits: 211 } },
      { rank: 4, name: 'Kyle Schwarber', team: 'PHI', position: 'LF', stats: { rbi: 104, hr: 38, avg: 0.250, hits: 138 } },
      { rank: 5, name: 'Marcell Ozuna', team: 'ATL', position: 'DH', stats: { rbi: 104, hr: 39, avg: 0.302, hits: 178 } },
    ],
  },
}

// =============================================================================
// SPORT TABS
// =============================================================================

const sportColors: Record<Sport, string> = {
  nfl: '#FF6B00',
  nba: '#00A8FF',
  nhl: '#FF3366',
  mlb: '#00FF88',
}

const sportNames: Record<Sport, string> = {
  nfl: 'NFL',
  nba: 'NBA',
  nhl: 'NHL',
  mlb: 'MLB',
}

// =============================================================================
// STATS PAGE CONTENT
// =============================================================================

function StatsPageContent() {
  const searchParams = useSearchParams()
  const initialSport = (searchParams.get('sport') as Sport) || 'nfl'
  const initialView = (searchParams.get('view') as StatsView) || 'standings'
  
  const [activeSport, setActiveSport] = useState<Sport>(initialSport)
  const [activeView, setActiveView] = useState<StatsView>(initialView)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<string>('rank')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [filterConf, setFilterConf] = useState<string>('all')
  const [isRefreshing, setIsRefreshing] = useState(false)
  
  // Active stat category for leaders
  const leaderCategories = Object.keys(mockLeaders[activeSport])
  const [activeCategory, setActiveCategory] = useState(leaderCategories[0])
  
  useEffect(() => {
    setActiveCategory(Object.keys(mockLeaders[activeSport])[0])
  }, [activeSport])
  
  const handleRefresh = async () => {
    setIsRefreshing(true)
    // Simulate API refresh
    await new Promise(resolve => setTimeout(resolve, 1000))
    setIsRefreshing(false)
  }
  
  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(column)
      setSortDir('desc')
    }
  }
  
  // Get standings data
  const standings = mockStandings[activeSport]
  const filteredStandings = standings
    .filter(team => {
      if (filterConf === 'all') return true
      return team.conf === filterConf
    })
    .filter(team => {
      if (!searchQuery) return true
      return team.team.toLowerCase().includes(searchQuery.toLowerCase()) ||
             team.teamFull.toLowerCase().includes(searchQuery.toLowerCase())
    })
    .sort((a, b) => {
      type TeamKey = keyof typeof a
      const key = sortBy as TeamKey
      const aVal = a[key] ?? 0
      const bVal = b[key] ?? 0
      if (sortDir === 'asc') {
        return aVal > bVal ? 1 : -1
      }
      return aVal < bVal ? 1 : -1
    })
  
  // Get leaders data
  const leaders = mockLeaders[activeSport][activeCategory] || []

  return (
    <div className="min-h-screen" style={{ background: '#08080c' }}>
      {/* Header */}
      <div className="border-b" style={{ borderColor: 'rgba(255,255,255,0.06)', background: '#0c0c14' }}>
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-black" style={{ color: '#FFF' }}>
                Stats Center
              </h1>
              <p className="text-sm mt-1" style={{ color: '#606070' }}>
                Real-time standings, leaders, and player statistics
              </p>
            </div>
            <button
              onClick={handleRefresh}
              className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all hover:bg-white/10"
              style={{ background: 'rgba(255,255,255,0.05)', color: '#A0A0B0' }}
              disabled={isRefreshing}
            >
              <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>
          
          {/* Sport Tabs */}
          <div className="flex gap-2 mb-4">
            {(Object.keys(sportColors) as Sport[]).map(sport => (
              <button
                key={sport}
                onClick={() => setActiveSport(sport)}
                className="px-6 py-2.5 rounded-lg font-bold text-sm transition-all"
                style={{
                  background: activeSport === sport ? `${sportColors[sport]}20` : 'transparent',
                  color: activeSport === sport ? sportColors[sport] : '#606070',
                  border: activeSport === sport ? `1px solid ${sportColors[sport]}40` : '1px solid transparent',
                }}
              >
                {sportNames[sport]}
              </button>
            ))}
          </div>
          
          {/* View Tabs */}
          <div className="flex gap-4">
            {[
              { key: 'standings', label: 'Standings', icon: Trophy },
              { key: 'leaders', label: 'Leaders', icon: TrendingUp },
              { key: 'teams', label: 'Teams', icon: Users },
              { key: 'players', label: 'Players', icon: Activity },
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveView(key as StatsView)}
                className="flex items-center gap-2 px-4 py-2 transition-all"
                style={{
                  color: activeView === key ? '#FFF' : '#606070',
                  borderBottom: activeView === key ? `2px solid ${sportColors[activeSport]}` : '2px solid transparent',
                }}
              >
                <Icon size={16} />
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Filters */}
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#606070' }} />
            <input
              type="text"
              placeholder={`Search ${activeView}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg text-sm focus:outline-none"
              style={{ 
                background: 'rgba(255,255,255,0.05)', 
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#FFF',
              }}
            />
          </div>
          
          {activeView === 'standings' && (
            <div className="relative">
              <select
                value={filterConf}
                onChange={(e) => setFilterConf(e.target.value)}
                className="appearance-none px-4 py-2.5 pr-10 rounded-lg text-sm focus:outline-none cursor-pointer"
                style={{ 
                  background: 'rgba(255,255,255,0.05)', 
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#FFF',
                }}
              >
                <option value="all">All Conferences</option>
                <option value={activeSport === 'nfl' || activeSport === 'mlb' ? 'AFC' : 'East'}>
                  {activeSport === 'nfl' ? 'AFC' : activeSport === 'mlb' ? 'AL' : 'Eastern'}
                </option>
                <option value={activeSport === 'nfl' || activeSport === 'mlb' ? 'NFC' : 'West'}>
                  {activeSport === 'nfl' ? 'NFC' : activeSport === 'mlb' ? 'NL' : 'Western'}
                </option>
              </select>
              <Filter size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#606070' }} />
            </div>
          )}
          
          {activeView === 'leaders' && (
            <div className="relative">
              <select
                value={activeCategory}
                onChange={(e) => setActiveCategory(e.target.value)}
                className="appearance-none px-4 py-2.5 pr-10 rounded-lg text-sm focus:outline-none cursor-pointer"
                style={{ 
                  background: 'rgba(255,255,255,0.05)', 
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#FFF',
                }}
              >
                {leaderCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#606070' }} />
            </div>
          )}
        </div>

        {/* Standings Table */}
        {activeView === 'standings' && (
          <div className="rounded-xl overflow-hidden" style={{ background: '#0c0c14', border: '1px solid rgba(255,255,255,0.06)' }}>
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  {['Rank', 'Team', 'W', 'L', activeSport === 'nhl' ? 'OTL' : null, 'PCT', 'Streak', 'L10', 'DIFF'].filter(Boolean).map((col) => (
                    <th
                      key={col}
                      onClick={() => handleSort(col?.toLowerCase().replace(/[^a-z]/g, '') || '')}
                      className="px-4 py-3 text-left text-xs font-semibold cursor-pointer hover:bg-white/5 transition-colors"
                      style={{ color: '#606070' }}
                    >
                      <div className="flex items-center gap-1">
                        {col}
                        <ArrowUpDown size={12} />
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredStandings.map((team, idx) => (
                  <tr 
                    key={team.team} 
                    className="hover:bg-white/5 transition-colors cursor-pointer"
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}
                  >
                    <td className="px-4 py-3 text-sm" style={{ color: '#606070' }}>{idx + 1}</td>
                    <td className="px-4 py-3">
                      <Link href={`/${activeSport}?team=${team.team}`} className="flex items-center gap-3">
                        <div 
                          className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs"
                          style={{ background: `${sportColors[activeSport]}20`, color: sportColors[activeSport] }}
                        >
                          {team.team}
                        </div>
                        <div>
                          <div className="font-semibold text-sm" style={{ color: '#FFF' }}>{team.teamFull}</div>
                          <div className="text-xs" style={{ color: '#606070' }}>{team.conf} {team.div}</div>
                        </div>
                      </Link>
                    </td>
                    <td className="px-4 py-3 font-semibold" style={{ color: '#00FF88' }}>{team.wins}</td>
                    <td className="px-4 py-3 font-semibold" style={{ color: '#FF4455' }}>{team.losses}</td>
                    {activeSport === 'nhl' && <td className="px-4 py-3" style={{ color: '#A0A0B0' }}>{team.ties || 0}</td>}
                    <td className="px-4 py-3 font-mono text-sm" style={{ color: '#A0A0B0' }}>.{(team.pct * 1000).toFixed(0).padStart(3, '0')}</td>
                    <td className="px-4 py-3">
                      <span 
                        className="text-sm font-semibold"
                        style={{ color: team.streak.startsWith('W') ? '#00FF88' : '#FF4455' }}
                      >
                        {team.streak}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm" style={{ color: '#A0A0B0' }}>{team.last10}</td>
                    <td className="px-4 py-3">
                      <span 
                        className="font-semibold"
                        style={{ color: (team.diff || 0) > 0 ? '#00FF88' : (team.diff || 0) < 0 ? '#FF4455' : '#A0A0B0' }}
                      >
                        {(team.diff || 0) > 0 ? '+' : ''}{team.diff}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Leaders Grid */}
        {activeView === 'leaders' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Main Leaders Table */}
            <div className="col-span-1 lg:col-span-2 rounded-xl overflow-hidden" style={{ background: '#0c0c14', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <h2 className="text-lg font-bold" style={{ color: '#FFF' }}>{activeCategory}</h2>
              </div>
              <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.03)' }}>
                {leaders.map((player, idx) => (
                  <div 
                    key={player.name}
                    className="flex items-center gap-4 px-5 py-4 hover:bg-white/5 transition-colors cursor-pointer"
                  >
                    <span 
                      className="w-8 h-8 rounded-full flex items-center justify-center font-black text-sm"
                      style={{ 
                        background: idx < 3 ? `${sportColors[activeSport]}20` : 'rgba(255,255,255,0.05)',
                        color: idx < 3 ? sportColors[activeSport] : '#606070',
                      }}
                    >
                      {idx + 1}
                    </span>
                    
                    <div className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold" 
                      style={{ background: 'rgba(255,255,255,0.05)', color: '#FFF' }}
                    >
                      {player.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    
                    <div className="flex-1">
                      <div className="font-semibold" style={{ color: '#FFF' }}>{player.name}</div>
                      <div className="text-sm" style={{ color: '#606070' }}>{player.team} · {player.position}</div>
                    </div>
                    
                    <div className="flex items-center gap-6">
                      {Object.entries(player.stats).slice(0, 4).map(([key, val]) => (
                        <div key={key} className="text-right">
                          <div className="font-bold" style={{ color: key === Object.keys(player.stats)[0] ? sportColors[activeSport] : '#FFF' }}>
                            {typeof val === 'number' && val < 1 && val > 0 
                              ? `.${(val * 1000).toFixed(0).padStart(3, '0')}` 
                              : val}
                          </div>
                          <div className="text-xs uppercase" style={{ color: '#606070' }}>{key}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Teams & Players placeholder */}
        {(activeView === 'teams' || activeView === 'players') && (
          <div 
            className="rounded-xl p-12 text-center" 
            style={{ background: '#0c0c14', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: `${sportColors[activeSport]}20` }}>
              {activeView === 'teams' ? <Users size={32} style={{ color: sportColors[activeSport] }} /> : <Activity size={32} style={{ color: sportColors[activeSport] }} />}
            </div>
            <h3 className="text-xl font-bold mb-2" style={{ color: '#FFF' }}>
              {activeView === 'teams' ? 'Team Stats' : 'Player Database'}
            </h3>
            <p style={{ color: '#606070' }}>
              Detailed {activeView === 'teams' ? 'team analytics and comparisons' : 'player statistics and profiles'} coming soon.
              <br />
              Search above to find specific {activeView}.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

// =============================================================================
// MAIN PAGE EXPORT
// =============================================================================

export default function StatsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#08080c' }}>
        <div className="animate-spin w-8 h-8 border-2 rounded-full" style={{ borderColor: '#FF6B00', borderTopColor: 'transparent' }} />
      </div>
    }>
      <StatsPageContent />
    </Suspense>
  )
}
