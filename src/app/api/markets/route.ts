/**
 * Prediction Markets API
 * 
 * Fetches real market data from Polymarket and Kalshi
 * GET /api/markets?category=sports&platform=polymarket
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export interface PredictionMarket {
  id: string
  platform: 'polymarket' | 'kalshi'
  category: string
  title: string
  description: string
  yesPrice: number
  noPrice: number
  volume24h: number
  liquidity: number
  endDate: string
  resolved: boolean
  outcome: string | null
  change24h: number
  trending: boolean
}

// Polymarket GraphQL endpoint
const POLYMARKET_API = 'https://clob.polymarket.com/markets'
const KALSHI_API = 'https://trading-api.kalshi.com/v2/markets'

interface PolymarketMarket {
  condition_id: string
  question: string
  description: string
  tokens: Array<{ outcome: string; price?: number }>
  tags?: string[]
  end_date_iso: string
  active: boolean
  closed: boolean
}

interface KalshiMarket {
  ticker: string
  title: string
  subtitle: string
  yes_bid: number
  yes_ask: number
  no_bid: number
  no_ask: number
  volume: number
  open_interest: number
  close_time: string
  category: string
  status: string
}

async function fetchPolymarketMarkets(category?: string): Promise<PredictionMarket[]> {
  try {
    // Note: Polymarket's public API is limited. In production, use their CLOB API
    const res = await fetch(POLYMARKET_API, {
      headers: {
        'Accept': 'application/json',
      },
      next: { revalidate: 300 }, // Cache for 5 minutes
    })
    
    if (!res.ok) {
      console.error('Polymarket API error:', res.status)
      return []
    }
    
    const response = await res.json()
    // Polymarket returns { data: [...], count, limit, next_cursor }
    const data: PolymarketMarket[] = response.data || response || []
    
    if (!Array.isArray(data)) {
      console.error('Polymarket returned non-array data:', typeof data)
      return []
    }
    
    // Extract category from tags if available
    const getCategory = (tags?: string[]): string => {
      if (!tags?.length) return 'other'
      const sportsTags = ['sports', 'nfl', 'nba', 'mlb', 'nhl', 'ncaa']
      const tag = tags.find(t => sportsTags.includes(t.toLowerCase()))
      return tag?.toLowerCase() || tags[0]?.toLowerCase() || 'other'
    }
    
    return data
      .filter(m => {
        if (!category) return true
        const marketCategory = getCategory(m.tags)
        return marketCategory.toLowerCase() === category.toLowerCase()
      })
      .slice(0, 50)
      .map(m => ({
        id: `polymarket-${m.condition_id}`,
        platform: 'polymarket' as const,
        category: getCategory(m.tags),
        title: m.question,
        description: m.description || '',
        yesPrice: m.tokens?.[0]?.price || 0.5,
        noPrice: m.tokens?.[1]?.price || 0.5,
        volume24h: 0, // Not directly available in this endpoint
        liquidity: 0,
        endDate: m.end_date_iso,
        resolved: m.closed,
        outcome: null,
        change24h: 0,
        trending: false,
      }))
  } catch (error) {
    console.error('Failed to fetch Polymarket markets:', error)
    return []
  }
}

async function fetchKalshiMarkets(category?: string): Promise<PredictionMarket[]> {
  try {
    // Kalshi requires authentication for most endpoints
    // Using public markets endpoint
    const res = await fetch(`${KALSHI_API}?status=open&limit=50`, {
      headers: {
        'Accept': 'application/json',
      },
      next: { revalidate: 300 },
    })
    
    if (!res.ok) {
      console.error('Kalshi API error:', res.status)
      return []
    }
    
    const data = await res.json()
    const markets: KalshiMarket[] = data.markets || []
    
    return markets
      .filter(m => !category || m.category?.toLowerCase() === category.toLowerCase())
      .map(m => ({
        id: `kalshi-${m.ticker}`,
        platform: 'kalshi' as const,
        category: m.category || 'other',
        title: m.title,
        description: m.subtitle || '',
        yesPrice: (m.yes_bid + m.yes_ask) / 2 / 100,
        noPrice: (m.no_bid + m.no_ask) / 2 / 100,
        volume24h: m.volume || 0,
        liquidity: m.open_interest || 0,
        endDate: m.close_time,
        resolved: m.status === 'settled',
        outcome: null,
        change24h: 0,
        trending: m.volume > 10000,
      }))
  } catch (error) {
    console.error('Failed to fetch Kalshi markets:', error)
    return []
  }
}

// Get cached markets from Supabase
async function getCachedMarkets(
  category?: string,
  platform?: string
): Promise<PredictionMarket[]> {
  try {
    const supabase = await createClient()
    
    let query = supabase
      .from('historical_prediction_markets')
      .select('*')
      .order('last_price_update', { ascending: false })
      .limit(100)
    
    if (category && category !== 'all') {
      query = query.eq('category', category)
    }
    if (platform && platform !== 'all') {
      query = query.eq('platform', platform)
    }
    
    const { data, error } = await query
    
    if (error) throw error
    
    return (data || []).map(m => ({
      id: m.market_id,
      platform: m.platform as 'polymarket' | 'kalshi',
      category: m.category,
      title: m.market_title,
      description: m.market_description || '',
      yesPrice: m.current_yes_price || 0.5,
      noPrice: m.current_no_price || 0.5,
      volume24h: m.volume_24h || 0,
      liquidity: m.liquidity || 0,
      endDate: m.end_date,
      resolved: m.resolution_status === 'resolved',
      outcome: m.resolution_outcome,
      change24h: m.price_change_24h || 0,
      trending: m.is_trending || false,
    }))
  } catch (error) {
    console.error('Failed to fetch cached markets:', error)
    return []
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const category = searchParams.get('category')
  const platform = searchParams.get('platform')
  const refresh = searchParams.get('refresh') === 'true'
  
  try {
    let markets: PredictionMarket[] = []
    
    // If refresh requested, fetch from APIs
    if (refresh) {
      const [polymarkets, kalshiMarkets] = await Promise.all([
        platform !== 'kalshi' ? fetchPolymarketMarkets(category || undefined) : [],
        platform !== 'polymarket' ? fetchKalshiMarkets(category || undefined) : [],
      ])
      
      markets = [...polymarkets, ...kalshiMarkets]
    } else {
      // Use cached data from Supabase
      markets = await getCachedMarkets(category || undefined, platform || undefined)
      
      // If no cached data, fetch live
      if (markets.length === 0) {
        const [polymarkets, kalshiMarkets] = await Promise.all([
          platform !== 'kalshi' ? fetchPolymarketMarkets(category || undefined) : [],
          platform !== 'polymarket' ? fetchKalshiMarkets(category || undefined) : [],
        ])
        
        markets = [...polymarkets, ...kalshiMarkets]
      }
    }
    
    // Sort by volume
    markets.sort((a, b) => b.volume24h - a.volume24h)
    
    // Aggregate stats
    const stats = {
      total: markets.length,
      byPlatform: {
        polymarket: markets.filter(m => m.platform === 'polymarket').length,
        kalshi: markets.filter(m => m.platform === 'kalshi').length,
      },
      totalVolume: markets.reduce((sum, m) => sum + m.volume24h, 0),
      trending: markets.filter(m => m.trending).length,
    }
    
    return NextResponse.json({
      markets,
      stats,
      lastUpdated: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Markets API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch markets' },
      { status: 500 }
    )
  }
}
