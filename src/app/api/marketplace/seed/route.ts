import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { STANDARD_BETTING_SYSTEMS, MUSCHNICK_CREATOR } from '@/lib/data/standard-betting-systems'

export const dynamic = 'force-dynamic'

// POST - Seed the 12 standard betting systems from Muschnick
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
            } catch { /* Ignore */ }
          },
        },
      }
    )

    // Check if Muschnick profile exists, create if not
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', MUSCHNICK_CREATOR.username)
      .single()

    let muschnickId = existingProfile?.id

    if (!muschnickId) {
      // Create Muschnick profile
      const { data: newProfile, error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: MUSCHNICK_CREATOR.id,
          username: MUSCHNICK_CREATOR.username,
          avatar_url: MUSCHNICK_CREATOR.avatarUrl,
          bio: MUSCHNICK_CREATOR.bio,
          role: MUSCHNICK_CREATOR.role
        })
        .select('id')
        .single()

      if (profileError) {
        console.error('Profile creation error:', profileError)
        // Try to use the ID directly if profile table doesn't exist
        muschnickId = MUSCHNICK_CREATOR.id
      } else {
        muschnickId = newProfile?.id || MUSCHNICK_CREATOR.id
      }
    }

    const results = {
      created: 0,
      updated: 0,
      skipped: 0,
      errors: [] as string[]
    }

    for (const system of STANDARD_BETTING_SYSTEMS) {
      try {
        // Check if system already exists
        const { data: existing } = await supabase
          .from('marketplace_listings')
          .select('id')
          .eq('title', system.title)
          .single()

        if (existing) {
          // Update existing
          const { error: updateError } = await supabase
            .from('marketplace_listings')
            .update({
              short_description: system.shortDescription,
              full_description: system.fullDescription,
              tags: system.tags,
              wins: system.historicalRecord.wins,
              losses: system.historicalRecord.losses,
              pushes: system.historicalRecord.pushes,
              win_rate: system.historicalRecord.winRate,
              roi: system.historicalRecord.roi,
              total_picks: system.sampleSize,
              is_featured: true,
              updated_at: new Date().toISOString()
            })
            .eq('id', existing.id)

          if (updateError) {
            results.errors.push(`Update error for ${system.title}: ${updateError.message}`)
          } else {
            results.updated++
          }
        } else {
          // First create a user_system entry
          const { data: userSystem, error: systemError } = await supabase
            .from('user_systems')
            .insert({
              user_id: muschnickId,
              name: system.title,
              description: system.fullDescription,
              sport: system.sport,
              bet_type: system.betType,
              criteria: system.criteria,
              is_public: true
            })
            .select('id')
            .single()

          if (systemError) {
            // If user_systems table doesn't exist, create listing directly
            console.warn('user_systems insert failed, creating listing directly:', systemError.message)
          }

          // Create marketplace listing
          const { error: insertError } = await supabase
            .from('marketplace_listings')
            .insert({
              system_id: userSystem?.id || system.id,
              creator_id: muschnickId,
              title: system.title,
              short_description: system.shortDescription,
              full_description: system.fullDescription,
              tags: system.tags,
              is_free: true,
              price_cents: 0,
              total_picks: system.sampleSize,
              wins: system.historicalRecord.wins,
              losses: system.historicalRecord.losses,
              pushes: system.historicalRecord.pushes,
              win_rate: system.historicalRecord.winRate,
              roi: system.historicalRecord.roi,
              avg_odds: -110,
              streak: 0,
              copies_count: Math.floor(Math.random() * 500) + 100, // Simulated copies
              views_count: Math.floor(Math.random() * 5000) + 1000, // Simulated views
              likes_count: Math.floor(Math.random() * 200) + 50, // Simulated likes
              status: 'active',
              is_featured: true,
              published_at: new Date().toISOString()
            })

          if (insertError) {
            results.errors.push(`Insert error for ${system.title}: ${insertError.message}`)
          } else {
            results.created++
          }
        }
      } catch (err) {
        results.errors.push(`Error processing ${system.title}: ${err instanceof Error ? err.message : 'Unknown'}`)
      }
    }

    return NextResponse.json({
      success: true,
      message: `Seeded ${results.created} new systems, updated ${results.updated}, ${results.errors.length} errors`,
      results,
      creator: MUSCHNICK_CREATOR.username
    })

  } catch (error) {
    console.error('Seed marketplace error:', error)
    return NextResponse.json({ 
      error: 'Failed to seed marketplace',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// GET - Return the standard systems data (for display even without DB)
export async function GET() {
  return NextResponse.json({
    systems: STANDARD_BETTING_SYSTEMS.map(sys => ({
      ...sys,
      creator: MUSCHNICK_CREATOR
    })),
    total: STANDARD_BETTING_SYSTEMS.length,
    creator: MUSCHNICK_CREATOR
  })
}
