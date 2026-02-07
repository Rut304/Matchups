/**
 * Covers.com Expert Consensus Scraper
 * 
 * Scrapes expert consensus data from Covers.com including:
 * - Expert picks consensus
 * - Public betting percentages
 * - Line movements
 * 
 * IMPORTANT: Scrape responsibly - max 2-3 times per day as records don't change often
 * ToS Warning: Automated scraping may violate Covers.com terms of service
 */

// Types for Covers consensus data
export interface CoversExpertPick {
  expertName: string
  pick: string // Team abbreviation or "Over/Under"
  pickType: 'spread' | 'moneyline' | 'total'
  confidence?: number
  reasoning?: string
}

export interface CoversConsensus {
  gameId: string
  sport: string
  homeTeam: string
  awayTeam: string
  gameDate: string
  gameTime: string
  
  // Consensus picks
  spreadConsensus: {
    homePct: number
    awayPct: number
    totalExperts: number
  }
  totalConsensus: {
    overPct: number
    underPct: number
    totalExperts: number
  }
  moneylineConsensus?: {
    homePct: number
    awayPct: number
    totalExperts: number
  }
  
  // Individual expert picks (when available)
  expertPicks?: CoversExpertPick[]
  
  // Line info
  currentSpread?: number
  currentTotal?: number
  openingSpread?: number
  openingTotal?: number
  
  scrapedAt: string
}

export interface CoversExpert {
  name: string
  handle?: string // Covers username if different
  sport: string
  record: {
    wins: number
    losses: number
    pushes: number
    winPct: number
    units?: number
    roi?: number
  }
  streak?: {
    type: 'W' | 'L'
    length: number
  }
  lastUpdated: string
  profileUrl?: string
}

// Sport URL mappings for Covers
const COVERS_SPORT_URLS: Record<string, string> = {
  'NFL': 'https://contests.covers.com/consensus/nfl',
  'NBA': 'https://contests.covers.com/consensus/nba',
  'NHL': 'https://contests.covers.com/consensus/nhl',
  'MLB': 'https://contests.covers.com/consensus/mlb',
  'NCAAF': 'https://contests.covers.com/consensus/ncaaf',
  'NCAAB': 'https://contests.covers.com/consensus/ncaab',
}

// Covers expert picks pages
const COVERS_EXPERT_URLS: Record<string, string> = {
  'NFL': 'https://www.covers.com/nfl/picks',
  'NBA': 'https://www.covers.com/nba/picks',
  'NHL': 'https://www.covers.com/nhl/picks',
  'MLB': 'https://www.covers.com/mlb/picks',
  'NCAAF': 'https://www.covers.com/ncaaf/picks',
  'NCAAB': 'https://www.covers.com/ncaab/picks',
}

/**
 * Fetch consensus data from Covers.com
 * Note: This scrapes HTML which may break if Covers changes their layout
 */
export async function fetchCoversConsensus(sport: string): Promise<CoversConsensus[]> {
  const url = COVERS_SPORT_URLS[sport.toUpperCase()]
  if (!url) {
    console.error(`Unknown sport for Covers: ${sport}`)
    return []
  }

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Referer': 'https://www.covers.com/',
      },
      next: { revalidate: 3600 }, // Cache for 1 hour - don't hammer the site
    })

    if (!response.ok) {
      console.error(`Covers.com returned ${response.status}`)
      return []
    }

    const html = await response.text()
    return parseCoversConsensusHTML(html, sport)
  } catch (error) {
    console.error('Error fetching Covers consensus:', error)
    return []
  }
}

/**
 * Parse Covers consensus HTML
 * This is fragile and will need updates if Covers changes their site
 */
function parseCoversConsensusHTML(html: string, sport: string): CoversConsensus[] {
  const consensus: CoversConsensus[] = []
  
  // Look for game blocks - Covers uses specific class names
  // This is a simplified parser - real implementation would use cheerio or similar
  
  // Extract games from the consensus table
  const gameMatches = html.matchAll(
    /<tr[^>]*data-game-id="([^"]+)"[^>]*>[\s\S]*?<\/tr>/gi
  )
  
  for (const match of gameMatches) {
    try {
      const gameHtml = match[0]
      const gameId = match[1]
      
      // Extract team names (simplified - real impl needs proper parsing)
      const teamMatch = gameHtml.match(/data-home-team="([^"]+)".*?data-away-team="([^"]+)"/i)
      if (!teamMatch) continue
      
      // Extract consensus percentages
      const spreadMatch = gameHtml.match(/data-spread-home="([\d.]+)".*?data-spread-away="([\d.]+)"/i)
      const totalMatch = gameHtml.match(/data-total-over="([\d.]+)".*?data-total-under="([\d.]+)"/i)
      
      consensus.push({
        gameId,
        sport: sport.toUpperCase(),
        homeTeam: teamMatch[1],
        awayTeam: teamMatch[2],
        gameDate: new Date().toISOString().split('T')[0],
        gameTime: '',
        spreadConsensus: {
          homePct: spreadMatch ? parseFloat(spreadMatch[1]) : 50,
          awayPct: spreadMatch ? parseFloat(spreadMatch[2]) : 50,
          totalExperts: 0,
        },
        totalConsensus: {
          overPct: totalMatch ? parseFloat(totalMatch[1]) : 50,
          underPct: totalMatch ? parseFloat(totalMatch[2]) : 50,
          totalExperts: 0,
        },
        scrapedAt: new Date().toISOString(),
      })
    } catch (e) {
      console.error('Error parsing game:', e)
    }
  }
  
  // If HTML parsing failed (likely due to site changes), try JSON API
  if (consensus.length === 0) {
    console.log('HTML parsing returned no results, site structure may have changed')
    // Could try API endpoints here if we discover them
  }
  
  return consensus
}

/**
 * Fetch expert picks articles from Covers
 */
export async function fetchCoversExpertPicks(sport: string): Promise<{
  articles: Array<{
    title: string
    author: string
    url: string
    picks: string[]
    publishedAt: string
  }>
}> {
  const url = COVERS_EXPERT_URLS[sport.toUpperCase()]
  if (!url) {
    return { articles: [] }
  }

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'text/html',
      },
      next: { revalidate: 7200 }, // Cache for 2 hours
    })

    if (!response.ok) {
      return { articles: [] }
    }

    const html = await response.text()
    
    // Parse article cards from the picks page
    const articles: Array<{
      title: string
      author: string
      url: string
      picks: string[]
      publishedAt: string
    }> = []
    
    // Look for article cards (simplified parsing)
    const articleMatches = html.matchAll(
      /<article[^>]*>[\s\S]*?<h2[^>]*>[\s\S]*?<a[^>]*href="([^"]+)"[^>]*>([^<]+)<\/a>[\s\S]*?<\/article>/gi
    )
    
    for (const match of articleMatches) {
      const [, url, title] = match
      // Extract author from byline
      const authorMatch = match[0].match(/by\s+([^<,]+)/i)
      
      articles.push({
        title: title.trim(),
        author: authorMatch ? authorMatch[1].trim() : 'Covers Staff',
        url: url.startsWith('http') ? url : `https://www.covers.com${url}`,
        picks: [], // Would need to fetch full article to get picks
        publishedAt: new Date().toISOString(),
      })
    }
    
    return { articles }
  } catch (error) {
    console.error('Error fetching Covers expert picks:', error)
    return { articles: [] }
  }
}

/**
 * Fetch all consensus for multiple sports (batch operation)
 * Run this 2-3x daily max
 */
export async function fetchAllSportsConsensus(): Promise<Map<string, CoversConsensus[]>> {
  const results = new Map<string, CoversConsensus[]>()
  
  // Stagger requests to be nice to their servers
  for (const sport of Object.keys(COVERS_SPORT_URLS)) {
    const consensus = await fetchCoversConsensus(sport)
    results.set(sport, consensus)
    
    // Wait 2 seconds between sports to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 2000))
  }
  
  return results
}

/**
 * Store Covers consensus in database
 */
export async function storeCoversConsensusInDB(
  consensus: CoversConsensus[],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any
): Promise<void> {
  const records = consensus.map(c => ({
    game_id: c.gameId,
    sport: c.sport,
    home_team: c.homeTeam,
    away_team: c.awayTeam,
    game_date: c.gameDate,
    spread_home_pct: c.spreadConsensus.homePct,
    spread_away_pct: c.spreadConsensus.awayPct,
    total_over_pct: c.totalConsensus.overPct,
    total_under_pct: c.totalConsensus.underPct,
    current_spread: c.currentSpread,
    current_total: c.currentTotal,
    opening_spread: c.openingSpread,
    opening_total: c.openingTotal,
    source: 'covers',
    scraped_at: c.scrapedAt,
  }))

  const { error } = await supabase
    .from('expert_consensus')
    .upsert(records, { onConflict: 'game_id,source' })

  if (error) {
    console.error('Error storing Covers consensus:', error)
  }
}

// Known Covers analysts to track
export const KNOWN_COVERS_EXPERTS: Partial<CoversExpert>[] = [
  {
    name: 'Jason Logan',
    sport: 'NFL',
    profileUrl: 'https://www.covers.com/author/jason-logan',
  },
  {
    name: 'Neil Parker',
    sport: 'NFL',
    profileUrl: 'https://www.covers.com/author/neil-parker',
  },
  {
    name: 'Rohit Ponnaiya',
    sport: 'NFL',
    profileUrl: 'https://www.covers.com/author/rohit-ponnaiya',
  },
  {
    name: 'Chris Vasile',
    sport: 'NHL',
    profileUrl: 'https://www.covers.com/author/chris-vasile',
  },
]
