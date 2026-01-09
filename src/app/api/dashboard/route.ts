import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch all dashboard data
    const [betsResult, followsResult, statsResult, prefsResult] = await Promise.all([
      supabase
        .from('user_bets')
        .select('*')
        .eq('user_id', user.id)
        .order('placed_at', { ascending: false })
        .limit(100),
      supabase
        .from('user_follows')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }),
      supabase.rpc('get_user_betting_stats', { p_user_id: user.id }),
      supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single()
    ])

    return NextResponse.json({
      bets: betsResult.data || [],
      follows: followsResult.data || [],
      stats: statsResult.data?.[0] || null,
      preferences: prefsResult.data || null,
      user: {
        id: user.id,
        email: user.email,
        username: user.user_metadata?.username
      }
    })
  } catch (error) {
    console.error('Dashboard API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
