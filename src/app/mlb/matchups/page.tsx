'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Calendar, RefreshCw, Loader2, Clock, ChevronRight } from 'lucide-react'

interface Game {
  id: string; sport: string; status: string; scheduledAt: string
  homeTeam: { id: string; name: string; abbreviation: string; logo?: string; score?: number; record?: string }
  awayTeam: { id: string; name: string; abbreviation: string; logo?: string; score?: number; record?: string }
  venue?: string; broadcast?: string; period?: string; clock?: string; odds?: { spread: number; total: number }
}

export default function MLBMatchupsPage() {
  const [games, setGames] = useState<Game[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [dateFilter, setDateFilter] = useState<'today' | 'tomorrow' | 'week'>('today')

  const fetchGames = async () => {
    try { setLoading(true); const res = await fetch('/api/games?sport=mlb'); if (res.ok) { const data = await res.json(); setGames(data.games || []); setLastUpdated(new Date()) } } catch (e) { console.error(e) } finally { setLoading(false) }
  }

  useEffect(() => { fetchGames(); const interval = setInterval(fetchGames, 30000); return () => clearInterval(interval) }, [])

  const filteredGames = games.filter(game => {
    const gameDate = new Date(game.scheduledAt); const today = new Date(); const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1); const weekEnd = new Date(today); weekEnd.setDate(weekEnd.getDate() + 7)
    if (dateFilter === 'today') return gameDate.toDateString() === today.toDateString()
    if (dateFilter === 'tomorrow') return gameDate.toDateString() === tomorrow.toDateString()
    return gameDate <= weekEnd
  })

  const liveGames = filteredGames.filter(g => g.status === 'live')
  const scheduledGames = filteredGames.filter(g => g.status === 'scheduled')
  const finalGames = filteredGames.filter(g => g.status === 'final')
  const formatTime = (dateStr: string) => new Date(dateStr).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'America/New_York' }) + ' ET'

  return (
    <div className="min-h-screen bg-[#050508]">
      <div className="border-b border-white/5 bg-[#0a0a12]">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3"><span className="text-3xl">⚾</span><div><h1 className="text-2xl font-black text-white">MLB Matchups</h1><p className="text-sm text-gray-500">Live odds, trends & analysis</p></div></div>
            <button onClick={fetchGames} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 text-gray-400 hover:bg-white/10"><RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />{lastUpdated && <span className="text-xs">Updated {lastUpdated.toLocaleTimeString()}</span>}</button>
          </div>
          <div className="flex items-center gap-2">
            {(['today', 'tomorrow', 'week'] as const).map(filter => (<button key={filter} onClick={() => setDateFilter(filter)} className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${dateFilter === filter ? 'bg-orange-500 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}>{filter === 'today' ? "Today" : filter === 'tomorrow' ? "Tomorrow" : "This Week"}</button>))}
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 py-6">
        {loading && games.length === 0 ? <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 text-orange-500 animate-spin" /></div> : filteredGames.length === 0 ? <div className="text-center py-20 text-gray-500">No games scheduled - MLB season starts in Spring</div> : (
          <div className="space-y-6">
            {liveGames.length > 0 && <div><h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2"><span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />Live Now ({liveGames.length})</h2><div className="grid gap-3">{liveGames.map(game => <GameCard key={game.id} game={game} formatTime={formatTime} />)}</div></div>}
            {scheduledGames.length > 0 && <div><h2 className="text-lg font-bold text-white mb-3">Upcoming ({scheduledGames.length})</h2><div className="grid gap-3">{scheduledGames.map(game => <GameCard key={game.id} game={game} formatTime={formatTime} />)}</div></div>}
            {finalGames.length > 0 && <div><h2 className="text-lg font-bold text-gray-500 mb-3">Final ({finalGames.length})</h2><div className="grid gap-3">{finalGames.map(game => <GameCard key={game.id} game={game} formatTime={formatTime} />)}</div></div>}
          </div>
        )}
      </div>
    </div>
  )
}

function GameCard({ game, formatTime }: { game: Game; formatTime: (d: string) => string }) {
  const isLive = game.status === 'live'; const isFinal = game.status === 'final'
  return (
    <Link href={`/mlb/matchups/${game.id}`}>
      <div className={`p-4 rounded-xl bg-[#0c0c14] border ${isLive ? 'border-green-500/50' : 'border-white/5'} hover:border-orange-500/30 transition-all cursor-pointer`}>
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3 min-w-[180px]">{game.awayTeam.logo && <img src={game.awayTeam.logo} alt="" className="w-10 h-10 object-contain" />}<div><div className="font-bold text-white">{game.awayTeam.name}</div><div className="text-xs text-gray-500">{game.awayTeam.record || ''}</div></div>{(isLive || isFinal) && <div className="text-2xl font-black text-white ml-auto">{game.awayTeam.score}</div>}</div>
              <span className="text-gray-600 font-bold">@</span>
              <div className="flex items-center gap-3 min-w-[180px]">{game.homeTeam.logo && <img src={game.homeTeam.logo} alt="" className="w-10 h-10 object-contain" />}<div><div className="font-bold text-white">{game.homeTeam.name}</div><div className="text-xs text-gray-500">{game.homeTeam.record || ''}</div></div>{(isLive || isFinal) && <div className="text-2xl font-black text-white ml-auto">{game.homeTeam.score}</div>}</div>
            </div>
          </div>
          <div className="flex items-center gap-6">
            {game.odds && <div className="flex gap-4 text-sm"><div className="text-center"><div className="text-xs text-gray-500">RUN LINE</div><div className="text-orange-400 font-bold">{game.odds.spread > 0 ? '+' : ''}{game.odds.spread}</div></div><div className="text-center"><div className="text-xs text-gray-500">O/U</div><div className="text-green-400 font-bold">{game.odds.total}</div></div></div>}
            <div className="text-right min-w-[80px]">{isLive ? <div className="flex items-center gap-1.5 text-green-400 text-sm font-bold"><span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />{game.period}</div> : isFinal ? <div className="text-gray-500 text-sm font-medium">FINAL</div> : <div className="text-gray-400 text-sm">{formatTime(game.scheduledAt)}</div>}{game.broadcast && <div className="text-xs text-gray-600">{game.broadcast}</div>}</div>
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </div>
        </div>
      </div>
    </Link>
  )
}
