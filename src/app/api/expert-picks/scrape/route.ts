import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { 
  fetchESPNPicksAPI, 
  fetchAllSportsESPNPicks,
  storeESPNPicksInDB,
  KNOWN_ESPN_EXPERTS 
} from '@/lib/scrapers/espn-picks-scraper'
import { 
  fetchCoversConsensus, 
  fetchAllSportsConsensus,
  storeCoversConsensusInDB,
  KNOWN_COVERS_EXPERTS
} from '@/lib/scrapers/covers-scraper'
import { XScraper } from '@/lib/scrapers/x-scraper'

/**
 * Expert Picks Scraper API
 * 
 * GET - Fetch current expert picks (no storage)
 * POST - Scrape and store expert picks (for cron jobs)
 * 
 * Recommended scrape schedule:
 * - ESPN: Every 4 hours during game days
 * - Covers: 2-3x per day (records don't change often)
 */

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const source = searchParams.get('source') || 'all'
  const sport = searchParams.get('sport') || 'NFL'

  try {
    const results: any = { sport, source, fetchedAt: new Date().toISOString() }

    if (source === 'espn' || source === 'all') {
      const espnData = await fetchESPNPicksAPI(sport)
      results.espn = {
        games: espnData.games.length,
        experts: espnData.experts,
        picks: espnData.games.flatMap(g => g.expertPicks).length,
      }
    }

    if (source === 'covers' || source === 'all') {
      const coversData = await fetchCoversConsensus(sport)
      results.covers = {
        games: coversData.length,
        consensus: coversData,
      }
    }

    return NextResponse.json(results)
  } catch (error) {
    console.error('Expert picks fetch error:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch expert picks',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { action, source, sport, sports } = body

    const supabase = await createClient()
    const results: any = { action, timestamp: new Date().toISOString() }

    switch (action) {
      case 'scrape-espn':
        // Scrape and store ESPN picks
        if (sports && Array.isArray(sports)) {
          // Multiple sports
          for (const s of sports) {
            const data = await fetchESPNPicksAPI(s)
            await storeESPNPicksInDB(data.games, data.experts, supabase)
            results[s] = { 
              games: data.games.length, 
              experts: data.experts.length,
              picks: data.games.flatMap(g => g.expertPicks).length
            }
            // Rate limit
            await new Promise(r => setTimeout(r, 1000))
          }
        } else {
          // Single sport
          const s = sport || 'NFL'
          const data = await fetchESPNPicksAPI(s)
          await storeESPNPicksInDB(data.games, data.experts, supabase)
          results[s] = { 
            games: data.games.length, 
            experts: data.experts.length,
            picks: data.games.flatMap(g => g.expertPicks).length
          }
        }
        break

      case 'scrape-espn-all':
        // Scrape all sports from ESPN
        const allESPN = await fetchAllSportsESPNPicks()
        for (const [s, data] of allESPN) {
          await storeESPNPicksInDB(data.games, data.experts, supabase)
          results[s] = { 
            games: data.games.length, 
            experts: data.experts.length 
          }
        }
        break

      case 'scrape-covers':
        // Scrape and store Covers consensus
        if (sports && Array.isArray(sports)) {
          for (const s of sports) {
            const consensus = await fetchCoversConsensus(s)
            await storeCoversConsensusInDB(consensus, supabase)
            results[s] = { consensus: consensus.length }
            await new Promise(r => setTimeout(r, 2000)) // Longer delay for Covers
          }
        } else {
          const s = sport || 'NFL'
          const consensus = await fetchCoversConsensus(s)
          await storeCoversConsensusInDB(consensus, supabase)
          results[s] = { consensus: consensus.length }
        }
        break

      case 'scrape-covers-all':
        // Scrape all sports from Covers
        const allCovers = await fetchAllSportsConsensus()
        for (const [s, consensus] of allCovers) {
          await storeCoversConsensusInDB(consensus, supabase)
          results[s] = { consensus: consensus.length }
        }
        break

      case 'scrape-all':
        // Full scrape (ESPN + Covers) - Use sparingly
        results.espn = {}
        results.covers = {}
        
        const espnAll = await fetchAllSportsESPNPicks()
        for (const [s, data] of espnAll) {
          await storeESPNPicksInDB(data.games, data.experts, supabase)
          results.espn[s] = { 
            games: data.games.length, 
            experts: data.experts.length 
          }
        }
        
        // Wait before hitting Covers
        await new Promise(r => setTimeout(r, 5000))
        
        const coversAll = await fetchAllSportsConsensus()
        for (const [s, consensus] of coversAll) {
          await storeCoversConsensusInDB(consensus, supabase)
          results.covers[s] = { consensus: consensus.length }
        }
        break

      case 'scrape-x':
      case 'scrape-twitter':
        // Scrape X/Twitter for expert picks
        try {
          const xScraper = new XScraper()
          
          if (body.handle) {
            // Scrape specific user
            const { tweets, picks } = await xScraper.scrapeExpert(body.handle)
            results.twitter = { 
              handle: body.handle, 
              tweets, 
              picks 
            }
          } else {
            // Scrape all tracked experts
            const xResults = await xScraper.scrapeAllExperts()
            results.twitter = xResults
          }
        } catch (xError) {
          results.twitter = { 
            error: xError instanceof Error ? xError.message : 'X API error',
            hint: 'Make sure X_BEARER_TOKEN is set in environment'
          }
        }
        break

      case 'scrape-x-user':
        // Scrape a specific X user by handle
        if (!body.handle) {
          return NextResponse.json({ error: 'handle is required' }, { status: 400 })
        }
        try {
          const xScraper = new XScraper()
          const { tweets, picks } = await xScraper.scrapeExpert(body.handle, body.sinceId)
          results.twitter = { 
            handle: body.handle, 
            tweets, 
            picks,
            message: `Scraped @${body.handle}` 
          }
        } catch (xError) {
          return NextResponse.json({
            error: xError instanceof Error ? xError.message : 'Failed to scrape user',
          }, { status: 500 })
        }
        break

      case 'get-x-picks':
        // Get unprocessed picks from X
        try {
          const xScraper = new XScraper()
          const unprocessed = await xScraper.getUnprocessedPicks()
          results.unprocessedPicks = unprocessed
          results.count = unprocessed.length
        } catch (xError) {
          results.error = xError instanceof Error ? xError.message : 'Failed to get picks'
        }
        break

      case 'get-leaderboard':
        // Get expert leaderboard from DB
        const { data: leaderboard, error: lbError } = await supabase
          .rpc('get_expert_leaderboard', {
            p_sport: sport || null,
            p_source: source || null,
            p_min_picks: 5
          })
        
        if (lbError) {
          return NextResponse.json({ error: lbError.message }, { status: 500 })
        }
        
        results.leaderboard = leaderboard
        break

      case 'update-results':
        // Update pick results from completed games
        // This would need to fetch game results and update expert_picks
        results.message = 'Result updating not yet implemented'
        break

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    return NextResponse.json({ success: true, ...results })
  } catch (error) {
    console.error('Expert picks POST error:', error)
    return NextResponse.json({ 
      error: 'Request failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// Export known experts for reference
export { KNOWN_ESPN_EXPERTS, KNOWN_COVERS_EXPERTS }
