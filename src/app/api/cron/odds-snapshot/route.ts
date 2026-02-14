/**
 * Cron Job: Capture Odds Snapshots for CLV Tracking
 * 
 * Runs every 30 minutes via Vercel Cron.
 * Uses The Odds API (reliable, paid) to capture odds from DraftKings + FanDuel.
 * Stores snapshots in line_snapshots for line movement visualization + CLV grading.
 * 
 * Cost: ~1 request per sport per run = 6 requests per 30 min = ~288/day = ~8,640/month
 * Well within 100k/month budget.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const ODDS_API_BASE = 'https://api.the-odds-api.com/v4'

const SPORT_KEYS: Record<string, string> = {
  NFL: 'americanfootball_nfl',
  NBA: 'basketball_nba',
  NHL: 'icehockey_nhl',
  MLB: 'baseball_mlb',
  NCAAF: 'americanfootball_ncaaf',
  NCAAB: 'basketball_ncaab',
}

interface OddsSnapshot {
  game_id: string
  sport: string
  game_date: string | null
  home_team: string
  away_team: string
  provider: string
  spread_home: number | null
  spread_home_odds: number | null
  spread_away: number | null
  spread_away_odds: number | null
  total_line: number | null
  total_over_odds: number | null
  total_under_odds: number | null
  home_ml: number | null
  away_ml: number | null
  is_opening: boolean
  is_closing: boolean
}

async function fetchOddsForSport(sport: string, sportKey: string, apiKey: string): Promise<OddsSnapshot[]> {
  const snapshots: OddsSnapshot[] = []

  try {
    const url = `${ODDS_API_BASE}/sports/${sportKey}/odds?apiKey=${apiKey}&regions=us&markets=h2h,spreads,totals&bookmakers=draftkings,fanduel&dateFormat=iso`
    const res = await fetch(url, { cache: 'no-store' })

    if (!res.ok) {
      if (res.status === 401) {
        console.warn(`[Odds Snapshot] API quota issue for ${sport}`)
        return []
      }
      console.error(`[Odds Snapshot] HTTP ${res.status} for ${sport}`)
      return []
    }

    const remaining = res.headers.get('x-requests-remaining')
    console.log(`[Odds Snapshot] ${sport}: ${remaining} API requests remaining`)

    const games = await res.json()

    for (const game of games) {
      for (const bookmaker of game.bookmakers || []) {
        let spread_home: number | null = null, spread_away: number | null = null
        let spread_home_odds: number | null = null, spread_away_odds: number | null = null
        let total_line: number | null = null, total_over_odds: number | null = null, total_under_odds: number | null = null
        let home_ml: number | null = null, away_ml: number | null = null

        for (const market of bookmaker.markets || []) {
          if (market.key === 'h2h') {
            for (const o of market.outcomes) {
              if (o.name === game.home_team) home_ml = o.price
              else away_ml = o.price
            }
          }
          if (market.key === 'spreads') {
            for (const o of market.outcomes) {
              if (o.name === game.home_team) {
                spread_home = o.point ?? null
                spread_home_odds = o.price
              } else {
                spread_away = o.point ?? null
                spread_away_odds = o.price
              }
            }
          }
          if (market.key === 'totals') {
            for (const o of market.outcomes) {
              if (o.name === 'Over') {
                total_line = o.point ?? null
                total_over_odds = o.price
              } else {
                total_under_odds = o.price
              }
            }
          }
        }

        snapshots.push({
          game_id: game.id, // The Odds API game ID (consistent across snapshots)
          sport,
          game_date: game.commence_time?.split('T')[0] || null,
          home_team: game.home_team,
          away_team: game.away_team,
          provider: bookmaker.key,
          spread_home, spread_home_odds, spread_away, spread_away_odds,
          total_line, total_over_odds, total_under_odds,
          home_ml, away_ml,
          is_opening: false, // Will be set below
          is_closing: false,
        })
      }
    }
  } catch (e) {
    console.error(`[Odds Snapshot] Error for ${sport}:`, e)
  }

  return snapshots
}

async function saveSnapshots(snapshots: OddsSnapshot[]): Promise<number> {
  let saved = 0
  const now = new Date().toISOString()

  // Batch check which game+provider combos already have snapshots (for is_opening)
  const gameProviderPairs = [...new Set(snapshots.map(s => `${s.game_id}|${s.provider}`))]
  const existingSet = new Set<string>()

  // Check in batches of 50
  for (let i = 0; i < gameProviderPairs.length; i += 50) {
    const batch = gameProviderPairs.slice(i, i + 50)
    const gameIds = batch.map(p => p.split('|')[0])

    const { data } = await supabase
      .from('line_snapshots')
      .select('game_id, provider')
      .in('game_id', gameIds)
      .limit(1000)

    if (data) {
      for (const row of data) {
        existingSet.add(`${row.game_id}|${row.provider}`)
      }
    }
  }

  // Batch insert all snapshots
  const toInsert = snapshots.map(snap => ({
    ...snap,
    is_opening: !existingSet.has(`${snap.game_id}|${snap.provider}`),
    snapshot_ts: now,
  }))

  // Insert in batches of 50
  for (let i = 0; i < toInsert.length; i += 50) {
    const batch = toInsert.slice(i, i + 50)
    const { error } = await supabase.from('line_snapshots').insert(batch)
    if (error) {
      console.error('[Odds Snapshot] Insert error:', error.message)
    } else {
      saved += batch.length
    }
  }

  return saved
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}` && process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const apiKey = process.env.THE_ODDS_API_KEY || process.env.ODDS_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'No Odds API key configured' }, { status: 500 })
  }

  // Only fetch sports that are currently in-season
  const month = new Date().getMonth() + 1 // 1-12
  const activeSports: [string, string][] = []

  for (const [sport, key] of Object.entries(SPORT_KEYS)) {
    // Rough in-season check to save API calls
    const inSeason = (() => {
      switch (sport) {
        case 'NFL': return month >= 9 || month <= 2
        case 'NBA': return month >= 10 || month <= 6
        case 'NHL': return month >= 10 || month <= 6
        case 'MLB': return month >= 3 && month <= 11
        case 'NCAAF': return month >= 8 || month <= 1
        case 'NCAAB': return month >= 11 || month <= 4
        default: return true
      }
    })()
    if (inSeason) activeSports.push([sport, key])
  }

  const results: Record<string, number> = {}
  let totalSaved = 0

  for (const [sport, key] of activeSports) {
    const snapshots = await fetchOddsForSport(sport, key, apiKey)
    const saved = await saveSnapshots(snapshots)
    results[sport] = saved
    totalSaved += saved
  }

  return NextResponse.json({
    success: true,
    timestamp: new Date().toISOString(),
    total_saved: totalSaved,
    by_sport: results,
    active_sports: activeSports.map(([s]) => s),
  })
}
