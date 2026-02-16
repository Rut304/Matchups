/**
 * Team ATS Data API
 * GET /api/teams/ats?team=KC&sport=NFL
 * Returns comprehensive ATS splits from historical_games
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const dynamic = 'force-dynamic'

interface ATSSplit {
  label: string
  wins: number
  losses: number
  pushes: number
  pct: number
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const team = searchParams.get('team')?.toUpperCase()
  const sport = searchParams.get('sport')?.toLowerCase() || 'nfl'
  
  if (!team) {
    return NextResponse.json({ error: 'team parameter required' }, { status: 400 })
  }
  
  try {
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    // Calculate proper season year
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth() + 1
    
    let seasonYear: number
    if (sport === 'nfl' || sport === 'ncaaf') {
      seasonYear = currentMonth <= 2 ? currentYear - 1 : currentYear
    } else if (sport === 'nba' || sport === 'nhl' || sport === 'ncaab') {
      seasonYear = currentMonth <= 6 ? currentYear - 1 : currentYear
    } else {
      seasonYear = currentYear
    }
    
    // Fetch home games
    const { data: homeGames } = await supabase
      .from('historical_games')
      .select('spread_result, total_result, point_spread, home_score, away_score, game_date')
      .eq('sport', sport)
      .eq('season', seasonYear)
      .ilike('home_team_abbr', team)
      .not('spread_result', 'is', null)
      .order('game_date', { ascending: false })
    
    // Fetch away games
    const { data: awayGames } = await supabase
      .from('historical_games')
      .select('spread_result, total_result, point_spread, home_score, away_score, game_date')
      .eq('sport', sport)
      .eq('season', seasonYear)
      .ilike('away_team_abbr', team)
      .not('spread_result', 'is', null)
      .order('game_date', { ascending: false })
    
    // Helper to calc splits
    function calcSplit(games: typeof homeGames, isHome: boolean): ATSSplit {
      let w = 0, l = 0, p = 0
      for (const g of (games || [])) {
        const coverResult = isHome ? 'home_cover' : 'away_cover'
        const loseResult = isHome ? 'away_cover' : 'home_cover'
        if (g.spread_result === coverResult) w++
        else if (g.spread_result === loseResult) l++
        else if (g.spread_result === 'push') p++
      }
      const total = w + l
      return { label: '', wins: w, losses: l, pushes: p, pct: total > 0 ? Math.round((w / total) * 1000) / 10 : 0 }
    }
    
    // Overall ATS
    const homeATS = calcSplit(homeGames, true)
    const awayATS = calcSplit(awayGames, false)
    const overall: ATSSplit = {
      label: 'Overall',
      wins: homeATS.wins + awayATS.wins,
      losses: homeATS.losses + awayATS.losses,
      pushes: homeATS.pushes + awayATS.pushes,
      pct: 0
    }
    const ot = overall.wins + overall.losses
    overall.pct = ot > 0 ? Math.round((overall.wins / ot) * 1000) / 10 : 0
    
    // Home only
    const homeSplit: ATSSplit = { ...homeATS, label: 'Home' }
    
    // Away only
    const awaySplit: ATSSplit = { ...awayATS, label: 'Away' }
    
    // As Favorite (point_spread < 0 means home is favorite for home games, > 0 means away is fav for away games)
    const favHomeGames = (homeGames || []).filter(g => g.point_spread !== null && g.point_spread < 0)
    const favAwayGames = (awayGames || []).filter(g => g.point_spread !== null && g.point_spread > 0)
    const favHome = calcSplit(favHomeGames, true)
    const favAway = calcSplit(favAwayGames, false)
    const favSplit: ATSSplit = {
      label: 'As Favorite',
      wins: favHome.wins + favAway.wins,
      losses: favHome.losses + favAway.losses,
      pushes: favHome.pushes + favAway.pushes,
      pct: 0
    }
    const ft = favSplit.wins + favSplit.losses
    favSplit.pct = ft > 0 ? Math.round((favSplit.wins / ft) * 1000) / 10 : 0
    
    // As Underdog
    const dogHomeGames = (homeGames || []).filter(g => g.point_spread !== null && g.point_spread > 0)
    const dogAwayGames = (awayGames || []).filter(g => g.point_spread !== null && g.point_spread < 0)
    const dogHome = calcSplit(dogHomeGames, true)
    const dogAway = calcSplit(dogAwayGames, false)
    const dogSplit: ATSSplit = {
      label: 'As Underdog',
      wins: dogHome.wins + dogAway.wins,
      losses: dogHome.losses + dogAway.losses,
      pushes: dogHome.pushes + dogAway.pushes,
      pct: 0
    }
    const dt = dogSplit.wins + dogSplit.losses
    dogSplit.pct = dt > 0 ? Math.round((dogSplit.wins / dt) * 1000) / 10 : 0
    
    // Last 10 games
    const allGames = [
      ...(homeGames || []).map(g => ({ ...g, isHome: true })),
      ...(awayGames || []).map(g => ({ ...g, isHome: false }))
    ].sort((a, b) => new Date(b.game_date).getTime() - new Date(a.game_date).getTime()).slice(0, 10)
    
    let l10w = 0, l10l = 0, l10p = 0
    for (const g of allGames) {
      const coverResult = g.isHome ? 'home_cover' : 'away_cover'
      const loseResult = g.isHome ? 'away_cover' : 'home_cover'
      if (g.spread_result === coverResult) l10w++
      else if (g.spread_result === loseResult) l10l++
      else if (g.spread_result === 'push') l10p++
    }
    const l10t = l10w + l10l
    const last10Split: ATSSplit = {
      label: 'Last 10',
      wins: l10w,
      losses: l10l,
      pushes: l10p,
      pct: l10t > 0 ? Math.round((l10w / l10t) * 1000) / 10 : 0
    }
    
    // O/U splits
    let ouOverall = { over: 0, under: 0, push: 0 }
    for (const g of (homeGames || [])) {
      if (g.total_result === 'over') ouOverall.over++
      else if (g.total_result === 'under') ouOverall.under++
      else if (g.total_result === 'push') ouOverall.push++
    }
    for (const g of (awayGames || [])) {
      if (g.total_result === 'over') ouOverall.over++
      else if (g.total_result === 'under') ouOverall.under++
      else if (g.total_result === 'push') ouOverall.push++
    }
    const ouTotal = ouOverall.over + ouOverall.under
    
    return NextResponse.json({
      team,
      sport,
      season: seasonYear,
      atsSplits: [overall, homeSplit, awaySplit, favSplit, dogSplit, last10Split],
      ouRecord: {
        over: ouOverall.over,
        under: ouOverall.under,
        push: ouOverall.push,
        pct: ouTotal > 0 ? Math.round((ouOverall.over / ouTotal) * 1000) / 10 : 0
      },
      totalGames: (homeGames?.length || 0) + (awayGames?.length || 0)
    })
  } catch (error) {
    console.error('ATS API error:', error)
    return NextResponse.json({ error: 'Failed to fetch ATS data' }, { status: 500 })
  }
}
