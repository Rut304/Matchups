'use client'

/**
 * SharpMoneySummary Component
 * 
 * A compact widget showing the most significant sharp money signals
 * of the day across all sports. Perfect for dashboard/home page.
 */

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  Zap, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle,
  RefreshCw,
  ChevronRight,
  Users,
  DollarSign
} from 'lucide-react'

interface SharpSignal {
  gameId: string
  sport: string
  homeTeam: string
  awayTeam: string
  betType: string
  publicSide: string
  publicPct: number
  moneyPct: number
  sharpSide: string
  confidence: string
  signal: string
}

interface BettingSplit {
  gameId: string
  sport: string
  homeTeam: string
  awayTeam: string
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
  }
  total: {
    overBetPct: number
    underBetPct: number
    overMoneyPct: number
    underMoneyPct: number
    line: number
  }
}

interface SharpMoneySummaryProps {
  sports?: string[]
  limit?: number
  showHeader?: boolean
}

export function SharpMoneySummary({ 
  sports = ['NBA', 'NHL', 'NFL', 'NCAAB'], 
  limit = 5,
  showHeader = true 
}: SharpMoneySummaryProps) {
  const [signals, setSignals] = useState<SharpSignal[]>([])
  const [splits, setSplits] = useState<BettingSplit[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 6000) // 6 second timeout

    const fetchAllSports = async () => {
      setLoading(true)
      setError(null)
      
      try {
        const allSignals: SharpSignal[] = []
        const allSplits: BettingSplit[] = []

        // Fetch splits for each sport in parallel
        const results = await Promise.all(
          sports.map(async (sport) => {
            try {
              const res = await fetch(`/api/betting-splits?sport=${sport}`, { signal: controller.signal })
              if (!res.ok) return { signals: [], splits: [] }
              const data = await res.json()
              return {
                signals: data.data?.sharpSignals || [],
                splits: data.data?.splits || []
              }
            } catch {
              return { signals: [], splits: [] }
            }
          })
        )
        
        clearTimeout(timeoutId)

        results.forEach(result => {
          allSignals.push(...result.signals)
          allSplits.push(...result.splits)
        })

        // Sort signals by confidence (high first) and limit
        const sortedSignals = allSignals
          .sort((a, b) => {
            if (a.confidence === 'high' && b.confidence !== 'high') return -1
            if (b.confidence === 'high' && a.confidence !== 'high') return 1
            return b.moneyPct - a.moneyPct
          })
          .slice(0, limit)

        setSignals(sortedSignals)
        setSplits(allSplits)
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          // Timeout - show empty state instead of error
          setError(null)
        } else {
          console.error('Error fetching sharp signals:', err)
          setError('Failed to load sharp money data')
        }
      } finally {
        setLoading(false)
      }
    }

    fetchAllSports()

    // Refresh every 3 minutes
    const interval = setInterval(fetchAllSports, 180000)
    return () => {
      clearTimeout(timeoutId)
      controller.abort()
      clearInterval(interval)
    }
  }, [sports, limit])

  // Get sport emoji
  const getSportEmoji = (sport: string) => {
    switch (sport.toUpperCase()) {
      case 'NFL': return '🏈'
      case 'NBA': return '🏀'
      case 'NHL': return '🏒'
      case 'MLB': return '⚾'
      case 'NCAAF': return '🏈'
      case 'NCAAB': return '🏀'
      default: return '🎯'
    }
  }

  if (loading) {
    return (
      <div className="rounded-xl p-4 bg-purple-500/5 border border-purple-500/20">
        <div className="flex items-center justify-center gap-3 py-4">
          <RefreshCw className="w-5 h-5 text-purple-400 animate-spin" />
          <span className="text-slate-400 text-sm">Loading sharp money signals...</span>
        </div>
      </div>
    )
  }

  if (error || signals.length === 0) {
    return (
      <div className="rounded-xl p-4 bg-purple-500/5 border border-purple-500/20">
        {showHeader && (
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-5 h-5 text-purple-400" />
            <span className="font-bold text-white">Sharp Money Signals</span>
          </div>
        )}
        <p className="text-sm text-slate-500 text-center py-4">
          {error || 'No significant sharp money divergences detected right now'}
        </p>
        <Link href="/trends" className="block text-center text-xs text-purple-400 hover:text-purple-300">
          View all betting trends →
        </Link>
      </div>
    )
  }

  return (
    <div className="rounded-xl p-4 bg-purple-500/5 border border-purple-500/20">
      {showHeader && (
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-purple-400" />
            <span className="font-bold text-white">Sharp Money Signals</span>
            <span className="text-xs px-2 py-0.5 bg-green-500/20 text-green-400 rounded">LIVE</span>
          </div>
          <Link href="/trends" className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1">
            All <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
      )}

      <div className="space-y-3">
        {signals.map((signal, i) => (
          <div 
            key={`${signal.gameId}-${signal.betType}-${i}`}
            className="p-3 rounded-lg bg-slate-900/50 border border-slate-800 hover:border-purple-500/30 transition-colors"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-lg">{getSportEmoji(signal.sport)}</span>
                <span className="text-xs font-semibold text-slate-400">{signal.sport}</span>
                <span className={`text-xs px-1.5 py-0.5 rounded ${
                  signal.confidence === 'high' 
                    ? 'bg-red-500/20 text-red-400' 
                    : 'bg-yellow-500/20 text-yellow-400'
                }`}>
                  {signal.confidence.toUpperCase()}
                </span>
              </div>
              <span className="text-xs text-slate-500 capitalize">{signal.betType}</span>
            </div>
            
            <p className="text-sm text-slate-300 mb-2">
              {signal.awayTeam} @ {signal.homeTeam}
            </p>
            
            {/* Visual indicator */}
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1 text-blue-400">
                <Users className="w-3 h-3" />
                <span>{signal.publicPct}% public on {signal.publicSide}</span>
              </div>
              <span className="text-slate-600">→</span>
              <div className="flex items-center gap-1 text-purple-400">
                <DollarSign className="w-3 h-3" />
                <span>{signal.moneyPct}% money on {signal.sharpSide}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Stats */}
      <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500">
        <span>{splits.length} games tracked</span>
        <span>Live betting data</span>
      </div>
    </div>
  )
}

/**
 * PublicBettingSnapshot Component
 * 
 * Shows a quick snapshot of public betting %s across games
 */
export function PublicBettingSnapshot({ sport = 'NBA', limit = 4 }: { sport?: string; limit?: number }) {
  const [splits, setSplits] = useState<BettingSplit[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSplits = async () => {
      try {
        const res = await fetch(`/api/betting-splits?sport=${sport}`)
        if (!res.ok) return
        const data = await res.json()
        setSplits(data.data?.splits?.slice(0, limit) || [])
      } catch (err) {
        console.error('Error fetching splits:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchSplits()
  }, [sport, limit])

  if (loading) {
    return (
      <div className="animate-pulse space-y-2">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-12 bg-slate-800 rounded" />
        ))}
      </div>
    )
  }

  if (splits.length === 0) {
    return (
      <p className="text-sm text-slate-500 text-center py-4">No betting data available</p>
    )
  }

  return (
    <div className="space-y-2">
      {splits.map((split, i) => {
        // Find the most lopsided bet
        const spreadDiff = Math.abs(split.spread.homeBetPct - split.spread.awayBetPct)
        const publicFavorite = split.spread.homeBetPct > split.spread.awayBetPct 
          ? { side: 'Home', pct: split.spread.homeBetPct }
          : { side: 'Away', pct: split.spread.awayBetPct }

        return (
          <div 
            key={split.gameId || i}
            className="flex items-center justify-between p-2 rounded bg-slate-900/50 text-xs"
          >
            <span className="text-slate-300 truncate flex-1">
              {split.awayTeam.split(' ').pop()} @ {split.homeTeam.split(' ').pop()}
            </span>
            <div className="flex items-center gap-2">
              <span className={`font-bold ${publicFavorite.pct > 65 ? 'text-orange-400' : 'text-slate-400'}`}>
                {publicFavorite.pct}% {publicFavorite.side}
              </span>
              {publicFavorite.pct > 65 && (
                <span className="text-[10px] px-1 py-0.5 bg-orange-500/20 text-orange-400 rounded">
                  Heavy
                </span>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default SharpMoneySummary
