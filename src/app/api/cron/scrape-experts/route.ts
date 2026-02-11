import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Cron job endpoint for expert picks scraping
 * 
 * Runs on schedule from Vercel Cron:
 * - morning: 8 AM ET (1 PM UTC) - X + Covers
 * - pregame-nfl: 11 AM ET Sunday (4 PM UTC) - All sources
 * - pregame-weekday: 6:30 PM ET (11:30 PM UTC) - All sources
 * - postgame: 11:30 PM ET (4:30 AM UTC next day) - X only
 */

export const dynamic = 'force-dynamic'
export const maxDuration = 300 // 5 minutes for full scrape

// Import scrapers dynamically to avoid issues if env vars not set
async function runScrape(job: string) {
  const results: Record<string, any> = {}
  
  // Check if X API is configured
  const hasXAPI = !!(process.env.X_BEARER_TOKEN || process.env.TWITTER_BEARER_TOKEN)
  
  try {
    // Dynamically import to avoid constructor errors if env vars missing
    const { XScraper } = await import('@/lib/scrapers/x-scraper')
    const { fetchAllSportsESPNPicks, storeESPNPicksInDB } = await import('@/lib/scrapers/espn-picks-scraper')
    const { fetchAllSportsConsensus, storeCoversConsensusInDB } = await import('@/lib/scrapers/covers-scraper')
    
    const supabase = await createClient()
    
    switch (job) {
      case 'morning':
        // Morning: X + Covers (pre-picks)
        if (hasXAPI) {
          try {
            const xScraper = new XScraper()
            // Use batching: 3 experts per run with 2s delay to avoid rate limits
            results.twitter = await xScraper.scrapeAllExperts({ batchSize: 3, delayMs: 2000 })
          } catch (xError) {
            results.twitter = { error: xError instanceof Error ? xError.message : 'X scrape failed' }
          }
        } else {
          results.twitter = { skipped: 'X API not configured' }
        }
        
        // Wait before Covers
        await new Promise(r => setTimeout(r, 2000))
        
        try {
          const coversAll = await fetchAllSportsConsensus()
          for (const [sport, consensus] of coversAll) {
            await storeCoversConsensusInDB(consensus, supabase)
            results[`covers_${sport}`] = { consensus: consensus.length }
          }
        } catch (coversError) {
          results.covers = { error: coversError instanceof Error ? coversError.message : 'Covers scrape failed' }
        }
        break
      
      case 'pregame-nfl':
      case 'pregame-weekday':
        // Pre-game: All sources
        if (hasXAPI) {
          try {
            const xScraper = new XScraper()
            // Use batching: 3 experts per run with 2s delay to avoid rate limits
            results.twitter = await xScraper.scrapeAllExperts({ batchSize: 3, delayMs: 2000 })
          } catch (xError) {
            results.twitter = { error: xError instanceof Error ? xError.message : 'X scrape failed' }
          }
        }
        
        await new Promise(r => setTimeout(r, 2000))
        
        // ESPN
        try {
          const espnAll = await fetchAllSportsESPNPicks()
          for (const [sport, data] of espnAll) {
            await storeESPNPicksInDB(data.games, data.experts, supabase)
            results[`espn_${sport}`] = { games: data.games.length, experts: data.experts.length }
          }
        } catch (espnError) {
          results.espn = { error: espnError instanceof Error ? espnError.message : 'ESPN scrape failed' }
        }
        
        await new Promise(r => setTimeout(r, 2000))
        
        // Covers
        try {
          const coversAll = await fetchAllSportsConsensus()
          for (const [sport, consensus] of coversAll) {
            await storeCoversConsensusInDB(consensus, supabase)
            results[`covers_${sport}`] = { consensus: consensus.length }
          }
        } catch (coversError) {
          results.covers = { error: coversError instanceof Error ? coversError.message : 'Covers scrape failed' }
        }
        break
      
      case 'postgame':
        // Post-game: X only (capture final picks, prep for grading)
        if (hasXAPI) {
          try {
            const xScraper = new XScraper()
            // Use batching: 3 experts per run with 2s delay to avoid rate limits
            results.twitter = await xScraper.scrapeAllExperts({ batchSize: 3, delayMs: 2000 })
          } catch (xError) {
            results.twitter = { error: xError instanceof Error ? xError.message : 'X scrape failed' }
          }
        } else {
          results.twitter = { skipped: 'X API not configured' }
        }
        break
      
      default:
        results.error = `Unknown job: ${job}`
    }
    
    // Update job status in admin_settings
    try {
      const { data: current } = await supabase
        .from('admin_settings')
        .select('value')
        .eq('key', 'scraper_jobs')
        .single()
      
      if (current?.value) {
        const jobs = typeof current.value === 'string' 
          ? JSON.parse(current.value) 
          : current.value
        
        const updatedJobs = jobs.map((j: any) => 
          j.id === job 
            ? { ...j, status: 'completed', lastRun: new Date().toISOString() }
            : j
        )
        
        await supabase
          .from('admin_settings')
          .update({ value: updatedJobs, updated_at: new Date().toISOString() })
          .eq('key', 'scraper_jobs')
      }
    } catch (updateError) {
      console.error('Failed to update job status:', updateError)
    }
    
  } catch (importError) {
    results.error = `Failed to import scrapers: ${importError instanceof Error ? importError.message : 'Unknown'}`
  }
  
  return results
}

export async function GET(request: NextRequest) {
  // Verify cron secret for Vercel
  const authHeader = request.headers.get('authorization')
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    // Allow in development
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }
  
  const { searchParams } = new URL(request.url)
  const job = searchParams.get('job') || 'morning'
  
  console.log(`[CRON] Starting expert scrape: ${job}`)
  const startTime = Date.now()
  
  try {
    const results = await runScrape(job)
    const duration = Date.now() - startTime
    
    console.log(`[CRON] Expert scrape ${job} completed in ${duration}ms`)
    
    return NextResponse.json({
      success: true,
      job,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
      results,
    })
  } catch (error) {
    console.error(`[CRON] Expert scrape ${job} failed:`, error)
    
    return NextResponse.json({
      success: false,
      job,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }, { status: 500 })
  }
}
