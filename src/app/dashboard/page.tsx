'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  User, TrendingUp, Target, DollarSign, Trophy, Star, 
  Plus, X, Bell, Settings, ChevronRight, Calendar,
  BarChart3, PieChart, Activity, Zap, Users, Heart,
  CheckCircle, XCircle, Clock, ArrowUp, ArrowDown,
  Brain, Trash2, Loader2
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/auth-context'

// Types
interface UserBet {
  id: string
  sport: string
  game_id?: string
  bet_type: string
  selection: string
  odds: number
  stake: number
  potential_payout: number
  actual_payout?: number
  status: 'pending' | 'won' | 'lost' | 'push' | 'cashout' | 'void'
  sportsbook?: string
  notes?: string
  confidence?: number
  tags?: string[]
  placed_at: string
  settled_at?: string
  game_date?: string
}

interface UserFollow {
  id: string
  follow_type: 'player' | 'team' | 'expert' | 'market'
  entity_id: string
  entity_name: string
  entity_data: {
    logo?: string
    sport?: string
    record?: string
    position?: string
  }
  notifications_enabled: boolean
}

interface BettingStats {
  total_bets: number
  wins: number
  losses: number
  pushes: number
  pending: number
  win_rate: number
  total_staked: number
  total_profit: number
  roi: number
  avg_odds: number
}

interface UserPreferences {
  default_sport: string
  odds_format: string
  starting_bankroll: number
  current_bankroll: number
  unit_size: number
}

interface UserSystem {
  id: string
  name: string
  sport: string
  bet_type: string
  criteria: string[]
  stats: {
    record: string
    winPct: number
    roi: number
    units: number
  }
  is_public: boolean
  created_at: string
}

export default function DashboardPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const supabase = createClient()
  
  const [activeTab, setActiveTab] = useState<'overview' | 'bets' | 'follows' | 'systems' | 'analytics'>('overview')
  const [bets, setBets] = useState<UserBet[]>([])
  const [follows, setFollows] = useState<UserFollow[]>([])
  const [systems, setSystems] = useState<UserSystem[]>([])
  const [stats, setStats] = useState<BettingStats | null>(null)
  const [preferences, setPreferences] = useState<UserPreferences | null>(null)
  const [loading, setLoading] = useState(true)
  const [showAddBet, setShowAddBet] = useState(false)
  const [systemsLoading, setSystemsLoading] = useState(false)

  // Fetch all user data
  const fetchData = useCallback(async () => {
    if (!user) return
    setLoading(true)
    
    try {
      // Fetch bets
      const { data: betsData } = await supabase
        .from('user_bets')
        .select('*')
        .eq('user_id', user.id)
        .order('placed_at', { ascending: false })
        .limit(50)
      
      // Fetch follows
      const { data: followsData } = await supabase
        .from('user_follows')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      
      // Fetch stats using RPC function
      const { data: statsData } = await supabase
        .rpc('get_user_betting_stats', { p_user_id: user.id })
      
      // Fetch preferences
      const { data: prefsData } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single()
      
      setBets(betsData || [])
      setFollows(followsData || [])
      setStats(statsData?.[0] || null)
      setPreferences(prefsData || null)
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }, [user, supabase])

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth?redirect=/dashboard')
    } else if (user) {
      fetchData()
    }
  }, [user, authLoading, router, fetchData])

  // Fetch user systems
  const fetchSystems = useCallback(async () => {
    if (!user) return
    setSystemsLoading(true)
    try {
      const response = await fetch('/api/user/systems')
      if (response.ok) {
        const data = await response.json()
        setSystems(data.systems || [])
      }
    } catch (error) {
      console.error('Error fetching systems:', error)
    } finally {
      setSystemsLoading(false)
    }
  }, [user])

  // Delete a system
  const deleteSystem = async (systemId: string) => {
    try {
      const response = await fetch(`/api/user/systems/${systemId}`, {
        method: 'DELETE'
      })
      if (response.ok) {
        setSystems(prev => prev.filter(s => s.id !== systemId))
      }
    } catch (error) {
      console.error('Error deleting system:', error)
    }
  }

  // Fetch systems when tab changes to systems
  useEffect(() => {
    if (activeTab === 'systems' && user && systems.length === 0) {
      fetchSystems()
    }
  }, [activeTab, user, systems.length, fetchSystems])

  // Format odds display
  const formatOdds = (odds: number) => {
    if (odds > 0) return `+${odds}`
    return odds.toString()
  }

  // Calculate potential payout
  const calculatePayout = (odds: number, stake: number) => {
    if (odds > 0) {
      return stake + (stake * (odds / 100))
    } else {
      return stake + (stake * (100 / Math.abs(odds)))
    }
  }

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'won': return '#00FF88'
      case 'lost': return '#FF4455'
      case 'push': return '#FFD700'
      case 'pending': return '#808090'
      default: return '#808090'
    }
  }

  // Loading state
  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0A0A0F' }}>
        <div className="text-center">
          <div className="animate-spin w-10 h-10 border-2 border-white border-t-transparent rounded-full mx-auto mb-4"></div>
          <p style={{ color: '#808090' }}>Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  // Not logged in
  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen" style={{ background: '#0A0A0F' }}>
      {/* Header */}
      <section className="border-b" style={{ borderColor: 'rgba(255,255,255,0.1)', background: '#0c0c14' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
                   style={{ background: 'linear-gradient(135deg, #FF6B00, #FF3366)' }}>
                <User className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">
                  Welcome back{user.user_metadata?.username ? `, ${user.user_metadata.username}` : ''}!
                </h1>
                <p style={{ color: '#808090' }}>{user.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button className="p-2 rounded-xl transition-all hover:bg-white/5">
                <Bell className="w-5 h-5" style={{ color: '#808090' }} />
              </button>
              <Link href="/dashboard/settings" className="p-2 rounded-xl transition-all hover:bg-white/5">
                <Settings className="w-5 h-5" style={{ color: '#808090' }} />
              </Link>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mt-6 overflow-x-auto">
            {[
              { id: 'overview', label: 'Overview', icon: Activity },
              { id: 'bets', label: 'My Bets', icon: Target },
              { id: 'follows', label: 'Following', icon: Heart },
              { id: 'systems', label: 'My Systems', icon: Brain },
              { id: 'analytics', label: 'Analytics', icon: BarChart3 },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap"
                style={{
                  background: activeTab === tab.id ? 'linear-gradient(135deg, #FF6B00, #FF3366)' : 'transparent',
                  color: activeTab === tab.id ? '#FFF' : '#808090'
                }}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl" style={{ background: '#12121A' }}>
                <div className="flex items-center gap-2 mb-2">
                  <Trophy className="w-4 h-4" style={{ color: '#FFD700' }} />
                  <span className="text-xs font-medium" style={{ color: '#808090' }}>Win Rate</span>
                </div>
                <div className="text-2xl font-bold text-white">
                  {stats?.win_rate?.toFixed(1) || '0.0'}%
                </div>
                <div className="text-xs" style={{ color: stats && stats.win_rate >= 52 ? '#00FF88' : '#FF4455' }}>
                  {stats?.wins || 0}W - {stats?.losses || 0}L
                </div>
              </div>

              <div className="p-4 rounded-2xl" style={{ background: '#12121A' }}>
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="w-4 h-4" style={{ color: '#00FF88' }} />
                  <span className="text-xs font-medium" style={{ color: '#808090' }}>Profit/Loss</span>
                </div>
                <div className="text-2xl font-bold" style={{ color: stats && stats.total_profit >= 0 ? '#00FF88' : '#FF4455' }}>
                  {stats && stats.total_profit >= 0 ? '+' : ''}${stats?.total_profit?.toFixed(2) || '0.00'}
                </div>
                <div className="text-xs" style={{ color: '#808090' }}>
                  ROI: {stats?.roi?.toFixed(1) || '0.0'}%
                </div>
              </div>

              <div className="p-4 rounded-2xl" style={{ background: '#12121A' }}>
                <div className="flex items-center gap-2 mb-2">
                  <Target className="w-4 h-4" style={{ color: '#FF6B00' }} />
                  <span className="text-xs font-medium" style={{ color: '#808090' }}>Total Bets</span>
                </div>
                <div className="text-2xl font-bold text-white">
                  {stats?.total_bets || 0}
                </div>
                <div className="text-xs" style={{ color: '#808090' }}>
                  {stats?.pending || 0} pending
                </div>
              </div>

              <div className="p-4 rounded-2xl" style={{ background: '#12121A' }}>
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4" style={{ color: '#9B59B6' }} />
                  <span className="text-xs font-medium" style={{ color: '#808090' }}>Avg Odds</span>
                </div>
                <div className="text-2xl font-bold text-white">
                  {formatOdds(stats?.avg_odds || -110)}
                </div>
                <div className="text-xs" style={{ color: '#808090' }}>
                  ${stats?.total_staked?.toFixed(0) || '0'} wagered
                </div>
              </div>
            </div>

            {/* Recent Bets & Following */}
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Recent Bets */}
              <div className="p-6 rounded-2xl" style={{ background: '#12121A' }}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-white">Recent Bets</h3>
                  <button 
                    onClick={() => setShowAddBet(true)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium"
                    style={{ background: 'linear-gradient(135deg, #FF6B00, #FF3366)', color: '#FFF' }}
                  >
                    <Plus className="w-4 h-4" />
                    Add Bet
                  </button>
                </div>
                
                {bets.length === 0 ? (
                  <div className="text-center py-8">
                    <Target className="w-12 h-12 mx-auto mb-3" style={{ color: '#404050' }} />
                    <p style={{ color: '#808090' }}>No bets tracked yet</p>
                    <button 
                      onClick={() => setShowAddBet(true)}
                      className="mt-3 text-sm font-medium"
                      style={{ color: '#FF6B00' }}
                    >
                      Track your first bet →
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {bets.slice(0, 5).map((bet) => (
                      <div key={bet.id} className="flex items-center justify-between p-3 rounded-xl"
                           style={{ background: 'rgba(255,255,255,0.03)' }}>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg flex items-center justify-center text-lg"
                               style={{ background: 'rgba(255,255,255,0.05)' }}>
                            {bet.sport === 'NFL' ? '🏈' : bet.sport === 'NBA' ? '🏀' : bet.sport === 'NHL' ? '🏒' : '⚾'}
                          </div>
                          <div>
                            <div className="font-medium text-white text-sm">{bet.selection}</div>
                            <div className="text-xs" style={{ color: '#808090' }}>
                              {bet.bet_type} • {formatOdds(bet.odds)} • ${bet.stake}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-1 text-sm font-medium"
                               style={{ color: getStatusColor(bet.status) }}>
                            {bet.status === 'won' && <CheckCircle className="w-4 h-4" />}
                            {bet.status === 'lost' && <XCircle className="w-4 h-4" />}
                            {bet.status === 'pending' && <Clock className="w-4 h-4" />}
                            {bet.status.charAt(0).toUpperCase() + bet.status.slice(1)}
                          </div>
                          {bet.status === 'won' && (
                            <div className="text-xs" style={{ color: '#00FF88' }}>
                              +${((bet.actual_payout || bet.potential_payout) - bet.stake).toFixed(2)}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    <button 
                      onClick={() => setActiveTab('bets')}
                      className="w-full py-2 text-sm font-medium rounded-lg transition-all hover:bg-white/5"
                      style={{ color: '#808090' }}
                    >
                      View all bets →
                    </button>
                  </div>
                )}
              </div>

              {/* Following */}
              <div className="p-6 rounded-2xl" style={{ background: '#12121A' }}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-white">Following</h3>
                  <span className="text-sm" style={{ color: '#808090' }}>{follows.length} total</span>
                </div>
                
                {follows.length === 0 ? (
                  <div className="text-center py-8">
                    <Heart className="w-12 h-12 mx-auto mb-3" style={{ color: '#404050' }} />
                    <p style={{ color: '#808090' }}>Not following anyone yet</p>
                    <Link href="/leaderboard" className="mt-3 text-sm font-medium block"
                          style={{ color: '#FF6B00' }}>
                      Browse experts to follow →
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {follows.slice(0, 5).map((follow) => (
                      <div key={follow.id} className="flex items-center justify-between p-3 rounded-xl"
                           style={{ background: 'rgba(255,255,255,0.03)' }}>
                        <div className="flex items-center gap-3">
                          {follow.entity_data.logo ? (
                            <img src={follow.entity_data.logo} alt="" className="w-10 h-10 rounded-lg object-cover" />
                          ) : (
                            <div className="w-10 h-10 rounded-lg flex items-center justify-center"
                                 style={{ background: 'linear-gradient(135deg, #FF6B00, #FF3366)' }}>
                              {follow.follow_type === 'expert' ? <Users className="w-5 h-5 text-white" /> :
                               follow.follow_type === 'team' ? <Zap className="w-5 h-5 text-white" /> :
                               <Star className="w-5 h-5 text-white" />}
                            </div>
                          )}
                          <div>
                            <div className="font-medium text-white text-sm">{follow.entity_name}</div>
                            <div className="text-xs capitalize" style={{ color: '#808090' }}>
                              {follow.follow_type} {follow.entity_data.sport && `• ${follow.entity_data.sport}`}
                            </div>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4" style={{ color: '#404050' }} />
                      </div>
                    ))}
                    <button 
                      onClick={() => setActiveTab('follows')}
                      className="w-full py-2 text-sm font-medium rounded-lg transition-all hover:bg-white/5"
                      style={{ color: '#808090' }}
                    >
                      View all →
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Bankroll Summary */}
            {preferences && (
              <div className="p-6 rounded-2xl" style={{ background: '#12121A' }}>
                <h3 className="text-lg font-bold text-white mb-4">Bankroll</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <div className="text-xs mb-1" style={{ color: '#808090' }}>Starting</div>
                    <div className="text-xl font-bold text-white">${preferences.starting_bankroll.toFixed(0)}</div>
                  </div>
                  <div>
                    <div className="text-xs mb-1" style={{ color: '#808090' }}>Current</div>
                    <div className="text-xl font-bold" style={{ color: preferences.current_bankroll >= preferences.starting_bankroll ? '#00FF88' : '#FF4455' }}>
                      ${preferences.current_bankroll.toFixed(0)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs mb-1" style={{ color: '#808090' }}>Unit Size</div>
                    <div className="text-xl font-bold text-white">${preferences.unit_size.toFixed(0)}</div>
                  </div>
                </div>
                <div className="mt-4 h-2 rounded-full overflow-hidden" style={{ background: '#1a1a24' }}>
                  <div 
                    className="h-full rounded-full transition-all"
                    style={{ 
                      width: `${Math.min(100, Math.max(0, (preferences.current_bankroll / preferences.starting_bankroll) * 100))}%`,
                      background: preferences.current_bankroll >= preferences.starting_bankroll 
                        ? 'linear-gradient(90deg, #00FF88, #00CC6A)' 
                        : 'linear-gradient(90deg, #FF4455, #FF6B00)'
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Bets Tab */}
        {activeTab === 'bets' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">All Bets</h2>
              <button 
                onClick={() => setShowAddBet(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold"
                style={{ background: 'linear-gradient(135deg, #FF6B00, #FF3366)', color: '#FFF' }}
              >
                <Plus className="w-4 h-4" />
                Add Bet
              </button>
            </div>

            {bets.length === 0 ? (
              <div className="text-center py-16 rounded-2xl" style={{ background: '#12121A' }}>
                <Target className="w-16 h-16 mx-auto mb-4" style={{ color: '#404050' }} />
                <h3 className="text-xl font-bold text-white mb-2">No bets tracked yet</h3>
                <p className="mb-6" style={{ color: '#808090' }}>Start tracking your bets to see detailed analytics</p>
                <button 
                  onClick={() => setShowAddBet(true)}
                  className="px-6 py-3 rounded-xl font-bold"
                  style={{ background: 'linear-gradient(135deg, #FF6B00, #FF3366)', color: '#FFF' }}
                >
                  Track Your First Bet
                </button>
              </div>
            ) : (
              <div className="rounded-2xl overflow-hidden" style={{ background: '#12121A' }}>
                <table className="w-full">
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                      <th className="text-left p-4 text-xs font-medium" style={{ color: '#808090' }}>BET</th>
                      <th className="text-center p-4 text-xs font-medium" style={{ color: '#808090' }}>TYPE</th>
                      <th className="text-center p-4 text-xs font-medium" style={{ color: '#808090' }}>ODDS</th>
                      <th className="text-center p-4 text-xs font-medium" style={{ color: '#808090' }}>STAKE</th>
                      <th className="text-center p-4 text-xs font-medium" style={{ color: '#808090' }}>STATUS</th>
                      <th className="text-right p-4 text-xs font-medium" style={{ color: '#808090' }}>P/L</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bets.map((bet) => (
                      <tr key={bet.id} className="hover:bg-white/5 transition-colors"
                          style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm"
                                 style={{ background: 'rgba(255,255,255,0.05)' }}>
                              {bet.sport === 'NFL' ? '🏈' : bet.sport === 'NBA' ? '🏀' : bet.sport === 'NHL' ? '🏒' : '⚾'}
                            </div>
                            <div>
                              <div className="font-medium text-white text-sm">{bet.selection}</div>
                              <div className="text-xs" style={{ color: '#808090' }}>
                                {new Date(bet.placed_at).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-center">
                          <span className="px-2 py-1 rounded text-xs font-medium capitalize"
                                style={{ background: 'rgba(255,255,255,0.05)', color: '#808090' }}>
                            {bet.bet_type}
                          </span>
                        </td>
                        <td className="p-4 text-center font-mono text-sm text-white">
                          {formatOdds(bet.odds)}
                        </td>
                        <td className="p-4 text-center font-medium text-white">
                          ${bet.stake.toFixed(2)}
                        </td>
                        <td className="p-4 text-center">
                          <span className="px-2 py-1 rounded text-xs font-bold capitalize"
                                style={{ 
                                  background: `${getStatusColor(bet.status)}20`,
                                  color: getStatusColor(bet.status)
                                }}>
                            {bet.status}
                          </span>
                        </td>
                        <td className="p-4 text-right font-bold"
                            style={{ color: bet.status === 'won' ? '#00FF88' : bet.status === 'lost' ? '#FF4455' : '#808090' }}>
                          {bet.status === 'won' && `+$${((bet.actual_payout || bet.potential_payout) - bet.stake).toFixed(2)}`}
                          {bet.status === 'lost' && `-$${bet.stake.toFixed(2)}`}
                          {bet.status === 'pending' && '-'}
                          {bet.status === 'push' && '$0.00'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Following Tab */}
        {activeTab === 'follows' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Following ({follows.length})</h2>
              <Link href="/leaderboard" 
                    className="px-4 py-2 rounded-xl text-sm font-medium"
                    style={{ background: 'rgba(255,255,255,0.05)', color: '#808090' }}>
                Find More to Follow
              </Link>
            </div>

            {follows.length === 0 ? (
              <div className="text-center py-16 rounded-2xl" style={{ background: '#12121A' }}>
                <Heart className="w-16 h-16 mx-auto mb-4" style={{ color: '#404050' }} />
                <h3 className="text-xl font-bold text-white mb-2">Not following anyone</h3>
                <p className="mb-6" style={{ color: '#808090' }}>Follow experts, teams, and players to track their performance</p>
                <Link href="/leaderboard"
                      className="inline-block px-6 py-3 rounded-xl font-bold"
                      style={{ background: 'linear-gradient(135deg, #FF6B00, #FF3366)', color: '#FFF' }}>
                  Browse Experts
                </Link>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {follows.map((follow) => (
                  <div key={follow.id} className="p-4 rounded-2xl" style={{ background: '#12121A' }}>
                    <div className="flex items-center gap-3 mb-3">
                      {follow.entity_data.logo ? (
                        <img src={follow.entity_data.logo} alt="" className="w-12 h-12 rounded-xl object-cover" />
                      ) : (
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center"
                             style={{ background: 'linear-gradient(135deg, #FF6B00, #FF3366)' }}>
                          {follow.follow_type === 'expert' ? <Users className="w-6 h-6 text-white" /> :
                           follow.follow_type === 'team' ? <Zap className="w-6 h-6 text-white" /> :
                           <Star className="w-6 h-6 text-white" />}
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="font-bold text-white">{follow.entity_name}</div>
                        <div className="text-xs capitalize" style={{ color: '#808090' }}>
                          {follow.follow_type} {follow.entity_data.sport && `• ${follow.entity_data.sport}`}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <button className="flex items-center gap-1 text-xs"
                              style={{ color: follow.notifications_enabled ? '#00FF88' : '#808090' }}>
                        <Bell className="w-3 h-3" />
                        {follow.notifications_enabled ? 'Notifications On' : 'Notifications Off'}
                      </button>
                      <button className="text-xs" style={{ color: '#FF4455' }}>
                        Unfollow
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Systems Tab */}
        {activeTab === 'systems' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">My Betting Systems</h2>
              <Link 
                href="/systems"
                className="px-4 py-2 rounded-xl font-medium text-sm"
                style={{ background: 'linear-gradient(135deg, #FF6B00, #FF3366)', color: '#FFF' }}
              >
                <Plus className="w-4 h-4 inline mr-1" />
                Create System
              </Link>
            </div>
            
            {systemsLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#FF6B00' }} />
              </div>
            ) : systems.length === 0 ? (
              <div className="text-center py-16 rounded-2xl" style={{ background: '#12121A' }}>
                <Brain className="w-16 h-16 mx-auto mb-4" style={{ color: '#404050' }} />
                <h3 className="text-xl font-bold text-white mb-2">No systems yet</h3>
                <p className="mb-6" style={{ color: '#808090' }}>Create AI-powered betting systems and track their performance</p>
                <Link 
                  href="/systems"
                  className="inline-block px-6 py-3 rounded-xl font-bold"
                  style={{ background: 'linear-gradient(135deg, #FF6B00, #FF3366)', color: '#FFF' }}
                >
                  Build Your First System
                </Link>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {systems.map((system) => (
                  <div key={system.id} className="p-5 rounded-2xl" style={{ background: '#12121A' }}>
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-bold text-white">{system.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,107,0,0.2)', color: '#FF6B00' }}>
                            {system.sport.toUpperCase()}
                          </span>
                          <span className="text-xs" style={{ color: '#808090' }}>
                            {system.bet_type.toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => deleteSystem(system.id)}
                        className="p-1.5 rounded-lg hover:bg-red-900/30 transition-colors"
                        style={{ color: '#FF4455' }}
                        title="Delete system"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    
                    {/* System Stats */}
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <p className="text-xs" style={{ color: '#606070' }}>Record</p>
                        <p className="font-bold text-white">{system.stats?.record || '0-0-0'}</p>
                      </div>
                      <div>
                        <p className="text-xs" style={{ color: '#606070' }}>Win %</p>
                        <p className="font-bold" style={{ color: (system.stats?.winPct || 0) >= 52 ? '#00FF88' : '#FFF' }}>
                          {system.stats?.winPct?.toFixed(1) || '0.0'}%
                        </p>
                      </div>
                      <div>
                        <p className="text-xs" style={{ color: '#606070' }}>ROI</p>
                        <p className="font-bold" style={{ color: (system.stats?.roi || 0) >= 0 ? '#00FF88' : '#FF4455' }}>
                          {(system.stats?.roi || 0) >= 0 ? '+' : ''}{system.stats?.roi?.toFixed(1) || '0.0'}%
                        </p>
                      </div>
                      <div>
                        <p className="text-xs" style={{ color: '#606070' }}>Units</p>
                        <p className="font-bold" style={{ color: (system.stats?.units || 0) >= 0 ? '#00FF88' : '#FF4455' }}>
                          {(system.stats?.units || 0) >= 0 ? '+' : ''}{system.stats?.units?.toFixed(1) || '0.0'}
                        </p>
                      </div>
                    </div>
                    
                    {/* Criteria */}
                    {system.criteria && system.criteria.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {system.criteria.slice(0, 2).map((c, i) => (
                          <span key={i} className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.05)', color: '#808090' }}>
                            {c.length > 25 ? c.substring(0, 25) + '...' : c}
                          </span>
                        ))}
                        {system.criteria.length > 2 && (
                          <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.05)', color: '#808090' }}>
                            +{system.criteria.length - 2} more
                          </span>
                        )}
                      </div>
                    )}
                    
                    {/* View Details Link */}
                    <Link 
                      href="/systems"
                      className="mt-4 flex items-center justify-center gap-1 w-full py-2 rounded-lg text-sm font-medium"
                      style={{ background: 'rgba(255,107,0,0.1)', color: '#FF6B00' }}
                    >
                      View System <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-white">Betting Analytics</h2>
            
            {!stats || stats.total_bets === 0 ? (
              <div className="text-center py-16 rounded-2xl" style={{ background: '#12121A' }}>
                <BarChart3 className="w-16 h-16 mx-auto mb-4" style={{ color: '#404050' }} />
                <h3 className="text-xl font-bold text-white mb-2">No data yet</h3>
                <p className="mb-6" style={{ color: '#808090' }}>Start tracking bets to see your analytics</p>
                <button 
                  onClick={() => { setActiveTab('bets'); setShowAddBet(true); }}
                  className="px-6 py-3 rounded-xl font-bold"
                  style={{ background: 'linear-gradient(135deg, #FF6B00, #FF3366)', color: '#FFF' }}
                >
                  Track Your First Bet
                </button>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                {/* Performance Summary */}
                <div className="p-6 rounded-2xl" style={{ background: '#12121A' }}>
                  <h3 className="font-bold text-white mb-4">Performance Summary</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span style={{ color: '#808090' }}>Win Rate</span>
                      <span className="font-bold" style={{ color: stats.win_rate >= 52 ? '#00FF88' : '#FF4455' }}>
                        {stats.win_rate.toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span style={{ color: '#808090' }}>ROI</span>
                      <span className="font-bold" style={{ color: stats.roi >= 0 ? '#00FF88' : '#FF4455' }}>
                        {stats.roi >= 0 ? '+' : ''}{stats.roi.toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span style={{ color: '#808090' }}>Total Profit</span>
                      <span className="font-bold" style={{ color: stats.total_profit >= 0 ? '#00FF88' : '#FF4455' }}>
                        {stats.total_profit >= 0 ? '+' : ''}${stats.total_profit.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span style={{ color: '#808090' }}>Total Wagered</span>
                      <span className="font-bold text-white">${stats.total_staked.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Record Breakdown */}
                <div className="p-6 rounded-2xl" style={{ background: '#12121A' }}>
                  <h3 className="font-bold text-white mb-4">Record Breakdown</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 rounded-xl" style={{ background: 'rgba(0,255,136,0.1)' }}>
                      <div className="text-3xl font-black" style={{ color: '#00FF88' }}>{stats.wins}</div>
                      <div className="text-xs" style={{ color: '#808090' }}>Wins</div>
                    </div>
                    <div className="text-center p-4 rounded-xl" style={{ background: 'rgba(255,68,85,0.1)' }}>
                      <div className="text-3xl font-black" style={{ color: '#FF4455' }}>{stats.losses}</div>
                      <div className="text-xs" style={{ color: '#808090' }}>Losses</div>
                    </div>
                    <div className="text-center p-4 rounded-xl" style={{ background: 'rgba(255,215,0,0.1)' }}>
                      <div className="text-3xl font-black" style={{ color: '#FFD700' }}>{stats.pushes}</div>
                      <div className="text-xs" style={{ color: '#808090' }}>Pushes</div>
                    </div>
                    <div className="text-center p-4 rounded-xl" style={{ background: 'rgba(128,128,144,0.1)' }}>
                      <div className="text-3xl font-black" style={{ color: '#808090' }}>{stats.pending}</div>
                      <div className="text-xs" style={{ color: '#808090' }}>Pending</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Add Bet Modal */}
      {showAddBet && (
        <AddBetModal 
          onClose={() => setShowAddBet(false)} 
          onSave={() => { setShowAddBet(false); fetchData(); }} 
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.8)' }}>
      <div className="w-full max-w-md rounded-2xl p-6" style={{ background: '#12121A' }}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-white">Track New Bet</h3>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/5">
            <X className="w-5 h-5" style={{ color: '#808090' }} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: '#808090' }}>Sport</label>
              <select 
                value={form.sport}
                onChange={(e) => setForm({ ...form, sport: e.target.value })}
                className="w-full px-3 py-2 rounded-lg text-white text-sm"
                style={{ background: '#1a1a24', border: '1px solid rgba(255,255,255,0.1)' }}
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
              <label className="block text-xs font-medium mb-1" style={{ color: '#808090' }}>Bet Type</label>
              <select 
                value={form.bet_type}
                onChange={(e) => setForm({ ...form, bet_type: e.target.value })}
                className="w-full px-3 py-2 rounded-lg text-white text-sm"
                style={{ background: '#1a1a24', border: '1px solid rgba(255,255,255,0.1)' }}
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
            <label className="block text-xs font-medium mb-1" style={{ color: '#808090' }}>Selection *</label>
            <input 
              type="text"
              value={form.selection}
              onChange={(e) => setForm({ ...form, selection: e.target.value })}
              placeholder="e.g., Chiefs -3.5, Over 45.5, Mahomes ATTD"
              required
              className="w-full px-3 py-2 rounded-lg text-white text-sm"
              style={{ background: '#1a1a24', border: '1px solid rgba(255,255,255,0.1)' }}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: '#808090' }}>Odds *</label>
              <input 
                type="number"
                value={form.odds}
                onChange={(e) => setForm({ ...form, odds: parseInt(e.target.value) || -110 })}
                placeholder="-110"
                required
                className="w-full px-3 py-2 rounded-lg text-white text-sm"
                style={{ background: '#1a1a24', border: '1px solid rgba(255,255,255,0.1)' }}
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: '#808090' }}>Stake ($) *</label>
              <input 
                type="number"
                value={form.stake}
                onChange={(e) => setForm({ ...form, stake: parseFloat(e.target.value) || 0 })}
                placeholder="100"
                required
                min="0"
                step="0.01"
                className="w-full px-3 py-2 rounded-lg text-white text-sm"
                style={{ background: '#1a1a24', border: '1px solid rgba(255,255,255,0.1)' }}
              />
            </div>
          </div>
          
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: '#808090' }}>Sportsbook</label>
            <input 
              type="text"
              value={form.sportsbook}
              onChange={(e) => setForm({ ...form, sportsbook: e.target.value })}
              placeholder="DraftKings, FanDuel, etc."
              className="w-full px-3 py-2 rounded-lg text-white text-sm"
              style={{ background: '#1a1a24', border: '1px solid rgba(255,255,255,0.1)' }}
            />
          </div>
          
          <div>
            <label className="block text-xs font-medium mb-2" style={{ color: '#808090' }}>
              Confidence: {form.confidence}/5
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setForm({ ...form, confidence: n })}
                  className="flex-1 py-2 rounded-lg transition-all"
                  style={{ 
                    background: form.confidence >= n ? '#FF6B00' : 'rgba(255,255,255,0.05)',
                    color: form.confidence >= n ? '#FFF' : '#808090'
                  }}
                >
                  ★
                </button>
              ))}
            </div>
          </div>
          
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: '#808090' }}>Notes</label>
            <textarea 
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Any notes about this bet..."
              rows={2}
              className="w-full px-3 py-2 rounded-lg text-white text-sm resize-none"
              style={{ background: '#1a1a24', border: '1px solid rgba(255,255,255,0.1)' }}
            />
          </div>
          
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl font-medium"
              style={{ background: 'rgba(255,255,255,0.05)', color: '#808090' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !form.selection}
              className="flex-1 py-3 rounded-xl font-bold text-white disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #FF6B00, #FF3366)' }}
            >
              {saving ? 'Saving...' : 'Track Bet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
