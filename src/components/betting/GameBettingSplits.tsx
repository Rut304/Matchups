'use client'

/**
 * GameBettingSplits Component
 * 
 * Displays real betting splits data for a specific game.
 * Shows ticket % vs money % to identify sharp vs public money.
 * 
 * Key Features:
 * - Visual bars showing ticket % vs money %
 * - Sharp money detection when money diverges from tickets
 * - Highlights reverse line movement situations
 * - Clean, professional UI that gamblers will love
 */

import { useState, useEffect } from 'react'
import { 
  Users, 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle,
  RefreshCw,
  Zap,
  Target,
  Info,
  ChevronDown,
  ChevronUp
} from 'lucide-react'

// =============================================================================
// TYPES
// =============================================================================

interface BettingSplit {
  gameId: string
  sport: string
  homeTeam: string
  awayTeam: string
  gameTime: string
  spread: {
    homeBetPct: number
    awayBetPct: number
    homeMoneyPct: number
    awayMoneyPct: number
    line: number
  }
  moneyline: {
    homeBetPct: number
    awayBetPct: number
    homeMoneyPct: number
    awayMoneyPct: number
    homeOdds: number
    awayOdds: number
  }
  total: {
    overBetPct: number
    underBetPct: number
    overMoneyPct: number
    underMoneyPct: number
    line: number
  }
  source: string
  fetchedAt: string
}

interface SharpSignal {
  gameId: string
  betType: string
  publicSide: string
  publicPct: number
  moneyPct: number
  sharpSide: string
  confidence: string
  signal: string
}

interface GameBettingSplitsProps {
  gameId: string
  sport: string
  homeTeam: string
  awayTeam: string
  homeAbbr?: string
  awayAbbr?: string
  compact?: boolean
  showTitle?: boolean
}

// =============================================================================
// HELPER COMPONENTS
// =============================================================================

function SplitBar({ 
  leftPct, 
  rightPct, 
  leftLabel, 
  rightLabel,
  leftColor = 'bg-blue-500',
  rightColor = 'bg-slate-600',
  isSharpLeft = false,
  isSharpRight = false
}: { 
  leftPct: number
  rightPct: number
  leftLabel: string
  rightLabel: string
  leftColor?: string
  rightColor?: string
  isSharpLeft?: boolean
  isSharpRight?: boolean
}) {
  // Ensure percentages add up to 100
  const normalizedLeft = Math.min(100, Math.max(0, leftPct))
  const normalizedRight = 100 - normalizedLeft

  return (
    <div className="flex items-center gap-3">
      {/* Left Side */}
      <div className={`flex-1 text-right ${isSharpLeft ? 'text-purple-400' : 'text-slate-300'}`}>
        <span className="text-lg font-bold">{leftPct}%</span>
        <span className="text-xs text-slate-500 ml-1">{leftLabel.split(' ')[0]}</span>
        {isSharpLeft && <Zap className="inline w-3 h-3 ml-1 text-purple-400" />}
      </div>
      
      {/* Visual Bar - More compact */}
      <div className="w-32 h-2 bg-slate-800 rounded-full overflow-hidden flex">
        <div 
          className={`h-full ${isSharpLeft ? 'bg-purple-500' : leftColor} transition-all duration-500`}
          style={{ width: `${normalizedLeft}%` }}
        />
        <div 
          className={`h-full ${isSharpRight ? 'bg-purple-500' : rightColor} transition-all duration-500`}
          style={{ width: `${normalizedRight}%` }}
        />
      </div>
      
      {/* Right Side */}
      <div className={`flex-1 text-left ${isSharpRight ? 'text-purple-400' : 'text-slate-300'}`}>
        {isSharpRight && <Zap className="inline w-3 h-3 mr-1 text-purple-400" />}
        <span className="text-lg font-bold">{rightPct}%</span>
        <span className="text-xs text-slate-500 ml-1">{rightLabel.split(' ')[0]}</span>
      </div>
    </div>
  )
}

function TicketMoneyDisplay({
  ticketPct,
  moneyPct,
  label,
  isSharp = false
}: {
  ticketPct: number
  moneyPct: number
  label: string
  isSharp?: boolean
}) {
  const diff = moneyPct - ticketPct
  const showDiff = Math.abs(diff) >= 5

  return (
    <div className={`text-center p-3 rounded-lg ${isSharp ? 'bg-purple-500/10 border border-purple-500/30' : 'bg-slate-800/50'}`}>
      <div className="text-xs text-slate-500 mb-1">{label}</div>
      <div className="flex items-center justify-center gap-3">
        <div className="flex items-center gap-1">
          <Users className="w-3 h-3 text-blue-400" />
          <span className="text-lg font-bold text-blue-400">{ticketPct}%</span>
        </div>
        <div className="text-slate-600">|</div>
        <div className="flex items-center gap-1">
          <DollarSign className={`w-3 h-3 ${isSharp ? 'text-purple-400' : 'text-green-400'}`} />
          <span className={`text-lg font-bold ${isSharp ? 'text-purple-400' : 'text-green-400'}`}>{moneyPct}%</span>
        </div>
      </div>
      {showDiff && (
        <div className={`text-xs mt-1 ${diff > 0 ? 'text-purple-400' : 'text-slate-500'}`}>
          {diff > 0 ? '+' : ''}{diff}% money vs tickets
        </div>
      )}
      {isSharp && (
        <div className="flex items-center justify-center gap-1 mt-1 text-xs text-purple-400">
          <Zap className="w-3 h-3" />
          Sharp Money
        </div>
      )}
    </div>
  )
}

function BetTypeSection({
  title,
  icon,
  leftTeam,
  rightTeam,
  leftTickets,
  rightTickets,
  leftMoney,
  rightMoney,
  line,
  compact = false
}: {
  title: string
  icon: React.ReactNode
  leftTeam: string
  rightTeam: string
  leftTickets: number
  rightTickets: number
  leftMoney: number
  rightMoney: number
  line?: string
  compact?: boolean
}) {
  // Determine if there's sharp money (money % significantly higher than tickets %)
  const leftSharp = leftMoney - leftTickets >= 10
  const rightSharp = rightMoney - rightTickets >= 10
  const hasSharpSignal = leftSharp || rightSharp

  if (compact) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {icon}
            <span className="text-sm font-medium text-white">{title}</span>
            {line && <span className="text-xs text-slate-500">({line})</span>}
          </div>
          {hasSharpSignal && (
            <span className="flex items-center gap-1 text-xs text-purple-400">
              <Zap className="w-3 h-3" />
              Sharp: {leftSharp ? leftTeam : rightTeam}
            </span>
          )}
        </div>
        <SplitBar
          leftPct={leftTickets}
          rightPct={rightTickets}
          leftLabel={`${leftTeam}`}
          rightLabel={`${rightTeam}`}
          isSharpLeft={leftSharp}
          isSharpRight={rightSharp}
        />
      </div>
    )
  }

  // Card-based vertical layout - two columns showing each side
  return (
    <div className="bg-slate-800/30 rounded-lg p-3 border border-slate-700/50">
      {/* Header Row */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {icon}
          <span className="font-semibold text-white text-sm">{title}</span>
          {line && <span className="text-xs text-slate-500">({line})</span>}
        </div>
        {hasSharpSignal && (
          <span className="flex items-center gap-1 text-xs text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded">
            <Zap className="w-3 h-3" />
            Sharp on {leftSharp ? leftTeam : rightTeam}
          </span>
        )}
      </div>
      
      {/* Two Column Stats */}
      <div className="grid grid-cols-2 gap-3">
        {/* Left Team */}
        <div className={`p-2 rounded ${leftSharp ? 'bg-purple-500/10 border border-purple-500/30' : 'bg-slate-900/50'}`}>
          <div className="text-sm font-bold text-white mb-1">{leftTeam}</div>
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3 text-blue-400" />
              <span className={leftSharp ? 'text-purple-400 font-bold' : 'text-slate-300'}>{leftTickets}%</span>
            </span>
            <span className="flex items-center gap-1">
              <DollarSign className="w-3 h-3 text-green-400" />
              <span className={leftSharp ? 'text-purple-400 font-bold' : 'text-slate-300'}>{leftMoney}%</span>
            </span>
            {leftSharp && <Zap className="w-3 h-3 text-purple-400" />}
          </div>
        </div>
        
        {/* Right Team */}
        <div className={`p-2 rounded ${rightSharp ? 'bg-purple-500/10 border border-purple-500/30' : 'bg-slate-900/50'}`}>
          <div className="text-sm font-bold text-white mb-1">{rightTeam}</div>
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3 text-blue-400" />
              <span className={rightSharp ? 'text-purple-400 font-bold' : 'text-slate-300'}>{rightTickets}%</span>
            </span>
            <span className="flex items-center gap-1">
              <DollarSign className="w-3 h-3 text-green-400" />
              <span className={rightSharp ? 'text-purple-400 font-bold' : 'text-slate-300'}>{rightMoney}%</span>
            </span>
            {rightSharp && <Zap className="w-3 h-3 text-purple-400" />}
          </div>
        </div>
      </div>
    </div>
  )
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function GameBettingSplits({
  gameId,
  sport,
  homeTeam,
  awayTeam,
  homeAbbr,
  awayAbbr,
  compact = false,
  showTitle = true
}: GameBettingSplitsProps) {
  const [splits, setSplits] = useState<BettingSplit | null>(null)
  const [sharpSignals, setSharpSignals] = useState<SharpSignal[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isExpanded, setIsExpanded] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)

  // Use abbreviations if provided, otherwise extract from team names
  const homeLabel = homeAbbr || homeTeam.split(' ').pop() || homeTeam
  const awayLabel = awayAbbr || awayTeam.split(' ').pop() || awayTeam

  useEffect(() => {
    const fetchSplits = async () => {
      setLoading(true)
      setError(null)

      try {
        // Fetch today's splits for the sport
        const res = await fetch(`/api/betting-splits?sport=${sport}`)
        
        if (!res.ok) {
          throw new Error('Failed to fetch betting splits')
        }

        const data = await res.json()
        
        if (data.success && data.data.splits.length > 0) {
          // Try to match the game by team names
          const matchedSplit = data.data.splits.find((s: BettingSplit) => {
            const homeMatch = s.homeTeam.toLowerCase().includes(homeTeam.toLowerCase()) ||
                             homeTeam.toLowerCase().includes(s.homeTeam.toLowerCase()) ||
                             s.homeTeam.toLowerCase().includes(homeLabel.toLowerCase())
            const awayMatch = s.awayTeam.toLowerCase().includes(awayTeam.toLowerCase()) ||
                             awayTeam.toLowerCase().includes(s.awayTeam.toLowerCase()) ||
                             s.awayTeam.toLowerCase().includes(awayLabel.toLowerCase())
            return homeMatch && awayMatch
          })

          if (matchedSplit) {
            setSplits(matchedSplit)
            // Filter sharp signals for this game
            const gameSignals = data.data.sharpSignals.filter(
              (sig: SharpSignal) => sig.gameId === matchedSplit.gameId
            )
            setSharpSignals(gameSignals)
          } else {
            // No matching game found in today's data
            setSplits(null)
          }
          setLastUpdated(data.data.lastUpdated)
        } else {
          setSplits(null)
        }
      } catch (err) {
        console.error('Error fetching betting splits:', err)
        setError(err instanceof Error ? err.message : 'Failed to load')
      } finally {
        setLoading(false)
      }
    }

    fetchSplits()
    
    // Refresh every 2 minutes
    const interval = setInterval(fetchSplits, 120000)
    return () => clearInterval(interval)
  }, [sport, homeTeam, awayTeam, homeLabel, awayLabel])

  // Loading state
  if (loading) {
    return (
      <div className={`bg-slate-900/50 rounded-xl ${compact ? 'p-3' : 'p-6'} border border-slate-800`}>
        <div className="flex items-center justify-center gap-3 py-4">
          <RefreshCw className="w-5 h-5 text-orange-500 animate-spin" />
          <span className="text-slate-400">Loading betting splits...</span>
        </div>
      </div>
    )
  }

  // No data state
  if (!splits) {
    return (
      <div className={`bg-slate-900/50 rounded-xl ${compact ? 'p-3' : 'p-6'} border border-slate-800`}>
        {showTitle && (
          <div className="flex items-center gap-2 mb-3">
            <Target className="w-5 h-5 text-orange-500" />
            <h3 className="font-semibold text-white">Public Betting Splits</h3>
          </div>
        )}
        <div className="text-center py-4">
          <Info className="w-8 h-8 text-slate-600 mx-auto mb-2" />
          <p className="text-sm text-slate-500">
            {error || 'No betting data available for this game'}
          </p>
          <p className="text-xs text-slate-600 mt-1">
            Data updates closer to game time
          </p>
        </div>
      </div>
    )
  }

  // Compact view
  if (compact && !isExpanded) {
    // Find the most significant sharp signal
    const topSignal = sharpSignals[0]
    
    return (
      <div 
        className="bg-slate-900/50 rounded-xl p-4 border border-slate-800 cursor-pointer hover:border-slate-700 transition-colors"
        onClick={() => setIsExpanded(true)}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-orange-500" />
            <span className="text-sm font-semibold text-white">Betting Splits</span>
          </div>
          <ChevronDown className="w-4 h-4 text-slate-500" />
        </div>
        
        {/* Quick Summary */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <div className="text-xs text-slate-500">Spread</div>
            <div className="text-sm font-bold text-white">{splits.spread.homeBetPct}% - {splits.spread.awayBetPct}%</div>
          </div>
          <div>
            <div className="text-xs text-slate-500">ML</div>
            <div className="text-sm font-bold text-white">{splits.moneyline.homeBetPct}% - {splits.moneyline.awayBetPct}%</div>
          </div>
          <div>
            <div className="text-xs text-slate-500">Total</div>
            <div className="text-sm font-bold text-white">{splits.total.overBetPct}% - {splits.total.underBetPct}%</div>
          </div>
        </div>
        
        {topSignal && (
          <div className="mt-3 flex items-center gap-2 px-2 py-1.5 bg-purple-500/10 border border-purple-500/30 rounded">
            <Zap className="w-3 h-3 text-purple-400" />
            <span className="text-xs text-purple-300 truncate">{topSignal.signal}</span>
          </div>
        )}
      </div>
    )
  }

  // Full expanded view
  return (
    <div className={`bg-slate-900/50 rounded-xl ${compact ? 'p-3' : 'p-5'} border border-slate-800 mb-4`}>
      {/* Header - More Compact */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-orange-500" />
          <h3 className="font-semibold text-white">Public Betting Splits</h3>
          <span className="text-xs px-2 py-0.5 bg-green-500/20 text-green-400 rounded">LIVE</span>
          <div className="group relative">
            <Info className="w-4 h-4 text-slate-500 cursor-help" />
            <div className="invisible group-hover:visible absolute bottom-full left-0 mb-2 w-72 p-3 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-300 z-10 shadow-xl">
              <p className="font-semibold text-white mb-1">What are Betting Splits?</p>
              <p className="mb-2">Shows where the public is betting (# of bets) vs where the money is going ($ handle).</p>
              <p><span className="text-purple-400 font-medium">Sharp Money</span> = When money % differs significantly from ticket %. This often indicates professional bettors taking a side.</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {lastUpdated && (
            <span className="text-xs text-slate-500">
              Updated {new Date(lastUpdated).toLocaleTimeString()}
            </span>
          )}
          {compact && (
            <button 
              onClick={() => setIsExpanded(false)}
              className="p-1 hover:bg-slate-800 rounded"
              title="Collapse betting splits"
              aria-label="Collapse betting splits"
            >
              <ChevronUp className="w-4 h-4 text-slate-500" />
            </button>
          )}
        </div>
      </div>

      {/* Legend - Single Line */}
      <div className="flex items-center gap-4 mb-3 text-xs text-slate-500">
        <span className="flex items-center gap-1"><Users className="w-3 h-3 text-blue-400" /> Tickets = # of bets</span>
        <span className="flex items-center gap-1"><DollarSign className="w-3 h-3 text-green-400" /> Money = $ wagered</span>
        <span className="flex items-center gap-1"><Zap className="w-3 h-3 text-purple-400" /> Sharp = money diverges from tickets</span>
      </div>

      {/* Spread Section */}
      <div className="space-y-2">
        <BetTypeSection
          title="Spread"
          icon={<TrendingUp className="w-4 h-4 text-orange-500" />}
          leftTeam={homeLabel}
          rightTeam={awayLabel}
          leftTickets={splits.spread.homeBetPct}
          rightTickets={splits.spread.awayBetPct}
          leftMoney={splits.spread.homeMoneyPct}
          rightMoney={splits.spread.awayMoneyPct}
          line={splits.spread.line > 0 ? `+${splits.spread.line}` : `${splits.spread.line}`}
          compact={compact}
        />

        <BetTypeSection
          title="Moneyline"
          icon={<DollarSign className="w-4 h-4 text-green-500" />}
          leftTeam={homeLabel}
          rightTeam={awayLabel}
          leftTickets={splits.moneyline.homeBetPct}
          rightTickets={splits.moneyline.awayBetPct}
          leftMoney={splits.moneyline.homeMoneyPct}
          rightMoney={splits.moneyline.awayMoneyPct}
          line={`${splits.moneyline.homeOdds > 0 ? '+' : ''}${splits.moneyline.homeOdds} / ${splits.moneyline.awayOdds > 0 ? '+' : ''}${splits.moneyline.awayOdds}`}
          compact={compact}
        />

        <BetTypeSection
          title="Total"
          icon={<Target className="w-4 h-4 text-blue-500" />}
          leftTeam="Over"
          rightTeam="Under"
          leftTickets={splits.total.overBetPct}
          rightTickets={splits.total.underBetPct}
          leftMoney={splits.total.overMoneyPct}
          rightMoney={splits.total.underMoneyPct}
          line={`O/U ${splits.total.line}`}
          compact={compact}
        />
      </div>

      {/* Sharp Money Signals - More Compact */}
      {sharpSignals.length > 0 && (
        <div className="mt-4 pt-3 border-t border-slate-800">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-purple-400" />
            <h4 className="text-sm font-semibold text-white">Sharp Money Signals</h4>
          </div>
          <div className="space-y-1.5">
            {sharpSignals.map((signal, i) => (
              <div 
                key={i}
                className="flex items-center gap-2 px-3 py-2 bg-purple-500/10 border border-purple-500/30 rounded-lg"
              >
                <AlertTriangle className="w-4 h-4 text-purple-400 flex-shrink-0" />
                <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${
                  signal.confidence === 'high' ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'
                }`}>
                  {signal.confidence.toUpperCase()}
                </span>
                <p className="text-sm text-slate-300">{signal.signal}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* SHARP SIGNAL SUMMARY - The Whale's divergence indicator         */}
      {/* Shows when money % diverges from ticket % by 15%+ on any market */}
      {/* ============================================================= */}
      {(() => {
        // Collect all divergence signals across spread, moneyline, and total
        const divergences: { market: string; side: string; moneyPct: number; ticketPct: number; divergence: number }[] = []

        // Spread divergences
        const spreadHomeDiff = splits.spread.homeMoneyPct - splits.spread.homeBetPct
        const spreadAwayDiff = splits.spread.awayMoneyPct - splits.spread.awayBetPct
        if (Math.abs(spreadHomeDiff) >= 15) {
          divergences.push({
            market: 'Spread',
            side: homeLabel,
            moneyPct: splits.spread.homeMoneyPct,
            ticketPct: splits.spread.homeBetPct,
            divergence: spreadHomeDiff,
          })
        }
        if (Math.abs(spreadAwayDiff) >= 15) {
          divergences.push({
            market: 'Spread',
            side: awayLabel,
            moneyPct: splits.spread.awayMoneyPct,
            ticketPct: splits.spread.awayBetPct,
            divergence: spreadAwayDiff,
          })
        }

        // Moneyline divergences
        const mlHomeDiff = splits.moneyline.homeMoneyPct - splits.moneyline.homeBetPct
        const mlAwayDiff = splits.moneyline.awayMoneyPct - splits.moneyline.awayBetPct
        if (Math.abs(mlHomeDiff) >= 15) {
          divergences.push({
            market: 'ML',
            side: homeLabel,
            moneyPct: splits.moneyline.homeMoneyPct,
            ticketPct: splits.moneyline.homeBetPct,
            divergence: mlHomeDiff,
          })
        }
        if (Math.abs(mlAwayDiff) >= 15) {
          divergences.push({
            market: 'ML',
            side: awayLabel,
            moneyPct: splits.moneyline.awayMoneyPct,
            ticketPct: splits.moneyline.awayBetPct,
            divergence: mlAwayDiff,
          })
        }

        // Total divergences
        const totalOverDiff = splits.total.overMoneyPct - splits.total.overBetPct
        const totalUnderDiff = splits.total.underMoneyPct - splits.total.underBetPct
        if (Math.abs(totalOverDiff) >= 15) {
          divergences.push({
            market: 'Total',
            side: 'Over',
            moneyPct: splits.total.overMoneyPct,
            ticketPct: splits.total.overBetPct,
            divergence: totalOverDiff,
          })
        }
        if (Math.abs(totalUnderDiff) >= 15) {
          divergences.push({
            market: 'Total',
            side: 'Under',
            moneyPct: splits.total.underMoneyPct,
            ticketPct: splits.total.underBetPct,
            divergence: totalUnderDiff,
          })
        }

        // Only keep sharp-side signals (money% > ticket% by 15+)
        const sharpDivergences = divergences.filter(d => d.divergence >= 15)

        if (sharpDivergences.length === 0) return null

        return (
          <div className="mt-4 pt-3 border-t border-slate-800">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-orange-400" />
              <h4 className="text-sm font-semibold text-white">Sharp Signal Summary</h4>
            </div>
            <div className="space-y-2">
              {sharpDivergences.map((d, i) => {
                const barWidth = Math.min(100, Math.round(d.divergence))
                return (
                  <div
                    key={i}
                    className="relative overflow-hidden rounded-lg border border-green-500/30 bg-green-500/5 p-3"
                  >
                    {/* Divergence intensity bar (background) */}
                    <div
                      className="absolute inset-y-0 left-0 bg-green-500/10 transition-all duration-500"
                      style={{ width: `${barWidth}%` }}
                    />
                    <div className="relative flex items-center gap-2">
                      <span className="text-base flex-shrink-0">🔥</span>
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-bold text-green-400">
                          SHARP ALERT:
                        </span>{' '}
                        <span className="text-sm text-slate-200">
                          {d.moneyPct}% of money but only {d.ticketPct}% of tickets on{' '}
                          <span className="font-bold text-white">{d.side}</span>{' '}
                          <span className="text-slate-400">({d.market})</span>
                        </span>
                      </div>
                      <span className="flex-shrink-0 text-xs font-mono font-bold text-green-400 bg-green-500/20 px-2 py-0.5 rounded">
                        +{d.divergence}%
                      </span>
                    </div>
                  </div>
                )
              })}

              {/* Public-side counter-signal (money lower than tickets by 15+) */}
              {divergences.filter(d => d.divergence <= -15).map((d, i) => (
                <div
                  key={`pub-${i}`}
                  className="relative overflow-hidden rounded-lg border border-red-500/30 bg-red-500/5 p-3"
                >
                  <div className="relative flex items-center gap-2">
                    <span className="text-base flex-shrink-0">📢</span>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-bold text-red-400">
                        PUBLIC SIDE:
                      </span>{' '}
                      <span className="text-sm text-slate-200">
                        {d.ticketPct}% of tickets but only {d.moneyPct}% of money on{' '}
                        <span className="font-bold text-white">{d.side}</span>{' '}
                        <span className="text-slate-400">({d.market})</span>
                      </span>
                    </div>
                    <span className="flex-shrink-0 text-xs font-mono font-bold text-red-400 bg-red-500/20 px-2 py-0.5 rounded">
                      {d.divergence}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      })()}

      {/* Source Attribution - Smaller */}
      <div className="mt-3 pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-600">
        <span>Live betting data</span>
        <span>Updates every 2 min</span>
      </div>
    </div>
  )
}

export default GameBettingSplits
