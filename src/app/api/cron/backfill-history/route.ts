import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import * as espn from '@/lib/api/espn'

// Allow this to run for up to 5 minutes
export const maxDuration = 300
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  // In production, you should check for CRON_SECRET. 
  // For this manual trigger, we'll skip strict auth or check a query param if you prefer.
  
  const supabase = await createClient()
  const sport = 'NFL'
  const season = 2024 // Current season

  try {
    const teams = await espn.getTeams(sport)
    let totalGamesProcessed = 0
    const errors: string[] = []

    // Process teams in chunks to avoid timeouts/rate limits
    // For now, we'll do all of them sequentially
    for (const team of teams) {
      try {
        // Fetch schedule for this team
        const schedule = await espn.getTeamSchedule(sport, team.id, season)
        
        const completedGames = schedule.filter((g: any) => 
          g.status.type.completed && 
          g.competitions[0]?.competitors[0]?.score && 
          g.competitions[0]?.competitors[1]?.score
        )

        const gamesToInsert = completedGames.map((game: any) => {
          const comp = game.competitions[0]
          const homeComp = comp.competitors.find((c: any) => c.homeAway === 'home')
          const awayComp = comp.competitors.find((c: any) => c.homeAway === 'away')
          
          if (!homeComp || !awayComp) return null

          const homeScore = parseInt(homeComp.score || '0')
          const awayScore = parseInt(awayComp.score || '0')
          
          // Extract odds if available (ESPN sometimes has them in history)
          const odds = comp.odds?.[0]
          const spread = odds?.spread ?? null
          const total = odds?.overUnder ?? null

          // Calculate total result
          let totalResult = null
          if (total !== null) {
            const combinedScore = homeScore + awayScore
            if (combinedScore > total) totalResult = 'over'
            else if (combinedScore < total) totalResult = 'under'
            else totalResult = 'push'
          }

          return {
            id: game.id,
            sport: sport.toLowerCase(),
            season: season,
            season_type: 'regular',
            game_date: game.date,
            home_team_id: homeComp.team.id,
            home_team_name: homeComp.team.displayName,
            home_team_abbr: homeComp.team.abbreviation,
            away_team_id: awayComp.team.id,
            away_team_name: awayComp.team.displayName,
            away_team_abbr: awayComp.team.abbreviation,
            home_score: homeScore,
            away_score: awayScore,
            point_spread: spread,
            total_points: total,
            total_result: totalResult,
          }
        }).filter(Boolean)

        if (gamesToInsert.length > 0) {
          const { error } = await supabase
            .from('historical_games')
            .upsert(gamesToInsert, { onConflict: 'id' })
          
          if (error) {
            console.error(`Error inserting games for ${team.abbreviation}:`, error)
            errors.push(`${team.abbreviation}: ${error.message}`)
          } else {
            totalGamesProcessed += gamesToInsert.length
          }
        }

      } catch (err) {
        console.error(`Failed to process ${team.abbreviation}`, err)
        errors.push(`${team.abbreviation}: Failed to fetch/process`)
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${totalGamesProcessed} games`,
      errors
    })

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
