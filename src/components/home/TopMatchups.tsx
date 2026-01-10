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

// Priority ranking for different game types
function getGamePriority(game: Game): number {
  let priority = 0
  const name = `${game.homeTeam.name} ${game.awayTeam.name}`.toLowerCase()
  const venue = (game.venue || '').toLowerCase()
  
  // Playoff/Championship games get highest priority
  if (name.includes('championship') || name.includes('final') || 
      venue.includes('super bowl') || venue.includes('world series')) {
    priority += 100
  }
  
  // CFP games
  if (game.sport === 'NCAAF' && (venue.includes('rose bowl') || venue.includes('sugar bowl') ||
      venue.includes('fiesta bowl') || venue.includes('peach bowl') || 
      venue.includes('mercedes-benz stadium') || venue.includes('at&t stadium'))) {
    priority += 90
  }
  
  // Playoff games in any sport
  if (game.status === 'scheduled' && game.venue?.toLowerCase().includes('stadium')) {
    // Check for playoff-like records (good teams)
    const homeWins = parseInt(game.homeTeam.record?.split('-')[0] || '0')
    const awayWins = parseInt(game.awayTeam.record?.split('-')[0] || '0')
    if (homeWins >= 10 && awayWins >= 10) priority += 50
  }
  
  // NFL playoff dates (Jan 10-13 for divisional, Jan 18-19 for conference)
  if (game.sport === 'NFL' && game.scheduledAt) {
    const gameDate = new Date(game.scheduledAt)
    const month = gameDate.getMonth()
    const day = gameDate.getDate()
    if (month === 0 && day >= 10) priority += 80 // January playoffs
  }
  
  // NCAAF CFP semifinal (Jan 9-10) and championship (Jan 20)
  if (game.sport === 'NCAAF' && game.scheduledAt) {
    const gameDate = new Date(game.scheduledAt)
    const month = gameDate.getMonth()
    const day = gameDate.getDate()
    if (month === 0 && (day === 9 || day === 10)) priority += 95 // CFP Semifinal
    if (month === 0 && day === 20) priority += 100 // CFP Championship
  }
  
  // Games with odds get priority
  if (game.odds) priority += 20
  
  // Upcoming games over past games
  if (game.status === 'scheduled') priority += 30
  
  // Live games get highest visibility
  if (game.status === 'in_progress' || game.status === 'live') priority += 150
  
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
    async function fetchGames() {
      try {
        setLoading(true)
        
        // Fetch from multiple sports
        const sports = ['NFL', 'NCAAF', 'NBA', 'NHL']
        const responses = await Promise.all(
          sports.map(sport => 
            fetch(`/api/games?sport=${sport}`)
              .then(r => r.json())
              .catch(() => ({ games: [] }))
          )
        )
        
        // Combine all games
        let allGames: Game[] = []
        responses.forEach(res => {
          if (res.games) {
            allGames = [...allGames, ...res.games]
          }
        })
        
        // Filter to only scheduled/live games
        const upcomingGames = allGames.filter(g => 
          g.status === 'scheduled' || g.status === 'in_progress' || g.status === 'live'
        )
        
        // Sort by priority and get top 5
        const sortedGames = upcomingGames
          .sort((a, b) => getGamePriority(b) - getGamePriority(a))
          .slice(0, 5)
        
        setGames(sortedGames)
      } catch (err) {
        console.error('Error fetching games:', err)
        setError('Failed to load matchups')
      } finally {
        setLoading(false)
      }
    }
    
    fetchGames()
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
    <div className="space-y-3">
      {games.map((game, idx) => {
        const isLive = game.status === 'in_progress' || game.status === 'live'
        const isPlayoff = getGamePriority(game) >= 80
        
        return (
          <Link
            key={game.id}
            href={`/game/${game.id}`}
            className="block group"
          >
            <div className={`p-4 rounded-xl border transition-all hover:scale-[1.02] ${
              isLive 
                ? 'bg-red-500/10 border-red-500/30 hover:border-red-500/50' 
                : isPlayoff
                  ? 'bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-yellow-500/30 hover:border-yellow-500/50'
                  : 'bg-white/5 border-white/10 hover:border-white/20'
            }`}>
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{sportEmojis[game.sport] || '🏆'}</span>
                  <span className="text-xs font-bold text-gray-400">{game.sport}</span>
                  {isPlayoff && (
                    <span className="px-2 py-0.5 rounded text-xs font-bold bg-yellow-500/20 text-yellow-400">
                      🏆 PLAYOFF
                    </span>
                  )}
                  {isLive && (
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-red-500/20 text-red-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                      LIVE
                    </span>
                  )}
                </div>
                <span className="text-xs text-gray-500 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatGameTime(game.scheduledAt)}
                </span>
              </div>
              
              {/* Teams */}
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  {/* Away Team */}
                  <div className="flex items-center gap-3 mb-2">
                    {game.awayTeam.logo ? (
                      <img src={game.awayTeam.logo} alt={game.awayTeam.name} className="w-8 h-8 object-contain" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold">
                        {game.awayTeam.abbreviation}
                      </div>
                    )}
                    <div>
                      <div className="font-bold text-white">{game.awayTeam.name}</div>
                      <div className="text-xs text-gray-500">{game.awayTeam.record || ''}</div>
                    </div>
                  </div>
                  
                  {/* Home Team */}
                  <div className="flex items-center gap-3">
                    {game.homeTeam.logo ? (
                      <img src={game.homeTeam.logo} alt={game.homeTeam.name} className="w-8 h-8 object-contain" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold">
                        {game.homeTeam.abbreviation}
                      </div>
                    )}
                    <div>
                      <div className="font-bold text-white">{game.homeTeam.name}</div>
                      <div className="text-xs text-gray-500">{game.homeTeam.record || ''}</div>
                    </div>
                  </div>
                </div>
                
                {/* Odds */}
                {game.odds && (
                  <div className="text-right">
                    <div className="text-sm font-bold text-white">
                      {game.homeTeam.abbreviation} {formatSpread(game.odds.spread)}
                    </div>
                    <div className="text-xs text-gray-400">
                      O/U {game.odds.total}
                    </div>
                    <div className="text-xs text-green-400 mt-1">
                      ML: {formatML(game.odds.homeML)} / {formatML(game.odds.awayML)}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Venue */}
              {game.venue && (
                <div className="mt-2 pt-2 border-t border-white/10 flex items-center justify-between text-xs text-gray-500">
                  <span>{game.venue}</span>
                  {game.broadcast && <span>📺 {game.broadcast}</span>}
                </div>
              )}
            </div>
          </Link>
        )
      })}
      
      {/* View All Link */}
      <Link 
        href="/scores"
        className="flex items-center justify-center gap-2 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-sm font-medium text-gray-400 hover:text-white"
      >
        View All Games
        <ChevronRight className="w-4 h-4" />
      </Link>
    </div>
  )
}
