import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const limit = parseInt(searchParams.get('limit') || '50')

  try {
    const supabase = await createClient()

    // Fetch cappers with their stats
    // Note: Using correct column names from leaderboard-schema.sql
    const query = supabase
      .from('capper_stats')
      .select(`
        id,
        capper_id,
        total_picks,
        total_wins,
        total_losses,
        total_pushes,
        win_percentage,
        net_units,
        roi_percentage,
        current_streak,
        overall_rank,
        rank_change,
        capper:cappers(
          id,
          slug,
          name,
          avatar_emoji,
          avatar_url,
          verified,
          capper_type,
          network,
          role
        )
      `)
      .order('roi_percentage', { ascending: false })
      .limit(limit)

    const { data: stats, error } = await query

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Transform the data for the frontend
    // Note: capper is returned as an array from the join, take first element
    const leaderboard = stats?.map((stat, index) => {
      const capper = Array.isArray(stat.capper) ? stat.capper[0] : stat.capper
      return {
        rank: stat.overall_rank || index + 1,
        id: capper?.id || stat.capper_id,
        slug: capper?.slug || 'unknown',
        name: capper?.name || 'Unknown',
        avatarEmoji: capper?.avatar_emoji || '🎯',
        avatarUrl: capper?.avatar_url || null,
        verified: capper?.verified || false,
        capperType: capper?.capper_type || 'community',
        network: capper?.network || null,
        role: capper?.role || null,
        record: {
          wins: stat.total_wins || 0,
          losses: stat.total_losses || 0,
          pushes: stat.total_pushes || 0,
        },
        winRate: stat.win_percentage || 0,
        roi: stat.roi_percentage || 0,
        units: stat.net_units || 0,
        streak: stat.current_streak || '',
        rankChange: stat.rank_change || 0,
        totalPicks: stat.total_picks || 0,
      }
    }) || []

    return NextResponse.json({
      leaderboard,
      total: leaderboard.length,
    })
  } catch (error) {
    console.error('Leaderboard API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard data' },
      { status: 500 }
    )
  }
}
