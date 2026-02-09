/**
 * GET /api/props/edges
 * 
 * Returns player props where statistical analysis suggests an edge
 * (player stats vs prop line discrepancies)
 * 
 * Query params:
 * - sport: NFL, NBA, NHL, MLB (default: all with games today)
 * - minConfidence: 0-100 (default: 50)
 * - edge: 'over' | 'under' (default: both)
 * - limit: number (default: 50)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const sport = searchParams.get('sport')?.toUpperCase()
  const minConfidence = parseInt(searchParams.get('minConfidence') || '50')
  const edgeFilter = searchParams.get('edge') as 'over' | 'under' | null
  const limit = parseInt(searchParams.get('limit') || '50')
  
  const supabase = getSupabase()
  
  try {
    let query = supabase
      .from('player_prop_edges')
      .select('*')
      .neq('edge', 'none')
      .gte('confidence', minConfidence)
      .gte('collected_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Last 24 hours
      .order('confidence', { ascending: false })
      .limit(limit)
    
    if (sport) {
      query = query.eq('sport', sport)
    }
    
    if (edgeFilter) {
      query = query.eq('edge', edgeFilter)
    }
    
    const { data: edges, error } = await query
    
    if (error) {
      console.error('Error fetching prop edges:', error)
      return NextResponse.json({
        edges: [],
        count: 0,
        error: error.message
      })
    }
    
    // Format the response
    const formattedEdges = (edges || []).map(e => ({
      id: e.id,
      gameId: e.game_id,
      sport: e.sport,
      player: {
        id: e.player_id,
        name: e.player_name,
        team: e.team,
        position: e.position
      },
      prop: {
        type: e.prop_type,
        line: e.line,
        bestOver: {
          odds: e.best_over_odds,
          book: e.best_over_book
        },
        bestUnder: {
          odds: e.best_under_odds,
          book: e.best_under_book
        }
      },
      stats: {
        seasonAvg: e.season_avg,
        last5Avg: e.last_5_avg,
        last10Avg: e.last_10_avg,
        hitRateSeason: e.hit_rate_season,
        hitRateLast5: e.hit_rate_last_5
      },
      edge: {
        direction: e.edge,
        percent: e.edge_percent,
        confidence: e.confidence,
        factors: e.factors
      },
      collectedAt: e.collected_at
    }))
    
    // Group by sport for easier consumption
    const bySport: Record<string, typeof formattedEdges> = {}
    for (const edge of formattedEdges) {
      if (!bySport[edge.sport]) bySport[edge.sport] = []
      bySport[edge.sport].push(edge)
    }
    
    return NextResponse.json({
      success: true,
      count: formattedEdges.length,
      edges: formattedEdges,
      bySport,
      meta: {
        minConfidence,
        edgeFilter,
        sport: sport || 'all',
        fetchedAt: new Date().toISOString()
      }
    })
    
  } catch (error) {
    console.error('Props edges API error:', error)
    return NextResponse.json({
      edges: [],
      count: 0,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
