'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Activity,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Server,
  Database,
  Wifi,
  Clock,
  TrendingUp,
  Shield,
  Zap,
  ExternalLink
} from 'lucide-react'

interface ServiceHealth {
  name: string
  status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown'
  latency?: number
  lastCheck: string
  message?: string
  details?: Record<string, unknown>
}

interface SystemHealth {
  status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown'
  timestamp: string
  version: string
  environment: string
  services: ServiceHealth[]
  summary: {
    total: number
    healthy: number
    degraded: number
    unhealthy: number
  }
}

export default function SystemHealthPage() {
  const [health, setHealth] = useState<SystemHealth | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(true)

  const fetchHealth = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/health?healing=true')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setHealth(data)
      setError(null)
      setLastRefresh(new Date())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch health')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHealth()
    
    // Auto-refresh every 30 seconds if enabled
    if (autoRefresh) {
      const interval = setInterval(fetchHealth, 30000)
      return () => clearInterval(interval)
    }
  }, [autoRefresh])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return '#00FF88'
      case 'degraded': return '#FFD700'
      case 'unhealthy': return '#FF4455'
      default: return '#808090'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle2 className="w-5 h-5" style={{ color: '#00FF88' }} />
      case 'degraded': return <AlertTriangle className="w-5 h-5" style={{ color: '#FFD700' }} />
      case 'unhealthy': return <XCircle className="w-5 h-5" style={{ color: '#FF4455' }} />
      default: return <Activity className="w-5 h-5" style={{ color: '#808090' }} />
    }
  }

  const getServiceIcon = (name: string) => {
    if (name.includes('ESPN')) return <TrendingUp className="w-5 h-5" />
    if (name.includes('Supabase')) return <Database className="w-5 h-5" />
    if (name.includes('Odds')) return <Zap className="w-5 h-5" />
    if (name.includes('Internal')) return <Server className="w-5 h-5" />
    return <Wifi className="w-5 h-5" />
  }

  return (
    <div className="min-h-screen" style={{ background: '#050508' }}>
      {/* Header */}
      <div style={{ 
        background: 'linear-gradient(180deg, #0a0a12 0%, #050508 100%)',
        borderBottom: '1px solid rgba(255,255,255,0.06)'
      }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link href="/admin" className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold mb-4 transition-all hover:bg-white/10"
                style={{ color: '#808090' }}>
            <ArrowLeft className="w-4 h-4" /> Admin
          </Link>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
                   style={{ background: 'linear-gradient(135deg, rgba(0,255,136,0.4) 0%, rgba(0,200,100,0.4) 100%)' }}>
                <Shield className="w-6 h-6" style={{ color: '#00FF88' }} />
              </div>
              <div>
                <h1 className="text-2xl font-black"
                    style={{ 
                      background: 'linear-gradient(135deg, #00FF88 0%, #00CC66 100%)',
                      WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
                    }}>
                  SYSTEM HEALTH
                </h1>
                <p className="text-xs" style={{ color: '#808090' }}>
                  Real-time monitoring • Self-healing infrastructure
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: '#808090' }}>
                <input 
                  type="checkbox" 
                  checked={autoRefresh} 
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="rounded"
                />
                Auto-refresh
              </label>
              <button
                onClick={fetchHealth}
                disabled={loading}
                className="p-2 rounded-xl transition-all hover:bg-white/10 disabled:opacity-50"
                style={{ background: 'rgba(255,255,255,0.05)' }}>
                <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} style={{ color: '#808090' }} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Error State */}
        {error && (
          <div className="rounded-2xl p-4" style={{ background: 'rgba(255,68,85,0.1)', border: '1px solid rgba(255,68,85,0.3)' }}>
            <div className="flex items-center gap-2">
              <XCircle className="w-5 h-5" style={{ color: '#FF4455' }} />
              <span className="font-semibold" style={{ color: '#FF4455' }}>Error fetching health status: {error}</span>
            </div>
          </div>
        )}

        {/* Overall Status */}
        {health && (
          <div className="rounded-2xl p-6" style={{ 
            background: `rgba(${health.status === 'healthy' ? '0,255,136' : health.status === 'degraded' ? '255,215,0' : '255,68,85'},0.05)`,
            border: `1px solid rgba(${health.status === 'healthy' ? '0,255,136' : health.status === 'degraded' ? '255,215,0' : '255,68,85'},0.2)`
          }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                     style={{ background: `rgba(${health.status === 'healthy' ? '0,255,136' : health.status === 'degraded' ? '255,215,0' : '255,68,85'},0.2)` }}>
                  {getStatusIcon(health.status)}
                </div>
                <div>
                  <div className="text-3xl font-black" style={{ color: getStatusColor(health.status) }}>
                    {health.status.toUpperCase()}
                  </div>
                  <div className="text-sm" style={{ color: '#808090' }}>
                    {health.summary.healthy}/{health.summary.total} services healthy
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="px-4 py-2 rounded-xl" style={{ background: 'rgba(0,255,136,0.1)' }}>
                  <div className="text-2xl font-bold" style={{ color: '#00FF88' }}>{health.summary.healthy}</div>
                  <div className="text-xs" style={{ color: '#808090' }}>Healthy</div>
                </div>
                <div className="px-4 py-2 rounded-xl" style={{ background: 'rgba(255,215,0,0.1)' }}>
                  <div className="text-2xl font-bold" style={{ color: '#FFD700' }}>{health.summary.degraded}</div>
                  <div className="text-xs" style={{ color: '#808090' }}>Degraded</div>
                </div>
                <div className="px-4 py-2 rounded-xl" style={{ background: 'rgba(255,68,85,0.1)' }}>
                  <div className="text-2xl font-bold" style={{ color: '#FF4455' }}>{health.summary.unhealthy}</div>
                  <div className="text-xs" style={{ color: '#808090' }}>Unhealthy</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Service Grid */}
        {health && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {health.services.map((service) => (
              <div key={service.name} className="rounded-2xl p-4" style={{ 
                background: 'rgba(255,255,255,0.02)',
                border: `1px solid ${service.status === 'healthy' ? 'rgba(0,255,136,0.2)' : service.status === 'degraded' ? 'rgba(255,215,0,0.2)' : 'rgba(255,68,85,0.3)'}`
              }}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.05)' }}>
                      {getServiceIcon(service.name)}
                    </div>
                    <div>
                      <div className="font-semibold text-white text-sm">{service.name}</div>
                      <div className="text-xs" style={{ color: '#808090' }}>
                        {service.latency ? `${service.latency}ms` : 'N/A'}
                      </div>
                    </div>
                  </div>
                  {getStatusIcon(service.status)}
                </div>
                
                <div className="text-xs" style={{ color: '#808090' }}>
                  {service.message || 'No message'}
                </div>
                
                {service.details && Object.keys(service.details).length > 0 && (
                  <div className="mt-2 pt-2 text-xs" style={{ borderTop: '1px solid rgba(255,255,255,0.05)', color: '#606070' }}>
                    {Object.entries(service.details).map(([key, value]) => (
                      <div key={key}>{key}: {String(value)}</div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Meta Info */}
        {health && (
          <div className="flex items-center justify-between text-xs" style={{ color: '#606070' }}>
            <div className="flex items-center gap-4">
              <span>Version: {health.version}</span>
              <span>Environment: {health.environment}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-3 h-3" />
              <span>Last check: {lastRefresh?.toLocaleTimeString() || 'Never'}</span>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="rounded-2xl p-6" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <h3 className="font-bold text-white mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <a href="https://github.com/Rut304/Matchups/actions" target="_blank" rel="noopener noreferrer"
               className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all hover:bg-white/10"
               style={{ background: 'rgba(255,255,255,0.05)', color: '#808090' }}>
              <ExternalLink className="w-4 h-4" />
              View Workflows
            </a>
            <a href="https://vercel.com/dashboard" target="_blank" rel="noopener noreferrer"
               className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all hover:bg-white/10"
               style={{ background: 'rgba(255,255,255,0.05)', color: '#808090' }}>
              <ExternalLink className="w-4 h-4" />
              Vercel Dashboard
            </a>
            <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer"
               className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all hover:bg-white/10"
               style={{ background: 'rgba(255,255,255,0.05)', color: '#808090' }}>
              <ExternalLink className="w-4 h-4" />
              Supabase Dashboard
            </a>
            <button
               onClick={() => window.location.reload()}
               className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all hover:bg-white/10"
               style={{ background: 'rgba(255,255,255,0.05)', color: '#808090' }}>
              <RefreshCw className="w-4 h-4" />
              Hard Refresh
            </button>
          </div>
        </div>

        {/* Automation Status */}
        <div className="rounded-2xl p-6" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <h3 className="font-bold text-white mb-4">🤖 Automation Status</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)' }}>
              <div className="font-medium text-white mb-2">Health Monitor</div>
              <div className="text-xs space-y-1" style={{ color: '#808090' }}>
                <div>• Runs every 15 minutes</div>
                <div>• Auto-creates issues for failures</div>
                <div>• Triggers self-healing actions</div>
              </div>
            </div>
            <div className="p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)' }}>
              <div className="font-medium text-white mb-2">Data Sync</div>
              <div className="text-xs space-y-1" style={{ color: '#808090' }}>
                <div>• Runs every 2 hours</div>
                <div>• Extra runs on weekends</div>
                <div>• Warms API caches</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
