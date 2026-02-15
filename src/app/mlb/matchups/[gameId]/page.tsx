'use client'

/**
 * MLB GAME MATCHUP — "The Whale" Edition
 * Sport-specific: Umpire (officials), weather/wind, Run Line labels, starter focus
 */

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { 
  TrendingUp, ChevronDown, Users, DollarSign, Brain,
  AlertTriangle, Calendar, Target, Wind
} from 'lucide-react'
import { useMatchupData } from '@/hooks'
import { 
  MatchupLayout, InjuryReport, EdgeScoreCard, MatchupPageSkeleton, CollapsibleSection
} from '@/components/matchup'
import { GamePlayerProps } from '@/components/game'
import { OfficialsPanel } from '@/components/betting/OfficialsPanel'
import { WeatherPanel } from '@/components/betting/WeatherPanel'
import { PowerRatingsComparison } from '@/components/betting/PowerRatingsComparison'
import ErrorDisplay from '@/components/matchup/ErrorDisplay'
import Tooltip from '@/components/ui/Tooltip'
import { TOOLTIPS } from '@/lib/tooltip-content'
import type { SportType } from '@/types/sports'

interface TeamContext { last5Record: string }

export default function MLBGameMatchupPage({ params }: { params: Promise<{ gameId: string }> }) {
  const { gameId } = use(params)
  const sport: SportType = 'mlb'
  const { game, analytics, isLoading, error, refresh, topPick, bettingIntelligence, h2h, edgeScore, trends } = useMatchupData(gameId, sport)
  
  const [activeTab, setActiveTab] = useState('overview')
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [homeCtx, setHomeCtx] = useState<TeamContext | null>(null)
  const [awayCtx, setAwayCtx] = useState<TeamContext | null>(null)

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
  }, [game])

  const handleRefresh = () => { refresh(); setLastUpdated(new Date()) }

  if (isLoading && !game) return <MatchupPageSkeleton />
  if (error || !game) return <ErrorDisplay variant="full" title="Game Not Found" message="This MLB game could not be found." backLink="/mlb/matchups" backText="Back to MLB matchups" showRetry={false} />

  return (
    <MatchupLayout sport={sport} game={game} analytics={analytics} isLoading={isLoading} lastUpdated={lastUpdated} onRefresh={handleRefresh} activeTab={activeTab} onTabChange={setActiveTab}>
      <MatchupLayout.Grid>
        <MatchupLayout.MainContent>

          {/* RLM Alert */}
          {bettingIntelligence?.reverseLineMovement && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <span className="text-xs font-bold text-red-400">SHARP SIGNAL</span>
              <span className="text-xs text-gray-400">Reverse line movement detected</span>
            </div>
          )}

          {/* Umpire — MLB's key official */}
          <div className="relative">
            <span className="absolute top-2.5 right-2 z-10"><Tooltip content={TOOLTIPS.officials} /></span>
            <OfficialsPanel gameId={gameId} sport="mlb" />
          </div>

          {/* Power Ratings */}
          <div className="relative">
            <span className="absolute top-2.5 right-2 z-10"><Tooltip content={TOOLTIPS.powerRating} /></span>
            <PowerRatingsComparison sport="mlb" homeTeam={game.homeTeam.abbreviation} awayTeam={game.awayTeam.abbreviation} />
          </div>

          {/* AI Pick */}
          {topPick && (
            <div className="bg-[#0c0c14] rounded-lg border border-orange-500/20 p-3">
              <div className="flex items-center gap-2 mb-2"><Brain className="w-4 h-4 text-orange-400" /><span className="text-xs font-bold text-white">AI Pick</span><Tooltip content={TOOLTIPS.edgeScore} /></div>
              <div className="flex items-center justify-between p-2 bg-orange-500/10 rounded border border-orange-500/20">
                <div><div className="text-sm font-bold text-orange-400">{topPick.selection}</div><div className="text-[10px] text-gray-500">{topPick.supportingTrends} trends</div></div>
                <div className="text-xl font-black text-white">{topPick.confidence}%</div>
              </div>
            </div>
          )}

          {/* Betting Action */}
          <div className="bg-[#0c0c14] rounded-lg border border-white/5 p-3">
            <div className="flex items-center gap-2 mb-2"><DollarSign className="w-3.5 h-3.5 text-green-400" /><span className="text-xs font-bold text-white">Betting Action</span><Tooltip content={TOOLTIPS.lineMovement} /></div>
            <div className="grid grid-cols-4 gap-1.5">
              {[
                { label: 'Line Move', value: bettingIntelligence?.lineMovement || '—', color: bettingIntelligence?.lineMovement?.startsWith('-') ? 'text-red-400' : 'text-green-400' },
                { label: 'Public', value: bettingIntelligence?.publicPct ? `${bettingIntelligence.publicPct}%` : '—' },
                { label: 'Sharp', value: bettingIntelligence?.sharpPct ? `${bettingIntelligence.sharpPct}%` : '—', color: (bettingIntelligence?.sharpPct || 0) > 60 ? 'text-green-400' : 'text-white' },
                { label: 'Handle', value: bettingIntelligence?.handlePct ? `${bettingIntelligence.handlePct}%` : '—' },
              ].filter(m => m.value !== '—').map(m => (
                <div key={m.label} className="bg-[#16161e] rounded px-2 py-1.5 text-center">
                  <div className="text-[9px] text-gray-600 mb-0.5">{m.label}</div>
                  <div className={`text-sm font-bold ${m.color || 'text-white'}`}>{m.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Form — L10 for baseball */}
          {(homeCtx || awayCtx) && (
            <div className="bg-[#0c0c14] rounded-lg border border-white/5 p-3">
              <div className="flex items-center gap-2 mb-2"><Calendar className="w-3.5 h-3.5 text-blue-400" /><span className="text-xs font-bold text-white">Recent Form (L10)</span><Tooltip content={TOOLTIPS.restDays} /></div>
              <div className="grid grid-cols-2 gap-2">
                {[{ abbr: game.homeTeam.abbreviation, ctx: homeCtx }, { abbr: game.awayTeam.abbreviation, ctx: awayCtx }].map(t => (
                  <div key={t.abbr} className="bg-[#16161e] rounded px-2 py-2 text-center">
                    <div className="text-lg font-bold text-green-400">{t.ctx?.last5Record || ''}</div>
                    <div className="text-[9px] text-gray-600">{t.abbr} L10</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* H2H — Run Line labels */}
          {h2h && h2h.gamesPlayed > 0 && (
            <CollapsibleSection title={<>H2H History <Tooltip content={TOOLTIPS.h2h} /></>} icon={Users} badge={`${h2h.gamesPlayed}g`}>
              <div className="grid grid-cols-4 gap-1.5 mt-2">
                {[
                  { v: h2h.homeATSRecord, l: `${game.homeTeam.abbreviation} RL`, c: 'text-orange-400' },
                  { v: h2h.awayATSRecord, l: `${game.awayTeam.abbreviation} RL`, c: 'text-blue-400' },
                  { v: h2h.overUnderRecord, l: 'O/U', c: 'text-green-400' },
                  { v: h2h.avgTotal?.toFixed(1), l: 'AVG RUNS', c: 'text-white' },
                ].map(s => (
                  <div key={s.l} className="text-center p-1.5 bg-[#16161e] rounded">
                    <div className={`text-sm font-bold ${s.c}`}>{s.v}</div>
                    <div className="text-[9px] text-gray-600">{s.l}</div>
                  </div>
                ))}
              </div>
            </CollapsibleSection>
          )}

          {/* Trends */}
          {trends && trends.matched > 0 && (
            <CollapsibleSection title="Betting Trends" icon={TrendingUp} badge={trends.matched}>
              <div className="space-y-1.5 mt-2">
                {trends.spreadTrends?.slice(0, 5).map((t: any, i: number) => (
                  <div key={i} className="flex items-center justify-between p-1.5 bg-[#16161e] rounded text-xs">
                    <span className="text-gray-300">{t.description || t.text}</span>
                    <span className={`font-bold ${t.confidence >= 70 ? 'text-green-400' : 'text-amber-400'}`}>{t.confidence}%</span>
                  </div>
                ))}
                <Link href="/trends?sport=mlb" className="text-[10px] text-orange-400 hover:underline">View all →</Link>
              </div>
            </CollapsibleSection>
          )}

          {/* Player Props */}
          <CollapsibleSection title="Player Props" icon={Target}>
            <div className="mt-2"><GamePlayerProps gameId={gameId} sport="MLB" homeTeam={game.homeTeam.name} awayTeam={game.awayTeam.name} /></div>
          </CollapsibleSection>

        </MatchupLayout.MainContent>
        <MatchupLayout.Sidebar>
          {edgeScore && edgeScore.overall > 0 && <EdgeScoreCard edgeScore={edgeScore} gameId={gameId} />}
          {/* Weather — MLB is outdoor, wind matters */}
          <div className="relative">
            <span className="absolute top-2.5 right-2 z-10"><Tooltip content={TOOLTIPS.weather} /></span>
            <WeatherPanel venue={game.venue || ''} city={game.venue?.split(',').pop()?.trim() || ''} gameDate={game.scheduledAt || game.startTime} sport="mlb" compact={false} />
          </div>
          <InjuryReport sport={sport} homeTeam={game.homeTeam.abbreviation} awayTeam={game.awayTeam.abbreviation} homeTeamFull={game.homeTeam.name} awayTeamFull={game.awayTeam.name} />
          <div className="space-y-1.5">
            <Link href="/trends?sport=mlb" className="flex items-center justify-between p-2.5 bg-[#0c0c14] rounded-lg border border-white/5 hover:border-orange-500/30 transition-all group text-xs">
              <div className="flex items-center gap-2"><TrendingUp className="w-3.5 h-3.5 text-orange-500" /><span className="text-gray-300 group-hover:text-orange-400">All MLB Trends</span></div>
              <ChevronDown className="w-3 h-3 text-gray-600 -rotate-90" />
            </Link>
            <Link href="/lineshop" className="flex items-center justify-between p-2.5 bg-[#0c0c14] rounded-lg border border-white/5 hover:border-orange-500/30 transition-all group text-xs">
              <div className="flex items-center gap-2"><DollarSign className="w-3.5 h-3.5 text-green-500" /><span className="text-gray-300 group-hover:text-orange-400">Line Shop</span></div>
              <ChevronDown className="w-3 h-3 text-gray-600 -rotate-90" />
            </Link>
          </div>
        </MatchupLayout.Sidebar>
      </MatchupLayout.Grid>
    </MatchupLayout>
  )
}
