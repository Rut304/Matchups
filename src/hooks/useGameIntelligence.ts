/**
 * USE GAME INTELLIGENCE HOOK
 * Unified hook that aggregates all betting intelligence for a game
 * 
 * Combines:
 * - Head-to-head history
 * - Officials data
 * - Betting splits (public vs sharp)
 * - Player props
 * - Situational trends
 * - Team stats & pace
 * - Rest/schedule factors
 */

'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { getH2HSummary, getH2HBettingTrends, type H2HSummary } from '@/lib/api/head-to-head'
import { getGameOfficials, type GameOfficials } from '@/lib/api/officials'
import { getBettingSplits, getSharpPlays, type BettingSplit, type SharpPlay } from '@/lib/api/betting-splits'
import { getGameProps, getPropValuePicks, type PlayerProp } from '@/lib/api/player-props'
import { matchGameToTrends, type TrendMatch } from '@/lib/api/situational-trends'
import { compareTeams, type TeamStatComparison } from '@/lib/api/team-stats'
import { analyzeRestFactors, type RestAnalysis } from '@/lib/api/rest-schedule'

// =============================================================================
// TYPES
// =============================================================================

interface H2HState {
  loading: boolean
  data: H2HSummary | null
  trends: { type: string; description: string; confidence: 'high' | 'medium' | 'low' }[]
  error: string | null
}

interface OfficialsState {
  loading: boolean
  data: GameOfficials | null
  implications: { spreadTendency: string; totalTendency: string; keyInsights: string[] }[]
  error: string | null
}

interface SplitsState {
  loading: boolean
  data: BettingSplit | null
  isSharpPlay: boolean
  sharpSide?: 'home' | 'away'
  error: string | null
}

interface PropsState {
  loading: boolean
  data: PlayerProp[]
  valuePicks: { prop: PlayerProp; edge: number; factors: string[] }[]
  error: string | null
}

interface TrendsState {
  loading: boolean
  matches: TrendMatch[]
  topTrend: TrendMatch | null
  error: string | null
}

interface TeamsState {
  loading: boolean
  comparison: TeamStatComparison | null
  error: string | null
}

interface ScheduleState {
  loading: boolean
  analysis: RestAnalysis | null
  error: string | null
}

export interface IntelligenceSummary {
  homeEdgeRating: number
  awayEdgeRating: number
  recommendedSide: 'home' | 'away' | 'pass'
  recommendedBetType: 'spread' | 'moneyline' | 'total' | 'pass'
  confidence: 'high' | 'medium' | 'low'
  positiveFactors: { team: 'home' | 'away'; factor: string; category: string; weight: number }[]
  negativeFactors: { team: 'home' | 'away'; factor: string; category: string; weight: number }[]
  quickInsights: string[]
  alerts: { type: string; message: string; importance: 'high' | 'medium' | 'low' }[]
}

export interface GameIntelligence {
  gameId: string
  sport: string
  homeTeam: string
  awayTeam: string
  h2h: H2HState
  officials: OfficialsState
  splits: SplitsState
  props: PropsState
  trends: TrendsState
  teams: TeamsState
  schedule: ScheduleState
  summary: IntelligenceSummary
  refresh: () => Promise<void>
  isLoading: boolean
  lastUpdated: string | null
}

interface UseGameIntelligenceOptions {
  autoRefresh?: boolean
  refreshInterval?: number
  enabledSources?: {
    h2h?: boolean
    officials?: boolean
    splits?: boolean
    props?: boolean
    trends?: boolean
    teams?: boolean
    schedule?: boolean
  }
}

// =============================================================================
// DEFAULT VALUES
// =============================================================================

const DEFAULT_OPTIONS: UseGameIntelligenceOptions = {
  autoRefresh: false,
  refreshInterval: 60000,
  enabledSources: {
    h2h: true,
    officials: true,
    splits: true,
    props: true,
    trends: true,
    teams: true,
    schedule: true
  }
}

// =============================================================================
// MAIN HOOK
// =============================================================================

export function useGameIntelligence(
  gameId: string,
  sport: string,
  homeTeam: string,
  awayTeam: string,
  gameDate: string,
  options: UseGameIntelligenceOptions = {}
): GameIntelligence {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  const enabled = opts.enabledSources || DEFAULT_OPTIONS.enabledSources!
  
  // State for each data source
  const [h2hState, setH2hState] = useState<H2HState>({ 
    loading: false, data: null, trends: [], error: null 
  })
  
  const [officialsState, setOfficialsState] = useState<OfficialsState>({ 
    loading: false, data: null, implications: [], error: null 
  })
  
  const [splitsState, setSplitsState] = useState<SplitsState>({ 
    loading: false, data: null, isSharpPlay: false, error: null 
  })
  
  const [propsState, setPropsState] = useState<PropsState>({ 
    loading: false, data: [], valuePicks: [], error: null 
  })
  
  const [trendsState, setTrendsState] = useState<TrendsState>({ 
    loading: false, matches: [], topTrend: null, error: null 
  })
  
  const [teamsState, setTeamsState] = useState<TeamsState>({ 
    loading: false, comparison: null, error: null 
  })
  
  const [scheduleState, setScheduleState] = useState<ScheduleState>({ 
    loading: false, analysis: null, error: null 
  })
  
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)
  
  // Fetch H2H
  const fetchH2H = useCallback(async () => {
    if (!enabled.h2h) return
    setH2hState(prev => ({ ...prev, loading: true }))
    try {
      const data = await getH2HSummary(homeTeam, awayTeam, sport, 10)
      const rawTrends = await getH2HBettingTrends(homeTeam, awayTeam, sport)
      // Convert to expected format
      const trends = rawTrends ? [
        { type: 'spread', description: rawTrends.spreadTrend, confidence: 'medium' as const },
        { type: 'total', description: rawTrends.totalTrend, confidence: 'medium' as const },
        { type: 'home_away', description: rawTrends.homeAwayTrend, confidence: 'medium' as const },
        ...(rawTrends.notableStreak ? [{ type: 'streak', description: rawTrends.notableStreak, confidence: 'high' as const }] : [])
      ] : []
      setH2hState({ loading: false, data, trends, error: null })
    } catch (error) {
      setH2hState(prev => ({ 
        ...prev, 
        loading: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch H2H' 
      }))
    }
  }, [homeTeam, awayTeam, sport, enabled.h2h])
  
  // Fetch Officials
  const fetchOfficials = useCallback(async () => {
    if (!enabled.officials) return
    setOfficialsState(prev => ({ ...prev, loading: true }))
    try {
      const data = await getGameOfficials(gameId, sport)
      const implications = data?.bettingImplications ? [data.bettingImplications] : []
      setOfficialsState({ loading: false, data, implications, error: null })
    } catch (error) {
      setOfficialsState(prev => ({ 
        ...prev, 
        loading: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch officials' 
      }))
    }
  }, [gameId, sport, enabled.officials])
  
  // Fetch Splits
  const fetchSplits = useCallback(async () => {
    if (!enabled.splits) return
    setSplitsState(prev => ({ ...prev, loading: true }))
    try {
      const data = await getBettingSplits(gameId, sport)
      const sharpPlays = await getSharpPlays(sport)
      const thisGameSharp = sharpPlays.find(p => p.gameId === gameId)
      let sharpSide: 'home' | 'away' | undefined
      if (thisGameSharp) {
        const pick = thisGameSharp.pick.toLowerCase()
        if (pick.includes('home') || pick.includes(homeTeam.toLowerCase())) {
          sharpSide = 'home'
        } else if (pick.includes('away') || pick.includes(awayTeam.toLowerCase())) {
          sharpSide = 'away'
        }
      }
      setSplitsState({ 
        loading: false, 
        data, 
        isSharpPlay: !!thisGameSharp,
        sharpSide,
        error: null 
      })
    } catch (error) {
      setSplitsState(prev => ({ 
        ...prev, 
        loading: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch splits' 
      }))
    }
  }, [gameId, sport, homeTeam, awayTeam, enabled.splits])
  
  // Fetch Props
  const fetchProps = useCallback(async () => {
    if (!enabled.props) return
    setPropsState(prev => ({ ...prev, loading: true }))
    try {
      const data = await getGameProps(gameId, sport)
      const rawValuePicks = await getPropValuePicks(gameId)
      const valuePicks = rawValuePicks.map(pick => ({
        prop: pick.prop,
        edge: pick.edge === 'over' ? 1 : -1,
        factors: pick.reasons || []
      }))
      setPropsState({ loading: false, data, valuePicks, error: null })
    } catch (error) {
      setPropsState(prev => ({ 
        ...prev, 
        loading: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch props' 
      }))
    }
  }, [gameId, sport, enabled.props])
  
  // Fetch Trends
  const fetchTrends = useCallback(async () => {
    if (!enabled.trends) return
    setTrendsState(prev => ({ ...prev, loading: true }))
    try {
      const situation = {
        gameId,
        sport,
        homeTeam,
        awayTeam,
        spread: 0,
        total: 0,
        factors: {
          homeRestDays: scheduleState.analysis?.homeTeam?.daysRest || 7,
          awayRestDays: scheduleState.analysis?.awayTeam?.daysRest || 7,
          homeIsBackToBack: scheduleState.analysis?.homeTeam?.isBackToBack || false,
          awayIsBackToBack: scheduleState.analysis?.awayTeam?.isBackToBack || false,
          isDivisional: false,
          isConference: true,
          homeLastResult: null,
          awayLastResult: null,
          homeStreak: 0,
          awayStreak: 0,
          weekOfSeason: 1,
          isDome: false
        }
      }
      const matches = await matchGameToTrends(situation)
      setTrendsState({ 
        loading: false, 
        matches, 
        topTrend: matches[0] || null,
        error: null 
      })
    } catch (error) {
      setTrendsState(prev => ({ 
        ...prev, 
        loading: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch trends' 
      }))
    }
  }, [gameId, sport, homeTeam, awayTeam, scheduleState.analysis, enabled.trends])
  
  // Fetch Teams
  const fetchTeams = useCallback(async () => {
    if (!enabled.teams) return
    setTeamsState(prev => ({ ...prev, loading: true }))
    try {
      const comparison = await compareTeams(homeTeam, awayTeam, sport)
      setTeamsState({ loading: false, comparison, error: null })
    } catch (error) {
      setTeamsState(prev => ({ 
        ...prev, 
        loading: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch team stats' 
      }))
    }
  }, [homeTeam, awayTeam, sport, enabled.teams])
  
  // Fetch Schedule
  const fetchSchedule = useCallback(async () => {
    if (!enabled.schedule) return
    setScheduleState(prev => ({ ...prev, loading: true }))
    try {
      const analysis = await analyzeRestFactors(homeTeam, awayTeam, gameId, gameDate, sport)
      setScheduleState({ loading: false, analysis, error: null })
    } catch (error) {
      setScheduleState(prev => ({ 
        ...prev, 
        loading: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch schedule' 
      }))
    }
  }, [homeTeam, awayTeam, gameId, gameDate, sport, enabled.schedule])
  
  // Refresh all
  const refresh = useCallback(async () => {
    await Promise.all([
      fetchH2H(),
      fetchOfficials(),
      fetchSplits(),
      fetchProps(),
      fetchTeams(),
      fetchSchedule()
    ])
    await fetchTrends()
    setLastUpdated(new Date().toISOString())
  }, [fetchH2H, fetchOfficials, fetchSplits, fetchProps, fetchTrends, fetchTeams, fetchSchedule])
  
  // Initial fetch
  useEffect(() => {
    refresh()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  
  // Auto refresh
  useEffect(() => {
    if (!opts.autoRefresh) return
    const interval = setInterval(refresh, opts.refreshInterval)
    return () => clearInterval(interval)
  }, [opts.autoRefresh, opts.refreshInterval, refresh])
  
  // Calculate summary
  const summary = useMemo(() => {
    return calculateSummary(h2hState, splitsState, trendsState, teamsState, scheduleState)
  }, [h2hState, splitsState, trendsState, teamsState, scheduleState])
  
  const isLoading = h2hState.loading || officialsState.loading || splitsState.loading ||
    propsState.loading || trendsState.loading || teamsState.loading || scheduleState.loading
  
  return {
    gameId,
    sport,
    homeTeam,
    awayTeam,
    h2h: h2hState,
    officials: officialsState,
    splits: splitsState,
    props: propsState,
    trends: trendsState,
    teams: teamsState,
    schedule: scheduleState,
    summary,
    refresh,
    isLoading,
    lastUpdated
  }
}

// =============================================================================
// SUMMARY CALCULATION
// =============================================================================

function calculateSummary(
  h2h: H2HState,
  splits: SplitsState,
  trends: TrendsState,
  teams: TeamsState,
  schedule: ScheduleState
): IntelligenceSummary {
  const positiveFactors: IntelligenceSummary['positiveFactors'] = []
  const negativeFactors: IntelligenceSummary['negativeFactors'] = []
  const quickInsights: string[] = []
  const alerts: IntelligenceSummary['alerts'] = []
  
  let homeScore = 5
  let awayScore = 5
  
  // Process H2H
  if (h2h.data) {
    const h2hData = h2h.data
    if (h2hData.team1Wins > h2hData.team2Wins) {
      homeScore += 0.5
      positiveFactors.push({
        team: 'home',
        factor: `${h2hData.team1Wins}-${h2hData.team2Wins} H2H record`,
        category: 'H2H',
        weight: 0.5
      })
    } else if (h2hData.team2Wins > h2hData.team1Wins) {
      awayScore += 0.5
      positiveFactors.push({
        team: 'away',
        factor: `${h2hData.team2Wins}-${h2hData.team1Wins} H2H record`,
        category: 'H2H',
        weight: 0.5
      })
    }
  }
  
  // Process Splits
  if (splits.isSharpPlay) {
    const sharpSide = splits.sharpSide
    if (sharpSide === 'home') {
      homeScore += 1
      positiveFactors.push({
        team: 'home',
        factor: 'Sharp money indicator',
        category: 'Splits',
        weight: 1
      })
    } else if (sharpSide === 'away') {
      awayScore += 1
      positiveFactors.push({
        team: 'away',
        factor: 'Sharp money indicator',
        category: 'Splits',
        weight: 1
      })
    }
    alerts.push({
      type: 'sharp',
      message: `Sharp money detected on ${sharpSide} team`,
      importance: 'high'
    })
  }
  
  // Process Trends
  if (trends.topTrend) {
    const trend = trends.topTrend
    if (trend.trend.isStatisticallySignificant) {
      quickInsights.push(`${trend.trend.name}: ${trend.trend.winRate.toFixed(1)}% historical`)
      alerts.push({
        type: 'trend',
        message: trend.trend.recommendation,
        importance: trend.trend.confidenceLevel === 'high' ? 'high' : 'medium'
      })
    }
  }
  
  // Process Schedule/Rest
  if (schedule.analysis) {
    const rest = schedule.analysis
    
    if (rest.restEdge !== 'neutral' && rest.restEdgeMagnitude !== 'none') {
      const magnitude = rest.restEdgeMagnitude === 'significant' ? 1.5 :
                       rest.restEdgeMagnitude === 'moderate' ? 1 : 0.5
      
      if (rest.restEdge === 'home') {
        homeScore += magnitude
        positiveFactors.push({
          team: 'home',
          factor: `${rest.restEdgeMagnitude} rest advantage`,
          category: 'Schedule',
          weight: magnitude
        })
      } else {
        awayScore += magnitude
        positiveFactors.push({
          team: 'away',
          factor: `${rest.restEdgeMagnitude} rest advantage`,
          category: 'Schedule',
          weight: magnitude
        })
      }
      
      alerts.push({
        type: 'rest',
        message: rest.implications[0] || `${rest.restEdge} team has rest edge`,
        importance: rest.restEdgeMagnitude === 'significant' ? 'high' : 'medium'
      })
    }
    
    rest.situationalFactors.forEach(factor => {
      if (factor.impact === 'negative') {
        negativeFactors.push({
          team: factor.team,
          factor: factor.factor,
          category: 'Schedule',
          weight: factor.historicalEdge ? (50 - factor.historicalEdge) / 10 : 0.5
        })
      }
    })
  }
  
  // Process Team Comparison
  if (teams.comparison) {
    const comp = teams.comparison
    
    if (comp.offensiveEdge !== 'neutral') {
      const edgeTeam = comp.offensiveEdge
      if (edgeTeam === 'home') homeScore += 0.5
      else awayScore += 0.5
      
      positiveFactors.push({
        team: edgeTeam,
        factor: 'Offensive statistical edge',
        category: 'Stats',
        weight: 0.5
      })
    }
    
    comp.keyMatchupFactors.forEach(factor => {
      quickInsights.push(factor)
    })
    
    comp.bettingImplications.forEach(impl => {
      quickInsights.push(impl)
    })
  }
  
  // Calculate recommendation
  const scoreDiff = homeScore - awayScore
  let recommendedSide: 'home' | 'away' | 'pass' = 'pass'
  let confidence: 'high' | 'medium' | 'low' = 'low'
  
  if (Math.abs(scoreDiff) >= 3) {
    recommendedSide = scoreDiff > 0 ? 'home' : 'away'
    confidence = 'high'
  } else if (Math.abs(scoreDiff) >= 1.5) {
    recommendedSide = scoreDiff > 0 ? 'home' : 'away'
    confidence = 'medium'
  } else if (Math.abs(scoreDiff) >= 0.5) {
    recommendedSide = scoreDiff > 0 ? 'home' : 'away'
    confidence = 'low'
  }
  
  let recommendedBetType: IntelligenceSummary['recommendedBetType'] = 'pass'
  if (recommendedSide !== 'pass') {
    recommendedBetType = 'spread'
    if (trends.topTrend?.trend.betType === 'total') {
      recommendedBetType = 'total'
    }
  }
  
  return {
    homeEdgeRating: Math.min(10, Math.max(1, homeScore)),
    awayEdgeRating: Math.min(10, Math.max(1, awayScore)),
    recommendedSide,
    recommendedBetType,
    confidence,
    positiveFactors,
    negativeFactors,
    quickInsights: quickInsights.slice(0, 5),
    alerts: alerts.sort((a, b) => {
      const order: Record<string, number> = { high: 0, medium: 1, low: 2 }
      return order[a.importance] - order[b.importance]
    }).slice(0, 5)
  }
}

// =============================================================================
// CONVENIENCE HOOKS
// =============================================================================

export function useBettingSplits(gameId: string, sport: string) {
  const [splits, setSplits] = useState<BettingSplit | null>(null)
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    getBettingSplits(gameId, sport)
      .then(setSplits)
      .finally(() => setLoading(false))
  }, [gameId, sport])
  
  return { splits, loading }
}

export function useSharpPlays(sport: string) {
  const [plays, setPlays] = useState<SharpPlay[]>([])
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    getSharpPlays(sport)
      .then(setPlays)
      .finally(() => setLoading(false))
  }, [sport])
  
  return { plays, loading }
}

export function useTrendMatches(gameId: string, sport: string, homeTeam: string, awayTeam: string) {
  const [matches, setMatches] = useState<TrendMatch[]>([])
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    const situation = {
      gameId,
      sport,
      homeTeam,
      awayTeam,
      spread: 0,
      total: 0,
      factors: {
        homeRestDays: 7,
        awayRestDays: 7,
        homeIsBackToBack: false,
        awayIsBackToBack: false,
        isDivisional: false,
        isConference: true,
        homeLastResult: null,
        awayLastResult: null,
        homeStreak: 0,
        awayStreak: 0,
        weekOfSeason: 1,
        isDome: false
      }
    }
    
    matchGameToTrends(situation)
      .then(setMatches)
      .finally(() => setLoading(false))
  }, [gameId, sport, homeTeam, awayTeam])
  
  return { matches, loading }
}
