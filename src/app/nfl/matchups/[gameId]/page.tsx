'use client'

import { useState, use } from 'react'
import Link from 'next/link'
import { 
  TrendingUp, Zap, Flame, ChevronDown, Target, 
  Users, Shield, BarChart3
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

// =============================================================================
// COMPONENT
// =============================================================================

export default function GameMatchupPage({ params }: { params: Promise<{ gameId: string }> }) {
  const { gameId } = use(params)
  const sport: SportType = 'nfl'
  
  // Use centralized hooks for all data fetching with SWR caching
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
  
  // Handle refresh
  const handleRefresh = () => {
    refresh()
    setLastUpdated(new Date())
  }

  // Loading state
  if (isLoading && !game) {
    return <MatchupPageSkeleton />
  }

  // Error/not found state
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

  // Betting metrics from intelligence
  const bettingMetrics = [
    { 
      label: 'Line Movement', 
      value: bettingIntelligence?.lineMovement || '+0.0', 
      color: bettingIntelligence?.lineMovement?.startsWith('-') ? 'text-red-400' : 'text-green-400' 
    },
    { 
      label: 'Public %', 
      value: `${bettingIntelligence?.publicPct || 52}%`, 
      sub: bettingIntelligence?.publicPct && bettingIntelligence.publicPct > 50 ? 'AWAY' : 'HOME' 
    },
    { 
      label: 'Sharp Action', 
      value: `${bettingIntelligence?.sharpPct || 55}%`, 
      color: (bettingIntelligence?.sharpPct || 55) > 60 ? 'text-green-400' : 'text-white' 
    },
    { 
      label: 'Handle %', 
      value: `${bettingIntelligence?.handlePct || 51}%`, 
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
              <BarChart3 className="w-5 h-5 text-blue-400" />
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
            {bettingIntelligence?.reverseLineMovement && (
              <div className="mt-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
                <div className="flex items-center gap-2">
                  <span className="text-amber-400 text-sm font-semibold">⚠️ Reverse Line Movement Detected</span>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  Line moving opposite to public betting percentage - possible sharp action
                </p>
              </div>
            )}
          </div>

          {/* Head-to-Head History */}
          {h2h && h2h.gamesPlayed > 0 && (
            <div className="bg-[#0c0c14] rounded-xl border border-white/10 p-6">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-400" />
                Head-to-Head History
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">{h2h.gamesPlayed}</div>
                  <div className="text-xs text-gray-500">Games</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-400">{h2h.homeATSRecord}</div>
                  <div className="text-xs text-gray-500">Home ATS</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-400">{h2h.overUnderRecord}</div>
                  <div className="text-xs text-gray-500">O/U Record</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400">{h2h.avgTotal?.toFixed(1) || '-'}</div>
                  <div className="text-xs text-gray-500">Avg Total</div>
                </div>
              </div>
            </div>
          )}

          {/* Betting Trends */}
          {trends && trends.matched > 0 && trends.spreadTrends && (
            <div className="bg-[#0c0c14] rounded-xl border border-white/10 p-6">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-orange-500" />
                Betting Trends ({trends.matched} matched)
              </h3>
              <div className="space-y-3">
                {trends.spreadTrends.slice(0, 5).map((trend, i) => (
                  <Link 
                    key={i} 
                    href={`/trends?sport=${sport}&team=${game.homeTeam.abbreviation}`}
                    className="flex items-center justify-between p-3 bg-[#16161e] rounded-lg hover:bg-white/10 transition-colors group"
                  >
                    <span className="text-gray-300 group-hover:text-white transition-colors">
                      {trend.description || trend.text}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-bold ${trend.confidence >= 70 ? 'text-green-400' : 'text-amber-400'}`}>
                        {trend.confidence}%
                      </span>
                      {trend.edge && (
                        <span className="text-xs px-2 py-0.5 rounded bg-green-500/20 text-green-400">
                          +{trend.edge}% edge
                        </span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Team Stats Comparison - Tab specific */}
          {activeTab === 'matchup' && (
            <div className="bg-[#0c0c14] rounded-xl border border-white/10 p-6">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-purple-400" />
                Team Comparison
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-sm text-gray-500 mb-2">{game.awayTeam.abbreviation}</div>
                  <div className="text-2xl font-bold text-white">{game.awayTeam.record || '-'}</div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-gray-500 mb-2">Record</div>
                  <div className="text-sm text-gray-400">Season</div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-gray-500 mb-2">{game.homeTeam.abbreviation}</div>
                  <div className="text-2xl font-bold text-white">{game.homeTeam.record || '-'}</div>
                </div>
              </div>
            </div>
          )}

          {/* AI Analysis - Tab specific */}
          {activeTab === 'ai' && topPick && (
            <div className="bg-[#0c0c14] rounded-xl border border-white/10 p-6">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5 text-orange-400" />
                AI Deep Analysis
              </h3>
              <div className="space-y-4">
                <div className="p-4 bg-gradient-to-r from-orange-500/10 to-transparent rounded-lg border border-orange-500/30">
                  <div className="text-lg font-bold text-orange-400">{topPick.selection}</div>
                  <div className="text-sm text-gray-400 mt-1">
                    {topPick.confidence}% confidence • {topPick.supportingTrends} supporting trends
                  </div>
                </div>
                {topPick.reasoning && topPick.reasoning.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-gray-400">Reasoning</div>
                    {topPick.reasoning.map((reason: string, i: number) => (
                      <div key={i} className="flex items-start gap-2 text-sm text-gray-300">
                        <Target className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                        <span>{reason}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
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
              href="/live"
              className="flex items-center justify-between p-4 bg-[#0c0c14] rounded-xl border border-white/10 hover:border-orange-500/30 transition-all group"
            >
              <div className="flex items-center gap-3">
                <Flame className="w-5 h-5 text-red-500" />
                <span className="text-white font-medium group-hover:text-orange-400 transition-colors">
                  Live Edge Alerts
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
