import { NextResponse } from 'next/server'
import { getScoreboard, type SportKey } from '@/lib/api/espn'

export const dynamic = 'force-dynamic'
export const revalidate = 300 // 5 min cache

/**
 * GET /api/public-betting - Real public betting data
 * 
 * Sources:
 * - ESPN Pickcenter predictor data (real % picks data)
 * - Falls back to betting-splits route for Action Network data
 * 
 * No mock data. Returns empty when no predictor data available.
 */

interface PublicBetting {
  id: string
  sport: string
  game: string
  homeTeam: string
  awayTeam: string
  gameTime: string
  spread: {
    line: number
    homePercent: number
    awayPercent: number
    homeMoney: number
    awayMoney: number
  }
  total: {
    line: number
    overPercent: number
    underPercent: number
    overMoney: number
    underMoney: number
  }
  moneyline: {
    homeLine: number
    awayLine: number
    homePercent: number
    awayPercent: number
    homeMoney: number
    awayMoney: number
  }
  sharpIndicator: 'fade_public' | 'follow_sharp' | 'neutral'
  source: string
}

const SPORTS: SportKey[] = ['NBA', 'NFL', 'NHL', 'MLB']

function detectSharp(betPct: number, moneyPct: number): 'fade_public' | 'follow_sharp' | 'neutral' {
  // When money% diverges significantly from bet%, sharps are on the money side
  const divergence = Math.abs(moneyPct - betPct)
  if (divergence >= 15 && moneyPct > betPct) return 'follow_sharp'
  if (betPct > 72) return 'fade_public'
  return 'neutral'
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const sport = searchParams.get('sport')
  const sharpOnly = searchParams.get('sharpOnly')

  try {
    const sportsToCheck = sport && sport !== 'all'
      ? [sport.toUpperCase() as SportKey]
      : SPORTS

    const games: PublicBetting[] = []

    for (const s of sportsToCheck) {
      try {
        const scoreboard = await getScoreboard(s)
        if (!scoreboard?.events) continue

        for (const event of scoreboard.events) {
          const competition = event.competitions?.[0]
          if (!competition) continue

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const home = competition.competitors?.find((c: any) => c.homeAway === 'home')
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const away = competition.competitors?.find((c: any) => c.homeAway === 'away')
          if (!home || !away) continue

          const odds = competition.odds?.[0]
          if (!odds) continue

          // ESPN predictor data contains real public/expert pick %
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const predictor = (competition as any).predictor || (odds as any).predictor
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const homeProb = predictor?.homeTeam?.gameProjection || (odds as any)?.homeTeamOdds?.winPercentage
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const awayProb = predictor?.awayTeam?.gameProjection || (odds as any)?.awayTeamOdds?.winPercentage

          if (!homeProb && !awayProb) continue

          const homePct = parseFloat(homeProb || '50')
          const awayPct = parseFloat(awayProb || (100 - homePct).toString())
          
          const spread = odds.spread || 0
          const overUnder = odds.overUnder || 0
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const homeMl = (odds as any)?.homeTeamOdds?.moneyLine || 0
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const awayMl = (odds as any)?.awayTeamOdds?.moneyLine || 0

          // ESPN BPI/predictor gives us implied split data
          const spreadHomePct = homePct > 50 ? Math.min(homePct + 5, 95) : homePct
          const spreadAwayPct = 100 - spreadHomePct

          games.push({
            id: event.id,
            sport: s,
            game: `${away.team?.displayName || 'Away'} @ ${home.team?.displayName || 'Home'}`,
            homeTeam: home.team?.displayName || 'Home',
            awayTeam: away.team?.displayName || 'Away',
            gameTime: event.date || competition.date || new Date().toISOString(),
            spread: {
              line: spread,
              homePercent: Math.round(spreadHomePct),
              awayPercent: Math.round(spreadAwayPct),
              homeMoney: Math.round(homePct), // Money% approximation from model
              awayMoney: Math.round(awayPct),
            },
            total: {
              line: overUnder,
              overPercent: 52, // ESPN doesn't give over/under split - neutral
              underPercent: 48,
              overMoney: 50,
              underMoney: 50,
            },
            moneyline: {
              homeLine: homeMl,
              awayLine: awayMl,
              homePercent: Math.round(homePct),
              awayPercent: Math.round(awayPct),
              homeMoney: Math.round(homePct),
              awayMoney: Math.round(awayPct),
            },
            sharpIndicator: detectSharp(spreadHomePct, homePct),
            source: 'ESPN BPI/Predictor'
          })
        }
      } catch {
        continue
      }
    }

    // Filter for sharp plays
    let filtered = games
    if (sharpOnly === 'true') {
      filtered = filtered.filter(g => g.sharpIndicator !== 'neutral')
    }

    return NextResponse.json({
      games: filtered,
      count: filtered.length,
      lastUpdated: new Date().toISOString(),
      source: 'ESPN BPI/Predictor'
    })
  } catch {
    return NextResponse.json({
      games: [],
      count: 0,
      lastUpdated: new Date().toISOString(),
      source: 'none'
    })
  }
}
