import { NextResponse } from 'next/server'
import { getScoreboard, type SportKey } from '@/lib/api/espn'

/**
 * GET /api/lines - Real line movement data
 * Source: ESPN Pickcenter (opening vs current lines)
 * 
 * Returns opening vs current lines for today's games.
 * No mock data - only returns games that have real odds movement.
 */

interface LineMovement {
  id: string
  sport: string
  game: string
  betType: 'spread' | 'total' | 'moneyline'
  openLine: number
  currentLine: number
  movement: number
  movementPercent: number
  timestamp: string
  direction: 'up' | 'down'
  volume: 'low' | 'medium' | 'high'
  source: string
}

const SPORTS: SportKey[] = ['NBA', 'NFL', 'NHL', 'MLB']

function classifyVolume(pct: number): 'low' | 'medium' | 'high' {
  if (Math.abs(pct) >= 15) return 'high'
  if (Math.abs(pct) >= 5) return 'medium'
  return 'low'
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const sport = searchParams.get('sport')?.toUpperCase()
  const betType = searchParams.get('betType')
  const minMovement = searchParams.get('minMovement')

  try {
    const sportsToCheck = sport && sport !== 'ALL' 
      ? [sport as SportKey] 
      : SPORTS

    const movements: LineMovement[] = []

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

          const gameName = `${away.team?.displayName || 'Away'} @ ${home.team?.displayName || 'Home'}`
          
          // Get odds from ESPN (includes opening line when available)
          const odds = competition.odds?.[0]
          if (!odds) continue

          const spread = odds.spread
          const overUnder = odds.overUnder
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const openSpread = (odds as any).open?.spread
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const openTotal = (odds as any).open?.overUnder

          // Spread movement
          if (spread !== undefined && openSpread !== undefined) {
            const mv = Math.abs(spread - openSpread)
            if (mv > 0) {
              const pct = openSpread !== 0 ? ((spread - openSpread) / Math.abs(openSpread)) * 100 : 0
              movements.push({
                id: `${event.id}-spread`,
                sport: s,
                game: gameName,
                betType: 'spread',
                openLine: openSpread,
                currentLine: spread,
                movement: mv,
                movementPercent: Math.round(pct * 10) / 10,
                timestamp: new Date().toISOString(),
                direction: spread < openSpread ? 'down' : 'up',
                volume: classifyVolume(pct),
                source: 'ESPN'
              })
            }
          }

          // Total movement 
          if (overUnder !== undefined && openTotal !== undefined) {
            const mv = Math.abs(overUnder - openTotal)
            if (mv > 0) {
              const pct = openTotal !== 0 ? ((overUnder - openTotal) / openTotal) * 100 : 0
              movements.push({
                id: `${event.id}-total`,
                sport: s,
                game: gameName,
                betType: 'total',
                openLine: openTotal,
                currentLine: overUnder,
                movement: mv,
                movementPercent: Math.round(pct * 10) / 10,
                timestamp: new Date().toISOString(),
                direction: overUnder < openTotal ? 'down' : 'up',
                volume: classifyVolume(pct),
                source: 'ESPN'
              })
            }
          }
        }
      } catch {
        continue
      }
    }

    // Apply filters
    let filtered = movements

    if (betType && betType !== 'all') {
      filtered = filtered.filter(m => m.betType === betType)
    }

    if (minMovement) {
      filtered = filtered.filter(m => Math.abs(m.movement) >= parseFloat(minMovement))
    }

    // Sort by movement amount (largest first)
    filtered.sort((a, b) => Math.abs(b.movement) - Math.abs(a.movement))

    return NextResponse.json({
      movements: filtered,
      count: filtered.length,
      lastUpdated: new Date().toISOString(),
      source: 'ESPN Pickcenter'
    })
  } catch {
    return NextResponse.json({
      movements: [],
      count: 0,
      lastUpdated: new Date().toISOString(),
      error: 'Failed to fetch line movement data'
    })
  }
}
