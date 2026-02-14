/**
 * Backfill accurate closing odds from game_odds into historical_games
 * 
 * The historical_games table has inaccurate/missing spread data.
 * game_odds has real closing lines from The Odds API (2020+).
 * This script cross-references them and updates historical_games.
 * 
 * Usage:
 *   npx tsx scripts/backfill-closing-odds.ts [--sport=nfl] [--season=2024] [--dry-run]
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.join(process.cwd(), '.env.local') })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Missing SUPABASE env vars')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

// Parse CLI args
const args = process.argv.slice(2)
const sportArg = args.find(a => a.startsWith('--sport='))?.split('=')[1]
const seasonArg = args.find(a => a.startsWith('--season='))?.split('=')[1]
const dryRun = args.includes('--dry-run')

// Team name normalization for matching
const TEAM_ALIASES: Record<string, string[]> = {
  'kansas city chiefs': ['kc', 'chiefs'],
  'san francisco 49ers': ['sf', '49ers'],
  'new york jets': ['nyj', 'jets'],
  'new york giants': ['nyg', 'giants'],
  'los angeles rams': ['lar', 'rams'],
  'los angeles chargers': ['lac', 'chargers'],
  'las vegas raiders': ['lv', 'raiders', 'oakland raiders'],
  'new england patriots': ['ne', 'patriots'],
  'green bay packers': ['gb', 'packers'],
  'tampa bay buccaneers': ['tb', 'buccaneers', 'bucs'],
  'new orleans saints': ['no', 'saints'],
  'washington commanders': ['was', 'commanders', 'washington football team', 'washington redskins'],
  'tennessee titans': ['ten', 'titans'],
  'jacksonville jaguars': ['jax', 'jaguars'],
  'indianapolis colts': ['ind', 'colts'],
  'oklahoma city thunder': ['okc', 'thunder'],
  'portland trail blazers': ['por', 'trail blazers', 'blazers'],
  'golden state warriors': ['gs', 'gsw', 'warriors'],
  'san antonio spurs': ['sa', 'sas', 'spurs'],
  'new york knicks': ['nyk', 'knicks'],
  'brooklyn nets': ['bkn', 'nets'],
  'los angeles lakers': ['lal', 'lakers'],
  'los angeles clippers': ['lac', 'clippers'],
}

function normalizeTeamName(name: string): string {
  return name.toLowerCase().trim()
}

function teamsMatch(name1: string, name2: string): boolean {
  const n1 = normalizeTeamName(name1)
  const n2 = normalizeTeamName(name2)
  
  // Exact match
  if (n1 === n2) return true
  
  // One contains the other
  if (n1.includes(n2) || n2.includes(n1)) return true
  
  // Last word match (team nickname)
  const lastWord1 = n1.split(' ').pop() || ''
  const lastWord2 = n2.split(' ').pop() || ''
  if (lastWord1.length > 3 && lastWord1 === lastWord2) return true
  
  // Check aliases
  for (const [canonical, aliases] of Object.entries(TEAM_ALIASES)) {
    const allNames = [canonical, ...aliases]
    const match1 = allNames.some(a => n1.includes(a) || a.includes(n1))
    const match2 = allNames.some(a => n2.includes(a) || a.includes(n2))
    if (match1 && match2) return true
  }
  
  return false
}

function computeSpreadResult(
  homeScore: number, 
  awayScore: number, 
  spread: number
): 'home_cover' | 'away_cover' | 'push' {
  // spread is from home team perspective (negative = home favorite)
  const adjustedHome = homeScore + spread
  if (adjustedHome > awayScore) return 'home_cover'
  if (adjustedHome < awayScore) return 'away_cover'
  return 'push'
}

function computeTotalResult(
  homeScore: number, 
  awayScore: number, 
  total: number
): 'over' | 'under' | 'push' {
  const totalPoints = homeScore + awayScore
  if (totalPoints > total) return 'over'
  if (totalPoints < total) return 'under'
  return 'push'
}

async function backfill() {
  console.log('🔄 Backfilling accurate closing odds from game_odds → historical_games')
  console.log(`   Sport: ${sportArg || 'all'}`)
  console.log(`   Season: ${seasonArg || 'all'}`)
  console.log(`   Dry run: ${dryRun}`)
  console.log('')
  
  const sports = sportArg ? [sportArg.toLowerCase()] : ['nfl', 'nba', 'mlb', 'nhl', 'ncaaf', 'ncaab']
  
  let totalUpdated = 0
  let totalSkipped = 0
  let totalNoMatch = 0
  let totalAlreadyCorrect = 0
  
  for (const sport of sports) {
    console.log(`\n============ ${sport.toUpperCase()} ============`)
    
    // Fetch all game_odds for this sport (and season if specified)
    // Use pagination since Supabase caps at 1000 rows per request
    let allOddsData: any[] = []
    let oddsOffset = 0
    const PAGE_SIZE = 1000
    while (true) {
      let oddsQuery = supabase
        .from('game_odds')
        .select('home_team, away_team, game_date, season, consensus_spread, consensus_total, consensus_home_ml, consensus_away_ml')
        .eq('sport', sport)
        .not('consensus_spread', 'is', null)
        .range(oddsOffset, oddsOffset + PAGE_SIZE - 1)
      
      if (seasonArg) {
        oddsQuery = oddsQuery.eq('season', parseInt(seasonArg))
      }
      
      const { data: oddsPage, error: oddsError } = await oddsQuery
      
      if (oddsError) {
        console.error(`❌ Error fetching game_odds for ${sport}:`, oddsError)
        break
      }
      
      if (!oddsPage || oddsPage.length === 0) break
      allOddsData.push(...oddsPage)
      if (oddsPage.length < PAGE_SIZE) break
      oddsOffset += PAGE_SIZE
    }
    
    const oddsData = allOddsData
    
    if (oddsData.length === 0) {
      console.log(`   No game_odds data found for ${sport}`)
      continue
    }
    
    console.log(`   Found ${oddsData.length} games with odds data`)
    
    // Build a lookup by date
    const oddsByDate = new Map<string, typeof oddsData>()
    for (const odds of oddsData) {
      const existing = oddsByDate.get(odds.game_date) || []
      existing.push(odds)
      oddsByDate.set(odds.game_date, existing)
    }
    
    // Fetch historical_games for this sport (paginated)
    let allHistGames: any[] = []
    let histOffset = 0
    while (true) {
      let histQuery = supabase
        .from('historical_games')
        .select('id, home_team_name, away_team_name, home_team_abbr, away_team_abbr, game_date, season, home_score, away_score, point_spread, over_under, spread_result, total_result')
        .eq('sport', sport)
        .range(histOffset, histOffset + PAGE_SIZE - 1)
      
      if (seasonArg) {
        histQuery = histQuery.eq('season', parseInt(seasonArg))
      }
      
      const { data: histPage, error: histError } = await histQuery
      
      if (histError) {
        console.error(`❌ Error fetching historical_games for ${sport}:`, histError)
        break
      }
      
      if (!histPage || histPage.length === 0) break
      allHistGames.push(...histPage)
      if (histPage.length < PAGE_SIZE) break
      histOffset += PAGE_SIZE
    }
    
    const histGames = allHistGames
    
    if (!histGames || histGames.length === 0) {
      console.log(`   No historical_games found for ${sport}`)
      continue
    }
    
    console.log(`   Found ${histGames.length} historical games to check`)
    
    let sportUpdated = 0
    let sportSkipped = 0
    let sportNoMatch = 0
    let sportCorrect = 0
    
    for (const game of histGames) {
      // Skip games without scores (can't compute results)
      if (game.home_score == null || game.away_score == null) {
        sportSkipped++
        continue
      }
      
      // Skip Pro Bowl, All-Star games etc
      if (game.home_team_name?.includes('NFC') || game.home_team_name?.includes('AFC') ||
          game.home_team_name?.includes('All-Star') || game.away_team_name?.includes('All-Star')) {
        sportSkipped++
        continue
      }
      
      // Find matching game_odds record — try exact date, then ±1 day for timezone edge cases
      let dateOdds = oddsByDate.get(game.game_date)
      
      if (!dateOdds || dateOdds.length === 0) {
        // Try adjacent dates (games near midnight UTC can land on different dates)
        const d = new Date(game.game_date + 'T12:00:00Z')
        const prevDate = new Date(d.getTime() - 86400000).toISOString().split('T')[0]
        const nextDate = new Date(d.getTime() + 86400000).toISOString().split('T')[0]
        dateOdds = oddsByDate.get(prevDate) || oddsByDate.get(nextDate)
      }
      
      if (!dateOdds || dateOdds.length === 0) {
        sportNoMatch++
        continue
      }
      
      // Find the matching game by team names
      const matchingOdds = dateOdds.find(odds => 
        teamsMatch(odds.home_team, game.home_team_name || '') &&
        teamsMatch(odds.away_team, game.away_team_name || '')
      )
      
      if (!matchingOdds) {
        // Try reverse (sometimes home/away is flipped for neutral site games)
        const reverseMatch = dateOdds.find(odds =>
          teamsMatch(odds.home_team, game.away_team_name || '') &&
          teamsMatch(odds.away_team, game.home_team_name || '')
        )
        
        if (!reverseMatch) {
          sportNoMatch++
          continue
        }
        
        // Reverse match found - use negated spread
        const spread = reverseMatch.consensus_spread ? -reverseMatch.consensus_spread : null
        const total = reverseMatch.consensus_total
        
        if (spread == null || total == null) {
          sportSkipped++
          continue
        }
        
        // Check if already correct
        if (Math.abs((game.point_spread || 0) - spread) < 0.1 && 
            Math.abs((game.over_under || 0) - total) < 0.1) {
          sportCorrect++
          continue
        }
        
        const spreadResult = computeSpreadResult(game.home_score, game.away_score, spread)
        const totalResult = computeTotalResult(game.home_score, game.away_score, total)
        
        if (!dryRun) {
          const { error: updateErr } = await supabase
            .from('historical_games')
            .update({
              point_spread: spread,
              over_under: total,
              spread_result: spreadResult,
              total_result: totalResult,
              close_spread: spread,
              close_total: total,
            })
            .eq('id', game.id)
          
          if (updateErr) {
            console.error(`   ❌ Update failed for ${game.id}:`, updateErr.message)
            continue
          }
        }
        
        sportUpdated++
        continue
      }
      
      // Direct match
      const spread = matchingOdds.consensus_spread
      const total = matchingOdds.consensus_total
      
      if (spread == null || total == null) {
        sportSkipped++
        continue
      }
      
      // Check if already correct
      if (Math.abs((game.point_spread || 0) - spread) < 0.1 && 
          Math.abs((game.over_under || 0) - total) < 0.1) {
        sportCorrect++
        continue
      }
      
      const spreadResult = computeSpreadResult(game.home_score, game.away_score, spread)
      const totalResult = computeTotalResult(game.home_score, game.away_score, total)
      
      if (!dryRun) {
        const { error: updateErr } = await supabase
          .from('historical_games')
          .update({
            point_spread: spread,
            over_under: total,
            spread_result: spreadResult,
            total_result: totalResult,
            close_spread: spread,
            close_total: total,
          })
          .eq('id', game.id)
        
        if (updateErr) {
          console.error(`   ❌ Update failed for ${game.id}:`, updateErr.message)
          continue
        }
      }
      
      if (sportUpdated < 5 || sportUpdated % 100 === 0) {
        const oldSpread = game.point_spread ?? 'null'
        console.log(`   ✅ ${game.game_date} ${game.away_team_abbr}@${game.home_team_abbr}: spread ${oldSpread}→${spread}, total ${game.over_under ?? 'null'}→${total}, result: ${spreadResult}/${totalResult}`)
      }
      
      sportUpdated++
    }
    
    console.log(`\n   ${sport.toUpperCase()} Summary:`)
    console.log(`     Updated:  ${sportUpdated}`)
    console.log(`     Correct:  ${sportCorrect}`)
    console.log(`     No match: ${sportNoMatch}`)
    console.log(`     Skipped:  ${sportSkipped}`)
    
    totalUpdated += sportUpdated
    totalAlreadyCorrect += sportCorrect
    totalNoMatch += sportNoMatch
    totalSkipped += sportSkipped
  }
  
  console.log('\n============================================')
  console.log('TOTAL SUMMARY:')
  console.log(`  Updated:         ${totalUpdated}`)
  console.log(`  Already correct: ${totalAlreadyCorrect}`)
  console.log(`  No odds match:   ${totalNoMatch}`)
  console.log(`  Skipped:         ${totalSkipped}`)
  if (dryRun) {
    console.log('\n  ⚠️  DRY RUN - no changes written')
    console.log('  Run without --dry-run to apply changes')
  }
}

backfill().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
