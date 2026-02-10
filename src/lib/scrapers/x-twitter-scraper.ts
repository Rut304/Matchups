/**
 * X/Twitter Betting Picks Scraper
 * 
 * Uses X API v2 to fetch tweets from betting experts and extract picks.
 * Supports searching for betting-related content and tracking expert predictions.
 */

import { BETTING_EXPERTS, getExpertsWithXHandles, type BettingExpert } from '../data/betting-experts'

// X API configuration
const X_API_BASE = 'https://api.twitter.com/2'

interface XUser {
  id: string
  name: string
  username: string
  profile_image_url?: string
  description?: string
  public_metrics?: {
    followers_count: number
    following_count: number
    tweet_count: number
  }
}

interface XTweet {
  id: string
  text: string
  created_at: string
  author_id: string
  public_metrics?: {
    retweet_count: number
    reply_count: number
    like_count: number
    quote_count: number
  }
}

interface XResponse<T> {
  data?: T
  includes?: {
    users?: XUser[]
  }
  meta?: {
    result_count?: number
    next_token?: string
  }
  errors?: Array<{ message: string; code: number }>
}

// Get token from environment
function getXBearerToken(): string {
  // Handle URL-encoded tokens (common copy-paste issue)
  const token = process.env.TWITTER_BEARER_TOKEN || ''
  return token.replace(/%3D/g, '=')  // Fix URL encoding
}

/**
 * Make authenticated X API request
 */
async function xApiRequest<T>(
  endpoint: string,
  params?: Record<string, string>
): Promise<XResponse<T>> {
  const token = getXBearerToken()
  
  if (!token) {
    console.error('[X API] No bearer token configured')
    throw new Error('TWITTER_BEARER_TOKEN not configured')
  }
  
  const url = new URL(`${X_API_BASE}${endpoint}`)
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value)
    })
  }
  
  const response = await fetch(url.toString(), {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  })
  
  // Handle rate limiting
  if (response.status === 429) {
    const resetTime = response.headers.get('x-rate-limit-reset')
    const waitSeconds = resetTime ? Math.ceil(Number(resetTime) - Date.now() / 1000) : 60
    console.warn(`[X API] Rate limited. Reset in ${waitSeconds}s`)
    throw new Error(`X API rate limited. Wait ${waitSeconds} seconds.`)
  }
  
  if (!response.ok) {
    const error = await response.text()
    console.error(`[X API] Error response: ${error}`)
    throw new Error(`X API error ${response.status}: ${error}`)
  }
  
  return response.json()
}

/**
 * Get X user by username
 */
export async function getXUser(username: string): Promise<XUser | null> {
  // Let errors propagate so caller can handle them
  const result = await xApiRequest<XUser>(
    `/users/by/username/${username}`,
    {
      'user.fields': 'profile_image_url,description,public_metrics'
    }
  )
  return result.data || null
}

/**
 * Get multiple X users by usernames (batch)
 */
export async function getXUsers(usernames: string[]): Promise<XUser[]> {
  try {
    const result = await xApiRequest<XUser[]>(
      '/users/by',
      {
        'usernames': usernames.slice(0, 100).join(','), // API limit 100
        'user.fields': 'profile_image_url,description,public_metrics'
      }
    )
    return result.data || []
  } catch (error) {
    console.error('Error fetching users batch:', error)
    return []
  }
}

/**
 * Get recent tweets from a user
 */
export async function getUserTweets(
  userId: string,
  maxResults: number = 10
): Promise<XTweet[]> {
  try {
    const result = await xApiRequest<XTweet[]>(
      `/users/${userId}/tweets`,
      {
        'max_results': Math.min(maxResults, 100).toString(),
        'tweet.fields': 'created_at,public_metrics',
        'exclude': 'retweets,replies'  // Original tweets only
      }
    )
    return result.data || []
  } catch (error) {
    console.error(`Error fetching tweets for user ${userId}:`, error)
    return []
  }
}

/**
 * Search for betting-related tweets
 */
export async function searchBettingTweets(
  query: string,
  maxResults: number = 50
): Promise<{ tweets: XTweet[]; users: XUser[] }> {
  try {
    const result = await xApiRequest<XTweet[]>(
      '/tweets/search/recent',
      {
        'query': query,
        'max_results': Math.min(maxResults, 100).toString(),
        'tweet.fields': 'created_at,public_metrics,author_id',
        'expansions': 'author_id',
        'user.fields': 'profile_image_url,name,username'
      }
    )
    return {
      tweets: result.data || [],
      users: result.includes?.users || []
    }
  } catch (error) {
    console.error('Error searching tweets:', error)
    return { tweets: [], users: [] }
  }
}

// ============================================
// BETTING PICK DETECTION
// ============================================

// Keywords that indicate a betting pick
const BETTING_KEYWORDS = [
  // Bet types
  'pick', 'lock', 'bet', 'wager', 'play',
  'spread', 'over', 'under', 'o/u', 'total',
  'moneyline', 'ml', 'parlay', 'teaser',
  'prop', 'player prop', 'first td',
  // Actions
  'taking', 'like', 'love', 'hammer', 'max bet',
  'laying', 'riding', 'fade',
  // Odds
  '+', '-110', '-115', '-120', '+100', '+150',
  'odds', 'line', 'juice',
  // Units
  'unit', 'u', '1u', '2u', '3u', '5u',
  // Confidence
  'lock', 'guaranteed', 'confident', 'best bet',
  'potd', 'play of the day',
]

// Teams/leagues patterns
const TEAM_PATTERNS = [
  // NFL
  /chiefs|eagles|49ers|cowboys|packers|bills|dolphins|ravens|lions|bengals|jets|giants|saints|falcons|bucs|panthers|cardinals|rams|seahawks|vikings|bears|chargers|raiders|broncos|titans|jaguars|texans|colts|commanders|patriots|browns|steelers/i,
  // NBA
  /lakers|celtics|warriors|bucks|nuggets|suns|heat|sixers|nets|knicks|bulls|mavs|grizzlies|pelicans|clippers|hawks|cavaliers|spurs|jazz|timberwolves|blazers|kings|hornets|pistons|magic|wizards|raptors|pacers|thunder|rockets/i,
  // College
  /ohio state|alabama|georgia|michigan|clemson|texas|oklahoma|usc|lsu|oregon|florida|auburn|tennessee|penn state|notre dame|miami|florida state|wisconsin|iowa/i,
]

interface DetectedPick {
  text: string
  confidence: number  // 0-100
  sport: string | null
  team: string | null
  betType: string | null
  odds: string | null
}

/**
 * Analyze a tweet to detect if it contains a betting pick
 */
export function detectBettingPick(tweetText: string): DetectedPick | null {
  const text = tweetText.toLowerCase()
  
  // Count betting keywords found
  const keywordsFound = BETTING_KEYWORDS.filter(kw => text.includes(kw.toLowerCase()))
  
  if (keywordsFound.length < 2) {
    return null // Probably not a betting tweet
  }
  
  // Calculate confidence based on keywords
  let confidence = Math.min(keywordsFound.length * 15, 80)
  
  // Check for team mentions
  let team: string | null = null
  for (const pattern of TEAM_PATTERNS) {
    const match = text.match(pattern)
    if (match) {
      team = match[0]
      confidence += 15
      break
    }
  }
  
  // Detect bet type
  let betType: string | null = null
  if (text.includes('spread') || /[+-]\d+\.?5?/.test(text)) betType = 'spread'
  else if (text.includes('over') || text.includes('under') || text.includes('o/u')) betType = 'total'
  else if (text.includes('moneyline') || text.includes(' ml ')) betType = 'moneyline'
  else if (text.includes('parlay')) betType = 'parlay'
  else if (text.includes('prop')) betType = 'prop'
  
  if (betType) confidence += 10
  
  // Detect odds
  let odds: string | null = null
  const oddsMatch = text.match(/[+-]\d{3,4}|[+-]\d{1,2}\.5?/)
  if (oddsMatch) {
    odds = oddsMatch[0]
    confidence += 5
  }
  
  // Detect sport
  let sport: string | null = null
  if (/nfl|football|chiefs|eagles|cowboys|49ers|packers/i.test(text)) sport = 'NFL'
  else if (/nba|basketball|lakers|celtics|warriors|bucks/i.test(text)) sport = 'NBA'
  else if (/mlb|baseball|yankees|dodgers|mets|astros/i.test(text)) sport = 'MLB'
  else if (/nhl|hockey|rangers|bruins|leafs/i.test(text)) sport = 'NHL'
  else if (/college|ncaa|cfb|cbb/i.test(text)) sport = 'College'
  
  if (sport) confidence += 10
  
  // Cap confidence
  confidence = Math.min(confidence, 100)
  
  if (confidence < 40) return null
  
  return {
    text: tweetText,
    confidence,
    sport,
    team,
    betType,
    odds
  }
}

// ============================================
// EXPERT TWEET FETCHING
// ============================================

export interface ExpertTweetData {
  expert: BettingExpert
  xUser: XUser | null
  recentTweets: XTweet[]
  bettingPicks: DetectedPick[]
  lastUpdated: string
}

/**
 * Fetch tweets from a specific betting expert
 */
export async function fetchExpertTweets(
  expert: BettingExpert,
  maxTweets: number = 20
): Promise<ExpertTweetData> {
  if (!expert.xHandle) {
    return {
      expert,
      xUser: null,
      recentTweets: [],
      bettingPicks: [],
      lastUpdated: new Date().toISOString()
    }
  }
  
  // Get user info
  const xUser = await getXUser(expert.xHandle)
  
  if (!xUser) {
    return {
      expert,
      xUser: null,
      recentTweets: [],
      bettingPicks: [],
      lastUpdated: new Date().toISOString()
    }
  }
  
  // Get recent tweets
  const recentTweets = await getUserTweets(xUser.id, maxTweets)
  
  // Analyze for betting picks
  const bettingPicks: DetectedPick[] = []
  for (const tweet of recentTweets) {
    const pick = detectBettingPick(tweet.text)
    if (pick) {
      bettingPicks.push(pick)
    }
  }
  
  return {
    expert,
    xUser,
    recentTweets,
    bettingPicks,
    lastUpdated: new Date().toISOString()
  }
}

/**
 * Fetch tweets from all experts with X handles
 */
export async function fetchAllExpertTweets(
  options: {
    minPriority?: number
    sports?: string[]
    limit?: number
  } = {}
): Promise<ExpertTweetData[]> {
  let experts = getExpertsWithXHandles()
  
  // Filter by priority
  if (options.minPriority) {
    experts = experts.filter(e => e.priority >= options.minPriority!)
  }
  
  // Filter by sport
  if (options.sports && options.sports.length > 0) {
    experts = experts.filter(e => 
      e.sports.some(s => options.sports!.includes(s.toUpperCase()))
    )
  }
  
  // Limit
  if (options.limit) {
    experts = experts.slice(0, options.limit)
  }
  
  // Fetch tweets with rate limiting (to avoid hitting X API limits)
  const results: ExpertTweetData[] = []
  
  for (const expert of experts) {
    try {
      const data = await fetchExpertTweets(expert)
      results.push(data)
      
      // Rate limit: wait 100ms between requests
      await new Promise(resolve => setTimeout(resolve, 100))
    } catch (error) {
      console.error(`Error fetching tweets for ${expert.name}:`, error)
      results.push({
        expert,
        xUser: null,
        recentTweets: [],
        bettingPicks: [],
        lastUpdated: new Date().toISOString()
      })
    }
  }
  
  return results
}

/**
 * Search X for betting picks about a specific game or team
 */
export async function searchGamePicks(
  team1: string,
  team2: string,
  sport: string
): Promise<{ tweets: XTweet[]; picks: DetectedPick[] }> {
  // Build search query
  const query = `(${team1} OR ${team2}) (pick OR bet OR lock OR spread OR over OR under) -is:retweet lang:en`
  
  const { tweets } = await searchBettingTweets(query, 50)
  
  const picks: DetectedPick[] = []
  for (const tweet of tweets) {
    const pick = detectBettingPick(tweet.text)
    if (pick) {
      pick.sport = sport
      picks.push(pick)
    }
  }
  
  return { tweets, picks }
}

// ============================================
// SUMMARY & LEADERBOARD
// ============================================

export interface ExpertXSummary {
  expert: BettingExpert
  xHandle: string
  followers: number
  recentPickCount: number
  lastPickDate: string | null
  avgEngagement: number
}

/**
 * Get summary of all experts' X presence
 */
export async function getExpertsXSummary(): Promise<ExpertXSummary[]> {
  const experts = getExpertsWithXHandles()
  
  // Batch fetch users (up to 100 at a time)
  const handles = experts.map(e => e.xHandle!).filter(Boolean)
  const xUsers = await getXUsers(handles)
  
  // Map users back to experts
  const userMap = new Map(xUsers.map(u => [u.username.toLowerCase(), u]))
  
  const summaries: ExpertXSummary[] = []
  
  for (const expert of experts) {
    const xUser = userMap.get(expert.xHandle!.toLowerCase())
    
    summaries.push({
      expert,
      xHandle: expert.xHandle!,
      followers: xUser?.public_metrics?.followers_count || 0,
      recentPickCount: 0, // Would need to fetch tweets to populate
      lastPickDate: null,
      avgEngagement: 0
    })
  }
  
  // Sort by followers
  return summaries.sort((a, b) => b.followers - a.followers)
}

// Export test function
export async function testXConnection(): Promise<{ success: boolean; error?: string; user?: XUser; rateLimited?: boolean }> {
  try {
    const token = getXBearerToken()
    if (!token) {
      return { success: false, error: 'TWITTER_BEARER_TOKEN not set' }
    }
    if (token.length < 50) {
      return { success: false, error: 'TWITTER_BEARER_TOKEN appears too short' }
    }
    
    const user = await getXUser('BillSimmons')
    if (user) {
      return { success: true, user }
    } else {
      return { success: false, error: 'Failed to fetch test user @BillSimmons' }
    }
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err)
    // Check if it's a rate limit error
    if (error.includes('rate limit') || error.includes('429')) {
      return { 
        success: true, // Token is valid, just rate limited
        error: 'X API is rate limited - token is valid but wait before making more requests',
        rateLimited: true
      }
    }
    return { success: false, error }
  }
}
