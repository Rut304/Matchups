'use client'

/**
 * NFL GAME MATCHUP PAGE — "The Whale" Edition
 * 
 * NFL-specific: Rankings, Officials, Weather, AI Analysis text,
 * W/L dots in form, betting splits fetch
 * 
 * Shared: SharpSignalAlert, AiPickSection, BettingActionGrid,
 * H2HGrid, TrendsList, RestFormSection, QuickLinks, TheEdgeSection, LineShoppingTable
 */

import { useState, useEffect, use } from 'react'
import { Shield, BarChart3, Swords } from 'lucide-react'
import { useMatchupData } from '@/hooks'
import { 
  MatchupLayout, InjuryReport, EdgeScoreCard, MatchupPageSkeleton, CollapsibleSection,
  SharpSignalAlert, AiPickSection, BettingActionGrid, H2HGrid, TrendsList,
  RestFormSection, PlayerPropsSection, QuickLinks,
} from '@/components/matchup'
import ErrorDisplay from '@/components/matchup/ErrorDisplay'
import TheEdgeSection from '@/components/game/TheEdgeSection'
import LineShoppingTable from '@/components/game/LineShoppingTable'
import { fetchIntelligence } from '@/lib/fetch-intelligence'
import { OfficialsPanel } from '@/components/betting/OfficialsPanel'
import { WeatherPanel } from '@/components/betting/WeatherPanel'
import { PowerRatingsComparison } from '@/components/betting/PowerRatingsComparison'
import Tooltip from '@/components/ui/Tooltip'
import { TOOLTIPS } from '@/lib/tooltip-content'
import { getSportConfig } from '@/lib/sport-config'
import type { SportType } from '@/types/sports'

const aiCache = new Map<string, { analysis: string; ts: number; snap: string }>()

interface TeamRankings { offenseRank: number; offenseYPG: number; defenseRank: number; defenseYPG: number }
interface BettingSplitData { spreadTicketPct: number; spreadMoneyPct: number; lineMovement: string; isRLM: boolean }

export default function GameMatchupPage({ params }: { params: Promise<{ gameId: string }> }) {
  const { gameId } = use(params)
  const sport: SportType = 'nfl'
  const config = getSportConfig(sport)
  
  const { game, analytics, isLoading, error, refresh, topPick, bettingIntelligence, h2h, edgeScore, trends } = useMatchupData(gameId, sport)
  
  const [activeTab, setActiveTab] = useState('overview')
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [bettingSplits, setBettingSplits] = useState<BettingSplitData | null>(null)
  const [homeRankings, setHomeRankings] = useState<TeamRankings | null>(null)
  const [awayRankings, setAwayRankings] = useState<TeamRankings | null>(null)
  const [aiAnalysis, setAiAnalysis] = useState('')
  const [homeSchedule, setHomeSchedule] = useState<any[]>([])
  const [awaySchedule, setAwaySchedule] = useState<any[]>([])
  const [intelligence, setIntelligence] = useState<any>(null)

  useEffect(() => {
    if (!game) return
    const homeAbbr = game.homeTeam.abbreviation
    const awayAbbr = game.awayTeam.abbreviation
    
    const fetchAll = async () => {
      // Rankings
      fetch('/api/team-stats?sport=nfl&type=rankings').then(r => r.ok ? r.json() : null).then(data => {
        if (!data?.rankings) return
        const ho = data.rankings.offense?.find((t: any) => t.teamAbbrev === homeAbbr)
        const hd = data.rankings.defense?.find((t: any) => t.teamAbbrev === homeAbbr)
        const ao = data.rankings.offense?.find((t: any) => t.teamAbbrev === awayAbbr)
        const ad = data.rankings.defense?.find((t: any) => t.teamAbbrev === awayAbbr)
        if (ho || hd) setHomeRankings({ offenseRank: ho?.rank || 0, offenseYPG: ho?.value || 0, defenseRank: hd?.rank || 0, defenseYPG: hd?.value || 0 })
        if (ao || ad) setAwayRankings({ offenseRank: ao?.rank || 0, offenseYPG: ao?.value || 0, defenseRank: ad?.rank || 0, defenseYPG: ad?.value || 0 })
      }).catch(() => {})

      // Schedules
      Promise.all([
        fetch(`/api/team/nfl/${homeAbbr}/schedule?limit=15`).then(r => r.ok ? r.json() : null),
        fetch(`/api/team/nfl/${awayAbbr}/schedule?limit=15`).then(r => r.ok ? r.json() : null),
      ]).then(([h, a]) => {
        if (h?.games) setHomeSchedule(h.games.filter((g: any) => g.isCompleted).slice(0, 5))
        if (a?.games) setAwaySchedule(a.games.filter((g: any) => g.isCompleted).slice(0, 5))
      }).catch(() => {})

      // Splits
      fetch('/api/betting-splits?sport=NFL').then(r => r.ok ? r.json() : null).then(data => {
        const gs = data?.data?.splits?.find((s: any) =>
          s.homeTeam?.toLowerCase().includes(game.homeTeam.name.toLowerCase()) ||
          s.awayTeam?.toLowerCase().includes(game.awayTeam.name.toLowerCase())
        )
        if (gs) {
          const lm = (gs.currentSpread || game.odds?.spread || 0) - (gs.openSpread || game.odds?.spread || 0)
          setBettingSplits({
            spreadTicketPct: gs.spreadTicketPct || 50,
            spreadMoneyPct: gs.spreadMoneyPct || 50,
            lineMovement: lm > 0 ? `+${lm.toFixed(1)}` : lm.toFixed(1),
            isRLM: Math.abs((gs.spreadTicketPct || 50) - (gs.spreadMoneyPct || 50)) > 15,
          })
        }
      }).catch(() => {})

      // AI Analysis
      const snap = `${game.odds?.spread || 0}-${game.odds?.total || 0}`
      const cached = aiCache.get(gameId)
      if (cached && Date.now() - cached.ts < 30 * 60000 && cached.snap === snap) {
        setAiAnalysis(cached.analysis)
      } else {
        fetch(`/api/ai/game-analysis?gameId=${gameId}&sport=NFL`).then(r => r.ok ? r.json() : null).then(data => {
          const a = data?.analysis || data?.aiAnalysis || ''
          if (a) { aiCache.set(gameId, { analysis: a, ts: Date.now(), snap }); setAiAnalysis(a) }
        }).catch(() => {})
      }

      // Intelligence (for TheEdgeSection)
      fetchIntelligence(gameId, 'NFL', game).then(data => {
        if (data) setIntelligence(data)
      }).catch(() => {})
    }
    fetchAll()
  }, [game, gameId])

  const handleRefresh = () => { refresh(); setLastUpdated(new Date()) }

  if (isLoading && !game) return <MatchupPageSkeleton />
  if (error || !game) {
    return <ErrorDisplay variant="full" title="Game Not Found" message="This NFL game could not be found." backLink="/nfl/matchups" backText="Back to NFL matchups" showRetry={false} />
  }

  return (
    <MatchupLayout sport={sport} game={game} analytics={analytics} isLoading={isLoading} lastUpdated={lastUpdated} onRefresh={handleRefresh} activeTab={activeTab} onTabChange={setActiveTab}>
      <MatchupLayout.Grid>
        <MatchupLayout.MainContent>

          {/* Sharp Signal */}
          <SharpSignalAlert
            reverseLineMovement={bettingSplits?.isRLM || bettingIntelligence?.reverseLineMovement}
            customMessage={`Reverse line movement — money on ${(bettingSplits?.spreadTicketPct || 50) > 50 ? game.awayTeam.abbreviation : game.homeTeam.abbreviation}`}
          />

          {/* THE EDGE — Full analysis */}
          {intelligence && (
            <TheEdgeSection
              intelligence={intelligence}
              homeAbbr={game.homeTeam.abbreviation}
              awayAbbr={game.awayTeam.abbreviation}
              homeName={game.homeTeam.name}
              awayName={game.awayTeam.name}
              sport={sport}
            />
          )}

          {/* Line Shopping — Multi-book odds */}
          <LineShoppingTable gameId={gameId} sport={sport} homeAbbr={game.homeTeam.abbreviation} awayAbbr={game.awayTeam.abbreviation} />

          {/* Officials — NFL differentiator */}
          <div className="relative">
            <span className="absolute top-2.5 right-2 z-10"><Tooltip content={TOOLTIPS.officials} /></span>
            <OfficialsPanel gameId={gameId} sport="nfl" />
          </div>

          {/* Power Ratings */}
          <div className="relative">
            <span className="absolute top-2.5 right-2 z-10"><Tooltip content={TOOLTIPS.powerRating} /></span>
            <PowerRatingsComparison sport="nfl" homeTeam={game.homeTeam.abbreviation} awayTeam={game.awayTeam.abbreviation} />
          </div>

          {/* AI Analysis */}
          <AiPickSection topPick={topPick} aiAnalysisText={aiAnalysis} />

          {/* Betting Action */}
          <BettingActionGrid
            lineMovement={bettingSplits?.lineMovement || bettingIntelligence?.lineMovement}
            publicPct={bettingSplits?.spreadTicketPct || bettingIntelligence?.publicPct}
            sharpPct={bettingSplits?.spreadMoneyPct || bettingIntelligence?.sharpPct}
            handlePct={bettingIntelligence?.handlePct}
            homeAbbr={game.homeTeam.abbreviation}
            awayAbbr={game.awayTeam.abbreviation}
          />

          {/* H2H */}
          <H2HGrid h2h={h2h} homeAbbr={game.homeTeam.abbreviation} awayAbbr={game.awayTeam.abbreviation} spreadLabel={config.spreadLabel} scoreUnit={config.scoreUnit} />

          {/* Trends */}
          <TrendsList trends={trends} sport={sport} teamAbbr={game.homeTeam.abbreviation} />

          {/* NFL: Team Rankings */}
          {(homeRankings || awayRankings) && (
            <CollapsibleSection title="Team Rankings" icon={BarChart3}>
              <div className="grid grid-cols-2 gap-3 mt-2">
                {[
                  { abbr: game.homeTeam.abbreviation, tag: 'Home', rankings: homeRankings },
                  { abbr: game.awayTeam.abbreviation, tag: 'Away', rankings: awayRankings },
                ].map(team => (
                  <div key={team.abbr}>
                    <div className="text-[10px] text-gray-600 mb-1">{team.abbr} ({team.tag})</div>
                    <div className="grid grid-cols-2 gap-1.5">
                      <div className="bg-[#16161e] rounded p-2 text-center">
                        <div className="flex items-center justify-center gap-1 text-orange-400 mb-0.5"><Swords className="w-3 h-3" /><span className="text-[9px]">OFF</span></div>
                        <div className="text-sm font-bold text-white">{team.rankings?.offenseRank ? `#${team.rankings.offenseRank}` : '-'}</div>
                        <div className="text-[9px] text-gray-600">{team.rankings?.offenseYPG?.toFixed(1) || '-'} YPG</div>
                      </div>
                      <div className="bg-[#16161e] rounded p-2 text-center">
                        <div className="flex items-center justify-center gap-1 text-blue-400 mb-0.5"><Shield className="w-3 h-3" /><span className="text-[9px]">DEF</span></div>
                        <div className="text-sm font-bold text-white">{team.rankings?.defenseRank ? `#${team.rankings.defenseRank}` : '-'}</div>
                        <div className="text-[9px] text-gray-600">{team.rankings?.defenseYPG?.toFixed(1) || '-'} YPG</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CollapsibleSection>
          )}

          {/* Recent Form with W/L dots */}
          <RestFormSection
            homeCtx={{ last5Record: `${homeSchedule.filter((g: any) => g.result === 'W').length}-${homeSchedule.length - homeSchedule.filter((g: any) => g.result === 'W').length}` }}
            awayCtx={{ last5Record: `${awaySchedule.filter((g: any) => g.result === 'W').length}-${awaySchedule.length - awaySchedule.filter((g: any) => g.result === 'W').length}` }}
            homeAbbr={game.homeTeam.abbreviation}
            awayAbbr={game.awayTeam.abbreviation}
            sport={sport}
            showRestDays={false}
            formWindow={config.formWindow}
            homeSchedule={homeSchedule}
            awaySchedule={awaySchedule}
          />

          {/* Player Props */}
          <PlayerPropsSection gameId={gameId} sport={sport} homeTeam={game.homeTeam.name} awayTeam={game.awayTeam.name} />

        </MatchupLayout.MainContent>

        <MatchupLayout.Sidebar>
          {edgeScore && edgeScore.overall > 0 && <EdgeScoreCard edgeScore={edgeScore} gameId={gameId} />}
          
          {/* Weather — NFL is outdoor */}
          <div className="relative">
            <span className="absolute top-2.5 right-2 z-10"><Tooltip content={TOOLTIPS.weather} /></span>
            <WeatherPanel venue={game.venue || ''} city={game.venue?.split(',').pop()?.trim() || ''} gameDate={game.scheduledAt || game.startTime} sport="nfl" compact={false} />
          </div>

          <InjuryReport sport={sport} homeTeam={game.homeTeam.abbreviation} awayTeam={game.awayTeam.abbreviation} homeTeamFull={game.homeTeam.name} awayTeamFull={game.awayTeam.name} />
          
          <QuickLinks links={config.quickLinks} />
        </MatchupLayout.Sidebar>
      </MatchupLayout.Grid>
    </MatchupLayout>
  )
}
