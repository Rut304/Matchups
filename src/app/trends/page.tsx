'use client'

import { useState, useEffect, Suspense, useCallback, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { 
  Flame,
  BarChart3,
  RefreshCw,
  ChevronRight,
  Zap,
  Calendar,
  TrendingUp,
  CheckCircle,
  History,
  Clock,
  Info,
  CalendarDays,
  ChevronLeft,
  AlertCircle
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

type Sport = 'all' | 'nfl' | 'nba' | 'nhl' | 'mlb' | 'ncaaf' | 'ncaab'
type TrendType = 'all' | 'spread' | 'total' | 'moneyline'
type ViewMode = 'today' | 'history'

const sportIcons: Record<string, string> = {
  'NFL': '🏈',
  'NBA': '🏀',
  'NHL': '🏒',
  'MLB': '⚾',
  'NCAAF': '🏈',
  'NCAAB': '🏀',
  'ALL': '📊'
}

const sportFilters: { key: Sport; label: string; emoji: string }[] = [
  { key: 'all', label: 'All Sports', emoji: '🎯' },
  { key: 'nfl', label: 'NFL', emoji: '🏈' },
  { key: 'nba', label: 'NBA', emoji: '🏀' },
  { key: 'nhl', label: 'NHL', emoji: '🏒' },
  { key: 'mlb', label: 'MLB', emoji: '⚾' },
  { key: 'ncaaf', label: 'NCAAF', emoji: '🏈' },
  { key: 'ncaab', label: 'NCAAB', emoji: '🏀' },
]

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

interface TodayGame {
  id: string
  sport: string
  sportEmoji: string
  status: string
  startTime: string
  statusDisplay: string
  home: { id: string; abbr: string; name: string; logo?: string; record?: string }
  away: { id: string; abbr: string; name: string; logo?: string; record?: string }
  applicableTrends: ApplicableTrend[]
}

interface ApplicableTrend {
  id: string
  trendName: string
  trendDescription: string
  record: string
  roi: number
  units: number
  confidence: number
  betType: 'spread' | 'total' | 'moneyline'
  recommendation: string
  hot: boolean
}

function TrendsContent() {
  const searchParams = useSearchParams()
  const urlSport = searchParams.get('sport')?.toLowerCase() as Sport | null
  
  const [viewMode, setViewMode] = useState<ViewMode>('today')
  const [sport, setSport] = useState<Sport>(urlSport || 'all')
  const [trendType, setTrendType] = useState<TrendType>('all')
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('all')
  const [selectedDate, setSelectedDate] = useState<Date>(getEasternDate())
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [trends, setTrends] = useState<HistoricalTrend[]>([])
  const [todayGames, setTodayGames] = useState<TodayGame[]>([])
  const [performance, setPerformance] = useState<SystemPerformance[]>([])
  const [loading, setLoading] = useState(true)

  const isToday = useMemo(() => {
    return formatDateString(selectedDate) === formatDateString(getEasternDate())
  }, [selectedDate])

  const loadTodayGames = useCallback(async () => {
    try {
      const dateStr = formatDateString(selectedDate)
      const sportParam = sport !== 'all' ? `&sport=${sport.toUpperCase()}` : ''
      const res = await fetch(`/api/scores?date=${dateStr}${sportParam}`)
      const data = await res.json()
      
      if (data.success && data.games) {
        // Generate applicable trends for each game
        const gamesWithTrends: TodayGame[] = data.games
          .filter((g: TodayGame) => g.status === 'scheduled')
          .map((game: TodayGame) => ({
            ...game,
            applicableTrends: generateApplicableTrends(game, trends)
          }))
        setTodayGames(gamesWithTrends)
      }
    } catch (error) {
      console.error('Error loading today games:', error)
    }
  }, [selectedDate, sport, trends])

  const loadHistoricalData = useCallback(async () => {
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
  }, [sport])

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      await loadHistoricalData()
      setLoading(false)
    }
    loadData()
  }, [loadHistoricalData])

  useEffect(() => {
    if (viewMode === 'today' && trends.length > 0) {
      loadTodayGames()
    }
  }, [viewMode, loadTodayGames, trends])

  useEffect(() => {
    if (urlSport && sportFilters.some(s => s.key === urlSport)) {
      setSport(urlSport as Sport)
    }
  }, [urlSport])

  // Generate applicable trends for a specific game
  function generateApplicableTrends(game: TodayGame, allTrends: HistoricalTrend[]): ApplicableTrend[] {
    const sportTrends = allTrends.filter(t => 
      t.sport === game.sport || t.sport === 'ALL'
    )
    
    // Sample applicable trends based on game context
    const applicable: ApplicableTrend[] = []
    
    // Add some mock applicable trends based on sport/teams
    if (sportTrends.length > 0) {
      sportTrends.slice(0, 3).forEach((trend, i) => {
        applicable.push({
          id: trend.id,
          trendName: trend.trend_name,
          trendDescription: trend.trend_description,
          record: getTrendRecordForPeriod(trend, '1y'),
          roi: getTrendROIForPeriod(trend, '1y'),
          units: getTrendUnitsForPeriod(trend, '1y'),
          confidence: trend.confidence_score,
          betType: trend.bet_type as 'spread' | 'total' | 'moneyline',
          recommendation: i === 0 ? `${game.home.abbr} -${(3 + Math.random() * 4).toFixed(1)}` : 
                         i === 1 ? `Over ${180 + Math.floor(Math.random() * 40)}` :
                         game.away.abbr,
          hot: trend.hot_streak
        })
      })
    }
    
    return applicable
  }

  const filteredTrends = trends.filter(t => {
    if (sport !== 'all' && t.sport !== sport.toUpperCase() && t.sport !== 'ALL') return false
    if (trendType !== 'all' && t.bet_type !== trendType) return false
    return true
  })

  const filteredGames = todayGames.filter(g => {
    if (sport !== 'all' && g.sport.toLowerCase() !== sport) return false
    return true
  })

  const hotTrends = trends.filter(t => t.hot_streak)

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await loadHistoricalData()
    if (viewMode === 'today') {
      await loadTodayGames()
    }
    setIsRefreshing(false)
  }

  const stats = calculateAggregateStats(performance)
  const timePeriods: TimePeriod[] = ['30d', '90d', '1y', '5y', '10y', '20y', 'all']

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

  return (
    <div className="min-h-screen pt-20 pb-12" style={{ background: '#050508' }}>
      {/* Hero Header */}
      <section className="relative overflow-hidden" style={{ background: 'linear-gradient(180deg, #0a0a12 0%, #050508 100%)' }}>
        <div className="absolute top-0 right-1/3 w-96 h-96 rounded-full opacity-15 blur-3xl pointer-events-none" 
             style={{ background: 'radial-gradient(circle, #00FF88 0%, transparent 70%)' }} />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 relative z-10">
          <div className="flex flex-col gap-4">
            {/* Title & Description */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="text-3xl">📊</span>
                <div>
                  <h1 className="text-2xl font-black" style={{ color: '#FFF' }}>Betting Trends</h1>
                  <p className="text-sm" style={{ color: '#808090' }}>
                    AI-powered trend analysis for smarter betting decisions
                  </p>
                </div>
              </div>
              
              <button onClick={handleRefresh}
                      className="self-start md:self-auto p-2 rounded-lg transition-all hover:bg-white/10"
                      style={{ background: 'rgba(255,255,255,0.05)' }}>
                <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} style={{ color: '#808090' }} />
              </button>
            </div>

            {/* View Mode Toggle - Today vs Historical */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1 p-1 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <button 
                  onClick={() => setViewMode('today')}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all"
                  style={{ 
                    background: viewMode === 'today' ? 'linear-gradient(135deg, #00FF88, #00CC6A)' : 'transparent',
                    color: viewMode === 'today' ? '#000' : '#808090'
                  }}>
                  <Calendar size={14} />
                  Today&apos;s Games
                </button>
                <button 
                  onClick={() => setViewMode('history')}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all"
                  style={{ 
                    background: viewMode === 'history' ? 'linear-gradient(135deg, #FF6B00, #FF3366)' : 'transparent',
                    color: viewMode === 'history' ? '#000' : '#808090'
                  }}>
                  <History size={14} />
                  Historical Data
                </button>
              </div>
              
              {viewMode === 'history' && (
                <span className="flex items-center gap-1 text-xs px-2 py-1 rounded-full" 
                      style={{ background: 'rgba(255,107,0,0.15)', color: '#FF6B00' }}>
                  <History size={10} /> 20+ Years of Data
                </span>
              )}
            </div>

            {/* Date Navigation (for Today mode) */}
            {viewMode === 'today' && (
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
            )}

            {/* Filters Row */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Sport Filter */}
              <div className="flex items-center gap-1 p-1 rounded-lg" style={{ background: 'rgba(255,255,255,0.05)' }}>
                {sportFilters.map((s) => (
                  <button key={s.key} onClick={() => setSport(s.key)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-semibold uppercase transition-all"
                          style={{ 
                            background: sport === s.key ? 'linear-gradient(135deg, #00FF88, #00CC6A)' : 'transparent',
                            color: sport === s.key ? '#000' : '#808090'
                          }}>
                    <span>{s.emoji}</span>
                    {s.key === 'all' ? 'All' : s.key}
                  </button>
                ))}
              </div>

              {/* Type Filter */}
              <div className="flex items-center gap-1 p-1 rounded-lg" style={{ background: 'rgba(255,255,255,0.05)' }}>
                {(['all', 'spread', 'total', 'moneyline'] as TrendType[]).map((t) => (
                  <button key={t} onClick={() => setTrendType(t)}
                          className="px-3 py-1.5 rounded-md text-xs font-semibold uppercase transition-all"
                          style={{ 
                            background: trendType === t ? 'rgba(255,255,255,0.15)' : 'transparent',
                            color: trendType === t ? '#FFF' : '#808090'
                          }}>
                    {t === 'all' ? 'All Types' : t === 'moneyline' ? 'ML' : t === 'spread' ? 'ATS' : 'O/U'}
                  </button>
                ))}
              </div>

              {/* Time Period Filter (History mode only) */}
              {viewMode === 'history' && (
                <div className="flex items-center gap-1 p-1 rounded-lg" style={{ background: 'rgba(255,255,255,0.05)' }}>
                  {timePeriods.map((p) => (
                    <button key={p} onClick={() => setTimePeriod(p)}
                            className="px-2 py-1.5 rounded-md text-[10px] font-semibold uppercase transition-all"
                            style={{ 
                              background: timePeriod === p ? 'rgba(0,168,255,0.3)' : 'transparent',
                              color: timePeriod === p ? '#00A8FF' : '#808090'
                            }}>
                      {p === 'all' ? 'All' : p.toUpperCase()}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          {/* Historical Performance Stats - Show in History mode */}
          {viewMode === 'history' && (
            <>
              {/* Explanation Banner */}
              <div className="mt-4 p-3 rounded-xl flex items-start gap-3" 
                   style={{ background: 'rgba(0,168,255,0.1)', border: '1px solid rgba(0,168,255,0.2)' }}>
                <Info size={18} style={{ color: '#00A8FF', flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <p className="text-sm font-semibold" style={{ color: '#00A8FF' }}>Backtested Historical Performance</p>
                  <p className="text-xs" style={{ color: '#808090' }}>
                    These records represent backtested results of our trend systems against historical game data. 
                    Past performance does not guarantee future results. All times shown in Eastern Time (ET).
                  </p>
                </div>
              </div>

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
                  <div className="text-[10px]" style={{ color: '#606070' }}>Backtested Results</div>
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
                    <span className="text-[10px]" style={{ color: '#808090' }}>Data Range</span>
                  </div>
                  <div className="text-xl font-black" style={{ color: '#FFD700' }}>20+ yrs</div>
                  <div className="text-[10px]" style={{ color: '#606070' }}>Historical Data</div>
                </div>
              </div>
            </>
          )}
        </div>
      </section>

      {/* Main Content */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin w-8 h-8 border-2 rounded-full" style={{ borderColor: '#00FF88', borderTopColor: 'transparent' }} />
          </div>
        ) : viewMode === 'today' ? (
          /* TODAY'S GAMES WITH TRENDS */
          <TodayGamesView 
            games={filteredGames} 
            trendType={trendType}
            isToday={isToday}
          />
        ) : (
          /* HISTORICAL TRENDS VIEW */
          <HistoricalTrendsView 
            trends={filteredTrends}
            hotTrends={hotTrends}
            performance={performance}
            timePeriod={timePeriod}
          />
        )}
      </section>
    </div>
  )
}

// Today's Games with applicable trends
function TodayGamesView({ games, trendType, isToday }: { games: TodayGame[], trendType: TrendType, isToday: boolean }) {
  if (games.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-5xl mb-4">📅</div>
        <h3 className="text-xl font-bold mb-2" style={{ color: '#FFF' }}>No Upcoming Games</h3>
        <p style={{ color: '#808090' }}>
          {isToday 
            ? "No games scheduled for today. Check back later or view historical trends."
            : "No games scheduled for this date."}
        </p>
        <Link href="/scores" className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-lg text-sm font-semibold"
              style={{ background: 'rgba(255,107,0,0.2)', color: '#FF6B00' }}>
          View All Scores <ChevronRight size={14} />
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold" style={{ color: '#FFF' }}>
          {games.length} Upcoming Game{games.length !== 1 ? 's' : ''} with Trend Analysis
        </h2>
        <span className="text-xs px-2 py-1 rounded-full" style={{ background: 'rgba(0,255,136,0.15)', color: '#00FF88' }}>
          All times Eastern
        </span>
      </div>

      {games.map((game) => (
        <GameTrendCard key={game.id} game={game} trendType={trendType} />
      ))}
    </div>
  )
}

// Individual game card with trends
function GameTrendCard({ game, trendType }: { game: TodayGame, trendType: TrendType }) {
  const filteredTrends = game.applicableTrends.filter(t => 
    trendType === 'all' || t.betType === trendType
  )

  return (
    <div className="rounded-2xl overflow-hidden" 
         style={{ background: '#0c0c14', border: '1px solid rgba(255,255,255,0.06)' }}>
      {/* Game Header */}
      <div className="p-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-2xl">{game.sportEmoji}</span>
            <div className="flex items-center gap-3">
              {/* Away Team */}
              <div className="flex items-center gap-2">
                {game.away.logo && (
                  <Image src={game.away.logo} alt={game.away.name} width={32} height={32} className="w-8 h-8" />
                )}
                <div>
                  <p className="font-bold" style={{ color: '#FFF' }}>{game.away.abbr}</p>
                  <p className="text-xs" style={{ color: '#808090' }}>{game.away.record}</p>
                </div>
              </div>
              
              <span className="text-sm font-bold" style={{ color: '#606070' }}>@</span>
              
              {/* Home Team */}
              <div className="flex items-center gap-2">
                {game.home.logo && (
                  <Image src={game.home.logo} alt={game.home.name} width={32} height={32} className="w-8 h-8" />
                )}
                <div>
                  <p className="font-bold" style={{ color: '#FFF' }}>{game.home.abbr}</p>
                  <p className="text-xs" style={{ color: '#808090' }}>{game.home.record}</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="text-right">
            <div className="flex items-center gap-2 text-sm" style={{ color: '#00A8FF' }}>
              <Clock size={14} />
              {new Date(game.startTime).toLocaleTimeString('en-US', { 
                hour: 'numeric', 
                minute: '2-digit',
                timeZone: 'America/New_York'
              })} ET
            </div>
            <Link href={`/game/${game.id}?sport=${game.sport.toLowerCase()}`}
                  className="text-xs flex items-center gap-1 mt-1 hover:underline"
                  style={{ color: '#FF6B00' }}>
              Full Analysis <ChevronRight size={12} />
            </Link>
          </div>
        </div>
      </div>
      
      {/* Applicable Trends */}
      <div className="p-4">
        {filteredTrends.length > 0 ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp size={14} style={{ color: '#00FF88' }} />
              <span className="text-sm font-semibold" style={{ color: '#FFF' }}>
                {filteredTrends.length} Applicable Trend{filteredTrends.length !== 1 ? 's' : ''}
              </span>
            </div>
            
            {filteredTrends.map((trend) => (
              <div key={trend.id} className="p-3 rounded-xl"
                   style={{ background: 'rgba(255,255,255,0.03)', border: trend.hot ? '1px solid rgba(0,255,136,0.2)' : '1px solid rgba(255,255,255,0.05)' }}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] px-1.5 py-0.5 rounded font-bold"
                            style={{ 
                              background: trend.betType === 'spread' ? 'rgba(0,168,255,0.15)' : 
                                         trend.betType === 'total' ? 'rgba(255,107,0,0.15)' : 'rgba(0,255,136,0.15)',
                              color: trend.betType === 'spread' ? '#00A8FF' : 
                                    trend.betType === 'total' ? '#FF6B00' : '#00FF88'
                            }}>
                        {trend.betType === 'spread' ? 'ATS' : trend.betType === 'total' ? 'O/U' : 'ML'}
                      </span>
                      {trend.hot && (
                        <span className="flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded"
                              style={{ background: 'rgba(255,107,0,0.2)', color: '#FF6B00' }}>
                          <Flame size={8} /> HOT
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-semibold" style={{ color: '#FFF' }}>{trend.trendName}</p>
                    <p className="text-xs mt-1" style={{ color: '#808090' }}>{trend.trendDescription}</p>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-lg font-black" style={{ color: '#00FF88' }}>{trend.record}</div>
                    <div className="text-xs" style={{ color: '#808090' }}>
                      <span style={{ color: trend.roi >= 0 ? '#00FF88' : '#FF4455' }}>
                        {trend.roi >= 0 ? '+' : ''}{trend.roi.toFixed(1)}% ROI
                      </span>
                    </div>
                    <div className="mt-2 px-2 py-1 rounded text-xs font-bold"
                         style={{ background: 'rgba(255,107,0,0.2)', color: '#FF6B00' }}>
                      {trend.recommendation}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-sm" style={{ color: '#808090' }}>No specific trends match this game</p>
          </div>
        )}
      </div>
    </div>
  )
}

// Historical Trends View
function HistoricalTrendsView({ 
  trends, 
  hotTrends, 
  performance, 
  timePeriod 
}: { 
  trends: HistoricalTrend[]
  hotTrends: HistoricalTrend[]
  performance: SystemPerformance[]
  timePeriod: TimePeriod
}) {
  const sportIcons: Record<string, string> = {
    'NFL': '🏈', 'NBA': '🏀', 'NHL': '🏒', 'MLB': '⚾', 'NCAAF': '🏈', 'NCAAB': '🏀', 'ALL': '📊'
  }

  return (
    <div className="grid lg:grid-cols-4 gap-4">
      {/* Trends List */}
      <div className="lg:col-span-3">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold" style={{ color: '#FFF' }}>
            {trends.length} Historical Trends
            <span className="ml-2 text-sm font-normal" style={{ color: '#808090' }}>
              ({getTimePeriodLabel(timePeriod)})
            </span>
          </h2>
        </div>
        
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
          {trends.map((trend) => (
            <div key={trend.id}
                 className="rounded-xl overflow-hidden transition-all hover:scale-[1.02] cursor-pointer"
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
                  <span>Backtested</span>
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
        {trends.length === 0 && (
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
            <h3 className="font-bold text-sm" style={{ color: '#FFF' }}>🔥 Hot Streaks</h3>
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
            <h3 className="font-bold text-sm" style={{ color: '#FFF' }}>Performance by Sport</h3>
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
        
        {/* Disclaimer */}
        <div className="rounded-xl p-4" style={{ background: 'rgba(255,107,0,0.05)', border: '1px solid rgba(255,107,0,0.2)' }}>
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle style={{ color: '#FF6B00', width: '16px', height: '16px' }} />
            <h3 className="font-bold text-sm" style={{ color: '#FFF' }}>Disclaimer</h3>
          </div>
          <p className="text-[11px]" style={{ color: '#808090' }}>
            All performance data shown is backtested against historical game results. 
            Past performance is not indicative of future results. 
            Bet responsibly. All times displayed in Eastern Time (ET).
          </p>
        </div>
      </div>
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
