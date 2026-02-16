'use client'

/**
 * NBA GAME MATCHUP — "The Whale" Edition
 * NBA-specific: B2B alerts, rest days, Officials, NO weather (indoor)
 */

import { useState, useEffect, use } from 'react'
import { useMatchupData } from '@/hooks'
import { 
  MatchupLayout, InjuryReport, EdgeScoreCard, MatchupPageSkeleton,
  SharpSignalAlert, B2BAlert, AiPickSection, BettingActionGrid,
  H2HGrid, TrendsList, RestFormSection, PlayerPropsSection, QuickLinks,
} from '@/components/matchup'
import ErrorDisplay from '@/components/matchup/ErrorDisplay'
import TheEdgeSection from '@/components/game/TheEdgeSection'
import LineShoppingTable from '@/components/game/LineShoppingTable'
import { fetchIntelligence } from '@/lib/fetch-intelligence'
import { OfficialsPanel } from '@/components/betting/OfficialsPanel'
import { PowerRatingsComparison } from '@/components/betting/PowerRatingsComparison'
import Tooltip from '@/components/ui/Tooltip'
import { TOOLTIPS } from '@/lib/tooltip-content'
import { getSportConfig } from '@/lib/sport-config'
import type { SportType } from '@/types/sports'

interface TeamContext { restDays: number; isBackToBack: boolean; last5Record: string }

export default function NBAGameMatchupPage({ params }: { params: Promise<{ gameId: string }> }) {
  const { gameId } = use(params)
  const sport: SportType = 'nba'
  const config = getSportConfig(sport)
  const { game, analytics, isLoading, error, refresh, topPick, bettingIntelligence, h2h, edgeScore, trends } = useMatchupData(gameId, sport)
  
  const [activeTab, setActiveTab] = useState('overview')
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [homeCtx, setHomeCtx] = useState<TeamContext | null>(null)
  const [awayCtx, setAwayCtx] = useState<TeamContext | null>(null)
  const [intelligence, setIntelligence] = useState<any>(null)

  useEffect(() => {
    if (!game) return
    const calcCtx = (games: any[], gameDate: string) => {
      if (!games?.length) return { restDays: 2, isBackToBack: false, last5Record: '' }
      const last = games.find((g: any) => g.isCompleted)
      let restDays = 2, isB2B = false
      if (last) {
        restDays = Math.floor((new Date(gameDate).getTime() - new Date(last.date || last.scheduledAt).getTime()) / 86400000)
        isB2B = restDays <= 1
      }
      const c = games.filter((g: any) => g.isCompleted && g.result)
      return { restDays, isBackToBack: isB2B, last5Record: `${c.filter((g: any) => g.result === 'W').length}-${c.filter((g: any) => g.result === 'L').length}` }
    }
    const gd = game.scheduledAt || game.startTime
    Promise.all([
      fetch(`/api/team/nba/${game.homeTeam.abbreviation}/schedule?limit=15`).then(r => r.ok ? r.json() : null),
      fetch(`/api/team/nba/${game.awayTeam.abbreviation}/schedule?limit=15`).then(r => r.ok ? r.json() : null),
    ]).then(([h, a]) => {
      if (h?.games) setHomeCtx(calcCtx(h.games, gd))
      if (a?.games) setAwayCtx(calcCtx(a.games, gd))
    }).catch(() => {})

    // Intelligence (for TheEdgeSection)
    fetchIntelligence(gameId, 'NBA', game).then(data => {
      if (data) setIntelligence(data)
    }).catch(() => {})
  }, [game, gameId])

  const handleRefresh = () => { refresh(); setLastUpdated(new Date()) }

  if (isLoading && !game) return <MatchupPageSkeleton />
  if (error || !game) return <ErrorDisplay variant="full" title="Game Not Found" message="This NBA game could not be found." backLink="/nba/matchups" backText="Back to NBA matchups" showRetry={false} />

  return (
    <MatchupLayout sport={sport} game={game} analytics={analytics} isLoading={isLoading} lastUpdated={lastUpdated} onRefresh={handleRefresh} activeTab={activeTab} onTabChange={setActiveTab}>
      <MatchupLayout.Grid>
        <MatchupLayout.MainContent>

          {/* B2B Alert — NBA-specific */}
          <B2BAlert homeB2B={homeCtx?.isBackToBack} awayB2B={awayCtx?.isBackToBack} homeAbbr={game.homeTeam.abbreviation} awayAbbr={game.awayTeam.abbreviation} note={config.b2bNote} />

          {/* Sharp Signal */}
          <SharpSignalAlert reverseLineMovement={bettingIntelligence?.reverseLineMovement} />

          {/* THE EDGE */}
          {intelligence && (
            <TheEdgeSection intelligence={intelligence} homeAbbr={game.homeTeam.abbreviation} awayAbbr={game.awayTeam.abbreviation} homeName={game.homeTeam.name} awayName={game.awayTeam.name} sport={sport} />
          )}

          {/* Line Shopping */}
          <LineShoppingTable gameId={gameId} sport={sport} homeAbbr={game.homeTeam.abbreviation} awayAbbr={game.awayTeam.abbreviation} />

          {/* Rest & Form — NBA: rest days matter */}
          <RestFormSection homeCtx={homeCtx} awayCtx={awayCtx} homeAbbr={game.homeTeam.abbreviation} awayAbbr={game.awayTeam.abbreviation} sport={sport} showRestDays={true} formWindow={config.formWindow} />

          {/* Officials */}
          <div className="relative">
            <span className="absolute top-2.5 right-2 z-10"><Tooltip content={TOOLTIPS.officials} /></span>
            <OfficialsPanel gameId={gameId} sport="nba" />
          </div>

          {/* Power Ratings */}
          <div className="relative">
            <span className="absolute top-2.5 right-2 z-10"><Tooltip content={TOOLTIPS.powerRating} /></span>
            <PowerRatingsComparison sport="nba" homeTeam={game.homeTeam.abbreviation} awayTeam={game.awayTeam.abbreviation} />
          </div>

          {/* AI Pick */}
          <AiPickSection topPick={topPick} />

          {/* Betting Action */}
          <BettingActionGrid lineMovement={bettingIntelligence?.lineMovement} publicPct={bettingIntelligence?.publicPct} sharpPct={bettingIntelligence?.sharpPct} handlePct={bettingIntelligence?.handlePct} homeAbbr={game.homeTeam.abbreviation} awayAbbr={game.awayTeam.abbreviation} />

          {/* H2H */}
          <H2HGrid h2h={h2h} homeAbbr={game.homeTeam.abbreviation} awayAbbr={game.awayTeam.abbreviation} spreadLabel={config.spreadLabel} scoreUnit={config.scoreUnit} />

          {/* Trends */}
          <TrendsList trends={trends} sport={sport} teamAbbr={game.homeTeam.abbreviation} />

          {/* Player Props */}
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
