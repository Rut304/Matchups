import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

/**
 * GET /api/team-history?team=BUF&sport=NFL&limit=10
 * Returns historical games for a specific team from our database
 * Includes spread/total results for ATS tracking
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const team = searchParams.get('team')?.toUpperCase()
  const sport = searchParams.get('sport')?.toLowerCase() || 'nfl'
  const limit = parseInt(searchParams.get('limit') || '10')
  
  if (!team) {
    return NextResponse.json({ error: 'Team abbreviation required' }, { status: 400 })
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey)
  
  // Query games where this team played (home or away)
  // Using correct column names: home_team_abbr, away_team_abbr
  const { data: games, error } = await supabase
    .from('historical_games')
    .select('*')
    .ilike('sport', sport)
    .or(`home_team_abbr.eq.${team},away_team_abbr.eq.${team}`)
    .order('game_date', { ascending: false })
    .limit(limit)
  
  if (error) {
    console.error('Team history query error:', error)
    return NextResponse.json({ error: error.message, games: [] }, { status: 500 })
  }
  
  // Transform to TeamGameResult format with historical odds
  const teamGames = (games || []).map(g => {
    const isHome = g.home_team_abbr === team
    const teamScore = isHome ? g.home_score : g.away_score
    const opponentScore = isHome ? g.away_score : g.home_score
    const opponentAbbr = isHome ? g.away_team_abbr : g.home_team_abbr
    
    // Determine result
    let result: 'W' | 'L' | 'T' | null = null
    if (teamScore !== null && opponentScore !== null) {
      if (teamScore > opponentScore) result = 'W'
      else if (teamScore < opponentScore) result = 'L'
      else result = 'T'
    }
    
    // Calculate ATS result from spread_result or compute it
    let atsResult: 'W' | 'L' | 'P' | null = null
    if (g.spread_result) {
      if (isHome) {
        atsResult = g.spread_result === 'home_cover' ? 'W' : g.spread_result === 'push' ? 'P' : 'L'
      } else {
        atsResult = g.spread_result === 'away_cover' ? 'W' : g.spread_result === 'push' ? 'P' : 'L'
      }
    } else if (g.point_spread !== null && teamScore !== null && opponentScore !== null) {
      const spread = isHome ? g.point_spread : -g.point_spread
      const margin = teamScore - opponentScore
      const spreadMargin = margin + spread
      if (spreadMargin > 0) atsResult = 'W'
      else if (spreadMargin < 0) atsResult = 'L'
      else atsResult = 'P'
    }
    
    // Calculate O/U result from total_result or compute it
    let ouResult: 'O' | 'U' | 'P' | null = null
    if (g.total_result) {
      ouResult = g.total_result === 'over' ? 'O' : g.total_result === 'push' ? 'P' : 'U'
    } else if (g.over_under !== null && g.total_points !== null) {
      if (g.total_points > g.over_under) ouResult = 'O'
      else if (g.total_points < g.over_under) ouResult = 'U'
      else ouResult = 'P'
    }
    
    // Format spread string (e.g., "-3.5" or "+7.0")
    let spreadStr: string | undefined = undefined
    if (g.point_spread !== null) {
      const teamSpread = isHome ? g.point_spread : -g.point_spread
      spreadStr = teamSpread > 0 ? `+${teamSpread}` : `${teamSpread}`
    }
    
    return {
      id: g.espn_game_id || g.id,
      week: g.week || '-',
      date: g.game_date,
      opponent: isHome ? opponentAbbr : `@${opponentAbbr}`,
      homeAway: isHome ? 'home' : 'away',
      result,
      teamScore,
      opponentScore,
      score: teamScore !== null && opponentScore !== null 
        ? `${teamScore}-${opponentScore}` 
        : 'TBD',
      spread: spreadStr,
      atsResult,
      total: g.over_under ? `${g.over_under}` : undefined,
      ouResult,
      isCompleted: teamScore !== null && opponentScore !== null,
      seasonType: g.season_type,
      season: g.season,
    }
  })
  
  // Calculate records
  const completed = teamGames.filter(g => g.isCompleted)
  const wins = completed.filter(g => g.result === 'W').length
  const losses = completed.filter(g => g.result === 'L').length
  const ties = completed.filter(g => g.result === 'T').length
  const atsWins = completed.filter(g => g.atsResult === 'W').length
  const atsLosses = completed.filter(g => g.atsResult === 'L').length
  const atsPushes = completed.filter(g => g.atsResult === 'P').length
  const overs = completed.filter(g => g.ouResult === 'O').length
  const unders = completed.filter(g => g.ouResult === 'U').length
  
  return NextResponse.json({
    team: {
      abbreviation: team,
      sport: sport.toUpperCase(),
    },
    games: teamGames,
    record: ties > 0 ? `${wins}-${losses}-${ties}` : `${wins}-${losses}`,
    atsRecord: `${atsWins}-${atsLosses}-${atsPushes}`,
    ouRecord: `${overs}-${unders}`,
    gamesFound: teamGames.length,
    source: 'historical_database',
    meta: {
      fetchedAt: new Date().toISOString()
    }
  })
}
