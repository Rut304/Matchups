'use client'

import { useState, useEffect } from 'react'
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
  Zap
} from 'lucide-react'

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

// Mock data - In production this would come from Twitter/X API scraping
const mockSusPlays: SusPlay[] = [
  {
    id: '0',
    sport: 'nfl',
    playerName: 'Unknown',
    team: 'N/A',
    opponent: 'N/A',
    gameDate: '2025-06-06',
    description: 'Team didn\'t take the field goal when they been kicking all year long. The fix is on.',
    susType: 'spread',
    relatedBet: 'Spread/Total Impact',
    videoUrl: '#',
    twitterUrl: 'https://x.com/dyce4pf/status/2007623922582466723',
    views: 115,
    susScore: 88,
    votes: { sus: 94, legit: 12 },
    comments: 47,
    trending: true,
    verified: false,
    postedAt: 'Recently',
    source: '@dyce4pf'
  },
  {
    id: '1',
    sport: 'nba',
    playerName: 'Player A',
    team: 'LAL',
    opponent: 'BOS',
    gameDate: '2026-01-03',
    description: 'Passes up wide-open layup with 10 seconds left, team down by 2. His under 24.5 points hits by exactly 0.5 points.',
    susType: 'prop',
    relatedBet: 'Under 24.5 Points',
    videoUrl: '#',
    twitterUrl: '#',
    views: 2400000,
    susScore: 89,
    votes: { sus: 8420, legit: 1203 },
    comments: 1847,
    trending: true,
    verified: true,
    postedAt: '2 hours ago',
    source: '@SportsCenter'
  },
  {
    id: '2',
    sport: 'nfl',
    playerName: 'Player B',
    team: 'DAL',
    opponent: 'PHI',
    gameDate: '2026-01-02',
    description: 'Takes intentional safety instead of punting with team +6.5. Final score: team loses by 7 exactly.',
    susType: 'spread',
    relatedBet: 'PHI -6.5',
    videoUrl: '#',
    twitterUrl: '#',
    views: 1800000,
    susScore: 94,
    votes: { sus: 12340, legit: 890 },
    comments: 2341,
    trending: true,
    verified: true,
    postedAt: '8 hours ago',
    source: '@BleacherReport'
  },
  {
    id: '3',
    sport: 'nba',
    playerName: 'Player C',
    team: 'MIA',
    opponent: 'NYK',
    gameDate: '2026-01-03',
    description: 'Turns ball over twice in final minute, completely unforced. Game total was 218, final score 219.',
    susType: 'total',
    relatedBet: 'Over 218.5',
    videoUrl: '#',
    twitterUrl: '#',
    views: 890000,
    susScore: 72,
    votes: { sus: 4520, legit: 2103 },
    comments: 892,
    trending: true,
    verified: false,
    postedAt: '4 hours ago',
    source: '@BarstoolSports'
  },
  {
    id: '4',
    sport: 'nhl',
    playerName: 'Player D',
    team: 'TOR',
    opponent: 'MTL',
    gameDate: '2026-01-02',
    description: 'Goalie lets in soft goal with 30 seconds left after standing on his head all game. His saves over hits by 1.',
    susType: 'prop',
    relatedBet: 'Over 28.5 Saves',
    videoUrl: '#',
    twitterUrl: '#',
    views: 450000,
    susScore: 65,
    votes: { sus: 2100, legit: 1850 },
    comments: 423,
    trending: false,
    verified: false,
    postedAt: '12 hours ago',
    source: '@NHLNetwork'
  },
  {
    id: '5',
    sport: 'mlb',
    playerName: 'Player E',
    team: 'NYY',
    opponent: 'BOS',
    gameDate: '2026-01-01',
    description: 'Strike 3 looking on a pitch 6 inches outside. His strikeout over hits by exactly 1.',
    susType: 'prop',
    relatedBet: 'Over 1.5 Strikeouts',
    videoUrl: '#',
    twitterUrl: '#',
    views: 320000,
    susScore: 45,
    votes: { sus: 1200, legit: 2400 },
    comments: 234,
    trending: false,
    verified: false,
    postedAt: '1 day ago',
    source: '@MLBNetwork'
  },
  {
    id: '6',
    sport: 'ncaab',
    playerName: 'Player F',
    team: 'DUKE',
    opponent: 'UNC',
    gameDate: '2026-01-02',
    description: 'Star player picks up 2 quick fouls in first 3 minutes, sits most of first half. Duke -8 loses by 9.',
    susType: 'spread',
    relatedBet: 'UNC +8',
    videoUrl: '#',
    twitterUrl: '#',
    views: 670000,
    susScore: 58,
    votes: { sus: 3100, legit: 2900 },
    comments: 567,
    trending: true,
    verified: false,
    postedAt: '18 hours ago',
    source: '@CBSSports'
  }
]

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

  // Filter plays
  const filteredPlays = mockSusPlays.filter(play => {
    if (sport !== 'all' && play.sport !== sport) return false
    if (susType !== 'all' && play.susType !== susType) return false
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
      case 'recent': return 0 // Would sort by date in production
      default: return 0
    }
  })

  return (
    <div className="min-h-screen" style={{ background: '#0A0A0F' }}>
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-xl" style={{ background: 'linear-gradient(135deg, #FF3366, #FF6B00)' }}>
              <AlertTriangle className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-black text-white">Suspect Plays</h1>
              <p style={{ color: '#808090' }} className="text-sm">Who&apos;s his Mizuhara? 🤔</p>
            </div>
          </div>
          
          {/* Warning Banner */}
          <div className="mt-4 p-4 rounded-xl border" style={{ background: 'rgba(255,51,102,0.1)', borderColor: 'rgba(255,51,102,0.3)' }}>
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#FF3366' }} />
              <div>
                <p className="text-sm font-semibold" style={{ color: '#FF3366' }}>For Entertainment &amp; Discussion Only</p>
                <p className="text-xs" style={{ color: '#A0A0B0' }}>
                  When a play lands exactly on a number that benefits a specific bet, we archive it here. We track the player, the line, 
                  and the outcome. <strong style={{ color: '#FFF' }}>Does someone close to them have action?</strong> Let the internet decide. 
                  We&apos;re not accusing anyone — just asking questions and keeping receipts. 🧾
                </p>
              </div>
            </div>
          </div>

          {/* How It Works */}
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-3 rounded-xl" style={{ background: 'rgba(0,168,255,0.1)', border: '1px solid rgba(0,168,255,0.2)' }}>
              <div className="text-lg mb-1">📹</div>
              <p className="text-xs font-semibold text-white">Video Evidence</p>
              <p className="text-[10px]" style={{ color: '#808090' }}>Clips embedded from Twitter/X for instant playback</p>
            </div>
            <div className="p-3 rounded-xl" style={{ background: 'rgba(255,215,0,0.1)', border: '1px solid rgba(255,215,0,0.2)' }}>
              <div className="text-lg mb-1">📊</div>
              <p className="text-xs font-semibold text-white">Line Tracking</p>
              <p className="text-[10px]" style={{ color: '#808090' }}>We show the exact bet that hit and by how much</p>
            </div>
            <div className="p-3 rounded-xl" style={{ background: 'rgba(255,51,102,0.1)', border: '1px solid rgba(255,51,102,0.2)' }}>
              <div className="text-lg mb-1">🗳️</div>
              <p className="text-xs font-semibold text-white">Community Voting</p>
              <p className="text-[10px]" style={{ color: '#808090' }}>Vote SUS or LEGIT and see consensus</p>
            </div>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Plays Tracked', value: '1,247', icon: Video, color: '#00A8FF' },
            { label: 'Total Views', value: '42.3M', icon: Eye, color: '#FF6B00' },
            { label: 'Verified Sus', value: '89', icon: AlertTriangle, color: '#FF3366' },
            { label: 'Trending Now', value: '12', icon: Flame, color: '#FFD700' },
          ].map((stat) => (
            <div key={stat.label} className="p-4 rounded-xl" style={{ background: '#12121A' }}>
              <div className="flex items-center gap-2 mb-1">
                <stat.icon className="w-4 h-4" style={{ color: stat.color }} />
                <span className="text-xs" style={{ color: '#808090' }}>{stat.label}</span>
              </div>
              <div className="text-2xl font-bold text-white">{stat.value}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          {/* Sport Filter */}
          <div className="flex gap-1 p-1 rounded-xl" style={{ background: '#12121A' }}>
            {(['all', 'nfl', 'nba', 'nhl', 'mlb'] as Sport[]).map((s) => (
              <button
                key={s}
                onClick={() => setSport(s)}
                className="px-3 py-1.5 rounded-lg text-sm font-semibold transition-all"
                style={{
                  background: sport === s ? 'linear-gradient(135deg, #FF6B00, #FF3366)' : 'transparent',
                  color: sport === s ? '#FFF' : '#808090'
                }}
              >
                {s === 'all' ? 'All' : s.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Type Filter */}
          <div className="flex gap-1 p-1 rounded-xl" style={{ background: '#12121A' }}>
            {(['all', 'prop', 'spread', 'total'] as SusType[]).map((t) => (
              <button
                key={t}
                onClick={() => setSusType(t)}
                className="px-3 py-1.5 rounded-lg text-sm font-semibold transition-all capitalize"
                style={{
                  background: susType === t ? '#00A8FF' : 'transparent',
                  color: susType === t ? '#FFF' : '#808090'
                }}
              >
                {t === 'all' ? 'All Types' : t}
              </button>
            ))}
          </div>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="px-3 py-2 rounded-xl text-sm font-semibold cursor-pointer"
            style={{ background: '#12121A', color: '#FFF', border: 'none' }}
          >
            <option value="trending">🔥 Trending</option>
            <option value="susScore">⚠️ Most Sus</option>
            <option value="views">👁️ Most Views</option>
            <option value="recent">🕐 Recent</option>
          </select>

          {/* Search */}
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#808090' }} />
              <input
                type="text"
                placeholder="Search players, teams..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl text-sm"
                style={{ background: '#12121A', color: '#FFF', border: 'none' }}
              />
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Plays List */}
          <div className="lg:col-span-2 space-y-4">
            {filteredPlays.map((play) => (
              <div 
                key={play.id} 
                className="rounded-2xl overflow-hidden transition-all hover:scale-[1.01]"
                style={{ background: '#12121A', border: play.trending ? '2px solid #FF6B00' : '1px solid rgba(255,255,255,0.06)' }}
              >
                {/* Video Thumbnail / Twitter Embed */}
                <div className="relative aspect-video bg-black/50 flex items-center justify-center group">
                  {play.twitterUrl && play.twitterUrl !== '#' ? (
                    <TwitterEmbed tweetUrl={play.twitterUrl} />
                  ) : (
                    <>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                      <Play className="w-16 h-16 text-white/80 group-hover:text-white group-hover:scale-110 transition-all cursor-pointer" />
                    </>
                  )}
                  
                  {/* Trending Badge */}
                  {play.trending && (
                    <div className="absolute top-3 left-3 flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold z-10"
                         style={{ background: '#FF6B00', color: '#000' }}>
                      <Flame className="w-3 h-3" />
                      TRENDING
                    </div>
                  )}

                  {/* Sus Score Badge */}
                  <div className="absolute top-3 right-3 px-2 py-1 rounded-full text-xs font-bold z-10"
                       style={{ background: getSusColor(play.susScore), color: '#000' }}>
                    {play.susScore}% SUS
                  </div>

                  {/* Views */}
                  <div className="absolute bottom-3 right-3 flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold z-10"
                       style={{ background: 'rgba(0,0,0,0.7)', color: '#FFF' }}>
                    <Eye className="w-3 h-3" />
                    {formatViews(play.views)}
                  </div>

                  {/* Sport Badge */}
                  <div className="absolute bottom-3 left-3 flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold z-10"
                       style={{ background: 'rgba(0,0,0,0.7)', color: '#FFF' }}>
                    {getSportEmoji(play.sport)} {play.sport.toUpperCase()}
                  </div>
                </div>

                {/* Content */}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <h3 className="text-lg font-bold text-white">
                        {play.playerName} ({play.team} vs {play.opponent})
                      </h3>
                      <p className="text-xs" style={{ color: '#808090' }}>{play.gameDate} • {play.postedAt}</p>
                    </div>
                    {play.verified && (
                      <div className="px-2 py-1 rounded text-xs font-bold" style={{ background: '#00FF88', color: '#000' }}>
                        VERIFIED
                      </div>
                    )}
                  </div>

                  <p className="text-sm mb-3" style={{ color: '#C0C0C8' }}>
                    {play.description}
                  </p>

                  {/* Related Bet */}
                  {play.relatedBet && (
                    <div className="flex items-center gap-2 mb-4">
                      <DollarSign className="w-4 h-4" style={{ color: '#FFD700' }} />
                      <span className="text-sm font-semibold" style={{ color: '#FFD700' }}>
                        Related Bet: {play.relatedBet}
                      </span>
                    </div>
                  )}

                  {/* Voting */}
                  <div className="flex items-center gap-4 mb-4">
                    <button className="flex items-center gap-2 px-4 py-2 rounded-xl transition-all hover:bg-white/10"
                            style={{ background: 'rgba(255,51,102,0.2)' }}>
                      <ThumbsDown className="w-4 h-4" style={{ color: '#FF3366' }} />
                      <span className="text-sm font-bold" style={{ color: '#FF3366' }}>{play.votes.sus.toLocaleString()} Sus</span>
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 rounded-xl transition-all hover:bg-white/10"
                            style={{ background: 'rgba(0,255,136,0.2)' }}>
                      <ThumbsUp className="w-4 h-4" style={{ color: '#00FF88' }} />
                      <span className="text-sm font-bold" style={{ color: '#00FF88' }}>{play.votes.legit.toLocaleString()} Legit</span>
                    </button>
                    <div className="flex-1" />
                    <button className="flex items-center gap-1 text-xs" style={{ color: '#808090' }}>
                      <MessageCircle className="w-4 h-4" />
                      {play.comments}
                    </button>
                    <button className="flex items-center gap-1 text-xs" style={{ color: '#808090' }}>
                      <Share2 className="w-4 h-4" />
                      Share
                    </button>
                  </div>

                  {/* Source */}
                  <div className="flex items-center justify-between pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    <a href={play.twitterUrl} target="_blank" rel="noopener noreferrer"
                       className="flex items-center gap-2 text-xs hover:underline" style={{ color: '#00A8FF' }}>
                      <Twitter className="w-4 h-4" />
                      Source: {play.source}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </div>
            ))}

            {filteredPlays.length === 0 && (
              <div className="text-center py-12 rounded-2xl" style={{ background: '#12121A' }}>
                <AlertTriangle className="w-12 h-12 mx-auto mb-4" style={{ color: '#808090' }} />
                <p className="text-lg font-semibold text-white mb-2">No Sus Plays Found</p>
                <p style={{ color: '#808090' }}>Try adjusting your filters</p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Submit a Sus Play */}
            <div className="p-4 rounded-2xl" style={{ background: 'linear-gradient(135deg, rgba(255,107,0,0.2), rgba(255,51,102,0.2))', border: '1px solid rgba(255,107,0,0.3)' }}>
              <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                <Zap className="w-5 h-5" style={{ color: '#FF6B00' }} />
                Spot Something Sus?
              </h3>
              <p className="text-sm mb-4" style={{ color: '#808090' }}>
                Found a questionable play? Submit it for community review.
              </p>
              <button className="w-full py-2 rounded-xl font-bold transition-all hover:scale-105"
                      style={{ background: 'linear-gradient(135deg, #FF6B00, #FF3366)', color: '#FFF' }}>
                Submit a Play
              </button>
            </div>

            {/* Top Voted This Week */}
            <div className="p-4 rounded-2xl" style={{ background: '#12121A' }}>
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Target className="w-5 h-5" style={{ color: '#FF3366' }} />
                Most Sus This Week
              </h3>
              <div className="space-y-3">
                {mockSusPlays.sort((a, b) => b.susScore - a.susScore).slice(0, 5).map((play, i) => (
                  <div key={play.id} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                         style={{ background: getSusColor(play.susScore), color: '#000' }}>
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{play.playerName}</p>
                      <p className="text-xs" style={{ color: '#808090' }}>{play.susScore}% sus • {formatViews(play.views)} views</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* How It Works */}
            <div className="p-4 rounded-2xl" style={{ background: '#12121A' }}>
              <h3 className="text-lg font-bold text-white mb-4">How It Works</h3>
              <div className="space-y-3">
                {[
                  { icon: Video, text: 'We monitor X/Twitter for viral sports clips' },
                  { icon: Target, text: 'AI flags plays that coincide with betting lines' },
                  { icon: Eye, text: 'Community votes on how sus each play is' },
                  { icon: AlertTriangle, text: 'High-voted plays get verified' },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="p-1.5 rounded-lg" style={{ background: 'rgba(255,107,0,0.2)' }}>
                      <item.icon className="w-4 h-4" style={{ color: '#FF6B00' }} />
                    </div>
                    <p className="text-sm" style={{ color: '#C0C0C8' }}>{item.text}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Disclaimer */}
            <div className="p-4 rounded-2xl text-center" style={{ background: 'rgba(128,128,144,0.1)' }}>
              <p className="text-xs" style={{ color: '#808090' }}>
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
