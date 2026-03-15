'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { BarChart3, Zap, Users, DollarSign, TrendingUp, AlertTriangle, ChevronRight } from 'lucide-react'

interface Split {
  gameId: string
  sport: string
  homeTeam: string
  awayTeam: string
  gameTime: string
  spread: { homeBetPct: number; awayBetPct: number; homeMoneyPct: number; awayMoneyPct: number; line: number }
  moneyline: { homeBetPct: number; awayBetPct: number; homeMoneyPct: number; awayMoneyPct: number; homeOdds?: number; awayOdds?: number }
  total: { overBetPct: number; underBetPct: number; overMoneyPct: number; underMoneyPct: number; line?: number }
}

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

const SPORT_LABELS: Record<string, { spreadLabel: string; totalLabel: string }> = {
  NBA: { spreadLabel: 'Spread', totalLabel: 'Total' },
  NHL: { spreadLabel: 'Puckline', totalLabel: 'Total' },
  MLB: { spreadLabel: 'Runline', totalLabel: 'Total' },
  NFL: { spreadLabel: 'Spread', totalLabel: 'Total' },
  NCAAB: { spreadLabel: 'Spread', totalLabel: 'Total' },
  NCAAF: { spreadLabel: 'Spread', totalLabel: 'Total' },
}

// Compact horizontal bar for ticket vs money
function CompactSplitRow({ label, ticketPct, moneyPct, ticketSide, moneySide }: {
  label: string
  ticketPct: number
  moneyPct: number
  ticketSide: string
  moneySide: string
}) {
  const divergence = Math.abs(ticketPct - moneyPct)
  const isReversed = ticketPct > 50 !== moneyPct > 50

  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="text-[10px] text-slate-500 w-14 shrink-0 uppercase">{label}</span>
      <div className="flex-1">
        {/* Stacked bars */}
        <div className="relative h-5 bg-slate-800 rounded-sm overflow-hidden">
          {/* Ticket bar */}
          <div
            className="absolute top-0 h-2.5 bg-slate-600 rounded-t-sm"
            style={{ width: `${ticketPct}%` }}
          />
          {/* Money bar */}
          <div
            className={`absolute bottom-0 h-2.5 rounded-b-sm ${divergence >= 12 ? 'bg-green-600/80' : 'bg-blue-600/60'}`}
            style={{ width: `${moneyPct}%` }}
          />
          {/* Center line */}
          <div className="absolute top-0 bottom-0 left-1/2 w-px bg-white/10" />
        </div>
        <div className="flex justify-between text-[9px] mt-0.5">
          <span className="text-slate-500">
            <Users className="w-2.5 h-2.5 inline" /> {ticketSide} {ticketPct}%
          </span>
          <span className={divergence >= 12 ? 'text-green-400 font-bold' : 'text-slate-500'}>
            <DollarSign className="w-2.5 h-2.5 inline" /> {moneySide} {moneyPct}%
          </span>
        </div>
      </div>
      {divergence >= 12 && (
        <span className={`text-[9px] font-bold px-1 py-0.5 rounded ${
          divergence >= 20 ? 'bg-red-500/20 text-red-400' : 'bg-orange-500/15 text-orange-400'
        }`}>
          {divergence}pt
        </span>
      )}
    </div>
  )
}

export function SportSplitsPanel({ sport }: { sport: string }) {
  const [splits, setSplits] = useState<Split[]>([])
  const [signals, setSignals] = useState<SharpSignal[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 8000)
        const res = await fetch(`/api/betting-splits?sport=${sport}`, { signal: controller.signal })
        clearTimeout(timeoutId)
        if (res.ok) {
          const d = await res.json()
          const data = d.data || {}
          setSplits(data.splits || [])
          setSignals(data.sharpSignals || [])
        }
      } catch { /* ignore */ }
      setLoading(false)
    }
    load()
    const interval = setInterval(load, 180000)
    return () => clearInterval(interval)
  }, [sport])

  const labels = SPORT_LABELS[sport] || SPORT_LABELS.NBA

  if (loading) {
    return (
      <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4 animate-pulse">
        <div className="h-5 bg-slate-700 rounded w-40 mb-4" />
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-16 bg-slate-800/50 rounded" />)}
        </div>
      </div>
    )
  }

  if (splits.length === 0) {
    return (
      <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
        <div className="flex items-center gap-2 mb-3">
          <BarChart3 className="w-4 h-4 text-slate-500" />
          <h3 className="text-sm font-bold text-white">Betting Splits</h3>
        </div>
        <p className="text-xs text-slate-500 text-center py-4">
          No {sport} splits available. Data appears closer to game time.
        </p>
      </div>
    )
  }

  // Sort by divergence
  const sorted = [...splits].sort((a, b) => {
    const aDiv = Math.max(Math.abs(a.spread.homeBetPct - a.spread.homeMoneyPct), Math.abs(a.total.overBetPct - a.total.overMoneyPct))
    const bDiv = Math.max(Math.abs(b.spread.homeBetPct - b.spread.homeMoneyPct), Math.abs(b.total.overBetPct - b.total.overMoneyPct))
    return bDiv - aDiv
  })

  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-purple-400" />
          <h3 className="text-sm font-bold text-white">Betting Splits</h3>
          <span className="text-[10px] text-slate-500">{splits.length} games</span>
        </div>
        {signals.length > 0 && (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-green-500/15 text-green-400">
            <Zap className="w-2.5 h-2.5" /> {signals.length} Sharp
          </span>
        )}
      </div>

      <div className="space-y-3">
        {sorted.map(split => {
          const gameSignals = signals.filter(s => s.gameId === split.gameId)
          const timeStr = new Date(split.gameTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })

          return (
            <Link key={split.gameId} href={`/game/${split.gameId}?sport=${sport.toLowerCase()}`}>
              <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3 hover:bg-white/[0.04] transition-all cursor-pointer">
                {/* Game header */}
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-bold text-white">{split.awayTeam} @ {split.homeTeam}</p>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-slate-500">{timeStr}</span>
                    {gameSignals.length > 0 && (
                      <Zap className="w-3 h-3 text-green-400" />
                    )}
                  </div>
                </div>

                {/* Split bars */}
                <div className="space-y-2">
                  <CompactSplitRow
                    label={`${labels.spreadLabel} ${split.spread.line > 0 ? '+' : ''}${split.spread.line}`}
                    ticketPct={split.spread.homeBetPct}
                    moneyPct={split.spread.homeMoneyPct}
                    ticketSide={split.homeTeam.split(' ').pop() || ''}
                    moneySide={split.homeTeam.split(' ').pop() || ''}
                  />
                  <CompactSplitRow
                    label={`${labels.totalLabel}${split.total.line ? ` ${split.total.line}` : ''}`}
                    ticketPct={split.total.overBetPct}
                    moneyPct={split.total.overMoneyPct}
                    ticketSide="Over"
                    moneySide="Over"
                  />
                </div>

                {gameSignals.length > 0 && (
                  <p className="text-[10px] text-green-400 mt-2 truncate">
                    <Zap className="w-2.5 h-2.5 inline mr-1" />{gameSignals[0].signal.substring(0, 70)}
                  </p>
                )}
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
