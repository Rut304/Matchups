import { NextRequest, NextResponse } from 'next/server'
import { getGameNewsFeed, getGameInjuries } from '@/lib/api/news'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const sport = searchParams.get('sport')
  const gameId = searchParams.get('gameId')
  const homeTeamId = searchParams.get('homeTeamId')
  const homeTeamName = searchParams.get('homeTeamName')
  const homeAbbr = searchParams.get('homeAbbr')
  const awayTeamId = searchParams.get('awayTeamId')
  const awayTeamName = searchParams.get('awayTeamName')
  const awayAbbr = searchParams.get('awayAbbr')

  if (!sport || !gameId || !homeTeamId || !awayTeamId) {
    return NextResponse.json(
      { error: 'Missing required parameters' },
      { status: 400 }
    )
  }

  try {
    const homeTeam = {
      id: homeTeamId,
      name: homeTeamName || 'Home Team',
      abbreviation: homeAbbr || 'HME',
    }
    
    const awayTeam = {
      id: awayTeamId,
      name: awayTeamName || 'Away Team',
      abbreviation: awayAbbr || 'AWY',
    }

    const [newsFeed, injuries] = await Promise.all([
      getGameNewsFeed(sport, gameId, homeTeam, awayTeam, {
        includeTwitter: true,
        includeInjuries: false,
        limit: 15,
      }),
      getGameInjuries(sport, gameId),
    ])

    return NextResponse.json({
      news: newsFeed.items,
      injuries,
      lastUpdated: newsFeed.lastUpdated,
    })
  } catch (error) {
    console.error('Game news API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch game news', news: [], injuries: [] },
      { status: 500 }
    )
  }
}
