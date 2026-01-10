'use client'

import { useState, useEffect, useRef } from 'react'
import { 
  Activity, Clock, Zap, TrendingUp, TrendingDown, 
  AlertTriangle, Target, Play, Circle, ChevronDown,
  Volume2, Bell, Share2, Star, Flame, ArrowUp, ArrowDown
} from 'lucide-react'

interface Play {
  id: string
  time: string
  period: string
  team: string
  teamAbbr: string
  type: 'score' | 'turnover' | 'foul' | 'timeout' | 'substitution' | 'other'
  description: string
  scoreChange?: { home: number; away: number }
  isKeyPlay: boolean
  homeScore: number
  awayScore: number
}

interface LiveOdds {
  spread: number
  total: number
  homeML: number
  awayML: number
  movement: 'up' | 'down' | 'stable'
  lastUpdate: string
}

interface PlayByPlayProps {
  gameId: string
  homeTeam: { name: string; abbr: string; color?: string }
  awayTeam: { name: string; abbr: string; color?: string }
  status: 'live' | 'scheduled' | 'final'
  currentScore?: { home: number; away: number }
  period?: string
  clock?: string
}

export function PlayByPlay({ 
  gameId, 
  homeTeam, 
  awayTeam, 
  status, 
  currentScore = { home: 0, away: 0 },
  period,
  clock 
}: PlayByPlayProps) {
  const [plays, setPlays] = useState<Play[]>([])
  const [liveOdds, setLiveOdds] = useState<LiveOdds | null>(null)
  const [autoScroll, setAutoScroll] = useState(true)
  const [notifications, setNotifications] = useState(true)
  const [expandedView, setExpandedView] = useState(false)
  const [keyPlaysOnly, setKeyPlaysOnly] = useState(false)
  const playListRef = useRef<HTMLDivElement>(null)

  // Mock play-by-play data - in production would connect to WebSocket
  useEffect(() => {
    if (status !== 'live') return

    // Generate initial plays
    const initialPlays: Play[] = [
      {
        id: '1',
        time: '12:00',
        period: '1Q',
        team: awayTeam.name,
        teamAbbr: awayTeam.abbr,
        type: 'other',
        description: `${awayTeam.name} wins the opening tip`,
        isKeyPlay: false,
        homeScore: 0,
        awayScore: 0
      },
      {
        id: '2',
        time: '11:32',
        period: '1Q',
        team: awayTeam.name,
        teamAbbr: awayTeam.abbr,
        type: 'score',
        description: `J. Smith hits a three-pointer from the corner`,
        scoreChange: { home: 0, away: 3 },
        isKeyPlay: true,
        homeScore: 0,
        awayScore: 3
      },
      {
        id: '3',
        time: '11:15',
        period: '1Q',
        team: homeTeam.name,
        teamAbbr: homeTeam.abbr,
        type: 'turnover',
        description: `${homeTeam.abbr} turnover - bad pass`,
        isKeyPlay: false,
        homeScore: 0,
        awayScore: 3
      },
    ]
    setPlays(initialPlays)

    // Set initial odds
    setLiveOdds({
      spread: -3.5,
      total: 225.5,
      homeML: -150,
      awayML: +130,
      movement: 'stable',
      lastUpdate: new Date().toISOString()
    })

    // Simulate new plays every 15 seconds
    const playInterval = setInterval(() => {
      const newPlay: Play = generateRandomPlay(homeTeam, awayTeam, plays.length + 1)
      setPlays(prev => [newPlay, ...prev])
      
      // Auto scroll to top for new plays
      if (autoScroll && playListRef.current) {
        playListRef.current.scrollTop = 0
      }

      // Notify for key plays
      if (notifications && newPlay.isKeyPlay) {
        // In production, trigger push notification
        console.log('Key play notification:', newPlay.description)
      }
    }, 15000)

    // Simulate odds updates every 30 seconds
    const oddsInterval = setInterval(() => {
      setLiveOdds(prev => {
        if (!prev) return prev
        const movement = Math.random()
        return {
          ...prev,
          spread: prev.spread + (movement > 0.5 ? 0.5 : -0.5) * (Math.random() > 0.7 ? 1 : 0),
          total: prev.total + (movement > 0.5 ? 1 : -1) * (Math.random() > 0.6 ? 1 : 0),
          movement: movement > 0.6 ? 'up' : movement < 0.4 ? 'down' : 'stable',
          lastUpdate: new Date().toISOString()
        }
      })
    }, 30000)

    return () => {
      clearInterval(playInterval)
      clearInterval(oddsInterval)
    }
  }, [status, autoScroll, notifications, homeTeam, awayTeam])

  const displayPlays = keyPlaysOnly ? plays.filter(p => p.isKeyPlay) : plays

  if (status !== 'live') {
    return (
      <div className="game-card rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-5 h-5 text-muted" />
          <span className="text-secondary">
            {status === 'scheduled' ? 'Play-by-play will be available when the game starts' : 'Game has ended'}
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className={`game-card rounded-xl overflow-hidden ${expandedView ? 'fixed inset-4 z-50' : ''}`}>
      {/* Live Header */}
      <div className="p-4 bg-gradient-to-r from-red-900/30 to-orange-900/30 border-b border-red-500/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
              <span className="text-sm font-bold text-red-400">LIVE</span>
            </div>
            <span className="text-secondary text-sm">{period} • {clock}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setNotifications(!notifications)}
              className={`p-2 rounded-lg transition-colors ${notifications ? 'bg-accent-soft text-accent' : 'bg-card-inner text-muted'}`}
              title="Toggle notifications"
            >
              <Bell className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setExpandedView(!expandedView)}
              className="p-2 rounded-lg bg-card-inner text-secondary hover:text-primary transition-colors"
              title="Toggle fullscreen"
            >
              <ChevronDown className={`w-4 h-4 transition-transform ${expandedView ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>

        {/* Live Score */}
        <div className="flex items-center justify-center gap-8 mt-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{awayTeam.abbr}</div>
            <div className="text-4xl font-black text-primary">{currentScore.away}</div>
          </div>
          <div className="text-muted text-lg">@</div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{homeTeam.abbr}</div>
            <div className="text-4xl font-black text-primary">{currentScore.home}</div>
          </div>
        </div>
      </div>

      {/* Live Odds Strip */}
      {liveOdds && (
        <div className="flex items-center justify-around p-3 bg-card-inner border-b border-card">
          <div className="text-center">
            <div className="text-xs text-muted uppercase">Spread</div>
            <div className="flex items-center gap-1">
              <span className="text-sm font-bold text-primary">
                {homeTeam.abbr} {liveOdds.spread > 0 ? '+' : ''}{liveOdds.spread}
              </span>
              {liveOdds.movement !== 'stable' && (
                liveOdds.movement === 'up' 
                  ? <ArrowUp className="w-3 h-3 text-success" />
                  : <ArrowDown className="w-3 h-3 text-danger" />
              )}
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-muted uppercase">Total</div>
            <div className="text-sm font-bold text-primary">O/U {liveOdds.total}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-muted uppercase">ML</div>
            <div className="text-sm font-bold text-primary">{homeTeam.abbr} {liveOdds.homeML}</div>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="flex items-center justify-between p-3 border-b border-card">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setKeyPlaysOnly(!keyPlaysOnly)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              keyPlaysOnly ? 'bg-accent text-white' : 'bg-card-inner text-secondary'
            }`}
          >
            <Flame className="w-3 h-3 inline mr-1" />
            Key Plays Only
          </button>
          <button
            onClick={() => setAutoScroll(!autoScroll)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              autoScroll ? 'bg-success-soft text-success' : 'bg-card-inner text-secondary'
            }`}
          >
            Auto-scroll {autoScroll ? 'ON' : 'OFF'}
          </button>
        </div>
        <span className="text-xs text-muted">{displayPlays.length} plays</span>
      </div>

      {/* Play List */}
      <div 
        ref={playListRef}
        className={`overflow-y-auto ${expandedView ? 'h-[calc(100vh-300px)]' : 'max-h-96'}`}
      >
        {displayPlays.length === 0 ? (
          <div className="p-8 text-center">
            <Activity className="w-8 h-8 mx-auto mb-2 text-muted animate-pulse" />
            <p className="text-secondary">Waiting for plays...</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {displayPlays.map((play, idx) => (
              <PlayItem 
                key={play.id} 
                play={play} 
                isNew={idx === 0}
                homeTeam={homeTeam}
                awayTeam={awayTeam}
              />
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="p-3 border-t border-card bg-card-inner">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-accent-soft text-accent text-xs font-semibold hover:bg-accent/20 transition-colors">
              <Star className="w-3 h-3" />
              Track Game
            </button>
            <button className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-card-inner text-secondary text-xs font-semibold hover:text-primary transition-colors">
              <Share2 className="w-3 h-3" />
              Share
            </button>
          </div>
          <div className="text-xs text-muted">
            Updated {liveOdds ? new Date(liveOdds.lastUpdate).toLocaleTimeString('en-US', { 
              hour: 'numeric', 
              minute: '2-digit',
              timeZone: 'America/New_York'
            }) + ' ET' : 'now'}
          </div>
        </div>
      </div>
    </div>
  )
}

function PlayItem({ 
  play, 
  isNew,
  homeTeam,
  awayTeam 
}: { 
  play: Play
  isNew: boolean
  homeTeam: { name: string; abbr: string }
  awayTeam: { name: string; abbr: string }
}) {
  const isHomeTeam = play.teamAbbr === homeTeam.abbr

  const getPlayIcon = () => {
    switch (play.type) {
      case 'score':
        return <Target className="w-4 h-4 text-success" />
      case 'turnover':
        return <AlertTriangle className="w-4 h-4 text-danger" />
      case 'foul':
        return <Circle className="w-4 h-4 text-warning" />
      case 'timeout':
        return <Clock className="w-4 h-4 text-secondary" />
      default:
        return <Play className="w-4 h-4 text-muted" />
    }
  }

  return (
    <div className={`p-3 transition-colors ${isNew ? 'bg-accent-soft animate-pulse' : 'hover:bg-card-inner'}`}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          {getPlayIcon()}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-xs font-bold px-2 py-0.5 rounded ${
              isHomeTeam ? 'bg-blue-500/20 text-blue-400' : 'bg-orange-500/20 text-orange-400'
            }`}>
              {play.teamAbbr}
            </span>
            <span className="text-xs text-muted">{play.period} • {play.time}</span>
            {play.isKeyPlay && (
              <span className="flex items-center gap-1 text-xs font-bold text-accent">
                <Flame className="w-3 h-3" />
                KEY PLAY
              </span>
            )}
          </div>
          
          <p className="text-sm text-primary">{play.description}</p>
          
          {play.scoreChange && (
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs font-semibold text-success">
                +{play.scoreChange.away || play.scoreChange.home} pts
              </span>
              <span className="text-xs text-muted">
                Score: {play.awayScore} - {play.homeScore}
              </span>
            </div>
          )}
        </div>
        
        {play.type === 'score' && (
          <div className="flex-shrink-0">
            <Zap className="w-5 h-5 text-success animate-bounce" />
          </div>
        )}
      </div>
    </div>
  )
}

// Helper function to generate random plays
function generateRandomPlay(
  homeTeam: { name: string; abbr: string },
  awayTeam: { name: string; abbr: string },
  playNumber: number
): Play {
  const teams = [homeTeam, awayTeam]
  const team = teams[Math.floor(Math.random() * 2)]
  const isHome = team.abbr === homeTeam.abbr
  
  const playTypes: Play['type'][] = ['score', 'score', 'score', 'turnover', 'foul', 'timeout', 'substitution', 'other']
  const type = playTypes[Math.floor(Math.random() * playTypes.length)]
  
  const descriptions: Record<Play['type'], string[]> = {
    score: [
      `${team.abbr} scores on a fast break layup`,
      `Three-pointer from the top of the key`,
      `And-one! Drives to the basket and draws the foul`,
      `Mid-range jumper is good`,
      `Slam dunk by the power forward`,
    ],
    turnover: [
      `${team.abbr} turnover - bad pass`,
      `Steal by the point guard`,
      `Shot clock violation`,
      `Offensive foul called`,
    ],
    foul: [
      `Personal foul on the defender`,
      `Technical foul called`,
      `Flagrant foul warning`,
    ],
    timeout: [
      `${team.abbr} calls a timeout`,
      `Full timeout - ${team.abbr}`,
      `20-second timeout by ${team.abbr}`,
    ],
    substitution: [
      `${team.abbr} makes a substitution`,
      `Player change for ${team.abbr}`,
    ],
    other: [
      `${team.abbr} inbounds the ball`,
      `Free throw attempt`,
      `Rebound grabbed`,
    ]
  }

  const desc = descriptions[type] || descriptions.other
  const description = desc[Math.floor(Math.random() * desc.length)]
  
  const scorePoints = type === 'score' ? (Math.random() > 0.6 ? 3 : 2) : 0
  
  return {
    id: `play-${playNumber}`,
    time: `${Math.floor(Math.random() * 12)}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`,
    period: `${Math.floor(Math.random() * 4) + 1}Q`,
    team: team.name,
    teamAbbr: team.abbr,
    type,
    description,
    scoreChange: type === 'score' ? { 
      home: isHome ? scorePoints : 0, 
      away: !isHome ? scorePoints : 0 
    } : undefined,
    isKeyPlay: type === 'score' && Math.random() > 0.7,
    homeScore: 45 + Math.floor(Math.random() * 30),
    awayScore: 42 + Math.floor(Math.random() * 30),
  }
}

export default PlayByPlay
