'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  Clock,
  RefreshCw,
  Tv,
  MapPin,
  TrendingUp,
  ChevronRight,
  Zap,
  Activity,
  Filter,
  Calendar
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

function GameCard({ game }: { game: GameData }) {
  const isLive = game.status === 'live'
  const isFinal = game.status === 'final'
  const homeWinning = (game.home.score ?? 0) > (game.away.score ?? 0)
  const awayWinning = (game.away.score ?? 0) > (game.home.score ?? 0)

  return (
    <div 
      className="relative rounded-2xl overflow-hidden transition-all duration-300 hover:scale-[1.02] group"
      style={{
        background: isLive 
          ? 'linear-gradient(135deg, rgba(0,255,136,0.1) 0%, rgba(0,100,50,0.05) 100%)'
          : 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)',
        border: isLive ? '1px solid rgba(0,255,136,0.3)' : '1px solid rgba(255,255,255,0.06)'
      }}
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
          className="px-2.5 py-1 rounded-lg text-xs font-bold"
          style={{
            background: isLive ? 'rgba(0,255,136,0.2)' : isFinal ? 'rgba(255,255,255,0.1)' : 'rgba(0,168,255,0.15)',
            color: isLive ? '#00FF88' : isFinal ? '#888' : '#00A8FF'
          }}
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
              <div 
                className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs text-white"
                style={{ background: game.away.color || '#333' }}
              >
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
              <div 
                className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs text-white"
                style={{ background: game.home.color || '#333' }}
              >
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

export default function ScoresPage() {
  const [games, setGames] = useState<GameData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sportFilter, setSportFilter] = useState<SportFilter>('ALL')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const fetchScores = useCallback(async (showRefreshIndicator = false) => {
    if (showRefreshIndicator) setIsRefreshing(true)
    
    try {
      const params = new URLSearchParams()
      if (sportFilter !== 'ALL') params.set('sport', sportFilter)
      if (statusFilter !== 'all') params.set('status', statusFilter)
      
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
  }, [sportFilter, statusFilter])

  useEffect(() => {
    fetchScores()
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => fetchScores(), 30000)
    return () => clearInterval(interval)
  }, [fetchScores])

  const liveCount = games.filter(g => g.status === 'live').length
  const scheduledCount = games.filter(g => g.status === 'scheduled').length
  const finalCount = games.filter(g => g.status === 'final').length

  return (
    <div className="min-h-screen pt-20 pb-12" style={{ background: '#050508' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black text-white flex items-center gap-3">
              <Activity className="w-8 h-8 text-orange-500" />
              Scores & Matchups
            </h1>
            <p className="text-gray-400 mt-1">Live scores from across all sports</p>
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

        {/* Stats Banner */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/20">
            <div className="text-3xl font-black text-green-400">{liveCount}</div>
            <div className="text-sm text-gray-400">Live Now</div>
          </div>
          <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20">
            <div className="text-3xl font-black text-blue-400">{scheduledCount}</div>
            <div className="text-sm text-gray-400">Upcoming</div>
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
            {statusFilters.map((filter) => (
              <button
                key={filter.key}
                onClick={() => setStatusFilter(filter.key)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                  statusFilter === filter.key
                    ? 'bg-white/10 text-white'
                    : 'bg-white/5 text-gray-500 hover:bg-white/10 hover:text-white'
                }`}
                style={statusFilter === filter.key ? { borderBottom: `2px solid ${filter.color}` } : {}}
              >
                {filter.label}
              </button>
            ))}
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
              {statusFilter === 'live' 
                ? 'No games are currently live. Check back soon!'
                : 'No games match your current filters.'}
            </div>
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
