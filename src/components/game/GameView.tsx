'use client'

import { useState, useEffect } from 'react'
import { type UnifiedGame } from '@/lib/api/data-layer'

interface GameViewProps {
  game: UnifiedGame
  expanded?: boolean
}

export function GameView({ game, expanded = false }: GameViewProps) {
  const [isExpanded, setIsExpanded] = useState(expanded)
  const [liveData, setLiveData] = useState(game)
  
  // Auto-refresh for live games
  useEffect(() => {
    if (game.status !== 'live') return
    
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/games/${game.id}`)
        if (res.ok) {
          const data = await res.json()
          setLiveData(data)
        }
      } catch (error) {
        console.error('Failed to refresh game:', error)
      }
    }, 30000) // Refresh every 30 seconds
    
    return () => clearInterval(interval)
  }, [game.id, game.status])
  
  const isLive = liveData.status === 'live'
  const isFinal = liveData.status === 'final'
  
  return (
    <div className={`bg-zinc-900 rounded-lg border ${isLive ? 'border-green-500' : 'border-zinc-800'} overflow-hidden`}>
      {/* Game Header */}
      <div 
        className="p-4 cursor-pointer hover:bg-zinc-800/50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between mb-3">
          {/* Status Badge */}
          <div className="flex items-center gap-2">
            {isLive && (
              <span className="flex items-center gap-1.5 px-2 py-0.5 bg-green-500/20 text-green-400 text-xs font-medium rounded">
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                LIVE
              </span>
            )}
            {isFinal && (
              <span className="px-2 py-0.5 bg-zinc-700 text-zinc-400 text-xs font-medium rounded">
                FINAL
              </span>
            )}
            {!isLive && !isFinal && (
              <span className="text-xs text-zinc-500">
                {new Date(liveData.scheduledAt).toLocaleTimeString('en-US', { 
                  hour: 'numeric', 
                  minute: '2-digit',
                  timeZoneName: 'short'
                })}
              </span>
            )}
            {liveData.period && liveData.clock && (
              <span className="text-xs text-zinc-400">
                {liveData.period} • {liveData.clock}
              </span>
            )}
          </div>
          
          {/* Broadcast */}
          {liveData.broadcast && (
            <span className="text-xs text-zinc-500">{liveData.broadcast}</span>
          )}
        </div>
        
        {/* Teams */}
        <div className="space-y-2">
          {/* Away Team */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {liveData.awayTeam.logo && (
                <img 
                  src={liveData.awayTeam.logo} 
                  alt={liveData.awayTeam.name}
                  className="w-8 h-8 object-contain"
                />
              )}
              <div>
                <span className="font-semibold text-white">{liveData.awayTeam.name}</span>
                {liveData.awayTeam.record && (
                  <span className="ml-2 text-xs text-zinc-500">({liveData.awayTeam.record})</span>
                )}
              </div>
            </div>
            <span className={`text-2xl font-bold ${
              isFinal && (liveData.awayTeam.score ?? 0) > (liveData.homeTeam.score ?? 0) 
                ? 'text-white' 
                : 'text-zinc-400'
            }`}>
              {liveData.awayTeam.score ?? '-'}
            </span>
          </div>
          
          {/* Home Team */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {liveData.homeTeam.logo && (
                <img 
                  src={liveData.homeTeam.logo} 
                  alt={liveData.homeTeam.name}
                  className="w-8 h-8 object-contain"
                />
              )}
              <div>
                <span className="font-semibold text-white">{liveData.homeTeam.name}</span>
                {liveData.homeTeam.record && (
                  <span className="ml-2 text-xs text-zinc-500">({liveData.homeTeam.record})</span>
                )}
              </div>
            </div>
            <span className={`text-2xl font-bold ${
              isFinal && (liveData.homeTeam.score ?? 0) > (liveData.awayTeam.score ?? 0) 
                ? 'text-white' 
                : 'text-zinc-400'
            }`}>
              {liveData.homeTeam.score ?? '-'}
            </span>
          </div>
        </div>
        
        {/* Quick Odds Preview */}
        {liveData.odds && !isFinal && (
          <div className="flex items-center gap-4 mt-3 pt-3 border-t border-zinc-800 text-xs text-zinc-400">
            <span>Spread: {liveData.odds.spread > 0 ? '+' : ''}{liveData.odds.spread}</span>
            <span>O/U: {liveData.odds.total}</span>
            <span>ML: {liveData.odds.homeML > 0 ? '+' : ''}{liveData.odds.homeML}</span>
          </div>
        )}
      </div>
      
      {/* Expanded View */}
      {isExpanded && (
        <div className="border-t border-zinc-800 p-4 space-y-4">
          {/* Betting Lines Detail */}
          {liveData.odds && (
            <div>
              <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-2">Betting Lines</h4>
              <div className="grid grid-cols-3 gap-4">
                {/* Spread */}
                <div className="bg-zinc-800 rounded-lg p-3">
                  <div className="text-xs text-zinc-500 mb-1">Spread</div>
                  <div className="text-white font-semibold">
                    {liveData.awayTeam.abbreviation} {liveData.odds.spread > 0 ? '+' : ''}{-liveData.odds.spread}
                  </div>
                  <div className="text-white font-semibold">
                    {liveData.homeTeam.abbreviation} {liveData.odds.spread > 0 ? '+' : ''}{liveData.odds.spread}
                  </div>
                </div>
                
                {/* Total */}
                <div className="bg-zinc-800 rounded-lg p-3">
                  <div className="text-xs text-zinc-500 mb-1">Total</div>
                  <div className="text-white font-semibold">
                    O {liveData.odds.total} ({formatOdds(liveData.odds.overOdds)})
                  </div>
                  <div className="text-white font-semibold">
                    U {liveData.odds.total} ({formatOdds(liveData.odds.underOdds)})
                  </div>
                </div>
                
                {/* Moneyline */}
                <div className="bg-zinc-800 rounded-lg p-3">
                  <div className="text-xs text-zinc-500 mb-1">Moneyline</div>
                  <div className="text-white font-semibold">
                    {liveData.awayTeam.abbreviation} {formatOdds(liveData.odds.awayML)}
                  </div>
                  <div className="text-white font-semibold">
                    {liveData.homeTeam.abbreviation} {formatOdds(liveData.odds.homeML)}
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Consensus */}
          {liveData.consensus && (
            <div>
              <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-2">
                Consensus ({liveData.consensus.bookmakerCount} books)
              </h4>
              <div className="flex gap-4 text-sm">
                <span className="text-zinc-400">
                  Spread: <span className="text-white">{liveData.consensus.spread?.toFixed(1)}</span>
                </span>
                <span className="text-zinc-400">
                  Total: <span className="text-white">{liveData.consensus.total?.toFixed(1)}</span>
                </span>
              </div>
            </div>
          )}
          
          {/* Game Info */}
          <div className="flex flex-wrap gap-4 text-xs text-zinc-500">
            {liveData.venue && (
              <span>📍 {liveData.venue}</span>
            )}
            {liveData.weather && (
              <span>🌡️ {liveData.weather.temp}°F - {liveData.weather.condition}</span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function formatOdds(odds: number): string {
  if (odds > 0) return `+${odds}`
  return String(odds)
}

// Game List Component
interface GameListProps {
  games: UnifiedGame[]
  title?: string
  showEmpty?: boolean
}

export function GameList({ games, title, showEmpty = true }: GameListProps) {
  if (games.length === 0 && !showEmpty) return null
  
  return (
    <div className="space-y-4">
      {title && (
        <h3 className="text-lg font-semibold text-white">{title}</h3>
      )}
      
      {games.length === 0 ? (
        <div className="text-center py-8 text-zinc-500">
          No games scheduled
        </div>
      ) : (
        <div className="space-y-3">
          {games.map(game => (
            <GameView key={game.id} game={game} />
          ))}
        </div>
      )}
    </div>
  )
}

// Score Ticker for live games
interface ScoreTickerProps {
  games: UnifiedGame[]
}

export function ScoreTicker({ games }: ScoreTickerProps) {
  const liveGames = games.filter(g => g.status === 'live')
  
  if (liveGames.length === 0) return null
  
  return (
    <div className="bg-zinc-900 border-b border-zinc-800 overflow-hidden">
      <div className="flex items-center animate-marquee whitespace-nowrap py-2">
        {liveGames.map(game => (
          <div key={game.id} className="inline-flex items-center gap-4 px-6 border-r border-zinc-800">
            <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
            <span className="text-sm">
              <span className="text-zinc-400">{game.awayTeam.abbreviation}</span>
              <span className="mx-2 font-bold text-white">{game.awayTeam.score}</span>
              <span className="text-zinc-600">@</span>
              <span className="mx-2 font-bold text-white">{game.homeTeam.score}</span>
              <span className="text-zinc-400">{game.homeTeam.abbreviation}</span>
              <span className="ml-2 text-xs text-zinc-500">{game.period} {game.clock}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
