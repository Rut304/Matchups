'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft, TrendingUp, TrendingDown, Target, Activity, 
  Calendar, Award, BarChart3, Zap, AlertTriangle, 
  ChevronRight, Flame, Star
} from 'lucide-react'

// =============================================================================
// TYPES
// =============================================================================

interface PlayerData {
  id: string
  name: string
  team: string
  teamFull: string
  position: string
  number?: number
  height?: string
  weight?: number
  age?: number
  college?: string
  experience?: string
  headshot?: string
  stats: Record<string, number | string>
  props: PlayerProp[]
  trends: string[]
  injuries?: InjuryStatus[]
  gameLog: GameLogEntry[]
  aiAnalysis?: string
}

interface PlayerProp {
  id: string
  market: string
  line: number
  overOdds: number
  underOdds: number
  hitRate: number
  trend: 'up' | 'down' | 'stable'
  aiPick?: 'over' | 'under'
  aiConfidence?: number
  aiReasoning?: string
}

interface InjuryStatus {
  type: string
  status: string
  bodyPart: string
  expectedReturn?: string
  impactOnProps?: string
}

interface GameLogEntry {
  date: string
  opponent: string
  result: string
  stats: Record<string, number | string>
  propHit?: boolean
}

// =============================================================================
// MOCK DATA - In production, fetch from API
// =============================================================================

const getPlayerData = (sport: string, playerId: string): PlayerData | null => {
  const players: Record<string, PlayerData> = {
    'josh-allen': {
      id: 'josh-allen',
      name: 'Josh Allen',
      team: 'BUF',
      teamFull: 'Buffalo Bills',
      position: 'QB',
      number: 17,
      height: '6\'5"',
      weight: 237,
      age: 28,
      college: 'Wyoming',
      experience: '7th Season',
      headshot: 'https://a.espncdn.com/combiner/i?img=/i/headshots/nfl/players/full/3918298.png',
      stats: {
        passYds: 4306,
        passTd: 40,
        passInt: 6,
        cmpPct: 69.0,
        passRtg: 110.5,
        rushYds: 531,
        rushTd: 8,
        gp: 16
      },
      props: [
        { 
          id: '1', 
          market: 'Passing Yards', 
          line: 265.5, 
          overOdds: -115, 
          underOdds: -105, 
          hitRate: 62, 
          trend: 'up',
          aiPick: 'over',
          aiConfidence: 72,
          aiReasoning: 'Allen has hit the over in 5 of his last 6 games. Bills face a weak secondary ranked 28th against the pass.'
        },
        { 
          id: '2', 
          market: 'Passing TDs', 
          line: 2.5, 
          overOdds: +105, 
          underOdds: -125, 
          hitRate: 56, 
          trend: 'stable',
          aiPick: 'over',
          aiConfidence: 65,
          aiReasoning: 'Red zone offense firing on all cylinders. TD rate at home is exceptional this season.'
        },
        { 
          id: '3', 
          market: 'Rushing Yards', 
          line: 32.5, 
          overOdds: -110, 
          underOdds: -110, 
          hitRate: 48, 
          trend: 'down',
          aiPick: 'under',
          aiConfidence: 58,
          aiReasoning: 'James Cook getting more designed runs. Allen rushing attempts down in recent games.'
        },
      ],
      trends: [
        'OVER 265.5 pass yards in 10 of last 16 games (62.5%)',
        'Averages 287 passing yards at home this season',
        '40+ rushing yards in 6 of last 10 games',
        '3+ total TDs in 12 of 16 games this season',
        'Against bottom-10 pass defenses: 315 avg yards, 72% over rate'
      ],
      injuries: [],
      gameLog: [
        { date: 'Jan 5', opponent: 'vs MIA', result: 'W 31-17', stats: { passYds: 298, passTd: 3, rushYds: 45 }, propHit: true },
        { date: 'Dec 29', opponent: '@ NE', result: 'W 24-10', stats: { passYds: 256, passTd: 2, rushYds: 38 }, propHit: false },
        { date: 'Dec 22', opponent: 'vs NYJ', result: 'W 40-14', stats: { passYds: 322, passTd: 4, rushYds: 52 }, propHit: true },
        { date: 'Dec 15', opponent: '@ DET', result: 'L 35-42', stats: { passYds: 342, passTd: 3, rushYds: 28 }, propHit: true },
        { date: 'Dec 8', opponent: 'vs SF', result: 'W 35-10', stats: { passYds: 285, passTd: 2, rushYds: 41 }, propHit: true },
      ],
      aiAnalysis: 'Josh Allen is in the MVP conversation and showing elite consistency. His rushing ability adds a unique dimension to props betting. The Bills offense is clicking, making overs attractive especially at home. Key matchup factors: opponent pass defense ranking, weather conditions, and game script potential.'
    },
    'ja-marr-chase': {
      id: 'ja-marr-chase',
      name: "Ja'Marr Chase",
      team: 'CIN',
      teamFull: 'Cincinnati Bengals',
      position: 'WR',
      number: 1,
      height: '6\'1"',
      weight: 201,
      age: 24,
      college: 'LSU',
      experience: '4th Season',
      headshot: 'https://a.espncdn.com/combiner/i?img=/i/headshots/nfl/players/full/4362628.png',
      stats: {
        rec: 117,
        recYds: 1708,
        recTd: 17,
        targets: 158,
        catchPct: 74.1,
        ypr: 14.6,
        gp: 16
      },
      props: [
        { 
          id: '1', 
          market: 'Receiving Yards', 
          line: 85.5, 
          overOdds: -110, 
          underOdds: -110, 
          hitRate: 68, 
          trend: 'up',
          aiPick: 'over',
          aiConfidence: 78,
          aiReasoning: 'Chase is dominating target share at 29%. Burrow connection unstoppable. 100+ yards in 8 of last 10.'
        },
        { 
          id: '2', 
          market: 'Receptions', 
          line: 6.5, 
          overOdds: -120, 
          underOdds: +100, 
          hitRate: 62, 
          trend: 'up',
          aiPick: 'over',
          aiConfidence: 68,
          aiReasoning: 'High volume role continues. 7+ catches in 10 of 16 games.'
        },
        { 
          id: '3', 
          market: 'Anytime TD', 
          line: 0.5, 
          overOdds: -130, 
          underOdds: +110, 
          hitRate: 75, 
          trend: 'up',
          aiPick: 'over',
          aiConfidence: 72,
          aiReasoning: 'Red zone monster. Scores in 75% of games. Primary target inside the 20.'
        },
      ],
      trends: [
        '100+ receiving yards in 8 of last 10 games',
        'Scored TD in 12 of 16 games (75%)',
        '7+ receptions in 10 of 16 games',
        'Averages 107 yards vs man coverage',
        'OVER receiving yards in 11 of 16 games this season'
      ],
      injuries: [],
      gameLog: [
        { date: 'Jan 5', opponent: 'vs CLE', result: 'W 35-24', stats: { rec: 9, recYds: 142, recTd: 2 }, propHit: true },
        { date: 'Dec 29', opponent: '@ PIT', result: 'L 24-27', stats: { rec: 8, recYds: 115, recTd: 1 }, propHit: true },
        { date: 'Dec 22', opponent: 'vs DEN', result: 'W 30-24', stats: { rec: 7, recYds: 98, recTd: 1 }, propHit: true },
        { date: 'Dec 15', opponent: '@ TEN', result: 'W 37-27', stats: { rec: 10, recYds: 168, recTd: 2 }, propHit: true },
        { date: 'Dec 8', opponent: 'vs DAL', result: 'W 27-20', stats: { rec: 6, recYds: 78, recTd: 1 }, propHit: false },
      ],
      aiAnalysis: "Ja'Marr Chase is having a historic season and is the WR1 in fantasy and betting. His connection with Joe Burrow is elite, and he consistently beats coverage. Key factors: shadow coverage from top CBs, game script (blowouts reduce volume), and red zone opportunities."
    },
    'derrick-henry': {
      id: 'derrick-henry',
      name: 'Derrick Henry',
      team: 'BAL',
      teamFull: 'Baltimore Ravens',
      position: 'RB',
      number: 22,
      height: '6\'3"',
      weight: 247,
      age: 30,
      college: 'Alabama',
      experience: '9th Season',
      headshot: 'https://a.espncdn.com/combiner/i?img=/i/headshots/nfl/players/full/3043078.png',
      stats: {
        rushAtt: 325,
        rushYds: 1921,
        rushTd: 16,
        rushYpc: 5.9,
        rec: 28,
        recYds: 245,
        gp: 16
      },
      props: [
        { 
          id: '1', 
          market: 'Rushing Yards', 
          line: 95.5, 
          overOdds: -115, 
          underOdds: -105, 
          hitRate: 68, 
          trend: 'up',
          aiPick: 'over',
          aiConfidence: 75,
          aiReasoning: 'Henry is a machine. 100+ yards in 11 of 16 games. Ravens run-heavy scheme feeds him.'
        },
        { 
          id: '2', 
          market: 'Rushing + Receiving Yards', 
          line: 105.5, 
          overOdds: -110, 
          underOdds: -110, 
          hitRate: 62, 
          trend: 'stable',
          aiPick: 'over',
          aiConfidence: 70,
          aiReasoning: 'More involved in passing game this year. Adds floor to total yards props.'
        },
        { 
          id: '3', 
          market: 'Anytime TD', 
          line: 0.5, 
          overOdds: -155, 
          underOdds: +130, 
          hitRate: 69, 
          trend: 'up',
          aiPick: 'over',
          aiConfidence: 72,
          aiReasoning: 'Goal line back in elite offense. Scores in 11 of 16 games. Heavy TD share.'
        },
      ],
      trends: [
        '100+ rushing yards in 11 of 16 games (68.8%)',
        'TD in 11 of 16 games this season',
        'Averages 120 rushing yards at home',
        '20+ carries in 14 of 16 games',
        'Against bottom-10 run defenses: 135 avg yards'
      ],
      injuries: [],
      gameLog: [
        { date: 'Jan 5', opponent: 'vs CLE', result: 'W 35-10', stats: { rushYds: 142, rushTd: 2, rec: 2, recYds: 18 }, propHit: true },
        { date: 'Dec 29', opponent: '@ HOU', result: 'W 31-24', stats: { rushYds: 108, rushTd: 1, rec: 3, recYds: 25 }, propHit: true },
        { date: 'Dec 22', opponent: 'vs PIT', result: 'W 34-17', stats: { rushYds: 125, rushTd: 1, rec: 1, recYds: 12 }, propHit: true },
        { date: 'Dec 15', opponent: '@ NYG', result: 'W 35-14', stats: { rushYds: 98, rushTd: 2, rec: 2, recYds: 15 }, propHit: true },
        { date: 'Dec 8', opponent: 'vs PHI', result: 'L 24-28', stats: { rushYds: 85, rushTd: 1, rec: 0, recYds: 0 }, propHit: false },
      ],
      aiAnalysis: 'Derrick Henry has found a perfect home in Baltimore. The Ravens run-first philosophy maximizes his talent, and Lamar Jackson draws defenders away. Key factors: game script (leads mean more carries), opponent run defense ranking, and weather (Henry dominates in cold/bad weather).'
    }
  }
  
  return players[playerId] || null
}

// =============================================================================
// COMPONENT
// =============================================================================

export default function PlayerDetailPage() {
  const params = useParams()
  const sport = params.sport as string
  const playerId = params.playerId as string
  
  const [player, setPlayer] = useState<PlayerData | null>(null)
  const [activeTab, setActiveTab] = useState<'props' | 'trends' | 'gamelog' | 'ai'>('props')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // In production, fetch from API
    const data = getPlayerData(sport, playerId)
    setPlayer(data)
    setLoading(false)
  }, [sport, playerId])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050508] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!player) {
    return (
      <div className="min-h-screen bg-[#050508] flex flex-col items-center justify-center gap-4">
        <p className="text-gray-400">Player not found</p>
        <Link href={`/${sport}/players`} className="text-orange-500 hover:underline">
          ← Back to players
        </Link>
      </div>
    )
  }

  const sportEmoji = sport === 'nfl' ? '🏈' : sport === 'nba' ? '🏀' : sport === 'nhl' ? '🏒' : '⚾'

  return (
    <div className="min-h-screen bg-[#050508]">
      {/* Header */}
      <div className="border-b border-white/5 bg-[#0a0a12]">
        <div className="max-w-[1400px] mx-auto px-4 py-6">
          {/* Back Link */}
          <Link 
            href={`/${sport}/players`}
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back to {sport.toUpperCase()} Players</span>
          </Link>

          {/* Player Info */}
          <div className="flex items-start gap-6">
            {/* Headshot */}
            <div className="w-32 h-32 rounded-2xl bg-white/5 overflow-hidden flex-shrink-0">
              {player.headshot ? (
                <img src={player.headshot} alt={player.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-5xl">{sportEmoji}</div>
              )}
            </div>

            {/* Details */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-4xl font-black text-white">{player.name}</span>
                {player.number && (
                  <span className="text-2xl font-bold text-gray-500">#{player.number}</span>
                )}
              </div>
              
              <div className="flex items-center gap-3 mb-4">
                <Link 
                  href={`/team/${sport}/${player.team.toLowerCase()}`}
                  className="px-3 py-1 rounded-lg bg-orange-500/20 text-orange-400 font-semibold hover:bg-orange-500/30 transition-colors"
                >
                  {player.teamFull}
                </Link>
                <span className="px-3 py-1 rounded-lg bg-white/10 text-gray-300 font-semibold">
                  {player.position}
                </span>
              </div>

              <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                {player.height && <span>{player.height}</span>}
                {player.weight && <span>{player.weight} lbs</span>}
                {player.age && <span>Age {player.age}</span>}
                {player.college && <span>{player.college}</span>}
                {player.experience && <span>{player.experience}</span>}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="hidden lg:grid grid-cols-4 gap-4">
              {Object.entries(player.stats).slice(0, 4).map(([key, value]) => (
                <div key={key} className="text-center p-4 bg-white/5 rounded-xl">
                  <div className="text-2xl font-bold text-white">{value}</div>
                  <div className="text-xs text-gray-500 uppercase">{key.replace(/([A-Z])/g, ' $1').trim()}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mt-6">
            {[
              { id: 'props', icon: Target, label: 'Props' },
              { id: 'trends', icon: TrendingUp, label: 'Trends' },
              { id: 'gamelog', icon: Calendar, label: 'Game Log' },
              { id: 'ai', icon: Zap, label: 'AI Analysis' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all ${
                  activeTab === tab.id 
                    ? 'bg-orange-500 text-white' 
                    : 'bg-white/5 text-gray-400 hover:bg-white/10'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-[1400px] mx-auto px-4 py-6">
        {/* Props Tab */}
        {activeTab === 'props' && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Target className="w-5 h-5 text-orange-500" />
              Player Props with AI Picks
            </h2>
            
            {player.props.map(prop => (
              <div key={prop.id} className="bg-[#0c0c14] rounded-xl border border-white/10 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="text-lg font-bold text-white">{prop.market}</div>
                    <div className="text-sm text-gray-500">Line: {prop.line}</div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <div className="text-sm text-gray-500">Over</div>
                      <div className="font-bold text-green-400">{prop.overOdds > 0 ? '+' : ''}{prop.overOdds}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm text-gray-500">Under</div>
                      <div className="font-bold text-red-400">{prop.underOdds > 0 ? '+' : ''}{prop.underOdds}</div>
                    </div>
                  </div>
                </div>

                {/* Hit Rate & Trend */}
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-400">Hit Rate:</span>
                    <span className={`font-bold ${prop.hitRate >= 60 ? 'text-green-400' : prop.hitRate >= 50 ? 'text-amber-400' : 'text-red-400'}`}>
                      {prop.hitRate}%
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {prop.trend === 'up' ? (
                      <TrendingUp className="w-4 h-4 text-green-400" />
                    ) : prop.trend === 'down' ? (
                      <TrendingDown className="w-4 h-4 text-red-400" />
                    ) : (
                      <Activity className="w-4 h-4 text-gray-400" />
                    )}
                    <span className="text-sm text-gray-400 capitalize">{prop.trend} trending</span>
                  </div>
                </div>

                {/* AI Pick */}
                {prop.aiPick && (
                  <div className="bg-gradient-to-r from-orange-500/10 to-transparent border border-orange-500/30 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Zap className="w-5 h-5 text-orange-500" />
                        <span className="font-bold text-white">AI Pick</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`font-bold text-lg ${prop.aiPick === 'over' ? 'text-green-400' : 'text-red-400'}`}>
                          {prop.aiPick.toUpperCase()} {prop.line}
                        </span>
                        <span className="text-sm text-gray-400">({prop.aiConfidence}% confidence)</span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-300">{prop.aiReasoning}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Trends Tab */}
        {activeTab === 'trends' && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-orange-500" />
              Player Trends
            </h2>
            
            <div className="bg-[#0c0c14] rounded-xl border border-white/10 p-6">
              <div className="space-y-3">
                {player.trends.map((trend, i) => (
                  <Link 
                    key={i}
                    href={`/trends?player=${player.id}&sport=${sport}`}
                    className="flex items-center justify-between p-4 bg-[#16161e] rounded-lg hover:bg-white/10 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center">
                        <TrendingUp className="w-4 h-4 text-orange-500" />
                      </div>
                      <span className="text-gray-300">{trend}</span>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-500 group-hover:text-orange-500 transition-colors" />
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Game Log Tab */}
        {activeTab === 'gamelog' && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-orange-500" />
              Recent Game Log
            </h2>
            
            <div className="bg-[#0c0c14] rounded-xl border border-white/10 overflow-hidden">
              <table className="w-full">
                <thead className="bg-white/5">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Opponent</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Result</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Stats</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Prop Hit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {player.gameLog.map((game, i) => (
                    <tr key={i} className="hover:bg-white/5">
                      <td className="px-4 py-3 text-sm text-gray-400">{game.date}</td>
                      <td className="px-4 py-3 text-sm text-white font-medium">{game.opponent}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className={game.result.startsWith('W') ? 'text-green-400' : 'text-red-400'}>
                          {game.result}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-300">
                        {Object.entries(game.stats).map(([k, v]) => `${v} ${k.replace(/([A-Z])/g, ' $1').trim()}`).join(', ')}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {game.propHit !== undefined && (
                          <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full ${
                            game.propHit ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                          }`}>
                            {game.propHit ? '✓' : '✗'}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* AI Analysis Tab */}
        {activeTab === 'ai' && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-orange-500" />
              AI Analysis
            </h2>
            
            <div className="bg-gradient-to-br from-orange-500/10 to-purple-500/10 rounded-xl border border-orange-500/30 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-orange-500 to-purple-500 flex items-center justify-center">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="font-bold text-white">AI Betting Analysis</div>
                  <div className="text-sm text-gray-400">Powered by advanced analytics</div>
                </div>
              </div>
              
              <p className="text-gray-300 leading-relaxed">{player.aiAnalysis}</p>

              {/* Key Factors */}
              <div className="mt-6 pt-6 border-t border-white/10">
                <div className="font-semibold text-white mb-3">Key Betting Factors</div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {['Matchup', 'Trends', 'Value', 'Risk'].map(factor => (
                    <div key={factor} className="p-3 bg-white/5 rounded-lg text-center">
                      <div className="text-sm text-gray-500">{factor}</div>
                      <div className="flex items-center justify-center gap-1 mt-1">
                        {[1, 2, 3, 4, 5].map(star => (
                          <Star 
                            key={star} 
                            className={`w-3 h-3 ${star <= 4 ? 'text-orange-500 fill-orange-500' : 'text-gray-600'}`} 
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Injury Impact */}
            {player.injuries && player.injuries.length > 0 && (
              <div className="bg-red-500/10 rounded-xl border border-red-500/30 p-6">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                  <span className="font-bold text-white">Injury Report</span>
                </div>
                {player.injuries.map((injury, i) => (
                  <div key={i} className="text-gray-300">
                    <span className="text-red-400 font-semibold">{injury.status}</span> - {injury.type} ({injury.bodyPart})
                    {injury.impactOnProps && (
                      <p className="text-sm text-gray-500 mt-1">{injury.impactOnProps}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
