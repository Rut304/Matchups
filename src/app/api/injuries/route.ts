import { NextResponse } from 'next/server'

// Mock injury data - in production, this would fetch from a sports data API
const mockInjuries = [
  {
    id: '1',
    playerName: 'Patrick Mahomes',
    team: 'KC',
    position: 'QB',
    sport: 'NFL',
    injuryType: 'Ankle Sprain',
    bodyPart: 'Ankle',
    status: 'Questionable',
    impactRating: 5,
    expectedReturn: 'Game-time decision',
    lastUpdate: new Date().toISOString(),
    bettingImpact: 'Chiefs line moved from -7 to -3.5 after injury report',
    lineMovement: { before: -7, after: -3.5, type: 'spread' },
    isStarter: true,
    isStar: true
  },
  {
    id: '2',
    playerName: 'Jaylen Brown',
    team: 'BOS',
    position: 'SG',
    sport: 'NBA',
    injuryType: 'Hamstring Strain',
    bodyPart: 'Hamstring',
    status: 'Out',
    impactRating: 4,
    expectedReturn: '2-3 games',
    lastUpdate: new Date().toISOString(),
    bettingImpact: 'Total dropped from 228 to 222 without Brown',
    lineMovement: { before: 228, after: 222, type: 'total' },
    isStarter: true,
    isStar: true
  },
  {
    id: '3',
    playerName: 'Connor McDavid',
    team: 'EDM',
    position: 'C',
    sport: 'NHL',
    injuryType: 'Lower Body',
    bodyPart: 'Undisclosed',
    status: 'Day-to-Day',
    impactRating: 5,
    expectedReturn: 'TBD',
    lastUpdate: new Date().toISOString(),
    bettingImpact: 'Oilers dropped from -180 to +110 favorites',
    lineMovement: { before: -180, after: 110, type: 'moneyline' },
    isStarter: true,
    isStar: true
  },
  {
    id: '4',
    playerName: 'Mike Trout',
    team: 'LAA',
    position: 'CF',
    sport: 'MLB',
    injuryType: 'Knee Surgery',
    bodyPart: 'Knee',
    status: 'IL',
    impactRating: 5,
    expectedReturn: 'April 2025',
    lastUpdate: new Date().toISOString(),
    bettingImpact: 'Angels season win total dropped from 78.5 to 72.5',
    isStarter: true,
    isStar: true
  }
]

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const sport = searchParams.get('sport')
  const status = searchParams.get('status')
  const impactMin = searchParams.get('impactMin')

  let injuries = [...mockInjuries]

  // Filter by sport
  if (sport && sport !== 'all') {
    injuries = injuries.filter(i => i.sport === sport)
  }

  // Filter by status
  if (status && status !== 'all') {
    injuries = injuries.filter(i => i.status === status)
  }

  // Filter by minimum impact rating
  if (impactMin) {
    injuries = injuries.filter(i => i.impactRating >= parseInt(impactMin))
  }

  return NextResponse.json({
    injuries,
    count: injuries.length,
    lastUpdated: new Date().toISOString()
  })
}
