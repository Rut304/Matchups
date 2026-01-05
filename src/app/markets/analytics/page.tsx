'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  Activity,
  PieChart,
  Clock,
  ChevronRight
} from 'lucide-react'

interface MarketStats {
  totalVolume24h: number
  totalLiquidity: number
  activeMarkets: number
  totalTraders: number
  avgYesPrice: number
  volumeChange: number
}

interface CategoryStats {
  name: string
  volume: number
  marketCount: number
  avgPrice: number
  change: number
  color: string
}

interface PlatformStats {
  platform: string
  volume: number
  markets: number
  traders: number
}

const mockStats: MarketStats = {
  totalVolume24h: 45600000,
  totalLiquidity: 128000000,
  activeMarkets: 847,
  totalTraders: 285000,
  avgYesPrice: 0.48,
  volumeChange: 12.4
}

const mockCategoryStats: CategoryStats[] = [
  { name: 'Politics', volume: 18500000, marketCount: 156, avgPrice: 0.52, change: 8.2, color: '#FF3366' },
  { name: 'Crypto', volume: 12800000, marketCount: 203, avgPrice: 0.45, change: 15.7, color: '#F7931A' },
  { name: 'Sports', volume: 8200000, marketCount: 312, avgPrice: 0.38, change: 5.1, color: '#00FF88' },
  { name: 'Economics', volume: 3500000, marketCount: 89, avgPrice: 0.55, change: -2.3, color: '#00A8FF' },
  { name: 'Tech', volume: 1800000, marketCount: 67, avgPrice: 0.42, change: 22.1, color: '#00D4AA' },
  { name: 'Entertainment', volume: 800000, marketCount: 20, avgPrice: 0.61, change: 3.8, color: '#9B59B6' },
]

const mockPlatformStats: PlatformStats[] = [
  { platform: 'Polymarket', volume: 38500000, markets: 654, traders: 198000 },
  { platform: 'Kalshi', volume: 7100000, markets: 193, traders: 87000 },
]

const formatVolume = (vol: number): string => {
  if (vol >= 1000000000) return `$${(vol / 1000000000).toFixed(1)}B`
  if (vol >= 1000000) return `$${(vol / 1000000).toFixed(1)}M`
  if (vol >= 1000) return `$${(vol / 1000).toFixed(0)}K`
  return `$${vol.toFixed(0)}`
}

export default function MarketsAnalyticsPage() {
  const [stats, setStats] = useState<MarketStats | null>(null)
  const [categories, setCategories] = useState<CategoryStats[]>([])
  const [platforms, setPlatforms] = useState<PlatformStats[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setTimeout(() => {
      setStats(mockStats)
      setCategories(mockCategoryStats)
      setPlatforms(mockPlatformStats)
      setLoading(false)
    }, 300)
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen pt-20 pb-12 bg-[#050508]">
        <div className="max-w-7xl mx-auto px-4">
          <div className="animate-pulse space-y-8">
            <div className="h-12 w-64 bg-white/5 rounded-xl" />
            <div className="grid grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-white/5 rounded-2xl" />
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pt-20 pb-12 bg-[#050508]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <Link href="/markets" className="hover:text-white transition-colors">Markets</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-white">Analytics</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-purple-500" />
            Market Analytics
          </h1>
          <p className="text-gray-400 mt-1">Deep dive into prediction market data</p>
        </div>

        {/* Main Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="p-5 rounded-2xl bg-gradient-to-br from-green-500/10 to-emerald-500/5 border border-green-500/20">
            <DollarSign className="w-6 h-6 text-green-400 mb-2" />
            <div className="text-2xl sm:text-3xl font-black text-white">{formatVolume(stats!.totalVolume24h)}</div>
            <div className="text-sm text-gray-400">24h Volume</div>
            <div className="text-xs text-green-400 mt-1">+{stats!.volumeChange}% from yesterday</div>
          </div>
          <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-500/10 to-cyan-500/5 border border-blue-500/20">
            <Activity className="w-6 h-6 text-blue-400 mb-2" />
            <div className="text-2xl sm:text-3xl font-black text-white">{formatVolume(stats!.totalLiquidity)}</div>
            <div className="text-sm text-gray-400">Total Liquidity</div>
          </div>
          <div className="p-5 rounded-2xl bg-gradient-to-br from-purple-500/10 to-pink-500/5 border border-purple-500/20">
            <PieChart className="w-6 h-6 text-purple-400 mb-2" />
            <div className="text-2xl sm:text-3xl font-black text-white">{stats!.activeMarkets}</div>
            <div className="text-sm text-gray-400">Active Markets</div>
          </div>
          <div className="p-5 rounded-2xl bg-gradient-to-br from-orange-500/10 to-red-500/5 border border-orange-500/20">
            <Users className="w-6 h-6 text-orange-400 mb-2" />
            <div className="text-2xl sm:text-3xl font-black text-white">{(stats!.totalTraders / 1000).toFixed(0)}K</div>
            <div className="text-sm text-gray-400">Active Traders</div>
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-white mb-4">Volume by Category</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((cat) => (
              <div 
                key={cat.name}
                className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ background: cat.color }}
                    />
                    <span className="font-bold text-white">{cat.name}</span>
                  </div>
                  <span className="text-xs text-gray-500">{cat.marketCount} markets</span>
                </div>
                <div className="text-2xl font-black text-white mb-1">{formatVolume(cat.volume)}</div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Avg: {(cat.avgPrice * 100).toFixed(0)}¢</span>
                  <span className={`flex items-center gap-1 ${cat.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {cat.change >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {cat.change >= 0 ? '+' : ''}{cat.change}%
                  </span>
                </div>
                {/* Volume Bar */}
                <div className="mt-3 h-2 rounded-full bg-white/5 overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all"
                    style={{ 
                      width: `${(cat.volume / categories[0].volume) * 100}%`,
                      background: cat.color
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Platform Comparison */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-white mb-4">Platform Breakdown</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {platforms.map((p) => (
              <div 
                key={p.platform}
                className="p-6 rounded-2xl border transition-all"
                style={{
                  background: p.platform === 'Polymarket' 
                    ? 'linear-gradient(135deg, rgba(99,102,241,0.1) 0%, rgba(139,92,246,0.05) 100%)'
                    : 'linear-gradient(135deg, rgba(59,130,246,0.1) 0%, rgba(37,99,235,0.05) 100%)',
                  borderColor: p.platform === 'Polymarket' ? 'rgba(99,102,241,0.3)' : 'rgba(59,130,246,0.3)'
                }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div 
                    className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg text-white"
                    style={{ 
                      background: p.platform === 'Polymarket' 
                        ? 'linear-gradient(135deg, #6366F1, #8B5CF6)' 
                        : 'linear-gradient(135deg, #3B82F6, #2563EB)'
                    }}
                  >
                    {p.platform[0]}
                  </div>
                  <div>
                    <div className="font-bold text-white text-lg">{p.platform}</div>
                    <div className="text-xs text-gray-500">{p.markets} active markets</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-2xl font-black text-white">{formatVolume(p.volume)}</div>
                    <div className="text-xs text-gray-500">24h Volume</div>
                  </div>
                  <div>
                    <div className="text-2xl font-black text-white">{(p.traders / 1000).toFixed(0)}K</div>
                    <div className="text-xs text-gray-500">Traders</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="p-6 rounded-2xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 text-center">
          <h3 className="text-xl font-bold text-white mb-2">Want to see trending markets?</h3>
          <p className="text-gray-400 mb-4">Check out the hottest movers and biggest volume</p>
          <div className="flex gap-3 justify-center">
            <Link 
              href="/markets/trending"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold hover:opacity-90 transition-all"
            >
              <TrendingUp className="w-5 h-5" />
              Hot Markets
            </Link>
            <Link 
              href="/markets"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/10 text-white font-bold hover:bg-white/20 transition-all"
            >
              Browse All
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
