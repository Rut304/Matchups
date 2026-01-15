'use client'

import { useState, useEffect } from 'react'
import {
  Activity,
  AlertTriangle,
  Clock,
  TrendingUp,
  TrendingDown,
  Filter,
  Search,
  RefreshCw,
  ChevronDown,
  Star,
  UserX,
  Zap
} from 'lucide-react'

interface Injury {
  id: string
  playerName: string
  team: string
  position: string
  sport: 'NFL' | 'NBA' | 'NHL' | 'MLB'
  injuryType: string
  bodyPart: string
  status: 'Out' | 'Doubtful' | 'Questionable' | 'Probable' | 'Day-to-Day' | 'IL' | 'IR'
  impactRating: 1 | 2 | 3 | 4 | 5  // 1 = minimal, 5 = critical
  expectedReturn: string
  lastUpdate: string
  bettingImpact: string
  lineMovement?: {
    before: number
    after: number
    type: 'spread' | 'total' | 'moneyline'
  }
  isStarter: boolean
  isStar: boolean
}

// Helper functions - no mock data needed, fetching from API
const getStatusColor = (status: string) => {
  switch (status) {
    case 'Out':
    case 'IR':
    case 'IL': return '#FF3366'
    case 'Doubtful': return '#FF6B00'
    case 'Questionable':
    case 'Day-to-Day': return '#FFD700'
    case 'Probable': return '#00FF88'
    default: return '#808090'
  }
}

const getImpactBadge = (rating: number) => {
  const colors = {
    1: { bg: '#00FF8820', text: '#00FF88', label: 'Minimal' },
    2: { bg: '#00A8FF20', text: '#00A8FF', label: 'Low' },
    3: { bg: '#FFD70020', text: '#FFD700', label: 'Moderate' },
    4: { bg: '#FF6B0020', text: '#FF6B00', label: 'High' },
    5: { bg: '#FF336620', text: '#FF3366', label: 'Critical' }
  }
  return colors[rating as keyof typeof colors] || colors[1]
}

export default function InjuriesPage() {
  const [injuries, setInjuries] = useState<Injury[]>([])
  const [selectedSport, setSelectedSport] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [showStarsOnly, setShowStarsOnly] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Fetch real injury data from API
  useEffect(() => {
    async function fetchInjuries() {
      setIsLoading(true)
      try {
        const res = await fetch('/api/injuries?sport=all')
        const data = await res.json()
        // Transform API response to match our interface
        const transformed: Injury[] = (data.injuries || []).map((inj: { id: string; name: string; team: string; position: string; sport: string; injury: string; status: string; headshot?: string }) => ({
          id: inj.id,
          playerName: inj.name,
          team: inj.team,
          position: inj.position,
          sport: inj.sport as 'NFL' | 'NBA' | 'NHL' | 'MLB',
          injuryType: inj.injury,
          bodyPart: inj.injury.split(' ')[0] || 'Unknown',
          status: normalizeStatus(inj.status),
          impactRating: getImpactFromStatus(inj.status, inj.position),
          expectedReturn: 'TBD',
          lastUpdate: 'Recently updated',
          bettingImpact: `Monitor ${inj.team} betting lines`,
          isStarter: true,
          isStar: ['QB', 'WR', 'RB', 'PG', 'SG', 'C', 'LW', 'RW', 'CF', 'SP'].includes(inj.position),
        }))
        setInjuries(transformed)
      } catch (error) {
        console.error('Error fetching injuries:', error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchInjuries()
  }, [])

  function normalizeStatus(status: string): Injury['status'] {
    const s = status.toLowerCase()
    if (s.includes('out') || s === 'o') return 'Out'
    if (s.includes('ir') || s.includes('injured reserve')) return 'IR'
    if (s.includes('il') || s.includes('injured list')) return 'IL'
    if (s.includes('doubtful') || s === 'd') return 'Doubtful'
    if (s.includes('questionable') || s === 'q' || s.includes('gtd')) return 'Questionable'
    if (s.includes('probable') || s === 'p') return 'Probable'
    if (s.includes('day-to-day') || s.includes('dtd')) return 'Day-to-Day'
    return 'Questionable'
  }

  function getImpactFromStatus(status: string, position: string): 1 | 2 | 3 | 4 | 5 {
    const highImpactPositions = ['QB', 'PG', 'C', 'LW', 'RW', 'SP', 'CF']
    const isHighImpactPosition = highImpactPositions.includes(position)
    const s = status.toLowerCase()
    
    if (s.includes('out') || s.includes('ir') || s.includes('il')) {
      return isHighImpactPosition ? 5 : 4
    }
    if (s.includes('doubtful')) {
      return isHighImpactPosition ? 4 : 3
    }
    if (s.includes('questionable') || s.includes('gtd') || s.includes('day-to-day')) {
      return isHighImpactPosition ? 3 : 2
    }
    return 1
  }

  const filteredInjuries = injuries.filter(injury => {
    if (selectedSport !== 'all' && injury.sport !== selectedSport) return false
    if (selectedStatus !== 'all' && injury.status !== selectedStatus) return false
    if (showStarsOnly && !injury.isStar) return false
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return injury.playerName.toLowerCase().includes(query) ||
             injury.team.toLowerCase().includes(query) ||
             injury.injuryType.toLowerCase().includes(query)
    }
    return true
  })

  const highImpactInjuries = injuries.filter(i => i.impactRating >= 4)

  const handleRefresh = () => {
    setIsLoading(true)
    setTimeout(() => setIsLoading(false), 1500)
  }

  const sports = ['all', 'NFL', 'NBA', 'NHL', 'MLB']
  const statuses = ['all', 'Out', 'Doubtful', 'Questionable', 'Probable', 'Day-to-Day']

  return (
    <div className="min-h-screen" style={{ background: '#0A0A0F' }}>
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-xl" style={{ background: 'linear-gradient(135deg, #FF3366, #FF6B00)' }}>
                <Activity className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-black text-white">Injury Tracker</h1>
                <p style={{ color: '#808090' }} className="text-sm">Real-time injury updates with betting impact</p>
              </div>
            </div>
          </div>
          
          <button
            onClick={handleRefresh}
            className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all hover:scale-105"
            style={{ background: '#12121A', color: '#808090' }}
          >
            <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* High Impact Alert */}
        {highImpactInjuries.length > 0 && (
          <div className="mb-6 p-4 rounded-xl" style={{ background: 'rgba(255,51,102,0.1)', border: '1px solid rgba(255,51,102,0.3)' }}>
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-5 h-5" style={{ color: '#FF3366' }} />
              <span className="font-bold" style={{ color: '#FF3366' }}>High Impact Injuries ({highImpactInjuries.length})</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {highImpactInjuries.map((injury) => (
                <span key={injury.id} className="text-sm px-3 py-1 rounded-full" style={{ background: '#0A0A0F', color: '#FFF' }}>
                  {injury.playerName} ({injury.team}) - {injury.status}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="flex gap-2">
            {sports.map((sport) => (
              <button
                key={sport}
                onClick={() => setSelectedSport(sport)}
                className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
                style={{
                  background: selectedSport === sport ? '#FF6B00' : '#12121A',
                  color: selectedSport === sport ? '#FFF' : '#808090'
                }}
              >
                {sport === 'all' ? 'All' : sport}
              </button>
            ))}
          </div>
          
          <div className="flex gap-2">
            {statuses.map((status) => (
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

          <button
            onClick={() => setShowStarsOnly(!showStarsOnly)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ml-auto"
            style={{
              background: showStarsOnly ? '#FFD700' : '#12121A',
              color: showStarsOnly ? '#000' : '#808090'
            }}
          >
            <Star className="w-4 h-4" />
            Stars Only
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: '#808090' }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search players, teams, or injury type..."
            className="w-full pl-12 pr-4 py-3 rounded-xl text-white"
            style={{ background: '#12121A', border: '1px solid rgba(255,255,255,0.1)' }}
          />
        </div>

        {/* Injuries List */}
        <div className="space-y-4">
          {filteredInjuries.map((injury) => {
            const impactBadge = getImpactBadge(injury.impactRating)
            return (
              <div
                key={injury.id}
                className="rounded-xl p-4"
                style={{ background: '#12121A' }}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Player Info */}
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold"
                      style={{ background: '#0A0A0F', color: '#FFF' }}
                    >
                      {injury.team}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-white text-lg">{injury.playerName}</span>
                        {injury.isStar && <Star className="w-4 h-4" style={{ color: '#FFD700' }} />}
                        <span className="text-xs px-2 py-0.5 rounded" style={{ background: '#FF6B0020', color: '#FF6B00' }}>
                          {injury.sport}
                        </span>
                      </div>
                      <p className="text-sm" style={{ color: '#808090' }}>
                        {injury.position} • {injury.injuryType} ({injury.bodyPart})
                      </p>
                    </div>
                  </div>

                  {/* Status & Impact */}
                  <div className="flex flex-wrap items-center gap-3">
                    <span
                      className="px-4 py-2 rounded-xl font-bold text-sm"
                      style={{ background: `${getStatusColor(injury.status)}20`, color: getStatusColor(injury.status) }}
                    >
                      {injury.status}
                    </span>
                    <span
                      className="px-3 py-2 rounded-xl text-xs font-medium"
                      style={{ background: impactBadge.bg, color: impactBadge.text }}
                    >
                      {impactBadge.label} Impact
                    </span>
                  </div>
                </div>

                {/* Details */}
                <div className="mt-4 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs mb-1" style={{ color: '#808090' }}>Expected Return</p>
                      <p className="text-sm text-white">{injury.expectedReturn}</p>
                    </div>
                    <div>
                      <p className="text-xs mb-1" style={{ color: '#808090' }}>Last Update</p>
                      <p className="text-sm text-white flex items-center gap-1">
                        <Clock className="w-3 h-3" style={{ color: '#808090' }} />
                        {injury.lastUpdate}
                      </p>
                    </div>
                    {injury.lineMovement && (
                      <div>
                        <p className="text-xs mb-1" style={{ color: '#808090' }}>Line Movement</p>
                        <p className="text-sm flex items-center gap-2">
                          <span style={{ color: '#808090' }}>{injury.lineMovement.before}</span>
                          <TrendingDown className="w-4 h-4" style={{ color: '#FF3366' }} />
                          <span style={{ color: '#FF3366' }}>{injury.lineMovement.after}</span>
                          <span className="text-xs uppercase" style={{ color: '#808090' }}>({injury.lineMovement.type})</span>
                        </p>
                      </div>
                    )}
                  </div>
                  
                  {/* Betting Impact */}
                  <div className="mt-3 p-3 rounded-xl" style={{ background: '#0A0A0F' }}>
                    <p className="text-xs mb-1" style={{ color: '#FFD700' }}>💰 Betting Impact</p>
                    <p className="text-sm" style={{ color: '#808090' }}>{injury.bettingImpact}</p>
                  </div>
                </div>
              </div>
            )
          })}

          {filteredInjuries.length === 0 && (
            <div className="text-center py-12">
              <UserX className="w-12 h-12 mx-auto mb-4" style={{ color: '#808090' }} />
              <p className="text-lg text-white mb-2">No injuries found</p>
              <p style={{ color: '#808090' }}>Try adjusting your filters</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
