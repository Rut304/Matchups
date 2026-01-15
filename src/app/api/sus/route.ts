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

    let query = supabase
      .from('sus_plays')
      .select('*', { count: 'exact' })
      .eq('moderation_status', 'approved')
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
      // If no table exists yet, return sample data
      if (error.code === '42P01') {
        return NextResponse.json({
          susPlays: getSampleData(),
          pagination: { page: 1, limit: 20, total: 8, totalPages: 1 },
          filters: { sport, susType, timeFrame, trending },
        })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // If no data in DB, return sample data
    if (!susPlays || susPlays.length === 0) {
      return NextResponse.json({
        susPlays: getSampleData(),
        pagination: { page: 1, limit: 20, total: 8, totalPages: 1 },
        filters: { sport, susType, timeFrame, trending },
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

function getSampleData() {
  return [
    {
      id: 'sample-1',
      sport: 'nfl',
      playerName: 'Ka\'imi Fairbairn',
      team: 'HOU',
      title: 'Wild XP Miss Causes Under to Hit',
      description: 'Texans miss extra point in WILD fashion. Game O/U was 36.5 - the missed XP caused the under to hit.',
      susType: 'total',
      videoUrl: '#',
      views: 1200000,
      susScore: 95,
      votes: { sus: 8920, legit: 591 },
      trending: true,
      verified: false,
      postedAt: '2 hours ago',
      gameContext: '4th Quarter',
    },
    {
      id: 'sample-2',
      sport: 'nba',
      playerName: 'Multiple Players',
      team: 'LAL',
      title: 'Intentional Free Throw Miss?',
      description: 'Late game free throw miss with spread at exactly 5.5 points. Ball went nowhere near rim.',
      susType: 'spread',
      views: 450000,
      susScore: 78,
      votes: { sus: 3420, legit: 980 },
      trending: true,
      verified: false,
      postedAt: '5 hours ago',
      gameContext: 'Final minute',
    },
    {
      id: 'sample-3',
      sport: 'nfl',
      playerName: 'Travis Kelce',
      team: 'KC',
      title: 'Dropped TD - Prop Line Exact',
      description: 'Easy TD drop in endzone. His receiving yards prop was 74.5 - he finished with exactly 74.',
      susType: 'prop',
      views: 890000,
      susScore: 82,
      votes: { sus: 5670, legit: 1230 },
      trending: false,
      verified: false,
      postedAt: '1 day ago',
      gameContext: '3rd Quarter',
    },
    {
      id: 'sample-4',
      sport: 'nhl',
      playerName: 'Connor McDavid',
      team: 'EDM',
      title: 'Empty Net Miss - Game Total',
      description: 'McDavid misses wide open empty net. Game total was 5.5 and stayed under.',
      susType: 'total',
      views: 320000,
      susScore: 65,
      votes: { sus: 1890, legit: 1010 },
      trending: false,
      verified: false,
      postedAt: '2 days ago',
      gameContext: 'Final minute',
    },
    {
      id: 'sample-5',
      sport: 'mlb',
      playerName: 'Shohei Ohtani',
      team: 'LAD',
      title: 'Bizarre Baserunning Out',
      description: 'Gets tagged out on inexplicable baserunning decision. First 5 Under hit by half run.',
      susType: 'total',
      views: 560000,
      susScore: 71,
      votes: { sus: 2340, legit: 950 },
      trending: false,
      verified: false,
      postedAt: '3 days ago',
      gameContext: '5th Inning',
    },
    {
      id: 'sample-6',
      sport: 'nba',
      playerName: 'Jayson Tatum',
      team: 'BOS',
      title: 'Late Points Prop Hit',
      description: 'Tatum scores meaningless basket in garbage time to hit his points prop exactly.',
      susType: 'prop',
      views: 230000,
      susScore: 55,
      votes: { sus: 1120, legit: 920 },
      trending: false,
      verified: false,
      postedAt: '4 days ago',
      gameContext: 'Garbage Time',
    },
  ]
}
