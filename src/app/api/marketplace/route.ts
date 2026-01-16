import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { STANDARD_BETTING_SYSTEMS, MUSCHNICK_CREATOR } from '@/lib/data/standard-betting-systems'

// Types for marketplace
interface MarketplaceListing {
  id: string
  system_id: string
  creator_id: string
  title: string
  short_description: string
  full_description: string | null
  tags: string[]
  is_free: boolean
  price_cents: number
  total_picks: number
  wins: number
  losses: number
  pushes: number
  win_rate: number
  roi: number
  avg_odds: number
  streak: number
  copies_count: number
  views_count: number
  likes_count: number
  status: string
  is_featured: boolean
  published_at: string
  created_at: string
  // Joined fields
  creator_username?: string
  creator_avatar?: string
  sport?: string
  bet_type?: string
  criteria?: string[]
}

// GET - Browse marketplace listings
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url)
    const sport = searchParams.get('sport')
    const betType = searchParams.get('betType')
    const sortBy = searchParams.get('sortBy') || 'winRate' // winRate, roi, copies, recent
    const minWinRate = parseFloat(searchParams.get('minWinRate') || '0')
    const minPicks = parseInt(searchParams.get('minPicks') || '0')
    const featured = searchParams.get('featured') === 'true'
    const free = searchParams.get('free')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50)
    const offset = parseInt(searchParams.get('offset') || '0')
    const search = searchParams.get('search')

    // Get current user for personalization
    const { data: { user } } = await supabase.auth.getUser()

    // Build query
    let query = supabase
      .from('marketplace_listings')
      .select(`
        *,
        profiles!marketplace_listings_creator_id_fkey(username, avatar_url),
        user_systems!marketplace_listings_system_id_fkey(sport, bet_type, criteria)
      `)
      .eq('status', 'active')

    // Apply filters
    if (sport && sport !== 'ALL') {
      query = query.eq('user_systems.sport', sport)
    }

    if (betType && betType !== 'all') {
      query = query.eq('user_systems.bet_type', betType)
    }

    if (minWinRate > 0) {
      query = query.gte('win_rate', minWinRate)
    }

    if (minPicks > 0) {
      query = query.gte('total_picks', minPicks)
    }

    if (featured) {
      query = query.eq('is_featured', true)
    }

    if (free === 'true') {
      query = query.eq('is_free', true)
    } else if (free === 'false') {
      query = query.eq('is_free', false)
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,short_description.ilike.%${search}%`)
    }

    // Apply sorting
    switch (sortBy) {
      case 'winRate':
        query = query.order('win_rate', { ascending: false })
        break
      case 'roi':
        query = query.order('roi', { ascending: false })
        break
      case 'copies':
        query = query.order('copies_count', { ascending: false })
        break
      case 'recent':
        query = query.order('published_at', { ascending: false })
        break
      case 'popular':
        query = query.order('views_count', { ascending: false })
        break
      default:
        query = query.order('win_rate', { ascending: false })
    }

    // Pagination
    query = query.range(offset, offset + limit - 1)

    const { data: listings, error, count } = await query

    if (error) {
      console.error('Marketplace query error:', error)
      // If table doesn't exist, fall through to standard systems fallback
      if (error.code === 'PGRST205' || error.message?.includes('schema cache')) {
        console.log('Marketplace table not found, using standard systems fallback')
        // Fall through to the standard systems fallback below
      } else {
        return NextResponse.json({ error: 'Failed to fetch listings' }, { status: 500 })
      }
    }

    // Transform data
    const transformedListings = (listings || []).map((listing: MarketplaceListing & { 
      profiles: { username: string; avatar_url: string } | null;
      user_systems: { sport: string; bet_type: string; criteria: string[] } | null;
    }) => ({
      ...listing,
      creator_username: listing.profiles?.username || 'Anonymous',
      creator_avatar: listing.profiles?.avatar_url,
      sport: listing.user_systems?.sport,
      bet_type: listing.user_systems?.bet_type,
      criteria: listing.user_systems?.criteria || [],
      // Don't expose internal references
      profiles: undefined,
      user_systems: undefined
    }))

    // Get user's interactions for liked/copied status
    let userInteractions: { listing_id: string; interaction_type: string }[] = []
    if (user) {
      const { data: interactions } = await supabase
        .from('marketplace_interactions')
        .select('listing_id, interaction_type')
        .eq('user_id', user.id)
        .in('listing_id', transformedListings.map((l: { id: string }) => l.id))

      userInteractions = interactions || []
    }

    // Add user interaction status to listings
    const listingsWithStatus = transformedListings.map((listing: MarketplaceListing) => ({
      ...listing,
      userLiked: userInteractions.some(i => i.listing_id === listing.id && i.interaction_type === 'like'),
      userCopied: userInteractions.some(i => i.listing_id === listing.id && i.interaction_type === 'copy')
    }))

    // If no database listings, return the standard systems as fallback
    let finalListings = listingsWithStatus
    if (finalListings.length === 0 && offset === 0) {
      // Convert standard systems to marketplace listing format
      const standardListings = STANDARD_BETTING_SYSTEMS
        .filter(sys => {
          if (sport && sport !== 'ALL' && sys.sport !== sport) return false
          if (betType && betType !== 'all' && sys.betType !== betType) return false
          if (minWinRate > 0 && sys.historicalRecord.winRate < minWinRate) return false
          if (search) {
            const q = search.toLowerCase()
            return sys.title.toLowerCase().includes(q) || sys.shortDescription.toLowerCase().includes(q)
          }
          return true
        })
        .map(sys => ({
          id: sys.id,
          system_id: sys.id,
          creator_id: MUSCHNICK_CREATOR.id,
          title: sys.title,
          short_description: sys.shortDescription,
          full_description: sys.fullDescription,
          tags: sys.tags,
          is_free: true,
          price_cents: 0,
          total_picks: sys.sampleSize,
          wins: sys.historicalRecord.wins,
          losses: sys.historicalRecord.losses,
          pushes: sys.historicalRecord.pushes,
          win_rate: sys.historicalRecord.winRate,
          roi: sys.historicalRecord.roi,
          avg_odds: -110,
          streak: 0,
          // Use 0 for stats until real tracking is implemented - NO FAKE DATA
          copies_count: 0,
          views_count: 0,
          likes_count: 0,
          status: 'published',
          is_featured: true,
          published_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          creator_username: MUSCHNICK_CREATOR.username,
          creator_avatar: MUSCHNICK_CREATOR.avatarUrl,
          sport: sys.sport,
          bet_type: sys.betType,
          criteria: sys.criteria,
          userLiked: false,
          userCopied: false
        }))
      
      // Sort standard listings
      standardListings.sort((a, b) => {
        switch (sortBy) {
          case 'winRate': return b.win_rate - a.win_rate
          case 'roi': return b.roi - a.roi
          case 'copies': return b.copies_count - a.copies_count
          default: return b.win_rate - a.win_rate
        }
      })
      
      finalListings = standardListings
    }

    return NextResponse.json({
      listings: finalListings,
      total: finalListings.length,
      limit,
      offset
    })

  } catch (error) {
    console.error('Marketplace API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Publish a system to marketplace
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
      system_id, 
      title, 
      short_description, 
      full_description,
      tags = []
    } = body

    // Validate required fields
    if (!system_id || !title || !short_description) {
      return NextResponse.json({ 
        error: 'Missing required fields: system_id, title, short_description' 
      }, { status: 400 })
    }

    // Verify system exists and belongs to user
    const { data: system, error: systemError } = await supabase
      .from('user_systems')
      .select('*, system_picks(*)')
      .eq('id', system_id)
      .eq('user_id', user.id)
      .single()

    if (systemError || !system) {
      return NextResponse.json({ error: 'System not found or access denied' }, { status: 404 })
    }

    // Check if already listed
    const { data: existingListing } = await supabase
      .from('marketplace_listings')
      .select('id')
      .eq('system_id', system_id)
      .single()

    if (existingListing) {
      return NextResponse.json({ error: 'System is already listed on the marketplace' }, { status: 400 })
    }

    // Calculate stats from picks
    const picks = system.system_picks || []
    const settledPicks = picks.filter((p: { result: string }) => p.result && p.result !== 'pending')
    const wins = settledPicks.filter((p: { result: string }) => p.result === 'win').length
    const losses = settledPicks.filter((p: { result: string }) => p.result === 'loss').length
    const pushes = settledPicks.filter((p: { result: string }) => p.result === 'push').length
    const totalPicks = wins + losses + pushes
    const winRate = (wins + losses) > 0 ? (wins / (wins + losses)) * 100 : 0

    // Quality gate check
    if (totalPicks < 5) {
      return NextResponse.json({ 
        error: `Quality requirement not met: Need at least 5 tracked picks (you have ${totalPicks})`,
        requirements: {
          minPicks: 5,
          currentPicks: totalPicks,
          minWinRate: 52,
          currentWinRate: winRate.toFixed(1)
        }
      }, { status: 400 })
    }

    if (winRate < 52) {
      return NextResponse.json({ 
        error: `Quality requirement not met: Win rate must be at least 52% (you have ${winRate.toFixed(1)}%)`,
        requirements: {
          minPicks: 5,
          currentPicks: totalPicks,
          minWinRate: 52,
          currentWinRate: winRate.toFixed(1)
        }
      }, { status: 400 })
    }

    // Create listing
    const { data: listing, error: createError } = await supabase
      .from('marketplace_listings')
      .insert({
        system_id,
        creator_id: user.id,
        title,
        short_description,
        full_description,
        tags,
        total_picks: totalPicks,
        wins,
        losses,
        pushes,
        win_rate: winRate,
        roi: system.stats?.roi || 0,
        avg_odds: system.stats?.avgOdds || -110,
        status: 'active',
        published_at: new Date().toISOString()
      })
      .select()
      .single()

    if (createError) {
      console.error('Create listing error:', createError)
      return NextResponse.json({ error: 'Failed to create listing' }, { status: 500 })
    }

    // Update system to be public
    await supabase
      .from('user_systems')
      .update({ is_public: true })
      .eq('id', system_id)

    return NextResponse.json({ listing }, { status: 201 })

  } catch (error) {
    console.error('Marketplace POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
