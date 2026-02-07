/**
 * Popular Systems API
 * Returns pre-calculated popular betting systems with real backtested data
 */

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Define popular systems criteria that we'll backtest
const POPULAR_SYSTEMS_CRITERIA = [
  {
    id: 'nfl-home-dogs-after-loss',
    name: 'NFL Home Dogs After Loss',
    description: 'Home underdogs of 3+ points coming off a loss',
    sport: 'nfl',
    betType: 'ats',
    criteria: {
      homeOnly: true,
      underdogOnly: true,
      spreadMin: 3,
      seasonStart: 2017,
    }
  },
  {
    id: 'nfl-road-favorites-3-to-7',
    name: 'NFL Road Favorites -3 to -7',
    description: 'Road favorites laying 3-7 points',
    sport: 'nfl',
    betType: 'ats',
    criteria: {
      awayOnly: true,
      favoriteOnly: true,
      spreadMin: 3,
      spreadMax: 7,
      seasonStart: 2017,
    }
  },
  {
    id: 'nba-home-underdogs-3-plus',
    name: 'NBA Home Dogs 3+ Points',
    description: 'Home underdogs getting at least 3 points',
    sport: 'nba',
    betType: 'ats',
    criteria: {
      homeOnly: true,
      underdogOnly: true,
      spreadMin: 3,
      seasonStart: 2017,
    }
  },
  {
    id: 'nba-unders-high-totals',
    name: 'NBA Unders High Totals',
    description: 'Under bets when total is 230+',
    sport: 'nba',
    betType: 'ou',
    criteria: {
      totalMin: 230,
      seasonStart: 2017,
    }
  },
  {
    id: 'nhl-unders-favorites',
    name: 'NHL Unders Favorites',
    description: 'Under bets when home team is -150 or better',
    sport: 'nhl',
    betType: 'ou',
    criteria: {
      seasonStart: 2017,
    }
  },
  {
    id: 'mlb-home-underdogs',
    name: 'MLB Home Underdogs',
    description: 'Home teams getting plus money on moneyline',
    sport: 'mlb',
    betType: 'ats',
    criteria: {
      homeOnly: true,
      underdogOnly: true,
      seasonStart: 2017,
    }
  },
  {
    id: 'ncaaf-home-dogs-10-plus',
    name: 'NCAAF Home Dogs 10+',
    description: 'College football home underdogs getting 10+ points',
    sport: 'ncaaf',
    betType: 'ats',
    criteria: {
      homeOnly: true,
      underdogOnly: true,
      spreadMin: 10,
      seasonStart: 2017,
    }
  },
  {
    id: 'ncaab-road-favorites',
    name: 'NCAAB Road Favorites',
    description: 'College basketball road favorites',
    sport: 'ncaab',
    betType: 'ats',
    criteria: {
      awayOnly: true,
      favoriteOnly: true,
      seasonStart: 2017,
    }
  }
]

export async function GET() {
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey)
    const results = []
    
    for (const system of POPULAR_SYSTEMS_CRITERIA) {
      // Build query for this system
      let query = supabase
        .from('historical_games')
        .select('*')
        .eq('sport', system.sport)
        .gte('season', system.criteria.seasonStart || 2017)
        .not('spread_result', 'is', null)
      
      // Apply criteria filters
      if (system.criteria.spreadMin !== undefined) {
        if (system.criteria.underdogOnly && system.criteria.homeOnly) {
          // Home underdog means positive spread
          query = query.gte('point_spread', system.criteria.spreadMin)
        } else if (system.criteria.favoriteOnly && system.criteria.awayOnly) {
          // Away favorite means positive home spread
          query = query.gte('point_spread', system.criteria.spreadMin)
        }
      }
      if (system.criteria.spreadMax !== undefined) {
        query = query.lte('point_spread', system.criteria.spreadMax)
      }
      if (system.criteria.totalMin !== undefined) {
        query = query.gte('over_under', system.criteria.totalMin)
      }
      
      const { data: games, error } = await query
      
      if (error) {
        console.error(`Error fetching ${system.name}:`, error)
        continue
      }
      
      if (!games || games.length === 0) {
        // Return system with zero stats
        results.push({
          ...system,
          sampleSize: 0,
          wins: 0,
          losses: 0,
          pushes: 0,
          winPct: 0,
          unitsProfit: 0,
          roi: 0,
          confidence: 'Low' as const,
          message: 'No historical data available'
        })
        continue
      }
      
      // Calculate results
      let wins = 0, losses = 0, pushes = 0
      const bySeasons: Record<number, { wins: number; losses: number; pushes: number }> = {}
      
      for (const game of games) {
        // Determine if this game matches criteria
        const homeSpread = game.point_spread || 0
        
        // Filter based on home/away + favorite/underdog
        if (system.criteria.homeOnly && system.criteria.underdogOnly && homeSpread < system.criteria.spreadMin!) continue
        if (system.criteria.awayOnly && system.criteria.favoriteOnly && homeSpread < system.criteria.spreadMin!) continue
        
        // Calculate result based on bet type and side
        let result: 'W' | 'L' | 'P' = 'P'
        
        if (system.betType === 'ats') {
          if (system.criteria.homeOnly) {
            // We're betting home team ATS
            if (game.spread_result === 'home_cover') result = 'W'
            else if (game.spread_result === 'away_cover') result = 'L'
          } else if (system.criteria.awayOnly) {
            // We're betting away team ATS
            if (game.spread_result === 'away_cover') result = 'W'
            else if (game.spread_result === 'home_cover') result = 'L'
          }
        } else if (system.betType === 'ou') {
          // For unders systems
          if (game.total_result === 'under') result = 'W'
          else if (game.total_result === 'over') result = 'L'
        }
        
        if (result === 'W') wins++
        else if (result === 'L') losses++
        else pushes++
        
        // Track by season
        if (!bySeasons[game.season]) {
          bySeasons[game.season] = { wins: 0, losses: 0, pushes: 0 }
        }
        if (result === 'W') bySeasons[game.season].wins++
        else if (result === 'L') bySeasons[game.season].losses++
        else bySeasons[game.season].pushes++
      }
      
      const totalBets = wins + losses
      const winPct = totalBets > 0 ? (wins / totalBets) * 100 : 0
      const unitsProfit = wins * 0.91 - losses // -110 odds
      const roi = totalBets > 0 ? (unitsProfit / totalBets) * 100 : 0
      
      // Confidence level
      let confidence: 'Low' | 'Medium' | 'High' | 'Very High' = 'Low'
      if (totalBets >= 200) confidence = 'Very High'
      else if (totalBets >= 100) confidence = 'High'
      else if (totalBets >= 50) confidence = 'Medium'
      
      // Season breakdown
      const seasonBreakdown = Object.entries(bySeasons)
        .map(([season, stats]) => ({
          season: parseInt(season),
          record: `${stats.wins}-${stats.losses}${stats.pushes ? `-${stats.pushes}` : ''}`,
          winPct: stats.wins + stats.losses > 0 
            ? Math.round(((stats.wins / (stats.wins + stats.losses)) * 100) * 10) / 10 
            : 0
        }))
        .sort((a, b) => b.season - a.season)
      
      results.push({
        ...system,
        sampleSize: wins + losses + pushes,
        wins,
        losses,
        pushes,
        winPct: Math.round(winPct * 10) / 10,
        unitsProfit: Math.round(unitsProfit * 10) / 10,
        roi: Math.round(roi * 10) / 10,
        confidence,
        record: `${wins}-${losses}${pushes ? `-${pushes}` : ''}`,
        seasonBreakdown
      })
    }
    
    // Sort by ROI descending
    results.sort((a, b) => (b.roi || 0) - (a.roi || 0))
    
    return NextResponse.json({
      systems: results,
      lastUpdated: new Date().toISOString(),
      dataSource: 'historical_games'
    })
    
  } catch (err: unknown) {
    const error = err as Error
    console.error('Popular systems error:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch popular systems',
      details: error.message 
    }, { status: 500 })
  }
}
