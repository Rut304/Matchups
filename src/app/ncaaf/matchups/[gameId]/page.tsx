'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { TrendingUp, ChevronDown, Zap, Users, BarChart3, Calendar, Trophy } from 'lucide-react'
import { InjuryReport, MatchupPageSkeleton, EdgeScoreCard, GameInfo, MatchupLayout } from '@/components/matchup'
import ErrorDisplay from '@/components/matchup/ErrorDisplay'
import { useMatchupData } from '@/hooks'
import type { SportType } from '@/types/sports'

// NCAAF-specific context
interface TeamContext {
  last5Record: string
  conferenceRecord?: string
}

export default function NCAAFGameMatchupPage({ params }: { params: Promise<{ gameId: string }> }) {
  const { gameId } = use(params)
  const sport: SportType = 'ncaaf'
  
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

  // Fetch team context
  useEffect(() => {
    if (!game) return
    
    const fetchTeamContext = async () => {
      try {
        const [homeRes, awayRes] = await Promise.all([
          fetch(`/api/team/${sport}/${game.homeTeam.abbreviation}/schedule?limit=5`),
          fetch(`/api/team/${sport}/${game.awayTeam.abbreviation}/schedule?limit=5`)
        ])
        
        const calcContext = (games: any[]) => {
          if (!games || games.length === 0) return { last5Record: '—' }
          const completed = games?.filter(g => g.isCompleted && g.result) || []
          const wins = completed.filter(g => g.result === 'W').length
          const losses = completed.filter(g => g.result === 'L').length
          return { last5Record: `${wins}-${losses}` }
        }
        
        if (homeRes.ok) {
          const data = await homeRes.json()
          setHomeContext(calcContext(data.games))
        }
        if (awayRes.ok) {
          const data = await awayRes.json()
          setAwayContext(calcContext(data.games))
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
        message="This NCAAF game couldn't be found. It may have been rescheduled or cancelled."
        backLink="/ncaaf/matchups"
        backText="Back to NCAAF matchups"
        showRetry={false}
      />
    )
  }

  const bettingMetrics = [
    { label: 'Line Move', value: bettingIntelligence?.lineMovement || '—', color: 'text-green-400' },
    { label: 'Public', value: bettingIntelligence?.publicPct ? `${bettingIntelligence.publicPct}%` : '—' },
    { label: 'Sharp', value: bettingIntelligence?.sharpPct ? `${bettingIntelligence.sharpPct}%` : '—', color: (bettingIntelligence?.sharpPct || 0) > 60 ? 'text-green-400' : 'text-white' },
    { label: 'Handle', value: bettingIntelligence?.handlePct ? `${bettingIntelligence.handlePct}%` : '—' },
  ]

  // Key numbers for college football (3, 7, 10, 14, 17, 21)
  const spread = game.odds?.spread || 0
  const isKeyNumber = [3, 7, 10, 14, 17, 21].includes(Math.abs(spread))

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
          {/* NCAAF: Key Number Alert */}
          {isKeyNumber && (
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-3">
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-blue-400" />
                <span className="text-sm text-blue-400 font-medium">Key Number: {Math.abs(spread)}</span>
                <span className="text-xs text-gray-500">— Common margin in CFB</span>
              </div>
            </div>
          )}

          {/* Recent Form */}
          {(homeContext || awayContext) && (
            <div className="bg-[#0c0c14] rounded-xl border border-white/10 p-4">
              <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-400" />
                Recent Form
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-gray-500 mb-2">{game.homeTeam.abbreviation} (Home)</div>
                  <div className="bg-[#16161e] rounded-lg px-4 py-3 text-center">
                    <div className="text-2xl font-bold text-green-400">{homeContext?.last5Record || '—'}</div>
                    <div className="text-[10px] text-gray-500">LAST 5</div>
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-2">{game.awayTeam.abbreviation} (Away)</div>
                  <div className="bg-[#16161e] rounded-lg px-4 py-3 text-center">
                    <div className="text-2xl font-bold text-green-400">{awayContext?.last5Record || '—'}</div>
                    <div className="text-[10px] text-gray-500">LAST 5</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Betting Action */}
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
                </div>
              ))}
            </div>
          </div>

          {/* H2H */}
          {h2h && h2h.gamesPlayed > 0 && (
            <div className="bg-[#0c0c14] rounded-xl border border-white/10 p-4">
              <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                <Users className="w-4 h-4 text-purple-400" />
                H2H ({h2h.gamesPlayed} games)
              </h3>
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

          {/* Trends */}
          {trends && trends.matched > 0 && trends.spreadTrends && (
            <div className="bg-[#0c0c14] rounded-xl border border-white/10 p-4">
              <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-orange-500" />
                Trends ({trends.matched})
              </h3>
              <div className="space-y-2">
                {trends.spreadTrends.slice(0, 4).map((trend: any, i: number) => (
                  <div key={i} className="flex items-center justify-between p-2 bg-[#16161e] rounded-lg text-sm">
                    <span className="text-gray-300 text-xs">{trend.description}</span>
                    <span className={`font-bold text-xs ${trend.confidence >= 70 ? 'text-green-400' : 'text-amber-400'}`}>{trend.confidence}%</span>
                  </div>
                ))}
              </div>
              <Link href="/trends?sport=ncaaf" className="text-xs text-orange-400 hover:underline mt-2 inline-block">View all →</Link>
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
        </MatchupLayout.MainContent>

        <MatchupLayout.Sidebar>
          {edgeScore && edgeScore.overall > 0 && <EdgeScoreCard edgeScore={edgeScore} gameId={gameId} />}
          <InjuryReport sport={sport} homeTeam={game.homeTeam.abbreviation} awayTeam={game.awayTeam.abbreviation} homeTeamFull={game.homeTeam.name} awayTeamFull={game.awayTeam.name} />
          <GameInfo game={game} showWeather={true} />
          <div className="space-y-2">
            <Link href="/trends?sport=ncaaf" className="flex items-center justify-between p-3 bg-[#0c0c14] rounded-xl border border-white/10 hover:border-orange-500/30 transition-all group">
              <div className="flex items-center gap-2"><TrendingUp className="w-4 h-4 text-orange-500" /><span className="text-sm text-white group-hover:text-orange-400">All NCAAF Trends</span></div>
              <ChevronDown className="w-4 h-4 text-gray-500 -rotate-90" />
            </Link>
          </div>
        </MatchupLayout.Sidebar>
      </MatchupLayout.Grid>
    </MatchupLayout>
  )
}
