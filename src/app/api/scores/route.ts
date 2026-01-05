/**
 * Live Scores API
 * Fetches real-time scores from ESPN for all sports
 */

import { NextResponse } from 'next/server'
import { getScoreboard, type SportKey, ESPN_SPORTS, type ESPNGame } from '@/lib/api/espn'

export const revalidate = 60 // Revalidate every 60 seconds

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
  NCAAB: '🏀'
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
  
  try {
    const allGames: GameData[] = []
    
    // Determine which sports to fetch
    const sportsToFetch: SportKey[] = sport && sport in ESPN_SPORTS 
      ? [sport]
      : ['NFL', 'NBA', 'NHL', 'MLB'] // Default major sports
    
    // Fetch all sports in parallel
    const results = await Promise.allSettled(
      sportsToFetch.map(async (s) => {
        try {
          const scoreboard = await getScoreboard(s, date || undefined)
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
    
    // Filter by status if requested
    let filteredGames = allGames
    if (status && status !== 'all') {
      filteredGames = allGames.filter(g => g.status === status)
    }
    
    // Sort: live games first, then by start time
    filteredGames.sort((a, b) => {
      if (a.status === 'live' && b.status !== 'live') return -1
      if (b.status === 'live' && a.status !== 'live') return 1
      return new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    })
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      count: filteredGames.length,
      liveCount: filteredGames.filter(g => g.status === 'live').length,
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
