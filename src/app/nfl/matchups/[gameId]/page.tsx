'use client'

import { useState } from 'react'
import Link from 'next/link'
import { 
  ArrowLeft, Clock, MapPin, Tv, TrendingUp, TrendingDown, 
  Target, BarChart3, Users, Activity, Cloud, DollarSign,
  ChevronRight, Star, AlertTriangle, Flame
} from 'lucide-react'

// =============================================================================
// TYPES
// =============================================================================

interface TeamMatchupData {
  abbr: string
  name: string
  city: string
  record: string
  atsRecord: string
  ouRecord: string
  lastGames: ('W' | 'L')[]
  pointsPerGame: number
  pointsAllowed: number
  injuries: { player: string; status: string; impact: number }[]
  keyStats: { label: string; value: string | number; rank: number }[]
}

interface OddsLine {
  book: string
  spread: string
  spreadOdds: string
  total: string
  overOdds: string
  underOdds: string
  mlHome: string
  mlAway: string
}

interface BettingTrend {
  text: string
  result: string
  edge: number
}

// =============================================================================
// MOCK DATA
// =============================================================================

const gameData = {
  sport: 'NFL',
  date: 'Sunday, January 5, 2026 · 4:25 PM ET',
  venue: 'AT&T Stadium, Arlington, TX',
  broadcast: 'CBS',
  weather: { temp: 72, condition: 'Dome', wind: 'N/A' },
  week: 'Week 18',
  
  awayTeam: {
    abbr: 'PHI',
    name: 'Eagles',
    city: 'Philadelphia',
    record: '13-3',
    atsRecord: '10-6',
    ouRecord: '8-8',
    lastGames: ['W', 'W', 'W', 'W', 'L'] as ('W' | 'L')[],
    pointsPerGame: 28.5,
    pointsAllowed: 18.2,
    injuries: [
      { player: 'A.J. Brown', status: 'Questionable', impact: 4 },
      { player: 'Lane Johnson', status: 'Probable', impact: 2 },
    ],
    keyStats: [
      { label: 'Total Offense', value: '392.5 YPG', rank: 2 },
      { label: 'Rush Offense', value: '187.2 YPG', rank: 1 },
      { label: 'Pass Defense', value: '198.5 YPG', rank: 5 },
      { label: 'Red Zone %', value: '68.2%', rank: 3 },
      { label: 'Turnover Diff', value: '+12', rank: 4 },
    ]
  } as TeamMatchupData,
  
  homeTeam: {
    abbr: 'DAL',
    name: 'Cowboys',
    city: 'Dallas',
    record: '7-9',
    atsRecord: '6-10',
    ouRecord: '9-7',
    lastGames: ['L', 'W', 'L', 'L', 'W'] as ('W' | 'L')[],
    pointsPerGame: 22.8,
    pointsAllowed: 25.4,
    injuries: [
      { player: 'Micah Parsons', status: 'Out', impact: 5 },
      { player: 'Dak Prescott', status: 'Probable', impact: 3 },
    ],
    keyStats: [
      { label: 'Total Offense', value: '358.2 YPG', rank: 8 },
      { label: 'Pass Offense', value: '268.5 YPG', rank: 4 },
      { label: 'Rush Defense', value: '142.8 YPG', rank: 25 },
      { label: 'Red Zone %', value: '58.5%', rank: 15 },
      { label: 'Turnover Diff', value: '-5', rank: 22 },
    ]
  } as TeamMatchupData,
  
  odds: [
    { book: 'DraftKings', spread: 'PHI -7', spreadOdds: '-110', total: '48.5', overOdds: '-110', underOdds: '-110', mlHome: '+265', mlAway: '-320' },
    { book: 'FanDuel', spread: 'PHI -7', spreadOdds: '-108', total: '48', overOdds: '-110', underOdds: '-110', mlHome: '+270', mlAway: '-330' },
    { book: 'BetMGM', spread: 'PHI -6.5', spreadOdds: '-115', total: '48.5', overOdds: '-105', underOdds: '-115', mlHome: '+260', mlAway: '-315' },
    { book: 'Caesars', spread: 'PHI -7', spreadOdds: '-110', total: '48', overOdds: '-108', underOdds: '-112', mlHome: '+275', mlAway: '-340' },
    { book: 'ESPN Bet', spread: 'PHI -6.5', spreadOdds: '-110', total: '48.5', overOdds: '-110', underOdds: '-110', mlHome: '+265', mlAway: '-325' },
  ] as OddsLine[],
  
  publicBetting: {
    spreadHome: 35,
    spreadAway: 65,
    overPct: 58,
    underPct: 42,
    mlHome: 28,
    mlAway: 72,
  },
  
  trends: [
    { text: 'PHI is 7-1 ATS in last 8 road games', result: '87.5%', edge: 4.2 },
    { text: 'PHI is 9-3 ATS as road favorite', result: '75%', edge: 3.5 },
    { text: 'DAL is 2-6 ATS in last 8 home games', result: '25%', edge: -3.8 },
    { text: 'Under is 7-2 in last 9 PHI games', result: '77.8%', edge: 3.2 },
    { text: 'PHI has covered 6 straight vs NFC East', result: '100%', edge: 5.1 },
  ] as BettingTrend[],
  
  h2h: {
    allTime: 'PHI leads 72-55',
    last5: 'PHI 4-1',
    atVenue: 'PHI 3-2',
    avgPointsFor: 26.4,
    avgPointsAgainst: 22.8,
  }
}

// =============================================================================
// COMPONENT
// =============================================================================

export default function GameMatchupPage() {
  const [oddsView, setOddsView] = useState<'spread' | 'total' | 'ml'>('spread')
  const game = gameData

  return (
    <div className="min-h-screen bg-[#050508]">
      {/* Header */}
      <div className="border-b border-white/5 bg-[#0a0a12]">
        <div className="max-w-[1600px] mx-auto px-4 py-4">
          <Link href="/nfl/matchups" className="inline-flex items-center gap-2 text-gray-400 hover:text-white text-sm mb-4 transition-all">
            <ArrowLeft className="w-4 h-4" /> Back to Matchups
          </Link>
          
          {/* Game Info Bar */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400 mb-6">
            <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {game.date}</span>
            <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {game.venue}</span>
            <span className="flex items-center gap-1"><Tv className="w-4 h-4" /> {game.broadcast}</span>
            <span className="flex items-center gap-1"><Cloud className="w-4 h-4" /> {game.weather.temp}°F, {game.weather.condition}</span>
            <span className="px-2 py-1 rounded bg-orange-500/20 text-orange-500 font-bold">{game.week}</span>
          </div>
          
          {/* Matchup Header */}
          <div className="flex items-center justify-between">
            {/* Away Team */}
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-2xl bg-[#004C54] flex items-center justify-center text-4xl">🦅</div>
              <div>
                <div className="text-2xl font-black text-white">{game.awayTeam.city}</div>
                <div className="text-xl text-gray-400">{game.awayTeam.name}</div>
                <div className="text-sm text-gray-500">{game.awayTeam.record} · ATS: {game.awayTeam.atsRecord}</div>
              </div>
            </div>
            
            {/* VS / Spread */}
            <div className="text-center px-8">
              <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Spread</div>
              <div className="text-3xl font-black text-orange-500">-7</div>
              <div className="text-sm text-gray-400 mt-1">O/U 48.5</div>
            </div>
            
            {/* Home Team */}
            <div className="flex items-center gap-4">
              <div>
                <div className="text-2xl font-black text-white text-right">{game.homeTeam.city}</div>
                <div className="text-xl text-gray-400 text-right">{game.homeTeam.name}</div>
                <div className="text-sm text-gray-500 text-right">{game.homeTeam.record} · ATS: {game.homeTeam.atsRecord}</div>
              </div>
              <div className="w-20 h-20 rounded-2xl bg-[#003594] flex items-center justify-center text-4xl">⭐</div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="max-w-[1600px] mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Odds Comparison */}
            <div className="rounded-xl bg-[#0c0c14] border border-white/10 overflow-hidden">
              <div className="p-4 border-b border-white/10 flex items-center justify-between">
                <h2 className="font-bold text-white flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-green-500" />
                  Live Odds Comparison
                </h2>
                <div className="flex rounded-lg overflow-hidden bg-white/5">
                  {(['spread', 'total', 'ml'] as const).map((view) => (
                    <button
                      key={view}
                      onClick={() => setOddsView(view)}
                      className={`px-4 py-1.5 text-xs font-bold uppercase ${
                        oddsView === view ? 'bg-orange-500 text-white' : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      {view === 'ml' ? 'Moneyline' : view === 'total' ? 'Total' : 'Spread'}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-xs text-gray-500 uppercase tracking-wider">
                      <th className="px-4 py-3 text-left">Sportsbook</th>
                      {oddsView === 'spread' && (
                        <>
                          <th className="px-4 py-3 text-center">{game.awayTeam.abbr}</th>
                          <th className="px-4 py-3 text-center">{game.homeTeam.abbr}</th>
                        </>
                      )}
                      {oddsView === 'total' && (
                        <>
                          <th className="px-4 py-3 text-center">Total</th>
                          <th className="px-4 py-3 text-center">Over</th>
                          <th className="px-4 py-3 text-center">Under</th>
                        </>
                      )}
                      {oddsView === 'ml' && (
                        <>
                          <th className="px-4 py-3 text-center">{game.awayTeam.abbr}</th>
                          <th className="px-4 py-3 text-center">{game.homeTeam.abbr}</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {game.odds.map((line, i) => (
                      <tr key={line.book} className={`hover:bg-white/[0.02] ${i === 0 ? 'bg-green-500/5' : ''}`}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-white">{line.book}</span>
                            {i === 0 && <span className="text-xs px-1.5 py-0.5 rounded bg-green-500/20 text-green-400">Best</span>}
                          </div>
                        </td>
                        {oddsView === 'spread' && (
                          <>
                            <td className="px-4 py-3 text-center">
                              <span className="font-mono font-bold text-white">{line.spread}</span>
                              <span className="text-gray-500 ml-1">{line.spreadOdds}</span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className="font-mono font-bold text-white">{line.spread.replace('-', '+').replace('PHI', 'DAL')}</span>
                              <span className="text-gray-500 ml-1">-110</span>
                            </td>
                          </>
                        )}
                        {oddsView === 'total' && (
                          <>
                            <td className="px-4 py-3 text-center font-mono font-bold text-white">{line.total}</td>
                            <td className="px-4 py-3 text-center text-gray-300">{line.overOdds}</td>
                            <td className="px-4 py-3 text-center text-gray-300">{line.underOdds}</td>
                          </>
                        )}
                        {oddsView === 'ml' && (
                          <>
                            <td className="px-4 py-3 text-center font-mono font-bold text-green-400">{line.mlAway}</td>
                            <td className="px-4 py-3 text-center font-mono font-bold text-red-400">{line.mlHome}</td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            
            {/* Team Comparison */}
            <div className="rounded-xl bg-[#0c0c14] border border-white/10 overflow-hidden">
              <div className="p-4 border-b border-white/10">
                <h2 className="font-bold text-white flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-blue-500" />
                  Team Comparison
                </h2>
              </div>
              
              <div className="p-4">
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="text-center">
                    <div className="text-2xl font-black text-white">{game.awayTeam.pointsPerGame}</div>
                    <div className="text-xs text-gray-500">PPG</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-gray-400">Points Per Game</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-black text-white">{game.homeTeam.pointsPerGame}</div>
                    <div className="text-xs text-gray-500">PPG</div>
                  </div>
                </div>
                
                {/* Key Stats Comparison */}
                <div className="space-y-4">
                  {game.awayTeam.keyStats.map((stat, i) => {
                    const homeStat = game.homeTeam.keyStats[i]
                    const awayBetter = stat.rank < homeStat.rank
                    return (
                      <div key={stat.label} className="grid grid-cols-3 items-center gap-4">
                        <div className={`text-right ${awayBetter ? 'text-green-400' : 'text-gray-400'}`}>
                          <div className="font-bold">{stat.value}</div>
                          <div className="text-xs">#{stat.rank}</div>
                        </div>
                        <div className="text-center text-xs text-gray-500">{stat.label}</div>
                        <div className={`text-left ${!awayBetter ? 'text-green-400' : 'text-gray-400'}`}>
                          <div className="font-bold">{homeStat.value}</div>
                          <div className="text-xs">#{homeStat.rank}</div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
            
            {/* Betting Trends */}
            <div className="rounded-xl bg-[#0c0c14] border border-white/10 overflow-hidden">
              <div className="p-4 border-b border-white/10">
                <h2 className="font-bold text-white flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-orange-500" />
                  Betting Trends & Systems
                </h2>
              </div>
              
              <div className="divide-y divide-white/5">
                {game.trends.map((trend, i) => (
                  <div key={i} className="p-4 flex items-center justify-between hover:bg-white/[0.02]">
                    <div className="flex items-center gap-3">
                      {trend.edge > 0 ? (
                        <TrendingUp className="w-4 h-4 text-green-500" />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-red-500" />
                      )}
                      <span className="text-gray-300">{trend.text}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`font-bold ${trend.edge > 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {trend.result}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded ${
                        trend.edge >= 4 ? 'bg-green-500/20 text-green-400' :
                        trend.edge >= 2 ? 'bg-yellow-500/20 text-yellow-400' :
                        trend.edge > 0 ? 'bg-orange-500/20 text-orange-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        {trend.edge > 0 ? '+' : ''}{trend.edge}% edge
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Sidebar */}
          <div className="space-y-6">
            {/* Public Betting */}
            <div className="rounded-xl p-4 bg-[#0c0c14] border border-white/10">
              <h3 className="font-bold text-white flex items-center gap-2 mb-4">
                <Users className="w-5 h-5 text-purple-500" />
                Public Betting %
              </h3>
              
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-400">{game.awayTeam.abbr} Spread</span>
                    <span className="text-white font-bold">{game.publicBetting.spreadAway}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-green-500 to-green-400 rounded-full"
                      style={{ width: `${game.publicBetting.spreadAway}%` }}
                    />
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-400">Over {game.odds[0].total}</span>
                    <span className="text-white font-bold">{game.publicBetting.overPct}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full"
                      style={{ width: `${game.publicBetting.overPct}%` }}
                    />
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-400">{game.awayTeam.abbr} ML</span>
                    <span className="text-white font-bold">{game.publicBetting.mlAway}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-orange-500 to-orange-400 rounded-full"
                      style={{ width: `${game.publicBetting.mlAway}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
            
            {/* Injuries */}
            <div className="rounded-xl p-4 bg-[#0c0c14] border border-white/10">
              <h3 className="font-bold text-white flex items-center gap-2 mb-4">
                <Activity className="w-5 h-5 text-red-500" />
                Key Injuries
              </h3>
              
              <div className="space-y-4">
                <div>
                  <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">{game.awayTeam.abbr}</div>
                  {game.awayTeam.injuries.map((inj) => (
                    <div key={inj.player} className="flex items-center justify-between py-2">
                      <div>
                        <div className="text-white text-sm font-semibold">{inj.player}</div>
                        <div className={`text-xs ${
                          inj.status === 'Out' ? 'text-red-400' :
                          inj.status === 'Questionable' ? 'text-yellow-400' :
                          'text-green-400'
                        }`}>{inj.status}</div>
                      </div>
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <div 
                            key={i}
                            className={`w-2 h-2 rounded-full mx-0.5 ${
                              i < inj.impact ? 'bg-red-500' : 'bg-white/10'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="border-t border-white/10 pt-4">
                  <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">{game.homeTeam.abbr}</div>
                  {game.homeTeam.injuries.map((inj) => (
                    <div key={inj.player} className="flex items-center justify-between py-2">
                      <div>
                        <div className="text-white text-sm font-semibold">{inj.player}</div>
                        <div className={`text-xs ${
                          inj.status === 'Out' ? 'text-red-400' :
                          inj.status === 'Questionable' ? 'text-yellow-400' :
                          'text-green-400'
                        }`}>{inj.status}</div>
                      </div>
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <div 
                            key={i}
                            className={`w-2 h-2 rounded-full mx-0.5 ${
                              i < inj.impact ? 'bg-red-500' : 'bg-white/10'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            {/* H2H History */}
            <div className="rounded-xl p-4 bg-[#0c0c14] border border-white/10">
              <h3 className="font-bold text-white flex items-center gap-2 mb-4">
                <Target className="w-5 h-5 text-orange-500" />
                Head-to-Head
              </h3>
              
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">All-Time</span>
                  <span className="text-white font-semibold">{game.h2h.allTime}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Last 5</span>
                  <span className="text-white font-semibold">{game.h2h.last5}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">At This Venue</span>
                  <span className="text-white font-semibold">{game.h2h.atVenue}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Avg PHI Score</span>
                  <span className="text-white font-semibold">{game.h2h.avgPointsFor}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Avg DAL Score</span>
                  <span className="text-white font-semibold">{game.h2h.avgPointsAgainst}</span>
                </div>
              </div>
            </div>
            
            {/* Last 5 */}
            <div className="rounded-xl p-4 bg-[#0c0c14] border border-white/10">
              <h3 className="font-bold text-white mb-4">Last 5 Games</h3>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">{game.awayTeam.abbr}</span>
                  <div className="flex gap-1">
                    {game.awayTeam.lastGames.map((result, i) => (
                      <span 
                        key={i}
                        className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold ${
                          result === 'W' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                        }`}
                      >
                        {result}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">{game.homeTeam.abbr}</span>
                  <div className="flex gap-1">
                    {game.homeTeam.lastGames.map((result, i) => (
                      <span 
                        key={i}
                        className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold ${
                          result === 'W' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                        }`}
                      >
                        {result}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            {/* AI Pick */}
            <div className="rounded-xl p-4 bg-gradient-to-br from-orange-500/20 to-red-500/20 border border-orange-500/30">
              <h3 className="font-bold text-white flex items-center gap-2 mb-3">
                <Flame className="w-5 h-5 text-orange-500" />
                AI Best Bet
              </h3>
              <div className="text-lg font-black text-orange-500 mb-2">PHI -7 (-110)</div>
              <p className="text-sm text-gray-300">
                Eagles have covered in 6 straight divisional games. Dallas missing Micah Parsons
                severely impacts their pass rush. PHI&apos;s elite run game controls clock and covers.
              </p>
              <div className="mt-3 flex items-center gap-2">
                <span className="px-2 py-1 rounded bg-green-500/20 text-green-400 text-xs font-bold">82% Confidence</span>
                <span className="px-2 py-1 rounded bg-orange-500/20 text-orange-400 text-xs font-bold">4.2% Edge</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
