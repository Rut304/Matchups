'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown,
  Filter,
  Search,
  TrendingUp,
  Flame,
  ChevronRight,
  BarChart3,
  Calendar,
  Target,
  Lock
} from 'lucide-react'
import { 
  type HistoricalTrend,
  getHistoricalTrends,
  getTrendRecordForPeriod,
  getTrendROIForPeriod,
  getTrendUnitsForPeriod,
  type TimePeriod
} from '@/lib/historical-data'

type SortField = 'trend_name' | 'sport' | 'bet_type' | 'record' | 'roi' | 'units' | 'win_rate' | 'sample_size' | 'confidence'
type SortDirection = 'asc' | 'desc'

const sportFilters = ['ALL', 'NFL', 'NBA', 'NHL', 'MLB', 'NCAAF', 'NCAAB']
const betTypeFilters = ['all', 'spread', 'total', 'moneyline']
const categoryFilters = ['all', 'matchups_proprietary', 'situational', 'rest', 'sharp', 'timing', 'public_fade', 'revenge', 'totals']

function parseRecord(record: string): { wins: number; losses: number; winRate: number } {
  const [wins, losses] = record.split('-').map(Number)
  const total = wins + losses
  return { wins, losses, winRate: total > 0 ? (wins / total) * 100 : 0 }
}

export default function AllTrendsPage() {
  const [trends, setTrends] = useState<HistoricalTrend[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [sportFilter, setSportFilter] = useState('ALL')
  const [betTypeFilter, setBetTypeFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('all')
  const [sortField, setSortField] = useState<SortField>('roi')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    async function loadTrends() {
      const data = await getHistoricalTrends()
      setTrends(data)
      setLoading(false)
    }
    loadTrends()
  }, [])

  const processedTrends = useMemo(() => {
    return trends.map(trend => {
      const record = getTrendRecordForPeriod(trend, timePeriod)
      const roi = getTrendROIForPeriod(trend, timePeriod)
      const units = getTrendUnitsForPeriod(trend, timePeriod)
      const { wins, losses, winRate } = parseRecord(record)
      
      return {
        ...trend,
        displayRecord: record,
        displayROI: roi,
        displayUnits: units,
        wins,
        losses,
        winRate,
        sampleSize: wins + losses
      }
    })
  }, [trends, timePeriod])

  const filteredAndSortedTrends = useMemo(() => {
    let filtered = processedTrends

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(t => 
        t.trend_name.toLowerCase().includes(query) ||
        t.trend_description.toLowerCase().includes(query)
      )
    }

    // Sport filter
    if (sportFilter !== 'ALL') {
      filtered = filtered.filter(t => t.sport === sportFilter)
    }

    // Bet type filter
    if (betTypeFilter !== 'all') {
      filtered = filtered.filter(t => t.bet_type === betTypeFilter)
    }

    // Category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(t => t.category === categoryFilter)
    }

    // Sort
    filtered.sort((a, b) => {
      let aVal: number | string = 0
      let bVal: number | string = 0

      switch (sortField) {
        case 'trend_name':
          aVal = a.trend_name
          bVal = b.trend_name
          break
        case 'sport':
          aVal = a.sport
          bVal = b.sport
          break
        case 'bet_type':
          aVal = a.bet_type
          bVal = b.bet_type
          break
        case 'record':
          aVal = a.winRate
          bVal = b.winRate
          break
        case 'roi':
          aVal = a.displayROI
          bVal = b.displayROI
          break
        case 'units':
          aVal = a.displayUnits
          bVal = b.displayUnits
          break
        case 'win_rate':
          aVal = a.winRate
          bVal = b.winRate
          break
        case 'sample_size':
          aVal = a.sampleSize
          bVal = b.sampleSize
          break
        case 'confidence':
          aVal = a.confidence_score
          bVal = b.confidence_score
          break
      }

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDirection === 'asc' 
          ? aVal.localeCompare(bVal) 
          : bVal.localeCompare(aVal)
      }

      return sortDirection === 'asc' 
        ? (aVal as number) - (bVal as number)
        : (bVal as number) - (aVal as number)
    })

    return filtered
  }, [processedTrends, searchQuery, sportFilter, betTypeFilter, categoryFilter, sortField, sortDirection])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
  }

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown size={12} style={{ color: '#606070' }} />
    return sortDirection === 'asc' 
      ? <ArrowUp size={12} style={{ color: '#00FF88' }} />
      : <ArrowDown size={12} style={{ color: '#00FF88' }} />
  }

  const timePeriods: { key: TimePeriod; label: string }[] = [
    { key: '30d', label: '30 Days' },
    { key: '90d', label: '90 Days' },
    { key: '1y', label: '1 Year' },
    { key: '5y', label: '5 Years' },
    { key: '10y', label: '10 Years' },
    { key: 'all', label: 'All Time' }
  ]

  return (
    <div className="min-h-screen pt-20 pb-12" style={{ background: '#050508' }}>
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 text-sm mb-2" style={{ color: '#808090' }}>
            <Link href="/trends" className="hover:text-white transition-colors">Trends</Link>
            <ChevronRight size={14} />
            <span style={{ color: '#FFF' }}>All Trends</span>
          </div>
          
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center"
                   style={{ background: 'linear-gradient(135deg, #00FF88, #00AA55)' }}>
                <BarChart3 size={24} style={{ color: '#000' }} />
              </div>
              <div>
                <h1 className="text-2xl font-black" style={{ color: '#FFF' }}>All Betting Trends</h1>
                <p className="text-sm" style={{ color: '#808090' }}>
                  {filteredAndSortedTrends.length} trends • Sortable by any column • Click to drill in
                </p>
              </div>
            </div>
            
            {/* Search */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#606070' }} />
                <input
                  type="text"
                  placeholder="Search trends..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-4 py-2 rounded-lg text-sm w-64"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#FFF' }}
                />
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all"
                style={{ 
                  background: showFilters ? 'rgba(0,255,136,0.2)' : 'rgba(255,255,255,0.05)',
                  color: showFilters ? '#00FF88' : '#808090',
                  border: showFilters ? '1px solid rgba(0,255,136,0.3)' : '1px solid rgba(255,255,255,0.1)'
                }}>
                <Filter size={14} />
                Filters
              </button>
            </div>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="mb-6 p-4 rounded-xl" style={{ background: '#0c0c14', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Time Period */}
              <div>
                <label className="block text-xs font-semibold mb-2" style={{ color: '#808090' }}>Time Period</label>
                <div className="flex flex-wrap gap-1">
                  {timePeriods.map(tp => (
                    <button
                      key={tp.key}
                      onClick={() => setTimePeriod(tp.key)}
                      className="px-2 py-1 rounded text-xs font-semibold transition-all"
                      style={{
                        background: timePeriod === tp.key ? 'linear-gradient(135deg, #00FF88, #00CC6A)' : 'rgba(255,255,255,0.05)',
                        color: timePeriod === tp.key ? '#000' : '#808090'
                      }}>
                      {tp.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sport */}
              <div>
                <label className="block text-xs font-semibold mb-2" style={{ color: '#808090' }}>Sport</label>
                <select
                  value={sportFilter}
                  onChange={(e) => setSportFilter(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-sm"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#FFF' }}>
                  <option value="ALL">All Sports</option>
                  {sportFilters.filter(s => s !== 'ALL').map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              {/* Bet Type */}
              <div>
                <label className="block text-xs font-semibold mb-2" style={{ color: '#808090' }}>Bet Type</label>
                <select
                  value={betTypeFilter}
                  onChange={(e) => setBetTypeFilter(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-sm"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#FFF' }}>
                  <option value="all">All Types</option>
                  <option value="spread">Spread (ATS)</option>
                  <option value="total">Total (O/U)</option>
                  <option value="moneyline">Moneyline</option>
                </select>
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-semibold mb-2" style={{ color: '#808090' }}>Category</label>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-sm"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#FFF' }}>
                  <option value="all">All Categories</option>
                  <option value="matchups_proprietary">🔒 Matchups Proprietary</option>
                  <option value="situational">Situational</option>
                  <option value="rest">Rest Advantage</option>
                  <option value="sharp">Sharp Money</option>
                  <option value="public_fade">Public Fade</option>
                  <option value="timing">Timing</option>
                  <option value="revenge">Revenge</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Trends Table */}
        <div className="rounded-xl overflow-hidden" style={{ background: '#0c0c14', border: '1px solid rgba(255,255,255,0.06)' }}>
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin w-8 h-8 border-2 rounded-full" style={{ borderColor: '#00FF88', borderTopColor: 'transparent' }} />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                    <th className="text-left px-4 py-3">
                      <button 
                        onClick={() => handleSort('trend_name')}
                        className="flex items-center gap-1 text-xs font-bold uppercase hover:text-white transition-colors"
                        style={{ color: '#808090' }}>
                        Trend Name <SortIcon field="trend_name" />
                      </button>
                    </th>
                    <th className="text-center px-3 py-3">
                      <button 
                        onClick={() => handleSort('sport')}
                        className="flex items-center justify-center gap-1 text-xs font-bold uppercase hover:text-white transition-colors"
                        style={{ color: '#808090' }}>
                        Sport <SortIcon field="sport" />
                      </button>
                    </th>
                    <th className="text-center px-3 py-3">
                      <button 
                        onClick={() => handleSort('bet_type')}
                        className="flex items-center justify-center gap-1 text-xs font-bold uppercase hover:text-white transition-colors"
                        style={{ color: '#808090' }}>
                        Type <SortIcon field="bet_type" />
                      </button>
                    </th>
                    <th className="text-center px-3 py-3">
                      <button 
                        onClick={() => handleSort('record')}
                        className="flex items-center justify-center gap-1 text-xs font-bold uppercase hover:text-white transition-colors"
                        style={{ color: '#808090' }}>
                        Record <SortIcon field="record" />
                      </button>
                    </th>
                    <th className="text-center px-3 py-3">
                      <button 
                        onClick={() => handleSort('win_rate')}
                        className="flex items-center justify-center gap-1 text-xs font-bold uppercase hover:text-white transition-colors"
                        style={{ color: '#808090' }}>
                        Win % <SortIcon field="win_rate" />
                      </button>
                    </th>
                    <th className="text-center px-3 py-3">
                      <button 
                        onClick={() => handleSort('roi')}
                        className="flex items-center justify-center gap-1 text-xs font-bold uppercase hover:text-white transition-colors"
                        style={{ color: '#808090' }}>
                        ROI <SortIcon field="roi" />
                      </button>
                    </th>
                    <th className="text-center px-3 py-3">
                      <button 
                        onClick={() => handleSort('units')}
                        className="flex items-center justify-center gap-1 text-xs font-bold uppercase hover:text-white transition-colors"
                        style={{ color: '#808090' }}>
                        Units <SortIcon field="units" />
                      </button>
                    </th>
                    <th className="text-center px-3 py-3">
                      <button 
                        onClick={() => handleSort('sample_size')}
                        className="flex items-center justify-center gap-1 text-xs font-bold uppercase hover:text-white transition-colors"
                        style={{ color: '#808090' }}>
                        Sample <SortIcon field="sample_size" />
                      </button>
                    </th>
                    <th className="text-center px-3 py-3">
                      <button 
                        onClick={() => handleSort('confidence')}
                        className="flex items-center justify-center gap-1 text-xs font-bold uppercase hover:text-white transition-colors"
                        style={{ color: '#808090' }}>
                        Conf <SortIcon field="confidence" />
                      </button>
                    </th>
                    <th className="text-center px-3 py-3">
                      <span className="text-xs font-bold uppercase" style={{ color: '#808090' }}>Status</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAndSortedTrends.map((trend, idx) => (
                    <tr 
                      key={trend.id}
                      className="transition-colors cursor-pointer hover:bg-white/5"
                      style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}
                      onClick={() => window.location.href = `/trends/${trend.trend_id}`}>
                      
                      {/* Trend Name */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {trend.category === 'matchups_proprietary' && (
                            <Lock size={12} style={{ color: '#FFD700' }} />
                          )}
                          <div>
                            <p className="text-sm font-semibold" style={{ color: '#FFF' }}>
                              {trend.trend_name.replace('🔒 ', '')}
                            </p>
                            <p className="text-xs max-w-md truncate" style={{ color: '#606070' }}>
                              {trend.trend_description}
                            </p>
                          </div>
                        </div>
                      </td>
                      
                      {/* Sport */}
                      <td className="text-center px-3 py-3">
                        <span className="text-xs font-bold px-2 py-1 rounded"
                              style={{ background: 'rgba(255,255,255,0.05)', color: '#A0A0B0' }}>
                          {trend.sport}
                        </span>
                      </td>
                      
                      {/* Bet Type */}
                      <td className="text-center px-3 py-3">
                        <span className="text-xs font-bold px-2 py-1 rounded"
                              style={{ 
                                background: trend.bet_type === 'spread' ? 'rgba(0,168,255,0.15)' : 
                                           trend.bet_type === 'total' ? 'rgba(255,107,0,0.15)' : 'rgba(0,255,136,0.15)',
                                color: trend.bet_type === 'spread' ? '#00A8FF' : 
                                      trend.bet_type === 'total' ? '#FF6B00' : '#00FF88'
                              }}>
                          {trend.bet_type === 'spread' ? 'ATS' : trend.bet_type === 'total' ? 'O/U' : 'ML'}
                        </span>
                      </td>
                      
                      {/* Record */}
                      <td className="text-center px-3 py-3">
                        <span className="text-sm font-bold" style={{ color: '#00FF88' }}>
                          {trend.displayRecord}
                        </span>
                      </td>
                      
                      {/* Win Rate */}
                      <td className="text-center px-3 py-3">
                        <span className="text-sm font-semibold" style={{ color: trend.winRate >= 55 ? '#00FF88' : trend.winRate >= 52 ? '#FFD700' : '#A0A0B0' }}>
                          {trend.winRate.toFixed(1)}%
                        </span>
                      </td>
                      
                      {/* ROI */}
                      <td className="text-center px-3 py-3">
                        <span className="text-sm font-bold" style={{ color: trend.displayROI >= 0 ? '#00FF88' : '#FF4455' }}>
                          {trend.displayROI >= 0 ? '+' : ''}{trend.displayROI.toFixed(1)}%
                        </span>
                      </td>
                      
                      {/* Units */}
                      <td className="text-center px-3 py-3">
                        <span className="text-sm font-semibold" style={{ color: trend.displayUnits >= 0 ? '#00FF88' : '#FF4455' }}>
                          {trend.displayUnits >= 0 ? '+' : ''}{trend.displayUnits.toFixed(1)}u
                        </span>
                      </td>
                      
                      {/* Sample Size */}
                      <td className="text-center px-3 py-3">
                        <span className="text-sm" style={{ color: '#808090' }}>
                          {trend.sampleSize}
                        </span>
                      </td>
                      
                      {/* Confidence */}
                      <td className="text-center px-3 py-3">
                        <div className="flex items-center justify-center gap-1">
                          <div className="w-10 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
                            <div 
                              className="h-full rounded-full"
                              style={{ 
                                width: `${trend.confidence_score}%`,
                                background: trend.confidence_score >= 90 ? '#00FF88' : 
                                           trend.confidence_score >= 80 ? '#FFD700' : '#FF6B00'
                              }} 
                            />
                          </div>
                          <span className="text-xs font-bold" style={{ color: '#808090' }}>
                            {trend.confidence_score}
                          </span>
                        </div>
                      </td>
                      
                      {/* Status */}
                      <td className="text-center px-3 py-3">
                        <div className="flex items-center justify-center gap-1">
                          {trend.hot_streak && (
                            <span className="flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded"
                                  style={{ background: 'rgba(255,107,0,0.2)', color: '#FF6B00' }}>
                              <Flame size={10} /> HOT
                            </span>
                          )}
                          {trend.cold_streak && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                                  style={{ background: 'rgba(100,100,255,0.2)', color: '#6B6BFF' }}>
                              COLD
                            </span>
                          )}
                          {!trend.hot_streak && !trend.cold_streak && (
                            <span className="text-[10px]" style={{ color: '#606070' }}>—</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="mt-4 flex flex-wrap items-center gap-4 text-xs" style={{ color: '#606070' }}>
          <span className="flex items-center gap-1">
            <Lock size={10} style={{ color: '#FFD700' }} /> Matchups Proprietary
          </span>
          <span className="flex items-center gap-1">
            <Flame size={10} style={{ color: '#FF6B00' }} /> Hot Streak
          </span>
          <span>Click any row to see full trend details with all historical games</span>
        </div>
      </div>
    </div>
  )
}
