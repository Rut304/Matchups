'use client'

import { BarChart3 } from 'lucide-react'
import type { BettingIntelligence } from '@/types/sports'

interface BettingMetricsProps {
  intelligence?: BettingIntelligence | null
  showLabels?: boolean
  compact?: boolean
}

export default function BettingMetrics({ intelligence, showLabels = true, compact = false }: BettingMetricsProps) {
  const metrics = [
    { 
      label: 'Line Movement', 
      value: intelligence?.lineMovement || '+0.0', 
      color: intelligence?.lineMovement?.startsWith('-') ? 'text-red-400' : 'text-green-400',
      tooltip: 'How much the line has moved since opening'
    },
    { 
      label: 'Public %', 
      value: `${intelligence?.publicPct || 52}%`,
      sub: intelligence?.publicPct && intelligence.publicPct > 50 ? 'AWAY' : 'HOME',
      color: 'text-white',
      tooltip: 'Percentage of bets on each side'
    },
    { 
      label: 'Sharp Action', 
      value: `${intelligence?.sharpPct || 55}%`,
      color: (intelligence?.sharpPct || 55) > 60 ? 'text-green-400' : 'text-white',
      tooltip: 'Professional bettor activity'
    },
    { 
      label: 'Handle %', 
      value: `${intelligence?.handlePct || 51}%`,
      color: 'text-white',
      tooltip: 'Percentage of money bet'
    },
  ]

  if (compact) {
    return (
      <div className="flex items-center gap-4 flex-wrap">
        {metrics.map((m) => (
          <div key={m.label} className="flex items-center gap-2">
            <span className="text-xs text-gray-500">{m.label}:</span>
            <span className={`text-sm font-bold ${m.color}`}>{m.value}</span>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="bg-[#0c0c14] rounded-xl border border-white/10 p-6">
      {showLabels && (
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-blue-400" />
          Key Betting Metrics
        </h3>
      )}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {metrics.map((m) => (
          <div 
            key={m.label} 
            className="bg-[#16161e] rounded-lg p-4 text-center group relative"
            title={m.tooltip}
          >
            <div className="text-xs text-gray-500 mb-2">{m.label}</div>
            <div className={`text-2xl font-bold ${m.color}`}>{m.value}</div>
            {m.sub && <div className="text-xs text-gray-500 mt-1">{m.sub}</div>}
          </div>
        ))}
      </div>
      
      {/* Reverse Line Movement Indicator */}
      {intelligence?.reverseLineMovement && (
        <div className="mt-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
          <div className="flex items-center gap-2">
            <span className="text-amber-400 text-sm font-semibold">⚠️ Reverse Line Movement Detected</span>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Line is moving opposite to public betting - sharp money may be on the other side.
          </p>
        </div>
      )}
      
      {/* Steam Moves */}
      {intelligence?.steamMoves && intelligence.steamMoves.length > 0 && (
        <div className="mt-4 space-y-2">
          <div className="text-xs text-gray-500 font-semibold uppercase">Recent Steam Moves</div>
          {intelligence.steamMoves.slice(0, 3).map((move, i) => (
            <div key={i} className="flex items-center justify-between text-sm p-2 bg-[#16161e] rounded">
              <span className="text-gray-400">{move.time}</span>
              <span className="text-white">
                {move.type === 'spread' ? 'Spread' : move.type === 'total' ? 'Total' : 'ML'}: 
                <span className="text-red-400 mx-1">{move.from}</span>→
                <span className="text-green-400 mx-1">{move.to}</span>
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
