'use client'

import { useState, useEffect } from 'react'
import { 
  AlertTriangle, 
  TrendingUp, 
  Zap, 
  Target, 
  DollarSign,
  BarChart3,
  Clock,
  ChevronRight,
  RefreshCw,
  X
} from 'lucide-react'
import { 
  EdgeAlert, 
  EdgeType, 
  EdgeSeverity, 
  severityColors, 
  edgeTypeIcons, 
  edgeTypeLabels 
} from '@/lib/edge-features'

interface EdgeAlertsProps {
  gameId?: string
  sport?: string
  showAll?: boolean
  compact?: boolean
  maxAlerts?: number
  onAlertClick?: (alert: EdgeAlert) => void
}

const typeIcons: Record<EdgeType, React.ReactNode> = {
  rlm: <TrendingUp className="w-4 h-4" />,
  steam: <Zap className="w-4 h-4" />,
  clv: <BarChart3 className="w-4 h-4" />,
  'sharp-public': <Target className="w-4 h-4" />,
  arbitrage: <DollarSign className="w-4 h-4" />,
  props: <BarChart3 className="w-4 h-4" />,
}

export function EdgeAlerts({ 
  gameId, 
  sport = 'NFL', 
  showAll = false,
  compact = false,
  maxAlerts = 5,
  onAlertClick 
}: EdgeAlertsProps) {
  const [alerts, setAlerts] = useState<EdgeAlert[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())
  
  const fetchAlerts = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (gameId) params.set('gameId', gameId)
      if (sport) params.set('sport', sport)
      
      const res = await fetch(`/api/edges?${params.toString()}`)
      if (!res.ok) throw new Error('Failed to fetch alerts')
      
      const data = await res.json()
      setAlerts(data.alerts || [])
      setError(null)
    } catch (err) {
      setError('Failed to load edge alerts')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }
  
  useEffect(() => {
    fetchAlerts()
    // Refresh every 2 minutes
    const interval = setInterval(fetchAlerts, 2 * 60 * 1000)
    return () => clearInterval(interval)
  }, [gameId, sport])
  
  const visibleAlerts = alerts
    .filter(a => !dismissed.has(a.id))
    .slice(0, showAll ? undefined : maxAlerts)
  
  if (loading && alerts.length === 0) {
    return (
      <div className="animate-pulse p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)' }}>
        <div className="h-4 bg-white/10 rounded w-1/3 mb-2"></div>
        <div className="h-3 bg-white/5 rounded w-2/3"></div>
      </div>
    )
  }
  
  if (error) {
    return (
      <div className="p-3 rounded-xl text-xs" style={{ background: 'rgba(255,68,85,0.1)', color: '#FF4455' }}>
        {error}
      </div>
    )
  }
  
  if (visibleAlerts.length === 0) {
    return compact ? null : (
      <div className="p-4 rounded-xl text-center" style={{ background: 'rgba(255,255,255,0.03)' }}>
        <div className="text-sm" style={{ color: '#606070' }}>No active edge alerts</div>
        <button 
          onClick={fetchAlerts}
          className="mt-2 text-xs flex items-center gap-1 mx-auto hover:opacity-80"
          style={{ color: '#00A8FF' }}
        >
          <RefreshCw className="w-3 h-3" /> Refresh
        </button>
      </div>
    )
  }
  
  if (compact) {
    return (
      <div className="flex flex-wrap gap-2">
        {visibleAlerts.map(alert => (
          <button
            key={alert.id}
            onClick={() => onAlertClick?.(alert)}
            className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-semibold transition-all hover:scale-105"
            style={{ 
              background: severityColors[alert.severity].bg,
              color: severityColors[alert.severity].text,
              border: `1px solid ${severityColors[alert.severity].border}`
            }}
          >
            <span>{edgeTypeIcons[alert.type]}</span>
            <span>{edgeTypeLabels[alert.type]}</span>
            {alert.confidence >= 80 && <span>🔥</span>}
          </button>
        ))}
      </div>
    )
  }
  
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" style={{ color: '#FF6B00' }} />
          <span className="font-bold text-sm" style={{ color: '#FFF' }}>Edge Alerts</span>
          <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,107,0,0.2)', color: '#FF6B00' }}>
            {visibleAlerts.length} Active
          </span>
        </div>
        <button 
          onClick={fetchAlerts}
          className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
          title="Refresh alerts"
        >
          <RefreshCw className="w-4 h-4" style={{ color: '#606070' }} />
        </button>
      </div>
      
      {visibleAlerts.map(alert => (
        <EdgeAlertCard 
          key={alert.id} 
          alert={alert} 
          onDismiss={() => setDismissed(prev => new Set(prev).add(alert.id))}
          onClick={() => onAlertClick?.(alert)}
        />
      ))}
      
      {!showAll && alerts.length > maxAlerts && (
        <button 
          className="w-full py-2 text-xs font-semibold rounded-lg transition-all hover:bg-white/5 flex items-center justify-center gap-1"
          style={{ color: '#00A8FF' }}
        >
          View all {alerts.length} alerts <ChevronRight className="w-3 h-3" />
        </button>
      )}
    </div>
  )
}

interface EdgeAlertCardProps {
  alert: EdgeAlert
  onDismiss?: () => void
  onClick?: () => void
}

export function EdgeAlertCard({ alert, onDismiss, onClick }: EdgeAlertCardProps) {
  const colors = severityColors[alert.severity]
  
  const timeUntilExpiry = alert.expiresAt 
    ? Math.max(0, new Date(alert.expiresAt).getTime() - Date.now())
    : null
  
  const expiryMinutes = timeUntilExpiry ? Math.ceil(timeUntilExpiry / 60000) : null
  
  return (
    <div 
      className="relative p-3 rounded-xl transition-all hover:scale-[1.01] cursor-pointer group"
      style={{ 
        background: colors.bg,
        border: `1px solid ${colors.border}`
      }}
      onClick={onClick}
    >
      {/* Dismiss button */}
      {onDismiss && (
        <button 
          onClick={(e) => { e.stopPropagation(); onDismiss(); }}
          className="absolute top-2 right-2 p-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/10"
        >
          <X className="w-3 h-3" style={{ color: colors.text }} />
        </button>
      )}
      
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div 
          className="p-2 rounded-lg"
          style={{ background: `${colors.text}20` }}
        >
          <span style={{ color: colors.text }}>
            {typeIcons[alert.type]}
          </span>
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-bold text-sm" style={{ color: '#FFF' }}>
              {alert.title}
            </span>
            {alert.severity === 'critical' && (
              <span className="text-[10px] px-1.5 py-0.5 rounded font-bold animate-pulse"
                    style={{ background: 'rgba(255,68,85,0.3)', color: '#FF4455' }}>
                CRITICAL
              </span>
            )}
          </div>
          
          <p className="text-xs mb-2 line-clamp-2" style={{ color: '#A0A0B0' }}>
            {alert.description}
          </p>
          
          {/* Stats */}
          <div className="flex items-center gap-3 text-[10px]">
            <span style={{ color: '#606070' }}>
              Confidence: <span style={{ color: alert.confidence >= 75 ? '#00FF88' : '#FFD700' }}>
                {alert.confidence}%
              </span>
            </span>
            
            {alert.expectedValue && (
              <span style={{ color: '#606070' }}>
                Expected: <span style={{ color: '#00FF88' }}>+{alert.expectedValue.toFixed(1)}%</span>
              </span>
            )}
            
            {expiryMinutes && expiryMinutes <= 60 && (
              <span className="flex items-center gap-1" style={{ color: '#FF4455' }}>
                <Clock className="w-3 h-3" />
                {expiryMinutes}m left
              </span>
            )}
          </div>
        </div>
        
        {/* Arrow */}
        <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: '#606070' }} />
      </div>
    </div>
  )
}

// Badge component for inline use
interface EdgeBadgeProps {
  type: EdgeType
  severity?: EdgeSeverity
  small?: boolean
}

export function EdgeBadge({ type, severity = 'info', small = false }: EdgeBadgeProps) {
  const colors = severityColors[severity]
  
  return (
    <span 
      className={`inline-flex items-center gap-1 rounded-lg font-semibold ${small ? 'px-1.5 py-0.5 text-[9px]' : 'px-2 py-1 text-[10px]'}`}
      style={{ 
        background: colors.bg,
        color: colors.text,
        border: `1px solid ${colors.border}`
      }}
    >
      <span>{edgeTypeIcons[type]}</span>
      <span>{edgeTypeLabels[type]}</span>
    </span>
  )
}
