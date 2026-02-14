/**
 * CALCULATE ELO RATINGS
 * 
 * Processes historical_games data to compute Elo ratings for all teams
 * Uses standard Elo formula with K-factor adjustments for sports
 * 
 * Run: npx tsx scripts/calculate-elo.ts
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Elo settings per sport
const ELO_CONFIG: Record<string, { kFactor: number; homeAdvantage: number; seasonReset: number }> = {
  nfl: { kFactor: 20, homeAdvantage: 48, seasonReset: 0.75 }, // NFL games are high-impact
  nba: { kFactor: 20, homeAdvantage: 100, seasonReset: 0.75 }, // 82 games, home court matters
  nhl: { kFactor: 8, homeAdvantage: 30, seasonReset: 0.75 },  // 82 games, lower variance
  mlb: { kFactor: 4, homeAdvantage: 24, seasonReset: 0.75 },  // 162 games, very low K
  ncaaf: { kFactor: 24, homeAdvantage: 55, seasonReset: 0.50 }, // Few games, big swings
  ncaab: { kFactor: 12, homeAdvantage: 60, seasonReset: 0.50 }, // ~30 games
}

interface TeamElo {
  abbr: string
  name: string
  elo: number
  gamesPlayed: number
  wins: number
  losses: number
  pointsFor: number
  pointsAgainst: number
  peakElo: number
  lowElo: number
  last5Change: number
  recentChanges: number[]
}

interface Game {
  id: string
  game_date: string
  season: number
  home_team_abbr: string
  away_team_abbr: string
  home_team_name: string
  away_team_name: string
  home_score: number
  away_score: number
}

// Calculate expected win probability
function expectedScore(ratingA: number, ratingB: number): number {
  return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400))
}

// Update Elo after game
function updateElo(
  winnerElo: number,
  loserElo: number,
  kFactor: number,
  homeAdvantage: number,
  winnerIsHome: boolean,
  marginOfVictory: number
): { winnerNew: number; loserNew: number; change: number } {
  // Adjust for home advantage
  const effectiveWinner = winnerIsHome ? winnerElo + homeAdvantage : winnerElo
  const effectiveLoser = winnerIsHome ? loserElo : loserElo + homeAdvantage
  
  // Expected scores
  const expectedWinner = expectedScore(effectiveWinner, effectiveLoser)
  const expectedLoser = 1 - expectedWinner
  
  // Margin of victory multiplier (capped at 2x)
  const movMultiplier = Math.min(2, Math.log(Math.abs(marginOfVictory) + 1) * 0.7 + 0.5)
  
  // Elo change
  const change = kFactor * movMultiplier * (1 - expectedWinner)
  
  return {
    winnerNew: winnerElo + change,
    loserNew: loserElo - change,
    change
  }
}

async function calculateEloForSport(sport: string, season: number) {
  console.log(`\n📊 Processing ${sport.toUpperCase()} ${season}...`)
  
  const config = ELO_CONFIG[sport] || ELO_CONFIG.nfl
  
  // Fetch games ordered by date
  const { data: games, error } = await supabase
    .from('historical_games')
    .select('id, game_date, season, home_team_abbr, away_team_abbr, home_team_name, away_team_name, home_score, away_score')
    .eq('sport', sport)
    .eq('season', season)
    .not('home_score', 'is', null)
    .not('away_score', 'is', null)
    .order('game_date', { ascending: true })
  
  if (error) {
    console.error(`Error fetching games:`, error)
    return
  }
  
  if (!games || games.length === 0) {
    console.log(`No completed games found for ${sport} ${season}`)
    return
  }
  
  console.log(`Found ${games.length} games`)
  
  // Initialize team Elos
  const teamElos: Map<string, TeamElo> = new Map()
  
  // Get existing ratings from previous season for carryover
  const { data: prevRatings } = await supabase
    .from('team_ratings')
    .select('team_abbr, elo_rating')
    .eq('sport', sport)
    .eq('season', season - 1)
  
  const prevEloMap = new Map(prevRatings?.map(r => [r.team_abbr, r.elo_rating]) || [])
  
  // Process each game
  for (const game of games as Game[]) {
    const homeAbbr = game.home_team_abbr?.toUpperCase() || 'UNK'
    const awayAbbr = game.away_team_abbr?.toUpperCase() || 'UNK'
    
    if (homeAbbr === 'UNK' || awayAbbr === 'UNK') continue
    
    // Initialize teams if needed
    if (!teamElos.has(homeAbbr)) {
      const startElo = prevEloMap.has(homeAbbr) 
        ? 1500 + (prevEloMap.get(homeAbbr)! - 1500) * config.seasonReset
        : 1500
      teamElos.set(homeAbbr, {
        abbr: homeAbbr,
        name: game.home_team_name || homeAbbr,
        elo: startElo,
        gamesPlayed: 0,
        wins: 0,
        losses: 0,
        pointsFor: 0,
        pointsAgainst: 0,
        peakElo: startElo,
        lowElo: startElo,
        last5Change: 0,
        recentChanges: []
      })
    }
    
    if (!teamElos.has(awayAbbr)) {
      const startElo = prevEloMap.has(awayAbbr) 
        ? 1500 + (prevEloMap.get(awayAbbr)! - 1500) * config.seasonReset
        : 1500
      teamElos.set(awayAbbr, {
        abbr: awayAbbr,
        name: game.away_team_name || awayAbbr,
        elo: startElo,
        gamesPlayed: 0,
        wins: 0,
        losses: 0,
        pointsFor: 0,
        pointsAgainst: 0,
        peakElo: startElo,
        lowElo: startElo,
        last5Change: 0,
        recentChanges: []
      })
    }
    
    const homeTeam = teamElos.get(homeAbbr)!
    const awayTeam = teamElos.get(awayAbbr)!
    
    const homeScore = game.home_score || 0
    const awayScore = game.away_score || 0
    const margin = Math.abs(homeScore - awayScore)
    const homeWon = homeScore > awayScore
    
    // Update Elo
    const result = updateElo(
      homeWon ? homeTeam.elo : awayTeam.elo,
      homeWon ? awayTeam.elo : homeTeam.elo,
      config.kFactor,
      config.homeAdvantage,
      homeWon,
      margin
    )
    
    // Apply changes
    if (homeWon) {
      homeTeam.elo = result.winnerNew
      awayTeam.elo = result.loserNew
      homeTeam.wins++
      awayTeam.losses++
      homeTeam.recentChanges.push(result.change)
      awayTeam.recentChanges.push(-result.change)
    } else {
      awayTeam.elo = result.winnerNew
      homeTeam.elo = result.loserNew
      awayTeam.wins++
      homeTeam.losses++
      awayTeam.recentChanges.push(result.change)
      homeTeam.recentChanges.push(-result.change)
    }
    
    // Update stats
    homeTeam.gamesPlayed++
    awayTeam.gamesPlayed++
    homeTeam.pointsFor += homeScore
    homeTeam.pointsAgainst += awayScore
    awayTeam.pointsFor += awayScore  
    awayTeam.pointsAgainst += homeScore
    
    // Track peaks/lows
    homeTeam.peakElo = Math.max(homeTeam.peakElo, homeTeam.elo)
    homeTeam.lowElo = Math.min(homeTeam.lowElo, homeTeam.elo)
    awayTeam.peakElo = Math.max(awayTeam.peakElo, awayTeam.elo)
    awayTeam.lowElo = Math.min(awayTeam.lowElo, awayTeam.elo)
    
    // Keep only last 5 changes
    if (homeTeam.recentChanges.length > 5) homeTeam.recentChanges.shift()
    if (awayTeam.recentChanges.length > 5) awayTeam.recentChanges.shift()
  }
  
  // Calculate power ratings and last 5 change
  const avgPointsPerGame = Array.from(teamElos.values())
    .filter(t => t.gamesPlayed > 0)
    .reduce((sum, t) => sum + (t.pointsFor / t.gamesPlayed), 0) / teamElos.size || 100
  
  for (const team of teamElos.values()) {
    if (team.gamesPlayed > 0) {
      team.last5Change = team.recentChanges.reduce((a, b) => a + b, 0)
      const ppg = team.pointsFor / team.gamesPlayed
      const papg = team.pointsAgainst / team.gamesPlayed
      // Power rating: net points above average
      ;(team as TeamElo & { offRating: number; defRating: number; powerRating: number }).offRating = ppg - avgPointsPerGame
      ;(team as TeamElo & { offRating: number; defRating: number; powerRating: number }).defRating = avgPointsPerGame - papg
      ;(team as TeamElo & { offRating: number; defRating: number; powerRating: number }).powerRating = 
        (team as TeamElo & { offRating: number; defRating: number; powerRating: number }).offRating + 
        (team as TeamElo & { offRating: number; defRating: number; powerRating: number }).defRating
    }
  }
  
  // Sort by Elo for ranking
  const sortedTeams = Array.from(teamElos.values())
    .sort((a, b) => b.elo - a.elo)
  
  // Save to database
  const records = sortedTeams.map((team, idx) => ({
    sport,
    team_abbr: team.abbr,
    team_name: team.name,
    elo_rating: Math.round(team.elo * 100) / 100,
    elo_rank: idx + 1,
    power_rating: Math.round(((team as TeamElo & { powerRating: number }).powerRating || 0) * 100) / 100,
    off_rating: Math.round(((team as TeamElo & { offRating: number }).offRating || 0) * 100) / 100,
    def_rating: Math.round(((team as TeamElo & { defRating: number }).defRating || 0) * 100) / 100,
    season,
    games_played: team.gamesPlayed,
    wins: team.wins,
    losses: team.losses,
    last_5_elo_change: Math.round(team.last5Change * 100) / 100,
    peak_elo: Math.round(team.peakElo * 100) / 100,
    low_elo: Math.round(team.lowElo * 100) / 100,
    last_updated: new Date().toISOString()
  }))
  
  // Upsert ratings
  const { error: upsertError } = await supabase
    .from('team_ratings')
    .upsert(records, { onConflict: 'sport,team_abbr,season' })
  
  if (upsertError) {
    console.error(`Error saving ratings:`, upsertError)
  } else {
    console.log(`✅ Saved ${records.length} team ratings`)
    
    // Show top 5
    console.log(`\nTop 5 ${sport.toUpperCase()} teams (Elo):`)
    sortedTeams.slice(0, 5).forEach((t, i) => {
      console.log(`  ${i + 1}. ${t.abbr} - ${Math.round(t.elo)} (${t.wins}-${t.losses})`)
    })
  }
}

async function main() {
  console.log('🏆 CALCULATING ELO RATINGS FROM HISTORICAL GAMES\n')
  console.log('=' .repeat(60))
  
  // Get available seasons from historical_games
  const { data: seasons } = await supabase
    .from('historical_games')
    .select('sport, season')
    .not('home_score', 'is', null)
    .order('season', { ascending: true })
  
  if (!seasons) {
    console.log('No historical games found')
    return
  }
  
  // Get unique sport-season combos
  const sportSeasons = new Map<string, number[]>()
  for (const row of seasons) {
    if (!sportSeasons.has(row.sport)) {
      sportSeasons.set(row.sport, [])
    }
    if (!sportSeasons.get(row.sport)!.includes(row.season)) {
      sportSeasons.get(row.sport)!.push(row.season)
    }
  }
  
  console.log('Found historical data:')
  for (const [sport, ssns] of sportSeasons) {
    console.log(`  ${sport.toUpperCase()}: ${ssns.length} seasons (${Math.min(...ssns)}-${Math.max(...ssns)})`)
  }
  
  // Process each sport/season (just current season for speed)
  const currentYear = new Date().getFullYear()
  
  for (const [sport, ssns] of sportSeasons) {
    // Process last 3 seasons to build up ratings
    const recentSeasons = ssns.filter(s => s >= currentYear - 2).sort((a, b) => a - b)
    for (const season of recentSeasons) {
      await calculateEloForSport(sport, season)
    }
  }
  
  console.log('\n' + '='.repeat(60))
  console.log('✅ ELO CALCULATION COMPLETE')
}

main().catch(console.error)
