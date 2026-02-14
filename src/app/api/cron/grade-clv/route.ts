/**
 * Cron Job: Grade CLV (Closing Line Value)
 * 
 * Runs after games complete to:
 * 1. Mark the last line_snapshot as is_closing for finished games
 * 2. Compute CLV for user picks in user_picks_clv
 * 3. Update picks table with CLV data if applicable
 * 
 * Schedule: Runs with grade-picks (3x daily: 8am, 2pm, 8pm UTC)
 */

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export const runtime = 'nodejs'
export const maxDuration = 60

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getSupabase()
  const startTime = Date.now()

  try {
    // ---- Step 1: Mark closing lines for games that started in the last 24h ----
    // Find game_ids in line_snapshots that have snapshots but no is_closing=true yet
    // We consider a game "closed" if its game_date is in the past
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    
    // Get distinct game_ids from recent snapshots that don't have closing lines marked
    const { data: recentGames } = await supabase
      .from('line_snapshots')
      .select('game_id')
      .gte('snapshot_ts', yesterday)
      .eq('is_closing', false)
      .limit(500)
    
    const gameIds = [...new Set((recentGames || []).map(g => g.game_id))]
    let closingMarked = 0
    
    for (const gameId of gameIds) {
      // Check if this game already has a closing line
      const { data: existing } = await supabase
        .from('line_snapshots')
        .select('id')
        .eq('game_id', gameId)
        .eq('is_closing', true)
        .limit(1)
      
      if (existing && existing.length > 0) continue // Already has closing
      
      // Get the latest snapshot for this game (this IS the closing line)
      const { data: latestSnapshot } = await supabase
        .from('line_snapshots')
        .select('id, snapshot_ts')
        .eq('game_id', gameId)
        .order('snapshot_ts', { ascending: false })
        .limit(1)
      
      if (latestSnapshot && latestSnapshot.length > 0) {
        // Check if we have at least 2 snapshots (game was tracked) and the latest
        // is older than 3 hours (game likely started)
        const latestTs = new Date(latestSnapshot[0].snapshot_ts)
        const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000)
        
        if (latestTs < threeHoursAgo) {
          await supabase
            .from('line_snapshots')
            .update({ is_closing: true })
            .eq('id', latestSnapshot[0].id)
          
          closingMarked++
        }
      }
    }
    
    // ---- Step 2: Grade CLV for user picks ----
    // Find user_picks_clv entries that don't have CLV calculated yet
    const { data: ungradedPicks } = await supabase
      .from('user_picks_clv')
      .select('id, game_id, pick_type, pick_side, pick_line, pick_odds')
      .is('clv_points', null)
      .limit(200)
    
    let clvGraded = 0
    
    if (ungradedPicks && ungradedPicks.length > 0) {
      for (const pick of ungradedPicks) {
        // Get closing line for this game
        const { data: closingLine } = await supabase
          .from('line_snapshots')
          .select('spread_home, spread_away, total_line, home_ml, away_ml')
          .eq('game_id', pick.game_id)
          .order('snapshot_ts', { ascending: false })
          .limit(1)
        
        if (!closingLine || closingLine.length === 0) continue
        
        const closing = closingLine[0]
        
        // Get opening line too
        const { data: openingLine } = await supabase
          .from('line_snapshots')
          .select('spread_home, total_line, home_ml, away_ml')
          .eq('game_id', pick.game_id)
          .order('snapshot_ts', { ascending: true })
          .limit(1)
        
        const opening = openingLine?.[0] || null
        
        // Calculate CLV based on pick type
        let clvPoints: number | null = null
        let closingVal: number | null = null
        let openingVal: number | null = null

        switch (pick.pick_type) {
          case 'spread': {
            const pickLine = pick.pick_line || 0
            if (pick.pick_side === 'home') {
              closingVal = closing.spread_home
              openingVal = opening?.spread_home || null
              if (closingVal != null) {
                // Getting more points (more positive spread) is better for home
                clvPoints = pickLine - closingVal
              }
            } else {
              closingVal = closing.spread_away
              openingVal = opening?.spread_home ? -opening.spread_home : null
              if (closingVal != null) {
                clvPoints = pickLine - closingVal
              }
            }
            break
          }
          case 'total': {
            const pickLine = pick.pick_line || 0
            closingVal = closing.total_line
            openingVal = opening?.total_line || null
            if (closingVal != null) {
              if (pick.pick_side === 'over') {
                // For overs, getting a lower line is better
                clvPoints = closingVal - pickLine
              } else {
                // For unders, getting a higher line is better
                clvPoints = pickLine - closingVal
              }
            }
            break
          }
          case 'moneyline': {
            // CLV for moneyline is measured in implied probability
            const pickOdds = pick.pick_odds || -110
            if (pick.pick_side === 'home') {
              closingVal = closing.home_ml
            } else {
              closingVal = closing.away_ml
            }
            if (closingVal != null) {
              const pickProb = oddsToImpliedProb(pickOdds)
              const closeProb = oddsToImpliedProb(closingVal)
              // Positive CLV = you got better odds than the closing line
              clvPoints = (closeProb - pickProb) * 100 // in percentage points
            }
            break
          }
        }
        
        if (clvPoints !== null) {
          await supabase
            .from('user_picks_clv')
            .update({
              clv_points: Math.round(clvPoints * 100) / 100,
              close_line: closingVal,
              open_line: openingVal,
              beat_close: clvPoints > 0,
              updated_at: new Date().toISOString(),
            })
            .eq('id', pick.id)
          
          clvGraded++
        }
      }
    }
    
    // ---- Step 3: Also compute CLV for graded picks (picks table) ----
    // Find recently graded picks that have line data
    const { data: gradedPicks } = await supabase
      .from('picks')
      .select('id, game_id, sport, bet_type, pick_team, line, home_team')
      .not('result', 'eq', 'pending')
      .is('clv', null)
      .gte('graded_at', new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString())
      .limit(200)
    
    let picksClvUpdated = 0
    
    if (gradedPicks && gradedPicks.length > 0) {
      for (const pick of gradedPicks) {
        // Try to find matching line_snapshot game_id
        // Game IDs from picks use ESPN IDs, line_snapshots use dk_/fd_ prefix
        // Try matching by searching for the game_id in line_snapshots
        const possibleGameIds = [
          pick.game_id,
          `dk_${pick.game_id}`,
          `fd_${pick.game_id}`,
        ]
        
        let closingSpread: number | null = null
        let closingTotal: number | null = null
        
        for (const gid of possibleGameIds) {
          const { data: snapshot } = await supabase
            .from('line_snapshots')
            .select('spread_home, total_line, home_ml, away_ml')
            .eq('game_id', gid)
            .order('snapshot_ts', { ascending: false })
            .limit(1)
          
          if (snapshot && snapshot.length > 0) {
            closingSpread = snapshot[0].spread_home
            closingTotal = snapshot[0].total_line
            break
          }
        }
        
        if (closingSpread == null && closingTotal == null) continue
        
        // Calculate CLV based on bet type
        let clvValue: number | null = null
        
        if (pick.bet_type === 'spread' && closingSpread != null && pick.line != null) {
          const isHome = pick.pick_team?.toLowerCase().includes(pick.home_team?.toLowerCase() || '')
          if (isHome) {
            clvValue = pick.line - closingSpread
          } else {
            clvValue = (-pick.line) - (-closingSpread)
          }
        } else if (pick.bet_type === 'total' && closingTotal != null && pick.line != null) {
          clvValue = Math.abs(pick.line - closingTotal)
          // Getting better number = positive CLV
          if (pick.pick_team?.toLowerCase().includes('over')) {
            clvValue = closingTotal - pick.line
          } else {
            clvValue = pick.line - closingTotal
          }
        }
        
        if (clvValue !== null) {
          await supabase
            .from('picks')
            .update({ clv: Math.round(clvValue * 100) / 100 })
            .eq('id', pick.id)
          
          picksClvUpdated++
        }
      }
    }
    
    const duration = Date.now() - startTime
    
    return NextResponse.json({
      status: 'success',
      closingLinesMarked: closingMarked,
      userPicksCLVGraded: clvGraded,
      picksWithCLV: picksClvUpdated,
      gameIdsChecked: gameIds.length,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[Cron] Grade CLV error:', error)
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 })
  }
}

function oddsToImpliedProb(odds: number): number {
  if (odds < 0) {
    return Math.abs(odds) / (Math.abs(odds) + 100)
  }
  return 100 / (odds + 100)
}
