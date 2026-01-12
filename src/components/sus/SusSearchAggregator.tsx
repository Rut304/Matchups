/**
 * Sus Play Search Aggregator
 * Searches X/Twitter and Reddit for suspicious sports betting plays
 * Aggregates and displays results for user review
 */

'use client'

import { useState, useCallback } from 'react'
import { 
  Search, 
  Loader2, 
  RefreshCw, 
  Twitter, 
  ExternalLink,
  AlertTriangle,
  Clock,
  TrendingUp,
  Filter,
  Hash
} from 'lucide-react'

// =============================================================================
// QUALITY FILTERS - Only show credible, viral sus plays with video evidence
// =============================================================================
const QUALITY_THRESHOLDS = {
  minLikes: 500,           // Minimum likes to be considered
  minRetweets: 100,        // Minimum retweets for virality
  minComments: 25,         // Shows discussion/debate
  minFollowers: 10000,     // Account credibility (for non-verified)
  verifiedBonus: true,     // Verified accounts get lower thresholds
  mustHaveVideo: true,     // Video evidence required
  maxAgeHours: 72,         // Only recent posts (3 days)
  minSusScore: 70,         // Minimum community sus rating
}

// Credibility scoring for accounts
const ACCOUNT_CREDIBILITY: Record<string, { score: number; verified: boolean; specialty: string }> = {
  '@RIGGEDFORVEGAS': { score: 92, verified: true, specialty: 'Spread impacts & ref calls' },
  '@SavageSports_': { score: 88, verified: true, specialty: 'End game situations' },
  '@BadRefCalls': { score: 85, verified: false, specialty: 'Referee compilations' },
  '@TheFixIsIn': { score: 78, verified: false, specialty: 'Conspiracy analysis' },
  '@RefWatch': { score: 82, verified: false, specialty: 'Real-time ref tracking' },
}

// Predefined search queries for finding sus plays
const RECURRING_SEARCHES = {
  twitter: [
    // Account-specific searches - CURATED for quality
    { handle: '@RIGGEDFORVEGAS', label: 'Rigged For Vegas', icon: '🎰', credibility: 92 },
    { handle: '@SavageSports_', label: 'Savage Sports', icon: '🔥', credibility: 88 },
    { handle: '@RefWatch', label: 'Ref Watch', icon: '👀', credibility: 82 },
    { handle: '@TheFixIsIn', label: 'The Fix Is In', icon: '🚨', credibility: 78 },
    { handle: '@BadRefCalls', label: 'Bad Ref Calls', icon: '🦓', credibility: 85 },
    // Hashtag searches - require higher engagement
    { handle: '#RiggedNFL', label: 'NFL Rigged', icon: '🏈', minLikes: 1000 },
    { handle: '#RiggedNBA', label: 'NBA Rigged', icon: '🏀', minLikes: 1000 },
    { handle: '#SusPlay', label: 'Sus Plays', icon: '🔍', minLikes: 500 },
    { handle: '#BadBeat', label: 'Bad Beats', icon: '💔', minLikes: 2000 },
    { handle: '#RefBall', label: 'Ref Ball', icon: '🦓', minLikes: 750 },
  ],
  reddit: [
    { subreddit: 'r/sportsbook', label: 'Sportsbook', icon: '🎰', minUpvotes: 100 },
    { subreddit: 'r/sportsbetting', label: 'Sports Betting', icon: '💰', minUpvotes: 75 },
    { subreddit: 'r/SportsConspiracy', label: 'Sports Conspiracy', icon: '🔍', minUpvotes: 50 },
    { subreddit: 'r/nba', label: 'NBA', icon: '🏀', minUpvotes: 500 },
    { subreddit: 'r/nfl', label: 'NFL', icon: '🏈', minUpvotes: 500 },
  ],
  keywords: [
    'sus play',
    'rigged',
    'ref helped',
    'bad call',
    'point shaving',
    'tank',
    'intentional foul',
    'missed call',
    'garbage time',
    'backdoor cover',
  ]
}

// Sport filters
const SPORTS = ['ALL', 'NFL', 'NBA', 'MLB', 'NHL', 'NCAAF', 'NCAAB', 'WNBA', 'SOCCER']

// Time filters
const TIME_FILTERS = [
  { value: '1h', label: '1 Hour' },
  { value: '24h', label: '24 Hours' },
  { value: '7d', label: '7 Days' },
  { value: '30d', label: '30 Days' },
]

interface SusResult {
  id: string
  platform: 'twitter' | 'reddit'
  author: string
  authorHandle?: string
  content: string
  timestamp: string
  url: string
  sport?: string
  hasVideo: boolean
  engagement: {
    likes: number
    retweets?: number
    comments: number
  }
  susScore: number
  tags: string[]
  accountCredibility?: number
  qualityScore: number // Computed based on engagement, video, credibility
}

// Calculate quality score for a post
function calculateQualityScore(result: Omit<SusResult, 'qualityScore'>): number {
  let score = 0
  
  // Video evidence is critical (0-30 points)
  if (result.hasVideo) score += 30
  
  // Engagement scoring (0-40 points)
  const { likes, retweets = 0, comments } = result.engagement
  if (likes >= 5000) score += 20
  else if (likes >= 2000) score += 15
  else if (likes >= 1000) score += 10
  else if (likes >= 500) score += 5
  
  if (retweets >= 1000) score += 10
  else if (retweets >= 500) score += 7
  else if (retweets >= 100) score += 4
  
  if (comments >= 200) score += 10
  else if (comments >= 100) score += 7
  else if (comments >= 50) score += 4
  
  // Account credibility (0-20 points)
  const credibility = result.accountCredibility || 50
  score += Math.floor(credibility / 5)
  
  // Sus score from community (0-10 points)
  score += Math.floor(result.susScore / 10)
  
  return Math.min(100, score)
}

// Filter results based on quality thresholds
function filterByQuality(results: SusResult[]): SusResult[] {
  return results
    .filter(r => {
      // Must have video for full credibility
      if (QUALITY_THRESHOLDS.mustHaveVideo && !r.hasVideo) return false
      
      // Minimum engagement
      if (r.engagement.likes < QUALITY_THRESHOLDS.minLikes) return false
      
      // Minimum sus score from community
      if (r.susScore < QUALITY_THRESHOLDS.minSusScore) return false
      
      // Quality score threshold
      if (r.qualityScore < 50) return false
      
      return true
    })
    .sort((a, b) => b.qualityScore - a.qualityScore)
}

// Mock search results - QUALITY FILTERED (only high-engagement viral clips)
const mockSearchResultsRaw = [
  {
    id: 'mock-1',
    platform: 'twitter' as const,
    author: 'RIGGEDFORVEGAS',
    authorHandle: '@RIGGEDFORVEGAS',
    content: '🚨 This ref just called a phantom foul with 2 seconds left to give the Lakers the cover. Someone check this guys bank account. #RiggedNBA #SusPlay',
    timestamp: '2025-01-07T22:15:00Z',
    url: 'https://x.com/RIGGEDFORVEGAS/status/1949878466884648994',
    sport: 'NBA',
    hasVideo: true,
    engagement: { likes: 4523, retweets: 1890, comments: 342 },
    susScore: 91,
    tags: ['ref', 'phantom foul', 'cover', 'nba'],
    accountCredibility: 92,
    qualityScore: 0 // Will be calculated
  },
  {
    id: 'mock-2',
    platform: 'twitter' as const,
    author: 'SavageSports_',
    authorHandle: '@SavageSports_',
    content: 'How does this happen? QB takes a knee on 3rd down with 30 seconds left when theyre down by 3? Vegas had them -2.5. Investigate. 🔍',
    timestamp: '2025-01-07T21:30:00Z',
    url: 'https://x.com/SavageSports_/status/1981353713718439999',
    sport: 'NFL',
    hasVideo: true,
    engagement: { likes: 3201, retweets: 980, comments: 567 },
    susScore: 88,
    tags: ['garbage time', 'spread', 'tank', 'nfl'],
    accountCredibility: 88,
    qualityScore: 0
  },
  {
    id: 'mock-3',
    platform: 'reddit' as const,
    author: 'SportsbookMod',
    content: '[Serious] That Celtics/Heat ending was absolutely criminal. 3 straight missed calls in the final minute, all benefiting Heat who covered -4.5. Vegas cleaned up tonight.',
    timestamp: '2025-01-07T20:45:00Z',
    url: 'https://reddit.com/r/sportsbook/comments/abc123',
    sport: 'NBA',
    hasVideo: true,
    engagement: { likes: 2341, comments: 456 },
    susScore: 85,
    tags: ['missed calls', 'cover', 'nba', 'refs'],
    accountCredibility: 75,
    qualityScore: 0
  },
  {
    id: 'mock-4',
    platform: 'twitter' as const,
    author: 'BadRefCalls',
    authorHandle: '@BadRefCalls',
    content: 'COMPILATION: Every questionable call from todays NFL playoff games. Thread 🧵 The over hit in 4/4 games after late game penalties. Coincidence?',
    timestamp: '2025-01-07T19:00:00Z',
    url: 'https://x.com/BadRefCalls/status/123456789',
    sport: 'NFL',
    hasVideo: true,
    engagement: { likes: 8921, retweets: 3456, comments: 890 },
    susScore: 79,
    tags: ['compilation', 'penalties', 'over', 'nfl'],
    accountCredibility: 85,
    qualityScore: 0
  }
]

const mockSearchResults: SusResult[] = mockSearchResultsRaw.map(r => ({ 
  ...r, 
  qualityScore: calculateQualityScore(r as Omit<SusResult, 'qualityScore'>) 
}))

export function SusSearchAggregator() {
  const [isSearching, setIsSearching] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [results, setResults] = useState<SusResult[]>(mockSearchResults)
  const [selectedSport, setSelectedSport] = useState('ALL')
  const [selectedTime, setSelectedTime] = useState('24h')
  const [showFilters, setShowFilters] = useState(false)

  // Simulate search
  const performSearch = useCallback(async () => {
    setIsSearching(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500))
    setResults(mockSearchResults.filter(r => 
      selectedSport === 'ALL' || r.sport === selectedSport
    ))
    setIsSearching(false)
  }, [selectedSport])

  // Generate X/Twitter search URL
  const getTwitterSearchUrl = (query: string) => {
    return `https://twitter.com/search?q=${encodeURIComponent(query)}&src=typed_query&f=live`
  }

  // Generate Reddit search URL
  const getRedditSearchUrl = (query: string, subreddit?: string) => {
    if (subreddit) {
      return `https://reddit.com/${subreddit}/search?q=${encodeURIComponent(query)}&restrict_sr=1&sort=new`
    }
    return `https://reddit.com/search?q=${encodeURIComponent(query)}&sort=new`
  }

  // Format timestamp
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    if (hours < 1) return 'Just now'
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    return `${days}d ago`
  }

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: '#0c0c14', border: '1px solid rgba(255,255,255,0.06)' }}>
      {/* Header */}
      <div className="p-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Search className="w-5 h-5" style={{ color: '#FF4455' }} />
            <h3 className="font-bold text-lg" style={{ color: '#FFF' }}>Sus Play Aggregator</h3>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold" style={{ background: 'rgba(255,68,85,0.2)', color: '#FF4455' }}>
              LIVE
            </span>
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="p-2 rounded-lg transition-all hover:bg-white/10"
            style={{ color: '#808090' }}
            aria-label="Toggle filters"
          >
            <Filter className="w-4 h-4" />
          </button>
        </div>

        {/* Search Input */}
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for sus plays, bad calls, rigged games..."
              className="w-full px-4 py-2.5 pl-10 rounded-xl text-sm"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#FFF',
                outline: 'none',
              }}
              onKeyDown={(e) => e.key === 'Enter' && performSearch()}
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#606070' }} />
          </div>
          <button
            onClick={performSearch}
            disabled={isSearching}
            className="px-4 py-2.5 rounded-xl font-bold text-sm transition-all hover:scale-105 disabled:opacity-50"
            style={{
              background: 'linear-gradient(135deg, #FF4455 0%, #FF6B6B 100%)',
              color: '#FFF',
            }}
          >
            {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Search'}
          </button>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="mt-4 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            {/* Sport Filter */}
            <div className="mb-3">
              <span className="text-xs font-semibold mb-2 block" style={{ color: '#606070' }}>SPORT</span>
              <div className="flex flex-wrap gap-1">
                {SPORTS.map(sport => (
                  <button
                    key={sport}
                    onClick={() => setSelectedSport(sport)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                    style={{
                      background: selectedSport === sport ? 'rgba(255,68,85,0.2)' : 'rgba(255,255,255,0.05)',
                      color: selectedSport === sport ? '#FF4455' : '#808090',
                      border: selectedSport === sport ? '1px solid rgba(255,68,85,0.3)' : '1px solid transparent',
                    }}
                  >
                    {sport}
                  </button>
                ))}
              </div>
            </div>

            {/* Time Filter */}
            <div>
              <span className="text-xs font-semibold mb-2 block" style={{ color: '#606070' }}>TIME</span>
              <div className="flex gap-1">
                {TIME_FILTERS.map(tf => (
                  <button
                    key={tf.value}
                    onClick={() => setSelectedTime(tf.value)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                    style={{
                      background: selectedTime === tf.value ? 'rgba(0,168,255,0.2)' : 'rgba(255,255,255,0.05)',
                      color: selectedTime === tf.value ? '#00A8FF' : '#808090',
                    }}
                  >
                    {tf.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Quick Search Links */}
      <div className="p-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <span className="text-xs font-semibold mb-3 block" style={{ color: '#606070' }}>
          RECURRING SEARCHES
        </span>
        
        {/* Twitter/X Searches */}
        <div className="mb-3">
          <span className="text-[10px] font-bold mb-2 block" style={{ color: '#1DA1F2' }}>𝕏 / TWITTER</span>
          <div className="flex flex-wrap gap-1.5">
            {RECURRING_SEARCHES.twitter.slice(0, 5).map(search => (
              <a
                key={search.handle}
                href={getTwitterSearchUrl(search.handle)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all hover:scale-105"
                style={{
                  background: 'rgba(29,161,242,0.1)',
                  color: '#1DA1F2',
                  border: '1px solid rgba(29,161,242,0.2)',
                }}
              >
                <span>{search.icon}</span>
                {search.label}
                <ExternalLink className="w-3 h-3 opacity-50" />
              </a>
            ))}
          </div>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {RECURRING_SEARCHES.twitter.slice(5).map(search => (
              <a
                key={search.handle}
                href={getTwitterSearchUrl(search.handle)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium transition-all hover:bg-white/10"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  color: '#808090',
                }}
              >
                <Hash className="w-3 h-3" />
                {search.label}
              </a>
            ))}
          </div>
        </div>

        {/* Reddit Searches */}
        <div>
          <span className="text-[10px] font-bold mb-2 block" style={{ color: '#FF4500' }}>REDDIT</span>
          <div className="flex flex-wrap gap-1.5">
            {RECURRING_SEARCHES.reddit.map(search => (
              <a
                key={search.subreddit}
                href={getRedditSearchUrl('sus OR rigged OR fixed OR ref', search.subreddit)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all hover:scale-105"
                style={{
                  background: 'rgba(255,69,0,0.1)',
                  color: '#FF4500',
                  border: '1px solid rgba(255,69,0,0.2)',
                }}
              >
                <span>{search.icon}</span>
                {search.label}
                <ExternalLink className="w-3 h-3 opacity-50" />
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold" style={{ color: '#606070' }}>
            {results.length} RESULTS
          </span>
          <button
            onClick={performSearch}
            className="flex items-center gap-1.5 text-xs font-semibold transition-all hover:text-white"
            style={{ color: '#808090' }}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSearching ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Results List */}
        <div className="space-y-3">
          {results.map(result => (
            <a
              key={result.id}
              href={result.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block p-3 rounded-xl transition-all hover:scale-[1.01]"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: `1px solid ${result.qualityScore >= 70 ? 'rgba(0,255,136,0.3)' : 'rgba(255,255,255,0.06)'}`,
              }}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {result.platform === 'twitter' ? (
                    <span className="text-sm" style={{ color: '#1DA1F2' }}>𝕏</span>
                  ) : (
                    <span className="text-sm" style={{ color: '#FF4500' }}>🔴</span>
                  )}
                  <span className="font-bold text-sm" style={{ color: '#FFF' }}>{result.author}</span>
                  {result.authorHandle && (
                    <span className="text-xs" style={{ color: '#606070' }}>{result.authorHandle}</span>
                  )}
                  {result.accountCredibility && result.accountCredibility >= 80 && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold" style={{ background: 'rgba(0,200,100,0.2)', color: '#00C864' }}>
                      ✓ VERIFIED
                    </span>
                  )}
                  {result.sport && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold" style={{ background: 'rgba(255,107,0,0.2)', color: '#FF6B00' }}>
                      {result.sport}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {result.hasVideo && (
                    <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold" style={{ background: 'rgba(138,43,226,0.2)', color: '#8A2BE2' }}>
                      🎥 VIDEO
                    </span>
                  )}
                  <span className="flex items-center gap-1 text-xs" style={{ color: '#606070' }}>
                    <Clock className="w-3 h-3" />
                    {formatTime(result.timestamp)}
                  </span>
                </div>
              </div>

              {/* Content */}
              <p className="text-sm mb-3 leading-relaxed" style={{ color: '#A0A0B0' }}>
                {result.content}
              </p>

              {/* Footer */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-xs" style={{ color: '#606070' }}>
                  <span>❤️ {result.engagement.likes.toLocaleString()}</span>
                  {result.engagement.retweets && (
                    <span>🔄 {result.engagement.retweets.toLocaleString()}</span>
                  )}
                  <span>💬 {result.engagement.comments.toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-2">
                  {/* Quality Score */}
                  <span 
                    className="flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold"
                    style={{
                      background: result.qualityScore >= 70 ? 'rgba(0,255,136,0.2)' : 'rgba(255,255,255,0.1)',
                      color: result.qualityScore >= 70 ? '#00FF88' : '#A0A0B0',
                    }}
                  >
                    ⭐ {result.qualityScore}
                  </span>
                  {/* Sus Score */}
                  <span 
                    className="flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold"
                    style={{
                      background: result.susScore >= 85 ? 'rgba(255,68,85,0.2)' : result.susScore >= 70 ? 'rgba(255,215,0,0.2)' : 'rgba(255,255,255,0.1)',
                      color: result.susScore >= 85 ? '#FF4455' : result.susScore >= 70 ? '#FFD700' : '#A0A0B0',
                    }}
                  >
                    <AlertTriangle className="w-3 h-3" />
                    {result.susScore}% Sus
                  </span>
                </div>
              </div>

              {/* Tags */}
              {result.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {result.tags.map(tag => (
                    <span
                      key={tag}
                      className="px-1.5 py-0.5 rounded text-[10px] font-medium"
                      style={{ background: 'rgba(255,255,255,0.05)', color: '#606070' }}
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </a>
          ))}
        </div>

        {/* Load More */}
        {results.length > 0 && (
          <button
            className="w-full mt-4 py-3 rounded-xl text-sm font-semibold transition-all hover:bg-white/10"
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#808090',
            }}
          >
            Load More Results
          </button>
        )}
      </div>
    </div>
  )
}

/**
 * Compact version for sidebar
 */
export function SusSearchCompact() {
  return (
    <div className="rounded-xl p-4" style={{ background: '#0c0c14', border: '1px solid rgba(255,255,255,0.06)' }}>
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle className="w-4 h-4" style={{ color: '#FF4455' }} />
        <h4 className="font-bold text-sm" style={{ color: '#FFF' }}>Quick Sus Search</h4>
      </div>
      
      <div className="space-y-2">
        {RECURRING_SEARCHES.twitter.slice(0, 4).map(search => (
          <a
            key={search.handle}
            href={`https://twitter.com/search?q=${encodeURIComponent(search.handle)}&src=typed_query&f=live`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-all hover:bg-white/10"
            style={{
              background: 'rgba(255,255,255,0.03)',
              color: '#A0A0B0',
            }}
          >
            <div className="flex items-center gap-2">
              <span>{search.icon}</span>
              {search.label}
            </div>
            <ExternalLink className="w-3 h-3" style={{ color: '#606070' }} />
          </a>
        ))}
      </div>
      
      <a
        href="/sus"
        className="flex items-center justify-center gap-2 mt-3 py-2 rounded-lg text-xs font-semibold transition-all hover:bg-white/10"
        style={{
          background: 'rgba(255,68,85,0.1)',
          color: '#FF4455',
          border: '1px solid rgba(255,68,85,0.2)',
        }}
      >
        View All Sus Plays
        <TrendingUp className="w-3 h-3" />
      </a>
    </div>
  )
}
