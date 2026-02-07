/**
 * ESPN Expert Picks Scraper
 * 
 * Scrapes expert picks from ESPN's picks page:
 * - NFL: https://www.espn.com/nfl/picks
 * - NBA: https://www.espn.com/nba/picks
 * - MLB: https://www.espn.com/mlb/picks
 * - NHL: https://www.espn.com/nhl/picks
 * - NCAAF: https://www.espn.com/college-football/picks
 * - NCAAB: https://www.espn.com/mens-college-basketball/picks
 * 
 * ESPN experts typically include:
 * - Staff writers and analysts
 * - Former players
 * - Guest experts
 * 
 * Their picks are against the spread (ATS) for football and straight up for most others.
 */

// Types
export interface ESPNExpertPick {
  expertName: string
  expertImage?: string
  pick: string // Team name or abbreviation
  pickType: 'straight_up' | 'ats' | 'over_under'
  confidence?: 'lock' | 'lean' | 'upset' | 'standard'
}

export interface ESPNGame {
  gameId: string
  sport: string
  homeTeam: string
  homeTeamLogo?: string
  awayTeam: string
  awayTeamLogo?: string
  gameDate: string
  gameTime: string
  spread?: number
  total?: number
  expertPicks: ESPNExpertPick[]
  consensusHomeTeamPct?: number
  consensusAwayTeamPct?: number
}

export interface ESPNExpert {
  name: string
  title?: string // "NFL Nation Reporter", "Senior Writer", etc.
  imageUrl?: string
  record: {
    season: {
      wins: number
      losses: number
      winPct: number
    }
    lastWeek?: {
      wins: number
      losses: number
    }
  }
  sport: string
  lastUpdated: string
}

// Sport URL mappings
const ESPN_PICKS_URLS: Record<string, string> = {
  'NFL': 'https://www.espn.com/nfl/picks',
  'NBA': 'https://www.espn.com/nba/picks',
  'MLB': 'https://www.espn.com/mlb/picks',
  'NHL': 'https://www.espn.com/nhl/picks',
  'NCAAF': 'https://www.espn.com/college-football/picks',
  'NCAAB': 'https://www.espn.com/mens-college-basketball/picks',
}

// ESPN API endpoint (discovered through network inspection)
// This is the actual data endpoint that powers the picks page
const ESPN_API_ENDPOINTS: Record<string, string> = {
  'NFL': 'https://site.api.espn.com/apis/site/v2/sports/football/nfl/picks',
  'NBA': 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba/picks',
  'MLB': 'https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/picks',
  'NHL': 'https://site.api.espn.com/apis/site/v2/sports/hockey/nhl/picks',
  'NCAAF': 'https://site.api.espn.com/apis/site/v2/sports/football/college-football/picks',
  'NCAAB': 'https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/picks',
}

/**
 * Fetch expert picks from ESPN API
 * This is the preferred method - uses their JSON API when available
 */
export async function fetchESPNPicksAPI(
  sport: string,
  week?: number,
  season?: number
): Promise<{ games: ESPNGame[]; experts: ESPNExpert[] }> {
  const baseUrl = ESPN_API_ENDPOINTS[sport.toUpperCase()]
  if (!baseUrl) {
    console.error(`Unknown sport for ESPN: ${sport}`)
    return { games: [], experts: [] }
  }

  // Build URL with optional week/season params
  let url = baseUrl
  const params = new URLSearchParams()
  if (week) params.append('week', week.toString())
  if (season) params.append('season', season.toString())
  if (params.toString()) url += `?${params.toString()}`

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'application/json',
      },
      next: { revalidate: 1800 }, // Cache for 30 minutes
    })

    if (!response.ok) {
      // If API fails, fall back to HTML scraping
      console.log(`ESPN API returned ${response.status}, falling back to HTML scraping`)
      return fetchESPNPicksHTML(sport)
    }

    const data = await response.json()
    return parseESPNAPIResponse(data, sport)
  } catch (error) {
    console.error('ESPN API error, falling back to HTML:', error)
    return fetchESPNPicksHTML(sport)
  }
}

/**
 * Parse ESPN API response
 */
function parseESPNAPIResponse(
  data: any,
  sport: string
): { games: ESPNGame[]; experts: ESPNExpert[] } {
  const games: ESPNGame[] = []
  const expertsMap = new Map<string, ESPNExpert>()

  try {
    // ESPN API structure varies but generally has events and picks
    const events = data.events || data.games || []
    const picksData = data.picks || {}
    const expertsData = data.experts || data.pickers || []

    // Parse experts
    for (const expert of expertsData) {
      const name = expert.name || expert.displayName
      if (!name) continue

      expertsMap.set(name, {
        name,
        title: expert.title || expert.position,
        imageUrl: expert.headshot?.href || expert.image,
        record: {
          season: {
            wins: expert.stats?.wins || 0,
            losses: expert.stats?.losses || 0,
            winPct: expert.stats?.winPct || 0,
          },
          lastWeek: expert.lastWeek ? {
            wins: expert.lastWeek.wins || 0,
            losses: expert.lastWeek.losses || 0,
          } : undefined,
        },
        sport: sport.toUpperCase(),
        lastUpdated: new Date().toISOString(),
      })
    }

    // Parse games and their picks
    for (const event of events) {
      const game: ESPNGame = {
        gameId: event.id || `espn-${event.uid}`,
        sport: sport.toUpperCase(),
        homeTeam: event.competitions?.[0]?.competitors?.find((c: any) => c.homeAway === 'home')?.team?.displayName || '',
        awayTeam: event.competitions?.[0]?.competitors?.find((c: any) => c.homeAway === 'away')?.team?.displayName || '',
        gameDate: event.date || new Date().toISOString(),
        gameTime: event.time || '',
        spread: event.spread || event.odds?.details,
        total: event.overUnder || event.odds?.overUnder,
        expertPicks: [],
      }

      // Get picks for this game
      const gamePicks = picksData[event.id] || event.picks || []
      for (const pick of gamePicks) {
        const expertName = pick.expert?.name || pick.picker?.name
        if (!expertName) continue

        game.expertPicks.push({
          expertName,
          expertImage: pick.expert?.headshot?.href,
          pick: pick.selection?.team?.displayName || pick.pick,
          pickType: pick.pickType || (sport === 'NFL' || sport === 'NCAAF' ? 'ats' : 'straight_up'),
          confidence: pick.confidence || pick.isLock ? 'lock' : 'standard',
        })
      }

      if (game.homeTeam && game.awayTeam) {
        games.push(game)
      }
    }
  } catch (error) {
    console.error('Error parsing ESPN API response:', error)
  }

  return { games, experts: Array.from(expertsMap.values()) }
}

/**
 * Fallback: Scrape ESPN picks from HTML page
 * Used when API is unavailable or changes
 */
async function fetchESPNPicksHTML(sport: string): Promise<{ games: ESPNGame[]; experts: ESPNExpert[] }> {
  const url = ESPN_PICKS_URLS[sport.toUpperCase()]
  if (!url) {
    return { games: [], experts: [] }
  }

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'text/html',
      },
      next: { revalidate: 3600 },
    })

    if (!response.ok) {
      return { games: [], experts: [] }
    }

    const html = await response.text()
    return parseESPNPicksHTML(html, sport)
  } catch (error) {
    console.error('ESPN HTML scraping error:', error)
    return { games: [], experts: [] }
  }
}

/**
 * Parse ESPN picks page HTML
 * Note: This is fragile and will break when ESPN changes their layout
 */
function parseESPNPicksHTML(html: string, sport: string): { games: ESPNGame[]; experts: ESPNExpert[] } {
  const games: ESPNGame[] = []
  const experts: ESPNExpert[] = []

  // ESPN embeds data in script tags as JSON
  // Look for the __NEXT_DATA__ or espn.picks data
  const nextDataMatch = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/i)
  if (nextDataMatch) {
    try {
      const nextData = JSON.parse(nextDataMatch[1])
      const pageProps = nextData.props?.pageProps
      if (pageProps) {
        return parseESPNAPIResponse(pageProps, sport)
      }
    } catch (e) {
      console.log('Could not parse __NEXT_DATA__')
    }
  }

  // Fallback: Look for window.espn.picks or similar
  const espnDataMatch = html.match(/window\.espn\.picks\s*=\s*({[\s\S]*?});/i)
  if (espnDataMatch) {
    try {
      const espnData = JSON.parse(espnDataMatch[1])
      return parseESPNAPIResponse(espnData, sport)
    } catch (e) {
      console.log('Could not parse window.espn.picks')
    }
  }

  // If no JSON data found, try basic HTML parsing
  // This is very simplified and unlikely to capture all data
  const expertMatches = html.matchAll(
    /<div[^>]*class="[^"]*expert[^"]*"[^>]*>[\s\S]*?<span[^>]*class="[^"]*name[^"]*"[^>]*>([^<]+)<\/span>[\s\S]*?<span[^>]*class="[^"]*record[^"]*"[^>]*>(\d+)-(\d+)/gi
  )

  for (const match of expertMatches) {
    const [, name, wins, losses] = match
    experts.push({
      name: name.trim(),
      record: {
        season: {
          wins: parseInt(wins),
          losses: parseInt(losses),
          winPct: parseInt(wins) / (parseInt(wins) + parseInt(losses)) * 100,
        },
      },
      sport: sport.toUpperCase(),
      lastUpdated: new Date().toISOString(),
    })
  }

  return { games, experts }
}

/**
 * Fetch all ESPN picks for current week across all sports
 */
export async function fetchAllSportsESPNPicks(): Promise<Map<string, { games: ESPNGame[]; experts: ESPNExpert[] }>> {
  const results = new Map()

  for (const sport of Object.keys(ESPN_PICKS_URLS)) {
    try {
      const data = await fetchESPNPicksAPI(sport)
      results.set(sport, data)
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000))
    } catch (error) {
      console.error(`Error fetching ESPN ${sport} picks:`, error)
      results.set(sport, { games: [], experts: [] })
    }
  }

  return results
}

/**
 * Fetch specific week NFL picks (useful for tracking season-long)
 */
export async function fetchNFLPicksByWeek(week: number, season?: number): Promise<{ games: ESPNGame[]; experts: ESPNExpert[] }> {
  return fetchESPNPicksAPI('NFL', week, season)
}

/**
 * Store ESPN picks in database for historical tracking
 */
export async function storeESPNPicksInDB(
  games: ESPNGame[],
  experts: ESPNExpert[],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any
): Promise<void> {
  // Store expert records
  const expertRecords = experts.map(e => ({
    name: e.name,
    source: 'espn',
    sport: e.sport,
    title: e.title,
    image_url: e.imageUrl,
    season_wins: e.record.season.wins,
    season_losses: e.record.season.losses,
    season_win_pct: e.record.season.winPct,
    last_updated: e.lastUpdated,
  }))

  if (expertRecords.length > 0) {
    const { error: expertError } = await supabase
      .from('expert_records')
      .upsert(expertRecords, { onConflict: 'name,source,sport' })

    if (expertError) {
      console.error('Error storing ESPN experts:', expertError)
    }
  }

  // Store individual picks for tracking
  const pickRecords: any[] = []
  for (const game of games) {
    for (const pick of game.expertPicks) {
      pickRecords.push({
        expert_name: pick.expertName,
        source: 'espn',
        sport: game.sport,
        game_id: game.gameId,
        home_team: game.homeTeam,
        away_team: game.awayTeam,
        game_date: game.gameDate,
        pick: pick.pick,
        pick_type: pick.pickType,
        confidence: pick.confidence,
        spread: game.spread,
        total: game.total,
        created_at: new Date().toISOString(),
      })
    }
  }

  if (pickRecords.length > 0) {
    const { error: pickError } = await supabase
      .from('expert_picks')
      .upsert(pickRecords, { onConflict: 'expert_name,source,game_id' })

    if (pickError) {
      console.error('Error storing ESPN picks:', pickError)
    }
  }
}

// Known ESPN experts to track (updated per season)
export const KNOWN_ESPN_EXPERTS = {
  NFL: [
    'Dan Graziano',
    'Jeremy Fowler', 
    'Matt Bowen',
    'Mike Clay',
    'Eric Moody',
    'Seth Walder',
    'Tristan Cockcroft',
    'Kalyn Kahler',
    'Sam Acho',
    'Louis Riddick',
  ],
  NBA: [
    'Kevin Pelton',
    'Tim Bontemps',
    'Bobby Marks',
    'Zach Lowe',
    'Brian Windhorst',
  ],
  NCAAF: [
    'Chris Low',
    'Adam Rittenberg',
    'Mark Schlabach',
    'Dave Hale',
    'Bill Connelly',
  ],
  NCAAB: [
    'Jeff Borzello',
    'John Gasaway',
    'Joe Lunardi',
    'Myron Medcalf',
  ],
}
