'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { 
  Users,
  Search,
  TrendingUp,
  TrendingDown,
  Target,
  BarChart3,
  Flame,
  Snowflake,
  AlertTriangle,
  ChevronRight,
  Filter,
  Star,
  Activity,
  Zap,
  Trophy,
  DollarSign,
  Percent
} from 'lucide-react'

type Sport = 'all' | 'nfl' | 'nba' | 'nhl' | 'mlb'
type Position = string
type PropType = 'points' | 'rebounds' | 'assists' | 'passing' | 'rushing' | 'receiving' | 'goals' | 'shots' | 'all'

interface Player {
  id: string
  name: string
  team: string
  teamAbbr: string
  sport: Sport
  position: string
  image?: string
  emoji: string
  stats: {
    avgPoints?: number
    avgRebounds?: number
    avgAssists?: number
    avgPassYds?: number
    avgRushYds?: number
    avgRecYds?: number
    avgGoals?: number
    avgShots?: number
    gamesPlayed: number
  }
  props: {
    type: string
    line: number
    overOdds: number
    underOdds: number
    overHitRate: number
    trend: 'up' | 'down' | 'stable'
    edge?: number
  }[]
  injury?: {
    status: 'Out' | 'Doubtful' | 'Questionable' | 'Probable'
    description: string
  }
  isHot: boolean
  isCold: boolean
  aiRecommendation?: string
}

// Mock player data
const mockPlayers: Player[] = [
  // NBA
  {
    id: 'luka-doncic',
    name: 'Luka Dončić',
    team: 'Dallas Mavericks',
    teamAbbr: 'DAL',
    sport: 'nba',
    position: 'PG',
    emoji: '🏀',
    stats: { avgPoints: 33.8, avgRebounds: 9.2, avgAssists: 9.8, gamesPlayed: 32 },
    props: [
      { type: 'Points', line: 32.5, overOdds: -115, underOdds: -105, overHitRate: 62, trend: 'up', edge: 4.2 },
      { type: 'Assists', line: 9.5, overOdds: -110, underOdds: -110, overHitRate: 55, trend: 'stable' },
      { type: 'Rebounds', line: 8.5, overOdds: -105, underOdds: -115, overHitRate: 58, trend: 'up' },
    ],
    isHot: true,
    isCold: false,
    aiRecommendation: 'OVER 32.5 Points - Averaging 36.2 PPG in last 5 games, facing bottom-10 defense'
  },
  {
    id: 'shai-gilgeous-alexander',
    name: 'Shai Gilgeous-Alexander',
    team: 'Oklahoma City Thunder',
    teamAbbr: 'OKC',
    sport: 'nba',
    position: 'SG',
    emoji: '⚡',
    stats: { avgPoints: 31.5, avgRebounds: 5.4, avgAssists: 6.2, gamesPlayed: 35 },
    props: [
      { type: 'Points', line: 30.5, overOdds: -110, underOdds: -110, overHitRate: 60, trend: 'up', edge: 3.8 },
      { type: 'PRA', line: 42.5, overOdds: -115, underOdds: -105, overHitRate: 58, trend: 'up' },
    ],
    isHot: true,
    isCold: false,
    aiRecommendation: 'OVER 30.5 Points - MVP candidate, top-3 scoring leader'
  },
  {
    id: 'jayson-tatum',
    name: 'Jayson Tatum',
    team: 'Boston Celtics',
    teamAbbr: 'BOS',
    sport: 'nba',
    position: 'SF',
    emoji: '☘️',
    stats: { avgPoints: 27.2, avgRebounds: 8.4, avgAssists: 4.8, gamesPlayed: 36 },
    props: [
      { type: 'Points', line: 26.5, overOdds: -108, underOdds: -112, overHitRate: 55, trend: 'stable' },
      { type: 'Rebounds', line: 7.5, overOdds: -105, underOdds: -115, overHitRate: 62, trend: 'up', edge: 2.4 },
    ],
    isHot: false,
    isCold: false,
  },
  {
    id: 'anthony-davis',
    name: 'Anthony Davis',
    team: 'Los Angeles Lakers',
    teamAbbr: 'LAL',
    sport: 'nba',
    position: 'PF',
    emoji: '💜',
    stats: { avgPoints: 25.8, avgRebounds: 12.2, avgAssists: 3.4, gamesPlayed: 30 },
    props: [
      { type: 'Rebounds', line: 11.5, overOdds: -105, underOdds: -115, overHitRate: 58, trend: 'up', edge: 2.1 },
      { type: 'Points', line: 25.5, overOdds: -110, underOdds: -110, overHitRate: 52, trend: 'down' },
    ],
    injury: { status: 'Questionable', description: 'Knee soreness' },
    isHot: false,
    isCold: false,
  },
  // NFL
  {
    id: 'josh-allen',
    name: 'Josh Allen',
    team: 'Buffalo Bills',
    teamAbbr: 'BUF',
    sport: 'nfl',
    position: 'QB',
    emoji: '🦬',
    stats: { avgPassYds: 284.5, avgRushYds: 42.3, gamesPlayed: 17 },
    props: [
      { type: 'Pass Yards', line: 275.5, overOdds: -115, underOdds: -105, overHitRate: 58, trend: 'up', edge: 3.5 },
      { type: 'Rush Yards', line: 38.5, overOdds: -110, underOdds: -110, overHitRate: 55, trend: 'stable' },
      { type: 'Pass TDs', line: 2.5, overOdds: +120, underOdds: -140, overHitRate: 48, trend: 'stable' },
    ],
    isHot: true,
    isCold: false,
    aiRecommendation: 'OVER 275.5 Pass Yards - Averaging 312 vs playoff teams this season'
  },
  {
    id: 'patrick-mahomes',
    name: 'Patrick Mahomes',
    team: 'Kansas City Chiefs',
    teamAbbr: 'KC',
    sport: 'nfl',
    position: 'QB',
    emoji: '🏈',
    stats: { avgPassYds: 265.2, avgRushYds: 28.4, gamesPlayed: 17 },
    props: [
      { type: 'Pass Yards', line: 260.5, overOdds: -110, underOdds: -110, overHitRate: 52, trend: 'down' },
      { type: 'Pass TDs', line: 1.5, overOdds: -180, underOdds: +150, overHitRate: 72, trend: 'stable' },
    ],
    isHot: false,
    isCold: true,
    aiRecommendation: 'UNDER 260.5 Pass Yards - Only averaging 238 on the road this year'
  },
  {
    id: 'jamarr-chase',
    name: "Ja'Marr Chase",
    team: 'Cincinnati Bengals',
    teamAbbr: 'CIN',
    sport: 'nfl',
    position: 'WR',
    emoji: '🐅',
    stats: { avgRecYds: 98.7, gamesPlayed: 17 },
    props: [
      { type: 'Rec Yards', line: 85.5, overOdds: -115, underOdds: -105, overHitRate: 64, trend: 'up', edge: 5.2 },
      { type: 'Receptions', line: 6.5, overOdds: -120, underOdds: +100, overHitRate: 58, trend: 'up' },
    ],
    isHot: true,
    isCold: false,
    aiRecommendation: 'OVER 85.5 Rec Yards - Triple Crown winner, averaging 105+ in last 8 games'
  },
  {
    id: 'derrick-henry',
    name: 'Derrick Henry',
    team: 'Baltimore Ravens',
    teamAbbr: 'BAL',
    sport: 'nfl',
    position: 'RB',
    emoji: '🦜',
    stats: { avgRushYds: 112.4, gamesPlayed: 17 },
    props: [
      { type: 'Rush Yards', line: 95.5, overOdds: -120, underOdds: +100, overHitRate: 68, trend: 'up', edge: 6.1 },
      { type: 'Rush TDs', line: 0.5, overOdds: -200, underOdds: +170, overHitRate: 76, trend: 'up' },
    ],
    isHot: true,
    isCold: false,
    aiRecommendation: 'OVER 95.5 Rush Yards - Led NFL in rushing, dominates in January'
  },
  // NHL
  {
    id: 'connor-mcdavid',
    name: 'Connor McDavid',
    team: 'Edmonton Oilers',
    teamAbbr: 'EDM',
    sport: 'nhl',
    position: 'C',
    emoji: '🏒',
    stats: { avgGoals: 0.68, avgShots: 4.2, gamesPlayed: 42 },
    props: [
      { type: 'Points', line: 1.5, overOdds: +100, underOdds: -120, overHitRate: 52, trend: 'up' },
      { type: 'SOG', line: 3.5, overOdds: -125, underOdds: +105, overHitRate: 62, trend: 'up', edge: 2.8 },
    ],
    isHot: true,
    isCold: false,
    aiRecommendation: 'OVER 3.5 SOG - Averaging 4.8 shots per game in last 10'
  },
  {
    id: 'auston-matthews',
    name: 'Auston Matthews',
    team: 'Toronto Maple Leafs',
    teamAbbr: 'TOR',
    sport: 'nhl',
    position: 'C',
    emoji: '🍁',
    stats: { avgGoals: 0.62, avgShots: 4.5, gamesPlayed: 38 },
    props: [
      { type: 'SOG', line: 4.5, overOdds: -105, underOdds: -115, overHitRate: 50, trend: 'stable' },
      { type: 'Points', line: 0.5, overOdds: -250, underOdds: +200, overHitRate: 72, trend: 'stable' },
    ],
    injury: { status: 'Probable', description: 'Upper body' },
    isHot: false,
    isCold: false,
  },
  // MLB
  {
    id: 'shohei-ohtani',
    name: 'Shohei Ohtani',
    team: 'Los Angeles Dodgers',
    teamAbbr: 'LAD',
    sport: 'mlb',
    position: 'DH',
    emoji: '⚾',
    stats: { avgPoints: 1.2, gamesPlayed: 159 },
    props: [
      { type: 'Total Bases', line: 1.5, overOdds: -135, underOdds: +115, overHitRate: 58, trend: 'up', edge: 3.2 },
      { type: 'Hits + Runs + RBI', line: 2.5, overOdds: +100, underOdds: -120, overHitRate: 52, trend: 'stable' },
    ],
    isHot: true,
    isCold: false,
    aiRecommendation: 'OVER 1.5 Total Bases - 50/50 club member, elite power numbers'
  },
  {
    id: 'aaron-judge',
    name: 'Aaron Judge',
    team: 'New York Yankees',
    teamAbbr: 'NYY',
    sport: 'mlb',
    position: 'RF',
    emoji: '⚾',
    stats: { avgPoints: 1.1, gamesPlayed: 158 },
    props: [
      { type: 'Total Bases', line: 1.5, overOdds: -125, underOdds: +105, overHitRate: 55, trend: 'stable' },
      { type: 'HR', line: 0.5, overOdds: +180, underOdds: -220, overHitRate: 32, trend: 'stable' },
    ],
    isHot: false,
    isCold: false,
  },
]

export default function PlayersPage() {
  const [sport, setSport] = useState<Sport>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [propType, setPropType] = useState<PropType>('all')
  const [showHotOnly, setShowHotOnly] = useState(false)
  const [showEdgeOnly, setShowEdgeOnly] = useState(false)

  const filteredPlayers = useMemo(() => {
    let players = [...mockPlayers]
    
    // Sport filter
    if (sport !== 'all') {
      players = players.filter(p => p.sport === sport)
    }
    
    // Search filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      players = players.filter(p => 
        p.name.toLowerCase().includes(q) ||
        p.team.toLowerCase().includes(q) ||
        p.teamAbbr.toLowerCase().includes(q)
      )
    }
    
    // Hot only filter
    if (showHotOnly) {
      players = players.filter(p => p.isHot)
    }
    
    // Edge only filter
    if (showEdgeOnly) {
      players = players.filter(p => p.props.some(prop => prop.edge && prop.edge > 2))
    }
    
    return players
  }, [sport, searchQuery, showHotOnly, showEdgeOnly])

  const hotPlayers = mockPlayers.filter(p => p.isHot).slice(0, 5)
  const coldPlayers = mockPlayers.filter(p => p.isCold).slice(0, 5)
  const topEdgePlays = mockPlayers
    .flatMap(p => p.props.filter(prop => prop.edge).map(prop => ({ player: p, prop })))
    .sort((a, b) => (b.prop.edge || 0) - (a.prop.edge || 0))
    .slice(0, 5)

  return (
    <main className="min-h-screen" style={{ background: '#06060c' }}>
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Users style={{ color: '#FF6B00', width: '32px', height: '32px' }} />
            <h1 className="text-3xl font-bold" style={{ color: '#FFF' }}>Player Props & Analytics</h1>
          </div>
          <p style={{ color: '#808090' }}>
            AI-powered player prop analysis • Hit rates • Edge detection • All 4 major sports
          </p>
        </div>

        {/* Filters Bar */}
        <div className="rounded-xl p-4 mb-6" style={{ background: '#0c0c14', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex flex-wrap items-center gap-4">
            {/* Sport Filter */}
            <div className="flex gap-1">
              {[
                { id: 'all', label: 'All', icon: '🌐' },
                { id: 'nfl', label: 'NFL', icon: '🏈' },
                { id: 'nba', label: 'NBA', icon: '🏀' },
                { id: 'nhl', label: 'NHL', icon: '🏒' },
                { id: 'mlb', label: 'MLB', icon: '⚾' },
              ].map(s => (
                <button
                  key={s.id}
                  onClick={() => setSport(s.id as Sport)}
                  className="px-3 py-2 rounded-lg text-sm font-semibold transition-all"
                  style={{
                    background: sport === s.id ? '#FF6B00' : 'rgba(255,255,255,0.05)',
                    color: sport === s.id ? '#FFF' : '#808090',
                  }}
                >
                  {s.icon} {s.label}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="flex-1 max-w-xs relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#606070' }} />
              <input
                type="text"
                placeholder="Search players..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg text-sm"
                style={{ 
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#FFF'
                }}
              />
            </div>

            {/* Quick Filters */}
            <div className="flex gap-2">
              <button
                onClick={() => setShowHotOnly(!showHotOnly)}
                className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-semibold transition-all"
                style={{
                  background: showHotOnly ? 'rgba(255,107,0,0.2)' : 'rgba(255,255,255,0.05)',
                  color: showHotOnly ? '#FF6B00' : '#808090',
                  border: showHotOnly ? '1px solid rgba(255,107,0,0.3)' : '1px solid transparent'
                }}
              >
                <Flame style={{ width: '14px', height: '14px' }} /> Hot
              </button>
              <button
                onClick={() => setShowEdgeOnly(!showEdgeOnly)}
                className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-semibold transition-all"
                style={{
                  background: showEdgeOnly ? 'rgba(0,255,136,0.2)' : 'rgba(255,255,255,0.05)',
                  color: showEdgeOnly ? '#00FF88' : '#808090',
                  border: showEdgeOnly ? '1px solid rgba(0,255,136,0.3)' : '1px solid transparent'
                }}
              >
                <Zap style={{ width: '14px', height: '14px' }} /> Edge
              </button>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-4">
            {filteredPlayers.map(player => (
              <div key={player.id} className="rounded-xl p-5" 
                   style={{ 
                     background: '#0c0c14', 
                     border: player.isHot ? '1px solid rgba(255,107,0,0.3)' : '1px solid rgba(255,255,255,0.06)'
                   }}>
                {/* Player Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{player.emoji}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold" style={{ color: '#FFF' }}>{player.name}</h3>
                        {player.isHot && <Flame style={{ color: '#FF6B00', width: '16px', height: '16px' }} />}
                        {player.isCold && <Snowflake style={{ color: '#00A8FF', width: '16px', height: '16px' }} />}
                      </div>
                      <p className="text-sm" style={{ color: '#808090' }}>
                        {player.teamAbbr} • {player.position} • {player.sport.toUpperCase()}
                      </p>
                    </div>
                  </div>
                  {player.injury && (
                    <span className="flex items-center gap-1 px-2 py-1 rounded text-xs font-bold"
                          style={{ 
                            background: player.injury.status === 'Out' ? 'rgba(255,68,85,0.2)' : 'rgba(255,170,0,0.2)',
                            color: player.injury.status === 'Out' ? '#FF4455' : '#FFAA00'
                          }}>
                      <AlertTriangle style={{ width: '12px', height: '12px' }} />
                      {player.injury.status}
                    </span>
                  )}
                </div>

                {/* Props Grid */}
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
                  {player.props.map((prop, idx) => (
                    <div key={idx} className="p-3 rounded-lg" 
                         style={{ background: prop.edge ? 'rgba(0,255,136,0.1)' : 'rgba(255,255,255,0.03)' }}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold" style={{ color: '#808090' }}>{prop.type}</span>
                        {prop.edge && (
                          <span className="text-xs font-bold px-1.5 py-0.5 rounded"
                                style={{ background: 'rgba(0,255,136,0.2)', color: '#00FF88' }}>
                            +{prop.edge}% edge
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xl font-bold" style={{ color: '#FFF' }}>{prop.line}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs" style={{ color: prop.overOdds < -105 ? '#00FF88' : '#808090' }}>
                            O {prop.overOdds > 0 ? '+' : ''}{prop.overOdds}
                          </span>
                          <span className="text-xs" style={{ color: '#606070' }}>|</span>
                          <span className="text-xs" style={{ color: prop.underOdds < -105 ? '#00FF88' : '#808090' }}>
                            U {prop.underOdds > 0 ? '+' : ''}{prop.underOdds}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs" style={{ color: prop.overHitRate > 55 ? '#00FF88' : '#808090' }}>
                          {prop.overHitRate}% over hit rate
                        </span>
                        {prop.trend === 'up' ? (
                          <TrendingUp style={{ color: '#00FF88', width: '14px', height: '14px' }} />
                        ) : prop.trend === 'down' ? (
                          <TrendingDown style={{ color: '#FF4455', width: '14px', height: '14px' }} />
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>

                {/* AI Recommendation */}
                {player.aiRecommendation && (
                  <div className="flex items-start gap-2 p-3 rounded-lg"
                       style={{ background: 'rgba(255,107,0,0.1)', border: '1px solid rgba(255,107,0,0.2)' }}>
                    <Zap style={{ color: '#FF6B00', width: '16px', height: '16px', marginTop: '2px', flexShrink: 0 }} />
                    <p className="text-sm" style={{ color: '#FFF' }}>{player.aiRecommendation}</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Top Edge Plays */}
            <div className="rounded-xl p-5" style={{ background: '#0c0c14', border: '1px solid rgba(0,255,136,0.3)' }}>
              <h3 className="flex items-center gap-2 text-lg font-bold mb-4" style={{ color: '#FFF' }}>
                <Zap style={{ color: '#00FF88', width: '18px', height: '18px' }} />
                Top Edge Plays
              </h3>
              <div className="space-y-3">
                {topEdgePlays.map(({ player, prop }, i) => (
                  <div key={i} className="p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)' }}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-bold" style={{ color: '#FFF' }}>{player.name}</span>
                      <span className="text-xs font-bold px-2 py-0.5 rounded"
                            style={{ background: 'rgba(0,255,136,0.2)', color: '#00FF88' }}>
                        +{prop.edge}%
                      </span>
                    </div>
                    <p className="text-xs" style={{ color: '#808090' }}>
                      {prop.type} O/U {prop.line} • {prop.overHitRate}% hit rate
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Hot Players */}
            <div className="rounded-xl p-5" style={{ background: '#0c0c14', border: '1px solid rgba(255,107,0,0.3)' }}>
              <h3 className="flex items-center gap-2 text-lg font-bold mb-4" style={{ color: '#FFF' }}>
                <Flame style={{ color: '#FF6B00', width: '18px', height: '18px' }} />
                Hot Players
              </h3>
              <div className="space-y-2">
                {hotPlayers.map(player => (
                  <div key={player.id} className="flex items-center justify-between p-2 rounded-lg"
                       style={{ background: 'rgba(255,255,255,0.03)' }}>
                    <div className="flex items-center gap-2">
                      <span>{player.emoji}</span>
                      <span className="text-sm font-semibold" style={{ color: '#FFF' }}>{player.name}</span>
                    </div>
                    <span className="text-xs" style={{ color: '#808090' }}>{player.sport.toUpperCase()}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Cold Players to Fade */}
            <div className="rounded-xl p-5" style={{ background: '#0c0c14', border: '1px solid rgba(0,168,255,0.3)' }}>
              <h3 className="flex items-center gap-2 text-lg font-bold mb-4" style={{ color: '#FFF' }}>
                <Snowflake style={{ color: '#00A8FF', width: '18px', height: '18px' }} />
                Fade Alert
              </h3>
              <div className="space-y-2">
                {coldPlayers.length > 0 ? coldPlayers.map(player => (
                  <div key={player.id} className="flex items-center justify-between p-2 rounded-lg"
                       style={{ background: 'rgba(255,255,255,0.03)' }}>
                    <div className="flex items-center gap-2">
                      <span>{player.emoji}</span>
                      <span className="text-sm font-semibold" style={{ color: '#FFF' }}>{player.name}</span>
                    </div>
                    <span className="text-xs" style={{ color: '#FF4455' }}>Cold streak</span>
                  </div>
                )) : (
                  <p className="text-sm" style={{ color: '#808090' }}>No cold players currently</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
