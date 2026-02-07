// Edge engine - centralized Edge Score calculation
import type {
  CLVData,
  LineMovementData,
  PublicSharpSplits,
  InjuryImpact,
  WeatherImpact,
  SituationalAngles,
  ATSRecords,
  OUTrends,
  KeyNumbers,
  H2HHistory,
  MarketConsensus,
  MatchupIntelligence
} from '../betting-intelligence'

export function calculateComprehensiveEdgeScore(data: {
  clv: CLVData
  lineMovement: LineMovementData
  splits: PublicSharpSplits
  injuries: InjuryImpact
  weather: WeatherImpact
  situational: SituationalAngles
  ats: ATSRecords
  ou: OUTrends
  keyNumbers: KeyNumbers
  h2h: H2HHistory
  consensus: MarketConsensus
}): MatchupIntelligence['edgeScore'] {
  // CLV Value (0-15 points)
  let clvValue = 0
  if (data.clv.grade === 'excellent') clvValue = 15
  else if (data.clv.grade === 'good') clvValue = 10
  else if (data.clv.grade === 'neutral') clvValue = 5

  // Sharp Signal (0-20 points) - Check both spread AND total RLM
  let sharpSignal = 0
  // Spread RLM
  if (data.splits.spread.reverseLineMovement) {
    if (data.splits.spread.rlmStrength === 'strong') sharpSignal += 10
    else if (data.splits.spread.rlmStrength === 'moderate') sharpSignal += 7
    else sharpSignal += 4
  }
  // Total RLM - this is often where sharp money shows
  if (data.splits.total.reverseLineMovement) {
    sharpSignal += 10 // RLM on totals is a strong sharp indicator
  }
  if (data.splits.consensus.alignment === 'opposed') sharpSignal += 5
  // Cap at 20
  sharpSignal = Math.min(sharpSignal, 20)

  // Trend Alignment (0-20 points)
  let trendAlignment = 0
  const ouTrendCount = data.ou.trends.length
  const avgOUConfidence = data.ou.trends.reduce((sum, t) => sum + (t.confidence || 0), 0) / Math.max(ouTrendCount, 1)
  trendAlignment = Math.min(ouTrendCount * 3 + avgOUConfidence / 10, 20)

  // Situational Edge (0-15 points)
  let situationalEdge = 0
  const angleCount = data.situational.angles.length
  const avgAngleROI = data.situational.angles.reduce((sum, a) => sum + (a.roi || 0), 0) / Math.max(angleCount, 1)
  situationalEdge = Math.min(angleCount * 4 + avgAngleROI / 2, 15)

  // Injury Advantage (0-10 points)
  // Consider both the differential AND the total injury impact (in case both teams have injuries but one side has value)
  let injuryAdvantage = 0
  const homeInjuryScore = data.injuries?.homeTeam?.totalImpactScore || 0
  const awayInjuryScore = data.injuries?.awayTeam?.totalImpactScore || 0
  const injuryDiff = awayInjuryScore - homeInjuryScore
  // Give points for differential (home team advantage if away has more injuries)
  const diffScore = Math.min(Math.abs(injuryDiff) / 8, 5)
  // Also give some points if there are significant injuries overall (creates betting angles)
  const totalInjuryImpact = homeInjuryScore + awayInjuryScore
  const impactScore = Math.min(totalInjuryImpact / 30, 5)
  injuryAdvantage = Math.round(Math.min(diffScore + (impactScore * 0.5), 10))

  // Weather Edge (0-10 points)
  let weatherEdge = 0
  if (data.weather?.bettingImpact?.level === 'high') weatherEdge = 10
  else if (data.weather?.bettingImpact?.level === 'medium') weatherEdge = 6
  else if (data.weather?.bettingImpact?.level === 'low') weatherEdge = 3

  // H2H Edge (0-10 points)
  let h2hEdge = 0
  if ((data.h2h?.gamesPlayed || 0) >= 5) {
    const dominance = Math.abs((data.h2h.homeTeamWins || 0) - (data.h2h.awayTeamWins || 0)) / Math.max(data.h2h.gamesPlayed || 1, 1)
    h2hEdge = Math.min(dominance * 20, 10)
  }

  const overall = Math.round(clvValue + sharpSignal + trendAlignment + situationalEdge + injuryAdvantage + weatherEdge + h2hEdge)

  // Determine top edge
  let topEdge: MatchupIntelligence['edgeScore']['topEdge'] = null

  if (data.consensus && (data.consensus as any).sharpestPick) {
    const sp = (data.consensus as any).sharpestPick
    topEdge = {
      betType: sp.betType,
      pick: sp.pick,
      confidence: sp.confidence,
      reasoning: [
        sp.reasoning,
        ...(data.splits.spread.reverseLineMovement ? ['Reverse line movement detected'] : []),
        ...(data.ou.trends.length > 0 ? [`${data.ou.trends.length} supporting O/U trends`] : [])
      ]
    }
  }

  return {
    overall: Math.min(overall, 100),
    breakdown: {
      clvValue: Math.round(clvValue),
      sharpSignal: Math.round(sharpSignal),
      trendAlignment: Math.round(trendAlignment),
      situationalEdge: Math.round(situationalEdge),
      injuryAdvantage: Math.round(injuryAdvantage),
      weatherEdge: Math.round(weatherEdge),
      h2hEdge: Math.round(h2hEdge)
    },
    topEdge
  }
}

export default calculateComprehensiveEdgeScore
