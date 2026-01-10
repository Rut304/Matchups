'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { 
  ArrowLeft, Zap, TrendingUp, TrendingDown, Target, 
  Activity, BarChart3, Shield, AlertTriangle, Brain,
  CheckCircle, XCircle, Minus
} from 'lucide-react'

// =============================================================================
// TYPES
// =============================================================================

interface EdgeBreakdown {
  overall: number
  trendAlignment: number
  sharpSignal: number
  valueIndicator: number
  components: EdgeComponent[]
  recommendation: {
    pick: string
    confidence: number
    reasoning: string
  }
  warnings: string[]
}

interface EdgeComponent {
  name: string
  score: number
  maxScore: number
  status: 'positive' | 'negative' | 'neutral'
  detail: string
}

// =============================================================================
// COMPONENT
// =============================================================================

export default function EdgeDetailPage({ params }: { params: Promise<{ gameId: string }> }) {
  const { gameId } = use(params)
  
  const [edge, setEdge] = useState<EdgeBreakdown | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // In production, fetch from API
    // For now, generate mock data based on gameId
    const mockEdge: EdgeBreakdown = {
      overall: 72,
      trendAlignment: 78,
      sharpSignal: 68,
      valueIndicator: 70,
      components: [
        { name: 'ATS Trend History', score: 8, maxScore: 10, status: 'positive', detail: 'Team is 7-2 ATS in last 9 games' },
        { name: 'Home/Away Split', score: 7, maxScore: 10, status: 'positive', detail: 'Strong home record of 5-1 ATS' },
        { name: 'Public vs Sharp', score: 6, maxScore: 10, status: 'positive', detail: '68% sharp money on this side' },
        { name: 'Line Movement', score: 5, maxScore: 10, status: 'neutral', detail: 'Line moved from -3 to -3.5' },
        { name: 'Situational Spots', score: 8, maxScore: 10, status: 'positive', detail: 'Revenge game + divisional matchup' },
        { name: 'Key Injuries', score: 4, maxScore: 10, status: 'negative', detail: 'Starting WR questionable' },
        { name: 'Weather Factor', score: 9, maxScore: 10, status: 'positive', detail: 'Ideal conditions, no impact expected' },
        { name: 'Total Trend', score: 6, maxScore: 10, status: 'neutral', detail: 'OVER 5-5 in last 10' },
        { name: 'Historical H2H', score: 7, maxScore: 10, status: 'positive', detail: '4-1 ATS vs this opponent' },
        { name: 'Rest Advantage', score: 7, maxScore: 10, status: 'positive', detail: '7 days rest vs 4 days' },
      ],
      recommendation: {
        pick: 'HOME -3.5',
        confidence: 72,
        reasoning: 'Strong trend alignment with sharp money support. Home team has covered in 7 of last 9 and dominates this matchup historically. The injury concern is notable but not significant enough to fade this spot. Value indicator shows the line is fair, making this a high-confidence play.'
      },
      warnings: [
        'WR1 listed as questionable - monitor injury report',
        'Public heavily on this side (72%) - potential RLM trap',
      ]
    }
    
    setEdge(mockEdge)
    setLoading(false)
  }, [gameId])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050508] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!edge) {
    return (
      <div className="min-h-screen bg-[#050508] flex flex-col items-center justify-center gap-4">
        <p className="text-gray-400">Edge data not found</p>
        <Link href={`/nfl/matchups/${gameId}`} className="text-orange-500 hover:underline">
          ← Back to matchup
        </Link>
      </div>
    )
  }

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-green-400'
    if (score >= 50) return 'text-amber-400'
    return 'text-red-400'
  }

  const getStatusIcon = (status: 'positive' | 'negative' | 'neutral') => {
    switch (status) {
      case 'positive': return <CheckCircle className="w-5 h-5 text-green-400" />
      case 'negative': return <XCircle className="w-5 h-5 text-red-400" />
      default: return <Minus className="w-5 h-5 text-gray-400" />
    }
  }

  return (
    <div className="min-h-screen bg-[#050508]">
      {/* Header */}
      <div className="border-b border-white/5 bg-[#0a0a12]">
        <div className="max-w-[1200px] mx-auto px-4 py-6">
          <Link 
            href={`/nfl/matchups/${gameId}`}
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back to Matchup</span>
          </Link>

          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center">
              <Zap className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-white">Edge Score Breakdown</h1>
              <p className="text-gray-500">Detailed analysis of betting edge indicators</p>
            </div>
          </div>

          {/* Overall Score */}
          <div className="grid grid-cols-4 gap-4 mt-6">
            <div className="bg-white/5 rounded-xl p-6 text-center border-2 border-orange-500/30">
              <div className={`text-5xl font-black ${getScoreColor(edge.overall)}`}>{edge.overall}</div>
              <div className="text-sm text-gray-500 mt-1">Overall Edge</div>
            </div>
            <div className="bg-white/5 rounded-xl p-6 text-center">
              <div className={`text-4xl font-bold ${getScoreColor(edge.trendAlignment)}`}>{edge.trendAlignment}</div>
              <div className="text-sm text-gray-500 mt-1">Trend Alignment</div>
            </div>
            <div className="bg-white/5 rounded-xl p-6 text-center">
              <div className={`text-4xl font-bold ${getScoreColor(edge.sharpSignal)}`}>{edge.sharpSignal}</div>
              <div className="text-sm text-gray-500 mt-1">Sharp Signal</div>
            </div>
            <div className="bg-white/5 rounded-xl p-6 text-center">
              <div className={`text-4xl font-bold ${getScoreColor(edge.valueIndicator)}`}>{edge.valueIndicator}</div>
              <div className="text-sm text-gray-500 mt-1">Value Indicator</div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-[1200px] mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main - Components */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-[#0c0c14] rounded-xl border border-white/10 p-6">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-orange-500" />
                Edge Components
              </h2>
              
              <div className="space-y-4">
                {edge.components.map((component, i) => (
                  <div key={i} className="bg-[#16161e] rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(component.status)}
                        <span className="font-medium text-white">{component.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-lg font-bold ${
                          component.score >= 7 ? 'text-green-400' : 
                          component.score >= 5 ? 'text-amber-400' : 'text-red-400'
                        }`}>
                          {component.score}
                        </span>
                        <span className="text-gray-500">/ {component.maxScore}</span>
                      </div>
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="h-2 bg-gray-700 rounded-full overflow-hidden mb-2">
                      <div 
                        className={`h-full rounded-full transition-all ${
                          component.score >= 7 ? 'bg-green-500' : 
                          component.score >= 5 ? 'bg-amber-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${(component.score / component.maxScore) * 100}%` }}
                      />
                    </div>
                    
                    <p className="text-sm text-gray-400">{component.detail}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* AI Recommendation */}
            <div className="bg-gradient-to-br from-orange-500/20 to-purple-500/20 rounded-xl border border-orange-500/30 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Brain className="w-6 h-6 text-orange-500" />
                <h3 className="text-lg font-bold text-white">AI Recommendation</h3>
              </div>
              
              <div className="mb-4">
                <div className="text-2xl font-black text-orange-400 mb-1">{edge.recommendation.pick}</div>
                <div className="flex items-center gap-2">
                  <div className="text-sm text-gray-400">{edge.recommendation.confidence}% confidence</div>
                  <div className="h-1 flex-1 bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-orange-500 rounded-full"
                      style={{ width: `${edge.recommendation.confidence}%` }}
                    />
                  </div>
                </div>
              </div>
              
              <p className="text-sm text-gray-300 leading-relaxed">{edge.recommendation.reasoning}</p>
            </div>

            {/* Warnings */}
            {edge.warnings.length > 0 && (
              <div className="bg-red-500/10 rounded-xl border border-red-500/30 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                  <h3 className="text-lg font-bold text-white">Warnings</h3>
                </div>
                
                <div className="space-y-2">
                  {edge.warnings.map((warning, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm text-gray-300">
                      <span className="text-red-400">•</span>
                      <span>{warning}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Score Legend */}
            <div className="bg-[#0c0c14] rounded-xl border border-white/10 p-6">
              <h3 className="text-lg font-bold text-white mb-4">Score Guide</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">70-100</span>
                  <span className="text-green-400 font-semibold">Strong Edge ✓</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">50-69</span>
                  <span className="text-amber-400 font-semibold">Moderate Edge</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">0-49</span>
                  <span className="text-red-400 font-semibold">Weak/No Edge</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
