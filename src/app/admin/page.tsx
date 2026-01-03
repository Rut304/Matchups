'use client'

import { useState } from 'react'
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
  Trash2,
  Play,
  Pause
} from 'lucide-react'

type TabType = 'overview' | 'data' | 'ai' | 'users' | 'settings'

interface Job {
  id: string
  name: string
  status: 'running' | 'completed' | 'failed' | 'scheduled'
  lastRun: string
  nextRun: string
  duration: string
}

// Mock data
const systemStats = {
  apiCalls24h: 12453,
  dbSize: '2.4 GB',
  activeUsers: 847,
  aiRequests: 342,
  uptime: '99.97%',
  cacheHitRate: '94.2%',
}

const dataJobs: Job[] = [
  { id: '1', name: 'Fetch NFL Odds', status: 'completed', lastRun: '5 min ago', nextRun: '10 min', duration: '12s' },
  { id: '2', name: 'Fetch NBA Games', status: 'running', lastRun: 'now', nextRun: '15 min', duration: '...' },
  { id: '3', name: 'Update Polymarket', status: 'scheduled', lastRun: '1 hour ago', nextRun: '5 min', duration: '8s' },
  { id: '4', name: 'Fetch Kalshi Markets', status: 'completed', lastRun: '30 min ago', nextRun: '30 min', duration: '15s' },
  { id: '5', name: 'Calculate Trends', status: 'completed', lastRun: '1 hour ago', nextRun: '6 hours', duration: '45s' },
  { id: '6', name: 'AI Analysis Batch', status: 'failed', lastRun: '2 hours ago', nextRun: 'Manual', duration: 'N/A' },
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

  const handleRefreshData = () => {
    setIsRefreshing(true)
    setTimeout(() => setIsRefreshing(false), 2000)
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'data', label: 'Data Jobs', icon: Database },
    { id: 'ai', label: 'AI Config', icon: Zap },
    { id: 'users', label: 'Users', icon: Users },
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
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Button variant="secondary" className="flex items-center gap-2 justify-center">
                    <RefreshCw className="w-4 h-4" />
                    Sync Odds
                  </Button>
                  <Button variant="secondary" className="flex items-center gap-2 justify-center">
                    <Zap className="w-4 h-4" />
                    Run AI Batch
                  </Button>
                  <Button variant="secondary" className="flex items-center gap-2 justify-center">
                    <Database className="w-4 h-4" />
                    Backup DB
                  </Button>
                  <Button variant="secondary" className="flex items-center gap-2 justify-center">
                    <Trash2 className="w-4 h-4" />
                    Clear Cache
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
                <Button variant="primary" size="sm" className="flex items-center gap-2">
                  <Play className="w-3 h-3" />
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
                        <th className="text-left py-3 px-4 text-sm font-medium text-text-muted">Last Run</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-text-muted">Next Run</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-text-muted">Duration</th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-text-muted">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dataJobs.map((job) => (
                        <tr key={job.id} className="border-b border-border/50 hover:bg-background-tertiary">
                          <td className="py-3 px-4 font-medium text-text-primary">{job.name}</td>
                          <td className="py-3 px-4">
                            <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded ${
                              job.status === 'completed' ? 'bg-win/10 text-win' :
                              job.status === 'running' ? 'bg-highlight/10 text-highlight' :
                              job.status === 'failed' ? 'bg-loss/10 text-loss' :
                              'bg-accent/10 text-accent'
                            }`}>
                              {job.status === 'running' && <RefreshCw className="w-3 h-3 animate-spin" />}
                              {job.status === 'completed' && <CheckCircle className="w-3 h-3" />}
                              {job.status === 'failed' && <AlertTriangle className="w-3 h-3" />}
                              {job.status === 'scheduled' && <Clock className="w-3 h-3" />}
                              {job.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-sm text-text-secondary">{job.lastRun}</td>
                          <td className="py-3 px-4 text-sm text-text-secondary">{job.nextRun}</td>
                          <td className="py-3 px-4 text-sm text-text-muted font-mono">{job.duration}</td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button className="p-1.5 hover:bg-background-elevated rounded text-text-muted hover:text-accent transition-colors">
                                <Play className="w-4 h-4" />
                              </button>
                              <button className="p-1.5 hover:bg-background-elevated rounded text-text-muted hover:text-accent transition-colors">
                                <Pause className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* GitHub Actions Triggers */}
            <Card variant="bordered">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-accent" />
                  GitHub Actions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-text-secondary mb-4">
                  Configure automated data fetching via GitHub Actions cron jobs.
                </p>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 bg-background-tertiary rounded-lg">
                    <h4 className="font-medium text-text-primary mb-2">Odds Sync</h4>
                    <p className="text-sm text-text-muted mb-3">Every 15 minutes during game days</p>
                    <code className="text-xs bg-background p-2 rounded block text-highlight">
                      cron: &apos;*/15 * * * *&apos;
                    </code>
                  </div>
                  <div className="p-4 bg-background-tertiary rounded-lg">
                    <h4 className="font-medium text-text-primary mb-2">Market Data</h4>
                    <p className="text-sm text-text-muted mb-3">Every 30 minutes</p>
                    <code className="text-xs bg-background p-2 rounded block text-highlight">
                      cron: &apos;*/30 * * * *&apos;
                    </code>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'ai' && (
          <div className="space-y-6">
            <Card variant="bordered">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-accent" />
                  Gemini AI Configuration
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">Model</label>
                    <select className="w-full px-4 py-2 bg-background-tertiary border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent">
                      <option>gemini-2.0-flash-exp</option>
                      <option>gemini-1.5-pro</option>
                      <option>gemini-1.5-flash</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">Temperature</label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      defaultValue="30"
                      className="w-full"
                    />
                    <p className="text-xs text-text-muted mt-1">0.3 (More focused)</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">Max Tokens</label>
                    <input
                      type="number"
                      defaultValue={4096}
                      className="w-full px-4 py-2 bg-background-tertiary border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">Batch Size</label>
                    <input
                      type="number"
                      defaultValue={10}
                      className="w-full px-4 py-2 bg-background-tertiary border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-border">
                  <h4 className="font-medium text-text-primary mb-4">Analysis Prompts</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-2">Matchup Analysis</label>
                      <textarea
                        rows={4}
                        defaultValue="Analyze this sports matchup and provide betting insights..."
                        className="w-full px-4 py-2 bg-background-tertiary border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent resize-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-2">Market Analysis</label>
                      <textarea
                        rows={4}
                        defaultValue="Analyze this prediction market and identify any edges..."
                        className="w-full px-4 py-2 bg-background-tertiary border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent resize-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                  <Button variant="primary">Save Configuration</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

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
                <p className="text-text-secondary text-center py-12">
                  User authentication and management coming soon via Supabase Auth.
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-6">
            <Card variant="bordered">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5 text-accent" />
                  Notifications
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { label: 'Email alerts for system errors', enabled: true },
                    { label: 'Daily summary reports', enabled: false },
                    { label: 'Real-time Slack notifications', enabled: true },
                    { label: 'API rate limit warnings', enabled: true },
                  ].map((setting, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-background-tertiary rounded-lg">
                      <span className="text-text-primary">{setting.label}</span>
                      <button
                        className={`relative w-12 h-6 rounded-full transition-colors ${
                          setting.enabled ? 'bg-accent' : 'bg-border'
                        }`}
                      >
                        <span
                          className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                            setting.enabled ? 'left-7' : 'left-1'
                          }`}
                        />
                      </button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

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
                    <Button variant="danger">Clear Cache</Button>
                  </div>
                  <div className="flex items-center justify-between p-4 border border-loss/20 rounded-lg">
                    <div>
                      <p className="font-medium text-text-primary">Reset AI Models</p>
                      <p className="text-sm text-text-muted">Clear all AI analysis history and retrain.</p>
                    </div>
                    <Button variant="danger">Reset</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </section>
    </div>
  )
}
