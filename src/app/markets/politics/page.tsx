'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  ExternalLink,
  Clock,
  ChevronRight,
  Vote,
  Filter
} from 'lucide-react'

interface Market {
  id: string
  platform: 'polymarket' | 'kalshi'
  question: string
  yesPrice: number
  noPrice: number
  change24h: number
  volume24h: number
  liquidity: number
  traders: number
  endDate: string
  isHot: boolean
}

// Mock politics markets
const mockPoliticsMarkets: Market[] = [
  {
    id: '1',
    platform: 'polymarket',
    question: 'Will there be a government shutdown in Q1 2026?',
    yesPrice: 0.35,
    noPrice: 0.65,
    change24h: 5.2,
    volume24h: 2800000,
    liquidity: 5200000,
    traders: 15600,
    endDate: '2026-03-31',
    isHot: true
  },
  {
    id: '2',
    platform: 'kalshi',
    question: 'Will the Supreme Court rule on major tech case by June?',
    yesPrice: 0.72,
    noPrice: 0.28,
    change24h: -2.1,
    volume24h: 1200000,
    liquidity: 2800000,
    traders: 8900,
    endDate: '2026-06-30',
    isHot: true
  },
  {
    id: '3',
    platform: 'polymarket',
    question: 'Will Biden approval rating exceed 50% in January?',
    yesPrice: 0.22,
    noPrice: 0.78,
    change24h: -4.5,
    volume24h: 890000,
    liquidity: 1500000,
    traders: 6200,
    endDate: '2026-01-31',
    isHot: false
  },
  {
    id: '4',
    platform: 'polymarket',
    question: 'Will a new Speaker of House be elected in 2026?',
    yesPrice: 0.18,
    noPrice: 0.82,
    change24h: 1.2,
    volume24h: 560000,
    liquidity: 980000,
    traders: 4100,
    endDate: '2026-12-31',
    isHot: false
  },
  {
    id: '5',
    platform: 'kalshi',
    question: 'Will Congress pass major immigration bill?',
    yesPrice: 0.28,
    noPrice: 0.72,
    change24h: 8.7,
    volume24h: 1500000,
    liquidity: 2200000,
    traders: 9800,
    endDate: '2026-12-31',
    isHot: true
  },
  {
    id: '6',
    platform: 'polymarket',
    question: 'Will any cabinet member resign in Q1 2026?',
    yesPrice: 0.42,
    noPrice: 0.58,
    change24h: 3.4,
    volume24h: 720000,
    liquidity: 1100000,
    traders: 5200,
    endDate: '2026-03-31',
    isHot: false
  }
]

const formatVolume = (vol: number): string => {
  if (vol >= 1000000) return `$${(vol / 1000000).toFixed(1)}M`
  if (vol >= 1000) return `$${(vol / 1000).toFixed(0)}K`
  return `$${vol.toFixed(0)}`
}

function MarketCard({ market }: { market: Market }) {
  return (
    <div 
      className="p-5 rounded-2xl border transition-all hover:scale-[1.01] hover:border-red-500/30"
      style={{
        background: 'linear-gradient(135deg, rgba(255,51,102,0.05) 0%, rgba(255,255,255,0.01) 100%)',
        borderColor: market.isHot ? 'rgba(255,51,102,0.3)' : 'rgba(255,255,255,0.06)'
      }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            {market.isHot && (
              <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-400 text-[10px] font-bold">HOT</span>
            )}
            <span className="text-xs text-gray-500 capitalize">{market.platform}</span>
            <span className="text-xs text-gray-600">•</span>
            <span className="text-xs text-gray-500 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {new Date(market.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          </div>
          <h3 className="text-white font-semibold mb-3 leading-snug">{market.question}</h3>
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <DollarSign className="w-3 h-3" />
              {formatVolume(market.volume24h)} vol
            </span>
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              {market.traders.toLocaleString()}
            </span>
          </div>
        </div>
        
        <div className="text-right shrink-0">
          <div className="text-2xl font-black text-white">{(market.yesPrice * 100).toFixed(0)}¢</div>
          <div className="text-xs text-gray-500 mb-2">YES</div>
          <div className={`flex items-center gap-1 text-xs font-semibold ${
            market.change24h >= 0 ? 'text-green-400' : 'text-red-400'
          }`}>
            {market.change24h >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {market.change24h >= 0 ? '+' : ''}{market.change24h}%
          </div>
        </div>
      </div>
      
      {/* YES/NO Bar */}
      <div className="mt-4 h-2 rounded-full bg-white/10 overflow-hidden flex">
        <div 
          className="h-full bg-green-500"
          style={{ width: `${market.yesPrice * 100}%` }}
        />
        <div 
          className="h-full bg-red-500"
          style={{ width: `${market.noPrice * 100}%` }}
        />
      </div>
      <div className="flex justify-between mt-1.5 text-[10px] text-gray-500">
        <span>YES {(market.yesPrice * 100).toFixed(0)}%</span>
        <span>NO {(market.noPrice * 100).toFixed(0)}%</span>
      </div>
    </div>
  )
}

export default function PoliticsMarketsPage() {
  const [markets, setMarkets] = useState<Market[]>([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState<'volume' | 'change' | 'price'>('volume')
  const [platformFilter, setPlatformFilter] = useState<'all' | 'polymarket' | 'kalshi'>('all')

  useEffect(() => {
    setTimeout(() => {
      let filtered = [...mockPoliticsMarkets]
      
      if (platformFilter !== 'all') {
        filtered = filtered.filter(m => m.platform === platformFilter)
      }
      
      switch (sortBy) {
        case 'volume':
          filtered.sort((a, b) => b.volume24h - a.volume24h)
          break
        case 'change':
          filtered.sort((a, b) => Math.abs(b.change24h) - Math.abs(a.change24h))
          break
        case 'price':
          filtered.sort((a, b) => b.yesPrice - a.yesPrice)
          break
      }
      
      setMarkets(filtered)
      setLoading(false)
    }, 300)
  }, [sortBy, platformFilter])

  const totalVolume = markets.reduce((sum, m) => sum + m.volume24h, 0)

  return (
    <div className="min-h-screen pt-20 pb-12 bg-[#050508]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
              <Link href="/markets" className="hover:text-white transition-colors">Markets</Link>
              <ChevronRight className="w-4 h-4" />
              <span className="text-white">Politics</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-white flex items-center gap-3">
              <Vote className="w-8 h-8 text-red-500" />
              Politics Markets
            </h1>
            <p className="text-gray-400 mt-1">Elections, policy & government predictions</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-black text-white">{formatVolume(totalVolume)}</div>
            <div className="text-sm text-gray-500">24h Volume</div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-8">
          <div className="flex gap-2">
            {['all', 'polymarket', 'kalshi'].map((p) => (
              <button
                key={p}
                onClick={() => setPlatformFilter(p as typeof platformFilter)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                  platformFilter === p 
                    ? 'bg-red-500/20 text-red-400 border border-red-500/30' 
                    : 'bg-white/5 text-gray-400 hover:bg-white/10'
                }`}
              >
                {p === 'all' ? 'All Platforms' : p}
              </button>
            ))}
          </div>
          <div className="flex gap-2 ml-auto">
            {[
              { key: 'volume', label: 'Volume' },
              { key: 'change', label: 'Change' },
              { key: 'price', label: 'Price' }
            ].map((s) => (
              <button
                key={s.key}
                onClick={() => setSortBy(s.key as typeof sortBy)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  sortBy === s.key 
                    ? 'bg-white/10 text-white' 
                    : 'bg-white/5 text-gray-500 hover:bg-white/10'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Markets Grid */}
        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-48 rounded-2xl bg-white/5 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {markets.map((market) => (
              <MarketCard key={market.id} market={market} />
            ))}
          </div>
        )}

        {/* More Categories CTA */}
        <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { name: 'Crypto', href: '/markets/crypto', emoji: '₿', color: 'from-orange-500 to-yellow-500' },
            { name: 'Tech', href: '/markets/tech', emoji: '🤖', color: 'from-cyan-500 to-blue-500' },
            { name: 'Economics', href: '/markets/economics', emoji: '📈', color: 'from-green-500 to-emerald-500' },
            { name: 'Entertainment', href: '/markets/entertainment', emoji: '🎬', color: 'from-pink-500 to-purple-500' },
          ].map((cat) => (
            <Link
              key={cat.href}
              href={cat.href}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl bg-gradient-to-br ${cat.color} hover:scale-105 transition-all`}
            >
              <span className="text-2xl">{cat.emoji}</span>
              <span className="text-sm font-bold text-white">{cat.name}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
