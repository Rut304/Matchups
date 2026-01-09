'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  TrendingUp,
  Trophy,
  Calendar,
  BarChart3,
  Flame,
  Activity,
  Star,
  Search,
  Snowflake,
  Home,
  Plane,
} from 'lucide-react'

type TimeFrame = 'season' | 'last30' | 'last14' | 'last7'
type BetType = 'ats' | 'ou' | 'ml'
type Situation = 'all' | 'home' | 'away' | 'favorite' | 'underdog'

// WNBA Team Type
interface WNBATeam {
  id: string
  abbr: string
  name: string
  city: string
  conference: string
  emoji: string
  record: { wins: number; losses: number }
  ats: {
    overall: { wins: number; losses: number; pushes: number }
    home: { wins: number; losses: number; pushes: number }
    away: { wins: number; losses: number; pushes: number }
    asFavorite: { wins: number; losses: number; pushes: number }
    asUnderdog: { wins: number; losses: number; pushes: number }
    last10: { wins: number; losses: number; pushes: number }
  }
  ou: {
    overall: { overs: number; unders: number; pushes: number }
    home: { overs: number; unders: number; pushes: number }
    away: { overs: number; unders: number; pushes: number }
    last10: { overs: number; unders: number; pushes: number }
  }
  ml: { asFavorite: { wins: number; losses: number }; asUnderdog: { wins: number; losses: number } }
  scoring: { ppg: number; oppg: number; margin: number }
  trends: string[]
  streak: string
  isHot: boolean
  isCold: boolean
}

// WNBA Teams Data
const wnbaTeams: WNBATeam[] = [
  {
    id: 'nyl', abbr: 'NYL', name: 'Liberty', city: 'New York', conference: 'Eastern', emoji: '🗽',
    record: { wins: 32, losses: 8 },
    ats: { overall: { wins: 24, losses: 14, pushes: 2 }, home: { wins: 14, losses: 5, pushes: 1 }, away: { wins: 10, losses: 9, pushes: 1 }, asFavorite: { wins: 22, losses: 12, pushes: 2 }, asUnderdog: { wins: 2, losses: 2, pushes: 0 }, last10: { wins: 7, losses: 3, pushes: 0 } },
    ou: { overall: { overs: 22, unders: 16, pushes: 2 }, home: { overs: 12, unders: 7, pushes: 1 }, away: { overs: 10, unders: 9, pushes: 1 }, last10: { overs: 6, unders: 4, pushes: 0 } },
    ml: { asFavorite: { wins: 28, losses: 4 }, asUnderdog: { wins: 4, losses: 4 } },
    scoring: { ppg: 87.4, oppg: 76.2, margin: 11.2 },
    trends: ['NYL 7-3 ATS last 10', 'OVER 6-4 last 10 games', 'Liberty 14-5 ATS at home'],
    streak: 'W4', isHot: true, isCold: false,
  },
  {
    id: 'min', abbr: 'MIN', name: 'Lynx', city: 'Minnesota', conference: 'Western', emoji: '🐱',
    record: { wins: 30, losses: 10 },
    ats: { overall: { wins: 23, losses: 15, pushes: 2 }, home: { wins: 13, losses: 6, pushes: 1 }, away: { wins: 10, losses: 9, pushes: 1 }, asFavorite: { wins: 20, losses: 12, pushes: 2 }, asUnderdog: { wins: 3, losses: 3, pushes: 0 }, last10: { wins: 6, losses: 4, pushes: 0 } },
    ou: { overall: { overs: 18, unders: 20, pushes: 2 }, home: { overs: 10, unders: 9, pushes: 1 }, away: { overs: 8, unders: 11, pushes: 1 }, last10: { overs: 4, unders: 6, pushes: 0 } },
    ml: { asFavorite: { wins: 26, losses: 4 }, asUnderdog: { wins: 4, losses: 6 } },
    scoring: { ppg: 84.2, oppg: 77.8, margin: 6.4 },
    trends: ['MIN 6-4 ATS last 10', 'UNDER 6-4 last 10 games', 'Lynx defensive games trend UNDER'],
    streak: 'W2', isHot: true, isCold: false,
  },
  {
    id: 'con', abbr: 'CON', name: 'Sun', city: 'Connecticut', conference: 'Eastern', emoji: '☀️',
    record: { wins: 28, losses: 12 },
    ats: { overall: { wins: 22, losses: 16, pushes: 2 }, home: { wins: 12, losses: 7, pushes: 1 }, away: { wins: 10, losses: 9, pushes: 1 }, asFavorite: { wins: 18, losses: 12, pushes: 2 }, asUnderdog: { wins: 4, losses: 4, pushes: 0 }, last10: { wins: 5, losses: 5, pushes: 0 } },
    ou: { overall: { overs: 16, unders: 22, pushes: 2 }, home: { overs: 9, unders: 10, pushes: 1 }, away: { overs: 7, unders: 12, pushes: 1 }, last10: { overs: 3, unders: 7, pushes: 0 } },
    ml: { asFavorite: { wins: 24, losses: 4 }, asUnderdog: { wins: 4, losses: 8 } },
    scoring: { ppg: 79.8, oppg: 74.2, margin: 5.6 },
    trends: ['CON best UNDER team: 22-16', 'Sun 5-5 ATS last 10', 'Connecticut strong defensive metrics'],
    streak: 'L1', isHot: false, isCold: false,
  },
  {
    id: 'lva', abbr: 'LVA', name: 'Aces', city: 'Las Vegas', conference: 'Western', emoji: '♠️',
    record: { wins: 27, losses: 13 },
    ats: { overall: { wins: 21, losses: 17, pushes: 2 }, home: { wins: 12, losses: 7, pushes: 1 }, away: { wins: 9, losses: 10, pushes: 1 }, asFavorite: { wins: 19, losses: 13, pushes: 2 }, asUnderdog: { wins: 2, losses: 4, pushes: 0 }, last10: { wins: 7, losses: 3, pushes: 0 } },
    ou: { overall: { overs: 24, unders: 14, pushes: 2 }, home: { overs: 14, unders: 5, pushes: 1 }, away: { overs: 10, unders: 9, pushes: 1 }, last10: { overs: 7, unders: 3, pushes: 0 } },
    ml: { asFavorite: { wins: 24, losses: 4 }, asUnderdog: { wins: 3, losses: 9 } },
    scoring: { ppg: 89.6, oppg: 82.4, margin: 7.2 },
    trends: ['LVA best OVER team: 24-14', 'Aces 7-3 ATS last 10', 'A\'ja Wilson averaging 26.9 PPG'],
    streak: 'W3', isHot: true, isCold: false,
  },
  {
    id: 'sea', abbr: 'SEA', name: 'Storm', city: 'Seattle', conference: 'Western', emoji: '⛈️',
    record: { wins: 25, losses: 15 },
    ats: { overall: { wins: 20, losses: 18, pushes: 2 }, home: { wins: 11, losses: 8, pushes: 1 }, away: { wins: 9, losses: 10, pushes: 1 }, asFavorite: { wins: 16, losses: 12, pushes: 2 }, asUnderdog: { wins: 4, losses: 6, pushes: 0 }, last10: { wins: 5, losses: 5, pushes: 0 } },
    ou: { overall: { overs: 20, unders: 18, pushes: 2 }, home: { overs: 11, unders: 8, pushes: 1 }, away: { overs: 9, unders: 10, pushes: 1 }, last10: { overs: 5, unders: 5, pushes: 0 } },
    ml: { asFavorite: { wins: 20, losses: 6 }, asUnderdog: { wins: 5, losses: 9 } },
    scoring: { ppg: 82.4, oppg: 79.8, margin: 2.6 },
    trends: ['SEA 5-5 ATS last 10', 'Storm balanced O/U: 20-18', 'Seattle struggles on road'],
    streak: 'W1', isHot: false, isCold: false,
  },
  {
    id: 'ind', abbr: 'IND', name: 'Fever', city: 'Indiana', conference: 'Eastern', emoji: '🔥',
    record: { wins: 20, losses: 20 },
    ats: { overall: { wins: 22, losses: 16, pushes: 2 }, home: { wins: 12, losses: 7, pushes: 1 }, away: { wins: 10, losses: 9, pushes: 1 }, asFavorite: { wins: 8, losses: 6, pushes: 0 }, asUnderdog: { wins: 14, losses: 10, pushes: 2 }, last10: { wins: 6, losses: 4, pushes: 0 } },
    ou: { overall: { overs: 26, unders: 12, pushes: 2 }, home: { overs: 14, unders: 5, pushes: 1 }, away: { overs: 12, unders: 7, pushes: 1 }, last10: { overs: 8, unders: 2, pushes: 0 } },
    ml: { asFavorite: { wins: 12, losses: 4 }, asUnderdog: { wins: 8, losses: 16 } },
    scoring: { ppg: 86.8, oppg: 87.2, margin: -0.4 },
    trends: ['IND best OVER team: 26-12', 'Fever 6-4 ATS last 10', 'Caitlin Clark 8.4 APG leads league'],
    streak: 'L2', isHot: false, isCold: false,
  },
  {
    id: 'chi', abbr: 'CHI', name: 'Sky', city: 'Chicago', conference: 'Eastern', emoji: '🌆',
    record: { wins: 13, losses: 27 },
    ats: { overall: { wins: 18, losses: 20, pushes: 2 }, home: { wins: 10, losses: 9, pushes: 1 }, away: { wins: 8, losses: 11, pushes: 1 }, asFavorite: { wins: 4, losses: 6, pushes: 0 }, asUnderdog: { wins: 14, losses: 14, pushes: 2 }, last10: { wins: 4, losses: 6, pushes: 0 } },
    ou: { overall: { overs: 22, unders: 16, pushes: 2 }, home: { overs: 12, unders: 7, pushes: 1 }, away: { overs: 10, unders: 9, pushes: 1 }, last10: { overs: 6, unders: 4, pushes: 0 } },
    ml: { asFavorite: { wins: 6, losses: 4 }, asUnderdog: { wins: 7, losses: 23 } },
    scoring: { ppg: 80.4, oppg: 86.2, margin: -5.8 },
    trends: ['CHI 4-6 ATS last 10', 'Sky games trending OVER', 'Angel Reese 13.1 RPG leads rookies'],
    streak: 'L3', isHot: false, isCold: true,
  },
  {
    id: 'pho', abbr: 'PHO', name: 'Mercury', city: 'Phoenix', conference: 'Western', emoji: '☿️',
    record: { wins: 19, losses: 21 },
    ats: { overall: { wins: 19, losses: 19, pushes: 2 }, home: { wins: 11, losses: 8, pushes: 1 }, away: { wins: 8, losses: 11, pushes: 1 }, asFavorite: { wins: 10, losses: 8, pushes: 1 }, asUnderdog: { wins: 9, losses: 11, pushes: 1 }, last10: { wins: 5, losses: 5, pushes: 0 } },
    ou: { overall: { overs: 19, unders: 19, pushes: 2 }, home: { overs: 10, unders: 9, pushes: 1 }, away: { overs: 9, unders: 10, pushes: 1 }, last10: { overs: 5, unders: 5, pushes: 0 } },
    ml: { asFavorite: { wins: 14, losses: 6 }, asUnderdog: { wins: 5, losses: 15 } },
    scoring: { ppg: 82.8, oppg: 83.4, margin: -0.6 },
    trends: ['PHO balanced ATS: 19-19', 'Mercury 5-5 ATS last 10', 'Diana Taurasi still impactful at 42'],
    streak: 'W1', isHot: false, isCold: false,
  },
  {
    id: 'was', abbr: 'WAS', name: 'Mystics', city: 'Washington', conference: 'Eastern', emoji: '🏛️',
    record: { wins: 14, losses: 26 },
    ats: { overall: { wins: 17, losses: 21, pushes: 2 }, home: { wins: 9, losses: 10, pushes: 1 }, away: { wins: 8, losses: 11, pushes: 1 }, asFavorite: { wins: 4, losses: 4, pushes: 1 }, asUnderdog: { wins: 13, losses: 17, pushes: 1 }, last10: { wins: 4, losses: 6, pushes: 0 } },
    ou: { overall: { overs: 18, unders: 20, pushes: 2 }, home: { overs: 9, unders: 10, pushes: 1 }, away: { overs: 9, unders: 10, pushes: 1 }, last10: { overs: 4, unders: 6, pushes: 0 } },
    ml: { asFavorite: { wins: 6, losses: 3 }, asUnderdog: { wins: 8, losses: 23 } },
    scoring: { ppg: 78.6, oppg: 84.8, margin: -6.2 },
    trends: ['WAS 4-6 ATS last 10', 'Mystics games trending UNDER', 'Washington struggles as underdog'],
    streak: 'L2', isHot: false, isCold: true,
  },
  {
    id: 'atl', abbr: 'ATL', name: 'Dream', city: 'Atlanta', conference: 'Eastern', emoji: '💭',
    record: { wins: 15, losses: 25 },
    ats: { overall: { wins: 18, losses: 20, pushes: 2 }, home: { wins: 10, losses: 9, pushes: 1 }, away: { wins: 8, losses: 11, pushes: 1 }, asFavorite: { wins: 5, losses: 5, pushes: 1 }, asUnderdog: { wins: 13, losses: 15, pushes: 1 }, last10: { wins: 5, losses: 5, pushes: 0 } },
    ou: { overall: { overs: 17, unders: 21, pushes: 2 }, home: { overs: 9, unders: 10, pushes: 1 }, away: { overs: 8, unders: 11, pushes: 1 }, last10: { overs: 4, unders: 6, pushes: 0 } },
    ml: { asFavorite: { wins: 8, losses: 4 }, asUnderdog: { wins: 7, losses: 21 } },
    scoring: { ppg: 79.2, oppg: 83.6, margin: -4.4 },
    trends: ['ATL 5-5 ATS last 10', 'Dream games trend UNDER', 'Rhyne Howard emerging star'],
    streak: 'W1', isHot: false, isCold: false,
  },
  {
    id: 'dal', abbr: 'DAL', name: 'Wings', city: 'Dallas', conference: 'Western', emoji: '🪽',
    record: { wins: 9, losses: 31 },
    ats: { overall: { wins: 15, losses: 23, pushes: 2 }, home: { wins: 8, losses: 11, pushes: 1 }, away: { wins: 7, losses: 12, pushes: 1 }, asFavorite: { wins: 2, losses: 4, pushes: 0 }, asUnderdog: { wins: 13, losses: 19, pushes: 2 }, last10: { wins: 3, losses: 7, pushes: 0 } },
    ou: { overall: { overs: 18, unders: 20, pushes: 2 }, home: { overs: 9, unders: 10, pushes: 1 }, away: { overs: 9, unders: 10, pushes: 1 }, last10: { overs: 5, unders: 5, pushes: 0 } },
    ml: { asFavorite: { wins: 4, losses: 3 }, asUnderdog: { wins: 5, losses: 28 } },
    scoring: { ppg: 76.4, oppg: 86.8, margin: -10.4 },
    trends: ['DAL 3-7 ATS last 10', 'Wings struggling overall', 'Dallas rebuilding mode'],
    streak: 'L4', isHot: false, isCold: true,
  },
  {
    id: 'la', abbr: 'LA', name: 'Sparks', city: 'Los Angeles', conference: 'Western', emoji: '✨',
    record: { wins: 8, losses: 32 },
    ats: { overall: { wins: 14, losses: 24, pushes: 2 }, home: { wins: 8, losses: 11, pushes: 1 }, away: { wins: 6, losses: 13, pushes: 1 }, asFavorite: { wins: 2, losses: 3, pushes: 0 }, asUnderdog: { wins: 12, losses: 21, pushes: 2 }, last10: { wins: 3, losses: 7, pushes: 0 } },
    ou: { overall: { overs: 16, unders: 22, pushes: 2 }, home: { overs: 8, unders: 11, pushes: 1 }, away: { overs: 8, unders: 11, pushes: 1 }, last10: { overs: 4, unders: 6, pushes: 0 } },
    ml: { asFavorite: { wins: 3, losses: 2 }, asUnderdog: { wins: 5, losses: 30 } },
    scoring: { ppg: 74.8, oppg: 86.4, margin: -11.6 },
    trends: ['LA 3-7 ATS last 10', 'Sparks games trending UNDER', 'Cameron Brink injury impacted season'],
    streak: 'L5', isHot: false, isCold: true,
  },
]

// Top Players (MVP Race)
const topPlayers = [
  { name: 'A\'ja Wilson', team: 'LVA', pos: 'F', ppg: 26.9, rpg: 11.9, bpg: 2.6, odds: '-300' },
  { name: 'Napheesa Collier', team: 'MIN', pos: 'F', ppg: 20.4, rpg: 10.4, apg: 3.4, odds: '+400' },
  { name: 'Breanna Stewart', team: 'NYL', pos: 'F', ppg: 20.4, rpg: 8.5, apg: 3.8, odds: '+600' },
  { name: 'Caitlin Clark', team: 'IND', pos: 'G', ppg: 19.2, rpg: 5.7, apg: 8.4, odds: '+1500' },
]

// Rookie Watch
const rookieWatch = [
  { name: 'Caitlin Clark', team: 'Indiana', college: 'Iowa', ppg: 19.2, apg: 8.4, fg: '.380' },
  { name: 'Angel Reese', team: 'Chicago', college: 'LSU', ppg: 13.6, rpg: 13.1, doubles: 26 },
  { name: 'Cameron Brink', team: 'LA', college: 'Stanford', ppg: 8.1, rpg: 5.7, bpg: 2.5 },
  { name: 'Rickea Jackson', team: 'LA', college: 'Tennessee', ppg: 10.2, rpg: 2.8, fg: '.445' },
]

// Helper functions
const calcWinPct = (wins: number, losses: number): number => {
  const total = wins + losses
  return total > 0 ? (wins / total) * 100 : 0
}

const calcOverPct = (overs: number, unders: number): number => {
  const total = overs + unders
  return total > 0 ? (overs / total) * 100 : 0
}

export default function WNBAPage() {
  const [timeframe, setTimeframe] = useState<TimeFrame>('season')
  const [betType, setBetType] = useState<BetType>('ats')
  const [situation, setSituation] = useState<Situation>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'winPct' | 'profit' | 'name'>('winPct')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [selectedTeam, setSelectedTeam] = useState<WNBATeam | null>(null)
  const [activeView, setActiveView] = useState<'teams' | 'games' | 'players'>('teams')
  
  // Filter and sort teams
  const filteredTeams = useMemo(() => {
    let teams = [...wnbaTeams]
    
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      teams = teams.filter(t => 
        t.name.toLowerCase().includes(q) || 
        t.city.toLowerCase().includes(q) ||
        t.abbr.toLowerCase().includes(q)
      )
    }
    
    teams.sort((a, b) => {
      let aVal: number | string = 0
      let bVal: number | string = 0
      
      if (sortBy === 'winPct') {
        if (betType === 'ats') {
          const getATSPct = (t: WNBATeam) => {
            if (situation === 'home') return calcWinPct(t.ats.home.wins, t.ats.home.losses)
            if (situation === 'away') return calcWinPct(t.ats.away.wins, t.ats.away.losses)
            if (situation === 'favorite') return calcWinPct(t.ats.asFavorite.wins, t.ats.asFavorite.losses)
            if (situation === 'underdog') return calcWinPct(t.ats.asUnderdog.wins, t.ats.asUnderdog.losses)
            return calcWinPct(t.ats.overall.wins, t.ats.overall.losses)
          }
          aVal = getATSPct(a)
          bVal = getATSPct(b)
        } else if (betType === 'ou') {
          aVal = calcOverPct(a.ou.overall.overs, a.ou.overall.unders)
          bVal = calcOverPct(b.ou.overall.overs, b.ou.overall.unders)
        } else {
          aVal = calcWinPct(a.ml.asFavorite.wins + a.ml.asUnderdog.wins, a.ml.asFavorite.losses + a.ml.asUnderdog.losses)
          bVal = calcWinPct(b.ml.asFavorite.wins + b.ml.asUnderdog.wins, b.ml.asFavorite.losses + b.ml.asUnderdog.losses)
        }
      } else if (sortBy === 'profit') {
        aVal = calcWinPct(a.ats.overall.wins, a.ats.overall.losses) - 50
        bVal = calcWinPct(b.ats.overall.wins, b.ats.overall.losses) - 50
      } else {
        aVal = a.name
        bVal = b.name
      }
      
      if (sortDir === 'asc') return aVal > bVal ? 1 : -1
      return aVal < bVal ? 1 : -1
    })
    
    return teams
  }, [searchQuery, sortBy, sortDir, betType, situation])
  
  const topATSTeams = [...wnbaTeams].sort((a, b) => 
    calcWinPct(b.ats.overall.wins, b.ats.overall.losses) - calcWinPct(a.ats.overall.wins, a.ats.overall.losses)
  ).slice(0, 5)
  
  const topOverTeams = [...wnbaTeams].sort((a, b) => 
    calcOverPct(b.ou.overall.overs, b.ou.overall.unders) - calcOverPct(a.ou.overall.overs, a.ou.overall.unders)
  ).slice(0, 5)
  
  const hotTeams = wnbaTeams.filter(t => t.isHot)
  const coldTeams = wnbaTeams.filter(t => t.isCold)

  return (
    <div className="min-h-screen" style={{ background: '#050508' }}>
      {/* Hero Header */}
      <section className="relative overflow-hidden" style={{ background: 'linear-gradient(180deg, #0a0a12 0%, #050508 100%)' }}>
        <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full opacity-20 blur-3xl pointer-events-none" 
             style={{ background: 'radial-gradient(circle, #FF6B00 0%, transparent 70%)' }} />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center gap-4 mb-6">
            <span className="text-5xl">🏀</span>
            <div>
              <h1 className="text-4xl font-black" style={{ color: '#FFF' }}>WNBA Analytics</h1>
              <p className="text-lg" style={{ color: '#808090' }}>2025 Season • The W is Here</p>
            </div>
          </div>
          
          {/* View Toggle */}
          <div className="flex gap-2 mb-6">
            {(['teams', 'games', 'players'] as const).map(view => (
              <button
                key={view}
                onClick={() => setActiveView(view)}
                className="px-4 py-2 rounded-xl font-semibold text-sm transition-all capitalize"
                style={{
                  background: activeView === view ? '#FF6B00' : 'rgba(255,255,255,0.05)',
                  color: activeView === view ? '#000' : '#808090',
                }}
              >
                {view}
              </button>
            ))}
          </div>
          
          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl" style={{ background: 'rgba(255,107,0,0.1)', border: '1px solid rgba(255,107,0,0.2)' }}>
              <div className="flex items-center gap-2 mb-1">
                <Flame className="w-4 h-4" style={{ color: '#FF6B00' }} />
                <span className="text-xs uppercase" style={{ color: '#808090' }}>Hot Teams</span>
              </div>
              <div className="text-2xl font-black" style={{ color: '#FF6B00' }}>{hotTeams.length}</div>
            </div>
            <div className="p-4 rounded-xl" style={{ background: 'rgba(0,168,255,0.1)', border: '1px solid rgba(0,168,255,0.2)' }}>
              <div className="flex items-center gap-2 mb-1">
                <Snowflake className="w-4 h-4" style={{ color: '#00A8FF' }} />
                <span className="text-xs uppercase" style={{ color: '#808090' }}>Cold Teams</span>
              </div>
              <div className="text-2xl font-black" style={{ color: '#00A8FF' }}>{coldTeams.length}</div>
            </div>
            <div className="p-4 rounded-xl" style={{ background: 'rgba(0,255,136,0.1)', border: '1px solid rgba(0,255,136,0.2)' }}>
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4" style={{ color: '#00FF88' }} />
                <span className="text-xs uppercase" style={{ color: '#808090' }}>Best ATS</span>
              </div>
              <div className="text-lg font-black" style={{ color: '#00FF88' }}>{topATSTeams[0]?.abbr}</div>
            </div>
            <div className="p-4 rounded-xl" style={{ background: 'rgba(255,215,0,0.1)', border: '1px solid rgba(255,215,0,0.2)' }}>
              <div className="flex items-center gap-2 mb-1">
                <Activity className="w-4 h-4" style={{ color: '#FFD700' }} />
                <span className="text-xs uppercase" style={{ color: '#808090' }}>Best OVER</span>
              </div>
              <div className="text-lg font-black" style={{ color: '#FFD700' }}>{topOverTeams[0]?.abbr}</div>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeView === 'teams' && (
          <>
            {/* Filters */}
            <div className="mb-6 flex flex-wrap gap-4">
              {/* Search */}
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#808090' }} />
                <input
                  type="text"
                  placeholder="Search teams..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-xl text-sm"
                  style={{ background: 'rgba(255,255,255,0.05)', color: '#FFF', border: 'none' }}
                />
              </div>
              
              {/* Bet Type */}
              <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)' }}>
                {(['ats', 'ou', 'ml'] as BetType[]).map(type => (
                  <button
                    key={type}
                    onClick={() => setBetType(type)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold uppercase transition-all"
                    style={{
                      background: betType === type ? '#FF6B00' : 'transparent',
                      color: betType === type ? '#000' : '#808090',
                    }}
                  >
                    {type}
                  </button>
                ))}
              </div>
              
              {/* Situation */}
              <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)' }}>
                {(['all', 'home', 'away', 'favorite', 'underdog'] as Situation[]).map(sit => (
                  <button
                    key={sit}
                    onClick={() => setSituation(sit)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all"
                    style={{
                      background: situation === sit ? '#FF6B00' : 'transparent',
                      color: situation === sit ? '#000' : '#808090',
                    }}
                  >
                    {sit}
                  </button>
                ))}
              </div>
            </div>

            {/* Team Cards Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTeams.map(team => {
                const atsPct = calcWinPct(team.ats.overall.wins, team.ats.overall.losses)
                const ouPct = calcOverPct(team.ou.overall.overs, team.ou.overall.unders)
                
                return (
                  <div
                    key={team.id}
                    className="p-4 rounded-2xl cursor-pointer transition-all hover:scale-[1.02]"
                    style={{ 
                      background: '#0c0c14', 
                      border: team.isHot ? '2px solid #FF6B00' : team.isCold ? '2px solid #00A8FF' : '1px solid rgba(255,255,255,0.06)' 
                    }}
                    onClick={() => setSelectedTeam(selectedTeam?.id === team.id ? null : team)}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">{team.emoji}</span>
                        <div>
                          <div className="font-bold text-white">{team.city} {team.name}</div>
                          <div className="text-xs" style={{ color: '#808090' }}>
                            {team.record.wins}-{team.record.losses} • {team.conference}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {team.isHot && <Flame className="w-4 h-4" style={{ color: '#FF6B00' }} />}
                        {team.isCold && <Snowflake className="w-4 h-4" style={{ color: '#00A8FF' }} />}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2 mb-3">
                      <div className="text-center p-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)' }}>
                        <div className="text-lg font-bold" style={{ color: atsPct >= 55 ? '#00FF88' : atsPct <= 45 ? '#FF4455' : '#FFF' }}>
                          {atsPct.toFixed(0)}%
                        </div>
                        <div className="text-[10px]" style={{ color: '#808090' }}>ATS</div>
                      </div>
                      <div className="text-center p-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)' }}>
                        <div className="text-lg font-bold" style={{ color: ouPct >= 55 ? '#00FF88' : ouPct <= 45 ? '#FF4455' : '#FFF' }}>
                          {ouPct.toFixed(0)}%
                        </div>
                        <div className="text-[10px]" style={{ color: '#808090' }}>OVER</div>
                      </div>
                      <div className="text-center p-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)' }}>
                        <div className="text-lg font-bold text-white">{team.streak}</div>
                        <div className="text-[10px]" style={{ color: '#808090' }}>Streak</div>
                      </div>
                    </div>
                    
                    {/* Expanded Details */}
                    {selectedTeam?.id === team.id && (
                      <div className="pt-3 mt-3 space-y-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                        <div>
                          <div className="text-xs font-semibold mb-2" style={{ color: '#808090' }}>ATS SPLITS</div>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="flex justify-between">
                              <span style={{ color: '#606070' }}>Home:</span>
                              <span style={{ color: '#FFF' }}>{team.ats.home.wins}-{team.ats.home.losses}</span>
                            </div>
                            <div className="flex justify-between">
                              <span style={{ color: '#606070' }}>Away:</span>
                              <span style={{ color: '#FFF' }}>{team.ats.away.wins}-{team.ats.away.losses}</span>
                            </div>
                            <div className="flex justify-between">
                              <span style={{ color: '#606070' }}>As Fav:</span>
                              <span style={{ color: '#FFF' }}>{team.ats.asFavorite.wins}-{team.ats.asFavorite.losses}</span>
                            </div>
                            <div className="flex justify-between">
                              <span style={{ color: '#606070' }}>As Dog:</span>
                              <span style={{ color: '#FFF' }}>{team.ats.asUnderdog.wins}-{team.ats.asUnderdog.losses}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div>
                          <div className="text-xs font-semibold mb-2" style={{ color: '#808090' }}>KEY TRENDS</div>
                          {team.trends.map((trend, i) => (
                            <div key={i} className="text-xs py-1" style={{ color: '#A0A0B0' }}>• {trend}</div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </>
        )}

        {activeView === 'games' && (
          <div className="rounded-2xl p-5" style={{ background: '#0c0c14', border: '1px solid rgba(255,255,255,0.06)' }}>
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-red-500" />
              Today&apos;s WNBA Games
            </h3>
            <p className="text-center py-8" style={{ color: '#808090' }}>
              Check the <Link href="/scores?sport=wnba" className="text-blue-400 hover:underline">Scores page</Link> for live WNBA games and schedules.
            </p>
          </div>
        )}

        {activeView === 'players' && (
          <div className="grid lg:grid-cols-2 gap-6">
            {/* MVP Race */}
            <div className="rounded-2xl p-5" style={{ background: '#0c0c14', border: '1px solid rgba(255,255,255,0.06)' }}>
              <h3 className="flex items-center gap-2 text-lg font-bold mb-4 text-white">
                <Trophy className="w-5 h-5" style={{ color: '#FFD700' }} />
                MVP Race
              </h3>
              <div className="space-y-3">
                {topPlayers.map((player, i) => (
                  <div key={player.name} className="flex items-center justify-between p-3 rounded-xl" 
                       style={{ background: 'rgba(255,255,255,0.03)' }}>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                           style={{ background: i === 0 ? '#FFD700' : i === 1 ? '#C0C0C0' : i === 2 ? '#CD7F32' : '#606070', color: '#000' }}>
                        {i + 1}
                      </div>
                      <div>
                        <div className="font-bold text-white">{player.name}</div>
                        <div className="text-xs" style={{ color: '#808090' }}>{player.team} • {player.pos}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold" style={{ color: '#00FF88' }}>{player.odds}</div>
                      <div className="text-xs" style={{ color: '#808090' }}>{player.ppg} PPG</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Rookie Watch */}
            <div className="rounded-2xl p-5" style={{ background: '#0c0c14', border: '1px solid rgba(255,255,255,0.06)' }}>
              <h3 className="flex items-center gap-2 text-lg font-bold mb-4 text-white">
                <Star className="w-5 h-5" style={{ color: '#FF6B00' }} />
                Rookie Watch
              </h3>
              <div className="space-y-3">
                {rookieWatch.map((rookie) => (
                  <div key={rookie.name} className="p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)' }}>
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <div className="font-bold text-white">{rookie.name}</div>
                        <div className="text-xs" style={{ color: '#808090' }}>{rookie.team} • {rookie.college}</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div>
                        <div className="text-sm font-bold" style={{ color: '#00FF88' }}>{rookie.ppg}</div>
                        <div className="text-[10px]" style={{ color: '#606070' }}>PPG</div>
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white">{rookie.apg || rookie.rpg}</div>
                        <div className="text-[10px]" style={{ color: '#606070' }}>{rookie.apg ? 'APG' : 'RPG'}</div>
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white">{rookie.fg || rookie.doubles || rookie.bpg}</div>
                        <div className="text-[10px]" style={{ color: '#606070' }}>{rookie.fg ? 'FG%' : rookie.doubles ? 'DD' : 'BPG'}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
