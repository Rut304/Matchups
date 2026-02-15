'use client'

import { Zap, Flame, Shuffle, Target } from 'lucide-react'

// =============================================================================
// Sharp Signal Badge Component
// 
// Reusable compact badge for displaying sharp betting signals across the site.
// Used in matchup pages, dashboards, and game cards.
// 
// Types:
//   - 'sharp'      → Purple badge with Zap icon (sharp money detected)
//   - 'steam'      → Red badge with Flame icon (steam move / rapid line movement)
//   - 'reverse'    → Yellow badge with Shuffle icon (reverse line movement)
//   - 'contrarian' → Blue badge with Target icon (contrarian play)
// =============================================================================

export type SignalType = 'sharp' | 'steam' | 'reverse' | 'contrarian'

interface SharpSignalBadgeProps {
  label: string
  type: SignalType
  confidence: number // 0-100
}

const SIGNAL_CONFIG: Record<SignalType, {
  icon: typeof Zap
  bgClass: string
  textClass: string
  borderClass: string
  barColor: string
}> = {
  sharp: {
    icon: Zap,
    bgClass: 'bg-purple-500/15',
    textClass: 'text-purple-400',
    borderClass: 'border-purple-500/30',
    barColor: 'bg-purple-500',
  },
  steam: {
    icon: Flame,
    bgClass: 'bg-red-500/15',
    textClass: 'text-red-400',
    borderClass: 'border-red-500/30',
    barColor: 'bg-red-500',
  },
  reverse: {
    icon: Shuffle,
    bgClass: 'bg-yellow-500/15',
    textClass: 'text-yellow-400',
    borderClass: 'border-yellow-500/30',
    barColor: 'bg-yellow-500',
  },
  contrarian: {
    icon: Target,
    bgClass: 'bg-blue-500/15',
    textClass: 'text-blue-400',
    borderClass: 'border-blue-500/30',
    barColor: 'bg-blue-500',
  },
}

export function SharpSignalBadge({ label, type, confidence }: SharpSignalBadgeProps) {
  const config = SIGNAL_CONFIG[type]
  const Icon = config.icon
  const clampedConfidence = Math.min(100, Math.max(0, confidence))

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border ${config.bgClass} ${config.borderClass}`}
    >
      <Icon className={`w-3.5 h-3.5 ${config.textClass} flex-shrink-0`} />
      <span className={`text-xs font-semibold ${config.textClass} whitespace-nowrap`}>
        {label}
      </span>
      {/* Confidence mini-bar */}
      <div className="w-8 h-1.5 bg-slate-700 rounded-full overflow-hidden ml-1" title={`${clampedConfidence}% confidence`}>
        <div
          className={`h-full ${config.barColor} rounded-full transition-all duration-300`}
          style={{ width: `${clampedConfidence}%` }}
        />
      </div>
    </div>
  )
}

export default SharpSignalBadge
