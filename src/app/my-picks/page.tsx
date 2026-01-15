'use client'

import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import { 
  Target, Plus, Calendar, DollarSign, TrendingUp, TrendingDown,
  CheckCircle, XCircle, AlertCircle, Trash2, Edit2, Filter, 
  BarChart3, PieChart, Clock, Award, Flame, History, X,
  ChevronDown, ChevronUp, Save, Zap, ArrowRight
} from 'lucide-react'

type Sport = 'nfl' | 'nba' | 'nhl' | 'mlb' | 'ncaaf' | 'ncaab'
type BetType = 'spread' | 'moneyline' | 'total' | 'prop' | 'parlay' | 'teaser'
type PickResult = 'win' | 'loss' | 'push' | 'pending'

interface UserPick {
  id: string
  date: string
  sport: Sport
  betType: BetType
  matchup: string
  pick: string
  odds: number
  stake: number
  result: PickResult
  profit: number
  notes?: string
}

// No mock data - fetching from API

const sportColors: Record<Sport, string> = {
  nfl: '#FF6B00',
  nba: '#FF6B00',
  nhl: '#00D4FF',
  mlb: '#FF4455',
  ncaaf: '#FFD700',
  ncaab: '#00FF88',
}

export default function MyPicksPage() {
  const [picks, setPicks] = useState<UserPick[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [filterSport, setFilterSport] = useState<Sport | 'all'>('all')
  const [filterBetType, setFilterBetType] = useState<BetType | 'all'>('all')
  const [filterResult, setFilterResult] = useState<PickResult | 'all'>('all')
  const [sortBy, setSortBy] = useState<'date' | 'stake' | 'profit'>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year' | 'all'>('month')

  // Fetch user picks from API
  useEffect(() => {
    async function fetchPicks() {
      setIsLoading(true)
      try {
        const params = new URLSearchParams()
        if (filterSport !== 'all') params.set('sport', filterSport)
        if (filterBetType !== 'all') params.set('betType', filterBetType)
        if (filterResult !== 'all') params.set('result', filterResult)
        if (timeRange !== 'all') params.set('timeRange', timeRange)
        
        const res = await fetch(`/api/user-picks?${params.toString()}`)
        const data = await res.json()
        
        if (data.picks) {
          const transformed: UserPick[] = data.picks.map((p: Record<string, unknown>) => ({
            id: p.id as string,
            date: (p.date as string)?.split('T')[0] || new Date().toISOString().split('T')[0],
            sport: (p.sport as Sport) || 'nfl',
            betType: (p.betType as BetType) || 'spread',
            matchup: p.matchup as string || 'Game',
            pick: p.pick as string || '',
            odds: p.odds as number || -110,
            stake: p.stake as number || 100,
            result: (p.result as PickResult) || 'pending',
            profit: p.profit as number || 0,
            notes: p.notes as string || '',
          }))
          setPicks(transformed)
        }
      } catch (error) {
        console.error('Failed to fetch picks:', error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchPicks()
  }, [filterSport, filterBetType, filterResult, timeRange])

  // New pick form state
  const [newPick, setNewPick] = useState<Partial<UserPick>>({
    sport: 'nfl',
    betType: 'spread',
    odds: -110,
    stake: 100,
    result: 'pending',
  })

  // Filter picks based on time range
  const getTimeFilteredPicks = (pickList: UserPick[]) => {
    const now = new Date()
    return pickList.filter(pick => {
      const pickDate = new Date(pick.date)
      switch (timeRange) {
        case 'week':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          return pickDate >= weekAgo
        case 'month':
          const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate())
          return pickDate >= monthAgo
        case 'year':
          const yearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate())
          return pickDate >= yearAgo
        default:
          return true
      }
    })
  }

  // Calculate statistics
  const stats = useMemo(() => {
    const timeFiltered = getTimeFilteredPicks(picks)
    const settled = timeFiltered.filter(p => p.result !== 'pending')
    const wins = settled.filter(p => p.result === 'win').length
    const losses = settled.filter(p => p.result === 'loss').length
    const pushes = settled.filter(p => p.result === 'push').length
    const totalProfit = timeFiltered.reduce((sum, p) => sum + p.profit, 0)
    const totalStaked = settled.reduce((sum, p) => sum + p.stake, 0)
    const roi = totalStaked > 0 ? (totalProfit / totalStaked) * 100 : 0
    const winRate = (wins + losses) > 0 ? (wins / (wins + losses)) * 100 : 0

    // By sport breakdown
    const bySport = (['nfl', 'nba', 'nhl', 'mlb'] as Sport[]).map(sport => {
      const sportPicks = settled.filter(p => p.sport === sport)
      const sportWins = sportPicks.filter(p => p.result === 'win').length
      const sportLosses = sportPicks.filter(p => p.result === 'loss').length
      const sportProfit = sportPicks.reduce((sum, p) => sum + p.profit, 0)
      return {
        sport,
        record: `${sportWins}-${sportLosses}`,
        profit: sportProfit,
        winRate: (sportWins + sportLosses) > 0 ? (sportWins / (sportWins + sportLosses)) * 100 : 0,
      }
    }).filter(s => s.record !== '0-0')

    // By bet type breakdown
    const byBetType = (['spread', 'moneyline', 'total', 'prop', 'parlay'] as BetType[]).map(betType => {
      const typePicks = settled.filter(p => p.betType === betType)
      const typeWins = typePicks.filter(p => p.result === 'win').length
      const typeLosses = typePicks.filter(p => p.result === 'loss').length
      const typeProfit = typePicks.reduce((sum, p) => sum + p.profit, 0)
      return {
        betType,
        record: `${typeWins}-${typeLosses}`,
        profit: typeProfit,
        winRate: (typeWins + typeLosses) > 0 ? (typeWins / (typeWins + typeLosses)) * 100 : 0,
      }
    }).filter(t => t.record !== '0-0')

    // Streak calculation
    const sortedSettled = [...settled].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    let currentStreak = 0
    let streakType: 'W' | 'L' | null = null
    for (const pick of sortedSettled) {
      if (pick.result === 'push') continue
      if (streakType === null) {
        streakType = pick.result === 'win' ? 'W' : 'L'
        currentStreak = 1
      } else if ((pick.result === 'win' && streakType === 'W') || (pick.result === 'loss' && streakType === 'L')) {
        currentStreak++
      } else {
        break
      }
    }

    return {
      totalPicks: timeFiltered.length,
      pendingPicks: timeFiltered.filter(p => p.result === 'pending').length,
      record: `${wins}-${losses}-${pushes}`,
      wins,
      losses,
      pushes,
      totalProfit,
      totalStaked,
      roi,
      winRate,
      bySport,
      byBetType,
      currentStreak,
      streakType: streakType || 'W',
      avgStake: settled.length > 0 ? totalStaked / settled.length : 0,
      avgOdds: settled.length > 0 ? settled.reduce((sum, p) => sum + p.odds, 0) / settled.length : -110,
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [picks, timeRange])

  // Filtered and sorted picks
  const filteredPicks = useMemo(() => {
    let result = getTimeFilteredPicks(picks)
    
    if (filterSport !== 'all') {
      result = result.filter(p => p.sport === filterSport)
    }
    if (filterBetType !== 'all') {
      result = result.filter(p => p.betType === filterBetType)
    }
    if (filterResult !== 'all') {
      result = result.filter(p => p.result === filterResult)
    }

    result.sort((a, b) => {
      let comparison = 0
      switch (sortBy) {
        case 'date':
          comparison = new Date(a.date).getTime() - new Date(b.date).getTime()
          break
        case 'stake':
          comparison = a.stake - b.stake
          break
        case 'profit':
          comparison = a.profit - b.profit
          break
      }
      return sortOrder === 'asc' ? comparison : -comparison
    })

    return result
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [picks, filterSport, filterBetType, filterResult, sortBy, sortOrder, timeRange])

  const addPick = () => {
    if (!newPick.matchup || !newPick.pick) return
    
    const pick: UserPick = {
      id: `pick-${Date.now()}`,
      date: newPick.date || new Date().toISOString().split('T')[0],
      sport: newPick.sport as Sport,
      betType: newPick.betType as BetType,
      matchup: newPick.matchup,
      pick: newPick.pick,
      odds: newPick.odds || -110,
      stake: newPick.stake || 100,
      result: newPick.result as PickResult || 'pending',
      profit: 0,
      notes: newPick.notes,
    }

    // Calculate profit if not pending
    if (pick.result === 'win') {
      pick.profit = pick.odds > 0 ? (pick.stake * pick.odds / 100) : (pick.stake * 100 / Math.abs(pick.odds))
    } else if (pick.result === 'loss') {
      pick.profit = -pick.stake
    }

    setPicks(prev => [pick, ...prev])
    setShowAddModal(false)
    setNewPick({
      sport: 'nfl',
      betType: 'spread',
      odds: -110,
      stake: 100,
      result: 'pending',
    })
  }

  const deletePick = (id: string) => {
    setPicks(prev => prev.filter(p => p.id !== id))
  }

  const updatePickResult = (id: string, result: PickResult) => {
    setPicks(prev => prev.map(p => {
      if (p.id !== id) return p
      let profit = 0
      if (result === 'win') {
        profit = p.odds > 0 ? (p.stake * p.odds / 100) : (p.stake * 100 / Math.abs(p.odds))
      } else if (result === 'loss') {
        profit = -p.stake
      }
      return { ...p, result, profit }
    }))
  }

  return (
    <main className="min-h-screen" style={{ background: '#06060c' }}>
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3" style={{ color: '#FFF' }}>
              <Target style={{ color: '#FF6B00', width: '32px', height: '32px' }} />
              My Picks Tracker
            </h1>
            <p style={{ color: '#808090' }}>
              Track your bets, analyze performance, and improve your edge
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-5 py-3 rounded-lg font-bold transition-all hover:scale-105"
            style={{ background: '#FF6B00', color: '#FFF' }}
          >
            <Plus style={{ width: '20px', height: '20px' }} />
            Log New Pick
          </button>
        </div>

        {/* Time Range Selector */}
        <div className="flex gap-2 mb-6">
          {(['week', 'month', 'year', 'all'] as const).map(range => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className="px-4 py-2 rounded-lg text-sm font-semibold transition-all"
              style={{
                background: timeRange === range ? '#FF6B00' : 'rgba(255,255,255,0.05)',
                color: timeRange === range ? '#FFF' : '#808090',
              }}
            >
              {range === 'week' ? 'This Week' : range === 'month' ? 'This Month' : range === 'year' ? 'This Year' : 'All Time'}
            </button>
          ))}
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
          <div className="rounded-xl p-4" style={{ background: '#0c0c14', border: '1px solid rgba(255,255,255,0.06)' }}>
            <p className="text-xs mb-1" style={{ color: '#606070' }}>Record</p>
            <p className="text-2xl font-bold" style={{ color: '#FFF' }}>{stats.record}</p>
            <p className="text-xs" style={{ color: stats.winRate >= 52 ? '#00FF88' : '#FF4455' }}>
              {stats.winRate.toFixed(1)}% win rate
            </p>
          </div>
          <div className="rounded-xl p-4" style={{ background: '#0c0c14', border: '1px solid rgba(255,255,255,0.06)' }}>
            <p className="text-xs mb-1" style={{ color: '#606070' }}>Profit/Loss</p>
            <p className="text-2xl font-bold" style={{ color: stats.totalProfit >= 0 ? '#00FF88' : '#FF4455' }}>
              {stats.totalProfit >= 0 ? '+' : ''}${stats.totalProfit.toFixed(0)}
            </p>
            <p className="text-xs" style={{ color: stats.roi >= 0 ? '#00FF88' : '#FF4455' }}>
              {stats.roi >= 0 ? '+' : ''}{stats.roi.toFixed(1)}% ROI
            </p>
          </div>
          <div className="rounded-xl p-4" style={{ background: '#0c0c14', border: '1px solid rgba(255,255,255,0.06)' }}>
            <p className="text-xs mb-1" style={{ color: '#606070' }}>Current Streak</p>
            <p className="text-2xl font-bold" style={{ color: stats.streakType === 'W' ? '#00FF88' : '#FF4455' }}>
              {stats.streakType}{stats.currentStreak}
            </p>
            <p className="text-xs" style={{ color: '#808090' }}>
              {stats.streakType === 'W' ? 'Keep it going!' : 'Stay disciplined'}
            </p>
          </div>
          <div className="rounded-xl p-4" style={{ background: '#0c0c14', border: '1px solid rgba(255,255,255,0.06)' }}>
            <p className="text-xs mb-1" style={{ color: '#606070' }}>Total Staked</p>
            <p className="text-2xl font-bold" style={{ color: '#FFF' }}>${stats.totalStaked.toFixed(0)}</p>
            <p className="text-xs" style={{ color: '#808090' }}>
              Avg: ${stats.avgStake.toFixed(0)}/bet
            </p>
          </div>
          <div className="rounded-xl p-4" style={{ background: '#0c0c14', border: '1px solid rgba(255,255,255,0.06)' }}>
            <p className="text-xs mb-1" style={{ color: '#606070' }}>Total Picks</p>
            <p className="text-2xl font-bold" style={{ color: '#FFF' }}>{stats.totalPicks}</p>
            <p className="text-xs" style={{ color: '#FF6B00' }}>
              {stats.pendingPicks} pending
            </p>
          </div>
          <div className="rounded-xl p-4" style={{ background: '#0c0c14', border: '1px solid rgba(255,255,255,0.06)' }}>
            <p className="text-xs mb-1" style={{ color: '#606070' }}>Avg Odds</p>
            <p className="text-2xl font-bold" style={{ color: '#FFF' }}>
              {stats.avgOdds > 0 ? '+' : ''}{stats.avgOdds.toFixed(0)}
            </p>
            <p className="text-xs" style={{ color: '#808090' }}>
              per bet
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Picks List */}
          <div className="lg:col-span-2 space-y-6">
            {/* Filters */}
            <div className="flex flex-wrap gap-3 items-center">
              <div className="flex items-center gap-2">
                <Filter style={{ width: '16px', height: '16px', color: '#808090' }} />
                <select
                  value={filterSport}
                  onChange={(e) => setFilterSport(e.target.value as Sport | 'all')}
                  className="px-3 py-2 rounded-lg text-sm"
                  style={{ background: 'rgba(255,255,255,0.05)', color: '#FFF', border: 'none' }}
                >
                  <option value="all">All Sports</option>
                  <option value="nfl">NFL</option>
                  <option value="nba">NBA</option>
                  <option value="nhl">NHL</option>
                  <option value="mlb">MLB</option>
                </select>
              </div>
              <select
                value={filterBetType}
                onChange={(e) => setFilterBetType(e.target.value as BetType | 'all')}
                className="px-3 py-2 rounded-lg text-sm"
                style={{ background: 'rgba(255,255,255,0.05)', color: '#FFF', border: 'none' }}
              >
                <option value="all">All Types</option>
                <option value="spread">Spread</option>
                <option value="moneyline">Moneyline</option>
                <option value="total">Total</option>
                <option value="prop">Prop</option>
                <option value="parlay">Parlay</option>
              </select>
              <select
                value={filterResult}
                onChange={(e) => setFilterResult(e.target.value as PickResult | 'all')}
                className="px-3 py-2 rounded-lg text-sm"
                style={{ background: 'rgba(255,255,255,0.05)', color: '#FFF', border: 'none' }}
              >
                <option value="all">All Results</option>
                <option value="pending">Pending</option>
                <option value="win">Wins</option>
                <option value="loss">Losses</option>
                <option value="push">Pushes</option>
              </select>
              <div className="ml-auto flex items-center gap-2">
                <button
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="p-2 rounded-lg"
                  style={{ background: 'rgba(255,255,255,0.05)' }}
                >
                  {sortOrder === 'desc' ? 
                    <ChevronDown style={{ width: '16px', height: '16px', color: '#808090' }} /> :
                    <ChevronUp style={{ width: '16px', height: '16px', color: '#808090' }} />
                  }
                </button>
              </div>
            </div>

            {/* Picks List */}
            <div className="space-y-3">
              {filteredPicks.map(pick => (
                <div
                  key={pick.id}
                  className="rounded-xl p-4 transition-all hover:scale-[1.01]"
                  style={{ 
                    background: '#0c0c14', 
                    border: `1px solid ${pick.result === 'pending' ? 'rgba(255,107,0,0.3)' : 'rgba(255,255,255,0.06)'}` 
                  }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span 
                          className="px-2 py-0.5 rounded text-xs font-bold uppercase"
                          style={{ background: `${sportColors[pick.sport]}20`, color: sportColors[pick.sport] }}
                        >
                          {pick.sport}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded" 
                              style={{ background: 'rgba(255,255,255,0.05)', color: '#808090' }}>
                          {pick.betType}
                        </span>
                        <span className="text-xs" style={{ color: '#606070' }}>{pick.date}</span>
                      </div>
                      <p className="text-sm font-semibold mb-1" style={{ color: '#FFF' }}>{pick.pick}</p>
                      <p className="text-xs" style={{ color: '#808090' }}>{pick.matchup}</p>
                      {pick.notes && (
                        <p className="text-xs mt-2 italic" style={{ color: '#606070' }}>📝 {pick.notes}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-2 mb-2">
                        {pick.result === 'win' ? (
                          <CheckCircle style={{ color: '#00FF88', width: '20px', height: '20px' }} />
                        ) : pick.result === 'loss' ? (
                          <XCircle style={{ color: '#FF4455', width: '20px', height: '20px' }} />
                        ) : pick.result === 'push' ? (
                          <AlertCircle style={{ color: '#808090', width: '20px', height: '20px' }} />
                        ) : (
                          <Clock style={{ color: '#FF6B00', width: '20px', height: '20px' }} />
                        )}
                        <span className="text-lg font-bold"
                              style={{ color: pick.profit > 0 ? '#00FF88' : pick.profit < 0 ? '#FF4455' : '#808090' }}>
                          {pick.profit > 0 ? '+' : ''}{pick.profit !== 0 ? `$${pick.profit.toFixed(0)}` : '-'}
                        </span>
                      </div>
                      <p className="text-xs" style={{ color: '#808090' }}>
                        ${pick.stake} @ {pick.odds > 0 ? '+' : ''}{pick.odds}
                      </p>
                      
                      {/* Quick result buttons for pending picks */}
                      {pick.result === 'pending' && (
                        <div className="flex gap-1 mt-2">
                          <button
                            onClick={() => updatePickResult(pick.id, 'win')}
                            className="px-2 py-1 rounded text-xs font-bold"
                            style={{ background: 'rgba(0,255,136,0.2)', color: '#00FF88' }}
                          >
                            W
                          </button>
                          <button
                            onClick={() => updatePickResult(pick.id, 'loss')}
                            className="px-2 py-1 rounded text-xs font-bold"
                            style={{ background: 'rgba(255,68,85,0.2)', color: '#FF4455' }}
                          >
                            L
                          </button>
                          <button
                            onClick={() => updatePickResult(pick.id, 'push')}
                            className="px-2 py-1 rounded text-xs font-bold"
                            style={{ background: 'rgba(128,128,144,0.2)', color: '#808090' }}
                          >
                            P
                          </button>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => deletePick(pick.id)}
                      className="p-2 rounded-lg opacity-50 hover:opacity-100 transition-opacity"
                      style={{ background: 'rgba(255,68,85,0.1)' }}
                    >
                      <Trash2 style={{ width: '14px', height: '14px', color: '#FF4455' }} />
                    </button>
                  </div>
                </div>
              ))}
              
              {filteredPicks.length === 0 && (
                <div className="text-center py-12 rounded-xl" style={{ background: '#0c0c14' }}>
                  <Target style={{ width: '48px', height: '48px', color: '#606070', margin: '0 auto 16px' }} />
                  <p style={{ color: '#808090' }}>No picks found</p>
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="mt-4 px-4 py-2 rounded-lg text-sm font-semibold"
                    style={{ background: 'rgba(255,107,0,0.2)', color: '#FF6B00' }}
                  >
                    Log your first pick
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar - Analytics */}
          <div className="space-y-6">
            {/* Performance by Sport */}
            <div className="rounded-xl p-5" style={{ background: '#0c0c14', border: '1px solid rgba(255,255,255,0.06)' }}>
              <h3 className="flex items-center gap-2 text-lg font-bold mb-4" style={{ color: '#FFF' }}>
                <BarChart3 style={{ color: '#FF6B00', width: '18px', height: '18px' }} />
                By Sport
              </h3>
              <div className="space-y-3">
                {stats.bySport.map(item => (
                  <div key={item.sport} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase" style={{ color: sportColors[item.sport] }}>
                        {item.sport}
                      </span>
                      <span className="text-xs" style={{ color: '#808090' }}>{item.record}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs" style={{ color: item.winRate >= 52 ? '#00FF88' : '#FFF' }}>
                        {item.winRate.toFixed(0)}%
                      </span>
                      <span className="text-sm font-bold" style={{ color: item.profit >= 0 ? '#00FF88' : '#FF4455' }}>
                        {item.profit >= 0 ? '+' : ''}${item.profit.toFixed(0)}
                      </span>
                    </div>
                  </div>
                ))}
                {stats.bySport.length === 0 && (
                  <p className="text-xs text-center py-4" style={{ color: '#606070' }}>No data yet</p>
                )}
              </div>
            </div>

            {/* Performance by Bet Type */}
            <div className="rounded-xl p-5" style={{ background: '#0c0c14', border: '1px solid rgba(255,255,255,0.06)' }}>
              <h3 className="flex items-center gap-2 text-lg font-bold mb-4" style={{ color: '#FFF' }}>
                <PieChart style={{ color: '#00FF88', width: '18px', height: '18px' }} />
                By Bet Type
              </h3>
              <div className="space-y-3">
                {stats.byBetType.map(item => (
                  <div key={item.betType} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold capitalize" style={{ color: '#FFF' }}>
                        {item.betType}
                      </span>
                      <span className="text-xs" style={{ color: '#808090' }}>{item.record}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs" style={{ color: item.winRate >= 52 ? '#00FF88' : '#FFF' }}>
                        {item.winRate.toFixed(0)}%
                      </span>
                      <span className="text-sm font-bold" style={{ color: item.profit >= 0 ? '#00FF88' : '#FF4455' }}>
                        {item.profit >= 0 ? '+' : ''}${item.profit.toFixed(0)}
                      </span>
                    </div>
                  </div>
                ))}
                {stats.byBetType.length === 0 && (
                  <p className="text-xs text-center py-4" style={{ color: '#606070' }}>No data yet</p>
                )}
              </div>
            </div>

            {/* Quick Tips */}
            <div className="rounded-xl p-5" style={{ background: '#0c0c14', border: '1px solid rgba(255,255,255,0.06)' }}>
              <h3 className="flex items-center gap-2 text-lg font-bold mb-4" style={{ color: '#FFF' }}>
                <Zap style={{ color: '#FFD700', width: '18px', height: '18px' }} />
                Insights
              </h3>
              <div className="space-y-3 text-sm" style={{ color: '#A0A0B0' }}>
                {stats.winRate > 52 && (
                  <p>🎯 Your {stats.winRate.toFixed(1)}% win rate beats the break-even threshold!</p>
                )}
                {stats.roi > 5 && (
                  <p>💰 Strong {stats.roi.toFixed(1)}% ROI - keep up the discipline!</p>
                )}
                {stats.currentStreak >= 3 && stats.streakType === 'W' && (
                  <p>🔥 {stats.currentStreak} game win streak! Don&apos;t get overconfident.</p>
                )}
                {stats.currentStreak >= 3 && stats.streakType === 'L' && (
                  <p>❄️ {stats.currentStreak} game losing streak. Consider reducing stake sizes.</p>
                )}
                {stats.bySport.length > 0 && (
                  <p>⭐ Best sport: {stats.bySport.reduce((best, curr) => curr.winRate > best.winRate ? curr : best).sport.toUpperCase()}</p>
                )}
              </div>
            </div>

            {/* Quick Links */}
            <div className="rounded-xl p-5" style={{ background: '#0c0c14', border: '1px solid rgba(255,255,255,0.06)' }}>
              <h3 className="text-lg font-bold mb-4" style={{ color: '#FFF' }}>Tools</h3>
              <div className="space-y-2">
                <Link href="/calculators" className="flex items-center justify-between p-3 rounded-lg transition-all hover:scale-[1.02]"
                      style={{ background: 'rgba(255,255,255,0.03)' }}>
                  <span className="text-sm" style={{ color: '#FFF' }}>Betting Calculators</span>
                  <ArrowRight style={{ width: '14px', height: '14px', color: '#808090' }} />
                </Link>
                <Link href="/systems" className="flex items-center justify-between p-3 rounded-lg transition-all hover:scale-[1.02]"
                      style={{ background: 'rgba(255,255,255,0.03)' }}>
                  <span className="text-sm" style={{ color: '#FFF' }}>System Builder</span>
                  <ArrowRight style={{ width: '14px', height: '14px', color: '#808090' }} />
                </Link>
                <Link href="/trends" className="flex items-center justify-between p-3 rounded-lg transition-all hover:scale-[1.02]"
                      style={{ background: 'rgba(255,255,255,0.03)' }}>
                  <span className="text-sm" style={{ color: '#FFF' }}>Betting Trends</span>
                  <ArrowRight style={{ width: '14px', height: '14px', color: '#808090' }} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Pick Modal */}
      {showAddModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{ background: 'rgba(0,0,0,0.8)' }}>
          <div className="rounded-xl p-6 w-full max-w-md mx-4" style={{ background: '#0c0c14', border: '1px solid rgba(255,107,0,0.3)' }}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold" style={{ color: '#FFF' }}>Log New Pick</h2>
              <button onClick={() => setShowAddModal(false)} className="p-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.1)' }}>
                <X style={{ width: '20px', height: '20px', color: '#808090' }} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-2" style={{ color: '#808090' }}>Sport</label>
                  <select
                    value={newPick.sport}
                    onChange={(e) => setNewPick(prev => ({ ...prev, sport: e.target.value as Sport }))}
                    className="w-full px-3 py-2 rounded-lg"
                    style={{ background: 'rgba(255,255,255,0.05)', color: '#FFF', border: 'none' }}
                  >
                    <option value="nfl">NFL</option>
                    <option value="nba">NBA</option>
                    <option value="nhl">NHL</option>
                    <option value="mlb">MLB</option>
                    <option value="ncaaf">NCAAF</option>
                    <option value="ncaab">NCAAB</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-2" style={{ color: '#808090' }}>Bet Type</label>
                  <select
                    value={newPick.betType}
                    onChange={(e) => setNewPick(prev => ({ ...prev, betType: e.target.value as BetType }))}
                    className="w-full px-3 py-2 rounded-lg"
                    style={{ background: 'rgba(255,255,255,0.05)', color: '#FFF', border: 'none' }}
                  >
                    <option value="spread">Spread</option>
                    <option value="moneyline">Moneyline</option>
                    <option value="total">Total</option>
                    <option value="prop">Prop</option>
                    <option value="parlay">Parlay</option>
                    <option value="teaser">Teaser</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-semibold mb-2" style={{ color: '#808090' }}>Matchup</label>
                <input
                  type="text"
                  placeholder="e.g., DET Lions vs MIN Vikings"
                  value={newPick.matchup || ''}
                  onChange={(e) => setNewPick(prev => ({ ...prev, matchup: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg"
                  style={{ background: 'rgba(255,255,255,0.05)', color: '#FFF', border: 'none' }}
                />
              </div>
              
              <div>
                <label className="block text-xs font-semibold mb-2" style={{ color: '#808090' }}>Your Pick</label>
                <input
                  type="text"
                  placeholder="e.g., DET -3.5"
                  value={newPick.pick || ''}
                  onChange={(e) => setNewPick(prev => ({ ...prev, pick: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg"
                  style={{ background: 'rgba(255,255,255,0.05)', color: '#FFF', border: 'none' }}
                />
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-2" style={{ color: '#808090' }}>Odds</label>
                  <input
                    type="number"
                    value={newPick.odds}
                    onChange={(e) => setNewPick(prev => ({ ...prev, odds: parseInt(e.target.value) || -110 }))}
                    className="w-full px-3 py-2 rounded-lg"
                    style={{ background: 'rgba(255,255,255,0.05)', color: '#FFF', border: 'none' }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-2" style={{ color: '#808090' }}>Stake ($)</label>
                  <input
                    type="number"
                    value={newPick.stake}
                    onChange={(e) => setNewPick(prev => ({ ...prev, stake: parseInt(e.target.value) || 100 }))}
                    className="w-full px-3 py-2 rounded-lg"
                    style={{ background: 'rgba(255,255,255,0.05)', color: '#FFF', border: 'none' }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-2" style={{ color: '#808090' }}>Result</label>
                  <select
                    value={newPick.result}
                    onChange={(e) => setNewPick(prev => ({ ...prev, result: e.target.value as PickResult }))}
                    className="w-full px-3 py-2 rounded-lg"
                    style={{ background: 'rgba(255,255,255,0.05)', color: '#FFF', border: 'none' }}
                  >
                    <option value="pending">Pending</option>
                    <option value="win">Win</option>
                    <option value="loss">Loss</option>
                    <option value="push">Push</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-semibold mb-2" style={{ color: '#808090' }}>Notes (optional)</label>
                <input
                  type="text"
                  placeholder="e.g., Sharp money, revenge game..."
                  value={newPick.notes || ''}
                  onChange={(e) => setNewPick(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg"
                  style={{ background: 'rgba(255,255,255,0.05)', color: '#FFF', border: 'none' }}
                />
              </div>
              
              <button
                onClick={addPick}
                disabled={!newPick.matchup || !newPick.pick}
                className="w-full py-3 rounded-lg font-bold flex items-center justify-center gap-2"
                style={{ 
                  background: (!newPick.matchup || !newPick.pick) ? 'rgba(255,107,0,0.3)' : '#FF6B00', 
                  color: '#FFF',
                  opacity: (!newPick.matchup || !newPick.pick) ? 0.5 : 1
                }}
              >
                <Save style={{ width: '18px', height: '18px' }} />
                Save Pick
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
