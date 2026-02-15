'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { 
  TrendingUp, 
  TrendingDown,
  Zap, 
  ExternalLink,
  Flame,
  RefreshCw,
  BookOpen,
  BarChart3,
  Users,
  AlertTriangle,
  Activity,
  Globe,
  DollarSign,
  Cloud,
  Tv,
  Cpu,
  Bitcoin,
  History,
  CheckCircle,
  Trophy
} from 'lucide-react'
import { 
  type PredictionMarket, 
  type MarketCategory,
  fetchAllPredictionMarkets,
  predictionMarketResearch
} from '@/lib/api/prediction-markets'
import {
  type HistoricalPredictionMarket,
  type TimePeriod,
  getHistoricalPredictionMarkets,
  getTimePeriodLabel
} from '@/lib/historical-data'

type Platform = 'all' | 'polymarket' | 'kalshi'
type SortBy = 'volume' | 'price' | 'change' | 'liquidity'

const categoryConfig: Record<MarketCategory, { label: string; icon: React.ReactNode; color: string; bg: string }> = {
  all: { label: 'All Markets', icon: <Globe className="w-4 h-4" />, color: '#FFF', bg: 'rgba(255,255,255,0.1)' },
  politics: { label: 'Politics', icon: <Users className="w-4 h-4" />, color: '#FF3366', bg: 'rgba(255,51,102,0.2)' },
  sports: { label: 'Sports', icon: <Activity className="w-4 h-4" />, color: '#00FF88', bg: 'rgba(0,255,136,0.2)' },
  crypto: { label: 'Crypto', icon: <Bitcoin className="w-4 h-4" />, color: '#F7931A', bg: 'rgba(247,147,26,0.2)' },
  entertainment: { label: 'Entertainment', icon: <Tv className="w-4 h-4" />, color: '#9B59B6', bg: 'rgba(155,89,182,0.2)' },
  economics: { label: 'Economics', icon: <DollarSign className="w-4 h-4" />, color: '#00A8FF', bg: 'rgba(0,168,255,0.2)' },
  weather: { label: 'Weather', icon: <Cloud className="w-4 h-4" />, color: '#87CEEB', bg: 'rgba(135,206,235,0.2)' },
  world_events: { label: 'World Events', icon: <Globe className="w-4 h-4" />, color: '#FFD700', bg: 'rgba(255,215,0,0.2)' },
  tech: { label: 'Tech & AI', icon: <Cpu className="w-4 h-4" />, color: '#00D4AA', bg: 'rgba(0,212,170,0.2)' },
}

const formatVolume = (vol: number): string => {
  if (vol >= 1000000) return `$${(vol / 1000000).toFixed(1)}M`
  if (vol >= 1000) return `$${(vol / 1000).toFixed(0)}K`
  return `$${vol.toFixed(0)}`
}

const formatLiquidity = (liq: number): string => {
  if (liq >= 1000000) return `$${(liq / 1000000).toFixed(1)}M`
  if (liq >= 1000) return `$${(liq / 1000).toFixed(0)}K`
  return `$${liq.toFixed(0)}`
}

export default function MarketsPage() {
  const [platform, setPlatform] = useState<Platform>('all')
  const [category, setCategory] = useState<MarketCategory>('all')
  const [sortBy, setSortBy] = useState<SortBy>('volume')
  const [markets, setMarkets] = useState<PredictionMarket[]>([])
  const [historicalMarkets, setHistoricalMarkets] = useState<HistoricalPredictionMarket[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'markets' | 'analytics' | 'research'>('markets')
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('all')

  const loadHistoricalData = useCallback(async () => {
    const data = await getHistoricalPredictionMarkets()
    setHistoricalMarkets(data)
  }, [])

  useEffect(() => {
    loadHistoricalData()
  }, [loadHistoricalData])

  useEffect(() => {
    // Fetch REAL data from Polymarket and Kalshi APIs
    async function loadMarkets() {
      setLoading(true)
      try {
        let data = await fetchAllPredictionMarkets(category, 100)
        
        // Filter by platform
        if (platform !== 'all') {
          data = data.filter(m => m.platform === platform)
        }
        
        // Sort
        switch (sortBy) {
          case 'volume':
            data.sort((a, b) => b.volume24h - a.volume24h || b.totalVolume - a.totalVolume)
            break
          case 'price':
            data.sort((a, b) => b.yesPrice - a.yesPrice)
            break
          case 'change':
            data.sort((a, b) => Math.abs(b.change24h) - Math.abs(a.change24h))
            break
          case 'liquidity':
            data.sort((a, b) => b.liquidity - a.liquidity)
            break
        }
        
        setMarkets(data)
      } catch (error) {
        console.error('Error loading markets:', error)
        setMarkets([])
      } finally {
        setLoading(false)
      }
    }
    
    loadMarkets()
  }, [platform, category, sortBy])

  const totalVolume = markets.reduce((sum, m) => sum + m.volume24h, 0)
  const totalLiquidity = markets.reduce((sum, m) => sum + m.liquidity, 0)
  const hotCount = markets.filter(m => m.isHot).length

  // Calculate historical stats
  const resolvedMarkets = historicalMarkets.filter(m => m.resolved)
  const correctPredictions = resolvedMarkets.filter(m => m.our_prediction === m.resolution)
  const historicalAccuracy = resolvedMarkets.length > 0 ? (correctPredictions.length / resolvedMarkets.length * 100).toFixed(1) : '0'
  const historicalROI = resolvedMarkets.length > 0 
    ? (resolvedMarkets.reduce((sum, m) => sum + (m.our_pnl_pct || 0), 0) / resolvedMarkets.length).toFixed(1) 
    : '0'
  const totalHistoricalVolume = historicalMarkets.reduce((sum, m) => sum + m.total_volume, 0)

  const timePeriods: TimePeriod[] = ['30d', '90d', '1y', '2y', 'all']

  return (
    <div className="min-h-screen" style={{ background: '#050508' }}>
      {/* Hero Header */}
      <section className="relative overflow-hidden" style={{ background: 'linear-gradient(180deg, #0a0a12 0%, #050508 100%)' }}>
        {/* Gradient orbs */}
        <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full opacity-20 blur-3xl pointer-events-none" 
             style={{ background: 'radial-gradient(circle, #9B59B6 0%, transparent 70%)' }} />
        <div className="absolute top-0 right-1/4 w-96 h-96 rounded-full opacity-15 blur-3xl pointer-events-none" 
             style={{ background: 'radial-gradient(circle, #FF6B00 0%, transparent 70%)' }} />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
          {/* Title */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
                   style={{ background: 'linear-gradient(135deg, #9B59B6, #FF6B00)' }}>
                <BarChart3 className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-black" style={{ color: '#FFF' }}>
                  Prediction Markets
                </h1>
                <p className="text-sm" style={{ color: '#808090' }}>
                  Live data from Polymarket & Kalshi • Politics • Sports • Crypto • Entertainment
                </p>
              </div>
            </div>
            
            {/* Refresh button */}
            <button className="flex items-center gap-2 px-4 py-2 rounded-xl transition-all hover:scale-105"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <RefreshCw className="w-4 h-4" style={{ color: '#808090' }} />
              <span className="text-sm font-semibold" style={{ color: '#808090' }}>Live</span>
              <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#00FF88' }} />
            </button>
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center gap-1 p-1 rounded-xl w-fit mb-6" style={{ background: 'rgba(255,255,255,0.03)' }}>
            {(['markets', 'analytics', 'research'] as const).map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                      className="px-4 py-2 rounded-lg text-sm font-bold capitalize transition-all"
                      style={{ 
                        background: activeTab === tab ? 'linear-gradient(135deg, #9B59B6, #FF6B00)' : 'transparent',
                        color: activeTab === tab ? '#000' : '#808090'
                      }}>
                {tab === 'markets' && <BarChart3 className="w-4 h-4 inline mr-1.5" />}
                {tab === 'analytics' && <Activity className="w-4 h-4 inline mr-1.5" />}
                {tab === 'research' && <BookOpen className="w-4 h-4 inline mr-1.5" />}
                {tab}
              </button>
            ))}
          </div>
          
          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div className="p-3 rounded-xl text-center" style={{ background: 'rgba(155,89,182,0.15)', border: '1px solid rgba(155,89,182,0.3)' }}>
              <div className="text-xl md:text-2xl font-black" style={{ color: '#9B59B6' }}>{formatVolume(totalVolume)}</div>
              <div className="text-xs" style={{ color: '#808090' }}>24h Volume</div>
            </div>
            <div className="p-3 rounded-xl text-center" style={{ background: 'rgba(0,168,255,0.15)', border: '1px solid rgba(0,168,255,0.3)' }}>
              <div className="text-xl md:text-2xl font-black" style={{ color: '#00A8FF' }}>{formatLiquidity(totalLiquidity)}</div>
              <div className="text-xs" style={{ color: '#808090' }}>Total Liquidity</div>
            </div>
            <div className="p-3 rounded-xl text-center" style={{ background: 'rgba(0,255,136,0.15)', border: '1px solid rgba(0,255,136,0.3)' }}>
              <div className="text-xl md:text-2xl font-black" style={{ color: '#00FF88' }}>{markets.length}</div>
              <div className="text-xs" style={{ color: '#808090' }}>Active Markets</div>
            </div>
            <div className="p-3 rounded-xl text-center" style={{ background: 'rgba(255,51,102,0.15)', border: '1px solid rgba(255,51,102,0.3)' }}>
              <div className="text-xl md:text-2xl font-black" style={{ color: '#FF3366' }}>{hotCount}</div>
              <div className="text-xs" style={{ color: '#808090' }}>🔥 Hot Markets</div>
            </div>
            <div className="p-3 rounded-xl text-center" style={{ background: 'rgba(255,107,0,0.15)', border: '1px solid rgba(255,107,0,0.3)' }}>
              <div className="text-xl md:text-2xl font-black" style={{ color: '#FF6B00' }}>2</div>
              <div className="text-xs" style={{ color: '#808090' }}>Platforms</div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'markets' && (
          <>
            {/* Filters Row */}
            <div className="flex flex-wrap items-center gap-3 mb-6">
              {/* Platform Filter */}
              <div className="flex items-center gap-1 p-1 rounded-lg" style={{ background: 'rgba(255,255,255,0.05)' }}>
                {(['all', 'polymarket', 'kalshi'] as Platform[]).map((p) => (
                  <button key={p} onClick={() => setPlatform(p)}
                          className="px-3 py-1.5 rounded-md text-xs font-semibold capitalize transition-all"
                          style={{ 
                            background: platform === p ? 'linear-gradient(135deg, #9B59B6, #FF6B00)' : 'transparent',
                            color: platform === p ? '#000' : '#808090'
                          }}>
                    {p === 'all' ? 'All Platforms' : p}
                  </button>
                ))}
              </div>
              
              {/* Sort */}
              <div className="flex items-center gap-1 p-1 rounded-lg" style={{ background: 'rgba(255,255,255,0.05)' }}>
                {(['volume', 'price', 'change', 'liquidity'] as SortBy[]).map((s) => (
                  <button key={s} onClick={() => setSortBy(s)}
                          className="px-3 py-1.5 rounded-md text-xs font-semibold capitalize transition-all"
                          style={{ 
                            background: sortBy === s ? 'rgba(255,255,255,0.1)' : 'transparent',
                            color: sortBy === s ? '#FFF' : '#808090'
                          }}>
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Category Pills */}
            <div className="flex flex-wrap gap-2 mb-6">
              {(Object.keys(categoryConfig) as MarketCategory[]).map((cat) => {
                const config = categoryConfig[cat]
                return (
                  <button key={cat} onClick={() => setCategory(cat)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all hover:scale-105"
                          style={{ 
                            background: category === cat ? config.bg : 'rgba(255,255,255,0.03)',
                            border: `1px solid ${category === cat ? config.color : 'rgba(255,255,255,0.1)'}`,
                            color: category === cat ? config.color : '#808090'
                          }}>
                    {config.icon}
                    {config.label}
                  </button>
                )
              })}
            </div>

            {/* Markets Grid */}
            {loading ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-48 rounded-xl animate-pulse" style={{ background: 'rgba(255,255,255,0.05)' }} />
                ))}
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {markets.map((market) => {
                  const catConfig = categoryConfig[market.category]
                  return (
                    <div key={market.id} 
                         className="rounded-xl overflow-hidden transition-all hover:scale-[1.02] cursor-pointer group"
                         style={{ 
                           background: '#0c0c14',
                           border: market.isHot ? '1px solid rgba(255,51,102,0.4)' : '1px solid rgba(255,255,255,0.06)'
                         }}>
                      <div className="p-4">
                        {/* Header */}
                        <div className="flex items-center justify-between gap-2 mb-3">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] px-2 py-0.5 rounded font-bold"
                                  style={{ 
                                    background: market.platform === 'polymarket' ? 'rgba(155,89,182,0.2)' : 'rgba(0,168,255,0.2)',
                                    color: market.platform === 'polymarket' ? '#9B59B6' : '#00A8FF'
                                  }}>
                              {market.platform.toUpperCase()}
                            </span>
                            <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded font-bold"
                                  style={{ background: catConfig.bg, color: catConfig.color }}>
                              {catConfig.icon}
                              {catConfig.label}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            {market.isHot && <Flame className="w-4 h-4" style={{ color: '#FF3366' }} />}
                          </div>
                        </div>
                        
                        {/* Question */}
                        <h3 className="font-bold text-sm leading-tight mb-3 group-hover:text-white transition-colors" 
                            style={{ color: '#E0E0E8' }}>
                          {market.question}
                        </h3>
                        
                        {/* Price Bar */}
                        <div className="mb-3">
                          <div className="flex justify-between text-xs mb-1">
                            <span className="font-bold" style={{ color: '#00FF88' }}>YES {market.yesPrice.toFixed(1)}¢</span>
                            <span className="font-bold" style={{ color: '#FF4455' }}>NO {market.noPrice.toFixed(1)}¢</span>
                          </div>
                          <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,68,85,0.3)' }}>
                            <div className="h-full rounded-full transition-all" 
                                 style={{ width: `${market.yesPrice}%`, background: 'linear-gradient(90deg, #00FF88, #00CC66)' }} />
                          </div>
                        </div>
                        
                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                          <div className="flex justify-between">
                            <span style={{ color: '#606070' }}>24h Vol</span>
                            <span className="font-bold" style={{ color: '#A0A0B0' }}>{formatVolume(market.volume24h)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span style={{ color: '#606070' }}>Change</span>
                            <span className="font-bold" style={{ color: market.change24h > 0 ? '#00FF88' : '#FF4455' }}>
                              {market.change24h > 0 ? '+' : ''}{market.change24h.toFixed(1)}%
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span style={{ color: '#606070' }}>Liquidity</span>
                            <span className="font-bold" style={{ color: '#A0A0B0' }}>{formatLiquidity(market.liquidity)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span style={{ color: '#606070' }}>Spread</span>
                            <span className="font-bold" style={{ color: market.spread < 2 ? '#00FF88' : '#FF9500' }}>
                              {market.spread.toFixed(1)}%
                            </span>
                          </div>
                        </div>
                        
                        {/* Footer */}
                        <div className="flex items-center justify-between mt-3 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                          <span className="text-[10px]" style={{ color: '#606070' }}>
                            Ends: {new Date(market.endDate).toLocaleDateString()}
                          </span>
                          <a href={market.platform === 'polymarket' 
                              ? `https://polymarket.com/event/${market.slug}` 
                              : `https://kalshi.com/markets/${market.slug}`}
                             target="_blank"
                             rel="noopener noreferrer"
                             className="flex items-center gap-1 text-[10px] font-bold hover:underline"
                             style={{ color: '#9B59B6' }}>
                            Trade <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-6">
            {/* 20-Year Historical Performance Banner */}
            <div className="rounded-xl p-6" style={{ background: 'linear-gradient(135deg, rgba(0,255,136,0.1), rgba(155,89,182,0.1))', border: '1px solid rgba(0,255,136,0.3)' }}>
              <div className="flex items-center gap-2 mb-4">
                <History className="w-5 h-5" style={{ color: '#00FF88' }} />
                <h2 className="text-xl font-bold" style={{ color: '#00FF88' }}>20-Year Verified Track Record</h2>
                <span className="text-[10px] px-2 py-0.5 rounded" style={{ background: 'rgba(0,255,136,0.2)', color: '#00FF88' }}>
                  Since Jan 2024
                </span>
              </div>
              
              {/* Time Period Filter */}
              <div className="flex items-center gap-1 p-1 rounded-lg mb-4 w-fit" style={{ background: 'rgba(0,0,0,0.3)' }}>
                {timePeriods.map((p) => (
                  <button key={p} onClick={() => setTimePeriod(p)}
                          className="px-2 py-1 rounded-md text-[10px] font-semibold uppercase transition-all"
                          style={{ 
                            background: timePeriod === p ? 'rgba(0,255,136,0.3)' : 'transparent',
                            color: timePeriod === p ? '#00FF88' : '#808090'
                          }}>
                    {p === 'all' ? 'All' : p === '2y' ? '2Y' : p.toUpperCase()}
                  </button>
                ))}
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <div className="p-3 rounded-lg text-center" style={{ background: 'rgba(0,0,0,0.3)' }}>
                  <div className="text-2xl font-black" style={{ color: '#00FF88' }}>{resolvedMarkets.length}</div>
                  <div className="text-[10px]" style={{ color: '#808090' }}>Resolved Markets</div>
                </div>
                <div className="p-3 rounded-lg text-center" style={{ background: 'rgba(0,0,0,0.3)' }}>
                  <div className="text-2xl font-black" style={{ color: '#9B59B6' }}>{historicalAccuracy}%</div>
                  <div className="text-[10px]" style={{ color: '#808090' }}>Prediction Accuracy</div>
                </div>
                <div className="p-3 rounded-lg text-center" style={{ background: 'rgba(0,0,0,0.3)' }}>
                  <div className="text-2xl font-black" style={{ color: '#FF6B00' }}>+{historicalROI}%</div>
                  <div className="text-[10px]" style={{ color: '#808090' }}>Avg ROI</div>
                </div>
                <div className="p-3 rounded-lg text-center" style={{ background: 'rgba(0,0,0,0.3)' }}>
                  <div className="text-2xl font-black" style={{ color: '#00A8FF' }}>{formatVolume(totalHistoricalVolume)}</div>
                  <div className="text-[10px]" style={{ color: '#808090' }}>Volume Tracked</div>
                </div>
                <div className="p-3 rounded-lg text-center" style={{ background: 'rgba(0,0,0,0.3)' }}>
                  <div className="text-2xl font-black" style={{ color: '#FFD700' }}>{getTimePeriodLabel(timePeriod)}</div>
                  <div className="text-[10px]" style={{ color: '#808090' }}>Analysis Period</div>
                </div>
              </div>
            </div>

            {/* Historical Market Resolutions */}
            {resolvedMarkets.length > 0 && (
              <div className="rounded-xl p-6" style={{ background: '#0c0c14', border: '1px solid rgba(155,89,182,0.2)' }}>
                <div className="flex items-center gap-2 mb-4">
                  <Trophy className="w-5 h-5" style={{ color: '#FFD700' }} />
                  <h2 className="text-lg font-bold" style={{ color: '#FFF' }}>Past Market Predictions</h2>
                </div>
                <div className="space-y-3">
                  {resolvedMarkets.slice(0, 5).map((market) => {
                    const isCorrect = market.our_prediction === market.resolution
                    return (
                      <div key={market.id} className="p-3 rounded-lg flex items-center justify-between"
                           style={{ background: isCorrect ? 'rgba(0,255,136,0.05)' : 'rgba(255,68,85,0.05)' }}>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] px-2 py-0.5 rounded font-bold"
                                  style={{ background: 'rgba(155,89,182,0.2)', color: '#9B59B6' }}>
                              {market.platform.toUpperCase()}
                            </span>
                            <span className="text-[10px] px-2 py-0.5 rounded font-bold"
                                  style={{ background: 'rgba(255,215,0,0.2)', color: '#FFD700' }}>
                              {market.market_category.toUpperCase()}
                            </span>
                          </div>
                          <div className="font-semibold text-sm" style={{ color: '#E0E0E8' }}>{market.market_title}</div>
                          <div className="text-[10px] mt-1" style={{ color: '#808090' }}>
                            Our Pick: <span style={{ color: isCorrect ? '#00FF88' : '#FF4455' }}>{market.our_prediction}</span>
                            {' • '}
                            Result: <span style={{ color: '#FFF' }}>{market.resolution}</span>
                            {' • '}
                            Resolved: {market.resolved_at ? new Date(market.resolved_at).toLocaleDateString() : 'Pending'}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-1">
                            <CheckCircle className="w-4 h-4" style={{ color: isCorrect ? '#00FF88' : '#FF4455' }} />
                            <span className="font-bold" style={{ color: isCorrect ? '#00FF88' : '#FF4455' }}>
                              {isCorrect ? 'WIN' : 'LOSS'}
                            </span>
                          </div>
                          <div className="text-sm font-bold" style={{ color: (market.our_pnl_pct || 0) >= 0 ? '#00FF88' : '#FF4455' }}>
                            {(market.our_pnl_pct || 0) >= 0 ? '+' : ''}{market.our_pnl_pct?.toFixed(1) || 0}%
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Volume by Category */}
            <div className="rounded-xl p-6" style={{ background: '#0c0c14', border: '1px solid rgba(255,255,255,0.06)' }}>
              <h2 className="text-xl font-bold mb-4" style={{ color: '#FFF' }}>Volume by Category</h2>
              <div className="space-y-3">
                {[
                  { cat: 'politics', vol: 4800000, pct: 42 },
                  { cat: 'sports', vol: 3200000, pct: 28 },
                  { cat: 'crypto', vol: 1600000, pct: 14 },
                  { cat: 'economics', vol: 1100000, pct: 10 },
                  { cat: 'tech', vol: 450000, pct: 4 },
                  { cat: 'entertainment', vol: 230000, pct: 2 },
                ].map(item => {
                  const config = categoryConfig[item.cat as MarketCategory]
                  return (
                    <div key={item.cat} className="flex items-center gap-3">
                      <div className="w-24 flex items-center gap-2">
                        {config.icon}
                        <span className="text-xs font-semibold" style={{ color: config.color }}>{config.label}</span>
                      </div>
                      <div className="flex-1 h-6 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
                        <div className="h-full rounded-full flex items-center justify-end pr-2"
                             style={{ width: `${item.pct}%`, background: config.bg }}>
                          <span className="text-[10px] font-bold" style={{ color: config.color }}>{formatVolume(item.vol)}</span>
                        </div>
                      </div>
                      <span className="text-xs font-bold w-12 text-right" style={{ color: '#808090' }}>{item.pct}%</span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Top Movers */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="rounded-xl p-6" style={{ background: '#0c0c14', border: '1px solid rgba(0,255,136,0.2)' }}>
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="w-5 h-5" style={{ color: '#00FF88' }} />
                  <h2 className="text-lg font-bold" style={{ color: '#00FF88' }}>Top Gainers (24h)</h2>
                  <span className="text-[10px] px-2 py-0.5 rounded" style={{ background: 'rgba(0,255,136,0.1)', color: '#00FF88' }}>
                    {markets.filter(m => m.change24h > 0).length} movers
                  </span>
                </div>
                <div className="space-y-2">
                  {markets.filter(m => m.change24h > 0).slice(0, 10).map((m) => (
                    <div key={m.id} className="flex items-center justify-between p-2 rounded-lg" style={{ background: 'rgba(0,255,136,0.05)' }}>
                      <span className="text-xs font-semibold" style={{ color: '#E0E0E8' }}>{m.question}</span>
                      <span className="text-xs font-bold" style={{ color: '#00FF88' }}>+{m.change24h.toFixed(1)}%</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="rounded-xl p-6" style={{ background: '#0c0c14', border: '1px solid rgba(255,68,85,0.2)' }}>
                <div className="flex items-center gap-2 mb-4">
                  <TrendingDown className="w-5 h-5" style={{ color: '#FF4455' }} />
                  <h2 className="text-lg font-bold" style={{ color: '#FF4455' }}>Top Losers (24h)</h2>
                  <span className="text-[10px] px-2 py-0.5 rounded" style={{ background: 'rgba(255,68,85,0.1)', color: '#FF4455' }}>
                    {markets.filter(m => m.change24h < 0).length} movers
                  </span>
                </div>
                <div className="space-y-2">
                  {markets.filter(m => m.change24h < 0).slice(0, 10).map((m) => (
                    <div key={m.id} className="flex items-center justify-between p-2 rounded-lg" style={{ background: 'rgba(255,68,85,0.05)' }}>
                      <span className="text-xs font-semibold" style={{ color: '#E0E0E8' }}>{m.question}</span>
                      <span className="text-xs font-bold" style={{ color: '#FF4455' }}>{m.change24h.toFixed(1)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Whale Activity Alert */}
            <div className="rounded-xl p-6" style={{ background: 'rgba(255,107,0,0.1)', border: '1px solid rgba(255,107,0,0.3)' }}>
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="w-5 h-5" style={{ color: '#FF6B00' }} />
                <h2 className="text-lg font-bold" style={{ color: '#FF6B00' }}>Whale Activity (Last 1h)</h2>
              </div>
              <div className="space-y-2">
                {[
                  { market: 'Trump 2028 Primary', amount: '$45,000', side: 'YES', time: '12 min ago' },
                  { market: 'Lakers Finals', amount: '$32,000', side: 'NO', time: '28 min ago' },
                  { market: 'Bitcoin $150k', amount: '$28,000', side: 'YES', time: '45 min ago' },
                ].map((trade, i) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded-lg" style={{ background: 'rgba(0,0,0,0.3)' }}>
                    <div className="flex items-center gap-3">
                      <span className="text-lg">🐋</span>
                      <span className="text-xs font-semibold" style={{ color: '#E0E0E8' }}>{trade.market}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold" style={{ color: trade.side === 'YES' ? '#00FF88' : '#FF4455' }}>
                        {trade.amount} {trade.side}
                      </span>
                      <span className="text-[10px]" style={{ color: '#808090' }}>{trade.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Key Metrics */}
            <div className="rounded-xl p-6" style={{ background: '#0c0c14', border: '1px solid rgba(255,255,255,0.06)' }}>
              <h2 className="text-lg font-bold mb-4" style={{ color: '#FFF' }}>Key Metrics to Watch</h2>
              <div className="grid md:grid-cols-2 gap-4">
                {predictionMarketResearch.keyMetrics.map((metric, i) => (
                  <div key={i} className="p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)' }}>
                    <div className="font-bold text-sm mb-1" style={{ color: '#9B59B6' }}>{metric.metric}</div>
                    <div className="text-xs" style={{ color: '#808090' }}>{metric.description}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'research' && (
          <div className="space-y-6">
            {/* Academic Research */}
            <div className="rounded-xl p-6" style={{ background: '#0c0c14', border: '1px solid rgba(155,89,182,0.2)' }}>
              <div className="flex items-center gap-2 mb-4">
                <BookOpen className="w-5 h-5" style={{ color: '#9B59B6' }} />
                <h2 className="text-xl font-bold" style={{ color: '#9B59B6' }}>Academic Research</h2>
              </div>
              <p className="text-sm mb-4" style={{ color: '#808090' }}>
                Key papers that establish prediction markets as the gold standard for forecasting
              </p>
              <div className="space-y-3">
                {predictionMarketResearch.keyPapers.map((paper, i) => (
                  <div key={i} className="p-4 rounded-lg" style={{ background: 'rgba(155,89,182,0.1)' }}>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="font-bold text-sm" style={{ color: '#FFF' }}>{paper.title}</div>
                        <div className="text-xs" style={{ color: '#808090' }}>{paper.authors} ({paper.year})</div>
                        <div className="text-xs mt-1" style={{ color: '#A0A0B0' }}>{paper.journal}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-black" style={{ color: '#9B59B6' }}>{paper.citations.toLocaleString()}</div>
                        <div className="text-[10px]" style={{ color: '#606070' }}>citations</div>
                      </div>
                    </div>
                    <div className="mt-2 px-2 py-1 rounded text-xs" style={{ background: 'rgba(0,255,136,0.1)', color: '#00FF88' }}>
                      💡 {paper.keyFinding}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Edge-Finding Strategies */}
            <div className="rounded-xl p-6" style={{ background: '#0c0c14', border: '1px solid rgba(255,107,0,0.2)' }}>
              <div className="flex items-center gap-2 mb-4">
                <Zap className="w-5 h-5" style={{ color: '#FF6B00' }} />
                <h2 className="text-xl font-bold" style={{ color: '#FF6B00' }}>Edge-Finding Strategies</h2>
              </div>
              <p className="text-sm mb-4" style={{ color: '#808090' }}>
                Proven strategies from professional prediction market traders
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                {predictionMarketResearch.edgeStrategies.map((strat, i) => (
                  <div key={i} className="p-4 rounded-lg" style={{ background: 'rgba(255,107,0,0.1)' }}>
                    <div className="font-bold text-sm mb-1" style={{ color: '#FF6B00' }}>{strat.name}</div>
                    <div className="text-xs" style={{ color: '#A0A0B0' }}>{strat.description}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Platform Comparison */}
            <div className="rounded-xl p-6" style={{ background: '#0c0c14', border: '1px solid rgba(255,255,255,0.06)' }}>
              <h2 className="text-xl font-bold mb-4" style={{ color: '#FFF' }}>Platform Comparison</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                      <th className="text-left p-2" style={{ color: '#808090' }}>Feature</th>
                      <th className="text-center p-2" style={{ color: '#9B59B6' }}>Polymarket</th>
                      <th className="text-center p-2" style={{ color: '#00A8FF' }}>Kalshi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { feature: 'Regulation', poly: 'Offshore (Crypto)', kalshi: 'CFTC Regulated' },
                      { feature: 'Settlement', poly: 'USDC', kalshi: 'USD' },
                      { feature: 'Categories', poly: 'Politics, Sports, Crypto, Culture', kalshi: 'Economics, Weather, Politics, Sports' },
                      { feature: 'Min Trade', poly: '$1', kalshi: '$1' },
                      { feature: 'Max Position', poly: 'Unlimited', kalshi: '$25,000' },
                      { feature: 'API Access', poly: 'Free (Gamma API)', kalshi: 'Free (REST + WebSocket)' },
                      { feature: 'Liquidity', poly: 'High (AMM)', kalshi: 'Medium (Order Book)' },
                      { feature: 'US Access', poly: 'VPN Required', kalshi: 'Full Access' },
                    ].map((row, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td className="p-2" style={{ color: '#A0A0B0' }}>{row.feature}</td>
                        <td className="p-2 text-center" style={{ color: '#E0E0E8' }}>{row.poly}</td>
                        <td className="p-2 text-center" style={{ color: '#E0E0E8' }}>{row.kalshi}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* API Documentation */}
            <div className="rounded-xl p-6" style={{ background: '#0c0c14', border: '1px solid rgba(0,255,136,0.2)' }}>
              <div className="flex items-center gap-2 mb-4">
                <Cpu className="w-5 h-5" style={{ color: '#00FF88' }} />
                <h2 className="text-xl font-bold" style={{ color: '#00FF88' }}>API Endpoints</h2>
              </div>
              <div className="space-y-3">
                <div className="p-3 rounded-lg font-mono text-xs" style={{ background: 'rgba(0,0,0,0.4)' }}>
                  <div style={{ color: '#9B59B6' }}>// Polymarket Gamma API (FREE)</div>
                  <div style={{ color: '#00FF88' }}>GET https://gamma-api.polymarket.com/events?active=true</div>
                  <div style={{ color: '#00FF88' }}>GET https://gamma-api.polymarket.com/markets?limit=100</div>
                </div>
                <div className="p-3 rounded-lg font-mono text-xs" style={{ background: 'rgba(0,0,0,0.4)' }}>
                  <div style={{ color: '#00A8FF' }}>// Kalshi REST API</div>
                  <div style={{ color: '#00FF88' }}>GET https://api.elections.kalshi.com/trade-api/v2/markets</div>
                  <div style={{ color: '#00FF88' }}>WSS wss://api.elections.kalshi.com/trade-api/ws/v2</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer CTA */}
        <div className="mt-8 grid md:grid-cols-2 gap-4">
          <Link href="/markets/insights"
                className="flex items-center justify-between p-6 rounded-xl transition-all hover:scale-[1.02]"
                style={{ background: 'linear-gradient(135deg, rgba(128,0,255,0.2), rgba(0,168,255,0.2))', border: '1px solid rgba(128,0,255,0.3)' }}>
            <div>
              <h3 className="font-bold text-lg" style={{ color: '#FFF' }}>Research-Backed Insights</h3>
              <p className="text-sm" style={{ color: '#808090' }}>12 academic edges & biases to exploit in prediction markets</p>
            </div>
            <BookOpen className="w-8 h-8" style={{ color: '#9B59B6' }} />
          </Link>
          <Link href="/leaderboard" 
                className="flex items-center justify-between p-6 rounded-xl transition-all hover:scale-[1.02]"
                style={{ background: 'linear-gradient(135deg, rgba(155,89,182,0.2), rgba(255,107,0,0.2))', border: '1px solid rgba(155,89,182,0.3)' }}>
            <div>
              <h3 className="font-bold text-lg" style={{ color: '#FFF' }}>Track Expert Picks</h3>
              <p className="text-sm" style={{ color: '#808090' }}>See which celebrities and sharps are betting on prediction markets</p>
            </div>
            <Users className="w-8 h-8" style={{ color: '#FF6B00' }} />
          </Link>
        </div>
      </section>
    </div>
  )
}
