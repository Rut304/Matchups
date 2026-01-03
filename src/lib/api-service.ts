// Centralized API Service
// Handles all external API calls with proper error handling, caching, and rate limiting

import { oddsClient, type BettingLine, type LineMovement } from './api/odds'
import { marketsClient, type PredictionMarket, type MarketTrend } from './api/markets'
import { sportsClient } from './api/sports'

// =============================================================================
// TYPES
// =============================================================================

export interface CachedData<T> {
  data: T
  timestamp: number
  expiresAt: number
}

export interface APIResponse<T> {
  success: boolean
  data?: T
  error?: string
  cached?: boolean
}

export interface Alert {
  id: string
  type: 'line_movement' | 'sharp_money' | 'public_betting' | 'price_change'
  sport?: string
  gameId?: string
  marketId?: string
  threshold: number
  direction: 'up' | 'down' | 'both'
  isActive: boolean
  createdAt: string
  triggeredAt?: string
}

export interface AlertTrigger {
  alertId: string
  type: string
  message: string
  currentValue: number
  previousValue: number
  change: number
  timestamp: string
}

// =============================================================================
// CACHE CONFIGURATION
// =============================================================================

const CACHE_TTL = {
  odds: 60 * 1000, // 1 minute
  markets: 5 * 60 * 1000, // 5 minutes
  scores: 30 * 1000, // 30 seconds
  standings: 60 * 60 * 1000, // 1 hour
  teams: 24 * 60 * 60 * 1000, // 24 hours
}

// In-memory cache (would be Redis in production)
const cache = new Map<string, CachedData<unknown>>()

// =============================================================================
// CACHE HELPERS
// =============================================================================

function getCached<T>(key: string): T | null {
  const cached = cache.get(key)
  if (!cached) return null
  if (Date.now() > cached.expiresAt) {
    cache.delete(key)
    return null
  }
  return cached.data as T
}

function setCache<T>(key: string, data: T, ttl: number): void {
  cache.set(key, {
    data,
    timestamp: Date.now(),
    expiresAt: Date.now() + ttl,
  })
}

// =============================================================================
// ODDS API SERVICE
// =============================================================================

export async function getOdds(sport: string): Promise<APIResponse<BettingLine[]>> {
  const cacheKey = `odds:${sport}`
  const cached = getCached<BettingLine[]>(cacheKey)
  
  if (cached) {
    return { success: true, data: cached, cached: true }
  }
  
  try {
    const data = await oddsClient.getOdds(sport)
    setCache(cacheKey, data, CACHE_TTL.odds)
    return { success: true, data }
  } catch (error) {
    return { success: false, error: `Failed to fetch ${sport} odds` }
  }
}

export async function getBestLines(sport: string): Promise<APIResponse<Record<string, BettingLine>>> {
  const cacheKey = `bestlines:${sport}`
  const cached = getCached<Record<string, BettingLine>>(cacheKey)
  
  if (cached) {
    return { success: true, data: cached, cached: true }
  }
  
  try {
    const data = await oddsClient.getBestLines(sport)
    setCache(cacheKey, data, CACHE_TTL.odds)
    return { success: true, data }
  } catch (error) {
    return { success: false, error: `Failed to fetch ${sport} best lines` }
  }
}

export async function getLineMovements(sport: string): Promise<APIResponse<LineMovement[]>> {
  try {
    const data = await oddsClient.getLineMovements(sport)
    return { success: true, data }
  } catch (error) {
    return { success: false, error: `Failed to fetch ${sport} line movements` }
  }
}

// =============================================================================
// PREDICTION MARKETS SERVICE
// =============================================================================

export async function getPredictionMarkets(
  platform?: 'polymarket' | 'kalshi',
  category?: string
): Promise<APIResponse<PredictionMarket[]>> {
  const cacheKey = `markets:${platform || 'all'}:${category || 'all'}`
  const cached = getCached<PredictionMarket[]>(cacheKey)
  
  if (cached) {
    return { success: true, data: cached, cached: true }
  }
  
  try {
    let data: PredictionMarket[] = []
    if (platform === 'polymarket') {
      data = await marketsClient.getPolymarketMarkets(category)
    } else if (platform === 'kalshi') {
      data = await marketsClient.getKalshiMarkets(category)
    } else {
      data = await marketsClient.getAllSportsMarkets()
    }
    setCache(cacheKey, data, CACHE_TTL.markets)
    return { success: true, data }
  } catch (error) {
    return { success: false, error: 'Failed to fetch prediction markets' }
  }
}

export async function getSportsMarkets(): Promise<APIResponse<PredictionMarket[]>> {
  const cacheKey = 'markets:sports'
  const cached = getCached<PredictionMarket[]>(cacheKey)
  
  if (cached) {
    return { success: true, data: cached, cached: true }
  }
  
  try {
    const data = await marketsClient.getAllSportsMarkets()
    setCache(cacheKey, data, CACHE_TTL.markets)
    return { success: true, data }
  } catch (error) {
    return { success: false, error: 'Failed to fetch sports markets' }
  }
}

export async function getMarketTrends(): Promise<APIResponse<MarketTrend[]>> {
  try {
    const data = await marketsClient.getTrendingMarkets()
    return { success: true, data }
  } catch (error) {
    return { success: false, error: 'Failed to fetch market trends' }
  }
}

// =============================================================================
// SPORTS DATA SERVICE
// =============================================================================

export async function getLiveScores(sport: string): Promise<APIResponse<unknown[]>> {
  const cacheKey = `scores:${sport}`
  const cached = getCached<unknown[]>(cacheKey)
  
  if (cached) {
    return { success: true, data: cached, cached: true }
  }
  
  try {
    const data = await sportsClient.getUpcomingGames(sport)
    setCache(cacheKey, data, CACHE_TTL.scores)
    return { success: true, data }
  } catch (error) {
    return { success: false, error: `Failed to fetch ${sport} scores` }
  }
}

export async function getTeamStats(sport: string, teamId: string): Promise<APIResponse<unknown>> {
  const cacheKey = `team:${sport}:${teamId}`
  const cached = getCached<unknown>(cacheKey)
  
  if (cached) {
    return { success: true, data: cached, cached: true }
  }
  
  try {
    const data = await sportsClient.getTeamStats(sport, teamId)
    setCache(cacheKey, data, CACHE_TTL.teams)
    return { success: true, data }
  } catch (error) {
    return { success: false, error: `Failed to fetch team stats` }
  }
}

// =============================================================================
// ALERTS SERVICE
// =============================================================================

// In-memory alerts storage (would be database in production)
const alerts: Alert[] = []
const alertTriggers: AlertTrigger[] = []

export function createAlert(alert: Omit<Alert, 'id' | 'createdAt'>): Alert {
  const newAlert: Alert = {
    ...alert,
    id: `alert_${Date.now()}`,
    createdAt: new Date().toISOString(),
  }
  alerts.push(newAlert)
  return newAlert
}

export function getAlerts(userId?: string): Alert[] {
  // In production, filter by userId
  return alerts.filter(a => a.isActive)
}

export function deleteAlert(alertId: string): boolean {
  const idx = alerts.findIndex(a => a.id === alertId)
  if (idx === -1) return false
  alerts.splice(idx, 1)
  return true
}

export function checkAlerts(): AlertTrigger[] {
  const newTriggers: AlertTrigger[] = []
  
  for (const alert of alerts) {
    if (!alert.isActive) continue
    
    // Check line movement alerts
    if (alert.type === 'line_movement' && alert.sport) {
      // Would compare current lines vs previous lines
      // Trigger if movement exceeds threshold
    }
    
    // Check price change alerts (prediction markets)
    if (alert.type === 'price_change' && alert.marketId) {
      // Would compare current price vs previous price
      // Trigger if change exceeds threshold
    }
  }
  
  alertTriggers.push(...newTriggers)
  return newTriggers
}

export function getAlertHistory(): AlertTrigger[] {
  return alertTriggers.slice(-100) // Last 100 triggers
}

// =============================================================================
// EDGE FINDING SERVICE
// =============================================================================

export interface EdgeOpportunity {
  id: string
  type: 'clv' | 'rlm' | 'steam' | 'public_fade' | 'situational'
  sport: string
  game: string
  description: string
  confidence: number // 1-100
  expectedValue: number // percentage
  timestamp: string
}

export function findEdges(sport: string): EdgeOpportunity[] {
  // Would analyze:
  // 1. CLV (Closing Line Value) - is line moving in favor of a pick?
  // 2. RLM (Reverse Line Movement) - line moving opposite to public betting
  // 3. Steam moves - sharp money hitting a line
  // 4. Public fade opportunities - heavy public on one side
  // 5. Situational edges - rest, travel, motivation
  
  // Mock edges for now
  return [
    {
      id: 'edge_1',
      type: 'rlm',
      sport,
      game: 'DET vs MIN',
      description: 'Line moved from DET -3 to DET -2.5 despite 70% public on DET. Sharp money on MIN.',
      confidence: 72,
      expectedValue: 3.2,
      timestamp: new Date().toISOString(),
    },
    {
      id: 'edge_2',
      type: 'situational',
      sport,
      game: 'KC vs DEN',
      description: 'KC on short rest after primetime game. UNDER has hit 8 of last 10 in this spot.',
      confidence: 65,
      expectedValue: 2.8,
      timestamp: new Date().toISOString(),
    },
  ]
}

// =============================================================================
// BANKROLL MANAGEMENT SERVICE
// =============================================================================

export interface BankrollEntry {
  id: string
  date: string
  type: 'bet' | 'deposit' | 'withdrawal'
  amount: number
  description?: string
  sport?: string
  betType?: string
  result?: 'win' | 'loss' | 'push' | 'pending'
  odds?: number
}

// In-memory bankroll (would be database in production)
let bankroll = 1000 // Starting bankroll
const bankrollHistory: BankrollEntry[] = []

export function getBankroll(): number {
  return bankroll
}

export function getBankrollHistory(): BankrollEntry[] {
  return bankrollHistory
}

export function addBankrollEntry(entry: Omit<BankrollEntry, 'id'>): BankrollEntry {
  const newEntry: BankrollEntry = {
    ...entry,
    id: `br_${Date.now()}`,
  }
  
  if (entry.type === 'bet' && entry.result === 'win') {
    // Calculate winnings based on odds
    const winnings = entry.amount * (entry.odds && entry.odds > 0 ? entry.odds / 100 : 100 / Math.abs(entry.odds || 100))
    bankroll += winnings
  } else if (entry.type === 'bet' && entry.result === 'loss') {
    bankroll -= entry.amount
  } else if (entry.type === 'deposit') {
    bankroll += entry.amount
  } else if (entry.type === 'withdrawal') {
    bankroll -= entry.amount
  }
  
  bankrollHistory.push(newEntry)
  return newEntry
}

export function calculateUnitSize(): number {
  // Kelly Criterion-based unit sizing
  // 1 unit = 1-2% of bankroll
  return Math.round(bankroll * 0.01)
}

export function getROI(): number {
  const bets = bankrollHistory.filter(e => e.type === 'bet' && e.result !== 'pending')
  if (bets.length === 0) return 0
  
  const totalWagered = bets.reduce((sum, b) => sum + b.amount, 0)
  const totalProfit = bets.reduce((sum, b) => {
    if (b.result === 'win') {
      const winnings = b.amount * (b.odds && b.odds > 0 ? b.odds / 100 : 100 / Math.abs(b.odds || 100))
      return sum + winnings
    } else if (b.result === 'loss') {
      return sum - b.amount
    }
    return sum
  }, 0)
  
  return (totalProfit / totalWagered) * 100
}
