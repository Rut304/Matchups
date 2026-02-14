/**
 * Daily Game Results Updater
 * 
 * Runs daily at 6 AM UTC (Monday weekly in vercel.json, but designed for daily use).
 * Fetches yesterday's + today's completed games from ESPN for ALL 6 sports 
 * and upserts into historical_games.
 * 
 * Also imports upcoming scheduled games (next 7 days) so users can look ahead.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 300

const ESPN_BASE = 'https://site.api.espn.com/apis/site/v2/sports'

const SPORT_CONFIG: Record<string, { espnPath: string; dbSport: string; limit: number }> = {
  NFL:   { espnPath: 'football/nfl', dbSport: 'nfl', limit: 50 },
  NBA:   { espnPath: 'basketball/nba', dbSport: 'nba', limit: 50 },
  NHL:   { espnPath: 'hockey/nhl', dbSport: 'nhl', limit: 50 },
  MLB:   { espnPath: 'baseball/mlb', dbSport: 'mlb', limit: 50 },
  NCAAF: { espnPath: 'football/college-football', dbSport: 'ncaaf', limit: 200 },
  NCAAB: { espnPath: 'basketball/mens-college-basketball', dbSport: 'ncaab', limit: 200 },
}

function formatDate(d: Date): string {
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`
}

function getSeason(sport: string, gameDate: Date): number {
  const month = gameDate.getMonth()
  const year = gameDate.getFullYear()
  if (sport === 'mlb') return year
  return month < 6 ? year - 1 : year
}

function parseGame(game: any, sport: string) {
  const comp = game.competitions?.[0]
  if (!comp) return null

  const home = comp.competitors?.find((c: any) => c.homeAway === 'home')
  const away = comp.competitors?.find((c: any) => c.homeAway === 'away')
  if (!home || !away) return null

  const isCompleted = game.status?.type?.completed === true
  const state = game.status?.type?.state
  if (state === 'in') return null // Skip in-progress

  const homeScore = isCompleted ? parseInt(home.score || '0') : null
  const awayScore = isCompleted ? parseInt(away.score || '0') : null
  const odds = comp.odds?.[0]
  const spread = odds?.spread ?? null
  const total = odds?.overUnder ?? null

  let spreadResult = null
  let totalResult = null
  if (isCompleted && homeScore !== null && awayScore !== null) {
    if (spread !== null) {
      const adj = homeScore + spread
      spreadResult = adj > awayScore ? 'home_cover' : adj < awayScore ? 'away_cover' : 'push'
    }
    if (total !== null) {
      const pts = homeScore + awayScore
      totalResult = pts > total ? 'over' : pts < total ? 'under' : 'push'
    }
  }

  const seasonTypeId = game.season?.type
  let seasonType = 'regular'
  if (!isCompleted) seasonType = 'scheduled'
  else if (seasonTypeId === 3) seasonType = 'postseason'
  else if (seasonTypeId === 4) seasonType = 'offseason'

  const gameDate = new Date(game.date)
  const season = getSeason(sport, gameDate)

  return {
    espn_game_id: game.id,
    sport,
    season,
    season_type: seasonType,
    season_year: season,
    game_date: game.date?.split('T')[0] || null,
    home_team_id: home.team?.id || '',
    home_team_name: home.team?.displayName || '',
    home_team_abbr: home.team?.abbreviation || '',
    home_team: home.team?.displayName || '',
    home_team_abbrev: home.team?.abbreviation || '',
    away_team_id: away.team?.id || '',
    away_team_name: away.team?.displayName || '',
    away_team_abbr: away.team?.abbreviation || '',
    away_team: away.team?.displayName || '',
    away_team_abbrev: away.team?.abbreviation || '',
    home_score: homeScore ?? 0,
    away_score: awayScore ?? 0,
    venue: comp.venue?.fullName ?? null,
    attendance: comp.attendance ?? null,
    total_points: (homeScore ?? 0) + (awayScore ?? 0),
    point_spread: spread,
    over_under: total,
    spread_result: spreadResult,
    total_result: totalResult,
    is_neutral_site: comp.neutralSite ?? false,
    primetime_game: false,
    divisional_game: false,
  }
}

async function fetchDay(espnPath: string, date: string, limit: number): Promise<any[]> {
  try {
    const res = await fetch(`${ESPN_BASE}/${espnPath}/scoreboard?dates=${date}&limit=${limit}`, { cache: 'no-store' })
    if (!res.ok) return []
    const data = await res.json()
    return data.events || []
  } catch { return [] }
}

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const results: Record<string, { completed: number; scheduled: number }> = {}
  const errors: string[] = []

  // 3 days back + 7 days forward
  const now = new Date()
  const startDate = new Date(now); startDate.setDate(startDate.getDate() - 3)
  const endDate = new Date(now); endDate.setDate(endDate.getDate() + 7)

  for (const [sportKey, config] of Object.entries(SPORT_CONFIG)) {
    let completed = 0, scheduled = 0
    try {
      const current = new Date(startDate)
      const allRecords: any[] = []

      while (current <= endDate) {
        const events = await fetchDay(config.espnPath, formatDate(current), config.limit)
        for (const game of events) {
          const record = parseGame(game, config.dbSport)
          if (record) allRecords.push(record)
        }
        current.setDate(current.getDate() + 1)
        await new Promise(r => setTimeout(r, 50))
      }

      // Deduplicate
      const deduped = new Map<string, any>()
      for (const r of allRecords) deduped.set(r.espn_game_id, r)
      const unique = Array.from(deduped.values())

      // Upsert in chunks of 50
      for (let i = 0; i < unique.length; i += 50) {
        const batch = unique.slice(i, i + 50)
        const { error } = await supabase
          .from('historical_games')
          .upsert(batch, { onConflict: 'espn_game_id' })
        if (error) errors.push(`${sportKey}: ${error.message}`)
        else for (const r of batch) r.season_type === 'scheduled' ? scheduled++ : completed++
      }
    } catch (err: any) {
      errors.push(`${sportKey}: ${err.message}`)
    }
    results[sportKey] = { completed, scheduled }
  }

  return NextResponse.json({
    success: true,
    timestamp: new Date().toISOString(),
    total_completed: Object.values(results).reduce((s, r) => s + r.completed, 0),
    total_scheduled: Object.values(results).reduce((s, r) => s + r.scheduled, 0),
    by_sport: results,
    errors: errors.length > 0 ? errors : undefined,
  })
}
