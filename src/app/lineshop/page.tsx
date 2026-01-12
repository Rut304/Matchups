'use client'

// =============================================================================
// LINE SHOP - Multi-Book Odds Comparison with Line Movement History
// REAL DATA from The Odds API - NO MOCK DATA
// =============================================================================

import { useState, useEffect, useMemo, useCallback } from 'react'
import { 
  ShoppingBag, TrendingUp, TrendingDown, Zap, Filter, Star, 
  ExternalLink, Bell, ChevronDown, Check, ArrowUpRight, ArrowDownRight,
  RefreshCw, AlertTriangle, X, History, Clock, Activity
} from 'lucide-react'
import Link from 'next/link'

// Line Movement History Modal Component
interface LineMovementEntry {
  timestamp: string
  spread?: { home: number; away: number; homeOdds: number; awayOdds: number }
  total?: { line: number; overOdds: number; underOdds: number }
  moneyline?: { home: number; away: number }
}

interface LineMovementModalProps {
  isOpen: boolean
  onClose: () => void
  bookmaker: string
  bookmakerName: string
  gameInfo: { homeTeam: string; awayTeam: string; commenceTime: string }
  history: LineMovementEntry[]
}

function LineMovementModal({ isOpen, onClose, bookmaker, bookmakerName, gameInfo, history }: LineMovementModalProps) {
  if (!isOpen) return null

  const getSpreadChange = (current: number, previous: number) => {
    const diff = current - previous
    if (diff === 0) return null
    return diff > 0 ? `+${diff.toFixed(1)}` : diff.toFixed(1)
  }

  const formatTime = (iso: string) => {
    const date = new Date(iso)
    return date.toLocaleString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: 'numeric', 
      minute: '2-digit'
    })
  }

  const formatOdds = (odds: number) => odds >= 0 ? `+${odds}` : odds.toString()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-[#0a0a0f] border border-slate-700 rounded-2xl overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-orange-500/20">
              <History className="w-5 h-5 text-orange-500" />
            </div>
            <div>
              <h3 className="font-bold text-white">{bookmakerName} Line History</h3>
              <p className="text-sm text-slate-400">{gameInfo.awayTeam} @ {gameInfo.homeTeam}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            aria-label="Close modal"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="max-h-[60vh] overflow-y-auto">
          {history.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No historical data available yet</p>
              <p className="text-sm mt-1">Line movement will be tracked over time</p>
            </div>
          ) : (
            <div className="p-4">
              {/* Timeline */}
              <div className="space-y-3">
                {history.map((entry, idx) => {
                  const isFirst = idx === 0
                  const prevEntry = idx > 0 ? history[idx - 1] : null
                  const spreadChange = entry.spread && prevEntry?.spread 
                    ? getSpreadChange(entry.spread.home, prevEntry.spread.home) 
                    : null
                  const totalChange = entry.total && prevEntry?.total
                    ? getSpreadChange(entry.total.line, prevEntry.total.line)
                    : null

                  return (
                    <div 
                      key={idx}
                      className={`relative p-4 rounded-xl border ${
                        isFirst 
                          ? 'bg-green-500/10 border-green-500/30' 
                          : 'bg-slate-800/30 border-slate-800'
                      }`}
                    >
                      {/* Timestamp */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-slate-500" />
                          <span className="text-sm text-slate-400">{formatTime(entry.timestamp)}</span>
                        </div>
                        {isFirst && (
                          <span className="px-2 py-0.5 text-xs rounded-full bg-green-500/20 text-green-400">
                            Current
                          </span>
                        )}
                        {idx === history.length - 1 && !isFirst && (
                          <span className="px-2 py-0.5 text-xs rounded-full bg-slate-700 text-slate-400">
                            Opening
                          </span>
                        )}
                      </div>

                      {/* Lines Grid */}
                      <div className="grid grid-cols-3 gap-4">
                        {/* Spread */}
                        {entry.spread && (
                          <div>
                            <p className="text-xs text-slate-500 mb-1">Spread</p>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-slate-500">{gameInfo.awayTeam.split(' ').pop()}:</span>
                                <span className="font-mono text-white">
                                  {entry.spread.away > 0 ? '+' : ''}{entry.spread.away}
                                </span>
                                <span className="text-xs text-slate-500">({formatOdds(entry.spread.awayOdds)})</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-slate-500">{gameInfo.homeTeam.split(' ').pop()}:</span>
                                <span className="font-mono text-white">
                                  {entry.spread.home > 0 ? '+' : ''}{entry.spread.home}
                                </span>
                                <span className="text-xs text-slate-500">({formatOdds(entry.spread.homeOdds)})</span>
                                {spreadChange && (
                                  <span className={`text-xs font-bold ${
                                    spreadChange.startsWith('+') ? 'text-red-400' : 'text-green-400'
                                  }`}>
                                    ({spreadChange})
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Total */}
                        {entry.total && (
                          <div>
                            <p className="text-xs text-slate-500 mb-1">Total</p>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-slate-500">O:</span>
                                <span className="font-mono text-white">{entry.total.line}</span>
                                <span className="text-xs text-slate-500">({formatOdds(entry.total.overOdds)})</span>
                                {totalChange && (
                                  <span className={`text-xs font-bold ${
                                    totalChange.startsWith('+') ? 'text-orange-400' : 'text-blue-400'
                                  }`}>
                                    ({totalChange})
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-slate-500">U:</span>
                                <span className="font-mono text-white">{entry.total.line}</span>
                                <span className="text-xs text-slate-500">({formatOdds(entry.total.underOdds)})</span>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Moneyline */}
                        {entry.moneyline && (
                          <div>
                            <p className="text-xs text-slate-500 mb-1">Moneyline</p>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-slate-500">{gameInfo.awayTeam.split(' ').pop()}:</span>
                                <span className={`font-mono ${entry.moneyline.away > 0 ? 'text-green-400' : 'text-white'}`}>
                                  {formatOdds(entry.moneyline.away)}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-slate-500">{gameInfo.homeTeam.split(' ').pop()}:</span>
                                <span className={`font-mono ${entry.moneyline.home > 0 ? 'text-green-400' : 'text-white'}`}>
                                  {formatOdds(entry.moneyline.home)}
                                </span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Summary */}
              {history.length >= 2 && (
                <div className="mt-4 p-4 rounded-xl bg-slate-800/50 border border-slate-700">
                  <p className="text-sm font-semibold text-white mb-2">📊 Movement Summary</p>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {history[0]?.spread && history[history.length - 1]?.spread && (
                      <div>
                        <span className="text-slate-400">Spread moved: </span>
                        <span className={`font-bold ${
                          history[0]?.spread?.home !== history[history.length - 1]?.spread?.home
                            ? 'text-orange-400'
                            : 'text-slate-500'
                        }`}>
                          {(history[history.length - 1]?.spread?.home ?? 0) > 0 ? '+' : ''}{history[history.length - 1]?.spread?.home ?? 0} → {(history[0]?.spread?.home ?? 0) > 0 ? '+' : ''}{history[0]?.spread?.home ?? 0}
                        </span>
                      </div>
                    )}
                    {history[0]?.total && history[history.length - 1]?.total && (
                      <div>
                        <span className="text-slate-400">Total moved: </span>
                        <span className={`font-bold ${
                          history[0]?.total?.line !== history[history.length - 1]?.total?.line
                            ? 'text-orange-400'
                            : 'text-slate-500'
                        }`}>
                          {history[history.length - 1]?.total?.line ?? 0} → {history[0]?.total?.line ?? 0}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/30">
          <p className="text-xs text-slate-500 text-center">
            Line history is tracked every time odds are refreshed • Click any sportsbook row to view history
          </p>
        </div>
      </div>
    </div>
  )
}

// Real sportsbook info (for display only)
const SPORTSBOOKS_INFO: Record<string, { name: string; shortName: string; color: string }> = {
  'draftkings': { name: 'DraftKings', shortName: 'DK', color: '#00C853' },
  'fanduel': { name: 'FanDuel', shortName: 'FD', color: '#1493FF' },
  'betmgm': { name: 'BetMGM', shortName: 'MGM', color: '#C5A572' },
  'caesars': { name: 'Caesars', shortName: 'CZR', color: '#CD9834' },
  'pointsbetus': { name: 'PointsBet', shortName: 'PB', color: '#FF4D00' },
  'betrivers': { name: 'BetRivers', shortName: 'BR', color: '#1E88E5' },
  'unibet_us': { name: 'Unibet', shortName: 'UNI', color: '#14805E' },
  'superbook': { name: 'SuperBook', shortName: 'SB', color: '#B71C1C' },
  'bovada': { name: 'Bovada', shortName: 'BOV', color: '#CC0000' },
  'betonlineag': { name: 'BetOnline', shortName: 'BOL', color: '#3D3D3D' },
}

interface BookmakerOdds {
  key: string
  title: string
  lastUpdate: string
  spread?: { home: number; homeOdds: number; away: number; awayOdds: number }
  total?: { line: number; overOdds: number; underOdds: number }
  moneyline?: { home: number; away: number }
}

interface GameOdds {
  id: string
  sport: string
  sportTitle: string
  homeTeam: string
  awayTeam: string
  commenceTime: string
  bookmakers: BookmakerOdds[]
}

type BetType = 'spread' | 'total' | 'moneyline'
type SportFilter = 'all' | 'nfl' | 'nba' | 'nhl' | 'mlb'

const SPORT_MAP: Record<string, string> = {
  'nfl': 'americanfootball_nfl',
  'nba': 'basketball_nba',
  'nhl': 'icehockey_nhl',
  'mlb': 'baseball_mlb'
}

export default function LineShopPage() {
  const [games, setGames] = useState<GameOdds[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedSport, setSelectedSport] = useState<SportFilter>('nfl')
  const [selectedBetType, setSelectedBetType] = useState<BetType>('spread')
  const [refreshing, setRefreshing] = useState(false)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)
  
  // Line Movement Modal State
  const [lineHistoryModal, setLineHistoryModal] = useState<{
    isOpen: boolean
    bookmaker: string
    bookmakerName: string
    gameInfo: { homeTeam: string; awayTeam: string; commenceTime: string }
    history: LineMovementEntry[]
  }>({
    isOpen: false,
    bookmaker: '',
    bookmakerName: '',
    gameInfo: { homeTeam: '', awayTeam: '', commenceTime: '' },
    history: []
  })

  // Store historical line data (in real app, this would come from database)
  const [lineHistory, setLineHistory] = useState<Record<string, LineMovementEntry[]>>({})

  // Track line changes when fetching new odds
  const trackLineMovement = useCallback((gameId: string, bookmakerKey: string, currentOdds: BookmakerOdds) => {
    const key = `${gameId}-${bookmakerKey}`
    const now = new Date().toISOString()
    
    setLineHistory(prev => {
      const existing = prev[key] || []
      const newEntry: LineMovementEntry = {
        timestamp: now,
        spread: currentOdds.spread,
        total: currentOdds.total,
        moneyline: currentOdds.moneyline
      }
      
      // Only add if different from last entry (line actually moved)
      const lastEntry = existing[0]
      if (lastEntry) {
        const spreadChanged = JSON.stringify(lastEntry.spread) !== JSON.stringify(newEntry.spread)
        const totalChanged = JSON.stringify(lastEntry.total) !== JSON.stringify(newEntry.total)
        const mlChanged = JSON.stringify(lastEntry.moneyline) !== JSON.stringify(newEntry.moneyline)
        
        if (!spreadChanged && !totalChanged && !mlChanged) {
          return prev // No change
        }
      }
      
      return {
        ...prev,
        [key]: [newEntry, ...existing].slice(0, 20) // Keep last 20 entries
      }
    })
  }, [])

  // Open line history modal
  const openLineHistory = (game: GameOdds, bookmaker: BookmakerOdds) => {
    const key = `${game.id}-${bookmaker.key}`
    const history = lineHistory[key] || []
    const info = SPORTSBOOKS_INFO[bookmaker.key] || { name: bookmaker.title, shortName: bookmaker.key.toUpperCase(), color: '#666' }
    
    // If no history yet, create initial entry from current data
    const displayHistory = history.length === 0 ? [{
      timestamp: bookmaker.lastUpdate || new Date().toISOString(),
      spread: bookmaker.spread,
      total: bookmaker.total,
      moneyline: bookmaker.moneyline
    }] : history
    
    setLineHistoryModal({
      isOpen: true,
      bookmaker: bookmaker.key,
      bookmakerName: info.name,
      gameInfo: {
        homeTeam: game.homeTeam,
        awayTeam: game.awayTeam,
        commenceTime: game.commenceTime
      },
      history: displayHistory
    })
  }

  // Fetch real odds data
  const fetchOdds = async (sport: SportFilter) => {
    try {
      setRefreshing(true)
      
      const sportKey = sport === 'all' ? 'nfl' : sport
      const oddsApiSport = SPORT_MAP[sportKey]
      
      const res = await fetch(`/api/odds?sport=${oddsApiSport}&markets=spreads,totals,h2h`)
      if (!res.ok) throw new Error('Failed to fetch odds')
      
      const data = await res.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch odds')
      }

      // Transform API response to our format
      const transformedGames: GameOdds[] = (data.odds || []).map((game: {
        id: string
        sport_key: string
        sport_title: string
        home_team: string
        away_team: string
        commence_time: string
        bookmakers: Array<{
          key: string
          title: string
          last_update: string
          markets: Array<{
            key: string
            outcomes: Array<{ name: string; point?: number; price: number }>
          }>
        }>
      }) => {
        const bookmakers: BookmakerOdds[] = game.bookmakers.map(bm => {
          const spreadMarket = bm.markets.find(m => m.key === 'spreads')
          const totalMarket = bm.markets.find(m => m.key === 'totals')
          const mlMarket = bm.markets.find(m => m.key === 'h2h')

          const homeSpread = spreadMarket?.outcomes.find(o => o.name === game.home_team)
          const awaySpread = spreadMarket?.outcomes.find(o => o.name === game.away_team)
          const over = totalMarket?.outcomes.find(o => o.name === 'Over')
          const under = totalMarket?.outcomes.find(o => o.name === 'Under')
          const homeML = mlMarket?.outcomes.find(o => o.name === game.home_team)
          const awayML = mlMarket?.outcomes.find(o => o.name === game.away_team)

          return {
            key: bm.key,
            title: bm.title,
            lastUpdate: bm.last_update,
            spread: homeSpread && awaySpread ? {
              home: homeSpread.point || 0,
              homeOdds: homeSpread.price,
              away: awaySpread.point || 0,
              awayOdds: awaySpread.price
            } : undefined,
            total: over && under ? {
              line: over.point || 0,
              overOdds: over.price,
              underOdds: under.price
            } : undefined,
            moneyline: homeML && awayML ? {
              home: homeML.price,
              away: awayML.price
            } : undefined
          }
        })

        return {
          id: game.id,
          sport: game.sport_key,
          sportTitle: game.sport_title,
          homeTeam: game.home_team,
          awayTeam: game.away_team,
          commenceTime: game.commence_time,
          bookmakers
        }
      })

      setGames(transformedGames)
      
      // Track line movements for each game/bookmaker
      transformedGames.forEach(game => {
        game.bookmakers.forEach(bm => {
          trackLineMovement(game.id, bm.key, bm)
        })
      })
      
      setLastRefresh(new Date())
      setError(null)
    } catch (err) {
      console.error('Error fetching odds:', err)
      setError(err instanceof Error ? err.message : 'Failed to load odds')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  // Initial load and sport change
  useEffect(() => {
    fetchOdds(selectedSport)
  }, [selectedSport])

  // Find best odds for a game
  const findBestOdds = (game: GameOdds, type: BetType, side: 'home' | 'away' | 'over' | 'under') => {
    let best = { book: '', odds: -9999, line: 0 }
    
    game.bookmakers.forEach(bm => {
      if (type === 'spread' && bm.spread) {
        const odds = side === 'home' ? bm.spread.homeOdds : bm.spread.awayOdds
        const line = side === 'home' ? bm.spread.home : bm.spread.away
        if (odds > best.odds) {
          best = { book: bm.key, odds, line }
        }
      } else if (type === 'total' && bm.total) {
        const odds = side === 'over' ? bm.total.overOdds : bm.total.underOdds
        if (odds > best.odds) {
          best = { book: bm.key, odds, line: bm.total.line }
        }
      } else if (type === 'moneyline' && bm.moneyline) {
        const odds = side === 'home' ? bm.moneyline.home : bm.moneyline.away
        if (odds > best.odds) {
          best = { book: bm.key, odds, line: 0 }
        }
      }
    })
    
    return best
  }

  // Format odds display
  const formatOdds = (odds: number) => {
    if (odds >= 0) return `+${odds}`
    return odds.toString()
  }

  // Format time
  const formatTime = (isoString: string) => {
    const date = new Date(isoString)
    const now = new Date()
    const isToday = date.toDateString() === now.toDateString()
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)
    const isTomorrow = date.toDateString() === tomorrow.toDateString()
    
    const timeStr = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    
    if (isToday) return `Today ${timeStr}`
    if (isTomorrow) return `Tomorrow ${timeStr}`
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) + ` ${timeStr}`
  }

  return (
    <main className="min-h-screen bg-[#0a0a0f]">
      {/* Line Movement History Modal */}
      <LineMovementModal
        isOpen={lineHistoryModal.isOpen}
        onClose={() => setLineHistoryModal(prev => ({ ...prev, isOpen: false }))}
        bookmaker={lineHistoryModal.bookmaker}
        bookmakerName={lineHistoryModal.bookmakerName}
        gameInfo={lineHistoryModal.gameInfo}
        history={lineHistoryModal.history}
      />

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <ShoppingBag className="w-8 h-8 text-green-500" />
            <h1 className="text-3xl font-bold text-white">Line Shop</h1>
            <span className="px-2 py-1 text-xs rounded bg-green-500/20 text-green-400">Real-Time</span>
          </div>
          <p className="text-slate-400">
            Compare odds across sportsbooks to find the best value • Data from The Odds API
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4 mb-6">
          {/* Sport Filter */}
          <div className="flex gap-2">
            {(['nfl', 'nba', 'nhl', 'mlb'] as const).map(sport => (
              <button
                key={sport}
                onClick={() => setSelectedSport(sport)}
                className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                  selectedSport === sport
                    ? 'bg-orange-500 text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {sport.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Bet Type Filter */}
          <div className="flex gap-2 ml-auto">
            {(['spread', 'total', 'moneyline'] as const).map(type => (
              <button
                key={type}
                onClick={() => setSelectedBetType(type)}
                className={`px-4 py-2 rounded-lg capitalize transition-colors ${
                  selectedBetType === type
                    ? 'bg-green-500 text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          {/* Refresh Button */}
          <button
            onClick={() => fetchOdds(selectedSport)}
            disabled={refreshing}
            className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-colors disabled:opacity-50"
            aria-label="Refresh odds"
            title="Refresh odds"
          >
            <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Last Refresh */}
        {lastRefresh && (
          <p className="text-xs text-slate-500 mb-4">
            Last updated: {lastRefresh.toLocaleTimeString()}
          </p>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <RefreshCw className="w-8 h-8 text-orange-500 animate-spin" />
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="p-6 rounded-xl bg-red-500/10 border border-red-500/30 text-center">
            <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-2" />
            <p className="text-red-400">{error}</p>
            <p className="text-sm text-slate-500 mt-2">
              Make sure ODDS_API_KEY is configured in environment variables
            </p>
          </div>
        )}

        {/* Games List */}
        {!loading && !error && games.length === 0 && (
          <div className="text-center py-20 text-slate-400">
            <p>No games available for {selectedSport.toUpperCase()}</p>
          </div>
        )}

        {!loading && !error && games.length > 0 && (
          <div className="space-y-6">
            {games.map(game => {
              const bestHomeSpread = findBestOdds(game, 'spread', 'home')
              const bestAwaySpread = findBestOdds(game, 'spread', 'away')
              const bestOver = findBestOdds(game, 'total', 'over')
              const bestUnder = findBestOdds(game, 'total', 'under')
              const bestHomeML = findBestOdds(game, 'moneyline', 'home')
              const bestAwayML = findBestOdds(game, 'moneyline', 'away')

              return (
                <div key={game.id} className="rounded-xl bg-slate-900/50 border border-slate-800 overflow-hidden">
                  {/* Game Header */}
                  <div className="p-4 border-b border-slate-800 bg-slate-800/30">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-bold text-white">{game.awayTeam} @ {game.homeTeam}</p>
                        <p className="text-sm text-slate-400">{formatTime(game.commenceTime)}</p>
                      </div>
                      <Link
                        href={`/game/${game.id}?sport=${selectedSport.toUpperCase()}`}
                        className="text-xs text-orange-500 hover:underline"
                      >
                        Full Analysis →
                      </Link>
                    </div>
                  </div>

                  {/* Best Lines Highlight */}
                  <div className="p-4 bg-gradient-to-r from-green-500/10 to-transparent border-b border-slate-800">
                    <p className="text-xs text-green-400 font-semibold mb-2">🏆 BEST LINES</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      <div>
                        <span className="text-slate-400">{game.awayTeam.split(' ').pop()} Spread:</span>
                        <span className="ml-2 font-mono text-green-400">{bestAwaySpread.line > 0 ? '+' : ''}{bestAwaySpread.line} ({formatOdds(bestAwaySpread.odds)})</span>
                        <span className="ml-1 text-xs text-slate-500">@ {SPORTSBOOKS_INFO[bestAwaySpread.book]?.shortName || bestAwaySpread.book}</span>
                      </div>
                      <div>
                        <span className="text-slate-400">{game.homeTeam.split(' ').pop()} Spread:</span>
                        <span className="ml-2 font-mono text-green-400">{bestHomeSpread.line > 0 ? '+' : ''}{bestHomeSpread.line} ({formatOdds(bestHomeSpread.odds)})</span>
                        <span className="ml-1 text-xs text-slate-500">@ {SPORTSBOOKS_INFO[bestHomeSpread.book]?.shortName || bestHomeSpread.book}</span>
                      </div>
                      <div>
                        <span className="text-slate-400">Over:</span>
                        <span className="ml-2 font-mono text-green-400">{bestOver.line} ({formatOdds(bestOver.odds)})</span>
                        <span className="ml-1 text-xs text-slate-500">@ {SPORTSBOOKS_INFO[bestOver.book]?.shortName || bestOver.book}</span>
                      </div>
                      <div>
                        <span className="text-slate-400">Under:</span>
                        <span className="ml-2 font-mono text-green-400">{bestUnder.line} ({formatOdds(bestUnder.odds)})</span>
                        <span className="ml-1 text-xs text-slate-500">@ {SPORTSBOOKS_INFO[bestUnder.book]?.shortName || bestUnder.book}</span>
                      </div>
                    </div>
                  </div>

                  {/* Odds Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-800/50">
                        <tr className="text-slate-400">
                          <th className="text-left p-3">Sportsbook</th>
                          {selectedBetType === 'spread' && (
                            <>
                              <th className="text-center p-3">{game.awayTeam.split(' ').pop()}</th>
                              <th className="text-center p-3">{game.homeTeam.split(' ').pop()}</th>
                            </>
                          )}
                          {selectedBetType === 'total' && (
                            <>
                              <th className="text-center p-3">Over</th>
                              <th className="text-center p-3">Under</th>
                            </>
                          )}
                          {selectedBetType === 'moneyline' && (
                            <>
                              <th className="text-center p-3">{game.awayTeam.split(' ').pop()}</th>
                              <th className="text-center p-3">{game.homeTeam.split(' ').pop()}</th>
                            </>
                          )}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {game.bookmakers.slice(0, 8).map(bm => {
                          const info = SPORTSBOOKS_INFO[bm.key] || { name: bm.title, shortName: bm.key.toUpperCase(), color: '#666' }
                          const isBestAway = selectedBetType === 'spread' ? bm.key === bestAwaySpread.book :
                                            selectedBetType === 'total' ? bm.key === bestOver.book :
                                            bm.key === bestAwayML.book
                          const isBestHome = selectedBetType === 'spread' ? bm.key === bestHomeSpread.book :
                                            selectedBetType === 'total' ? bm.key === bestUnder.book :
                                            bm.key === bestHomeML.book
                          const historyKey = `${game.id}-${bm.key}`
                          const hasHistory = lineHistory[historyKey] && lineHistory[historyKey].length > 1

                          return (
                            <tr 
                              key={bm.key} 
                              className="hover:bg-slate-800/30 cursor-pointer transition-colors group"
                              onClick={() => openLineHistory(game, bm)}
                              title="Click to view line movement history"
                            >
                              <td className="p-3">
                                <div className="flex items-center gap-2">
                                  <div 
                                    className={`w-2 h-2 rounded-full bg-[${info.color}]`}
                                    style={{ backgroundColor: info.color }}
                                  />
                                  <span className="font-medium text-white">{info.name}</span>
                                  {hasHistory && (
                                    <Activity className="w-3 h-3 text-orange-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                                  )}
                                  <History className="w-3.5 h-3.5 text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity ml-auto" />
                                </div>
                              </td>
                              
                              {selectedBetType === 'spread' && bm.spread && (
                                <>
                                  <td className={`p-3 text-center ${isBestAway ? 'bg-green-500/10' : ''}`}>
                                    <span className="font-mono text-white">
                                      {bm.spread.away > 0 ? '+' : ''}{bm.spread.away}
                                    </span>
                                    <span className={`ml-1 text-sm ${isBestAway ? 'text-green-400 font-bold' : 'text-slate-400'}`}>
                                      ({formatOdds(bm.spread.awayOdds)})
                                    </span>
                                  </td>
                                  <td className={`p-3 text-center ${isBestHome ? 'bg-green-500/10' : ''}`}>
                                    <span className="font-mono text-white">
                                      {bm.spread.home > 0 ? '+' : ''}{bm.spread.home}
                                    </span>
                                    <span className={`ml-1 text-sm ${isBestHome ? 'text-green-400 font-bold' : 'text-slate-400'}`}>
                                      ({formatOdds(bm.spread.homeOdds)})
                                    </span>
                                  </td>
                                </>
                              )}
                              
                              {selectedBetType === 'total' && bm.total && (
                                <>
                                  <td className={`p-3 text-center ${isBestAway ? 'bg-green-500/10' : ''}`}>
                                    <span className="font-mono text-white">{bm.total.line}</span>
                                    <span className={`ml-1 text-sm ${isBestAway ? 'text-green-400 font-bold' : 'text-slate-400'}`}>
                                      ({formatOdds(bm.total.overOdds)})
                                    </span>
                                  </td>
                                  <td className={`p-3 text-center ${isBestHome ? 'bg-green-500/10' : ''}`}>
                                    <span className="font-mono text-white">{bm.total.line}</span>
                                    <span className={`ml-1 text-sm ${isBestHome ? 'text-green-400 font-bold' : 'text-slate-400'}`}>
                                      ({formatOdds(bm.total.underOdds)})
                                    </span>
                                  </td>
                                </>
                              )}
                              
                              {selectedBetType === 'moneyline' && bm.moneyline && (
                                <>
                                  <td className={`p-3 text-center ${isBestAway ? 'bg-green-500/10' : ''}`}>
                                    <span className={`font-mono ${bm.moneyline.away > 0 ? 'text-green-400' : 'text-white'} ${isBestAway ? 'font-bold' : ''}`}>
                                      {formatOdds(bm.moneyline.away)}
                                    </span>
                                  </td>
                                  <td className={`p-3 text-center ${isBestHome ? 'bg-green-500/10' : ''}`}>
                                    <span className={`font-mono ${bm.moneyline.home > 0 ? 'text-green-400' : 'text-white'} ${isBestHome ? 'font-bold' : ''}`}>
                                      {formatOdds(bm.moneyline.home)}
                                    </span>
                                  </td>
                                </>
                              )}
                              
                              {!bm.spread && selectedBetType === 'spread' && (
                                <>
                                  <td className="p-3 text-center text-slate-600">-</td>
                                  <td className="p-3 text-center text-slate-600">-</td>
                                </>
                              )}
                              {!bm.total && selectedBetType === 'total' && (
                                <>
                                  <td className="p-3 text-center text-slate-600">-</td>
                                  <td className="p-3 text-center text-slate-600">-</td>
                                </>
                              )}
                              {!bm.moneyline && selectedBetType === 'moneyline' && (
                                <>
                                  <td className="p-3 text-center text-slate-600">-</td>
                                  <td className="p-3 text-center text-slate-600">-</td>
                                </>
                              )}
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Footer Info */}
        <div className="mt-8 p-4 rounded-xl bg-slate-800/30 border border-slate-700">
          <p className="text-sm text-slate-400">
            <strong className="text-white">Data Source:</strong> The Odds API • 
            <strong className="text-white ml-2">Refresh Rate:</strong> Every 5 minutes • 
            <strong className="text-white ml-2">Books:</strong> FanDuel, DraftKings, BetMGM, Caesars, and more
          </p>
        </div>
      </div>
    </main>
  )
}
