#!/usr/bin/env ts-node
import 'dotenv/config'
import { fetchMultiBookOdds } from '../src/lib/scrapers/action-network'
import { createClient } from '@supabase/supabase-js'

async function main() {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.error('Supabase credentials not set. Provide SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in env')
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, supabaseKey)

  const sports = (process.env.INGEST_SPORTS || 'NFL').split(',').map(s => s.trim())

  for (const sport of sports) {
    console.log('Fetching odds for', sport)
    const odds = await fetchMultiBookOdds(sport)
    if (!odds || odds.length === 0) {
      console.log('No odds returned for', sport)
      continue
    }

    let inserted = 0
    for (const game of odds) {
      for (const book of game.books || []) {
        try {
          const bookId = String(book.bookmaker_id || book.bookmaker || '')

          // fetch latest existing snapshot for this game/book
          const { data: lastRow } = await supabase
            .from('line_snapshots')
            .select('*')
            .eq('game_id', game.gameId)
            .eq('book_id', bookId)
            .order('snapshot_ts', { ascending: false })
            .limit(1)

          const last = lastRow && lastRow[0]

          const payload = {
            game_id: game.gameId,
            sport: game.sport,
            provider: 'action_network',
            book_id: bookId,
            book_name: book.bookmaker || book.book || 'unknown',
            snapshot_ts: new Date().toISOString(),
            spread_home: book.spread || null,
            total_line: book.total || null,
            total_over_odds: book.overOdds || null,
            total_under_odds: book.underOdds || null,
            home_ml: book.homeML || null,
            away_ml: book.awayML || null,
            raw_payload: book
          }

          // dedupe: if last exists and key numeric fields identical, skip
          if (last) {
            const same = Number(last.spread_home || 0) === Number(payload.spread_home || 0)
              && Number(last.total_line || 0) === Number(payload.total_line || 0)
              && Number(last.home_ml || 0) === Number(payload.home_ml || 0)
            if (same) {
              // skip
              continue
            }
          }

          const { error } = await supabase.from('line_snapshots').insert(payload)
          if (error) {
            console.error('Insert error', error)
          } else inserted += 1
        } catch (e) {
          console.error('Error inserting snapshot', e)
        }
      }
    }

    console.log(`Sport ${sport}: inserted ${inserted} snapshots`)
  }
}

main().catch(err => { console.error(err); process.exit(1) })
