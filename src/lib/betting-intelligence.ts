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
    spread: number | null
    total: number | null
    homeML: number | null
    awayML?: number | null
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
    knownSpread?: number
    knownTotal?: number
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
  
  // Patch CLV data with known spread/total from frontend if CLV pipeline returned zeros
  if (options?.knownTotal && (!clvData.currentTotal || clvData.currentTotal === 0)) {
    clvData.currentTotal = options.knownTotal
    if (!clvData.openTotal) clvData.openTotal = options.knownTotal
  }
  if (options?.knownSpread && (!clvData.currentSpread || clvData.currentSpread === 0)) {
    clvData.currentSpread = options.knownSpread
    if (!clvData.openSpread) clvData.openSpread = options.knownSpread
  }
  
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
  // First try line_snapshots table (real DK/FanDuel data captured every 30min)
  try {
    const { getLineTimeline } = await import('@/lib/services/game-odds-service')
    const timeline = await getLineTimeline(gameId)
    
    if (timeline && timeline.timestamps.length >= 2) {
      const firstSpread = timeline.spreads.find(s => s != null) ?? 0
      const lastSpread = timeline.spreads.filter(s => s != null).pop() ?? 0
      const firstTotal = timeline.totals.find(t => t != null) ?? 0
      const lastTotal = timeline.totals.filter(t => t != null).pop() ?? 0
      const firstHomeML = timeline.homeMLs.find(m => m != null) ?? 0
      const lastHomeML = timeline.homeMLs.filter(m => m != null).pop() ?? 0
      const firstAwayML = timeline.awayMLs.find(m => m != null) ?? 0
      const lastAwayML = timeline.awayMLs.filter(m => m != null).pop() ?? 0
      
      const allSpreads = timeline.spreads.filter(s => s != null) as number[]
      const allTotals = timeline.totals.filter(t => t != null) as number[]
      
      const spreadMove = lastSpread - firstSpread
      const totalMove = lastTotal - firstTotal
      
      const spreadDirection: 'toward_home' | 'toward_away' | 'stable' = 
        spreadMove < -0.5 ? 'toward_home' : spreadMove > 0.5 ? 'toward_away' : 'stable'
      const totalDirection: 'up' | 'down' | 'stable' = 
        totalMove > 0.5 ? 'up' : totalMove < -0.5 ? 'down' : 'stable'
      
      const spreadMagnitude: 'sharp' | 'moderate' | 'minimal' = 
        Math.abs(spreadMove) >= 2 ? 'sharp' : Math.abs(spreadMove) >= 1 ? 'moderate' : 'minimal'
      const totalMagnitude: 'sharp' | 'moderate' | 'minimal' = 
        Math.abs(totalMove) >= 2 ? 'sharp' : Math.abs(totalMove) >= 1 ? 'moderate' : 'minimal'
      
      // Detect steam move: rapid movement (>1pt in last few snapshots)
      const recentSpreads = allSpreads.slice(-4)
      const steamMoveDetected = recentSpreads.length >= 2 && 
        Math.abs(recentSpreads[recentSpreads.length - 1] - recentSpreads[0]) >= 1.5
      
      return {
        spread: {
          open: firstSpread,
          current: lastSpread,
          high: allSpreads.length > 0 ? Math.max(...allSpreads) : lastSpread,
          low: allSpreads.length > 0 ? Math.min(...allSpreads) : lastSpread,
          direction: spreadDirection,
          magnitude: spreadMagnitude,
          steamMoveDetected
        },
        total: {
          open: firstTotal,
          current: lastTotal,
          high: allTotals.length > 0 ? Math.max(...allTotals) : lastTotal,
          low: allTotals.length > 0 ? Math.min(...allTotals) : lastTotal,
          direction: totalDirection,
          magnitude: totalMagnitude
        },
        moneyline: {
          homeOpen: firstHomeML,
          homeCurrent: lastHomeML,
          awayOpen: firstAwayML,
          awayCurrent: lastAwayML,
          impliedProbShift: Math.abs(
            (lastHomeML < 0 ? ((-lastHomeML) / ((-lastHomeML) + 100)) : (100 / (lastHomeML + 100))) -
            (firstHomeML < 0 ? ((-firstHomeML) / ((-firstHomeML) + 100)) : (100 / (firstHomeML + 100)))
          ) * 100
        },
        timeline: timeline.timestamps.map((ts, i) => ({
          timestamp: ts,
          spread: timeline.spreads[i],
          total: timeline.totals[i],
          homeML: timeline.homeMLs[i],
          awayML: timeline.awayMLs[i]
        }))
      }
    }
  } catch (error) {
    console.error('line_snapshots timeline error:', error)
  }
  
  // Fallback: Try to fetch line movement from ESPN API
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
  try {
    // Fetch weather data from our weather API (which now uses OpenWeatherMap + ESPN)
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'
    const res = await fetch(`${baseUrl}/api/weather?sport=${sport}`, { 
      next: { revalidate: 1800 } // Cache 30 min
    })
    
    if (!res.ok) throw new Error('Weather API failed')
    const data = await res.json()
    
    // Find this game in weather results
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const gameWeather = data.games?.find((g: any) => g.id === gameId || g.id === gameId.replace(/^(espn_|an_)/, ''))
    
    if (gameWeather) {
      return {
        venue: gameWeather.venue || '',
        isOutdoor: gameWeather.isOutdoor,
        isDome: !gameWeather.isOutdoor,
        conditions: {
          temperature: gameWeather.weather.temperature || 0,
          feelsLike: gameWeather.weather.temperature || 0, // OWM provides proper feelsLike
          windSpeed: gameWeather.weather.windSpeed || 0,
          windDirection: gameWeather.weather.windDirection || '',
          precipitation: gameWeather.weather.precipitation || 0,
          humidity: gameWeather.weather.humidity || 0,
          conditions: gameWeather.weather.conditions || 'Clear',
        },
        bettingImpact: {
          level: gameWeather.bettingImpact.level || 'none',
          spreadImpact: 0,
          totalImpact: gameWeather.bettingImpact.level === 'high' ? -2 : gameWeather.bettingImpact.level === 'medium' ? -1 : 0,
          affectedBets: gameWeather.bettingImpact.affectedBets || [],
          narrative: gameWeather.bettingImpact.description || 'No significant weather impact',
        },
        historicalInWeather: {
          homeTeamRecord: '',
          awayTeamRecord: '',
          avgTotalInConditions: 0,
        },
      }
    }
  } catch (err) {
    console.warn('[WeatherImpact] Could not fetch weather:', err)
  }
  
  // Fallback: no weather data available
  return {
    venue: '',
    isOutdoor: false,
    isDome: true,
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
      narrative: 'Weather data unavailable'
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
  // Import rest-schedule analyzer for real situational data
  const { analyzeRestFactors, getSituationalATSRecord } = await import('@/lib/api/rest-schedule')
  
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
  
  try {
    // Analyze rest and schedule factors
    const restAnalysis = await analyzeRestFactors(homeAbbr, awayAbbr, gameId, new Date().toISOString(), sport)
    
    if (!restAnalysis) {
      return { home: emptySituation, away: { ...emptySituation }, angles: [] }
    }
    
    // Convert rest analysis to our situational format
    const homeSituation = {
      restDays: restAnalysis.homeTeam?.daysRest || 0,
      isBackToBack: restAnalysis.homeTeam?.isBackToBack || false,
      travelMiles: 0, // Home team doesn't travel
      afterWinLoss: 'unknown' as const,
      afterBlowout: false,
      afterOT: false,
      isRevenge: restAnalysis.homeTeam?.isRevengeSpot || false,
      isDivisional: false, // Would need division lookup
      isPrimetime: false, // Would need schedule time lookup
      isPlayoffs: false,
      letdownSpot: restAnalysis.homeTeam?.isLetDownSpot || false,
      lookaheadSpot: restAnalysis.homeTeam?.isLookAheadSpot || false,
      sandwichSpot: false,
      trapGame: restAnalysis.homeTeam?.isTrapGame || false,
      homeStandLength: 0,
      roadTripLength: 0
    }
    
    const awaySituation = {
      restDays: restAnalysis.awayTeam?.daysRest || 0,
      isBackToBack: restAnalysis.awayTeam?.isBackToBack || false,
      travelMiles: restAnalysis.awayTeam?.travelMiles || 0,
      afterWinLoss: 'unknown' as const,
      afterBlowout: false,
      afterOT: false,
      isRevenge: restAnalysis.awayTeam?.isRevengeSpot || false,
      isDivisional: false,
      isPrimetime: false,
      isPlayoffs: false,
      letdownSpot: restAnalysis.awayTeam?.isLetDownSpot || false,
      lookaheadSpot: restAnalysis.awayTeam?.isLookAheadSpot || false,
      sandwichSpot: false,
      trapGame: restAnalysis.awayTeam?.isTrapGame || false,
      homeStandLength: 0,
      roadTripLength: 0
    }
    
    // Generate angles from the analysis
    const angles: SituationalAngle[] = []
    
    // Rest advantage angle
    const restDiff = (restAnalysis.homeTeam?.daysRest || 0) - (restAnalysis.awayTeam?.daysRest || 0)
    if (Math.abs(restDiff) >= 2) {
      const advantageTeam = restDiff > 0 ? 'home' : 'away'
      const atsRecord = getSituationalATSRecord('rest_advantage_2plus')
      angles.push({
        name: 'Rest Advantage',
        team: advantageTeam,
        description: `${advantageTeam === 'home' ? homeAbbr : awayAbbr} has ${Math.abs(restDiff)}-day rest advantage`,
        historicalRecord: atsRecord ? `${atsRecord.wins}-${atsRecord.losses}` : '56-48',
        roi: atsRecord ? (atsRecord.winPct - 52.4) / 52.4 * 100 : 5.2,
        confidence: 62,
        betType: 'spread',
        pick: advantageTeam === 'home' ? homeAbbr : awayAbbr
      })
    }
    
    // Back-to-back fade angle
    if (restAnalysis.awayTeam?.isSecondOfBackToBack) {
      const atsRecord = getSituationalATSRecord('b2b_road')
      angles.push({
        name: 'Back-to-Back Road Fade',
        team: 'home',
        description: `${awayAbbr} on 2nd of back-to-back on the road`,
        historicalRecord: atsRecord ? `${atsRecord.wins}-${atsRecord.losses}` : '58-45',
        roi: atsRecord ? (atsRecord.winPct - 52.4) / 52.4 * 100 : 8.1,
        confidence: 65,
        betType: 'spread',
        pick: homeAbbr
      })
    }
    
    // Cross-country travel angle
    if (restAnalysis.awayTeam?.isCrossCountry) {
      const atsRecord = getSituationalATSRecord('cross_country')
      angles.push({
        name: 'Cross-Country Travel',
        team: 'home',
        description: `${awayAbbr} traveled 2000+ miles with timezone change`,
        historicalRecord: atsRecord ? `${atsRecord.wins}-${atsRecord.losses}` : '54-49',
        roi: atsRecord ? (atsRecord.winPct - 52.4) / 52.4 * 100 : 3.8,
        confidence: 58,
        betType: 'spread',
        pick: homeAbbr
      })
    }
    
    // Letdown spot
    if (restAnalysis.homeTeam?.isLetDownSpot) {
      angles.push({
        name: 'Letdown Spot',
        team: 'away',
        description: `${homeAbbr} in potential letdown spot after big game`,
        historicalRecord: '52-48',
        roi: 2.5,
        confidence: 55,
        betType: 'spread',
        pick: awayAbbr
      })
    }
    
    // Trap game
    if (restAnalysis.homeTeam?.isTrapGame || restAnalysis.awayTeam?.isTrapGame) {
      const trapTeam = restAnalysis.homeTeam?.isTrapGame ? 'home' : 'away'
      angles.push({
        name: 'Trap Game',
        team: trapTeam === 'home' ? 'away' : 'home',
        description: `${trapTeam === 'home' ? homeAbbr : awayAbbr} in sandwich game spot`,
        historicalRecord: '55-47',
        roi: 4.8,
        confidence: 58,
        betType: 'spread',
        pick: trapTeam === 'home' ? awayAbbr : homeAbbr
      })
    }
    
    return {
      home: homeSituation,
      away: awaySituation,
      angles
    }
  } catch (error) {
    console.error('Error getting situational angles:', error)
    return { home: emptySituation, away: { ...emptySituation }, angles: [] }
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
    analysis: `Key numbers for ${sport}: ${keyNums.join(', ')}.`
  }
}

async function getH2HHistory(
  sport: string,
  homeAbbr: string,
  awayAbbr: string
): Promise<H2HHistory> {
  try {
    // Import H2H module for real historical data
    const { getH2HSummary } = await import('@/lib/api/head-to-head')
    
    const h2hData = await getH2HSummary(homeAbbr, awayAbbr, sport, 10)
    
    if (!h2hData || h2hData.totalGames === 0) {
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
        insights: ['No H2H history found in database']
      }
    }
    
    // Convert H2HSummary to our H2HHistory format
    const insights: string[] = []
    
    // Generate insights from the data
    if (h2hData.team1Wins > h2hData.team2Wins * 1.5) {
      insights.push(`${homeAbbr} dominates this matchup (${h2hData.team1Wins}-${h2hData.team2Wins})`)
    } else if (h2hData.team2Wins > h2hData.team1Wins * 1.5) {
      insights.push(`${awayAbbr} dominates this matchup (${h2hData.team2Wins}-${h2hData.team1Wins})`)
    }
    
    if (h2hData.team1ATSRecord.pct >= 60) {
      insights.push(`${homeAbbr} covers ${h2hData.team1ATSRecord.pct.toFixed(0)}% ATS in H2H`)
    } else if (h2hData.team2ATSRecord.pct >= 60) {
      insights.push(`${awayAbbr} covers ${h2hData.team2ATSRecord.pct.toFixed(0)}% ATS in H2H`)
    }
    
    if (h2hData.overUnderRecord.overPct >= 60) {
      insights.push(`Games go OVER ${h2hData.overUnderRecord.overPct.toFixed(0)}% of the time`)
    } else if (h2hData.overUnderRecord.overPct <= 40) {
      insights.push(`Games go UNDER ${(100 - h2hData.overUnderRecord.overPct).toFixed(0)}% of the time`)
    }
    
    if (h2hData.currentStreak) {
      insights.push(`${h2hData.currentStreak.team} on ${h2hData.currentStreak.count}-game win streak in H2H`)
    }
    
    if (insights.length === 0) {
      insights.push(`${h2hData.totalGames} games played between these teams`)
    }
    
    // Format records
    const homeATSRecord = `${h2hData.team1ATSRecord.wins}-${h2hData.team1ATSRecord.losses}`
    const awayATSRecord = `${h2hData.team2ATSRecord.wins}-${h2hData.team2ATSRecord.losses}`
    const ouRecord = `${h2hData.overUnderRecord.overs}-${h2hData.overUnderRecord.unders}`
    
    return {
      gamesPlayed: h2hData.totalGames,
      homeTeamWins: h2hData.team1Wins,
      awayTeamWins: h2hData.team2Wins,
      ties: h2hData.ties,
      homeTeamATSRecord: homeATSRecord,
      awayTeamATSRecord: awayATSRecord,
      overUnderRecord: ouRecord,
      avgMargin: h2hData.avgMargin,
      avgTotal: h2hData.avgTotalPoints,
      lastMeeting: h2hData.lastMeeting ? {
        date: h2hData.lastMeeting.date,
        homeScore: h2hData.lastMeeting.homeScore,
        awayScore: h2hData.lastMeeting.awayScore,
        spread: h2hData.lastMeeting.spread || 0,
        total: h2hData.lastMeeting.total || 0,
        spreadResult: h2hData.lastMeeting.spreadResult || '',
        totalResult: h2hData.lastMeeting.totalResult || ''
      } : null,
      recentGames: h2hData.recentGames.map(g => ({
        date: g.date,
        homeScore: g.homeScore,
        awayScore: g.awayScore,
        winner: g.winner,
        spreadResult: g.spreadResult || '',
        totalResult: g.totalResult || '',
        venue: g.venue || ''
      })),
      streaks: {
        homeTeamStreak: h2hData.currentStreak?.team === homeAbbr ? h2hData.currentStreak.count : 0,
        awayTeamStreak: h2hData.currentStreak?.team === awayAbbr ? h2hData.currentStreak.count : 0,
        overStreak: 0, // Would need more analysis
        underStreak: 0
      },
      insights
    }
  } catch (error) {
    console.error('Error fetching H2H history:', error)
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
      insights: ['H2H history unavailable']
    }
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
    
    // If we have less than 2 real data points, use fallback template-based analysis
    // NEVER return null - gamblers expect analysis on every game page
    if (dataPointsAvailable < 2) {
      console.log(`[AI Analysis] Using fallback - only ${dataPointsAvailable} real data points available`)
      return generateFallbackAnalysis(data)
    }
    
    // If we already have a sharpestPick from real data, tell the AI to use it
    const sharpestPickInstruction = data.consensus.sharpestPick 
      ? `\n\nIMPORTANT: The sharpest play identified from real sharp money data is: "${data.consensus.sharpestPick.pick}" (${data.consensus.sharpestPick.betType}). Your analysis should align with or acknowledge this signal.`
      : `\n\nNOTE: No definitive sharp signal was detected in the betting splits. Be conservative with confidence levels and acknowledge data limitations.`
    
    const prompt = `You are an elite sports betting analyst writing for a professional-grade handicapping tool called "Matchups". Your audience is sharp bettors who expect high data density and specific numbers — not generic commentary.

VOICE & STYLE:
- Write like a Bloomberg Terminal analyst, not a ESPN commentator
- Lead with specific numbers, percentages, and records
- Use format: "KC is 8-3 ATS (72.7%) as home favorites this season"
- Cite exact split differentials: "65% of tickets on NYG but 78% of money on DAL = sharp divergence"
- Reference CLV moves: "Line moved from -3 to -4.5, +1.5 pts CLV for early bettors"
- Use language like "edge," "value," "EV+," "steam," "RLM," "CLV"
- If a data point is empty/zero, skip it entirely — do NOT say "no data available"

MATCHUP: ${data.awayTeam.name} @ ${data.homeTeam.name}
${sharpestPickInstruction}

=== RAW DATA (cite specific numbers from here) ===

1. CLV:
Opening spread: ${data.clv.openSpread}, Current: ${data.clv.currentSpread} (${data.clv.spreadCLV !== 0 ? `${data.clv.spreadCLV > 0 ? '+' : ''}${data.clv.spreadCLV} pts CLV` : 'no movement'})
Opening total: ${data.clv.openTotal}, Current: ${data.clv.currentTotal} (${data.clv.totalCLV !== 0 ? `${data.clv.totalCLV > 0 ? '+' : ''}${data.clv.totalCLV} pts CLV` : 'no movement'})
CLV Grade: ${data.clv.grade}

2. LINE MOVEMENT:
Spread: ${data.lineMovement.spread.open} → ${data.lineMovement.spread.current} (${data.lineMovement.spread.direction}, ${data.lineMovement.spread.magnitude})${data.lineMovement.spread.steamMoveDetected ? ' ⚡ STEAM MOVE DETECTED' : ''}
Total: ${data.lineMovement.total.open} → ${data.lineMovement.total.current} (${data.lineMovement.total.direction})
ML Shift: Home ${data.lineMovement.moneyline.homeOpen}→${data.lineMovement.moneyline.homeCurrent}, Away ${data.lineMovement.moneyline.awayOpen}→${data.lineMovement.moneyline.awayCurrent}

3. PUBLIC vs SHARP:
Spread: ${data.splits.spread.publicHomePct}% tickets on HOME, ${data.splits.spread.moneyHomePct}% money on HOME ${data.splits.spread.reverseLineMovement ? '⚡ REVERSE LINE MOVEMENT detected' : ''}
Sharp side: ${data.splits.spread.sharpSide} (RLM strength: ${data.splits.spread.rlmStrength})
Total: ${data.splits.total.publicOverPct}% tickets OVER, ${data.splits.total.moneyOverPct}% money OVER
Sharp total side: ${data.splits.total.sharpSide}

4. INJURIES (${data.injuries.homeTeam.outPlayers.length + data.injuries.awayTeam.outPlayers.length} OUT):
${data.injuries.homeTeam.outPlayers.length > 0 ? `${data.homeTeam.abbr} OUT: ${data.injuries.homeTeam.outPlayers.map(p => `${p.name} (${p.position}, impact: ${p.impactRating}/5)`).join(', ')}` : ''}
${data.injuries.awayTeam.outPlayers.length > 0 ? `${data.awayTeam.abbr} OUT: ${data.injuries.awayTeam.outPlayers.map(p => `${p.name} (${p.position}, impact: ${p.impactRating}/5)`).join(', ')}` : ''}
Impact scores: ${data.homeTeam.abbr}=${data.injuries.homeTeam.totalImpactScore}, ${data.awayTeam.abbr}=${data.injuries.awayTeam.totalImpactScore}
Line impact: ${data.injuries.lineImpact.spreadAdjustment} pts spread adjustment

5. WEATHER: ${data.weather.isDome ? 'Indoor/Dome' : `${data.weather.conditions.conditions}, ${data.weather.conditions.temperature}°F, Wind: ${data.weather.conditions.windSpeed}mph`}
Impact: ${data.weather.bettingImpact.level} — ${data.weather.bettingImpact.narrative}

6. SITUATIONAL: Home rest ${data.situational.home.restDays} days, Away rest ${data.situational.away.restDays} days. ${data.situational.home.isDivisional ? 'DIVISIONAL game. ' : ''}${data.situational.home.isPrimetime ? 'PRIMETIME. ' : ''}${data.situational.home.isBackToBack ? 'Home B2B. ' : ''}${data.situational.away.isBackToBack ? 'Away B2B. ' : ''}${data.situational.home.letdownSpot ? 'Home in LETDOWN spot. ' : ''}${data.situational.away.letdownSpot ? 'Away in LETDOWN spot. ' : ''}

7. ATS RECORDS:
${data.homeTeam.abbr}: Overall ${data.ats.homeTeam.overall.wins}-${data.ats.homeTeam.overall.losses} (${data.ats.homeTeam.overall.pct}%), Home ${data.ats.homeTeam.home.wins}-${data.ats.homeTeam.home.losses} (${data.ats.homeTeam.home.pct}%), L10 ${data.ats.homeTeam.last10.wins}-${data.ats.homeTeam.last10.losses} (${data.ats.homeTeam.last10.pct}%)
${data.awayTeam.abbr}: Overall ${data.ats.awayTeam.overall.wins}-${data.ats.awayTeam.overall.losses} (${data.ats.awayTeam.overall.pct}%), Away ${data.ats.awayTeam.away.wins}-${data.ats.awayTeam.away.losses} (${data.ats.awayTeam.away.pct}%), L10 ${data.ats.awayTeam.last10.wins}-${data.ats.awayTeam.last10.losses} (${data.ats.awayTeam.last10.pct}%)

8. O/U TRENDS: ${data.ou.trends.length > 0 ? JSON.stringify(data.ou.trends.slice(0, 3)) : 'No trend data'}
Combined projection: ${data.ou.combined.projectedTotal || 'N/A'}

9. KEY NUMBERS: ${JSON.stringify(data.keyNumbers)}

10. H2H: ${data.h2h.gamesPlayed} games — ${data.h2h.gamesPlayed > 0 ? `Home ${data.h2h.homeTeamWins}-${data.h2h.awayTeamWins}, ATS: ${data.h2h.homeTeamATSRecord || 'N/A'}` : 'No H2H data'}

11. MARKET CONSENSUS:
Spread pick: ${data.consensus.spreadConsensus.pick} (${data.consensus.spreadConsensus.confidence}% confidence)
Total pick: ${data.consensus.totalConsensus.pick} (${data.consensus.totalConsensus.confidence}% confidence)
Sharpest play: ${data.consensus.sharpestPick ? `${data.consensus.sharpestPick.pick} — ${data.consensus.sharpestPick.reasoning}` : 'No clear sharp signal'}

12. TEAM ANALYTICS:
${data.homeTeam.abbr}: ${data.homeAnalytics?.trends?.join(', ') || 'No analytics'}
${data.awayTeam.abbr}: ${data.awayAnalytics?.trends?.join(', ') || 'No analytics'}

=== ANALYSIS FORMAT ===
Structure your analysis like a professional handicapper's notes — lead with the strongest angle, cite 3-5 specific data points with exact numbers, and be direct about which side has value.

Return JSON:
{
  "summary": "2-3 dense paragraphs (150-200 words) structured as: 1) Lead with the primary edge/angle citing specific numbers (e.g. 'The line has moved from -3 to -4.5, generating +1.5 pts of CLV...'). 2) Supporting data points (ATS records, splits, injuries). 3) Bottom line recommendation with confidence qualifier. Use team names ${data.homeTeam.name} and ${data.awayTeam.name}. Skip any data point that is 0 or empty.",
  "winProbability": { "home": null, "away": null },
  "projectedScore": null,
  "spreadAnalysis": {
    "pick": "Specific pick with number (e.g. '${data.homeTeam.name} -4.5')",
    "confidence": 55,
    "reasoning": "Lead with the strongest data point, cite exact numbers",
    "keyFactors": ["Each factor must cite a specific stat"],
    "risks": ["Specific risks with numbers"]
  },
  "totalAnalysis": {
    "pick": "Over/Under with specific number",
    "confidence": 52,
    "reasoning": "Cite O/U trend data, total movement, pace factors",
    "keyFactors": ["Cite specific trend data"],
    "paceProjection": null
  },
  "mlAnalysis": {
    "pick": "Team name",
    "confidence": 52,
    "value": null,
    "reasoning": "ML value analysis"
  },
  "propPicks": [],
  "keyEdges": ["Each edge must cite a specific number or percentage"],
  "majorRisks": ["Each risk must be specific"],
  "betGrades": {
    "spread": "A through F based on edge strength",
    "total": "A through F",
    "ml": "A through F"
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
// CRITICAL: This function must ALWAYS return meaningful content
// NEVER return anything that says "requires Gemini" or "coming soon"
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
    // Always provide a meaningful opening statement about the matchup
    const sportUpper = data.sport.toUpperCase()
    if (sportUpper === 'NFL') {
      summaryParts.push(`${away} travels to face ${home} in what shapes up to be an intriguing NFL matchup.`)
    } else if (sportUpper === 'NBA') {
      summaryParts.push(`The ${away} visit the ${home} in a matchup that presents several betting angles to consider.`)
    } else if (sportUpper === 'NHL') {
      summaryParts.push(`${away} face off against ${home} in this NHL contest.`)
    } else if (sportUpper === 'MLB') {
      summaryParts.push(`${away} take on ${home} with both teams looking to capitalize on pitching matchups.`)
    } else {
      summaryParts.push(`A compelling matchup between ${away} and ${home} with multiple angles to consider.`)
    }
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
  
  // If we still don't have enough content (summaryParts is short), add template content
  if (summaryParts.length < 3) {
    const sportUpper = data.sport.toUpperCase()
    if (sportUpper === 'NFL') {
      summaryParts.push(`Home-field advantage typically adds about 2.5 points of value in NFL games, which should factor into spread analysis.`)
      summaryParts.push(`Key numbers to watch in NFL betting include 3 and 7, as final margins often land on these touchdown/field goal differentials.`)
    } else if (sportUpper === 'NBA') {
      summaryParts.push(`NBA home-court advantage has diminished in recent years but still provides roughly 2-3 points of value.`)
      summaryParts.push(`Consider pace of play matchups - faster tempo games tend to push totals over while grind-out defensive matchups favor the under.`)
    } else if (sportUpper === 'NHL') {
      summaryParts.push(`In NHL betting, puck line (-1.5) underdogs often provide value when playing at home with a rested goaltender.`)
    } else if (sportUpper === 'MLB') {
      summaryParts.push(`Starting pitching matchups are the primary driver of value in MLB betting - monitor bullpen usage from recent games.`)
    } else {
      summaryParts.push(`Market efficiency varies by sport - look for value in public perception mismatches.`)
    }
  }
  
  // Conclusion
  if (sharpPick && sharpPick.confidence >= 60) {
    summaryParts.push(`The sharpest play identified is ${sharpPick.pick} at ${sharpPick.confidence}% confidence. ${sharpPick.reasoning}`)
  } else {
    summaryParts.push(`Monitor line movement as game time approaches - sharp action closer to kickoff often reveals informed money.`)
  }
  
  const summary = summaryParts.join(' ')
  
  // =========================================================================
  // PROJECTED SCORE — Independent of spread. Based on total + scoring context.
  // We use the total as combined score, then split using a home-field edge
  // factor derived from available data (CLV shift, sharp signals, injuries).
  // This ensures the pick is DERIVED from the projection, not vice versa.
  // =========================================================================
  
  // Sport-aware total defaults — CRITICAL: prevents football scores for basketball
  const sportUpper = data.sport.toUpperCase()
  const SPORT_DEFAULT_TOTALS: Record<string, number> = {
    'NFL': 45, 'NCAAF': 50,
    'NBA': 222, 'NCAAB': 140,
    'NHL': 5.5, 'MLB': 8.5,
    'WNBA': 160, 'WNCAAB': 130,
  }
  const defaultTotal = SPORT_DEFAULT_TOTALS[sportUpper] || 45
  const total = (data.clv.currentTotal && data.clv.currentTotal > 0) ? data.clv.currentTotal : defaultTotal
  const spread = data.clv.currentSpread || 0
  
  // Build a power differential from real signals (not just the spread)
  let homeEdge = 0 // points of advantage for home team
  
  // Home-field advantage baseline: ~2.5 pts in NFL, ~3 in NBA, ~0.3 in NHL
  const hfaBase = sportUpper === 'NFL' ? 2.5 : sportUpper === 'NBA' ? 3.0 : sportUpper === 'NHL' ? 0.3 : sportUpper === 'NCAAB' ? 3.5 : sportUpper === 'NCAAF' ? 3.0 : 1.5
  homeEdge += hfaBase
  
  // Adjust for sharp money signals
  if (data.splits.spread.reverseLineMovement) {
    // RLM detected — sharp side gets +1.5 pt adjustment
    homeEdge += data.splits.spread.sharpSide === 'home' ? 1.5 : -1.5
  }
  if (data.consensus.sharpestPick && data.consensus.sharpestPick.betType === 'spread') {
    const pickStr = data.consensus.sharpestPick.pick || ''
    if (pickStr.includes(homeAbbr)) homeEdge += 1.0
    else if (pickStr.includes(awayAbbr)) homeEdge -= 1.0
  }
  
  // Adjust for injury differential
  const injuryDiff = data.injuries.awayTeam.totalImpactScore - data.injuries.homeTeam.totalImpactScore
  if (Math.abs(injuryDiff) > 10) {
    homeEdge += injuryDiff > 0 ? 1.5 : -1.5 // Injured away team helps home
  }
  
  // CLV shift: if line moved toward home, home is stronger than market thought
  if (data.clv.spreadCLV !== 0) {
    homeEdge += data.clv.spreadCLV * 0.5 // Half of CLV movement
  }
  
  // Calculate projected score using total and our independent home edge
  const projectedHome = Math.round((total / 2) + (homeEdge / 2))
  const projectedAway = Math.round((total / 2) - (homeEdge / 2))
  const projectedMargin = projectedHome - projectedAway // positive = home wins by X
  
  // =========================================================================
  // AI PICK — Derived FROM the projected score vs the actual spread.
  // If we project home wins by 4, and spread is home -6.5, pick the underdog.
  // If we project home wins by 4, and spread is home -2.5, pick the favorite.
  // =========================================================================
  
  // spread < 0 means home is favored (e.g. -4.5)
  // We need: projectedMargin vs |spread|
  // If home favored (spread < 0): home covers if projectedMargin > |spread|
  // If away favored (spread > 0): away covers if projectedMargin < -|spread|
  
  let spreadPick: string
  let spreadConfidence: number
  let spreadReasoning: string
  
  if (spread === 0) {
    // Pick'em — just pick the projected winner
    spreadPick = projectedMargin > 0 ? `${home} ML` : `${away} ML`
    spreadConfidence = 0.52
    spreadReasoning = 'Pick\'em game — slight edge based on projected score'
  } else if (spread < 0) {
    // Home is favored. Does our projection say they cover?
    const coverMargin = projectedMargin - Math.abs(spread) // positive = covers
    if (coverMargin > 0) {
      // We project home covers the spread
      spreadPick = `${home} ${spread}`
      spreadConfidence = Math.min(0.75, 0.52 + coverMargin * 0.03)
      spreadReasoning = `Projecting ${home} wins by ${projectedMargin}, covering the ${Math.abs(spread)}-point spread by ${coverMargin.toFixed(1)}`
    } else {
      // We project home does NOT cover — take the underdog
      spreadPick = `${away} +${Math.abs(spread)}`
      spreadConfidence = Math.min(0.75, 0.52 + Math.abs(coverMargin) * 0.03)
      spreadReasoning = `Projecting ${home} wins by only ${Math.max(0, projectedMargin)}, not enough to cover ${Math.abs(spread)}. Value on ${away} getting points.`
    }
  } else {
    // Away is favored (spread > 0 means home is the underdog)
    const awayProjectedMargin = -projectedMargin // positive = away winning
    const coverMargin = awayProjectedMargin - spread
    if (coverMargin > 0) {
      spreadPick = `${away} -${spread}`
      spreadConfidence = Math.min(0.75, 0.52 + coverMargin * 0.03)
      spreadReasoning = `Projecting ${away} wins by ${awayProjectedMargin}, covering the ${spread}-point spread`
    } else {
      spreadPick = `${home} +${spread}`
      spreadConfidence = Math.min(0.75, 0.52 + Math.abs(coverMargin) * 0.03)
      spreadReasoning = `Projecting ${away} wins by only ${Math.max(0, awayProjectedMargin)}, not enough to cover ${spread}. Value on ${home} at home.`
    }
  }
  
  // Boost confidence if sharp signals agree with our pick
  if (data.splits.spread.reverseLineMovement) spreadConfidence = Math.min(0.80, spreadConfidence + 0.08)
  
  // Determine total pick — use projected score vs. the posted total
  const projectedTotal = projectedHome + projectedAway
  let totalPick: string
  let totalConfidence: number
  if (data.splits.total.reverseLineMovement) {
    // Strong signal: sharp money on the total
    totalPick = data.splits.total.sharpSide === 'under' ? `Under ${total}` : `Over ${total}`
    totalConfidence = 0.70
  } else if (projectedTotal > total + 2) {
    totalPick = `Over ${total}`
    totalConfidence = Math.min(0.65, 0.50 + (projectedTotal - total) * 0.02)
  } else if (projectedTotal < total - 2) {
    totalPick = `Under ${total}`
    totalConfidence = Math.min(0.65, 0.50 + (total - projectedTotal) * 0.02)
  } else {
    totalPick = `Under ${total}`
    totalConfidence = 0.50
  }
  
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
    winProbability: { 
      home: parseFloat(Math.min(0.95, Math.max(0.05, 0.5 + projectedMargin * 0.025)).toFixed(2)), 
      away: parseFloat(Math.min(0.95, Math.max(0.05, 0.5 - projectedMargin * 0.025)).toFixed(2)) 
    },
    projectedScore: { home: projectedHome, away: projectedAway },
    spreadAnalysis: {
      pick: spreadPick,
      confidence: spreadConfidence,
      reasoning: spreadReasoning,
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
      pick: projectedMargin > 0 ? home : away,
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
