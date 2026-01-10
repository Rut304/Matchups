// =============================================================================
// O/U ANALYSIS API
// GET /api/ou-analysis
// Returns comprehensive over/under analysis for games
// =============================================================================

import { NextRequest, NextResponse } from 'next/server'
import { getGameOUAnalysis, getLeagueOUSnapshot } from '@/lib/ou-analysis'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    const gameId = searchParams.get('gameId')
    const sport = searchParams.get('sport')?.toUpperCase() || 'NFL'
    const type = searchParams.get('type') || 'game' // 'game' or 'league'
    
    // League-wide snapshot
    if (type === 'league' || !gameId) {
      const snapshot = await getLeagueOUSnapshot(sport)
      
      return NextResponse.json({
        success: true,
        type: 'league',
        sport,
        data: snapshot,
        timestamp: new Date().toISOString()
      })
    }
    
    // Single game analysis
    const homeTeam = searchParams.get('home') || 'Home Team'
    const homeAbbr = searchParams.get('homeAbbr') || 'HOM'
    const awayTeam = searchParams.get('away') || 'Away Team'
    const awayAbbr = searchParams.get('awayAbbr') || 'AWY'
    const currentTotal = parseFloat(searchParams.get('total') || '46')
    const openTotal = parseFloat(searchParams.get('openTotal') || String(currentTotal))
    
    const analysis = await getGameOUAnalysis(
      gameId,
      sport,
      { name: homeTeam, abbr: homeAbbr },
      { name: awayTeam, abbr: awayAbbr },
      currentTotal,
      openTotal
    )
    
    // Build quick summary
    const summary = {
      recommendation: analysis.projections.recommendation,
      confidence: analysis.projections.confidence,
      projection: analysis.projections.finalProjection,
      edge: analysis.projections.edgeVsLine,
      grade: analysis.projections.recommendation === 'over' 
        ? analysis.grade.over 
        : analysis.projections.recommendation === 'under'
        ? analysis.grade.under
        : 'N/A',
      keyFactorCount: analysis.keyFactors.filter(f => f.impact === analysis.projections.recommendation).length,
      trendSupport: analysis.matchingTrends.filter(t => t.pick === analysis.projections.recommendation).length,
      sharpSide: analysis.bettingData.sharpAction,
      rlmDetected: analysis.bettingData.rlmDetected
    }

    return NextResponse.json({
      success: true,
      type: 'game',
      gameId,
      sport,
      analysis,
      summary,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('O/U analysis error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to generate O/U analysis' },
      { status: 500 }
    )
  }
}
