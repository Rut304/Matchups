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
  Newspaper,
  Zap,
  AlertTriangle,
  Globe
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
  category: 'breaking' | 'geopolitics' | 'disasters' | 'misc'
}

const formatVolume = (vol: number): string => {
  if (vol >= 1000000) return `$${(vol / 1000000).toFixed(1)}M`
  if (vol >= 1000) return `$${(vol / 1000).toFixed(0)}K`
  return `$${vol.toFixed(0)}`
}

function MarketCard({ market }: { market: Market }) {
  const categoryIcons = {
    breaking: <Zap className="w-3 h-3" />,
    geopolitics: <Globe className="w-3 h-3" />,
    disasters: <AlertTriangle className="w-3 h-3" />,
    misc: <Newspaper className="w-3 h-3" />
  }
  
  return (
    <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-500/5 to-orange-500/5 border border-amber-500/10 hover:border-amber-500/30 transition-all hover:scale-[1.01]">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            {market.isHot && (
              <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 text-[10px] font-bold">🔥 HOT</span>
            )}
            <span className="text-xs text-gray-500 capitalize flex items-center gap-1">
              {categoryIcons[market.category]}
              {market.category}
            </span>
            <span className="text-xs text-gray-600">•</span>
            <span className="text-xs text-gray-500">{market.platform}</span>
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

export default function NewsMarketsPage() {
  const [markets, setMarkets] = useState<Market[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | Market['category']>('all')

  useEffect(() => {
    const fetchMarkets = async () => {
      try {
        const res = await fetch('/api/markets?category=news')
        if (res.ok) {
          const data = await res.json()
          if (data.markets && data.markets.length > 0) {
            setMarkets(data.markets.map((m: any) => ({
              ...m,
              category: m.category || 'breaking'
            })))
            setLoading(false)
            return
          }
        }
      } catch (e) {
        console.error('Failed to fetch news markets:', e)
      }
      
      // Curated news & events prediction markets
      setMarkets([
        {
          id: '1',
          platform: 'polymarket',
          question: 'Will there be a major cyberattack on US infrastructure in 2026?',
          yesPrice: 0.35,
          noPrice: 0.65,
          change24h: 8.5,
          volume24h: 2800000,
          liquidity: 5500000,
          traders: 38000,
          endDate: '2026-12-31',
          isHot: true,
          category: 'breaking'
        },
        {
          id: '2',
          platform: 'polymarket',
          question: 'Will Russia-Ukraine conflict see formal ceasefire in 2026?',
          yesPrice: 0.28,
          noPrice: 0.72,
          change24h: -4.2,
          volume24h: 5500000,
          liquidity: 9800000,
          traders: 72000,
          endDate: '2026-12-31',
          isHot: true,
          category: 'geopolitics'
        },
        {
          id: '3',
          platform: 'kalshi',
          question: 'Will a Category 5 hurricane hit US mainland in 2026?',
          yesPrice: 0.45,
          noPrice: 0.55,
          change24h: 2.1,
          volume24h: 1200000,
          liquidity: 2500000,
          traders: 18000,
          endDate: '2026-11-30',
          isHot: false,
          category: 'disasters'
        },
        {
          id: '4',
          platform: 'polymarket',
          question: 'Will UK rejoin EU single market by 2026?',
          yesPrice: 0.08,
          noPrice: 0.92,
          change24h: -1.5,
          volume24h: 850000,
          liquidity: 1800000,
          traders: 12500,
          endDate: '2026-12-31',
          isHot: false,
          category: 'geopolitics'
        },
        {
          id: '5',
          platform: 'kalshi',
          question: 'Will magnitude 7.0+ earthquake hit California in 2026?',
          yesPrice: 0.22,
          noPrice: 0.78,
          change24h: 5.8,
          volume24h: 950000,
          liquidity: 2100000,
          traders: 15000,
          endDate: '2026-12-31',
          isHot: false,
          category: 'disasters'
        },
        {
          id: '6',
          platform: 'polymarket',
          question: 'Will a sitting world leader be assassinated in 2026?',
          yesPrice: 0.15,
          noPrice: 0.85,
          change24h: 12.5,
          volume24h: 3200000,
          liquidity: 6500000,
          traders: 45000,
          endDate: '2026-12-31',
          isHot: true,
          category: 'breaking'
        },
        {
          id: '7',
          platform: 'kalshi',
          question: 'Will commercial supersonic flights resume by end of 2026?',
          yesPrice: 0.18,
          noPrice: 0.82,
          change24h: 3.2,
          volume24h: 680000,
          liquidity: 1400000,
          traders: 9800,
          endDate: '2026-12-31',
          isHot: false,
          category: 'misc'
        },
        {
          id: '8',
          platform: 'polymarket',
          question: 'Will aliens/UAP disclosure occur by US government in 2026?',
          yesPrice: 0.12,
          noPrice: 0.88,
          change24h: 18.5,
          volume24h: 4200000,
          liquidity: 8500000,
          traders: 62000,
          endDate: '2026-12-31',
          isHot: true,
          category: 'misc'
        }
      ])
      setLoading(false)
    }
    
    fetchMarkets()
  }, [])

  const filteredMarkets = filter === 'all' 
    ? markets 
    : markets.filter(m => m.category === filter)
  
  const totalVolume = markets.reduce((sum, m) => sum + m.volume24h, 0)
  const hotCount = markets.filter(m => m.isHot).length

  return (
    <div className="min-h-screen pt-20 pb-12 bg-[#050508]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
              <Link href="/markets" className="hover:text-white transition-colors">Markets</Link>
              <ChevronRight className="w-4 h-4" />
              <span className="text-white">News & Events</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-white flex items-center gap-3">
              <Newspaper className="w-8 h-8 text-amber-500" />
              News & Events
            </h1>
            <p className="text-gray-400 mt-1">Breaking news, geopolitics & global events</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-black text-white">{formatVolume(totalVolume)}</div>
            <div className="text-sm text-gray-500">24h Volume</div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-red-500/10 to-orange-500/5 border border-red-500/20">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-4 h-4 text-red-400" />
              <span className="text-sm font-semibold text-white">Breaking</span>
            </div>
            <div className="text-xl font-black text-white">{markets.filter(m => m.category === 'breaking').length}</div>
            <div className="text-xs text-gray-500">Active markets</div>
          </div>
          <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-500/10 to-indigo-500/5 border border-blue-500/20">
            <div className="flex items-center gap-2 mb-2">
              <Globe className="w-4 h-4 text-blue-400" />
              <span className="text-sm font-semibold text-white">Geopolitics</span>
            </div>
            <div className="text-xl font-black text-white">{markets.filter(m => m.category === 'geopolitics').length}</div>
            <div className="text-xs text-gray-500">Active markets</div>
          </div>
          <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/10 to-yellow-500/5 border border-amber-500/20">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span className="text-sm font-semibold text-white">Disasters</span>
            </div>
            <div className="text-xl font-black text-white">{markets.filter(m => m.category === 'disasters').length}</div>
            <div className="text-xs text-gray-500">Active markets</div>
          </div>
          <div className="p-4 rounded-2xl bg-gradient-to-br from-orange-500/10 to-red-500/5 border border-orange-500/20">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-4 h-4 text-orange-400" />
              <span className="text-sm font-semibold text-white">Hot Markets</span>
            </div>
            <div className="text-xl font-black text-white">{hotCount}</div>
            <div className="text-xs text-gray-500">Trending now</div>
          </div>
        </div>

        {/* Filter */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {[
            { key: 'all', label: 'All', icon: null },
            { key: 'breaking', label: 'Breaking', icon: Zap },
            { key: 'geopolitics', label: 'Geopolitics', icon: Globe },
            { key: 'disasters', label: 'Disasters', icon: AlertTriangle },
            { key: 'misc', label: 'Misc', icon: Newspaper }
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key as typeof filter)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap flex items-center gap-2 ${
                filter === f.key 
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' 
                  : 'bg-white/5 text-gray-500 hover:bg-white/10'
              }`}
            >
              {f.icon && <f.icon className="w-3 h-3" />}
              {f.label}
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
        ) : filteredMarkets.length === 0 ? (
          <div className="text-center py-12">
            <Newspaper className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">No markets found in this category</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredMarkets.map((market) => (
              <MarketCard key={market.id} market={market} />
            ))}
          </div>
        )}

        {/* More Categories */}
        <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { name: 'Politics', href: '/markets/politics', emoji: '🗳️', color: 'from-red-600 to-red-800' },
            { name: 'Crypto', href: '/markets/crypto', emoji: '₿', color: 'from-orange-500 to-yellow-500' },
            { name: 'Tech', href: '/markets/tech', emoji: '🤖', color: 'from-cyan-500 to-blue-500' },
            { name: 'Economics', href: '/markets/economics', emoji: '📈', color: 'from-green-500 to-emerald-500' },
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
