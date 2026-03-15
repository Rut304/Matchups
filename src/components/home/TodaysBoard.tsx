'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Activity, Clock, ChevronDown, ChevronUp } from 'lucide-react'

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
  period?: string
  clock?: string
  odds?: {
    spread?: number
    total?: number
    moneylineHome?: number
    moneylineAway?: number
  }
}

const SPORTS_ORDER = ['NBA', 'NHL', 'MLB', 'NCAAB', 'NCAAF', 'NFL']

function StatusBadge({ status, period, clock }: { status: string; period?: string; clock?: string }) {
  if (status === 'live' || status === 'in') {
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-red-500/20 text-red-400 border border-red-500/30">
        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
        {period && clock ? `${period} ${clock}` : 'LIVE'}
      </span>
    )
  }
  if (status === 'final' || status === 'post') {
    return <span className="text-[10px] font-bold text-slate-500 uppercase">Final</span>
  }
  // Scheduled
  const t = new Date(status === 'scheduled' ? '' : status)
  return <span className="text-[10px] text-slate-500" />
}

function MiniScoreboard({ games, sport }: { games: Game[]; sport: string }) {
  const sportIcons: Record<string, string> = {
    NBA: '🏀', NHL: '🏒', MLB: '⚾', NCAAB: '🏀', NCAAF: '🏈', NFL: '🏈', WNBA: '🏀'
  }

  const live = games.filter(g => g.status === 'live' || g.status === 'in')
  const upcoming = games.filter(g => g.status === 'scheduled' || g.status === 'pre')
  const final_ = games.filter(g => g.status === 'final' || g.status === 'post')
  const sorted = [...live, ...upcoming, ...final_]

  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-sm">{sportIcons[sport] || '🎯'}</span>
        <h3 className="text-sm font-bold text-white">{sport}</h3>
        <span className="text-[10px] text-slate-500">{games.length} game{games.length !== 1 ? 's' : ''}</span>
        {live.length > 0 && (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-red-500/15 text-red-400">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" /> {live.length} Live
          </span>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
        {sorted.slice(0, 8).map(game => {
          const isLive = game.status === 'live' || game.status === 'in'
          const isFinal = game.status === 'final' || game.status === 'post'
          const timeStr = new Date(game.scheduledAt).toLocaleTimeString('en-US', {
            hour: 'numeric', minute: '2-digit', hour12: true
          })

          return (
            <Link key={game.id} href={`/game/${game.id}?sport=${game.sport?.toLowerCase() || sport.toLowerCase()}`}>
              <div className={`rounded-lg p-2.5 border transition-all hover:bg-white/[0.04] cursor-pointer ${
                isLive ? 'border-red-500/30 bg-red-500/[0.03]' : 'border-white/[0.06] bg-white/[0.015]'
              }`}>
                {/* Status row */}
                <div className="flex items-center justify-between mb-1.5">
                  {isLive ? (
                    <StatusBadge status="live" period={game.period} clock={game.clock} />
                  ) : isFinal ? (
                    <StatusBadge status="final" />
                  ) : (
                    <span className="text-[10px] text-slate-500">{timeStr}</span>
                  )}
                  {game.broadcast && (
                    <span className="text-[9px] text-slate-600 truncate max-w-[60px]">{game.broadcast.split(',')[0]}</span>
                  )}
                </div>
                {/* Away */}
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    {game.awayTeam.logo && (
                      <img src={game.awayTeam.logo} alt="" className="w-4 h-4" />
                    )}
                    <span className={`text-xs font-bold ${isFinal && game.awayTeam.score > game.homeTeam.score ? 'text-white' : 'text-slate-400'}`}>
                      {game.awayTeam.abbreviation}
                    </span>
                    {game.awayTeam.record && (
                      <span className="text-[9px] text-slate-600">{game.awayTeam.record}</span>
                    )}
                  </div>
                  {(isLive || isFinal) && (
                    <span className={`text-sm font-bold font-mono ${isFinal && game.awayTeam.score > game.homeTeam.score ? 'text-white' : 'text-slate-400'}`}>
                      {game.awayTeam.score}
                    </span>
                  )}
                </div>
                {/* Home */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    {game.homeTeam.logo && (
                      <img src={game.homeTeam.logo} alt="" className="w-4 h-4" />
                    )}
                    <span className={`text-xs font-bold ${isFinal && game.homeTeam.score > game.awayTeam.score ? 'text-white' : 'text-slate-400'}`}>
                      {game.homeTeam.abbreviation}
                    </span>
                    {game.homeTeam.record && (
                      <span className="text-[9px] text-slate-600">{game.homeTeam.record}</span>
                    )}
                  </div>
                  {(isLive || isFinal) && (
                    <span className={`text-sm font-bold font-mono ${isFinal && game.homeTeam.score > game.awayTeam.score ? 'text-white' : 'text-slate-400'}`}>
                      {game.homeTeam.score}
                    </span>
                  )}
                </div>
                {/* Odds line at bottom */}
                {game.odds && (game.odds.spread || game.odds.total) && (
                  <div className="mt-1.5 pt-1.5 border-t border-white/5 flex items-center gap-3 text-[9px] text-slate-600">
                    {game.odds.spread != null && <span>Spread: {game.odds.spread > 0 ? '+' : ''}{game.odds.spread}</span>}
                    {game.odds.total != null && <span>O/U: {game.odds.total}</span>}
                  </div>
                )}
              </div>
            </Link>
          )
        })}
      </div>
      {sorted.length > 8 && (
        <p className="text-[10px] text-slate-600 mt-1 text-center">+{sorted.length - 8} more games</p>
      )}
    </div>
  )
}

export function TodaysBoard() {
  const [gamesBySport, setGamesBySport] = useState<Record<string, Game[]>>({})
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(true)

  useEffect(() => {
    async function load() {
      const sportsToFetch = ['nba', 'nhl', 'mlb', 'ncaab']
      const results: Record<string, Game[]> = {}

      await Promise.all(sportsToFetch.map(async sport => {
        try {
          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), 8000)
          const res = await fetch(`/api/games?sport=${sport}`, { signal: controller.signal })
          clearTimeout(timeoutId)
          if (res.ok) {
            const d = await res.json()
            const games = d.games || d.data || []
            if (games.length > 0) results[sport.toUpperCase()] = games
          }
        } catch { /* skip */ }
      }))

      setGamesBySport(results)
      setLoading(false)
    }
    load()
    const interval = setInterval(load, 60000)
    return () => clearInterval(interval)
  }, [])

  const totalGames = Object.values(gamesBySport).reduce((sum, g) => sum + g.length, 0)
  const liveGames = Object.values(gamesBySport).flat().filter(g => g.status === 'live' || g.status === 'in').length

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-6 bg-slate-800 rounded w-40 mb-3" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-20 bg-slate-800/50 rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  if (totalGames === 0) return null

  return (
    <div>
      <button
        onClick={() => setExpanded(e => !e)}
        className="flex items-center justify-between w-full mb-3"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-500/20 to-slate-500/5 border border-slate-500/20 flex items-center justify-center">
            <Activity className="w-5 h-5 text-slate-400" />
          </div>
          <div className="text-left">
            <h2 className="text-xl font-bold text-white">Today's Board</h2>
            <p className="text-xs text-slate-500">
              {totalGames} games across {Object.keys(gamesBySport).length} sports
              {liveGames > 0 && <span className="text-red-400 ml-1">• {liveGames} live</span>}
            </p>
          </div>
        </div>
        {expanded ? <ChevronUp className="w-5 h-5 text-slate-500" /> : <ChevronDown className="w-5 h-5 text-slate-500" />}
      </button>

      {expanded && (
        <div>
          {SPORTS_ORDER.filter(s => gamesBySport[s]).map(sport => (
            <MiniScoreboard key={sport} games={gamesBySport[sport]} sport={sport} />
          ))}
        </div>
      )}
    </div>
  )
}
