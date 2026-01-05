import { NextResponse } from 'next/server'

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
}

// Mock public betting data
const generatePublicBettingData = (): PublicBetting[] => {
  return [
    {
      id: '1',
      sport: 'NFL',
      game: 'Cowboys @ Eagles',
      homeTeam: 'Eagles',
      awayTeam: 'Cowboys',
      gameTime: '2025-01-05T20:15:00Z',
      spread: {
        line: -3.5,
        homePercent: 32,
        awayPercent: 68,
        homeMoney: 45,
        awayMoney: 55
      },
      total: {
        line: 48.5,
        overPercent: 72,
        underPercent: 28,
        overMoney: 58,
        underMoney: 42
      },
      moneyline: {
        homeLine: -175,
        awayLine: 145,
        homePercent: 28,
        awayPercent: 72,
        homeMoney: 52,
        awayMoney: 48
      },
      sharpIndicator: 'fade_public'
    },
    {
      id: '2',
      sport: 'NBA',
      game: 'Lakers @ Celtics',
      homeTeam: 'Celtics',
      awayTeam: 'Lakers',
      gameTime: '2025-01-05T19:30:00Z',
      spread: {
        line: -8.5,
        homePercent: 55,
        awayPercent: 45,
        homeMoney: 70,
        awayMoney: 30
      },
      total: {
        line: 228,
        overPercent: 62,
        underPercent: 38,
        overMoney: 55,
        underMoney: 45
      },
      moneyline: {
        homeLine: -380,
        awayLine: 300,
        homePercent: 85,
        awayPercent: 15,
        homeMoney: 75,
        awayMoney: 25
      },
      sharpIndicator: 'follow_sharp'
    },
    {
      id: '3',
      sport: 'NFL',
      game: 'Chiefs @ Ravens',
      homeTeam: 'Ravens',
      awayTeam: 'Chiefs',
      gameTime: '2025-01-05T16:30:00Z',
      spread: {
        line: -3,
        homePercent: 42,
        awayPercent: 58,
        homeMoney: 62,
        awayMoney: 38
      },
      total: {
        line: 51.5,
        overPercent: 55,
        underPercent: 45,
        overMoney: 48,
        underMoney: 52
      },
      moneyline: {
        homeLine: -150,
        awayLine: 130,
        homePercent: 38,
        awayPercent: 62,
        homeMoney: 58,
        awayMoney: 42
      },
      sharpIndicator: 'fade_public'
    },
    {
      id: '4',
      sport: 'NHL',
      game: 'Oilers @ Flames',
      homeTeam: 'Flames',
      awayTeam: 'Oilers',
      gameTime: '2025-01-05T21:00:00Z',
      spread: {
        line: 1.5,
        homePercent: 35,
        awayPercent: 65,
        homeMoney: 40,
        awayMoney: 60
      },
      total: {
        line: 6.5,
        overPercent: 58,
        underPercent: 42,
        overMoney: 52,
        underMoney: 48
      },
      moneyline: {
        homeLine: 125,
        awayLine: -145,
        homePercent: 30,
        awayPercent: 70,
        homeMoney: 35,
        awayMoney: 65
      },
      sharpIndicator: 'neutral'
    }
  ]
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const sport = searchParams.get('sport')
  const sharpOnly = searchParams.get('sharpOnly')

  let bettingData = generatePublicBettingData()

  // Filter by sport
  if (sport && sport !== 'all') {
    bettingData = bettingData.filter(b => b.sport.toLowerCase() === sport.toLowerCase())
  }

  // Filter for sharp plays only
  if (sharpOnly === 'true') {
    bettingData = bettingData.filter(b => b.sharpIndicator !== 'neutral')
  }

  return NextResponse.json({
    games: bettingData,
    count: bettingData.length,
    lastUpdated: new Date().toISOString()
  })
}
