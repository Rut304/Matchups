/**
 * Daily Expert Picks Scraper API
 * 
 * Triggers at 3am ET (8am UTC) to:
 * 1. Scrape picks from X/Twitter for all tracked experts
 * 2. Scrape ESPN expert picks
 * 3. Parse structured pick data with lines/odds
 * 4. Store in database for tracking
 * 
 * GET /api/cron/daily-expert-scraper
 * POST /api/cron/daily-expert-scraper (manual trigger with options)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { BETTING_EXPERTS, getExpertsWithXHandles, BettingExpert } from '@/lib/data/betting-experts'

export const runtime = 'nodejs'
export const maxDuration = 300  // 5 minutes

// ============================================
// TYPES
// ============================================

interface ScraperResult {
  success: boolean
  expertsProcessed: number
  picksFound: number
  picksNew: number
  errors: string[]
  duration: number
}

interface XTweet {
  id: string
  text: string
  created_at: string
  author_id: string
}

// ============================================
// DATABASE
// ============================================

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// ============================================
// X/TWITTER API
// ============================================

const X_API_BASE = 'https://api.twitter.com/2'

function getXToken(): string {
  const token = process.env.TWITTER_BEARER_TOKEN || process.env.X_BEARER_TOKEN || ''
  return token.replace(/%3D/g, '=')  // Fix URL encoding
}

async function xApiRequest<T>(endpoint: string, params?: Record<string, string>): Promise<T | null> {
  const token = getXToken()
  if (!token) return null
  
  const url = new URL(`${X_API_BASE}${endpoint}`)
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.append(k, v))
  }
  
  try {
    const res = await fetch(url.toString(), {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    
    if (res.status === 429) {
      console.warn('[X API] Rate limited')
      return null
    }
    
    if (!res.ok) return null
    
    const data = await res.json()
    return data.data || null
  } catch {
    return null
  }
}

async function getXUserByHandle(handle: string): Promise<{ id: string } | null> {
  return xApiRequest(`/users/by/username/${handle}`)
}

async function getUserTweets(userId: string, maxResults = 20): Promise<XTweet[]> {
  const data = await xApiRequest<XTweet[]>(`/users/${userId}/tweets`, {
    'max_results': Math.min(maxResults, 100).toString(),
    'tweet.fields': 'created_at',
    'exclude': 'retweets,replies'
  })
  return Array.isArray(data) ? data : []
}

// ============================================
// PICK DETECTION & PARSING
// ============================================

interface ParsedPick {
  expert_slug: string
  source: string
  source_id: string
  source_url: string
  sport: string
  pick_type: string
  pick_description: string
  pick_side: string | null
  line: number | null
  odds: number
  stake: number
  confidence: number | null
  raw_text: string
  picked_at: string
}

// Team mapping for sport detection
const TEAM_SPORT_MAP: Record<string, string> = {
  // NFL
  'chiefs': 'NFL', 'eagles': 'NFL', '49ers': 'NFL', 'cowboys': 'NFL', 'packers': 'NFL',
  'bills': 'NFL', 'dolphins': 'NFL', 'ravens': 'NFL', 'lions': 'NFL', 'bengals': 'NFL',
  'jets': 'NFL', 'giants': 'NFL', 'saints': 'NFL', 'falcons': 'NFL', 'bucs': 'NFL',
  'panthers': 'NFL', 'cardinals': 'NFL', 'rams': 'NFL', 'seahawks': 'NFL', 'vikings': 'NFL',
  'bears': 'NFL', 'chargers': 'NFL', 'raiders': 'NFL', 'broncos': 'NFL', 'titans': 'NFL',
  'jaguars': 'NFL', 'texans': 'NFL', 'colts': 'NFL', 'commanders': 'NFL', 'patriots': 'NFL',
  'browns': 'NFL', 'steelers': 'NFL',
  // NBA
  'lakers': 'NBA', 'celtics': 'NBA', 'warriors': 'NBA', 'bucks': 'NBA', 'nuggets': 'NBA',
  'suns': 'NBA', 'heat': 'NBA', 'sixers': 'NBA', 'nets': 'NBA', 'knicks': 'NBA',
  'bulls': 'NBA', 'mavs': 'NBA', 'grizzlies': 'NBA', 'pelicans': 'NBA', 'clippers': 'NBA',
  'hawks': 'NBA', 'cavaliers': 'NBA', 'cavs': 'NBA', 'spurs': 'NBA', 'jazz': 'NBA',
  'timberwolves': 'NBA', 'blazers': 'NBA', 'kings': 'NBA', 'hornets': 'NBA', 'pistons': 'NBA',
  'magic': 'NBA', 'wizards': 'NBA', 'raptors': 'NBA', 'pacers': 'NBA', 'thunder': 'NBA', 'rockets': 'NBA',
}

function parseTweetForPick(text: string, expert: BettingExpert, tweetId: string, timestamp: string): ParsedPick | null {
  const lowerText = text.toLowerCase()
  
  // Check for betting indicators
  const bettingKeywords = ['pick', 'bet', 'lock', 'spread', 'over', 'under', 'moneyline', 'ml', 'taking', 'like', 'love', 'hammer', 'play', 'parlay', 'teaser', '+', '-110']
  const hasKeyword = bettingKeywords.some(kw => lowerText.includes(kw))
  
  if (!hasKeyword) return null
  
  // Detect sport
  let sport = 'NFL'  // Default
  if (/\bnba\b|basketball/i.test(text)) sport = 'NBA'
  else if (/\bmlb\b|baseball/i.test(text)) sport = 'MLB'
  else if (/\bnhl\b|hockey/i.test(text)) sport = 'NHL'
  else if (/\bcfb\b|college football/i.test(text)) sport = 'CFB'
  else if (/\bcbb\b|college basketball/i.test(text)) sport = 'CBB'
  else {
    // Try team detection
    for (const [team, teamSport] of Object.entries(TEAM_SPORT_MAP)) {
      if (lowerText.includes(team)) {
        sport = teamSport
        break
      }
    }
  }
  
  // Detect bet type
  let pickType = 'spread'
  if (/over|under|o\/u|total/i.test(text)) pickType = 'total'
  else if (/moneyline|\bml\b|outright/i.test(text)) pickType = 'moneyline'
  else if (/parlay/i.test(text)) pickType = 'parlay'
  else if (/prop|first td|passing yards/i.test(text)) pickType = 'prop'
  
  // Extract line
  let line: number | null = null
  const spreadMatch = text.match(/([+-]?\d+\.?5?)\s*(?:\([+-]\d{3}\))?/)
  if (spreadMatch) {
    line = parseFloat(spreadMatch[1])
  }
  
  // Extract odds (default -110)
  let odds = -110
  const oddsMatch = text.match(/\(([+-]\d{3})\)/)
  if (oddsMatch) {
    odds = parseInt(oddsMatch[1])
  }
  
  // Extract units
  let stake = 1
  const unitMatch = text.match(/(\d+)\s*u(?:nit)?s?/i)
  if (unitMatch) {
    stake = parseFloat(unitMatch[1])
  }
  
  // Detect confidence
  let confidence: number | null = null
  if (/lock|guaranteed|slam|hammer|max/i.test(text)) confidence = 100
  else if (/love|best bet|potd/i.test(text)) confidence = 80
  else if (/like|lean/i.test(text)) confidence = 60
  
  // Extract picked side/team
  let pickSide: string | null = null
  for (const team of Object.keys(TEAM_SPORT_MAP)) {
    if (lowerText.includes(team)) {
      pickSide = team.charAt(0).toUpperCase() + team.slice(1)
      break
    }
  }
  
  return {
    expert_slug: expert.id,
    source: 'x_twitter',
    source_id: tweetId,
    source_url: `https://twitter.com/${expert.xHandle}/status/${tweetId}`,
    sport,
    pick_type: pickType,
    pick_description: text.slice(0, 500),
    pick_side: pickSide,
    line,
    odds,
    stake,
    confidence,
    raw_text: text,
    picked_at: timestamp
  }
}

// ============================================
// MAIN SCRAPER LOGIC
// ============================================

async function runDailyScrape(): Promise<ScraperResult> {
  const startTime = Date.now()
  const supabase = getSupabase()
  
  const result: ScraperResult = {
    success: false,
    expertsProcessed: 0,
    picksFound: 0,
    picksNew: 0,
    errors: [],
    duration: 0
  }
  
  const hasXToken = !!getXToken()
  
  // ALWAYS try free rettiwt-api FIRST (no API key needed)
  // Only fall back to Bearer token if rettiwt fails AND we have a token
  console.log('[Scraper] Using free rettiwt-api as primary scraper...')
  try {
    const { scrapeAllGamblingExperts, getAllExpertsForScraping } = await import('@/lib/scrapers/rettiwt-scraper')
    const totalExperts = getAllExpertsForScraping().length
    console.log(`[Scraper] Full expert list: ${totalExperts} experts with X handles`)
    
    const freeResult = await scrapeAllGamblingExperts({ 
      batchSize: 3, 
      delayMs: 3000,
      slot: 3, // deep scrape - all experts
      maxExperts: 30, // cap per run to avoid timeout
    })
    
    result.expertsProcessed = freeResult.expertResults.length
    result.picksFound = freeResult.totalPicks
    result.errors = freeResult.errors
    
    // PERSIST PICKS TO tracked_picks TABLE
    let picksStored = 0
    for (const expertResult of freeResult.expertResults) {
      if (expertResult.picks === 0) continue
      
      // Re-scrape this expert to get the actual pick data (expertResult only has count)
      try {
        const { scrapeExpertTweets } = await import('@/lib/scrapers/rettiwt-scraper')
        const detailResult = await scrapeExpertTweets(expertResult.handle, 15)
        
        for (const pick of detailResult.picks) {
          // Map to tracked_picks format
          const pickRow = {
            expert_slug: expertResult.handle.toLowerCase().replace(/[^a-z0-9]/g, '-'),
            pick_date: new Date().toISOString().split('T')[0],
            pick_timestamp: new Date().toISOString(),
            sport: pick.sport || 'NFL',
            game_id: null,
            game_date: new Date().toISOString().split('T')[0],
            home_team: pick.team || 'TBD',
            away_team: pick.opponent || 'TBD',
            picked_team: pick.team || null,
            picked_side: pick.side || (pick.team ? 'home' : null),
            bet_type: pick.pickType || 'spread',
            line_at_pick: pick.line || null,
            odds_at_pick: -110,
            total_pick: pick.pickType === 'total' ? pick.side : null,
            total_number: pick.pickType === 'total' ? pick.line : null,
            units: 1.0,
            confidence: pick.confidence || 'standard',
            is_public: true,
            source: 'x_twitter',
            raw_text: pick.rawText?.substring(0, 500),
            status: 'pending',
          }
          
          // Check for duplicate by raw_text + expert_slug (avoid re-inserting same tweet)
          const { data: existing } = await supabase
            .from('tracked_picks')
            .select('id')
            .eq('expert_slug', pickRow.expert_slug)
            .eq('raw_text', pickRow.raw_text)
            .limit(1)
          
          if (existing && existing.length > 0) continue
          
          // Also check if expert exists in tracked_experts
          const { data: expertExists } = await supabase
            .from('tracked_experts')
            .select('slug')
            .eq('slug', pickRow.expert_slug)
            .single()
          
          if (!expertExists) {
            // Expert not in tracked_experts, skip (or we could auto-add)
            console.log(`[Scraper] Expert ${pickRow.expert_slug} not in tracked_experts, skipping`)
            continue
          }
          
          const { error: insertErr } = await supabase
            .from('tracked_picks')
            .insert(pickRow)
          
          if (!insertErr) picksStored++
          else console.warn(`[Scraper] Insert error: ${insertErr.message}`)
        }
      } catch (detailErr) {
        console.warn(`[Scraper] Could not re-fetch picks for @${expertResult.handle}: ${detailErr}`)
      }
    }
    
    result.picksNew = picksStored
    result.duration = Date.now() - startTime
    result.success = picksStored > 0 || freeResult.errors.length === 0
    
    console.log(`[Scraper] Rettiwt: ${freeResult.totalTweets} tweets, ${freeResult.totalPicks} picks found, ${picksStored} stored in tracked_picks`)
    return result
  } catch (freeErr) {
    console.error('[Scraper] Rettiwt failed, trying Bearer token fallback:', freeErr)
    result.errors.push(`Rettiwt failed: ${freeErr instanceof Error ? freeErr.message : 'Unknown'}`)
  }
  
  // FALLBACK: Only use Bearer token if rettiwt fails
  if (!hasXToken) {
    console.warn('[Scraper] No Bearer token available and rettiwt failed')
    result.errors.push('No X Bearer Token and rettiwt scraper failed')
    result.duration = Date.now() - startTime
    return result
  }
  
  console.log('[Scraper] Falling back to Bearer token API...')
  
  // Get experts with X handles
  const experts = getExpertsWithXHandles().filter(e => e.priority <= 2)
  console.log(`[Scraper] Processing ${experts.length} high-priority experts...`)
  
  for (const expert of experts) {
    if (!expert.xHandle) continue
    
    try {
      // Rate limit: 2 second delay between experts
      await new Promise(r => setTimeout(r, 2000))
      
      // Get X user
      const xUser = await getXUserByHandle(expert.xHandle)
      if (!xUser) {
        console.log(`[Scraper] Could not find X user @${expert.xHandle}`)
        continue
      }
      
      result.expertsProcessed++
      
      // Get recent tweets
      const tweets = await getUserTweets(xUser.id, 30)
      
      for (const tweet of tweets) {
        const pick = parseTweetForPick(tweet.text, expert, tweet.id, tweet.created_at)
        
        if (!pick) continue
        
        result.picksFound++
        
        // Check for duplicate
        const { data: existing } = await supabase
          .from('tracked_picks')
          .select('id')
          .eq('source_tweet_id', tweet.id)
          .single()
        
        if (existing) continue
        
        // Check if expert exists in tracked_experts
        const { data: expertRecord } = await supabase
          .from('tracked_experts')
          .select('slug')
          .eq('slug', expert.id)
          .single()
        
        if (!expertRecord) continue
        
        // Insert pick into tracked_picks
        const { error: insertError } = await supabase
          .from('tracked_picks')
          .insert({
            expert_slug: expert.id,
            pick_date: new Date().toISOString().split('T')[0],
            pick_timestamp: pick.picked_at,
            sport: pick.sport,
            game_date: new Date().toISOString().split('T')[0],
            home_team: pick.pick_side || 'TBD',
            away_team: 'TBD',
            picked_team: pick.pick_side,
            picked_side: 'home',
            bet_type: pick.pick_type,
            line_at_pick: pick.line,
            odds_at_pick: pick.odds,
            units: pick.stake,
            confidence: pick.confidence ? 
              (pick.confidence >= 80 ? 'best_bet' : pick.confidence >= 60 ? 'lean' : 'standard') : 'standard',
            is_public: true,
            source: 'x_twitter',
            source_url: pick.source_url,
            source_tweet_id: pick.source_id,
            raw_text: pick.raw_text?.substring(0, 500),
            status: 'pending',
          })
        
        if (insertError) {
          result.errors.push(`Failed to insert pick from @${expert.xHandle}: ${insertError.message}`)
        } else {
          result.picksNew++
        }
      }
      
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error'
      result.errors.push(`Error processing @${expert.xHandle}: ${msg}`)
    }
  }
  
  result.duration = Date.now() - startTime
  result.success = result.errors.length === 0 || result.picksNew > 0
  
  return result
}

// ============================================
// API HANDLERS
// ============================================

export async function GET(request: NextRequest) {
  // Auth check for cron
  const authHeader = request.headers.get('authorization')
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  console.log('\n========================================')
  console.log('DAILY EXPERT PICKS SCRAPER')
  console.log(`Time: ${new Date().toISOString()}`)
  console.log('========================================\n')
  
  const result = await runDailyScrape()
  
  console.log('\n========================================')
  console.log('SCRAPER COMPLETE')
  console.log(`Experts: ${result.expertsProcessed}`)
  console.log(`Picks Found: ${result.picksFound}`)
  console.log(`New Picks: ${result.picksNew}`)
  console.log(`Errors: ${result.errors.length}`)
  console.log('========================================\n')
  
  return NextResponse.json({
    success: result.success,
    stats: {
      expertsProcessed: result.expertsProcessed,
      picksFound: result.picksFound,
      picksNew: result.picksNew,
      errors: result.errors.length
    },
    duration: `${result.duration}ms`,
    timestamp: new Date().toISOString(),
    ...(result.errors.length > 0 && { errorSample: result.errors.slice(0, 5) })
  })
}

export async function POST(request: NextRequest) {
  // Manual trigger with options
  const body = await request.json().catch(() => ({}))
  
  const result = await runDailyScrape()
  
  return NextResponse.json({
    success: result.success,
    stats: {
      expertsProcessed: result.expertsProcessed,
      picksFound: result.picksFound,
      picksNew: result.picksNew,
      errors: result.errors.length
    },
    duration: `${result.duration}ms`,
    timestamp: new Date().toISOString(),
    errors: result.errors
  })
}
