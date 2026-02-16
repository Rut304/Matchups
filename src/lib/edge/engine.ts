// Edge engine - centralized Edge Score calculation with sport-specific weights
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

// =============================================================================
// SPORT-SPECIFIC EDGE WEIGHTS
// Each sport's total adds up to 100. Weights reflect what actually drives edges.
// =============================================================================
const SPORT_EDGE_WEIGHTS: Record<string, {
  clv: number; sharp: number; trends: number; situational: number;
  injuries: number; weather: number; h2h: number
}> = {
  // NFL: Key numbers + weather + CLV matter most. 16-game season = less trend data
  NFL:    { clv: 20, sharp: 20, trends: 15, situational: 15, injuries: 12, weather: 10, h2h: 8 },
  // NBA: Sharp money + situational (B2B, rest) dominate. Weather irrelevant.
  NBA:    { clv: 18, sharp: 22, trends: 18, situational: 18, injuries: 14, weather: 0, h2h: 10 },
  // NCAAB: Home court is massive. CLV + sharp signals are key. Weather irrelevant.
  NCAAB:  { clv: 20, sharp: 22, trends: 15, situational: 18, injuries: 12, weather: 0, h2h: 13 },
  // NCAAF: Similar to NFL but bigger spreads, more unpredictable. Weather matters.
  NCAAF:  { clv: 18, sharp: 20, trends: 15, situational: 17, injuries: 12, weather: 10, h2h: 8 },
  // MLB: Pitcher matchups dominate (captured in injuries/situational). Weather (wind) matters.
  MLB:    { clv: 18, sharp: 20, trends: 15, situational: 20, injuries: 15, weather: 8, h2h: 4 },
  // NHL: Goalie is everything (injuries). B2B matters (situational). Weather irrelevant.
  NHL:    { clv: 18, sharp: 20, trends: 15, situational: 18, injuries: 18, weather: 0, h2h: 11 },
  // Women's sports: Similar structures to men's counterparts
  WNBA:   { clv: 18, sharp: 20, trends: 18, situational: 18, injuries: 14, weather: 0, h2h: 12 },
  WNCAAB: { clv: 18, sharp: 20, trends: 15, situational: 18, injuries: 12, weather: 0, h2h: 17 },
}

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
  sport?: string
}): MatchupIntelligence['edgeScore'] {
  // Sport-specific weight profiles — different sports have different edge drivers
  const sportUpper = (data.sport || 'NFL').toUpperCase()
  const weights = SPORT_EDGE_WEIGHTS[sportUpper] || SPORT_EDGE_WEIGHTS.NFL

  // CLV Value (0-maxCLV points) — THE key metric for sharp bettors
  let clvValue = 0
  const spreadMove = Math.abs(data.clv.spreadCLV || 0)
  const totalMove = Math.abs(data.clv.totalCLV || 0)
  const mlMove = Math.abs(data.clv.mlCLV || 0)
  // Combined movement score: spread moves matter most, total moves second
  const combinedCLV = spreadMove * 1.0 + totalMove * 0.5 + (mlMove > 0 ? Math.min(mlMove / 20, 2) : 0)
  if (combinedCLV >= 3) clvValue = weights.clv
  else if (combinedCLV >= 2) clvValue = weights.clv * 0.8
  else if (combinedCLV >= 1) clvValue = weights.clv * 0.5
  else if (combinedCLV > 0) clvValue = weights.clv * 0.25
  // Also factor in grade from pipeline
  if (data.clv.grade === 'excellent') clvValue = Math.max(clvValue, weights.clv * 0.9)
  else if (data.clv.grade === 'good') clvValue = Math.max(clvValue, weights.clv * 0.6)

  // Sharp Signal (0-maxSharp points) - Check both spread AND total RLM
  let sharpSignal = 0
  if (data.splits.spread.reverseLineMovement) {
    if (data.splits.spread.rlmStrength === 'strong') sharpSignal += weights.sharp * 0.5
    else if (data.splits.spread.rlmStrength === 'moderate') sharpSignal += weights.sharp * 0.35
    else sharpSignal += weights.sharp * 0.2
  }
  if (data.splits.total.reverseLineMovement) {
    sharpSignal += weights.sharp * 0.35 // RLM on totals is a strong sharp indicator
  }
  if (data.splits.consensus.alignment === 'opposed') sharpSignal += weights.sharp * 0.15
  sharpSignal = Math.min(sharpSignal, weights.sharp)

  // Trend Alignment (0-maxTrends points)
  let trendAlignment = 0
  const ouTrendCount = data.ou.trends.length
  const avgOUConfidence = data.ou.trends.reduce((sum, t) => sum + (t.confidence || 0), 0) / Math.max(ouTrendCount, 1)
  trendAlignment = Math.min(ouTrendCount * (weights.trends / 7) + avgOUConfidence / 15, weights.trends)

  // Situational Edge (0-maxSituational points)
  let situationalEdge = 0
  const angleCount = data.situational.angles.length
  const avgAngleROI = data.situational.angles.reduce((sum, a) => sum + (a.roi || 0), 0) / Math.max(angleCount, 1)
  situationalEdge = Math.min(angleCount * (weights.situational / 4) + avgAngleROI / 3, weights.situational)

  // Injury Advantage (0-maxInjuries points)
  let injuryAdvantage = 0
  const homeInjuryScore = data.injuries?.homeTeam?.totalImpactScore || 0
  const awayInjuryScore = data.injuries?.awayTeam?.totalImpactScore || 0
  const injuryDiff = awayInjuryScore - homeInjuryScore
  const diffScore = Math.min(Math.abs(injuryDiff) / 8, weights.injuries * 0.6)
  const totalInjuryImpact = homeInjuryScore + awayInjuryScore
  const impactScore = Math.min(totalInjuryImpact / 30, weights.injuries * 0.4)
  injuryAdvantage = Math.round(Math.min(diffScore + (impactScore * 0.5), weights.injuries))

  // Weather Edge (0-maxWeather points) — only for outdoor sports
  let weatherEdge = 0
  if (weights.weather > 0) {
    if (data.weather?.bettingImpact?.level === 'high') weatherEdge = weights.weather
    else if (data.weather?.bettingImpact?.level === 'medium') weatherEdge = weights.weather * 0.6
    else if (data.weather?.bettingImpact?.level === 'low') weatherEdge = weights.weather * 0.3
  }

  // H2H Edge (0-maxH2H points)
  let h2hEdge = 0
  if ((data.h2h?.gamesPlayed || 0) >= 3) {
    const dominance = Math.abs((data.h2h.homeTeamWins || 0) - (data.h2h.awayTeamWins || 0)) / Math.max(data.h2h.gamesPlayed || 1, 1)
    h2hEdge = Math.min(dominance * weights.h2h * 2, weights.h2h)
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
