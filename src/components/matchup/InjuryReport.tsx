'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react'

interface Injury {
  id: string
  playerId: string
  name: string
  team: string
  position: string
  status: 'Out' | 'Doubtful' | 'Questionable' | 'Probable' | 'IR' | 'Day-to-Day' | 'GTD'
  injury: string
  updated?: string
}

interface InjuryReportProps {
  sport: string
  homeTeam: string
  awayTeam: string
  homeTeamFull?: string
  awayTeamFull?: string
}

// Status priority for sorting (most severe first)
const STATUS_PRIORITY: Record<string, number> = {
  'Out': 1,
  'IR': 2,
  'Doubtful': 3,
  'Questionable': 4,
  'GTD': 5,
  'Day-to-Day': 6,
  'Probable': 7,
}

const getStatusStyle = (status: string) => {
  switch (status) {
    case 'Out':
    case 'IR':
      return 'bg-red-500/20 text-red-400'
    case 'Doubtful':
      return 'bg-red-500/15 text-red-300'
    case 'Questionable':
    case 'GTD':
    case 'Day-to-Day':
      return 'bg-amber-500/20 text-amber-400'
    case 'Probable':
      return 'bg-green-500/20 text-green-400'
    default:
      return 'bg-gray-500/20 text-gray-400'
  }
}

export default function InjuryReport({ sport, homeTeam, awayTeam, homeTeamFull, awayTeamFull }: InjuryReportProps) {
  const [injuries, setInjuries] = useState<Injury[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchInjuries = async () => {
      try {
        setLoading(true)
        // In production, this would filter by team
        const res = await fetch(`/api/injuries?sport=${sport.toUpperCase()}`)
        if (!res.ok) throw new Error('Failed to fetch injuries')
        
        const data = await res.json()
        
        // Filter injuries for the two teams in this matchup
        const relevantInjuries = (data.injuries || []).filter((inj: Injury) => 
          inj.team === homeTeam || inj.team === awayTeam
        )
        
        // Sort by status severity, then by name
        relevantInjuries.sort((a: Injury, b: Injury) => {
          const priorityA = STATUS_PRIORITY[a.status] || 99
          const priorityB = STATUS_PRIORITY[b.status] || 99
          if (priorityA !== priorityB) return priorityA - priorityB
          return a.name.localeCompare(b.name)
        })
        
        setInjuries(relevantInjuries)
      } catch (err) {
        console.error('Error fetching injuries:', err)
        setError('Unable to load injuries')
      } finally {
        setLoading(false)
      }
    }

    fetchInjuries()
  }, [sport, homeTeam, awayTeam])

  // Group injuries by team
  const homeInjuries = injuries.filter(inj => inj.team === homeTeam)
  const awayInjuries = injuries.filter(inj => inj.team === awayTeam)
  
  // Show first 3 by default, all when expanded
  const displayLimit = expanded ? Infinity : 3
  const totalInjuries = injuries.length
  const hasMore = totalInjuries > 3

  if (loading) {
    return (
      <div className="bg-[#0c0c14] rounded-xl border border-white/10 p-6">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-red-400" />
          Injury Report
        </h3>
        <div className="animate-pulse space-y-2">
          <div className="h-8 bg-white/5 rounded" />
          <div className="h-8 bg-white/5 rounded" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-[#0c0c14] rounded-xl border border-white/10 p-6">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-red-400" />
          Injury Report
        </h3>
        <div className="text-gray-500 text-sm">{error}</div>
      </div>
    )
  }

  const renderInjuryList = (teamInjuries: Injury[], teamName: string, limit: number) => {
    if (teamInjuries.length === 0) return null
    
    const displayInjuries = teamInjuries.slice(0, limit)
    
    return (
      <div className="space-y-1.5">
        <div className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-2">
          {teamName} ({teamInjuries.length})
        </div>
        {displayInjuries.map((inj, i) => (
          <Link
            key={`${inj.team}-${inj.name}-${i}`}
            href={`/player/${sport.toLowerCase()}/${inj.playerId || inj.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
            className="flex items-center justify-between p-2 rounded-lg bg-[#16161e] hover:bg-white/10 transition-colors group"
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className={`text-xs px-1.5 py-0.5 rounded font-semibold whitespace-nowrap ${getStatusStyle(inj.status)}`}>
                {inj.status}
              </span>
              <span className="text-white text-sm group-hover:text-orange-400 transition-colors truncate">
                {inj.name}
              </span>
              <span className="text-gray-500 text-xs">{inj.position}</span>
            </div>
            <span className="text-gray-500 text-xs whitespace-nowrap ml-2">{inj.injury}</span>
          </Link>
        ))}
      </div>
    )
  }

  return (
    <div className="bg-[#0c0c14] rounded-xl border border-white/10 p-6">
      <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
        <AlertTriangle className="w-5 h-5 text-red-400" />
        Injury Report
        {totalInjuries > 0 && (
          <span className="text-sm font-normal text-gray-500">
            ({totalInjuries} total)
          </span>
        )}
      </h3>
      
      {totalInjuries === 0 ? (
        <div className="text-gray-500 text-sm">No significant injuries reported</div>
      ) : (
        <div className="space-y-4">
          {/* Away Team Injuries */}
          {renderInjuryList(awayInjuries, awayTeamFull || awayTeam, displayLimit)}
          
          {/* Home Team Injuries */}
          {renderInjuryList(homeInjuries, homeTeamFull || homeTeam, displayLimit - awayInjuries.slice(0, displayLimit).length)}
          
          {/* Show More / Less Button */}
          {hasMore && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="w-full flex items-center justify-center gap-1 py-2 text-sm text-orange-400 hover:text-orange-300 transition-colors"
            >
              {expanded ? (
                <>Show Less <ChevronUp className="w-4 h-4" /></>
              ) : (
                <>Show All {totalInjuries} Injuries <ChevronDown className="w-4 h-4" /></>
              )}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
