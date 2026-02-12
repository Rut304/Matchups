'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  TrendingUp,
  TrendingDown,
  Flame,
  Clock,
  Users,
  DollarSign,
  ExternalLink,
  BarChart3,
  Activity,
  ChevronRight
} from 'lucide-react'

interface TrendingMarket {
  id: string
  platform: 'polymarket' | 'kalshi'
  question: string
  category: string
  yesPrice: number
  change24h: number
  volume24h: number
  volumeChange: number
  traders: number
  endDate: string
  isHot: boolean
}

// Mock trending data - will be replaced with real API
const mockTrendingMarkets: TrendingMarket[] = [
  {
    id: '1',
    platform: 'polymarket',
    question: 'Will Bitcoin reach $150K by end of 2026?',
    category: 'crypto',
    yesPrice: 0.42,
    change24h: 8.5,
    volume24h: 2500000,
    volumeChange: 45,
    traders: 12500,
    endDate: '2026-12-31',
    isHot: true
  },
  {
    id: '2',
    platform: 'polymarket',
    question: 'Will the Fed cut rates in January 2026?',
    category: 'economics',
    yesPrice: 0.68,
    change24h: -5.2,
    volume24h: 1800000,
    volumeChange: 22,
    traders: 8900,
    endDate: '2026-01-31',
    isHot: true
  },
  {
    id: '3',
    platform: 'kalshi',
    question: 'Will OpenAI release GPT-5 in Q1 2026?',
    category: 'tech',
    yesPrice: 0.35,
    change24h: 12.3,
    volume24h: 950000,
    volumeChange: 88,
    traders: 5600,
    endDate: '2026-03-31',
    isHot: true
  },
  {
    id: '4',
    platform: 'polymarket',
    question: 'Will Lakers make 2025 NBA Finals?',
    category: 'sports',
    yesPrice: 0.28,
    change24h: 3.1,
    volume24h: 3200000,
    volumeChange: 15,
    traders: 18000,
    endDate: '2025-06-15',
    isHot: true
  },
  {
    id: '5',
    platform: 'polymarket',
    question: 'Will Ethereum flip Bitcoin market cap?',
    category: 'crypto',
    yesPrice: 0.12,
    change24h: -8.9,
    volume24h: 1200000,
    volumeChange: -12,
    traders: 7800,
    endDate: '2026-12-31',
    isHot: false
  },
  {
    id: '6',
    platform: 'kalshi',
    question: 'Will unemployment exceed 5% in 2026?',
    category: 'economics',
    yesPrice: 0.22,
    change24h: 6.7,
    volume24h: 890000,
    volumeChange: 34,
    traders: 4200,
    endDate: '2026-12-31',
    isHot: true
  },
  {
    id: '7',
    platform: 'polymarket',
    question: 'Will Taylor Swift announce new album in January?',
    category: 'entertainment',
    yesPrice: 0.55,
    change24h: 15.2,
    volume24h: 1500000,
    volumeChange: 120,
    traders: 22000,
    endDate: '2026-01-31',
    isHot: true
  },
  {
    id: '8',
    platform: 'polymarket',
    question: 'Will Apple release AR glasses in 2026?',
    category: 'tech',
    yesPrice: 0.48,
    change24h: 2.1,
    volume24h: 780000,
    volumeChange: 8,
    traders: 5100,
    endDate: '2026-12-31',
    isHot: false
  }
]

const formatVolume = (vol: number): string => {
  if (vol >= 1000000) return `$${(vol / 1000000).toFixed(1)}M`
  if (vol >= 1000) return `$${(vol / 1000).toFixed(0)}K`
  return `$${vol.toFixed(0)}`
}

const categoryColors: Record<string, string> = {
  crypto: '#F7931A',
  economics: '#00A8FF',
  tech: '#00D4AA',
  sports: '#00FF88',
  entertainment: '#9B59B6',
  politics: '#FF3366'
}

export default function TrendingMarketsPage() {
  const [markets, setMarkets] = useState<TrendingMarket[]>([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState<'change' | 'volume' | 'volumeChange'>('volumeChange')

  useEffect(() => {
    // Simulate loading
    setTimeout(() => {
      let sorted = [...mockTrendingMarkets]
      switch (sortBy) {
        case 'change':
          sorted.sort((a, b) => Math.abs(b.change24h) - Math.abs(a.change24h))
          break
        case 'volume':
          sorted.sort((a, b) => b.volume24h - a.volume24h)
          break
        case 'volumeChange':
          sorted.sort((a, b) => b.volumeChange - a.volumeChange)
          break
      }
      setMarkets(sorted)
      setLoading(false)
    }, 300)
  }, [sortBy])

  const totalVolume = markets.reduce((sum, m) => sum + m.volume24h, 0)
  const avgChange = markets.reduce((sum, m) => sum + Math.abs(m.change24h), 0) / markets.length

  return (
    <div className="min-h-screen pt-20 pb-12" style={{ background: '#050508' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
              <Link href="/markets" className="hover:text-white transition-colors">Markets</Link>
              <ChevronRight className="w-4 h-4" />
              <span className="text-white">Trending</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-white flex items-center gap-3">
              <Flame className="w-8 h-8 text-orange-500" />
              Hot Markets
            </h1>
            <p className="text-gray-400 mt-1">Biggest movers and highest volume today</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-orange-500/10 to-red-500/5 border border-orange-500/20">
            <div className="text-3xl font-black text-orange-400">{formatVolume(totalVolume)}</div>
            <div className="text-sm text-gray-400">24h Volume</div>
          </div>
          <div className="p-4 rounded-2xl bg-gradient-to-br from-green-500/10 to-emerald-500/5 border border-green-500/20">
            <div className="text-3xl font-black text-green-400">{avgChange.toFixed(1)}%</div>
            <div className="text-sm text-gray-400">Avg Price Move</div>
          </div>
          <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-500/10 to-pink-500/5 border border-purple-500/20">
            <div className="text-3xl font-black text-purple-400">{markets.filter(m => m.isHot).length}</div>
            <div className="text-sm text-gray-400">Hot Markets</div>
          </div>
        </div>

        {/* Sort Options */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setSortBy('volumeChange')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              sortBy === 'volumeChange' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' : 'bg-white/5 text-gray-400 hover:bg-white/10'
            }`}
          >
            <TrendingUp className="w-4 h-4 inline mr-2" />
            Volume Change
          </button>
          <button
            onClick={() => setSortBy('change')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              sortBy === 'change' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' : 'bg-white/5 text-gray-400 hover:bg-white/10'
            }`}
          >
            <Activity className="w-4 h-4 inline mr-2" />
            Price Move
          </button>
          <button
            onClick={() => setSortBy('volume')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              sortBy === 'volume' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' : 'bg-white/5 text-gray-400 hover:bg-white/10'
            }`}
          >
            <DollarSign className="w-4 h-4 inline mr-2" />
            Total Volume
          </button>
        </div>

        {/* Markets List */}
        {loading ? (
          <div className="space-y-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-32 rounded-2xl bg-white/5 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {markets.map((market, index) => (
              <div 
                key={market.id}
                className="p-5 rounded-2xl border transition-all hover:scale-[1.01]"
                style={{
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)',
                  borderColor: market.isHot ? 'rgba(255,107,0,0.3)' : 'rgba(255,255,255,0.06)'
                }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl font-black text-gray-500">#{index + 1}</span>
                      {market.isHot && (
                        <span className="px-2 py-1 rounded-lg bg-orange-500/20 text-orange-400 text-xs font-bold flex items-center gap-1">
                          <Flame className="w-3 h-3" /> HOT
                        </span>
                      )}
                      <span 
                        className="px-2 py-1 rounded-lg text-xs font-semibold capitalize"
                        style={{ 
                          background: `${categoryColors[market.category]}20`,
                          color: categoryColors[market.category]
                        }}
                      >
                        {market.category}
                      </span>
                      <span className="text-xs text-gray-500">{market.platform}</span>
                    </div>
                    <h3 className="text-lg font-bold text-white mb-3">{market.question}</h3>
                    <div className="flex items-center gap-6 text-sm">
                      <div className="flex items-center gap-1 text-gray-400">
                        <Users className="w-4 h-4" />
                        {market.traders.toLocaleString()} traders
                      </div>
                      <div className="flex items-center gap-1 text-gray-400">
                        <DollarSign className="w-4 h-4" />
                        {formatVolume(market.volume24h)} vol
                      </div>
                      <div 
                        className={`flex items-center gap-1 font-semibold ${
                          market.volumeChange >= 0 ? 'text-green-400' : 'text-red-400'
                        }`}
                      >
                        {market.volumeChange >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                        {market.volumeChange >= 0 ? '+' : ''}{market.volumeChange}% vol
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-3xl font-black text-white mb-1">
                      {(market.yesPrice * 100).toFixed(0)}¢
                    </div>
                    <div className="text-sm text-gray-500 mb-2">YES price</div>
                    <div 
                      className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-bold ${
                        market.change24h >= 0 
                          ? 'bg-green-500/20 text-green-400' 
                          : 'bg-red-500/20 text-red-400'
                      }`}
                    >
                      {market.change24h >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                      {market.change24h >= 0 ? '+' : ''}{market.change24h}%
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* CTA */}
        <div className="mt-12 p-6 rounded-2xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 text-center">
          <h3 className="text-xl font-bold text-white mb-2">Want to explore all markets?</h3>
          <p className="text-gray-400 mb-4">Browse hundreds of prediction markets across all categories</p>
          <Link 
            href="/markets"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold hover:opacity-90 transition-all"
          >
            <BarChart3 className="w-5 h-5" />
            Browse All Markets
          </Link>
        </div>
      </div>
    </div>
  )
}
