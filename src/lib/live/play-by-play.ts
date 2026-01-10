// Real-time Play-by-Play System
// Fetches live game data from ESPN and provides real-time updates

import { createClient } from '@/lib/supabase/client'

export interface PlayByPlayEvent {
  id: string
  gameId: string
  sequenceNumber: number
  timestamp: string
  clock: string
  period: number | string
  type: 'play' | 'score' | 'timeout' | 'penalty' | 'substitution' | 'review' | 'injury' | 'other'
  team?: string
  teamAbbr?: string
  description: string
  scoreHome?: number
  scoreAway?: number
  isScoring?: boolean
  yards?: number
  down?: number
  distance?: number
  fieldPosition?: string
  players?: string[]
}

export interface LiveGameState {
  gameId: string
  sport: string
  status: 'pre' | 'in' | 'post' | 'delayed' | 'postponed'
  period: number | string
  clock: string
  homeScore: number
  awayScore: number
  possession?: string
  situation?: string
  lastPlay?: PlayByPlayEvent
  lastUpdate: string
  plays: PlayByPlayEvent[]
}

export interface LiveOddsUpdate {
  gameId: string
  timestamp: string
  spread: {
    home: number
    away: number
    movement: 'up' | 'down' | 'stable'
  }
  total: {
    line: number
    movement: 'up' | 'down' | 'stable'
  }
  moneyline: {
    home: number
    away: number
  }
}

// ESPN API endpoints for live data
const ESPN_LIVE_ENDPOINTS: Record<string, string> = {
  nfl: 'https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard',
  nba: 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard',
  nhl: 'https://site.api.espn.com/apis/site/v2/sports/hockey/nhl/scoreboard',
  mlb: 'https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/scoreboard',
  ncaaf: 'https://site.api.espn.com/apis/site/v2/sports/football/college-football/scoreboard',
  ncaab: 'https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/scoreboard',
}

// Fetch play-by-play for a specific game
export async function fetchPlayByPlay(gameId: string, sport: string): Promise<PlayByPlayEvent[]> {
  const sportLower = sport.toLowerCase()
  
  let endpoint = ''
  switch (sportLower) {
    case 'nfl':
      endpoint = `https://site.api.espn.com/apis/site/v2/sports/football/nfl/summary?event=${gameId}`
      break
    case 'nba':
      endpoint = `https://site.api.espn.com/apis/site/v2/sports/basketball/nba/summary?event=${gameId}`
      break
    case 'nhl':
      endpoint = `https://site.api.espn.com/apis/site/v2/sports/hockey/nhl/summary?event=${gameId}`
      break
    case 'mlb':
      endpoint = `https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/summary?event=${gameId}`
      break
    case 'ncaaf':
      endpoint = `https://site.api.espn.com/apis/site/v2/sports/football/college-football/summary?event=${gameId}`
      break
    case 'ncaab':
      endpoint = `https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/summary?event=${gameId}`
      break
    default:
      return []
  }
  
  try {
    const res = await fetch(endpoint, { cache: 'no-store' })
    if (!res.ok) return []
    
    const data = await res.json()
    const plays: PlayByPlayEvent[] = []
    
    // Parse plays from different sports
    if (data.plays) {
      const playItems = Array.isArray(data.plays) ? data.plays : data.plays.allPlays || []
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      playItems.forEach((play: any, index: number) => {
        plays.push({
          id: play.id || `${gameId}-play-${index}`,
          gameId,
          sequenceNumber: play.sequenceNumber || index,
          timestamp: play.wallclock || new Date().toISOString(),
          clock: play.clock?.displayValue || play.displayClock || '',
          period: play.period?.number || play.quarter || play.period || 1,
          type: categorizePlayType(play),
          team: play.team?.displayName,
          teamAbbr: play.team?.abbreviation,
          description: play.text || play.description || '',
          scoreHome: play.homeScore,
          scoreAway: play.awayScore,
          isScoring: play.scoringPlay || false,
          yards: play.yards,
          down: play.start?.down,
          distance: play.start?.distance,
          fieldPosition: play.start?.yardLine,
          players: extractPlayers(play),
        })
      })
    }
    
    return plays.sort((a, b) => b.sequenceNumber - a.sequenceNumber)
  } catch (error) {
    console.error(`[fetchPlayByPlay] Error for game ${gameId}:`, error)
    return []
  }
}

// Get live game state
export async function getLiveGameState(gameId: string, sport: string): Promise<LiveGameState | null> {
  const sportLower = sport.toLowerCase()
  const endpoint = ESPN_LIVE_ENDPOINTS[sportLower]
  
  if (!endpoint) return null
  
  try {
    const res = await fetch(endpoint, { cache: 'no-store' })
    if (!res.ok) return null
    
    const data = await res.json()
    const event = data.events?.find((e: Record<string, unknown>) => e.id === gameId)
    
    if (!event) return null
    
    const competition = event.competitions?.[0]
    const status = event.status
    const homeTeam = competition?.competitors?.find((c: Record<string, unknown>) => c.homeAway === 'home')
    const awayTeam = competition?.competitors?.find((c: Record<string, unknown>) => c.homeAway === 'away')
    
    // Get play-by-play
    const plays = await fetchPlayByPlay(gameId, sport)
    
    return {
      gameId,
      sport: sportLower,
      status: mapStatus(status?.type?.state),
      period: status?.period || 0,
      clock: status?.displayClock || '',
      homeScore: parseInt(homeTeam?.score || '0'),
      awayScore: parseInt(awayTeam?.score || '0'),
      possession: competition?.situation?.possession,
      situation: formatSituation(competition?.situation, sportLower),
      lastPlay: plays[0],
      lastUpdate: new Date().toISOString(),
      plays: plays.slice(0, 50), // Last 50 plays
    }
  } catch (error) {
    console.error(`[getLiveGameState] Error for game ${gameId}:`, error)
    return null
  }
}

// Get all live games
export async function getAllLiveGames(): Promise<LiveGameState[]> {
  const sports = Object.keys(ESPN_LIVE_ENDPOINTS)
  const liveGames: LiveGameState[] = []
  
  await Promise.all(
    sports.map(async (sport) => {
      try {
        const res = await fetch(ESPN_LIVE_ENDPOINTS[sport], { cache: 'no-store' })
        if (!res.ok) return
        
        const data = await res.json()
        
        for (const event of data.events || []) {
          if (event.status?.type?.state === 'in') {
            const gameState = await getLiveGameState(event.id, sport)
            if (gameState) {
              liveGames.push(gameState)
            }
          }
        }
      } catch (error) {
        console.error(`[getAllLiveGames] Error for ${sport}:`, error)
      }
    })
  )
  
  return liveGames
}

// Poll for updates (for SSE/polling-based real-time)
export async function pollGameUpdates(
  gameId: string, 
  sport: string,
  lastSequence: number
): Promise<{ hasUpdates: boolean; newPlays: PlayByPlayEvent[]; state: LiveGameState | null }> {
  const state = await getLiveGameState(gameId, sport)
  
  if (!state) {
    return { hasUpdates: false, newPlays: [], state: null }
  }
  
  const newPlays = state.plays.filter(p => p.sequenceNumber > lastSequence)
  
  return {
    hasUpdates: newPlays.length > 0,
    newPlays,
    state,
  }
}

// Store live game state to Supabase for persistence
export async function persistLiveGameState(state: LiveGameState): Promise<boolean> {
  try {
    const supabase = createClient()
    
    const { error } = await supabase
      .from('live_game_states')
      .upsert({
        game_id: state.gameId,
        sport: state.sport,
        status: state.status,
        period: state.period,
        clock: state.clock,
        home_score: state.homeScore,
        away_score: state.awayScore,
        possession: state.possession,
        situation: state.situation,
        last_play: state.lastPlay,
        plays: state.plays,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'game_id'
      })
    
    if (error) {
      console.error('[persistLiveGameState] Error:', error)
      return false
    }
    
    return true
  } catch {
    return false
  }
}

// Helper functions
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function categorizePlayType(play: any): PlayByPlayEvent['type'] {
  const type = (play.type?.text || play.typeText || '').toLowerCase()
  const text = (play.text || play.description || '').toLowerCase()
  
  if (play.scoringPlay || text.includes('touchdown') || text.includes('goal') || text.includes('score')) {
    return 'score'
  }
  if (type.includes('timeout') || text.includes('timeout')) {
    return 'timeout'
  }
  if (type.includes('penalty') || text.includes('penalty')) {
    return 'penalty'
  }
  if (type.includes('substitution') || text.includes('substitution')) {
    return 'substitution'
  }
  if (type.includes('review') || text.includes('review') || text.includes('challenge')) {
    return 'review'
  }
  if (type.includes('injury') || text.includes('injury')) {
    return 'injury'
  }
  
  return 'play'
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractPlayers(play: any): string[] {
  const players: string[] = []
  
  if (play.participants && Array.isArray(play.participants)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    play.participants.forEach((p: any) => {
      if (p.athlete?.displayName) {
        players.push(p.athlete.displayName)
      }
    })
  }
  
  return players
}

function mapStatus(state: string): LiveGameState['status'] {
  switch (state) {
    case 'pre': return 'pre'
    case 'in': return 'in'
    case 'post': return 'post'
    case 'delayed': return 'delayed'
    case 'postponed': return 'postponed'
    default: return 'pre'
  }
}

function formatSituation(situation: Record<string, unknown> | undefined, sport: string): string {
  if (!situation) return ''
  
  if (sport === 'nfl' || sport === 'ncaaf') {
    const down = situation.down
    const distance = situation.distance
    const yardLine = situation.yardLine
    const possession = situation.possession
    
    if (down && distance) {
      return `${down}${getOrdinal(down as number)} & ${distance} at ${yardLine || 'Unknown'}`
    }
  }
  
  if (sport === 'nba' || sport === 'ncaab') {
    const possession = situation.possession
    return possession ? `${possession} ball` : ''
  }
  
  return ''
}

function getOrdinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return (s[(v - 20) % 10] || s[v] || s[0])
}

// Calculate live betting edge based on current game state
export function calculateLiveBettingEdge(
  state: LiveGameState,
  currentSpread: number,
  pregameSpread: number
): { edge: number; recommendation: string; confidence: number } {
  const scoreDiff = state.homeScore - state.awayScore
  const spreadDiff = currentSpread - pregameSpread
  
  // Simple edge calculation - in production this would use ML models
  let edge = 0
  let recommendation = 'HOLD'
  let confidence = 50
  
  // If live spread has moved significantly from pregame
  if (Math.abs(spreadDiff) >= 3) {
    if (spreadDiff > 0 && scoreDiff < pregameSpread) {
      // Home team is playing worse than expected, but line moved in their favor
      edge = spreadDiff * 0.5
      recommendation = `AWAY +${currentSpread}`
      confidence = 55 + Math.min(Math.abs(spreadDiff) * 3, 20)
    } else if (spreadDiff < 0 && scoreDiff > pregameSpread) {
      // Home team is playing better than expected, but line moved against them
      edge = Math.abs(spreadDiff) * 0.5
      recommendation = `HOME ${currentSpread > 0 ? '+' : ''}${currentSpread}`
      confidence = 55 + Math.min(Math.abs(spreadDiff) * 3, 20)
    }
  }
  
  return { edge, recommendation, confidence }
}
