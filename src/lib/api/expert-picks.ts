/**
 * Expert Picks Aggregator
 * Aggregates picks from multiple sources:
 * - Twitter/X API (tracked cappers)
 * - ESPN Experts
 * - Covers.com Consensus
 * - TheScore Predictions
 * - OddsJam/OddsPortal Sharp Data
 * 
 * For virality: Generate shareable stats cards for expert records
 */

// =============================================================================
// TYPES
// =============================================================================

export type ExpertSource = 
  | 'twitter' 
  | 'espn' 
  | 'covers' 
  | 'thescore' 
  | 'oddsjam' 
  | 'oddsportal'
  | 'action-network'
  | 'manual'

export type PickResult = 'win' | 'loss' | 'push' | 'pending' | 'void'

export interface ExpertPick {
  id: string
  expertId: string
  expertName: string
  expertHandle?: string // Twitter handle
  source: ExpertSource
  sport: string
  league: string
  gameId?: string
  
  // Pick details
  pickType: 'spread' | 'moneyline' | 'total' | 'prop' | 'parlay' | 'futures'
  pick: string // e.g., "Chiefs -3.5", "Over 47.5", "LeBron O25.5 pts"
  odds: number
  stake?: number // Units wagered (default 1)
  
  // Timing
  pickedAt: string
  gameTime: string
  
  // Result tracking
  result: PickResult
  settledAt?: string
  actualLine?: number // What the line closed at
  clv?: number // Closing Line Value
  
  // Source verification
  sourceUrl?: string // Link to tweet, article, etc.
  sourceId?: string // Tweet ID, article ID, etc.
  verified: boolean
  
  // Metadata
  confidence?: number // 1-5 stars if provided
  analysis?: string // Their reasoning if captured
}

export interface ExpertProfile {
  id: string
  name: string
  slug: string
  source: ExpertSource
  twitterHandle?: string
  avatarUrl?: string
  network?: string
  role?: string
  
  // Aggregated stats
  stats: {
    totalPicks: number
    wins: number
    losses: number
    pushes: number
    pending: number
    winPct: number
    units: number
    roi: number
    avgOdds: number
    clvAvg?: number
    streak: string // "W5", "L3", etc.
  }
  
  // By sport breakdown
  sportStats: Record<string, {
    picks: number
    winPct: number
    units: number
  }>
  
  // Tracking
  isTracked: boolean
  lastSyncAt?: string
  syncFrequency: 'realtime' | 'hourly' | 'daily'
}

export interface ExpertLeaderboard {
  timeframe: 'today' | '3days' | 'week' | 'month' | 'season' | 'all'
  entries: ExpertProfile[]
  updatedAt: string
}

// =============================================================================
// TWITTER/X API INTEGRATION
// =============================================================================

interface TwitterConfig {
  bearerToken: string
  trackedAccounts: string[] // User IDs to monitor
  keywords: string[] // Betting keywords to detect
}

// Parse betting picks from tweets
const BETTING_PATTERNS = {
  spread: /([A-Z]{2,4})\s*([+-]\d+\.?\d*)/i,
  total: /(over|under|o|u)\s*(\d+\.?\d*)/i,
  moneyline: /([A-Z]{2,4})\s*ML/i,
  units: /(\d+\.?\d*)\s*(u|units?)/i,
  odds: /([+-]\d{3,})/,
  locks: /(lock|🔒|💰|slam|max|play of the day|potd|best bet)/i,
}

export class TwitterExpertTracker {
  private bearerToken: string
  private trackedAccounts: Map<string, { id: string; handle: string; name: string }>
  
  constructor(config: TwitterConfig) {
    this.bearerToken = config.bearerToken
    this.trackedAccounts = new Map()
  }
  
  /**
   * Get recent tweets from tracked betting accounts
   */
  async fetchRecentPicks(accountHandle: string, since?: Date): Promise<ExpertPick[]> {
    const sinceTime = since || new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
    
    try {
      const response = await fetch(
        `https://api.twitter.com/2/tweets/search/recent?query=from:${accountHandle}&max_results=100&tweet.fields=created_at,text,id&start_time=${sinceTime.toISOString()}`,
        {
          headers: {
            'Authorization': `Bearer ${this.bearerToken}`,
          },
        }
      )
      
      if (!response.ok) {
        throw new Error(`Twitter API error: ${response.status}`)
      }
      
      const data = await response.json()
      
      if (!data.data) return []
      
      // Parse tweets for betting picks
      const picks: ExpertPick[] = []
      
      for (const tweet of data.data) {
        const parsedPick = this.parseTweetForPick(tweet, accountHandle)
        if (parsedPick) {
          picks.push(parsedPick)
        }
      }
      
      return picks
    } catch (error) {
      console.error(`[Twitter] Failed to fetch picks for @${accountHandle}:`, error)
      return []
    }
  }
  
  /**
   * Parse a tweet to extract betting pick information
   */
  private parseTweetForPick(tweet: { id: string; text: string; created_at: string }, handle: string): ExpertPick | null {
    const text = tweet.text
    
    // Must contain some betting indicators
    const hasBettingContent = 
      BETTING_PATTERNS.spread.test(text) ||
      BETTING_PATTERNS.total.test(text) ||
      BETTING_PATTERNS.moneyline.test(text) ||
      BETTING_PATTERNS.locks.test(text)
    
    if (!hasBettingContent) return null
    
    // Extract pick details
    let pickType: ExpertPick['pickType'] = 'spread'
    let pick = ''
    let odds = -110 // Default juice
    let stake = 1
    
    // Try to extract spread
    const spreadMatch = text.match(BETTING_PATTERNS.spread)
    if (spreadMatch) {
      pick = `${spreadMatch[1]} ${spreadMatch[2]}`
      pickType = 'spread'
    }
    
    // Try to extract total
    const totalMatch = text.match(BETTING_PATTERNS.total)
    if (totalMatch) {
      pick = `${totalMatch[1].toUpperCase()} ${totalMatch[2]}`
      pickType = 'total'
    }
    
    // Try to extract ML
    const mlMatch = text.match(BETTING_PATTERNS.moneyline)
    if (mlMatch) {
      pick = `${mlMatch[1]} ML`
      pickType = 'moneyline'
    }
    
    // Extract odds if present
    const oddsMatch = text.match(BETTING_PATTERNS.odds)
    if (oddsMatch) {
      odds = parseInt(oddsMatch[1])
    }
    
    // Extract units
    const unitsMatch = text.match(BETTING_PATTERNS.units)
    if (unitsMatch) {
      stake = parseFloat(unitsMatch[1])
    }
    
    // Check for high confidence indicators
    const confidence = BETTING_PATTERNS.locks.test(text) ? 5 : 3
    
    if (!pick) return null
    
    return {
      id: `twitter-${tweet.id}`,
      expertId: `twitter-${handle}`,
      expertName: handle,
      expertHandle: handle,
      source: 'twitter',
      sport: this.detectSport(text),
      league: this.detectLeague(text),
      pickType,
      pick,
      odds,
      stake,
      pickedAt: tweet.created_at,
      gameTime: tweet.created_at, // Will be updated when matched to game
      result: 'pending',
      sourceUrl: `https://twitter.com/${handle}/status/${tweet.id}`,
      sourceId: tweet.id,
      verified: true,
      confidence,
      analysis: text.length > 100 ? text.substring(0, 200) + '...' : text,
    }
  }
  
  /**
   * Detect sport from tweet content
   */
  private detectSport(text: string): string {
    const sportPatterns: Record<string, RegExp> = {
      NFL: /nfl|football|chiefs|eagles|cowboys|bills|ravens|49ers|lions|packers/i,
      NBA: /nba|basketball|lakers|celtics|nuggets|heat|bucks|warriors|suns/i,
      NHL: /nhl|hockey|bruins|avalanche|oilers|panthers|rangers|maple leafs/i,
      MLB: /mlb|baseball|yankees|dodgers|braves|astros|mets|phillies/i,
      NCAAF: /college football|cfb|sec|big ten|acc|pac-12/i,
      NCAAB: /college basketball|cbb|march madness|ncaa/i,
    }
    
    for (const [sport, pattern] of Object.entries(sportPatterns)) {
      if (pattern.test(text)) return sport
    }
    
    return 'UNKNOWN'
  }
  
  /**
   * Detect league from tweet content
   */
  private detectLeague(text: string): string {
    return this.detectSport(text) // Same logic for now
  }
}

// =============================================================================
// ESPN EXPERTS SCRAPER
// =============================================================================

export class ESPNExpertTracker {
  private baseUrl = 'https://site.api.espn.com/apis/site/v2/sports'
  
  /**
   * Fetch expert picks from ESPN's public predictions
   */
  async fetchPicks(sport: string, league: string): Promise<ExpertPick[]> {
    // ESPN exposes some expert picks through their API
    // For NFL: https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard
    // The picks data is in the "predictor" field of each game
    
    try {
      const sportMap: Record<string, { sport: string; league: string }> = {
        NFL: { sport: 'football', league: 'nfl' },
        NBA: { sport: 'basketball', league: 'nba' },
        NHL: { sport: 'hockey', league: 'nhl' },
        MLB: { sport: 'baseball', league: 'mlb' },
      }
      
      const mapping = sportMap[sport]
      if (!mapping) return []
      
      const response = await fetch(
        `${this.baseUrl}/${mapping.sport}/${mapping.league}/scoreboard`
      )
      
      if (!response.ok) return []
      
      const data = await response.json()
      const picks: ExpertPick[] = []
      
      // Extract ESPN expert predictions from games
      for (const event of data.events || []) {
        const predictor = event.competitions?.[0]?.predictor
        if (!predictor) continue
        
        // ESPN provides win probability predictions
        const homeTeam = event.competitions[0].competitors.find((c: { homeAway: string }) => c.homeAway === 'home')
        const awayTeam = event.competitions[0].competitors.find((c: { homeAway: string }) => c.homeAway === 'away')
        
        if (predictor.homeTeam && homeTeam && awayTeam) {
          const favored = predictor.homeTeam.gameProjection > 50 ? homeTeam : awayTeam
          const projection = predictor.homeTeam.gameProjection > 50 
            ? predictor.homeTeam.gameProjection 
            : 100 - predictor.homeTeam.gameProjection
          
          picks.push({
            id: `espn-${event.id}-predictor`,
            expertId: 'espn-predictor',
            expertName: 'ESPN Predictor',
            source: 'espn',
            sport,
            league,
            gameId: event.id,
            pickType: 'moneyline',
            pick: `${favored.team.abbreviation} (${projection.toFixed(1)}% chance)`,
            odds: -110,
            pickedAt: new Date().toISOString(),
            gameTime: event.date,
            result: 'pending',
            verified: true,
            confidence: projection > 70 ? 5 : projection > 60 ? 4 : 3,
          })
        }
      }
      
      return picks
    } catch (error) {
      console.error('[ESPN] Failed to fetch expert picks:', error)
      return []
    }
  }
  
  /**
   * Get ESPN "Experts" consensus picks (their staff picks)
   */
  async fetchExpertConsensus(sport: string, week?: number): Promise<ExpertPick[]> {
    // ESPN staff picks are available during certain seasons
    // This would scrape their picks page or use any available API endpoints
    
    // For now, return empty - would need to implement web scraping
    // or find available API endpoints for expert picks
    return []
  }
}

// =============================================================================
// COVERS.COM CONSENSUS TRACKER
// =============================================================================

export class CoversExpertTracker {
  /**
   * Fetch consensus picks from Covers.com
   * This aggregates public betting percentages and expert picks
   */
  async fetchConsensus(sport: string, date?: Date): Promise<{
    gameId: string
    homeTeam: string
    awayTeam: string
    spreadConsensus: { pick: string; percentage: number }
    totalConsensus: { pick: string; percentage: number }
    mlConsensus: { pick: string; percentage: number }
    expertPicks?: { expert: string; pick: string }[]
  }[]> {
    // Covers.com doesn't have a public API
    // Would need to implement web scraping or use cached data
    
    // For demonstration, return structure that would be populated
    return []
  }
  
  /**
   * Get expert picks from Covers.com experts
   * They have a leaderboard of tracked cappers
   */
  async fetchExpertLeaderboard(): Promise<ExpertProfile[]> {
    // Would scrape Covers.com expert leaderboard
    return []
  }
}

// =============================================================================
// ODDSJAM/ODDSPORTAL SHARP DATA
// =============================================================================

export class SharpDataTracker {
  /**
   * Fetch sharp money indicators from OddsJam
   * Tracks line movements that indicate sharp action
   */
  async fetchSharpMoves(sport: string): Promise<{
    gameId: string
    type: 'spread' | 'total' | 'ml'
    originalLine: number
    currentLine: number
    movement: number
    sharpIndicator: boolean
    steamMove: boolean
    reverseLineMove: boolean
  }[]> {
    // OddsJam has API access for subscribers
    // Would need API key integration
    return []
  }
  
  /**
   * Get consensus from OddsPortal
   * Shows where professional money is going
   */
  async fetchProConsensus(sport: string): Promise<{
    gameId: string
    proSpreadPct: number
    proTotalPct: number
    proMlPct: number
  }[]> {
    return []
  }
}

// =============================================================================
// AGGREGATED EXPERT SERVICE
// =============================================================================

export class ExpertPicksService {
  private twitterTracker: TwitterExpertTracker | null = null
  private espnTracker: ESPNExpertTracker
  private coversTracker: CoversExpertTracker
  private sharpTracker: SharpDataTracker
  
  // Cache for aggregated data
  private cache: Map<string, { data: unknown; timestamp: number }> = new Map()
  private readonly CACHE_TTL = 5 * 60 * 1000 // 5 minutes
  
  constructor(config: { twitterBearerToken?: string }) {
    if (config.twitterBearerToken) {
      this.twitterTracker = new TwitterExpertTracker({
        bearerToken: config.twitterBearerToken,
        trackedAccounts: [],
        keywords: ['lock', 'pick', 'bet', 'play', 'units'],
      })
    }
    this.espnTracker = new ESPNExpertTracker()
    this.coversTracker = new CoversExpertTracker()
    this.sharpTracker = new SharpDataTracker()
  }
  
  /**
   * Get aggregated picks from all sources
   */
  async getAggregatedPicks(options: {
    sport?: string
    timeframe?: 'today' | '3days' | 'week' | 'month'
    source?: ExpertSource
    expertId?: string
  } = {}): Promise<ExpertPick[]> {
    const cacheKey = `picks-${JSON.stringify(options)}`
    const cached = this.getFromCache<ExpertPick[]>(cacheKey)
    if (cached) return cached
    
    const allPicks: ExpertPick[] = []
    
    // Fetch from all enabled sources in parallel
    const [espnPicks] = await Promise.all([
      this.espnTracker.fetchPicks(options.sport || 'NFL', options.sport || 'NFL'),
      // Add other sources as they're implemented
    ])
    
    allPicks.push(...espnPicks)
    
    // Filter by options
    let filteredPicks = allPicks
    
    if (options.sport) {
      filteredPicks = filteredPicks.filter(p => p.sport === options.sport)
    }
    
    if (options.source) {
      filteredPicks = filteredPicks.filter(p => p.source === options.source)
    }
    
    if (options.expertId) {
      filteredPicks = filteredPicks.filter(p => p.expertId === options.expertId)
    }
    
    // Sort by most recent
    filteredPicks.sort((a, b) => 
      new Date(b.pickedAt).getTime() - new Date(a.pickedAt).getTime()
    )
    
    this.setCache(cacheKey, filteredPicks)
    return filteredPicks
  }
  
  /**
   * Get leaderboard of experts by performance
   */
  async getExpertLeaderboard(options: {
    timeframe?: 'today' | '3days' | 'week' | 'month' | 'season' | 'all'
    sport?: string
    sortBy?: 'units' | 'winPct' | 'roi' | 'picks'
    source?: ExpertSource
  } = {}): Promise<ExpertLeaderboard> {
    // Would aggregate from all sources and calculate stats
    // For now, this integrates with existing leaderboard-data.ts
    
    return {
      timeframe: options.timeframe || 'week',
      entries: [],
      updatedAt: new Date().toISOString(),
    }
  }
  
  /**
   * Track a Twitter account for picks
   */
  async trackTwitterAccount(handle: string): Promise<{ success: boolean; expertId?: string; error?: string }> {
    if (!this.twitterTracker) {
      return { success: false, error: 'Twitter API not configured' }
    }
    
    // Would add to tracked accounts and start monitoring
    return { success: true, expertId: `twitter-${handle}` }
  }
  
  /**
   * Generate shareable stats card for an expert
   * Perfect for viral tweets embarrassing/praising experts
   */
  async generateShareableCard(expertId: string, options: {
    timeframe?: string
    sport?: string
  } = {}): Promise<{
    expertName: string
    record: string
    winPct: number
    units: number
    roi: number
    streak: string
    embarrassingLevel?: 'yikes' | 'bad' | 'meh' | 'good' | 'elite'
    shareText: string
    imageUrl?: string
  } | null> {
    // NOTE: This requires tracking expert picks over time
    // Return null until real tracking is implemented
    console.log('[Expert Picks] generateShareableCard called for:', expertId, options)
    return null
  }
  
  // Cache helpers
  private getFromCache<T>(key: string): T | null {
    const entry = this.cache.get(key)
    if (entry && Date.now() - entry.timestamp < this.CACHE_TTL) {
      return entry.data as T
    }
    return null
  }
  
  private setCache(key: string, data: unknown): void {
    this.cache.set(key, { data, timestamp: Date.now() })
  }
}

// =============================================================================
// TRACKED TWITTER EXPERTS (Manual list for now)
// =============================================================================

export const TRACKED_TWITTER_EXPERTS = [
  // High-profile sports media
  { handle: 'stephenasmith', name: 'Stephen A. Smith', network: 'ESPN' },
  { handle: 'ShannonSharpe', name: 'Shannon Sharpe', network: 'ESPN' },
  { handle: 'ColinCowherd', name: 'Colin Cowherd', network: 'FS1' },
  { handle: 'BaylessSkip', name: 'Skip Bayless', network: 'FS1' },
  { handle: 'PatMcAfeeShow', name: 'Pat McAfee', network: 'ESPN' },
  { handle: 'gaborik', name: 'Emmanuel Acho', network: 'FOX' },
  
  // Known cappers/sharps
  { handle: 'WagerTalk', name: 'WagerTalk', network: 'Independent' },
  { handle: 'BetTheBoard', name: 'Bet The Board', network: 'Podcast' },
  { handle: 'spanky', name: 'Spanky', network: 'Twitter' },
  { handle: 'CJNitkowski', name: 'CJ Nitkowski', network: 'Twitter' },
  { handle: 'DGFantasy', name: 'Dan Graziano', network: 'ESPN' },
  
  // Props/DFS experts
  { handle: 'JeffEisenband', name: 'Jeff Eisenband', network: 'TheScore' },
  { handle: 'raboroosevelt', name: 'RJ Bell', network: 'Podcast' },
]

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

let expertPicksService: ExpertPicksService | null = null

export function getExpertPicksService(): ExpertPicksService {
  if (!expertPicksService) {
    expertPicksService = new ExpertPicksService({
      twitterBearerToken: process.env.TWITTER_BEARER_TOKEN,
    })
  }
  return expertPicksService
}

// =============================================================================
// API ROUTE HANDLERS (for cron jobs or manual sync)
// =============================================================================

export async function syncExpertPicks(sport?: string): Promise<{ 
  success: boolean
  picksAdded: number
  errors: string[]
}> {
  const service = getExpertPicksService()
  const errors: string[] = []
  let picksAdded = 0
  
  try {
    const picks = await service.getAggregatedPicks({ sport })
    picksAdded = picks.length
    
    // Would save to Supabase here
    // await supabase.from('expert_picks').upsert(picks)
    
  } catch (error) {
    errors.push(String(error))
  }
  
  return { success: errors.length === 0, picksAdded, errors }
}
