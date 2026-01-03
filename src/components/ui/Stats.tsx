import { cn } from '@/lib/utils'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface StatCardProps {
  label: string
  value: string | number
  change?: number
  trend?: 'up' | 'down' | 'stable'
  format?: 'number' | 'percentage' | 'odds' | 'record'
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function StatCard({
  label,
  value,
  change,
  trend,
  format = 'number',
  size = 'md',
  className,
}: StatCardProps) {
  const formattedValue = formatValue(value, format)
  
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus

  return (
    <div
      className={cn(
        'stat-card bg-background-secondary rounded-xl border border-border p-4',
        className
      )}
    >
      <p className={cn(
        'text-text-muted uppercase tracking-wide font-medium',
        size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-sm' : 'text-xs'
      )}>
        {label}
      </p>
      <div className="flex items-end justify-between mt-1">
        <p className={cn(
          'font-bold text-text-primary font-mono',
          size === 'sm' ? 'text-lg' : size === 'lg' ? 'text-3xl' : 'text-2xl'
        )}>
          {formattedValue}
        </p>
        {(change !== undefined || trend) && (
          <div className={cn(
            'flex items-center gap-1 text-sm font-medium',
            trend === 'up' ? 'text-win' : trend === 'down' ? 'text-loss' : 'text-text-muted'
          )}>
            {trend && <TrendIcon className="w-4 h-4" />}
            {change !== undefined && (
              <span>
                {change > 0 ? '+' : ''}{change}%
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function formatValue(value: string | number, format: string): string {
  if (typeof value === 'string') return value
  
  switch (format) {
    case 'percentage':
      return `${value}%`
    case 'odds':
      return value >= 0 ? `+${value}` : `${value}`
    case 'record':
      return value.toString()
    default:
      return value.toLocaleString()
  }
}

interface OddsBadgeProps {
  odds?: number
  value?: number
  prefix?: string
  movement?: number
  className?: string
}

export function OddsBadge({ odds, value, prefix = '', movement, className }: OddsBadgeProps) {
  const displayValue = value ?? odds ?? 0
  const isPositive = displayValue > 0 && !prefix
  const formattedValue = prefix ? `${prefix}${displayValue}` : (isPositive ? `+${displayValue}` : displayValue.toString())

  return (
    <div className="flex flex-col items-center">
      <span
        className={cn(
          'font-mono font-semibold text-sm',
          isPositive ? 'text-win' : displayValue < 0 ? 'text-loss' : 'text-text-primary',
          className
        )}
      >
        {formattedValue}
      </span>
      {movement !== undefined && movement !== 0 && (
        <span className={cn(
          'text-xs flex items-center gap-0.5',
          movement > 0 ? 'text-win' : 'text-loss'
        )}>
          {movement > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {Math.abs(movement)}
        </span>
      )}
    </div>
  )
}

interface TrendBadgeProps {
  value: number
  suffix?: string
  className?: string
}

export function TrendBadge({ value, suffix = '', className }: TrendBadgeProps) {
  const isPositive = value > 0
  const isNegative = value < 0

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 text-sm font-medium',
        isPositive && 'text-win',
        isNegative && 'text-loss',
        !isPositive && !isNegative && 'text-text-muted',
        className
      )}
    >
      {isPositive && <TrendingUp className="w-3 h-3" />}
      {isNegative && <TrendingDown className="w-3 h-3" />}
      {isPositive && '+'}{value}{suffix}
    </span>
  )
}

interface RecordBadgeProps {
  wins: number
  losses: number
  ties?: number
  label?: string
  className?: string
}

export function RecordBadge({ wins, losses, ties, label, className }: RecordBadgeProps) {
  const total = wins + losses + (ties || 0)
  const winPct = total > 0 ? ((wins / total) * 100).toFixed(1) : '0.0'

  return (
    <div className={cn('text-center', className)}>
      {label && (
        <p className="text-xs text-text-muted uppercase tracking-wide mb-1">{label}</p>
      )}
      <p className="font-mono font-bold text-text-primary">
        {wins}-{losses}{ties !== undefined && ties > 0 && `-${ties}`}
      </p>
      <p className="text-xs text-text-secondary">{winPct}%</p>
    </div>
  )
}
