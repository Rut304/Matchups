'use client'

import { useState, useEffect } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { 
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Target,
  BarChart3,
  Calendar,
  Flame,
  Clock,
  Trophy,
  Activity,
  Zap,
  Brain,
  Users,
  DollarSign,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  CheckCircle,
  Percent,
  Timer,
  Star,
  Shield,
  Swords,
  LineChart,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  Info,
  ThermometerSun,
  Wind,
  CloudRain,
  Tv,
  MapPin,
  History,
  Eye,
  Share2,
  Bookmark,
  RefreshCw,
  Database
} from 'lucide-react'
import { getGameById, type GameDetail } from '@/lib/api/games'
import { BoxScore, LiveGameDashboard } from '@/components/game'
import { GameBettingSplits } from '@/components/betting/GameBettingSplits'
import { getTeamSchedule, getTeamId, type TeamGameResult } from '@/lib/api/team-schedule'
import { type SportKey } from '@/lib/api/espn'

// =============================================================================
// THE ULTIMATE GAME MATCHUP PAGE
// This is THE most important page for gamblers researching bets
// Everything a bettor needs to make an informed decision - ALL on one page
// 
// IMPORTANT: NO FAKE DATA - Only show real data from APIs
// If data isn't available, show appropriate placeholder state
// =============================================================================

interface TeamScheduleData {
  games: TeamGameResult[]
  loading: boolean
  error: string | null
}

// Real ESPN Summary Data Types
interface ESPNLeader {
  category: string
  abbreviation: string
  athlete: {
    id: string
    displayName: string
    shortName: string
    headshot: string | null
    position: string
    jersey: string
  }
  displayValue: string
  value: number
}

interface ESPNInjury {
  athlete: {
    id: string
    displayName: string
    shortName: string
    headshot: string | null
    position: string
  }
  status: string
  type: string
  details: {
    type: string
    location: string
    detail: string
    side: string
    returnDate?: string
  } | null
}

interface GameSummaryData {
  injuries: {
    homeTeam: ESPNInjury[]
    awayTeam: ESPNInjury[]
    impactSummary: {
      homeOutPlayers: number
      awayOutPlayers: number
    }
  }
  leaders: {
    homeTeam: {
      name: string
      abbreviation: string
      leaders: ESPNLeader[]
    }
    awayTeam: {
      name: string
      abbreviation: string
      leaders: ESPNLeader[]
    }
  }
  odds: {
    provider: { name: string }
    spread: number
    overUnder: number
    homeTeamOdds: {
      favorite: boolean
      moneyLine: number
      spreadOdds: number
      spreadRecord?: { summary: string }
    }
    awayTeamOdds: {
      favorite: boolean
      moneyLine: number
      spreadOdds: number
      spreadRecord?: { summary: string }
    }
  } | null
  predictor: {
    homeWinProbability: number
    awayWinProbability: number
  } | null
  atsRecords: {
    homeTeam: { ats: string; ou: string } | null
    awayTeam: { ats: string; ou: string } | null
  }
  lineMovement: {
    openingSpread: string | null
    currentSpread: string | null
    openingTotal: number | null
    currentTotal: number | null
    spreadMove: number | null
    totalMove: number | null
  }
  loading: boolean
  error: string | null
}

export default function GameDetailPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const gameId = params.id as string
  const sport = searchParams.get('sport') || 'NFL'
  
  const [game, setGame] = useState<GameDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    h2h: true,
    homeSchedule: true,
    awaySchedule: true,
    trends: true,
    props: true,
    edge: true,
    leaders: true,
    injuries: true
  })
  
  // Real team schedule data from ESPN
  const [homeSchedule, setHomeSchedule] = useState<TeamScheduleData>({ 
    games: [], loading: true, error: null 
  })
  const [awaySchedule, setAwaySchedule] = useState<TeamScheduleData>({ 
    games: [], loading: true, error: null 
  })
  
  // Real ESPN summary data (injuries, leaders, odds, predictor)
  const [gameSummary, setGameSummary] = useState<GameSummaryData>({
    injuries: { homeTeam: [], awayTeam: [], impactSummary: { homeOutPlayers: 0, awayOutPlayers: 0 } },
    leaders: { homeTeam: { name: '', abbreviation: '', leaders: [] }, awayTeam: { name: '', abbreviation: '', leaders: [] } },
    odds: null,
    predictor: null,
    atsRecords: { homeTeam: null, awayTeam: null },
    lineMovement: { openingSpread: null, currentSpread: null, openingTotal: null, currentTotal: null, spreadMove: null, totalMove: null },
    loading: true,
    error: null
  })
  
  // =============================================================================
  // THE EDGE - Betting Intelligence & AI Analysis
  // This is what makes Matchups DIFFERENT from every other site
  // =============================================================================
  interface IntelligenceData {
    edgeScore: number
    edgeLabel: string
    edgeColor: string
    topDataPoints: { point: string; value: string; impact: 'positive' | 'negative' | 'neutral' }[]
    quickTakes: {
      spread: string
      spreadConfidence: number
      total: string
      totalConfidence: number
      sharpestPick: string
    }
    clv?: { grade: string; description: string }
    sharpMoney?: { side: string; reverseLineMovement: boolean; strength: string }
    aiAnalysis?: {
      summary: string
      winProbability: { home: number; away: number }
      projectedScore: { home: number; away: number }
      spreadAnalysis: { pick: string; confidence: number; reasoning: string; keyFactors: string[] }
      totalAnalysis: { pick: string; confidence: number; reasoning: string }
      keyEdges: string[]
      majorRisks: string[]
      betGrades: { spread: string; total: string; ml: string }
    }
    loading: boolean
    error: string | null
  }
  
  const [intelligence, setIntelligence] = useState<IntelligenceData>({
    edgeScore: 0,
    edgeLabel: 'Analyzing...',
    edgeColor: 'gray',
    topDataPoints: [],
    quickTakes: { spread: '', spreadConfidence: 0, total: '', totalConfidence: 0, sharpestPick: '' },
    loading: true,
    error: null
  })
  
  // Multi-book odds from The Odds API
  interface BookOdds {
    bookmaker: string
    spread: number
    spreadOdds: number
    total: number
    overOdds: number
    underOdds: number
    homeML: number
    awayML: number
    lastUpdate: string
  }
  
  const [multiBookOdds, setMultiBookOdds] = useState<{
    books: BookOdds[]
    bestSpread: { book: string; line: number; odds: number }
    bestTotal: { book: string; over: number; overOdds: number; under: number; underOdds: number }
    bestHomeML: { book: string; odds: number }
    bestAwayML: { book: string; odds: number }
    loading: boolean
    error: string | null
  }>({
    books: [],
    bestSpread: { book: '', line: 0, odds: 0 },
    bestTotal: { book: '', over: 0, overOdds: 0, under: 0, underOdds: 0 },
    bestHomeML: { book: '', odds: 0 },
    bestAwayML: { book: '', odds: 0 },
    loading: true,
    error: null
  })
  
  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }))
  }

  useEffect(() => {
    const loadGame = async () => {
      const data = await getGameById(gameId, sport)
      setGame(data)
      setLoading(false)
    }
    loadGame()
  }, [gameId, sport])
  
  // Fetch real team schedules when game data is available
  useEffect(() => {
    if (!game) return
    
    const fetchSchedules = async () => {
      const sportKey = sport.toUpperCase() as SportKey
      
      // Fetch home team schedule
      const homeTeamId = getTeamId(sportKey, game.home.abbr)
      if (homeTeamId) {
        try {
          const schedule = await getTeamSchedule(sportKey, homeTeamId, 10)
          setHomeSchedule({
            games: schedule?.games || [],
            loading: false,
            error: schedule ? null : 'Could not load schedule'
          })
        } catch (err) {
          setHomeSchedule({ games: [], loading: false, error: 'Failed to load schedule' })
        }
      } else {
        setHomeSchedule({ games: [], loading: false, error: 'Team not found' })
      }
      
      // Fetch away team schedule  
      const awayTeamId = getTeamId(sportKey, game.away.abbr)
      if (awayTeamId) {
        try {
          const schedule = await getTeamSchedule(sportKey, awayTeamId, 10)
          setAwaySchedule({
            games: schedule?.games || [],
            loading: false,
            error: schedule ? null : 'Could not load schedule'
          })
        } catch (err) {
          setAwaySchedule({ games: [], loading: false, error: 'Failed to load schedule' })
        }
      } else {
        setAwaySchedule({ games: [], loading: false, error: 'Team not found' })
      }
    }
    
    fetchSchedules()
  }, [game, sport])

  // Fetch real ESPN summary data (injuries, leaders, odds, predictor)
  useEffect(() => {
    if (!gameId) return
    
    const fetchSummary = async () => {
      try {
        const response = await fetch(`/api/games/${gameId}/summary?sport=${sport}`)
        if (!response.ok) {
          throw new Error('Failed to fetch summary')
        }
        const data = await response.json()
        if (data.success) {
          setGameSummary({
            injuries: data.injuries || { homeTeam: [], awayTeam: [], impactSummary: { homeOutPlayers: 0, awayOutPlayers: 0 } },
            leaders: data.leaders || { homeTeam: { name: '', abbreviation: '', leaders: [] }, awayTeam: { name: '', abbreviation: '', leaders: [] } },
            odds: data.odds || null,
            predictor: data.predictor || null,
            atsRecords: data.atsRecords || { homeTeam: null, awayTeam: null },
            lineMovement: data.lineMovement || { openingSpread: null, currentSpread: null, openingTotal: null, currentTotal: null, spreadMove: null, totalMove: null },
            loading: false,
            error: null
          })
        } else {
          setGameSummary(prev => ({ ...prev, loading: false, error: data.error }))
        }
      } catch (err) {
        setGameSummary(prev => ({ ...prev, loading: false, error: 'Failed to load game summary' }))
      }
    }
    
    fetchSummary()
  }, [gameId, sport])

  // =============================================================================
  // FETCH BETTING INTELLIGENCE - The Edge Analysis
  // =============================================================================
  useEffect(() => {
    if (!game) return
    
    const fetchIntelligence = async () => {
      try {
        const params = new URLSearchParams({
          sport: sport.toUpperCase(),
          home: game.home.name,
          homeAbbr: game.home.abbr || game.home.name.substring(0, 3).toUpperCase(),
          away: game.away.name,
          awayAbbr: game.away.abbr || game.away.name.substring(0, 3).toUpperCase(),
          ai: 'true', // Request AI analysis
          live: 'false'
        })
        
        const response = await fetch(`/api/games/${gameId}/intelligence?${params}`)
        if (!response.ok) throw new Error('Failed to fetch intelligence')
        
        const data = await response.json()
        if (data.success) {
          setIntelligence({
            edgeScore: data.intelligence?.edgeScore?.overall || 0,
            edgeLabel: data.summary?.edgeLabel || 'Analyzing',
            edgeColor: data.summary?.edgeColor || 'gray',
            topDataPoints: data.summary?.topDataPoints || [],
            quickTakes: data.summary?.quickTakes || { spread: '', spreadConfidence: 0, total: '', totalConfidence: 0, sharpestPick: '' },
            clv: data.intelligence?.clv ? { grade: data.intelligence.clv.grade, description: data.intelligence.clv.description } : undefined,
            sharpMoney: data.intelligence?.publicSharpSplits?.spread ? {
              side: data.intelligence.publicSharpSplits.spread.sharpSide,
              reverseLineMovement: data.intelligence.publicSharpSplits.spread.reverseLineMovement,
              strength: data.intelligence.publicSharpSplits.spread.rlmStrength
            } : undefined,
            aiAnalysis: data.intelligence?.aiAnalysis || undefined,
            loading: false,
            error: null
          })
        } else {
          setIntelligence(prev => ({ ...prev, loading: false, error: data.error }))
        }
      } catch (err) {
        console.error('Intelligence fetch error:', err)
        setIntelligence(prev => ({ ...prev, loading: false, error: 'Failed to load intelligence' }))
      }
    }
    
    fetchIntelligence()
  }, [game, gameId, sport])

  // =============================================================================
  // FETCH MULTI-BOOK ODDS - Shop for Best Lines
  // =============================================================================
  useEffect(() => {
    if (!game) return
    
    const fetchMultiBookOdds = async () => {
      try {
        // Try Action Network first (FREE, no API key needed)
        const actionResponse = await fetch(`/api/action-odds?sport=${sport.toUpperCase()}`)
        
        if (actionResponse.ok) {
          const actionData = await actionResponse.json()
          if (actionData.success && actionData.odds?.length > 0) {
            // Improved matching: match by BOTH team names and date
            const gameDate = new Date(game.time || game.scheduledAt).toDateString()
            
            // Helper to extract team identifier (last word, e.g., "Rockets" from "Houston Rockets")
            const getTeamKey = (name: string) => name.toLowerCase().split(' ').pop() || ''
            
            const homeKey = getTeamKey(game.home.name)
            const awayKey = getTeamKey(game.away.name)
            
            const matchingGame = actionData.odds.find((g: { homeTeam: string; awayTeam: string; startTime: string }) => {
              const gHomeKey = getTeamKey(g.homeTeam || '')
              const gAwayKey = getTeamKey(g.awayTeam || '')
              const gDate = new Date(g.startTime).toDateString()
              
              // Must match BOTH teams (home to home, away to away) OR same date + one team
              const teamsMatch = (homeKey === gHomeKey && awayKey === gAwayKey) ||
                                 (homeKey.includes(gHomeKey) && awayKey.includes(gAwayKey)) ||
                                 (gHomeKey.includes(homeKey) && gAwayKey.includes(awayKey))
              const sameDate = gameDate === gDate
              const oneTeamMatch = homeKey === gHomeKey || awayKey === gAwayKey ||
                                   homeKey.includes(gHomeKey) || awayKey.includes(gAwayKey)
              
              return teamsMatch || (sameDate && oneTeamMatch)
            })
            
            if (matchingGame?.books?.length > 0) {
              const books: BookOdds[] = matchingGame.books.map((book: { bookId: string; bookName: string; spread?: { home: number; homeOdds: number }; total?: { line: number; overOdds: number; underOdds: number }; moneyline?: { homeOdds: number; awayOdds: number } }) => ({
                bookmaker: book.bookName,
                spread: book.spread?.home || 0,
                spreadOdds: book.spread?.homeOdds || -110,
                total: book.total?.line || 0,
                overOdds: book.total?.overOdds || -110,
                underOdds: book.total?.underOdds || -110,
                homeML: book.moneyline?.homeOdds || 0,
                awayML: book.moneyline?.awayOdds || 0,
                lastUpdate: matchingGame.startTime
              }))
              
              // Find best lines
              const bestSpread = books.reduce((best, b) => b.spreadOdds > best.odds ? { book: b.bookmaker, line: b.spread, odds: b.spreadOdds } : best, { book: '', line: 0, odds: -999 })
              const bestHomeML = books.reduce((best, b) => b.homeML > best.odds ? { book: b.bookmaker, odds: b.homeML } : best, { book: '', odds: -999 })
              const bestAwayML = books.reduce((best, b) => b.awayML > best.odds ? { book: b.bookmaker, odds: b.awayML } : best, { book: '', odds: -999 })
              
              setMultiBookOdds({
                books: books.slice(0, 8),
                bestSpread,
                bestTotal: { book: books[0]?.bookmaker || '', over: books[0]?.total || 0, overOdds: books[0]?.overOdds || -110, under: books[0]?.total || 0, underOdds: books[0]?.underOdds || -110 },
                bestHomeML,
                bestAwayML,
                loading: false,
                error: null
              })
              return // Success! Exit early
            }
          }
        }
        
        // Fallback to The Odds API if Action Network didn't work
        const sportMap: Record<string, string> = {
          'NFL': 'americanfootball_nfl',
          'NBA': 'basketball_nba',
          'NHL': 'icehockey_nhl',
          'MLB': 'baseball_mlb',
          'NCAAF': 'americanfootball_ncaaf',
          'NCAAB': 'basketball_ncaab'
        }
        const oddsSport = sportMap[sport.toUpperCase()] || 'americanfootball_nfl'
        
        const response = await fetch(`/api/odds?sport=${oddsSport}&markets=spreads,totals,h2h`)
        if (!response.ok) throw new Error('Failed to fetch odds')
        
        const data = await response.json()
        if (data.success && data.odds) {
          // Find the matching game
          const matchingGame = data.odds.find((g: { home_team: string; away_team: string }) => 
            g.home_team?.toLowerCase().includes(game.home.name.toLowerCase().split(' ').pop() || '') ||
            g.away_team?.toLowerCase().includes(game.away.name.toLowerCase().split(' ').pop() || '')
          )
          
          if (matchingGame?.bookmakers) {
            const books: BookOdds[] = matchingGame.bookmakers.map((bm: { key: string; last_update: string; markets: Array<{ key: string; outcomes: Array<{ name: string; point?: number; price: number }> }> }) => {
              const spread = bm.markets.find((m: { key: string }) => m.key === 'spreads')
              const total = bm.markets.find((m: { key: string }) => m.key === 'totals')
              const ml = bm.markets.find((m: { key: string }) => m.key === 'h2h')
              
              const homeSpread = spread?.outcomes.find((o: { name: string }) => o.name === matchingGame.home_team)
              const awaySpread = spread?.outcomes.find((o: { name: string }) => o.name === matchingGame.away_team)
              const over = total?.outcomes.find((o: { name: string }) => o.name === 'Over')
              const under = total?.outcomes.find((o: { name: string }) => o.name === 'Under')
              const homeML = ml?.outcomes.find((o: { name: string }) => o.name === matchingGame.home_team)
              const awayML = ml?.outcomes.find((o: { name: string }) => o.name === matchingGame.away_team)
              
              return {
                bookmaker: bm.key,
                spread: homeSpread?.point || 0,
                spreadOdds: homeSpread?.price || -110,
                total: over?.point || 0,
                overOdds: over?.price || -110,
                underOdds: under?.price || -110,
                homeML: homeML?.price || 0,
                awayML: awayML?.price || 0,
                lastUpdate: bm.last_update
              }
            })
            
            // Find best lines
            const bestSpread = books.reduce((best, b) => b.spreadOdds > best.odds ? { book: b.bookmaker, line: b.spread, odds: b.spreadOdds } : best, { book: '', line: 0, odds: -999 })
            const bestHomeML = books.reduce((best, b) => b.homeML > best.odds ? { book: b.bookmaker, odds: b.homeML } : best, { book: '', odds: -999 })
            const bestAwayML = books.reduce((best, b) => b.awayML > best.odds ? { book: b.bookmaker, odds: b.awayML } : best, { book: '', odds: -999 })
            
            setMultiBookOdds({
              books: books.slice(0, 8),
              bestSpread,
              bestTotal: { book: books[0]?.bookmaker || '', over: books[0]?.total || 0, overOdds: books[0]?.overOdds || -110, under: books[0]?.total || 0, underOdds: books[0]?.underOdds || -110 },
              bestHomeML,
              bestAwayML,
              loading: false,
              error: null
            })
          } else {
            setMultiBookOdds(prev => ({ ...prev, loading: false, error: 'Game not found in odds data' }))
          }
        }
      } catch (err) {
        console.error('Multi-book odds error:', err)
        setMultiBookOdds(prev => ({ ...prev, loading: false, error: 'Odds comparison unavailable' }))
      }
    }
    
    fetchMultiBookOdds()
  }, [game, sport])

  if (loading) {
    return (
      <main className="min-h-screen bg-[#06060c]">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-pulse text-center">
              <RefreshCw className="w-12 h-12 mx-auto mb-4 text-orange-500 animate-spin" />
              <p className="text-slate-500">Loading matchup data...</p>
            </div>
          </div>
        </div>
      </main>
    )
  }

  if (!game) {
    return (
      <main className="min-h-screen bg-[#06060c]">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6 text-slate-500 hover:text-white">
            <ArrowLeft className="w-4 h-4" />
            Back to Games
          </Link>
          <div className="text-center py-12">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto" />
            <h1 className="text-2xl font-bold mt-4 text-white">Game Not Found</h1>
            <p className="mt-2 text-slate-500">This matchup may have ended or doesn&apos;t exist.</p>
          </div>
        </div>
      </main>
    )
  }

  // Helper function to render a team's schedule table
  const renderScheduleTable = (
    scheduleData: TeamScheduleData,
    teamEmoji: string,
    teamName: string,
    sectionKey: string
  ) => (
    <div className="rounded-2xl p-6 bg-slate-900/50 border border-slate-800">
      <button 
        onClick={() => toggleSection(sectionKey)}
        className="flex items-center justify-between w-full text-left"
      >
        <h3 className="flex items-center gap-2 text-lg font-bold text-white">
          <span className="text-2xl">{teamEmoji}</span>
          {teamName} - Last 10 Games
        </h3>
        {expandedSections[sectionKey] ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
      </button>
      
      {expandedSections[sectionKey] && (
        <div className="mt-4">
          {scheduleData.loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="w-6 h-6 text-orange-500 animate-spin mr-2" />
              <span className="text-slate-400">Loading real schedule data from ESPN...</span>
            </div>
          ) : scheduleData.error ? (
            <div className="text-center py-6">
              <Database className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="text-slate-500">{scheduleData.error}</p>
              <p className="text-xs text-slate-600 mt-1">Historical game data not available</p>
            </div>
          ) : scheduleData.games.length === 0 ? (
            <div className="text-center py-6">
              <Database className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="text-slate-500">No recent games found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left py-2 text-slate-500 font-medium">Wk</th>
                    <th className="text-left py-2 text-slate-500 font-medium">Opponent</th>
                    <th className="text-center py-2 text-slate-500 font-medium">Result</th>
                    <th className="text-center py-2 text-slate-500 font-medium">Score</th>
                    <th className="text-center py-2 text-slate-500 font-medium">Spread</th>
                    <th className="text-center py-2 text-slate-500 font-medium">ATS</th>
                    <th className="text-center py-2 text-slate-500 font-medium">Total</th>
                    <th className="text-center py-2 text-slate-500 font-medium">O/U</th>
                  </tr>
                </thead>
                <tbody>
                  {scheduleData.games.map((g, i) => (
                    <tr key={g.id || i} className="border-b border-slate-800 hover:bg-slate-800/30">
                      <td className="py-2 text-slate-400">{g.week}</td>
                      <td className="py-2 text-white font-medium">{g.opponent}</td>
                      <td className="py-2 text-center">
                        {g.isCompleted && g.result ? (
                          <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                            g.result === 'W' ? 'bg-green-500/20 text-green-400' : 
                            g.result === 'L' ? 'bg-red-500/20 text-red-400' :
                            'bg-slate-700 text-slate-400'
                          }`}>
                            {g.result}
                          </span>
                        ) : (
                          <span className="text-slate-600">-</span>
                        )}
                      </td>
                      <td className="py-2 text-center text-slate-300 font-mono">
                        {g.isCompleted ? g.score : 'TBD'}
                      </td>
                      <td className="py-2 text-center text-slate-300 font-mono">
                        {g.spread || <span className="text-slate-600">-</span>}
                      </td>
                      <td className="py-2 text-center">
                        {g.atsResult ? (
                          <span className={`font-bold ${
                            g.atsResult === 'W' ? 'text-green-400' : 
                            g.atsResult === 'L' ? 'text-red-400' :
                            'text-slate-400'
                          }`}>{g.atsResult}</span>
                        ) : (
                          <span className="text-slate-600">-</span>
                        )}
                      </td>
                      <td className="py-2 text-center text-slate-300 font-mono">
                        {g.total || <span className="text-slate-600">-</span>}
                      </td>
                      <td className="py-2 text-center">
                        {g.ouResult ? (
                          <span className={`font-bold ${
                            g.ouResult === 'O' ? 'text-green-400' : 
                            g.ouResult === 'U' ? 'text-blue-400' :
                            'text-slate-400'
                          }`}>{g.ouResult}</span>
                        ) : (
                          <span className="text-slate-600">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {/* Data source attribution */}
              <p className="text-xs text-slate-600 mt-3 flex items-center gap-1">
                <Database className="w-3 h-3" />
                Game data from ESPN. ATS/O-U data requires betting integration.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )

  return (
    <main className="min-h-screen bg-[#06060c]">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Back Navigation */}
        <div className="flex items-center justify-between mb-6">
          <Link href={`/${game.sport.toLowerCase()}`} 
                className="inline-flex items-center gap-2 text-slate-500 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to {game.sport} Games
          </Link>
          <div className="flex items-center gap-3">
            <button 
              title="Share this matchup"
              className="p-2 rounded-lg bg-slate-800/50 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
            >
              <Share2 className="w-5 h-5" />
            </button>
            <button 
              title="Bookmark this game"
              className="p-2 rounded-lg bg-slate-800/50 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
            >
              <Bookmark className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* =========================================== */}
        {/* HERO SECTION - Game Header */}
        {/* =========================================== */}
        <div className="rounded-2xl p-6 mb-6 bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800">
          {/* Game Info Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{game.sportIcon}</span>
              <div>
                <p className="text-sm font-bold text-slate-400">{game.league}</p>
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Calendar className="w-4 h-4 text-orange-500" />
                  <span>{game.date}</span>
                  <span>•</span>
                  <Clock className="w-4 h-4" />
                  <span>{game.time}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {game.weather && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/50 text-sm">
                  <ThermometerSun className="w-4 h-4 text-yellow-500" />
                  <span className="text-slate-300">{game.weather.temp}°F</span>
                  <Wind className="w-4 h-4 text-blue-400 ml-2" />
                  <span className="text-slate-300">{game.weather.wind} mph</span>
                </div>
              )}
              {game.isHot && (
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-orange-500/20 text-orange-400">
                  <Flame className="w-4 h-4" /> HIGH ACTION
                </span>
              )}
            </div>
          </div>

          {/* Teams Matchup */}
          <div className="grid grid-cols-7 gap-4 items-center">
            {/* Away Team */}
            <div className="col-span-2 text-center">
              <div className="text-5xl mb-3">{game.away.emoji}</div>
              <h2 className="text-lg text-slate-400">{game.away.city}</h2>
              <p className="text-2xl font-black text-white">{game.away.name}</p>
              <p className="text-lg font-semibold text-slate-400 mt-1">{game.away.record}</p>
              <div className="flex items-center justify-center gap-4 mt-2 text-sm">
                <span className="text-slate-500">ATS: <span className="text-green-400 font-semibold">{game.away.ats}</span></span>
                {game.away.ou && <span className="text-slate-500">O/U: <span className="text-blue-400 font-semibold">{game.away.ou}</span></span>}
              </div>
            </div>

            {/* Betting Lines - Center */}
            <div className="col-span-3 text-center space-y-3">
              <div className="text-xl font-bold text-slate-600 mb-2">VS</div>
              
              {/* Spread - Use gameSummary.odds if available (real ESPN data) */}
              <div className="rounded-xl p-4 bg-gradient-to-r from-orange-500/10 to-orange-600/5 border border-orange-500/20">
                <p className="text-xs text-slate-500 mb-1">SPREAD</p>
                <p className="text-2xl font-black font-mono text-orange-400">
                  {gameSummary.odds ? (
                    <>
                      {gameSummary.odds.homeTeamOdds?.favorite ? game.home.abbr : game.away.abbr}{' '}
                      {gameSummary.odds.homeTeamOdds?.favorite ? '-' : '+'}{Math.abs(gameSummary.odds.spread).toFixed(1)}
                    </>
                  ) : game.spread.line !== 0 ? (
                    <>{game.spread.favorite} {game.spread.line > 0 ? '+' : ''}{game.spread.line}</>
                  ) : (
                    'TBD'
                  )}
                </p>
              </div>
              
              {/* Total - Use gameSummary.odds if available */}
              <div className="rounded-xl p-4 bg-gradient-to-r from-green-500/10 to-green-600/5 border border-green-500/20">
                <p className="text-xs text-slate-500 mb-1">TOTAL</p>
                <p className="text-2xl font-black font-mono text-green-400">
                  O/U {gameSummary.odds?.overUnder || game.total || 'TBD'}
                </p>
              </div>
              
              {/* Moneyline - Use gameSummary.odds if available */}
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-lg p-2 bg-slate-800/50 border border-slate-700">
                  <p className="text-xs text-slate-500">{game.away.abbr || 'AWAY'}</p>
                  <p className={`text-lg font-bold font-mono ${
                    (gameSummary.odds?.awayTeamOdds?.moneyLine || game.moneyline.away) > 0 ? 'text-green-400' : 'text-white'
                  }`}>
                    {gameSummary.odds?.awayTeamOdds?.moneyLine ? (
                      <>{gameSummary.odds.awayTeamOdds.moneyLine > 0 ? '+' : ''}{gameSummary.odds.awayTeamOdds.moneyLine}</>
                    ) : game.moneyline.away !== 0 ? (
                      <>{game.moneyline.away > 0 ? '+' : ''}{game.moneyline.away}</>
                    ) : 'TBD'}
                  </p>
                </div>
                <div className="rounded-lg p-2 bg-slate-800/50 border border-slate-700">
                  <p className="text-xs text-slate-500">{game.home.abbr || 'HOME'}</p>
                  <p className={`text-lg font-bold font-mono ${
                    (gameSummary.odds?.homeTeamOdds?.moneyLine || game.moneyline.home) > 0 ? 'text-green-400' : 'text-white'
                  }`}>
                    {gameSummary.odds?.homeTeamOdds?.moneyLine ? (
                      <>{gameSummary.odds.homeTeamOdds.moneyLine > 0 ? '+' : ''}{gameSummary.odds.homeTeamOdds.moneyLine}</>
                    ) : game.moneyline.home !== 0 ? (
                      <>{game.moneyline.home > 0 ? '+' : ''}{game.moneyline.home}</>
                    ) : 'TBD'}
                  </p>
                </div>
              </div>
            </div>

            {/* Home Team */}
            <div className="col-span-2 text-center">
              <div className="text-5xl mb-3">{game.home.emoji}</div>
              <h2 className="text-lg text-slate-400">{game.home.city}</h2>
              <p className="text-2xl font-black text-white">{game.home.name}</p>
              <p className="text-lg font-semibold text-slate-400 mt-1">{game.home.record}</p>
              <div className="flex items-center justify-center gap-4 mt-2 text-sm">
                <span className="text-slate-500">ATS: <span className="text-green-400 font-semibold">{game.home.ats}</span></span>
                {game.home.ou && <span className="text-slate-500">O/U: <span className="text-blue-400 font-semibold">{game.home.ou}</span></span>}
              </div>
            </div>
          </div>

          {/* AI Prediction Bar - OUR proprietary analysis (powered by Gemini) */}
          {/* This is THE competitive edge - unique AI insights, not ESPN's predictor */}
          <div className="mt-6 pt-4 border-t border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-orange-500" />
                <span className="font-semibold text-white">AI Prediction</span>
                <span className="px-2 py-0.5 text-xs rounded bg-orange-500/20 text-orange-400">Matchups Edge</span>
              </div>
              <span className="font-bold text-orange-400">
                {intelligence.aiAnalysis?.spreadAnalysis?.pick || game.aiPick || 'Analyzing...'}
              </span>
            </div>
            {/* Confidence Bar - Shows our AI's confidence in the pick */}
            <div className="h-4 rounded-full overflow-hidden bg-slate-800">
              <div 
                className="h-full rounded-full transition-all"
                style={{ 
                  width: `${(intelligence.aiAnalysis?.spreadAnalysis?.confidence || game.aiConfidence / 100 || 0.5) * 100}%`,
                  background: ((intelligence.aiAnalysis?.spreadAnalysis?.confidence || game.aiConfidence / 100 || 0.5) * 100) >= 70 
                    ? 'linear-gradient(90deg, #22c55e, #4ade80)' 
                    : ((intelligence.aiAnalysis?.spreadAnalysis?.confidence || game.aiConfidence / 100 || 0.5) * 100) >= 55 
                    ? 'linear-gradient(90deg, #f97316, #fb923c)' 
                    : 'linear-gradient(90deg, #ef4444, #f87171)'
                }}
              />
            </div>
            <div className="flex justify-between text-sm mt-1 text-slate-500">
              <span>{Math.round((intelligence.aiAnalysis?.spreadAnalysis?.confidence || game.aiConfidence / 100 || 0.5) * 100)}% confidence</span>
              <span className="text-xs text-slate-600">Powered by AI analysis of trends, injuries, weather & more</span>
            </div>
          </div>
        </div>

        {/* =========================================== */}
        {/* THE EDGE - AI Intelligence Dashboard */}
        {/* This is what makes Matchups DIFFERENT */}
        {/* =========================================== */}
        <div className="rounded-2xl p-6 mb-6 bg-gradient-to-br from-orange-950/30 to-slate-900 border border-orange-500/30">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-500/20">
                <Zap className="w-6 h-6 text-orange-500" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  THE EDGE
                  <span className="px-2 py-0.5 text-xs rounded bg-orange-500/20 text-orange-400 font-normal">AI-Powered</span>
                </h2>
                <p className="text-sm text-slate-400">Proprietary analysis combining 12 key data points</p>
              </div>
            </div>
            {/* Edge Score */}
            <div className="text-right">
              {intelligence.loading ? (
                <div className="animate-pulse">
                  <div className="w-16 h-8 bg-slate-700 rounded mb-1"></div>
                  <div className="w-20 h-4 bg-slate-700 rounded"></div>
                </div>
              ) : (
                <>
                  <div className={`text-3xl font-black ${
                    intelligence.edgeScore >= 75 ? 'text-green-400' :
                    intelligence.edgeScore >= 50 ? 'text-yellow-400' :
                    intelligence.edgeScore >= 25 ? 'text-orange-400' :
                    'text-slate-400'
                  }`}>
                    {intelligence.edgeScore}
                  </div>
                  <div className={`text-sm font-semibold ${
                    intelligence.edgeColor === 'green' ? 'text-green-400' :
                    intelligence.edgeColor === 'yellow' ? 'text-yellow-400' :
                    intelligence.edgeColor === 'orange' ? 'text-orange-400' :
                    'text-slate-400'
                  }`}>
                    {intelligence.edgeLabel}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Quick Takes */}
          {intelligence.quickTakes.sharpestPick && (
            <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700 mb-4">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-4 h-4 text-green-400" />
                <span className="text-sm font-semibold text-green-400">SHARPEST PICK</span>
              </div>
              <p className="text-lg font-bold text-white">{intelligence.quickTakes.sharpestPick}</p>
            </div>
          )}

          {/* AI Analysis Summary */}
          {intelligence.aiAnalysis && (
            <div className="space-y-4">
              {/* Summary */}
              <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/50">
                <p className="text-slate-300 leading-relaxed">{intelligence.aiAnalysis.summary}</p>
              </div>
              
              {/* Win Probability & Projected Score */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-800/50">
                  <p className="text-xs text-slate-500 mb-2">WIN PROBABILITY</p>
                  <div className="flex items-center justify-between">
                    <div className="text-center">
                      <p className="text-sm text-slate-400">{game.away.abbr}</p>
                      <p className="text-xl font-bold text-white">{Math.round(intelligence.aiAnalysis.winProbability.away * 100)}%</p>
                    </div>
                    <div className="text-slate-600">vs</div>
                    <div className="text-center">
                      <p className="text-sm text-slate-400">{game.home.abbr}</p>
                      <p className="text-xl font-bold text-white">{Math.round(intelligence.aiAnalysis.winProbability.home * 100)}%</p>
                    </div>
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-slate-800/50">
                  <p className="text-xs text-slate-500 mb-2">PROJECTED SCORE</p>
                  <div className="flex items-center justify-between">
                    <div className="text-center">
                      <p className="text-sm text-slate-400">{game.away.abbr}</p>
                      <p className="text-xl font-bold text-orange-400">{intelligence.aiAnalysis.projectedScore.away}</p>
                    </div>
                    <div className="text-slate-600">-</div>
                    <div className="text-center">
                      <p className="text-sm text-slate-400">{game.home.abbr}</p>
                      <p className="text-xl font-bold text-orange-400">{intelligence.aiAnalysis.projectedScore.home}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bet Picks with Grades */}
              <div className="grid md:grid-cols-3 gap-4">
                {/* Spread Pick */}
                <div className="p-4 rounded-xl bg-gradient-to-br from-orange-500/10 to-transparent border border-orange-500/20">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-slate-500">SPREAD</p>
                    <span className={`px-2 py-0.5 text-xs font-bold rounded ${
                      intelligence.aiAnalysis.betGrades?.spread === 'A' ? 'bg-green-500/20 text-green-400' :
                      intelligence.aiAnalysis.betGrades?.spread === 'B' ? 'bg-blue-500/20 text-blue-400' :
                      intelligence.aiAnalysis.betGrades?.spread === 'C' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-red-500/20 text-red-400'
                    }`}>
                      Grade {intelligence.aiAnalysis.betGrades?.spread || 'C'}
                    </span>
                  </div>
                  <p className="text-lg font-bold text-white mb-1">{intelligence.aiAnalysis.spreadAnalysis.pick}</p>
                  <p className="text-xs text-slate-400">{Math.round(intelligence.aiAnalysis.spreadAnalysis.confidence * 100)}% confident</p>
                </div>

                {/* Total Pick */}
                <div className="p-4 rounded-xl bg-gradient-to-br from-green-500/10 to-transparent border border-green-500/20">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-slate-500">TOTAL</p>
                    <span className={`px-2 py-0.5 text-xs font-bold rounded ${
                      intelligence.aiAnalysis.betGrades?.total === 'A' ? 'bg-green-500/20 text-green-400' :
                      intelligence.aiAnalysis.betGrades?.total === 'B' ? 'bg-blue-500/20 text-blue-400' :
                      intelligence.aiAnalysis.betGrades?.total === 'C' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-red-500/20 text-red-400'
                    }`}>
                      Grade {intelligence.aiAnalysis.betGrades?.total || 'C'}
                    </span>
                  </div>
                  <p className="text-lg font-bold text-white mb-1">{intelligence.aiAnalysis.totalAnalysis.pick}</p>
                  <p className="text-xs text-slate-400">{Math.round(intelligence.aiAnalysis.totalAnalysis.confidence * 100)}% confident</p>
                </div>

                {/* ML Pick */}
                <div className="p-4 rounded-xl bg-gradient-to-br from-purple-500/10 to-transparent border border-purple-500/20">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-slate-500">MONEYLINE</p>
                    <span className={`px-2 py-0.5 text-xs font-bold rounded ${
                      intelligence.aiAnalysis.betGrades?.ml === 'A' ? 'bg-green-500/20 text-green-400' :
                      intelligence.aiAnalysis.betGrades?.ml === 'B' ? 'bg-blue-500/20 text-blue-400' :
                      intelligence.aiAnalysis.betGrades?.ml === 'C' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-red-500/20 text-red-400'
                    }`}>
                      Grade {intelligence.aiAnalysis.betGrades?.ml || 'C'}
                    </span>
                  </div>
                  <p className="text-lg font-bold text-white mb-1">{game.away.abbr} or {game.home.abbr}</p>
                  <p className="text-xs text-slate-400">Based on value analysis</p>
                </div>
              </div>

              {/* Key Edges & Risks */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-green-500/5 border border-green-500/20">
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <p className="text-sm font-semibold text-green-400">KEY EDGES</p>
                  </div>
                  <ul className="space-y-2">
                    {intelligence.aiAnalysis.keyEdges?.slice(0, 3).map((edge, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                        <span className="text-green-400 mt-0.5">•</span>
                        {edge}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/20">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle className="w-4 h-4 text-red-400" />
                    <p className="text-sm font-semibold text-red-400">RISKS TO CONSIDER</p>
                  </div>
                  <ul className="space-y-2">
                    {intelligence.aiAnalysis.majorRisks?.slice(0, 3).map((risk, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                        <span className="text-red-400 mt-0.5">•</span>
                        {risk}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Top Data Points - Show when no AI analysis */}
          {!intelligence.aiAnalysis && intelligence.topDataPoints.length > 0 && (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
              {intelligence.topDataPoints.map((dp, i) => (
                <div key={i} className={`p-3 rounded-lg border ${
                  dp.impact === 'positive' ? 'bg-green-500/5 border-green-500/20' :
                  dp.impact === 'negative' ? 'bg-red-500/5 border-red-500/20' :
                  'bg-slate-800/50 border-slate-700'
                }`}>
                  <p className={`text-xs font-semibold mb-1 ${
                    dp.impact === 'positive' ? 'text-green-400' :
                    dp.impact === 'negative' ? 'text-red-400' :
                    'text-slate-400'
                  }`}>
                    {dp.point}
                  </p>
                  <p className="text-sm text-white">{dp.value}</p>
                </div>
              ))}
            </div>
          )}

          {/* Sharp Money Indicator */}
          {intelligence.sharpMoney?.reverseLineMovement && (
            <div className="mt-4 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-yellow-400" />
                <span className="text-sm font-semibold text-yellow-400">REVERSE LINE MOVEMENT DETECTED</span>
              </div>
              <p className="text-sm text-slate-300 mt-1">
                Sharp money on <span className="font-semibold text-white">{intelligence.sharpMoney.side}</span> • 
                Strength: <span className="font-semibold text-yellow-400">{intelligence.sharpMoney.strength}</span>
              </p>
            </div>
          )}

          {/* Loading State */}
          {intelligence.loading && (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="w-6 h-6 text-orange-500 animate-spin mr-3" />
              <span className="text-slate-400">Analyzing 12 key data points...</span>
            </div>
          )}
        </div>

        {/* =========================================== */}
        {/* MULTI-BOOK ODDS COMPARISON */}
        {/* =========================================== */}
        {!multiBookOdds.loading && multiBookOdds.books.length > 0 && (
          <div className="rounded-2xl p-6 mb-6 bg-slate-900/50 border border-slate-800">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-green-500/20">
                <DollarSign className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Shop the Best Lines</h2>
                <p className="text-sm text-slate-400">Compare odds across {multiBookOdds.books.length} sportsbooks</p>
              </div>
            </div>

            {/* Best Lines Highlights */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                <p className="text-xs text-slate-500">Best {game.home.abbr} Spread</p>
                <p className="text-lg font-bold text-green-400">{multiBookOdds.bestSpread.odds > 0 ? '+' : ''}{multiBookOdds.bestSpread.odds}</p>
                <p className="text-xs text-slate-400">{multiBookOdds.bestSpread.book}</p>
              </div>
              <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <p className="text-xs text-slate-500">Best {game.home.abbr} ML</p>
                <p className="text-lg font-bold text-blue-400">{multiBookOdds.bestHomeML.odds > 0 ? '+' : ''}{multiBookOdds.bestHomeML.odds}</p>
                <p className="text-xs text-slate-400">{multiBookOdds.bestHomeML.book}</p>
              </div>
              <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
                <p className="text-xs text-slate-500">Best {game.away.abbr} ML</p>
                <p className="text-lg font-bold text-orange-400">{multiBookOdds.bestAwayML.odds > 0 ? '+' : ''}{multiBookOdds.bestAwayML.odds}</p>
                <p className="text-xs text-slate-400">{multiBookOdds.bestAwayML.book}</p>
              </div>
              <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
                <p className="text-xs text-slate-500">Books Compared</p>
                <p className="text-lg font-bold text-purple-400">{multiBookOdds.books.length}</p>
                <p className="text-xs text-slate-400">Sportsbooks</p>
              </div>
            </div>

            {/* Odds Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-slate-500 border-b border-slate-800">
                    <th className="text-left py-2 px-3">Book</th>
                    <th className="text-center py-2 px-3">Spread</th>
                    <th className="text-center py-2 px-3">Total</th>
                    <th className="text-center py-2 px-3">{game.away.abbr} ML</th>
                    <th className="text-center py-2 px-3">{game.home.abbr} ML</th>
                  </tr>
                </thead>
                <tbody>
                  {multiBookOdds.books.slice(0, 6).map((book, i) => (
                    <tr key={i} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                      <td className="py-2 px-3 font-medium text-white capitalize">{book.bookmaker.replace(/_/g, ' ')}</td>
                      <td className="py-2 px-3 text-center">
                        <span className="text-white font-mono">{book.spread > 0 ? '+' : ''}{book.spread}</span>
                        <span className="text-slate-500 ml-1">({book.spreadOdds > 0 ? '+' : ''}{book.spreadOdds})</span>
                      </td>
                      <td className="py-2 px-3 text-center">
                        <span className="text-white font-mono">{book.total}</span>
                        <span className="text-slate-500 ml-1">(o{book.overOdds}/u{book.underOdds})</span>
                      </td>
                      <td className={`py-2 px-3 text-center font-mono ${book.awayML > 0 ? 'text-green-400' : 'text-white'}`}>
                        {book.awayML > 0 ? '+' : ''}{book.awayML}
                      </td>
                      <td className={`py-2 px-3 text-center font-mono ${book.homeML > 0 ? 'text-green-400' : 'text-white'}`}>
                        {book.homeML > 0 ? '+' : ''}{book.homeML}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-slate-600 mt-3 flex items-center gap-1">
              <Database className="w-3 h-3" />
              Odds data from The Odds API • Updated in real-time
            </p>
          </div>
        )}

        {/* =========================================== */}
        {/* PUBLIC BETTING SPLITS - Action Network Data */}
        {/* Critical for identifying sharp vs public money */}
        {/* =========================================== */}
        <GameBettingSplits
          gameId={gameId}
          sport={sport}
          homeTeam={game.home.name}
          awayTeam={game.away.name}
          homeAbbr={game.home.abbr}
          awayAbbr={game.away.abbr}
          compact={false}
          showTitle={true}
        />

        {/* =========================================== */}
        {/* MAIN CONTENT - Two Column Layout */}
        {/* =========================================== */}
        <div className="grid lg:grid-cols-3 gap-6">
          
          {/* LEFT COLUMN - Main Content (2/3 width) */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* =========================================== */}
            {/* KEY BETTING METRICS */}
            {/* =========================================== */}
            <div className="rounded-2xl p-6 bg-slate-900/50 border border-slate-800">
              <h3 className="flex items-center gap-2 text-lg font-bold text-white mb-4">
                <DollarSign className="w-5 h-5 text-green-500" />
                Key Betting Metrics
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="rounded-xl p-4 bg-slate-800/50 text-center">
                  <p className="text-xs text-slate-500 mb-1">Line Movement</p>
                  <p className="text-2xl font-bold text-white">{game.metrics.lineMovement.split('→')[0].trim()}</p>
                  <div className="flex items-center justify-center gap-1 mt-1">
                    {game.metrics.lineDirection === 'up' ? (
                      <ArrowUpRight className="w-4 h-4 text-red-400" />
                    ) : game.metrics.lineDirection === 'down' ? (
                      <ArrowDownRight className="w-4 h-4 text-green-400" />
                    ) : (
                      <span className="text-slate-500">—</span>
                    )}
                    <span className={`text-sm font-semibold ${
                      game.metrics.lineDirection === 'up' ? 'text-red-400' : 
                      game.metrics.lineDirection === 'down' ? 'text-green-400' : 'text-slate-400'
                    }`}>
                      {game.metrics.lineMovement.split('→')[1]?.trim() || 'No Movement'}
                    </span>
                  </div>
                </div>
                
                <div className="rounded-xl p-4 bg-slate-800/50 text-center">
                  <p className="text-xs text-slate-500 mb-1">Public %</p>
                  <p className="text-2xl font-bold text-white">{game.metrics.publicPct}%</p>
                  <p className="text-sm text-slate-400 mt-1">{game.metrics.publicSide}</p>
                </div>
                
                <div className="rounded-xl p-4 bg-slate-800/50 text-center">
                  <p className="text-xs text-slate-500 mb-1">Sharp Action</p>
                  <p className="text-2xl font-bold text-white">{game.metrics.sharpMoney}</p>
                  <div className="flex items-center justify-center gap-1 mt-1">
                    {game.metrics.sharpTrend === 'up' ? (
                      <TrendingUp className="w-4 h-4 text-green-400" />
                    ) : game.metrics.sharpTrend === 'down' ? (
                      <TrendingDown className="w-4 h-4 text-red-400" />
                    ) : null}
                  </div>
                </div>
                
                <div className="rounded-xl p-4 bg-slate-800/50 text-center">
                  <p className="text-xs text-slate-500 mb-1">Handle %</p>
                  <p className="text-2xl font-bold text-white">{game.metrics.handlePct}%</p>
                  <p className="text-sm text-slate-400 mt-1">{game.metrics.handleSide}</p>
                </div>
              </div>
            </div>

            {/* =========================================== */}
            {/* TEAM RANKINGS COMPARISON */}
            {/* =========================================== */}
            <div className="rounded-2xl p-6 bg-slate-900/50 border border-slate-800">
              <h3 className="flex items-center gap-2 text-lg font-bold text-white mb-4">
                <BarChart3 className="w-5 h-5 text-blue-500" />
                Team Rankings Comparison
              </h3>
              <div className="grid md:grid-cols-2 gap-6">
                {/* Offense Rankings */}
                <div>
                  <h4 className="text-sm font-semibold text-slate-400 mb-3 flex items-center gap-2">
                    <Swords className="w-4 h-4 text-orange-500" /> OFFENSE
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/30">
                      <span className="text-slate-400">{game.away.abbr}</span>
                      <span className={`font-bold ${game.matchup.awayOffRank <= 10 ? 'text-green-400' : game.matchup.awayOffRank <= 20 ? 'text-yellow-400' : 'text-red-400'}`}>
                        #{game.matchup.awayOffRank}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/30">
                      <span className="text-slate-400">{game.home.abbr}</span>
                      <span className={`font-bold ${game.matchup.homeOffRank <= 10 ? 'text-green-400' : game.matchup.homeOffRank <= 20 ? 'text-yellow-400' : 'text-red-400'}`}>
                        #{game.matchup.homeOffRank}
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Defense Rankings */}
                <div>
                  <h4 className="text-sm font-semibold text-slate-400 mb-3 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-blue-500" /> DEFENSE
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/30">
                      <span className="text-slate-400">{game.away.abbr}</span>
                      <span className={`font-bold ${game.matchup.awayDefRank <= 10 ? 'text-green-400' : game.matchup.awayDefRank <= 20 ? 'text-yellow-400' : 'text-red-400'}`}>
                        #{game.matchup.awayDefRank}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/30">
                      <span className="text-slate-400">{game.home.abbr}</span>
                      <span className={`font-bold ${game.matchup.homeDefRank <= 10 ? 'text-green-400' : game.matchup.homeDefRank <= 20 ? 'text-yellow-400' : 'text-red-400'}`}>
                        #{game.matchup.homeDefRank}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Key Matchup Points */}
              {game.matchup.keyPoints && game.matchup.keyPoints.length > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-800">
                  <h4 className="text-sm font-semibold text-slate-400 mb-3">KEY MATCHUP POINTS</h4>
                  <ul className="space-y-2">
                    {game.matchup.keyPoints.map((point, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                        <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* =========================================== */}
            {/* ESPN TEAM LEADERS - REAL DATA */}
            {/* =========================================== */}
            <div className="rounded-2xl p-6 bg-slate-900/50 border border-slate-800">
              <button 
                onClick={() => toggleSection('leaders')}
                className="flex items-center justify-between w-full text-left"
              >
                <h3 className="flex items-center gap-2 text-lg font-bold text-white">
                  <Star className="w-5 h-5 text-yellow-500" />
                  Key Players (ESPN Data)
                  {gameSummary.predictor && typeof gameSummary.predictor.homeWinProbability !== 'undefined' && (
                    <span className="ml-2 px-2 py-0.5 text-xs rounded bg-blue-500/20 text-blue-400">
                      Win Prob: {game.home.abbr} {Number(gameSummary.predictor.homeWinProbability).toFixed(1)}% | {game.away.abbr} {Number(gameSummary.predictor.awayWinProbability ?? (100 - Number(gameSummary.predictor.homeWinProbability))).toFixed(1)}%
                    </span>
                  )}
                </h3>
                {expandedSections.leaders ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
              </button>
              
              {expandedSections.leaders && (
                <div className="mt-4">
                  {gameSummary.loading ? (
                    <div className="flex items-center justify-center py-8">
                      <RefreshCw className="w-6 h-6 text-orange-500 animate-spin mr-2" />
                      <span className="text-slate-400">Loading real player data from ESPN...</span>
                    </div>
                  ) : gameSummary.error ? (
                    <div className="text-center py-6">
                      <AlertTriangle className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                      <p className="text-slate-500">{gameSummary.error}</p>
                    </div>
                  ) : (
                    <div className="grid md:grid-cols-2 gap-6">
                      {/* Away Team Leaders */}
                      <div>
                        <h4 className="text-sm font-semibold text-slate-400 mb-3 flex items-center gap-2">
                          <span className="text-xl">{game.away.emoji}</span> {gameSummary.leaders.awayTeam.name || game.away.name}
                        </h4>
                        <div className="space-y-2">
                          {gameSummary.leaders.awayTeam.leaders.length > 0 ? (
                            gameSummary.leaders.awayTeam.leaders.slice(0, 5).map((leader, i) => (
                              <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/30">
                                {leader.athlete.headshot && (
                                  <Image 
                                    src={leader.athlete.headshot} 
                                    alt={leader.athlete.displayName}
                                    width={40}
                                    height={40}
                                    className="rounded-full"
                                    unoptimized
                                  />
                                )}
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-semibold text-white truncate">
                                    {leader.athlete.displayName}
                                    {leader.athlete.jersey && <span className="text-slate-500 ml-1">#{leader.athlete.jersey}</span>}
                                  </p>
                                  <p className="text-xs text-slate-400">{leader.category}</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm font-bold text-orange-400">{leader.displayValue}</p>
                                  <p className="text-xs text-slate-500">{leader.athlete.position}</p>
                                </div>
                              </div>
                            ))
                          ) : (
                            <p className="text-slate-500 text-sm py-2">No leader data available</p>
                          )}
                        </div>
                      </div>
                      
                      {/* Home Team Leaders */}
                      <div>
                        <h4 className="text-sm font-semibold text-slate-400 mb-3 flex items-center gap-2">
                          <span className="text-xl">{game.home.emoji}</span> {gameSummary.leaders.homeTeam.name || game.home.name}
                        </h4>
                        <div className="space-y-2">
                          {gameSummary.leaders.homeTeam.leaders.length > 0 ? (
                            gameSummary.leaders.homeTeam.leaders.slice(0, 5).map((leader, i) => (
                              <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/30">
                                {leader.athlete.headshot && (
                                  <Image 
                                    src={leader.athlete.headshot} 
                                    alt={leader.athlete.displayName}
                                    width={40}
                                    height={40}
                                    className="rounded-full"
                                    unoptimized
                                  />
                                )}
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-semibold text-white truncate">
                                    {leader.athlete.displayName}
                                    {leader.athlete.jersey && <span className="text-slate-500 ml-1">#{leader.athlete.jersey}</span>}
                                  </p>
                                  <p className="text-xs text-slate-400">{leader.category}</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm font-bold text-orange-400">{leader.displayValue}</p>
                                  <p className="text-xs text-slate-500">{leader.athlete.position}</p>
                                </div>
                              </div>
                            ))
                          ) : (
                            <p className="text-slate-500 text-sm py-2">No leader data available</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Data source attribution */}
                  <p className="text-xs text-slate-600 mt-4 flex items-center gap-1">
                    <Database className="w-3 h-3" />
                    Player stats from ESPN. Updated in real-time.
                  </p>
                </div>
              )}
            </div>

            {/* =========================================== */}
            {/* ESPN INJURY REPORT - REAL DATA */}
            {/* =========================================== */}
            <div className="rounded-2xl p-6 bg-slate-900/50 border border-slate-800">
              <button 
                onClick={() => toggleSection('injuries')}
                className="flex items-center justify-between w-full text-left"
              >
                <h3 className="flex items-center gap-2 text-lg font-bold text-white">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                  Full Injury Report (ESPN Data)
                  {!gameSummary.loading && (
                    <span className="ml-2 px-2 py-0.5 text-xs rounded bg-red-500/20 text-red-400">
                      {gameSummary.injuries.impactSummary.homeOutPlayers + gameSummary.injuries.impactSummary.awayOutPlayers} Players Out
                    </span>
                  )}
                </h3>
                {expandedSections.injuries ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
              </button>
              
              {expandedSections.injuries && (
                <div className="mt-4">
                  {gameSummary.loading ? (
                    <div className="flex items-center justify-center py-8">
                      <RefreshCw className="w-6 h-6 text-orange-500 animate-spin mr-2" />
                      <span className="text-slate-400">Loading injury data from ESPN...</span>
                    </div>
                  ) : (
                    <div className="grid md:grid-cols-2 gap-6">
                      {/* Away Team Injuries */}
                      <div>
                        <h4 className="text-sm font-semibold text-slate-400 mb-3 flex items-center gap-2">
                          <span className="text-xl">{game.away.emoji}</span> {game.away.name} Injuries
                        </h4>
                        <div className="space-y-2">
                          {gameSummary.injuries.awayTeam.length > 0 ? (
                            gameSummary.injuries.awayTeam.map((injury, i) => (
                              <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-slate-800/30">
                                <div className="flex items-center gap-3">
                                  {injury.athlete.headshot && (
                                    <Image 
                                      src={injury.athlete.headshot} 
                                      alt={injury.athlete.displayName}
                                      width={32}
                                      height={32}
                                      className="rounded-full"
                                      unoptimized
                                    />
                                  )}
                                  <div>
                                    <p className="text-sm font-semibold text-white">{injury.athlete.displayName}</p>
                                    <p className="text-xs text-slate-400">
                                      {injury.athlete.position} • {injury.type || 'Unknown injury'}
                                    </p>
                                  </div>
                                </div>
                                <span className={`px-2 py-1 rounded text-xs font-bold ${
                                  injury.status === 'Out' || injury.status === 'Injured Reserve' ? 'bg-red-500/20 text-red-400' :
                                  injury.status === 'Doubtful' ? 'bg-orange-500/20 text-orange-400' :
                                  injury.status === 'Questionable' ? 'bg-yellow-500/20 text-yellow-400' :
                                  'bg-green-500/20 text-green-400'
                                }`}>
                                  {injury.status}
                                </span>
                              </div>
                            ))
                          ) : (
                            <p className="text-slate-500 text-sm py-2">No injuries reported</p>
                          )}
                        </div>
                      </div>
                      
                      {/* Home Team Injuries */}
                      <div>
                        <h4 className="text-sm font-semibold text-slate-400 mb-3 flex items-center gap-2">
                          <span className="text-xl">{game.home.emoji}</span> {game.home.name} Injuries
                        </h4>
                        <div className="space-y-2">
                          {gameSummary.injuries.homeTeam.length > 0 ? (
                            gameSummary.injuries.homeTeam.map((injury, i) => (
                              <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-slate-800/30">
                                <div className="flex items-center gap-3">
                                  {injury.athlete.headshot && (
                                    <Image 
                                      src={injury.athlete.headshot} 
                                      alt={injury.athlete.displayName}
                                      width={32}
                                      height={32}
                                      className="rounded-full"
                                      unoptimized
                                    />
                                  )}
                                  <div>
                                    <p className="text-sm font-semibold text-white">{injury.athlete.displayName}</p>
                                    <p className="text-xs text-slate-400">
                                      {injury.athlete.position} • {injury.type || 'Unknown injury'}
                                    </p>
                                  </div>
                                </div>
                                <span className={`px-2 py-1 rounded text-xs font-bold ${
                                  injury.status === 'Out' || injury.status === 'Injured Reserve' ? 'bg-red-500/20 text-red-400' :
                                  injury.status === 'Doubtful' ? 'bg-orange-500/20 text-orange-400' :
                                  injury.status === 'Questionable' ? 'bg-yellow-500/20 text-yellow-400' :
                                  'bg-green-500/20 text-green-400'
                                }`}>
                                  {injury.status}
                                </span>
                              </div>
                            ))
                          ) : (
                            <p className="text-slate-500 text-sm py-2">No injuries reported</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Data source attribution */}
                  <p className="text-xs text-slate-600 mt-4 flex items-center gap-1">
                    <Database className="w-3 h-3" />
                    Injury data from ESPN. Updated in real-time.
                  </p>
                </div>
              )}
            </div>

            {/* =========================================== */}
            {/* HEAD-TO-HEAD HISTORY */}
            {/* =========================================== */}
            <div className="rounded-2xl p-6 bg-slate-900/50 border border-slate-800">
              <button 
                onClick={() => toggleSection('h2h')}
                className="flex items-center justify-between w-full text-left"
              >
                <h3 className="flex items-center gap-2 text-lg font-bold text-white">
                  <History className="w-5 h-5 text-purple-500" />
                  Head-to-Head History
                </h3>
                {expandedSections.h2h ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
              </button>
              
              {expandedSections.h2h && (
                <div className="mt-4">
                  {game.h2h && game.h2h.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-slate-700">
                            <th className="text-left py-2 text-slate-500 font-medium">Date</th>
                            <th className="text-center py-2 text-slate-500 font-medium">Score</th>
                            <th className="text-center py-2 text-slate-500 font-medium">Winner</th>
                            <th className="text-center py-2 text-slate-500 font-medium">ATS</th>
                            <th className="text-center py-2 text-slate-500 font-medium">O/U</th>
                          </tr>
                        </thead>
                        <tbody>
                          {game.h2h.map((match, i) => (
                            <tr key={i} className="border-b border-slate-800 hover:bg-slate-800/30">
                              <td className="py-3 text-slate-300">{match.date}</td>
                              <td className="py-3 text-center text-white font-mono">{match.score}</td>
                              <td className="py-3 text-center">
                                <span className={`px-2 py-1 rounded text-xs font-bold ${
                                  match.winner === game.home.abbr ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                                }`}>
                                  {match.winner}
                                </span>
                              </td>
                              <td className="py-3 text-center">
                                <span className={`font-bold ${match.atsResult === 'W' ? 'text-green-400' : match.atsResult === 'L' ? 'text-red-400' : 'text-slate-400'}`}>
                                  {match.atsResult}
                                </span>
                              </td>
                              <td className="py-3 text-center">
                                <span className={`font-bold ${match.ouResult === 'O' ? 'text-green-400' : match.ouResult === 'U' ? 'text-blue-400' : 'text-slate-400'}`}>
                                  {match.ouResult}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-slate-500 text-center py-4">No recent head-to-head matchups found</p>
                  )}
                </div>
              )}
            </div>

            {/* =========================================== */}
            {/* AWAY TEAM - LAST 10 GAMES */}
            {/* =========================================== */}
            {renderScheduleTable(awaySchedule, game.away.emoji, game.away.name, 'awaySchedule')}

            {/* =========================================== */}
            {/* HOME TEAM - LAST 10 GAMES */}
            {/* =========================================== */}
            {renderScheduleTable(homeSchedule, game.home.emoji, game.home.name, 'homeSchedule')}

            {/* =========================================== */}
            {/* BETTING TRENDS */}
            {/* =========================================== */}
            <div className="rounded-2xl p-6 bg-slate-900/50 border border-slate-800">
              <button 
                onClick={() => toggleSection('trends')}
                className="flex items-center justify-between w-full text-left"
              >
                <h3 className="flex items-center gap-2 text-lg font-bold text-white">
                  <TrendingUp className="w-5 h-5 text-green-500" />
                  Betting Trends
                </h3>
                {expandedSections.trends ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
              </button>
              
              {expandedSections.trends && (
                <div className="mt-4 grid md:grid-cols-2 gap-6">
                  {/* Away Team Trends */}
                  <div>
                    <h4 className="text-sm font-semibold text-slate-400 mb-3 flex items-center gap-2">
                      <span>{game.away.emoji}</span> {game.away.abbr} TRENDS
                    </h4>
                    <ul className="space-y-2">
                      {game.awayTrends.map((trend, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-slate-300 p-2 rounded-lg bg-slate-800/30">
                          <TrendingUp className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                          {trend}
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  {/* Home Team Trends */}
                  <div>
                    <h4 className="text-sm font-semibold text-slate-400 mb-3 flex items-center gap-2">
                      <span>{game.home.emoji}</span> {game.home.abbr} TRENDS
                    </h4>
                    <ul className="space-y-2">
                      {game.homeTrends.map((trend, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-slate-300 p-2 rounded-lg bg-slate-800/30">
                          <TrendingUp className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                          {trend}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>

            {/* =========================================== */}
            {/* AI ANALYSIS */}
            {/* =========================================== */}
            <div className="rounded-2xl p-6 bg-gradient-to-br from-orange-500/10 to-slate-900 border border-orange-500/20">
              <h3 className="flex items-center gap-2 text-lg font-bold text-white mb-4">
                <Brain className="w-5 h-5 text-orange-500" />
                AI Analysis
              </h3>
              <p className="text-slate-300 leading-relaxed mb-6">{game.aiAnalysis}</p>
              
              {game.aiPicks && game.aiPicks.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-slate-400 mb-3">AI PICKS</h4>
                  <div className="space-y-3">
                    {game.aiPicks.map((pick, i) => (
                      <div key={i} className="p-4 rounded-xl bg-slate-800/50 border border-slate-700">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-bold text-white">{pick.pick}</span>
                          <span className={`px-2 py-1 rounded text-xs font-bold ${
                            pick.confidence >= 70 ? 'bg-green-500/20 text-green-400' :
                            pick.confidence >= 55 ? 'bg-orange-500/20 text-orange-400' :
                            'bg-slate-700 text-slate-400'
                          }`}>
                            {pick.confidence}% confidence
                          </span>
                        </div>
                        <p className="text-sm text-slate-400">{pick.reasoning}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* =========================================== */}
          {/* RIGHT SIDEBAR */}
          {/* =========================================== */}
          <div className="space-y-6">
            
            {/* Quick Signals */}
            <div className="rounded-2xl p-5 bg-slate-900/50 border border-slate-800">
              <h3 className="flex items-center gap-2 text-lg font-bold text-white mb-4">
                <Zap className="w-5 h-5 text-yellow-500" />
                Quick Signals
              </h3>
              <div className="space-y-3">
                {game.signals.map((signal, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-slate-800/30">
                    <div className="mt-0.5">
                      {signal.type === 'bullish' ? (
                        <TrendingUp className="w-4 h-4 text-green-400" />
                      ) : signal.type === 'bearish' ? (
                        <TrendingDown className="w-4 h-4 text-red-400" />
                      ) : (
                        <Info className="w-4 h-4 text-orange-400" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{signal.title}</p>
                      <p className="text-xs text-slate-400">{signal.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Injury Report - Real ESPN Data */}
            <div className="rounded-2xl p-5 bg-slate-900/50 border border-slate-800">
              <h3 className="flex items-center gap-2 text-lg font-bold text-white mb-4">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                Key Injuries (ESPN)
              </h3>
              {gameSummary.loading ? (
                <div className="flex items-center justify-center py-4">
                  <RefreshCw className="w-4 h-4 text-orange-500 animate-spin mr-2" />
                  <span className="text-slate-500 text-sm">Loading...</span>
                </div>
              ) : [...gameSummary.injuries.homeTeam, ...gameSummary.injuries.awayTeam]
                .filter(inj => inj.status === 'Out' || inj.status === 'Injured Reserve' || inj.status === 'Doubtful' || inj.status === 'Questionable')
                .slice(0, 5).length > 0 ? (
                <div className="space-y-3">
                  {[...gameSummary.injuries.homeTeam, ...gameSummary.injuries.awayTeam]
                    .filter(inj => inj.status === 'Out' || inj.status === 'Injured Reserve' || inj.status === 'Doubtful' || inj.status === 'Questionable')
                    .slice(0, 5)
                    .map((injury, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-slate-800/30">
                      <div>
                        <p className="text-sm font-semibold text-white">{injury.athlete.displayName}</p>
                        <p className="text-xs text-slate-400">{injury.athlete.position} • {injury.type || 'Unknown'}</p>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-bold ${
                        injury.status === 'Out' || injury.status === 'Injured Reserve' ? 'bg-red-500/20 text-red-400' :
                        injury.status === 'Doubtful' ? 'bg-orange-500/20 text-orange-400' :
                        injury.status === 'Questionable' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-green-500/20 text-green-400'
                      }`}>
                        {injury.status}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500">No significant injuries reported</p>
              )}
            </div>

            {/* ESPN Odds & Line Movement */}
            <div className="rounded-2xl p-5 bg-slate-900/50 border border-slate-800">
              <h3 className="flex items-center gap-2 text-lg font-bold text-white mb-4">
                <LineChart className="w-5 h-5 text-blue-500" />
                ESPN Odds & Lines
              </h3>
              {gameSummary.loading ? (
                <div className="flex items-center justify-center py-4">
                  <RefreshCw className="w-4 h-4 text-orange-500 animate-spin mr-2" />
                  <span className="text-slate-500 text-sm">Loading...</span>
                </div>
              ) : gameSummary.odds ? (
                <div className="space-y-4">
                  {/* Provider */}
                  <p className="text-xs text-slate-500">{gameSummary.odds.provider?.name || 'Sportsbook'}</p>
                  
                  {/* Spread */}
                  <div>
                    <div className="flex justify-between text-xs text-slate-500 mb-1">
                      <span>Spread</span>
                      {gameSummary.lineMovement.spreadMove !== null && gameSummary.lineMovement.spreadMove !== 0 && (
                        <span className={gameSummary.lineMovement.spreadMove > 0 ? 'text-red-400' : 'text-green-400'}>
                          {gameSummary.lineMovement.spreadMove > 0 ? '▲' : '▼'} Moved
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <div className="flex-1 p-2 rounded bg-slate-800/50 text-center">
                        <p className="text-xs text-slate-500">Open</p>
                        <p className="font-bold text-white">{gameSummary.lineMovement.openingSpread || 'N/A'}</p>
                      </div>
                      <div className="flex items-center">
                        <ChevronRight className="w-4 h-4 text-slate-600" />
                      </div>
                      <div className="flex-1 p-2 rounded bg-slate-800/50 text-center">
                        <p className="text-xs text-slate-500">Current</p>
                        <p className="font-bold text-orange-400">
                          {gameSummary.odds.homeTeamOdds?.favorite ? '-' : '+'}{Math.abs(gameSummary.odds.spread).toFixed(1)}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Total */}
                  <div>
                    <div className="flex justify-between text-xs text-slate-500 mb-1">
                      <span>Total</span>
                      {gameSummary.lineMovement.totalMove !== null && gameSummary.lineMovement.totalMove !== 0 && (
                        <span className={gameSummary.lineMovement.totalMove > 0 ? 'text-red-400' : 'text-green-400'}>
                          {gameSummary.lineMovement.totalMove > 0 ? '▲' : '▼'} {Math.abs(gameSummary.lineMovement.totalMove).toFixed(1)}
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <div className="flex-1 p-2 rounded bg-slate-800/50 text-center">
                        <p className="text-xs text-slate-500">Open</p>
                        <p className="font-bold text-white">{gameSummary.lineMovement.openingTotal || 'N/A'}</p>
                      </div>
                      <div className="flex items-center">
                        <ChevronRight className="w-4 h-4 text-slate-600" />
                      </div>
                      <div className="flex-1 p-2 rounded bg-slate-800/50 text-center">
                        <p className="text-xs text-slate-500">Current</p>
                        <p className="font-bold text-green-400">{gameSummary.odds.overUnder}</p>
                      </div>
                    </div>
                  </div>

                  {/* Moneyline */}
                  <div>
                    <p className="text-xs text-slate-500 mb-2">Moneyline</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-2 rounded bg-slate-800/50 text-center">
                        <p className="text-xs text-slate-500">{game.away.abbr}</p>
                        <p className={`font-bold ${gameSummary.odds.awayTeamOdds?.moneyLine > 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {gameSummary.odds.awayTeamOdds?.moneyLine > 0 ? '+' : ''}{gameSummary.odds.awayTeamOdds?.moneyLine}
                        </p>
                      </div>
                      <div className="p-2 rounded bg-slate-800/50 text-center">
                        <p className="text-xs text-slate-500">{game.home.abbr}</p>
                        <p className={`font-bold ${gameSummary.odds.homeTeamOdds?.moneyLine > 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {gameSummary.odds.homeTeamOdds?.moneyLine > 0 ? '+' : ''}{gameSummary.odds.homeTeamOdds?.moneyLine}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* ATS Records */}
                  {(gameSummary.atsRecords.homeTeam || gameSummary.atsRecords.awayTeam) && (
                    <div>
                      <p className="text-xs text-slate-500 mb-2">ATS Records</p>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="text-center">
                          <p className="text-slate-500">{game.away.abbr}</p>
                          <p className="text-white font-semibold">{gameSummary.atsRecords.awayTeam?.ats || 'N/A'}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-slate-500">{game.home.abbr}</p>
                          <p className="text-white font-semibold">{gameSummary.atsRecords.homeTeam?.ats || 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-slate-500">No odds available</p>
              )}
            </div>

            {/* Opening vs Current Lines - Original */}
            <div className="rounded-2xl p-5 bg-slate-900/50 border border-slate-800">
              <h3 className="flex items-center gap-2 text-lg font-bold text-white mb-4">
                <LineChart className="w-5 h-5 text-blue-500" />
                Original Line Movement
              </h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs text-slate-500 mb-1">
                    <span>Spread</span>
                    <span>{game.metrics.lineMovement}</span>
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1 p-2 rounded bg-slate-800/50 text-center">
                      <p className="text-xs text-slate-500">Open</p>
                      <p className="font-bold text-white">{game.openingSpread?.line || 'N/A'}</p>
                    </div>
                    <div className="flex items-center">
                      <ChevronRight className="w-4 h-4 text-slate-600" />
                    </div>
                    <div className="flex-1 p-2 rounded bg-slate-800/50 text-center">
                      <p className="text-xs text-slate-500">Current</p>
                      <p className="font-bold text-orange-400">{game.spread.line}</p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between text-xs text-slate-500 mb-1">
                    <span>Total</span>
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1 p-2 rounded bg-slate-800/50 text-center">
                      <p className="text-xs text-slate-500">Open</p>
                      <p className="font-bold text-white">{game.openingTotal || 'N/A'}</p>
                    </div>
                    <div className="flex items-center">
                      <ChevronRight className="w-4 h-4 text-slate-600" />
                    </div>
                    <div className="flex-1 p-2 rounded bg-slate-800/50 text-center">
                      <p className="text-xs text-slate-500">Current</p>
                      <p className="font-bold text-green-400">{game.total}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Game Info */}
            <div className="rounded-2xl p-5 bg-slate-900/50 border border-slate-800">
              <h3 className="flex items-center gap-2 text-lg font-bold text-white mb-4">
                <Info className="w-5 h-5 text-slate-400" />
                Game Info
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2 text-slate-400">
                  <Calendar className="w-4 h-4" />
                  <span>{game.date} • {game.time}</span>
                </div>
                {game.weather && (
                  <div className="flex items-center gap-2 text-slate-400">
                    <ThermometerSun className="w-4 h-4" />
                    <span>{game.weather.temp}°F • {game.weather.condition}</span>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>

        {/* =========================================== */}
        {/* LIVE GAME / RESULTS SECTION */}
        {/* =========================================== */}
        {game.status === 'live' && (
          <div className="mt-6">
            <LiveGameDashboard
              gameId={game.id}
              sport={game.sport}
              homeTeam={{
                name: game.home.name,
                abbr: game.home.abbr,
                record: game.home.record
              }}
              awayTeam={{
                name: game.away.name,
                abbr: game.away.abbr,
                record: game.away.record
              }}
              currentScore={{ home: 0, away: 0 }}
              period="2Q"
              clock="8:45"
              status="live"
            />
          </div>
        )}

        {game.status === 'final' && game.result && (
          <div className="mt-6">
            <BoxScore game={game} />
          </div>
        )}

      </div>
    </main>
  )
}
