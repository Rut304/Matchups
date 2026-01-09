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
          spread,
          public_home_pct,
          sharp_home_pct,
          opening_spread,
          home_team_id,
          away_team_id
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
      // Return demo data if no real edges yet
      return NextResponse.json({ 
        edges: getDemoEdges(),
        total: 6,
        isDemo: true
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
          spread: number
          public_home_pct: number
          sharp_home_pct: number
          opening_spread: number
        }
        
        // Calculate line movement
        const lineMove = game.opening_spread && game.spread 
          ? (game.spread - game.opening_spread).toFixed(1)
          : undefined
        
        // Check for reverse line movement
        const isRLM = Boolean(
          (game.public_home_pct > 60 && game.sharp_home_pct < 40 && lineMove && parseFloat(lineMove) > 0) ||
          (game.public_home_pct < 40 && game.sharp_home_pct > 60 && lineMove && parseFloat(lineMove) < 0)
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
          publicPct: game.public_home_pct,
          publicSide: 'home' as const,
          sharpSide: game.sharp_home_pct > 50 ? 'home' as const : 'away' as const,
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
    return NextResponse.json(
      { error: 'Failed to fetch today\'s edges', edges: getDemoEdges(), isDemo: true },
      { status: 200 } // Return 200 with demo data so UI still works
    )
  }
}

// Demo data for when database is empty
function getDemoEdges(): TodayEdge[] {
  return [
    {
      gameId: 'demo-1',
      sport: 'NFL',
      sportIcon: '🏈',
      matchup: 'Chiefs @ Bills',
      gameTime: '1:00 PM',
      pick: 'Bills +2.5',
      odds: '-110',
      edgeScore: 84,
      confidence: 84,
      trendCount: 4,
      topTrends: [
        'Home dogs +3 or less: 67% ATS',
        'Division games with RLM: 71% ATS'
      ],
      publicPct: 68,
      publicSide: 'away',
      sharpSide: 'home',
      lineMovement: '+1.5',
      isRLM: true,
      h2hRecord: '4-1 ATS L5'
    },
    {
      gameId: 'demo-2',
      sport: 'NBA',
      sportIcon: '🏀',
      matchup: 'Lakers @ Celtics',
      gameTime: '7:30 PM',
      pick: 'Under 224.5',
      odds: '-108',
      edgeScore: 78,
      confidence: 78,
      trendCount: 3,
      topTrends: [
        'Back-to-back unders: 64% hit rate',
        'Heavy favorite unders: 59% ATS'
      ],
      publicPct: 72,
      publicSide: 'away',
      lineMovement: '-2.5',
      h2hRecord: '3-2 U L5'
    },
    {
      gameId: 'demo-3',
      sport: 'NHL',
      sportIcon: '🏒',
      matchup: 'Maple Leafs @ Bruins',
      gameTime: '7:00 PM',
      pick: 'Bruins -1.5',
      odds: '+150',
      edgeScore: 72,
      confidence: 72,
      trendCount: 3,
      topTrends: [
        'Home favorites -1.5+: 58% cover',
        'Division rivalry games: 61% home'
      ],
      publicPct: 55,
      publicSide: 'home',
      sharpSide: 'home',
      h2hRecord: '2-3 PL L5'
    },
    {
      gameId: 'demo-4',
      sport: 'MLB',
      sportIcon: '⚾',
      matchup: 'Yankees @ Red Sox',
      gameTime: '4:05 PM',
      pick: 'Over 9.5',
      odds: '-105',
      edgeScore: 69,
      confidence: 69,
      trendCount: 2,
      topTrends: [
        'Day game overs: 57% hit rate',
        'Rivalry games total movement'
      ],
      publicPct: 61,
      publicSide: 'home',
      lineMovement: '+0.5'
    },
    {
      gameId: 'demo-5',
      sport: 'NBA',
      sportIcon: '🏀',
      matchup: 'Warriors @ Suns',
      gameTime: '9:00 PM',
      pick: 'Warriors +5.5',
      odds: '-110',
      edgeScore: 76,
      confidence: 76,
      trendCount: 4,
      topTrends: [
        'Road dogs 5-7: 62% ATS',
        'Sharp money on dog: 65% win'
      ],
      publicPct: 65,
      publicSide: 'home',
      sharpSide: 'away',
      isRLM: true,
      h2hRecord: '3-1 ATS L4'
    },
    {
      gameId: 'demo-6',
      sport: 'NFL',
      sportIcon: '🏈',
      matchup: 'Eagles @ Cowboys',
      gameTime: '4:25 PM',
      pick: 'Cowboys +3',
      odds: '-105',
      edgeScore: 81,
      confidence: 81,
      trendCount: 5,
      topTrends: [
        'Home dogs divisional: 68% ATS',
        'Prime time contrarian: 64% ATS'
      ],
      publicPct: 74,
      publicSide: 'away',
      sharpSide: 'home',
      lineMovement: '+0.5',
      isRLM: true,
      h2hRecord: '4-2 ATS L6'
    }
  ]
}
