/**
 * Free Sports API Endpoints
 * Collection of free/public APIs for sports data
 * No API keys required for most endpoints
 */

// ===========================================
// ESPN APIs (No API Key Required)
// ===========================================
export const ESPN_APIS = {
  // NFL
  nfl: {
    scoreboard: 'https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard',
    news: 'https://site.api.espn.com/apis/site/v2/sports/football/nfl/news',
    teams: 'https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams',
    standings: 'https://site.api.espn.com/apis/v2/sports/football/nfl/standings',
    // Team-specific: append ?team={teamId}
    teamRoster: (teamId: string) => `https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams/${teamId}/roster`,
    teamSchedule: (teamId: string) => `https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams/${teamId}/schedule`,
    teamStats: (teamId: string) => `https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams/${teamId}/statistics`,
    // Game-specific
    gameBoxscore: (gameId: string) => `https://site.api.espn.com/apis/site/v2/sports/football/nfl/summary?event=${gameId}`,
    gamePlays: (gameId: string) => `https://site.api.espn.com/apis/site/v2/sports/football/nfl/playbyplay?event=${gameId}`,
    // Players
    athletes: 'https://site.api.espn.com/apis/site/v2/sports/football/nfl/athletes',
    athleteStats: (athleteId: string) => `https://site.api.espn.com/apis/site/v2/sports/football/nfl/athletes/${athleteId}/statistics`,
  },
  
  // NBA
  nba: {
    scoreboard: 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard',
    news: 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba/news',
    teams: 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba/teams',
    standings: 'https://site.api.espn.com/apis/v2/sports/basketball/nba/standings',
    teamRoster: (teamId: string) => `https://site.api.espn.com/apis/site/v2/sports/basketball/nba/teams/${teamId}/roster`,
    teamSchedule: (teamId: string) => `https://site.api.espn.com/apis/site/v2/sports/basketball/nba/teams/${teamId}/schedule`,
    teamStats: (teamId: string) => `https://site.api.espn.com/apis/site/v2/sports/basketball/nba/teams/${teamId}/statistics`,
    gameBoxscore: (gameId: string) => `https://site.api.espn.com/apis/site/v2/sports/basketball/nba/summary?event=${gameId}`,
    gamePlays: (gameId: string) => `https://site.api.espn.com/apis/site/v2/sports/basketball/nba/playbyplay?event=${gameId}`,
    athletes: 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba/athletes',
    athleteStats: (athleteId: string) => `https://site.api.espn.com/apis/site/v2/sports/basketball/nba/athletes/${athleteId}/statistics`,
  },
  
  // NHL
  nhl: {
    scoreboard: 'https://site.api.espn.com/apis/site/v2/sports/hockey/nhl/scoreboard',
    news: 'https://site.api.espn.com/apis/site/v2/sports/hockey/nhl/news',
    teams: 'https://site.api.espn.com/apis/site/v2/sports/hockey/nhl/teams',
    standings: 'https://site.api.espn.com/apis/v2/sports/hockey/nhl/standings',
    teamRoster: (teamId: string) => `https://site.api.espn.com/apis/site/v2/sports/hockey/nhl/teams/${teamId}/roster`,
    teamSchedule: (teamId: string) => `https://site.api.espn.com/apis/site/v2/sports/hockey/nhl/teams/${teamId}/schedule`,
    gameBoxscore: (gameId: string) => `https://site.api.espn.com/apis/site/v2/sports/hockey/nhl/summary?event=${gameId}`,
  },
  
  // MLB
  mlb: {
    scoreboard: 'https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/scoreboard',
    news: 'https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/news',
    teams: 'https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/teams',
    standings: 'https://site.api.espn.com/apis/v2/sports/baseball/mlb/standings',
    teamRoster: (teamId: string) => `https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/teams/${teamId}/roster`,
    teamSchedule: (teamId: string) => `https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/teams/${teamId}/schedule`,
    gameBoxscore: (gameId: string) => `https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/summary?event=${gameId}`,
  },
  
  // College Football
  ncaaf: {
    scoreboard: 'https://site.api.espn.com/apis/site/v2/sports/football/college-football/scoreboard',
    news: 'https://site.api.espn.com/apis/site/v2/sports/football/college-football/news',
    teams: 'https://site.api.espn.com/apis/site/v2/sports/football/college-football/teams',
    rankings: 'https://site.api.espn.com/apis/site/v2/sports/football/college-football/rankings',
    standings: 'https://site.api.espn.com/apis/v2/sports/football/college-football/standings',
    gameBoxscore: (gameId: string) => `https://site.api.espn.com/apis/site/v2/sports/football/college-football/summary?event=${gameId}`,
  },
  
  // College Basketball
  ncaab: {
    scoreboard: 'https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/scoreboard',
    news: 'https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/news',
    teams: 'https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/teams',
    rankings: 'https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/rankings',
    standings: 'https://site.api.espn.com/apis/v2/sports/basketball/mens-college-basketball/standings',
    gameBoxscore: (gameId: string) => `https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/summary?event=${gameId}`,
  },
  
  // WNBA
  wnba: {
    scoreboard: 'https://site.api.espn.com/apis/site/v2/sports/basketball/wnba/scoreboard',
    news: 'https://site.api.espn.com/apis/site/v2/sports/basketball/wnba/news',
    teams: 'https://site.api.espn.com/apis/site/v2/sports/basketball/wnba/teams',
    standings: 'https://site.api.espn.com/apis/v2/sports/basketball/wnba/standings',
  },
  
  // Soccer (MLS, EPL, etc.)
  soccer: {
    mls: {
      scoreboard: 'https://site.api.espn.com/apis/site/v2/sports/soccer/usa.1/scoreboard',
      standings: 'https://site.api.espn.com/apis/v2/sports/soccer/usa.1/standings',
    },
    epl: {
      scoreboard: 'https://site.api.espn.com/apis/site/v2/sports/soccer/eng.1/scoreboard',
      standings: 'https://site.api.espn.com/apis/v2/sports/soccer/eng.1/standings',
    },
    laliga: {
      scoreboard: 'https://site.api.espn.com/apis/site/v2/sports/soccer/esp.1/scoreboard',
      standings: 'https://site.api.espn.com/apis/v2/sports/soccer/esp.1/standings',
    },
  },
}

// ===========================================
// Official NHL API (No API Key Required)
// ===========================================
export const NHL_API = {
  // Base URL
  base: 'https://api-web.nhle.com/v1',
  
  // Schedule & Scores
  schedule: (date: string) => `https://api-web.nhle.com/v1/schedule/${date}`, // YYYY-MM-DD
  scheduleNow: 'https://api-web.nhle.com/v1/schedule/now',
  
  // Standings
  standings: (date?: string) => date 
    ? `https://api-web.nhle.com/v1/standings/${date}` 
    : 'https://api-web.nhle.com/v1/standings/now',
  
  // Teams
  teams: 'https://api.nhle.com/stats/rest/en/team',
  teamRoster: (teamAbbr: string) => `https://api-web.nhle.com/v1/roster/${teamAbbr}/current`,
  teamSchedule: (teamAbbr: string) => `https://api-web.nhle.com/v1/club-schedule/${teamAbbr}/week/now`,
  teamStats: (teamAbbr: string) => `https://api-web.nhle.com/v1/club-stats/${teamAbbr}/now`,
  
  // Players
  playerStats: (playerId: string) => `https://api-web.nhle.com/v1/player/${playerId}/landing`,
  playerGameLog: (playerId: string, season: string) => `https://api-web.nhle.com/v1/player/${playerId}/game-log/${season}/2`, // 2 = regular season
  
  // Games
  gameBoxscore: (gameId: string) => `https://api-web.nhle.com/v1/gamecenter/${gameId}/boxscore`,
  gamePlays: (gameId: string) => `https://api-web.nhle.com/v1/gamecenter/${gameId}/play-by-play`,
  gameLanding: (gameId: string) => `https://api-web.nhle.com/v1/gamecenter/${gameId}/landing`,
  
  // Stats Leaders
  skaterLeaders: 'https://api-web.nhle.com/v1/skater-stats-leaders/current',
  goalieLeaders: 'https://api-web.nhle.com/v1/goalie-stats-leaders/current',
}

// ===========================================
// Official MLB Stats API (No API Key Required)
// ===========================================
export const MLB_API = {
  // Base URL
  base: 'https://statsapi.mlb.com/api/v1',
  
  // Schedule
  schedule: (date: string) => `https://statsapi.mlb.com/api/v1/schedule?sportId=1&date=${date}`, // YYYY-MM-DD
  scheduleRange: (start: string, end: string) => `https://statsapi.mlb.com/api/v1/schedule?sportId=1&startDate=${start}&endDate=${end}`,
  
  // Standings
  standings: (leagueId: number = 103) => `https://statsapi.mlb.com/api/v1/standings?leagueId=${leagueId}`, // 103=AL, 104=NL
  standingsAll: 'https://statsapi.mlb.com/api/v1/standings?leagueId=103,104',
  
  // Teams
  teams: 'https://statsapi.mlb.com/api/v1/teams?sportId=1',
  teamRoster: (teamId: number) => `https://statsapi.mlb.com/api/v1/teams/${teamId}/roster`,
  teamStats: (teamId: number, season: number) => `https://statsapi.mlb.com/api/v1/teams/${teamId}/stats?stats=season&season=${season}&group=hitting,pitching`,
  
  // Players
  player: (playerId: number) => `https://statsapi.mlb.com/api/v1/people/${playerId}`,
  playerStats: (playerId: number, season: number) => `https://statsapi.mlb.com/api/v1/people/${playerId}/stats?stats=season&season=${season}`,
  playerGameLog: (playerId: number, season: number) => `https://statsapi.mlb.com/api/v1/people/${playerId}/stats?stats=gameLog&season=${season}`,
  
  // Games
  game: (gamePk: number) => `https://statsapi.mlb.com/api/v1.1/game/${gamePk}/feed/live`,
  gameBoxscore: (gamePk: number) => `https://statsapi.mlb.com/api/v1/game/${gamePk}/boxscore`,
  gamePlays: (gamePk: number) => `https://statsapi.mlb.com/api/v1/game/${gamePk}/playByPlay`,
  gameLinescore: (gamePk: number) => `https://statsapi.mlb.com/api/v1/game/${gamePk}/linescore`,
  
  // Stats Leaders
  leaders: (category: string, season: number) => `https://statsapi.mlb.com/api/v1/stats/leaders?leaderCategories=${category}&season=${season}&sportId=1`,
}

// ===========================================
// Ball Don't Lie NBA API (Free, No Key)
// ===========================================
export const BALLDONTLIE_API = {
  base: 'https://api.balldontlie.io/v1',
  
  // Teams
  teams: 'https://api.balldontlie.io/v1/teams',
  team: (id: number) => `https://api.balldontlie.io/v1/teams/${id}`,
  
  // Players - requires API key now (free tier available)
  players: 'https://api.balldontlie.io/v1/players',
  player: (id: number) => `https://api.balldontlie.io/v1/players/${id}`,
  
  // Games
  games: 'https://api.balldontlie.io/v1/games',
  game: (id: number) => `https://api.balldontlie.io/v1/games/${id}`,
  
  // Stats
  stats: 'https://api.balldontlie.io/v1/stats',
  seasonAverages: (season: number, playerIds: number[]) => 
    `https://api.balldontlie.io/v1/season_averages?season=${season}&player_ids[]=${playerIds.join('&player_ids[]=')}`,
}

// ===========================================
// TheSportsDB (Free Tier - No Key for basic)
// ===========================================
export const SPORTSDB_API = {
  base: 'https://www.thesportsdb.com/api/v1/json/3', // 3 is free API key
  
  // Leagues
  allLeagues: 'https://www.thesportsdb.com/api/v1/json/3/all_leagues.php',
  leagueSeasons: (leagueId: string) => `https://www.thesportsdb.com/api/v1/json/3/search_all_seasons.php?id=${leagueId}`,
  
  // Teams
  teamsInLeague: (league: string) => `https://www.thesportsdb.com/api/v1/json/3/search_all_teams.php?l=${encodeURIComponent(league)}`,
  teamDetails: (teamId: string) => `https://www.thesportsdb.com/api/v1/json/3/lookupteam.php?id=${teamId}`,
  teamByName: (name: string) => `https://www.thesportsdb.com/api/v1/json/3/searchteams.php?t=${encodeURIComponent(name)}`,
  
  // Players
  playersOnTeam: (teamId: string) => `https://www.thesportsdb.com/api/v1/json/3/lookup_all_players.php?id=${teamId}`,
  playerByName: (name: string) => `https://www.thesportsdb.com/api/v1/json/3/searchplayers.php?p=${encodeURIComponent(name)}`,
  
  // Events/Games
  eventsInLeague: (leagueId: string, season: string) => `https://www.thesportsdb.com/api/v1/json/3/eventsseason.php?id=${leagueId}&s=${season}`,
  eventDetails: (eventId: string) => `https://www.thesportsdb.com/api/v1/json/3/lookupevent.php?id=${eventId}`,
  last5Events: (teamId: string) => `https://www.thesportsdb.com/api/v1/json/3/eventslast.php?id=${teamId}`,
  next5Events: (teamId: string) => `https://www.thesportsdb.com/api/v1/json/3/eventsnext.php?id=${teamId}`,
  
  // Live Scores (limited on free tier)
  liveScores: (sport: string) => `https://www.thesportsdb.com/api/v2/json/3/livescore.php?s=${sport}`,
}

// ===========================================
// NBA.com Stats API (Unofficial but free)
// ===========================================
export const NBA_STATS_API = {
  base: 'https://stats.nba.com/stats',
  
  // Headers required for NBA.com
  headers: {
    'User-Agent': 'Mozilla/5.0',
    'Accept': 'application/json',
    'Referer': 'https://www.nba.com/',
    'Origin': 'https://www.nba.com',
  },
  
  // Endpoints
  scoreboard: (gameDate: string) => `https://stats.nba.com/stats/scoreboardv2?GameDate=${gameDate}&LeagueID=00`,
  teamStats: 'https://stats.nba.com/stats/leaguedashteamstats?Season=2024-25&SeasonType=Regular%20Season',
  playerStats: 'https://stats.nba.com/stats/leaguedashplayerstats?Season=2024-25&SeasonType=Regular%20Season',
  leagueLeaders: (season: string) => `https://stats.nba.com/stats/leagueleaders?LeagueID=00&PerMode=PerGame&Season=${season}&SeasonType=Regular%20Season`,
}

// ===========================================
// Helper Functions
// ===========================================

export type SportType = 'nfl' | 'nba' | 'nhl' | 'mlb' | 'ncaaf' | 'ncaab' | 'wnba' | 'soccer'

export async function fetchESPN(sport: SportType, endpoint: 'scoreboard' | 'standings' | 'news' | 'teams' | 'rankings') {
  const sportEndpoints = ESPN_APIS[sport]
  if (!sportEndpoints || !(endpoint in sportEndpoints)) {
    throw new Error(`Invalid sport (${sport}) or endpoint (${endpoint})`)
  }
  
  const url = sportEndpoints[endpoint as keyof typeof sportEndpoints]
  if (typeof url !== 'string') {
    throw new Error(`Endpoint ${endpoint} requires parameters`)
  }
  
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`ESPN API error: ${response.status}`)
  }
  return response.json()
}

export async function fetchNHLSchedule(date?: string) {
  const url = date ? NHL_API.schedule(date) : NHL_API.scheduleNow
  const response = await fetch(url)
  if (!response.ok) throw new Error(`NHL API error: ${response.status}`)
  return response.json()
}

export async function fetchMLBSchedule(date: string) {
  const url = MLB_API.schedule(date)
  const response = await fetch(url)
  if (!response.ok) throw new Error(`MLB API error: ${response.status}`)
  return response.json()
}

export async function fetchESPNBoxscore(sport: SportType, gameId: string) {
  const sportEndpoints = ESPN_APIS[sport]
  if (!sportEndpoints || !('gameBoxscore' in sportEndpoints)) {
    throw new Error(`Invalid sport: ${sport}`)
  }
  
  const urlFn = sportEndpoints.gameBoxscore as (id: string) => string
  const response = await fetch(urlFn(gameId))
  if (!response.ok) throw new Error(`ESPN API error: ${response.status}`)
  return response.json()
}

export async function fetchESPNPlayByPlay(sport: SportType, gameId: string) {
  const sportEndpoints = ESPN_APIS[sport]
  if (!sportEndpoints || !('gamePlays' in sportEndpoints)) {
    throw new Error(`Invalid sport: ${sport}`)
  }
  
  const urlFn = sportEndpoints.gamePlays as (id: string) => string
  const response = await fetch(urlFn(gameId))
  if (!response.ok) throw new Error(`ESPN API error: ${response.status}`)
  return response.json()
}

export async function fetchTeamStats(sport: SportType, teamId: string) {
  const sportEndpoints = ESPN_APIS[sport]
  if (!sportEndpoints || !('teamStats' in sportEndpoints)) {
    throw new Error(`Invalid sport: ${sport}`)
  }
  
  const urlFn = sportEndpoints.teamStats as (id: string) => string
  const response = await fetch(urlFn(teamId))
  if (!response.ok) throw new Error(`ESPN API error: ${response.status}`)
  return response.json()
}

// ===========================================
// Aggregate Data Fetcher
// ===========================================

export interface SportsDataContext {
  nfl?: { games: any[]; standings: any }
  nba?: { games: any[]; standings: any }
  nhl?: { games: any[]; standings: any }
  mlb?: { games: any[]; standings: any }
}

export async function fetchAllSportsContext(): Promise<SportsDataContext> {
  const context: SportsDataContext = {}
  
  const sports: SportType[] = ['nfl', 'nba', 'nhl', 'mlb']
  
  await Promise.allSettled(
    sports.map(async (sport) => {
      try {
        const [scoreboardRes, standingsRes] = await Promise.all([
          fetchESPN(sport, 'scoreboard'),
          fetchESPN(sport, 'standings'),
        ])
        
        context[sport] = {
          games: scoreboardRes?.events || [],
          standings: standingsRes,
        }
      } catch (error) {
        console.error(`Error fetching ${sport} data:`, error)
      }
    })
  )
  
  return context
}
