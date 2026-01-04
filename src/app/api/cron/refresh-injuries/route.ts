// =============================================================================
// CRON: Refresh Injuries
// Runs every 15 minutes to fetch latest injury reports
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

// ESPN API endpoints for injuries
const ESPN_INJURIES: Record<string, string> = {
  nfl: 'https://site.api.espn.com/apis/site/v2/sports/football/nfl/injuries',
  nba: 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba/injuries',
  nhl: 'https://site.api.espn.com/apis/site/v2/sports/hockey/nhl/injuries',
  mlb: 'https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/injuries',
}

export async function GET(request: Request) {
  // In production, verify the cron secret
  if (process.env.NODE_ENV === 'production' && !verifyCron(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const startTime = Date.now()
  const results: Record<string, unknown> = {}

  try {
    for (const [sport, endpoint] of Object.entries(ESPN_INJURIES)) {
      try {
        const response = await fetch(endpoint, { next: { revalidate: 0 } })
        
        if (!response.ok) {
          results[sport] = { error: `ESPN API error: ${response.status}` }
          continue
        }

        const data = await response.json()
        let injuriesUpdated = 0
        
        // First clear old injuries for this sport that are no longer relevant
        const { error: deleteError } = await supabase
          .from('injuries')
          .delete()
          .eq('sport', sport)
          .lt('updated_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

        if (deleteError) {
          console.error(`Error cleaning old injuries:`, deleteError)
        }
        
        // Parse injuries by team
        const teams = data.teams || data.items || []
        
        for (const teamData of teams) {
          const team = teamData.team
          if (!team) continue
          
          const injuries = teamData.injuries || []
          
          for (const injury of injuries) {
            const athlete = injury.athlete
            if (!athlete) continue

            // Map injury status
            let status = 'questionable'
            const statusText = (injury.status || injury.type?.name || '').toLowerCase()
            if (statusText.includes('out') || statusText.includes('ir')) {
              status = 'out'
            } else if (statusText.includes('doubtful')) {
              status = 'doubtful'
            } else if (statusText.includes('probable')) {
              status = 'probable'
            } else if (statusText.includes('day-to-day') || statusText.includes('dtd')) {
              status = 'day-to-day'
            }

            // Determine impact based on position and status
            let impact: 'high' | 'medium' | 'low' = 'medium'
            const position = athlete.position?.abbreviation || ''
            const highImpactPositions = ['QB', 'C', 'G', 'LW', 'RW', 'D', 'SP', 'RP']
            if (status === 'out' && highImpactPositions.includes(position)) {
              impact = 'high'
            } else if (status === 'probable') {
              impact = 'low'
            }

            const { error } = await supabase.from('injuries').upsert({
              external_id: `${athlete.id}-${sport}`,
              player_name: athlete.displayName || athlete.fullName,
              sport,
              team_id: null,
              team_name: team.displayName || team.name,
              team_abbreviation: team.abbreviation,
              position,
              status,
              injury_type: injury.details?.type || injury.type?.description || 'Unknown',
              description: injury.longComment || injury.shortComment,
              impact,
              updated_at: new Date().toISOString()
            }, {
              onConflict: 'external_id'
            })

            if (error) {
              console.error(`Error upserting injury for ${athlete.displayName}:`, error)
            } else {
              injuriesUpdated++
            }
          }
        }

        results[sport] = { 
          success: true, 
          injuriesUpdated
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
    console.error('Cron refresh-injuries error:', error)
    return NextResponse.json({
      success: false,
      error: String(error),
      duration: `${Date.now() - startTime}ms`
    }, { status: 500 })
  }
}
