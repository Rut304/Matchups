// =============================================================================
// CRON: Refresh Standings
// Runs every hour to fetch latest team standings
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

// ESPN API endpoints for standings
const ESPN_STANDINGS: Record<string, string> = {
  nfl: 'https://site.api.espn.com/apis/v2/sports/football/nfl/standings',
  nba: 'https://site.api.espn.com/apis/v2/sports/basketball/nba/standings',
  nhl: 'https://site.api.espn.com/apis/v2/sports/hockey/nhl/standings',
  mlb: 'https://site.api.espn.com/apis/v2/sports/baseball/mlb/standings',
}

export async function GET(request: Request) {
  // In production, verify the cron secret
  if (process.env.NODE_ENV === 'production' && !verifyCron(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const startTime = Date.now()
  const results: Record<string, unknown> = {}

  try {
    for (const [sport, endpoint] of Object.entries(ESPN_STANDINGS)) {
      try {
        const response = await fetch(endpoint, { next: { revalidate: 0 } })
        
        if (!response.ok) {
          results[sport] = { error: `ESPN API error: ${response.status}` }
          continue
        }

        const data = await response.json()
        let teamsUpdated = 0
        
        // Parse standings based on sport structure
        const children = data.children || []
        
        for (const conference of children) {
          const conferenceName = conference.name || conference.abbreviation
          const standings = conference.standings?.entries || []
          
          for (const entry of standings) {
            const team = entry.team
            if (!team) continue
            
            // Extract stats
            const stats = entry.stats || []
            const getStatValue = (name: string) => {
              const stat = stats.find((s: any) => s.name === name || s.abbreviation === name)
              return stat?.value ?? stat?.displayValue ?? 0
            }

            const { error } = await supabase.from('teams').upsert({
              external_id: team.id,
              name: team.displayName || team.name,
              abbreviation: team.abbreviation,
              sport,
              logo_url: team.logos?.[0]?.href,
              conference: conferenceName,
              division: entry.group?.name,
              wins: parseInt(getStatValue('wins')) || 0,
              losses: parseInt(getStatValue('losses')) || 0,
              ties: parseInt(getStatValue('ties')) || 0,
              win_pct: parseFloat(getStatValue('winPercent')) || 0,
              points_for: parseInt(getStatValue('pointsFor')) || 0,
              points_against: parseInt(getStatValue('pointsAgainst')) || 0,
              point_diff: parseInt(getStatValue('pointDifferential')) || 0,
              home_record: getStatValue('homeRecord') || '',
              away_record: getStatValue('awayRecord') || '',
              streak: getStatValue('streak') || '',
              updated_at: new Date().toISOString()
            }, {
              onConflict: 'sport,abbreviation'
            })

            if (error) {
              console.error(`Error upserting team ${team.abbreviation}:`, error)
            } else {
              teamsUpdated++
            }
          }
        }

        results[sport] = { 
          success: true, 
          teamsUpdated
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
    console.error('Cron refresh-standings error:', error)
    return NextResponse.json({
      success: false,
      error: String(error),
      duration: `${Date.now() - startTime}ms`
    }, { status: 500 })
  }
}
