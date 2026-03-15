'use client'

import Link from 'next/link'
import { Target, Zap, Users, BarChart3, TrendingUp, Shield, ChevronRight, AlertTriangle } from 'lucide-react'
import type { EdgeCard } from '@/components/edge/EdgeDashboard'

interface FeaturedEdgeProps {
  edge: EdgeCard | null
}

function ConfidenceMeter({ score }: { score: number }) {
  // Segments for the visual meter
  const segments = 20
  const filledSegments = Math.round((score / 100) * segments)
  
  return (
    <div className="flex flex-col items-center">
      <div className="text-4xl sm:text-5xl font-black font-mono tabular-nums leading-none mb-1"
        style={{
          color: score >= 80 ? '#4ade80' : score >= 65 ? '#fb923c' : score >= 50 ? '#facc15' : '#94a3b8'
        }}
      >
        {score}
      </div>
      <div className="flex gap-[2px]">
        {Array.from({ length: segments }).map((_, i) => (
          <div
            key={i}
            className="w-1.5 h-3 rounded-sm transition-all"
            style={{
              backgroundColor: i < filledSegments
                ? score >= 80 ? '#4ade80' : score >= 65 ? '#fb923c' : score >= 50 ? '#facc15' : '#94a3b8'
                : '#1e293b'
            }}
          />
        ))}
      </div>
      <span className="text-[10px] text-slate-500 mt-1 uppercase tracking-wider">Edge Score</span>
    </div>
  )
}

export function FeaturedEdge({ edge }: FeaturedEdgeProps) {
  if (!edge) return null

  // Only feature edges with score >= 70 — otherwise not high enough confidence
  if (edge.edgeScore < 70) return null

  return (
    <Link href={`/game/${edge.gameId}?sport=${edge.sport.toLowerCase()}`}>
      <div className="relative rounded-2xl overflow-hidden border border-green-500/20 bg-gradient-to-br from-green-500/[0.06] via-[#0a0a12] to-emerald-500/[0.04] p-5 sm:p-6 hover:border-green-500/30 transition-all group cursor-pointer">
        {/* Subtle glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/5 rounded-full blur-3xl pointer-events-none" />

        {/* Top label */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-green-500/20 border border-green-500/30 flex items-center justify-center">
              <Target className="w-4 h-4 text-green-400" />
            </div>
            <div>
              <p className="text-xs font-bold text-green-400 uppercase tracking-wider">The Edge</p>
              <p className="text-[10px] text-slate-500">Top play by confidence</p>
            </div>
          </div>
          <span className="text-2xl">{edge.sportIcon}</span>
        </div>

        {/* Main content grid */}
        <div className="flex items-center gap-6 sm:gap-8">
          {/* Left: Pick details */}
          <div className="flex-1 min-w-0">
            <p className="text-xs text-slate-500 mb-1">{edge.sport} • {edge.gameTime}</p>
            <p className="text-sm text-slate-400 mb-2">{edge.matchup}</p>
            <p className="text-2xl sm:text-3xl font-black text-white mb-1 truncate">{edge.pick}</p>
            <p className="text-sm text-slate-500 font-mono">{edge.odds}</p>

            {/* Signal pills */}
            <div className="flex flex-wrap gap-2 mt-3">
              {edge.trendCount > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/15 text-blue-400">
                  <TrendingUp className="w-3 h-3" /> {edge.trendCount} Trends
                </span>
              )}
              {edge.isRLM && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-yellow-500/15 text-yellow-400">
                  <Zap className="w-3 h-3" /> Reverse Line Move
                </span>
              )}
              {edge.publicPct && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/15 text-purple-400">
                  <Users className="w-3 h-3" /> {edge.publicPct}% Public
                </span>
              )}
              {edge.h2hRecord && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-500/15 text-slate-400">
                  <Shield className="w-3 h-3" /> H2H: {edge.h2hRecord}
                </span>
              )}
            </div>

            {/* Top trends */}
            {edge.topTrends.length > 0 && (
              <div className="mt-3 space-y-1">
                {edge.topTrends.slice(0, 2).map((trend, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-1 h-1 rounded-full bg-green-500" />
                    <span className="text-[11px] text-slate-500">{trend}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right: Score meter */}
          <div className="shrink-0">
            <ConfidenceMeter score={edge.edgeScore} />
            <div className="mt-2 text-center">
              <span className={`text-xs font-bold ${
                edge.confidence >= 80 ? 'text-green-400' : edge.confidence >= 65 ? 'text-orange-400' : 'text-yellow-400'
              }`}>
                {edge.confidence}% conf.
              </span>
            </div>
          </div>
        </div>

        {/* Footer CTA */}
        <div className="flex items-center justify-end mt-4 pt-3 border-t border-white/5">
          <span className="text-xs text-slate-500 group-hover:text-green-400 transition-colors flex items-center gap-1">
            Full analysis <ChevronRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>
    </Link>
  )
}

export function NoEdgeState() {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-8 h-8 rounded-lg bg-slate-500/20 border border-slate-500/20 flex items-center justify-center">
          <Target className="w-4 h-4 text-slate-500" />
        </div>
        <div>
          <p className="text-sm font-bold text-white">The Edge</p>
          <p className="text-xs text-slate-500">No high-confidence play right now</p>
        </div>
      </div>
      <div className="flex items-center gap-2 p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
        <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
        <p className="text-xs text-slate-400">
          We only recommend plays at <span className="text-white font-semibold">70+ confidence</span>.
          No marginal bets. Check back closer to game time when splits sharpen.
        </p>
      </div>
    </div>
  )
}
