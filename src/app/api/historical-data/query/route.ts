import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

// GET /api/historical-data/query
// Query historical games for specific patterns
// Example: ?sport=nfl&seasonType=postseason&query=both_teams_rush_pass_td_both_halves
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const sport = searchParams.get('sport') || 'nfl'
  const seasonType = searchParams.get('seasonType')
  const season = searchParams.get('season')
  const query = searchParams.get('query') || ''
  
  const supabase = await createClient()
  
  // Build base query
  let dbQuery = supabase.from('historical_games').select('*')
  
  if (sport) dbQuery = dbQuery.eq('sport', sport)
  if (seasonType) dbQuery = dbQuery.eq('season_type', seasonType)
  if (season) dbQuery = dbQuery.eq('season', parseInt(season))
  
  // Execute query
  const { data: games, error } = await dbQuery.order('game_date', { ascending: false })
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  // Now apply custom filters based on query type
  let filteredGames = games || []
  let description = ''
  
  switch (query) {
    case 'both_teams_rush_pass_td_both_halves':
      // Both teams scored a rushing TD AND passing TD in BOTH halves
      filteredGames = filteredGames.filter(g => 
        g.home_rushing_td_first_half >= 1 &&
        g.home_passing_td_first_half >= 1 &&
        g.home_rushing_td_second_half >= 1 &&
        g.home_passing_td_second_half >= 1 &&
        g.away_rushing_td_first_half >= 1 &&
        g.away_passing_td_first_half >= 1 &&
        g.away_rushing_td_second_half >= 1 &&
        g.away_passing_td_second_half >= 1
      )
      description = 'Games where BOTH teams scored at least one rushing TD AND one passing TD in BOTH halves'
      break
      
    case 'both_teams_td_both_halves':
      // Both teams scored at least one TD in both halves (any type)
      filteredGames = filteredGames.filter(g => 
        (g.home_rushing_td_first_half + g.home_passing_td_first_half) >= 1 &&
        (g.home_rushing_td_second_half + g.home_passing_td_second_half) >= 1 &&
        (g.away_rushing_td_first_half + g.away_passing_td_first_half) >= 1 &&
        (g.away_rushing_td_second_half + g.away_passing_td_second_half) >= 1
      )
      description = 'Games where BOTH teams scored at least one TD in BOTH halves'
      break

    case 'both_teams_rush_td_each_half':
      filteredGames = filteredGames.filter(g =>
        g.home_rushing_td_first_half >= 1 &&
        g.home_rushing_td_second_half >= 1 &&
        g.away_rushing_td_first_half >= 1 &&
        g.away_rushing_td_second_half >= 1
      )
      description = 'Games where BOTH teams scored at least one rushing TD in BOTH halves'
      break
      
    case 'both_teams_pass_td_each_half':
      filteredGames = filteredGames.filter(g =>
        g.home_passing_td_first_half >= 1 &&
        g.home_passing_td_second_half >= 1 &&
        g.away_passing_td_first_half >= 1 &&
        g.away_passing_td_second_half >= 1
      )
      description = 'Games where BOTH teams scored at least one passing TD in BOTH halves'
      break
      
    case 'high_scoring':
      filteredGames = filteredGames.filter(g => g.total_points >= 50)
      description = 'High-scoring games (50+ total points)'
      break
      
    case 'low_scoring':
      filteredGames = filteredGames.filter(g => g.total_points <= 30)
      description = 'Low-scoring games (30 or fewer total points)'
      break
      
    case 'blowout':
      filteredGames = filteredGames.filter(g => Math.abs(g.home_score - g.away_score) >= 21)
      description = 'Blowout games (margin of 21+ points)'
      break
      
    case 'close_game':
      filteredGames = filteredGames.filter(g => Math.abs(g.home_score - g.away_score) <= 7)
      description = 'Close games (margin of 7 or fewer points)'
      break
      
    case 'overtime':
      filteredGames = filteredGames.filter(g => 
        g.home_scores_by_period && g.home_scores_by_period.length > 4
      )
      description = 'Games that went to overtime'
      break
      
    default:
      description = 'All games matching criteria'
  }
  
  // Calculate statistics
  const totalGamesInQuery = games?.length || 0
  const matchingGames = filteredGames.length
  const percentage = totalGamesInQuery > 0 
    ? ((matchingGames / totalGamesInQuery) * 100).toFixed(1) 
    : '0'
  
  return NextResponse.json({
    sport,
    seasonType,
    season: season ? parseInt(season) : 'all',
    query,
    description,
    totalGamesSearched: totalGamesInQuery,
    matchingGames,
    percentage: `${percentage}%`,
    games: filteredGames.map(g => ({
      id: g.id,
      espnGameId: g.espn_game_id,
      date: g.game_date,
      matchup: `${g.away_team_abbr} @ ${g.home_team_abbr}`,
      score: `${g.away_score}-${g.home_score}`,
      homeTDs: {
        firstHalf: { rushing: g.home_rushing_td_first_half, passing: g.home_passing_td_first_half },
        secondHalf: { rushing: g.home_rushing_td_second_half, passing: g.home_passing_td_second_half },
      },
      awayTDs: {
        firstHalf: { rushing: g.away_rushing_td_first_half, passing: g.away_passing_td_first_half },
        secondHalf: { rushing: g.away_rushing_td_second_half, passing: g.away_passing_td_second_half },
      },
      totalPoints: g.total_points,
    })),
    timestamp: new Date().toISOString(),
  })
}

// POST /api/historical-data/query
// For more complex queries with multiple conditions
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      sport = 'nfl',
      seasons,
      seasonType,
      minTotalPoints,
      maxTotalPoints,
      homeTeam,
      awayTeam,
      conditions = [],
    } = body
    
    const supabase = await createClient()
    
    // Build base query
    let dbQuery = supabase.from('historical_games').select('*')
    
    if (sport) dbQuery = dbQuery.eq('sport', sport)
    if (seasonType) dbQuery = dbQuery.eq('season_type', seasonType)
    if (seasons && seasons.length > 0) dbQuery = dbQuery.in('season', seasons)
    if (minTotalPoints) dbQuery = dbQuery.gte('total_points', minTotalPoints)
    if (maxTotalPoints) dbQuery = dbQuery.lte('total_points', maxTotalPoints)
    if (homeTeam) dbQuery = dbQuery.ilike('home_team_abbr', `%${homeTeam}%`)
    if (awayTeam) dbQuery = dbQuery.ilike('away_team_abbr', `%${awayTeam}%`)
    
    const { data: games, error } = await dbQuery.order('game_date', { ascending: false })
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    // Apply additional conditions in JavaScript
    let filteredGames = games || []
    
    for (const condition of conditions) {
      switch (condition.type) {
        case 'home_rushing_td_first_half':
          filteredGames = filteredGames.filter(g => 
            g.home_rushing_td_first_half >= (condition.min || 0)
          )
          break
        case 'home_passing_td_first_half':
          filteredGames = filteredGames.filter(g => 
            g.home_passing_td_first_half >= (condition.min || 0)
          )
          break
        case 'away_rushing_td_first_half':
          filteredGames = filteredGames.filter(g => 
            g.away_rushing_td_first_half >= (condition.min || 0)
          )
          break
        case 'away_passing_td_first_half':
          filteredGames = filteredGames.filter(g => 
            g.away_passing_td_first_half >= (condition.min || 0)
          )
          break
        case 'home_rushing_td_second_half':
          filteredGames = filteredGames.filter(g => 
            g.home_rushing_td_second_half >= (condition.min || 0)
          )
          break
        case 'home_passing_td_second_half':
          filteredGames = filteredGames.filter(g => 
            g.home_passing_td_second_half >= (condition.min || 0)
          )
          break
        case 'away_rushing_td_second_half':
          filteredGames = filteredGames.filter(g => 
            g.away_rushing_td_second_half >= (condition.min || 0)
          )
          break
        case 'away_passing_td_second_half':
          filteredGames = filteredGames.filter(g => 
            g.away_passing_td_second_half >= (condition.min || 0)
          )
          break
        case 'both_teams_rush_pass_td_both_halves':
          filteredGames = filteredGames.filter(g => 
            g.home_rushing_td_first_half >= 1 &&
            g.home_passing_td_first_half >= 1 &&
            g.home_rushing_td_second_half >= 1 &&
            g.home_passing_td_second_half >= 1 &&
            g.away_rushing_td_first_half >= 1 &&
            g.away_passing_td_first_half >= 1 &&
            g.away_rushing_td_second_half >= 1 &&
            g.away_passing_td_second_half >= 1
          )
          break
      }
    }
    
    const totalGamesSearched = games?.length || 0
    const matchingGames = filteredGames.length
    const percentage = totalGamesSearched > 0 
      ? ((matchingGames / totalGamesSearched) * 100).toFixed(1) 
      : '0'
    
    return NextResponse.json({
      sport,
      seasons,
      seasonType,
      conditions,
      totalGamesSearched,
      matchingGames,
      percentage: `${percentage}%`,
      games: filteredGames.slice(0, 50).map(g => ({
        id: g.id,
        espnGameId: g.espn_game_id,
        date: g.game_date,
        season: g.season,
        matchup: `${g.away_team_abbr} @ ${g.home_team_abbr}`,
        score: `${g.away_score}-${g.home_score}`,
        homeTDs: {
          firstHalf: { rushing: g.home_rushing_td_first_half, passing: g.home_passing_td_first_half },
          secondHalf: { rushing: g.home_rushing_td_second_half, passing: g.home_passing_td_second_half },
        },
        awayTDs: {
          firstHalf: { rushing: g.away_rushing_td_first_half, passing: g.away_passing_td_first_half },
          secondHalf: { rushing: g.away_rushing_td_second_half, passing: g.away_passing_td_second_half },
        },
        totalPoints: g.total_points,
      })),
      timestamp: new Date().toISOString(),
    })
    
  } catch (error) {
    console.error('Query error:', error)
    return NextResponse.json({ error: 'Failed to process query' }, { status: 500 })
  }
}
