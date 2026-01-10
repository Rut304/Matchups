import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

// GET - Fetch user's systems
export async function GET() {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {
              // Ignore
            }
          },
        },
      }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      // Return empty array for unauthenticated users instead of 401
      return NextResponse.json({ systems: [] })
    }

    // Fetch user's systems
    const { data: systems, error } = await supabase
      .from('user_systems')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching user systems:', error)
      return NextResponse.json({ error: 'Failed to fetch systems' }, { status: 500 })
    }

    return NextResponse.json({ systems: systems || [] })
  } catch (error) {
    console.error('Systems API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create new system
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {
              // Ignore
            }
          },
        },
      }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    
    const {
      name,
      description,
      sport,
      bet_type,
      criteria,
      custom_prompt,
      situation_filters,
      backtest_results,
      stats,
      is_public = false
    } = body

    // Validate required fields
    if (!name || !sport || !bet_type) {
      return NextResponse.json({ 
        error: 'Missing required fields: name, sport, bet_type' 
      }, { status: 400 })
    }

    // Insert new system
    const { data: system, error } = await supabase
      .from('user_systems')
      .insert({
        user_id: user.id,
        name,
        description,
        sport,
        bet_type,
        criteria: criteria || [],
        custom_prompt,
        situation_filters: situation_filters || [],
        backtest_results: backtest_results || {},
        stats: stats || {
          record: '0-0-0',
          winPct: 0,
          roi: 0,
          units: 0,
          avgOdds: -110,
          clv: 0,
          maxDrawdown: 0,
          sharpeRatio: 0,
          kellyPct: 0
        },
        is_active: true,
        is_public,
        backtest_completed_at: backtest_results ? new Date().toISOString() : null
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating system:', error)
      return NextResponse.json({ error: 'Failed to create system' }, { status: 500 })
    }

    return NextResponse.json({ system }, { status: 201 })
  } catch (error) {
    console.error('Systems POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
