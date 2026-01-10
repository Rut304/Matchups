// Health Monitoring System
// Monitors all data sources and system health for self-healing capabilities

import { createClient } from '@/lib/supabase/client'

// Health check status types
export type HealthStatus = 'healthy' | 'degraded' | 'unhealthy' | 'unknown'

export interface ServiceHealth {
  name: string
  status: HealthStatus
  latency?: number // ms
  lastCheck: string
  message?: string
  details?: Record<string, unknown>
}

export interface SystemHealth {
  status: HealthStatus
  timestamp: string
  version: string
  environment: string
  services: ServiceHealth[]
  summary: {
    total: number
    healthy: number
    degraded: number
    unhealthy: number
  }
}

export interface DataSourceStatus {
  source: string
  isAvailable: boolean
  lastUpdated: string | null
  dataFreshness: 'fresh' | 'stale' | 'expired' | 'unknown'
  recordCount?: number
  error?: string
}

// ESPN API endpoints by sport
const ESPN_ENDPOINTS: Record<string, string> = {
  nfl: 'https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard',
  nba: 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard',
  nhl: 'https://site.api.espn.com/apis/site/v2/sports/hockey/nhl/scoreboard',
  mlb: 'https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/scoreboard',
  ncaaf: 'https://site.api.espn.com/apis/site/v2/sports/football/college-football/scoreboard',
  ncaab: 'https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/scoreboard',
}

// Check ESPN API health for a sport
async function checkESPNHealth(sport: string): Promise<ServiceHealth> {
  const startTime = Date.now()
  const endpoint = ESPN_ENDPOINTS[sport.toLowerCase()]
  
  if (!endpoint) {
    return {
      name: `ESPN ${sport.toUpperCase()}`,
      status: 'unknown',
      lastCheck: new Date().toISOString(),
      message: 'Unknown sport',
    }
  }
  
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10000)
    
    const res = await fetch(endpoint, { 
      signal: controller.signal,
      cache: 'no-store' 
    })
    clearTimeout(timeout)
    
    const latency = Date.now() - startTime
    
    if (!res.ok) {
      return {
        name: `ESPN ${sport.toUpperCase()}`,
        status: 'unhealthy',
        latency,
        lastCheck: new Date().toISOString(),
        message: `HTTP ${res.status}: ${res.statusText}`,
      }
    }
    
    const data = await res.json()
    const eventCount = data.events?.length || 0
    
    return {
      name: `ESPN ${sport.toUpperCase()}`,
      status: latency > 3000 ? 'degraded' : 'healthy',
      latency,
      lastCheck: new Date().toISOString(),
      message: `${eventCount} events found`,
      details: { eventCount, hasLeagues: !!data.leagues },
    }
  } catch (error) {
    return {
      name: `ESPN ${sport.toUpperCase()}`,
      status: 'unhealthy',
      latency: Date.now() - startTime,
      lastCheck: new Date().toISOString(),
      message: error instanceof Error ? error.message : 'Connection failed',
    }
  }
}

// Check Supabase health
async function checkSupabaseHealth(): Promise<ServiceHealth> {
  const startTime = Date.now()
  
  try {
    const supabase = createClient()
    
    // Simple query to check connectivity
    const { data, error } = await supabase
      .from('historical_trends')
      .select('id')
      .limit(1)
    
    const latency = Date.now() - startTime
    
    if (error) {
      // Check if it's just missing table (not critical)
      if (error.message?.includes('does not exist')) {
        return {
          name: 'Supabase',
          status: 'degraded',
          latency,
          lastCheck: new Date().toISOString(),
          message: 'Database connected but tables not set up',
          details: { error: error.message },
        }
      }
      
      return {
        name: 'Supabase',
        status: 'unhealthy',
        latency,
        lastCheck: new Date().toISOString(),
        message: error.message,
      }
    }
    
    return {
      name: 'Supabase',
      status: latency > 2000 ? 'degraded' : 'healthy',
      latency,
      lastCheck: new Date().toISOString(),
      message: 'Connected',
      details: { hasData: !!data?.length },
    }
  } catch (error) {
    return {
      name: 'Supabase',
      status: 'unhealthy',
      latency: Date.now() - startTime,
      lastCheck: new Date().toISOString(),
      message: error instanceof Error ? error.message : 'Connection failed',
    }
  }
}

// Check odds API (placeholder for The Odds API or similar)
async function checkOddsAPIHealth(): Promise<ServiceHealth> {
  const startTime = Date.now()
  
  // TODO: Replace with actual odds API check when configured
  // For now, we mark it as degraded since it's not set up
  return {
    name: 'Odds API',
    status: 'degraded',
    latency: Date.now() - startTime,
    lastCheck: new Date().toISOString(),
    message: 'API key not configured - using mock data',
    details: { configured: false },
  }
}

// Check internal API routes
async function checkInternalAPIHealth(baseUrl: string): Promise<ServiceHealth> {
  const startTime = Date.now()
  
  try {
    const res = await fetch(`${baseUrl}/api/games`, { 
      cache: 'no-store',
      headers: { 'Accept': 'application/json' }
    })
    
    const latency = Date.now() - startTime
    
    if (!res.ok) {
      return {
        name: 'Internal API',
        status: 'unhealthy',
        latency,
        lastCheck: new Date().toISOString(),
        message: `HTTP ${res.status}`,
      }
    }
    
    return {
      name: 'Internal API',
      status: latency > 2000 ? 'degraded' : 'healthy',
      latency,
      lastCheck: new Date().toISOString(),
      message: 'Responding',
    }
  } catch (error) {
    return {
      name: 'Internal API',
      status: 'unhealthy',
      latency: Date.now() - startTime,
      lastCheck: new Date().toISOString(),
      message: error instanceof Error ? error.message : 'Failed',
    }
  }
}

// Get overall system health
export async function getSystemHealth(): Promise<SystemHealth> {
  const baseUrl = typeof window !== 'undefined' 
    ? window.location.origin 
    : process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : 'http://localhost:3000'
  
  // Run health checks in parallel
  const [
    nflHealth,
    nbaHealth,
    nhlHealth,
    ncaafHealth,
    ncaabHealth,
    supabaseHealth,
    oddsHealth,
    internalHealth,
  ] = await Promise.all([
    checkESPNHealth('nfl'),
    checkESPNHealth('nba'),
    checkESPNHealth('nhl'),
    checkESPNHealth('ncaaf'),
    checkESPNHealth('ncaab'),
    checkSupabaseHealth(),
    checkOddsAPIHealth(),
    checkInternalAPIHealth(baseUrl),
  ])
  
  const services = [
    nflHealth,
    nbaHealth,
    nhlHealth,
    ncaafHealth,
    ncaabHealth,
    supabaseHealth,
    oddsHealth,
    internalHealth,
  ]
  
  const summary = {
    total: services.length,
    healthy: services.filter(s => s.status === 'healthy').length,
    degraded: services.filter(s => s.status === 'degraded').length,
    unhealthy: services.filter(s => s.status === 'unhealthy').length,
  }
  
  // Overall status
  let status: HealthStatus = 'healthy'
  if (summary.unhealthy > 0) {
    // Critical services that would make the system unhealthy
    const criticalUnhealthy = services.filter(
      s => s.status === 'unhealthy' && ['Internal API', 'Supabase'].includes(s.name)
    )
    status = criticalUnhealthy.length > 0 ? 'unhealthy' : 'degraded'
  } else if (summary.degraded > 0) {
    status = 'degraded'
  }
  
  return {
    status,
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    services,
    summary,
  }
}

// Check data freshness for a specific source
export async function checkDataFreshness(source: string): Promise<DataSourceStatus> {
  const supabase = createClient()
  
  // Map source names to tables and columns
  const sourceConfig: Record<string, { table: string; timestampCol: string }> = {
    trends: { table: 'historical_trends', timestampCol: 'updated_at' },
    games: { table: 'historical_games', timestampCol: 'created_at' },
    picks: { table: 'historical_edge_picks', timestampCol: 'pick_date' },
    markets: { table: 'historical_prediction_markets', timestampCol: 'created_at' },
  }
  
  const config = sourceConfig[source]
  if (!config) {
    return {
      source,
      isAvailable: false,
      lastUpdated: null,
      dataFreshness: 'unknown',
      error: 'Unknown source',
    }
  }
  
  try {
    const { data, error, count } = await supabase
      .from(config.table)
      .select('*', { count: 'exact', head: false })
      .order(config.timestampCol, { ascending: false })
      .limit(1)
    
    if (error) {
      return {
        source,
        isAvailable: false,
        lastUpdated: null,
        dataFreshness: 'unknown',
        error: error.message,
      }
    }
    
    const lastUpdated = data?.[0]?.[config.timestampCol] || null
    
    // Determine freshness
    let dataFreshness: DataSourceStatus['dataFreshness'] = 'unknown'
    if (lastUpdated) {
      const ageHours = (Date.now() - new Date(lastUpdated).getTime()) / (1000 * 60 * 60)
      if (ageHours < 1) dataFreshness = 'fresh'
      else if (ageHours < 24) dataFreshness = 'stale'
      else dataFreshness = 'expired'
    }
    
    return {
      source,
      isAvailable: true,
      lastUpdated,
      dataFreshness,
      recordCount: count || 0,
    }
  } catch (error) {
    return {
      source,
      isAvailable: false,
      lastUpdated: null,
      dataFreshness: 'unknown',
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// Generate health report for CI/CD
export function generateHealthReport(health: SystemHealth): string {
  const lines: string[] = [
    '# System Health Report',
    `Generated: ${health.timestamp}`,
    `Environment: ${health.environment}`,
    `Overall Status: **${health.status.toUpperCase()}**`,
    '',
    '## Service Status',
    '',
    '| Service | Status | Latency | Message |',
    '|---------|--------|---------|---------|',
  ]
  
  for (const service of health.services) {
    const statusEmoji = service.status === 'healthy' ? '✅' : service.status === 'degraded' ? '⚠️' : '❌'
    const latency = service.latency ? `${service.latency}ms` : 'N/A'
    lines.push(`| ${service.name} | ${statusEmoji} ${service.status} | ${latency} | ${service.message || '-'} |`)
  }
  
  lines.push('')
  lines.push('## Summary')
  lines.push(`- Total Services: ${health.summary.total}`)
  lines.push(`- Healthy: ${health.summary.healthy}`)
  lines.push(`- Degraded: ${health.summary.degraded}`)
  lines.push(`- Unhealthy: ${health.summary.unhealthy}`)
  
  return lines.join('\n')
}

// Self-healing actions
export type HealingAction = 
  | { type: 'retry_api'; service: string; endpoint: string }
  | { type: 'switch_fallback'; service: string; fallback: string }
  | { type: 'clear_cache'; scope: string }
  | { type: 'alert'; severity: 'info' | 'warning' | 'critical'; message: string }
  | { type: 'no_action'; reason: string }

export function determineHealingAction(service: ServiceHealth): HealingAction[] {
  const actions: HealingAction[] = []
  
  if (service.status === 'healthy') {
    return [{ type: 'no_action', reason: 'Service is healthy' }]
  }
  
  // ESPN API issues
  if (service.name.startsWith('ESPN')) {
    if (service.status === 'unhealthy') {
      actions.push({ 
        type: 'retry_api', 
        service: service.name, 
        endpoint: ESPN_ENDPOINTS[service.name.split(' ')[1]?.toLowerCase() || 'nfl'] 
      })
      actions.push({ 
        type: 'switch_fallback', 
        service: service.name, 
        fallback: 'mock_data' 
      })
      actions.push({ 
        type: 'alert', 
        severity: 'warning', 
        message: `ESPN API for ${service.name} is down - using fallback data` 
      })
    } else if (service.status === 'degraded') {
      actions.push({ 
        type: 'alert', 
        severity: 'info', 
        message: `ESPN API for ${service.name} is slow (${service.latency}ms)` 
      })
    }
  }
  
  // Supabase issues
  if (service.name === 'Supabase') {
    if (service.status === 'unhealthy') {
      actions.push({ 
        type: 'switch_fallback', 
        service: 'Supabase', 
        fallback: 'mock_data' 
      })
      actions.push({ 
        type: 'alert', 
        severity: 'critical', 
        message: 'Database connection failed - check Supabase status' 
      })
    }
  }
  
  // Internal API issues
  if (service.name === 'Internal API') {
    if (service.status === 'unhealthy') {
      actions.push({ 
        type: 'clear_cache', 
        scope: 'api_routes' 
      })
      actions.push({ 
        type: 'alert', 
        severity: 'critical', 
        message: 'Internal API is down - may need deployment restart' 
      })
    }
  }
  
  return actions.length > 0 ? actions : [{ type: 'no_action', reason: 'No specific healing action defined' }]
}
