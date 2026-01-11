/**
 * Aggregated Sports News Service
 * 
 * Combines news from multiple sources:
 * - ESPN News API (articles, headlines)
 * - API-Sports (injuries, transactions)
 * - Twitter/X (social updates, breaking news)
 * 
 * For the Latest Sports News Page and Team News components
 */

import * as espn from './espn'
import * as twitter from './twitter'
import { EnrichedTweet } from './twitter'

// ===========================================
// TYPES
// ===========================================

export type NewsSource = 'espn' | 'twitter' | 'api-sports' | 'injury'

export interface NewsItem {
  id: string
  source: NewsSource
  type: 'article' | 'tweet' | 'injury' | 'transaction'
  sport: string
  title: string
  description?: string
  content?: string
  imageUrl?: string
  url: string
  author?: {
    name: string
    handle?: string
    avatarUrl?: string
    verified?: boolean
  }
  publishedAt: string
  engagement?: {
    likes: number
    shares: number
    comments: number
  }
  teams?: string[]
  players?: string[]
  tags?: string[]
}

export interface InjuryUpdate {
  id: string
  sport: string
  team: string
  teamId: string
  player: string
  playerId: string
  position: string
  status: 'out' | 'doubtful' | 'questionable' | 'probable' | 'day-to-day' | 'ir'
  injury: string
  description?: string
  updatedAt: string
}

export interface NewsFeed {
  items: NewsItem[]
  lastUpdated: string
  nextPage?: string
}

// ===========================================
// ESPN NEWS
// ===========================================

/**
 * Fetch ESPN news articles for a sport
 */
async function getESPNNews(sport: string, limit: number = 10): Promise<NewsItem[]> {
  try {
    const articles = await espn.getNews(sport as 'NFL' | 'NBA' | 'NHL' | 'MLB')
    
    return articles.slice(0, limit).map((article, idx) => ({
      id: `espn-${sport}-${idx}-${Date.now()}`,
      source: 'espn' as NewsSource,
      type: 'article' as const,
      sport,
      title: article.headline,
      description: article.description,
      imageUrl: undefined, // ESPN basic news doesn't include images
      url: article.link || `https://espn.com/${sport.toLowerCase()}`,
      author: undefined,
      publishedAt: article.published || new Date().toISOString(),
      tags: [],
    }))
  } catch (error) {
    console.error(`ESPN news error for ${sport}:`, error)
    return []
  }
}

/**
 * Fetch ESPN team-specific news
 */
async function getESPNTeamNews(
  sport: string,
  teamId: string
): Promise<NewsItem[]> {
  try {
    const articles = await espn.getTeamNews(sport as 'NFL' | 'NBA' | 'NHL' | 'MLB', teamId)
    
    return articles.map((article, idx) => ({
      id: `espn-team-${teamId}-${idx}-${Date.now()}`,
      source: 'espn' as NewsSource,
      type: 'article' as const,
      sport,
      title: article.headline,
      description: article.description,
      imageUrl: article.images?.[0]?.url,
      url: article.links?.web?.href || '#',
      author: undefined,
      publishedAt: article.published || new Date().toISOString(),
      teams: [teamId],
    }))
  } catch (error) {
    console.error(`ESPN team news error:`, error)
    return []
  }
}

// ===========================================
// TWITTER NEWS
// ===========================================

/**
 * Transform Twitter data to NewsItem format
 */
function transformTweet(tweet: EnrichedTweet, sport: string): NewsItem {
  return {
    id: `twitter-${tweet.id}`,
    source: 'twitter',
    type: 'tweet',
    sport,
    title: twitter.cleanTweetText(tweet.text).slice(0, 100),
    description: twitter.cleanTweetText(tweet.text),
    imageUrl: tweet.media?.[0]?.url || tweet.media?.[0]?.preview_image_url,
    url: tweet.url,
    author: tweet.author ? {
      name: tweet.author.name,
      handle: `@${tweet.author.username}`,
      avatarUrl: tweet.author.profile_image_url,
      verified: tweet.author.verified,
    } : undefined,
    publishedAt: tweet.created_at,
    engagement: tweet.public_metrics ? {
      likes: tweet.public_metrics.like_count,
      shares: tweet.public_metrics.retweet_count,
      comments: tweet.public_metrics.reply_count,
    } : undefined,
  }
}

/**
 * Get Twitter news for a sport
 */
async function getTwitterNews(
  sport: 'NFL' | 'NBA' | 'NHL' | 'MLB',
  limit: number = 10
): Promise<NewsItem[]> {
  const tweets = await twitter.getSportsNews(sport, limit)
  return tweets.map(tweet => transformTweet(tweet, sport))
}

/**
 * Get Twitter updates for a team
 */
async function getTwitterTeamNews(
  teamName: string,
  teamAbbreviation: string,
  sport: string,
  limit: number = 5
): Promise<NewsItem[]> {
  const tweets = await twitter.getTeamTweets(teamName, teamAbbreviation, sport, limit)
  return tweets.map(tweet => transformTweet(tweet, sport))
}

/**
 * Get Twitter updates for a game matchup
 */
async function getTwitterGameNews(
  homeTeam: { name: string; abbreviation: string },
  awayTeam: { name: string; abbreviation: string },
  sport: string,
  limit: number = 5
): Promise<NewsItem[]> {
  const tweets = await twitter.getGameTweets(homeTeam, awayTeam, limit)
  return tweets.map(tweet => ({
    ...transformTweet(tweet, sport),
    teams: [homeTeam.name, awayTeam.name],
  }))
}

// ===========================================
// INJURY UPDATES
// ===========================================

/**
 * Transform a flat ESPNInjury array to InjuryUpdates
 */
function transformFlatInjuries(
  injuries: espn.ESPNInjury[],
  sport: string,
  teamName: string = 'Unknown',
  teamId: string = ''
): InjuryUpdate[] {
  return injuries.map(injury => ({
    id: `injury-${injury.athlete.id}-${Date.now()}`,
    sport,
    team: teamName,
    teamId: teamId,
    player: injury.athlete.displayName,
    playerId: injury.athlete.id,
    position: injury.athlete.position?.abbreviation || '',
    status: mapInjuryStatus(injury.status),
    injury: typeof injury.type === 'object' ? injury.type.description : (injury.type || 'Unknown'),
    description: injury.details?.detail,
    updatedAt: injury.date || new Date().toISOString(),
  }))
}

/**
 * Transform ESPNTeamInjuries array (with team info) to InjuryUpdates
 */
function transformESPNInjuries(data: espn.ESPNTeamInjuries[], sport: string): InjuryUpdate[] {
  const updates: InjuryUpdate[] = []
  
  for (const teamData of data) {
    for (const injury of teamData.injuries || []) {
      updates.push({
        id: `injury-${injury.athlete.id}-${Date.now()}`,
        sport,
        team: teamData.team.displayName,
        teamId: teamData.team.id,
        player: injury.athlete.displayName,
        playerId: injury.athlete.id,
        position: injury.athlete.position?.abbreviation || '',
        status: mapInjuryStatus(injury.status),
        injury: typeof injury.type === 'object' ? injury.type.description : (injury.type || 'Unknown'),
        description: injury.details?.detail,
        updatedAt: injury.date || new Date().toISOString(),
      })
    }
  }
  
  return updates
}

/**
 * Get injury updates for a sport from ESPN
 */
async function getInjuries(
  sport: string,
  teamId?: string,
  teamName?: string
): Promise<InjuryUpdate[]> {
  try {
    if (teamId) {
      const injuries = await espn.getTeamInjuries(sport as 'NFL' | 'NBA' | 'NHL' | 'MLB', teamId)
      return transformFlatInjuries(injuries, sport, teamName || 'Unknown', teamId)
    }
    
    // For sport-wide injuries, we'd need to fetch from multiple teams
    // This is a placeholder - you'd implement based on your needs
    return []
  } catch (error) {
    console.error(`Injury fetch error:`, error)
    return []
  }
}

/**
 * Get injury updates for a game
 */
async function getGameInjuries(
  sport: string,
  gameId: string
): Promise<InjuryUpdate[]> {
  try {
    const injuries = await espn.getGameInjuries(sport as 'NFL' | 'NBA' | 'NHL' | 'MLB', gameId)
    return transformESPNInjuries(injuries, sport)
  } catch (error) {
    console.error(`Game injury fetch error:`, error)
    return []
  }
}

function mapInjuryStatus(status: string): InjuryUpdate['status'] {
  const statusLower = status.toLowerCase()
  if (statusLower.includes('out')) return 'out'
  if (statusLower.includes('doubtful')) return 'doubtful'
  if (statusLower.includes('questionable')) return 'questionable'
  if (statusLower.includes('probable')) return 'probable'
  if (statusLower.includes('day-to-day') || statusLower.includes('dtd')) return 'day-to-day'
  if (statusLower.includes('ir') || statusLower.includes('injured reserve')) return 'ir'
  return 'questionable'
}

// ===========================================
// AGGREGATED NEWS FEED
// ===========================================

/**
 * Get aggregated news feed for a sport
 * Combines ESPN articles and Twitter updates
 */
export async function getSportNewsFeed(
  sport: 'NFL' | 'NBA' | 'NHL' | 'MLB',
  options: {
    includeTwitter?: boolean
    includeInjuries?: boolean
    limit?: number
  } = {}
): Promise<NewsFeed> {
  const {
    includeTwitter = true,
    includeInjuries = true,
    limit = 20,
  } = options

  const items: NewsItem[] = []

  // Fetch in parallel
  const [espnNews, twitterNews] = await Promise.all([
    getESPNNews(sport, limit),
    includeTwitter ? getTwitterNews(sport, Math.floor(limit / 2)) : Promise.resolve([]),
  ])

  items.push(...espnNews, ...twitterNews)

  // Add injury updates as news items if requested
  if (includeInjuries) {
    const injuries = await getInjuries(sport)
    const injuryNews: NewsItem[] = injuries.slice(0, 5).map(injury => ({
      id: injury.id,
      source: 'injury',
      type: 'injury',
      sport,
      title: `${injury.player} (${injury.team}) - ${injury.status.toUpperCase()}`,
      description: `${injury.injury}${injury.description ? `: ${injury.description}` : ''}`,
      url: '#',
      publishedAt: injury.updatedAt,
      teams: [injury.team],
      players: [injury.player],
    }))
    items.push(...injuryNews)
  }

  // Sort by date, newest first
  items.sort((a, b) => 
    new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  )

  return {
    items: items.slice(0, limit),
    lastUpdated: new Date().toISOString(),
  }
}

/**
 * Get news feed for a specific team
 */
export async function getTeamNewsFeed(
  sport: string,
  team: {
    id: string
    name: string
    abbreviation: string
  },
  options: {
    includeTwitter?: boolean
    includeInjuries?: boolean
    limit?: number
  } = {}
): Promise<NewsFeed> {
  const {
    includeTwitter = true,
    includeInjuries = true,
    limit = 15,
  } = options

  const items: NewsItem[] = []

  // Fetch in parallel
  const [espnNews, twitterNews, injuries] = await Promise.all([
    getESPNTeamNews(sport, team.id),
    includeTwitter 
      ? getTwitterTeamNews(team.name, team.abbreviation, sport, 5)
      : Promise.resolve([]),
    includeInjuries 
      ? getInjuries(sport, team.id)
      : Promise.resolve([]),
  ])

  items.push(...espnNews, ...twitterNews)

  // Add injuries as news items
  if (injuries.length > 0) {
    const injuryNews: NewsItem[] = injuries.map(injury => ({
      id: injury.id,
      source: 'injury',
      type: 'injury',
      sport,
      title: `${injury.player} - ${injury.status.toUpperCase()}`,
      description: `${injury.injury}${injury.description ? `: ${injury.description}` : ''}`,
      url: '#',
      publishedAt: injury.updatedAt,
      teams: [team.name],
      players: [injury.player],
    }))
    items.push(...injuryNews)
  }

  // Sort by date
  items.sort((a, b) => 
    new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  )

  return {
    items: items.slice(0, limit),
    lastUpdated: new Date().toISOString(),
  }
}

/**
 * Get news feed for a game matchup
 */
export async function getGameNewsFeed(
  sport: string,
  gameId: string,
  homeTeam: { id: string; name: string; abbreviation: string },
  awayTeam: { id: string; name: string; abbreviation: string },
  options: {
    includeTwitter?: boolean
    includeInjuries?: boolean
    limit?: number
  } = {}
): Promise<NewsFeed> {
  const {
    includeTwitter = true,
    includeInjuries = true,
    limit = 20,
  } = options

  const items: NewsItem[] = []

  // Fetch in parallel
  const [
    homeNews,
    awayNews,
    gameTwitter,
    injuries,
  ] = await Promise.all([
    getESPNTeamNews(sport, homeTeam.id),
    getESPNTeamNews(sport, awayTeam.id),
    includeTwitter 
      ? getTwitterGameNews(homeTeam, awayTeam, sport, 5)
      : Promise.resolve([]),
    includeInjuries 
      ? getGameInjuries(sport, gameId)
      : Promise.resolve([]),
  ])

  // Take top items from each team
  items.push(...homeNews.slice(0, 3), ...awayNews.slice(0, 3), ...gameTwitter)

  // Add injuries
  if (injuries.length > 0) {
    const injuryNews: NewsItem[] = injuries.map(injury => ({
      id: injury.id,
      source: 'injury',
      type: 'injury',
      sport,
      title: `${injury.player} (${injury.team}) - ${injury.status.toUpperCase()}`,
      description: `${injury.injury}${injury.description ? `: ${injury.description}` : ''}`,
      url: '#',
      publishedAt: injury.updatedAt,
      teams: [injury.team],
      players: [injury.player],
    }))
    items.push(...injuryNews)
  }

  // Sort by date
  items.sort((a, b) => 
    new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  )

  return {
    items: items.slice(0, limit),
    lastUpdated: new Date().toISOString(),
  }
}

/**
 * Get all sports news (for main news page)
 */
export async function getAllSportsNews(
  options: {
    sports?: Array<'NFL' | 'NBA' | 'NHL' | 'MLB'>
    includeTwitter?: boolean
    limit?: number
  } = {}
): Promise<NewsFeed> {
  const {
    sports = ['NFL', 'NBA', 'NHL', 'MLB'],
    includeTwitter = true,
    limit = 50,
  } = options

  // Fetch all sports in parallel
  const feeds = await Promise.all(
    sports.map(sport => getSportNewsFeed(sport, { includeTwitter, limit: Math.floor(limit / sports.length) }))
  )

  // Combine and sort
  const allItems = feeds.flatMap(feed => feed.items)
  allItems.sort((a, b) => 
    new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  )

  return {
    items: allItems.slice(0, limit),
    lastUpdated: new Date().toISOString(),
  }
}

// ===========================================
// EXPORTS
// ===========================================

export {
  getESPNNews,
  getESPNTeamNews,
  getTwitterNews,
  getTwitterTeamNews,
  getTwitterGameNews,
  getInjuries,
  getGameInjuries,
}

export default {
  getSportNewsFeed,
  getTeamNewsFeed,
  getGameNewsFeed,
  getAllSportsNews,
  getInjuries,
  getGameInjuries,
}
