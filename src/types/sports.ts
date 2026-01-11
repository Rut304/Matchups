/**
 * Core sports data types used throughout the application
 * Provides type safety and consistent data structures across all features
 */

// Supported sports in the platform
export type SportType = 'nfl' | 'nba' | 'nhl' | 'mlb' | 'ncaaf' | 'ncaab' | 'wnba' | 'wncaab'

// Game status states
export type GameStatus = 'scheduled' | 'live' | 'final' | 'postponed' | 'cancelled'

// Injury status levels
export type InjuryStatus = 'Out' | 'IR' | 'Doubtful' | 'Questionable' | 'GTD' | 'Day-to-Day' | 'Probable'

// Team information
export interface Team {
  id: string
  name: string
  abbreviation: string
  logo?: string
  score?: number
  record?: string
  conference?: string
  division?: string
}

// Game odds information
export interface GameOdds {
  spread: number
  spreadOdds?: number
  total: number
  overOdds?: number
  underOdds?: number
  homeML?: number
  awayML?: number
  lastUpdated?: string
}

// Core game data structure
export interface Game {
  id: string
  sport: SportType
  status: GameStatus
  startTime: string
  scheduledAt?: string
  venue?: string
  broadcast?: string
  homeTeam: Team
  awayTeam: Team
  period?: string
  clock?: string
  odds?: GameOdds
  weather?: WeatherData
}

// Weather data for outdoor sports
export interface WeatherData {
  temp?: number
  condition?: string
  wind?: string
  humidity?: number
  precipitation?: number
}

// Player injury data
export interface Injury {
  id: string
  playerId: string
  name: string
  team: string
  position: string
  status: InjuryStatus
  injury: string
  updated?: string
  expectedReturn?: string
  impactRating?: number
}

// Betting trend data
export interface BettingTrend {
  id: string
  description: string
  text?: string
  confidence: number
  direction: 'spread' | 'total' | 'moneyline'
  recommendation?: string
  record?: string
  edge?: number
}

// Edge score breakdown
export interface EdgeScore {
  overall: number
  trendAlignment: number
  sharpSignal: number
  valueIndicator: number
  publicFade?: number
  lineMovement?: number
}

// AI prediction data
export interface AIPrediction {
  selection: string
  confidence: number
  supportingTrends: number
  reasoning?: string[]
}

// Head-to-head history
export interface H2HData {
  gamesPlayed: number
  homeATSRecord: string
  awayATSRecord: string
  overUnderRecord: string
  avgMargin?: number
  avgTotal: number
  lastMeetings?: H2HMeeting[]
}

export interface H2HMeeting {
  date: string
  homeScore: number
  awayScore: number
  winner: string
  totalPoints: number
}

// Betting intelligence data
export interface BettingIntelligence {
  lineMovement: string
  openLine?: number
  currentLine?: number
  publicPct: number
  sharpPct: number
  handlePct: number
  steamMoves?: SteamMove[]
  reverseLineMovement?: boolean
}

export interface SteamMove {
  time: string
  from: number
  to: number
  type: 'spread' | 'total' | 'ml'
}

// Complete analytics data for a matchup
export interface MatchupAnalytics {
  gameId: string
  sport: SportType
  trends?: {
    matched: number
    aggregateConfidence: number
    topPick?: AIPrediction | null
    spreadTrends?: BettingTrend[]
    totalTrends?: BettingTrend[]
    mlTrends?: BettingTrend[]
  }
  h2h?: H2HData
  edgeScore?: EdgeScore
  bettingIntelligence?: BettingIntelligence
  lastUpdated?: string
}

// API response types
export interface GamesResponse {
  games: Game[]
  count: number
  sport: SportType
  lastUpdated: string
}

export interface InjuriesResponse {
  injuries: Injury[]
  count: number
  lastUpdated: string
}

export interface AnalyticsResponse extends MatchupAnalytics {
  success: boolean
  error?: string
}

// Component prop types
export interface SportConfig {
  sport: SportType
  emoji: string
  name: string
  spreadLabel: string // e.g., "Spread", "Puck Line", "Run Line"
  primaryColor?: string
}

// Sport configurations
export const SPORT_CONFIGS: Record<SportType, SportConfig> = {
  nfl: { sport: 'nfl', emoji: '🏈', name: 'NFL', spreadLabel: 'Spread' },
  nba: { sport: 'nba', emoji: '🏀', name: 'NBA', spreadLabel: 'Spread' },
  nhl: { sport: 'nhl', emoji: '🏒', name: 'NHL', spreadLabel: 'Puck Line' },
  mlb: { sport: 'mlb', emoji: '⚾', name: 'MLB', spreadLabel: 'Run Line' },
  ncaaf: { sport: 'ncaaf', emoji: '🏈', name: 'NCAAF', spreadLabel: 'Spread' },
  ncaab: { sport: 'ncaab', emoji: '🏀', name: 'NCAAB', spreadLabel: 'Spread' },
  wnba: { sport: 'wnba', emoji: '🏀', name: 'WNBA', spreadLabel: 'Spread' },
  wncaab: { sport: 'wncaab', emoji: '🏀', name: 'WNCAAB', spreadLabel: 'Spread' },
}

// Utility type for API error handling
export interface ApiError {
  message: string
  code?: string
  status?: number
}

// Data fetching state
export interface FetchState<T> {
  data: T | null
  error: ApiError | null
  isLoading: boolean
  isValidating: boolean
  mutate: () => void
}
