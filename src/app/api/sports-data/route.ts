import { NextRequest, NextResponse } from 'next/server'
import { 
  ESPN_APIS, 
  NHL_API, 
  MLB_API, 
  fetchESPN, 
  fetchAllSportsContext,
  type SportType 
} from '@/lib/api/free-sports-apis'

export const dynamic = 'force-dynamic'

// GET /api/sports-data?sport=nfl&type=scoreboard
// GET /api/sports-data?sport=nfl&type=boxscore&gameId=401547417
// GET /api/sports-data?sport=nhl&type=schedule&date=2026-01-11
// GET /api/sports-data?type=all (fetch all sports context)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const sport = searchParams.get('sport') as SportType | null
  const type = searchParams.get('type') || 'scoreboard'
  const gameId = searchParams.get('gameId')
  const teamId = searchParams.get('teamId')
  const date = searchParams.get('date')
  const playerId = searchParams.get('playerId')
  
  try {
    // Fetch all sports at once
    if (type === 'all') {
      const context = await fetchAllSportsContext()
      return NextResponse.json({ 
        success: true, 
        data: context,
        timestamp: new Date().toISOString()
      })
    }
    
    if (!sport) {
      return NextResponse.json({ 
        error: 'Sport parameter required. Options: nfl, nba, nhl, mlb, ncaaf, ncaab, wnba',
        availableEndpoints: {
          scoreboard: '?sport=nfl&type=scoreboard',
          standings: '?sport=nba&type=standings',
          teams: '?sport=nhl&type=teams',
          news: '?sport=mlb&type=news',
          boxscore: '?sport=nfl&type=boxscore&gameId=401547417',
          playbyplay: '?sport=nba&type=playbyplay&gameId=401584793',
          roster: '?sport=nfl&type=roster&teamId=12',
          schedule: '?sport=nhl&type=schedule&teamId=BOS',
          teamStats: '?sport=nba&type=teamStats&teamId=13',
          athleteStats: '?sport=nfl&type=athleteStats&playerId=4241479',
          all: '?type=all',
        }
      }, { status: 400 })
    }
    
    let data: any
    
    switch (type) {
      case 'scoreboard':
        data = await fetchESPN(sport, 'scoreboard')
        break
        
      case 'standings':
        data = await fetchESPN(sport, 'standings')
        break
        
      case 'teams':
        data = await fetchESPN(sport, 'teams')
        break
        
      case 'news':
        data = await fetchESPN(sport, 'news')
        break
        
      case 'rankings':
        if (sport === 'ncaaf' || sport === 'ncaab') {
          data = await fetchESPN(sport, 'rankings')
        } else {
          return NextResponse.json({ error: 'Rankings only available for ncaaf and ncaab' }, { status: 400 })
        }
        break
        
      case 'boxscore':
        if (!gameId) {
          return NextResponse.json({ error: 'gameId required for boxscore' }, { status: 400 })
        }
        const espnEndpoints = ESPN_APIS[sport]
        if (espnEndpoints && 'gameBoxscore' in espnEndpoints) {
          const url = (espnEndpoints.gameBoxscore as (id: string) => string)(gameId)
          const res = await fetch(url)
          data = await res.json()
        }
        break
        
      case 'playbyplay':
        if (!gameId) {
          return NextResponse.json({ error: 'gameId required for play-by-play' }, { status: 400 })
        }
        const espnPbp = ESPN_APIS[sport]
        if (espnPbp && 'gamePlays' in espnPbp) {
          const url = (espnPbp.gamePlays as (id: string) => string)(gameId)
          const res = await fetch(url)
          data = await res.json()
        }
        break
        
      case 'roster':
        if (!teamId) {
          return NextResponse.json({ error: 'teamId required for roster' }, { status: 400 })
        }
        const espnRoster = ESPN_APIS[sport]
        if (espnRoster && 'teamRoster' in espnRoster) {
          const url = (espnRoster.teamRoster as (id: string) => string)(teamId)
          const res = await fetch(url)
          data = await res.json()
        }
        break
        
      case 'schedule':
        if (!teamId && sport !== 'nhl' && sport !== 'mlb') {
          return NextResponse.json({ error: 'teamId required for team schedule' }, { status: 400 })
        }
        
        // For NHL and MLB, we can get league-wide schedule by date
        if (sport === 'nhl' && date) {
          const url = NHL_API.schedule(date)
          const res = await fetch(url)
          data = await res.json()
        } else if (sport === 'mlb' && date) {
          const url = MLB_API.schedule(date)
          const res = await fetch(url)
          data = await res.json()
        } else if (teamId) {
          const espnSchedule = ESPN_APIS[sport]
          if (espnSchedule && 'teamSchedule' in espnSchedule) {
            const url = (espnSchedule.teamSchedule as (id: string) => string)(teamId)
            const res = await fetch(url)
            data = await res.json()
          }
        }
        break
        
      case 'teamStats':
        if (!teamId) {
          return NextResponse.json({ error: 'teamId required for team stats' }, { status: 400 })
        }
        const espnStats = ESPN_APIS[sport]
        if (espnStats && 'teamStats' in espnStats) {
          const url = (espnStats.teamStats as (id: string) => string)(teamId)
          const res = await fetch(url)
          data = await res.json()
        }
        break
        
      case 'athleteStats':
        if (!playerId) {
          return NextResponse.json({ error: 'playerId required for athlete stats' }, { status: 400 })
        }
        const espnAthlete = ESPN_APIS[sport]
        if (espnAthlete && 'athleteStats' in espnAthlete) {
          const url = (espnAthlete.athleteStats as (id: string) => string)(playerId)
          const res = await fetch(url)
          data = await res.json()
        }
        break
        
      // NHL-specific endpoints
      case 'nhl-standings':
        if (sport === 'nhl') {
          const url = date ? NHL_API.standings(date) : NHL_API.standings()
          const res = await fetch(url)
          data = await res.json()
        }
        break
        
      case 'nhl-leaders':
        if (sport === 'nhl') {
          const [skaters, goalies] = await Promise.all([
            fetch(NHL_API.skaterLeaders).then(r => r.json()),
            fetch(NHL_API.goalieLeaders).then(r => r.json()),
          ])
          data = { skaters, goalies }
        }
        break
        
      // MLB-specific endpoints
      case 'mlb-leaders':
        if (sport === 'mlb') {
          const season = new Date().getFullYear()
          const [hr, avg, era] = await Promise.all([
            fetch(MLB_API.leaders('homeRuns', season)).then(r => r.json()),
            fetch(MLB_API.leaders('battingAverage', season)).then(r => r.json()),
            fetch(MLB_API.leaders('earnedRunAverage', season)).then(r => r.json()),
          ])
          data = { homeRuns: hr, battingAverage: avg, era }
        }
        break
        
      default:
        return NextResponse.json({ 
          error: `Unknown type: ${type}`,
          availableTypes: [
            'scoreboard', 'standings', 'teams', 'news', 'rankings',
            'boxscore', 'playbyplay', 'roster', 'schedule', 'teamStats', 'athleteStats',
            'nhl-standings', 'nhl-leaders', 'mlb-leaders', 'all'
          ]
        }, { status: 400 })
    }
    
    if (!data) {
      return NextResponse.json({ error: 'No data found' }, { status: 404 })
    }
    
    return NextResponse.json({
      success: true,
      sport,
      type,
      data,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('Sports data error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch sports data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
