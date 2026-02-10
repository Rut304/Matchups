/**
 * Leaderboard Service - Fetches real expert data from Supabase
 * Uses tracked_experts, tracked_picks, and tracked_expert_stats tables
 * NO MOCK DATA - returns empty array if database unavailable
 */

import { createClient } from '@/lib/supabase/client'
import { LeaderboardEntry, Capper, CapperStats, BetType, Sport, CapperType, Network } from '@/types/leaderboard'

// Re-export types
export type { LeaderboardEntry, Capper, CapperStats, BetType, Sport, CapperType, Network }

// Database row types
interface TrackedExpertStat {
  expert_slug: string
  sport?: string | null
  period_type: string
  wins: number
  losses: number
  pushes: number
  total_picks: number
  win_pct: number
  units_won: number
  roi: number
}

interface LeaderboardFilters {
  capperType?: CapperType | 'all'
  sport?: Sport
  betType?: BetType
  sortBy?: 'units' | 'winPct' | 'roi' | 'picks' | 'record' | 'streak'
  daysBack?: number | null
  limit?: number
}

// Map expert_type from DB to CapperType
const expertTypeToCapperType: Record<string, CapperType> = {
  tv: 'celebrity',
  radio: 'celebrity',
  podcast: 'celebrity',
  sharp: 'pro',
  writer: 'pro',
  social: 'community',
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
 * Fetch leaderboard entries from Supabase using tracked_experts tables
 */
export async function fetchLeaderboardEntries(filters: LeaderboardFilters = {}): Promise<LeaderboardEntry[]> {
  const {
    capperType = 'all',
    sport,
    sortBy = 'units',
    daysBack = null,
    limit = 100
  } = filters

  if (!isSupabaseConfigured()) {
    console.warn('[Leaderboard] Supabase not configured')
    return []
  }

  try {
    const supabase = createClient()
    
    // Fetch experts with their stats
    let query = supabase
      .from('tracked_experts')
      .select(`
        id,
        slug,
        name,
        x_handle,
        network,
        shows,
        sports,
        expert_type,
        priority,
        headshot_url,
        is_active
      `)
      .eq('is_active', true)
      .order('priority', { ascending: false })
      .limit(limit)

    const { data: experts, error: expertsError } = await query

    if (expertsError) {
      console.error('[Leaderboard] Query error:', expertsError)
      return []
    }

    if (!experts || experts.length === 0) {
      console.log('[Leaderboard] No tracked experts found')
      return []
    }

    // Fetch stats for all experts
    const expertSlugs = experts.map((e: { slug: string }) => e.slug)
    
    // Get all-time stats OR sport-specific stats
    const { data: stats } = await supabase
      .from('tracked_expert_stats')
      .select('*')
      .in('expert_slug', expertSlugs)
      .eq('period_type', 'all_time')

    // Create a map of stats by expert slug
    const statsMap = new Map<string, TrackedExpertStat>()
    if (stats) {
      for (const stat of stats as TrackedExpertStat[]) {
        // If filtering by sport, only use that sport's stats
        if (sport && stat.sport === sport) {
          statsMap.set(stat.expert_slug, stat)
        } else if (!sport && !stat.sport) {
          // All sports combined
          statsMap.set(stat.expert_slug, stat)
        }
      }
    }

    // Fetch recent picks for streak calculation
    const { data: recentPicks } = await supabase
      .from('tracked_picks')
      .select('expert_slug, status, pick_date')
      .in('expert_slug', expertSlugs)
      .in('status', ['won', 'lost', 'push'])
      .order('pick_date', { ascending: false })
      .limit(500)

    // Calculate streaks from recent picks
    const streakMap = new Map<string, string>()
    if (recentPicks) {
      const picksByExpert = new Map<string, typeof recentPicks>()
      for (const pick of recentPicks) {
        const existing = picksByExpert.get(pick.expert_slug) || []
        existing.push(pick)
        picksByExpert.set(pick.expert_slug, existing)
      }

      for (const [slug, picks] of picksByExpert) {
        if (picks.length === 0) continue
        const firstResult = picks[0].status
        let count = 0
        for (const pick of picks) {
          if (pick.status === firstResult) count++
          else break
        }
        if (firstResult === 'won') streakMap.set(slug, `W${count}`)
        else if (firstResult === 'lost') streakMap.set(slug, `L${count}`)
        else streakMap.set(slug, 'P1')
      }
    }

    // Transform to LeaderboardEntry format
    const entries: LeaderboardEntry[] = experts.map((expert: any, index: number): LeaderboardEntry | null => {
      const stat = statsMap.get(expert.slug)
      const capType = expertTypeToCapperType[expert.expert_type] || 'community'
      
      // Filter by capper type if specified
      if (capperType !== 'all' && capType !== capperType) {
        return null
      }

      const wins = stat?.wins || 0
      const losses = stat?.losses || 0
      const pushes = stat?.pushes || 0
      const totalPicks = stat?.total_picks || 0
      const winPct = stat?.win_pct || 0
      const units = stat?.units_won || 0
      const roi = stat?.roi || 0
      const streak = streakMap.get(expert.slug) || 'N/A'

      return {
        id: expert.id,
        slug: expert.slug,
        name: expert.name,
        avatarEmoji: getNetworkEmoji(expert.network),
        avatarUrl: expert.headshot_url,
        verified: true,
        capperType: capType,
        network: expert.network as Network | undefined,
        role: expert.shows?.[0] || expert.expert_type,
        followersCount: undefined,
        record: `${wins}-${losses}`,
        winPct,
        units,
        roi,
        streak,
        rank: index + 1,
        rankChange: 0,
        lastPick: undefined,
        lastPickResult: undefined,
        totalPicks,
        foreverRecord: `${wins}-${losses}`,
        xHandle: expert.x_handle,
      }
    }).filter(Boolean) as LeaderboardEntry[]

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
    console.error('[Leaderboard] Error:', error)
    return []
  }
}

/**
 * Get emoji based on network
 */
function getNetworkEmoji(network: string | null): string {
  if (!network) return '🎯'
  const networkEmojis: Record<string, string> = {
    'ESPN': '📺',
    'FS1': '🎤',
    'FOX': '🦊',
    'TNT': '🏆',
    'CBS': '👁️',
    'NBC': '🦚',
    'The Ringer': '🏀',
    'Barstool': '🍕',
    'Action Network': '📊',
    'Twitter': '𝕏',
    'Podcast': '🎙️',
    'Independent': '💰',
    'Sharp Football': '📈',
  }
  return networkEmojis[network] || '🎯'
}

/**
 * Fetch a single expert by slug
 */
export async function fetchCapperBySlug(slug: string): Promise<Capper | null> {
  if (!isSupabaseConfigured()) return null

  try {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('tracked_experts')
      .select('*')
      .eq('slug', slug)
      .single()

    if (error || !data) return null

    return {
      id: data.id,
      slug: data.slug,
      name: data.name,
      avatarEmoji: getNetworkEmoji(data.network),
      avatarUrl: data.headshot_url,
      verified: true,
      capperType: expertTypeToCapperType[data.expert_type] || 'community',
      network: data.network,
      role: data.shows?.[0] || data.expert_type,
      twitterHandle: data.x_handle,
      followersCount: undefined,
      isActive: data.is_active,
      isFeatured: data.priority >= 4,
      bio: undefined,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    }
  } catch (error) {
    console.error('[Leaderboard] fetchCapperBySlug error:', error)
    return null
  }
}

/**
 * Fetch expert stats history
 */
export async function fetchExpertStats(slug: string, periodType: string = 'all_time'): Promise<any | null> {
  if (!isSupabaseConfigured()) return null

  try {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('tracked_expert_stats')
      .select('*')
      .eq('expert_slug', slug)
      .eq('period_type', periodType)
      .is('sport', null)
      .single()

    if (error || !data) return null

    return {
      wins: data.wins || 0,
      losses: data.losses || 0,
      pushes: data.pushes || 0,
      units: data.units_won || 0,
      winPct: data.win_pct || 0,
      roi: data.roi || 0,
      currentStreak: data.current_streak || 0,
      longestWinStreak: data.longest_win_streak || 0,
      longestLoseStreak: data.longest_lose_streak || 0,
    }
  } catch (error) {
    console.error('[Leaderboard] fetchExpertStats error:', error)
    return null
  }
}

/**
 * Fetch recent picks for an expert
 */
export async function fetchExpertPicks(slug: string, limit: number = 20) {
  if (!isSupabaseConfigured()) return []

  try {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('tracked_picks')
      .select('*')
      .eq('expert_slug', slug)
      .order('pick_date', { ascending: false })
      .limit(limit)

    if (error) return []
    return data || []
  } catch (error) {
    console.error('[Leaderboard] fetchExpertPicks error:', error)
    return []
  }
}

/**
 * Check if we have real data
 */
export async function hasRealData(): Promise<boolean> {
  if (!isSupabaseConfigured()) return false

  try {
    const supabase = createClient()
    const { count, error } = await supabase
      .from('tracked_experts')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)

    if (error) return false
    return (count || 0) > 0
  } catch {
    return false
  }
}

/**
 * DEPRECATED - Kept for backwards compatibility, returns empty data
 */
export function getLeaderboardEntries(): LeaderboardEntry[] {
  console.warn('[DEPRECATED] getLeaderboardEntries() is synchronous and returns nothing. Use fetchLeaderboardEntries() instead.')
  return []
}

export function getHallOfShame(): LeaderboardEntry[] {
  console.warn('[DEPRECATED] getHallOfShame() is deprecated. Use fetchLeaderboardEntries with sortBy filter.')
  return []
}

export function getHallOfGlory(): LeaderboardEntry[] {
  console.warn('[DEPRECATED] getHallOfGlory() is deprecated. Use fetchLeaderboardEntries with sortBy filter.')
  return []
}

export const capperStats: Record<string, CapperStats> = {}
