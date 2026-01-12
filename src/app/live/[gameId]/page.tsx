'use client'

// =============================================================================
// LIVE GAME TRACKER - The Ultimate Control Panel
// Real-time play-by-play, live odds, user bet tracking, and AI insights
// 
// DATA SOURCES (ALL REAL):
// - ESPN API: Play-by-play, scores, game state
// - The Odds API: Live betting lines from 40+ sportsbooks
// - Supabase: User's tracked bets
// - Intelligence API: Edge analysis
// =============================================================================

import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  Activity, Play, Pause, Volume2, VolumeX, Bell, BellOff,
  ArrowLeft, TrendingUp, TrendingDown, Target, DollarSign,
  Clock, Zap, Users, BarChart3, AlertTriangle, CheckCircle,
  ChevronRight, Flame, RefreshCw, Eye, ArrowUpRight, ArrowDownRight,
  Trophy, Star, LineChart, Bookmark, Share2, Settings, Brain
} from 'lucide-react'

// Types
interface PlayByPlayEvent {
  id: string
  sequenceNumber: number
  clock: string
  period: string | number
  type: string
  team?: string
  teamAbbr?: string
  description: string
  isScoring?: boolean
  scoreHome?: number
  scoreAway?: number
}

interface LiveGameState {
  gameId: string
  sport: string
  status: 'pre' | 'in' | 'post'
  period: string | number
  clock: string
  homeScore: number
  awayScore: number
  possession?: string
  situation?: string
  lastPlay?: PlayByPlayEvent
  plays: PlayByPlayEvent[]
}

interface LiveOdds {
  bookmaker: string
  spread: { home: number; homeOdds: number; away: number; awayOdds: number }
  total: { line: number; overOdds: number; underOdds: number }
  moneyline: { home: number; away: number }
  lastUpdate: string
}

interface UserBet {
  id: string
  type: 'spread' | 'total' | 'moneyline' | 'prop'
  pick: string
  odds: number
  amount: number
  potentialWin: number
  status: 'pending' | 'won' | 'lost' | 'push'
  placedAt: string
}

interface GameDetails {
  id: string
  sport: string
  homeTeam: { name: string; abbr: string; logo?: string; color?: string; record?: string }
  awayTeam: { name: string; abbr: string; logo?: string; color?: string; record?: string }
  venue?: string
  broadcast?: string
  weather?: { temp: number; condition: string }
}

export default function LiveGameTrackerPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const gameId = params.gameId as string
  const sport = searchParams.get('sport') || 'NFL'

  // State
  const [gameDetails, setGameDetails] = useState<GameDetails | null>(null)
  const [gameState, setGameState] = useState<LiveGameState | null>(null)
  const [liveOdds, setLiveOdds] = useState<LiveOdds[]>([])
  const [userBets, setUserBets] = useState<UserBet[]>([])
  const [loading, setLoading] = useState(true)
  const [isTracking, setIsTracking] = useState(true)
  const [soundEnabled, setSoundEnabled] = useState(false)
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const [selectedTab, setSelectedTab] = useState<'plays' | 'odds' | 'bets' | 'analysis'>('plays')
  const [error, setError] = useState<string | null>(null)
  
  // Refs for polling
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const lastSequenceRef = useRef(0)

  // =============================================================================
  // DATA FETCHING - ALL REAL DATA
  // =============================================================================

  // Fetch game details from ESPN
  const fetchGameDetails = useCallback(async () => {
    try {
      const res = await fetch(`/api/games/${gameId}?sport=${sport}`)
      if (!res.ok) throw new Error('Failed to fetch game details')
      const data = await res.json()
      
      setGameDetails({
        id: data.id,
        sport: data.sport,
        homeTeam: {
          name: data.home?.name || 'Home Team',
          abbr: data.home?.abbreviation || data.home?.abbr || 'HOME',
          logo: data.home?.logo,
          color: data.home?.color,
          record: data.home?.record
        },
        awayTeam: {
          name: data.away?.name || 'Away Team',
          abbr: data.away?.abbreviation || data.away?.abbr || 'AWAY',
          logo: data.away?.logo,
          color: data.away?.color,
          record: data.away?.record
        },
        venue: data.venue,
        broadcast: data.broadcast,
        weather: data.weather
      })
    } catch (err) {
      console.error('Error fetching game details:', err)
    }
  }, [gameId, sport])

  // Fetch live game state (play-by-play, scores)
  const fetchGameState = useCallback(async () => {
    try {
      const res = await fetch(`/api/live?gameId=${gameId}&sport=${sport}&mode=poll&lastSequence=${lastSequenceRef.current}`)
      if (!res.ok) throw new Error('Failed to fetch game state')
      const data = await res.json()
      
      if (data.success) {
        if (data.hasUpdates && data.state) {
          setGameState(data.state)
          lastSequenceRef.current = data.state.lastPlay?.sequenceNumber || lastSequenceRef.current
          
          // Play sound on scoring play
          if (soundEnabled && data.newPlays?.some((p: PlayByPlayEvent) => p.isScoring)) {
            playScoreSound()
          }
        } else if (data.state) {
          setGameState(data.state)
        }
      }
    } catch (err) {
      console.error('Error fetching game state:', err)
    }
  }, [gameId, sport, soundEnabled])

  // Fetch live odds from The Odds API
  const fetchLiveOdds = useCallback(async () => {
    try {
      const sportMap: Record<string, string> = {
        'NFL': 'americanfootball_nfl',
        'NBA': 'basketball_nba',
        'NHL': 'icehockey_nhl',
        'MLB': 'baseball_mlb'
      }
      
      const res = await fetch(`/api/odds?sport=${sportMap[sport] || sport}&markets=spreads,totals,h2h&live=true`)
      if (!res.ok) return
      
      const data = await res.json()
      if (data.success && data.odds) {
        // Find our game in the odds data
        const matchingGame = data.odds.find((g: { id: string; home_team: string }) => 
          g.id === gameId || 
          g.home_team?.toLowerCase().includes(gameDetails?.homeTeam.name.toLowerCase().split(' ').pop() || '')
        )
        
        if (matchingGame?.bookmakers) {
          const odds: LiveOdds[] = matchingGame.bookmakers.slice(0, 6).map((bm: {
            key: string
            last_update: string
            markets: Array<{
              key: string
              outcomes: Array<{ name: string; point?: number; price: number }>
            }>
          }) => {
            const spread = bm.markets.find(m => m.key === 'spreads')
            const total = bm.markets.find(m => m.key === 'totals')
            const ml = bm.markets.find(m => m.key === 'h2h')
            
            const homeSpread = spread?.outcomes.find(o => o.name === matchingGame.home_team)
            const awaySpread = spread?.outcomes.find(o => o.name === matchingGame.away_team)
            const over = total?.outcomes.find(o => o.name === 'Over')
            const under = total?.outcomes.find(o => o.name === 'Under')
            const homeML = ml?.outcomes.find(o => o.name === matchingGame.home_team)
            const awayML = ml?.outcomes.find(o => o.name === matchingGame.away_team)
            
            return {
              bookmaker: bm.key,
              spread: {
                home: homeSpread?.point || 0,
                homeOdds: homeSpread?.price || -110,
                away: awaySpread?.point || 0,
                awayOdds: awaySpread?.price || -110
              },
              total: {
                line: over?.point || 0,
                overOdds: over?.price || -110,
                underOdds: under?.price || -110
              },
              moneyline: {
                home: homeML?.price || 0,
                away: awayML?.price || 0
              },
              lastUpdate: bm.last_update
            }
          })
          setLiveOdds(odds)
        }
      }
    } catch (err) {
      console.error('Error fetching live odds:', err)
    }
  }, [sport, gameId, gameDetails])

  // Fetch user's tracked bets from Supabase
  const fetchUserBets = useCallback(async () => {
    try {
      const res = await fetch(`/api/user/bets?gameId=${gameId}`)
      if (!res.ok) return
      const data = await res.json()
      if (data.success && data.bets) {
        setUserBets(data.bets)
      }
    } catch (err) {
      console.error('Error fetching user bets:', err)
    }
  }, [gameId])

  // Sound effect for scoring plays
  const playScoreSound = () => {
    try {
      const audio = new Audio('/sounds/score.mp3')
      audio.volume = 0.5
      audio.play().catch(() => {}) // Ignore autoplay errors
    } catch {
      // Sound not available
    }
  }

  // =============================================================================
  // EFFECTS
  // =============================================================================

  // Initial data load
  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      await Promise.all([
        fetchGameDetails(),
        fetchGameState(),
        fetchLiveOdds(),
        fetchUserBets()
      ])
      setLoading(false)
    }
    loadData()
  }, [fetchGameDetails, fetchGameState, fetchLiveOdds, fetchUserBets])

  // Real-time polling when tracking is enabled
  useEffect(() => {
    if (!isTracking || gameState?.status === 'post') return

    pollIntervalRef.current = setInterval(() => {
      fetchGameState()
      fetchLiveOdds()
    }, 10000) // Poll every 10 seconds

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current)
      }
    }
  }, [isTracking, gameState?.status, fetchGameState, fetchLiveOdds])

  // =============================================================================
  // RENDER
  // =============================================================================

  if (loading) {
    return (
      <main className="min-h-screen bg-[#06060c]">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <RefreshCw className="w-12 h-12 text-orange-500 animate-spin" />
          </div>
        </div>
      </main>
    )
  }

  if (error || !gameDetails) {
    return (
      <main className="min-h-screen bg-[#06060c]">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h1 className="text-xl font-bold text-white">{error || 'Game not found'}</h1>
            <Link href="/live" className="text-orange-500 hover:underline mt-4 inline-block">
              ← Back to Live Games
            </Link>
          </div>
        </div>
      </main>
    )
  }

  const isLive = gameState?.status === 'in'
  const isFinal = gameState?.status === 'post'

  return (
    <main className="min-h-screen bg-[#06060c]">
      <div className="max-w-7xl mx-auto px-4 py-4">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <Link href="/live" className="flex items-center gap-2 text-slate-400 hover:text-white">
            <ArrowLeft className="w-4 h-4" />
            Live Games
          </Link>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsTracking(!isTracking)}
              className={`p-2 rounded-lg transition-colors ${
                isTracking ? 'bg-green-500/20 text-green-400' : 'bg-slate-800 text-slate-400'
              }`}
              title={isTracking ? 'Tracking live' : 'Tracking paused'}
            >
              {isTracking ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-2 rounded-lg transition-colors ${
                soundEnabled ? 'bg-orange-500/20 text-orange-400' : 'bg-slate-800 text-slate-400'
              }`}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setNotificationsEnabled(!notificationsEnabled)}
              className={`p-2 rounded-lg transition-colors ${
                notificationsEnabled ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-800 text-slate-400'
              }`}
            >
              {notificationsEnabled ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Scoreboard */}
        <div className={`rounded-2xl p-6 mb-4 border ${
          isLive ? 'bg-gradient-to-br from-red-950/30 to-slate-900 border-red-500/30' :
          isFinal ? 'bg-gradient-to-br from-slate-900 to-slate-950 border-slate-700' :
          'bg-gradient-to-br from-slate-900 to-slate-950 border-slate-800'
        }`}>
          {/* Status Bar */}
          <div className="flex items-center justify-center gap-3 mb-4">
            {isLive && (
              <span className="flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/20 text-red-400 text-sm font-bold animate-pulse">
                <span className="w-2 h-2 rounded-full bg-red-500"></span>
                LIVE
              </span>
            )}
            <span className="text-slate-400 text-sm">
              {gameState?.period && gameState?.clock ? `${gameState.period} - ${gameState.clock}` : 
               isFinal ? 'FINAL' : 'Scheduled'}
            </span>
          </div>

          {/* Teams & Score */}
          <div className="grid grid-cols-7 gap-4 items-center">
            {/* Away Team */}
            <div className="col-span-2 text-center">
              {gameDetails.awayTeam.logo && (
                <img src={gameDetails.awayTeam.logo} alt="" className="w-16 h-16 mx-auto mb-2 object-contain" />
              )}
              <p className="text-lg font-bold text-white">{gameDetails.awayTeam.name}</p>
              <p className="text-sm text-slate-400">{gameDetails.awayTeam.record}</p>
            </div>

            {/* Score */}
            <div className="col-span-3 text-center">
              <div className="flex items-center justify-center gap-4">
                <span className={`text-5xl font-black ${
                  (gameState?.awayScore || 0) > (gameState?.homeScore || 0) ? 'text-white' : 'text-slate-400'
                }`}>
                  {gameState?.awayScore ?? '-'}
                </span>
                <span className="text-2xl text-slate-600">-</span>
                <span className={`text-5xl font-black ${
                  (gameState?.homeScore || 0) > (gameState?.awayScore || 0) ? 'text-white' : 'text-slate-400'
                }`}>
                  {gameState?.homeScore ?? '-'}
                </span>
              </div>
              {gameState?.situation && (
                <p className="text-sm text-orange-400 mt-2">{gameState.situation}</p>
              )}
            </div>

            {/* Home Team */}
            <div className="col-span-2 text-center">
              {gameDetails.homeTeam.logo && (
                <img src={gameDetails.homeTeam.logo} alt="" className="w-16 h-16 mx-auto mb-2 object-contain" />
              )}
              <p className="text-lg font-bold text-white">{gameDetails.homeTeam.name}</p>
              <p className="text-sm text-slate-400">{gameDetails.homeTeam.record}</p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
          {[
            { id: 'plays', label: 'Play-by-Play', icon: Activity },
            { id: 'odds', label: 'Live Odds', icon: DollarSign },
            { id: 'bets', label: 'My Bets', icon: Target },
            { id: 'analysis', label: 'AI Analysis', icon: Brain }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id as typeof selectedTab)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                selectedTab === tab.id
                  ? 'bg-orange-500 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="grid lg:grid-cols-3 gap-4">
          
          {/* Main Content - 2/3 */}
          <div className="lg:col-span-2 space-y-4">
            
            {/* Play-by-Play Tab */}
            {selectedTab === 'plays' && (
              <div className="rounded-xl bg-slate-900/50 border border-slate-800 overflow-hidden">
                <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                  <h3 className="font-bold text-white flex items-center gap-2">
                    <Activity className="w-5 h-5 text-orange-500" />
                    Play-by-Play
                  </h3>
                  {isTracking && <span className="text-xs text-green-400">● Live</span>}
                </div>
                <div className="max-h-[500px] overflow-y-auto">
                  {gameState?.plays && gameState.plays.length > 0 ? (
                    <div className="divide-y divide-slate-800">
                      {gameState.plays.slice(0, 30).map((play, i) => (
                        <div
                          key={play.id || i}
                          className={`p-3 hover:bg-slate-800/50 ${
                            play.isScoring ? 'bg-green-500/10 border-l-2 border-green-500' : ''
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className="text-xs text-slate-500 w-16 flex-shrink-0">
                              {play.period} {play.clock}
                            </div>
                            <div className="flex-1">
                              {play.teamAbbr && (
                                <span className="font-semibold text-orange-400 mr-2">{play.teamAbbr}</span>
                              )}
                              <span className={`text-sm ${play.isScoring ? 'text-green-400 font-semibold' : 'text-slate-300'}`}>
                                {play.description}
                              </span>
                              {play.isScoring && play.scoreAway !== undefined && play.scoreHome !== undefined && (
                                <span className="ml-2 text-xs font-bold text-white bg-green-500/20 px-2 py-0.5 rounded">
                                  {play.scoreAway} - {play.scoreHome}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center text-slate-500">
                      {isLive ? 'Waiting for plays...' : 'Play-by-play will appear when the game starts'}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Live Odds Tab */}
            {selectedTab === 'odds' && (
              <div className="rounded-xl bg-slate-900/50 border border-slate-800 overflow-hidden">
                <div className="p-4 border-b border-slate-800">
                  <h3 className="font-bold text-white flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-green-500" />
                    Live Odds Comparison
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">Real-time odds from The Odds API</p>
                </div>
                {liveOdds.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-800/50">
                        <tr className="text-slate-400">
                          <th className="text-left p-3">Sportsbook</th>
                          <th className="text-center p-3">{gameDetails.awayTeam.abbr} Spread</th>
                          <th className="text-center p-3">{gameDetails.homeTeam.abbr} Spread</th>
                          <th className="text-center p-3">Total</th>
                          <th className="text-center p-3">{gameDetails.awayTeam.abbr} ML</th>
                          <th className="text-center p-3">{gameDetails.homeTeam.abbr} ML</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {liveOdds.map((odds, i) => (
                          <tr key={i} className="hover:bg-slate-800/30">
                            <td className="p-3 font-medium text-white capitalize">{odds.bookmaker.replace(/_/g, ' ')}</td>
                            <td className="p-3 text-center">
                              <span className="font-mono text-white">{odds.spread.away > 0 ? '+' : ''}{odds.spread.away}</span>
                              <span className="text-slate-500 ml-1 text-xs">({odds.spread.awayOdds > 0 ? '+' : ''}{odds.spread.awayOdds})</span>
                            </td>
                            <td className="p-3 text-center">
                              <span className="font-mono text-white">{odds.spread.home > 0 ? '+' : ''}{odds.spread.home}</span>
                              <span className="text-slate-500 ml-1 text-xs">({odds.spread.homeOdds > 0 ? '+' : ''}{odds.spread.homeOdds})</span>
                            </td>
                            <td className="p-3 text-center">
                              <span className="font-mono text-white">{odds.total.line}</span>
                              <span className="text-slate-500 ml-1 text-xs">(o{odds.total.overOdds}/u{odds.total.underOdds})</span>
                            </td>
                            <td className={`p-3 text-center font-mono ${odds.moneyline.away > 0 ? 'text-green-400' : 'text-white'}`}>
                              {odds.moneyline.away > 0 ? '+' : ''}{odds.moneyline.away}
                            </td>
                            <td className={`p-3 text-center font-mono ${odds.moneyline.home > 0 ? 'text-green-400' : 'text-white'}`}>
                              {odds.moneyline.home > 0 ? '+' : ''}{odds.moneyline.home}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-8 text-center text-slate-500">
                    Live odds unavailable. Configure ODDS_API_KEY for real-time lines.
                  </div>
                )}
              </div>
            )}

            {/* My Bets Tab */}
            {selectedTab === 'bets' && (
              <div className="rounded-xl bg-slate-900/50 border border-slate-800 overflow-hidden">
                <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                  <h3 className="font-bold text-white flex items-center gap-2">
                    <Target className="w-5 h-5 text-purple-500" />
                    My Tracked Bets
                  </h3>
                  <Link href="/my-picks" className="text-xs text-orange-500 hover:underline">
                    Add Bets →
                  </Link>
                </div>
                {userBets.length > 0 ? (
                  <div className="divide-y divide-slate-800">
                    {userBets.map(bet => (
                      <div key={bet.id} className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-white">{bet.pick}</p>
                            <p className="text-xs text-slate-400 capitalize">{bet.type}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-mono text-white">${bet.amount.toFixed(2)}</p>
                            <p className={`text-xs ${
                              bet.status === 'won' ? 'text-green-400' :
                              bet.status === 'lost' ? 'text-red-400' :
                              'text-yellow-400'
                            }`}>
                              {bet.status === 'pending' ? `To win: $${bet.potentialWin.toFixed(2)}` :
                               bet.status === 'won' ? `Won $${bet.potentialWin.toFixed(2)}` :
                               `Lost $${bet.amount.toFixed(2)}`}
                            </p>
                          </div>
                        </div>
                        <div className={`mt-2 px-2 py-1 rounded text-xs inline-block ${
                          bet.status === 'won' ? 'bg-green-500/20 text-green-400' :
                          bet.status === 'lost' ? 'bg-red-500/20 text-red-400' :
                          bet.status === 'push' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-blue-500/20 text-blue-400'
                        }`}>
                          {bet.status.toUpperCase()}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center">
                    <Target className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                    <p className="text-slate-400">No bets tracked for this game</p>
                    <Link href="/my-picks" className="text-orange-500 hover:underline text-sm mt-2 inline-block">
                      Track a bet →
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* AI Analysis Tab */}
            {selectedTab === 'analysis' && (
              <div className="rounded-xl bg-slate-900/50 border border-slate-800 overflow-hidden">
                <div className="p-4 border-b border-slate-800">
                  <h3 className="font-bold text-white flex items-center gap-2">
                    <Brain className="w-5 h-5 text-orange-500" />
                    Live AI Analysis
                  </h3>
                </div>
                <div className="p-6">
                  <Link
                    href={`/game/${gameId}?sport=${sport}`}
                    className="block p-4 rounded-xl bg-gradient-to-r from-orange-500/10 to-transparent border border-orange-500/20 hover:border-orange-500/40 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-white">View Full Analysis</p>
                        <p className="text-sm text-slate-400">THE EDGE - AI-powered betting intelligence</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-orange-500" />
                    </div>
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar - 1/3 */}
          <div className="space-y-4">
            
            {/* Quick Odds Summary */}
            <div className="rounded-xl bg-slate-900/50 border border-slate-800 p-4">
              <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                <Zap className="w-4 h-4 text-yellow-500" />
                Current Lines
              </h4>
              {liveOdds.length > 0 ? (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 text-sm">Spread</span>
                    <span className="font-mono text-white">
                      {gameDetails.homeTeam.abbr} {liveOdds[0]?.spread.home > 0 ? '+' : ''}{liveOdds[0]?.spread.home}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 text-sm">Total</span>
                    <span className="font-mono text-white">O/U {liveOdds[0]?.total.line}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 text-sm">{gameDetails.awayTeam.abbr} ML</span>
                    <span className={`font-mono ${liveOdds[0]?.moneyline.away > 0 ? 'text-green-400' : 'text-white'}`}>
                      {liveOdds[0]?.moneyline.away > 0 ? '+' : ''}{liveOdds[0]?.moneyline.away}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 text-sm">{gameDetails.homeTeam.abbr} ML</span>
                    <span className={`font-mono ${liveOdds[0]?.moneyline.home > 0 ? 'text-green-400' : 'text-white'}`}>
                      {liveOdds[0]?.moneyline.home > 0 ? '+' : ''}{liveOdds[0]?.moneyline.home}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-slate-500 text-sm">Lines unavailable</p>
              )}
            </div>

            {/* Game Info */}
            <div className="rounded-xl bg-slate-900/50 border border-slate-800 p-4">
              <h4 className="font-semibold text-white mb-3">Game Info</h4>
              <div className="space-y-2 text-sm">
                {gameDetails.venue && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Venue</span>
                    <span className="text-white">{gameDetails.venue}</span>
                  </div>
                )}
                {gameDetails.broadcast && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Broadcast</span>
                    <span className="text-white">{gameDetails.broadcast}</span>
                  </div>
                )}
                {gameDetails.weather && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Weather</span>
                    <span className="text-white">{gameDetails.weather.temp}°F, {gameDetails.weather.condition}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="rounded-xl bg-slate-900/50 border border-slate-800 p-4">
              <h4 className="font-semibold text-white mb-3">Quick Actions</h4>
              <div className="space-y-2">
                <Link
                  href={`/game/${gameId}?sport=${sport}`}
                  className="flex items-center justify-between p-2 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition-colors"
                >
                  <span className="text-sm text-slate-300">Full Matchup Analysis</span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </Link>
                <button className="flex items-center justify-between p-2 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition-colors w-full">
                  <span className="text-sm text-slate-300">Share Game</span>
                  <Share2 className="w-4 h-4 text-slate-400" />
                </button>
                <button className="flex items-center justify-between p-2 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition-colors w-full">
                  <span className="text-sm text-slate-300">Add to Watchlist</span>
                  <Bookmark className="w-4 h-4 text-slate-400" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
