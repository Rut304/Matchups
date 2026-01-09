'use client'

import { useState, useEffect, Suspense, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { 
  Flame,
  BarChart3,
  RefreshCw,
  ChevronRight,
  Zap,
  Calendar,
  TrendingUp,
  CheckCircle,
  History
} from 'lucide-react'
import { 
  type HistoricalTrend,
  type SystemPerformance,
  type TimePeriod,
  getHistoricalTrends,
  getSystemPerformance,
  calculateAggregateStats,
  getTrendRecordForPeriod,
  getTrendROIForPeriod,
  getTrendUnitsForPeriod,
  getTimePeriodLabel
} from '@/lib/historical-data'

type Sport = 'all' | 'nfl' | 'nba' | 'nhl' | 'mlb'
type TrendType = 'all' | 'spread' | 'total' | 'moneyline'

const sportIcons: Record<string, string> = {
  'NFL': '🏈',
  'NBA': '🏀',
  'NHL': '🏒',
  'MLB': '⚾',
  'ALL': '📊'
}

function TrendsContent() {
  const searchParams = useSearchParams()
  const urlSport = searchParams.get('sport')?.toLowerCase() as Sport | null
  
  const [sport, setSport] = useState<Sport>(urlSport || 'all')
  const [trendType, setTrendType] = useState<TrendType>('all')
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('all')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [trends, setTrends] = useState<HistoricalTrend[]>([])
  const [performance, setPerformance] = useState<SystemPerformance[]>([])
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [trendsData, perfData] = await Promise.all([
        getHistoricalTrends(sport === 'all' ? undefined : sport.toUpperCase()),
        getSystemPerformance()
      ])
      setTrends(trendsData)
      setPerformance(perfData)
    } catch (error) {
      console.error('Error loading trends:', error)
    }
    setLoading(false)
  }, [sport])

  useEffect(() => {
    loadData()
  }, [loadData])

  useEffect(() => {
    if (urlSport && ['nfl', 'nba', 'nhl', 'mlb'].includes(urlSport)) {
      setSport(urlSport as Sport)
    }
  }, [urlSport])

  const filteredTrends = trends.filter(t => {
    if (sport !== 'all' && t.sport !== sport.toUpperCase() && t.sport !== 'ALL') return false
    if (trendType !== 'all' && t.bet_type !== trendType) return false
    return true
  })

  const hotTrends = trends.filter(t => t.hot_streak)

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await loadData()
    setIsRefreshing(false)
  }

  const stats = calculateAggregateStats(performance)

  const timePeriods: TimePeriod[] = ['30d', '90d', '1y', '5y', '10y', '20y', 'all']

  return (
    <div className="min-h-screen" style={{ background: '#050508' }}>
      {/* Hero Header */}
      <section className="relative overflow-hidden" style={{ background: 'linear-gradient(180deg, #0a0a12 0%, #050508 100%)' }}>
        <div className="absolute top-0 right-1/3 w-96 h-96 rounded-full opacity-15 blur-3xl pointer-events-none" 
             style={{ background: 'radial-gradient(circle, #00FF88 0%, transparent 70%)' }} />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 relative z-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-3xl">📊</span>
              <div>
                <h1 className="text-2xl font-black" style={{ color: '#FFF' }}>Betting Trends</h1>
                <div className="flex items-center gap-2">
                  <p className="text-sm" style={{ color: '#808090' }}>Data-driven edges across all sports</p>
                  <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full" 
                        style={{ background: 'rgba(0,255,136,0.15)', color: '#00FF88' }}>
                    <History size={10} /> 20 Years of Data
                  </span>
                </div>
              </div>
            </div>
            
            {/* Filters */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Time Period Filter */}
              <div className="flex items-center gap-1 p-1 rounded-lg" style={{ background: 'rgba(255,255,255,0.05)' }}>
                {timePeriods.map((p) => (
                  <button key={p} onClick={() => setTimePeriod(p)}
                          className="px-2 py-1.5 rounded-md text-[10px] font-semibold uppercase transition-all"
                          style={{ 
                            background: timePeriod === p ? 'rgba(0,168,255,0.3)' : 'transparent',
                            color: timePeriod === p ? '#00A8FF' : '#808090'
                          }}>
                    {p === 'all' ? 'All' : p === '20y' ? '20Y' : p === '10y' ? '10Y' : p === '5y' ? '5Y' : p.toUpperCase()}
                  </button>
                ))}
              </div>
              
              {/* Sport Filter */}
              <div className="flex items-center gap-1 p-1 rounded-lg" style={{ background: 'rgba(255,255,255,0.05)' }}>
                {(['all', 'nfl', 'nba', 'nhl', 'mlb'] as Sport[]).map((s) => (
                  <button key={s} onClick={() => setSport(s)}
                          className="px-3 py-1.5 rounded-md text-xs font-semibold uppercase transition-all"
                          style={{ 
                            background: sport === s ? 'linear-gradient(135deg, #00FF88, #00CC6A)' : 'transparent',
                            color: sport === s ? '#000' : '#808090'
                          }}>
                    {s === 'all' ? 'All' : s}
                  </button>
                ))}
              </div>
              
              {/* Type Filter */}
              <div className="flex items-center gap-1 p-1 rounded-lg" style={{ background: 'rgba(255,255,255,0.05)' }}>
                {(['all', 'spread', 'total', 'moneyline'] as TrendType[]).map((t) => (
                  <button key={t} onClick={() => setTrendType(t)}
                          className="px-3 py-1.5 rounded-md text-xs font-semibold uppercase transition-all"
                          style={{ 
                            background: trendType === t ? 'rgba(255,255,255,0.1)' : 'transparent',
                            color: trendType === t ? '#FFF' : '#808090'
                          }}>
                    {t === 'all' ? 'All' : t === 'moneyline' ? 'ML' : t === 'spread' ? 'ATS' : 'O/U'}
                  </button>
                ))}
              </div>
              
              <button onClick={handleRefresh}
                      className="p-2 rounded-lg transition-all hover:bg-white/10"
                      style={{ background: 'rgba(255,255,255,0.05)' }}>
                <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} style={{ color: '#808090' }} />
              </button>
            </div>
          </div>
          
          {/* Historical Performance Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mt-4">
            <div className="p-3 rounded-lg" style={{ background: 'rgba(0,255,136,0.1)' }}>
              <div className="flex items-center gap-1 mb-1">
                <TrendingUp size={12} style={{ color: '#00FF88' }} />
                <span className="text-[10px]" style={{ color: '#808090' }}>Total Picks</span>
              </div>
              <div className="text-xl font-black" style={{ color: '#00FF88' }}>{stats.totalPicks.toLocaleString()}</div>
              <div className="text-[10px]" style={{ color: '#606070' }}>{getTimePeriodLabel(timePeriod)}</div>
            </div>
            <div className="p-3 rounded-lg" style={{ background: 'rgba(255,107,0,0.1)' }}>
              <div className="flex items-center gap-1 mb-1">
                <CheckCircle size={12} style={{ color: '#FF6B00' }} />
                <span className="text-[10px]" style={{ color: '#808090' }}>Win Rate</span>
              </div>
              <div className="text-xl font-black" style={{ color: '#FF6B00' }}>{stats.winRate}%</div>
              <div className="text-[10px]" style={{ color: '#606070' }}>Verified Results</div>
            </div>
            <div className="p-3 rounded-lg" style={{ background: 'rgba(0,168,255,0.1)' }}>
              <div className="flex items-center gap-1 mb-1">
                <BarChart3 size={12} style={{ color: '#00A8FF' }} />
                <span className="text-[10px]" style={{ color: '#808090' }}>ROI</span>
              </div>
              <div className="text-xl font-black" style={{ color: '#00A8FF' }}>+{stats.roi}%</div>
              <div className="text-[10px]" style={{ color: '#606070' }}>Return on Investment</div>
            </div>
            <div className="p-3 rounded-lg" style={{ background: 'rgba(255,51,102,0.1)' }}>
              <div className="flex items-center gap-1 mb-1">
                <Zap size={12} style={{ color: '#FF3366' }} />
                <span className="text-[10px]" style={{ color: '#808090' }}>Total Units</span>
              </div>
              <div className="text-xl font-black" style={{ color: '#FF3366' }}>+{stats.totalUnits.toFixed(1)}</div>
              <div className="text-[10px]" style={{ color: '#606070' }}>Profit (Units)</div>
            </div>
            <div className="p-3 rounded-lg" style={{ background: 'rgba(255,215,0,0.1)' }}>
              <div className="flex items-center gap-1 mb-1">
                <Calendar size={12} style={{ color: '#FFD700' }} />
                <span className="text-[10px]" style={{ color: '#808090' }}>Track Record</span>
              </div>
              <div className="text-xl font-black" style={{ color: '#FFD700' }}>{stats.trackRecord}</div>
              <div className="text-[10px]" style={{ color: '#606070' }}>Jan 2024 - Present</div>
            </div>
          </div>
        </div>
      </section>

      {/* Trends Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin w-8 h-8 border-2 rounded-full" style={{ borderColor: '#00FF88', borderTopColor: 'transparent' }} />
          </div>
        ) : (
          <div className="grid lg:grid-cols-4 gap-4">
            
            {/* Trends List */}
            <div className="lg:col-span-3">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold" style={{ color: '#FFF' }}>
                  {filteredTrends.length} Trends Found
                  <span className="ml-2 text-sm font-normal" style={{ color: '#808090' }}>
                    ({getTimePeriodLabel(timePeriod)})
                  </span>
                </h2>
              </div>
              
              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
                {filteredTrends.map((trend) => (
                  <div key={trend.id}
                       className="rounded-xl overflow-hidden transition-all hover:scale-[1.02] cursor-pointer group"
                       style={{ 
                         background: '#0c0c14',
                         border: trend.hot_streak ? '1px solid rgba(0,255,136,0.3)' : '1px solid rgba(255,255,255,0.06)'
                       }}>
                    <div className="p-3">
                      {/* Header */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{sportIcons[trend.sport] || '📊'}</span>
                          <span className="text-xs uppercase font-bold" style={{ color: '#808090' }}>{trend.sport}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded"
                                style={{ 
                                  background: trend.bet_type === 'spread' ? 'rgba(0,168,255,0.15)' : trend.bet_type === 'total' ? 'rgba(255,107,0,0.15)' : 'rgba(0,255,136,0.15)',
                                  color: trend.bet_type === 'spread' ? '#00A8FF' : trend.bet_type === 'total' ? '#FF6B00' : '#00FF88'
                                }}>
                            {trend.bet_type === 'spread' ? 'ATS' : trend.bet_type === 'total' ? 'O/U' : 'ML'}
                          </span>
                        </div>
                        {trend.hot_streak && (
                          <span className="flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded"
                                style={{ background: 'rgba(0,255,136,0.2)', color: '#00FF88' }}>
                            <Flame style={{ width: '8px', height: '8px' }} /> HOT
                          </span>
                        )}
                      </div>
                      
                      {/* Trend Text */}
                      <h3 className="font-semibold text-sm mb-1" style={{ color: '#FFF' }}>{trend.trend_name}</h3>
                      <p className="text-[11px] mb-3 line-clamp-2" style={{ color: '#808090' }}>{trend.trend_description}</p>
                      
                      {/* Stats Grid */}
                      <div className="grid grid-cols-4 gap-2">
                        <div className="text-center">
                          <div className="text-base font-black" style={{ color: '#00FF88' }}>
                            {getTrendRecordForPeriod(trend, timePeriod)}
                          </div>
                          <div className="text-[9px]" style={{ color: '#606070' }}>Record</div>
                        </div>
                        <div className="text-center">
                          <div className="text-base font-black" style={{ color: getTrendROIForPeriod(trend, timePeriod) >= 0 ? '#00FF88' : '#FF4455' }}>
                            {getTrendROIForPeriod(trend, timePeriod) >= 0 ? '+' : ''}{getTrendROIForPeriod(trend, timePeriod).toFixed(1)}%
                          </div>
                          <div className="text-[9px]" style={{ color: '#606070' }}>ROI</div>
                        </div>
                        <div className="text-center">
                          <div className="text-base font-black" style={{ color: getTrendUnitsForPeriod(trend, timePeriod) >= 0 ? '#FF6B00' : '#FF4455' }}>
                            {getTrendUnitsForPeriod(trend, timePeriod) >= 0 ? '+' : ''}{getTrendUnitsForPeriod(trend, timePeriod).toFixed(1)}
                          </div>
                          <div className="text-[9px]" style={{ color: '#606070' }}>Units</div>
                        </div>
                        <div className="text-center">
                          <div className="text-base font-black" style={{ color: '#00A8FF' }}>{trend.confidence_score}%</div>
                          <div className="text-[9px]" style={{ color: '#606070' }}>Conf</div>
                        </div>
                      </div>
                      
                      {/* Sample Size */}
                      <div className="mt-2 flex items-center justify-between text-[10px]" style={{ color: '#606070' }}>
                        <span>Sample: {trend.all_time_sample_size} games</span>
                        <span>Since Jan 2024</span>
                      </div>
                      
                      {/* Confidence Bar */}
                      <div className="mt-2">
                        <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
                          <div className="h-full rounded-full transition-all" 
                               style={{ 
                                 width: `${trend.confidence_score}%`, 
                                 background: trend.confidence_score > 85 ? '#00FF88' : trend.confidence_score > 75 ? '#FF6B00' : '#00A8FF'
                               }} />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* No results */}
              {filteredTrends.length === 0 && (
                <div className="text-center py-12">
                  <div className="text-4xl mb-4">🔍</div>
                  <h3 className="text-lg font-bold mb-2" style={{ color: '#FFF' }}>No trends found</h3>
                  <p style={{ color: '#606070' }}>Try adjusting your filters</p>
                </div>
              )}
            </div>
            
            {/* Sidebar */}
            <div className="space-y-4">
              {/* Hot Trends */}
              <div className="rounded-xl p-4" style={{ background: '#0c0c14', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="flex items-center gap-2 mb-3">
                  <Flame style={{ color: '#FF6B00', width: '16px', height: '16px' }} />
                  <h3 className="font-bold text-sm" style={{ color: '#FFF' }}>🔥 Hot Right Now</h3>
                </div>
                
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {hotTrends.slice(0, 5).map((t) => (
                    <div key={t.id} className="p-2 rounded-lg hover:bg-white/5 cursor-pointer transition-all" 
                         style={{ background: 'rgba(255,107,0,0.05)' }}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm">{sportIcons[t.sport]}</span>
                        <span className="text-xs font-bold" style={{ color: '#FFF' }}>{t.sport}</span>
                      </div>
                      <div className="text-xs line-clamp-2" style={{ color: '#A0A0B0' }}>{t.trend_name}</div>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs font-mono" style={{ color: '#00FF88' }}>{t.all_time_record}</span>
                        <span className="text-xs font-black" style={{ color: '#FF6B00' }}>+{t.all_time_roi}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Performance by Sport */}
              <div className="rounded-xl p-4" style={{ background: '#0c0c14', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="flex items-center gap-2 mb-3">
                  <BarChart3 style={{ color: '#00A8FF', width: '16px', height: '16px' }} />
                  <h3 className="font-bold text-sm" style={{ color: '#FFF' }}>20-Year Performance</h3>
                </div>
                
                <div className="space-y-2">
                  {performance.filter(p => p.sport !== 'ALL').map((s) => (
                    <Link key={s.sport} href={`/trends?sport=${s.sport.toLowerCase()}`}
                          className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 transition-all"
                          style={{ background: 'rgba(255,255,255,0.02)' }}>
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{sportIcons[s.sport]}</span>
                        <span className="font-semibold text-sm" style={{ color: '#FFF' }}>{s.sport}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px]" style={{ color: '#808090' }}>{s.edge_win_rate}%</span>
                        <span className="text-xs font-bold" style={{ color: '#00FF88' }}>+{s.edge_roi}%</span>
                        <ChevronRight size={12} style={{ color: '#606070' }} />
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
              
              {/* Trust Badge */}
              <div className="rounded-xl p-4" style={{ background: 'linear-gradient(135deg, rgba(0,255,136,0.1), rgba(0,168,255,0.1))', border: '1px solid rgba(0,255,136,0.2)' }}>
                <div className="flex items-center gap-2 mb-2">
                  <History style={{ color: '#00FF88', width: '16px', height: '16px' }} />
                  <h3 className="font-bold text-sm" style={{ color: '#FFF' }}>Verified Track Record</h3>
                </div>
                <p className="text-xs mb-3" style={{ color: '#A0A0B0' }}>
                  All trends backtested with 2+ years of historical data. Transparent results since January 2024.
                </p>
                <div className="grid grid-cols-2 gap-2 text-center">
                  <div className="p-2 rounded-lg" style={{ background: 'rgba(0,0,0,0.3)' }}>
                    <div className="text-lg font-black" style={{ color: '#00FF88' }}>1,240+</div>
                    <div className="text-[10px]" style={{ color: '#808090' }}>Picks Tracked</div>
                  </div>
                  <div className="p-2 rounded-lg" style={{ background: 'rgba(0,0,0,0.3)' }}>
                    <div className="text-lg font-black" style={{ color: '#FF6B00' }}>+228u</div>
                    <div className="text-[10px]" style={{ color: '#808090' }}>Total Profit</div>
                  </div>
                </div>
              </div>
              
              {/* AI Analysis Promo */}
              <div className="rounded-xl p-4" style={{ background: 'linear-gradient(135deg, rgba(255,107,0,0.1), rgba(0,168,255,0.1))', border: '1px solid rgba(255,107,0,0.2)' }}>
                <div className="flex items-center gap-2 mb-2">
                  <Zap style={{ color: '#FF6B00', width: '16px', height: '16px' }} />
                  <h3 className="font-bold text-sm" style={{ color: '#FFF' }}>AI Trend Discovery</h3>
                </div>
                <p className="text-xs mb-3" style={{ color: '#A0A0B0' }}>
                  Our AI analyzes millions of data points to find edges others miss.
                </p>
                <Link href="/analytics" 
                      className="block text-center text-xs font-bold py-2 rounded-lg transition-all hover:scale-105"
                      style={{ background: 'linear-gradient(135deg, #FF6B00, #FF3366)', color: '#000' }}>
                  View Full Analytics →
                </Link>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}

export default function TrendsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#050508' }}>
        <div className="animate-spin w-8 h-8 border-2 rounded-full" style={{ borderColor: '#00FF88', borderTopColor: 'transparent' }} />
      </div>
    }>
      <TrendsContent />
    </Suspense>
  )
}
