// =============================================================================
// CRON: Refresh Live Scores
// Runs every 2 minutes to fetch latest game scores
// =============================================================================

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Verify cron secret to prevent unauthorized access
function verifyCron(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return false
  }
  return true
}

// ESPN API endpoints for live scores
const ESPN_ENDPOINTS: Record<string, string> = {
  nfl: 'https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard',
  nba: 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard',
  nhl: 'https://site.api.espn.com/apis/site/v2/sports/hockey/nhl/scoreboard',
  mlb: 'https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/scoreboard',
}

export async function GET(request: Request) {
  // In production, verify the cron secret
  if (process.env.NODE_ENV === 'production' && !verifyCron(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const startTime = Date.now()
  const results: Record<string, unknown> = {}

  try {
    for (const [sport, endpoint] of Object.entries(ESPN_ENDPOINTS)) {
      try {
        const response = await fetch(endpoint, { next: { revalidate: 0 } })
        
        if (!response.ok) {
          results[sport] = { error: `ESPN API error: ${response.status}` }
          continue
        }

        const data = await response.json()
        const events = data.events || []
        
        for (const event of events) {
          const competition = event.competitions?.[0]
          if (!competition) continue
          
          const homeTeam = competition.competitors?.find((c: any) => c.homeAway === 'home')
          const awayTeam = competition.competitors?.find((c: any) => c.homeAway === 'away')
          
          if (!homeTeam || !awayTeam) continue

          // Determine game status
          let status: 'scheduled' | 'live' | 'final' | 'postponed' = 'scheduled'
          const statusType = competition.status?.type?.name
          if (statusType === 'STATUS_IN_PROGRESS' || statusType === 'STATUS_HALFTIME') {
            status = 'live'
          } else if (statusType === 'STATUS_FINAL' || statusType === 'STATUS_FINAL_OT') {
            status = 'final'
          } else if (statusType === 'STATUS_POSTPONED' || statusType === 'STATUS_CANCELED') {
            status = 'postponed'
          }

          const { error } = await supabase.from('games').upsert({
            external_id: event.id,
            sport,
            home_team_id: null, // Would need to map to our team IDs
            away_team_id: null,
            home_team_name: homeTeam.team?.displayName || homeTeam.team?.name,
            away_team_name: awayTeam.team?.displayName || awayTeam.team?.name,
            home_score: parseInt(homeTeam.score) || 0,
            away_score: parseInt(awayTeam.score) || 0,
            status,
            game_time: event.date,
            quarter: competition.status?.period,
            clock: competition.status?.displayClock,
            venue: competition.venue?.fullName,
            broadcast: competition.broadcasts?.[0]?.names?.[0],
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'external_id'
          })

          if (error) {
            console.error(`Error upserting game ${event.id}:`, error)
          }
        }

        results[sport] = { 
          success: true, 
          gamesUpdated: events.length,
          liveGames: events.filter((e: any) => 
            e.competitions?.[0]?.status?.type?.name === 'STATUS_IN_PROGRESS'
          ).length
        }
      } catch (err) {
        results[sport] = { error: String(err) }
      }
    }

    return NextResponse.json({
      success: true,
      duration: `${Date.now() - startTime}ms`,
      results,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Cron refresh-scores error:', error)
    return NextResponse.json({
      success: false,
      error: String(error),
      duration: `${Date.now() - startTime}ms`
    }, { status: 500 })
  }
}
