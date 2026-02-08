// =============================================================================
// BETTING INTELLIGENCE DATA LAYER
// Integrates all 12 essential betting data points with AI analysis
// NOW WIRED TO REAL DATA SOURCES
// =============================================================================

import { TeamAnalytics, getTeamByAbbr } from './analytics-data'
import { geminiModel } from './gemini'
import type { Sport } from '@/types/leaderboard'
import { 
  fetchBettingSplitsFromActionNetwork, 
  detectSharpMoney,
  fetchMultiBookOdds
} from './scrapers/action-network'
import type { BettingSplit } from './scrapers/betting-splits'
import { calculateComprehensiveEdgeScore } from './edge/engine'
import { calculateTeamATS } from './api/ats-calculator'

// Cache for betting splits to avoid excessive API calls
let bettingSplitsCache: {
  data: BettingSplit[]
  sport: string
  fetchedAt: number
} | null = null

const CACHE_DURATION_MS = 2 * 60 * 1000 // 2 minutes

// Helper to get team analytics
function getTeamAnalytics(sport: string, abbr: string): TeamAnalytics | null {
  return getTeamByAbbr(sport as Sport, abbr) || null
}

// =============================================================================
// CORE DATA POINT INTERFACES
// =============================================================================

export interface CLVData {
  openSpread: number
  currentSpread: number
  openTotal: number
  currentTotal: number
  openHomeML: number
  currentHomeML: number
  spreadCLV: number // Closing Line Value for spread bet
  totalCLV: number
  mlCLV: number
  grade: 'excellent' | 'good' | 'neutral' | 'poor'
  description: string
}

export interface LineMovementData {
  spread: {
    open: number
    current: number
    high: number
    low: number
    direction: 'toward_home' | 'toward_away' | 'stable'
    magnitude: 'sharp' | 'moderate' | 'minimal'
    steamMoveDetected: boolean
  }
  total: {
    open: number
    current: number
    high: number
    low: number
    direction: 'up' | 'down' | 'stable'
    magnitude: 'sharp' | 'moderate' | 'minimal'
  }
  moneyline: {
    homeOpen: number
    homeCurrent: number
    awayOpen: number
    awayCurrent: number
    impliedProbShift: number
  }
  timeline: {
    timestamp: string
    spread: number
    total: number
    homeML: number
  }[]
}

export interface PublicSharpSplits {
  spread: {
    publicHomePct: number
    publicAwayPct: number
    moneyHomePct: number
    moneyAwayPct: number
    sharpSide: 'home' | 'away' | 'neutral'
    reverseLineMovement: boolean
    rlmStrength: 'strong' | 'moderate' | 'weak' | 'none'
  }
  total: {
    publicOverPct: number
    publicUnderPct: number
    moneyOverPct: number
    moneyUnderPct: number
    sharpSide: 'over' | 'under' | 'neutral'
    reverseLineMovement: boolean
  }
  moneyline: {
    publicHomePct: number
    publicAwayPct: number
    moneyHomePct: number
    moneyAwayPct: number
  }
  consensus: {
    publicLean: string
    sharpLean: string
    alignment: 'aligned' | 'split' | 'opposed'
  }
}

export interface InjuryImpact {
  homeTeam: {
    outPlayers: PlayerInjury[]
    questionablePlayers: PlayerInjury[]
    totalImpactScore: number // 0-100
    positionImpacts: { position: string; impact: 'critical' | 'high' | 'medium' | 'low' }[]
  }
  awayTeam: {
    outPlayers: PlayerInjury[]
    questionablePlayers: PlayerInjury[]
    totalImpactScore: number
    positionImpacts: { position: string; impact: 'critical' | 'high' | 'medium' | 'low' }[]
  }
  lineImpact: {
    spreadAdjustment: number
    totalAdjustment: number
    narrative: string
  }
}

interface PlayerInjury {
  name: string
  position: string
  status: 'Out' | 'Doubtful' | 'Questionable' | 'Probable'
  injuryType: string
  impactRating: number // 1-5
  isStarter: boolean
  isStar: boolean
}

export interface WeatherImpact {
  venue: string
  isOutdoor: boolean
  isDome: boolean
  conditions: {
    temperature: number
    feelsLike: number
    windSpeed: number
    windDirection: string
    precipitation: number
    humidity: number
    conditions: string
  }
  bettingImpact: {
    level: 'none' | 'low' | 'medium' | 'high' | 'extreme'
    spreadImpact: number
    totalImpact: number
    affectedBets: string[]
    narrative: string
  }
  historicalInWeather: {
    homeTeamRecord: string
    awayTeamRecord: string
    avgTotalInConditions: number
  }
}

export interface SituationalAngles {
  home: {
    restDays: number
    isBackToBack: boolean
    travelMiles: number
    afterWinLoss: 'win' | 'loss' | 'unknown'
    afterBlowout: boolean
    afterOT: boolean
    isRevenge: boolean
    isDivisional: boolean
    isPrimetime: boolean
    isPlayoffs: boolean
    letdownSpot: boolean
    lookaheadSpot: boolean
    sandwichSpot: boolean
    trapGame: boolean
    homeStandLength: number
    roadTripLength: number
  }
  away: {
    restDays: number
    isBackToBack: boolean
    travelMiles: number
    afterWinLoss: 'win' | 'loss' | 'unknown'
    afterBlowout: boolean
    afterOT: boolean
    isRevenge: boolean
    isDivisional: boolean
    isPrimetime: boolean
    letdownSpot: boolean
    lookaheadSpot: boolean
    sandwichSpot: boolean
    trapGame: boolean
    homeStandLength: number
    roadTripLength: number
  }
  angles: SituationalAngle[]
}

interface SituationalAngle {
  name: string
  team: 'home' | 'away'
  description: string
  historicalRecord: string
  roi: number
  confidence: number
  betType: 'spread' | 'total' | 'ml'
  pick: string
}

export interface ATSRecords {
  homeTeam: {
    overall: { wins: number; losses: number; pushes: number; pct: number }
    home: { wins: number; losses: number; pushes: number; pct: number }
    asFavorite: { wins: number; losses: number; pushes: number; pct: number }
    asUnderdog: { wins: number; losses: number; pushes: number; pct: number }
    last10: { wins: number; losses: number; pushes: number; pct: number }
    vsDivision: { wins: number; losses: number; pushes: number; pct: number }
    inPrimetime: { wins: number; losses: number; pushes: number; pct: number }
  }
  awayTeam: {
    overall: { wins: number; losses: number; pushes: number; pct: number }
    away: { wins: number; losses: number; pushes: number; pct: number }
    asFavorite: { wins: number; losses: number; pushes: number; pct: number }
    asUnderdog: { wins: number; losses: number; pushes: number; pct: number }
    last10: { wins: number; losses: number; pushes: number; pct: number }
    vsDivision: { wins: number; losses: number; pushes: number; pct: number }
    inPrimetime: { wins: number; losses: number; pushes: number; pct: number }
  }
  h2hATS: {
    homeWins: number
    awayWins: number
    pushes: number
    homeRoi: number
    awayRoi: number
  }
}

export interface OUTrends {
  homeTeam: {
    overall: { overs: number; unders: number; pushes: number; overPct: number }
    home: { overs: number; unders: number; pushes: number; overPct: number }
    asFavorite: { overs: number; unders: number; pushes: number; overPct: number }
    asUnderdog: { overs: number; unders: number; pushes: number; overPct: number }
    last10: { overs: number; unders: number; pushes: number; overPct: number }
    avgTotal: number
    avgActual: number
    marginVsTotal: number
  }
  awayTeam: {
    overall: { overs: number; unders: number; pushes: number; overPct: number }
    away: { overs: number; unders: number; pushes: number; overPct: number }
    asFavorite: { overs: number; unders: number; pushes: number; overPct: number }
    asUnderdog: { overs: number; unders: number; pushes: number; overPct: number }
    last10: { overs: number; unders: number; pushes: number; overPct: number }
    avgTotal: number
    avgActual: number
    marginVsTotal: number
  }
  combined: {
    h2hOvers: number
    h2hUnders: number
    h2hAvgTotal: number
    projectedTotal: number
    valueOnOver: boolean
    valueOnUnder: boolean
    edgePct: number
  }
  trends: {
    description: string
    record: string
    roi: number
    pick: 'over' | 'under'
    confidence: number
  }[]
}

export interface KeyNumbers {
  spread: {
    currentLine: number
    nearKeyNumber: boolean
    keyNumber: number | null
    buyPointValue: number
    sellPointValue: number
    historicalPushRate: number
    recommendation: string | null
  }
  total: {
    currentLine: number
    nearKeyNumber: boolean
    keyNumber: number | null
    buyPointValue: number
    sellPointValue: number
    historicalPushRate: number
    recommendation: string | null
  }
  sport: string
  keyNumbersForSport: number[]
  analysis: string
}

export interface H2HHistory {
  gamesPlayed: number
  homeTeamWins: number
  awayTeamWins: number
  ties: number
  homeTeamATSRecord: string
  awayTeamATSRecord: string
  overUnderRecord: string
  avgMargin: number
  avgTotal: number
  lastMeeting: {
    date: string
    homeScore: number
    awayScore: number
    spread: number
    total: number
    spreadResult: string
    totalResult: string
  } | null
  recentGames: {
    date: string
    homeScore: number
    awayScore: number
    winner: string
    spreadResult: string
    totalResult: string
    venue: string
  }[]
  streaks: {
    homeTeamStreak: number
    awayTeamStreak: number
    overStreak: number
    underStreak: number
  }
  insights: string[]
}

export interface MarketConsensus {
  spreadConsensus: {
    pick: string
    confidence: number
    sources: { name: string; pick: string }[]
    agreement: number
  }
  totalConsensus: {
    pick: string
    confidence: number
    sources: { name: string; pick: string }[]
    agreement: number
  }
  mlConsensus: {
    pick: string
    confidence: number
    sources: { name: string; pick: string }[]
    agreement: number
  }
  sharpestPick: {
    betType: string
    pick: string
    confidence: number
    reasoning: string
  } | null
}

export interface LiveBettingEdges {
  inGameValue: {
    detected: boolean
    description: string
    suggestedBet: string | null
    confidence: number
  }
  momentumShift: {
    detected: boolean
    favoringTeam: string | null
    magnitude: 'small' | 'medium' | 'large'
  }
  paceAnalysis: {
    currentPace: number
    projectedTotal: number
    liveTotal: number
    edge: 'over' | 'under' | 'none'
    edgePct: number
  }
  keyStats: {
    stat: string
    value: string
    impact: string
  }[]
}

// =============================================================================
// COMPREHENSIVE MATCHUP INTELLIGENCE
// =============================================================================

export interface MatchupIntelligence {
  gameId: string
  sport: string
  homeTeam: { name: string; abbr: string; record?: string }
  awayTeam: { name: string; abbr: string; record?: string }
  gameDate: string
  gameTime: string
  venue: string
  broadcast: string

  // The 12 Essential Data Points
  clv: CLVData
  lineMovement: LineMovementData
  publicSharpSplits: PublicSharpSplits
  injuryImpact: InjuryImpact
  weather: WeatherImpact
  situational: SituationalAngles
  atsRecords: ATSRecords
  ouTrends: OUTrends
  keyNumbers: KeyNumbers
  h2h: H2HHistory
  marketConsensus: MarketConsensus
  liveEdges: LiveBettingEdges | null

  // Existing analytics integration
  teamAnalytics: {
    home: TeamAnalytics | null
    away: TeamAnalytics | null
  }
  trends: {
    matched: number
    spreadTrends: any[]
    totalTrends: any[]
    mlTrends: any[]
    aggregateConfidence: number
  }

  // AI Analysis
  aiAnalysis: AIMatchupAnalysis | null

  // Edge Score (aggregate of all factors)
  edgeScore: {
    overall: number
    breakdown: {
      clvValue: number
      sharpSignal: number
      trendAlignment: number
      situationalEdge: number
      injuryAdvantage: number
      weatherEdge: number
      h2hEdge: number
    }
    topEdge: {
      betType: string
      pick: string
      confidence: number
      reasoning: string[]
    } | null
  }

  // Timestamps
  lastUpdated: string
  dataFreshness: {
    odds: 'live' | 'recent' | 'stale'
    injuries: 'live' | 'recent' | 'stale'
    weather: 'live' | 'recent' | 'stale'
  }
}

export interface AIMatchupAnalysis {
  summary: string
  winProbability: { home: number; away: number }
  projectedScore: { home: number; away: number }
  
  spreadAnalysis: {
    pick: string
    confidence: number
    reasoning: string
    keyFactors: string[]
    risks: string[]
  }
  
  totalAnalysis: {
    pick: string
    confidence: number
    reasoning: string
    keyFactors: string[]
    paceProjection: string
  }
  
  mlAnalysis: {
    pick: string
    confidence: number
    value: number // implied vs actual
    reasoning: string
  }
  
  propPicks: {
    player: string
    prop: string
    pick: string
    confidence: number
    reasoning: string
  }[]
  
  keyEdges: string[]
  majorRisks: string[]
  
  betGrades: {
    spread: 'A' | 'B' | 'C' | 'D' | 'F'
    total: 'A' | 'B' | 'C' | 'D' | 'F'
    ml: 'A' | 'B' | 'C' | 'D' | 'F'
  }
}

// =============================================================================
// DATA AGGREGATION FUNCTIONS
// =============================================================================

/**
 * Get comprehensive matchup intelligence for a game
 */
export async function getMatchupIntelligence(
  gameId: string,
  sport: string,
  homeTeam: { name: string; abbr: string },
  awayTeam: { name: string; abbr: string },
  options?: {
    includeAI?: boolean
    includeLive?: boolean
  }
): Promise<MatchupIntelligence> {
  const now = new Date().toISOString()
  
  // Fetch all data points in parallel
  const [
    clvData,
    lineMovementData,
    splitsData,
    injuryData,
    weatherData,
    situationalData,
    atsData,
    ouData,
    keyNumbersData,
    h2hData,
    homeAnalytics,
    awayAnalytics
  ] = await Promise.all([
    getCLVData(gameId, sport),
    getLineMovementData(gameId, sport),
    getPublicSharpSplits(gameId, sport, homeTeam.name, awayTeam.name),
    getInjuryImpact(gameId, sport, homeTeam.abbr, awayTeam.abbr),
    getWeatherImpact(gameId, sport),
    getSituationalAngles(gameId, sport, homeTeam.abbr, awayTeam.abbr),
    getATSRecords(sport, homeTeam.abbr, awayTeam.abbr),
    getOUTrends(sport, homeTeam.abbr, awayTeam.abbr),
    getKeyNumbers(gameId, sport),
    getH2HHistory(sport, homeTeam.abbr, awayTeam.abbr),
    getTeamAnalytics(sport, homeTeam.abbr),
    getTeamAnalytics(sport, awayTeam.abbr)
  ])
  
  // Get market consensus with real splits data
  const consensusData = await getMarketConsensus(gameId, sport, splitsData)

  // Calculate edge score from all factors
  const edgeScore = calculateComprehensiveEdgeScore({
    clv: clvData,
    lineMovement: lineMovementData,
    splits: splitsData,
    injuries: injuryData,
    weather: weatherData,
    situational: situationalData,
    ats: atsData,
    ou: ouData,
    keyNumbers: keyNumbersData,
    h2h: h2hData,
    consensus: consensusData
  })

  // Get AI analysis if requested
  let aiAnalysis: AIMatchupAnalysis | null = null
  if (options?.includeAI) {
    aiAnalysis = await generateAIAnalysis({
      gameId,
      sport,
      homeTeam,
      awayTeam,
      clv: clvData,
      lineMovement: lineMovementData,
      splits: splitsData,
      injuries: injuryData,
      weather: weatherData,
      situational: situationalData,
      ats: atsData,
      ou: ouData,
      keyNumbers: keyNumbersData,
      h2h: h2hData,
      consensus: consensusData,
      homeAnalytics,
      awayAnalytics
    })
  }

  // Get live edges if game is in progress
  let liveEdges: LiveBettingEdges | null = null
  if (options?.includeLive) {
    liveEdges = await getLiveBettingEdges(gameId, sport)
  }

  return {
    gameId,
    sport,
    homeTeam: { name: homeTeam.name, abbr: homeTeam.abbr },
    awayTeam: { name: awayTeam.name, abbr: awayTeam.abbr },
    gameDate: '', // Would be populated from game data
    gameTime: '',
    venue: weatherData.venue,
    broadcast: '',

    clv: clvData,
    lineMovement: lineMovementData,
    publicSharpSplits: splitsData,
    injuryImpact: injuryData,
    weather: weatherData,
    situational: situationalData,
    atsRecords: atsData,
    ouTrends: ouData,
    keyNumbers: keyNumbersData,
    h2h: h2hData,
    marketConsensus: consensusData,
    liveEdges,

    teamAnalytics: {
      home: homeAnalytics,
      away: awayAnalytics
    },
    trends: {
      matched: 0,
      spreadTrends: [],
      totalTrends: [],
      mlTrends: [],
      aggregateConfidence: 0
    },

    aiAnalysis,
    edgeScore,

    lastUpdated: now,
    dataFreshness: {
      odds: 'recent',
      injuries: 'recent',
      weather: 'recent'
    }
  }
}

// =============================================================================
// DATA FETCHING FUNCTIONS
// =============================================================================

async function getCLVData(gameId: string, sport: string): Promise<CLVData> {
  // Attempt to compute CLV from stored line_snapshots table
  try {
    const { createAdminClient } = await import('@/lib/supabase/server')
    const supabase = await createAdminClient()

    // Get earliest (opening) snapshot and latest snapshot for this game
    const { data: openingRows, error: openErr } = await supabase
      .from('line_snapshots')
      .select('*')
      .eq('game_id', gameId)
      .order('snapshot_ts', { ascending: true })
      .limit(1)

    const { data: latestRows, error: latestErr } = await supabase
      .from('line_snapshots')
      .select('*')
      .eq('game_id', gameId)
      .order('snapshot_ts', { ascending: false })
      .limit(1)

    if (openErr || latestErr) {
      console.error('Supabase CLV query error', openErr || latestErr)
      throw new Error('CLV query failed')
    }

    // If no snapshots in DB, try to get from ESPN API as fallback
    if (!openingRows || openingRows.length === 0 || !latestRows || latestRows.length === 0) {
      return await fetchCLVFromESPN(gameId, sport)
    }

    const open = openingRows[0]
    const latest = latestRows[0]

    const openSpread = open.spread_home ?? open.spread_away ?? 0
    const currentSpread = latest.spread_home ?? latest.spread_away ?? 0
    const openTotal = open.total_line ?? 0
    const currentTotal = latest.total_line ?? 0
    const openHomeML = open.home_ml ?? 0
    const currentHomeML = latest.home_ml ?? 0

    const spreadCLV = Number(currentSpread) - Number(openSpread)
    const totalCLV = Number(openTotal) - Number(currentTotal)
    const mlCLV = Number(currentHomeML) - Number(openHomeML)

    let grade: CLVData['grade'] = 'neutral'
    const absSpread = Math.abs(spreadCLV)
    if (absSpread >= 2) grade = 'excellent'
    else if (absSpread >= 1) grade = 'good'
    else if (absSpread > 0) grade = 'neutral'

    return {
      openSpread: Number(openSpread),
      currentSpread: Number(currentSpread),
      openTotal: Number(openTotal),
      currentTotal: Number(currentTotal),
      openHomeML: Number(openHomeML),
      currentHomeML: Number(currentHomeML),
      spreadCLV: Number(spreadCLV),
      totalCLV: Number(totalCLV),
      mlCLV: Number(mlCLV),
      grade,
      description: `Computed from ${openingRows.length} opening rows and ${latestRows.length} latest rows`
    }
  } catch (error) {
    console.error('getCLVData error:', error)
    // Fallback to ESPN API
    return await fetchCLVFromESPN(gameId, sport)
  }
}

// Fetch CLV data from ESPN API as fallback when line_snapshots table is empty
async function fetchCLVFromESPN(gameId: string, sport: string): Promise<CLVData> {
  try {
    const sportMap: Record<string, string> = {
      'NFL': 'football/nfl',
      'NBA': 'basketball/nba',
      'MLB': 'baseball/mlb',
      'NHL': 'hockey/nhl',
      'NCAAF': 'football/college-football',
      'NCAAB': 'basketball/mens-college-basketball'
    }
    const sportPath = sportMap[sport.toUpperCase()] || 'football/nfl'
    const url = `https://site.api.espn.com/apis/site/v2/sports/${sportPath}/summary?event=${gameId}`
    
    const response = await fetch(url, {
      headers: { 'Accept': 'application/json', 'User-Agent': 'Matchups/1.0' },
      next: { revalidate: 120 }
    })
    
    if (!response.ok) {
      throw new Error(`ESPN API returned ${response.status}`)
    }
    
    const data = await response.json()
    
    // Extract odds from pickcenter
    if (!data.pickcenter || !Array.isArray(data.pickcenter)) {
      return {
        openSpread: 0, currentSpread: 0, openTotal: 0, currentTotal: 0,
        openHomeML: 0, currentHomeML: 0, spreadCLV: 0, totalCLV: 0, mlCLV: 0,
        grade: 'neutral', description: 'No odds data in ESPN response'
      }
    }
    
    // Find DraftKings or first available provider
    const dkOdds = data.pickcenter.find((p: { provider?: { name?: string } }) => 
      p.provider?.name?.toLowerCase().includes('draftkings')
    )
    const primaryOdds = dkOdds || data.pickcenter[0]
    
    if (!primaryOdds) {
      return {
        openSpread: 0, currentSpread: 0, openTotal: 0, currentTotal: 0,
        openHomeML: 0, currentHomeML: 0, spreadCLV: 0, totalCLV: 0, mlCLV: 0,
        grade: 'neutral', description: 'No primary odds provider found'
      }
    }
    
    // Extract line movement from pointSpread and total objects
    const pointSpread = primaryOdds.pointSpread
    const total = primaryOdds.total
    
    let openSpread = 0, currentSpread = 0, openTotal = 0, currentTotal = 0
    let openHomeML = 0, currentHomeML = 0
    
    if (pointSpread?.home) {
      openSpread = parseFloat(pointSpread.home.open?.line || '0')
      currentSpread = parseFloat(pointSpread.home.close?.line || pointSpread.home.current?.line || '0')
    }
    
    if (total?.over) {
      // Total line format may be like "o45.5" or just "45.5"
      const openLine = (total.over.open?.line || '').toString().replace(/[ou]/gi, '')
      const closeLine = (total.over.close?.line || total.over.current?.line || '').toString().replace(/[ou]/gi, '')
      openTotal = parseFloat(openLine) || 0
      currentTotal = parseFloat(closeLine) || 0
    }
    
    // Try to get moneyline
    if (primaryOdds.homeTeamOdds?.moneyLine) {
      currentHomeML = primaryOdds.homeTeamOdds.moneyLine
    }
    
    // Calculate CLV
    const spreadCLV = currentSpread - openSpread
    const totalCLV = openTotal - currentTotal // Positive = total went down (under value)
    const mlCLV = 0 // Would need open ML data
    
    // Grade the CLV
    let grade: CLVData['grade'] = 'neutral'
    const absSpreadCLV = Math.abs(spreadCLV)
    const absTotalCLV = Math.abs(totalCLV)
    const combinedMovement = absSpreadCLV + absTotalCLV
    
    if (combinedMovement >= 2) grade = 'excellent'
    else if (combinedMovement >= 1) grade = 'good'
    
    // Build description
    const movements: string[] = []
    if (spreadCLV !== 0) {
      movements.push(`Spread ${spreadCLV > 0 ? 'moved up' : 'moved down'} ${absSpreadCLV.toFixed(1)} points`)
    }
    if (totalCLV !== 0) {
      movements.push(`Total ${totalCLV > 0 ? 'dropped' : 'rose'} ${absTotalCLV.toFixed(1)} points`)
    }
    
    const description = movements.length > 0 
      ? `${movements.join(', ')} (ESPN data)`
      : 'No significant line movement detected'
    
    return {
      openSpread,
      currentSpread,
      openTotal,
      currentTotal,
      openHomeML,
      currentHomeML,
      spreadCLV,
      totalCLV,
      mlCLV,
      grade,
      description
    }
  } catch (error) {
    console.error('fetchCLVFromESPN error:', error)
    return {
      openSpread: 0, currentSpread: 0, openTotal: 0, currentTotal: 0,
      openHomeML: 0, currentHomeML: 0, spreadCLV: 0, totalCLV: 0, mlCLV: 0,
      grade: 'neutral', description: 'Failed to fetch ESPN CLV data'
    }
  }
}

async function getLineMovementData(gameId: string, sport: string): Promise<LineMovementData> {
  // Try to fetch line movement from ESPN API
  try {
    const sportMap: Record<string, string> = {
      'NFL': 'football/nfl',
      'NBA': 'basketball/nba',
      'MLB': 'baseball/mlb',
      'NHL': 'hockey/nhl',
      'NCAAF': 'football/college-football',
      'NCAAB': 'basketball/mens-college-basketball'
    }
    const sportPath = sportMap[sport.toUpperCase()] || 'football/nfl'
    const url = `https://site.api.espn.com/apis/site/v2/sports/${sportPath}/summary?event=${gameId}`
    
    const response = await fetch(url, {
      headers: { 'Accept': 'application/json', 'User-Agent': 'Matchups/1.0' },
      next: { revalidate: 120 }
    })
    
    if (!response.ok) {
      throw new Error(`ESPN API returned ${response.status}`)
    }
    
    const data = await response.json()
    
    // Find DraftKings or first available provider
    if (data.pickcenter && Array.isArray(data.pickcenter)) {
      const dkOdds = data.pickcenter.find((p: { provider?: { name?: string } }) => 
        p.provider?.name?.toLowerCase().includes('draftkings')
      )
      const primaryOdds = dkOdds || data.pickcenter[0]
      
      if (primaryOdds) {
        const pointSpread = primaryOdds.pointSpread
        const total = primaryOdds.total

        let spreadOpen = 0, spreadCurrent = 0
        let totalOpen = 0, totalCurrent = 0
        
        if (pointSpread?.home) {
          spreadOpen = parseFloat(pointSpread.home.open?.line || '0')
          spreadCurrent = parseFloat(pointSpread.home.close?.line || pointSpread.home.current?.line || '0')
        }
        
        if (total?.over) {
          const openLine = (total.over.open?.line || '').toString().replace(/[ou]/gi, '')
          const closeLine = (total.over.close?.line || total.over.current?.line || '').toString().replace(/[ou]/gi, '')
          totalOpen = parseFloat(openLine) || 0
          totalCurrent = parseFloat(closeLine) || 0
        }
        
        // Determine movement direction and magnitude
        const spreadMove = spreadCurrent - spreadOpen
        const totalMove = totalCurrent - totalOpen
        
        // For spread: negative means line moved toward home (e.g., -3.5 to -4.5) = more points given
        // Positive means line moved toward away (e.g., -3.5 to -2.5) = fewer points given
        const spreadDirection: 'toward_home' | 'toward_away' | 'stable' = 
          spreadMove < -0.5 ? 'toward_home' : spreadMove > 0.5 ? 'toward_away' : 'stable'
        const totalDirection: 'up' | 'down' | 'stable' = 
          totalMove > 0.5 ? 'up' : totalMove < -0.5 ? 'down' : 'stable'
        
        const spreadMagnitude: 'sharp' | 'moderate' | 'minimal' = 
          Math.abs(spreadMove) >= 2 ? 'sharp' : Math.abs(spreadMove) >= 1 ? 'moderate' : 'minimal'
        const totalMagnitude: 'sharp' | 'moderate' | 'minimal' = 
          Math.abs(totalMove) >= 2 ? 'sharp' : Math.abs(totalMove) >= 1 ? 'moderate' : 'minimal'
        
        // Detect steam move (significant movement in short time - can't determine from ESPN easily)
        const steamMoveDetected = Math.abs(spreadMove) >= 1.5
        
        return {
          spread: {
            open: spreadOpen,
            current: spreadCurrent,
            high: Math.max(spreadOpen, spreadCurrent),
            low: Math.min(spreadOpen, spreadCurrent),
            direction: spreadDirection,
            magnitude: spreadMagnitude,
            steamMoveDetected
          },
          total: {
            open: totalOpen,
            current: totalCurrent,
            high: Math.max(totalOpen, totalCurrent),
            low: Math.min(totalOpen, totalCurrent),
            direction: totalDirection,
            magnitude: totalMagnitude
          },
          moneyline: {
            homeOpen: primaryOdds.homeTeamOdds?.moneyLine || 0,
            homeCurrent: primaryOdds.homeTeamOdds?.moneyLine || 0,
            awayOpen: primaryOdds.awayTeamOdds?.moneyLine || 0,
            awayCurrent: primaryOdds.awayTeamOdds?.moneyLine || 0,
            impliedProbShift: 0
          },
          timeline: [] // Would need time-series data for full timeline
        }
      }
    }
  } catch (error) {
    console.error('getLineMovementData error:', error)
  }
  
  // Fallback to empty state
  return {
    spread: {
      open: 0,
      current: 0,
      high: 0,
      low: 0,
      direction: 'stable',
      magnitude: 'minimal',
      steamMoveDetected: false
    },
    total: {
      open: 0,
      current: 0,
      high: 0,
      low: 0,
      direction: 'stable',
      magnitude: 'minimal'
    },
    moneyline: {
      homeOpen: 0,
      homeCurrent: 0,
      awayOpen: 0,
      awayCurrent: 0,
      impliedProbShift: 0
    },
    timeline: [] // Empty - no fake timeline
  }
}

async function getPublicSharpSplits(gameId: string, sport: string, homeTeam?: string, awayTeam?: string): Promise<PublicSharpSplits> {
  // Fetch REAL data from Action Network
  try {
    // Check cache first
    const now = Date.now()
    if (!bettingSplitsCache || 
        bettingSplitsCache.sport !== sport || 
        (now - bettingSplitsCache.fetchedAt) > CACHE_DURATION_MS) {
      // Fetch fresh data
      const splits = await fetchBettingSplitsFromActionNetwork(sport)
      bettingSplitsCache = {
        data: splits,
        sport,
        fetchedAt: now
      }
    }

    // Find the matching game by team names
    const gameSplit = bettingSplitsCache.data.find(split => {
      const homeMatch = homeTeam && (
        split.homeTeam.toLowerCase().includes(homeTeam.toLowerCase()) ||
        homeTeam.toLowerCase().includes(split.homeTeam.toLowerCase())
      )
      const awayMatch = awayTeam && (
        split.awayTeam.toLowerCase().includes(awayTeam.toLowerCase()) ||
        awayTeam.toLowerCase().includes(split.awayTeam.toLowerCase())
      )
      // Also try matching by gameId if Action Network ID is embedded
      const idMatch = gameId.includes(split.gameId) || split.gameId.includes(gameId)
      return (homeMatch && awayMatch) || idMatch
    })

    if (gameSplit) {
      // We have REAL data from Action Network!
      const spreadDivergence = Math.abs(gameSplit.spread.homeBetPct - gameSplit.spread.homeMoneyPct)
      const totalDivergence = Math.abs(gameSplit.total.overBetPct - gameSplit.total.overMoneyPct)
      
      // Determine sharp side based on money vs ticket divergence
      const spreadSharpSide: 'home' | 'away' | 'neutral' = 
        gameSplit.spread.homeMoneyPct > gameSplit.spread.homeBetPct + 5 ? 'home' :
        gameSplit.spread.awayMoneyPct > gameSplit.spread.awayBetPct + 5 ? 'away' : 'neutral'
      
      const totalSharpSide: 'over' | 'under' | 'neutral' = 
        gameSplit.total.overMoneyPct > gameSplit.total.overBetPct + 5 ? 'over' :
        gameSplit.total.underMoneyPct > gameSplit.total.underBetPct + 5 ? 'under' : 'neutral'
      
      // Reverse line movement: public betting one way but line moving other
      const spreadRLM = (gameSplit.spread.homeBetPct > 55 && spreadSharpSide === 'away') ||
                        (gameSplit.spread.awayBetPct > 55 && spreadSharpSide === 'home')
      const totalRLM = (gameSplit.total.overBetPct > 55 && totalSharpSide === 'under') ||
                       (gameSplit.total.underBetPct > 55 && totalSharpSide === 'over')
      
      // Determine RLM strength
      const rlmStrength: 'strong' | 'moderate' | 'weak' | 'none' = 
        spreadDivergence > 15 ? 'strong' :
        spreadDivergence > 8 ? 'moderate' :
        spreadDivergence > 3 ? 'weak' : 'none'
      
      // Determine consensus
      const publicLean = `${gameSplit.spread.homeBetPct > 50 ? 'Home' : 'Away'} Spread + ${gameSplit.total.overBetPct > 50 ? 'Over' : 'Under'}`
      const sharpLean = `${spreadSharpSide === 'home' ? 'Home' : spreadSharpSide === 'away' ? 'Away' : '?'} Spread + ${totalSharpSide === 'over' ? 'Over' : totalSharpSide === 'under' ? 'Under' : '?'}`
      
      return {
        spread: {
          publicHomePct: gameSplit.spread.homeBetPct,
          publicAwayPct: gameSplit.spread.awayBetPct,
          moneyHomePct: gameSplit.spread.homeMoneyPct,
          moneyAwayPct: gameSplit.spread.awayMoneyPct,
          sharpSide: spreadSharpSide,
          reverseLineMovement: spreadRLM,
          rlmStrength
        },
        total: {
          publicOverPct: gameSplit.total.overBetPct,
          publicUnderPct: gameSplit.total.underBetPct,
          moneyOverPct: gameSplit.total.overMoneyPct,
          moneyUnderPct: gameSplit.total.underMoneyPct,
          sharpSide: totalSharpSide,
          reverseLineMovement: totalRLM
        },
        moneyline: {
          publicHomePct: gameSplit.moneyline.homeBetPct,
          publicAwayPct: gameSplit.moneyline.awayBetPct,
          moneyHomePct: gameSplit.moneyline.homeMoneyPct,
          moneyAwayPct: gameSplit.moneyline.awayMoneyPct
        },
        consensus: {
          publicLean,
          sharpLean,
          alignment: spreadSharpSide === 'neutral' ? 'split' : 
            (publicLean.includes('Home') === (sharpLean.includes('Home'))) ? 'aligned' : 'opposed'
        }
      }
    }
  } catch (error) {
    console.error('Error fetching Action Network data:', error)
  }

  // Return "unavailable" state - no data found
  return {
    spread: {
      publicHomePct: 0,
      publicAwayPct: 0,
      moneyHomePct: 0,
      moneyAwayPct: 0,
      sharpSide: 'neutral',
      reverseLineMovement: false,
      rlmStrength: 'none'
    },
    total: {
      publicOverPct: 0,
      publicUnderPct: 0,
      moneyOverPct: 0,
      moneyUnderPct: 0,
      sharpSide: 'neutral',
      reverseLineMovement: false
    },
    moneyline: {
      publicHomePct: 0,
      publicAwayPct: 0,
      moneyHomePct: 0,
      moneyAwayPct: 0
    },
    consensus: {
      publicLean: 'Data unavailable',
      sharpLean: 'Data unavailable',
      alignment: 'split'
    }
  }
}

async function getInjuryImpact(
  gameId: string, 
  sport: string, 
  homeAbbr: string, 
  awayAbbr: string
): Promise<InjuryImpact> {
  // Fetch real injury data from ESPN API
  try {
    const sportMap: Record<string, string> = {
      'NFL': 'football/nfl',
      'NBA': 'basketball/nba',
      'MLB': 'baseball/mlb',
      'NHL': 'hockey/nhl',
      'NCAAF': 'football/college-football',
      'NCAAB': 'basketball/mens-college-basketball'
    }
    const sportPath = sportMap[sport.toUpperCase()] || 'football/nfl'
    const url = `https://site.api.espn.com/apis/site/v2/sports/${sportPath}/summary?event=${gameId}`
    
    const response = await fetch(url, {
      headers: { 'Accept': 'application/json', 'User-Agent': 'Matchups/1.0' },
      next: { revalidate: 300 } // Cache for 5 minutes
    })
    
    if (!response.ok) {
      throw new Error(`ESPN API returned ${response.status}`)
    }
    
    const data = await response.json()
    
    // Position impact scores by position (QB and star positions have bigger impact)
    const positionImpactScores: Record<string, number> = {
      'QB': 25, 'RB': 12, 'WR': 10, 'TE': 8, 'OL': 7, 'OT': 7, 'OG': 6, 'C': 6, 'G': 6, 'T': 7,
      'DE': 8, 'DT': 7, 'LB': 8, 'CB': 10, 'S': 8, 'FS': 8, 'SS': 8, 'DB': 8, 'DL': 7,
      'K': 4, 'P': 3, 'LS': 2, 'FB': 4
    }
    
    const processInjuries = (injuryList: Array<{
      athlete?: { displayName?: string; position?: { abbreviation?: string } }
      status?: string
      type?: { description?: string } | string
      details?: { type?: string }
    }>) => {
      const outPlayers: PlayerInjury[] = []
      const questionablePlayers: PlayerInjury[] = []
      let totalImpactScore = 0
      const positionImpacts: Array<{ position: string; impact: 'high' | 'medium' | 'low' | 'critical' }> = []
      
      for (const inj of injuryList) {
        const name = inj.athlete?.displayName || 'Unknown'
        const position = inj.athlete?.position?.abbreviation || ''
        const statusRaw = (inj.status || '').toLowerCase()
        const injuryType = typeof inj.type === 'string' ? inj.type : (inj.type?.description || inj.details?.type || 'Unknown')
        const impactScore = positionImpactScores[position] || 5
        
        // Map to PlayerInjury status type
        const mapStatus = (s: string): 'Out' | 'Doubtful' | 'Questionable' | 'Probable' => {
          if (s === 'out' || s.includes('ir') || s === 'injured reserve') return 'Out'
          if (s === 'doubtful') return 'Doubtful'
          if (s === 'probable') return 'Probable'
          return 'Questionable'
        }
        
        // Determine impact rating (1-5 based on position importance)
        const impactRating = Math.min(5, Math.ceil(impactScore / 5)) as 1 | 2 | 3 | 4 | 5
        
        // Determine if starter/star (high impact positions assumed to be starters)
        const isStarter = impactScore >= 8
        const isStar = impactScore >= 15
        
        const status = mapStatus(statusRaw)
        
        const playerInjury: PlayerInjury = {
          name,
          position,
          status,
          injuryType,
          impactRating,
          isStarter,
          isStar
        }
        
        if (statusRaw === 'out' || statusRaw === 'injured reserve' || statusRaw.includes('ir')) {
          outPlayers.push(playerInjury)
          totalImpactScore += impactScore
          
          // Track position impacts
          const impact: 'high' | 'medium' | 'low' | 'critical' = 
            impactScore >= 20 ? 'critical' : impactScore >= 12 ? 'high' : impactScore >= 8 ? 'medium' : 'low'
          if (!positionImpacts.find(p => p.position === position)) {
            positionImpacts.push({ position, impact })
          }
        } else if (statusRaw === 'questionable' || statusRaw === 'doubtful' || statusRaw === 'probable') {
          questionablePlayers.push(playerInjury)
          // Add partial impact for questionable players
          const probability = statusRaw === 'probable' ? 0.9 : statusRaw === 'questionable' ? 0.5 : 0.25
          totalImpactScore += Math.round(impactScore * (1 - probability))
        }
      }
      
      return { outPlayers, questionablePlayers, totalImpactScore, positionImpacts }
    }
    
    let homeInjuries: Array<any> = []
    let awayInjuries: Array<any> = []
    
    // Extract injuries from ESPN data
    if (data.injuries && Array.isArray(data.injuries)) {
      for (const teamInjuries of data.injuries) {
        const teamId = teamInjuries.team?.id
        // Determine if this is home or away based on boxscore teams order
        const isHome = data.boxscore?.teams?.[1]?.team?.id === teamId
        const injuryList = teamInjuries.injuries || []
        
        if (isHome) {
          homeInjuries = injuryList
        } else {
          awayInjuries = injuryList
        }
      }
    }
    
    const homeData = processInjuries(homeInjuries)
    const awayData = processInjuries(awayInjuries)
    
    // Calculate line impact based on injury differential
    const impactDiff = awayData.totalImpactScore - homeData.totalImpactScore
    const spreadAdjustment = impactDiff / 20 // Roughly 1 point per 20 impact score difference
    
    // Build narrative
    const narrativeParts: string[] = []
    if (homeData.outPlayers.length > 0) {
      const keyOuts = homeData.outPlayers.filter(p => p.impactRating >= 3).map(p => `${p.name} (${p.position})`).slice(0, 2)
      if (keyOuts.length > 0) {
        narrativeParts.push(`${homeAbbr} missing ${keyOuts.join(', ')}`)
      }
    }
    if (awayData.outPlayers.length > 0) {
      const keyOuts = awayData.outPlayers.filter(p => p.impactRating >= 3).map(p => `${p.name} (${p.position})`).slice(0, 2)
      if (keyOuts.length > 0) {
        narrativeParts.push(`${awayAbbr} missing ${keyOuts.join(', ')}`)
      }
    }
    
    return {
      homeTeam: homeData,
      awayTeam: awayData,
      lineImpact: {
        spreadAdjustment: Math.round(spreadAdjustment * 10) / 10,
        totalAdjustment: 0, // Injuries typically don't affect totals much unless QB or key offensive players
        narrative: narrativeParts.length > 0 ? narrativeParts.join('. ') : 'No significant injury impacts'
      }
    }
  } catch (error) {
    console.error('getInjuryImpact error:', error)
    return {
      homeTeam: { outPlayers: [], questionablePlayers: [], totalImpactScore: 0, positionImpacts: [] },
      awayTeam: { outPlayers: [], questionablePlayers: [], totalImpactScore: 0, positionImpacts: [] },
      lineImpact: { spreadAdjustment: 0, totalAdjustment: 0, narrative: 'Could not fetch injury data' }
    }
  }
}

async function getWeatherImpact(gameId: string, sport: string): Promise<WeatherImpact> {
  // COMING SOON: Real weather data requires weather API integration (OpenWeather, etc.)
  // For now, return empty/unavailable state
  return {
    venue: '',
    isOutdoor: false,
    isDome: true, // Default to dome to avoid showing fake weather impact
    conditions: {
      temperature: 0,
      feelsLike: 0,
      windSpeed: 0,
      windDirection: '',
      precipitation: 0,
      humidity: 0,
      conditions: 'Data unavailable'
    },
    bettingImpact: {
      level: 'none',
      spreadImpact: 0,
      totalImpact: 0,
      affectedBets: [],
      narrative: 'Weather data coming soon'
    },
    historicalInWeather: {
      homeTeamRecord: '',
      awayTeamRecord: '',
      avgTotalInConditions: 0
    }
  }
}

async function getSituationalAngles(
  gameId: string,
  sport: string,
  homeAbbr: string,
  awayAbbr: string
): Promise<SituationalAngles> {
  // COMING SOON: Situational analysis requires schedule parsing and historical data
  // For now, return empty state to avoid showing fake situational angles
  const emptySituation = {
    restDays: 0,
    isBackToBack: false,
    travelMiles: 0,
    afterWinLoss: 'unknown' as const,
    afterBlowout: false,
    afterOT: false,
    isRevenge: false,
    isDivisional: false,
    isPrimetime: false,
    isPlayoffs: false,
    letdownSpot: false,
    lookaheadSpot: false,
    sandwichSpot: false,
    trapGame: false,
    homeStandLength: 0,
    roadTripLength: 0
  }
  
  return {
    home: emptySituation,
    away: { ...emptySituation },
    angles: [] // Empty - no fake angles
  }
}

async function getATSRecords(
  sport: string,
  homeAbbr: string,
  awayAbbr: string
): Promise<ATSRecords> {
  // REAL DATA: Query from historical_games via ATS calculator
  const [homeData, awayData] = await Promise.all([
    calculateTeamATS(homeAbbr, sport),
    calculateTeamATS(awayAbbr, sport)
  ])
  
  const emptyATSRecord = { wins: 0, losses: 0, pushes: 0, pct: 0 }
  
  // Helper to convert calculator format to our format
  const toATSRecord = (data: { wins: number; losses: number; pushes: number; percentage: number } | undefined) => {
    if (!data) return emptyATSRecord
    return { wins: data.wins, losses: data.losses, pushes: data.pushes, pct: data.percentage }
  }
  
  return {
    homeTeam: {
      overall: toATSRecord(homeData?.ats),
      home: toATSRecord(homeData?.homeATS),
      asFavorite: emptyATSRecord, // Would need more granular data
      asUnderdog: emptyATSRecord,
      last10: toATSRecord(homeData?.last10ATS),
      vsDivision: emptyATSRecord,
      inPrimetime: emptyATSRecord
    },
    awayTeam: {
      overall: toATSRecord(awayData?.ats),
      away: toATSRecord(awayData?.awayATS),
      asFavorite: emptyATSRecord,
      asUnderdog: emptyATSRecord,
      last10: toATSRecord(awayData?.last10ATS),
      vsDivision: emptyATSRecord,
      inPrimetime: emptyATSRecord
    },
    h2hATS: {
      homeWins: 0,
      awayWins: 0,
      pushes: 0,
      homeRoi: 0,
      awayRoi: 0
    }
  }
}

async function getOUTrends(
  sport: string,
  homeAbbr: string,
  awayAbbr: string
): Promise<OUTrends> {
  // REAL DATA: Query from historical_games via ATS calculator (includes O/U)
  const [homeData, awayData] = await Promise.all([
    calculateTeamATS(homeAbbr, sport),
    calculateTeamATS(awayAbbr, sport)
  ])
  
  const emptyOURecord = { overs: 0, unders: 0, pushes: 0, overPct: 0 }
  
  // Helper to convert calculator format
  const toOURecord = (data: { wins: number; losses: number; pushes: number; percentage: number } | undefined) => {
    if (!data) return emptyOURecord
    return { overs: data.wins, unders: data.losses, pushes: data.pushes, overPct: data.percentage }
  }
  
  // Generate real trends from the data
  const trends: OUTrends['trends'] = []
  
  if (homeData?.ou && (homeData.ou.wins + homeData.ou.losses) >= 5) {
    const overPct = homeData.ou.percentage
    if (overPct >= 60) {
      trends.push({
        description: `${homeAbbr} games going OVER ${overPct.toFixed(0)}% of the time`,
        record: `${homeData.ou.wins}-${homeData.ou.losses}`,
        roi: (overPct - 52.4) / 52.4 * 100, // Rough ROI estimate
        pick: 'over',
        confidence: Math.min(overPct, 80)
      })
    } else if (overPct <= 40) {
      trends.push({
        description: `${homeAbbr} games going UNDER ${(100 - overPct).toFixed(0)}% of the time`,
        record: `${homeData.ou.losses}-${homeData.ou.wins}`,
        roi: ((100 - overPct) - 52.4) / 52.4 * 100,
        pick: 'under',
        confidence: Math.min(100 - overPct, 80)
      })
    }
  }
  
  if (awayData?.ou && (awayData.ou.wins + awayData.ou.losses) >= 5) {
    const overPct = awayData.ou.percentage
    if (overPct >= 60) {
      trends.push({
        description: `${awayAbbr} games going OVER ${overPct.toFixed(0)}% of the time`,
        record: `${awayData.ou.wins}-${awayData.ou.losses}`,
        roi: (overPct - 52.4) / 52.4 * 100,
        pick: 'over',
        confidence: Math.min(overPct, 80)
      })
    } else if (overPct <= 40) {
      trends.push({
        description: `${awayAbbr} games going UNDER ${(100 - overPct).toFixed(0)}% of the time`,
        record: `${awayData.ou.losses}-${awayData.ou.wins}`,
        roi: ((100 - overPct) - 52.4) / 52.4 * 100,
        pick: 'under',
        confidence: Math.min(100 - overPct, 80)
      })
    }
  }

  return {
    homeTeam: {
      overall: toOURecord(homeData?.ou),
      home: emptyOURecord, // Would need home-only O/U data
      asFavorite: emptyOURecord,
      asUnderdog: emptyOURecord,
      last10: toOURecord(homeData?.last10OU),
      avgTotal: 0,
      avgActual: 0,
      marginVsTotal: 0
    },
    awayTeam: {
      overall: toOURecord(awayData?.ou),
      away: emptyOURecord,
      asFavorite: emptyOURecord,
      asUnderdog: emptyOURecord,
      last10: toOURecord(awayData?.last10OU),
      avgTotal: 0,
      avgActual: 0,
      marginVsTotal: 0
    },
    combined: {
      h2hOvers: 0,
      h2hUnders: 0,
      h2hAvgTotal: 0,
      projectedTotal: 0,
      valueOnOver: trends.some(t => t.pick === 'over' && t.confidence >= 60),
      valueOnUnder: trends.some(t => t.pick === 'under' && t.confidence >= 60),
      edgePct: trends.length > 0 ? Math.max(...trends.map(t => t.confidence)) - 52.4 : 0
    },
    trends
  }
}

async function getKeyNumbers(gameId: string, sport: string): Promise<KeyNumbers> {
  // Key numbers are static/educational - this is legitimate reference data
  const sportKeyNumbers: Record<string, number[]> = {
    NFL: [3, 7, 10, 14, 17, 21],
    NBA: [4, 5, 6, 7, 8],
    NHL: [1, 2],
    MLB: [1, 1.5, 2]
  }
  
  const keyNums = sportKeyNumbers[sport] || [3, 7]
  
  // Return just the educational content, no fake current line data
  return {
    spread: {
      currentLine: 0,
      nearKeyNumber: false,
      keyNumber: null,
      buyPointValue: 0,
      sellPointValue: 0,
      historicalPushRate: 0,
      recommendation: null
    },
    total: {
      currentLine: 0,
      nearKeyNumber: false,
      keyNumber: null,
      buyPointValue: 0,
      sellPointValue: 0,
      historicalPushRate: 0,
      recommendation: null
    },
    sport,
    keyNumbersForSport: keyNums,
    analysis: `Key numbers for ${sport}: ${keyNums.join(', ')}. Line analysis coming soon.`
  }
}

async function getH2HHistory(
  sport: string,
  homeAbbr: string,
  awayAbbr: string
): Promise<H2HHistory> {
  // COMING SOON: H2H data requires historical game database
  // Would need to track and store game results over time
  return {
    gamesPlayed: 0,
    homeTeamWins: 0,
    awayTeamWins: 0,
    ties: 0,
    homeTeamATSRecord: '',
    awayTeamATSRecord: '',
    overUnderRecord: '',
    avgMargin: 0,
    avgTotal: 0,
    lastMeeting: null,
    recentGames: [],
    streaks: {
      homeTeamStreak: 0,
      awayTeamStreak: 0,
      overStreak: 0,
      underStreak: 0
    },
    insights: ['H2H history coming soon']
  }
}

async function getMarketConsensus(gameId: string, sport: string, splits?: PublicSharpSplits): Promise<MarketConsensus> {
  // REAL DATA: Derive consensus from Action Network splits we already fetched
  // The splits parameter is passed from getMatchupIntelligence after fetching
  
  let sharpestPick: MarketConsensus['sharpestPick'] = null
  let bestConfidence = 0
  let bestPick = ''
  let bestBetType = ''
  let bestReasoning = ''
  
  if (splits) {
    // Check spread for sharp signal
    if (splits.spread.reverseLineMovement && splits.spread.sharpSide !== 'neutral') {
      const sharpSideLabel = splits.spread.sharpSide === 'home' ? 'HOME' : 'AWAY'
      const conf = splits.spread.rlmStrength === 'strong' ? 75 : 
                   splits.spread.rlmStrength === 'moderate' ? 65 : 55
      if (conf > bestConfidence) {
        bestConfidence = conf
        bestPick = `${sharpSideLabel} spread`
        bestBetType = 'spread'
        bestReasoning = `RLM detected - Sharps on ${sharpSideLabel.toLowerCase()}, public on opposite side`
      }
    }
    
    // Check total for sharp signal
    if (splits.total.reverseLineMovement && splits.total.sharpSide !== 'neutral') {
      const sharpSideLabel = splits.total.sharpSide === 'over' ? 'OVER' : 'UNDER'
      const conf = 65 // RLM on totals
      if (conf > bestConfidence) {
        bestConfidence = conf
        bestPick = sharpSideLabel
        bestBetType = 'total'
        bestReasoning = `Sharp money on ${sharpSideLabel.toLowerCase()}, line moving opposite to public`
      }
    }
    
    // Check for strong money/ticket divergence even without RLM
    const spreadMoneyDiff = Math.abs(splits.spread.moneyHomePct - splits.spread.publicHomePct)
    if (spreadMoneyDiff >= 15 && splits.spread.sharpSide !== 'neutral') {
      const conf = Math.min(50 + spreadMoneyDiff, 70)
      if (conf > bestConfidence) {
        bestConfidence = conf
        bestPick = `${splits.spread.sharpSide === 'home' ? 'HOME' : 'AWAY'} spread`
        bestBetType = 'spread'
        bestReasoning = `${spreadMoneyDiff.toFixed(0)}% money/ticket divergence - sharp action detected`
      }
    }
    
    const totalMoneyDiff = Math.abs(splits.total.moneyOverPct - splits.total.publicOverPct)
    if (totalMoneyDiff >= 15 && splits.total.sharpSide !== 'neutral') {
      const conf = Math.min(50 + totalMoneyDiff, 70)
      if (conf > bestConfidence) {
        bestConfidence = conf
        bestPick = splits.total.sharpSide === 'over' ? 'OVER' : 'UNDER'
        bestBetType = 'total'
        bestReasoning = `${totalMoneyDiff.toFixed(0)}% money/ticket divergence on total`
      }
    }
    
    if (bestPick) {
      sharpestPick = {
        betType: bestBetType,
        pick: bestPick,
        confidence: bestConfidence,
        reasoning: bestReasoning
      }
    }
  }
  
  return {
    spreadConsensus: {
      pick: splits?.spread.sharpSide === 'home' ? 'Home' : splits?.spread.sharpSide === 'away' ? 'Away' : '',
      confidence: splits?.spread.reverseLineMovement ? 70 : 50,
      sources: [{ name: 'Action Network', pick: splits?.consensus.sharpLean || '' }],
      agreement: splits?.spread.reverseLineMovement ? 75 : 50
    },
    totalConsensus: {
      pick: splits?.total.sharpSide === 'over' ? 'Over' : splits?.total.sharpSide === 'under' ? 'Under' : '',
      confidence: splits?.total.reverseLineMovement ? 70 : 50,
      sources: [{ name: 'Action Network', pick: splits?.total.sharpSide || '' }],
      agreement: splits?.total.reverseLineMovement ? 75 : 50
    },
    mlConsensus: {
      pick: '',
      confidence: 0,
      sources: [],
      agreement: 0
    },
    sharpestPick
  }
}

async function getLiveBettingEdges(gameId: string, sport: string): Promise<LiveBettingEdges | null> {
  // Only available during live games
  return null
}

// Edge score calculation has been moved to src/lib/edge/engine.ts

// =============================================================================
// AI ANALYSIS GENERATION
// =============================================================================

async function generateAIAnalysis(data: {
  gameId: string
  sport: string
  homeTeam: { name: string; abbr: string }
  awayTeam: { name: string; abbr: string }
  clv: CLVData
  lineMovement: LineMovementData
  splits: PublicSharpSplits
  injuries: InjuryImpact
  weather: WeatherImpact
  situational: SituationalAngles
  ats: ATSRecords
  ou: OUTrends
  keyNumbers: KeyNumbers
  h2h: H2HHistory
  consensus: MarketConsensus
  homeAnalytics: TeamAnalytics | null
  awayAnalytics: TeamAnalytics | null
}): Promise<AIMatchupAnalysis | null> {
  try {
    // DATA QUALITY CHECK: Don't call AI if we have insufficient data
    // This prevents hallucinated picks like "Under 46" when data is empty
    const hasRealSplitsData = (
      data.splits.spread.reverseLineMovement ||
      Math.abs(data.splits.spread.moneyHomePct - 50) > 10 ||
      data.consensus.sharpestPick !== null
    )
    const hasRealATSData = (
      data.ats.homeTeam.overall.wins + data.ats.homeTeam.overall.losses > 0 ||
      data.ats.awayTeam.overall.wins + data.ats.awayTeam.overall.losses > 0
    )
    const hasRealOUData = data.ou.trends.length > 0
    const hasRealInjuryData = (
      data.injuries.homeTeam.outPlayers.length > 0 || 
      data.injuries.awayTeam.outPlayers.length > 0 ||
      data.injuries.homeTeam.questionablePlayers.length > 0 ||
      data.injuries.awayTeam.questionablePlayers.length > 0
    )
    
    const dataPointsAvailable = [
      hasRealSplitsData,
      hasRealATSData, 
      hasRealOUData,
      hasRealInjuryData
    ].filter(Boolean).length
    
    // If we have less than 2 real data points, don't generate AI analysis
    // This prevents hallucination when data is too sparse
    if (dataPointsAvailable < 2) {
      console.log(`[AI Analysis] Skipping - only ${dataPointsAvailable} real data points available`)
      return null
    }
    
    // If we already have a sharpestPick from real data, tell the AI to use it
    const sharpestPickInstruction = data.consensus.sharpestPick 
      ? `\n\nIMPORTANT: The sharpest play identified from real sharp money data is: "${data.consensus.sharpestPick.pick}" (${data.consensus.sharpestPick.betType}). Your analysis should align with or acknowledge this signal.`
      : `\n\nNOTE: No definitive sharp signal was detected in the betting splits. Be conservative with confidence levels and acknowledge data limitations.`
    
    const prompt = `You are an elite sports betting analyst. Analyze this ${data.sport} matchup using ALL the data provided.

MATCHUP: ${data.awayTeam.name} @ ${data.homeTeam.name}
${sharpestPickInstruction}

=== 12 ESSENTIAL DATA POINTS ===

1. CLV (CLOSING LINE VALUE):
${JSON.stringify(data.clv, null, 2)}

2. LINE MOVEMENT:
${JSON.stringify(data.lineMovement, null, 2)}

3. PUBLIC VS SHARP SPLITS:
${JSON.stringify(data.splits, null, 2)}

4. INJURY IMPACT:
${JSON.stringify(data.injuries, null, 2)}

5. WEATHER IMPACT:
${JSON.stringify(data.weather, null, 2)}

6. SITUATIONAL ANGLES:
${JSON.stringify(data.situational, null, 2)}

7. ATS RECORDS:
Home: Overall ${data.ats.homeTeam.overall.pct}%, Home ${data.ats.homeTeam.home.pct}%, Last 10: ${data.ats.homeTeam.last10.pct}%
Away: Overall ${data.ats.awayTeam.overall.pct}%, Away ${data.ats.awayTeam.away.pct}%, Last 10: ${data.ats.awayTeam.last10.pct}%

8. O/U TRENDS:
${JSON.stringify(data.ou.trends, null, 2)}
Combined projection: ${data.ou.combined.projectedTotal}

9. KEY NUMBERS:
${JSON.stringify(data.keyNumbers, null, 2)}

10. H2H HISTORY:
${JSON.stringify(data.h2h, null, 2)}

11. MARKET CONSENSUS:
${JSON.stringify(data.consensus, null, 2)}

12. TEAM ANALYTICS:
Home Team Trends: ${data.homeAnalytics?.trends?.join(', ') || 'N/A'}
Away Team Trends: ${data.awayAnalytics?.trends?.join(', ') || 'N/A'}

=== ANALYSIS REQUEST ===

IMPORTANT: Always use the actual team names (${data.homeTeam.name}, ${data.awayTeam.name}) instead of "home team" or "away team".

Provide a comprehensive betting analysis considering ALL 12 data points. Return JSON:

{
  "summary": "A detailed 2-4 paragraph analysis (150-250 words) that reads like expert commentary. Start with the headline matchup angle, then discuss the key betting factors: sharp money signals vs public betting, line movement significance, injury impact, and situational angles. Always reference teams by their actual names (${data.homeTeam.name}, ${data.awayTeam.name}). End with a clear lean and reasoning. Make it insightful and actionable for serious bettors.",
  "winProbability": { "home": 0.55, "away": 0.45 },
  "projectedScore": { "home": 24, "away": 21 },
  "spreadAnalysis": {
    "pick": "${data.awayTeam.name} +X or ${data.homeTeam.name} -X (use actual team name)",
    "confidence": 0.65,
    "reasoning": "Main thesis for spread pick using team names",
    "keyFactors": ["Factor 1 with team names", "Factor 2", "Factor 3"],
    "risks": ["Risk 1", "Risk 2"]
  },
  "totalAnalysis": {
    "pick": "Over X or Under X",
    "confidence": 0.70,
    "reasoning": "Main thesis for total pick",
    "keyFactors": ["Factor 1", "Factor 2"],
    "paceProjection": "Expected pace and scoring environment"
  },
  "mlAnalysis": {
    "pick": "${data.homeTeam.name} or ${data.awayTeam.name} (use actual team name)",
    "confidence": 0.60,
    "value": 3.5,
    "reasoning": "ML value analysis"
  },
  "propPicks": [
    { "player": "Player Name", "prop": "Prop description", "pick": "Over/Under X", "confidence": 0.65, "reasoning": "Why" }
  ],
  "keyEdges": ["Edge 1 with team names", "Edge 2", "Edge 3"],
  "majorRisks": ["Risk 1 with team names", "Risk 2"],
  "betGrades": {
    "spread": "A/B/C/D/F based on edge strength",
    "total": "A/B/C/D/F",
    "ml": "A/B/C/D/F"
  }
}`

    const result = await geminiModel.generateContent(prompt)
    const response = result.response.text()
    
    const jsonMatch = response.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]) as AIMatchupAnalysis
    }
  } catch (error) {
    console.error('AI analysis generation failed:', error)
  }
  
  // FALLBACK: Generate analysis without Gemini API using the data we have
  return generateFallbackAnalysis(data)
}

// Generate analysis without external AI API - uses rule-based templates
function generateFallbackAnalysis(data: {
  gameId: string
  sport: string
  homeTeam: { name: string; abbr: string }
  awayTeam: { name: string; abbr: string }
  clv: CLVData
  lineMovement: LineMovementData
  splits: PublicSharpSplits
  injuries: InjuryImpact
  consensus: MarketConsensus
}): AIMatchupAnalysis {
  const home = data.homeTeam.name
  const away = data.awayTeam.name
  const homeAbbr = data.homeTeam.abbr
  const awayAbbr = data.awayTeam.abbr
  
  // Build the summary paragraph based on available data
  const summaryParts: string[] = []
  
  // Opening statement
  const sharpPick = data.consensus.sharpestPick
  if (sharpPick && sharpPick.confidence >= 60) {
    if (sharpPick.betType === 'total') {
      summaryParts.push(`Sharp money has identified value on the ${sharpPick.pick.toUpperCase()} in ${away} vs ${home}.`)
    } else {
      summaryParts.push(`Sharp money is backing ${sharpPick.pick.includes(homeAbbr) ? home : away} in this matchup.`)
    }
  } else {
    summaryParts.push(`A compelling matchup between ${away} and ${home} with multiple angles to consider.`)
  }
  
  // CLV commentary
  if (data.clv.spreadCLV !== 0 || data.clv.totalCLV !== 0) {
    const movements: string[] = []
    if (Math.abs(data.clv.spreadCLV) >= 0.5) {
      movements.push(`spread ${data.clv.spreadCLV > 0 ? 'moving toward the underdog' : 'steaming toward the favorite'}`)
    }
    if (Math.abs(data.clv.totalCLV) >= 0.5) {
      movements.push(`total ${data.clv.totalCLV > 0 ? 'dropping' : 'rising'} from the opener`)
    }
    if (movements.length > 0) {
      summaryParts.push(`Line movement tells an interesting story with the ${movements.join(' and ')}.`)
    }
  }
  
  // Sharp vs Public split
  if (data.splits.total.reverseLineMovement) {
    summaryParts.push(`There's a notable sharp/public split on the total - ${Math.round(data.splits.total.publicOverPct)}% of tickets are on the OVER but the line has moved DOWN, indicating sharp money on the UNDER.`)
  } else if (data.splits.spread.reverseLineMovement) {
    const sharpSide = data.splits.spread.sharpSide === 'home' ? home : away
    summaryParts.push(`Reverse line movement detected on the spread with sharps positioning on ${sharpSide}.`)
  }
  
  // Injury impact
  const totalInjuryImpact = data.injuries.homeTeam.totalImpactScore + data.injuries.awayTeam.totalImpactScore
  if (totalInjuryImpact > 30) {
    const homeOuts = data.injuries.homeTeam.outPlayers.length
    const awayOuts = data.injuries.awayTeam.outPlayers.length
    summaryParts.push(`Injuries could be a factor with ${homeAbbr} missing ${homeOuts} players and ${awayAbbr} missing ${awayOuts}.`)
  }
  
  // Conclusion
  if (sharpPick && sharpPick.confidence >= 60) {
    summaryParts.push(`The sharpest play identified is ${sharpPick.pick} at ${sharpPick.confidence}% confidence. ${sharpPick.reasoning}`)
  }
  
  const summary = summaryParts.join(' ')
  
  // Calculate win probability based on spread (from home team perspective)
  const spread = data.clv.currentSpread || 0
  const homeWinProb = spread === 0 ? 0.5 : (spread < 0 ? 0.5 + Math.abs(spread) * 0.025 : 0.5 - spread * 0.025)
  
  // Projected score based on total and spread
  const total = data.clv.currentTotal || 45
  const projectedHome = Math.round((total / 2) - (spread / 2))
  const projectedAway = Math.round((total / 2) + (spread / 2))
  
  // Determine spread pick - spread is from home perspective
  // If spread < 0: home is favored, show "Home -X"
  // If spread > 0: away is favored, show "Away -X" (not +X!)
  const spreadPick = spread === 0 
    ? `${away} ML` 
    : spread < 0 
      ? `${home} ${spread}` 
      : `${away} -${Math.abs(spread)}`
  const spreadConfidence = data.splits.spread.reverseLineMovement ? 0.65 : 0.55
  
  // Determine total pick
  const totalPick = data.splits.total.reverseLineMovement 
    ? (data.splits.total.sharpSide === 'under' ? `Under ${total}` : `Over ${total}`)
    : `Under ${total}`
  const totalConfidence = data.splits.total.reverseLineMovement ? 0.70 : 0.50
  
  // Key edges
  const keyEdges: string[] = []
  if (data.clv.grade === 'excellent') keyEdges.push(`Excellent CLV - ${data.clv.description}`)
  if (data.splits.total.reverseLineMovement) keyEdges.push('Reverse Line Movement on total indicates sharp money')
  if (data.splits.spread.reverseLineMovement) keyEdges.push('Sharp money diverging from public on spread')
  if (totalInjuryImpact > 20 && data.injuries.awayTeam.totalImpactScore > data.injuries.homeTeam.totalImpactScore) {
    keyEdges.push(`${awayAbbr} hampered by more injuries (${data.injuries.awayTeam.totalImpactScore} impact score)`)
  }
  if (keyEdges.length === 0) keyEdges.push('Limited sharp signals - proceed with caution')
  
  // Major risks
  const majorRisks: string[] = []
  if (!data.splits.spread.reverseLineMovement && !data.splits.total.reverseLineMovement) {
    majorRisks.push('No clear reverse line movement detected')
  }
  if (totalInjuryImpact > 40) majorRisks.push('High injury situation - monitor reports')
  if (majorRisks.length === 0) majorRisks.push('Public heavy on one side - potential line value')
  
  // Bet grades
  const spreadGrade = data.splits.spread.reverseLineMovement ? 'B' : 'C'
  const totalGrade = data.splits.total.reverseLineMovement ? 'A' : 'B'
  const mlGrade = Math.abs(spread) > 7 ? 'D' : 'C'
  
  return {
    summary,
    winProbability: { home: parseFloat(homeWinProb.toFixed(2)), away: parseFloat((1 - homeWinProb).toFixed(2)) },
    projectedScore: { home: projectedHome, away: projectedAway },
    spreadAnalysis: {
      pick: spreadPick,
      confidence: spreadConfidence,
      reasoning: data.splits.spread.reverseLineMovement 
        ? 'Sharp money has identified value on this side'
        : 'Standard play based on line value',
      keyFactors: [`Public is ${data.splits.spread.publicHomePct}% on ${homeAbbr}`, `Money is ${data.splits.spread.moneyHomePct}% on ${homeAbbr}`],
      risks: ['Line could continue moving', 'Late injury news could shift value']
    },
    totalAnalysis: {
      pick: totalPick,
      confidence: totalConfidence,
      reasoning: data.splits.total.reverseLineMovement 
        ? `${Math.round(data.splits.total.publicOverPct)}% of tickets on OVER but line moved DOWN - classic sharp under signal`
        : 'Standard pace analysis',
      keyFactors: [`Total opened ${data.clv.openTotal || 'N/A'}, now ${total}`, `Public ${Math.round(data.splits.total.publicOverPct)}% OVER`],
      paceProjection: total >= 48 ? 'High-scoring environment expected' : 'Lower-scoring defensive battle likely'
    },
    mlAnalysis: {
      pick: homeWinProb > 0.5 ? home : away,
      confidence: 0.55,
      value: 0,
      reasoning: 'Moneyline offers less value than spread in this spot'
    },
    propPicks: [],
    keyEdges,
    majorRisks,
    betGrades: {
      spread: spreadGrade,
      total: totalGrade,
      ml: mlGrade
    }
  }
}

// =============================================================================
// EXPORT UTILITY FUNCTIONS
// =============================================================================

export function formatEdgeScore(score: number): { label: string; color: string } {
  if (score >= 75) return { label: 'Strong Edge', color: 'green' }
  if (score >= 50) return { label: 'Moderate Edge', color: 'yellow' }
  if (score >= 25) return { label: 'Slight Edge', color: 'orange' }
  return { label: 'No Clear Edge', color: 'gray' }
}

export function getTopDataPoints(intelligence: MatchupIntelligence): {
  point: string
  value: string
  impact: 'positive' | 'negative' | 'neutral'
}[] {
  const points: { point: string; value: string; impact: 'positive' | 'negative' | 'neutral' }[] = []
  
  // CLV
  if (intelligence.clv.grade !== 'neutral') {
    points.push({
      point: 'CLV',
      value: intelligence.clv.description,
      impact: intelligence.clv.grade === 'excellent' || intelligence.clv.grade === 'good' ? 'positive' : 'negative'
    })
  }
  
  // Sharp Money
  if (intelligence.publicSharpSplits.spread.reverseLineMovement) {
    points.push({
      point: 'Sharp Action',
      value: `RLM detected - Sharps on ${intelligence.publicSharpSplits.spread.sharpSide}`,
      impact: 'positive'
    })
  }
  
  // Weather
  if (intelligence.weather.bettingImpact.level !== 'none' && intelligence.weather.bettingImpact.level !== 'low') {
    points.push({
      point: 'Weather',
      value: intelligence.weather.bettingImpact.narrative,
      impact: 'neutral'
    })
  }
  
  // Injuries
  const totalInjuryImpact = intelligence.injuryImpact.homeTeam.totalImpactScore + intelligence.injuryImpact.awayTeam.totalImpactScore
  if (totalInjuryImpact > 20) {
    points.push({
      point: 'Injuries',
      value: intelligence.injuryImpact.lineImpact.narrative,
      impact: 'neutral'
    })
  }
  
  // O/U Trends
  if (intelligence.ouTrends.trends.length > 0) {
    const topTrend = intelligence.ouTrends.trends[0]
    points.push({
      point: 'O/U Trend',
      value: `${topTrend.description} (${topTrend.record})`,
      impact: 'positive'
    })
  }
  
  // H2H
  if (intelligence.h2h.gamesPlayed >= 5) {
    points.push({
      point: 'H2H History',
      value: intelligence.h2h.insights[0] || `${intelligence.h2h.gamesPlayed} previous meetings`,
      impact: 'neutral'
    })
  }
  
  return points.slice(0, 6) // Return top 6 most relevant
}
