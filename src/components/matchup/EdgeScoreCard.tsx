'use client'

import Link from 'next/link'
import { Zap } from 'lucide-react'

interface EdgeScoreProps {
  gameId: string
  edgeScore?: {
    overall: number
    trendAlignment: number
    sharpSignal: number
    valueIndicator: number
  }
}

export default function EdgeScoreCard({ gameId, edgeScore }: EdgeScoreProps) {
  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-green-400'
    if (score >= 50) return 'text-amber-400'
    return 'text-gray-400'
  }

  if (!edgeScore || edgeScore.overall <= 0) {
    return (
      <div className="bg-[#0c0c14] rounded-xl border border-white/10 p-6">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5 text-amber-400" />
          Quick Signals
        </h3>
        <div className="text-gray-500 text-center py-4">
          Signals calculating...
        </div>
      </div>
    )
  }

  return (
    <div className="bg-[#0c0c14] rounded-xl border border-white/10 p-6">
      <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
        <Zap className="w-5 h-5 text-amber-400" />
        Quick Signals
      </h3>
      
      <Link 
        href={`/edge/${gameId}`}
        className="block space-y-4 hover:opacity-80 transition-opacity cursor-pointer group"
      >
        <div className="flex items-center justify-between">
          <span className="text-gray-400">Edge Score</span>
          <span className={`text-xl font-bold ${getScoreColor(edgeScore.overall)}`}>
            {edgeScore.overall}/100
          </span>
        </div>
        
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Trend Alignment</span>
            <span className="text-white">{edgeScore.trendAlignment}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Sharp Signal</span>
            <span className="text-white">{edgeScore.sharpSignal}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Value Indicator</span>
            <span className="text-white">{edgeScore.valueIndicator}</span>
          </div>
        </div>
        
        <div className="text-center text-sm text-orange-400 group-hover:text-orange-300 transition-colors">
          Click for detailed breakdown →
        </div>
      </Link>
    </div>
  )
}
