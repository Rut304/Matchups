'use client'

import { useState } from 'react'
import Link from 'next/link'
import { 
  TrendingUp, 
  TrendingDown,
  Zap, 
  ExternalLink,
  Flame,
  Filter
} from 'lucide-react'

type Platform = 'all' | 'polymarket' | 'kalshi'
type Category = 'all' | 'nfl' | 'nba' | 'politics' | 'futures'

const markets = [
  {
    id: '1',
    question: 'Chiefs win Super Bowl LIX?',
    platform: 'Polymarket',
    category: 'nfl',
    yesPrice: 34,
    change24h: +5.2,
    volume24h: '$1.2M',
    liquidity: '$5.2M',
    endDate: 'Feb 9',
    aiEdge: { side: 'YES', edge: 8.2 },
    isHot: true,
  },
  {
    id: '2',
    question: 'Saquon Barkley NFL MVP?',
    platform: 'Polymarket',
    category: 'nfl',
    yesPrice: 22,
    change24h: +3.8,
    volume24h: '$890K',
    liquidity: '$2.1M',
    endDate: 'Feb 6',
    aiEdge: { side: 'YES', edge: 12.5 },
    isHot: true,
  },
  {
    id: '3',
    question: 'Lakers make playoffs?',
    platform: 'Kalshi',
    category: 'nba',
    yesPrice: 67,
    change24h: -4.1,
    volume24h: '$456K',
    liquidity: '$1.8M',
    endDate: 'Apr 14',
    aiEdge: null,
    isHot: false,
  },
  {
    id: '4',
    question: 'Lions win Super Bowl LIX?',
    platform: 'Polymarket',
    category: 'nfl',
    yesPrice: 19,
    change24h: +2.1,
    volume24h: '$720K',
    liquidity: '$3.1M',
    endDate: 'Feb 9',
    aiEdge: { side: 'NO', edge: 5.8 },
    isHot: false,
  },
  {
    id: '5',
    question: 'Thunder 60+ wins?',
    platform: 'Kalshi',
    category: 'nba',
    yesPrice: 78,
    change24h: +1.5,
    volume24h: '$234K',
    liquidity: '$890K',
    endDate: 'Apr 13',
    aiEdge: { side: 'YES', edge: 6.2 },
    isHot: false,
  },
  {
    id: '6',
    question: 'Eagles win NFC Championship?',
    platform: 'Polymarket',
    category: 'nfl',
    yesPrice: 28,
    change24h: -1.8,
    volume24h: '$560K',
    liquidity: '$2.4M',
    endDate: 'Jan 26',
    aiEdge: { side: 'YES', edge: 4.3 },
    isHot: false,
  },
  {
    id: '7',
    question: 'Bills win AFC Championship?',
    platform: 'Polymarket',
    category: 'nfl',
    yesPrice: 31,
    change24h: +4.2,
    volume24h: '$680K',
    liquidity: '$2.8M',
    endDate: 'Jan 26',
    aiEdge: { side: 'YES', edge: 7.1 },
    isHot: true,
  },
  {
    id: '8',
    question: 'Celtics repeat champions?',
    platform: 'Kalshi',
    category: 'nba',
    yesPrice: 24,
    change24h: +0.8,
    volume24h: '$1.1M',
    liquidity: '$4.2M',
    endDate: 'Jun 15',
    aiEdge: { side: 'YES', edge: 9.4 },
    isHot: false,
  },
  {
    id: '9',
    question: 'Jalen Hurts Super Bowl MVP?',
    platform: 'Polymarket',
    category: 'nfl',
    yesPrice: 12,
    change24h: +1.2,
    volume24h: '$320K',
    liquidity: '$1.4M',
    endDate: 'Feb 9',
    aiEdge: null,
    isHot: false,
  },
  {
    id: '10',
    question: 'OKC Thunder best record?',
    platform: 'Kalshi',
    category: 'nba',
    yesPrice: 45,
    change24h: -2.3,
    volume24h: '$410K',
    liquidity: '$1.9M',
    endDate: 'Apr 13',
    aiEdge: { side: 'NO', edge: 3.8 },
    isHot: false,
  },
  {
    id: '11',
    question: 'Ravens make Super Bowl?',
    platform: 'Polymarket',
    category: 'nfl',
    yesPrice: 26,
    change24h: +3.1,
    volume24h: '$590K',
    liquidity: '$2.6M',
    endDate: 'Jan 26',
    aiEdge: { side: 'YES', edge: 5.2 },
    isHot: false,
  },
  {
    id: '12',
    question: 'Nikola Jokic MVP 3-peat?',
    platform: 'Kalshi',
    category: 'nba',
    yesPrice: 38,
    change24h: -1.4,
    volume24h: '$780K',
    liquidity: '$3.3M',
    endDate: 'May 10',
    aiEdge: { side: 'NO', edge: 4.1 },
    isHot: false,
  },
]

const topMovers = [
  { question: 'Chiefs Super Bowl', change: +5.2, price: 34 },
  { question: 'Barkley MVP', change: +3.8, price: 22 },
  { question: 'Lakers Playoffs', change: -4.1, price: 67 },
  { question: 'Lions Super Bowl', change: +2.1, price: 19 },
]

export default function MarketsPage() {
  const [platform, setPlatform] = useState<Platform>('all')
  const [category, setCategory] = useState<Category>('all')

  const filteredMarkets = markets.filter(m => {
    if (platform !== 'all' && m.platform.toLowerCase() !== platform) return false
    if (category !== 'all' && m.category !== category) return false
    return true
  })

  return (
    <div className="min-h-screen" style={{ background: '#050508' }}>
      {/* Hero Header */}
      <section className="relative overflow-hidden" style={{ background: 'linear-gradient(180deg, #0a0a12 0%, #050508 100%)' }}>
        <div className="absolute top-0 left-1/2 w-96 h-96 rounded-full opacity-15 blur-3xl pointer-events-none" 
             style={{ background: 'radial-gradient(circle, #FF3366 0%, transparent 70%)' }} />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <span className="text-4xl">📈</span>
              <div>
                <h1 className="text-3xl font-black" style={{ color: '#FFF' }}>Prediction Markets</h1>
                <p style={{ color: '#808090' }}>Polymarket • Kalshi • Real-time odds</p>
              </div>
            </div>
            
            {/* Filters */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1 p-1 rounded-lg" style={{ background: 'rgba(255,255,255,0.05)' }}>
                {(['all', 'polymarket', 'kalshi'] as Platform[]).map((p) => (
                  <button key={p} onClick={() => setPlatform(p)}
                          className="px-3 py-1.5 rounded-md text-xs font-semibold capitalize transition-all"
                          style={{ 
                            background: platform === p ? 'linear-gradient(135deg, #FF6B00, #FF3366)' : 'transparent',
                            color: platform === p ? '#000' : '#808090'
                          }}>
                    {p === 'all' ? 'All' : p}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-1 p-1 rounded-lg" style={{ background: 'rgba(255,255,255,0.05)' }}>
                {(['all', 'nfl', 'nba', 'futures'] as Category[]).map((c) => (
                  <button key={c} onClick={() => setCategory(c)}
                          className="px-3 py-1.5 rounded-md text-xs font-semibold uppercase transition-all"
                          style={{ 
                            background: category === c ? 'rgba(255,255,255,0.1)' : 'transparent',
                            color: category === c ? '#FFF' : '#808090'
                          }}>
                    {c === 'all' ? 'All' : c}
                  </button>
                ))}
              </div>
            </div>
          </div>
          
          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
            <div className="p-3 rounded-xl text-center" style={{ background: 'rgba(255,107,0,0.1)', border: '1px solid rgba(255,107,0,0.2)' }}>
              <div className="text-2xl font-black" style={{ color: '#FF6B00' }}>$12.4M</div>
              <div className="text-xs" style={{ color: '#808090' }}>24h Volume</div>
            </div>
            <div className="p-3 rounded-xl text-center" style={{ background: 'rgba(0,255,136,0.1)', border: '1px solid rgba(0,255,136,0.2)' }}>
              <div className="text-2xl font-black" style={{ color: '#00FF88' }}>847</div>
              <div className="text-xs" style={{ color: '#808090' }}>Active Markets</div>
            </div>
            <div className="p-3 rounded-xl text-center" style={{ background: 'rgba(0,168,255,0.1)', border: '1px solid rgba(0,168,255,0.2)' }}>
              <div className="text-2xl font-black" style={{ color: '#00A8FF' }}>12</div>
              <div className="text-xs" style={{ color: '#808090' }}>AI Edge Picks</div>
            </div>
            <div className="p-3 rounded-xl text-center" style={{ background: 'rgba(255,51,102,0.1)', border: '1px solid rgba(255,51,102,0.2)' }}>
              <div className="text-2xl font-black" style={{ color: '#FF3366' }}>68%</div>
              <div className="text-xs" style={{ color: '#808090' }}>Edge Win Rate</div>
            </div>
          </div>
        </div>
      </section>

      {/* Markets Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Compact Markets Grid - 3 columns on desktop */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {filteredMarkets.map((market) => (
            <div key={market.id} 
                 className="rounded-xl overflow-hidden transition-all hover:scale-[1.02] cursor-pointer"
                 style={{ 
                   background: '#0c0c14',
                   border: market.isHot ? '1px solid rgba(255,51,102,0.4)' : '1px solid rgba(255,255,255,0.06)'
                 }}>
              <div className="p-3">
                {/* Header - Platform & Hot badge */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold"
                        style={{ 
                          background: market.platform === 'Polymarket' ? 'rgba(138,43,226,0.2)' : 'rgba(0,168,255,0.2)',
                          color: market.platform === 'Polymarket' ? '#9B59B6' : '#00A8FF'
                        }}>
                    {market.platform}
                  </span>
                  <div className="flex items-center gap-1">
                    {market.isHot && (
                      <Flame style={{ width: '12px', height: '12px', color: '#FF3366' }} />
                    )}
                    {market.aiEdge && (
                      <Zap style={{ width: '12px', height: '12px', color: '#FF6B00' }} />
                    )}
                  </div>
                </div>
                
                {/* Question - Compact */}
                <h3 className="font-bold text-sm leading-tight mb-2" style={{ color: '#FFF' }}>
                  {market.question}
                </h3>
                
                {/* Compact Price Bar */}
                <div className="mb-2">
                  <div className="flex justify-between text-xs mb-1">
                    <span style={{ color: '#00FF88' }}>Y {market.yesPrice}¢</span>
                    <span style={{ color: '#FF4455' }}>N {100 - market.yesPrice}¢</span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,68,85,0.3)' }}>
                    <div className="h-full rounded-full" 
                         style={{ width: `${market.yesPrice}%`, background: '#00FF88' }} />
                  </div>
                </div>
                
                {/* Compact Stats - 2 rows */}
                <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[10px] mb-2">
                  <div className="flex justify-between">
                    <span style={{ color: '#606070' }}>24h</span>
                    <span className="font-bold" style={{ color: market.change24h > 0 ? '#00FF88' : '#FF4455' }}>
                      {market.change24h > 0 ? '+' : ''}{market.change24h}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: '#606070' }}>Vol</span>
                    <span className="font-semibold" style={{ color: '#A0A0B0' }}>{market.volume24h}</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: '#606070' }}>Liq</span>
                    <span className="font-semibold" style={{ color: '#A0A0B0' }}>{market.liquidity}</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: '#606070' }}>End</span>
                    <span className="font-semibold" style={{ color: '#A0A0B0' }}>{market.endDate}</span>
                  </div>
                </div>
                
                {/* AI Edge - Super Compact */}
                {market.aiEdge && (
                  <div className="flex items-center justify-between px-2 py-1.5 rounded-lg"
                       style={{ background: 'rgba(255,107,0,0.1)' }}>
                    <span className="text-[10px] font-bold" style={{ color: market.aiEdge.side === 'YES' ? '#00FF88' : '#FF4455' }}>
                      AI: {market.aiEdge.side}
                    </span>
                    <span className="text-xs font-black" style={{ color: '#FF6B00' }}>+{market.aiEdge.edge}%</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        
        {/* Bottom Stats Row */}
        <div className="mt-6 flex items-center justify-between p-4 rounded-xl" 
             style={{ background: '#0c0c14', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <TrendingUp style={{ color: '#00FF88', width: '16px', height: '16px' }} />
              <span className="text-sm" style={{ color: '#808090' }}>Top Movers:</span>
              {topMovers.slice(0, 3).map((m, i) => (
                <span key={i} className="text-xs px-2 py-1 rounded" 
                      style={{ background: 'rgba(255,255,255,0.05)', color: m.change > 0 ? '#00FF88' : '#FF4455' }}>
                  {m.question} {m.change > 0 ? '+' : ''}{m.change}%
                </span>
              ))}
            </div>
          </div>
          <Link href="/leaderboard" className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-all hover:scale-105"
                style={{ background: 'linear-gradient(135deg, #FF6B00, #FF3366)', color: '#000' }}>
            View Leaderboard →
          </Link>
        </div>
      </section>
    </div>
  )
}
