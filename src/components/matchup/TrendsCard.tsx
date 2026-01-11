'use client'

import Link from 'next/link'
import { TrendingUp } from 'lucide-react'

interface Trend {
  description?: string
  text?: string
  confidence?: number
  result?: number
  edge?: number
}

interface TrendsCardProps {
  sport: string
  team: string
  trends?: Trend[]
  matched?: number
}

export default function TrendsCard({ sport, team, trends, matched }: TrendsCardProps) {
  if (!trends || trends.length === 0 || !matched || matched <= 0) {
    return null
  }

  return (
    <div className="bg-[#0c0c14] rounded-xl border border-white/10 p-6">
      <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
        <TrendingUp className="w-5 h-5 text-orange-500" />
        Betting Trends ({matched} matched)
      </h3>
      <div className="space-y-3">
        {trends.slice(0, 5).map((trend, i) => (
          <Link 
            key={i} 
            href={`/trends?sport=${sport.toLowerCase()}&team=${team}`}
            className="flex items-center justify-between p-3 bg-[#16161e] rounded-lg hover:bg-white/10 transition-colors group"
          >
            <span className="text-gray-300 group-hover:text-white transition-colors">
              {trend.description || trend.text}
            </span>
            <div className="flex items-center gap-2">
              <span className={`text-sm font-bold ${
                (trend.confidence || trend.result || 0) >= 70 ? 'text-green-400' : 'text-amber-400'
              }`}>
                {trend.confidence || trend.result}%
              </span>
              {trend.edge && (
                <span className="text-xs px-2 py-0.5 rounded bg-green-500/20 text-green-400">
                  +{trend.edge}% edge
                </span>
              )}
            </div>
          </Link>
        ))}
      </div>
      
      <Link 
        href={`/trends?sport=${sport.toLowerCase()}&team=${team}`}
        className="block mt-4 text-center text-sm text-orange-400 hover:text-orange-300 transition-colors"
      >
        View all {sport.toUpperCase()} trends →
      </Link>
    </div>
  )
}
