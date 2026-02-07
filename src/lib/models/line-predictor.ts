/**
 * Line Predictor Model
 * AI-powered line movement prediction using historical odds data
 * 
 * Features:
 * 1. Predicts where line will move based on betting patterns
 * 2. Tracks predictions vs actuals for recursive learning
 * 3. Recommends optimal bet timing
 * 4. Uses The Odds API historical data + betting splits
 */

import { BettingSplit } from '../scrapers/betting-splits'

// =============================================================================
// TYPES
// =============================================================================

export interface LinePrediction {
  id: string
  gameId: string
  sport: string
  homeTeam: string
  awayTeam: string
  betType: 'spread' | 'total' | 'moneyline'
  
  // Current state
  currentLine: number
  currentOdds: { home: number; away: number }
  
  // Prediction
  predictedLine: number
  predictedDirection: 'up' | 'down' | 'stable'
  predictedMagnitude: number // Expected movement in points
  confidence: number // 0-100
  
  // Timing recommendation
  optimalBetTiming: 'now' | 'wait' | 'avoid'
  timingReason: string
  expectedLineAtGameTime: number
  
  // Factors used in prediction
  factors: PredictionFactor[]
  
  // Metadata
  predictionMadeAt: string
  gameTime: string
  modelVersion: string
}

export interface PredictionFactor {
  name: string
  impact: number // -100 to +100 (negative = line moving down, positive = up)
  confidence: number
  description: string
}

export interface PredictionRecord {
  id: string
  predictionId: string
  gameId: string
  sport: string
  
  // What we predicted
  predictedLine: number
  predictedDirection: 'up' | 'down' | 'stable'
  confidence: number
  
  // What actually happened
  actualOpenLine: number
  actualClosingLine: number
  actualMovement: number
  
  // Accuracy metrics
  directionCorrect: boolean
  magnitudeError: number // Absolute error in points
  
  // For learning
  factors: PredictionFactor[]
  settledAt: string
}

export interface ModelPerformance {
  totalPredictions: number
  directionAccuracy: number // % correct direction
  avgMagnitudeError: number // Average points off
  profitableTimingPct: number // % of timing recommendations that were profitable
  byConfidenceLevel: {
    high: { count: number; accuracy: number }
    medium: { count: number; accuracy: number }
    low: { count: number; accuracy: number }
  }
  bySport: Record<string, { count: number; accuracy: number }>
  lastUpdated: string
}

// =============================================================================
// LINE PREDICTOR ENGINE
// =============================================================================

export class LinePredictorModel {
  private modelVersion = '1.0.0'
  private predictionHistory: PredictionRecord[] = []
  private modelWeights: Record<string, number> = {}
  
  constructor() {
    // Initialize default weights (will be adjusted by recursive learning)
    this.modelWeights = {
      publicBetPctWeight: 0.3,
      moneyPctWeight: 0.5,
      lineMovementMomentum: 0.4,
      sharpActionWeight: 0.7,
      timeToGameWeight: 0.3,
      keyNumberProximity: 0.5,
      teamTrendWeight: 0.2,
      newsImpactWeight: 0.3
    }
  }
  
  /**
   * Main prediction function
   * Takes current betting data and predicts where line will move
   */
  predictLineMovement(
    gameId: string,
    sport: string,
    homeTeam: string,
    awayTeam: string,
    currentLine: number,
    bettingSplit: BettingSplit | null,
    oddsHistory: { timestamp: string; line: number }[],
    hoursUntilGame: number
  ): LinePrediction {
    const factors: PredictionFactor[] = []
    let totalImpact = 0
    let totalConfidence = 0
    let factorCount = 0
    
    // =================
    // FACTOR 1: Public Betting Percentage
    // Heavy public action typically moves line TOWARD public side initially
    // =================
    if (bettingSplit) {
      const publicHomePct = bettingSplit.spread.homeBetPct
      const publicAwayPct = bettingSplit.spread.awayBetPct
      const publicLean = publicHomePct > publicAwayPct ? 'home' : 'away'
      const publicMagnitude = Math.abs(publicHomePct - 50)
      
      // Public money moves lines, but sharps often fade heavy public
      let publicImpact = 0
      if (publicMagnitude > 25) {
        // Very heavy public - expect initial move toward them, then potential reversal
        publicImpact = publicLean === 'home' ? -publicMagnitude * 0.02 : publicMagnitude * 0.02
      } else if (publicMagnitude > 10) {
        publicImpact = publicLean === 'home' ? -publicMagnitude * 0.01 : publicMagnitude * 0.01
      }
      
      factors.push({
        name: 'Public Betting Split',
        impact: publicImpact * 100,
        confidence: 60 + (publicMagnitude > 20 ? 15 : 0),
        description: `${Math.round(publicHomePct)}% of bets on ${homeTeam}, ${Math.round(publicAwayPct)}% on ${awayTeam}`
      })
      
      totalImpact += publicImpact * this.modelWeights.publicBetPctWeight
      totalConfidence += 60
      factorCount++
    }
    
    // =================
    // FACTOR 2: Money Percentage vs Ticket Percentage (Sharp Detection)
    // If tickets heavy one way but money heavy the other = sharp action
    // =================
    if (bettingSplit) {
      const ticketHomePct = bettingSplit.spread.homeBetPct
      const moneyHomePct = bettingSplit.spread.homeMoneyPct
      const ticketMoneyDiff = Math.abs(ticketHomePct - moneyHomePct)
      
      if (ticketMoneyDiff > 15) {
        // Significant split - sharps likely on money side
        const sharpSide = moneyHomePct > ticketHomePct ? 'home' : 'away'
        const sharpImpact = sharpSide === 'home' ? -ticketMoneyDiff * 0.03 : ticketMoneyDiff * 0.03
        
        factors.push({
          name: 'Sharp Money Detection',
          impact: sharpImpact * 100,
          confidence: 70 + Math.min(ticketMoneyDiff, 20),
          description: `Tickets: ${ticketHomePct}% ${homeTeam} | Money: ${moneyHomePct}% ${homeTeam} - Sharp money on ${sharpSide === 'home' ? homeTeam : awayTeam}`
        })
        
        totalImpact += sharpImpact * this.modelWeights.sharpActionWeight
        totalConfidence += 70
        factorCount++
      }
    }
    
    // =================
    // FACTOR 3: Line Movement Momentum
    // Lines that have been moving tend to continue (until they don't)
    // =================
    if (oddsHistory.length >= 2) {
      const recentHistory = oddsHistory.slice(-5)
      const lineChanges = recentHistory.slice(1).map((h, i) => h.line - recentHistory[i].line)
      const avgMovement = lineChanges.reduce((a, b) => a + b, 0) / lineChanges.length
      
      if (Math.abs(avgMovement) > 0.2) {
        factors.push({
          name: 'Line Movement Momentum',
          impact: avgMovement * 50,
          confidence: 55 + Math.min(Math.abs(avgMovement) * 20, 20),
          description: `Line has been moving ${avgMovement > 0 ? 'up' : 'down'} (avg ${avgMovement.toFixed(2)} pts/move)`
        })
        
        totalImpact += avgMovement * this.modelWeights.lineMovementMomentum
        totalConfidence += 55
        factorCount++
      }
    }
    
    // =================
    // FACTOR 4: Time Until Game
    // Most sharp action happens 1-4 hours before game
    // =================
    let timeImpact = 0
    let timeConfidence = 50
    let timingDescription = ''
    
    if (hoursUntilGame > 24) {
      timeImpact = 0 // Too early to predict reliably
      timeConfidence = 40
      timingDescription = 'More than 24h out - line may move significantly'
    } else if (hoursUntilGame > 4) {
      timeImpact = totalImpact * 0.8 // Expect 80% of predicted move
      timeConfidence = 55
      timingDescription = '4-24h out - expect moderate movement'
    } else if (hoursUntilGame > 1) {
      timeImpact = totalImpact * 1.2 // Sharp action window - amplify prediction
      timeConfidence = 70
      timingDescription = '1-4h out - SHARP ACTION WINDOW'
    } else {
      timeImpact = totalImpact * 0.3 // Late - most movement done
      timeConfidence = 65
      timingDescription = 'Less than 1h - most line movement complete'
    }
    
    factors.push({
      name: 'Time to Game',
      impact: timeImpact * 10,
      confidence: timeConfidence,
      description: timingDescription
    })
    
    totalConfidence += timeConfidence
    factorCount++
    
    // =================
    // FACTOR 5: Key Number Proximity
    // Lines near 3, 7 (NFL), 5.5, 7 (NBA) resist movement
    // =================
    const keyNumbers = sport === 'NFL' ? [3, 7, 10, 14] : [5.5, 7, 8.5]
    const nearestKeyNumber = keyNumbers.reduce((nearest, kn) => 
      Math.abs(currentLine - kn) < Math.abs(currentLine - nearest) ? kn : nearest
    )
    const distanceToKey = Math.abs(currentLine - nearestKeyNumber)
    
    if (distanceToKey < 0.5) {
      factors.push({
        name: 'Key Number Resistance',
        impact: -totalImpact * 30, // Dampen predicted movement
        confidence: 75,
        description: `Line at ${currentLine} near key number ${nearestKeyNumber} - movement resistance`
      })
      
      totalImpact *= 0.5 // Cut predicted movement in half near key numbers
      totalConfidence += 75
      factorCount++
    }
    
    // =================
    // CALCULATE FINAL PREDICTION
    // =================
    const avgConfidence = factorCount > 0 ? totalConfidence / factorCount : 50
    const predictedMagnitude = Math.abs(totalImpact)
    const predictedDirection = totalImpact < -0.1 ? 'down' : totalImpact > 0.1 ? 'up' : 'stable'
    const predictedLine = currentLine + totalImpact
    
    // =================
    // OPTIMAL BET TIMING
    // =================
    let optimalBetTiming: 'now' | 'wait' | 'avoid' = 'now'
    let timingReason = ''
    
    if (predictedDirection === 'down' && bettingSplit && bettingSplit.spread.homeBetPct > 55) {
      // Line going down, you want home team - WAIT for better number
      optimalBetTiming = 'wait'
      timingReason = `Line predicted to move from ${currentLine} to ${predictedLine.toFixed(1)}. Wait for better number on ${homeTeam}.`
    } else if (predictedDirection === 'up' && bettingSplit && bettingSplit.spread.awayBetPct > 55) {
      // Line going up, you want away team - BET NOW
      optimalBetTiming = 'now'
      timingReason = `Line predicted to move from ${currentLine} to ${predictedLine.toFixed(1)}. Bet ${awayTeam} NOW before line moves.`
    } else if (avgConfidence < 50) {
      optimalBetTiming = 'avoid'
      timingReason = 'Low confidence prediction - consider waiting for more data.'
    } else {
      optimalBetTiming = 'now'
      timingReason = `Line appears stable. Current ${currentLine} is fair value.`
    }
    
    return {
      id: `pred-${gameId}-${Date.now()}`,
      gameId,
      sport,
      homeTeam,
      awayTeam,
      betType: 'spread',
      currentLine,
      currentOdds: { home: -110, away: -110 },
      predictedLine: Math.round(predictedLine * 2) / 2, // Round to half-point
      predictedDirection,
      predictedMagnitude: Math.round(predictedMagnitude * 2) / 2,
      confidence: Math.round(avgConfidence),
      optimalBetTiming,
      timingReason,
      expectedLineAtGameTime: Math.round(predictedLine * 2) / 2,
      factors,
      predictionMadeAt: new Date().toISOString(),
      gameTime: new Date(Date.now() + hoursUntilGame * 60 * 60 * 1000).toISOString(),
      modelVersion: this.modelVersion
    }
  }
  
  /**
   * Record actual results and update model weights (recursive learning)
   */
  recordPredictionResult(
    predictionId: string,
    actualClosingLine: number,
    prediction: LinePrediction
  ): PredictionRecord {
    const actualMovement = actualClosingLine - prediction.currentLine
    const predictedMovement = prediction.predictedLine - prediction.currentLine
    
    const directionCorrect = 
      (actualMovement > 0.25 && prediction.predictedDirection === 'up') ||
      (actualMovement < -0.25 && prediction.predictedDirection === 'down') ||
      (Math.abs(actualMovement) <= 0.25 && prediction.predictedDirection === 'stable')
    
    const magnitudeError = Math.abs(actualMovement - predictedMovement)
    
    const record: PredictionRecord = {
      id: `record-${Date.now()}`,
      predictionId,
      gameId: prediction.gameId,
      sport: prediction.sport,
      predictedLine: prediction.predictedLine,
      predictedDirection: prediction.predictedDirection,
      confidence: prediction.confidence,
      actualOpenLine: prediction.currentLine,
      actualClosingLine,
      actualMovement,
      directionCorrect,
      magnitudeError,
      factors: prediction.factors,
      settledAt: new Date().toISOString()
    }
    
    this.predictionHistory.push(record)
    
    // Update model weights based on results (recursive learning)
    this.updateModelWeights(record)
    
    return record
  }
  
  /**
   * Recursive learning: Adjust weights based on prediction accuracy
   */
  private updateModelWeights(record: PredictionRecord): void {
    // Learning rate - how much to adjust weights
    const learningRate = 0.05
    
    // For each factor, adjust weight based on contribution to error
    for (const factor of record.factors) {
      const factorKey = this.getWeightKeyForFactor(factor.name)
      if (!factorKey) continue
      
      const currentWeight = this.modelWeights[factorKey] || 0.5
      
      if (record.directionCorrect && factor.confidence > 60) {
        // Factor was confident and we got direction right - increase weight
        this.modelWeights[factorKey] = Math.min(1, currentWeight + learningRate)
      } else if (!record.directionCorrect && factor.confidence > 60) {
        // Factor was confident but we got direction wrong - decrease weight
        this.modelWeights[factorKey] = Math.max(0.1, currentWeight - learningRate)
      }
    }
    
    console.log('Updated model weights:', this.modelWeights)
  }
  
  private getWeightKeyForFactor(factorName: string): string | null {
    const mapping: Record<string, string> = {
      'Public Betting Split': 'publicBetPctWeight',
      'Sharp Money Detection': 'sharpActionWeight',
      'Line Movement Momentum': 'lineMovementMomentum',
      'Time to Game': 'timeToGameWeight',
      'Key Number Resistance': 'keyNumberProximity'
    }
    return mapping[factorName] || null
  }
  
  /**
   * Get model performance metrics
   */
  getPerformanceMetrics(): ModelPerformance {
    const records = this.predictionHistory
    
    if (records.length === 0) {
      return {
        totalPredictions: 0,
        directionAccuracy: 0,
        avgMagnitudeError: 0,
        profitableTimingPct: 0,
        byConfidenceLevel: {
          high: { count: 0, accuracy: 0 },
          medium: { count: 0, accuracy: 0 },
          low: { count: 0, accuracy: 0 }
        },
        bySport: {},
        lastUpdated: new Date().toISOString()
      }
    }
    
    const correctPredictions = records.filter(r => r.directionCorrect).length
    const avgError = records.reduce((sum, r) => sum + r.magnitudeError, 0) / records.length
    
    // By confidence level
    const highConf = records.filter(r => r.confidence >= 70)
    const medConf = records.filter(r => r.confidence >= 50 && r.confidence < 70)
    const lowConf = records.filter(r => r.confidence < 50)
    
    // By sport
    const bySport: Record<string, { count: number; accuracy: number }> = {}
    const sports = [...new Set(records.map(r => r.sport))]
    for (const sport of sports) {
      const sportRecords = records.filter(r => r.sport === sport)
      bySport[sport] = {
        count: sportRecords.length,
        accuracy: sportRecords.filter(r => r.directionCorrect).length / sportRecords.length * 100
      }
    }
    
    return {
      totalPredictions: records.length,
      directionAccuracy: (correctPredictions / records.length) * 100,
      avgMagnitudeError: avgError,
      profitableTimingPct: 0, // Would need bet tracking to calculate
      byConfidenceLevel: {
        high: {
          count: highConf.length,
          accuracy: highConf.length > 0 ? highConf.filter(r => r.directionCorrect).length / highConf.length * 100 : 0
        },
        medium: {
          count: medConf.length,
          accuracy: medConf.length > 0 ? medConf.filter(r => r.directionCorrect).length / medConf.length * 100 : 0
        },
        low: {
          count: lowConf.length,
          accuracy: lowConf.length > 0 ? lowConf.filter(r => r.directionCorrect).length / lowConf.length * 100 : 0
        }
      },
      bySport,
      lastUpdated: new Date().toISOString()
    }
  }
}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

let linePredictorInstance: LinePredictorModel | null = null

export function getLinePredictor(): LinePredictorModel {
  if (!linePredictorInstance) {
    linePredictorInstance = new LinePredictorModel()
  }
  return linePredictorInstance
}

// =============================================================================
// DEPRECATED: Mock data removed - use real ML predictions from database
// These functions now return empty data to indicate "no predictions available"
// =============================================================================

export function getMockLinePredictions(_sport: string): LinePrediction[] {
  console.warn('[Line Predictor] getMockLinePredictions is deprecated - use real predictions from database')
  // Return empty array - no fake predictions, UI should show "no predictions available"
  return []
}

// =============================================================================
// DEPRECATED: Mock performance removed - use real model metrics from database
// =============================================================================

export function getMockModelPerformance(): ModelPerformance {
  console.warn('[Line Predictor] getMockModelPerformance is deprecated - use real metrics from database')
  // Return zeroed performance - no fake stats
  return {
    totalPredictions: 0,
    directionAccuracy: 0,
    avgMagnitudeError: 0,
    profitableTimingPct: 0,
    byConfidenceLevel: {
      high: { count: 0, accuracy: 0 },
      medium: { count: 0, accuracy: 0 },
      low: { count: 0, accuracy: 0 }
    },
    bySport: {
      NFL: { count: 0, accuracy: 0 },
      NBA: { count: 0, accuracy: 0 },
      MLB: { count: 0, accuracy: 0 },
      NHL: { count: 0, accuracy: 0 }
    },
    lastUpdated: new Date().toISOString()
  }
}
