// =============================================================================
// TODAY'S EDGES API - Aggregated top betting edges for dashboard
// GET /api/edges/today
// 
// DATA SOURCES (in priority order):
// 1. ACTION NETWORK (PRIMARY) - Real-time betting splits, sharp money signals
// 2. Database (SECONDARY) - Stored edge picks, historical patterns
// 3. The Odds API (SUPPLEMENTAL) - Multi-book odds for arbitrage detection
// =============================================================================

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { 
  fetchBettingSplitsFromActionNetwork, 
  detectSharpMoney 
} from '@/lib/scrapers/action-network'

// Force dynamic rendering since we use request.url
export const dynamic = 'force-dynamic'

export interface TodayEdge {
  gameId: string
  sport: string
  sportIcon: string
  matchup: string
  gameTime: string
  pick: string
  odds: string
  edgeScore: number
  confidence: number
  trendCount: number
  topTrends: string[]
  publicPct?: number
  publicSide: 'home' | 'away'
  sharpSide?: 'home' | 'away'
  lineMovement?: string
  isRLM?: boolean
  h2hRecord?: string
  source: 'action-network' | 'database' | 'odds-api'
}

const sportIcons: Record<string, string> = {
  'NFL': '🏈',
  'NBA': '🏀',
  'NHL': '🏒',
  'MLB': '⚾',
  'NCAAF': '🏈',
  'NCAAB': '🏀',
  'WNBA': '🏀',
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const sport = searchParams.get('sport')?.toUpperCase()
    const minScore = parseInt(searchParams.get('minScore') || '55', 10)
    const limit = parseInt(searchParams.get('limit') || '12', 10)
    
    const edges: TodayEdge[] = []
    const seenGames = new Set<string>()
    
    // ==========================================================================
    // 1. PRIMARY: Action Network - Real-time betting splits & sharp money
    // ==========================================================================
    const sportsToFetch = sport ? [sport] : ['NBA', 'NHL', 'NCAAB', 'MLB']
    
    for (const s of sportsToFetch) {
      try {
        const splits = await fetchBettingSplitsFromActionNetwork(s)
        
        if (splits && splits.length > 0) {
          // Detect sharp money signals from Action Network data
          const sharpSignals = detectSharpMoney(splits)
          
          for (const split of splits) {
            // Skip if we already have this game
            if (seenGames.has(split.gameId)) continue
            
            const gameSignals = sharpSignals.filter(sig => sig.gameId === split.gameId)
            
            // Calculate edge score based on betting divergence
            const spreadDivergence = Math.abs(split.spread.homeBetPct - split.spread.homeMoneyPct)
            const mlDivergence = Math.abs(split.moneyline.homeBetPct - split.moneyline.homeMoneyPct)
            const totalDivergence = Math.abs(split.total.overBetPct - split.total.overMoneyPct)
            const maxDivergence = Math.max(spreadDivergence, mlDivergence, totalDivergence)
            
            // Only include games with meaningful signals
            if (maxDivergence < 8 && gameSignals.length === 0) continue
            
            const edgeScore = Math.min(95, 50 + maxDivergence + gameSignals.length * 10)
            if (edgeScore < minScore) continue
            
            // Determine pick based on sharp money direction
            const publicSpreadSide = split.spread.homeBetPct > 50 ? 'home' : 'away'
            const sharpSpreadSide = split.spread.homeMoneyPct > split.spread.homeBetPct ? 'home' : 'away'
            const isRLM = publicSpreadSide !== sharpSpreadSide && maxDivergence > 12
            
            const pickTeam = sharpSpreadSide === 'home' ? split.homeTeam : split.awayTeam
            const pickLine = sharpSpreadSide === 'home' ? split.spread.line : -split.spread.line
            const pickStr = `${pickTeam} ${pickLine > 0 ? '+' : ''}${pickLine.toFixed(1)}`
            
            const gameTime = new Date(split.gameTime).toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
              hour12: true
            })
            
            edges.push({
              gameId: split.gameId,
              sport: s,
              sportIcon: sportIcons[s] || '🎯',
              matchup: `${split.awayTeam} @ ${split.homeTeam}`,
              gameTime,
              pick: pickStr,
              odds: '-110',
              edgeScore,
              confidence: edgeScore,
              trendCount: gameSignals.length,
              topTrends: gameSignals.slice(0, 2).map(g => g.signal.substring(0, 60)),
              publicPct: publicSpreadSide === 'home' ? split.spread.homeBetPct : split.spread.awayBetPct,
              publicSide: publicSpreadSide as 'home' | 'away',
              sharpSide: sharpSpreadSide as 'home' | 'away',
              isRLM,
              source: 'action-network',
            })
            
            seenGames.add(split.gameId)
          }
        }
      } catch (sportErr) {
        console.error(`[Edges Today] Action Network error for ${s}:`, sportErr)
      }
    }
    
    // ==========================================================================
    // 2. SECONDARY: Database - Stored edge picks from historical analysis
    // ==========================================================================
    try {
      const supabase = await createClient()
      const today = new Date()
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString()
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59).toISOString()
      
      let query = supabase
        .from('historical_edge_picks')
        .select(`
          id, game_id, sport, pick_type, selection, odds, confidence, result, created_at,
          historical_games!inner (
            id, home_team_name, away_team_name, game_date, point_spread
          )
        `)
        .gte('created_at', startOfDay)
        .lte('created_at', endOfDay)
        .gte('confidence', minScore)
        .is('result', null)
        .order('confidence', { ascending: false })
        .limit(20)
      
      if (sport) {
        query = query.eq('sport', sport)
      }
      
      const { data: dbPicks } = await query
      
      if (dbPicks && dbPicks.length > 0) {
        for (const pick of dbPicks) {
          // Skip if we already have this game from Action Network
          if (seenGames.has(pick.game_id)) continue
          
          const game = pick.historical_games as unknown as {
            id: string
            home_team_name: string
            away_team_name: string
            game_date: string
            point_spread: number
          }
          
          if (!game) continue
          
          const ticketPct = 50
          const moneyPct = 50
          const lineMove = 0
          const isRLM = false
          
          const gameTime = new Date(game.game_date).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
          })
          
          edges.push({
            gameId: game.id,
            sport: pick.sport,
            sportIcon: sportIcons[pick.sport] || '🎯',
            matchup: `${game.away_team_name} @ ${game.home_team_name}`,
            gameTime,
            pick: pick.selection || pick.pick_type,
            odds: String(pick.odds) || '-110',
            edgeScore: pick.confidence,
            confidence: pick.confidence,
            trendCount: 0,
            topTrends: [],
            publicPct: ticketPct,
            publicSide: ticketPct > 50 ? 'home' : 'away',
            sharpSide: moneyPct > ticketPct ? 'home' : 'away',
            lineMovement: undefined,
            isRLM,
            source: 'database',
          })
          
          seenGames.add(pick.game_id)
        }
      }
    } catch (dbErr) {
      console.error('[Edges Today] Database error:', dbErr)
      // Continue - Action Network data is still available
    }
    
    // ==========================================================================
    // 3. Sort by edge score and limit results
    // ==========================================================================
    edges.sort((a, b) => b.edgeScore - a.edgeScore)
    const finalEdges = edges.slice(0, limit)
    
    return NextResponse.json({
      edges: finalEdges,
      total: finalEdges.length,
      sources: {
        actionNetwork: edges.filter(e => e.source === 'action-network').length,
        database: edges.filter(e => e.source === 'database').length,
      },
      timestamp: new Date().toISOString(),
    })
    
  } catch (error) {
    console.error('Today edges API error:', error)
    return NextResponse.json({
      edges: [],
      total: 0,
      error: 'Failed to fetch edges',
      timestamp: new Date().toISOString(),
    }, { status: 200 }) // Return 200 with empty array, not 500
  }
}
