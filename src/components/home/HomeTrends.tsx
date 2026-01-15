'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { BarChart3 } from 'lucide-react'

interface Trend {
  id: string
  name: string
  description: string
  sport: string
  record: string
  roi: number
  confidence: number
  isHot: boolean
}

export function HomeTrends() {
  const [trends, setTrends] = useState<Trend[]>([])
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/trends?limit=8&hot=true')
        const data = await res.json()
        setTrends(data.trends || [])
      } catch (error) {
        console.error('Error fetching trends:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])
  
  const sportColors: Record<string, { bg: string; text: string }> = {
    NFL: { bg: 'rgba(255,107,0,0.15)', text: '#FF6B00' },
    NBA: { bg: 'rgba(0,168,255,0.15)', text: '#00A8FF' },
    NHL: { bg: 'rgba(255,51,102,0.15)', text: '#FF3366' },
    MLB: { bg: 'rgba(0,200,83,0.15)', text: '#00C853' },
    NCAAF: { bg: 'rgba(255,107,0,0.15)', text: '#FF6B00' },
    NCAAB: { bg: 'rgba(0,168,255,0.15)', text: '#00A8FF' },
  }
  
  if (loading) {
    return (
      <div className="rounded-2xl p-5 bg-[#0c0c14] border border-white/5">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-700/30 rounded w-32 mb-4"></div>
          {[1,2,3,4].map(i => (
            <div key={i} className="h-16 bg-gray-700/20 rounded mb-2"></div>
          ))}
        </div>
      </div>
    )
  }
  
  return (
    <div className="rounded-2xl p-5 bg-[#0c0c14] border border-white/5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-[18px] h-[18px] text-green-400" />
          <h3 className="font-bold text-white">Hot Trends</h3>
        </div>
        <Link href="/trends" className="text-xs font-semibold text-green-400">View All</Link>
      </div>
      
      <div className="space-y-2 max-h-[320px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
        {trends.length === 0 ? (
          <p className="text-gray-500 text-sm">No hot trends available</p>
        ) : (
          trends.map((trend) => {
            const colors = sportColors[trend.sport] || { bg: 'rgba(255,255,255,0.1)', text: '#A0A0B0' }
            return (
              <Link key={trend.id} href={`/trends?sport=${trend.sport.toLowerCase()}`} 
                    className="block p-3 rounded-lg transition-all hover:bg-white/5 bg-white/[0.02]">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs px-1.5 py-0.5 rounded font-semibold"
                        style={{ background: colors.bg, color: colors.text }}>
                    {trend.sport}
                  </span>
                  <span className="text-lg font-black text-green-400">
                    {trend.roi > 0 ? `+${trend.roi.toFixed(1)}%` : '-'}
                  </span>
                </div>
                <div className="text-sm text-gray-400">{trend.name || trend.description}</div>
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex-1 h-1.5 rounded-full overflow-hidden bg-white/10">
                    <div className="h-full rounded-full bg-green-400" style={{ width: `${Math.min(trend.confidence || 50, 100)}%` }} />
                  </div>
                  <span className="text-xs font-mono text-green-400">{trend.record || '-'}</span>
                </div>
              </Link>
            )
          })
        )}
      </div>
    </div>
  )
}
