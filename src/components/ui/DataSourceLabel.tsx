'use client'

/**
 * DataSourceLabel - Shows where data comes from
 * Every data point on the site should be attributed to its source.
 * "A blank page is better than a lying page."
 */

interface DataSourceLabelProps {
  source: string
  className?: string
  size?: 'xs' | 'sm'
}

export function DataSourceLabel({ source, className = '', size = 'xs' }: DataSourceLabelProps) {
  const sizeClasses = size === 'xs' 
    ? 'text-[10px] px-1.5 py-0.5' 
    : 'text-xs px-2 py-1'

  return (
    <span 
      className={`inline-flex items-center gap-1 rounded font-medium ${sizeClasses} ${className}`}
      style={{ 
        background: 'rgba(255,255,255,0.03)', 
        color: '#505060',
        border: '1px solid rgba(255,255,255,0.05)'
      }}
    >
      <svg width="8" height="8" viewBox="0 0 8 8" fill="none" className="opacity-50">
        <circle cx="4" cy="4" r="3" stroke="currentColor" strokeWidth="1" />
        <line x1="4" y1="2.5" x2="4" y2="4.5" stroke="currentColor" strokeWidth="1" />
        <circle cx="4" cy="5.5" r="0.3" fill="currentColor" />
      </svg>
      {source}
    </span>
  )
}

/**
 * Source mapping for the app:
 * - Game scores, standings, injuries, win probability → ESPN
 * - Odds, spreads, totals → Action Network → ESPN → Odds API cascade
 * - Betting splits, sharp money → Action Network
 * - AI analysis → Gemini
 * - Expert picks → X/Twitter scraper
 * - Line movement history → ESPN Pickcenter
 */
export const DATA_SOURCES = {
  ESPN: 'ESPN',
  ACTION_NETWORK: 'Action Network',
  ODDS_API: 'The Odds API',
  GEMINI: 'Gemini AI',
  X_SCRAPER: 'X/Twitter',
  ESPN_BPI: 'ESPN BPI',
  SUPABASE: 'Database',
} as const
