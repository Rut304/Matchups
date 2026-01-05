import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params

  try {
    const supabase = await createClient()

    // Fetch capper by username (slug)
    const { data: capper, error: capperError } = await supabase
      .from('cappers')
      .select(`
        *,
        capper_stats(*),
        picks(
          id,
          sport,
          league,
          bet_type,
          pick_description,
          odds,
          units,
          result,
          profit,
          game_date,
          created_at
        )
      `)
      .eq('username', slug)
      .single()

    if (capperError) {
      // If not found by username, try by ID
      const { data: capperById, error: idError } = await supabase
        .from('cappers')
        .select(`
          *,
          capper_stats(*),
          picks(
            id,
            sport,
            league,
            bet_type,
            pick_description,
            odds,
            units,
            result,
            profit,
            game_date,
            created_at
          )
        `)
        .eq('id', slug)
        .single()

      if (idError) {
        return NextResponse.json({ error: 'Capper not found' }, { status: 404 })
      }

      return formatCapperResponse(capperById)
    }

    return formatCapperResponse(capper)
  } catch (error) {
    console.error('Capper profile API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

interface StatsAccumulator {
  wins: number
  losses: number
  pushes: number
  units: number
}

function formatCapperResponse(capper: Record<string, unknown>) {
  const stats = capper.capper_stats as Record<string, unknown>[] || []
  const picks = capper.picks as Record<string, unknown>[] || []

  // Aggregate stats across all sports
  const aggregatedStats = stats.reduce<StatsAccumulator>(
    (acc, stat) => ({
      wins: acc.wins + ((stat.wins as number) || 0),
      losses: acc.losses + ((stat.losses as number) || 0),
      pushes: acc.pushes + ((stat.pushes as number) || 0),
      units: acc.units + ((stat.units as number) || 0),
    }),
    { wins: 0, losses: 0, pushes: 0, units: 0 }
  )

  const totalPicks = aggregatedStats.wins + aggregatedStats.losses + aggregatedStats.pushes
  const winRate = totalPicks > 0 
    ? Math.round((aggregatedStats.wins / (aggregatedStats.wins + aggregatedStats.losses)) * 100)
    : 0

  // Calculate sport-specific stats
  const statsBySport = stats.map((stat) => ({
    sport: stat.sport,
    wins: stat.wins,
    losses: stat.losses,
    pushes: stat.pushes,
    units: stat.units,
    roi: stat.roi,
    avgOdds: stat.avg_odds,
  }))

  // Format picks
  const formattedPicks = picks.map((pick) => ({
    id: pick.id,
    sport: pick.sport,
    league: pick.league,
    betType: pick.bet_type,
    description: pick.pick_description,
    odds: pick.odds,
    units: pick.units,
    result: pick.result,
    profit: pick.profit,
    gameDate: pick.game_date,
    createdAt: pick.created_at,
  }))

  return NextResponse.json({
    id: capper.id,
    username: capper.username,
    displayName: capper.display_name,
    avatar: capper.avatar_url,
    bio: capper.bio,
    isVerified: capper.is_verified,
    isPro: capper.is_pro,
    socialLinks: capper.social_links,
    stats: {
      overall: {
        ...aggregatedStats,
        totalPicks,
        winRate,
      },
      bySport: statsBySport,
    },
    picks: formattedPicks,
    createdAt: capper.created_at,
  })
}
