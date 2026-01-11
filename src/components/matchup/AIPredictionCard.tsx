'use client'

import { Target, TrendingUp } from 'lucide-react'
import type { AIPrediction } from '@/types/sports'

interface AIPredictionCardProps {
  prediction?: AIPrediction | null
  showBar?: boolean
  compact?: boolean
}

export default function AIPredictionCard({ prediction, showBar = true, compact = false }: AIPredictionCardProps) {
  if (!prediction) return null

  if (compact) {
    return (
      <div className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-orange-500/10 to-transparent border border-orange-500/20">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-orange-500" />
          <span className="text-white text-sm font-medium">AI Pick:</span>
          <span className="text-orange-400 font-bold">{prediction.selection}</span>
        </div>
        <span className="text-sm text-gray-400">{prediction.confidence}%</span>
      </div>
    )
  }

  return (
    <div className="p-4 rounded-xl bg-gradient-to-r from-orange-500/10 via-orange-500/5 to-transparent border border-orange-500/20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center">
            <Target className="w-5 h-5 text-orange-500" />
          </div>
          <span className="text-white font-semibold">AI Prediction</span>
        </div>
        <div className="text-orange-400 font-bold text-lg">{prediction.selection}</div>
      </div>
      
      {showBar && (
        <div className="mt-3">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>{prediction.confidence}% confidence</span>
            <span>{prediction.supportingTrends} supporting trends</span>
          </div>
          <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-orange-500 to-orange-400 rounded-full transition-all duration-500"
              style={{ width: `${prediction.confidence}%` }}
            />
          </div>
        </div>
      )}
      
      {prediction.reasoning && prediction.reasoning.length > 0 && (
        <div className="mt-3 space-y-1">
          {prediction.reasoning.slice(0, 3).map((reason, i) => (
            <div key={i} className="flex items-start gap-2 text-sm">
              <TrendingUp className="w-3 h-3 text-orange-400 mt-0.5 flex-shrink-0" />
              <span className="text-gray-400">{reason}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
