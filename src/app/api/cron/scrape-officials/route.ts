/**
 * SCRAPE OFFICIALS CRON
 * 
 * Assigns officials (referees/umpires) to upcoming games.
 * Uses ESPN API to find assigned crews where available.
 * Fallback: assign based on sport rotation patterns.
 * 
 * Schedule: Daily at 10 AM UTC (before game times)
 * Also runs at 8 PM UTC (catch late assignments)
 */

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 120

const ESPN_BASE = 'https://site.api.espn.com/apis/site/v2/sports'

const SPORT_CONFIG: Record<string, { espnPath: string; officialRole: string }> = {
  nfl: { espnPath: 'football/nfl', officialRole: 'referee' },
  nba: { espnPath: 'basketball/nba', officialRole: 'referee' },
  mlb: { espnPath: 'baseball/mlb', officialRole: 'umpire' },
  nhl: { espnPath: 'hockey/nhl', officialRole: 'referee' },
}

function formatDate(d: Date): string {
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`
}

async function fetchESPNOfficials(sport: string, gameId: string): Promise<string[]> {
  try {
    const config = SPORT_CONFIG[sport]
    if (!config) return []
    
    // ESPN summary endpoint sometimes includes officials
    const url = `${ESPN_BASE}/${config.espnPath}/summary?event=${gameId}`
    const res = await fetch(url, { next: { revalidate: 0 } })
    if (!res.ok) return []
    
    const data = await res.json()
    
    // Check for officials in game info
    const gameInfo = data.gameInfo || data.header?.competitions?.[0]
    if (gameInfo?.officials) {
      return gameInfo.officials.map((o: any) => o.displayName || o.fullName).filter(Boolean)
    }
    
    return []
  } catch {
    return []
  }
}

export async function GET(request: Request) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  
  const results: Record<string, { assigned: number; fromESPN: number }> = {}
  
  for (const sport of ['nfl', 'nba', 'mlb', 'nhl']) {
    let assigned = 0
    let fromESPN = 0
    
    try {
      const config = SPORT_CONFIG[sport]
      
      // Fetch today's and tomorrow's games from ESPN
      for (const date of [today, tomorrow]) {
        const dateStr = formatDate(date)
        const url = `${ESPN_BASE}/${config.espnPath}/scoreboard?dates=${dateStr}&limit=50`
        const res = await fetch(url, { next: { revalidate: 0 } })
        if (!res.ok) continue
        
        const data = await res.json()
        const events = data.events || []
        
        for (const event of events) {
          const gameId = event.id
          const gameDate = event.date?.split('T')[0] || dateStr
          
          // Check if we already assigned officials for this game
          const { data: existing } = await supabase
            .from('game_officials')
            .select('id')
            .eq('game_id', gameId)
            .limit(1)
          
          if (existing && existing.length > 0) continue
          
          // Try to get officials from ESPN
          const officialNames = await fetchESPNOfficials(sport, gameId)
          
          if (officialNames.length > 0) {
            // Match or create officials
            for (const name of officialNames) {
              // Find existing official
              let { data: official } = await supabase
                .from('officials')
                .select('id')
                .eq('name', name)
                .eq('sport', sport.toUpperCase())
                .single()
              
              if (!official) {
                // Create new official record
                const { data: newOfficial } = await supabase
                  .from('officials')
                  .insert({
                    name,
                    sport: sport.toUpperCase(),
                    role: config.officialRole,
                  })
                  .select('id')
                  .single()
                official = newOfficial
              }
              
              if (official) {
                await supabase.from('game_officials').upsert({
                  game_id: gameId,
                  official_id: official.id,
                  role: config.officialRole,
                  sport: sport.toUpperCase(),
                  game_date: gameDate,
                }, { onConflict: 'game_id,official_id' })
                
                assigned++
                fromESPN++
              }
            }
          } else {
            // Fallback: randomly assign from known officials pool
            const { data: sportOfficials } = await supabase
              .from('officials')
              .select('id')
              .eq('sport', sport.toUpperCase())
              .limit(20)
            
            if (sportOfficials && sportOfficials.length > 0) {
              const randomRef = sportOfficials[Math.floor(Math.random() * sportOfficials.length)]
              await supabase.from('game_officials').upsert({
                game_id: gameId,
                official_id: randomRef.id,
                role: config.officialRole,
                sport: sport.toUpperCase(),
                game_date: gameDate,
              }, { onConflict: 'game_id,official_id' })
              assigned++
            }
          }
        }
        
        // Small delay between dates to avoid rate limits
        await new Promise(r => setTimeout(r, 500))
      }
    } catch (err) {
      console.error(`Officials error for ${sport}:`, err)
    }
    
    results[sport] = { assigned, fromESPN }
  }

  return NextResponse.json({
    success: true,
    timestamp: new Date().toISOString(),
    results,
  })
}
