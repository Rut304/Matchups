import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

/**
 * GET /api/team-history?team=BUF&sport=NFL&limit=10
 * Returns historical games for a specific team from our database
 * This supplements ESPN data during playoffs when their API returns limited results
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const team = searchParams.get('team')?.toUpperCase()
  const sport = searchParams.get('sport')?.toLowerCase() || 'nfl'
  const limit = parseInt(searchParams.get('limit') || '10')
  
  if (!team) {
    return NextResponse.json({ error: 'Team abbreviation required' }, { status: 400 })
  }
  
  const supabase = await createClient()
  
  // Query games where this team played (home or away)
  const { data: games, error } = await supabase
    .from('historical_games')
    .select('*')
    .ilike('sport', sport)
    .or(`home_team_abbrev.eq.${team},away_team_abbrev.eq.${team}`)
    .order('game_date', { ascending: false })
    .limit(limit)
  
  if (error) {
    console.error('Team history query error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  // Transform to TeamGameResult format
  const teamGames = (games || []).map(g => {
    const isHome = g.home_team_abbrev === team
    const teamScore = isHome ? g.home_score : g.away_score
    const opponentScore = isHome ? g.away_score : g.home_score
    const opponentAbbr = isHome ? g.away_team_abbrev : g.home_team_abbrev
    
    // Determine result
    let result: 'W' | 'L' | 'T' | null = null
    if (teamScore !== null && opponentScore !== null) {
      if (teamScore > opponentScore) result = 'W'
      else if (teamScore < opponentScore) result = 'L'
      else result = 'T'
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
      spread: g.spread ? (isHome ? `${g.spread > 0 ? '+' : ''}${g.spread}` : `${-g.spread > 0 ? '+' : ''}${-g.spread}`) : undefined,
      atsResult: g.ats_result || null,
      total: g.total ? `${g.total}` : undefined,
      ouResult: g.ou_result || null,
      isCompleted: true,
      seasonType: g.season_type,
      season: g.season_year,
    }
  })
  
  // Calculate records
  const wins = teamGames.filter(g => g.result === 'W').length
  const losses = teamGames.filter(g => g.result === 'L').length
  const ties = teamGames.filter(g => g.result === 'T').length
  
  return NextResponse.json({
    team: {
      abbreviation: team,
      sport: sport.toUpperCase(),
    },
    games: teamGames,
    record: ties > 0 ? `${wins}-${losses}-${ties}` : `${wins}-${losses}`,
    gamesFound: teamGames.length,
    source: 'historical_database',
  })
}
