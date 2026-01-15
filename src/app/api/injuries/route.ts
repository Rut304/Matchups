import { NextResponse } from 'next/server'
import { getTeams, getTeamInjuries, ESPN_SPORTS, type SportKey, type ESPNInjury } from '@/lib/api/espn'

// Team abbreviation to ID mapping - built dynamically
const teamIdCache: Record<string, Record<string, string>> = {}

async function getTeamIdMap(sport: SportKey): Promise<Record<string, string>> {
  if (teamIdCache[sport]) return teamIdCache[sport]
  
  try {
    const teams = await getTeams(sport)
    const map: Record<string, string> = {}
    teams.forEach(team => {
      map[team.abbreviation.toUpperCase()] = team.id
      map[team.displayName.toUpperCase()] = team.id
    })
    teamIdCache[sport] = map
    return map
  } catch {
    return {}
  }
}

interface NormalizedInjury {
  id: string
  playerId: string
  name: string
  team: string
  position: string
  sport: string
  injury: string
  status: 'Out' | 'Doubtful' | 'Questionable' | 'Probable' | 'Day-to-Day' | 'IR' | 'GTD'
  expectedReturn?: string
  lastUpdated?: string
  headshot?: string
}

function normalizeStatus(status: string): NormalizedInjury['status'] {
  const s = status.toLowerCase()
  if (s.includes('out') || s === 'o') return 'Out'
  if (s.includes('doubtful') || s === 'd') return 'Doubtful'
  if (s.includes('questionable') || s === 'q') return 'Questionable'
  if (s.includes('probable') || s === 'p') return 'Probable'
  if (s.includes('day-to-day') || s.includes('dtd')) return 'Day-to-Day'
  if (s.includes('ir') || s.includes('injured reserve') || s.includes('il')) return 'IR'
  if (s.includes('gtd') || s.includes('game-time')) return 'GTD'
  return 'Questionable'
}

function normalizeESPNInjury(injury: ESPNInjury, sport: string, teamAbbr: string): NormalizedInjury {
  return {
    id: `${sport}-${injury.athlete.id}`,
    playerId: injury.athlete.id,
    name: injury.athlete.displayName,
    team: teamAbbr,
    position: injury.athlete.position?.abbreviation || 'N/A',
    sport: sport.toUpperCase(),
    injury: injury.type?.description || injury.details?.detail || 'Undisclosed',
    status: normalizeStatus(injury.status),
    expectedReturn: injury.details?.returnDate,
    lastUpdated: injury.date,
    headshot: injury.athlete.headshot?.href,
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const sport = searchParams.get('sport')?.toUpperCase() as SportKey | 'ALL' | null
  const status = searchParams.get('status')
  const team = searchParams.get('team')?.toUpperCase()

  const allInjuries: NormalizedInjury[] = []
  
  // Determine which sports to fetch
  const sportsToFetch: SportKey[] = sport && sport !== 'ALL' && ESPN_SPORTS[sport as SportKey]
    ? [sport as SportKey]
    : ['NFL', 'NBA', 'NHL', 'MLB'] as SportKey[]

  // Fetch injuries from ESPN for each sport
  await Promise.all(
    sportsToFetch.map(async (s) => {
      try {
        const teams = await getTeams(s)
        
        // If filtering by team, only fetch that team's injuries
        const teamsToFetch = team 
          ? teams.filter(t => t.abbreviation.toUpperCase() === team || t.displayName.toUpperCase().includes(team))
          : teams
        
        // Fetch injuries for each team (ESPN requires team-by-team fetching)
        // Limit to top teams to avoid too many API calls
        const limitedTeams = teamsToFetch.slice(0, team ? teamsToFetch.length : 10)
        
        await Promise.all(
          limitedTeams.map(async (teamData) => {
            try {
              const injuries = await getTeamInjuries(s, teamData.id)
              injuries.forEach((inj: ESPNInjury) => {
                allInjuries.push(normalizeESPNInjury(inj, s, teamData.abbreviation))
              })
            } catch {
              // Skip team if error
            }
          })
        )
      } catch (error) {
        console.error(`Error fetching ${s} injuries:`, error)
      }
    })
  )

  // Apply status filter
  let filteredInjuries = allInjuries
  if (status && status !== 'all') {
    filteredInjuries = filteredInjuries.filter(i => i.status === status)
  }

  // Sort by impact (Out/IR first, then Doubtful, Questionable, etc.)
  const statusOrder = ['Out', 'IR', 'Doubtful', 'GTD', 'Day-to-Day', 'Questionable', 'Probable']
  filteredInjuries.sort((a, b) => statusOrder.indexOf(a.status) - statusOrder.indexOf(b.status))

  return NextResponse.json({
    injuries: filteredInjuries,
    count: filteredInjuries.length,
    lastUpdated: new Date().toISOString(),
    source: 'espn'
  })
}
