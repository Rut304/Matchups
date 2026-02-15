import { Metadata } from 'next'
import { Suspense } from 'react'
import { getAllSportsNews, NewsItem } from '@/lib/api/news'
import { NewsPageClient } from '@/components/news/NewsPageClient'

export const metadata: Metadata = {
  title: 'Latest Sports News | Matchups',
  description: 'Breaking sports news, injury updates, and social buzz for NFL, NBA, NHL, and MLB',
}

// Force dynamic rendering - news requires fresh API calls at request time
// This prevents build failures from Twitter API rate limits
export const dynamic = 'force-dynamic'

// Revalidate every 5 minutes (for ISR fallback)
export const revalidate = 300

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

// News feed fetcher component
async function NewsFetcher({ sport }: { sport?: string }) {
  const sports = sport && sport !== 'ALL'
    ? [sport as 'NFL' | 'NBA' | 'NHL' | 'MLB']
    : ['NFL', 'NBA', 'NHL', 'MLB'] as const

  const feed = await getAllSportsNews({
    sports: sports as Array<'NFL' | 'NBA' | 'NHL' | 'MLB'>,
    includeTwitter: true,
    limit: 100, // Fetch more so client can filter
  })

  return <NewsPageClient initialNews={feed.items} initialSport={sport || 'ALL'} />
}

// Main page component
export default async function NewsPage({
  searchParams,
}: {
  searchParams: Promise<{ sport?: string }>
}) {
  const params = await searchParams
  const activeSport = params.sport || 'ALL'

  return (
    <Suspense
      fallback={
        <div className="container mx-auto px-4 py-8">
          {/* Header skeleton */}
          <div className="mb-8">
            <div className="h-8 w-64 bg-background-tertiary rounded animate-pulse mb-2" />
            <div className="h-5 w-96 bg-background-tertiary rounded animate-pulse" />
          </div>
          {/* Search skeleton */}
          <div className="mb-6">
            <div className="h-12 w-full bg-background-tertiary rounded-lg animate-pulse mb-4" />
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-10 w-16 bg-background-tertiary rounded-lg animate-pulse" />
              ))}
            </div>
          </div>
          {/* Grid skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 9 }).map((_, i) => (
              <NewsCardSkeleton key={i} />
            ))}
          </div>
        </div>
      }
    >
      <NewsFetcher sport={activeSport} />
    </Suspense>
  )
}
