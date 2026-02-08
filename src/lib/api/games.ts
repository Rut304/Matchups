// =============================================================================
// GAMES API CLIENT
// Fetches game data, matchup details, betting info for all sports
// =============================================================================

export interface GameTeam {
  id: string
  name: string
  city: string
  abbr: string
  emoji: string
  record: string
  ats: string
  ou?: string
  ml?: string
}

export interface GameSignal {
  type: 'bullish' | 'bearish' | 'neutral'
  title: string
  description: string
}

export interface GameInjury {
  player: string
  team: string
  position: string
  status: 'Out' | 'Doubtful' | 'Questionable' | 'Probable'
  injury: string
}

export interface H2HMatch {
  date: string
  score: string
  winner: string
  atsResult: 'W' | 'L' | 'P'
  ouResult: 'O' | 'U' | 'P'
}

export interface GameBetting {
  openSpread: string
  currentSpread: string
  spreadPcts: { home: number; away: number }
  mlPcts: { home: number; away: number }
  totalPcts: { over: number; under: number }
}

export interface GameMatchup {
  homeOffRank: number
  homeDefRank: number
  awayOffRank: number
  awayDefRank: number
  keyPoints: string[]
}

export interface GameMetrics {
  lineMovement: string
  lineDirection: 'up' | 'down' | 'stable'
  publicPct: number
  publicSide: string
  sharpMoney: string
  sharpTrend: 'up' | 'down' | 'stable'
  handlePct: number
  handleSide: string
}

export interface AIPick {
  pick: string
  reasoning: string
  confidence: number
}

// Box Score for completed games
export interface BoxScoreQuarter {
  q1: number
  q2: number
  q3: number
  q4: number
  ot?: number
  final: number
}

export interface TopPerformer {
  player: string
  team: string
  position: string
  stats: string
  highlight?: string
}

export interface GameResult {
  homeScore: number
  awayScore: number
  homeQuarters: BoxScoreQuarter
  awayQuarters: BoxScoreQuarter
  winner: 'home' | 'away' | 'tie'
  spreadResult: 'home_cover' | 'away_cover' | 'push'
  totalResult: 'over' | 'under' | 'push'
  aiResult?: 'win' | 'loss' | 'push'
  topPerformers: TopPerformer[]
  summary?: string
}

// Team Analytics Summary - pulled from trends/analytics data
export interface TeamAnalyticsSummary {
  abbr: string
  name: string
  record: string
  ats: {
    overall: string
    home: string
    away: string
    asFav: string
    asUnderdog: string
    last10: string
  }
  ou: {
    overall: string
    home: string
    away: string
    last10: string
  }
  situational: {
    afterWin: string
    afterLoss: string
    divisional: string
    primetime: string
  }
  scoring: {
    ppg: number
    oppg: number
    margin: number
  }
  streak: string
  isHot: boolean
  isCold: boolean
  trends: string[]
}

export interface GameDetail {
  id: string
  sport: string
  sportIcon: string
  league: string
  date: string
  time: string
  isHot: boolean
  status: 'scheduled' | 'live' | 'final' // Game status
  home: GameTeam
  away: GameTeam
  spread: {
    favorite: string
    line: number
  }
  total: number
  moneyline: {
    home: number
    away: number
  }
  // Opening lines - preserved for completed games
  openingSpread?: { favorite: string; line: number }
  openingTotal?: number
  openingMoneyline?: { home: number; away: number }
  aiPick: string
  aiConfidence: number
  aiAnalysis: string
  aiPicks: AIPick[]
  signals: GameSignal[]
  injuries: GameInjury[]
  weather?: {
    temp: number
    wind: number
    condition: string
  }
  metrics: GameMetrics
  h2h: H2HMatch[]
  betting: GameBetting
  matchup: GameMatchup
  homeTrends: string[]
  awayTrends: string[]
  // Deep team analytics from trends page
  homeAnalytics?: TeamAnalyticsSummary
  awayAnalytics?: TeamAnalyticsSummary
  // Completed game data
  result?: GameResult
}

// NO MOCK DATA - All game data must come from real APIs
// Removed all mock games data - Feb 2026 cleanup to ensure only real data is displayed

// Empty game records - prevents fallback to fake data
const mockGames: Record<string, GameDetail> = {}
const additionalGames: Record<string, GameDetail> = {}

// Merge all games - now empty, forces real API usage
const allGames = { ...mockGames, ...additionalGames }

// Import team analytics
import { getTeamByAbbr, type TeamAnalytics } from '@/lib/analytics-data'
import type { Sport } from '@/types/leaderboard'

// Convert TeamAnalytics to TeamAnalyticsSummary
function convertToSummary(team: TeamAnalytics): TeamAnalyticsSummary {
  const formatRecord = (w: number, l: number, p?: number) => 
    p ? `${w}-${l}-${p}` : `${w}-${l}`
  
  return {
    abbr: team.abbr,
    name: team.name,
    record: formatRecord(team.record.wins, team.record.losses, team.record.ties),
    ats: {
      overall: formatRecord(team.ats.overall.wins, team.ats.overall.losses, team.ats.overall.pushes),
      home: formatRecord(team.ats.home.wins, team.ats.home.losses, team.ats.home.pushes),
      away: formatRecord(team.ats.away.wins, team.ats.away.losses, team.ats.away.pushes),
      asFav: formatRecord(team.ats.asFavorite.wins, team.ats.asFavorite.losses, team.ats.asFavorite.pushes),
      asUnderdog: formatRecord(team.ats.asUnderdog.wins, team.ats.asUnderdog.losses, team.ats.asUnderdog.pushes),
      last10: formatRecord(team.ats.last10.wins, team.ats.last10.losses, team.ats.last10.pushes),
    },
    ou: {
      overall: formatRecord(team.ou.overall.overs, team.ou.overall.unders, team.ou.overall.pushes),
      home: formatRecord(team.ou.home.overs, team.ou.home.unders, team.ou.home.pushes),
      away: formatRecord(team.ou.away.overs, team.ou.away.unders, team.ou.away.pushes),
      last10: formatRecord(team.ou.last10.overs, team.ou.last10.unders, team.ou.last10.pushes),
    },
    situational: {
      afterWin: team.situational.afterWin.ats,
      afterLoss: team.situational.afterLoss.ats,
      divisional: team.situational.divisional.ats,
      primetime: team.situational.primetime.ats,
    },
    scoring: {
      ppg: team.scoring.ppg,
      oppg: team.scoring.oppg,
      margin: team.scoring.margin,
    },
    streak: team.streak,
    isHot: team.isHot,
    isCold: team.isCold,
    trends: team.trends,
  }
}

// API Functions
export async function getGameById(id: string, sport?: string): Promise<GameDetail | null> {
  // ALWAYS try real API first - never prioritize mock data
  try {
    const baseUrl = typeof window !== 'undefined' 
      ? '' 
      : process.env.VERCEL_URL 
        ? `https://${process.env.VERCEL_URL}` 
        : 'http://localhost:3000'
    
    const url = sport 
      ? `${baseUrl}/api/games/${id}?sport=${sport}`
      : `${baseUrl}/api/games/${id}`
    
    const res = await fetch(url, { cache: 'no-store' })
    
    if (res.ok) {
      const data = await res.json()
      // Transform API data to GameDetail format
      return transformAPIGameToDetail(data, sport || data.sport)
    }
    
    // Only log if real error (not 404)
    if (res.status !== 404) {
      console.error(`[getGameById] API returned ${res.status} for game ${id}`)
    }
  } catch (error) {
    console.error('[getGameById] Error fetching game:', error)
  }
  
  // NO MOCK DATA FALLBACK - return null if API fails
  // The UI should display "Game data unavailable" instead
  return null
}

// Transform ESPN API game data to our GameDetail format
// NOTE: This function ONLY uses real data from the API
// Missing data shows as "N/A" or empty - NO fake random data
function transformAPIGameToDetail(apiGame: Record<string, unknown>, sport: string): GameDetail {
  const home = apiGame.home as Record<string, unknown>
  const away = apiGame.away as Record<string, unknown>
  const odds = apiGame.odds as Record<string, unknown> | undefined
  
  // ESPN API returns 'abbreviation', normalize to 'abbr' for our app
  const homeAbbr = (home?.abbreviation || home?.abbr) as string || 'HOME'
  const awayAbbr = (away?.abbreviation || away?.abbr) as string || 'AWAY'
  
  // Determine favorite based on spread
  const spreadLine = odds?.spread as number || 0
  const favorite = spreadLine <= 0 ? homeAbbr : awayAbbr
  
  // Status mapping
  let status: 'scheduled' | 'live' | 'final' = 'scheduled'
  const statusType = apiGame.status || apiGame.statusType
  if (statusType === 'live' || statusType === 'in') status = 'live'
  else if (statusType === 'final' || statusType === 'post') status = 'final'
  
  // Real signals only - no fake data
  const signals: GameSignal[] = []
  // Only add signals if we have real data to support them
  if (odds?.spread && apiGame.previousSpread) {
    const prevSpread = apiGame.previousSpread as number
    const currentSpread = odds.spread as number
    if (Math.abs(currentSpread - prevSpread) >= 0.5) {
      signals.push({ 
        type: currentSpread > prevSpread ? 'bullish' : 'bearish', 
        title: 'Line Movement', 
        description: `Line moved from ${prevSpread} to ${currentSpread}` 
      })
    }
  }
  
  // Real trends require historical data - showing empty if not available
  const homeTrends: string[] = []
  const awayTrends: string[] = []
  
  // Generate trends from odds movement and spread data
  if (odds) {
    const spreadLine = odds.spread as number || 0
    if (spreadLine !== 0) {
      const line = Math.abs(spreadLine)
      
      // Only add meaningful key number commentary (not just repeating the spread)
      if (line === 3 || line === 3.5) {
        if (spreadLine < 0) {
          homeTrends.push('Line at key number of 3 - historically significant in NFL')
        } else {
          awayTrends.push('Line at key number of 3 - historically significant in NFL')
        }
      }
      if (line === 7 || line === 7.5) {
        if (spreadLine < 0) {
          homeTrends.push('Touchdown spread - key number for NFL betting')
        } else {
          awayTrends.push('Touchdown spread - key number for NFL betting')
        }
      }
    }
    
    // Total trends
    const total = odds.total as number || 0
    if (total > 0) {
      if (total >= 49) {
        homeTrends.push(`High total (${total}) suggests offensive game expected`)
        awayTrends.push(`High total (${total}) suggests offensive game expected`)
      } else if (total <= 42) {
        homeTrends.push(`Low total (${total}) suggests defensive battle expected`)
        awayTrends.push(`Low total (${total}) suggests defensive battle expected`)
      }
    }
  }
  
  // API may return scheduledAt or startTime depending on source
  const gameTime = (apiGame.scheduledAt || apiGame.startTime || new Date().toISOString()) as string
  
  return {
    id: apiGame.id as string,
    sport: sport.toUpperCase(),
    sportIcon: getSportEmoji(sport),
    league: `${sport.toUpperCase()} ${apiGame.week || 'Regular Season'}`,
    date: formatGameDate(gameTime),
    time: formatGameTime(gameTime),
    isHot: Boolean(apiGame.isPlayoff) || (odds?.spread ? Math.abs(odds.spread as number) <= 3 : false),
    status,
    home: {
      id: home?.id as string || 'home',
      name: home?.name as string || 'Home Team',
      city: home?.city as string || '',
      abbr: homeAbbr,
      emoji: getTeamEmoji(homeAbbr),
      record: home?.record as string || '',
      ats: '', // Empty - we don't have real ATS data without historical tracking
    },
    away: {
      id: away?.id as string || 'away',
      name: away?.name as string || 'Away Team',
      city: away?.city as string || '',
      abbr: awayAbbr,
      emoji: getTeamEmoji(awayAbbr),
      record: away?.record as string || '',
      ats: '', // Empty - we don't have real ATS data without historical tracking
    },
    spread: {
      favorite,
      line: Math.abs(spreadLine),
    },
    total: odds?.total as number || 0,
    moneyline: {
      home: odds?.homeML as number || 0,
      away: odds?.awayML as number || 0,
    },
    aiPick: '', // Empty — real pick comes from betting-intelligence AI analysis
    aiConfidence: 0, // 0 = not analyzed yet
    aiAnalysis: '', // Empty until Gemini AI generates real analysis
    aiPicks: [], // Empty until Gemini integration
    signals,
    injuries: [], // Would need injury API integration
    weather: apiGame.weather ? {
      temp: (apiGame.weather as Record<string, unknown>).temp as number || 0,
      wind: (apiGame.weather as Record<string, unknown>).wind as number || 0,
      condition: (apiGame.weather as Record<string, unknown>).condition as string || '',
    } : undefined,
    metrics: {
      // Line movement from API if available
      lineMovement: apiGame.previousSpread && odds?.spread 
        ? `${apiGame.previousSpread} → ${odds.spread}`
        : 'No movement data',
      lineDirection: 'stable',
      // Public betting data requires premium API (Action Network, etc.)
      publicPct: 0,
      publicSide: '',
      sharpMoney: '',
      sharpTrend: 'stable',
      handlePct: 0,
      handleSide: '',
    },
    h2h: [], // Would need historical data
    betting: {
      openSpread: odds?.openSpread as string || '',
      currentSpread: odds?.spread ? `${favorite} -${Math.abs(spreadLine).toFixed(1)}` : '',
      // Betting split data requires premium API
      spreadPcts: { home: 0, away: 0 },
      mlPcts: { home: 0, away: 0 },
      totalPcts: { over: 0, under: 0 },
    },
    matchup: {
      // Rankings would come from standings API
      homeOffRank: 0,
      homeDefRank: 0,
      awayOffRank: 0,
      awayDefRank: 0,
      keyPoints: [],
    },
    homeTrends,
    awayTrends,
    // Analytics data not available for API-fetched games without historical tracking
    homeAnalytics: undefined,
    awayAnalytics: undefined,
  }
}

function getSportEmoji(sport: string): string {
  const map: Record<string, string> = {
    nfl: '🏈', nba: '🏀', nhl: '🏒', mlb: '⚾',
    ncaaf: '🏈', ncaab: '🏀', wnba: '🏀', wncaab: '🏀'
  }
  return map[sport.toLowerCase()] || '🎯'
}

function getTeamEmoji(abbr: string): string {
  // Simple team emoji mapping
  return '🏆'
}

function formatGameDate(isoString: string): string {
  const date = new Date(isoString)
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

function formatGameTime(isoString: string): string {
  const date = new Date(isoString)
  return date.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit', 
    timeZone: 'America/New_York'
  }) + ' ET'
}

export async function getGamesByDate(date: string, sport?: string): Promise<GameDetail[]> {
  await new Promise(resolve => setTimeout(resolve, 200))
  
  let games = Object.values(allGames)
  
  if (sport) {
    games = games.filter(g => g.sport.toLowerCase() === sport.toLowerCase())
  }
  
  // In production, filter by actual date
  return games
}

export async function getGamesBySport(sport: string): Promise<GameDetail[]> {
  await new Promise(resolve => setTimeout(resolve, 200))
  
  return Object.values(allGames).filter(g => 
    g.sport.toLowerCase() === sport.toLowerCase()
  )
}

export async function getTodaysGames(): Promise<GameDetail[]> {
  await new Promise(resolve => setTimeout(resolve, 200))
  return Object.values(allGames)
}

// Get hot games (high action)
export async function getHotGames(): Promise<GameDetail[]> {
  await new Promise(resolve => setTimeout(resolve, 200))
  return Object.values(allGames).filter(g => g.isHot)
}

// Get all game IDs for a sport (for generating static paths)
export function getAllGameIds(sport?: string): string[] {
  let games = Object.values(allGames)
  if (sport) {
    games = games.filter(g => g.sport.toLowerCase() === sport.toLowerCase())
  }
  return games.map(g => g.id)
}
