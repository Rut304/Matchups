'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { 
  Search, Filter, TrendingUp, Trophy, Star, Users, 
  Copy, Heart, ChevronRight, Loader2, ArrowUpRight,
  Target, BarChart3, Zap, Clock, Award, RefreshCw,
  X, Check, Sparkles, DollarSign, Shield
} from 'lucide-react'
import { useAuth } from '@/lib/auth-context'

interface MarketplaceListing {
  id: string
  system_id: string
  creator_id: string
  title: string
  short_description: string
  tags: string[]
  is_free: boolean
  price_cents: number
  total_picks: number
  wins: number
  losses: number
  pushes: number
  win_rate: number
  roi: number
  avg_odds: number
  streak: number
  copies_count: number
  views_count: number
  likes_count: number
  is_featured: boolean
  published_at: string
  creator_username: string
  creator_avatar: string | null
  sport: string
  bet_type: string
  criteria: string[]
  userLiked?: boolean
  userCopied?: boolean
}

const SPORTS = ['ALL', 'NFL', 'NBA', 'NHL', 'MLB', 'NCAAF', 'NCAAB']
const BET_TYPES = [
  { value: 'all', label: 'All Types' },
  { value: 'spread', label: 'Spread' },
  { value: 'total', label: 'Totals' },
  { value: 'moneyline', label: 'Moneyline' },
  { value: 'prop', label: 'Props' },
  { value: 'mixed', label: 'Mixed' }
]
const SORT_OPTIONS = [
  { value: 'winRate', label: 'Highest Win Rate' },
  { value: 'roi', label: 'Best ROI' },
  { value: 'copies', label: 'Most Popular' },
  { value: 'recent', label: 'Recently Added' }
]

export default function MarketplacePage() {
  const { user } = useAuth()
  const [listings, setListings] = useState<MarketplaceListing[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Filters
  const [selectedSport, setSelectedSport] = useState('ALL')
  const [selectedBetType, setSelectedBetType] = useState('all')
  const [sortBy, setSortBy] = useState('winRate')
  const [searchQuery, setSearchQuery] = useState('')
  const [minWinRate, setMinWinRate] = useState(52)
  const [showFilters, setShowFilters] = useState(false)
  
  // Actions
  const [copyingId, setCopyingId] = useState<string | null>(null)
  const [likingId, setLikingId] = useState<string | null>(null)
  const [copiedSuccess, setCopiedSuccess] = useState<string | null>(null)

  const fetchListings = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({
        sport: selectedSport,
        betType: selectedBetType,
        sortBy,
        minWinRate: minWinRate.toString()
      })

      if (searchQuery) {
        params.set('search', searchQuery)
      }

      const response = await fetch(`/api/marketplace?${params}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch listings')
      }

      setListings(data.listings || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load marketplace')
    } finally {
      setLoading(false)
    }
  }, [selectedSport, selectedBetType, sortBy, minWinRate, searchQuery])

  useEffect(() => {
    fetchListings()
  }, [fetchListings])

  const handleCopy = async (listingId: string) => {
    if (!user) {
      window.location.href = '/auth?redirect=/marketplace'
      return
    }

    setCopyingId(listingId)
    try {
      const response = await fetch(`/api/marketplace/${listingId}/copy`, {
        method: 'POST'
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to copy system')
      }

      // Update local state
      setListings(prev => prev.map(l => 
        l.id === listingId 
          ? { ...l, copies_count: l.copies_count + 1, userCopied: true }
          : l
      ))
      setCopiedSuccess(listingId)
      setTimeout(() => setCopiedSuccess(null), 3000)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to copy')
    } finally {
      setCopyingId(null)
    }
  }

  const handleLike = async (listingId: string) => {
    if (!user) {
      window.location.href = '/auth?redirect=/marketplace'
      return
    }

    setLikingId(listingId)
    try {
      const response = await fetch(`/api/marketplace/${listingId}/like`, {
        method: 'POST'
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update like')
      }

      // Update local state
      setListings(prev => prev.map(l => 
        l.id === listingId 
          ? { 
              ...l, 
              likes_count: data.liked ? l.likes_count + 1 : l.likes_count - 1,
              userLiked: data.liked 
            }
          : l
      ))
    } catch (err) {
      console.error('Like error:', err)
    } finally {
      setLikingId(null)
    }
  }

  const getRecordDisplay = (listing: MarketplaceListing) => {
    return `${listing.wins}-${listing.losses}${listing.pushes > 0 ? `-${listing.pushes}` : ''}`
  }

  const getSportColor = (sport: string) => {
    const colors: Record<string, string> = {
      NFL: '#013369',
      NBA: '#C8102E',
      NHL: '#000000',
      MLB: '#002D72',
      NCAAF: '#4B0082',
      NCAAB: '#FF6B00'
    }
    return colors[sport] || '#808080'
  }

  return (
    <div className="min-h-screen bg-[#050508]">
      {/* Header */}
      <section className="border-b border-white/5 bg-[#0a0a12]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-3xl font-bold text-white">System Marketplace</h1>
              </div>
              <p className="text-gray-400 max-w-xl">
                Discover and copy proven betting systems from top performers. 
                All systems require minimum 5 picks with 52%+ win rate.
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <Link 
                href="/trend-finder"
                className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl font-medium hover:opacity-90 transition-opacity"
              >
                <Sparkles className="w-4 h-4" />
                Create System
              </Link>
              {user && (
                <Link 
                  href="/dashboard?tab=systems"
                  className="flex items-center gap-2 px-4 py-2.5 bg-white/5 text-white rounded-xl font-medium hover:bg-white/10 transition-colors"
                >
                  My Systems
                  <ChevronRight className="w-4 h-4" />
                </Link>
              )}
            </div>
          </div>

          {/* Quality Badge */}
          <div className="mt-6 flex items-center gap-2 text-sm">
            <Shield className="w-4 h-4 text-emerald-400" />
            <span className="text-emerald-400 font-medium">Quality Verified</span>
            <span className="text-gray-500">•</span>
            <span className="text-gray-400">Min 5 picks, 52%+ win rate required for listing</span>
          </div>
          
          {/* Bankroll Systems Link */}
          <div className="mt-4">
            <Link 
              href="/marketplace/bankroll-systems"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30 text-emerald-400 hover:from-emerald-500/30 hover:to-cyan-500/30 transition-all"
            >
              <DollarSign className="w-4 h-4" />
              Bankroll Management Systems
              <span className="text-xs text-emerald-500/70">NEW</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Filters Bar */}
      <section className="sticky top-0 z-20 bg-[#0a0a12]/95 backdrop-blur-sm border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search systems..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
              />
            </div>

            {/* Sport Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 lg:pb-0">
              {SPORTS.map(sport => (
                <button
                  key={sport}
                  onClick={() => setSelectedSport(sport)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                    selectedSport === sport
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                      : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {sport}
                </button>
              ))}
            </div>

            {/* More Filters Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                showFilters ? 'bg-purple-500/20 text-purple-400' : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
            >
              <Filter className="w-4 h-4" />
              Filters
            </button>
          </div>

          {/* Expanded Filters */}
          {showFilters && (
            <div className="mt-4 p-4 bg-white/5 rounded-xl grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="bet-type-filter" className="block text-xs text-gray-500 mb-2">Bet Type</label>
                <select
                  id="bet-type-filter"
                  value={selectedBetType}
                  onChange={(e) => setSelectedBetType(e.target.value)}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm"
                >
                  {BET_TYPES.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="sort-by-filter" className="block text-xs text-gray-500 mb-2">Sort By</label>
                <select
                  id="sort-by-filter"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm"
                >
                  {SORT_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="win-rate-filter" className="block text-xs text-gray-500 mb-2">Min Win Rate: {minWinRate}%</label>
                <input
                  id="win-rate-filter"
                  type="range"
                  min="52"
                  max="80"
                  value={minWinRate}
                  onChange={(e) => setMinWinRate(parseInt(e.target.value))}
                  className="w-full accent-purple-500"
                />
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Main Content */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="p-4 bg-[#0f0f18] rounded-xl border border-white/5">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span className="text-xs text-gray-500">Active Systems</span>
            </div>
            <p className="text-2xl font-bold text-white">{listings.length}</p>
          </div>
          <div className="p-4 bg-[#0f0f18] rounded-xl border border-white/5">
            <div className="flex items-center gap-2 mb-1">
              <Trophy className="w-4 h-4 text-amber-400" />
              <span className="text-xs text-gray-500">Avg Win Rate</span>
            </div>
            <p className="text-2xl font-bold text-white">
              {listings.length > 0 
                ? (listings.reduce((acc, l) => acc + l.win_rate, 0) / listings.length).toFixed(1)
                : '0'}%
            </p>
          </div>
          <div className="p-4 bg-[#0f0f18] rounded-xl border border-white/5">
            <div className="flex items-center gap-2 mb-1">
              <Copy className="w-4 h-4 text-purple-400" />
              <span className="text-xs text-gray-500">Total Copies</span>
            </div>
            <p className="text-2xl font-bold text-white">
              {listings.reduce((acc, l) => acc + l.copies_count, 0)}
            </p>
          </div>
          <div className="p-4 bg-[#0f0f18] rounded-xl border border-white/5">
            <div className="flex items-center gap-2 mb-1">
              <Target className="w-4 h-4 text-blue-400" />
              <span className="text-xs text-gray-500">Total Picks</span>
            </div>
            <p className="text-2xl font-bold text-white">
              {listings.reduce((acc, l) => acc + l.total_picks, 0)}
            </p>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-20">
            <p className="text-red-400 mb-4">{error}</p>
            <button 
              onClick={fetchListings}
              className="flex items-center gap-2 mx-auto px-4 py-2 bg-white/5 text-white rounded-lg hover:bg-white/10"
            >
              <RefreshCw className="w-4 h-4" />
              Retry
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && listings.length === 0 && (
          <div className="text-center py-20">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-purple-500/10 flex items-center justify-center">
              <TrendingUp className="w-8 h-8 text-purple-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">No systems found</h3>
            <p className="text-gray-400 mb-6">
              Try adjusting your filters or be the first to publish a system!
            </p>
            <Link 
              href="/trend-finder"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-medium"
            >
              <Sparkles className="w-4 h-4" />
              Create Your First System
            </Link>
          </div>
        )}

        {/* Listings Grid */}
        {!loading && !error && listings.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {listings.map(listing => (
              <div
                key={listing.id}
                className="group relative bg-[#0f0f18] rounded-2xl border border-white/5 overflow-hidden hover:border-purple-500/30 transition-all"
              >
                {/* Featured Badge */}
                {listing.is_featured && (
                  <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 bg-amber-500/20 rounded-full z-10">
                    <Award className="w-3 h-3 text-amber-400" />
                    <span className="text-xs text-amber-400 font-medium">Featured</span>
                  </div>
                )}

                {/* Clickable Card Link */}
                <Link href={`/marketplace/${listing.system_id || listing.id}`} className="block">
                  {/* Header */}
                  <div className="p-5 pb-4">
                    <div className="flex items-start gap-3 mb-3">
                      <div 
                        className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                        style={{ background: getSportColor(listing.sport) }}
                      >
                        {listing.sport?.slice(0, 3) || '???'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-white truncate group-hover:text-purple-400 transition-colors">
                          {listing.title}
                        </h3>
                        <p className="text-xs text-gray-500">by {listing.creator_username}</p>
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-400 line-clamp-2 mb-4">
                      {listing.short_description}
                    </p>

                    {/* Tags */}
                    {listing.tags && listing.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {listing.tags.slice(0, 3).map((tag, i) => (
                          <span 
                            key={i}
                            className="px-2 py-0.5 text-xs bg-white/5 text-gray-400 rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-3 gap-px bg-white/5">
                    <div className="bg-[#0f0f18] p-3 text-center">
                      <p className="text-lg font-bold text-white">{listing.win_rate.toFixed(1)}%</p>
                      <p className="text-xs text-gray-500">Win Rate</p>
                    </div>
                    <div className="bg-[#0f0f18] p-3 text-center">
                      <p className="text-lg font-bold text-emerald-400">
                        {getRecordDisplay(listing)}
                      </p>
                      <p className="text-xs text-gray-500">Record</p>
                    </div>
                    <div className="bg-[#0f0f18] p-3 text-center">
                      <p className={`text-lg font-bold ${listing.roi >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {listing.roi >= 0 ? '+' : ''}{listing.roi.toFixed(1)}%
                      </p>
                      <p className="text-xs text-gray-500">ROI</p>
                    </div>
                  </div>
                </Link>

                {/* Footer */}
                <div className="p-4 flex items-center justify-between border-t border-white/5">
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Copy className="w-3.5 h-3.5" />
                      {listing.copies_count}
                    </span>
                    <span className="flex items-center gap-1">
                      <Heart className="w-3.5 h-3.5" />
                      {listing.likes_count}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleLike(listing.id)}
                      disabled={likingId === listing.id}
                      aria-label={listing.userLiked ? 'Unlike this system' : 'Like this system'}
                      className={`p-2 rounded-lg transition-colors ${
                        listing.userLiked 
                          ? 'bg-pink-500/20 text-pink-400' 
                          : 'bg-white/5 text-gray-400 hover:text-pink-400 hover:bg-pink-500/10'
                      }`}
                    >
                      <Heart className={`w-4 h-4 ${listing.userLiked ? 'fill-current' : ''}`} />
                    </button>

                    {listing.userCopied || copiedSuccess === listing.id ? (
                      <div className="flex items-center gap-1.5 px-3 py-2 bg-emerald-500/20 text-emerald-400 rounded-lg text-sm font-medium">
                        <Check className="w-4 h-4" />
                        Copied
                      </div>
                    ) : (
                      <button
                        onClick={() => handleCopy(listing.id)}
                        disabled={copyingId === listing.id}
                        className="flex items-center gap-1.5 px-3 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                      >
                        {copyingId === listing.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                        Copy
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
