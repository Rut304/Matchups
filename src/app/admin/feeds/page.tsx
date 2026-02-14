'use client'

import { useState, useEffect, useCallback } from 'react'
import { 
  RefreshCw, 
  Play, 
  Pause,
  CheckCircle, 
  AlertTriangle, 
  XCircle,
  Clock,
  Wifi,
  WifiOff,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Filter,
  Zap,
  Database,
  Activity,
  ArrowLeft,
  HelpCircle,
  Radio,
} from 'lucide-react'
import Link from 'next/link'

interface Feed {
  id: string
  name: string
  source: string
  endpoint: string
  schedule: string
  scheduleHuman: string
  category: string
  requiresKey: boolean
  envVarOptional?: string
  description: string
  lastRun: string | null
  lastStatus: string
  lastDuration: string | null
  lastError: string | null
  runCount: number
  errorCount: number
  rateLimited: boolean
  health: 'healthy' | 'warning' | 'error' | 'unknown'
  envConfigured: boolean
}

interface FeedSummary {
  totalFeeds: number
  healthy: number
  warning: number
  error: number
  unknown: number
  envVars: Record<string, boolean>
}

const CATEGORY_LABELS: Record<string, { label: string; color: string; icon: typeof Activity }> = {
  scores: { label: 'Live Scores', color: 'text-green-400', icon: Activity },
  odds: { label: 'Betting Odds', color: 'text-blue-400', icon: Zap },
  schedule: { label: 'Schedules', color: 'text-purple-400', icon: Clock },
  stats: { label: 'Stats', color: 'text-cyan-400', icon: Database },
  injuries: { label: 'Injuries', color: 'text-red-400', icon: AlertTriangle },
  analytics: { label: 'Analytics', color: 'text-orange-400', icon: Activity },
  experts: { label: 'Expert Picks', color: 'text-yellow-400', icon: Radio },
  props: { label: 'Player Props', color: 'text-pink-400', icon: Zap },
  historical: { label: 'Historical', color: 'text-gray-400', icon: Database },
}

function HealthBadge({ health }: { health: string }) {
  switch (health) {
    case 'healthy':
      return (
        <span className="flex items-center gap-1 text-xs font-medium text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full">
          <CheckCircle className="w-3 h-3" /> Healthy
        </span>
      )
    case 'warning':
      return (
        <span className="flex items-center gap-1 text-xs font-medium text-yellow-400 bg-yellow-400/10 px-2 py-0.5 rounded-full">
          <AlertTriangle className="w-3 h-3" /> Warning
        </span>
      )
    case 'error':
      return (
        <span className="flex items-center gap-1 text-xs font-medium text-red-400 bg-red-400/10 px-2 py-0.5 rounded-full">
          <XCircle className="w-3 h-3" /> Error
        </span>
      )
    default:
      return (
        <span className="flex items-center gap-1 text-xs font-medium text-gray-400 bg-gray-400/10 px-2 py-0.5 rounded-full">
          <HelpCircle className="w-3 h-3" /> No Data
        </span>
      )
  }
}

function TimeAgo({ date }: { date: string | null }) {
  if (!date) return <span className="text-text-secondary text-sm">Never</span>
  
  const now = new Date()
  const then = new Date(date)
  const diffMs = now.getTime() - then.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)
  
  let text = ''
  if (diffMins < 1) text = 'Just now'
  else if (diffMins < 60) text = `${diffMins}m ago`
  else if (diffHours < 24) text = `${diffHours}h ago`
  else text = `${diffDays}d ago`
  
  return (
    <span className={`text-sm ${diffHours > 24 ? 'text-yellow-400' : 'text-text-secondary'}`}>
      {text}
    </span>
  )
}

export default function AdminFeedsPage() {
  const [feeds, setFeeds] = useState<Feed[]>([])
  const [summary, setSummary] = useState<FeedSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [triggeringFeed, setTriggeringFeed] = useState<string | null>(null)
  const [expandedFeed, setExpandedFeed] = useState<string | null>(null)
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [filterHealth, setFilterHealth] = useState<string>('all')
  const [triggerResults, setTriggerResults] = useState<Record<string, { success: boolean; duration: string; error?: string }>>({})

  const fetchFeeds = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/feeds')
      if (res.ok) {
        const data = await res.json()
        setFeeds(data.feeds)
        setSummary(data.summary)
      }
    } catch (err) {
      console.error('Failed to fetch feeds:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchFeeds()
    const interval = setInterval(fetchFeeds, 30000) // Auto-refresh every 30s
    return () => clearInterval(interval)
  }, [fetchFeeds])

  const triggerFeed = async (feedId: string) => {
    setTriggeringFeed(feedId)
    try {
      const res = await fetch('/api/admin/feeds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'trigger', feedId }),
      })
      const result = await res.json()
      setTriggerResults(prev => ({ ...prev, [feedId]: result }))
      // Refresh feed list
      await fetchFeeds()
    } catch (err) {
      setTriggerResults(prev => ({ ...prev, [feedId]: { success: false, duration: '0ms', error: 'Request failed' } }))
    } finally {
      setTriggeringFeed(null)
    }
  }

  // Filter feeds
  const filteredFeeds = feeds.filter(f => {
    if (filterCategory !== 'all' && f.category !== filterCategory) return false
    if (filterHealth !== 'all' && f.health !== filterHealth) return false
    return true
  })

  // Group by category
  const categories = [...new Set(feeds.map(f => f.category))]

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <RefreshCw className="w-8 h-8 text-accent animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <section className="border-b border-border bg-background-secondary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/admin" className="p-2 hover:bg-background-tertiary rounded-lg transition">
                <ArrowLeft className="w-5 h-5 text-text-secondary" />
              </Link>
              <div className="p-2 bg-accent/10 rounded-lg">
                <Radio className="w-6 h-6 text-accent" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-text-primary">Data Feed Monitor</h1>
                <p className="text-sm text-text-secondary">
                  {summary?.totalFeeds} feeds &bull; {summary?.healthy} healthy &bull; Auto-refreshes every 30s
                </p>
              </div>
            </div>
            <button
              onClick={() => { setLoading(true); fetchFeeds() }}
              className="flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accent/90 text-background font-semibold rounded-lg transition"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-background-secondary border border-border rounded-xl p-4">
            <div className="text-text-secondary text-xs mb-1">Total Feeds</div>
            <div className="text-2xl font-bold text-text-primary">{summary?.totalFeeds}</div>
          </div>
          <div className="bg-background-secondary border border-green-500/20 rounded-xl p-4">
            <div className="text-green-400 text-xs mb-1">Healthy</div>
            <div className="text-2xl font-bold text-green-400">{summary?.healthy}</div>
          </div>
          <div className="bg-background-secondary border border-yellow-500/20 rounded-xl p-4">
            <div className="text-yellow-400 text-xs mb-1">Warning</div>
            <div className="text-2xl font-bold text-yellow-400">{summary?.warning}</div>
          </div>
          <div className="bg-background-secondary border border-red-500/20 rounded-xl p-4">
            <div className="text-red-400 text-xs mb-1">Errors</div>
            <div className="text-2xl font-bold text-red-400">{summary?.error}</div>
          </div>
          <div className="bg-background-secondary border border-gray-500/20 rounded-xl p-4">
            <div className="text-gray-400 text-xs mb-1">No Data Yet</div>
            <div className="text-2xl font-bold text-gray-400">{summary?.unknown}</div>
          </div>
        </div>

        {/* Environment Variables Status */}
        <div className="bg-background-secondary border border-border rounded-xl p-4">
          <h3 className="text-sm font-semibold text-text-primary mb-3">API Keys & Environment</h3>
          <div className="flex flex-wrap gap-3">
            {summary?.envVars && Object.entries(summary.envVars).map(([key, configured]) => (
              <div
                key={key}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium ${
                  configured 
                    ? 'bg-green-400/10 text-green-400 border border-green-400/20' 
                    : 'bg-red-400/10 text-red-400 border border-red-400/20'
                }`}
              >
                {configured ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                {key.replace(/_/g, ' ')}
              </div>
            ))}
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-text-secondary" />
            <span className="text-sm text-text-secondary">Filter:</span>
          </div>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="bg-background-tertiary border border-border rounded-lg px-3 py-1.5 text-sm text-text-primary"
          >
            <option value="all">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{CATEGORY_LABELS[cat]?.label || cat}</option>
            ))}
          </select>
          <select
            value={filterHealth}
            onChange={(e) => setFilterHealth(e.target.value)}
            className="bg-background-tertiary border border-border rounded-lg px-3 py-1.5 text-sm text-text-primary"
          >
            <option value="all">All Status</option>
            <option value="healthy">Healthy</option>
            <option value="warning">Warning</option>
            <option value="error">Error</option>
            <option value="unknown">No Data</option>
          </select>
        </div>

        {/* Feed List */}
        <div className="space-y-2">
          {filteredFeeds.map((feed) => {
            const catInfo = CATEGORY_LABELS[feed.category]
            const isExpanded = expandedFeed === feed.id
            const isTriggering = triggeringFeed === feed.id
            const result = triggerResults[feed.id]
            
            return (
              <div 
                key={feed.id} 
                className={`bg-background-secondary border rounded-xl transition-all ${
                  feed.health === 'error' ? 'border-red-500/30' : 
                  feed.health === 'warning' ? 'border-yellow-500/20' : 
                  feed.health === 'healthy' ? 'border-green-500/10' : 
                  'border-border'
                }`}
              >
                {/* Main Row */}
                <div 
                  className="flex items-center gap-4 p-4 cursor-pointer hover:bg-background-tertiary/50 transition rounded-xl"
                  onClick={() => setExpandedFeed(isExpanded ? null : feed.id)}
                >
                  {/* Expand Arrow */}
                  <div className="text-text-secondary">
                    {isExpanded 
                      ? <ChevronDown className="w-4 h-4" /> 
                      : <ChevronRight className="w-4 h-4" />
                    }
                  </div>

                  {/* Health indicator */}
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    feed.health === 'healthy' ? 'bg-green-400 animate-pulse' : 
                    feed.health === 'warning' ? 'bg-yellow-400' : 
                    feed.health === 'error' ? 'bg-red-400' : 
                    'bg-gray-500'
                  }`} />

                  {/* Feed Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-text-primary text-sm truncate">{feed.name}</span>
                      <span className={`text-xs ${catInfo?.color || 'text-gray-400'}`}>
                        {catInfo?.label || feed.category}
                      </span>
                    </div>
                    <div className="text-xs text-text-secondary mt-0.5 truncate">
                      {feed.source} &bull; {feed.scheduleHuman}
                    </div>
                  </div>

                  {/* Last Run */}
                  <div className="text-right flex-shrink-0 hidden sm:block">
                    <TimeAgo date={feed.lastRun} />
                    {feed.lastDuration && (
                      <div className="text-xs text-text-secondary">{feed.lastDuration}</div>
                    )}
                  </div>

                  {/* Status Badges */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {feed.rateLimited && (
                      <span className="text-xs text-orange-400 bg-orange-400/10 px-2 py-0.5 rounded-full">Rate Limited</span>
                    )}
                    {!feed.envConfigured && (
                      <span className="text-xs text-gray-400 bg-gray-400/10 px-2 py-0.5 rounded-full">No API Key</span>
                    )}
                    <HealthBadge health={feed.health} />
                  </div>

                  {/* Trigger Button */}
                  <button
                    onClick={(e) => { e.stopPropagation(); triggerFeed(feed.id) }}
                    disabled={isTriggering}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition flex-shrink-0 ${
                      isTriggering 
                        ? 'bg-accent/20 text-accent cursor-wait'
                        : 'bg-accent/10 text-accent hover:bg-accent/20'
                    }`}
                  >
                    {isTriggering 
                      ? <RefreshCw className="w-3 h-3 animate-spin" /> 
                      : <Play className="w-3 h-3" />
                    }
                    {isTriggering ? 'Running...' : 'Run Now'}
                  </button>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-border/50 pt-3 space-y-3">
                    <p className="text-sm text-text-secondary">{feed.description}</p>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="bg-background-tertiary rounded-lg p-3">
                        <div className="text-xs text-text-secondary mb-1">Endpoint</div>
                        <code className="text-xs text-accent break-all">{feed.endpoint}</code>
                      </div>
                      <div className="bg-background-tertiary rounded-lg p-3">
                        <div className="text-xs text-text-secondary mb-1">Cron Schedule</div>
                        <code className="text-xs text-text-primary">{feed.schedule}</code>
                      </div>
                      <div className="bg-background-tertiary rounded-lg p-3">
                        <div className="text-xs text-text-secondary mb-1">Total Runs</div>
                        <div className="text-sm font-medium text-text-primary">{feed.runCount}</div>
                      </div>
                      <div className="bg-background-tertiary rounded-lg p-3">
                        <div className="text-xs text-text-secondary mb-1">Error Count</div>
                        <div className={`text-sm font-medium ${feed.errorCount > 0 ? 'text-red-400' : 'text-green-400'}`}>
                          {feed.errorCount}
                        </div>
                      </div>
                    </div>

                    {feed.lastError && (
                      <div className="bg-red-400/5 border border-red-400/20 rounded-lg p-3">
                        <div className="text-xs font-medium text-red-400 mb-1">Last Error</div>
                        <pre className="text-xs text-red-300 whitespace-pre-wrap break-all">{feed.lastError}</pre>
                      </div>
                    )}

                    {result && (
                      <div className={`${result.success ? 'bg-green-400/5 border-green-400/20' : 'bg-red-400/5 border-red-400/20'} border rounded-lg p-3`}>
                        <div className={`text-xs font-medium mb-1 ${result.success ? 'text-green-400' : 'text-red-400'}`}>
                          Manual Trigger Result
                        </div>
                        <div className="text-xs text-text-secondary">
                          {result.success ? 'Completed successfully' : `Failed: ${result.error}`} in {result.duration}
                        </div>
                      </div>
                    )}

                    {feed.envVarOptional && !feed.envConfigured && (
                      <div className="bg-yellow-400/5 border border-yellow-400/20 rounded-lg p-3">
                        <div className="text-xs font-medium text-yellow-400 mb-1">Configuration Needed</div>
                        <div className="text-xs text-text-secondary">
                          Set <code className="text-yellow-400">{feed.envVarOptional}</code> in Vercel environment variables to enable this feed.
                          This feed will still run but with reduced functionality.
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Data Sources Documentation */}
        <div className="bg-background-secondary border border-border rounded-xl p-6 space-y-4">
          <h3 className="text-lg font-bold text-text-primary">Data Sources</h3>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-green-400">Free (Active)</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 bg-background-tertiary rounded-lg">
                  <span className="text-sm text-text-primary">ESPN API</span>
                  <span className="text-xs text-green-400">Unlimited</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-background-tertiary rounded-lg">
                  <span className="text-sm text-text-primary">Action Network</span>
                  <span className="text-xs text-green-400">Unlimited</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-background-tertiary rounded-lg">
                  <span className="text-sm text-text-primary">Covers.com</span>
                  <span className="text-xs text-green-400">2-3x/day</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-background-tertiary rounded-lg">
                  <span className="text-sm text-text-primary">Gemini AI</span>
                  <span className="text-xs text-green-400">Free tier</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-yellow-400">Needs API Key</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 bg-background-tertiary rounded-lg">
                  <span className="text-sm text-text-primary">OpenWeather</span>
                  <span className="text-xs text-yellow-400">Free: 1000/day</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-background-tertiary rounded-lg">
                  <span className="text-sm text-text-primary">X/Twitter API</span>
                  <span className="text-xs text-yellow-400">Free: 50 req/15min</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-background-tertiary rounded-lg">
                  <div>
                    <span className="text-sm text-text-primary">The Odds API</span>
                    <div className="text-xs text-text-secondary mt-0.5">Historical odds + live</div>
                  </div>
                  <a 
                    href="https://the-odds-api.com/#pricing" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-accent hover:underline"
                  >
                    From $30/mo <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
