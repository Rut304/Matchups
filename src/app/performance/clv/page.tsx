'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  TrendingUp, TrendingDown, Target, BarChart3, Activity, 
  ChevronDown, RefreshCw, Info, ArrowUpRight, ArrowDownRight,
  CheckCircle, XCircle, Clock
} from 'lucide-react'

interface CLVSummary {
  totalPicks: number
  avgClv: number
  clvPositive: number
  clvNegative: number
  clvPositiveRate: number
  totalClvCents: number
  estimatedEdge: number
}

interface Distribution {
  range: string
  count: number
  percentage: number
}

interface RecentPick {
  id: string
  sport: string
  pickTeam: string
  openLine: number
  closeLine: number
  clv: number
  result: string
  date: string
}

interface TrendPoint {
  date: string
  avgClv: number
  cumulative: number
}

interface SportBreakdown {
  sport: string
  picks: number
  avgClv: number
  positiveRate: number
}

interface BetTypeBreakdown {
  type: string
  picks: number
  avgClv: number
  positiveRate: number
}

interface CLVData {
  summary: CLVSummary
  distribution: Distribution[]
  recentPicks: RecentPick[]
  trendData: TrendPoint[]
  sportBreakdown: SportBreakdown[]
  betTypeBreakdown: BetTypeBreakdown[]
}

export default function CLVDashboardPage() {
  const [data, setData] = useState<CLVData | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('30d')
  const [sport, setSport] = useState('all')
  const [betType, setBetType] = useState('all')

  useEffect(() => {
    fetchData()
  }, [timeRange, sport, betType])

  async function fetchData() {
    setLoading(true)
    try {
      const params = new URLSearchParams({ timeRange, sport, betType })
      const res = await fetch(`/api/clv?${params}`)
      if (res.ok) {
        const json = await res.json()
        setData(json)
      }
    } catch (error) {
      console.error('Failed to fetch CLV data:', error)
    }
    setLoading(false)
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    })
  }

  function getResultIcon(result: string) {
    switch (result) {
      case 'win':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'loss':
        return <XCircle className="w-4 h-4 text-red-500" />
      default:
        return <Clock className="w-4 h-4 text-yellow-500" />
    }
  }

  if (loading && !data) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <RefreshCw className="w-8 h-8 text-green-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] py-8 px-4">
      {/* DEMO DATA WARNING BANNER */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="bg-yellow-500/20 border border-yellow-500/40 rounded-xl py-3 px-4">
          <div className="flex items-center justify-center gap-3">
            <span className="text-2xl">⚠️</span>
            <p className="text-yellow-400 font-bold text-center">
              DEMO DATA - CLV tracking will show real data when you start logging picks.
            </p>
            <span className="text-2xl">⚠️</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Target className="w-8 h-8 text-green-500" />
              CLV Tracker
            </h1>
            <p className="text-gray-400 mt-1">
              Track your Closing Line Value - the #1 indicator of betting edge
            </p>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
              <option value="all">All Time</option>
            </select>

            <select
              value={sport}
              onChange={(e) => setSport(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="all">All Sports</option>
              <option value="nfl">NFL</option>
              <option value="nba">NBA</option>
              <option value="nhl">NHL</option>
              <option value="mlb">MLB</option>
            </select>

            <select
              value={betType}
              onChange={(e) => setBetType(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="all">All Bet Types</option>
              <option value="spread">Spread</option>
              <option value="moneyline">Moneyline</option>
              <option value="total">Total</option>
            </select>

            <button
              onClick={fetchData}
              disabled={loading}
              className="p-2 bg-white/5 rounded-lg hover:bg-white/10 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-5 h-5 text-gray-400 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* What is CLV? */}
        <div className="bg-gradient-to-r from-green-500/10 to-blue-500/10 border border-green-500/20 rounded-xl p-4 mb-8">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-white mb-1">What is Closing Line Value (CLV)?</h3>
              <p className="text-sm text-gray-400">
                CLV measures the difference between the line when you placed your bet vs the closing line. 
                Positive CLV means you got a better number than the market close - the single best predictor of long-term profitability.
                <span className="text-green-400 ml-1">Sharp bettors average +2-3 cents CLV.</span>
              </p>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white/5 rounded-xl p-5 border border-white/10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Average CLV</span>
              {(data?.summary.avgClv || 0) >= 0 ? (
                <TrendingUp className="w-5 h-5 text-green-500" />
              ) : (
                <TrendingDown className="w-5 h-5 text-red-500" />
              )}
            </div>
            <div className={`text-3xl font-bold ${(data?.summary.avgClv || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {(data?.summary.avgClv || 0) >= 0 ? '+' : ''}{data?.summary.avgClv?.toFixed(1)}¢
            </div>
            <div className="text-xs text-gray-500 mt-1">per pick</div>
          </div>

          <div className="bg-white/5 rounded-xl p-5 border border-white/10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">CLV+ Rate</span>
              <Target className="w-5 h-5 text-blue-500" />
            </div>
            <div className="text-3xl font-bold text-white">
              {data?.summary.clvPositiveRate?.toFixed(1)}%
            </div>
            <div className="text-xs text-gray-500 mt-1">{data?.summary.clvPositive} of {data?.summary.totalPicks} picks</div>
          </div>

          <div className="bg-white/5 rounded-xl p-5 border border-white/10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Total CLV</span>
              <BarChart3 className="w-5 h-5 text-purple-500" />
            </div>
            <div className={`text-3xl font-bold ${(data?.summary.totalClvCents || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {(data?.summary.totalClvCents || 0) >= 0 ? '+' : ''}{data?.summary.totalClvCents}¢
            </div>
            <div className="text-xs text-gray-500 mt-1">cumulative</div>
          </div>

          <div className="bg-white/5 rounded-xl p-5 border border-white/10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Est. Edge</span>
              <Activity className="w-5 h-5 text-yellow-500" />
            </div>
            <div className={`text-3xl font-bold ${(data?.summary.estimatedEdge || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {(data?.summary.estimatedEdge || 0) >= 0 ? '+' : ''}{data?.summary.estimatedEdge?.toFixed(1)}%
            </div>
            <div className="text-xs text-gray-500 mt-1">theoretical</div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          {/* CLV Distribution */}
          <div className="bg-white/5 rounded-xl p-6 border border-white/10">
            <h2 className="text-lg font-semibold text-white mb-4">CLV Distribution</h2>
            <div className="space-y-3">
              {data?.distribution.map((bucket, idx) => (
                <div key={idx}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-400">{bucket.range}</span>
                    <span className="text-sm text-white">{bucket.count} ({bucket.percentage.toFixed(1)}%)</span>
                  </div>
                  <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all ${
                        idx < 3 ? 'bg-red-500' : idx === 3 ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${bucket.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sport Breakdown */}
          <div className="bg-white/5 rounded-xl p-6 border border-white/10">
            <h2 className="text-lg font-semibold text-white mb-4">By Sport</h2>
            <div className="space-y-4">
              {data?.sportBreakdown.map((s, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <div>
                    <div className="font-medium text-white">{s.sport}</div>
                    <div className="text-xs text-gray-500">{s.picks} picks</div>
                  </div>
                  <div className="text-right">
                    <div className={`font-bold ${s.avgClv >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {s.avgClv >= 0 ? '+' : ''}{s.avgClv.toFixed(1)}¢
                    </div>
                    <div className="text-xs text-gray-500">{s.positiveRate.toFixed(0)}% CLV+</div>
                  </div>
                </div>
              ))}
              {(!data?.sportBreakdown || data.sportBreakdown.length === 0) && (
                <div className="text-center text-gray-500 py-4">No data for this period</div>
              )}
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          {/* Bet Type Breakdown */}
          <div className="bg-white/5 rounded-xl p-6 border border-white/10">
            <h2 className="text-lg font-semibold text-white mb-4">By Bet Type</h2>
            <div className="space-y-4">
              {data?.betTypeBreakdown.map((bt, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <div>
                    <div className="font-medium text-white capitalize">{bt.type}</div>
                    <div className="text-xs text-gray-500">{bt.picks} picks</div>
                  </div>
                  <div className="text-right">
                    <div className={`font-bold ${bt.avgClv >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {bt.avgClv >= 0 ? '+' : ''}{bt.avgClv.toFixed(1)}¢
                    </div>
                    <div className="text-xs text-gray-500">{bt.positiveRate.toFixed(0)}% CLV+</div>
                  </div>
                </div>
              ))}
              {(!data?.betTypeBreakdown || data.betTypeBreakdown.length === 0) && (
                <div className="text-center text-gray-500 py-4">No data for this period</div>
              )}
            </div>
          </div>

          {/* CLV Trend */}
          <div className="bg-white/5 rounded-xl p-6 border border-white/10">
            <h2 className="text-lg font-semibold text-white mb-4">CLV Trend (Weekly)</h2>
            {data?.trendData && data.trendData.length > 0 ? (
              <div className="space-y-2">
                {data.trendData.slice(-8).map((point, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 hover:bg-white/5 rounded-lg transition-colors">
                    <span className="text-sm text-gray-400">{formatDate(point.date)}</span>
                    <div className="flex items-center gap-4">
                      <span className={`text-sm font-medium ${point.avgClv >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {point.avgClv >= 0 ? '+' : ''}{point.avgClv.toFixed(1)}¢
                      </span>
                      <span className="text-xs text-gray-500">
                        Cum: {point.cumulative >= 0 ? '+' : ''}{point.cumulative.toFixed(1)}¢
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">No trend data available</div>
            )}
          </div>
        </div>

        {/* Recent Picks */}
        <div className="bg-white/5 rounded-xl p-6 border border-white/10">
          <h2 className="text-lg font-semibold text-white mb-4">Recent Picks with CLV</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-gray-500 border-b border-white/10">
                  <th className="pb-3 pr-4">Date</th>
                  <th className="pb-3 pr-4">Sport</th>
                  <th className="pb-3 pr-4">Pick</th>
                  <th className="pb-3 pr-4">Open Line</th>
                  <th className="pb-3 pr-4">Close Line</th>
                  <th className="pb-3 pr-4">CLV</th>
                  <th className="pb-3">Result</th>
                </tr>
              </thead>
              <tbody>
                {data?.recentPicks.map((pick, idx) => (
                  <tr key={idx} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="py-3 pr-4 text-sm text-gray-400">{formatDate(pick.date)}</td>
                    <td className="py-3 pr-4">
                      <span className="text-xs font-medium text-white bg-white/10 px-2 py-1 rounded">
                        {pick.sport}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-sm text-white font-medium">{pick.pickTeam}</td>
                    <td className="py-3 pr-4 text-sm text-gray-400">
                      {pick.openLine > 0 ? '+' : ''}{pick.openLine}
                    </td>
                    <td className="py-3 pr-4 text-sm text-gray-400">
                      {pick.closeLine > 0 ? '+' : ''}{pick.closeLine}
                    </td>
                    <td className="py-3 pr-4">
                      <div className={`flex items-center gap-1 text-sm font-medium ${pick.clv >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {pick.clv >= 0 ? (
                          <ArrowUpRight className="w-4 h-4" />
                        ) : (
                          <ArrowDownRight className="w-4 h-4" />
                        )}
                        {pick.clv >= 0 ? '+' : ''}{(pick.clv * 100).toFixed(0)}¢
                      </div>
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        {getResultIcon(pick.result)}
                        <span className="text-sm capitalize text-gray-400">{pick.result}</span>
                      </div>
                    </td>
                  </tr>
                ))}
                {(!data?.recentPicks || data.recentPicks.length === 0) && (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-gray-500">
                      No picks with CLV data found. Log your picks with opening lines to start tracking.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Tips */}
        <div className="mt-8 bg-white/5 rounded-xl p-6 border border-white/10">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-500" />
            Tips to Improve Your CLV
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-white/5 rounded-lg">
              <h3 className="text-sm font-medium text-white mb-2">📈 Bet Early</h3>
              <p className="text-xs text-gray-400">Lines are softest when first released. Get in early before sharps move the market.</p>
            </div>
            <div className="p-4 bg-white/5 rounded-lg">
              <h3 className="text-sm font-medium text-white mb-2">🎯 Track Line Moves</h3>
              <p className="text-xs text-gray-400">Understand why lines move. RLM and steam moves indicate sharp action.</p>
            </div>
            <div className="p-4 bg-white/5 rounded-lg">
              <h3 className="text-sm font-medium text-white mb-2">📊 Shop Lines</h3>
              <p className="text-xs text-gray-400">Different books have different numbers. Half a point matters over time.</p>
            </div>
            <div className="p-4 bg-white/5 rounded-lg">
              <h3 className="text-sm font-medium text-white mb-2">💡 Focus on +CLV</h3>
              <p className="text-xs text-gray-400">Win rate fluctuates, but consistently beating the close = long-term profit.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
