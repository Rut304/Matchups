'use client'

import { useState, useMemo } from 'react'
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
  Brain,
  AlertTriangle,
  ThumbsUp,
  ThumbsDown,
  Zap,
  PieChart,
  Activity,
  Clock,
  Star,
  TrendingUp as Trending,
  Info,
  LineChart,
  Percent
} from 'lucide-react'
import { 
  getCapperBySlug, 
  getCapperStats, 
  getCapperPicks, 
  getCapperStatsBySport,
  getCapperStatsByBetType,
  capperStats,
  cappers
} from '@/lib/leaderboard-data'
import { getCapperSummary, generateAISummary, CapperAnalyticsSummary } from '@/lib/analytics-data'
import { BetType, Sport, PickResult } from '@/types/leaderboard'

export default function CapperProfilePage() {
  const params = useParams()
  const slug = params.slug as string
  
  const capper = getCapperBySlug(slug)
  const stats = capper ? capperStats[capper.id] : null
  const statsBySport = capper ? getCapperStatsBySport(capper.id) : []
  const statsByBetType = capper ? getCapperStatsByBetType(capper.id) : []
  const aiSummary = capper ? getCapperSummary(capper.id) : undefined
  
  // Filters for picks
  const [sportFilter, setSportFilter] = useState<Sport | 'all'>('all')
  const [betTypeFilter, setBetTypeFilter] = useState<BetType | 'all'>('all')
  const [resultFilter, setResultFilter] = useState<PickResult | 'all'>('all')
  const [showAllPicks, setShowAllPicks] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'picks' | 'analytics' | 'trends'>('overview')
  
  const picks = useMemo(() => {
    if (!capper) return []
    return getCapperPicks(capper.id, {
      sport: sportFilter === 'all' ? undefined : sportFilter,
      betType: betTypeFilter === 'all' ? undefined : betTypeFilter,
      result: resultFilter === 'all' ? undefined : resultFilter,
      limit: showAllPicks ? undefined : 20
    })
  }, [capper, sportFilter, betTypeFilter, resultFilter, showAllPicks])
  
  if (!capper || !stats) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#050508' }}>
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4" style={{ color: '#FFF' }}>Capper Not Found</h1>
          <Link href="/leaderboard" className="text-sm" style={{ color: '#00A8FF' }}>
            ← Back to Leaderboard
          </Link>
        </div>
      </div>
    )
  }
  
  const isHot = stats.currentStreak.startsWith('W') && parseInt(stats.currentStreak.slice(1)) >= 3
  const isCold = stats.currentStreak.startsWith('L') && parseInt(stats.currentStreak.slice(1)) >= 3
  const isProfitable = stats.netUnits > 0
  const isFadeCandidate = stats.winPercentage < 45

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
            Back to Leaderboard
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
              {aiSummary?.recommendation === 'fade' && (
                <span className="px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2"
                      style={{ background: 'rgba(255,68,85,0.2)', color: '#FF4455', border: '1px solid rgba(255,68,85,0.3)' }}>
                  <ThumbsDown className="w-4 h-4" /> Fade This Capper
                </span>
              )}
              {aiSummary?.recommendation === 'follow' && (
                <span className="px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2"
                      style={{ background: 'rgba(0,255,136,0.2)', color: '#00FF88', border: '1px solid rgba(0,255,136,0.3)' }}>
                  <ThumbsUp className="w-4 h-4" /> Follow This Capper
                </span>
              )}
              <button className="p-3 rounded-xl transition-all hover:bg-white/10"
                      style={{ background: 'rgba(255,255,255,0.05)' }}>
                <Share2 className="w-5 h-5" style={{ color: '#808090' }} />
              </button>
            </div>
          </div>
          
          {/* AI Summary Section */}
          {aiSummary && (
            <div className="mt-6 p-5 rounded-2xl" 
                 style={{ 
                   background: 'rgba(138,43,226,0.1)', 
                   border: '1px solid rgba(138,43,226,0.2)',
                   boxShadow: '0 0 40px rgba(138,43,226,0.1)'
                 }}>
              <div className="flex items-center gap-2 mb-3">
                <Brain className="w-5 h-5" style={{ color: '#9B59B6' }} />
                <span className="font-bold" style={{ color: '#9B59B6' }}>AI Analysis</span>
                <span className="text-xs px-2 py-0.5 rounded" style={{ background: 'rgba(138,43,226,0.2)', color: '#9B59B6' }}>
                  Powered by Gemini
                </span>
              </div>
              <div className="space-y-2">
                {aiSummary.keyInsights.map((insight, i) => (
                  <p key={i} className="text-sm leading-relaxed" style={{ color: '#E0E0E0' }}>
                    {insight}
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
      
      {/* Navigation Tabs */}
      <div className="sticky top-16 z-40" style={{ background: '#050508', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-1 py-2 overflow-x-auto">
            {(['overview', 'analytics', 'picks', 'trends'] as const).map((tab) => (
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
                {tab === 'analytics' && '🧠 Deep Analytics'}
                {tab === 'picks' && '📋 Pick History'}
                {tab === 'trends' && '📈 Trends'}
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
                value={`${stats.totalWins}-${stats.totalLosses}`}
                subValue={stats.totalPushes > 0 ? `${stats.totalPushes} push` : undefined}
                color="#FFF"
              />
              <StatCard 
                label="Win %" 
                value={`${stats.winPercentage.toFixed(1)}%`}
                color={stats.winPercentage >= 55 ? '#00FF88' : stats.winPercentage >= 50 ? '#FFD700' : '#FF4455'}
              />
              <StatCard 
                label="Units" 
                value={`${stats.netUnits > 0 ? '+' : ''}${stats.netUnits.toFixed(1)}`}
                color={stats.netUnits > 0 ? '#00FF88' : '#FF4455'}
              />
              <StatCard 
                label="ROI" 
                value={`${stats.roiPercentage > 0 ? '+' : ''}${stats.roiPercentage.toFixed(1)}%`}
                color={stats.roiPercentage > 0 ? '#00FF88' : '#FF4455'}
              />
              <StatCard 
                label="Streak" 
                value={stats.currentStreak}
                color={stats.currentStreak.startsWith('W') ? '#00FF88' : '#FF4455'}
              />
              <StatCard 
                label="Rank" 
                value={`#${stats.overallRank}`}
                subValue={stats.rankChange !== 0 ? `${stats.rankChange > 0 ? '↑' : '↓'}${Math.abs(stats.rankChange)}` : undefined}
                subColor={stats.rankChange > 0 ? '#00FF88' : stats.rankChange < 0 ? '#FF4455' : undefined}
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
            
            {/* Quick Recommendation */}
            {aiSummary && (
              <div className="mb-8 p-5 rounded-2xl"
                   style={{ 
                     background: aiSummary.recommendation === 'fade' ? 'rgba(255,68,85,0.1)' : 
                                aiSummary.recommendation === 'follow' ? 'rgba(0,255,136,0.1)' : 'rgba(255,215,0,0.1)',
                     border: `1px solid ${aiSummary.recommendation === 'fade' ? 'rgba(255,68,85,0.2)' : 
                              aiSummary.recommendation === 'follow' ? 'rgba(0,255,136,0.2)' : 'rgba(255,215,0,0.2)'}`
                   }}>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center"
                       style={{ 
                         background: aiSummary.recommendation === 'fade' ? 'rgba(255,68,85,0.2)' : 
                                    aiSummary.recommendation === 'follow' ? 'rgba(0,255,136,0.2)' : 'rgba(255,215,0,0.2)'
                       }}>
                    {aiSummary.recommendation === 'fade' && <ThumbsDown className="w-6 h-6" style={{ color: '#FF4455' }} />}
                    {aiSummary.recommendation === 'follow' && <ThumbsUp className="w-6 h-6" style={{ color: '#00FF88' }} />}
                    {aiSummary.recommendation === 'selective' && <Target className="w-6 h-6" style={{ color: '#FFD700' }} />}
                    {aiSummary.recommendation === 'avoid' && <AlertTriangle className="w-6 h-6" style={{ color: '#FF6B00' }} />}
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-lg capitalize mb-1"
                         style={{ 
                           color: aiSummary.recommendation === 'fade' ? '#FF4455' : 
                                  aiSummary.recommendation === 'follow' ? '#00FF88' : '#FFD700'
                         }}>
                      Recommendation: {aiSummary.recommendation}
                    </div>
                    <p className="text-sm" style={{ color: '#A0A0B0' }}>
                      {aiSummary.recommendationReason}
                    </p>
                  </div>
                </div>
              </div>
            )}
            
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
          </>
        )}
        
        {/* Analytics Tab */}
        {activeTab === 'analytics' && aiSummary && (
          <div className="space-y-6">
            {/* Strengths & Weaknesses */}
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Strengths */}
              <div className="rounded-2xl p-5" style={{ background: '#0c0c14', border: '1px solid rgba(0,255,136,0.2)' }}>
                <div className="flex items-center gap-2 mb-4">
                  <ThumbsUp className="w-5 h-5" style={{ color: '#00FF88' }} />
                  <h2 className="font-bold text-lg" style={{ color: '#00FF88' }}>Strengths</h2>
                </div>
                <ul className="space-y-2">
                  {aiSummary.strengths.map((s, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm" style={{ color: '#E0E0E0' }}>
                      <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#00FF88' }} />
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
              
              {/* Weaknesses */}
              <div className="rounded-2xl p-5" style={{ background: '#0c0c14', border: '1px solid rgba(255,68,85,0.2)' }}>
                <div className="flex items-center gap-2 mb-4">
                  <ThumbsDown className="w-5 h-5" style={{ color: '#FF4455' }} />
                  <h2 className="font-bold text-lg" style={{ color: '#FF4455' }}>Weaknesses</h2>
                </div>
                <ul className="space-y-2">
                  {aiSummary.weaknesses.map((w, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm" style={{ color: '#E0E0E0' }}>
                      <XCircle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#FF4455' }} />
                      {w}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            
            {/* Betting Patterns */}
            <div className="rounded-2xl p-5" style={{ background: '#0c0c14', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="flex items-center gap-2 mb-4">
                <PieChart className="w-5 h-5" style={{ color: '#9B59B6' }} />
                <h2 className="font-bold text-lg" style={{ color: '#FFF' }}>Betting Patterns</h2>
              </div>
              
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <PatternCard 
                  label="Favorite Bias" 
                  value={aiSummary.patterns.favoriteBias}
                  description="% of picks on favorites"
                  isHigh={aiSummary.patterns.favoriteBias > 65}
                />
                <PatternCard 
                  label="Home Bias" 
                  value={aiSummary.patterns.homeBias}
                  description="% of picks on home teams"
                  isHigh={aiSummary.patterns.homeBias > 55}
                />
                <PatternCard 
                  label="Over Bias" 
                  value={aiSummary.patterns.overBias}
                  description="% of over vs under picks"
                  isHigh={aiSummary.patterns.overBias > 55}
                />
                <PatternCard 
                  label="Avg Odds Played" 
                  value={aiSummary.patterns.avgOdds}
                  description="Average odds on picks"
                  isOdds
                />
              </div>
              
              {aiSummary.patterns.clvBeatRate && (
                <div className="mt-4 p-4 rounded-xl" style={{ background: 'rgba(0,255,136,0.1)', border: '1px solid rgba(0,255,136,0.2)' }}>
                  <div className="flex items-center gap-2">
                    <Activity className="w-5 h-5" style={{ color: '#00FF88' }} />
                    <span className="font-bold" style={{ color: '#00FF88' }}>CLV Beat Rate: {aiSummary.patterns.clvBeatRate}%</span>
                  </div>
                  <p className="text-xs mt-1" style={{ color: '#808090' }}>
                    This capper beats closing line value {aiSummary.patterns.clvBeatRate}% of the time - the mark of a true sharp.
                  </p>
                </div>
              )}
            </div>
            
            {/* Recent Form */}
            <div className="rounded-2xl p-5" style={{ background: '#0c0c14', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="flex items-center gap-2 mb-4">
                <Clock className="w-5 h-5" style={{ color: '#00A8FF' }} />
                <h2 className="font-bold text-lg" style={{ color: '#FFF' }}>Recent Form</h2>
              </div>
              
              <div className="grid sm:grid-cols-3 gap-4">
                <FormCard 
                  period="Last 7 Days"
                  record={aiSummary.recentForm.last7days.record}
                  roi={aiSummary.recentForm.last7days.roi}
                />
                <FormCard 
                  period="Last 30 Days"
                  record={aiSummary.recentForm.last30days.record}
                  roi={aiSummary.recentForm.last30days.roi}
                />
                <FormCard 
                  period="This Season"
                  record={aiSummary.recentForm.lastSeason.record}
                  roi={aiSummary.recentForm.lastSeason.roi}
                />
              </div>
            </div>
            
            {/* Best & Worst */}
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Best Bet Types */}
              {aiSummary.bestBetTypes.length > 0 && (
                <div className="rounded-2xl p-5" style={{ background: '#0c0c14', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="flex items-center gap-2 mb-4">
                    <Star className="w-5 h-5" style={{ color: '#FFD700' }} />
                    <h2 className="font-bold text-lg" style={{ color: '#FFF' }}>Best Bet Types</h2>
                  </div>
                  <div className="space-y-3">
                    {aiSummary.bestBetTypes.map((bt, i) => (
                      <div key={i} className="flex items-center justify-between p-3 rounded-xl"
                           style={{ background: 'rgba(0,255,136,0.05)' }}>
                        <span className="font-semibold capitalize" style={{ color: '#FFF' }}>
                          {bt.type.replace('_', '/')}
                        </span>
                        <div className="flex items-center gap-4">
                          <span className="font-mono text-sm" style={{ color: '#00FF88' }}>{bt.winPct}%</span>
                          <span className="font-mono text-sm" style={{ color: '#00FF88' }}>+{bt.roi}% ROI</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Worst Bet Types */}
              {aiSummary.worstBetTypes.length > 0 && (
                <div className="rounded-2xl p-5" style={{ background: '#0c0c14', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="flex items-center gap-2 mb-4">
                    <AlertTriangle className="w-5 h-5" style={{ color: '#FF4455' }} />
                    <h2 className="font-bold text-lg" style={{ color: '#FFF' }}>Worst Bet Types</h2>
                  </div>
                  <div className="space-y-3">
                    {aiSummary.worstBetTypes.map((bt, i) => (
                      <div key={i} className="flex items-center justify-between p-3 rounded-xl"
                           style={{ background: 'rgba(255,68,85,0.05)' }}>
                        <span className="font-semibold capitalize" style={{ color: '#FFF' }}>
                          {bt.type.replace('_', '/')}
                        </span>
                        <div className="flex items-center gap-4">
                          <span className="font-mono text-sm" style={{ color: '#FF4455' }}>{bt.winPct}%</span>
                          <span className="font-mono text-sm" style={{ color: '#FF4455' }}>{bt.roi}% ROI</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Analytics Tab - No AI Summary */}
        {activeTab === 'analytics' && !aiSummary && (
          <div className="text-center py-16">
            <Brain className="w-16 h-16 mx-auto mb-4" style={{ color: '#606070' }} />
            <h2 className="text-xl font-bold mb-2" style={{ color: '#FFF' }}>Analytics Coming Soon</h2>
            <p style={{ color: '#808090' }}>We&apos;re gathering more data to generate detailed analytics for this capper.</p>
          </div>
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
        
        {/* Trends Tab */}
        {activeTab === 'trends' && (
          <div className="text-center py-16">
            <Trending className="w-16 h-16 mx-auto mb-4" style={{ color: '#606070' }} />
            <h2 className="text-xl font-bold mb-2" style={{ color: '#FFF' }}>Trends Coming Soon</h2>
            <p style={{ color: '#808090' }}>Historical trend analysis and performance charts are in development.</p>
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
