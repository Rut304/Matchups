import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const sport = searchParams.get('sport') || 'all'
  const betType = searchParams.get('betType') || 'all'
  const result = searchParams.get('result') || 'all'
  const timeRange = searchParams.get('timeRange') || 'all'
  const limit = parseInt(searchParams.get('limit') || '100')
  const page = parseInt(searchParams.get('page') || '1')
  const offset = (page - 1) * limit

  try {
    const supabase = await createClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ 
        picks: [], 
        stats: { wins: 0, losses: 0, pushes: 0, pending: 0, totalProfit: 0, roi: 0, winRate: 0 },
        message: 'Sign in to track your picks' 
      })
    }

    let query = supabase
      .from('user_picks')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Apply sport filter
    if (sport !== 'all') {
      query = query.eq('sport', sport.toLowerCase())
    }

    // Apply bet type filter
    if (betType !== 'all') {
      query = query.eq('pick_type', betType)
    }

    // Apply result filter
    if (result !== 'all') {
      query = query.eq('result', result)
    }

    // Apply time range filter
    if (timeRange !== 'all') {
      const now = new Date()
      let fromDate: Date

      switch (timeRange) {
        case 'week':
          fromDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          break
        case 'month':
          fromDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate())
          break
        case 'year':
          fromDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate())
          break
        default:
          fromDate = new Date(0) // Beginning of time
      }

      query = query.gte('created_at', fromDate.toISOString())
    }

    const { data: picks, error, count } = await query

    if (error) {
      console.error('Supabase user picks error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Calculate statistics
    const allPicks = picks || []
    const settled = allPicks.filter(p => p.result !== 'pending')
    const wins = settled.filter(p => p.result === 'win').length
    const losses = settled.filter(p => p.result === 'loss').length
    const pushes = settled.filter(p => p.result === 'push').length
    const pending = allPicks.filter(p => p.result === 'pending').length
    
    const totalProfit = allPicks.reduce((sum, p) => {
      if (p.result === 'win') {
        // Calculate profit from odds
        const stake = p.stake || 100
        const odds = p.odds_at_pick || -110
        if (odds > 0) {
          return sum + (stake * odds / 100)
        } else {
          return sum + (stake * 100 / Math.abs(odds))
        }
      } else if (p.result === 'loss') {
        return sum - (p.stake || 100)
      }
      return sum
    }, 0)

    const totalStaked = settled.reduce((sum, p) => sum + (p.stake || 100), 0)
    const roi = totalStaked > 0 ? (totalProfit / totalStaked) * 100 : 0
    const winRate = (wins + losses) > 0 ? (wins / (wins + losses)) * 100 : 0

    // Transform picks data
    const transformedPicks = allPicks.map(pick => ({
      id: pick.id,
      date: pick.created_at,
      sport: pick.sport || 'nfl',
      betType: pick.pick_type || 'spread',
      matchup: pick.matchup || 'Game',
      pick: pick.pick_value || '',
      odds: pick.odds_at_pick || -110,
      stake: pick.stake || 100,
      result: pick.result || 'pending',
      profit: pick.payout || 0,
      notes: pick.notes || '',
    }))

    return NextResponse.json({
      picks: transformedPicks,
      stats: {
        wins,
        losses,
        pushes,
        pending,
        totalProfit: Math.round(totalProfit * 100) / 100,
        roi: Math.round(roi * 100) / 100,
        winRate: Math.round(winRate * 100) / 100,
      },
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    })

  } catch (error) {
    console.error('User picks API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const body = await request.json()
    const { sport, betType, matchup, pick, odds, stake, notes, gameId } = body

    // Validate required fields
    if (!pick || !matchup) {
      return NextResponse.json({ error: 'Pick and matchup are required' }, { status: 400 })
    }

    const { data: newPick, error } = await supabase
      .from('user_picks')
      .insert({
        user_id: user.id,
        game_id: gameId || null,
        sport: sport?.toLowerCase() || 'nfl',
        pick_type: betType || 'spread',
        pick_value: pick,
        matchup: matchup,
        odds_at_pick: odds || -110,
        stake: stake || 100,
        result: 'pending',
        notes: notes || null,
      })
      .select()
      .single()

    if (error) {
      console.error('Insert pick error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ pick: newPick, message: 'Pick added successfully' })

  } catch (error) {
    console.error('POST user picks error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const supabase = await createClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const body = await request.json()
    const { id, result, payout } = body

    if (!id) {
      return NextResponse.json({ error: 'Pick ID is required' }, { status: 400 })
    }

    const updateData: Record<string, unknown> = {}
    if (result) updateData.result = result
    if (payout !== undefined) updateData.payout = payout

    const { data: updatedPick, error } = await supabase
      .from('user_picks')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id) // Ensure user owns this pick
      .select()
      .single()

    if (error) {
      console.error('Update pick error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ pick: updatedPick, message: 'Pick updated successfully' })

  } catch (error) {
    console.error('PUT user picks error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = await createClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Pick ID is required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('user_picks')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id) // Ensure user owns this pick

    if (error) {
      console.error('Delete pick error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ message: 'Pick deleted successfully' })

  } catch (error) {
    console.error('DELETE user picks error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
