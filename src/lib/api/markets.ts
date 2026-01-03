import axios from 'axios'

// Polymarket API client
const polymarketApi = axios.create({
  baseURL: 'https://gamma-api.polymarket.com',
})

// Kalshi API client
const kalshiApi = axios.create({
  baseURL: 'https://api.elections.kalshi.com/trade-api/v2',
  headers: {
    'KALSHI-ACCESS-KEY': process.env.KALSHI_API_KEY || '',
  },
})

export interface PredictionMarket {
  id: string
  platform: 'polymarket' | 'kalshi'
  question: string
  category: string
  endDate: string
  volume: number
  liquidity?: number
  outcomes: MarketOutcome[]
  recentTrend?: 'up' | 'down' | 'stable'
  priceChange24h?: number
}

export interface MarketOutcome {
  id: string
  name: string
  price: number // 0-100 representing probability percentage
  volume?: number
}

export interface MarketTrend {
  marketId: string
  question: string
  platform: 'polymarket' | 'kalshi'
  priceChange: number
  volumeChange: number
  timeframe: '1h' | '24h' | '7d'
  currentPrice: number
  previousPrice: number
}

class PredictionMarketsClient {
  // Polymarket methods
  async getPolymarketMarkets(category?: string): Promise<PredictionMarket[]> {
    try {
      const response = await polymarketApi.get('/markets', {
        params: {
          active: true,
          closed: false,
          limit: 100,
          ...(category && { tag_slug: category }),
        },
      })
      
      return this.normalizePolymarketMarkets(response.data || [])
    } catch (error) {
      console.error('Error fetching Polymarket markets:', error)
      return []
    }
  }

  async getPolymarketMarket(marketId: string): Promise<PredictionMarket | null> {
    try {
      const response = await polymarketApi.get(`/markets/${marketId}`)
      const markets = this.normalizePolymarketMarkets([response.data])
      return markets[0] || null
    } catch (error) {
      console.error('Error fetching Polymarket market:', error)
      return null
    }
  }

  async getPolymarketSportsMarkets(): Promise<PredictionMarket[]> {
    return this.getPolymarketMarkets('sports')
  }

  // Kalshi methods
  async getKalshiMarkets(category?: string): Promise<PredictionMarket[]> {
    try {
      const response = await kalshiApi.get('/markets', {
        params: {
          status: 'active',
          limit: 100,
          ...(category && { series_ticker: category }),
        },
      })
      
      return this.normalizeKalshiMarkets(response.data.markets || [])
    } catch (error) {
      console.error('Error fetching Kalshi markets:', error)
      return []
    }
  }

  async getKalshiMarket(ticker: string): Promise<PredictionMarket | null> {
    try {
      const response = await kalshiApi.get(`/markets/${ticker}`)
      const markets = this.normalizeKalshiMarkets([response.data.market])
      return markets[0] || null
    } catch (error) {
      console.error('Error fetching Kalshi market:', error)
      return null
    }
  }

  // Combined methods
  async getAllSportsMarkets(): Promise<PredictionMarket[]> {
    const [polymarkets, kalshiMarkets] = await Promise.all([
      this.getPolymarketSportsMarkets(),
      this.getKalshiMarkets('SPORTS'),
    ])
    
    return [...polymarkets, ...kalshiMarkets].sort((a, b) => b.volume - a.volume)
  }

  async getTrendingMarkets(timeframe: '1h' | '24h' | '7d' = '24h'): Promise<MarketTrend[]> {
    // Get markets and calculate trends
    const markets = await this.getAllSportsMarkets()
    
    // TODO: Implement historical price tracking for trend calculation
    // For now, return mock trends based on available data
    return markets.slice(0, 20).map(market => ({
      marketId: market.id,
      question: market.question,
      platform: market.platform,
      priceChange: market.priceChange24h || 0,
      volumeChange: 0,
      timeframe,
      currentPrice: market.outcomes[0]?.price || 50,
      previousPrice: (market.outcomes[0]?.price || 50) - (market.priceChange24h || 0),
    }))
  }

  async getBiggestMovers(limit: number = 10): Promise<MarketTrend[]> {
    const trends = await this.getTrendingMarkets('24h')
    return trends
      .sort((a, b) => Math.abs(b.priceChange) - Math.abs(a.priceChange))
      .slice(0, limit)
  }

  // Normalization helpers
  private normalizePolymarketMarkets(markets: unknown[]): PredictionMarket[] {
    return markets.map((market: unknown) => {
      const m = market as Record<string, unknown>
      const outcomes = (m.tokens as unknown[]) || []
      
      return {
        id: String(m.condition_id || m.id),
        platform: 'polymarket' as const,
        question: String(m.question || ''),
        category: String((m.tags as string[])?.[0] || 'general'),
        endDate: String(m.end_date_iso || ''),
        volume: Number(m.volume) || 0,
        liquidity: Number(m.liquidity) || 0,
        outcomes: outcomes.map((o: unknown) => {
          const outcome = o as Record<string, unknown>
          return {
            id: String(outcome.token_id || ''),
            name: String(outcome.outcome || ''),
            price: Number(outcome.price || 0) * 100,
            volume: Number(outcome.volume) || 0,
          }
        }),
        recentTrend: this.calculateTrend(m),
        priceChange24h: Number(m.price_change_24h) || 0,
      }
    })
  }

  private normalizeKalshiMarkets(markets: unknown[]): PredictionMarket[] {
    return markets.map((market: unknown) => {
      const m = market as Record<string, unknown>
      
      return {
        id: String(m.ticker),
        platform: 'kalshi' as const,
        question: String(m.title || ''),
        category: String(m.category || 'general'),
        endDate: String(m.close_time || ''),
        volume: Number(m.volume) || 0,
        outcomes: [
          {
            id: `${m.ticker}-yes`,
            name: 'Yes',
            price: Number(m.yes_bid) || 50,
          },
          {
            id: `${m.ticker}-no`,
            name: 'No',
            price: 100 - (Number(m.yes_bid) || 50),
          },
        ],
        recentTrend: this.calculateTrend(m),
        priceChange24h: Number(m.price_change_24h) || 0,
      }
    })
  }

  private calculateTrend(market: Record<string, unknown>): 'up' | 'down' | 'stable' {
    const change = Number(market.price_change_24h) || 0
    if (change > 2) return 'up'
    if (change < -2) return 'down'
    return 'stable'
  }
}

export const marketsClient = new PredictionMarketsClient()
