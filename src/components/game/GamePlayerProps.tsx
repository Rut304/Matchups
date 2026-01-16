'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  TrendingUp,
  TrendingDown,
  Target,
  BarChart3,
  Zap,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Check,
  Info,
  ExternalLink,
  Star
} from 'lucide-react'

interface PropBook {
  name: string
  over: { odds: number; price: number }
  under: { odds: number; price: number }
}

interface PlayerProp {
  player: string
  team: string
  propType: string
  propDisplayName: string
  line: number
  books: PropBook[]
  bestOver: { book: string; odds: number } | null
  bestUnder: { book: string; odds: number } | null
  overUnderSplit: number
}

interface GamePlayerPropsProps {
  gameId: string
  sport: string
  awayTeam?: string
  homeTeam?: string
}

export function GamePlayerProps({ gameId, sport, awayTeam, homeTeam }: GamePlayerPropsProps) {
  const [props, setProps] = useState<PlayerProp[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedProp, setExpandedProp] = useState<string | null>(null)
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [source, setSource] = useState<string>('live')

  useEffect(() => {
    async function fetchProps() {
      try {
        setLoading(true)
        const res = await fetch(`/api/games/${gameId}/props?sport=${sport}`)
        if (!res.ok) throw new Error('Failed to fetch props')
        const data = await res.json()
        setProps(data.props || [])
        setSource(data.source || 'unknown')
        setError(null)
      } catch (err) {
        console.error('Props fetch error:', err)
        setError('Unable to load player props')
      } finally {
        setLoading(false)
      }
    }
    fetchProps()
  }, [gameId, sport])

  // Group props by type
  const propCategories = [...new Set(props.map(p => p.propDisplayName))]
  const filteredProps = filterCategory === 'all' 
    ? props 
    : props.filter(p => p.propDisplayName === filterCategory)

  function formatOdds(odds: number): string {
    if (odds >= 0) return `+${odds}`
    return `${odds}`
  }

  function getOddsColor(odds: number): string {
    if (odds >= 100) return 'text-green-400'
    if (odds >= 0) return 'text-green-300'
    if (odds >= -120) return 'text-yellow-400'
    return 'text-white'
  }

  function getSplitColor(split: number): string {
    if (split >= 65) return 'text-green-400' // Heavy over
    if (split >= 55) return 'text-green-300'
    if (split <= 35) return 'text-red-400' // Heavy under
    if (split <= 45) return 'text-red-300'
    return 'text-gray-400' // Even
  }

  if (loading) {
    return (
      <div className="rounded-xl p-6 bg-slate-900/50 border border-slate-800">
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="w-6 h-6 text-purple-500 animate-spin mr-2" />
          <span className="text-slate-400">Loading player props...</span>
        </div>
      </div>
    )
  }

  if (error || props.length === 0) {
    return (
      <div className="rounded-xl p-6 bg-slate-900/50 border border-slate-800">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-purple-500/20">
            <Target className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Player Props</h3>
            <p className="text-sm text-slate-400">Compare lines across sportsbooks</p>
          </div>
        </div>
        <div className="text-center py-6">
          <AlertTriangle className="w-8 h-8 text-slate-600 mx-auto mb-2" />
          <p className="text-slate-500">{error || 'No props available for this game'}</p>
          <p className="text-xs text-slate-600 mt-1">Props typically available 1-2 hours before game time</p>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl bg-slate-900/50 border border-slate-800">
      {/* Header */}
      <div className="p-4 border-b border-slate-800">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500/20">
              <Target className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                Player Props
                <span className={`text-xs px-2 py-0.5 rounded ${source === 'demo' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-green-500/20 text-green-400'}`}>
                  {source === 'demo' ? 'Demo' : 'Live'}
                </span>
              </h3>
              <p className="text-xs text-slate-400">Best odds highlighted • Click to expand</p>
            </div>
          </div>
          <Link 
            href={`/props/correlations?sport=${sport}`}
            className="flex items-center gap-1.5 text-xs font-medium text-purple-400 hover:text-purple-300"
          >
            Prop Correlations <ExternalLink className="w-3 h-3" />
          </Link>
        </div>

        {/* Category Filter */}
        {propCategories.length > 1 && (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilterCategory('all')}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                filterCategory === 'all' 
                  ? 'bg-purple-500/30 text-purple-300 border border-purple-500/50' 
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              All ({props.length})
            </button>
            {propCategories.slice(0, 5).map(cat => (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  filterCategory === cat 
                    ? 'bg-purple-500/30 text-purple-300 border border-purple-500/50' 
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Props List */}
      <div className="divide-y divide-slate-800 max-h-[500px] overflow-y-auto">
        {filteredProps.map((prop, idx) => {
          const isExpanded = expandedProp === `${prop.player}-${prop.propType}`
          const key = `${prop.player}-${prop.propType}`
          
          return (
            <div key={key} className="p-3 hover:bg-slate-800/30 transition-colors">
              {/* Main Row - Clickable */}
              <button
                onClick={() => setExpandedProp(isExpanded ? null : key)}
                className="w-full text-left"
              >
                <div className="flex items-center justify-between gap-4">
                  {/* Player & Prop */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white truncate">{prop.player}</span>
                      {prop.overUnderSplit >= 60 && (
                        <span className="flex items-center gap-0.5 text-xs text-green-400">
                          <TrendingUp className="w-3 h-3" /> O
                        </span>
                      )}
                      {prop.overUnderSplit <= 40 && (
                        <span className="flex items-center gap-0.5 text-xs text-red-400">
                          <TrendingDown className="w-3 h-3" /> U
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-400">{prop.propDisplayName}</div>
                  </div>

                  {/* Line */}
                  <div className="text-center">
                    <div className="text-lg font-bold text-purple-400 font-mono">{prop.line}</div>
                    <div className="text-[10px] text-slate-500">LINE</div>
                  </div>

                  {/* Best Over */}
                  <div className="text-center min-w-[70px]">
                    {prop.bestOver && (
                      <>
                        <div className={`text-sm font-bold font-mono ${getOddsColor(prop.bestOver.odds)}`}>
                          {formatOdds(prop.bestOver.odds)}
                        </div>
                        <div className="text-[10px] text-slate-500 truncate">{prop.bestOver.book}</div>
                      </>
                    )}
                  </div>

                  {/* Best Under */}
                  <div className="text-center min-w-[70px]">
                    {prop.bestUnder && (
                      <>
                        <div className={`text-sm font-bold font-mono ${getOddsColor(prop.bestUnder.odds)}`}>
                          {formatOdds(prop.bestUnder.odds)}
                        </div>
                        <div className="text-[10px] text-slate-500 truncate">{prop.bestUnder.book}</div>
                      </>
                    )}
                  </div>

                  {/* Expand Icon */}
                  <div className="text-slate-500">
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </div>

                {/* Public Split Bar */}
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex-1 h-1.5 rounded-full bg-slate-700 overflow-hidden">
                    <div 
                      className={`h-full transition-all ${
                        prop.overUnderSplit >= 60 ? 'bg-green-500' :
                        prop.overUnderSplit <= 40 ? 'bg-red-500' :
                        'bg-gray-500'
                      }`}
                      style={{ width: `${prop.overUnderSplit}%` }}
                    />
                  </div>
                  <span className={`text-[10px] font-medium ${getSplitColor(prop.overUnderSplit)}`}>
                    {prop.overUnderSplit}% Over
                  </span>
                </div>
              </button>

              {/* Expanded - All Books */}
              {isExpanded && (
                <div className="mt-3 pt-3 border-t border-slate-700">
                  <div className="text-xs font-semibold text-slate-400 mb-2">ALL SPORTSBOOKS</div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {prop.books.map((book, bidx) => {
                      const isBestOver = prop.bestOver?.book === book.name
                      const isBestUnder = prop.bestUnder?.book === book.name
                      
                      return (
                        <div 
                          key={bidx}
                          className={`p-2 rounded-lg ${
                            isBestOver || isBestUnder 
                              ? 'bg-purple-500/10 border border-purple-500/30' 
                              : 'bg-slate-800/50'
                          }`}
                        >
                          <div className="text-xs font-medium text-slate-300 mb-1 flex items-center gap-1">
                            {book.name}
                            {(isBestOver || isBestUnder) && (
                              <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                            )}
                          </div>
                          <div className="flex justify-between text-xs">
                            <div>
                              <span className="text-slate-500">O: </span>
                              <span className={getOddsColor(book.over.odds)}>{formatOdds(book.over.odds)}</span>
                            </div>
                            <div>
                              <span className="text-slate-500">U: </span>
                              <span className={getOddsColor(book.under.odds)}>{formatOdds(book.under.odds)}</span>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {/* DraftKings Warning */}
                  <div className="mt-3 p-2 rounded-lg bg-orange-500/10 border border-orange-500/20">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-orange-400 mt-0.5 flex-shrink-0" />
                      <div className="text-xs text-orange-300">
                        <span className="font-semibold">Shop for best odds.</span> The book suggesting a prop doesn't mean it's a good bet — 
                        they set lines to maximize their profit, not yours. Compare across books and look for value.
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-slate-800 bg-slate-900/30">
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>Showing {filteredProps.length} props • Lines from {props[0]?.books.length || 0} books</span>
          <Link 
            href={`/props/correlations?sport=${sport}`}
            className="flex items-center gap-1 text-purple-400 hover:text-purple-300"
          >
            Find correlated props <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </div>
  )
}
