'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronRight, ChevronDown, ExternalLink } from 'lucide-react'

// =============================================================================
// SCROLLABLE LIST COMPONENT
// =============================================================================

interface ScrollableListProps<T> {
  items: T[]
  renderItem: (item: T, index: number) => React.ReactNode
  maxHeight?: string
  emptyMessage?: string
  showViewAll?: boolean
  viewAllHref?: string
  viewAllText?: string
}

export function ScrollableList<T>({
  items,
  renderItem,
  maxHeight = '300px',
  emptyMessage = 'No items to display',
  showViewAll = false,
  viewAllHref,
  viewAllText = 'View All',
}: ScrollableListProps<T>) {
  if (items.length === 0) {
    return (
      <div className="text-center py-4" style={{ color: '#606070' }}>
        {emptyMessage}
      </div>
    )
  }

  return (
    <div className="relative">
      <div 
        className="overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent"
        style={{ maxHeight }}
      >
        <div className="space-y-1">
          {items.map((item, index) => renderItem(item, index))}
        </div>
      </div>
      
      {showViewAll && viewAllHref && (
        <div className="pt-3 mt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <Link 
            href={viewAllHref}
            className="flex items-center justify-center gap-1 text-sm font-semibold transition-colors hover:opacity-80"
            style={{ color: '#00A8FF' }}
          >
            {viewAllText}
            <ChevronRight size={16} />
          </Link>
        </div>
      )}
    </div>
  )
}

// =============================================================================
// EXPANDABLE SECTION COMPONENT
// =============================================================================

interface ExpandableSectionProps {
  title: string
  icon?: React.ReactNode
  badge?: string
  badgeColor?: string
  children: React.ReactNode
  defaultExpanded?: boolean
  headerAction?: React.ReactNode
}

export function ExpandableSection({
  title,
  icon,
  badge,
  badgeColor = '#FF6B00',
  children,
  defaultExpanded = true,
  headerAction,
}: ExpandableSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)

  return (
    <div className="rounded-xl" style={{ background: 'rgba(255,255,255,0.02)' }}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-3 hover:bg-white/5 transition-colors rounded-xl"
      >
        <div className="flex items-center gap-2">
          {icon}
          <span className="font-semibold text-sm" style={{ color: '#FFF' }}>{title}</span>
          {badge && (
            <span 
              className="text-xs px-1.5 py-0.5 rounded font-semibold"
              style={{ background: `${badgeColor}20`, color: badgeColor }}
            >
              {badge}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {headerAction}
          <ChevronDown 
            size={16} 
            style={{ 
              color: '#606070',
              transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s'
            }} 
          />
        </div>
      </button>
      
      {isExpanded && (
        <div className="px-3 pb-3">
          {children}
        </div>
      )}
    </div>
  )
}

// =============================================================================
// STANDINGS ROW (Clickable for drill-down)
// =============================================================================

interface StandingsRowProps {
  rank: number
  team: string
  teamFull?: string
  record: string
  extra?: string
  isHighlighted?: boolean
  highlightColor?: string
  href?: string
  sport: string
}

export function StandingsRow({
  rank,
  team,
  teamFull,
  record,
  extra,
  isHighlighted = false,
  highlightColor = '#FF6B00',
  href,
  sport,
}: StandingsRowProps) {
  const content = (
    <div 
      className={`flex items-center justify-between py-1.5 px-2 rounded transition-colors ${href ? 'hover:bg-white/10 cursor-pointer' : ''}`}
      style={{ background: isHighlighted ? `${highlightColor}15` : 'transparent' }}
    >
      <div className="flex items-center gap-2">
        <span className="w-4 text-xs text-center" style={{ color: '#606070' }}>{rank}</span>
        <span className="font-semibold" style={{ color: '#FFF' }} title={teamFull}>{team}</span>
      </div>
      <div className="flex items-center gap-3 text-xs">
        <span style={{ color: '#A0A0B0' }}>{record}</span>
        {extra && <span style={{ color: '#606070' }}>{extra}</span>}
        {href && <ChevronRight size={12} style={{ color: '#606070' }} />}
      </div>
    </div>
  )

  if (href) {
    return <Link href={href}>{content}</Link>
  }

  return content
}

// =============================================================================
// INJURY ROW (with status badge)
// =============================================================================

interface InjuryRowProps {
  player: string
  team: string
  injury: string
  status: string
  impact?: 'high' | 'medium' | 'low'
  href?: string
}

export function InjuryRow({
  player,
  team,
  injury,
  status,
  impact = 'medium',
  href,
}: InjuryRowProps) {
  const statusColors: Record<string, { bg: string; text: string }> = {
    'O': { bg: 'rgba(255,68,85,0.2)', text: '#FF4455' },
    'OUT': { bg: 'rgba(255,68,85,0.2)', text: '#FF4455' },
    'D': { bg: 'rgba(255,107,0,0.2)', text: '#FF6B00' },
    'DOUBTFUL': { bg: 'rgba(255,107,0,0.2)', text: '#FF6B00' },
    'Q': { bg: 'rgba(255,170,0,0.2)', text: '#FFAA00' },
    'QUESTIONABLE': { bg: 'rgba(255,170,0,0.2)', text: '#FFAA00' },
    'P': { bg: 'rgba(0,255,136,0.2)', text: '#00FF88' },
    'PROBABLE': { bg: 'rgba(0,255,136,0.2)', text: '#00FF88' },
    'IR': { bg: 'rgba(255,68,85,0.2)', text: '#FF4455' },
    'DAY-TO-DAY': { bg: 'rgba(255,170,0,0.2)', text: '#FFAA00' },
  }

  const colors = statusColors[status] || statusColors['Q']

  const content = (
    <div className={`flex items-center justify-between py-2 ${href ? 'hover:bg-white/5 cursor-pointer' : ''}`}>
      <div>
        <div className="font-semibold text-sm" style={{ color: '#FFF' }}>{player}</div>
        <div className="text-xs" style={{ color: '#606070' }}>{team} • {injury}</div>
      </div>
      <span 
        className="w-6 h-6 rounded flex items-center justify-center text-xs font-bold"
        style={{ background: colors.bg, color: colors.text }}
      >
        {status.charAt(0)}
      </span>
    </div>
  )

  if (href) {
    return <Link href={href}>{content}</Link>
  }

  return content
}

// =============================================================================
// TREND ROW
// =============================================================================

interface TrendRowProps {
  sport: string
  title: string
  record: string
  edge: string
  winPct: number
  href?: string
}

export function TrendRow({
  sport,
  title,
  record,
  edge,
  winPct,
  href,
}: TrendRowProps) {
  const sportColors: Record<string, string> = {
    'NFL': '#FF6B00',
    'NBA': '#00A8FF',
    'NHL': '#FF3366',
    'MLB': '#00FF88',
    'nfl': '#FF6B00',
    'nba': '#00A8FF',
    'nhl': '#FF3366',
    'mlb': '#00FF88',
  }

  const color = sportColors[sport] || '#FF6B00'

  const content = (
    <div className={`p-3 rounded-lg ${href ? 'hover:bg-white/5 cursor-pointer' : ''}`} style={{ background: 'rgba(255,255,255,0.02)' }}>
      <div className="flex items-center justify-between mb-1">
        <span 
          className="text-xs px-1.5 py-0.5 rounded font-semibold"
          style={{ background: `${color}20`, color }}
        >
          {sport.toUpperCase()}
        </span>
        <span className="text-lg font-black" style={{ color: '#00FF88' }}>{edge}</span>
      </div>
      <div className="text-sm" style={{ color: '#A0A0B0' }}>{title}</div>
      <div className="flex items-center gap-2 mt-2">
        <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
          <div className="h-full rounded-full" style={{ width: `${winPct}%`, background: '#00FF88' }} />
        </div>
        <span className="text-xs font-mono" style={{ color: '#00FF88' }}>{record}</span>
      </div>
    </div>
  )

  if (href) {
    return <Link href={href}>{content}</Link>
  }

  return content
}

// =============================================================================
// STAT LEADER ROW
// =============================================================================

interface StatLeaderRowProps {
  rank: number
  name: string
  team: string
  value: string | number
  label: string
  photo?: string
  href?: string
}

export function StatLeaderRow({
  rank,
  name,
  team,
  value,
  label,
  photo,
  href,
}: StatLeaderRowProps) {
  const content = (
    <div className={`flex items-center gap-3 py-2 ${href ? 'hover:bg-white/5 cursor-pointer' : ''}`}>
      <span className="w-5 text-center text-sm font-bold" style={{ color: rank <= 3 ? '#FFD700' : '#606070' }}>
        {rank}
      </span>
      {photo ? (
        <img src={photo} alt={name} className="w-8 h-8 rounded-full object-cover" />
      ) : (
        <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold" style={{ background: 'rgba(255,255,255,0.1)', color: '#FFF' }}>
          {name.charAt(0)}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-sm truncate" style={{ color: '#FFF' }}>{name}</div>
        <div className="text-xs" style={{ color: '#606070' }}>{team}</div>
      </div>
      <div className="text-right">
        <div className="font-bold" style={{ color: '#00FF88' }}>{value}</div>
        <div className="text-xs" style={{ color: '#606070' }}>{label}</div>
      </div>
    </div>
  )

  if (href) {
    return <Link href={href}>{content}</Link>
  }

  return content
}

// =============================================================================
// SIDEBAR CARD WRAPPER
// =============================================================================

interface SidebarCardProps {
  title: string
  icon?: React.ReactNode
  iconColor?: string
  viewAllHref?: string
  viewAllText?: string
  children: React.ReactNode
}

export function SidebarCard({
  title,
  icon,
  iconColor = '#FFF',
  viewAllHref,
  viewAllText = 'View All',
  children,
}: SidebarCardProps) {
  return (
    <div className="rounded-2xl p-5" style={{ background: '#0c0c14', border: '1px solid rgba(255,255,255,0.06)' }}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {icon && <span style={{ color: iconColor }}>{icon}</span>}
          <h3 className="font-bold" style={{ color: '#FFF' }}>{title}</h3>
        </div>
        {viewAllHref && (
          <Link href={viewAllHref} className="text-xs font-semibold" style={{ color: '#00A8FF' }}>
            {viewAllText}
          </Link>
        )}
      </div>
      {children}
    </div>
  )
}
