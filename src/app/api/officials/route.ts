import { NextRequest, NextResponse } from 'next/server'
import { getGameOfficials, getOfficialsBySport, searchOfficials } from '@/lib/api/officials'

/**
 * GET /api/officials
 * 
 * Params:
 * - gameId: Get officials for a specific game
 * - sport: Filter by sport (nfl, nba, mlb, nhl)
 * - search: Search officials by name
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const gameId = searchParams.get('gameId')
    const sport = searchParams.get('sport')
    const search = searchParams.get('search')
    
    // Search by name
    if (search) {
      const officials = await searchOfficials(search, sport || undefined)
      return NextResponse.json({ officials })
    }
    
    // Get officials for a specific game
    if (gameId && sport) {
      const gameOfficials = await getGameOfficials(gameId, sport)
      
      if (!gameOfficials) {
        // No assigned officials - return sport's refs for display
        const sportOfficials = await getOfficialsBySport(sport)
        
        // Pick a random official for demo purposes
        if (sportOfficials.length > 0) {
          const randomRef = sportOfficials[Math.floor(Math.random() * sportOfficials.length)]
          return NextResponse.json({
            gameId,
            sport,
            officials: [{ official: randomRef, role: 'referee' }],
            bettingImplications: {
              spreadTendency: randomRef.homeCoverPct > 52 ? 'home' : randomRef.homeCoverPct < 48 ? 'away' : 'neutral',
              totalTendency: randomRef.overPct > 52 ? 'over' : randomRef.overPct < 48 ? 'under' : 'neutral',
              keyInsights: getInsights(randomRef),
              confidenceLevel: 'medium'
            },
            note: 'Officials not confirmed - showing typical referee data'
          })
        }
        
        return NextResponse.json({ officials: null, message: 'No officials data available' })
      }
      
      return NextResponse.json(gameOfficials)
    }
    
    // Get all officials for a sport
    if (sport) {
      const officials = await getOfficialsBySport(sport)
      return NextResponse.json({ 
        sport,
        officials,
        count: officials.length
      })
    }
    
    return NextResponse.json({ 
      error: 'Missing parameters. Provide gameId+sport, sport, or search' 
    }, { status: 400 })
    
  } catch (error) {
    console.error('Officials API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch officials data' },
      { status: 500 }
    )
  }
}

// Helper to generate insights
function getInsights(official: { name: string; homeCoverPct: number; overPct: number; avgTotalPoints: number }): string[] {
  const insights: string[] = []
  
  if (official.overPct >= 54) {
    insights.push(`OVER tendency: ${official.overPct.toFixed(1)}% of games go over`)
  } else if (official.overPct <= 46) {
    insights.push(`UNDER tendency: ${(100 - official.overPct).toFixed(1)}% of games go under`)
  }
  
  if (official.homeCoverPct >= 53) {
    insights.push(`Home teams cover ${official.homeCoverPct.toFixed(1)}% with ${official.name}`)
  } else if (official.homeCoverPct <= 47) {
    insights.push(`Away teams cover ${(100 - official.homeCoverPct).toFixed(1)}% with ${official.name}`)
  }
  
  insights.push(`Average total: ${official.avgTotalPoints.toFixed(1)} points`)
  
  return insights
}
