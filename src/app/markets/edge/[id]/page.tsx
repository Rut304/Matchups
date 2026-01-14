'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import {
  ArrowLeft,
  Target,
  TrendingUp,
  TrendingDown,
  Clock,
  DollarSign,
  BarChart3,
  Activity,
  AlertTriangle,
  ExternalLink,
  Shield,
  Brain,
  ChevronRight,
  Volume2,
  Newspaper,
  Calendar,
  CheckCircle,
  XCircle,
  Info
} from 'lucide-react'

/**
 * Edge Signal Detail Page
 * Shows comprehensive analysis backing each edge signal
 */

interface PricePoint {
  timestamp: string
  price: number
  volume: number
}

interface EdgeDetailData {
  id: string
  type: 'bias' | 'volume' | 'news' | 'arbitrage' | 'time'
  market: string
  platform: 'polymarket' | 'kalshi'
  currentPrice: number
  fairValue: number
  edge: number
  confidence: number
  signal: 'buy' | 'sell' | 'watch'
  reason: string
  evidence: string
  category: string
  volume24h: number
  expiresAt: string
  
  // Detailed analysis
  methodology: string
  historicalAccuracy: number
  sampleSize: number
  lastBacktest: string
  
  // Supporting data
  priceHistory: PricePoint[]
  relatedNews: {
    headline: string
    source: string
    timestamp: string
    impact: string
  }[]
  crossPlatformPrices: {
    platform: string
    price: number
    volume: number
  }[]
  
  // Academic backing
  researchBasis: {
    paper: string
    authors: string
    year: number
    finding: string
  }[]
}

// Mock detailed data for each edge type
const edgeDetails: Record<string, EdgeDetailData> = {
  '1': {
    id: '1',
    type: 'bias',
    market: 'Trump wins 2028 Republican Primary',
    platform: 'polymarket',
    currentPrice: 8,
    fairValue: 4.5,
    edge: 3.5,
    confidence: 78,
    signal: 'sell',
    reason: 'Favorite-Longshot Bias Detected',
    evidence: 'Market prices at 8% but historical analysis of early primary markets shows 3%+ overpricing for frontrunners 2+ years out.',
    category: 'Politics',
    volume24h: 2400000,
    expiresAt: 'November 2028',
    
    methodology: `This edge is detected using the Favorite-Longshot Bias (FLB) model. FLB is one of the most well-documented anomalies in prediction markets and sports betting. At extreme probabilities (<15% or >85%), markets systematically misprice outcomes due to cognitive biases including:

1. **Overweighting of small probabilities** - Bettors overpay for longshot outcomes due to the psychological appeal of large potential payouts
2. **Risk preference distortion** - At low probabilities, participants exhibit risk-seeking behavior
3. **Entertainment value** - Markets include a "hope premium" for exciting but unlikely outcomes

Our model applies probability calibration based on historical data to estimate true fair value.`,
    
    historicalAccuracy: 58.4,
    sampleSize: 847,
    lastBacktest: 'January 2025',
    
    priceHistory: [
      { timestamp: '30d ago', price: 5, volume: 1200000 },
      { timestamp: '25d ago', price: 6, volume: 1400000 },
      { timestamp: '20d ago', price: 7, volume: 1800000 },
      { timestamp: '15d ago', price: 8, volume: 2000000 },
      { timestamp: '10d ago', price: 9, volume: 2200000 },
      { timestamp: '5d ago', price: 8, volume: 2100000 },
      { timestamp: 'Now', price: 8, volume: 2400000 },
    ],
    
    relatedNews: [
      {
        headline: 'Early 2028 primary polling shows fragmented Republican field',
        source: 'Politico',
        timestamp: '2 days ago',
        impact: 'Neutral - No clear frontrunner emerged'
      },
      {
        headline: 'GOP donor activity remains quiet ahead of 2028 cycle',
        source: 'WSJ',
        timestamp: '5 days ago',
        impact: 'Bullish for uncertainty - supports lower probability'
      }
    ],
    
    crossPlatformPrices: [
      { platform: 'Polymarket', price: 8, volume: 2400000 },
      { platform: 'Kalshi', price: 7, volume: 890000 },
      { platform: 'PredictIt (implied)', price: 9, volume: 340000 }
    ],
    
    researchBasis: [
      {
        paper: 'The Favorite-Longshot Bias in Sequential Parimutuel Betting with Non-Expected Utility Players',
        authors: 'Page & Clemen',
        year: 2013,
        finding: 'Documented systematic overpricing of longshots across multiple betting markets, with bias most pronounced at extreme probabilities.'
      },
      {
        paper: 'Probability Calibration in Prediction Markets',
        authors: 'Rothschild & Sethi',
        year: 2018,
        finding: 'Prediction markets exhibit FLB similar to traditional betting markets, particularly for political outcomes.'
      }
    ]
  },
  '2': {
    id: '2',
    type: 'volume',
    market: 'Fed Cuts Rates in January 2026',
    platform: 'kalshi',
    currentPrice: 12,
    fairValue: 18,
    edge: -6,
    confidence: 72,
    signal: 'buy',
    reason: 'Smart Money Volume Spike',
    evidence: '340% volume increase in last 4 hours without corresponding news. Pattern matches informed trading before FOMC announcements.',
    category: 'Economics',
    volume24h: 890000,
    expiresAt: 'January 29, 2026',
    
    methodology: `Volume spike detection identifies potential informed trading activity. This strategy is based on market microstructure theory which suggests that informed traders often move prices through volume before news becomes public.

Key indicators we monitor:
1. **Volume/Price Divergence** - High volume without price movement suggests accumulation
2. **Time-of-Day Patterns** - Unusual activity outside market hours or before scheduled events
3. **Order Flow Analysis** - Large block trades vs. retail-sized orders

A 340% volume spike with <2% price change strongly suggests position building by informed participants.`,
    
    historicalAccuracy: 54.2,
    sampleSize: 234,
    lastBacktest: 'January 2025',
    
    priceHistory: [
      { timestamp: '8h ago', price: 11, volume: 50000 },
      { timestamp: '6h ago', price: 11, volume: 65000 },
      { timestamp: '4h ago', price: 12, volume: 180000 },
      { timestamp: '2h ago', price: 12, volume: 290000 },
      { timestamp: 'Now', price: 12, volume: 890000 },
    ],
    
    relatedNews: [
      {
        headline: 'Fed officials maintain data-dependent stance',
        source: 'Reuters',
        timestamp: '3 hours ago',
        impact: 'Neutral - Standard Fed communication'
      },
      {
        headline: 'Jobs report preview: Economists expect steady employment',
        source: 'Bloomberg',
        timestamp: '6 hours ago',
        impact: 'Neutral - Consensus expectations'
      }
    ],
    
    crossPlatformPrices: [
      { platform: 'Kalshi', price: 12, volume: 890000 },
      { platform: 'Polymarket (similar)', price: 14, volume: 1200000 },
    ],
    
    researchBasis: [
      {
        paper: 'Market Microstructure Theory',
        authors: 'O\'Hara',
        year: 1995,
        finding: 'Informed traders systematically affect prices through volume; uninformed traders cannot distinguish informed from noise trading.'
      },
      {
        paper: 'Volume and Price Patterns Around Events',
        authors: 'Garfinkel & Sokobin',
        year: 2006,
        finding: 'Abnormal volume precedes news announcements by 1-5 days on average, suggesting information leakage.'
      }
    ]
  },
  '3': {
    id: '3',
    type: 'news',
    market: 'Ukraine Ceasefire by March 2026',
    platform: 'polymarket',
    currentPrice: 24,
    fairValue: 32,
    edge: -8,
    confidence: 68,
    signal: 'buy',
    reason: 'Lagging News Integration',
    evidence: 'Market slow to integrate Reuters report on peace talks resumption. Similar patterns historically resolved within 4-6 hours.',
    category: 'World Events',
    volume24h: 1200000,
    expiresAt: 'March 31, 2026',
    
    methodology: `News lag detection identifies when markets are slow to incorporate new information. This edge exists because:

1. **Information Asymmetry** - Not all market participants see news simultaneously
2. **Processing Time** - Complex news requires time to interpret
3. **Liquidity Gaps** - Thin markets may take longer to adjust

We track news sources in real-time and measure price responses. When significant news is released but prices haven't moved proportionally, an edge exists for quick actors.`,
    
    historicalAccuracy: 61.8,
    sampleSize: 156,
    lastBacktest: 'January 2025',
    
    priceHistory: [
      { timestamp: '2h ago', price: 22, volume: 800000 },
      { timestamp: '1.5h ago', price: 23, volume: 850000 },
      { timestamp: '1h ago', price: 24, volume: 920000 },
      { timestamp: '30m ago', price: 24, volume: 1100000 },
      { timestamp: 'Now', price: 24, volume: 1200000 },
    ],
    
    relatedNews: [
      {
        headline: 'Ukraine-Russia officials resume Geneva negotiations',
        source: 'Reuters',
        timestamp: '23 min ago',
        impact: 'High - Direct ceasefire talks are material'
      },
      {
        headline: 'European officials express cautious optimism on peace process',
        source: 'BBC',
        timestamp: '45 min ago',
        impact: 'Medium - Supportive diplomatic signals'
      }
    ],
    
    crossPlatformPrices: [
      { platform: 'Polymarket', price: 24, volume: 1200000 },
      { platform: 'Kalshi', price: 26, volume: 450000 },
    ],
    
    researchBasis: [
      {
        paper: 'Information Aggregation in Markets',
        authors: 'Wolfers & Zitzewitz',
        year: 2004,
        finding: 'Prediction markets aggregate information efficiently but with measurable lag, typically 15-120 minutes for major news.'
      },
      {
        paper: 'The Speed of Information Revelation',
        authors: 'Asparouhova & Bossaerts',
        year: 2017,
        finding: 'Market efficiency increases with liquidity; thin markets may take hours to fully incorporate news.'
      }
    ]
  }
}

const typeConfig = {
  bias: { color: '#00FF88', bg: 'bg-green-500/10', border: 'border-green-500/30', icon: Target, label: 'Bias Edge' },
  volume: { color: '#00A8FF', bg: 'bg-blue-500/10', border: 'border-blue-500/30', icon: Volume2, label: 'Volume Signal' },
  news: { color: '#FF6B00', bg: 'bg-orange-500/10', border: 'border-orange-500/30', icon: Newspaper, label: 'News Correlation' },
  arbitrage: { color: '#9B59B6', bg: 'bg-purple-500/10', border: 'border-purple-500/30', icon: BarChart3, label: 'Arbitrage' },
  time: { color: '#FFD700', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', icon: Clock, label: 'Time Bias' },
}

export default function EdgeDetailPage() {
  const params = useParams()
  const id = params.id as string
  const [data, setData] = useState<EdgeDetailData | null>(null)
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    // In production, fetch from API
    const edgeData = edgeDetails[id] || null
    setData(edgeData)
    setLoading(false)
  }, [id])
  
  if (loading) {
    return (
      <div className="min-h-screen pt-20 pb-12 bg-[#050508] flex items-center justify-center">
        <div className="text-gray-400">Loading edge analysis...</div>
      </div>
    )
  }
  
  if (!data) {
    return (
      <div className="min-h-screen pt-20 pb-12 bg-[#050508] flex flex-col items-center justify-center">
        <AlertTriangle className="w-12 h-12 text-red-400 mb-4" />
        <h1 className="text-xl font-bold text-white mb-2">Edge Signal Not Found</h1>
        <p className="text-gray-400 mb-6">This edge signal may have expired or doesn&apos;t exist.</p>
        <Link 
          href="/markets/edge"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to The Edge
        </Link>
      </div>
    )
  }
  
  const config = typeConfig[data.type]
  const Icon = config.icon
  
  return (
    <div className="min-h-screen pt-20 pb-12 bg-[#050508]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back link */}
        <Link 
          href="/markets/edge"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to The Edge
        </Link>
        
        {/* Header */}
        <div className={`p-6 rounded-2xl ${config.bg} ${config.border} border mb-8`}>
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-black/30">
                <Icon className="w-8 h-8" style={{ color: config.color }} />
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider" style={{ color: config.color }}>
                  {config.label}
                </span>
                <h1 className="text-2xl font-black text-white">{data.market}</h1>
                <div className="flex items-center gap-3 text-sm text-gray-400 mt-1">
                  <span>{data.platform}</span>
                  <span>•</span>
                  <span>{data.category}</span>
                  <span>•</span>
                  <span>Expires {data.expiresAt}</span>
                </div>
              </div>
            </div>
            <div className={`px-4 py-2 rounded-xl text-sm font-black uppercase ${
              data.signal === 'buy' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
              data.signal === 'sell' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
              'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
            }`}>
              {data.signal} Signal
            </div>
          </div>
          
          {/* Price comparison */}
          <div className="grid grid-cols-4 gap-4 p-4 rounded-xl bg-black/30">
            <div className="text-center">
              <div className="text-xs text-gray-500 mb-1">Market Price</div>
              <div className="text-3xl font-black text-white">{data.currentPrice}%</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-500 mb-1">Fair Value</div>
              <div className="text-3xl font-black" style={{ color: config.color }}>{data.fairValue}%</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-500 mb-1">Edge</div>
              <div className={`text-3xl font-black ${data.edge > 0 ? 'text-red-400' : 'text-green-400'}`}>
                {data.edge > 0 ? '+' : ''}{data.edge}%
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-500 mb-1">Confidence</div>
              <div className="text-3xl font-black text-blue-400">{data.confidence}%</div>
            </div>
          </div>
        </div>
        
        {/* Main content grid */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left column - Main analysis */}
          <div className="lg:col-span-2 space-y-8">
            {/* Signal Reasoning */}
            <div className="rounded-2xl bg-[#0c0c14] border border-white/10 p-6">
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Brain className="w-5 h-5 text-purple-400" />
                Signal Reasoning
              </h2>
              <div className="p-4 rounded-xl bg-white/5 mb-4">
                <div className="font-bold text-white mb-2">{data.reason}</div>
                <p className="text-gray-400">{data.evidence}</p>
              </div>
            </div>
            
            {/* Methodology */}
            <div className="rounded-2xl bg-[#0c0c14] border border-white/10 p-6">
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-400" />
                Methodology
              </h2>
              <div className="prose prose-invert prose-sm max-w-none">
                <p className="text-gray-400 whitespace-pre-line">{data.methodology}</p>
              </div>
            </div>
            
            {/* Price History */}
            <div className="rounded-2xl bg-[#0c0c14] border border-white/10 p-6">
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5 text-green-400" />
                Price History
              </h2>
              <div className="space-y-2">
                {data.priceHistory.map((point, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                    <span className="text-sm text-gray-400">{point.timestamp}</span>
                    <div className="flex items-center gap-8">
                      <span className="text-white font-bold">{point.price}%</span>
                      <span className="text-gray-500 text-sm">${(point.volume / 1000000).toFixed(2)}M vol</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Research Basis */}
            <div className="rounded-2xl bg-[#0c0c14] border border-white/10 p-6">
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-yellow-400" />
                Academic Research Basis
              </h2>
              <div className="space-y-4">
                {data.researchBasis.map((paper, i) => (
                  <div key={i} className="p-4 rounded-xl bg-white/5">
                    <div className="font-semibold text-white mb-1">{paper.paper}</div>
                    <div className="text-sm text-gray-500 mb-2">{paper.authors} ({paper.year})</div>
                    <p className="text-sm text-gray-400">{paper.finding}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Right column - Supporting data */}
          <div className="space-y-6">
            {/* Backtest Performance */}
            <div className="rounded-2xl bg-[#0c0c14] border border-white/10 p-5">
              <h2 className="font-bold text-white mb-4 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                Strategy Performance
              </h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Win Rate</span>
                  <span className="text-green-400 font-bold">{data.historicalAccuracy}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Sample Size</span>
                  <span className="text-white font-bold">{data.sampleSize} trades</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Last Backtest</span>
                  <span className="text-white">{data.lastBacktest}</span>
                </div>
              </div>
            </div>
            
            {/* Cross-Platform Prices */}
            <div className="rounded-2xl bg-[#0c0c14] border border-white/10 p-5">
              <h2 className="font-bold text-white mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-purple-400" />
                Cross-Platform Prices
              </h2>
              <div className="space-y-2">
                {data.crossPlatformPrices.map((p, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                    <span className="text-white font-medium">{p.platform}</span>
                    <div className="flex items-center gap-4">
                      <span className="text-white font-bold">{p.price}%</span>
                      <span className="text-xs text-gray-500">${(p.volume / 1000000).toFixed(1)}M</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Related News */}
            <div className="rounded-2xl bg-[#0c0c14] border border-white/10 p-5">
              <h2 className="font-bold text-white mb-4 flex items-center gap-2">
                <Newspaper className="w-5 h-5 text-orange-400" />
                Related News
              </h2>
              <div className="space-y-3">
                {data.relatedNews.map((news, i) => (
                  <div key={i} className="p-3 rounded-lg bg-white/5">
                    <div className="font-medium text-white text-sm mb-1">{news.headline}</div>
                    <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                      <span>{news.source}</span>
                      <span>•</span>
                      <span>{news.timestamp}</span>
                    </div>
                    <div className="text-xs text-orange-400">{news.impact}</div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Trade on Platform */}
            <a
              href={data.platform === 'polymarket' ? 'https://polymarket.com' : 'https://kalshi.com'}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 p-4 rounded-xl bg-gradient-to-r from-purple-500 to-blue-500 text-white font-bold hover:scale-[1.02] transition-transform"
            >
              Trade on {data.platform === 'polymarket' ? 'Polymarket' : 'Kalshi'}
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
        
        {/* Disclaimer */}
        <div className="mt-8 p-4 rounded-xl bg-red-500/10 border border-red-500/20">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5 shrink-0" />
            <div>
              <h3 className="font-bold text-white mb-1">Risk Disclaimer</h3>
              <p className="text-sm text-gray-400">
                This analysis is for informational purposes only and does not constitute financial advice. 
                Past performance does not guarantee future results. Prediction markets involve significant 
                risk of loss. Always do your own research and never risk more than you can afford to lose.
                Historical win rates are based on backtesting and may not reflect future performance.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
