// =============================================================================
// CRON: Refresh Odds Data
// Runs every 5 minutes to fetch latest betting lines
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

export async function GET(request: Request) {
  // In production, verify the cron secret
  if (process.env.NODE_ENV === 'production' && !verifyCron(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const startTime = Date.now()
  const results: Record<string, unknown> = {}

  try {
    // Fetch odds from The Odds API
    const sports = ['americanfootball_nfl', 'basketball_nba', 'icehockey_nhl', 'baseball_mlb']
    
    for (const sportKey of sports) {
      try {
        const oddsApiKey = process.env.THE_ODDS_API_KEY
        if (!oddsApiKey) {
          results[sportKey] = { error: 'No API key configured' }
          continue
        }

        const response = await fetch(
          `https://api.the-odds-api.com/v4/sports/${sportKey}/odds/?apiKey=${oddsApiKey}&regions=us&markets=spreads,totals,h2h&oddsFormat=american`,
          { next: { revalidate: 0 } }
        )

        if (!response.ok) {
          results[sportKey] = { error: `API error: ${response.status}` }
          continue
        }

        const odds = await response.json()
        
        // Store in Supabase
        const sportMap: Record<string, string> = {
          'americanfootball_nfl': 'nfl',
          'basketball_nba': 'nba',
          'icehockey_nhl': 'nhl',
          'baseball_mlb': 'mlb'
        }
        
        const sport = sportMap[sportKey]
        
        // Upsert odds data
        for (const game of odds) {
          const { error } = await supabase.from('odds').upsert({
            external_game_id: game.id,
            sport,
            home_team: game.home_team,
            away_team: game.away_team,
            commence_time: game.commence_time,
            bookmakers: game.bookmakers,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'external_game_id'
          })
          
          if (error) {
            console.error(`Error upserting odds for ${game.id}:`, error)
          }
        }
        
        results[sportKey] = { success: true, count: odds.length }
      } catch (err) {
        results[sportKey] = { error: String(err) }
      }
    }

    return NextResponse.json({
      success: true,
      duration: `${Date.now() - startTime}ms`,
      results,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Cron refresh-odds error:', error)
    return NextResponse.json({
      success: false,
      error: String(error),
      duration: `${Date.now() - startTime}ms`
    }, { status: 500 })
  }
}
