'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  User, TrendingUp, Target, DollarSign, Trophy, Settings, Bell,
  BarChart3, Activity, Plus, RefreshCw, ExternalLink, X, ChevronRight,
  Calendar, Clock, Star, Zap, Eye, Play, Pause, Volume2, VolumeX,
  Heart, Bookmark, Filter, Search, ArrowUp, ArrowDown, AlertTriangle,
  CheckCircle, XCircle, Flame, Sparkles, LayoutGrid, List, Maximize2,
  ChevronDown, Globe, Shield, Timer, Award, PieChart, LineChart
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/auth-context'

// ============================================================================
// TYPES
// ============================================================================

interface LiveGame {
  id: string
  gameId: string
  sport: string
  homeTeam: { name: string; abbr: string; logo?: string; score?: number; record?: string }
  awayTeam: { name: string; abbr: string; logo?: string; score?: number; record?: string }
  status: 'scheduled' | 'live' | 'final'
  period?: string
  clock?: string
  startTime: string
  odds?: { spread: string; total: string; homeML: number; awayML: number }
  myBet?: { pick: string; odds: number; amount: number; status: 'pending' | 'won' | 'lost' }
  isFollowed: boolean
}

interface TrackedBet {
  id: string
  gameId: string
  sport: string
  matchup: string
  betType: 'spread' | 'total' | 'ml' | 'prop'
  pick: string
  odds: number
  amount: number
  potentialWin: number
  status: 'pending' | 'won' | 'lost' | 'push'
  placedAt: string
  result?: { score?: string; grade?: string }
}

interface FavoriteTeam {
  id: string
  teamId: string
  sport: string
  name: string
  abbr: string
  logo?: string
  record?: string
  nextGame?: { opponent: string; date: string; isHome: boolean }
}

interface FavoritePlayer {
  id: string
  playerId: string
  sport: string
  name: string
  team: string
  position: string
  headshot?: string
  injuryStatus?: 'healthy' | 'questionable' | 'out'
  recentStats?: string
}

interface UserTrend {
  id: string
  name: string
  sport: string
  record: string
  winRate: number
  roi: number
  streak: number
  lastPick?: { matchup: string; result: 'won' | 'lost' | 'pending' }
}

interface Alert {
  id: string
  type: 'line_move' | 'injury' | 'game_start' | 'bet_result' | 'trend_hit'
  title: string
  message: string
  timestamp: string
  isRead: boolean
  priority: 'high' | 'medium' | 'low'
}

// ============================================================================
// COMPONENT
// ============================================================================

export default function ControlPanelPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const supabase = createClient()

  // View States
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [expandedSection, setExpandedSection] = useState<string | null>(null)
  const [selectedSport, setSelectedSport] = useState<string>('all')
  const [showFilters, setShowFilters] = useState(false)

  // Data States
  const [liveGames, setLiveGames] = useState<LiveGame[]>([])
  const [upcomingGames, setUpcomingGames] = useState<LiveGame[]>([])
  const [trackedBets, setTrackedBets] = useState<TrackedBet[]>([])
  const [favoriteTeams, setFavoriteTeams] = useState<FavoriteTeam[]>([])
  const [favoritePlayers, setFavoritePlayers] = useState<FavoritePlayer[]>([])
  const [trends, setTrends] = useState<UserTrend[]>([])
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  // Stats
  const [stats, setStats] = useState({
    todayRecord: '3-1',
    todayProfit: 245,
    weekRecord: '18-9',
    weekProfit: 1250,
    monthROI: 12.4,
    totalBets: 156,
    winRate: 62.4,
    activeGames: 3,
    pendingBets: 5,
    streak: 4,
    isWinStreak: true
  })

  // Auto-refresh for live games
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  const fetchAllData = useCallback(async (showRefresh = false) => {
    if (!user) return
    if (showRefresh) setRefreshing(true)
    else setLoading(true)

    try {
      // Fetch live games from API
      const gamesRes = await fetch('/api/games?status=live,scheduled&limit=20')
      const gamesData = await gamesRes.json()

      // Transform to our format with bet tracking
      const games: LiveGame[] = (gamesData.games || []).map((g: Record<string, unknown>) => ({
        id: g.id,
        gameId: g.id,
        sport: g.sport || 'NFL',
        homeTeam: {
          name: (g.home as Record<string, unknown>)?.name || 'Home',
          abbr: (g.home as Record<string, unknown>)?.abbreviation || 'HOM',
          logo: (g.home as Record<string, unknown>)?.logo,
          score: (g.home as Record<string, unknown>)?.score,
          record: (g.home as Record<string, unknown>)?.record
        },
        awayTeam: {
          name: (g.away as Record<string, unknown>)?.name || 'Away',
          abbr: (g.away as Record<string, unknown>)?.abbreviation || 'AWY',
          logo: (g.away as Record<string, unknown>)?.logo,
          score: (g.away as Record<string, unknown>)?.score,
          record: (g.away as Record<string, unknown>)?.record
        },
        status: g.status === 'in_progress' ? 'live' : (g.status as 'scheduled' | 'live' | 'final'),
        period: g.period as string,
        clock: g.clock as string,
        startTime: g.startTime as string,
        odds: g.odds as LiveGame['odds'],
        isFollowed: false
      }))

      const live = games.filter(g => g.status === 'live')
      const upcoming = games.filter(g => g.status === 'scheduled').slice(0, 10)

      setLiveGames(live)
      setUpcomingGames(upcoming)

      // Fetch user's bets
      const { data: betsData } = await supabase
        .from('user_bets')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20)

      if (betsData) {
        setTrackedBets(betsData.map((b: Record<string, unknown>) => ({
          id: b.id as string,
          gameId: b.game_id as string,
          sport: b.sport as string || 'NFL',
          matchup: b.matchup as string || '',
          betType: b.bet_type as TrackedBet['betType'] || 'spread',
          pick: b.pick as string || '',
          odds: b.odds as number || -110,
          amount: b.amount as number || 100,
          potentialWin: b.potential_win as number || 91,
          status: b.status as TrackedBet['status'] || 'pending',
          placedAt: b.created_at as string
        })))
      }

      // Fetch favorite teams
      const { data: teamsData } = await supabase
        .from('user_favorite_teams')
        .select('*')
        .eq('user_id', user.id)

      if (teamsData) {
        setFavoriteTeams(teamsData.map((t: Record<string, unknown>) => ({
          id: t.id as string,
          teamId: t.team_id as string,
          sport: t.sport as string,
          name: t.team_name as string,
          abbr: t.team_abbr as string,
          logo: t.team_logo as string
        })))
      }

      // Fetch favorite players
      const { data: playersData } = await supabase
        .from('user_favorite_players')
        .select('*')
        .eq('user_id', user.id)

      if (playersData) {
        setFavoritePlayers(playersData.map((p: Record<string, unknown>) => ({
          id: p.id as string,
          playerId: p.player_id as string,
          sport: p.sport as string,
          name: p.player_name as string,
          team: p.team_name as string || '',
          position: p.position as string || '',
          headshot: p.headshot_url as string
        })))
      }

      // Fetch user systems/trends
      const trendsRes = await fetch('/api/user/systems')
      const trendsData = await trendsRes.json()

      if (trendsData.systems) {
        setTrends(trendsData.systems.slice(0, 6).map((s: Record<string, unknown>) => {
          const sStats = (s.stats as Record<string, unknown>) || {}
          return {
            id: s.id as string,
            name: s.name as string,
            sport: (s.sport as string || 'nfl').toUpperCase(),
            record: sStats.record as string || '0-0',
            winRate: sStats.winPct as number || 0,
            roi: sStats.roi as number || 0,
            streak: 0
          }
        }))
      }

      // Fetch alerts
      const { data: alertsData } = await supabase
        .from('user_alerts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10)

      if (alertsData) {
        setAlerts(alertsData.map((a: Record<string, unknown>) => ({
          id: a.id as string,
          type: a.alert_type as Alert['type'],
          title: a.title as string,
          message: a.message as string,
          timestamp: a.created_at as string,
          isRead: a.is_read as boolean,
          priority: 'medium' as Alert['priority']
        })))
      }

    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [user, supabase])

  // ============================================================================
  // EFFECTS
  // ============================================================================

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth?redirect=/control-panel')
      return
    }
    if (user) {
      fetchAllData()
    }
  }, [user, authLoading, router, fetchAllData])

  // Auto-refresh live games every 30 seconds
  useEffect(() => {
    if (liveGames.length > 0) {
      refreshIntervalRef.current = setInterval(() => {
        fetchAllData(false)
      }, 30000)
    }

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current)
      }
    }
  }, [liveGames.length, fetchAllData])

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleDismissAlert = async (alertId: string) => {
    await supabase.from('user_alerts').delete().eq('id', alertId)
    setAlerts(prev => prev.filter(a => a.id !== alertId))
  }

  // ============================================================================
  // RENDER HELPERS
  // ============================================================================

  const formatOdds = (odds: number) => {
    return odds > 0 ? `+${odds}` : odds.toString()
  }

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  }

  // ============================================================================
  // LOADING STATE
  // ============================================================================

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#06060c] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center animate-pulse">
            <Zap className="w-8 h-8 text-white" />
          </div>
          <p className="text-slate-400">Loading your control panel...</p>
        </div>
      </div>
    )
  }

  if (!user) return null

  // ============================================================================
  // MAIN RENDER
  // ============================================================================

  const unreadAlerts = alerts.filter(a => !a.isRead).length
  const pendingBets = trackedBets.filter(b => b.status === 'pending')
  const todayWins = trackedBets.filter(b => b.status === 'won').length
  const todayLosses = trackedBets.filter(b => b.status === 'lost').length

  return (
    <div className="min-h-screen bg-[#06060c]">
      {/* ================================================================== */}
      {/* HEADER - Fixed Top Bar */}
      {/* ================================================================== */}
      <header className="sticky top-0 z-50 bg-[#06060c]/95 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-[1800px] mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Left - Logo & Title */}
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center">
                <LayoutGrid className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white flex items-center gap-2">
                  Control Panel
                  {liveGames.length > 0 && (
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 text-xs font-bold animate-pulse">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                      {liveGames.length} LIVE
                    </span>
                  )}
                </h1>
                <p className="text-xs text-slate-500">Everything in one view</p>
              </div>
            </div>

            {/* Center - Quick Stats */}
            <div className="hidden lg:flex items-center gap-6">
              <div className="text-center">
                <p className="text-xs text-slate-500">Today</p>
                <p className="text-sm font-bold text-white">{todayWins}-{todayLosses}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-slate-500">Profit</p>
                <p className={`text-sm font-bold ${stats.todayProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {stats.todayProfit >= 0 ? '+' : ''}${stats.todayProfit}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-slate-500">Win Rate</p>
                <p className="text-sm font-bold text-orange-400">{stats.winRate}%</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-slate-500">Streak</p>
                <p className={`text-sm font-bold flex items-center gap-1 ${stats.isWinStreak ? 'text-green-400' : 'text-red-400'}`}>
                  {stats.isWinStreak ? <Flame className="w-3 h-3" /> : null}
                  {stats.streak}W
                </p>
              </div>
            </div>

            {/* Right - Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => fetchAllData(true)}
                disabled={refreshing}
                className="p-2 rounded-lg bg-slate-800/50 text-slate-400 hover:text-white hover:bg-slate-800 transition-all disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
              <button className="p-2 rounded-lg bg-slate-800/50 text-slate-400 hover:text-white hover:bg-slate-800 transition-all relative">
                <Bell className="w-4 h-4" />
                {unreadAlerts > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-[10px] text-white flex items-center justify-center font-bold">
                    {unreadAlerts}
                  </span>
                )}
              </button>
              <Link href="/dashboard/settings" className="p-2 rounded-lg bg-slate-800/50 text-slate-400 hover:text-white hover:bg-slate-800 transition-all">
                <Settings className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* ================================================================== */}
      {/* MAIN CONTENT */}
      {/* ================================================================== */}
      <main className="max-w-[1800px] mx-auto p-4">
        {/* ============================================================== */}
        {/* ROW 1: Live Games + Pending Bets */}
        {/* ============================================================== */}
        <div className="grid lg:grid-cols-3 gap-4 mb-4">
          {/* Live Games - Takes 2 cols */}
          <div className="lg:col-span-2 rounded-2xl bg-gradient-to-br from-red-950/30 via-slate-900 to-slate-900 border border-red-500/20 overflow-hidden">
            <div className="p-4 border-b border-red-500/10 flex items-center justify-between">
              <h2 className="font-bold text-white flex items-center gap-2">
                <Activity className="w-5 h-5 text-red-400" />
                Live Games
                <span className="text-xs text-red-400 font-normal">Auto-refreshing</span>
              </h2>
              <Link href="/live" className="text-xs text-slate-400 hover:text-white flex items-center gap-1">
                View All <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            
            <div className="p-4">
              {liveGames.length > 0 ? (
                <div className="grid sm:grid-cols-2 gap-3">
                  {liveGames.slice(0, 4).map(game => (
                    <Link
                      key={game.id}
                      href={`/live/${game.gameId}?sport=${game.sport}`}
                      className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/50 hover:border-red-500/30 transition-all group"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="px-2 py-0.5 rounded text-xs font-bold bg-red-500/20 text-red-400">
                          {game.period} {game.clock}
                        </span>
                        <span className="text-xs text-slate-500">{game.sport}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {game.awayTeam.logo && <img src={game.awayTeam.logo} alt="" className="w-6 h-6" />}
                          <span className="text-sm text-white">{game.awayTeam.abbr}</span>
                        </div>
                        <span className="text-lg font-bold text-white">{game.awayTeam.score || 0}</span>
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <div className="flex items-center gap-2">
                          {game.homeTeam.logo && <img src={game.homeTeam.logo} alt="" className="w-6 h-6" />}
                          <span className="text-sm text-white">{game.homeTeam.abbr}</span>
                        </div>
                        <span className="text-lg font-bold text-white">{game.homeTeam.score || 0}</span>
                      </div>
                      {game.myBet && (
                        <div className="mt-2 pt-2 border-t border-slate-700 flex items-center justify-between">
                          <span className="text-xs text-orange-400">My Bet: {game.myBet.pick}</span>
                          <span className="text-xs text-slate-400">${game.myBet.amount}</span>
                        </div>
                      )}
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Clock className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                  <p className="text-slate-500 text-sm">No live games right now</p>
                  <p className="text-slate-600 text-xs mt-1">Check back during game times</p>
                </div>
              )}
            </div>
          </div>

          {/* Pending Bets */}
          <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <h2 className="font-bold text-white flex items-center gap-2">
                <Target className="w-5 h-5 text-orange-400" />
                Pending Bets
                <span className="px-1.5 py-0.5 rounded-full bg-orange-500/20 text-orange-400 text-xs">
                  {pendingBets.length}
                </span>
              </h2>
              <Link href="/my-picks" className="text-xs text-slate-400 hover:text-white flex items-center gap-1">
                All Bets <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            
            <div className="p-4 max-h-[300px] overflow-y-auto space-y-2">
              {pendingBets.length > 0 ? (
                pendingBets.map(bet => (
                  <div key={bet.id} className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-slate-500">{bet.sport}</span>
                      <span className="text-xs text-slate-400">{formatOdds(bet.odds)}</span>
                    </div>
                    <p className="text-sm font-medium text-white truncate">{bet.pick}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-slate-400">${bet.amount} to win ${bet.potentialWin}</span>
                      <span className="px-2 py-0.5 rounded text-xs bg-yellow-500/20 text-yellow-400">Pending</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6">
                  <Target className="w-6 h-6 text-slate-600 mx-auto mb-2" />
                  <p className="text-slate-500 text-sm">No pending bets</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ============================================================== */}
        {/* ROW 2: Upcoming Games + Teams + Players */}
        {/* ============================================================== */}
        <div className="grid lg:grid-cols-3 gap-4 mb-4">
          {/* Upcoming Games */}
          <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <h2 className="font-bold text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-400" />
                Upcoming
              </h2>
              <Link href="/scores" className="text-xs text-slate-400 hover:text-white flex items-center gap-1">
                Schedule <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            
            <div className="p-4 max-h-[280px] overflow-y-auto space-y-2">
              {upcomingGames.slice(0, 5).map(game => (
                <Link
                  key={game.id}
                  href={`/game/${game.gameId}?sport=${game.sport}`}
                  className="block p-3 rounded-lg bg-slate-800/30 hover:bg-slate-800/50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-slate-500">{game.sport}</span>
                    <span className="text-xs text-slate-400">{formatTime(game.startTime)}</span>
                  </div>
                  <p className="text-sm text-white">
                    {game.awayTeam.abbr} @ {game.homeTeam.abbr}
                  </p>
                </Link>
              ))}
            </div>
          </div>

          {/* Favorite Teams */}
          <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <h2 className="font-bold text-white flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-400" />
                My Teams
                <span className="text-xs text-slate-500 font-normal">{favoriteTeams.length}</span>
              </h2>
              <button className="text-xs text-slate-400 hover:text-white flex items-center gap-1">
                Manage <ChevronRight className="w-3 h-3" />
              </button>
            </div>
            
            <div className="p-4 max-h-[280px] overflow-y-auto">
              {favoriteTeams.length > 0 ? (
                <div className="grid grid-cols-3 gap-2">
                  {favoriteTeams.slice(0, 9).map(team => (
                    <Link
                      key={team.id}
                      href={`/${team.sport.toLowerCase()}/teams/${team.teamId}`}
                      className="p-2 rounded-lg bg-slate-800/30 hover:bg-slate-800/50 transition-colors text-center"
                    >
                      {team.logo && <img src={team.logo} alt="" className="w-8 h-8 mx-auto mb-1" />}
                      <p className="text-xs text-white font-medium">{team.abbr}</p>
                      {team.record && <p className="text-[10px] text-slate-500">{team.record}</p>}
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <Star className="w-6 h-6 text-slate-600 mx-auto mb-2" />
                  <p className="text-slate-500 text-sm">No favorite teams</p>
                  <p className="text-slate-600 text-xs mt-1">Star teams to track them here</p>
                </div>
              )}
            </div>
          </div>

          {/* Favorite Players */}
          <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <h2 className="font-bold text-white flex items-center gap-2">
                <User className="w-5 h-5 text-purple-400" />
                My Players
                <span className="text-xs text-slate-500 font-normal">{favoritePlayers.length}</span>
              </h2>
              <button className="text-xs text-slate-400 hover:text-white flex items-center gap-1">
                Manage <ChevronRight className="w-3 h-3" />
              </button>
            </div>
            
            <div className="p-4 max-h-[280px] overflow-y-auto space-y-2">
              {favoritePlayers.length > 0 ? (
                favoritePlayers.slice(0, 5).map(player => (
                  <Link
                    key={player.id}
                    href={`/${player.sport.toLowerCase()}/players/${player.playerId}`}
                    className="flex items-center gap-3 p-2 rounded-lg bg-slate-800/30 hover:bg-slate-800/50 transition-colors"
                  >
                    {player.headshot ? (
                      <img src={player.headshot} alt="" className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center">
                        <User className="w-5 h-5 text-slate-500" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white font-medium truncate">{player.name}</p>
                      <p className="text-xs text-slate-500">{player.team} • {player.position}</p>
                    </div>
                    {player.injuryStatus && player.injuryStatus !== 'healthy' && (
                      <span className={`px-2 py-0.5 rounded text-xs ${
                        player.injuryStatus === 'out' ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {player.injuryStatus}
                      </span>
                    )}
                  </Link>
                ))
              ) : (
                <div className="text-center py-6">
                  <User className="w-6 h-6 text-slate-600 mx-auto mb-2" />
                  <p className="text-slate-500 text-sm">No favorite players</p>
                  <p className="text-slate-600 text-xs mt-1">Star players to track them here</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ============================================================== */}
        {/* ROW 3: Trends/Systems + Alerts + Performance */}
        {/* ============================================================== */}
        <div className="grid lg:grid-cols-3 gap-4">
          {/* My Trends/Systems */}
          <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <h2 className="font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-cyan-400" />
                My Systems
                <span className="text-xs text-slate-500 font-normal">{trends.length}</span>
              </h2>
              <Link href="/systems" className="text-xs text-slate-400 hover:text-white flex items-center gap-1">
                Create <Plus className="w-3 h-3" />
              </Link>
            </div>
            
            <div className="p-4 max-h-[280px] overflow-y-auto space-y-2">
              {trends.length > 0 ? (
                trends.map(trend => (
                  <Link
                    key={trend.id}
                    href={`/dashboard/systems/${trend.id}`}
                    className="block p-3 rounded-lg bg-slate-800/30 hover:bg-slate-800/50 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-white">{trend.name}</span>
                      <span className="text-xs text-slate-500">{trend.sport}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-xs text-slate-400">{trend.record}</span>
                      <span className={`text-xs ${trend.winRate >= 55 ? 'text-green-400' : 'text-slate-400'}`}>
                        {trend.winRate.toFixed(1)}%
                      </span>
                      <span className={`text-xs ${trend.roi >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {trend.roi >= 0 ? '+' : ''}{trend.roi.toFixed(1)}% ROI
                      </span>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="text-center py-6">
                  <Sparkles className="w-6 h-6 text-slate-600 mx-auto mb-2" />
                  <p className="text-slate-500 text-sm">No systems yet</p>
                  <Link href="/trend-finder" className="text-cyan-400 text-xs mt-1 hover:underline">
                    Create your first trend →
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Alerts */}
          <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <h2 className="font-bold text-white flex items-center gap-2">
                <Bell className="w-5 h-5 text-yellow-400" />
                Alerts
                {unreadAlerts > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-400 text-xs">
                    {unreadAlerts} new
                  </span>
                )}
              </h2>
              <Link href="/alerts" className="text-xs text-slate-400 hover:text-white flex items-center gap-1">
                View All <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            
            <div className="p-4 max-h-[280px] overflow-y-auto space-y-2">
              {alerts.length > 0 ? (
                alerts.slice(0, 5).map(alert => (
                  <div
                    key={alert.id}
                    className={`p-3 rounded-lg border transition-colors ${
                      alert.isRead ? 'bg-slate-800/30 border-slate-700/50' : 'bg-slate-800/50 border-yellow-500/30'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white">{alert.title}</p>
                        <p className="text-xs text-slate-400 mt-0.5 truncate">{alert.message}</p>
                      </div>
                      <button
                        onClick={() => handleDismissAlert(alert.id)}
                        className="text-slate-500 hover:text-white p-1"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6">
                  <Bell className="w-6 h-6 text-slate-600 mx-auto mb-2" />
                  <p className="text-slate-500 text-sm">No alerts</p>
                  <p className="text-slate-600 text-xs mt-1">You&apos;re all caught up!</p>
                </div>
              )}
            </div>
          </div>

          {/* Quick Stats / Performance */}
          <div className="rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 overflow-hidden">
            <div className="p-4 border-b border-slate-800">
              <h2 className="font-bold text-white flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-green-400" />
                Performance
              </h2>
            </div>
            
            <div className="p-4 space-y-4">
              {/* This Week */}
              <div>
                <p className="text-xs text-slate-500 mb-2">This Week</p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-3 rounded-lg bg-slate-800/30">
                    <p className="text-2xl font-bold text-white">{stats.weekRecord}</p>
                    <p className="text-xs text-slate-500">Record</p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-800/30">
                    <p className={`text-2xl font-bold ${stats.weekProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {stats.weekProfit >= 0 ? '+' : ''}${stats.weekProfit}
                    </p>
                    <p className="text-xs text-slate-500">Profit</p>
                  </div>
                </div>
              </div>

              {/* All Time */}
              <div>
                <p className="text-xs text-slate-500 mb-2">All Time</p>
                <div className="grid grid-cols-3 gap-2">
                  <div className="p-2 rounded-lg bg-slate-800/30 text-center">
                    <p className="text-lg font-bold text-white">{stats.totalBets}</p>
                    <p className="text-[10px] text-slate-500">Bets</p>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-800/30 text-center">
                    <p className="text-lg font-bold text-orange-400">{stats.winRate}%</p>
                    <p className="text-[10px] text-slate-500">Win Rate</p>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-800/30 text-center">
                    <p className={`text-lg font-bold ${stats.monthROI >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {stats.monthROI >= 0 ? '+' : ''}{stats.monthROI}%
                    </p>
                    <p className="text-[10px] text-slate-500">Month ROI</p>
                  </div>
                </div>
              </div>

              <Link
                href="/performance/clv"
                className="block w-full p-2 rounded-lg bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 text-center text-sm text-cyan-400 hover:border-cyan-400 transition-colors"
              >
                View Full Analytics →
              </Link>
            </div>
          </div>
        </div>

        {/* ============================================================== */}
        {/* QUICK ACTION FAB */}
        {/* ============================================================== */}
        <div className="fixed bottom-6 right-6 flex flex-col gap-2">
          <Link
            href="/trend-finder"
            className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center shadow-lg shadow-cyan-500/25 hover:scale-105 transition-transform"
            title="AI Trend Finder"
          >
            <Sparkles className="w-5 h-5 text-white" />
          </Link>
          <Link
            href="/my-picks"
            className="w-14 h-14 rounded-full bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center shadow-lg shadow-orange-500/25 hover:scale-105 transition-transform"
            title="Track New Bet"
          >
            <Plus className="w-6 h-6 text-white" />
          </Link>
        </div>
      </main>
    </div>
  )
}
