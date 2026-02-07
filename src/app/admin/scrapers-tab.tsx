'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardHeader, CardTitle, CardContent, StatCard, Button } from '@/components/ui'
import {
  Twitter,
  RefreshCw,
  Play,
  Pause,
  Calendar,
  CheckCircle,
  ExternalLink,
  Trash2,
  Settings,
  Target
} from 'lucide-react'

interface ScraperJob {
  id: string
  name: string
  source: 'espn' | 'covers' | 'twitter' | 'all'
  status: 'running' | 'completed' | 'failed' | 'scheduled' | 'disabled'
  lastRun: string | null
  nextRun: string | null
  lastResult?: {
    tweets?: number
    picks?: number
    errors?: string[]
  }
  schedule?: string // Cron expression
  enabled: boolean
}

interface TrackedExpert {
  id: string
  name: string
  source: string
  sport: string
  twitter_handle: string | null
  season_wins: number
  season_losses: number
  season_win_pct: number
  last_updated: string
}

interface ScraperStats {
  totalExperts: number
  expertsWithTwitter: number
  totalTweets: number
  totalPicks: number
  lastScrapeTime: string | null
}

const DEFAULT_SCHEDULES: ScraperJob[] = [
  {
    id: 'morning',
    name: 'Morning Scrape (X + Covers)',
    source: 'all',
    status: 'scheduled',
    lastRun: null,
    nextRun: '8:00 AM ET',
    schedule: '0 8 * * *',
    enabled: true,
  },
  {
    id: 'pregame-nfl',
    name: 'Pre-game NFL Sunday',
    source: 'all',
    status: 'scheduled',
    lastRun: null,
    nextRun: '11:00 AM ET (Sunday)',
    schedule: '0 11 * * 0',
    enabled: true,
  },
  {
    id: 'pregame-weekday',
    name: 'Pre-game Weekday',
    source: 'all',
    status: 'scheduled',
    lastRun: null,
    nextRun: '6:30 PM ET (Mon-Fri)',
    schedule: '30 18 * * 1-5',
    enabled: true,
  },
  {
    id: 'postgame',
    name: 'Post-game Scrape',
    source: 'twitter',
    status: 'scheduled',
    lastRun: null,
    nextRun: '11:30 PM ET',
    schedule: '30 23 * * *',
    enabled: true,
  },
]

export function ScrapersTabContent() {
  const [jobs, setJobs] = useState<ScraperJob[]>(DEFAULT_SCHEDULES)
  const [experts, setExperts] = useState<TrackedExpert[]>([])
  const [stats, setStats] = useState<ScraperStats | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [runningJob, setRunningJob] = useState<string | null>(null)
  const [showAddExpert, setShowAddExpert] = useState(false)
  const [newExpertHandle, setNewExpertHandle] = useState('')
  const [scrapeLog, setScrapeLog] = useState<string[]>([])
  
  // Fetch experts and stats
  const fetchData = useCallback(async () => {
    setIsLoading(true)
    try {
      // Fetch experts
      const expertsRes = await fetch('/api/expert-picks/experts')
      if (expertsRes.ok) {
        const data = await expertsRes.json()
        setExperts(data.experts || [])
        setStats(data.stats || null)
      }
      
      // Fetch job status
      const jobsRes = await fetch('/api/admin/scraper-jobs')
      if (jobsRes.ok) {
        const data = await jobsRes.json()
        if (data.jobs) {
          setJobs(data.jobs)
        }
      }
    } catch (error) {
      console.error('Failed to fetch scraper data:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Run a scrape job manually
  const runJob = async (jobId: string, source?: string) => {
    setRunningJob(jobId)
    setScrapeLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] Starting ${jobId} scrape...`])
    
    try {
      let action = 'scrape-all'
      if (source === 'twitter') action = 'scrape-x'
      else if (source === 'espn') action = 'scrape-espn-all'
      else if (source === 'covers') action = 'scrape-covers-all'
      
      const res = await fetch('/api/expert-picks/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      
      const data = await res.json()
      
      if (data.success || !data.error) {
        setScrapeLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] ✓ ${jobId} completed successfully`])
        
        // Log details
        if (data.twitter) {
          setScrapeLog(prev => [...prev, `  Twitter: ${data.twitter.processed || 0} experts, ${data.twitter.picks || 0} picks`])
        }
        if (data.espn) {
          const espnTotal = Object.values(data.espn).reduce((sum: number, s: any) => sum + (s.picks || 0), 0)
          setScrapeLog(prev => [...prev, `  ESPN: ${espnTotal} picks`])
        }
        if (data.covers) {
          const coversTotal = Object.values(data.covers).reduce((sum: number, s: any) => sum + (s.consensus || 0), 0)
          setScrapeLog(prev => [...prev, `  Covers: ${coversTotal} consensus data`])
        }
        
        // Update job status
        setJobs(prev => prev.map(j => 
          j.id === jobId 
            ? { ...j, status: 'completed', lastRun: new Date().toISOString(), lastResult: data }
            : j
        ))
      } else {
        setScrapeLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] ✗ ${jobId} failed: ${data.error}`])
        if (data.twitter?.error) {
          setScrapeLog(prev => [...prev, `  Twitter error: ${data.twitter.error}`])
        }
      }
    } catch (error) {
      setScrapeLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] ✗ Error: ${error instanceof Error ? error.message : 'Unknown'}`])
    } finally {
      setRunningJob(null)
      fetchData()
    }
  }

  // Toggle job enabled/disabled
  const toggleJob = async (jobId: string) => {
    setJobs(prev => prev.map(j => 
      j.id === jobId ? { ...j, enabled: !j.enabled } : j
    ))
    
    // Save to backend
    try {
      await fetch('/api/admin/scraper-jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'toggle',
          jobId,
          enabled: !jobs.find(j => j.id === jobId)?.enabled
        }),
      })
    } catch (error) {
      console.error('Failed to toggle job:', error)
    }
  }

  // Add a new expert by Twitter handle
  const addExpert = async () => {
    if (!newExpertHandle.trim()) return
    
    setScrapeLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] Adding @${newExpertHandle}...`])
    
    try {
      const res = await fetch('/api/expert-picks/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'scrape-x-user',
          handle: newExpertHandle.replace('@', '')
        }),
      })
      
      const data = await res.json()
      
      if (data.twitter?.tweets !== undefined) {
        setScrapeLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] ✓ Added @${newExpertHandle}: ${data.twitter.tweets} tweets, ${data.twitter.picks} picks`])
        setNewExpertHandle('')
        setShowAddExpert(false)
        fetchData()
      } else {
        setScrapeLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] ✗ Failed to add @${newExpertHandle}: ${data.error || 'Unknown error'}`])
      }
    } catch (error) {
      setScrapeLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] ✗ Error: ${error instanceof Error ? error.message : 'Unknown'}`])
    }
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard 
          label="Tracked Experts" 
          value={stats?.totalExperts || experts.length || 0} 
        />
        <StatCard 
          label="With Twitter" 
          value={stats?.expertsWithTwitter || experts.filter(e => e.twitter_handle).length || 0}
        />
        <StatCard 
          label="Tweets Collected" 
          value={stats?.totalTweets || 0}
        />
        <StatCard 
          label="Picks Found" 
          value={stats?.totalPicks || 0}
        />
      </div>

      {/* Scheduled Jobs */}
      <Card variant="bordered">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-accent" />
              Scrape Schedule
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={() => runJob('manual', 'all')}
              disabled={!!runningJob}
            >
              {runningJob ? (
                <RefreshCw className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Play className="w-4 h-4 mr-2" />
              )}
              Run All Now
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {jobs.map(job => (
              <div 
                key={job.id}
                className={`flex items-center justify-between p-4 rounded-lg border ${
                  job.enabled ? 'border-border bg-background-secondary' : 'border-border/50 bg-background-secondary/50 opacity-60'
                }`}
              >
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => toggleJob(job.id)}
                    className={`p-2 rounded-lg transition-colors ${
                      job.enabled ? 'bg-win/10 text-win' : 'bg-loss/10 text-loss'
                    }`}
                    title={job.enabled ? 'Disable schedule' : 'Enable schedule'}
                  >
                    {job.enabled ? <CheckCircle className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
                  </button>
                  <div>
                    <p className="font-medium text-text-primary">{job.name}</p>
                    <p className="text-sm text-text-muted">
                      {job.schedule && <code className="text-xs bg-background-tertiary px-1 rounded mr-2">{job.schedule}</code>}
                      Next: {job.nextRun || 'Not scheduled'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {job.lastRun && (
                    <span className="text-sm text-text-muted">
                      Last: {new Date(job.lastRun).toLocaleString()}
                    </span>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => runJob(job.id, job.source)}
                    disabled={!!runningJob || !job.enabled}
                  >
                    {runningJob === job.id ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Play className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Scrape Log */}
      <Card variant="bordered">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-accent" />
              Scrape Log
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setScrapeLog([])}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Clear
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-background-tertiary rounded-lg p-4 h-48 overflow-y-auto font-mono text-sm">
            {scrapeLog.length === 0 ? (
              <p className="text-text-muted">No scrape activity yet. Run a job to see logs here.</p>
            ) : (
              scrapeLog.map((log, i) => (
                <div key={i} className={`${log.includes('✓') ? 'text-win' : log.includes('✗') ? 'text-loss' : 'text-text-secondary'}`}>
                  {log}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tracked Experts */}
      <Card variant="bordered">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Twitter className="w-5 h-5 text-accent" />
              Tracked Experts
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowAddExpert(!showAddExpert)}
            >
              + Add Expert
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Add Expert Form */}
          {showAddExpert && (
            <div className="flex gap-2 mb-4 p-4 bg-background-tertiary rounded-lg">
              <input
                type="text"
                placeholder="@username"
                value={newExpertHandle}
                onChange={(e) => setNewExpertHandle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addExpert()}
                className="flex-1 px-3 py-2 bg-background rounded-lg border border-border text-text-primary placeholder-text-muted focus:outline-none focus:border-accent"
              />
              <Button variant="primary" onClick={addExpert}>
                Add & Scrape
              </Button>
              <Button variant="ghost" onClick={() => setShowAddExpert(false)}>
                Cancel
              </Button>
            </div>
          )}

          {/* Experts Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-sm font-medium text-text-muted">Name</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-text-muted">Source</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-text-muted">Sport</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-text-muted">Twitter</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-text-muted">Record</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-text-muted">Win %</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-text-muted">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-text-muted">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                      Loading experts...
                    </td>
                  </tr>
                ) : experts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-text-muted">
                      No experts tracked yet. Run the SQL migration and add experts.
                    </td>
                  </tr>
                ) : (
                  experts.slice(0, 20).map(expert => (
                    <tr key={expert.id} className="border-b border-border/50 hover:bg-background-secondary/50">
                      <td className="py-3 px-4">
                        <span className="font-medium text-text-primary">{expert.name}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          expert.source === 'espn' ? 'bg-red-500/10 text-red-400' :
                          expert.source === 'action_network' ? 'bg-blue-500/10 text-blue-400' :
                          expert.source === 'fox' ? 'bg-yellow-500/10 text-yellow-400' :
                          'bg-gray-500/10 text-gray-400'
                        }`}>
                          {expert.source}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-text-secondary">{expert.sport}</td>
                      <td className="py-3 px-4">
                        {expert.twitter_handle ? (
                          <a 
                            href={`https://x.com/${expert.twitter_handle}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-accent hover:underline"
                          >
                            @{expert.twitter_handle}
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          <span className="text-text-muted">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-text-secondary">
                        {expert.season_wins}-{expert.season_losses}
                      </td>
                      <td className="py-3 px-4">
                        <span className={expert.season_win_pct > 52 ? 'text-win' : expert.season_win_pct < 48 ? 'text-loss' : 'text-text-secondary'}>
                          {expert.season_win_pct?.toFixed(1) || '0.0'}%
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => runJob(`expert-${expert.id}`, 'twitter')}
                          disabled={!expert.twitter_handle || !!runningJob}
                          title="Scrape this expert"
                        >
                          <RefreshCw className={`w-4 h-4 ${runningJob === `expert-${expert.id}` ? 'animate-spin' : ''}`} />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            {experts.length > 20 && (
              <p className="text-center text-text-muted text-sm py-4">
                Showing 20 of {experts.length} experts
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* X API Status */}
      <Card variant="bordered">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Twitter className="w-5 h-5 text-accent" />
            X/Twitter API Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 bg-background-tertiary rounded-lg">
              <h4 className="font-medium text-text-primary mb-2">Bearer Token</h4>
              <p className="text-sm text-text-secondary mb-3">
                Status: {process.env.NEXT_PUBLIC_X_ENABLED === 'true' ? (
                  <span className="text-win">Configured</span>
                ) : (
                  <span className="text-text-muted">Check .env.local</span>
                )}
              </p>
              <p className="text-xs text-text-muted">
                Set <code className="bg-background px-1 rounded">X_BEARER_TOKEN</code> or <code className="bg-background px-1 rounded">TWITTER_BEARER_TOKEN</code> in your environment.
              </p>
            </div>
            <div className="p-4 bg-background-tertiary rounded-lg">
              <h4 className="font-medium text-text-primary mb-2">Rate Limits</h4>
              <p className="text-sm text-text-secondary mb-3">
                X Premium: 10,000 tweets/month (basic), 100,000/month (pro)
              </p>
              <p className="text-xs text-text-muted">
                Each expert scrape fetches up to 100 tweets. With 40+ experts, budget ~4,000 tweets per full scrape.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default ScrapersTabContent
