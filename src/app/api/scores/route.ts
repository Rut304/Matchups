/**
 * Live Scores API
 * Fetches real-time scores from ESPN for all sports
 * Supports historical dates and future schedules
 */

import { NextResponse } from 'next/server'
import { getScoreboard, type SportKey, ESPN_SPORTS, type ESPNGame } from '@/lib/api/espn'

// Force dynamic since we use request.url
export const dynamic = 'force-dynamic'

interface GameData {
  id: string
  sport: string
  sportEmoji: string
  status: 'scheduled' | 'live' | 'final' | 'delayed' | 'postponed'
  statusDisplay: string
  startTime: string
  period?: string
  clock?: string
  venue?: string
  broadcast?: string
  home: {
    id: string
    abbr: string
    name: string
    logo?: string
    score?: number
    record?: string
    color?: string
  }
  away: {
    id: string
    abbr: string
    name: string
    logo?: string
    score?: number
    record?: string
    color?: string
  }
  odds?: {
    spread: number
    total: number
    homeML?: number
    awayML?: number
    provider?: string
  }
}

const sportEmojis: Record<string, string> = {
  NFL: '🏈',
  NBA: '🏀',
  NHL: '🏒',
  MLB: '⚾',
  NCAAF: '🏈',
  NCAAB: '🏀',
  WNBA: '🏀',
  WNCAAB: '🏀'
}

// Get current date in Eastern Time
function getEasternDate(offsetDays = 0): string {
  const now = new Date()
  // Convert to Eastern Time
  const eastern = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }))
  eastern.setDate(eastern.getDate() + offsetDays)
  return eastern.toISOString().split('T')[0] // YYYY-MM-DD
}

function parseGame(game: ESPNGame, sport: string): GameData {
  const competition = game.competitions[0]
  const homeTeam = competition.competitors.find(c => c.homeAway === 'home')
  const awayTeam = competition.competitors.find(c => c.homeAway === 'away')
  const odds = competition.odds?.[0]
  
  let status: GameData['status'] = 'scheduled'
  let statusDisplay = ''
  
  const stateType = game.status.type.state
  if (stateType === 'in') {
    status = 'live'
    statusDisplay = game.status.displayClock ? `${game.status.period}Q ${game.status.displayClock}` : 'LIVE'
  } else if (stateType === 'post') {
    status = 'final'
    statusDisplay = 'Final'
  } else if (game.status.type.name === 'STATUS_POSTPONED') {
    status = 'postponed'
    statusDisplay = 'Postponed'
  } else if (game.status.type.name === 'STATUS_DELAYED') {
    status = 'delayed'
    statusDisplay = 'Delayed'
  } else {
    const gameDate = new Date(game.date)
    statusDisplay = gameDate.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      timeZone: 'America/New_York'
    }) + ' ET'
  }
  
  return {
    id: game.id,
    sport,
    sportEmoji: sportEmojis[sport] || '🎮',
    status,
    statusDisplay,
    startTime: game.date,
    period: stateType === 'in' ? `${game.status.period}` : undefined,
    clock: stateType === 'in' ? game.status.displayClock : undefined,
    venue: competition.venue?.fullName,
    broadcast: competition.broadcasts?.[0]?.names?.[0],
    home: {
      id: homeTeam?.team.id || '',
      abbr: homeTeam?.team.abbreviation || '',
      name: homeTeam?.team.shortDisplayName || homeTeam?.team.displayName || '',
      logo: homeTeam?.team.logo,
      score: homeTeam?.score ? parseInt(homeTeam.score) : undefined,
      record: homeTeam?.records?.[0]?.summary,
      color: homeTeam?.team.color ? `#${homeTeam.team.color}` : undefined
    },
    away: {
      id: awayTeam?.team.id || '',
      abbr: awayTeam?.team.abbreviation || '',
      name: awayTeam?.team.shortDisplayName || awayTeam?.team.displayName || '',
      logo: awayTeam?.team.logo,
      score: awayTeam?.score ? parseInt(awayTeam.score) : undefined,
      record: awayTeam?.records?.[0]?.summary,
      color: awayTeam?.team.color ? `#${awayTeam.team.color}` : undefined
    },
    odds: odds ? {
      spread: odds.spread,
      total: odds.overUnder,
      homeML: odds.homeTeamOdds?.moneyLine,
      awayML: odds.awayTeamOdds?.moneyLine,
      provider: odds.provider?.name
    } : undefined
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const sport = searchParams.get('sport')?.toUpperCase() as SportKey | null
  const date = searchParams.get('date') // Format: YYYY-MM-DD
  const status = searchParams.get('status') // 'live', 'scheduled', 'final', 'all'
  
  // Default to today in Eastern Time if no date specified
  const targetDate = date || getEasternDate()
  
  try {
    const allGames: GameData[] = []
    
    // Determine which sports to fetch
    const sportsToFetch: SportKey[] = sport && sport in ESPN_SPORTS 
      ? [sport]
      : ['NFL', 'NBA', 'NHL', 'MLB', 'NCAAF', 'NCAAB', 'WNBA', 'WNCAAB'] // All supported sports
    
    // Fetch all sports in parallel
    const results = await Promise.allSettled(
      sportsToFetch.map(async (s) => {
        try {
          const scoreboard = await getScoreboard(s, targetDate)
          return scoreboard.events.map(game => parseGame(game, s))
        } catch (error) {
          console.error(`Error fetching ${s} scoreboard:`, error)
          return []
        }
      })
    )
    
    // Collect successful results
    results.forEach((result) => {
      if (result.status === 'fulfilled') {
        allGames.push(...result.value)
      }
    })
    
    // Filter by target date - ESPN sometimes returns games across multiple days
    // Compare only the date portion in Eastern Time
    const targetDateObj = new Date(targetDate + 'T00:00:00')
    const dateFilteredGames = allGames.filter(g => {
      const gameDate = new Date(g.startTime)
      // Convert game time to Eastern and compare date only
      const gameDateET = new Date(gameDate.toLocaleString('en-US', { timeZone: 'America/New_York' }))
      const gameYear = gameDateET.getFullYear()
      const gameMonth = gameDateET.getMonth()
      const gameDay = gameDateET.getDate()
      
      return gameYear === targetDateObj.getFullYear() &&
             gameMonth === targetDateObj.getMonth() &&
             gameDay === targetDateObj.getDate()
    })
    
    // Filter by status if requested
    let filteredGames = dateFilteredGames
    if (status && status !== 'all') {
      filteredGames = dateFilteredGames.filter(g => g.status === status)
    }
    
    // Sort: live games first, then scheduled (upcoming), then final
    // Within each group, sort by start time (recent first for final, earliest first for scheduled)
    filteredGames.sort((a, b) => {
      // Priority: live > scheduled > final
      const statusPriority = { live: 0, scheduled: 1, delayed: 2, postponed: 3, final: 4 }
      const aPriority = statusPriority[a.status] ?? 5
      const bPriority = statusPriority[b.status] ?? 5
      
      if (aPriority !== bPriority) return aPriority - bPriority
      
      // Within same status, sort by time
      const aTime = new Date(a.startTime).getTime()
      const bTime = new Date(b.startTime).getTime()
      
      // For final games, show most recent first (descending)
      if (a.status === 'final') return bTime - aTime
      
      // For live and scheduled, show earliest first (ascending)
      return aTime - bTime
    })
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      date: targetDate,
      timezone: 'America/New_York',
      count: filteredGames.length,
      liveCount: filteredGames.filter(g => g.status === 'live').length,
      finalCount: filteredGames.filter(g => g.status === 'final').length,
      scheduledCount: filteredGames.filter(g => g.status === 'scheduled').length,
      games: filteredGames
    })
    
  } catch (error) {
    console.error('Scores API error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch scores',
      games: []
    }, { status: 500 })
  }
}
