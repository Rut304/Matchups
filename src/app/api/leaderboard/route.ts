import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const sport = searchParams.get('sport') || 'all'
  const timeframe = searchParams.get('timeframe') || 'all'
  const limit = parseInt(searchParams.get('limit') || '50')

  try {
    const supabase = await createClient()

    // Fetch cappers with their stats
    let query = supabase
      .from('capper_stats')
      .select(`
        *,
        capper:cappers(
          id,
          username,
          display_name,
          avatar_url,
          bio,
          is_verified,
          is_pro
        )
      `)
      .order('roi', { ascending: false })
      .limit(limit)

    // Filter by sport if specified
    if (sport !== 'all') {
      query = query.eq('sport', sport.toLowerCase())
    }

    // Filter by timeframe
    if (timeframe !== 'all') {
      const now = new Date()
      let startDate: Date

      switch (timeframe) {
        case 'week':
          startDate = new Date(now.setDate(now.getDate() - 7))
          break
        case 'month':
          startDate = new Date(now.setMonth(now.getMonth() - 1))
          break
        case 'season':
          // Assume season starts in September
          startDate = new Date(now.getFullYear(), 8, 1)
          if (now < startDate) {
            startDate = new Date(now.getFullYear() - 1, 8, 1)
          }
          break
        default:
          startDate = new Date(0) // All time
      }

      query = query.gte('updated_at', startDate.toISOString())
    }

    const { data: stats, error } = await query

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Transform the data for the frontend
    const leaderboard = stats?.map((stat, index) => ({
      rank: index + 1,
      id: stat.capper?.id || stat.capper_id,
      username: stat.capper?.username || 'Unknown',
      displayName: stat.capper?.display_name || stat.capper?.username || 'Unknown',
      avatar: stat.capper?.avatar_url || null,
      isVerified: stat.capper?.is_verified || false,
      isPro: stat.capper?.is_pro || false,
      sport: stat.sport,
      record: {
        wins: stat.wins || 0,
        losses: stat.losses || 0,
        pushes: stat.pushes || 0,
      },
      roi: stat.roi || 0,
      units: stat.units || 0,
      streak: stat.current_streak || 0,
      avgOdds: stat.avg_odds || -110,
      winRate: stat.wins && (stat.wins + stat.losses) > 0 
        ? Math.round((stat.wins / (stat.wins + stat.losses)) * 100) 
        : 0,
    })) || []

    return NextResponse.json({
      leaderboard,
      total: leaderboard.length,
      sport,
      timeframe,
    })
  } catch (error) {
    console.error('Leaderboard API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard data' },
      { status: 500 }
    )
  }
}
