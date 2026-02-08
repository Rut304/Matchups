/**
 * HEAD-TO-HEAD DATA LAYER
 * Historical matchup data between teams across all sports
 * 
 * Data Sources:
 * - Supabase historical_games table (primary)
 * - ESPN API (fallback for recent games)
 * - head_to_head_cache table (for quick lookups)
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

// =============================================================================
// TYPES
// =============================================================================

export interface H2HGame {
  id: string
  date: string
  homeTeam: string
  awayTeam: string
  homeScore: number
  awayScore: number
  winner: string
  spread: number | null
  spreadResult: 'home_cover' | 'away_cover' | 'push' | null
  total: number | null
  totalResult: 'over' | 'under' | 'push' | null
  venue: string | null
  isPlayoff: boolean
  isNeutralSite: boolean
}

export interface H2HSummary {
  team1: string
  team2: string
  sport: string
  
  // Overall record
  totalGames: number
  team1Wins: number
  team2Wins: number
  ties: number
  
  // Scoring
  avgTotalPoints: number
  team1AvgScore: number
  team2AvgScore: number
  avgMargin: number
  
  // ATS Records
  team1ATSRecord: { wins: number; losses: number; pushes: number; pct: number }
  team2ATSRecord: { wins: number; losses: number; pushes: number; pct: number }
  
  // O/U Records
  overUnderRecord: { overs: number; unders: number; pushes: number; overPct: number }
  
  // Home/Away splits
  team1HomeRecord: { wins: number; losses: number }
  team2HomeRecord: { wins: number; losses: number }
  
  // Recent trend
  lastWinner: string
  team1LastWins: number // Of last 5
  
  // Recent games (last 10)
  recentGames: H2HGame[]
  
  // Last meeting
  lastMeeting: H2HGame | null
  
  // Streaks
  currentStreak: { team: string; count: number } | null
}

// Sport-specific team name mappings for consistency
const TEAM_ALIASES: Record<string, Record<string, string[]>> = {
  NFL: {
    'KC': ['Kansas City Chiefs', 'Chiefs', 'Kansas City', 'KAN'],
    'BUF': ['Buffalo Bills', 'Bills', 'Buffalo'],
    'SF': ['San Francisco 49ers', '49ers', 'San Francisco', 'SFO'],
    'DAL': ['Dallas Cowboys', 'Cowboys', 'Dallas'],
    'PHI': ['Philadelphia Eagles', 'Eagles', 'Philadelphia'],
    'MIA': ['Miami Dolphins', 'Dolphins', 'Miami'],
    'DET': ['Detroit Lions', 'Lions', 'Detroit'],
    'BAL': ['Baltimore Ravens', 'Ravens', 'Baltimore'],
    'CIN': ['Cincinnati Bengals', 'Bengals', 'Cincinnati'],
    'JAX': ['Jacksonville Jaguars', 'Jaguars', 'Jacksonville', 'JAC'],
    'NYJ': ['New York Jets', 'Jets', 'NY Jets'],
    'NYG': ['New York Giants', 'Giants', 'NY Giants'],
    'GB': ['Green Bay Packers', 'Packers', 'Green Bay'],
    'MIN': ['Minnesota Vikings', 'Vikings', 'Minnesota'],
    'CHI': ['Chicago Bears', 'Bears', 'Chicago'],
    'NE': ['New England Patriots', 'Patriots', 'New England'],
    'LAR': ['Los Angeles Rams', 'Rams', 'LA Rams', 'STL'],
    'LAC': ['Los Angeles Chargers', 'Chargers', 'LA Chargers', 'SD'],
    'LV': ['Las Vegas Raiders', 'Raiders', 'Las Vegas', 'OAK', 'Oakland Raiders'],
    'DEN': ['Denver Broncos', 'Broncos', 'Denver'],
    'SEA': ['Seattle Seahawks', 'Seahawks', 'Seattle'],
    'ARI': ['Arizona Cardinals', 'Cardinals', 'Arizona'],
    'TB': ['Tampa Bay Buccaneers', 'Buccaneers', 'Tampa Bay'],
    'NO': ['New Orleans Saints', 'Saints', 'New Orleans'],
    'CAR': ['Carolina Panthers', 'Panthers', 'Carolina'],
    'ATL': ['Atlanta Falcons', 'Falcons', 'Atlanta'],
    'HOU': ['Houston Texans', 'Texans', 'Houston'],
    'IND': ['Indianapolis Colts', 'Colts', 'Indianapolis'],
    'TEN': ['Tennessee Titans', 'Titans', 'Tennessee'],
    'CLE': ['Cleveland Browns', 'Browns', 'Cleveland'],
    'PIT': ['Pittsburgh Steelers', 'Steelers', 'Pittsburgh'],
    'WSH': ['Washington Commanders', 'Commanders', 'Washington', 'WAS'],
  },
  NBA: {
    'LAL': ['Los Angeles Lakers', 'Lakers', 'LA Lakers'],
    'BOS': ['Boston Celtics', 'Celtics', 'Boston'],
    'GSW': ['Golden State Warriors', 'Warriors', 'Golden State'],
    'MIL': ['Milwaukee Bucks', 'Bucks', 'Milwaukee'],
    'PHX': ['Phoenix Suns', 'Suns', 'Phoenix'],
    'DEN': ['Denver Nuggets', 'Nuggets', 'Denver'],
    'PHI': ['Philadelphia 76ers', '76ers', 'Philadelphia', 'Sixers'],
    'MIA': ['Miami Heat', 'Heat', 'Miami'],
    'DAL': ['Dallas Mavericks', 'Mavericks', 'Dallas', 'Mavs'],
    'LAC': ['Los Angeles Clippers', 'Clippers', 'LA Clippers'],
    'NYK': ['New York Knicks', 'Knicks', 'New York'],
    'BKN': ['Brooklyn Nets', 'Nets', 'Brooklyn'],
    'CHI': ['Chicago Bulls', 'Bulls', 'Chicago'],
    'CLE': ['Cleveland Cavaliers', 'Cavaliers', 'Cleveland', 'Cavs'],
    'ATL': ['Atlanta Hawks', 'Hawks', 'Atlanta'],
    'TOR': ['Toronto Raptors', 'Raptors', 'Toronto'],
    'MIN': ['Minnesota Timberwolves', 'Timberwolves', 'Minnesota', 'Wolves'],
    'OKC': ['Oklahoma City Thunder', 'Thunder', 'Oklahoma City', 'OKC'],
    'SAC': ['Sacramento Kings', 'Kings', 'Sacramento'],
    'POR': ['Portland Trail Blazers', 'Trail Blazers', 'Portland', 'Blazers'],
    'IND': ['Indiana Pacers', 'Pacers', 'Indiana'],
    'NOP': ['New Orleans Pelicans', 'Pelicans', 'New Orleans'],
    'MEM': ['Memphis Grizzlies', 'Grizzlies', 'Memphis'],
    'UTA': ['Utah Jazz', 'Jazz', 'Utah'],
    'ORL': ['Orlando Magic', 'Magic', 'Orlando'],
    'DET': ['Detroit Pistons', 'Pistons', 'Detroit'],
    'HOU': ['Houston Rockets', 'Rockets', 'Houston'],
    'SAS': ['San Antonio Spurs', 'Spurs', 'San Antonio'],
    'CHA': ['Charlotte Hornets', 'Hornets', 'Charlotte'],
    'WAS': ['Washington Wizards', 'Wizards', 'Washington'],
  },
  MLB: {
    'NYY': ['New York Yankees', 'Yankees', 'NY Yankees'],
    'BOS': ['Boston Red Sox', 'Red Sox', 'Boston'],
    'LAD': ['Los Angeles Dodgers', 'Dodgers', 'LA Dodgers'],
    'HOU': ['Houston Astros', 'Astros', 'Houston'],
    'ATL': ['Atlanta Braves', 'Braves', 'Atlanta'],
    'NYM': ['New York Mets', 'Mets', 'NY Mets'],
    'PHI': ['Philadelphia Phillies', 'Phillies', 'Philadelphia'],
    'SD': ['San Diego Padres', 'Padres', 'San Diego'],
    'SF': ['San Francisco Giants', 'Giants', 'San Francisco'],
    'CHC': ['Chicago Cubs', 'Cubs', 'Chicago Cubs'],
    'CWS': ['Chicago White Sox', 'White Sox', 'Chicago White Sox'],
    'STL': ['St. Louis Cardinals', 'Cardinals', 'St. Louis'],
    'TB': ['Tampa Bay Rays', 'Rays', 'Tampa Bay'],
    'TOR': ['Toronto Blue Jays', 'Blue Jays', 'Toronto'],
    'SEA': ['Seattle Mariners', 'Mariners', 'Seattle'],
    'TEX': ['Texas Rangers', 'Rangers', 'Texas'],
    'BAL': ['Baltimore Orioles', 'Orioles', 'Baltimore'],
    'CLE': ['Cleveland Guardians', 'Guardians', 'Cleveland', 'Indians'],
    'MIN': ['Minnesota Twins', 'Twins', 'Minnesota'],
    'DET': ['Detroit Tigers', 'Tigers', 'Detroit'],
    'KC': ['Kansas City Royals', 'Royals', 'Kansas City'],
    'MIL': ['Milwaukee Brewers', 'Brewers', 'Milwaukee'],
    'CIN': ['Cincinnati Reds', 'Reds', 'Cincinnati'],
    'PIT': ['Pittsburgh Pirates', 'Pirates', 'Pittsburgh'],
    'ARI': ['Arizona Diamondbacks', 'Diamondbacks', 'Arizona', 'D-backs'],
    'COL': ['Colorado Rockies', 'Rockies', 'Colorado'],
    'MIA': ['Miami Marlins', 'Marlins', 'Miami'],
    'OAK': ['Oakland Athletics', 'Athletics', 'Oakland', 'A\'s'],
    'LAA': ['Los Angeles Angels', 'Angels', 'LA Angels', 'Anaheim'],
    'WSH': ['Washington Nationals', 'Nationals', 'Washington'],
  },
  NHL: {
    'TOR': ['Toronto Maple Leafs', 'Maple Leafs', 'Toronto'],
    'BOS': ['Boston Bruins', 'Bruins', 'Boston'],
    'NYR': ['New York Rangers', 'Rangers', 'NY Rangers'],
    'EDM': ['Edmonton Oilers', 'Oilers', 'Edmonton'],
    'COL': ['Colorado Avalanche', 'Avalanche', 'Colorado'],
    'VGK': ['Vegas Golden Knights', 'Golden Knights', 'Vegas'],
    'CAR': ['Carolina Hurricanes', 'Hurricanes', 'Carolina'],
    'FLA': ['Florida Panthers', 'Panthers', 'Florida'],
    'TB': ['Tampa Bay Lightning', 'Lightning', 'Tampa Bay'],
    'NYI': ['New York Islanders', 'Islanders', 'NY Islanders'],
    'DAL': ['Dallas Stars', 'Stars', 'Dallas'],
    'MIN': ['Minnesota Wild', 'Wild', 'Minnesota'],
    'WPG': ['Winnipeg Jets', 'Jets', 'Winnipeg'],
    'LA': ['Los Angeles Kings', 'Kings', 'LA Kings'],
    'PIT': ['Pittsburgh Penguins', 'Penguins', 'Pittsburgh'],
    'WSH': ['Washington Capitals', 'Capitals', 'Washington'],
    'DET': ['Detroit Red Wings', 'Red Wings', 'Detroit'],
    'PHI': ['Philadelphia Flyers', 'Flyers', 'Philadelphia'],
    'NJ': ['New Jersey Devils', 'Devils', 'New Jersey'],
    'CGY': ['Calgary Flames', 'Flames', 'Calgary'],
    'VAN': ['Vancouver Canucks', 'Canucks', 'Vancouver'],
    'SEA': ['Seattle Kraken', 'Kraken', 'Seattle'],
    'STL': ['St. Louis Blues', 'Blues', 'St. Louis'],
    'NSH': ['Nashville Predators', 'Predators', 'Nashville'],
    'ARI': ['Arizona Coyotes', 'Coyotes', 'Arizona', 'Utah'],
    'OTT': ['Ottawa Senators', 'Senators', 'Ottawa'],
    'MTL': ['Montreal Canadiens', 'Canadiens', 'Montreal'],
    'BUF': ['Buffalo Sabres', 'Sabres', 'Buffalo'],
    'CHI': ['Chicago Blackhawks', 'Blackhawks', 'Chicago'],
    'SJ': ['San Jose Sharks', 'Sharks', 'San Jose'],
    'ANA': ['Anaheim Ducks', 'Ducks', 'Anaheim'],
    'CBJ': ['Columbus Blue Jackets', 'Blue Jackets', 'Columbus'],
  }
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Normalize team name to standard abbreviation
 */
export function normalizeTeamName(teamName: string, sport: string): string {
  const sportAliases = TEAM_ALIASES[sport.toUpperCase()] || {}
  const normalized = teamName.toUpperCase().trim()
  
  // Check if it's already an abbreviation
  if (sportAliases[normalized]) {
    return normalized
  }
  
  // Search through aliases
  for (const [abbr, aliases] of Object.entries(sportAliases)) {
    for (const alias of aliases) {
      if (alias.toUpperCase() === normalized || 
          normalized.includes(alias.toUpperCase()) ||
          alias.toUpperCase().includes(normalized)) {
        return abbr
      }
    }
  }
  
  // Return first 3 characters as fallback
  return normalized.substring(0, 3)
}

/**
 * Get ordered team pair (alphabetically) for consistent cache keys
 */
function getOrderedTeamPair(team1: string, team2: string): [string, string] {
  return team1 < team2 ? [team1, team2] : [team2, team1]
}

// =============================================================================
// MAIN API FUNCTIONS
// =============================================================================

/**
 * Get head-to-head summary between two teams
 */
export async function getH2HSummary(
  team1: string,
  team2: string,
  sport: string,
  limit: number = 10
): Promise<H2HSummary | null> {
  const t1 = normalizeTeamName(team1, sport)
  const t2 = normalizeTeamName(team2, sport)
  const [teamA, teamB] = getOrderedTeamPair(t1, t2)
  
  try {
    // First check cache
    const { data: cached } = await supabase
      .from('head_to_head_cache')
      .select('*')
      .eq('team_a', teamA)
      .eq('team_b', teamB)
      .eq('sport', sport.toUpperCase())
      .single()
    
    if (cached && isRecentCache(cached.cache_updated_at)) {
      return formatCachedH2H(cached, t1, t2)
    }
    
    // Fetch from historical games
    const h2hGames = await fetchH2HGames(t1, t2, sport, 25)
    
    if (h2hGames.length === 0) {
      return getEmptyH2HSummary(t1, t2, sport)
    }
    
    // Calculate summary
    const summary = calculateH2HSummary(h2hGames, t1, t2, sport, limit)
    
    // Update cache in background
    updateH2HCache(teamA, teamB, sport, summary).catch(console.error)
    
    return summary
  } catch (error) {
    console.error('Error fetching H2H summary:', error)
    return getEmptyH2HSummary(t1, t2, sport)
  }
}

/**
 * Fetch H2H games between two teams from historical data
 */
async function fetchH2HGames(
  team1: string,
  team2: string,
  sport: string,
  limit: number = 25
): Promise<H2HGame[]> {
  // Query for games where either team is home or away
  const { data, error } = await supabase
    .from('historical_games')
    .select('*')
    .eq('sport', sport.toLowerCase())
    .or(`and(home_team_abbr.eq.${team1},away_team_abbr.eq.${team2}),and(home_team_abbr.eq.${team2},away_team_abbr.eq.${team1})`)
    .order('game_date', { ascending: false })
    .limit(limit)
  
  if (error) {
    console.error('Error fetching H2H games:', error)
    return []
  }
  
  return (data || []).map(game => ({
    id: game.id,
    date: game.game_date,
    homeTeam: game.home_team_abbr || game.home_team_name,
    awayTeam: game.away_team_abbr || game.away_team_name,
    homeScore: game.home_score,
    awayScore: game.away_score,
    winner: game.home_score > game.away_score 
      ? (game.home_team_abbr || game.home_team_name)
      : game.home_score < game.away_score 
        ? (game.away_team_abbr || game.away_team_name)
        : 'TIE',
    spread: game.point_spread,
    spreadResult: game.spread_result,
    total: game.over_under,
    totalResult: game.total_result,
    venue: game.venue,
    isPlayoff: game.season_type === 'postseason',
    isNeutralSite: game.is_neutral_site || false
  }))
}

/**
 * Calculate H2H summary from games
 */
function calculateH2HSummary(
  games: H2HGame[],
  team1: string,
  team2: string,
  sport: string,
  recentLimit: number
): H2HSummary {
  let team1Wins = 0
  let team2Wins = 0
  let ties = 0
  let totalPoints = 0
  let team1TotalScore = 0
  let team2TotalScore = 0
  let team1ATSWins = 0, team1ATSLosses = 0, team1ATSPushes = 0
  let overs = 0, unders = 0, ouPushes = 0
  let team1HomeWins = 0, team1HomeLosses = 0
  let team2HomeWins = 0, team2HomeLosses = 0
  
  for (const game of games) {
    const team1IsHome = game.homeTeam === team1
    const team1Score = team1IsHome ? game.homeScore : game.awayScore
    const team2Score = team1IsHome ? game.awayScore : game.homeScore
    
    // Overall record
    if (game.winner === team1) team1Wins++
    else if (game.winner === team2) team2Wins++
    else ties++
    
    // Scoring
    totalPoints += game.homeScore + game.awayScore
    team1TotalScore += team1Score
    team2TotalScore += team2Score
    
    // ATS (from team1 perspective)
    if (game.spreadResult) {
      const team1Covered = 
        (team1IsHome && game.spreadResult === 'home_cover') ||
        (!team1IsHome && game.spreadResult === 'away_cover')
      
      if (game.spreadResult === 'push') team1ATSPushes++
      else if (team1Covered) team1ATSWins++
      else team1ATSLosses++
    }
    
    // O/U
    if (game.totalResult === 'over') overs++
    else if (game.totalResult === 'under') unders++
    else if (game.totalResult === 'push') ouPushes++
    
    // Home/Away splits
    if (team1IsHome) {
      if (game.winner === team1) team1HomeWins++
      else if (game.winner === team2) team1HomeLosses++
    } else {
      if (game.winner === team2) team2HomeWins++
      else if (game.winner === team1) team2HomeLosses++
    }
  }
  
  const gamesCount = games.length
  const atsGames = team1ATSWins + team1ATSLosses + team1ATSPushes
  const ouGames = overs + unders + ouPushes
  
  // Calculate streak
  let streak: { team: string; count: number } | null = null
  if (games.length > 0) {
    const lastWinner = games[0].winner
    if (lastWinner !== 'TIE') {
      let count = 0
      for (const game of games) {
        if (game.winner === lastWinner) count++
        else break
      }
      streak = { team: lastWinner, count }
    }
  }
  
  // Last 5 wins
  const last5 = games.slice(0, 5)
  const team1Last5Wins = last5.filter(g => g.winner === team1).length
  
  return {
    team1,
    team2,
    sport,
    totalGames: gamesCount,
    team1Wins,
    team2Wins,
    ties,
    avgTotalPoints: gamesCount > 0 ? Math.round((totalPoints / gamesCount) * 10) / 10 : 0,
    team1AvgScore: gamesCount > 0 ? Math.round((team1TotalScore / gamesCount) * 10) / 10 : 0,
    team2AvgScore: gamesCount > 0 ? Math.round((team2TotalScore / gamesCount) * 10) / 10 : 0,
    avgMargin: gamesCount > 0 ? Math.round(Math.abs(team1TotalScore - team2TotalScore) / gamesCount * 10) / 10 : 0,
    team1ATSRecord: {
      wins: team1ATSWins,
      losses: team1ATSLosses,
      pushes: team1ATSPushes,
      pct: atsGames > 0 ? Math.round((team1ATSWins / atsGames) * 1000) / 10 : 0
    },
    team2ATSRecord: {
      wins: team1ATSLosses,
      losses: team1ATSWins,
      pushes: team1ATSPushes,
      pct: atsGames > 0 ? Math.round((team1ATSLosses / atsGames) * 1000) / 10 : 0
    },
    overUnderRecord: {
      overs,
      unders,
      pushes: ouPushes,
      overPct: ouGames > 0 ? Math.round((overs / ouGames) * 1000) / 10 : 0
    },
    team1HomeRecord: { wins: team1HomeWins, losses: team1HomeLosses },
    team2HomeRecord: { wins: team2HomeWins, losses: team2HomeLosses },
    lastWinner: games.length > 0 ? games[0].winner : '',
    team1LastWins: team1Last5Wins,
    recentGames: games.slice(0, recentLimit),
    lastMeeting: games.length > 0 ? games[0] : null,
    currentStreak: streak
  }
}

/**
 * Get empty H2H summary when no data available
 */
function getEmptyH2HSummary(team1: string, team2: string, sport: string): H2HSummary {
  return {
    team1,
    team2,
    sport,
    totalGames: 0,
    team1Wins: 0,
    team2Wins: 0,
    ties: 0,
    avgTotalPoints: 0,
    team1AvgScore: 0,
    team2AvgScore: 0,
    avgMargin: 0,
    team1ATSRecord: { wins: 0, losses: 0, pushes: 0, pct: 0 },
    team2ATSRecord: { wins: 0, losses: 0, pushes: 0, pct: 0 },
    overUnderRecord: { overs: 0, unders: 0, pushes: 0, overPct: 0 },
    team1HomeRecord: { wins: 0, losses: 0 },
    team2HomeRecord: { wins: 0, losses: 0 },
    lastWinner: '',
    team1LastWins: 0,
    recentGames: [],
    lastMeeting: null,
    currentStreak: null
  }
}

/**
 * Check if cache is recent (within 24 hours)
 */
function isRecentCache(updatedAt: string): boolean {
  const cacheTime = new Date(updatedAt).getTime()
  const now = Date.now()
  const hoursDiff = (now - cacheTime) / (1000 * 60 * 60)
  return hoursDiff < 24
}

/**
 * Format cached H2H data
 */
function formatCachedH2H(cached: Record<string, unknown>, team1: string, team2: string): H2HSummary {
  const isTeam1First = cached.team_a === team1
  
  return {
    team1,
    team2,
    sport: cached.sport as string,
    totalGames: cached.total_games as number,
    team1Wins: isTeam1First ? (cached.team_a_wins as number) : (cached.team_b_wins as number),
    team2Wins: isTeam1First ? (cached.team_b_wins as number) : (cached.team_a_wins as number),
    ties: cached.ties as number,
    avgTotalPoints: cached.avg_total_points as number,
    team1AvgScore: isTeam1First ? (cached.team_a_avg_score as number) : (cached.team_b_avg_score as number),
    team2AvgScore: isTeam1First ? (cached.team_b_avg_score as number) : (cached.team_a_avg_score as number),
    avgMargin: cached.avg_margin as number,
    team1ATSRecord: {
      wins: isTeam1First ? (cached.team_a_ats_wins as number) : (cached.team_a_ats_losses as number),
      losses: isTeam1First ? (cached.team_a_ats_losses as number) : (cached.team_a_ats_wins as number),
      pushes: cached.team_a_ats_pushes as number,
      pct: 0
    },
    team2ATSRecord: {
      wins: isTeam1First ? (cached.team_a_ats_losses as number) : (cached.team_a_ats_wins as number),
      losses: isTeam1First ? (cached.team_a_ats_wins as number) : (cached.team_a_ats_losses as number),
      pushes: cached.team_a_ats_pushes as number,
      pct: 0
    },
    overUnderRecord: {
      overs: cached.overs as number,
      unders: cached.unders as number,
      pushes: cached.total_pushes as number,
      overPct: 0
    },
    team1HomeRecord: (isTeam1First ? cached.team_a_home_record : cached.team_b_home_record) as { wins: number; losses: number } || { wins: 0, losses: 0 },
    team2HomeRecord: (isTeam1First ? cached.team_b_home_record : cached.team_a_home_record) as { wins: number; losses: number } || { wins: 0, losses: 0 },
    lastWinner: '',
    team1LastWins: 0,
    recentGames: (cached.recent_games || []) as H2HGame[],
    lastMeeting: null,
    currentStreak: null
  }
}

/**
 * Update H2H cache
 */
async function updateH2HCache(
  teamA: string,
  teamB: string,
  sport: string,
  summary: H2HSummary
): Promise<void> {
  const isTeamAFirst = summary.team1 === teamA
  
  await supabase
    .from('head_to_head_cache')
    .upsert({
      team_a: teamA,
      team_b: teamB,
      sport: sport.toUpperCase(),
      total_games: summary.totalGames,
      team_a_wins: isTeamAFirst ? summary.team1Wins : summary.team2Wins,
      team_b_wins: isTeamAFirst ? summary.team2Wins : summary.team1Wins,
      ties: summary.ties,
      avg_total_points: summary.avgTotalPoints,
      avg_margin: summary.avgMargin,
      team_a_avg_score: isTeamAFirst ? summary.team1AvgScore : summary.team2AvgScore,
      team_b_avg_score: isTeamAFirst ? summary.team2AvgScore : summary.team1AvgScore,
      team_a_ats_wins: isTeamAFirst ? summary.team1ATSRecord.wins : summary.team2ATSRecord.wins,
      team_a_ats_losses: isTeamAFirst ? summary.team1ATSRecord.losses : summary.team2ATSRecord.losses,
      team_a_ats_pushes: summary.team1ATSRecord.pushes,
      overs: summary.overUnderRecord.overs,
      unders: summary.overUnderRecord.unders,
      total_pushes: summary.overUnderRecord.pushes,
      team_a_home_record: isTeamAFirst ? summary.team1HomeRecord : summary.team2HomeRecord,
      team_b_home_record: isTeamAFirst ? summary.team2HomeRecord : summary.team1HomeRecord,
      recent_games: summary.recentGames.slice(0, 10),
      cache_updated_at: new Date().toISOString()
    }, {
      onConflict: 'team_a,team_b,sport'
    })
}

/**
 * Get recent H2H games (for display)
 */
export async function getRecentH2HGames(
  team1: string,
  team2: string,
  sport: string,
  limit: number = 5
): Promise<H2HGame[]> {
  const t1 = normalizeTeamName(team1, sport)
  const t2 = normalizeTeamName(team2, sport)
  
  return fetchH2HGames(t1, t2, sport, limit)
}

/**
 * Get H2H betting trends
 */
export async function getH2HBettingTrends(
  team1: string,
  team2: string,
  sport: string
): Promise<{
  spreadTrend: string
  totalTrend: string
  homeAwayTrend: string
  notableStreak: string | null
}> {
  const summary = await getH2HSummary(team1, team2, sport, 10)
  
  if (!summary || summary.totalGames < 3) {
    return {
      spreadTrend: 'Insufficient data',
      totalTrend: 'Insufficient data',
      homeAwayTrend: 'Insufficient data',
      notableStreak: null
    }
  }
  
  const t1 = normalizeTeamName(team1, sport)
  
  // Spread trend
  const atsPct = summary.team1ATSRecord.pct
  let spreadTrend = `${t1} is ${summary.team1ATSRecord.wins}-${summary.team1ATSRecord.losses} ATS`
  if (atsPct >= 60) spreadTrend += ` (covers ${atsPct.toFixed(0)}%)`
  else if (atsPct <= 40) spreadTrend += ` (struggles to cover)`
  
  // Total trend
  const overPct = summary.overUnderRecord.overPct
  let totalTrend = `Over is ${summary.overUnderRecord.overs}-${summary.overUnderRecord.unders}`
  if (overPct >= 60) totalTrend += ` (OVER hits ${overPct.toFixed(0)}%)`
  else if (overPct <= 40) totalTrend += ` (UNDER hits ${(100 - overPct).toFixed(0)}%)`
  else totalTrend += ' (split)'
  
  // Home/Away
  const homeWinPct = (summary.team1HomeRecord.wins / (summary.team1HomeRecord.wins + summary.team1HomeRecord.losses)) * 100 || 0
  let homeAwayTrend = `Home team wins ${homeWinPct.toFixed(0)}% in this matchup`
  
  // Notable streak
  let notableStreak = null
  if (summary.currentStreak && summary.currentStreak.count >= 3) {
    notableStreak = `${summary.currentStreak.team} has won ${summary.currentStreak.count} straight in this matchup`
  }
  
  return { spreadTrend, totalTrend, homeAwayTrend, notableStreak }
}
