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

  const getSeverityClasses = (severity: string) => {
    switch (severity) {
      case 'critical': return { container: 'alert-bg-critical', text: 'text-red-500' }
      case 'high': return { container: 'alert-bg-high', text: 'text-orange' }
      default: return { container: 'alert-bg-medium', text: 'text-blue' }
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
    <div className="min-h-screen bg-page-dark">
      <LiveScoresTicker />
      <section className="relative overflow-hidden bg-page-gradient">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full opacity-20 blur-[100px] bg-glow-green" />
        </div>
        <div className="max-w-7xl mx-auto px-4 py-8 relative z-10">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-3">
              <Activity className="w-10 h-10 text-green" />
              <h1 className="text-4xl sm:text-5xl font-black text-gradient-green">
                LIVE CENTER
              </h1>
              <span className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold animate-pulse badge-green">
                <span className="w-2 h-2 bg-green-400 rounded-full" />{filteredLiveGames.length} LIVE
              </span>
            </div>
            <p className="text-lg text-muted">Real-time scores • Live odds • Sharp action alerts</p>
            <p className="text-xs mt-1 text-dimmed">Data from ESPN & The Odds API • Auto-refreshes every 30 seconds</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <div className="p-4 rounded-2xl text-center bg-green-soft">
              <Zap className="w-5 h-5 mx-auto mb-1 text-green" />
              <div className="text-2xl font-black text-green">{liveGames.length}</div>
              <div className="text-xs text-muted">Live Games</div>
            </div>
            <div className="p-4 rounded-2xl text-center bg-orange-soft">
              <Clock className="w-5 h-5 mx-auto mb-1 text-orange" />
              <div className="text-2xl font-black text-orange">{upcomingGames.length}</div>
              <div className="text-xs text-muted">Upcoming</div>
            </div>
            <div className="p-4 rounded-2xl text-center bg-purple-soft">
              <AlertTriangle className="w-5 h-5 mx-auto mb-1 text-purple" />
              <div className="text-2xl font-black text-purple">{alerts.filter(a => a.severity === 'high' || a.severity === 'critical').length}</div>
              <div className="text-xs text-muted">Sharp Alerts</div>
            </div>
            <button onClick={fetchLiveData} disabled={refreshing} className="p-4 rounded-2xl text-center hover:scale-105 transition-all bg-blue-soft">
              <RefreshCw className={`w-5 h-5 mx-auto mb-1 text-blue ${refreshing ? 'animate-spin' : ''}`} />
              <div className="text-xs font-bold text-blue">REFRESH</div>
              <div className="text-xs text-muted">{lastRefresh ? lastRefresh.toLocaleTimeString() : '-'}</div>
            </button>
          </div>
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <button onClick={() => setActiveSport('all')} className={`px-4 py-2 rounded-xl text-sm font-bold ${activeSport === 'all' ? 'btn-gradient-green' : 'bg-white-soft text-muted'}`}>ALL SPORTS</button>
            {SPORTS.map(sport => (
              <button key={sport.key} onClick={() => setActiveSport(sport.key)} className={`px-4 py-2 rounded-xl text-sm font-bold ${activeSport === sport.key ? 'btn-gradient-green' : 'bg-white-soft text-muted'}`}>
                {sport.icon} {sport.key}
              </button>
            ))}
          </div>
        </div>
      </section>
      <div className="max-w-7xl mx-auto px-4 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-20"><RefreshCw className="w-8 h-8 animate-spin text-green" /></div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {filteredLiveGames.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-4"><span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" /><h2 className="text-xl font-bold text-white">LIVE NOW</h2></div>
                  <div className="grid gap-4">
                    {filteredLiveGames.map(game => (
                      <Link key={game.id} href={`/live/${game.id}`} className="block rounded-2xl p-4 hover:scale-[1.02] transition-all card-live-game">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs font-bold px-2 py-1 rounded badge-green">{game.sport} • {game.period} {game.clock}</span>
                          <ExternalLink className="w-4 h-4 text-slate-500" />
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2"><span className="text-white font-bold">{game.awayTeam.name}</span><span className="text-2xl font-black text-green">{game.awayTeam.score}</span></div>
                            <div className="flex items-center gap-3"><span className="text-white font-bold">{game.homeTeam.name}</span><span className="text-2xl font-black text-green">{game.homeTeam.score}</span></div>
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
                          <span className="text-xs font-bold text-green">Track Game →</span>
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
                      <Link key={game.id} href={`/game/${game.id}?sport=${game.sport}`} className="block rounded-xl p-4 hover:bg-slate-800/50 transition-all card-upcoming-game">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <span className="text-xs font-bold px-2 py-1 rounded bg-white-soft text-muted">{game.sport}</span>
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
                <div className="flex items-center gap-2 mb-4"><Bell className="w-5 h-5 text-orange" /><h2 className="text-xl font-bold text-white">EDGE ALERTS</h2></div>
                <div className="flex gap-2 mb-4 flex-wrap">
                  {(['all', 'steam', 'rlm', 'sharp'] as const).map(filter => (
                    <button key={filter} onClick={() => setAlertFilter(filter)} className={`px-3 py-1 rounded-lg text-xs font-bold uppercase ${alertFilter === filter ? 'badge-orange border border-orange-500/30' : 'bg-white-soft text-muted'}`}>{filter}</button>
                  ))}
                </div>
                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                  {filteredAlerts.length > 0 ? filteredAlerts.map(alert => {
                    const classes = getSeverityClasses(alert.severity)
                    return (
                      <div key={alert.id} className={`rounded-xl p-4 ${classes.container}`}>
                        <div className="flex items-start gap-3">
                          <div className={classes.text}>{getTypeIcon(alert.type)}</div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1"><span className={`text-xs font-bold uppercase ${classes.text}`}>{alert.type}</span><span className="text-xs text-slate-500">{alert.timestamp}</span></div>
                            <p className="text-sm text-slate-300">{alert.message}</p>
                            {alert.gameId && <Link href={`/live/${alert.gameId}`} className={`text-xs mt-2 inline-block ${classes.text}`}>View Game →</Link>}
                          </div>
                        </div>
                      </div>
                    )
                  }) : (
                    <div className="text-center py-10 text-slate-500"><Bell className="w-8 h-8 mx-auto mb-2 opacity-30" /><p className="text-sm">No alerts at this time</p></div>
                  )}
                </div>
                <div className="mt-4 p-3 rounded-lg card-alert-bg"><p className="text-xs text-slate-500">Alerts powered by THE EDGE AI • Detecting RLM, steam moves, CLV & arbitrage</p></div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
