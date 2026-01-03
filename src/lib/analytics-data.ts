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
// NFL TEAM DATA
// =============================================================================

export const nflTeams: TeamAnalytics[] = [
  {
    id: 'det',
    sport: 'NFL',
    abbr: 'DET',
    name: 'Lions',
    city: 'Detroit',
    conference: 'NFC',
    division: 'North',
    logo: '🦁',
    record: { wins: 15, losses: 2 },
    ats: {
      overall: { wins: 12, losses: 5, pushes: 0 },
      home: { wins: 7, losses: 2, pushes: 0 },
      away: { wins: 5, losses: 3, pushes: 0 },
      asFavorite: { wins: 11, losses: 4, pushes: 0 },
      asUnderdog: { wins: 1, losses: 1, pushes: 0 },
      last10: { wins: 8, losses: 2, pushes: 0 },
    },
    ou: {
      overall: { overs: 10, unders: 7, pushes: 0 },
      home: { overs: 6, unders: 3, pushes: 0 },
      away: { overs: 4, unders: 4, pushes: 0 },
      last10: { overs: 7, unders: 3, pushes: 0 },
    },
    ml: {
      asFavorite: { wins: 14, losses: 1 },
      asUnderdog: { wins: 1, losses: 1 },
    },
    situational: {
      afterWin: { ats: '11-3', ou: '9-5' },
      afterLoss: { ats: '1-2', ou: '1-2' },
      onRest: { ats: '4-1', ou: '3-2' },
      shortRest: { ats: '2-1', ou: '2-1' },
      primetime: { ats: '4-1', ou: '4-1' },
      divisional: { ats: '4-2', ou: '3-3' },
    },
    scoring: {
      ppg: 33.2,
      oppg: 19.4,
      margin: 13.8,
      home: { ppg: 35.1, oppg: 17.8 },
      away: { ppg: 31.3, oppg: 21.0 },
    },
    trends: [
      'DET is 8-2 ATS in their last 10 games',
      'The OVER is 7-3 in Lions last 10',
      'DET is 12-5 ATS as favorites this season',
      'Lions are 4-1 ATS in primetime games',
    ],
    streak: 'W11',
    isHot: true,
    isCold: false,
    publicBetPct: 72,
  },
  {
    id: 'kc',
    sport: 'NFL',
    abbr: 'KC',
    name: 'Chiefs',
    city: 'Kansas City',
    conference: 'AFC',
    division: 'West',
    logo: '🏹',
    record: { wins: 15, losses: 2 },
    ats: {
      overall: { wins: 9, losses: 8, pushes: 0 },
      home: { wins: 5, losses: 4, pushes: 0 },
      away: { wins: 4, losses: 4, pushes: 0 },
      asFavorite: { wins: 8, losses: 7, pushes: 0 },
      asUnderdog: { wins: 1, losses: 1, pushes: 0 },
      last10: { wins: 5, losses: 5, pushes: 0 },
    },
    ou: {
      overall: { overs: 7, unders: 10, pushes: 0 },
      home: { overs: 4, unders: 5, pushes: 0 },
      away: { overs: 3, unders: 5, pushes: 0 },
      last10: { overs: 4, unders: 6, pushes: 0 },
    },
    ml: {
      asFavorite: { wins: 14, losses: 1 },
      asUnderdog: { wins: 1, losses: 1 },
    },
    situational: {
      afterWin: { ats: '8-6', ou: '6-8' },
      afterLoss: { ats: '1-2', ou: '1-2' },
      onRest: { ats: '3-2', ou: '2-3' },
      shortRest: { ats: '1-1', ou: '0-2' },
      primetime: { ats: '3-2', ou: '2-3' },
      divisional: { ats: '4-2', ou: '2-4' },
    },
    scoring: {
      ppg: 25.8,
      oppg: 17.2,
      margin: 8.6,
      home: { ppg: 27.2, oppg: 16.4 },
      away: { ppg: 24.4, oppg: 18.0 },
    },
    trends: [
      'KC is just 5-5 ATS in last 10 despite winning',
      'UNDER is 6-4 in Chiefs last 10',
      'Chiefs win but rarely cover large spreads',
      'Fade KC -7 or more: 2-6 ATS this season',
    ],
    streak: 'W10',
    isHot: false, // Winning but not covering
    isCold: false,
    publicBetPct: 78,
  },
  {
    id: 'buf',
    sport: 'NFL',
    abbr: 'BUF',
    name: 'Bills',
    city: 'Buffalo',
    conference: 'AFC',
    division: 'East',
    logo: '🦬',
    record: { wins: 13, losses: 4 },
    ats: {
      overall: { wins: 11, losses: 6, pushes: 0 },
      home: { wins: 6, losses: 3, pushes: 0 },
      away: { wins: 5, losses: 3, pushes: 0 },
      asFavorite: { wins: 9, losses: 5, pushes: 0 },
      asUnderdog: { wins: 2, losses: 1, pushes: 0 },
      last10: { wins: 7, losses: 3, pushes: 0 },
    },
    ou: {
      overall: { overs: 9, unders: 8, pushes: 0 },
      home: { overs: 5, unders: 4, pushes: 0 },
      away: { overs: 4, unders: 4, pushes: 0 },
      last10: { overs: 6, unders: 4, pushes: 0 },
    },
    ml: {
      asFavorite: { wins: 12, losses: 2 },
      asUnderdog: { wins: 1, losses: 2 },
    },
    situational: {
      afterWin: { ats: '9-4', ou: '7-6' },
      afterLoss: { ats: '2-2', ou: '2-2' },
      onRest: { ats: '4-1', ou: '3-2' },
      shortRest: { ats: '2-1', ou: '2-1' },
      primetime: { ats: '3-1', ou: '3-1' },
      divisional: { ats: '4-2', ou: '3-3' },
    },
    scoring: {
      ppg: 30.4,
      oppg: 20.2,
      margin: 10.2,
      home: { ppg: 32.1, oppg: 18.8 },
      away: { ppg: 28.7, oppg: 21.6 },
    },
    trends: [
      'BUF is 7-3 ATS in last 10',
      'OVER is 6-4 in Bills last 10',
      'Buffalo is 4-1 ATS on extra rest',
      'Bills cover 64.7% as favorites this year',
    ],
    streak: 'W5',
    isHot: true,
    isCold: false,
    publicBetPct: 68,
  },
  {
    id: 'phi',
    sport: 'NFL',
    abbr: 'PHI',
    name: 'Eagles',
    city: 'Philadelphia',
    conference: 'NFC',
    division: 'East',
    logo: '🦅',
    record: { wins: 14, losses: 3 },
    ats: {
      overall: { wins: 10, losses: 7, pushes: 0 },
      home: { wins: 6, losses: 3, pushes: 0 },
      away: { wins: 4, losses: 4, pushes: 0 },
      asFavorite: { wins: 9, losses: 6, pushes: 0 },
      asUnderdog: { wins: 1, losses: 1, pushes: 0 },
      last10: { wins: 6, losses: 4, pushes: 0 },
    },
    ou: {
      overall: { overs: 8, unders: 9, pushes: 0 },
      home: { overs: 5, unders: 4, pushes: 0 },
      away: { overs: 3, unders: 5, pushes: 0 },
      last10: { overs: 5, unders: 5, pushes: 0 },
    },
    ml: {
      asFavorite: { wins: 13, losses: 2 },
      asUnderdog: { wins: 1, losses: 1 },
    },
    situational: {
      afterWin: { ats: '8-5', ou: '6-7' },
      afterLoss: { ats: '2-2', ou: '2-2' },
      onRest: { ats: '3-2', ou: '2-3' },
      shortRest: { ats: '2-1', ou: '2-1' },
      primetime: { ats: '2-2', ou: '2-2' },
      divisional: { ats: '3-3', ou: '2-4' },
    },
    scoring: {
      ppg: 28.2,
      oppg: 17.8,
      margin: 10.4,
      home: { ppg: 30.5, oppg: 16.2 },
      away: { ppg: 25.9, oppg: 19.4 },
    },
    trends: [
      'PHI is 6-4 ATS in last 10',
      'UNDER is 5-5 in Eagles games',
      'Eagles are dominant at home: 6-3 ATS',
      'PHI unders hit 53% this season',
    ],
    streak: 'W7',
    isHot: true,
    isCold: false,
    publicBetPct: 65,
  },
]

// =============================================================================
// NBA TEAM DATA
// =============================================================================

export const nbaTeams: TeamAnalytics[] = [
  {
    id: 'okc',
    sport: 'NBA',
    abbr: 'OKC',
    name: 'Thunder',
    city: 'Oklahoma City',
    conference: 'Western',
    division: 'Northwest',
    logo: '⚡',
    record: { wins: 30, losses: 6 },
    ats: {
      overall: { wins: 22, losses: 14, pushes: 0 },
      home: { wins: 12, losses: 6, pushes: 0 },
      away: { wins: 10, losses: 8, pushes: 0 },
      asFavorite: { wins: 20, losses: 12, pushes: 0 },
      asUnderdog: { wins: 2, losses: 2, pushes: 0 },
      last10: { wins: 7, losses: 3, pushes: 0 },
    },
    ou: {
      overall: { overs: 18, unders: 18, pushes: 0 },
      home: { overs: 10, unders: 8, pushes: 0 },
      away: { overs: 8, unders: 10, pushes: 0 },
      last10: { overs: 5, unders: 5, pushes: 0 },
    },
    ml: {
      asFavorite: { wins: 28, losses: 4 },
      asUnderdog: { wins: 2, losses: 2 },
    },
    situational: {
      afterWin: { ats: '18-10', ou: '14-14' },
      afterLoss: { ats: '4-4', ou: '4-4' },
      onRest: { ats: '8-4', ou: '6-6' },
      shortRest: { ats: '5-4', ou: '4-5' },
      primetime: { ats: '4-2', ou: '3-3' },
      divisional: { ats: '6-4', ou: '5-5' },
    },
    scoring: {
      ppg: 120.8,
      oppg: 106.2,
      margin: 14.6,
      home: { ppg: 123.4, oppg: 104.8 },
      away: { ppg: 118.2, oppg: 107.6 },
    },
    trends: [
      'OKC is 7-3 ATS in last 10',
      'Thunder on 3+ days rest: 8-4 ATS',
      'OKC road games: unders 10-8',
      'SGA games 30+ pts: OKC 18-4 ATS',
    ],
    streak: 'W8',
    isHot: true,
    isCold: false,
    publicBetPct: 71,
  },
  {
    id: 'cle',
    sport: 'NBA',
    abbr: 'CLE',
    name: 'Cavaliers',
    city: 'Cleveland',
    conference: 'Eastern',
    division: 'Central',
    logo: '⚔️',
    record: { wins: 29, losses: 7 },
    ats: {
      overall: { wins: 23, losses: 13, pushes: 0 },
      home: { wins: 13, losses: 5, pushes: 0 },
      away: { wins: 10, losses: 8, pushes: 0 },
      asFavorite: { wins: 20, losses: 10, pushes: 0 },
      asUnderdog: { wins: 3, losses: 3, pushes: 0 },
      last10: { wins: 8, losses: 2, pushes: 0 },
    },
    ou: {
      overall: { overs: 16, unders: 20, pushes: 0 },
      home: { overs: 8, unders: 10, pushes: 0 },
      away: { overs: 8, unders: 10, pushes: 0 },
      last10: { overs: 4, unders: 6, pushes: 0 },
    },
    ml: {
      asFavorite: { wins: 26, losses: 4 },
      asUnderdog: { wins: 3, losses: 3 },
    },
    situational: {
      afterWin: { ats: '19-9', ou: '12-16' },
      afterLoss: { ats: '4-4', ou: '4-4' },
      onRest: { ats: '9-3', ou: '5-7' },
      shortRest: { ats: '4-4', ou: '4-4' },
      primetime: { ats: '5-1', ou: '2-4' },
      divisional: { ats: '7-3', ou: '4-6' },
    },
    scoring: {
      ppg: 118.4,
      oppg: 106.8,
      margin: 11.6,
      home: { ppg: 120.2, oppg: 104.2 },
      away: { ppg: 116.6, oppg: 109.4 },
    },
    trends: [
      'CLE is 8-2 ATS in last 10',
      'UNDER is 6-4 in Cavs last 10',
      'Cleveland at home: 13-5 ATS',
      'Cavs on rest are money: 9-3 ATS',
    ],
    streak: 'W6',
    isHot: true,
    isCold: false,
    publicBetPct: 62,
  },
  {
    id: 'bos',
    sport: 'NBA',
    abbr: 'BOS',
    name: 'Celtics',
    city: 'Boston',
    conference: 'Eastern',
    division: 'Atlantic',
    logo: '☘️',
    record: { wins: 27, losses: 10 },
    ats: {
      overall: { wins: 19, losses: 18, pushes: 0 },
      home: { wins: 11, losses: 8, pushes: 0 },
      away: { wins: 8, losses: 10, pushes: 0 },
      asFavorite: { wins: 17, losses: 16, pushes: 0 },
      asUnderdog: { wins: 2, losses: 2, pushes: 0 },
      last10: { wins: 5, losses: 5, pushes: 0 },
    },
    ou: {
      overall: { overs: 17, unders: 20, pushes: 0 },
      home: { overs: 9, unders: 10, pushes: 0 },
      away: { overs: 8, unders: 10, pushes: 0 },
      last10: { overs: 4, unders: 6, pushes: 0 },
    },
    ml: {
      asFavorite: { wins: 24, losses: 9 },
      asUnderdog: { wins: 3, losses: 1 },
    },
    situational: {
      afterWin: { ats: '14-12', ou: '12-14' },
      afterLoss: { ats: '5-6', ou: '5-6' },
      onRest: { ats: '7-5', ou: '5-7' },
      shortRest: { ats: '4-5', ou: '4-5' },
      primetime: { ats: '3-3', ou: '2-4' },
      divisional: { ats: '5-5', ou: '4-6' },
    },
    scoring: {
      ppg: 117.8,
      oppg: 110.2,
      margin: 7.6,
      home: { ppg: 119.4, oppg: 108.6 },
      away: { ppg: 116.2, oppg: 111.8 },
    },
    trends: [
      'BOS just 5-5 ATS last 10',
      'Celtics are a public fade: overvalued',
      'UNDER 6-4 in Boston games L10',
      'BOS -8 or more: 4-8 ATS',
    ],
    streak: 'L2',
    isHot: false,
    isCold: false,
    publicBetPct: 74,
  },
]

// =============================================================================
// NHL TEAM DATA  
// =============================================================================

export const nhlTeams: TeamAnalytics[] = [
  {
    id: 'wpg',
    sport: 'NHL',
    abbr: 'WPG',
    name: 'Jets',
    city: 'Winnipeg',
    conference: 'Western',
    division: 'Central',
    logo: '✈️',
    record: { wins: 29, losses: 12 },
    ats: {
      overall: { wins: 24, losses: 17, pushes: 0 },
      home: { wins: 14, losses: 7, pushes: 0 },
      away: { wins: 10, losses: 10, pushes: 0 },
      asFavorite: { wins: 20, losses: 12, pushes: 0 },
      asUnderdog: { wins: 4, losses: 5, pushes: 0 },
      last10: { wins: 6, losses: 4, pushes: 0 },
    },
    ou: {
      overall: { overs: 19, unders: 22, pushes: 0 },
      home: { overs: 10, unders: 11, pushes: 0 },
      away: { overs: 9, unders: 11, pushes: 0 },
      last10: { overs: 4, unders: 6, pushes: 0 },
    },
    ml: {
      asFavorite: { wins: 24, losses: 8 },
      asUnderdog: { wins: 5, losses: 4 },
    },
    situational: {
      afterWin: { ats: '18-11', ou: '13-16' },
      afterLoss: { ats: '6-6', ou: '6-6' },
      onRest: { ats: '8-4', ou: '5-7' },
      shortRest: { ats: '5-5', ou: '4-6' },
      primetime: { ats: '3-2', ou: '2-3' },
      divisional: { ats: '8-6', ou: '6-8' },
    },
    scoring: {
      ppg: 3.58,
      oppg: 2.68,
      margin: 0.90,
      home: { ppg: 3.72, oppg: 2.54 },
      away: { ppg: 3.44, oppg: 2.82 },
    },
    trends: [
      'WPG is 6-4 ATS in last 10',
      'UNDER is 6-4 in Jets last 10',
      'Winnipeg at home is cash: 14-7 ATS',
      'Jets on rest: 8-4 ATS',
    ],
    streak: 'W3',
    isHot: true,
    isCold: false,
    publicBetPct: 58,
  },
]

// =============================================================================
// MLB TEAM DATA
// =============================================================================

export const mlbTeams: TeamAnalytics[] = [
  {
    id: 'lad',
    sport: 'MLB',
    abbr: 'LAD',
    name: 'Dodgers',
    city: 'Los Angeles',
    conference: 'National',
    division: 'West',
    logo: '🔵',
    record: { wins: 98, losses: 64 },
    ats: {
      overall: { wins: 88, losses: 74, pushes: 0 },
      home: { wins: 48, losses: 33, pushes: 0 },
      away: { wins: 40, losses: 41, pushes: 0 },
      asFavorite: { wins: 72, losses: 58, pushes: 0 },
      asUnderdog: { wins: 16, losses: 16, pushes: 0 },
      last10: { wins: 6, losses: 4, pushes: 0 },
    },
    ou: {
      overall: { overs: 84, unders: 78, pushes: 0 },
      home: { overs: 44, unders: 37, pushes: 0 },
      away: { overs: 40, unders: 41, pushes: 0 },
      last10: { overs: 5, unders: 5, pushes: 0 },
    },
    ml: {
      asFavorite: { wins: 82, losses: 48 },
      asUnderdog: { wins: 16, losses: 16 },
    },
    situational: {
      afterWin: { ats: '52-42', ou: '48-46' },
      afterLoss: { ats: '36-32', ou: '36-32' },
      onRest: { ats: 'N/A', ou: 'N/A' },
      shortRest: { ats: 'N/A', ou: 'N/A' },
      primetime: { ats: '18-12', ou: '16-14' },
      divisional: { ats: '34-28', ou: '32-30' },
    },
    scoring: {
      ppg: 5.32,
      oppg: 4.18,
      margin: 1.14,
      home: { ppg: 5.58, oppg: 3.92 },
      away: { ppg: 5.06, oppg: 4.44 },
    },
    trends: [
      'LAD is 6-4 on the run line L10',
      'Dodgers home run line: 48-33 (59.3%)',
      'OVER 5-5 in LAD games L10',
      'LAD vs RHP: 56-38 ML',
    ],
    streak: 'W4',
    isHot: true,
    isCold: false,
    publicBetPct: 72,
  },
]

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

// Pre-generated summaries for major cappers
export const capperSummaries: Record<string, CapperAnalyticsSummary> = {
  '1': { // Stephen A. Smith
    capperId: '1',
    generatedAt: '2026-01-03',
    keyInsights: [
      '🚫 Stephen A. is a classic fade candidate with just 41.5% win rate on spread bets',
      '💔 Heavy Cowboys bias costs him - DAL picks are 28% of portfolio at 34% win rate',
      '📉 -67.2 units lifetime means fading him would yield +67.2 units profit',
    ],
    strengths: [
      'High volume - lots of fade opportunities',
      'Predictable biases (Cowboys, Knicks) are exploitable',
    ],
    weaknesses: [
      'Emotional picks based on narratives, not data',
      'Refuses to fade favorite teams even when lines are bad',
      'Chases losses with bigger bets',
    ],
    bestBetTypes: [
      { type: 'moneyline', winPct: 46.2, roi: -10.1 },
    ],
    worstBetTypes: [
      { type: 'spread', winPct: 40.0, roi: -21.2 },
      { type: 'parlay', winPct: 22.0, roi: -45.0 },
    ],
    bestSports: [],
    worstSports: [
      { sport: 'NFL', winPct: 41.3, roi: -19.8 },
      { sport: 'NBA', winPct: 41.8, roi: -16.2 },
    ],
    patterns: {
      favoriteBias: 72,
      homeBias: 48,
      overBias: 55,
      avgOdds: -125,
      avgUnits: 1.2,
    },
    recentForm: {
      last7days: { record: '1-5', roi: -68.2 },
      last30days: { record: '6-14', roi: -42.1 },
      lastSeason: { record: '134-189', roi: -18.2 },
    },
    recommendation: 'fade',
    recommendationReason: 'Stephen A. is one of the most profitable fades in sports media. His emotional, narrative-driven picks consistently lose. Fade his spread picks especially.',
  },
  '8': { // Skip Bayless
    capperId: '8',
    generatedAt: '2026-01-03',
    keyInsights: [
      '🤡 Skip is THE fade king - 38.6% win rate is historically bad for a public figure',
      '⭐ Cowboys obsession is legendary: 85% of NFL picks are DAL, hitting just 32%',
      '💰 Fading Skip on Cowboys games alone would net +45 units this season',
    ],
    strengths: [
      'Extremely consistent (at losing)',
      'Never deviates from Cowboys - easy to predict',
    ],
    weaknesses: [
      'Delusional about Cowboys ability',
      'Will not acknowledge bad picks',
      'Doubles down after losses',
    ],
    bestBetTypes: [],
    worstBetTypes: [
      { type: 'spread', winPct: 36.4, roi: -28.2 },
      { type: 'moneyline', winPct: 46.4, roi: -15.4 },
    ],
    bestSports: [],
    worstSports: [
      { sport: 'NFL', winPct: 37.3, roi: -26.4 },
    ],
    patterns: {
      favoriteBias: 78,
      homeBias: 42,
      overBias: 48,
      avgOdds: -145,
      avgUnits: 1.5,
    },
    recentForm: {
      last7days: { record: '0-6', roi: -100.0 },
      last30days: { record: '4-14', roi: -58.2 },
      lastSeason: { record: '98-156', roi: -24.1 },
    },
    recommendation: 'fade',
    recommendationReason: 'Skip Bayless is a legendary fade. His unwavering Cowboys loyalty in the face of reality makes him the most profitable capper to bet against in sports media.',
  },
  '14': { // Tony Romo
    capperId: '14',
    generatedAt: '2026-01-03',
    keyInsights: [
      '✅ Romo is legit sharp - 55.9% on NFL spreads with +24.6 units',
      '🧠 Former QB reads games exceptionally well, especially QB matchups',
      '📊 One of few media personalities worth following, not fading',
    ],
    strengths: [
      'Deep football IQ from playing career',
      'Excellent at reading defenses and predicting play calls',
      'Conservative with unit sizing - preserves bankroll',
    ],
    weaknesses: [
      'Limited to NFL only',
      'Sometimes overthinks prime time games',
    ],
    bestBetTypes: [
      { type: 'spread', winPct: 55.9, roi: 9.4 },
      { type: 'over_under', winPct: 54.2, roi: 6.8 },
    ],
    worstBetTypes: [],
    bestSports: [
      { sport: 'NFL', winPct: 55.9, roi: 9.4 },
    ],
    worstSports: [],
    patterns: {
      favoriteBias: 52,
      homeBias: 50,
      overBias: 48,
      avgOdds: -108,
      avgUnits: 1.0,
    },
    recentForm: {
      last7days: { record: '3-1', roi: 45.0 },
      last30days: { record: '12-8', roi: 18.5 },
      lastSeason: { record: '156-123', roi: 9.4 },
    },
    recommendation: 'follow',
    recommendationReason: 'Tony Romo is a rare media personality who actually provides value. His NFL analysis is data-driven and his picks are profitable long-term.',
  },
  '19': { // Billy Walters
    capperId: '19',
    generatedAt: '2026-01-03',
    keyInsights: [
      '🐐 Billy Walters is THE GOAT - 57.1% lifetime with +89.2 units',
      '📈 Consistently beats closing line value (CLV) by 3.2% average',
      '🎯 Most profitable on NFL spreads and NBA totals',
    ],
    strengths: [
      'Legendary sharp bettor with decades of success',
      'Access to best information and line shopping',
      'Impeccable bankroll management',
      'Beats CLV consistently - the mark of a true sharp',
    ],
    weaknesses: [
      'Picks are hard to get in time',
      'Lines move fast when he bets',
    ],
    bestBetTypes: [
      { type: 'spread', winPct: 56.8, roi: 14.2 },
      { type: 'moneyline', winPct: 58.4, roi: 18.2 },
      { type: 'over_under', winPct: 57.8, roi: 16.1 },
    ],
    worstBetTypes: [],
    bestSports: [
      { sport: 'NFL', winPct: 57.1, roi: 14.8 },
      { sport: 'NBA', winPct: 57.3, roi: 16.9 },
    ],
    worstSports: [],
    patterns: {
      favoriteBias: 45,
      homeBias: 48,
      overBias: 52,
      avgOdds: -105,
      avgUnits: 2.0,
      clvBeatRate: 68.5,
    },
    recentForm: {
      last7days: { record: '4-2', roi: 28.4 },
      last30days: { record: '18-12', roi: 22.1 },
      lastSeason: { record: '312-234', roi: 15.8 },
    },
    recommendation: 'follow',
    recommendationReason: 'Billy Walters is arguably the greatest sports bettor of all time. If you can get his picks before lines move, follow blindly.',
  },
  '11': { // Charles Barkley
    capperId: '11',
    generatedAt: '2026-01-03',
    keyInsights: [
      '😅 Chuck is entertainingly bad - 42.9% with -31.2 units',
      '☀️ Heavy Suns bias (62% of NBA picks) at a brutal 38% hit rate',
      '🎰 "Guarantees" are the ultimate fade signal - 2-11 on guaranteed picks',
    ],
    strengths: [
      'Entertainment value is off the charts',
      'Very predictable biases (Suns, Auburn)',
    ],
    weaknesses: [
      'Admits he doesn\'t study matchups',
      'Emotional attachment to former team',
      'Guaranteed picks are a death sentence',
    ],
    bestBetTypes: [],
    worstBetTypes: [
      { type: 'spread', winPct: 42.1, roi: -18.4 },
      { type: 'moneyline', winPct: 44.2, roi: -12.8 },
    ],
    bestSports: [],
    worstSports: [
      { sport: 'NBA', winPct: 42.9, roi: -15.6 },
    ],
    patterns: {
      favoriteBias: 68,
      homeBias: 45,
      overBias: 58,
      avgOdds: -135,
      avgUnits: 1.0,
    },
    recentForm: {
      last7days: { record: '1-4', roi: -62.0 },
      last30days: { record: '5-11', roi: -38.2 },
      lastSeason: { record: '67-89', roi: -15.6 },
    },
    recommendation: 'fade',
    recommendationReason: 'Charles Barkley provides great TV but terrible picks. Fade his Suns picks and especially his "guarantees" which are historically atrocious.',
  },
}

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
