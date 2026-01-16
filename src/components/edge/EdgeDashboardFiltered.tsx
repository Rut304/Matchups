// =============================================================================
// EDGE DASHBOARD WITH FILTERS - Client Component with Sports/Markets Separation
// =============================================================================

'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { 
  TrendingUp, 
  Target, 
  ChevronRight, 
  Zap,
  Shield,
  Brain,
  BarChart3,
  Clock,
  Users,
  ArrowUpRight,
  ArrowDownRight,
  Activity
} from 'lucide-react'
import { CategoryFilter, useCategoryFilter, SportFilter } from '@/components/filters'

export interface EdgeCard {
  gameId: string
  sport: string
  sportIcon: string
  matchup: string
  gameTime: string
  pick: string
  odds: string
  edgeScore: number
  confidence: number
  trendCount: number
  topTrends: string[]
  publicPct?: number
  publicSide: 'home' | 'away'
  sharpSide?: 'home' | 'away'
  lineMovement?: string
  isRLM?: boolean
  h2hRecord?: string
  category?: 'sports' | 'markets' // For filtering
}

interface EdgeDashboardFilteredProps {
  edges: EdgeCard[]
  title?: string
  showViewAll?: boolean
}

// Edge score color classes
function getEdgeScoreClasses(score: number): string {
  if (score >= 80) return 'text-green-400'
  if (score >= 65) return 'text-orange-500'
  if (score >= 50) return 'text-yellow-400'
  return 'text-gray-500'
}

// Confidence badge
function ConfidenceBadge({ confidence }: { confidence: number }) {
  const colorClasses = confidence >= 80 
    ? 'bg-green-400/20 text-green-400' 
    : confidence >= 65 
    ? 'bg-orange-500/20 text-orange-500' 
    : 'bg-yellow-400/20 text-yellow-400'
  
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${colorClasses}`}>
      {confidence}%
    </span>
  )
}

// Single Edge Card
function EdgeCardComponent({ edge }: { edge: EdgeCard }) {
  // Demo games (from fallback data) shouldn't link to non-existent pages
  const isDemo = edge.gameId.startsWith('demo-') || edge.gameId.startsWith('market-')
  const href = isDemo 
    ? `/${edge.sport.toLowerCase()}` // Link to sport page instead of non-existent game
    : `/game/${edge.gameId}?sport=${edge.sport.toLowerCase()}`
  
  return (
    <Link href={href}>
      <div className="rounded-xl p-4 hover:scale-[1.02] transition-all cursor-pointer group bg-zinc-900/80 border border-white/5 shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">{edge.sportIcon}</span>
            <div>
              <p className="text-xs font-medium text-gray-500">{edge.sport}</p>
              <p className="text-sm font-bold text-white">{edge.matchup}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-3 h-3 text-gray-600" />
            <span className="text-xs text-gray-600">{edge.gameTime}</span>
          </div>
        </div>

        {/* Main Pick */}
        <div className="rounded-lg p-3 mb-3 bg-orange-500/10 border border-orange-500/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium mb-1 text-orange-500">THE EDGE</p>
              <p className="text-lg font-bold text-white">{edge.pick}</p>
              <p className="text-sm text-gray-400">{edge.odds}</p>
            </div>
            <div className="text-right">
              <div className={`text-3xl font-black ${getEdgeScoreClasses(edge.edgeScore)}`}>
                {edge.edgeScore}
              </div>
              <p className="text-xs text-gray-600">Edge Score</p>
            </div>
          </div>
        </div>

        {/* Trend Alignment */}
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="w-3.5 h-3.5 text-green-400" />
          <span className="text-sm font-medium text-green-400">
            {edge.trendCount} Trends Align
          </span>
          <ConfidenceBadge confidence={edge.confidence} />
        </div>

        {/* Top Trends */}
        <div className="space-y-1 mb-3">
          {edge.topTrends.slice(0, 2).map((trend, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
              <span className="text-xs text-gray-400">{trend}</span>
            </div>
          ))}
        </div>

        {/* Market Signals */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          {edge.publicPct !== undefined && (
            <div className="rounded-lg p-2 bg-white/[0.03]">
              <div className="flex items-center gap-1 mb-1">
                <Users className="w-2.5 h-2.5 text-gray-600" />
                <span className="text-xs text-gray-600">Public</span>
              </div>
              <p className="text-sm font-semibold text-gray-400">
                {edge.publicPct}% {edge.publicSide === 'home' ? 'Home' : 'Away'}
              </p>
            </div>
          )}
          {edge.lineMovement && (
            <div className="rounded-lg p-2 bg-white/[0.03]">
              <div className="flex items-center gap-1 mb-1">
                <BarChart3 className="w-2.5 h-2.5 text-gray-600" />
                <span className="text-xs text-gray-600">Line Move</span>
              </div>
              <div className="flex items-center gap-1">
                {edge.lineMovement.startsWith('+') ? (
                  <ArrowUpRight className="w-3 h-3 text-green-400" />
                ) : (
                  <ArrowDownRight className="w-3 h-3 text-red-400" />
                )}
                <p className="text-sm font-semibold text-gray-400">
                  {edge.lineMovement}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* RLM Indicator */}
        {edge.isRLM && (
          <div className="rounded-xl p-2 flex items-center gap-2 mb-3 bg-yellow-400/10 border border-yellow-400/30">
            <Zap className="w-3.5 h-3.5 text-yellow-400" />
            <span className="text-xs font-semibold text-yellow-400">
              Reverse Line Movement - Sharp Money Signal
            </span>
          </div>
        )}

        {/* H2H Quick Stat */}
        {edge.h2hRecord && (
          <div className="flex items-center gap-2">
            <Shield className="w-3 h-3 text-gray-600" />
            <span className="text-xs text-gray-600">H2H: {edge.h2hRecord}</span>
          </div>
        )}

        {/* View More */}
        <div className="flex items-center justify-center gap-1 mt-3 pt-3 group-hover:text-white transition-colors border-t border-white/5 text-gray-600">
          <span className="text-xs font-medium">Full Analysis</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </div>
      </div>
    </Link>
  )
}

// Main Dashboard Component with Filters
export function EdgeDashboardFiltered({ 
  edges, 
  title = "Today's Top Edges", 
  showViewAll = true 
}: EdgeDashboardFilteredProps) {
  const {
    mainCategory,
    setMainCategory,
    sportFilter,
    setSportFilter,
    marketFilter,
    setMarketFilter,
  } = useCategoryFilter('sports')

  // Filter edges based on selection
  const filteredEdges = useMemo(() => {
    let result = edges

    // Filter by main category (for now, all demo data is sports)
    if (mainCategory === 'markets') {
      // Filter for prediction market related edges
      result = result.filter(e => e.category === 'markets')
    } else {
      // Default to sports
      result = result.filter(e => !e.category || e.category === 'sports')
    }

    // Filter by sport if not 'all'
    if (mainCategory === 'sports' && sportFilter !== 'all') {
      const sportMap: Record<SportFilter, string[]> = {
        all: [],
        nfl: ['NFL', 'NCAAF'],
        nba: ['NBA', 'NCAAB'],
        nhl: ['NHL'],
        mlb: ['MLB'],
        ncaaf: ['NCAAF'],
        ncaab: ['NCAAB'],
      }
      const validSports = sportMap[sportFilter]
      result = result.filter(e => validSports.includes(e.sport))
    }

    return result
  }, [edges, mainCategory, sportFilter])

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="space-y-4">
        {/* Header with Filters */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-orange-500/10 border border-orange-500/20">
              <Target className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{title}</h2>
              <p className="text-xs text-gray-500">AI-powered edge detection across all markets</p>
            </div>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-green-400/20 text-green-400">
              {filteredEdges.length} ACTIVE
            </span>
          </div>
          
          {/* Category Filter */}
          <CategoryFilter
            mainCategory={mainCategory}
            onMainCategoryChange={setMainCategory}
            sportFilter={sportFilter}
            onSportFilterChange={setSportFilter}
            marketFilter={marketFilter}
            onMarketFilterChange={setMarketFilter}
          />
        </div>

        {/* System Performance Banner */}
        <div className="rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-gradient-to-r from-orange-500/10 to-blue-500/10 border border-orange-500/20">
          <div className="flex items-center gap-3">
            <Brain className="text-orange-500 w-6 h-6" />
            <div>
              <p className="text-sm font-bold text-white">20-Year Track Record</p>
              <p className="text-xs text-gray-400">40,852 picks analyzed • 58.4% win rate • +9.0% ROI</p>
            </div>
          </div>
          <Link href="/performance" className="text-xs font-medium hover:underline text-orange-500">
            View Performance →
          </Link>
        </div>

        {/* Empty State */}
        {filteredEdges.length === 0 ? (
          <div className="rounded-xl p-8 text-center bg-zinc-900/80 border border-white/5">
            <Activity className="w-12 h-12 mx-auto mb-4 text-gray-600" />
            <p className="text-gray-400 mb-2">
              {mainCategory === 'markets' 
                ? 'No prediction market edges detected for today.'
                : `No ${sportFilter === 'all' ? 'sports' : sportFilter.toUpperCase()} edges detected for today.`
              }
            </p>
            <p className="text-xs text-gray-600">
              Check back later or try a different filter.
            </p>
          </div>
        ) : (
          /* Edge Cards Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredEdges.map((edge, i) => (
              <EdgeCardComponent key={edge.gameId || i} edge={edge} />
            ))}
          </div>
        )}

        {/* View All Link */}
        {showViewAll && filteredEdges.length > 0 && (
          <div className="flex justify-center">
            <Link 
              href="/analytics" 
              className="inline-flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-semibold transition-all hover:scale-105 bg-orange-500/10 border border-orange-500/20 text-orange-400"
            >
              View All Edges <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </div>
    </section>
  )
}

export default EdgeDashboardFiltered
