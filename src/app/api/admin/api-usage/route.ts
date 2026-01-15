import { NextResponse } from 'next/server'

// API usage tracking types
interface ApiUsageRecord {
  api: string
  endpoint: string
  calls: number
  errors: number
  avgResponseTime: number
  lastCalled: string
  status: 'healthy' | 'degraded' | 'down'
}

interface DailyUsage {
  date: string
  totalCalls: number
  totalErrors: number
  byApi: Record<string, number>
}

interface RateLimitInfo {
  api: string
  limit: number
  used: number
  remaining: number
  resetsAt: string
}

// Sample API configurations
const API_CONFIGS = [
  { name: 'ESPN API', baseUrl: 'site.api.espn.com', endpoints: ['/sports', '/scoreboard', '/news', '/teams', '/players'] },
  { name: 'The Odds API', baseUrl: 'api.the-odds-api.com', endpoints: ['/sports', '/odds', '/scores', '/historical'] },
  { name: 'OpenWeather API', baseUrl: 'api.openweathermap.org', endpoints: ['/weather', '/forecast'] },
  { name: 'News API', baseUrl: 'newsapi.org', endpoints: ['/everything', '/top-headlines'] },
  { name: 'Twitter/X API', baseUrl: 'api.twitter.com', endpoints: ['/search/tweets', '/users'] },
]

function generateUsageData(): ApiUsageRecord[] {
  const records: ApiUsageRecord[] = []
  
  API_CONFIGS.forEach(config => {
    config.endpoints.forEach(endpoint => {
      const calls = Math.floor(Math.random() * 5000) + 100
      const errorRate = Math.random() * 0.05 // 0-5% error rate
      const errors = Math.floor(calls * errorRate)
      
      records.push({
        api: config.name,
        endpoint,
        calls,
        errors,
        avgResponseTime: Math.round((Math.random() * 500 + 50) * 10) / 10, // 50-550ms
        lastCalled: new Date(Date.now() - Math.random() * 3600000).toISOString(), // Last hour
        status: errors / calls > 0.1 ? 'degraded' : errors / calls > 0.3 ? 'down' : 'healthy',
      })
    })
  })
  
  return records
}

function generateDailyHistory(): DailyUsage[] {
  const history: DailyUsage[] = []
  
  for (let i = 29; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    
    const byApi: Record<string, number> = {}
    let totalCalls = 0
    
    API_CONFIGS.forEach(config => {
      const calls = Math.floor(Math.random() * 10000) + 1000
      byApi[config.name] = calls
      totalCalls += calls
    })
    
    history.push({
      date: date.toISOString().split('T')[0],
      totalCalls,
      totalErrors: Math.floor(totalCalls * Math.random() * 0.02),
      byApi,
    })
  }
  
  return history
}

function generateRateLimits(): RateLimitInfo[] {
  return [
    {
      api: 'ESPN API',
      limit: 100000,
      used: Math.floor(Math.random() * 80000) + 10000,
      remaining: 0, // Calculated
      resetsAt: new Date(Date.now() + 3600000).toISOString(), // 1 hour
    },
    {
      api: 'The Odds API',
      limit: 500,
      used: Math.floor(Math.random() * 400) + 50,
      remaining: 0,
      resetsAt: new Date(Date.now() + 86400000).toISOString(), // 24 hours
    },
    {
      api: 'OpenWeather API',
      limit: 1000,
      used: Math.floor(Math.random() * 800) + 100,
      remaining: 0,
      resetsAt: new Date(Date.now() + 3600000).toISOString(),
    },
    {
      api: 'News API',
      limit: 100,
      used: Math.floor(Math.random() * 80) + 10,
      remaining: 0,
      resetsAt: new Date(Date.now() + 86400000).toISOString(),
    },
    {
      api: 'Twitter/X API',
      limit: 10000,
      used: Math.floor(Math.random() * 8000) + 1000,
      remaining: 0,
      resetsAt: new Date(Date.now() + 900000).toISOString(), // 15 min
    },
  ].map(r => ({ ...r, remaining: r.limit - r.used }))
}

export async function GET() {
  try {
    const usageRecords = generateUsageData()
    const dailyHistory = generateDailyHistory()
    const rateLimits = generateRateLimits()
    
    // Calculate summary stats
    const totalCalls = usageRecords.reduce((sum, r) => sum + r.calls, 0)
    const totalErrors = usageRecords.reduce((sum, r) => sum + r.errors, 0)
    const avgResponseTime = usageRecords.reduce((sum, r) => sum + r.avgResponseTime, 0) / usageRecords.length
    
    // Group by API
    const byApi = API_CONFIGS.map(config => {
      const apiRecords = usageRecords.filter(r => r.api === config.name)
      return {
        name: config.name,
        totalCalls: apiRecords.reduce((sum, r) => sum + r.calls, 0),
        totalErrors: apiRecords.reduce((sum, r) => sum + r.errors, 0),
        avgResponseTime: Math.round(
          apiRecords.reduce((sum, r) => sum + r.avgResponseTime, 0) / apiRecords.length * 10
        ) / 10,
        endpoints: apiRecords.length,
        status: apiRecords.every(r => r.status === 'healthy') 
          ? 'healthy' 
          : apiRecords.some(r => r.status === 'down') 
            ? 'down' 
            : 'degraded',
      }
    })
    
    // Recent errors
    const recentErrors = usageRecords
      .filter(r => r.errors > 0)
      .sort((a, b) => b.errors - a.errors)
      .slice(0, 10)
      .map(r => ({
        api: r.api,
        endpoint: r.endpoint,
        errors: r.errors,
        errorRate: Math.round((r.errors / r.calls) * 100 * 10) / 10,
        lastOccurred: r.lastCalled,
      }))
    
    return NextResponse.json({
      summary: {
        totalCalls,
        totalErrors,
        errorRate: Math.round((totalErrors / totalCalls) * 100 * 100) / 100,
        avgResponseTime: Math.round(avgResponseTime * 10) / 10,
        apisMonitored: API_CONFIGS.length,
        healthyApis: byApi.filter(a => a.status === 'healthy').length,
      },
      byApi,
      rateLimits,
      dailyHistory,
      recentErrors,
      records: usageRecords,
    })
  } catch (error) {
    console.error('API usage error:', error)
    return NextResponse.json({ error: 'Failed to fetch API usage' }, { status: 500 })
  }
}
