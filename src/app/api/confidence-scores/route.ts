import { NextResponse } from 'next/server'
import { 
  ConfidenceModel, 
  getMockConfidenceScores, 
  type ConfidenceScore,
  type ModelWeights
} from '@/lib/models/confidence-score'

// In-memory model instance (would be in database in production)
let modelInstance: ConfidenceModel | null = null

function getModel(): ConfidenceModel {
  if (!modelInstance) {
    modelInstance = new ConfidenceModel()
  }
  return modelInstance
}

/**
 * GET /api/confidence-scores
 * Returns confidence scores for today's games
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const sport = searchParams.get('sport')?.toUpperCase()
  const gameId = searchParams.get('gameId')
  
  try {
    // Get mock scores (in production, calculate dynamically)
    let scores = getMockConfidenceScores()
    
    // Filter by sport
    if (sport && sport !== 'ALL') {
      scores = scores.filter(s => s.sport.toUpperCase() === sport)
    }
    
    // Filter by game ID
    if (gameId) {
      scores = scores.filter(s => s.gameId === gameId)
    }
    
    // Get model performance
    const model = getModel()
    const performance = model.getPerformance()
    const weights = model.getWeights()
    
    return NextResponse.json({
      scores,
      modelPerformance: {
        accuracy: performance.accuracy,
        totalPredictions: performance.totalPredictions,
        version: weights.version,
        lastUpdated: weights.lastUpdated,
      },
      weights: {
        injury: weights.injuryWeight,
        pace: weights.paceWeight,
        location: weights.locationWeight,
        matchup: weights.matchupWeight,
        weather: weights.weatherWeight,
        trend: weights.trendWeight,
        sharpMoney: weights.sharpMoneyWeight,
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Confidence scores error:', error)
    return NextResponse.json(
      { error: 'Failed to get confidence scores' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/confidence-scores
 * Calculate confidence for a specific game
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    // Validate required fields
    if (!body.gameId || !body.sport || !body.homeTeam || !body.awayTeam) {
      return NextResponse.json(
        { error: 'Missing required fields: gameId, sport, homeTeam, awayTeam' },
        { status: 400 }
      )
    }
    
    const model = getModel()
    
    // Calculate confidence with provided data
    const score = model.calculateConfidence({
      gameId: body.gameId,
      sport: body.sport,
      homeTeam: body.homeTeam,
      awayTeam: body.awayTeam,
      spreadLine: body.spreadLine || 0,
      totalLine: body.totalLine || 0,
      injuries: body.injuries || [],
      homeStyle: body.homeStyle || {
        sport: body.sport,
        team: body.homeTeam,
        pace: 100,
        paceRank: 15,
        tempo: 'moderate',
        pointsPerGame: 25,
        offensiveRating: 100,
      },
      awayStyle: body.awayStyle || {
        sport: body.sport,
        team: body.awayTeam,
        pace: 100,
        paceRank: 15,
        tempo: 'moderate',
        pointsPerGame: 25,
        offensiveRating: 100,
      },
      location: body.location || {
        isHome: true,
        homeAdvantage: body.sport === 'NFL' ? 2.5 : 3.5,
      },
      matchup: body.matchup || {
        teamAbbr: body.homeTeam,
        opponentAbbr: body.awayTeam,
        h2hRecord: '5-5',
        h2hATS: '5-5',
        h2hOU: '5-5',
        avgMargin: 0,
        avgTotal: body.totalLine || 45,
        offVsDefRank: 15,
        defVsOffRank: 15,
        keyMatchupAdvantage: 'Even matchup',
      },
      weather: body.weather,
      trends: body.trends || [],
      sharpMoney: body.sharpMoney,
    })
    
    return NextResponse.json({
      score,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Calculate confidence error:', error)
    return NextResponse.json(
      { error: 'Failed to calculate confidence' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/confidence-scores
 * Record actual result for RSI learning
 */
export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    
    if (!body.prediction || !body.actual) {
      return NextResponse.json(
        { error: 'Missing prediction or actual result' },
        { status: 400 }
      )
    }
    
    const model = getModel()
    
    // Record result and update weights
    model.recordResult(body.prediction, body.actual)
    
    const performance = model.getPerformance()
    const weights = model.getWeights()
    
    return NextResponse.json({
      success: true,
      updatedPerformance: performance,
      updatedWeights: weights,
      message: 'Model weights updated via RSI',
    })
  } catch (error) {
    console.error('Record result error:', error)
    return NextResponse.json(
      { error: 'Failed to record result' },
      { status: 500 }
    )
  }
}
