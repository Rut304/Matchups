'use client'

/**
 * useLeaderboard Hook
 * Fetches leaderboard data from Supabase, with fallback to mock data
 */

import { useState, useEffect, useMemo } from 'react'
import { fetchLeaderboardEntries, hasRealData, type LeaderboardEntry } from '@/lib/services/leaderboard-service'
import { getLeaderboardEntries as getMockLeaderboardEntries } from '@/lib/leaderboard-data'
import type { BetType, Sport, CapperType } from '@/types/leaderboard'

interface UseLeaderboardOptions {
  capperType?: CapperType | 'all'
  sport?: Sport | 'all'
  betType?: BetType | 'all'
  sortBy?: 'units' | 'winPct' | 'roi' | 'picks' | 'record' | 'streak'
  daysBack?: number | null
  limit?: number
}

interface UseLeaderboardReturn {
  entries: LeaderboardEntry[]
  loading: boolean
  error: string | null
  dataSource: 'database' | 'mock'
  refresh: () => void
}

export function useLeaderboard(options: UseLeaderboardOptions = {}): UseLeaderboardReturn {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dataSource, setDataSource] = useState<'database' | 'mock'>('mock')
  const [refreshKey, setRefreshKey] = useState(0)

  const {
    capperType = 'all',
    sport = 'all',
    betType = 'all',
    sortBy = 'units',
    daysBack = null,
    limit = 100
  } = options

  const refresh = () => setRefreshKey(k => k + 1)

  useEffect(() => {
    let cancelled = false

    const fetchData = async () => {
      setLoading(true)
      setError(null)

      try {
        // First try to check if we have real data
        const hasReal = await hasRealData()

        if (hasReal) {
          // Fetch from Supabase
          const realEntries = await fetchLeaderboardEntries({
            capperType: capperType === 'all' ? undefined : capperType,
            sport: sport === 'all' ? undefined : sport,
            betType: betType === 'all' ? undefined : betType,
            sortBy,
            daysBack,
            limit
          })

          if (!cancelled && realEntries.length > 0) {
            setEntries(realEntries)
            setDataSource('database')
            setLoading(false)
            return
          }
        }

        // Fallback to mock data
        if (!cancelled) {
          console.log('Using mock leaderboard data - Supabase tables may be empty')
          const mockEntries = getMockLeaderboardEntries({
            capperType: capperType === 'all' ? 'all' : capperType,
            sport: sport === 'all' ? undefined : sport,
            betType: betType === 'all' ? undefined : betType,
            sortBy,
            daysBack
          })
          setEntries(mockEntries)
          setDataSource('mock')
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Leaderboard fetch error:', err)
          setError(err instanceof Error ? err.message : 'Failed to load leaderboard')
          
          // Still try mock data on error
          try {
            const mockEntries = getMockLeaderboardEntries({
              capperType: capperType === 'all' ? 'all' : capperType,
              sport: sport === 'all' ? undefined : sport,
              betType: betType === 'all' ? undefined : betType,
              sortBy,
              daysBack
            })
            setEntries(mockEntries)
            setDataSource('mock')
          } catch {
            setEntries([])
          }
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    fetchData()

    return () => {
      cancelled = true
    }
  }, [capperType, sport, betType, sortBy, daysBack, limit, refreshKey])

  return {
    entries,
    loading,
    error,
    dataSource,
    refresh
  }
}

/**
 * Hook to get hot/cold streaks
 */
export function useStreaks() {
  const [hotStreaks, setHotStreaks] = useState<LeaderboardEntry[]>([])
  const [coldStreaks, setColdStreaks] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStreaks = async () => {
      setLoading(true)
      try {
        const hasReal = await hasRealData()
        
        let entries: LeaderboardEntry[]
        if (hasReal) {
          entries = await fetchLeaderboardEntries({ sortBy: 'streak', limit: 50 })
        } else {
          entries = getMockLeaderboardEntries({ sortBy: 'streak' })
        }

        // Separate hot and cold streaks
        const hot = entries.filter(e => e.streak?.startsWith('W') && parseInt(e.streak.slice(1)) >= 3)
        const cold = entries.filter(e => e.streak?.startsWith('L') && parseInt(e.streak.slice(1)) >= 3)

        setHotStreaks(hot.slice(0, 5))
        setColdStreaks(cold.slice(0, 5))
      } catch (err) {
        console.error('Error fetching streaks:', err)
        // Fallback
        const entries = getMockLeaderboardEntries({ sortBy: 'streak' })
        const hot = entries.filter(e => e.streak?.startsWith('W') && parseInt(e.streak.slice(1)) >= 3)
        const cold = entries.filter(e => e.streak?.startsWith('L') && parseInt(e.streak.slice(1)) >= 3)
        setHotStreaks(hot.slice(0, 5))
        setColdStreaks(cold.slice(0, 5))
      } finally {
        setLoading(false)
      }
    }

    fetchStreaks()
  }, [])

  return { hotStreaks, coldStreaks, loading }
}
