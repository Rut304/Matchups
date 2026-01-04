// =============================================================================
// LIVE GAMES COMPONENT
// Server Component that fetches real data from APIs
// =============================================================================

import Link from 'next/link'
import { Clock, Flame, Zap, Activity, ChevronRight } from 'lucide-react'
import { getGames, type LiveGame, type SupportedSport } from '@/lib/api/live-sports'

interface LiveGamesGridProps {
  sport?: SupportedSport
  limit?: number
  showHeader?: boolean
  compact?: boolean
}

async function fetchGames(sport?: SupportedSport): Promise<LiveGame[]> {
  try {
    if (sport) {
      return await getGames(sport)
    }
    // Fetch all sports
    const [nfl, nba, nhl, mlb] = await Promise.all([
      getGames('nfl'),
      getGames('nba'),
      getGames('nhl'),
      getGames('mlb'),
    ])
    return [...nfl, ...nba, ...nhl, ...mlb]
  } catch (error) {
    console.error('Error fetching games:', error)
    return []
  }
}

export async function LiveGamesGrid({ sport, limit = 12, showHeader = true, compact = false }: LiveGamesGridProps) {
  const games = await fetchGames(sport)
  const displayGames = games.slice(0, limit)
  
  if (displayGames.length === 0) {
    return (
      <div className="rounded-xl p-8 text-center" style={{ background: '#0c0c14', border: '1px solid rgba(255,255,255,0.06)' }}>
        <Activity className="w-12 h-12 mx-auto mb-4 opacity-30" style={{ color: '#808090' }} />
        <p className="text-lg font-semibold" style={{ color: '#A0A0B0' }}>No games scheduled</p>
        <p className="text-sm" style={{ color: '#606070' }}>Check back later for upcoming matchups</p>
      </div>
    )
  }
  
  const liveCount = displayGames.filter(g => g.status === 'in_progress').length
  
  return (
    <section>
      {showHeader && (
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Clock style={{ color: '#FF6B00', width: '20px', height: '20px' }} />
            <h2 className="text-xl font-bold" style={{ color: '#FFF' }}>
              {sport ? `${sport.toUpperCase()} Games` : "Today's Games"}
            </h2>
            <span className="text-sm" style={{ color: '#606070' }}>
              ({displayGames.length} matchups{liveCount > 0 ? `, ${liveCount} live` : ''})
            </span>
            {liveCount > 0 && (
              <span className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold animate-pulse"
                    style={{ background: 'rgba(255,68,85,0.2)', color: '#FF4455' }}>
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                LIVE
              </span>
            )}
          </div>
          <Link href={sport ? `/${sport.toLowerCase()}` : "/nfl"} 
                className="flex items-center gap-1 text-sm font-semibold"
                style={{ color: '#FF6B00' }}>
            All Games <ChevronRight style={{ width: '16px', height: '16px' }} />
          </Link>
        </div>
      )}

      <div className={`grid ${compact ? 'md:grid-cols-2 lg:grid-cols-4' : 'md:grid-cols-2 lg:grid-cols-3'} gap-3`}>
        {displayGames.map((game) => (
          <GameCard key={game.id} game={game} compact={compact} />
        ))}
      </div>
    </section>
  )
}

function GameCard({ game, compact }: { game: LiveGame; compact?: boolean }) {
  const isLive = game.status === 'in_progress'
  const isFinal = game.status === 'final'
  
  const sportEmoji: Record<string, string> = {
    NFL: '🏈', NBA: '🏀', NHL: '🏒', MLB: '⚾',
    NCAAF: '🏈', NCAAB: '🏀', WNBA: '🏀', MLS: '⚽'
  }
  
  const formatTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr)
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    } catch {
      return ''
    }
  }
  
  return (
    <Link href={`/game/${game.id}`}
          className="block rounded-xl p-4 transition-all hover:scale-[1.02]"
          style={{ 
            background: '#0c0c14',
            border: isLive ? '1px solid rgba(255,68,85,0.5)' : '1px solid rgba(255,255,255,0.06)',
            boxShadow: isLive ? '0 0 20px rgba(255,68,85,0.2)' : 'none'
          }}>
      
      {/* Header Row */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span>{sportEmoji[game.sport] || '🏆'}</span>
          <span className="text-xs font-semibold" style={{ color: '#808090' }}>
            {isLive ? (
              <span className="flex items-center gap-1" style={{ color: '#FF4455' }}>
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                {game.period ? `${game.period}Q` : 'LIVE'} {game.clock}
              </span>
            ) : isFinal ? (
              <span style={{ color: '#606070' }}>FINAL</span>
            ) : (
              formatTime(game.startTime)
            )}
          </span>
        </div>
        
        {game.odds && (
          <div className="flex items-center gap-1 px-2 py-1 rounded"
               style={{ background: 'rgba(255,107,0,0.1)' }}>
            <Zap style={{ color: '#FF6B00', width: '12px', height: '12px' }} />
            <span className="text-xs font-bold" style={{ color: '#FF6B00' }}>
              {game.odds.spread.home > 0 ? `+${game.odds.spread.home}` : game.odds.spread.home}
            </span>
          </div>
        )}
      </div>
      
      {/* Teams */}
      <div className="space-y-2">
        {/* Away Team */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {game.awayTeam.logo && (
              <img src={game.awayTeam.logo} alt="" className="w-6 h-6 object-contain" />
            )}
            <span className={`font-bold ${compact ? 'text-sm' : ''}`} style={{ color: '#FFF' }}>
              {game.awayTeam.abbreviation}
            </span>
            {game.awayTeam.record && (
              <span className="text-xs" style={{ color: '#606070' }}>{game.awayTeam.record}</span>
            )}
          </div>
          {(isLive || isFinal) && game.awayTeam.score !== undefined && (
            <span className="font-bold text-lg" style={{ 
              color: (game.awayTeam.score || 0) > (game.homeTeam.score || 0) ? '#00FF88' : '#A0A0B0' 
            }}>
              {game.awayTeam.score}
            </span>
          )}
        </div>
        
        {/* Home Team */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {game.homeTeam.logo && (
              <img src={game.homeTeam.logo} alt="" className="w-6 h-6 object-contain" />
            )}
            <span className={`font-bold ${compact ? 'text-sm' : ''}`} style={{ color: '#FFF' }}>
              {game.homeTeam.abbreviation}
            </span>
            {game.homeTeam.record && (
              <span className="text-xs" style={{ color: '#606070' }}>{game.homeTeam.record}</span>
            )}
          </div>
          {(isLive || isFinal) && game.homeTeam.score !== undefined && (
            <span className="font-bold text-lg" style={{ 
              color: (game.homeTeam.score || 0) > (game.awayTeam.score || 0) ? '#00FF88' : '#A0A0B0' 
            }}>
              {game.homeTeam.score}
            </span>
          )}
        </div>
      </div>
      
      {/* Odds Row (only for scheduled games) */}
      {!isLive && !isFinal && game.odds && (
        <div className="flex items-center justify-between mt-3 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="flex gap-2">
            <span className="text-xs px-2 py-1 rounded" style={{ background: 'rgba(0,168,255,0.1)', color: '#00A8FF' }}>
              {game.odds.spread.home > 0 ? `+${game.odds.spread.home}` : game.odds.spread.home}
            </span>
            <span className="text-xs px-2 py-1 rounded" style={{ background: 'rgba(255,255,255,0.05)', color: '#A0A0B0' }}>
              O/U {game.odds.total.line}
            </span>
          </div>
          {game.odds.moneyline.home !== 0 && (
            <span className="text-xs font-mono font-bold" style={{ 
              color: game.odds.moneyline.home > 0 ? '#00FF88' : '#FF4455' 
            }}>
              {game.odds.moneyline.home > 0 ? '+' : ''}{game.odds.moneyline.home}
            </span>
          )}
        </div>
      )}
      
      {/* Broadcast */}
      {game.broadcast && (
        <div className="mt-2 text-xs text-center" style={{ color: '#606070' }}>
          📺 {game.broadcast}
        </div>
      )}
    </Link>
  )
}

// =============================================================================
// LIVE SCORES TICKER
// =============================================================================

export async function LiveScoresTicker() {
  const games = await fetchGames()
  const liveGames = games.filter(g => g.status === 'in_progress')
  
  if (liveGames.length === 0) return null
  
  return (
    <div className="overflow-hidden py-2 px-4" style={{ background: 'rgba(255,68,85,0.1)', borderBottom: '1px solid rgba(255,68,85,0.2)' }}>
      <div className="flex items-center gap-4 animate-marquee whitespace-nowrap">
        <span className="flex items-center gap-1 font-bold text-sm" style={{ color: '#FF4455' }}>
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          LIVE
        </span>
        
        {liveGames.map((game, idx) => (
          <Link key={game.id} href={`/game/${game.id}`} className="flex items-center gap-3 px-4">
            <span className="font-semibold" style={{ color: '#FFF' }}>
              {game.awayTeam.abbreviation} {game.awayTeam.score}
            </span>
            <span style={{ color: '#606070' }}>@</span>
            <span className="font-semibold" style={{ color: '#FFF' }}>
              {game.homeTeam.abbreviation} {game.homeTeam.score}
            </span>
            <span className="text-xs" style={{ color: '#808090' }}>
              {game.period}Q {game.clock}
            </span>
            {idx < liveGames.length - 1 && <span style={{ color: '#303040' }}>|</span>}
          </Link>
        ))}
      </div>
    </div>
  )
}

// =============================================================================
// STANDINGS TABLE
// =============================================================================

import { getAllStandings, type Standing } from '@/lib/api/live-sports'

interface StandingsTableProps {
  sport: SupportedSport
}

export async function StandingsTable({ sport }: StandingsTableProps) {
  const standings = await getAllStandings(sport)
  
  if (standings.length === 0) {
    return (
      <div className="rounded-xl p-6 text-center" style={{ background: '#0c0c14', border: '1px solid rgba(255,255,255,0.06)' }}>
        <p className="text-sm" style={{ color: '#808090' }}>Standings not available</p>
      </div>
    )
  }
  
  return (
    <div className="rounded-xl overflow-hidden" style={{ background: '#0c0c14', border: '1px solid rgba(255,255,255,0.06)' }}>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
              <th className="text-left py-3 px-4 text-xs font-semibold" style={{ color: '#606070' }}>RANK</th>
              <th className="text-left py-3 px-4 text-xs font-semibold" style={{ color: '#606070' }}>TEAM</th>
              <th className="text-center py-3 px-4 text-xs font-semibold" style={{ color: '#606070' }}>W</th>
              <th className="text-center py-3 px-4 text-xs font-semibold" style={{ color: '#606070' }}>L</th>
              {sport === 'nhl' && (
                <th className="text-center py-3 px-4 text-xs font-semibold" style={{ color: '#606070' }}>OTL</th>
              )}
              <th className="text-center py-3 px-4 text-xs font-semibold" style={{ color: '#606070' }}>PCT</th>
              <th className="text-center py-3 px-4 text-xs font-semibold" style={{ color: '#606070' }}>GB</th>
              <th className="text-center py-3 px-4 text-xs font-semibold" style={{ color: '#606070' }}>STRK</th>
              <th className="text-center py-3 px-4 text-xs font-semibold" style={{ color: '#606070' }}>L10</th>
            </tr>
          </thead>
          <tbody>
            {standings.slice(0, 16).map((s, idx) => (
              <tr key={s.team.id} 
                  className="transition-colors hover:bg-white/[0.02]"
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                <td className="py-3 px-4">
                  <span className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold ${
                    idx < 8 ? 'bg-green-500/20 text-green-400' : 'bg-white/5'
                  }`}>
                    {s.rank}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    {s.team.logo && (
                      <img src={s.team.logo} alt="" className="w-6 h-6 object-contain" />
                    )}
                    <span className="font-semibold" style={{ color: '#FFF' }}>{s.team.name}</span>
                    <span className="text-xs" style={{ color: '#606070' }}>{s.team.division}</span>
                  </div>
                </td>
                <td className="py-3 px-4 text-center font-semibold" style={{ color: '#00FF88' }}>{s.team.record.wins}</td>
                <td className="py-3 px-4 text-center font-semibold" style={{ color: '#FF4455' }}>{s.team.record.losses}</td>
                {sport === 'nhl' && (
                  <td className="py-3 px-4 text-center" style={{ color: '#808090' }}>{s.team.record.otLosses || 0}</td>
                )}
                <td className="py-3 px-4 text-center font-mono" style={{ color: '#A0A0B0' }}>
                  {typeof s.team.record.pct === 'number' ? s.team.record.pct.toFixed(3) : s.team.record.pct}
                </td>
                <td className="py-3 px-4 text-center" style={{ color: '#808090' }}>
                  {s.gamesBack === 0 ? '-' : s.gamesBack}
                </td>
                <td className="py-3 px-4 text-center">
                  <span className={`text-xs font-bold ${s.team.record.streak.startsWith('W') ? 'text-green-400' : 'text-red-400'}`}>
                    {s.team.record.streak || '-'}
                  </span>
                </td>
                <td className="py-3 px-4 text-center text-xs" style={{ color: '#808090' }}>
                  {s.team.record.last10 || '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
