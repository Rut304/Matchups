'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { BarChart3, Users, DollarSign, Zap, TrendingUp, AlertTriangle, RefreshCw } from 'lucide-react'

interface Split {
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
    homeOdds?: number
    awayOdds?: number
  }
  total: {
    overBetPct: number
    underBetPct: number
    overMoneyPct: number
    underMoneyPct: number
    line?: number
  }
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

interface SplitsData {
  splits: Split[]
  sharpSignals: SharpSignal[]
  totalGames: number
}

const SPORT_CONFIG: Record<string, { icon: string; color: string; bg: string; border: string }> = {
  NBA: { icon: '🏀', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
  NHL: { icon: '🏒', color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20' },
  MLB: { icon: '⚾', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
  NCAAB: { icon: '🏀', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
  NFL: { icon: '🏈', color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
}

// Heat color based on divergence between public % and money %
function getDivergenceColor(betPct: number, moneyPct: number): string {
  const diff = Math.abs(betPct - moneyPct)
  if (diff >= 25) return 'bg-red-500/30 text-red-300'
  if (diff >= 15) return 'bg-orange-500/25 text-orange-300'
  if (diff >= 8) return 'bg-yellow-500/20 text-yellow-300'
  return 'bg-slate-500/10 text-slate-400'
}

function getDivergenceLabel(betPct: number, moneyPct: number): string {
  const diff = Math.abs(betPct - moneyPct)
  if (diff >= 25) return 'EXTREME'
  if (diff >= 15) return 'HIGH'
  if (diff >= 8) return 'MODERATE'
  return ''
}

// Visual bar showing public vs money split
function SplitBar({ label, publicPct, moneyPct, publicLabel, moneyLabel }: {
  label: string
  publicPct: number
  moneyPct: number
  publicLabel: string
  moneyLabel: string
}) {
  const divergence = Math.abs(publicPct - moneyPct)
  const isSharp = moneyPct > publicPct // Money side has more $ than tickets

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-[10px] text-slate-500 uppercase tracking-wider">
        <span>{label}</span>
        {divergence >= 10 && (
          <span className={divergence >= 20 ? 'text-red-400 font-bold' : 'text-amber-400'}>
            {divergence}pt gap
          </span>
        )}
      </div>
      {/* Public bar */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-slate-500 w-10 shrink-0">
          <Users className="w-3 h-3 inline" /> Tix
        </span>
        <div className="flex-1 h-4 bg-slate-800 rounded-sm overflow-hidden relative">
          <div
            className="h-full bg-slate-600 rounded-sm transition-all"
            style={{ width: `${publicPct}%` }}
          />
          <span className="absolute inset-0 flex items-center justify-center text-[10px] font-mono text-white/70">
            {publicLabel}
          </span>
        </div>
        <span className="text-[10px] font-mono text-slate-400 w-8 text-right">{publicPct}%</span>
      </div>
      {/* Money bar */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-slate-500 w-10 shrink-0">
          <DollarSign className="w-3 h-3 inline" /> $$$
        </span>
        <div className="flex-1 h-4 bg-slate-800 rounded-sm overflow-hidden relative">
          <div
            className={`h-full rounded-sm transition-all ${isSharp && divergence >= 10 ? 'bg-green-600' : 'bg-slate-500'}`}
            style={{ width: `${moneyPct}%` }}
          />
          <span className="absolute inset-0 flex items-center justify-center text-[10px] font-mono text-white/70">
            {moneyLabel}
          </span>
        </div>
        <span className="text-[10px] font-mono text-slate-400 w-8 text-right">{moneyPct}%</span>
      </div>
    </div>
  )
}

function GameSplitCard({ split, sharpSignals }: { split: Split; sharpSignals: SharpSignal[] }) {
  const gameSignals = sharpSignals.filter(s => s.gameId === split.gameId)
  const cfg = SPORT_CONFIG[split.sport] || SPORT_CONFIG.NBA

  // Calculate max divergence for this game
  const spreadDiv = Math.abs(split.spread.homeBetPct - split.spread.homeMoneyPct)
  const mlDiv = Math.abs(split.moneyline.homeBetPct - split.moneyline.homeMoneyPct)
  const totalDiv = Math.abs(split.total.overBetPct - split.total.overMoneyPct)
  const maxDiv = Math.max(spreadDiv, mlDiv, totalDiv)

  const gameTime = new Date(split.gameTime)
  const timeStr = gameTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
  const isToday = new Date().toDateString() === gameTime.toDateString()

  return (
    <Link href={`/game/${split.gameId}?sport=${split.sport.toLowerCase()}`}>
      <div className={`rounded-lg border ${maxDiv >= 15 ? 'border-orange-500/30 bg-orange-500/[0.03]' : 'border-white/[0.06] bg-white/[0.02]'} p-3 hover:bg-white/[0.04] transition-all cursor-pointer group`}>
        {/* Header: Sport + Teams + Time */}
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            <span className="text-base">{cfg.icon}</span>
            <div>
              <p className="text-sm font-bold text-white">{split.awayTeam} @ {split.homeTeam}</p>
              <p className="text-[10px] text-slate-500">{split.sport} • {isToday ? timeStr : gameTime.toLocaleDateString()}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {maxDiv >= 15 && (
              <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${getDivergenceColor(0, maxDiv)}`}>
                {getDivergenceLabel(0, maxDiv)}
              </span>
            )}
            {gameSignals.length > 0 && (
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-green-500/20 text-green-400">
                <Zap className="w-2.5 h-2.5 inline mr-0.5" />SHARP
              </span>
            )}
          </div>
        </div>

        {/* Spread Split */}
        <SplitBar
          label={`Spread (${split.spread.line > 0 ? '+' : ''}${split.spread.line})`}
          publicPct={split.spread.homeBetPct}
          moneyPct={split.spread.homeMoneyPct}
          publicLabel={`${split.homeTeam.split(' ').pop()} ${split.spread.homeBetPct}%`}
          moneyLabel={`${split.homeTeam.split(' ').pop()} ${split.spread.homeMoneyPct}%`}
        />

        {/* Total Split */}
        <div className="mt-2">
          <SplitBar
            label={`Total${split.total.line ? ` (${split.total.line})` : ''}`}
            publicPct={split.total.overBetPct}
            moneyPct={split.total.overMoneyPct}
            publicLabel={`Over ${split.total.overBetPct}%`}
            moneyLabel={`Over ${split.total.overMoneyPct}%`}
          />
        </div>

        {/* Sharp Signal callout */}
        {gameSignals.length > 0 && (
          <div className="mt-2 p-1.5 rounded bg-green-500/10 border border-green-500/20">
            <p className="text-[10px] text-green-400 font-medium">
              <Zap className="w-3 h-3 inline mr-1" />
              {gameSignals[0].signal.substring(0, 80)}
            </p>
          </div>
        )}
      </div>
    </Link>
  )
}

export function SplitsHeatMap({ sports = ['NBA', 'NHL', 'MLB', 'NCAAB'] }: { sports?: string[] }) {
  const [allSplits, setAllSplits] = useState<Split[]>([])
  const [allSignals, setAllSignals] = useState<SharpSignal[]>([])
  const [loading, setLoading] = useState(true)
  const [activeSport, setActiveSport] = useState<string>('ALL')
  const [lastUpdated, setLastUpdated] = useState<string>('')

  async function fetchSplits() {
    setLoading(true)
    const results: Split[] = []
    const signals: SharpSignal[] = []

    await Promise.all(sports.map(async (sport) => {
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 8000)
        const res = await fetch(`/api/betting-splits?sport=${sport}`, { signal: controller.signal })
        clearTimeout(timeoutId)
        if (res.ok) {
          const d = await res.json()
          const data = d.data || {}
          if (data.splits) results.push(...data.splits)
          if (data.sharpSignals) signals.push(...data.sharpSignals)
        }
      } catch { /* timeout or error — skip sport */ }
    }))

    // Sort by max divergence (most interesting first)
    results.sort((a, b) => {
      const aDiv = Math.max(
        Math.abs(a.spread.homeBetPct - a.spread.homeMoneyPct),
        Math.abs(a.total.overBetPct - a.total.overMoneyPct)
      )
      const bDiv = Math.max(
        Math.abs(b.spread.homeBetPct - b.spread.homeMoneyPct),
        Math.abs(b.total.overBetPct - b.total.overMoneyPct)
      )
      return bDiv - aDiv
    })

    setAllSplits(results)
    setAllSignals(signals)
    setLastUpdated(new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }))
    setLoading(false)
  }

  useEffect(() => {
    fetchSplits()
    const interval = setInterval(fetchSplits, 180000) // Refresh every 3 min
    return () => clearInterval(interval)
  }, [])

  const filtered = activeSport === 'ALL' ? allSplits : allSplits.filter(s => s.sport === activeSport)
  const filteredSignals = activeSport === 'ALL' ? allSignals : allSignals.filter(s => s.sport === activeSport)

  // Stats summary
  const sharpCount = allSignals.length
  const highDivCount = allSplits.filter(s =>
    Math.max(
      Math.abs(s.spread.homeBetPct - s.spread.homeMoneyPct),
      Math.abs(s.total.overBetPct - s.total.overMoneyPct)
    ) >= 15
  ).length

  return (
    <div>
      {/* Header with stats */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-blue-500/10 border border-purple-500/20 flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Betting Splits</h2>
            <p className="text-xs text-slate-500">Public vs Sharp money • Where the smart money is going</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {sharpCount > 0 && (
            <span className="hidden sm:inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold bg-green-500/15 text-green-400 border border-green-500/20">
              <Zap className="w-3 h-3" /> {sharpCount} Sharp Signal{sharpCount > 1 ? 's' : ''}
            </span>
          )}
          {highDivCount > 0 && (
            <span className="hidden sm:inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold bg-orange-500/15 text-orange-400 border border-orange-500/20">
              <AlertTriangle className="w-3 h-3" /> {highDivCount} High Divergence
            </span>
          )}
          {lastUpdated && (
            <span className="text-[10px] text-slate-600">{lastUpdated}</span>
          )}
        </div>
      </div>

      {/* Sport Tabs */}
      <div className="flex items-center gap-1 mb-4 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveSport('ALL')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
            activeSport === 'ALL' ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          All ({allSplits.length})
        </button>
        {sports.map(sport => {
          const cfg = SPORT_CONFIG[sport] || SPORT_CONFIG.NBA
          const count = allSplits.filter(s => s.sport === sport).length
          if (count === 0) return null
          return (
            <button
              key={sport}
              onClick={() => setActiveSport(sport)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                activeSport === sport ? `${cfg.bg} ${cfg.color} ${cfg.border} border` : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {cfg.icon} {sport} ({count})
            </button>
          )
        })}
      </div>

      {/* Loading */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="rounded-lg border border-white/5 bg-white/[0.02] p-4 animate-pulse">
              <div className="h-4 bg-slate-700 rounded w-2/3 mb-3" />
              <div className="h-3 bg-slate-800 rounded w-full mb-2" />
              <div className="h-3 bg-slate-800 rounded w-full mb-2" />
              <div className="h-3 bg-slate-800 rounded w-3/4" />
            </div>
          ))}
        </div>
      )}

      {/* Splits Grid */}
      {!loading && filtered.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filtered.map(split => (
            <GameSplitCard key={split.gameId} split={split} sharpSignals={filteredSignals} />
          ))}
        </div>
      )}

      {/* No data */}
      {!loading && filtered.length === 0 && (
        <div className="text-center py-10 rounded-lg border border-white/5 bg-white/[0.02]">
          <BarChart3 className="w-8 h-8 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-500 text-sm">No betting splits available right now.</p>
          <p className="text-slate-600 text-xs mt-1">Splits update as games approach tip-off.</p>
        </div>
      )}
    </div>
  )
}
