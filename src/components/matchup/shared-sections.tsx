'use client'

/**
 * Shared Matchup Section Components
 * Deduplicated from 8 sport matchup pages
 * Each section is data-driven via props — NO sport-specific logic inside
 */

import Link from 'next/link'
import {
  AlertTriangle, Moon, Trophy, DollarSign, Brain, Calendar,
  Users, TrendingUp, Target, ChevronDown, Flame, Clock
} from 'lucide-react'
import { CollapsibleSection } from '@/components/matchup'
import Tooltip from '@/components/ui/Tooltip'
import { TOOLTIPS } from '@/lib/tooltip-content'
import type { SportConfig } from '@/lib/sport-config'

/* ───────── SHARP SIGNAL ALERT ───────── */
interface SharpAlertProps {
  reverseLineMovement?: boolean
  customMessage?: string
}

export function SharpSignalAlert({ reverseLineMovement, customMessage }: SharpAlertProps) {
  if (!reverseLineMovement) return null
  return (
    <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2 flex items-center gap-2">
      <AlertTriangle className="w-4 h-4 text-red-400" />
      <span className="text-xs font-bold text-red-400">SHARP SIGNAL</span>
      <span className="text-xs text-gray-400">{customMessage || 'Reverse line movement detected'}</span>
    </div>
  )
}

/* ───────── B2B ALERT ───────── */
interface B2BAlertProps {
  homeB2B?: boolean
  awayB2B?: boolean
  homeAbbr: string
  awayAbbr: string
  note?: string
}

export function B2BAlert({ homeB2B, awayB2B, homeAbbr, awayAbbr, note }: B2BAlertProps) {
  if (!homeB2B && !awayB2B) return null
  return (
    <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg px-3 py-2 flex items-center gap-2 flex-wrap">
      <AlertTriangle className="w-4 h-4 text-amber-400" />
      <span className="text-xs font-bold text-amber-400">SCHEDULE ALERT</span>
      {homeB2B && <span className="text-xs bg-amber-500/20 px-2 py-0.5 rounded text-amber-300"><Moon className="w-3 h-3 inline mr-1" />{homeAbbr} B2B</span>}
      {awayB2B && <span className="text-xs bg-amber-500/20 px-2 py-0.5 rounded text-amber-300"><Moon className="w-3 h-3 inline mr-1" />{awayAbbr} B2B</span>}
      {note && <span className="text-[10px] text-gray-500">{note}</span>}
    </div>
  )
}

/* ───────── KEY NUMBER ALERT ───────── */
interface KeyNumberAlertProps {
  spread: number
  keyNumbers: number[]
  description: string
}

export function KeyNumberAlert({ spread, keyNumbers, description }: KeyNumberAlertProps) {
  const rounded = Math.abs(Math.round(spread))
  if (!keyNumbers.includes(rounded)) return null
  return (
    <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg px-3 py-2 flex items-center gap-2">
      <Trophy className="w-4 h-4 text-blue-400" />
      <span className="text-xs font-bold text-blue-400">KEY NUMBER</span>
      <span className="text-xs text-gray-400">{rounded} — {description}</span>
    </div>
  )
}

/* ───────── AI PICK ───────── */
interface AiPickProps {
  topPick: { selection: string; confidence: number; supportingTrends?: number } | null
  aiAnalysisText?: string
}

export function AiPickSection({ topPick, aiAnalysisText }: AiPickProps) {
  if (!topPick && !aiAnalysisText) return null
  return (
    <div className="bg-[#0c0c14] rounded-lg border border-orange-500/20 p-3">
      <div className="flex items-center gap-2 mb-2">
        <Brain className="w-4 h-4 text-orange-400" />
        <span className="text-xs font-bold text-white">{aiAnalysisText ? 'The Edge Analysis' : 'AI Pick'}</span>
        <Tooltip content={TOOLTIPS.edgeScore} />
      </div>
      {topPick && (
        <div className="flex items-center justify-between p-2 bg-orange-500/10 rounded border border-orange-500/20">
          <div>
            <div className="text-xs text-gray-400">AI PICK</div>
            <div className="text-sm font-bold text-orange-400">{topPick.selection}</div>
          </div>
          <div className="text-right">
            <div className="text-xl font-black text-white">{topPick.confidence}%</div>
            {topPick.supportingTrends != null && <div className="text-[10px] text-gray-500">{topPick.supportingTrends} trends</div>}
          </div>
        </div>
      )}
      {aiAnalysisText && <p className="text-xs text-gray-400 leading-relaxed mt-2">{aiAnalysisText}</p>}
    </div>
  )
}

/* ───────── BETTING ACTION GRID ───────── */
interface BettingActionProps {
  lineMovement?: string | null
  publicPct?: number | null
  sharpPct?: number | null
  handlePct?: number | null
  homeAbbr?: string
  awayAbbr?: string
}

export function BettingActionGrid({ lineMovement, publicPct, sharpPct, handlePct, homeAbbr, awayAbbr }: BettingActionProps) {
  const metrics = [
    { label: 'Line Move', value: lineMovement || '—', color: lineMovement?.startsWith('-') ? 'text-red-400' : lineMovement?.startsWith('+') ? 'text-green-400' : 'text-gray-400' },
    { label: 'Public', value: publicPct ? `${publicPct}%` : '—', sub: publicPct && homeAbbr && awayAbbr ? (publicPct > 50 ? homeAbbr : awayAbbr) : undefined },
    { label: 'Sharp', value: sharpPct ? `${sharpPct}%` : '—', color: (sharpPct || 0) > 60 ? 'text-green-400' : 'text-white' },
    { label: 'Handle', value: handlePct ? `${handlePct}%` : '—' },
  ].filter(m => m.value !== '—')

  if (metrics.length === 0) return null

  return (
    <div className="bg-[#0c0c14] rounded-lg border border-white/5 p-3">
      <div className="flex items-center gap-2 mb-2">
        <DollarSign className="w-3.5 h-3.5 text-green-400" />
        <span className="text-xs font-bold text-white">Betting Action</span>
        <Tooltip content={TOOLTIPS.lineMovement} />
      </div>
      <div className="grid grid-cols-4 gap-1.5">
        {metrics.map(m => (
          <div key={m.label} className="bg-[#16161e] rounded px-2 py-1.5 text-center">
            <div className="text-[9px] text-gray-600 mb-0.5">{m.label}</div>
            <div className={`text-sm font-bold ${m.color || 'text-white'}`}>{m.value}</div>
            {m.sub && <div className="text-[9px] text-gray-600">{m.sub}</div>}
          </div>
        ))}
      </div>
    </div>
  )
}

/* ───────── H2H GRID ───────── */
interface H2HGridProps {
  h2h: { gamesPlayed: number; homeATSRecord: string; awayATSRecord: string; overUnderRecord: string; avgTotal?: number } | null
  homeAbbr: string
  awayAbbr: string
  spreadLabel: string
  scoreUnit: string
}

export function H2HGrid({ h2h, homeAbbr, awayAbbr, spreadLabel, scoreUnit }: H2HGridProps) {
  if (!h2h || h2h.gamesPlayed <= 0) return null
  const stats = [
    { v: h2h.homeATSRecord, l: `${homeAbbr} ${spreadLabel}`, c: 'text-orange-400' },
    { v: h2h.awayATSRecord, l: `${awayAbbr} ${spreadLabel}`, c: 'text-blue-400' },
    { v: h2h.overUnderRecord, l: 'O/U', c: 'text-green-400' },
    { v: h2h.avgTotal?.toFixed(1) || '', l: `AVG ${scoreUnit}`, c: 'text-white' },
  ]
  return (
    <CollapsibleSection title={<>H2H History <Tooltip content={TOOLTIPS.h2h} /></>} icon={Users} badge={`${h2h.gamesPlayed}g`}>
      <div className="grid grid-cols-4 gap-1.5 mt-2">
        {stats.map(s => (
          <div key={s.l} className="text-center p-1.5 bg-[#16161e] rounded">
            <div className={`text-sm font-bold ${s.c}`}>{s.v}</div>
            <div className="text-[9px] text-gray-600">{s.l}</div>
          </div>
        ))}
      </div>
    </CollapsibleSection>
  )
}

/* ───────── TRENDS LIST ───────── */
interface TrendsListProps {
  trends: { matched: number; spreadTrends?: any[] } | null
  sport: string
  teamAbbr?: string
}

export function TrendsList({ trends, sport, teamAbbr }: TrendsListProps) {
  if (!trends || trends.matched <= 0) return null
  return (
    <CollapsibleSection title="Betting Trends" icon={TrendingUp} badge={trends.matched}>
      <div className="space-y-1.5 mt-2">
        {trends.spreadTrends?.slice(0, 5).map((t: any, i: number) => (
          <div key={i} className="flex items-center justify-between p-1.5 bg-[#16161e] rounded text-xs">
            <span className="text-gray-300">{t.description || t.text}</span>
            <span className={`font-bold ${t.confidence >= 70 ? 'text-green-400' : 'text-amber-400'}`}>{t.confidence}%</span>
          </div>
        ))}
        <Link href={`/trends?sport=${sport}${teamAbbr ? `&team=${teamAbbr}` : ''}`} className="text-[10px] text-orange-400 hover:underline">View all trends →</Link>
      </div>
    </CollapsibleSection>
  )
}

/* ───────── REST & FORM ───────── */
interface TeamContext {
  restDays?: number | null
  isBackToBack?: boolean
  last5Record?: string
}
interface RestFormProps {
  homeCtx: TeamContext | null
  awayCtx: TeamContext | null
  homeAbbr: string
  awayAbbr: string
  sport: string
  showRestDays: boolean
  formWindow: number
  /** For NFL: show W/L dot sequence */
  homeSchedule?: any[]
  awaySchedule?: any[]
}

export function RestFormSection({ homeCtx, awayCtx, homeAbbr, awayAbbr, sport, showRestDays, formWindow, homeSchedule, awaySchedule }: RestFormProps) {
  if (!homeCtx && !awayCtx) return null

  // NFL-style with W/L dots
  if (homeSchedule && awaySchedule) {
    const homeWins = homeSchedule.filter((g: any) => g.result === 'W').length
    const awayWins = awaySchedule.filter((g: any) => g.result === 'W').length
    return (
      <CollapsibleSection title={<>Recent Form (Last {formWindow}) <Tooltip content={TOOLTIPS.restDays} /></>} icon={Calendar}>
        <div className="grid grid-cols-2 gap-3 mt-2">
          {[{ abbr: homeAbbr, wins: homeWins, total: homeSchedule.length, schedule: homeSchedule },
            { abbr: awayAbbr, wins: awayWins, total: awaySchedule.length, schedule: awaySchedule }].map(t => (
            <div key={t.abbr}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-gray-600">{t.abbr}</span>
                <Link href={`/team/${sport}/${t.abbr.toLowerCase()}`} className="text-[10px] text-orange-400 hover:underline">Full →</Link>
              </div>
              <div className="bg-[#16161e] rounded p-2 text-center">
                <div className="text-lg font-bold text-green-400">{t.wins}-{t.total - t.wins}</div>
              </div>
              <div className="flex gap-0.5 mt-1 justify-center">
                {t.schedule.map((g: any, i: number) => (
                  <div key={i} className={`w-5 h-5 rounded text-[10px] font-bold flex items-center justify-center ${g.result === 'W' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                    {g.result || '—'}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </CollapsibleSection>
    )
  }

  // With rest days (NBA, NHL, WNBA)
  if (showRestDays) {
    return (
      <div className="bg-[#0c0c14] rounded-lg border border-white/5 p-3">
        <div className="flex items-center gap-2 mb-2">
          <Calendar className="w-3.5 h-3.5 text-blue-400" />
          <span className="text-xs font-bold text-white">Rest & Form</span>
          <Tooltip content={TOOLTIPS.restDays} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          {[{ abbr: homeAbbr, ctx: homeCtx }, { abbr: awayAbbr, ctx: awayCtx }].map(t => (
            <div key={t.abbr} className="flex gap-1.5">
              <div className="bg-[#16161e] rounded px-2 py-1.5 text-center flex-1">
                <div className="text-sm font-bold text-white">{t.ctx?.restDays != null ? `${t.ctx.restDays}d` : '-'}</div>
                <div className="text-[9px] text-gray-600">{t.abbr} REST</div>
              </div>
              <div className="bg-[#16161e] rounded px-2 py-1.5 text-center flex-1">
                <div className="text-sm font-bold text-green-400">{t.ctx?.last5Record || ''}</div>
                <div className="text-[9px] text-gray-600">LAST {formWindow}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Record only (NCAAB, NCAAF, MLB, WNCAAB)
  return (
    <div className="bg-[#0c0c14] rounded-lg border border-white/5 p-3">
      <div className="flex items-center gap-2 mb-2">
        <Calendar className="w-3.5 h-3.5 text-blue-400" />
        <span className="text-xs font-bold text-white">Recent Form (L{formWindow})</span>
        <Tooltip content={TOOLTIPS.restDays} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        {[{ abbr: homeAbbr, ctx: homeCtx, tag: 'Home' }, { abbr: awayAbbr, ctx: awayCtx, tag: 'Away' }].map(t => (
          <div key={t.abbr} className="bg-[#16161e] rounded px-2 py-2 text-center">
            <div className="text-lg font-bold text-green-400">{t.ctx?.last5Record || ''}</div>
            <div className="text-[9px] text-gray-600">{t.abbr} ({t.tag}) L{formWindow}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ───────── PLAYER PROPS ───────── */
interface PlayerPropsWrapperProps {
  gameId: string
  sport: string
  homeTeam: string
  awayTeam: string
}

export function PlayerPropsSection({ gameId, sport, homeTeam, awayTeam }: PlayerPropsWrapperProps) {
  // Lazy import to avoid circular deps
  const GamePlayerProps = require('@/components/game/GamePlayerProps').default
  return (
    <CollapsibleSection title="Player Props" icon={Target}>
      <div className="mt-2">
        <GamePlayerProps gameId={gameId} sport={sport.toUpperCase()} homeTeam={homeTeam} awayTeam={awayTeam} />
      </div>
    </CollapsibleSection>
  )
}

/* ───────── SIDEBAR QUICK LINKS ───────── */
interface QuickLinksProps {
  links: Array<{ label: string; href: string; icon: 'trends' | 'lineshop' | 'live' }>
}

const iconMap = {
  trends: TrendingUp,
  lineshop: DollarSign,
  live: Flame,
}

const iconColorMap = {
  trends: 'text-orange-500',
  lineshop: 'text-green-500',
  live: 'text-red-500',
}

export function QuickLinks({ links }: QuickLinksProps) {
  return (
    <div className="space-y-1.5">
      {links.map(link => {
        const Icon = iconMap[link.icon]
        return (
          <Link key={link.href} href={link.href} className="flex items-center justify-between p-2.5 bg-[#0c0c14] rounded-lg border border-white/5 hover:border-orange-500/30 transition-all group text-xs">
            <div className="flex items-center gap-2">
              <Icon className={`w-3.5 h-3.5 ${iconColorMap[link.icon]}`} />
              <span className="text-gray-300 group-hover:text-orange-400">{link.label}</span>
            </div>
            <ChevronDown className="w-3 h-3 text-gray-600 -rotate-90" />
          </Link>
        )
      })}
    </div>
  )
}
