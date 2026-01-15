'use client'

import { useState, useEffect } from 'react'

interface ApiSummary {
  name: string
  totalCalls: number
  totalErrors: number
  avgResponseTime: number
  endpoints: number
  status: 'healthy' | 'degraded' | 'down'
}

interface RateLimitInfo {
  api: string
  limit: number
  used: number
  remaining: number
  resetsAt: string
}

interface DailyUsage {
  date: string
  totalCalls: number
  totalErrors: number
  byApi: Record<string, number>
}

interface RecentError {
  api: string
  endpoint: string
  errors: number
  errorRate: number
  lastOccurred: string
}

interface UsageData {
  summary: {
    totalCalls: number
    totalErrors: number
    errorRate: number
    avgResponseTime: number
    apisMonitored: number
    healthyApis: number
  }
  byApi: ApiSummary[]
  rateLimits: RateLimitInfo[]
  dailyHistory: DailyUsage[]
  recentErrors: RecentError[]
}

const statusColors = {
  healthy: 'bg-green-500',
  degraded: 'bg-yellow-500',
  down: 'bg-red-500',
}

const statusBgColors = {
  healthy: 'bg-green-500/20 text-green-400 border-green-500/30',
  degraded: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  down: 'bg-red-500/20 text-red-400 border-red-500/30',
}

export default function ApiUsagePage() {
  const [data, setData] = useState<UsageData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedTimeframe, setSelectedTimeframe] = useState<'7d' | '14d' | '30d'>('7d')

  useEffect(() => {
    fetchData()
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchData = async () => {
    try {
      const res = await fetch('/api/admin/api-usage')
      const result = await res.json()
      setData(result)
    } catch (error) {
      console.error('Failed to fetch API usage:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleRefresh = () => {
    setRefreshing(true)
    fetchData()
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
    return num.toString()
  }

  const formatTimeUntil = (dateStr: string) => {
    const ms = new Date(dateStr).getTime() - Date.now()
    if (ms < 0) return 'Reset now'
    const mins = Math.floor(ms / 60000)
    const hours = Math.floor(mins / 60)
    if (hours > 0) return `${hours}h ${mins % 60}m`
    return `${mins}m`
  }

  const getTimeframeDays = () => {
    return parseInt(selectedTimeframe.replace('d', ''))
  }

  const filteredHistory = data?.dailyHistory.slice(-getTimeframeDays()) || []
  const maxDailyCalls = Math.max(...filteredHistory.map(d => d.totalCalls), 1)

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 flex items-center justify-center">
        <p className="text-gray-400">Failed to load API usage data</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
                <span className="text-xl">📊</span>
              </div>
              <h1 className="text-3xl font-bold text-white">API Usage Dashboard</h1>
              <span className="px-2 py-0.5 rounded-full text-xs bg-red-500/20 text-red-400 border border-red-500/30">
                Admin Only
              </span>
            </div>
            <p className="text-gray-400">
              Monitor API calls, rate limits, and system health across all external services
            </p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
          >
            <span className={refreshing ? 'animate-spin' : ''}>🔄</span>
            Refresh
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
          <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-4">
            <div className="text-gray-400 text-sm mb-1">Total Calls (24h)</div>
            <div className="text-2xl font-bold text-white">{formatNumber(data.summary.totalCalls)}</div>
          </div>
          <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-4">
            <div className="text-gray-400 text-sm mb-1">Total Errors</div>
            <div className="text-2xl font-bold text-red-400">{formatNumber(data.summary.totalErrors)}</div>
          </div>
          <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-4">
            <div className="text-gray-400 text-sm mb-1">Error Rate</div>
            <div className={`text-2xl font-bold ${data.summary.errorRate > 5 ? 'text-red-400' : data.summary.errorRate > 1 ? 'text-yellow-400' : 'text-green-400'}`}>
              {data.summary.errorRate}%
            </div>
          </div>
          <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-4">
            <div className="text-gray-400 text-sm mb-1">Avg Response</div>
            <div className={`text-2xl font-bold ${data.summary.avgResponseTime > 500 ? 'text-red-400' : data.summary.avgResponseTime > 200 ? 'text-yellow-400' : 'text-green-400'}`}>
              {data.summary.avgResponseTime}ms
            </div>
          </div>
          <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-4">
            <div className="text-gray-400 text-sm mb-1">APIs Monitored</div>
            <div className="text-2xl font-bold text-white">{data.summary.apisMonitored}</div>
          </div>
          <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-4">
            <div className="text-gray-400 text-sm mb-1">Healthy APIs</div>
            <div className="text-2xl font-bold text-green-400">
              {data.summary.healthyApis}/{data.summary.apisMonitored}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* API Status Cards */}
          <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-4">
            <h2 className="text-lg font-bold text-white mb-4">API Status</h2>
            <div className="space-y-3">
              {data.byApi.map(api => (
                <div
                  key={api.name}
                  className="bg-gray-900/50 rounded-lg p-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${statusColors[api.status]}`} />
                      <span className="font-semibold text-white">{api.name}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs border ${statusBgColors[api.status]}`}>
                        {api.status}
                      </span>
                    </div>
                    <span className="text-gray-400 text-sm">{api.endpoints} endpoints</span>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-400">Calls: </span>
                      <span className="text-white">{formatNumber(api.totalCalls)}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Errors: </span>
                      <span className={api.totalErrors > 0 ? 'text-red-400' : 'text-green-400'}>
                        {formatNumber(api.totalErrors)}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400">Avg: </span>
                      <span className={
                        api.avgResponseTime > 500 ? 'text-red-400' : 
                        api.avgResponseTime > 200 ? 'text-yellow-400' : 'text-green-400'
                      }>
                        {api.avgResponseTime}ms
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Rate Limits */}
          <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-4">
            <h2 className="text-lg font-bold text-white mb-4">Rate Limits</h2>
            <div className="space-y-4">
              {data.rateLimits.map(limit => {
                const usagePercent = (limit.used / limit.limit) * 100
                return (
                  <div key={limit.api} className="bg-gray-900/50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-white">{limit.api}</span>
                      <span className="text-sm text-gray-400">
                        Resets in {formatTimeUntil(limit.resetsAt)}
                      </span>
                    </div>
                    <div className="mb-2">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-400">
                          {formatNumber(limit.used)} / {formatNumber(limit.limit)}
                        </span>
                        <span className={
                          usagePercent > 90 ? 'text-red-400' :
                          usagePercent > 70 ? 'text-yellow-400' : 'text-green-400'
                        }>
                          {Math.round(usagePercent)}%
                        </span>
                      </div>
                      <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all ${
                            usagePercent > 90 ? 'bg-red-500' :
                            usagePercent > 70 ? 'bg-yellow-500' : 'bg-green-500'
                          }`}
                          style={{ width: `${Math.min(usagePercent, 100)}%` }}
                        />
                      </div>
                    </div>
                    <div className="text-sm">
                      <span className="text-gray-400">Remaining: </span>
                      <span className={limit.remaining < limit.limit * 0.1 ? 'text-red-400' : 'text-green-400'}>
                        {formatNumber(limit.remaining)}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Usage History Chart */}
        <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white">Usage History</h2>
            <div className="flex gap-2">
              {(['7d', '14d', '30d'] as const).map(tf => (
                <button
                  key={tf}
                  onClick={() => setSelectedTimeframe(tf)}
                  className={`px-3 py-1 rounded-lg text-sm ${
                    selectedTimeframe === tf
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>
          </div>
          
          {/* Simple bar chart */}
          <div className="h-48 flex items-end gap-1">
            {filteredHistory.map((day, idx) => {
              const height = (day.totalCalls / maxDailyCalls) * 100
              return (
                <div
                  key={day.date}
                  className="flex-1 flex flex-col items-center group"
                >
                  <div className="relative w-full">
                    <div
                      className="w-full bg-purple-600 rounded-t hover:bg-purple-500 transition-colors cursor-pointer"
                      style={{ height: `${Math.max(height, 2)}%`, minHeight: '4px' }}
                    />
                    {/* Tooltip */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                      <div className="bg-gray-900 border border-gray-700 rounded-lg p-2 text-xs whitespace-nowrap">
                        <div className="text-white font-semibold">{day.date}</div>
                        <div className="text-gray-400">Calls: {formatNumber(day.totalCalls)}</div>
                        <div className="text-red-400">Errors: {formatNumber(day.totalErrors)}</div>
                      </div>
                    </div>
                  </div>
                  {idx % Math.ceil(filteredHistory.length / 7) === 0 && (
                    <span className="text-[10px] text-gray-500 mt-1">
                      {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Recent Errors */}
        {data.recentErrors.length > 0 && (
          <div className="bg-gray-800/50 border border-red-500/30 rounded-xl p-4">
            <h2 className="text-lg font-bold text-red-400 mb-4">⚠️ Recent Errors</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-400 border-b border-gray-700">
                    <th className="pb-2 pr-4">API</th>
                    <th className="pb-2 pr-4">Endpoint</th>
                    <th className="pb-2 pr-4">Errors</th>
                    <th className="pb-2 pr-4">Error Rate</th>
                    <th className="pb-2">Last Occurred</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentErrors.map((error, idx) => (
                    <tr key={idx} className="border-b border-gray-700/50">
                      <td className="py-2 pr-4 text-white">{error.api}</td>
                      <td className="py-2 pr-4 text-gray-300 font-mono text-xs">{error.endpoint}</td>
                      <td className="py-2 pr-4 text-red-400">{error.errors}</td>
                      <td className="py-2 pr-4">
                        <span className={
                          error.errorRate > 10 ? 'text-red-400' :
                          error.errorRate > 5 ? 'text-yellow-400' : 'text-orange-400'
                        }>
                          {error.errorRate}%
                        </span>
                      </td>
                      <td className="py-2 text-gray-400">
                        {new Date(error.lastOccurred).toLocaleTimeString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Footer Note */}
        <div className="mt-6 text-center text-gray-500 text-sm">
          Data refreshes automatically every 30 seconds • Last updated: {new Date().toLocaleTimeString()}
        </div>
      </div>
    </div>
  )
}
