'use client'

import { useEffect, useState } from 'react'
import { TrendingUp, Target, AlertTriangle, Zap, CheckCircle } from 'lucide-react'

interface TrendMatch {
  trend: {
    name: string
    description: string
    sport: string
    wins: number
    losses: number
    pushes: number
    winRate: number
    roi: number
    sampleSize: number
    isStatisticallySignificant: boolean
    betType: string
    recommendation: string
    confidenceLevel: string
  }
  matchStrength: number
  applicablePick: string
}

export default function SituationalTrends({
  gameId,
  sport,
  homeTeam,
  awayTeam,
  homeAbbr,
  awayAbbr,
  spread,
  total
}: {
  gameId: string
  sport: string
  homeTeam: string
  awayTeam: string
  homeAbbr: string
  awayAbbr: string
  spread: number
  total: number
}) {
  const [trends, setTrends] = useState<TrendMatch[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchTrends() {
      setLoading(true)
      try {
        const res = await fetch(`/api/games/${gameId}/trends?sport=${sport}&home=${homeAbbr}&away=${awayAbbr}&spread=${spread}&total=${total}`)
        if (res.ok) {
          const data = await res.json()
          setTrends(data.matches || [])
        }
      } catch (e) {
        console.error('Trends fetch error:', e)
      }
      setLoading(false)
    }
    if (gameId && sport) fetchTrends()
  }, [gameId, sport, homeAbbr, awayAbbr, spread, total])

  if (loading) {
    return (
      <div className="rounded-xl p-5 bg-slate-900/50 border border-slate-800 animate-pulse">
        <div className="h-6 bg-slate-800 rounded w-56 mb-4" />
        <div className="space-y-3">
          <div className="h-16 bg-slate-800/50 rounded" />
          <div className="h-16 bg-slate-800/50 rounded" />
        </div>
      </div>
    )
  }

  if (trends.length === 0) return null

  const confidenceIcon = (level: string) => {
    if (level === 'high') return <CheckCircle className="w-4 h-4 text-green-400" />
    if (level === 'medium') return <Target className="w-4 h-4 text-yellow-400" />
    return <AlertTriangle className="w-4 h-4 text-orange-400" />
  }

  const confidenceBg = (level: string) => {
    if (level === 'high') return 'border-green-500/30 bg-green-500/5'
    if (level === 'medium') return 'border-yellow-500/30 bg-yellow-500/5'
    return 'border-orange-500/30 bg-orange-500/5'
  }

  return (
    <div className="rounded-xl p-5 bg-slate-900/50 border border-slate-800">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-cyan-500/20">
          <Zap className="w-5 h-5 text-cyan-400" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-white">Situational Trends</h2>
          <p className="text-sm text-slate-400">{trends.length} matching trend{trends.length !== 1 ? 's' : ''} for this matchup</p>
        </div>
      </div>

      <div className="space-y-3">
        {trends.slice(0, 5).map((match, i) => (
          <div key={i} className={`rounded-lg p-4 border ${confidenceBg(match.trend.confidenceLevel)}`}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  {confidenceIcon(match.trend.confidenceLevel)}
                  <h4 className="text-sm font-bold text-white">{match.trend.name}</h4>
                  {match.trend.isStatisticallySignificant && (
                    <span className="px-1.5 py-0.5 text-[9px] font-bold bg-green-500/20 text-green-400 rounded">
                      SIGNIFICANT
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 mb-2">{match.trend.description}</p>
                
                <div className="flex flex-wrap gap-3 text-[11px]">
                  <span className="text-slate-400">
                    Record: <span className={`font-bold ${match.trend.winRate >= 52 ? 'text-green-400' : 'text-red-400'}`}>
                      {match.trend.wins}-{match.trend.losses}{match.trend.pushes > 0 ? `-${match.trend.pushes}` : ''}
                    </span>
                  </span>
                  <span className="text-slate-400">
                    Win%: <span className={`font-bold ${match.trend.winRate >= 52 ? 'text-green-400' : 'text-red-400'}`}>
                      {match.trend.winRate}%
                    </span>
                  </span>
                  <span className="text-slate-400">
                    ROI: <span className={`font-bold ${match.trend.roi >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {match.trend.roi > 0 ? '+' : ''}{match.trend.roi}%
                    </span>
                  </span>
                  <span className="text-slate-500">
                    {match.trend.sampleSize} games
                  </span>
                </div>
              </div>
              
              <div className="text-right flex-shrink-0">
                <div className={`inline-block px-3 py-1.5 rounded-lg text-xs font-bold ${
                  match.trend.winRate >= 52 
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                    : 'bg-red-500/20 text-red-400 border border-red-500/30'
                }`}>
                  {match.applicablePick || match.trend.recommendation}
                </div>
                <div className="mt-1">
                  <div className="flex items-center gap-1 justify-end">
                    <TrendingUp className="w-3 h-3 text-slate-600" />
                    <span className="text-[10px] text-slate-500">
                      {match.matchStrength}% match
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
