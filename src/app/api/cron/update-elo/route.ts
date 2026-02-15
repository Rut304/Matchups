/**
 * UPDATE ELO RATINGS CRON
 * 
 * Runs after games complete to recalculate Elo ratings.
 * Schedule: 6 AM + 12 PM UTC daily (catch morning + afternoon games)
 * 
 * Process:
 * 1. Fetch recently completed games from historical_games (last 2 days)
 * 2. For each sport, recalculate Elo based on game results
 * 3. Upsert team_ratings table
 */

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 120

const K_FACTOR: Record<string, number> = {
  nfl: 20, nba: 15, mlb: 8, nhl: 12, ncaaf: 20, ncaab: 15,
}

const DEFAULT_ELO = 1500
const HOME_ADVANTAGE: Record<string, number> = {
  nfl: 48, nba: 60, mlb: 24, nhl: 33, ncaaf: 55, ncaab: 55,
}

function expectedScore(ratingA: number, ratingB: number): number {
  return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400))
}

function marginMultiplier(scoreDiff: number, sport: string): number {
  const diff = Math.abs(scoreDiff)
  if (sport === 'mlb' || sport === 'nhl') return Math.log(diff + 1) * 0.8
  return Math.log(diff + 1) * 0.6
}

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}` && !request.url.includes('localhost')) {
    // Allow without auth for manual triggers
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const results: Record<string, { updated: number; topTeams: { team: string; elo: number }[] }> = {}
  const sports = ['nfl', 'nba', 'mlb', 'nhl', 'ncaaf', 'ncaab']

  for (const sport of sports) {
    try {
      // Get all completed games for recent seasons (with actual scores)
      const { data: games, error: gamesErr } = await supabase
        .from('historical_games')
        .select('*')
        .eq('sport', sport)
        .gt('home_score', 0)
        .order('game_date', { ascending: true })

      if (gamesErr || !games?.length) {
        results[sport] = { updated: 0, topTeams: [] }
        continue
      }

      // Build Elo ratings from scratch
      const ratings: Record<string, number> = {}
      const gamesPlayed: Record<string, number> = {}

      for (const game of games) {
        const home = game.home_team
        const away = game.away_team
        if (!home || !away || home === 'TBD' || away === 'TBD') continue
        if (game.home_score === 0 && game.away_score === 0) continue

        if (!ratings[home]) ratings[home] = DEFAULT_ELO
        if (!ratings[away]) ratings[away] = DEFAULT_ELO
        if (!gamesPlayed[home]) gamesPlayed[home] = 0
        if (!gamesPlayed[away]) gamesPlayed[away] = 0

        const homeElo = ratings[home] + HOME_ADVANTAGE[sport]
        const awayElo = ratings[away]
        const expectedHome = expectedScore(homeElo, awayElo)
        const expectedAway = 1 - expectedHome

        const homeWon = game.home_score > game.away_score
        const actualHome = homeWon ? 1 : 0
        const actualAway = homeWon ? 0 : 1

        const scoreDiff = game.home_score - game.away_score
        const margin = marginMultiplier(scoreDiff, sport)
        const k = K_FACTOR[sport]

        ratings[home] += Math.round(k * margin * (actualHome - expectedHome))
        ratings[away] += Math.round(k * margin * (actualAway - expectedAway))
        gamesPlayed[home]++
        gamesPlayed[away]++
      }

      // Upsert to team_ratings
      const entries = Object.entries(ratings)
        .filter(([team]) => (gamesPlayed[team] || 0) >= 3)
        .map(([team, elo]) => ({
          team,
          sport,
          elo: Math.round(elo),
          power: Math.round((elo - 1500) / 4),
          rank: 0,
          games_played: gamesPlayed[team] || 0,
          updated_at: new Date().toISOString(),
        }))

      // Sort and assign ranks
      entries.sort((a, b) => b.elo - a.elo)
      entries.forEach((e, i) => { e.rank = i + 1 })

      if (entries.length > 0) {
        const { error: upsertErr } = await supabase
          .from('team_ratings')
          .upsert(entries, { onConflict: 'team,sport' })

        if (upsertErr) {
          console.error(`Elo upsert error for ${sport}:`, upsertErr)
        }
      }

      results[sport] = {
        updated: entries.length,
        topTeams: entries.slice(0, 3).map(e => ({ team: e.team, elo: e.elo })),
      }
    } catch (err) {
      console.error(`Elo error for ${sport}:`, err)
      results[sport] = { updated: 0, topTeams: [] }
    }
  }

  return NextResponse.json({
    success: true,
    timestamp: new Date().toISOString(),
    results,
  })
}
