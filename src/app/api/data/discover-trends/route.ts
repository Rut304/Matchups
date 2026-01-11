/**
 * Trend Discovery Engine
 * 
 * Analyzes historical games to discover profitable betting trends
 * Populates the historical_trends table with verified patterns
 * 
 * POST /api/data/discover-trends - Run trend discovery
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

type Sport = 'NFL' | 'NBA' | 'NHL' | 'MLB' | 'ALL'

interface HistoricalGame {
  id: string
  sport: string
  season_year: number
  game_date: string
  home_team: string
  away_team: string
  home_score: number
  away_score: number
  close_spread: number | null
  close_total: number | null
  spread_result: 'home_cover' | 'away_cover' | 'push' | null
  total_result: 'over' | 'under' | 'push' | null
  public_spread_home_pct: number | null
  public_total_over_pct: number | null
  primetime_game: boolean
  divisional_game: boolean
}

interface TrendResult {
  id: string
  sport: Sport
  category: string
  betType: string
  name: string
  description: string
  criteria: Record<string, unknown>
  record: { wins: number; losses: number; pushes: number }
  winPct: number
  roi: number
  sampleSize: number
}

// Analyze games to find profitable trends
async function analyzeGames(
  games: HistoricalGame[],
  sport: Sport
): Promise<TrendResult[]> {
  const trends: TrendResult[] = []
  
  // Group games by team
  const teamGames = new Map<string, HistoricalGame[]>()
  for (const game of games) {
    if (!teamGames.has(game.home_team)) teamGames.set(game.home_team, [])
    if (!teamGames.has(game.away_team)) teamGames.set(game.away_team, [])
    teamGames.get(game.home_team)!.push(game)
    teamGames.get(game.away_team)!.push(game)
  }

  // Analyze each team's ATS performance
  for (const [team, teamGamesList] of teamGames) {
    // Home ATS
    const homeGames = teamGamesList.filter(g => g.home_team === team && g.spread_result)
    if (homeGames.length >= 20) {
      const homeWins = homeGames.filter(g => g.spread_result === 'home_cover').length
      const homeLosses = homeGames.filter(g => g.spread_result === 'away_cover').length
      const homePushes = homeGames.filter(g => g.spread_result === 'push').length
      const winPct = (homeWins / (homeWins + homeLosses)) * 100
      
      if (winPct >= 54 || winPct <= 46) {
        const roi = ((homeWins * 100 - homeLosses * 110) / ((homeWins + homeLosses) * 110)) * 100
        trends.push({
          id: `${sport}-${team.replace(/\s+/g, '-').toLowerCase()}-home-ats`,
          sport,
          category: 'team',
          betType: 'spread',
          name: `${team} Home ATS`,
          description: winPct >= 54 
            ? `${team} covers at home ${winPct.toFixed(1)}% of the time`
            : `${team} fails to cover at home ${(100 - winPct).toFixed(1)}% - fade them`,
          criteria: { team, location: 'home', betType: 'spread' },
          record: { wins: homeWins, losses: homeLosses, pushes: homePushes },
          winPct,
          roi,
          sampleSize: homeWins + homeLosses + homePushes,
        })
      }
    }

    // Away ATS
    const awayGames = teamGamesList.filter(g => g.away_team === team && g.spread_result)
    if (awayGames.length >= 20) {
      const awayWins = awayGames.filter(g => g.spread_result === 'away_cover').length
      const awayLosses = awayGames.filter(g => g.spread_result === 'home_cover').length
      const awayPushes = awayGames.filter(g => g.spread_result === 'push').length
      const winPct = (awayWins / (awayWins + awayLosses)) * 100
      
      if (winPct >= 54 || winPct <= 46) {
        const roi = ((awayWins * 100 - awayLosses * 110) / ((awayWins + awayLosses) * 110)) * 100
        trends.push({
          id: `${sport}-${team.replace(/\s+/g, '-').toLowerCase()}-away-ats`,
          sport,
          category: 'team',
          betType: 'spread',
          name: `${team} Away ATS`,
          description: winPct >= 54 
            ? `${team} covers on the road ${winPct.toFixed(1)}% of the time`
            : `${team} fails to cover on the road ${(100 - winPct).toFixed(1)}% - fade them`,
          criteria: { team, location: 'away', betType: 'spread' },
          record: { wins: awayWins, losses: awayLosses, pushes: awayPushes },
          winPct,
          roi,
          sampleSize: awayWins + awayLosses + awayPushes,
        })
      }
    }

    // Team O/U
    const allTeamGames = teamGamesList.filter(g => g.total_result)
    if (allTeamGames.length >= 30) {
      const overs = allTeamGames.filter(g => g.total_result === 'over').length
      const unders = allTeamGames.filter(g => g.total_result === 'under').length
      const pushes = allTeamGames.filter(g => g.total_result === 'push').length
      const overPct = (overs / (overs + unders)) * 100
      
      if (overPct >= 55 || overPct <= 45) {
        const isOver = overPct >= 55
        const winPct = isOver ? overPct : (100 - overPct)
        const roi = ((winPct - 52.38) / 52.38) * 100 // Approximate
        
        trends.push({
          id: `${sport}-${team.replace(/\s+/g, '-').toLowerCase()}-totals`,
          sport,
          category: 'team',
          betType: 'total',
          name: `${team} ${isOver ? 'Overs' : 'Unders'}`,
          description: `${team} games go ${isOver ? 'over' : 'under'} ${winPct.toFixed(1)}% of the time`,
          criteria: { team, betType: 'total', side: isOver ? 'over' : 'under' },
          record: isOver 
            ? { wins: overs, losses: unders, pushes }
            : { wins: unders, losses: overs, pushes },
          winPct,
          roi,
          sampleSize: overs + unders + pushes,
        })
      }
    }
  }

  // Situational trends

  // Primetime games
  const primetimeGames = games.filter(g => g.primetime_game && g.spread_result)
  if (primetimeGames.length >= 50) {
    const homeCovers = primetimeGames.filter(g => g.spread_result === 'home_cover').length
    const awayCovers = primetimeGames.filter(g => g.spread_result === 'away_cover').length
    const homePct = (homeCovers / (homeCovers + awayCovers)) * 100
    
    if (homePct >= 54 || homePct <= 46) {
      const betSide = homePct >= 54 ? 'home' : 'away'
      const winPct = betSide === 'home' ? homePct : (100 - homePct)
      trends.push({
        id: `${sport}-primetime-${betSide}`,
        sport,
        category: 'situational',
        betType: 'spread',
        name: `Primetime ${betSide === 'home' ? 'Home' : 'Away'} Teams ATS`,
        description: `${betSide === 'home' ? 'Home' : 'Away'} teams cover in primetime ${winPct.toFixed(1)}% of the time`,
        criteria: { primetime: true, side: betSide },
        record: betSide === 'home' 
          ? { wins: homeCovers, losses: awayCovers, pushes: 0 }
          : { wins: awayCovers, losses: homeCovers, pushes: 0 },
        winPct,
        roi: ((winPct - 52.38) / 52.38) * 100,
        sampleSize: primetimeGames.length,
      })
    }
  }

  // Divisional games
  const divGames = games.filter(g => g.divisional_game && g.spread_result)
  if (divGames.length >= 50) {
    const homeCovers = divGames.filter(g => g.spread_result === 'home_cover').length
    const awayCovers = divGames.filter(g => g.spread_result === 'away_cover').length
    const homePct = (homeCovers / (homeCovers + awayCovers)) * 100
    
    if (homePct >= 54 || homePct <= 46) {
      const betSide = homePct >= 54 ? 'home' : 'away'
      const winPct = betSide === 'home' ? homePct : (100 - homePct)
      trends.push({
        id: `${sport}-divisional-${betSide}`,
        sport,
        category: 'situational',
        betType: 'spread',
        name: `Divisional Game ${betSide === 'home' ? 'Home' : 'Away'} ATS`,
        description: `${betSide === 'home' ? 'Home' : 'Away'} teams cover in divisional games ${winPct.toFixed(1)}% of the time`,
        criteria: { divisional: true, side: betSide },
        record: betSide === 'home' 
          ? { wins: homeCovers, losses: awayCovers, pushes: 0 }
          : { wins: awayCovers, losses: homeCovers, pushes: 0 },
        winPct,
        roi: ((winPct - 52.38) / 52.38) * 100,
        sampleSize: divGames.length,
      })
    }
  }

  // Public fade trends
  const heavyPublicHome = games.filter(g => 
    g.public_spread_home_pct && g.public_spread_home_pct >= 70 && g.spread_result
  )
  if (heavyPublicHome.length >= 30) {
    const fadeWins = heavyPublicHome.filter(g => g.spread_result === 'away_cover').length
    const fadeLosses = heavyPublicHome.filter(g => g.spread_result === 'home_cover').length
    const winPct = (fadeWins / (fadeWins + fadeLosses)) * 100
    
    if (winPct >= 52) {
      trends.push({
        id: `${sport}-fade-heavy-public`,
        sport,
        category: 'contrarian',
        betType: 'spread',
        name: `Fade Heavy Public (70%+)`,
        description: `Fading teams with 70%+ public support hits ${winPct.toFixed(1)}%`,
        criteria: { publicPct: { min: 70 }, side: 'fade' },
        record: { wins: fadeWins, losses: fadeLosses, pushes: 0 },
        winPct,
        roi: ((fadeWins * 100 - fadeLosses * 110) / ((fadeWins + fadeLosses) * 110)) * 100,
        sampleSize: heavyPublicHome.length,
      })
    }
  }

  return trends
}

export async function POST(request: NextRequest) {
  // Verify authorization
  const authHeader = request.headers.get('authorization')
  const adminSecret = process.env.ADMIN_SECRET
  
  if (adminSecret && authHeader !== `Bearer ${adminSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { sport, minSampleSize = 20, minWinPct = 53 } = body

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Fetch historical games
    let query = supabase
      .from('historical_games')
      .select('*')
      .order('game_date', { ascending: false })

    if (sport && sport !== 'ALL') {
      query = query.eq('sport', sport)
    }

    const { data: games, error } = await query

    if (error) throw error
    if (!games || games.length === 0) {
      return NextResponse.json({
        status: 'no-data',
        message: 'No historical games found. Run import first.',
      })
    }

    // Discover trends by sport
    const allTrends: TrendResult[] = []
    const sports = sport && sport !== 'ALL' 
      ? [sport] 
      : ['NFL', 'NBA', 'NHL', 'MLB']

    for (const s of sports) {
      const sportGames = games.filter(g => g.sport === s) as HistoricalGame[]
      const trends = await analyzeGames(sportGames, s as Sport)
      
      // Filter by minimum criteria
      const qualifiedTrends = trends.filter(t => 
        t.sampleSize >= minSampleSize && 
        (t.winPct >= minWinPct || t.winPct <= (100 - minWinPct))
      )
      
      allTrends.push(...qualifiedTrends)
    }

    // Insert/update trends in database
    const trendRecords = allTrends.map(t => ({
      trend_id: t.id,
      sport: t.sport,
      category: t.category,
      bet_type: t.betType,
      trend_name: t.name,
      trend_description: t.description,
      trend_criteria: t.criteria,
      l30_record: `${t.record.wins}-${t.record.losses}`,
      l30_units: t.roi * (t.record.wins + t.record.losses) / 100,
      l30_roi: t.roi,
      l90_record: `${t.record.wins}-${t.record.losses}`,
      l90_units: t.roi * (t.record.wins + t.record.losses) / 100,
      l90_roi: t.roi,
      l365_record: `${t.record.wins}-${t.record.losses}`,
      l365_units: t.roi * (t.record.wins + t.record.losses) / 100,
      l365_roi: t.roi,
      all_time_record: `${t.record.wins}-${t.record.losses}`,
      all_time_units: t.roi * (t.record.wins + t.record.losses) / 100,
      all_time_roi: t.roi,
      all_time_sample_size: t.sampleSize,
      is_active: true,
      hot_streak: t.roi > 10 && t.winPct > 55,
      confidence_score: Math.min(100, Math.floor(t.winPct + t.sampleSize / 10)),
      last_updated: new Date().toISOString(),
    }))

    // Upsert trends
    const { error: upsertError } = await supabase
      .from('historical_trends')
      .upsert(trendRecords, { onConflict: 'trend_id' })

    if (upsertError) {
      console.error('Trend upsert error:', upsertError)
    }

    return NextResponse.json({
      status: 'complete',
      trendsDiscovered: allTrends.length,
      byCategory: {
        team: allTrends.filter(t => t.category === 'team').length,
        situational: allTrends.filter(t => t.category === 'situational').length,
        contrarian: allTrends.filter(t => t.category === 'contrarian').length,
      },
      topTrends: allTrends
        .sort((a, b) => b.winPct - a.winPct)
        .slice(0, 10)
        .map(t => ({
          name: t.name,
          winPct: t.winPct.toFixed(1) + '%',
          roi: t.roi.toFixed(1) + '%',
          sampleSize: t.sampleSize,
        })),
    })
  } catch (error) {
    console.error('Trend discovery error:', error)
    return NextResponse.json({
      error: 'Discovery failed',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 })
  }
}

// GET endpoint for discovered trends
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const sport = searchParams.get('sport')
  const category = searchParams.get('category')
  const limit = parseInt(searchParams.get('limit') || '50')

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    let query = supabase
      .from('historical_trends')
      .select('*')
      .eq('is_active', true)
      .order('all_time_roi', { ascending: false })
      .limit(limit)

    if (sport && sport !== 'ALL') {
      query = query.eq('sport', sport)
    }
    if (category) {
      query = query.eq('category', category)
    }

    const { data, error } = await query

    if (error) throw error

    return NextResponse.json({
      trends: data || [],
      count: data?.length || 0,
    })
  } catch (error) {
    return NextResponse.json({
      error: 'Failed to fetch trends',
    }, { status: 500 })
  }
}
