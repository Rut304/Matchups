import axios from 'axios'
import { fetchActionNetworkGames, extractMultiBookOdds } from '../scrapers/action-network'
import * as espn from './espn'
import * as apiSports from './api-sports'

// The Odds API for live betting lines (BACKUP - 500 free requests/month)
const oddsApi = axios.create({
  baseURL: 'https://api.the-odds-api.com/v4',
  params: {
    apiKey: process.env.THE_ODDS_API_KEY,
  },
})

// Sport mapping for ESPN (uppercase keys)
const ESPN_SPORT_MAP: Record<string, espn.SportKey> = {
  nfl: 'NFL',
  nba: 'NBA',
  nhl: 'NHL',
  mlb: 'MLB',
  ncaaf: 'NCAAF',
  ncaab: 'NCAAB',
}

// Sport mapping for API-Sports
const API_SPORTS_MAP: Record<string, apiSports.APISportKey> = {
  nfl: 'NFL',
  nba: 'NBA',
  nhl: 'NHL',
  mlb: 'MLB',
}

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
  /**
   * Get odds - Cascades through multiple sources for reliability
   * Priority: Primary source -> ESPN -> The Odds API -> API-Sports
   */
  async getOdds(sport: string): Promise<BettingLine[]> {
    // Source 1: Primary odds source (free, unlimited)
    try {
      const primaryOdds = await this.getOddsFromPrimarySource(sport)
      if (primaryOdds.length > 0) {
        console.log(`[Odds] Source 1 success for ${sport} (${primaryOdds.length} lines)`)
        return primaryOdds
      }
    } catch (error) {
      console.warn(`[Odds] Source 1 failed for ${sport}:`, error)
    }

    // Source 2: ESPN Pickcenter (free)
    try {
      const espnOdds = await this.getOddsFromESPN(sport)
      if (espnOdds.length > 0) {
        console.log(`[Odds] ESPN source for ${sport} (${espnOdds.length} lines)`)
        return espnOdds
      }
    } catch (error) {
      console.warn(`[Odds] ESPN failed for ${sport}:`, error)
    }

    // Source 3: The Odds API (500 requests/month limit)
    try {
      const theOddsApiData = await this.getOddsFromTheOddsApi(sport)
      if (theOddsApiData.length > 0) {
        console.log(`[Odds] The Odds API for ${sport} (${theOddsApiData.length} lines)`)
        return theOddsApiData
      }
    } catch (error) {
      console.warn(`[Odds] The Odds API failed for ${sport}:`, error)
    }

    // Source 4: API-Sports (100 requests/day limit)
    try {
      const apiSportsOdds = await this.getOddsFromAPISports(sport)
      if (apiSportsOdds.length > 0) {
        console.log(`[Odds] API-Sports for ${sport} (${apiSportsOdds.length} lines)`)
        return apiSportsOdds
      }
    } catch (error) {
      console.warn(`[Odds] API-Sports failed for ${sport}:`, error)
    }

    console.warn(`[Odds] All sources failed for ${sport}`)
    return []
  }

  /**
   * PRIMARY: Fetch odds from primary source (free, no rate limit)
   */
  private async getOddsFromPrimarySource(sport: string): Promise<BettingLine[]> {
    const games = await fetchActionNetworkGames(sport.toUpperCase())
    const lines: BettingLine[] = []

    for (const game of games) {
      const multiBookOdds = extractMultiBookOdds(game, sport)
      if (!multiBookOdds) continue

      for (const book of multiBookOdds.books) {
        if (!book.spread && !book.total && !book.moneyline) continue

        lines.push({
          gameId: String(game.id),
          bookmaker: book.bookName,
          spread: book.spread ? {
            home: book.spread.home,
            homeOdds: book.spread.homeOdds,
            away: book.spread.away,
            awayOdds: book.spread.awayOdds,
          } : { home: 0, homeOdds: -110, away: 0, awayOdds: -110 },
          total: book.total ? {
            over: book.total.line,
            overOdds: book.total.overOdds,
            under: book.total.line,
            underOdds: book.total.underOdds,
          } : { over: 0, overOdds: -110, under: 0, underOdds: -110 },
          moneyline: book.moneyline ? {
            home: book.moneyline.homeOdds,
            away: book.moneyline.awayOdds,
          } : { home: -110, away: -110 },
          lastUpdate: new Date().toISOString(),
        })
      }
    }

    return lines
  }

  /**
   * BACKUP: Fetch odds from The Odds API (500 requests/month limit)
   */
  private async getOddsFromTheOddsApi(sport: string): Promise<BettingLine[]> {
    try {
      const sportKey = SPORT_KEYS[sport.toLowerCase()]
      if (!sportKey) return []

      // Check if API key is configured
      if (!process.env.THE_ODDS_API_KEY) {
        console.warn('[Odds] THE_ODDS_API_KEY not configured')
        return []
      }

      const response = await oddsApi.get(`/sports/${sportKey}/odds`, {
        params: {
          regions: 'us',
          markets: 'spreads,totals,h2h',
          oddsFormat: 'american',
        },
      })

      return this.normalizeTheOddsApiResponse(response.data || [])
    } catch (error) {
      console.error(`[Odds] The Odds API error for ${sport}:`, error)
      return []
    }
  }

  /**
   * FALLBACK 2: Fetch odds from ESPN Pickcenter
   */
  private async getOddsFromESPN(sport: string): Promise<BettingLine[]> {
    const espnSport = ESPN_SPORT_MAP[sport.toLowerCase()]
    if (!espnSport) return []

    try {
      const scoreboard = await espn.getScoreboard(espnSport)
      const lines: BettingLine[] = []

      for (const game of scoreboard.events) {
        const competition = game.competitions[0]
        const odds = competition?.odds?.[0]
        if (!odds) continue

        const homeTeam = competition.competitors.find((c: { homeAway: string }) => c.homeAway === 'home')
        const awayTeam = competition.competitors.find((c: { homeAway: string }) => c.homeAway === 'away')

        lines.push({
          gameId: game.id,
          bookmaker: odds.provider?.name || 'ESPN',
          spread: {
            home: odds.spread || 0,
            homeOdds: -110, // ESPN doesn't provide spread odds
            away: odds.spread ? -odds.spread : 0,
            awayOdds: -110,
          },
          total: {
            over: odds.overUnder || 0,
            overOdds: -110,
            under: odds.overUnder || 0,
            underOdds: -110,
          },
          moneyline: {
            home: odds.homeTeamOdds?.moneyLine || -110,
            away: odds.awayTeamOdds?.moneyLine || -110,
          },
          lastUpdate: new Date().toISOString(),
        })
      }

      return lines
    } catch (error) {
      console.error(`[Odds] ESPN error for ${sport}:`, error)
      return []
    }
  }

  /**
   * FALLBACK 3: Fetch odds from API-Sports (100 requests/day)
   */
  private async getOddsFromAPISports(sport: string): Promise<BettingLine[]> {
    const apiSportKey = API_SPORTS_MAP[sport.toLowerCase()]
    if (!apiSportKey) return []

    // Check if API key is configured
    if (!process.env.API_SPORTS_KEY) {
      return []
    }

    try {
      // Get today's games first
      const games = await apiSports.getGames(apiSportKey, {
        date: new Date().toISOString().split('T')[0],
      })
      
      const lines: BettingLine[] = []

      for (const game of games) {
        // Fetch odds for each game (costs 1 request per game)
        const gameOdds = await apiSports.getOdds(apiSportKey, { game: game.game.id })
        
        for (const odd of gameOdds) {
          const spreadBet = odd.bets.find(b => b.name === 'Handicap')
          const totalBet = odd.bets.find(b => b.name === 'Over/Under')
          const mlBet = odd.bets.find(b => b.name === 'Home/Away')

          lines.push({
            gameId: String(game.game.id),
            bookmaker: odd.bookmaker.name,
            spread: spreadBet ? {
              home: parseFloat(spreadBet.values[0]?.value || '0'),
              homeOdds: parseFloat(spreadBet.values[0]?.odd || '-110'),
              away: parseFloat(spreadBet.values[1]?.value || '0'),
              awayOdds: parseFloat(spreadBet.values[1]?.odd || '-110'),
            } : { home: 0, homeOdds: -110, away: 0, awayOdds: -110 },
            total: totalBet ? {
              over: parseFloat(totalBet.values[0]?.value || '0'),
              overOdds: parseFloat(totalBet.values[0]?.odd || '-110'),
              under: parseFloat(totalBet.values[1]?.value || '0'),
              underOdds: parseFloat(totalBet.values[1]?.odd || '-110'),
            } : { over: 0, overOdds: -110, under: 0, underOdds: -110 },
            moneyline: mlBet ? {
              home: parseFloat(mlBet.values[0]?.odd || '-110'),
              away: parseFloat(mlBet.values[1]?.odd || '-110'),
            } : { home: -110, away: -110 },
            lastUpdate: odd.update || new Date().toISOString(),
          })
        }
      }

      return lines
    } catch (error) {
      console.error(`[Odds] API-Sports error for ${sport}:`, error)
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

  private normalizeTheOddsApiResponse(games: unknown[]): BettingLine[] {
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
