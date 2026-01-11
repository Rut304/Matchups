/**
 * useAnalytics Hook
 * 
 * Fetches real analytics data from the unified data layer
 * Replaces mock data in analytics pages with live data
 */

'use client'

import { useState, useEffect, useCallback } from 'react'

// Types matching our real-analytics service
export interface RealTrend {
  id: string
  sport: string
  category: string
  betType: string
  name: string
  description: string
  record: string
  winPct: number
  roi: number
  confidence: number
  isHot: boolean
  lastUpdated: string
  // UI fields (computed)
  title?: string
  edgeRating?: number
}

export interface RealMatchup {
  id: string
  sport: string
  date: string
  time: string
  status: 'scheduled' | 'live' | 'final'
  homeTeam: {
    abbr: string
    name: string
    logo: string
    score?: number
    record: string
    atsRecord: string
  }
  awayTeam: {
    abbr: string
    name: string
    logo: string
    score?: number
    record: string
    atsRecord: string
  }
  odds?: {
    spread: number
    total: number
    homeML: number
    awayML: number
  }
  edgeIndicators?: {
    sharpMoney: 'home' | 'away' | null
    lineMovement: 'steam' | 'reverse' | null
    publicSide: 'home' | 'away'
    publicPct: number
  }
}

export interface RealCapper {
  id: string
  name: string
  handle: string
  avatar: string
  verified: boolean
  sport: string
  record: { wins: number; losses: number; pushes: number }
  roi: number
  avgClv: number
  streak: number
  isHot: boolean
}

export interface RealLineMovement {
  id: string
  gameId: string
  sport: string
  teams: string
  openLine: number
  currentLine: number
  movement: number
  type: 'steam' | 'reverse' | 'sharp' | 'public'
  timestamp: string
}

export interface AnalyticsSummary {
  totalTrends: number
  hotTrends: number
  avgTrendWinPct: number
  totalMatchups: number
  edgeGames: number
  liveGames: number
  topCappers: RealCapper[]
  lastUpdated: string
}

// Transform API trends to UI format
function transformTrend(trend: RealTrend): RealTrend {
  return {
    ...trend,
    title: trend.name,
    edgeRating: Math.min(5, Math.floor(trend.winPct / 12)), // 60% = 5 stars
  }
}

/**
 * Hook for fetching high-edge trends
 */
export function useHighEdgeTrends(limit = 10) {
  const [trends, setTrends] = useState<RealTrend[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTrends = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/analytics?type=high-edge&limit=${limit}`)
      if (!res.ok) throw new Error('Failed to fetch trends')
      const data = await res.json()
      setTrends((data.trends || []).map(transformTrend))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }, [limit])

  useEffect(() => {
    fetchTrends()
  }, [fetchTrends])

  return { trends, isLoading, error, refetch: fetchTrends }
}

/**
 * Hook for fetching all trends
 */
export function useTrends(sport?: string, limit = 50) {
  const [trends, setTrends] = useState<RealTrend[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTrends = useCallback(async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({ type: 'trends', limit: limit.toString() })
      if (sport) params.set('sport', sport)
      
      const res = await fetch(`/api/analytics?${params}`)
      if (!res.ok) throw new Error('Failed to fetch trends')
      const data = await res.json()
      setTrends((data.trends || []).map(transformTrend))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }, [sport, limit])

  useEffect(() => {
    fetchTrends()
  }, [fetchTrends])

  return { trends, isLoading, error, refetch: fetchTrends }
}

/**
 * Hook for fetching matchups with edge indicators
 */
export function useMatchups(sport?: string, date?: string) {
  const [matchups, setMatchups] = useState<RealMatchup[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchMatchups = useCallback(async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({ type: 'matchups' })
      if (sport) params.set('sport', sport)
      if (date) params.set('date', date)
      
      const res = await fetch(`/api/analytics?${params}`)
      if (!res.ok) throw new Error('Failed to fetch matchups')
      const data = await res.json()
      setMatchups(data.matchups || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }, [sport, date])

  useEffect(() => {
    fetchMatchups()
    // Auto-refresh every 60 seconds
    const interval = setInterval(fetchMatchups, 60000)
    return () => clearInterval(interval)
  }, [fetchMatchups])

  return { matchups, isLoading, error, refetch: fetchMatchups }
}

/**
 * Hook for fetching top cappers
 */
export function useCappers(limit = 20) {
  const [cappers, setCappers] = useState<RealCapper[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCappers = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/analytics?type=cappers&limit=${limit}`)
      if (!res.ok) throw new Error('Failed to fetch cappers')
      const data = await res.json()
      setCappers(data.cappers || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }, [limit])

  useEffect(() => {
    fetchCappers()
  }, [fetchCappers])

  return { cappers, isLoading, error, refetch: fetchCappers }
}

/**
 * Hook for fetching line movements
 */
export function useLineMovements(sport?: string, limit = 50) {
  const [movements, setMovements] = useState<RealLineMovement[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchMovements = useCallback(async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({ type: 'line-movements', limit: limit.toString() })
      if (sport) params.set('sport', sport)
      
      const res = await fetch(`/api/analytics?${params}`)
      if (!res.ok) throw new Error('Failed to fetch line movements')
      const data = await res.json()
      setMovements(data.movements || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }, [sport, limit])

  useEffect(() => {
    fetchMovements()
    // More frequent updates for line movements
    const interval = setInterval(fetchMovements, 30000)
    return () => clearInterval(interval)
  }, [fetchMovements])

  return { movements, isLoading, error, refetch: fetchMovements }
}

/**
 * Hook for fetching analytics summary
 */
export function useAnalyticsSummary() {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSummary = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/analytics?type=summary')
      if (!res.ok) throw new Error('Failed to fetch summary')
      const data = await res.json()
      setSummary(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSummary()
    // Refresh summary every 5 minutes
    const interval = setInterval(fetchSummary, 300000)
    return () => clearInterval(interval)
  }, [fetchSummary])

  return { summary, isLoading, error, refetch: fetchSummary }
}

/**
 * Combined hook for Edge Finder page
 */
export function useEdgeFinder() {
  const { trends, isLoading: trendsLoading } = useHighEdgeTrends(10)
  const { matchups, isLoading: matchupsLoading } = useMatchups()
  const { cappers, isLoading: cappersLoading } = useCappers(5)
  const { movements, isLoading: movementsLoading } = useLineMovements(undefined, 20)
  const { summary, isLoading: summaryLoading } = useAnalyticsSummary()

  const isLoading = trendsLoading || matchupsLoading || cappersLoading || movementsLoading || summaryLoading

  return {
    trends,
    matchups,
    cappers,
    movements,
    summary,
    isLoading,
  }
}
