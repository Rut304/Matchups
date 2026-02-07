import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const sport = searchParams.get('sport') || 'all'
  const susType = searchParams.get('susType') || 'all'
  const timeFrame = searchParams.get('timeFrame') || 'all'
  const trending = searchParams.get('trending') === 'true'
  const limit = parseInt(searchParams.get('limit') || '20')
  const page = parseInt(searchParams.get('page') || '1')
  const offset = (page - 1) * limit

  try {
    const supabase = await createClient()

    // Order by priority_score (70% recency + 30% engagement) for dynamic rotation
    let query = supabase
      .from('sus_plays')
      .select('*', { count: 'exact' })
      .eq('moderation_status', 'approved')
      .order('priority_score', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Apply filters
    if (sport !== 'all') {
      query = query.eq('sport', sport.toLowerCase())
    }

    if (susType !== 'all') {
      query = query.eq('betting_impact', susType)
    }

    if (trending) {
      query = query.eq('is_trending', true)
    }

    // Time frame filter
    if (timeFrame !== 'all') {
      const now = new Date()
      let startDate: Date
      switch (timeFrame) {
        case 'today':
          startDate = new Date(now.setHours(0, 0, 0, 0))
          break
        case 'week':
          startDate = new Date(now.setDate(now.getDate() - 7))
          break
        case 'month':
          startDate = new Date(now.setMonth(now.getMonth() - 1))
          break
        default:
          startDate = new Date('2020-01-01')
      }
      query = query.gte('created_at', startDate.toISOString())
    }

    const { data: susPlays, error, count } = await query

    if (error) {
      console.error('Supabase error:', error)
      // If no table exists yet, return empty array with message - NO FAKE DATA
      // Handle both PostgreSQL error codes and Supabase schema cache errors
      if (error.code === '42P01' || error.message?.includes('schema cache') || error.code === 'PGRST200') {
        console.log('Sus plays table not found')
        return NextResponse.json({
          susPlays: [],
          pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
          filters: { sport, susType, timeFrame, trending },
          source: 'database',
          message: 'Sus plays not available. Database table needs to be created.',
        })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // If no data in DB, return empty array with message - NO FAKE DATA
    if (!susPlays || susPlays.length === 0) {
      return NextResponse.json({
        susPlays: [],
        pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
        filters: { sport, susType, timeFrame, trending },
        message: 'No sus plays found matching your criteria.',
      })
    }

    // Transform data
    const transformedPlays = susPlays.map(play => ({
      id: play.id,
      sport: play.sport,
      playerName: play.player_name || 'Unknown',
      team: play.team || 'N/A',
      title: play.title,
      description: play.description,
      susType: play.betting_impact || 'other',
      videoUrl: play.video_url,
      thumbnailUrl: play.thumbnail_url,
      views: (play.sus_votes || 0) + (play.legit_votes || 0),
      susScore: play.sus_votes && play.legit_votes 
        ? Math.round((play.sus_votes / (play.sus_votes + play.legit_votes)) * 100)
        : 50,
      votes: {
        sus: play.sus_votes || 0,
        legit: play.legit_votes || 0,
      },
      trending: play.is_trending,
      verified: play.is_featured,
      postedAt: formatRelativeTime(play.created_at),
      gameContext: play.game_context,
    }))

    return NextResponse.json({
      susPlays: transformedPlays,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
      filters: { sport, susType, timeFrame, trending },
    })
  } catch (error) {
    console.error('Sus Plays API error:', error)
    return NextResponse.json({ error: 'Failed to fetch sus plays' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    // Get current user (optional for submissions)
    const { data: { user } } = await supabase.auth.getUser()

    const { title, description, sport, playerName, team, videoUrl, thumbnailUrl, bettingImpact, gameContext } = body

    if (!title || !description || !sport) {
      return NextResponse.json(
        { error: 'Missing required fields: title, description, sport' },
        { status: 400 }
      )
    }

    const { data: susPlay, error } = await supabase
      .from('sus_plays')
      .insert({
        title,
        description,
        sport: sport.toLowerCase(),
        player_name: playerName,
        team,
        video_url: videoUrl,
        thumbnail_url: thumbnailUrl,
        betting_impact: bettingImpact,
        game_context: gameContext,
        submitted_by: user?.id || null,
        moderation_status: 'pending',
      })
      .select()
      .single()

    if (error) {
      console.error('Insert error:', error)
      return NextResponse.json({ error: 'Failed to submit sus play' }, { status: 500 })
    }

    return NextResponse.json({ susPlay, message: 'Sus play submitted for review' })
  } catch (error) {
    console.error('Submit sus play error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const { id, vote } = body // vote: 'sus' | 'legit'

    if (!id || !vote) {
      return NextResponse.json({ error: 'Missing id or vote' }, { status: 400 })
    }

    // Get current votes
    const { data: current, error: fetchError } = await supabase
      .from('sus_plays')
      .select('sus_votes, legit_votes')
      .eq('id', id)
      .single()

    if (fetchError) {
      return NextResponse.json({ error: 'Sus play not found' }, { status: 404 })
    }

    // Update vote count
    const updates = vote === 'sus'
      ? { sus_votes: (current.sus_votes || 0) + 1 }
      : { legit_votes: (current.legit_votes || 0) + 1 }

    const { error: updateError } = await supabase
      .from('sus_plays')
      .update(updates)
      .eq('id', id)

    if (updateError) {
      return NextResponse.json({ error: 'Failed to update vote' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Vote error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString()
}

// getSampleData function removed - NO FAKE DATA policy
// All sus plays must come from the database (Supabase)
