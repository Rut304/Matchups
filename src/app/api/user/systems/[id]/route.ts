import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

// GET - Fetch single system
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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

    const { data: { user } } = await supabase.auth.getUser()

    // Fetch system (either user's own or public)
    const { data: system, error } = await supabase
      .from('user_systems')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !system) {
      return NextResponse.json({ error: 'System not found' }, { status: 404 })
    }

    // Check if user has access
    if (!system.is_public && system.user_id !== user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Fetch recent picks
    const { data: picks } = await supabase
      .from('system_picks')
      .select('*')
      .eq('system_id', id)
      .order('picked_at', { ascending: false })
      .limit(10)

    return NextResponse.json({ 
      system,
      picks: picks || []
    })
  } catch (error) {
    console.error('System GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH - Update system
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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

    // Verify ownership
    const { data: existing } = await supabase
      .from('user_systems')
      .select('user_id')
      .eq('id', id)
      .single()

    if (!existing || existing.user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const body = await request.json()
    
    // Only allow updating certain fields
    const allowedFields = [
      'name', 'description', 'criteria', 'custom_prompt', 
      'situation_filters', 'backtest_results', 'stats',
      'is_active', 'is_public'
    ]
    
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates[field] = body[field]
      }
    }

    const { data: system, error } = await supabase
      .from('user_systems')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating system:', error)
      return NextResponse.json({ error: 'Failed to update system' }, { status: 500 })
    }

    return NextResponse.json({ system })
  } catch (error) {
    console.error('System PATCH error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Delete system
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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

    // Verify ownership before delete
    const { data: existing } = await supabase
      .from('user_systems')
      .select('user_id')
      .eq('id', id)
      .single()

    if (!existing || existing.user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { error } = await supabase
      .from('user_systems')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting system:', error)
      return NextResponse.json({ error: 'Failed to delete system' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('System DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
