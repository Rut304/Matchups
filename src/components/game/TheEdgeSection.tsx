'use client'

import { Zap, Target, Info, CheckCircle, AlertTriangle, Clock, RefreshCw } from 'lucide-react'

interface IntelligenceData {
  edgeScore: number
  edgeLabel: string
  edgeColor: string
  topDataPoints: Array<{ point: string; value: string; impact: 'positive' | 'negative' | 'neutral' }>
  quickTakes: {
    spread: string; spreadConfidence: number; total: string; totalConfidence: number
    sharpestPick: string | { pick: string; reasoning?: string }
  }
  clv?: { grade: string; description: string }
  sharpMoney?: { side: string; reverseLineMovement: boolean; strength: string }
  aiAnalysis?: {
    summary: string
    winProbability: { home: number; away: number }
    projectedScore: { home: number; away: number }
    spreadAnalysis: { pick: string; confidence: number }
    totalAnalysis: { pick: string; confidence: number }
    betGrades?: { spread: string; total: string; ml: string }
    keyEdges?: string[]
    majorRisks?: string[]
  }
  loading: boolean
  error: string | null
}

interface TheEdgeSectionProps {
  intelligence: IntelligenceData
  homeAbbr: string
  awayAbbr: string
  homeName: string
  awayName: string
  sport: string
}

export default function TheEdgeSection({ intelligence, homeAbbr, awayAbbr, homeName, awayName, sport }: TheEdgeSectionProps) {
  const edgeScore = intelligence.edgeScore || 0
  const edgeLabel = intelligence.edgeLabel || 'Analyzing'

  return (
    <div className="rounded-xl p-5 mb-6 bg-gradient-to-br from-orange-500/5 to-slate-900/50 border border-orange-500/30">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-orange-500/20">
            <Zap className="w-5 h-5 text-orange-500" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              THE EDGE
              <span className="text-xs px-2 py-0.5 bg-orange-500/20 text-orange-400 rounded-full font-normal">
                {sport.toUpperCase()} Analysis
              </span>
            </h3>
            <p className="text-xs text-slate-500">12 data points • AI-powered</p>
          </div>
        </div>
        <div className="text-right">
          <div className={`text-3xl font-bold ${
            edgeScore >= 70 ? 'text-green-400' : edgeScore >= 50 ? 'text-orange-400' : 'text-slate-400'
          }`}>
            {edgeScore}
          </div>
          <p className="text-xs text-slate-500">Edge Score</p>
        </div>
      </div>

      {/* THE EDGE PICK — confidence bar */}
      {intelligence.quickTakes && (
        <div className="mb-4">
          {(() => {
            const pick = intelligence.quickTakes.spread || intelligence.quickTakes.total || intelligence.quickTakes.sharpestPick
            const confidence = intelligence.quickTakes.spreadConfidence || intelligence.quickTakes.totalConfidence || 50
            const isNoBet = confidence < 55

            return (
              <>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-orange-500" />
                    <span className="text-sm font-semibold text-orange-400">THE EDGE PICK</span>
                  </div>
                  {isNoBet ? (
                    <span className="text-sm font-bold text-slate-500">No Clear Edge — Pass</span>
                  ) : (
                    <span className="text-sm font-bold text-white">{typeof pick === 'string' ? pick : (pick as { pick: string })?.pick || '-'}</span>
                  )}
                </div>
                <div className="h-3 rounded-full overflow-hidden bg-slate-800">
                  <div 
                    className={`h-full rounded-full transition-all ${
                      isNoBet ? 'bg-slate-600' : confidence >= 70 ? 'bg-green-500' : 'bg-orange-500'
                    }`}
                    style={{ width: `${confidence}%` }}
                  />
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  {isNoBet 
                    ? `${Math.round(confidence)}% confidence — below our 55% threshold for a recommendation`
                    : `${Math.round(confidence)}% confidence`}
                </p>
              </>
            )
          })()}
        </div>
      )}

      {/* Sharpest Pick */}
      {intelligence.quickTakes.sharpestPick && (
        <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-green-400" />
            <span className="text-sm font-semibold text-green-400">SHARPEST PICK</span>
            <div className="group relative">
              <Info className="w-3.5 h-3.5 text-slate-500 cursor-help" />
              <div className="invisible group-hover:visible absolute bottom-full left-0 mb-2 w-56 p-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-300 z-10 shadow-xl">
                <p>The bet with the strongest edge based on sharp money, line value, and trend alignment.</p>
              </div>
            </div>
          </div>
          <p className="text-lg font-bold text-white">
            {typeof intelligence.quickTakes.sharpestPick === 'string' 
              ? intelligence.quickTakes.sharpestPick 
              : intelligence.quickTakes.sharpestPick.pick || '-'}
          </p>
          {typeof intelligence.quickTakes.sharpestPick === 'object' && intelligence.quickTakes.sharpestPick.reasoning && (
            <p className="text-sm text-slate-400 mt-1">{intelligence.quickTakes.sharpestPick.reasoning}</p>
          )}
        </div>
      )}

      {/* AI Analysis */}
      {intelligence.aiAnalysis && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/50">
            <p className="text-slate-300 leading-relaxed">{intelligence.aiAnalysis.summary}</p>
          </div>
          
          {/* Win Probability & Projected Score */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-800/50">
              <p className="text-xs text-slate-500 mb-2">WIN PROBABILITY</p>
              <div className="flex items-center justify-between">
                <div className="text-center">
                  <p className="text-sm text-slate-400">{awayAbbr}</p>
                  <p className="text-xl font-bold text-white">{Math.round(intelligence.aiAnalysis.winProbability.away * 100)}%</p>
                </div>
                <div className="text-slate-600">vs</div>
                <div className="text-center">
                  <p className="text-sm text-slate-400">{homeAbbr}</p>
                  <p className="text-xl font-bold text-white">{Math.round(intelligence.aiAnalysis.winProbability.home * 100)}%</p>
                </div>
              </div>
            </div>
            <div className="p-4 rounded-xl bg-slate-800/50">
              <p className="text-xs text-slate-500 mb-2">PROJECTED SCORE</p>
              <div className="flex items-center justify-between">
                <div className="text-center">
                  <p className="text-sm text-slate-400">{awayAbbr}</p>
                  <p className="text-xl font-bold text-orange-400">{intelligence.aiAnalysis.projectedScore.away}</p>
                </div>
                <div className="text-slate-600">-</div>
                <div className="text-center">
                  <p className="text-sm text-slate-400">{homeAbbr}</p>
                  <p className="text-xl font-bold text-orange-400">{intelligence.aiAnalysis.projectedScore.home}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Bet Picks with Grades */}
          <div className="grid md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-gradient-to-br from-orange-500/10 to-transparent border border-orange-500/20">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-slate-500">SPREAD</p>
                <GradeBadge grade={intelligence.aiAnalysis.betGrades?.spread || 'C'} />
              </div>
              <p className="text-lg font-bold text-white mb-1">{intelligence.aiAnalysis.spreadAnalysis.pick}</p>
              <p className="text-xs text-slate-400">{Math.round(intelligence.aiAnalysis.spreadAnalysis.confidence * 100)}% confident</p>
            </div>
            <div className="p-4 rounded-xl bg-gradient-to-br from-green-500/10 to-transparent border border-green-500/20">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-slate-500">TOTAL</p>
                <GradeBadge grade={intelligence.aiAnalysis.betGrades?.total || 'C'} />
              </div>
              <p className="text-lg font-bold text-white mb-1">{intelligence.aiAnalysis.totalAnalysis.pick}</p>
              <p className="text-xs text-slate-400">{Math.round(intelligence.aiAnalysis.totalAnalysis.confidence * 100)}% confident</p>
            </div>
            <div className="p-4 rounded-xl bg-gradient-to-br from-purple-500/10 to-transparent border border-purple-500/20">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-slate-500">MONEYLINE</p>
                <GradeBadge grade={intelligence.aiAnalysis.betGrades?.ml || 'C'} />
              </div>
              <p className="text-lg font-bold text-white mb-1">{awayAbbr} or {homeAbbr}</p>
              <p className="text-xs text-slate-400">Based on value analysis</p>
            </div>
          </div>

          {/* Key Edges & Risks */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-green-500/5 border border-green-500/20">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <p className="text-sm font-semibold text-green-400">KEY EDGES</p>
              </div>
              <ul className="space-y-2">
                {intelligence.aiAnalysis.keyEdges?.slice(0, 3).map((edge, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                    <span className="text-green-400 mt-0.5">•</span>
                    {edge}
                  </li>
                ))}
              </ul>
            </div>
            <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/20">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-4 h-4 text-red-400" />
                <p className="text-sm font-semibold text-red-400">RISKS TO CONSIDER</p>
              </div>
              <ul className="space-y-2">
                {intelligence.aiAnalysis.majorRisks?.slice(0, 3).map((risk, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                    <span className="text-red-400 mt-0.5">•</span>
                    {risk}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* CLV Summary */}
      {intelligence.clv && intelligence.clv.description && intelligence.clv.description !== 'No CLV data available' && (
        <div className="mt-4 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold text-blue-400">CLV ANALYSIS</span>
            <span className={`px-1.5 py-0.5 text-xs rounded ${
              intelligence.clv.grade === 'excellent' ? 'bg-green-500/20 text-green-400' :
              intelligence.clv.grade === 'good' ? 'bg-blue-500/20 text-blue-400' :
              'bg-slate-700 text-slate-400'
            }`}>{intelligence.clv.grade?.toUpperCase()}</span>
          </div>
          <p className="text-sm text-slate-300">{intelligence.clv.description}</p>
        </div>
      )}

      {/* Top Data Points fallback */}
      {!intelligence.aiAnalysis && intelligence.topDataPoints.length > 0 && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
          {intelligence.topDataPoints.map((dp, i) => (
            <div key={i} className={`p-3 rounded-lg border ${
              dp.impact === 'positive' ? 'bg-green-500/5 border-green-500/20' :
              dp.impact === 'negative' ? 'bg-red-500/5 border-red-500/20' :
              'bg-slate-800/50 border-slate-700'
            }`}>
              <p className={`text-xs font-semibold mb-1 ${
                dp.impact === 'positive' ? 'text-green-400' :
                dp.impact === 'negative' ? 'text-red-400' : 'text-slate-400'
              }`}>{dp.point}</p>
              <p className="text-sm text-white">{dp.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Coming Soon State */}
      {!intelligence.loading && !intelligence.aiAnalysis && intelligence.topDataPoints.length === 0 && !intelligence.sharpMoney?.reverseLineMovement && (
        <div className="p-6 rounded-xl bg-slate-800/30 border border-slate-700/50 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Clock className="w-5 h-5 text-slate-500" />
            <span className="text-sm font-semibold text-slate-400">DATA COMING SOON</span>
          </div>
          <p className="text-sm text-slate-500">
            Real-time betting intelligence data is being collected for this matchup. 
            Check back closer to game time for sharp money signals, line movement analysis, and betting splits.
          </p>
        </div>
      )}

      {/* Sharp Money / RLM indicator */}
      {intelligence.sharpMoney?.reverseLineMovement && (
        <div className="mt-4 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-yellow-400" />
            <span className="text-sm font-semibold text-yellow-400">REVERSE LINE MOVEMENT DETECTED</span>
          </div>
          <p className="text-sm text-slate-300 mt-1">
            Sharp money on <span className="font-semibold text-white">
              {intelligence.sharpMoney.side === 'home' ? homeName : awayName}
            </span> • 
            Strength: <span className="font-semibold text-yellow-400">{intelligence.sharpMoney.strength}</span>
          </p>
        </div>
      )}

      {/* Loading State */}
      {intelligence.loading && (
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="w-6 h-6 text-orange-500 animate-spin mr-3" />
          <span className="text-slate-400">Analyzing 12 key data points...</span>
        </div>
      )}
    </div>
  )
}

function GradeBadge({ grade }: { grade: string }) {
  return (
    <span className={`px-2 py-0.5 text-xs font-bold rounded ${
      grade === 'A' ? 'bg-green-500/20 text-green-400' :
      grade === 'B' ? 'bg-blue-500/20 text-blue-400' :
      grade === 'C' ? 'bg-yellow-500/20 text-yellow-400' :
      'bg-red-500/20 text-red-400'
    }`}>
      Grade {grade}
    </span>
  )
}
