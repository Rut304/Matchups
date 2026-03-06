'use client'

/**
 * THE EDGE — v2 Command Center
 * Premium sports betting intelligence dashboard.
 * Surfaces ALL 12 data points from the intelligence API:
 *   Edge Score (7-factor breakdown), Betting Splits (spread/total/ML),
 *   CLV, Sharp Money/RLM, Situational Spots, Key Numbers,
 *   Line Movement, AI Analysis, O/U Trends, ATS Records, H2H, Weather/Injuries.
 *
 * Design: Dark trading-desk aesthetic, neon accents, data-dense but readable.
 */

import { useState } from 'react'
import {
  Zap, Target, Info, CheckCircle, AlertTriangle, Clock, RefreshCw,
  TrendingUp, TrendingDown, DollarSign, BarChart3, Activity,
  Shield, Wind, Thermometer, ChevronDown, ChevronUp, Eye, Percent, Users
} from 'lucide-react'

/* ═══════════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════════ */

interface SplitData {
  ticketPct?: number
  moneyPct?: number
  sharpSide?: string
  reverseLineMovement?: boolean
  rlmStrength?: string
}

interface IntelligenceData {
  edgeScore: number
  edgeLabel: string
  edgeColor: string
  topDataPoints: Array<{ point: string; value: string; impact: 'positive' | 'negative' | 'neutral' }>
  quickTakes: {
    spread: string; spreadConfidence: number; total: string; totalConfidence: number
    sharpestPick: string | { pick: string; reasoning?: string }
  }
  clv?: {
    grade: string; description: string
    spreadCLV?: number; totalCLV?: number; mlCLV?: number
    openSpread?: number; currentSpread?: number; openTotal?: number; currentTotal?: number
  }
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
    propPicks?: Array<{ player: string; prop: string; pick: string; confidence: number; reasoning?: string }>
  }
  loading: boolean
  error: string | null
  // v2 fields
  edgeBreakdown?: { clv?: number; sharpSignal?: number; trendAlignment?: number; situational?: number; injuries?: number; weather?: number; h2h?: number } | null
  topEdge?: { pick: string; reasoning?: string; confidence?: number } | null
  splits?: { spread?: SplitData; total?: SplitData; moneyline?: SplitData } | null
  situational?: { letdownSpot?: boolean; lookaheadSpot?: boolean; sandwichSpot?: boolean; trapGame?: boolean; travelMiles?: number; homeStandLength?: number; roadTripLength?: number; restDaysDiff?: number } | null
  keyNumbers?: { spreadProximity?: Array<{ number: number; distance: number; insight?: string }>; totalProximity?: Array<{ number: number; distance: number; insight?: string }> } | null
  lineMovement?: { spreadMove?: number; totalMove?: number; mlMove?: number; timeline?: Array<{ time: string; spread?: number; total?: number }> } | null
  ouTrends?: any | null
  atsRecords?: any | null
  h2hFull?: { gamesPlayed?: number; homeAtsRecord?: string; awayAtsRecord?: string; overUnderRecord?: string; averageTotal?: number } | null
  injuries?: { home?: number; away?: number; differential?: number } | null
  weather?: { impact?: string; temperature?: number; wind?: number; condition?: string } | null
}

interface TheEdgeSectionProps {
  intelligence: IntelligenceData
  homeAbbr: string
  awayAbbr: string
  homeName: string
  awayName: string
  sport: string
}

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════ */

export default function TheEdgeSection({ intelligence, homeAbbr, awayAbbr, homeName, awayName, sport }: TheEdgeSectionProps) {
  const [showAI, setShowAI] = useState(false)
  const edgeScore = intelligence.edgeScore || 0

  if (intelligence.loading) {
    return (
      <div className="rounded-2xl p-6 bg-gradient-to-br from-orange-500/5 via-slate-900/80 to-slate-900/50 border border-orange-500/20">
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="w-6 h-6 text-orange-500 animate-spin mr-3" />
          <span className="text-slate-400 font-medium">Computing 12 edge factors...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-2xl overflow-hidden bg-gradient-to-br from-[#0a0a16] via-[#0d0d1a] to-[#0a0a16] border border-orange-500/20 shadow-2xl shadow-orange-500/5">

      {/* HEADER BAR */}
      <div className="px-5 py-4 bg-gradient-to-r from-orange-500/10 via-transparent to-orange-500/10 border-b border-orange-500/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="p-2.5 rounded-xl bg-orange-500/20 ring-2 ring-orange-500/30">
                <Zap className="w-5 h-5 text-orange-400" />
              </div>
              {edgeScore >= 70 && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse" />
              )}
            </div>
            <div>
              <h3 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
                THE EDGE
                <span className="text-[10px] px-2 py-0.5 bg-orange-500/20 text-orange-400 rounded-full font-semibold tracking-wider">
                  {sport.toUpperCase()}
                </span>
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                {intelligence.edgeBreakdown ? '7 factors' : '12 data points'} &bull; Real-time analysis
              </p>
            </div>
          </div>
          <EdgeScoreRing score={edgeScore} />
        </div>
      </div>

      <div className="p-5 space-y-4">

        {/* ROW 1: EDGE PICK + SHARPEST PICK */}
        <div className="grid md:grid-cols-2 gap-3">
          <div className="p-4 rounded-xl bg-gradient-to-br from-orange-500/10 to-transparent border border-orange-500/20">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-orange-400" />
                <span className="text-xs font-bold text-orange-400 tracking-wider">THE EDGE PICK</span>
              </div>
              <ConfidencePill confidence={intelligence.quickTakes.spreadConfidence || intelligence.quickTakes.totalConfidence || 0} />
            </div>
            {(() => {
              const pick = intelligence.quickTakes.spread || intelligence.quickTakes.total
              const confidence = intelligence.quickTakes.spreadConfidence || intelligence.quickTakes.totalConfidence || 0
              const isPass = confidence < 55
              return (
                <>
                  <p className={`text-lg font-bold ${isPass ? 'text-slate-500' : 'text-white'}`}>
                    {isPass ? 'No Clear Edge \u2014 Pass' : pick || '-'}
                  </p>
                  <div className="mt-2 h-1.5 rounded-full overflow-hidden bg-slate-800">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${isPass ? 'bg-slate-600' : confidence >= 70 ? 'bg-green-500' : 'bg-orange-500'}`}
                      style={{ width: `${confidence}%` }}
                    />
                  </div>
                </>
              )
            })()}
          </div>

          <div className="p-4 rounded-xl bg-gradient-to-br from-green-500/10 to-transparent border border-green-500/20">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4 text-green-400" />
              <span className="text-xs font-bold text-green-400 tracking-wider">SHARPEST PICK</span>
              <div className="group relative ml-auto">
                <Info className="w-3.5 h-3.5 text-slate-600 cursor-help" />
                <div className="invisible group-hover:visible absolute bottom-full right-0 mb-2 w-52 p-2.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-300 z-20 shadow-xl">
                  Strongest edge from sharp money flow, line value, and trend convergence.
                </div>
              </div>
            </div>
            <p className="text-lg font-bold text-white">
              {typeof intelligence.quickTakes.sharpestPick === 'string'
                ? intelligence.quickTakes.sharpestPick || 'Calculating...'
                : intelligence.quickTakes.sharpestPick?.pick || 'Calculating...'}
            </p>
            {typeof intelligence.quickTakes.sharpestPick === 'object' && intelligence.quickTakes.sharpestPick?.reasoning && (
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">{intelligence.quickTakes.sharpestPick.reasoning}</p>
            )}
          </div>
        </div>

        {/* ROW 2: 7-FACTOR EDGE BREAKDOWN */}
        {intelligence.edgeBreakdown && (
          <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/50">
            <div className="flex items-center gap-2 mb-3">
              <BarChart3 className="w-4 h-4 text-orange-400" />
              <span className="text-xs font-bold text-slate-300 tracking-wider">EDGE BREAKDOWN</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <FactorBar label="CLV" value={intelligence.edgeBreakdown.clv} icon={<TrendingUp className="w-3 h-3" />} />
              <FactorBar label="Sharp $" value={intelligence.edgeBreakdown.sharpSignal} icon={<DollarSign className="w-3 h-3" />} />
              <FactorBar label="Trends" value={intelligence.edgeBreakdown.trendAlignment} icon={<Activity className="w-3 h-3" />} />
              <FactorBar label="Situation" value={intelligence.edgeBreakdown.situational} icon={<Target className="w-3 h-3" />} />
              <FactorBar label="Injuries" value={intelligence.edgeBreakdown.injuries} icon={<Shield className="w-3 h-3" />} />
              <FactorBar label="Weather" value={intelligence.edgeBreakdown.weather} icon={<Wind className="w-3 h-3" />} />
              <FactorBar label="H2H" value={intelligence.edgeBreakdown.h2h} icon={<Users className="w-3 h-3" />} />
            </div>
          </div>
        )}

        {/* ROW 3: FULL BETTING SPLITS */}
        {intelligence.splits && (
          <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/50">
            <div className="flex items-center gap-2 mb-3">
              <Percent className="w-4 h-4 text-blue-400" />
              <span className="text-xs font-bold text-slate-300 tracking-wider">BETTING SPLITS</span>
              <span className="text-[10px] text-slate-500 ml-auto">Ticket % vs Money %</span>
            </div>
            <div className="grid md:grid-cols-3 gap-3">
              {intelligence.splits.spread && (
                <SplitBar label="SPREAD" awayLabel={awayAbbr} homeLabel={homeAbbr}
                  ticketPct={intelligence.splits.spread.ticketPct} moneyPct={intelligence.splits.spread.moneyPct}
                  sharpSide={intelligence.splits.spread.sharpSide} rlm={intelligence.splits.spread.reverseLineMovement} />
              )}
              {intelligence.splits.total && (
                <SplitBar label="TOTAL" awayLabel="OVER" homeLabel="UNDER"
                  ticketPct={intelligence.splits.total.ticketPct} moneyPct={intelligence.splits.total.moneyPct}
                  sharpSide={intelligence.splits.total.sharpSide} rlm={intelligence.splits.total.reverseLineMovement} />
              )}
              {intelligence.splits.moneyline && (
                <SplitBar label="MONEYLINE" awayLabel={awayAbbr} homeLabel={homeAbbr}
                  ticketPct={intelligence.splits.moneyline.ticketPct} moneyPct={intelligence.splits.moneyline.moneyPct}
                  sharpSide={intelligence.splits.moneyline.sharpSide} rlm={intelligence.splits.moneyline.reverseLineMovement} />
              )}
            </div>
          </div>
        )}

        {/* ROW 4: CLV + LINE MOVEMENT + KEY NUMBERS */}
        <div className="grid md:grid-cols-3 gap-3">
          {intelligence.clv && intelligence.clv.grade && intelligence.clv.grade !== 'neutral' && (
            <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-blue-400 tracking-wider">CLV</span>
                <GradeBadge grade={intelligence.clv.grade} />
              </div>
              <div className="space-y-1.5">
                {intelligence.clv.spreadCLV != null && intelligence.clv.spreadCLV !== 0 && (
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Spread</span>
                    <span className={intelligence.clv.spreadCLV > 0 ? 'text-green-400' : 'text-red-400'}>
                      {intelligence.clv.spreadCLV > 0 ? '+' : ''}{intelligence.clv.spreadCLV.toFixed(1)}
                    </span>
                  </div>
                )}
                {intelligence.clv.totalCLV != null && intelligence.clv.totalCLV !== 0 && (
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Total</span>
                    <span className={intelligence.clv.totalCLV > 0 ? 'text-green-400' : 'text-red-400'}>
                      {intelligence.clv.totalCLV > 0 ? '+' : ''}{intelligence.clv.totalCLV.toFixed(1)}
                    </span>
                  </div>
                )}
                {intelligence.clv.openSpread != null && intelligence.clv.currentSpread != null && (
                  <div className="flex justify-between text-xs mt-1 pt-1 border-t border-slate-700/50">
                    <span className="text-slate-500">Spread</span>
                    <span className="text-slate-300">
                      {intelligence.clv.openSpread > 0 ? '+' : ''}{intelligence.clv.openSpread} &rarr; {intelligence.clv.currentSpread > 0 ? '+' : ''}{intelligence.clv.currentSpread}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {intelligence.lineMovement && (intelligence.lineMovement.spreadMove || intelligence.lineMovement.totalMove) && (
            <div className="p-4 rounded-xl bg-purple-500/5 border border-purple-500/20">
              <span className="text-xs font-bold text-purple-400 tracking-wider">LINE MOVEMENT</span>
              <div className="mt-2 space-y-2">
                {intelligence.lineMovement.spreadMove != null && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">Spread</span>
                    <div className="flex items-center gap-1">
                      {intelligence.lineMovement.spreadMove > 0
                        ? <TrendingUp className="w-3 h-3 text-green-400" />
                        : <TrendingDown className="w-3 h-3 text-red-400" />}
                      <span className={`text-sm font-bold ${intelligence.lineMovement.spreadMove > 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {intelligence.lineMovement.spreadMove > 0 ? '+' : ''}{intelligence.lineMovement.spreadMove.toFixed(1)}
                      </span>
                    </div>
                  </div>
                )}
                {intelligence.lineMovement.totalMove != null && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">Total</span>
                    <div className="flex items-center gap-1">
                      {intelligence.lineMovement.totalMove > 0
                        ? <TrendingUp className="w-3 h-3 text-green-400" />
                        : <TrendingDown className="w-3 h-3 text-red-400" />}
                      <span className={`text-sm font-bold ${intelligence.lineMovement.totalMove > 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {intelligence.lineMovement.totalMove > 0 ? '+' : ''}{intelligence.lineMovement.totalMove.toFixed(1)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {intelligence.keyNumbers?.spreadProximity && intelligence.keyNumbers.spreadProximity.length > 0 && (
            <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20">
              <span className="text-xs font-bold text-amber-400 tracking-wider">KEY NUMBERS</span>
              <div className="mt-2 space-y-1.5">
                {intelligence.keyNumbers.spreadProximity.slice(0, 3).map((kn, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">
                      <span className="text-amber-300 font-bold">{kn.number}</span>
                      {kn.distance <= 0.5 && <span className="ml-1 text-amber-400">&harr;</span>}
                    </span>
                    <span className="text-slate-400">
                      {kn.distance === 0 ? 'ON key #' : `${kn.distance.toFixed(1)} away`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ROW 5: SHARP MONEY / RLM ALERT */}
        {intelligence.sharpMoney?.reverseLineMovement && (
          <div className="p-4 rounded-xl bg-gradient-to-r from-yellow-500/10 via-yellow-500/5 to-transparent border border-yellow-500/30 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-yellow-500/5 rounded-full blur-2xl" />
            <div className="flex items-center gap-3 relative">
              <div className="p-2 rounded-lg bg-yellow-500/20">
                <AlertTriangle className="w-4 h-4 text-yellow-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-yellow-400">REVERSE LINE MOVEMENT</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                    intelligence.sharpMoney.strength === 'strong' ? 'bg-red-500/20 text-red-400' :
                    intelligence.sharpMoney.strength === 'moderate' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-slate-700 text-slate-400'
                  }`}>
                    {intelligence.sharpMoney.strength?.toUpperCase()}
                  </span>
                </div>
                <p className="text-sm text-slate-300 mt-0.5">
                  Sharp money on <span className="font-bold text-white">
                    {intelligence.sharpMoney.side === 'home' ? homeName : awayName}
                  </span> &mdash; line moving against public
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ROW 6: SITUATIONAL BADGES */}
        {intelligence.situational && (
          intelligence.situational.trapGame || intelligence.situational.letdownSpot ||
          intelligence.situational.lookaheadSpot || intelligence.situational.sandwichSpot ||
          (intelligence.situational.restDaysDiff != null && Math.abs(intelligence.situational.restDaysDiff) >= 2)
        ) && (
          <div className="flex flex-wrap gap-2">
            {intelligence.situational?.trapGame && (
              <SituationalBadge label="TRAP GAME" color="red" tooltip="Team favored but facing letdown/overlooked opponent" />
            )}
            {intelligence.situational?.letdownSpot && (
              <SituationalBadge label="LETDOWN SPOT" color="amber" tooltip="Coming off emotional win - beware regression" />
            )}
            {intelligence.situational?.lookaheadSpot && (
              <SituationalBadge label="LOOKAHEAD" color="purple" tooltip="Bigger game next - possible lack of focus" />
            )}
            {intelligence.situational?.sandwichSpot && (
              <SituationalBadge label="SANDWICH" color="orange" tooltip="Trapped between two important games" />
            )}
            {intelligence.situational?.restDaysDiff != null && Math.abs(intelligence.situational.restDaysDiff) >= 2 && (
              <SituationalBadge
                label={`REST ${intelligence.situational.restDaysDiff > 0 ? '+' : ''}${intelligence.situational.restDaysDiff}d`}
                color={intelligence.situational.restDaysDiff > 0 ? 'green' : 'red'}
                tooltip={`${Math.abs(intelligence.situational.restDaysDiff)} day rest advantage for ${intelligence.situational.restDaysDiff > 0 ? 'home' : 'away'}`}
              />
            )}
            {intelligence.situational?.travelMiles != null && intelligence.situational.travelMiles > 1500 && (
              <SituationalBadge
                label={`${Math.round(intelligence.situational.travelMiles)}mi TRAVEL`}
                color="blue"
                tooltip={`${intelligence.situational.travelMiles} miles of travel for away team`}
              />
            )}
          </div>
        )}

        {/* ROW 7: AI ANALYSIS (COLLAPSIBLE) */}
        {intelligence.aiAnalysis && (
          <div className="rounded-xl border border-slate-700/50 overflow-hidden">
            <button
              onClick={() => setShowAI(!showAI)}
              className="w-full px-4 py-3 flex items-center justify-between bg-slate-800/30 hover:bg-slate-800/50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-bold text-slate-300 tracking-wider">AI ANALYSIS</span>
                {intelligence.aiAnalysis.betGrades && (
                  <div className="flex gap-1 ml-2">
                    <MiniGrade label="S" grade={intelligence.aiAnalysis.betGrades.spread} />
                    <MiniGrade label="T" grade={intelligence.aiAnalysis.betGrades.total} />
                    <MiniGrade label="M" grade={intelligence.aiAnalysis.betGrades.ml} />
                  </div>
                )}
              </div>
              {showAI ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
            </button>

            {showAI && (
              <div className="p-4 space-y-4 bg-slate-900/30">
                <p className="text-sm text-slate-300 leading-relaxed">{intelligence.aiAnalysis.summary}</p>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-slate-800/50">
                    <p className="text-[10px] text-slate-500 mb-2 font-bold tracking-wider">WIN PROBABILITY</p>
                    <div className="flex items-center justify-between">
                      <div className="text-center">
                        <p className="text-[10px] text-slate-500">{awayAbbr}</p>
                        <p className="text-lg font-bold text-white">{Math.round(intelligence.aiAnalysis.winProbability.away * 100)}%</p>
                      </div>
                      <span className="text-slate-700 text-xs">vs</span>
                      <div className="text-center">
                        <p className="text-[10px] text-slate-500">{homeAbbr}</p>
                        <p className="text-lg font-bold text-white">{Math.round(intelligence.aiAnalysis.winProbability.home * 100)}%</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-800/50">
                    <p className="text-[10px] text-slate-500 mb-2 font-bold tracking-wider">PROJECTED SCORE</p>
                    <div className="flex items-center justify-between">
                      <div className="text-center">
                        <p className="text-[10px] text-slate-500">{awayAbbr}</p>
                        <p className="text-lg font-bold text-orange-400">{intelligence.aiAnalysis.projectedScore.away}</p>
                      </div>
                      <span className="text-slate-700 text-xs">-</span>
                      <div className="text-center">
                        <p className="text-[10px] text-slate-500">{homeAbbr}</p>
                        <p className="text-lg font-bold text-orange-400">{intelligence.aiAnalysis.projectedScore.home}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <BetGradeCard label="SPREAD" grade={intelligence.aiAnalysis.betGrades?.spread || 'C'} pick={intelligence.aiAnalysis.spreadAnalysis.pick} confidence={intelligence.aiAnalysis.spreadAnalysis.confidence} color="orange" />
                  <BetGradeCard label="TOTAL" grade={intelligence.aiAnalysis.betGrades?.total || 'C'} pick={intelligence.aiAnalysis.totalAnalysis.pick} confidence={intelligence.aiAnalysis.totalAnalysis.confidence} color="green" />
                  <BetGradeCard label="ML" grade={intelligence.aiAnalysis.betGrades?.ml || 'C'} pick={`${awayAbbr} / ${homeAbbr}`} confidence={0} color="purple" />
                </div>

                {(intelligence.aiAnalysis.keyEdges?.length || intelligence.aiAnalysis.majorRisks?.length) ? (
                  <div className="grid md:grid-cols-2 gap-3">
                    {intelligence.aiAnalysis.keyEdges && intelligence.aiAnalysis.keyEdges.length > 0 && (
                      <div className="p-3 rounded-lg bg-green-500/5 border border-green-500/20">
                        <div className="flex items-center gap-1.5 mb-2">
                          <CheckCircle className="w-3.5 h-3.5 text-green-400" />
                          <span className="text-[10px] font-bold text-green-400 tracking-wider">KEY EDGES</span>
                        </div>
                        <ul className="space-y-1">
                          {intelligence.aiAnalysis.keyEdges.slice(0, 3).map((e, i) => (
                            <li key={i} className="text-xs text-slate-300 flex items-start gap-1.5">
                              <span className="text-green-500 mt-0.5">+</span>{e}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {intelligence.aiAnalysis.majorRisks && intelligence.aiAnalysis.majorRisks.length > 0 && (
                      <div className="p-3 rounded-lg bg-red-500/5 border border-red-500/20">
                        <div className="flex items-center gap-1.5 mb-2">
                          <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                          <span className="text-[10px] font-bold text-red-400 tracking-wider">RISKS</span>
                        </div>
                        <ul className="space-y-1">
                          {intelligence.aiAnalysis.majorRisks.slice(0, 3).map((r, i) => (
                            <li key={i} className="text-xs text-slate-300 flex items-start gap-1.5">
                              <span className="text-red-500 mt-0.5">-</span>{r}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
            )}
          </div>
        )}

        {/* ROW 8: WEATHER + INJURIES compact */}
        {(intelligence.weather?.impact || intelligence.injuries?.differential) ? (
          <div className="flex flex-wrap gap-3">
            {intelligence.weather && intelligence.weather.impact && intelligence.weather.impact !== 'none' && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800/50 border border-slate-700/50 text-xs">
                <Thermometer className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-slate-400">Weather:</span>
                <span className={`font-semibold ${intelligence.weather.impact === 'high' ? 'text-red-400' : intelligence.weather.impact === 'medium' ? 'text-amber-400' : 'text-slate-300'}`}>
                  {intelligence.weather.impact.toUpperCase()} impact
                </span>
                {intelligence.weather.temperature != null && (
                  <span className="text-slate-500">{intelligence.weather.temperature}&deg;F</span>
                )}
                {intelligence.weather.wind != null && intelligence.weather.wind > 10 && (
                  <span className="text-slate-500">{intelligence.weather.wind}mph wind</span>
                )}
              </div>
            )}
            {intelligence.injuries?.differential != null && Math.abs(intelligence.injuries.differential) > 2 && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800/50 border border-slate-700/50 text-xs">
                <Shield className="w-3.5 h-3.5 text-red-400" />
                <span className="text-slate-400">Injury Edge:</span>
                <span className={`font-semibold ${intelligence.injuries.differential > 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {intelligence.injuries.differential > 0 ? homeAbbr : awayAbbr} advantage
                </span>
              </div>
            )}
          </div>
        ) : null}

        {/* FALLBACK: Top Data Points */}
        {!intelligence.aiAnalysis && !intelligence.edgeBreakdown && !intelligence.splits && intelligence.topDataPoints.length > 0 && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-2">
            {intelligence.topDataPoints.map((dp, i) => (
              <div key={i} className={`p-3 rounded-lg border ${dp.impact === 'positive' ? 'bg-green-500/5 border-green-500/20' : dp.impact === 'negative' ? 'bg-red-500/5 border-red-500/20' : 'bg-slate-800/50 border-slate-700'}`}>
                <p className={`text-[10px] font-bold tracking-wider mb-0.5 ${dp.impact === 'positive' ? 'text-green-400' : dp.impact === 'negative' ? 'text-red-400' : 'text-slate-500'}`}>{dp.point}</p>
                <p className="text-sm text-white font-medium">{dp.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* EMPTY STATE */}
        {!intelligence.loading && !intelligence.aiAnalysis && !intelligence.edgeBreakdown &&
         !intelligence.splits && intelligence.topDataPoints.length === 0 &&
         !intelligence.sharpMoney?.reverseLineMovement && (
          <div className="p-8 rounded-xl bg-slate-800/20 border border-slate-700/50 text-center">
            <Clock className="w-6 h-6 text-slate-600 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-400 mb-1">Intelligence Loading</p>
            <p className="text-xs text-slate-600">
              Data is being collected for this matchup. Check back closer to game time for
              sharp signals, line movement, and full betting splits.
            </p>
          </div>
        )}

      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   SUB-COMPONENTS
   ═══════════════════════════════════════════════════════════════ */

function EdgeScoreRing({ score }: { score: number }) {
  const radius = 30
  const circumference = 2 * Math.PI * radius
  const filled = (score / 100) * circumference
  const color = score >= 70 ? '#4ade80' : score >= 50 ? '#fb923c' : '#64748b'

  return (
    <div className="relative w-[76px] h-[76px]">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 76 76">
        <circle cx="38" cy="38" r={radius} fill="none" stroke="#1e293b" strokeWidth="5" />
        <circle cx="38" cy="38" r={radius} fill="none" stroke={color} strokeWidth="5" strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={circumference - filled} className="transition-all duration-1000" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-black" style={{ color }}>{score}</span>
        <span className="text-[8px] text-slate-500 font-bold tracking-wider">EDGE</span>
      </div>
    </div>
  )
}

function ConfidencePill({ confidence }: { confidence: number }) {
  if (!confidence || confidence === 0) return null
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${confidence >= 70 ? 'bg-green-500/20 text-green-400' : confidence >= 55 ? 'bg-orange-500/20 text-orange-400' : 'bg-slate-700 text-slate-400'}`}>
      {Math.round(confidence)}%
    </span>
  )
}

function FactorBar({ label, value, icon }: { label: string; value?: number; icon: React.ReactNode }) {
  const v = value || 0
  const pct = Math.min(v / 25 * 100, 100)
  const color = v >= 15 ? 'bg-green-500' : v >= 8 ? 'bg-orange-500' : v >= 1 ? 'bg-slate-500' : 'bg-slate-700'
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 text-slate-400">
          {icon}
          <span className="text-[10px] font-semibold">{label}</span>
        </div>
        <span className={`text-[10px] font-bold ${v >= 15 ? 'text-green-400' : v >= 8 ? 'text-orange-400' : 'text-slate-500'}`}>
          {v > 0 ? v.toFixed(0) : '\u2014'}
        </span>
      </div>
      <div className="h-1 rounded-full bg-slate-800 overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-700 ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

function SplitBar({ label, awayLabel, homeLabel, ticketPct, moneyPct, sharpSide, rlm }: {
  label: string; awayLabel: string; homeLabel: string; ticketPct?: number; moneyPct?: number; sharpSide?: string; rlm?: boolean
}) {
  const ticket = ticketPct || 50
  const money = moneyPct || 50
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold text-slate-400 tracking-wider">{label}</span>
        {rlm && <span className="text-[9px] px-1.5 py-0.5 bg-yellow-500/20 text-yellow-400 rounded font-bold animate-pulse">RLM</span>}
      </div>
      <div>
        <div className="flex items-center justify-between text-[10px] mb-0.5">
          <span className="text-slate-500">{awayLabel}</span>
          <span className="text-slate-500 font-medium">Tix %</span>
          <span className="text-slate-500">{homeLabel}</span>
        </div>
        <div className="h-2.5 rounded-full overflow-hidden bg-slate-800 flex">
          <div className="h-full bg-blue-500/60 transition-all" style={{ width: `${ticket}%` }} />
          <div className="h-full bg-red-500/60 transition-all" style={{ width: `${100 - ticket}%` }} />
        </div>
        <div className="flex justify-between text-[10px] mt-0.5">
          <span className="text-blue-400 font-bold">{ticket}%</span>
          <span className="text-red-400 font-bold">{100 - ticket}%</span>
        </div>
      </div>
      <div>
        <div className="flex items-center justify-center text-[10px] mb-0.5">
          <span className="text-slate-500 font-medium">$$$ %</span>
        </div>
        <div className="h-2.5 rounded-full overflow-hidden bg-slate-800 flex">
          <div className={`h-full transition-all ${sharpSide === 'away' ? 'bg-green-500/70' : 'bg-blue-500/40'}`} style={{ width: `${money}%` }} />
          <div className={`h-full transition-all ${sharpSide === 'home' ? 'bg-green-500/70' : 'bg-red-500/40'}`} style={{ width: `${100 - money}%` }} />
        </div>
        <div className="flex justify-between text-[10px] mt-0.5">
          <span className={`font-bold ${sharpSide === 'away' ? 'text-green-400' : 'text-blue-400'}`}>{money}%</span>
          <span className={`font-bold ${sharpSide === 'home' ? 'text-green-400' : 'text-red-400'}`}>{100 - money}%</span>
        </div>
      </div>
    </div>
  )
}

function SituationalBadge({ label, color, tooltip }: { label: string; color: string; tooltip: string }) {
  const colorMap: Record<string, string> = {
    red: 'bg-red-500/15 border-red-500/30 text-red-400',
    amber: 'bg-amber-500/15 border-amber-500/30 text-amber-400',
    orange: 'bg-orange-500/15 border-orange-500/30 text-orange-400',
    purple: 'bg-purple-500/15 border-purple-500/30 text-purple-400',
    green: 'bg-green-500/15 border-green-500/30 text-green-400',
    blue: 'bg-blue-500/15 border-blue-500/30 text-blue-400',
  }
  return (
    <div className="group relative">
      <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[10px] font-bold tracking-wider ${colorMap[color] || colorMap.amber}`}>
        <AlertTriangle className="w-3 h-3" />
        <span>{label}</span>
      </div>
      <div className="invisible group-hover:visible absolute bottom-full left-0 mb-2 w-48 p-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-300 z-20 shadow-xl">
        {tooltip}
      </div>
    </div>
  )
}

function GradeBadge({ grade }: { grade: string }) {
  const map: Record<string, string> = {
    excellent: 'bg-green-500/20 text-green-400',
    good: 'bg-blue-500/20 text-blue-400',
    neutral: 'bg-slate-700 text-slate-400',
    poor: 'bg-red-500/20 text-red-400',
    A: 'bg-green-500/20 text-green-400',
    B: 'bg-blue-500/20 text-blue-400',
    C: 'bg-yellow-500/20 text-yellow-400',
    D: 'bg-red-500/20 text-red-400',
    F: 'bg-red-500/20 text-red-400',
  }
  return (
    <span className={`px-1.5 py-0.5 text-[10px] font-bold rounded ${map[grade] || map.neutral}`}>
      {grade.toUpperCase()}
    </span>
  )
}

function MiniGrade({ label, grade }: { label: string; grade: string }) {
  const color = grade === 'A' ? 'text-green-400 bg-green-500/20' :
    grade === 'B' ? 'text-blue-400 bg-blue-500/20' :
    grade === 'C' ? 'text-yellow-400 bg-yellow-500/20' : 'text-red-400 bg-red-500/20'
  return (
    <span className={`text-[9px] font-bold px-1 py-0.5 rounded ${color}`}>{label}:{grade}</span>
  )
}

function BetGradeCard({ label, grade, pick, confidence, color }: {
  label: string; grade: string; pick: string; confidence: number; color: string
}) {
  const borderColors: Record<string, string> = {
    orange: 'border-orange-500/20 from-orange-500/10',
    green: 'border-green-500/20 from-green-500/10',
    purple: 'border-purple-500/20 from-purple-500/10',
  }
  return (
    <div className={`p-3 rounded-xl bg-gradient-to-br ${borderColors[color] || borderColors.orange} to-transparent border`}>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[10px] text-slate-500 font-bold tracking-wider">{label}</span>
        <GradeBadge grade={grade} />
      </div>
      <p className="text-sm font-bold text-white truncate">{pick}</p>
      {confidence > 0 && (
        <p className="text-[10px] text-slate-500 mt-0.5">{Math.round(confidence * 100)}% confident</p>
      )}
    </div>
  )
}
