'use client'

/**
 * WNBA GAME MATCHUP — "The Whale" Edition (UPGRADED from old design)
 * WNBA-specific: B2B alerts, rest days, NO weather/officials/power ratings
 */

import { useState, useEffect, use } from 'react'
import { useMatchupData } from '@/hooks'
import { 
  MatchupLayout, InjuryReport, EdgeScoreCard, GameInfo, MatchupPageSkeleton,
  SharpSignalAlert, B2BAlert, AiPickSection, BettingActionGrid,
  H2HGrid, TrendsList, RestFormSection, PlayerPropsSection, QuickLinks,
} from '@/components/matchup'
import ErrorDisplay from '@/components/matchup/ErrorDisplay'
import TheEdgeSection from '@/components/game/TheEdgeSection'
import LineShoppingTable from '@/components/game/LineShoppingTable'
import { fetchIntelligence } from '@/lib/fetch-intelligence'
import { getSportConfig } from '@/lib/sport-config'
import type { SportType } from '@/types/sports'

interface TeamContext { last5Record: string; restDays: number; isB2B: boolean }

export default function WNBAGameMatchupPage({ params }: { params: Promise<{ gameId: string }> }) {
  const { gameId } = use(params)
  const sport: SportType = 'wnba'
  const config = getSportConfig(sport)
  const { game, analytics, isLoading, error, refresh, topPick, bettingIntelligence, h2h, edgeScore, trends } = useMatchupData(gameId, sport)
  
  const [activeTab, setActiveTab] = useState('overview')
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [homeCtx, setHomeCtx] = useState<TeamContext | null>(null)
  const [awayCtx, setAwayCtx] = useState<TeamContext | null>(null)
  const [intelligence, setIntelligence] = useState<any>(null)

  useEffect(() => {
    if (!game) return
    const calcCtx = (games: any[], gameDate: string): TeamContext => {
      if (!games?.length) return { last5Record: '', restDays: 0, isB2B: false }
      const completed = games.filter((g: any) => g.isCompleted && g.result)
      const wins = completed.filter((g: any) => g.result === 'W').length
      const losses = completed.filter((g: any) => g.result === 'L').length
      const last = completed[0]
      let restDays = 0, isB2B = false
      if (last?.date) {
        restDays = Math.floor((new Date(gameDate).getTime() - new Date(last.date).getTime()) / 86400000)
        isB2B = restDays <= 1
      }
      return { last5Record: `${wins}-${losses}`, restDays, isB2B }
    }
    const gd = game.scheduledAt || game.startTime
    Promise.all([
      fetch(`/api/team/wnba/${game.homeTeam.abbreviation}/schedule?limit=5`).then(r => r.ok ? r.json() : null),
      fetch(`/api/team/wnba/${game.awayTeam.abbreviation}/schedule?limit=5`).then(r => r.ok ? r.json() : null),
    ]).then(([h, a]) => {
      if (h?.games) setHomeCtx(calcCtx(h.games, gd))
      if (a?.games) setAwayCtx(calcCtx(a.games, gd))
    }).catch(() => {})

    fetchIntelligence(gameId, 'WNBA', game).then(data => {
      if (data) setIntelligence(data)
    }).catch(() => {})
  }, [game, gameId])

  const handleRefresh = () => { refresh(); setLastUpdated(new Date()) }

  if (isLoading && !game) return <MatchupPageSkeleton />
  if (error || !game) return <ErrorDisplay variant="full" title="Game Not Found" message="This WNBA game couldn't be found." backLink="/wnba/matchups" backText="Back to WNBA matchups" showRetry={false} />

  return (
    <MatchupLayout sport={sport} game={game} analytics={analytics} isLoading={isLoading} lastUpdated={lastUpdated} onRefresh={handleRefresh} activeTab={activeTab} onTabChange={setActiveTab}>
      <MatchupLayout.Grid>
        <MatchupLayout.MainContent>

          {/* B2B Alert */}
          <B2BAlert homeB2B={homeCtx?.isB2B} awayB2B={awayCtx?.isB2B} homeAbbr={game.homeTeam.abbreviation} awayAbbr={game.awayTeam.abbreviation} note={config.b2bNote} />

          {/* Sharp Signal — now added */}
          <SharpSignalAlert reverseLineMovement={bettingIntelligence?.reverseLineMovement} />

          {/* THE EDGE — NEW */}
          {intelligence && (
            <TheEdgeSection intelligence={intelligence} homeAbbr={game.homeTeam.abbreviation} awayAbbr={game.awayTeam.abbreviation} homeName={game.homeTeam.name} awayName={game.awayTeam.name} sport={sport} />
          )}

          {/* Line Shopping — NEW */}
          <LineShoppingTable gameId={gameId} sport={sport} homeAbbr={game.homeTeam.abbreviation} awayAbbr={game.awayTeam.abbreviation} />

          {/* Rest & Form — WNBA: B2B tracking matters */}
          <RestFormSection
            homeCtx={{ restDays: homeCtx?.restDays ?? null, isBackToBack: homeCtx?.isB2B, last5Record: homeCtx?.last5Record }}
            awayCtx={{ restDays: awayCtx?.restDays ?? null, isBackToBack: awayCtx?.isB2B, last5Record: awayCtx?.last5Record }}
            homeAbbr={game.homeTeam.abbreviation}
            awayAbbr={game.awayTeam.abbreviation}
            sport={sport}
            showRestDays={true}
            formWindow={config.formWindow}
          />

          <AiPickSection topPick={topPick} />

          <BettingActionGrid lineMovement={bettingIntelligence?.lineMovement} publicPct={bettingIntelligence?.publicPct} sharpPct={bettingIntelligence?.sharpPct} handlePct={bettingIntelligence?.handlePct} />

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
