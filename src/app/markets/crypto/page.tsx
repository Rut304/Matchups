'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Clock,
  ChevronRight,
  Bitcoin,
  Zap
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

const mockCryptoMarkets: Market[] = [
  {
    id: '1',
    platform: 'polymarket',
    question: 'Will Bitcoin reach $150K by end of 2026?',
    yesPrice: 0.42,
    noPrice: 0.58,
    change24h: 8.5,
    volume24h: 4200000,
    liquidity: 8500000,
    traders: 28000,
    endDate: '2026-12-31',
    isHot: true
  },
  {
    id: '2',
    platform: 'polymarket',
    question: 'Will ETH flip BTC market cap in 2026?',
    yesPrice: 0.12,
    noPrice: 0.88,
    change24h: -4.2,
    volume24h: 1800000,
    liquidity: 3200000,
    traders: 15000,
    endDate: '2026-12-31',
    isHot: true
  },
  {
    id: '3',
    platform: 'kalshi',
    question: 'Will SEC approve spot Solana ETF in 2026?',
    yesPrice: 0.35,
    noPrice: 0.65,
    change24h: 12.3,
    volume24h: 950000,
    liquidity: 1800000,
    traders: 8200,
    endDate: '2026-12-31',
    isHot: true
  },
  {
    id: '4',
    platform: 'polymarket',
    question: 'Will Tether market cap exceed $200B?',
    yesPrice: 0.55,
    noPrice: 0.45,
    change24h: 2.1,
    volume24h: 620000,
    liquidity: 1100000,
    traders: 5800,
    endDate: '2026-12-31',
    isHot: false
  },
  {
    id: '5',
    platform: 'polymarket',
    question: 'Will Bitcoin drop below $50K in 2026?',
    yesPrice: 0.18,
    noPrice: 0.82,
    change24h: -6.8,
    volume24h: 1500000,
    liquidity: 2800000,
    traders: 12500,
    endDate: '2026-12-31',
    isHot: false
  },
  {
    id: '6',
    platform: 'kalshi',
    question: 'Will any country adopt BTC as legal tender in 2026?',
    yesPrice: 0.28,
    noPrice: 0.72,
    change24h: 5.5,
    volume24h: 780000,
    liquidity: 1400000,
    traders: 6900,
    endDate: '2026-12-31',
    isHot: true
  }
]

const formatVolume = (vol: number): string => {
  if (vol >= 1000000) return `$${(vol / 1000000).toFixed(1)}M`
  if (vol >= 1000) return `$${(vol / 1000).toFixed(0)}K`
  return `$${vol.toFixed(0)}`
}

function MarketCard({ market }: { market: Market }) {
  return (
    <div className="p-5 rounded-2xl bg-gradient-to-br from-orange-500/5 to-yellow-500/5 border border-orange-500/10 hover:border-orange-500/30 transition-all hover:scale-[1.01]">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            {market.isHot && (
              <span className="px-2 py-0.5 rounded bg-orange-500/20 text-orange-400 text-[10px] font-bold">🔥 HOT</span>
            )}
            <span className="text-xs text-gray-500 capitalize">{market.platform}</span>
            <span className="text-xs text-gray-600">•</span>
            <span className="text-xs text-gray-500 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {new Date(market.endDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
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
        <div className="h-full bg-green-500" style={{ width: `${market.yesPrice * 100}%` }} />
        <div className="h-full bg-red-500" style={{ width: `${market.noPrice * 100}%` }} />
      </div>
      <div className="flex justify-between mt-1.5 text-[10px] text-gray-500">
        <span>YES {(market.yesPrice * 100).toFixed(0)}%</span>
        <span>NO {(market.noPrice * 100).toFixed(0)}%</span>
      </div>
    </div>
  )
}

export default function CryptoMarketsPage() {
  const [markets, setMarkets] = useState<Market[]>([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState<'volume' | 'change' | 'price'>('volume')

  useEffect(() => {
    setTimeout(() => {
      const sorted = [...mockCryptoMarkets]
      switch (sortBy) {
        case 'volume':
          sorted.sort((a, b) => b.volume24h - a.volume24h)
          break
        case 'change':
          sorted.sort((a, b) => Math.abs(b.change24h) - Math.abs(a.change24h))
          break
        case 'price':
          sorted.sort((a, b) => b.yesPrice - a.yesPrice)
          break
      }
      setMarkets(sorted)
      setLoading(false)
    }, 300)
  }, [sortBy])

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
              <span className="text-white">Crypto</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-white flex items-center gap-3">
              <Bitcoin className="w-8 h-8 text-orange-500" />
              Crypto Markets
            </h1>
            <p className="text-gray-400 mt-1">Bitcoin, Ethereum & cryptocurrency predictions</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-black text-white">{formatVolume(totalVolume)}</div>
            <div className="text-sm text-gray-500">24h Volume</div>
          </div>
        </div>

        {/* BTC/ETH Price Indicators (Mock) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-orange-500/10 to-yellow-500/5 border border-orange-500/20">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">₿</span>
              <span className="text-sm font-semibold text-white">Bitcoin</span>
            </div>
            <div className="text-xl font-black text-white">$98,450</div>
            <div className="text-xs text-green-400">+2.4%</div>
          </div>
          <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-500/10 to-purple-500/5 border border-blue-500/20">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">Ξ</span>
              <span className="text-sm font-semibold text-white">Ethereum</span>
            </div>
            <div className="text-xl font-black text-white">$3,820</div>
            <div className="text-xs text-green-400">+1.8%</div>
          </div>
          <div className="p-4 rounded-2xl bg-gradient-to-br from-green-500/10 to-emerald-500/5 border border-green-500/20">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">◎</span>
              <span className="text-sm font-semibold text-white">Solana</span>
            </div>
            <div className="text-xl font-black text-white">$215</div>
            <div className="text-xs text-red-400">-0.8%</div>
          </div>
          <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-500/10 to-pink-500/5 border border-purple-500/20">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-4 h-4 text-purple-400" />
              <span className="text-sm font-semibold text-white">Crypto Fear</span>
            </div>
            <div className="text-xl font-black text-green-400">72</div>
            <div className="text-xs text-gray-500">Greed</div>
          </div>
        </div>

        {/* Sort Options */}
        <div className="flex gap-2 mb-6">
          {[
            { key: 'volume', label: 'Volume' },
            { key: 'change', label: 'Change' },
            { key: 'price', label: 'Price' }
          ].map((s) => (
            <button
              key={s.key}
              onClick={() => setSortBy(s.key as typeof sortBy)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                sortBy === s.key 
                  ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' 
                  : 'bg-white/5 text-gray-500 hover:bg-white/10'
              }`}
            >
              {s.label}
            </button>
          ))}
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
            { name: 'Politics', href: '/markets/politics', emoji: '🗳️', color: 'from-red-600 to-red-800' },
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
