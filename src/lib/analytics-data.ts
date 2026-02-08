// Comprehensive Analytics Data Module
// Provides deep analytics, trends, and insights for gambling edge-finding

import { Sport, BetType, CapperType } from '@/types/leaderboard'

// =============================================================================
// TEAM ANALYTICS DATA
// =============================================================================

export interface TeamAnalytics {
  id: string
  sport: Sport
  abbr: string
  name: string
  city: string
  conference: string
  division: string
  logo: string
  
  // Overall Record
  record: { wins: number; losses: number; ties?: number }
  
  // ATS Performance
  ats: {
    overall: { wins: number; losses: number; pushes: number }
    home: { wins: number; losses: number; pushes: number }
    away: { wins: number; losses: number; pushes: number }
    asFavorite: { wins: number; losses: number; pushes: number }
    asUnderdog: { wins: number; losses: number; pushes: number }
    last10: { wins: number; losses: number; pushes: number }
  }
  
  // Over/Under Performance
  ou: {
    overall: { overs: number; unders: number; pushes: number }
    home: { overs: number; unders: number; pushes: number }
    away: { overs: number; unders: number; pushes: number }
    last10: { overs: number; unders: number; pushes: number }
  }
  
  // Moneyline
  ml: {
    asFavorite: { wins: number; losses: number }
    asUnderdog: { wins: number; losses: number }
  }
  
  // Situational
  situational: {
    afterWin: { ats: string; ou: string }
    afterLoss: { ats: string; ou: string }
    onRest: { ats: string; ou: string } // 3+ days rest
    shortRest: { ats: string; ou: string } // back-to-back or 1 day
    primetime: { ats: string; ou: string }
    divisional: { ats: string; ou: string }
  }
  
  // Scoring
  scoring: {
    ppg: number
    oppg: number
    margin: number
    home: { ppg: number; oppg: number }
    away: { ppg: number; oppg: number }
  }
  
  // Trends (text summaries)
  trends: string[]
  
  // Hot/Cold
  streak: string
  isHot: boolean
  isCold: boolean
  
  // Public betting tendencies
  publicBetPct: number // % of time public bets on this team
}

export interface TimeframeStat {
  period: 'season' | 'last30' | 'last14' | 'last7'
  record: string
  ats: string
  ou: string
  roi: number
}

// =============================================================================
// NFL TEAM DATA — Purged: use fetchTeamByAbbr() for real data from API
// =============================================================================

export const nflTeams: TeamAnalytics[] = []

// =============================================================================
// NBA TEAM DATA — Purged: use fetchTeamByAbbr() for real data from API
// =============================================================================

export const nbaTeams: TeamAnalytics[] = []

// =============================================================================
// NHL TEAM DATA — Purged: use fetchTeamByAbbr() for real data from API
// =============================================================================

export const nhlTeams: TeamAnalytics[] = []

// =============================================================================
// MLB TEAM DATA — Purged: use fetchTeamByAbbr() for real data from API
// =============================================================================

export const mlbTeams: TeamAnalytics[] = []

// =============================================================================
// CAPPER ANALYTICS - AI SUMMARY GENERATION
// =============================================================================

export interface CapperAnalyticsSummary {
  capperId: string
  generatedAt: string
  
  // Key Insights (2-3 bullet summary)
  keyInsights: string[]
  
  // Strengths
  strengths: string[]
  
  // Weaknesses
  weaknesses: string[]
  
  // Best Bet Types
  bestBetTypes: { type: BetType; winPct: number; roi: number }[]
  
  // Worst Bet Types
  worstBetTypes: { type: BetType; winPct: number; roi: number }[]
  
  // Best Sports
  bestSports: { sport: Sport; winPct: number; roi: number }[]
  
  // Worst Sports
  worstSports: { sport: Sport; winPct: number; roi: number }[]
  
  // Patterns
  patterns: {
    favoriteBias: number // % of picks on favorites
    homeBias: number // % of picks on home teams  
    overBias: number // % of over picks vs under
    avgOdds: number // Average odds played
    avgUnits: number // Average unit size
    clvBeatRate?: number // % of times they beat closing line
  }
  
  // Performance by timeframe
  recentForm: {
    last7days: { record: string; roi: number }
    last30days: { record: string; roi: number }
    lastSeason: { record: string; roi: number }
  }
  
  // Recommendation
  recommendation: 'follow' | 'fade' | 'avoid' | 'selective'
  recommendationReason: string
}

// Pre-generated summaries — Purged: will be populated from Supabase cappers table
export const capperSummaries: Record<string, CapperAnalyticsSummary> = {}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

export function getTeamByAbbr(sport: Sport, abbr: string): TeamAnalytics | undefined {
  const teams = sport === 'NFL' ? nflTeams : 
                sport === 'NBA' ? nbaTeams :
                sport === 'NHL' ? nhlTeams :
                sport === 'MLB' ? mlbTeams : []
  return teams.find(t => t.abbr === abbr)
}

export function getTeamByAbbreviation(sport: Sport, abbr: string): TeamAnalytics | undefined {
  return getTeamByAbbr(sport, abbr)
}

export function getAllTeams(sport: Sport): TeamAnalytics[] {
  return sport === 'NFL' ? nflTeams : 
         sport === 'NBA' ? nbaTeams :
         sport === 'NHL' ? nhlTeams :
         sport === 'MLB' ? mlbTeams : []
}

// Sport-specific getters for convenience
export function getNFLTeams(): TeamAnalytics[] {
  return nflTeams
}

export function getNBATeams(): TeamAnalytics[] {
  return nbaTeams
}

export function getNHLTeams(): TeamAnalytics[] {
  return nhlTeams
}

export function getMLBTeams(): TeamAnalytics[] {
  return mlbTeams
}

export function getHotTeams(sport: Sport): TeamAnalytics[] {
  return getAllTeams(sport).filter(t => t.isHot)
}

export function getColdTeams(sport: Sport): TeamAnalytics[] {
  return getAllTeams(sport).filter(t => t.isCold)
}

export function getBestATSTeams(sport: Sport, limit: number = 5): TeamAnalytics[] {
  return [...getAllTeams(sport)]
    .sort((a, b) => {
      const aWinPct = a.ats.overall.wins / (a.ats.overall.wins + a.ats.overall.losses)
      const bWinPct = b.ats.overall.wins / (b.ats.overall.wins + b.ats.overall.losses)
      return bWinPct - aWinPct
    })
    .slice(0, limit)
}

export function getCapperSummary(capperId: string): CapperAnalyticsSummary | undefined {
  return capperSummaries[capperId]
}

export function generateAISummary(capperId: string): string[] {
  const summary = capperSummaries[capperId]
  if (summary) {
    return summary.keyInsights
  }
  return [
    'Insufficient data for AI analysis',
    'Track more picks to generate insights',
  ]
}

// =============================================================================
// DYNAMIC FETCH HELPERS
// These helpers attempt to fetch live team analytics from the internal
// `/api/team-stats` endpoint. If the request fails or is unavailable we
// gracefully fall back to the bundled static data above.
//
// Keep the original synchronous helpers for consumers that expect them,
// and prefer the async variants in server-side code paths where fresh data
// is desired (e.g. game pages, edge computation).
// =============================================================================

function _safeNumber(v: any): number {
  if (v === undefined || v === null) return 0
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

function mapTeamStatsToTeamAnalytics(stats: any, sport: Sport, abbr: string): TeamAnalytics {
  const teamAbbrev = (stats?.teamAbbrev || abbr || '').toUpperCase()
  const teamName = stats?.team || teamAbbrev
  const logo = stats?.logo || `https://a.espncdn.com/i/teamlogos/${String(sport).toLowerCase()}/500/${teamAbbrev.toLowerCase()}.png`

  return {
    id: (teamAbbrev || abbr).toLowerCase(),
    sport: (String(sport).toUpperCase() as unknown) as Sport,
    abbr: teamAbbrev,
    name: teamName,
    city: stats?.city || '',
    conference: stats?.conference || '',
    division: stats?.division || '',
    logo,
    record: { wins: stats?.record?.wins || 0, losses: stats?.record?.losses || 0 },
    ats: {
      overall: { wins: _safeNumber(stats?.ats?.overall?.wins), losses: _safeNumber(stats?.ats?.overall?.losses), pushes: _safeNumber(stats?.ats?.overall?.pushes) },
      home: { wins: _safeNumber(stats?.ats?.home?.wins), losses: _safeNumber(stats?.ats?.home?.losses), pushes: _safeNumber(stats?.ats?.home?.pushes) },
      away: { wins: _safeNumber(stats?.ats?.away?.wins), losses: _safeNumber(stats?.ats?.away?.losses), pushes: _safeNumber(stats?.ats?.away?.pushes) },
      asFavorite: { wins: _safeNumber(stats?.ats?.asFavorite?.wins), losses: _safeNumber(stats?.ats?.asFavorite?.losses), pushes: 0 },
      asUnderdog: { wins: _safeNumber(stats?.ats?.asUnderdog?.wins), losses: _safeNumber(stats?.ats?.asUnderdog?.losses), pushes: 0 },
      last10: { wins: _safeNumber(stats?.ats?.last10?.wins), losses: _safeNumber(stats?.ats?.last10?.losses), pushes: _safeNumber(stats?.ats?.last10?.pushes) },
    },
    ou: {
      overall: { overs: _safeNumber(stats?.ou?.overall?.overs), unders: _safeNumber(stats?.ou?.overall?.unders), pushes: _safeNumber(stats?.ou?.overall?.pushes) },
      home: { overs: _safeNumber(stats?.ou?.home?.overs), unders: _safeNumber(stats?.ou?.home?.unders), pushes: _safeNumber(stats?.ou?.home?.pushes) },
      away: { overs: _safeNumber(stats?.ou?.away?.overs), unders: _safeNumber(stats?.ou?.away?.unders), pushes: _safeNumber(stats?.ou?.away?.pushes) },
      last10: { overs: _safeNumber(stats?.ou?.last10?.overs), unders: _safeNumber(stats?.ou?.last10?.unders), pushes: _safeNumber(stats?.ou?.last10?.pushes) },
    },
    ml: {
      asFavorite: { wins: _safeNumber(stats?.ml?.asFavorite?.wins), losses: _safeNumber(stats?.ml?.asFavorite?.losses) },
      asUnderdog: { wins: _safeNumber(stats?.ml?.asUnderdog?.wins), losses: _safeNumber(stats?.ml?.asUnderdog?.losses) },
    },
    situational: stats?.situational || {
      afterWin: { ats: '0-0', ou: '0-0' },
      afterLoss: { ats: '0-0', ou: '0-0' },
      onRest: { ats: '0-0', ou: '0-0' },
      shortRest: { ats: '0-0', ou: '0-0' },
      primetime: { ats: '0-0', ou: '0-0' },
      divisional: { ats: '0-0', ou: '0-0' },
    },
    scoring: stats?.scoring || { ppg: 0, oppg: 0, margin: 0, home: { ppg: 0, oppg: 0 }, away: { ppg: 0, oppg: 0 } },
    trends: stats?.trends || [],
    streak: stats?.streak || '',
    isHot: Boolean(stats?.isHot),
    isCold: Boolean(stats?.isCold),
    publicBetPct: _safeNumber(stats?.publicBetPct || stats?.publicBetPct)
  }
}

export async function fetchTeamByAbbr(sport: Sport, abbr: string): Promise<TeamAnalytics | undefined> {
  try {
    const sportParam = String(sport).toLowerCase()
    const res = await fetch(`/api/team-stats?sport=${sportParam}&team=${abbr}`, { cache: 'no-store' })
    if (!res.ok) return getTeamByAbbr(sport, abbr)
    const json = await res.json()
    const teamStats = json?.team
    if (!teamStats) return getTeamByAbbr(sport, abbr)
    return mapTeamStatsToTeamAnalytics(teamStats, sport, abbr)
  } catch (err) {
    // Network or environment; fall back to bundled data
    return getTeamByAbbr(sport, abbr)
  }
}

export async function fetchAllTeams(sport: Sport): Promise<TeamAnalytics[]> {
  try {
    const sportParam = String(sport).toLowerCase()
    const res = await fetch(`/api/team-stats?sport=${sportParam}&type=rankings`, { cache: 'no-store' })
    if (!res.ok) return getAllTeams(sport)
    const json = await res.json()
    const rankings = json?.rankings
    if (!rankings) return getAllTeams(sport)

    // Map rankings to minimal TeamAnalytics objects
    const offense = Array.isArray(rankings.offense) ? rankings.offense : []
    const defense = Array.isArray(rankings.defense) ? rankings.defense : []

    // merge by teamAbbrev
    const byAbbr: Record<string, any> = {}
    for (const o of offense) {
      byAbbr[o.teamAbbrev] = byAbbr[o.teamAbbrev] || {}
      byAbbr[o.teamAbbrev].team = o.team
      byAbbr[o.teamAbbrev].teamAbbrev = o.teamAbbrev
      byAbbr[o.teamAbbrev].offense = o
    }
    for (const d of defense) {
      byAbbr[d.teamAbbrev] = byAbbr[d.teamAbbrev] || {}
      byAbbr[d.teamAbbrev].team = byAbbr[d.teamAbbrev].team || d.team
      byAbbr[d.teamAbbrev].teamAbbrev = d.teamAbbrev
      byAbbr[d.teamAbbrev].defense = d
    }

    const teams: TeamAnalytics[] = Object.keys(byAbbr).map(ab => {
      const s = byAbbr[ab]
      const minimal = {
        team: s.team,
        teamAbbrev: s.teamAbbrev,
        logo: `https://a.espncdn.com/i/teamlogos/${sportParam}/500/${s.teamAbbrev.toLowerCase()}.png`,
        record: '—',
        offense: { rank: s.offense?.rank || 0, totalYards: 0, yardsPerGame: s.offense?.value || 0, passingYards: 0, passingYardsPerGame: 0, rushingYards: 0, rushingYardsPerGame: 0, pointsScored: 0, pointsPerGame: 0 },
        defense: { rank: s.defense?.rank || 0, totalYardsAllowed: 0, yardsAllowedPerGame: s.defense?.value || 0, passingYardsAllowed: 0, passingYardsAllowedPerGame: 0, rushingYardsAllowed: 0, rushingYardsAllowedPerGame: 0, pointsAllowed: 0, pointsAllowedPerGame: 0 }
      }
      return mapTeamStatsToTeamAnalytics(minimal, sport, ab)
    })

    return teams
  } catch (err) {
    return getAllTeams(sport)
  }
}
