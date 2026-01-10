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
  ChevronDown,
  ChevronUp,
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
  Award,
  Info
} from 'lucide-react'
import { getLeaderboardEntries, capperStats, getHallOfShame, getHallOfGlory, type LeaderboardEntry, type CapperAppearance } from '@/lib/leaderboard-data'
import { predictionCappers, analyticsSummary, MarketType } from '@/lib/prediction-market-data'
import { BetType, Sport } from '@/types/leaderboard'
import { getCapperSummary, type CapperAnalyticsSummary } from '@/lib/analytics-data'
import { QuickShareButton } from '@/components/share/ShareExpertButton'

// Top-level mode: Sports betting vs Prediction Markets
type EdgeMode = 'sports' | 'markets'

type ActiveTab = 'all' | 'celebrity' | 'pro' | 'community' | 'fade'

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

// Network styles for filtering
const networkStyles: Record<string, { bg: string, color: string }> = {
  all: { bg: 'rgba(255,255,255,0.1)', color: '#A0A0B0' },
  ESPN: { bg: 'rgba(255,0,0,0.2)', color: '#FF0000' },
  FS1: { bg: 'rgba(0,100,255,0.2)', color: '#0064FF' },
  TNT: { bg: 'rgba(255,215,0,0.2)', color: '#FFD700' },
  CBS: { bg: 'rgba(0,168,255,0.2)', color: '#00A8FF' },
  Podcast: { bg: 'rgba(138,43,226,0.2)', color: '#9B59B6' },
  Twitter: { bg: 'rgba(29,161,242,0.2)', color: '#1DA1F2' },
  Independent: { bg: 'rgba(0,255,136,0.2)', color: '#00FF88' },
}

// Time period options with days mapping
type TimePeriod = 'today' | '3days' | 'week' | '2weeks' | 'month' | 'season' | 'all'
const timePeriods: { id: TimePeriod, label: string, days: number | null }[] = [
  { id: 'today', label: 'Today', days: 1 },
  { id: '3days', label: '3 Days', days: 3 },
  { id: 'week', label: '7 Days', days: 7 },
  { id: '2weeks', label: '14 Days', days: 14 },
  { id: 'month', label: '30 Days', days: 30 },
  { id: 'season', label: 'Season', days: 120 },
  { id: 'all', label: 'All Time', days: null },
]

export default function LeaderboardPage() {
  // Top-level mode: Sports betting vs Prediction Markets
  const [edgeMode, setEdgeMode] = useState<EdgeMode>('sports')
  const [activeTab, setActiveTab] = useState<ActiveTab>('celebrity')
  const [betTypeFilter, setBetTypeFilter] = useState<BetType | 'all'>('all')
  const [sportFilter, setSportFilter] = useState<Sport | 'all'>('all')
  const [networkFilter, setNetworkFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'units' | 'winPct' | 'roi' | 'picks' | 'record' | 'streak'>('units')
  const [compareList, setCompareList] = useState<LeaderboardEntry[]>([])
  const [showComparison, setShowComparison] = useState(false)
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('all')
  const [expandedHotStreaks, setExpandedHotStreaks] = useState(false)
  const [expandedColdStreaks, setExpandedColdStreaks] = useState(false)
  const [expandedLosers, setExpandedLosers] = useState(false)
  const [expandedHallOfShame, setExpandedHallOfShame] = useState(false)
  const [expandedHallOfGlory, setExpandedHallOfGlory] = useState(false)
  const [showFilters, setShowFilters] = useState(true)
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 25
  
  // Get Hall of Shame/Glory data
  const hallOfShame = useMemo(() => getHallOfShame(), [])
  const hallOfGlory = useMemo(() => getHallOfGlory(), [])
  
  // Map time period to days for filtering
  const filterDays = useMemo(() => {
    const period = timePeriods.find(p => p.id === timePeriod)
    return period?.days ?? null
  }, [timePeriod])
  
  const displayEntries = useMemo(() => {
    let entries = getLeaderboardEntries({ 
      capperType: activeTab === 'fade' || activeTab === 'all' ? 'all' : activeTab,
      betType: betTypeFilter === 'all' ? undefined : betTypeFilter,
      sport: sportFilter === 'all' ? undefined : sportFilter,
      sortBy,
      daysBack: filterDays // Pass days filter instead of year
    })
    
    // Filter by network if set
    if (networkFilter !== 'all') {
      entries = entries.filter(e => e.network === networkFilter)
    }
    
    // For fade tab, show worst performers
    if (activeTab === 'fade') {
      entries = [...entries].sort((a, b) => a.winPct - b.winPct).slice(0, 10)
    }
    
    return entries
  }, [activeTab, betTypeFilter, sportFilter, sortBy, filterDays, networkFilter])

  // Reset page when filters change
  useMemo(() => {
    setCurrentPage(1)
  }, [activeTab, betTypeFilter, sportFilter, sortBy, filterDays, networkFilter])

  // Pagination calculations
  const totalPages = Math.ceil(displayEntries.length / ITEMS_PER_PAGE)
  const paginatedEntries = displayEntries.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  // Computed stats - SHOW ALL DATA
  const allEntries = getLeaderboardEntries({ capperType: 'all' })
  const hotStreaks = allEntries
    .filter(c => c.streak.startsWith('W') && parseInt(c.streak.slice(1)) >= 3)
    .sort((a, b) => parseInt(b.streak.slice(1)) - parseInt(a.streak.slice(1))) // No slice - show all
  
  const coldStreaks = allEntries
    .filter(c => c.streak.startsWith('L') && parseInt(c.streak.slice(1)) >= 3)
    .sort((a, b) => parseInt(b.streak.slice(1)) - parseInt(a.streak.slice(1))) // No slice - show all
  
  const topByUnits = [...allEntries].sort((a, b) => b.units - a.units) // No slice - show all
  const worstByUnits = [...allEntries].sort((a, b) => a.units - b.units) // No slice - show all

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
                src="/wrong-stamp.jpeg" 
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
        
        {/* TOP-LEVEL MODE SWITCHER: Sports vs Markets */}
        <div className="flex items-center justify-center mb-6">
          <div className="flex p-1.5 rounded-2xl" style={{ background: '#0c0c14', border: '1px solid rgba(255,255,255,0.1)' }}>
            <button
              onClick={() => setEdgeMode('sports')}
              className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all"
              style={{
                background: edgeMode === 'sports' ? 'linear-gradient(135deg, #FF6B00 0%, #FF8C40 100%)' : 'transparent',
                color: edgeMode === 'sports' ? '#FFF' : '#808090',
                boxShadow: edgeMode === 'sports' ? '0 4px 15px rgba(255,107,0,0.4)' : 'none'
              }}
            >
              <span className="text-lg">🏈</span>
              Sports Betting
            </button>
            <button
              onClick={() => setEdgeMode('markets')}
              className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all"
              style={{
                background: edgeMode === 'markets' ? 'linear-gradient(135deg, #9B59B6 0%, #B07CC6 100%)' : 'transparent',
                color: edgeMode === 'markets' ? '#FFF' : '#808090',
                boxShadow: edgeMode === 'markets' ? '0 4px 15px rgba(155,89,182,0.4)' : 'none'
              }}
            >
              <span className="text-lg">📊</span>
              Prediction Markets
            </button>
          </div>
        </div>
        
        {/* Show different content based on mode */}
        {edgeMode === 'sports' ? (
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
                
                {/* Time Period Filter - GRANULAR */}
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" style={{ color: '#00FF88' }} />
                  <span className="text-xs font-semibold" style={{ color: '#606070' }}>TIME:</span>
                  <div className="flex gap-1 flex-wrap">
                    {timePeriods.map((tp) => (
                      <button
                        key={tp.id}
                        onClick={() => setTimePeriod(tp.id)}
                        className="px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all"
                        style={{
                          background: timePeriod === tp.id ? 'rgba(0,255,136,0.2)' : 'rgba(255,255,255,0.05)',
                          color: timePeriod === tp.id ? '#00FF88' : '#808090',
                          border: timePeriod === tp.id ? '1px solid rgba(0,255,136,0.3)' : '1px solid transparent'
                        }}>
                        {tp.label}
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Network Filter */}
                <div className="flex items-center gap-2 ml-auto">
                  <Tv className="w-4 h-4" style={{ color: '#FF6B00' }} />
                  <span className="text-xs font-semibold" style={{ color: '#606070' }}>NETWORK:</span>
                  <div className="flex gap-1 flex-wrap">
                    {Object.keys(networkStyles).map((network) => (
                      <button
                        key={network}
                        onClick={() => setNetworkFilter(network)}
                        className="px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all"
                        style={{
                          background: networkFilter === network ? networkStyles[network].bg : 'rgba(255,255,255,0.05)',
                          color: networkFilter === network ? networkStyles[network].color : '#808090',
                          border: networkFilter === network ? `1px solid ${networkStyles[network].color}40` : '1px solid transparent'
                        }}>
                        {network === 'all' ? 'All' : network}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Leaderboard Table */}
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
                        <th 
                          className="text-center py-3 px-4 text-[10px] font-bold uppercase tracking-wider hidden sm:table-cell cursor-pointer hover:text-white transition-colors group"
                          style={{ color: sortBy === 'record' ? '#00A8FF' : '#606070' }}
                          onClick={() => setSortBy('record')}
                          title="Wins-Losses record for the selected time period. Click to sort."
                        >
                          <span className="inline-flex items-center gap-1">
                            Record
                            {sortBy === 'record' && <span className="text-[8px]">▼</span>}
                          </span>
                        </th>
                        <th 
                          className="text-center py-3 px-4 text-[10px] font-bold uppercase tracking-wider cursor-pointer hover:text-white transition-colors"
                          style={{ color: sortBy === 'winPct' ? '#00A8FF' : '#606070' }}
                          onClick={() => setSortBy('winPct')}
                          title="Win percentage - total wins divided by total picks. Click to sort."
                        >
                          <span className="inline-flex items-center gap-1">
                            Win %
                            {sortBy === 'winPct' && <span className="text-[8px]">▼</span>}
                          </span>
                        </th>
                        <th 
                          className="text-center py-3 px-4 text-[10px] font-bold uppercase tracking-wider cursor-pointer hover:text-white transition-colors"
                          style={{ color: sortBy === 'units' ? '#00A8FF' : '#606070' }}
                          onClick={() => setSortBy('units')}
                          title="Net units won/lost. 1 unit = standard bet size. Positive means profit. Click to sort."
                        >
                          <span className="inline-flex items-center gap-1">
                            Units
                            {sortBy === 'units' && <span className="text-[8px]">▼</span>}
                          </span>
                        </th>
                        <th 
                          className="text-center py-3 px-4 text-[10px] font-bold uppercase tracking-wider hidden md:table-cell cursor-pointer hover:text-white transition-colors"
                          style={{ color: sortBy === 'roi' ? '#00A8FF' : '#606070' }}
                          onClick={() => setSortBy('roi')}
                          title="Return on Investment - percentage profit/loss relative to total units wagered. Click to sort."
                        >
                          <span className="inline-flex items-center gap-1">
                            ROI
                            {sortBy === 'roi' && <span className="text-[8px]">▼</span>}
                          </span>
                        </th>
                        <th 
                          className="text-center py-3 px-4 text-[10px] font-bold uppercase tracking-wider cursor-pointer hover:text-white transition-colors"
                          style={{ color: sortBy === 'streak' ? '#00A8FF' : '#606070' }}
                          onClick={() => setSortBy('streak')}
                          title="Current win/loss streak. W = consecutive wins, L = consecutive losses. Click to sort."
                        >
                          <span className="inline-flex items-center gap-1">
                            Streak
                            {sortBy === 'streak' && <span className="text-[8px]">▼</span>}
                          </span>
                        </th>
                        <th className="text-left py-3 px-4 text-[10px] font-bold uppercase tracking-wider hidden lg:table-cell" style={{ color: '#606070' }} title="Most recent pick made by this capper">Last Pick</th>
                        <th className="py-3 px-4" style={{ width: '40px' }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedEntries.map((entry, idx) => {
                        const globalIdx = (currentPage - 1) * ITEMS_PER_PAGE + idx
                        const isTop3 = globalIdx < 3 && activeTab !== 'fade'
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
                                         background: globalIdx === 0 ? 'linear-gradient(135deg, #FFD700, #FFA500)' : 
                                                    globalIdx === 1 ? 'linear-gradient(135deg, #C0C0C0, #A0A0A0)' :
                                                    'linear-gradient(135deg, #CD7F32, #8B4513)',
                                         color: '#000',
                                         boxShadow: globalIdx === 0 ? '0 0 20px rgba(255,215,0,0.4)' : 'none'
                                       }}>
                                    {globalIdx + 1}
                                  </div>
                                ) : (
                                  <span className="font-bold text-sm w-7 text-center" style={{ color: isFade ? '#FF4455' : '#606070' }}>
                                    {globalIdx + 1}
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
                            
                            {/* Share & Compare */}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              {/* Share Button - Expose/Praise */}
                              <div onClick={(e) => e.stopPropagation()}>
                                <QuickShareButton
                                  expertName={entry.name}
                                  expertSlug={entry.slug}
                                  winPct={entry.winPct}
                                  units={entry.units}
                                />
                              </div>
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
              
              {/* Pagination Controls - Always show */}
              <div className="flex items-center justify-between px-4 py-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="text-xs" style={{ color: '#606070' }}>
                  Showing {displayEntries.length === 0 ? 0 : ((currentPage - 1) * ITEMS_PER_PAGE) + 1}-{Math.min(currentPage * ITEMS_PER_PAGE, displayEntries.length)} of {displayEntries.length} experts
                </div>
                {totalPages > 1 && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/10"
                    style={{ color: '#A0A0B0', border: '1px solid rgba(255,255,255,0.1)' }}
                    title="First page"
                  >
                    First
                  </button>
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/10"
                    style={{ color: '#A0A0B0', border: '1px solid rgba(255,255,255,0.1)' }}
                    title="Previous page"
                  >
                    ← Prev
                  </button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum: number
                      if (totalPages <= 5) {
                        pageNum = i + 1
                      } else if (currentPage <= 3) {
                        pageNum = i + 1
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i
                      } else {
                        pageNum = currentPage - 2 + i
                      }
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className="w-8 h-8 rounded-lg text-xs font-bold transition-all"
                          style={{ 
                            background: currentPage === pageNum ? 'rgba(0,168,255,0.2)' : 'transparent',
                            color: currentPage === pageNum ? '#00A8FF' : '#606070',
                            border: currentPage === pageNum ? '1px solid rgba(0,168,255,0.3)' : '1px solid transparent'
                          }}
                        >
                          {pageNum}
                        </button>
                      )
                    })}
                  </div>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/10"
                    style={{ color: '#A0A0B0', border: '1px solid rgba(255,255,255,0.1)' }}
                    title="Next page"
                  >
                    Next →
                  </button>
                  <button
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/10"
                    style={{ color: '#A0A0B0', border: '1px solid rgba(255,255,255,0.1)' }}
                    title="Last page"
                  >
                    Last
                  </button>
                </div>
                )}
              </div>
            </div>
            
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
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(0,255,136,0.15)' }}>
                    <Flame className="w-4 h-4" style={{ color: '#00FF88' }} />
                  </div>
                  <h3 className="font-bold text-sm" style={{ color: '#FFF' }}>🔥 Hot Streaks</h3>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded" style={{ background: 'rgba(0,255,136,0.1)', color: '#00FF88' }}>
                  {hotStreaks.length} total
                </span>
              </div>
              <div className="space-y-2">
                {(expandedHotStreaks ? hotStreaks : hotStreaks.slice(0, 5)).map((c) => (
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
              {hotStreaks.length > 5 && (
                <button
                  onClick={() => setExpandedHotStreaks(!expandedHotStreaks)}
                  className="mt-3 w-full flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-semibold transition-all hover:bg-white/5"
                  style={{ color: '#00FF88' }}
                >
                  {expandedHotStreaks ? (
                    <>
                      <ChevronUp className="w-3 h-3" />
                      Show Less
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-3 h-3" />
                      Show All {hotStreaks.length}
                    </>
                  )}
                </button>
              )}
            </div>

            {/* ❄️ Cold Streaks - FADE ALERT */}
            <div className="rounded-2xl p-4" style={{ background: '#0c0c14', border: '1px solid rgba(255,68,85,0.3)' }}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(255,68,85,0.15)' }}>
                    <TrendingDown className="w-4 h-4" style={{ color: '#FF4455' }} />
                  </div>
                  <h3 className="font-bold text-sm" style={{ color: '#FF4455' }}>❄️ FADE THESE</h3>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded" style={{ background: 'rgba(255,68,85,0.1)', color: '#FF4455' }}>
                  {coldStreaks.length} total
                </span>
              </div>
              <div className="space-y-2">
                {(expandedColdStreaks ? coldStreaks : coldStreaks.slice(0, 5)).map((c) => (
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
              {coldStreaks.length > 5 && (
                <button
                  onClick={() => setExpandedColdStreaks(!expandedColdStreaks)}
                  className="mt-3 w-full flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-semibold transition-all hover:bg-white/5"
                  style={{ color: '#FF4455' }}
                >
                  {expandedColdStreaks ? (
                    <>
                      <ChevronUp className="w-3 h-3" />
                      Show Less
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-3 h-3" />
                      Show All {coldStreaks.length}
                    </>
                  )}
                </button>
              )}
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
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg">💸</span>
                  <h3 className="font-bold text-sm" style={{ color: '#FF4455' }}>Biggest Losers</h3>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded" style={{ background: 'rgba(255,68,85,0.1)', color: '#FF4455' }}>
                  {worstByUnits.length} total
                </span>
              </div>
              <div className="space-y-2">
                {(expandedLosers ? worstByUnits : worstByUnits.slice(0, 5)).map((c) => (
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
              {worstByUnits.length > 5 && (
                <button
                  onClick={() => setExpandedLosers(!expandedLosers)}
                  className="mt-3 w-full flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-semibold transition-all hover:bg-white/5"
                  style={{ color: '#FF4455' }}
                >
                  {expandedLosers ? (
                    <>
                      <ChevronUp className="w-3 h-3" />
                      Show Less
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-3 h-3" />
                      Show All {worstByUnits.length}
                    </>
                  )}
                </button>
              )}
            </div>

            {/* 🏆 HALL OF SHAME - Historical Appearances */}
            <div className="rounded-2xl p-4" style={{ background: 'linear-gradient(135deg, rgba(128,0,128,0.15) 0%, rgba(255,68,85,0.1) 100%)', border: '1px solid rgba(255,68,85,0.3)' }}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🏆</span>
                  <div>
                    <h3 className="font-bold text-sm" style={{ color: '#FF4455' }}>Hall of Shame</h3>
                    <p className="text-[9px]" style={{ color: '#808090' }}>All-time list appearances</p>
                  </div>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded" style={{ background: 'rgba(255,68,85,0.2)', color: '#FF4455' }}>
                  {hallOfShame.length} cappers
                </span>
              </div>
              <div className="space-y-2">
                {(expandedHallOfShame ? hallOfShame : hallOfShame.slice(0, 5)).map((c, idx) => (
                  <Link href={`/leaderboard/${c.slug}`} key={c.capperId}
                        className="flex items-center justify-between p-3 rounded-xl transition-all hover:bg-white/5"
                        style={{ 
                          background: idx === 0 ? 'rgba(255,68,85,0.15)' : 'rgba(255,255,255,0.02)',
                          border: idx === 0 ? '1px solid rgba(255,68,85,0.3)' : 'none'
                        }}>
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <span className="text-lg">{c.avatarEmoji}</span>
                        {idx === 0 && (
                          <span className="absolute -top-1 -right-1 text-[10px]">👑</span>
                        )}
                      </div>
                      <div>
                        <span className="text-xs font-bold" style={{ color: '#FFF' }}>{c.name}</span>
                        <div className="flex gap-2 text-[9px]" style={{ color: '#808090' }}>
                          <span>❄️ {c.coldStreakAppearances}x</span>
                          <span>🔥 {c.fadeAlertAppearances}x</span>
                          <span>💸 {c.biggestLoserAppearances}x</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-black" style={{ color: '#FF4455' }}>
                        {c.totalShameAppearances}
                      </span>
                      <div className="text-[9px]" style={{ color: '#808090' }}>total</div>
                    </div>
                  </Link>
                ))}
              </div>
              {hallOfShame.length > 5 && (
                <button
                  onClick={() => setExpandedHallOfShame(!expandedHallOfShame)}
                  className="mt-3 w-full flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-semibold transition-all hover:bg-white/5"
                  style={{ color: '#FF4455' }}
                >
                  {expandedHallOfShame ? (
                    <>
                      <ChevronUp className="w-3 h-3" />
                      Show Less
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-3 h-3" />
                      View All {hallOfShame.length}
                    </>
                  )}
                </button>
              )}
            </div>

            {/* ⭐ HALL OF GLORY - Best Performers */}
            <div className="rounded-2xl p-4" style={{ background: 'linear-gradient(135deg, rgba(255,215,0,0.1) 0%, rgba(0,255,136,0.1) 100%)', border: '1px solid rgba(255,215,0,0.3)' }}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">⭐</span>
                  <div>
                    <h3 className="font-bold text-sm" style={{ color: '#FFD700' }}>Hall of Glory</h3>
                    <p className="text-[9px]" style={{ color: '#808090' }}>Most hot streak appearances</p>
                  </div>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded" style={{ background: 'rgba(255,215,0,0.2)', color: '#FFD700' }}>
                  {hallOfGlory.length} cappers
                </span>
              </div>
              <div className="space-y-2">
                {(expandedHallOfGlory ? hallOfGlory : hallOfGlory.slice(0, 5)).map((c, idx) => (
                  <Link href={`/leaderboard/${c.slug}`} key={c.capperId}
                        className="flex items-center justify-between p-3 rounded-xl transition-all hover:bg-white/5"
                        style={{ 
                          background: idx === 0 ? 'rgba(255,215,0,0.15)' : 'rgba(255,255,255,0.02)',
                          border: idx === 0 ? '1px solid rgba(255,215,0,0.3)' : 'none'
                        }}>
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <span className="text-lg">{c.avatarEmoji}</span>
                        {idx === 0 && (
                          <span className="absolute -top-1 -right-1 text-[10px]">🏆</span>
                        )}
                      </div>
                      <div>
                        <span className="text-xs font-bold" style={{ color: '#FFF' }}>{c.name}</span>
                        <div className="flex gap-2 text-[9px]" style={{ color: '#808090' }}>
                          <span>🔥 {c.hotStreakAppearances}x</span>
                          <span>🏆 {c.topPerformerAppearances}x</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-black" style={{ color: '#00FF88' }}>
                        {c.totalGloryAppearances}
                      </span>
                      <div className="text-[9px]" style={{ color: '#808090' }}>total</div>
                    </div>
                  </Link>
                ))}
              </div>
              {hallOfGlory.length > 5 && (
                <button
                  onClick={() => setExpandedHallOfGlory(!expandedHallOfGlory)}
                  className="mt-3 w-full flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-semibold transition-all hover:bg-white/5"
                  style={{ color: '#FFD700' }}
                >
                  {expandedHallOfGlory ? (
                    <>
                      <ChevronUp className="w-3 h-3" />
                      Show Less
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-3 h-3" />
                      View All {hallOfGlory.length}
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
        ) : (
          /* PREDICTION MARKETS MODE - Completely separate from sports */
          <div className="space-y-6">
            {/* Markets Header */}
            <div className="rounded-2xl p-6" style={{ background: 'linear-gradient(135deg, rgba(155,89,182,0.1) 0%, rgba(138,43,226,0.05) 100%)', border: '1px solid rgba(155,89,182,0.3)' }}>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-black flex items-center gap-2" style={{ color: '#9B59B6' }}>
                    <Target className="w-6 h-6" />
                    Prediction Market Experts
                  </h2>
                  <p className="text-sm mt-1" style={{ color: '#808090' }}>
                    Top traders on Polymarket, Kalshi, PredictIt • Verified on-chain performance
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Link href="/markets" className="px-4 py-2 rounded-xl font-bold text-sm transition-all hover:opacity-80"
                        style={{ background: 'rgba(155,89,182,0.2)', color: '#9B59B6', border: '1px solid rgba(155,89,182,0.3)' }}>
                    Browse Markets →
                  </Link>
                </div>
              </div>
              
              {/* Market Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                <div className="p-3 rounded-xl text-center" style={{ background: 'rgba(255,255,255,0.03)' }}>
                  <div className="text-2xl font-black" style={{ color: '#FFD700' }}>{predictionCappers.length}</div>
                  <div className="text-xs" style={{ color: '#808090' }}>Traders Tracked</div>
                </div>
                <div className="p-3 rounded-xl text-center" style={{ background: 'rgba(255,255,255,0.03)' }}>
                  <div className="text-2xl font-black" style={{ color: '#00FF88' }}>
                    {(predictionCappers.reduce((sum, c) => sum + c.clvBeatRate, 0) / predictionCappers.length).toFixed(1)}%
                  </div>
                  <div className="text-xs" style={{ color: '#808090' }}>Avg CLV Beat</div>
                </div>
                <div className="p-3 rounded-xl text-center" style={{ background: 'rgba(255,255,255,0.03)' }}>
                  <div className="text-2xl font-black" style={{ color: '#00A8FF' }}>
                    {predictionCappers.filter(c => c.verified).length}
                  </div>
                  <div className="text-xs" style={{ color: '#808090' }}>Verified</div>
                </div>
                <div className="p-3 rounded-xl text-center" style={{ background: 'rgba(255,255,255,0.03)' }}>
                  <div className="text-2xl font-black" style={{ color: '#FF6B00' }}>
                    {(predictionCappers.reduce((sum, c) => sum + c.followers, 0) / 1000).toFixed(0)}K
                  </div>
                  <div className="text-xs" style={{ color: '#808090' }}>Total Followers</div>
                </div>
              </div>
            </div>
            
            {/* Markets Leaderboard Table */}
            <div className="rounded-2xl overflow-hidden" style={{ background: '#0c0c14', border: '1px solid rgba(155,89,182,0.2)' }}>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ background: 'rgba(155,89,182,0.1)' }}>
                      <th className="text-left py-3 px-4 text-[10px] font-bold uppercase tracking-wider" style={{ color: '#9B59B6' }}>Rank</th>
                      <th className="text-left py-3 px-4 text-[10px] font-bold uppercase tracking-wider" style={{ color: '#9B59B6' }}>Trader</th>
                      <th className="text-center py-3 px-4 text-[10px] font-bold uppercase tracking-wider" style={{ color: '#9B59B6' }}>Platform</th>
                      <th className="text-center py-3 px-4 text-[10px] font-bold uppercase tracking-wider" style={{ color: '#9B59B6' }}>Markets</th>
                      <th className="text-center py-3 px-4 text-[10px] font-bold uppercase tracking-wider" style={{ color: '#9B59B6' }}>CLV Beat</th>
                      <th className="text-center py-3 px-4 text-[10px] font-bold uppercase tracking-wider" style={{ color: '#9B59B6' }}>Avg CLV</th>
                      <th className="text-center py-3 px-4 text-[10px] font-bold uppercase tracking-wider hidden md:table-cell" style={{ color: '#9B59B6' }}>Focus</th>
                    </tr>
                  </thead>
                  <tbody>
                    {predictionCappers
                      .sort((a, b) => b.clvBeatRate - a.clvBeatRate)
                      .map((capper, idx) => {
                        const sourceStyle = sourceStyles[capper.source.toLowerCase()] || sourceStyles.other
                        return (
                          <tr 
                            key={capper.id} 
                            className="group transition-all hover:bg-white/[0.03]"
                            style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}
                          >
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
                                <span className="font-bold text-sm" style={{ color: '#606070' }}>{idx + 1}</span>
                              )}
                            </td>
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
                            <td className="py-3 px-4 text-center">
                              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold"
                                    style={{ background: sourceStyle.bg, color: sourceStyle.color }}>
                                {sourceStyle.icon} {capper.source}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-center font-bold" style={{ color: '#FFF' }}>
                              {capper.specialties.length}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span className="font-black" style={{ color: capper.clvBeatRate >= 60 ? '#00FF88' : capper.clvBeatRate >= 50 ? '#FFD700' : '#FF4455' }}>
                                {capper.clvBeatRate.toFixed(1)}%
                              </span>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span className="font-bold" style={{ color: capper.avgCLV >= 0 ? '#00FF88' : '#FF4455' }}>
                                {capper.avgCLV >= 0 ? '+' : ''}{capper.avgCLV.toFixed(1)}%
                              </span>
                            </td>
                            <td className="py-3 px-4 text-center hidden md:table-cell">
                              <div className="flex flex-wrap justify-center gap-1">
                                {capper.specialties.slice(0, 2).map((s: MarketType) => (
                                  <span key={s} className="text-[9px] px-1.5 py-0.5 rounded" 
                                        style={{ background: 'rgba(155,89,182,0.15)', color: '#B07CC6' }}>
                                    {s}
                                  </span>
                                ))}
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                  </tbody>
                </table>
              </div>
            </div>
            
            {/* Analytics Summary */}
            <div className="rounded-2xl p-4" style={{ background: '#0c0c14', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="flex items-center gap-2 mb-4">
                <Brain className="w-5 h-5" style={{ color: '#9B59B6' }} />
                <h3 className="font-bold" style={{ color: '#9B59B6' }}>Market Analytics Summary</h3>
              </div>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)' }}>
                  <div className="text-sm font-bold mb-2" style={{ color: '#FFF' }}>Overall Performance</div>
                  <div className="text-xs space-y-1">
                    <div style={{ color: '#808090' }}>
                      Avg Win Rate: <span style={{ color: '#00FF88' }}>{analyticsSummary.avgWinRate.toFixed(1)}%</span>
                    </div>
                    <div style={{ color: '#808090' }}>
                      Avg ROI: <span style={{ color: '#00FF88' }}>+{analyticsSummary.avgROI.toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
                <div className="p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)' }}>
                  <div className="text-sm font-bold mb-2" style={{ color: '#FFF' }}>Top Edge</div>
                  <div className="text-xs space-y-1">
                    <div style={{ color: '#808090' }}>
                      Category: <span style={{ color: '#9B59B6' }}>{analyticsSummary.topEdgeCategory}</span>
                    </div>
                    <div style={{ color: '#808090' }}>
                      Top Sport: <span style={{ color: '#FF6B00' }}>{analyticsSummary.topEdgeSport}</span>
                    </div>
                  </div>
                </div>
                <div className="p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)' }}>
                  <div className="text-sm font-bold mb-2" style={{ color: '#FFF' }}>Sample Data</div>
                  <div className="text-xs space-y-1">
                    <div style={{ color: '#808090' }}>
                      Trends Tracked: <span style={{ color: '#00A8FF' }}>{analyticsSummary.totalTrendsTracked}</span>
                    </div>
                    <div style={{ color: '#808090' }}>
                      Sample Size: <span style={{ color: '#00A8FF' }}>{analyticsSummary.totalSampleSize.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
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
