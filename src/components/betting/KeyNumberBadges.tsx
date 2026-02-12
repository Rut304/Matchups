'use client'

import { AlertTriangle, Target, TrendingUp } from 'lucide-react'

// =============================================================================
// KEY NUMBER ALERTS
// NFL key numbers: 3 (14.5% of games), 7 (9.5%), 10 (5.5%), 6 (5%), 14 (4%)
// NBA key numbers: Less significant, but 5-7 point margins common
// Shows when a spread crosses or is near a key number
// =============================================================================

const NFL_KEY_NUMBERS = [
  { number: 3, significance: 'critical', description: 'Most common NFL margin (14.5% of games)' },
  { number: 7, significance: 'critical', description: 'Second most common margin (9.6% of games)' },
  { number: 10, significance: 'high', description: 'TD + FG margin (5.5% of games)' },
  { number: 6, significance: 'medium', description: 'Two FG margin (5.0% of games)' },
  { number: 14, significance: 'medium', description: 'Two TD margin (4.0% of games)' },
  { number: 1, significance: 'medium', description: 'Single-point margin (4.8% of games)' },
  { number: 4, significance: 'low', description: 'One-possession + safety' },
]

const NFL_KEY_TOTALS = [
  { number: 41, significance: 'high', description: 'Common NFL total threshold' },
  { number: 43, significance: 'high', description: 'Average NFL total (modern era)' },
  { number: 44, significance: 'medium', description: 'Above-average scoring environment' },
  { number: 47, significance: 'medium', description: 'High-scoring threshold' },
]

interface KeyNumberAlert {
  type: 'spread' | 'total'
  number: number
  currentLine: number
  proximity: number       // How close to key number (0 = exact)
  significance: string
  description: string
  actionableInsight: string
}

function getSpreadAlerts(spread: number, sport: string): KeyNumberAlert[] {
  if (sport !== 'NFL' && sport !== 'NCAAF') return []
  
  const alerts: KeyNumberAlert[] = []
  const absSpread = Math.abs(spread)
  
  for (const kn of NFL_KEY_NUMBERS) {
    const proximity = Math.abs(absSpread - kn.number)
    
    if (proximity <= 0.5) {
      let actionableInsight = ''
      
      if (proximity === 0) {
        actionableInsight = `Spread is EXACTLY on ${kn.number}. ` + (
          kn.number === 3 ? 'Consider buying the half point — high push frequency on 3.' :
          kn.number === 7 ? 'Key number — buying off 7 is historically profitable.' :
          `Key number ${kn.number} is a common margin of victory.`
        )
      } else if (absSpread > kn.number) {
        actionableInsight = `Spread ${proximity} points above key number ${kn.number}. ` + (
          kn.number === 3 ? 'If you like the favorite, buy to -3 — huge value crossing below 3.' :
          kn.number === 7 ? 'Buying down through 7 adds ~3% win probability.' :
          `Consider line value near ${kn.number}.`
        )
      } else {
        actionableInsight = `Spread ${proximity} points below key number ${kn.number}. ` + (
          kn.number === 3 ? 'Dog bettors: avoid buying through 3 — you want to land on it.' :
          kn.number === 7 ? 'Close to 7 — monitor for any move through this key number.' :
          `Near key number ${kn.number} — watch for movement.`
        )
      }
      
      alerts.push({
        type: 'spread',
        number: kn.number,
        currentLine: spread,
        proximity,
        significance: kn.significance,
        description: kn.description,
        actionableInsight,
      })
    }
  }
  
  return alerts.sort((a, b) => a.proximity - b.proximity)
}

function getTotalAlerts(total: number, sport: string): KeyNumberAlert[] {
  if (sport !== 'NFL' && sport !== 'NCAAF') return []
  
  const alerts: KeyNumberAlert[] = []
  
  for (const kn of NFL_KEY_TOTALS) {
    const proximity = Math.abs(total - kn.number)
    
    if (proximity <= 1) {
      alerts.push({
        type: 'total',
        number: kn.number,
        currentLine: total,
        proximity,
        significance: kn.significance,
        description: kn.description,
        actionableInsight: proximity === 0 
          ? `Total sits exactly on ${kn.number}. ${kn.description}`
          : `Total within ${proximity} of key threshold ${kn.number}.`,
      })
    }
  }
  
  return alerts
}

interface KeyNumberBadgesProps {
  spread?: number
  total?: number
  sport: string
  compact?: boolean
}

export function KeyNumberBadges({ spread, total, sport, compact = false }: KeyNumberBadgesProps) {
  const spreadAlerts = spread != null ? getSpreadAlerts(spread, sport) : []
  const totalAlerts = total != null ? getTotalAlerts(total, sport) : []
  const allAlerts = [...spreadAlerts, ...totalAlerts]
  
  if (allAlerts.length === 0) return null
  
  if (compact) {
    // Just show badges inline
    return (
      <div className="flex flex-wrap gap-1">
        {allAlerts.slice(0, 2).map((alert, i) => (
          <span
            key={i}
            className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold ${
              alert.significance === 'critical' ? 'bg-red-500/20 text-red-400' :
              alert.significance === 'high' ? 'bg-amber-500/20 text-amber-400' :
              'bg-blue-500/20 text-blue-400'
            }`}
          >
            <Target className="w-2.5 h-2.5" />
            Key #{alert.number}
          </span>
        ))}
      </div>
    )
  }
  
  // Full display with explanations
  return (
    <div className="space-y-2">
      {allAlerts.map((alert, i) => (
        <div 
          key={i}
          className={`flex items-start gap-2 p-2 rounded-lg text-xs ${
            alert.significance === 'critical' ? 'bg-red-500/10 border border-red-500/20' :
            alert.significance === 'high' ? 'bg-amber-500/10 border border-amber-500/20' :
            'bg-slate-800/50 border border-slate-700'
          }`}
        >
          <div className="flex-shrink-0 mt-0.5">
            {alert.significance === 'critical' ? (
              <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
            ) : alert.significance === 'high' ? (
              <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
            ) : (
              <Target className="w-3.5 h-3.5 text-blue-400" />
            )}
          </div>
          <div>
            <p className={`font-semibold ${
              alert.significance === 'critical' ? 'text-red-400' :
              alert.significance === 'high' ? 'text-amber-400' :
              'text-blue-400'
            }`}>
              {alert.type === 'spread' ? 'Spread' : 'Total'} near key number {alert.number}
              {alert.proximity === 0 && ' ✦'}
            </p>
            <p className="text-slate-400 mt-0.5">{alert.actionableInsight}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
