'use client'

/**
 * Public & Sharp Money Betting Splits Page
 * Shows betting percentages, RLM, steam moves for all games across sports
 * 
 * Data Sources:
 * - Public %: SportsBettingDime (free)
 * - Lines: The Odds API (multi-book)
 * - RLM/Sharp: Calculated from line movement vs public betting
 */

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { 
  ArrowLeft, 
  RefreshCw, 
  Filter,
  Users,
  DollarSign,
  AlertTriangle,
  Zap,
  Info,
  ExternalLink,
  TrendingUp,
  Clock
} from 'lucide-react'
import { BettingSplitsTable, type BettingSplitRow } from '@/components/betting/BettingSplitsTable'

// =============================================================================
// SPORT TABS
// =============================================================================

const SPORTS = [
  { key: 'NFL', label: 'NFL', emoji: '🏈' },
  { key: 'NBA', label: 'NBA', emoji: '🏀' },
  { key: 'NHL', label: 'NHL', emoji: '🏒' },
  { key: 'MLB', label: 'MLB', emoji: '⚾' },
  { key: 'NCAAF', label: 'NCAAF', emoji: '🏈' },
  { key: 'NCAAB', label: 'NCAAB', emoji: '🏀' },
]

// =============================================================================
// MAIN PAGE COMPONENT
// =============================================================================

export default function BettingSplitsPage() {
  const [selectedSport, setSelectedSport] = useState('NFL')
  const [data, setData] = useState<BettingSplitRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [filters, setFilters] = useState({
    showRLMOnly: false,
    showSteamOnly: false,
    showSharpOnly: false,
    minPublicPct: 0,
  })
  
  // Fetch betting splits data
  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/betting-intelligence?sport=${selectedSport}`)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.status}`)
      }
      
      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || 'Unknown error')
      }
      
      // Transform API response to table format
      const rows: BettingSplitRow[] = result.data.map((item: {
        gameId: string
        sport: string
        homeTeam: string
        awayTeam: string
        gameTime: string
        spread: { line: number; homePublicPct: number; awayPublicPct: number; homeMoneyPct: number; awayMoneyPct: number }
        total: { line: number; overPublicPct: number; underPublicPct: number; overMoneyPct: number; underMoneyPct: number }
        moneyline: { homeOdds: number; awayOdds: number; homePublicPct: number; awayPublicPct: number }
        indicators: { rlm: boolean; rlmSide: string | null; rlmConfidence: number; steamMove: boolean; steamDirection: string | null; sharpSide: string | null; sharpConfidence: number }
      }) => ({
        gameId: item.gameId,
        sport: item.sport,
        homeTeam: item.homeTeam,
        awayTeam: item.awayTeam,
        gameTime: item.gameTime,
        spread: item.spread.line,
        total: item.total.line,
        homeML: item.moneyline.homeOdds,
        awayML: item.moneyline.awayOdds,
        spreadHomePublicPct: item.spread.homePublicPct,
        spreadAwayPublicPct: item.spread.awayPublicPct,
        spreadHomeMoneyPct: item.spread.homeMoneyPct,
        spreadAwayMoneyPct: item.spread.awayMoneyPct,
        totalOverPublicPct: item.total.overPublicPct,
        totalUnderPublicPct: item.total.underPublicPct,
        totalOverMoneyPct: item.total.overMoneyPct,
        totalUnderMoneyPct: item.total.underMoneyPct,
        isRLM: item.indicators.rlm,
        rlmSide: item.indicators.rlmSide,
        rlmConfidence: item.indicators.rlmConfidence,
        isSteamMove: item.indicators.steamMove,
        steamDirection: item.indicators.steamDirection,
        sharpSide: item.indicators.sharpSide,
        sharpConfidence: item.indicators.sharpConfidence,
      }))
      
      setData(rows)
      setLastUpdated(new Date())
      
    } catch (err) {
      console.error('Error fetching betting splits:', err)
      setError(err instanceof Error ? err.message : 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }, [selectedSport])
  
  // Initial fetch and sport change
  useEffect(() => {
    fetchData()
  }, [fetchData])
  
  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(fetchData, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [fetchData])
  
  // Apply filters
  const filteredData = data.filter(row => {
    if (filters.showRLMOnly && !row.isRLM) return false
    if (filters.showSteamOnly && !row.isSteamMove) return false
    if (filters.showSharpOnly && (!row.sharpSide || row.sharpConfidence < 60)) return false
    if (filters.minPublicPct > 0) {
      const maxPublic = Math.max(
        row.spreadHomePublicPct,
        row.spreadAwayPublicPct,
        row.totalOverPublicPct,
        row.totalUnderPublicPct
      )
      if (maxPublic < filters.minPublicPct) return false
    }
    return true
  })
  
  // Navigate to game detail
  const handleRowClick = (row: BettingSplitRow) => {
    window.location.href = `/game/${row.gameId}?sport=${row.sport}`
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-gray-900/80 backdrop-blur-lg border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link 
                href="/edge"
                className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="hidden sm:inline">Back to Edge</span>
              </Link>
              <div>
                <h1 className="text-xl font-bold text-white flex items-center gap-2">
                  <TrendingUp className="w-6 h-6 text-green-500" />
                  Betting Splits
                </h1>
                <p className="text-xs text-gray-500">Public vs Sharp Money Analysis</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {lastUpdated && (
                <span className="text-xs text-gray-500 hidden sm:flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Updated {lastUpdated.toLocaleTimeString()}
                </span>
              )}
              <button
                onClick={fetchData}
                disabled={loading}
                className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg text-sm font-medium transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Sport Tabs */}
        <div className="flex flex-wrap gap-2">
          {SPORTS.map(sport => (
            <button
              key={sport.key}
              onClick={() => setSelectedSport(sport.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                selectedSport === sport.key
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
              }`}
            >
              <span>{sport.emoji}</span>
              <span>{sport.label}</span>
            </button>
          ))}
        </div>
        
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4 p-4 bg-gray-900/50 rounded-lg border border-gray-800">
          <div className="flex items-center gap-2 text-gray-400">
            <Filter className="w-4 h-4" />
            <span className="text-sm font-medium">Filters:</span>
          </div>
          
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={filters.showRLMOnly}
              onChange={(e) => setFilters(f => ({ ...f, showRLMOnly: e.target.checked }))}
              className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-orange-500 focus:ring-orange-500"
            />
            <span className="text-sm text-orange-400 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              RLM Only
            </span>
          </label>
          
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={filters.showSteamOnly}
              onChange={(e) => setFilters(f => ({ ...f, showSteamOnly: e.target.checked }))}
              className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-red-500 focus:ring-red-500"
            />
            <span className="text-sm text-red-400 flex items-center gap-1">
              <Zap className="w-3 h-3" />
              Steam Only
            </span>
          </label>
          
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={filters.showSharpOnly}
              onChange={(e) => setFilters(f => ({ ...f, showSharpOnly: e.target.checked }))}
              className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-purple-500 focus:ring-purple-500"
            />
            <span className="text-sm text-purple-400 flex items-center gap-1">
              <DollarSign className="w-3 h-3" />
              Sharp Plays Only
            </span>
          </label>
          
          <div className="flex items-center gap-2">
            <label htmlFor="min-public-pct" className="text-sm text-gray-400">Min Public %:</label>
            <input
              id="min-public-pct"
              type="range"
              min="0"
              max="80"
              step="5"
              value={filters.minPublicPct}
              onChange={(e) => setFilters(f => ({ ...f, minPublicPct: parseInt(e.target.value) }))}
              className="w-24"
              title="Minimum public betting percentage filter"
            />
            <span className="text-sm text-gray-300 w-8">{filters.minPublicPct}%</span>
          </div>
          
          <div className="ml-auto text-sm text-gray-500">
            Showing {filteredData.length} of {data.length} games
          </div>
        </div>
        
        {/* Error State */}
        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
            <p className="text-red-400 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              {error}
            </p>
            <button
              onClick={fetchData}
              className="mt-2 text-sm text-blue-400 hover:underline"
            >
              Try again
            </button>
          </div>
        )}
        
        {/* Main Table */}
        <BettingSplitsTable
          data={filteredData}
          onRowClick={handleRowClick}
          loading={loading}
          sport={selectedSport}
        />
        
        {/* Info Section */}
        <div className="p-6 bg-gray-900/50 rounded-lg border border-gray-800">
          <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
            <Info className="w-5 h-5 text-blue-400" />
            Understanding Betting Splits
          </h3>
          
          <div className="grid md:grid-cols-2 gap-6 text-sm">
            <div>
              <h4 className="font-semibold text-white mb-2 flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-400" />
                Public Betting %
              </h4>
              <p className="text-gray-400">
                Percentage of total bets placed on each side. High public % (65%+) 
                on one side often creates value on the opposite side, as the 
                &quot;square&quot; public tends to overreact to narratives and recent results.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold text-white mb-2 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-purple-400" />
                Money % (Sharp Indicator)
              </h4>
              <p className="text-gray-400">
                Percentage of actual dollars wagered. When money % differs significantly 
                from public %, it suggests sharp bettors (professionals) are on the 
                opposite side. A 15%+ difference is a strong sharp indicator.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold text-white mb-2 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-orange-400" />
                Reverse Line Movement (RLM)
              </h4>
              <p className="text-gray-400">
                When the betting line moves opposite to where the public is betting. 
                Example: 70% of bets on Team A, but the line moves toward Team B. 
                This is the strongest indicator of sharp money.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold text-white mb-2 flex items-center gap-2">
                <Zap className="w-4 h-4 text-red-400" />
                Steam Moves
              </h4>
              <p className="text-gray-400">
                When multiple sportsbooks move their lines in the same direction 
                within minutes. This indicates a large, respected bettor (or syndicate) 
                has placed significant money, causing books to react quickly.
              </p>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
            <p className="text-yellow-400 text-sm flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>
                <strong>Note:</strong> True sharp money tracking requires paid professional 
                data services (Action Network PRO, Don Best, SportsInsights). Our sharp 
                estimates are calculated from public betting % combined with line movement 
                from multiple sportsbooks.
              </span>
            </p>
          </div>
        </div>
        
        {/* Data Sources */}
        <div className="flex flex-wrap justify-center gap-6 text-xs text-gray-600 pb-6">
          <a 
            href="https://www.sportsbettingdime.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-1 hover:text-gray-400 transition-colors"
          >
            <ExternalLink className="w-3 h-3" />
            Public Data: SportsBettingDime
          </a>
          <a 
            href="https://the-odds-api.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-1 hover:text-gray-400 transition-colors"
          >
            <ExternalLink className="w-3 h-3" />
            Odds Data: The Odds API
          </a>
          <span>RLM & Sharp: Calculated</span>
        </div>
      </main>
    </div>
  )
}
