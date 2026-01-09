'use client'

import { useState, useMemo } from 'react'
import { GamesSection, LiveScoresTicker } from '@/components/game'
import type { SportKey } from '@/lib/api/data-layer'
import { 
  Activity, 
  TrendingUp, 
  TrendingDown, 
  Zap, 
  Clock, 
  DollarSign,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Target,
  BarChart3,
  Percent,
  Users,
  Briefcase,
  RefreshCw,
  Bell
} from 'lucide-react'
import Link from 'next/link'

const SPORTS: { key: SportKey; name: string; icon: string }[] = [
  { key: 'NFL', name: 'Football', icon: '🏈' },
  { key: 'NBA', name: 'Basketball', icon: '🏀' },
  { key: 'NHL', name: 'Hockey', icon: '🏒' },
  { key: 'MLB', name: 'Baseball', icon: '⚾' },
]

// Mock live line movement data
interface LineMovement {
  gameId: string
  sport: SportKey
  awayTeam: string
  homeTeam: string
  time: string
  originalSpread: number
  currentSpread: number
  originalTotal: number
  currentTotal: number
  spreadMove: number
  totalMove: number
  publicBetPctAway: number
  publicBetPctHome: number
  publicMoneyPctAway: number
  publicMoneyPctHome: number
  sharpIndicator: 'away' | 'home' | 'over' | 'under' | null
  steamMove?: boolean
  reverseLineMove?: boolean
  isLive: boolean
  period?: string
  clock?: string
  awayScore?: number
  homeScore?: number
}

// Generate mock line movements
const generateLineMovements = (): LineMovement[] => [
  {
    gameId: '1',
    sport: 'NFL',
    awayTeam: 'KC Chiefs',
    homeTeam: 'BUF Bills',
    time: '8:20 PM',
    originalSpread: -3.0,
    currentSpread: -2.5,
    originalTotal: 48.5,
    currentTotal: 47.0,
    spreadMove: 0.5,
    totalMove: -1.5,
    publicBetPctAway: 72,
    publicBetPctHome: 28,
    publicMoneyPctAway: 58,
    publicMoneyPctHome: 42,
    sharpIndicator: 'home',
    reverseLineMove: true,
    steamMove: false,
    isLive: true,
    period: '3Q',
    clock: '8:42',
    awayScore: 17,
    homeScore: 21
  },
  {
    gameId: '2',
    sport: 'NBA',
    awayTeam: 'BOS Celtics',
    homeTeam: 'MIL Bucks',
    time: '7:00 PM',
    originalSpread: 2.5,
    currentSpread: 1.5,
    originalTotal: 225.5,
    currentTotal: 228.0,
    spreadMove: -1.0,
    totalMove: 2.5,
    publicBetPctAway: 45,
    publicBetPctHome: 55,
    publicMoneyPctAway: 62,
    publicMoneyPctHome: 38,
    sharpIndicator: 'over',
    steamMove: true,
    reverseLineMove: false,
    isLive: true,
    period: '2H',
    clock: '6:12',
    awayScore: 58,
    homeScore: 62
  },
  {
    gameId: '3',
    sport: 'NHL',
    awayTeam: 'COL Avalanche',
    homeTeam: 'VGK Knights',
    time: '10:00 PM',
    originalSpread: 1.5,
    currentSpread: 1.5,
    originalTotal: 6.5,
    currentTotal: 6.0,
    spreadMove: 0,
    totalMove: -0.5,
    publicBetPctAway: 64,
    publicBetPctHome: 36,
    publicMoneyPctAway: 52,
    publicMoneyPctHome: 48,
    sharpIndicator: 'under',
    steamMove: false,
    reverseLineMove: false,
    isLive: false
  },
  {
    gameId: '4',
    sport: 'NBA',
    awayTeam: 'OKC Thunder',
    homeTeam: 'DEN Nuggets',
    time: '9:30 PM',
    originalSpread: 3.5,
    currentSpread: 2.0,
    originalTotal: 222.0,
    currentTotal: 224.5,
    spreadMove: -1.5,
    totalMove: 2.5,
    publicBetPctAway: 38,
    publicBetPctHome: 62,
    publicMoneyPctAway: 71,
    publicMoneyPctHome: 29,
    sharpIndicator: 'away',
    reverseLineMove: true,
    steamMove: true,
    isLive: false
  },
  {
    gameId: '5',
    sport: 'NFL',
    awayTeam: 'PHI Eagles',
    homeTeam: 'DAL Cowboys',
    time: '4:30 PM',
    originalSpread: -6.5,
    currentSpread: -7.0,
    originalTotal: 45.0,
    currentTotal: 44.5,
    spreadMove: -0.5,
    totalMove: -0.5,
    publicBetPctAway: 68,
    publicBetPctHome: 32,
    publicMoneyPctAway: 75,
    publicMoneyPctHome: 25,
    sharpIndicator: null,
    steamMove: false,
    reverseLineMove: false,
    isLive: false
  },
]

// Mock alerts data
interface BettingAlert {
  id: string
  type: 'steam' | 'rlm' | 'sharp' | 'injury' | 'weather'
  severity: 'high' | 'medium' | 'low'
  game: string
  message: string
  timestamp: string
  sport: SportKey
}

const generateAlerts = (): BettingAlert[] => [
  {
    id: '1',
    type: 'steam',
    severity: 'high',
    game: 'OKC @ DEN',
    message: 'Steam move detected: OKC +2 (opened +3.5). Heavy sharp action on Thunder.',
    timestamp: '2 min ago',
    sport: 'NBA'
  },
  {
    id: '2',
    type: 'rlm',
    severity: 'high',
    game: 'KC @ BUF',
    message: 'Reverse Line Move: 72% on Chiefs but line moved from KC -3 to -2.5',
    timestamp: '8 min ago',
    sport: 'NFL'
  },
  {
    id: '3',
    type: 'sharp',
    severity: 'medium',
    game: 'BOS @ MIL',
    message: 'Sharp money on OVER 228 (62% money vs 45% tickets on Celtics side)',
    timestamp: '15 min ago',
    sport: 'NBA'
  },
  {
    id: '4',
    type: 'injury',
    severity: 'medium',
    game: 'COL @ VGK',
    message: 'Nathan MacKinnon questionable - line movement expected',
    timestamp: '22 min ago',
    sport: 'NHL'
  },
]

export default function LivePage() {
  const [activeSport, setActiveSport] = useState<SportKey | 'all'>('all')
  const [showLineMovements, setShowLineMovements] = useState(true)
  const [showAlerts, setShowAlerts] = useState(true)
  const [alertFilter, setAlertFilter] = useState<'all' | 'steam' | 'rlm' | 'sharp'>('all')
  
  const lineMovements = useMemo(() => generateLineMovements(), [])
  const alerts = useMemo(() => generateAlerts(), [])
  
  const filteredMovements = activeSport === 'all' 
    ? lineMovements 
    : lineMovements.filter(m => m.sport === activeSport)
    
  const filteredAlerts = alertFilter === 'all'
    ? alerts
    : alerts.filter(a => a.type === alertFilter)
  
  const liveGames = lineMovements.filter(m => m.isLive)
  const upcomingGames = lineMovements.filter(m => !m.isLive)
  
  return (
    <div className="min-h-screen" style={{ background: '#050508' }}>
      {/* Live Scores Ticker */}
      <LiveScoresTicker />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden" style={{ background: 'linear-gradient(180deg, #0a0a12 0%, #050508 100%)' }}>
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full opacity-20 blur-[100px] pointer-events-none" 
               style={{ background: 'radial-gradient(circle, #00FF88 0%, transparent 70%)' }} />
          <div className="absolute top-20 right-1/4 w-[400px] h-[400px] rounded-full opacity-10 blur-[80px] pointer-events-none" 
               style={{ background: 'radial-gradient(circle, #FF4455 0%, transparent 70%)' }} />
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-3">
              <Activity className="w-10 h-10" style={{ color: '#00FF88' }} />
              <h1 className="text-4xl sm:text-5xl font-black tracking-tight" 
                  style={{ 
                    background: 'linear-gradient(135deg, #00FF88 0%, #FFF 50%, #00FF88 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}>
                LIVE CENTER
              </h1>
              <span className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold animate-pulse" 
                    style={{ background: 'rgba(0,255,136,0.2)', color: '#00FF88' }}>
                <span className="w-2 h-2 bg-green-400 rounded-full" />
                {liveGames.length} LIVE
              </span>
            </div>
            <p className="text-lg" style={{ color: '#808090' }}>
              Real-time scores • Line Movements • Sharp Action Alerts
            </p>
          </div>
          
          {/* Quick Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <div className="p-4 rounded-2xl text-center" style={{ background: 'rgba(0,255,136,0.1)', border: '1px solid rgba(0,255,136,0.2)' }}>
              <Zap className="w-5 h-5 mx-auto mb-1" style={{ color: '#00FF88' }} />
              <div className="text-2xl font-black" style={{ color: '#00FF88' }}>{liveGames.length}</div>
              <div className="text-xs" style={{ color: '#808090' }}>Live Games</div>
            </div>
            <div className="p-4 rounded-2xl text-center" style={{ background: 'rgba(255,107,0,0.1)', border: '1px solid rgba(255,107,0,0.2)' }}>
              <TrendingUp className="w-5 h-5 mx-auto mb-1" style={{ color: '#FF6B00' }} />
              <div className="text-2xl font-black" style={{ color: '#FF6B00' }}>{lineMovements.filter(m => m.spreadMove !== 0).length}</div>
              <div className="text-xs" style={{ color: '#808090' }}>Line Moves</div>
            </div>
            <div className="p-4 rounded-2xl text-center" style={{ background: 'rgba(155,89,182,0.1)', border: '1px solid rgba(155,89,182,0.2)' }}>
              <AlertTriangle className="w-5 h-5 mx-auto mb-1" style={{ color: '#9B59B6' }} />
              <div className="text-2xl font-black" style={{ color: '#9B59B6' }}>{alerts.filter(a => a.severity === 'high').length}</div>
              <div className="text-xs" style={{ color: '#808090' }}>Sharp Alerts</div>
            </div>
            <div className="p-4 rounded-2xl text-center" style={{ background: 'rgba(0,168,255,0.1)', border: '1px solid rgba(0,168,255,0.2)' }}>
              <Clock className="w-5 h-5 mx-auto mb-1" style={{ color: '#00A8FF' }} />
              <div className="text-2xl font-black" style={{ color: '#00A8FF' }}>{upcomingGames.length}</div>
              <div className="text-xs" style={{ color: '#808090' }}>Upcoming</div>
            </div>
          </div>
          
          {/* Sport Filter */}
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <button
              onClick={() => setActiveSport('all')}
              className="px-4 py-2 rounded-lg text-sm font-bold transition-all"
              style={{ 
                background: activeSport === 'all' ? 'rgba(0,255,136,0.2)' : 'rgba(255,255,255,0.05)',
                color: activeSport === 'all' ? '#00FF88' : '#808090',
                border: activeSport === 'all' ? '1px solid rgba(0,255,136,0.3)' : '1px solid transparent'
              }}
            >
              🌐 All Sports
            </button>
            {SPORTS.map(sport => (
              <button
                key={sport.key}
                onClick={() => setActiveSport(sport.key)}
                className="px-4 py-2 rounded-lg text-sm font-bold transition-all"
                style={{ 
                  background: activeSport === sport.key ? 'rgba(0,255,136,0.2)' : 'rgba(255,255,255,0.05)',
                  color: activeSport === sport.key ? '#00FF88' : '#808090',
                  border: activeSport === sport.key ? '1px solid rgba(0,255,136,0.3)' : '1px solid transparent'
                }}
              >
                {sport.icon} {sport.name}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid lg:grid-cols-3 gap-6">
          
          {/* Left Column - Line Movements & Games */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Line Movements Section */}
            <div className="rounded-2xl overflow-hidden" style={{ background: '#0c0c14', border: '1px solid rgba(255,255,255,0.06)' }}>
              <button 
                onClick={() => setShowLineMovements(!showLineMovements)}
                className="w-full px-5 py-4 flex items-center justify-between"
                style={{ borderBottom: showLineMovements ? '1px solid rgba(255,255,255,0.06)' : 'none' }}
              >
                <div className="flex items-center gap-3">
                  <TrendingUp className="w-5 h-5" style={{ color: '#FF6B00' }} />
                  <h2 className="text-lg font-bold text-white">Line Movements</h2>
                  <span className="text-xs px-2 py-0.5 rounded" style={{ background: 'rgba(255,107,0,0.2)', color: '#FF6B00' }}>
                    {filteredMovements.length} games
                  </span>
                </div>
                {showLineMovements ? <ChevronUp className="w-5 h-5 text-zinc-500" /> : <ChevronDown className="w-5 h-5 text-zinc-500" />}
              </button>
              
              {showLineMovements && (
                <div className="divide-y divide-zinc-800/50">
                  {filteredMovements.map((game) => (
                    <div key={game.gameId} className="p-4 hover:bg-white/[0.02] transition-colors">
                      {/* Game Header */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{SPORTS.find(s => s.key === game.sport)?.icon}</span>
                          <span className="font-semibold text-white text-sm">{game.awayTeam} @ {game.homeTeam}</span>
                          {game.isLive && (
                            <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold" 
                                  style={{ background: 'rgba(0,255,136,0.2)', color: '#00FF88' }}>
                              <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                              {game.period} {game.clock}
                            </span>
                          )}
                        </div>
                        {game.isLive && (
                          <div className="text-right">
                            <span className="text-lg font-bold" style={{ color: '#FFF' }}>
                              {game.awayScore} - {game.homeScore}
                            </span>
                          </div>
                        )}
                        {!game.isLive && (
                          <span className="text-xs text-zinc-500">{game.time}</span>
                        )}
                      </div>
                      
                      {/* Line Movement Details */}
                      <div className="grid grid-cols-2 gap-4 mb-3">
                        {/* Spread */}
                        <div className="p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)' }}>
                          <div className="text-[10px] font-semibold mb-1" style={{ color: '#808090' }}>SPREAD</div>
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-white">{game.currentSpread > 0 ? '+' : ''}{game.currentSpread}</span>
                            {game.spreadMove !== 0 && (
                              <span className="flex items-center gap-1 text-xs font-bold" 
                                    style={{ color: game.spreadMove > 0 ? '#00FF88' : '#FF4455' }}>
                                {game.spreadMove > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                {Math.abs(game.spreadMove)}
                              </span>
                            )}
                          </div>
                          <div className="text-[10px]" style={{ color: '#606070' }}>
                            Opened: {game.originalSpread > 0 ? '+' : ''}{game.originalSpread}
                          </div>
                        </div>
                        
                        {/* Total */}
                        <div className="p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)' }}>
                          <div className="text-[10px] font-semibold mb-1" style={{ color: '#808090' }}>TOTAL</div>
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-white">{game.currentTotal}</span>
                            {game.totalMove !== 0 && (
                              <span className="flex items-center gap-1 text-xs font-bold" 
                                    style={{ color: game.totalMove > 0 ? '#00FF88' : '#FF4455' }}>
                                {game.totalMove > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                {Math.abs(game.totalMove)}
                              </span>
                            )}
                          </div>
                          <div className="text-[10px]" style={{ color: '#606070' }}>
                            Opened: {game.originalTotal}
                          </div>
                        </div>
                      </div>
                      
                      {/* Public vs Sharp */}
                      <div className="grid grid-cols-2 gap-4 mb-3">
                        {/* Ticket % */}
                        <div>
                          <div className="flex items-center gap-1 text-[10px] font-semibold mb-1" style={{ color: '#808090' }}>
                            <Users className="w-3 h-3" />
                            PUBLIC BETS
                          </div>
                          <div className="flex gap-1">
                            <div className="flex-1 h-2 rounded-l-full" style={{ background: 'rgba(255,68,85,0.3)' }}>
                              <div className="h-full rounded-l-full" style={{ width: `${game.publicBetPctAway}%`, background: '#FF4455' }} />
                            </div>
                            <div className="flex-1 h-2 rounded-r-full" style={{ background: 'rgba(0,255,136,0.3)' }}>
                              <div className="h-full rounded-r-full ml-auto" style={{ width: `${game.publicBetPctHome}%`, background: '#00FF88' }} />
                            </div>
                          </div>
                          <div className="flex justify-between text-[10px] mt-1">
                            <span style={{ color: '#FF4455' }}>{game.publicBetPctAway}% Away</span>
                            <span style={{ color: '#00FF88' }}>{game.publicBetPctHome}% Home</span>
                          </div>
                        </div>
                        
                        {/* Money % */}
                        <div>
                          <div className="flex items-center gap-1 text-[10px] font-semibold mb-1" style={{ color: '#808090' }}>
                            <DollarSign className="w-3 h-3" />
                            MONEY %
                          </div>
                          <div className="flex gap-1">
                            <div className="flex-1 h-2 rounded-l-full" style={{ background: 'rgba(255,107,0,0.3)' }}>
                              <div className="h-full rounded-l-full" style={{ width: `${game.publicMoneyPctAway}%`, background: '#FF6B00' }} />
                            </div>
                            <div className="flex-1 h-2 rounded-r-full" style={{ background: 'rgba(155,89,182,0.3)' }}>
                              <div className="h-full rounded-r-full ml-auto" style={{ width: `${game.publicMoneyPctHome}%`, background: '#9B59B6' }} />
                            </div>
                          </div>
                          <div className="flex justify-between text-[10px] mt-1">
                            <span style={{ color: '#FF6B00' }}>{game.publicMoneyPctAway}% Away</span>
                            <span style={{ color: '#9B59B6' }}>{game.publicMoneyPctHome}% Home</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Indicators */}
                      <div className="flex flex-wrap gap-2">
                        {game.steamMove && (
                          <span className="px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1"
                                style={{ background: 'rgba(255,68,85,0.2)', color: '#FF4455', border: '1px solid rgba(255,68,85,0.3)' }}>
                            🔥 STEAM MOVE
                          </span>
                        )}
                        {game.reverseLineMove && (
                          <span className="px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1"
                                style={{ background: 'rgba(155,89,182,0.2)', color: '#9B59B6', border: '1px solid rgba(155,89,182,0.3)' }}>
                            ↩️ RLM
                          </span>
                        )}
                        {game.sharpIndicator && (
                          <span className="px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1"
                                style={{ background: 'rgba(0,255,136,0.2)', color: '#00FF88', border: '1px solid rgba(0,255,136,0.3)' }}>
                            💰 SHARP: {game.sharpIndicator.toUpperCase()}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Games by Sport */}
            <div className="space-y-6">
              {(activeSport === 'all' ? SPORTS : SPORTS.filter(s => s.key === activeSport)).map(sport => (
                <GamesSection 
                  key={sport.key} 
                  sport={sport.key} 
                  title={`${sport.icon} ${sport.name}`}
                />
              ))}
            </div>
          </div>
          
          {/* Right Column - Alerts & Info */}
          <div className="space-y-6">
            
            {/* Live Alerts */}
            <div className="rounded-2xl overflow-hidden" style={{ background: '#0c0c14', border: '1px solid rgba(255,68,85,0.3)' }}>
              <button 
                onClick={() => setShowAlerts(!showAlerts)}
                className="w-full px-5 py-4 flex items-center justify-between"
                style={{ background: 'rgba(255,68,85,0.1)', borderBottom: showAlerts ? '1px solid rgba(255,68,85,0.2)' : 'none' }}
              >
                <div className="flex items-center gap-3">
                  <Bell className="w-5 h-5" style={{ color: '#FF4455' }} />
                  <h2 className="text-lg font-bold" style={{ color: '#FF4455' }}>Live Alerts</h2>
                  <span className="text-xs px-2 py-0.5 rounded animate-pulse" style={{ background: 'rgba(255,68,85,0.2)', color: '#FF4455' }}>
                    {alerts.filter(a => a.severity === 'high').length} NEW
                  </span>
                </div>
                {showAlerts ? <ChevronUp className="w-5 h-5 text-zinc-500" /> : <ChevronDown className="w-5 h-5 text-zinc-500" />}
              </button>
              
              {showAlerts && (
                <>
                  {/* Alert Type Filter */}
                  <div className="px-4 py-3 flex gap-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    {[
                      { key: 'all', label: 'All' },
                      { key: 'steam', label: '🔥 Steam' },
                      { key: 'rlm', label: '↩️ RLM' },
                      { key: 'sharp', label: '💰 Sharp' },
                    ].map(f => (
                      <button
                        key={f.key}
                        onClick={() => setAlertFilter(f.key as typeof alertFilter)}
                        className="px-2 py-1 rounded text-[10px] font-bold transition-all"
                        style={{
                          background: alertFilter === f.key ? 'rgba(255,68,85,0.2)' : 'rgba(255,255,255,0.05)',
                          color: alertFilter === f.key ? '#FF4455' : '#808090'
                        }}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                  
                  <div className="divide-y divide-zinc-800/50 max-h-96 overflow-y-auto">
                    {filteredAlerts.map(alert => (
                      <div key={alert.id} className="p-4 hover:bg-white/[0.02] transition-colors">
                        <div className="flex items-start gap-3">
                          <div className="p-2 rounded-lg" style={{ 
                            background: alert.severity === 'high' ? 'rgba(255,68,85,0.2)' : 'rgba(255,215,0,0.2)'
                          }}>
                            {alert.type === 'steam' && <Zap className="w-4 h-4" style={{ color: '#FF4455' }} />}
                            {alert.type === 'rlm' && <RefreshCw className="w-4 h-4" style={{ color: '#9B59B6' }} />}
                            {alert.type === 'sharp' && <DollarSign className="w-4 h-4" style={{ color: '#00FF88' }} />}
                            {alert.type === 'injury' && <AlertTriangle className="w-4 h-4" style={{ color: '#FFD700' }} />}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-bold text-xs text-white">{alert.game}</span>
                              <span className="text-lg">{SPORTS.find(s => s.key === alert.sport)?.icon}</span>
                            </div>
                            <p className="text-xs" style={{ color: '#A0A0B0' }}>{alert.message}</p>
                            <span className="text-[10px]" style={{ color: '#606070' }}>{alert.timestamp}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
            
            {/* Quick Links */}
            <div className="rounded-2xl p-4" style={{ background: '#0c0c14', border: '1px solid rgba(255,255,255,0.06)' }}>
              <h3 className="font-bold text-sm mb-3" style={{ color: '#FFF' }}>🔗 Quick Actions</h3>
              <div className="space-y-2">
                <Link href="/trends" className="flex items-center justify-between p-3 rounded-lg hover:bg-white/5 transition-colors"
                      style={{ background: 'rgba(255,255,255,0.02)' }}>
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4" style={{ color: '#FF6B00' }} />
                    <span className="text-sm text-white">Betting Trends</span>
                  </div>
                  <span className="text-xs" style={{ color: '#808090' }}>→</span>
                </Link>
                <Link href="/analytics" className="flex items-center justify-between p-3 rounded-lg hover:bg-white/5 transition-colors"
                      style={{ background: 'rgba(255,255,255,0.02)' }}>
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4" style={{ color: '#9B59B6' }} />
                    <span className="text-sm text-white">Edge Finder</span>
                  </div>
                  <span className="text-xs" style={{ color: '#808090' }}>→</span>
                </Link>
                <Link href="/leaderboard" className="flex items-center justify-between p-3 rounded-lg hover:bg-white/5 transition-colors"
                      style={{ background: 'rgba(255,255,255,0.02)' }}>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" style={{ color: '#00FF88' }} />
                    <span className="text-sm text-white">Expert Tracker</span>
                  </div>
                  <span className="text-xs" style={{ color: '#808090' }}>→</span>
                </Link>
              </div>
            </div>
            
            {/* Legend */}
            <div className="rounded-2xl p-4" style={{ background: '#0c0c14', border: '1px solid rgba(255,255,255,0.06)' }}>
              <h3 className="font-bold text-sm mb-3" style={{ color: '#FFF' }}>📖 Indicator Legend</h3>
              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded" style={{ background: 'rgba(255,68,85,0.2)', color: '#FF4455' }}>🔥 STEAM</span>
                  <span style={{ color: '#808090' }}>Sudden sharp line movement</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded" style={{ background: 'rgba(155,89,182,0.2)', color: '#9B59B6' }}>↩️ RLM</span>
                  <span style={{ color: '#808090' }}>Line moves opposite public %</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded" style={{ background: 'rgba(0,255,136,0.2)', color: '#00FF88' }}>💰 SHARP</span>
                  <span style={{ color: '#808090' }}>Professional money detected</span>
                </div>
              </div>
            </div>
            
            {/* Data Source Info */}
            <div className="p-4 rounded-xl" style={{ background: 'rgba(0,168,255,0.05)', border: '1px solid rgba(0,168,255,0.2)' }}>
              <h3 className="text-xs font-semibold mb-2" style={{ color: '#00A8FF' }}>📡 Data Sources</h3>
              <div className="space-y-1 text-[10px]" style={{ color: '#808090' }}>
                <p>• ESPN API (Schedules, Live Scores)</p>
                <p>• The Odds API (40+ Sportsbooks)</p>
                <p>• Action Network (Public/Sharp splits)</p>
                <p className="flex items-center gap-1" style={{ color: '#00FF88' }}>
                  <RefreshCw className="w-3 h-3" /> Auto-refresh every 30s
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
