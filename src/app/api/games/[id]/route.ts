import { NextResponse } from 'next/server'
import { getScoreboard, getGameDetails, transformESPNGame, ESPN_SPORTS, type SportKey } from '@/lib/api/espn'
import { fetchActionNetworkGames } from '@/lib/scrapers/action-network'

export const runtime = 'nodejs'

// Fuzzy team matching helper
function teamMatches(name1: string, name2: string): boolean {
  const normalize = (s: string) => s.toLowerCase().replace(/[^a-z]/g, '')
  const n1 = normalize(name1)
  const n2 = normalize(name2)
  return n1.includes(n2) || n2.includes(n1) || n1 === n2
}

// GET /api/games/[id]?sport=NFL
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { searchParams } = new URL(request.url)
  const sport = searchParams.get('sport')?.toUpperCase() as SportKey | null
  
  // Handle Action Network IDs (prefixed with 'an-')
  if (id.startsWith('an-') && sport) {
    const anId = id.replace('an-', '')
    console.log(`[API] Looking up Action Network game: ${anId} for ${sport}`)
    
    try {
      // Fetch Action Network games for this sport
      const anGames = await fetchActionNetworkGames(sport)
      const anGame = anGames.find((g: { id: string | number }) => String(g.id) === anId)
      
      if (anGame) {
        // Extract team names from Action Network data
        const homeTeam = anGame.teams?.find((t: { id: number }) => t.id === anGame.home_team_id)
        const awayTeam = anGame.teams?.find((t: { id: number }) => t.id === anGame.away_team_id)
        
        if (homeTeam && awayTeam) {
          console.log(`[API] Found AN game: ${awayTeam.full_name} @ ${homeTeam.full_name}`)
          
          // Now find matching ESPN game by team names
          const scoreboard = await getScoreboard(sport as SportKey)
          const espnMatch = scoreboard.events.find(e => {
            const eHome = e.competitions[0]?.competitors?.find((c: { homeAway: string }) => c.homeAway === 'home')
            const eAway = e.competitions[0]?.competitors?.find((c: { homeAway: string }) => c.homeAway === 'away')
            
            if (!eHome || !eAway) return false
            
            const homeName = eHome.team?.displayName || eHome.team?.name || ''
            const awayName = eAway.team?.displayName || eAway.team?.name || ''
            
            return teamMatches(homeName, homeTeam.full_name) && 
                   teamMatches(awayName, awayTeam.full_name)
          })
          
          if (espnMatch) {
            console.log(`[API] Matched ESPN game ID: ${espnMatch.id}`)
            const game = transformESPNGame(espnMatch, sport as SportKey)
            return NextResponse.json(game)
          } else {
            console.log(`[API] No ESPN match found for ${awayTeam.full_name} @ ${homeTeam.full_name}`)
          }
        }
      }
      
      // If no match found, return helpful error
      return NextResponse.json({ 
        error: 'Game not found',
        hint: 'This game ID is from Action Network. Try searching by team names.',
        anId 
      }, { status: 404 })
    } catch (error) {
      console.error('[API] Error resolving Action Network game:', error)
    }
  }
  
  // If sport is provided, fetch specific game details (ESPN ID)
  if (sport && sport in ESPN_SPORTS) {
    try {
      const details = await getGameDetails(sport, id)
      if (!details) {
        return NextResponse.json({ error: 'Game not found' }, { status: 404 })
      }
      
      // Transform to our format
      const game = transformESPNGame(details as unknown as Parameters<typeof transformESPNGame>[0], sport)
      return NextResponse.json(game)
    } catch (error) {
      console.error('[API] Error fetching game:', error)
      return NextResponse.json({ error: 'Failed to fetch game' }, { status: 500 })
    }
  }
  
  // If no sport provided, search across all sports (including college)
  const sports: SportKey[] = ['NFL', 'NBA', 'NHL', 'MLB', 'NCAAF', 'NCAAB', 'WNBA', 'WNCAAB']
  
  for (const s of sports) {
    try {
      const scoreboard = await getScoreboard(s)
      const match = scoreboard.events.find(e => e.id === id)
      if (match) {
        const game = transformESPNGame(match, s)
        return NextResponse.json(game)
      }
    } catch {
      // Continue to next sport
    }
  }
  
  return NextResponse.json({ error: 'Game not found' }, { status: 404 })
}
