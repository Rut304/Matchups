'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { 
  TrendingUp, Zap, Flame, ChevronDown, Target, 
  Users, BarChart3, Calendar, Moon, AlertTriangle
} from 'lucide-react'
import { useMatchupData } from '@/hooks'
import { 
  MatchupLayout, 
  InjuryReport, 
  EdgeScoreCard, 
  GameInfo,
  MatchupPageSkeleton,
} from '@/components/matchup'
import { GamePlayerProps } from '@/components/game'
import ErrorDisplay from '@/components/matchup/ErrorDisplay'
import type { SportType } from '@/types/sports'

// NBA-specific: Rest & schedule context
interface TeamContext {
  restDays: number
  isBackToBack: boolean
  lastGameResult?: 'W' | 'L'
  last5Record: string
}

export default function NBAGameMatchupPage({ params }: { params: Promise<{ gameId: string }> }) {
  const { gameId } = use(params)
  const sport: SportType = 'nba'
  
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
  const [homeContext, setHomeContext] = useState<TeamContext | null>(null)
  const [awayContext, setAwayContext] = useState<TeamContext | null>(null)
  
  // Fetch NBA-specific context (rest days, B2B)
  useEffect(() => {
    if (!game) return
    
    const fetchTeamContext = async () => {
      try {
        const [homeRes, awayRes] = await Promise.all([
          fetch(`/api/team/${sport}/${game.homeTeam.abbreviation}/schedule?limit=5`),
          fetch(`/api/team/${sport}/${game.awayTeam.abbreviation}/schedule?limit=5`)
        ])
        
        const calcContext = (games: any[], gameDate: string) => {
          if (!games || games.length === 0) return { restDays: 2, isBackToBack: false, last5Record: '—' }
          const lastGame = games.find(g => g.isCompleted)
          let restDays = 2
          let isBackToBack = false
          if (lastGame) {
            const lastDate = new Date(lastGame.date || lastGame.scheduledAt)
            const gDate = new Date(gameDate)
            restDays = Math.floor((gDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24))
            isBackToBack = restDays <= 1
          }
          const completed = games?.filter(g => g.isCompleted && g.result) || []
          const wins = completed.filter(g => g.result === 'W').length
          const losses = completed.filter(g => g.result === 'L').length
          return { restDays, isBackToBack, last5Record: `${wins}-${losses}`, lastGameResult: lastGame?.result }
        }
        
        const gameDate = game.scheduledAt || game.startTime
        if (homeRes.ok) {
          const data = await homeRes.json()
          setHomeContext(calcContext(data.games, gameDate))
        }
        if (awayRes.ok) {
          const data = await awayRes.json()
          setAwayContext(calcContext(data.games, gameDate))
        }
      } catch (err) {
        console.error('Failed to fetch team context:', err)
      }
    }
    fetchTeamContext()
  }, [game, sport])
  
  const handleRefresh = () => {
    refresh()
    setLastUpdated(new Date())
  }

  if (isLoading && !game) return <MatchupPageSkeleton />
  if (error || !game) {
    return (
      <ErrorDisplay
        variant="full"
        title="Game Not Found"
        message="This NBA game couldn't be found. It may have been rescheduled or cancelled."
        backLink="/nba/matchups"
        backText="Back to NBA matchups"
        showRetry={false}
      />
    )
  }

  const bettingMetrics = [
    { label: 'Line Move', value: bettingIntelligence?.lineMovement || '—', color: bettingIntelligence?.lineMovement?.startsWith('-') ? 'text-red-400' : 'text-green-400' },
    { label: 'Public', value: bettingIntelligence?.publicPct ? `${bettingIntelligence.publicPct}%` : '—', sub: bettingIntelligence?.publicPct && bettingIntelligence.publicPct > 50 ? game.awayTeam.abbreviation : game.homeTeam.abbreviation },
    { label: 'Sharp', value: bettingIntelligence?.sharpPct ? `${bettingIntelligence.sharpPct}%` : '—', color: (bettingIntelligence?.sharpPct || 0) > 60 ? 'text-green-400' : 'text-white' },
    { label: 'Handle', value: bettingIntelligence?.handlePct ? `${bettingIntelligence.handlePct}%` : '—' },
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
          {/* OVERVIEW TAB - Shows summary of everything */}
          {activeTab === 'overview' && (
            <>
              {/* NBA: Back-to-Back Alert */}
              {(homeContext?.isBackToBack || awayContext?.isBackToBack) && (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-5 h-5 text-amber-400" />
                    <span className="font-bold text-amber-400">Schedule Alert</span>
                  </div>
                  <div className="flex flex-wrap gap-3 text-sm">
                    {homeContext?.isBackToBack && (
                      <div className="flex items-center gap-2 bg-amber-500/10 px-3 py-1.5 rounded-lg">
                        <Moon className="w-4 h-4 text-amber-400" />
                        <span className="text-gray-300"><span className="font-medium text-white">{game.homeTeam.abbreviation}</span> B2B</span>
                      </div>
                    )}
                    {awayContext?.isBackToBack && (
                      <div className="flex items-center gap-2 bg-amber-500/10 px-3 py-1.5 rounded-lg">
                        <Moon className="w-4 h-4 text-amber-400" />
                        <span className="text-gray-300"><span className="font-medium text-white">{game.awayTeam.abbreviation}</span> B2B</span>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">NBA teams on back-to-backs cover ~47% ATS historically</p>
                </div>
              )}

              {/* Quick Summary Cards */}
              <div className="grid grid-cols-2 gap-3">
                {/* Betting Summary */}
                <div className="bg-[#0c0c14] rounded-xl border border-white/10 p-4">
                  <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-green-400" />
                    Betting
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Line Move</span>
                      <span className={bettingIntelligence?.lineMovement?.startsWith('-') ? 'text-red-400' : 'text-green-400'}>{bettingIntelligence?.lineMovement || '—'}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Sharp %</span>
                      <span className="text-white">{bettingIntelligence?.sharpPct ? `${bettingIntelligence.sharpPct}%` : '—'}</span>
                    </div>
                  </div>
                </div>

                {/* H2H Summary */}
                {h2h && h2h.gamesPlayed > 0 && (
                  <div className="bg-[#0c0c14] rounded-xl border border-white/10 p-4">
                    <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                      <Users className="w-4 h-4 text-purple-400" />
                      H2H ({h2h.gamesPlayed}g)
                    </h3>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">{game.homeTeam.abbreviation} ATS</span>
                        <span className="text-orange-400">{h2h.homeATSRecord}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">O/U</span>
                        <span className="text-green-400">{h2h.overUnderRecord}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Top Trends Preview */}
              {trends && trends.matched > 0 && trends.spreadTrends && (
                <div className="bg-[#0c0c14] rounded-xl border border-white/10 p-4">
                  <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-orange-500" />
                    Top Trends
                  </h3>
                  <div className="space-y-2">
                    {trends.spreadTrends.slice(0, 2).map((trend, i) => (
                      <div key={i} className="flex items-center justify-between p-2 bg-[#16161e] rounded-lg text-sm">
                        <span className="text-gray-300 text-xs">{trend.description || trend.text}</span>
                        <span className={`font-bold text-xs ${trend.confidence >= 70 ? 'text-green-400' : 'text-amber-400'}`}>{trend.confidence}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* AI Pick */}
              {topPick && (
                <div className="bg-gradient-to-br from-[#0c0c14] to-orange-500/5 rounded-xl border border-orange-500/20 p-4">
                  <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-orange-400" />
                    AI Pick
                  </h3>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-lg font-bold text-orange-400">{topPick.selection}</div>
                      <div className="text-xs text-gray-400">{topPick.supportingTrends} trends</div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-white">{topPick.confidence}%</div>
                      <div className="text-[10px] text-gray-500">confidence</div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* TRENDS TAB - Full trends view */}
          {activeTab === 'trends' && (
            <>
              {trends && trends.matched > 0 && trends.spreadTrends ? (
                <div className="space-y-4">
                  <div className="bg-[#0c0c14] rounded-xl border border-white/10 p-4">
                    <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-orange-500" />
                      Spread Trends ({trends.spreadTrends.length})
                    </h3>
                    <div className="space-y-2">
                      {trends.spreadTrends.map((trend, i) => (
                        <div key={i} className="flex items-center justify-between p-3 bg-[#16161e] rounded-lg text-sm">
                          <span className="text-gray-300">{trend.description || trend.text}</span>
                          <span className={`font-bold ${trend.confidence >= 70 ? 'text-green-400' : 'text-amber-400'}`}>{trend.confidence}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  {trends.totalTrends && (
                    <div className="bg-[#0c0c14] rounded-xl border border-white/10 p-4">
                      <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                        <Target className="w-4 h-4 text-green-400" />
                        Over/Under Trends ({trends.totalTrends.length})
                      </h3>
                      <div className="space-y-2">
                        {trends.totalTrends.map((trend, i) => (
                          <div key={i} className="flex items-center justify-between p-3 bg-[#16161e] rounded-lg text-sm">
                            <span className="text-gray-300">{trend.description || trend.text}</span>
                            <span className={`font-bold ${trend.confidence >= 70 ? 'text-green-400' : 'text-amber-400'}`}>{trend.confidence}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <Link href={`/trends?sport=nba&team=${game.homeTeam.abbreviation}`} className="text-sm text-orange-400 hover:underline inline-flex items-center gap-1">
                    <TrendingUp className="w-4 h-4" /> View all NBA trends →
                  </Link>
                </div>
              ) : (
                <div className="bg-[#0c0c14] rounded-xl border border-white/10 p-8 text-center">
                  <TrendingUp className="w-8 h-8 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400">No trends data available for this matchup</p>
                </div>
              )}
            </>
          )}

          {/* BETTING TAB - Full betting action */}
          {activeTab === 'betting' && (
            <>
              <div className="bg-[#0c0c14] rounded-xl border border-white/10 p-4">
                <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-green-400" />
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

              {bettingIntelligence && (
                <div className="bg-[#0c0c14] rounded-xl border border-white/10 p-4">
                  <h3 className="text-sm font-bold text-white mb-3">Line Movement Analysis</h3>
                  <div className="space-y-3">
                    {bettingIntelligence.lineMovement && (
                      <div className="flex justify-between items-center p-3 bg-[#16161e] rounded-lg">
                        <span className="text-gray-400">Opening → Current</span>
                        <span className={`font-bold ${bettingIntelligence.lineMovement.startsWith('-') ? 'text-red-400' : 'text-green-400'}`}>
                          {bettingIntelligence.lineMovement}
                        </span>
                      </div>
                    )}
                    {bettingIntelligence.steamMoves && bettingIntelligence.steamMoves.length > 0 && (
                      <div className="flex justify-between items-center p-3 bg-[#16161e] rounded-lg">
                        <span className="text-gray-400">Steam Moves</span>
                        <span className="font-bold text-red-400">{bettingIntelligence.steamMoves.length}</span>
                      </div>
                    )}
                    {bettingIntelligence.reverseLineMovement && (
                      <div className="flex items-center gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                        <AlertTriangle className="w-4 h-4 text-amber-400" />
                        <span className="text-amber-400 text-sm">Reverse Line Movement Detected</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}

          {/* MATCHUP TAB - H2H and team comparison */}
          {activeTab === 'matchup' && (
            <>
              {/* Rest & Form Comparison */}
              {(homeContext || awayContext) && (
                <div className="bg-[#0c0c14] rounded-xl border border-white/10 p-4">
                  <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-blue-400" />
                    Rest & Recent Form
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs text-gray-500 mb-2">{game.homeTeam.abbreviation}</div>
                      <div className="flex gap-2">
                        <div className="bg-[#16161e] rounded-lg px-3 py-2 text-center flex-1">
                          <div className="text-xl font-bold text-white">{homeContext?.restDays ?? '—'}</div>
                          <div className="text-[10px] text-gray-500">REST</div>
                        </div>
                        <div className="bg-[#16161e] rounded-lg px-3 py-2 text-center flex-1">
                          <div className="text-xl font-bold text-green-400">{homeContext?.last5Record || '—'}</div>
                          <div className="text-[10px] text-gray-500">L5</div>
                        </div>
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-2">{game.awayTeam.abbreviation}</div>
                      <div className="flex gap-2">
                        <div className="bg-[#16161e] rounded-lg px-3 py-2 text-center flex-1">
                          <div className="text-xl font-bold text-white">{awayContext?.restDays ?? '—'}</div>
                          <div className="text-[10px] text-gray-500">REST</div>
                        </div>
                        <div className="bg-[#16161e] rounded-lg px-3 py-2 text-center flex-1">
                          <div className="text-xl font-bold text-green-400">{awayContext?.last5Record || '—'}</div>
                          <div className="text-[10px] text-gray-500">L5</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* NBA: Back-to-Back Alert */}
              {(homeContext?.isBackToBack || awayContext?.isBackToBack) && (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-5 h-5 text-amber-400" />
                    <span className="font-bold text-amber-400">Schedule Alert</span>
                  </div>
                  <div className="flex flex-wrap gap-3 text-sm">
                    {homeContext?.isBackToBack && (
                      <div className="flex items-center gap-2 bg-amber-500/10 px-3 py-1.5 rounded-lg">
                        <Moon className="w-4 h-4 text-amber-400" />
                        <span className="text-gray-300"><span className="font-medium text-white">{game.homeTeam.abbreviation}</span> B2B</span>
                      </div>
                    )}
                    {awayContext?.isBackToBack && (
                      <div className="flex items-center gap-2 bg-amber-500/10 px-3 py-1.5 rounded-lg">
                        <Moon className="w-4 h-4 text-amber-400" />
                        <span className="text-gray-300"><span className="font-medium text-white">{game.awayTeam.abbreviation}</span> B2B</span>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">NBA teams on back-to-backs cover ~47% ATS historically</p>
                </div>
              )}

              {/* H2H Full View */}
              {h2h && h2h.gamesPlayed > 0 ? (
                <div className="bg-[#0c0c14] rounded-xl border border-white/10 p-4">
                  <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                    <Users className="w-4 h-4 text-purple-400" />
                    Head-to-Head ({h2h.gamesPlayed} games)
                  </h3>
                  <div className="grid grid-cols-4 gap-2 mb-4">
                    <div className="text-center p-3 bg-[#16161e] rounded-lg">
                      <div className="text-xl font-bold text-orange-400">{h2h.homeATSRecord}</div>
                      <div className="text-xs text-gray-500">{game.homeTeam.abbreviation} ATS</div>
                    </div>
                    <div className="text-center p-3 bg-[#16161e] rounded-lg">
                      <div className="text-xl font-bold text-blue-400">{h2h.awayATSRecord}</div>
                      <div className="text-xs text-gray-500">{game.awayTeam.abbreviation} ATS</div>
                    </div>
                    <div className="text-center p-3 bg-[#16161e] rounded-lg">
                      <div className="text-xl font-bold text-green-400">{h2h.overUnderRecord}</div>
                      <div className="text-xs text-gray-500">O/U</div>
                    </div>
                    <div className="text-center p-3 bg-[#16161e] rounded-lg">
                      <div className="text-xl font-bold text-white">{h2h.avgTotal?.toFixed(1) || '—'}</div>
                      <div className="text-xs text-gray-500">Avg Total</div>
                    </div>
                  </div>
                  {h2h.avgMargin !== undefined && (
                    <div className="text-center p-3 bg-[#16161e] rounded-lg">
                      <div className="text-lg font-bold text-white">{h2h.avgMargin > 0 ? '+' : ''}{h2h.avgMargin.toFixed(1)}</div>
                      <div className="text-xs text-gray-500">{game.homeTeam.abbreviation} Avg Margin</div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-[#0c0c14] rounded-xl border border-white/10 p-8 text-center">
                  <Users className="w-8 h-8 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400">No head-to-head data available</p>
                </div>
              )}
            </>
          )}

          {/* AI PICKS TAB - Full AI analysis */}
          {activeTab === 'ai' && (
            <>
              {topPick ? (
                <div className="space-y-4">
                  <div className="bg-gradient-to-br from-[#0c0c14] to-orange-500/5 rounded-xl border border-orange-500/20 p-6">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                      <Zap className="w-5 h-5 text-orange-400" />
                      AI Pick
                    </h3>
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <div className="text-2xl font-bold text-orange-400">{topPick.selection}</div>
                        <div className="text-sm text-gray-400">{topPick.supportingTrends} supporting trends</div>
                      </div>
                      <div className="text-right">
                        <div className="text-4xl font-bold text-white">{topPick.confidence}%</div>
                        <div className="text-sm text-gray-500">confidence</div>
                      </div>
                    </div>
                    {topPick.reasoning && topPick.reasoning.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-white/10">
                        <h4 className="text-sm font-bold text-gray-400 mb-3">Analysis</h4>
                        <div className="space-y-2">
                          {topPick.reasoning.map((reason: string, i: number) => (
                            <div key={i} className="flex items-start gap-2 text-sm text-gray-300">
                              <Target className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                              <span>{reason}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Supporting Data */}
                  <div className="grid grid-cols-2 gap-3">
                    {trends && trends.matched > 0 && (
                      <div className="bg-[#0c0c14] rounded-xl border border-white/10 p-4">
                        <div className="text-2xl font-bold text-green-400">{trends.matched}</div>
                        <div className="text-xs text-gray-500">Matching Trends</div>
                      </div>
                    )}
                    {h2h && (
                      <div className="bg-[#0c0c14] rounded-xl border border-white/10 p-4">
                        <div className="text-2xl font-bold text-purple-400">{h2h.gamesPlayed}</div>
                        <div className="text-xs text-gray-500">H2H Games</div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-[#0c0c14] rounded-xl border border-white/10 p-8 text-center">
                  <Zap className="w-8 h-8 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400">AI pick not available for this matchup</p>
                  <p className="text-xs text-gray-500 mt-1">Insufficient data to generate prediction</p>
                </div>
              )}
            </>
          )}

          {/* Player Props */}
          <GamePlayerProps 
            gameId={gameId} 
            sport="NBA" 
            homeTeam={game.homeTeam.name}
            awayTeam={game.awayTeam.name}
          />
        </MatchupLayout.MainContent>

        <MatchupLayout.Sidebar>
          {edgeScore && edgeScore.overall > 0 && <EdgeScoreCard edgeScore={edgeScore} gameId={gameId} />}
          <InjuryReport sport={sport} homeTeam={game.homeTeam.abbreviation} awayTeam={game.awayTeam.abbreviation} homeTeamFull={game.homeTeam.name} awayTeamFull={game.awayTeam.name} />
          <GameInfo game={game} showWeather={false} />
          <div className="space-y-2">
            <Link href="/trends?sport=nba" className="flex items-center justify-between p-3 bg-[#0c0c14] rounded-xl border border-white/10 hover:border-orange-500/30 transition-all group">
              <div className="flex items-center gap-2"><TrendingUp className="w-4 h-4 text-orange-500" /><span className="text-sm text-white group-hover:text-orange-400">All NBA Trends</span></div>
              <ChevronDown className="w-4 h-4 text-gray-500 -rotate-90" />
            </Link>
            <Link href="/live" className="flex items-center justify-between p-3 bg-[#0c0c14] rounded-xl border border-white/10 hover:border-orange-500/30 transition-all group">
              <div className="flex items-center gap-2"><Flame className="w-4 h-4 text-red-500" /><span className="text-sm text-white group-hover:text-orange-400">Live Alerts</span></div>
              <ChevronDown className="w-4 h-4 text-gray-500 -rotate-90" />
            </Link>
          </div>
        </MatchupLayout.Sidebar>
      </MatchupLayout.Grid>
    </MatchupLayout>
  )
}
