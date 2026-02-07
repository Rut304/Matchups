#!/usr/bin/env npx tsx
/**
 * Check Supabase Database Status
 */
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { resolve } from 'path'

// Load env from .env.local
dotenv.config({ path: resolve(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkDatabase() {
  console.log('='.repeat(60))
  console.log('SUPABASE DATABASE STATUS')
  console.log('='.repeat(60))
  
  const tables = [
    'historical_games',
    'player_props', 
    'player_stats',
    'line_snapshots',
    'expert_picks',
    'cappers',
    'capper_stats',
    'betting_trends',
    'sus_plays',
    'marketplace_items',
    'user_systems',
    'edge_alerts'
  ]
  
  for (const table of tables) {
    try {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true })
      
      if (error) {
        console.log(`❌ ${table.padEnd(20)} - Table missing or error: ${error.message}`)
      } else {
        const emoji = (count || 0) > 0 ? '✅' : '⚠️'
        console.log(`${emoji} ${table.padEnd(20)} - ${count || 0} rows`)
      }
    } catch (e: any) {
      console.log(`❌ ${table.padEnd(20)} - Error: ${e.message}`)
    }
  }
  
  console.log('\n' + '='.repeat(60))
  console.log('DATA QUALITY CHECK')
  console.log('='.repeat(60))
  
  // Check recent historical games
  const { data: recentGames } = await supabase
    .from('historical_games')
    .select('sport, count')
    .limit(10)
  
  if (recentGames && recentGames.length > 0) {
    console.log('\nRecent Historical Games by Sport:')
    // Get counts by sport
    const { data: sportCounts } = await supabase
      .rpc('count_by_sport')
      .catch(() => ({ data: null }))
    
    if (!sportCounts) {
      // Manual query
      const { data: nflCount } = await supabase
        .from('historical_games')
        .select('*', { count: 'exact', head: true })
        .eq('sport', 'NFL')
      const { data: nbaCount } = await supabase
        .from('historical_games')
        .select('*', { count: 'exact', head: true })
        .eq('sport', 'NBA')
      console.log(`  NFL: ${nflCount || 0}`)
      console.log(`  NBA: ${nbaCount || 0}`)
    }
  } else {
    console.log('\n⚠️  No historical games found - needs import!')
  }
  
  // Check expert picks
  const { count: picksCount } = await supabase
    .from('expert_picks')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
  
  console.log(`\nExpert picks (last 7 days): ${picksCount || 0}`)
  
  // Check cappers
  const { data: cappers } = await supabase
    .from('cappers')
    .select('name, platform')
    .limit(10)
  
  if (cappers && cappers.length > 0) {
    console.log(`\nCappers tracked: ${cappers.length}+`)
    cappers.slice(0, 5).forEach(c => console.log(`  - ${c.name} (${c.platform})`))
  }
}

checkDatabase()
  .then(() => process.exit(0))
  .catch(e => {
    console.error('Error:', e)
    process.exit(1)
  })
