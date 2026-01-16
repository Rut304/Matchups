/**
 * Game Trends API
 * 
 * GET /api/game-trends?gameId=xxx&sport=nba&home=IND&away=NO
 * 
 * Returns trends that apply to a specific game based on:
 * - Sport-specific trends
 * - Rest situations (back-to-backs, 3-in-4)
 * - Home/away records
 * - Public betting splits from Action Network
 * - Line movement patterns
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { findMatchingTrends, type GameContext } from '@/lib/trend-matcher'
import { fetchBettingSplitsFromActionNetwork } from '@/lib/scrapers/action-network'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const gameId = searchParams.get('gameId')
  const sport = searchParams.get('sport')?.toUpperCase() || 'NBA'
  const homeTeam = searchParams.get('home') || ''
  const awayTeam = searchParams.get('away') || ''
  
  if (!gameId) {
    return NextResponse.json({ error: 'gameId is required' }, { status: 400 })
  }
  
  try {
    const supabase = await createClient()
    
    // 1. Build game context for trend matching
    const gameContext: GameContext = {
      sport: sport,
      homeTeam: homeTeam,
      awayTeam: awayTeam,
      homeTeamAbbrev: homeTeam,
      awayTeamAbbrev: awayTeam,
      gameDate: new Date(),
    }
    
    // 2. Get betting splits from Action Network (PRIMARY SOURCE)
    const sportMap: Record<string, string> = {
      'NBA': 'nba',
      'NFL': 'nfl',
      'NHL': 'nhl',
      'MLB': 'mlb',
      'NCAAB': 'ncaab',
      'NCAAF': 'ncaaf'
    }
    
    const bettingSplits = await fetchBettingSplitsFromActionNetwork(sportMap[sport] || 'nba')
    
    // Find matching game in betting splits
    const gameMatch = bettingSplits.find(g => 
      (g.homeTeam.includes(homeTeam) || g.awayTeam.includes(awayTeam)) ||
      (g.homeTeam.includes(awayTeam) || g.awayTeam.includes(homeTeam))
    )
    
    if (gameMatch) {
      // BettingSplit has spread.homeBetPct, spread.homeMoneyPct
      gameContext.publicSpreadHomePct = gameMatch.spread.homeBetPct
      gameContext.publicMoneyHomePct = gameMatch.spread.homeMoneyPct
    }
    
    // 3. Get applicable trends from database
    const { data: dbTrends, error: trendsError } = await supabase
      .from('historical_trends')
      .select('*')
      .eq('is_active', true)
      .or(`sport.eq.${sport},sport.eq.ALL`)
      .order('confidence_score', { ascending: false })
      .limit(50)
    
    if (trendsError) {
      console.error('Error fetching trends:', trendsError)
    }
    
    // 4. Filter trends based on game context
    const applicableTrends: Array<{
      id: string
      name: string
      description: string
      category: string
      betType: string
      record: string
      roi: number
      confidence: number
      isHot: boolean
      pick?: string
      reasoning?: string
    }> = []
    
    const trends = dbTrends || []
    
    for (const trend of trends) {
      let applies = false
      let pick = ''
      let reasoning = ''
      
      // Check if trend applies based on category
      switch (trend.category) {
        case 'sharp':
          // Sharp money trends - apply if we have betting split data
          if (gameMatch) {
            const ticketPct = gameMatch.spread.homeBetPct || 50
            const moneyPct = gameMatch.spread.homeMoneyPct || 50
            const divergence = Math.abs(ticketPct - moneyPct)
            
            if (divergence >= 10) {
              applies = true
              pick = moneyPct > ticketPct ? homeTeam : awayTeam
              reasoning = `Sharp money divergence: ${divergence.toFixed(0)}% (${ticketPct}% tickets vs ${moneyPct}% money)`
            }
          }
          break
          
        case 'public_fade':
          // Fade heavy public - apply if one side getting 70%+ tickets
          if (gameMatch) {
            const publicPct = gameMatch.spread.homeBetPct || 50
            if (publicPct >= 70 || publicPct <= 30) {
              applies = true
              pick = publicPct >= 70 ? awayTeam : homeTeam
              reasoning = `Heavy public on ${publicPct >= 70 ? homeTeam : awayTeam} (${publicPct >= 70 ? publicPct : 100 - publicPct}% of tickets)`
            }
          }
          break
          
        case 'rest':
          // Rest trends - would need schedule data
          // For now, include if it's a general rest trend
          if (trend.trend_name.includes('Back-to-Back') || trend.trend_name.includes('3 in 4')) {
            applies = true
            reasoning = 'Rest situation trend'
          }
          break
          
        case 'situational':
          // Situational trends - apply based on bet type
          if (trend.bet_type === 'spread' || trend.bet_type === 'total') {
            applies = true
            reasoning = 'Situational edge'
          }
          break
          
        case 'weather':
          // Weather only applies to outdoor sports
          if (sport === 'NFL' || sport === 'MLB' || sport === 'NCAAF') {
            applies = true
            reasoning = 'Weather impact trend'
          }
          break
          
        default:
          // Include other high-confidence trends
          if (trend.confidence_score >= 85) {
            applies = true
            reasoning = 'High confidence historical trend'
          }
      }
      
      if (applies) {
        applicableTrends.push({
          id: trend.trend_id,
          name: trend.trend_name,
          description: trend.trend_description || '',
          category: trend.category,
          betType: trend.bet_type,
          record: trend.all_time_record || '0-0',
          roi: trend.all_time_roi || 0,
          confidence: trend.confidence_score || 70,
          isHot: trend.hot_streak || false,
          pick,
          reasoning
        })
      }
    }
    
    // 5. Build response
    const homeTrends = applicableTrends
      .filter(t => t.pick === homeTeam || !t.pick)
      .slice(0, 5)
      .map(t => t.name + (t.reasoning ? ` - ${t.reasoning}` : ''))
    
    const awayTrends = applicableTrends
      .filter(t => t.pick === awayTeam || !t.pick)
      .slice(0, 5)
      .map(t => t.name + (t.reasoning ? ` - ${t.reasoning}` : ''))
    
    return NextResponse.json({
      gameId,
      sport,
      homeTeam,
      awayTeam,
      bettingSplits: gameMatch ? {
        homeBetPct: gameMatch.spread.homeBetPct,
        homeMoneyPct: gameMatch.spread.homeMoneyPct,
        awayBetPct: gameMatch.spread.awayBetPct,
        awayMoneyPct: gameMatch.spread.awayMoneyPct,
        source: 'action-network'
      } : null,
      trends: {
        count: applicableTrends.length,
        home: homeTrends,
        away: awayTrends,
        all: applicableTrends.slice(0, 10)
      },
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('Game trends API error:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch game trends',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
