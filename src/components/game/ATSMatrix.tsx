'use client'

import { useEffect, useState } from 'react'
import { BarChart3, TrendingUp, TrendingDown } from 'lucide-react'

interface ATSSplit {
  label: string
  wins: number
  losses: number
  pushes: number
  pct: number
}

interface TeamATSData {
  team: string
  atsSplits: ATSSplit[]
  ouRecord: { over: number; under: number; push: number; pct: number }
  totalGames: number
}

export default function ATSMatrix({ 
  homeAbbr, 
  awayAbbr, 
  sport 
}: { 
  homeAbbr: string
  awayAbbr: string
  sport: string 
}) {
  const [homeData, setHomeData] = useState<TeamATSData | null>(null)
  const [awayData, setAwayData] = useState<TeamATSData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchATS() {
      setLoading(true)
      try {
        const [homeRes, awayRes] = await Promise.all([
          fetch(`/api/teams/ats?team=${homeAbbr}&sport=${sport}`),
          fetch(`/api/teams/ats?team=${awayAbbr}&sport=${sport}`)
        ])
        if (homeRes.ok) setHomeData(await homeRes.json())
        if (awayRes.ok) setAwayData(await awayRes.json())
      } catch (e) {
        console.error('ATS Matrix fetch error:', e)
      }
      setLoading(false)
    }
    if (homeAbbr && awayAbbr) fetchATS()
  }, [homeAbbr, awayAbbr, sport])

  if (loading) {
    return (
      <div className="rounded-xl p-5 bg-slate-900/50 border border-slate-800 animate-pulse">
        <div className="h-6 bg-slate-800 rounded w-48 mb-4" />
        <div className="h-40 bg-slate-800/50 rounded" />
      </div>
    )
  }

  if (!homeData && !awayData) return null
  if ((homeData?.totalGames || 0) === 0 && (awayData?.totalGames || 0) === 0) return null

  const pctColor = (pct: number) => {
    if (pct >= 60) return 'text-green-400'
    if (pct >= 52) return 'text-emerald-400'
    if (pct >= 48) return 'text-yellow-400'
    if (pct >= 40) return 'text-orange-400'
    return 'text-red-400'
  }

  const pctBg = (pct: number) => {
    if (pct >= 60) return 'bg-green-500/10'
    if (pct >= 52) return 'bg-emerald-500/10'
    if (pct >= 48) return 'bg-yellow-500/5'
    return 'bg-red-500/10'
  }

  const renderTeamMatrix = (data: TeamATSData | null, abbr: string) => {
    if (!data || data.totalGames === 0) return (
      <div className="text-center py-4">
        <p className="text-sm text-slate-500">No ATS data for {abbr}</p>
      </div>
    )

    return (
      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-bold text-white">{abbr} ATS Splits</h4>
          <span className="text-[10px] text-slate-500">{data.totalGames} games</span>
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          {data.atsSplits.map((split) => (
            <div key={split.label} className={`rounded-lg p-2 ${pctBg(split.pct)} border border-slate-800/50`}>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider">{split.label}</p>
              <p className={`text-sm font-bold font-mono ${pctColor(split.pct)}`}>
                {split.wins}-{split.losses}{split.pushes > 0 ? `-${split.pushes}` : ''}
              </p>
              <div className="flex items-center gap-1 mt-0.5">
                {split.pct >= 52 ? (
                  <TrendingUp className="w-3 h-3 text-green-500" />
                ) : split.pct < 48 ? (
                  <TrendingDown className="w-3 h-3 text-red-500" />
                ) : null}
                <p className={`text-[10px] font-semibold ${pctColor(split.pct)}`}>
                  {split.pct}%
                </p>
              </div>
            </div>
          ))}
        </div>
        {/* O/U Record */}
        <div className="mt-2 flex items-center gap-3 px-2">
          <span className="text-[10px] text-slate-500 uppercase">O/U Record:</span>
          <span className="text-xs font-mono text-white">
            {data.ouRecord.over}-{data.ouRecord.under}{data.ouRecord.push > 0 ? `-${data.ouRecord.push}` : ''}
          </span>
          <span className={`text-[10px] font-semibold ${data.ouRecord.pct >= 55 ? 'text-green-400' : data.ouRecord.pct <= 45 ? 'text-blue-400' : 'text-slate-400'}`}>
            ({data.ouRecord.pct}% Over)
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl p-5 bg-slate-900/50 border border-slate-800">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-purple-500/20">
          <BarChart3 className="w-5 h-5 text-purple-500" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-white">ATS Matrix</h2>
          <p className="text-sm text-slate-400">Against-the-spread splits from historical data</p>
        </div>
      </div>
      
      <div className="grid md:grid-cols-2 gap-6">
        {renderTeamMatrix(awayData, awayAbbr)}
        {renderTeamMatrix(homeData, homeAbbr)}
      </div>
    </div>
  )
}
