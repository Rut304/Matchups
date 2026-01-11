'use client'

/**
 * Skeleton loading states for matchup components
 * Provides visual feedback while data loads
 */

// Skeleton pulse animation class
const pulse = "animate-pulse bg-white/5 rounded"

export function MatchupHeaderSkeleton() {
  return (
    <div className="border-b border-white/5 bg-[#0a0a12]">
      <div className="max-w-[1600px] mx-auto px-4 py-4">
        {/* Back button */}
        <div className={`h-6 w-32 ${pulse} mb-4`} />
        
        {/* Sport/Date */}
        <div className={`h-5 w-64 ${pulse} mb-6`} />
        
        {/* Teams */}
        <div className="grid grid-cols-3 gap-8 items-center py-6">
          {/* Away Team */}
          <div className="flex items-center gap-4">
            <div className={`w-20 h-20 rounded-2xl ${pulse}`} />
            <div className="space-y-2">
              <div className={`h-8 w-40 ${pulse}`} />
              <div className={`h-4 w-20 ${pulse}`} />
            </div>
          </div>
          
          {/* Center */}
          <div className="flex flex-col items-center gap-4">
            <div className={`h-6 w-12 ${pulse}`} />
            <div className={`h-24 w-32 ${pulse}`} />
            <div className={`h-24 w-32 ${pulse}`} />
          </div>
          
          {/* Home Team */}
          <div className="flex items-center gap-4 justify-end">
            <div className="space-y-2 text-right">
              <div className={`h-8 w-40 ${pulse} ml-auto`} />
              <div className={`h-4 w-20 ${pulse} ml-auto`} />
            </div>
            <div className={`w-20 h-20 rounded-2xl ${pulse}`} />
          </div>
        </div>
      </div>
    </div>
  )
}

export function EdgeScoreSkeleton() {
  return (
    <div className="bg-[#0c0c14] rounded-xl border border-white/10 p-6">
      <div className={`h-6 w-32 ${pulse} mb-4`} />
      <div className="space-y-4">
        <div className="flex justify-between">
          <div className={`h-5 w-24 ${pulse}`} />
          <div className={`h-6 w-16 ${pulse}`} />
        </div>
        {[1, 2, 3].map(i => (
          <div key={i} className="flex justify-between">
            <div className={`h-4 w-28 ${pulse}`} />
            <div className={`h-4 w-12 ${pulse}`} />
          </div>
        ))}
      </div>
    </div>
  )
}

export function BettingMetricsSkeleton() {
  return (
    <div className="bg-[#0c0c14] rounded-xl border border-white/10 p-6">
      <div className={`h-6 w-40 ${pulse} mb-4`} />
      <div className="grid grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-[#16161e] rounded-lg p-4 text-center">
            <div className={`h-3 w-16 ${pulse} mx-auto mb-2`} />
            <div className={`h-8 w-12 ${pulse} mx-auto`} />
          </div>
        ))}
      </div>
    </div>
  )
}

export function TrendsSkeleton() {
  return (
    <div className="bg-[#0c0c14] rounded-xl border border-white/10 p-6">
      <div className={`h-6 w-48 ${pulse} mb-4`} />
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="flex items-center justify-between p-3 bg-[#16161e] rounded-lg">
            <div className={`h-4 w-3/4 ${pulse}`} />
            <div className={`h-5 w-12 ${pulse}`} />
          </div>
        ))}
      </div>
    </div>
  )
}

export function H2HSkeleton() {
  return (
    <div className="bg-[#0c0c14] rounded-xl border border-white/10 p-6">
      <div className={`h-6 w-44 ${pulse} mb-4`} />
      <div className="grid grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="text-center">
            <div className={`h-8 w-12 ${pulse} mx-auto mb-2`} />
            <div className={`h-3 w-16 ${pulse} mx-auto`} />
          </div>
        ))}
      </div>
    </div>
  )
}

export function InjuryReportSkeleton() {
  return (
    <div className="bg-[#0c0c14] rounded-xl border border-white/10 p-6">
      <div className={`h-6 w-32 ${pulse} mb-4`} />
      <div className="space-y-2">
        {[1, 2, 3].map(i => (
          <div key={i} className="flex items-center justify-between p-2 bg-[#16161e] rounded-lg">
            <div className="flex items-center gap-2">
              <div className={`h-5 w-20 ${pulse}`} />
              <div className={`h-4 w-24 ${pulse}`} />
              <div className={`h-4 w-8 ${pulse}`} />
            </div>
            <div className={`h-4 w-16 ${pulse}`} />
          </div>
        ))}
      </div>
    </div>
  )
}

export function GameInfoSkeleton() {
  return (
    <div className="bg-[#0c0c14] rounded-xl border border-white/10 p-6">
      <div className={`h-6 w-24 ${pulse} mb-4`} />
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="flex items-center gap-2">
            <div className={`w-4 h-4 ${pulse}`} />
            <div className={`h-4 w-32 ${pulse}`} />
          </div>
        ))}
      </div>
    </div>
  )
}

// Full page loading skeleton
export function MatchupPageSkeleton() {
  return (
    <div className="min-h-screen bg-[#050508]">
      <MatchupHeaderSkeleton />
      <div className="max-w-[1600px] mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <BettingMetricsSkeleton />
            <H2HSkeleton />
            <TrendsSkeleton />
          </div>
          <div className="space-y-6">
            <EdgeScoreSkeleton />
            <InjuryReportSkeleton />
            <GameInfoSkeleton />
          </div>
        </div>
      </div>
    </div>
  )
}
