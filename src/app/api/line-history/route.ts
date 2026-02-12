/**
 * Line History API - Serves line movement data from Supabase line_snapshots
 * 
 * GET /api/line-history?gameId=xxx[&provider=action_network][&betType=spread]
 * 
 * Returns time-series line data for charts and CLV calculation
 * Source: line_snapshots table (populated by /api/cron/odds-snapshot every 30 min)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface SnapshotRow {
  id: string
  game_id: string
  sport: string
  provider: string
  snapshot_ts: string
  spread_home: number | null
  spread_home_odds: number | null
  total_line: number | null
  total_over_odds: number | null
  total_under_odds: number | null
  home_ml: number | null
  away_ml: number | null
  is_opening: boolean
  is_closing: boolean
  home_team?: string
  away_team?: string
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const gameId = searchParams.get('gameId')
  const provider = searchParams.get('provider')
  const betType = searchParams.get('betType') || 'all' // spread, total, moneyline, all

  if (!gameId) {
    return NextResponse.json({ error: 'gameId parameter required' }, { status: 400 })
  }

  try {
    // Try multiple game ID formats since different sources use different prefixes
    const gameIdVariants = [
      gameId,
      `an_${gameId}`,
      `espn_${gameId}`,
      `dk_${gameId}`,
      `fd_${gameId}`,
      // Also try without prefix if it has one
      gameId.replace(/^(an_|espn_|dk_|fd_)/, ''),
    ]

    let query = supabase
      .from('line_snapshots')
      .select('*')
      .in('game_id', gameIdVariants)
      .order('snapshot_ts', { ascending: true })

    if (provider) {
      query = query.eq('provider', provider)
    }

    const { data: snapshots, error } = await query

    if (error) {
      console.error('[LineHistory] DB error:', error.message)
      return NextResponse.json({ 
        snapshots: [],
        chartData: { spread: [], total: [], moneyline: [] },
        summary: null,
        source: 'supabase',
        error: 'Database query failed'
      })
    }

    if (!snapshots || snapshots.length === 0) {
      return NextResponse.json({
        snapshots: [],
        chartData: { spread: [], total: [], moneyline: [] },
        summary: null,
        source: 'supabase',
        message: 'No line history found for this game. Snapshots are captured every 30 minutes during game hours.'
      })
    }

    // Build chart-ready time series
    const chartData = {
      spread: [] as { time: string; value: number; odds: number; provider: string }[],
      total: [] as { time: string; value: number; overOdds: number; underOdds: number; provider: string }[],
      moneyline: [] as { time: string; home: number; away: number; provider: string }[],
    }

    for (const snap of snapshots as SnapshotRow[]) {
      const time = snap.snapshot_ts

      if ((betType === 'all' || betType === 'spread') && snap.spread_home != null) {
        chartData.spread.push({
          time,
          value: snap.spread_home,
          odds: snap.spread_home_odds || -110,
          provider: snap.provider,
        })
      }

      if ((betType === 'all' || betType === 'total') && snap.total_line != null) {
        chartData.total.push({
          time,
          value: snap.total_line,
          overOdds: snap.total_over_odds || -110,
          underOdds: snap.total_under_odds || -110,
          provider: snap.provider,
        })
      }

      if ((betType === 'all' || betType === 'moneyline') && snap.home_ml != null) {
        chartData.moneyline.push({
          time,
          home: snap.home_ml,
          away: snap.away_ml || 0,
          provider: snap.provider,
        })
      }
    }

    // Calculate summary: opening → current movement
    const first = snapshots[0] as SnapshotRow
    const last = snapshots[snapshots.length - 1] as SnapshotRow

    const summary = {
      totalSnapshots: snapshots.length,
      timespan: {
        first: first.snapshot_ts,
        last: last.snapshot_ts,
      },
      spread: first.spread_home != null && last.spread_home != null ? {
        opening: first.spread_home,
        current: last.spread_home,
        movement: +(last.spread_home - first.spread_home).toFixed(1),
        direction: last.spread_home < first.spread_home ? 'favorite' : last.spread_home > first.spread_home ? 'underdog' : 'stable',
      } : null,
      total: first.total_line != null && last.total_line != null ? {
        opening: first.total_line,
        current: last.total_line,
        movement: +(last.total_line - first.total_line).toFixed(1),
        direction: last.total_line > first.total_line ? 'over' : last.total_line < first.total_line ? 'under' : 'stable',
      } : null,
      moneyline: first.home_ml != null && last.home_ml != null ? {
        openingHome: first.home_ml,
        currentHome: last.home_ml,
        openingAway: first.away_ml,
        currentAway: last.away_ml,
      } : null,
    }

    return NextResponse.json({
      snapshots: snapshots.length,
      chartData,
      summary,
      source: 'supabase',
      lastUpdated: last.snapshot_ts,
    })

  } catch (err) {
    console.error('[LineHistory] Error:', err)
    return NextResponse.json({ 
      snapshots: [],
      chartData: { spread: [], total: [], moneyline: [] },
      summary: null,
      error: 'Failed to fetch line history'
    }, { status: 500 })
  }
}
