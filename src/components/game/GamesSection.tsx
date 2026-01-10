'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useGames, useAllSportsGames } from '@/hooks/useGames'
import { GameView } from '@/components/game/GameView'
import type { SportKey } from '@/lib/api/data-layer'
import { Calendar, RefreshCw, Clock, ChevronRight } from 'lucide-react'

interface GamesSectionProps {
  sport: SportKey
  title?: string
  limit?: number
  showViewAll?: boolean
}

export function GamesSection({ sport, title, limit, showViewAll = true }: GamesSectionProps) {
  const { games, isLoading, error, refetch, lastUpdated } = useGames(sport)
  const [filter, setFilter] = useState<'all' | 'live' | 'scheduled' | 'final'>('all')
  
  const filteredGames = games.filter(g => {
    if (filter === 'all') return true
    return g.status === filter
  })
  
  const displayGames = limit ? filteredGames.slice(0, limit) : filteredGames
  
  const liveCount = games.filter(g => g.status === 'live').length
  const scheduledCount = games.filter(g => g.status === 'scheduled').length
  const finalCount = games.filter(g => g.status === 'final').length
  
  return (
    <div className="rounded-2xl p-5" style={{ background: '#0c0c14', border: '1px solid rgba(255,255,255,0.06)' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Calendar className="w-5 h-5" style={{ color: '#FF6B00' }} />
          <h2 className="text-lg font-bold text-white">{title || `${sport} Games`}</h2>
          {liveCount > 0 && (
            <span className="flex items-center gap-1.5 px-2 py-0.5 bg-green-500/20 text-green-400 text-xs font-bold rounded">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
              {liveCount} LIVE
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-3">
          {lastUpdated && (
            <span className="text-xs text-zinc-500 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {lastUpdated.toLocaleTimeString('en-US', { 
                hour: 'numeric', 
                minute: '2-digit',
                timeZone: 'America/New_York'
              })} ET
            </span>
          )}
          <button 
            onClick={refetch}
            className="p-1.5 rounded-lg hover:bg-white/5 transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 text-zinc-500 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>
      
      {/* Filter Tabs */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
        {[
          { key: 'all' as const, label: 'All', count: games.length },
          { key: 'live' as const, label: 'Live', count: liveCount },
          { key: 'scheduled' as const, label: 'Upcoming', count: scheduledCount },
          { key: 'final' as const, label: 'Final', count: finalCount },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
              filter === tab.key 
                ? 'bg-orange-500/20 text-orange-400' 
                : 'bg-white/5 text-zinc-400 hover:bg-white/10'
            }`}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>
      
      {/* Content */}
      {error ? (
        <div className="text-center py-8 text-red-400">
          <p>Failed to load games</p>
          <button onClick={refetch} className="mt-2 text-xs text-orange-400 hover:underline">
            Try again
          </button>
        </div>
      ) : isLoading && games.length === 0 ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 rounded-lg bg-zinc-800/50 animate-pulse" />
          ))}
        </div>
      ) : displayGames.length === 0 ? (
        <div className="text-center py-8 text-zinc-500">
          <p>No {filter === 'all' ? '' : filter} games found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayGames.map(game => (
            <GameView key={game.id} game={game} />
          ))}
        </div>
      )}
      
      {/* View All Link */}
      {showViewAll && games.length > (limit || 0) && (
        <Link 
          href={`/${sport.toLowerCase()}/schedule`}
          className="flex items-center justify-center gap-1 mt-4 py-2 text-sm text-orange-400 hover:text-orange-300 transition-colors"
        >
          View all {sport} games <ChevronRight className="w-4 h-4" />
        </Link>
      )}
    </div>
  )
}

// Live scores ticker for top of page
export function LiveScoresTicker() {
  const { gamesBySport, isLoading } = useAllSportsGames()
  
  // Get all live games across sports
  const liveGames = Object.entries(gamesBySport)
    .flatMap(([sport, games]) => 
      (games || [])
        .filter(g => g.status === 'live')
        .map(g => ({ ...g, sport: sport as SportKey }))
    )
  
  if (isLoading || liveGames.length === 0) return null
  
  return (
    <div className="bg-zinc-900/80 border-b border-zinc-800 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center gap-6 py-2 overflow-x-auto scrollbar-hide">
          <span className="flex items-center gap-1.5 text-xs font-bold text-green-400 whitespace-nowrap">
            <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
            LIVE NOW
          </span>
          
          {liveGames.map(game => (
            <Link 
              key={game.id} 
              href={`/game/${game.id}`}
              className="flex items-center gap-3 text-sm whitespace-nowrap hover:bg-white/5 px-2 py-1 rounded"
            >
              <span className="text-zinc-400">{game.awayTeam.abbreviation}</span>
              <span className="font-bold text-white">{game.awayTeam.score ?? '-'}</span>
              <span className="text-zinc-600">@</span>
              <span className="font-bold text-white">{game.homeTeam.score ?? '-'}</span>
              <span className="text-zinc-400">{game.homeTeam.abbreviation}</span>
              <span className="text-xs text-zinc-500">{game.period} {game.clock}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

// Import the hook
