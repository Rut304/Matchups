/**
 * Leaderboard Service - Fetches real capper data from Supabase
 * NO MOCK DATA - returns empty array if database unavailable
 */

import { createClient } from '@/lib/supabase/client'
import { LeaderboardEntry, Capper, CapperStats, BetType, Sport, CapperType, Network } from '@/types/leaderboard'

// Re-export types
export type { LeaderboardEntry, Capper, CapperStats, BetType, Sport, CapperType, Network }

interface LeaderboardFilters {
  capperType?: CapperType | 'all'
  sport?: Sport
  betType?: BetType
  sortBy?: 'units' | 'winPct' | 'roi' | 'picks' | 'record' | 'streak'
  daysBack?: number | null
  limit?: number
}

interface CapperWithStats {
  id: string
  slug: string
  name: string
  avatar_emoji: string
  avatar_url?: string
  verified: boolean
  capper_type: CapperType
  network?: string
  role?: string
  followers_count?: string
  is_active: boolean
  capper_stats: {
    sport: string
    wins: number
    losses: number
    pushes: number
    units: number
    roi: number
  }[]
  picks: {
    id: string
    result: string
    created_at: string
    pick_description: string
  }[]
}

/**
 * Check if Supabase is configured
 */
function isSupabaseConfigured(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL && 
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
}

/**
 * Fetch leaderboard entries from Supabase
 */
export async function fetchLeaderboardEntries(filters: LeaderboardFilters = {}): Promise<LeaderboardEntry[]> {
  const {
    capperType = 'all',
    sport,
    sortBy = 'units',
    daysBack = null,
    limit = 100
  } = filters

  // If Supabase not configured, return empty array (no mock data)
  if (!isSupabaseConfigured()) {
    console.warn('Supabase not configured - returning empty array (no mock data)')
    return []
  }

  try {
    const supabase = createClient()
    
    // Build query
    let query = supabase
      .from('cappers')
      .select(`
        id,
        slug,
        name,
        avatar_emoji,
        avatar_url,
        verified,
        capper_type,
        network,
        role,
        followers_count,
        is_active,
        capper_stats (
          sport,
          wins,
          losses,
          pushes,
          units,
          roi
        ),
        picks (
          id,
          result,
          created_at,
          pick_description
        )
      `)
      .eq('is_active', true)

    // Filter by capper type
    if (capperType !== 'all') {
      query = query.eq('capper_type', capperType)
    }

    const { data: cappers, error } = await query.limit(limit)

    if (error) {
      console.error('Supabase leaderboard query error:', error)
      return []
    }

    if (!cappers || cappers.length === 0) {
      console.log('No cappers found in Supabase - tables may be empty')
      return []
    }

    // Transform to LeaderboardEntry format
    const entries: LeaderboardEntry[] = (cappers as unknown as CapperWithStats[]).map((capper, index) => {
      // Aggregate stats
      const stats = capper.capper_stats || []
      const filteredStats = sport 
        ? stats.filter(s => s.sport === sport)
        : stats

      const totals = filteredStats.reduce(
        (acc, s) => ({
          wins: acc.wins + (s.wins || 0),
          losses: acc.losses + (s.losses || 0),
          pushes: acc.pushes + (s.pushes || 0),
          units: acc.units + (s.units || 0),
        }),
        { wins: 0, losses: 0, pushes: 0, units: 0 }
      )

      const totalPicks = totals.wins + totals.losses + totals.pushes
      const winPct = totalPicks > 0 ? (totals.wins / totalPicks) * 100 : 0
      const roi = totalPicks > 0 ? (totals.units / totalPicks) * 100 : 0

      // Get recent picks for streak calculation
      const picks = capper.picks || []
      const sortedPicks = [...picks].sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
      
      // Filter by daysBack if specified
      const cutoffDate = daysBack 
        ? new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000)
        : null
      
      const filteredPicks = cutoffDate
        ? sortedPicks.filter(p => new Date(p.created_at) >= cutoffDate)
        : sortedPicks

      // Calculate streak
      let streak = 'N/A'
      if (filteredPicks.length > 0) {
        const firstResult = filteredPicks[0].result
        let count = 0
        for (const pick of filteredPicks) {
          if (pick.result === firstResult) {
            count++
          } else {
            break
          }
        }
        if (firstResult === 'win') streak = `W${count}`
        else if (firstResult === 'loss') streak = `L${count}`
      }

      // Get last pick
      const lastPick = filteredPicks[0]

      return {
        id: capper.id,
        slug: capper.slug,
        name: capper.name,
        avatarEmoji: capper.avatar_emoji || '🎯',
        avatarUrl: capper.avatar_url,
        verified: capper.verified,
        capperType: capper.capper_type as CapperType,
        network: capper.network as Network | undefined,
        role: capper.role,
        followersCount: capper.followers_count,
        record: `${totals.wins}-${totals.losses}`,
        winPct,
        units: totals.units,
        roi,
        streak,
        rank: index + 1,
        rankChange: 0, // Would need historical data
        lastPick: lastPick?.pick_description,
        lastPickResult: lastPick?.result as 'win' | 'loss' | 'push' | undefined,
        totalPicks,
        foreverRecord: `${totals.wins}-${totals.losses}`, // Same for now, could be computed differently
      }
    })

    // Sort entries
    const sorted = [...entries].sort((a, b) => {
      switch (sortBy) {
        case 'winPct': return b.winPct - a.winPct
        case 'roi': return b.roi - a.roi
        case 'picks': return (b.totalPicks || 0) - (a.totalPicks || 0)
        case 'record': {
          const aWins = parseInt(a.record.split('-')[0]) || 0
          const bWins = parseInt(b.record.split('-')[0]) || 0
          return bWins - aWins
        }
        case 'streak': {
          const getStreakValue = (streak: string) => {
            if (!streak || streak === 'N/A') return 0
            const num = parseInt(streak.slice(1)) || 0
            return streak.startsWith('W') ? num : -num
          }
          return getStreakValue(b.streak) - getStreakValue(a.streak)
        }
        default: return b.units - a.units
      }
    })

    // Update ranks
    sorted.forEach((e, i) => { e.rank = i + 1 })

    return sorted
  } catch (error) {
    console.error('Error fetching leaderboard from Supabase:', error)
    return []
  }
}

/**
 * Fetch a single capper by slug
 */
export async function fetchCapperBySlug(slug: string): Promise<Capper | null> {
  if (!isSupabaseConfigured()) {
    return null
  }

  try {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('cappers')
      .select('*')
      .eq('slug', slug)
      .single()

    if (error || !data) {
      return null
    }

    return {
      id: data.id,
      slug: data.slug,
      name: data.name,
      avatarEmoji: data.avatar_emoji || '🎯',
      avatarUrl: data.avatar_url,
      verified: data.verified,
      capperType: data.capper_type,
      network: data.network,
      role: data.role,
      twitterHandle: data.twitter_handle,
      followersCount: data.followers_count,
      isActive: data.is_active,
      isFeatured: data.is_featured,
      bio: data.bio,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    }
  } catch (error) {
    console.error('Error fetching capper:', error)
    return null
  }
}

/**
 * Check if we have real data in Supabase
 */
export async function hasRealData(): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    return false
  }

  try {
    const supabase = createClient()
    const { count, error } = await supabase
      .from('cappers')
      .select('*', { count: 'exact', head: true })

    if (error) {
      return false
    }

    return (count || 0) > 0
  } catch {
    return false
  }
}
