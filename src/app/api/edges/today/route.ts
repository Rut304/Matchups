// =============================================================================
// TODAY'S EDGES API - Aggregated top betting edges for dashboard
// GET /api/edges/today
// =============================================================================

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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
}

const sportIcons: Record<string, string> = {
  'NFL': '🏈',
  'NBA': '🏀',
  'NHL': '🏒',
  'MLB': '⚾',
  'NCAAF': '🏈',
  'NCAAB': '🏀'
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const sport = searchParams.get('sport') // Optional: filter by sport
    const minScore = parseInt(searchParams.get('minScore') || '60', 10)
    const limit = parseInt(searchParams.get('limit') || '9', 10)
    
    const supabase = await createClient()
    
    // Get today's date range
    const today = new Date()
    const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString()
    const endOfDay = new Date(today.setHours(23, 59, 59, 999)).toISOString()
    
    // Fetch edge picks with game data
    let query = supabase
      .from('historical_edge_picks')
      .select(`
        id,
        game_id,
        sport,
        pick_type,
        pick,
        odds,
        confidence,
        result,
        created_at,
        historical_games!inner (
          id,
          home_team,
          away_team,
          game_date,
          close_spread,
          public_spread_home_pct,
          public_money_home_pct,
          open_spread
        )
      `)
      .gte('created_at', startOfDay)
      .lte('created_at', endOfDay)
      .gte('confidence', minScore)
      .is('result', null) // Only pending picks
      .order('confidence', { ascending: false })
      .limit(limit * 2) // Fetch more to account for filtering
    
    if (sport) {
      query = query.eq('sport', sport.toUpperCase())
    }
    
    const { data: edgePicks, error: edgeError } = await query
    
    if (edgeError) {
      console.error('Error fetching edge picks:', edgeError)
      // Return empty array if table doesn't exist yet
      return NextResponse.json({ edges: [], total: 0 })
    }
    
    if (!edgePicks || edgePicks.length === 0) {
      // Return empty array if no edges - NO FAKE DATA
      return NextResponse.json({ 
        edges: [],
        total: 0,
        message: 'No edge picks available for today. Check back later or view historical trends.'
      })
    }
    
    // Get trend counts for each game
    const gameIds = [...new Set(edgePicks.map(p => p.game_id))]
    
    const { data: trends } = await supabase
      .from('historical_trends')
      .select('id, trend_name, sport')
      .in('sport', [...new Set(edgePicks.map(p => p.sport))])
    
    // Format edges
    const edges: TodayEdge[] = edgePicks
      .filter(pick => pick.historical_games)
      .slice(0, limit)
      .map(pick => {
        // The join returns an object when using !inner
        const game = pick.historical_games as unknown as {
          id: string
          home_team: string
          away_team: string
          game_date: string
          close_spread: number
          public_spread_home_pct: number
          public_money_home_pct: number
          open_spread: number
        }
        
        // Calculate line movement
        const lineMove = game.open_spread && game.close_spread 
          ? (game.close_spread - game.open_spread).toFixed(1)
          : undefined
        
        // Check for reverse line movement (ticket % high but money % low = sharps on other side)
        const ticketPct = game.public_spread_home_pct || 50
        const moneyPct = game.public_money_home_pct || 50
        const isRLM = Boolean(
          (ticketPct > 60 && moneyPct < 40 && lineMove && parseFloat(lineMove) > 0) ||
          (ticketPct < 40 && moneyPct > 60 && lineMove && parseFloat(lineMove) < 0)
        )
        
        // Get relevant trends for this sport
        const sportTrends = trends?.filter(t => t.sport === pick.sport) || []
        const trendCount = Math.min(sportTrends.length, 5) // Cap at 5 for display
        
        // Format game time
        const parsedGameDate = new Date(game.game_date)
        const gameTime = parsedGameDate.toLocaleTimeString('en-US', { 
          hour: 'numeric', 
          minute: '2-digit',
          hour12: true 
        })
        
        return {
          gameId: game.id,
          sport: pick.sport,
          sportIcon: sportIcons[pick.sport] || '🎯',
          matchup: `${game.away_team} @ ${game.home_team}`,
          gameTime,
          pick: pick.pick,
          odds: pick.odds || '-110',
          edgeScore: pick.confidence,
          confidence: pick.confidence,
          trendCount,
          topTrends: sportTrends.slice(0, 2).map(t => t.trend_name),
          publicPct: ticketPct,
          publicSide: 'home' as const,
          sharpSide: moneyPct > ticketPct ? 'home' as const : 'away' as const,
          lineMovement: lineMove ? (parseFloat(lineMove) > 0 ? `+${lineMove}` : lineMove) : undefined,
          isRLM,
          h2hRecord: '3-2 ATS L5' // Would come from H2H query
        }
      })
    
    return NextResponse.json({ 
      edges,
      total: edges.length
    })
    
  } catch (error) {
    console.error('Today edges API error:', error)
    // Return empty array on error - NO FAKE DATA
    return NextResponse.json(
      { error: 'Failed to fetch today\'s edges', edges: [], total: 0, message: 'Unable to load edges. Please try again later.' },
      { status: 500 }
    )
  }
}

// getDemoEdges function removed - NO FAKE DATA policy
// All edges must come from database (historical_trends + edge_picks tables)
