import { NextRequest, NextResponse } from 'next/server'
import { getLiveMatchups, getMatchupsByDate, getTodaysSummary } from '@/lib/live-sports-data'
import type { Sport } from '@/lib/live-sports-data'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const sport = searchParams.get('sport') as Sport | null
  const date = searchParams.get('date')
  const summary = searchParams.get('summary')

  try {
    // If summary is requested, return today's summary
    if (summary === 'true') {
      const summaryData = await getTodaysSummary()
      return NextResponse.json(summaryData)
    }

    // Validate sport
    if (!sport || !['NFL', 'NBA', 'NHL', 'MLB'].includes(sport)) {
      return NextResponse.json(
        { error: 'Invalid or missing sport parameter' },
        { status: 400 }
      )
    }

    // Fetch matchups
    let matchups
    if (date) {
      const dateObj = new Date(date)
      if (isNaN(dateObj.getTime())) {
        return NextResponse.json(
          { error: 'Invalid date format' },
          { status: 400 }
        )
      }
      // Format date as YYYY-MM-DD for the API
      const formattedDate = dateObj.toISOString().split('T')[0]
      matchups = await getMatchupsByDate(sport, formattedDate)
    } else {
      matchups = await getLiveMatchups(sport)
    }

    return NextResponse.json({
      sport,
      date: date || new Date().toISOString().split('T')[0],
      matchups,
      count: matchups.length,
    })
  } catch (error) {
    console.error('Matchups API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch matchups' },
      { status: 500 }
    )
  }
}
