'use client'

import { useState, useEffect, useCallback } from 'react'
import { 
  Activity, TrendingUp, TrendingDown, Zap, Clock, Bell, BellOff,
  ChevronRight, Target, BarChart3, Users, DollarSign, AlertTriangle,
  Flame, ArrowUpRight, ArrowDownRight, Play, Pause, Volume2, Share2
} from 'lucide-react'
import { PlayByPlay } from './PlayByPlay'

interface LiveGameDashboardProps {
  gameId: string
  sport: string
  homeTeam: {
    name: string
    abbr: string
    color?: string
    logo?: string
    record?: string
  }
  awayTeam: {
    name: string
    abbr: string
    color?: string
    logo?: string
    record?: string
  }
  currentScore: { home: number; away: number }
  period?: string
  clock?: string
  status: 'live' | 'scheduled' | 'final'
  venue?: string
  broadcast?: string
}

interface LiveBettingData {
  spread: { 
    line: number
    homeOdds: number
    awayOdds: number
    movement: 'up' | 'down' | 'stable'
  }
  total: { 
    line: number
    overOdds: number
    underOdds: number
    movement: 'up' | 'down' | 'stable'
  }
  moneyline: {
    home: number
    away: number
    movement: 'up' | 'down' | 'stable'
  }
  publicSplits: {
    spread: { home: number; away: number }
    total: { over: number; under: number }
    ml: { home: number; away: number }
  }
  sharpAction: string
  winProbability: { home: number; away: number }
}

interface GameAlert {
  id: string
  type: 'score' | 'momentum' | 'injury' | 'odds' | 'milestone'
  message: string
  timestamp: Date
  priority: 'high' | 'medium' | 'low'
}

export function LiveGameDashboard({
  gameId,
  sport,
  homeTeam,
  awayTeam,
  currentScore,
  period,
  clock,
  status,
  venue,
  broadcast
}: LiveGameDashboardProps) {
  const [bettingData, setBettingData] = useState<LiveBettingData | null>(null)
  const [alerts, setAlerts] = useState<GameAlert[]>([])
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const [selectedView, setSelectedView] = useState<'playbyplay' | 'betting' | 'analytics'>('playbyplay')
  const [isTracking, setIsTracking] = useState(false)

  // Initialize and simulate live data
  useEffect(() => {
    if (status !== 'live') return

    // Initial betting data
    setBettingData({
      spread: { 
        line: -3.5, 
        homeOdds: -110, 
        awayOdds: -110,
        movement: 'stable'
      },
      total: { 
        line: 225.5, 
        overOdds: -110, 
        underOdds: -110,
        movement: 'stable'
      },
      moneyline: {
        home: -150,
        away: +130,
        movement: 'stable'
      },
      publicSplits: {
        spread: { home: 52, away: 48 },
        total: { over: 55, under: 45 },
        ml: { home: 58, away: 42 }
      },
      sharpAction: `Sharp money on ${awayTeam.abbr} +3.5`,
      winProbability: { home: 62, away: 38 }
    })

    // Simulate live odds updates
    const oddsInterval = setInterval(() => {
      setBettingData(prev => {
        if (!prev) return prev
        
        const randomMove = () => Math.random() > 0.7
        const movement = (current: number, range: number) => {
          if (!randomMove()) return current
          const delta = (Math.random() - 0.5) * range
          return Math.round((current + delta) * 10) / 10
        }

        const spreadMove = randomMove()
        const totalMove = randomMove()
        const mlMove = randomMove()

        return {
          ...prev,
          spread: {
            ...prev.spread,
            line: movement(prev.spread.line, 1),
            movement: spreadMove ? (Math.random() > 0.5 ? 'up' : 'down') : 'stable'
          },
          total: {
            ...prev.total,
            line: movement(prev.total.line, 2),
            movement: totalMove ? (Math.random() > 0.5 ? 'up' : 'down') : 'stable'
          },
          moneyline: {
            ...prev.moneyline,
            home: Math.round(prev.moneyline.home + (mlMove ? (Math.random() - 0.5) * 20 : 0)),
            away: Math.round(prev.moneyline.away + (mlMove ? (Math.random() - 0.5) * 20 : 0)),
            movement: mlMove ? (Math.random() > 0.5 ? 'up' : 'down') : 'stable'
          },
          winProbability: {
            home: Math.min(90, Math.max(10, prev.winProbability.home + (Math.random() - 0.5) * 5)),
            away: Math.min(90, Math.max(10, prev.winProbability.away + (Math.random() - 0.5) * 5))
          }
        }
      })
    }, 10000)

    // Simulate alerts
    const alertInterval = setInterval(() => {
      if (Math.random() > 0.7) {
        const alertTypes: GameAlert['type'][] = ['score', 'momentum', 'odds', 'milestone', 'injury']
        const type = alertTypes[Math.floor(Math.random() * alertTypes.length)]
        
        const messages: Record<GameAlert['type'], string> = {
          score: `${Math.random() > 0.5 ? homeTeam.abbr : awayTeam.abbr} scores! Game is heating up`,
          momentum: `Momentum shift detected - ${Math.random() > 0.5 ? homeTeam.abbr : awayTeam.abbr} on a run`,
          odds: `Line movement alert: Spread moved to ${(Math.random() * 2 - 1 + -3.5).toFixed(1)}`,
          milestone: `${Math.random() > 0.5 ? homeTeam.abbr : awayTeam.abbr} reaches 50 points`,
          injury: `Injury alert: ${Math.random() > 0.5 ? homeTeam.abbr : awayTeam.abbr} player being evaluated`
        }

        const newAlert: GameAlert = {
          id: `alert-${Date.now()}`,
          type,
          message: messages[type],
          timestamp: new Date(),
          priority: type === 'score' ? 'high' : 'medium'
        }

        setAlerts(prev => [newAlert, ...prev.slice(0, 9)])
      }
    }, 20000)

    return () => {
      clearInterval(oddsInterval)
      clearInterval(alertInterval)
    }
  }, [status, homeTeam.abbr, awayTeam.abbr])

  const MovementIndicator = ({ movement }: { movement: 'up' | 'down' | 'stable' }) => {
    if (movement === 'stable') return null
    return movement === 'up' 
      ? <ArrowUpRight className="w-3 h-3 text-success" />
      : <ArrowDownRight className="w-3 h-3 text-danger" />
  }

  if (status !== 'live') {
    return (
      <div className="game-card rounded-xl p-6">
        <div className="text-center py-8">
          <Clock className="w-12 h-12 mx-auto mb-4 text-muted" />
          <h3 className="text-lg font-bold text-primary mb-2">
            {status === 'scheduled' ? 'Game Has Not Started' : 'Game Has Ended'}
          </h3>
          <p className="text-secondary">
            {status === 'scheduled' 
              ? 'Live dashboard will be available when the game begins'
              : 'View final box score and analysis above'
            }
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Live Game Header */}
      <div className="game-card rounded-xl overflow-hidden">
        <div className="bg-gradient-to-r from-red-900/40 to-orange-900/40 p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                <span className="text-sm font-bold text-red-400">LIVE</span>
              </div>
              <span className="text-secondary text-sm">{period} • {clock}</span>
              {broadcast && (
                <span className="text-xs px-2 py-1 rounded bg-card-inner text-muted">{broadcast}</span>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                className={`p-2 rounded-lg transition-colors ${
                  notificationsEnabled ? 'bg-accent-soft text-accent' : 'bg-card-inner text-muted'
                }`}
                title={notificationsEnabled ? 'Disable notifications' : 'Enable notifications'}
              >
                {notificationsEnabled ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
              </button>
              <button
                onClick={() => setIsTracking(!isTracking)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  isTracking ? 'bg-success-soft text-success' : 'bg-card-inner text-secondary'
                }`}
              >
                {isTracking ? '✓ Tracking' : 'Track Game'}
              </button>
            </div>
          </div>

          {/* Score Display */}
          <div className="flex items-center justify-center gap-8">
            <div className="text-center">
              <div className="text-sm text-secondary mb-1">{awayTeam.name}</div>
              <div className="text-5xl font-black text-primary">{currentScore.away}</div>
              <div className="text-xs text-muted mt-1">{awayTeam.record}</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-muted">@</div>
              {bettingData && (
                <div className="text-xs text-muted mt-2">
                  Win: {bettingData.winProbability.away.toFixed(0)}% - {bettingData.winProbability.home.toFixed(0)}%
                </div>
              )}
            </div>
            
            <div className="text-center">
              <div className="text-sm text-secondary mb-1">{homeTeam.name}</div>
              <div className="text-5xl font-black text-primary">{currentScore.home}</div>
              <div className="text-xs text-muted mt-1">{homeTeam.record}</div>
            </div>
          </div>
        </div>

        {/* Live Betting Strip */}
        {bettingData && (
          <div className="grid grid-cols-3 divide-x divide-white/5 bg-card-inner">
            <div className="p-3 text-center">
              <div className="text-xs text-muted uppercase mb-1">Spread</div>
              <div className="flex items-center justify-center gap-1">
                <span className="text-sm font-bold text-primary">
                  {homeTeam.abbr} {bettingData.spread.line > 0 ? '+' : ''}{bettingData.spread.line}
                </span>
                <MovementIndicator movement={bettingData.spread.movement} />
              </div>
              <div className="text-xs text-muted">{bettingData.spread.homeOdds}</div>
            </div>
            <div className="p-3 text-center">
              <div className="text-xs text-muted uppercase mb-1">Total</div>
              <div className="flex items-center justify-center gap-1">
                <span className="text-sm font-bold text-primary">O/U {bettingData.total.line}</span>
                <MovementIndicator movement={bettingData.total.movement} />
              </div>
              <div className="text-xs text-muted">{bettingData.total.overOdds}/{bettingData.total.underOdds}</div>
            </div>
            <div className="p-3 text-center">
              <div className="text-xs text-muted uppercase mb-1">Moneyline</div>
              <div className="flex items-center justify-center gap-1">
                <span className="text-sm font-bold text-primary">
                  {homeTeam.abbr} {bettingData.moneyline.home > 0 ? '+' : ''}{bettingData.moneyline.home}
                </span>
                <MovementIndicator movement={bettingData.moneyline.movement} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* View Tabs */}
      <div className="flex gap-2">
        {[
          { key: 'playbyplay', label: 'Play-by-Play', icon: Activity },
          { key: 'betting', label: 'Live Betting', icon: DollarSign },
          { key: 'analytics', label: 'Live Analytics', icon: BarChart3 }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setSelectedView(tab.key as typeof selectedView)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              selectedView === tab.key 
                ? 'bg-accent text-white' 
                : 'bg-card-inner text-secondary hover:text-primary'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          {selectedView === 'playbyplay' && (
            <PlayByPlay
              gameId={gameId}
              homeTeam={homeTeam}
              awayTeam={awayTeam}
              status={status}
              currentScore={currentScore}
              period={period}
              clock={clock}
            />
          )}
          
          {selectedView === 'betting' && bettingData && (
            <div className="game-card rounded-xl p-4 space-y-4">
              <h3 className="text-lg font-bold text-primary flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-accent" />
                Live Betting Dashboard
              </h3>
              
              {/* Public vs Sharp */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-card-inner rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-secondary mb-3">Public Betting Splits</h4>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-xs text-muted mb-1">
                        <span>Spread: {awayTeam.abbr}</span>
                        <span>{homeTeam.abbr}</span>
                      </div>
                      <div className="h-2 rounded-full bg-gray-700 overflow-hidden">
                        <div 
                          className="h-full bg-accent" 
                          style={{ width: `${bettingData.publicSplits.spread.away}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs font-bold mt-1">
                        <span className="text-accent">{bettingData.publicSplits.spread.away}%</span>
                        <span className="text-secondary">{bettingData.publicSplits.spread.home}%</span>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between text-xs text-muted mb-1">
                        <span>Total: Over</span>
                        <span>Under</span>
                      </div>
                      <div className="h-2 rounded-full bg-gray-700 overflow-hidden">
                        <div 
                          className="h-full bg-success" 
                          style={{ width: `${bettingData.publicSplits.total.over}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs font-bold mt-1">
                        <span className="text-success">{bettingData.publicSplits.total.over}%</span>
                        <span className="text-secondary">{bettingData.publicSplits.total.under}%</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-card-inner rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-secondary mb-3">Sharp Action</h4>
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-accent-soft">
                    <Zap className="w-5 h-5 text-accent" />
                    <span className="text-sm font-semibold text-primary">{bettingData.sharpAction}</span>
                  </div>
                  <p className="text-xs text-muted mt-2">
                    Sharp bettors are taking the opposite side of public money
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {selectedView === 'analytics' && (
            <div className="game-card rounded-xl p-4 space-y-4">
              <h3 className="text-lg font-bold text-primary flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-accent" />
                Live Game Analytics
              </h3>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-card-inner rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-secondary mb-3">Win Probability</h4>
                  {bettingData && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-primary">{awayTeam.abbr}</span>
                        <span className="text-lg font-bold text-accent">
                          {bettingData.winProbability.away.toFixed(1)}%
                        </span>
                      </div>
                      <div className="h-3 rounded-full bg-gray-700 overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-orange-500 to-red-500 transition-all duration-500" 
                          style={{ width: `${bettingData.winProbability.away}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-primary">{homeTeam.abbr}</span>
                        <span className="text-lg font-bold text-success">
                          {bettingData.winProbability.home.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="bg-card-inner rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-secondary mb-3">Pace Analysis</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted">Current Pace</span>
                      <span className="text-primary font-semibold">
                        {(currentScore.home + currentScore.away) * 2} pts
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted">Line Total</span>
                      <span className="text-primary font-semibold">{bettingData?.total.line}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted">Trend</span>
                      <span className={`font-semibold ${
                        (currentScore.home + currentScore.away) * 2 > (bettingData?.total.line || 0)
                          ? 'text-success'
                          : 'text-danger'
                      }`}>
                        {(currentScore.home + currentScore.away) * 2 > (bettingData?.total.line || 0) 
                          ? 'OVER' 
                          : 'UNDER'
                        }
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Alerts Sidebar */}
        <div className="game-card rounded-xl p-4">
          <h3 className="text-lg font-bold text-primary flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-warning" />
            Live Alerts
          </h3>
          
          {alerts.length === 0 ? (
            <div className="text-center py-8">
              <Activity className="w-8 h-8 mx-auto mb-2 text-muted animate-pulse" />
              <p className="text-sm text-secondary">Monitoring game events...</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {alerts.map(alert => (
                <div 
                  key={alert.id}
                  className={`p-3 rounded-lg ${
                    alert.priority === 'high' 
                      ? 'bg-danger-soft border border-red-500/30' 
                      : 'bg-card-inner'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {alert.type === 'score' && <Target className="w-3 h-3 text-success" />}
                    {alert.type === 'momentum' && <TrendingUp className="w-3 h-3 text-accent" />}
                    {alert.type === 'odds' && <DollarSign className="w-3 h-3 text-warning" />}
                    {alert.type === 'milestone' && <Flame className="w-3 h-3 text-accent" />}
                    <span className="text-xs text-muted">
                      {alert.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-sm text-primary">{alert.message}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default LiveGameDashboard
