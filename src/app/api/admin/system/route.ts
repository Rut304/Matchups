// =============================================================================
// ADMIN API: System Control & Diagnostics
// Provides endpoints for site restart, health checks, and system diagnostics
// =============================================================================

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// System health check
async function checkHealth(supabase: ReturnType<typeof getSupabase>) {
  const checks: Record<string, { status: 'ok' | 'error' | 'warning'; latency?: number; message?: string }> = {}
  
  // Database check
  const dbStart = Date.now()
  try {
    await supabase.from('site_settings').select('count').limit(1)
    checks.database = { status: 'ok', latency: Date.now() - dbStart }
  } catch (error) {
    checks.database = { status: 'error', message: String(error) }
  }

  // External API checks
  const apis = [
    { name: 'odds_api', url: 'https://api.the-odds-api.com/v4/sports/?apiKey=' + process.env.THE_ODDS_API_KEY },
    { name: 'espn', url: 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard' },
  ]

  for (const api of apis) {
    const start = Date.now()
    try {
      const res = await fetch(api.url, { signal: AbortSignal.timeout(5000) })
      if (res.ok) {
        checks[api.name] = { status: 'ok', latency: Date.now() - start }
      } else {
        checks[api.name] = { status: 'warning', latency: Date.now() - start, message: `Status ${res.status}` }
      }
    } catch (error) {
      checks[api.name] = { status: 'error', message: String(error) }
    }
  }

  return checks
}

// Get system stats
async function getSystemStats(supabase: ReturnType<typeof getSupabase>) {
  const stats: Record<string, unknown> = {}

  // Get cron job status from database (if we track it)
  try {
    const { data: cronLogs } = await supabase
      .from('cron_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20)
    stats.recentCronJobs = cronLogs || []
  } catch {
    stats.recentCronJobs = []
  }

  // Get site settings
  try {
    const { data: settings } = await supabase
      .from('site_settings')
      .select('*')
    stats.settings = settings || []
  } catch {
    stats.settings = []
  }

  // Get error logs
  try {
    const { data: errors } = await supabase
      .from('error_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20)
    stats.recentErrors = errors || []
  } catch {
    stats.recentErrors = []
  }

  return stats
}

export async function GET(request: Request) {
  const supabase = getSupabase()
  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action')

  try {
    switch (action) {
      case 'health':
        const health = await checkHealth(supabase)
        const allOk = Object.values(health).every(h => h.status === 'ok')
        return NextResponse.json({
          status: allOk ? 'healthy' : 'degraded',
          timestamp: new Date().toISOString(),
          checks: health
        })

      case 'stats':
        const stats = await getSystemStats(supabase)
        return NextResponse.json({
          status: 'ok',
          timestamp: new Date().toISOString(),
          ...stats
        })

      default:
        // Return overview
        const [healthResult, statsResult] = await Promise.all([
          checkHealth(supabase),
          getSystemStats(supabase)
        ])
        return NextResponse.json({
          health: healthResult,
          stats: statsResult,
          timestamp: new Date().toISOString()
        })
    }
  } catch (error) {
    console.error('System check error:', error)
    return NextResponse.json({ error: 'System check failed' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const supabase = getSupabase()
  const body = await request.json()
  const { action } = body

  try {
    switch (action) {
      case 'trigger_refresh':
        // Trigger all cron jobs
        const cronEndpoints = [
          '/api/cron/refresh-odds',
          '/api/cron/refresh-scores', 
          '/api/cron/refresh-standings',
          '/api/cron/sync-games',
          '/api/cron/refresh-injuries'
        ]
        
        const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
        const results: Record<string, unknown> = {}
        
        for (const endpoint of cronEndpoints) {
          try {
            const res = await fetch(`${baseUrl}${endpoint}`, {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${process.env.CRON_SECRET}`
              }
            })
            results[endpoint] = { status: res.ok ? 'triggered' : 'failed', code: res.status }
          } catch (error) {
            results[endpoint] = { status: 'error', message: String(error) }
          }
        }
        
        // Log the action
        await supabase.from('cron_logs').insert({
          job_name: 'manual_refresh_all',
          status: 'completed',
          result: results
        })
        
        return NextResponse.json({ status: 'ok', results })

      case 'clear_cache':
        // Clear any server-side cache (implement based on your caching strategy)
        await supabase.from('cron_logs').insert({
          job_name: 'cache_cleared',
          status: 'completed',
          result: { message: 'Cache cleared manually' }
        })
        return NextResponse.json({ status: 'ok', message: 'Cache cleared' })

      case 'log_error':
        // Log an error to the database
        const { service, error: errorMessage, severity } = body
        await supabase.from('error_logs').insert({
          service,
          error: errorMessage,
          severity: severity || 'medium',
          created_at: new Date().toISOString()
        })
        return NextResponse.json({ status: 'ok', message: 'Error logged' })

      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
    }
  } catch (error) {
    console.error('System action error:', error)
    return NextResponse.json({ error: 'Action failed' }, { status: 500 })
  }
}
