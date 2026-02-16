'use client'

/**
 * NCAAB GAME MATCHUP — "The Whale" Edition
 * NCAAB-specific: Key numbers (3,5,7,10), home court advantage, NO weather/officials
 */

import { useState, useEffect, use } from 'react'
import { useMatchupData } from '@/hooks'
import { 
  MatchupLayout, InjuryReport, EdgeScoreCard, MatchupPageSkeleton,
  SharpSignalAlert, KeyNumberAlert, AiPickSection, BettingActionGrid,
  H2HGrid, TrendsList, RestFormSection, PlayerPropsSection, QuickLinks,
} from '@/components/matchup'
import ErrorDisplay from '@/components/matchup/ErrorDisplay'
import TheEdgeSection from '@/components/game/TheEdgeSection'
import LineShoppingTable from '@/components/game/LineShoppingTable'
import { fetchIntelligence } from '@/lib/fetch-intelligence'
import { PowerRatingsComparison } from '@/components/betting/PowerRatingsComparison'
import Tooltip from '@/components/ui/Tooltip'
import { TOOLTIPS } from '@/lib/tooltip-content'
import { getSportConfig } from '@/lib/sport-config'
import type { SportType } from '@/types/sports'

interface TeamContext { last5Record: string }

export default function NCAABGameMatchupPage({ params }: { params: Promise<{ gameId: string }> }) {
  const { gameId } = use(params)
  const sport: SportType = 'ncaab'
  const config = getSportConfig(sport)
  const { game, analytics, isLoading, error, refresh, topPick, bettingIntelligence, h2h, edgeScore, trends } = useMatchupData(gameId, sport)
  
  const [activeTab, setActiveTab] = useState('overview')
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [homeCtx, setHomeCtx] = useState<TeamContext | null>(null)
  const [awayCtx, setAwayCtx] = useState<TeamContext | null>(null)
  const [intelligence, setIntelligence] = useState<any>(null)

  useEffect(() => {
    if (!game) return
    Promise.all([
      fetch(`/api/team/ncaab/${game.homeTeam.abbreviation}/schedule?limit=15`).then(r => r.ok ? r.json() : null),
      fetch(`/api/team/ncaab/${game.awayTeam.abbreviation}/schedule?limit=15`).then(r => r.ok ? r.json() : null),
    ]).then(([h, a]) => {
      const calc = (games: any[]) => {
        const c = (games || []).filter((g: any) => g.isCompleted && g.result)
        return { last5Record: `${c.filter((g: any) => g.result === 'W').length}-${c.filter((g: any) => g.result === 'L').length}` }
      }
      if (h?.games) setHomeCtx(calc(h.games))
      if (a?.games) setAwayCtx(calc(a.games))
    }).catch(() => {})

    fetchIntelligence(gameId, 'NCAAB', game).then(data => {
      if (data) setIntelligence(data)
    }).catch(() => {})
  }, [game, gameId])

  const handleRefresh = () => { refresh(); setLastUpdated(new Date()) }

  if (isLoading && !game) return <MatchupPageSkeleton />
  if (error || !game) return <ErrorDisplay variant="full" title="Game Not Found" message="This NCAAB game could not be found." backLink="/ncaab/matchups" backText="Back to NCAAB matchups" showRetry={false} />

  return (
    <MatchupLayout sport={sport} game={game} analytics={analytics} isLoading={isLoading} lastUpdated={lastUpdated} onRefresh={handleRefresh} activeTab={activeTab} onTabChange={setActiveTab}>
      <MatchupLayout.Grid>
        <MatchupLayout.MainContent>

          {/* Key Number — fixed: 6→5 + Math.round */}
          <KeyNumberAlert spread={game.odds?.spread || 0} keyNumbers={config.keyNumbers!} description={config.keyNumberDesc} />

          <SharpSignalAlert reverseLineMovement={bettingIntelligence?.reverseLineMovement} />

          {intelligence && (
            <TheEdgeSection intelligence={intelligence} homeAbbr={game.homeTeam.abbreviation} awayAbbr={game.awayTeam.abbreviation} homeName={game.homeTeam.name} awayName={game.awayTeam.name} sport={sport} />
          )}

          <LineShoppingTable gameId={gameId} sport={sport} homeAbbr={game.homeTeam.abbreviation} awayAbbr={game.awayTeam.abbreviation} />

          {/* Power Ratings — critical for college */}
          <div className="relative">
            <span className="absolute top-2.5 right-2 z-10"><Tooltip content={TOOLTIPS.powerRating} /></span>
            <PowerRatingsComparison sport="ncaab" homeTeam={game.homeTeam.abbreviation} awayTeam={game.awayTeam.abbreviation} />
          </div>

          <AiPickSection topPick={topPick} />

          <BettingActionGrid lineMovement={bettingIntelligence?.lineMovement} publicPct={bettingIntelligence?.publicPct} sharpPct={bettingIntelligence?.sharpPct} handlePct={bettingIntelligence?.handlePct} />

          <RestFormSection homeCtx={homeCtx} awayCtx={awayCtx} homeAbbr={game.homeTeam.abbreviation} awayAbbr={game.awayTeam.abbreviation} sport={sport} showRestDays={false} formWindow={config.formWindow} />

          <H2HGrid h2h={h2h} homeAbbr={game.homeTeam.abbreviation} awayAbbr={game.awayTeam.abbreviation} spreadLabel={config.spreadLabel} scoreUnit={config.scoreUnit} />

          <TrendsList trends={trends} sport={sport} />

          <PlayerPropsSection gameId={gameId} sport={sport} homeTeam={game.homeTeam.name} awayTeam={game.awayTeam.name} />

        </MatchupLayout.MainContent>
        <MatchupLayout.Sidebar>
          {edgeScore && edgeScore.overall > 0 && <EdgeScoreCard edgeScore={edgeScore} gameId={gameId} />}
          <InjuryReport sport={sport} homeTeam={game.homeTeam.abbreviation} awayTeam={game.awayTeam.abbreviation} homeTeamFull={game.homeTeam.name} awayTeamFull={game.awayTeam.name} />
          <QuickLinks links={config.quickLinks} />
        </MatchupLayout.Sidebar>
      </MatchupLayout.Grid>
    </MatchupLayout>
  )
}
