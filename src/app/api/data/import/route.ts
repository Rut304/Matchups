/**
 * Historical Data Import API
 * 
 * Imports historical games from ESPN into Supabase by fetching day-by-day.
 * ESPN's public API provides completed game data via scoreboard endpoint.
 * 
 * POST /api/data/import - Import historical data
 * GET /api/data/import - Get import status
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import * as espn from '@/lib/api/espn'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

type Sport = 'NFL' | 'NBA' | 'NHL' | 'MLB'

interface ImportResult {
  sport: string
  season: number
  imported: number
  errors: number
  duration: number
}

interface GameRecord {
  id: string
  sport: Sport
  season: number
  season_type: string
  game_date: string
  home_team: string
  away_team: string
  home_team_id: string
  away_team_id: string
  home_score: number
  away_score: number
  status: string
  venue: string | null
  closing_spread: number | null
  closing_total: number | null
  spread_result: 'home_cover' | 'away_cover' | 'push' | null
  total_result: 'over' | 'under' | 'push' | null
  home_covered: boolean | null
}

// Get season date ranges
function getSeasonDates(sport: Sport, season: number): { start: Date; end: Date } {
  switch (sport) {
    case 'NFL':
      // NFL: September to February
      return {
        start: new Date(season, 8, 1), // September
        end: new Date(season + 1, 1, 15), // Mid-February
      }
    case 'NBA':
      // NBA: October to June
      return {
        start: new Date(season, 9, 1), // October
        end: new Date(season + 1, 5, 30), // June
      }
    case 'NHL':
      // NHL: October to June
      return {
        start: new Date(season, 9, 1), // October
        end: new Date(season + 1, 5, 30), // June
      }
    case 'MLB':
      // MLB: March to November
      return {
        start: new Date(season, 2, 1), // March
        end: new Date(season, 10, 15), // Mid-November
      }
    default:
      return { start: new Date(season, 0, 1), end: new Date(season, 11, 31) }
  }
}

// Format date for ESPN API
function formatDate(date: Date): string {
  return `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`
}

// Helper to parse ESPN game into our record format
function parseESPNGame(game: espn.ESPNGame, sport: Sport, season: number): GameRecord | null {
  const competition = game.competitions[0]
  if (!competition) return null

  const homeComp = competition.competitors.find(c => c.homeAway === 'home')
  const awayComp = competition.competitors.find(c => c.homeAway === 'away')
  if (!homeComp || !awayComp) return null

  const homeScore = parseInt(homeComp.score || '0')
  const awayScore = parseInt(awayComp.score || '0')
  
  // Get odds if available
  const odds = competition.odds?.[0]
  const spread = odds?.spread ?? null
  const total = odds?.overUnder ?? null

  return {
    id: game.id,
    sport,
    season,
    season_type: game.status.type.name?.toLowerCase().includes('post') ? 'postseason' : 'regular',
    game_date: game.date,
    home_team: homeComp.team.displayName,
    away_team: awayComp.team.displayName,
    home_team_id: homeComp.team.id,
    away_team_id: awayComp.team.id,
    home_score: homeScore,
    away_score: awayScore,
    status: game.status.type.completed ? 'final' : game.status.type.state,
    venue: competition.venue?.fullName ?? null,
    closing_spread: spread,
    closing_total: total,
    spread_result: calculateSpreadResult(homeScore, awayScore, spread),
    total_result: calculateTotalResult(homeScore, awayScore, total),
    home_covered: didHomeCover(homeScore, awayScore, spread),
  }
}

function calculateSpreadResult(
  homeScore: number,
  awayScore: number,
  spread: number | null
): 'home_cover' | 'away_cover' | 'push' | null {
  if (spread === null) return null
  
  // Spread is typically expressed from home team's perspective
  // Negative spread means home is favored
  const homeAdjusted = homeScore + spread
  if (homeAdjusted > awayScore) return 'home_cover'
  if (homeAdjusted < awayScore) return 'away_cover'
  return 'push'
}

function calculateTotalResult(
  homeScore: number,
  awayScore: number,
  total: number | null
): 'over' | 'under' | 'push' | null {
  if (total === null) return null
  
  const actualTotal = homeScore + awayScore
  if (actualTotal > total) return 'over'
  if (actualTotal < total) return 'under'
  return 'push'
}

function didHomeCover(
  homeScore: number,
  awayScore: number,
  spread: number | null
): boolean | null {
  if (spread === null) return null
  
  const homeAdjusted = homeScore + spread
  return homeAdjusted > awayScore
}

// Import games for a date range by fetching each day
async function importDateRange(
  sport: Sport,
  season: number,
  startDate: Date,
  endDate: Date,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any
): Promise<ImportResult> {
  const startTime = Date.now()
  let imported = 0
  let errors = 0
  const allRecords: GameRecord[] = []

  const currentDate = new Date(startDate)
  
  while (currentDate <= endDate) {
    const dateStr = formatDate(currentDate)
    
    try {
      // Fetch scoreboard for this date
      const scoreboard = await espn.getScoreboard(sport, dateStr)
      
      if (scoreboard.events && scoreboard.events.length > 0) {
        for (const game of scoreboard.events) {
          // Only include completed games
          if (game.status.type.completed) {
            const record = parseESPNGame(game, sport, season)
            if (record) {
              allRecords.push(record)
            }
          }
        }
      }
    } catch (err) {
      console.error(`Error fetching ${sport} ${dateStr}:`, err)
    }

    // Move to next day
    currentDate.setDate(currentDate.getDate() + 1)
    
    // Rate limiting: small delay between requests
    await new Promise(resolve => setTimeout(resolve, 100))
  }

  // Insert records in batches
  const batchSize = 100
  for (let i = 0; i < allRecords.length; i += batchSize) {
    const batch = allRecords.slice(i, i + batchSize)
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('historical_games')
      .upsert(batch, { onConflict: 'id' })
    
    if (error) {
      console.error(`Insert error for ${sport} ${season}:`, error)
      errors += batch.length
    } else {
      imported += batch.length
    }
  }

  return {
    sport,
    season,
    imported,
    errors,
    duration: Date.now() - startTime,
  }
}

export async function POST(request: NextRequest) {
  // Verify authorization
  const authHeader = request.headers.get('authorization')
  const adminSecret = process.env.ADMIN_SECRET
  
  if (adminSecret && authHeader !== `Bearer ${adminSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const {
      sport,
      startYear = 2023,
      endYear = new Date().getFullYear(),
      dryRun = false,
    } = body

    if (!sport || !['NFL', 'NBA', 'NHL', 'MLB'].includes(sport)) {
      return NextResponse.json({
        error: 'Invalid sport. Use NFL, NBA, NHL, or MLB',
      }, { status: 400 })
    }

    if (dryRun) {
      return NextResponse.json({
        status: 'dry-run',
        sport,
        startYear,
        endYear,
        message: 'Would import data for these seasons',
      })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const results: ImportResult[] = []

    for (let year = startYear; year <= endYear; year++) {
      console.log(`Importing ${sport} ${year}...`)
      
      const { start, end } = getSeasonDates(sport as Sport, year)
      const now = new Date()
      const effectiveEnd = end > now ? now : end
      
      const result = await importDateRange(
        sport as Sport,
        year,
        start,
        effectiveEnd,
        supabase
      )
      results.push(result)
      
      // Small delay between seasons
      await new Promise(resolve => setTimeout(resolve, 1000))
    }

    const totalImported = results.reduce((sum, r) => sum + r.imported, 0)
    const totalErrors = results.reduce((sum, r) => sum + r.errors, 0)

    return NextResponse.json({
      status: 'complete',
      sport,
      startYear,
      endYear,
      totalImported,
      totalErrors,
      results,
    })
  } catch (error) {
    console.error('Import error:', error)
    return NextResponse.json({
      error: 'Import failed',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 })
  }
}

// GET endpoint for import status
export async function GET() {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Get counts by sport and season
    const { data, error } = await supabase
      .from('historical_games')
      .select('sport, season')
    
    if (error) throw error

    // Aggregate counts
    const counts: Record<string, Record<number, number>> = {}
    for (const row of (data || [])) {
      if (!counts[row.sport]) counts[row.sport] = {}
      counts[row.sport][row.season] = (counts[row.sport][row.season] || 0) + 1
    }

    return NextResponse.json({
      status: 'ok',
      totalGames: data?.length || 0,
      bySportAndSeason: counts,
    })
  } catch (error) {
    return NextResponse.json({
      error: 'Failed to get import status',
    }, { status: 500 })
  }
}
