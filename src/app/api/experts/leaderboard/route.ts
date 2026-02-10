/**
 * Expert Leaderboard API
 * 
 * Provides aggregated expert performance data filterable by:
 * - Sport (NFL, NBA, MLB, NHL, CFB, CBB)
 * - Time period (daily, weekly, monthly, yearly, all_time, season)
 * - Bet type (spread, moneyline, total, prop)
 * 
 * GET /api/experts/leaderboard
 * Query params:
 * - sport: Filter by sport
 * - period: daily | weekly | monthly | yearly | all_time | season
 * - year: Specific year (e.g., 2025)
 * - month: Specific month (1-12)
 * - bet_type: Filter by bet type
 * - limit: Number of results (default 50)
 * - sort: units | win_pct | roi | picks (default: units)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

interface LeaderboardEntry {
  rank: number
  expert_id: string
  name: string
  network: string
  twitter_handle: string | null
  avatar_url: string | null
  sport: string | null
  period: string
  wins: number
  losses: number
  pushes: number
  total_picks: number
  win_pct: number
  units_won: number
  units_wagered: number
  roi: number
  current_streak: number
  best_streak: number
  avg_odds: number | null
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  
  // Parse query parameters
  const sport = searchParams.get('sport')?.toUpperCase()
  const period = searchParams.get('period') || 'all_time'
  const year = searchParams.get('year') ? parseInt(searchParams.get('year')!) : null
  const month = searchParams.get('month') ? parseInt(searchParams.get('month')!) : null
  const betType = searchParams.get('bet_type')
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
  const sortBy = searchParams.get('sort') || 'units'
  
  const supabase = getSupabase()
  
  try {
    // Calculate date range based on period
    const now = new Date()
    let periodStart: string
    let periodEnd: string = now.toISOString().split('T')[0]
    let periodType = period
    
    switch (period) {
      case 'daily':
        periodStart = periodEnd
        break
      case 'weekly':
        const weekAgo = new Date(now)
        weekAgo.setDate(weekAgo.getDate() - 7)
        periodStart = weekAgo.toISOString().split('T')[0]
        break
      case 'monthly':
        if (year && month) {
          periodStart = `${year}-${String(month).padStart(2, '0')}-01`
          const lastDay = new Date(year, month, 0).getDate()
          periodEnd = `${year}-${String(month).padStart(2, '0')}-${lastDay}`
        } else {
          const monthAgo = new Date(now)
          monthAgo.setMonth(monthAgo.getMonth() - 1)
          periodStart = monthAgo.toISOString().split('T')[0]
        }
        break
      case 'yearly':
        if (year) {
          periodStart = `${year}-01-01`
          periodEnd = `${year}-12-31`
        } else {
          periodStart = `${now.getFullYear()}-01-01`
        }
        break
      case 'season':
        // NFL/CFB season: Sept-Feb, NBA/NHL: Oct-June, MLB: Apr-Oct
        // Use current season logic
        const currentYear = now.getFullYear()
        const currentMonth = now.getMonth() + 1
        if (sport === 'NFL' || sport === 'CFB') {
          periodStart = currentMonth >= 9 ? `${currentYear}-09-01` : `${currentYear - 1}-09-01`
          periodEnd = currentMonth >= 9 ? `${currentYear + 1}-02-28` : `${currentYear}-02-28`
        } else if (sport === 'NBA' || sport === 'NHL') {
          periodStart = currentMonth >= 10 ? `${currentYear}-10-01` : `${currentYear - 1}-10-01`
          periodEnd = currentMonth >= 10 ? `${currentYear + 1}-06-30` : `${currentYear}-06-30`
        } else if (sport === 'MLB') {
          periodStart = `${currentYear}-04-01`
          periodEnd = `${currentYear}-10-31`
        } else {
          periodStart = '2020-01-01'  // All time fallback
          periodType = 'all_time'
        }
        break
      default:
        periodStart = '2020-01-01'
        periodType = 'all_time'
    }
    
    // First check if we have pre-computed stats
    let query = supabase
      .from('expert_stats')
      .select(`
        expert_id,
        wins,
        losses,
        pushes,
        total_picks,
        win_pct,
        units_won,
        units_wagered,
        roi,
        current_streak,
        longest_win_streak,
        avg_odds
      `)
      .eq('period_type', periodType)
    
    if (sport) {
      query = query.eq('sport', sport)
    } else {
      query = query.is('sport', null)
    }
    
    if (betType) {
      query = query.eq('bet_type', betType)
    } else {
      query = query.is('bet_type', null)
    }
    
    // Apply sorting
    const sortColumn = sortBy === 'win_pct' ? 'win_pct' 
                     : sortBy === 'roi' ? 'roi'
                     : sortBy === 'picks' ? 'total_picks'
                     : 'units_won'
    
    query = query.order(sortColumn, { ascending: false }).limit(limit)
    
    let { data: statsData, error: statsError } = await query
    
    // If no pre-computed stats, calculate from picks
    if (statsError || !statsData || statsData.length === 0) {
      console.log('[Leaderboard] No cached stats, calculating from picks...')
      
      // Direct calculation from expert_picks
      let picksQuery = supabase
        .from('expert_picks')
        .select(`
          expert_id,
          result,
          stake,
          payout
        `)
        .in('result', ['win', 'loss', 'push', 'won', 'lost'])
        .gte('picked_at', periodStart)
        .lte('picked_at', periodEnd)
      
      if (sport) {
        picksQuery = picksQuery.eq('sport', sport)
      }
      
      if (betType) {
        picksQuery = picksQuery.eq('pick_type', betType)
      }
      
      const { data: picksData, error: picksError } = await picksQuery
      
      if (picksError) {
        return NextResponse.json({ error: picksError.message }, { status: 500 })
      }
      
      // Aggregate by expert
      const expertStats = new Map<string, {
        wins: number
        losses: number
        pushes: number
        unitsWagered: number
        unitsWon: number
      }>()
      
      for (const pick of picksData || []) {
        const expertId = pick.expert_id
        if (!expertId) continue
        
        if (!expertStats.has(expertId)) {
          expertStats.set(expertId, { wins: 0, losses: 0, pushes: 0, unitsWagered: 0, unitsWon: 0 })
        }
        
        const stats = expertStats.get(expertId)!
        const stake = pick.stake || 1
        
        if (pick.result === 'win' || pick.result === 'won') {
          stats.wins++
          stats.unitsWon += (pick.payout || stake)
        } else if (pick.result === 'loss' || pick.result === 'lost') {
          stats.losses++
          stats.unitsWon -= stake
        } else {
          stats.pushes++
        }
        stats.unitsWagered += stake
      }
      
      // Convert to array and get profile info
      const expertIds = [...expertStats.keys()]
      
      if (expertIds.length === 0) {
        return NextResponse.json({
          leaderboard: [],
          meta: {
            sport: sport || 'all',
            period: periodType,
            periodStart,
            periodEnd,
            total: 0
          }
        })
      }
      
      const { data: profiles } = await supabase
        .from('expert_profiles')
        .select('id, name, slug, network, twitter_handle, avatar_url')
        .in('id', expertIds)
      
      const profileMap = new Map((profiles || []).map(p => [p.id, p]))
      
      statsData = expertIds.map(id => {
        const stats = expertStats.get(id)!
        const total = stats.wins + stats.losses
        return {
          expert_id: id,
          wins: stats.wins,
          losses: stats.losses,
          pushes: stats.pushes,
          total_picks: total + stats.pushes,
          win_pct: total > 0 ? Math.round(stats.wins / total * 10000) / 100 : 0,
          units_won: Math.round(stats.unitsWon * 100) / 100,
          units_wagered: stats.unitsWagered,
          roi: stats.unitsWagered > 0 ? Math.round(stats.unitsWon / stats.unitsWagered * 10000) / 100 : 0,
          current_streak: 0,
          longest_win_streak: 0,
          avg_odds: null
        }
      })
      
      // Sort by sort column
      statsData.sort((a, b) => {
        const aVal = sortBy === 'win_pct' ? a.win_pct 
                   : sortBy === 'roi' ? a.roi
                   : sortBy === 'picks' ? a.total_picks
                   : a.units_won
        const bVal = sortBy === 'win_pct' ? b.win_pct 
                   : sortBy === 'roi' ? b.roi
                   : sortBy === 'picks' ? b.total_picks
                   : b.units_won
        return bVal - aVal
      })
      
      statsData = statsData.slice(0, limit)
    }
    
    // Get expert profile details
    const expertIds = statsData.map(s => s.expert_id).filter(Boolean)
    
    const { data: profiles } = await supabase
      .from('expert_profiles')
      .select('id, name, slug, network, twitter_handle, avatar_url')
      .in('id', expertIds)
    
    // Also try to match by slug (from betting-experts.ts)
    const { data: profilesBySlug } = await supabase
      .from('expert_profiles')
      .select('id, name, slug, network, twitter_handle, avatar_url')
      .in('slug', expertIds)
    
    const profileMap = new Map([
      ...(profiles || []).map(p => [p.id, p] as const),
      ...(profilesBySlug || []).map(p => [p.slug, p] as const)
    ])
    
    // Build leaderboard
    const leaderboard: LeaderboardEntry[] = statsData.map((stats, index) => {
      const profile = profileMap.get(stats.expert_id)
      
      return {
        rank: index + 1,
        expert_id: stats.expert_id,
        name: profile?.name || stats.expert_id,
        network: profile?.network || 'Unknown',
        twitter_handle: profile?.twitter_handle || null,
        avatar_url: profile?.avatar_url || null,
        sport: sport || null,
        period: periodType,
        wins: stats.wins,
        losses: stats.losses,
        pushes: stats.pushes,
        total_picks: stats.total_picks,
        win_pct: stats.win_pct,
        units_won: stats.units_won,
        units_wagered: stats.units_wagered,
        roi: stats.roi,
        current_streak: stats.current_streak || 0,
        best_streak: stats.longest_win_streak || 0,
        avg_odds: stats.avg_odds
      }
    })
    
    return NextResponse.json({
      leaderboard,
      meta: {
        sport: sport || 'all',
        period: periodType,
        periodStart,
        periodEnd,
        sortBy,
        total: leaderboard.length
      }
    })
    
  } catch (err) {
    console.error('[Leaderboard] Error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
