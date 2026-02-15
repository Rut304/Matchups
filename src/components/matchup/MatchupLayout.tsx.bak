'use client'

/**
 * Standardized Matchup Page Layout
 * 
 * This component provides a consistent structure for all sport matchup pages.
 * It includes:
 * - Responsive header with team logos, scores, and odds
 * - Navigation tabs for different data views
 * - Main content area with 2-column layout (main + sidebar)
 * - Mobile-responsive design
 * 
 * Usage:
 * <MatchupLayout sport="nfl" game={game} analytics={analytics}>
 *   <MatchupLayout.MainContent>...</MatchupLayout.MainContent>
 *   <MatchupLayout.Sidebar>...</MatchupLayout.Sidebar>
 * </MatchupLayout>
 */

import { ReactNode } from 'react'
import Link from 'next/link'
import { 
  ArrowLeft, Clock, RefreshCw, ChevronDown, TrendingUp, 
  BarChart3, Users, Activity, Zap, Target
} from 'lucide-react'
import type { Game, SportType, MatchupAnalytics, SPORT_CONFIGS } from '@/types/sports'
import AIPredictionCard from './AIPredictionCard'

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

// Sport-specific configurations
const sportConfig: Record<SportType, { emoji: string; name: string; spreadLabel: string }> = {
  nfl: { emoji: '🏈', name: 'NFL', spreadLabel: 'Spread' },
  nba: { emoji: '🏀', name: 'NBA', spreadLabel: 'Spread' },
  nhl: { emoji: '🏒', name: 'NHL', spreadLabel: 'Puck Line' },
  mlb: { emoji: '⚾', name: 'MLB', spreadLabel: 'Run Line' },
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
  { id: 'ai', label: 'AI Picks', icon: Zap },
]

export default function MatchupLayout({
  sport,
  game,
  analytics,
  isLoading = false,
  lastUpdated,
  onRefresh,
  activeTab = 'overview',
  onTabChange,
  showTabs = true,
  children,
}: MatchupLayoutProps) {
  const config = sportConfig[sport]
  const isLive = game.status === 'live'
  
  // Get spread value
  const getSpread = () => {
    if (!game.odds) return null
    const spread = game.odds.spread
    if (spread === 0) return 'PK'
    return spread > 0 ? `+${spread}` : spread.toString()
  }

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZone: 'America/New_York'
    }) + ' ET'
  }

  return (
    <div className="min-h-screen bg-[#050508]">
      {/* Header */}
      <div className="border-b border-white/5 bg-[#0a0a12]">
        <div className="max-w-[1400px] mx-auto px-3 py-3">
          {/* Top bar with back button and refresh */}
          <div className="flex items-center justify-between mb-2">
            <Link 
              href={`/${sport}/matchups`} 
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="text-sm">Back to matchups</span>
            </Link>
            
            {onRefresh && (
              <button 
                onClick={onRefresh}
                disabled={isLoading}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 text-gray-400 hover:bg-white/10 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                {lastUpdated && (
                  <span className="text-xs hidden sm:inline">
                    Updated {lastUpdated.toLocaleTimeString()}
                  </span>
                )}
              </button>
            )}
          </div>

          {/* Sport and Date */}
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
            <span className="text-sm">{config.emoji}</span>
            <span>{config.name}</span>
            <span className="text-gray-700">•</span>
            <Clock className="w-4 h-4" />
            <span>{formatDateTime(game.scheduledAt || game.startTime)}</span>
          </div>

          {/* Teams Matchup Header - Compact */}
          <div className="grid grid-cols-3 gap-2 items-center py-1">
            {/* Away Team */}
            <Link 
              href={`/team/${sport}/${game.awayTeam.abbreviation?.toLowerCase()}`}
              className="flex items-center gap-2 md:gap-3 group hover:opacity-80 transition-opacity"
            >
              <div className="w-9 h-9 md:w-12 md:h-12 rounded-lg bg-white/5 flex items-center justify-center overflow-hidden group-hover:ring-2 ring-orange-500/50 transition-all flex-shrink-0">
                {game.awayTeam.logo ? (
                  <img src={game.awayTeam.logo} alt={game.awayTeam.name} className="w-7 h-7 md:w-10 md:h-10 object-contain" />
                ) : (
                  <span className="text-lg md:text-2xl">{config.emoji}</span>
                )}
              </div>
              <div className="min-w-0">
                <div className="text-sm md:text-base font-bold text-white group-hover:text-orange-400 transition-colors truncate">
                  {game.awayTeam.name}
                </div>
                <div className="text-[10px] text-gray-500">{game.awayTeam.record || ''}</div>
                {game.status !== 'scheduled' && (
                  <div className="text-lg md:text-xl font-black text-white">{game.awayTeam.score ?? '-'}</div>
                )}
              </div>
            </Link>

            {/* Center - Odds & Status - Compact */}
            <div className="text-center">
              <div className="text-gray-500 text-[10px] mb-0.5">VS</div>
              
              {game.odds && (
                <div className="flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2">
                  <div className="inline-flex flex-col px-2 py-1 rounded bg-orange-500/10 border border-orange-500/30">
                    <div className="text-[9px] text-gray-500">{config.spreadLabel.toUpperCase()}</div>
                    <div className="text-xs md:text-sm font-bold text-orange-400">
                      {game.awayTeam.abbreviation} {getSpread()}
                    </div>
                  </div>
                  <div className="inline-flex flex-col px-2 py-1 rounded bg-green-500/10 border border-green-500/30">
                    <div className="text-[9px] text-gray-500">TOTAL</div>
                    <div className="text-xs md:text-sm font-bold text-green-400">O/U {game.odds.total}</div>
                  </div>
                </div>
              )}
              
              {isLive && (
                <div className="mt-2 flex items-center justify-center gap-2 px-2 py-1 bg-green-500/20 rounded-lg">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-green-400 font-bold text-xs">LIVE</span>
                  {game.period && (
                    <span className="text-gray-400 text-xs">• {game.period} {game.clock}</span>
                  )}
                </div>
              )}
            </div>

            {/* Home Team */}
            <Link 
              href={`/team/${sport}/${game.homeTeam.abbreviation?.toLowerCase()}`}
              className="flex items-center gap-2 md:gap-3 justify-end group hover:opacity-80 transition-opacity"
            >
              <div className="text-right min-w-0">
                <div className="text-sm md:text-base font-bold text-white group-hover:text-orange-400 transition-colors truncate">
                  {game.homeTeam.name}
                </div>
                <div className="text-[10px] text-gray-500">{game.homeTeam.record || ''}</div>
                {game.status !== 'scheduled' && (
                  <div className="text-lg md:text-xl font-black text-white">{game.homeTeam.score ?? '-'}</div>
                )}
              </div>
              <div className="w-9 h-9 md:w-12 md:h-12 rounded-lg bg-white/5 flex items-center justify-center overflow-hidden group-hover:ring-2 ring-orange-500/50 transition-all flex-shrink-0">
                {game.homeTeam.logo ? (
                  <img src={game.homeTeam.logo} alt={game.homeTeam.name} className="w-7 h-7 md:w-10 md:h-10 object-contain" />
                ) : (
                  <span className="text-lg md:text-2xl">{config.emoji}</span>
                )}
              </div>
            </Link>
          </div>

          {/* AI Prediction Banner */}
          {analytics?.trends?.topPick && (
            <AIPredictionCard prediction={analytics.trends.topPick} />
          )}

          {/* Tabs Navigation */}
          {showTabs && onTabChange && (
            <div className="mt-4 flex items-center gap-1 overflow-x-auto pb-2 -mb-2 scrollbar-hide">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => onTabChange(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                      activeTab === tab.id 
                        ? 'bg-orange-500 text-white' 
                        : 'text-gray-400 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[1400px] mx-auto px-3 py-4">
        {children}
      </div>
    </div>
  )
}

// Sub-components for content areas
interface ContentProps {
  children: ReactNode
  className?: string
}

export function MatchupMainContent({ children, className = '' }: ContentProps) {
  return (
    <div className={`lg:col-span-2 space-y-6 ${className}`}>
      {children}
    </div>
  )
}

export function MatchupSidebar({ children, className = '' }: ContentProps) {
  return (
    <div className={`space-y-6 ${className}`}>
      {children}
    </div>
  )
}

export function MatchupGrid({ children }: { children: ReactNode }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {children}
    </div>
  )
}

// Export sub-components attached to main component
MatchupLayout.MainContent = MatchupMainContent
MatchupLayout.Sidebar = MatchupSidebar
MatchupLayout.Grid = MatchupGrid
