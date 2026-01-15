'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { 
  TrendingUp, Zap, Flame, ChevronDown, Target, 
  Users, Shield, BarChart3, DollarSign, Activity,
  ChevronUp, Trophy, Brain, AlertTriangle
} from 'lucide-react'
import { useMatchupData } from '@/hooks'
import { 
  MatchupLayout, 
  InjuryReport, 
  EdgeScoreCard, 
  GameInfo,
  MatchupPageSkeleton,
} from '@/components/matchup'
import ErrorDisplay from '@/components/matchup/ErrorDisplay'
import type { SportType } from '@/types/sports'

// Cache for AI analysis to prevent constant regeneration
const aiAnalysisCache = new Map<string, { analysis: string; timestamp: number; lineSnapshot: string }>()
const AI_CACHE_DURATION = 30 * 60 * 1000 // 30 minutes

interface TeamScheduleGame {
  week: number | string
  opponent: string
  result: 'W' | 'L' | 'T' | null
  score: string
  spread?: string
  atsResult?: 'W' | 'L' | 'P' | null
  total?: string
  ouResult?: 'O' | 'U' | 'P' | null
  isCompleted: boolean
}

interface TeamRankings {
  offenseRank: number
  defenseRank: number
  pointsPerGame: number
  pointsAllowedPerGame: number
}

interface BettingSplitData {
  spreadTicketPct: number
  spreadMoneyPct: number
  totalTicketPct: number
  totalMoneyPct: number
  lineMovement: string
  isRLM: boolean // Reverse Line Movement
}

export default function GameMatchupPage({ params }: { params: Promise<{ gameId: string }> }) {
  const { gameId } = use(params)
  const sport: SportType = 'nfl'
  
  // Core matchup data from hook
  const { 
    game, 
    analytics, 
    isLoading, 
    error, 
    refresh,
    topPick,
    bettingIntelligence,
    h2h,
    edgeScore,
    trends,
  } = useMatchupData(gameId, sport)
  
  const [activeTab, setActiveTab] = useState('overview')
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  
  // Additional real-time data
  const [bettingSplits, setBettingSplits] = useState<BettingSplitData | null>(null)
  const [homeSchedule, setHomeSchedule] = useState<TeamScheduleGame[]>([])
  const [awaySchedule, setAwaySchedule] = useState<TeamScheduleGame[]>([])
  const [homeRankings, setHomeRankings] = useState<TeamRankings | null>(null)
  const [awayRankings, setAwayRankings] = useState<TeamRankings | null>(null)
  const [homeTeamTrends, setHomeTeamTrends] = useState<any[]>([])
  const [awayTeamTrends, setAwayTeamTrends] = useState<any[]>([])
  const [aiAnalysis, setAiAnalysis] = useState<string>('')
  const [loadingExtras, setLoadingExtras] = useState(true)
  
  // Collapsible sections
  const [expandedSections, setExpandedSections] = useState({
    h2h: true,
    homeSchedule: true,
    awaySchedule: false,
    trends: true,
    ai: true
  })

  // Fetch betting splits and additional data
  useEffect(() => {
    if (!game) return
    
    const fetchBettingData = async () => {
      try {
        // Fetch betting splits from Action Network
        const splitsRes = await fetch(`/api/betting-splits?sport=NFL`)
        if (splitsRes.ok) {
          const splitsData = await splitsRes.json()
          // Find splits for this specific game
          const gameSplits = splitsData.data?.splits?.find((s: any) => 
            s.homeTeam?.toLowerCase().includes(game.homeTeam.name.toLowerCase()) ||
            s.awayTeam?.toLowerCase().includes(game.awayTeam.name.toLowerCase())
          )
          
          if (gameSplits) {
            const openSpread = gameSplits.openSpread || game.odds?.spread || 0
            const currentSpread = gameSplits.currentSpread || game.odds?.spread || 0
            const lineMove = currentSpread - openSpread
            
            setBettingSplits({
              spreadTicketPct: gameSplits.spreadTicketPct || 50,
              spreadMoneyPct: gameSplits.spreadMoneyPct || 50,
              totalTicketPct: gameSplits.totalTicketPct || 50,
              totalMoneyPct: gameSplits.totalMoneyPct || 50,
              lineMovement: lineMove > 0 ? `+${lineMove.toFixed(1)}` : lineMove.toFixed(1),
              isRLM: Math.abs(gameSplits.spreadTicketPct - gameSplits.spreadMoneyPct) > 15
            })
          }
        }
      } catch (err) {
        console.error('Failed to fetch betting splits:', err)
      }
    }
    
    const fetchTeamSchedules = async () => {
      try {
        const homeAbbr = game.homeTeam.abbreviation
        const awayAbbr = game.awayTeam.abbreviation
        
        // Fetch home team schedule
        const homeRes = await fetch(`/api/team/${sport}/${homeAbbr}/schedule?limit=10`)
        if (homeRes.ok) {
          const homeData = await homeRes.json()
          setHomeSchedule(homeData.games || [])
        }
        
        // Fetch away team schedule
        const awayRes = await fetch(`/api/team/${sport}/${awayAbbr}/schedule?limit=10`)
        if (awayRes.ok) {
          const awayData = await awayRes.json()
          setAwaySchedule(awayData.games || [])
        }
      } catch (err) {
        console.error('Failed to fetch schedules:', err)
      }
    }
    
    const fetchRankings = async () => {
      try {
        // Fetch standings which include rankings
        const standingsRes = await fetch(`/api/standings?sport=NFL`)
        if (standingsRes.ok) {
          const standings = await standingsRes.json()
          
          // Find teams in standings
          const homeTeamStanding = standings.standings?.find((t: any) => 
            t.abbreviation === game.homeTeam.abbreviation
          )
          const awayTeamStanding = standings.standings?.find((t: any) => 
            t.abbreviation === game.awayTeam.abbreviation
          )
          
          if (homeTeamStanding) {
            setHomeRankings({
              offenseRank: homeTeamStanding.offenseRank || 0,
              defenseRank: homeTeamStanding.defenseRank || 0,
              pointsPerGame: homeTeamStanding.pointsFor / (homeTeamStanding.wins + homeTeamStanding.losses) || 0,
              pointsAllowedPerGame: homeTeamStanding.pointsAgainst / (homeTeamStanding.wins + homeTeamStanding.losses) || 0,
            })
          }
          
          if (awayTeamStanding) {
            setAwayRankings({
              offenseRank: awayTeamStanding.offenseRank || 0,
              defenseRank: awayTeamStanding.defenseRank || 0,
              pointsPerGame: awayTeamStanding.pointsFor / (awayTeamStanding.wins + awayTeamStanding.losses) || 0,
              pointsAllowedPerGame: awayTeamStanding.pointsAgainst / (awayTeamStanding.wins + awayTeamStanding.losses) || 0,
            })
          }
        }
      } catch (err) {
        console.error('Failed to fetch rankings:', err)
      }
    }
    
    const fetchTeamTrends = async () => {
      try {
        // Fetch betting trends for both teams
        const trendsRes = await fetch(`/api/trends?sport=NFL&team=${game.homeTeam.abbreviation}`)
        if (trendsRes.ok) {
          const trendsData = await trendsRes.json()
          setHomeTeamTrends(trendsData.trends?.slice(0, 5) || [])
        }
        
        const awayTrendsRes = await fetch(`/api/trends?sport=NFL&team=${game.awayTeam.abbreviation}`)
        if (awayTrendsRes.ok) {
          const awayTrendsData = await awayTrendsRes.json()
          setAwayTeamTrends(awayTrendsData.trends?.slice(0, 5) || [])
        }
      } catch (err) {
        console.error('Failed to fetch trends:', err)
      }
    }
    
    const fetchAIAnalysis = async () => {
      // Create a snapshot of current line state
      const lineSnapshot = `${game.odds?.spread || 0}-${game.odds?.total || 0}`
      
      // Check cache first
      const cached = aiAnalysisCache.get(gameId)
      if (cached && Date.now() - cached.timestamp < AI_CACHE_DURATION && cached.lineSnapshot === lineSnapshot) {
        setAiAnalysis(cached.analysis)
        return
      }
      
      try {
        const aiRes = await fetch(`/api/ai/game-analysis?gameId=${gameId}&sport=NFL`)
        if (aiRes.ok) {
          const aiData = await aiRes.json()
          const analysis = aiData.analysis || aiData.aiAnalysis || ''
          
          // Cache the result with line snapshot
          aiAnalysisCache.set(gameId, {
            analysis,
            timestamp: Date.now(),
            lineSnapshot
          })
          
          setAiAnalysis(analysis)
        }
      } catch (err) {
        // Use default analysis if AI not available
        setAiAnalysis('AI analysis calculates edges based on historical trends, betting patterns, and matchup data.')
      }
    }
    
    // Fetch all data in parallel
    Promise.all([
      fetchBettingData(),
      fetchTeamSchedules(),
      fetchRankings(),
      fetchTeamTrends(),
      fetchAIAnalysis()
    ]).finally(() => setLoadingExtras(false))
    
  }, [game, gameId, sport])
  
  const handleRefresh = () => {
    refresh()
    setLastUpdated(new Date())
  }

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }))
  }

  if (isLoading && !game) {
    return <MatchupPageSkeleton />
  }

  if (error || !game) {
    return (
      <ErrorDisplay
        variant="full"
        title="Game Not Found"
        message="This NFL game couldn't be found. It may have been rescheduled or cancelled."
        backLink="/nfl/matchups"
        backText="Back to NFL matchups"
        showRetry={false}
      />
    )
  }

  // Build betting metrics from real data
  const bettingMetrics = [
    { 
      label: 'Line Movement', 
      value: bettingSplits?.lineMovement || bettingIntelligence?.lineMovement || 'No movement data',
      sub: bettingSplits?.lineMovement === '0.0' ? '— No Movement' : undefined,
      color: bettingSplits?.lineMovement?.startsWith('-') ? 'text-red-400' : 
             bettingSplits?.lineMovement?.startsWith('+') ? 'text-green-400' : 'text-gray-400'
    },
    { 
      label: 'Public %', 
      value: bettingSplits ? `${bettingSplits.spreadTicketPct}%` : `${bettingIntelligence?.publicPct || 0}%`,
      sub: bettingSplits?.spreadTicketPct && bettingSplits.spreadTicketPct > 50 
        ? game.homeTeam.abbreviation 
        : game.awayTeam.abbreviation
    },
    { 
      label: 'Sharp Action', 
      value: bettingSplits ? `${bettingSplits.spreadMoneyPct}%` : '',
      color: bettingSplits?.spreadMoneyPct && bettingSplits.spreadMoneyPct > 60 ? 'text-green-400' : 'text-white',
      sub: bettingSplits?.isRLM ? '⚠️ RLM' : undefined
    },
    { 
      label: 'Handle %', 
      value: bettingSplits ? `${bettingSplits.totalMoneyPct}%` : `${bettingIntelligence?.handlePct || 0}%`,
      color: 'text-white' 
    },
  ]

  return (
    <MatchupLayout
      sport={sport}
      game={game}
      analytics={analytics}
      isLoading={isLoading}
      lastUpdated={lastUpdated}
      onRefresh={handleRefresh}
      activeTab={activeTab}
      onTabChange={setActiveTab}
    >
      <MatchupLayout.Grid>
        {/* Main Content */}
        <MatchupLayout.MainContent>
          {/* Key Betting Metrics */}
          <div className="bg-[#0c0c14] rounded-xl border border-white/10 p-6">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-400" />
              Key Betting Metrics
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {bettingMetrics.map((m) => (
                <div 
                  key={m.label} 
                  className="bg-[#16161e] rounded-lg p-4 text-center"
                >
                  <div className="text-xs text-gray-500 mb-2">{m.label}</div>
                  <div className={`text-2xl font-bold ${m.color || 'text-white'}`}>{m.value}</div>
                  {m.sub && <div className="text-xs text-gray-500 mt-1">{m.sub}</div>}
                </div>
              ))}
            </div>
            
            {/* Reverse Line Movement Indicator */}
            {(bettingSplits?.isRLM || bettingIntelligence?.reverseLineMovement) && (
              <div className="mt-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-400" />
                  <span className="text-amber-400 text-sm font-semibold">Reverse Line Movement Detected</span>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  Line moving opposite to public betting percentage - possible sharp action on {
                    bettingSplits && bettingSplits.spreadTicketPct > 50 ? game.awayTeam.abbreviation : game.homeTeam.abbreviation
                  }
                </p>
              </div>
            )}
          </div>

          {/* Team Rankings Comparison */}
          <div className="bg-[#0c0c14] rounded-xl border border-white/10 p-6">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-400" />
              Team Rankings Comparison
            </h3>
            <div className="grid grid-cols-2 gap-6">
              {/* Offense Rankings */}
              <div>
                <div className="flex items-center gap-2 mb-3 text-sm text-orange-400 font-semibold">
                  <Zap className="w-4 h-4" /> OFFENSE
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center p-3 bg-[#16161e] rounded-lg">
                    <span className="text-gray-300">{game.homeTeam.abbreviation}</span>
                    <span className="text-xl font-bold text-green-400">
                      #{homeRankings?.offenseRank || '—'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-[#16161e] rounded-lg">
                    <span className="text-gray-300">{game.awayTeam.abbreviation}</span>
                    <span className="text-xl font-bold text-green-400">
                      #{awayRankings?.offenseRank || '—'}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Defense Rankings */}
              <div>
                <div className="flex items-center gap-2 mb-3 text-sm text-blue-400 font-semibold">
                  <Shield className="w-4 h-4" /> DEFENSE
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center p-3 bg-[#16161e] rounded-lg">
                    <span className="text-gray-300">{game.homeTeam.abbreviation}</span>
                    <span className="text-xl font-bold text-green-400">
                      #{homeRankings?.defenseRank || '—'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-[#16161e] rounded-lg">
                    <span className="text-gray-300">{game.awayTeam.abbreviation}</span>
                    <span className="text-xl font-bold text-green-400">
                      #{awayRankings?.defenseRank || '—'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Head-to-Head History */}
          <div className="bg-[#0c0c14] rounded-xl border border-white/10 overflow-hidden">
            <button
              onClick={() => toggleSection('h2h')}
              className="w-full p-6 flex items-center justify-between hover:bg-white/5 transition-colors"
            >
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-400" />
                Head-to-Head History
              </h3>
              {expandedSections.h2h ? (
                <ChevronUp className="w-5 h-5 text-gray-500" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-500" />
              )}
            </button>
            
            {expandedSections.h2h && (
              <div className="px-6 pb-6">
                {h2h && h2h.gamesPlayed > 0 ? (
                  <>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="text-center p-3 bg-[#16161e] rounded-lg">
                        <div className="text-2xl font-bold text-white">{h2h.gamesPlayed}</div>
                        <div className="text-xs text-gray-500">Games Played</div>
                      </div>
                      <div className="text-center p-3 bg-[#16161e] rounded-lg">
                        <div className="text-2xl font-bold text-orange-400">{h2h.homeATSRecord}</div>
                        <div className="text-xs text-gray-500">{game.homeTeam.abbreviation} ATS</div>
                      </div>
                      <div className="text-center p-3 bg-[#16161e] rounded-lg">
                        <div className="text-2xl font-bold text-blue-400">{h2h.overUnderRecord}</div>
                        <div className="text-xs text-gray-500">O/U Record</div>
                      </div>
                      <div className="text-center p-3 bg-[#16161e] rounded-lg">
                        <div className="text-2xl font-bold text-green-400">{h2h.avgTotal?.toFixed(1) || '—'}</div>
                        <div className="text-xs text-gray-500">Avg Total</div>
                      </div>
                    </div>
                    
                    {/* Recent H2H Games */}
                    {h2h && 'recentGames' in h2h && Array.isArray((h2h as any).recentGames) && (h2h as any).recentGames.length > 0 && (
                      <div className="mt-4">
                        <div className="text-sm text-gray-400 mb-2">Recent Meetings</div>
                        <div className="space-y-2">
                          {(h2h as any).recentGames.slice(0, 5).map((g: any, i: number) => (
                            <div key={i} className="flex justify-between items-center p-2 bg-[#16161e] rounded text-sm">
                              <span className="text-gray-400">{new Date(g.date).toLocaleDateString()}</span>
                              <span className="text-white font-medium">{g.homeScore}-{g.awayScore}</span>
                              <span className={g.spreadResult === 'home_cover' ? 'text-green-400' : 'text-red-400'}>
                                {g.spreadResult === 'home_cover' ? 'HOME' : 'AWAY'} cover
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center text-gray-500 py-4">
                    No recent head-to-head matchups found
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Home Team Last 10 Games */}
          <div className="bg-[#0c0c14] rounded-xl border border-white/10 overflow-hidden">
            <button
              onClick={() => toggleSection('homeSchedule')}
              className="w-full p-6 flex items-center justify-between hover:bg-white/5 transition-colors"
            >
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-400" />
                {game.homeTeam.name} - Last 10 Games
              </h3>
              {expandedSections.homeSchedule ? (
                <ChevronUp className="w-5 h-5 text-gray-500" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-500" />
              )}
            </button>
            
            {expandedSections.homeSchedule && (
              <div className="px-6 pb-6">
                {homeSchedule.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-gray-500 border-b border-white/10">
                          <th className="text-left py-2 px-2">Wk</th>
                          <th className="text-left py-2 px-2">Opponent</th>
                          <th className="text-center py-2 px-2">Result</th>
                          <th className="text-center py-2 px-2">Score</th>
                          <th className="text-center py-2 px-2">Spread</th>
                          <th className="text-center py-2 px-2">ATS</th>
                          <th className="text-center py-2 px-2">Total</th>
                          <th className="text-center py-2 px-2">O/U</th>
                        </tr>
                      </thead>
                      <tbody>
                        {homeSchedule.map((g, i) => (
                          <tr key={i} className="border-b border-white/5">
                            <td className="py-2 px-2 text-gray-400">{g.week}</td>
                            <td className="py-2 px-2 text-white">{g.opponent}</td>
                            <td className="py-2 px-2 text-center">
                              {g.result && (
                                <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                                  g.result === 'W' ? 'bg-green-500/20 text-green-400' : 
                                  g.result === 'L' ? 'bg-red-500/20 text-red-400' : 
                                  'bg-gray-500/20 text-gray-400'
                                }`}>
                                  {g.result}
                                </span>
                              )}
                            </td>
                            <td className="py-2 px-2 text-center text-white">{g.score || 'TBD'}</td>
                            <td className="py-2 px-2 text-center text-gray-400">{g.spread || '—'}</td>
                            <td className="py-2 px-2 text-center">
                              {g.atsResult ? (
                                <span className={g.atsResult === 'W' ? 'text-green-400' : g.atsResult === 'L' ? 'text-red-400' : 'text-gray-400'}>
                                  {g.atsResult}
                                </span>
                              ) : '—'}
                            </td>
                            <td className="py-2 px-2 text-center text-gray-400">{g.total || '—'}</td>
                            <td className="py-2 px-2 text-center">
                              {g.ouResult ? (
                                <span className={g.ouResult === 'O' ? 'text-green-400' : g.ouResult === 'U' ? 'text-blue-400' : 'text-gray-400'}>
                                  {g.ouResult}
                                </span>
                              ) : '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <p className="text-xs text-gray-500 mt-3">
                      📊 Game data from ESPN. ATS/O-U data requires betting integration.
                    </p>
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-4">
                    Loading schedule data...
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Away Team Last 10 Games */}
          <div className="bg-[#0c0c14] rounded-xl border border-white/10 overflow-hidden">
            <button
              onClick={() => toggleSection('awaySchedule')}
              className="w-full p-6 flex items-center justify-between hover:bg-white/5 transition-colors"
            >
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-400" />
                {game.awayTeam.name} - Last 10 Games
              </h3>
              {expandedSections.awaySchedule ? (
                <ChevronUp className="w-5 h-5 text-gray-500" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-500" />
              )}
            </button>
            
            {expandedSections.awaySchedule && (
              <div className="px-6 pb-6">
                {awaySchedule.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-gray-500 border-b border-white/10">
                          <th className="text-left py-2 px-2">Wk</th>
                          <th className="text-left py-2 px-2">Opponent</th>
                          <th className="text-center py-2 px-2">Result</th>
                          <th className="text-center py-2 px-2">Score</th>
                          <th className="text-center py-2 px-2">Spread</th>
                          <th className="text-center py-2 px-2">ATS</th>
                          <th className="text-center py-2 px-2">Total</th>
                          <th className="text-center py-2 px-2">O/U</th>
                        </tr>
                      </thead>
                      <tbody>
                        {awaySchedule.map((g, i) => (
                          <tr key={i} className="border-b border-white/5">
                            <td className="py-2 px-2 text-gray-400">{g.week}</td>
                            <td className="py-2 px-2 text-white">{g.opponent}</td>
                            <td className="py-2 px-2 text-center">
                              {g.result && (
                                <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                                  g.result === 'W' ? 'bg-green-500/20 text-green-400' : 
                                  g.result === 'L' ? 'bg-red-500/20 text-red-400' : 
                                  'bg-gray-500/20 text-gray-400'
                                }`}>
                                  {g.result}
                                </span>
                              )}
                            </td>
                            <td className="py-2 px-2 text-center text-white">{g.score || 'TBD'}</td>
                            <td className="py-2 px-2 text-center text-gray-400">{g.spread || '—'}</td>
                            <td className="py-2 px-2 text-center">
                              {g.atsResult ? (
                                <span className={g.atsResult === 'W' ? 'text-green-400' : g.atsResult === 'L' ? 'text-red-400' : 'text-gray-400'}>
                                  {g.atsResult}
                                </span>
                              ) : '—'}
                            </td>
                            <td className="py-2 px-2 text-center text-gray-400">{g.total || '—'}</td>
                            <td className="py-2 px-2 text-center">
                              {g.ouResult ? (
                                <span className={g.ouResult === 'O' ? 'text-green-400' : g.ouResult === 'U' ? 'text-blue-400' : 'text-gray-400'}>
                                  {g.ouResult}
                                </span>
                              ) : '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <p className="text-xs text-gray-500 mt-3">
                      📊 Game data from ESPN. ATS/O-U data requires betting integration.
                    </p>
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-4">
                    Loading schedule data...
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Betting Trends - Only show if we have trends OR matched system trends */}
          {(homeTeamTrends.length > 0 || awayTeamTrends.length > 0 || (trends && trends.matched > 0)) && (
          <div className="bg-[#0c0c14] rounded-xl border border-white/10 overflow-hidden">
            <button
              onClick={() => toggleSection('trends')}
              className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors"
            >
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-orange-500" />
                Betting Trends
                {trends && trends.matched > 0 && (
                  <span className="text-xs px-2 py-0.5 bg-orange-500/20 text-orange-400 rounded">{trends.matched} matched</span>
                )}
              </h3>
              {expandedSections.trends ? (
                <ChevronUp className="w-4 h-4 text-gray-500" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-500" />
              )}
            </button>
            
            {expandedSections.trends && (
              <div className="px-4 pb-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Home Team Trends */}
                  <div>
                    <div className="flex items-center gap-2 mb-2 text-xs text-yellow-400 font-semibold">
                      <Trophy className="w-3 h-3" /> {game.homeTeam.abbreviation} TRENDS
                    </div>
                    <div className="space-y-1.5">
                      {homeTeamTrends.length > 0 ? (
                        homeTeamTrends.map((trend, i) => (
                          <div key={i} className="p-2 bg-[#16161e] rounded text-xs">
                            <div className="text-gray-300">{trend.description || trend.text || trend.name}</div>
                            {trend.record && (
                              <div className="text-[10px] text-gray-500 mt-0.5">Record: {trend.record}</div>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="text-gray-500 text-xs">No team-specific trends</div>
                      )}
                    </div>
                  </div>
                  
                  {/* Away Team Trends */}
                  <div>
                    <div className="flex items-center gap-2 mb-2 text-xs text-yellow-400 font-semibold">
                      <Trophy className="w-3 h-3" /> {game.awayTeam.abbreviation} TRENDS
                    </div>
                    <div className="space-y-1.5">
                      {awayTeamTrends.length > 0 ? (
                        awayTeamTrends.map((trend, i) => (
                          <div key={i} className="p-2 bg-[#16161e] rounded text-xs">
                            <div className="text-gray-300">{trend.description || trend.text || trend.name}</div>
                            {trend.record && (
                              <div className="text-[10px] text-gray-500 mt-0.5">Record: {trend.record}</div>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="text-gray-500 text-xs">No team-specific trends</div>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Matched Trends from Analytics */}
                {trends && trends.matched > 0 && trends.spreadTrends && (
                  <div className="mt-4 pt-3 border-t border-white/10">
                    <div className="text-xs text-gray-400 mb-2">
                      📊 {trends.matched} Matched System Trends
                    </div>
                    <div className="space-y-1.5">
                      {trends.spreadTrends.slice(0, 5).map((trend: any, i: number) => (
                        <Link 
                          key={i} 
                          href={`/trends?sport=${sport}&team=${game.homeTeam.abbreviation}`}
                          className="flex items-center justify-between p-2 bg-[#16161e] rounded hover:bg-white/10 transition-colors group text-xs"
                        >
                          <span className="text-gray-300 group-hover:text-white transition-colors">
                            {trend.description || trend.text}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className={`font-bold ${trend.confidence >= 70 ? 'text-green-400' : 'text-amber-400'}`}>
                              {trend.confidence}%
                            </span>
                            {trend.edge && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-500/20 text-green-400">
                                +{trend.edge}% edge
                              </span>
                            )}
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          )}

          {/* AI Analysis - Only show when we have actual analysis OR a top pick */}
          {(aiAnalysis && aiAnalysis !== 'AI analysis requires Gemini API integration. Real-time analysis coming soon.') || topPick ? (
          <div className="bg-gradient-to-br from-[#0c0c14] to-orange-500/5 rounded-xl border border-orange-500/20 overflow-hidden">
            <button
              onClick={() => toggleSection('ai')}
              className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors"
            >
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Brain className="w-4 h-4 text-orange-400" />
                AI Analysis
              </h3>
              {expandedSections.ai ? (
                <ChevronUp className="w-4 h-4 text-gray-500" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-500" />
              )}
            </button>
            
            {expandedSections.ai && (
              <div className="px-4 pb-4">
                {aiAnalysis && aiAnalysis !== 'AI analysis requires Gemini API integration. Real-time analysis coming soon.' ? (
                  <div className="space-y-3">
                    <p className="text-gray-300 leading-relaxed text-sm">{aiAnalysis}</p>
                    
                    {/* Top Pick from AI */}
                    {topPick && (
                      <div className="mt-3 p-3 bg-gradient-to-r from-orange-500/10 to-transparent rounded border border-orange-500/30">
                        <div className="text-base font-bold text-orange-400">{topPick.selection}</div>
                        <div className="text-xs text-gray-400 mt-1">
                          {topPick.confidence}% confidence • {topPick.supportingTrends} supporting trends
                        </div>
                      </div>
                    )}
                    
                    {/* Cache indicator */}
                    <div className="text-[10px] text-gray-600 mt-2">
                      Analysis cached for 30 minutes. Updates on significant line movement or injury changes.
                    </div>
                  </div>
                ) : topPick ? (
                  <div className="p-3 bg-gradient-to-r from-orange-500/10 to-transparent rounded border border-orange-500/30">
                    <div className="text-base font-bold text-orange-400">{topPick.selection}</div>
                    <div className="text-xs text-gray-400 mt-1">
                      {topPick.confidence}% confidence • {topPick.supportingTrends} supporting trends
                    </div>
                  </div>
                ) : null}
              </div>
            )}
          </div>
          ) : null}
        </MatchupLayout.MainContent>

        {/* Sidebar */}
        <MatchupLayout.Sidebar>
          {/* Edge Score Card */}
          {edgeScore && edgeScore.overall > 0 && (
            <EdgeScoreCard 
              edgeScore={edgeScore}
              gameId={gameId}
            />
          )}

          {/* Injury Report */}
          <InjuryReport 
            sport={sport} 
            homeTeam={game.homeTeam.abbreviation} 
            awayTeam={game.awayTeam.abbreviation}
            homeTeamFull={game.homeTeam.name}
            awayTeamFull={game.awayTeam.name}
          />

          {/* Game Info */}
          <GameInfo 
            game={game}
            showWeather={true}
          />

          {/* Quick Links */}
          <div className="space-y-2">
            <Link 
              href="/trends?sport=nfl"
              className="flex items-center justify-between p-4 bg-[#0c0c14] rounded-xl border border-white/10 hover:border-orange-500/30 transition-all group"
            >
              <div className="flex items-center gap-3">
                <TrendingUp className="w-5 h-5 text-orange-500" />
                <span className="text-white font-medium group-hover:text-orange-400 transition-colors">
                  View All NFL Trends
                </span>
              </div>
              <ChevronDown className="w-5 h-5 text-gray-500 -rotate-90" />
            </Link>
            <Link 
              href="/markets/edge"
              className="flex items-center justify-between p-4 bg-[#0c0c14] rounded-xl border border-white/10 hover:border-orange-500/30 transition-all group"
            >
              <div className="flex items-center gap-3">
                <Flame className="w-5 h-5 text-red-500" />
                <span className="text-white font-medium group-hover:text-orange-400 transition-colors">
                  The Edge - Sharp Signals
                </span>
              </div>
              <ChevronDown className="w-5 h-5 text-gray-500 -rotate-90" />
            </Link>
          </div>
        </MatchupLayout.Sidebar>
      </MatchupLayout.Grid>
    </MatchupLayout>
  )
}
