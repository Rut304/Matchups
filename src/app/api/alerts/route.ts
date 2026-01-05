import { NextResponse } from 'next/server'

interface Alert {
  id: string
  type: 'line_move' | 'sharp_action' | 'injury' | 'weather' | 'public_money'
  sport: string
  title: string
  description: string
  game: string
  timestamp: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  data?: {
    oldLine?: number
    newLine?: number
    movement?: number
    percentage?: number
  }
}

// Mock real-time alerts - in production, this would connect to live data sources
const generateAlerts = (): Alert[] => {
  const now = new Date()
  
  return [
    {
      id: '1',
      type: 'line_move',
      sport: 'NFL',
      title: 'Major Line Movement',
      description: 'Line moved 3.5 points in 2 hours',
      game: 'Chiefs @ Ravens',
      timestamp: new Date(now.getTime() - 5 * 60000).toISOString(),
      severity: 'critical',
      data: { oldLine: -7, newLine: -3.5, movement: 3.5 }
    },
    {
      id: '2',
      type: 'sharp_action',
      sport: 'NBA',
      title: 'Sharp Money Detected',
      description: '65% of money on Celtics despite 40% of bets',
      game: 'Celtics @ Lakers',
      timestamp: new Date(now.getTime() - 12 * 60000).toISOString(),
      severity: 'high',
      data: { percentage: 65 }
    },
    {
      id: '3',
      type: 'injury',
      sport: 'NBA',
      title: 'Star Player Out',
      description: 'Ja Morant ruled OUT - Line shifting',
      game: 'Grizzlies @ Suns',
      timestamp: new Date(now.getTime() - 20 * 60000).toISOString(),
      severity: 'critical'
    },
    {
      id: '4',
      type: 'public_money',
      sport: 'NFL',
      title: 'Heavy Public Action',
      description: '85% of public bets on Cowboys',
      game: 'Cowboys @ Eagles',
      timestamp: new Date(now.getTime() - 35 * 60000).toISOString(),
      severity: 'medium',
      data: { percentage: 85 }
    },
    {
      id: '5',
      type: 'line_move',
      sport: 'NHL',
      title: 'Reverse Line Movement',
      description: 'Line moving against public money',
      game: 'Oilers @ Flames',
      timestamp: new Date(now.getTime() - 60 * 60000).toISOString(),
      severity: 'high',
      data: { oldLine: -150, newLine: -130, movement: 20 }
    }
  ]
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type')
  const sport = searchParams.get('sport')
  const severity = searchParams.get('severity')

  let alerts = generateAlerts()

  // Filter by type
  if (type && type !== 'all') {
    alerts = alerts.filter(a => a.type === type)
  }

  // Filter by sport
  if (sport && sport !== 'all') {
    alerts = alerts.filter(a => a.sport.toLowerCase() === sport.toLowerCase())
  }

  // Filter by severity
  if (severity && severity !== 'all') {
    alerts = alerts.filter(a => a.severity === severity)
  }

  return NextResponse.json({
    alerts,
    count: alerts.length,
    lastUpdated: new Date().toISOString()
  })
}
