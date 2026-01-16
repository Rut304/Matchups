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
  X
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

// Mock data for demo
const mockPicks: Pick[] = [
  {
    id: '1',
    capper: { id: '1', username: 'sharp_shooter', displayName: 'Sharp Shooter', avatar: null, isVerified: true, isPro: true },
    game: { id: '1', homeTeam: 'Philadelphia Eagles', awayTeam: 'Washington Commanders', gameTime: '2025-01-26T18:00:00Z', status: 'scheduled', score: null },
    sport: 'nfl',
    pickType: 'spread',
    selection: 'Eagles -6',
    odds: -110,
    units: 2,
    confidence: 'high',
    analysis: 'Eagles swept the season series. Saquon Barkley averaged 145 rushing yards vs Washington.',
    result: 'pending',
    createdAt: '2025-01-25T15:00:00Z',
  },
  {
    id: '2',
    capper: { id: '2', username: 'hoops_king', displayName: 'Hoops King', avatar: null, isVerified: true, isPro: false },
    game: { id: '2', homeTeam: 'Boston Celtics', awayTeam: 'Cleveland Cavaliers', gameTime: '2025-01-25T19:30:00Z', status: 'final', score: '118-102' },
    sport: 'nba',
    pickType: 'total',
    selection: 'Under 224.5',
    odds: -108,
    units: 1.5,
    confidence: 'medium',
    analysis: 'Top defensive teams, both allow under 106 PPG.',
    result: 'won',
    createdAt: '2025-01-25T10:00:00Z',
  },
  {
    id: '3',
    capper: { id: '1', username: 'sharp_shooter', displayName: 'Sharp Shooter', avatar: null, isVerified: true, isPro: true },
    game: { id: '3', homeTeam: 'NY Yankees', awayTeam: 'Boston Red Sox', gameTime: '2025-01-03T18:00:00Z', status: 'final', score: '4-6' },
    sport: 'mlb',
    pickType: 'moneyline',
    selection: 'Yankees ML',
    odds: -145,
    units: 1,
    confidence: 'high',
    analysis: 'Cole on the mound with a 2.89 ERA at home.',
    result: 'lost',
    createdAt: '2025-01-03T12:00:00Z',
  },
]

export default function PicksPage() {
  const { user } = useAuth()
  const [picks, setPicks] = useState<Pick[]>(mockPicks)
  const [loading, setLoading] = useState(false)
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

  const filteredPicks = picks.filter(pick => {
    if (selectedSport !== 'all' && pick.sport !== selectedSport) return false
    if (selectedStatus !== 'all' && pick.result !== selectedStatus) return false
    return true
  })

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

    // In production, this would POST to /api/picks
    const mockNewPick: Pick = {
      id: Date.now().toString(),
      capper: {
        id: user?.id || 'guest',
        username: user?.email?.split('@')[0] || 'guest',
        displayName: user?.email?.split('@')[0] || 'Guest User',
        avatar: null,
        isVerified: false,
        isPro: false,
      },
      game: null,
      sport: newPick.sport,
      pickType: newPick.pickType,
      selection: newPick.selection,
      odds: parseInt(newPick.odds),
      units: parseFloat(newPick.units),
      confidence: newPick.confidence,
      analysis: newPick.analysis || null,
      result: 'pending',
      createdAt: new Date().toISOString(),
    }

    setPicks([mockNewPick, ...picks])
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
          {filteredPicks.map((pick) => (
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

          {filteredPicks.length === 0 && (
            <div className="text-center py-12">
              <Target className="w-12 h-12 mx-auto mb-4" style={{ color: '#808090' }} />
              <p className="text-lg text-white mb-2">No picks found</p>
              <p style={{ color: '#808090' }}>Try adjusting your filters or log a new pick</p>
            </div>
          )}
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
