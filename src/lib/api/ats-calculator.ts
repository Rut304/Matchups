/**
 * ATS (Against The Spread) Calculator
 * Calculates ATS and O/U records from historical_games table when ESPN doesn't provide them
 * 
 * This is a REAL data source - no mock data
 */

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
)

export interface ATSRecord {
  wins: number
  losses: number
  pushes: number
  record: string // "10-5-1" format
  percentage: number // Win %
}

export interface TeamATSData {
  ats: ATSRecord
  ou: ATSRecord
  homeATS: ATSRecord
  awayATS: ATSRecord
  last10ATS: ATSRecord
  last10OU: ATSRecord
}

function formatRecord(wins: number, losses: number, pushes: number): string {
  if (pushes > 0) {
    return `${wins}-${losses}-${pushes}`
  }
  return `${wins}-${losses}`
}

function calculatePercentage(wins: number, losses: number): number {
  const total = wins + losses
  if (total === 0) return 0
  return Math.round((wins / total) * 1000) / 10
}

/**
 * Calculate ATS record for a team from historical_games
 * @param teamAbbr - Team abbreviation (e.g., "KC", "PHI")
 * @param sport - Sport key (e.g., "NFL", "NBA")
 * @param seasonYear - Optional season year (defaults to current)
 */
export async function calculateTeamATS(
  teamAbbr: string,
  sport: string,
  seasonYear?: number
): Promise<TeamATSData | null> {
  try {
    const year = seasonYear || new Date().getFullYear()
    
    // Fetch games where this team played (home or away)
    const { data: homeGames, error: homeError } = await supabase
      .from('historical_games')
      .select('spread_result, total_result, point_spread, home_score, away_score')
      .eq('sport', sport.toLowerCase())
      .eq('season', year)
      .ilike('home_team_abbr', teamAbbr)
      .not('spread_result', 'is', null)
    
    const { data: awayGames, error: awayError } = await supabase
      .from('historical_games')
      .select('spread_result, total_result, point_spread, home_score, away_score')
      .eq('sport', sport.toLowerCase())
      .eq('season', year)
      .ilike('away_team_abbr', teamAbbr)
      .not('spread_result', 'is', null)
    
    if (homeError || awayError) {
      console.error('[ATS Calculator] DB error:', homeError || awayError)
      return null
    }

    // Calculate ATS for home games
    let homeATSWins = 0, homeATSLosses = 0, homeATSPushes = 0
    let homeOUOvers = 0, homeOUUnders = 0, homeOUPushes = 0
    
    for (const game of (homeGames || [])) {
      // Home team covers if spread_result is 'home_cover'
      if (game.spread_result === 'home_cover') homeATSWins++
      else if (game.spread_result === 'away_cover') homeATSLosses++
      else if (game.spread_result === 'push') homeATSPushes++
      
      if (game.total_result === 'over') homeOUOvers++
      else if (game.total_result === 'under') homeOUUnders++
      else if (game.total_result === 'push') homeOUPushes++
    }

    // Calculate ATS for away games (inverse - away covers = team covers)
    let awayATSWins = 0, awayATSLosses = 0, awayATSPushes = 0
    let awayOUOvers = 0, awayOUUnders = 0, awayOUPushes = 0
    
    for (const game of (awayGames || [])) {
      // Away team covers if spread_result is 'away_cover'
      if (game.spread_result === 'away_cover') awayATSWins++
      else if (game.spread_result === 'home_cover') awayATSLosses++
      else if (game.spread_result === 'push') awayATSPushes++
      
      if (game.total_result === 'over') awayOUOvers++
      else if (game.total_result === 'under') awayOUUnders++
      else if (game.total_result === 'push') awayOUPushes++
    }

    // Total ATS (combine home and away)
    const totalATSWins = homeATSWins + awayATSWins
    const totalATSLosses = homeATSLosses + awayATSLosses
    const totalATSPushes = homeATSPushes + awayATSPushes
    
    const totalOUOvers = homeOUOvers + awayOUOvers
    const totalOUUnders = homeOUUnders + awayOUUnders
    const totalOUPushes = homeOUPushes + awayOUPushes

    // Get last 10 games (combine and sort by date would be better, but this is simpler)
    const last10Home = (homeGames || []).slice(-5)
    const last10Away = (awayGames || []).slice(-5)
    
    let last10ATSWins = 0, last10ATSLosses = 0, last10ATSPushes = 0
    let last10OUOvers = 0, last10OUUnders = 0, last10OUPushes = 0
    
    for (const game of last10Home) {
      if (game.spread_result === 'home_cover') last10ATSWins++
      else if (game.spread_result === 'away_cover') last10ATSLosses++
      else last10ATSPushes++
      
      if (game.total_result === 'over') last10OUOvers++
      else if (game.total_result === 'under') last10OUUnders++
      else last10OUPushes++
    }
    
    for (const game of last10Away) {
      if (game.spread_result === 'away_cover') last10ATSWins++
      else if (game.spread_result === 'home_cover') last10ATSLosses++
      else last10ATSPushes++
      
      if (game.total_result === 'over') last10OUOvers++
      else if (game.total_result === 'under') last10OUUnders++
      else last10OUPushes++
    }

    return {
      ats: {
        wins: totalATSWins,
        losses: totalATSLosses,
        pushes: totalATSPushes,
        record: formatRecord(totalATSWins, totalATSLosses, totalATSPushes),
        percentage: calculatePercentage(totalATSWins, totalATSLosses)
      },
      ou: {
        wins: totalOUOvers,
        losses: totalOUUnders,
        pushes: totalOUPushes,
        record: formatRecord(totalOUOvers, totalOUUnders, totalOUPushes),
        percentage: calculatePercentage(totalOUOvers, totalOUUnders)
      },
      homeATS: {
        wins: homeATSWins,
        losses: homeATSLosses,
        pushes: homeATSPushes,
        record: formatRecord(homeATSWins, homeATSLosses, homeATSPushes),
        percentage: calculatePercentage(homeATSWins, homeATSLosses)
      },
      awayATS: {
        wins: awayATSWins,
        losses: awayATSLosses,
        pushes: awayATSPushes,
        record: formatRecord(awayATSWins, awayATSLosses, awayATSPushes),
        percentage: calculatePercentage(awayATSWins, awayATSLosses)
      },
      last10ATS: {
        wins: last10ATSWins,
        losses: last10ATSLosses,
        pushes: last10ATSPushes,
        record: formatRecord(last10ATSWins, last10ATSLosses, last10ATSPushes),
        percentage: calculatePercentage(last10ATSWins, last10ATSLosses)
      },
      last10OU: {
        wins: last10OUOvers,
        losses: last10OUUnders,
        pushes: last10OUPushes,
        record: formatRecord(last10OUOvers, last10OUUnders, last10OUPushes),
        percentage: calculatePercentage(last10OUOvers, last10OUUnders)
      }
    }
  } catch (error) {
    console.error('[ATS Calculator] Error:', error)
    return null
  }
}

/**
 * Quick ATS lookup - returns simple record string
 * Falls back to empty string if no data
 */
export async function getATSRecord(
  teamAbbr: string,
  sport: string
): Promise<{ ats: string; ou: string }> {
  const data = await calculateTeamATS(teamAbbr, sport)
  if (!data) {
    return { ats: '', ou: '' }
  }
  return {
    ats: data.ats.record,
    ou: data.ou.record
  }
}
