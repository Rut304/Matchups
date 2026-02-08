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
  Film,
  Tv,
  Music,
  Award
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
  category: 'movies' | 'tv' | 'music' | 'awards'
}

const formatVolume = (vol: number): string => {
  if (vol >= 1000000) return `$${(vol / 1000000).toFixed(1)}M`
  if (vol >= 1000) return `$${(vol / 1000).toFixed(0)}K`
  return `$${vol.toFixed(0)}`
}

function MarketCard({ market }: { market: Market }) {
  const categoryIcons = {
    movies: <Film className="w-3 h-3" />,
    tv: <Tv className="w-3 h-3" />,
    music: <Music className="w-3 h-3" />,
    awards: <Award className="w-3 h-3" />
  }
  
  return (
    <div className="p-5 rounded-2xl bg-gradient-to-br from-pink-500/5 to-purple-500/5 border border-pink-500/10 hover:border-pink-500/30 transition-all hover:scale-[1.01]">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            {market.isHot && (
              <span className="px-2 py-0.5 rounded bg-pink-500/20 text-pink-400 text-[10px] font-bold">🔥 HOT</span>
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

export default function EntertainmentMarketsPage() {
  const [markets, setMarkets] = useState<Market[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | Market['category']>('all')

  useEffect(() => {
    const fetchMarkets = async () => {
      try {
        const res = await fetch('/api/markets?category=entertainment')
        if (res.ok) {
          const data = await res.json()
          if (data.markets && data.markets.length > 0) {
            setMarkets(data.markets.map((m: any) => ({
              ...m,
              category: m.category || 'movies'
            })))
            setLoading(false)
            return
          }
        }
      } catch (e) {
        console.error('Failed to fetch entertainment markets:', e)
      }
      
      // Fallback to curated entertainment markets
      setMarkets([
        {
          id: '1',
          platform: 'polymarket',
          question: 'Will Avatar 3 gross over $2B worldwide?',
          yesPrice: 0.65,
          noPrice: 0.35,
          change24h: 3.2,
          volume24h: 890000,
          liquidity: 1800000,
          traders: 12500,
          endDate: '2026-12-31',
          isHot: true,
          category: 'movies'
        },
        {
          id: '2',
          platform: 'polymarket',
          question: 'Will Taylor Swift announce retirement in 2026?',
          yesPrice: 0.08,
          noPrice: 0.92,
          change24h: -1.5,
          volume24h: 2100000,
          liquidity: 4500000,
          traders: 35000,
          endDate: '2026-12-31',
          isHot: true,
          category: 'music'
        },
        {
          id: '3',
          platform: 'kalshi',
          question: 'Will Stranger Things finale break Netflix viewership record?',
          yesPrice: 0.72,
          noPrice: 0.28,
          change24h: 5.8,
          volume24h: 650000,
          liquidity: 1200000,
          traders: 8900,
          endDate: '2026-06-30',
          isHot: true,
          category: 'tv'
        },
        {
          id: '4',
          platform: 'polymarket',
          question: 'Will Marvel Studios announce X-Men reboot cast?',
          yesPrice: 0.88,
          noPrice: 0.12,
          change24h: 2.1,
          volume24h: 420000,
          liquidity: 850000,
          traders: 6200,
          endDate: '2026-07-31',
          isHot: false,
          category: 'movies'
        },
        {
          id: '5',
          platform: 'polymarket',
          question: 'Will Oppenheimer win Best Picture at 2026 Oscars?',
          yesPrice: 0.15,
          noPrice: 0.85,
          change24h: -8.2,
          volume24h: 1500000,
          liquidity: 3200000,
          traders: 22000,
          endDate: '2026-03-01',
          isHot: true,
          category: 'awards'
        },
        {
          id: '6',
          platform: 'kalshi',
          question: 'Will Drake release a new album in Q1 2026?',
          yesPrice: 0.45,
          noPrice: 0.55,
          change24h: 12.5,
          volume24h: 380000,
          liquidity: 720000,
          traders: 5100,
          endDate: '2026-03-31',
          isHot: false,
          category: 'music'
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

  return (
    <div className="min-h-screen pt-20 pb-12 bg-[#050508]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
              <Link href="/markets" className="hover:text-white transition-colors">Markets</Link>
              <ChevronRight className="w-4 h-4" />
              <span className="text-white">Entertainment</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-white flex items-center gap-3">
              <Film className="w-8 h-8 text-pink-500" />
              Entertainment Markets
            </h1>
            <p className="text-gray-400 mt-1">Movies, TV, music & awards predictions</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-black text-white">{formatVolume(totalVolume)}</div>
            <div className="text-sm text-gray-500">24h Volume</div>
          </div>
        </div>

        {/* Category Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-red-500/10 to-orange-500/5 border border-red-500/20">
            <div className="flex items-center gap-2 mb-2">
              <Film className="w-4 h-4 text-red-400" />
              <span className="text-sm font-semibold text-white">Movies</span>
            </div>
            <div className="text-xl font-black text-white">{markets.filter(m => m.category === 'movies').length}</div>
            <div className="text-xs text-gray-500">Active markets</div>
          </div>
          <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-500/10 to-purple-500/5 border border-blue-500/20">
            <div className="flex items-center gap-2 mb-2">
              <Tv className="w-4 h-4 text-blue-400" />
              <span className="text-sm font-semibold text-white">TV Shows</span>
            </div>
            <div className="text-xl font-black text-white">{markets.filter(m => m.category === 'tv').length}</div>
            <div className="text-xs text-gray-500">Active markets</div>
          </div>
          <div className="p-4 rounded-2xl bg-gradient-to-br from-green-500/10 to-emerald-500/5 border border-green-500/20">
            <div className="flex items-center gap-2 mb-2">
              <Music className="w-4 h-4 text-green-400" />
              <span className="text-sm font-semibold text-white">Music</span>
            </div>
            <div className="text-xl font-black text-white">{markets.filter(m => m.category === 'music').length}</div>
            <div className="text-xs text-gray-500">Active markets</div>
          </div>
          <div className="p-4 rounded-2xl bg-gradient-to-br from-yellow-500/10 to-amber-500/5 border border-yellow-500/20">
            <div className="flex items-center gap-2 mb-2">
              <Award className="w-4 h-4 text-yellow-400" />
              <span className="text-sm font-semibold text-white">Awards</span>
            </div>
            <div className="text-xl font-black text-white">{markets.filter(m => m.category === 'awards').length}</div>
            <div className="text-xs text-gray-500">Active markets</div>
          </div>
        </div>

        {/* Filter */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {[
            { key: 'all', label: 'All', icon: null },
            { key: 'movies', label: 'Movies', icon: Film },
            { key: 'tv', label: 'TV', icon: Tv },
            { key: 'music', label: 'Music', icon: Music },
            { key: 'awards', label: 'Awards', icon: Award }
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key as typeof filter)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap flex items-center gap-2 ${
                filter === f.key 
                  ? 'bg-pink-500/20 text-pink-400 border border-pink-500/30' 
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
            <Film className="w-12 h-12 text-gray-600 mx-auto mb-4" />
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
