import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

// GET - Get single listing details
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

    // Fetch listing with related data
    const { data: listing, error } = await supabase
      .from('marketplace_listings')
      .select(`
        *,
        profiles!marketplace_listings_creator_id_fkey(username, avatar_url),
        user_systems!marketplace_listings_system_id_fkey(
          sport, 
          bet_type, 
          criteria,
          description,
          custom_prompt,
          situation_filters,
          stats
        )
      `)
      .eq('id', id)
      .single()

    if (error || !listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
    }

    // Only show active listings or user's own
    if (listing.status !== 'active' && listing.creator_id !== user?.id) {
      return NextResponse.json({ error: 'Listing not available' }, { status: 403 })
    }

    // Increment view count (don't wait for it)
    if (user && user.id !== listing.creator_id) {
      supabase
        .from('marketplace_interactions')
        .upsert({
          user_id: user.id,
          listing_id: id,
          interaction_type: 'view'
        }, { onConflict: 'user_id,listing_id,interaction_type' })
        .then(() => {
          supabase.rpc('increment_marketplace_metric', { 
            p_listing_id: id, 
            p_metric: 'views' 
          })
        })
    }

    // Get recent picks if system belongs to listing
    const { data: recentPicks } = await supabase
      .from('system_picks')
      .select('*')
      .eq('system_id', listing.system_id)
      .order('picked_at', { ascending: false })
      .limit(10)

    // Check user interactions
    let userInteraction = null
    if (user) {
      const { data: interactions } = await supabase
        .from('marketplace_interactions')
        .select('interaction_type')
        .eq('user_id', user.id)
        .eq('listing_id', id)

      userInteraction = {
        liked: interactions?.some(i => i.interaction_type === 'like') || false,
        copied: interactions?.some(i => i.interaction_type === 'copy') || false
      }
    }

    // Transform response
    const response = {
      ...listing,
      creator_username: listing.profiles?.username || 'Anonymous',
      creator_avatar: listing.profiles?.avatar_url,
      sport: listing.user_systems?.sport,
      bet_type: listing.user_systems?.bet_type,
      criteria: listing.user_systems?.criteria || [],
      system_description: listing.user_systems?.description,
      stats: listing.user_systems?.stats,
      recent_picks: recentPicks || [],
      user_interaction: userInteraction,
      is_owner: user?.id === listing.creator_id,
      profiles: undefined,
      user_systems: undefined
    }

    return NextResponse.json({ listing: response })

  } catch (error) {
    console.error('Listing GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH - Update listing
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
    const { data: listing } = await supabase
      .from('marketplace_listings')
      .select('creator_id')
      .eq('id', id)
      .single()

    if (!listing || listing.creator_id !== user.id) {
      return NextResponse.json({ error: 'Not authorized to edit this listing' }, { status: 403 })
    }

    const body = await request.json()
    const allowedUpdates = ['title', 'short_description', 'full_description', 'tags']
    const updates: Record<string, unknown> = {}
    
    for (const key of allowedUpdates) {
      if (body[key] !== undefined) {
        updates[key] = body[key]
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    const { data: updated, error: updateError } = await supabase
      .from('marketplace_listings')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      return NextResponse.json({ error: 'Failed to update listing' }, { status: 500 })
    }

    return NextResponse.json({ listing: updated })

  } catch (error) {
    console.error('Listing PATCH error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Remove listing from marketplace
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

    // Verify ownership
    const { data: listing } = await supabase
      .from('marketplace_listings')
      .select('creator_id, system_id')
      .eq('id', id)
      .single()

    if (!listing || listing.creator_id !== user.id) {
      return NextResponse.json({ error: 'Not authorized to delete this listing' }, { status: 403 })
    }

    // Delete listing
    const { error: deleteError } = await supabase
      .from('marketplace_listings')
      .delete()
      .eq('id', id)

    if (deleteError) {
      return NextResponse.json({ error: 'Failed to delete listing' }, { status: 500 })
    }

    // Update system to not be public
    await supabase
      .from('user_systems')
      .update({ is_public: false })
      .eq('id', listing.system_id)

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Listing DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
