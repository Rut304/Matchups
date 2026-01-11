/**
 * X/Twitter API Service
 * Uses X API v2 to fetch recent tweets about teams and players
 * 
 * Requires: X_BEARER_TOKEN in environment
 * 
 * Use cases:
 * - Show top 3-5 tweets about teams in game matchups
 * - Display player news/updates from verified accounts
 * - Social sentiment for Team Pages
 */

const X_BEARER_TOKEN = process.env.X_BEARER_TOKEN || ''

const X_API_BASE = 'https://api.twitter.com/2'

// ===========================================
// TYPES
// ===========================================

export interface XTweet {
  id: string
  text: string
  created_at: string
  author_id: string
  public_metrics?: {
    retweet_count: number
    reply_count: number
    like_count: number
    quote_count: number
    bookmark_count: number
    impression_count: number
  }
  entities?: {
    urls?: Array<{
      url: string
      expanded_url: string
      display_url: string
    }>
    mentions?: Array<{
      username: string
      id: string
    }>
    hashtags?: Array<{
      tag: string
    }>
  }
  attachments?: {
    media_keys?: string[]
  }
}

export interface XUser {
  id: string
  name: string
  username: string
  profile_image_url?: string
  verified?: boolean
  verified_type?: string
  description?: string
  public_metrics?: {
    followers_count: number
    following_count: number
    tweet_count: number
  }
}

export interface XMedia {
  media_key: string
  type: 'photo' | 'video' | 'animated_gif'
  url?: string
  preview_image_url?: string
  width?: number
  height?: number
}

export interface XSearchResponse {
  data?: XTweet[]
  includes?: {
    users?: XUser[]
    media?: XMedia[]
  }
  meta?: {
    newest_id: string
    oldest_id: string
    result_count: number
    next_token?: string
  }
}

export interface EnrichedTweet extends XTweet {
  author?: XUser
  media?: XMedia[]
  url: string
}

// ===========================================
// API FUNCTIONS
// ===========================================

async function xRequest<T>(
  endpoint: string,
  params: Record<string, string> = {}
): Promise<T | null> {
  if (!X_BEARER_TOKEN) {
    console.warn('X_BEARER_TOKEN not configured')
    return null
  }

  const url = new URL(`${X_API_BASE}/${endpoint}`)
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.append(key, value)
  })

  try {
    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${X_BEARER_TOKEN}`,
      },
      next: { revalidate: 300 }, // Cache for 5 minutes
    })

    if (!response.ok) {
      if (response.status === 429) {
        console.error('X API rate limit exceeded')
      }
      throw new Error(`X API error: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error(`X API ${endpoint} error:`, error)
    return null
  }
}

/**
 * Search for recent tweets
 * 
 * @param query - Search query (supports X operators)
 * @param maxResults - Number of tweets to return (10-100)
 */
export async function searchTweets(
  query: string,
  maxResults: number = 10
): Promise<EnrichedTweet[]> {
  const params: Record<string, string> = {
    query: query,
    max_results: String(Math.min(Math.max(maxResults, 10), 100)),
    'tweet.fields': 'created_at,public_metrics,entities,attachments',
    'user.fields': 'name,username,profile_image_url,verified,verified_type,description,public_metrics',
    'media.fields': 'url,preview_image_url,type,width,height',
    expansions: 'author_id,attachments.media_keys',
  }

  const response = await xRequest<XSearchResponse>('tweets/search/recent', params)

  if (!response?.data) {
    return []
  }

  // Map users and media by ID for easy lookup
  const usersMap = new Map(
    response.includes?.users?.map(u => [u.id, u]) || []
  )
  const mediaMap = new Map(
    response.includes?.media?.map(m => [m.media_key, m]) || []
  )

  // Enrich tweets with author and media info
  return response.data.map(tweet => ({
    ...tweet,
    author: usersMap.get(tweet.author_id),
    media: tweet.attachments?.media_keys?.map(key => mediaMap.get(key)).filter(Boolean) as XMedia[],
    url: `https://twitter.com/${usersMap.get(tweet.author_id)?.username || 'i'}/status/${tweet.id}`,
  }))
}

/**
 * Get tweets about a specific team
 * Searches for team name and common hashtags
 */
export async function getTeamTweets(
  teamName: string,
  teamAbbreviation: string,
  sport: string,
  maxResults: number = 5
): Promise<EnrichedTweet[]> {
  // Build search query with team name, hashtag, and filter for quality
  const hashtag = teamName.replace(/\s+/g, '')
  const query = `(${teamName} OR #${hashtag} OR ${teamAbbreviation}) lang:en -is:retweet -is:reply`

  const tweets = await searchTweets(query, maxResults * 2) // Get more to filter

  // Sort by engagement and return top results
  return tweets
    .sort((a, b) => {
      const engagementA = (a.public_metrics?.like_count || 0) + 
        (a.public_metrics?.retweet_count || 0) * 2
      const engagementB = (b.public_metrics?.like_count || 0) + 
        (b.public_metrics?.retweet_count || 0) * 2
      return engagementB - engagementA
    })
    .slice(0, maxResults)
}

/**
 * Get tweets about a specific player
 */
export async function getPlayerTweets(
  playerName: string,
  teamName?: string,
  maxResults: number = 5
): Promise<EnrichedTweet[]> {
  // Build search query for player
  let query = `"${playerName}" lang:en -is:retweet -is:reply`
  if (teamName) {
    query = `"${playerName}" (${teamName}) lang:en -is:retweet -is:reply`
  }

  const tweets = await searchTweets(query, maxResults * 2)

  return tweets
    .sort((a, b) => {
      const engagementA = (a.public_metrics?.like_count || 0) + 
        (a.public_metrics?.retweet_count || 0) * 2
      const engagementB = (b.public_metrics?.like_count || 0) + 
        (b.public_metrics?.retweet_count || 0) * 2
      return engagementB - engagementA
    })
    .slice(0, maxResults)
}

/**
 * Get tweets about a game matchup
 * Searches for both teams and the matchup
 */
export async function getGameTweets(
  homeTeam: { name: string; abbreviation: string },
  awayTeam: { name: string; abbreviation: string },
  maxResults: number = 5
): Promise<EnrichedTweet[]> {
  // Search for matchup mentions
  const query = `(${homeTeam.name} ${awayTeam.name}) OR (${homeTeam.abbreviation} ${awayTeam.abbreviation}) OR (${awayTeam.name} ${homeTeam.name}) lang:en -is:retweet -is:reply`

  const tweets = await searchTweets(query, maxResults * 2)

  return tweets
    .sort((a, b) => {
      const engagementA = (a.public_metrics?.like_count || 0) + 
        (a.public_metrics?.retweet_count || 0) * 2
      const engagementB = (b.public_metrics?.like_count || 0) + 
        (b.public_metrics?.retweet_count || 0) * 2
      return engagementB - engagementA
    })
    .slice(0, maxResults)
}

/**
 * Get tweets from verified sports accounts
 * Good for breaking news and official updates
 */
export async function getSportsNews(
  sport: 'NFL' | 'NBA' | 'NHL' | 'MLB',
  maxResults: number = 10
): Promise<EnrichedTweet[]> {
  // Search from known sports accounts
  const sportAccounts: Record<string, string[]> = {
    NFL: ['@NFL', '@AdamSchefter', '@RapSheet', '@JayGlazer', '@TomPelissero'],
    NBA: ['@NBA', '@wojespn', '@ShamsCharania', '@ChrisBHaynes'],
    NHL: ['@NHL', '@PierreVLeBrun', '@FriedgeHNIC', '@DarrenDreger'],
    MLB: ['@MLB', '@JeffPassan', '@Ken_Rosenthal', '@JonHeyman'],
  }

  const accounts = sportAccounts[sport] || sportAccounts.NFL
  const query = `(${accounts.join(' OR ')}) lang:en -is:retweet`

  return searchTweets(query, maxResults)
}

/**
 * Get injury-related tweets for a team or player
 */
export async function getInjuryUpdates(
  name: string, // team or player name
  maxResults: number = 5
): Promise<EnrichedTweet[]> {
  const query = `"${name}" (injury OR injured OR out OR questionable OR doubtful OR probable OR IR) lang:en -is:retweet`
  
  const tweets = await searchTweets(query, maxResults * 2)

  return tweets
    .filter(t => {
      // Filter for tweets that actually mention injury status
      const text = t.text.toLowerCase()
      return text.includes('injury') || 
        text.includes('injured') || 
        text.includes('out') ||
        text.includes('questionable') ||
        text.includes('doubtful')
    })
    .slice(0, maxResults)
}

// ===========================================
// UTILITY FUNCTIONS
// ===========================================

/**
 * Format relative time for display
 */
export function formatTweetTime(createdAt: string): string {
  const date = new Date(createdAt)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m`
  if (diffHours < 24) return `${diffHours}h`
  if (diffDays < 7) return `${diffDays}d`
  
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

/**
 * Clean tweet text for display
 * Removes t.co links and cleans up mentions
 */
export function cleanTweetText(text: string): string {
  return text
    .replace(/https:\/\/t\.co\/\w+/g, '') // Remove t.co links
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim()
}

/**
 * Get engagement score for sorting
 */
export function getEngagementScore(tweet: XTweet): number {
  const metrics = tweet.public_metrics
  if (!metrics) return 0
  
  return (
    metrics.like_count +
    metrics.retweet_count * 2 +
    metrics.reply_count * 0.5 +
    metrics.quote_count * 1.5
  )
}

export default {
  searchTweets,
  getTeamTweets,
  getPlayerTweets,
  getGameTweets,
  getSportsNews,
  getInjuryUpdates,
  formatTweetTime,
  cleanTweetText,
  getEngagementScore,
}
