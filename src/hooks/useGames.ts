'use client'

import { useState, useEffect, useCallback } from 'react'
import type { UnifiedGame, SportKey } from '@/lib/api/data-layer'

interface UseGamesResult {
  games: UnifiedGame[]
  isLoading: boolean
  error: string | null
  refetch: () => void
  lastUpdated: Date | null
}

export function useGames(sport: SportKey): UseGamesResult {
  const [games, setGames] = useState<UnifiedGame[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const fetchGames = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const res = await fetch(`/api/games?sport=${sport}`)
      if (!res.ok) throw new Error('Failed to fetch games')
      
      const data = await res.json()
      setGames(data.games || [])
      setLastUpdated(new Date())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }, [sport])

  useEffect(() => {
    fetchGames()
    
    // Auto-refresh every 60 seconds
    const interval = setInterval(fetchGames, 60000)
    return () => clearInterval(interval)
  }, [fetchGames])

  return { games, isLoading, error, refetch: fetchGames, lastUpdated }
}

// Hook for live games with more frequent updates
export function useLiveGames(sport: SportKey): UseGamesResult {
  const [games, setGames] = useState<UnifiedGame[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const fetchGames = useCallback(async () => {
    try {
      const res = await fetch(`/api/games?sport=${sport}`)
      if (!res.ok) throw new Error('Failed to fetch games')
      
      const data = await res.json()
      const allGames = data.games || []
      
      // Filter to only live games
      const live = allGames.filter((g: UnifiedGame) => g.status === 'live')
      setGames(live)
      setLastUpdated(new Date())
      setIsLoading(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      setIsLoading(false)
    }
  }, [sport])

  useEffect(() => {
    fetchGames()
    
    // More frequent updates for live games (every 30 seconds)
    const interval = setInterval(fetchGames, 30000)
    return () => clearInterval(interval)
  }, [fetchGames])

  return { games, isLoading, error, refetch: fetchGames, lastUpdated }
}

// Hook for all sports combined
export function useAllSportsGames(): {
  gamesBySport: Partial<Record<SportKey, UnifiedGame[]>>
  isLoading: boolean
  error: string | null
} {
  const [gamesBySport, setGamesBySport] = useState<Partial<Record<SportKey, UnifiedGame[]>>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchAll = async () => {
      setIsLoading(true)
      const sports: SportKey[] = ['NFL', 'NBA', 'NHL', 'MLB']
      const results: Partial<Record<SportKey, UnifiedGame[]>> = {}
      
      await Promise.all(
        sports.map(async (sport) => {
          try {
            const res = await fetch(`/api/games?sport=${sport}`)
            if (res.ok) {
              const data = await res.json()
              results[sport] = data.games || []
            }
          } catch {
            results[sport] = []
          }
        })
      )
      
      setGamesBySport(results)
      setIsLoading(false)
    }
    
    fetchAll()
    const interval = setInterval(fetchAll, 60000)
    return () => clearInterval(interval)
  }, [])

  return { gamesBySport, isLoading, error }
}
