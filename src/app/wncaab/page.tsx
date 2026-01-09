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
} from 'lucide-react'

type BetType = 'ats' | 'ou' | 'ml'
type Situation = 'all' | 'home' | 'away' | 'favorite' | 'underdog'

// Top 25 with betting data
interface RankedTeam {
  rank: number
  team: string
  record: string
  conf: string
  change: number
  ats: { wins: number; losses: number }
  ou: { overs: number; unders: number }
  isHot: boolean
  isCold: boolean
  trends: string[]
  streak: string
}

const top25: RankedTeam[] = [
  { rank: 1, team: 'South Carolina', record: '28-0', conf: 'SEC', change: 0, ats: { wins: 18, losses: 9 }, ou: { overs: 12, unders: 15 }, isHot: true, isCold: false, trends: ['USC 7-3 ATS last 10', 'UNDER in 60% of games'], streak: 'W28' },
  { rank: 2, team: 'USC', record: '25-3', conf: 'Big Ten', change: 1, ats: { wins: 17, losses: 10 }, ou: { overs: 16, unders: 11 }, isHot: true, isCold: false, trends: ['JuJu Watkins 27+ PPG', 'USC 6-4 ATS last 10'], streak: 'W5' },
  { rank: 3, team: 'UCLA', record: '24-4', conf: 'Big Ten', change: -1, ats: { wins: 16, losses: 11 }, ou: { overs: 14, unders: 13 }, isHot: false, isCold: false, trends: ['UCLA balanced ATS', 'OVER in last 4'], streak: 'W3' },
  { rank: 4, team: 'Texas', record: '24-3', conf: 'SEC', change: 0, ats: { wins: 17, losses: 9 }, ou: { overs: 11, unders: 15 }, isHot: false, isCold: false, trends: ['UNDER 58% of games', 'Texas 6-4 ATS L10'], streak: 'W2' },
  { rank: 5, team: 'Notre Dame', record: '23-4', conf: 'ACC', change: 2, ats: { wins: 18, losses: 8 }, ou: { overs: 17, unders: 9 }, isHot: true, isCold: false, trends: ['Best ATS team: 69%', 'Hidalgo averages 24 PPG'], streak: 'W6' },
  { rank: 6, team: 'UConn', record: '22-5', conf: 'Big East', change: -1, ats: { wins: 15, losses: 11 }, ou: { overs: 13, unders: 13 }, isHot: false, isCold: false, trends: ['Bueckers back healthy', 'UConn 5-5 ATS L10'], streak: 'L1' },
  { rank: 7, team: 'LSU', record: '23-4', conf: 'SEC', change: 1, ats: { wins: 14, losses: 12 }, ou: { overs: 18, unders: 8 }, isHot: false, isCold: false, trends: ['Best OVER team: 69%', 'High-scoring games'], streak: 'W4' },
  { rank: 8, team: 'Oklahoma', record: '22-4', conf: 'SEC', change: 0, ats: { wins: 16, losses: 9 }, ou: { overs: 12, unders: 13 }, isHot: false, isCold: false, trends: ['OU 6-4 ATS L10', 'Balanced O/U'], streak: 'W2' },
  { rank: 9, team: 'Maryland', record: '22-5', conf: 'Big Ten', change: 3, ats: { wins: 17, losses: 9 }, ou: { overs: 14, unders: 12 }, isHot: true, isCold: false, trends: ['Hot 8-2 ATS L10', 'Rising team'], streak: 'W7' },
  { rank: 10, team: 'NC State', record: '21-5', conf: 'ACC', change: -2, ats: { wins: 13, losses: 12 }, ou: { overs: 11, unders: 14 }, isHot: false, isCold: true, trends: ['Cold 3-7 ATS L10', 'UNDER trend'], streak: 'L2' },
  { rank: 11, team: 'Duke', record: '21-6', conf: 'ACC', change: 0, ats: { wins: 15, losses: 11 }, ou: { overs: 13, unders: 13 }, isHot: false, isCold: false, trends: ['Duke balanced', '5-5 ATS L10'], streak: 'W1' },
  { rank: 12, team: 'Ohio State', record: '20-5', conf: 'Big Ten', change: 2, ats: { wins: 14, losses: 10 }, ou: { overs: 12, unders: 12 }, isHot: false, isCold: false, trends: ['OSU 6-4 ATS L10', 'Consistent'], streak: 'W3' },
]

// Conference Standings
const conferences = [
  { name: 'SEC', rank: 1, record: '89-21', tourney: '4', color: '#FF6B00', atsWin: 55 },
  { name: 'Big Ten', rank: 2, record: '82-28', tourney: '5', color: '#00A8FF', atsWin: 52 },
  { name: 'Big 12', rank: 3, record: '76-34', tourney: '3', color: '#00FF88', atsWin: 48 },
  { name: 'ACC', rank: 4, record: '71-39', tourney: '3', color: '#FFD700', atsWin: 51 },
  { name: 'Big East', rank: 5, record: '65-45', tourney: '2', color: '#FF3366', atsWin: 47 },
]

// Player of Year Watch
const poyWatch = [
  { name: 'JuJu Watkins', team: 'USC', pos: 'G', ppg: 27.1, rpg: 4.3, apg: 3.8, odds: '-200' },
  { name: 'Paige Bueckers', team: 'UConn', pos: 'G', ppg: 21.8, rpg: 5.2, apg: 5.4, odds: '+300' },
  { name: 'Hannah Hidalgo', team: 'Notre Dame', pos: 'G', ppg: 24.2, rpg: 5.8, apg: 5.1, odds: '+400' },
  { name: 'Raven Johnson', team: 'S. Carolina', pos: 'G', ppg: 12.4, rpg: 5.5, apg: 8.1, odds: '+800' },
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

export default function WNCAABPage() {
  const [betType, setBetType] = useState<BetType>('ats')
  const [situation, setSituation] = useState<Situation>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTeam, setSelectedTeam] = useState<RankedTeam | null>(null)
  const [activeView, setActiveView] = useState<'rankings' | 'games' | 'players'>('rankings')
  
  const filteredTeams = useMemo(() => {
    if (!searchQuery) return top25
    const q = searchQuery.toLowerCase()
    return top25.filter(t => 
      t.team.toLowerCase().includes(q) || 
      t.conf.toLowerCase().includes(q)
    )
  }, [searchQuery])
  
  const hotTeams = top25.filter(t => t.isHot)
  const coldTeams = top25.filter(t => t.isCold)
  
  const bestATS = [...top25].sort((a, b) => 
    calcWinPct(b.ats.wins, b.ats.losses) - calcWinPct(a.ats.wins, a.ats.losses)
  )[0]
  
  const bestOver = [...top25].sort((a, b) => 
    calcOverPct(b.ou.overs, b.ou.unders) - calcOverPct(a.ou.overs, a.ou.unders)
  )[0]
  
  return (
    <div className="min-h-screen" style={{ background: '#050508' }}>
      {/* Hero Section */}
      <section className="relative overflow-hidden" style={{ background: 'linear-gradient(180deg, #0a0a12 0%, #050508 100%)' }}>
        <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full opacity-20 blur-3xl pointer-events-none" 
             style={{ background: 'radial-gradient(circle, #FF3366 0%, transparent 70%)' }} />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center gap-4 mb-6">
            <span className="text-5xl">🏀</span>
            <div>
              <h1 className="text-4xl font-black" style={{ color: '#FFF' }}>WNCAAB Analytics</h1>
              <p className="text-lg" style={{ color: '#808090' }}>NCAA 2025-26 Season • March Madness Ahead</p>
            </div>
          </div>
          
          {/* View Toggle */}
          <div className="flex gap-2 mb-6">
            {(['rankings', 'games', 'players'] as const).map(view => (
              <button
                key={view}
                onClick={() => setActiveView(view)}
                className="px-4 py-2 rounded-xl font-semibold text-sm transition-all capitalize"
                style={{
                  background: activeView === view ? '#FF3366' : 'rgba(255,255,255,0.05)',
                  color: activeView === view ? '#FFF' : '#808090',
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
              <div className="text-lg font-black" style={{ color: '#00FF88' }}>{bestATS?.team?.split(' ').pop()}</div>
            </div>
            <div className="p-4 rounded-xl" style={{ background: 'rgba(255,215,0,0.1)', border: '1px solid rgba(255,215,0,0.2)' }}>
              <div className="flex items-center gap-2 mb-1">
                <Activity className="w-4 h-4" style={{ color: '#FFD700' }} />
                <span className="text-xs uppercase" style={{ color: '#808090' }}>Best OVER</span>
              </div>
              <div className="text-lg font-black" style={{ color: '#FFD700' }}>{bestOver?.team?.split(' ').pop()}</div>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeView === 'rankings' && (
          <>
            {/* Filters */}
            <div className="mb-6 flex flex-wrap gap-4">
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
              
              <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)' }}>
                {(['ats', 'ou', 'ml'] as BetType[]).map(type => (
                  <button
                    key={type}
                    onClick={() => setBetType(type)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold uppercase transition-all"
                    style={{
                      background: betType === type ? '#FF3366' : 'transparent',
                      color: betType === type ? '#FFF' : '#808090',
                    }}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Rankings Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTeams.map(team => {
                const atsPct = calcWinPct(team.ats.wins, team.ats.losses)
                const ouPct = calcOverPct(team.ou.overs, team.ou.unders)
                
                return (
                  <div
                    key={team.team}
                    className="p-4 rounded-2xl cursor-pointer transition-all hover:scale-[1.02]"
                    style={{ 
                      background: '#0c0c14', 
                      border: team.isHot ? '2px solid #FF6B00' : team.isCold ? '2px solid #00A8FF' : '1px solid rgba(255,255,255,0.06)' 
                    }}
                    onClick={() => setSelectedTeam(selectedTeam?.team === team.team ? null : team)}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-black"
                             style={{ background: team.rank <= 4 ? 'rgba(255,215,0,0.2)' : 'rgba(255,255,255,0.1)', 
                                      color: team.rank <= 4 ? '#FFD700' : '#FFF' }}>
                          {team.rank}
                        </div>
                        <div>
                          <div className="font-bold text-white">{team.team}</div>
                          <div className="text-xs" style={{ color: '#808090' }}>
                            {team.record} • {team.conf}
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
                    
                    {selectedTeam?.team === team.team && (
                      <div className="pt-3 mt-3 space-y-2" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                        <div className="text-xs font-semibold mb-2" style={{ color: '#808090' }}>KEY TRENDS</div>
                        {team.trends.map((trend, i) => (
                          <div key={i} className="text-xs py-1" style={{ color: '#A0A0B0' }}>• {trend}</div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
            
            {/* Conference Rankings */}
            <div className="mt-8 rounded-2xl overflow-hidden" style={{ background: '#0c0c14', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="p-4 border-b flex items-center gap-2" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                <BarChart3 className="w-5 h-5 text-blue-500" />
                <h2 className="font-bold text-lg text-white">Conference Power Rankings</h2>
              </div>
              <div className="p-4 grid md:grid-cols-5 gap-3">
                {conferences.map(conf => (
                  <div key={conf.name} className="p-3 rounded-xl text-center" style={{ background: 'rgba(255,255,255,0.03)' }}>
                    <div className="font-bold text-lg" style={{ color: conf.color }}>{conf.name}</div>
                    <div className="text-xs" style={{ color: '#808090' }}>{conf.record}</div>
                    <div className="text-sm font-bold mt-1" style={{ color: '#00FF88' }}>{conf.atsWin}% ATS</div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {activeView === 'games' && (
          <div className="rounded-2xl p-5" style={{ background: '#0c0c14', border: '1px solid rgba(255,255,255,0.06)' }}>
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-red-500" />
              Today&apos;s WNCAAB Games
            </h3>
            <p className="text-center py-8" style={{ color: '#808090' }}>
              Check the <Link href="/scores?sport=wncaab" className="text-blue-400 hover:underline">Scores page</Link> for live WNCAAB games and schedules.
            </p>
          </div>
        )}

        {activeView === 'players' && (
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Player of Year */}
            <div className="rounded-2xl p-5" style={{ background: '#0c0c14', border: '1px solid rgba(255,255,255,0.06)' }}>
              <h3 className="flex items-center gap-2 text-lg font-bold mb-4 text-white">
                <Trophy className="w-5 h-5" style={{ color: '#FFD700' }} />
                Player of Year Race
              </h3>
              <div className="space-y-3">
                {poyWatch.map((player, i) => (
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

            {/* Rising Stars */}
            <div className="rounded-2xl p-5" style={{ background: '#0c0c14', border: '1px solid rgba(255,255,255,0.06)' }}>
              <h3 className="flex items-center gap-2 text-lg font-bold mb-4 text-white">
                <Star className="w-5 h-5" style={{ color: '#FF3366' }} />
                Top Performers
              </h3>
              <div className="space-y-3">
                {poyWatch.map((player) => (
                  <div key={player.name} className="p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)' }}>
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <div className="font-bold text-white">{player.name}</div>
                        <div className="text-xs" style={{ color: '#808090' }}>{player.team}</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div>
                        <div className="text-sm font-bold" style={{ color: '#00FF88' }}>{player.ppg}</div>
                        <div className="text-[10px]" style={{ color: '#606070' }}>PPG</div>
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white">{player.rpg}</div>
                        <div className="text-[10px]" style={{ color: '#606070' }}>RPG</div>
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white">{player.apg}</div>
                        <div className="text-[10px]" style={{ color: '#606070' }}>APG</div>
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
