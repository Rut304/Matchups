// =============================================================================
// GAME SUMMARY API - REAL ESPN DATA
// GET /api/games/[id]/summary
// Returns comprehensive real-time data from ESPN's summary API including:
// - Injuries (both teams with player details, status, return dates)
// - Team Leaders (QB, RB, WR stats for offense; sacks, tackles for defense)
// - Pickcenter betting lines (spread, ML, total with opening/closing)
// - Win Predictor (ESPN's probability model)
// - ATS records and trends (calculated from historical_games if ESPN doesn't provide)
// =============================================================================

import { NextRequest, NextResponse } from 'next/server'
import { getATSRecord } from '@/lib/api/ats-calculator'

export const dynamic = 'force-dynamic'

interface ESPNInjury {
  athlete: {
    id: string
    displayName: string
    shortName: string
    headshot?: { href: string }
    position?: { abbreviation: string }
  }
  status: string
  type: { description: string }
  details?: {
    type: string
    location: string
    detail: string
    side: string
    returnDate?: string
  }
}

interface ESPNLeader {
  displayName: string
  shortDisplayName?: string
  abbreviation?: string
  athlete: {
    id: string
    displayName: string
    shortName: string
    headshot?: { href: string }
    position?: { abbreviation: string }
    jersey?: string
  }
  displayValue: string
  value: number
  statistics?: Array<{
    name: string
    displayValue: string
  }>
}

interface ESPNOdds {
  provider: { name: string; id: string }
  details: string
  overUnder: number
  spread: number
  homeTeamOdds: {
    favorite: boolean
    underdog: boolean
    moneyLine: number
    spreadOdds: number
    teamId: string
    team: { abbreviation: string }
    spreadRecord?: { summary: string }
  }
  awayTeamOdds: {
    favorite: boolean
    underdog: boolean
    moneyLine: number
    spreadOdds: number
    teamId: string
    team: { abbreviation: string }
    spreadRecord?: { summary: string }
  }
  open?: {
    spread: { home: { pointSpread: { american: string } } }
    total: { overUnder: number }
  }
  current?: {
    spread: { home: { pointSpread: { american: string } } }
    total: { overUnder: number }
  }
}

interface ESPNPredictor {
  homeTeam: { id: string; gameProjection: number }
  awayTeam: { id: string; gameProjection: number }
}

// Last 5 games for a team
interface TeamLastFiveGame {
  id: string
  week: number | string
  date: string
  opponent: string
  atVs: string
  score: string
  result: 'W' | 'L'
  isHome: boolean
}

interface GameSummaryResponse {
  gameId: string
  sport: string
  injuries: {
    homeTeam: ESPNInjury[]
    awayTeam: ESPNInjury[]
    impactSummary: {
      homeInjuredStarters: number
      awayInjuredStarters: number
      homeOutPlayers: number
      awayOutPlayers: number
    }
  }
  leaders: {
    homeTeam: {
      name: string
      abbreviation: string
      leaders: ESPNLeader[]
    }
    awayTeam: {
      name: string
      abbreviation: string
      leaders: ESPNLeader[]
    }
  }
  odds: ESPNOdds | null
  predictor: {
    homeWinProbability: number
    awayWinProbability: number
  } | null
  atsRecords: {
    homeTeam: { ats: string; ou: string } | null
    awayTeam: { ats: string; ou: string } | null
  }
  lineMovement: {
    openingSpread: string | null
    currentSpread: string | null
    openingTotal: number | null
    currentTotal: number | null
    spreadMove: number | null
    totalMove: number | null
  }
  lastFiveGames: {
    homeTeam: { team: { id: string; name: string; abbreviation: string }; games: TeamLastFiveGame[] }
    awayTeam: { team: { id: string; name: string; abbreviation: string }; games: TeamLastFiveGame[] }
  }
  lastUpdated: string
}

// Map sport to ESPN sport path
function getSportPath(sport: string): string {
  const sportMap: Record<string, string> = {
    'NFL': 'football/nfl',
    'NBA': 'basketball/nba',
    'MLB': 'baseball/mlb',
    'NHL': 'hockey/nhl',
    'NCAAF': 'football/college-football',
    'NCAAB': 'basketball/mens-college-basketball',
    'WNBA': 'basketball/wnba'
  }
  return sportMap[sport.toUpperCase()] || 'football/nfl'
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: gameId } = await params
    const { searchParams } = new URL(request.url)
    const sport = searchParams.get('sport')?.toUpperCase() || 'NFL'

    const sportPath = getSportPath(sport)
    const summaryUrl = `https://site.api.espn.com/apis/site/v2/sports/${sportPath}/summary?event=${gameId}`
    
    console.log(`[Summary API] Fetching: ${summaryUrl}`)
    
    const response = await fetch(summaryUrl, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Matchups/1.0'
      },
      next: { revalidate: 60 } // Cache for 60 seconds
    })

    if (!response.ok) {
      console.error(`[Summary API] ESPN returned ${response.status}`)
      return NextResponse.json(
        { success: false, error: `ESPN API returned ${response.status}` },
        { status: response.status }
      )
    }

    const data = await response.json()
    
    // Extract injuries from both teams
    const injuries: GameSummaryResponse['injuries'] = {
      homeTeam: [],
      awayTeam: [],
      impactSummary: {
        homeInjuredStarters: 0,
        awayInjuredStarters: 0,
        homeOutPlayers: 0,
        awayOutPlayers: 0
      }
    }

    if (data.injuries && Array.isArray(data.injuries)) {
      for (const teamInjuries of data.injuries) {
        const isHome = data.boxscore?.teams?.[1]?.team?.id === teamInjuries.team?.id
        const injuryList = teamInjuries.injuries || []
        
        const processed = injuryList.map((inj: ESPNInjury) => ({
          athlete: {
            id: inj.athlete?.id || '',
            displayName: inj.athlete?.displayName || 'Unknown',
            shortName: inj.athlete?.shortName || '',
            headshot: inj.athlete?.headshot?.href || null,
            position: inj.athlete?.position?.abbreviation || ''
          },
          status: inj.status || 'Unknown',
          type: inj.type?.description || '',
          details: inj.details || null
        }))
        
        if (isHome) {
          injuries.homeTeam = processed
          injuries.impactSummary.homeOutPlayers = processed.filter(
            (p: { status: string }) => p.status === 'Out' || p.status === 'Injured Reserve'
          ).length
        } else {
          injuries.awayTeam = processed
          injuries.impactSummary.awayOutPlayers = processed.filter(
            (p: { status: string }) => p.status === 'Out' || p.status === 'Injured Reserve'
          ).length
        }
      }
    }

    // Extract team leaders
    const leaders: GameSummaryResponse['leaders'] = {
      homeTeam: { name: '', abbreviation: '', leaders: [] },
      awayTeam: { name: '', abbreviation: '', leaders: [] }
    }

    if (data.leaders && Array.isArray(data.leaders)) {
      for (const teamLeaders of data.leaders) {
        const teamInfo = teamLeaders.team
        const isHome = data.boxscore?.teams?.[1]?.team?.id === teamInfo?.id
        
        const leaderList = (teamLeaders.leaders || []).map((cat: { leaders?: ESPNLeader[]; displayName?: string; shortDisplayName?: string; abbreviation?: string }) => {
          const topLeader = cat.leaders?.[0]
          if (!topLeader) return null
          
          return {
            category: cat.displayName || cat.shortDisplayName || '',
            abbreviation: cat.abbreviation || '',
            athlete: {
              id: topLeader.athlete?.id || '',
              displayName: topLeader.athlete?.displayName || 'Unknown',
              shortName: topLeader.athlete?.shortName || '',
              headshot: topLeader.athlete?.headshot?.href || null,
              position: topLeader.athlete?.position?.abbreviation || '',
              jersey: topLeader.athlete?.jersey || ''
            },
            displayValue: topLeader.displayValue || '',
            value: topLeader.value || 0,
            statistics: topLeader.statistics || []
          }
        }).filter(Boolean)
        
        if (isHome) {
          leaders.homeTeam = {
            name: teamInfo?.displayName || '',
            abbreviation: teamInfo?.abbreviation || '',
            leaders: leaderList
          }
        } else {
          leaders.awayTeam = {
            name: teamInfo?.displayName || '',
            abbreviation: teamInfo?.abbreviation || '',
            leaders: leaderList
          }
        }
      }
    }

    // Extract betting odds from pickcenter
    let odds: ESPNOdds | null = null
    let lineMovement: GameSummaryResponse['lineMovement'] = {
      openingSpread: null,
      currentSpread: null,
      openingTotal: null,
      currentTotal: null,
      spreadMove: null,
      totalMove: null
    }

    if (data.pickcenter && Array.isArray(data.pickcenter)) {
      // Find DraftKings or first available provider
      const dkOdds = data.pickcenter.find((p: { provider?: { name?: string } }) => 
        p.provider?.name?.toLowerCase().includes('draftkings')
      )
      const primaryOdds = dkOdds || data.pickcenter[0]
      
      if (primaryOdds) {
        odds = {
          provider: primaryOdds.provider || { name: 'Unknown', id: '' },
          details: primaryOdds.details || '',
          overUnder: primaryOdds.overUnder || 0,
          spread: primaryOdds.spread || 0,
          homeTeamOdds: primaryOdds.homeTeamOdds || {},
          awayTeamOdds: primaryOdds.awayTeamOdds || {},
          open: primaryOdds.open || null,
          current: primaryOdds.current || null
        }

        // Extract line movement from pointSpread, total, and moneyline open/close values
        const pointSpread = primaryOdds.pointSpread
        const total = primaryOdds.total
        
        if (pointSpread && total) {
          const openSpreadLine = parseFloat(pointSpread.home?.open?.line || '0')
          const closeSpreadLine = parseFloat(pointSpread.home?.close?.line || '0')
          const openTotal = parseFloat((total.over?.open?.line || '').replace(/[ou]/gi, '') || '0')
          const closeTotal = parseFloat((total.over?.close?.line || '').replace(/[ou]/gi, '') || '0')
          
          lineMovement = {
            openingSpread: pointSpread.home?.open?.line || null,
            currentSpread: pointSpread.home?.close?.line || null,
            openingTotal: openTotal || null,
            currentTotal: closeTotal || null,
            spreadMove: !isNaN(openSpreadLine) && !isNaN(closeSpreadLine) ? closeSpreadLine - openSpreadLine : null,
            totalMove: (openTotal && closeTotal) ? closeTotal - openTotal : null
          }
        }
      }
    }

    // Extract predictor/win probability
    let predictor: GameSummaryResponse['predictor'] = null
    if (data.predictor) {
      predictor = {
        homeWinProbability: data.predictor.homeTeam?.gameProjection || 50,
        awayWinProbability: data.predictor.awayTeam?.gameProjection || 50
      }
    }

    // Extract ATS records from againstTheSpread
    // If ESPN doesn't provide, calculate from historical_games
    const atsRecords: GameSummaryResponse['atsRecords'] = {
      homeTeam: null,
      awayTeam: null
    }

    if (data.againstTheSpread && Array.isArray(data.againstTheSpread)) {
      for (const ats of data.againstTheSpread) {
        const isHome = data.boxscore?.teams?.[1]?.team?.id === ats.team?.id
        
        const atsData = {
          ats: ats.records?.find((r: { type: string }) => r.type === 'againstTheSpread')?.summary || '',
          ou: ats.records?.find((r: { type: string }) => r.type === 'overUnder')?.summary || ''
        }
        
        if (isHome) {
          atsRecords.homeTeam = atsData
        } else {
          atsRecords.awayTeam = atsData
        }
      }
    }

    // If ESPN didn't provide ATS records, calculate from historical_games
    const homeAbbr = data.boxscore?.teams?.[1]?.team?.abbreviation
    const awayAbbr = data.boxscore?.teams?.[0]?.team?.abbreviation
    
    if ((!atsRecords.homeTeam?.ats || atsRecords.homeTeam.ats === '') && homeAbbr) {
      try {
        const calculatedATS = await getATSRecord(homeAbbr, sport)
        if (calculatedATS.ats) {
          atsRecords.homeTeam = calculatedATS
        }
      } catch (e) {
        console.log('[Summary API] Could not calculate home ATS:', e)
      }
    }
    
    if ((!atsRecords.awayTeam?.ats || atsRecords.awayTeam.ats === '') && awayAbbr) {
      try {
        const calculatedATS = await getATSRecord(awayAbbr, sport)
        if (calculatedATS.ats) {
          atsRecords.awayTeam = calculatedATS
        }
      } catch (e) {
        console.log('[Summary API] Could not calculate away ATS:', e)
      }
    }

    // Extract last 5 games for each team from ESPN summary
    const lastFiveGames: GameSummaryResponse['lastFiveGames'] = {
      homeTeam: { team: { id: '', name: '', abbreviation: '' }, games: [] },
      awayTeam: { team: { id: '', name: '', abbreviation: '' }, games: [] }
    }

    if (data.lastFiveGames && Array.isArray(data.lastFiveGames)) {
      for (const teamGames of data.lastFiveGames) {
        const teamInfo = teamGames.team
        const isHome = data.boxscore?.teams?.[1]?.team?.id === teamInfo?.id
        
        const games: TeamLastFiveGame[] = (teamGames.events || []).map((event: {
          id: string
          week?: number
          gameDate?: string
          atVs?: string
          opponent?: { abbreviation?: string; displayName?: string }
          score?: string
          gameResult?: string
        }) => ({
          id: event.id || '',
          week: event.week || '-',
          date: event.gameDate || '',
          opponent: event.opponent?.abbreviation || event.opponent?.displayName || '',
          atVs: event.atVs || 'vs',
          score: event.score || 'TBD',
          result: (event.gameResult === 'W' ? 'W' : 'L') as 'W' | 'L',
          isHome: event.atVs === 'vs'
        }))
        
        const teamData = {
          team: {
            id: teamInfo?.id || '',
            name: teamInfo?.displayName || '',
            abbreviation: teamInfo?.abbreviation || ''
          },
          games
        }
        
        if (isHome) {
          lastFiveGames.homeTeam = teamData
        } else {
          lastFiveGames.awayTeam = teamData
        }
      }
    }

    const result: GameSummaryResponse = {
      gameId,
      sport,
      injuries,
      leaders,
      odds,
      predictor,
      atsRecords,
      lineMovement,
      lastFiveGames,
      lastUpdated: new Date().toISOString()
    }

    return NextResponse.json({
      success: true,
      ...result
    })
  } catch (error) {
    console.error('[Summary API] Error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch game summary',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
