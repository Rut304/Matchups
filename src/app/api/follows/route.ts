import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

// GET - Fetch user's follows
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
    const type = searchParams.get('type')

    let query = supabase
      .from('user_follows')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (type) query = query.eq('follow_type', type)

    const { data, error } = await query

    if (error) throw error

    return NextResponse.json({ follows: data || [] })
  } catch (error) {
    console.error('Follows API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Follow someone/something
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
    const { follow_type, entity_id, entity_name, entity_data, notifications_enabled } = body

    if (!follow_type || !entity_id || !entity_name) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Check if already following
    const { data: existing } = await supabase
      .from('user_follows')
      .select('id')
      .eq('user_id', user.id)
      .eq('follow_type', follow_type)
      .eq('entity_id', entity_id)
      .single()

    if (existing) {
      return NextResponse.json({ error: 'Already following' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('user_follows')
      .insert({
        user_id: user.id,
        follow_type,
        entity_id,
        entity_name,
        entity_data: entity_data || {},
        notifications_enabled: notifications_enabled !== false
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ follow: data })
  } catch (error) {
    console.error('Create follow error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Unfollow
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
    const entity_id = searchParams.get('entity_id')
    const follow_type = searchParams.get('follow_type')

    if (id) {
      // Delete by ID
      const { error } = await supabase
        .from('user_follows')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

      if (error) throw error
    } else if (entity_id && follow_type) {
      // Delete by entity
      const { error } = await supabase
        .from('user_follows')
        .delete()
        .eq('entity_id', entity_id)
        .eq('follow_type', follow_type)
        .eq('user_id', user.id)

      if (error) throw error
    } else {
      return NextResponse.json({ error: 'ID or entity_id+follow_type required' }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete follow error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
