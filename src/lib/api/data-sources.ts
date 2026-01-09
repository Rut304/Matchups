/**
 * Data Source Hierarchy System
 * Manages primary and backup data sources for team and game data
 * Provides fallback logic when primary sources fail
 */

// =============================================================================
// DATA SOURCE TYPES
// =============================================================================

export type DataSourceProvider = 'espn' | 'odds-api' | 'supabase' | 'manual'

export interface DataSourceConfig {
  provider: DataSourceProvider
  priority: number // Lower = higher priority (1 = primary, 2 = backup, etc.)
  enabled: boolean
  rateLimit?: number // Requests per minute
  timeout?: number // MS to wait before failing over
}

export interface DataSourceResult<T> {
  data: T | null
  source: DataSourceProvider
  timestamp: string
  cached: boolean
  fallbackUsed: boolean
  error?: string
}

// Source-specific metadata for debugging/transparency
export interface SourceMetadata {
  provider: DataSourceProvider
  responseTime: number // ms
  confidence: number // 0-100, how reliable this source is for this data type
  lastUpdated: string
}

// =============================================================================
// DATA SOURCE HIERARCHY CONFIGURATION
// =============================================================================

// Define which sources to use for different data types
export const DATA_SOURCE_HIERARCHY: Record<string, DataSourceConfig[]> = {
  // Game schedules: ESPN is primary (free, comprehensive)
  'game-schedule': [
    { provider: 'espn', priority: 1, enabled: true, timeout: 5000 },
    { provider: 'supabase', priority: 2, enabled: true }, // Cached fallback
  ],
  
  // Live scores: ESPN is primary for real-time updates
  'live-scores': [
    { provider: 'espn', priority: 1, enabled: true, timeout: 3000 },
    { provider: 'supabase', priority: 2, enabled: true },
  ],
  
  // Betting odds: The Odds API is primary (more accurate)
  'betting-odds': [
    { provider: 'odds-api', priority: 1, enabled: true, rateLimit: 500, timeout: 5000 },
    { provider: 'espn', priority: 2, enabled: true }, // Has basic lines
    { provider: 'supabase', priority: 3, enabled: true }, // Last known odds
  ],
  
  // Team info: ESPN is primary (official logos, colors)
  'team-info': [
    { provider: 'espn', priority: 1, enabled: true, timeout: 5000 },
    { provider: 'supabase', priority: 2, enabled: true },
  ],
  
  // Player stats: ESPN is primary
  'player-stats': [
    { provider: 'espn', priority: 1, enabled: true, timeout: 5000 },
    { provider: 'supabase', priority: 2, enabled: true },
  ],
  
  // Standings: ESPN is primary
  'standings': [
    { provider: 'espn', priority: 1, enabled: true, timeout: 5000 },
    { provider: 'supabase', priority: 2, enabled: true },
  ],
}

// =============================================================================
// DATA SOURCE MANAGER
// =============================================================================

class DataSourceManager {
  private sourceHealth: Map<DataSourceProvider, { 
    failures: number
    lastFailure?: Date
    disabled: boolean 
  }> = new Map()
  
  private cache: Map<string, { data: unknown; timestamp: number; ttl: number }> = new Map()
  
  constructor() {
    // Initialize health tracking
    const providers: DataSourceProvider[] = ['espn', 'odds-api', 'supabase', 'manual']
    providers.forEach(p => this.sourceHealth.set(p, { failures: 0, disabled: false }))
  }
  
  /**
   * Get data using the hierarchy, with automatic fallback
   */
  async fetchWithFallback<T>(
    dataType: keyof typeof DATA_SOURCE_HIERARCHY,
    fetchFunctions: Partial<Record<DataSourceProvider, () => Promise<T>>>,
    options: { cacheKey?: string; cacheTTL?: number } = {}
  ): Promise<DataSourceResult<T>> {
    const hierarchy = DATA_SOURCE_HIERARCHY[dataType]
    if (!hierarchy) {
      throw new Error(`Unknown data type: ${dataType}`)
    }
    
    // Check cache first
    if (options.cacheKey) {
      const cached = this.getFromCache<T>(options.cacheKey)
      if (cached) {
        return {
          data: cached,
          source: 'supabase', // Cached data
          timestamp: new Date().toISOString(),
          cached: true,
          fallbackUsed: false,
        }
      }
    }
    
    // Sort by priority and filter enabled sources
    const sortedSources = hierarchy
      .filter(s => s.enabled && !this.isSourceDisabled(s.provider))
      .sort((a, b) => a.priority - b.priority)
    
    let lastError: string | undefined
    let fallbackUsed = false
    
    for (let i = 0; i < sortedSources.length; i++) {
      const source = sortedSources[i]
      const fetchFn = fetchFunctions[source.provider]
      
      if (!fetchFn) continue
      
      try {
        const timeoutMs = source.timeout || 10000
        const data = await this.fetchWithTimeout(fetchFn, timeoutMs)
        
        // Success - reset failure count
        this.recordSuccess(source.provider)
        
        // Cache the result
        if (options.cacheKey && data) {
          this.setCache(options.cacheKey, data, options.cacheTTL || 60000)
        }
        
        return {
          data,
          source: source.provider,
          timestamp: new Date().toISOString(),
          cached: false,
          fallbackUsed: i > 0, // Used fallback if not the first source
        }
      } catch (error) {
        lastError = error instanceof Error ? error.message : String(error)
        this.recordFailure(source.provider)
        fallbackUsed = true
        console.warn(`[DataSources] ${source.provider} failed for ${dataType}: ${lastError}`)
      }
    }
    
    // All sources failed
    return {
      data: null,
      source: sortedSources[0]?.provider || 'espn',
      timestamp: new Date().toISOString(),
      cached: false,
      fallbackUsed,
      error: `All sources failed. Last error: ${lastError}`,
    }
  }
  
  /**
   * Fetch with timeout
   */
  private async fetchWithTimeout<T>(
    fn: () => Promise<T>,
    timeoutMs: number
  ): Promise<T> {
    return Promise.race([
      fn(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`Timeout after ${timeoutMs}ms`)), timeoutMs)
      ),
    ])
  }
  
  /**
   * Record a successful fetch
   */
  private recordSuccess(provider: DataSourceProvider): void {
    const health = this.sourceHealth.get(provider)
    if (health) {
      health.failures = Math.max(0, health.failures - 1) // Decay failures on success
      health.disabled = false
    }
  }
  
  /**
   * Record a failed fetch
   */
  private recordFailure(provider: DataSourceProvider): void {
    const health = this.sourceHealth.get(provider)
    if (health) {
      health.failures += 1
      health.lastFailure = new Date()
      
      // Disable source after 5 consecutive failures
      if (health.failures >= 5) {
        health.disabled = true
        console.error(`[DataSources] Disabling ${provider} after ${health.failures} failures`)
        
        // Re-enable after 5 minutes
        setTimeout(() => {
          health.disabled = false
          health.failures = 0
          console.log(`[DataSources] Re-enabling ${provider}`)
        }, 5 * 60 * 1000)
      }
    }
  }
  
  /**
   * Check if a source is temporarily disabled
   */
  private isSourceDisabled(provider: DataSourceProvider): boolean {
    return this.sourceHealth.get(provider)?.disabled || false
  }
  
  /**
   * Get from cache
   */
  private getFromCache<T>(key: string): T | null {
    const cached = this.cache.get(key)
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return cached.data as T
    }
    this.cache.delete(key) // Expired
    return null
  }
  
  /**
   * Set cache
   */
  private setCache(key: string, data: unknown, ttl: number): void {
    this.cache.set(key, { data, timestamp: Date.now(), ttl })
  }
  
  /**
   * Get health status of all sources
   */
  getHealthStatus(): Record<DataSourceProvider, { healthy: boolean; failures: number }> {
    const status: Record<string, { healthy: boolean; failures: number }> = {}
    this.sourceHealth.forEach((health, provider) => {
      status[provider] = {
        healthy: !health.disabled,
        failures: health.failures,
      }
    })
    return status as Record<DataSourceProvider, { healthy: boolean; failures: number }>
  }
}

// Singleton instance
export const dataSourceManager = new DataSourceManager()

// =============================================================================
// GAME MATCHING UTILITIES (for duplicate detection)
// =============================================================================

export interface GameIdentifiers {
  espnId?: string
  oddsApiId?: string
  homeTeam: string
  awayTeam: string
  scheduledTime: string
  venue?: string
}

/**
 * Generate a unique game fingerprint for matching across sources
 * Used to detect duplicate games and confirm correct matches
 */
export function generateGameFingerprint(game: GameIdentifiers): string {
  const normalizeTeam = (name: string) => 
    name.toLowerCase().replace(/[^a-z]/g, '').slice(0, 10)
  
  const date = new Date(game.scheduledTime)
  const dateStr = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
  
  return `${normalizeTeam(game.homeTeam)}-${normalizeTeam(game.awayTeam)}-${dateStr}`
}

/**
 * Match games from different sources using multiple signals
 * Returns confidence score (0-100)
 */
export function matchGames(
  game1: GameIdentifiers,
  game2: GameIdentifiers
): { isMatch: boolean; confidence: number; matchedBy: string[] } {
  const matchedBy: string[] = []
  let score = 0
  
  // Direct ID match (highest confidence)
  if (game1.espnId && game1.espnId === game2.espnId) {
    matchedBy.push('espnId')
    score += 100
    return { isMatch: true, confidence: 100, matchedBy }
  }
  
  if (game1.oddsApiId && game1.oddsApiId === game2.oddsApiId) {
    matchedBy.push('oddsApiId')
    score += 100
    return { isMatch: true, confidence: 100, matchedBy }
  }
  
  // Team name matching
  const normalizeTeam = (name: string) => 
    name.toLowerCase().replace(/[^a-z]/g, '')
  
  const home1 = normalizeTeam(game1.homeTeam)
  const home2 = normalizeTeam(game2.homeTeam)
  const away1 = normalizeTeam(game1.awayTeam)
  const away2 = normalizeTeam(game2.awayTeam)
  
  // Check if teams match (either direction)
  const teamsMatch = 
    (home1.includes(home2) || home2.includes(home1)) &&
    (away1.includes(away2) || away2.includes(away1))
  
  if (teamsMatch) {
    matchedBy.push('teams')
    score += 40
  }
  
  // Time matching (within 2 hours)
  const time1 = new Date(game1.scheduledTime).getTime()
  const time2 = new Date(game2.scheduledTime).getTime()
  const timeDiff = Math.abs(time1 - time2)
  
  if (timeDiff < 2 * 60 * 60 * 1000) { // 2 hours
    matchedBy.push('time')
    score += timeDiff < 30 * 60 * 1000 ? 30 : 20 // More points for closer times
  }
  
  // Venue matching
  if (game1.venue && game2.venue) {
    const venue1 = normalizeTeam(game1.venue)
    const venue2 = normalizeTeam(game2.venue)
    if (venue1.includes(venue2) || venue2.includes(venue1)) {
      matchedBy.push('venue')
      score += 10
    }
  }
  
  // Fingerprint matching
  const fp1 = generateGameFingerprint(game1)
  const fp2 = generateGameFingerprint(game2)
  if (fp1 === fp2) {
    matchedBy.push('fingerprint')
    score += 20
  }
  
  return {
    isMatch: score >= 60,
    confidence: Math.min(100, score),
    matchedBy,
  }
}

/**
 * Detect and resolve duplicate games from ESPN
 * Uses backup source (Odds API) to confirm correct game
 */
export function resolveDuplicates<T extends GameIdentifiers>(
  espnGames: T[],
  oddsGames: GameIdentifiers[]
): { resolved: T[]; duplicates: T[] } {
  const fingerprints = new Map<string, T[]>()
  
  // Group ESPN games by fingerprint
  for (const game of espnGames) {
    const fp = generateGameFingerprint(game)
    const existing = fingerprints.get(fp) || []
    existing.push(game)
    fingerprints.set(fp, existing)
  }
  
  const resolved: T[] = []
  const duplicates: T[] = []
  
  // Process each fingerprint group
  for (const [fp, games] of fingerprints) {
    if (games.length === 1) {
      // No duplicate, add directly
      resolved.push(games[0])
    } else {
      // Duplicate detected - use Odds API to resolve
      console.warn(`[DataSources] Detected ${games.length} duplicate games for fingerprint: ${fp}`)
      
      // Find matching Odds API game
      const oddsMatch = oddsGames.find(og => 
        matchGames(games[0], og).confidence >= 60
      )
      
      if (oddsMatch) {
        // Find the ESPN game that best matches the Odds API data
        let bestMatch: T | null = null
        let bestConfidence = 0
        
        for (const game of games) {
          const { confidence } = matchGames(game, oddsMatch)
          if (confidence > bestConfidence) {
            bestConfidence = confidence
            bestMatch = game
          }
        }
        
        if (bestMatch) {
          resolved.push(bestMatch)
          // Mark others as duplicates
          for (const game of games) {
            if (game !== bestMatch) {
              duplicates.push(game)
            }
          }
        } else {
          // Fallback: just use first game
          resolved.push(games[0])
          duplicates.push(...games.slice(1))
        }
      } else {
        // No Odds API match - use first game by default
        resolved.push(games[0])
        duplicates.push(...games.slice(1))
      }
    }
  }
  
  return { resolved, duplicates }
}
