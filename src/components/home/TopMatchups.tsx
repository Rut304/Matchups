'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  Calendar, 
  Clock, 
  TrendingUp, 
  TrendingDown,
  ChevronRight,
  Flame,
  Trophy,
  Users,
  AlertTriangle,
  Target
} from 'lucide-react'

interface Team {
  id: string
  name: string
  abbreviation: string
  logo?: string
  color?: string
  score: number
  record?: string
}

interface Game {
  id: string
  sport: string
  status: string
  scheduledAt: string
  homeTeam: Team
  awayTeam: Team
  venue?: string
  broadcast?: string
  odds?: {
    spread: number
    spreadOdds?: number
    total: number
    overOdds?: number
    underOdds?: number
    homeML: number
    awayML: number
  }
}

// Sport emojis for display
const sportEmojis: Record<string, string> = {
  NFL: '🏈',
  NBA: '🏀',
  NHL: '🏒',
  MLB: '⚾',
  NCAAF: '🏈',
  NCAAB: '🏀',
  WNBA: '🏀',
}

// Check if a game is a playoff game
function isPlayoffGame(game: Game): boolean {
  const venue = (game.venue || '').toLowerCase()
  
  // NFL playoffs: January games after regular season (typically Jan 10+)
  if (game.sport === 'NFL' && game.scheduledAt) {
    const gameDate = new Date(game.scheduledAt)
    const month = gameDate.getMonth()
    const day = gameDate.getDate()
    // NFL playoffs start mid-January
    if (month === 0 && day >= 10) return true
    // Super Bowl in February
    if (month === 1 && day <= 15) return true
  }
  
  // NCAAF CFP games: Check for CFP venues and January dates
  if (game.sport === 'NCAAF' && game.scheduledAt) {
    const gameDate = new Date(game.scheduledAt)
    const month = gameDate.getMonth()
    const day = gameDate.getDate()
    
    // CFP Semifinal (Jan 9-10) and Championship (Jan 20)
    if (month === 0 && day >= 9 && day <= 20) {
      // Check for CFP venues
      const cfpVenues = ['rose bowl', 'sugar bowl', 'orange bowl', 'cotton bowl', 'fiesta bowl', 'peach bowl',
                         'mercedes-benz stadium', 'at&t stadium', 'hard rock stadium', 'state farm stadium']
      if (cfpVenues.some(v => venue.includes(v))) return true
      // High records in January = likely CFP
      const homeWins = parseInt(game.homeTeam.record?.split('-')[0] || '0')
      const awayWins = parseInt(game.awayTeam.record?.split('-')[0] || '0')
      if (homeWins >= 12 && awayWins >= 12) return true
    }
  }
  
  // NHL/NBA playoffs: Check for April-June postseason dates
  if ((game.sport === 'NHL' || game.sport === 'NBA') && game.scheduledAt) {
    const gameDate = new Date(game.scheduledAt)
    const month = gameDate.getMonth()
    // NHL/NBA playoffs typically April-June
    if (month >= 3 && month <= 5) {
      // Could add more specific logic here
      return false // For now, regular season
    }
  }
  
  return false
}

// Priority ranking for different game types
function getGamePriority(game: Game): number {
  let priority = 0
  const venue = (game.venue || '').toLowerCase()
  
  // Live games get highest visibility
  if (game.status === 'in_progress' || game.status === 'live') priority += 200
  
  // Playoff games (using the proper detection)
  if (isPlayoffGame(game)) {
    // CFP Championship
    if (game.sport === 'NCAAF') {
      const gameDate = new Date(game.scheduledAt)
      if (gameDate.getMonth() === 0 && gameDate.getDate() === 20) priority += 150 // CFP Championship
      else priority += 130 // CFP Semifinal
    }
    // NFL playoffs
    if (game.sport === 'NFL') {
      const gameDate = new Date(game.scheduledAt)
      if (gameDate.getMonth() === 1) priority += 160 // Super Bowl
      else if (gameDate.getDate() >= 18) priority += 140 // Conference Championship
      else priority += 120 // Divisional/Wild Card
    }
  }
  
  // Sport priority for non-playoffs: NFL > NCAAF > NBA > NHL
  const sportPriority: Record<string, number> = { 'NFL': 50, 'NCAAF': 45, 'NBA': 40, 'NHL': 35, 'MLB': 30, 'WNBA': 25, 'NCAAB': 25 }
  priority += sportPriority[game.sport] || 0
  
  // Games with odds get priority
  if (game.odds) priority += 20
  
  // Upcoming games over past games
  if (game.status === 'scheduled') priority += 30
  
  return priority
}

function formatGameTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const isToday = date.toDateString() === now.toDateString()
  const tomorrow = new Date(now)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const isTomorrow = date.toDateString() === tomorrow.toDateString()
  
  const timeStr = date.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    timeZoneName: 'short'
  })
  
  if (isToday) return `Today ${timeStr}`
  if (isTomorrow) return `Tomorrow ${timeStr}`
  
  return date.toLocaleDateString('en-US', { 
    weekday: 'short',
    month: 'short', 
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  })
}

function formatSpread(spread: number): string {
  if (spread === 0) return 'PK'
  return spread > 0 ? `+${spread}` : `${spread}`
}

function formatML(ml: number): string {
  if (ml >= 2) {
    // Decimal odds - convert to American
    const american = ml >= 2 ? Math.round((ml - 1) * 100) : Math.round(-100 / (ml - 1))
    return american > 0 ? `+${american}` : `${american}`
  }
  return ml > 0 ? `+${ml}` : `${ml}`
}

export function TopMatchups() {
  const [games, setGames] = useState<Game[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 8000) // 8 second timeout
    
    async function fetchGames() {
      try {
        setLoading(true)
        
        // Fetch from multiple sports (including women's sports)
        const sports = ['NFL', 'NCAAF', 'NBA', 'NHL', 'WNBA']
        const responses = await Promise.all(
          sports.map(sport => 
            fetch(`/api/games?sport=${sport}`, { signal: controller.signal })
              .then(r => r.ok ? r.json() : { games: [] })
              .catch(() => ({ games: [] }))
          )
        )
        
        clearTimeout(timeoutId)
        
        // Combine all games
        let allGames: Game[] = []
        responses.forEach(res => {
          if (res.games && Array.isArray(res.games)) {
            allGames = [...allGames, ...res.games]
          }
        })
        
        // Filter to only scheduled/live games
        const upcomingGames = allGames.filter(g => 
          g.status === 'scheduled' || g.status === 'in_progress' || g.status === 'live'
        )
        
        // Sort by priority and get top 8 (more compact cards now)
        const sortedGames = upcomingGames
          .sort((a, b) => getGamePriority(b) - getGamePriority(a))
          .slice(0, 8)
        
        setGames(sortedGames)
        if (sortedGames.length === 0) {
          setError('No games available')
        }
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          console.log('Games fetch timed out')
          setError('Loading timeout - try refreshing')
        } else {
          console.error('Error fetching games:', err)
          setError('Failed to load matchups')
        }
      } finally {
        setLoading(false)
      }
    }
    
    fetchGames()
    
    return () => {
      clearTimeout(timeoutId)
      controller.abort()
    }
  }, [])

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="animate-pulse p-4 rounded-xl bg-white/5">
            <div className="h-5 bg-white/10 rounded w-1/3 mb-3"></div>
            <div className="h-8 bg-white/10 rounded w-full mb-2"></div>
            <div className="h-4 bg-white/10 rounded w-2/3"></div>
          </div>
        ))}
      </div>
    )
  }

  if (error || games.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p>No upcoming matchups available</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {games.map((game, idx) => {
        const isLive = game.status === 'in_progress' || game.status === 'live'
        const isPlayoff = isPlayoffGame(game)
        
        return (
          <Link
            key={game.id}
            href={`/game/${game.id}?sport=${game.sport.toLowerCase()}`}
            className="block group"
          >
            <div className={`p-3 rounded-lg border transition-all hover:scale-[1.01] ${
              isLive 
                ? 'bg-red-500/10 border-red-500/30 hover:border-red-500/50' 
                : isPlayoff
                  ? 'bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-yellow-500/30 hover:border-yellow-500/50'
                  : 'bg-white/5 border-white/10 hover:border-white/20'
            }`}>
              {/* Header - Compact */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm">{sportEmojis[game.sport] || '🏆'}</span>
                  <span className="text-[10px] font-bold text-gray-400">{game.sport}</span>
                  {isPlayoff && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-yellow-500/20 text-yellow-400">
                      🏆 PLAYOFF
                    </span>
                  )}
                  {isLive && (
                    <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-500/20 text-red-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                      LIVE
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-gray-500 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatGameTime(game.scheduledAt)}
                </span>
              </div>
              
              {/* Teams - Compact Row Layout */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex-1 min-w-0">
                  {/* Away Team */}
                  <div className="flex items-center gap-2 mb-1">
                    {game.awayTeam.logo ? (
                      <img src={game.awayTeam.logo} alt={game.awayTeam.name} className="w-6 h-6 object-contain" />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-bold">
                        {game.awayTeam.abbreviation}
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="font-bold text-white text-sm truncate">{game.awayTeam.name}</div>
                      <div className="text-[10px] text-gray-500">{game.awayTeam.record || ''}</div>
                    </div>
                  </div>
                  
                  {/* Home Team */}
                  <div className="flex items-center gap-2">
                    {game.homeTeam.logo ? (
                      <img src={game.homeTeam.logo} alt={game.homeTeam.name} className="w-6 h-6 object-contain" />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-bold">
                        {game.homeTeam.abbreviation}
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="font-bold text-white text-sm truncate">{game.homeTeam.name}</div>
                      <div className="text-[10px] text-gray-500">{game.homeTeam.record || ''}</div>
                    </div>
                  </div>
                </div>
                
                {/* Odds - Compact */}
                {game.odds && (
                  <div className="text-right shrink-0">
                    <div className="text-sm font-bold text-white">
                      {game.homeTeam.abbreviation} {formatSpread(game.odds.spread)}
                    </div>
                    <div className="text-[10px] text-gray-400">
                      O/U {game.odds.total}
                    </div>
                    <div className="text-[10px] text-green-400">
                      ML: {formatML(game.odds.homeML)} / {formatML(game.odds.awayML)}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Venue - Single Line Compact */}
              {game.venue && (
                <div className="mt-1.5 pt-1.5 border-t border-white/10 flex items-center justify-between text-[10px] text-gray-500">
                  <span className="truncate">{game.venue}</span>
                  {game.broadcast && <span className="shrink-0 ml-2">📺 {game.broadcast}</span>}
                </div>
              )}
            </div>
          </Link>
        )
      })}
      
      {/* View All Link - Compact */}
      <Link 
        href="/scores"
        className="flex items-center justify-center gap-1.5 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-xs font-medium text-gray-400 hover:text-white"
      >
        View All Games
        <ChevronRight className="w-3 h-3" />
      </Link>
    </div>
  )
}
