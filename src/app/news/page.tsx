import { Metadata } from 'next'
import { Suspense } from 'react'
import { getAllSportsNews, NewsItem } from '@/lib/api/news'
import { formatTweetTime } from '@/lib/api/twitter'

export const metadata: Metadata = {
  title: 'Latest Sports News | Matchups',
  description: 'Breaking sports news, injury updates, and social buzz for NFL, NBA, NHL, and MLB',
}

// Revalidate every 5 minutes
export const revalidate = 300

// News Card Component
function NewsCard({ item }: { item: NewsItem }) {
  const timeAgo = formatTweetTime(item.publishedAt)
  
  const sourceColors: Record<string, string> = {
    espn: 'bg-red-500/20 text-red-400',
    twitter: 'bg-blue-500/20 text-blue-400',
    injury: 'bg-orange-500/20 text-orange-400',
    'api-sports': 'bg-green-500/20 text-green-400',
  }

  const sportColors: Record<string, string> = {
    NFL: 'bg-emerald-500/20 text-emerald-400',
    NBA: 'bg-orange-500/20 text-orange-400',
    NHL: 'bg-blue-500/20 text-blue-400',
    MLB: 'bg-red-500/20 text-red-400',
  }

  const statusColors: Record<string, string> = {
    out: 'text-red-400',
    doubtful: 'text-red-400',
    questionable: 'text-yellow-400',
    probable: 'text-green-400',
    'day-to-day': 'text-yellow-400',
    ir: 'text-red-500',
  }

  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block bg-background-secondary border border-border rounded-lg overflow-hidden hover:border-accent transition-colors"
    >
      {item.imageUrl && (
        <div className="aspect-video relative overflow-hidden">
          <img
            src={item.imageUrl}
            alt=""
            className="w-full h-full object-cover"
          />
        </div>
      )}
      
      <div className="p-4">
        {/* Tags row */}
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <span className={`text-xs px-2 py-0.5 rounded-full ${sportColors[item.sport] || 'bg-accent/20 text-accent'}`}>
            {item.sport}
          </span>
          <span className={`text-xs px-2 py-0.5 rounded-full ${sourceColors[item.source]}`}>
            {item.source === 'twitter' ? '𝕏' : item.source.toUpperCase()}
          </span>
          {item.type === 'injury' && (
            <span className={`text-xs font-bold ${statusColors[item.title.split(' - ')[1]?.toLowerCase()] || 'text-yellow-400'}`}>
              INJURY
            </span>
          )}
          <span className="text-xs text-text-secondary ml-auto">{timeAgo}</span>
        </div>

        {/* Title */}
        <h3 className="font-semibold text-text-primary mb-1 line-clamp-2">
          {item.title}
        </h3>

        {/* Description */}
        {item.description && (
          <p className="text-sm text-text-secondary line-clamp-2 mb-2">
            {item.description}
          </p>
        )}

        {/* Author / Engagement */}
        <div className="flex items-center justify-between text-xs text-text-secondary">
          {item.author && (
            <div className="flex items-center gap-2">
              {item.author.avatarUrl && (
                <img
                  src={item.author.avatarUrl}
                  alt=""
                  className="w-5 h-5 rounded-full"
                />
              )}
              <span>
                {item.author.handle || item.author.name}
                {item.author.verified && (
                  <span className="ml-1 text-blue-400">✓</span>
                )}
              </span>
            </div>
          )}
          
          {item.engagement && (
            <div className="flex items-center gap-3">
              <span>❤️ {item.engagement.likes.toLocaleString()}</span>
              <span>🔄 {item.engagement.shares.toLocaleString()}</span>
            </div>
          )}
        </div>
      </div>
    </a>
  )
}

// Loading skeleton
function NewsCardSkeleton() {
  return (
    <div className="bg-background-secondary border border-border rounded-lg overflow-hidden animate-pulse">
      <div className="aspect-video bg-background-tertiary" />
      <div className="p-4 space-y-3">
        <div className="flex gap-2">
          <div className="h-5 w-12 bg-background-tertiary rounded-full" />
          <div className="h-5 w-16 bg-background-tertiary rounded-full" />
        </div>
        <div className="h-5 w-3/4 bg-background-tertiary rounded" />
        <div className="h-4 w-full bg-background-tertiary rounded" />
        <div className="h-4 w-2/3 bg-background-tertiary rounded" />
      </div>
    </div>
  )
}

// Sport filter tabs
function SportTabs({ activeSport }: { activeSport: string }) {
  const sports = ['ALL', 'NFL', 'NBA', 'NHL', 'MLB']
  
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {sports.map(sport => (
        <a
          key={sport}
          href={`/news${sport === 'ALL' ? '' : `?sport=${sport}`}`}
          className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
            activeSport === sport
              ? 'bg-accent text-white'
              : 'bg-background-secondary text-text-secondary hover:text-text-primary'
          }`}
        >
          {sport}
        </a>
      ))}
    </div>
  )
}

// News feed component
async function NewsFeed({ sport }: { sport?: string }) {
  const sports = sport 
    ? [sport as 'NFL' | 'NBA' | 'NHL' | 'MLB']
    : ['NFL', 'NBA', 'NHL', 'MLB'] as const

  const feed = await getAllSportsNews({
    sports: sports as Array<'NFL' | 'NBA' | 'NHL' | 'MLB'>,
    includeTwitter: true,
    limit: 50,
  })

  if (feed.items.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-text-secondary">No news available at the moment.</p>
        <p className="text-sm text-text-tertiary mt-2">Check back soon for updates!</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {feed.items.map(item => (
        <NewsCard key={item.id} item={item} />
      ))}
    </div>
  )
}

// Main page component
export default function NewsPage({
  searchParams,
}: {
  searchParams: { sport?: string }
}) {
  const activeSport = searchParams.sport || 'ALL'

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text-primary mb-2">
          Latest Sports News
        </h1>
        <p className="text-text-secondary">
          Breaking news, injury updates, and social buzz from around the sports world
        </p>
      </div>

      {/* Sport filter */}
      <div className="mb-6">
        <SportTabs activeSport={activeSport} />
      </div>

      {/* News feed */}
      <Suspense
        fallback={
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 9 }).map((_, i) => (
              <NewsCardSkeleton key={i} />
            ))}
          </div>
        }
      >
        <NewsFeed sport={activeSport === 'ALL' ? undefined : activeSport} />
      </Suspense>

      {/* Last updated */}
      <div className="mt-8 text-center text-sm text-text-tertiary">
        News refreshes automatically every 5 minutes
      </div>
    </div>
  )
}
