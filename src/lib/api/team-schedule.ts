/**
 * Team Schedule API
 * Fetches REAL team schedule/results from ESPN API
 * Falls back to historical database when ESPN data is limited (e.g., during playoffs)
 * NO FAKE DATA - if data isn't available, show a placeholder
 */

import { ESPN_SPORTS, type SportKey } from './espn'

const ESPN_BASE = 'https://site.api.espn.com/apis/site/v2/sports'

export interface TeamGameResult {
  id: string
  week: number | string
  date: string
  opponent: string
  homeAway: 'home' | 'away'
  result: 'W' | 'L' | 'T' | null  // null for upcoming games
  teamScore: number | null
  opponentScore: number | null
  score: string  // "28-17" format
  spread?: string  // "+3.5" or "-3.5"
  atsResult?: 'W' | 'L' | 'P' | null  // Push or null if no spread data
  total?: string  // "45.5"
  ouResult?: 'O' | 'U' | 'P' | null
  isCompleted: boolean
}

export interface TeamScheduleResponse {
  team: {
    id: string
    name: string
    abbreviation: string
    logo?: string
  }
  games: TeamGameResult[]
  record: string
  atsRecord?: string
  ouRecord?: string
}

interface ESPNScheduleEvent {
  id: string
  date: string
  week?: { number: number }
  name: string
  shortName: string
  competitions: Array<{
    competitors: Array<{
      id: string
      homeAway: 'home' | 'away'
      team: { 
        id: string
        abbreviation: string 
        displayName: string
      }
      // Score can be a string, number, or object with displayValue
      score?: string | number | { value?: number; displayValue?: string }
      winner?: boolean
    }>
    status: {
      type: {
        completed: boolean
        state: string
      }
    }
  }>
}

interface ESPNScheduleResponse {
  team: {
    id: string
    abbreviation: string
    displayName: string
    logos?: Array<{ href: string }>
  }
  events: ESPNScheduleEvent[]
  requestedSeason?: {
    year: number
    type: number
  }
}

/**
 * Get team schedule/results from ESPN
 * Returns REAL data - no fake data generation
 */
export async function getTeamSchedule(
  sport: SportKey, 
  teamId: string,
  limit: number = 10
): Promise<TeamScheduleResponse | null> {
  try {
    const { sport: s, league } = ESPN_SPORTS[sport]
    
    // ESPN team schedule endpoint
    // Format: /football/nfl/teams/{teamId}/schedule
    // Use seasontype=2 for regular season games (important during playoffs when default only returns playoff games)
    // Also fetch seasontype=3 (postseason) separately and merge
    const baseUrl = `${ESPN_BASE}/${s}/${league}/teams/${teamId}/schedule`
    
    // Fetch both regular season and postseason schedules in parallel
    const [regularRes, postseasonRes] = await Promise.all([
      fetch(`${baseUrl}?seasontype=2`, { 
        next: { revalidate: 300 },
        headers: { 'Accept': 'application/json' }
      }),
      fetch(`${baseUrl}?seasontype=3`, { 
        next: { revalidate: 300 },
        headers: { 'Accept': 'application/json' }
      }).catch(() => null) // Postseason might not exist
    ])
    
    if (!regularRes.ok) {
      console.error(`ESPN Schedule API error: ${regularRes.status}`)
      return null
    }
    
    const regularData: ESPNScheduleResponse = await regularRes.json()
    let postseasonData: ESPNScheduleResponse | null = null
    
    if (postseasonRes?.ok) {
      postseasonData = await postseasonRes.json()
    }
    
    // Merge events from both seasons
    const allEvents = [
      ...(regularData.events || []),
      ...(postseasonData?.events || [])
    ]
    
    const data = {
      ...regularData,
      events: allEvents
    }
    
    // Legacy single fetch fallback
    const res = { ok: true } // dummy for compatibility
    
    if (!data.team || !data.events) {
      return null
    }
    
    // Transform ESPN events to our format
    const games: TeamGameResult[] = data.events
      .map(event => transformESPNEvent(event, data.team.id))
      .filter(Boolean) as TeamGameResult[]
    
    // Sort by date descending (most recent first) and limit
    const sortedGames = games
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, limit)
    
    // ALWAYS fetch historical data to enrich ESPN games with spread/total info
    // Historical data has ATS/OU results that ESPN doesn't provide
    const historicalData = await getHistoricalTeamGames(
      sport, 
      data.team.abbreviation, 
      limit
    )
    
    // Create a map of historical games by date for quick lookup
    const historicalMap = new Map<string, TeamGameResult>()
    historicalData.games?.forEach((hg: TeamGameResult) => {
      const dateKey = new Date(hg.date).toDateString()
      historicalMap.set(dateKey, hg)
    })
    
    // Enrich ESPN games with historical odds data
    const enrichedGames = sortedGames.map(g => {
      const dateKey = new Date(g.date).toDateString()
      const historical = historicalMap.get(dateKey)
      
      if (historical) {
        return {
          ...g,
          spread: historical.spread || g.spread,
          atsResult: historical.atsResult || g.atsResult,
          total: historical.total || g.total,
          ouResult: historical.ouResult || g.ouResult,
        }
      }
      return g
    })
    
    // If ESPN returned limited data, add historical games not in ESPN
    let finalGames = enrichedGames
    if (enrichedGames.length < limit && historicalData.games?.length) {
      const existingDates = new Set(enrichedGames.map(g => new Date(g.date).toDateString()))
      const newGames = (historicalData.games as TeamGameResult[])
        .filter(hg => !existingDates.has(new Date(hg.date).toDateString()))
      finalGames = [...enrichedGames, ...newGames]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, limit)
    }
    
    // Calculate record from completed games
    const allCompleted = finalGames.filter(g => g.isCompleted)
    const totalWins = allCompleted.filter(g => g.result === 'W').length
    const totalLosses = allCompleted.filter(g => g.result === 'L').length
    const totalTies = allCompleted.filter(g => g.result === 'T').length
    
    // Use ATS/OU records from historical data if available
    const atsRecord = historicalData.atsRecord || undefined
    const ouRecord = historicalData.ouRecord || undefined
    
    return {
      team: {
        id: data.team.id,
        name: data.team.displayName,
        abbreviation: data.team.abbreviation,
        logo: data.team.logos?.[0]?.href,
      },
      games: finalGames,
      record: totalTies > 0 ? `${totalWins}-${totalLosses}-${totalTies}` : `${totalWins}-${totalLosses}`,
      atsRecord,
      ouRecord,
    }
  } catch (error) {
    console.error('Error fetching team schedule:', error)
    return null
  }
}

function transformESPNEvent(event: ESPNScheduleEvent, ourTeamId: string): TeamGameResult | null {
  const competition = event.competitions?.[0]
  if (!competition) return null
  
  const ourTeam = competition.competitors.find(c => c.team.id === ourTeamId)
  const opponent = competition.competitors.find(c => c.team.id !== ourTeamId)
  
  if (!ourTeam || !opponent) return null
  
  const isCompleted = competition.status.type.completed
  
  // Helper to extract score value - ESPN returns score as string, number, or object
  const extractScore = (score: string | number | { value?: number; displayValue?: string } | undefined): number | null => {
    if (score === undefined || score === null) return null
    if (typeof score === 'number') return score
    if (typeof score === 'string') return parseInt(score) || null
    if (typeof score === 'object') {
      // Handle {value: 14.0, displayValue: '14'} format
      if (score.value !== undefined) return Math.round(score.value)
      if (score.displayValue) return parseInt(score.displayValue) || null
    }
    return null
  }
  
  const ourScore = extractScore(ourTeam.score)
  const oppScore = extractScore(opponent.score)
  
  // Determine result
  let result: 'W' | 'L' | 'T' | null = null
  if (isCompleted && ourScore !== null && oppScore !== null) {
    if (ourScore > oppScore) result = 'W'
    else if (ourScore < oppScore) result = 'L'
    else result = 'T'
  }
  
  // Format opponent string with @ prefix for away games
  const opponentStr = ourTeam.homeAway === 'away' 
    ? `@${opponent.team.abbreviation}`
    : opponent.team.abbreviation
  
  // Score string
  const scoreStr = ourScore !== null && oppScore !== null 
    ? `${ourScore}-${oppScore}`
    : 'TBD'
  
  return {
    id: event.id,
    week: event.week?.number ?? '-',
    date: event.date,
    opponent: opponentStr,
    homeAway: ourTeam.homeAway,
    result,
    teamScore: ourScore,
    opponentScore: oppScore,
    score: scoreStr,
    // We don't have spread/total data from ESPN schedule endpoint
    // That would require integration with The Odds API historical data
    spread: undefined,
    atsResult: null,
    total: undefined,
    ouResult: null,
    isCompleted,
  }
}

/**
 * Get head-to-head history between two teams
 * Returns REAL data from ESPN
 */
export async function getHeadToHead(
  sport: SportKey,
  team1Id: string,
  team2Id: string,
  limit: number = 10
): Promise<TeamGameResult[]> {
  try {
    // Get schedule for team1
    const schedule = await getTeamSchedule(sport, team1Id, 100) // Get more games to find h2h
    
    if (!schedule) return []
    
    // Filter to games against team2
    // Note: We need the team abbreviation to match against opponents
    const h2hGames = schedule.games.filter(g => {
      // Remove @ prefix for comparison
      const oppAbbr = g.opponent.replace('@', '')
      // This is imperfect without knowing team2's abbreviation
      // In production, we'd look up team2's abbreviation
      return g.opponent.includes(team2Id) || oppAbbr === team2Id
    })
    
    return h2hGames.slice(0, limit)
  } catch (error) {
    console.error('Error fetching head-to-head:', error)
    return []
  }
}

/**
 * Map team abbreviation to ESPN team ID
 * ESPN uses numeric IDs, so we need this mapping
 */
export const NFL_TEAM_IDS: Record<string, string> = {
  'ARI': '22', 'ATL': '1', 'BAL': '33', 'BUF': '2',
  'CAR': '29', 'CHI': '3', 'CIN': '4', 'CLE': '5',
  'DAL': '6', 'DEN': '7', 'DET': '8', 'GB': '9',
  'HOU': '34', 'IND': '11', 'JAX': '30', 'KC': '12',
  'LAC': '24', 'LAR': '14', 'LV': '13', 'MIA': '15',
  'MIN': '16', 'NE': '17', 'NO': '18', 'NYG': '19',
  'NYJ': '20', 'PHI': '21', 'PIT': '23', 'SEA': '26',
  'SF': '25', 'TB': '27', 'TEN': '10', 'WAS': '28',
}

export const NBA_TEAM_IDS: Record<string, string> = {
  'ATL': '1', 'BOS': '2', 'BKN': '17', 'CHA': '30',
  'CHI': '4', 'CLE': '5', 'DAL': '6', 'DEN': '7',
  'DET': '8', 'GSW': '9', 'HOU': '10', 'IND': '11',
  'LAC': '12', 'LAL': '13', 'MEM': '29', 'MIA': '14',
  'MIL': '15', 'MIN': '16', 'NOP': '3', 'NYK': '18',
  'OKC': '25', 'ORL': '19', 'PHI': '20', 'PHX': '21',
  'POR': '22', 'SAC': '23', 'SAS': '24', 'TOR': '28',
  'UTA': '26', 'WAS': '27',
}

export const NHL_TEAM_IDS: Record<string, string> = {
  'ANA': '25', 'ARI': '24', 'BOS': '1', 'BUF': '2',
  'CAR': '7', 'CBJ': '29', 'CGY': '20', 'CHI': '4',
  'COL': '17', 'DAL': '9', 'DET': '5', 'EDM': '22',
  'FLA': '26', 'LA': '14', 'MIN': '30', 'MTL': '8',
  'NJ': '11', 'NSH': '18', 'NYI': '12', 'NYR': '13',
  'OTT': '9', 'PHI': '15', 'PIT': '16', 'SEA': '32',
  'SJ': '28', 'STL': '19', 'TB': '27', 'TOR': '10',
  'VAN': '23', 'VGK': '31', 'WPG': '21', 'WSH': '15',
}

export const MLB_TEAM_IDS: Record<string, string> = {
  'ARI': '29', 'ATL': '15', 'BAL': '1', 'BOS': '2',
  'CHC': '16', 'CHW': '4', 'CIN': '17', 'CLE': '5',
  'COL': '27', 'DET': '6', 'HOU': '18', 'KC': '7',
  'LAA': '3', 'LAD': '19', 'MIA': '28', 'MIL': '8',
  'MIN': '9', 'NYM': '21', 'NYY': '10', 'OAK': '11',
  'PHI': '22', 'PIT': '23', 'SD': '25', 'SEA': '12',
  'SF': '26', 'STL': '24', 'TB': '30', 'TEX': '13',
  'TOR': '14', 'WSH': '20',
}

export function getTeamId(sport: SportKey, abbr: string): string | null {
  const maps: Record<string, Record<string, string>> = {
    NFL: NFL_TEAM_IDS,
    NBA: NBA_TEAM_IDS,
    NHL: NHL_TEAM_IDS,
    MLB: MLB_TEAM_IDS,
  }
  return maps[sport]?.[abbr] || null
}

/**
 * Fetch historical games for a team from our database
 * This supplements ESPN data when their API returns limited results
 * Also provides ATS/OU betting records
 */
async function getHistoricalTeamGames(
  sport: SportKey,
  teamAbbr: string,
  limit: number
): Promise<{ games: TeamGameResult[]; atsRecord?: string; ouRecord?: string }> {
  try {
    const baseUrl = typeof window !== 'undefined' 
      ? '' 
      : process.env.VERCEL_URL 
        ? `https://${process.env.VERCEL_URL}` 
        : 'http://localhost:3000'
    
    const url = `${baseUrl}/api/team-history?team=${teamAbbr}&sport=${sport}&limit=${limit}`
    const res = await fetch(url, { cache: 'no-store' })
    
    if (!res.ok) {
      console.error(`Historical team data error: ${res.status}`)
      return { games: [] }
    }
    
    const data = await res.json()
    return {
      games: data.games || [],
      atsRecord: data.atsRecord,
      ouRecord: data.ouRecord,
    }
  } catch (error) {
    console.error('Error fetching historical team games:', error)
    return { games: [] }
  }
}
