/**
 * Expert Picks Sync API
 * Fetches and aggregates picks from all sources
 * Runs on schedule or manual trigger
 */

import { NextRequest, NextResponse } from 'next/server'
import { syncExpertPicks, getExpertPicksService } from '@/lib/api/expert-picks'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const sport = searchParams.get('sport') || undefined
  const action = searchParams.get('action') || 'sync'
  
  // Verify cron secret for scheduled runs
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  
  // Allow manual triggers in development
  const isDev = process.env.NODE_ENV === 'development'
  const isAuthorized = isDev || authHeader === `Bearer ${cronSecret}`
  
  if (!isAuthorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  try {
    if (action === 'sync') {
      // Full sync from all sources
      const result = await syncExpertPicks(sport)
      
      return NextResponse.json({
        success: result.success,
        message: `Synced ${result.picksAdded} picks`,
        picksAdded: result.picksAdded,
        errors: result.errors,
        timestamp: new Date().toISOString(),
      })
    }
    
    if (action === 'leaderboard') {
      // Get expert leaderboard
      const service = getExpertPicksService()
      const leaderboard = await service.getExpertLeaderboard({
        sport: sport || undefined,
        timeframe: (searchParams.get('timeframe') as 'week') || 'week',
        sortBy: (searchParams.get('sortBy') as 'units') || 'units',
      })
      
      return NextResponse.json({
        success: true,
        leaderboard,
        timestamp: new Date().toISOString(),
      })
    }
    
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('[Expert Sync] Error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  // Handle manual pick submissions or tracking requests
  try {
    const body = await request.json()
    const { action, ...data } = body
    
    const service = getExpertPicksService()
    
    if (action === 'track-twitter') {
      const result = await service.trackTwitterAccount(data.handle)
      return NextResponse.json(result)
    }
    
    if (action === 'generate-card') {
      const card = await service.generateShareableCard(data.expertId, {
        timeframe: data.timeframe,
        sport: data.sport,
      })
      return NextResponse.json({ success: true, card })
    }
    
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    )
  }
}
