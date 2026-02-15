'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { 
  AlertTriangle,
  Eye,
  TrendingUp,
  MessageCircle,
  Share2,
  ThumbsUp,
  ThumbsDown,
  Play,
  Filter,
  Clock,
  Flame,
  Search,
  ExternalLink,
  Twitter,
  Video,
  DollarSign,
  Target,
  Zap,
  X,
  Upload,
  Link2,
  CheckCircle,
  ArrowRight,
  ChevronUp
} from 'lucide-react'
import { SusSearchCompact } from '@/components/sus/SusSearchAggregator'

// Load Twitter widgets script
declare global {
  interface Window {
    twttr?: {
      widgets: {
        load: (element?: HTMLElement) => void
      }
    }
  }
}

type Sport = 'all' | 'nfl' | 'nba' | 'nhl' | 'mlb' | 'ncaaf' | 'ncaab'
type SusType = 'all' | 'prop' | 'spread' | 'moneyline' | 'total'
type TimeFrame = 'today' | 'week' | 'month' | 'all'

interface SusPlay {
  id: string
  sport: Sport
  playerName: string
  team: string
  title?: string // Title for display when playerName is Unknown
  opponent: string
  gameDate: string
  description: string
  susType: SusType
  relatedBet?: string
  videoUrl?: string
  twitterUrl?: string
  thumbnailUrl?: string
  views: number
  susScore: number // 1-100 how suspicious
  votes: { sus: number; legit: number }
  comments: number
  trending: boolean
  verified: boolean
  postedAt: string
  source: string
}


const formatViews = (views: number): string => {
  if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`
  if (views >= 1000) return `${(views / 1000).toFixed(0)}K`
  return views.toString()
}

const getSusColor = (score: number): string => {
  if (score >= 80) return '#FF3366' // High sus
  if (score >= 60) return '#FF6B00' // Medium-high
  if (score >= 40) return '#FFD700' // Medium
  return '#00FF88' // Low
}

const getSusColorClass = (score: number): string => {
  if (score >= 80) return 'badge-sus-high' // High sus
  if (score >= 60) return 'badge-sus-medium' // Medium-high
  if (score >= 40) return 'badge-sus-low' // Medium
  return 'badge-verified' // Low
}

const getSportEmoji = (sport: Sport): string => {
  const emojis: Record<Sport, string> = {
    all: '🎯',
    nfl: '🏈',
    nba: '🏀',
    nhl: '🏒',
    mlb: '⚾',
    ncaaf: '🏈',
    ncaab: '🏀'
  }
  return emojis[sport]
}

// Share to X/Twitter
const shareToTwitter = (play: SusPlay) => {
  const text = `🚨 SUS ALERT: ${play.playerName} (${play.team}) - ${play.susScore}% suspicious\n\n${play.description.slice(0, 100)}...\n\n👀 See the video & vote\n\nvia @MatchupsApp`
  const url = `https://matchups-eta.vercel.app/sus#${play.id}`
  window.open(
    `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
    '_blank'
  )
}

// Copy share link
const copyShareLink = async (play: SusPlay) => {
  const url = `https://matchups-eta.vercel.app/sus#${play.id}`
  await navigator.clipboard.writeText(url)
  return true
}

// Submit Modal Component
interface SubmitModalProps {
  isOpen: boolean
  onClose: () => void
}

function SubmitSusPlayModal({ isOpen, onClose }: SubmitModalProps) {
  const [twitterUrl, setTwitterUrl] = useState('')
  const [description, setDescription] = useState('')
  const [relatedBet, setRelatedBet] = useState('')
  const [sport, setSport] = useState<Sport>('nfl')
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  
  const handleSubmit = async () => {
    if (!twitterUrl || !description) return
    
    setSubmitting(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500))
    setSubmitting(false)
    setSuccess(true)
    
    setTimeout(() => {
      setSuccess(false)
      onClose()
      setTwitterUrl('')
      setDescription('')
      setRelatedBet('')
    }, 2000)
  }
  
  if (!isOpen) return null
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl overflow-hidden modal-sus">
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between modal-header-sus">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-orange-500/20">
              <Upload className="w-5 h-5 text-orange-500" />
            </div>
            <div>
              <h3 className="font-bold text-white">Submit a Sus Play</h3>
              <p className="text-xs text-gray-400">Share questionable plays with the community</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {success ? (
          <div className="p-8 text-center">
            <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-500" />
            <h3 className="text-xl font-bold text-white mb-2">Submitted!</h3>
            <p className="text-gray-400">Your sus play is under review and will appear soon.</p>
          </div>
        ) : (
          <div className="p-4 space-y-4">
            {/* Twitter/X URL */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <Twitter className="w-4 h-4 inline mr-2" />
                X/Twitter Post URL *
              </label>
              <input
                type="url"
                placeholder="https://x.com/user/status/..."
                value={twitterUrl}
                onChange={(e) => setTwitterUrl(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500/50"
              />
              <p className="text-xs text-gray-500 mt-1">Paste a link to the X post with video evidence</p>
            </div>
            
            {/* Sport */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Sport</label>
              <div className="flex gap-2 flex-wrap">
                {(['nfl', 'nba', 'nhl', 'mlb', 'ncaaf', 'ncaab'] as Sport[]).map((s) => (
                  <button
                    key={s}
                    onClick={() => setSport(s)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      sport === s 
                        ? 'bg-orange-500 text-white' 
                        : 'bg-white/5 text-gray-400 hover:bg-white/10'
                    }`}
                  >
                    {getSportEmoji(s)} {s.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">What happened? *</label>
              <textarea
                placeholder="Describe the questionable play and why it looks suspicious..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500/50 resize-none"
              />
            </div>
            
            {/* Related Bet */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <DollarSign className="w-4 h-4 inline mr-2" />
                Related Bet (optional)
              </label>
              <input
                type="text"
                placeholder="e.g., Under 24.5 Points, Team -6.5"
                value={relatedBet}
                onChange={(e) => setRelatedBet(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500/50"
              />
            </div>
            
            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={!twitterUrl || !description || submitting}
              className={`w-full py-3 rounded-xl font-bold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed ${submitting ? 'bg-slate-600' : 'btn-gradient-orange'}`}
            >
              {submitting ? 'Submitting...' : 'Submit for Review'}
            </button>
            
            <p className="text-xs text-center text-gray-500">
              Submissions are reviewed before appearing. False reports may result in account restrictions.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

// Twitter/X Embed Component
function TwitterEmbed({ tweetUrl }: { tweetUrl: string }) {
  const [loaded, setLoaded] = useState(false)
  
  useEffect(() => {
    // Load Twitter widgets script
    const script = document.createElement('script')
    script.src = 'https://platform.twitter.com/widgets.js'
    script.async = true
    script.onload = () => {
      if (window.twttr) {
        window.twttr.widgets.load()
        setLoaded(true)
      }
    }
    document.body.appendChild(script)
    
    return () => {
      // Cleanup if needed
    }
  }, [])
  
  // Extract tweet ID from URL
  const getTweetId = (url: string): string | null => {
    const match = url.match(/status\/(\d+)/)
    return match ? match[1] : null
  }
  
  const tweetId = getTweetId(tweetUrl)
  
  if (!tweetId) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <a href={tweetUrl} target="_blank" rel="noopener noreferrer" 
           className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-all">
          <Twitter className="w-5 h-5" />
          View on X
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>
    )
  }
  
  return (
    <div className="w-full h-full flex items-center justify-center overflow-hidden">
      <blockquote 
        className="twitter-tweet" 
        data-theme="dark"
        data-conversation="none"
      >
        <a href={tweetUrl}>Loading tweet...</a>
      </blockquote>
    </div>
  )
}

export default function SusPlaysPage() {
  const [sport, setSport] = useState<Sport>('all')
  const [susType, setSusType] = useState<SusType>('all')
  const [timeframe, setTimeframe] = useState<TimeFrame>('week')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'trending' | 'susScore' | 'views' | 'recent'>('trending')
  const [showSubmitModal, setShowSubmitModal] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [susPlays, setSusPlays] = useState<SusPlay[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ total: 0, totalViews: 0, verified: 0, trending: 0 })

  // Fetch sus plays from API
  useEffect(() => {
    async function fetchSusPlays() {
      setLoading(true)
      try {
        const params = new URLSearchParams({
          sport,
          susType,
          timeFrame: timeframe,
          trending: sortBy === 'trending' ? 'true' : 'false',
        })
        const res = await fetch(`/api/sus?${params}`)
        if (res.ok) {
          const data = await res.json()
          // Map API response to SusPlay interface
          const plays: SusPlay[] = data.susPlays.map((p: Record<string, unknown>) => ({
            id: p.id as string,
            sport: (p.sport as string || 'nfl') as Sport,
            playerName: p.playerName as string || 'Unknown',
            team: p.team as string || '',
            title: p.title as string || undefined, // Include title for Unknown players
            opponent: '',
            gameDate: new Date().toISOString(),
            description: p.description as string || p.title as string || '',
            susType: (p.susType as string || 'other') as SusType,
            relatedBet: p.relatedBet as string,
            videoUrl: p.videoUrl as string || p.twitterUrl as string, // Use either video or twitter URL
            twitterUrl: p.twitterUrl as string || (p.videoUrl as string && (p.videoUrl as string).includes('twitter.com') ? p.videoUrl as string : undefined), // Use videoUrl if it's a Twitter/X link
            thumbnailUrl: p.thumbnailUrl as string,
            views: p.views as number || 0,
            susScore: p.susScore as number || 50,
            votes: p.votes as { sus: number; legit: number } || { sus: 0, legit: 0 },
            comments: 0,
            trending: p.trending as boolean || false,
            verified: p.verified as boolean || false,
            postedAt: p.postedAt as string || 'Recently',
            source: p.tweetAuthor as string || '@SusPlays',
          }))
          setSusPlays(plays)
          // Calculate real stats
          setStats({
            total: plays.length,
            totalViews: plays.reduce((sum: number, p: SusPlay) => sum + (p.views || 0), 0),
            verified: plays.filter((p: SusPlay) => p.verified).length,
            trending: plays.filter((p: SusPlay) => p.trending).length
          })
        }
      } catch (error) {
        console.error('Failed to fetch sus plays:', error)
      }
      setLoading(false)
    }
    fetchSusPlays()
  }, [sport, susType, timeframe, sortBy])

  // Handle copy share link
  const handleCopyLink = useCallback(async (play: SusPlay) => {
    const success = await copyShareLink(play)
    if (success) {
      setCopiedId(play.id)
      setTimeout(() => setCopiedId(null), 2000)
    }
  }, [])

  // Filter plays locally for search
  const filteredPlays = susPlays.filter(play => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      return play.playerName.toLowerCase().includes(q) || 
             play.team.toLowerCase().includes(q) ||
             play.description.toLowerCase().includes(q)
    }
    return true
  }).sort((a, b) => {
    switch (sortBy) {
      case 'trending': return (b.trending ? 1 : 0) - (a.trending ? 1 : 0) || b.views - a.views
      case 'susScore': return b.susScore - a.susScore
      case 'views': return b.views - a.views
      case 'recent': return 0
      default: return 0
    }
  })

  return (
    <div className="min-h-screen bg-page-sus">
      {/* Submit Modal */}
      <SubmitSusPlayModal isOpen={showSubmitModal} onClose={() => setShowSubmitModal(false)} />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl btn-gradient-orange">
                <AlertTriangle className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-black text-white">Suspect Plays</h1>
                <p className="text-sm text-muted">Who&apos;s his Mizuhara? 🤔</p>
              </div>
            </div>
            
            {/* Submit Button */}
            <button
              onClick={() => setShowSubmitModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-white transition-all hover:scale-105 btn-gradient-orange"
            >
              <Upload className="w-5 h-5" />
              <span className="hidden sm:inline">Submit Play</span>
            </button>
          </div>
          
          {/* Warning Banner */}
          <div className="mt-4 p-4 rounded-xl bg-hot-soft">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5 text-hot" />
              <div>
                <p className="text-sm font-semibold text-hot">For Entertainment &amp; Discussion Only</p>
                <p className="text-xs text-secondary">
                  When a play lands exactly on a number that benefits a specific bet, we archive it here. We track the player, the line, 
                  and the outcome. <strong className="text-white">Does someone close to them have action?</strong> Let the internet decide. 
                  We&apos;re not accusing anyone — just asking questions and keeping receipts. 🧾
                </p>
              </div>
            </div>
          </div>

          {/* How It Works */}
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-cyan-soft">
              <div className="text-lg mb-1">📹</div>
              <p className="text-xs font-semibold text-white">Video Evidence</p>
              <p className="text-[10px] text-muted">Clips embedded from Twitter/X for instant playback</p>
            </div>
            <div className="p-3 rounded-xl bg-gold-soft">
              <div className="text-lg mb-1">📊</div>
              <p className="text-xs font-semibold text-white">Line Tracking</p>
              <p className="text-[10px] text-muted">We show the exact bet that hit and by how much</p>
            </div>
            <div className="p-3 rounded-xl bg-hot-soft">
              <div className="text-lg mb-1">🗳️</div>
              <p className="text-xs font-semibold text-white">Community Voting</p>
              <p className="text-[10px] text-muted">Vote SUS or LEGIT and see consensus</p>
            </div>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Plays Tracked', value: stats.total.toLocaleString(), icon: Video, colorClass: 'text-cyan' },
            { label: 'Total Views', value: formatViews(stats.totalViews), icon: Eye, colorClass: 'text-orange' },
            { label: 'Verified Sus', value: stats.verified.toLocaleString(), icon: AlertTriangle, colorClass: 'text-hot' },
            { label: 'Trending Now', value: stats.trending.toLocaleString(), icon: Flame, colorClass: 'text-gold' },
          ].map((stat) => (
            <div key={stat.label} className="p-4 rounded-xl stat-card-dark">
              <div className="flex items-center gap-2 mb-1">
                <stat.icon className={`w-4 h-4 ${stat.colorClass}`} />
                <span className="text-xs text-muted">{stat.label}</span>
              </div>
              <div className="text-2xl font-bold text-white">{stat.value}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          {/* Sport Filter */}
          <div className="flex gap-1 p-1 rounded-xl filter-group">
            {(['all', 'nfl', 'nba', 'nhl', 'mlb'] as Sport[]).map((s) => (
              <button
                key={s}
                onClick={() => setSport(s)}
                className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${sport === s ? 'btn-gradient-orange' : 'text-muted'}`}
              >
                {s === 'all' ? 'All' : s.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Type Filter */}
          <div className="flex gap-1 p-1 rounded-xl filter-group">
            {(['all', 'prop', 'spread', 'total'] as SusType[]).map((t) => (
              <button
                key={t}
                onClick={() => setSusType(t)}
                className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all capitalize ${susType === t ? 'bg-cyan-500 text-white' : 'text-muted'}`}
              >
                {t === 'all' ? 'All Types' : t}
              </button>
            ))}
          </div>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="px-3 py-2 rounded-xl text-sm font-semibold cursor-pointer search-input"
            aria-label="Sort sus plays by"
          >
            <option value="trending">🔥 Trending</option>
            <option value="susScore">⚠️ Most Sus</option>
            <option value="views">👁️ Most Views</option>
            <option value="recent">🕐 Recent</option>
          </select>

          {/* Search */}
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
              <input
                type="text"
                placeholder="Search players, teams..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl text-sm search-input"
              />
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Plays List */}
          <div className="lg:col-span-2 space-y-4">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full" />
              </div>
            ) : filteredPlays.length === 0 ? (
              <div className="text-center py-12">
                <AlertTriangle className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">No suspicious plays found</p>
                <p className="text-gray-500 text-sm">Try adjusting your filters</p>
              </div>
            ) : (
              filteredPlays.map((play) => (
              <div 
                key={play.id} 
                className={`rounded-2xl overflow-hidden transition-all hover:scale-[1.01] ${play.trending ? 'card-sus-trending' : 'card-sus'}`}
              >
                {/* Video Thumbnail / Twitter Embed */}
                <div className="relative aspect-video bg-black/50 flex items-center justify-center group">
                  {play.twitterUrl && play.twitterUrl !== '#' ? (
                    <TwitterEmbed tweetUrl={play.twitterUrl} />
                  ) : play.videoUrl && play.videoUrl !== '#' ? (
                    <a 
                      href={play.videoUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="absolute inset-0 flex items-center justify-center"
                    >
                      {play.thumbnailUrl ? (
                        <img 
                          src={play.thumbnailUrl} 
                          alt={`${play.playerName} sus play`}
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                      ) : null}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                      <Play className="w-16 h-16 text-white/80 group-hover:text-white group-hover:scale-110 transition-all z-10" />
                    </a>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      {play.thumbnailUrl ? (
                        <img 
                          src={play.thumbnailUrl} 
                          alt={`${play.playerName} sus play`}
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                      ) : null}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                      <div className="flex flex-col items-center gap-2 z-10">
                        <Video className="w-12 h-12 text-gray-400" />
                        <span className="text-xs text-gray-500">Video unavailable</span>
                      </div>
                    </div>
                  )}
                  
                  {/* Trending Badge */}
                  {play.trending && (
                    <div className="absolute top-3 left-3 flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold z-10 badge-trending">
                      <Flame className="w-3 h-3" />
                      TRENDING
                    </div>
                  )}

                  {/* Sus Score Badge */}
                  <div className={`absolute top-3 right-3 px-2 py-1 rounded-full text-xs font-bold z-10 ${getSusColorClass(play.susScore)}`}>
                    {play.susScore}% SUS
                  </div>

                  {/* Views */}
                  <div className="absolute bottom-3 right-3 flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold z-10 badge-dark">
                    <Eye className="w-3 h-3" />
                    {formatViews(play.views)}
                  </div>

                  {/* Sport Badge */}
                  <div className="absolute bottom-3 left-3 flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold z-10 badge-dark">
                    {getSportEmoji(play.sport)} {play.sport.toUpperCase()}
                  </div>
                </div>

                {/* Content */}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <h3 className="text-lg font-bold text-white">
                        {play.playerName === 'Unknown' 
                          ? play.title || 'Suspicious Play'
                          : `${play.playerName} (${play.team})`
                        }
                      </h3>
                      <p className="text-xs text-muted">{play.postedAt}</p>
                    </div>
                    {play.verified && (
                      <div className="px-2 py-1 rounded text-xs font-bold badge-verified">
                        VERIFIED
                      </div>
                    )}
                  </div>

                  <p className="text-sm mb-3 text-secondary">
                    {play.description}
                  </p>

                  {/* Related Bet */}
                  {play.relatedBet && (
                    <div className="flex items-center gap-2 mb-4">
                      <DollarSign className="w-4 h-4 text-gold" />
                      <span className="text-sm font-semibold text-gold">
                        Related Bet: {play.relatedBet}
                      </span>
                    </div>
                  )}

                  {/* Voting */}
                  <div className="flex items-center gap-4 mb-4">
                    <button className="flex items-center gap-2 px-4 py-2 rounded-xl transition-all hover:bg-white/10 vote-btn-sus">
                      <ThumbsDown className="w-4 h-4 text-hot" />
                      <span className="text-sm font-bold text-hot">{play.votes.sus.toLocaleString()} Sus</span>
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 rounded-xl transition-all hover:bg-white/10 vote-btn-legit">
                      <ThumbsUp className="w-4 h-4 text-green" />
                      <span className="text-sm font-bold text-green">{play.votes.legit.toLocaleString()} Legit</span>
                    </button>
                    <div className="flex-1" />
                    <button className="flex items-center gap-1 text-xs text-muted">
                      <MessageCircle className="w-4 h-4" />
                      {play.comments}
                    </button>
                    
                    {/* Share Dropdown */}
                    <div className="relative group">
                      <button className="flex items-center gap-1 text-xs hover:text-white transition-all text-muted">
                        <Share2 className="w-4 h-4" />
                        Share
                      </button>
                      <div className="absolute bottom-full right-0 mb-2 w-40 rounded-xl overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all dropdown-menu">
                        <button
                          onClick={() => shareToTwitter(play)}
                          className="w-full px-3 py-2 flex items-center gap-2 text-xs text-white hover:bg-white/10 transition-all"
                        >
                          <Twitter className="w-4 h-4 text-blue-400" />
                          Share to X
                        </button>
                        <button
                          onClick={() => handleCopyLink(play)}
                          className="w-full px-3 py-2 flex items-center gap-2 text-xs text-white hover:bg-white/10 transition-all"
                        >
                          {copiedId === play.id ? (
                            <>
                              <CheckCircle className="w-4 h-4 text-green-400" />
                              Copied!
                            </>
                          ) : (
                            <>
                              <Link2 className="w-4 h-4 text-gray-400" />
                              Copy Link
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Source */}
                  <div className="flex items-center justify-between pt-3 border-top-subtle">
                    <a href={play.twitterUrl} target="_blank" rel="noopener noreferrer"
                       className="flex items-center gap-2 text-xs hover:underline text-cyan">
                      <Twitter className="w-4 h-4" />
                      Source: {play.source}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </div>
            ))
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Sus Search - NEW */}
            <SusSearchCompact />
            
            {/* Submit a Sus Play */}
            <div className="p-4 rounded-2xl sidebar-cta">
              <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                <Zap className="w-5 h-5 text-orange" />
                Spot Something Sus?
              </h3>
              <p className="text-sm mb-4 text-muted">
                Found a questionable play? Submit it for community review.
              </p>
              <button 
                onClick={() => setShowSubmitModal(true)}
                className="w-full py-2 rounded-xl font-bold transition-all hover:scale-105 btn-gradient-orange">
                Submit a Play
              </button>
            </div>

            {/* Top Voted This Week */}
            <div className="p-4 rounded-2xl stat-card-dark">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Target className="w-5 h-5 text-hot" />
                Most Sus This Week
              </h3>
              <div className="space-y-3">
                {[...susPlays].sort((a, b) => b.susScore - a.susScore).slice(0, 5).map((play, i) => (
                  <div key={play.id} className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${getSusColorClass(play.susScore)}`}>
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{play.playerName}</p>
                      <p className="text-xs text-muted">{play.susScore}% sus • {formatViews(play.views)} views</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* How It Works */}
            <div className="p-4 rounded-2xl stat-card-dark">
              <h3 className="text-lg font-bold text-white mb-4">How It Works</h3>
              <div className="space-y-3">
                {[
                  { icon: Video, text: 'We monitor X/Twitter for viral sports clips' },
                  { icon: Target, text: 'AI flags plays that coincide with betting lines' },
                  { icon: Eye, text: 'Community votes on how sus each play is' },
                  { icon: AlertTriangle, text: 'High-voted plays get verified' },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="p-1.5 rounded-lg icon-bg-orange">
                      <item.icon className="w-4 h-4 text-orange" />
                    </div>
                    <p className="text-sm text-secondary">{item.text}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Disclaimer */}
            <div className="p-4 rounded-2xl text-center disclaimer-card">
              <p className="text-xs text-muted">
                <strong>Disclaimer:</strong> This page is for entertainment and discussion purposes only. 
                We do not make accusations of wrongdoing. All plays are user-submitted and community-moderated.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
