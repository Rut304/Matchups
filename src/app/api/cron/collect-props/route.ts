/**
 * Cron Job: Collect Player Props & Stats
 * 
 * Collects player statistics and prop lines, then calculates edges
 * where player performance metrics suggest value vs betting lines.
 * 
 * Runs every 4 hours during active hours to capture:
 * - Player season/recent averages from ESPN
 * - Prop lines from The Odds API
 * - Hit rate calculations
 * - Edge detection (stats vs props)
 */

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'
export const maxDuration = 120

// Initialize Supabase
function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

const ODDS_API_KEY = process.env.ODDS_API_KEY || process.env.THE_ODDS_API_KEY

// Sport mappings
const ESPN_SPORT_MAP: Record<string, string> = {
  'NFL': 'football/nfl',
  'NBA': 'basketball/nba',
  'MLB': 'baseball/mlb',
  'NHL': 'hockey/nhl'
}

const ODDS_SPORT_MAP: Record<string, string> = {
  'NFL': 'americanfootball_nfl',
  'NBA': 'basketball_nba',
  'MLB': 'baseball_mlb',
  'NHL': 'icehockey_nhl'
}

const PROP_MARKETS: Record<string, Record<string, string>> = {
  NFL: {
    passing_yards: 'player_pass_yds',
    passing_tds: 'player_pass_tds',
    rushing_yards: 'player_rush_yds',
    receiving_yards: 'player_reception_yds',
    receptions: 'player_receptions'
  },
  NBA: {
    points: 'player_points',
    rebounds: 'player_rebounds',
    assists: 'player_assists',
    threes: 'player_threes',
    pra: 'player_points_rebounds_assists'
  },
  MLB: {
    hits: 'batter_hits',
    total_bases: 'batter_total_bases',
    strikeouts: 'pitcher_strikeouts'
  },
  NHL: {
    goals: 'player_goals',
    assists: 'player_assists',
    points: 'player_points',
    shots: 'player_shots_on_goal'
  }
}

// =============================================================================
// ESPN DATA FETCHING
// =============================================================================

interface GameLogEntry {
  gameId: string
  date: string
  opponent: string
  stats: Record<string, number>
}

async function getPlayerGameLog(playerId: string, sport: string): Promise<GameLogEntry[]> {
  try {
    const espnSport = ESPN_SPORT_MAP[sport]
    if (!espnSport) return []
    
    const url = `https://site.api.espn.com/apis/common/v3/sports/${espnSport}/athletes/${playerId}/gamelog`
    const res = await fetch(url, { next: { revalidate: 3600 } })
    
    if (!res.ok) return []
    
    const data = await res.json()
    const gameLog: GameLogEntry[] = []
    const logs = data.seasonTypes?.[0]?.categories?.[0]?.events || []
    
    for (const game of logs.slice(0, 20)) {
      const stats: Record<string, number> = {}
      const statLine = game.stats || []
      
      if (sport === 'NFL') {
        if (statLine[0]) stats.completions = parseFloat(statLine[0]) || 0
        if (statLine[1]) stats.passing_attempts = parseFloat(statLine[1]) || 0
        if (statLine[2]) stats.passing_yards = parseFloat(statLine[2]) || 0
        if (statLine[3]) stats.passing_tds = parseFloat(statLine[3]) || 0
        if (statLine[5]) stats.rushing_yards = parseFloat(statLine[5]) || 0
        if (statLine[6]) stats.rushing_tds = parseFloat(statLine[6]) || 0
      } else if (sport === 'NBA') {
        if (statLine[0]) stats.minutes = parseFloat(statLine[0]) || 0
        if (statLine[1]) stats.points = parseFloat(statLine[1]) || 0
        if (statLine[2]) stats.rebounds = parseFloat(statLine[2]) || 0
        if (statLine[3]) stats.assists = parseFloat(statLine[3]) || 0
        if (statLine[4]) stats.steals = parseFloat(statLine[4]) || 0
        if (statLine[5]) stats.blocks = parseFloat(statLine[5]) || 0
        // Calculate PRA combo
        stats.pra = (stats.points || 0) + (stats.rebounds || 0) + (stats.assists || 0)
      } else if (sport === 'MLB') {
        if (statLine[0]) stats.hits = parseFloat(statLine[0]) || 0
        if (statLine[1]) stats.at_bats = parseFloat(statLine[1]) || 0
        if (statLine[2]) stats.home_runs = parseFloat(statLine[2]) || 0
        if (statLine[3]) stats.rbis = parseFloat(statLine[3]) || 0
        if (statLine[4]) stats.total_bases = parseFloat(statLine[4]) || 0
      } else if (sport === 'NHL') {
        if (statLine[0]) stats.goals = parseFloat(statLine[0]) || 0
        if (statLine[1]) stats.assists = parseFloat(statLine[1]) || 0
        if (statLine[2]) stats.points = parseFloat(statLine[2]) || 0
        if (statLine[3]) stats.shots = parseFloat(statLine[3]) || 0
      }
      
      gameLog.push({
        gameId: game.eventId || game.id,
        date: game.gameDate || '',
        opponent: game.opponent?.abbreviation || '',
        stats
      })
    }
    
    return gameLog
  } catch {
    return []
  }
}

async function getTeamRoster(teamId: string, sport: string): Promise<{ id: string; name: string; position: string }[]> {
  try {
    const espnSport = ESPN_SPORT_MAP[sport]
    if (!espnSport) return []
    
    const url = `https://site.api.espn.com/apis/site/v2/sports/${espnSport}/teams/${teamId}/roster`
    const res = await fetch(url, { next: { revalidate: 86400 } })
    
    if (!res.ok) return []
    
    const data = await res.json()
    const athletes = data.athletes || []
    const roster: { id: string; name: string; position: string }[] = []
    
    for (const group of athletes) {
      for (const player of group.items || []) {
        roster.push({
          id: player.id,
          name: player.fullName || player.displayName,
          position: player.position?.abbreviation || 'N/A'
        })
      }
    }
    
    return roster
  } catch {
    return []
  }
}

// =============================================================================
// ODDS API - PROP LINES
// =============================================================================

interface PropLine {
  book: string
  line: number
  overOdds: number
  underOdds: number
}

async function fetchPropLines(sport: string, eventId: string, market: string): Promise<Map<string, PropLine[]>> {
  const playerLines = new Map<string, PropLine[]>()
  
  if (!ODDS_API_KEY) return playerLines
  
  try {
    const oddsSport = ODDS_SPORT_MAP[sport]
    if (!oddsSport) return playerLines
    
    const url = `https://api.the-odds-api.com/v4/sports/${oddsSport}/events/${eventId}/odds?apiKey=${ODDS_API_KEY}&regions=us&markets=${market}&oddsFormat=american`
    const res = await fetch(url)
    
    if (!res.ok) return playerLines
    
    const data = await res.json()
    
    for (const bookmaker of data.bookmakers || []) {
      for (const mkt of bookmaker.markets || []) {
        for (const outcome of mkt.outcomes || []) {
          const playerName = outcome.description || ''
          if (!playerName) continue
          
          const existing = playerLines.get(playerName) || []
          const existingLine = existing.find(l => l.book === bookmaker.key)
          
          if (existingLine) {
            if (outcome.name === 'Over') existingLine.overOdds = outcome.price
            if (outcome.name === 'Under') existingLine.underOdds = outcome.price
          } else {
            existing.push({
              book: bookmaker.key,
              line: outcome.point || 0,
              overOdds: outcome.name === 'Over' ? outcome.price : 0,
              underOdds: outcome.name === 'Under' ? outcome.price : 0
            })
          }
          
          playerLines.set(playerName, existing)
        }
      }
    }
  } catch {
    // Silent fail
  }
  
  return playerLines
}

// =============================================================================
// CALCULATIONS & EDGE DETECTION
// =============================================================================

function calculateAverage(gameLog: GameLogEntry[], statKey: string, games?: number): number {
  const subset = games ? gameLog.slice(0, games) : gameLog
  if (subset.length === 0) return 0
  const total = subset.reduce((sum, g) => sum + (g.stats[statKey] || 0), 0)
  return total / subset.length
}

function calculateHitRate(gameLog: GameLogEntry[], statKey: string, line: number, games?: number): number {
  const subset = games ? gameLog.slice(0, games) : gameLog
  if (subset.length === 0) return 0
  const hits = subset.filter(g => (g.stats[statKey] || 0) > line).length
  return (hits / subset.length) * 100
}

interface EdgeAnalysis {
  edge: 'over' | 'under' | 'none'
  edgePercent: number
  confidence: number
  factors: string[]
}

function analyzeEdge(
  line: number,
  seasonAvg: number,
  last5Avg: number,
  hitRateSeason: number,
  hitRateLast5: number
): EdgeAnalysis {
  const factors: string[] = []
  let overScore = 0
  let underScore = 0
  
  // Factor 1: Season avg vs line (THE KEY EDGE)
  const avgVsLine = ((seasonAvg - line) / line) * 100
  if (avgVsLine > 10) {
    overScore += 30
    factors.push(`Season avg ${seasonAvg.toFixed(1)} exceeds line ${line} by ${avgVsLine.toFixed(0)}%`)
  } else if (avgVsLine < -10) {
    underScore += 30
    factors.push(`Season avg ${seasonAvg.toFixed(1)} is ${Math.abs(avgVsLine).toFixed(0)}% below line ${line}`)
  }
  
  // Factor 2: Recent form vs season
  if (last5Avg > seasonAvg * 1.15) {
    overScore += 20
    factors.push(`Hot streak: L5 avg ${last5Avg.toFixed(1)} > season ${seasonAvg.toFixed(1)}`)
  } else if (last5Avg < seasonAvg * 0.85) {
    underScore += 20
    factors.push(`Cold streak: L5 avg ${last5Avg.toFixed(1)} < season ${seasonAvg.toFixed(1)}`)
  }
  
  // Factor 3: Hit rate
  if (hitRateSeason > 65) {
    overScore += 20
    factors.push(`Strong over hit rate: ${hitRateSeason.toFixed(0)}%`)
  } else if (hitRateSeason < 35) {
    underScore += 20
    factors.push(`Strong under hit rate: ${(100 - hitRateSeason).toFixed(0)}%`)
  }
  
  // Factor 4: Recent trend
  if (hitRateLast5 > hitRateSeason + 20) {
    overScore += 15
    factors.push(`Recent over trend: L5 hit rate ${hitRateLast5.toFixed(0)}% vs ${hitRateSeason.toFixed(0)}% season`)
  } else if (hitRateLast5 < hitRateSeason - 20) {
    underScore += 15
    factors.push(`Recent under trend: L5 hit rate ${hitRateLast5.toFixed(0)}% vs ${hitRateSeason.toFixed(0)}% season`)
  }
  
  const diff = overScore - underScore
  const edgePercent = Math.abs(avgVsLine)
  
  if (diff >= 25) {
    return { edge: 'over', edgePercent, confidence: Math.min(90, 50 + diff), factors }
  } else if (diff <= -25) {
    return { edge: 'under', edgePercent, confidence: Math.min(90, 50 + Math.abs(diff)), factors }
  }
  
  return { edge: 'none', edgePercent: 0, confidence: 30, factors }
}

// =============================================================================
// MAIN COLLECTION LOGIC
// =============================================================================

interface CollectedPropEdge {
  gameId: string
  sport: string
  playerId: string
  playerName: string
  team: string
  position: string
  propType: string
  line: number
  bestOverOdds: number
  bestUnderOdds: number
  bestOverBook: string
  bestUnderBook: string
  seasonAvg: number
  last5Avg: number
  last10Avg: number
  hitRateSeason: number
  hitRateLast5: number
  edge: 'over' | 'under' | 'none'
  edgePercent: number
  confidence: number
  factors: string[]
}

async function collectPropsForSport(sport: string): Promise<CollectedPropEdge[]> {
  const collected: CollectedPropEdge[] = []
  
  try {
    // Get today's games from ESPN
    const espnSport = ESPN_SPORT_MAP[sport]
    if (!espnSport) return collected
    
    const today = new Date().toISOString().split('T')[0].replace(/-/g, '')
    const url = `https://site.api.espn.com/apis/site/v2/sports/${espnSport}/scoreboard?dates=${today}`
    const res = await fetch(url)
    
    if (!res.ok) return collected
    
    const data = await res.json()
    const games = data.events || []
    
    const propMarkets = PROP_MARKETS[sport] || {}
    const processedPlayers = new Set<string>()
    
    for (const game of games) {
      const comp = game.competitions?.[0]
      if (!comp) continue
      
      const homeTeam = comp.competitors?.find((c: any) => c.homeAway === 'home')
      const awayTeam = comp.competitors?.find((c: any) => c.homeAway === 'away')
      
      if (!homeTeam || !awayTeam) continue
      
      // Get rosters
      const [homeRoster, awayRoster] = await Promise.all([
        getTeamRoster(homeTeam.team.id, sport),
        getTeamRoster(awayTeam.team.id, sport)
      ])
      
      const roster = [
        ...homeRoster.map(p => ({ ...p, team: homeTeam.team.abbreviation })),
        ...awayRoster.map(p => ({ ...p, team: awayTeam.team.abbreviation }))
      ]
      
      // Collect props for each market
      for (const [statKey, market] of Object.entries(propMarkets)) {
        const propLines = await fetchPropLines(sport, game.id, market)
        
        for (const [playerName, lines] of propLines) {
          const playerKey = `${playerName}-${statKey}`
          if (processedPlayers.has(playerKey)) continue
          processedPlayers.add(playerKey)
          
          // Find player in roster
          const rosterPlayer = roster.find(p => 
            p.name.toLowerCase().includes(playerName.split(' ').pop()?.toLowerCase() || '') ||
            playerName.toLowerCase().includes(p.name.split(' ').pop()?.toLowerCase() || '')
          )
          
          if (!rosterPlayer) continue
          
          // Get player game log
          const gameLog = await getPlayerGameLog(rosterPlayer.id, sport)
          if (gameLog.length < 3) continue
          
          // Get consensus line
          const consensusLine = lines[0]?.line || 0
          if (consensusLine === 0) continue
          
          // Calculate stats
          const seasonAvg = calculateAverage(gameLog, statKey)
          const last5Avg = calculateAverage(gameLog, statKey, 5)
          const last10Avg = calculateAverage(gameLog, statKey, 10)
          const hitRateSeason = calculateHitRate(gameLog, statKey, consensusLine)
          const hitRateLast5 = calculateHitRate(gameLog, statKey, consensusLine, 5)
          
          // Find best lines
          let bestOverOdds = -999
          let bestUnderOdds = -999
          let bestOverBook = ''
          let bestUnderBook = ''
          
          for (const l of lines) {
            if (l.overOdds > bestOverOdds) {
              bestOverOdds = l.overOdds
              bestOverBook = l.book
            }
            if (l.underOdds > bestUnderOdds) {
              bestUnderOdds = l.underOdds
              bestUnderBook = l.book
            }
          }
          
          // Analyze edge
          const analysis = analyzeEdge(consensusLine, seasonAvg, last5Avg, hitRateSeason, hitRateLast5)
          
          collected.push({
            gameId: game.id,
            sport,
            playerId: rosterPlayer.id,
            playerName,
            team: rosterPlayer.team,
            position: rosterPlayer.position,
            propType: statKey,
            line: consensusLine,
            bestOverOdds,
            bestUnderOdds,
            bestOverBook,
            bestUnderBook,
            seasonAvg,
            last5Avg,
            last10Avg,
            hitRateSeason,
            hitRateLast5,
            edge: analysis.edge,
            edgePercent: analysis.edgePercent,
            confidence: analysis.confidence,
            factors: analysis.factors
          })
        }
        
        // Rate limit
        await new Promise(r => setTimeout(r, 100))
      }
    }
  } catch (error) {
    console.error(`Error collecting ${sport} props:`, error)
  }
  
  return collected
}

async function saveCollectedProps(supabase: ReturnType<typeof getSupabase>, props: CollectedPropEdge[]): Promise<number> {
  if (props.length === 0) return 0
  
  const rows = props.map(p => ({
    game_id: p.gameId,
    sport: p.sport,
    player_id: p.playerId,
    player_name: p.playerName,
    team: p.team,
    position: p.position,
    prop_type: p.propType,
    line: p.line,
    best_over_odds: p.bestOverOdds,
    best_under_odds: p.bestUnderOdds,
    best_over_book: p.bestOverBook,
    best_under_book: p.bestUnderBook,
    season_avg: p.seasonAvg,
    last_5_avg: p.last5Avg,
    last_10_avg: p.last10Avg,
    hit_rate_season: p.hitRateSeason,
    hit_rate_last_5: p.hitRateLast5,
    edge: p.edge,
    edge_percent: p.edgePercent,
    confidence: p.confidence,
    factors: p.factors,
    collected_at: new Date().toISOString()
  }))
  
  // Upsert to player_prop_edges
  const { error } = await supabase
    .from('player_prop_edges')
    .upsert(rows, { onConflict: 'game_id,player_id,prop_type' })
  
  if (error) {
    console.error('Error saving prop edges:', error)
    // Try inserting without upsert
    const { error: insertError } = await supabase
      .from('player_prop_edges')
      .insert(rows)
    
    if (insertError) {
      console.error('Insert also failed:', insertError)
      return 0
    }
  }
  
  return props.length
}

async function savePlayerStats(supabase: ReturnType<typeof getSupabase>, playerId: string, playerName: string, team: string, position: string, sport: string, gameLog: GameLogEntry[]): Promise<boolean> {
  const seasonStats: Record<string, number> = {}
  const last5Stats: Record<string, number> = {}
  const last10Stats: Record<string, number> = {}
  
  // Aggregate stats from game log
  if (gameLog.length > 0) {
    const keys = Object.keys(gameLog[0].stats)
    for (const key of keys) {
      seasonStats[key] = calculateAverage(gameLog, key)
      last5Stats[key] = calculateAverage(gameLog, key, 5)
      last10Stats[key] = calculateAverage(gameLog, key, 10)
    }
  }
  
  const { error } = await supabase
    .from('player_stats_cache')
    .upsert({
      player_id: playerId,
      player_name: playerName,
      team,
      position,
      sport,
      season_avg: seasonStats,
      last_5_avg: last5Stats,
      last_10_avg: last10Stats,
      games_played: gameLog.length,
      game_log: gameLog.slice(0, 10), // Last 10 games
      updated_at: new Date().toISOString()
    }, { onConflict: 'player_id,sport' })
  
  return !error
}

// =============================================================================
// CRON HANDLER
// =============================================================================

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  const supabase = getSupabase()
  const startTime = Date.now()
  const results: Record<string, number> = {}
  const errors: string[] = []
  
  // Determine which sports have games today
  const sports = ['NFL', 'NBA', 'NHL', 'MLB']
  
  for (const sport of sports) {
    try {
      const props = await collectPropsForSport(sport)
      
      // Only save props with detected edges
      const edgeProps = props.filter(p => p.edge !== 'none')
      
      if (edgeProps.length > 0) {
        const saved = await saveCollectedProps(supabase, edgeProps)
        results[sport] = saved
      } else {
        results[sport] = 0
      }
      
      console.log(`[Props] ${sport}: Found ${props.length} props, ${edgeProps.length} with edges`)
      
    } catch (error) {
      errors.push(`${sport}: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
  
  const duration = Date.now() - startTime
  
  return NextResponse.json({
    success: true,
    message: 'Player props with edges collected',
    results,
    totalEdges: Object.values(results).reduce((a, b) => a + b, 0),
    duration: `${(duration / 1000).toFixed(1)}s`,
    errors: errors.length > 0 ? errors : undefined,
    timestamp: new Date().toISOString()
  })
}
