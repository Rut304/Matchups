import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

// POST - Copy a system from marketplace
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

    // Fetch the listing
    const { data: listing, error: listingError } = await supabase
      .from('marketplace_listings')
      .select(`
        *,
        user_systems!marketplace_listings_system_id_fkey(*)
      `)
      .eq('id', id)
      .eq('status', 'active')
      .single()

    if (listingError || !listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
    }

    // Check if user already copied this
    const { data: existingCopy } = await supabase
      .from('system_copies')
      .select('id')
      .eq('original_listing_id', id)
      .eq('copier_id', user.id)
      .single()

    if (existingCopy) {
      return NextResponse.json({ error: 'You have already copied this system' }, { status: 400 })
    }

    // Can't copy your own system
    if (listing.creator_id === user.id) {
      return NextResponse.json({ error: 'You cannot copy your own system' }, { status: 400 })
    }

    const originalSystem = listing.user_systems

    // Create a copy of the system for the user
    const { data: copiedSystem, error: copyError } = await supabase
      .from('user_systems')
      .insert({
        user_id: user.id,
        name: `${originalSystem.name} (Copy)`,
        description: originalSystem.description,
        sport: originalSystem.sport,
        bet_type: originalSystem.bet_type,
        criteria: originalSystem.criteria,
        custom_prompt: originalSystem.custom_prompt,
        situation_filters: originalSystem.situation_filters,
        stats: {
          record: '0-0-0',
          wins: 0,
          losses: 0,
          pushes: 0,
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
        is_public: false
      })
      .select()
      .single()

    if (copyError) {
      console.error('Copy system error:', copyError)
      return NextResponse.json({ error: 'Failed to copy system' }, { status: 500 })
    }

    // Record the copy
    await supabase
      .from('system_copies')
      .insert({
        original_system_id: listing.system_id,
        original_listing_id: id,
        copied_system_id: copiedSystem.id,
        copier_id: user.id
      })

    // Record interaction
    await supabase
      .from('marketplace_interactions')
      .upsert({
        user_id: user.id,
        listing_id: id,
        interaction_type: 'copy'
      }, { onConflict: 'user_id,listing_id,interaction_type' })

    // Increment copies count
    await supabase.rpc('increment_marketplace_metric', { 
      p_listing_id: id, 
      p_metric: 'copies' 
    })

    return NextResponse.json({ 
      success: true,
      system: copiedSystem,
      message: 'System copied successfully! You can find it in your dashboard.'
    })

  } catch (error) {
    console.error('Copy system error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
