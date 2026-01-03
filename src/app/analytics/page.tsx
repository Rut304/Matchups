'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { 
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Target,
  Zap,
  AlertTriangle,
  Clock,
  BarChart3,
  Filter,
  ChevronRight,
  Flame,
  Brain,
  LineChart,
  DollarSign,
  Users,
  Timer,
  Sparkles,
  Shield,
  Activity,
  RefreshCw,
  CheckCircle2,
  XCircle
} from 'lucide-react'
import { 
  trendInsights, 
  lineMovements, 
  publicSharpSplits,
  predictionCappers,
  getHighEdgeTrends,
  getTrendsByCategory,
  getTrendsBySport,
  getTopCLVCappers,
  getReverseLineMovements,
  getSteamMoves,
  analyticsSummary
} from '@/lib/prediction-market-data'

type CategoryFilter = 'all' | 'clv' | 'line_movement' | 'contrarian' | 'situational' | 'market_efficiency' | 'timing' | 'public_vs_sharp'

const categoryLabels: Record<CategoryFilter, { label: string, icon: typeof TrendingUp, color: string }> = {
  all: { label: 'All Trends', icon: BarChart3, color: '#A0A0B0' },
  clv: { label: 'CLV Edge', icon: Target, color: '#00FF88' },
  line_movement: { label: 'Line Movement', icon: Activity, color: '#00A8FF' },
  contrarian: { label: 'Contrarian', icon: RefreshCw, color: '#FF6B00' },
  situational: { label: 'Situational', icon: Clock, color: '#9B59B6' },
  market_efficiency: { label: 'Market Inefficiency', icon: Brain, color: '#FFD700' },
  timing: { label: 'Timing Edge', icon: Timer, color: '#FF4455' },
  public_vs_sharp: { label: 'Public vs Sharp', icon: Users, color: '#00FF88' }
}

export default function AnalyticsPage() {
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all')
  const [sportFilter, setSportFilter] = useState<string>('all')
  const [minEdge, setMinEdge] = useState<number>(0)
  const [expandedTrend, setExpandedTrend] = useState<string | null>(null)

  // Filter trends
  const filteredTrends = useMemo(() => {
    let trends = [...trendInsights]
    
    if (categoryFilter !== 'all') {
      trends = trends.filter(t => t.category === categoryFilter)
    }
    if (sportFilter !== 'all') {
      trends = trends.filter(t => t.sport === sportFilter || !t.sport)
    }
    if (minEdge > 0) {
      trends = trends.filter(t => t.edgeRating >= minEdge)
    }
    
    return trends.sort((a, b) => b.roi - a.roi)
  }, [categoryFilter, sportFilter, minEdge])

  const highEdgeTrends = getHighEdgeTrends(4)
  const topCLVCappers = getTopCLVCappers(5)
  const reverseLineMovements = getReverseLineMovements()
  const steamMoves = getSteamMoves()

  const renderEdgeStars = (rating: number) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <div 
            key={star}
            className="w-2 h-2 rounded-full"
            style={{ 
              background: star <= rating ? '#FFD700' : 'rgba(255,255,255,0.1)'
            }}
          />
        ))}
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: '#050508' }}>
      {/* Header */}
      <div className="border-b" style={{ background: 'linear-gradient(180deg, #0a0a12 0%, #050508 100%)', borderColor: 'rgba(255,255,255,0.06)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Link href="/leaderboard" 
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold mb-6 transition-all hover:bg-white/10"
                style={{ color: '#808090' }}>
            <ArrowLeft className="w-4 h-4" />
            Back to Leaderboard
          </Link>
          
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
                     style={{ background: 'linear-gradient(135deg, rgba(255,107,0,0.3) 0%, rgba(255,68,85,0.3) 100%)' }}>
                  <Brain className="w-6 h-6" style={{ color: '#FF6B00' }} />
                </div>
                <h1 className="text-3xl sm:text-4xl font-black"
                    style={{ 
                      background: 'linear-gradient(135deg, #FF6B00 0%, #FF4455 50%, #FFD700 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent'
                    }}>
                  EDGE FINDER
                </h1>
              </div>
              <p className="text-sm" style={{ color: '#808090' }}>
                Deep analytics & trends that actually provide betting edge • CLV tracking • Sharp signals
              </p>
            </div>
            
            {/* Quick Stats */}
            <div className="flex gap-3">
              <div className="px-4 py-3 rounded-xl text-center" style={{ background: 'rgba(0,255,136,0.1)', border: '1px solid rgba(0,255,136,0.2)' }}>
                <div className="text-2xl font-black" style={{ color: '#00FF88' }}>{analyticsSummary.activeTrends}</div>
                <div className="text-[10px] font-semibold" style={{ color: '#808090' }}>Active Trends</div>
              </div>
              <div className="px-4 py-3 rounded-xl text-center" style={{ background: 'rgba(255,215,0,0.1)', border: '1px solid rgba(255,215,0,0.2)' }}>
                <div className="text-2xl font-black" style={{ color: '#FFD700' }}>{analyticsSummary.avgROI.toFixed(1)}%</div>
                <div className="text-[10px] font-semibold" style={{ color: '#808090' }}>Avg ROI</div>
              </div>
              <div className="px-4 py-3 rounded-xl text-center" style={{ background: 'rgba(0,168,255,0.1)', border: '1px solid rgba(0,168,255,0.2)' }}>
                <div className="text-2xl font-black" style={{ color: '#00A8FF' }}>{(analyticsSummary.totalSampleSize / 1000).toFixed(1)}k</div>
                <div className="text-[10px] font-semibold" style={{ color: '#808090' }}>Picks Analyzed</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid lg:grid-cols-4 gap-6">
          
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            
            {/* Filters */}
            <div className="rounded-2xl p-4" style={{ background: '#0c0c14', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="flex flex-wrap items-center gap-4">
                {/* Category Filter */}
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4" style={{ color: '#606070' }} />
                  <span className="text-xs font-semibold" style={{ color: '#606070' }}>CATEGORY:</span>
                  <div className="flex flex-wrap gap-1">
                    {Object.entries(categoryLabels).map(([key, { label, color }]) => (
                      <button
                        key={key}
                        onClick={() => setCategoryFilter(key as CategoryFilter)}
                        className="px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all"
                        style={{
                          background: categoryFilter === key ? `${color}20` : 'rgba(255,255,255,0.05)',
                          color: categoryFilter === key ? color : '#808090',
                          border: categoryFilter === key ? `1px solid ${color}40` : '1px solid transparent'
                        }}>
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Sport Filter */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold" style={{ color: '#606070' }}>SPORT:</span>
                  <div className="flex gap-1">
                    {['all', 'NFL', 'NBA', 'MLB', 'NHL', 'NCAAB'].map((sport) => (
                      <button
                        key={sport}
                        onClick={() => setSportFilter(sport)}
                        className="px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all"
                        style={{
                          background: sportFilter === sport ? 'rgba(0,168,255,0.2)' : 'rgba(255,255,255,0.05)',
                          color: sportFilter === sport ? '#00A8FF' : '#808090'
                        }}>
                        {sport === 'all' ? 'All' : sport}
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Min Edge Filter */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold" style={{ color: '#606070' }}>MIN EDGE:</span>
                  <div className="flex gap-1">
                    {[0, 3, 4, 5].map((edge) => (
                      <button
                        key={edge}
                        onClick={() => setMinEdge(edge)}
                        className="px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all"
                        style={{
                          background: minEdge === edge ? 'rgba(255,215,0,0.2)' : 'rgba(255,255,255,0.05)',
                          color: minEdge === edge ? '#FFD700' : '#808090'
                        }}>
                        {edge === 0 ? 'Any' : `${edge}+ ⭐`}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Trend Cards */}
            <div className="space-y-4">
              {filteredTrends.map((trend) => {
                const catInfo = categoryLabels[trend.category as CategoryFilter] || categoryLabels.all
                const isExpanded = expandedTrend === trend.id
                const IconComponent = catInfo.icon
                
                return (
                  <div 
                    key={trend.id}
                    className="rounded-2xl overflow-hidden transition-all"
                    style={{ 
                      background: '#0c0c14', 
                      border: `1px solid ${isExpanded ? catInfo.color + '40' : 'rgba(255,255,255,0.06)'}` 
                    }}>
                    
                    {/* Header Row */}
                    <div 
                      className="p-4 cursor-pointer hover:bg-white/[0.02] transition-all"
                      onClick={() => setExpandedTrend(isExpanded ? null : trend.id)}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                                 style={{ background: `${catInfo.color}20` }}>
                              <IconComponent className="w-4 h-4" style={{ color: catInfo.color }} />
                            </div>
                            <span className="text-xs font-bold px-2 py-0.5 rounded"
                                  style={{ background: `${catInfo.color}20`, color: catInfo.color }}>
                              {catInfo.label}
                            </span>
                            {trend.sport && (
                              <span className="text-xs font-semibold px-2 py-0.5 rounded"
                                    style={{ background: 'rgba(255,255,255,0.05)', color: '#808090' }}>
                                {trend.sport}
                              </span>
                            )}
                            {trend.isActive && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1"
                                    style={{ background: 'rgba(0,255,136,0.2)', color: '#00FF88' }}>
                                <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#00FF88' }} />
                                ACTIVE
                              </span>
                            )}
                          </div>
                          
                          <h3 className="font-bold text-lg mb-1" style={{ color: '#FFF' }}>{trend.title}</h3>
                          <p className="text-sm" style={{ color: '#A0A0B0' }}>{trend.description}</p>
                        </div>
                        
                        {/* Stats Column */}
                        <div className="flex flex-col items-end gap-2 shrink-0">
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <div className="text-xs" style={{ color: '#606070' }}>Win Rate</div>
                              <div className="font-black text-lg" style={{ color: trend.winRate >= 55 ? '#00FF88' : trend.winRate >= 52 ? '#FFD700' : '#FF4455' }}>
                                {trend.winRate.toFixed(1)}%
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-xs" style={{ color: '#606070' }}>ROI</div>
                              <div className="font-black text-lg" style={{ color: trend.roi > 0 ? '#00FF88' : '#FF4455' }}>
                                +{trend.roi.toFixed(1)}%
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px]" style={{ color: '#606070' }}>Edge Rating:</span>
                            {renderEdgeStars(trend.edgeRating)}
                          </div>
                        </div>
                      </div>
                      
                      {/* Quick Stats Row */}
                      <div className="flex items-center gap-4 mt-3 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                        <div className="flex items-center gap-1">
                          <BarChart3 className="w-3 h-3" style={{ color: '#606070' }} />
                          <span className="text-xs" style={{ color: '#808090' }}>
                            <strong style={{ color: '#FFF' }}>{trend.sampleSize.toLocaleString()}</strong> picks
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <DollarSign className="w-3 h-3" style={{ color: '#606070' }} />
                          <span className="text-xs" style={{ color: '#808090' }}>
                            Avg Odds: <strong style={{ color: '#FFF' }}>{trend.avgOdds}</strong>
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" style={{ color: '#606070' }} />
                          <span className="text-xs" style={{ color: '#808090' }}>{trend.timeframe}</span>
                        </div>
                        <ChevronRight 
                          className={`w-4 h-4 ml-auto transition-transform ${isExpanded ? 'rotate-90' : ''}`} 
                          style={{ color: '#606070' }} 
                        />
                      </div>
                    </div>
                    
                    {/* Expanded Details */}
                    {isExpanded && (
                      <div className="px-4 pb-4 pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                        <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.02)' }}>
                          <div className="flex items-center gap-2 mb-3">
                            <Sparkles className="w-4 h-4" style={{ color: '#FFD700' }} />
                            <span className="text-xs font-bold" style={{ color: '#FFD700' }}>HOW TO EXPLOIT THIS EDGE</span>
                          </div>
                          <p className="text-sm leading-relaxed" style={{ color: '#B0B0C0' }}>
                            {trend.details}
                          </p>
                          <div className="mt-4 flex items-center gap-2 text-[10px]" style={{ color: '#606070' }}>
                            <Clock className="w-3 h-3" />
                            Last updated: {new Date(trend.lastUpdated).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            
            {/* Real-Time Alerts */}
            <div className="rounded-2xl p-4" style={{ background: '#0c0c14', border: '1px solid rgba(255,68,85,0.3)' }}>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(255,68,85,0.15)' }}>
                  <Zap className="w-4 h-4" style={{ color: '#FF4455' }} />
                </div>
                <h3 className="font-bold text-sm" style={{ color: '#FF4455' }}>🚨 LIVE ALERTS</h3>
              </div>
              
              {/* Steam Moves */}
              {steamMoves.length > 0 && (
                <div className="mb-4">
                  <div className="text-[10px] font-bold mb-2" style={{ color: '#00FF88' }}>STEAM MOVES</div>
                  {steamMoves.map((move) => (
                    <div key={move.id} className="p-3 rounded-xl mb-2" style={{ background: 'rgba(0,255,136,0.05)' }}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold" style={{ color: '#FFF' }}>
                          {move.teams.away} @ {move.teams.home}
                        </span>
                        <span className="text-[10px]" style={{ color: '#00FF88' }}>{move.sport}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px]" style={{ color: '#808090' }}>
                          {move.openLine} → {move.currentLine}
                        </span>
                        <span className="text-[10px] font-bold" style={{ color: '#00FF88' }}>
                          ({move.movement > 0 ? '+' : ''}{move.movement})
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Reverse Line Movement */}
              {reverseLineMovements.length > 0 && (
                <div>
                  <div className="text-[10px] font-bold mb-2" style={{ color: '#FF6B00' }}>⚡ REVERSE LINE MOVEMENT</div>
                  {reverseLineMovements.map((move) => (
                    <div key={move.id} className="p-3 rounded-xl mb-2" style={{ background: 'rgba(255,107,0,0.05)' }}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold" style={{ color: '#FFF' }}>
                          {move.teams.away} @ {move.teams.home}
                        </span>
                        <AlertTriangle className="w-3 h-3" style={{ color: '#FF6B00' }} />
                      </div>
                      <div className="text-[10px]" style={{ color: '#808090' }}>
                        <span style={{ color: '#FF6B00' }}>{move.publicBetPct}% public</span> but line moved opposite
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Top CLV Cappers */}
            <div className="rounded-2xl p-4" style={{ background: '#0c0c14', border: '1px solid rgba(0,255,136,0.2)' }}>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(0,255,136,0.15)' }}>
                  <Target className="w-4 h-4" style={{ color: '#00FF88' }} />
                </div>
                <h3 className="font-bold text-sm" style={{ color: '#FFF' }}>👑 CLV Kings</h3>
              </div>
              <p className="text-[10px] mb-3" style={{ color: '#606070' }}>
                Cappers who consistently beat closing lines
              </p>
              <div className="space-y-2">
                {topCLVCappers.map((capper, idx) => (
                  <div key={capper.id} className="flex items-center justify-between p-2 rounded-lg"
                       style={{ background: idx === 0 ? 'rgba(255,215,0,0.1)' : 'rgba(255,255,255,0.02)' }}>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{capper.avatarEmoji}</span>
                      <div>
                        <span className="text-xs font-bold" style={{ color: '#FFF' }}>{capper.name}</span>
                        <div className="flex items-center gap-1">
                          <span className="text-[10px]" style={{ color: '#606070' }}>{capper.source}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-black" style={{ color: '#00FF88' }}>{capper.clvBeatRate.toFixed(1)}%</div>
                      <div className="text-[10px]" style={{ color: '#606070' }}>CLV Rate</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Public vs Sharp */}
            <div className="rounded-2xl p-4" style={{ background: '#0c0c14', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(0,168,255,0.15)' }}>
                  <Users className="w-4 h-4" style={{ color: '#00A8FF' }} />
                </div>
                <h3 className="font-bold text-sm" style={{ color: '#FFF' }}>📊 Public vs Sharp</h3>
              </div>
              <div className="space-y-3">
                {publicSharpSplits.map((split) => {
                  const isContrarian = split.spread.publicSide !== split.spread.sharpSide
                  return (
                    <div key={split.gameId} className="p-3 rounded-xl" 
                         style={{ background: isContrarian ? 'rgba(255,107,0,0.05)' : 'rgba(255,255,255,0.02)' }}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold" style={{ color: '#FFF' }}>
                          {split.teams.away} @ {split.teams.home}
                        </span>
                        {isContrarian && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                                style={{ background: 'rgba(255,107,0,0.2)', color: '#FF6B00' }}>
                            CONTRARIAN
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-[10px]">
                        <div>
                          <span style={{ color: '#606070' }}>Public: </span>
                          <span style={{ color: '#FF4455' }}>{split.spread.publicPct}% {split.spread.publicSide}</span>
                        </div>
                        <div>
                          <span style={{ color: '#606070' }}>Sharp: </span>
                          <span style={{ color: '#00FF88' }}>{split.spread.sharpSide}</span>
                          <span className="ml-1" style={{ color: '#FFD700' }}>
                            ({split.spread.sharpIndicators}/5)
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Key Insight */}
            <div className="rounded-2xl p-4" style={{ background: 'linear-gradient(135deg, rgba(255,215,0,0.1) 0%, rgba(255,107,0,0.1) 100%)', border: '1px solid rgba(255,215,0,0.2)' }}>
              <div className="flex items-center gap-2 mb-3">
                <Shield className="w-5 h-5" style={{ color: '#FFD700' }} />
                <span className="font-bold text-sm" style={{ color: '#FFD700' }}>💡 KEY INSIGHT</span>
              </div>
              <p className="text-xs leading-relaxed" style={{ color: '#B0B0C0' }}>
                <strong style={{ color: '#FFF' }}>CLV is everything.</strong> Win rate alone is misleading. 
                Sharp bettors focus on beating the closing line consistently. A bettor with 52% win rate 
                who beats CLV 70% of the time will crush long-term. Follow the CLV, not the record.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
