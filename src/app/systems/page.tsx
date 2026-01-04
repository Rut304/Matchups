'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { 
  Brain,
  Zap,
  Target,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Play,
  Save,
  Star,
  Copy,
  Settings,
  Filter,
  Calendar,
  DollarSign,
  Percent,
  Activity,
  ChevronRight,
  ChevronDown,
  ArrowRight,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  History,
  Bookmark,
  Share2,
  LineChart,
  PieChart,
  Trophy,
  Flame,
  Home,
  Plane,
  Clock
} from 'lucide-react'

type Sport = 'all' | 'nfl' | 'nba' | 'nhl' | 'mlb'
type BetType = 'ats' | 'ml' | 'ou' | 'all'

// System criteria types
interface SystemCriteria {
  sport: Sport
  betType: BetType
  situations: string[]
  customPrompt: string
}

// System result types
interface SystemResult {
  id: string
  name: string
  criteria: string[]
  sport: Sport
  betType: BetType
  stats: {
    record: string
    winPct: number
    roi: number
    units: number
    avgOdds: number
    clv: number // Closing line value
    maxDrawdown: number
    sharpeRatio: number
    kellyPct: number
  }
  recentPicks: {
    date: string
    matchup: string
    pick: string
    result: 'W' | 'L' | 'P'
    profit: number
  }[]
  upcomingPicks: {
    matchup: string
    pick: string
    confidence: number
    time: string
  }[]
}

// Pre-built popular systems
const popularSystems: SystemResult[] = [
  {
    id: 'sys-1',
    name: 'NFL Home Dogs After Loss',
    criteria: ['Home underdog', 'Coming off a loss', 'Spread +3 to +7'],
    sport: 'nfl',
    betType: 'ats',
    stats: {
      record: '156-98-8',
      winPct: 61.4,
      roi: 12.8,
      units: 38.7,
      avgOdds: -108,
      clv: 2.4,
      maxDrawdown: -12.3,
      sharpeRatio: 1.42,
      kellyPct: 8.2,
    },
    recentPicks: [
      { date: 'Dec 29', matchup: 'TEN +6 vs HOU', pick: 'TEN +6', result: 'W', profit: 1.0 },
      { date: 'Dec 22', matchup: 'CAR +7 vs ARI', pick: 'CAR +7', result: 'L', profit: -1.1 },
      { date: 'Dec 15', matchup: 'JAX +4 vs NYJ', pick: 'JAX +4', result: 'W', profit: 1.0 },
    ],
    upcomingPicks: [
      { matchup: 'TEN vs HOU', pick: 'TEN +5.5', confidence: 72, time: 'Sun 1:00 PM' },
    ],
  },
  {
    id: 'sys-2',
    name: 'NBA Road Favorites -3 to -6',
    criteria: ['Road favorite', 'Spread -3 to -6', 'Team top-10 Net Rating'],
    sport: 'nba',
    betType: 'ats',
    stats: {
      record: '89-67-4',
      winPct: 57.1,
      roi: 8.4,
      units: 24.2,
      avgOdds: -110,
      clv: 1.8,
      maxDrawdown: -8.5,
      sharpeRatio: 1.18,
      kellyPct: 6.1,
    },
    recentPicks: [
      { date: 'Jan 2', matchup: 'BOS -4 @ MIA', pick: 'BOS -4', result: 'W', profit: 1.0 },
      { date: 'Jan 1', matchup: 'OKC -5 @ UTA', pick: 'OKC -5', result: 'W', profit: 1.0 },
      { date: 'Dec 30', matchup: 'CLE -3.5 @ TOR', pick: 'CLE -3.5', result: 'W', profit: 1.0 },
    ],
    upcomingPicks: [
      { matchup: 'BOS @ LAL', pick: 'BOS -4.5', confidence: 68, time: 'Sat 8:30 PM' },
      { matchup: 'OKC @ GSW', pick: 'OKC -5.5', confidence: 71, time: 'Sat 10:00 PM' },
    ],
  },
  {
    id: 'sys-3',
    name: 'NHL Unders - Back-to-Back Road',
    criteria: ['Road team on B2B', 'Total 6+', 'Against top-10 defense'],
    sport: 'nhl',
    betType: 'ou',
    stats: {
      record: '67-48-5',
      winPct: 58.3,
      roi: 9.7,
      units: 18.4,
      avgOdds: -112,
      clv: 1.5,
      maxDrawdown: -6.2,
      sharpeRatio: 1.24,
      kellyPct: 5.8,
    },
    recentPicks: [
      { date: 'Jan 3', matchup: 'PIT @ BOS u6', pick: 'UNDER 6', result: 'W', profit: 1.0 },
      { date: 'Jan 1', matchup: 'CGY @ DAL u5.5', pick: 'UNDER 5.5', result: 'L', profit: -1.1 },
    ],
    upcomingPicks: [
      { matchup: 'NYR @ BOS', pick: 'UNDER 5.5', confidence: 66, time: 'Sat 7:00 PM' },
    ],
  },
  {
    id: 'sys-4',
    name: 'MLB First 5 Home Favorites',
    criteria: ['Home favorite', 'F5 line', 'SP ERA under 3.50', 'vs SP ERA over 4.00'],
    sport: 'mlb',
    betType: 'ml',
    stats: {
      record: '124-94-12',
      winPct: 56.9,
      roi: 6.2,
      units: 15.8,
      avgOdds: -135,
      clv: 0.9,
      maxDrawdown: -10.4,
      sharpeRatio: 1.08,
      kellyPct: 4.2,
    },
    recentPicks: [
      { date: 'Oct 5', matchup: 'LAD F5 vs SD', pick: 'LAD F5', result: 'W', profit: 0.74 },
      { date: 'Oct 4', matchup: 'NYY F5 vs BOS', pick: 'NYY F5', result: 'W', profit: 0.77 },
    ],
    upcomingPicks: [],
  },
  {
    id: 'sys-5',
    name: 'Sharp Money Fade Public',
    criteria: ['Public betting >65%', 'Sharp money opposite', 'Line moving against public'],
    sport: 'all',
    betType: 'ats',
    stats: {
      record: '201-156-12',
      winPct: 56.3,
      roi: 7.8,
      units: 32.6,
      avgOdds: -108,
      clv: 2.1,
      maxDrawdown: -14.2,
      sharpeRatio: 1.12,
      kellyPct: 5.4,
    },
    recentPicks: [
      { date: 'Jan 3', matchup: 'MIN +3.5 @ DET', pick: 'MIN +3.5', result: 'P', profit: 0 },
      { date: 'Jan 2', matchup: 'MIA +6 vs BUF', pick: 'MIA +6', result: 'L', profit: -1.1 },
      { date: 'Jan 1', matchup: 'CHI +10 @ GB', pick: 'CHI +10', result: 'W', profit: 1.0 },
    ],
    upcomingPicks: [
      { matchup: 'KC +2.5 @ BUF', pick: 'KC +2.5', confidence: 62, time: 'Sun 4:25 PM' },
    ],
  },
]

// Situation options by sport
const situationOptions: Record<Sport, string[]> = {
  all: ['Sharp money opposite', 'Public >65%', 'Line moving against public', 'High handle split'],
  nfl: [
    'Home team', 'Road team', 'Favorite', 'Underdog', 'Coming off loss', 'Coming off win',
    'After bye week', 'Short week', 'Primetime game', 'Divisional game', 'Revenge spot',
    'Cold weather', 'Dome team outdoors', 'Spread +3 to +7', 'Spread -3 to -7',
    '>70% public', 'Sharp money opposite', 'Line moving against public', 'High handle split',
  ],
  nba: [
    'Home team', 'Road team', 'Favorite', 'Underdog', 'Back-to-back', 'Rest advantage',
    '3+ days rest', '4-in-5 nights', 'Travel miles >2000', 'Divisional game',
    'Top-10 offense', 'Top-10 defense', 'Bottom-10 defense', 'Spread +3 to +7', 'Spread -3 to -7',
    '>70% public', 'Sharp money opposite', 'Line moving against public',
  ],
  nhl: [
    'Home team', 'Road team', 'Favorite', 'Underdog', 'Back-to-back', 'Rest advantage',
    '3+ days rest', 'Travel miles >2000', 'Divisional game', 'Starting goalie confirmed',
    'Top-10 offense', 'Top-10 defense', 'Against backup goalie',
    '>70% public', 'Sharp money opposite', 'Line moving against public',
  ],
  mlb: [
    'Home team', 'Road team', 'Favorite', 'Underdog', 'Day game after night',
    'First 5 innings', 'Full game', 'Lefty vs Lefty', 'Righty vs Righty',
    'SP ERA < 3.50', 'SP ERA > 4.00', 'Bullpen advantage',
    '>70% public', 'Sharp money opposite', 'Line moving against public',
  ],
}

export default function SystemsPage() {
  const [sport, setSport] = useState<Sport>('all')
  const [betType, setBetType] = useState<BetType>('ats')
  const [selectedSituations, setSelectedSituations] = useState<string[]>([])
  const [customPrompt, setCustomPrompt] = useState('')
  const [isBuilding, setIsBuilding] = useState(false)
  const [activeSystem, setActiveSystem] = useState<SystemResult | null>(null)
  const [savedSystems, setSavedSystems] = useState<SystemResult[]>([])
  const [showAdvanced, setShowAdvanced] = useState(false)

  const toggleSituation = (situation: string) => {
    setSelectedSituations(prev => 
      prev.includes(situation) 
        ? prev.filter(s => s !== situation)
        : [...prev, situation]
    )
  }

  const buildSystem = useCallback(async () => {
    setIsBuilding(true)
    
    // Simulate AI processing
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Generate a mock result based on criteria
    const mockResult: SystemResult = {
      id: `sys-custom-${Date.now()}`,
      name: customPrompt || `Custom ${sport.toUpperCase()} System`,
      criteria: selectedSituations.length > 0 ? selectedSituations : [customPrompt],
      sport,
      betType,
      stats: {
        record: '45-32-3',
        winPct: 58.4,
        roi: 9.2,
        units: 12.8,
        avgOdds: -108,
        clv: 1.7,
        maxDrawdown: -5.4,
        sharpeRatio: 1.28,
        kellyPct: 6.4,
      },
      recentPicks: [
        { date: 'Jan 3', matchup: 'DET -3.5 vs MIN', pick: 'DET -3.5', result: 'P', profit: 0 },
        { date: 'Jan 2', matchup: 'BOS -4 @ MIA', pick: 'BOS -4', result: 'W', profit: 1.0 },
      ],
      upcomingPicks: [
        { matchup: 'DET vs MIN', pick: 'DET -3.5', confidence: 72, time: 'Sun 1:00 PM' },
        { matchup: 'BOS @ LAL', pick: 'BOS -4.5', confidence: 68, time: 'Sat 8:30 PM' },
      ],
    }
    
    setActiveSystem(mockResult)
    setIsBuilding(false)
  }, [sport, betType, selectedSituations, customPrompt])

  const saveSystem = () => {
    if (activeSystem) {
      setSavedSystems(prev => [...prev, activeSystem])
    }
  }

  return (
    <main className="min-h-screen" style={{ background: '#06060c' }}>
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Brain style={{ color: '#FF6B00', width: '32px', height: '32px' }} />
            <h1 className="text-3xl font-bold" style={{ color: '#FFF' }}>System Builder</h1>
          </div>
          <p style={{ color: '#808090' }}>
            Create, backtest, and follow profitable betting systems using AI-powered analysis
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Builder Panel */}
          <div className="lg:col-span-2 space-y-6">
            {/* AI Prompt Builder */}
            <div className="rounded-xl p-6" style={{ background: '#0c0c14', border: '1px solid rgba(255,107,0,0.3)' }}>
              <h2 className="flex items-center gap-2 text-xl font-bold mb-4" style={{ color: '#FFF' }}>
                <Zap style={{ color: '#FF6B00', width: '20px', height: '20px' }} />
                AI Strategy Builder
              </h2>
              
              {/* Natural Language Input */}
              <div className="mb-6">
                <label className="block text-sm font-semibold mb-2" style={{ color: '#A0A0B0' }}>
                  Describe your system in plain English
                </label>
                <textarea
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder="Example: Find all NFL games where the home team is an underdog of +3 to +7 points, coming off a loss, with more than 70% of the betting handle on the favorite..."
                  className="w-full h-32 px-4 py-3 rounded-lg text-sm resize-none"
                  style={{ 
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#FFF'
                  }}
                />
              </div>

              {/* Sport & Bet Type Selectors */}
              <div className="grid md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: '#A0A0B0' }}>Sport</label>
                  <div className="flex flex-wrap gap-2">
                    {(['all', 'nfl', 'nba', 'nhl', 'mlb'] as Sport[]).map(s => (
                      <button
                        key={s}
                        onClick={() => setSport(s)}
                        className="px-4 py-2 rounded-lg text-sm font-semibold transition-all"
                        style={{
                          background: sport === s ? '#FF6B00' : 'rgba(255,255,255,0.05)',
                          color: sport === s ? '#FFF' : '#808090',
                        }}
                      >
                        {s.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: '#A0A0B0' }}>Bet Type</label>
                  <div className="flex flex-wrap gap-2">
                    {(['ats', 'ml', 'ou', 'all'] as BetType[]).map(bt => (
                      <button
                        key={bt}
                        onClick={() => setBetType(bt)}
                        className="px-4 py-2 rounded-lg text-sm font-semibold transition-all"
                        style={{
                          background: betType === bt ? '#FF6B00' : 'rgba(255,255,255,0.05)',
                          color: betType === bt ? '#FFF' : '#808090',
                        }}
                      >
                        {bt === 'ats' ? 'Spread' : bt === 'ml' ? 'Moneyline' : bt === 'ou' ? 'Over/Under' : 'All'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Situation Tags */}
              <div className="mb-6">
                <button 
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="flex items-center gap-2 text-sm font-semibold mb-3"
                  style={{ color: '#FF6B00' }}
                >
                  <Settings style={{ width: '16px', height: '16px' }} />
                  {showAdvanced ? 'Hide' : 'Show'} Situation Filters
                  <ChevronDown style={{ width: '16px', height: '16px', transform: showAdvanced ? 'rotate(180deg)' : 'none' }} />
                </button>
                
                {showAdvanced && (
                  <div className="flex flex-wrap gap-2 p-4 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)' }}>
                    {situationOptions[sport].map(situation => (
                      <button
                        key={situation}
                        onClick={() => toggleSituation(situation)}
                        className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
                        style={{
                          background: selectedSituations.includes(situation) ? 'rgba(255,107,0,0.2)' : 'rgba(255,255,255,0.05)',
                          color: selectedSituations.includes(situation) ? '#FF6B00' : '#808090',
                          border: selectedSituations.includes(situation) ? '1px solid rgba(255,107,0,0.5)' : '1px solid transparent',
                        }}
                      >
                        {situation}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Build Button */}
              <button
                onClick={buildSystem}
                disabled={isBuilding || (!customPrompt && selectedSituations.length === 0)}
                className="w-full py-3 rounded-lg font-bold text-lg flex items-center justify-center gap-2 transition-all"
                style={{
                  background: isBuilding ? 'rgba(255,107,0,0.5)' : '#FF6B00',
                  color: '#FFF',
                  opacity: (!customPrompt && selectedSituations.length === 0) ? 0.5 : 1,
                }}
              >
                {isBuilding ? (
                  <>
                    <Loader2 style={{ width: '20px', height: '20px', animation: 'spin 1s linear infinite' }} />
                    Building System...
                  </>
                ) : (
                  <>
                    <Play style={{ width: '20px', height: '20px' }} />
                    Build & Backtest System
                  </>
                )}
              </button>
            </div>

            {/* System Results */}
            {activeSystem && (
              <div className="rounded-xl p-6" style={{ background: '#0c0c14', border: '1px solid rgba(0,255,136,0.3)' }}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="flex items-center gap-2 text-xl font-bold" style={{ color: '#FFF' }}>
                    <Target style={{ color: '#00FF88', width: '20px', height: '20px' }} />
                    {activeSystem.name}
                  </h2>
                  <div className="flex gap-2">
                    <button
                      onClick={saveSystem}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-semibold"
                      style={{ background: 'rgba(255,107,0,0.2)', color: '#FF6B00' }}
                    >
                      <Bookmark style={{ width: '14px', height: '14px' }} /> Save
                    </button>
                    <button
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-semibold"
                      style={{ background: 'rgba(255,255,255,0.1)', color: '#A0A0B0' }}
                    >
                      <Share2 style={{ width: '14px', height: '14px' }} /> Share
                    </button>
                  </div>
                </div>

                {/* Criteria Tags */}
                <div className="flex flex-wrap gap-2 mb-6">
                  {activeSystem.criteria.map((c, i) => (
                    <span key={i} className="px-3 py-1 rounded-full text-xs font-semibold"
                          style={{ background: 'rgba(255,107,0,0.2)', color: '#FF6B00' }}>
                      {c}
                    </span>
                  ))}
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <StatCard label="Record" value={activeSystem.stats.record} />
                  <StatCard 
                    label="Win %" 
                    value={`${activeSystem.stats.winPct}%`} 
                    highlight={activeSystem.stats.winPct > 55}
                  />
                  <StatCard 
                    label="ROI" 
                    value={`${activeSystem.stats.roi > 0 ? '+' : ''}${activeSystem.stats.roi}%`}
                    highlight={activeSystem.stats.roi > 5}
                  />
                  <StatCard 
                    label="Units" 
                    value={`${activeSystem.stats.units > 0 ? '+' : ''}${activeSystem.stats.units}`}
                    highlight={activeSystem.stats.units > 0}
                  />
                </div>

                {/* Advanced Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 p-4 rounded-lg" 
                     style={{ background: 'rgba(255,255,255,0.03)' }}>
                  <div className="text-center">
                    <p className="text-xs" style={{ color: '#606070' }}>CLV</p>
                    <p className="text-lg font-bold" style={{ color: '#00FF88' }}>
                      +{activeSystem.stats.clv}%
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs" style={{ color: '#606070' }}>Max Drawdown</p>
                    <p className="text-lg font-bold" style={{ color: '#FF4455' }}>
                      {activeSystem.stats.maxDrawdown}u
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs" style={{ color: '#606070' }}>Sharpe Ratio</p>
                    <p className="text-lg font-bold" style={{ color: '#FFF' }}>
                      {activeSystem.stats.sharpeRatio}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs" style={{ color: '#606070' }}>Kelly %</p>
                    <p className="text-lg font-bold" style={{ color: '#FFF' }}>
                      {activeSystem.stats.kellyPct}%
                    </p>
                  </div>
                </div>

                {/* Upcoming Picks */}
                {activeSystem.upcomingPicks.length > 0 && (
                  <div className="mb-6">
                    <h3 className="flex items-center gap-2 text-sm font-bold mb-3" style={{ color: '#FF6B00' }}>
                      <Flame style={{ width: '14px', height: '14px' }} /> UPCOMING PLAYS
                    </h3>
                    <div className="space-y-2">
                      {activeSystem.upcomingPicks.map((pick, i) => (
                        <div key={i} className="flex items-center justify-between p-3 rounded-lg"
                             style={{ background: 'rgba(255,107,0,0.1)' }}>
                          <div>
                            <p className="font-semibold" style={{ color: '#FFF' }}>{pick.pick}</p>
                            <p className="text-xs" style={{ color: '#808090' }}>{pick.matchup} • {pick.time}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold" style={{ color: '#FF6B00' }}>{pick.confidence}%</p>
                            <p className="text-xs" style={{ color: '#606070' }}>confidence</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recent Results */}
                <div>
                  <h3 className="flex items-center gap-2 text-sm font-bold mb-3" style={{ color: '#808090' }}>
                    <History style={{ width: '14px', height: '14px' }} /> RECENT RESULTS
                  </h3>
                  <div className="space-y-2">
                    {activeSystem.recentPicks.map((pick, i) => (
                      <div key={i} className="flex items-center justify-between p-3 rounded-lg"
                           style={{ background: 'rgba(255,255,255,0.03)' }}>
                        <div className="flex items-center gap-3">
                          {pick.result === 'W' ? (
                            <CheckCircle style={{ color: '#00FF88', width: '16px', height: '16px' }} />
                          ) : pick.result === 'L' ? (
                            <XCircle style={{ color: '#FF4455', width: '16px', height: '16px' }} />
                          ) : (
                            <AlertCircle style={{ color: '#808090', width: '16px', height: '16px' }} />
                          )}
                          <div>
                            <p className="text-sm font-semibold" style={{ color: '#FFF' }}>{pick.pick}</p>
                            <p className="text-xs" style={{ color: '#606070' }}>{pick.date}</p>
                          </div>
                        </div>
                        <span className="text-sm font-bold"
                              style={{ color: pick.profit > 0 ? '#00FF88' : pick.profit < 0 ? '#FF4455' : '#808090' }}>
                          {pick.profit > 0 ? '+' : ''}{pick.profit}u
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar - Popular Systems */}
          <div className="space-y-6">
            <div className="rounded-xl p-5" style={{ background: '#0c0c14', border: '1px solid rgba(255,255,255,0.06)' }}>
              <h3 className="flex items-center gap-2 text-lg font-bold mb-4" style={{ color: '#FFF' }}>
                <Trophy style={{ color: '#FFD700', width: '18px', height: '18px' }} />
                Popular Systems
              </h3>
              <div className="space-y-3">
                {popularSystems.map(system => (
                  <button
                    key={system.id}
                    onClick={() => setActiveSystem(system)}
                    className="w-full text-left p-4 rounded-lg transition-all hover:scale-[1.02]"
                    style={{ 
                      background: activeSystem?.id === system.id ? 'rgba(255,107,0,0.1)' : 'rgba(255,255,255,0.03)',
                      border: activeSystem?.id === system.id ? '1px solid rgba(255,107,0,0.3)' : '1px solid transparent'
                    }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-bold" style={{ color: '#FFF' }}>{system.name}</span>
                      <span className="text-xs px-2 py-0.5 rounded" 
                            style={{ background: 'rgba(255,107,0,0.2)', color: '#FF6B00' }}>
                        {system.sport.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-xs" style={{ color: '#808090' }}>{system.stats.record}</span>
                      <span className="text-xs font-semibold" style={{ color: '#00FF88' }}>
                        {system.stats.winPct}%
                      </span>
                      <span className="text-xs font-semibold" style={{ color: '#00FF88' }}>
                        +{system.stats.roi}% ROI
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Saved Systems */}
            {savedSystems.length > 0 && (
              <div className="rounded-xl p-5" style={{ background: '#0c0c14', border: '1px solid rgba(255,255,255,0.06)' }}>
                <h3 className="flex items-center gap-2 text-lg font-bold mb-4" style={{ color: '#FFF' }}>
                  <Bookmark style={{ color: '#FF6B00', width: '18px', height: '18px' }} />
                  My Systems
                </h3>
                <div className="space-y-2">
                  {savedSystems.map(system => (
                    <button
                      key={system.id}
                      onClick={() => setActiveSystem(system)}
                      className="w-full text-left p-3 rounded-lg"
                      style={{ background: 'rgba(255,255,255,0.03)' }}
                    >
                      <p className="text-sm font-semibold" style={{ color: '#FFF' }}>{system.name}</p>
                      <p className="text-xs" style={{ color: '#808090' }}>{system.stats.record} • {system.stats.winPct}%</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Tips */}
            <div className="rounded-xl p-5" style={{ background: '#0c0c14', border: '1px solid rgba(255,255,255,0.06)' }}>
              <h3 className="flex items-center gap-2 text-lg font-bold mb-4" style={{ color: '#FFF' }}>
                <Star style={{ color: '#FFD700', width: '18px', height: '18px' }} />
                Pro Tips
              </h3>
              <div className="space-y-3 text-sm" style={{ color: '#A0A0B0' }}>
                <p>💡 Systems with <strong style={{ color: '#FFF' }}>50+ sample size</strong> are more reliable</p>
                <p>💡 Look for positive <strong style={{ color: '#FFF' }}>CLV</strong> (Closing Line Value)</p>
                <p>💡 <strong style={{ color: '#FFF' }}>Sharpe Ratio &gt;1</strong> indicates strong risk-adjusted returns</p>
                <p>💡 Use <strong style={{ color: '#FFF' }}>Kelly %</strong> to size bets appropriately</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </main>
  )
}

// Helper component
function StatCard({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="p-3 rounded-lg text-center" style={{ background: 'rgba(255,255,255,0.03)' }}>
      <p className="text-xs mb-1" style={{ color: '#606070' }}>{label}</p>
      <p className="text-xl font-bold" style={{ color: highlight ? '#00FF88' : '#FFF' }}>{value}</p>
    </div>
  )
}
