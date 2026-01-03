import axios from 'axios'

// API-Sports client for NFL, NBA, NHL, MLB
const apiSports = axios.create({
  baseURL: 'https://v1.american-football.api-sports.io', // Changes per sport
  headers: {
    'x-apisports-key': process.env.API_SPORTS_KEY || '',
  },
})

// Sport-specific base URLs
const SPORT_URLS: Record<string, string> = {
  nfl: 'https://v1.american-football.api-sports.io',
  nba: 'https://v1.basketball.api-sports.io',
  nhl: 'https://v1.hockey.api-sports.io',
  mlb: 'https://v1.baseball.api-sports.io',
}

export interface Game {
  id: string
  sport: string
  homeTeam: Team
  awayTeam: Team
  date: string
  status: 'scheduled' | 'live' | 'final'
  homeScore?: number
  awayScore?: number
  venue?: string
  spread?: { home: number; away: number }
  total?: number
  moneyline?: { home: number; away: number }
}

export interface Team {
  id: string
  name: string
  abbreviation: string
  logo?: string
  record?: string
  atsRecord?: string
  ouRecord?: string
}

export interface PlayerInjury {
  playerId: string
  playerName: string
  team: string
  position: string
  status: 'Out' | 'Doubtful' | 'Questionable' | 'Probable'
  injury: string
  updated: string
}

export interface Trend {
  id: string
  type: 'team' | 'player' | 'league'
  description: string
  record: string
  timeframe: string
  sport: string
}

class SportsDataClient {
  private getClient(sport: string) {
    return axios.create({
      baseURL: SPORT_URLS[sport.toLowerCase()],
      headers: {
        'x-apisports-key': process.env.API_SPORTS_KEY || '',
      },
    })
  }

  async getUpcomingGames(sport: string, date?: string): Promise<Game[]> {
    try {
      const client = this.getClient(sport)
      const targetDate = date || new Date().toISOString().split('T')[0]
      
      // API endpoint varies by sport
      const endpoint = sport === 'nfl' ? '/games' : '/games'
      const response = await client.get(endpoint, {
        params: { date: targetDate },
      })
      
      return this.normalizeGames(response.data.response || [], sport)
    } catch (error) {
      console.error(`Error fetching ${sport} games:`, error)
      return []
    }
  }

  async getInjuries(sport: string, teamId?: string): Promise<PlayerInjury[]> {
    try {
      const client = this.getClient(sport)
      const response = await client.get('/injuries', {
        params: teamId ? { team: teamId } : {},
      })
      
      return this.normalizeInjuries(response.data.response || [])
    } catch (error) {
      console.error(`Error fetching ${sport} injuries:`, error)
      return []
    }
  }

  async getH2H(sport: string, team1Id: string, team2Id: string): Promise<Game[]> {
    try {
      const client = this.getClient(sport)
      const response = await client.get('/games/h2h', {
        params: { h2h: `${team1Id}-${team2Id}` },
      })
      
      return this.normalizeGames(response.data.response || [], sport)
    } catch (error) {
      console.error(`Error fetching ${sport} H2H:`, error)
      return []
    }
  }

  async getTeamStats(sport: string, teamId: string, season?: string): Promise<Record<string, unknown>> {
    try {
      const client = this.getClient(sport)
      const response = await client.get('/teams/statistics', {
        params: { team: teamId, season: season || this.getCurrentSeason(sport) },
      })
      
      return response.data.response || {}
    } catch (error) {
      console.error(`Error fetching ${sport} team stats:`, error)
      return {}
    }
  }

  private getCurrentSeason(sport: string): string {
    const year = new Date().getFullYear()
    // NFL/NHL/NBA seasons span years
    const month = new Date().getMonth()
    if (['nfl', 'nhl', 'nba'].includes(sport.toLowerCase())) {
      return month < 6 ? `${year - 1}` : `${year}`
    }
    return `${year}`
  }

  private normalizeGames(games: unknown[], sport: string): Game[] {
    // Normalize API response to our Game interface
    return games.map((game: unknown) => {
      const g = game as Record<string, unknown>
      const teams = g.teams as Record<string, unknown>
      const scores = g.scores as Record<string, unknown>
      
      return {
        id: String(g.id),
        sport,
        homeTeam: {
          id: String((teams?.home as Record<string, unknown>)?.id || ''),
          name: String((teams?.home as Record<string, unknown>)?.name || ''),
          abbreviation: '',
        },
        awayTeam: {
          id: String((teams?.away as Record<string, unknown>)?.id || ''),
          name: String((teams?.away as Record<string, unknown>)?.name || ''),
          abbreviation: '',
        },
        date: String(g.date),
        status: this.normalizeStatus(g.status),
        homeScore: scores?.home ? Number(scores.home) : undefined,
        awayScore: scores?.away ? Number(scores.away) : undefined,
      }
    })
  }

  private normalizeInjuries(injuries: unknown[]): PlayerInjury[] {
    return injuries.map((injury: unknown) => {
      const i = injury as Record<string, unknown>
      const player = i.player as Record<string, unknown>
      
      return {
        playerId: String(player?.id || ''),
        playerName: String(player?.name || ''),
        team: String((i.team as Record<string, unknown>)?.name || ''),
        position: String(player?.position || ''),
        status: this.normalizeInjuryStatus(String(i.status)),
        injury: String(i.type || 'Unknown'),
        updated: String(i.date || ''),
      }
    })
  }

  private normalizeStatus(status: unknown): 'scheduled' | 'live' | 'final' {
    const s = (status as Record<string, unknown>)?.short || status
    if (typeof s === 'string') {
      if (['NS', 'TBD', 'scheduled'].includes(s)) return 'scheduled'
      if (['FT', 'AOT', 'final'].includes(s)) return 'final'
    }
    return 'live'
  }

  private normalizeInjuryStatus(status: string): PlayerInjury['status'] {
    const normalized = status.toLowerCase()
    if (normalized.includes('out')) return 'Out'
    if (normalized.includes('doubtful')) return 'Doubtful'
    if (normalized.includes('questionable')) return 'Questionable'
    return 'Probable'
  }
}

export const sportsClient = new SportsDataClient()
