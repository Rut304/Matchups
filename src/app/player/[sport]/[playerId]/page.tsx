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
// FETCH REAL DATA - No mock data fallback
// In production, this fetches from the API. Returns null if player not found.
// =============================================================================

const getPlayerData = async (_sport: string, _playerId: string): Promise<PlayerData | null> => {
  // TODO: Implement real API call to fetch player data from database
  // Currently returns null - UI will show "Player not found"
  // Real implementation should fetch from /api/player/[sport]/[playerId]
  console.log('[Player Page] getPlayerData called - no mock data, returning null')
  return null
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
    // Fetch player data from API (async)
    const fetchPlayer = async () => {
      const data = await getPlayerData(sport, playerId)
      setPlayer(data)
      setLoading(false)
    }
    fetchPlayer()
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
