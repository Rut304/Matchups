'use client'

import { useState, useEffect, useMemo } from 'react'
import { TrendingUp, TrendingDown, Minus, Clock } from 'lucide-react'

// =============================================================================
// LINE MOVEMENT CHART
// Pure SVG sparkline — no external chart library needed
// Shows spread or total line movement over time from line_snapshots data
// =============================================================================

interface DataPoint {
  time: string
  value: number
  provider?: string
  odds?: number
}

interface LineSummary {
  opening: number
  current: number
  movement: number
  direction: string
}

interface LineMovementChartProps {
  gameId: string
  betType?: 'spread' | 'total'
  height?: number
  showLabels?: boolean
  compact?: boolean
}

export function LineMovementChart({ 
  gameId, 
  betType = 'spread', 
  height = 80,
  showLabels = true,
  compact = false 
}: LineMovementChartProps) {
  const [data, setData] = useState<DataPoint[]>([])
  const [summary, setSummary] = useState<LineSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchLineHistory() {
      try {
        const res = await fetch(`/api/line-history?gameId=${gameId}&betType=${betType}`)
        if (!res.ok) throw new Error('Failed to fetch')
        const json = await res.json()
        
        const points = betType === 'spread' ? json.chartData?.spread : json.chartData?.total
        if (points && points.length > 0) {
          setData(points)
          setSummary(json.summary?.[betType] || null)
        }
      } catch {
        setError('No line data')
      } finally {
        setLoading(false)
      }
    }
    
    if (gameId) fetchLineHistory()
  }, [gameId, betType])

  // Render the SVG path
  const chartWidth = compact ? 120 : 200
  const chartHeight = height
  const padding = { top: 4, bottom: 4, left: 2, right: 2 }

  const { path, minVal, maxVal, points } = useMemo(() => {
    if (data.length < 2) return { path: '', minVal: 0, maxVal: 0, points: [] }
    
    const values = data.map(d => d.value)
    const min = Math.min(...values)
    const max = Math.max(...values)
    const range = max - min || 1 // Prevent division by zero
    
    const w = chartWidth - padding.left - padding.right
    const h = chartHeight - padding.top - padding.bottom
    
    const pts = data.map((d, i) => ({
      x: padding.left + (i / (data.length - 1)) * w,
      y: padding.top + h - ((d.value - min) / range) * h,
      value: d.value,
      time: d.time,
    }))
    
    const pathStr = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ')
    
    return { path: pathStr, minVal: min, maxVal: max, points: pts }
  }, [data, chartWidth, chartHeight])

  if (loading) {
    return (
      <div className="flex items-center gap-1 text-xs text-slate-500">
        <Clock className="w-3 h-3 animate-pulse" />
        <span>Loading...</span>
      </div>
    )
  }

  if (error || data.length < 2) {
    if (compact) return null
    return (
      <div className="text-xs text-slate-600">
        No line movement data yet
      </div>
    )
  }

  const movement = summary?.movement || 0
  const isUp = movement > 0
  const isDown = movement < 0
  const lineColor = betType === 'spread'
    ? (isDown ? '#22c55e' : isUp ? '#ef4444' : '#94a3b8') // Green = favorite steaming, Red = dog steaming
    : (isUp ? '#f59e0b' : isDown ? '#3b82f6' : '#94a3b8')  // Amber = over trending, Blue = under trending

  const formatValue = (v: number) => {
    if (betType === 'spread') {
      return v > 0 ? `+${v.toFixed(1)}` : v.toFixed(1)
    }
    return v.toFixed(1)
  }

  if (compact) {
    // Compact: inline sparkline with opening → current
    return (
      <div className="flex items-center gap-2">
        <svg width={chartWidth} height={30} className="flex-shrink-0">
          <path d={path} fill="none" stroke={lineColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          {/* Dots at start and end */}
          {points.length >= 2 && (
            <>
              <circle cx={points[0].x} cy={points[0].y} r="2" fill={lineColor} />
              <circle cx={points[points.length - 1].x} cy={points[points.length - 1].y} r="2.5" fill={lineColor} stroke="white" strokeWidth="0.5" />
            </>
          )}
        </svg>
        <span className="text-xs font-mono" style={{ color: lineColor }}>
          {formatValue(data[0].value)} → {formatValue(data[data.length - 1].value)}
        </span>
      </div>
    )
  }

  // Full chart with labels
  return (
    <div className="space-y-1">
      {showLabels && summary && (
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-500 uppercase tracking-wide">
            {betType === 'spread' ? 'Spread' : 'Total'} Movement
          </span>
          <div className="flex items-center gap-1" style={{ color: lineColor }}>
            {isDown ? <TrendingDown className="w-3 h-3" /> : isUp ? <TrendingUp className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
            <span className="font-mono font-semibold">
              {movement > 0 ? '+' : ''}{movement.toFixed(1)}
            </span>
          </div>
        </div>
      )}
      
      <div className="relative">
        <svg width="100%" viewBox={`0 0 ${chartWidth} ${chartHeight}`} preserveAspectRatio="none" className="overflow-visible">
          {/* Grid lines */}
          <line x1={padding.left} y1={padding.top} x2={chartWidth - padding.right} y2={padding.top} stroke="#1e293b" strokeWidth="0.5" />
          <line x1={padding.left} y1={chartHeight - padding.bottom} x2={chartWidth - padding.right} y2={chartHeight - padding.bottom} stroke="#1e293b" strokeWidth="0.5" />
          
          {/* Opening line reference (dashed) */}
          {data.length > 0 && points.length > 0 && (
            <line 
              x1={padding.left} y1={points[0].y} 
              x2={chartWidth - padding.right} y2={points[0].y} 
              stroke="#475569" strokeWidth="0.5" strokeDasharray="3,3" 
            />
          )}
          
          {/* Area fill under the line */}
          <path 
            d={`${path} L ${points[points.length - 1]?.x.toFixed(1)} ${chartHeight - padding.bottom} L ${points[0]?.x.toFixed(1)} ${chartHeight - padding.bottom} Z`} 
            fill={lineColor} 
            fillOpacity="0.08" 
          />
          
          {/* Main line */}
          <path d={path} fill="none" stroke={lineColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          
          {/* Start dot */}
          {points.length >= 2 && (
            <>
              <circle cx={points[0].x} cy={points[0].y} r="3" fill="#0f172a" stroke={lineColor} strokeWidth="1.5" />
              <circle cx={points[points.length - 1].x} cy={points[points.length - 1].y} r="3.5" fill={lineColor} stroke="white" strokeWidth="1" />
            </>
          )}
        </svg>
        
        {/* Value labels */}
        {showLabels && data.length >= 2 && (
          <div className="flex justify-between text-[10px] font-mono mt-0.5">
            <span className="text-slate-500">{formatValue(data[0].value)}</span>
            <span style={{ color: lineColor }} className="font-semibold">{formatValue(data[data.length - 1].value)}</span>
          </div>
        )}
      </div>
      
      {showLabels && (
        <div className="text-[10px] text-slate-600">
          {data.length} snapshots • Updated every 30 min
        </div>
      )}
    </div>
  )
}
