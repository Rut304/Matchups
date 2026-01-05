'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  Clock,
  RefreshCw,
  Tv,
  MapPin,
  TrendingUp,
  ChevronRight,
  ChevronLeft,
  Zap,
  Activity,
  Filter,
  Calendar,
  CalendarDays
} from 'lucide-react'

interface TeamInfo {
  id: string
  abbr: string
  name: string
  logo?: string
  score?: number
  record?: string
  color?: string
}

interface GameData {
  id: string
  sport: string
  sportEmoji: string
  status: 'scheduled' | 'live' | 'final' | 'delayed' | 'postponed'
  statusDisplay: string
  startTime: string
  period?: string
  clock?: string
  venue?: string
  broadcast?: string
  home: TeamInfo
  away: TeamInfo
  odds?: {
    spread: number
    total: number
    homeML?: number
    awayML?: number
    provider?: string
  }
}

type SportFilter = 'ALL' | 'NFL' | 'NBA' | 'NHL' | 'MLB'
type StatusFilter = 'all' | 'live' | 'scheduled' | 'final'

const sportFilters: { key: SportFilter; label: string; emoji: string; color: string }[] = [
  { key: 'ALL', label: 'All Sports', emoji: '🎯', color: '#FF6B00' },
  { key: 'NFL', label: 'NFL', emoji: '🏈', color: '#013369' },
  { key: 'NBA', label: 'NBA', emoji: '🏀', color: '#C9082A' },
  { key: 'NHL', label: 'NHL', emoji: '🏒', color: '#000000' },
  { key: 'MLB', label: 'MLB', emoji: '⚾', color: '#002D72' },
]

const statusFilters: { key: StatusFilter; label: string; color: string }[] = [
  { key: 'all', label: 'All Games', color: '#888' },
  { key: 'live', label: 'Live Now', color: '#00FF88' },
  { key: 'scheduled', label: 'Upcoming', color: '#00A8FF' },
  { key: 'final', label: 'Final', color: '#888' },
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
  return date.toISOString().split('T')[0] // YYYY-MM-DD
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

function formatFullDate(date: Date): string {
  return date.toLocaleDateString('en-US', { 
    weekday: 'long', 
    month: 'long', 
    day: 'numeric',
    year: 'numeric'
  })
}

function GameCard({ game }: { game: GameData }) {
  const isLive = game.status === 'live'
  const isFinal = game.status === 'final'
  const homeWinning = (game.home.score ?? 0) > (game.away.score ?? 0)
  const awayWinning = (game.away.score ?? 0) > (game.home.score ?? 0)

  return (
    <div 
      className={`relative rounded-2xl overflow-hidden transition-all duration-300 hover:scale-[1.02] group ${
        isLive 
          ? 'bg-gradient-to-br from-green-500/10 to-green-700/5 border border-green-500/30'
          : 'bg-gradient-to-br from-white/3 to-white/1 border border-white/6'
      }`}
    >
      {/* Live indicator pulse */}
      {isLive && (
        <div className="absolute top-3 left-3 flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
          </span>
          <span className="text-xs font-bold text-green-400">LIVE</span>
        </div>
      )}

      {/* Sport & Time Header */}
      <div className="flex items-center justify-between px-4 pt-3 pb-2">
        <div className="flex items-center gap-2">
          <span className="text-lg">{game.sportEmoji}</span>
          <span className="text-xs font-semibold text-gray-400">{game.sport}</span>
        </div>
        <div 
          className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
            isLive 
              ? 'bg-green-500/20 text-green-400'
              : isFinal 
                ? 'bg-white/10 text-gray-400'
                : 'bg-blue-500/15 text-blue-400'
          }`}
        >
          {game.statusDisplay}
        </div>
      </div>

      {/* Teams & Scores */}
      <div className="px-4 pb-3">
        {/* Away Team */}
        <div className={`flex items-center justify-between py-2.5 ${isFinal && !awayWinning ? 'opacity-50' : ''}`}>
          <div className="flex items-center gap-3">
            {game.away.logo ? (
              <Image 
                src={game.away.logo} 
                alt={game.away.name}
                width={32}
                height={32}
                className="w-8 h-8 object-contain"
              />
            ) : (
              <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs text-white bg-gray-700">
                {game.away.abbr.slice(0, 2)}
              </div>
            )}
            <div>
              <div className="font-bold text-white">{game.away.abbr}</div>
              {game.away.record && (
                <div className="text-[10px] text-gray-500">{game.away.record}</div>
              )}
            </div>
          </div>
          <div className={`text-2xl font-black ${awayWinning && isLive ? 'text-green-400' : 'text-white'}`}>
            {game.away.score !== undefined ? game.away.score : '-'}
          </div>
        </div>

        {/* Divider with @ */}
        <div className="flex items-center gap-2 py-1">
          <div className="flex-1 h-px bg-white/10"></div>
          <span className="text-[10px] text-gray-500 font-medium">@</span>
          <div className="flex-1 h-px bg-white/10"></div>
        </div>

        {/* Home Team */}
        <div className={`flex items-center justify-between py-2.5 ${isFinal && !homeWinning ? 'opacity-50' : ''}`}>
          <div className="flex items-center gap-3">
            {game.home.logo ? (
              <Image 
                src={game.home.logo} 
                alt={game.home.name}
                width={32}
                height={32}
                className="w-8 h-8 object-contain"
              />
            ) : (
              <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs text-white bg-gray-700">
                {game.home.abbr.slice(0, 2)}
              </div>
            )}
            <div>
              <div className="font-bold text-white">{game.home.abbr}</div>
              {game.home.record && (
                <div className="text-[10px] text-gray-500">{game.home.record}</div>
              )}
            </div>
          </div>
          <div className={`text-2xl font-black ${homeWinning && isLive ? 'text-green-400' : 'text-white'}`}>
            {game.home.score !== undefined ? game.home.score : '-'}
          </div>
        </div>
      </div>

      {/* Odds & Info Footer */}
      {(game.odds || game.broadcast || game.venue) && (
        <div className="px-4 py-3 border-t border-white/5 bg-black/20">
          <div className="flex items-center justify-between text-[10px]">
            {game.odds && (
              <div className="flex items-center gap-3">
                <span className="text-gray-400">
                  <span className="text-gray-500">Spread:</span>{' '}
                  <span className="text-white font-semibold">
                    {game.odds.spread > 0 ? `+${game.odds.spread}` : game.odds.spread}
                  </span>
                </span>
                <span className="text-gray-400">
                  <span className="text-gray-500">O/U:</span>{' '}
                  <span className="text-white font-semibold">{game.odds.total}</span>
                </span>
              </div>
            )}
            <div className="flex items-center gap-2 text-gray-500">
              {game.broadcast && (
                <span className="flex items-center gap-1">
                  <Tv className="w-3 h-3" />
                  {game.broadcast}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Hover effect link */}
      <Link 
        href={`/${game.sport.toLowerCase()}/game/${game.id}`}
        className="absolute inset-0 opacity-0 group-hover:opacity-100 flex items-center justify-center bg-black/60 transition-opacity"
      >
        <span className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 text-white text-sm font-semibold">
          View Matchup <ChevronRight className="w-4 h-4" />
        </span>
      </Link>
    </div>
  )
}

// Date Navigation Component
function DateNavigation({ 
  selectedDate, 
  onDateChange,
  isToday 
}: { 
  selectedDate: Date
  onDateChange: (date: Date) => void
  isToday: boolean
}) {
  const [showCalendar, setShowCalendar] = useState(false)
  
  // Quick date buttons
  const quickDates = useMemo(() => {
    return [
      { label: 'Yesterday', date: getEasternDate(-1) },
      { label: 'Today', date: getEasternDate(0) },
      { label: 'Tomorrow', date: getEasternDate(1) },
    ]
  }, [])

  const goToPreviousDay = () => {
    const newDate = new Date(selectedDate)
    newDate.setDate(newDate.getDate() - 1)
    onDateChange(newDate)
  }

  const goToNextDay = () => {
    const newDate = new Date(selectedDate)
    newDate.setDate(newDate.getDate() + 1)
    onDateChange(newDate)
  }

  const handleDateInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const date = new Date(e.target.value + 'T12:00:00')
    if (!isNaN(date.getTime())) {
      onDateChange(date)
      setShowCalendar(false)
    }
  }

  return (
    <div className="flex flex-col gap-4 mb-8">
      {/* Date Display and Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={goToPreviousDay}
            className="p-2 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all"
            aria-label="Previous day"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <div className="relative">
            <button
              onClick={() => setShowCalendar(!showCalendar)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all min-w-[200px] justify-center"
            >
              <CalendarDays className="w-4 h-4 text-orange-500" />
              <span className="font-semibold">{formatDisplayDate(selectedDate)}</span>
              {isToday && (
                <span className="ml-2 px-2 py-0.5 rounded bg-green-500/20 text-green-400 text-xs font-bold">
                  LIVE
                </span>
              )}
            </button>
            
            {/* Date Picker Dropdown */}
            {showCalendar && (
              <div className="absolute top-full mt-2 left-0 z-50 p-4 rounded-2xl bg-gray-900 border border-white/10 shadow-xl min-w-[280px]">
                <div className="mb-3">
                  <label htmlFor="date-picker" className="text-xs text-gray-400 block mb-2">Select Date</label>
                  <input
                    id="date-picker"
                    type="date"
                    title="Select a date"
                    value={formatDateString(selectedDate)}
                    onChange={handleDateInput}
                    className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-orange-500"
                    max={formatDateString(getEasternDate(7))}
                  />
                </div>
                
                <div className="text-xs text-gray-500 mb-2">Quick Select</div>
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: '2 days ago', offset: -2 },
                    { label: 'Yesterday', offset: -1 },
                    { label: 'Today', offset: 0 },
                    { label: 'Tomorrow', offset: 1 },
                  ].map((item) => (
                    <button
                      key={item.offset}
                      onClick={() => {
                        onDateChange(getEasternDate(item.offset))
                        setShowCalendar(false)
                      }}
                      className="px-3 py-1.5 rounded-lg bg-white/5 text-gray-300 text-xs hover:bg-white/10 hover:text-white transition-all"
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
                
                <div className="mt-3 pt-3 border-t border-white/5">
                  <button
                    onClick={() => {
                      onDateChange(getEasternDate())
                      setShowCalendar(false)
                    }}
                    className="w-full px-3 py-2 rounded-lg bg-orange-500/20 text-orange-400 text-sm font-semibold hover:bg-orange-500/30 transition-all"
                  >
                    Jump to Today
                  </button>
                </div>
              </div>
            )}
          </div>
          
          <button
            onClick={goToNextDay}
            className="p-2 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all"
            aria-label="Next day"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Date Buttons */}
        <div className="hidden sm:flex items-center gap-2">
          {quickDates.map((item) => {
            const isSelected = formatDateString(selectedDate) === formatDateString(item.date)
            return (
              <button
                key={item.label}
                onClick={() => onDateChange(item.date)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                  isSelected
                    ? 'bg-orange-500 text-white'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                }`}
              >
                {item.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Full Date Display */}
      <div className="text-center">
        <p className="text-gray-400 text-sm">
          {formatFullDate(selectedDate)}
          <span className="text-gray-600 ml-2">• Eastern Time</span>
        </p>
      </div>
    </div>
  )
}

export default function ScoresPage() {
  const [games, setGames] = useState<GameData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sportFilter, setSportFilter] = useState<SportFilter>('ALL')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [selectedDate, setSelectedDate] = useState<Date>(getEasternDate())
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const isToday = useMemo(() => {
    return formatDateString(selectedDate) === formatDateString(getEasternDate())
  }, [selectedDate])

  const fetchScores = useCallback(async (showRefreshIndicator = false) => {
    if (showRefreshIndicator) setIsRefreshing(true)
    
    try {
      const params = new URLSearchParams()
      if (sportFilter !== 'ALL') params.set('sport', sportFilter)
      if (statusFilter !== 'all') params.set('status', statusFilter)
      params.set('date', formatDateString(selectedDate))
      
      const res = await fetch(`/api/scores?${params}`)
      const data = await res.json()
      
      if (data.success) {
        setGames(data.games)
        setLastUpdated(new Date())
        setError(null)
      } else {
        setError(data.error || 'Failed to fetch scores')
      }
    } catch (err) {
      setError('Failed to connect to scores API')
      console.error(err)
    } finally {
      setLoading(false)
      setIsRefreshing(false)
    }
  }, [sportFilter, statusFilter, selectedDate])

  useEffect(() => {
    fetchScores()
    
    // Auto-refresh every 30 seconds only for today
    if (isToday) {
      const interval = setInterval(() => fetchScores(), 30000)
      return () => clearInterval(interval)
    }
  }, [fetchScores, isToday])

  const handleDateChange = (newDate: Date) => {
    setSelectedDate(newDate)
    setLoading(true)
    // Reset status filter when viewing historical dates
    if (formatDateString(newDate) !== formatDateString(getEasternDate())) {
      setStatusFilter('all')
    }
  }

  const liveCount = games.filter(g => g.status === 'live').length
  const scheduledCount = games.filter(g => g.status === 'scheduled').length
  const finalCount = games.filter(g => g.status === 'final').length

  return (
    <div className="min-h-screen pt-20 pb-12 bg-[#050508]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black text-white flex items-center gap-3">
              <Activity className="w-8 h-8 text-orange-500" />
              Scores & Matchups
            </h1>
            <p className="text-gray-400 mt-1">
              {isToday ? 'Live scores from across all sports' : 'Historical and scheduled games'}
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            {lastUpdated && (
              <span className="text-xs text-gray-500">
                Updated {lastUpdated.toLocaleTimeString()}
              </span>
            )}
            <button
              onClick={() => fetchScores(true)}
              disabled={isRefreshing}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm font-semibold hover:bg-white/10 transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Date Navigation */}
        <DateNavigation 
          selectedDate={selectedDate}
          onDateChange={handleDateChange}
          isToday={isToday}
        />

        {/* Stats Banner */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className={`p-4 rounded-2xl border ${liveCount > 0 ? 'bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20' : 'bg-gradient-to-br from-gray-500/10 to-gray-600/5 border-gray-500/10'}`}>
            <div className={`text-3xl font-black ${liveCount > 0 ? 'text-green-400' : 'text-gray-600'}`}>{liveCount}</div>
            <div className="text-sm text-gray-400">Live Now</div>
          </div>
          <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20">
            <div className="text-3xl font-black text-blue-400">{scheduledCount}</div>
            <div className="text-sm text-gray-400">{isToday ? 'Upcoming' : 'Scheduled'}</div>
          </div>
          <div className="p-4 rounded-2xl bg-gradient-to-br from-gray-500/10 to-gray-600/5 border border-gray-500/20">
            <div className="text-3xl font-black text-gray-400">{finalCount}</div>
            <div className="text-sm text-gray-400">Final</div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          {/* Sport Filter */}
          <div className="flex flex-wrap gap-2">
            {sportFilters.map((filter) => (
              <button
                key={filter.key}
                onClick={() => setSportFilter(filter.key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                  sportFilter === filter.key
                    ? 'bg-white/10 text-white border-2 border-orange-500/50'
                    : 'bg-white/5 text-gray-400 border border-white/5 hover:bg-white/10 hover:text-white'
                }`}
              >
                <span>{filter.emoji}</span>
                <span className="hidden sm:inline">{filter.label}</span>
                <span className="sm:hidden">{filter.key}</span>
              </button>
            ))}
          </div>

          {/* Status Filter */}
          <div className="flex gap-2 sm:ml-auto">
            {statusFilters.map((filter) => {
              // Hide "Live Now" for historical dates
              if (filter.key === 'live' && !isToday) return null
              return (
                <button
                  key={filter.key}
                  onClick={() => setStatusFilter(filter.key)}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                    statusFilter === filter.key
                      ? `bg-white/10 text-white border-b-2 ${
                          filter.key === 'live' ? 'border-green-400' : 
                          filter.key === 'scheduled' ? 'border-blue-400' : 'border-gray-400'
                        }`
                      : 'bg-white/5 text-gray-500 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {filter.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Games Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div 
                key={i}
                className="h-64 rounded-2xl bg-white/5 animate-pulse"
              />
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">😢</div>
            <div className="text-xl font-bold text-white mb-2">Unable to load scores</div>
            <div className="text-gray-500">{error}</div>
            <button
              onClick={() => fetchScores()}
              className="mt-4 px-6 py-3 rounded-xl bg-orange-500 text-white font-semibold hover:bg-orange-600 transition-all"
            >
              Try Again
            </button>
          </div>
        ) : games.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🎮</div>
            <div className="text-xl font-bold text-white mb-2">No games found</div>
            <div className="text-gray-500">
              {isToday && statusFilter === 'live' 
                ? 'No games are currently live. Check back soon!'
                : `No games scheduled for ${formatDisplayDate(selectedDate)}`}
            </div>
            {!isToday && (
              <button
                onClick={() => handleDateChange(getEasternDate())}
                className="mt-4 px-6 py-3 rounded-xl bg-orange-500 text-white font-semibold hover:bg-orange-600 transition-all"
              >
                View Today&apos;s Games
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {games.map((game) => (
              <GameCard key={game.id} game={game} />
            ))}
          </div>
        )}

        {/* Quick Links */}
        <div className="mt-12 p-6 rounded-2xl bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/20">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-white">Want more analytics?</h3>
              <p className="text-sm text-gray-400">Check out AI picks, betting trends, and expert analysis</p>
            </div>
            <div className="flex gap-3">
              <Link 
                href="/trends"
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 text-white text-sm font-semibold hover:bg-white/20 transition-all"
              >
                <TrendingUp className="w-4 h-4" />
                Trends
              </Link>
              <Link 
                href="/leaderboard"
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 text-white text-sm font-semibold hover:opacity-90 transition-all"
              >
                <Zap className="w-4 h-4" />
                Expert Picks
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
