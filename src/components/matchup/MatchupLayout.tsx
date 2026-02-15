'use client'

/**
 * TRADING DESK MATCHUP LAYOUT
 * Redesigned per "The Whale" review.
 * Compact, dense, data-heavy — Bloomberg Terminal for sports bettors.
 * 
 * Zone 1: The Trading Desk header (teams, odds, splits, line sparkline)
 * Content area: Zone 2 (The Edge) + Zone 3 (Context)
 */

import { ReactNode, useState } from 'react'
import Link from 'next/link'
import { 
  ArrowLeft, Clock, RefreshCw, TrendingUp, BarChart3, 
  Users, Activity, Zap, ChevronDown, ChevronUp
} from 'lucide-react'
import type { Game, SportType, MatchupAnalytics } from '@/types/sports'
import { LineMovementChart } from '@/components/charts/LineMovementChart'

interface MatchupLayoutProps {
  sport: SportType
  game: Game
  analytics?: MatchupAnalytics | null
  isLoading?: boolean
  lastUpdated?: Date | null
  onRefresh?: () => void
  activeTab?: string
  onTabChange?: (tab: string) => void
  showTabs?: boolean
  children: ReactNode
}

const sportConfig: Record<string, { emoji: string; name: string; spreadLabel: string }> = {
  nfl: { emoji: '🏈', name: 'NFL', spreadLabel: 'Spread' },
  nba: { emoji: '🏀', name: 'NBA', spreadLabel: 'Spread' },
  nhl: { emoji: '🏒', name: 'NHL', spreadLabel: 'PL' },
  mlb: { emoji: '⚾', name: 'MLB', spreadLabel: 'RL' },
  ncaaf: { emoji: '🏈', name: 'NCAAF', spreadLabel: 'Spread' },
  ncaab: { emoji: '🏀', name: 'NCAAB', spreadLabel: 'Spread' },
  wnba: { emoji: '🏀', name: 'WNBA', spreadLabel: 'Spread' },
  wncaab: { emoji: '🏀', name: 'WNCAAB', spreadLabel: 'Spread' },
}

const tabs = [
  { id: 'overview', label: 'Overview', icon: Activity },
  { id: 'trends', label: 'Trends', icon: TrendingUp },
  { id: 'betting', label: 'Betting', icon: BarChart3 },
  { id: 'matchup', label: 'Matchup', icon: Users },
  { id: 'ai', label: 'AI', icon: Zap },
]

function fmtSpread(val: number | undefined | null): string {
  if (val === undefined || val === null || isNaN(val)) return ''
  if (val === 0) return 'PK'
  return val > 0 ? `+${val}` : `${val}`
}

function fmtOdds(val: number | undefined | null): string {
  if (!val) return ''
  return val > 0 ? `+${val}` : `${val}`
}

export default function MatchupLayout({
  sport, game, analytics, isLoading = false, lastUpdated, onRefresh,
  activeTab = 'overview', onTabChange, showTabs = true, children,
}: MatchupLayoutProps) {
  const config = sportConfig[sport] || sportConfig.nfl
  const isLive = game.status === 'live'
  const spread = game.odds?.spread
  const total = game.odds?.total
  const homeML = game.odds?.homeML
  const awayML = game.odds?.awayML
  const bi = analytics?.bettingIntelligence
  const topPick = analytics?.trends?.topPick

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric',
      hour: 'numeric', minute: '2-digit', timeZone: 'America/New_York'
    }) + ' ET'
  }

  return (
    <div className="min-h-screen bg-[#050508]">
      {/* ===== ZONE 1: THE TRADING DESK ===== */}
      <div className="border-b border-white/5 bg-[#0a0a12]">
        <div className="max-w-[1400px] mx-auto px-3">
          {/* Top bar */}
          <div className="flex items-center justify-between py-1.5 border-b border-white/5">
            <div className="flex items-center gap-3 min-w-0">
              <Link href={`/${sport}/matchups`} className="flex items-center gap-1 text-gray-500 hover:text-white transition-colors text-xs flex-shrink-0">
                <ArrowLeft className="w-3.5 h-3.5" /><span>{config.name}</span>
              </Link>
              <span className="text-gray-700 hidden sm:inline">|</span>
              <div className="hidden sm:flex items-center gap-1.5 text-xs text-gray-500">
                <Clock className="w-3 h-3" />
                <span>{formatTime(game.scheduledAt || game.startTime)}</span>
              </div>
              {game.venue && (
                <>
                  <span className="text-gray-700 hidden md:inline">|</span>
                  <span className="text-xs text-gray-600 truncate max-w-[180px] hidden md:inline">{game.venue}</span>
                </>
              )}
              {game.broadcast && (
                <>
                  <span className="text-gray-700 hidden lg:inline">|</span>
                  <span className="text-xs text-gray-500 hidden lg:inline">{game.broadcast}</span>
                </>
              )}
            </div>
            <div className="flex items-center gap-2">
              {isLive && (
                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-green-500/20 rounded text-xs">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-green-400 font-bold">LIVE</span>
                  {game.period && <span className="text-gray-400">{game.period} {game.clock}</span>}
                </div>
              )}
              {onRefresh && (
                <button onClick={onRefresh} disabled={isLoading} className="p-1.5 rounded hover:bg-white/5 text-gray-500 hover:text-white transition-colors">
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                </button>
              )}
            </div>
          </div>

          {/* THE TAPE: Teams + Market */}
          <div className="grid grid-cols-[1fr_auto_1fr] gap-0 items-center py-2">
            {/* Away Team */}
            <Link href={`/team/${sport}/${game.awayTeam.abbreviation?.toLowerCase()}`} className="flex items-center gap-2 group min-w-0">
              <div className="w-8 h-8 rounded bg-white/5 flex items-center justify-center overflow-hidden flex-shrink-0">
                {game.awayTeam.logo ? <img src={game.awayTeam.logo} alt="" className="w-7 h-7 object-contain" /> : <span className="text-sm">{config.emoji}</span>}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-white group-hover:text-orange-400 truncate">{game.awayTeam.name}</span>
                  {game.awayTeam.record && <span className="text-[10px] text-gray-600">{game.awayTeam.record}</span>}
                </div>
                {game.status !== 'scheduled' && <span className="text-xl font-black text-white">{game.awayTeam.score ?? ''}</span>}
              </div>
            </Link>

            {/* CENTER: The Market */}
            <div className="px-2 sm:px-3">
              {game.odds ? (
                <div className="flex items-center gap-1">
                  <div className="px-2 py-1 rounded bg-orange-500/10 border border-orange-500/20 text-center min-w-[60px]">
                    <div className="text-[8px] text-gray-500 uppercase tracking-wider">{config.spreadLabel}</div>
                    <div className="text-sm font-bold text-orange-400">{fmtSpread(spread)}</div>
                  </div>
                  <div className="px-2 py-1 rounded bg-green-500/10 border border-green-500/20 text-center min-w-[60px]">
                    <div className="text-[8px] text-gray-500 uppercase tracking-wider">O/U</div>
                    <div className="text-sm font-bold text-green-400">{total || ''}</div>
                  </div>
                  <div className="px-2 py-1 rounded bg-white/5 border border-white/10 text-center min-w-[80px] hidden sm:block">
                    <div className="text-[8px] text-gray-500 uppercase tracking-wider">ML</div>
                    <div className="flex items-center justify-center gap-1.5 text-xs">
                      <span className="text-gray-300 font-mono">{fmtOdds(awayML)}</span>
                      <span className="text-gray-700">/</span>
                      <span className="text-gray-300 font-mono">{fmtOdds(homeML)}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-gray-600 text-center px-4">—</div>
              )}
            </div>

            {/* Home Team */}
            <Link href={`/team/${sport}/${game.homeTeam.abbreviation?.toLowerCase()}`} className="flex items-center gap-2 justify-end group min-w-0">
              <div className="text-right min-w-0">
                <div className="flex items-center gap-2 justify-end">
                  {game.homeTeam.record && <span className="text-[10px] text-gray-600">{game.homeTeam.record}</span>}
                  <span className="text-sm font-bold text-white group-hover:text-orange-400 truncate">{game.homeTeam.name}</span>
                </div>
                {game.status !== 'scheduled' && <span className="text-xl font-black text-white">{game.homeTeam.score ?? ''}</span>}
              </div>
              <div className="w-8 h-8 rounded bg-white/5 flex items-center justify-center overflow-hidden flex-shrink-0">
                {game.homeTeam.logo ? <img src={game.homeTeam.logo} alt="" className="w-7 h-7 object-contain" /> : <span className="text-sm">{config.emoji}</span>}
              </div>
            </Link>
          </div>

          {/* SPLITS + SPARKLINE ROW */}
          <div className="flex items-center gap-3 py-1.5 border-t border-white/5 overflow-x-auto">
            {/* Sparklines */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-[10px] text-gray-600 uppercase tracking-wider">Line</span>
              <div className="w-[100px]">
                <LineMovementChart gameId={game.id} betType="spread" height={24} compact={true} showLabels={false} />
              </div>
              <div className="w-[100px]">
                <LineMovementChart gameId={game.id} betType="total" height={24} compact={true} showLabels={false} />
              </div>
            </div>

            <div className="w-px h-4 bg-white/10 flex-shrink-0" />

            {/* Splits */}
            {bi && (
              <div className="flex items-center gap-3 text-xs flex-shrink-0">
                {bi.publicPct !== undefined && bi.publicPct > 0 && (
                  <div className="flex items-center gap-1"><span className="text-gray-600">Tix</span><span className="font-mono font-bold text-white">{bi.publicPct}%</span></div>
                )}
                {bi.sharpPct !== undefined && bi.sharpPct > 0 && (
                  <div className="flex items-center gap-1"><span className="text-gray-600">$$$</span><span className={`font-mono font-bold ${bi.sharpPct > 60 ? 'text-green-400' : 'text-white'}`}>{bi.sharpPct}%</span></div>
                )}
                {bi.reverseLineMovement && (
                  <span className="px-1.5 py-0.5 bg-red-500/20 text-red-400 text-[10px] font-bold rounded border border-red-500/30 animate-pulse">RLM</span>
                )}
              </div>
            )}

            <div className="flex-1" />

            {/* Quick AI pick */}
            {topPick && (
              <div className="flex items-center gap-1.5 px-2 py-0.5 bg-orange-500/10 border border-orange-500/20 rounded flex-shrink-0">
                <Zap className="w-3 h-3 text-orange-400" />
                <span className="text-xs font-bold text-orange-400">{topPick.selection}</span>
                <span className="text-[10px] text-gray-500">{topPick.confidence}%</span>
              </div>
            )}
          </div>

          {/* TABS */}
          {showTabs && onTabChange && (
            <div className="flex items-center gap-0.5 border-t border-white/5 -mb-px overflow-x-auto">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <button key={tab.id} onClick={() => onTabChange(tab.id)}
                    className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium whitespace-nowrap transition-all border-b-2 ${
                      activeTab === tab.id ? 'border-orange-500 text-orange-400' : 'border-transparent text-gray-500 hover:text-white'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />{tab.label}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="max-w-[1400px] mx-auto px-3 py-3">{children}</div>
    </div>
  )
}

/* Sub-components */
interface ContentProps { children: ReactNode; className?: string }

export function MatchupMainContent({ children, className = '' }: ContentProps) {
  return <div className={`lg:col-span-2 space-y-3 ${className}`}>{children}</div>
}

export function MatchupSidebar({ children, className = '' }: ContentProps) {
  return <div className={`space-y-3 ${className}`}>{children}</div>
}

export function MatchupGrid({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">{children}</div>
}

/* Collapsible section — "drill in" for deep data */
export function CollapsibleSection({ title, icon: Icon, children, defaultOpen = false, badge }: {
  title: string; icon: any; children: ReactNode; defaultOpen?: boolean; badge?: string | number
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="bg-[#0c0c14] rounded-lg border border-white/5 overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between px-3 py-2 hover:bg-white/5 transition-colors">
        <div className="flex items-center gap-2">
          <Icon className="w-3.5 h-3.5 text-gray-500" />
          <span className="text-xs font-semibold text-gray-300">{title}</span>
          {badge !== undefined && <span className="text-[10px] px-1.5 py-0.5 bg-orange-500/20 text-orange-400 rounded">{badge}</span>}
        </div>
        {open ? <ChevronUp className="w-3.5 h-3.5 text-gray-600" /> : <ChevronDown className="w-3.5 h-3.5 text-gray-600" />}
      </button>
      {open && <div className="px-3 pb-3 border-t border-white/5">{children}</div>}
    </div>
  )
}

// Attach sub-components
MatchupLayout.MainContent = MatchupMainContent
MatchupLayout.Sidebar = MatchupSidebar
MatchupLayout.Grid = MatchupGrid
