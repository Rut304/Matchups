'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  Zap, TrendingUp, TrendingDown, ArrowRight, RefreshCw, 
  Target, BarChart3, Info, ChevronDown, Sparkles, Link2,
  Plus, Minus, AlertCircle
} from 'lucide-react'

interface PropCorrelation {
  id: string
  sport: string
  prop1: {
    playerId: string
    playerName: string
    team: string
    propType: string
    line: number
  }
  prop2: {
    playerId: string
    playerName: string
    team: string
    propType: string
    line: number
  }
  correlationType: 'positive' | 'negative' | 'neutral'
  correlationStrength: number
  sampleSize: number
  hitRateBoth: number
  description: string
  insight: string
  parlayBoost: number
}

interface GameCorrelations {
  gameId: string
  homeTeam: string
  awayTeam: string
  correlations: PropCorrelation[]
}

interface ParlayLeg {
  player: string
  prop: string
  line: number
  pick: string
}

interface TopParlay {
  id: string
  name: string
  description: string
  legs: ParlayLeg[]
  correlationBoost: number
  historicalHitRate: number
}

interface Insight {
  pattern: string
  description: string
  strength: number
  insight: string
}

interface CorrelationData {
  sport: string
  games: GameCorrelations[]
  topParlays: TopParlay[]
  insights: Insight[]
  meta: {
    totalCorrelations: number
    strongCorrelations: number
  }
}

export default function PropCorrelationsPage() {
  const [data, setData] = useState<CorrelationData | null>(null)
  const [loading, setLoading] = useState(true)
  const [sport, setSport] = useState('NFL')
  const [showBuilder, setShowBuilder] = useState(false)
  const [selectedProps, setSelectedProps] = useState<PropCorrelation[]>([])

  useEffect(() => {
    fetchData()
  }, [sport])

  async function fetchData() {
    setLoading(true)
    try {
      const res = await fetch(`/api/props/correlations?sport=${sport}`)
      if (res.ok) {
        const json = await res.json()
        setData(json)
      }
    } catch (error) {
      console.error('Failed to fetch correlations:', error)
    }
    setLoading(false)
  }

  function getCorrelationColor(strength: number) {
    if (strength >= 70) return 'text-green-500'
    if (strength >= 50) return 'text-green-400'
    if (strength >= 30) return 'text-yellow-500'
    if (strength <= -70) return 'text-red-500'
    if (strength <= -50) return 'text-red-400'
    if (strength <= -30) return 'text-orange-500'
    return 'text-gray-400'
  }

  function getCorrelationBg(strength: number) {
    if (strength >= 50) return 'bg-green-500/10 border-green-500/20'
    if (strength <= -50) return 'bg-red-500/10 border-red-500/20'
    return 'bg-white/5 border-white/10'
  }

  function togglePropSelection(correlation: PropCorrelation) {
    if (selectedProps.find(p => p.id === correlation.id)) {
      setSelectedProps(selectedProps.filter(p => p.id !== correlation.id))
    } else if (selectedProps.length < 4) {
      setSelectedProps([...selectedProps, correlation])
    }
  }

  if (loading && !data) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <RefreshCw className="w-8 h-8 text-purple-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Link2 className="w-8 h-8 text-purple-500" />
              Prop Correlation Engine
            </h1>
            <p className="text-gray-400 mt-1">
              Find correlated props that hit together for smarter parlays
            </p>
          </div>

          {/* Sport Selector */}
          <div className="flex items-center gap-3">
            {['NFL', 'NBA', 'MLB', 'NHL'].map(s => (
              <button
                key={s}
                onClick={() => setSport(s)}
                className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                  sport === s 
                    ? 'bg-purple-500 text-white' 
                    : 'bg-white/5 text-gray-400 hover:bg-white/10'
                }`}
              >
                {s}
              </button>
            ))}
            <button
              onClick={fetchData}
              disabled={loading}
              className="p-2 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
            >
              <RefreshCw className={`w-5 h-5 text-gray-400 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Info Banner */}
        <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-xl p-4 mb-8">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-white mb-1">What are Prop Correlations?</h3>
              <p className="text-sm text-gray-400">
                Some player props naturally move together. When a QB throws for big yards, his receivers benefit.
                When a game is high-scoring, multiple players exceed their props. 
                <span className="text-purple-400 ml-1">Use these correlations to build smarter same-game parlays.</span>
              </p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <div className="text-sm text-gray-400 mb-1">Correlations Found</div>
            <div className="text-2xl font-bold text-white">{data?.meta.totalCorrelations || 0}</div>
          </div>
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <div className="text-sm text-gray-400 mb-1">Strong Correlations</div>
            <div className="text-2xl font-bold text-green-500">{data?.meta.strongCorrelations || 0}</div>
          </div>
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <div className="text-sm text-gray-400 mb-1">Avg Parlay Boost</div>
            <div className="text-2xl font-bold text-purple-500">+10%</div>
          </div>
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <div className="text-sm text-gray-400 mb-1">Top Hit Rate</div>
            <div className="text-2xl font-bold text-yellow-500">58%</div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Correlations List */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-500" />
              Active Correlations
            </h2>

            {data?.games.map(game => (
              <div key={game.gameId} className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <span className="font-medium text-white">{game.awayTeam}</span>
                  <span>@</span>
                  <span className="font-medium text-white">{game.homeTeam}</span>
                </div>

                {game.correlations.map(correlation => (
                  <div 
                    key={correlation.id}
                    className={`rounded-xl p-4 border transition-all cursor-pointer ${
                      selectedProps.find(p => p.id === correlation.id)
                        ? 'border-purple-500 bg-purple-500/10'
                        : getCorrelationBg(correlation.correlationStrength)
                    }`}
                    onClick={() => togglePropSelection(correlation)}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        {/* Players */}
                        <div className="flex items-center gap-3 mb-3">
                          <div className="flex-1">
                            <div className="text-sm font-medium text-white">{correlation.prop1.playerName}</div>
                            <div className="text-xs text-gray-500">{correlation.prop1.propType} O/U {correlation.prop1.line}</div>
                          </div>
                          <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                            correlation.correlationType === 'positive' 
                              ? 'bg-green-500/20 text-green-400' 
                              : correlation.correlationType === 'negative'
                                ? 'bg-red-500/20 text-red-400'
                                : 'bg-gray-500/20 text-gray-400'
                          }`}>
                            {correlation.correlationType === 'positive' ? (
                              <span className="flex items-center gap-1"><Plus className="w-3 h-3" /> Positive</span>
                            ) : correlation.correlationType === 'negative' ? (
                              <span className="flex items-center gap-1"><Minus className="w-3 h-3" /> Negative</span>
                            ) : 'Neutral'}
                          </div>
                          <div className="flex-1 text-right">
                            <div className="text-sm font-medium text-white">{correlation.prop2.playerName}</div>
                            <div className="text-xs text-gray-500">{correlation.prop2.propType} O/U {correlation.prop2.line}</div>
                          </div>
                        </div>

                        {/* Description */}
                        <p className="text-sm text-gray-400 mb-3">{correlation.description}</p>

                        {/* Stats */}
                        <div className="flex items-center gap-4 text-xs">
                          <div>
                            <span className="text-gray-500">Correlation: </span>
                            <span className={`font-bold ${getCorrelationColor(correlation.correlationStrength)}`}>
                              {correlation.correlationStrength > 0 ? '+' : ''}{correlation.correlationStrength}%
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500">Both Hit: </span>
                            <span className="text-white font-medium">{correlation.hitRateBoth}%</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Sample: </span>
                            <span className="text-white font-medium">{correlation.sampleSize} games</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Parlay Boost: </span>
                            <span className="text-purple-400 font-bold">+{correlation.parlayBoost}%</span>
                          </div>
                        </div>
                      </div>

                      {/* Selection indicator */}
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                        selectedProps.find(p => p.id === correlation.id)
                          ? 'border-purple-500 bg-purple-500'
                          : 'border-gray-600'
                      }`}>
                        {selectedProps.find(p => p.id === correlation.id) && (
                          <Sparkles className="w-3 h-3 text-white" />
                        )}
                      </div>
                    </div>

                    {/* Insight */}
                    <div className="mt-3 pt-3 border-t border-white/5">
                      <div className="flex items-start gap-2">
                        <Sparkles className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-purple-300">{correlation.insight}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Parlay Builder */}
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Target className="w-5 h-5 text-purple-500" />
                Correlation Parlay Builder
              </h3>

              {selectedProps.length === 0 ? (
                <div className="text-center py-6">
                  <Link2 className="w-10 h-10 text-gray-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">Click correlations to add to your parlay</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedProps.map((prop, idx) => (
                    <div key={prop.id} className="p-3 bg-white/5 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-medium text-white">{prop.prop1.playerName}</div>
                          <div className="text-xs text-gray-400">{prop.prop1.propType} Over {prop.prop1.line}</div>
                        </div>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedProps(selectedProps.filter(p => p.id !== prop.id))
                          }}
                          className="text-red-400 hover:text-red-300"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                      </div>
                      {prop.correlationType === 'positive' && (
                        <div className="mt-2 pt-2 border-t border-white/5">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-sm font-medium text-white">{prop.prop2.playerName}</div>
                              <div className="text-xs text-gray-400">{prop.prop2.propType} Over {prop.prop2.line}</div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}

                  <div className="pt-3 border-t border-white/10">
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-gray-400">Correlation Boost</span>
                      <span className="text-purple-400 font-bold">+{selectedProps.reduce((sum, p) => sum + p.parlayBoost, 0)}%</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">Est. Hit Rate</span>
                      <span className="text-green-400 font-bold">{Math.round(selectedProps.reduce((sum, p) => sum + p.hitRateBoth, 0) / selectedProps.length)}%</span>
                    </div>
                  </div>

                  <button className="w-full py-3 rounded-xl font-bold text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 transition-all">
                    Build This Parlay
                  </button>
                </div>
              )}
            </div>

            {/* Top Suggested Parlays */}
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-500" />
                Top Correlated Parlays
              </h3>

              <div className="space-y-3">
                {data?.topParlays.map(parlay => (
                  <div key={parlay.id} className="p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-white">{parlay.name}</span>
                      <span className="text-xs text-purple-400 font-bold">+{parlay.correlationBoost}% boost</span>
                    </div>
                    <p className="text-xs text-gray-400 mb-2">{parlay.description}</p>
                    <div className="space-y-1">
                      {parlay.legs.map((leg, idx) => (
                        <div key={idx} className="text-xs flex items-center gap-2">
                          <span className="text-gray-500">•</span>
                          <span className="text-white">{leg.player}</span>
                          <span className="text-gray-500">{leg.prop} {leg.pick} {leg.line}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-between">
                      <span className="text-xs text-gray-500">Historical hit rate</span>
                      <span className="text-xs font-bold text-green-400">{parlay.historicalHitRate}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Correlation Insights */}
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-500" />
                {sport} Correlation Patterns
              </h3>

              <div className="space-y-3">
                {data?.insights.slice(0, 4).map((insight, idx) => (
                  <div key={idx} className="p-3 bg-white/5 rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-white">{insight.description.split(' ').slice(0, 4).join(' ')}...</span>
                      <span className={`text-xs font-bold ${getCorrelationColor(insight.strength)}`}>
                        {insight.strength > 0 ? '+' : ''}{insight.strength}%
                      </span>
                    </div>
                    <p className="text-xs text-gray-400">{insight.insight}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Warning */}
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-semibold text-yellow-400 mb-1">Correlation ≠ Causation</h4>
                  <p className="text-xs text-gray-400">
                    Past correlations don't guarantee future results. Use this data as one input in your analysis, not the sole factor.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
