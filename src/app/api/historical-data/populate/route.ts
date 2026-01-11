import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

// ESPN endpoints
const ESPN_SCOREBOARD = (sport: string, league: string, season: number, seasonType: number, week?: number) => {
  let url = `https://site.api.espn.com/apis/site/v2/sports/${sport}/${league}/scoreboard?dates=${season}&seasontype=${seasonType}`
  if (week) url += `&week=${week}`
  return url
}

const ESPN_GAME_SUMMARY = (sport: string, league: string, gameId: string) =>
  `https://site.api.espn.com/apis/site/v2/sports/${sport}/${league}/summary?event=${gameId}`

// Parse scoring plays
function parseScoringPlays(scoringPlays: any[], homeTeamId: string) {
  const result = {
    plays: [] as any[],
    homeRushingTD: 0, homePassingTD: 0, awayRushingTD: 0, awayPassingTD: 0,
    homeRushingTDFirstHalf: 0, homePassingTDFirstHalf: 0,
    homeRushingTDSecondHalf: 0, homePassingTDSecondHalf: 0,
    awayRushingTDFirstHalf: 0, awayPassingTDFirstHalf: 0,
    awayRushingTDSecondHalf: 0, awayPassingTDSecondHalf: 0,
    homeFGCount: 0, awayFGCount: 0,
  }

  if (!scoringPlays) return result

  for (const play of scoringPlays) {
    const period = play.period?.number || 1
    const isFirstHalf = period <= 2
    const isHome = play.team?.id === homeTeamId
    const text = (play.text || '').toLowerCase()
    
    if (text.includes('field goal') || text.includes('fg')) {
      if (isHome) result.homeFGCount++
      else result.awayFGCount++
    } else if (text.includes('pass') || text.includes('reception') || text.includes('caught')) {
      if (isHome) {
        result.homePassingTD++
        if (isFirstHalf) result.homePassingTDFirstHalf++
        else result.homePassingTDSecondHalf++
      } else {
        result.awayPassingTD++
        if (isFirstHalf) result.awayPassingTDFirstHalf++
        else result.awayPassingTDSecondHalf++
      }
    } else if (text.includes('rush') || text.includes('run') || text.includes('yard run')) {
      if (isHome) {
        result.homeRushingTD++
        if (isFirstHalf) result.homeRushingTDFirstHalf++
        else result.homeRushingTDSecondHalf++
      } else {
        result.awayRushingTD++
        if (isFirstHalf) result.awayRushingTDFirstHalf++
        else result.awayRushingTDSecondHalf++
      }
    }

    result.plays.push({
      period,
      team: play.team?.abbreviation || '',
      text: play.text || '',
    })
  }

  return result
}

// Fetch and store a single game
async function fetchAndStoreGame(
  supabase: any,
  sport: string,
  league: string,
  gameId: string,
  basicGameData: any,
  season: number,
  seasonType: string
) {
  try {
    const summaryRes = await fetch(ESPN_GAME_SUMMARY(sport, league, gameId))
    if (!summaryRes.ok) return null
    
    const summary = await summaryRes.json()
    const competition = basicGameData.competitions?.[0]
    if (!competition) return null
    
    const homeTeam = competition.competitors?.find((c: any) => c.homeAway === 'home')
    const awayTeam = competition.competitors?.find((c: any) => c.homeAway === 'away')
    if (!homeTeam || !awayTeam) return null

    const scoringPlays = summary.scoringPlays || []
    const parsed = parseScoringPlays(scoringPlays, homeTeam.id)
    
    const homeLinescores = homeTeam.linescores || []
    const awayLinescores = awayTeam.linescores || []
    
    const homeScoresByPeriod = homeLinescores.map((l: any) => l.value || 0)
    const awayScoresByPeriod = awayLinescores.map((l: any) => l.value || 0)
    
    const homeFirstHalf = (homeScoresByPeriod[0] || 0) + (homeScoresByPeriod[1] || 0)
    const homeSecondHalf = (homeScoresByPeriod[2] || 0) + (homeScoresByPeriod[3] || 0)
    const awayFirstHalf = (awayScoresByPeriod[0] || 0) + (awayScoresByPeriod[1] || 0)
    const awaySecondHalf = (awayScoresByPeriod[2] || 0) + (awayScoresByPeriod[3] || 0)

    // Use existing column names from the table
    const gameData = {
      espn_game_id: gameId,
      sport: league.toUpperCase(),
      season_year: season,
      season_type: seasonType,
      game_date: basicGameData.date || new Date().toISOString(),
      
      home_team: homeTeam.team?.displayName || '',
      away_team: awayTeam.team?.displayName || '',
      home_team_abbrev: homeTeam.team?.abbreviation || '',
      away_team_abbrev: awayTeam.team?.abbreviation || '',
      
      home_score: parseInt(homeTeam.score) || 0,
      away_score: parseInt(awayTeam.score) || 0,
      
      venue: competition.venue?.fullName || null,
      
      // New columns for TD breakdown
      home_scores_by_period: homeScoresByPeriod,
      away_scores_by_period: awayScoresByPeriod,
      scoring_plays: parsed.plays,
      
      home_rushing_td_count: parsed.homeRushingTD,
      home_passing_td_count: parsed.homePassingTD,
      away_rushing_td_count: parsed.awayRushingTD,
      away_passing_td_count: parsed.awayPassingTD,
      home_field_goal_count: parsed.homeFGCount,
      away_field_goal_count: parsed.awayFGCount,
      
      total_points: (parseInt(homeTeam.score) || 0) + (parseInt(awayTeam.score) || 0),
      
      home_first_half_score: homeFirstHalf,
      home_second_half_score: homeSecondHalf,
      away_first_half_score: awayFirstHalf,
      away_second_half_score: awaySecondHalf,
      
      home_rushing_td_first_half: parsed.homeRushingTDFirstHalf,
      home_passing_td_first_half: parsed.homePassingTDFirstHalf,
      home_rushing_td_second_half: parsed.homeRushingTDSecondHalf,
      home_passing_td_second_half: parsed.homePassingTDSecondHalf,
      away_rushing_td_first_half: parsed.awayRushingTDFirstHalf,
      away_passing_td_first_half: parsed.awayPassingTDFirstHalf,
      away_rushing_td_second_half: parsed.awayRushingTDSecondHalf,
      away_passing_td_second_half: parsed.awayPassingTDSecondHalf,
    }

    const { data, error } = await supabase
      .from('historical_games')
      .upsert(gameData, { onConflict: 'espn_game_id' })
      .select()
      .single()

    if (error) {
      console.error('Error storing game:', error)
      return null
    }

    return data
  } catch (error) {
    console.error(`Error fetching game ${gameId}:`, error)
    return null
  }
}

// POST /api/historical-data/populate
export async function POST(request: NextRequest) {
  try {
    const { sport = 'nfl', seasons = [2024], seasonType = 'postseason', limit = 50 } = await request.json()
    
    const supabase = await createClient()
    
    const sportMap: Record<string, { sport: string; league: string; seasonTypeId: number }> = {
      nfl: { sport: 'football', league: 'nfl', seasonTypeId: seasonType === 'postseason' ? 3 : 2 },
      nba: { sport: 'basketball', league: 'nba', seasonTypeId: seasonType === 'postseason' ? 3 : 2 },
      nhl: { sport: 'hockey', league: 'nhl', seasonTypeId: seasonType === 'postseason' ? 3 : 2 },
      mlb: { sport: 'baseball', league: 'mlb', seasonTypeId: seasonType === 'postseason' ? 3 : 2 },
    }
    
    const config = sportMap[sport]
    if (!config) {
      return NextResponse.json({ error: `Invalid sport: ${sport}` }, { status: 400 })
    }
    
    const results = { processed: 0, stored: 0, errors: 0, games: [] as any[] }
    
    for (const season of seasons) {
      if (sport === 'nfl' && seasonType === 'postseason') {
        for (const week of [1, 2, 3, 5]) {
          const url = ESPN_SCOREBOARD(config.sport, config.league, season, config.seasonTypeId, week)
          
          try {
            const res = await fetch(url)
            if (!res.ok) continue
            
            const data = await res.json()
            const events = data.events || []
            
            for (const event of events.slice(0, limit)) {
              results.processed++
              const stored = await fetchAndStoreGame(
                supabase, config.sport, config.league,
                event.id, event, season, seasonType
              )
              
              if (stored) {
                results.stored++
                results.games.push({ id: event.id, name: event.name, date: event.date })
              } else {
                results.errors++
              }
              
              await new Promise(r => setTimeout(r, 200))
            }
          } catch (error) {
            console.error(`Error fetching ${sport} ${season} week ${week}:`, error)
          }
        }
      } else {
        const url = ESPN_SCOREBOARD(config.sport, config.league, season, config.seasonTypeId)
        
        try {
          const res = await fetch(url)
          if (!res.ok) continue
          
          const data = await res.json()
          const events = data.events || []
          
          for (const event of events.slice(0, limit)) {
            results.processed++
            const stored = await fetchAndStoreGame(
              supabase, config.sport, config.league,
              event.id, event, season, seasonType
            )
            
            if (stored) {
              results.stored++
              results.games.push({ id: event.id, name: event.name, date: event.date })
            } else {
              results.errors++
            }
            
            await new Promise(r => setTimeout(r, 200))
          }
        } catch (error) {
          console.error(`Error fetching ${sport} ${season}:`, error)
        }
      }
    }
    
    return NextResponse.json({
      success: true,
      sport,
      seasons,
      seasonType,
      results,
      timestamp: new Date().toISOString(),
    })
    
  } catch (error) {
    console.error('Historical data population error:', error)
    return NextResponse.json({ error: 'Failed to populate historical data' }, { status: 500 })
  }
}

// GET /api/historical-data/populate
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const sport = searchParams.get('sport')
  
  const supabase = await createClient()
  
  let query = supabase.from('historical_games').select('sport, season_year, season_type', { count: 'exact' })
  
  if (sport) {
    query = query.ilike('sport', sport)
  }
  
  const { data, count, error } = await query
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  const summary: Record<string, Record<number, Record<string, number>>> = {}
  
  for (const row of data || []) {
    const s = row.sport?.toLowerCase() || 'unknown'
    if (!summary[s]) summary[s] = {}
    if (!summary[s][row.season_year]) summary[s][row.season_year] = {}
    if (!summary[s][row.season_year][row.season_type]) {
      summary[s][row.season_year][row.season_type] = 0
    }
    summary[s][row.season_year][row.season_type]++
  }
  
  return NextResponse.json({
    totalGames: count,
    summary,
    timestamp: new Date().toISOString(),
  })
}
