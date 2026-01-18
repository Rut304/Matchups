/**
 * Props API - Fetch all available props for a sport
 * GET /api/props?sport=NFL
 */

import { NextRequest, NextResponse } from 'next/server'

const ODDS_API_KEY = process.env.ODDS_API_KEY || process.env.THE_ODDS_API_KEY

const SPORT_KEYS: Record<string, string> = {
  'NFL': 'americanfootball_nfl',
  'NCAAF': 'americanfootball_ncaaf',
  'NBA': 'basketball_nba',
  'NCAAB': 'basketball_ncaab',
  'NHL': 'icehockey_nhl',
  'MLB': 'baseball_mlb',
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const sport = (searchParams.get('sport') || 'NFL').toUpperCase()
  
  const sportKey = SPORT_KEYS[sport]
  
  if (!sportKey) {
    return NextResponse.json({ 
      error: 'Invalid sport', 
      validSports: Object.keys(SPORT_KEYS) 
    }, { status: 400 })
  }

  if (!ODDS_API_KEY) {
    return NextResponse.json({ 
      error: 'API key not configured',
      props: [],
      games: []
    }, { status: 200 })
  }

  try {
    // First get events (games)
    const eventsUrl = `https://api.the-odds-api.com/v4/sports/${sportKey}/events?apiKey=${ODDS_API_KEY}`
    const eventsRes = await fetch(eventsUrl, { next: { revalidate: 300 } })
    
    if (!eventsRes.ok) {
      return NextResponse.json({ 
        error: `Events API error: ${eventsRes.status}`,
        props: [],
        games: []
      })
    }

    const events = await eventsRes.json()

    // Return games with basic info
    const games = events.map((e: any) => ({
      id: e.id,
      homeTeam: e.home_team,
      awayTeam: e.away_team,
      commenceTime: e.commence_time,
    }))

    return NextResponse.json({
      sport,
      games,
      propsAvailable: games.length > 0,
      message: games.length > 0 
        ? `${games.length} games found. Use /api/games/{id}/props for player props.`
        : 'No games currently available',
      meta: {
        source: 'the-odds-api',
        fetchedAt: new Date().toISOString()
      }
    })

  } catch (error: any) {
    console.error('Props API error:', error)
    return NextResponse.json({ 
      error: error.message,
      props: [],
      games: []
    }, { status: 500 })
  }
}
