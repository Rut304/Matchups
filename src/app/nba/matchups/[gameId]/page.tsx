'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { 
  ArrowLeft, Clock, MapPin, Tv, TrendingUp, Target, BarChart3, 
  Activity, AlertTriangle, Flame, RefreshCw, Loader2, ChevronDown, Zap, Shield
} from 'lucide-react'

interface GameData {
  id: string
  sport: string
  status: string
  startTime: string
  scheduledAt?: string
  venue: string
  broadcast?: string
  homeTeam: { id: string; name: string; abbreviation: string; logo?: string; score?: number; record?: string }
  awayTeam: { id: string; name: string; abbreviation: string; logo?: string; score?: number; record?: string }
  period?: string
  clock?: string
  odds?: { spread: number; total: number; homeML?: number; awayML?: number }
}

interface AnalyticsData {
  trends?: { matched: number; aggregateConfidence: number; topPick?: { selection: string; confidence: number; supportingTrends: number } | null; spreadTrends?: any[]; totalTrends?: any[] }
  h2h?: { gamesPlayed: number; homeATSRecord: string; awayATSRecord: string; overUnderRecord: string; avgMargin: number; avgTotal: number }
  edgeScore?: { overall: number; trendAlignment: number; sharpSignal: number; valueIndicator: number }
  bettingIntelligence?: any
}

export default function NBAGameMatchupPage({ params }: { params: Promise<{ gameId: string }> }) {
  const { gameId } = use(params)
  const [game, setGame] = useState<GameData | null>(null)
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const fetchData = async () => {
    try {
      setLoading(true)
      const [gamesRes, analyticsRes] = await Promise.all([
        fetch(`/api/games?sport=nba`),
        fetch(`/api/matchup/${gameId}/analytics?intelligence=true`)
      ])
      
      if (gamesRes.ok) {
        const data = await gamesRes.json()
        const found = data.games?.find((g: GameData) => g.id === gameId)
        if (found) setGame(found)
      }
      if (analyticsRes.ok) setAnalytics(await analyticsRes.json())
      setLastUpdated(new Date())
    } catch (err) {
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [gameId])

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('en-US', {
      weekday: 'long', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'America/New_York'
    }) + ' ET'
  }

  if (loading && !game) {
    return <div className="min-h-screen bg-[#050508] flex items-center justify-center"><Loader2 className="w-10 h-10 text-orange-500 animate-spin" /></div>
  }

  if (!game) {
    return (
      <div className="min-h-screen bg-[#050508] flex flex-col items-center justify-center gap-4">
        <p className="text-red-400">Game not found</p>
        <Link href="/nba/matchups" className="text-orange-500 hover:underline">← Back to matchups</Link>
      </div>
    )
  }

  const isLive = game.status === 'live'
  const spread = game.odds?.spread || 0

  return (
    <div className="min-h-screen bg-[#050508]">
      {/* Header */}
      <div className="border-b border-white/5 bg-[#0a0a12]">
        <div className="max-w-[1600px] mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <Link href="/nba/matchups" className="flex items-center gap-2 text-gray-400 hover:text-white"><ArrowLeft className="w-5 h-5" /><span className="text-sm">Back to matchups</span></Link>
            <button onClick={fetchData} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 text-gray-400 hover:bg-white/10">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              {lastUpdated && <span className="text-xs">Updated {lastUpdated.toLocaleTimeString()}</span>}
            </button>
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
            <span className="text-lg">🏀</span><span>NBA</span><span className="text-gray-700">•</span>
            <Clock className="w-4 h-4" /><span>{formatDateTime(game.scheduledAt || game.startTime)}</span>
          </div>

          {/* Matchup Header */}
          <div className="grid grid-cols-3 gap-8 items-center py-6">
            <Link href={`/team/nba/${game.awayTeam.abbreviation?.toLowerCase()}`} className="flex items-center gap-4 group hover:opacity-80 transition-opacity">
              <div className="w-20 h-20 rounded-2xl bg-white/5 flex items-center justify-center overflow-hidden group-hover:ring-2 ring-orange-500/50 transition-all">
                {game.awayTeam.logo ? <img src={game.awayTeam.logo} alt="" className="w-16 h-16 object-contain" /> : <span className="text-4xl">🏀</span>}
              </div>
              <div>
                <div className="text-2xl font-black text-white group-hover:text-orange-400 transition-colors">{game.awayTeam.name}</div>
                <div className="text-sm text-gray-500">{game.awayTeam.record || ''}</div>
                {game.status !== 'scheduled' && <div className="text-4xl font-black text-white mt-1">{game.awayTeam.score ?? '-'}</div>}
              </div>
            </Link>

            <div className="text-center">
              <div className="text-gray-500 text-sm mb-3">VS</div>
              {game.odds && (
                <div className="space-y-3">
                  <div className="inline-flex flex-col p-4 rounded-xl bg-orange-500/10 border border-orange-500/30">
                    <div className="text-xs text-gray-500 mb-1">SPREAD</div>
                    <div className="text-xl font-bold text-orange-400">{game.awayTeam.abbreviation} {spread > 0 ? '+' : ''}{spread}</div>
                  </div>
                  <div className="inline-flex flex-col p-4 rounded-xl bg-green-500/10 border border-green-500/30">
                    <div className="text-xs text-gray-500 mb-1">TOTAL</div>
                    <div className="text-xl font-bold text-green-400">O/U {game.odds.total}</div>
                  </div>
                </div>
              )}
              {isLive && (
                <div className="mt-4 flex items-center justify-center gap-2 px-3 py-1.5 bg-green-500/20 rounded-lg">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-green-400 font-bold">LIVE</span>
                  {game.period && <span className="text-gray-400">• {game.period} {game.clock}</span>}
                </div>
              )}
            </div>

            <Link href={`/team/nba/${game.homeTeam.abbreviation?.toLowerCase()}`} className="flex items-center gap-4 justify-end group hover:opacity-80 transition-opacity">
              <div className="text-right">
                <div className="text-2xl font-black text-white group-hover:text-orange-400 transition-colors">{game.homeTeam.name}</div>
                <div className="text-sm text-gray-500">{game.homeTeam.record || ''}</div>
                {game.status !== 'scheduled' && <div className="text-4xl font-black text-white mt-1">{game.homeTeam.score ?? '-'}</div>}
              </div>
              <div className="w-20 h-20 rounded-2xl bg-white/5 flex items-center justify-center overflow-hidden group-hover:ring-2 ring-orange-500/50 transition-all">
                {game.homeTeam.logo ? <img src={game.homeTeam.logo} alt="" className="w-16 h-16 object-contain" /> : <span className="text-4xl">🏀</span>}
              </div>
            </Link>
          </div>

          {/* AI Prediction */}
          {analytics?.trends?.topPick && (
            <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-orange-500/10 via-orange-500/5 to-transparent border border-orange-500/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3"><Target className="w-5 h-5 text-orange-500" /><span className="text-white font-semibold">AI Prediction</span></div>
                <div className="text-orange-400 font-bold">{analytics.trends.topPick.selection}</div>
              </div>
              <div className="mt-3">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>{analytics.trends.topPick.confidence}% confidence</span>
                  <span>{analytics.trends.topPick.supportingTrends} trends</span>
                </div>
                <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-orange-500 to-orange-400 rounded-full" style={{ width: `${analytics.trends.topPick.confidence}%` }} />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-[1600px] mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Key Metrics */}
            <div className="bg-[#0c0c14] rounded-xl border border-white/10 p-6">
              <h3 className="text-lg font-bold text-white mb-4">Key Betting Metrics</h3>
              <div className="grid grid-cols-4 gap-4">
                {[
                  { label: 'Line Movement', value: analytics?.bettingIntelligence?.lineMovement || '+0.0', color: 'text-green-400' },
                  { label: 'Public %', value: `${analytics?.bettingIntelligence?.publicPct || 52}%`, sub: 'AWAY' },
                  { label: 'Sharp Action', value: `${analytics?.bettingIntelligence?.sharpPct || 55}%`, color: 'text-green-400' },
                  { label: 'Handle %', value: `${analytics?.bettingIntelligence?.handlePct || 51}%` },
                ].map(m => (
                  <div key={m.label} className="bg-[#16161e] rounded-lg p-4 text-center">
                    <div className="text-xs text-gray-500 mb-2">{m.label}</div>
                    <div className={`text-2xl font-bold ${m.color || 'text-white'}`}>{m.value}</div>
                    {m.sub && <div className="text-xs text-gray-500 mt-1">{m.sub}</div>}
                  </div>
                ))}
              </div>
            </div>

            {/* H2H */}
            <div className="bg-[#0c0c14] rounded-xl border border-white/10 p-6">
              <h3 className="text-lg font-bold text-white mb-4">Head-to-Head History</h3>
              {analytics?.h2h && analytics.h2h.gamesPlayed > 0 ? (
                <div className="grid grid-cols-4 gap-4">
                  <div className="text-center"><div className="text-2xl font-bold text-white">{analytics.h2h.gamesPlayed}</div><div className="text-xs text-gray-500">Games</div></div>
                  <div className="text-center"><div className="text-2xl font-bold text-orange-400">{analytics.h2h.homeATSRecord}</div><div className="text-xs text-gray-500">Home ATS</div></div>
                  <div className="text-center"><div className="text-2xl font-bold text-blue-400">{analytics.h2h.overUnderRecord}</div><div className="text-xs text-gray-500">O/U Record</div></div>
                  <div className="text-center"><div className="text-2xl font-bold text-green-400">{analytics.h2h.avgTotal?.toFixed(1)}</div><div className="text-xs text-gray-500">Avg Total</div></div>
                </div>
              ) : (
                <div className="text-center text-gray-500 py-4">No head-to-head data available</div>
              )}
            </div>

            {/* Trends */}
            {analytics?.trends && analytics.trends.matched > 0 && (
              <div className="bg-[#0c0c14] rounded-xl border border-white/10 p-6">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-orange-500" />Betting Trends ({analytics.trends.matched} matched)
                </h3>
                <div className="space-y-3">
                  {analytics.trends.spreadTrends?.slice(0, 5).map((trend: any, i: number) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-[#16161e] rounded-lg">
                      <span className="text-gray-300">{trend.description || trend.text}</span>
                      <span className={`text-sm font-bold ${trend.confidence >= 70 ? 'text-green-400' : 'text-amber-400'}`}>{trend.confidence}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="bg-[#0c0c14] rounded-xl border border-white/10 p-6">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><Zap className="w-5 h-5 text-amber-400" />Quick Signals</h3>
              {analytics?.edgeScore && analytics.edgeScore.overall > 0 ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Edge Score</span>
                    <span className={`text-xl font-bold ${analytics.edgeScore.overall >= 70 ? 'text-green-400' : analytics.edgeScore.overall >= 50 ? 'text-amber-400' : 'text-gray-400'}`}>{analytics.edgeScore.overall}/100</span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-gray-500">Trend Alignment</span><span className="text-white">{analytics.edgeScore.trendAlignment}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Sharp Signal</span><span className="text-white">{analytics.edgeScore.sharpSignal}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Value Indicator</span><span className="text-white">{analytics.edgeScore.valueIndicator}</span></div>
                  </div>
                </div>
              ) : (
                <div className="text-gray-500 text-center py-4">Signals calculating...</div>
              )}
            </div>

            <div className="bg-[#0c0c14] rounded-xl border border-white/10 p-6">
              <h3 className="text-lg font-bold text-white mb-4">Game Info</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2 text-gray-400"><MapPin className="w-4 h-4" /><span>{game.venue || 'TBD'}</span></div>
                {game.broadcast && <div className="flex items-center gap-2 text-gray-400"><Tv className="w-4 h-4" /><span>{game.broadcast}</span></div>}
              </div>
            </div>

            <Link href="/trends?sport=nba" className="flex items-center justify-between p-4 bg-[#0c0c14] rounded-xl border border-white/10 hover:border-orange-500/30 transition-all">
              <div className="flex items-center gap-3"><TrendingUp className="w-5 h-5 text-orange-500" /><span className="text-white font-medium">View All NBA Trends</span></div>
              <ChevronDown className="w-5 h-5 text-gray-500 -rotate-90" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
