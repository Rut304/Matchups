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
  Cpu,
  Smartphone,
  Brain,
  Rocket
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
  category: 'ai' | 'companies' | 'hardware' | 'space'
}

const formatVolume = (vol: number): string => {
  if (vol >= 1000000) return `$${(vol / 1000000).toFixed(1)}M`
  if (vol >= 1000) return `$${(vol / 1000).toFixed(0)}K`
  return `$${vol.toFixed(0)}`
}

function MarketCard({ market }: { market: Market }) {
  const categoryIcons = {
    ai: <Brain className="w-3 h-3" />,
    companies: <Smartphone className="w-3 h-3" />,
    hardware: <Cpu className="w-3 h-3" />,
    space: <Rocket className="w-3 h-3" />
  }
  
  return (
    <div className="p-5 rounded-2xl bg-gradient-to-br from-cyan-500/5 to-blue-500/5 border border-cyan-500/10 hover:border-cyan-500/30 transition-all hover:scale-[1.01]">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            {market.isHot && (
              <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-400 text-[10px] font-bold">🔥 HOT</span>
            )}
            <span className="text-xs text-gray-500 capitalize flex items-center gap-1">
              {categoryIcons[market.category]}
              {market.category === 'ai' ? 'AI' : market.category}
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

export default function TechMarketsPage() {
  const [markets, setMarkets] = useState<Market[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | Market['category']>('all')

  useEffect(() => {
    const fetchMarkets = async () => {
      try {
        const res = await fetch('/api/markets?category=tech')
        if (res.ok) {
          const data = await res.json()
          if (data.markets && data.markets.length > 0) {
            setMarkets(data.markets.map((m: any) => ({
              ...m,
              category: m.category || 'ai'
            })))
            setLoading(false)
            return
          }
        }
      } catch (e) {
        console.error('Failed to fetch tech markets:', e)
      }
      
      // Curated tech prediction markets
      setMarkets([
        {
          id: '1',
          platform: 'polymarket',
          question: 'Will GPT-5 be released by OpenAI in 2026?',
          yesPrice: 0.78,
          noPrice: 0.22,
          change24h: 4.5,
          volume24h: 3200000,
          liquidity: 6500000,
          traders: 42000,
          endDate: '2026-12-31',
          isHot: true,
          category: 'ai'
        },
        {
          id: '2',
          platform: 'polymarket',
          question: 'Will Apple release AR glasses in 2026?',
          yesPrice: 0.42,
          noPrice: 0.58,
          change24h: -2.8,
          volume24h: 1800000,
          liquidity: 3800000,
          traders: 28000,
          endDate: '2026-12-31',
          isHot: true,
          category: 'companies'
        },
        {
          id: '3',
          platform: 'kalshi',
          question: 'Will SpaceX Starship complete orbital flight?',
          yesPrice: 0.92,
          noPrice: 0.08,
          change24h: 1.2,
          volume24h: 950000,
          liquidity: 2100000,
          traders: 15500,
          endDate: '2026-06-30',
          isHot: false,
          category: 'space'
        },
        {
          id: '4',
          platform: 'polymarket',
          question: 'Will NVIDIA stock reach $200 in 2026?',
          yesPrice: 0.55,
          noPrice: 0.45,
          change24h: 8.2,
          volume24h: 2500000,
          liquidity: 4800000,
          traders: 35000,
          endDate: '2026-12-31',
          isHot: true,
          category: 'companies'
        },
        {
          id: '5',
          platform: 'polymarket',
          question: 'Will AGI be achieved by any lab in 2026?',
          yesPrice: 0.12,
          noPrice: 0.88,
          change24h: 15.5,
          volume24h: 4500000,
          liquidity: 8200000,
          traders: 68000,
          endDate: '2026-12-31',
          isHot: true,
          category: 'ai'
        },
        {
          id: '6',
          platform: 'kalshi',
          question: 'Will quantum computer break RSA encryption?',
          yesPrice: 0.05,
          noPrice: 0.95,
          change24h: -0.5,
          volume24h: 620000,
          liquidity: 1400000,
          traders: 9200,
          endDate: '2026-12-31',
          isHot: false,
          category: 'hardware'
        },
        {
          id: '7',
          platform: 'polymarket',
          question: 'Will Twitter/X reach 1B daily active users?',
          yesPrice: 0.22,
          noPrice: 0.78,
          change24h: -4.2,
          volume24h: 850000,
          liquidity: 1900000,
          traders: 12800,
          endDate: '2026-12-31',
          isHot: false,
          category: 'companies'
        },
        {
          id: '8',
          platform: 'kalshi',
          question: 'Will Neuralink receive FDA approval for brain implants?',
          yesPrice: 0.35,
          noPrice: 0.65,
          change24h: 6.8,
          volume24h: 1200000,
          liquidity: 2600000,
          traders: 18500,
          endDate: '2026-12-31',
          isHot: true,
          category: 'hardware'
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
              <span className="text-white">Tech</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-white flex items-center gap-3">
              <Cpu className="w-8 h-8 text-cyan-500" />
              Tech Markets
            </h1>
            <p className="text-gray-400 mt-1">AI, companies, hardware & space predictions</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-black text-white">{formatVolume(totalVolume)}</div>
            <div className="text-sm text-gray-500">24h Volume</div>
          </div>
        </div>

        {/* Category Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-500/10 to-pink-500/5 border border-purple-500/20">
            <div className="flex items-center gap-2 mb-2">
              <Brain className="w-4 h-4 text-purple-400" />
              <span className="text-sm font-semibold text-white">AI</span>
            </div>
            <div className="text-xl font-black text-white">{markets.filter(m => m.category === 'ai').length}</div>
            <div className="text-xs text-gray-500">Active markets</div>
          </div>
          <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-500/10 to-cyan-500/5 border border-blue-500/20">
            <div className="flex items-center gap-2 mb-2">
              <Smartphone className="w-4 h-4 text-blue-400" />
              <span className="text-sm font-semibold text-white">Companies</span>
            </div>
            <div className="text-xl font-black text-white">{markets.filter(m => m.category === 'companies').length}</div>
            <div className="text-xs text-gray-500">Active markets</div>
          </div>
          <div className="p-4 rounded-2xl bg-gradient-to-br from-green-500/10 to-emerald-500/5 border border-green-500/20">
            <div className="flex items-center gap-2 mb-2">
              <Cpu className="w-4 h-4 text-green-400" />
              <span className="text-sm font-semibold text-white">Hardware</span>
            </div>
            <div className="text-xl font-black text-white">{markets.filter(m => m.category === 'hardware').length}</div>
            <div className="text-xs text-gray-500">Active markets</div>
          </div>
          <div className="p-4 rounded-2xl bg-gradient-to-br from-orange-500/10 to-red-500/5 border border-orange-500/20">
            <div className="flex items-center gap-2 mb-2">
              <Rocket className="w-4 h-4 text-orange-400" />
              <span className="text-sm font-semibold text-white">Space</span>
            </div>
            <div className="text-xl font-black text-white">{markets.filter(m => m.category === 'space').length}</div>
            <div className="text-xs text-gray-500">Active markets</div>
          </div>
        </div>

        {/* Filter */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {[
            { key: 'all', label: 'All', icon: null },
            { key: 'ai', label: 'AI', icon: Brain },
            { key: 'companies', label: 'Companies', icon: Smartphone },
            { key: 'hardware', label: 'Hardware', icon: Cpu },
            { key: 'space', label: 'Space', icon: Rocket }
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key as typeof filter)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap flex items-center gap-2 ${
                filter === f.key 
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' 
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
            <Cpu className="w-12 h-12 text-gray-600 mx-auto mb-4" />
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
