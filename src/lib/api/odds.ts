import axios from 'axios'

// The Odds API for live betting lines
const oddsApi = axios.create({
  baseURL: 'https://api.the-odds-api.com/v4',
  params: {
    apiKey: process.env.THE_ODDS_API_KEY,
  },
})

// Sport keys for The Odds API
const SPORT_KEYS: Record<string, string> = {
  nfl: 'americanfootball_nfl',
  nba: 'basketball_nba',
  nhl: 'icehockey_nhl',
  mlb: 'baseball_mlb',
}

export interface BettingLine {
  gameId: string
  bookmaker: string
  spread: {
    home: number
    homeOdds: number
    away: number
    awayOdds: number
  }
  total: {
    over: number
    overOdds: number
    under: number
    underOdds: number
  }
  moneyline: {
    home: number
    away: number
  }
  lastUpdate: string
}

export interface LineMovement {
  gameId: string
  type: 'spread' | 'total' | 'moneyline'
  openLine: number
  currentLine: number
  movement: number
  direction: 'up' | 'down' | 'stable'
}

class OddsClient {
  async getOdds(sport: string): Promise<BettingLine[]> {
    try {
      const sportKey = SPORT_KEYS[sport.toLowerCase()]
      if (!sportKey) return []

      const response = await oddsApi.get(`/sports/${sportKey}/odds`, {
        params: {
          regions: 'us',
          markets: 'spreads,totals,h2h',
          oddsFormat: 'american',
        },
      })

      return this.normalizeOdds(response.data || [])
    } catch (error) {
      console.error(`Error fetching ${sport} odds:`, error)
      return []
    }
  }

  async getGameOdds(sport: string, gameId: string): Promise<BettingLine[]> {
    const allOdds = await this.getOdds(sport)
    return allOdds.filter(line => line.gameId === gameId)
  }

  async getBestLines(sport: string): Promise<Record<string, BettingLine>> {
    const allOdds = await this.getOdds(sport)
    const bestLines: Record<string, BettingLine> = {}

    for (const line of allOdds) {
      if (!bestLines[line.gameId]) {
        bestLines[line.gameId] = line
        continue
      }

      // Compare and keep best line
      const current = bestLines[line.gameId]
      // Simplified best line logic - could be more sophisticated
      if (line.spread.homeOdds > current.spread.homeOdds) {
        bestLines[line.gameId] = line
      }
    }

    return bestLines
  }

  async getLineMovements(sport: string): Promise<LineMovement[]> {
    // TODO: Implement historical line tracking
    // This would require storing line snapshots over time
    return []
  }

  private normalizeOdds(games: unknown[]): BettingLine[] {
    const lines: BettingLine[] = []

    for (const game of games) {
      const g = game as Record<string, unknown>
      const bookmakers = (g.bookmakers as unknown[]) || []

      for (const bookmaker of bookmakers) {
        const b = bookmaker as Record<string, unknown>
        const markets = (b.markets as unknown[]) || []

        let spread = { home: 0, homeOdds: -110, away: 0, awayOdds: -110 }
        let total = { over: 0, overOdds: -110, under: 0, underOdds: -110 }
        let moneyline = { home: -110, away: -110 }

        for (const market of markets) {
          const m = market as Record<string, unknown>
          const outcomes = (m.outcomes as unknown[]) || []

          if (m.key === 'spreads') {
            for (const o of outcomes) {
              const outcome = o as Record<string, unknown>
              if (outcome.name === g.home_team) {
                spread.home = Number(outcome.point) || 0
                spread.homeOdds = Number(outcome.price) || -110
              } else {
                spread.away = Number(outcome.point) || 0
                spread.awayOdds = Number(outcome.price) || -110
              }
            }
          } else if (m.key === 'totals') {
            for (const o of outcomes) {
              const outcome = o as Record<string, unknown>
              if (outcome.name === 'Over') {
                total.over = Number(outcome.point) || 0
                total.overOdds = Number(outcome.price) || -110
              } else {
                total.under = Number(outcome.point) || 0
                total.underOdds = Number(outcome.price) || -110
              }
            }
          } else if (m.key === 'h2h') {
            for (const o of outcomes) {
              const outcome = o as Record<string, unknown>
              if (outcome.name === g.home_team) {
                moneyline.home = Number(outcome.price) || -110
              } else {
                moneyline.away = Number(outcome.price) || -110
              }
            }
          }
        }

        lines.push({
          gameId: String(g.id),
          bookmaker: String(b.title),
          spread,
          total,
          moneyline,
          lastUpdate: String(b.last_update),
        })
      }
    }

    return lines
  }
}

export const oddsClient = new OddsClient()
