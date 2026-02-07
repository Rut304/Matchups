import { NextResponse } from 'next/server'
import { fetchMultiBookOdds } from '@/lib/scrapers/action-network'
import { createAdminClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const sport = (searchParams.get('sport') || 'NFL').toUpperCase()

    const supabase = await createAdminClient()

    const odds = await fetchMultiBookOdds(sport)
    if (!odds || odds.length === 0) {
      return NextResponse.json({ success: true, inserted: 0, message: 'No odds found' })
    }

    let inserted = 0
    for (const game of odds) {
      for (const book of game.books || []) {
        try {
          const payload = {
            game_id: game.gameId,
            sport: game.sport,
            provider: 'action_network',
            book_id: String(book.bookmaker_id || book.bookmaker || ''),
            book_name: book.bookmaker || book.book || 'unknown',
            spread_home: book.spread || null,
            spread_away: null,
            spread_home_odds: book.spreadOdds || null,
            spread_away_odds: null,
            total_line: book.total || null,
            total_over_odds: book.overOdds || null,
            total_under_odds: book.underOdds || null,
            home_ml: book.homeML || null,
            away_ml: book.awayML || null,
            raw_payload: book,
            is_open_snapshot: false,
            is_close_snapshot: false
          }

          const { error } = await supabase.from('line_snapshots').insert(payload)
          if (!error) inserted += 1
        } catch (e) {
          // continue on error for individual books
          console.error('Insert snapshot error', e)
        }
      }
    }

    return NextResponse.json({ success: true, inserted })
  } catch (error) {
    console.error('Line snapshot ingest error:', error)
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}
