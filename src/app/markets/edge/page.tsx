'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Target,
  TrendingDown,
  AlertTriangle,
  ChevronRight,
  BarChart3,
  Zap,
  Brain,
  DollarSign,
  RefreshCw,
  Activity,
  Users,
  Eye
} from 'lucide-react'

/**
 * THE EDGE - Sports Betting Analytics & Sharp Money Signals
 * 
 * DEFAULT: Sports betting edges (Sharp money, RLM, line movement, public splits)
 * TOGGLE: Prediction markets (Polymarket, Kalshi)
 * 
 * Data Sources:
 * - Sports: Action Network API (real betting splits, sharp money)
 * - Prediction Markets: Polymarket API, Kalshi API
 */

interface SharpSignal {
  id: string
  gameId: string
  sport: string
  homeTeam: string
  awayTeam: string
  betType: 'spread' | 'total' | 'moneyline'
  publicSide: string
  publicPct: number
  moneyPct: number
  sharpSide: string
  line?: number
  signal: 'sharp_play' | 'rlm' | 'steam_move' | 'contrarian'
  confidence: number
  reason: string
  gameTime: string
}

export default function EdgePage() {
  const [mode, setMode] = useState<'sports' | 'markets'>('sports')
  const [sportFilter, setSportFilter] = useState<'all' | 'NFL' | 'NBA' | 'NHL' | 'NCAAF' | 'NCAAB'>('all')
  const [signalFilter, setSignalFilter] = useState<'all' | 'sharp_play' | 'rlm' | 'steam_move' | 'contrarian'>('all')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)
  const [sharpSignals, setSharpSignals] = useState<SharpSignal[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadData()
    setLastRefresh(new Date())
  }, [])

  const loadData = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      // Fetch sharp money signals from all major sports
      const sports = ['NFL', 'NBA', 'NHL', 'NCAAF', 'NCAAB']
      const allSignals: SharpSignal[] = []
      
      for (const sport of sports) {
        try {
          const res = await fetch(`/api/betting-splits?sport=${sport}`)
          if (!res.ok) continue
          
          const data = await res.json()
          if (data.success && data.data?.sharpSignals?.length > 0) {
            // Transform to our format
            const signals = data.data.sharpSignals.map((s: {
              gameId: string
              sport: string
              homeTeam: string
              awayTeam: string
              betType: string
              publicSide: string
              publicPct: number
              moneyPct: number
              sharpSide: string
              confidence: string
              signal: string
            }) => ({
              id: `${s.gameId}-${s.betType}`,
              gameId: s.gameId,
              sport: s.sport || sport,
              homeTeam: s.homeTeam,
              awayTeam: s.awayTeam,
              betType: s.betType as 'spread' | 'total' | 'moneyline',
              publicSide: s.publicSide,
              publicPct: s.publicPct,
              moneyPct: s.moneyPct,
              sharpSide: s.sharpSide,
              signal: determineSignalType(s.publicPct, s.moneyPct),
              confidence: s.confidence === 'HIGH' ? 85 : s.confidence === 'MEDIUM' ? 70 : 55,
              reason: s.signal,
              gameTime: 'Today'
            }))
            allSignals.push(...signals)
          }
        } catch (err) {
          console.error(`Error fetching ${sport} signals:`, err)
        }
      }
      
      // Sort by confidence
      allSignals.sort((a, b) => b.confidence - a.confidence)
      setSharpSignals(allSignals)
      
      if (allSignals.length === 0) {
        setError('No sharp money signals detected today. Check back closer to game time.')
      }
    } catch (err) {
      console.error('Error loading edge data:', err)
      setError('Failed to load betting data. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const determineSignalType = (publicPct: number, moneyPct: number): SharpSignal['signal'] => {
    const diff = Math.abs(publicPct - moneyPct)
    if (diff >= 20) return 'rlm' // Reverse line movement
    if (diff >= 15) return 'sharp_play'
    if (diff >= 10) return 'contrarian'
    return 'steam_move'
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await loadData()
    setLastRefresh(new Date())
    setIsRefreshing(false)
  }

  const filteredSignals = sharpSignals.filter(s => {
    if (sportFilter !== 'all' && s.sport !== sportFilter) return false
    if (signalFilter !== 'all' && s.signal !== signalFilter) return false
    return true
  })

  const sharpPlays = sharpSignals.filter(s => s.confidence >= 75).length
  const rlmSignals = sharpSignals.filter(s => s.signal === 'rlm').length
  const avgConfidence = sharpSignals.length > 0 
    ? Math.round(sharpSignals.reduce((a, s) => a + s.confidence, 0) / sharpSignals.length)
    : 0

  const getSignalConfig = (signal: SharpSignal['signal']) => {
    switch (signal) {
      case 'sharp_play':
        return { color: '#00FF88', bg: 'bg-green-500/10', border: 'border-green-500/30', label: 'Sharp Play', icon: Target }
      case 'rlm':
        return { color: '#FF6B00', bg: 'bg-orange-500/10', border: 'border-orange-500/30', label: 'RLM', icon: TrendingDown }
      case 'steam_move':
        return { color: '#00A8FF', bg: 'bg-blue-500/10', border: 'border-blue-500/30', label: 'Steam Move', icon: Zap }
      case 'contrarian':
        return { color: '#9B59B6', bg: 'bg-purple-500/10', border: 'border-purple-500/30', label: 'Contrarian', icon: Users }
    }
  }

  return (
    <div className="min-h-screen pt-20 pb-12 bg-[#050508]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-wrap items-center gap-4 mb-4">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-orange-500/20 to-red-500/10 border border-orange-500/30">
              <Target className="w-8 h-8 text-orange-400" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-black text-white">The Edge</h1>
              <p className="text-gray-400">Real-time sharp money signals & betting analytics</p>
            </div>
            
            {/* Mode Toggle */}
            <div className="ml-auto flex items-center gap-4">
              <div className="flex items-center gap-2 p-1 rounded-xl bg-white/5 border border-white/10">
                <button
                  onClick={() => setMode('sports')}
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                    mode === 'sports' 
                      ? 'bg-orange-500 text-white' 
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Sports Betting
                </button>
                <button
                  onClick={() => setMode('markets')}
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                    mode === 'markets' 
                      ? 'bg-purple-500 text-white' 
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Prediction Markets
                </button>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">
                  {lastRefresh ? lastRefresh.toLocaleTimeString() : '--:--:--'}
                </span>
                <button
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
                >
                  <RefreshCw className={`w-5 h-5 text-gray-400 ${isRefreshing ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {mode === 'sports' ? (
          <>
            {/* Sports Betting Mode */}
            
            {/* Quick Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
              <div className="p-4 rounded-2xl bg-green-500/10 border border-green-500/20">
                <div className="flex items-center gap-2 mb-1">
                  <Target className="w-4 h-4 text-green-400" />
                  <span className="text-xs text-gray-400">Sharp Plays</span>
                </div>
                <div className="text-2xl font-black text-green-400">{sharpPlays}</div>
              </div>
              <div className="p-4 rounded-2xl bg-orange-500/10 border border-orange-500/20">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingDown className="w-4 h-4 text-orange-400" />
                  <span className="text-xs text-gray-400">RLM Signals</span>
                </div>
                <div className="text-2xl font-black text-orange-400">{rlmSignals}</div>
              </div>
              <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20">
                <div className="flex items-center gap-2 mb-1">
                  <Brain className="w-4 h-4 text-blue-400" />
                  <span className="text-xs text-gray-400">Avg Confidence</span>
                </div>
                <div className="text-2xl font-black text-blue-400">{avgConfidence}%</div>
              </div>
              <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20">
                <div className="flex items-center gap-2 mb-1">
                  <Activity className="w-4 h-4 text-purple-400" />
                  <span className="text-xs text-gray-400">Total Signals</span>
                </div>
                <div className="text-2xl font-black text-purple-400">{sharpSignals.length}</div>
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3 mb-6">
              <div className="flex items-center gap-1 p-1 rounded-xl bg-white/5">
                {(['all', 'NFL', 'NBA', 'NHL', 'NCAAF', 'NCAAB'] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setSportFilter(s)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all ${
                      sportFilter === s
                        ? 'bg-orange-500/20 text-orange-400'
                        : 'text-gray-500 hover:text-gray-300'
                    }`}
                  >
                    {s === 'all' ? 'All Sports' : s}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-1 p-1 rounded-xl bg-white/5">
                {(['all', 'sharp_play', 'rlm', 'steam_move', 'contrarian'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setSignalFilter(t)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                      signalFilter === t
                        ? 'bg-purple-500/20 text-purple-400'
                        : 'text-gray-500 hover:text-gray-300'
                    }`}
                  >
                    {t === 'all' ? 'All Signals' : t === 'sharp_play' ? 'Sharp' : t === 'rlm' ? 'RLM' : t === 'steam_move' ? 'Steam' : 'Contrarian'}
                  </button>
                ))}
              </div>
            </div>

            {/* Loading State */}
            {isLoading && (
              <div className="flex items-center justify-center py-20">
                <div className="text-center">
                  <RefreshCw className="w-8 h-8 text-orange-500 animate-spin mx-auto mb-4" />
                  <p className="text-gray-400">Loading sharp money signals...</p>
                </div>
              </div>
            )}

            {/* Error State */}
            {!isLoading && error && (
              <div className="p-6 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-center">
                <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto mb-3" />
                <p className="text-amber-200">{error}</p>
                <button
                  onClick={handleRefresh}
                  className="mt-4 px-4 py-2 rounded-lg bg-amber-500/20 text-amber-400 font-semibold hover:bg-amber-500/30 transition-all"
                >
                  Try Again
                </button>
              </div>
            )}

            {/* Signals Grid */}
            {!isLoading && !error && (
              <div className="grid lg:grid-cols-2 gap-4">
                {filteredSignals.length === 0 ? (
                  <div className="lg:col-span-2 p-8 rounded-2xl bg-white/5 border border-white/10 text-center">
                    <Eye className="w-8 h-8 text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-400">No signals match your filters. Try adjusting the sport or signal type.</p>
                  </div>
                ) : (
                  filteredSignals.map((signal) => {
                    const config = getSignalConfig(signal.signal)
                    const Icon = config.icon
                    
                    return (
                      <Link
                        key={signal.id}
                        href={`/game/${signal.gameId}?sport=${signal.sport.toLowerCase()}`}
                        className={`block p-5 rounded-2xl ${config.bg} ${config.border} border transition-all hover:scale-[1.01] cursor-pointer`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-black/30">
                              <Icon className="w-5 h-5" style={{ color: config.color }} />
                            </div>
                            <div>
                              <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-black/30" style={{ color: config.color }}>
                                {config.label}
                              </span>
                              <h3 className="text-lg font-bold text-white mt-1">
                                {signal.awayTeam} @ {signal.homeTeam}
                              </h3>
                            </div>
                          </div>
                          <span className="text-xs font-bold px-2 py-1 rounded bg-white/10 text-gray-300">
                            {signal.sport}
                          </span>
                        </div>

                        {/* Public vs Money Split */}
                        <div className="grid grid-cols-2 gap-4 mb-4 p-3 rounded-xl bg-black/30">
                          <div>
                            <div className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                              <Users className="w-3 h-3" /> Public Bets
                            </div>
                            <div className="text-lg font-black text-white">{signal.publicPct}%</div>
                            <div className="text-xs text-gray-400">on {signal.publicSide}</div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                              <DollarSign className="w-3 h-3" /> Money %
                            </div>
                            <div className="text-lg font-black" style={{ color: config.color }}>{signal.moneyPct}%</div>
                            <div className="text-xs text-gray-400">on {signal.sharpSide}</div>
                          </div>
                        </div>

                        {/* Sharp Side Recommendation */}
                        <div className="p-3 rounded-xl bg-black/50 border border-green-500/30 mb-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="text-xs text-gray-500">Sharp Money On:</span>
                              <div className="text-lg font-black text-green-400">{signal.sharpSide}</div>
                            </div>
                            <div className="text-right">
                              <span className="text-xs text-gray-500">Confidence</span>
                              <div className="text-lg font-black text-orange-400">{signal.confidence}%</div>
                            </div>
                          </div>
                        </div>

                        {/* Reason */}
                        <p className="text-sm text-gray-400 mb-3">{signal.reason}</p>

                        {/* Footer */}
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span className="capitalize">{signal.betType}</span>
                          <span>{signal.gameTime}</span>
                        </div>
                      </Link>
                    )
                  })
                )}
              </div>
            )}

            {/* Info Section */}
            <div className="mt-8 p-6 rounded-2xl bg-white/5 border border-white/10">
              <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                <Brain className="w-5 h-5 text-orange-400" />
                Understanding Sharp Money Signals
              </h3>
              <div className="grid sm:grid-cols-2 gap-4 text-sm">
                <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                  <span className="text-green-400 font-bold">Sharp Play:</span>
                  <span className="text-gray-400 ml-2">Professional money significantly differs from public betting (15%+ gap)</span>
                </div>
                <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
                  <span className="text-orange-400 font-bold">RLM (Reverse Line Movement):</span>
                  <span className="text-gray-400 ml-2">Line moves against heavy public betting - indicates sharp action</span>
                </div>
                <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <span className="text-blue-400 font-bold">Steam Move:</span>
                  <span className="text-gray-400 ml-2">Rapid line movement across multiple books simultaneously</span>
                </div>
                <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
                  <span className="text-purple-400 font-bold">Contrarian:</span>
                  <span className="text-gray-400 ml-2">Betting against heavy public sentiment with smart money support</span>
                </div>
              </div>
            </div>
          </>
        ) : (
          /* Prediction Markets Mode */
          <div className="text-center py-20">
            <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/30 inline-block mb-6">
              <BarChart3 className="w-12 h-12 text-purple-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">Prediction Markets Coming Soon</h2>
            <p className="text-gray-400 max-w-lg mx-auto mb-6">
              We&apos;re integrating real-time data from Polymarket and Kalshi to bring you 
              edge signals on political, economic, and world events.
            </p>
            <Link
              href="/markets"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-purple-500 text-white font-bold hover:bg-purple-600 transition-all"
            >
              Browse Current Markets <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        )}

        {/* Disclaimer */}
        <div className="mt-8 p-4 rounded-xl bg-red-500/10 border border-red-500/20">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5 shrink-0" />
            <div>
              <h3 className="font-bold text-white mb-1">Risk Disclaimer</h3>
              <p className="text-sm text-gray-400">
                Sharp money signals are informational only and not betting advice. Past performance does not guarantee 
                future results. Sports betting involves significant risk of loss. Always bet responsibly and never 
                risk more than you can afford to lose.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
