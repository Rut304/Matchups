/**
 * COMPREHENSIVE PLAYER PROP ENGINE
 * 
 * Collects player stats, prop lines, and calculates hit rates
 * 
 * Data Sources:
 * - ESPN: Player stats, game logs, season averages
 * - The Odds API: Prop lines from multiple books
 * - Supabase: Storage and historical tracking
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { resolve } from 'path'

dotenv.config({ path: resolve(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

const ODDS_API_KEY = process.env.ODDS_API_KEY!

// =============================================================================
// TYPES
// =============================================================================

interface PlayerStats {
  playerId: string
  playerName: string
  team: string
  position: string
  sport: string
  seasonAvg: Record<string, number>
  last5Avg: Record<string, number>
  last10Avg: Record<string, number>
  gameLog: GameLogEntry[]
}

interface GameLogEntry {
  gameId: string
  date: string
  opponent: string
  stats: Record<string, number>
}

interface PropLine {
  book: string
  line: number
  overOdds: number
  underOdds: number
}

interface CollectedProp {
  gameId: string
  sport: string
  playerId: string
  playerName: string
  playerTeam: string
  playerPosition: string
  propType: string
  propCategory: string
  lines: PropLine[]
  bestOver: { book: string; line: number; odds: number } | null
  bestUnder: { book: string; line: number; odds: number } | null
  seasonAvg: number
  last5Avg: number
  last10Avg: number
  hitRateSeason: number
  hitRateLast5: number
  vsOpponentAvg: number | null
  vsOpponentGames: number
  openingLine: number | null
  lineMovement: number
}

// =============================================================================
// ESPN PLAYER STATS
// =============================================================================

const ESPN_SPORT_MAP: Record<string, string> = {
  'NFL': 'football/nfl',
  'NBA': 'basketball/nba',
  'MLB': 'baseball/mlb',
  'NHL': 'hockey/nhl',
  'NCAAF': 'football/college-football',
  'NCAAB': 'basketball/mens-college-basketball'
}

/**
 * Get player game log from ESPN
 */
async function getPlayerGameLog(playerId: string, sport: string): Promise<GameLogEntry[]> {
  try {
    const espnSport = ESPN_SPORT_MAP[sport.toUpperCase()]
    if (!espnSport) return []
    
    const url = `https://site.api.espn.com/apis/common/v3/sports/${espnSport}/athletes/${playerId}/gamelog`
    const res = await fetch(url)
    
    if (!res.ok) return []
    
    const data = await res.json()
    const gameLog: GameLogEntry[] = []
    
    // Parse game log based on sport
    const logs = data.seasonTypes?.[0]?.categories?.[0]?.events || []
    
    for (const game of logs.slice(0, 20)) {
      const stats: Record<string, number> = {}
      
      // NFL-specific parsing
      if (sport === 'NFL') {
        const statLine = game.stats || []
        // Map stat categories from ESPN
        if (statLine[0]) stats.completions = parseFloat(statLine[0]) || 0
        if (statLine[1]) stats.passing_attempts = parseFloat(statLine[1]) || 0
        if (statLine[2]) stats.passing_yards = parseFloat(statLine[2]) || 0
        if (statLine[3]) stats.passing_tds = parseFloat(statLine[3]) || 0
        if (statLine[4]) stats.interceptions = parseFloat(statLine[4]) || 0
        if (statLine[5]) stats.rushing_yards = parseFloat(statLine[5]) || 0
        if (statLine[6]) stats.rushing_tds = parseFloat(statLine[6]) || 0
      }
      // NBA-specific parsing
      else if (sport === 'NBA') {
        const statLine = game.stats || []
        if (statLine[0]) stats.minutes = parseFloat(statLine[0]) || 0
        if (statLine[1]) stats.points = parseFloat(statLine[1]) || 0
        if (statLine[2]) stats.rebounds = parseFloat(statLine[2]) || 0
        if (statLine[3]) stats.assists = parseFloat(statLine[3]) || 0
        if (statLine[4]) stats.steals = parseFloat(statLine[4]) || 0
        if (statLine[5]) stats.blocks = parseFloat(statLine[5]) || 0
      }
      // MLB-specific parsing
      else if (sport === 'MLB') {
        const statLine = game.stats || []
        if (statLine[0]) stats.hits = parseFloat(statLine[0]) || 0
        if (statLine[1]) stats.at_bats = parseFloat(statLine[1]) || 0
        if (statLine[2]) stats.home_runs = parseFloat(statLine[2]) || 0
        if (statLine[3]) stats.rbis = parseFloat(statLine[3]) || 0
        if (statLine[4]) stats.total_bases = parseFloat(statLine[4]) || 0
      }
      // NHL-specific parsing
      else if (sport === 'NHL') {
        const statLine = game.stats || []
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
  } catch (error) {
    console.error(`Error fetching game log for ${playerId}:`, error)
    return []
  }
}

/**
 * Get team roster from ESPN
 */
async function getTeamRoster(teamId: string, sport: string): Promise<{ id: string; name: string; position: string }[]> {
  try {
    const espnSport = ESPN_SPORT_MAP[sport.toUpperCase()]
    if (!espnSport) return []
    
    const url = `https://site.api.espn.com/apis/site/v2/sports/${espnSport}/teams/${teamId}/roster`
    const res = await fetch(url)
    
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
  } catch (error) {
    console.error(`Error fetching roster for ${teamId}:`, error)
    return []
  }
}

// =============================================================================
// THE ODDS API - PROP LINES
// =============================================================================

const ODDS_API_SPORT_MAP: Record<string, string> = {
  'NFL': 'americanfootball_nfl',
  'NBA': 'basketball_nba',
  'MLB': 'baseball_mlb',
  'NHL': 'icehockey_nhl',
  'NCAAF': 'americanfootball_ncaaf',
  'NCAAB': 'basketball_ncaab'
}

const PROP_MARKET_MAP: Record<string, Record<string, string>> = {
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
    rbis: 'batter_rbis',
    strikeouts: 'pitcher_strikeouts'
  },
  NHL: {
    goals: 'player_goals',
    assists: 'player_assists',
    points: 'player_points',
    shots: 'player_shots_on_goal'
  }
}

/**
 * Fetch prop lines from The Odds API
 */
async function fetchPropLines(
  gameId: string,
  sport: string,
  propType: string
): Promise<{ playerId: string; playerName: string; lines: PropLine[] }[]> {
  try {
    const oddsSport = ODDS_API_SPORT_MAP[sport.toUpperCase()]
    const market = PROP_MARKET_MAP[sport.toUpperCase()]?.[propType]
    
    if (!oddsSport || !market) return []
    
    const url = `https://api.the-odds-api.com/v4/sports/${oddsSport}/events/${gameId}/odds?apiKey=${ODDS_API_KEY}&regions=us&markets=${market}&oddsFormat=american`
    const res = await fetch(url)
    
    if (!res.ok) return []
    
    const data = await res.json()
    const results: { playerId: string; playerName: string; lines: PropLine[] }[] = []
    
    // Parse bookmaker odds
    for (const bookmaker of data.bookmakers || []) {
      for (const market of bookmaker.markets || []) {
        for (const outcome of market.outcomes || []) {
          const playerName = outcome.description || outcome.name
          const existing = results.find(r => r.playerName === playerName)
          
          const line: PropLine = {
            book: bookmaker.key,
            line: outcome.point || 0,
            overOdds: outcome.name === 'Over' ? outcome.price : 0,
            underOdds: outcome.name === 'Under' ? outcome.price : 0
          }
          
          if (existing) {
            const existingLine = existing.lines.find(l => l.book === bookmaker.key)
            if (existingLine) {
              if (line.overOdds) existingLine.overOdds = line.overOdds
              if (line.underOdds) existingLine.underOdds = line.underOdds
            } else {
              existing.lines.push(line)
            }
          } else {
            results.push({
              playerId: outcome.description?.toLowerCase().replace(/\s/g, '-') || '',
              playerName,
              lines: [line]
            })
          }
        }
      }
    }
    
    return results
  } catch (error) {
    console.error(`Error fetching prop lines:`, error)
    return []
  }
}

// =============================================================================
// HIT RATE CALCULATIONS
// =============================================================================

function calculateHitRate(
  gameLog: GameLogEntry[],
  statKey: string,
  line: number
): { season: number; last5: number; last10: number } {
  if (gameLog.length === 0) return { season: 0, last5: 0, last10: 0 }
  
  const seasonHits = gameLog.filter(g => (g.stats[statKey] || 0) > line).length
  const last5Games = gameLog.slice(0, 5)
  const last10Games = gameLog.slice(0, 10)
  
  const last5Hits = last5Games.filter(g => (g.stats[statKey] || 0) > line).length
  const last10Hits = last10Games.filter(g => (g.stats[statKey] || 0) > line).length
  
  return {
    season: gameLog.length > 0 ? (seasonHits / gameLog.length) * 100 : 0,
    last5: last5Games.length > 0 ? (last5Hits / last5Games.length) * 100 : 0,
    last10: last10Games.length > 0 ? (last10Hits / last10Games.length) * 100 : 0
  }
}

function calculateAverages(
  gameLog: GameLogEntry[],
  statKey: string
): { season: number; last5: number; last10: number } {
  if (gameLog.length === 0) return { season: 0, last5: 0, last10: 0 }
  
  const seasonTotal = gameLog.reduce((sum, g) => sum + (g.stats[statKey] || 0), 0)
  const last5Games = gameLog.slice(0, 5)
  const last10Games = gameLog.slice(0, 10)
  
  const last5Total = last5Games.reduce((sum, g) => sum + (g.stats[statKey] || 0), 0)
  const last10Total = last10Games.reduce((sum, g) => sum + (g.stats[statKey] || 0), 0)
  
  return {
    season: gameLog.length > 0 ? seasonTotal / gameLog.length : 0,
    last5: last5Games.length > 0 ? last5Total / last5Games.length : 0,
    last10: last10Games.length > 0 ? last10Total / last10Games.length : 0
  }
}

// =============================================================================
// PROP ANALYSIS
// =============================================================================

interface PropAnalysis {
  edge: 'over' | 'under' | 'neutral'
  confidence: number
  factors: string[]
}

function analyzeProp(
  prop: CollectedProp
): PropAnalysis {
  const factors: string[] = []
  let overScore = 0
  let underScore = 0
  
  const consensusLine = prop.lines[0]?.line || 0
  
  // Factor 1: Season average vs line
  if (prop.seasonAvg > consensusLine * 1.1) {
    overScore += 20
    factors.push(`Season avg (${prop.seasonAvg.toFixed(1)}) exceeds line by 10%+`)
  } else if (prop.seasonAvg < consensusLine * 0.9) {
    underScore += 20
    factors.push(`Season avg (${prop.seasonAvg.toFixed(1)}) below line by 10%+`)
  }
  
  // Factor 2: Recent form (last 5)
  if (prop.last5Avg > prop.seasonAvg * 1.15) {
    overScore += 25
    factors.push(`Hot streak: L5 avg (${prop.last5Avg.toFixed(1)}) up 15%+ from season`)
  } else if (prop.last5Avg < prop.seasonAvg * 0.85) {
    underScore += 25
    factors.push(`Cold streak: L5 avg (${prop.last5Avg.toFixed(1)}) down 15%+ from season`)
  }
  
  // Factor 3: Hit rate analysis
  if (prop.hitRateSeason > 65) {
    overScore += 20
    factors.push(`Strong hit rate: ${prop.hitRateSeason.toFixed(0)}% over season`)
  } else if (prop.hitRateSeason < 35) {
    underScore += 20
    factors.push(`Low hit rate: ${prop.hitRateSeason.toFixed(0)}% over season`)
  }
  
  // Factor 4: Recent hit rate trend
  if (prop.hitRateLast5 > prop.hitRateSeason + 20) {
    overScore += 15
    factors.push(`Recent over trend: L5 hit rate ${prop.hitRateLast5.toFixed(0)}%`)
  } else if (prop.hitRateLast5 < prop.hitRateSeason - 20) {
    underScore += 15
    factors.push(`Recent under trend: L5 hit rate ${prop.hitRateLast5.toFixed(0)}%`)
  }
  
  // Factor 5: vs Opponent (if available)
  if (prop.vsOpponentAvg && prop.vsOpponentGames >= 2) {
    if (prop.vsOpponentAvg > prop.seasonAvg * 1.1) {
      overScore += 15
      factors.push(`Favorable matchup: ${prop.vsOpponentAvg.toFixed(1)} avg vs opponent`)
    } else if (prop.vsOpponentAvg < prop.seasonAvg * 0.9) {
      underScore += 15
      factors.push(`Tough matchup: ${prop.vsOpponentAvg.toFixed(1)} avg vs opponent`)
    }
  }
  
  // Factor 6: Line movement
  if (prop.lineMovement >= 1.5) {
    underScore += 10
    factors.push(`Line moved up ${prop.lineMovement.toFixed(1)} points (sharps on under?)`)
  } else if (prop.lineMovement <= -1.5) {
    overScore += 10
    factors.push(`Line moved down ${Math.abs(prop.lineMovement).toFixed(1)} points (sharps on over?)`)
  }
  
  // Determine edge
  const scoreDiff = overScore - underScore
  
  if (scoreDiff >= 30) {
    return { edge: 'over', confidence: Math.min(85, 50 + scoreDiff), factors }
  } else if (scoreDiff <= -30) {
    return { edge: 'under', confidence: Math.min(85, 50 + Math.abs(scoreDiff)), factors }
  }
  
  return { edge: 'neutral', confidence: 30, factors }
}

// =============================================================================
// DATABASE OPERATIONS
// =============================================================================

async function saveProps(props: CollectedProp[]): Promise<number> {
  if (props.length === 0) return 0
  
  const rows = props.map(p => ({
    game_id: p.gameId,
    sport: p.sport,
    player_id: p.playerId,
    player_name: p.playerName,
    player_team: p.playerTeam,
    prop_type: p.propType,
    prop_category: p.propCategory,
    lines: JSON.stringify(p.lines),
    best_over_line: p.bestOver?.line,
    best_over_odds: p.bestOver?.odds,
    best_over_book: p.bestOver?.book,
    best_under_line: p.bestUnder?.line,
    best_under_odds: p.bestUnder?.odds,
    best_under_book: p.bestUnder?.book,
    season_avg: p.seasonAvg,
    last_5_avg: p.last5Avg,
    hit_rate_season: p.hitRateSeason,
    hit_rate_last_5: p.hitRateLast5,
    vs_opponent_avg: p.vsOpponentAvg,
    vs_opponent_games: p.vsOpponentGames,
    opening_line: p.openingLine,
    line_movement: p.lineMovement
  }))
  
  const { error } = await supabase
    .from('player_props')
    .upsert(rows, { onConflict: 'game_id,player_id,prop_type' })
  
  if (error) {
    console.error('Error saving props:', error)
    return 0
  }
  
  return props.length
}

async function savePlayerStats(stats: PlayerStats): Promise<boolean> {
  const { error } = await supabase
    .from('player_stats')
    .upsert({
      player_id: stats.playerId,
      player_name: stats.playerName,
      team: stats.team,
      position: stats.position,
      sport: stats.sport,
      season_avg: stats.seasonAvg,
      last_5_avg: stats.last5Avg,
      last_10_avg: stats.last10Avg,
      game_log: stats.gameLog,
      updated_at: new Date().toISOString()
    }, { onConflict: 'player_id,sport' })
  
  if (error) {
    console.error('Error saving player stats:', error)
    return false
  }
  
  return true
}

// =============================================================================
// MAIN COLLECTION FUNCTIONS
// =============================================================================

async function collectPropsForGame(
  gameId: string,
  sport: string,
  homeTeam: { id: string; name: string },
  awayTeam: { id: string; name: string }
): Promise<CollectedProp[]> {
  const allProps: CollectedProp[] = []
  const propTypes = PROP_MARKET_MAP[sport.toUpperCase()]
  
  if (!propTypes) {
    console.log(`No prop types defined for ${sport}`)
    return []
  }
  
  console.log(`Collecting props for ${awayTeam.name} @ ${homeTeam.name} (${sport})`)
  
  for (const [propType, market] of Object.entries(propTypes)) {
    console.log(`  Fetching ${propType} lines...`)
    
    const propLines = await fetchPropLines(gameId, sport, propType)
    
    for (const playerProp of propLines) {
      // Get player game log for analysis
      const gameLog = await getPlayerGameLog(playerProp.playerId, sport)
      
      // Map prop type to stat key
      const statKey = propType.replace(/_/g, '')
      
      // Calculate averages and hit rates
      const consensusLine = playerProp.lines[0]?.line || 0
      const averages = calculateAverages(gameLog, statKey)
      const hitRates = calculateHitRate(gameLog, statKey, consensusLine)
      
      // Find best lines
      let bestOver: { book: string; line: number; odds: number } | null = null
      let bestUnder: { book: string; line: number; odds: number } | null = null
      
      for (const line of playerProp.lines) {
        // Best over = lowest line with best odds
        if (line.overOdds && (!bestOver || line.line < bestOver.line || 
            (line.line === bestOver.line && line.overOdds > bestOver.odds))) {
          bestOver = { book: line.book, line: line.line, odds: line.overOdds }
        }
        // Best under = highest line with best odds
        if (line.underOdds && (!bestUnder || line.line > bestUnder.line || 
            (line.line === bestUnder.line && line.underOdds > bestUnder.odds))) {
          bestUnder = { book: line.book, line: line.line, odds: line.underOdds }
        }
      }
      
      const prop: CollectedProp = {
        gameId,
        sport,
        playerId: playerProp.playerId,
        playerName: playerProp.playerName,
        playerTeam: '', // Would need roster lookup
        playerPosition: '',
        propType,
        propCategory: propType.split('_')[0],
        lines: playerProp.lines,
        bestOver,
        bestUnder,
        seasonAvg: averages.season,
        last5Avg: averages.last5,
        last10Avg: averages.last10,
        hitRateSeason: hitRates.season,
        hitRateLast5: hitRates.last5,
        vsOpponentAvg: null,
        vsOpponentGames: 0,
        openingLine: null,
        lineMovement: 0
      }
      
      allProps.push(prop)
    }
    
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 200))
  }
  
  return allProps
}

async function collectAllPropsForDate(
  sport: string,
  date: string = new Date().toISOString().split('T')[0]
): Promise<number> {
  console.log(`\n${'='.repeat(60)}`)
  console.log(`COLLECTING ${sport} PROPS FOR ${date}`)
  console.log('='.repeat(60))
  
  let totalProps = 0
  
  try {
    // Get games for the date from ESPN
    const espnSport = ESPN_SPORT_MAP[sport.toUpperCase()]
    if (!espnSport) {
      console.log(`Sport ${sport} not supported`)
      return 0
    }
    
    const scoreboardUrl = `https://site.api.espn.com/apis/site/v2/sports/${espnSport}/scoreboard?dates=${date.replace(/-/g, '')}`
    const res = await fetch(scoreboardUrl)
    
    if (!res.ok) {
      console.log(`Failed to fetch games: ${res.status}`)
      return 0
    }
    
    const data = await res.json()
    const games = data.events || []
    
    console.log(`Found ${games.length} games`)
    
    for (const game of games) {
      const homeTeam = game.competitions?.[0]?.competitors?.find((c: any) => c.homeAway === 'home')
      const awayTeam = game.competitions?.[0]?.competitors?.find((c: any) => c.homeAway === 'away')
      
      if (!homeTeam || !awayTeam) continue
      
      const props = await collectPropsForGame(
        game.id,
        sport,
        { id: homeTeam.team.id, name: homeTeam.team.displayName },
        { id: awayTeam.team.id, name: awayTeam.team.displayName }
      )
      
      if (props.length > 0) {
        const saved = await saveProps(props)
        totalProps += saved
        console.log(`  Saved ${saved} props`)
      }
    }
    
  } catch (error) {
    console.error(`Error collecting props:`, error)
  }
  
  return totalProps
}

// =============================================================================
// CLI
// =============================================================================

async function main() {
  const args = process.argv.slice(2)
  const command = args[0]
  
  console.log('\n' + '='.repeat(60))
  console.log('PLAYER PROP ENGINE')
  console.log('='.repeat(60))
  
  if (!command) {
    console.log(`
Usage:
  npx tsx scripts/collect-player-props.ts today [sport]    # Collect today's props
  npx tsx scripts/collect-player-props.ts game <id> <sport> # Single game
  npx tsx scripts/collect-player-props.ts all              # All sports today
`)
    return
  }
  
  if (command === 'today' || command === 'all') {
    const sports = args[1] ? [args[1].toUpperCase()] : ['NFL', 'NBA', 'NHL', 'MLB']
    
    for (const sport of sports) {
      const count = await collectAllPropsForDate(sport)
      console.log(`Collected ${count} ${sport} props`)
    }
  } else if (command === 'game') {
    const gameId = args[1]
    const sport = args[2]?.toUpperCase() || 'NFL'
    
    if (!gameId) {
      console.log('Game ID required')
      return
    }
    
    const props = await collectPropsForGame(
      gameId,
      sport,
      { id: 'home', name: 'Home Team' },
      { id: 'away', name: 'Away Team' }
    )
    
    const saved = await saveProps(props)
    console.log(`Collected and saved ${saved} props`)
    
    // Show analysis
    for (const prop of props.slice(0, 5)) {
      const analysis = analyzeProp(prop)
      console.log(`\n${prop.playerName} - ${prop.propType}`)
      console.log(`  Line: ${prop.lines[0]?.line || 'N/A'}`)
      console.log(`  Season Avg: ${prop.seasonAvg.toFixed(1)}`)
      console.log(`  L5 Avg: ${prop.last5Avg.toFixed(1)}`)
      console.log(`  Hit Rate: ${prop.hitRateSeason.toFixed(0)}%`)
      console.log(`  Edge: ${analysis.edge.toUpperCase()} (${analysis.confidence}%)`)
      analysis.factors.forEach(f => console.log(`    - ${f}`))
    }
  }
  
  console.log('\nDone!')
}

main().catch(console.error)

// Export for API usage
export {
  collectPropsForGame,
  collectAllPropsForDate,
  analyzeProp,
  getPlayerGameLog,
  calculateHitRate,
  calculateAverages,
  type CollectedProp,
  type PropAnalysis,
  type PlayerStats
}
