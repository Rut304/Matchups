'use client'

/**
 * WNCAAB GAME MATCHUP — "The Whale" Edition (UPGRADED from old design)
 * WNCAAB-specific: Key numbers (3,5,7,10), NO weather/officials/B2B/power ratings
 */

import { useState, useEffect, use } from 'react'
import { useMatchupData } from '@/hooks'
import { 
  MatchupLayout, InjuryReport, EdgeScoreCard, GameInfo, MatchupPageSkeleton,
  SharpSignalAlert, KeyNumberAlert, AiPickSection, BettingActionGrid,
  H2HGrid, TrendsList, RestFormSection, PlayerPropsSection, QuickLinks,
} from '@/components/matchup'
import ErrorDisplay from '@/components/matchup/ErrorDisplay'
import TheEdgeSection from '@/components/game/TheEdgeSection'
import LineShoppingTable from '@/components/game/LineShoppingTable'
import { fetchIntelligence } from '@/lib/fetch-intelligence'
import { getSportConfig } from '@/lib/sport-config'
import type { SportType } from '@/types/sports'

interface TeamContext { last5Record: string }

export default function WNCAABGameMatchupPage({ params }: { params: Promise<{ gameId: string }> }) {
  const { gameId } = use(params)
  const sport: SportType = 'wncaab'
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
      fetch(`/api/team/wncaab/${game.homeTeam.abbreviation}/schedule?limit=5`).then(r => r.ok ? r.json() : null),
      fetch(`/api/team/wncaab/${game.awayTeam.abbreviation}/schedule?limit=5`).then(r => r.ok ? r.json() : null),
    ]).then(([h, a]) => {
      const calc = (games: any[]) => {
        const c = (games || []).filter((g: any) => g.isCompleted && g.result)
        return { last5Record: `${c.filter((g: any) => g.result === 'W').length}-${c.filter((g: any) => g.result === 'L').length}` }
      }
      if (h?.games) setHomeCtx(calc(h.games))
      if (a?.games) setAwayCtx(calc(a.games))
    }).catch(() => {})

    fetchIntelligence(gameId, 'WNCAAB', game).then(data => {
      if (data) setIntelligence(data)
    }).catch(() => {})
  }, [game, gameId])

  const handleRefresh = () => { refresh(); setLastUpdated(new Date()) }

  if (isLoading && !game) return <MatchupPageSkeleton />
  if (error || !game) return <ErrorDisplay variant="full" title="Game Not Found" message="This WNCAAB game couldn't be found." backLink="/wncaab/matchups" backText="Back to WNCAAB matchups" showRetry={false} />

  return (
    <MatchupLayout sport={sport} game={game} analytics={analytics} isLoading={isLoading} lastUpdated={lastUpdated} onRefresh={handleRefresh} activeTab={activeTab} onTabChange={setActiveTab}>
      <MatchupLayout.Grid>
        <MatchupLayout.MainContent>

          {/* Key Number — fixed: 6→5 + Math.round */}
          <KeyNumberAlert spread={game.odds?.spread || 0} keyNumbers={config.keyNumbers!} description={config.keyNumberDesc} />

          {/* Sharp Signal — now added */}
          <SharpSignalAlert reverseLineMovement={bettingIntelligence?.reverseLineMovement} />

          {/* THE EDGE — NEW */}
          {intelligence && (
            <TheEdgeSection intelligence={intelligence} homeAbbr={game.homeTeam.abbreviation} awayAbbr={game.awayTeam.abbreviation} homeName={game.homeTeam.name} awayName={game.awayTeam.name} sport={sport} />
          )}

          {/* Line Shopping — NEW */}
          <LineShoppingTable gameId={gameId} sport={sport} homeAbbr={game.homeTeam.abbreviation} awayAbbr={game.awayTeam.abbreviation} />

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
          <GameInfo game={game} />
          <QuickLinks links={config.quickLinks} />
        </MatchupLayout.Sidebar>
      </MatchupLayout.Grid>
    </MatchupLayout>
  )
}
