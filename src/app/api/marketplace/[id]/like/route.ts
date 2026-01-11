import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

// POST - Toggle like on a listing
export async function POST(
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

    // Check if listing exists
    const { data: listing } = await supabase
      .from('marketplace_listings')
      .select('id')
      .eq('id', id)
      .eq('status', 'active')
      .single()

    if (!listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
    }

    // Check if already liked
    const { data: existingLike } = await supabase
      .from('marketplace_interactions')
      .select('id')
      .eq('user_id', user.id)
      .eq('listing_id', id)
      .eq('interaction_type', 'like')
      .single()

    if (existingLike) {
      // Unlike
      await supabase
        .from('marketplace_interactions')
        .delete()
        .eq('id', existingLike.id)

      // Decrement likes
      await supabase
        .from('marketplace_listings')
        .update({ likes_count: supabase.rpc('marketplace_listings.likes_count - 1') })
        .eq('id', id)

      return NextResponse.json({ liked: false })
    } else {
      // Like
      await supabase
        .from('marketplace_interactions')
        .insert({
          user_id: user.id,
          listing_id: id,
          interaction_type: 'like'
        })

      // Increment likes
      await supabase.rpc('increment_marketplace_metric', { 
        p_listing_id: id, 
        p_metric: 'likes' 
      })

      return NextResponse.json({ liked: true })
    }

  } catch (error) {
    console.error('Like toggle error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
