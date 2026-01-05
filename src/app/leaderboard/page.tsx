'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { 
  Trophy, 
  TrendingUp, 
  TrendingDown,
  Flame,
  ArrowUp,
  ArrowDown,
  Tv,
  ChevronRight,
  Target,
  Crown,
  Sparkles,
  BarChart3,
  Settings,
  X,
  Plus,
  Scale,
  Brain,
  Zap,
  Calendar,
  UserCheck,
  Award
} from 'lucide-react'
import { getLeaderboardEntries, capperStats, type LeaderboardEntry } from '@/lib/leaderboard-data'
import { predictionCappers, analyticsSummary, MarketType } from '@/lib/prediction-market-data'
import { BetType, Sport } from '@/types/leaderboard'
import { getCapperSummary, type CapperAnalyticsSummary } from '@/lib/analytics-data'

type ActiveTab = 'all' | 'celebrity' | 'pro' | 'community' | 'fade' | 'prediction'

// Source badge styling
const sourceStyles: Record<string, { bg: string, color: string, icon: string }> = {
  tv: { bg: 'rgba(255,107,0,0.2)', color: '#FF6B00', icon: '📺' },
  podcast: { bg: 'rgba(138,43,226,0.2)', color: '#9B59B6', icon: '🎙️' },
  twitter: { bg: 'rgba(29,161,242,0.2)', color: '#1DA1F2', icon: '𝕏' },
  article: { bg: 'rgba(0,168,255,0.2)', color: '#00A8FF', icon: '📰' },
  polymarket: { bg: 'rgba(0,255,136,0.2)', color: '#00FF88', icon: '🎯' },
  kalshi: { bg: 'rgba(255,215,0,0.2)', color: '#FFD700', icon: '📊' },
  manual: { bg: 'rgba(128,128,144,0.2)', color: '#808090', icon: '✍️' },
  other: { bg: 'rgba(128,128,144,0.2)', color: '#808090', icon: '📝' },
}

export default function LeaderboardPage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('celebrity')
  const [betTypeFilter, setBetTypeFilter] = useState<BetType | 'all'>('spread') // Default to spread
  const [sportFilter, setSportFilter] = useState<Sport | 'all'>('all')
  const [sortBy, setSortBy] = useState<'units' | 'winPct' | 'roi' | 'picks'>('units')
  const [compareList, setCompareList] = useState<LeaderboardEntry[]>([])
  const [showComparison, setShowComparison] = useState(false)
  const [yearFilter, setYearFilter] = useState<'current' | 'all' | number>('current') // 2025/2026 by default
  
  const displayEntries = useMemo(() => {
    // Handle prediction market tab differently
    if (activeTab === 'prediction') {
      return [] // Handled separately
    }
    
    let entries = getLeaderboardEntries({ 
      capperType: activeTab === 'fade' || activeTab === 'all' ? 'all' : activeTab,
      betType: betTypeFilter === 'all' ? undefined : betTypeFilter,
      sport: sportFilter === 'all' ? undefined : sportFilter,
      sortBy,
      year: yearFilter // Pass year filter
    })
    
    // For fade tab, show worst performers
    if (activeTab === 'fade') {
      entries = [...entries].sort((a, b) => a.winPct - b.winPct).slice(0, 10)
    }
    
    return entries
  }, [activeTab, betTypeFilter, sportFilter, sortBy, yearFilter])

  // Computed stats
  const allEntries = getLeaderboardEntries({ capperType: 'all' })
  const hotStreaks = allEntries
    .filter(c => c.streak.startsWith('W') && parseInt(c.streak.slice(1)) >= 3)
    .sort((a, b) => parseInt(b.streak.slice(1)) - parseInt(a.streak.slice(1))).slice(0, 5)
  
  const coldStreaks = allEntries
    .filter(c => c.streak.startsWith('L') && parseInt(c.streak.slice(1)) >= 3)
    .sort((a, b) => parseInt(b.streak.slice(1)) - parseInt(a.streak.slice(1))).slice(0, 5)
  
  const topByUnits = [...allEntries].sort((a, b) => b.units - a.units).slice(0, 3)
  const worstByUnits = [...allEntries].sort((a, b) => a.units - b.units).slice(0, 3)

  // Calculate overall stats
  const totalCappers = allEntries.length
  const totalPicks = Object.values(capperStats).reduce((acc, s) => acc + s.totalPicks, 0)
  const avgCelebrityWinPct = allEntries
    .filter(e => e.capperType === 'celebrity')
    .reduce((acc, e) => acc + e.winPct, 0) / allEntries.filter(e => e.capperType === 'celebrity').length || 0
  const avgSharpWinPct = allEntries
    .filter(e => e.capperType === 'pro')
    .reduce((acc, e) => acc + e.winPct, 0) / allEntries.filter(e => e.capperType === 'pro').length || 0

  // Comparison functions
  const toggleCompare = (entry: LeaderboardEntry) => {
    if (compareList.find(c => c.id === entry.id)) {
      setCompareList(compareList.filter(c => c.id !== entry.id))
    } else if (compareList.length < 4) {
      setCompareList([...compareList, entry])
    }
  }
  
  const isInCompareList = (id: string) => compareList.some(c => c.id === id)

  return (
    <div className="min-h-screen" style={{ background: '#050508' }}>
      {/* EPIC HERO SECTION */}
      <section className="relative overflow-hidden" style={{ background: 'linear-gradient(180deg, #0a0a12 0%, #050508 100%)' }}>
        {/* Animated Background Effects */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full opacity-20 blur-[100px] pointer-events-none" 
               style={{ background: 'radial-gradient(circle, #FFD700 0%, transparent 70%)' }} />
          <div className="absolute top-20 right-1/4 w-[400px] h-[400px] rounded-full opacity-10 blur-[80px] pointer-events-none" 
               style={{ background: 'radial-gradient(circle, #FF4455 0%, transparent 70%)' }} />
          <div className="absolute bottom-0 left-1/2 w-[500px] h-[300px] rounded-full opacity-10 blur-[80px] pointer-events-none" 
               style={{ background: 'radial-gradient(circle, #00FF88 0%, transparent 70%)' }} />
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 relative z-10">
          {/* Main Title */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-3">
              <Image 
                src="/wrong-stamp.svg" 
                alt="Wrong Stamp" 
                width={80} 
                height={40}
                className="opacity-90 -rotate-6"
              />
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight" 
                  style={{ 
                    background: 'linear-gradient(135deg, #FFD700 0%, #FFF 50%, #FFD700 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    textShadow: '0 0 60px rgba(255,215,0,0.3)'
                  }}>
                EXPERT TRACKER
              </h1>
              <span className="text-4xl">🔍</span>
            </div>
            <p className="text-lg sm:text-xl" style={{ color: '#808090' }}>
              The so-called &quot;experts&quot; don&apos;t want you to see this • <span style={{ color: '#FF4455' }}>Receipts Exposed</span> • <span style={{ color: '#00FF88' }}>No More Hiding</span>
            </p>
            <p className="text-sm mt-2" style={{ color: '#606070' }}>
              Every pick from ESPN, FOX, TNT & more — tracked and verified
            </p>
          </div>
          
          {/* Hero Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <div className="relative group p-4 rounded-2xl text-center overflow-hidden"
                 style={{ background: 'rgba(255,215,0,0.1)', border: '1px solid rgba(255,215,0,0.2)' }}>
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                   style={{ background: 'radial-gradient(circle at center, rgba(255,215,0,0.2) 0%, transparent 70%)' }} />
              <Crown className="w-6 h-6 mx-auto mb-2" style={{ color: '#FFD700' }} />
              <div className="text-3xl font-black" style={{ color: '#FFD700' }}>{totalCappers}</div>
              <div className="text-xs font-medium" style={{ color: '#A0A0B0' }}>Cappers Tracked</div>
            </div>
            <div className="relative group p-4 rounded-2xl text-center overflow-hidden"
                 style={{ background: 'rgba(255,68,85,0.1)', border: '1px solid rgba(255,68,85,0.2)' }}>
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                   style={{ background: 'radial-gradient(circle at center, rgba(255,68,85,0.2) 0%, transparent 70%)' }} />
              <TrendingDown className="w-6 h-6 mx-auto mb-2" style={{ color: '#FF4455' }} />
              <div className="text-3xl font-black" style={{ color: '#FF4455' }}>{avgCelebrityWinPct.toFixed(1)}%</div>
              <div className="text-xs font-medium" style={{ color: '#A0A0B0' }}>TV Avg Win %</div>
            </div>
            <div className="relative group p-4 rounded-2xl text-center overflow-hidden"
                 style={{ background: 'rgba(0,255,136,0.1)', border: '1px solid rgba(0,255,136,0.2)' }}>
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                   style={{ background: 'radial-gradient(circle at center, rgba(0,255,136,0.2) 0%, transparent 70%)' }} />
              <TrendingUp className="w-6 h-6 mx-auto mb-2" style={{ color: '#00FF88' }} />
              <div className="text-3xl font-black" style={{ color: '#00FF88' }}>{avgSharpWinPct.toFixed(1)}%</div>
              <div className="text-xs font-medium" style={{ color: '#A0A0B0' }}>Sharp Avg Win %</div>
            </div>
            <div className="relative group p-4 rounded-2xl text-center overflow-hidden"
                 style={{ background: 'rgba(255,107,0,0.1)', border: '1px solid rgba(255,107,0,0.2)' }}>
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                   style={{ background: 'radial-gradient(circle at center, rgba(255,107,0,0.2) 0%, transparent 70%)' }} />
              <BarChart3 className="w-6 h-6 mx-auto mb-2" style={{ color: '#FF6B00' }} />
              <div className="text-3xl font-black" style={{ color: '#FF6B00' }}>{totalPicks.toLocaleString()}</div>
              <div className="text-xs font-medium" style={{ color: '#A0A0B0' }}>Picks Analyzed</div>
            </div>
          </div>
          
          {/* Featured Cappers Marquee */}
          <div className="flex items-center justify-center gap-6 flex-wrap">
            {topByUnits.slice(0, 3).map((capper, idx) => (
              <Link href={`/leaderboard/${capper.slug}`} key={capper.id}
                    className="flex items-center gap-3 px-4 py-2 rounded-xl transition-all hover:scale-105"
                    style={{ 
                      background: idx === 0 ? 'rgba(255,215,0,0.15)' : 'rgba(255,255,255,0.05)',
                      border: idx === 0 ? '1px solid rgba(255,215,0,0.3)' : '1px solid rgba(255,255,255,0.1)'
                    }}>
                <span className="text-2xl">{capper.avatarEmoji}</span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm" style={{ color: '#FFF' }}>{capper.name}</span>
                    {idx === 0 && <Crown className="w-4 h-4" style={{ color: '#FFD700' }} />}
                  </div>
                  <div className="text-xs" style={{ color: '#00FF88' }}>+{capper.units.toFixed(1)}u</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* MAIN CONTENT */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid lg:grid-cols-4 gap-6">
          
          {/* Main Table Area */}
          <div className="lg:col-span-3">
            {/* Filter Bar */}
            <div className="rounded-2xl p-4 mb-4" style={{ background: '#0c0c14', border: '1px solid rgba(255,255,255,0.06)' }}>
              {/* Category Tabs */}
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <span className="text-xs font-semibold mr-2" style={{ color: '#606070' }}>VIEW:</span>
                <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)' }}>
                  {[
                    { id: 'celebrity', label: '📺 Celebrities', color: '#FFD700' },
                    { id: 'pro', label: '💰 Sharps', color: '#00FF88' },
                    { id: 'community', label: '👥 Community', color: '#00A8FF' },
                    { id: 'prediction', label: '🎯 Predictions', color: '#9B59B6' },
                    { id: 'fade', label: '🔥 Fade Alert', color: '#FF4455' },
                    { id: 'all', label: '🌐 All', color: '#A0A0B0' },
                  ].map((tab) => (
                    <button 
                      key={tab.id} 
                      onClick={() => setActiveTab(tab.id as ActiveTab)}
                      className="px-4 py-2 rounded-lg text-xs font-bold transition-all"
                      style={{ 
                        background: activeTab === tab.id ? `${tab.color}20` : 'transparent',
                        color: activeTab === tab.id ? tab.color : '#808090',
                        border: activeTab === tab.id ? `1px solid ${tab.color}40` : '1px solid transparent'
                      }}>
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Bet Type & Sport Filters */}
              <div className="flex flex-wrap items-center gap-4">
                {/* Bet Type Filter */}
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4" style={{ color: '#FF6B00' }} />
                  <span className="text-xs font-semibold" style={{ color: '#606070' }}>BET TYPE:</span>
                  <div className="flex gap-1">
                    {[
                      { id: 'spread', label: 'Spread' },
                      { id: 'moneyline', label: 'ML' },
                      { id: 'over_under', label: 'O/U' },
                      { id: 'prop', label: 'Props' },
                      { id: 'parlay', label: 'Parlay' },
                      { id: 'all', label: 'All' },
                    ].map((bt) => (
                      <button
                        key={bt.id}
                        onClick={() => setBetTypeFilter(bt.id as BetType | 'all')}
                        className="px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all"
                        style={{
                          background: betTypeFilter === bt.id ? 'rgba(255,107,0,0.2)' : 'rgba(255,255,255,0.05)',
                          color: betTypeFilter === bt.id ? '#FF6B00' : '#808090',
                          border: betTypeFilter === bt.id ? '1px solid rgba(255,107,0,0.3)' : '1px solid transparent'
                        }}>
                        {bt.label}
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Sport Filter */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold" style={{ color: '#606070' }}>SPORT:</span>
                  <div className="flex gap-1">
                    {[
                      { id: 'all', label: '🌐' },
                      { id: 'NFL', label: '🏈' },
                      { id: 'NBA', label: '🏀' },
                      { id: 'MLB', label: '⚾' },
                      { id: 'NHL', label: '🏒' },
                      { id: 'NCAAF', label: '🎓' },
                    ].map((s) => (
                      <button
                        key={s.id}
                        onClick={() => setSportFilter(s.id as Sport | 'all')}
                        className="w-8 h-8 rounded-lg text-sm transition-all flex items-center justify-center"
                        style={{
                          background: sportFilter === s.id ? 'rgba(0,168,255,0.2)' : 'rgba(255,255,255,0.05)',
                          border: sportFilter === s.id ? '1px solid rgba(0,168,255,0.3)' : '1px solid transparent'
                        }}>
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Sort */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold" style={{ color: '#606070' }}>SORT:</span>
                  <div className="flex gap-1">
                    {[
                      { id: 'units', label: 'Units' },
                      { id: 'winPct', label: 'Win %' },
                      { id: 'roi', label: 'ROI' },
                    ].map((s) => (
                      <button
                        key={s.id}
                        onClick={() => setSortBy(s.id as typeof sortBy)}
                        className="px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all"
                        style={{
                          background: sortBy === s.id ? 'rgba(138,43,226,0.2)' : 'rgba(255,255,255,0.05)',
                          color: sortBy === s.id ? '#9B59B6' : '#808090'
                        }}>
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Year Filter - NEW! */}
                <div className="flex items-center gap-2 ml-auto">
                  <Calendar className="w-4 h-4" style={{ color: '#00FF88' }} />
                  <span className="text-xs font-semibold" style={{ color: '#606070' }}>YEAR:</span>
                  <div className="flex gap-1">
                    {[
                      { id: 'current', label: '2025/26' },
                      { id: 2024, label: '2024' },
                      { id: 'all', label: 'All Time' },
                    ].map((y) => (
                      <button
                        key={String(y.id)}
                        onClick={() => setYearFilter(y.id as typeof yearFilter)}
                        className="px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all"
                        style={{
                          background: yearFilter === y.id ? 'rgba(0,255,136,0.2)' : 'rgba(255,255,255,0.05)',
                          color: yearFilter === y.id ? '#00FF88' : '#808090',
                          border: yearFilter === y.id ? '1px solid rgba(0,255,136,0.3)' : '1px solid transparent'
                        }}>
                        {y.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Leaderboard Table or Prediction Markets */}
            {activeTab === 'prediction' ? (
              /* PREDICTION MARKETS TAB */
              <div className="rounded-2xl overflow-hidden" style={{ background: '#0c0c14', border: '1px solid rgba(138,43,226,0.3)' }}>
                {/* Header */}
                <div className="px-4 py-3 flex items-center justify-between" style={{ background: 'rgba(138,43,226,0.1)', borderBottom: '1px solid rgba(138,43,226,0.2)' }}>
                  <div className="flex items-center gap-2">
                    <Target className="w-5 h-5" style={{ color: '#9B59B6' }} />
                    <span className="font-bold" style={{ color: '#9B59B6' }}>Prediction Market Cappers</span>
                    <span className="text-xs px-2 py-0.5 rounded-lg" style={{ background: 'rgba(138,43,226,0.2)', color: '#9B59B6' }}>
                      Polymarket • Kalshi • PredictIt
                    </span>
                  </div>
                  <Link href="/analytics" className="text-xs font-bold px-3 py-1.5 rounded-lg transition-all hover:bg-white/10"
                        style={{ background: 'rgba(255,107,0,0.2)', color: '#FF6B00', border: '1px solid rgba(255,107,0,0.3)' }}>
                    🧠 Deep Analytics →
                  </Link>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                        <th className="text-left py-3 px-4 text-[10px] font-bold uppercase tracking-wider" style={{ color: '#606070' }}>Rank</th>
                        <th className="text-left py-3 px-4 text-[10px] font-bold uppercase tracking-wider" style={{ color: '#606070' }}>Capper</th>
                        <th className="text-center py-3 px-4 text-[10px] font-bold uppercase tracking-wider hidden sm:table-cell" style={{ color: '#606070' }}>Source</th>
                        <th className="text-center py-3 px-4 text-[10px] font-bold uppercase tracking-wider" style={{ color: '#606070' }}>Markets</th>
                        <th className="text-center py-3 px-4 text-[10px] font-bold uppercase tracking-wider" style={{ color: '#606070' }}>Win %</th>
                        <th className="text-center py-3 px-4 text-[10px] font-bold uppercase tracking-wider" style={{ color: '#606070' }}>ROI</th>
                        <th className="text-center py-3 px-4 text-[10px] font-bold uppercase tracking-wider hidden md:table-cell" style={{ color: '#606070' }}>CLV Beat</th>
                        <th className="text-center py-3 px-4 text-[10px] font-bold uppercase tracking-wider hidden lg:table-cell" style={{ color: '#606070' }}>Focus</th>
                      </tr>
                    </thead>
                    <tbody>
                      {predictionCappers.map((capper, idx) => {
                        const sourceStyle = sourceStyles[capper.source.toLowerCase()] || sourceStyles.other
                        // Derive estimated win rate and ROI from CLV data
                        const estimatedWinRate = 50 + (capper.clvBeatRate - 50) * 0.3 // CLV correlates to win rate
                        const estimatedROI = capper.avgCLV * 1.5 // CLV is strong proxy for ROI
                        return (
                          <tr 
                            key={capper.id} 
                            className="group transition-all hover:bg-white/[0.03]"
                            style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}
                          >
                            {/* Rank */}
                            <td className="py-3 px-4">
                              {idx < 3 ? (
                                <div className="w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs"
                                     style={{ 
                                       background: idx === 0 ? 'linear-gradient(135deg, #FFD700, #FFA500)' : 
                                                  idx === 1 ? 'linear-gradient(135deg, #C0C0C0, #A0A0A0)' :
                                                  'linear-gradient(135deg, #CD7F32, #8B4513)',
                                       color: '#000'
                                     }}>
                                  {idx + 1}
                                </div>
                              ) : (
                                <span className="font-bold text-sm w-7 text-center" style={{ color: '#606070' }}>{idx + 1}</span>
                              )}
                            </td>
                            
                            {/* Capper */}
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-3">
                                <span className="text-2xl">{capper.avatarEmoji}</span>
                                <div>
                                  <span className="font-bold text-sm" style={{ color: '#FFF' }}>{capper.name}</span>
                                  {capper.verified && (
                                    <span className="ml-1 text-[8px] px-1 rounded" style={{ background: 'rgba(0,168,255,0.2)', color: '#00A8FF' }}>✓</span>
                                  )}
                                  <div className="text-[10px]" style={{ color: '#606070' }}>{capper.followers.toLocaleString()} followers</div>
                                </div>
                              </div>
                            </td>
                            
                            {/* Source Badge */}
                            <td className="py-3 px-4 text-center hidden sm:table-cell">
                              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold"
                                    style={{ background: sourceStyle.bg, color: sourceStyle.color }}>
                                <span>{sourceStyle.icon}</span>
                                {capper.source}
                              </span>
                            </td>
                            
                            {/* Markets (Specialties) */}
                            <td className="py-3 px-4 text-center">
                              <div className="flex flex-wrap justify-center gap-1">
                                {capper.specialties.slice(0, 2).map((m: MarketType) => (
                                  <span key={m} className="text-[9px] px-1.5 py-0.5 rounded" 
                                        style={{ background: 'rgba(255,255,255,0.05)', color: '#808090' }}>
                                    {m}
                                  </span>
                                ))}
                                {capper.specialties.length > 2 && (
                                  <span className="text-[9px] px-1.5 py-0.5 rounded" style={{ color: '#606070' }}>
                                    +{capper.specialties.length - 2}
                                  </span>
                                )}
                              </div>
                            </td>
                            
                            {/* Win % (estimated from CLV) */}
                            <td className="py-3 px-4 text-center">
                              <span className="font-black text-sm" style={{ 
                                color: estimatedWinRate >= 55 ? '#00FF88' : estimatedWinRate >= 50 ? '#FFD700' : '#FF4455' 
                              }}>
                                {estimatedWinRate.toFixed(1)}%
                              </span>
                            </td>
                            
                            {/* ROI (estimated from CLV) */}
                            <td className="py-3 px-4 text-center">
                              <span className="font-black text-sm" style={{ color: estimatedROI > 0 ? '#00FF88' : '#FF4455' }}>
                                {estimatedROI > 0 ? '+' : ''}{estimatedROI.toFixed(1)}%
                              </span>
                            </td>
                            
                            {/* CLV Beat Rate */}
                            <td className="py-3 px-4 text-center hidden md:table-cell">
                              <span className="text-xs font-bold px-2 py-1 rounded-lg" 
                                    style={{ 
                                      background: capper.clvBeatRate >= 60 ? 'rgba(0,255,136,0.15)' : 'rgba(255,215,0,0.15)',
                                      color: capper.clvBeatRate >= 60 ? '#00FF88' : '#FFD700'
                                    }}>
                                {capper.clvBeatRate.toFixed(1)}%
                              </span>
                            </td>
                            
                            {/* Focus (first specialty) */}
                            <td className="py-3 px-4 hidden lg:table-cell">
                              <span className="text-xs" style={{ color: '#808090' }}>{capper.specialties[0] || 'General'}</span>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
                
                {/* Analytics CTA */}
                <div className="p-4" style={{ background: 'rgba(255,107,0,0.05)', borderTop: '1px solid rgba(255,107,0,0.2)' }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-bold text-sm" style={{ color: '#FFF' }}>🧠 Want Edge-Finding Trends?</div>
                      <div className="text-xs" style={{ color: '#808090' }}>CLV tracking • RLM alerts • Public vs Sharp • Situational edges</div>
                    </div>
                    <Link href="/analytics" className="px-4 py-2 rounded-lg font-bold text-sm transition-all hover:scale-105"
                          style={{ background: 'linear-gradient(135deg, #FF6B00, #FF4455)', color: '#FFF' }}>
                      Open Edge Finder →
                    </Link>
                  </div>
                </div>
              </div>
            ) : (
              /* REGULAR LEADERBOARD TABLE */
              <div className="rounded-2xl overflow-hidden" style={{ background: '#0c0c14', border: '1px solid rgba(255,255,255,0.06)' }}>
                {/* Active Filter Badge */}
                {(betTypeFilter !== 'all' || sportFilter !== 'all') && (
                  <div className="px-4 py-2 flex items-center gap-2" style={{ background: 'rgba(255,107,0,0.1)', borderBottom: '1px solid rgba(255,107,0,0.2)' }}>
                    <Sparkles className="w-4 h-4" style={{ color: '#FF6B00' }} />
                    <span className="text-xs font-semibold" style={{ color: '#FF6B00' }}>
                      Showing {betTypeFilter !== 'all' ? betTypeFilter.toUpperCase() : ''} 
                      {betTypeFilter !== 'all' && sportFilter !== 'all' ? ' • ' : ''}
                      {sportFilter !== 'all' ? sportFilter : ''} picks
                    </span>
                  </div>
                )}
                
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                        <th className="text-left py-3 px-4 text-[10px] font-bold uppercase tracking-wider" style={{ color: '#606070' }}>Rank</th>
                        <th className="text-left py-3 px-4 text-[10px] font-bold uppercase tracking-wider" style={{ color: '#606070' }}>Capper</th>
                        <th className="text-center py-3 px-4 text-[10px] font-bold uppercase tracking-wider hidden sm:table-cell" style={{ color: '#606070' }}>Record</th>
                        <th className="text-center py-3 px-4 text-[10px] font-bold uppercase tracking-wider" style={{ color: '#606070' }}>Win %</th>
                        <th className="text-center py-3 px-4 text-[10px] font-bold uppercase tracking-wider" style={{ color: '#606070' }}>Units</th>
                        <th className="text-center py-3 px-4 text-[10px] font-bold uppercase tracking-wider hidden md:table-cell" style={{ color: '#606070' }}>ROI</th>
                        <th className="text-center py-3 px-4 text-[10px] font-bold uppercase tracking-wider" style={{ color: '#606070' }}>Streak</th>
                        <th className="text-left py-3 px-4 text-[10px] font-bold uppercase tracking-wider hidden lg:table-cell" style={{ color: '#606070' }}>Last Pick</th>
                        <th className="py-3 px-4" style={{ width: '40px' }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayEntries.map((entry, idx) => {
                        const isTop3 = idx < 3 && activeTab !== 'fade'
                        const isFade = activeTab === 'fade'
                        
                        return (
                          <tr 
                            key={entry.id} 
                            className="group transition-all hover:bg-white/[0.03] cursor-pointer"
                            style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}
                            onClick={() => window.location.href = `/leaderboard/${entry.slug}`}
                          >
                            {/* Rank */}
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-1.5">
                                {isTop3 && !isFade ? (
                                  <div className="w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs"
                                       style={{ 
                                         background: idx === 0 ? 'linear-gradient(135deg, #FFD700, #FFA500)' : 
                                                    idx === 1 ? 'linear-gradient(135deg, #C0C0C0, #A0A0A0)' :
                                                    'linear-gradient(135deg, #CD7F32, #8B4513)',
                                         color: '#000',
                                         boxShadow: idx === 0 ? '0 0 20px rgba(255,215,0,0.4)' : 'none'
                                       }}>
                                    {idx + 1}
                                  </div>
                                ) : (
                                  <span className="font-bold text-sm w-7 text-center" style={{ color: isFade ? '#FF4455' : '#606070' }}>
                                    {idx + 1}
                                  </span>
                                )}
                                {entry.rankChange !== 0 && (
                                  <span className="flex items-center text-[10px] font-bold" 
                                        style={{ color: entry.rankChange > 0 ? '#00FF88' : '#FF4455' }}>
                                    {entry.rankChange > 0 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                                    {Math.abs(entry.rankChange)}
                                  </span>
                                )}
                              </div>
                            </td>
                            
                            {/* Capper Info */}
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                                     style={{ background: 'rgba(255,255,255,0.05)' }}>
                                  {entry.avatarEmoji}
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-bold text-sm truncate" style={{ color: '#FFF' }}>{entry.name}</span>
                                    {entry.verified && (
                                      <span className="text-[8px] px-1.5 py-0.5 rounded font-bold" 
                                            style={{ background: 'rgba(0,168,255,0.2)', color: '#00A8FF' }}>✓</span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2 text-[10px]" style={{ color: '#606070' }}>
                                    {entry.network && <span>{entry.network}</span>}
                                    {entry.role && <span>• {entry.role}</span>}
                                  </div>
                                </div>
                              </div>
                            </td>
                            
                            {/* Record */}
                            <td className="py-3 px-4 text-center hidden sm:table-cell">
                              <span className="font-mono text-xs font-semibold" style={{ color: '#A0A0B0' }}>
                                {entry.record}
                              </span>
                            </td>
                            
                            {/* Win % */}
                            <td className="py-3 px-4 text-center">
                              <span className="font-black text-sm" style={{ 
                                color: entry.winPct >= 55 ? '#00FF88' : entry.winPct >= 50 ? '#FFD700' : '#FF4455' 
                              }}>
                                {entry.winPct.toFixed(1)}%
                              </span>
                            </td>
                            
                            {/* Units */}
                            <td className="py-3 px-4 text-center">
                              <span className="font-black text-sm" style={{ color: entry.units > 0 ? '#00FF88' : '#FF4455' }}>
                                {entry.units > 0 ? '+' : ''}{entry.units.toFixed(1)}
                              </span>
                            </td>
                            
                            {/* ROI */}
                            <td className="py-3 px-4 text-center hidden md:table-cell">
                              <span className="text-xs font-bold" style={{ color: entry.roi > 0 ? '#00FF88' : '#FF4455' }}>
                                {entry.roi > 0 ? '+' : ''}{entry.roi.toFixed(1)}%
                              </span>
                            </td>
                            
                            {/* Streak */}
                            <td className="py-3 px-4 text-center">
                              <span className="px-2.5 py-1 rounded-lg text-[11px] font-black"
                                    style={{ 
                                      background: entry.streak.startsWith('W') ? 'rgba(0,255,136,0.15)' : 'rgba(255,68,85,0.15)',
                                      color: entry.streak.startsWith('W') ? '#00FF88' : '#FF4455',
                                      border: entry.streak.startsWith('W') ? '1px solid rgba(0,255,136,0.3)' : '1px solid rgba(255,68,85,0.3)'
                                    }}>
                                {entry.streak}
                              </span>
                            </td>
                            
                            {/* Last Pick */}
                            <td className="py-3 px-4 hidden lg:table-cell">
                              {entry.lastPick && (
                                <div className="flex items-center gap-1.5">
                                  <span className="text-xs" style={{ color: '#808090' }}>{entry.lastPick}</span>
                                  {entry.lastPickResult && (
                                    <span className="text-xs" style={{ 
                                      color: entry.lastPickResult === 'win' ? '#00FF88' : 
                                             entry.lastPickResult === 'loss' ? '#FF4455' : '#FFD700' 
                                    }}>
                                      {entry.lastPickResult === 'win' ? '✅' : entry.lastPickResult === 'loss' ? '❌' : '➖'}
                                    </span>
                                  )}
                                </div>
                              )}
                            </td>
                            
                            {/* Compare & Action */}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <button 
                                onClick={(e) => { e.stopPropagation(); toggleCompare(entry); }}
                                className="p-1.5 rounded-lg transition-all hover:bg-white/10"
                                style={{ 
                                  background: isInCompareList(entry.id) ? 'rgba(0,168,255,0.2)' : 'transparent',
                                  border: isInCompareList(entry.id) ? '1px solid rgba(0,168,255,0.3)' : '1px solid transparent'
                                }}
                                title={isInCompareList(entry.id) ? 'Remove from comparison' : 'Add to comparison'}
                              >
                                {isInCompareList(entry.id) ? (
                                  <Scale className="w-4 h-4" style={{ color: '#00A8FF' }} />
                                ) : (
                                  <Plus className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: '#606070' }} />
                                )}
                              </button>
                              <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: '#606070' }} />
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
            )}
            
            {/* Admin Link */}
            <div className="mt-4 text-center">
              <Link href="/admin/picks" 
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all hover:bg-white/10"
                    style={{ color: '#606070' }}>
                <Settings className="w-4 h-4" />
                Admin: Manage Picks
              </Link>
            </div>
          </div>
          
          {/* Sidebar */}
          <div className="space-y-4">
            {/* 🔥 Hot Streaks */}
            <div className="rounded-2xl p-4" style={{ background: '#0c0c14', border: '1px solid rgba(0,255,136,0.2)' }}>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(0,255,136,0.15)' }}>
                  <Flame className="w-4 h-4" style={{ color: '#00FF88' }} />
                </div>
                <h3 className="font-bold text-sm" style={{ color: '#FFF' }}>🔥 Hot Streaks</h3>
              </div>
              <div className="space-y-2">
                {hotStreaks.map((c) => (
                  <Link href={`/leaderboard/${c.slug}`} key={c.id}
                        className="flex items-center justify-between p-3 rounded-xl transition-all hover:bg-white/5"
                        style={{ background: 'rgba(0,255,136,0.05)' }}>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{c.avatarEmoji}</span>
                      <div>
                        <span className="text-xs font-bold" style={{ color: '#FFF' }}>{c.name}</span>
                        {c.network && <div className="text-[10px]" style={{ color: '#606070' }}>{c.network}</div>}
                      </div>
                    </div>
                    <span className="text-xs font-black px-2 py-1 rounded-lg" 
                          style={{ background: 'rgba(0,255,136,0.2)', color: '#00FF88' }}>
                      {c.streak}
                    </span>
                  </Link>
                ))}
              </div>
            </div>

            {/* ❄️ Cold Streaks - FADE ALERT */}
            <div className="rounded-2xl p-4" style={{ background: '#0c0c14', border: '1px solid rgba(255,68,85,0.3)' }}>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(255,68,85,0.15)' }}>
                  <TrendingDown className="w-4 h-4" style={{ color: '#FF4455' }} />
                </div>
                <h3 className="font-bold text-sm" style={{ color: '#FF4455' }}>❄️ FADE THESE</h3>
              </div>
              <div className="space-y-2">
                {coldStreaks.map((c) => (
                  <Link href={`/leaderboard/${c.slug}`} key={c.id}
                        className="flex items-center justify-between p-3 rounded-xl transition-all hover:bg-white/5"
                        style={{ background: 'rgba(255,68,85,0.05)' }}>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{c.avatarEmoji}</span>
                      <div>
                        <span className="text-xs font-bold" style={{ color: '#FFF' }}>{c.name}</span>
                        <div className="text-[10px]" style={{ color: '#FF4455' }}>{c.winPct.toFixed(1)}% win rate</div>
                      </div>
                    </div>
                    <span className="text-xs font-black px-2 py-1 rounded-lg" 
                          style={{ background: 'rgba(255,68,85,0.2)', color: '#FF4455' }}>
                      {c.streak}
                    </span>
                  </Link>
                ))}
              </div>
            </div>

            {/* 📺 Network Breakdown */}
            <div className="rounded-2xl p-4" style={{ background: '#0c0c14', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(255,215,0,0.15)' }}>
                  <Tv className="w-4 h-4" style={{ color: '#FFD700' }} />
                </div>
                <h3 className="font-bold text-sm" style={{ color: '#FFF' }}>📺 By Network</h3>
              </div>
              <div className="space-y-3">
                {[
                  { name: 'ESPN', winPct: 48.2, color: '#FF6B00', emoji: '📺' },
                  { name: 'FS1/FOX', winPct: 41.4, color: '#00A8FF', emoji: '🦊' },
                  { name: 'TNT', winPct: 47.5, color: '#9B59B6', emoji: '🏀' },
                  { name: 'CBS', winPct: 55.9, color: '#00FF88', emoji: '📻' },
                  { name: 'Podcast', winPct: 53.3, color: '#FFD700', emoji: '🎙️' },
                ].map((n) => (
                  <div key={n.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{n.emoji}</span>
                      <span className="text-xs font-semibold" style={{ color: '#A0A0B0' }}>{n.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
                        <div className="h-full rounded-full" style={{ 
                          width: `${n.winPct}%`, 
                          background: n.winPct >= 50 ? '#00FF88' : '#FF4455' 
                        }} />
                      </div>
                      <span className="text-xs font-bold w-12 text-right" style={{ color: n.winPct >= 50 ? '#00FF88' : '#FF4455' }}>
                        {n.winPct}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Biggest Losers (Units) */}
            <div className="rounded-2xl p-4" style={{ background: 'linear-gradient(135deg, rgba(255,68,85,0.1) 0%, rgba(255,68,85,0.05) 100%)', border: '1px solid rgba(255,68,85,0.2)' }}>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">💸</span>
                <h3 className="font-bold text-sm" style={{ color: '#FF4455' }}>Biggest Losers</h3>
              </div>
              <div className="space-y-2">
                {worstByUnits.map((c) => (
                  <Link href={`/leaderboard/${c.slug}`} key={c.id}
                        className="flex items-center justify-between p-2 rounded-lg transition-all hover:bg-white/5">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{c.avatarEmoji}</span>
                      <span className="text-xs font-semibold" style={{ color: '#FFF' }}>{c.name}</span>
                    </div>
                    <span className="text-xs font-black" style={{ color: '#FF4455' }}>
                      {c.units.toFixed(1)}u
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Floating Compare Bar */}
      {compareList.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-50 p-4" style={{ background: 'linear-gradient(180deg, transparent 0%, #0c0c14 20%)' }}>
          <div className="max-w-4xl mx-auto rounded-2xl p-4 flex items-center justify-between"
               style={{ background: 'rgba(12,12,20,0.98)', border: '1px solid rgba(0,168,255,0.4)', boxShadow: '0 -10px 40px rgba(0,0,0,0.5)' }}>
            <div className="flex items-center gap-4">
              <Scale className="w-5 h-5" style={{ color: '#00A8FF' }} />
              <span className="font-bold text-sm" style={{ color: '#FFF' }}>
                {compareList.length}/4 Selected
              </span>
              <div className="flex items-center gap-2">
                {compareList.map(c => (
                  <div key={c.id} className="flex items-center gap-1 px-2 py-1 rounded-lg" 
                       style={{ background: 'rgba(255,255,255,0.1)' }}>
                    <span className="text-lg">{c.avatarEmoji}</span>
                    <span className="text-xs font-semibold" style={{ color: '#FFF' }}>{c.name.split(' ')[0]}</span>
                    <button onClick={() => toggleCompare(c)} className="ml-1 hover:bg-white/20 rounded p-0.5">
                      <X className="w-3 h-3" style={{ color: '#FF4455' }} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setCompareList([])}
                className="px-3 py-2 rounded-lg text-xs font-semibold transition-all"
                style={{ background: 'rgba(255,68,85,0.2)', color: '#FF4455' }}
              >
                Clear
              </button>
              <button 
                onClick={() => setShowComparison(true)}
                className="px-4 py-2 rounded-lg text-sm font-bold transition-all hover:opacity-90"
                style={{ background: 'linear-gradient(135deg, #00A8FF, #9B59B6)', color: '#FFF' }}
              >
                Compare Now →
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Comparison Modal */}
      {showComparison && compareList.length >= 2 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.9)' }}>
          <div className="max-w-5xl w-full max-h-[90vh] overflow-y-auto rounded-3xl" style={{ background: '#0c0c14', border: '1px solid rgba(0,168,255,0.3)' }}>
            {/* Header */}
            <div className="p-6 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              <div className="flex items-center gap-3">
                <Scale className="w-6 h-6" style={{ color: '#00A8FF' }} />
                <h2 className="text-2xl font-black" style={{ color: '#FFF' }}>Head-to-Head Comparison</h2>
              </div>
              <button onClick={() => setShowComparison(false)} className="p-2 rounded-lg hover:bg-white/10 transition-all">
                <X className="w-6 h-6" style={{ color: '#808090' }} />
              </button>
            </div>
            
            {/* Comparison Grid */}
            <div className="p-6">
              <div className={`grid gap-4`} style={{ gridTemplateColumns: `repeat(${compareList.length}, minmax(0, 1fr))` }}>
                {compareList.map((capper, idx) => {
                  const summary = getCapperSummary(capper.id)
                  return (
                    <div key={capper.id} className="rounded-2xl p-4" 
                         style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)' }}>
                      {/* Capper Header */}
                      <div className="text-center mb-4">
                        <span className="text-4xl">{capper.avatarEmoji}</span>
                        <h3 className="font-bold mt-2" style={{ color: '#FFF' }}>{capper.name}</h3>
                        <p className="text-xs" style={{ color: '#808090' }}>{capper.network}</p>
                      </div>
                      
                      {/* Stats */}
                      <div className="space-y-3">
                        <ComparisonStat label="Win %" value={`${capper.winPct.toFixed(1)}%`} 
                                       color={capper.winPct >= 55 ? '#00FF88' : capper.winPct >= 50 ? '#FFD700' : '#FF4455'} />
                        <ComparisonStat label="Units" value={`${capper.units > 0 ? '+' : ''}${capper.units.toFixed(1)}`} 
                                       color={capper.units > 0 ? '#00FF88' : '#FF4455'} />
                        <ComparisonStat label="ROI" value={`${capper.roi > 0 ? '+' : ''}${capper.roi.toFixed(1)}%`} 
                                       color={capper.roi > 0 ? '#00FF88' : '#FF4455'} />
                        <ComparisonStat label="Record" value={capper.record} color="#FFF" />
                        <ComparisonStat label="Streak" value={capper.streak} 
                                       color={capper.streak.startsWith('W') ? '#00FF88' : '#FF4455'} />
                      </div>
                      
                      {/* AI Summary */}
                      {summary && (
                        <div className="mt-4 p-3 rounded-xl" style={{ background: 'rgba(155,89,182,0.1)', border: '1px solid rgba(155,89,182,0.2)' }}>
                          <div className="flex items-center gap-1 mb-2">
                            <Brain className="w-3 h-3" style={{ color: '#9B59B6' }} />
                            <span className="text-[10px] font-bold" style={{ color: '#9B59B6' }}>AI INSIGHT</span>
                          </div>
                          <p className="text-xs" style={{ color: '#E0E0E0' }}>
                            {summary.keyInsights[0]?.replace(/^[🚫💔📉🔥💰⚡]+\s*/, '')}
                          </p>
                          <div className="mt-2 pt-2" style={{ borderTop: '1px solid rgba(155,89,182,0.2)' }}>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded"
                                  style={{ 
                                    background: summary.recommendation === 'follow' ? 'rgba(0,255,136,0.2)' : 
                                               summary.recommendation === 'fade' ? 'rgba(255,68,85,0.2)' : 'rgba(255,215,0,0.2)',
                                    color: summary.recommendation === 'follow' ? '#00FF88' : 
                                           summary.recommendation === 'fade' ? '#FF4455' : '#FFD700'
                                  }}>
                              {summary.recommendation.toUpperCase()}
                            </span>
                          </div>
                        </div>
                      )}
                      
                      <Link href={`/leaderboard/${capper.slug}`}
                            className="mt-4 block w-full py-2 rounded-lg text-center text-xs font-bold transition-all hover:opacity-80"
                            style={{ background: 'rgba(0,168,255,0.2)', color: '#00A8FF' }}>
                        View Full Profile →
                      </Link>
                    </div>
                  )
                })}
              </div>
              
              {/* Summary Insights */}
              <div className="mt-6 p-4 rounded-2xl" style={{ background: 'rgba(0,255,136,0.1)', border: '1px solid rgba(0,255,136,0.2)' }}>
                <div className="flex items-center gap-2 mb-3">
                  <Zap className="w-5 h-5" style={{ color: '#00FF88' }} />
                  <h3 className="font-bold" style={{ color: '#00FF88' }}>Quick Verdict</h3>
                </div>
                {(() => {
                  const best = [...compareList].sort((a, b) => b.units - a.units)[0]
                  const worst = [...compareList].sort((a, b) => a.units - b.units)[0]
                  return (
                    <div className="grid sm:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span style={{ color: '#808090' }}>Best Performer: </span>
                        <span className="font-bold" style={{ color: '#00FF88' }}>{best.name}</span>
                        <span style={{ color: '#808090' }}> ({best.units > 0 ? '+' : ''}{best.units.toFixed(1)}u)</span>
                      </div>
                      <div>
                        <span style={{ color: '#808090' }}>Fade Candidate: </span>
                        <span className="font-bold" style={{ color: '#FF4455' }}>{worst.name}</span>
                        <span style={{ color: '#808090' }}> ({worst.units.toFixed(1)}u)</span>
                      </div>
                    </div>
                  )
                })()}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ComparisonStat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="flex items-center justify-between p-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)' }}>
      <span className="text-xs" style={{ color: '#808090' }}>{label}</span>
      <span className="font-bold text-sm" style={{ color }}>{value}</span>
    </div>
  )
}
