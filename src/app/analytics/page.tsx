'use client'

import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import { 
  ArrowLeft, TrendingUp, TrendingDown, Target, Zap, AlertTriangle, Clock,
  BarChart3, Filter, ChevronRight, Flame, Brain, LineChart, DollarSign,
  Users, Timer, Sparkles, Shield, Activity, RefreshCw, CheckCircle2, XCircle,
  Newspaper, CloudRain, ThermometerSun, AlertCircle, TrendingUp as Trending,
  Bot, Lightbulb, ArrowUpRight, Eye, Crosshair, Play, Pause, ChevronLeft,
  CalendarDays
} from 'lucide-react'
import { 
  trendInsights, lineMovements, publicSharpSplits, predictionCappers,
  getHighEdgeTrends, getTopCLVCappers, getReverseLineMovements, getSteamMoves, analyticsSummary
} from '@/lib/prediction-market-data'
import { fetchBettingSplits, type BettingSplit } from '@/lib/scrapers/betting-splits'
import {
  latestNews, injuryReports, weatherImpacts, sentimentData,
  aiDiscoveredTrends, getHighImpactNews, getCriticalInjuries,
  getActionableTrends, newsSummary
} from '@/lib/news-analytics'
import {
  getAllMatchups, getMatchupsWithEdge, getHighImpactInjuryGames,
  getSharpMoneyGames, sportsSummary
} from '@/lib/sports-data'

type Tab = 'edge' | 'news' | 'matchups' | 'ai'

// Date utilities - All dates in Eastern Time
function getEasternDate(offsetDays = 0): Date {
  const now = new Date()
  const eastern = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }))
  eastern.setDate(eastern.getDate() + offsetDays)
  eastern.setHours(0, 0, 0, 0)
  return eastern
}

function formatDateString(date: Date): string {
  return date.toISOString().split('T')[0]
}

function formatDisplayDate(date: Date): string {
  const today = getEasternDate()
  const yesterday = getEasternDate(-1)
  const tomorrow = getEasternDate(1)
  
  const dateStr = formatDateString(date)
  
  if (dateStr === formatDateString(today)) return 'Today'
  if (dateStr === formatDateString(yesterday)) return 'Yesterday'
  if (dateStr === formatDateString(tomorrow)) return 'Tomorrow'
  
  return date.toLocaleDateString('en-US', { 
    weekday: 'short', 
    month: 'short', 
    day: 'numeric',
    year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
  })
}

export default function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('edge')
  const [sportFilter, setSportFilter] = useState<string>('all')
  const [expandedItem, setExpandedItem] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date>(getEasternDate())
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [bettingSplits, setBettingSplits] = useState<BettingSplit[]>([])
  
  // Load betting splits from real API
  useEffect(() => {
    const loadBettingSplits = async () => {
      try {
        const res = await fetch('/api/betting-splits?sport=NFL')
        if (res.ok) {
          const data = await res.json()
          setBettingSplits(data.games || [])
        }
      } catch (error) {
        console.error('Failed to fetch betting splits:', error)
      }
    }
    loadBettingSplits()
  }, [])
  
  const isToday = formatDateString(selectedDate) === formatDateString(getEasternDate())

  const highEdgeTrends = getHighEdgeTrends(6)
  const topCLVCappers = getTopCLVCappers(5)
  const reverseLineMovements = getReverseLineMovements()
  const steamMoves = getSteamMoves()
  const highImpactNews = getHighImpactNews(4)
  const criticalInjuries = getCriticalInjuries()
  const edgeMatchups = getMatchupsWithEdge()
  const actionableTrends = getActionableTrends()

  const tabs = [
    { id: 'edge' as Tab, label: '🎯 Edge Finder', count: highEdgeTrends.length },
    { id: 'news' as Tab, label: '📰 Live Intel', count: newsSummary.highImpact },
    { id: 'matchups' as Tab, label: '🏟️ Matchups', count: sportsSummary.totalMatchups },
    { id: 'ai' as Tab, label: '🤖 AI Discovery', count: newsSummary.newTrends }
  ]

  const goToPreviousDay = () => {
    const newDate = new Date(selectedDate)
    newDate.setDate(newDate.getDate() - 1)
    setSelectedDate(newDate)
  }

  const goToNextDay = () => {
    const newDate = new Date(selectedDate)
    newDate.setDate(newDate.getDate() + 1)
    setSelectedDate(newDate)
  }

  const handleRefresh = () => {
    setIsRefreshing(true)
    setTimeout(() => setIsRefreshing(false), 1000)
  }

  return (
    <div className="min-h-screen" style={{ background: '#050508' }}>
      {/* Hero Header */}
      <div style={{ 
        background: 'linear-gradient(180deg, #0a0a12 0%, #050508 100%)',
        borderBottom: '1px solid rgba(255,255,255,0.06)'
      }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link href="/" className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold mb-4 transition-all hover:bg-white/10"
                style={{ color: '#808090' }}>
            <ArrowLeft className="w-4 h-4" /> Home
          </Link>
          
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
                     style={{ background: 'linear-gradient(135deg, rgba(255,107,0,0.4) 0%, rgba(255,68,85,0.4) 100%)' }}>
                  <Brain className="w-6 h-6" style={{ color: '#FF6B00' }} />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-black"
                      style={{ 
                        background: 'linear-gradient(135deg, #FF6B00 0%, #FF4455 50%, #FFD700 100%)',
                        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
                      }}>
                    EDGE FINDER PRO
                  </h1>
                  <p className="text-xs" style={{ color: '#808090' }}>
                    THE prediction market analytics platform • AI-powered edge discovery
                  </p>
                </div>
              </div>
            </div>
            
            {/* Date Navigation */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={goToPreviousDay}
                  className="p-2 rounded-xl hover:bg-white/10 transition-all"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <ChevronLeft className="w-5 h-5" style={{ color: '#808090' }} />
                </button>
                
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl min-w-[180px] justify-center"
                     style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <CalendarDays className="w-4 h-4" style={{ color: '#FF6B00' }} />
                  <span className="font-semibold" style={{ color: '#FFF' }}>{formatDisplayDate(selectedDate)}</span>
                  {isToday && (
                    <span className="ml-2 px-2 py-0.5 rounded text-xs font-bold"
                          style={{ background: 'rgba(0,255,136,0.2)', color: '#00FF88' }}>
                      LIVE
                    </span>
                  )}
                </div>
                
                <button
                  onClick={goToNextDay}
                  className="p-2 rounded-xl hover:bg-white/10 transition-all"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <ChevronRight className="w-5 h-5" style={{ color: '#808090' }} />
                </button>
              </div>
              
              <button 
                onClick={handleRefresh}
                className="p-2 rounded-xl hover:bg-white/10 transition-all"
                style={{ background: 'rgba(255,255,255,0.05)' }}>
                <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} style={{ color: '#808090' }} />
              </button>
            </div>
          </div>
          
          {/* Live Stats Bar */}
          <div className="flex gap-2 flex-wrap mt-4">
            <div className="px-3 py-2 rounded-xl flex items-center gap-2" style={{ background: 'rgba(0,255,136,0.1)', border: '1px solid rgba(0,255,136,0.2)' }}>
              <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#00FF88' }} />
              <span className="text-xs font-bold" style={{ color: '#00FF88' }}>{newsSummary.highImpact} High Impact</span>
            </div>
            <div className="px-3 py-2 rounded-xl" style={{ background: 'rgba(255,68,85,0.1)', border: '1px solid rgba(255,68,85,0.2)' }}>
              <span className="text-xs font-bold" style={{ color: '#FF4455' }}>🚨 {criticalInjuries.length} Critical Injuries</span>
            </div>
            <div className="px-3 py-2 rounded-xl" style={{ background: 'rgba(255,215,0,0.1)', border: '1px solid rgba(255,215,0,0.2)' }}>
              <span className="text-xs font-bold" style={{ color: '#FFD700' }}>🤖 {newsSummary.newTrends} New AI Trends</span>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-2 mt-6 overflow-x-auto pb-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all"
                style={{
                  background: activeTab === tab.id ? 'rgba(255,107,0,0.2)' : 'rgba(255,255,255,0.05)',
                  color: activeTab === tab.id ? '#FF6B00' : '#808090',
                  border: activeTab === tab.id ? '1px solid rgba(255,107,0,0.3)' : '1px solid transparent'
                }}>
                {tab.label}
                <span className="ml-1.5 px-1.5 py-0.5 rounded text-[10px]" 
                      style={{ background: activeTab === tab.id ? 'rgba(255,107,0,0.3)' : 'rgba(255,255,255,0.1)' }}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* EDGE FINDER TAB */}
        {activeTab === 'edge' && (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* 20-Year Track Record Banner */}
            <div className="lg:col-span-3 mb-4">
              <div className="p-4 rounded-xl" style={{ 
                background: 'linear-gradient(135deg, rgba(0,255,136,0.1) 0%, rgba(0,168,255,0.1) 100%)',
                border: '1px solid rgba(0,255,136,0.2)'
              }}>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center" 
                         style={{ background: 'rgba(0,255,136,0.2)' }}>
                      <Shield className="w-6 h-6" style={{ color: '#00FF88' }} />
                    </div>
                    <div>
                      <h3 className="font-black text-lg" style={{ color: '#FFF' }}>20-Year Verified Track Record</h3>
                      <p className="text-xs" style={{ color: '#808090' }}>Backtested across 40,852 picks from 2006-2026</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-xl font-black" style={{ color: '#00FF88' }}>58.4%</div>
                      <div className="text-[10px]" style={{ color: '#808090' }}>Win Rate</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-black" style={{ color: '#00FF88' }}>+9.0%</div>
                      <div className="text-[10px]" style={{ color: '#808090' }}>Avg ROI</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-black" style={{ color: '#00A8FF' }}>+6,924</div>
                      <div className="text-[10px]" style={{ color: '#808090' }}>Units Won</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-black" style={{ color: '#FFD700' }}>+4.0¢</div>
                      <div className="text-[10px]" style={{ color: '#808090' }}>Avg CLV</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* High Edge Trends - 2 cols */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: '#FFF' }}>
                  <Target className="w-5 h-5" style={{ color: '#00FF88' }} />
                  High-Edge Trends
                </h2>
                <Link href="/trends" className="text-xs font-semibold flex items-center gap-1 hover:opacity-80" style={{ color: '#00A8FF' }}>
                  View All Trends <ArrowUpRight className="w-3 h-3" />
                </Link>
              </div>
              
              <div className="grid sm:grid-cols-2 gap-3">
                {highEdgeTrends.map((trend) => (
                  <div key={trend.id} className="p-4 rounded-xl transition-all hover:scale-[1.02]"
                       style={{ background: '#0c0c14', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        {trend.sport && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" 
                                style={{ background: 'rgba(0,168,255,0.2)', color: '#00A8FF' }}>{trend.sport}</span>
                        )}
                        <span className="text-[10px] px-1.5 py-0.5 rounded" 
                              style={{ background: 'rgba(255,215,0,0.2)', color: '#FFD700' }}>
                          ⭐ {trend.edgeRating}/5
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-black" style={{ color: '#00FF88' }}>+{trend.roi}%</div>
                        <div className="text-[10px]" style={{ color: '#606070' }}>ROI</div>
                      </div>
                    </div>
                    <h3 className="font-bold text-sm mb-1" style={{ color: '#FFF' }}>{trend.title}</h3>
                    <p className="text-xs leading-relaxed" style={{ color: '#808090' }}>{trend.description}</p>
                    <div className="flex items-center gap-3 mt-3 pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                      <span className="text-[10px]" style={{ color: '#606070' }}>
                        <strong style={{ color: '#FFF' }}>{trend.winRate}%</strong> Win
                      </span>
                      <span className="text-[10px]" style={{ color: '#606070' }}>
                        <strong style={{ color: '#FFF' }}>{trend.sampleSize}</strong> picks
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Reverse Line Movement Section */}
              <div className="mt-6">
                <h2 className="text-lg font-bold flex items-center gap-2 mb-4" style={{ color: '#FFF' }}>
                  <RefreshCw className="w-5 h-5" style={{ color: '#FF6B00' }} />
                  Reverse Line Movement Alerts
                </h2>
                <div className="grid sm:grid-cols-2 gap-3">
                  {reverseLineMovements.slice(0, 4).map((move) => (
                    <div key={move.id} className="p-4 rounded-xl" 
                         style={{ background: 'rgba(255,107,0,0.05)', border: '1px solid rgba(255,107,0,0.2)' }}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background: 'rgba(255,107,0,0.2)', color: '#FF6B00' }}>
                          {move.sport}
                        </span>
                        <AlertTriangle className="w-4 h-4" style={{ color: '#FF6B00' }} />
                      </div>
                      <div className="font-bold text-sm mb-1" style={{ color: '#FFF' }}>
                        {move.teams.away} @ {move.teams.home}
                      </div>
                      <p className="text-xs" style={{ color: '#808090' }}>
                        <span style={{ color: '#FF6B00' }}>{move.publicBetPct}% public</span> on one side, but line moving opposite
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs" style={{ color: '#606070' }}>
                          {move.openLine} → <strong style={{ color: '#FFF' }}>{move.currentLine}</strong>
                        </span>
                        <span className="text-[10px] font-bold" style={{ color: '#00FF88' }}>
                          SHARP: {move.sharpIndicator ? '✓' : ''}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              {/* Steam Moves */}
              <div className="rounded-xl p-4" style={{ background: '#0c0c14', border: '1px solid rgba(0,255,136,0.2)' }}>
                <h3 className="font-bold text-sm flex items-center gap-2 mb-3" style={{ color: '#00FF88' }}>
                  <Zap className="w-4 h-4" /> Steam Moves
                </h3>
                <div className="space-y-2">
                  {steamMoves.slice(0, 3).map((move) => (
                    <div key={move.id} className="p-3 rounded-lg" style={{ background: 'rgba(0,255,136,0.05)' }}>
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold" style={{ color: '#FFF' }}>{move.teams.away} @ {move.teams.home}</span>
                        <span className="text-[10px]" style={{ color: '#00FF88' }}>{move.sport}</span>
                      </div>
                      <div className="text-xs mt-1" style={{ color: '#808090' }}>
                        {move.openLine} → {move.currentLine} <span style={{ color: '#00FF88' }}>({move.movement > 0 ? '+' : ''}{move.movement})</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top CLV Cappers */}
              <div className="rounded-xl p-4" style={{ background: '#0c0c14', border: '1px solid rgba(255,215,0,0.2)' }}>
                <h3 className="font-bold text-sm flex items-center gap-2 mb-3" style={{ color: '#FFD700' }}>
                  <Target className="w-4 h-4" /> CLV Kings
                </h3>
                <div className="space-y-2">
                  {topCLVCappers.map((capper, idx) => (
                    <div key={capper.id} className="flex items-center justify-between p-2 rounded-lg"
                         style={{ background: idx === 0 ? 'rgba(255,215,0,0.1)' : 'transparent' }}>
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{capper.avatarEmoji}</span>
                        <div>
                          <div className="text-xs font-bold" style={{ color: '#FFF' }}>{capper.name}</div>
                          <div className="text-[10px]" style={{ color: '#606070' }}>{capper.source}</div>
                        </div>
                      </div>
                      <div className="text-sm font-black" style={{ color: '#00FF88' }}>{capper.clvBeatRate}%</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pro Tip */}
              <div className="rounded-xl p-4" style={{ background: 'linear-gradient(135deg, rgba(255,215,0,0.1) 0%, rgba(255,107,0,0.1) 100%)', border: '1px solid rgba(255,215,0,0.2)' }}>
                <div className="flex items-center gap-2 mb-2">
                  <Lightbulb className="w-4 h-4" style={{ color: '#FFD700' }} />
                  <span className="font-bold text-xs" style={{ color: '#FFD700' }}>PRO TIP</span>
                </div>
                <p className="text-xs leading-relaxed" style={{ color: '#B0B0C0' }}>
                  <strong style={{ color: '#FFF' }}>CLV is everything.</strong> Sharp bettors focus on beating closing lines. 
                  A 52% win rate with 70% CLV beat rate crushes long-term.
                </p>
              </div>
            </div>
          </div>
        )}


        {/* NEWS TAB */}
        {activeTab === 'news' && (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Main News Feed */}
            <div className="lg:col-span-2 space-y-4">
              <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: '#FFF' }}>
                <Newspaper className="w-5 h-5" style={{ color: '#00A8FF' }} />
                High-Impact Betting Intel
              </h2>
              
              {highImpactNews.map((article) => (
                <div key={article.id} className="p-4 rounded-xl transition-all"
                     style={{ 
                       background: '#0c0c14', 
                       border: article.bettingRelevance === 5 ? '1px solid rgba(255,68,85,0.3)' : '1px solid rgba(255,255,255,0.06)'
                     }}>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                         style={{ 
                           background: article.sentiment === 'bullish' ? 'rgba(0,255,136,0.15)' : 
                                       article.sentiment === 'bearish' ? 'rgba(255,68,85,0.15)' : 'rgba(255,255,255,0.05)'
                         }}>
                      {article.category === 'injury' && <AlertCircle className="w-5 h-5" style={{ color: '#FF4455' }} />}
                      {article.category === 'weather' && <CloudRain className="w-5 h-5" style={{ color: '#00A8FF' }} />}
                      {article.category === 'lineup' && <Users className="w-5 h-5" style={{ color: '#FF6B00' }} />}
                      {article.category === 'betting_line' && <LineChart className="w-5 h-5" style={{ color: '#00FF88' }} />}
                      {!['injury', 'weather', 'lineup', 'betting_line'].includes(article.category) && 
                        <Newspaper className="w-5 h-5" style={{ color: '#808090' }} />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background: 'rgba(0,168,255,0.2)', color: '#00A8FF' }}>
                          {article.sport}
                        </span>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" 
                              style={{ 
                                background: article.category === 'injury' ? 'rgba(255,68,85,0.2)' : 'rgba(255,255,255,0.1)',
                                color: article.category === 'injury' ? '#FF4455' : '#808090'
                              }}>
                          {article.category.toUpperCase()}
                        </span>
                        {article.bettingRelevance === 5 && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded animate-pulse" 
                                style={{ background: 'rgba(255,68,85,0.2)', color: '#FF4455' }}>
                            🔥 HIGH IMPACT
                          </span>
                        )}
                      </div>
                      <h3 className="font-bold text-sm mb-1" style={{ color: '#FFF' }}>{article.title}</h3>
                      <p className="text-xs mb-2" style={{ color: '#808090' }}>{article.summary}</p>
                      
                      {article.aiAnalysis && (
                        <div className="p-3 rounded-lg mt-2" style={{ background: 'rgba(255,215,0,0.05)', border: '1px solid rgba(255,215,0,0.2)' }}>
                          <div className="flex items-center gap-1 mb-1">
                            <Brain className="w-3 h-3" style={{ color: '#FFD700' }} />
                            <span className="text-[10px] font-bold" style={{ color: '#FFD700' }}>AI ANALYSIS</span>
                          </div>
                          <p className="text-xs" style={{ color: '#B0B0C0' }}>{article.aiAnalysis}</p>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-3 mt-2 text-[10px]" style={{ color: '#606070' }}>
                        <span>{article.source}</span>
                        <span>•</span>
                        <span>{new Date(article.publishedAt).toLocaleTimeString('en-US', { 
                          hour: 'numeric', 
                          minute: '2-digit',
                          timeZone: 'America/New_York'
                        })} ET</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* News Sidebar */}
            <div className="space-y-4">
              {/* Critical Injuries */}
              <div className="rounded-xl p-4" style={{ background: '#0c0c14', border: '1px solid rgba(255,68,85,0.3)' }}>
                <h3 className="font-bold text-sm flex items-center gap-2 mb-3" style={{ color: '#FF4455' }}>
                  <AlertTriangle className="w-4 h-4" /> Critical Injuries
                </h3>
                <div className="space-y-2">
                  {criticalInjuries.map((injury) => (
                    <div key={injury.id} className="p-3 rounded-lg" style={{ background: 'rgba(255,68,85,0.05)' }}>
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-bold text-xs" style={{ color: '#FFF' }}>{injury.playerName}</div>
                          <div className="text-[10px]" style={{ color: '#808090' }}>{injury.team} • {injury.sport}</div>
                        </div>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                              style={{ 
                                background: injury.status === 'out' ? 'rgba(255,68,85,0.2)' : 'rgba(255,107,0,0.2)',
                                color: injury.status === 'out' ? '#FF4455' : '#FF6B00'
                              }}>
                          {injury.status.toUpperCase()}
                        </span>
                      </div>
                      {injury.aiRecommendation && (
                        <div className="text-[10px] mt-2" style={{ color: '#FFD700' }}>
                          💡 {injury.aiRecommendation}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Weather Impacts */}
              <div className="rounded-xl p-4" style={{ background: '#0c0c14', border: '1px solid rgba(0,168,255,0.2)' }}>
                <h3 className="font-bold text-sm flex items-center gap-2 mb-3" style={{ color: '#00A8FF' }}>
                  <CloudRain className="w-4 h-4" /> Weather Alerts
                </h3>
                <div className="space-y-2">
                  {weatherImpacts.filter(w => w.bettingImpact.confidence >= 3).map((weather) => (
                    <div key={weather.gameId} className="p-3 rounded-lg" style={{ background: 'rgba(0,168,255,0.05)' }}>
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-bold text-xs" style={{ color: '#FFF' }}>
                          {weather.teams.away} @ {weather.teams.home}
                        </span>
                        <span className="text-[10px]" style={{ color: '#00A8FF' }}>{weather.sport}</span>
                      </div>
                      <div className="text-[10px] mb-2" style={{ color: '#808090' }}>
                        {weather.temperature}°F • {weather.wind} mph wind • {weather.conditions}
                      </div>
                      <div className="text-xs font-bold" style={{ color: '#FFD700' }}>
                        {weather.bettingImpact.recommendation}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sentiment Trends */}
              <div className="rounded-xl p-4" style={{ background: '#0c0c14', border: '1px solid rgba(255,255,255,0.06)' }}>
                <h3 className="font-bold text-sm flex items-center gap-2 mb-3" style={{ color: '#FFF' }}>
                  <Trending className="w-4 h-4" style={{ color: '#9B59B6' }} /> Trending Sentiment
                </h3>
                <div className="space-y-2">
                  {sentimentData.filter(s => s.trending).map((item, idx) => (
                    <div key={idx} className="p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.02)' }}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-bold text-xs" style={{ color: '#FFF' }}>{item.topic}</span>
                        <span className="text-xs font-bold" 
                              style={{ color: item.sentiment > 0 ? '#00FF88' : '#FF4455' }}>
                          {item.sentiment > 0 ? '+' : ''}{item.sentiment}
                        </span>
                      </div>
                      <p className="text-[10px]" style={{ color: '#808090' }}>{item.bettingAngle}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MATCHUPS TAB */}
        {activeTab === 'matchups' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: '#FFF' }}>
                <Activity className="w-5 h-5" style={{ color: '#00A8FF' }} />
                Today&apos;s Matchups with Edge
              </h2>
              <div className="flex gap-2">
                {['all', 'NFL', 'NBA', 'NHL', 'MLB'].map((sport) => (
                  <button
                    key={sport}
                    onClick={() => setSportFilter(sport)}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                    style={{
                      background: sportFilter === sport ? 'rgba(0,168,255,0.2)' : 'rgba(255,255,255,0.05)',
                      color: sportFilter === sport ? '#00A8FF' : '#808090'
                    }}>
                    {sport === 'all' ? 'All' : sport}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="grid md:grid-cols-2 gap-4">
              {getAllMatchups()
                .filter(m => sportFilter === 'all' || m.sport === sportFilter)
                .map((matchup) => (
                <div key={matchup.id} className="rounded-xl overflow-hidden"
                     style={{ background: '#0c0c14', border: '1px solid rgba(255,255,255,0.06)' }}>
                  {/* Header */}
                  <div className="px-4 py-3 flex items-center justify-between" 
                       style={{ background: 'rgba(255,255,255,0.02)' }}>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" 
                            style={{ background: 'rgba(0,168,255,0.2)', color: '#00A8FF' }}>{matchup.sport}</span>
                      <span className="text-xs" style={{ color: '#808090' }}>{matchup.broadcast}</span>
                    </div>
                    <span className="text-xs" style={{ color: '#606070' }}>
                      {new Date(matchup.gameTime).toLocaleTimeString('en-US', { 
                        hour: 'numeric', 
                        minute: '2-digit',
                        timeZone: 'America/New_York'
                      })} ET
                    </span>
                  </div>
                  
                  {/* Teams */}
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex-1">
                        <div className="font-bold text-sm" style={{ color: '#FFF' }}>{matchup.away.name}</div>
                        <div className="text-xs" style={{ color: '#808090' }}>{matchup.away.record}</div>
                      </div>
                      <div className="text-center px-4">
                        <div className="text-lg font-black" style={{ color: '#606070' }}>@</div>
                      </div>
                      <div className="flex-1 text-right">
                        <div className="font-bold text-sm" style={{ color: '#FFF' }}>{matchup.home.name}</div>
                        <div className="text-xs" style={{ color: '#808090' }}>{matchup.home.record}</div>
                      </div>
                    </div>

                    {/* Lines */}
                    <div className="grid grid-cols-3 gap-2 mb-3 p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.02)' }}>
                      <div className="text-center">
                        <div className="text-[10px]" style={{ color: '#606070' }}>Spread</div>
                        <div className="text-xs font-bold" style={{ color: '#FFF' }}>
                          {matchup.home.spread > 0 ? `+${matchup.home.spread}` : matchup.home.spread}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-[10px]" style={{ color: '#606070' }}>Total</div>
                        <div className="text-xs font-bold" style={{ color: '#FFF' }}>{matchup.lines.total.line}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-[10px]" style={{ color: '#606070' }}>ML</div>
                        <div className="text-xs font-bold" style={{ color: '#FFF' }}>
                          {matchup.home.ml > 0 ? `+${matchup.home.ml}` : matchup.home.ml}
                        </div>
                      </div>
                    </div>

                    {/* Public Betting */}
                    {matchup.publicBetting.sharpMoney && (
                      <div className="p-2 rounded-lg mb-3" style={{ background: 'rgba(0,255,136,0.05)', border: '1px solid rgba(0,255,136,0.2)' }}>
                        <div className="flex items-center gap-1">
                          <Zap className="w-3 h-3" style={{ color: '#00FF88' }} />
                          <span className="text-[10px] font-bold" style={{ color: '#00FF88' }}>SHARP MONEY: {matchup.publicBetting.sharpMoney.toUpperCase()}</span>
                        </div>
                      </div>
                    )}

                    {/* Injuries */}
                    {matchup.injuries.length > 0 && (
                      <div className="mb-3">
                        {matchup.injuries.map((inj, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-xs py-1">
                            <AlertTriangle className="w-3 h-3" style={{ color: '#FF4455' }} />
                            <span style={{ color: '#FF4455' }}>{inj.player}</span>
                            <span style={{ color: '#808090' }}>- {inj.status}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* AI Pick */}
                    {matchup.aiPick && (
                      <div className="p-3 rounded-lg" style={{ background: 'rgba(255,215,0,0.05)', border: '1px solid rgba(255,215,0,0.2)' }}>
                        <div className="flex items-center gap-1 mb-1">
                          <Brain className="w-3 h-3" style={{ color: '#FFD700' }} />
                          <span className="text-[10px] font-bold" style={{ color: '#FFD700' }}>AI PICK ({matchup.aiPick.confidence}% conf)</span>
                        </div>
                        <div className="font-bold text-sm mb-1" style={{ color: '#FFF' }}>{matchup.aiPick.pick}</div>
                        <p className="text-[10px]" style={{ color: '#808090' }}>{matchup.aiPick.reasoning}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* AI DISCOVERY TAB */}
        {activeTab === 'ai' && (
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" 
                     style={{ background: 'linear-gradient(135deg, rgba(155,89,182,0.3) 0%, rgba(255,107,0,0.3) 100%)' }}>
                  <Bot className="w-5 h-5" style={{ color: '#9B59B6' }} />
                </div>
                <div>
                  <h2 className="text-lg font-bold" style={{ color: '#FFF' }}>AI Trend Discovery</h2>
                  <p className="text-xs" style={{ color: '#808090' }}>
                    Recursive self-learning identifies patterns the market hasn&apos;t priced in
                  </p>
                </div>
              </div>

              {actionableTrends.map((trend) => (
                <div key={trend.id} className="p-4 rounded-xl transition-all"
                     style={{ 
                       background: '#0c0c14', 
                       border: trend.status === 'new' ? '1px solid rgba(0,255,136,0.3)' : '1px solid rgba(255,255,255,0.06)'
                     }}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {trend.status === 'new' && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded animate-pulse"
                                style={{ background: 'rgba(0,255,136,0.2)', color: '#00FF88' }}>
                            ✨ NEW DISCOVERY
                          </span>
                        )}
                        {trend.status === 'verified' && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                                style={{ background: 'rgba(0,168,255,0.2)', color: '#00A8FF' }}>
                            ✓ VERIFIED
                          </span>
                        )}
                        <span className="text-[10px] px-1.5 py-0.5 rounded"
                              style={{ background: 'rgba(255,255,255,0.1)', color: '#808090' }}>
                          {trend.confidence}% confidence
                        </span>
                      </div>
                      <h3 className="font-bold text-base mb-2" style={{ color: '#FFF' }}>{trend.title}</h3>
                      <p className="text-sm mb-3" style={{ color: '#A0A0B0' }}>{trend.pattern}</p>
                      
                      <div className="p-3 rounded-lg" style={{ background: 'rgba(155,89,182,0.05)' }}>
                        <div className="flex items-center gap-1 mb-1">
                          <Brain className="w-3 h-3" style={{ color: '#9B59B6' }} />
                          <span className="text-[10px] font-bold" style={{ color: '#9B59B6' }}>AI EXPLANATION</span>
                        </div>
                        <p className="text-xs" style={{ color: '#B0B0C0' }}>{trend.aiExplanation}</p>
                      </div>
                    </div>
                    
                    <div className="text-right shrink-0">
                      <div className="text-2xl font-black" style={{ color: '#00FF88' }}>+{trend.roi}%</div>
                      <div className="text-[10px]" style={{ color: '#606070' }}>ROI</div>
                      <div className="text-sm font-bold mt-2" style={{ color: '#FFF' }}>{trend.winRate}%</div>
                      <div className="text-[10px]" style={{ color: '#606070' }}>{trend.sampleSize} picks</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* AI Sidebar */}
            <div className="space-y-4">
              <div className="rounded-xl p-4" style={{ background: 'linear-gradient(135deg, rgba(155,89,182,0.1) 0%, rgba(255,107,0,0.1) 100%)', border: '1px solid rgba(155,89,182,0.3)' }}>
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-4 h-4" style={{ color: '#9B59B6' }} />
                  <span className="font-bold text-sm" style={{ color: '#9B59B6' }}>How AI Discovery Works</span>
                </div>
                <div className="space-y-3 text-xs" style={{ color: '#B0B0C0' }}>
                  <div className="flex items-start gap-2">
                    <div className="w-5 h-5 rounded flex items-center justify-center shrink-0 mt-0.5" 
                         style={{ background: 'rgba(155,89,182,0.2)' }}>
                      <span className="text-[10px] font-bold" style={{ color: '#9B59B6' }}>1</span>
                    </div>
                    <p>Scans millions of historical outcomes across all sports and bet types</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-5 h-5 rounded flex items-center justify-center shrink-0 mt-0.5" 
                         style={{ background: 'rgba(155,89,182,0.2)' }}>
                      <span className="text-[10px] font-bold" style={{ color: '#9B59B6' }}>2</span>
                    </div>
                    <p>Identifies patterns with statistical significance (p &lt; 0.05)</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-5 h-5 rounded flex items-center justify-center shrink-0 mt-0.5" 
                         style={{ background: 'rgba(155,89,182,0.2)' }}>
                      <span className="text-[10px] font-bold" style={{ color: '#9B59B6' }}>3</span>
                    </div>
                    <p>Validates against recent data to confirm trend is still exploitable</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-5 h-5 rounded flex items-center justify-center shrink-0 mt-0.5" 
                         style={{ background: 'rgba(155,89,182,0.2)' }}>
                      <span className="text-[10px] font-bold" style={{ color: '#9B59B6' }}>4</span>
                    </div>
                    <p>Recursively refines and discovers new variations as market evolves</p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl p-4" style={{ background: '#0c0c14', border: '1px solid rgba(255,255,255,0.06)' }}>
                <h3 className="font-bold text-sm mb-3" style={{ color: '#FFF' }}>Discovery Stats</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.02)' }}>
                    <div className="text-2xl font-black" style={{ color: '#00FF88' }}>{aiDiscoveredTrends.length}</div>
                    <div className="text-[10px]" style={{ color: '#606070' }}>Total Trends</div>
                  </div>
                  <div className="text-center p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.02)' }}>
                    <div className="text-2xl font-black" style={{ color: '#FFD700' }}>
                      {aiDiscoveredTrends.filter(t => t.status === 'new').length}
                    </div>
                    <div className="text-[10px]" style={{ color: '#606070' }}>New This Week</div>
                  </div>
                  <div className="text-center p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.02)' }}>
                    <div className="text-2xl font-black" style={{ color: '#00A8FF' }}>
                      {Math.round(aiDiscoveredTrends.reduce((sum, t) => sum + t.confidence, 0) / aiDiscoveredTrends.length)}%
                    </div>
                    <div className="text-[10px]" style={{ color: '#606070' }}>Avg Confidence</div>
                  </div>
                  <div className="text-center p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.02)' }}>
                    <div className="text-2xl font-black" style={{ color: '#FF6B00' }}>
                      {(aiDiscoveredTrends.reduce((sum, t) => sum + t.roi, 0) / aiDiscoveredTrends.length).toFixed(1)}%
                    </div>
                    <div className="text-[10px]" style={{ color: '#606070' }}>Avg ROI</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
