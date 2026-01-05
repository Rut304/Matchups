/**
 * Betting Splits API Route
 * Fetches real-time public betting percentages
 */

import { NextResponse } from 'next/server'
import { 
  getMockBettingSplits, 
  detectReverseLineMovement,
  BettingSplit,
  ReverseLineMovement 
} from '@/lib/scrapers/betting-splits'

export const dynamic = 'force-dynamic'
export const revalidate = 300 // 5 minutes

interface BettingSplitsResponse {
  success: boolean
  data: {
    splits: BettingSplit[]
    rlmAlerts: ReverseLineMovement[]
    lastUpdated: string
  }
  source: string
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const sport = searchParams.get('sport') || 'NFL'
  
  try {
    // For now, use mock data. When scraper is ready, replace with:
    // const splits = await fetchBettingSplits(sport)
    const splits = getMockBettingSplits(sport)
    
    // Mock odds history for RLM detection
    const oddsHistory = [
      { gameId: 'nfl-sea-sf-week18', openLine: 3, currentLine: 1.5, betType: 'spread' },
      { gameId: 'nfl-bal-pit-week18', openLine: 3, currentLine: 4.5, betType: 'spread' },
      { gameId: 'nfl-nyj-buf-week18', openLine: -14, currentLine: -13, betType: 'spread' },
    ]
    
    const rlmAlerts = detectReverseLineMovement(splits, oddsHistory)
    
    const response: BettingSplitsResponse = {
      success: true,
      data: {
        splits,
        rlmAlerts,
        lastUpdated: new Date().toISOString()
      },
      source: 'sportsbettingdime (mock)'
    }
    
    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching betting splits:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch betting splits' },
      { status: 500 }
    )
  }
}
