'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { 
  ArrowLeft, Clock, MapPin, Tv, TrendingUp, TrendingDown, 
  Target, BarChart3, Users, Activity, AlertTriangle, Flame,
  RefreshCw, Loader2, ChevronDown, ChevronUp, Zap, Shield, Award
} from 'lucide-react'

// =============================================================================
// TYPES
// =============================================================================

interface GameData {
  id: string
  sport: string
  status: string
  startTime: string
  venue: string
  broadcast?: string
  homeTeam: TeamData
  awayTeam: TeamData
  period?: string
  clock?: string
  odds?: OddsData
  weather?: { temp: number; condition: string; wind?: string }
}

interface TeamData {
  id: string
  name: string
  abbreviation: string
  logo?: string
  score?: number
  record?: string
  seed?: number
}

interface OddsData {
  spread: { home: number; away: number; homeOdds?: number; awayOdds?: number }
  total: { line: number; overOdds?: number; underOdds?: number }
  moneyline: { home: number; away: number }
  source?: string
}

interface AnalyticsData {
  trends?: {
    matched: number
    aggregateConfidence: number
    topPick?: { selection: string; confidence: number; supportingTrends: number } | null
    spreadTrends?: any[]
    totalTrends?: any[]
  }
  h2h?: {
    gamesPlayed: number
    homeATSRecord: string
    awayATSRecord: string
    overUnderRecord: string
    avgMargin: number
    avgTotal: number
    recentGames?: any[]
  }
  edgeScore?: {
    overall: number
    trendAlignment: number
    sharpSignal: number
    valueIndicator: number
  }
  bettingIntelligence?: any
  topDataPoints?: { label: string; value: string; confidence: number }[]
}

// =============================================================================
// COMPONENT
// =============================================================================

export default function GameMatchupPage({ params }: { params: Promise<{ gameId: string }> }) {
  const { gameId } = use(params)
  
  const [game, setGame] = useState<GameData | null>(null)
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'trends' | 'betting' | 'matchup' | 'analytics' | 'ai'>('overview')
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  
  // Fetch game data
  const fetchData = async () => {
    try {
      setLoading(true)
      
      // Fetch game from ESPN via our API
      const [gamesRes, analyticsRes] = await Promise.all([
        fetch(`/api/games?sport=nfl`),
        fetch(`/api/matchup/${gameId}/analytics?intelligence=true`)
      ])
      
      if (gamesRes.ok) {
        const gamesData = await gamesRes.json()
        const foundGame = gamesData.games?.find((g: GameData) => g.id === gameId)
        if (foundGame) setGame(foundGame)
      }
      
      if (analyticsRes.ok) {
        const analyticsData = await analyticsRes.json()
        setAnalytics(analyticsData)
      }
      
      setLastUpdated(new Date())
    } catch (err) {
      console.error('Error fetching data:', err)
      setError('Failed to load game data')
    } finally {
      setLoading(false)
    }
  }
  
  useEffect(() => {
    fetchData()
    // Refresh every 30 seconds for live games
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [gameId])
  
  // Format time
  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZone: 'America/New_York'
    }) + ' ET'
  }

  if (loading && !game) {
    return (
      <div className="min-h-screen bg-[#050508] flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
      </div>
    )
  }

  if (error || !game) {
    return (
      <div className="min-h-screen bg-[#050508] flex flex-col items-center justify-center gap-4">
        <p className="text-red-400">{error || 'Game not found'}</p>
        <Link href="/nfl/matchups" className="text-orange-500 hover:underline">
          ← Back to matchups
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#050508]">
      {/* Header */}
      <div className="border-b border-white/5 bg-[#0a0a12]">
        <div className="max-w-[1600px] mx-auto px-4 py-4">
          {/* Back Button & Meta */}
          <div className="flex items-center justify-between mb-4">
            <Link href="/nfl/matchups" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
              <ArrowLeft className="w-5 h-5" />
              <span className="text-sm">Back to matchups</span>
            </Link>
            <button
              onClick={fetchData}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 text-gray-400 hover:bg-white/10"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              {lastUpdated && <span className="text-xs">Updated {lastUpdated.toLocaleTimeString()}</span>}
            </button>
          </div>

          {/* Game Info */}
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
            <span className="text-lg">🏈</span>
            <span>NFL Playoffs</span>
            <span className="text-gray-700">•</span>
            <Clock className="w-4 h-4" />
            <span>{formatDateTime(game.startTime)}</span>
          </div>

          {/* Matchup Header */}
          <div className="grid grid-cols-3 gap-8 items-center py-6">
            {/* Away Team */}
            <Link href={`/team/nfl/${game.awayTeam.abbreviation?.toLowerCase()}`} className="flex items-center gap-4 group hover:opacity-80 transition-opacity">
              <div className="w-20 h-20 rounded-2xl bg-white/5 flex items-center justify-center overflow-hidden group-hover:ring-2 ring-orange-500/50 transition-all">
                {game.awayTeam.logo ? (
                  <img src={game.awayTeam.logo} alt={game.awayTeam.name} className="w-16 h-16 object-contain" />
                ) : (
                  <span className="text-4xl">🏈</span>
                )}
              </div>
              <div>
                <div className="text-2xl font-black text-white group-hover:text-orange-400 transition-colors">{game.awayTeam.name}</div>
                <div className="text-sm text-gray-500">{game.awayTeam.record || 'N/A'}</div>
                {game.status !== 'scheduled' && (
                  <div className="text-4xl font-black text-white mt-1">{game.awayTeam.score ?? '-'}</div>
                )}
              </div>
            </Link>

            {/* Center - Odds */}
            <div className="text-center">
              <div className="text-gray-500 text-sm mb-3">VS</div>
              
              {game.odds && (
                <div className="space-y-3">
                  <div className="inline-flex flex-col gap-2 p-4 rounded-xl bg-orange-500/10 border border-orange-500/30">
                    <div>
                      <div className="text-xs text-gray-500 mb-1">SPREAD</div>
                      <div className="text-xl font-bold text-orange-400">
                        {game.awayTeam.abbreviation} {game.odds.spread.away > 0 ? '+' : ''}{game.odds.spread.away}
                      </div>
                    </div>
                  </div>
                  <div className="inline-flex flex-col gap-2 p-4 rounded-xl bg-green-500/10 border border-green-500/30">
                    <div>
                      <div className="text-xs text-gray-500 mb-1">TOTAL</div>
                      <div className="text-xl font-bold text-green-400">O/U {game.odds.total.line}</div>
                    </div>
                  </div>
                </div>
              )}
              
              {game.status === 'in_progress' && (
                <div className="mt-4 flex items-center justify-center gap-2 px-3 py-1.5 bg-green-500/20 rounded-lg">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-green-400 font-bold">LIVE</span>
                  {game.period && <span className="text-gray-400">• {game.period}</span>}
                  {game.clock && <span className="text-gray-400">{game.clock}</span>}
                </div>
              )}
            </div>

            {/* Home Team */}
            <Link href={`/team/nfl/${game.homeTeam.abbreviation?.toLowerCase()}`} className="flex items-center gap-4 justify-end group hover:opacity-80 transition-opacity">
              <div className="text-right">
                <div className="text-2xl font-black text-white group-hover:text-orange-400 transition-colors">{game.homeTeam.name}</div>
                <div className="text-sm text-gray-500">{game.homeTeam.record || 'N/A'}</div>
                {game.status !== 'scheduled' && (
                  <div className="text-4xl font-black text-white mt-1">{game.homeTeam.score ?? '-'}</div>
                )}
              </div>
              <div className="w-20 h-20 rounded-2xl bg-white/5 flex items-center justify-center overflow-hidden group-hover:ring-2 ring-orange-500/50 transition-all">
                {game.homeTeam.logo ? (
                  <img src={game.homeTeam.logo} alt={game.homeTeam.name} className="w-16 h-16 object-contain" />
                ) : (
                  <span className="text-4xl">🏈</span>
                )}
              </div>
            </Link>
          </div>

          {/* AI Prediction Bar */}
          {analytics?.trends?.topPick && (
            <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-orange-500/10 via-orange-500/5 to-transparent border border-orange-500/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Target className="w-5 h-5 text-orange-500" />
                  <span className="text-white font-semibold">AI Prediction</span>
                </div>
                <div className="text-right">
                  <div className="text-orange-400 font-bold">{analytics.trends.topPick.selection}</div>
                </div>
              </div>
              <div className="mt-3">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>{analytics.trends.topPick.confidence}% confidence</span>
                  <span>{analytics.trends.topPick.supportingTrends} trends</span>
                </div>
                <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-orange-500 to-orange-400 rounded-full transition-all"
                    style={{ width: `${analytics.trends.topPick.confidence}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="flex gap-2 mt-6 overflow-x-auto pb-2">
            {[
              { id: 'overview', icon: Target, label: 'Overview' },
              { id: 'trends', icon: TrendingUp, label: 'Trends' },
              { id: 'betting', icon: BarChart3, label: 'Betting' },
              { id: 'matchup', icon: Shield, label: 'Matchup' },
              { id: 'analytics', icon: Activity, label: 'Team Analytics' },
              { id: 'ai', icon: Zap, label: 'AI Analysis' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm whitespace-nowrap transition-all ${
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
      <div className="max-w-[1600px] mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Key Betting Metrics */}
            <div className="bg-[#0c0c14] rounded-xl border border-white/10 p-6">
              <h3 className="text-lg font-bold text-white mb-4">Key Betting Metrics</h3>
              <div className="grid grid-cols-4 gap-4">
                {[
                  { label: 'Line Movement', value: analytics?.bettingIntelligence?.lineMovement || '+0.0', change: '↗', color: 'text-green-400' },
                  { label: 'Public %', value: analytics?.bettingIntelligence?.publicPct ? `${analytics.bettingIntelligence.publicPct}%` : '52%', sub: 'AWAY' },
                  { label: 'Sharp Action', value: analytics?.bettingIntelligence?.sharpPct ? `${analytics.bettingIntelligence.sharpPct}%` : '70%', change: '↗', color: 'text-green-400' },
                  { label: 'Handle %', value: analytics?.bettingIntelligence?.handlePct ? `${analytics.bettingIntelligence.handlePct}%` : '61%' },
                ].map(metric => (
                  <div key={metric.label} className="bg-[#16161e] rounded-lg p-4 text-center">
                    <div className="text-xs text-gray-500 mb-2">{metric.label}</div>
                    <div className={`text-2xl font-bold ${metric.color || 'text-white'}`}>
                      {metric.value} {metric.change && <span className="text-sm">{metric.change}</span>}
                    </div>
                    {metric.sub && <div className="text-xs text-gray-500 mt-1">{metric.sub}</div>}
                  </div>
                ))}
              </div>
            </div>

            {/* Head-to-Head History */}
            <div className="bg-[#0c0c14] rounded-xl border border-white/10 p-6">
              <h3 className="text-lg font-bold text-white mb-4">Head-to-Head History</h3>
              {analytics?.h2h && analytics.h2h.gamesPlayed > 0 ? (
                <div className="grid grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white">{analytics.h2h.gamesPlayed}</div>
                    <div className="text-xs text-gray-500">Games</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-400">{analytics.h2h.homeATSRecord}</div>
                    <div className="text-xs text-gray-500">Home ATS</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-400">{analytics.h2h.overUnderRecord}</div>
                    <div className="text-xs text-gray-500">O/U Record</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-400">{analytics.h2h.avgTotal?.toFixed(1)}</div>
                    <div className="text-xs text-gray-500">Avg Total</div>
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-500 py-4">No head-to-head data available</div>
              )}
            </div>

            {/* Trends */}
            {analytics?.trends && analytics.trends.matched > 0 && (
              <div className="bg-[#0c0c14] rounded-xl border border-white/10 p-6">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-orange-500" />
                  Betting Trends ({analytics.trends.matched} matched)
                </h3>
                <div className="space-y-3">
                  {analytics.trends.spreadTrends?.slice(0, 5).map((trend: any, i: number) => (
                    <Link 
                      key={i} 
                      href={`/trends?sport=nfl&team=${game.homeTeam.abbreviation}`}
                      className="flex items-center justify-between p-3 bg-[#16161e] rounded-lg hover:bg-white/10 transition-colors group"
                    >
                      <span className="text-gray-300 group-hover:text-white transition-colors">{trend.description || trend.text}</span>
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-bold ${trend.confidence >= 70 ? 'text-green-400' : 'text-amber-400'}`}>
                          {trend.confidence || trend.result}%
                        </span>
                        {trend.edge && (
                          <span className="text-xs px-2 py-0.5 rounded bg-green-500/20 text-green-400">
                            +{trend.edge}% edge
                          </span>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Signals */}
            <div className="bg-[#0c0c14] rounded-xl border border-white/10 p-6">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-400" />
                Quick Signals
              </h3>
              
              {analytics?.edgeScore && analytics.edgeScore.overall > 0 ? (
                <Link 
                  href={`/edge/${gameId}`}
                  className="block space-y-4 hover:opacity-80 transition-opacity cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Edge Score</span>
                    <span className={`text-xl font-bold ${
                      analytics.edgeScore.overall >= 70 ? 'text-green-400' :
                      analytics.edgeScore.overall >= 50 ? 'text-amber-400' : 'text-gray-400'
                    }`}>
                      {analytics.edgeScore.overall}/100
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Trend Alignment</span>
                      <span className="text-white">{analytics.edgeScore.trendAlignment}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Sharp Signal</span>
                      <span className="text-white">{analytics.edgeScore.sharpSignal}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Value Indicator</span>
                      <span className="text-white">{analytics.edgeScore.valueIndicator}</span>
                    </div>
                  </div>
                  <div className="mt-4 text-center text-sm text-orange-400 hover:text-orange-300">
                    Click for detailed breakdown →
                  </div>
                </Link>
              ) : (
                <div className="text-gray-500 text-center py-4">
                  Signals calculating...
                </div>
              )}
            </div>

            {/* Injury Report */}
            <div className="bg-[#0c0c14] rounded-xl border border-white/10 p-6">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-400" />
                Injury Report
              </h3>
              {/* Mock injury data - in production, fetch from API */}
              {(() => {
                const injuries = [
                  { id: 'player-1', name: 'Key Player', team: game.awayTeam.abbreviation, position: 'WR', status: 'Questionable', injury: 'Hamstring' },
                  { id: 'player-2', name: 'Star RB', team: game.homeTeam.abbreviation, position: 'RB', status: 'Probable', injury: 'Ankle' },
                ]
                if (injuries.length === 0) {
                  return <div className="text-gray-500 text-sm">No significant injuries reported</div>
                }
                return (
                  <div className="space-y-2">
                    {injuries.map((inj, i) => (
                      <Link 
                        key={i}
                        href={`/player/nfl/${inj.id}`}
                        className="flex items-center justify-between p-2 rounded-lg bg-[#16161e] hover:bg-white/10 transition-colors group"
                      >
                        <div className="flex items-center gap-2">
                          <span className={`text-xs px-1.5 py-0.5 rounded font-semibold ${
                            inj.status === 'Out' ? 'bg-red-500/20 text-red-400' :
                            inj.status === 'Questionable' ? 'bg-amber-500/20 text-amber-400' :
                            'bg-green-500/20 text-green-400'
                          }`}>{inj.status}</span>
                          <span className="text-white text-sm group-hover:text-orange-400 transition-colors">{inj.name}</span>
                          <span className="text-gray-500 text-xs">{inj.position}</span>
                        </div>
                        <span className="text-gray-500 text-xs">{inj.injury}</span>
                      </Link>
                    ))}
                  </div>
                )
              })()}
            </div>

            {/* Game Info */}
            <div className="bg-[#0c0c14] rounded-xl border border-white/10 p-6">
              <h3 className="text-lg font-bold text-white mb-4">Game Info</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2 text-gray-400">
                  <MapPin className="w-4 h-4" />
                  <span>{game.venue || 'TBD'}</span>
                </div>
                {game.broadcast && (
                  <div className="flex items-center gap-2 text-gray-400">
                    <Tv className="w-4 h-4" />
                    <span>{game.broadcast}</span>
                  </div>
                )}
                {game.weather && (
                  <div className="flex items-center gap-2 text-gray-400">
                    <Activity className="w-4 h-4" />
                    <span>{game.weather.temp}°F - {game.weather.condition}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Links */}
            <div className="space-y-2">
              <Link 
                href={`/trends?sport=nfl`}
                className="flex items-center justify-between p-4 bg-[#0c0c14] rounded-xl border border-white/10 hover:border-orange-500/30 transition-all"
              >
                <div className="flex items-center gap-3">
                  <TrendingUp className="w-5 h-5 text-orange-500" />
                  <span className="text-white font-medium">View All NFL Trends</span>
                </div>
                <ChevronDown className="w-5 h-5 text-gray-500 -rotate-90" />
              </Link>
              <Link 
                href={`/live`}
                className="flex items-center justify-between p-4 bg-[#0c0c14] rounded-xl border border-white/10 hover:border-orange-500/30 transition-all"
              >
                <div className="flex items-center gap-3">
                  <Flame className="w-5 h-5 text-red-500" />
                  <span className="text-white font-medium">Live Edge Alerts</span>
                </div>
                <ChevronDown className="w-5 h-5 text-gray-500 -rotate-90" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
