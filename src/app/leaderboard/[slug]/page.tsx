'use client'

import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { 
  ArrowLeft,
  Trophy,
  TrendingUp,
  TrendingDown,
  Target,
  BarChart3,
  Calendar,
  CheckCircle,
  XCircle,
  Minus,
  ExternalLink,
  Share2,
  Crown,
  Flame,
  Snowflake,
  ChevronDown,
  ThumbsDown,
  Info,
  Clock,
  Tv,
  Shield,
  Loader2
} from 'lucide-react'
import { fetchCapperBySlug, fetchExpertStats, fetchExpertPicks } from '@/lib/services/leaderboard-service'
import { BetType, Sport, PickResult, Capper } from '@/types/leaderboard'

export default function CapperProfilePage() {
  const params = useParams()
  const slug = params.slug as string
  
  const [capper, setCapper] = useState<Capper | null>(null)
  const [stats, setStats] = useState<any | null>(null)
  const [picks, setPicks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  // Filters for picks
  const [sportFilter, setSportFilter] = useState<Sport | 'all'>('all')
  const [betTypeFilter, setBetTypeFilter] = useState<BetType | 'all'>('all')
  const [resultFilter, setResultFilter] = useState<PickResult | 'all'>('all')
  const [showAllPicks, setShowAllPicks] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'picks'>('overview')
  
  // Fetch data from Supabase
  useEffect(() => {
    async function loadData() {
      setLoading(true)
      try {
        const [capperData, statsData, picksData] = await Promise.all([
          fetchCapperBySlug(slug),
          fetchExpertStats(slug),
          fetchExpertPicks(slug, 50)
        ])
        setCapper(capperData)
        setStats(statsData)
        setPicks(picksData || [])
      } catch (error) {
        console.error('Error loading expert data:', error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [slug])
  
  // Stats by sport/bet type - will be computed from picks
  const statsBySport: any[] = []
  const statsByBetType: any[] = []
  
  // Filter picks
  const filteredPicks = useMemo(() => {
    return picks.filter(pick => {
      if (sportFilter !== 'all' && pick.sport !== sportFilter) return false
      if (betTypeFilter !== 'all' && pick.bet_type !== betTypeFilter) return false
      if (resultFilter !== 'all' && pick.status !== resultFilter) return false
      return true
    }).slice(0, showAllPicks ? undefined : 20)
  }, [picks, sportFilter, betTypeFilter, resultFilter, showAllPicks])
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#050508' }}>
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" style={{ color: '#00A8FF' }} />
          <p style={{ color: '#808090' }}>Loading expert data...</p>
        </div>
      </div>
    )
  }
  
  if (!capper) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#050508' }}>
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4" style={{ color: '#FFF' }}>Expert Not Found</h1>
          <p className="mb-4" style={{ color: '#808090' }}>No data available for this expert yet.</p>
          <Link href="/leaderboard" className="text-sm" style={{ color: '#00A8FF' }}>
            ← Back to Experts
          </Link>
        </div>
      </div>
    )
  }
  
  // Default stats if not loaded - use consistent property names with any type
  const expertStats: any = stats || {
    wins: 0,
    losses: 0,
    pushes: 0,
    units: 0,
    winPct: 0,
    roi: 0,
    currentStreak: 0,
    longestWinStreak: 0,
    longestLoseStreak: 0,
  }
  
  // Computed values for display
  const streakStr = typeof expertStats.currentStreak === 'number' 
    ? (expertStats.currentStreak > 0 ? `W${expertStats.currentStreak}` : expertStats.currentStreak < 0 ? `L${Math.abs(expertStats.currentStreak)}` : 'N/A')
    : String(expertStats.currentStreak || 'N/A')
  
  const isHot = streakStr.startsWith('W') && parseInt(streakStr.slice(1)) >= 3
  const isCold = streakStr.startsWith('L') && parseInt(streakStr.slice(1)) >= 3
  const isProfitable = (expertStats.units || 0) > 0
  const isFadeCandidate = (expertStats.winPct || 0) < 45

  return (
    <div className="min-h-screen" style={{ background: '#050508' }}>
      {/* Hero Section */}
      <section className="relative overflow-hidden" style={{ background: 'linear-gradient(180deg, #0a0a12 0%, #050508 100%)' }}>
        {/* Background Effects */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full opacity-15 blur-[100px] pointer-events-none" 
               style={{ background: `radial-gradient(circle, ${isProfitable ? '#00FF88' : '#FF4455'} 0%, transparent 70%)` }} />
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
          {/* Back Link */}
          <Link href="/leaderboard" 
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold mb-6 transition-all hover:bg-white/10"
                style={{ color: '#808090' }}>
            <ArrowLeft className="w-4 h-4" />
            Back to Experts
          </Link>
          
          {/* Profile Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            {/* Avatar */}
            <div className="w-24 h-24 rounded-2xl flex items-center justify-center text-5xl"
                 style={{ 
                   background: 'rgba(255,255,255,0.05)', 
                   border: '2px solid rgba(255,255,255,0.1)',
                   boxShadow: isProfitable ? '0 0 40px rgba(0,255,136,0.2)' : '0 0 40px rgba(255,68,85,0.2)'
                 }}>
              {capper.avatarEmoji}
            </div>
            
            {/* Info */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <h1 className="text-3xl sm:text-4xl font-black" style={{ color: '#FFF' }}>{capper.name}</h1>
                {capper.verified && (
                  <span className="px-2 py-1 rounded-lg text-xs font-bold" 
                        style={{ background: 'rgba(0,168,255,0.2)', color: '#00A8FF' }}>
                    ✓ Verified
                  </span>
                )}
                {isHot && (
                  <span className="px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1" 
                        style={{ background: 'rgba(0,255,136,0.2)', color: '#00FF88' }}>
                    <Flame className="w-3 h-3" /> HOT
                  </span>
                )}
                {isCold && (
                  <span className="px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1" 
                        style={{ background: 'rgba(255,68,85,0.2)', color: '#FF4455' }}>
                    <Snowflake className="w-3 h-3" /> COLD
                  </span>
                )}
                {isFadeCandidate && (
                  <span className="px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1" 
                        style={{ background: 'rgba(255,107,0,0.2)', color: '#FF6B00' }}>
                    <ThumbsDown className="w-3 h-3" /> FADE
                  </span>
                )}
              </div>
              
              <div className="flex flex-wrap items-center gap-4 text-sm" style={{ color: '#808090' }}>
                {capper.network && (
                  <span className="flex items-center gap-1">
                    📺 {capper.network}
                  </span>
                )}
                {capper.role && (
                  <span>{capper.role}</span>
                )}
                {capper.followersCount && (
                  <span>{capper.followersCount} followers</span>
                )}
                <span className="capitalize px-2 py-0.5 rounded text-xs font-semibold"
                      style={{ 
                        background: capper.capperType === 'celebrity' ? 'rgba(255,215,0,0.2)' : 
                                   capper.capperType === 'pro' ? 'rgba(0,255,136,0.2)' : 'rgba(0,168,255,0.2)',
                        color: capper.capperType === 'celebrity' ? '#FFD700' : 
                               capper.capperType === 'pro' ? '#00FF88' : '#00A8FF'
                      }}>
                  {capper.capperType}
                </span>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <button 
                onClick={async () => {
                  const url = `https://matchups-eta.vercel.app/leaderboard/${slug}`
                  const text = `Check out ${capper.name}'s picks on Matchups! ${capper.network ? `(${capper.network})` : ''}`
                  
                  if (navigator.share) {
                    try {
                      await navigator.share({ title: `${capper.name} - Matchups`, text, url })
                    } catch {
                      await navigator.clipboard.writeText(url)
                    }
                  } else {
                    await navigator.clipboard.writeText(url)
                    alert('Link copied to clipboard!')
                  }
                }}
                className="p-3 rounded-xl transition-all hover:bg-white/10"
                style={{ background: 'rgba(255,255,255,0.05)' }}
                title="Share this capper"
              >
                <Share2 className="w-5 h-5" style={{ color: '#808090' }} />
              </button>
            </div>
          </div>
        </div>
      </section>
      
      {/* Navigation Tabs */}
      <div className="sticky top-16 z-40" style={{ background: '#050508', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-1 py-2 overflow-x-auto">
            {(['overview', 'picks'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all`}
                style={{
                  background: activeTab === tab ? 'rgba(255,107,0,0.2)' : 'transparent',
                  color: activeTab === tab ? '#FF6B00' : '#808090',
                  border: activeTab === tab ? '1px solid rgba(255,107,0,0.3)' : '1px solid transparent',
                }}
              >
                {tab === 'overview' && '📊 Overview'}
                {tab === 'picks' && '📋 Pick History'}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <>
            {/* Main Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 mb-8">
              <StatCard 
                label="Record" 
                value={`${expertStats.wins || 0}-${expertStats.losses || 0}`}
                subValue={(expertStats.pushes || 0) > 0 ? `${expertStats.pushes} push` : undefined}
                color="#FFF"
              />
              <StatCard 
                label="Win %" 
                value={`${(expertStats.winPct || 0).toFixed(1)}%`}
                color={(expertStats.winPct || 0) >= 55 ? '#00FF88' : (expertStats.winPct || 0) >= 50 ? '#FFD700' : '#FF4455'}
              />
              <StatCard 
                label="Units" 
                value={`${(expertStats.units || 0) > 0 ? '+' : ''}${(expertStats.units || 0).toFixed(1)}`}
                color={(expertStats.units || 0) > 0 ? '#00FF88' : '#FF4455'}
              />
              <StatCard 
                label="ROI" 
                value={`${(expertStats.roi || 0) > 0 ? '+' : ''}${(expertStats.roi || 0).toFixed(1)}%`}
                color={(expertStats.roi || 0) > 0 ? '#00FF88' : '#FF4455'}
              />
              <StatCard 
                label="Streak" 
                value={streakStr}
                color={streakStr.startsWith('W') ? '#00FF88' : '#FF4455'}
              />
              <StatCard 
                label="Picks" 
                value={`${picks.length}`}
                color="#FFD700"
              />
            </div>
            
            {/* Performance Breakdown */}
            <div className="grid lg:grid-cols-2 gap-6 mb-8">
              {/* By Sport */}
              <div className="rounded-2xl p-5" style={{ background: '#0c0c14', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="flex items-center gap-2 mb-4">
                  <Target className="w-5 h-5" style={{ color: '#FFD700' }} />
                  <h2 className="font-bold text-lg" style={{ color: '#FFF' }}>Performance by Sport</h2>
                </div>
                
                {statsBySport.length > 0 ? (
                  <div className="space-y-3">
                    {statsBySport.map((s) => (
                      <div key={s.sport} className="p-3 rounded-xl"
                           style={{ background: 'rgba(255,255,255,0.03)' }}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <span className="text-xl">
                              {s.sport === 'NFL' ? '🏈' : s.sport === 'NBA' ? '🏀' : s.sport === 'MLB' ? '⚾' : s.sport === 'NHL' ? '🏒' : '🎯'}
                            </span>
                            <div>
                              <span className="font-bold text-sm" style={{ color: '#FFF' }}>{s.sport}</span>
                              <div className="text-xs" style={{ color: '#808090' }}>{s.totalPicks} picks</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <div className="font-bold text-sm" style={{ color: s.winPercentage >= 50 ? '#00FF88' : '#FF4455' }}>
                                {s.winPercentage.toFixed(1)}%
                              </div>
                              <div className="text-xs font-mono" style={{ color: '#808090' }}>
                                {s.wins}-{s.losses}
                              </div>
                            </div>
                            <div className="text-right min-w-[60px]">
                              <div className="font-bold text-sm" style={{ color: s.netUnits > 0 ? '#00FF88' : '#FF4455' }}>
                                {s.netUnits > 0 ? '+' : ''}{s.netUnits.toFixed(1)}u
                              </div>
                              <div className="text-xs" style={{ color: s.roiPercentage > 0 ? '#00FF88' : '#FF4455' }}>
                                {s.roiPercentage > 0 ? '+' : ''}{s.roiPercentage.toFixed(1)}%
                              </div>
                            </div>
                          </div>
                        </div>
                        {/* Progress bar */}
                        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
                          <div 
                            className="h-full rounded-full transition-all"
                            style={{ 
                              width: `${s.winPercentage}%`,
                              background: s.winPercentage >= 55 ? '#00FF88' : s.winPercentage >= 50 ? '#FFD700' : '#FF4455'
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8" style={{ color: '#606070' }}>
                    No sport breakdown available yet
                  </div>
                )}
              </div>
              
              {/* By Bet Type */}
              <div className="rounded-2xl p-5" style={{ background: '#0c0c14', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="flex items-center gap-2 mb-4">
                  <BarChart3 className="w-5 h-5" style={{ color: '#00A8FF' }} />
                  <h2 className="font-bold text-lg" style={{ color: '#FFF' }}>Performance by Bet Type</h2>
                </div>
                
                {statsByBetType.length > 0 ? (
                  <div className="space-y-3">
                    {statsByBetType.map((s) => (
                      <div key={s.betType} className="p-3 rounded-xl"
                           style={{ background: 'rgba(255,255,255,0.03)' }}>
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <span className="font-bold text-sm capitalize" style={{ color: '#FFF' }}>
                              {s.betType.replace('_', '/')}
                            </span>
                            <div className="text-xs" style={{ color: '#808090' }}>{s.totalPicks} picks</div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <div className="font-bold text-sm" style={{ color: s.winPercentage >= 50 ? '#00FF88' : '#FF4455' }}>
                                {s.winPercentage.toFixed(1)}%
                              </div>
                              <div className="text-xs font-mono" style={{ color: '#808090' }}>
                                {s.wins}-{s.losses}
                              </div>
                            </div>
                            <div className="text-right min-w-[60px]">
                              <div className="font-bold text-sm" style={{ color: s.netUnits > 0 ? '#00FF88' : '#FF4455' }}>
                                {s.netUnits > 0 ? '+' : ''}{s.netUnits.toFixed(1)}u
                              </div>
                            </div>
                          </div>
                        </div>
                        {/* Progress bar */}
                        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
                          <div 
                            className="h-full rounded-full transition-all"
                            style={{ 
                              width: `${s.winPercentage}%`,
                              background: s.winPercentage >= 55 ? '#00FF88' : s.winPercentage >= 50 ? '#FFD700' : '#FF4455'
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8" style={{ color: '#606070' }}>
                    No bet type breakdown available yet
                  </div>
                )}
              </div>
            </div>
            
            {/* Recent Picks Preview */}
            <div className="rounded-2xl overflow-hidden" style={{ background: '#0c0c14', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="p-5 border-b flex items-center justify-between" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" style={{ color: '#FF6B00' }} />
                  <h2 className="font-bold text-lg" style={{ color: '#FFF' }}>Recent Picks</h2>
                </div>
                <button 
                  onClick={() => setActiveTab('picks')}
                  className="text-sm font-semibold flex items-center gap-1 transition-all hover:opacity-80"
                  style={{ color: '#00A8FF' }}>
                  View All <ChevronDown className="w-4 h-4 rotate-[-90deg]" />
                </button>
              </div>
              
              <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.03)' }}>
                {picks.slice(0, 5).map((pick) => (
                  <div key={pick.id} className="p-4 flex items-center gap-4 transition-all hover:bg-white/[0.02]">
                    {/* Result Icon */}
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                         style={{ 
                           background: pick.result === 'win' ? 'rgba(0,255,136,0.15)' : 
                                      pick.result === 'loss' ? 'rgba(255,68,85,0.15)' : 
                                      pick.result === 'push' ? 'rgba(255,215,0,0.15)' : 'rgba(255,255,255,0.05)'
                         }}>
                      {pick.result === 'win' && <CheckCircle className="w-5 h-5" style={{ color: '#00FF88' }} />}
                      {pick.result === 'loss' && <XCircle className="w-5 h-5" style={{ color: '#FF4455' }} />}
                      {pick.result === 'push' && <Minus className="w-5 h-5" style={{ color: '#FFD700' }} />}
                      {pick.result === 'pending' && <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#00A8FF' }} />}
                    </div>
                    
                    {/* Pick Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-sm" style={{ color: '#FFF' }}>{pick.pickDescription}</span>
                        <span className="text-xs px-2 py-0.5 rounded capitalize"
                              style={{ background: 'rgba(255,255,255,0.05)', color: '#808090' }}>
                          {pick.betType.replace('_', '/')}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs" style={{ color: '#606070' }}>
                        <span>{pick.sport}</span>
                        <span>•</span>
                        <span>{(pick.oddsAtPick ?? 0) > 0 ? '+' : ''}{pick.oddsAtPick ?? '-110'}</span>
                        {pick.gameDate && (
                          <>
                            <span>•</span>
                            <span>{new Date(pick.gameDate).toLocaleDateString()}</span>
                          </>
                        )}
                      </div>
                    </div>
                    
                    {/* Units */}
                    <div className="text-right">
                      <div className="font-bold text-sm" style={{ color: '#FFF' }}>{pick.units}u</div>
                      {pick.result === 'win' && pick.oddsAtPick && (
                        <div className="text-xs" style={{ color: '#00FF88' }}>
                          +{(pick.oddsAtPick > 0 ? pick.units * (pick.oddsAtPick / 100) : pick.units * (100 / Math.abs(pick.oddsAtPick))).toFixed(2)}u
                        </div>
                      )}
                      {pick.result === 'loss' && (
                        <div className="text-xs" style={{ color: '#FF4455' }}>-{pick.units}u</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Trust & Verification Section */}
            <div className="rounded-2xl p-5" style={{ background: '#0c0c14', border: '1px solid rgba(0,168,255,0.2)' }}>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(0,168,255,0.15)' }}>
                  <Info className="w-4 h-4" style={{ color: '#00A8FF' }} />
                </div>
                <div>
                  <h2 className="font-bold text-lg" style={{ color: '#FFF' }}>Trust & Verification</h2>
                  <p className="text-xs" style={{ color: '#808090' }}>How we ensure accuracy</p>
                </div>
              </div>
              
              <div className="grid sm:grid-cols-2 gap-4 mb-4">
                {/* Source Verification */}
                <div className="p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)' }}>
                  <div className="flex items-center gap-2 mb-2">
                    <Tv className="w-4 h-4" style={{ color: '#FF6B00' }} />
                    <span className="font-bold text-sm" style={{ color: '#FFF' }}>Source Tracking</span>
                  </div>
                  <p className="text-xs mb-2" style={{ color: '#A0A0B0' }}>
                    Every pick is recorded with its original source (TV broadcast, podcast, Twitter, etc.) and timestamp.
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-1 rounded" style={{ background: 'rgba(255,107,0,0.15)', color: '#FF6B00' }}>📺 TV</span>
                    <span className="text-xs px-2 py-1 rounded" style={{ background: 'rgba(138,43,226,0.15)', color: '#9B59B6' }}>🎙️ Podcast</span>
                    <span className="text-xs px-2 py-1 rounded" style={{ background: 'rgba(29,161,242,0.15)', color: '#1DA1F2' }}>𝕏 Twitter</span>
                  </div>
                </div>
                
                {/* Timestamping */}
                <div className="p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)' }}>
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4" style={{ color: '#00FF88' }} />
                    <span className="font-bold text-sm" style={{ color: '#FFF' }}>Pre-Game Locks</span>
                  </div>
                  <p className="text-xs" style={{ color: '#A0A0B0' }}>
                    Picks must be recorded BEFORE game start. Post-game entries are flagged and rejected. All timestamps are verified against game schedules.
                  </p>
                </div>
                
                {/* Public Record */}
                <div className="p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)' }}>
                  <div className="flex items-center gap-2 mb-2">
                    <ExternalLink className="w-4 h-4" style={{ color: '#9B59B6' }} />
                    <span className="font-bold text-sm" style={{ color: '#FFF' }}>Verifiable Sources</span>
                  </div>
                  <p className="text-xs" style={{ color: '#A0A0B0' }}>
                    Where available, we link to original broadcasts, clips, or posts. Users can verify picks against primary sources.
                  </p>
                </div>
                
                {/* Methodology */}
                <div className="p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)' }}>
                  <div className="flex items-center gap-2 mb-2">
                    <BarChart3 className="w-4 h-4" style={{ color: '#FFD700' }} />
                    <span className="font-bold text-sm" style={{ color: '#FFF' }}>Consistent Grading</span>
                  </div>
                  <p className="text-xs" style={{ color: '#A0A0B0' }}>
                    All picks graded by closing line. Pushes excluded from win%. Standard -110 juice assumed unless specified.
                  </p>
                </div>
              </div>
              
              {/* Disclaimer */}
              <div className="p-3 rounded-lg" style={{ background: 'rgba(255,215,0,0.1)', border: '1px solid rgba(255,215,0,0.2)' }}>
                <p className="text-xs" style={{ color: '#FFD700' }}>
                  ⚠️ <strong>Transparency Note:</strong> Some celebrity picks are collected from public broadcasts where the exact spread/line at time of pick may differ from closing line. We always note when line at pick is estimated vs. verified. Want to report an error? <Link href="/admin/docs" className="underline">Contact us</Link>.
                </p>
              </div>
            </div>
          </>
        )}
        
        {/* Picks Tab */}
        {activeTab === 'picks' && (
          <div className="rounded-2xl overflow-hidden" style={{ background: '#0c0c14', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="p-5 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" style={{ color: '#FF6B00' }} />
                  <h2 className="font-bold text-lg" style={{ color: '#FFF' }}>Full Pick History</h2>
                  <span className="text-sm px-2 py-0.5 rounded" style={{ background: 'rgba(255,255,255,0.05)', color: '#808090' }}>
                    {picks.length} picks
                  </span>
                </div>
                
                {/* Filters */}
                <div className="flex flex-wrap items-center gap-2">
                  <select 
                    value={sportFilter}
                    onChange={(e) => setSportFilter(e.target.value as Sport | 'all')}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer"
                    style={{ background: 'rgba(255,255,255,0.05)', color: '#FFF', border: '1px solid rgba(255,255,255,0.1)' }}
                  >
                    <option value="all">All Sports</option>
                    <option value="NFL">🏈 NFL</option>
                    <option value="NBA">🏀 NBA</option>
                    <option value="MLB">⚾ MLB</option>
                    <option value="NHL">🏒 NHL</option>
                  </select>
                  
                  <select 
                    value={betTypeFilter}
                    onChange={(e) => setBetTypeFilter(e.target.value as BetType | 'all')}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer"
                    style={{ background: 'rgba(255,255,255,0.05)', color: '#FFF', border: '1px solid rgba(255,255,255,0.1)' }}
                  >
                    <option value="all">All Types</option>
                    <option value="spread">Spread</option>
                    <option value="moneyline">Moneyline</option>
                    <option value="over_under">Over/Under</option>
                    <option value="prop">Props</option>
                  </select>
                  
                  <select 
                    value={resultFilter}
                    onChange={(e) => setResultFilter(e.target.value as PickResult | 'all')}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer"
                    style={{ background: 'rgba(255,255,255,0.05)', color: '#FFF', border: '1px solid rgba(255,255,255,0.1)' }}
                  >
                    <option value="all">All Results</option>
                    <option value="win">✅ Wins</option>
                    <option value="loss">❌ Losses</option>
                    <option value="push">➖ Pushes</option>
                  </select>
                </div>
              </div>
            </div>
            
            <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.03)' }}>
              {picks.length > 0 ? (
                picks.map((pick) => (
                  <div key={pick.id} className="p-4 flex items-center gap-4 transition-all hover:bg-white/[0.02]">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                         style={{ 
                           background: pick.result === 'win' ? 'rgba(0,255,136,0.15)' : 
                                      pick.result === 'loss' ? 'rgba(255,68,85,0.15)' : 
                                      pick.result === 'push' ? 'rgba(255,215,0,0.15)' : 'rgba(255,255,255,0.05)'
                         }}>
                      {pick.result === 'win' && <CheckCircle className="w-5 h-5" style={{ color: '#00FF88' }} />}
                      {pick.result === 'loss' && <XCircle className="w-5 h-5" style={{ color: '#FF4455' }} />}
                      {pick.result === 'push' && <Minus className="w-5 h-5" style={{ color: '#FFD700' }} />}
                      {pick.result === 'pending' && <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#00A8FF' }} />}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-sm" style={{ color: '#FFF' }}>{pick.pickDescription}</span>
                        <span className="text-xs px-2 py-0.5 rounded capitalize"
                              style={{ background: 'rgba(255,255,255,0.05)', color: '#808090' }}>
                          {pick.betType.replace('_', '/')}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs" style={{ color: '#606070' }}>
                        <span>{pick.sport}</span>
                        <span>•</span>
                        <span>{(pick.oddsAtPick ?? 0) > 0 ? '+' : ''}{pick.oddsAtPick ?? '-110'}</span>
                        {pick.gameDate && (
                          <>
                            <span>•</span>
                            <span>{new Date(pick.gameDate).toLocaleDateString()}</span>
                          </>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="font-bold text-sm" style={{ color: '#FFF' }}>{pick.units}u</div>
                      {pick.result === 'win' && pick.oddsAtPick && (
                        <div className="text-xs" style={{ color: '#00FF88' }}>
                          +{(pick.oddsAtPick > 0 ? pick.units * (pick.oddsAtPick / 100) : pick.units * (100 / Math.abs(pick.oddsAtPick))).toFixed(2)}u
                        </div>
                      )}
                      {pick.result === 'loss' && (
                        <div className="text-xs" style={{ color: '#FF4455' }}>-{pick.units}u</div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center" style={{ color: '#606070' }}>
                  No picks found matching your filters
                </div>
              )}
            </div>
            
            {!showAllPicks && picks.length >= 20 && (
              <button 
                onClick={() => setShowAllPicks(true)}
                className="w-full py-4 text-sm font-semibold flex items-center justify-center gap-2 transition-all hover:bg-white/[0.02]"
                style={{ color: '#00A8FF', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <ChevronDown className="w-4 h-4" />
                Load More Picks
              </button>
            )}
          </div>
        )}
      </section>
    </div>
  )
}

// Stat Card Component
function StatCard({ 
  label, 
  value, 
  subValue, 
  color,
  subColor 
}: { 
  label: string
  value: string
  subValue?: string
  color: string
  subColor?: string
}) {
  return (
    <div className="p-4 rounded-xl text-center" style={{ background: '#0c0c14', border: '1px solid rgba(255,255,255,0.06)' }}>
      <div className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: '#606070' }}>{label}</div>
      <div className="text-2xl font-black" style={{ color }}>{value}</div>
      {subValue && (
        <div className="text-xs font-semibold mt-1" style={{ color: subColor || '#808090' }}>{subValue}</div>
      )}
    </div>
  )
}

// Pattern Card Component
function PatternCard({
  label,
  value,
  description,
  isHigh = false,
  isOdds = false,
}: {
  label: string
  value: number
  description: string
  isHigh?: boolean
  isOdds?: boolean
}) {
  return (
    <div className="p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)' }}>
      <div className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: '#606070' }}>{label}</div>
      <div className="text-2xl font-black mb-1" style={{ color: isOdds ? (value > 0 ? '#FF4455' : '#00FF88') : (isHigh ? '#FF6B00' : '#FFF') }}>
        {isOdds ? (value > 0 ? `+${value}` : value) : `${value}%`}
      </div>
      <div className="text-xs" style={{ color: '#808090' }}>{description}</div>
    </div>
  )
}

// Form Card Component
function FormCard({
  period,
  record,
  roi,
}: {
  period: string
  record: string
  roi: number
}) {
  return (
    <div className="p-4 rounded-xl text-center" style={{ background: 'rgba(255,255,255,0.03)' }}>
      <div className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: '#606070' }}>{period}</div>
      <div className="text-xl font-black mb-1" style={{ color: '#FFF' }}>{record}</div>
      <div className="text-sm font-semibold" style={{ color: roi > 0 ? '#00FF88' : '#FF4455' }}>
        {roi > 0 ? '+' : ''}{roi.toFixed(1)}% ROI
      </div>
    </div>
  )
}
