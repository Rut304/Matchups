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

// Types for historical game data (match supabase/historical_games schema)
interface HistoricalGame {
  id: string
  sport: string
  season: number
  season_type: string
  game_date: string
  home_team_id: string
  home_team_name: string
  home_team_abbr: string
  away_team_id: string
  away_team_name: string
  away_team_abbr: string
  point_spread: number | null
  total_points: number | null
  home_score: number | null
  away_score: number | null
  [key: string]: any
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

// Provenance metadata for data source tracking
export interface ProvenanceMetadata {
  source: 'supabase' | 'espn' | 'action-network' | 'odds-api'
  fetchedAt: string
  season?: number
  seasonType?: string
}

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
    provenance?: ProvenanceMetadata
    hasData: boolean
  }
  
  ou: {
    overall: { overs: number; unders: number; pushes: number }
    home: { overs: number; unders: number; pushes: number }
    away: { overs: number; unders: number; pushes: number }
    last10: { overs: number; unders: number; pushes: number }
    provenance?: ProvenanceMetadata
    hasData: boolean
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

export interface GetRealTeamsOptions {
  sport: Sport
  season?: number // Override the default season heuristic
  seasonType?: 'regular' | 'postseason' // Filter by season type
}

/**
 * Get team standings from ESPN with ATS/OU data from Supabase
 * @param sportOrOptions - Sport string or options object with sport, season, seasonType
 */
export async function getRealTeams(sportOrOptions: Sport | GetRealTeamsOptions): Promise<RealTeamAnalytics[]> {
  // Parse options
  const options = typeof sportOrOptions === 'string' 
    ? { sport: sportOrOptions } 
    : sportOrOptions
  const { sport, season: seasonOverride, seasonType } = options
  
  const fetchedAt = new Date().toISOString()
  
  try {
    const standings = await espn.getStandings(sport)
    
    // Fetch historical ATS/OU data from Supabase
    const supabase = await createClient()

    // Determine season: use override or heuristic (if now before July, use previous year)
    const now = new Date()
    const year = now.getFullYear()
    const season = seasonOverride ?? (now.getMonth() < 6 ? year - 1 : year)

    let query = supabase
      .from('historical_games')
      .select('*')
      .eq('sport', sport.toLowerCase())
      .eq('season', season)
      .order('game_date', { ascending: false })
    
    // Apply seasonType filter if specified
    if (seasonType) {
      query = query.eq('season_type', seasonType)
    }

    const { data: historicalGames, error: histError } = await query.limit(5000)
    
    if (histError) {
      console.error(`Error fetching historical games for ${sport}:`, histError)
    }

    // Deduplicate games: keep only the first occurrence of each date+home+away combo
    const seenGames = new Set<string>()
    const games = ((historicalGames || []) as HistoricalGame[]).filter(g => {
      const key = `${g.game_date}|${g.home_team_abbr}|${g.away_team_abbr}`
      if (seenGames.has(key)) return false
      seenGames.add(key)
      return true
    })
    
    // Also fetch game_odds for this sport+season to get real closing lines
    // game_odds has accurate consensus closing lines from The Odds API
    // Paginate since Supabase caps at 1000 rows per request
    let allOddsData: any[] = []
    let oddsOffset = 0
    while (true) {
      const { data: oddsPage } = await supabase
        .from('game_odds')
        .select('home_team, away_team, game_date, consensus_spread, consensus_total')
        .eq('sport', sport.toLowerCase())
        .eq('season', season)
        .not('consensus_spread', 'is', null)
        .range(oddsOffset, oddsOffset + 999)
      
      if (!oddsPage || oddsPage.length === 0) break
      allOddsData.push(...oddsPage)
      if (oddsPage.length < 1000) break
      oddsOffset += 1000
    }
    const oddsData = allOddsData
    
    // Build game_odds lookup by date + home team (fuzzy)
    const oddsLookup = new Map<string, { spread: number; total: number }>()
    if (oddsData) {
      for (const odds of oddsData) {
        // Key by date + last word of home team name (e.g., "2024-09-15|ravens")
        const homeKey = odds.home_team.split(' ').pop()?.toLowerCase() || ''
        const key = `${odds.game_date}|${homeKey}`
        oddsLookup.set(key, {
          spread: odds.consensus_spread!,
          total: odds.consensus_total!
        })
        // Also key by ±1 day for timezone edge cases
        const d = new Date(odds.game_date + 'T12:00:00Z')
        const prevDate = new Date(d.getTime() - 86400000).toISOString().split('T')[0]
        const nextDate = new Date(d.getTime() + 86400000).toISOString().split('T')[0]
        oddsLookup.set(`${prevDate}|${homeKey}`, { spread: odds.consensus_spread!, total: odds.consensus_total! })
        oddsLookup.set(`${nextDate}|${homeKey}`, { spread: odds.consensus_spread!, total: odds.consensus_total! })
      }
    }
    
    // Patch games with accurate closing lines from game_odds
    for (const game of games) {
      // Skip Pro Bowl, All-Star games
      if (game.home_team_name?.includes('NFC') || game.home_team_name?.includes('AFC') ||
          game.home_team_name?.includes('All-Star')) {
        game.point_spread = null
        game.spread_result = null
        continue
      }
      
      const homeKey = (game.home_team_name || '').split(' ').pop()?.toLowerCase() || ''
      const lookupKey = `${game.game_date}|${homeKey}`
      const realOdds = oddsLookup.get(lookupKey)
      
      if (realOdds && game.home_score != null && game.away_score != null) {
        game.point_spread = realOdds.spread
        game.over_under = realOdds.total
        // Recompute results with accurate lines
        const adjustedHome = game.home_score + realOdds.spread
        if (adjustedHome > game.away_score) game.spread_result = 'home_cover'
        else if (adjustedHome < game.away_score) game.spread_result = 'away_cover'
        else game.spread_result = 'push'
        
        const totalPts = game.home_score + game.away_score
        if (totalPts > realOdds.total) game.total_result = 'over'
        else if (totalPts < realOdds.total) game.total_result = 'under'
        else game.total_result = 'push'
      }
    }
    
    // Build provenance metadata for ATS data
    const atsProvenance: ProvenanceMetadata = {
      source: 'supabase',
      fetchedAt,
      season,
      seasonType: seasonType || 'all',
    }
    
    // Helper to get stat value from ESPN standing entry
    const getStat = (entry: typeof standings[0], name: string): number => {
      const stat = entry.stats.find(s => s.name === name)
      return stat?.value ?? 0
    }
    
    // Process standings into analytics format - ESPN returns flat ESPNStanding[]
    const teams: RealTeamAnalytics[] = standings.map((entry) => {
      const teamName = entry.team.displayName
      const teamCode = entry.team.abbreviation

      // Match using team abbreviations (more reliable) against historical_games fields
      const teamGamesRaw = games.filter((g: HistoricalGame) =>
        (g.home_team_abbr && g.home_team_abbr.toUpperCase() === teamCode.toUpperCase()) ||
        (g.away_team_abbr && g.away_team_abbr.toUpperCase() === teamCode.toUpperCase())
      )

      // Per-team dedup: a team can only play one game per date
      // (DB may have duplicate imports with flipped home/away or different sources)
      const seenDates = new Set<string>()
      const teamGames = teamGamesRaw.filter((g: HistoricalGame) => {
        if (seenDates.has(g.game_date)) return false
        seenDates.add(g.game_date)
        return true
      })

      // Calculate ATS records using the abbr-based slices
      const homeGames = teamGames.filter((g: HistoricalGame) => g.home_team_abbr && g.home_team_abbr.toUpperCase() === teamCode.toUpperCase())
      const awayGames = teamGames.filter((g: HistoricalGame) => g.away_team_abbr && g.away_team_abbr.toUpperCase() === teamCode.toUpperCase())
      
      const hasHistory = teamGames.length > 0

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
      
      // Compute last 10 ATS (games are already sorted desc by date)
      const recent10 = teamGames.slice(0, 10)
      const last10ATS = { wins: 0, losses: 0, pushes: 0 }
      for (const g of recent10) {
        const isHome = g.home_team_abbr?.toUpperCase() === teamCode.toUpperCase()
        if (isHome) {
          if (g.spread_result === 'home_cover') last10ATS.wins++
          else if (g.spread_result === 'away_cover') last10ATS.losses++
          else if (g.spread_result === 'push') last10ATS.pushes++
        } else {
          if (g.spread_result === 'away_cover') last10ATS.wins++
          else if (g.spread_result === 'home_cover') last10ATS.losses++
          else if (g.spread_result === 'push') last10ATS.pushes++
        }
      }
      
      // Compute last 10 OU
      const last10OU = { overs: 0, unders: 0, pushes: 0 }
      for (const g of recent10) {
        if (g.total_result === 'over') last10OU.overs++
        else if (g.total_result === 'under') last10OU.unders++
        else if (g.total_result === 'push') last10OU.pushes++
      }
      
      // Compute as favorite / as underdog (using spread: negative = home fav)
      const asFavorite = { wins: 0, losses: 0, pushes: 0 }
      const asUnderdog = { wins: 0, losses: 0, pushes: 0 }
      for (const g of teamGames) {
        const isHome = g.home_team_abbr?.toUpperCase() === teamCode.toUpperCase()
        const spread = g.point_spread ?? 0
        const isFavorite = isHome ? spread < 0 : spread > 0
        
        if (!g.spread_result) continue
        const covered = isHome 
          ? g.spread_result === 'home_cover'
          : g.spread_result === 'away_cover'
        const lost = isHome
          ? g.spread_result === 'away_cover'
          : g.spread_result === 'home_cover'
        
        if (isFavorite) {
          if (covered) asFavorite.wins++
          else if (lost) asFavorite.losses++
          else asFavorite.pushes++
        } else {
          if (covered) asUnderdog.wins++
          else if (lost) asUnderdog.losses++
          else asUnderdog.pushes++
        }
      }
      
      // Compute ML record as fav/dog
      const mlAsFavorite = { wins: 0, losses: 0 }
      const mlAsUnderdog = { wins: 0, losses: 0 }
      for (const g of teamGames) {
        if (g.home_score == null || g.away_score == null) continue
        const isHome = g.home_team_abbr?.toUpperCase() === teamCode.toUpperCase()
        const spread = g.point_spread ?? 0
        const isFavorite = isHome ? spread < 0 : spread > 0
        const won = isHome ? g.home_score > g.away_score : g.away_score > g.home_score
        
        if (isFavorite) {
          if (won) mlAsFavorite.wins++
          else mlAsFavorite.losses++
        } else {
          if (won) mlAsUnderdog.wins++
          else mlAsUnderdog.losses++
        }
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
          asFavorite,
          asUnderdog,
          last10: last10ATS,
          provenance: atsProvenance,
          hasData: hasHistory,
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
          last10: last10OU,
          provenance: atsProvenance,
          hasData: hasHistory,
        },
        ml: {
          asFavorite: mlAsFavorite,
          asUnderdog: mlAsUnderdog,
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
    
    // Query odds_history for actual line movements instead of odds table
    // The odds table doesn't have the columns we need (sport, teams, updated_at)
    const { data, error } = await supabase
      .from('odds_history')
      .select('id, game_id, line_type, old_value, new_value, recorded_at')
      .order('recorded_at', { ascending: false })
      .limit(50)
    
    if (error) {
      // Gracefully handle if table doesn't exist or has different schema
      console.warn('[LineMovements] odds_history query failed, returning empty:', error.message)
      return []
    }
    
    // Transform odds_history records to RealLineMovement format
    return (data || []).map((record: { id: string; game_id: string; line_type: string; old_value: number | null; new_value: number | null; recorded_at: string }) => ({
      id: record.id,
      gameId: record.game_id || '',
      sport: (sport || 'NFL') as Sport,
      teams: 'TBD vs TBD', // Would need to join with games table for team names
      openLine: record.old_value || 0,
      currentLine: record.new_value || 0,
      movement: (record.new_value || 0) - (record.old_value || 0),
      type: 'public' as const,
      timestamp: record.recorded_at,
    }))
  } catch (error) {
    // Silently return empty array - this is a non-critical feature
    console.warn('[LineMovements] Error fetching line movements')
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
