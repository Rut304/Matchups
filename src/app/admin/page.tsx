'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardHeader, CardTitle, CardContent, StatCard, Button } from '@/components/ui'
import { 
  Settings,
  Database,
  RefreshCw,
  Users,
  AlertTriangle,
  CheckCircle,
  Clock,
  Zap,
  Server,
  Activity,
  BarChart3,
  Shield,
  Key,
  Bell,
  Play,
  Terminal,
  ExternalLink,
  Heart,
  Megaphone,
  Power,
  Wifi,
  WifiOff,
  Search,
  Ban,
  UserX,
  Mail,
  Eye,
  EyeOff,
  TrendingUp,
  Target,
  DollarSign
} from 'lucide-react'

import Link from 'next/link'

type TabType = 'overview' | 'data' | 'diagnostics' | 'users' | 'ads' | 'edge' | 'infra' | 'settings'

interface Job {
  id: string
  name: string
  status: 'running' | 'completed' | 'failed' | 'scheduled'
  lastRun: string
  nextRun: string
  duration: string
  endpoint: string
}

interface HealthCheck {
  status: 'ok' | 'error' | 'warning'
  latency?: number
  message?: string
}

interface User {
  id: string
  email: string
  created_at: string
  last_sign_in_at: string | null
  email_confirmed: boolean
  banned: boolean
  role?: string
}

interface SiteSettings {
  ads_enabled: boolean
  ads_header_enabled: boolean
  ads_sidebar_enabled: boolean
  ads_inline_enabled: boolean
  ads_footer_enabled: boolean
  adsense_publisher_id: string | null
  adsense_slot_header: string | null
  adsense_slot_sidebar: string | null
  adsense_slot_inline: string | null
  adsense_slot_footer: string | null
  maintenance_mode: boolean
  auto_refresh_enabled: boolean
  auto_refresh_interval_minutes: number
  ai_analysis_enabled: boolean
  live_scores_enabled: boolean
  // Marketplace Settings
  marketplace_enabled: boolean
  marketplace_monetization_enabled: boolean
  marketplace_min_win_rate: number
  marketplace_min_picks: number
  marketplace_platform_fee_percent: number
  // Edge Features
  edge_features_enabled: boolean
  edge_rlm_enabled: boolean
  edge_rlm_min_confidence: number
  edge_steam_enabled: boolean
  edge_steam_min_confidence: number
  edge_clv_enabled: boolean
  edge_sharp_public_enabled: boolean
  edge_sharp_public_min_confidence: number
  edge_arbitrage_enabled: boolean
  edge_arbitrage_min_pct: number
  edge_props_enabled: boolean
  edge_notifications_enabled: boolean
  edge_alert_retention_hours: number
}

const DEFAULT_SETTINGS: SiteSettings = {
  ads_enabled: false,
  ads_header_enabled: true,
  ads_sidebar_enabled: true,
  ads_inline_enabled: true,
  ads_footer_enabled: true,
  adsense_publisher_id: null,
  adsense_slot_header: null,
  adsense_slot_sidebar: null,
  adsense_slot_inline: null,
  adsense_slot_footer: null,
  maintenance_mode: false,
  // Marketplace defaults
  marketplace_enabled: true,
  marketplace_monetization_enabled: false,
  marketplace_min_win_rate: 52,
  marketplace_min_picks: 5,
  marketplace_platform_fee_percent: 10,
  // Edge Features defaults
  edge_features_enabled: true,
  edge_rlm_enabled: true,
  edge_rlm_min_confidence: 60,
  edge_steam_enabled: true,
  edge_steam_min_confidence: 70,
  edge_clv_enabled: true,
  edge_sharp_public_enabled: true,
  edge_sharp_public_min_confidence: 65,
  edge_arbitrage_enabled: true,
  edge_arbitrage_min_pct: 0.5,
  edge_props_enabled: true,
  edge_notifications_enabled: true,
  edge_alert_retention_hours: 24,
  auto_refresh_enabled: true,
  auto_refresh_interval_minutes: 15,
  ai_analysis_enabled: true,
  live_scores_enabled: true
}

// Mock data for system stats
const systemStats = {
  apiCalls24h: 12453,
  dbSize: '2.4 GB',
  activeUsers: 847,
  aiRequests: 342,
  uptime: '99.97%',
  cacheHitRate: '94.2%',
}

const dataJobs: Job[] = [
  { id: '1', name: 'Refresh Odds', status: 'completed', lastRun: '5 min ago', nextRun: '10 min', duration: '12s', endpoint: '/api/cron/refresh-odds' },
  { id: '2', name: 'Refresh Scores', status: 'running', lastRun: 'now', nextRun: '15 min', duration: '...', endpoint: '/api/cron/refresh-scores' },
  { id: '3', name: 'Sync Games', status: 'scheduled', lastRun: '1 hour ago', nextRun: '5 min', duration: '8s', endpoint: '/api/cron/sync-games' },
  { id: '4', name: 'Refresh Standings', status: 'completed', lastRun: '30 min ago', nextRun: '30 min', duration: '15s', endpoint: '/api/cron/refresh-standings' },
  { id: '5', name: 'Refresh Injuries', status: 'completed', lastRun: '1 hour ago', nextRun: '6 hours', duration: '45s', endpoint: '/api/cron/refresh-injuries' },
]

const apiKeys = [
  { name: 'API-Sports', status: 'active', usage: '8,234 / 10,000', expires: 'Feb 15, 2025' },
  { name: 'The Odds API', status: 'active', usage: '456 / 500', expires: 'Jan 30, 2025' },
  { name: 'Polymarket', status: 'active', usage: 'Unlimited', expires: 'Never' },
  { name: 'Kalshi', status: 'active', usage: '1,200 / 5,000', expires: 'Mar 1, 2025' },
  { name: 'Gemini AI', status: 'active', usage: '2.1M tokens', expires: 'Never' },
]

const recentErrors = [
  { time: '2 hours ago', service: 'AI Analysis', error: 'Rate limit exceeded', severity: 'high' },
  { time: '5 hours ago', service: 'Kalshi API', error: 'Timeout (retry succeeded)', severity: 'medium' },
  { time: '1 day ago', service: 'Database', error: 'Connection pool exhausted', severity: 'high' },
]

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<TabType>('overview')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [healthChecks, setHealthChecks] = useState<Record<string, HealthCheck>>({})
  const [isLoadingHealth, setIsLoadingHealth] = useState(false)
  const [users, setUsers] = useState<User[]>([])
  const [userSearch, setUserSearch] = useState('')
  const [isLoadingUsers, setIsLoadingUsers] = useState(false)
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SETTINGS)
  const [isLoadingSettings, setIsLoadingSettings] = useState(false)
  const [isSavingSettings, setIsSavingSettings] = useState(false)
  const [runningJobs, setRunningJobs] = useState<Set<string>>(new Set())

  // Fetch health checks
  const fetchHealthChecks = useCallback(async () => {
    setIsLoadingHealth(true)
    try {
      const res = await fetch('/api/admin/system?action=health')
      const data = await res.json()
      setHealthChecks(data.checks || {})
    } catch (error) {
      console.error('Failed to fetch health:', error)
    } finally {
      setIsLoadingHealth(false)
    }
  }, [])

  // Fetch users
  const fetchUsers = useCallback(async (search?: string) => {
    setIsLoadingUsers(true)
    try {
      const url = search ? `/api/admin/users?search=${encodeURIComponent(search)}` : '/api/admin/users'
      const res = await fetch(url)
      const data = await res.json()
      setUsers(data.users || [])
    } catch (error) {
      console.error('Failed to fetch users:', error)
    } finally {
      setIsLoadingUsers(false)
    }
  }, [])

  // Fetch settings
  const fetchSettings = useCallback(async () => {
    setIsLoadingSettings(true)
    try {
      const res = await fetch('/api/admin/settings')
      const data = await res.json()
      setSettings(data.settings || DEFAULT_SETTINGS)
    } catch (error) {
      console.error('Failed to fetch settings:', error)
    } finally {
      setIsLoadingSettings(false)
    }
  }, [])

  // Save settings
  const saveSettings = async (updates: Partial<SiteSettings>) => {
    setIsSavingSettings(true)
    try {
      const newSettings = { ...settings, ...updates }
      await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings)
      })
      setSettings(newSettings)
    } catch (error) {
      console.error('Failed to save settings:', error)
    } finally {
      setIsSavingSettings(false)
    }
  }

  // Trigger a cron job
  const triggerJob = async (endpoint: string, jobId: string) => {
    setRunningJobs(prev => new Set(prev).add(jobId))
    try {
      await fetch(endpoint)
    } catch (error) {
      console.error('Failed to trigger job:', error)
    } finally {
      setTimeout(() => {
        setRunningJobs(prev => {
          const next = new Set(prev)
          next.delete(jobId)
          return next
        })
      }, 5000)
    }
  }

  // Trigger all data refresh
  const handleRefreshData = async () => {
    setIsRefreshing(true)
    try {
      await fetch('/api/admin/system', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'trigger_refresh' })
      })
    } catch (error) {
      console.error('Failed to refresh:', error)
    } finally {
      setTimeout(() => setIsRefreshing(false), 3000)
    }
  }

  // User actions
  const handleUserAction = async (userId: string, action: string) => {
    try {
      await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, userId })
      })
      fetchUsers(userSearch)
    } catch (error) {
      console.error('User action failed:', error)
    }
  }

  // Load data on tab change
  useEffect(() => {
    if (activeTab === 'diagnostics') fetchHealthChecks()
    if (activeTab === 'users') fetchUsers()
    if (activeTab === 'ads' || activeTab === 'settings' || activeTab === 'edge') fetchSettings()
  }, [activeTab, fetchHealthChecks, fetchUsers, fetchSettings])

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'data', label: 'Data Jobs', icon: Database },
    { id: 'diagnostics', label: 'Diagnostics', icon: Heart },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'ads', label: 'Ads', icon: Megaphone },
    { id: 'edge', label: 'Edge Features', icon: TrendingUp },
    { id: 'infra', label: 'Infrastructure', icon: Server },
    { id: 'settings', label: 'Settings', icon: Settings },
  ]

  return (
    <div className="min-h-screen">
      {/* Header */}
      <section className="border-b border-border bg-background-secondary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-accent/10 rounded-lg">
                <Shield className="w-6 h-6 text-accent" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-text-primary">Admin Panel</h1>
                <p className="text-sm text-text-secondary">System management and configuration</p>
              </div>
            </div>
            <Button
              onClick={handleRefreshData}
              variant="primary"
              className="flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh All Data
            </Button>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mt-6 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-accent text-background'
                    : 'text-text-secondary hover:text-text-primary hover:bg-background-tertiary'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <StatCard label="API Calls (24h)" value={systemStats.apiCalls24h.toLocaleString()} trend="up" />
              <StatCard label="Database Size" value={systemStats.dbSize} />
              <StatCard label="Active Users" value={systemStats.activeUsers} trend="up" />
              <StatCard label="AI Requests" value={systemStats.aiRequests} />
              <StatCard label="Uptime" value={systemStats.uptime} />
              <StatCard label="Cache Hit Rate" value={systemStats.cacheHitRate} />
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              {/* Recent Errors */}
              <Card variant="bordered">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-loss" />
                    Recent Errors
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {recentErrors.map((error, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-background-tertiary rounded-lg">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`w-2 h-2 rounded-full ${
                              error.severity === 'high' ? 'bg-loss' : 'bg-accent'
                            }`} />
                            <span className="font-medium text-text-primary">{error.service}</span>
                          </div>
                          <p className="text-sm text-text-secondary">{error.error}</p>
                        </div>
                        <span className="text-xs text-text-muted">{error.time}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* API Keys Status */}
              <Card variant="bordered">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Key className="w-5 h-5 text-accent" />
                    API Keys Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {apiKeys.map((key, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-background-tertiary rounded-lg">
                        <div className="flex items-center gap-3">
                          <CheckCircle className="w-4 h-4 text-win" />
                          <div>
                            <p className="font-medium text-text-primary">{key.name}</p>
                            <p className="text-xs text-text-muted">{key.usage}</p>
                          </div>
                        </div>
                        <span className="text-xs text-text-secondary">{key.expires}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card variant="bordered">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  <Link href="/admin/health" className="flex flex-col items-center gap-2 px-4 py-4 bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30 hover:border-green-500/50 rounded-xl transition-all hover:scale-105 text-text-primary">
                    <Heart className="w-6 h-6 text-green-500" />
                    <span className="text-sm font-medium">System Health</span>
                  </Link>
                  <Link href="/admin/manage" className="flex flex-col items-center gap-2 px-4 py-4 bg-gradient-to-br from-orange-500/20 to-red-500/20 border border-orange-500/30 hover:border-orange-500/50 rounded-xl transition-all hover:scale-105 text-text-primary">
                    <AlertTriangle className="w-6 h-6 text-orange-500" />
                    <span className="text-sm font-medium">Sus Videos</span>
                  </Link>
                  <Link href="/admin/picks" className="flex flex-col items-center gap-2 px-4 py-4 bg-gradient-to-br from-green-500/20 to-teal-500/20 border border-green-500/30 hover:border-green-500/50 rounded-xl transition-all hover:scale-105 text-text-primary">
                    <Users className="w-6 h-6 text-green-500" />
                    <span className="text-sm font-medium">Manage Picks</span>
                  </Link>
                  <Link href="/admin/diagnostics" className="flex flex-col items-center gap-2 px-4 py-4 bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/30 hover:border-blue-500/50 rounded-xl transition-all hover:scale-105 text-text-primary">
                    <Terminal className="w-6 h-6 text-blue-500" />
                    <span className="text-sm font-medium">E2E Tests</span>
                  </Link>
                  <Link href="/admin/docs" className="flex flex-col items-center gap-2 px-4 py-4 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 hover:border-cyan-500/50 rounded-xl transition-all hover:scale-105 text-text-primary">
                    <ExternalLink className="w-6 h-6 text-cyan-500" />
                    <span className="text-sm font-medium">Documentation</span>
                  </Link>
                  <Button variant="secondary" className="flex flex-col items-center gap-2 py-4 h-auto">
                    <Zap className="w-6 h-6 text-yellow-500" />
                    <span className="text-sm font-medium">Run AI Batch</span>
                  </Button>
                  <Button variant="secondary" className="flex flex-col items-center gap-2 py-4 h-auto">
                    <Database className="w-6 h-6 text-purple-500" />
                    <span className="text-sm font-medium">Backup DB</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'data' && (
          <div className="space-y-6">
            <Card variant="bordered">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Server className="w-5 h-5 text-highlight" />
                  Data Sync Jobs
                </CardTitle>
                <Button 
                  variant="primary" 
                  size="sm" 
                  className="flex items-center gap-2"
                  onClick={handleRefreshData}
                  disabled={isRefreshing}
                >
                  <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
                  Run All
                </Button>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-4 text-sm font-medium text-text-muted">Job</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-text-muted">Status</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-text-muted">Endpoint</th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-text-muted">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dataJobs.map((job) => (
                        <tr key={job.id} className="border-b border-border/50 hover:bg-background-tertiary">
                          <td className="py-3 px-4 font-medium text-text-primary">{job.name}</td>
                          <td className="py-3 px-4">
                            <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded ${
                              runningJobs.has(job.id) ? 'bg-highlight/10 text-highlight' :
                              job.status === 'completed' ? 'bg-win/10 text-win' :
                              job.status === 'failed' ? 'bg-loss/10 text-loss' :
                              'bg-accent/10 text-accent'
                            }`}>
                              {runningJobs.has(job.id) && <RefreshCw className="w-3 h-3 animate-spin" />}
                              {!runningJobs.has(job.id) && job.status === 'completed' && <CheckCircle className="w-3 h-3" />}
                              {!runningJobs.has(job.id) && job.status === 'failed' && <AlertTriangle className="w-3 h-3" />}
                              {!runningJobs.has(job.id) && job.status === 'scheduled' && <Clock className="w-3 h-3" />}
                              {runningJobs.has(job.id) ? 'running' : job.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-sm text-text-muted font-mono">{job.endpoint}</td>
                          <td className="py-3 px-4 text-right">
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => triggerJob(job.endpoint, job.id)}
                              disabled={runningJobs.has(job.id)}
                              title={`Run ${job.name}`}
                            >
                              <Play className="w-3 h-3" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Vercel Cron Configuration */}
            <Card variant="bordered">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-accent" />
                  Vercel Cron Jobs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-text-secondary mb-4">
                  Add these to your <code className="px-1.5 py-0.5 bg-background-tertiary rounded text-highlight">vercel.json</code> for automated updates.
                </p>
                <pre className="text-xs bg-background p-4 rounded-lg overflow-x-auto text-text-secondary">
{`{
  "crons": [
    { "path": "/api/cron/refresh-odds", "schedule": "*/15 * * * *" },
    { "path": "/api/cron/refresh-scores", "schedule": "*/5 * * * *" },
    { "path": "/api/cron/sync-games", "schedule": "0 */6 * * *" },
    { "path": "/api/cron/refresh-standings", "schedule": "0 8 * * *" },
    { "path": "/api/cron/refresh-injuries", "schedule": "0 */12 * * *" }
  ]
}`}
                </pre>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Diagnostics Tab */}
        {activeTab === 'diagnostics' && (
          <div className="space-y-6">
            {/* System Health */}
            <Card variant="bordered">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="w-5 h-5 text-loss" />
                  System Health
                </CardTitle>
                <Button 
                  variant="secondary" 
                  size="sm" 
                  onClick={fetchHealthChecks}
                  disabled={isLoadingHealth}
                >
                  <RefreshCw className={`w-3 h-3 ${isLoadingHealth ? 'animate-spin' : ''}`} />
                </Button>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4">
                  {Object.entries(healthChecks).map(([service, check]) => (
                    <div 
                      key={service} 
                      className={`p-4 rounded-lg border ${
                        check.status === 'ok' ? 'bg-win/5 border-win/20' :
                        check.status === 'warning' ? 'bg-accent/5 border-accent/20' :
                        'bg-loss/5 border-loss/20'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        {check.status === 'ok' ? (
                          <Wifi className="w-4 h-4 text-win" />
                        ) : check.status === 'warning' ? (
                          <AlertTriangle className="w-4 h-4 text-accent" />
                        ) : (
                          <WifiOff className="w-4 h-4 text-loss" />
                        )}
                        <span className="font-medium text-text-primary capitalize">{service.replace('_', ' ')}</span>
                      </div>
                      <div className="text-sm text-text-muted">
                        {check.latency && <span>Latency: {check.latency}ms</span>}
                        {check.message && <span>{check.message}</span>}
                      </div>
                    </div>
                  ))}
                  {Object.keys(healthChecks).length === 0 && (
                    <div className="col-span-3 text-center py-8 text-text-muted">
                      Click refresh to check system health
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card variant="bordered">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Power className="w-5 h-5 text-highlight" />
                  System Actions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4">
                  <Button 
                    variant="secondary" 
                    className="flex items-center justify-center gap-2 py-4 h-auto"
                    onClick={handleRefreshData}
                    disabled={isRefreshing}
                  >
                    <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
                    <span>Refresh All Data</span>
                  </Button>
                  <Button 
                    variant="secondary" 
                    className="flex items-center justify-center gap-2 py-4 h-auto"
                    onClick={async () => {
                      await fetch('/api/admin/system', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ action: 'clear_cache' })
                      })
                    }}
                  >
                    <Database className="w-5 h-5" />
                    <span>Clear Cache</span>
                  </Button>
                  <Link href="/admin/diagnostics" className="block">
                    <Button variant="secondary" className="w-full flex items-center justify-center gap-2 py-4 h-auto">
                      <Terminal className="w-5 h-5" />
                      <span>Run E2E Tests</span>
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* API Status */}
            <Card variant="bordered">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="w-5 h-5 text-accent" />
                  API Keys Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {apiKeys.map((key, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-background-tertiary rounded-lg">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="w-4 h-4 text-win" />
                        <div>
                          <p className="font-medium text-text-primary">{key.name}</p>
                          <p className="text-xs text-text-muted">{key.usage}</p>
                        </div>
                      </div>
                      <span className="text-xs text-text-secondary">{key.expires}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            <Card variant="bordered">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-highlight" />
                  User Management
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Search */}
                <div className="flex gap-4 mb-6">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                    <input
                      type="text"
                      placeholder="Search users by email or name..."
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-background-tertiary border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                  </div>
                  <Button 
                    variant="primary" 
                    onClick={() => fetchUsers(userSearch)}
                    disabled={isLoadingUsers}
                  >
                    {isLoadingUsers ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Search'}
                  </Button>
                </div>

                {/* Users Table */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-4 text-sm font-medium text-text-muted">Email</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-text-muted">Created</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-text-muted">Last Login</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-text-muted">Status</th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-text-muted">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user) => (
                        <tr key={user.id} className="border-b border-border/50 hover:bg-background-tertiary">
                          <td className="py-3 px-4 font-medium text-text-primary">{user.email}</td>
                          <td className="py-3 px-4 text-sm text-text-secondary">
                            {new Date(user.created_at).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-4 text-sm text-text-secondary">
                            {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString() : 'Never'}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded ${
                              user.banned ? 'bg-loss/10 text-loss' :
                              user.email_confirmed ? 'bg-win/10 text-win' :
                              'bg-accent/10 text-accent'
                            }`}>
                              {user.banned ? 'Banned' : user.email_confirmed ? 'Active' : 'Pending'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleUserAction(user.id, user.banned ? 'unban' : 'ban')}
                                title={user.banned ? 'Unban user' : 'Ban user'}
                              >
                                <Ban className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleUserAction(user.id, 'send_password_reset')}
                                title="Send password reset"
                              >
                                <Mail className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleUserAction(user.id, 'delete')}
                                title="Delete user"
                                className="text-loss hover:text-loss"
                              >
                                <UserX className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {users.length === 0 && (
                        <tr>
                          <td colSpan={5} className="py-12 text-center text-text-muted">
                            {isLoadingUsers ? 'Loading users...' : 'No users found. Click search to load users.'}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Ads Tab */}
        {activeTab === 'ads' && (
          <div className="space-y-6">
            {/* AdSense Configuration */}
            <Card variant="bordered">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="w-5 h-5 text-accent" />
                  Google AdSense Configuration
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingSettings ? (
                  <div className="flex items-center justify-center py-12">
                    <RefreshCw className="w-6 h-6 animate-spin text-text-muted" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Publisher ID */}
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-2">
                        Publisher ID
                      </label>
                      <div className="flex gap-3">
                        <input
                          type="text"
                          placeholder="ca-pub-XXXXXXXXXXXXXXXX"
                          value={settings.adsense_publisher_id || ''}
                          onChange={(e) => setSettings({ ...settings, adsense_publisher_id: e.target.value || null })}
                          className="flex-1 px-4 py-2 bg-background-tertiary border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent font-mono text-sm"
                        />
                        <Button
                          variant="primary"
                          onClick={() => saveSettings({ adsense_publisher_id: settings.adsense_publisher_id })}
                          disabled={isSavingSettings}
                        >
                          {isSavingSettings ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Save'}
                        </Button>
                      </div>
                      <p className="text-xs text-text-muted mt-2">
                        Get your Publisher ID from <a href="https://adsense.google.com" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">Google AdSense</a>
                      </p>
                    </div>

                    {/* Connection Status */}
                    <div className={`p-3 rounded-lg border ${
                      settings.adsense_publisher_id?.startsWith('ca-pub-') 
                        ? 'bg-win/10 border-win/30' 
                        : 'bg-zinc-800/50 border-border'
                    }`}>
                      <div className="flex items-center gap-2">
                        {settings.adsense_publisher_id?.startsWith('ca-pub-') ? (
                          <>
                            <CheckCircle className="w-4 h-4 text-win" />
                            <span className="text-sm font-medium text-win">AdSense Connected</span>
                          </>
                        ) : (
                          <>
                            <AlertTriangle className="w-4 h-4 text-text-muted" />
                            <span className="text-sm text-text-muted">No Publisher ID configured</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Slot IDs (optional) */}
                    {settings.adsense_publisher_id?.startsWith('ca-pub-') && (
                      <div className="pt-4 border-t border-border">
                        <h4 className="text-sm font-medium text-text-primary mb-3">Ad Slot IDs (Optional)</h4>
                        <p className="text-xs text-text-muted mb-4">
                          Create ad units in AdSense and paste their slot IDs here for better tracking. Leave empty for auto ads.
                        </p>
                        <div className="grid md:grid-cols-2 gap-4">
                          {[
                            { key: 'adsense_slot_header', label: 'Header Slot' },
                            { key: 'adsense_slot_sidebar', label: 'Sidebar Slot' },
                            { key: 'adsense_slot_inline', label: 'Inline Slot' },
                            { key: 'adsense_slot_footer', label: 'Footer Slot' },
                          ].map((slot) => (
                            <div key={slot.key}>
                              <label className="block text-xs text-text-muted mb-1">{slot.label}</label>
                              <input
                                type="text"
                                placeholder="1234567890"
                                value={(settings[slot.key as keyof SiteSettings] as string) || ''}
                                onChange={(e) => setSettings({ ...settings, [slot.key]: e.target.value || null })}
                                onBlur={() => saveSettings({ [slot.key]: settings[slot.key as keyof SiteSettings] })}
                                className="w-full px-3 py-1.5 bg-background-tertiary border border-border rounded text-text-primary focus:outline-none focus:ring-2 focus:ring-accent font-mono text-sm"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Enable/Disable Controls */}
            <Card variant="bordered">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Megaphone className="w-5 h-5 text-highlight" />
                  Ad Display Settings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Master Toggle */}
                  <div className={`flex items-center justify-between p-4 rounded-lg border ${
                    !settings.adsense_publisher_id?.startsWith('ca-pub-') 
                      ? 'bg-zinc-800/30 border-border opacity-60' 
                      : 'bg-background-tertiary border-border'
                  }`}>
                    <div className="flex items-center gap-3">
                      {settings.ads_enabled ? (
                        <Eye className="w-5 h-5 text-win" />
                      ) : (
                        <EyeOff className="w-5 h-5 text-text-muted" />
                      )}
                      <div>
                        <p className="font-semibold text-text-primary">Enable Ads Site-Wide</p>
                        <p className="text-sm text-text-muted">
                          {settings.adsense_publisher_id?.startsWith('ca-pub-') 
                            ? 'Toggle to show/hide ads across the site'
                            : 'Configure AdSense Publisher ID first'}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => saveSettings({ ads_enabled: !settings.ads_enabled })}
                      disabled={isSavingSettings || !settings.adsense_publisher_id?.startsWith('ca-pub-')}
                      title={settings.ads_enabled ? 'Disable ads' : 'Enable ads'}
                      className={`relative w-14 h-7 rounded-full transition-colors ${
                        settings.ads_enabled && settings.adsense_publisher_id?.startsWith('ca-pub-') ? 'bg-win' : 'bg-border'
                      } ${!settings.adsense_publisher_id?.startsWith('ca-pub-') ? 'cursor-not-allowed' : ''}`}
                    >
                      <span
                        className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-transform ${
                          settings.ads_enabled ? 'left-8' : 'left-1'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Position Toggles */}
                  <div className="grid md:grid-cols-2 gap-4">
                    {[
                      { key: 'ads_header_enabled', label: 'Header Ads', desc: 'Leaderboard banner at top of pages' },
                      { key: 'ads_sidebar_enabled', label: 'Sidebar Ads', desc: 'Rectangle ads in page sidebars' },
                      { key: 'ads_inline_enabled', label: 'Inline Ads', desc: 'Ads between content sections' },
                      { key: 'ads_footer_enabled', label: 'Footer Ads', desc: 'Leaderboard banner at bottom' },
                    ].map((item) => (
                      <div key={item.key} className="flex items-center justify-between p-3 bg-background-tertiary rounded-lg">
                        <div>
                          <p className="font-medium text-text-primary">{item.label}</p>
                          <p className="text-xs text-text-muted">{item.desc}</p>
                        </div>
                        <button
                          onClick={() => saveSettings({ [item.key]: !settings[item.key as keyof SiteSettings] })}
                          disabled={isSavingSettings || !settings.ads_enabled}
                          title={`Toggle ${item.label}`}
                          className={`relative w-12 h-6 rounded-full transition-colors ${
                            settings[item.key as keyof SiteSettings] && settings.ads_enabled ? 'bg-accent' : 'bg-border'
                          } ${!settings.ads_enabled ? 'opacity-50' : ''}`}
                        >
                          <span
                            className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                              settings[item.key as keyof SiteSettings] ? 'left-7' : 'left-1'
                            }`}
                          />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Edge Features Tab */}
        {activeTab === 'edge' && (
          <div className="space-y-6">
            {/* Master Toggle */}
            <Card variant="bordered">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-accent" />
                  Edge Features Control
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="p-4 rounded-lg mb-4" style={{ background: settings.edge_features_enabled ? 'rgba(0,255,136,0.1)' : 'rgba(255,68,85,0.1)' }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-lg" style={{ color: settings.edge_features_enabled ? '#00FF88' : '#FF4455' }}>
                        {settings.edge_features_enabled ? '🟢 Edge Features Active' : '🔴 Edge Features Disabled'}
                      </p>
                      <p className="text-xs text-text-muted">Master toggle for all edge detection features</p>
                    </div>
                    <button
                      onClick={() => saveSettings({ edge_features_enabled: !settings.edge_features_enabled })}
                      disabled={isSavingSettings}
                      className={`relative w-14 h-7 rounded-full transition-colors ${
                        settings.edge_features_enabled ? 'bg-green-500' : 'bg-red-500'
                      }`}
                    >
                      <span className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform ${
                        settings.edge_features_enabled ? 'right-1' : 'left-1'
                      }`} />
                    </button>
                  </div>
                </div>
                
                {/* Individual Edge Features */}
                <div className="grid md:grid-cols-2 gap-4">
                  {/* RLM */}
                  <div className="p-4 rounded-lg bg-background-tertiary">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">🔄</span>
                        <div>
                          <p className="font-bold text-text-primary">Reverse Line Movement</p>
                          <p className="text-[10px] text-text-muted">Detect lines moving against public betting</p>
                        </div>
                      </div>
                      <button
                        onClick={() => saveSettings({ edge_rlm_enabled: !settings.edge_rlm_enabled })}
                        disabled={isSavingSettings || !settings.edge_features_enabled}
                        className={`relative w-12 h-6 rounded-full transition-colors ${
                          settings.edge_rlm_enabled && settings.edge_features_enabled ? 'bg-accent' : 'bg-border'
                        }`}
                      >
                        <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                          settings.edge_rlm_enabled ? 'right-0.5' : 'left-0.5'
                        }`} />
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-text-muted">Min Confidence:</span>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={settings.edge_rlm_min_confidence}
                        onChange={(e) => saveSettings({ edge_rlm_min_confidence: parseInt(e.target.value) || 60 })}
                        disabled={!settings.edge_features_enabled}
                        className="w-16 px-2 py-1 text-xs rounded bg-background border border-border text-text-primary"
                      />
                      <span className="text-xs text-text-muted">%</span>
                    </div>
                  </div>
                  
                  {/* Steam Moves */}
                  <div className="p-4 rounded-lg bg-background-tertiary">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">💨</span>
                        <div>
                          <p className="font-bold text-text-primary">Steam Moves</p>
                          <p className="text-[10px] text-text-muted">Sharp action causing rapid line moves</p>
                        </div>
                      </div>
                      <button
                        onClick={() => saveSettings({ edge_steam_enabled: !settings.edge_steam_enabled })}
                        disabled={isSavingSettings || !settings.edge_features_enabled}
                        className={`relative w-12 h-6 rounded-full transition-colors ${
                          settings.edge_steam_enabled && settings.edge_features_enabled ? 'bg-accent' : 'bg-border'
                        }`}
                      >
                        <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                          settings.edge_steam_enabled ? 'right-0.5' : 'left-0.5'
                        }`} />
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-text-muted">Min Confidence:</span>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={settings.edge_steam_min_confidence}
                        onChange={(e) => saveSettings({ edge_steam_min_confidence: parseInt(e.target.value) || 70 })}
                        disabled={!settings.edge_features_enabled}
                        className="w-16 px-2 py-1 text-xs rounded bg-background border border-border text-text-primary"
                      />
                      <span className="text-xs text-text-muted">%</span>
                    </div>
                  </div>
                  
                  {/* CLV Tracking */}
                  <div className="p-4 rounded-lg bg-background-tertiary">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">📈</span>
                        <div>
                          <p className="font-bold text-text-primary">CLV Tracking</p>
                          <p className="text-[10px] text-text-muted">Closing Line Value measurement</p>
                        </div>
                      </div>
                      <button
                        onClick={() => saveSettings({ edge_clv_enabled: !settings.edge_clv_enabled })}
                        disabled={isSavingSettings || !settings.edge_features_enabled}
                        className={`relative w-12 h-6 rounded-full transition-colors ${
                          settings.edge_clv_enabled && settings.edge_features_enabled ? 'bg-accent' : 'bg-border'
                        }`}
                      >
                        <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                          settings.edge_clv_enabled ? 'right-0.5' : 'left-0.5'
                        }`} />
                      </button>
                    </div>
                  </div>
                  
                  {/* Sharp vs Public */}
                  <div className="p-4 rounded-lg bg-background-tertiary">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">🎯</span>
                        <div>
                          <p className="font-bold text-text-primary">Sharp vs Public</p>
                          <p className="text-[10px] text-text-muted">Compare sharp money to public bets</p>
                        </div>
                      </div>
                      <button
                        onClick={() => saveSettings({ edge_sharp_public_enabled: !settings.edge_sharp_public_enabled })}
                        disabled={isSavingSettings || !settings.edge_features_enabled}
                        className={`relative w-12 h-6 rounded-full transition-colors ${
                          settings.edge_sharp_public_enabled && settings.edge_features_enabled ? 'bg-accent' : 'bg-border'
                        }`}
                      >
                        <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                          settings.edge_sharp_public_enabled ? 'right-0.5' : 'left-0.5'
                        }`} />
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-text-muted">Min Confidence:</span>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={settings.edge_sharp_public_min_confidence}
                        onChange={(e) => saveSettings({ edge_sharp_public_min_confidence: parseInt(e.target.value) || 65 })}
                        disabled={!settings.edge_features_enabled}
                        className="w-16 px-2 py-1 text-xs rounded bg-background border border-border text-text-primary"
                      />
                      <span className="text-xs text-text-muted">%</span>
                    </div>
                  </div>
                  
                  {/* Arbitrage */}
                  <div className="p-4 rounded-lg bg-background-tertiary">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">💰</span>
                        <div>
                          <p className="font-bold text-text-primary">Arbitrage Alerts</p>
                          <p className="text-[10px] text-text-muted">Cross-book guaranteed profit opps</p>
                        </div>
                      </div>
                      <button
                        onClick={() => saveSettings({ edge_arbitrage_enabled: !settings.edge_arbitrage_enabled })}
                        disabled={isSavingSettings || !settings.edge_features_enabled}
                        className={`relative w-12 h-6 rounded-full transition-colors ${
                          settings.edge_arbitrage_enabled && settings.edge_features_enabled ? 'bg-accent' : 'bg-border'
                        }`}
                      >
                        <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                          settings.edge_arbitrage_enabled ? 'right-0.5' : 'left-0.5'
                        }`} />
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-text-muted">Min Arb %:</span>
                      <input
                        type="number"
                        min="0"
                        max="10"
                        step="0.1"
                        value={settings.edge_arbitrage_min_pct}
                        onChange={(e) => saveSettings({ edge_arbitrage_min_pct: parseFloat(e.target.value) || 0.5 })}
                        disabled={!settings.edge_features_enabled}
                        className="w-16 px-2 py-1 text-xs rounded bg-background border border-border text-text-primary"
                      />
                      <span className="text-xs text-text-muted">%</span>
                    </div>
                  </div>
                  
                  {/* Props Comparison */}
                  <div className="p-4 rounded-lg bg-background-tertiary">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">📊</span>
                        <div>
                          <p className="font-bold text-text-primary">Props Comparison</p>
                          <p className="text-[10px] text-text-muted">Best odds across books for props</p>
                        </div>
                      </div>
                      <button
                        onClick={() => saveSettings({ edge_props_enabled: !settings.edge_props_enabled })}
                        disabled={isSavingSettings || !settings.edge_features_enabled}
                        className={`relative w-12 h-6 rounded-full transition-colors ${
                          settings.edge_props_enabled && settings.edge_features_enabled ? 'bg-accent' : 'bg-border'
                        }`}
                      >
                        <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                          settings.edge_props_enabled ? 'right-0.5' : 'left-0.5'
                        }`} />
                      </button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Notification Settings */}
            <Card variant="bordered">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5 text-accent" />
                  Alert Notifications
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-background-tertiary rounded-lg">
                    <div>
                      <p className="font-medium text-text-primary">Push Notifications</p>
                      <p className="text-xs text-text-muted">Send alerts for critical edge opportunities</p>
                    </div>
                    <button
                      onClick={() => saveSettings({ edge_notifications_enabled: !settings.edge_notifications_enabled })}
                      disabled={isSavingSettings || !settings.edge_features_enabled}
                      className={`relative w-12 h-6 rounded-full transition-colors ${
                        settings.edge_notifications_enabled && settings.edge_features_enabled ? 'bg-accent' : 'bg-border'
                      }`}
                    >
                      <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                        settings.edge_notifications_enabled ? 'right-0.5' : 'left-0.5'
                      }`} />
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-background-tertiary rounded-lg">
                    <div>
                      <p className="font-medium text-text-primary">Alert Retention</p>
                      <p className="text-xs text-text-muted">How long to keep edge alerts before cleanup</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="1"
                        max="168"
                        value={settings.edge_alert_retention_hours}
                        onChange={(e) => saveSettings({ edge_alert_retention_hours: parseInt(e.target.value) || 24 })}
                        disabled={!settings.edge_features_enabled}
                        className="w-16 px-2 py-1 text-sm rounded bg-background border border-border text-text-primary"
                      />
                      <span className="text-sm text-text-muted">hours</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Global Confidence Thresholds */}
            <Card variant="bordered">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-accent" />
                  AI Edge Score Thresholds
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-text-muted mb-4">
                  Configure when picks are displayed based on their AI confidence score (0-100).
                  Higher thresholds = fewer but stronger picks.
                </p>
                <div className="space-y-4">
                  {/* Minimum Edge Threshold */}
                  <div className="p-4 rounded-lg bg-background-tertiary">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-bold text-text-primary">Minimum Edge Threshold</p>
                        <p className="text-xs text-text-muted">Below this = not displayed as an edge</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={settings.edge_rlm_min_confidence || 60}
                          onChange={(e) => saveSettings({ edge_rlm_min_confidence: parseInt(e.target.value) || 60 })}
                          disabled={!settings.edge_features_enabled}
                          className="w-20 px-3 py-2 text-sm rounded bg-background border border-border text-text-primary"
                        />
                        <span className="text-sm font-bold" style={{ color: '#808090' }}>%</span>
                      </div>
                    </div>
                    <div className="w-full h-2 rounded-full bg-background overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all"
                        style={{ 
                          width: `${settings.edge_rlm_min_confidence || 60}%`,
                          background: 'linear-gradient(90deg, #FF4455, #FFD700)'
                        }}
                      />
                    </div>
                  </div>

                  {/* Strong Edge Threshold */}
                  <div className="p-4 rounded-lg bg-background-tertiary">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-bold text-text-primary">Strong Edge Threshold</p>
                        <p className="text-xs text-text-muted">Highlighted as &ldquo;Strong Edge&rdquo;</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={settings.edge_steam_min_confidence || 75}
                          onChange={(e) => saveSettings({ edge_steam_min_confidence: parseInt(e.target.value) || 75 })}
                          disabled={!settings.edge_features_enabled}
                          className="w-20 px-3 py-2 text-sm rounded bg-background border border-border text-text-primary"
                        />
                        <span className="text-sm font-bold" style={{ color: '#00FF88' }}>%</span>
                      </div>
                    </div>
                    <div className="w-full h-2 rounded-full bg-background overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all"
                        style={{ 
                          width: `${settings.edge_steam_min_confidence || 75}%`,
                          background: 'linear-gradient(90deg, #FFD700, #00FF88)'
                        }}
                      />
                    </div>
                  </div>

                  {/* Elite Edge Threshold */}
                  <div className="p-4 rounded-lg bg-background-tertiary">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-bold text-text-primary">Elite Edge Threshold</p>
                        <p className="text-xs text-text-muted">Top-tier picks, highlighted prominently</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={settings.edge_sharp_public_min_confidence || 90}
                          onChange={(e) => saveSettings({ edge_sharp_public_min_confidence: parseInt(e.target.value) || 90 })}
                          disabled={!settings.edge_features_enabled}
                          className="w-20 px-3 py-2 text-sm rounded bg-background border border-border text-text-primary"
                        />
                        <span className="text-sm font-bold" style={{ color: '#FF6B00' }}>%</span>
                      </div>
                    </div>
                    <div className="w-full h-2 rounded-full bg-background overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all"
                        style={{ 
                          width: `${settings.edge_sharp_public_min_confidence || 90}%`,
                          background: 'linear-gradient(90deg, #00FF88, #FF6B00)'
                        }}
                      />
                    </div>
                  </div>

                  {/* Legend */}
                  <div className="flex flex-wrap gap-4 pt-2 border-t border-border">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full" style={{ background: '#808090' }} />
                      <span className="text-xs text-text-muted">Below threshold (hidden)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full" style={{ background: '#FFD700' }} />
                      <span className="text-xs text-text-muted">Moderate edge</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full" style={{ background: '#00FF88' }} />
                      <span className="text-xs text-text-muted">Strong edge</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full" style={{ background: '#FF6B00' }} />
                      <span className="text-xs text-text-muted">Elite edge</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-background-secondary rounded-xl border border-border p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-500" />
                  <span className="text-xs text-text-muted uppercase">Active Alerts</span>
                </div>
                <div className="text-2xl font-bold text-text-primary">12</div>
              </div>
              <div className="bg-background-secondary rounded-xl border border-border p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-accent" />
                  <span className="text-xs text-text-muted uppercase">RLM Today</span>
                </div>
                <div className="text-2xl font-bold text-text-primary">4</div>
              </div>
              <div className="bg-background-secondary rounded-xl border border-border p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-4 h-4 text-red-500" />
                  <span className="text-xs text-text-muted uppercase">Steam Moves</span>
                </div>
                <div className="text-2xl font-bold text-text-primary">2</div>
              </div>
              <div className="bg-background-secondary rounded-xl border border-border p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="w-4 h-4 text-green-500" />
                  <span className="text-xs text-text-muted uppercase">Avg Confidence</span>
                </div>
                <div className="text-2xl font-bold text-text-primary">73%</div>
              </div>
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            {/* Site Settings */}
            <Card variant="bordered">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5 text-accent" />
                  Site Settings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { key: 'auto_refresh_enabled', label: 'Auto-refresh Data', desc: 'Automatically fetch new odds and scores' },
                    { key: 'ai_analysis_enabled', label: 'AI Analysis', desc: 'Enable Gemini AI for matchup analysis' },
                    { key: 'live_scores_enabled', label: 'Live Scores', desc: 'Show real-time score updates' },
                    { key: 'maintenance_mode', label: 'Maintenance Mode', desc: 'Show maintenance page to visitors' },
                  ].map((setting) => (
                    <div key={setting.key} className="flex items-center justify-between p-3 bg-background-tertiary rounded-lg">
                      <div>
                        <p className="font-medium text-text-primary">{setting.label}</p>
                        <p className="text-xs text-text-muted">{setting.desc}</p>
                      </div>
                      <button
                        onClick={() => saveSettings({ [setting.key]: !settings[setting.key as keyof SiteSettings] })}
                        disabled={isSavingSettings}
                        title={`Toggle ${setting.label}`}
                        className={`relative w-12 h-6 rounded-full transition-colors ${
                          settings[setting.key as keyof SiteSettings] ? 'bg-accent' : 'bg-border'
                        }`}
                      >
                        <span
                          className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                            settings[setting.key as keyof SiteSettings] ? 'left-7' : 'left-1'
                          }`}
                        />
                      </button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Marketplace Settings */}
            <Card variant="bordered">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-purple-500" />
                  Marketplace Settings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Marketplace Toggles */}
                  {[
                    { key: 'marketplace_enabled', label: 'Marketplace Enabled', desc: 'Allow users to browse and share systems' },
                    { key: 'marketplace_monetization_enabled', label: 'Monetization', desc: 'Allow paid system listings (Stripe integration required)' },
                  ].map((setting) => (
                    <div key={setting.key} className="flex items-center justify-between p-3 bg-background-tertiary rounded-lg">
                      <div>
                        <p className="font-medium text-text-primary">{setting.label}</p>
                        <p className="text-xs text-text-muted">{setting.desc}</p>
                      </div>
                      <button
                        onClick={() => saveSettings({ [setting.key]: !settings[setting.key as keyof SiteSettings] })}
                        disabled={isSavingSettings}
                        title={`Toggle ${setting.label}`}
                        className={`relative w-12 h-6 rounded-full transition-colors ${
                          settings[setting.key as keyof SiteSettings] ? 'bg-accent' : 'bg-border'
                        }`}
                      >
                        <span
                          className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                            settings[setting.key as keyof SiteSettings] ? 'left-7' : 'left-1'
                          }`}
                        />
                      </button>
                    </div>
                  ))}
                  
                  {/* Quality Gate Settings */}
                  <div className="border-t border-border pt-4 mt-4">
                    <h4 className="font-medium text-text-primary mb-3">Quality Gates</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-3 bg-background-tertiary rounded-lg">
                        <label className="block text-sm text-text-muted mb-2">Min Picks Required</label>
                        <input
                          type="number"
                          value={settings.marketplace_min_picks || 5}
                          onChange={(e) => setSettings({ ...settings, marketplace_min_picks: parseInt(e.target.value) || 5 })}
                          onBlur={() => saveSettings({ marketplace_min_picks: settings.marketplace_min_picks })}
                          className="w-full px-3 py-2 bg-background-secondary border border-border rounded-lg text-text-primary"
                          min={1}
                          max={100}
                        />
                        <p className="text-xs text-text-muted mt-1">Minimum picks before a system can be published</p>
                      </div>
                      <div className="p-3 bg-background-tertiary rounded-lg">
                        <label className="block text-sm text-text-muted mb-2">Min Win Rate %</label>
                        <input
                          type="number"
                          value={settings.marketplace_min_win_rate || 52}
                          onChange={(e) => setSettings({ ...settings, marketplace_min_win_rate: parseFloat(e.target.value) || 52 })}
                          onBlur={() => saveSettings({ marketplace_min_win_rate: settings.marketplace_min_win_rate })}
                          className="w-full px-3 py-2 bg-background-secondary border border-border rounded-lg text-text-primary"
                          min={50}
                          max={100}
                          step={0.1}
                        />
                        <p className="text-xs text-text-muted mt-1">Minimum win rate to publish to marketplace</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Monetization Settings (only show if enabled) */}
                  {settings.marketplace_monetization_enabled && (
                    <div className="border-t border-border pt-4 mt-4">
                      <h4 className="font-medium text-text-primary mb-3">Monetization Settings</h4>
                      <div className="p-3 bg-background-tertiary rounded-lg">
                        <label className="block text-sm text-text-muted mb-2">Platform Fee %</label>
                        <input
                          type="number"
                          value={settings.marketplace_platform_fee_percent || 10}
                          onChange={(e) => setSettings({ ...settings, marketplace_platform_fee_percent: parseFloat(e.target.value) || 10 })}
                          onBlur={() => saveSettings({ marketplace_platform_fee_percent: settings.marketplace_platform_fee_percent })}
                          className="w-full px-3 py-2 bg-background-secondary border border-border rounded-lg text-text-primary"
                          min={0}
                          max={50}
                          step={0.5}
                        />
                        <p className="text-xs text-text-muted mt-1">Percentage of each sale retained as platform fee</p>
                      </div>
                      <div className="mt-3 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                        <p className="text-sm text-yellow-400">
                          ⚠️ Stripe Connect integration required for payouts. Configure in your Stripe dashboard.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Notifications */}
            <Card variant="bordered">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5 text-highlight" />
                  Notifications
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-text-muted text-center py-8">
                  Email and Slack notifications coming soon.
                </p>
              </CardContent>
            </Card>

            {/* Danger Zone */}
            <Card variant="bordered">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-loss">
                  <AlertTriangle className="w-5 h-5" />
                  Danger Zone
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border border-loss/20 rounded-lg">
                    <div>
                      <p className="font-medium text-text-primary">Clear All Cache</p>
                      <p className="text-sm text-text-muted">Remove all cached data. May slow down site temporarily.</p>
                    </div>
                    <Button 
                      variant="danger"
                      onClick={async () => {
                        await fetch('/api/admin/system', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ action: 'clear_cache' })
                        })
                      }}
                    >
                      Clear Cache
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Infrastructure Tab */}
        {activeTab === 'infra' && (
          <div className="space-y-6">
            {/* System Health Overview */}
            <Card variant="bordered">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="w-5 h-5 text-accent" />
                  System Health
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-background-tertiary rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="w-5 h-5 text-gain" />
                      <span className="text-sm text-text-muted">API Status</span>
                    </div>
                    <p className="text-xl font-bold text-gain">Healthy</p>
                    <p className="text-xs text-text-muted mt-1">All endpoints responding</p>
                  </div>
                  <div className="bg-background-tertiary rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Database className="w-5 h-5 text-highlight" />
                      <span className="text-sm text-text-muted">Database</span>
                    </div>
                    <p className="text-xl font-bold text-highlight">Connected</p>
                    <p className="text-xs text-text-muted mt-1">Supabase operational</p>
                  </div>
                  <div className="bg-background-tertiary rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="w-5 h-5 text-accent" />
                      <span className="text-sm text-text-muted">Cache</span>
                    </div>
                    <p className="text-xl font-bold text-accent">Active</p>
                    <p className="text-xs text-text-muted mt-1">Redis caching enabled</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <a 
                    href="/admin/health" 
                    className="flex items-center gap-2 px-4 py-2 bg-accent text-background-primary rounded-lg hover:bg-accent/90 transition-colors"
                  >
                    <Activity className="w-4 h-4" />
                    Open Health Dashboard
                  </a>
                  <Button
                    variant="secondary"
                    onClick={() => fetchHealthChecks()}
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh Status
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Data Sync Configuration */}
            <Card variant="bordered">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <RefreshCw className="w-5 h-5 text-highlight" />
                  Data Sync Configuration
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="bg-background-tertiary rounded-lg p-4">
                    <h4 className="font-medium text-text-primary mb-3">Sync Schedule</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <p className="text-sm text-text-muted">Game Hours (Live)</p>
                        <div className="flex items-center gap-2">
                          <Zap className="w-4 h-4 text-accent" />
                          <span className="text-text-primary font-medium">Every 5 minutes</span>
                        </div>
                        <p className="text-xs text-text-muted">Weekdays: 5 PM - 1 AM ET</p>
                        <p className="text-xs text-text-muted">Weekends: 12 PM - 1 AM ET</p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm text-text-muted">Off-Peak Hours</p>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-text-muted" />
                          <span className="text-text-primary font-medium">Every 15 minutes</span>
                        </div>
                        <p className="text-xs text-text-muted">Reduced frequency when no games</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <Button
                      variant="primary"
                      onClick={async () => {
                        setIsLoadingSettings(true)
                        await fetch('/api/admin/sync', { method: 'POST' })
                        setIsLoadingSettings(false)
                      }}
                      disabled={isLoadingSettings}
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Trigger Manual Sync
                    </Button>
                    <a 
                      href="https://github.com/rut304s/Matchups/actions/workflows/data-sync.yml" 
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 bg-background-tertiary text-text-primary rounded-lg hover:bg-border transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                      View GitHub Action
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Live Play-by-Play Settings */}
            <Card variant="bordered">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-gain" />
                  Live Play-by-Play System
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="bg-background-tertiary rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="font-medium text-text-primary">Real-Time Updates</h4>
                        <p className="text-sm text-text-muted">3-second polling for live games</p>
                      </div>
                      <div className="flex items-center gap-2 px-3 py-1 bg-gain/20 text-gain rounded-full">
                        <Wifi className="w-4 h-4" />
                        <span className="text-sm font-medium">Active</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-text-primary">3s</p>
                        <p className="text-xs text-text-muted">Poll Interval</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-text-primary">ESPN</p>
                        <p className="text-xs text-text-muted">Data Source</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-text-primary">6</p>
                        <p className="text-xs text-text-muted">Sports Supported</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-accent">Live</p>
                        <p className="text-xs text-text-muted">Betting Edge Calc</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-background-tertiary rounded-lg p-4">
                    <h4 className="font-medium text-text-primary mb-2">Supported Sports</h4>
                    <div className="flex flex-wrap gap-2">
                      {['NFL', 'NBA', 'NHL', 'MLB', 'NCAAF', 'NCAAB'].map((sport) => (
                        <span key={sport} className="px-3 py-1 bg-accent/20 text-accent rounded-full text-sm font-medium">
                          {sport}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* GitHub Actions Status */}
            <Card variant="bordered">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Terminal className="w-5 h-5 text-text-muted" />
                  GitHub Actions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { name: 'Health Monitoring', status: 'active', schedule: 'Every 15 min', url: 'health-monitoring.yml' },
                    { name: 'Data Sync', status: 'active', schedule: '5 min (game hours)', url: 'data-sync.yml' },
                    { name: 'CVE Scan', status: 'active', schedule: 'Daily', url: 'cve-scan.yml' },
                    { name: 'Playwright E2E', status: 'active', schedule: 'On push', url: 'playwright.yml' },
                  ].map((action) => (
                    <div key={action.name} className="flex items-center justify-between p-3 bg-background-tertiary rounded-lg">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="w-4 h-4 text-gain" />
                        <div>
                          <p className="font-medium text-text-primary">{action.name}</p>
                          <p className="text-xs text-text-muted">{action.schedule}</p>
                        </div>
                      </div>
                      <a
                        href={`https://github.com/rut304s/Matchups/actions/workflows/${action.url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-sm text-accent hover:underline"
                      >
                        View <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Secrets Configuration */}
            <Card variant="bordered">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="w-5 h-5 text-highlight" />
                  Secrets & Environment
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { name: 'NEXT_PUBLIC_SUPABASE_URL', status: 'configured', type: 'secret' },
                    { name: 'NEXT_PUBLIC_SUPABASE_ANON_KEY', status: 'configured', type: 'secret' },
                    { name: 'SUPABASE_SERVICE_ROLE_KEY', status: 'configured', type: 'secret' },
                    { name: 'VERCEL_ORG_ID', status: 'configured', type: 'secret' },
                    { name: 'VERCEL_PROJECT_ID', status: 'configured', type: 'secret' },
                    { name: 'SITE_URL', status: 'configured', type: 'variable' },
                  ].map((secret) => (
                    <div key={secret.name} className="flex items-center justify-between p-3 bg-background-tertiary rounded-lg">
                      <div className="flex items-center gap-3">
                        <Shield className="w-4 h-4 text-gain" />
                        <div>
                          <p className="font-medium text-text-primary font-mono text-sm">{secret.name}</p>
                          <p className="text-xs text-text-muted capitalize">{secret.type}</p>
                        </div>
                      </div>
                      <span className="px-2 py-1 bg-gain/20 text-gain text-xs rounded-full">
                        {secret.status}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t border-border">
                  <a
                    href="https://github.com/rut304s/Matchups/settings/secrets/actions"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-accent hover:underline"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Manage GitHub Secrets
                  </a>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </section>
    </div>
  )
}
