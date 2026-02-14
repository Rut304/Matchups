import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

// Define all data feeds with their real cron schedules from vercel.json
const FEED_DEFINITIONS = [
  {
    id: 'update-scores',
    name: 'Live Score Updates',
    source: 'ESPN API',
    endpoint: '/api/cron/update-scores',
    schedule: '* 15-23,0-6 * * *',
    scheduleHuman: 'Every minute during games (10AM-1AM ET)',
    category: 'scores',
    requiresKey: false,
    description: 'Fetches live game scores from ESPN for all active sports',
  },
  {
    id: 'refresh-odds',
    name: 'Odds Refresh',
    source: 'Action Network',
    endpoint: '/api/cron/refresh-odds',
    schedule: '*/5 15-23,0-6 * * *',
    scheduleHuman: 'Every 5 min during games (10AM-1AM ET)',
    category: 'odds',
    requiresKey: false,
    description: 'Refreshes betting lines and odds from Action Network (free public API)',
  },
  {
    id: 'refresh-scores',
    name: 'Score Reconciliation',
    source: 'ESPN API',
    endpoint: '/api/cron/refresh-scores',
    schedule: '*/2 15-23,0-6 * * *',
    scheduleHuman: 'Every 2 min during games (10AM-1AM ET)',
    category: 'scores',
    requiresKey: false,
    description: 'Cross-checks and reconciles scores for accuracy',
  },
  {
    id: 'sync-games',
    name: 'Game Schedule Sync',
    source: 'ESPN API',
    endpoint: '/api/cron/sync-games',
    schedule: '0 */4 * * *',
    scheduleHuman: 'Every 4 hours',
    category: 'schedule',
    requiresKey: false,
    description: 'Syncs upcoming game schedules across all sports',
  },
  {
    id: 'refresh-standings',
    name: 'Standings Update',
    source: 'ESPN API',
    endpoint: '/api/cron/refresh-standings',
    schedule: '0 10,22 * * *',
    scheduleHuman: 'Twice daily (5AM, 5PM ET)',
    category: 'stats',
    requiresKey: false,
    description: 'Updates team standings and records for all leagues',
  },
  {
    id: 'refresh-injuries',
    name: 'Injury Reports',
    source: 'ESPN API',
    endpoint: '/api/cron/refresh-injuries',
    schedule: '0 */6 * * *',
    scheduleHuman: 'Every 6 hours',
    category: 'injuries',
    requiresKey: false,
    description: 'Fetches latest injury reports and player status updates',
  },
  {
    id: 'discover-trends',
    name: 'Trend Discovery',
    source: 'Internal (Supabase)',
    endpoint: '/api/cron/discover-trends',
    schedule: '0 7 * * *',
    scheduleHuman: 'Daily at 2AM ET',
    category: 'analytics',
    requiresKey: false,
    description: 'Analyzes historical data to discover new betting trends',
  },
  {
    id: 'grade-picks',
    name: 'Pick Grading',
    source: 'Internal (Supabase)',
    endpoint: '/api/cron/grade-picks',
    schedule: '0 8,14,20 * * *',
    scheduleHuman: '3x daily (3AM, 9AM, 3PM ET)',
    category: 'analytics',
    requiresKey: false,
    description: 'Grades completed picks against final scores and lines',
  },
  {
    id: 'scrape-experts-morning',
    name: 'Expert Scraper (Morning)',
    source: 'X/Twitter + Covers.com + ESPN',
    endpoint: '/api/cron/scrape-experts?job=morning',
    schedule: '0 13 * * *',
    scheduleHuman: 'Daily at 8AM ET',
    category: 'experts',
    requiresKey: false,
    envVarOptional: 'TWITTER_BEARER_TOKEN',
    description: 'Scrapes expert picks from X, Covers.com consensus, and ESPN picks',
  },
  {
    id: 'scrape-experts-pregame-nfl',
    name: 'Expert Scraper (NFL Sunday)',
    source: 'X/Twitter + Covers.com + ESPN',
    endpoint: '/api/cron/scrape-experts?job=pregame-nfl',
    schedule: '0 16 * * 0',
    scheduleHuman: 'Sundays at 11AM ET',
    category: 'experts',
    requiresKey: false,
    envVarOptional: 'TWITTER_BEARER_TOKEN',
    description: 'Full scrape before NFL Sunday games - all sources',
  },
  {
    id: 'scrape-experts-pregame-weekday',
    name: 'Expert Scraper (Weekday)',
    source: 'X/Twitter + Covers.com + ESPN',
    endpoint: '/api/cron/scrape-experts?job=pregame-weekday',
    schedule: '30 23 * * 1-5',
    scheduleHuman: 'Mon-Fri at 6:30PM ET',
    category: 'experts',
    requiresKey: false,
    envVarOptional: 'TWITTER_BEARER_TOKEN',
    description: 'Pre-game scrape for weekday NBA/NHL/MLB games',
  },
  {
    id: 'scrape-experts-postgame',
    name: 'Expert Scraper (Post-Game)',
    source: 'X/Twitter',
    endpoint: '/api/cron/scrape-experts?job=postgame',
    schedule: '30 4 * * *',
    scheduleHuman: 'Daily at 11:30PM ET',
    category: 'experts',
    requiresKey: false,
    envVarOptional: 'TWITTER_BEARER_TOKEN',
    description: 'Post-game capture of final picks for grading',
  },
  {
    id: 'daily-expert-scraper',
    name: 'Daily Expert Deep Scraper',
    source: 'X/Twitter API',
    endpoint: '/api/cron/daily-expert-scraper',
    schedule: '0 8 * * *',
    scheduleHuman: 'Daily at 3AM ET',
    category: 'experts',
    requiresKey: false,
    envVarOptional: 'TWITTER_BEARER_TOKEN',
    description: 'Deep scrape of all tracked betting experts on X',
  },
  {
    id: 'odds-snapshot',
    name: 'CLV Odds Snapshots',
    source: 'Action Network',
    endpoint: '/api/cron/odds-snapshot',
    schedule: '*/30 10-23,0-6 * * *',
    scheduleHuman: 'Every 30 min (5AM-1AM ET)',
    category: 'odds',
    requiresKey: false,
    description: 'Captures odds snapshots for Closing Line Value (CLV) tracking',
  },
  {
    id: 'collect-props',
    name: 'Player Props Collection',
    source: 'ESPN + Action Network',
    endpoint: '/api/cron/collect-props',
    schedule: '0 12,16,20 * * *',
    scheduleHuman: '3x daily (7AM, 11AM, 3PM ET)',
    category: 'props',
    requiresKey: false,
    description: 'Collects player prop odds and builds correlation data',
  },
  {
    id: 'backfill-history',
    name: 'Historical Data Backfill',
    source: 'ESPN API',
    endpoint: '/api/cron/backfill-history',
    schedule: '0 6 * * 1',
    scheduleHuman: 'Weekly on Monday at 1AM ET',
    category: 'historical',
    requiresKey: false,
    description: 'Backfills missing historical game data from ESPN',
  },
]

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get feed run history from admin_settings
    let feedHistory: Record<string, any> = {}
    let scheduleOverrides: Record<string, any> = {}
    try {
      const { data } = await supabase
        .from('admin_settings')
        .select('value')
        .eq('key', 'feed_run_history')
        .single()
      
      if (data?.value) {
        feedHistory = typeof data.value === 'string' ? JSON.parse(data.value) : data.value
      }
    } catch { /* no history yet */ }
    
    try {
      const { data } = await supabase
        .from('admin_settings')
        .select('value')
        .eq('key', 'feed_schedule_overrides')
        .single()
      
      if (data?.value) {
        scheduleOverrides = typeof data.value === 'string' ? JSON.parse(data.value) : data.value
      }
    } catch { /* no overrides yet */ }
    
    // Check env var status
    const envStatus = {
      TWITTER_BEARER_TOKEN: !!(process.env.TWITTER_BEARER_TOKEN || process.env.X_BEARER_TOKEN),
      ODDS_API_KEY: !!(process.env.ODDS_API_KEY || process.env.THE_ODDS_API_KEY),
      OPENWEATHER_API_KEY: !!process.env.OPENWEATHER_API_KEY,
      API_SPORTS_KEY: !!process.env.API_SPORTS_KEY,
      GEMINI_API_KEY: !!process.env.GEMINI_API_KEY,
      SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    }
    
    // Build feed status
    const feeds = FEED_DEFINITIONS.map(feed => {
      const history = feedHistory[feed.id] || null
      const lastRun = history?.lastRun || null
      const lastStatus = history?.lastStatus || 'unknown'
      const lastDuration = history?.lastDuration || null
      const lastError = history?.lastError || null
      const runCount = history?.runCount || 0
      const errorCount = history?.errorCount || 0
      const rateLimited = history?.rateLimited || false
      
      // Determine health
      let health: 'healthy' | 'warning' | 'error' | 'unknown' = 'unknown'
      if (lastRun) {
        const lastRunDate = new Date(lastRun)
        const now = new Date()
        const hoursSinceRun = (now.getTime() - lastRunDate.getTime()) / (1000 * 60 * 60)
        
        if (lastStatus === 'error') health = 'error'
        else if (rateLimited) health = 'warning'
        else if (hoursSinceRun > 48) health = 'warning' // Stale
        else health = 'healthy'
      }
      
      // Check if required env var is configured
      const envConfigured = feed.envVarOptional 
        ? envStatus[feed.envVarOptional as keyof typeof envStatus] ?? true
        : true
      
      return {
        ...feed,
        lastRun,
        lastStatus,
        lastDuration,
        lastError,
        runCount,
        errorCount,
        rateLimited,
        health,
        envConfigured,
        scheduleOverride: scheduleOverrides[feed.id]?.schedule || null,
        feedEnabled: scheduleOverrides[feed.id]?.enabled !== false, // default true
      }
    })
    
    // Summary stats
    const summary = {
      totalFeeds: feeds.length,
      healthy: feeds.filter(f => f.health === 'healthy').length,
      warning: feeds.filter(f => f.health === 'warning').length,
      error: feeds.filter(f => f.health === 'error').length,
      unknown: feeds.filter(f => f.health === 'unknown').length,
      envVars: envStatus,
    }
    
    return NextResponse.json({ feeds, summary })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch feed status' }, { status: 500 })
  }
}

// POST - Trigger a feed manually or update its schedule
export async function POST(request: NextRequest) {
  try {
    const { action, feedId, schedule, enabled } = await request.json()
    
    if (action === 'trigger') {
      // Find the feed
      const feed = FEED_DEFINITIONS.find(f => f.id === feedId)
      if (!feed) {
        return NextResponse.json({ error: 'Feed not found' }, { status: 404 })
      }
      
      // Call the endpoint
      const startTime = Date.now()
      let status = 'success'
      let error = null
      
      try {
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL 
          ? `https://${process.env.VERCEL_URL}` 
          : 'http://localhost:3000'
        
        const res = await fetch(`${baseUrl}${feed.endpoint}`, {
          headers: {
            'Authorization': `Bearer ${process.env.CRON_SECRET || ''}`,
          },
        })
        
        if (!res.ok) {
          status = 'error'
          error = `HTTP ${res.status}: ${await res.text().catch(() => 'Unknown error')}`
        }
      } catch (e) {
        status = 'error'
        error = e instanceof Error ? e.message : 'Unknown error'
      }
      
      const duration = Date.now() - startTime
      
      // Update run history
      const supabase = await createClient()
      try {
        const { data: current } = await supabase
          .from('admin_settings')
          .select('value')
          .eq('key', 'feed_run_history')
          .single()
        
        const history = current?.value 
          ? (typeof current.value === 'string' ? JSON.parse(current.value) : current.value) 
          : {}
        
        const existing = history[feedId] || { runCount: 0, errorCount: 0 }
        
        history[feedId] = {
          lastRun: new Date().toISOString(),
          lastStatus: status,
          lastDuration: `${duration}ms`,
          lastError: error,
          runCount: existing.runCount + 1,
          errorCount: existing.errorCount + (status === 'error' ? 1 : 0),
          rateLimited: error?.includes('429') || error?.includes('rate limit') || false,
        }
        
        await supabase
          .from('admin_settings')
          .upsert({ key: 'feed_run_history', value: history, updated_at: new Date().toISOString() })
      } catch { /* best effort */ }
      
      return NextResponse.json({ 
        success: status === 'success', 
        feedId, 
        duration: `${duration}ms`, 
        error 
      })
    }
    
    if (action === 'update-schedule') {
      // Save custom schedule override to admin_settings
      // NOTE: This saves the desired schedule. To actually change the Vercel cron,
      // the user needs to update vercel.json. This tracks what they WANT it to be.
      const supabase = await createClient()
      
      try {
        const { data: current } = await supabase
          .from('admin_settings')
          .select('value')
          .eq('key', 'feed_schedule_overrides')
          .single()
        
        const overrides = current?.value 
          ? (typeof current.value === 'string' ? JSON.parse(current.value) : current.value)
          : {}
        
        if (schedule !== undefined) {
          overrides[feedId] = { 
            ...(overrides[feedId] || {}),
            schedule,
            updatedAt: new Date().toISOString(),
          }
        }
        if (enabled !== undefined) {
          overrides[feedId] = {
            ...(overrides[feedId] || {}),
            enabled,
            updatedAt: new Date().toISOString(),
          }
        }
        
        await supabase
          .from('admin_settings')
          .upsert({ key: 'feed_schedule_overrides', value: overrides, updated_at: new Date().toISOString() })
        
        return NextResponse.json({ 
          success: true, 
          feedId,
          message: 'Schedule override saved. Update vercel.json to apply to Vercel Cron.',
          overrides: overrides[feedId],
        })
      } catch (e) {
        return NextResponse.json({ error: 'Failed to save schedule' }, { status: 500 })
      }
    }
    
    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 })
  }
}
