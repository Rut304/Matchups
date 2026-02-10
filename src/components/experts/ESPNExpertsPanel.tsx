'use client'

/**
 * ESPN Experts Panel - Real Data Component
 * Fetches LIVE expert picks and records from ESPN
 */

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Trophy, TrendingUp, Loader2, RefreshCcw, ExternalLink, Award, Target, Flame } from 'lucide-react'

interface ESPNExpert {
  id: string
  name: string
  fullName: string
  headshot: string
  weekRecord: string
  overallRecord: string
  winPct: number
  wins: number
  losses: number
  network: string
}

interface ExpertsData {
  success: boolean
  source: string
  title: string
  sport: string
  week: string
  experts: ESPNExpert[]
  scrapedAt: string
}

export function ESPNExpertsPanel({ 
  sport = 'nfl',
  compact = false 
}: { 
  sport?: string
  compact?: boolean
}) {
  const [data, setData] = useState<ExpertsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedSport, setSelectedSport] = useState(sport)

  const fetchExperts = async (sportToFetch: string) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/experts?sport=${sportToFetch}`)
      const json = await res.json()
      if (json.success) {
        setData(json)
      } else {
        setError(json.error || 'Failed to fetch experts')
      }
    } catch (err) {
      setError('Failed to connect to expert data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchExperts(selectedSport)
  }, [selectedSport])

  const sports = [
    { id: 'nfl', label: 'NFL' },
    { id: 'nba', label: 'NBA' },
    { id: 'ncaaf', label: 'NCAAF' },
    { id: 'ncaab', label: 'NCAAB' },
  ]

  if (loading) {
    return (
      <div className="bg-[#0D0D0F] border border-[#222] rounded-lg p-6">
        <div className="flex items-center justify-center gap-2 text-gray-400">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Loading real expert data from ESPN...</span>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="bg-[#0D0D0F] border border-[#222] rounded-lg p-6">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error || 'No data available'}</p>
          <button
            onClick={() => fetchExperts(selectedSport)}
            className="px-4 py-2 bg-[#1A1A1C] hover:bg-[#222] border border-[#333] rounded-lg flex items-center gap-2 mx-auto"
          >
            <RefreshCcw className="w-4 h-4" />
            Retry
          </button>
        </div>
      </div>
    )
  }

  const topExperts = data.experts.slice(0, compact ? 5 : 10)
  const bestExpert = data.experts[0]

  return (
    <div className="bg-gradient-to-br from-[#0D0D0F] to-[#111113] border border-[#222] rounded-lg overflow-hidden">
      {/* Header */}
      <div className="border-b border-[#222] p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-red-600 to-red-800 rounded-lg flex items-center justify-center">
              <Trophy className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-white">ESPN Expert Picks</h3>
              <p className="text-xs text-gray-500">Real verified records • Updated live</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs px-2 py-1 bg-green-500/20 text-green-400 rounded-full flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
              LIVE
            </span>
          </div>
        </div>

        {/* Sport Tabs */}
        <div className="flex gap-1">
          {sports.map((s) => (
            <button
              key={s.id}
              onClick={() => setSelectedSport(s.id)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                selectedSport === s.id
                  ? 'bg-red-500/20 text-red-400 border border-red-500/50'
                  : 'bg-[#1A1A1C] text-gray-400 hover:bg-[#222] border border-transparent'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Featured Expert */}
      {bestExpert && !compact && (
        <div className="p-4 bg-gradient-to-r from-yellow-500/10 to-transparent border-b border-[#222]">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Image
                src={bestExpert.headshot}
                alt={bestExpert.fullName}
                width={64}
                height={64}
                className="rounded-full border-2 border-yellow-500"
              />
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center">
                <Award className="w-3 h-3 text-black" />
              </div>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-yellow-400 text-xs font-bold uppercase tracking-wider">
                  🏆 Top Expert
                </span>
              </div>
              <h4 className="text-lg font-bold text-white">{bestExpert.fullName}</h4>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-2xl font-bold text-green-400">{bestExpert.winPct}%</span>
                <span className="text-gray-400">
                  {bestExpert.overallRecord} ({data.sport} Playoffs)
                </span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-500">This Week</div>
              <div className="text-lg font-bold text-white">{bestExpert.weekRecord}</div>
            </div>
          </div>
        </div>
      )}

      {/* Expert List */}
      <div className="divide-y divide-[#1A1A1C]">
        {topExperts.map((expert, index) => (
          <div
            key={expert.id}
            className={`p-3 flex items-center gap-3 hover:bg-[#1A1A1C] transition-colors ${
              index === 0 && compact ? 'bg-yellow-500/5' : ''
            }`}
          >
            {/* Rank */}
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
              index === 0 ? 'bg-yellow-500/20 text-yellow-400' :
              index === 1 ? 'bg-gray-400/20 text-gray-300' :
              index === 2 ? 'bg-orange-700/20 text-orange-400' :
              'bg-[#1A1A1C] text-gray-500'
            }`}>
              {index + 1}
            </div>

            {/* Photo & Name */}
            <Image
              src={expert.headshot}
              alt={expert.fullName}
              width={40}
              height={40}
              className="rounded-full"
            />
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-white truncate">{expert.fullName}</div>
              <div className="text-xs text-gray-500">{expert.network}</div>
            </div>

            {/* Stats */}
            <div className="text-right">
              <div className={`font-bold ${
                expert.winPct >= 70 ? 'text-green-400' :
                expert.winPct >= 55 ? 'text-yellow-400' :
                'text-red-400'
              }`}>
                {expert.winPct}%
              </div>
              <div className="text-xs text-gray-500">{expert.overallRecord}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-[#222] bg-[#0A0A0B]">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>
            Data from ESPN • {data.experts.length} experts tracked
          </span>
          <a
            href={`https://www.espn.com/${selectedSport}/picks`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-red-400 hover:text-red-300"
          >
            View on ESPN
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  )
}
