import { NextResponse } from 'next/server'

/**
 * API Usage & Configuration Route
 * 
 * Shows real API configurations and status.
 * Real-time usage tracking requires implementing logging infrastructure.
 */

// API configurations - real, not mock
const API_CONFIGS = [
  { 
    name: 'ESPN API', 
    baseUrl: 'site.api.espn.com', 
    rateLimit: 'Unlimited (public)',
    status: 'active',
    usedFor: ['Game schedules', 'Scores', 'Team data', 'Player stats'],
  },
  { 
    name: 'Action Network API', 
    baseUrl: 'api.actionnetwork.com', 
    rateLimit: 'Unlimited (public)',
    status: 'active',
    usedFor: ['Betting lines', 'Sharp money splits', 'Multi-book odds'],
  },
  { 
    name: 'The Odds API', 
    baseUrl: 'api.the-odds-api.com', 
    rateLimit: '500/month (free tier)',
    status: (process.env.ODDS_API_KEY || process.env.THE_ODDS_API_KEY) ? 'configured' : 'not_configured',
    usedFor: ['Fallback odds', 'Player props'],
  },
  { 
    name: 'API-SPORTS', 
    baseUrl: 'api-sports.io', 
    rateLimit: '100/day (free tier)',
    status: process.env.API_SPORTS_KEY ? 'configured' : 'not_configured',
    usedFor: ['Additional player stats', 'Historical data'],
  },
  { 
    name: 'OpenWeather API', 
    baseUrl: 'api.openweathermap.org', 
    rateLimit: '1000/day (free tier)',
    status: process.env.OPENWEATHER_API_KEY ? 'configured' : 'not_configured',
    usedFor: ['Game day weather'],
  },
]

export async function GET() {
  try {
    const configuredApis = API_CONFIGS.map(config => ({
      name: config.name,
      baseUrl: config.baseUrl,
      rateLimit: config.rateLimit,
      status: config.status,
      usedFor: config.usedFor,
    }))
    
    const summary = {
      totalApis: API_CONFIGS.length,
      configuredApis: configuredApis.filter(a => a.status === 'active' || a.status === 'configured').length,
      unconfiguredApis: configuredApis.filter(a => a.status === 'not_configured').length,
      note: 'Real-time usage metrics not available. Configure logging for usage tracking.',
    }
    
    const rateLimits = [
      {
        api: 'ESPN API',
        limit: 'Unlimited',
        note: 'Public API, no key required',
        status: 'healthy',
      },
      {
        api: 'Action Network API',
        limit: 'Unlimited',
        note: 'Public API, no key required',
        status: 'healthy',
      },
      {
        api: 'The Odds API',
        limit: 500,
        note: 'Monthly limit on free tier',
        status: (process.env.ODDS_API_KEY || process.env.THE_ODDS_API_KEY) ? 'configured' : 'needs_key',
      },
      {
        api: 'API-SPORTS',
        limit: 100,
        note: 'Daily limit on free tier',
        status: process.env.API_SPORTS_KEY ? 'configured' : 'needs_key',
      },
    ]
    
    return NextResponse.json({
      summary,
      apis: configuredApis,
      rateLimits,
      dailyHistory: null, // Not implemented - requires logging infrastructure
      recentErrors: null,
      records: null,
    })
  } catch (error) {
    console.error('API config error:', error)
    return NextResponse.json({ error: 'Failed to fetch API configuration' }, { status: 500 })
  }
}
