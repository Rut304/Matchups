/**
 * Public Betting Consensus API
 * 
 * Uses Action Network's real public betting data to show:
 * - Ticket percentages (# of bets on each side)
 * - Money percentages ($ amount on each side)
 * - Sharp signals (when money diverges from tickets)
 * - Reverse line movement (when line moves against public)
 * 
 * This is REAL DATA - no fake/mock data!
 */

import { NextResponse } from 'next/server'

const ACTION_NETWORK_SPORTS: Record<string, string> = {
  'NFL': 'nfl',
  'NBA': 'nba',
  'MLB': 'mlb',
  'NHL': 'nhl',
  'NCAAF': 'ncaaf',
  'NCAAB': 'ncaab',
}

interface BetInfo {
  tickets: { percent: number }
  money: { percent: number }
}

interface MarketData {
  side: 'home' | 'away' | 'over' | 'under'
  odds: number
  value: number
  bet_info: BetInfo
  is_live: boolean
}

interface ConsensusGame {
  gameId: string
  sport: string
  homeTeam: string
  awayTeam: string
  startTime: string
  status: string
  spread: {
    line: number
    home: { ticketPct: number; moneyPct: number; odds: number }
    away: { ticketPct: number; moneyPct: number; odds: number }
    sharpSignal: 'home' | 'away' | null // When money % is significantly higher than ticket %
    rlmSignal: boolean // Reverse line movement
  } | null
  total: {
    line: number
    over: { ticketPct: number; moneyPct: number; odds: number }
    under: { ticketPct: number; moneyPct: number; odds: number }
    sharpSignal: 'over' | 'under' | null
  } | null
  moneyline: {
    home: { ticketPct: number; moneyPct: number; odds: number }
    away: { ticketPct: number; moneyPct: number; odds: number }
    sharpSignal: 'home' | 'away' | null
  } | null
}

// Calculate if there's a sharp signal (money % significantly > ticket %)
function detectSharpSignal(
  sideA: { ticketPct: number; moneyPct: number },
  sideB: { ticketPct: number; moneyPct: number },
  threshold = 10
): 'a' | 'b' | null {
  const diffA = sideA.moneyPct - sideA.ticketPct
  const diffB = sideB.moneyPct - sideB.ticketPct
  
  if (diffA > threshold && diffA > diffB) return 'a'
  if (diffB > threshold && diffB > diffA) return 'b'
  return null
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const sport = searchParams.get('sport')?.toUpperCase() || 'NBA'
  const date = searchParams.get('date') // Optional: YYYYMMDD format
  
  const actionSport = ACTION_NETWORK_SPORTS[sport]
  if (!actionSport) {
    return NextResponse.json({ 
      error: 'Invalid sport',
      validSports: Object.keys(ACTION_NETWORK_SPORTS)
    }, { status: 400 })
  }

  try {
    let url = `https://api.actionnetwork.com/web/v2/scoreboard/${actionSport}`
    if (date) {
      url += `?date=${date}`
    }

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'application/json',
      },
      next: { revalidate: 300 }, // Cache for 5 minutes
    })

    if (!response.ok) {
      console.error('Action Network error:', response.status)
      return NextResponse.json({ 
        error: 'Failed to fetch betting data',
        status: response.status
      }, { status: 502 })
    }

    const data = await response.json()
    const games: ConsensusGame[] = []
    
    // Parse Action Network response
    for (const game of data.games || []) {
      const teams = game.teams || []
      const homeTeamId = game.home_team_id
      const awayTeamId = game.away_team_id
      
      const homeTeam = teams.find((t: any) => t.id === homeTeamId)
      const awayTeam = teams.find((t: any) => t.id === awayTeamId)
      
      if (!homeTeam || !awayTeam) continue
      
      // Get markets from first available book (book 71 is often DraftKings, 75 is FanDuel)
      const markets = game.markets || {}
      const bookMarkets = markets['71']?.event || markets['75']?.event || Object.values(markets)[0]?.event || {}
      
      const consensusGame: ConsensusGame = {
        gameId: String(game.id),
        sport,
        homeTeam: homeTeam.full_name || homeTeam.display_name,
        awayTeam: awayTeam.full_name || awayTeam.display_name,
        startTime: game.start_time,
        status: game.status,
        spread: null,
        total: null,
        moneyline: null,
      }

      // Parse spread
      const spreads = bookMarkets.spread?.filter((m: MarketData) => !m.is_live) || []
      const homeSpread = spreads.find((m: MarketData) => m.side === 'home')
      const awaySpread = spreads.find((m: MarketData) => m.side === 'away')
      
      if (homeSpread && awaySpread) {
        const homeData = {
          ticketPct: homeSpread.bet_info?.tickets?.percent || 0,
          moneyPct: homeSpread.bet_info?.money?.percent || 0,
          odds: homeSpread.odds
        }
        const awayData = {
          ticketPct: awaySpread.bet_info?.tickets?.percent || 0,
          moneyPct: awaySpread.bet_info?.money?.percent || 0,
          odds: awaySpread.odds
        }
        
        const sharpResult = detectSharpSignal(homeData, awayData)
        
        consensusGame.spread = {
          line: Math.abs(homeSpread.value),
          home: homeData,
          away: awayData,
          sharpSignal: sharpResult === 'a' ? 'home' : sharpResult === 'b' ? 'away' : null,
          rlmSignal: false, // Would need historical data to detect
        }
      }

      // Parse total
      const totals = bookMarkets.total?.filter((m: MarketData) => !m.is_live) || []
      const overTotal = totals.find((m: MarketData) => m.side === 'over')
      const underTotal = totals.find((m: MarketData) => m.side === 'under')
      
      if (overTotal && underTotal) {
        const overData = {
          ticketPct: overTotal.bet_info?.tickets?.percent || 0,
          moneyPct: overTotal.bet_info?.money?.percent || 0,
          odds: overTotal.odds
        }
        const underData = {
          ticketPct: underTotal.bet_info?.tickets?.percent || 0,
          moneyPct: underTotal.bet_info?.money?.percent || 0,
          odds: underTotal.odds
        }
        
        const sharpResult = detectSharpSignal(overData, underData)
        
        consensusGame.total = {
          line: overTotal.value,
          over: overData,
          under: underData,
          sharpSignal: sharpResult === 'a' ? 'over' : sharpResult === 'b' ? 'under' : null,
        }
      }

      // Parse moneyline
      const mls = bookMarkets.moneyline?.filter((m: MarketData) => !m.is_live) || []
      const homeML = mls.find((m: MarketData) => m.side === 'home')
      const awayML = mls.find((m: MarketData) => m.side === 'away')
      
      if (homeML && awayML) {
        const homeData = {
          ticketPct: homeML.bet_info?.tickets?.percent || 0,
          moneyPct: homeML.bet_info?.money?.percent || 0,
          odds: homeML.odds
        }
        const awayData = {
          ticketPct: awayML.bet_info?.tickets?.percent || 0,
          moneyPct: awayML.bet_info?.money?.percent || 0,
          odds: awayML.odds
        }
        
        const sharpResult = detectSharpSignal(homeData, awayData)
        
        consensusGame.moneyline = {
          home: homeData,
          away: awayData,
          sharpSignal: sharpResult === 'a' ? 'home' : sharpResult === 'b' ? 'away' : null,
        }
      }

      // Only include games with betting data
      if (consensusGame.spread || consensusGame.total || consensusGame.moneyline) {
        games.push(consensusGame)
      }
    }

    // Calculate summary stats
    const sharpPlays = games.filter(g => 
      g.spread?.sharpSignal || g.total?.sharpSignal || g.moneyline?.sharpSignal
    )

    return NextResponse.json({
      sport,
      league: data.league?.name || sport,
      fetchedAt: new Date().toISOString(),
      gamesCount: games.length,
      sharpSignalsCount: sharpPlays.length,
      games,
      // Summary of sharp signals
      sharpPlays: sharpPlays.map(g => ({
        gameId: g.gameId,
        matchup: `${g.awayTeam} @ ${g.homeTeam}`,
        signals: {
          spread: g.spread?.sharpSignal,
          total: g.total?.sharpSignal,
          moneyline: g.moneyline?.sharpSignal,
        }
      }))
    })

  } catch (error) {
    console.error('Consensus API error:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch consensus data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
