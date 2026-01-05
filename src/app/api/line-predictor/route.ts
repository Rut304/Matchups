/**
 * Line Predictor API Route
 * AI-powered line movement predictions with recursive learning
 */

import { NextResponse } from 'next/server'
import { 
  getLinePredictor, 
  getMockLinePredictions,
  getMockModelPerformance,
  LinePrediction,
  ModelPerformance
} from '@/lib/models/line-predictor'
import { getMockBettingSplits } from '@/lib/scrapers/betting-splits'

export const dynamic = 'force-dynamic'

interface LinePredictorResponse {
  success: boolean
  data: {
    predictions: LinePrediction[]
    modelPerformance: ModelPerformance
    lastUpdated: string
  }
  modelVersion: string
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const sport = searchParams.get('sport') || 'NFL'
  const gameId = searchParams.get('gameId')
  
  try {
    // For now, use mock predictions. Replace with real predictions when data sources are connected
    let predictions = getMockLinePredictions(sport)
    
    // If specific game requested, filter
    if (gameId) {
      predictions = predictions.filter(p => p.gameId === gameId)
    }
    
    const modelPerformance = getMockModelPerformance()
    
    const response: LinePredictorResponse = {
      success: true,
      data: {
        predictions,
        modelPerformance,
        lastUpdated: new Date().toISOString()
      },
      modelVersion: '1.0.0'
    }
    
    return NextResponse.json(response)
  } catch (error) {
    console.error('Error generating line predictions:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to generate predictions' },
      { status: 500 }
    )
  }
}

/**
 * POST endpoint: Generate prediction for specific game
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { gameId, sport, homeTeam, awayTeam, currentLine, hoursUntilGame } = body
    
    if (!gameId || !sport || !homeTeam || !awayTeam || currentLine === undefined) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }
    
    const predictor = getLinePredictor()
    
    // Get betting splits for this game
    const allSplits = getMockBettingSplits(sport)
    const bettingSplit = allSplits.find(s => s.gameId === gameId) || null
    
    // Mock odds history (in production, fetch from The Odds API historical endpoint)
    const oddsHistory = [
      { timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), line: currentLine + 1 },
      { timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), line: currentLine + 0.5 },
      { timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), line: currentLine },
    ]
    
    const prediction = predictor.predictLineMovement(
      gameId,
      sport,
      homeTeam,
      awayTeam,
      currentLine,
      bettingSplit,
      oddsHistory,
      hoursUntilGame || 4
    )
    
    return NextResponse.json({
      success: true,
      data: prediction
    })
  } catch (error) {
    console.error('Error generating prediction:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to generate prediction' },
      { status: 500 }
    )
  }
}
