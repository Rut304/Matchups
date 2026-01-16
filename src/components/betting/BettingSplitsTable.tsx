'use client'

/**
 * BettingSplitsTable Component
 * Displays public betting %, sharp money %, RLM, and steam move indicators
 * with sortable columns for all games
 */

import { useState } from 'react'
import { SortableDataTable, CellRenderers, type ColumnDef } from '@/components/ui/SortableDataTable'
import { TrendingUp, TrendingDown, AlertTriangle, Zap, Users, DollarSign } from 'lucide-react'

// =============================================================================
// TYPES
// =============================================================================

export interface BettingSplitRow {
  gameId: string
  sport: string
  homeTeam: string
  awayTeam: string
  gameTime: string
  spread: number
  total: number
  homeML: number
  awayML: number
  spreadHomePublicPct: number
  spreadAwayPublicPct: number
  spreadHomeMoneyPct: number
  spreadAwayMoneyPct: number
  totalOverPublicPct: number
  totalUnderPublicPct: number
  totalOverMoneyPct: number
  totalUnderMoneyPct: number
  isRLM: boolean
  rlmSide: string | null
  rlmConfidence: number
  isSteamMove: boolean
  steamDirection: string | null
  sharpSide: string | null
  sharpConfidence: number
}

interface BettingSplitsTableProps {
  data: BettingSplitRow[]
  onRowClick?: (row: BettingSplitRow) => void
  loading?: boolean
  sport?: string
}

// =============================================================================
// BADGE COMPONENTS
// =============================================================================

function RLMBadge({ side, confidence }: { side: string | null; confidence: number }) {
  if (!side) return <span className="text-gray-600">-</span>
  
  return (
    <div className="flex items-center gap-1">
      <span className="px-2 py-0.5 bg-orange-500/20 text-orange-400 text-xs rounded-full font-medium flex items-center gap-1">
        <AlertTriangle className="w-3 h-3" />
        {side.toUpperCase()}
      </span>
      <span className="text-xs text-gray-500">{confidence}%</span>
    </div>
  )
}

function SteamBadge({ direction }: { direction: string | null }) {
  if (!direction) return <span className="text-gray-600">-</span>
  
  return (
    <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-xs rounded-full font-medium flex items-center gap-1">
      <Zap className="w-3 h-3" />
      {direction.toUpperCase()}
    </span>
  )
}

function SharpBadge({ side, confidence }: { side: string | null; confidence: number }) {
  if (!side) return <span className="text-gray-600">-</span>
  
  const bgColor = confidence >= 70 ? 'bg-purple-500/30' : 'bg-purple-500/20'
  
  return (
    <div className="flex items-center gap-1">
      <span className={`px-2 py-0.5 ${bgColor} text-purple-400 text-xs rounded-full font-medium`}>
        💰 {side.toUpperCase()}
      </span>
      <span className="text-xs text-gray-500">{confidence}%</span>
    </div>
  )
}

function PublicMoneyBar({ 
  publicPct, 
  moneyPct, 
  label 
}: { 
  publicPct: number
  moneyPct: number
  label: string 
}) {
  const diff = moneyPct - publicPct
  const isSharpSide = diff >= 10
  
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-gray-500 flex items-center gap-1">
          <Users className="w-3 h-3" />
          {publicPct}%
        </span>
        <span className={`flex items-center gap-1 ${isSharpSide ? 'text-purple-400' : 'text-gray-400'}`}>
          <DollarSign className="w-3 h-3" />
          {moneyPct}%
        </span>
      </div>
      <div className="relative h-2 bg-gray-800 rounded-full overflow-hidden">
        {/* Public bar */}
        <div 
          className="absolute top-0 left-0 h-full bg-blue-500/50"
          style={{ width: `${publicPct}%` }}
        />
        {/* Money bar (overlaid) */}
        <div 
          className={`absolute top-0 left-0 h-full ${isSharpSide ? 'bg-purple-500' : 'bg-gray-500'}`}
          style={{ width: `${moneyPct}%`, opacity: 0.7 }}
        />
      </div>
      <div className="text-xs text-center text-gray-600">{label}</div>
    </div>
  )
}

// =============================================================================
// COLUMN DEFINITIONS
// =============================================================================

function getColumns(onRowClick?: (row: BettingSplitRow) => void): ColumnDef<BettingSplitRow>[] {
  return [
    {
      key: 'matchup',
      header: 'Matchup',
      sortable: true,
      sticky: true,
      minWidth: '180px',
      accessor: (row) => `${row.awayTeam} @ ${row.homeTeam}`,
      render: (_, row) => (
        <div className="flex flex-col">
          <span className="font-medium text-gray-200">{row.awayTeam}</span>
          <span className="text-gray-400">@ {row.homeTeam}</span>
        </div>
      ),
    },
    {
      key: 'spread',
      header: 'Spread',
      sortable: true,
      align: 'center',
      minWidth: '80px',
      render: (value) => {
        const num = value as number
        return (
          <span className="font-mono">
            {num > 0 ? `+${num}` : num}
          </span>
        )
      },
    },
    {
      key: 'spreadHomePublicPct',
      header: 'Home Public %',
      sortable: true,
      align: 'center',
      minWidth: '100px',
      render: (value, row) => {
        const pct = value as number
        const isHeavy = pct >= 65
        return (
          <span className={isHeavy ? 'text-yellow-400 font-semibold' : 'text-gray-300'}>
            {pct}%
          </span>
        )
      },
    },
    {
      key: 'spreadHomeMoneyPct',
      header: 'Home Money %',
      sortable: true,
      align: 'center',
      minWidth: '100px',
      render: (value, row) => {
        const moneyPct = value as number
        const publicPct = row.spreadHomePublicPct
        const diff = moneyPct - publicPct
        const isSharp = Math.abs(diff) >= 10
        
        return (
          <div className="flex items-center justify-center gap-1">
            <span className={isSharp ? 'text-purple-400 font-semibold' : 'text-gray-300'}>
              {moneyPct}%
            </span>
            {diff !== 0 && (
              <span className={`text-xs ${diff > 0 ? 'text-green-400' : 'text-red-400'}`}>
                {diff > 0 ? '+' : ''}{diff}
              </span>
            )}
          </div>
        )
      },
    },
    {
      key: 'total',
      header: 'Total',
      sortable: true,
      align: 'center',
      minWidth: '70px',
      render: (value) => <span className="font-mono">{value as number}</span>,
    },
    {
      key: 'totalOverPublicPct',
      header: 'Over Public %',
      sortable: true,
      align: 'center',
      minWidth: '100px',
      render: (value) => {
        const pct = value as number
        const isHeavy = pct >= 65
        return (
          <span className={isHeavy ? 'text-yellow-400 font-semibold' : 'text-gray-300'}>
            {pct}%
          </span>
        )
      },
    },
    {
      key: 'isRLM',
      header: 'RLM',
      sortable: true,
      align: 'center',
      minWidth: '100px',
      sortFn: (a, b, dir) => {
        const aVal = a.isRLM ? a.rlmConfidence : 0
        const bVal = b.isRLM ? b.rlmConfidence : 0
        return dir === 'asc' ? aVal - bVal : bVal - aVal
      },
      render: (_, row) => <RLMBadge side={row.rlmSide} confidence={row.rlmConfidence} />,
    },
    {
      key: 'isSteamMove',
      header: 'Steam',
      sortable: true,
      align: 'center',
      minWidth: '90px',
      render: (_, row) => <SteamBadge direction={row.steamDirection} />,
    },
    {
      key: 'sharpSide',
      header: 'Sharp Side',
      sortable: true,
      align: 'center',
      minWidth: '120px',
      sortFn: (a, b, dir) => {
        const aVal = a.sharpSide ? a.sharpConfidence : 0
        const bVal = b.sharpSide ? b.sharpConfidence : 0
        return dir === 'asc' ? aVal - bVal : bVal - aVal
      },
      render: (_, row) => <SharpBadge side={row.sharpSide} confidence={row.sharpConfidence} />,
    },
    {
      key: 'homeML',
      header: 'Home ML',
      sortable: true,
      align: 'right',
      minWidth: '80px',
      render: (value) => {
        const odds = value as number
        return (
          <span className={odds > 0 ? 'text-green-400' : 'text-red-400'}>
            {odds > 0 ? `+${odds}` : odds}
          </span>
        )
      },
    },
    {
      key: 'awayML',
      header: 'Away ML',
      sortable: true,
      align: 'right',
      minWidth: '80px',
      render: (value) => {
        const odds = value as number
        return (
          <span className={odds > 0 ? 'text-green-400' : 'text-red-400'}>
            {odds > 0 ? `+${odds}` : odds}
          </span>
        )
      },
    },
  ]
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function BettingSplitsTable({ 
  data, 
  onRowClick, 
  loading = false,
  sport,
}: BettingSplitsTableProps) {
  const columns = getColumns(onRowClick)
  
  // Summary stats
  const rlmCount = data.filter(d => d.isRLM).length
  const steamCount = data.filter(d => d.isSteamMove).length
  const sharpCount = data.filter(d => d.sharpSide && d.sharpConfidence >= 60).length
  
  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-400" />
            <span className="text-orange-400 font-semibold">{rlmCount} RLM Games</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">Line moving against public</p>
        </div>
        
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-red-400" />
            <span className="text-red-400 font-semibold">{steamCount} Steam Moves</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">Rapid line changes across books</p>
        </div>
        
        <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-purple-400" />
            <span className="text-purple-400 font-semibold">{sharpCount} Sharp Plays</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">High confidence sharp sides</p>
        </div>
      </div>
      
      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs text-gray-500 bg-gray-900/50 rounded-lg p-3">
        <div className="flex items-center gap-2">
          <Users className="w-3 h-3 text-blue-400" />
          <span>Public % = % of bets placed</span>
        </div>
        <div className="flex items-center gap-2">
          <DollarSign className="w-3 h-3 text-purple-400" />
          <span>Money % = % of dollars wagered (sharp indicator)</span>
        </div>
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-3 h-3 text-orange-400" />
          <span>RLM = Reverse Line Movement (line vs public divergence)</span>
        </div>
        <div className="flex items-center gap-2">
          <Zap className="w-3 h-3 text-red-400" />
          <span>Steam = Multiple books move line quickly</span>
        </div>
      </div>
      
      {/* Table */}
      <SortableDataTable
        data={data}
        columns={columns}
        defaultSort={{ key: 'sharpSide', direction: 'desc' }}
        onRowClick={onRowClick}
        rowKey={(row) => row.gameId}
        loading={loading}
        stickyHeader
        maxHeight="600px"
        emptyMessage={`No betting splits available${sport ? ` for ${sport}` : ''}`}
      />
      
      {/* Data source note */}
      <div className="text-xs text-gray-600 text-center">
        Data from SportsBettingDime (public %) + The Odds API (lines). Sharp % estimated from line movement.
        <br />
        <span className="text-yellow-600">
          ⚠️ True sharp tracking requires premium data services (DonBest, SportsInsights)
        </span>
      </div>
    </div>
  )
}

export default BettingSplitsTable
