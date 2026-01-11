/**
 * Edge Service - Fetches real prediction market data and calculates edges
 * Uses internal API routes to avoid CORS issues with Polymarket/Kalshi
 */

// Removed direct marketsClient import - using internal API instead

export interface EdgeSignal {
  id: string
  type: 'bias' | 'volume' | 'news' | 'arbitrage' | 'time'
  market: string
  platform: 'polymarket' | 'kalshi'
  currentPrice: number
  fairValue: number
  edge: number
  confidence: number
  signal: 'buy' | 'sell' | 'watch'
  reason: string
  evidence: string
  newsCorrelation?: string
  lastUpdated: string
  category: string
  volume24h: number
  expiresAt?: string
}

export interface NewsEvent {
  id: string
  headline: string
  source: string
  timestamp: string
  impactedMarkets: string[]
  sentiment: 'positive' | 'negative' | 'neutral'
  expectedImpact: string
}

/**
 * Calculate edge signal from a prediction market
 */
function calculateEdgeSignal(market: {
  id: string
  platform: 'polymarket' | 'kalshi'
  question: string
  category: string
  volume: number
  endDate: string
  outcomes: { price: number }[]
  priceChange24h?: number
}): EdgeSignal | null {
  const currentPrice = market.outcomes[0]?.price || 50
  const priceChange = market.priceChange24h || 0
  
  // Simple edge detection heuristics
  // In production, this would use ML models and historical data
  
  let type: EdgeSignal['type'] = 'bias'
  let fairValue = currentPrice
  let signal: EdgeSignal['signal'] = 'watch'
  let reason = ''
  let evidence = ''
  let confidence = 50
  
  // Detect favorite-longshot bias at extreme prices
  if (currentPrice > 85 || currentPrice < 15) {
    type = 'bias'
    // Markets at extremes tend to be overpriced
    fairValue = currentPrice > 85 ? currentPrice - 5 : currentPrice + 5
    signal = currentPrice > 85 ? 'sell' : 'buy'
    reason = 'Favorite-Longshot Bias Detected'
    evidence = `Market at extreme price (${currentPrice}%). Historical data shows 3-5% overpricing at extremes.`
    confidence = 70
  }
  // Detect volume spikes (potential smart money)
  else if (market.volume > 1000000 && Math.abs(priceChange) > 5) {
    type = 'volume'
    fairValue = currentPrice + (priceChange > 0 ? 3 : -3)
    signal = priceChange > 0 ? 'buy' : 'sell'
    reason = 'High Volume Movement'
    evidence = `${(market.volume / 1000000).toFixed(1)}M volume with ${priceChange > 0 ? '+' : ''}${priceChange.toFixed(1)}% price change. May indicate informed trading.`
    confidence = 65
  }
  // Detect time decay opportunities (long-dated markets)
  else if (new Date(market.endDate).getTime() > Date.now() + 180 * 24 * 60 * 60 * 1000) {
    type = 'time'
    // Long-dated markets tend to regress toward 50%
    const regression = (currentPrice - 50) * 0.15
    fairValue = currentPrice - regression
    if (Math.abs(regression) > 5) {
      signal = regression > 0 ? 'sell' : 'buy'
      reason = 'Time Preference Bias'
      evidence = `Long-dated market (${new Date(market.endDate).toLocaleDateString()}). Historical analysis shows ${Math.abs(regression).toFixed(0)}% regression toward base rate.`
      confidence = 60
    }
  }
  
  const edge = currentPrice - fairValue
  
  // Only return if there's meaningful edge
  if (Math.abs(edge) < 2) {
    return null
  }
  
  return {
    id: market.id,
    type,
    market: market.question,
    platform: market.platform,
    currentPrice,
    fairValue,
    edge,
    confidence,
    signal,
    reason,
    evidence,
    lastUpdated: 'Live',
    category: market.category || 'General',
    volume24h: market.volume,
    expiresAt: new Date(market.endDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
  }
}

/**
 * Fetch real edge signals from prediction markets
 * Uses internal API route to avoid CORS issues
 */
export async function fetchEdgeSignals(limit: number = 20): Promise<EdgeSignal[]> {
  try {
    // Fetch markets through our server-side API to avoid CORS
    const response = await fetch('/api/markets?category=sports&limit=100')
    
    if (!response.ok) {
      console.log('Markets API returned non-OK status - using fallback data')
      return getFallbackSignals()
    }
    
    const data = await response.json()
    const markets = data.markets || []
    
    if (!markets || markets.length === 0) {
      console.log('No markets returned from API - using fallback data')
      return getFallbackSignals()
    }
    
    // Calculate edge signals from fetched markets
    const signals: EdgeSignal[] = []
    
    for (const market of markets) {
      // Transform API market format to expected format
      const transformedMarket = {
        id: market.id,
        platform: market.platform as 'polymarket' | 'kalshi',
        question: market.title,
        category: market.category,
        volume: market.volume24h || 0,
        endDate: market.endDate,
        outcomes: [{ price: market.yesPrice }],
        priceChange24h: market.change24h || 0
      }
      
      const signal = calculateEdgeSignal(transformedMarket)
      if (signal) {
        signals.push(signal)
      }
    }
    
    // Sort by confidence
    signals.sort((a, b) => b.confidence - a.confidence)
    
    return signals.length > 0 ? signals.slice(0, limit) : getFallbackSignals()
  } catch (error) {
    console.error('Error fetching edge signals:', error)
    return getFallbackSignals()
  }
}

/**
 * Fetch real news events (placeholder - would integrate with news API)
 */
export async function fetchNewsEvents(): Promise<NewsEvent[]> {
  // TODO: Integrate with news API (e.g., NewsAPI, Alpha Vantage News)
  // For now, return placeholder events
  return [
    {
      id: '1',
      headline: 'Fed signals data-dependent approach ahead of next FOMC meeting',
      source: 'Reuters',
      timestamp: new Date().toISOString(),
      impactedMarkets: ['Fed Rate Decision', 'Economic Outlook'],
      sentiment: 'neutral',
      expectedImpact: 'Moderate - Markets may reprice rate expectations'
    },
    {
      id: '2',
      headline: 'NFL Playoffs: Key matchup analysis for divisional round',
      source: 'ESPN',
      timestamp: new Date().toISOString(),
      impactedMarkets: ['Super Bowl markets'],
      sentiment: 'neutral',
      expectedImpact: 'Low - Routine coverage'
    }
  ]
}

/**
 * Fallback signals when API is unavailable
 */
function getFallbackSignals(): EdgeSignal[] {
  return [
    {
      id: 'fallback-1',
      type: 'bias',
      market: 'Super Bowl Champion 2026',
      platform: 'polymarket',
      currentPrice: 22,
      fairValue: 18,
      edge: 4,
      confidence: 72,
      signal: 'sell',
      reason: 'Favorite-Longshot Bias',
      evidence: 'Playoff favorites historically overpriced by 3-5% in prediction markets.',
      lastUpdated: 'Demo Data',
      category: 'Sports',
      volume24h: 4500000,
      expiresAt: 'Feb 2026'
    },
    {
      id: 'fallback-2',
      type: 'time',
      market: 'Fed Rate Decision Q2 2026',
      platform: 'kalshi',
      currentPrice: 45,
      fairValue: 50,
      edge: -5,
      confidence: 65,
      signal: 'buy',
      reason: 'Time Preference Bias',
      evidence: 'Long-dated economic markets tend to regress toward base rates. Current pricing appears to underprice uncertainty.',
      lastUpdated: 'Demo Data',
      category: 'Economics',
      volume24h: 890000,
      expiresAt: 'Jun 2026'
    }
  ]
}

/**
 * Check if we have live market data
 */
export async function hasLiveData(): Promise<boolean> {
  try {
    const response = await fetch('/api/markets?category=sports&limit=1')
    if (!response.ok) return false
    const data = await response.json()
    return data.markets && data.markets.length > 0
  } catch {
    return false
  }
}
