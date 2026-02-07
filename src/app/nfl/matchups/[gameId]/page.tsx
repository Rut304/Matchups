'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { 
  TrendingUp, Zap, Flame, ChevronDown, 
  Users, Shield, BarChart3, DollarSign,
  ChevronUp, Brain, AlertTriangle, Calendar, ExternalLink, Cloud
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

const aiAnalysisCache = new Map<string, { analysis: string; timestamp: number; lineSnapshot: string }>()
const AI_CACHE_DURATION = 30 * 60 * 1000

interface TeamScheduleGame {
  week: number | string
  opponent: string
  result: 'W' | 'L' | 'T' | null
  score: string
  isCompleted: boolean
}

interface TeamRankings {
  offenseRank: number
  offenseYPG: number
  defenseRank: number
  defenseYPG: number
}

interface BettingSplitData {
  spreadTicketPct: number
  spreadMoneyPct: number
  lineMovement: string
  isRLM: boolean
}

interface InjuryData {
  name: string
  position: string
  status: string
  impact: 'high' | 'medium' | 'low'
}

export default function GameMatchupPage({ params }: { params: Promise<{ gameId: string }> }) {
  const { gameId } = use(params)
  const sport: SportType = 'nfl'
  
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
  const [bettingSplits, setBettingSplits] = useState<BettingSplitData | null>(null)
  const [homeSchedule, setHomeSchedule] = useState<TeamScheduleGame[]>([])
  const [awaySchedule, setAwaySchedule] = useState<TeamScheduleGame[]>([])
  const [homeRankings, setHomeRankings] = useState<TeamRankings | null>(null)
  const [awayRankings, setAwayRankings] = useState<TeamRankings | null>(null)
  const [injuries, setInjuries] = useState<{ home: InjuryData[]; away: InjuryData[] }>({ home: [], away: [] })
  const [weather, setWeather] = useState<{ temp?: number; condition?: string; wind?: string } | null>(null)
  const [aiAnalysis, setAiAnalysis] = useState<string>('')
  
  const [expandedSections, setExpandedSections] = useState({
    h2h: true,
    trends: true,
    ai: true
  })

  useEffect(() => {
    if (!game) return
    
    const fetchAll = async () => {
      const homeAbbr = game.homeTeam.abbreviation
      const awayAbbr = game.awayTeam.abbreviation
      
      const fetchRankings = async () => {
        try {
          const res = await fetch('/api/team-stats?sport=nfl&type=rankings')
          if (res.ok) {
            const data = await res.json()
            const homeOff = data.rankings?.offense?.find((t: any) => t.teamAbbrev === homeAbbr)
            const homeDef = data.rankings?.defense?.find((t: any) => t.teamAbbrev === homeAbbr)
            const awayOff = data.rankings?.offense?.find((t: any) => t.teamAbbrev === awayAbbr)
            const awayDef = data.rankings?.defense?.find((t: any) => t.teamAbbrev === awayAbbr)
            
            if (homeOff || homeDef) {
              setHomeRankings({
                offenseRank: homeOff?.rank || 0,
                offenseYPG: homeOff?.value || 0,
                defenseRank: homeDef?.rank || 0,
                defenseYPG: homeDef?.value || 0,
              })
            }
            if (awayOff || awayDef) {
              setAwayRankings({
                offenseRank: awayOff?.rank || 0,
                offenseYPG: awayOff?.value || 0,
                defenseRank: awayDef?.rank || 0,
                defenseYPG: awayDef?.value || 0,
              })
            }
          }
        } catch (err) {
          console.error('Failed to fetch rankings:', err)
        }
      }
      
      const fetchSchedules = async () => {
        try {
          const [homeRes, awayRes] = await Promise.all([
            fetch(`/api/team/${sport}/${homeAbbr}/schedule?limit=5`),
            fetch(`/api/team/${sport}/${awayAbbr}/schedule?limit=5`)
          ])
          if (homeRes.ok) {
            const data = await homeRes.json()
            setHomeSchedule(data.games?.slice(0, 5) || [])
          }
          if (awayRes.ok) {
            const data = await awayRes.json()
            setAwaySchedule(data.games?.slice(0, 5) || [])
          }
        } catch (err) {
          console.error('Failed to fetch schedules:', err)
        }
      }
      
      const fetchSplits = async () => {
        try {
          const res = await fetch('/api/betting-splits?sport=NFL')
          if (res.ok) {
            const data = await res.json()
            const gameSplits = data.data?.splits?.find((s: any) => 
              s.homeTeam?.toLowerCase().includes(game.homeTeam.name.toLowerCase()) ||
              s.awayTeam?.toLowerCase().includes(game.awayTeam.name.toLowerCase())
            )
            if (gameSplits) {
              const lineMove = (gameSplits.currentSpread || game.odds?.spread || 0) - (gameSplits.openSpread || game.odds?.spread || 0)
              setBettingSplits({
                spreadTicketPct: gameSplits.spreadTicketPct || 50,
                spreadMoneyPct: gameSplits.spreadMoneyPct || 50,
                lineMovement: lineMove > 0 ? `+${lineMove.toFixed(1)}` : lineMove.toFixed(1),
                isRLM: Math.abs((gameSplits.spreadTicketPct || 50) - (gameSplits.spreadMoneyPct || 50)) > 15
              })
            }
          }
        } catch (err) {
          console.error('Failed to fetch splits:', err)
        }
      }
      
      const fetchInjuries = async () => {
        try {
          const res = await fetch(`/api/injuries?sport=NFL&team=${homeAbbr},${awayAbbr}`)
          if (res.ok) {
            const data = await res.json()
            const homeInj = data.injuries?.filter((i: any) => i.team === homeAbbr)?.slice(0, 3) || []
            const awayInj = data.injuries?.filter((i: any) => i.team === awayAbbr)?.slice(0, 3) || []
            setInjuries({ 
              home: homeInj.map((i: any) => ({ name: i.name, position: i.position, status: i.status, impact: i.impact || 'medium' })),
              away: awayInj.map((i: any) => ({ name: i.name, position: i.position, status: i.status, impact: i.impact || 'medium' }))
            })
          }
        } catch (err) {
          console.error('Failed to fetch injuries:', err)
        }
      }
      
      const fetchWeather = async () => {
        try {
          const res = await fetch(`/api/weather?gameId=${gameId}&sport=nfl`)
          if (res.ok) {
            const data = await res.json()
            if (data.weather) setWeather(data.weather)
          }
        } catch (err) { /* optional */ }
      }
      
      const generateAIAnalysis = async () => {
        const lineSnapshot = `${game.odds?.spread || 0}-${game.odds?.total || 0}`
        const cached = aiAnalysisCache.get(gameId)
        
        if (cached && Date.now() - cached.timestamp < AI_CACHE_DURATION && cached.lineSnapshot === lineSnapshot) {
          setAiAnalysis(cached.analysis)
          return
        }
        
        try {
          const res = await fetch(`/api/ai/game-analysis?gameId=${gameId}&sport=NFL`)
          if (res.ok) {
            const data = await res.json()
            const analysis = data.analysis || data.aiAnalysis || ''
            aiAnalysisCache.set(gameId, { analysis, timestamp: Date.now(), lineSnapshot })
            setAiAnalysis(analysis)
          }
        } catch (err) {
          let analysis = `The ${game.homeTeam.name} host the ${game.awayTeam.name}. `
          if (homeRankings) {
            analysis += `${game.homeTeam.abbreviation} ranks #${homeRankings.offenseRank} in offense (${homeRankings.offenseYPG.toFixed(1)} YPG) and #${homeRankings.defenseRank} in defense. `
          }
          if (weather?.temp) {
            analysis += `Weather: ${weather.temp}°F, ${weather.condition || 'clear'}. `
          }
          setAiAnalysis(analysis)
        }
      }
      
      await Promise.all([fetchRankings(), fetchSchedules(), fetchSplits(), fetchInjuries(), fetchWeather()])
      await generateAIAnalysis()
    }
    
    fetchAll()
  }, [game, gameId, sport])
  
  const handleRefresh = () => {
    refresh()
    setLastUpdated(new Date())
  }

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }))
  }

  if (isLoading && !game) return <MatchupPageSkeleton />
  if (error || !game) {
    return (
      <ErrorDisplay
        variant="full"
        title="Game Not Found"
        message="This NFL game could not be found."
        backLink="/nfl/matchups"
        backText="Back to NFL matchups"
        showRetry={false}
      />
    )
  }

  const homeLast5 = homeSchedule.filter(g => g.isCompleted).slice(0, 5)
  const awayLast5 = awaySchedule.filter(g => g.isCompleted).slice(0, 5)
  const homeWins = homeLast5.filter(g => g.result === 'W').length
  const awayWins = awayLast5.filter(g => g.result === 'W').length

  const bettingMetrics = [
    { 
      label: 'Line Move', 
      value: bettingSplits?.lineMovement || bettingIntelligence?.lineMovement || '—',
      color: bettingSplits?.lineMovement?.startsWith('-') ? 'text-red-400' : 
             bettingSplits?.lineMovement?.startsWith('+') ? 'text-green-400' : 'text-gray-400'
    },
    { 
      label: 'Public %', 
      value: bettingSplits ? `${bettingSplits.spreadTicketPct}%` : `${bettingIntelligence?.publicPct || 0}%`,
      sub: (bettingSplits?.spreadTicketPct || bettingIntelligence?.publicPct || 50) > 50 
        ? game.homeTeam.abbreviation 
        : game.awayTeam.abbreviation
    },
    { 
      label: 'Sharp $', 
      value: bettingSplits ? `${bettingSplits.spreadMoneyPct}%` : '—',
      color: (bettingSplits?.spreadMoneyPct || 0) > 60 ? 'text-green-400' : 'text-white',
      sub: bettingSplits?.isRLM ? '⚠️ RLM' : undefined
    },
    { label: 'Handle', value: `${bettingIntelligence?.handlePct || 0}%` },
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
        <MatchupLayout.MainContent>
          {(bettingSplits?.isRLM || bettingIntelligence?.reverseLineMovement) && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span className="text-sm text-amber-400 font-medium">Reverse Line Movement</span>
                <span className="text-xs text-gray-500">
                  — Sharp action on {(bettingSplits?.spreadTicketPct || 50) > 50 ? game.awayTeam.abbreviation : game.homeTeam.abbreviation}
                </span>
              </div>
            </div>
          )}

          <div className="bg-[#0c0c14] rounded-xl border border-white/10 p-4">
            <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-green-400" />
              Betting Action
            </h3>
            <div className="grid grid-cols-4 gap-2">
              {bettingMetrics.map((m) => (
                <div key={m.label} className="bg-[#16161e] rounded-lg p-3 text-center">
                  <div className="text-[10px] text-gray-500 mb-1">{m.label}</div>
                  <div className={`text-lg font-bold ${m.color || 'text-white'}`}>{m.value}</div>
                  {m.sub && <div className="text-[10px] text-gray-500">{m.sub}</div>}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#0c0c14] rounded-xl border border-white/10 p-4">
            <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-blue-400" />
              Team Rankings
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-gray-500 mb-2">{game.homeTeam.abbreviation} (Home)</div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-[#16161e] rounded-lg p-3">
                    <div className="flex items-center gap-1 text-orange-400 mb-1">
                      <Zap className="w-3 h-3" />
                      <span className="text-[10px]">OFF</span>
                    </div>
                    <div className="text-xl font-bold text-white">#{homeRankings?.offenseRank || '—'}</div>
                    <div className="text-[10px] text-gray-500">{homeRankings?.offenseYPG?.toFixed(1) || '—'} YPG</div>
                  </div>
                  <div className="bg-[#16161e] rounded-lg p-3">
                    <div className="flex items-center gap-1 text-blue-400 mb-1">
                      <Shield className="w-3 h-3" />
                      <span className="text-[10px]">DEF</span>
                    </div>
                    <div className="text-xl font-bold text-white">#{homeRankings?.defenseRank || '—'}</div>
                    <div className="text-[10px] text-gray-500">{homeRankings?.defenseYPG?.toFixed(1) || '—'} YPG</div>
                  </div>
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-2">{game.awayTeam.abbreviation} (Away)</div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-[#16161e] rounded-lg p-3">
                    <div className="flex items-center gap-1 text-orange-400 mb-1">
                      <Zap className="w-3 h-3" />
                      <span className="text-[10px]">OFF</span>
                    </div>
                    <div className="text-xl font-bold text-white">#{awayRankings?.offenseRank || '—'}</div>
                    <div className="text-[10px] text-gray-500">{awayRankings?.offenseYPG?.toFixed(1) || '—'} YPG</div>
                  </div>
                  <div className="bg-[#16161e] rounded-lg p-3">
                    <div className="flex items-center gap-1 text-blue-400 mb-1">
                      <Shield className="w-3 h-3" />
                      <span className="text-[10px]">DEF</span>
                    </div>
                    <div className="text-xl font-bold text-white">#{awayRankings?.defenseRank || '—'}</div>
                    <div className="text-[10px] text-gray-500">{awayRankings?.defenseYPG?.toFixed(1) || '—'} YPG</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-[#0c0c14] rounded-xl border border-white/10 p-4">
            <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-yellow-400" />
              Recent Form (Last 5)
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-500">{game.homeTeam.abbreviation}</span>
                  <Link href={`/team/nfl/${game.homeTeam.abbreviation.toLowerCase()}`} className="text-[10px] text-orange-400 hover:underline flex items-center gap-1">
                    Full Schedule <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
                <div className="bg-[#16161e] rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-green-400">{homeWins}-{homeLast5.length - homeWins}</div>
                  <div className="text-[10px] text-gray-500">LAST 5</div>
                </div>
                <div className="flex gap-1 mt-2 justify-center">
                  {homeLast5.map((g, i) => (
                    <div key={i} className={`w-6 h-6 rounded text-xs font-bold flex items-center justify-center ${g.result === 'W' ? 'bg-green-500/20 text-green-400' : g.result === 'L' ? 'bg-red-500/20 text-red-400' : 'bg-gray-500/20 text-gray-400'}`}>
                      {g.result || '—'}
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-500">{game.awayTeam.abbreviation}</span>
                  <Link href={`/team/nfl/${game.awayTeam.abbreviation.toLowerCase()}`} className="text-[10px] text-orange-400 hover:underline flex items-center gap-1">
                    Full Schedule <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
                <div className="bg-[#16161e] rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-green-400">{awayWins}-{awayLast5.length - awayWins}</div>
                  <div className="text-[10px] text-gray-500">LAST 5</div>
                </div>
                <div className="flex gap-1 mt-2 justify-center">
                  {awayLast5.map((g, i) => (
                    <div key={i} className={`w-6 h-6 rounded text-xs font-bold flex items-center justify-center ${g.result === 'W' ? 'bg-green-500/20 text-green-400' : g.result === 'L' ? 'bg-red-500/20 text-red-400' : 'bg-gray-500/20 text-gray-400'}`}>
                      {g.result || '—'}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {h2h && h2h.gamesPlayed > 0 && (
            <div className="bg-[#0c0c14] rounded-xl border border-white/10 overflow-hidden">
              <button onClick={() => toggleSection('h2h')} className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Users className="w-4 h-4 text-purple-400" />
                  H2H History ({h2h.gamesPlayed} games)
                </h3>
                {expandedSections.h2h ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
              </button>
              {expandedSections.h2h && (
                <div className="px-4 pb-4">
                  <div className="grid grid-cols-4 gap-2">
                    <div className="text-center p-2 bg-[#16161e] rounded-lg">
                      <div className="text-lg font-bold text-orange-400">{h2h.homeATSRecord}</div>
                      <div className="text-[10px] text-gray-500">{game.homeTeam.abbreviation} ATS</div>
                    </div>
                    <div className="text-center p-2 bg-[#16161e] rounded-lg">
                      <div className="text-lg font-bold text-blue-400">{h2h.awayATSRecord}</div>
                      <div className="text-[10px] text-gray-500">{game.awayTeam.abbreviation} ATS</div>
                    </div>
                    <div className="text-center p-2 bg-[#16161e] rounded-lg">
                      <div className="text-lg font-bold text-green-400">{h2h.overUnderRecord}</div>
                      <div className="text-[10px] text-gray-500">O/U</div>
                    </div>
                    <div className="text-center p-2 bg-[#16161e] rounded-lg">
                      <div className="text-lg font-bold text-white">{h2h.avgTotal?.toFixed(1) || '—'}</div>
                      <div className="text-[10px] text-gray-500">AVG PTS</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {trends && trends.matched > 0 && (
            <div className="bg-[#0c0c14] rounded-xl border border-white/10 overflow-hidden">
              <button onClick={() => toggleSection('trends')} className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-orange-500" />
                  Betting Trends
                  <span className="text-xs px-2 py-0.5 bg-orange-500/20 text-orange-400 rounded">{trends.matched} matched</span>
                </h3>
                {expandedSections.trends ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
              </button>
              {expandedSections.trends && (
                <div className="px-4 pb-4 space-y-2">
                  {trends.spreadTrends?.slice(0, 5).map((trend: any, i: number) => (
                    <div key={i} className="flex items-center justify-between p-2 bg-[#16161e] rounded-lg text-sm">
                      <span className="text-gray-300 text-xs">{trend.description || trend.text}</span>
                      <span className={`font-bold text-xs ${trend.confidence >= 70 ? 'text-green-400' : 'text-amber-400'}`}>
                        {trend.confidence}%
                      </span>
                    </div>
                  ))}
                  <Link href={`/trends?sport=nfl&team=${game.homeTeam.abbreviation}`} className="text-xs text-orange-400 hover:underline">
                    View all trends →
                  </Link>
                </div>
              )}
            </div>
          )}

          <div className="bg-gradient-to-br from-[#0c0c14] to-orange-500/5 rounded-xl border border-orange-500/20 overflow-hidden">
            <button onClick={() => toggleSection('ai')} className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Brain className="w-4 h-4 text-orange-400" />
                The Edge Analysis
              </h3>
              {expandedSections.ai ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
            </button>
            {expandedSections.ai && (
              <div className="px-4 pb-4">
                {topPick && (
                  <div className="mb-3 p-3 bg-gradient-to-r from-orange-500/20 to-transparent rounded-lg border border-orange-500/30">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs text-gray-400 mb-1">AI PICK</div>
                        <div className="text-xl font-bold text-orange-400">{topPick.selection}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-bold text-white">{topPick.confidence}%</div>
                        <div className="text-[10px] text-gray-500">{topPick.supportingTrends} supporting trends</div>
                      </div>
                    </div>
                  </div>
                )}
                {aiAnalysis && (
                  <div className="space-y-2">
                    <p className="text-gray-300 text-sm leading-relaxed">{aiAnalysis}</p>
                    {weather?.temp && (
                      <div className="flex items-center gap-2 text-xs text-gray-400 mt-2">
                        <Cloud className="w-3 h-3" />
                        <span>{weather.temp}°F • {weather.condition || 'Clear'}{weather.wind ? ` • ${weather.wind}` : ''}</span>
                      </div>
                    )}
                    {(injuries.home.length > 0 || injuries.away.length > 0) && (
                      <div className="mt-2 p-2 bg-red-500/10 rounded border border-red-500/20">
                        <div className="text-xs text-red-400 font-medium mb-1">Key Injuries</div>
                        <div className="text-xs text-gray-400">
                          {[...injuries.home.slice(0, 2), ...injuries.away.slice(0, 2)].map(i => `${i.name} (${i.status})`).join(' • ')}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </MatchupLayout.MainContent>

        <MatchupLayout.Sidebar>
          {edgeScore && edgeScore.overall > 0 && <EdgeScoreCard edgeScore={edgeScore} gameId={gameId} />}
          <InjuryReport sport={sport} homeTeam={game.homeTeam.abbreviation} awayTeam={game.awayTeam.abbreviation} homeTeamFull={game.homeTeam.name} awayTeamFull={game.awayTeam.name} />
          <GameInfo game={game} showWeather={true} />
          
          <div className="space-y-2">
            <Link href="/trends?sport=nfl" className="flex items-center justify-between p-3 bg-[#0c0c14] rounded-xl border border-white/10 hover:border-orange-500/30 transition-all group">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-orange-500" />
                <span className="text-sm text-white group-hover:text-orange-400">All NFL Trends</span>
              </div>
              <ChevronDown className="w-4 h-4 text-gray-500 -rotate-90" />
            </Link>
            <Link href="/markets/edge" className="flex items-center justify-between p-3 bg-[#0c0c14] rounded-xl border border-white/10 hover:border-orange-500/30 transition-all group">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-red-500" />
                <span className="text-sm text-white group-hover:text-orange-400">The Edge - Sharp Signals</span>
              </div>
              <ChevronDown className="w-4 h-4 text-gray-500 -rotate-90" />
            </Link>
          </div>
        </MatchupLayout.Sidebar>
      </MatchupLayout.Grid>
    </MatchupLayout>
  )
}
