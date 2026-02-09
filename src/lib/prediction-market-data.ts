// Prediction Market Analytics Data Store
// This module contains TYPE DEFINITIONS for prediction market analytics.
// 
// IMPORTANT: All static data arrays in this file are DEPRECATED.
// They were placeholder data and will return empty arrays.
// Real data should be fetched from database or API endpoints.
// NO MOCK DATA POLICY - Real data only!
//
// Focus: Edge-finding trends, CLV tracking, contrarian signals, market inefficiencies

import { Sport, BetType } from '@/types/leaderboard'

// =============================================================================
// TYPES FOR PREDICTION MARKET ANALYTICS
// =============================================================================

export type PickSource = 'twitter' | 'tv' | 'podcast' | 'discord' | 'telegram' | 'youtube' | 'substack' | 'website' | 'polymarket' | 'kalshi'

export type MarketType = 'sports' | 'politics' | 'crypto' | 'entertainment' | 'finance' | 'weather' | 'world_events'

export interface PredictionMarketCapper {
  id: string
  name: string
  handle: string
  avatarEmoji: string
  source: PickSource
  sourceHandle?: string // @handle or channel name
  verified: boolean
  followers: number
  specialties: MarketType[]
  avgCLV: number // Closing Line Value - THE key metric
  clvBeatRate: number // % of picks that beat CLV
  joinedDate: string
}

export interface PredictionPick {
  id: string
  capperId: string
  marketType: MarketType
  sport?: Sport
  betType?: BetType
  market: string // "Super Bowl Champion 2026"
  selection: string // "Chiefs"
  probability: number // Their assessed probability (0-100)
  marketOdds: number // Odds when picked (American)
  closingOdds?: number // Odds at close
  clvGained?: number // CLV gained (+ is good)
  pickedAt: string
  resolvedAt?: string
  result?: 'win' | 'loss' | 'pending' | 'push'
  units: number
  source: PickSource
  sourceUrl?: string
  confidence: 1 | 2 | 3 | 4 | 5
}

// =============================================================================
// KEY INSIGHT: TRENDS THAT ACTUALLY PROVIDE EDGE
// Based on research from serious betting forums and sharp bettor communities
// =============================================================================

export interface TrendInsight {
  id: string
  title: string
  description: string
  category: 'clv' | 'line_movement' | 'contrarian' | 'situational' | 'market_efficiency' | 'timing' | 'public_vs_sharp'
  sport?: Sport
  betType?: BetType
  marketType?: MarketType
  sampleSize: number
  winRate: number
  roi: number // Return on Investment %
  avgOdds: number
  edgeRating: 1 | 2 | 3 | 4 | 5 // How exploitable is this edge
  timeframe: string // "Last 12 months", "2024 NFL Season"
  isActive: boolean // Still profitable?
  lastUpdated: string
  details: string
}

export interface LineMovement {
  id: string
  gameId: string
  sport: Sport
  teams: { home: string, away: string }
  betType: BetType
  openLine: number
  currentLine: number
  closingLine?: number
  movement: number
  direction: 'steam' | 'reverse' | 'stable' | 'sharp'
  publicBetPct: number // % of bets on favorite
  publicMoneyPct: number // % of money on favorite
  sharpIndicator: boolean // Sharp money detected
  timestamp: string
}

export interface CLVAnalysis {
  capperId: string
  period: 'week' | 'month' | 'season' | 'year'
  totalPicks: number
  clvPositive: number
  clvNegative: number
  avgCLV: number
  bestCLVPick: { market: string, clv: number }
  worstCLVPick: { market: string, clv: number }
  clvByBetType: Record<string, number>
  clvBySport: Record<string, number>
}

// =============================================================================
// PREDICTION MARKET CAPPERS (Polymarket/Kalshi style)
// DEPRECATED: Static data removed - real data only policy
// Data should be fetched from database or API
// =============================================================================

export const predictionCappers: PredictionMarketCapper[] = [
  // NO STATIC DATA - fetch from /api or Supabase
];

// DEPRECATED: Original static data moved to archive
const ARCHIVED_predictionCappers: PredictionMarketCapper[] = [
  {
    id: 'pm-whale-alert',
    name: 'WhaleAlert',
    handle: '@WhalePredictions',
    avatarEmoji: '🐋',
    source: 'polymarket',
    verified: true,
    followers: 45000,
    specialties: ['politics', 'world_events'],
    avgCLV: 4.2,
    clvBeatRate: 68.5,
    joinedDate: '2024-01-15'
  },
  {
    id: 'pm-nate-silver',
    name: 'Nate Silver',
    handle: '@NateSilver538',
    avatarEmoji: '📊',
    source: 'substack',
    sourceHandle: 'Silver Bulletin',
    verified: true,
    followers: 892000,
    specialties: ['politics', 'sports'],
    avgCLV: 3.8,
    clvBeatRate: 71.2,
    joinedDate: '2024-02-01'
  },
  {
    id: 'pm-star-spangled',
    name: 'StarSpangledGamblers',
    handle: '@SSGamblers',
    avatarEmoji: '🇺🇸',
    source: 'twitter',
    verified: true,
    followers: 127000,
    specialties: ['politics', 'entertainment'],
    avgCLV: 5.1,
    clvBeatRate: 64.8,
    joinedDate: '2024-03-10'
  },
  {
    id: 'pm-degendata',
    name: 'DegenData',
    handle: '@DegenDataHQ',
    avatarEmoji: '🎰',
    source: 'discord',
    sourceHandle: 'DegenData Discord',
    verified: true,
    followers: 34000,
    specialties: ['crypto', 'finance'],
    avgCLV: 6.8,
    clvBeatRate: 59.2,
    joinedDate: '2024-04-01'
  },
  {
    id: 'pm-politico-sharp',
    name: 'PoliticoSharp',
    handle: '@PoliticoSharp',
    avatarEmoji: '🏛️',
    source: 'kalshi',
    verified: true,
    followers: 22000,
    specialties: ['politics', 'world_events'],
    avgCLV: 7.2,
    clvBeatRate: 72.1,
    joinedDate: '2024-05-15'
  },
  {
    id: 'pm-crypto-oracle',
    name: 'CryptoOracle',
    handle: '@CryptoOracle_',
    avatarEmoji: '🔮',
    source: 'telegram',
    sourceHandle: 't.me/cryptooracle',
    verified: false,
    followers: 89000,
    specialties: ['crypto', 'finance'],
    avgCLV: 2.1,
    clvBeatRate: 52.3,
    joinedDate: '2024-06-01'
  },
  {
    id: 'pm-weather-whale',
    name: 'WeatherWhale',
    handle: '@WeatherWhale',
    avatarEmoji: '🌪️',
    source: 'twitter',
    verified: true,
    followers: 15000,
    specialties: ['weather'],
    avgCLV: 8.9,
    clvBeatRate: 76.4,
    joinedDate: '2024-07-01'
  },
  {
    id: 'pm-entertainment-edge',
    name: 'AwardsInsider',
    handle: '@AwardsInsider',
    avatarEmoji: '🏆',
    source: 'youtube',
    sourceHandle: 'Awards Insider',
    verified: true,
    followers: 67000,
    specialties: ['entertainment'],
    avgCLV: 4.5,
    clvBeatRate: 61.8,
    joinedDate: '2024-08-01'
  }
]

// =============================================================================
// EDGE-FINDING TRENDS
// DEPRECATED: Static data removed - real data only policy  
// Trends should be fetched from historical_trends table in Supabase
// =============================================================================

export const trendInsights: TrendInsight[] = [
  // NO STATIC DATA - fetch from /api/trends or Supabase historical_trends table
];

// DEPRECATED: Original static data moved to archive
const ARCHIVED_trendInsights: TrendInsight[] = [
  // CLV-BASED TRENDS
  {
    id: 'trend-clv-early-week',
    title: 'Early Week NFL Line Value',
    description: 'Betting NFL spreads Sunday night through Tuesday provides +2.3% CLV on average vs waiting until game day',
    category: 'clv',
    sport: 'NFL',
    betType: 'spread',
    sampleSize: 1247,
    winRate: 53.8,
    roi: 4.2,
    avgOdds: -108,
    edgeRating: 4,
    timeframe: 'Last 12 months',
    isActive: true,
    lastUpdated: '2026-01-02',
    details: 'Sharp money typically lands Sunday night and early Monday. Books adjust by Tuesday. Best window is 8pm Sunday to noon Tuesday for maximum CLV. Avoid Thursday entirely - lines are most efficient.'
  },
  {
    id: 'trend-clv-nba-b2b',
    title: 'NBA Back-to-Back Unders',
    description: 'Road teams on the 2nd night of a back-to-back: Unders hit 57.2% when grabbed early',
    category: 'situational',
    sport: 'NBA',
    betType: 'over_under',
    sampleSize: 423,
    winRate: 57.2,
    roi: 6.8,
    avgOdds: -108,
    edgeRating: 4,
    timeframe: '2024-25 NBA Season',
    isActive: true,
    lastUpdated: '2026-01-02',
    details: 'Books are slow to adjust totals for fatigue. Grab unders when lines first post. Edge disappears by tip-off as sharps hammer it. Key: Team must have traveled 500+ miles.'
  },
  {
    id: 'trend-reverse-line-movement',
    title: 'NFL Reverse Line Movement',
    description: 'When 70%+ public is on one side but line moves opposite direction, take the contrarian side',
    category: 'contrarian',
    sport: 'NFL',
    betType: 'spread',
    sampleSize: 312,
    winRate: 56.4,
    roi: 8.1,
    avgOdds: -107,
    edgeRating: 5,
    timeframe: '2024-25 NFL Season',
    isActive: true,
    lastUpdated: '2026-01-02',
    details: 'Classic sharp vs public indicator. When 75%+ of tickets are on Team A but the line moves toward Team B, follow the money not the tickets. Sharp bettors bet larger amounts, moving lines despite fewer tickets.'
  },
  {
    id: 'trend-steam-moves',
    title: 'Steam Move Followers',
    description: 'Following verified steam moves within 5 minutes yields +3.1% CLV',
    category: 'line_movement',
    sport: 'NFL',
    sampleSize: 891,
    winRate: 54.1,
    roi: 5.2,
    avgOdds: -109,
    edgeRating: 3,
    timeframe: 'Last 12 months',
    isActive: true,
    lastUpdated: '2026-01-02',
    details: 'Steam moves are coordinated sharp action hitting multiple books simultaneously. If you can identify and follow within 5 min, you capture most of the value. After 10 min, edge is gone. Use alerts.'
  },
  {
    id: 'trend-public-dog-sunday',
    title: 'Sunday Night Primetime Dogs',
    description: 'Underdogs +3.5 or more in primetime Sunday/Monday night games cover 54.8% ATS',
    category: 'situational',
    sport: 'NFL',
    betType: 'spread',
    sampleSize: 178,
    winRate: 54.8,
    roi: 3.9,
    avgOdds: -110,
    edgeRating: 3,
    timeframe: 'Last 3 NFL Seasons',
    isActive: true,
    lastUpdated: '2026-01-02',
    details: 'Public loves favorites in primetime. Books shade lines 0.5-1 point toward favorites. Taking dogs in these spots captures inflated numbers consistently.'
  },
  {
    id: 'trend-nba-rest-advantage',
    title: 'NBA Rest vs Fatigue Spreads',
    description: 'Teams with 3+ days rest vs opponent on back-to-back cover 56.1% (1H spreads even better at 58.3%)',
    category: 'situational',
    sport: 'NBA',
    betType: 'spread',
    sampleSize: 267,
    winRate: 56.1,
    roi: 7.4,
    avgOdds: -109,
    edgeRating: 4,
    timeframe: '2024-25 NBA Season',
    isActive: true,
    lastUpdated: '2026-01-02',
    details: 'Rest advantage compounds in 1H when tired teams struggle early. Book lines account for overall game but underweight early-game fatigue. 1H spread provides extra 2% edge.'
  },
  {
    id: 'trend-mlb-rl-dogs',
    title: 'MLB Run Line Dogs +1.5',
    description: 'Dogs +1.5 when facing aces (ERA <3.00) hit 61.2% but value only exists at +130 or better',
    category: 'market_efficiency',
    sport: 'MLB',
    betType: 'spread',
    sampleSize: 445,
    winRate: 61.2,
    roi: 9.3,
    avgOdds: 138,
    edgeRating: 4,
    timeframe: '2025 MLB Season',
    isActive: true,
    lastUpdated: '2026-01-02',
    details: 'Public overrates aces, inflating ML prices. The +1.5 run line on dogs captures value when public piles on ace MLs. Key: Only bet when odds are +130 or better on the RL.'
  },
  {
    id: 'trend-sharp-timing',
    title: 'Sharp Hour: 11am-1pm ET Weekdays',
    description: 'Line movements between 11am-1pm ET on weekdays are 68% sharp-driven. Follow these moves.',
    category: 'timing',
    sampleSize: 2341,
    winRate: 55.2,
    roi: 6.1,
    avgOdds: -108,
    edgeRating: 4,
    timeframe: 'Last 12 months',
    isActive: true,
    lastUpdated: '2026-01-02',
    details: 'Professional bettors work during market hours. The 11am-1pm window sees most sharp action as syndicates coordinate. Weekend line moves are much noisier (more public).'
  },
  {
    id: 'trend-nhl-puck-line',
    title: 'NHL Puck Line Road Favorites',
    description: 'Road favorites -1.5 when closing at -180 ML or shorter hit PL 52.4% at +140 avg odds',
    category: 'market_efficiency',
    sport: 'NHL',
    betType: 'spread',
    sampleSize: 312,
    winRate: 52.4,
    roi: 11.2,
    avgOdds: 142,
    edgeRating: 3,
    timeframe: '2024-25 NHL Season',
    isActive: true,
    lastUpdated: '2026-01-02',
    details: 'Heavy favorites win by 2+ more often than odds imply. The puck line provides leverage on games the public bets anyway. Filter for -180 ML or shorter to find best spots.'
  },
  {
    id: 'trend-weather-edge',
    title: 'Weather Markets: Hurricane Season',
    description: 'Polymarket hurricane landfall markets are systematically overpriced by 8-12% vs NOAA models',
    category: 'market_efficiency',
    marketType: 'weather',
    sampleSize: 47,
    winRate: 63.8,
    roi: 18.4,
    avgOdds: 120,
    edgeRating: 5,
    timeframe: '2025 Hurricane Season',
    isActive: true,
    lastUpdated: '2026-01-02',
    details: 'Prediction markets overreact to scary headlines. NOAA probability forecasts are well-calibrated. When Polymarket shows 40%+ for a CAT4+ hit, NOAA models often show 25-30%. Fade the fear.'
  },
  {
    id: 'trend-politics-momentum',
    title: 'Political Markets: Momentum Overreaction',
    description: 'Political markets overreact to news cycles. Fading 10%+ single-day moves profitable at 62%',
    category: 'contrarian',
    marketType: 'politics',
    sampleSize: 156,
    winRate: 62.1,
    roi: 14.8,
    avgOdds: 115,
    edgeRating: 4,
    timeframe: '2024 Election Cycle',
    isActive: true,
    lastUpdated: '2026-01-02',
    details: 'Prediction markets are emotional. After a debate or major news event, markets overswing. Historical analysis shows fading moves of 10%+ within 48 hours captures the correction.'
  },
  {
    id: 'trend-crypto-correlation',
    title: 'Crypto Markets: BTC Correlation',
    description: 'Altcoin price prediction markets lag BTC moves by 12-24 hours. Front-run the correlation.',
    category: 'timing',
    marketType: 'crypto',
    sampleSize: 234,
    winRate: 58.9,
    roi: 22.3,
    avgOdds: 105,
    edgeRating: 4,
    timeframe: '2025 Q3-Q4',
    isActive: true,
    lastUpdated: '2026-01-02',
    details: 'When BTC makes a decisive move (5%+ in 24h), altcoin prediction markets are slow to adjust. ETH/SOL/etc price predictions can be front-run for 12-24 hours before catching up.'
  },
  {
    id: 'trend-closing-line-value-kings',
    title: 'CLV Kings: Who Actually Beats Closing Lines',
    description: 'Only 12% of tracked cappers consistently beat CLV. Following them yields +7.8% ROI',
    category: 'clv',
    sampleSize: 4521,
    winRate: 54.3,
    roi: 7.8,
    avgOdds: -106,
    edgeRating: 5,
    timeframe: 'Last 12 months',
    isActive: true,
    lastUpdated: '2026-01-02',
    details: 'Win rate alone is meaningless. CLV is THE metric. We track 400+ cappers - only 48 consistently beat closing lines. Following these 48 exclusively generates sustainable profit.'
  },
  {
    id: 'trend-fade-public-totals',
    title: 'Fade Public Totals in Divisional Games',
    description: 'NFL divisional games: Fade the public on totals when 75%+ on one side. Hits 58.3%.',
    category: 'contrarian',
    sport: 'NFL',
    betType: 'over_under',
    sampleSize: 168,
    winRate: 58.3,
    roi: 9.7,
    avgOdds: -108,
    edgeRating: 4,
    timeframe: 'Last 3 NFL Seasons',
    isActive: true,
    lastUpdated: '2026-01-02',
    details: 'Divisional familiarity creates defensive games. Public remembers the last shootout and hammers overs. Unders in divisional matchups with lopsided public action are gold.'
  },
  {
    id: 'trend-ncaab-early-season',
    title: 'NCAAB November/December Line Errors',
    description: 'Books are least efficient in Nov-Dec NCAAB. Opening lines off by 2.1 points on average.',
    category: 'market_efficiency',
    sport: 'NCAAB',
    betType: 'spread',
    sampleSize: 1456,
    winRate: 54.7,
    roi: 5.3,
    avgOdds: -109,
    edgeRating: 4,
    timeframe: '2024-25 NCAAB Season',
    isActive: true,
    lastUpdated: '2026-01-02',
    details: 'Limited data early season = softer lines. Power ratings take 20+ games to stabilize. Exploit conferences with limited early exposure (WCC, A10, MVC). Efficiency improves dramatically by February.'
  },
  {
    id: 'trend-awards-insider',
    title: 'Awards Season: Industry Insiders Edge',
    description: 'Following industry publication predictions beats markets by 8.4% on major awards',
    category: 'market_efficiency',
    marketType: 'entertainment',
    sampleSize: 89,
    winRate: 67.4,
    roi: 12.1,
    avgOdds: 125,
    edgeRating: 3,
    timeframe: '2024-25 Awards Season',
    isActive: true,
    lastUpdated: '2026-01-02',
    details: 'Variety, THR, and Guild publications have insider info prediction markets lack. Their consensus picks beat Polymarket/Kalshi odds. Cross-reference 3+ publications for strongest signal.'
  }
]

// =============================================================================
// LINE MOVEMENTS
// DEPRECATED: Static data removed - real data only policy
// Line movements should be fetched from Odds API or Supabase
// =============================================================================

export const lineMovements: LineMovement[] = [
  // NO STATIC DATA - fetch from /api/odds or live API
];

// DEPRECATED: Original static data moved to archive
const ARCHIVED_lineMovements: LineMovement[] = [
  {
    id: 'lm-1',
    gameId: 'nfl-week18-1',
    sport: 'NFL',
    teams: { home: 'Buccaneers', away: 'Panthers' },
    betType: 'spread',
    openLine: -7.5,
    currentLine: -8.5,
    movement: -1,
    direction: 'steam',
    publicBetPct: 72,
    publicMoneyPct: 58,
    sharpIndicator: true,
    timestamp: '2026-01-03T09:00:00Z'
  },
  {
    id: 'lm-2',
    gameId: 'nfl-week18-2',
    sport: 'NFL',
    teams: { home: '49ers', away: 'Seahawks' },
    betType: 'spread',
    openLine: 3,
    currentLine: 1.5,
    movement: 1.5,
    direction: 'reverse',
    publicBetPct: 68,
    publicMoneyPct: 44,
    sharpIndicator: true,
    timestamp: '2026-01-03T10:30:00Z'
  },
  {
    id: 'lm-3',
    gameId: 'nba-jan3-1',
    sport: 'NBA',
    teams: { home: 'Lakers', away: 'Grizzlies' },
    betType: 'over_under',
    openLine: 228.5,
    currentLine: 225.5,
    movement: -3,
    direction: 'steam',
    publicBetPct: 61,
    publicMoneyPct: 52,
    sharpIndicator: true,
    timestamp: '2026-01-03T11:00:00Z'
  }
]

// =============================================================================
// PUBLIC VS SHARP MONEY ANALYSIS
// =============================================================================

export interface PublicSharpSplit {
  gameId: string
  sport: Sport
  teams: { home: string, away: string }
  spread: {
    publicSide: 'home' | 'away'
    publicPct: number
    sharpSide: 'home' | 'away'
    sharpIndicators: number // 0-5 sharp signals
  }
  total: {
    publicSide: 'over' | 'under'
    publicPct: number
    sharpSide: 'over' | 'under'
    sharpIndicators: number
  }
  timestamp: string
}

export const publicSharpSplits: PublicSharpSplit[] = [
  // NO STATIC DATA - fetch from /api/betting-splits or live API
];

// DEPRECATED: Original static data moved to archive
const ARCHIVED_publicSharpSplits: PublicSharpSplit[] = [
  {
    gameId: 'nfl-week18-1',
    sport: 'NFL',
    teams: { home: 'Buccaneers', away: 'Panthers' },
    spread: {
      publicSide: 'home',
      publicPct: 72,
      sharpSide: 'home',
      sharpIndicators: 4
    },
    total: {
      publicSide: 'over',
      publicPct: 64,
      sharpSide: 'under',
      sharpIndicators: 3
    },
    timestamp: '2026-01-03T09:00:00Z'
  },
  {
    gameId: 'nfl-week18-2',
    sport: 'NFL',
    teams: { home: '49ers', away: 'Seahawks' },
    spread: {
      publicSide: 'home',
      publicPct: 68,
      sharpSide: 'away',
      sharpIndicators: 5
    },
    total: {
      publicSide: 'over',
      publicPct: 71,
      sharpSide: 'over',
      sharpIndicators: 2
    },
    timestamp: '2026-01-03T10:30:00Z'
  }
]

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

export function getTrendsByCategory(category: TrendInsight['category']): TrendInsight[] {
  return trendInsights.filter(t => t.category === category && t.isActive)
}

export function getTrendsBySport(sport: Sport): TrendInsight[] {
  return trendInsights.filter(t => t.sport === sport && t.isActive)
}

export function getHighEdgeTrends(minEdgeRating: number = 4): TrendInsight[] {
  return trendInsights.filter(t => t.edgeRating >= minEdgeRating && t.isActive)
    .sort((a, b) => b.roi - a.roi)
}

export function getTopCLVCappers(limit: number = 10): PredictionMarketCapper[] {
  return [...predictionCappers]
    .sort((a, b) => b.clvBeatRate - a.clvBeatRate)
    .slice(0, limit)
}

export function getSharpPlays(): PublicSharpSplit[] {
  return publicSharpSplits.filter(split => 
    split.spread.sharpIndicators >= 4 || split.total.sharpIndicators >= 4
  )
}

export function getReverseLineMovements(): LineMovement[] {
  return lineMovements.filter(lm => lm.direction === 'reverse')
}

export function getSteamMoves(): LineMovement[] {
  return lineMovements.filter(lm => lm.direction === 'steam')
}

// Calculate implied probability from American odds
export function impliedProbability(odds: number): number {
  if (odds > 0) {
    return 100 / (odds + 100) * 100
  } else {
    return Math.abs(odds) / (Math.abs(odds) + 100) * 100
  }
}

// Calculate CLV from picked odds vs closing odds
export function calculateCLV(pickedOdds: number, closingOdds: number): number {
  const pickedProb = impliedProbability(pickedOdds)
  const closingProb = impliedProbability(closingOdds)
  return closingProb - pickedProb
}

// =============================================================================
// PREDICTION MARKET ANALYTICS SUMMARY
// Returns computed values from real data (will be 0s when no data loaded)
// =============================================================================

export const analyticsSummary = {
  totalTrendsTracked: trendInsights.length,
  activeTrends: trendInsights.filter(t => t.isActive).length,
  avgROI: trendInsights.length > 0 ? trendInsights.reduce((sum, t) => sum + t.roi, 0) / trendInsights.length : 0,
  avgWinRate: trendInsights.length > 0 ? trendInsights.reduce((sum, t) => sum + t.winRate, 0) / trendInsights.length : 0,
  totalSampleSize: trendInsights.reduce((sum, t) => sum + t.sampleSize, 0),
  topEdgeCategory: 'contrarian' as const,
  topEdgeSport: 'NFL' as Sport,
  lastUpdated: new Date().toISOString().split('T')[0]  // Dynamic date
}

// =============================================================================
// FUTURE IDEAS (P3)
// =============================================================================

export const futureIdeas = {
  p3: [
    {
      id: 'hedge-calculator',
      title: 'Hedge Calculator',
      description: 'Calculate optimal hedge amounts to guarantee profit or minimize loss on existing positions',
      priority: 3,
      estimatedValue: 'High - very requested feature',
      notes: 'Include: live odds integration, multi-leg hedging, cash-out comparison'
    },
    {
      id: 'kelly-criterion',
      title: 'Kelly Criterion Calculator',
      description: 'Optimal bet sizing based on edge and bankroll',
      priority: 3,
      estimatedValue: 'Medium - serious bettors only',
      notes: 'Include fractional Kelly options'
    },
    {
      id: 'correlation-tracker',
      title: 'Parlay Correlation Warnings',
      description: 'Alert users when parlay legs are correlated (books exploit this)',
      priority: 3,
      estimatedValue: 'High - saves users money',
      notes: 'QB/WR stacks, weather correlations, etc.'
    },
    {
      id: 'injury-impact',
      title: 'Injury Impact Analyzer',
      description: 'Historical impact of specific injuries on lines and outcomes',
      priority: 3,
      estimatedValue: 'Medium',
      notes: 'Star player out = X point adjustment'
    }
  ]
}
