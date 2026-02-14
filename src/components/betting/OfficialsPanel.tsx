'use client'

import { useState, useEffect } from 'react'
import { Scale, TrendingUp, TrendingDown, AlertTriangle, User, Shield, Gavel } from 'lucide-react'

interface Official {
  name: string
  role: string
  yearsExperience: number
  homeCoverPct: number
  overPct: number
  avgTotalPoints: number
  advancedStats: Record<string, number>
}

interface OfficialsPanelProps {
  gameId: string
  sport: string
  compact?: boolean
}

interface GameOfficials {
  officials: { official: Official; role: string }[]
  bettingImplications: {
    spreadTendency: 'home' | 'away' | 'neutral'
    totalTendency: 'over' | 'under' | 'neutral'
    keyInsights: string[]
    confidenceLevel: 'high' | 'medium' | 'low'
  }
}

export function OfficialsPanel({ gameId, sport, compact = false }: OfficialsPanelProps) {
  const [data, setData] = useState<GameOfficials | null>(null)
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    async function fetchOfficials() {
      try {
        const res = await fetch(`/api/officials?gameId=${gameId}&sport=${sport}`)
        if (res.ok) {
          const result = await res.json()
          if (result.officials) {
            setData(result)
          }
        }
      } catch (err) {
        console.error('Failed to load officials:', err)
      } finally {
        setLoading(false)
      }
    }
    
    if (gameId && sport) {
      fetchOfficials()
    }
  }, [gameId, sport])
  
  if (loading) {
    return (
      <div className="animate-pulse p-4 bg-slate-900/50 rounded-xl border border-slate-800">
        <div className="h-16 bg-slate-800 rounded"></div>
      </div>
    )
  }
  
  if (!data || !data.officials || data.officials.length === 0) {
    return null // No officials data available
  }
  
  const { officials, bettingImplications } = data
  const headRef = officials.find(o => o.role === 'referee' || o.role === 'head referee')?.official || officials[0]?.official
  
  const TendencyBadge = ({ type, value }: { type: 'spread' | 'total'; value: string }) => {
    const colors = {
      home: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      away: 'bg-red-500/20 text-red-400 border-red-500/30',
      over: 'bg-green-500/20 text-green-400 border-green-500/30',
      under: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      neutral: 'bg-slate-700/50 text-slate-400 border-slate-600'
    }
    
    return (
      <span className={`px-2 py-0.5 text-xs font-medium rounded border ${colors[value as keyof typeof colors] || colors.neutral}`}>
        {value.toUpperCase()}
      </span>
    )
  }
  
  if (compact) {
    return (
      <div className="p-3 bg-slate-900/50 rounded-lg border border-slate-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Gavel className="w-4 h-4 text-orange-500" />
            <span className="text-sm font-medium text-white">{headRef?.name || 'TBD'}</span>
          </div>
          <div className="flex gap-2">
            <TendencyBadge type="spread" value={bettingImplications.spreadTendency} />
            <TendencyBadge type="total" value={bettingImplications.totalTendency} />
          </div>
        </div>
      </div>
    )
  }
  
  return (
    <div className="rounded-xl p-4 bg-slate-900/50 border border-slate-800">
      <h3 className="flex items-center gap-2 text-sm font-bold text-white mb-3">
        <Gavel className="w-4 h-4 text-orange-500" />
        Officials & Betting Trends
      </h3>
      
      {/* Head Official */}
      {headRef && (
        <div className="p-3 bg-slate-800/50 rounded-lg mb-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-slate-400" />
              <span className="font-medium text-white">{headRef.name}</span>
              <span className="text-xs text-slate-500">{headRef.yearsExperience}yr exp</span>
            </div>
            <span className="text-xs text-slate-500 capitalize">{sport}</span>
          </div>
          
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div>
              <p className="text-slate-500">Home Cover</p>
              <p className={`font-bold ${headRef.homeCoverPct > 52 ? 'text-blue-400' : headRef.homeCoverPct < 48 ? 'text-red-400' : 'text-slate-300'}`}>
                {headRef.homeCoverPct?.toFixed(1)}%
              </p>
            </div>
            <div>
              <p className="text-slate-500">Over %</p>
              <p className={`font-bold ${headRef.overPct > 52 ? 'text-green-400' : headRef.overPct < 48 ? 'text-amber-400' : 'text-slate-300'}`}>
                {headRef.overPct?.toFixed(1)}%
              </p>
            </div>
            <div>
              <p className="text-slate-500">Avg Total</p>
              <p className="font-bold text-slate-300">{headRef.avgTotalPoints?.toFixed(1)}</p>
            </div>
          </div>
        </div>
      )}
      
      {/* Betting Implications */}
      <div className="space-y-2">
        <div className="flex items-center justify-between p-2 bg-slate-800/30 rounded">
          <span className="text-sm text-slate-400">Spread Tendency</span>
          <TendencyBadge type="spread" value={bettingImplications.spreadTendency} />
        </div>
        <div className="flex items-center justify-between p-2 bg-slate-800/30 rounded">
          <span className="text-sm text-slate-400">Total Tendency</span>
          <TendencyBadge type="total" value={bettingImplications.totalTendency} />
        </div>
      </div>
      
      {/* Key Insights */}
      {bettingImplications.keyInsights.length > 0 && (
        <div className="mt-3 p-2 bg-orange-500/10 rounded border border-orange-500/20">
          <div className="flex items-center gap-1 mb-1">
            <AlertTriangle className="w-3 h-3 text-orange-500" />
            <span className="text-xs font-medium text-orange-400">Key Insights</span>
          </div>
          <ul className="text-xs text-slate-300 space-y-1">
            {bettingImplications.keyInsights.slice(0, 3).map((insight, i) => (
              <li key={i}>• {insight}</li>
            ))}
          </ul>
        </div>
      )}
      
      {/* Confidence level */}
      <div className="mt-3 text-center">
        <span className={`text-xs px-2 py-0.5 rounded ${
          bettingImplications.confidenceLevel === 'high' ? 'bg-green-500/20 text-green-400' :
          bettingImplications.confidenceLevel === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
          'bg-slate-700 text-slate-400'
        }`}>
          {bettingImplications.confidenceLevel.toUpperCase()} CONFIDENCE
        </span>
      </div>
    </div>
  )
}
