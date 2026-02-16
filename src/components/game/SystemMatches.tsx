'use client'

import { useEffect, useState } from 'react'
import { Cpu, TrendingUp, ArrowRight, CheckCircle } from 'lucide-react'

interface SystemMatch {
  name: string
  description: string
  record: string
  winPct: number
  roi: number
  sampleSize: number
  confidence: string
  applicablePick: string
}

export default function SystemMatches({
  sport,
  homeAbbr,
  awayAbbr,
  spread,
  total,
  isHomeFavorite
}: {
  sport: string
  homeAbbr: string
  awayAbbr: string
  spread: number
  total: number
  isHomeFavorite: boolean
}) {
  const [systems, setSystems] = useState<SystemMatch[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchSystems() {
      setLoading(true)
      try {
        // Fetch popular systems and check which ones match this game
        const res = await fetch(`/api/systems/popular?sport=${sport.toLowerCase()}`)
        if (!res.ok) { setLoading(false); return }
        
        const data = await res.json()
        const matched: SystemMatch[] = []
        
        for (const system of (data.systems || [])) {
          const criteria = system.criteria || {}
          const absSpread = Math.abs(spread)
          
          // Check if this game matches the system criteria
          let matches = true
          
          if (criteria.homeOnly && !isHomeFavorite) {
            if (criteria.underdogOnly) {
              matches = !isHomeFavorite
            } else if (criteria.favoriteOnly) {
              matches = isHomeFavorite
            }
          }
          
          if (criteria.awayOnly) {
            if (criteria.favoriteOnly) matches = matches && !isHomeFavorite
            if (criteria.underdogOnly) matches = matches && isHomeFavorite
          }
          
          if (criteria.spreadMin && absSpread < criteria.spreadMin) matches = false
          if (criteria.spreadMax && absSpread > criteria.spreadMax) matches = false
          if (criteria.totalMin && total < criteria.totalMin) matches = false
          if (criteria.totalMax && total > criteria.totalMax) matches = false
          
          // Use flat properties from the API response
          const sampleSize = system.sampleSize || 0
          const wins = system.wins || 0
          const losses = system.losses || 0
          const winPct = system.winPct || 0
          const roi = system.roi || 0
          const confidence = system.confidence || 'Low'
          const record = system.record || `${wins}-${losses}`
          
          if (matches && sampleSize > 50 && winPct > 52) {
            const pick = criteria.underdogOnly 
              ? (criteria.homeOnly ? `${homeAbbr} (Home Dog)` : `${awayAbbr} (Road Dog)`)
              : criteria.favoriteOnly
                ? (criteria.homeOnly ? `${homeAbbr} (Home Fav)` : `${awayAbbr} (Road Fav)`)
                : criteria.homeOnly ? homeAbbr : awayAbbr
            
            matched.push({
              name: system.name,
              description: system.description,
              record,
              winPct,
              roi,
              sampleSize,
              confidence,
              applicablePick: system.betType === 'ou' 
                ? (total >= (criteria.totalMin || 0) ? 'Under' : 'Over')
                : pick
            })
          }
        }
        
        // Sort by ROI
        matched.sort((a, b) => b.roi - a.roi)
        setSystems(matched)
      } catch (e) {
        console.error('System matches error:', e)
      }
      setLoading(false)
    }
    
    if (sport && spread !== undefined) fetchSystems()
  }, [sport, homeAbbr, awayAbbr, spread, total, isHomeFavorite])

  if (loading) {
    return (
      <div className="rounded-xl p-5 bg-slate-900/50 border border-slate-800 animate-pulse">
        <div className="h-6 bg-slate-800 rounded w-44 mb-4" />
        <div className="h-20 bg-slate-800/50 rounded" />
      </div>
    )
  }

  if (systems.length === 0) return null

  return (
    <div className="rounded-xl p-5 bg-slate-900/50 border border-slate-800">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-violet-500/20">
          <Cpu className="w-5 h-5 text-violet-400" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-white">System Matches</h2>
          <p className="text-sm text-slate-400">{systems.length} backtested system{systems.length !== 1 ? 's' : ''} match this game</p>
        </div>
      </div>

      <div className="space-y-3">
        {systems.slice(0, 4).map((sys, i) => (
          <div key={i} className={`rounded-lg p-3 border ${
            sys.roi >= 5 ? 'border-green-500/30 bg-green-500/5' : 
            sys.roi >= 0 ? 'border-yellow-500/20 bg-yellow-500/5' : 
            'border-red-500/20 bg-red-500/5'
          }`}>
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle className="w-3.5 h-3.5 text-violet-400 flex-shrink-0" />
                  <h4 className="text-sm font-bold text-white truncate">{sys.name}</h4>
                </div>
                <p className="text-[11px] text-slate-500 mb-2">{sys.description}</p>
                <div className="flex flex-wrap gap-2 text-[11px]">
                  <span className="text-slate-400">
                    Record: <span className={`font-bold ${sys.winPct >= 52 ? 'text-green-400' : 'text-red-400'}`}>{sys.record}</span>
                  </span>
                  <span className="text-slate-400">
                    Win%: <span className={`font-bold ${sys.winPct >= 52 ? 'text-green-400' : 'text-red-400'}`}>{sys.winPct.toFixed(1)}%</span>
                  </span>
                  <span className="text-slate-400">
                    ROI: <span className={`font-bold ${sys.roi >= 0 ? 'text-green-400' : 'text-red-400'}`}>{sys.roi > 0 ? '+' : ''}{sys.roi.toFixed(1)}%</span>
                  </span>
                  <span className="text-slate-500 text-[10px]">{sys.sampleSize} games</span>
                </div>
              </div>
              <div className="flex-shrink-0">
                <div className={`px-2.5 py-1.5 rounded-lg text-xs font-bold ${
                  sys.roi >= 3 ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                  'bg-slate-700/50 text-slate-300 border border-slate-600'
                }`}>
                  <div className="flex items-center gap-1">
                    <ArrowRight className="w-3 h-3" />
                    {sys.applicablePick}
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
