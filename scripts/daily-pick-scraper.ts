#!/usr/bin/env npx ts-node

/**
 * Daily Expert Picks Scraper
 * 
 * Designed to run at 3am ET to:
 * 1. Fetch picks from all experts via X/Twitter
 * 2. Parse and extract structured pick data (sport, team, line, odds)
 * 3. Store picks in the database
 * 4. Grade any completed games from previous day
 * 5. Update leaderboard stats
 * 
 * Run manually: npx ts-node scripts/daily-pick-scraper.ts
 * Or via API: POST /api/scrapers/daily
 */

import { createClient } from '@supabase/supabase-js'
import { 
  BETTING_EXPERTS, 
  getExpertsWithXHandles, 
  BettingExpert,
  getHighPriorityExperts 
} from '../src/lib/data/betting-experts'

// ============================================
// CONFIGURATION
// ============================================

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// X API
const X_API_BASE = 'https://api.twitter.com/2'
const getXToken = () => (process.env.TWITTER_BEARER_TOKEN || '').replace(/%3D/g, '=')

// ESPN URLs
const ESPN_EXPERTS_URLS = {
  nfl: 'https://www.espn.com/nfl/picks',
  nba: 'https://www.espn.com/nba/picks',
  ncaaf: 'https://www.espn.com/college-football/picks',
  ncaab: 'https://www.espn.com/mens-college-basketball/picks',
}

// Rate limiting
const RATE_LIMIT_DELAY = 2000 // 2 seconds between X API calls
const MAX_RETRIES = 3

// ============================================
// DATABASE CLIENT
// ============================================

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

// ============================================
// TYPES
// ============================================

interface ScraperRun {
  id: string
  run_type: string
  source: string
  started_at: string
  status: string
  experts_scraped: number
  picks_found: number
  picks_new: number
  picks_duplicate: number
  games_graded: number
  error_count: number
  error_messages: string[]
}

interface ParsedPick {
  expert_id: string
  sport: string
  bet_type: string
  home_team: string
  away_team: string
  picked_team: string | null
  picked_side: string | null
  line_at_pick: number | null
  odds_at_pick: number | null
  total_pick: string | null
  total_number: number | null
  units: number
  confidence: string | null
  source: string
  source_url: string | null
  source_tweet_id: string | null
  raw_text: string
  game_date: string
  pick_date: string
}

interface XTweet {
  id: string
  text: string
  created_at: string
  author_id: string
}

// ============================================
// X/TWITTER API
// ============================================

async function xApiRequest<T>(endpoint: string, params?: Record<string, string>): Promise<T | null> {
  const token = getXToken()
  if (!token) {
    console.error('[X API] No bearer token')
    return null
  }

  const url = new URL(`${X_API_BASE}${endpoint}`)
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.append(k, v))
  }

  try {
    const res = await fetch(url.toString(), {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })

    if (res.status === 429) {
      const reset = res.headers.get('x-rate-limit-reset')
      console.warn(`[X API] Rate limited. Reset: ${reset}`)
      return null
    }

    if (!res.ok) {
      console.error(`[X API] Error ${res.status}`)
      return null
    }

    const data = await res.json()
    return data.data || null
  } catch (err) {
    console.error('[X API] Request failed:', err)
    return null
  }
}

async function getXUserByUsername(username: string): Promise<{ id: string; name: string } | null> {
  return xApiRequest(`/users/by/username/${username}`, {
    'user.fields': 'name'
  })
}

async function getUserRecentTweets(userId: string, maxResults = 20): Promise<XTweet[]> {
  const data = await xApiRequest<XTweet[]>(`/users/${userId}/tweets`, {
    'max_results': Math.min(maxResults, 100).toString(),
    'tweet.fields': 'created_at',
    'exclude': 'retweets,replies'
  })
  return Array.isArray(data) ? data : []
}

// ============================================
// PICK PARSING - Enhanced with line extraction
// ============================================

// Team name mapping to standardize
const TEAM_MAPPINGS: Record<string, { name: string; sport: string }> = {
  // NFL
  'chiefs': { name: 'Kansas City Chiefs', sport: 'NFL' },
  'kc': { name: 'Kansas City Chiefs', sport: 'NFL' },
  'eagles': { name: 'Philadelphia Eagles', sport: 'NFL' },
  'philly': { name: 'Philadelphia Eagles', sport: 'NFL' },
  '49ers': { name: 'San Francisco 49ers', sport: 'NFL' },
  'niners': { name: 'San Francisco 49ers', sport: 'NFL' },
  'sf': { name: 'San Francisco 49ers', sport: 'NFL' },
  'cowboys': { name: 'Dallas Cowboys', sport: 'NFL' },
  'dallas': { name: 'Dallas Cowboys', sport: 'NFL' },
  'packers': { name: 'Green Bay Packers', sport: 'NFL' },
  'gb': { name: 'Green Bay Packers', sport: 'NFL' },
  'bills': { name: 'Buffalo Bills', sport: 'NFL' },
  'buffalo': { name: 'Buffalo Bills', sport: 'NFL' },
  'dolphins': { name: 'Miami Dolphins', sport: 'NFL' },
  'miami': { name: 'Miami Dolphins', sport: 'NFL' },
  'ravens': { name: 'Baltimore Ravens', sport: 'NFL' },
  'baltimore': { name: 'Baltimore Ravens', sport: 'NFL' },
  'lions': { name: 'Detroit Lions', sport: 'NFL' },
  'detroit': { name: 'Detroit Lions', sport: 'NFL' },
  'bengals': { name: 'Cincinnati Bengals', sport: 'NFL' },
  'cincy': { name: 'Cincinnati Bengals', sport: 'NFL' },
  'jets': { name: 'New York Jets', sport: 'NFL' },
  'giants': { name: 'New York Giants', sport: 'NFL' },
  'saints': { name: 'New Orleans Saints', sport: 'NFL' },
  'falcons': { name: 'Atlanta Falcons', sport: 'NFL' },
  'atlanta': { name: 'Atlanta Falcons', sport: 'NFL' },
  'bucs': { name: 'Tampa Bay Buccaneers', sport: 'NFL' },
  'buccaneers': { name: 'Tampa Bay Buccaneers', sport: 'NFL' },
  'tampa': { name: 'Tampa Bay Buccaneers', sport: 'NFL' },
  'panthers': { name: 'Carolina Panthers', sport: 'NFL' },
  'carolina': { name: 'Carolina Panthers', sport: 'NFL' },
  'cardinals': { name: 'Arizona Cardinals', sport: 'NFL' },
  'arizona': { name: 'Arizona Cardinals', sport: 'NFL' },
  'rams': { name: 'Los Angeles Rams', sport: 'NFL' },
  'seahawks': { name: 'Seattle Seahawks', sport: 'NFL' },
  'seattle': { name: 'Seattle Seahawks', sport: 'NFL' },
  'vikings': { name: 'Minnesota Vikings', sport: 'NFL' },
  'minnesota': { name: 'Minnesota Vikings', sport: 'NFL' },
  'bears': { name: 'Chicago Bears', sport: 'NFL' },
  'chicago': { name: 'Chicago Bears', sport: 'NFL' },
  'chargers': { name: 'Los Angeles Chargers', sport: 'NFL' },
  'raiders': { name: 'Las Vegas Raiders', sport: 'NFL' },
  'vegas': { name: 'Las Vegas Raiders', sport: 'NFL' },
  'broncos': { name: 'Denver Broncos', sport: 'NFL' },
  'denver': { name: 'Denver Broncos', sport: 'NFL' },
  'titans': { name: 'Tennessee Titans', sport: 'NFL' },
  'tennessee': { name: 'Tennessee Titans', sport: 'NFL' },
  'jaguars': { name: 'Jacksonville Jaguars', sport: 'NFL' },
  'jags': { name: 'Jacksonville Jaguars', sport: 'NFL' },
  'texans': { name: 'Houston Texans', sport: 'NFL' },
  'houston': { name: 'Houston Texans', sport: 'NFL' },
  'colts': { name: 'Indianapolis Colts', sport: 'NFL' },
  'indy': { name: 'Indianapolis Colts', sport: 'NFL' },
  'commanders': { name: 'Washington Commanders', sport: 'NFL' },
  'washington': { name: 'Washington Commanders', sport: 'NFL' },
  'patriots': { name: 'New England Patriots', sport: 'NFL' },
  'pats': { name: 'New England Patriots', sport: 'NFL' },
  'browns': { name: 'Cleveland Browns', sport: 'NFL' },
  'cleveland': { name: 'Cleveland Browns', sport: 'NFL' },
  'steelers': { name: 'Pittsburgh Steelers', sport: 'NFL' },
  'pittsburgh': { name: 'Pittsburgh Steelers', sport: 'NFL' },
  
  // NBA
  'lakers': { name: 'Los Angeles Lakers', sport: 'NBA' },
  'celtics': { name: 'Boston Celtics', sport: 'NBA' },
  'boston': { name: 'Boston Celtics', sport: 'NBA' },
  'warriors': { name: 'Golden State Warriors', sport: 'NBA' },
  'gsw': { name: 'Golden State Warriors', sport: 'NBA' },
  'bucks': { name: 'Milwaukee Bucks', sport: 'NBA' },
  'milwaukee': { name: 'Milwaukee Bucks', sport: 'NBA' },
  'nuggets': { name: 'Denver Nuggets', sport: 'NBA' },
  'suns': { name: 'Phoenix Suns', sport: 'NBA' },
  'phoenix': { name: 'Phoenix Suns', sport: 'NBA' },
  'heat': { name: 'Miami Heat', sport: 'NBA' },
  'sixers': { name: 'Philadelphia 76ers', sport: 'NBA' },
  '76ers': { name: 'Philadelphia 76ers', sport: 'NBA' },
  'nets': { name: 'Brooklyn Nets', sport: 'NBA' },
  'brooklyn': { name: 'Brooklyn Nets', sport: 'NBA' },
  'knicks': { name: 'New York Knicks', sport: 'NBA' },
  'bulls': { name: 'Chicago Bulls', sport: 'NBA' },
  'mavs': { name: 'Dallas Mavericks', sport: 'NBA' },
  'mavericks': { name: 'Dallas Mavericks', sport: 'NBA' },
  'grizzlies': { name: 'Memphis Grizzlies', sport: 'NBA' },
  'memphis': { name: 'Memphis Grizzlies', sport: 'NBA' },
  'pelicans': { name: 'New Orleans Pelicans', sport: 'NBA' },
  'clippers': { name: 'Los Angeles Clippers', sport: 'NBA' },
  'hawks': { name: 'Atlanta Hawks', sport: 'NBA' },
  'cavaliers': { name: 'Cleveland Cavaliers', sport: 'NBA' },
  'cavs': { name: 'Cleveland Cavaliers', sport: 'NBA' },
  'spurs': { name: 'San Antonio Spurs', sport: 'NBA' },
  'jazz': { name: 'Utah Jazz', sport: 'NBA' },
  'utah': { name: 'Utah Jazz', sport: 'NBA' },
  'timberwolves': { name: 'Minnesota Timberwolves', sport: 'NBA' },
  'wolves': { name: 'Minnesota Timberwolves', sport: 'NBA' },
  'blazers': { name: 'Portland Trail Blazers', sport: 'NBA' },
  'portland': { name: 'Portland Trail Blazers', sport: 'NBA' },
  'kings': { name: 'Sacramento Kings', sport: 'NBA' },
  'sacramento': { name: 'Sacramento Kings', sport: 'NBA' },
  'hornets': { name: 'Charlotte Hornets', sport: 'NBA' },
  'charlotte': { name: 'Charlotte Hornets', sport: 'NBA' },
  'pistons': { name: 'Detroit Pistons', sport: 'NBA' },
  'magic': { name: 'Orlando Magic', sport: 'NBA' },
  'orlando': { name: 'Orlando Magic', sport: 'NBA' },
  'wizards': { name: 'Washington Wizards', sport: 'NBA' },
  'raptors': { name: 'Toronto Raptors', sport: 'NBA' },
  'toronto': { name: 'Toronto Raptors', sport: 'NBA' },
  'pacers': { name: 'Indiana Pacers', sport: 'NBA' },
  'indiana': { name: 'Indiana Pacers', sport: 'NBA' },
  'thunder': { name: 'Oklahoma City Thunder', sport: 'NBA' },
  'okc': { name: 'Oklahoma City Thunder', sport: 'NBA' },
  'rockets': { name: 'Houston Rockets', sport: 'NBA' },
}

// Extended regex patterns for picking up lines/spreads
const SPREAD_PATTERNS = [
  /([A-Za-z\s]+)\s*([+-]?\d+\.?5?)\s*(?:\(([+-]\d{3})\))?/,  // "Chiefs -3.5 (-110)"
  /([A-Za-z\s]+)\s+at\s+([+-]?\d+\.?5?)/,  // "Eagles at -7"
  /taking\s+([A-Za-z\s]+)\s*([+-]?\d+\.?5?)/i,  // "Taking Chiefs -3"
  /([A-Za-z\s]+)\s+(-?\d+\.5)\s+points?/i,  // "Cowboys 3.5 points"
]

const TOTAL_PATTERNS = [
  /(over|under)\s+(\d+\.?5?)\s*(?:\(([+-]\d{3})\))?/i,  // "Over 45.5 (-110)"
  /o\/u\s*(\d+\.?5?)/i,  // "o/u 223.5"
  /total[:\s]+(\d+\.?5?)\s+(over|under)/i,  // "Total: 45.5 over"
]

const MONEYLINE_PATTERNS = [
  /([A-Za-z\s]+)\s+ML\s*(?:\(([+-]\d{3})\))?/i,  // "Chiefs ML (+150)"
  /([A-Za-z\s]+)\s+moneyline\s*(?:\(([+-]\d{3})\))?/i,  // "Eagles moneyline (-200)"
  /([A-Za-z\s]+)\s+outright/i,  // "Eagles outright"
]

/**
 * Parse a tweet for betting pick information
 * Returns structured pick data with extracted line/odds
 */
function parseTweetForPick(
  text: string, 
  expertId: string, 
  tweetId: string,
  timestamp: string
): ParsedPick | null {
  const lowerText = text.toLowerCase()
  
  // Must have at least some betting indicators
  const bettingKeywords = ['pick', 'bet', 'lock', 'spread', 'over', 'under', 'moneyline', 'ml', 'taking', 'like', 'love', 'hammer']
  const hasKeyword = bettingKeywords.some(kw => lowerText.includes(kw))
  
  if (!hasKeyword) return null
  
  // Detect sport
  let sport = 'Other'
  if (/\bnfl\b|football|chiefs|eagles|cowboys|49ers|packers|bills|dolphins|ravens|lions|steelers/i.test(text)) {
    sport = 'NFL'
  } else if (/\bnba\b|basketball|lakers|celtics|warriors|bucks|nuggets|suns|heat|knicks/i.test(text)) {
    sport = 'NBA'
  } else if (/\bmlb\b|baseball|yankees|dodgers|mets|astros|braves|phillies|padres/i.test(text)) {
    sport = 'MLB'
  } else if (/\bnhl\b|hockey|rangers|bruins|leafs|oilers|avalanche|lightning/i.test(text)) {
    sport = 'NHL'
  } else if (/\bcfb\b|college football|ohio state|alabama|georgia|michigan|clemson|texas|oklahoma/i.test(text)) {
    sport = 'CFB'
  } else if (/\bcbb\b|college basketball|duke|kentucky|kansas|unc|gonzaga|villanova/i.test(text)) {
    sport = 'CBB'
  }
  
  // Try to detect bet type and extract line
  let betType = 'spread'
  let line: number | null = null
  let odds: number | null = null
  let pickedTeam: string | null = null
  let totalPick: string | null = null
  let totalNumber: number | null = null
  
  // Check for totals first
  for (const pattern of TOTAL_PATTERNS) {
    const match = text.match(pattern)
    if (match) {
      betType = 'total'
      if (match[1]?.toLowerCase() === 'over' || match[1]?.toLowerCase() === 'under') {
        totalPick = match[1].toLowerCase()
        totalNumber = parseFloat(match[2])
        if (match[3]) odds = parseInt(match[3])
      } else {
        totalNumber = parseFloat(match[1])
        totalPick = match[2]?.toLowerCase() || null
      }
      break
    }
  }
  
  // Check for moneyline
  if (!totalPick) {
    for (const pattern of MONEYLINE_PATTERNS) {
      const match = text.match(pattern)
      if (match) {
        betType = 'moneyline'
        const teamKey = match[1].trim().toLowerCase()
        const teamInfo = TEAM_MAPPINGS[teamKey]
        if (teamInfo) {
          pickedTeam = teamInfo.name
          sport = teamInfo.sport
        } else {
          pickedTeam = match[1].trim()
        }
        if (match[2]) odds = parseInt(match[2])
        break
      }
    }
  }
  
  // Check for spread
  if (!totalPick && betType !== 'moneyline') {
    for (const pattern of SPREAD_PATTERNS) {
      const match = text.match(pattern)
      if (match) {
        betType = 'spread'
        const teamKey = match[1].trim().toLowerCase()
        const teamInfo = TEAM_MAPPINGS[teamKey]
        if (teamInfo) {
          pickedTeam = teamInfo.name
          sport = teamInfo.sport
        } else {
          pickedTeam = match[1].trim()
        }
        line = parseFloat(match[2])
        if (match[3]) odds = parseInt(match[3])
        break
      }
    }
  }
  
  // If we still have no team, try to find one in the text
  if (!pickedTeam) {
    for (const [key, value] of Object.entries(TEAM_MAPPINGS)) {
      if (lowerText.includes(key)) {
        pickedTeam = value.name
        sport = value.sport
        break
      }
    }
  }
  
  // Extract units if mentioned
  let units = 1.0
  const unitMatch = text.match(/(\d+)\s*u(?:nit)?s?/i)
  if (unitMatch) {
    units = parseFloat(unitMatch[1])
  }
  
  // Detect confidence
  let confidence: string | null = null
  if (/lock|guaranteed|slam|hammer/i.test(text)) confidence = 'lock'
  else if (/love|best bet|potd|play of the day/i.test(text)) confidence = 'best_bet'
  else if (/like|lean/i.test(text)) confidence = 'lean'
  
  // Calculate game date (assume today or tomorrow based on context)
  const now = new Date()
  const gameDate = now.toISOString().split('T')[0]
  
  return {
    expert_id: expertId,
    sport,
    bet_type: betType,
    home_team: 'TBD',  // Would need game data to determine
    away_team: 'TBD',
    picked_team: pickedTeam,
    picked_side: pickedTeam ? 'tbd' : null,  // Need game context
    line_at_pick: line,
    odds_at_pick: odds || -110,  // Default juice
    total_pick: totalPick,
    total_number: totalNumber,
    units,
    confidence,
    source: 'x_twitter',
    source_url: `https://twitter.com/i/status/${tweetId}`,
    source_tweet_id: tweetId,
    raw_text: text,
    game_date: gameDate,
    pick_date: timestamp.split('T')[0]
  }
}

// ============================================
// ESPN SCRAPING
// ============================================

async function scrapeESPNPicks(sport: string): Promise<ParsedPick[]> {
  const url = ESPN_EXPERTS_URLS[sport as keyof typeof ESPN_EXPERTS_URLS]
  if (!url) return []
  
  try {
    const res = await fetch(url)
    const html = await res.text()
    
    // Extract __espnfitt__ data blob
    const match = html.match(/window\['__espnfitt__'\]\s*=\s*(\{[\s\S]*?\});/)
    if (!match) return []
    
    const data = JSON.parse(match[1])
    const picks: ParsedPick[] = []
    
    // Parse ESPN structure - varies by sport
    // This would need detailed ESPN-specific parsing
    // ...
    
    return picks
  } catch (err) {
    console.error(`[ESPN] Error scraping ${sport}:`, err)
    return []
  }
}

// ============================================
// DATABASE OPERATIONS
// ============================================

async function startScraperRun(runType: string, source: string): Promise<string> {
  const { data, error } = await supabase
    .from('scraper_runs')
    .insert({
      run_type: runType,
      source,
      status: 'running'
    })
    .select('id')
    .single()
  
  if (error) {
    console.error('[DB] Error starting scraper run:', error)
    return 'error'
  }
  
  return data?.id || 'error'
}

async function updateScraperRun(
  runId: string, 
  updates: Partial<ScraperRun>
): Promise<void> {
  await supabase
    .from('scraper_runs')
    .update({
      ...updates,
      completed_at: updates.status === 'completed' || updates.status === 'failed' 
        ? new Date().toISOString() 
        : undefined
    })
    .eq('id', runId)
}

async function savePick(pick: ParsedPick): Promise<{ new: boolean; error?: string }> {
  // Check for duplicate (same expert, same tweet)
  if (pick.source_tweet_id) {
    const { data: existing } = await supabase
      .from('expert_picks')
      .select('id')
      .eq('source_tweet_id', pick.source_tweet_id)
      .single()
    
    if (existing) {
      return { new: false }
    }
  }
  
  // Insert new pick
  const { error } = await supabase
    .from('expert_picks')
    .insert({
      expert_id: pick.expert_id,
      pick_date: pick.pick_date,
      sport: pick.sport,
      game_date: pick.game_date,
      home_team: pick.home_team,
      away_team: pick.away_team,
      picked_team: pick.picked_team,
      picked_side: pick.picked_side,
      bet_type: pick.bet_type,
      line_at_pick: pick.line_at_pick,
      odds_at_pick: pick.odds_at_pick,
      total_pick: pick.total_pick,
      total_number: pick.total_number,
      units: pick.units,
      confidence: pick.confidence,
      source: pick.source,
      source_url: pick.source_url,
      source_tweet_id: pick.source_tweet_id,
      raw_text: pick.raw_text,
      status: 'pending'
    })
  
  if (error) {
    console.error('[DB] Error saving pick:', error)
    return { new: false, error: error.message }
  }
  
  return { new: true }
}

async function seedExperts(): Promise<void> {
  console.log('[DB] Seeding experts table...')
  
  for (const expert of BETTING_EXPERTS) {
    const { error } = await supabase
      .from('experts')
      .upsert({
        expert_id: expert.id,
        name: expert.name,
        x_handle: expert.xHandle,
        network: expert.network,
        shows: expert.shows,
        sports: expert.sports,
        expert_type: expert.type,
        priority: expert.priority
      }, {
        onConflict: 'expert_id'
      })
    
    if (error) {
      console.error(`[DB] Error seeding expert ${expert.id}:`, error)
    }
  }
  
  console.log(`[DB] Seeded ${BETTING_EXPERTS.length} experts`)
}

// ============================================
// MAIN SCRAPER LOGIC
// ============================================

async function scrapeExpertFromX(
  expert: BettingExpert, 
  runId: string
): Promise<{ picks: ParsedPick[]; error?: string }> {
  if (!expert.xHandle) {
    return { picks: [] }
  }
  
  console.log(`[X] Scraping @${expert.xHandle} (${expert.name})...`)
  
  try {
    // Get user ID
    const user = await getXUserByUsername(expert.xHandle)
    if (!user) {
      return { picks: [], error: `Could not find user @${expert.xHandle}` }
    }
    
    // Respect rate limits
    await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY))
    
    // Get recent tweets
    const tweets = await getUserRecentTweets(user.id, 30)
    
    const picks: ParsedPick[] = []
    
    for (const tweet of tweets) {
      const pick = parseTweetForPick(tweet.text, expert.id, tweet.id, tweet.created_at)
      if (pick) {
        picks.push(pick)
      }
    }
    
    console.log(`[X] Found ${picks.length} picks from @${expert.xHandle}`)
    return { picks }
    
  } catch (err) {
    const error = err instanceof Error ? err.message : 'Unknown error'
    console.error(`[X] Error scraping @${expert.xHandle}:`, error)
    return { picks: [], error }
  }
}

export async function runDailyScraper(options: {
  source?: 'all' | 'x_twitter' | 'espn'
  runType?: 'scheduled_3am' | 'manual' | 'backfill'
  expertLimit?: number  // Limit number of experts (for testing)
} = {}): Promise<{
  success: boolean
  runId: string
  stats: {
    expertsScraped: number
    picksFound: number
    picksNew: number
    picksDuplicate: number
    errors: number
  }
}> {
  const { source = 'all', runType = 'scheduled_3am', expertLimit } = options
  
  console.log('\n========================================')
  console.log(`DAILY EXPERT PICKS SCRAPER`)
  console.log(`Run Type: ${runType}`)
  console.log(`Source: ${source}`)
  console.log(`Time: ${new Date().toISOString()}`)
  console.log('========================================\n')
  
  // Start tracking run
  const runId = await startScraperRun(runType, source)
  
  const stats = {
    expertsScraped: 0,
    picksFound: 0,
    picksNew: 0,
    picksDuplicate: 0,
    errors: 0
  }
  
  const errors: string[] = []
  
  try {
    // Seed experts if needed
    await seedExperts()
    
    // Get experts to scrape
    let experts = source === 'espn' 
      ? BETTING_EXPERTS.filter(e => e.network === 'espn')
      : getHighPriorityExperts()
    
    if (expertLimit) {
      experts = experts.slice(0, expertLimit)
    }
    
    console.log(`[Scraper] Processing ${experts.length} experts...\n`)
    
    // Scrape X/Twitter
    if (source === 'all' || source === 'x_twitter') {
      const xExperts = experts.filter(e => e.xHandle)
      
      for (const expert of xExperts) {
        const result = await scrapeExpertFromX(expert, runId)
        stats.expertsScraped++
        
        if (result.error) {
          errors.push(`${expert.id}: ${result.error}`)
          stats.errors++
        }
        
        for (const pick of result.picks) {
          stats.picksFound++
          const saveResult = await savePick(pick)
          if (saveResult.new) {
            stats.picksNew++
          } else {
            stats.picksDuplicate++
          }
        }
        
        // Update run periodically
        if (stats.expertsScraped % 10 === 0) {
          await updateScraperRun(runId, {
            experts_scraped: stats.expertsScraped,
            picks_found: stats.picksFound,
            picks_new: stats.picksNew,
            picks_duplicate: stats.picksDuplicate,
            error_count: stats.errors
          })
        }
      }
    }
    
    // Scrape ESPN
    if (source === 'all' || source === 'espn') {
      console.log('\n[ESPN] Scraping ESPN expert picks...')
      for (const sport of Object.keys(ESPN_EXPERTS_URLS)) {
        const picks = await scrapeESPNPicks(sport)
        for (const pick of picks) {
          stats.picksFound++
          const saveResult = await savePick(pick)
          if (saveResult.new) {
            stats.picksNew++
          } else {
            stats.picksDuplicate++
          }
        }
      }
    }
    
    // Final update
    await updateScraperRun(runId, {
      status: 'completed',
      experts_scraped: stats.expertsScraped,
      picks_found: stats.picksFound,
      picks_new: stats.picksNew,
      picks_duplicate: stats.picksDuplicate,
      error_count: stats.errors,
      error_messages: errors
    })
    
    console.log('\n========================================')
    console.log('SCRAPER COMPLETE')
    console.log('========================================')
    console.log(`Experts Scraped: ${stats.expertsScraped}`)
    console.log(`Picks Found: ${stats.picksFound}`)
    console.log(`New Picks: ${stats.picksNew}`)
    console.log(`Duplicates: ${stats.picksDuplicate}`)
    console.log(`Errors: ${stats.errors}`)
    console.log('========================================\n')
    
    return {
      success: true,
      runId,
      stats
    }
    
  } catch (err) {
    console.error('[Scraper] Fatal error:', err)
    
    await updateScraperRun(runId, {
      status: 'failed',
      error_count: stats.errors + 1,
      error_messages: [...errors, err instanceof Error ? err.message : 'Fatal error']
    })
    
    return {
      success: false,
      runId,
      stats
    }
  }
}

// ============================================
// CLI ENTRY POINT
// ============================================

async function main() {
  const args = process.argv.slice(2)
  const source = args.includes('--espn') ? 'espn' 
    : args.includes('--x') ? 'x_twitter' 
    : 'all'
  
  const limit = args.find(a => a.startsWith('--limit='))
  const expertLimit = limit ? parseInt(limit.split('=')[1]) : undefined
  
  const result = await runDailyScraper({
    source: source as 'all' | 'x_twitter' | 'espn',
    runType: 'manual',
    expertLimit
  })
  
  process.exit(result.success ? 0 : 1)
}

// Run if called directly
if (require.main === module) {
  main()
}
