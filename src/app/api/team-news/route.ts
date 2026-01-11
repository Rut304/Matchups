import { NextRequest, NextResponse } from 'next/server'
import { getTeamNewsFeed, getInjuries } from '@/lib/api/news'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const sport = searchParams.get('sport')
  const teamId = searchParams.get('teamId')
  const teamName = searchParams.get('teamName')
  const abbreviation = searchParams.get('abbreviation')

  if (!sport || !teamId || !teamName || !abbreviation) {
    return NextResponse.json(
      { error: 'Missing required parameters' },
      { status: 400 }
    )
  }

  try {
    const [newsFeed, injuries] = await Promise.all([
      getTeamNewsFeed(sport, {
        id: teamId,
        name: teamName,
        abbreviation,
      }, {
        includeTwitter: true,
        includeInjuries: false, // Get injuries separately for better structure
        limit: 20,
      }),
      getInjuries(sport, teamId),
    ])

    return NextResponse.json({
      news: newsFeed.items,
      injuries,
      lastUpdated: newsFeed.lastUpdated,
    })
  } catch (error) {
    console.error('Team news API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch team news', news: [], injuries: [] },
      { status: 500 }
    )
  }
}
