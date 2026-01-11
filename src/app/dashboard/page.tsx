'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  User, TrendingUp, Target, DollarSign, Trophy, Settings, Bell,
  BarChart3, Activity, Plus, RefreshCw, ExternalLink, X
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/auth-context'
import { GamesWidget, TeamsWidget, PlayersWidget, TrendsWidget, AlertsWidget } from '@/components/dashboard'

// Types
interface FollowedGame {
  id: string
  gameId: string
  sport: string
  homeTeamName: string
  awayTeamName: string
  homeTeamLogo?: string
  awayTeamLogo?: string
  scheduledAt: string
  status: 'scheduled' | 'in_progress' | 'final'
  homeScore?: number
  awayScore?: number
  spread?: string
  total?: string
  notificationsEnabled: boolean
  betPlaced: boolean
  betDetails?: {
    type: string
    selection: string
    odds: string
    stake?: number
  }
  notes?: string
}

interface FavoriteTeam {
  id: string
  sport: string
  teamId: string
  teamName: string
  teamLogo?: string
  teamAbbr?: string
  record?: string
  standing?: string
  nextGame?: {
    opponent: string
    date: string
    isHome: boolean
  }
  notificationsEnabled: boolean
}

interface FavoritePlayer {
  id: string
  sport: string
  playerId: string
  playerName: string
  teamId?: string
  teamName?: string
  teamLogo?: string
  position?: string
  jerseyNumber?: string
  headshotUrl?: string
  stats?: { label: string; value: string }[]
  recentNews?: { title: string; date: string }
  injuryStatus?: 'healthy' | 'questionable' | 'doubtful' | 'out' | 'ir'
  notificationsEnabled: boolean
}

interface UserSystem {
  id: string
  name: string
  description?: string
  sport: string
  criteria: string[]
  totalPicks: number
  wins: number
  losses: number
  pushes: number
  winRate: number
  roi: number
  streak: number
  isStreakWin: boolean
  createdAt: string
  updatedAt: string
  isPublished: boolean
  marketplaceListing?: {
    id: string
    status: 'active' | 'paused' | 'removed'
    isFree: boolean
    priceCents: number
    views: number
    likes: number
    copies: number
  }
}

interface Alert {
  id: string
  alertType: 'game_start' | 'line_move' | 'injury' | 'score_update' | 'system_hit' | 'player_news'
  entityType: 'game' | 'team' | 'player' | 'system'
  entityId: string
  title: string
  message: string
  data?: Record<string, unknown>
  isRead: boolean
  createdAt: string
}

interface DashboardStats {
  totalBets: number
  wins: number
  losses: number
  winRate: number
  totalProfit: number
  roi: number
  favoriteTeams: number
  favoritePlayers: number
  followedGames: number
  savedSystems: number
  unreadAlerts: number
}

interface SiteSettings {
  marketplaceMonetizationEnabled: boolean
}

export default function DashboardPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const supabase = createClient()
  
  // State
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [followedGames, setFollowedGames] = useState<FollowedGame[]>([])
  const [favoriteTeams, setFavoriteTeams] = useState<FavoriteTeam[]>([])
  const [favoritePlayers, setFavoritePlayers] = useState<FavoritePlayer[]>([])
  const [systems, setSystems] = useState<UserSystem[]>([])
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [siteSettings, setSiteSettings] = useState<SiteSettings>({ marketplaceMonetizationEnabled: false })
  const [showAddBet, setShowAddBet] = useState(false)

  // Fetch all dashboard data
  const fetchDashboardData = useCallback(async (showRefreshing = false) => {
    if (!user) return
    
    if (showRefreshing) setRefreshing(true)
    else setLoading(true)
    
    try {
      // Fetch all data in parallel
      const [
        gamesRes,
        teamsRes,
        playersRes,
        systemsRes,
        alertsRes,
        settingsRes
      ] = await Promise.all([
        // Followed games
        supabase
          .from('user_followed_games')
          .select('*')
          .eq('user_id', user.id)
          .order('scheduled_at', { ascending: true }),
        
        // Favorite teams
        supabase
          .from('user_favorite_teams')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
        
        // Favorite players
        supabase
          .from('user_favorite_players')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
        
        // User systems
        fetch('/api/user/systems').then(r => r.ok ? r.json() : { systems: [] }),
        
        // Alerts
        supabase
          .from('user_alerts')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(50),
        
        // Site settings
        supabase
          .from('site_settings')
          .select('marketplace_monetization_enabled')
          .single()
      ])

      // Transform followed games
      const games: FollowedGame[] = (gamesRes.data || []).map((g: Record<string, unknown>) => ({
        id: g.id as string,
        gameId: g.game_id as string,
        sport: g.sport as string,
        homeTeamName: g.home_team_name as string,
        awayTeamName: g.away_team_name as string,
        homeTeamLogo: g.home_team_logo as string | undefined,
        awayTeamLogo: g.away_team_logo as string | undefined,
        scheduledAt: g.scheduled_at as string,
        status: (g.status as 'scheduled' | 'in_progress' | 'final') || 'scheduled',
        notificationsEnabled: g.notifications_enabled as boolean,
        betPlaced: g.bet_placed as boolean,
        betDetails: g.bet_details as FollowedGame['betDetails'],
        notes: g.notes as string | undefined,
      }))

      // Transform favorite teams
      const teams: FavoriteTeam[] = (teamsRes.data || []).map((t: Record<string, unknown>) => ({
        id: t.id as string,
        sport: t.sport as string,
        teamId: t.team_id as string,
        teamName: t.team_name as string,
        teamLogo: t.team_logo as string | undefined,
        teamAbbr: t.team_abbr as string | undefined,
        notificationsEnabled: t.notifications_enabled !== false,
      }))

      // Transform favorite players
      const players: FavoritePlayer[] = (playersRes.data || []).map((p: Record<string, unknown>) => ({
        id: p.id as string,
        sport: p.sport as string,
        playerId: p.player_id as string,
        playerName: p.player_name as string,
        teamId: p.team_id as string | undefined,
        teamName: p.team_name as string | undefined,
        teamLogo: p.team_logo as string | undefined,
        position: p.position as string | undefined,
        jerseyNumber: p.jersey_number as string | undefined,
        headshotUrl: p.headshot_url as string | undefined,
        notificationsEnabled: p.notifications_enabled !== false,
      }))

      // Transform systems
      const userSystems: UserSystem[] = (systemsRes.systems || []).map((s: Record<string, unknown>) => {
        const sysStats = s.stats as Record<string, unknown> || {}
        const record = (sysStats.record as string) || '0-0-0'
        const [wins, losses, pushes] = record.split('-').map(Number)
        const totalPicks = wins + losses + pushes
        
        return {
          id: s.id as string,
          name: s.name as string,
          description: s.description as string | undefined,
          sport: (s.sport as string).toUpperCase(),
          criteria: s.criteria as string[] || [],
          totalPicks,
          wins,
          losses,
          pushes,
          winRate: sysStats.winPct as number || 0,
          roi: sysStats.roi as number || 0,
          streak: 0,
          isStreakWin: true,
          createdAt: s.created_at as string,
          updatedAt: s.updated_at as string || s.created_at as string,
          isPublished: s.is_public as boolean,
          marketplaceListing: s.marketplace_listing as UserSystem['marketplaceListing'],
        }
      })

      // Transform alerts
      const userAlerts: Alert[] = (alertsRes.data || []).map((a: Record<string, unknown>) => ({
        id: a.id as string,
        alertType: a.alert_type as Alert['alertType'],
        entityType: a.entity_type as Alert['entityType'],
        entityId: a.entity_id as string,
        title: a.title as string,
        message: a.message as string,
        data: a.data as Record<string, unknown> | undefined,
        isRead: a.is_read as boolean,
        createdAt: a.created_at as string,
      }))

      // Fetch betting stats
      const { data: bettingStats } = await supabase
        .rpc('get_user_betting_stats', { p_user_id: user.id })

      const betStats = bettingStats?.[0] || {}

      // Calculate dashboard stats
      const dashStats: DashboardStats = {
        totalBets: betStats.total_bets || 0,
        wins: betStats.wins || 0,
        losses: betStats.losses || 0,
        winRate: betStats.win_rate || 0,
        totalProfit: betStats.total_profit || 0,
        roi: betStats.roi || 0,
        favoriteTeams: teams.length,
        favoritePlayers: players.length,
        followedGames: games.length,
        savedSystems: userSystems.length,
        unreadAlerts: userAlerts.filter(a => !a.isRead).length,
      }

      setFollowedGames(games)
      setFavoriteTeams(teams)
      setFavoritePlayers(players)
      setSystems(userSystems)
      setAlerts(userAlerts)
      setStats(dashStats)
      setSiteSettings({
        marketplaceMonetizationEnabled: settingsRes.data?.marketplace_monetization_enabled || false
      })
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [user, supabase])

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth?redirect=/dashboard')
    } else if (user) {
      fetchDashboardData()
    }
  }, [user, authLoading, router, fetchDashboardData])

  // Handler functions
  const handleToggleGameFollow = async (gameId: string) => {
    if (!user) return
    try {
      await supabase
        .from('user_followed_games')
        .delete()
        .eq('user_id', user.id)
        .eq('game_id', gameId)
      setFollowedGames(prev => prev.filter(g => g.gameId !== gameId))
    } catch (error) {
      console.error('Error unfollowing game:', error)
    }
  }

  const handleToggleGameNotifications = async (gameId: string) => {
    if (!user) return
    try {
      const game = followedGames.find(g => g.gameId === gameId)
      if (!game) return
      
      await supabase
        .from('user_followed_games')
        .update({ notifications_enabled: !game.notificationsEnabled })
        .eq('user_id', user.id)
        .eq('game_id', gameId)
      
      setFollowedGames(prev => prev.map(g => 
        g.gameId === gameId ? { ...g, notificationsEnabled: !g.notificationsEnabled } : g
      ))
    } catch (error) {
      console.error('Error toggling notifications:', error)
    }
  }

  const handleAddBetToGame = async (gameId: string, betDetails: FollowedGame['betDetails']) => {
    if (!user || !betDetails) return
    try {
      await supabase
        .from('user_followed_games')
        .update({ bet_placed: true, bet_details: betDetails })
        .eq('user_id', user.id)
        .eq('game_id', gameId)
      
      setFollowedGames(prev => prev.map(g => 
        g.gameId === gameId ? { ...g, betPlaced: true, betDetails } : g
      ))
    } catch (error) {
      console.error('Error adding bet:', error)
    }
  }

  const handleAddGameNote = async (gameId: string, note: string) => {
    if (!user) return
    try {
      await supabase
        .from('user_followed_games')
        .update({ notes: note })
        .eq('user_id', user.id)
        .eq('game_id', gameId)
      
      setFollowedGames(prev => prev.map(g => 
        g.gameId === gameId ? { ...g, notes: note } : g
      ))
    } catch (error) {
      console.error('Error adding note:', error)
    }
  }

  const handleToggleTeamFavorite = async (teamId: string, sport: string) => {
    if (!user) return
    try {
      await supabase
        .from('user_favorite_teams')
        .delete()
        .eq('user_id', user.id)
        .eq('team_id', teamId)
        .eq('sport', sport)
      setFavoriteTeams(prev => prev.filter(t => !(t.teamId === teamId && t.sport === sport)))
    } catch (error) {
      console.error('Error removing favorite team:', error)
    }
  }

  const handleToggleTeamNotifications = async (teamId: string) => {
    if (!user) return
    try {
      const team = favoriteTeams.find(t => t.teamId === teamId)
      if (!team) return
      
      await supabase
        .from('user_favorite_teams')
        .update({ notifications_enabled: !team.notificationsEnabled })
        .eq('user_id', user.id)
        .eq('team_id', teamId)
      
      setFavoriteTeams(prev => prev.map(t => 
        t.teamId === teamId ? { ...t, notificationsEnabled: !t.notificationsEnabled } : t
      ))
    } catch (error) {
      console.error('Error toggling notifications:', error)
    }
  }

  const handleTogglePlayerFavorite = async (playerId: string, sport: string) => {
    if (!user) return
    try {
      await supabase
        .from('user_favorite_players')
        .delete()
        .eq('user_id', user.id)
        .eq('player_id', playerId)
        .eq('sport', sport)
      setFavoritePlayers(prev => prev.filter(p => !(p.playerId === playerId && p.sport === sport)))
    } catch (error) {
      console.error('Error removing favorite player:', error)
    }
  }

  const handleTogglePlayerNotifications = async (playerId: string) => {
    if (!user) return
    try {
      const player = favoritePlayers.find(p => p.playerId === playerId)
      if (!player) return
      
      await supabase
        .from('user_favorite_players')
        .update({ notifications_enabled: !player.notificationsEnabled })
        .eq('user_id', user.id)
        .eq('player_id', playerId)
      
      setFavoritePlayers(prev => prev.map(p => 
        p.playerId === playerId ? { ...p, notificationsEnabled: !p.notificationsEnabled } : p
      ))
    } catch (error) {
      console.error('Error toggling notifications:', error)
    }
  }

  const handleDeleteSystem = async (systemId: string) => {
    try {
      const response = await fetch(`/api/user/systems/${systemId}`, { method: 'DELETE' })
      if (response.ok) {
        setSystems(prev => prev.filter(s => s.id !== systemId))
      }
    } catch (error) {
      console.error('Error deleting system:', error)
    }
  }

  const handlePublishSystem = async (systemId: string) => {
    const system = systems.find(s => s.id === systemId)
    if (!system) return

    const title = prompt('Enter a title for your marketplace listing:', system.name)
    if (!title) return

    const description = prompt('Enter a short description:')
    if (!description) return

    // Price workflow (only if monetization enabled)
    let priceCents = 0
    let isFree = true
    if (siteSettings.marketplaceMonetizationEnabled) {
      const priceStr = prompt('Enter price in USD (or 0 for free):', '0')
      if (priceStr === null) return
      const priceNum = parseFloat(priceStr) || 0
      priceCents = Math.round(priceNum * 100)
      isFree = priceCents === 0
    }

    try {
      const response = await fetch('/api/marketplace', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_id: systemId,
          title,
          short_description: description,
          tags: [system.sport],
          is_free: isFree,
          price_cents: priceCents
        })
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Failed to publish')

      setSystems(prev => prev.map(s => 
        s.id === systemId ? { ...s, isPublished: true } : s
      ))
      alert('System published to marketplace!')
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to publish')
    }
  }

  const handleUnpublishSystem = async (systemId: string) => {
    if (!confirm('Remove this system from the marketplace?')) return
    try {
      const response = await fetch(`/api/marketplace/${systemId}`, { method: 'DELETE' })
      if (response.ok) {
        setSystems(prev => prev.map(s => 
          s.id === systemId ? { ...s, isPublished: false, marketplaceListing: undefined } : s
        ))
      }
    } catch (error) {
      console.error('Error unpublishing:', error)
    }
  }

  const handleMarkAlertAsRead = async (alertId: string) => {
    if (!user) return
    try {
      await supabase
        .from('user_alerts')
        .update({ is_read: true })
        .eq('id', alertId)
        .eq('user_id', user.id)
      
      setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, isRead: true } : a))
    } catch (error) {
      console.error('Error marking alert as read:', error)
    }
  }

  const handleMarkAllAlertsAsRead = async () => {
    if (!user) return
    try {
      await supabase
        .from('user_alerts')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false)
      
      setAlerts(prev => prev.map(a => ({ ...a, isRead: true })))
    } catch (error) {
      console.error('Error marking all alerts as read:', error)
    }
  }

  const handleDismissAlert = async (alertId: string) => {
    if (!user) return
    try {
      await supabase
        .from('user_alerts')
        .delete()
        .eq('id', alertId)
        .eq('user_id', user.id)
      
      setAlerts(prev => prev.filter(a => a.id !== alertId))
    } catch (error) {
      console.error('Error dismissing alert:', error)
    }
  }

  // Loading state
  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="text-center">
          <div className="animate-spin w-10 h-10 border-2 border-orange-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-slate-400">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/95 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br from-orange-500 to-pink-500">
                <User className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">
                  Welcome back{user.user_metadata?.username ? `, ${user.user_metadata.username}` : ''}!
                </h1>
                <p className="text-sm text-slate-400">Your betting control panel</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => fetchDashboardData(true)}
                disabled={refreshing}
                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors disabled:opacity-50"
                title="Refresh data"
              >
                <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
              <Link href="/dashboard/notifications" className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors relative">
                <Bell className="w-5 h-5" />
                {stats && stats.unreadAlerts > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                )}
              </Link>
              <Link href="/dashboard/settings" className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
                <Settings className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Quick Stats Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 mb-6">
          <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700">
            <div className="flex items-center gap-2 mb-1">
              <Trophy className="w-4 h-4 text-yellow-400" />
              <span className="text-xs text-slate-400">Win Rate</span>
            </div>
            <div className="text-xl font-bold text-white">{stats?.winRate?.toFixed(1) || '0.0'}%</div>
          </div>
          <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="w-4 h-4 text-green-400" />
              <span className="text-xs text-slate-400">Profit</span>
            </div>
            <div className={`text-xl font-bold ${(stats?.totalProfit || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {(stats?.totalProfit || 0) >= 0 ? '+' : ''}${stats?.totalProfit?.toFixed(0) || '0'}
            </div>
          </div>
          <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700">
            <div className="flex items-center gap-2 mb-1">
              <Target className="w-4 h-4 text-orange-400" />
              <span className="text-xs text-slate-400">Bets</span>
            </div>
            <div className="text-xl font-bold text-white">{stats?.totalBets || 0}</div>
          </div>
          <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-cyan-400" />
              <span className="text-xs text-slate-400">Systems</span>
            </div>
            <div className="text-xl font-bold text-white">{stats?.savedSystems || 0}</div>
          </div>
          <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700">
            <div className="flex items-center gap-2 mb-1">
              <Activity className="w-4 h-4 text-blue-400" />
              <span className="text-xs text-slate-400">Games</span>
            </div>
            <div className="text-xl font-bold text-white">{stats?.followedGames || 0}</div>
          </div>
          <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700">
            <div className="flex items-center gap-2 mb-1">
              <BarChart3 className="w-4 h-4 text-purple-400" />
              <span className="text-xs text-slate-400">ROI</span>
            </div>
            <div className={`text-xl font-bold ${(stats?.roi || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {(stats?.roi || 0) >= 0 ? '+' : ''}{stats?.roi?.toFixed(1) || '0.0'}%
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-2 mb-6">
          <Link href="/trend-finder" className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-sm font-medium hover:opacity-90 transition-opacity">
            <Plus className="w-4 h-4" />
            AI Trend Finder
          </Link>
          <button 
            onClick={() => setShowAddBet(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-orange-500 to-pink-500 text-white text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" />
            Track Bet
          </button>
          <Link href="/schedule" className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 text-sm font-medium hover:border-slate-600 transition-colors">
            <ExternalLink className="w-4 h-4" />
            Today&apos;s Games
          </Link>
          <Link href="/marketplace" className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 text-sm font-medium hover:border-slate-600 transition-colors">
            <ExternalLink className="w-4 h-4" />
            Marketplace
          </Link>
          <Link href="/leaderboard" className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 text-sm font-medium hover:border-slate-600 transition-colors">
            <ExternalLink className="w-4 h-4" />
            Leaderboard
          </Link>
        </div>

        {/* Widget Grid */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Column 1 */}
          <div className="space-y-6">
            {/* Games Widget */}
            <GamesWidget
              games={followedGames}
              onToggleFollow={handleToggleGameFollow}
              onToggleNotifications={handleToggleGameNotifications}
              onAddBet={handleAddBetToGame}
              onAddNote={handleAddGameNote}
              onViewGame={(gameId) => router.push(`/games/${gameId}`)}
              isLoading={loading}
            />

            {/* Trends/Systems Widget */}
            <TrendsWidget
              systems={systems}
              onCreateSystem={() => router.push('/trend-finder')}
              onEditSystem={(id) => router.push(`/dashboard/systems/${id}`)}
              onDeleteSystem={handleDeleteSystem}
              onPublishToMarketplace={handlePublishSystem}
              onUnpublish={handleUnpublishSystem}
              onViewMarketplace={() => router.push('/marketplace')}
              onTestSystem={(id) => router.push(`/dashboard/systems/${id}/test`)}
              marketplaceMonetizationEnabled={siteSettings.marketplaceMonetizationEnabled}
              isLoading={loading}
            />
          </div>

          {/* Column 2 */}
          <div className="space-y-6">
            {/* Alerts Widget */}
            <AlertsWidget
              alerts={alerts}
              onMarkAsRead={handleMarkAlertAsRead}
              onMarkAllAsRead={handleMarkAllAlertsAsRead}
              onDismiss={handleDismissAlert}
              onViewEntity={(type, id) => {
                const routes: Record<string, string> = {
                  game: `/games/${id}`,
                  team: `/teams/${id}`,
                  player: `/players/${id}`,
                  system: `/dashboard/systems/${id}`,
                }
                router.push(routes[type] || '/dashboard')
              }}
              isLoading={loading}
            />

            {/* Teams Widget */}
            <TeamsWidget
              teams={favoriteTeams}
              onToggleFavorite={handleToggleTeamFavorite}
              onToggleNotifications={handleToggleTeamNotifications}
              onViewTeam={(teamId, sport) => router.push(`/${sport.toLowerCase()}/teams/${teamId}`)}
              onViewSchedule={(teamId, sport) => router.push(`/${sport.toLowerCase()}/teams/${teamId}/schedule`)}
              isLoading={loading}
            />

            {/* Players Widget */}
            <PlayersWidget
              players={favoritePlayers}
              onToggleFavorite={handleTogglePlayerFavorite}
              onToggleNotifications={handleTogglePlayerNotifications}
              onViewPlayer={(playerId, sport) => router.push(`/${sport.toLowerCase()}/players/${playerId}`)}
              onViewNews={(playerId) => router.push(`/players/${playerId}/news`)}
              isLoading={loading}
            />
          </div>
        </div>
      </main>

      {/* Add Bet Modal */}
      {showAddBet && user && (
        <AddBetModal 
          onClose={() => setShowAddBet(false)} 
          onSave={() => { setShowAddBet(false); fetchDashboardData(true); }} 
          userId={user.id}
        />
      )}
    </div>
  )
}

// Add Bet Modal Component
function AddBetModal({ onClose, onSave, userId }: { onClose: () => void; onSave: () => void; userId: string }) {
  const supabase = createClient()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    sport: 'NFL',
    bet_type: 'spread',
    selection: '',
    odds: -110,
    stake: 100,
    sportsbook: '',
    confidence: 3,
    notes: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    
    try {
      const potential_payout = form.odds > 0 
        ? form.stake + (form.stake * (form.odds / 100))
        : form.stake + (form.stake * (100 / Math.abs(form.odds)))
      
      const { error } = await supabase.from('user_bets').insert({
        user_id: userId,
        sport: form.sport,
        bet_type: form.bet_type,
        selection: form.selection,
        odds: form.odds,
        stake: form.stake,
        potential_payout,
        sportsbook: form.sportsbook || null,
        confidence: form.confidence,
        notes: form.notes || null,
        status: 'pending'
      })
      
      if (error) throw error
      onSave()
    } catch (error) {
      console.error('Error saving bet:', error)
      alert('Failed to save bet')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
      <div className="w-full max-w-md rounded-2xl p-6 bg-slate-900 border border-slate-700">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-white">Track New Bet</h3>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white" title="Close" aria-label="Close dialog">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="bet-sport" className="block text-xs font-medium mb-1 text-slate-400">Sport</label>
              <select 
                id="bet-sport"
                value={form.sport}
                onChange={(e) => setForm({ ...form, sport: e.target.value })}
                className="w-full px-3 py-2 rounded-lg text-white text-sm bg-slate-800 border border-slate-700"
              >
                <option value="NFL">🏈 NFL</option>
                <option value="NBA">🏀 NBA</option>
                <option value="NHL">🏒 NHL</option>
                <option value="MLB">⚾ MLB</option>
                <option value="NCAAF">🏈 NCAAF</option>
                <option value="NCAAB">🏀 NCAAB</option>
              </select>
            </div>
            <div>
              <label htmlFor="bet-type" className="block text-xs font-medium mb-1 text-slate-400">Bet Type</label>
              <select 
                id="bet-type"
                value={form.bet_type}
                onChange={(e) => setForm({ ...form, bet_type: e.target.value })}
                className="w-full px-3 py-2 rounded-lg text-white text-sm bg-slate-800 border border-slate-700"
              >
                <option value="spread">Spread</option>
                <option value="moneyline">Moneyline</option>
                <option value="total">Total (O/U)</option>
                <option value="prop">Prop</option>
                <option value="parlay">Parlay</option>
                <option value="teaser">Teaser</option>
                <option value="future">Future</option>
                <option value="live">Live</option>
              </select>
            </div>
          </div>
          
          <div>
            <label className="block text-xs font-medium mb-1 text-slate-400">Selection *</label>
            <input 
              type="text"
              value={form.selection}
              onChange={(e) => setForm({ ...form, selection: e.target.value })}
              placeholder="e.g., Chiefs -3.5, Over 45.5, Mahomes ATTD"
              required
              className="w-full px-3 py-2 rounded-lg text-white text-sm bg-slate-800 border border-slate-700 placeholder-slate-500"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium mb-1 text-slate-400">Odds *</label>
              <input 
                type="number"
                value={form.odds}
                onChange={(e) => setForm({ ...form, odds: parseInt(e.target.value) || -110 })}
                placeholder="-110"
                required
                className="w-full px-3 py-2 rounded-lg text-white text-sm bg-slate-800 border border-slate-700"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1 text-slate-400">Stake ($) *</label>
              <input 
                type="number"
                value={form.stake}
                onChange={(e) => setForm({ ...form, stake: parseFloat(e.target.value) || 0 })}
                placeholder="100"
                required
                min="0"
                step="0.01"
                className="w-full px-3 py-2 rounded-lg text-white text-sm bg-slate-800 border border-slate-700"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-xs font-medium mb-1 text-slate-400">Sportsbook</label>
            <input 
              type="text"
              value={form.sportsbook}
              onChange={(e) => setForm({ ...form, sportsbook: e.target.value })}
              placeholder="DraftKings, FanDuel, etc."
              className="w-full px-3 py-2 rounded-lg text-white text-sm bg-slate-800 border border-slate-700 placeholder-slate-500"
            />
          </div>
          
          <div>
            <label className="block text-xs font-medium mb-2 text-slate-400">
              Confidence: {form.confidence}/5
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setForm({ ...form, confidence: n })}
                  className={`flex-1 py-2 rounded-lg transition-all ${
                    form.confidence >= n 
                      ? 'bg-orange-500 text-white' 
                      : 'bg-slate-800 text-slate-500'
                  }`}
                >
                  ★
                </button>
              ))}
            </div>
          </div>
          
          <div>
            <label className="block text-xs font-medium mb-1 text-slate-400">Notes</label>
            <textarea 
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Any notes about this bet..."
              rows={2}
              className="w-full px-3 py-2 rounded-lg text-white text-sm resize-none bg-slate-800 border border-slate-700 placeholder-slate-500"
            />
          </div>
          
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl font-medium bg-slate-800 text-slate-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !form.selection}
              className="flex-1 py-3 rounded-xl font-bold text-white disabled:opacity-50 bg-gradient-to-r from-orange-500 to-pink-500"
            >
              {saving ? 'Saving...' : 'Track Bet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
