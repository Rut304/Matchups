/**
 * Unified Data Layer
 * Combines Action Network + ESPN + The Odds API into a single normalized data source
 * 
 * API PRIORITY (FREE SOURCES FIRST):
 * 1. Action Network - Betting lines, splits, multi-book odds (FREE public API - PRIMARY)
 * 2. ESPN - Game data, scores, schedules (FREE, unlimited)
 * 3. The Odds API - LAST RESORT fallback (PAID, rate limited - only if AN fails)
 * 4. Supabase - Historical data, caching
 */

import { createClient } from '@/lib/supabase/server'
import { getScoreboard, getTeams, transformESPNGame, ESPN_SPORTS, type SportKey } from './espn'
import { getOdds, transformOddsGame, ODDS_API_SPORTS, type OddsSportKey } from './the-odds-api'
import { fetchActionNetworkGames } from '../scrapers/action-network'

// Unified Game Type
export interface UnifiedGame {
  id: string
  sport: SportKey
  status: 'scheduled' | 'live' | 'final' | 'postponed' | 'cancelled'
  scheduledAt: string
  startedAt?: string
  completedAt?: string
  
  // Teams
  homeTeam: {
    id: string
    name: string
    abbreviation: string
    logo?: string
    color?: string
    score?: number
    record?: string
  }
  awayTeam: {
    id: string
    name: string
    abbreviation: string
    logo?: string
    color?: string
    score?: number
    record?: string
  }
  
  // Game Info
  venue?: string
  broadcast?: string
  weather?: {
    temp: number
    condition: string
  }
  period?: string
  clock?: string
  
  // Betting Lines
  odds?: {
    spread: number
    spreadOdds: number
    total: number
    overOdds: number
    underOdds: number
    homeML: number
    awayML: number
  }
  
  // Consensus
  consensus?: {
    spread: number | null
    total: number | null
    homeML: number | null
    bookmakerCount: number
  }
  
  // Sources - tracking which sources provided data
  espnId?: string
  oddsApiId?: string
  
  // Data source metadata
  sourceInfo?: {
    primary: 'espn' | 'action-network' | 'odds-api' | 'supabase'
    backup?: 'espn' | 'action-network' | 'odds-api' | 'supabase'
    confidence: number // 0-100
    fallbackUsed: boolean
  }
  
  // Timestamps
  lastUpdated: string
}

// Import data source utilities
import { 
  dataSourceManager, 
  resolveDuplicates,
  matchGames,
  type GameIdentifiers 
} from './data-sources'

// Sync games from ESPN and merge with odds
export async function syncGames(sport: SportKey): Promise<UnifiedGame[]> {
  let games: UnifiedGame[] = []
  
  // 1. Fetch from ESPN (primary source for game data)
  const espnScoreboard = await getScoreboard(sport)
  const espnGames = espnScoreboard.events.map(g => transformESPNGame(g, sport))
  
  // 2. Fetch odds from Action Network FIRST (free, unlimited)
  let actionNetworkGames: Awaited<ReturnType<typeof fetchActionNetworkGames>> = []
  try {
    actionNetworkGames = await fetchActionNetworkGames(sport)
    if (actionNetworkGames.length > 0) {
      console.log(`[DataLayer] Action Network: ${actionNetworkGames.length} games with odds for ${sport}`)
    }
  } catch (error) {
    console.warn(`[DataLayer] Action Network failed for ${sport}, will try fallback:`, error)
  }
  
  // 3. Fallback to The Odds API only if Action Network failed AND we have API key
  let oddsGames: ReturnType<typeof transformOddsGame>[] = []
  if (actionNetworkGames.length === 0 && process.env.ODDS_API_KEY && sport in ODDS_API_SPORTS) {
    try {
      console.log(`[DataLayer] Falling back to The Odds API for ${sport}`)
      const oddsData = await getOdds(sport as OddsSportKey)
      oddsGames = oddsData.map(g => transformOddsGame(g, sport as OddsSportKey))
    } catch (error) {
      // Only log non-quota errors (quota errors are handled silently in the-odds-api.ts)
      const errorMessage = error instanceof Error ? error.message : String(error)
      if (!errorMessage.includes('OUT_OF_USAGE_CREDITS')) {
        console.warn(`[DataLayer] The Odds API failed for ${sport}:`, errorMessage)
      }
    }
  }
  
  // 4. Resolve duplicate ESPN games
  const espnWithIdentifiers = espnGames.map(g => ({
    ...g,
    homeTeam: g.home.name || '',
    awayTeam: g.away.name || '',
    scheduledTime: g.scheduledAt,
    espnId: g.id,
  }))
  
  const oddsIdentifiers: GameIdentifiers[] = oddsGames.map(g => ({
    oddsApiId: g.id,
    homeTeam: g.homeTeam,
    awayTeam: g.awayTeam,
    scheduledTime: g.scheduledAt,
  }))
  
  const { resolved: resolvedEspnGames, duplicates } = resolveDuplicates(
    espnWithIdentifiers,
    oddsIdentifiers
  )
  
  if (duplicates.length > 0) {
    console.warn(`[DataLayer] Resolved ${duplicates.length} duplicate ESPN games for ${sport}`)
  }
  
  // 5. Merge ESPN games with odds data (Action Network primary, Odds API fallback)
  for (const espnGame of resolvedEspnGames) {
    // Try to match with Action Network first
    const matchingAN = actionNetworkGames.find(g => {
      const homeTeam = g.teams.find(t => t.id === g.home_team_id)
      const awayTeam = g.teams.find(t => t.id === g.away_team_id)
      return homeTeam && awayTeam &&
        fuzzyMatchTeam(homeTeam.full_name, espnGame.home.name || '') &&
        fuzzyMatchTeam(awayTeam.full_name, espnGame.away.name || '')
    })
    
    // Fallback to Odds API match
    const matchingOdds = oddsGames.find(og => 
      fuzzyMatchTeam(og.homeTeam, espnGame.home.name || '') &&
      fuzzyMatchTeam(og.awayTeam, espnGame.away.name || '')
    )
    
    // Extract odds from Action Network if available
    let oddsData: UnifiedGame['odds'] | undefined
    let oddsSource: 'action-network' | 'odds-api' | 'espn' | undefined
    
    if (matchingAN?.markets) {
      // Get consensus odds (book ID 15)
      const consensusMarket = matchingAN.markets['15']?.event
      if (consensusMarket) {
        const spreadHome = consensusMarket.spread?.find(s => s.side === 'home')
        const spreadAway = consensusMarket.spread?.find(s => s.side === 'away')
        const totalOver = consensusMarket.total?.find(t => t.side === 'over')
        const totalUnder = consensusMarket.total?.find(t => t.side === 'under')
        const mlHome = consensusMarket.moneyline?.find(m => m.side === 'home')
        const mlAway = consensusMarket.moneyline?.find(m => m.side === 'away')
        
        oddsData = {
          spread: spreadHome?.value ?? 0,
          spreadOdds: spreadHome?.odds ?? -110,
          total: totalOver?.value ?? 0,
          overOdds: totalOver?.odds ?? -110,
          underOdds: totalUnder?.odds ?? -110,
          homeML: mlHome?.odds ?? 0,
          awayML: mlAway?.odds ?? 0,
        }
        oddsSource = 'action-network'
      }
    }
    
    // Fallback to Odds API
    if (!oddsData && matchingOdds?.odds) {
      oddsData = {
        spread: matchingOdds.odds.spread ?? 0,
        spreadOdds: matchingOdds.odds.spreadOdds ?? -110,
        total: matchingOdds.odds.total ?? 0,
        overOdds: matchingOdds.odds.overOdds ?? -110,
        underOdds: matchingOdds.odds.underOdds ?? -110,
        homeML: matchingOdds.odds.homeML ?? 0,
        awayML: matchingOdds.odds.awayML ?? 0,
      }
      oddsSource = 'odds-api'
    }
    
    // Final fallback to ESPN odds
    if (!oddsData && espnGame.odds) {
      oddsData = {
        spread: espnGame.odds.spread ?? 0,
        spreadOdds: -110,
        total: espnGame.odds.total ?? 0,
        overOdds: -110,
        underOdds: -110,
        homeML: espnGame.odds.homeML ?? 0,
        awayML: espnGame.odds.awayML ?? 0,
      }
      oddsSource = 'espn'
    }
    
    // Calculate match confidence
    let matchConfidence = 100
    if (matchingOdds) {
      const { confidence } = matchGames(
        { homeTeam: espnGame.home.name || '', awayTeam: espnGame.away.name || '', scheduledTime: espnGame.scheduledAt, espnId: espnGame.id },
        { homeTeam: matchingOdds.homeTeam, awayTeam: matchingOdds.awayTeam, scheduledTime: matchingOdds.scheduledAt, oddsApiId: matchingOdds.id }
      )
      matchConfidence = confidence
    }
    
    const unified: UnifiedGame = {
      id: espnGame.id,
      sport,
      status: espnGame.status as UnifiedGame['status'],
      scheduledAt: espnGame.scheduledAt,
      homeTeam: {
        id: espnGame.home.id || '',
        name: espnGame.home.name || '',
        abbreviation: espnGame.home.abbreviation || '',
        logo: espnGame.home.logo,
        color: espnGame.home.color ? `#${espnGame.home.color}` : undefined,
        score: espnGame.home.score ?? undefined,
        record: espnGame.home.record,
      },
      awayTeam: {
        id: espnGame.away.id || '',
        name: espnGame.away.name || '',
        abbreviation: espnGame.away.abbreviation || '',
        logo: espnGame.away.logo,
        color: espnGame.away.color ? `#${espnGame.away.color}` : undefined,
        score: espnGame.away.score ?? undefined,
        record: espnGame.away.record,
      },
      venue: espnGame.venue,
      broadcast: espnGame.broadcast,
      weather: espnGame.weather ?? undefined,
      period: espnGame.period ?? undefined,
      clock: espnGame.clock,
      // Priority: Action Network (free) > Odds API (paid) > ESPN (limited)
      odds: oddsData,
      consensus: matchingOdds?.consensus ?? undefined,
      espnId: espnGame.id,
      oddsApiId: matchingOdds?.id,
      // Track data source hierarchy: Action Network > Odds API > ESPN
      sourceInfo: {
        primary: 'espn',
        backup: oddsSource || undefined,
        confidence: matchConfidence,
        fallbackUsed: !oddsData && !!espnGame.odds,
      },
      lastUpdated: new Date().toISOString(),
    }
    
    games.push(unified)
  }
  
  return games
}

// Fuzzy match team names between ESPN and Odds API
function fuzzyMatchTeam(name1: string, name2: string): boolean {
  const normalize = (s: string) => s.toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .replace(/city|state|university|college/g, '')
  
  const n1 = normalize(name1)
  const n2 = normalize(name2)
  
  // Exact match after normalization
  if (n1 === n2) return true
  
  // One contains the other
  if (n1.includes(n2) || n2.includes(n1)) return true
  
  // Check common abbreviations
  const abbrevMap: Record<string, string[]> = {
    'lakers': ['losangeles', 'la'],
    'celtics': ['boston'],
    'warriors': ['goldenstate', 'gsw'],
    'chiefs': ['kansascity', 'kc'],
    'bills': ['buffalo'],
    'eagles': ['philadelphia', 'philly'],
    'cowboys': ['dallas'],
    // Add more as needed
  }
  
  for (const [key, aliases] of Object.entries(abbrevMap)) {
    if ((n1.includes(key) || aliases.some(a => n1.includes(a))) &&
        (n2.includes(key) || aliases.some(a => n2.includes(a)))) {
      return true
    }
  }
  
  return false
}

// Store games in Supabase
export async function storeGames(games: UnifiedGame[]): Promise<void> {
  const supabase = await createClient()
  
  for (const game of games) {
    // Upsert game
    const { error: gameError } = await supabase
      .from('games')
      .upsert({
        id: game.id,
        sport: game.sport,
        status: game.status,
        scheduled_at: game.scheduledAt,
        home_team_id: game.homeTeam.id,
        away_team_id: game.awayTeam.id,
        home_score: game.homeTeam.score,
        away_score: game.awayTeam.score,
        venue: game.venue,
        broadcast: game.broadcast,
        espn_id: game.espnId,
        updated_at: game.lastUpdated,
      }, { onConflict: 'id' })
    
    if (gameError) console.error(`[DataLayer] Error storing game ${game.id}:`, gameError)
    
    // Upsert odds
    if (game.odds) {
      const { error: oddsError } = await supabase
        .from('odds')
        .upsert({
          game_id: game.id,
          spread: game.odds.spread,
          spread_odds: game.odds.spreadOdds,
          total: game.odds.total,
          over_odds: game.odds.overOdds,
          under_odds: game.odds.underOdds,
          home_ml: game.odds.homeML,
          away_ml: game.odds.awayML,
          source: 'the-odds-api',
          updated_at: game.lastUpdated,
        }, { onConflict: 'game_id' })
      
      if (oddsError) console.error(`[DataLayer] Error storing odds for ${game.id}:`, oddsError)
    }
  }
}

// Sync teams from ESPN to Supabase
export async function syncTeams(sport: SportKey): Promise<void> {
  const supabase = await createClient()
  const teams = await getTeams(sport)
  
  for (const team of teams) {
    const { error } = await supabase
      .from('teams')
      .upsert({
        id: team.id,
        sport,
        name: team.displayName,
        abbreviation: team.abbreviation,
        location: team.location,
        logo_url: team.logo,
        primary_color: team.color ? `#${team.color}` : null,
        secondary_color: team.alternateColor ? `#${team.alternateColor}` : null,
        espn_id: team.id,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' })
    
    if (error) console.error(`[DataLayer] Error storing team ${team.id}:`, error)
  }
}

// Fetch games from Supabase (with caching)
export async function getGamesFromDB(
  sport: SportKey,
  options: { status?: string; date?: string; limit?: number } = {}
): Promise<UnifiedGame[]> {
  const supabase = await createClient()
  
  let query = supabase
    .from('games')
    .select(`
      *,
      odds(*),
      home_team:teams!games_home_team_id_fkey(*),
      away_team:teams!games_away_team_id_fkey(*)
    `)
    .eq('sport', sport)
  
  if (options.status) {
    query = query.eq('status', options.status)
  }
  
  if (options.date) {
    const start = new Date(options.date)
    start.setHours(0, 0, 0, 0)
    const end = new Date(options.date)
    end.setHours(23, 59, 59, 999)
    query = query.gte('scheduled_at', start.toISOString()).lte('scheduled_at', end.toISOString())
  }
  
  if (options.limit) {
    query = query.limit(options.limit)
  }
  
  query = query.order('scheduled_at', { ascending: true })
  
  const { data, error } = await query
  
  if (error) {
    console.error('[DataLayer] Error fetching games:', error)
    return []
  }
  
  // Transform to UnifiedGame format
  return (data || []).map(dbGameToUnified)
}

// Convert DB row to UnifiedGame
function dbGameToUnified(row: Record<string, unknown>): UnifiedGame {
  const homeTeam = row.home_team as Record<string, unknown> | null
  const awayTeam = row.away_team as Record<string, unknown> | null
  const odds = (row.odds as Record<string, unknown>[] | null)?.[0]
  
  return {
    id: row.id as string,
    sport: row.sport as SportKey,
    status: row.status as UnifiedGame['status'],
    scheduledAt: row.scheduled_at as string,
    homeTeam: {
      id: homeTeam?.id as string || '',
      name: homeTeam?.name as string || '',
      abbreviation: homeTeam?.abbreviation as string || '',
      logo: homeTeam?.logo_url as string | undefined,
      color: homeTeam?.primary_color as string | undefined,
      score: row.home_score as number | undefined,
    },
    awayTeam: {
      id: awayTeam?.id as string || '',
      name: awayTeam?.name as string || '',
      abbreviation: awayTeam?.abbreviation as string || '',
      logo: awayTeam?.logo_url as string | undefined,
      color: awayTeam?.primary_color as string | undefined,
      score: row.away_score as number | undefined,
    },
    venue: row.venue as string | undefined,
    broadcast: row.broadcast as string | undefined,
    odds: odds ? {
      spread: odds.spread as number,
      spreadOdds: odds.spread_odds as number,
      total: odds.total as number,
      overOdds: odds.over_odds as number,
      underOdds: odds.under_odds as number,
      homeML: odds.home_ml as number,
      awayML: odds.away_ml as number,
    } : undefined,
    espnId: row.espn_id as string | undefined,
    lastUpdated: row.updated_at as string,
  }
}

// Get today's games across all sports (for homepage)
export async function getTodaysGamesAllSports(): Promise<Record<SportKey, UnifiedGame[]>> {
  const sports: SportKey[] = ['NFL', 'NBA', 'NHL', 'MLB']
  const results: Partial<Record<SportKey, UnifiedGame[]>> = {}
  
  await Promise.all(
    sports.map(async (sport) => {
      try {
        // Try DB first, fallback to live fetch
        const dbGames = await getGamesFromDB(sport, { 
          date: new Date().toISOString().split('T')[0],
          limit: 20 
        })
        
        if (dbGames.length > 0) {
          results[sport] = dbGames
        } else {
          // Fresh fetch from APIs
          const liveGames = await syncGames(sport)
          results[sport] = liveGames
        }
      } catch (error) {
        console.error(`[DataLayer] Error fetching ${sport}:`, error)
        results[sport] = []
      }
    })
  )
  
  return results as Record<SportKey, UnifiedGame[]>
}

// Export sport keys for convenience
export { ESPN_SPORTS, ODDS_API_SPORTS }
export type { SportKey, OddsSportKey }
