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
  Info,
  Loader2
} from 'lucide-react'
import { fetchEdgeSignalById, type EdgeDetailData } from '@/lib/services/edge-service'

/**
 * Edge Signal Detail Page
 * Shows comprehensive analysis backing each edge signal
 * Uses the same data source as the list page for consistent IDs
 */

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
    // Fetch edge data using shared service (same data source as list page)
    const loadData = async () => {
      setLoading(true)
      const edgeData = await fetchEdgeSignalById(id)
      setData(edgeData)
      setLoading(false)
    }
    loadData()
  }, [id])
  
  if (loading) {
    return (
      <div className="min-h-screen pt-20 pb-12 bg-[#050508] flex items-center justify-center">
        <div className="flex items-center gap-3 text-gray-400">
          <Loader2 className="w-5 h-5 animate-spin" />
          Loading edge analysis...
        </div>
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
