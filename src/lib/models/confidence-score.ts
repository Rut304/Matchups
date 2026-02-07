// =============================================================================
// CONFIDENCE SCORE MODEL
// =============================================================================
// Weighted confidence scoring system incorporating:
// - Injuries & player availability
// - Style of play (pace, tempo)
// - Location (home/away advantages)
// - Team metrics & matchups
// - Historical performance patterns
// - Over/Under specific factors
// 
// Uses RSI (Recursive Self-Improvement) to adjust weights after each game

export interface InjuryImpact {
  player: string
  team: string
  position: string
  status: 'OUT' | 'DOUBTFUL' | 'QUESTIONABLE' | 'PROBABLE' | 'GTD'
  projectedMinutes?: number
  normalMinutes?: number
  impactScore: number // 0-100, how important is this player
  spreadImpact: number // estimated point swing
  totalImpact: number // impact on O/U
}

export interface StyleOfPlay {
  sport: string
  team: string
  // Pace metrics
  pace: number // possessions per game (NBA), plays per game (NFL)
  paceRank: number
  tempo: 'fast' | 'moderate' | 'slow'
  // Offensive style
  pointsPerGame: number
  offensiveRating: number
  // NFL specific
  noHuddleRate?: number // percentage of plays from no huddle
  playActionRate?: number
  rushRate?: number
  passRate?: number
  // NBA specific
  threePointRate?: number
  fastBreakPtsPerGame?: number
  ptsInPaint?: number
  // NHL specific
  shotsPerGame?: number
  faceoffPct?: number
}

export interface LocationFactor {
  isHome: boolean
  homeAdvantage: number // historical spread advantage (NFL ~3pts, NBA ~3-4pts)
  elevation?: number // Denver altitude factor
  timezone?: string
  travelDistance?: number
  backToBack?: boolean // NBA
  restDays?: number
  indoorOutdoor?: 'indoor' | 'outdoor' | 'dome'
  turf?: 'grass' | 'turf' | 'hybrid'
}

export interface MatchupFactor {
  teamAbbr: string
  opponentAbbr: string
  // H2H history
  h2hRecord: string
  h2hATS: string
  h2hOU: string
  avgMargin: number
  avgTotal: number
  // Matchup specific
  offVsDefRank: number // offensive efficiency vs opponent's defensive rank
  defVsOffRank: number
  keyMatchupAdvantage: string
}

export interface WeatherFactor {
  temp?: number
  wind?: number
  precipitation?: number
  condition?: string
  domeGame: boolean
  weatherImpact: number // -10 to +10 on total
}

export interface TrendFactor {
  type: 'spread' | 'total' | 'moneyline'
  description: string
  record: string
  winPct: number
  recentGames: number
  confidence: number
}

export interface ConfidenceScore {
  gameId: string
  sport: string
  homeTeam: string
  awayTeam: string
  
  // Spread confidence
  spreadPick: 'home' | 'away' | 'avoid'
  spreadConfidence: number // 0-100
  spreadLine: number
  spreadFactors: ConfidenceFactor[]
  spreadEdge: number // projected edge over line
  
  // Total confidence  
  totalPick: 'over' | 'under' | 'avoid'
  totalConfidence: number // 0-100
  totalLine: number
  totalFactors: ConfidenceFactor[]
  projectedTotal: number
  
  // Overall 
  overallConfidence: number
  bestBet: 'spread' | 'total' | 'avoid'
  reasoning: string[]
  
  // Metadata
  timestamp: Date
  modelVersion: string
}

export interface ConfidenceFactor {
  name: string
  category: 'injury' | 'pace' | 'location' | 'matchup' | 'weather' | 'trend' | 'sharp'
  weight: number // 0-1, how much this factor influences
  impact: number // -10 to +10
  description: string
  confidence: number // how confident in this factor
}

// =============================================================================
// MODEL WEIGHTS (adjusted via RSI learning)
// =============================================================================

export interface ModelWeights {
  // Factor category weights (should sum to ~1.0)
  injuryWeight: number
  paceWeight: number
  locationWeight: number
  matchupWeight: number
  weatherWeight: number
  trendWeight: number
  sharpMoneyWeight: number
  
  // Sport-specific adjustments
  sportMultipliers: Record<string, number>
  
  // Confidence thresholds
  highConfThreshold: number
  medConfThreshold: number
  avoidThreshold: number
  
  // Learning metadata
  totalPredictions: number
  correctPredictions: number
  lastUpdated: Date
  version: string
}

const DEFAULT_WEIGHTS: ModelWeights = {
  injuryWeight: 0.20,       // Injuries huge in all sports
  paceWeight: 0.15,         // Tempo affects totals significantly
  locationWeight: 0.12,     // Home field advantage
  matchupWeight: 0.18,      // Specific matchup edges
  weatherWeight: 0.08,      // Weather for outdoor games
  trendWeight: 0.12,        // Historical trends
  sharpMoneyWeight: 0.15,   // Follow the money
  
  sportMultipliers: {
    nfl: 1.0,
    nba: 0.95,  // More variance
    nhl: 0.90,  // Highest variance
    mlb: 0.85,  // Pitching dominant
    ncaaf: 1.05, // Less parity = more predictable
    ncaab: 0.80, // Lots of variance
  },
  
  highConfThreshold: 72,
  medConfThreshold: 55,
  avoidThreshold: 45,
  
  totalPredictions: 0,
  correctPredictions: 0,
  lastUpdated: new Date(),
  version: '1.0.0',
}

// =============================================================================
// CONFIDENCE CALCULATION ENGINE
// =============================================================================

export class ConfidenceModel {
  private weights: ModelWeights
  private learningRate: number = 0.03
  
  constructor(weights?: ModelWeights) {
    this.weights = weights || DEFAULT_WEIGHTS
  }
  
  /**
   * Calculate comprehensive confidence score for a game
   */
  calculateConfidence(params: {
    gameId: string
    sport: string
    homeTeam: string
    awayTeam: string
    spreadLine: number
    totalLine: number
    injuries: InjuryImpact[]
    homeStyle: StyleOfPlay
    awayStyle: StyleOfPlay
    location: LocationFactor
    matchup: MatchupFactor
    weather?: WeatherFactor
    trends: TrendFactor[]
    sharpMoney?: { side: 'home' | 'away', moneyPct: number }
  }): ConfidenceScore {
    const factors: ConfidenceFactor[] = []
    
    // 1. INJURY ANALYSIS
    const injuryFactor = this.analyzeInjuries(params.injuries, params.sport)
    factors.push(injuryFactor)
    
    // 2. PACE/TEMPO ANALYSIS (crucial for O/U)
    const paceFactor = this.analyzePace(params.homeStyle, params.awayStyle, params.totalLine)
    factors.push(paceFactor)
    
    // 3. LOCATION ANALYSIS
    const locationFactor = this.analyzeLocation(params.location, params.sport)
    factors.push(locationFactor)
    
    // 4. MATCHUP ANALYSIS
    const matchupFactor = this.analyzeMatchup(params.matchup)
    factors.push(matchupFactor)
    
    // 5. WEATHER ANALYSIS (outdoor sports)
    if (params.weather && !params.weather.domeGame) {
      const weatherFactor = this.analyzeWeather(params.weather)
      factors.push(weatherFactor)
    }
    
    // 6. TREND ANALYSIS
    const trendFactor = this.analyzeTrends(params.trends)
    factors.push(trendFactor)
    
    // 7. SHARP MONEY SIGNAL
    if (params.sharpMoney) {
      const sharpFactor = this.analyzeSharpMoney(params.sharpMoney)
      factors.push(sharpFactor)
    }
    
    // Calculate spread confidence
    const spreadFactors = factors.filter(f => 
      ['injury', 'location', 'matchup', 'trend', 'sharp'].includes(f.category)
    )
    const spreadConfidence = this.computeConfidence(spreadFactors, params.sport)
    const spreadImpact = spreadFactors.reduce((sum, f) => sum + (f.impact * f.weight), 0)
    
    // Calculate total confidence
    const totalFactors = factors.filter(f =>
      ['injury', 'pace', 'weather', 'matchup', 'trend'].includes(f.category)
    )
    const totalConfidence = this.computeConfidence(totalFactors, params.sport)
    const totalImpact = totalFactors.reduce((sum, f) => sum + (f.impact * f.weight), 0)
    
    // Determine picks
    const spreadPick = spreadConfidence < this.weights.avoidThreshold ? 'avoid' :
      spreadImpact > 0 ? 'away' : 'home'
    
    const totalPick = totalConfidence < this.weights.avoidThreshold ? 'avoid' :
      totalImpact > 0 ? 'over' : 'under'
    
    // Best bet
    const bestBet = spreadConfidence > totalConfidence ? 
      (spreadConfidence >= this.weights.medConfThreshold ? 'spread' : 'avoid') :
      (totalConfidence >= this.weights.medConfThreshold ? 'total' : 'avoid')
    
    // Generate reasoning
    const reasoning = this.generateReasoning(factors, spreadPick, totalPick)
    
    return {
      gameId: params.gameId,
      sport: params.sport,
      homeTeam: params.homeTeam,
      awayTeam: params.awayTeam,
      
      spreadPick,
      spreadConfidence: Math.round(spreadConfidence),
      spreadLine: params.spreadLine,
      spreadFactors,
      spreadEdge: Math.round(spreadImpact * 10) / 10,
      
      totalPick,
      totalConfidence: Math.round(totalConfidence),
      totalLine: params.totalLine,
      totalFactors,
      projectedTotal: params.totalLine + totalImpact,
      
      overallConfidence: Math.round((spreadConfidence + totalConfidence) / 2),
      bestBet,
      reasoning,
      
      timestamp: new Date(),
      modelVersion: this.weights.version,
    }
  }
  
  /**
   * Analyze injury impact on game
   */
  private analyzeInjuries(injuries: InjuryImpact[], sport: string): ConfidenceFactor {
    if (injuries.length === 0) {
      return {
        name: 'No Key Injuries',
        category: 'injury',
        weight: this.weights.injuryWeight,
        impact: 0,
        description: 'Both teams healthy - no injury edge',
        confidence: 80,
      }
    }
    
    // Sum injury impacts by team
    const teamImpacts: Record<string, { spread: number, total: number }> = {}
    
    for (const injury of injuries) {
      if (!teamImpacts[injury.team]) {
        teamImpacts[injury.team] = { spread: 0, total: 0 }
      }
      
      // Weight by status certainty
      const statusMultiplier = {
        'OUT': 1.0,
        'DOUBTFUL': 0.85,
        'QUESTIONABLE': 0.5,
        'PROBABLE': 0.15,
        'GTD': 0.6,
      }[injury.status] || 0.5
      
      teamImpacts[injury.team].spread += injury.spreadImpact * statusMultiplier
      teamImpacts[injury.team].total += injury.totalImpact * statusMultiplier
    }
    
    const teams = Object.keys(teamImpacts)
    const netSpreadImpact = teams.length === 2 ? 
      teamImpacts[teams[0]].spread - teamImpacts[teams[1]].spread : 0
    const netTotalImpact = Object.values(teamImpacts)
      .reduce((sum, t) => sum + t.total, 0)
    
    const keyInjuries = injuries.filter(i => i.impactScore >= 70)
    
    return {
      name: `${injuries.length} Injuries (${keyInjuries.length} Key)`,
      category: 'injury',
      weight: this.weights.injuryWeight * (keyInjuries.length > 0 ? 1.3 : 1.0),
      impact: netSpreadImpact + netTotalImpact,
      description: keyInjuries.length > 0 ?
        `Key injuries: ${keyInjuries.map(i => `${i.player} (${i.status})`).join(', ')}` :
        `Minor injuries only - limited impact`,
      confidence: keyInjuries.length > 0 ? 85 : 60,
    }
  }
  
  /**
   * Analyze pace/tempo for O/U
   */
  private analyzePace(
    homeStyle: StyleOfPlay, 
    awayStyle: StyleOfPlay,
    totalLine: number
  ): ConfidenceFactor {
    const avgPace = (homeStyle.pace + awayStyle.pace) / 2
    const avgPaceRank = (homeStyle.paceRank + awayStyle.paceRank) / 2
    
    const expectedTotal = homeStyle.pointsPerGame + awayStyle.pointsPerGame
    const lineVsExpected = expectedTotal - totalLine
    
    // Both fast = over lean, both slow = under lean
    const tempoAlign = homeStyle.tempo === awayStyle.tempo
    const bothFast = homeStyle.tempo === 'fast' && awayStyle.tempo === 'fast'
    const bothSlow = homeStyle.tempo === 'slow' && awayStyle.tempo === 'slow'
    
    let impact = 0
    let description = ''
    
    if (bothFast) {
      impact = 3.5 // Over lean
      description = `Both teams play fast (avg pace rank: ${avgPaceRank.toFixed(0)}) - favors OVER`
    } else if (bothSlow) {
      impact = -3.5 // Under lean
      description = `Both teams play slow (avg pace rank: ${avgPaceRank.toFixed(0)}) - favors UNDER`
    } else if (tempoAlign) {
      impact = lineVsExpected > 3 ? -2 : lineVsExpected < -3 ? 2 : 0
      description = `Moderate tempo matchup. Expected total: ${expectedTotal.toFixed(1)}`
    } else {
      // Mismatched styles - look at who controls pace
      const fasterTeam = homeStyle.pace > awayStyle.pace ? 'home' : 'away'
      impact = Math.abs(homeStyle.paceRank - awayStyle.paceRank) > 10 ? 1.5 : 0.5
      description = `Pace mismatch - ${fasterTeam} team controls tempo`
    }
    
    return {
      name: 'Pace & Tempo',
      category: 'pace',
      weight: this.weights.paceWeight,
      impact,
      description,
      confidence: tempoAlign ? 75 : 60,
    }
  }
  
  /**
   * Analyze location factors
   */
  private analyzeLocation(location: LocationFactor, sport: string): ConfidenceFactor {
    let impact = location.isHome ? -location.homeAdvantage : 0
    let description = location.isHome ? 'Home field advantage' : 'Road team'
    const factors: string[] = []
    
    // Altitude (Denver effect)
    if (location.elevation && location.elevation > 5000) {
      impact += location.isHome ? 1.5 : -1.5
      factors.push('altitude advantage')
    }
    
    // Rest days
    if (location.restDays !== undefined) {
      if (location.restDays >= 7) {
        impact += 1.0
        factors.push('well rested')
      } else if (location.restDays <= 2) {
        impact -= 1.5
        factors.push('short rest')
      }
    }
    
    // Back to back (NBA)
    if (location.backToBack) {
      impact -= 3.0
      factors.push('B2B game')
    }
    
    // Travel distance
    if (location.travelDistance && location.travelDistance > 2000) {
      impact -= 1.0
      factors.push('cross-country travel')
    }
    
    if (factors.length > 0) {
      description += ` (${factors.join(', ')})`
    }
    
    return {
      name: 'Location & Rest',
      category: 'location',
      weight: this.weights.locationWeight,
      impact,
      description,
      confidence: 70,
    }
  }
  
  /**
   * Analyze specific matchup factors
   */
  private analyzeMatchup(matchup: MatchupFactor): ConfidenceFactor {
    let impact = 0
    const factors: string[] = []
    
    // Parse H2H ATS
    const [h2hWins, h2hLosses] = matchup.h2hATS.split('-').map(Number)
    const h2hWinPct = h2hWins / (h2hWins + h2hLosses)
    
    if (h2hWinPct >= 0.65 && (h2hWins + h2hLosses) >= 5) {
      impact += 2.0
      factors.push(`strong H2H record ${matchup.h2hATS} ATS`)
    } else if (h2hWinPct <= 0.35 && (h2hWins + h2hLosses) >= 5) {
      impact -= 2.0
      factors.push(`poor H2H record ${matchup.h2hATS} ATS`)
    }
    
    // Offensive vs Defensive matchup
    const offDefDiff = Math.abs(matchup.offVsDefRank - matchup.defVsOffRank)
    if (offDefDiff >= 15) {
      impact += offDefDiff > 0 ? 1.5 : -1.5
      factors.push(matchup.keyMatchupAdvantage)
    }
    
    return {
      name: 'Matchup Analysis',
      category: 'matchup',
      weight: this.weights.matchupWeight,
      impact,
      description: factors.length > 0 ? factors.join('; ') : 'Neutral matchup',
      confidence: factors.length > 0 ? 72 : 55,
    }
  }
  
  /**
   * Analyze weather for outdoor games
   */
  private analyzeWeather(weather: WeatherFactor): ConfidenceFactor {
    let impact = weather.weatherImpact
    const conditions: string[] = []
    
    if (weather.wind && weather.wind >= 15) {
      impact -= 3.5
      conditions.push(`${weather.wind} mph wind`)
    }
    
    if (weather.temp && weather.temp <= 25) {
      impact -= 2.0
      conditions.push(`${weather.temp}°F`)
    } else if (weather.temp && weather.temp >= 90) {
      impact -= 1.0
      conditions.push(`${weather.temp}°F heat`)
    }
    
    if (weather.precipitation && weather.precipitation > 30) {
      impact -= 2.5
      conditions.push(`${weather.precipitation}% precip`)
    }
    
    return {
      name: 'Weather Impact',
      category: 'weather',
      weight: this.weights.weatherWeight,
      impact,
      description: conditions.length > 0 ? 
        `${conditions.join(', ')} - favors UNDER` : 
        'Good conditions - no weather impact',
      confidence: 75,
    }
  }
  
  /**
   * Analyze historical trends
   */
  private analyzeTrends(trends: TrendFactor[]): ConfidenceFactor {
    if (trends.length === 0) {
      return {
        name: 'No Strong Trends',
        category: 'trend',
        weight: this.weights.trendWeight,
        impact: 0,
        description: 'No significant betting trends identified',
        confidence: 50,
      }
    }
    
    // Find strongest trend
    const strongTrends = trends.filter(t => t.winPct >= 60 && t.recentGames >= 10)
    
    if (strongTrends.length === 0) {
      return {
        name: 'Weak Trends',
        category: 'trend',
        weight: this.weights.trendWeight * 0.5,
        impact: 0,
        description: 'Small sample trends - low confidence',
        confidence: 45,
      }
    }
    
    const bestTrend = strongTrends.sort((a, b) => b.confidence - a.confidence)[0]
    
    return {
      name: `Trend: ${bestTrend.description}`,
      category: 'trend',
      weight: this.weights.trendWeight,
      impact: bestTrend.winPct >= 70 ? 3 : bestTrend.winPct >= 60 ? 2 : 1,
      description: `${bestTrend.record} (${bestTrend.winPct.toFixed(0)}%) in last ${bestTrend.recentGames} games`,
      confidence: bestTrend.confidence,
    }
  }
  
  /**
   * Analyze sharp money movement
   */
  private analyzeSharpMoney(sharp: { side: 'home' | 'away', moneyPct: number }): ConfidenceFactor {
    const isSignificant = sharp.moneyPct >= 65
    
    return {
      name: 'Sharp Money Signal',
      category: 'sharp',
      weight: this.weights.sharpMoneyWeight * (isSignificant ? 1.2 : 0.8),
      impact: sharp.side === 'away' ? 2.5 : -2.5,
      description: isSignificant ?
        `Sharp money (${sharp.moneyPct}%) on ${sharp.side}` :
        `Mild sharp lean (${sharp.moneyPct}%) on ${sharp.side}`,
      confidence: isSignificant ? 80 : 60,
    }
  }
  
  /**
   * Compute final confidence from factors
   */
  private computeConfidence(factors: ConfidenceFactor[], sport: string): number {
    const sportMult = this.weights.sportMultipliers[sport] || 1.0
    
    // Weighted average of factor confidences
    let totalWeight = 0
    let weightedConf = 0
    
    for (const factor of factors) {
      totalWeight += factor.weight
      weightedConf += factor.confidence * factor.weight
    }
    
    const baseConfidence = totalWeight > 0 ? weightedConf / totalWeight : 50
    
    // Boost for aligned factors
    const positiveFactors = factors.filter(f => f.impact > 0).length
    const negativeFactors = factors.filter(f => f.impact < 0).length
    const alignment = Math.abs(positiveFactors - negativeFactors) / factors.length
    const alignmentBoost = alignment * 10
    
    return Math.min(95, Math.max(25, (baseConfidence + alignmentBoost) * sportMult))
  }
  
  /**
   * Generate human-readable reasoning
   */
  private generateReasoning(
    factors: ConfidenceFactor[],
    spreadPick: string,
    totalPick: string
  ): string[] {
    const reasons: string[] = []
    
    // Top positive factors
    const positiveFactors = factors
      .filter(f => Math.abs(f.impact) >= 1.5 && f.confidence >= 65)
      .sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact))
      .slice(0, 3)
    
    for (const f of positiveFactors) {
      reasons.push(`✓ ${f.description}`)
    }
    
    // Key warnings
    const warnings = factors
      .filter(f => f.confidence < 50)
      .slice(0, 2)
    
    for (const w of warnings) {
      reasons.push(`⚠️ ${w.name}: Low confidence factor`)
    }
    
    return reasons
  }
  
  // =============================================================================
  // RSI (RECURSIVE SELF-IMPROVEMENT)
  // =============================================================================
  
  /**
   * Record actual result and update weights
   */
  recordResult(prediction: ConfidenceScore, actual: {
    spreadCovered: boolean
    totalHit: boolean
    actualSpread: number
    actualTotal: number
  }): void {
    this.weights.totalPredictions++
    
    // Track accuracy
    const spreadCorrect = prediction.spreadPick !== 'avoid' && (
      (prediction.spreadPick === 'home' && actual.spreadCovered) ||
      (prediction.spreadPick === 'away' && !actual.spreadCovered)
    )
    
    const totalCorrect = prediction.totalPick !== 'avoid' && (
      (prediction.totalPick === 'over' && actual.actualTotal > prediction.totalLine) ||
      (prediction.totalPick === 'under' && actual.actualTotal < prediction.totalLine)
    )
    
    if (spreadCorrect || totalCorrect) {
      this.weights.correctPredictions++
    }
    
    // Update factor weights based on which factors were accurate
    this.updateWeights(prediction, actual)
  }
  
  /**
   * Adjust model weights based on results
   */
  private updateWeights(prediction: ConfidenceScore, actual: {
    spreadCovered: boolean
    totalHit: boolean
    actualSpread: number
    actualTotal: number
  }): void {
    // Calculate errors
    const spreadError = Math.abs(actual.actualSpread - prediction.spreadLine)
    const totalError = Math.abs(actual.actualTotal - prediction.projectedTotal)
    
    // Analyze which factor categories were most predictive
    for (const factor of [...prediction.spreadFactors, ...prediction.totalFactors]) {
      const wasCorrect = (factor.category === 'pace' || factor.category === 'weather') ?
        (factor.impact > 0 && actual.actualTotal > prediction.totalLine) ||
        (factor.impact < 0 && actual.actualTotal < prediction.totalLine) :
        (factor.impact < 0 && actual.spreadCovered) ||
        (factor.impact > 0 && !actual.spreadCovered)
      
      // Adjust weight up or down
      const adjustment = wasCorrect ? this.learningRate : -this.learningRate * 0.5
      
      switch (factor.category) {
        case 'injury':
          this.weights.injuryWeight = Math.max(0.05, Math.min(0.35, 
            this.weights.injuryWeight + adjustment))
          break
        case 'pace':
          this.weights.paceWeight = Math.max(0.05, Math.min(0.30,
            this.weights.paceWeight + adjustment))
          break
        case 'location':
          this.weights.locationWeight = Math.max(0.05, Math.min(0.25,
            this.weights.locationWeight + adjustment))
          break
        case 'matchup':
          this.weights.matchupWeight = Math.max(0.05, Math.min(0.30,
            this.weights.matchupWeight + adjustment))
          break
        case 'weather':
          this.weights.weatherWeight = Math.max(0.02, Math.min(0.15,
            this.weights.weatherWeight + adjustment))
          break
        case 'trend':
          this.weights.trendWeight = Math.max(0.05, Math.min(0.25,
            this.weights.trendWeight + adjustment))
          break
        case 'sharp':
          this.weights.sharpMoneyWeight = Math.max(0.05, Math.min(0.30,
            this.weights.sharpMoneyWeight + adjustment))
          break
      }
    }
    
    // Normalize weights
    const totalWeight = this.weights.injuryWeight + this.weights.paceWeight +
      this.weights.locationWeight + this.weights.matchupWeight +
      this.weights.weatherWeight + this.weights.trendWeight +
      this.weights.sharpMoneyWeight
    
    if (totalWeight !== 1.0) {
      const scale = 1.0 / totalWeight
      this.weights.injuryWeight *= scale
      this.weights.paceWeight *= scale
      this.weights.locationWeight *= scale
      this.weights.matchupWeight *= scale
      this.weights.weatherWeight *= scale
      this.weights.trendWeight *= scale
      this.weights.sharpMoneyWeight *= scale
    }
    
    this.weights.lastUpdated = new Date()
  }
  
  /**
   * Get current model weights
   */
  getWeights(): ModelWeights {
    return { ...this.weights }
  }
  
  /**
   * Get model performance
   */
  getPerformance(): { accuracy: number, totalPredictions: number } {
    return {
      accuracy: this.weights.totalPredictions > 0 ?
        (this.weights.correctPredictions / this.weights.totalPredictions) * 100 : 0,
      totalPredictions: this.weights.totalPredictions,
    }
  }
}

// =============================================================================
// DEPRECATED: Mock data removed - use real confidence scores from database
// =============================================================================

export function getMockConfidenceScores(): ConfidenceScore[] {
  console.warn('[Confidence Score] getMockConfidenceScores is deprecated - use real scores from database')
  // Return empty array - no fake confidence scores, UI should show "no data available"
  return []
}
