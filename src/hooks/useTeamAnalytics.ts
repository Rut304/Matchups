/**
 * Hook for fetching real team analytics data
 * 
 * Uses the /api/analytics?type=teams endpoint to get real ATS/OU data
 * from ESPN standings + Supabase historical_games
 */

import { useState, useEffect, useCallback, useMemo } from 'react'
import type { RealTeamAnalytics, Sport } from '@/lib/services/real-analytics'

// Extended type with computed hot/cold fields
export interface TeamWithStreaks extends RealTeamAnalytics {
  streak: string
  isHot: boolean
  isCold: boolean
}

interface UseTeamAnalyticsResult {
  teams: TeamWithStreaks[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

// Helper to calculate win percentage
export const calcWinPct = (wins: number, losses: number): number => {
  const total = wins + losses
  return total > 0 ? (wins / total) * 100 : 0
}

// Helper to calculate over percentage
export const calcOverPct = (overs: number, unders: number): number => {
  const total = overs + unders
  return total > 0 ? (overs / total) * 100 : 0
}

// Compute streak string and hot/cold status from last10 ATS record
function computeStreakInfo(last10: { wins: number; losses: number; pushes: number }): { streak: string; isHot: boolean; isCold: boolean } {
  const { wins, losses } = last10
  const winPct = calcWinPct(wins, losses)
  
  // Determine streak text
  let streak = `${wins}-${losses} L10`
  
  // Hot: 7+ wins in last 10 (70%+)
  const isHot = winPct >= 70 && wins >= 7
  
  // Cold: 7+ losses in last 10 (30% or less wins)
  const isCold = winPct <= 30 && losses >= 7
  
  if (isHot) {
    streak = `🔥 ${wins}-${losses}`
  } else if (isCold) {
    streak = `❄️ ${wins}-${losses}`
  }
  
  return { streak, isHot, isCold }
}

export function useTeamAnalytics(sport: Sport): UseTeamAnalyticsResult {
  const [rawTeams, setRawTeams] = useState<RealTeamAnalytics[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTeams = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/analytics?type=teams&sport=${sport}`)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch teams: ${response.statusText}`)
      }
      
      const data = await response.json()
      setRawTeams(data.teams || [])
    } catch (err) {
      console.error(`Error fetching ${sport} team analytics:`, err)
      setError(err instanceof Error ? err.message : 'Failed to fetch teams')
    } finally {
      setLoading(false)
    }
  }, [sport])

  useEffect(() => {
    fetchTeams()
  }, [fetchTeams])

  // Add computed streak info to each team
  const teams = useMemo((): TeamWithStreaks[] => {
    return rawTeams.map(team => {
      const streakInfo = computeStreakInfo(team.ats.last10)
      return {
        ...team,
        ...streakInfo,
      }
    })
  }, [rawTeams])

  return {
    teams,
    loading,
    error,
    refetch: fetchTeams,
  }
}
