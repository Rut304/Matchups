'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  Calendar, Clock, ChevronRight, TrendingUp, Target, 
  Star, Flame, Activity, RefreshCw, Loader2
} from 'lucide-react'

// =============================================================================
// TYPES
// =============================================================================

interface LiveGame {
  id: string
  sport: string
  status: 'scheduled' | 'in_progress' | 'final' | 'postponed' | 'delayed'
  startTime: string
  venue: string
  broadcast?: string
  homeTeam: {
    id: string
    name: string
    abbreviation: string
    logo?: string
    score?: number
    record?: string
    seed?: number
  }
  awayTeam: {
    id: string
    name: string
    abbreviation: string
    logo?: string
    score?: number
    record?: string
    seed?: number
  }
  period?: string
  clock?: string
  odds?: {
    spread: { home: number; away: number }
    total: { line: number }
    moneyline: { home: number; away: number }
  }
}

// Team emojis for visual appeal
const teamEmojis: Record<string, string> = {
  'PHI': '🦅', 'DAL': '⭐', 'WAS': '🔴', 'NYG': '🗽',
  'DET': '🦁', 'MIN': '⚔️', 'GB': '🧀', 'CHI': '🐻',
  'SF': '🔴', 'SEA': '🦅', 'LAR': '🐏', 'ARI': '🐦',
  'TB': '🏴‍☠️', 'NO': '⚜️', 'ATL': '🦅', 'CAR': '🐆',
  'KC': '🏈', 'LV': '☠️', 'LAC': '⚡', 'DEN': '🐴',
  'BUF': '🦬', 'MIA': '🐬', 'NE': '🏈', 'NYJ': '✈️',
  'BAL': '🐦', 'CIN': '🐅', 'PIT': '⚫', 'CLE': '🟤',
  'HOU': '🐂', 'IND': '🐴', 'JAX': '🐆', 'TEN': '🔵',
}

// =============================================================================
// COMPONENT
// =============================================================================

export default function NFLMatchupsPage() {
  const [games, setGames] = useState<LiveGame[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [selectedDate, setSelectedDate] = useState<string>('today')
  
  // Fetch games
  const fetchGames = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Build date param
      let dateParam = ''
      if (selectedDate === 'today') {
        dateParam = new Date().toISOString().split('T')[0]
      } else if (selectedDate === 'tomorrow') {
        const tomorrow = new Date()
        tomorrow.setDate(tomorrow.getDate() + 1)
        dateParam = tomorrow.toISOString().split('T')[0]
      }
      
      const res = await fetch(`/api/games?sport=nfl${dateParam ? `&date=${dateParam}` : ''}`)
      if (!res.ok) throw new Error('Failed to fetch games')
      
      const data = await res.json()
      setGames(data.games || data || [])
      setLastUpdated(new Date())
    } catch (err) {
      console.error('Error fetching games:', err)
      setError('Failed to load games. Please try again.')
    } finally {
      setLoading(false)
    }
  }
  
  useEffect(() => {
    fetchGames()
    
    // Auto-refresh every 30 seconds for live updates
    const interval = setInterval(fetchGames, 30000)
    return () => clearInterval(interval)
  }, [selectedDate])
  
  // Format game time
  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      timeZone: 'America/New_York'
    }) + ' ET'
  }
  
  // Get status badge
  const getStatusBadge = (game: LiveGame) => {
    if (game.status === 'in_progress') {
      return (
        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-green-500/20 text-green-400 text-xs font-bold rounded">
          <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
          LIVE {game.period && `• ${game.period}`} {game.clock}
        </div>
      )
    }
    if (game.status === 'final') {
      return (
        <div className="px-2 py-0.5 bg-zinc-700 text-zinc-400 text-xs font-bold rounded">
          FINAL
        </div>
      )
    }
    return (
      <div className="flex items-center gap-1">
        <Clock className="w-3 h-3 text-gray-500" />
        <span className="text-sm text-gray-400">{formatTime(game.startTime)}</span>
      </div>
    )
  }
  
  // Render spread display
  const formatSpread = (spread: number, abbr: string) => {
    if (!spread) return 'PK'
    const value = spread > 0 ? `+${spread}` : spread.toString()
    return `${abbr} ${value}`
  }

  return (
    <div className="min-h-screen bg-[#050508]">
      {/* Header */}
      <div className="border-b border-white/5 bg-[#0a0a12]">
        <div className="max-w-[1400px] mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <span className="text-4xl">🏈</span>
              <div>
                <h1 className="text-3xl font-black text-white">NFL Matchups</h1>
                <p className="text-sm text-gray-500">Live odds, trends & analysis for every game</p>
              </div>
            </div>
            
            {/* Refresh Button */}
            <button
              onClick={fetchGames}
              disabled={loading}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 text-gray-400 hover:bg-white/10 transition-all"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              {lastUpdated && (
                <span className="text-xs">Updated {lastUpdated.toLocaleTimeString()}</span>
              )}
            </button>
          </div>

          {/* Date Toggle */}
          <div className="flex gap-2 mt-4">
            {['today', 'tomorrow', 'week'].map(d => (
              <button
                key={d}
                onClick={() => setSelectedDate(d)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                  selectedDate === d 
                    ? 'bg-orange-500 text-white' 
                    : 'bg-white/5 text-gray-400 hover:bg-white/10'
                }`}
              >
                <Calendar className="w-4 h-4" />
                {d === 'today' ? 'Today' : d === 'tomorrow' ? 'Tomorrow' : 'Full Week'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Games List */}
      <div className="max-w-[1400px] mx-auto px-4 py-6">
        {loading && games.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <p className="text-red-400 mb-4">{error}</p>
            <button
              onClick={fetchGames}
              className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
            >
              Retry
            </button>
          </div>
        ) : games.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <p className="text-xl mb-2">No NFL games scheduled</p>
            <p className="text-sm">Check back later for upcoming matchups</p>
          </div>
        ) : (
          <div className="space-y-4">
            {games.map((game) => (
              <Link 
                key={game.id}
                href={`/nfl/matchups/${game.id}`}
                className="block rounded-xl bg-[#0c0c14] border border-white/10 hover:border-orange-500/30 transition-all overflow-hidden group"
              >
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    {/* Away Team */}
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-14 h-14 rounded-xl bg-white/5 flex items-center justify-center overflow-hidden">
                        {game.awayTeam.logo ? (
                          <img src={game.awayTeam.logo} alt={game.awayTeam.name} className="w-10 h-10 object-contain" />
                        ) : (
                          <span className="text-3xl">{teamEmojis[game.awayTeam.abbreviation] || '🏈'}</span>
                        )}
                      </div>
                      <div>
                        <div className="font-bold text-white text-lg">{game.awayTeam.name}</div>
                        <div className="text-sm text-gray-500">
                          {game.awayTeam.record || 'N/A'}
                          {game.awayTeam.seed && <span className="ml-1 text-orange-500">#{game.awayTeam.seed}</span>}
                        </div>
                        {game.status !== 'scheduled' && (
                          <div className="text-2xl font-bold text-white">{game.awayTeam.score ?? '-'}</div>
                        )}
                      </div>
                    </div>

                    {/* Game Info */}
                    <div className="text-center px-6">
                      <div className="flex items-center justify-center gap-2 mb-3">
                        {getStatusBadge(game)}
                        {game.broadcast && (
                          <span className="text-xs px-2 py-0.5 rounded bg-white/10 text-gray-400">{game.broadcast}</span>
                        )}
                      </div>
                      
                      {game.odds && game.status === 'scheduled' && (
                        <div className="flex items-center gap-3">
                          <div className="text-center">
                            <div className="text-xs text-gray-500">SPREAD</div>
                            <div className="font-bold text-orange-500">
                              {formatSpread(game.odds.spread.home, game.homeTeam.abbreviation)}
                            </div>
                          </div>
                          <div className="w-px h-8 bg-white/10" />
                          <div className="text-center">
                            <div className="text-xs text-gray-500">TOTAL</div>
                            <div className="font-bold text-blue-500">{game.odds.total.line || 'N/A'}</div>
                          </div>
                          <div className="w-px h-8 bg-white/10" />
                          <div className="text-center">
                            <div className="text-xs text-gray-500">ML</div>
                            <div className="font-bold text-green-400">
                              {game.odds.moneyline.home > 0 ? '+' : ''}{game.odds.moneyline.home || 'N/A'}
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {game.status !== 'scheduled' && (
                        <div className="text-2xl font-bold text-gray-400">VS</div>
                      )}
                    </div>

                    {/* Home Team */}
                    <div className="flex items-center gap-4 flex-1 justify-end">
                      <div className="text-right">
                        <div className="font-bold text-white text-lg">{game.homeTeam.name}</div>
                        <div className="text-sm text-gray-500">
                          {game.homeTeam.record || 'N/A'}
                          {game.homeTeam.seed && <span className="ml-1 text-orange-500">#{game.homeTeam.seed}</span>}
                        </div>
                        {game.status !== 'scheduled' && (
                          <div className="text-2xl font-bold text-white">{game.homeTeam.score ?? '-'}</div>
                        )}
                      </div>
                      <div className="w-14 h-14 rounded-xl bg-white/5 flex items-center justify-center overflow-hidden">
                        {game.homeTeam.logo ? (
                          <img src={game.homeTeam.logo} alt={game.homeTeam.name} className="w-10 h-10 object-contain" />
                        ) : (
                          <span className="text-3xl">{teamEmojis[game.homeTeam.abbreviation] || '🏈'}</span>
                        )}
                      </div>
                    </div>

                    {/* Arrow */}
                    <ChevronRight className="w-6 h-6 text-gray-600 group-hover:text-orange-500 ml-4 transition-colors" />
                  </div>

                  {/* Venue */}
                  {game.venue && (
                    <div className="mt-3 pt-3 border-t border-white/5 text-xs text-gray-500">
                      📍 {game.venue}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Quick Links */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
          <Link href="/injuries?sport=nfl" className="p-4 rounded-xl bg-[#0c0c14] border border-white/10 hover:border-white/20 transition-all">
            <Activity className="w-6 h-6 text-green-500 mb-2" />
            <div className="font-semibold text-white">Injuries</div>
            <div className="text-xs text-gray-500">Impact analysis</div>
          </Link>
          <Link href="/trends?sport=nfl" className="p-4 rounded-xl bg-[#0c0c14] border border-white/10 hover:border-white/20 transition-all">
            <TrendingUp className="w-6 h-6 text-orange-500 mb-2" />
            <div className="font-semibold text-white">Betting Trends</div>
            <div className="text-xs text-gray-500">ATS & O/U trends</div>
          </Link>
          <Link href="/nfl" className="p-4 rounded-xl bg-[#0c0c14] border border-white/10 hover:border-white/20 transition-all">
            <Star className="w-6 h-6 text-yellow-500 mb-2" />
            <div className="font-semibold text-white">Team Analytics</div>
            <div className="text-xs text-gray-500">Deep team analysis</div>
          </Link>
          <Link href="/live" className="p-4 rounded-xl bg-[#0c0c14] border border-white/10 hover:border-white/20 transition-all">
            <Flame className="w-6 h-6 text-red-500 mb-2" />
            <div className="font-semibold text-white">Live Edge</div>
            <div className="text-xs text-gray-500">Real-time alerts</div>
          </Link>
        </div>
      </div>
    </div>
  )
}
