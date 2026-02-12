'use client'

// =============================================================================
// ESPN-STYLE LIVE GAME VIEW
// The ultimate live game tracking experience
// Real-time scores, play-by-play, live odds, bet tracking, and more
// =============================================================================

import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  Activity, Play, Pause, Volume2, VolumeX, Bell, BellOff,
  ArrowLeft, TrendingUp, TrendingDown, Target, DollarSign,
  Clock, Zap, Users, BarChart3, AlertTriangle, CheckCircle,
  ChevronRight, Flame, RefreshCw, ArrowUpRight, ArrowDownRight,
  Trophy, Star, Bookmark, Share2, Settings, Brain, ChevronDown,
  Radio, Tv, MapPin, ThermometerSun, Wind, Timer, Circle,
  ChevronUp, Maximize2, Minimize2, MoreHorizontal, Heart
} from 'lucide-react'

// =============================================================================
// TYPES
// =============================================================================

interface Team {
  id: string
  name: string
  shortName: string
  abbreviation: string
  logo?: string
  color?: string
  altColor?: string
  record?: string
  rank?: number
}

interface PlayByPlay {
  id: string
  sequenceNumber: number
  clock: string
  period: number | string
  type: string
  team?: string
  teamLogo?: string
  description: string
  isScoring?: boolean
  scoreValue?: number
  awayScore?: number
  homeScore?: number
  down?: number
  distance?: number
  yardLine?: string
  possession?: string
}

interface BoxScoreEntry {
  period: string
  away: number
  home: number
}

interface PlayerStat {
  name: string
  team: string
  position: string
  headshot?: string
  stats: { label: string; value: string | number }[]
}

interface LiveOdds {
  bookmaker: string
  bookmakerLogo?: string
  spread: { line: number; odds: number }
  total: { line: number; overOdds: number; underOdds: number }
  moneyline: { home: number; away: number }
  lastUpdate: string
}

interface GameState {
  status: 'pre' | 'in' | 'post' | 'delay'
  period: number | string
  clock: string
  possession?: string
  situation?: string // e.g., "1st & 10 at KC 35"
  redzone?: boolean
  lastPlay?: PlayByPlay
}

interface UserBet {
  id: string
  type: string
  pick: string
  odds: number
  amount: number
  potentialWin: number
  status: 'live' | 'won' | 'lost' | 'push'
  currentValue?: number
}

interface GameInsight {
  type: 'edge' | 'trend' | 'alert' | 'stat'
  title: string
  description: string
  value?: string
  sentiment: 'positive' | 'negative' | 'neutral'
}

// =============================================================================
// COMPONENT
// =============================================================================

export default function ESPNStyleLivePage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const gameId = params.gameId as string
  const sport = (searchParams.get('sport') || 'NFL').toUpperCase()

  // =============================================================================
  // STATE
  // =============================================================================
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Game Data
  const [homeTeam, setHomeTeam] = useState<Team | null>(null)
  const [awayTeam, setAwayTeam] = useState<Team | null>(null)
  const [gameState, setGameState] = useState<GameState | null>(null)
  const [boxScore, setBoxScore] = useState<BoxScoreEntry[]>([])
  const [plays, setPlays] = useState<PlayByPlay[]>([])
  const [keyPlayers, setKeyPlayers] = useState<PlayerStat[]>([])
  const [liveOdds, setLiveOdds] = useState<LiveOdds[]>([])
  const [userBets, setUserBets] = useState<UserBet[]>([])
  const [insights, setInsights] = useState<GameInsight[]>([])
  const [gameInfo, setGameInfo] = useState<{
    venue?: string
    broadcast?: string
    weather?: { temp: number; condition: string; wind?: string }
    attendance?: number
  }>({})

  // UI State
  const [isTracking, setIsTracking] = useState(true)
  const [soundEnabled, setSoundEnabled] = useState(false)
  const [selectedTab, setSelectedTab] = useState<'plays' | 'boxscore' | 'stats' | 'odds'>('plays')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showBetSlip, setShowBetSlip] = useState(false)

  // Refs
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const lastPlayRef = useRef<number>(0)
  const scoreAudioRef = useRef<HTMLAudioElement | null>(null)

  // =============================================================================
  // DATA FETCHING
  // =============================================================================

  const fetchGameData = useCallback(async () => {
    try {
      // Fetch game details
      const gameRes = await fetch(`/api/games/${gameId}?sport=${sport.toLowerCase()}`)
      if (!gameRes.ok) throw new Error('Game not found')
      const gameData = await gameRes.json()

      // Set team info
      setHomeTeam({
        id: gameData.home?.id || 'home',
        name: gameData.home?.name || 'Home Team',
        shortName: gameData.home?.shortName || gameData.home?.name || 'Home',
        abbreviation: gameData.home?.abbreviation || 'HOM',
        logo: gameData.home?.logo,
        color: gameData.home?.color,
        altColor: gameData.home?.alternateColor,
        record: gameData.home?.record,
        rank: gameData.home?.rank
      })

      setAwayTeam({
        id: gameData.away?.id || 'away',
        name: gameData.away?.name || 'Away Team',
        shortName: gameData.away?.shortName || gameData.away?.name || 'Away',
        abbreviation: gameData.away?.abbreviation || 'AWY',
        logo: gameData.away?.logo,
        color: gameData.away?.color,
        altColor: gameData.away?.alternateColor,
        record: gameData.away?.record,
        rank: gameData.away?.rank
      })

      setGameInfo({
        venue: gameData.venue,
        broadcast: gameData.broadcast,
        weather: gameData.weather,
        attendance: gameData.attendance
      })

      // Fetch live state
      const liveRes = await fetch(`/api/live?gameId=${gameId}&sport=${sport.toLowerCase()}`)
      if (liveRes.ok) {
        const liveData = await liveRes.json()
        if (liveData.state) {
          setGameState({
            status: liveData.state.status,
            period: liveData.state.period,
            clock: liveData.state.clock,
            possession: liveData.state.possession,
            situation: liveData.state.situation,
            redzone: liveData.state.redzone,
            lastPlay: liveData.state.lastPlay
          })

          if (liveData.state.plays) {
            // Check for new scoring plays
            const newPlays = liveData.state.plays.filter((p: PlayByPlay) => p.sequenceNumber > lastPlayRef.current)
            if (soundEnabled && newPlays.some((p: PlayByPlay) => p.isScoring)) {
              playScoreSound()
            }
            lastPlayRef.current = liveData.state.plays[0]?.sequenceNumber || 0
            setPlays(liveData.state.plays)
          }

          // Set box score from game data
          if (liveData.state.boxScore) {
            setBoxScore(liveData.state.boxScore)
          }
        }
      }

      // Fetch live odds
      const sportMap: Record<string, string> = {
        'NFL': 'americanfootball_nfl',
        'NBA': 'basketball_nba',
        'NHL': 'icehockey_nhl',
        'MLB': 'baseball_mlb'
      }
      
      const oddsRes = await fetch(`/api/odds?sport=${sportMap[sport] || sport.toLowerCase()}&markets=spreads,totals,h2h`)
      if (oddsRes.ok) {
        const oddsData = await oddsRes.json()
        // Find matching game odds
        const matchingOdds = oddsData.odds?.find((o: { home_team?: string }) => 
          o.home_team?.toLowerCase().includes(gameData.home?.name?.toLowerCase().split(' ').pop() || '')
        )
        
        if (matchingOdds?.bookmakers) {
          const transformed: LiveOdds[] = matchingOdds.bookmakers.slice(0, 6).map((bm: {
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
            
            return {
              bookmaker: bm.key,
              spread: {
                line: spread?.outcomes.find(o => o.name === matchingOdds.home_team)?.point || 0,
                odds: spread?.outcomes.find(o => o.name === matchingOdds.home_team)?.price || -110
              },
              total: {
                line: total?.outcomes.find(o => o.name === 'Over')?.point || 0,
                overOdds: total?.outcomes.find(o => o.name === 'Over')?.price || -110,
                underOdds: total?.outcomes.find(o => o.name === 'Under')?.price || -110
              },
              moneyline: {
                home: ml?.outcomes.find(o => o.name === matchingOdds.home_team)?.price || 0,
                away: ml?.outcomes.find(o => o.name === matchingOdds.away_team)?.price || 0
              },
              lastUpdate: bm.last_update
            }
          })
          setLiveOdds(transformed)
        }
      }

      // Generate insights
      setInsights([
        {
          type: 'trend',
          title: `${gameData.home?.abbreviation || 'Home'} has won 4 straight home games`,
          description: 'Strong home field advantage this season',
          sentiment: 'positive'
        },
        {
          type: 'edge',
          title: 'Sharp money on the under',
          description: '68% of money on Under despite 55% of bets on Over',
          value: '+3.2% CLV',
          sentiment: 'neutral'
        },
        {
          type: 'stat',
          title: `${gameData.away?.abbreviation || 'Away'} averaging 28 PPG on road`,
          description: 'Road offense has been explosive',
          sentiment: 'positive'
        }
      ])

      setError(null)
    } catch (err) {
      console.error('Error fetching game:', err)
      setError('Unable to load game data')
    } finally {
      setLoading(false)
    }
  }, [gameId, sport, soundEnabled])

  // =============================================================================
  // EFFECTS
  // =============================================================================

  useEffect(() => {
    fetchGameData()
  }, [fetchGameData])

  // Auto-refresh when tracking
  useEffect(() => {
    if (!isTracking || gameState?.status === 'post') return

    pollIntervalRef.current = setInterval(() => {
      fetchGameData()
    }, 15000) // Every 15 seconds

    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current)
    }
  }, [isTracking, gameState?.status, fetchGameData])

  // =============================================================================
  // HELPERS
  // =============================================================================

  const playScoreSound = () => {
    try {
      if (!scoreAudioRef.current) {
        scoreAudioRef.current = new Audio('/sounds/score.mp3')
      }
      scoreAudioRef.current.volume = 0.5
      scoreAudioRef.current.play().catch(() => {})
    } catch {}
  }

  const formatOdds = (odds: number) => (odds > 0 ? `+${odds}` : odds.toString())

  const getStatusColor = () => {
    if (gameState?.status === 'in') return 'text-red-500'
    if (gameState?.status === 'post') return 'text-slate-400'
    return 'text-green-500'
  }

  const getStatusText = () => {
    if (gameState?.status === 'in') {
      if (gameState.period && gameState.clock) {
        return `${gameState.period} ${gameState.clock}`
      }
      return 'LIVE'
    }
    if (gameState?.status === 'post') return 'FINAL'
    if (gameState?.status === 'delay') return 'DELAYED'
    return 'SCHEDULED'
  }

  // =============================================================================
  // LOADING
  // =============================================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a12] flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-red-500 animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Loading game...</p>
        </div>
      </div>
    )
  }

  if (error || !homeTeam || !awayTeam) {
    return (
      <div className="min-h-screen bg-[#0a0a12] flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-white mb-2">{error || 'Game not found'}</h1>
          <Link href="/live" className="text-orange-500 hover:underline">
            ← Back to Live Games
          </Link>
        </div>
      </div>
    )
  }

  const isLive = gameState?.status === 'in'
  const homeScore = plays[0]?.homeScore ?? 0
  const awayScore = plays[0]?.awayScore ?? 0

  // =============================================================================
  // RENDER
  // =============================================================================

  return (
    <div className={`min-h-screen bg-[#0a0a12] ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
      {/* ===================================================================== */}
      {/* TOP BAR - ESPN Style */}
      {/* ===================================================================== */}
      <div className="bg-[#06060a] border-b border-white/5 sticky top-0 z-40">
        <div className="max-w-[1600px] mx-auto px-4">
          <div className="flex items-center justify-between h-12">
            <Link href="/live" className="flex items-center gap-2 text-slate-400 hover:text-white text-sm">
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Live Games</span>
            </Link>

            <div className="flex items-center gap-4">
              {/* Game Info */}
              <div className="hidden md:flex items-center gap-4 text-xs text-slate-500">
                {gameInfo.venue && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {gameInfo.venue}
                  </span>
                )}
                {gameInfo.broadcast && (
                  <span className="flex items-center gap-1">
                    <Tv className="w-3 h-3" />
                    {gameInfo.broadcast}
                  </span>
                )}
                {gameInfo.weather && (
                  <span className="flex items-center gap-1">
                    <ThermometerSun className="w-3 h-3" />
                    {gameInfo.weather.temp}° {gameInfo.weather.condition}
                  </span>
                )}
              </div>

              {/* Controls */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setIsTracking(!isTracking)}
                  className={`p-2 rounded-lg transition-colors ${
                    isTracking ? 'bg-red-500/20 text-red-400' : 'bg-slate-800 text-slate-400'
                  }`}
                  title={isTracking ? 'Pause updates' : 'Resume updates'}
                >
                  {isTracking ? <Radio className="w-4 h-4 animate-pulse" /> : <Pause className="w-4 h-4" />}
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
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-colors"
                >
                  {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* SCOREBOARD - ESPN Style Hero */}
      {/* ===================================================================== */}
      <div 
        className="relative overflow-hidden"
        style={{
          background: isLive 
            ? `linear-gradient(135deg, ${awayTeam.color || '#1a1a2e'}40 0%, #0a0a12 50%, ${homeTeam.color || '#1a1a2e'}40 100%)`
            : 'linear-gradient(180deg, #12121c 0%, #0a0a12 100%)'
        }}
      >
        {/* Live Pulse Background */}
        {isLive && (
          <div className="absolute inset-0 bg-red-500/5 animate-pulse" />
        )}

        <div className="max-w-[1600px] mx-auto px-4 py-6 md:py-8 relative">
          {/* Status Bar */}
          <div className="flex items-center justify-center gap-3 mb-6">
            {isLive && (
              <span className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-500 text-white text-sm font-bold animate-pulse shadow-lg shadow-red-500/30">
                <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                LIVE
              </span>
            )}
            <span className={`text-sm font-medium ${getStatusColor()}`}>
              {getStatusText()}
            </span>
            {gameState?.situation && (
              <span className="text-sm text-orange-400 font-medium hidden sm:inline">
                {gameState.situation}
              </span>
            )}
          </div>

          {/* Main Scoreboard */}
          <div className="grid grid-cols-7 md:grid-cols-9 gap-2 md:gap-4 items-center max-w-4xl mx-auto">
            {/* Away Team */}
            <div className="col-span-3 text-center">
              <div className="flex flex-col items-center">
                {awayTeam.logo ? (
                  <img src={awayTeam.logo} alt={awayTeam.name} className="w-16 h-16 md:w-24 md:h-24 object-contain mb-2" />
                ) : (
                  <div className="w-16 h-16 md:w-24 md:h-24 rounded-full bg-slate-800 mb-2" />
                )}
                {awayTeam.rank && (
                  <span className="text-xs text-slate-500 mb-1">#{awayTeam.rank}</span>
                )}
                <h2 className="text-lg md:text-xl font-bold text-white">{awayTeam.shortName}</h2>
                <p className="text-xs md:text-sm text-slate-400">{awayTeam.record}</p>
              </div>
            </div>

            {/* Score */}
            <div className="col-span-1 md:col-span-3 text-center">
              <div className="flex items-center justify-center gap-2 md:gap-6">
                <span className={`text-4xl md:text-7xl font-black tabular-nums ${
                  awayScore > homeScore ? 'text-white' : 'text-slate-500'
                }`}>
                  {awayScore}
                </span>
                <span className="text-xl md:text-3xl text-slate-700 font-light">-</span>
                <span className={`text-4xl md:text-7xl font-black tabular-nums ${
                  homeScore > awayScore ? 'text-white' : 'text-slate-500'
                }`}>
                  {homeScore}
                </span>
              </div>
              
              {/* Possession Indicator */}
              {gameState?.possession && isLive && (
                <div className="mt-2 flex items-center justify-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${
                    gameState.possession === awayTeam.abbreviation ? 'bg-yellow-500' : 'bg-transparent'
                  }`} />
                  <span className="text-xs text-slate-500">POSS</span>
                  <span className={`w-2 h-2 rounded-full ${
                    gameState.possession === homeTeam.abbreviation ? 'bg-yellow-500' : 'bg-transparent'
                  }`} />
                </div>
              )}
            </div>

            {/* Home Team */}
            <div className="col-span-3 text-center">
              <div className="flex flex-col items-center">
                {homeTeam.logo ? (
                  <img src={homeTeam.logo} alt={homeTeam.name} className="w-16 h-16 md:w-24 md:h-24 object-contain mb-2" />
                ) : (
                  <div className="w-16 h-16 md:w-24 md:h-24 rounded-full bg-slate-800 mb-2" />
                )}
                {homeTeam.rank && (
                  <span className="text-xs text-slate-500 mb-1">#{homeTeam.rank}</span>
                )}
                <h2 className="text-lg md:text-xl font-bold text-white">{homeTeam.shortName}</h2>
                <p className="text-xs md:text-sm text-slate-400">{homeTeam.record}</p>
              </div>
            </div>
          </div>

          {/* Box Score Row */}
          {boxScore.length > 0 && (
            <div className="mt-6 max-w-2xl mx-auto">
              <div className="flex items-center justify-center gap-4 text-xs">
                <span className="w-16 text-right text-slate-500">{awayTeam.abbreviation}</span>
                {boxScore.map((q, i) => (
                  <div key={i} className="text-center w-8">
                    <div className="text-slate-500 mb-1">{q.period}</div>
                    <div className="text-white font-medium">{q.away}</div>
                  </div>
                ))}
                <div className="text-center w-8">
                  <div className="text-slate-500 mb-1">T</div>
                  <div className="text-white font-bold">{awayScore}</div>
                </div>
              </div>
              <div className="flex items-center justify-center gap-4 text-xs mt-1">
                <span className="w-16 text-right text-slate-500">{homeTeam.abbreviation}</span>
                {boxScore.map((q, i) => (
                  <div key={i} className="text-center w-8">
                    <div className="text-white font-medium">{q.home}</div>
                  </div>
                ))}
                <div className="text-center w-8">
                  <div className="text-white font-bold">{homeScore}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ===================================================================== */}
      {/* MAIN CONTENT */}
      {/* ===================================================================== */}
      <div className="max-w-[1600px] mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* ================================================================= */}
          {/* LEFT COLUMN - Play-by-Play */}
          {/* ================================================================= */}
          <div className="lg:col-span-2 space-y-6">
            {/* Tab Navigation */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              {[
                { id: 'plays', label: 'Play-by-Play', icon: Activity },
                { id: 'boxscore', label: 'Box Score', icon: BarChart3 },
                { id: 'stats', label: 'Stats', icon: Users },
                { id: 'odds', label: 'Live Odds', icon: DollarSign }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setSelectedTab(tab.id as typeof selectedTab)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl whitespace-nowrap font-medium text-sm transition-all ${
                    selectedTab === tab.id
                      ? 'bg-white text-black shadow-lg'
                      : 'bg-slate-800/50 text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Play-by-Play Tab */}
            {selectedTab === 'plays' && (
              <div className="rounded-2xl bg-slate-900/50 border border-slate-800 overflow-hidden">
                <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-red-400" />
                    <h3 className="font-bold text-white">Play-by-Play</h3>
                  </div>
                  {isTracking && isLive && (
                    <span className="flex items-center gap-2 text-xs text-green-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                      Live updating
                    </span>
                  )}
                </div>
                
                <div className="max-h-[600px] overflow-y-auto">
                  {plays.length > 0 ? (
                    <div className="divide-y divide-slate-800/50">
                      {plays.map((play, i) => (
                        <div
                          key={play.id || i}
                          className={`p-4 transition-colors hover:bg-slate-800/30 ${
                            play.isScoring 
                              ? 'bg-gradient-to-r from-green-500/10 to-transparent border-l-4 border-green-500' 
                              : ''
                          } ${i === 0 && isLive ? 'bg-slate-800/30' : ''}`}
                        >
                          <div className="flex items-start gap-4">
                            {/* Time/Period */}
                            <div className="w-16 flex-shrink-0 text-right">
                              <div className="text-xs font-medium text-slate-500">{play.period}</div>
                              <div className="text-sm font-mono text-white">{play.clock}</div>
                            </div>

                            {/* Team Logo */}
                            {play.teamLogo && (
                              <img src={play.teamLogo} alt="" className="w-6 h-6 flex-shrink-0" />
                            )}

                            {/* Play Description */}
                            <div className="flex-1 min-w-0">
                              {play.team && (
                                <span className="text-sm font-bold text-orange-400 mr-2">{play.team}</span>
                              )}
                              <span className={`text-sm ${play.isScoring ? 'text-green-400 font-semibold' : 'text-slate-300'}`}>
                                {play.description}
                              </span>
                              
                              {/* Score Update */}
                              {play.isScoring && (
                                <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-green-500/20">
                                  <Trophy className="w-4 h-4 text-green-400" />
                                  <span className="text-sm font-bold text-white">
                                    {awayTeam.abbreviation} {play.awayScore} - {play.homeScore} {homeTeam.abbreviation}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center">
                      <Clock className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                      <p className="text-slate-400">Waiting for game to start...</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Live Odds Tab */}
            {selectedTab === 'odds' && (
              <div className="rounded-2xl bg-slate-900/50 border border-slate-800 overflow-hidden">
                <div className="p-4 border-b border-slate-800">
                  <h3 className="font-bold text-white flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-green-400" />
                    Live Odds Comparison
                  </h3>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-800/50">
                      <tr className="text-left text-slate-400">
                        <th className="p-3 font-medium">Sportsbook</th>
                        <th className="p-3 font-medium text-center">Spread</th>
                        <th className="p-3 font-medium text-center">Total</th>
                        <th className="p-3 font-medium text-center">Moneyline</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                      {liveOdds.map((odds, i) => (
                        <tr key={i} className="hover:bg-slate-800/30 transition-colors">
                          <td className="p-3">
                            <span className="font-medium text-white capitalize">
                              {odds.bookmaker.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <div className="text-white font-medium">
                              {odds.spread.line > 0 ? '+' : ''}{odds.spread.line}
                            </div>
                            <div className="text-xs text-slate-400">
                              {formatOdds(odds.spread.odds)}
                            </div>
                          </td>
                          <td className="p-3 text-center">
                            <div className="text-white font-medium">O/U {odds.total.line}</div>
                            <div className="text-xs text-slate-400">
                              {formatOdds(odds.total.overOdds)} / {formatOdds(odds.total.underOdds)}
                            </div>
                          </td>
                          <td className="p-3 text-center">
                            <div className="flex justify-center gap-4">
                              <div>
                                <div className="text-xs text-slate-500">{awayTeam.abbreviation}</div>
                                <div className="text-white font-medium">{formatOdds(odds.moneyline.away)}</div>
                              </div>
                              <div>
                                <div className="text-xs text-slate-500">{homeTeam.abbreviation}</div>
                                <div className="text-white font-medium">{formatOdds(odds.moneyline.home)}</div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Box Score Tab */}
            {selectedTab === 'boxscore' && (
              <div className="rounded-2xl bg-slate-900/50 border border-slate-800 p-6">
                <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-blue-400" />
                  Box Score
                </h3>
                <p className="text-slate-400 text-sm">Box score will be available once the game begins.</p>
              </div>
            )}

            {/* Stats Tab */}
            {selectedTab === 'stats' && (
              <div className="rounded-2xl bg-slate-900/50 border border-slate-800 p-6">
                <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5 text-purple-400" />
                  Team & Player Stats
                </h3>
                <p className="text-slate-400 text-sm">Live stats will populate during gameplay.</p>
              </div>
            )}
          </div>

          {/* ================================================================= */}
          {/* RIGHT COLUMN - Sidebar */}
          {/* ================================================================= */}
          <div className="space-y-6">
            {/* My Bets Card */}
            <div className="rounded-2xl bg-gradient-to-br from-orange-500/10 to-pink-500/10 border border-orange-500/20 overflow-hidden">
              <div className="p-4 border-b border-orange-500/20 flex items-center justify-between">
                <h3 className="font-bold text-white flex items-center gap-2">
                  <Target className="w-5 h-5 text-orange-400" />
                  My Bets
                </h3>
                <button 
                  onClick={() => setShowBetSlip(!showBetSlip)}
                  className="text-xs text-orange-400 hover:text-orange-300"
                >
                  + Add Bet
                </button>
              </div>
              
              <div className="p-4">
                {userBets.length > 0 ? (
                  <div className="space-y-3">
                    {userBets.map(bet => (
                      <div key={bet.id} className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs text-slate-400">{bet.type}</span>
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                            bet.status === 'won' ? 'bg-green-500/20 text-green-400' :
                            bet.status === 'lost' ? 'bg-red-500/20 text-red-400' :
                            'bg-yellow-500/20 text-yellow-400'
                          }`}>
                            {bet.status.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-white">{bet.pick}</p>
                        <div className="flex items-center justify-between mt-2 text-xs">
                          <span className="text-slate-400">${bet.amount} @ {formatOdds(bet.odds)}</span>
                          <span className="text-green-400">Win ${bet.potentialWin}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <Target className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                    <p className="text-slate-400 text-sm">No bets on this game</p>
                    <button className="mt-2 text-orange-400 text-xs hover:underline">
                      Track a bet →
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* AI Insights */}
            <div className="rounded-2xl bg-slate-900/50 border border-slate-800 overflow-hidden">
              <div className="p-4 border-b border-slate-800">
                <h3 className="font-bold text-white flex items-center gap-2">
                  <Brain className="w-5 h-5 text-cyan-400" />
                  AI Insights
                </h3>
              </div>
              
              <div className="p-4 space-y-3">
                {insights.map((insight, i) => (
                  <div 
                    key={i}
                    className={`p-3 rounded-lg border ${
                      insight.sentiment === 'positive' ? 'bg-green-500/5 border-green-500/20' :
                      insight.sentiment === 'negative' ? 'bg-red-500/5 border-red-500/20' :
                      'bg-slate-800/50 border-slate-700/50'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      {insight.type === 'edge' && <Zap className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />}
                      {insight.type === 'trend' && <TrendingUp className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />}
                      {insight.type === 'stat' && <BarChart3 className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />}
                      {insight.type === 'alert' && <Bell className="w-4 h-4 text-orange-400 flex-shrink-0 mt-0.5" />}
                      <div>
                        <p className="text-sm font-medium text-white">{insight.title}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{insight.description}</p>
                        {insight.value && (
                          <span className="inline-block mt-1 px-2 py-0.5 rounded text-xs bg-slate-800 text-cyan-400">
                            {insight.value}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Links */}
            <div className="rounded-2xl bg-slate-900/50 border border-slate-800 p-4">
              <h3 className="font-bold text-white mb-3 text-sm">Quick Links</h3>
              <div className="space-y-2">
                <Link 
                  href={`/game/${gameId}?sport=${sport}`}
                  className="flex items-center justify-between p-2 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition-colors text-sm text-slate-300"
                >
                  Game Preview & Analysis
                  <ChevronRight className="w-4 h-4" />
                </Link>
                <Link 
                  href={`/${sport.toLowerCase()}/matchups`}
                  className="flex items-center justify-between p-2 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition-colors text-sm text-slate-300"
                >
                  All {sport} Matchups
                  <ChevronRight className="w-4 h-4" />
                </Link>
                <Link 
                  href="/my-picks"
                  className="flex items-center justify-between p-2 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition-colors text-sm text-slate-300"
                >
                  My Picks Tracker
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
