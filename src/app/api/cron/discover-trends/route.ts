/**
 * Cron Job: Discover Trends
 * Runs daily at 7 AM UTC to analyze historical data and discover betting trends
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes for heavy analysis

type SportKey = 'NFL' | 'NBA' | 'NHL' | 'MLB';

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const supabase = getSupabase();
  const startTime = Date.now();
  const results: Record<string, unknown> = {};
  
  try {
    const sports: SportKey[] = ['NFL', 'NBA', 'NHL', 'MLB'];
    
    for (const sport of sports) {
      results[sport] = await discoverTrendsForSport(sport, supabase);
    }
    
    const duration = Date.now() - startTime;
    
    return NextResponse.json({
      status: 'success',
      results,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('[Cron] Discover trends error:', error);
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

interface TrendAnalysis {
  trendsFound: number;
  trendsUpdated: number;
  newTrends: number;
}

async function discoverTrendsForSport(sport: SportKey, supabase: ReturnType<typeof getSupabase>): Promise<TrendAnalysis> {
  // Get completed games from database
  const { data: games, error } = await supabase
    .from('games')
    .select('*')
    .eq('sport', sport)
    .eq('status', 'final')
    .order('scheduled_at', { ascending: false })
    .limit(500);
  
  if (error || !games || games.length < 50) {
    return { trendsFound: 0, trendsUpdated: 0, newTrends: 0 };
  }
  
  const trends: Array<{
    name: string;
    description: string;
    category: string;
    conditions: Record<string, unknown>;
    winCount: number;
    lossCount: number;
    pushCount: number;
  }> = [];
  
  // Analyze different trend patterns
  // Example: Home favorites ATS
  const homeFavorites = games.filter(g => {
    // Would need odds data - simplified for now
    return g.home_score !== null && g.away_score !== null;
  });
  
  if (homeFavorites.length > 30) {
    const homeWins = homeFavorites.filter(g => g.home_score > g.away_score).length;
    
    trends.push({
      name: `${sport} Home Teams SU`,
      description: `${sport} home teams winning straight up`,
      category: 'home_away',
      conditions: { side: 'home', betType: 'moneyline' },
      winCount: homeWins,
      lossCount: homeFavorites.length - homeWins,
      pushCount: 0
    });
  }
  
  // Over/Under trends by total range
  // Would need total line data
  
  // Division games trends
  // Would need team division data
  
  // Update or insert trends
  let updatedCount = 0;
  let newCount = 0;
  
  for (const trend of trends) {
    const winPct = (trend.winCount / (trend.winCount + trend.lossCount)) * 100;
    
    // Only save trends with meaningful sample size and win rate
    if (trend.winCount + trend.lossCount >= 20 && winPct >= 52) {
      const { data: existing } = await supabase
        .from('trends')
        .select('id')
        .eq('sport', sport)
        .eq('name', trend.name)
        .single();
      
      const trendData = {
        sport,
        name: trend.name,
        description: trend.description,
        category: trend.category,
        conditions: trend.conditions,
        win_count: trend.winCount,
        loss_count: trend.lossCount,
        push_count: trend.pushCount,
        win_pct: winPct,
        sample_size: trend.winCount + trend.lossCount + trend.pushCount,
        roi: calculateROI(trend.winCount, trend.lossCount, -110),
        is_active: true,
        updated_at: new Date().toISOString()
      };
      
      if (existing) {
        await supabase.from('trends').update(trendData).eq('id', existing.id);
        updatedCount++;
      } else {
        await supabase.from('trends').insert(trendData);
        newCount++;
      }
    }
  }
  
  return {
    trendsFound: trends.length,
    trendsUpdated: updatedCount,
    newTrends: newCount
  };
}

function calculateROI(wins: number, losses: number, odds: number): number {
  // Standard -110 odds calculation
  const betsPlaced = wins + losses;
  if (betsPlaced === 0) return 0;
  
  // Win pays ~0.91 units, loss costs 1 unit
  const payout = odds < 0 ? 100 / Math.abs(odds) : odds / 100;
  const profit = (wins * payout) - losses;
  
  return (profit / betsPlaced) * 100;
}
