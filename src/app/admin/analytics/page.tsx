'use client'

import { useState, useEffect, useCallback } from 'react'
import { 
  BarChart3, 
  Users, 
  Eye, 
  Clock, 
  Globe, 
  Monitor, 
  Smartphone, 
  Tablet,
  ArrowLeft,
  RefreshCw,
  TrendingUp,
  MousePointer,
  ExternalLink,
  MapPin,
} from 'lucide-react'
import Link from 'next/link'

interface AnalyticsData {
  range: string
  since: string
  overview: {
    totalPageviews: number
    uniqueVisitors: number
    totalSessions: number
    avgPagesPerSession: number
  }
  topPages: Array<{ page: string; views: number }>
  devices: { mobile: number; tablet: number; desktop: number }
  browsers: Array<{ browser: string; count: number }>
  topReferrers: Array<{ referrer: string; count: number }>
  topCountries: Array<{ country: string; count: number }>
  hourlyDistribution: number[]
  recentEvents: Array<{
    type: string
    page: string
    browser: string
    os: string
    country: string
    city: string
    isMobile: boolean
    referrer: string
    createdAt: string
    data: Record<string, unknown>
  }>
}

const RANGE_OPTIONS = [
  { value: '1d', label: 'Last 24 Hours' },
  { value: '7d', label: 'Last 7 Days' },
  { value: '30d', label: 'Last 30 Days' },
  { value: 'all', label: 'All Time' },
]

function StatCard({ label, value, icon: Icon, color }: { 
  label: string; value: string | number; icon: typeof Eye; color: string 
}) {
  return (
    <div className="bg-background-secondary border border-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-text-secondary text-xs uppercase tracking-wider">{label}</span>
        <div className={`p-2 rounded-lg bg-opacity-10 ${color}`}>
          <Icon className={`w-4 h-4 ${color}`} />
        </div>
      </div>
      <div className="text-2xl font-bold text-text-primary">{typeof value === 'number' ? value.toLocaleString() : value}</div>
    </div>
  )
}

function BarChartSimple({ data, maxVal }: { data: number[]; maxVal: number }) {
  if (maxVal === 0) return <div className="text-xs text-text-secondary">No data</div>
  return (
    <div className="flex items-end gap-px h-24">
      {data.map((val, i) => (
        <div key={i} className="flex-1 flex flex-col items-center">
          <div
            className="w-full bg-accent/60 rounded-t-sm min-h-[2px] transition-all"
            style={{ height: `${Math.max((val / maxVal) * 100, 2)}%` }}
            title={`${i}:00 - ${val} views`}
          />
        </div>
      ))}
    </div>
  )
}

function ProgressBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0
  return (
    <div className="w-full bg-background-tertiary rounded-full h-2">
      <div className={`h-2 rounded-full ${color}`} style={{ width: `${pct}%` }} />
    </div>
  )
}

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [range, setRange] = useState('7d')
  const [activeTab, setActiveTab] = useState<'overview' | 'pages' | 'sources' | 'live'>('overview')

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/analytics?range=${range}`)
      if (res.ok) {
        setData(await res.json())
      }
    } catch (err) {
      console.error('Failed to fetch analytics:', err)
    } finally {
      setLoading(false)
    }
  }, [range])

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 60000) // Refresh every minute
    return () => clearInterval(interval)
  }, [fetchData])

  const deviceTotal = data ? data.devices.mobile + data.devices.tablet + data.devices.desktop : 0

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
                <BarChart3 className="w-6 h-6 text-accent" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-text-primary">Site Analytics</h1>
                <p className="text-sm text-text-secondary">
                  Custom tracking &bull; No third-party services &bull; Auto-refreshes every 60s
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <select
                value={range}
                onChange={(e) => setRange(e.target.value)}
                className="bg-background-tertiary border border-border rounded-lg px-3 py-2 text-sm text-text-primary"
              >
                {RANGE_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <button
                onClick={fetchData}
                className="flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accent/90 text-background font-semibold rounded-lg transition"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        
        {loading && !data ? (
          <div className="flex items-center justify-center py-20">
            <RefreshCw className="w-8 h-8 text-accent animate-spin" />
          </div>
        ) : !data ? (
          <div className="text-center py-20">
            <BarChart3 className="w-12 h-12 text-text-secondary mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-text-primary mb-2">No Analytics Data Yet</h3>
            <p className="text-text-secondary">Data will appear once the analytics tracker starts collecting events.</p>
            <p className="text-sm text-text-secondary mt-2">
              Make sure the <code className="text-accent">analytics_events</code> table exists in Supabase.
            </p>
          </div>
        ) : (
          <>
            {/* Overview Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard 
                label="Page Views" 
                value={data.overview.totalPageviews} 
                icon={Eye} 
                color="text-blue-400" 
              />
              <StatCard 
                label="Unique Visitors" 
                value={data.overview.uniqueVisitors} 
                icon={Users} 
                color="text-green-400" 
              />
              <StatCard 
                label="Sessions" 
                value={data.overview.totalSessions} 
                icon={TrendingUp} 
                color="text-purple-400" 
              />
              <StatCard 
                label="Pages / Session" 
                value={data.overview.avgPagesPerSession} 
                icon={MousePointer} 
                color="text-orange-400" 
              />
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-background-secondary border border-border rounded-xl p-1">
              {(['overview', 'pages', 'sources', 'live'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition ${
                    activeTab === tab
                      ? 'bg-accent text-background'
                      : 'text-text-secondary hover:text-text-primary hover:bg-background-tertiary'
                  }`}
                >
                  {tab === 'overview' ? 'Overview' : tab === 'pages' ? 'Pages' : tab === 'sources' ? 'Sources & Devices' : 'Live Feed'}
                </button>
              ))}
            </div>

            {activeTab === 'overview' && (
              <div className="grid lg:grid-cols-2 gap-6">
                {/* Hourly Distribution */}
                <div className="bg-background-secondary border border-border rounded-xl p-5">
                  <h3 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-accent" /> Hourly Traffic (Last 24h)
                  </h3>
                  <BarChartSimple data={data.hourlyDistribution} maxVal={Math.max(...data.hourlyDistribution, 1)} />
                  <div className="flex justify-between mt-2">
                    <span className="text-xs text-text-secondary">12AM</span>
                    <span className="text-xs text-text-secondary">6AM</span>
                    <span className="text-xs text-text-secondary">12PM</span>
                    <span className="text-xs text-text-secondary">6PM</span>
                    <span className="text-xs text-text-secondary">11PM</span>
                  </div>
                </div>

                {/* Device Breakdown */}
                <div className="bg-background-secondary border border-border rounded-xl p-5">
                  <h3 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
                    <Monitor className="w-4 h-4 text-accent" /> Devices
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Monitor className="w-5 h-5 text-blue-400" />
                      <div className="flex-1">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-text-primary">Desktop</span>
                          <span className="text-text-secondary">{data.devices.desktop} ({deviceTotal > 0 ? Math.round(data.devices.desktop / deviceTotal * 100) : 0}%)</span>
                        </div>
                        <ProgressBar value={data.devices.desktop} max={deviceTotal} color="bg-blue-400" />
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Smartphone className="w-5 h-5 text-green-400" />
                      <div className="flex-1">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-text-primary">Mobile</span>
                          <span className="text-text-secondary">{data.devices.mobile} ({deviceTotal > 0 ? Math.round(data.devices.mobile / deviceTotal * 100) : 0}%)</span>
                        </div>
                        <ProgressBar value={data.devices.mobile} max={deviceTotal} color="bg-green-400" />
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Tablet className="w-5 h-5 text-purple-400" />
                      <div className="flex-1">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-text-primary">Tablet</span>
                          <span className="text-text-secondary">{data.devices.tablet} ({deviceTotal > 0 ? Math.round(data.devices.tablet / deviceTotal * 100) : 0}%)</span>
                        </div>
                        <ProgressBar value={data.devices.tablet} max={deviceTotal} color="bg-purple-400" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Top Countries */}
                <div className="bg-background-secondary border border-border rounded-xl p-5">
                  <h3 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
                    <Globe className="w-4 h-4 text-accent" /> Top Countries
                  </h3>
                  {data.topCountries.length > 0 ? (
                    <div className="space-y-2">
                      {data.topCountries.map((c, i) => (
                        <div key={i} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <MapPin className="w-3 h-3 text-text-secondary" />
                            <span className="text-text-primary">{c.country}</span>
                          </div>
                          <span className="text-text-secondary">{c.count}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-text-secondary">No geo data yet</p>
                  )}
                </div>

                {/* Browsers */}
                <div className="bg-background-secondary border border-border rounded-xl p-5">
                  <h3 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
                    <Globe className="w-4 h-4 text-accent" /> Browsers
                  </h3>
                  {data.browsers.length > 0 ? (
                    <div className="space-y-2">
                      {data.browsers.map((b, i) => (
                        <div key={i} className="flex items-center justify-between text-sm">
                          <span className="text-text-primary">{b.browser}</span>
                          <span className="text-text-secondary">{b.count}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-text-secondary">No data yet</p>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'pages' && (
              <div className="bg-background-secondary border border-border rounded-xl p-5">
                <h3 className="text-sm font-semibold text-text-primary mb-4">Top Pages</h3>
                {data.topPages.length > 0 ? (
                  <div className="space-y-1">
                    <div className="grid grid-cols-12 gap-2 text-xs text-text-secondary font-medium pb-2 border-b border-border">
                      <div className="col-span-1">#</div>
                      <div className="col-span-8">Page</div>
                      <div className="col-span-3 text-right">Views</div>
                    </div>
                    {data.topPages.map((p, i) => (
                      <div key={i} className="grid grid-cols-12 gap-2 py-2 hover:bg-background-tertiary/50 rounded-lg px-1 transition">
                        <div className="col-span-1 text-xs text-text-secondary">{i + 1}</div>
                        <div className="col-span-8">
                          <Link href={p.page} className="text-sm text-accent hover:underline truncate block">
                            {p.page}
                          </Link>
                        </div>
                        <div className="col-span-3 text-right">
                          <span className="text-sm font-medium text-text-primary">{p.views.toLocaleString()}</span>
                          <div className="mt-1">
                            <ProgressBar 
                              value={p.views} 
                              max={data.topPages[0]?.views || 1} 
                              color="bg-accent" 
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-text-secondary">No page data yet</p>
                )}
              </div>
            )}

            {activeTab === 'sources' && (
              <div className="grid lg:grid-cols-2 gap-6">
                {/* Top Referrers */}
                <div className="bg-background-secondary border border-border rounded-xl p-5">
                  <h3 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
                    <ExternalLink className="w-4 h-4 text-accent" /> Top Referrers
                  </h3>
                  {data.topReferrers.length > 0 ? (
                    <div className="space-y-2">
                      {data.topReferrers.map((r, i) => (
                        <div key={i} className="flex items-center justify-between text-sm">
                          <span className="text-text-primary truncate mr-2">{r.referrer}</span>
                          <span className="text-text-secondary flex-shrink-0">{r.count}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-text-secondary">No referrer data yet (direct traffic only)</p>
                  )}
                </div>

                {/* Device + Browser detail */}
                <div className="bg-background-secondary border border-border rounded-xl p-5">
                  <h3 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
                    <Monitor className="w-4 h-4 text-accent" /> Device &amp; Browser Details
                  </h3>
                  <div className="space-y-3">
                    {data.browsers.map((b, i) => {
                      const total = data.browsers.reduce((s, x) => s + x.count, 0)
                      return (
                        <div key={i}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-text-primary">{b.browser}</span>
                            <span className="text-text-secondary">{total > 0 ? Math.round(b.count / total * 100) : 0}%</span>
                          </div>
                          <ProgressBar value={b.count} max={data.browsers[0]?.count || 1} color="bg-accent" />
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'live' && (
              <div className="bg-background-secondary border border-border rounded-xl p-5">
                <h3 className="text-sm font-semibold text-text-primary mb-4">Recent Activity</h3>
                <div className="space-y-1 max-h-[600px] overflow-y-auto">
                  <div className="grid grid-cols-12 gap-2 text-xs text-text-secondary font-medium pb-2 border-b border-border sticky top-0 bg-background-secondary">
                    <div className="col-span-1">Type</div>
                    <div className="col-span-3">Page</div>
                    <div className="col-span-2">Location</div>
                    <div className="col-span-2">Device</div>
                    <div className="col-span-2">Source</div>
                    <div className="col-span-2">Time</div>
                  </div>
                  {data.recentEvents.map((event, i) => (
                    <div key={i} className="grid grid-cols-12 gap-2 py-2 text-sm hover:bg-background-tertiary/50 rounded-lg transition">
                      <div className="col-span-1">
                        <span className={`inline-flex px-1.5 py-0.5 rounded text-xs font-medium ${
                          event.type === 'pageview' ? 'bg-blue-400/10 text-blue-400' :
                          event.type === 'click' ? 'bg-green-400/10 text-green-400' :
                          event.type === 'session_start' ? 'bg-purple-400/10 text-purple-400' :
                          'bg-gray-400/10 text-gray-400'
                        }`}>
                          {event.type === 'pageview' ? 'PV' : 
                           event.type === 'click' ? 'CK' : 
                           event.type === 'session_start' ? 'SS' : 
                           event.type === 'page_exit' ? 'EX' : event.type.slice(0, 2).toUpperCase()}
                        </span>
                      </div>
                      <div className="col-span-3 text-text-primary truncate text-xs">{event.page}</div>
                      <div className="col-span-2 text-text-secondary text-xs">
                        {event.city && event.country ? `${event.city}, ${event.country}` : event.country || '-'}
                      </div>
                      <div className="col-span-2 text-text-secondary text-xs">
                        {event.isMobile ? '📱' : '🖥️'} {event.browser}/{event.os}
                      </div>
                      <div className="col-span-2 text-text-secondary text-xs truncate">
                        {event.referrer ? new URL(event.referrer).hostname : 'direct'}
                      </div>
                      <div className="col-span-2 text-text-secondary text-xs">
                        {new Date(event.createdAt).toLocaleTimeString()}
                      </div>
                    </div>
                  ))}
                  {data.recentEvents.length === 0 && (
                    <p className="text-sm text-text-secondary py-8 text-center">No events recorded yet</p>
                  )}
                </div>
              </div>
            )}

            {/* Info Box */}
            <div className="bg-background-secondary border border-border rounded-xl p-5">
              <h3 className="text-sm font-semibold text-text-primary mb-2">About This Analytics</h3>
              <div className="text-xs text-text-secondary space-y-1">
                <p>Custom-built analytics stored in Supabase. No Google Analytics or third-party services involved.</p>
                <p>Tracks: page views, unique visitors, sessions, scroll depth, clicks, devices, browsers, geo location, referrers, and UTM params.</p>
                <p>Respects Do Not Track (DNT) browser settings. IPs are hashed for privacy.</p>
                <p>Ready for Google Analytics once you have a permanent domain &mdash; just add the GA4 tag to the layout.</p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
