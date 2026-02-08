'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import Link from 'next/link'
import {
  Target,
  Plus,
  Filter,
  Trophy,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  XCircle,
  MinusCircle,
  User,
  ChevronDown,
  X,
  Loader2
} from 'lucide-react'

interface Pick {
  id: string
  capper: {
    id: string
    username: string
    displayName: string
    avatar: string | null
    isVerified: boolean
    isPro: boolean
  }
  game: {
    id: string
    homeTeam: string
    awayTeam: string
    gameTime: string
    status: string
    score: string | null
  } | null
  sport: string
  pickType: string
  selection: string
  odds: number
  units: number
  confidence: string
  analysis: string | null
  result: 'pending' | 'won' | 'lost' | 'push'
  createdAt: string
}

const SPORTS = ['all', 'nfl', 'nba', 'nhl', 'mlb', 'ncaaf', 'ncaab']
const STATUSES = ['all', 'pending', 'won', 'lost', 'push']
const PICK_TYPES = ['spread', 'moneyline', 'total', 'prop', 'parlay']

export default function PicksPage() {
  const { user } = useAuth()
  const [picks, setPicks] = useState<Pick[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSport, setSelectedSport] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [showCreateModal, setShowCreateModal] = useState(false)

  // Create pick form state
  const [newPick, setNewPick] = useState({
    sport: 'nfl',
    pickType: 'spread',
    selection: '',
    odds: '-110',
    units: '1',
    analysis: '',
    confidence: 'medium',
  })

  // Fetch picks from API
  useEffect(() => {
    const fetchPicks = async () => {
      setLoading(true)
      try {
        const params = new URLSearchParams()
        if (selectedSport !== 'all') params.set('sport', selectedSport)
        if (selectedStatus !== 'all') params.set('status', selectedStatus)
        params.set('limit', '100')
        
        const res = await fetch(`/api/picks?${params.toString()}`)
        if (res.ok) {
          const data = await res.json()
          // Transform API response to match component interface
          const transformedPicks: Pick[] = (data.picks || []).map((p: any) => ({
            id: p.id,
            capper: p.capper ? {
              id: p.capper.id,
              username: p.capper.slug || p.capper.name?.toLowerCase().replace(/\s+/g, '_') || 'unknown',
              displayName: p.capper.name || 'Unknown Capper',
              avatar: p.capper.avatarUrl || p.capper.avatarEmoji || null,
              isVerified: p.capper.verified || false,
              isPro: p.capper.capperType === 'pro',
            } : {
              id: 'unknown',
              username: 'unknown',
              displayName: 'Unknown',
              avatar: null,
              isVerified: false,
              isPro: false,
            },
            game: p.game ? {
              id: p.game.id,
              homeTeam: p.game.homeTeam || 'TBD',
              awayTeam: p.game.awayTeam || 'TBD',
              gameTime: p.game.scheduledAt,
              status: p.game.status,
              score: p.game.score,
            } : null,
            sport: p.sport,
            pickType: p.pickType,
            selection: p.selection,
            odds: p.odds,
            units: p.units,
            confidence: p.confidence,
            analysis: p.analysis,
            result: p.result as Pick['result'],
            createdAt: p.createdAt,
          }))
          setPicks(transformedPicks)
        }
      } catch (error) {
        console.error('Failed to fetch picks:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchPicks()
  }, [selectedSport, selectedStatus])

  const filteredPicks = picks // Already filtered by API

  const stats = {
    total: picks.length,
    won: picks.filter(p => p.result === 'won').length,
    lost: picks.filter(p => p.result === 'lost').length,
    pending: picks.filter(p => p.result === 'pending').length,
    winRate: picks.filter(p => p.result !== 'pending' && p.result !== 'push').length > 0
      ? Math.round((picks.filter(p => p.result === 'won').length / picks.filter(p => p.result !== 'pending' && p.result !== 'push').length) * 100)
      : 0,
  }

  const formatOdds = (odds: number) => {
    return odds > 0 ? `+${odds}` : `${odds}`
  }

  const getResultIcon = (result: string) => {
    switch (result) {
      case 'won': return <CheckCircle className="w-5 h-5" style={{ color: '#00FF88' }} />
      case 'lost': return <XCircle className="w-5 h-5" style={{ color: '#FF3366' }} />
      case 'push': return <MinusCircle className="w-5 h-5" style={{ color: '#FFD700' }} />
      default: return <Clock className="w-5 h-5" style={{ color: '#808090' }} />
    }
  }

  const getResultColor = (result: string) => {
    switch (result) {
      case 'won': return '#00FF88'
      case 'lost': return '#FF3366'
      case 'push': return '#FFD700'
      default: return '#808090'
    }
  }

  const handleCreatePick = async () => {
    if (!newPick.selection || !newPick.odds) {
      alert('Please fill in all required fields')
      return
    }

    try {
      const res = await fetch('/api/picks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sport: newPick.sport,
          pick_type: newPick.pickType,
          selection: newPick.selection,
          odds: newPick.odds,
          units: newPick.units,
          analysis: newPick.analysis,
          confidence: newPick.confidence,
        }),
      })

      if (res.ok) {
        // Refresh picks list
        const refreshRes = await fetch(`/api/picks?limit=100`)
        if (refreshRes.ok) {
          const data = await refreshRes.json()
          const transformedPicks: Pick[] = (data.picks || []).map((p: any) => ({
            id: p.id,
            capper: p.capper ? {
              id: p.capper.id,
              username: p.capper.slug || 'unknown',
              displayName: p.capper.name || 'Unknown',
              avatar: p.capper.avatarUrl || null,
              isVerified: p.capper.verified || false,
              isPro: p.capper.capperType === 'pro',
            } : { id: 'unknown', username: 'unknown', displayName: 'Unknown', avatar: null, isVerified: false, isPro: false },
            game: p.game ? {
              id: p.game.id,
              homeTeam: p.game.homeTeam || 'TBD',
              awayTeam: p.game.awayTeam || 'TBD',
              gameTime: p.game.scheduledAt,
              status: p.game.status,
              score: p.game.score,
            } : null,
            sport: p.sport,
            pickType: p.pickType,
            selection: p.selection,
            odds: p.odds,
            units: p.units,
            confidence: p.confidence,
            analysis: p.analysis,
            result: p.result as Pick['result'],
            createdAt: p.createdAt,
          }))
          setPicks(transformedPicks)
        }
        setShowCreateModal(false)
        setNewPick({
          sport: 'nfl',
          pickType: 'spread',
          selection: '',
          odds: '-110',
          units: '1',
          analysis: '',
          confidence: 'medium',
        })
      } else {
        const error = await res.json()
        alert(error.error || 'Failed to create pick. Please sign in and try again.')
      }
    } catch (error) {
      console.error('Failed to create pick:', error)
      alert('Failed to create pick. Please try again.')
    }
  }

  return (
    <div className="min-h-screen" style={{ background: '#0A0A0F' }}>
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-xl" style={{ background: 'linear-gradient(135deg, #FF6B00, #FF3366)' }}>
                <Target className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-black text-white">My Picks</h1>
                <p style={{ color: '#808090' }} className="text-sm">Track your bets and build your record</p>
              </div>
            </div>
          </div>
          
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all hover:scale-105"
            style={{ background: 'linear-gradient(135deg, #00FF88, #00A8FF)', color: '#000' }}
          >
            <Plus className="w-5 h-5" />
            Log Pick
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <div className="p-4 rounded-xl" style={{ background: '#12121A' }}>
            <p className="text-sm" style={{ color: '#808090' }}>Total Picks</p>
            <p className="text-2xl font-bold text-white">{stats.total}</p>
          </div>
          <div className="p-4 rounded-xl" style={{ background: 'rgba(0,255,136,0.1)' }}>
            <p className="text-sm" style={{ color: '#00FF88' }}>Won</p>
            <p className="text-2xl font-bold" style={{ color: '#00FF88' }}>{stats.won}</p>
          </div>
          <div className="p-4 rounded-xl" style={{ background: 'rgba(255,51,102,0.1)' }}>
            <p className="text-sm" style={{ color: '#FF3366' }}>Lost</p>
            <p className="text-2xl font-bold" style={{ color: '#FF3366' }}>{stats.lost}</p>
          </div>
          <div className="p-4 rounded-xl" style={{ background: '#12121A' }}>
            <p className="text-sm" style={{ color: '#808090' }}>Pending</p>
            <p className="text-2xl font-bold text-white">{stats.pending}</p>
          </div>
          <div className="p-4 rounded-xl" style={{ background: 'linear-gradient(135deg, rgba(255,107,0,0.2), rgba(255,51,102,0.2))' }}>
            <p className="text-sm" style={{ color: '#FF6B00' }}>Win Rate</p>
            <p className="text-2xl font-bold text-white">{stats.winRate}%</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="flex gap-2">
            {SPORTS.map((sport) => (
              <button
                key={sport}
                onClick={() => setSelectedSport(sport)}
                className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all uppercase"
                style={{
                  background: selectedSport === sport ? '#FF6B00' : '#12121A',
                  color: selectedSport === sport ? '#FFF' : '#808090'
                }}
              >
                {sport}
              </button>
            ))}
          </div>
          <div className="flex gap-2 ml-auto">
            {STATUSES.map((status) => (
              <button
                key={status}
                onClick={() => setSelectedStatus(status)}
                className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all capitalize"
                style={{
                  background: selectedStatus === status ? '#00A8FF' : '#12121A',
                  color: selectedStatus === status ? '#FFF' : '#808090'
                }}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Picks List */}
        <div className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#00A8FF' }} />
            </div>
          ) : filteredPicks.length === 0 ? (
            <div className="text-center py-16 rounded-xl" style={{ background: '#12121A' }}>
              <Target className="w-12 h-12 mx-auto mb-4" style={{ color: '#808090' }} />
              <p className="text-white font-semibold mb-2">No picks found</p>
              <p style={{ color: '#808090' }} className="text-sm">
                {user ? 'Click "Log Pick" to record your first bet' : 'Sign in to track your betting history'}
              </p>
            </div>
          ) : filteredPicks.map((pick) => (
            <div
              key={pick.id}
              className="rounded-xl p-4"
              style={{ background: '#12121A', border: `1px solid ${getResultColor(pick.result)}20` }}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: '#0A0A0F' }}>
                    {pick.capper.avatar ? (
                      <img src={pick.capper.avatar} alt="" className="w-10 h-10 rounded-full" />
                    ) : (
                      <User className="w-5 h-5" style={{ color: '#808090' }} />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white">{pick.capper.displayName}</span>
                      {pick.capper.isVerified && (
                        <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: '#00A8FF20', color: '#00A8FF' }}>✓</span>
                      )}
                      {pick.capper.isPro && (
                        <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: '#FFD70020', color: '#FFD700' }}>PRO</span>
                      )}
                    </div>
                    <p className="text-xs" style={{ color: '#808090' }}>
                      {new Date(pick.createdAt).toLocaleDateString()} • {pick.sport.toUpperCase()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getResultIcon(pick.result)}
                  <span className="text-sm font-medium capitalize" style={{ color: getResultColor(pick.result) }}>
                    {pick.result}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4 mb-3">
                <div className="px-4 py-2 rounded-xl" style={{ background: '#0A0A0F' }}>
                  <p className="text-lg font-bold text-white">{pick.selection}</p>
                  <p className="text-xs" style={{ color: '#808090' }}>{pick.pickType}</p>
                </div>
                <div className="px-4 py-2 rounded-xl text-center" style={{ background: '#0A0A0F' }}>
                  <p className="text-lg font-bold" style={{ color: pick.odds > 0 ? '#00FF88' : '#FF6B00' }}>
                    {formatOdds(pick.odds)}
                  </p>
                  <p className="text-xs" style={{ color: '#808090' }}>odds</p>
                </div>
                <div className="px-4 py-2 rounded-xl text-center" style={{ background: '#0A0A0F' }}>
                  <p className="text-lg font-bold text-white">{pick.units}u</p>
                  <p className="text-xs" style={{ color: '#808090' }}>stake</p>
                </div>
                <div className="px-3 py-1 rounded-full text-xs font-medium uppercase"
                  style={{
                    background: pick.confidence === 'high' ? '#00FF8820' : pick.confidence === 'medium' ? '#FFD70020' : '#80809020',
                    color: pick.confidence === 'high' ? '#00FF88' : pick.confidence === 'medium' ? '#FFD700' : '#808090'
                  }}
                >
                  {pick.confidence} confidence
                </div>
              </div>

              {pick.analysis && (
                <p className="text-sm" style={{ color: '#808090' }}>
                  💡 {pick.analysis}
                </p>
              )}

              {pick.game && (
                <div className="mt-3 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                  <p className="text-sm text-white">
                    {pick.game.awayTeam} @ {pick.game.homeTeam}
                    {pick.game.score && <span className="ml-2" style={{ color: '#808090' }}>({pick.game.score})</span>}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Create Pick Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.8)' }}>
          <div className="w-full max-w-lg rounded-2xl p-6" style={{ background: '#12121A' }}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Log New Pick</h2>
              <button onClick={() => setShowCreateModal(false)} className="p-2 rounded-lg hover:bg-white/5">
                <X className="w-5 h-5" style={{ color: '#808090' }} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#808090' }}>Sport</label>
                  <select
                    value={newPick.sport}
                    onChange={(e) => setNewPick({ ...newPick, sport: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl text-white"
                    style={{ background: '#0A0A0F', border: '1px solid rgba(255,255,255,0.1)' }}
                  >
                    {SPORTS.filter(s => s !== 'all').map(sport => (
                      <option key={sport} value={sport}>{sport.toUpperCase()}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#808090' }}>Pick Type</label>
                  <select
                    value={newPick.pickType}
                    onChange={(e) => setNewPick({ ...newPick, pickType: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl text-white capitalize"
                    style={{ background: '#0A0A0F', border: '1px solid rgba(255,255,255,0.1)' }}
                  >
                    {PICK_TYPES.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#808090' }}>Selection *</label>
                <input
                  type="text"
                  value={newPick.selection}
                  onChange={(e) => setNewPick({ ...newPick, selection: e.target.value })}
                  placeholder="e.g., Chiefs -3, Over 228.5, Lakers ML"
                  className="w-full px-4 py-3 rounded-xl text-white"
                  style={{ background: '#0A0A0F', border: '1px solid rgba(255,255,255,0.1)' }}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#808090' }}>Odds *</label>
                  <input
                    type="text"
                    value={newPick.odds}
                    onChange={(e) => setNewPick({ ...newPick, odds: e.target.value })}
                    placeholder="-110"
                    className="w-full px-4 py-3 rounded-xl text-white"
                    style={{ background: '#0A0A0F', border: '1px solid rgba(255,255,255,0.1)' }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#808090' }}>Units</label>
                  <input
                    type="number"
                    value={newPick.units}
                    onChange={(e) => setNewPick({ ...newPick, units: e.target.value })}
                    placeholder="1"
                    min="0.5"
                    step="0.5"
                    className="w-full px-4 py-3 rounded-xl text-white"
                    style={{ background: '#0A0A0F', border: '1px solid rgba(255,255,255,0.1)' }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#808090' }}>Confidence</label>
                <div className="flex gap-2">
                  {['low', 'medium', 'high'].map(conf => (
                    <button
                      key={conf}
                      onClick={() => setNewPick({ ...newPick, confidence: conf })}
                      className="flex-1 px-4 py-2 rounded-xl font-medium capitalize transition-all"
                      style={{
                        background: newPick.confidence === conf 
                          ? conf === 'high' ? '#00FF88' : conf === 'medium' ? '#FFD700' : '#808090'
                          : '#0A0A0F',
                        color: newPick.confidence === conf ? '#000' : '#808090'
                      }}
                    >
                      {conf}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#808090' }}>Analysis (optional)</label>
                <textarea
                  value={newPick.analysis}
                  onChange={(e) => setNewPick({ ...newPick, analysis: e.target.value })}
                  placeholder="Why are you making this pick?"
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl text-white resize-none"
                  style={{ background: '#0A0A0F', border: '1px solid rgba(255,255,255,0.1)' }}
                />
              </div>

              <button
                onClick={handleCreatePick}
                className="w-full py-3 rounded-xl font-bold transition-all hover:scale-105"
                style={{ background: 'linear-gradient(135deg, #00FF88, #00A8FF)', color: '#000' }}
              >
                Log Pick
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
