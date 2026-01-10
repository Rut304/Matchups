// =============================================================================
// GAME INTELLIGENCE API
// GET /api/games/[id]/intelligence
// Returns comprehensive betting intelligence for a game
// =============================================================================

import { NextRequest, NextResponse } from 'next/server'
import { getMatchupIntelligence, getTopDataPoints, formatEdgeScore } from '@/lib/betting-intelligence'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: gameId } = await params
    const { searchParams } = new URL(request.url)
    
    const sport = searchParams.get('sport')?.toUpperCase() || 'NFL'
    const homeTeam = searchParams.get('home') || 'Home Team'
    const homeAbbr = searchParams.get('homeAbbr') || 'HOM'
    const awayTeam = searchParams.get('away') || 'Away Team'
    const awayAbbr = searchParams.get('awayAbbr') || 'AWY'
    const includeAI = searchParams.get('ai') === 'true'
    const includeLive = searchParams.get('live') === 'true'

    // Get comprehensive matchup intelligence
    const intelligence = await getMatchupIntelligence(
      gameId,
      sport,
      { name: homeTeam, abbr: homeAbbr },
      { name: awayTeam, abbr: awayAbbr },
      { includeAI, includeLive }
    )

    // Get top data points summary
    const topDataPoints = getTopDataPoints(intelligence)
    
    // Format edge score for display
    const edgeLabel = formatEdgeScore(intelligence.edgeScore.overall)

    return NextResponse.json({
      success: true,
      gameId,
      sport,
      intelligence,
      summary: {
        edgeScore: intelligence.edgeScore.overall,
        edgeLabel: edgeLabel.label,
        edgeColor: edgeLabel.color,
        topDataPoints,
        quickTakes: {
          spread: intelligence.marketConsensus.spreadConsensus.pick,
          spreadConfidence: intelligence.marketConsensus.spreadConsensus.confidence,
          total: intelligence.marketConsensus.totalConsensus.pick,
          totalConfidence: intelligence.marketConsensus.totalConsensus.confidence,
          sharpestPick: intelligence.marketConsensus.sharpestPick
        }
      },
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Game intelligence error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch game intelligence' },
      { status: 500 }
    )
  }
}
