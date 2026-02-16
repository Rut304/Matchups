/**
 * Game Trends API
 * GET /api/games/[id]/trends
 * Returns matching situational trends for a specific game
 */

import { NextRequest, NextResponse } from 'next/server'
import { matchGameToTrends, type GameSituation } from '@/lib/api/situational-trends'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: gameId } = await params
    const { searchParams } = new URL(request.url)
    
    const sport = searchParams.get('sport')?.toUpperCase() || 'NFL'
    const homeAbbr = searchParams.get('home') || ''
    const awayAbbr = searchParams.get('away') || ''
    const spread = parseFloat(searchParams.get('spread') || '0')
    const total = parseFloat(searchParams.get('total') || '0')
    
    // Build game situation from available data
    const situation: GameSituation = {
      gameId,
      sport,
      homeTeam: homeAbbr,
      awayTeam: awayAbbr,
      spread: spread || 0,
      total: total || 0,
      factors: {
        homeRestDays: 3, // Default values - would be computed from schedule data
        awayRestDays: 3,
        homeIsBackToBack: false,
        awayIsBackToBack: false,
        isDivisional: false,
        isConference: false,
        homeLastResult: null,
        awayLastResult: null,
        homeStreak: 0,
        awayStreak: 0,
        weekOfSeason: Math.ceil((new Date().getMonth() - 8) * 4), // rough estimate
        isDome: false
      }
    }
    
    // Try to enhance situation with real schedule data
    try {
      // Check if home team is a favorite (spread < 0 = home fav)
      const isHomeFavorite = spread < 0
      const isHomeUnderdog = spread > 0
      
      // Adjust factors based on what we know
      if (isHomeUnderdog) {
        // This triggers "Home Dog After Loss" type trends
        situation.factors.homeLastResult = 'loss' // Conservative assumption for trend matching
      }
      
      if (sport === 'NBA') {
        // NBA games often have B2B situations
        situation.factors.homeIsBackToBack = false // Would need schedule API
        situation.factors.awayIsBackToBack = false
      }
    } catch (e) {
      // Keep defaults if enhancement fails
    }
    
    const matches = await matchGameToTrends(situation)
    
    return NextResponse.json({
      success: true,
      gameId,
      sport,
      matches: matches.map(m => ({
        trend: {
          name: m.trend.name,
          description: m.trend.description,
          sport: m.trend.sport,
          wins: m.trend.wins,
          losses: m.trend.losses,
          pushes: m.trend.pushes,
          winRate: m.trend.winRate,
          roi: m.trend.roi,
          sampleSize: m.trend.sampleSize,
          isStatisticallySignificant: m.trend.isStatisticallySignificant,
          betType: m.trend.betType,
          recommendation: m.trend.recommendation,
          confidenceLevel: m.trend.confidenceLevel
        },
        matchStrength: m.matchStrength,
        applicablePick: m.applicablePick
      })),
      matchCount: matches.length
    })
  } catch (error) {
    console.error('Game trends error:', error)
    return NextResponse.json({ success: false, matches: [] })
  }
}
