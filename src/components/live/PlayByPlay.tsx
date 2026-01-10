'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { 
  Play, Pause, RefreshCw, Volume2, VolumeX, Clock, Target,
  TrendingUp, TrendingDown, AlertCircle, Zap, Radio
} from 'lucide-react'

interface PlayByPlayEvent {
  id: string
  gameId: string
  sequenceNumber: number
  timestamp: string
  clock: string
  period: number | string
  type: 'play' | 'score' | 'timeout' | 'penalty' | 'substitution' | 'review' | 'injury' | 'other'
  team?: string
  teamAbbr?: string
  description: string
  scoreHome?: number
  scoreAway?: number
  isScoring?: boolean
}

interface LiveGameState {
  gameId: string
  sport: string
  status: 'pre' | 'in' | 'post' | 'delayed' | 'postponed'
  period: number | string
  clock: string
  homeScore: number
  awayScore: number
  possession?: string
  situation?: string
  lastPlay?: PlayByPlayEvent
  lastUpdate: string
  plays: PlayByPlayEvent[]
}

interface LivePlayByPlayProps {
  gameId: string
  sport: string
  homeName: string
  awayName: string
  homeAbbr: string
  awayAbbr: string
}

export function LivePlayByPlay({ 
  gameId, 
  sport, 
  homeName, 
  awayName,
  homeAbbr,
  awayAbbr 
}: LivePlayByPlayProps) {
  const [gameState, setGameState] = useState<LiveGameState | null>(null)
  const [isLive, setIsLive] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastSequence, setLastSequence] = useState(0)
  const [newPlayIds, setNewPlayIds] = useState<Set<string>>(new Set())
  const [soundEnabled, setSoundEnabled] = useState(false)
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const playsContainerRef = useRef<HTMLDivElement>(null)

  // Fetch initial state
  const fetchGameState = useCallback(async () => {
    try {
      const res = await fetch(`/api/live?gameId=${gameId}&sport=${sport}&mode=state`)
      const data = await res.json()
      
      if (data.success && data.game) {
        setGameState(data.game)
        setIsLive(data.game.status === 'in')
        setLastSequence(data.game.plays[0]?.sequenceNumber || 0)
        setError(null)
      } else {
        setError(data.error || 'Failed to load game')
        setIsLive(false)
      }
    } catch (err) {
      setError('Connection error')
      setIsLive(false)
    }
  }, [gameId, sport])

  // Poll for updates
  const pollUpdates = useCallback(async () => {
    if (isPaused || !isLive) return
    
    try {
      const res = await fetch(
        `/api/live?gameId=${gameId}&sport=${sport}&mode=poll&lastSequence=${lastSequence}`
      )
      const data = await res.json()
      
      if (data.success && data.hasUpdates && data.state) {
        // Track new plays for animation
        const newIds = new Set<string>(data.newPlays.map((p: PlayByPlayEvent) => p.id))
        setNewPlayIds(newIds)
        
        // Clear highlight after animation
        setTimeout(() => setNewPlayIds(new Set<string>()), 3000)
        
        setGameState(data.state)
        setLastSequence(data.state.plays[0]?.sequenceNumber || lastSequence)
        
        // Play sound for scoring plays
        if (soundEnabled && data.newPlays.some((p: PlayByPlayEvent) => p.isScoring)) {
          playScoreSound()
        }
        
        // Auto-scroll to top for new plays
        if (playsContainerRef.current) {
          playsContainerRef.current.scrollTop = 0
        }
      }
      
      // Update game status
      if (data.state) {
        setIsLive(data.state.status === 'in')
      }
    } catch (err) {
      console.error('Poll error:', err)
    }
  }, [gameId, sport, lastSequence, isPaused, isLive, soundEnabled])

  // Set up polling interval
  useEffect(() => {
    fetchGameState()
    
    // Poll every 3 seconds for real-time updates
    pollIntervalRef.current = setInterval(pollUpdates, 3000)
    
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current)
      }
    }
  }, [fetchGameState, pollUpdates])

  const playScoreSound = () => {
    // Simple beep for scoring plays
    try {
      const audio = new Audio('/sounds/score.mp3')
      audio.volume = 0.3
      audio.play().catch(() => {})
    } catch {}
  }

  const getPlayTypeColor = (type: string, isScoring?: boolean) => {
    if (isScoring) return '#00FF88'
    switch (type) {
      case 'score': return '#00FF88'
      case 'penalty': return '#FF4455'
      case 'timeout': return '#FFD700'
      case 'injury': return '#FF6B00'
      case 'review': return '#808090'
      default: return '#FFF'
    }
  }

  const getPlayTypeIcon = (type: string) => {
    switch (type) {
      case 'score': return '🎯'
      case 'penalty': return '🚩'
      case 'timeout': return '⏸️'
      case 'injury': return '🏥'
      case 'review': return '📺'
      default: return '🏈'
    }
  }

  const formatPeriod = (period: number | string, sport: string) => {
    const sportLower = sport.toLowerCase()
    if (sportLower === 'nfl' || sportLower === 'ncaaf') {
      return `Q${period}`
    }
    if (sportLower === 'nba' || sportLower === 'ncaab') {
      return `Q${period}`
    }
    if (sportLower === 'nhl') {
      return `P${period}`
    }
    if (sportLower === 'mlb') {
      return period === 'top' || period === 'bottom' ? period : `${period}`
    }
    return `${period}`
  }

  if (error && !gameState) {
    return (
      <div className="rounded-xl p-6 text-center" style={{ background: 'rgba(255,68,85,0.1)', border: '1px solid rgba(255,68,85,0.2)' }}>
        <AlertCircle className="w-8 h-8 mx-auto mb-2" style={{ color: '#FF4455' }} />
        <p className="text-white font-medium">{error}</p>
        <button
          onClick={fetchGameState}
          className="mt-3 px-4 py-2 rounded-lg text-sm font-medium"
          style={{ background: 'rgba(255,255,255,0.1)', color: '#FFF' }}>
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="rounded-xl overflow-hidden" style={{ background: '#0c0c14', border: '1px solid rgba(255,255,255,0.06)' }}>
      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            {isLive ? (
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg" style={{ background: 'rgba(255,68,85,0.2)' }}>
                <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#FF4455' }} />
                <span className="text-xs font-bold" style={{ color: '#FF4455' }}>LIVE</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg" style={{ background: 'rgba(128,128,144,0.2)' }}>
                <Radio className="w-3 h-3" style={{ color: '#808090' }} />
                <span className="text-xs font-bold" style={{ color: '#808090' }}>
                  {gameState?.status === 'post' ? 'FINAL' : 'PREGAME'}
                </span>
              </div>
            )}
          </div>
          
          {gameState && isLive && (
            <div className="flex items-center gap-2 text-sm">
              <span className="font-bold" style={{ color: '#FF6B00' }}>
                {formatPeriod(gameState.period, sport)}
              </span>
              <span style={{ color: '#808090' }}>|</span>
              <span className="font-mono" style={{ color: '#FFF' }}>{gameState.clock || '0:00'}</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-2 rounded-lg hover:bg-white/10 transition-all"
            title={soundEnabled ? 'Mute' : 'Unmute'}>
            {soundEnabled ? (
              <Volume2 className="w-4 h-4" style={{ color: '#00FF88' }} />
            ) : (
              <VolumeX className="w-4 h-4" style={{ color: '#808090' }} />
            )}
          </button>
          
          <button
            onClick={() => setIsPaused(!isPaused)}
            className="p-2 rounded-lg hover:bg-white/10 transition-all"
            title={isPaused ? 'Resume' : 'Pause'}>
            {isPaused ? (
              <Play className="w-4 h-4" style={{ color: '#00FF88' }} />
            ) : (
              <Pause className="w-4 h-4" style={{ color: '#808090' }} />
            )}
          </button>
          
          <button
            onClick={fetchGameState}
            className="p-2 rounded-lg hover:bg-white/10 transition-all"
            title="Refresh">
            <RefreshCw className="w-4 h-4" style={{ color: '#808090' }} />
          </button>
        </div>
      </div>
      
      {/* Score Header */}
      {gameState && (
        <div className="px-4 py-3 flex items-center justify-center gap-6" style={{ background: 'rgba(255,107,0,0.05)' }}>
          <div className="text-center">
            <p className="text-xs font-medium" style={{ color: '#808090' }}>{awayAbbr}</p>
            <p className="text-2xl font-black" style={{ color: '#FFF' }}>{gameState.awayScore}</p>
          </div>
          <div className="text-sm font-bold" style={{ color: '#808090' }}>@</div>
          <div className="text-center">
            <p className="text-xs font-medium" style={{ color: '#808090' }}>{homeAbbr}</p>
            <p className="text-2xl font-black" style={{ color: '#FFF' }}>{gameState.homeScore}</p>
          </div>
        </div>
      )}
      
      {/* Situation */}
      {gameState?.situation && (
        <div className="px-4 py-2 text-center" style={{ background: 'rgba(255,215,0,0.1)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <p className="text-sm font-medium" style={{ color: '#FFD700' }}>{gameState.situation}</p>
        </div>
      )}
      
      {/* Play-by-Play Feed */}
      <div 
        ref={playsContainerRef}
        className="max-h-[400px] overflow-y-auto"
        style={{ scrollBehavior: 'smooth' }}>
        {gameState?.plays && gameState.plays.length > 0 ? (
          <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.03)' }}>
            {gameState.plays.map((play, index) => (
              <div 
                key={play.id}
                className={`px-4 py-3 transition-all ${newPlayIds.has(play.id) ? 'animate-pulse' : ''}`}
                style={{ 
                  background: newPlayIds.has(play.id) 
                    ? 'rgba(255,107,0,0.15)' 
                    : index === 0 
                      ? 'rgba(255,255,255,0.02)' 
                      : 'transparent'
                }}>
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-lg"
                       style={{ background: `${getPlayTypeColor(play.type, play.isScoring)}15` }}>
                    {getPlayTypeIcon(play.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {play.teamAbbr && (
                        <span className="text-xs font-bold px-1.5 py-0.5 rounded"
                              style={{ background: 'rgba(255,107,0,0.2)', color: '#FF6B00' }}>
                          {play.teamAbbr}
                        </span>
                      )}
                      <span className="text-xs" style={{ color: '#606070' }}>
                        {formatPeriod(play.period, sport)} • {play.clock}
                      </span>
                      {play.isScoring && (
                        <span className="text-xs font-bold px-1.5 py-0.5 rounded"
                              style={{ background: 'rgba(0,255,136,0.2)', color: '#00FF88' }}>
                          SCORE
                        </span>
                      )}
                    </div>
                    
                    <p className="text-sm" style={{ color: getPlayTypeColor(play.type, play.isScoring) }}>
                      {play.description}
                    </p>
                    
                    {(play.scoreHome !== undefined && play.scoreAway !== undefined) && (
                      <p className="text-xs mt-1" style={{ color: '#808090' }}>
                        Score: {awayAbbr} {play.scoreAway} - {homeAbbr} {play.scoreHome}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="px-4 py-8 text-center">
            <Clock className="w-8 h-8 mx-auto mb-2" style={{ color: '#808090' }} />
            <p className="text-sm" style={{ color: '#808090' }}>
              {isLive ? 'Waiting for plays...' : 'Play-by-play will appear when the game starts'}
            </p>
          </div>
        )}
      </div>
      
      {/* Footer */}
      <div className="px-4 py-2 flex items-center justify-between text-xs" style={{ borderTop: '1px solid rgba(255,255,255,0.06)', color: '#606070' }}>
        <span>
          {gameState ? `${gameState.plays.length} plays` : ''}
        </span>
        <span>
          Updated: {gameState ? new Date(gameState.lastUpdate).toLocaleTimeString() : '-'}
        </span>
      </div>
    </div>
  )
}
