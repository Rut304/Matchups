'use client'

import { useState, ReactNode } from 'react'
import Link from 'next/link'
import { ChevronDown, ChevronUp, ExternalLink, Info } from 'lucide-react'

// =============================================================================
// EXPANDABLE LIST - Shows all data with expand/collapse
// =============================================================================

interface ExpandableListProps<T> {
  items: T[]
  initialCount?: number
  renderItem: (item: T, index: number) => ReactNode
  title?: string
  viewAllLink?: string
  viewAllText?: string
  className?: string
  gridCols?: string
  showCount?: boolean
}

export function ExpandableList<T>({
  items,
  initialCount = 5,
  renderItem,
  title,
  viewAllLink,
  viewAllText = 'View All',
  className = '',
  gridCols = 'grid-cols-1',
  showCount = true,
}: ExpandableListProps<T>) {
  const [isExpanded, setIsExpanded] = useState(false)
  const displayItems = isExpanded ? items : items.slice(0, initialCount)
  const hasMore = items.length > initialCount

  return (
    <div className={className}>
      {title && (
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-sm" style={{ color: '#FFF' }}>{title}</h3>
          {showCount && (
            <span className="text-xs px-2 py-0.5 rounded" style={{ background: 'rgba(255,255,255,0.1)', color: '#808090' }}>
              {items.length} total
            </span>
          )}
        </div>
      )}
      
      <div className={`grid ${gridCols} gap-2`}>
        {displayItems.map((item, index) => renderItem(item, index))}
      </div>
      
      {hasMore && (
        <div className="mt-3 flex items-center gap-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:bg-white/10"
            style={{ background: 'rgba(255,255,255,0.05)', color: '#00A8FF' }}
          >
            {isExpanded ? (
              <>
                <ChevronUp className="w-3 h-3" />
                Show Less
              </>
            ) : (
              <>
                <ChevronDown className="w-3 h-3" />
                Show All {items.length}
              </>
            )}
          </button>
          
          {viewAllLink && (
            <Link 
              href={viewAllLink}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:bg-white/10"
              style={{ background: 'rgba(255,107,0,0.1)', color: '#FF6B00' }}
            >
              <ExternalLink className="w-3 h-3" />
              {viewAllText}
            </Link>
          )}
        </div>
      )}
    </div>
  )
}

// =============================================================================
// TOOLTIP - For metric explanations
// =============================================================================

interface TooltipProps {
  content: string | ReactNode
  children: ReactNode
  position?: 'top' | 'bottom' | 'left' | 'right'
}

export function Tooltip({ content, children, position = 'top' }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false)

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  }

  return (
    <div 
      className="relative inline-block"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div 
          className={`absolute z-50 px-3 py-2 rounded-lg text-xs max-w-xs whitespace-normal ${positionClasses[position]}`}
          style={{ 
            background: '#1a1a24', 
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
            color: '#E0E0E0'
          }}
        >
          {content}
          {/* Arrow */}
          <div 
            className={`absolute w-2 h-2 rotate-45 ${
              position === 'top' ? 'top-full left-1/2 -translate-x-1/2 -mt-1' :
              position === 'bottom' ? 'bottom-full left-1/2 -translate-x-1/2 -mb-1' :
              position === 'left' ? 'left-full top-1/2 -translate-y-1/2 -ml-1' :
              'right-full top-1/2 -translate-y-1/2 -mr-1'
            }`}
            style={{ background: '#1a1a24', borderRight: '1px solid rgba(255,255,255,0.1)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}
          />
        </div>
      )}
    </div>
  )
}

// =============================================================================
// METRIC WITH TOOLTIP - Stat display with explanation
// =============================================================================

interface MetricWithTooltipProps {
  label: string
  value: string | number
  tooltip: string
  color?: string
  icon?: ReactNode
  trend?: 'up' | 'down' | 'neutral'
  onClick?: () => void
  href?: string
}

export function MetricWithTooltip({
  label,
  value,
  tooltip,
  color = '#FFF',
  icon,
  trend,
  onClick,
  href,
}: MetricWithTooltipProps) {
  const content = (
    <div 
      className={`p-3 rounded-xl transition-all ${onClick || href ? 'cursor-pointer hover:bg-white/10' : ''}`}
      style={{ background: 'rgba(255,255,255,0.03)' }}
      onClick={onClick}
    >
      <Tooltip content={tooltip}>
        <div className="flex items-center gap-1 mb-1">
          {icon}
          <span className="text-[10px] font-medium" style={{ color: '#808090' }}>{label}</span>
          <Info className="w-3 h-3" style={{ color: '#606070' }} />
        </div>
      </Tooltip>
      <div className="flex items-center gap-1">
        <span className="text-lg font-black" style={{ color }}>
          {value}
        </span>
        {trend && (
          <span className={`text-xs ${
            trend === 'up' ? 'text-green-400' : 
            trend === 'down' ? 'text-red-400' : 
            'text-gray-400'
          }`}>
            {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '–'}
          </span>
        )}
      </div>
    </div>
  )

  if (href) {
    return <Link href={href}>{content}</Link>
  }

  return content
}

// =============================================================================
// CONFIDENCE SCORE CHART - Visual breakdown of scoring factors
// =============================================================================

interface ConfidenceFactorDisplay {
  name: string
  weight: number
  impact: number
  description: string
}

interface ConfidenceScoreChartProps {
  factors: ConfidenceFactorDisplay[]
  overallScore: number
  className?: string
}

export function ConfidenceScoreChart({ factors, overallScore, className = '' }: ConfidenceScoreChartProps) {
  return (
    <div className={`p-4 rounded-xl ${className}`} style={{ background: '#0c0c14', border: '1px solid rgba(255,255,255,0.06)' }}>
      {/* Header with overall score */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold" style={{ color: '#FFF' }}>Confidence Breakdown</span>
          <Tooltip content="Our AI model weighs multiple factors to generate a confidence score. Higher = more confident in the pick.">
            <Info className="w-4 h-4 cursor-help" style={{ color: '#606070' }} />
          </Tooltip>
        </div>
        <div 
          className="px-3 py-1 rounded-lg text-lg font-black"
          style={{ 
            background: overallScore >= 70 ? 'rgba(0,255,136,0.2)' : 
                       overallScore >= 50 ? 'rgba(255,215,0,0.2)' : 'rgba(255,68,85,0.2)',
            color: overallScore >= 70 ? '#00FF88' : 
                   overallScore >= 50 ? '#FFD700' : '#FF4455'
          }}
        >
          {overallScore}%
        </div>
      </div>

      {/* Factor bars */}
      <div className="space-y-3">
        {factors.map((factor, i) => (
          <div key={i}>
            <Tooltip content={factor.description} position="right">
              <div className="flex items-center justify-between mb-1 cursor-help">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium" style={{ color: '#A0A0B0' }}>{factor.name}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: 'rgba(255,255,255,0.05)', color: '#606070' }}>
                    {(factor.weight * 100).toFixed(0)}% weight
                  </span>
                </div>
                <span 
                  className="text-xs font-bold"
                  style={{ color: factor.impact > 0 ? '#00FF88' : factor.impact < 0 ? '#FF4455' : '#808090' }}
                >
                  {factor.impact > 0 ? '+' : ''}{factor.impact.toFixed(1)}
                </span>
              </div>
            </Tooltip>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
              <div 
                className="h-full rounded-full transition-all duration-500"
                style={{ 
                  width: `${Math.min(100, Math.abs(factor.impact) * 10 + 50)}%`,
                  background: factor.impact > 0 
                    ? 'linear-gradient(90deg, #00FF88, #00A8FF)' 
                    : factor.impact < 0 
                    ? 'linear-gradient(90deg, #FF4455, #FF6B00)'
                    : '#808090'
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="mt-4 pt-3 flex flex-wrap gap-3 text-[10px]" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full" style={{ background: '#00FF88' }} />
          <span style={{ color: '#808090' }}>Positive Signal</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full" style={{ background: '#FF4455' }} />
          <span style={{ color: '#808090' }}>Negative Signal</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full" style={{ background: '#808090' }} />
          <span style={{ color: '#808090' }}>Neutral</span>
        </div>
      </div>
    </div>
  )
}

// =============================================================================
// STAT BOX WITH DRILL DOWN - Clickable stat that links to full data
// =============================================================================

interface DrillDownStatProps {
  label: string
  value: string | number
  subValue?: string
  color?: string
  icon?: ReactNode
  tooltip: string
  href: string
  trend?: 'up' | 'down' | 'neutral'
}

export function DrillDownStat({
  label,
  value,
  subValue,
  color = '#FFF',
  icon,
  tooltip,
  href,
  trend,
}: DrillDownStatProps) {
  return (
    <Link href={href}>
      <Tooltip content={`${tooltip} • Click for full data`}>
        <div 
          className="p-4 rounded-xl transition-all hover:scale-[1.02] cursor-pointer group"
          style={{ background: '#0c0c14', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              {icon}
              <span className="text-xs font-medium" style={{ color: '#808090' }}>{label}</span>
            </div>
            <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: '#00A8FF' }} />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-black" style={{ color }}>{value}</span>
            {trend && (
              <span className={`text-sm ${
                trend === 'up' ? 'text-green-400' : 
                trend === 'down' ? 'text-red-400' : 
                'text-gray-400'
              }`}>
                {trend === 'up' ? '▲' : trend === 'down' ? '▼' : '—'}
              </span>
            )}
          </div>
          {subValue && (
            <div className="text-[10px] mt-1" style={{ color: '#606070' }}>{subValue}</div>
          )}
        </div>
      </Tooltip>
    </Link>
  )
}

// =============================================================================
// WEIGHTS DOCUMENTATION - Shows model weights visually
// =============================================================================

interface WeightDocumentationProps {
  weights: Record<string, number>
  descriptions: Record<string, string>
  className?: string
}

export function WeightDocumentation({ weights, descriptions, className = '' }: WeightDocumentationProps) {
  const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0)
  
  return (
    <div className={`p-4 rounded-xl ${className}`} style={{ background: '#0c0c14', border: '1px solid rgba(138,43,226,0.2)' }}>
      <div className="flex items-center gap-2 mb-4">
        <span className="text-sm font-bold" style={{ color: '#9B59B6' }}>Model Weight Distribution</span>
        <Tooltip content="These weights determine how much each factor influences the final confidence score. Weights are automatically adjusted through recursive learning.">
          <Info className="w-4 h-4 cursor-help" style={{ color: '#606070' }} />
        </Tooltip>
      </div>

      {/* Visual pie representation using bars */}
      <div className="flex h-3 rounded-full overflow-hidden mb-4">
        {Object.entries(weights).map(([key, weight], i) => {
          const colors = ['#FF6B00', '#00FF88', '#00A8FF', '#FFD700', '#9B59B6', '#FF3366', '#00D9FF']
          return (
            <Tooltip key={key} content={`${key}: ${((weight / totalWeight) * 100).toFixed(1)}%`}>
              <div 
                className="h-full transition-all hover:brightness-125 cursor-help"
                style={{ width: `${(weight / totalWeight) * 100}%`, background: colors[i % colors.length] }}
              />
            </Tooltip>
          )
        })}
      </div>

      {/* Weight list */}
      <div className="grid grid-cols-2 gap-2">
        {Object.entries(weights).map(([key, weight], i) => {
          const colors = ['#FF6B00', '#00FF88', '#00A8FF', '#FFD700', '#9B59B6', '#FF3366', '#00D9FF']
          return (
            <Tooltip key={key} content={descriptions[key] || 'No description'}>
              <div className="flex items-center gap-2 p-2 rounded-lg cursor-help" style={{ background: 'rgba(255,255,255,0.02)' }}>
                <div className="w-2 h-2 rounded-full" style={{ background: colors[i % colors.length] }} />
                <span className="text-[10px] flex-1" style={{ color: '#A0A0B0' }}>{key}</span>
                <span className="text-xs font-bold" style={{ color: '#FFF' }}>
                  {((weight / totalWeight) * 100).toFixed(0)}%
                </span>
              </div>
            </Tooltip>
          )
        })}
      </div>
    </div>
  )
}
