/**
 * Free X/Twitter Scraper using rettiwt-api
 * 
 * NO BEARER TOKEN NEEDED for guest mode (read-only public tweets)
 * 
 * Features:
 * - Guest auth: Read public tweets without any API key
 * - User auth: If RETTIWT_API_KEY is set, gets enhanced access
 * - Parses betting picks from tweet text
 * - Stores picks in Supabase
 * - Uses FULL expert list from betting-experts.ts (60+ experts with X handles)
 * - Designed to be spread across multiple cron runs throughout the day
 * 
 * To generate an API key for user auth (optional, increases rate limits):
 *   npx rettiwt-api auth login <email> <username> <password>
 *   This outputs an API_KEY to set as RETTIWT_API_KEY env var
 */

import { Rettiwt } from 'rettiwt-api'
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { getExpertsWithXHandles, getHighPriorityExperts, type BettingExpert } from '@/lib/data/betting-experts'

// Team abbreviations for all major sports (for pick parsing)
const ALL_TEAM_ABBREVS = new Set([
  // NFL
  'ARI','ATL','BAL','BUF','CAR','CHI','CIN','CLE','DAL','DEN','DET','GB','HOU',
  'IND','JAX','KC','LAC','LAR','LV','MIA','MIN','NE','NO','NYG','NYJ','PHI',
  'PIT','SEA','SF','TB','TEN','WAS','WSH',
  // NBA
  'BOS','BKN','CHA','GSW','LAL','MEM','MIL','OKC','ORL','PHX','POR','SAC','SAS','TOR','UTA',
  // NHL
  'ANA','BOS','CGY','CBJ','COL','EDM','FLA','MTL','NSH','NJD','NYI','NYR','OTT',
  'STL','SJS','VAN','VGK','WPG',
  // MLB
  'AZ','CWS','SD','STL','TEX','COL',
])

// Additional gambling-focused accounts not in the main expert list
const EXTRA_GAMBLING_ACCOUNTS = [
  { handle: 'SBRSportsPicks', name: 'SBR Picks', sport: 'multi' },
  { handle: 'ActionNetworkHQ', name: 'Action Network', sport: 'multi' },
  { handle: 'PFF_Betting', name: 'PFF Betting', sport: 'NFL' },
  { handle: 'GoldenNuggetLV', name: 'Golden Nugget LV', sport: 'multi' },
  { handle: 'VegasInsider', name: 'Vegas Insider', sport: 'multi' },
  { handle: 'BetCBS', name: 'CBS Bet', sport: 'multi' },
  { handle: 'draftkings', name: 'DraftKings', sport: 'multi' },
  { handle: 'FDSportsbook', name: 'FanDuel', sport: 'multi' },
  { handle: 'CoversSports', name: 'Covers', sport: 'multi' },
  { handle: 'WilliamHill', name: 'William Hill', sport: 'multi' },
]

/**
 * Build the FULL expert list by merging:
 * 1. All experts from betting-experts.ts with X handles
 * 2. Extra gambling-focused accounts
 * Returns deduplicated by handle (case-insensitive)
 */
export function getAllExpertsForScraping(): Array<{ handle: string; name: string; sport: string; priority: number }> {
  const seen = new Set<string>()
  const result: Array<{ handle: string; name: string; sport: string; priority: number }> = []
  
  // Primary source: full expert database
  const allExperts = getExpertsWithXHandles()
  for (const expert of allExperts) {
    const key = expert.xHandle!.toLowerCase()
    if (!seen.has(key)) {
      seen.add(key)
      result.push({
        handle: expert.xHandle!,
        name: expert.name,
        sport: expert.sports.join(','),
        priority: expert.priority,
      })
    }
  }
  
  // Secondary: extra gambling accounts
  for (const acct of EXTRA_GAMBLING_ACCOUNTS) {
    const key = acct.handle.toLowerCase()
    if (!seen.has(key)) {
      seen.add(key)
      result.push({ ...acct, priority: 3 })
    }
  }
  
  return result
}

/**
 * Get a batch of experts for a specific time slot.
 * Spreads all experts across 4 daily scrape windows so we don't hit
 * rate limits trying to scrape everyone at once.
 * 
 * slot 0 = morning  (priority 5 experts)
 * slot 1 = pregame-nfl / pregame-weekday (priority 4+ experts)
 * slot 2 = postgame (priority 3+ experts) 
 * slot 3 = daily-deep (remaining experts)
 */
export function getExpertBatchForSlot(slot: number): Array<{ handle: string; name: string; sport: string; priority: number }> {
  const all = getAllExpertsForScraping()
  
  switch (slot) {
    case 0: // morning - highest priority only
      return all.filter(e => e.priority >= 5)
    case 1: // pregame - high priority
      return all.filter(e => e.priority >= 4)
    case 2: // postgame - medium+
      return all.filter(e => e.priority >= 3)
    case 3: // deep scrape - everyone
    default:
      return all
  }
}

// Legacy export for backward compatibility
export const GAMBLING_EXPERTS = getAllExpertsForScraping().map(e => ({
  handle: e.handle,
  name: e.name,
  sport: e.sport,
}))

// Betting keywords to identify picks vs random tweets
const PICK_KEYWORDS = [
  'pick', 'lock', 'potd', 'play', 'lean', 'bet', 'under', 'over',
  'spread', 'ml', 'moneyline', 'parlay', '+', '-', 'ats', 'pk',
  'units', 'unit', 'fade', 'hammer', 'love', 'best bet', 'free pick',
  'nfl', 'nba', 'nhl', 'mlb', 'ncaaf', 'ncaab', 'cfb', 'cbb',
]

interface ParsedTweetPick {
  team?: string
  opponent?: string
  sport?: string
  pickType?: 'spread' | 'moneyline' | 'total' | 'prop'
  line?: number
  side?: 'over' | 'under' | 'home' | 'away'
  confidence?: 'lock' | 'strong' | 'lean' | 'standard'
  rawText: string
}

/**
 * Parse a tweet to check if it contains a betting pick
 */
function parseTweetForPick(text: string): ParsedTweetPick | null {
  const lower = text.toLowerCase()
  
  // Must contain at least one betting keyword
  const hasBettingContent = PICK_KEYWORDS.some(kw => lower.includes(kw))
  if (!hasBettingContent) return null
  
  // Filter out retweet-style text and ads
  if (lower.startsWith('rt @')) return null
  if (lower.includes('sign up') || lower.includes('promo code') || lower.includes('deposit')) return null
  
  const pick: ParsedTweetPick = { rawText: text }
  
  // Find team abbreviations
  const words = text.split(/[\s,.\-()]+/)
  const foundTeams: string[] = []
  for (const word of words) {
    const upper = word.toUpperCase().replace(/[^A-Z]/g, '')
    if (ALL_TEAM_ABBREVS.has(upper) && upper.length >= 2) {
      foundTeams.push(upper)
    }
  }
  if (foundTeams.length > 0) pick.team = foundTeams[0]
  if (foundTeams.length > 1) pick.opponent = foundTeams[1]
  
  // Detect sport
  if (lower.includes('nfl') || lower.includes('football')) pick.sport = 'NFL'
  else if (lower.includes('nba') || lower.includes('basketball')) pick.sport = 'NBA'
  else if (lower.includes('nhl') || lower.includes('hockey')) pick.sport = 'NHL'
  else if (lower.includes('mlb') || lower.includes('baseball')) pick.sport = 'MLB'
  else if (lower.includes('ncaaf') || lower.includes('cfb')) pick.sport = 'NCAAF'
  else if (lower.includes('ncaab') || lower.includes('cbb')) pick.sport = 'NCAAB'
  
  // Detect pick type
  if (lower.includes('over') || lower.includes('under') || lower.includes('o/u')) {
    pick.pickType = 'total'
    pick.side = lower.includes('over') ? 'over' : 'under'
  } else if (lower.includes('moneyline') || lower.includes(' ml') || lower.includes(' ml.')) {
    pick.pickType = 'moneyline'
  } else if (/[+-]\d+\.?\d*/.test(text)) {
    pick.pickType = 'spread'
  }
  
  // Extract line number
  const lineMatch = text.match(/([+-]\d+\.?\d*)/)
  if (lineMatch) pick.line = parseFloat(lineMatch[1])
  
  // Detect confidence
  if (lower.includes('lock') || lower.includes('max bet') || lower.includes('💰💰💰')) {
    pick.confidence = 'lock'
  } else if (lower.includes('love') || lower.includes('hammer') || lower.includes('strong')) {
    pick.confidence = 'strong'
  } else if (lower.includes('lean') || lower.includes('slight')) {
    pick.confidence = 'lean'
  } else {
    pick.confidence = 'standard'
  }
  
  return pick
}

/**
 * Create a Rettiwt client
 * - With RETTIWT_API_KEY: enhanced access (more requests, search)
 * - Without: guest mode (public timeline reads only)
 */
function createRettiwtClient(): Rettiwt {
  const apiKey = process.env.RETTIWT_API_KEY
  if (apiKey) {
    return new Rettiwt({ apiKey })
  }
  // Guest mode - no auth needed, limited to public reads
  return new Rettiwt()
}

/**
 * Scrape tweets from a specific expert and extract picks
 */
export async function scrapeExpertTweets(
  handle: string,
  maxTweets: number = 20
): Promise<{ tweets: number; picks: ParsedTweetPick[]; errors: string[] }> {
  const errors: string[] = []
  const picks: ParsedTweetPick[] = []
  
  try {
    const client = createRettiwtClient()
    
    // Get user details
    const user = await client.user.details(handle)
    if (!user) {
      errors.push(`User @${handle} not found`)
      return { tweets: 0, picks, errors }
    }
    
    // Get recent tweets
    const timeline = await client.user.timeline(user.id, maxTweets)
    const tweets = timeline?.list || []
    
    for (const tweet of tweets) {
      const text = tweet.fullText || ''
      const parsed = parseTweetForPick(text)
      if (parsed) {
        picks.push(parsed)
      }
    }
    
    return { tweets: tweets.length, picks, errors }
  } catch (err) {
    errors.push(`Error scraping @${handle}: ${err instanceof Error ? err.message : 'Unknown error'}`)
    return { tweets: 0, picks, errors }
  }
}

/**
 * Scrape all tracked gambling experts (or a specific batch/slot)
 */
export async function scrapeAllGamblingExperts(options?: {
  batchSize?: number
  delayMs?: number
  slot?: number  // 0-3, which time-slot batch to use (undefined = all)
  maxExperts?: number  // cap how many to process in one run
}): Promise<{
  totalTweets: number
  totalPicks: number
  expertResults: Array<{ handle: string; name: string; tweets: number; picks: number; errors: string[] }>
  errors: string[]
  totalExpertsAvailable: number
}> {
  const batchSize = options?.batchSize || 5
  const delayMs = options?.delayMs || 3000 // Be respectful of rate limits
  const maxExperts = options?.maxExperts || 100
  
  // Use slot-based batching if specified, otherwise use all experts
  const allExperts = options?.slot !== undefined
    ? getExpertBatchForSlot(options.slot)
    : getAllExpertsForScraping()
  
  // Cap the number of experts per run to avoid timeouts
  const experts = allExperts.slice(0, maxExperts)
  
  const results = {
    totalTweets: 0,
    totalPicks: 0,
    expertResults: [] as Array<{ handle: string; name: string; tweets: number; picks: number; errors: string[] }>,
    errors: [] as string[],
    totalExpertsAvailable: allExperts.length,
  }
  
  console.log(`[Rettiwt] Scraping ${experts.length} of ${allExperts.length} experts (slot: ${options?.slot ?? 'all'})`)
  
  // Process in batches
  for (let i = 0; i < experts.length; i += batchSize) {
    const batch = experts.slice(i, i + batchSize)
    
    for (const expert of batch) {
      try {
        const result = await scrapeExpertTweets(expert.handle, 15)
        results.totalTweets += result.tweets
        results.totalPicks += result.picks.length
        results.expertResults.push({
          handle: expert.handle,
          name: expert.name,
          tweets: result.tweets,
          picks: result.picks.length,
          errors: result.errors,
        })
        
        if (result.errors.length > 0) {
          results.errors.push(...result.errors)
        }
      } catch (err) {
        results.errors.push(`Failed to scrape @${expert.handle}: ${err instanceof Error ? err.message : 'Unknown'}`)
      }
      
      // Delay between requests
      await new Promise(resolve => setTimeout(resolve, delayMs))
    }
    
    // Longer delay between batches
    if (i + batchSize < experts.length) {
      await new Promise(resolve => setTimeout(resolve, delayMs * 2))
    }
  }
  
  console.log(`[Rettiwt] Done: ${results.totalTweets} tweets, ${results.totalPicks} picks from ${results.expertResults.length} experts`)
  
  return results
}

/**
 * Store scraped picks in Supabase
 */
export async function storePicks(
  picks: ParsedTweetPick[],
  expertHandle: string,
  expertName: string,
  supabase: SupabaseClient
): Promise<number> {
  let stored = 0
  
  for (const pick of picks) {
    try {
      const { error } = await supabase
        .from('expert_picks')
        .upsert({
          expert_name: expertName,
          source: 'x_twitter_free',
          source_url: `https://x.com/${expertHandle}`,
          sport: pick.sport || 'UNKNOWN',
          pick_type: pick.pickType || 'spread',
          pick_team: pick.team || '',
          pick_details: pick.rawText.substring(0, 500),
          confidence_label: pick.confidence || 'standard',
          line: pick.line,
          created_at: new Date().toISOString(),
        }, { 
          onConflict: 'expert_name,pick_details',
          ignoreDuplicates: true 
        })
      
      if (!error) stored++
    } catch {
      // Skip duplicates and errors
    }
  }
  
  return stored
}
