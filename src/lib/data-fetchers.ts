// =============================================================================
// SERVER ACTIONS FOR SPORTS DATA
// Fetches real data from APIs with caching
// =============================================================================

'use server'

import {
  getGames,
  getTeams,
  getAllStandings,
  getNews,
  getTodaysGames,
  getSportsDashboard,
  getNHLPlayer,
  getNBAPlayers,
  getNBAPlayerSeasonAverages,
  getLiveOdds,
  type SupportedSport,
  type LiveGame,
  type LiveTeam,
  type Standing,
  type SportsDashboard,
} from './api/live-sports'

// =============================================================================
// GAMES
// =============================================================================

export async function fetchGames(sport: string, date?: string): Promise<LiveGame[]> {
  return getGames(sport.toLowerCase() as SupportedSport, date)
}

export async function fetchTodaysGames(): Promise<Record<string, LiveGame[]>> {
  return getTodaysGames()
}

export async function fetchLiveGames(): Promise<LiveGame[]> {
  const allGames = await getTodaysGames()
  return Object.values(allGames).flat().filter(g => g.status === 'in_progress')
}

// =============================================================================
// TEAMS
// =============================================================================

export async function fetchTeams(sport: string): Promise<LiveTeam[]> {
  return getTeams(sport.toLowerCase() as SupportedSport)
}

// =============================================================================
// STANDINGS
// =============================================================================

export async function fetchStandings(sport: string): Promise<Standing[]> {
  return getAllStandings(sport.toLowerCase() as SupportedSport)
}

// =============================================================================
// DASHBOARD
// =============================================================================

export async function fetchDashboard(sport: string): Promise<SportsDashboard> {
  return getSportsDashboard(sport.toLowerCase() as SupportedSport)
}

// =============================================================================
// NEWS
// =============================================================================

export async function fetchNews(sport: string, limit = 10): Promise<any[]> {
  return getNews(sport.toLowerCase() as SupportedSport, limit)
}

// =============================================================================
// PLAYERS
// =============================================================================

export async function fetchNHLPlayer(playerId: string) {
  return getNHLPlayer(playerId)
}

export async function searchNBAPlayers(query: string) {
  const { players } = await getNBAPlayers(query)
  return players
}

export async function fetchNBAPlayerStats(playerId: string, season?: number) {
  return getNBAPlayerSeasonAverages(playerId, season)
}

// =============================================================================
// ODDS
// =============================================================================

export async function fetchOdds(sport: string) {
  return getLiveOdds(sport)
}

// =============================================================================
// COMBINED DATA FETCHERS
// =============================================================================

export interface HomePageData {
  nfl: LiveGame[]
  nba: LiveGame[]
  nhl: LiveGame[]
  mlb: LiveGame[]
  liveCount: number
  totalGames: number
}

export async function fetchHomePageData(): Promise<HomePageData> {
  const [nfl, nba, nhl, mlb] = await Promise.all([
    getGames('nfl'),
    getGames('nba'),
    getGames('nhl'),
    getGames('mlb'),
  ])
  
  const allGames = [...nfl, ...nba, ...nhl, ...mlb]
  const liveCount = allGames.filter(g => g.status === 'in_progress').length
  
  return {
    nfl,
    nba,
    nhl,
    mlb,
    liveCount,
    totalGames: allGames.length,
  }
}

export interface SportPageData {
  games: LiveGame[]
  standings: Standing[]
  news: any[]
}

export async function fetchSportPageData(sport: string): Promise<SportPageData> {
  const [games, standings, news] = await Promise.all([
    getGames(sport.toLowerCase() as SupportedSport),
    getAllStandings(sport.toLowerCase() as SupportedSport),
    getNews(sport.toLowerCase() as SupportedSport, 10),
  ])
  
  return { games, standings, news }
}
