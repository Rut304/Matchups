'use client'

/**
 * NFL GAME MATCHUP PAGE — "The Whale" Edition
 * 
 * Structure:
 * - Trading Desk header (in MatchupLayout): teams, odds, splits, sparkline
 * - Zone 2: THE EDGE (Officials, Power Ratings, AI Pick, Sharp Signals)
 * - Zone 3: CONTEXT (H2H, Trends, Rankings — collapsible)
 * - Sidebar: Edge Score, Injuries, Weather, Game Info
 */

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { 
  TrendingUp, Zap, ChevronDown, Users, Shield, BarChart3, DollarSign,
  ChevronUp, Brain, AlertTriangle, Calendar, ExternalLink, Gavel, 
  Cloud, Trophy, Target, Swords
} from 'lucide-react'
import { useMatchupData } from '@/hooks'
import { 
  MatchupLayout, InjuryReport, EdgeScoreCard, GameInfo, MatchupPageSkeleton, CollapsibleSection
} from '@/components/matchup'
import { GamePlayerProps } from '@/components/game'
import { OfficialsPanel } from '@/components/betting/OfficialsPanel'
import { WeatherPanel } from '@/components/betting/WeatherPanel'
import { PowerRatingsComparison } from '@/components/betting/PowerRatingsComparison'
import ErrorDisplay from '@/components/matchup/ErrorDisplay'
import type { SportType } from '@/types/sports'

const aiCache = new Map<string, { analysis: string; ts: number; snap: string }>()

interface TeamRankings { offenseRank: number; offenseYPG: number; defenseRank: number; defenseYPG: number }
interface BettingSplitData { spreadTicketPct: number; spreadMoneyPct: number; lineMovement: string; isRLM: boolean }

export default function GameMatchupPage({ params }: { params: Promise<{ gameId: string }> }) {
  const { gameId } = use(params)
  const sport: SportType = 'nfl'
  
  const { game, analytics, isLoading, error, refresh, topPick, bettingIntelligence, h2h, edgeScore, trends } = useMatchupData(gameId, sport)
  
  const [activeTab, setActiveTab] = useState('overview')
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [bettingSplits, setBettingSplits] = useState<BettingSplitData | null>(null)
  const [homeRankings, setHomeRankings] = useState<TeamRankings | null>(null)
  const [awayRankings, setAwayRankings] = useState<TeamRankings | null>(null)
  const [aiAnalysis, setAiAnalysis] = useState('')
  const [homeSchedule, setHomeSchedule] = useState<any[]>([])
  const [awaySchedule, setAwaySchedule] = useState<any[]>([])

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
        fetch(`/api/team/nfl/${homeAbbr}/schedule?limit=5`).then(r => r.ok ? r.json() : null),
        fetch(`/api/team/nfl/${awayAbbr}/schedule?limit=5`).then(r => r.ok ? r.json() : null),
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
    }
    fetchAll()
  }, [game, gameId])

  const handleRefresh = () => { refresh(); setLastUpdated(new Date()) }

  if (isLoading && !game) return <MatchupPageSkeleton />
  if (error || !game) {
    return <ErrorDisplay variant="full" title="Game Not Found" message="This NFL game could not be found." backLink="/nfl/matchups" backText="Back to NFL matchups" showRetry={false} />
  }

  const homeWins = homeSchedule.filter((g: any) => g.result === 'W').length
  const awayWins = awaySchedule.filter((g: any) => g.result === 'W').length

  return (
    <MatchupLayout sport={sport} game={game} analytics={analytics} isLoading={isLoading} lastUpdated={lastUpdated} onRefresh={handleRefresh} activeTab={activeTab} onTabChange={setActiveTab}>
      <MatchupLayout.Grid>
        <MatchupLayout.MainContent>

          {/* ===== ZONE 2: THE EDGE ===== */}

          {/* RLM Alert — Sharp Signal */}
          {(bettingSplits?.isRLM || bettingIntelligence?.reverseLineMovement) && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <span className="text-xs font-bold text-red-400">SHARP SIGNAL</span>
              <span className="text-xs text-gray-400">Reverse line movement — money on {(bettingSplits?.spreadTicketPct || 50) > 50 ? game.awayTeam.abbreviation : game.homeTeam.abbreviation}</span>
            </div>
          )}

          {/* Officials — THE differentiator */}
          <OfficialsPanel gameId={gameId} sport="nfl" />

          {/* Power Ratings — Elo Comparison */}
          <PowerRatingsComparison sport="nfl" homeTeam={game.homeTeam.abbreviation} awayTeam={game.awayTeam.abbreviation} />

          {/* AI Analysis — The Edge */}
          {(topPick || aiAnalysis) && (
            <div className="bg-[#0c0c14] rounded-lg border border-orange-500/20 p-3">
              <div className="flex items-center gap-2 mb-2">
                <Brain className="w-4 h-4 text-orange-400" />
                <span className="text-xs font-bold text-white">The Edge Analysis</span>
              </div>
              {topPick && (
                <div className="flex items-center justify-between mb-2 p-2 bg-orange-500/10 rounded border border-orange-500/20">
                  <div>
                    <div className="text-xs text-gray-400">AI PICK</div>
                    <div className="text-sm font-bold text-orange-400">{topPick.selection}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-black text-white">{topPick.confidence}%</div>
                    <div className="text-[10px] text-gray-500">{topPick.supportingTrends} trends</div>
                  </div>
                </div>
              )}
              {aiAnalysis && <p className="text-xs text-gray-400 leading-relaxed">{aiAnalysis}</p>}
            </div>
          )}

          {/* Betting Action — Compact */}
          <div className="bg-[#0c0c14] rounded-lg border border-white/5 p-3">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-3.5 h-3.5 text-green-400" />
              <span className="text-xs font-bold text-white">Betting Action</span>
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {[
                { label: 'Line Move', value: bettingSplits?.lineMovement || bettingIntelligence?.lineMovement || '—', color: bettingSplits?.lineMovement?.startsWith('-') ? 'text-red-400' : bettingSplits?.lineMovement?.startsWith('+') ? 'text-green-400' : 'text-gray-400' },
                { label: 'Public', value: bettingSplits ? `${bettingSplits.spreadTicketPct}%` : `${bettingIntelligence?.publicPct || 0}%`, sub: (bettingSplits?.spreadTicketPct || bettingIntelligence?.publicPct || 50) > 50 ? game.homeTeam.abbreviation : game.awayTeam.abbreviation },
                { label: 'Sharp $', value: bettingSplits ? `${bettingSplits.spreadMoneyPct}%` : '—', color: (bettingSplits?.spreadMoneyPct || 0) > 60 ? 'text-green-400' : 'text-white' },
                { label: 'Handle', value: `${bettingIntelligence?.handlePct || 0}%` },
              ].map(m => (
                <div key={m.label} className="bg-[#16161e] rounded px-2 py-1.5 text-center">
                  <div className="text-[9px] text-gray-600 mb-0.5">{m.label}</div>
                  <div className={`text-sm font-bold ${m.color || 'text-white'}`}>{m.value}</div>
                  {m.sub && <div className="text-[9px] text-gray-600">{m.sub}</div>}
                </div>
              ))}
            </div>
          </div>

          {/* ===== ZONE 3: CONTEXT (Collapsible — drill in) ===== */}

          {/* H2H — Behind a click */}
          {h2h && h2h.gamesPlayed > 0 && (
            <CollapsibleSection title="H2H History" icon={Users} badge={`${h2h.gamesPlayed}g`}>
              <div className="grid grid-cols-4 gap-1.5 mt-2">
                <div className="text-center p-1.5 bg-[#16161e] rounded">
                  <div className="text-sm font-bold text-orange-400">{h2h.homeATSRecord}</div>
                  <div className="text-[9px] text-gray-600">{game.homeTeam.abbreviation} ATS</div>
                </div>
                <div className="text-center p-1.5 bg-[#16161e] rounded">
                  <div className="text-sm font-bold text-blue-400">{h2h.awayATSRecord}</div>
                  <div className="text-[9px] text-gray-600">{game.awayTeam.abbreviation} ATS</div>
                </div>
                <div className="text-center p-1.5 bg-[#16161e] rounded">
                  <div className="text-sm font-bold text-green-400">{h2h.overUnderRecord}</div>
                  <div className="text-[9px] text-gray-600">O/U</div>
                </div>
                <div className="text-center p-1.5 bg-[#16161e] rounded">
                  <div className="text-sm font-bold text-white">{h2h.avgTotal?.toFixed(1) || '—'}</div>
                  <div className="text-[9px] text-gray-600">AVG PTS</div>
                </div>
              </div>
            </CollapsibleSection>
          )}

          {/* Trends — Behind a click */}
          {trends && trends.matched > 0 && (
            <CollapsibleSection title="Betting Trends" icon={TrendingUp} badge={trends.matched}>
              <div className="space-y-1.5 mt-2">
                {trends.spreadTrends?.slice(0, 5).map((trend: any, i: number) => (
                  <div key={i} className="flex items-center justify-between p-1.5 bg-[#16161e] rounded text-xs">
                    <span className="text-gray-300">{trend.description || trend.text}</span>
                    <span className={`font-bold ${trend.confidence >= 70 ? 'text-green-400' : 'text-amber-400'}`}>{trend.confidence}%</span>
                  </div>
                ))}
                <Link href={`/trends?sport=nfl&team=${game.homeTeam.abbreviation}`} className="text-[10px] text-orange-400 hover:underline">View all trends →</Link>
              </div>
            </CollapsibleSection>
          )}

          {/* Team Rankings — Behind a click */}
          {(homeRankings || awayRankings) && (
            <CollapsibleSection title="Team Rankings" icon={BarChart3}>
              <div className="grid grid-cols-2 gap-3 mt-2">
                <div>
                  <div className="text-[10px] text-gray-600 mb-1">{game.homeTeam.abbreviation} (Home)</div>
                  <div className="grid grid-cols-2 gap-1.5">
                    <div className="bg-[#16161e] rounded p-2 text-center">
                      <div className="flex items-center justify-center gap-1 text-orange-400 mb-0.5"><Swords className="w-3 h-3" /><span className="text-[9px]">OFF</span></div>
                      <div className="text-sm font-bold text-white">#{homeRankings?.offenseRank || '—'}</div>
                      <div className="text-[9px] text-gray-600">{homeRankings?.offenseYPG?.toFixed(1) || '—'} YPG</div>
                    </div>
                    <div className="bg-[#16161e] rounded p-2 text-center">
                      <div className="flex items-center justify-center gap-1 text-blue-400 mb-0.5"><Shield className="w-3 h-3" /><span className="text-[9px]">DEF</span></div>
                      <div className="text-sm font-bold text-white">#{homeRankings?.defenseRank || '—'}</div>
                      <div className="text-[9px] text-gray-600">{homeRankings?.defenseYPG?.toFixed(1) || '—'} YPG</div>
                    </div>
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-gray-600 mb-1">{game.awayTeam.abbreviation} (Away)</div>
                  <div className="grid grid-cols-2 gap-1.5">
                    <div className="bg-[#16161e] rounded p-2 text-center">
                      <div className="flex items-center justify-center gap-1 text-orange-400 mb-0.5"><Swords className="w-3 h-3" /><span className="text-[9px]">OFF</span></div>
                      <div className="text-sm font-bold text-white">#{awayRankings?.offenseRank || '—'}</div>
                      <div className="text-[9px] text-gray-600">{awayRankings?.offenseYPG?.toFixed(1) || '—'} YPG</div>
                    </div>
                    <div className="bg-[#16161e] rounded p-2 text-center">
                      <div className="flex items-center justify-center gap-1 text-blue-400 mb-0.5"><Shield className="w-3 h-3" /><span className="text-[9px]">DEF</span></div>
                      <div className="text-sm font-bold text-white">#{awayRankings?.defenseRank || '—'}</div>
                      <div className="text-[9px] text-gray-600">{awayRankings?.defenseYPG?.toFixed(1) || '—'} YPG</div>
                    </div>
                  </div>
                </div>
              </div>
            </CollapsibleSection>
          )}

          {/* Recent Form — Behind a click */}
          {(homeSchedule.length > 0 || awaySchedule.length > 0) && (
            <CollapsibleSection title="Recent Form (Last 5)" icon={Calendar}>
              <div className="grid grid-cols-2 gap-3 mt-2">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-gray-600">{game.homeTeam.abbreviation}</span>
                    <Link href={`/team/nfl/${game.homeTeam.abbreviation.toLowerCase()}`} className="text-[10px] text-orange-400 hover:underline">Full →</Link>
                  </div>
                  <div className="bg-[#16161e] rounded p-2 text-center">
                    <div className="text-lg font-bold text-green-400">{homeWins}-{homeSchedule.length - homeWins}</div>
                  </div>
                  <div className="flex gap-0.5 mt-1 justify-center">
                    {homeSchedule.map((g: any, i: number) => (
                      <div key={i} className={`w-5 h-5 rounded text-[10px] font-bold flex items-center justify-center ${g.result === 'W' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                        {g.result || '—'}
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-gray-600">{game.awayTeam.abbreviation}</span>
                    <Link href={`/team/nfl/${game.awayTeam.abbreviation.toLowerCase()}`} className="text-[10px] text-orange-400 hover:underline">Full →</Link>
                  </div>
                  <div className="bg-[#16161e] rounded p-2 text-center">
                    <div className="text-lg font-bold text-green-400">{awayWins}-{awaySchedule.length - awayWins}</div>
                  </div>
                  <div className="flex gap-0.5 mt-1 justify-center">
                    {awaySchedule.map((g: any, i: number) => (
                      <div key={i} className={`w-5 h-5 rounded text-[10px] font-bold flex items-center justify-center ${g.result === 'W' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                        {g.result || '—'}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CollapsibleSection>
          )}

          {/* Player Props — Behind a click */}
          <CollapsibleSection title="Player Props" icon={Target}>
            <div className="mt-2">
              <GamePlayerProps gameId={gameId} sport="NFL" homeTeam={game.homeTeam.name} awayTeam={game.awayTeam.name} />
            </div>
          </CollapsibleSection>

        </MatchupLayout.MainContent>

        <MatchupLayout.Sidebar>
          {/* Edge Score — Always visible */}
          {edgeScore && edgeScore.overall > 0 && <EdgeScoreCard edgeScore={edgeScore} gameId={gameId} />}
          
          {/* Weather — NFL is outdoor */}
          <WeatherPanel 
            venue={game.venue || ''} 
            city={game.venue?.split(',').pop()?.trim() || ''} 
            gameDate={game.scheduledAt || game.startTime} 
            sport="nfl" 
            compact={false} 
          />

          {/* Injury Report — Always visible for serious bettors */}
          <InjuryReport sport={sport} homeTeam={game.homeTeam.abbreviation} awayTeam={game.awayTeam.abbreviation} homeTeamFull={game.homeTeam.name} awayTeamFull={game.awayTeam.name} />
          
          {/* Quick Links */}
          <div className="space-y-1.5">
            <Link href="/trends?sport=nfl" className="flex items-center justify-between p-2.5 bg-[#0c0c14] rounded-lg border border-white/5 hover:border-orange-500/30 transition-all group text-xs">
              <div className="flex items-center gap-2"><TrendingUp className="w-3.5 h-3.5 text-orange-500" /><span className="text-gray-300 group-hover:text-orange-400">All NFL Trends</span></div>
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
