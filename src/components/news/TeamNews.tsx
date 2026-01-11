'use client'

import { useEffect, useState } from 'react'
import { formatTweetTime } from '@/lib/api/twitter'
import { NewsItem, InjuryUpdate } from '@/lib/api/news'

// ===========================================
// TYPES
// ===========================================

interface TeamNewsProps {
  sport: string
  teamId: string
  teamName: string
  teamAbbreviation: string
  className?: string
}

interface GameNewsProps {
  sport: string
  gameId: string
  homeTeam: { id: string; name: string; abbreviation: string }
  awayTeam: { id: string; name: string; abbreviation: string }
  className?: string
}

// ===========================================
// TEAM NEWS COMPONENT
// ===========================================

export function TeamNews({
  sport,
  teamId,
  teamName,
  teamAbbreviation,
  className = '',
}: TeamNewsProps) {
  const [news, setNews] = useState<NewsItem[]>([])
  const [injuries, setInjuries] = useState<InjuryUpdate[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'news' | 'injuries' | 'social'>('news')

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      try {
        const response = await fetch(
          `/api/team-news?sport=${sport}&teamId=${teamId}&teamName=${encodeURIComponent(teamName)}&abbreviation=${teamAbbreviation}`
        )
        if (response.ok) {
          const data = await response.json()
          setNews(data.news || [])
          setInjuries(data.injuries || [])
        }
      } catch (error) {
        console.error('Error fetching team news:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [sport, teamId, teamName, teamAbbreviation])

  const newsItems = news.filter(n => n.source === 'espn')
  const socialItems = news.filter(n => n.source === 'twitter')

  if (loading) {
    return (
      <div className={`bg-background-secondary rounded-lg p-4 ${className}`}>
        <div className="animate-pulse space-y-3">
          <div className="h-5 w-32 bg-background-tertiary rounded" />
          <div className="h-16 bg-background-tertiary rounded" />
          <div className="h-16 bg-background-tertiary rounded" />
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-background-secondary rounded-lg overflow-hidden ${className}`}>
      {/* Tab header */}
      <div className="flex border-b border-border">
        <button
          onClick={() => setActiveTab('news')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'news'
              ? 'text-accent border-b-2 border-accent'
              : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          News ({newsItems.length})
        </button>
        <button
          onClick={() => setActiveTab('injuries')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'injuries'
              ? 'text-accent border-b-2 border-accent'
              : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          Injuries ({injuries.length})
        </button>
        <button
          onClick={() => setActiveTab('social')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'social'
              ? 'text-accent border-b-2 border-accent'
              : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          Social ({socialItems.length})
        </button>
      </div>

      {/* Content */}
      <div className="p-4 max-h-96 overflow-y-auto">
        {activeTab === 'news' && (
          <NewsList items={newsItems} />
        )}
        {activeTab === 'injuries' && (
          <InjuryList injuries={injuries} />
        )}
        {activeTab === 'social' && (
          <SocialList items={socialItems} />
        )}
      </div>
    </div>
  )
}

// ===========================================
// GAME NEWS COMPONENT
// ===========================================

export function GameNews({
  sport,
  gameId,
  homeTeam,
  awayTeam,
  className = '',
}: GameNewsProps) {
  const [news, setNews] = useState<NewsItem[]>([])
  const [injuries, setInjuries] = useState<InjuryUpdate[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      try {
        const params = new URLSearchParams({
          sport,
          gameId,
          homeTeamId: homeTeam.id,
          homeTeamName: homeTeam.name,
          homeAbbr: homeTeam.abbreviation,
          awayTeamId: awayTeam.id,
          awayTeamName: awayTeam.name,
          awayAbbr: awayTeam.abbreviation,
        })
        
        const response = await fetch(`/api/game-news?${params}`)
        if (response.ok) {
          const data = await response.json()
          setNews(data.news || [])
          setInjuries(data.injuries || [])
        }
      } catch (error) {
        console.error('Error fetching game news:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [sport, gameId, homeTeam, awayTeam])

  const homeInjuries = injuries.filter(i => i.team === homeTeam.name)
  const awayInjuries = injuries.filter(i => i.team === awayTeam.name)

  if (loading) {
    return (
      <div className={`bg-background-secondary rounded-lg p-4 ${className}`}>
        <div className="animate-pulse space-y-3">
          <div className="h-5 w-40 bg-background-tertiary rounded" />
          <div className="h-16 bg-background-tertiary rounded" />
          <div className="h-16 bg-background-tertiary rounded" />
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Injuries Section */}
      {injuries.length > 0 && (
        <div className="bg-background-secondary rounded-lg p-4">
          <h3 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
            <span className="text-orange-400">⚠️</span> Injury Report
          </h3>
          
          {/* Home Team Injuries */}
          {homeInjuries.length > 0 && (
            <div className="mb-3">
              <h4 className="text-xs text-text-secondary mb-2">{homeTeam.name}</h4>
              <div className="space-y-1">
                {homeInjuries.map(injury => (
                  <InjuryBadge key={injury.id} injury={injury} />
                ))}
              </div>
            </div>
          )}
          
          {/* Away Team Injuries */}
          {awayInjuries.length > 0 && (
            <div>
              <h4 className="text-xs text-text-secondary mb-2">{awayTeam.name}</h4>
              <div className="space-y-1">
                {awayInjuries.map(injury => (
                  <InjuryBadge key={injury.id} injury={injury} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Social & News Section */}
      {news.length > 0 && (
        <div className="bg-background-secondary rounded-lg p-4">
          <h3 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
            <span>📰</span> Latest Updates
          </h3>
          <div className="space-y-3">
            {news.slice(0, 5).map(item => (
              <NewsItemCard key={item.id} item={item} compact />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ===========================================
// SHARED COMPONENTS
// ===========================================

function NewsList({ items }: { items: NewsItem[] }) {
  if (items.length === 0) {
    return (
      <p className="text-text-secondary text-sm text-center py-4">
        No recent news available
      </p>
    )
  }

  return (
    <div className="space-y-3">
      {items.map(item => (
        <NewsItemCard key={item.id} item={item} />
      ))}
    </div>
  )
}

function SocialList({ items }: { items: NewsItem[] }) {
  if (items.length === 0) {
    return (
      <p className="text-text-secondary text-sm text-center py-4">
        No recent social updates
      </p>
    )
  }

  return (
    <div className="space-y-3">
      {items.map(item => (
        <NewsItemCard key={item.id} item={item} showEngagement />
      ))}
    </div>
  )
}

function InjuryList({ injuries }: { injuries: InjuryUpdate[] }) {
  if (injuries.length === 0) {
    return (
      <p className="text-text-secondary text-sm text-center py-4">
        No current injuries reported
      </p>
    )
  }

  // Group by status
  const grouped = {
    out: injuries.filter(i => i.status === 'out' || i.status === 'ir'),
    doubtful: injuries.filter(i => i.status === 'doubtful'),
    questionable: injuries.filter(i => i.status === 'questionable'),
    probable: injuries.filter(i => i.status === 'probable' || i.status === 'day-to-day'),
  }

  return (
    <div className="space-y-4">
      {grouped.out.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-red-400 mb-2">OUT / IR</h4>
          <div className="space-y-1">
            {grouped.out.map(injury => (
              <InjuryBadge key={injury.id} injury={injury} />
            ))}
          </div>
        </div>
      )}
      
      {grouped.doubtful.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-red-300 mb-2">DOUBTFUL</h4>
          <div className="space-y-1">
            {grouped.doubtful.map(injury => (
              <InjuryBadge key={injury.id} injury={injury} />
            ))}
          </div>
        </div>
      )}
      
      {grouped.questionable.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-yellow-400 mb-2">QUESTIONABLE</h4>
          <div className="space-y-1">
            {grouped.questionable.map(injury => (
              <InjuryBadge key={injury.id} injury={injury} />
            ))}
          </div>
        </div>
      )}
      
      {grouped.probable.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-green-400 mb-2">PROBABLE / DAY-TO-DAY</h4>
          <div className="space-y-1">
            {grouped.probable.map(injury => (
              <InjuryBadge key={injury.id} injury={injury} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function NewsItemCard({
  item,
  compact = false,
  showEngagement = false,
}: {
  item: NewsItem
  compact?: boolean
  showEngagement?: boolean
}) {
  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block hover:bg-background-tertiary rounded p-2 -m-2 transition-colors"
    >
      <div className="flex gap-3">
        {item.imageUrl && !compact && (
          <img
            src={item.imageUrl}
            alt=""
            className="w-16 h-16 object-cover rounded flex-shrink-0"
          />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {item.source === 'twitter' && item.author && (
              <span className="text-xs text-blue-400">@{item.author.handle?.replace('@', '')}</span>
            )}
            <span className="text-xs text-text-tertiary">
              {formatTweetTime(item.publishedAt)}
            </span>
          </div>
          <p className={`text-sm text-text-primary ${compact ? 'line-clamp-2' : 'line-clamp-3'}`}>
            {item.source === 'twitter' ? item.description : item.title}
          </p>
          {showEngagement && item.engagement && (
            <div className="flex items-center gap-3 mt-1 text-xs text-text-tertiary">
              <span>❤️ {item.engagement.likes.toLocaleString()}</span>
              <span>🔄 {item.engagement.shares.toLocaleString()}</span>
            </div>
          )}
        </div>
      </div>
    </a>
  )
}

function InjuryBadge({ injury }: { injury: InjuryUpdate }) {
  const statusColors: Record<string, string> = {
    out: 'bg-red-500/20 text-red-400',
    ir: 'bg-red-600/20 text-red-500',
    doubtful: 'bg-red-400/20 text-red-300',
    questionable: 'bg-yellow-500/20 text-yellow-400',
    probable: 'bg-green-500/20 text-green-400',
    'day-to-day': 'bg-yellow-400/20 text-yellow-300',
  }

  return (
    <div className="flex items-center justify-between text-sm py-1">
      <div className="flex items-center gap-2">
        <span className="text-text-primary font-medium">{injury.player}</span>
        <span className="text-text-tertiary text-xs">{injury.position}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs text-text-secondary">{injury.injury}</span>
        <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[injury.status]}`}>
          {injury.status.toUpperCase()}
        </span>
      </div>
    </div>
  )
}

// ===========================================
// EXPORTS
// ===========================================

export default TeamNews
