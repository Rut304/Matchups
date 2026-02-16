'use client'

/**
 * MLB GAME MATCHUP — "The Whale" Edition
 * MLB-specific: Umpire (officials), weather/wind, Run Line labels, L10 form
 */

import { useState, useEffect, use } from 'react'
import { useMatchupData } from '@/hooks'
import { 
  MatchupLayout, InjuryReport, EdgeScoreCard, MatchupPageSkeleton,
  SharpSignalAlert, AiPickSection, BettingActionGrid,
  H2HGrid, TrendsList, RestFormSection, PlayerPropsSection, QuickLinks,
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

interface TeamContext { last5Record: string }

export default function MLBGameMatchupPage({ params }: { params: Promise<{ gameId: string }> }) {
  const { gameId } = use(params)
  const sport: SportType = 'mlb'
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
      fetch(`/api/team/mlb/${game.homeTeam.abbreviation}/schedule?limit=20`).then(r => r.ok ? r.json() : null),
      fetch(`/api/team/mlb/${game.awayTeam.abbreviation}/schedule?limit=20`).then(r => r.ok ? r.json() : null),
    ]).then(([h, a]) => {
      const calc = (games: any[]) => {
        const c = (games || []).filter((g: any) => g.isCompleted && g.result)
        return { last5Record: `${c.filter((g: any) => g.result === 'W').length}-${c.filter((g: any) => g.result === 'L').length}` }
      }
      if (h?.games) setHomeCtx(calc(h.games.slice(0, 10)))
      if (a?.games) setAwayCtx(calc(a.games.slice(0, 10)))
    }).catch(() => {})

    fetchIntelligence(gameId, 'MLB', game).then(data => {
      if (data) setIntelligence(data)
    }).catch(() => {})
  }, [game, gameId])

  const handleRefresh = () => { refresh(); setLastUpdated(new Date()) }

  if (isLoading && !game) return <MatchupPageSkeleton />
  if (error || !game) return <ErrorDisplay variant="full" title="Game Not Found" message="This MLB game could not be found." backLink="/mlb/matchups" backText="Back to MLB matchups" showRetry={false} />

  return (
    <MatchupLayout sport={sport} game={game} analytics={analytics} isLoading={isLoading} lastUpdated={lastUpdated} onRefresh={handleRefresh} activeTab={activeTab} onTabChange={setActiveTab}>
      <MatchupLayout.Grid>
        <MatchupLayout.MainContent>

          <SharpSignalAlert reverseLineMovement={bettingIntelligence?.reverseLineMovement} />

          {intelligence && (
            <TheEdgeSection intelligence={intelligence} homeAbbr={game.homeTeam.abbreviation} awayAbbr={game.awayTeam.abbreviation} homeName={game.homeTeam.name} awayName={game.awayTeam.name} sport={sport} />
          )}

          <LineShoppingTable gameId={gameId} sport={sport} homeAbbr={game.homeTeam.abbreviation} awayAbbr={game.awayTeam.abbreviation} />

          {/* Umpire — MLB's key official */}
          <div className="relative">
            <span className="absolute top-2.5 right-2 z-10"><Tooltip content={TOOLTIPS.officials} /></span>
            <OfficialsPanel gameId={gameId} sport="mlb" />
          </div>

          <div className="relative">
            <span className="absolute top-2.5 right-2 z-10"><Tooltip content={TOOLTIPS.powerRating} /></span>
            <PowerRatingsComparison sport="mlb" homeTeam={game.homeTeam.abbreviation} awayTeam={game.awayTeam.abbreviation} />
          </div>

          <AiPickSection topPick={topPick} />

          <BettingActionGrid lineMovement={bettingIntelligence?.lineMovement} publicPct={bettingIntelligence?.publicPct} sharpPct={bettingIntelligence?.sharpPct} handlePct={bettingIntelligence?.handlePct} />

          {/* Recent Form — L10 for baseball */}
          <RestFormSection homeCtx={homeCtx} awayCtx={awayCtx} homeAbbr={game.homeTeam.abbreviation} awayAbbr={game.awayTeam.abbreviation} sport={sport} showRestDays={false} formWindow={config.formWindow} />

          <H2HGrid h2h={h2h} homeAbbr={game.homeTeam.abbreviation} awayAbbr={game.awayTeam.abbreviation} spreadLabel={config.spreadLabel} scoreUnit={config.scoreUnit} />

          <TrendsList trends={trends} sport={sport} />

          <PlayerPropsSection gameId={gameId} sport={sport} homeTeam={game.homeTeam.name} awayTeam={game.awayTeam.name} />

        </MatchupLayout.MainContent>
        <MatchupLayout.Sidebar>
          {edgeScore && edgeScore.overall > 0 && <EdgeScoreCard edgeScore={edgeScore} gameId={gameId} />}
          {/* Weather — MLB is outdoor, wind matters */}
          <div className="relative">
            <span className="absolute top-2.5 right-2 z-10"><Tooltip content={TOOLTIPS.weather} /></span>
            <WeatherPanel venue={game.venue || ''} city={game.venue?.split(',').pop()?.trim() || ''} gameDate={game.scheduledAt || game.startTime} sport="mlb" compact={false} />
          </div>
          <InjuryReport sport={sport} homeTeam={game.homeTeam.abbreviation} awayTeam={game.awayTeam.abbreviation} homeTeamFull={game.homeTeam.name} awayTeamFull={game.awayTeam.name} />
          <QuickLinks links={config.quickLinks} />
        </MatchupLayout.Sidebar>
      </MatchupLayout.Grid>
    </MatchupLayout>
  )
}
