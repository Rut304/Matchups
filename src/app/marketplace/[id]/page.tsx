'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft, TrendingUp, Trophy, Star, Users, Copy, Heart, 
  BarChart3, Zap, Clock, Award, Check, Loader2, Target,
  ChevronRight, Share2, Bookmark, BookmarkCheck, Info,
  Calendar, DollarSign, Percent, Activity, LineChart,
  AlertCircle, CheckCircle, PieChart
} from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { STANDARD_BETTING_SYSTEMS, type StandardBettingSystem } from '@/lib/data/standard-betting-systems'

interface SystemDetail {
  id: string
  title: string
  shortDescription: string
  fullDescription: string
  sport: string
  betType: string
  criteria: string[]
  tags: string[]
  historicalRecord: {
    wins: number
    losses: number
    pushes: number
    winRate: number
    roi: number
  }
  yearsTracked: number
  sampleSize: number
  keyInsight: string
  creator: {
    id: string
    username: string
    avatar?: string
    verified: boolean
  }
  stats: {
    copies: number
    likes: number
    followers: number
    views: number
  }
  recentPicks?: {
    id: string
    date: string
    game: string
    pick: string
    result: 'win' | 'loss' | 'push' | 'pending'
    odds: number
  }[]
  monthlyPerformance?: {
    month: string
    wins: number
    losses: number
    roi: number
  }[]
}

// Convert standard system to full detail
function getSystemFromStandard(system: StandardBettingSystem): SystemDetail {
  return {
    ...system,
    creator: {
      id: 'muschnick-001',
      username: 'Muschnick',
      avatar: '/avatars/muschnick.png',
      verified: true
    },
    stats: {
      copies: Math.floor(Math.random() * 500) + 100,
      likes: Math.floor(Math.random() * 1000) + 200,
      followers: Math.floor(Math.random() * 300) + 50,
      views: Math.floor(Math.random() * 5000) + 1000
    },
    recentPicks: generateMockRecentPicks(system),
    monthlyPerformance: generateMockMonthlyPerformance()
  }
}

function generateMockRecentPicks(system: StandardBettingSystem): SystemDetail['recentPicks'] {
  const teams = system.sport === 'NFL' 
    ? ['KC', 'BUF', 'PHI', 'SF', 'DAL', 'DET', 'MIA', 'BAL']
    : system.sport === 'NBA'
    ? ['BOS', 'DEN', 'MIL', 'PHX', 'LAL', 'GSW', 'MIA', 'PHI']
    : system.sport === 'NHL'
    ? ['BOS', 'COL', 'VGK', 'CAR', 'NJD', 'TOR', 'EDM', 'DAL']
    : ['LAD', 'ATL', 'HOU', 'NYY', 'TB', 'SD', 'PHI', 'SEA']
  
  const results: ('win' | 'loss' | 'push' | 'pending')[] = ['win', 'loss', 'push', 'pending']
  
  return Array.from({ length: 10 }, (_, i) => ({
    id: `pick-${i}`,
    date: new Date(Date.now() - i * 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    game: `${teams[Math.floor(Math.random() * 4)]} @ ${teams[Math.floor(Math.random() * 4) + 4]}`,
    pick: system.betType === 'spread' 
      ? `${teams[Math.floor(Math.random() * teams.length)]} ${Math.random() > 0.5 ? '+' : '-'}${(Math.floor(Math.random() * 7) + 1)}`
      : system.betType === 'total'
      ? `${Math.random() > 0.5 ? 'Over' : 'Under'} ${Math.floor(Math.random() * 20) + 40}`
      : `${teams[Math.floor(Math.random() * teams.length)]} ML`,
    result: i < 2 ? 'pending' : results[Math.floor(Math.random() * 3)] as 'win' | 'loss' | 'push',
    odds: -110
  }))
}

function generateMockMonthlyPerformance() {
  const months = ['Sep 2025', 'Oct 2025', 'Nov 2025', 'Dec 2025', 'Jan 2026']
  return months.map(month => ({
    month,
    wins: Math.floor(Math.random() * 20) + 10,
    losses: Math.floor(Math.random() * 18) + 8,
    roi: (Math.random() * 15) - 3
  }))
}

export default function SystemDetailPage() {
  const params = useParams()
  const systemId = params.id as string
  const { user } = useAuth()
  
  const [system, setSystem] = useState<SystemDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [isFollowing, setIsFollowing] = useState(false)
  const [isLiked, setIsLiked] = useState(false)
  const [isCopied, setIsCopied] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    // Try to find system from standard systems first
    const standardSystem = STANDARD_BETTING_SYSTEMS.find(s => s.id === systemId)
    if (standardSystem) {
      setSystem(getSystemFromStandard(standardSystem))
      setLoading(false)
      return
    }
    
    // Otherwise fetch from API
    async function fetchSystem() {
      try {
        const response = await fetch(`/api/marketplace/${systemId}`)
        const data = await response.json()
        if (data.system) {
          setSystem(data.system)
        }
      } catch (error) {
        console.error('Failed to fetch system:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchSystem()
  }, [systemId])

  const handleFollow = async () => {
    if (!user) {
      window.location.href = `/auth?redirect=/marketplace/${systemId}`
      return
    }
    setActionLoading('follow')
    await new Promise(r => setTimeout(r, 500))
    setIsFollowing(!isFollowing)
    setActionLoading(null)
  }

  const handleLike = async () => {
    if (!user) {
      window.location.href = `/auth?redirect=/marketplace/${systemId}`
      return
    }
    setActionLoading('like')
    await new Promise(r => setTimeout(r, 300))
    setIsLiked(!isLiked)
    setActionLoading(null)
  }

  const handleCopy = async () => {
    if (!user) {
      window.location.href = `/auth?redirect=/marketplace/${systemId}`
      return
    }
    setActionLoading('copy')
    await new Promise(r => setTimeout(r, 800))
    setIsCopied(true)
    setActionLoading(null)
  }

  const handleShare = async () => {
    const url = `https://matchups-eta.vercel.app/marketplace/${systemId}`
    const text = `Check out this betting system: ${system?.title} - ${system?.historicalRecord.winRate}% win rate!`
    
    if (navigator.share) {
      try {
        await navigator.share({ title: system?.title, text, url })
      } catch {
        await navigator.clipboard.writeText(url)
      }
    } else {
      await navigator.clipboard.writeText(url)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050508] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
      </div>
    )
  }

  if (!system) {
    return (
      <div className="min-h-screen bg-[#050508] flex flex-col items-center justify-center">
        <AlertCircle className="w-16 h-16 text-gray-600 mb-4" />
        <h1 className="text-2xl font-bold text-white mb-2">System Not Found</h1>
        <Link href="/marketplace" className="text-purple-400 hover:underline">
          Back to Marketplace
        </Link>
      </div>
    )
  }

  const getSportColor = (sport: string) => {
    const colors: Record<string, string> = {
      NFL: '#013369', NBA: '#C8102E', NHL: '#000000', MLB: '#002D72',
      NCAAF: '#4B0082', NCAAB: '#FF6B00'
    }
    return colors[sport] || '#808080'
  }

  return (
    <div className="min-h-screen bg-[#050508]">
      {/* Header */}
      <div className="border-b border-white/5 bg-[#0a0a12]">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <Link href="/marketplace" className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-4">
            <ArrowLeft className="w-4 h-4" />
            Back to Marketplace
          </Link>

          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <div 
                  className="w-14 h-14 rounded-xl flex items-center justify-center text-white font-bold"
                  style={{ background: getSportColor(system.sport) }}
                >
                  {system.sport}
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">{system.title}</h1>
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <span>by</span>
                    <Link href={`/profile/${system.creator.username}`} className="text-purple-400 hover:underline flex items-center gap-1">
                      {system.creator.username}
                      {system.creator.verified && <CheckCircle className="w-3.5 h-3.5 text-blue-400" />}
                    </Link>
                    <span>•</span>
                    <span>{system.yearsTracked} years tracked</span>
                  </div>
                </div>
              </div>
              <p className="text-gray-400 max-w-2xl">{system.shortDescription}</p>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleLike}
                disabled={actionLoading === 'like'}
                aria-label={isLiked ? 'Unlike system' : 'Like system'}
                className={`p-3 rounded-xl transition-all ${
                  isLiked 
                    ? 'bg-pink-500/20 text-pink-400' 
                    : 'bg-white/5 text-gray-400 hover:bg-white/10'
                }`}
              >
                <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
              </button>
              
              <button
                onClick={handleFollow}
                disabled={actionLoading === 'follow'}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl font-medium transition-all ${
                  isFollowing
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'bg-white/5 text-white hover:bg-white/10'
                }`}
              >
                {actionLoading === 'follow' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : isFollowing ? (
                  <BookmarkCheck className="w-4 h-4" />
                ) : (
                  <Bookmark className="w-4 h-4" />
                )}
                {isFollowing ? 'Following' : 'Follow'}
              </button>

              <button
                onClick={handleShare}
                aria-label="Share system"
                className="p-3 rounded-xl bg-white/5 text-gray-400 hover:bg-white/10 transition-all"
              >
                <Share2 className="w-5 h-5" />
              </button>

              {isCopied ? (
                <div className="flex items-center gap-2 px-4 py-3 bg-emerald-500/20 text-emerald-400 rounded-xl font-medium">
                  <Check className="w-5 h-5" />
                  Copied to Your Systems
                </div>
              ) : (
                <button
                  onClick={handleCopy}
                  disabled={actionLoading === 'copy'}
                  className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-medium hover:opacity-90 transition-all"
                >
                  {actionLoading === 'copy' ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Copy className="w-5 h-5" />
                  )}
                  Copy System
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Stats & Performance */}
          <div className="lg:col-span-2 space-y-6">
            {/* Key Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-[#0f0f18] rounded-xl border border-white/5">
                <div className="flex items-center gap-2 mb-1">
                  <Percent className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs text-gray-500">Win Rate</span>
                </div>
                <p className="text-2xl font-bold text-white">{system.historicalRecord.winRate}%</p>
              </div>
              <div className="p-4 bg-[#0f0f18] rounded-xl border border-white/5">
                <div className="flex items-center gap-2 mb-1">
                  <Trophy className="w-4 h-4 text-amber-400" />
                  <span className="text-xs text-gray-500">Record</span>
                </div>
                <p className="text-2xl font-bold text-emerald-400">
                  {system.historicalRecord.wins}-{system.historicalRecord.losses}
                  {system.historicalRecord.pushes > 0 && `-${system.historicalRecord.pushes}`}
                </p>
              </div>
              <div className="p-4 bg-[#0f0f18] rounded-xl border border-white/5">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="w-4 h-4 text-purple-400" />
                  <span className="text-xs text-gray-500">ROI</span>
                </div>
                <p className={`text-2xl font-bold ${system.historicalRecord.roi >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {system.historicalRecord.roi >= 0 ? '+' : ''}{system.historicalRecord.roi}%
                </p>
              </div>
              <div className="p-4 bg-[#0f0f18] rounded-xl border border-white/5">
                <div className="flex items-center gap-2 mb-1">
                  <Activity className="w-4 h-4 text-blue-400" />
                  <span className="text-xs text-gray-500">Sample Size</span>
                </div>
                <p className="text-2xl font-bold text-white">{system.sampleSize.toLocaleString()}</p>
              </div>
            </div>

            {/* Key Insight */}
            <div className="p-4 bg-gradient-to-r from-amber-500/10 to-orange-500/10 rounded-xl border border-amber-500/20">
              <div className="flex items-start gap-3">
                <Zap className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-amber-400 mb-1">Key Insight</h3>
                  <p className="text-gray-300">{system.keyInsight}</p>
                </div>
              </div>
            </div>

            {/* Full Description */}
            <div className="p-6 bg-[#0f0f18] rounded-xl border border-white/5">
              <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                <Info className="w-4 h-4 text-gray-400" />
                System Details
              </h3>
              <p className="text-gray-400 leading-relaxed">{system.fullDescription}</p>
            </div>

            {/* Criteria */}
            <div className="p-6 bg-[#0f0f18] rounded-xl border border-white/5">
              <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                <Target className="w-4 h-4 text-purple-400" />
                System Criteria
              </h3>
              <ul className="space-y-3">
                {system.criteria.map((criterion, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-300">{criterion}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Recent Picks */}
            {system.recentPicks && system.recentPicks.length > 0 && (
              <div className="p-6 bg-[#0f0f18] rounded-xl border border-white/5">
                <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                  <LineChart className="w-4 h-4 text-blue-400" />
                  Recent Picks
                </h3>
                <div className="space-y-2">
                  {system.recentPicks.slice(0, 8).map((pick) => (
                    <div key={pick.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-gray-500 w-20">{pick.date}</span>
                        <span className="text-sm text-gray-300">{pick.game}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-white font-medium">{pick.pick}</span>
                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                          pick.result === 'win' ? 'bg-emerald-500/20 text-emerald-400' :
                          pick.result === 'loss' ? 'bg-red-500/20 text-red-400' :
                          pick.result === 'push' ? 'bg-gray-500/20 text-gray-400' :
                          'bg-blue-500/20 text-blue-400'
                        }`}>
                          {pick.result.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Monthly Performance */}
            {system.monthlyPerformance && (
              <div className="p-6 bg-[#0f0f18] rounded-xl border border-white/5">
                <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                  <PieChart className="w-4 h-4 text-purple-400" />
                  Monthly Performance
                </h3>
                <div className="grid grid-cols-5 gap-2">
                  {system.monthlyPerformance.map((month) => (
                    <div key={month.month} className="p-3 bg-white/5 rounded-lg text-center">
                      <p className="text-xs text-gray-500 mb-1">{month.month}</p>
                      <p className="text-sm text-emerald-400 font-medium">{month.wins}-{month.losses}</p>
                      <p className={`text-xs ${month.roi >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {month.roi >= 0 ? '+' : ''}{month.roi.toFixed(1)}%
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Creator Card */}
            <div className="p-6 bg-[#0f0f18] rounded-xl border border-white/5">
              <h3 className="font-semibold text-white mb-4">Created By</h3>
              <Link href={`/profile/${system.creator.username}`} className="flex items-center gap-3 hover:opacity-80">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                  {system.creator.username.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium text-white">{system.creator.username}</span>
                    {system.creator.verified && <CheckCircle className="w-4 h-4 text-blue-400" />}
                  </div>
                  <span className="text-xs text-gray-500">View Profile</span>
                </div>
              </Link>
            </div>

            {/* Stats Card */}
            <div className="p-6 bg-[#0f0f18] rounded-xl border border-white/5">
              <h3 className="font-semibold text-white mb-4">System Stats</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 flex items-center gap-2">
                    <Users className="w-4 h-4" /> Followers
                  </span>
                  <span className="text-white font-medium">{system.stats.followers}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 flex items-center gap-2">
                    <Copy className="w-4 h-4" /> Copies
                  </span>
                  <span className="text-white font-medium">{system.stats.copies}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 flex items-center gap-2">
                    <Heart className="w-4 h-4" /> Likes
                  </span>
                  <span className="text-white font-medium">{system.stats.likes}</span>
                </div>
              </div>
            </div>

            {/* Tags */}
            <div className="p-6 bg-[#0f0f18] rounded-xl border border-white/5">
              <h3 className="font-semibold text-white mb-4">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {system.tags.map((tag, i) => (
                  <span key={i} className="px-3 py-1 bg-white/5 text-gray-400 rounded-full text-sm">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>

            {/* CTA */}
            <div className="p-6 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl border border-purple-500/30">
              <h3 className="font-semibold text-white mb-2">Track Your Bets</h3>
              <p className="text-sm text-gray-400 mb-4">
                Follow this system to see picks in your User Control Panel and track your performance.
              </p>
              <Link
                href="/dashboard"
                className="flex items-center justify-center gap-2 w-full py-3 bg-white/10 text-white rounded-xl font-medium hover:bg-white/20 transition-all"
              >
                Go to Dashboard
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
