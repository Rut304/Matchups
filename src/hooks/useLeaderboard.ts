'use client'

/**
 * useLeaderboard Hook
 * Fetches leaderboard data from Supabase
 * NO MOCK DATA - shows "Data unavailable" when database is empty
 */

import { useState, useEffect, useMemo } from 'react'
import { fetchLeaderboardEntries, hasRealData, type LeaderboardEntry } from '@/lib/services/leaderboard-service'
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
  dataSource: 'database' | 'unavailable'
  refresh: () => void
}

export function useLeaderboard(options: UseLeaderboardOptions = {}): UseLeaderboardReturn {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dataSource, setDataSource] = useState<'database' | 'unavailable'>('unavailable')
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
        // Try to fetch from Supabase
        const realEntries = await fetchLeaderboardEntries({
          capperType: capperType === 'all' ? undefined : capperType,
          sport: sport === 'all' ? undefined : sport,
          betType: betType === 'all' ? undefined : betType,
          sortBy,
          daysBack,
          limit
        })

        if (!cancelled) {
          if (realEntries.length > 0) {
            setEntries(realEntries)
            setDataSource('database')
          } else {
            // NO MOCK DATA - return empty and mark as unavailable
            setEntries([])
            setDataSource('unavailable')
            setError('Leaderboard data not yet available. Check back soon.')
          }
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Leaderboard fetch error:', err)
          setError(err instanceof Error ? err.message : 'Failed to load leaderboard')
          // NO MOCK DATA FALLBACK - set empty
          setEntries([])
          setDataSource('unavailable')
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
 * NO MOCK DATA - returns empty arrays when data unavailable
 */
export function useStreaks() {
  const [hotStreaks, setHotStreaks] = useState<LeaderboardEntry[]>([])
  const [coldStreaks, setColdStreaks] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStreaks = async () => {
      setLoading(true)
      try {
        const entries = await fetchLeaderboardEntries({ sortBy: 'streak', limit: 50 })

        // Separate hot and cold streaks
        const hot = entries.filter(e => e.streak?.startsWith('W') && parseInt(e.streak.slice(1)) >= 3)
        const cold = entries.filter(e => e.streak?.startsWith('L') && parseInt(e.streak.slice(1)) >= 3)

        setHotStreaks(hot.slice(0, 5))
        setColdStreaks(cold.slice(0, 5))
      } catch (err) {
        console.error('Error fetching streaks:', err)
        // NO MOCK DATA - set empty
        setHotStreaks([])
        setColdStreaks([])
      } finally {
        setLoading(false)
      }
    }

    fetchStreaks()
  }, [])

  return { hotStreaks, coldStreaks, loading }
}
