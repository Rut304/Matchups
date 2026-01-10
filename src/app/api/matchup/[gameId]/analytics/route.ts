// =============================================================================
// MATCHUP ANALYTICS API
// GET /api/matchup/[gameId]/analytics
// Returns aggregated edges, trends, H2H history, AI insights for a game
// Now integrated with comprehensive betting intelligence
// =============================================================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { findMatchingTrends, getTeamVsTeamHistory, type GameContext } from '@/lib/trend-matcher'
import { getMatchupIntelligence, getTopDataPoints, formatEdgeScore } from '@/lib/betting-intelligence'
import { getGameOUAnalysis } from '@/lib/ou-analysis'

export const dynamic = 'force-dynamic'

interface MatchupAnalytics {
  gameId: string
  sport: string
  homeTeam: {
    name: string
    abbrev: string
    teamId?: number
  }
  awayTeam: {
    name: string
    abbrev: string
    teamId?: number
  }
  gameDate: string

  // Trend analysis
  trends: {
    matched: number
    spreadTrends: any[]
    totalTrends: any[]
    mlTrends: any[]
    aggregateConfidence: number
    topPick: {
      selection: string
      confidence: number
      supportingTrends: number
    } | null
  }

  // H2H History
  h2h: {
    gamesPlayed: number
    homeATSRecord: string
    awayATSRecord: string
    overUnderRecord: string
    avgMargin: number
    avgTotal: number
    recentGames: any[]
  }

  // Edge picks for this matchup (if any historical)
  edgePicks: any[]

  // AI insights (if generated)
  aiInsights: {
    analysis: string
    score: any
    generatedAt: string
  } | null

  // Edge score calculation
  edgeScore: {
    overall: number // 0-100
    trendAlignment: number
    sharpSignal: number
    valueIndicator: number
  }
  
  // NEW: Comprehensive betting intelligence
  bettingIntelligence?: any
  ouAnalysis?: any
  topDataPoints?: any[]
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ gameId: string }> }
) {
  try {
    const { gameId } = await params
    const { searchParams } = new URL(request.url)
    const includeIntelligence = searchParams.get('intelligence') !== 'false'
    const includeOU = searchParams.get('ou') !== 'false'
    const includeAI = searchParams.get('ai') === 'true'
    
    const supabase = await createClient()

    // 1. Get game details from historical_games or live data
    const { data: game, error: gameError } = await supabase
      .from('historical_games')
      .select(`
        *,
        home_team_ref:teams!historical_games_home_team_id_fkey(id, team_name, abbrev),
        away_team_ref:teams!historical_games_away_team_id_fkey(id, team_name, abbrev)
      `)
      .eq('id', gameId)
      .single()

    // If not found by ID, try external_id
    let gameData = game
    if (gameError || !game) {
      const { data: gameByExternal } = await supabase
        .from('historical_games')
        .select(`
          *,
          home_team_ref:teams!historical_games_home_team_id_fkey(id, team_name, abbrev),
          away_team_ref:teams!historical_games_away_team_id_fkey(id, team_name, abbrev)
        `)
        .eq('external_id', gameId)
        .single()
      
      gameData = gameByExternal
    }

    if (!gameData) {
      // Return minimal response if game not in historical data
      // This allows for live games that haven't been synced yet
      return NextResponse.json({
        gameId,
        error: 'Game not found in historical database',
        message: 'This game may be live or upcoming. Historical analytics will be available after sync.',
        trends: {
          matched: 0,
          spreadTrends: [],
          totalTrends: [],
          mlTrends: [],
          aggregateConfidence: 0,
          topPick: null
        },
        h2h: null,
        edgePicks: [],
        aiInsights: null,
        edgeScore: { overall: 0, trendAlignment: 0, sharpSignal: 0, valueIndicator: 0 }
      })
    }

    // 2. Build game context for trend matching
    const gameContext: GameContext = {
      sport: gameData.sport,
      homeTeam: gameData.home_team,
      awayTeam: gameData.away_team,
      homeTeamAbbrev: gameData.home_team_abbrev,
      awayTeamAbbrev: gameData.away_team_abbrev,
      gameDate: new Date(gameData.game_date),
      spread: gameData.close_spread || gameData.open_spread,
      total: gameData.close_total || gameData.open_total,
      isPlayoffs: gameData.season_type === 'postseason',
      isDivisional: gameData.divisional_game,
      isPrimetime: gameData.primetime_game,
      publicSpreadHomePct: gameData.public_spread_home_pct,
      publicMoneyHomePct: gameData.public_money_home_pct,
      lineMovement: gameData.close_spread && gameData.open_spread 
        ? gameData.open_spread - gameData.close_spread 
        : undefined
    }

    // 3. Find matching trends
    const trendResult = await findMatchingTrends(gameContext)

    // 4. Get H2H history
    const h2hHistory = gameData.home_team_abbrev && gameData.away_team_abbrev
      ? await getTeamVsTeamHistory(
          gameData.sport, 
          gameData.home_team_abbrev, 
          gameData.away_team_abbrev, 
          10
        )
      : null

    // 5. Get edge picks for this game (if linked)
    const { data: edgePicks } = await supabase
      .from('historical_edge_picks')
      .select('*')
      .eq('game_id', gameData.id)
      .order('confidence', { ascending: false })

    // 6. Get AI insights (if any)
    const { data: aiInsights } = await supabase
      .from('matchup_ai_insights')
      .select('*')
      .eq('game_id', gameData.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    // 7. Calculate edge score
    const edgeScore = calculateEdgeScore({
      trends: trendResult,
      h2h: h2hHistory,
      edgePicks: edgePicks || [],
      publicPct: gameData.public_spread_home_pct,
      lineMovement: gameContext.lineMovement
    })

    // 8. Build response
    const response: MatchupAnalytics = {
      gameId: gameData.id,
      sport: gameData.sport,
      homeTeam: {
        name: gameData.home_team,
        abbrev: gameData.home_team_abbrev || '',
        teamId: gameData.home_team_id
      },
      awayTeam: {
        name: gameData.away_team,
        abbrev: gameData.away_team_abbrev || '',
        teamId: gameData.away_team_id
      },
      gameDate: gameData.game_date,
      trends: {
        matched: trendResult.matchedTrends.length,
        spreadTrends: trendResult.spreadTrends,
        totalTrends: trendResult.totalTrends,
        mlTrends: trendResult.mlTrends,
        aggregateConfidence: trendResult.aggregateConfidence,
        topPick: trendResult.topPick
      },
      h2h: h2hHistory ? {
        gamesPlayed: h2hHistory.games.length,
        homeATSRecord: `${h2hHistory.homeATS.wins}-${h2hHistory.homeATS.losses}-${h2hHistory.homeATS.pushes}`,
        awayATSRecord: `${h2hHistory.awayATS.wins}-${h2hHistory.awayATS.losses}-${h2hHistory.awayATS.pushes}`,
        overUnderRecord: `${h2hHistory.overs}O-${h2hHistory.unders}U`,
        avgMargin: Math.round(h2hHistory.avgMargin * 10) / 10,
        avgTotal: Math.round(h2hHistory.avgTotal * 10) / 10,
        recentGames: h2hHistory.games.slice(0, 5).map(g => ({
          date: g.game_date,
          homeScore: g.home_score,
          awayScore: g.away_score,
          spreadResult: g.spread_result,
          totalResult: g.total_result
        }))
      } : {
        gamesPlayed: 0,
        homeATSRecord: '0-0-0',
        awayATSRecord: '0-0-0',
        overUnderRecord: '0O-0U',
        avgMargin: 0,
        avgTotal: 0,
        recentGames: []
      },
      edgePicks: edgePicks || [],
      aiInsights: aiInsights ? {
        analysis: aiInsights.insight_text || '',
        score: aiInsights.score || {},
        generatedAt: aiInsights.created_at
      } : null,
      edgeScore
    }

    // 9. Add comprehensive betting intelligence if requested
    if (includeIntelligence) {
      try {
        const intelligence = await getMatchupIntelligence(
          gameId,
          gameData.sport,
          { name: gameData.home_team, abbr: gameData.home_team_abbrev || '' },
          { name: gameData.away_team, abbr: gameData.away_team_abbrev || '' },
          { includeAI, includeLive: false }
        )
        response.bettingIntelligence = intelligence
        response.topDataPoints = getTopDataPoints(intelligence)
      } catch (e) {
        console.error('Failed to get betting intelligence:', e)
      }
    }

    // 10. Add O/U analysis if requested
    if (includeOU) {
      try {
        const currentTotal = gameData.close_total || gameData.open_total || 46
        const openTotal = gameData.open_total || currentTotal
        
        const ouAnalysis = await getGameOUAnalysis(
          gameId,
          gameData.sport,
          { name: gameData.home_team, abbr: gameData.home_team_abbrev || '' },
          { name: gameData.away_team, abbr: gameData.away_team_abbrev || '' },
          currentTotal,
          openTotal
        )
        response.ouAnalysis = ouAnalysis
      } catch (e) {
        console.error('Failed to get O/U analysis:', e)
      }
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Matchup analytics error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch matchup analytics' },
      { status: 500 }
    )
  }
}

// =============================================================================
// EDGE SCORE CALCULATOR
// =============================================================================

function calculateEdgeScore(data: {
  trends: any
  h2h: any
  edgePicks: any[]
  publicPct?: number
  lineMovement?: number
}): {
  overall: number
  trendAlignment: number
  sharpSignal: number
  valueIndicator: number
} {
  let trendAlignment = 0
  let sharpSignal = 0
  let valueIndicator = 0

  // Trend alignment (0-40 points)
  if (data.trends.matchedTrends.length > 0) {
    // More matching trends = higher score
    const trendCount = Math.min(data.trends.matchedTrends.length, 5)
    trendAlignment = (trendCount / 5) * 30
    
    // Bonus for high confidence trends
    const avgConfidence = data.trends.aggregateConfidence
    trendAlignment += (avgConfidence / 100) * 10
  }

  // Sharp signal (0-30 points)
  if (data.publicPct !== undefined) {
    // Contrarian indicator - more points when public heavily on one side
    const publicDeviation = Math.abs(data.publicPct - 50)
    sharpSignal += (publicDeviation / 50) * 15
  }

  if (data.lineMovement !== undefined) {
    // Line movement indicates sharp action
    const moveStrength = Math.min(Math.abs(data.lineMovement), 3)
    sharpSignal += (moveStrength / 3) * 15
  }

  // Value indicator (0-30 points)
  if (data.edgePicks.length > 0) {
    // Historical edge picks show value
    const avgEdgePct = data.edgePicks.reduce((sum, p) => sum + (p.edge_percentage || 0), 0) / data.edgePicks.length
    valueIndicator = Math.min(avgEdgePct * 3, 30)
  } else if (data.trends.topPick) {
    // Use trend consensus as value proxy
    valueIndicator = (data.trends.topPick.supportingTrends / 5) * 30
  }

  const overall = Math.round(trendAlignment + sharpSignal + valueIndicator)

  return {
    overall: Math.min(overall, 100),
    trendAlignment: Math.round(trendAlignment),
    sharpSignal: Math.round(sharpSignal),
    valueIndicator: Math.round(valueIndicator)
  }
}
