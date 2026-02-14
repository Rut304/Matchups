/**
 * TEAM RATINGS API
 * 
 * GET /api/team-ratings?sport=nfl
 * GET /api/team-ratings?sport=nfl&team=KC
 * GET /api/team-ratings?sport=nfl&season=2024
 * 
 * Returns Elo ratings and power rankings for teams
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface TeamRating {
  sport: string
  team_abbr: string
  team_name: string
  elo_rating: number
  elo_rank: number
  power_rating: number
  off_rating: number
  def_rating: number
  season: number
  games_played: number
  wins: number
  losses: number
  last_5_elo_change: number
  peak_elo: number
  low_elo: number
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const sport = searchParams.get('sport')?.toLowerCase()
  const team = searchParams.get('team')?.toUpperCase()
  const season = parseInt(searchParams.get('season') || String(new Date().getFullYear()))
  
  if (!sport) {
    return NextResponse.json({ 
      error: 'sport parameter required',
      validSports: ['nfl', 'nba', 'nhl', 'mlb', 'ncaaf', 'ncaab']
    }, { status: 400 })
  }
  
  try {
    // Build query
    let query = supabase
      .from('team_ratings')
      .select('*')
      .eq('sport', sport)
      .eq('season', season)
      .order('elo_rank', { ascending: true })
    
    if (team) {
      query = query.eq('team_abbr', team)
    }
    
    const { data, error } = await query
    
    if (error) {
      // Table might not exist yet
      if (error.code === '42P01') {
        return NextResponse.json({
          success: false,
          error: 'team_ratings table not found',
          message: 'Run the SQL schema first: supabase/team-ratings-schema.sql',
          ratings: []
        })
      }
      throw error
    }
    
    // Format response
    const ratings = (data as TeamRating[]).map(r => ({
      team: r.team_abbr,
      name: r.team_name,
      elo: Math.round(r.elo_rating),
      rank: r.elo_rank,
      power: Math.round(r.power_rating * 10) / 10,
      offense: Math.round(r.off_rating * 10) / 10,
      defense: Math.round(r.def_rating * 10) / 10,
      record: `${r.wins}-${r.losses}`,
      gamesPlayed: r.games_played,
      trend: r.last_5_elo_change > 5 ? 'hot' : r.last_5_elo_change < -5 ? 'cold' : 'steady',
      last5Change: Math.round(r.last_5_elo_change),
      peakElo: Math.round(r.peak_elo),
      lowElo: Math.round(r.low_elo)
    }))
    
    return NextResponse.json({
      success: true,
      sport: sport.toUpperCase(),
      season,
      count: ratings.length,
      ratings,
      // Also include comparison helper
      comparison: team ? null : {
        top5: ratings.slice(0, 5).map(r => `${r.rank}. ${r.team} (${r.elo})`),
        avgElo: Math.round(ratings.reduce((s, r) => s + r.elo, 0) / ratings.length || 1500)
      }
    })
    
  } catch (error) {
    console.error('[TeamRatings] Error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch ratings',
      ratings: []
    }, { status: 500 })
  }
}
