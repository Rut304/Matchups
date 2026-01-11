'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, TrendingUp, TrendingDown, Loader2, Clock, MapPin, Tv } from 'lucide-react'
import { InjuryReport } from '@/components/matchup'

interface Game {
  id: string; sport: string; status: string; scheduledAt: string
  homeTeam: { id: string; name: string; abbreviation: string; logo?: string; score?: number; record?: string }
  awayTeam: { id: string; name: string; abbreviation: string; logo?: string; score?: number; record?: string }
  venue?: string; broadcast?: string; period?: string; clock?: string; odds?: { spread: number; total: number }
}

interface Analytics { prediction: { winner: string; confidence: number; spread: number }; keyFactors: string[]; h2h: { meetings: number; homeWins: number; awayWins: number; avgTotal: number }; trends: string[]; edges: { home: number; away: number; over: number; under: number } }

export default function WNCAABMatchupDetailPage() {
  const params = useParams()
  const [game, setGame] = useState<Game | null>(null)
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [gamesRes, analyticsRes] = await Promise.all([fetch('/api/games?sport=wncaab'), fetch(`/api/matchup/${params.gameId}/analytics?intelligence=true`)])
        if (gamesRes.ok) { const data = await gamesRes.json(); const found = data.games?.find((g: Game) => g.id === params.gameId); if (found) setGame(found) }
        if (analyticsRes.ok) { const data = await analyticsRes.json(); setAnalytics(data) }
      } catch (e) { console.error(e) } finally { setLoading(false) }
    }
    fetchData(); const interval = setInterval(fetchData, 30000); return () => clearInterval(interval)
  }, [params.gameId])

  if (loading) return <div className="min-h-screen bg-[#050508] flex items-center justify-center"><Loader2 className="w-10 h-10 text-orange-500 animate-spin" /></div>
  if (!game) return <div className="min-h-screen bg-[#050508] flex flex-col items-center justify-center gap-4"><div className="text-gray-500">Game not found</div><Link href="/wncaab/matchups" className="text-orange-400 hover:underline">← Back to matchups</Link></div>

  const isLive = game.status === 'live'; const isFinal = game.status === 'final'
  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
  const formatTime = (d: string) => new Date(d).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'America/New_York' }) + ' ET'

  return (
    <div className="min-h-screen bg-[#050508]">
      <div className="max-w-6xl mx-auto px-4 py-6">
        <Link href="/wncaab/matchups" className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6"><ArrowLeft className="w-4 h-4" /> Back to WNCAAB Matchups</Link>
        <div className={`rounded-2xl bg-[#0a0a12] border ${isLive ? 'border-green-500/50' : 'border-white/5'} overflow-hidden`}>
          <div className="p-6 border-b border-white/5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-8 flex-1">
                <Link href={`/team/wncaab/${game.awayTeam.abbreviation?.toLowerCase()}`} className="text-center group hover:opacity-80 transition-opacity"><img src={game.awayTeam.logo || '/placeholder.png'} alt="" className="w-20 h-20 mx-auto mb-2 object-contain group-hover:ring-2 ring-orange-500/50 rounded-full transition-all" /><div className="font-bold text-white text-lg group-hover:text-orange-400 transition-colors">{game.awayTeam.name}</div><div className="text-sm text-gray-500">{game.awayTeam.record || 'Record N/A'}</div>{(isLive || isFinal) && <div className="text-4xl font-black text-white mt-2">{game.awayTeam.score}</div>}</Link>
                <div className="text-center">{isLive ? <div className="bg-green-500/20 text-green-400 px-4 py-2 rounded-full text-sm font-bold mb-2 flex items-center gap-2"><span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />LIVE</div> : isFinal ? <div className="bg-white/10 text-gray-400 px-4 py-2 rounded-full text-sm font-bold mb-2">FINAL</div> : <div className="text-gray-500 text-sm mb-2">{formatDate(game.scheduledAt)}</div>}<div className="text-gray-600 text-4xl font-thin">VS</div>{isLive && game.period && <div className="text-orange-400 font-bold mt-2">{game.period} - {game.clock}</div>}{!isLive && !isFinal && <div className="text-white font-bold mt-2">{formatTime(game.scheduledAt)}</div>}</div>
                <Link href={`/team/wncaab/${game.homeTeam.abbreviation?.toLowerCase()}`} className="text-center group hover:opacity-80 transition-opacity"><img src={game.homeTeam.logo || '/placeholder.png'} alt="" className="w-20 h-20 mx-auto mb-2 object-contain group-hover:ring-2 ring-orange-500/50 rounded-full transition-all" /><div className="font-bold text-white text-lg group-hover:text-orange-400 transition-colors">{game.homeTeam.name}</div><div className="text-sm text-gray-500">{game.homeTeam.record || 'Record N/A'}</div>{(isLive || isFinal) && <div className="text-4xl font-black text-white mt-2">{game.homeTeam.score}</div>}</Link>
              </div>
              {game.odds && <div className="border-l border-white/10 pl-8 ml-8"><div className="grid grid-cols-2 gap-4 text-center"><div className="bg-white/5 rounded-lg p-3"><div className="text-xs text-gray-500 mb-1">SPREAD</div><div className="text-xl font-bold text-orange-400">{game.odds.spread > 0 ? '+' : ''}{game.odds.spread}</div></div><div className="bg-white/5 rounded-lg p-3"><div className="text-xs text-gray-500 mb-1">TOTAL</div><div className="text-xl font-bold text-green-400">{game.odds.total}</div></div></div></div>}
            </div>
          </div>
          {analytics?.prediction && <div className="p-4 bg-gradient-to-r from-orange-500/10 to-transparent border-b border-white/5"><div className="flex items-center justify-between"><div className="flex items-center gap-4"><div className="w-12 h-12 rounded-xl bg-orange-500/20 flex items-center justify-center"><TrendingUp className="w-6 h-6 text-orange-400" /></div><div><div className="text-sm text-gray-400">AI PREDICTION</div><div className="text-lg font-bold text-white">{analytics.prediction.winner} wins by {Math.abs(analytics.prediction.spread).toFixed(1)}</div></div></div><div className="text-right"><div className="text-3xl font-black text-orange-400">{analytics.prediction.confidence}%</div><div className="text-xs text-gray-500">Confidence</div></div></div></div>}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          <div className="lg:col-span-2 space-y-6">
            {analytics?.keyFactors && <div className="rounded-xl bg-[#0a0a12] border border-white/5 p-5"><h3 className="text-lg font-bold text-white mb-4">📊 Key Betting Metrics</h3><div className="grid grid-cols-2 gap-3">{analytics.keyFactors.map((f, i) => <div key={i} className="bg-white/5 rounded-lg p-3 text-sm text-gray-300">{f}</div>)}</div></div>}
            {analytics?.h2h && <div className="rounded-xl bg-[#0a0a12] border border-white/5 p-5"><h3 className="text-lg font-bold text-white mb-4">🔄 Head-to-Head History</h3><div className="grid grid-cols-4 gap-4 text-center"><div className="bg-white/5 rounded-lg p-3"><div className="text-2xl font-bold text-white">{analytics.h2h.meetings}</div><div className="text-xs text-gray-500">Meetings</div></div><div className="bg-white/5 rounded-lg p-3"><div className="text-2xl font-bold text-orange-400">{analytics.h2h.homeWins}</div><div className="text-xs text-gray-500">Home Wins</div></div><div className="bg-white/5 rounded-lg p-3"><div className="text-2xl font-bold text-cyan-400">{analytics.h2h.awayWins}</div><div className="text-xs text-gray-500">Away Wins</div></div><div className="bg-white/5 rounded-lg p-3"><div className="text-2xl font-bold text-green-400">{analytics.h2h.avgTotal.toFixed(1)}</div><div className="text-xs text-gray-500">Avg Total</div></div></div></div>}
            {analytics?.trends && <div className="rounded-xl bg-[#0a0a12] border border-white/5 p-5"><h3 className="text-lg font-bold text-white mb-4">📈 Betting Trends</h3><ul className="space-y-2">{analytics.trends.map((t, i) => <li key={i} className="flex items-start gap-2 text-sm text-gray-300"><span className="text-orange-400">•</span>{t}</li>)}</ul></div>}
          </div>
          <div className="space-y-6">
            {analytics?.edges && <div className="rounded-xl bg-[#0a0a12] border border-white/5 p-5"><h3 className="text-lg font-bold text-white mb-4">⚡ Edge Score</h3><div className="space-y-3">{[{ l: 'Home ML', v: analytics.edges.home }, { l: 'Away ML', v: analytics.edges.away }, { l: 'Over', v: analytics.edges.over }, { l: 'Under', v: analytics.edges.under }].map(e => <div key={e.l}><div className="flex justify-between text-sm mb-1"><span className="text-gray-400">{e.l}</span><span className={e.v > 0 ? 'text-green-400' : 'text-red-400'}>{e.v > 0 ? '+' : ''}{e.v.toFixed(1)}%</span></div><div className="h-2 bg-white/10 rounded-full overflow-hidden"><div className={`h-full rounded-full ${e.v > 0 ? 'bg-green-500' : 'bg-red-500'}`} style={{ width: `${Math.min(Math.abs(e.v), 100)}%` }} /></div></div>)}</div></div>}
            <div className="rounded-xl bg-[#0a0a12] border border-white/5 p-5"><h3 className="text-lg font-bold text-white mb-4">🏟️ Game Info</h3><div className="space-y-3 text-sm">{game.venue && <div className="flex items-center gap-2 text-gray-400"><MapPin className="w-4 h-4" />{game.venue}</div>}{game.broadcast && <div className="flex items-center gap-2 text-gray-400"><Tv className="w-4 h-4" />{game.broadcast}</div>}<div className="flex items-center gap-2 text-gray-400"><Clock className="w-4 h-4" />{formatTime(game.scheduledAt)}</div></div></div>
            <div className="rounded-xl bg-gradient-to-br from-orange-500/20 to-transparent border border-orange-500/30 p-5"><h3 className="text-lg font-bold text-white mb-2">🎯 Quick Signals</h3><div className="text-sm text-gray-400 space-y-1">{analytics?.edges && (<>{analytics.edges.home > 5 && <div className="text-green-400">✓ Home edge detected (+{analytics.edges.home.toFixed(1)}%)</div>}{analytics.edges.away > 5 && <div className="text-green-400">✓ Away edge detected (+{analytics.edges.away.toFixed(1)}%)</div>}{analytics.edges.over > 5 && <div className="text-green-400">✓ Over value found (+{analytics.edges.over.toFixed(1)}%)</div>}{analytics.edges.under > 5 && <div className="text-green-400">✓ Under value found (+{analytics.edges.under.toFixed(1)}%)</div>}</>)}{!analytics && <div>Loading signals...</div>}</div></div>

            {/* Injury Report */}
            <InjuryReport 
              sport="wncaab" 
              homeTeam={game.homeTeam.abbreviation} 
              awayTeam={game.awayTeam.abbreviation}
              homeTeamFull={game.homeTeam.name}
              awayTeamFull={game.awayTeam.name}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
