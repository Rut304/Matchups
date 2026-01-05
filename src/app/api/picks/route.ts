import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const sport = searchParams.get('sport') || 'all'
  const status = searchParams.get('status') || 'all' // pending, won, lost, push
  const capperId = searchParams.get('capper_id')
  const limit = parseInt(searchParams.get('limit') || '50')
  const page = parseInt(searchParams.get('page') || '1')
  const offset = (page - 1) * limit

  try {
    const supabase = await createClient()

    let query = supabase
      .from('picks')
      .select(`
        *,
        capper:cappers(
          id,
          slug,
          name,
          avatar_emoji,
          avatar_url,
          verified,
          capper_type
        ),
        game:games(
          id,
          home_team_id,
          away_team_id,
          scheduled_at,
          status,
          home_score,
          away_score
        )
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Apply filters
    if (sport !== 'all') {
      query = query.eq('sport', sport.toLowerCase())
    }

    if (status !== 'all') {
      query = query.eq('result', status)
    }

    if (capperId) {
      query = query.eq('capper_id', capperId)
    }

    const { data: picks, error, count } = await query

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Transform picks data - handle array from join
    const transformedPicks = picks?.map(pick => {
      const capper = Array.isArray(pick.capper) ? pick.capper[0] : pick.capper
      const game = Array.isArray(pick.game) ? pick.game[0] : pick.game
      return {
        id: pick.id,
        capper: capper ? {
          id: capper.id,
          slug: capper.slug,
          name: capper.name,
          avatarEmoji: capper.avatar_emoji,
          avatarUrl: capper.avatar_url,
          verified: capper.verified,
          capperType: capper.capper_type,
        } : null,
        game: game ? {
          id: game.id,
          scheduledAt: game.scheduled_at,
          status: game.status,
          score: game.home_score !== null ? `${game.home_score}-${game.away_score}` : null,
        } : null,
        sport: pick.sport,
        pickType: pick.bet_type, // spread, moneyline, total, prop
        selection: pick.pick_description,
        odds: pick.odds,
        units: pick.units,
        confidence: pick.confidence,
        analysis: pick.analysis,
        result: pick.result, // pending, won, lost, push
        createdAt: pick.created_at,
      }
    }) || []

    return NextResponse.json({
      picks: transformedPicks,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
      filters: { sport, status, capperId },
    })
  } catch (error) {
    console.error('Picks API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch picks' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in' },
        { status: 401 }
      )
    }

    // Get user's capper profile
    const { data: capper, error: capperError } = await supabase
      .from('cappers')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (capperError || !capper) {
      return NextResponse.json(
        { error: 'Capper profile not found. Please create a profile first.' },
        { status: 404 }
      )
    }

    // Validate required fields
    const { sport, pick_type, selection, odds, units, game_id, analysis, confidence } = body

    if (!sport || !pick_type || !selection || !odds) {
      return NextResponse.json(
        { error: 'Missing required fields: sport, pick_type, selection, odds' },
        { status: 400 }
      )
    }

    // Create the pick
    const { data: pick, error: insertError } = await supabase
      .from('picks')
      .insert({
        capper_id: capper.id,
        sport: sport.toLowerCase(),
        pick_type,
        selection,
        odds: parseInt(odds),
        units: parseFloat(units) || 1,
        game_id: game_id || null,
        analysis: analysis || null,
        confidence: confidence || 'medium',
        result: 'pending',
      })
      .select()
      .single()

    if (insertError) {
      console.error('Insert error:', insertError)
      return NextResponse.json(
        { error: 'Failed to create pick' },
        { status: 500 }
      )
    }

    return NextResponse.json({ pick, message: 'Pick created successfully' })
  } catch (error) {
    console.error('Create pick error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
