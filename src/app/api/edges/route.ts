// =============================================================================
// EDGES API - Real-time betting edge detection
// GET /api/edges
// 
// DATA SOURCES (in priority order):
// 1. ACTION NETWORK (PRIMARY) - Real-time betting splits, sharp money signals
// 2. Database edge_alerts (SECONDARY) - Stored alerts from cron jobs
// 3. The Odds API (SUPPLEMENTAL) - Multi-book odds comparison
// =============================================================================

import { NextResponse } from 'next/server'
import { 
  EdgeType,
  EdgeAlert,
  defaultEdgeConfig 
} from '@/lib/edge-features'
import { 
  fetchBettingSplitsFromActionNetwork, 
  detectSharpMoney 
} from '@/lib/scrapers/action-network'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'
export const revalidate = 120 // Cache for 2 minutes

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

/**
 * GET /api/edges
 * 
 * Real edge detection using Action Network as PRIMARY source
 * Detects: RLM, Steam Moves, Sharp vs Public splits, Arbitrage opportunities
 * 
 * Query params:
 * - sport: Filter by sport (NFL, NBA, NHL, MLB, NCAAF, NCAAB)
 * - gameId: Get alerts for specific game
 * - type: Filter by edge type (rlm, steam, clv, sharp-public, arbitrage, props)
 * - minConfidence: Minimum confidence threshold (0-100)
 * - severity: Filter by severity (critical, major, minor, info)
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const sport = searchParams.get('sport')?.toUpperCase() || 'NBA'
    const gameId = searchParams.get('gameId')
    const type = searchParams.get('type') as EdgeType | null
    const minConfidence = parseInt(searchParams.get('minConfidence') || '0')
    const severity = searchParams.get('severity')
    
    let edges: EdgeAlert[] = []
    const seenGames = new Set<string>()
    
    // ==========================================================================
    // 1. PRIMARY: Action Network - Real-time betting data
    // ==========================================================================
    const sports = sport === 'ALL' ? ['NBA', 'NHL', 'MLB', 'NCAAB'] : [sport]
    
    for (const s of sports) {
      try {
        const splits = await fetchBettingSplitsFromActionNetwork(s)
        
        if (splits && splits.length > 0) {
          const sharpSignals = detectSharpMoney(splits)
          
          for (const signal of sharpSignals) {
            if (seenGames.has(`${signal.gameId}-${signal.betType}`)) continue
            
            const alertType: EdgeType = signal.betType === 'spread' || signal.betType === 'moneyline' 
              ? 'sharp-public' 
              : 'rlm'
            
            const confidenceScore = signal.confidence === 'high' ? 85 : signal.confidence === 'medium' ? 70 : 55
            
            edges.push({
              id: `an-${signal.gameId}-${signal.betType}-${Date.now()}`,
              type: alertType,
              gameId: signal.gameId,
              sport: signal.sport,
              severity: confidenceScore >= 80 ? 'critical' : confidenceScore >= 65 ? 'major' : 'minor',
              title: `Sharp Money: ${signal.sharpSide}`,
              description: signal.signal,
              data: {
                publicSide: signal.publicSide,
                publicPct: signal.publicPct,
                sharpSide: signal.sharpSide,
                moneyPct: signal.moneyPct,
                betType: signal.betType,
                source: 'action-network',
              },
              timestamp: new Date().toISOString(),
              expiresAt: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
              confidence: confidenceScore,
              expectedValue: (signal.moneyPct - signal.publicPct) * 0.1,
            })
            
            seenGames.add(`${signal.gameId}-${signal.betType}`)
          }
          
          // Also detect extreme public sides (fade opportunities)
          for (const split of splits) {
            if (split.spread.homeBetPct > 72 || split.spread.awayBetPct > 72) {
              const heavyPubSide = split.spread.homeBetPct > 72 ? split.homeTeam : split.awayTeam
              const fadeSide = split.spread.homeBetPct > 72 ? split.awayTeam : split.homeTeam
              const pubPct = Math.max(split.spread.homeBetPct, split.spread.awayBetPct)
              
              const key = `${split.gameId}-fade`
              if (seenGames.has(key)) continue
              
              edges.push({
                id: `fade-${split.gameId}-${Date.now()}`,
                type: 'rlm',
                gameId: split.gameId,
                sport: split.sport,
                severity: pubPct > 80 ? 'critical' : 'major',
                title: `Fade Opportunity: ${fadeSide}`,
                description: `${pubPct.toFixed(0)}% of public on ${heavyPubSide}. Historical fade angle.`,
                data: {
                  publicSide: heavyPubSide,
                  publicPct: pubPct,
                  fadeSide: fadeSide,
                  line: split.spread.line,
                  source: 'action-network',
                },
                timestamp: new Date().toISOString(),
                expiresAt: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
                confidence: pubPct > 78 ? 75 : 65,
                expectedValue: (pubPct - 50) * 0.15,
              })
              
              seenGames.add(key)
            }
            
            // Check totals for sharp action
            if (split.total.overBetPct > 70 && split.total.underMoneyPct > 55) {
              const key = `${split.gameId}-total-under`
              if (!seenGames.has(key)) {
                edges.push({
                  id: `total-sharp-${split.gameId}-under-${Date.now()}`,
                  type: 'sharp-public',
                  gameId: split.gameId,
                  sport: split.sport,
                  severity: 'major',
                  title: `Sharp on Under ${split.total.line}`,
                  description: `${split.total.overBetPct.toFixed(0)}% tickets on Over, but ${split.total.underMoneyPct.toFixed(0)}% money on Under`,
                  data: {
                    publicSide: 'Over',
                    publicPct: split.total.overBetPct,
                    sharpSide: 'Under',
                    moneyPct: split.total.underMoneyPct,
                    line: split.total.line,
                    source: 'action-network',
                  },
                  timestamp: new Date().toISOString(),
                  expiresAt: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
                  confidence: 72,
                  expectedValue: 3.5,
                })
                seenGames.add(key)
              }
            } else if (split.total.underBetPct > 70 && split.total.overMoneyPct > 55) {
              const key = `${split.gameId}-total-over`
              if (!seenGames.has(key)) {
                edges.push({
                  id: `total-sharp-${split.gameId}-over-${Date.now()}`,
                  type: 'sharp-public',
                  gameId: split.gameId,
                  sport: split.sport,
                  severity: 'major',
                  title: `Sharp on Over ${split.total.line}`,
                  description: `${split.total.underBetPct.toFixed(0)}% tickets on Under, but ${split.total.overMoneyPct.toFixed(0)}% money on Over`,
                  data: {
                    publicSide: 'Under',
                    publicPct: split.total.underBetPct,
                    sharpSide: 'Over',
                    moneyPct: split.total.overMoneyPct,
                    line: split.total.line,
                    source: 'action-network',
                  },
                  timestamp: new Date().toISOString(),
                  expiresAt: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
                  confidence: 72,
                  expectedValue: 3.5,
                })
                seenGames.add(key)
              }
            }
          }
        }
      } catch (sportErr) {
        console.error(`[Edges] Action Network error for ${s}:`, sportErr)
      }
    }
    
    // ==========================================================================
    // 2. SECONDARY: Database - Stored edge alerts
    // ==========================================================================
    try {
      const { data: dbAlerts } = await supabase
        .from('edge_alerts')
        .select('*')
        .gt('expires_at', new Date().toISOString())
        .order('confidence', { ascending: false })
        .limit(50)
      
      if (dbAlerts && dbAlerts.length > 0) {
        for (const a of dbAlerts) {
          const key = `${a.game_id}-${a.type}`
          if (seenGames.has(key)) continue // Skip if Action Network already has this
          
          edges.push({
            id: a.id as string,
            gameId: a.game_id as string,
            type: a.type as EdgeType,
            severity: a.severity === 'critical' ? 'critical' : a.severity === 'high' ? 'major' : 'minor' as 'critical' | 'major' | 'minor' | 'info',
            title: `${(a.type as string).toUpperCase()}: ${a.home_team || ''} vs ${a.away_team || ''}`,
            description: a.message as string,
            confidence: a.confidence as number || 70,
            sport: a.sport as string,
            timestamp: a.created_at as string,
            expiresAt: a.expires_at as string,
            data: { ...(a.data as Record<string, unknown>) || {}, source: 'database' }
          })
          
          seenGames.add(key)
        }
      }
    } catch (dbErr) {
      console.log('[Edges] No DB alerts available, using Action Network only')
    }
    
    // ==========================================================================
    // 3. Apply filters
    // ==========================================================================
    if (gameId) {
      edges = edges.filter(a => a.gameId === gameId)
    }
    
    if (type) {
      edges = edges.filter(a => a.type === type)
    }
    
    if (minConfidence > 0) {
      edges = edges.filter(a => a.confidence >= minConfidence)
    }
    
    if (severity) {
      edges = edges.filter(a => a.severity === severity)
    }
    
    // Filter out expired alerts
    const now = new Date().toISOString()
    edges = edges.filter(a => !a.expiresAt || a.expiresAt > now)
    
    // Sort by confidence descending
    edges.sort((a, b) => (b.confidence || 0) - (a.confidence || 0))
    
    return NextResponse.json({
      edges,
      count: edges.length,
      sports: sports,
      sources: {
        primary: 'action-network',
        actionNetworkCount: edges.filter(e => e.data?.source === 'action-network').length,
        databaseCount: edges.filter(e => e.data?.source === 'database').length,
      },
      config: defaultEdgeConfig,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error fetching edge alerts:', error)
    return NextResponse.json({
      edges: [],
      count: 0,
      error: 'Failed to fetch edge alerts',
      timestamp: new Date().toISOString(),
    }, { status: 200 }) // Return 200 with empty array
  }
}
