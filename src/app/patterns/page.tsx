'use client'

import { useState, useEffect } from 'react'

interface MatchingGame {
  gameId: string
  sport: string
  homeTeam: string
  awayTeam: string
  gameTime: string
  matchedConditions: string[]
  recommendedBet: string
  edge: number
}

interface HistoricalPattern {
  id: string
  name: string
  description: string
  sport: string
  category: 'situational' | 'trend' | 'revenge' | 'rest' | 'weather' | 'divisional'
  conditions: string[]
  historicalRecord: {
    wins: number
    losses: number
    pushes: number
    winRate: number
    roi: number
  }
  sampleSize: number
  lastHit: string
  currentMatches: MatchingGame[]
  confidenceScore: number
}

const SPORTS = ['All', 'NFL', 'NBA', 'MLB', 'NHL']
const CATEGORIES = ['All', 'situational', 'trend', 'revenge', 'rest', 'weather', 'divisional']

const categoryColors: Record<string, string> = {
  situational: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  trend: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  revenge: 'bg-red-500/20 text-red-400 border-red-500/30',
  rest: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  weather: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  divisional: 'bg-green-500/20 text-green-400 border-green-500/30',
}

const categoryIcons: Record<string, string> = {
  situational: '🎯',
  trend: '📈',
  revenge: '🔥',
  rest: '😴',
  weather: '🌦️',
  divisional: '⚔️',
}

export default function PatternsPage() {
  const [patterns, setPatterns] = useState<HistoricalPattern[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSport, setSelectedSport] = useState('All')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [minConfidence, setMinConfidence] = useState(0)
  const [showOnlyMatches, setShowOnlyMatches] = useState(false)
  const [expandedPattern, setExpandedPattern] = useState<string | null>(null)
  const [meta, setMeta] = useState<{
    totalPatterns: number
    totalMatches: number
    avgWinRate: number
    avgRoi: number
  } | null>(null)

  useEffect(() => {
    fetchPatterns()
  }, [selectedSport, selectedCategory, minConfidence, showOnlyMatches])

  const fetchPatterns = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (selectedSport !== 'All') params.append('sport', selectedSport)
      if (selectedCategory !== 'All') params.append('category', selectedCategory)
      if (minConfidence > 0) params.append('minConfidence', minConfidence.toString())
      if (showOnlyMatches) params.append('withMatches', 'true')
      
      const res = await fetch(`/api/patterns?${params}`)
      const data = await res.json()
      setPatterns(data.patterns || [])
      setMeta(data.meta || null)
    } catch (error) {
      console.error('Failed to fetch patterns:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <span className="text-xl">📜</span>
            </div>
            <h1 className="text-3xl font-bold text-white">Historical Pattern Matcher</h1>
          </div>
          <p className="text-gray-400">
            Match current games against proven historical betting patterns with strong track records
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-4">
            <div className="text-gray-400 text-sm mb-1">Total Patterns</div>
            <div className="text-2xl font-bold text-white">{meta?.totalPatterns || 0}</div>
          </div>
          <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-4">
            <div className="text-gray-400 text-sm mb-1">Active Matches</div>
            <div className="text-2xl font-bold text-green-400">{meta?.totalMatches || 0}</div>
          </div>
          <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-4">
            <div className="text-gray-400 text-sm mb-1">Avg Win Rate</div>
            <div className="text-2xl font-bold text-blue-400">{meta?.avgWinRate || 0}%</div>
          </div>
          <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-4">
            <div className="text-gray-400 text-sm mb-1">Avg ROI</div>
            <div className="text-2xl font-bold text-purple-400">+{meta?.avgRoi || 0}%</div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Sport Filter */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">Sport</label>
              <div className="flex flex-wrap gap-2">
                {SPORTS.map(sport => (
                  <button
                    key={sport}
                    onClick={() => setSelectedSport(sport)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      selectedSport === sport
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-700/50 text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    {sport}
                  </button>
                ))}
              </div>
            </div>

            {/* Category Filter */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
              >
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>
                    {cat === 'All' ? 'All Categories' : `${categoryIcons[cat]} ${cat.charAt(0).toUpperCase() + cat.slice(1)}`}
                  </option>
                ))}
              </select>
            </div>

            {/* Confidence Filter */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">
                Min Confidence: {minConfidence}%
              </label>
              <input
                type="range"
                min="0"
                max="80"
                step="5"
                value={minConfidence}
                onChange={(e) => setMinConfidence(parseInt(e.target.value))}
                className="w-full"
              />
            </div>

            {/* Match Toggle */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">Show Only</label>
              <button
                onClick={() => setShowOnlyMatches(!showOnlyMatches)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  showOnlyMatches
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-700/50 text-gray-300 hover:bg-gray-700'
                }`}
              >
                {showOnlyMatches ? '✓ With Active Matches' : 'All Patterns'}
              </button>
            </div>
          </div>
        </div>

        {/* Patterns Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : patterns.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🔍</div>
            <p className="text-gray-400">No patterns match your criteria</p>
          </div>
        ) : (
          <div className="space-y-4">
            {patterns.map(pattern => (
              <div
                key={pattern.id}
                className={`bg-gray-800/50 border rounded-xl overflow-hidden transition-all ${
                  pattern.currentMatches.length > 0
                    ? 'border-green-500/50'
                    : 'border-gray-700/50'
                }`}
              >
                {/* Pattern Header */}
                <div
                  className="p-4 cursor-pointer hover:bg-gray-700/30 transition-colors"
                  onClick={() => setExpandedPattern(
                    expandedPattern === pattern.id ? null : pattern.id
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="text-2xl">{categoryIcons[pattern.category]}</div>
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="font-bold text-white text-lg">{pattern.name}</h3>
                          <span className={`px-2 py-0.5 rounded-full text-xs border ${categoryColors[pattern.category]}`}>
                            {pattern.category}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-xs bg-gray-700 text-gray-300">
                            {pattern.sport}
                          </span>
                          {pattern.currentMatches.length > 0 && (
                            <span className="px-2 py-0.5 rounded-full text-xs bg-green-500/20 text-green-400 border border-green-500/30">
                              {pattern.currentMatches.length} Active Match{pattern.currentMatches.length > 1 ? 'es' : ''}
                            </span>
                          )}
                        </div>
                        <p className="text-gray-400 text-sm">{pattern.description}</p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-xl font-bold text-white">
                        {pattern.historicalRecord.winRate}%
                      </div>
                      <div className="text-sm text-green-400">
                        +{pattern.historicalRecord.roi}% ROI
                      </div>
                    </div>
                  </div>

                  {/* Quick Stats */}
                  <div className="flex items-center gap-6 mt-4">
                    <div className="text-sm">
                      <span className="text-gray-400">Record: </span>
                      <span className="text-green-400">{pattern.historicalRecord.wins}W</span>
                      <span className="text-gray-500"> - </span>
                      <span className="text-red-400">{pattern.historicalRecord.losses}L</span>
                      {pattern.historicalRecord.pushes > 0 && (
                        <>
                          <span className="text-gray-500"> - </span>
                          <span className="text-gray-400">{pattern.historicalRecord.pushes}P</span>
                        </>
                      )}
                    </div>
                    <div className="text-sm">
                      <span className="text-gray-400">Sample: </span>
                      <span className="text-white">{pattern.sampleSize} games</span>
                    </div>
                    <div className="text-sm">
                      <span className="text-gray-400">Confidence: </span>
                      <span className={
                        pattern.confidenceScore >= 75 ? 'text-green-400' :
                        pattern.confidenceScore >= 65 ? 'text-yellow-400' : 'text-orange-400'
                      }>
                        {pattern.confidenceScore}%
                      </span>
                    </div>
                    <div className="ml-auto text-gray-500">
                      {expandedPattern === pattern.id ? '▲' : '▼'}
                    </div>
                  </div>
                </div>

                {/* Expanded Content */}
                {expandedPattern === pattern.id && (
                  <div className="border-t border-gray-700/50 bg-gray-900/50">
                    {/* Conditions */}
                    <div className="p-4 border-b border-gray-700/30">
                      <h4 className="text-sm font-semibold text-gray-300 mb-2">Pattern Conditions</h4>
                      <div className="flex flex-wrap gap-2">
                        {pattern.conditions.map((condition, idx) => (
                          <span
                            key={idx}
                            className="px-3 py-1 bg-gray-700/50 rounded-lg text-sm text-gray-300"
                          >
                            {condition}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Current Matches */}
                    {pattern.currentMatches.length > 0 ? (
                      <div className="p-4">
                        <h4 className="text-sm font-semibold text-green-400 mb-3">
                          🎯 Currently Matching Games
                        </h4>
                        <div className="grid gap-3">
                          {pattern.currentMatches.map(match => (
                            <div
                              key={match.gameId}
                              className="bg-gray-800/80 border border-green-500/30 rounded-lg p-4"
                            >
                              <div className="flex items-center justify-between mb-2">
                                <div className="font-semibold text-white">
                                  {match.awayTeam} @ {match.homeTeam}
                                </div>
                                <div className="text-sm text-gray-400">
                                  {formatDate(match.gameTime)}
                                </div>
                              </div>
                              <div className="flex items-center justify-between">
                                <div className="flex flex-wrap gap-2">
                                  {match.matchedConditions.map((cond, idx) => (
                                    <span
                                      key={idx}
                                      className="px-2 py-0.5 bg-green-500/20 text-green-400 rounded text-xs"
                                    >
                                      ✓ {cond}
                                    </span>
                                  ))}
                                </div>
                                <div className="text-right">
                                  <div className="text-purple-400 font-semibold">
                                    {match.recommendedBet}
                                  </div>
                                  <div className="text-xs text-gray-400">
                                    Edge: +{match.edge}%
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 text-center">
                        <div className="text-gray-500 text-sm">
                          No games currently match this pattern. Check back before game time!
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Educational Note */}
        <div className="mt-8 bg-gradient-to-r from-purple-900/30 to-blue-900/30 border border-purple-500/30 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <div className="text-2xl">📚</div>
            <div>
              <h3 className="font-bold text-white mb-2">Understanding Pattern Matching</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Historical patterns are statistically significant trends observed over many years of data.
                While past performance doesn&apos;t guarantee future results, these patterns have shown
                consistent edge over time. Always verify all conditions are truly met before betting,
                and consider the pattern as one factor in your overall analysis.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
