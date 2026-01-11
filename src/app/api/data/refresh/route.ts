/**
 * Data Refresh API Route
 * 
 * Endpoint for refreshing cached data
 * Can be called by cron jobs for scheduled updates
 * 
 * GET /api/data/refresh?sport=NFL - Refresh single sport
 * GET /api/data/refresh?all=true - Refresh all sports
 * GET /api/data/refresh?status=true - Get cache status
 */

import { NextRequest, NextResponse } from 'next/server'
import { dataStore, type Sport } from '@/lib/unified-data-store'

// Verify cron secret for automated calls
const CRON_SECRET = process.env.CRON_SECRET

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const sport = searchParams.get('sport') as Sport | null
  const all = searchParams.get('all')
  const status = searchParams.get('status')
  const secret = searchParams.get('secret')

  // For cron jobs, verify secret
  if (all === 'true' && CRON_SECRET && secret !== CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Return cache status
    if (status === 'true') {
      const freshness = dataStore.getDataFreshness()
      return NextResponse.json({
        status: 'ok',
        cache: freshness,
        cacheSize: Object.keys(freshness).length,
      })
    }

    // Refresh all sports
    if (all === 'true') {
      const sports: Sport[] = ['NFL', 'NBA', 'NHL', 'MLB']
      
      await Promise.all(sports.map(s => dataStore.refreshSportData(s)))
      
      return NextResponse.json({
        status: 'ok',
        refreshed: sports,
        timestamp: new Date().toISOString(),
      })
    }

    // Refresh single sport
    if (sport && ['NFL', 'NBA', 'NHL', 'MLB'].includes(sport)) {
      await dataStore.refreshSportData(sport)
      
      return NextResponse.json({
        status: 'ok',
        refreshed: sport,
        timestamp: new Date().toISOString(),
      })
    }

    return NextResponse.json({
      error: 'Invalid request. Use ?sport=NFL, ?all=true, or ?status=true',
    }, { status: 400 })
  } catch (error) {
    console.error('Data refresh error:', error)
    return NextResponse.json({
      error: 'Failed to refresh data',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 })
  }
}

// POST endpoint for webhook triggers (e.g., from Vercel cron)
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  
  // Verify authorization for POST requests
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json().catch(() => ({}))
    const sports: Sport[] = body.sports || ['NFL', 'NBA', 'NHL', 'MLB']
    
    await Promise.all(sports.map(s => dataStore.refreshSportData(s)))
    
    return NextResponse.json({
      status: 'ok',
      refreshed: sports,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Data refresh error:', error)
    return NextResponse.json({
      error: 'Failed to refresh data',
    }, { status: 500 })
  }
}
