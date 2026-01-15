'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { AlertCircle } from 'lucide-react'

interface Injury {
  id: string
  name: string
  team: string
  position: string
  sport: string
  injury: string
  status: string
}

export function HomeInjuries() {
  const [injuries, setInjuries] = useState<Injury[]>([])
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch NFL and NBA injuries, filter to high-impact (Out, Doubtful, Questionable)
        const res = await fetch('/api/injuries?sport=all')
        const data = await res.json()
        // Take top 8 injuries sorted by status severity
        const sorted = (data.injuries || [])
          .filter((i: Injury) => ['Out', 'IR', 'Doubtful', 'Questionable', 'GTD', 'Day-to-Day'].includes(i.status))
          .slice(0, 8)
        setInjuries(sorted)
      } catch (error) {
        console.error('Error fetching injuries:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])
  
  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'Out':
      case 'IR':
        return { bg: 'rgba(255,68,85,0.2)', color: '#FF4455' }
      case 'Doubtful':
        return { bg: 'rgba(255,68,85,0.15)', color: '#FF6655' }
      case 'Questionable':
      case 'GTD':
      case 'Day-to-Day':
        return { bg: 'rgba(255,107,0,0.2)', color: '#FF6B00' }
      case 'Probable':
        return { bg: 'rgba(0,255,136,0.15)', color: '#00FF88' }
      default:
        return { bg: 'rgba(255,255,255,0.1)', color: '#A0A0B0' }
    }
  }
  
  const getStatusAbbrev = (status: string) => {
    switch (status) {
      case 'Out': return 'O'
      case 'IR': return 'IR'
      case 'Doubtful': return 'D'
      case 'Questionable': return 'Q'
      case 'GTD': return 'GTD'
      case 'Day-to-Day': return 'DTD'
      case 'Probable': return 'P'
      default: return '?'
    }
  }
  
  if (loading) {
    return (
      <div className="rounded-2xl p-5 bg-[#0c0c14] border border-white/5">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-700/30 rounded w-32 mb-4"></div>
          {[1,2,3,4].map(i => (
            <div key={i} className="h-10 bg-gray-700/20 rounded mb-2"></div>
          ))}
        </div>
      </div>
    )
  }
  
  return (
    <div className="rounded-2xl p-5 bg-[#0c0c14] border border-white/5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-[18px] h-[18px] text-red-400" />
          <h3 className="font-bold text-white">Key Injuries</h3>
        </div>
        <Link href="/injuries" className="text-xs font-semibold text-red-400">
          All Injuries
        </Link>
      </div>
      
      <div className="space-y-2 max-h-[200px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
        {injuries.length === 0 ? (
          <p className="text-gray-500 text-sm">No injury updates available</p>
        ) : (
          injuries.map((injury) => {
            const statusStyle = getStatusStyle(injury.status)
            return (
              <div key={injury.id} className="flex items-center justify-between py-2 hover:bg-white/5 transition-colors rounded px-1">
                <div>
                  <div className="font-semibold text-sm text-white">{injury.name}</div>
                  <div className="text-xs text-gray-500">{injury.team} • {injury.injury}</div>
                </div>
                <span className="w-8 h-6 rounded flex items-center justify-center text-xs font-bold"
                      style={{ background: statusStyle.bg, color: statusStyle.color }}>
                  {getStatusAbbrev(injury.status)}
                </span>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
