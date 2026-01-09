import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

// GET - Fetch user's bets
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch { /* ignore */ }
          },
        },
      }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const sport = searchParams.get('sport')
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '50')

    let query = supabase
      .from('user_bets')
      .select('*')
      .eq('user_id', user.id)
      .order('placed_at', { ascending: false })
      .limit(limit)

    if (sport) query = query.eq('sport', sport)
    if (status) query = query.eq('status', status)

    const { data, error } = await query

    if (error) throw error

    return NextResponse.json({ bets: data || [] })
  } catch (error) {
    console.error('Bets API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create new bet
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch { /* ignore */ }
          },
        },
      }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { sport, bet_type, selection, odds, stake, sportsbook, confidence, notes, game_id, game_date, parlay_legs, tags } = body

    if (!sport || !bet_type || !selection || odds === undefined || !stake) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Calculate potential payout
    const potential_payout = odds > 0 
      ? stake + (stake * (odds / 100))
      : stake + (stake * (100 / Math.abs(odds)))

    const { data, error } = await supabase
      .from('user_bets')
      .insert({
        user_id: user.id,
        sport,
        bet_type,
        selection,
        odds,
        stake,
        potential_payout,
        sportsbook: sportsbook || null,
        confidence: confidence || null,
        notes: notes || null,
        game_id: game_id || null,
        game_date: game_date || null,
        parlay_legs: parlay_legs || [],
        tags: tags || [],
        status: 'pending'
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ bet: data })
  } catch (error) {
    console.error('Create bet error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH - Update bet (settle, edit)
export async function PATCH(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch { /* ignore */ }
          },
        },
      }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { id, status, actual_payout, ...updates } = body

    if (!id) {
      return NextResponse.json({ error: 'Bet ID required' }, { status: 400 })
    }

    const updateData: Record<string, unknown> = { ...updates, updated_at: new Date().toISOString() }
    
    if (status) {
      updateData.status = status
      if (['won', 'lost', 'push', 'cashout', 'void'].includes(status)) {
        updateData.settled_at = new Date().toISOString()
      }
    }
    
    if (actual_payout !== undefined) {
      updateData.actual_payout = actual_payout
    }

    const { data, error } = await supabase
      .from('user_bets')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ bet: data })
  } catch (error) {
    console.error('Update bet error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Delete bet
export async function DELETE(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch { /* ignore */ }
          },
        },
      }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Bet ID required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('user_bets')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete bet error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
