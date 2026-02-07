/**
 * SPORTSBOOK PROPS SCRAPER
 * 
 * Scrapes player props from major sportsbooks (FREE - no API key needed)
 * Priority Order:
 * 1. DraftKings - Most comprehensive prop markets
 * 2. FanDuel - Good prop coverage
 * 3. ESPN (for player stats context)
 * 
 * These are PUBLIC endpoints - no authentication required
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { resolve } from 'path'

dotenv.config({ path: resolve(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null

// =============================================================================
// TYPES
// =============================================================================

interface PropLine {
  book: string
  line: number
  overOdds: number
  underOdds: number
  lastUpdate: string
}

interface ScrapedProp {
  gameId: string
  sport: string
  playerId: string
  playerName: string
  playerTeam: string
  propType: string
  propCategory: string
  lines: PropLine[]
  bestOver: { book: string; line: number; odds: number } | null
  bestUnder: { book: string; line: number; odds: number } | null
}

// =============================================================================
// DRAFTKINGS API (PUBLIC)
// =============================================================================

// DraftKings sport IDs
const DK_SPORT_IDS: Record<string, number> = {
  'NFL': 1,
  'NBA': 3,
  'MLB': 2,
  'NHL': 4,
  'NCAAF': 6,
  'NCAAB': 5,
  'WNBA': 3, // Same as NBA
}

// DraftKings category IDs for props
const DK_PROP_CATEGORIES: Record<string, Record<string, number>> = {
  NFL: {
    'passing_yards': 1000,
    'passing_tds': 1001,
    'rushing_yards': 1002,
    'receiving_yards': 1003,
    'receptions': 1004,
    'anytime_td': 1005,
  },
  NBA: {
    'points': 583,
    'rebounds': 584,
    'assists': 585,
    'threes': 586,
    'pts_reb_ast': 587,
  },
  MLB: {
    'hits': 670,
    'total_bases': 671,
    'strikeouts': 672,
    'home_runs': 673,
  },
  NHL: {
    'goals': 705,
    'assists': 706,
    'points': 707,
    'shots': 708,
  }
}

/**
 * Fetch props from DraftKings API (public, no auth needed)
 */
async function fetchDraftKingsProps(sport: string): Promise<ScrapedProp[]> {
  const props: ScrapedProp[] = []
  
  try {
    const sportId = DK_SPORT_IDS[sport.toUpperCase()]
    if (!sportId) {
      console.log(`Sport ${sport} not supported for DraftKings`)
      return []
    }
    
    // DraftKings public sportsbook API
    const baseUrl = 'https://sportsbook-nash.draftkings.com/api/sportscontent/dkusoh/v1/leagues'
    
    // Get league/events data
    const eventsUrl = `${baseUrl}/${sportId}/events`
    
    console.log(`[DraftKings] Fetching ${sport} events...`)
    
    const eventsRes = await fetch(eventsUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'application/json',
      }
    })
    
    if (!eventsRes.ok) {
      console.log(`[DraftKings] Events API returned ${eventsRes.status}`)
      return []
    }
    
    const eventsData = await eventsRes.json()
    const events = eventsData.events || []
    
    console.log(`[DraftKings] Found ${events.length} ${sport} events`)
    
    // For each event, get player props
    for (const event of events.slice(0, 10)) { // Limit to 10 games
      const eventId = event.eventId
      const eventName = event.name || 'Unknown'
      
      // Fetch player prop markets for this event
      try {
        const propsUrl = `https://sportsbook-nash.draftkings.com/api/sportscontent/dkusoh/v1/events/${eventId}/categories/player-props`
        
        const propsRes = await fetch(propsUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
            'Accept': 'application/json',
          }
        })
        
        if (!propsRes.ok) continue
        
        const propsData = await propsRes.json()
        const markets = propsData.markets || propsData.selections || []
        
        for (const market of markets) {
          const playerName = market.playerName || market.label || ''
          const propType = market.marketType || market.type || ''
          const selections = market.selections || market.outcomes || []
          
          if (!playerName || selections.length === 0) continue
          
          const lines: PropLine[] = []
          
          for (const selection of selections) {
            const line = selection.points || selection.line || 0
            const odds = selection.odds || selection.price || 0
            const isOver = selection.label?.toLowerCase().includes('over') || selection.name?.toLowerCase().includes('over')
            
            const existingLine = lines.find(l => l.line === line)
            if (existingLine) {
              if (isOver) existingLine.overOdds = odds
              else existingLine.underOdds = odds
            } else {
              lines.push({
                book: 'draftkings',
                line,
                overOdds: isOver ? odds : 0,
                underOdds: !isOver ? odds : 0,
                lastUpdate: new Date().toISOString()
              })
            }
          }
          
          if (lines.length > 0) {
            props.push({
              gameId: String(eventId),
              sport: sport.toUpperCase(),
              playerId: playerName.toLowerCase().replace(/\s/g, '-'),
              playerName,
              playerTeam: '', // Would need to parse from event name
              propType: normalizePropType(propType),
              propCategory: getPropCategory(propType),
              lines,
              bestOver: findBestOver(lines),
              bestUnder: findBestUnder(lines)
            })
          }
        }
      } catch (e) {
        // Continue to next event
      }
      
      // Small delay between requests
      await new Promise(r => setTimeout(r, 100))
    }
    
  } catch (error) {
    console.error('[DraftKings] Error fetching props:', error)
  }
  
  return props
}

// =============================================================================
// FANDUEL API (PUBLIC)
// =============================================================================

const FD_SPORT_IDS: Record<string, string> = {
  'NFL': 'americanfootball',
  'NBA': 'basketball',
  'MLB': 'baseball',
  'NHL': 'icehockey',
  'NCAAF': 'americanfootball',
  'NCAAB': 'basketball',
}

/**
 * Fetch props from FanDuel API (public, no auth needed)
 */
async function fetchFanDuelProps(sport: string): Promise<ScrapedProp[]> {
  const props: ScrapedProp[] = []
  
  try {
    const sportKey = FD_SPORT_IDS[sport.toUpperCase()]
    if (!sportKey) {
      console.log(`Sport ${sport} not supported for FanDuel`)
      return []
    }
    
    // FanDuel public sportsbook API
    const baseUrl = 'https://sbapi.ny.sportsbook.fanduel.com/api'
    
    // Get events
    const eventsUrl = `${baseUrl}/content-managed-page?page=CUSTOM&customPageId=nfl&_ak=FhMFpcPWXMeyZxOx&timezone=America%2FNew_York`
    
    console.log(`[FanDuel] Fetching ${sport} events...`)
    
    const eventsRes = await fetch(eventsUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'application/json',
      }
    })
    
    if (!eventsRes.ok) {
      console.log(`[FanDuel] Events API returned ${eventsRes.status}`)
      return []
    }
    
    const data = await eventsRes.json()
    const attachments = data.attachments || {}
    const events = Object.values(attachments.events || {}) as any[]
    
    console.log(`[FanDuel] Found ${events.length} ${sport} events`)
    
    // Parse markets from attachments
    const markets = Object.values(attachments.markets || {}) as any[]
    
    for (const market of markets) {
      // Filter for player prop markets
      if (!market.marketType?.includes('Player') && !market.marketName?.includes('Player')) {
        continue
      }
      
      const playerName = market.runnerName || market.marketName?.split(' - ')[0] || ''
      const propType = market.eventType || market.marketType || ''
      const runners = market.runners || []
      
      if (!playerName || runners.length === 0) continue
      
      const lines: PropLine[] = []
      
      for (const runner of runners) {
        const handicap = runner.handicap || 0
        const odds = runner.winRunnerOdds?.americanOdds || 0
        const isOver = runner.runnerName?.toLowerCase().includes('over')
        
        const existingLine = lines.find(l => Math.abs(l.line - handicap) < 0.1)
        if (existingLine) {
          if (isOver) existingLine.overOdds = odds
          else existingLine.underOdds = odds
        } else {
          lines.push({
            book: 'fanduel',
            line: handicap,
            overOdds: isOver ? odds : 0,
            underOdds: !isOver ? odds : 0,
            lastUpdate: new Date().toISOString()
          })
        }
      }
      
      if (lines.length > 0) {
        const eventId = market.eventId || 'unknown'
        
        props.push({
          gameId: String(eventId),
          sport: sport.toUpperCase(),
          playerId: playerName.toLowerCase().replace(/\s/g, '-'),
          playerName,
          playerTeam: '',
          propType: normalizePropType(propType),
          propCategory: getPropCategory(propType),
          lines,
          bestOver: findBestOver(lines),
          bestUnder: findBestUnder(lines)
        })
      }
    }
    
  } catch (error) {
    console.error('[FanDuel] Error fetching props:', error)
  }
  
  return props
}

// =============================================================================
// ACTION NETWORK (FREE TIER)
// =============================================================================

/**
 * Fetch props from Action Network (free tier)
 */
async function fetchActionNetworkProps(sport: string): Promise<ScrapedProp[]> {
  const props: ScrapedProp[] = []
  
  try {
    // Action Network public props page
    const sportSlug = sport.toLowerCase()
    const url = `https://www.actionnetwork.com/api/web/props/player-props?sport=${sportSlug}`
    
    console.log(`[Action Network] Fetching ${sport} props...`)
    
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'application/json',
      }
    })
    
    if (!res.ok) {
      console.log(`[Action Network] Props API returned ${res.status}`)
      return []
    }
    
    const data = await res.json()
    const propData = data.props || data.player_props || []
    
    console.log(`[Action Network] Found ${propData.length} ${sport} props`)
    
    for (const prop of propData) {
      const playerName = prop.player_name || prop.player?.full_name || ''
      const propType = prop.prop_type || prop.market_type || ''
      const books = prop.books || prop.sportsbooks || []
      
      if (!playerName || books.length === 0) continue
      
      const lines: PropLine[] = []
      
      for (const book of books) {
        const line = book.line || book.total || 0
        const overOdds = book.over_odds || book.over_price || 0
        const underOdds = book.under_odds || book.under_price || 0
        
        lines.push({
          book: book.name || book.book_name || 'unknown',
          line,
          overOdds,
          underOdds,
          lastUpdate: new Date().toISOString()
        })
      }
      
      if (lines.length > 0) {
        props.push({
          gameId: prop.game_id || prop.event_id || 'unknown',
          sport: sport.toUpperCase(),
          playerId: playerName.toLowerCase().replace(/\s/g, '-'),
          playerName,
          playerTeam: prop.team || prop.player?.team || '',
          propType: normalizePropType(propType),
          propCategory: getPropCategory(propType),
          lines,
          bestOver: findBestOver(lines),
          bestUnder: findBestUnder(lines)
        })
      }
    }
    
  } catch (error) {
    console.error('[Action Network] Error fetching props:', error)
  }
  
  return props
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function normalizePropType(raw: string): string {
  const lower = raw.toLowerCase().replace(/[^a-z]/g, '')
  
  const mappings: Record<string, string> = {
    'passingyards': 'passing_yards',
    'passyards': 'passing_yards',
    'passingtouchdowns': 'passing_tds',
    'passingtds': 'passing_tds',
    'rushingyards': 'rushing_yards',
    'rushyards': 'rushing_yards',
    'receivingyards': 'receiving_yards',
    'recyards': 'receiving_yards',
    'receptions': 'receptions',
    'points': 'points',
    'rebounds': 'rebounds',
    'assists': 'assists',
    'threepointers': 'threes',
    'threes': 'threes',
    'goals': 'goals',
    'shots': 'shots',
    'hits': 'hits',
    'strikeouts': 'strikeouts',
    'totalbases': 'total_bases',
  }
  
  return mappings[lower] || raw.toLowerCase().replace(/\s+/g, '_')
}

function getPropCategory(propType: string): string {
  const type = propType.toLowerCase()
  
  if (type.includes('pass')) return 'passing'
  if (type.includes('rush')) return 'rushing'
  if (type.includes('receiv') || type.includes('recep')) return 'receiving'
  if (type.includes('point') || type.includes('score')) return 'scoring'
  if (type.includes('rebound')) return 'rebounding'
  if (type.includes('assist')) return 'playmaking'
  if (type.includes('goal')) return 'scoring'
  if (type.includes('shot')) return 'shooting'
  if (type.includes('hit') || type.includes('base')) return 'hitting'
  if (type.includes('strike') || type.includes('pitch')) return 'pitching'
  
  return 'other'
}

function findBestOver(lines: PropLine[]): { book: string; line: number; odds: number } | null {
  let best: { book: string; line: number; odds: number } | null = null
  
  for (const line of lines) {
    if (line.overOdds && (!best || line.line < best.line || 
        (line.line === best.line && line.overOdds > best.odds))) {
      best = { book: line.book, line: line.line, odds: line.overOdds }
    }
  }
  
  return best
}

function findBestUnder(lines: PropLine[]): { book: string; line: number; odds: number } | null {
  let best: { book: string; line: number; odds: number } | null = null
  
  for (const line of lines) {
    if (line.underOdds && (!best || line.line > best.line || 
        (line.line === best.line && line.underOdds > best.odds))) {
      best = { book: line.book, line: line.line, odds: line.underOdds }
    }
  }
  
  return best
}

// =============================================================================
// AGGREGATION & STORAGE
// =============================================================================

/**
 * Merge props from multiple sources, prioritizing:
 * 1. Action Network (free, good splits data)
 * 2. DraftKings (comprehensive)
 * 3. FanDuel (good coverage)
 */
function mergeProps(
  actionProps: ScrapedProp[],
  dkProps: ScrapedProp[],
  fdProps: ScrapedProp[]
): ScrapedProp[] {
  const merged = new Map<string, ScrapedProp>()
  
  // Helper to create unique key
  const getKey = (p: ScrapedProp) => `${p.playerName.toLowerCase()}-${p.propType}`
  
  // Add Action Network first (priority)
  for (const prop of actionProps) {
    merged.set(getKey(prop), prop)
  }
  
  // Merge DraftKings lines
  for (const prop of dkProps) {
    const key = getKey(prop)
    if (merged.has(key)) {
      // Add DK lines to existing prop
      const existing = merged.get(key)!
      existing.lines.push(...prop.lines)
    } else {
      merged.set(key, prop)
    }
  }
  
  // Merge FanDuel lines
  for (const prop of fdProps) {
    const key = getKey(prop)
    if (merged.has(key)) {
      const existing = merged.get(key)!
      existing.lines.push(...prop.lines)
    } else {
      merged.set(key, prop)
    }
  }
  
  // Recalculate best lines for merged props
  return Array.from(merged.values()).map(prop => ({
    ...prop,
    bestOver: findBestOver(prop.lines),
    bestUnder: findBestUnder(prop.lines)
  }))
}

/**
 * Save props to database
 */
async function savePropsToDb(props: ScrapedProp[]): Promise<number> {
  if (!supabase || props.length === 0) return 0
  
  const rows = props.map(p => ({
    game_id: p.gameId,
    sport: p.sport,
    player_id: p.playerId,
    player_name: p.playerName,
    player_team: p.playerTeam,
    prop_type: p.propType,
    prop_category: p.propCategory,
    lines: JSON.stringify(p.lines),
    best_over_line: p.bestOver?.line,
    best_over_odds: p.bestOver?.odds,
    best_over_book: p.bestOver?.book,
    best_under_line: p.bestUnder?.line,
    best_under_odds: p.bestUnder?.odds,
    best_under_book: p.bestUnder?.book,
    recorded_at: new Date().toISOString()
  }))
  
  const { error } = await supabase
    .from('player_props')
    .upsert(rows, { onConflict: 'game_id,player_id,prop_type' })
  
  if (error) {
    console.error('Error saving props:', error.message)
    return 0
  }
  
  return props.length
}

// =============================================================================
// MAIN
// =============================================================================

async function collectAllProps(sport: string): Promise<ScrapedProp[]> {
  console.log(`\n${'='.repeat(60)}`)
  console.log(`COLLECTING ${sport} PROPS FROM ALL SOURCES`)
  console.log('='.repeat(60))
  
  // Fetch from all sources in parallel
  const [actionProps, dkProps, fdProps] = await Promise.all([
    fetchActionNetworkProps(sport),
    fetchDraftKingsProps(sport),
    fetchFanDuelProps(sport)
  ])
  
  console.log(`\nResults:`)
  console.log(`  Action Network: ${actionProps.length} props`)
  console.log(`  DraftKings: ${dkProps.length} props`)
  console.log(`  FanDuel: ${fdProps.length} props`)
  
  // Merge all sources
  const merged = mergeProps(actionProps, dkProps, fdProps)
  console.log(`  Merged: ${merged.length} unique props`)
  
  // Save to database
  if (merged.length > 0) {
    const saved = await savePropsToDb(merged)
    console.log(`  Saved: ${saved} props to database`)
  }
  
  return merged
}

async function main() {
  const args = process.argv.slice(2)
  const sport = args[0]?.toUpperCase() || 'NFL'
  
  console.log('\n' + '='.repeat(60))
  console.log('SPORTSBOOK PROPS SCRAPER (FREE)')
  console.log('Sources: Action Network, DraftKings, FanDuel')
  console.log('='.repeat(60))
  
  if (args[0] === 'all') {
    // Collect for all sports
    for (const s of ['NFL', 'NBA', 'NHL', 'MLB']) {
      await collectAllProps(s)
      await new Promise(r => setTimeout(r, 1000)) // Delay between sports
    }
  } else {
    // Single sport
    const props = await collectAllProps(sport)
    
    // Show sample
    console.log('\nSample Props:')
    for (const prop of props.slice(0, 5)) {
      console.log(`  ${prop.playerName} - ${prop.propType}`)
      console.log(`    Lines from ${prop.lines.length} books`)
      if (prop.bestOver) {
        console.log(`    Best OVER: ${prop.bestOver.line} @ ${prop.bestOver.book} (${prop.bestOver.odds})`)
      }
      if (prop.bestUnder) {
        console.log(`    Best UNDER: ${prop.bestUnder.line} @ ${prop.bestUnder.book} (${prop.bestUnder.odds})`)
      }
    }
  }
  
  console.log('\nDone!')
}

main().catch(console.error)

export {
  fetchDraftKingsProps,
  fetchFanDuelProps,
  fetchActionNetworkProps,
  collectAllProps,
  mergeProps,
  type ScrapedProp,
  type PropLine
}
