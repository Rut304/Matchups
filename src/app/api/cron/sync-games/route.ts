/**
 * Cron Job: Sync Games Data
 * Runs every 5 minutes to keep games and odds up to date
 * 
 * Deploy with Vercel Cron or use external cron service
 * Configure in vercel.json with path /api/cron/sync-games
 */

import { NextResponse } from 'next/server'
import { syncGames, storeGames, type SportKey } from '@/lib/api/data-layer'

// Vercel Cron authentication
const CRON_SECRET = process.env.CRON_SECRET

export const runtime = 'nodejs'
export const maxDuration = 60 // 60 second timeout

export async function GET(request: Request) {
  // Verify cron secret (prevents unauthorized calls)
  const authHeader = request.headers.get('authorization')
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  const results: Record<string, { success: boolean; count: number; error?: string }> = {}
  
  // Sports to sync - only sync what's in season
  const sportsToSync = getActiveSports()
  
  for (const sport of sportsToSync) {
    try {
      console.log(`[Cron] Syncing ${sport}...`)
      const games = await syncGames(sport)
      await storeGames(games)
      
      results[sport] = {
        success: true,
        count: games.length,
      }
      
      console.log(`[Cron] Synced ${games.length} ${sport} games`)
    } catch (error) {
      console.error(`[Cron] Error syncing ${sport}:`, error)
      results[sport] = {
        success: false,
        count: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }
  
  return NextResponse.json({
    success: true,
    timestamp: new Date().toISOString(),
    results,
  })
}

// Determine which sports are currently in season
function getActiveSports(): SportKey[] {
  const month = new Date().getMonth() + 1 // 1-12
  const sports: SportKey[] = []
  
  // NFL: Sept-Feb (9-2)
  if (month >= 9 || month <= 2) sports.push('NFL')
  
  // NBA: Oct-June (10-6)
  if (month >= 10 || month <= 6) sports.push('NBA')
  
  // NHL: Oct-June (10-6)
  if (month >= 10 || month <= 6) sports.push('NHL')
  
  // MLB: March-Oct (3-10)
  if (month >= 3 && month <= 10) sports.push('MLB')
  
  // NCAAF: Aug-Jan (8-1)
  if (month >= 8 || month === 1) sports.push('NCAAF')
  
  // NCAAB: Nov-April (11-4)
  if (month >= 11 || month <= 4) sports.push('NCAAB')
  
  return sports
}
