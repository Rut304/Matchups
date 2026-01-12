'use client'

import { useState, useEffect, useCallback } from 'react'
import { LiveScoresTicker } from '@/components/game'
import type { SportKey } from '@/lib/api/data-layer'
import { 
  Activity, TrendingDown, Zap, Clock, AlertTriangle,
  Target, BarChart3, RefreshCw, Bell, ExternalLink
} from 'lucide-react'
import Link from 'next/link'

const SPORTS: { key: SportKey; name: string; icon: string }[] = [
  { key: 'NFL', name: 'Football', icon: '🏈' },
  { key: 'NBA', name: 'Basketball', icon: '🏀' },
  { key: 'NHL', name: 'Hockey', icon: '🏒' },
  { key: 'MLB', name: 'Baseball', icon: '⚾' },
]

interface LiveGame {
  id: string
  sport: SportKey
  awayTeam: { name: string; score: number }
  homeTeam: { name: string; score: number }
  status: string
  period: string
  clock: string
  isLive: boolean
  odds?: { spread: { home: number }; total: number }
  venue?: string
}

interface EdgeAlert {
  id: string
  type: 'steam' | 'rlm' | 'sharp' | 'injury' | 'arbitrage'
  severity: 'critical' | 'high' | 'medium'
  message: string
  timestamp: string
  sport: SportKey
  gameId?: string
}

export default function LivePage() {
  const [activeSport, setActiveSport] = useState<SportKey | 'all'>('all')
  const [liveGames, setLiveGames] = useState<LiveGame[]>([])
  const [upcomingGames, setUpcomingGames] = useState<LiveGame[]>([])
  const [alerts, setAlerts] = useState<EdgeAlert[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)
  const [alertFilter, setAlertFilter] = useState<'all' | 'steam' | 'rlm' | 'sharp'>('all')

  const fetchLiveData = useCallback(async () => {
    try {
      setRefreshing(true)
      const [liveRes, edgeRes] = await Promise.all([
        fetch('/api/live?mode=all'),
        fetch('/api/edge/alerts')
      ])
      const liveData = await liveRes.json()
      const edgeData = await edgeRes.json()

      if (liveData.success && Array.isArray(liveData.games)) {
        const games: LiveGame[] = liveData.games.map((g: Record<string, unknown>) => ({
          id: g.id as string,
          sport: (g.sport || 'NFL') as SportKey,
          awayTeam: { name: g.awayTeam as string, score: (g.awayScore as number) || 0 },
          homeTeam: { name: g.homeTeam as string, score: (g.homeScore as number) || 0 },
          status: (g.status as string) || 'Scheduled',
          period: (g.period as string) || '',
          clock: (g.clock as string) || '',
          isLive: Boolean(g.isLive || (g.status as string)?.includes('In Progress') || g.period),
          odds: g.spread ? { spread: { home: g.spread as number }, total: (g.total as number) || 0 } : undefined,
          venue: g.venue as string
        }))
        setLiveGames(games.filter(g => g.isLive))
        setUpcomingGames(games.filter(g => !g.isLive))
      }

      if (edgeData.success && Array.isArray(edgeData.alerts)) {
        setAlerts(edgeData.alerts.map((a: Record<string, unknown>) => ({
          id: (a.id as string) || Math.random().toString(),
          type: a.type as EdgeAlert['type'],
          severity: (a.severity || 'medium') as EdgeAlert['severity'],
          message: a.message as string,
          timestamp: (a.timestamp as string) || 'Just now',
          sport: (a.sport || 'NFL') as SportKey,
          gameId: a.gameId as string
        })))
      }
      setLastRefresh(new Date())
    } catch (err) {
      console.error('Error fetching live data:', err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => { fetchLiveData() }, [fetchLiveData])
  useEffect(() => {
    const interval = setInterval(fetchLiveData, 30000)
    return () => clearInterval(interval)
  }, [fetchLiveData])

  const filteredLiveGames = activeSport === 'all' ? liveGames : liveGames.filter(g => g.sport === activeSport)
  const filteredUpcoming = activeSport === 'all' ? upcomingGames : upcomingGames.filter(g => g.sport === activeSport)
  const filteredAlerts = alertFilter === 'all' ? alerts : alerts.filter(a => a.type === alertFilter)

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return { bg: 'rgba(239,68,68,0.2)', text: '#EF4444', border: 'rgba(239,68,68,0.3)' }
      case 'high': return { bg: 'rgba(255,107,0,0.2)', text: '#FF6B00', border: 'rgba(255,107,0,0.3)' }
      default: return { bg: 'rgba(59,130,246,0.2)', text: '#3B82F6', border: 'rgba(59,130,246,0.3)' }
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'steam': return <Zap className="w-4 h-4" />
      case 'rlm': return <TrendingDown className="w-4 h-4" />
      case 'sharp': return <Target className="w-4 h-4" />
      case 'injury': return <AlertTriangle className="w-4 h-4" />
      default: return <BarChart3 className="w-4 h-4" />
    }
  }

  return (
    <div className="min-h-screen" style={{ background: '#050508' }}>
      <LiveScoresTicker />
      <section className="relative overflow-hidden" style={{ background: 'linear-gradient(180deg, #0a0a12 0%, #050508 100%)' }}>
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full opacity-20 blur-[100px]" style={{ background: 'radial-gradient(circle, #00FF88 0%, transparent 70%)' }} />
        </div>
        <div className="max-w-7xl mx-auto px-4 py-8 relative z-10">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-3">
              <Activity className="w-10 h-10" style={{ color: '#00FF88' }} />
              <h1 className="text-4xl sm:text-5xl font-black" style={{ background: 'linear-gradient(135deg, #00FF88 0%, #FFF 50%, #00FF88 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                LIVE CENTER
              </h1>
              <span className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold animate-pulse" style={{ background: 'rgba(0,255,136,0.2)', color: '#00FF88' }}>
                <span className="w-2 h-2 bg-green-400 rounded-full" />{filteredLiveGames.length} LIVE
              </span>
            </div>
            <p className="text-lg" style={{ color: '#808090' }}>Real-time scores • Live odds • Sharp action alerts</p>
            <p className="text-xs mt-1" style={{ color: '#505060' }}>Data from ESPN & The Odds API • Auto-refreshes every 30 seconds</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <div className="p-4 rounded-2xl text-center" style={{ background: 'rgba(0,255,136,0.1)', border: '1px solid rgba(0,255,136,0.2)' }}>
              <Zap className="w-5 h-5 mx-auto mb-1" style={{ color: '#00FF88' }} />
              <div className="text-2xl font-black" style={{ color: '#00FF88' }}>{liveGames.length}</div>
              <div className="text-xs" style={{ color: '#808090' }}>Live Games</div>
            </div>
            <div className="p-4 rounded-2xl text-center" style={{ background: 'rgba(255,107,0,0.1)', border: '1px solid rgba(255,107,0,0.2)' }}>
              <Clock className="w-5 h-5 mx-auto mb-1" style={{ color: '#FF6B00' }} />
              <div className="text-2xl font-black" style={{ color: '#FF6B00' }}>{upcomingGames.length}</div>
              <div className="text-xs" style={{ color: '#808090' }}>Upcoming</div>
            </div>
            <div className="p-4 rounded-2xl text-center" style={{ background: 'rgba(155,89,182,0.1)', border: '1px solid rgba(155,89,182,0.2)' }}>
              <AlertTriangle className="w-5 h-5 mx-auto mb-1" style={{ color: '#9B59B6' }} />
              <div className="text-2xl font-black" style={{ color: '#9B59B6' }}>{alerts.filter(a => a.severity === 'high' || a.severity === 'critical').length}</div>
              <div className="text-xs" style={{ color: '#808090' }}>Sharp Alerts</div>
            </div>
            <button onClick={fetchLiveData} disabled={refreshing} className="p-4 rounded-2xl text-center hover:scale-105 transition-all" style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)' }}>
              <RefreshCw className={`w-5 h-5 mx-auto mb-1 ${refreshing ? 'animate-spin' : ''}`} style={{ color: '#3B82F6' }} />
              <div className="text-xs font-bold" style={{ color: '#3B82F6' }}>REFRESH</div>
              <div className="text-xs" style={{ color: '#808090' }}>{lastRefresh ? lastRefresh.toLocaleTimeString() : '-'}</div>
            </button>
          </div>
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <button onClick={() => setActiveSport('all')} className="px-4 py-2 rounded-xl text-sm font-bold" style={{ background: activeSport === 'all' ? 'linear-gradient(135deg, #00FF88, #00CC6A)' : 'rgba(255,255,255,0.05)', color: activeSport === 'all' ? '#000' : '#808090' }}>ALL SPORTS</button>
            {SPORTS.map(sport => (
              <button key={sport.key} onClick={() => setActiveSport(sport.key)} className="px-4 py-2 rounded-xl text-sm font-bold" style={{ background: activeSport === sport.key ? 'linear-gradient(135deg, #00FF88, #00CC6A)' : 'rgba(255,255,255,0.05)', color: activeSport === sport.key ? '#000' : '#808090' }}>
                {sport.icon} {sport.key}
              </button>
            ))}
          </div>
        </div>
      </section>
      <div className="max-w-7xl mx-auto px-4 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-20"><RefreshCw className="w-8 h-8 animate-spin" style={{ color: '#00FF88' }} /></div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {filteredLiveGames.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-4"><span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" /><h2 className="text-xl font-bold text-white">LIVE NOW</h2></div>
                  <div className="grid gap-4">
                    {filteredLiveGames.map(game => (
                      <Link key={game.id} href={`/live/${game.id}`} className="block rounded-2xl p-4 hover:scale-[1.02] transition-all" style={{ background: 'linear-gradient(135deg, rgba(0,255,136,0.1), rgba(15,15,25,0.9))', border: '1px solid rgba(0,255,136,0.3)' }}>
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs font-bold px-2 py-1 rounded" style={{ background: 'rgba(0,255,136,0.2)', color: '#00FF88' }}>{game.sport} • {game.period} {game.clock}</span>
                          <ExternalLink className="w-4 h-4 text-slate-500" />
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2"><span className="text-white font-bold">{game.awayTeam.name}</span><span className="text-2xl font-black" style={{ color: '#00FF88' }}>{game.awayTeam.score}</span></div>
                            <div className="flex items-center gap-3"><span className="text-white font-bold">{game.homeTeam.name}</span><span className="text-2xl font-black" style={{ color: '#00FF88' }}>{game.homeTeam.score}</span></div>
                          </div>
                          {game.odds && (
                            <div className="text-right text-sm">
                              <div className="text-slate-400">Spread: <span className="text-white font-mono">{game.odds.spread.home > 0 ? '+' : ''}{game.odds.spread.home}</span></div>
                              <div className="text-slate-400">O/U: <span className="text-white font-mono">{game.odds.total}</span></div>
                            </div>
                          )}
                        </div>
                        <div className="mt-3 pt-3 border-t border-slate-700 flex items-center justify-between">
                          <span className="text-xs text-slate-500">{game.venue}</span>
                          <span className="text-xs font-bold" style={{ color: '#00FF88' }}>Track Game →</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
              {filteredUpcoming.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-4"><Clock className="w-5 h-5 text-slate-400" /><h2 className="text-xl font-bold text-white">UPCOMING</h2></div>
                  <div className="grid gap-3">
                    {filteredUpcoming.slice(0, 10).map(game => (
                      <Link key={game.id} href={`/game/${game.id}?sport=${game.sport}`} className="block rounded-xl p-4 hover:bg-slate-800/50 transition-all" style={{ background: 'rgba(15,15,25,0.5)', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <span className="text-xs font-bold px-2 py-1 rounded" style={{ background: 'rgba(255,255,255,0.05)', color: '#808090' }}>{game.sport}</span>
                            <div><span className="text-white font-medium">{game.awayTeam.name}</span><span className="text-slate-500 mx-2">@</span><span className="text-white font-medium">{game.homeTeam.name}</span></div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-slate-400">{game.status}</div>
                            {game.odds && <div className="text-xs text-slate-500">{game.odds.spread.home > 0 ? '+' : ''}{game.odds.spread.home} | O/U {game.odds.total}</div>}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
              {filteredLiveGames.length === 0 && filteredUpcoming.length === 0 && (
                <div className="text-center py-20 text-slate-500"><Activity className="w-12 h-12 mx-auto mb-4 opacity-30" /><p>No games available for {activeSport === 'all' ? 'any sport' : activeSport}</p></div>
              )}
            </div>
            <div>
              <div className="sticky top-4">
                <div className="flex items-center gap-2 mb-4"><Bell className="w-5 h-5" style={{ color: '#FF6B00' }} /><h2 className="text-xl font-bold text-white">EDGE ALERTS</h2></div>
                <div className="flex gap-2 mb-4 flex-wrap">
                  {(['all', 'steam', 'rlm', 'sharp'] as const).map(filter => (
                    <button key={filter} onClick={() => setAlertFilter(filter)} className="px-3 py-1 rounded-lg text-xs font-bold uppercase" style={{ background: alertFilter === filter ? 'rgba(255,107,0,0.2)' : 'rgba(255,255,255,0.05)', color: alertFilter === filter ? '#FF6B00' : '#808090', border: alertFilter === filter ? '1px solid rgba(255,107,0,0.3)' : 'none' }}>{filter}</button>
                  ))}
                </div>
                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                  {filteredAlerts.length > 0 ? filteredAlerts.map(alert => {
                    const colors = getSeverityColor(alert.severity)
                    return (
                      <div key={alert.id} className="rounded-xl p-4" style={{ background: colors.bg, border: `1px solid ${colors.border}` }}>
                        <div className="flex items-start gap-3">
                          <div style={{ color: colors.text }}>{getTypeIcon(alert.type)}</div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1"><span className="text-xs font-bold uppercase" style={{ color: colors.text }}>{alert.type}</span><span className="text-xs text-slate-500">{alert.timestamp}</span></div>
                            <p className="text-sm text-slate-300">{alert.message}</p>
                            {alert.gameId && <Link href={`/live/${alert.gameId}`} className="text-xs mt-2 inline-block" style={{ color: colors.text }}>View Game →</Link>}
                          </div>
                        </div>
                      </div>
                    )
                  }) : (
                    <div className="text-center py-10 text-slate-500"><Bell className="w-8 h-8 mx-auto mb-2 opacity-30" /><p className="text-sm">No alerts at this time</p></div>
                  )}
                </div>
                <div className="mt-4 p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.02)' }}><p className="text-xs text-slate-500">Alerts powered by THE EDGE AI • Detecting RLM, steam moves, CLV & arbitrage</p></div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
