import { NextResponse } from 'next/server'

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
}

// Mock line movement data - in production, connect to odds API
const generateLineMovements = (): LineMovement[] => {
  const now = new Date()
  
  return [
    {
      id: '1',
      sport: 'NFL',
      game: 'Chiefs @ Ravens',
      betType: 'spread',
      openLine: -7,
      currentLine: -3.5,
      movement: 3.5,
      movementPercent: 50,
      timestamp: new Date(now.getTime() - 2 * 60 * 60000).toISOString(),
      direction: 'up',
      volume: 'high'
    },
    {
      id: '2',
      sport: 'NBA',
      game: 'Celtics @ Lakers',
      betType: 'spread',
      openLine: -6.5,
      currentLine: -8,
      movement: 1.5,
      movementPercent: 23,
      timestamp: new Date(now.getTime() - 4 * 60 * 60000).toISOString(),
      direction: 'down',
      volume: 'medium'
    },
    {
      id: '3',
      sport: 'NFL',
      game: 'Cowboys @ Eagles',
      betType: 'total',
      openLine: 48.5,
      currentLine: 45,
      movement: 3.5,
      movementPercent: 7.2,
      timestamp: new Date(now.getTime() - 6 * 60 * 60000).toISOString(),
      direction: 'down',
      volume: 'high'
    },
    {
      id: '4',
      sport: 'NHL',
      game: 'Oilers @ Flames',
      betType: 'moneyline',
      openLine: -150,
      currentLine: -130,
      movement: 20,
      movementPercent: 13.3,
      timestamp: new Date(now.getTime() - 3 * 60 * 60000).toISOString(),
      direction: 'up',
      volume: 'medium'
    },
    {
      id: '5',
      sport: 'NBA',
      game: 'Grizzlies @ Suns',
      betType: 'spread',
      openLine: -4.5,
      currentLine: 1,
      movement: 5.5,
      movementPercent: 122,
      timestamp: new Date(now.getTime() - 1 * 60 * 60000).toISOString(),
      direction: 'up',
      volume: 'high'
    }
  ]
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const sport = searchParams.get('sport')
  const betType = searchParams.get('betType')
  const minMovement = searchParams.get('minMovement')

  let movements = generateLineMovements()

  // Filter by sport
  if (sport && sport !== 'all') {
    movements = movements.filter(m => m.sport.toLowerCase() === sport.toLowerCase())
  }

  // Filter by bet type
  if (betType && betType !== 'all') {
    movements = movements.filter(m => m.betType === betType)
  }

  // Filter by minimum movement
  if (minMovement) {
    movements = movements.filter(m => Math.abs(m.movement) >= parseFloat(minMovement))
  }

  // Sort by movement amount (largest first)
  movements.sort((a, b) => Math.abs(b.movement) - Math.abs(a.movement))

  return NextResponse.json({
    movements,
    count: movements.length,
    lastUpdated: new Date().toISOString()
  })
}
