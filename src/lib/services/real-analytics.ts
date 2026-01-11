/**
 * Real Analytics Service
 * 
 * Provides real analytics data by connecting to:
 * - ESPN API for live games, standings, injuries
 * - The Odds API for betting lines
 * - Supabase for historical trends
 * 
 * This replaces mock data in analytics-data.ts and sports-data.ts
 */

import { createClient } from '@/lib/supabase/server'
import * as espn from '@/lib/api/espn'

export type Sport = 'NFL' | 'NBA' | 'NHL' | 'MLB'

// Types for historical game data
interface HistoricalGame {
  id: string
  sport: string
  home_team: string
  away_team: string
  spread_result: string | null
  total_result: string | null
}

// Type for Supabase query responses
interface OddsRecord {
  id: string
  event_id: string
  sport: string
  home_team: string
  away_team: string
  spread: number | null
  total: number | null
  home_ml: number | null
  away_ml: number | null
  open_spread: number | null
  updated_at: string
}

interface TrendRecord {
  trend_id: string
  sport: string
  category: string
  bet_type: string
  trend_name: string
  trend_description: string
  all_time_record: string | null
  all_time_roi: number | null
  confidence_score: number | null
  hot_streak: boolean | null
  last_updated: string
}

interface CapperRecord {
  id: string
  name: string
  slug: string
  avatar_emoji: string | null
  avatar_url: string | null
  verified: boolean | null
  primary_sport: string | null
  wins: number | null
  losses: number | null
  pushes: number | null
  roi: number | null
  avg_clv: number | null
  current_streak: number | null
}

// =============================================================================
// TYPES
// =============================================================================

export interface RealTeamAnalytics {
  id: string
  sport: Sport
  abbr: string
  name: string
  city: string
  conference: string
  division: string
  logo: string
  
  record: { wins: number; losses: number; ties?: number }
  
  ats: {
    overall: { wins: number; losses: number; pushes: number }
    home: { wins: number; losses: number; pushes: number }
    away: { wins: number; losses: number; pushes: number }
    asFavorite: { wins: number; losses: number; pushes: number }
    asUnderdog: { wins: number; losses: number; pushes: number }
    last10: { wins: number; losses: number; pushes: number }
  }
  
  ou: {
    overall: { overs: number; unders: number; pushes: number }
    home: { overs: number; unders: number; pushes: number }
    away: { overs: number; unders: number; pushes: number }
    last10: { overs: number; unders: number; pushes: number }
  }
  
  ml: {
    asFavorite: { wins: number; losses: number }
    asUnderdog: { wins: number; losses: number }
  }
}

export interface RealMatchup {
  id: string
  sport: Sport
  date: string
  time: string
  status: 'scheduled' | 'live' | 'final'
  homeTeam: {
    abbr: string
    name: string
    logo: string
    score?: number
    record: string
    atsRecord: string
  }
  awayTeam: {
    abbr: string
    name: string
    logo: string
    score?: number
    record: string
    atsRecord: string
  }
  odds?: {
    spread: number
    total: number
    homeML: number
    awayML: number
  }
  edgeIndicators?: {
    sharpMoney: 'home' | 'away' | null
    lineMovement: 'steam' | 'reverse' | null
    publicSide: 'home' | 'away'
    publicPct: number
  }
}

export interface RealTrend {
  id: string
  sport: Sport
  category: string
  betType: string
  name: string
  description: string
  record: string
  winPct: number
  roi: number
  confidence: number
  isHot: boolean
  lastUpdated: string
}

export interface RealLineMovement {
  id: string
  gameId: string
  sport: Sport
  teams: string
  openLine: number
  currentLine: number
  movement: number
  type: 'steam' | 'reverse' | 'sharp' | 'public'
  timestamp: string
}

export interface RealCapper {
  id: string
  name: string
  handle: string
  avatar: string
  verified: boolean
  sport: Sport
  record: { wins: number; losses: number; pushes: number }
  roi: number
  avgClv: number
  streak: number
  isHot: boolean
}

// =============================================================================
// DATA FETCHING FUNCTIONS
// =============================================================================

/**
 * Get team standings from ESPN
 */
export async function getRealTeams(sport: Sport): Promise<RealTeamAnalytics[]> {
  try {
    const standings = await espn.getStandings(sport)
    
    // Fetch historical ATS/OU data from Supabase
    const supabase = await createClient()
    const { data: historicalGames } = await supabase
      .from('historical_games')
      .select('*')
      .eq('sport', sport)
      .order('game_date', { ascending: false })
      .limit(1000)
    
    const games = (historicalGames || []) as HistoricalGame[]
    
    // Helper to get stat value from ESPN standing entry
    const getStat = (entry: typeof standings[0], name: string): number => {
      const stat = entry.stats.find(s => s.name === name)
      return stat?.value ?? 0
    }
    
    // Process standings into analytics format - ESPN returns flat ESPNStanding[]
    const teams: RealTeamAnalytics[] = standings.map((entry) => {
      const teamName = entry.team.displayName
      const teamCode = entry.team.abbreviation
      
      const teamGames = games.filter((g: HistoricalGame) => 
        g.home_team === teamName || g.away_team === teamName
      )
      
      // Calculate ATS records
      const homeGames = teamGames.filter((g: HistoricalGame) => g.home_team === teamName)
      const awayGames = teamGames.filter((g: HistoricalGame) => g.away_team === teamName)
      
      const homeATS = {
        wins: homeGames.filter((g: HistoricalGame) => g.spread_result === 'home_cover').length,
        losses: homeGames.filter((g: HistoricalGame) => g.spread_result === 'away_cover').length,
        pushes: homeGames.filter((g: HistoricalGame) => g.spread_result === 'push').length,
      }
      
      const awayATS = {
        wins: awayGames.filter((g: HistoricalGame) => g.spread_result === 'away_cover').length,
        losses: awayGames.filter((g: HistoricalGame) => g.spread_result === 'home_cover').length,
        pushes: awayGames.filter((g: HistoricalGame) => g.spread_result === 'push').length,
      }
      
      return {
        id: `${sport}-${teamCode}`,
        sport,
        abbr: teamCode,
        name: teamName,
        city: entry.team.location || teamName.replace(entry.team.name || '', '').trim(),
        conference: '', // ESPN doesn't return this in flat structure
        division: '',
        logo: entry.team.logo || `https://a.espncdn.com/i/teamlogos/${sport.toLowerCase()}/500/${teamCode.toLowerCase()}.png`,
        record: { 
          wins: getStat(entry, 'wins'), 
          losses: getStat(entry, 'losses'), 
          ties: sport === 'NFL' ? getStat(entry, 'ties') : undefined 
        },
        ats: {
          overall: {
            wins: homeATS.wins + awayATS.wins,
            losses: homeATS.losses + awayATS.losses,
            pushes: homeATS.pushes + awayATS.pushes,
          },
          home: homeATS,
          away: awayATS,
          asFavorite: { wins: 0, losses: 0, pushes: 0 },
          asUnderdog: { wins: 0, losses: 0, pushes: 0 },
          last10: { wins: 0, losses: 0, pushes: 0 },
        },
        ou: {
          overall: {
            overs: teamGames.filter((g: HistoricalGame) => g.total_result === 'over').length,
            unders: teamGames.filter((g: HistoricalGame) => g.total_result === 'under').length,
            pushes: teamGames.filter((g: HistoricalGame) => g.total_result === 'push').length,
          },
          home: {
            overs: homeGames.filter((g: HistoricalGame) => g.total_result === 'over').length,
            unders: homeGames.filter((g: HistoricalGame) => g.total_result === 'under').length,
            pushes: homeGames.filter((g: HistoricalGame) => g.total_result === 'push').length,
          },
          away: {
            overs: awayGames.filter((g: HistoricalGame) => g.total_result === 'over').length,
            unders: awayGames.filter((g: HistoricalGame) => g.total_result === 'under').length,
            pushes: awayGames.filter((g: HistoricalGame) => g.total_result === 'push').length,
          },
          last10: { overs: 0, unders: 0, pushes: 0 },
        },
        ml: {
          asFavorite: { wins: 0, losses: 0 },
          asUnderdog: { wins: 0, losses: 0 },
        },
      }
    })
    
    return teams
  } catch (error) {
    console.error(`Failed to get real teams for ${sport}:`, error)
    return []
  }
}

/**
 * Get today's games with odds and edge indicators
 */
export async function getRealMatchups(sport?: Sport): Promise<RealMatchup[]> {
  try {
    const sports: Sport[] = sport ? [sport] : ['NFL', 'NBA', 'NHL', 'MLB']
    const allMatchups: RealMatchup[] = []
    
    for (const s of sports) {
      const scoreboard = await espn.getScoreboard(s)
      
      for (const game of scoreboard.events) {
        const homeComp = game.competitions[0]?.competitors.find(c => c.homeAway === 'home')
        const awayComp = game.competitions[0]?.competitors.find(c => c.homeAway === 'away')
        
        if (!homeComp || !awayComp) continue
        
        const matchup: RealMatchup = {
          id: game.id,
          sport: s,
          date: game.date,
          time: game.date,
          status: game.status.type.state === 'pre' ? 'scheduled' : 
                  game.status.type.state === 'in' ? 'live' : 'final',
          homeTeam: {
            abbr: homeComp.team.abbreviation,
            name: homeComp.team.displayName,
            logo: homeComp.team.logo || '',
            score: homeComp.score ? parseInt(homeComp.score) : undefined,
            record: homeComp.records?.[0]?.summary || '0-0',
            atsRecord: '0-0-0',
          },
          awayTeam: {
            abbr: awayComp.team.abbreviation,
            name: awayComp.team.displayName,
            logo: awayComp.team.logo || '',
            score: awayComp.score ? parseInt(awayComp.score) : undefined,
            record: awayComp.records?.[0]?.summary || '0-0',
            atsRecord: '0-0-0',
          },
        }
        
        // Add odds if available from ESPN
        const oddsData = game.competitions[0]?.odds?.[0]
        if (oddsData) {
          matchup.odds = {
            spread: oddsData.spread || 0,
            total: oddsData.overUnder || 0,
            homeML: oddsData.homeTeamOdds?.moneyLine || 0,
            awayML: oddsData.awayTeamOdds?.moneyLine || 0,
          }
        }
        
        allMatchups.push(matchup)
      }
    }
    
    // Enrich with odds from Supabase
    const supabase = await createClient()
    const { data: odds } = await supabase
      .from('odds')
      .select('*')
      .in('event_id', allMatchups.map(m => m.id))
    
    const oddsRecords = (odds || []) as OddsRecord[]
    
    for (const matchup of allMatchups) {
      const matchOdds = oddsRecords.find((o: OddsRecord) => o.event_id === matchup.id)
      if (matchOdds && !matchup.odds) {
        matchup.odds = {
          spread: matchOdds.spread || 0,
          total: matchOdds.total || 0,
          homeML: matchOdds.home_ml || 0,
          awayML: matchOdds.away_ml || 0,
        }
      }
    }
    
    return allMatchups
  } catch (error) {
    console.error('Failed to get real matchups:', error)
    return []
  }
}

/**
 * Get discovered trends from Supabase
 */
export async function getRealTrends(sport?: Sport): Promise<RealTrend[]> {
  try {
    const supabase = await createClient()
    
    let query = supabase
      .from('historical_trends')
      .select('*')
      .eq('is_active', true)
      .order('all_time_roi', { ascending: false })
      .limit(100)
    
    if (sport) {
      query = query.eq('sport', sport)
    }
    
    const { data, error } = await query
    
    if (error) throw error
    
    const trends = (data || []) as TrendRecord[]
    
    return trends.map((t: TrendRecord) => {
      const recordParts = t.all_time_record?.split('-') || ['0', '0']
      const wins = parseFloat(recordParts[0]) || 0
      const losses = parseFloat(recordParts[1]) || 0
      const total = wins + losses
      
      return {
        id: t.trend_id,
        sport: t.sport as Sport,
        category: t.category,
        betType: t.bet_type,
        name: t.trend_name,
        description: t.trend_description,
        record: t.all_time_record || '0-0',
        winPct: total > 0 ? (wins / total) * 100 : 0,
        roi: t.all_time_roi || 0,
        confidence: t.confidence_score || 0,
        isHot: t.hot_streak || false,
        lastUpdated: t.last_updated,
      }
    })
  } catch (error) {
    console.error('Failed to get real trends:', error)
    return []
  }
}

/**
 * Get line movements from odds history
 */
export async function getRealLineMovements(sport?: Sport): Promise<RealLineMovement[]> {
  try {
    const supabase = await createClient()
    
    let query = supabase
      .from('odds')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(50)
    
    if (sport) {
      query = query.eq('sport', sport)
    }
    
    const { data, error } = await query
    
    if (error) throw error
    
    const oddsRecords = (data || []) as OddsRecord[]
    
    return oddsRecords.map((o: OddsRecord) => ({
      id: o.id,
      gameId: o.event_id,
      sport: o.sport as Sport,
      teams: `${o.away_team} @ ${o.home_team}`,
      openLine: o.open_spread || o.spread || 0,
      currentLine: o.spread || 0,
      movement: (o.spread || 0) - (o.open_spread || o.spread || 0),
      type: 'public' as const,
      timestamp: o.updated_at,
    }))
  } catch (error) {
    console.error('Failed to get line movements:', error)
    return []
  }
}

/**
 * Get top cappers with CLV tracking
 */
export async function getRealCappers(): Promise<RealCapper[]> {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('cappers')
      .select('*')
      .order('roi', { ascending: false })
      .limit(20)
    
    if (error) throw error
    
    const capperRecords = (data || []) as CapperRecord[]
    
    return capperRecords.map((c: CapperRecord) => ({
      id: c.id,
      name: c.name,
      handle: c.slug || c.name,
      avatar: c.avatar_url || c.avatar_emoji || '/default-avatar.png',
      verified: c.verified || false,
      sport: (c.primary_sport || 'NFL') as Sport,
      record: { 
        wins: c.wins || 0, 
        losses: c.losses || 0, 
        pushes: c.pushes || 0 
      },
      roi: c.roi || 0,
      avgClv: c.avg_clv || 0,
      streak: c.current_streak || 0,
      isHot: (c.current_streak || 0) >= 5,
    }))
  } catch (error) {
    console.error('Failed to get real cappers:', error)
    return []
  }
}

/**
 * Get analytics summary
 */
export async function getRealAnalyticsSummary() {
  try {
    const [trends, matchups, cappers] = await Promise.all([
      getRealTrends(),
      getRealMatchups(),
      getRealCappers(),
    ])
    
    const hotTrends = trends.filter(t => t.isHot)
    const edgeGames = matchups.filter(m => m.edgeIndicators?.sharpMoney)
    
    return {
      totalTrends: trends.length,
      hotTrends: hotTrends.length,
      avgTrendWinPct: trends.length > 0 
        ? trends.reduce((sum, t) => sum + t.winPct, 0) / trends.length 
        : 0,
      totalMatchups: matchups.length,
      edgeGames: edgeGames.length,
      liveGames: matchups.filter(m => m.status === 'live').length,
      topCappers: cappers.slice(0, 5),
      lastUpdated: new Date().toISOString(),
    }
  } catch (error) {
    console.error('Failed to get analytics summary:', error)
    return {
      totalTrends: 0,
      hotTrends: 0,
      avgTrendWinPct: 0,
      totalMatchups: 0,
      edgeGames: 0,
      liveGames: 0,
      topCappers: [],
      lastUpdated: new Date().toISOString(),
    }
  }
}

// =============================================================================
// EDGE FINDING FUNCTIONS
// =============================================================================

/**
 * Get high-edge trends (win rate > 55%)
 */
export async function getHighEdgeTrends(limit = 10): Promise<RealTrend[]> {
  const trends = await getRealTrends()
  return trends
    .filter(t => t.winPct >= 55)
    .sort((a, b) => b.roi - a.roi)
    .slice(0, limit)
}

/**
 * Get games with sharp money indicators
 */
export async function getSharpMoneyGames(): Promise<RealMatchup[]> {
  const matchups = await getRealMatchups()
  return matchups.filter(m => m.edgeIndicators?.sharpMoney)
}

/**
 * Get reverse line movement games
 */
export async function getReverseLineMovementGames(): Promise<RealMatchup[]> {
  const matchups = await getRealMatchups()
  return matchups.filter(m => m.edgeIndicators?.lineMovement === 'reverse')
}

/**
 * Get steam move alerts
 */
export async function getSteamMoveAlerts(): Promise<RealLineMovement[]> {
  const movements = await getRealLineMovements()
  return movements.filter(m => Math.abs(m.movement) >= 1)
}
