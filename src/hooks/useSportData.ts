/**
 * Centralized data fetching hooks with SWR caching
 * 
 * Benefits:
 * - Automatic caching and revalidation
 * - Request deduplication
 * - Stale-while-revalidate pattern
 * - Error handling and retry logic
 * - Optimistic UI updates
 */

import useSWR, { SWRConfiguration } from 'swr'
import type { 
  SportType, 
  Game, 
  GamesResponse, 
  MatchupAnalytics, 
  Injury, 
  InjuriesResponse 
} from '@/types/sports'

// Global fetcher with error handling
const fetcher = async <T>(url: string): Promise<T> => {
  const res = await fetch(url)
  
  if (!res.ok) {
    const error = new Error('An error occurred while fetching the data.')
    throw error
  }
  
  return res.json()
}

// Default SWR configuration for sports data
const defaultConfig: SWRConfiguration = {
  revalidateOnFocus: true,
  revalidateOnReconnect: true,
  dedupingInterval: 5000, // Dedupe requests within 5s
  errorRetryCount: 3,
  errorRetryInterval: 5000,
}

// Configuration for live games (more frequent updates)
const liveConfig: SWRConfiguration = {
  ...defaultConfig,
  refreshInterval: 30000, // Refresh every 30s for live data
  revalidateOnFocus: true,
}

// Configuration for static data (less frequent updates)
const staticConfig: SWRConfiguration = {
  ...defaultConfig,
  refreshInterval: 300000, // Refresh every 5 minutes
  revalidateOnFocus: false,
}

/**
 * Hook for fetching games by sport
 * Auto-refreshes for live scores
 */
export function useGames(sport: SportType | 'all' = 'all', hasLiveGames = false) {
  const url = sport === 'all' ? '/api/games' : `/api/games?sport=${sport}`
  
  const { data, error, isLoading, isValidating, mutate } = useSWR<GamesResponse>(
    url,
    fetcher,
    hasLiveGames ? liveConfig : defaultConfig
  )

  return {
    games: data?.games || [],
    count: data?.count || 0,
    lastUpdated: data?.lastUpdated,
    error,
    isLoading,
    isValidating,
    mutate,
    // Helper to check if any game is live
    hasLive: data?.games?.some(g => g.status === 'live') || false,
  }
}

/**
 * Hook for fetching a single game by ID
 */
export function useGame(gameId: string | undefined, sport: SportType) {
  const { games, error, isLoading, isValidating, mutate } = useGames(sport, true)
  
  const game = games.find((g: Game) => g.id === gameId)

  return {
    game: game || null,
    error: !game && !isLoading ? new Error('Game not found') : error,
    isLoading,
    isValidating,
    mutate,
  }
}

/**
 * Hook for fetching matchup analytics
 * Includes trends, H2H, edge scores, betting intelligence
 */
export function useMatchupAnalytics(gameId: string | undefined, includeIntelligence = true) {
  const url = gameId 
    ? `/api/matchup/${gameId}/analytics${includeIntelligence ? '?intelligence=true' : ''}`
    : null
  
  const { data, error, isLoading, isValidating, mutate } = useSWR<MatchupAnalytics>(
    url,
    fetcher,
    defaultConfig
  )

  return {
    analytics: data || null,
    trends: data?.trends || null,
    h2h: data?.h2h || null,
    edgeScore: data?.edgeScore || null,
    bettingIntelligence: data?.bettingIntelligence || null,
    error,
    isLoading,
    isValidating,
    mutate,
    // Convenience flags
    hasTopPick: !!data?.trends?.topPick,
    hasEdge: (data?.edgeScore?.overall || 0) >= 60,
    hasTrends: (data?.trends?.matched || 0) > 0,
  }
}

/**
 * Hook for fetching injuries
 * Can filter by sport and/or team
 */
export function useInjuries(sport?: SportType | 'all', team?: string) {
  let url = '/api/injuries'
  const params = new URLSearchParams()
  
  if (sport && sport !== 'all') params.append('sport', sport.toUpperCase())
  if (team) params.append('team', team)
  
  if (params.toString()) url += `?${params.toString()}`
  
  const { data, error, isLoading, isValidating, mutate } = useSWR<InjuriesResponse>(
    url,
    fetcher,
    staticConfig // Injuries don't change as frequently
  )

  return {
    injuries: data?.injuries || [],
    count: data?.count || 0,
    lastUpdated: data?.lastUpdated,
    error,
    isLoading,
    isValidating,
    mutate,
  }
}

/**
 * Hook for fetching injuries for a specific matchup (both teams)
 */
export function useMatchupInjuries(sport: SportType, homeTeam: string, awayTeam: string) {
  const { injuries, error, isLoading, isValidating, mutate } = useInjuries(sport)
  
  // Filter for both teams in the matchup
  const matchupInjuries = injuries.filter(
    (inj: Injury) => inj.team === homeTeam || inj.team === awayTeam
  )
  
  // Sort by severity
  const sortedInjuries = [...matchupInjuries].sort((a, b) => {
    const priority: Record<string, number> = {
      'Out': 1, 'IR': 2, 'Doubtful': 3, 'Questionable': 4, 
      'GTD': 5, 'Day-to-Day': 6, 'Probable': 7
    }
    return (priority[a.status] || 99) - (priority[b.status] || 99)
  })
  
  // Group by team
  const homeInjuries = sortedInjuries.filter((inj: Injury) => inj.team === homeTeam)
  const awayInjuries = sortedInjuries.filter((inj: Injury) => inj.team === awayTeam)

  return {
    injuries: sortedInjuries,
    homeInjuries,
    awayInjuries,
    totalCount: sortedInjuries.length,
    error,
    isLoading,
    isValidating,
    mutate,
  }
}

/**
 * Hook for combining game + analytics data for a matchup page
 * Single hook for all matchup page data needs
 */
export function useMatchupData(gameId: string | undefined, sport: SportType) {
  const { game, error: gameError, isLoading: gameLoading, mutate: mutateGame } = useGame(gameId, sport)
  const { analytics, error: analyticsError, isLoading: analyticsLoading, mutate: mutateAnalytics } = useMatchupAnalytics(gameId)
  
  // Refresh all data
  const refresh = () => {
    mutateGame()
    mutateAnalytics()
  }

  return {
    // Game data
    game,
    // Analytics data
    analytics,
    trends: analytics?.trends || null,
    h2h: analytics?.h2h || null,
    edgeScore: analytics?.edgeScore || null,
    bettingIntelligence: analytics?.bettingIntelligence || null,
    // Status
    isLoading: gameLoading || analyticsLoading,
    error: gameError || analyticsError,
    // Actions
    refresh,
    // Convenience
    isLive: game?.status === 'live',
    hasTopPick: !!analytics?.trends?.topPick,
    topPick: analytics?.trends?.topPick || null,
  }
}

/**
 * Hook for weather data (outdoor sports)
 */
export function useWeather(gameId: string | undefined) {
  const url = gameId ? `/api/weather?gameId=${gameId}` : null
  
  const { data, error, isLoading, mutate } = useSWR(
    url,
    fetcher,
    staticConfig
  )

  return {
    weather: data || null,
    error,
    isLoading,
    mutate,
  }
}

/**
 * Prefetch hook for route preloading
 * Call this on hover/focus to prefetch data before navigation
 */
export function prefetchMatchupData(gameId: string, sport: SportType) {
  // Prefetch game data
  fetch(`/api/games?sport=${sport}`)
  // Prefetch analytics
  fetch(`/api/matchup/${gameId}/analytics?intelligence=true`)
  // Prefetch injuries
  fetch(`/api/injuries?sport=${sport.toUpperCase()}`)
}
