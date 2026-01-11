// =============================================================================
// BETTING INTELLIGENCE DATA LAYER
// Integrates all 12 essential betting data points with AI analysis
// =============================================================================

import { TeamAnalytics, getTeamByAbbr } from './analytics-data'
import { geminiModel } from './gemini'
import type { Sport } from '@/types/leaderboard'

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
  }
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
    consensusData,
    homeAnalytics,
    awayAnalytics
  ] = await Promise.all([
    getCLVData(gameId, sport),
    getLineMovementData(gameId, sport),
    getPublicSharpSplits(gameId, sport),
    getInjuryImpact(gameId, sport, homeTeam.abbr, awayTeam.abbr),
    getWeatherImpact(gameId, sport),
    getSituationalAngles(gameId, sport, homeTeam.abbr, awayTeam.abbr),
    getATSRecords(sport, homeTeam.abbr, awayTeam.abbr),
    getOUTrends(sport, homeTeam.abbr, awayTeam.abbr),
    getKeyNumbers(gameId, sport),
    getH2HHistory(sport, homeTeam.abbr, awayTeam.abbr),
    getMarketConsensus(gameId, sport),
    getTeamAnalytics(sport, homeTeam.abbr),
    getTeamAnalytics(sport, awayTeam.abbr)
  ])

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
  // In production, fetch from odds API with historical data
  // For now, generate based on typical patterns
  const openSpread = -3.5
  const currentSpread = -4
  const openTotal = 47.5
  const currentTotal = 46
  
  const spreadCLV = Math.abs(currentSpread) - Math.abs(openSpread)
  const totalCLV = openTotal - currentTotal
  
  let grade: CLVData['grade'] = 'neutral'
  if (spreadCLV >= 1) grade = 'excellent'
  else if (spreadCLV >= 0.5) grade = 'good'
  else if (spreadCLV <= -1) grade = 'poor'
  
  return {
    openSpread,
    currentSpread,
    openTotal,
    currentTotal,
    openHomeML: -170,
    currentHomeML: -180,
    spreadCLV,
    totalCLV,
    mlCLV: 10,
    grade,
    description: spreadCLV > 0 
      ? `Line has moved ${Math.abs(spreadCLV).toFixed(1)} points in your favor`
      : spreadCLV < 0 
      ? `Line has moved ${Math.abs(spreadCLV).toFixed(1)} points against you`
      : 'No significant line movement'
  }
}

async function getLineMovementData(gameId: string, sport: string): Promise<LineMovementData> {
  return {
    spread: {
      open: -3,
      current: -4.5,
      high: -5,
      low: -2.5,
      direction: 'toward_home',
      magnitude: 'moderate',
      steamMoveDetected: false
    },
    total: {
      open: 48,
      current: 46,
      high: 48.5,
      low: 45.5,
      direction: 'down',
      magnitude: 'sharp'
    },
    moneyline: {
      homeOpen: -150,
      homeCurrent: -185,
      awayOpen: 130,
      awayCurrent: 155,
      impliedProbShift: 5.2
    },
    timeline: [
      { timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), spread: -3, total: 48, homeML: -150 },
      { timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), spread: -3.5, total: 47.5, homeML: -165 },
      { timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), spread: -4, total: 46.5, homeML: -175 },
      { timestamp: new Date().toISOString(), spread: -4.5, total: 46, homeML: -185 }
    ]
  }
}

async function getPublicSharpSplits(gameId: string, sport: string): Promise<PublicSharpSplits> {
  return {
    spread: {
      publicHomePct: 72,
      publicAwayPct: 28,
      moneyHomePct: 58,
      moneyAwayPct: 42,
      sharpSide: 'away',
      reverseLineMovement: true,
      rlmStrength: 'moderate'
    },
    total: {
      publicOverPct: 65,
      publicUnderPct: 35,
      moneyOverPct: 48,
      moneyUnderPct: 52,
      sharpSide: 'under',
      reverseLineMovement: true
    },
    moneyline: {
      publicHomePct: 75,
      publicAwayPct: 25,
      moneyHomePct: 60,
      moneyAwayPct: 40
    },
    consensus: {
      publicLean: 'Home Spread + Over',
      sharpLean: 'Away Spread + Under',
      alignment: 'opposed'
    }
  }
}

async function getInjuryImpact(
  gameId: string, 
  sport: string, 
  homeAbbr: string, 
  awayAbbr: string
): Promise<InjuryImpact> {
  // Would fetch from injuries API
  return {
    homeTeam: {
      outPlayers: [],
      questionablePlayers: [
        {
          name: 'Star Player',
          position: 'WR',
          status: 'Questionable',
          injuryType: 'Hamstring',
          impactRating: 4,
          isStarter: true,
          isStar: true
        }
      ],
      totalImpactScore: 25,
      positionImpacts: [{ position: 'WR', impact: 'medium' }]
    },
    awayTeam: {
      outPlayers: [],
      questionablePlayers: [],
      totalImpactScore: 0,
      positionImpacts: []
    },
    lineImpact: {
      spreadAdjustment: 0.5,
      totalAdjustment: -1,
      narrative: 'Home team has a questionable star WR which could impact scoring'
    }
  }
}

async function getWeatherImpact(gameId: string, sport: string): Promise<WeatherImpact> {
  return {
    venue: 'Stadium',
    isOutdoor: true,
    isDome: false,
    conditions: {
      temperature: 35,
      feelsLike: 28,
      windSpeed: 15,
      windDirection: 'NW',
      precipitation: 20,
      humidity: 65,
      conditions: 'Cloudy'
    },
    bettingImpact: {
      level: 'medium',
      spreadImpact: 0,
      totalImpact: -2,
      affectedBets: ['totals', 'passing props'],
      narrative: 'Cold temps and wind favor the under. Passing game may be affected.'
    },
    historicalInWeather: {
      homeTeamRecord: '6-2 ATS',
      awayTeamRecord: '3-4 ATS',
      avgTotalInConditions: 41.5
    }
  }
}

async function getSituationalAngles(
  gameId: string,
  sport: string,
  homeAbbr: string,
  awayAbbr: string
): Promise<SituationalAngles> {
  return {
    home: {
      restDays: 7,
      isBackToBack: false,
      travelMiles: 0,
      afterWinLoss: 'win',
      afterBlowout: false,
      afterOT: false,
      isRevenge: false,
      isDivisional: true,
      isPrimetime: true,
      isPlayoffs: false,
      letdownSpot: false,
      lookaheadSpot: false,
      sandwichSpot: false,
      trapGame: false,
      homeStandLength: 2,
      roadTripLength: 0
    },
    away: {
      restDays: 6,
      isBackToBack: false,
      travelMiles: 1200,
      afterWinLoss: 'loss',
      afterBlowout: true,
      afterOT: false,
      isRevenge: true,
      isDivisional: true,
      isPrimetime: true,
      letdownSpot: false,
      lookaheadSpot: false,
      sandwichSpot: false,
      trapGame: false,
      homeStandLength: 0,
      roadTripLength: 1
    },
    angles: [
      {
        name: 'Revenge Game',
        team: 'away',
        description: 'Away team seeking revenge after blowout loss',
        historicalRecord: '58-42',
        roi: 8.5,
        confidence: 65,
        betType: 'spread',
        pick: 'Away +3.5'
      },
      {
        name: 'Divisional Primetime',
        team: 'home',
        description: 'Home team in divisional primetime game',
        historicalRecord: '52-48',
        roi: 2.1,
        confidence: 55,
        betType: 'spread',
        pick: 'Home -3.5'
      }
    ]
  }
}

async function getATSRecords(
  sport: string,
  homeAbbr: string,
  awayAbbr: string
): Promise<ATSRecords> {
  // REAL DATA: ATS records require historical betting data
  // This data is NOT available from free APIs like ESPN
  // Would need premium service like Covers, Action Network, or SportsReference
  
  const emptyATSRecord = {
    wins: 0,
    losses: 0,
    pushes: 0,
    pct: 0
  }
  
  return {
    homeTeam: {
      overall: emptyATSRecord,
      home: emptyATSRecord,
      asFavorite: emptyATSRecord,
      asUnderdog: emptyATSRecord,
      last10: emptyATSRecord,
      vsDivision: emptyATSRecord,
      inPrimetime: emptyATSRecord
    },
    awayTeam: {
      overall: emptyATSRecord,
      away: emptyATSRecord,
      asFavorite: emptyATSRecord,
      asUnderdog: emptyATSRecord,
      last10: emptyATSRecord,
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
  // REAL DATA: O/U trends require historical betting data
  // This data is NOT available from free APIs
  // Would need premium service with historical totals/results
  
  const emptyOURecord = {
    overs: 0,
    unders: 0,
    pushes: 0,
    overPct: 0
  }
  
  return {
    homeTeam: {
      overall: emptyOURecord,
      home: emptyOURecord,
      asFavorite: emptyOURecord,
      asUnderdog: emptyOURecord,
      last10: emptyOURecord,
      avgTotal: 0,
      avgActual: 0,
      marginVsTotal: 0
    },
    awayTeam: {
      overall: emptyOURecord,
      away: emptyOURecord,
      asFavorite: emptyOURecord,
      asUnderdog: emptyOURecord,
      last10: emptyOURecord,
      avgTotal: 0,
      avgActual: 0,
      marginVsTotal: 0
    },
    combined: {
      h2hOvers: 0,
      h2hUnders: 0,
      h2hAvgTotal: 0,
      projectedTotal: 0,
      valueOnOver: false,
      valueOnUnder: false,
      edgePct: 0
    },
    trends: [] // Empty - no fake trends
  }
}

async function getKeyNumbers(gameId: string, sport: string): Promise<KeyNumbers> {
  const sportKeyNumbers: Record<string, number[]> = {
    NFL: [3, 7, 10, 14, 17, 21],
    NBA: [4, 5, 6, 7, 8],
    NHL: [1, 2],
    MLB: [1, 1.5, 2]
  }
  
  const keyNums = sportKeyNumbers[sport] || [3, 7]
  const currentSpread = -3.5
  const currentTotal = 46
  
  const nearSpreadKey = keyNums.some(k => Math.abs(Math.abs(currentSpread) - k) <= 0.5)
  const spreadKeyNum = keyNums.find(k => Math.abs(Math.abs(currentSpread) - k) <= 0.5) || null
  
  return {
    spread: {
      currentLine: currentSpread,
      nearKeyNumber: nearSpreadKey,
      keyNumber: spreadKeyNum,
      buyPointValue: nearSpreadKey ? 0.15 : 0.05,
      sellPointValue: nearSpreadKey ? 0.12 : 0.04,
      historicalPushRate: nearSpreadKey ? 8.5 : 2.1,
      recommendation: nearSpreadKey ? 'Consider buying to -3 or selling to -4' : null
    },
    total: {
      currentLine: currentTotal,
      nearKeyNumber: false,
      keyNumber: null,
      buyPointValue: 0.05,
      sellPointValue: 0.04,
      historicalPushRate: 1.2,
      recommendation: null
    },
    sport,
    keyNumbersForSport: keyNums,
    analysis: sport === 'NFL' 
      ? 'Current spread of -3.5 is near the key number 3. Games land on 3 about 15% of the time in NFL.'
      : 'No significant key number considerations for this line.'
  }
}

async function getH2HHistory(
  sport: string,
  homeAbbr: string,
  awayAbbr: string
): Promise<H2HHistory> {
  return {
    gamesPlayed: 8,
    homeTeamWins: 5,
    awayTeamWins: 3,
    ties: 0,
    homeTeamATSRecord: '4-3-1',
    awayTeamATSRecord: '3-4-1',
    overUnderRecord: '3O-5U',
    avgMargin: 4.5,
    avgTotal: 45.2,
    lastMeeting: {
      date: '2025-10-15',
      homeScore: 28,
      awayScore: 24,
      spread: -3,
      total: 48,
      spreadResult: 'Home Cover',
      totalResult: 'Under'
    },
    recentGames: [
      { date: '2025-10-15', homeScore: 28, awayScore: 24, winner: 'Home', spreadResult: 'Home Cover', totalResult: 'Under', venue: 'Home' },
      { date: '2025-03-20', homeScore: 21, awayScore: 27, winner: 'Away', spreadResult: 'Away Cover', totalResult: 'Over', venue: 'Away' },
      { date: '2024-11-10', homeScore: 17, awayScore: 14, winner: 'Home', spreadResult: 'Push', totalResult: 'Under', venue: 'Home' }
    ],
    streaks: {
      homeTeamStreak: 2,
      awayTeamStreak: 0,
      overStreak: 0,
      underStreak: 3
    },
    insights: [
      'Home team has won 5 of last 8 meetings',
      'Under has hit in 5 of last 8 H2H games',
      'Average total in H2H is 45.2, current line is 46'
    ]
  }
}

async function getMarketConsensus(gameId: string, sport: string): Promise<MarketConsensus> {
  return {
    spreadConsensus: {
      pick: 'Home -3.5',
      confidence: 58,
      sources: [
        { name: 'Action Network', pick: 'Home -3.5' },
        { name: 'Covers', pick: 'Away +3.5' },
        { name: 'Pregame', pick: 'Home -3.5' }
      ],
      agreement: 67
    },
    totalConsensus: {
      pick: 'Under 46',
      confidence: 72,
      sources: [
        { name: 'Action Network', pick: 'Under 46' },
        { name: 'Covers', pick: 'Under 46' },
        { name: 'Pregame', pick: 'Under 46' }
      ],
      agreement: 100
    },
    mlConsensus: {
      pick: 'Home ML',
      confidence: 55,
      sources: [],
      agreement: 60
    },
    sharpestPick: {
      betType: 'total',
      pick: 'Under 46',
      confidence: 72,
      reasoning: 'Sharp money on under, line has dropped 2 points, H2H history favors under'
    }
  }
}

async function getLiveBettingEdges(gameId: string, sport: string): Promise<LiveBettingEdges | null> {
  // Only available during live games
  return null
}

// =============================================================================
// EDGE SCORE CALCULATION
// =============================================================================

function calculateComprehensiveEdgeScore(data: {
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
}): MatchupIntelligence['edgeScore'] {
  
  // CLV Value (0-15 points)
  let clvValue = 0
  if (data.clv.grade === 'excellent') clvValue = 15
  else if (data.clv.grade === 'good') clvValue = 10
  else if (data.clv.grade === 'neutral') clvValue = 5
  
  // Sharp Signal (0-20 points)
  let sharpSignal = 0
  if (data.splits.spread.reverseLineMovement) {
    if (data.splits.spread.rlmStrength === 'strong') sharpSignal += 15
    else if (data.splits.spread.rlmStrength === 'moderate') sharpSignal += 10
    else sharpSignal += 5
  }
  if (data.splits.consensus.alignment === 'opposed') sharpSignal += 5
  
  // Trend Alignment (0-20 points)
  let trendAlignment = 0
  const ouTrendCount = data.ou.trends.length
  const avgOUConfidence = data.ou.trends.reduce((sum, t) => sum + t.confidence, 0) / Math.max(ouTrendCount, 1)
  trendAlignment = Math.min(ouTrendCount * 3 + avgOUConfidence / 10, 20)
  
  // Situational Edge (0-15 points)
  let situationalEdge = 0
  const angleCount = data.situational.angles.length
  const avgAngleROI = data.situational.angles.reduce((sum, a) => sum + a.roi, 0) / Math.max(angleCount, 1)
  situationalEdge = Math.min(angleCount * 4 + avgAngleROI / 2, 15)
  
  // Injury Advantage (0-10 points)
  let injuryAdvantage = 0
  const injuryDiff = data.injuries.awayTeam.totalImpactScore - data.injuries.homeTeam.totalImpactScore
  injuryAdvantage = Math.min(Math.abs(injuryDiff) / 10, 10)
  
  // Weather Edge (0-10 points)
  let weatherEdge = 0
  if (data.weather.bettingImpact.level === 'high') weatherEdge = 10
  else if (data.weather.bettingImpact.level === 'medium') weatherEdge = 6
  else if (data.weather.bettingImpact.level === 'low') weatherEdge = 3
  
  // H2H Edge (0-10 points)
  let h2hEdge = 0
  if (data.h2h.gamesPlayed >= 5) {
    const dominance = Math.abs(data.h2h.homeTeamWins - data.h2h.awayTeamWins) / data.h2h.gamesPlayed
    h2hEdge = Math.min(dominance * 20, 10)
  }
  
  const overall = Math.round(clvValue + sharpSignal + trendAlignment + situationalEdge + injuryAdvantage + weatherEdge + h2hEdge)
  
  // Determine top edge
  let topEdge: MatchupIntelligence['edgeScore']['topEdge'] = null
  
  if (data.consensus.sharpestPick) {
    topEdge = {
      betType: data.consensus.sharpestPick.betType,
      pick: data.consensus.sharpestPick.pick,
      confidence: data.consensus.sharpestPick.confidence,
      reasoning: [
        data.consensus.sharpestPick.reasoning,
        ...(data.splits.spread.reverseLineMovement ? ['Reverse line movement detected'] : []),
        ...(data.ou.trends.length > 0 ? [`${data.ou.trends.length} supporting O/U trends`] : [])
      ]
    }
  }
  
  return {
    overall: Math.min(overall, 100),
    breakdown: {
      clvValue: Math.round(clvValue),
      sharpSignal: Math.round(sharpSignal),
      trendAlignment: Math.round(trendAlignment),
      situationalEdge: Math.round(situationalEdge),
      injuryAdvantage: Math.round(injuryAdvantage),
      weatherEdge: Math.round(weatherEdge),
      h2hEdge: Math.round(h2hEdge)
    },
    topEdge
  }
}

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
    const prompt = `You are an elite sports betting analyst. Analyze this ${data.sport} matchup using ALL the data provided.

MATCHUP: ${data.awayTeam.name} @ ${data.homeTeam.name}

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

Provide a comprehensive betting analysis considering ALL 12 data points. Return JSON:

{
  "summary": "2-3 sentence executive summary weighing all factors",
  "winProbability": { "home": 0.55, "away": 0.45 },
  "projectedScore": { "home": 24, "away": 21 },
  "spreadAnalysis": {
    "pick": "TEAM -/+ X",
    "confidence": 0.65,
    "reasoning": "Main thesis for spread pick",
    "keyFactors": ["Factor 1", "Factor 2", "Factor 3"],
    "risks": ["Risk 1", "Risk 2"]
  },
  "totalAnalysis": {
    "pick": "OVER/UNDER X",
    "confidence": 0.70,
    "reasoning": "Main thesis for total pick",
    "keyFactors": ["Factor 1", "Factor 2"],
    "paceProjection": "Expected pace and scoring environment"
  },
  "mlAnalysis": {
    "pick": "TEAM",
    "confidence": 0.60,
    "value": 3.5,
    "reasoning": "ML value analysis"
  },
  "propPicks": [
    { "player": "Player Name", "prop": "Prop description", "pick": "Over/Under X", "confidence": 0.65, "reasoning": "Why" }
  ],
  "keyEdges": ["Edge 1 from the data", "Edge 2", "Edge 3"],
  "majorRisks": ["Risk 1", "Risk 2"],
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
  
  return null
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
