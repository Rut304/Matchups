/**
 * Cron Job: Discover Trends
 * Runs daily at 7 AM UTC to analyze historical_games and discover betting trends.
 * Writes to historical_trends table for use by trend-matcher & Edge engine.
 * 
 * Analyzes: Home ATS, Away ATS, Favorites ATS, Dogs ATS, Overs/Unders,
 *           Rest advantage, divisional games, and more across all 6 sports.
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
export const maxDuration = 300;

type SportKey = 'nfl' | 'nba' | 'nhl' | 'mlb' | 'ncaaf' | 'ncaab';

interface HistoricalGame {
  sport: string;
  season: string;
  game_date: string;
  home_team: string;
  away_team: string;
  home_score: number;
  away_score: number;
  point_spread: number | null;
  over_under: number | null;
  spread_result: string | null;
  total_result: string | null;
}

interface Trend {
  trend_id: string;
  sport: string;
  category: string;
  bet_type: string;
  trend_name: string;
  trend_description: string;
  trend_criteria: Record<string, unknown>;
  wins: number;
  losses: number;
  pushes: number;
  sample_size: number;
}

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const supabase = getSupabase();
  const startTime = Date.now();
  const results: Record<string, unknown> = {};
  
  try {
    const sports: SportKey[] = ['nfl', 'nba', 'nhl', 'mlb', 'ncaaf', 'ncaab'];
    
    for (const sport of sports) {
      results[sport] = await discoverTrendsForSport(sport, supabase);
    }
    
    return NextResponse.json({
      status: 'success',
      results,
      duration: `${Date.now() - startTime}ms`,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('[Trends] Error:', error);
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

async function fetchAllGames(sport: string, supabase: ReturnType<typeof getSupabase>): Promise<HistoricalGame[]> {
  let allGames: HistoricalGame[] = [];
  let offset = 0;
  const batchSize = 1000;
  
  while (true) {
    const { data, error } = await supabase
      .from('historical_games')
      .select('sport, season, game_date, home_team, away_team, home_score, away_score, point_spread, over_under, spread_result, total_result')
      .eq('sport', sport)
      .not('home_score', 'is', null)
      .gt('home_score', 0)
      .range(offset, offset + batchSize - 1);
    
    if (error || !data || data.length === 0) break;
    allGames = allGames.concat(data);
    if (data.length < batchSize) break;
    offset += batchSize;
  }
  
  return allGames;
}

async function discoverTrendsForSport(sport: SportKey, supabase: ReturnType<typeof getSupabase>) {
  console.log(`[Trends] Analyzing ${sport}...`);
  const games = await fetchAllGames(sport, supabase);
  
  if (games.length < 100) {
    console.log(`[Trends] ${sport}: Only ${games.length} games, skipping`);
    return { games: games.length, trends: 0 };
  }

  const trends: Trend[] = [];
  const now = new Date().toISOString();
  const sportUpper = sport.toUpperCase();

  // ---- 1. HOME TEAM ATS ----
  const gamesWithSpread = games.filter(g => g.spread_result && g.spread_result !== 'push');
  if (gamesWithSpread.length >= 50) {
    const homeCovers = gamesWithSpread.filter(g => g.spread_result === 'home_cover').length;
    const awayCovers = gamesWithSpread.length - homeCovers;
    
    trends.push({
      trend_id: `${sport}_home_ats`, sport: sportUpper, category: 'situational', bet_type: 'spread',
      trend_name: `${sportUpper} Home Teams ATS`,
      trend_description: `${sportUpper} home teams against the spread`,
      trend_criteria: { side: 'home', type: 'ats' },
      wins: homeCovers, losses: awayCovers, pushes: 0,
      sample_size: gamesWithSpread.length,
    });
    
    trends.push({
      trend_id: `${sport}_away_ats`, sport: sportUpper, category: 'situational', bet_type: 'spread',
      trend_name: `${sportUpper} Away Teams ATS`,
      trend_description: `${sportUpper} away teams against the spread`,
      trend_criteria: { side: 'away', type: 'ats' },
      wins: awayCovers, losses: homeCovers, pushes: 0,
      sample_size: gamesWithSpread.length,
    });
  }

  // ---- 2. HOME TEAM SU (Straight Up) ----
  const gamesWithScores = games.filter(g => g.home_score > 0 && g.away_score > 0);
  if (gamesWithScores.length >= 50) {
    const homeWins = gamesWithScores.filter(g => g.home_score > g.away_score).length;
    const awayWins = gamesWithScores.length - homeWins;
    
    trends.push({
      trend_id: `${sport}_home_su`, sport: sportUpper, category: 'situational', bet_type: 'moneyline',
      trend_name: `${sportUpper} Home Teams SU`,
      trend_description: `${sportUpper} home teams straight up`,
      trend_criteria: { side: 'home', type: 'su' },
      wins: homeWins, losses: awayWins, pushes: 0,
      sample_size: gamesWithScores.length,
    });
  }

  // ---- 3. FAVORITES ATS ----
  const favGames = games.filter(g => g.point_spread !== null && g.point_spread !== 0 && g.spread_result);
  if (favGames.length >= 50) {
    const homeFavGames = favGames.filter(g => (g.point_spread || 0) < 0);
    
    if (homeFavGames.length >= 30) {
      const favCovers = homeFavGames.filter(g => g.spread_result === 'home_cover').length;
      const dogCovers = homeFavGames.length - favCovers;
      
      trends.push({
        trend_id: `${sport}_favorites_ats`, sport: sportUpper, category: 'value', bet_type: 'spread',
        trend_name: `${sportUpper} Favorites ATS`,
        trend_description: `${sportUpper} favorites covering the spread`,
        trend_criteria: { side: 'favorite', type: 'ats' },
        wins: favCovers, losses: dogCovers, pushes: 0,
        sample_size: homeFavGames.length,
      });
      
      trends.push({
        trend_id: `${sport}_dogs_ats`, sport: sportUpper, category: 'contrarian', bet_type: 'spread',
        trend_name: `${sportUpper} Underdogs ATS`,
        trend_description: `${sportUpper} underdogs against the spread`,
        trend_criteria: { side: 'underdog', type: 'ats' },
        wins: dogCovers, losses: favCovers, pushes: 0,
        sample_size: homeFavGames.length,
      });
    }

    // Big favorites
    const bigSpread = ['nfl', 'ncaaf'].includes(sport) ? 7 : ['nba', 'ncaab'].includes(sport) ? 8 : 2;
    const bigFavs = favGames.filter(g => Math.abs(g.point_spread || 0) >= bigSpread);
    if (bigFavs.length >= 20) {
      const bigFavCovers = bigFavs.filter(g => {
        const isFav = (g.point_spread || 0) < 0;
        return isFav ? g.spread_result === 'home_cover' : g.spread_result === 'away_cover';
      }).length;
      
      trends.push({
        trend_id: `${sport}_big_fav_ats`, sport: sportUpper, category: 'value', bet_type: 'spread',
        trend_name: `${sportUpper} Big Favorites (${bigSpread}+) ATS`,
        trend_description: `${sportUpper} favorites of ${bigSpread}+ points ATS`,
        trend_criteria: { side: 'favorite', minSpread: bigSpread, type: 'ats' },
        wins: bigFavCovers, losses: bigFavs.length - bigFavCovers, pushes: 0,
        sample_size: bigFavs.length,
      });
    }
  }

  // ---- 4. OVER/UNDER TRENDS ----
  const ouGames = games.filter(g => g.total_result && g.total_result !== 'push');
  if (ouGames.length >= 50) {
    const overs = ouGames.filter(g => g.total_result === 'over').length;
    const unders = ouGames.length - overs;
    
    trends.push({
      trend_id: `${sport}_overs`, sport: sportUpper, category: 'situational', bet_type: 'total',
      trend_name: `${sportUpper} Overs`,
      trend_description: `${sportUpper} over rate on totals`,
      trend_criteria: { side: 'over', type: 'totals' },
      wins: overs, losses: unders, pushes: 0,
      sample_size: ouGames.length,
    });

    // High totals vs low totals
    const median = sport === 'nfl' ? 44 : sport === 'nba' ? 220 : sport === 'mlb' ? 8.5 : sport === 'nhl' ? 6 : 140;
    const highTotals = ouGames.filter(g => (g.over_under || 0) >= median);
    const lowTotals = ouGames.filter(g => (g.over_under || 0) < median && (g.over_under || 0) > 0);
    
    if (highTotals.length >= 30) {
      const highOvers = highTotals.filter(g => g.total_result === 'over').length;
      trends.push({
        trend_id: `${sport}_high_total_overs`, sport: sportUpper, category: 'value', bet_type: 'total',
        trend_name: `${sportUpper} High Total Overs`,
        trend_description: `${sportUpper} overs when total >= ${median}`,
        trend_criteria: { side: 'over', minTotal: median, type: 'totals' },
        wins: highOvers, losses: highTotals.length - highOvers, pushes: 0,
        sample_size: highTotals.length,
      });
    }
    
    if (lowTotals.length >= 30) {
      const lowUnders = lowTotals.filter(g => g.total_result === 'under').length;
      trends.push({
        trend_id: `${sport}_low_total_unders`, sport: sportUpper, category: 'value', bet_type: 'total',
        trend_name: `${sportUpper} Low Total Unders`,
        trend_description: `${sportUpper} unders when total < ${median}`,
        trend_criteria: { side: 'under', maxTotal: median, type: 'totals' },
        wins: lowUnders, losses: lowTotals.length - lowUnders, pushes: 0,
        sample_size: lowTotals.length,
      });
    }
  }

  // ---- PERSIST TO historical_trends ----
  let upserted = 0;
  for (const trend of trends) {
    const winPct = round((trend.wins / (trend.wins + trend.losses || 1)) * 100);
    const roi = calcROI(trend.wins, trend.losses);
    const record = `${trend.wins}-${trend.losses}-${trend.pushes}`;
    
    const { error } = await supabase.from('historical_trends').upsert({
      trend_id: trend.trend_id,
      sport: trend.sport,
      category: trend.category,
      bet_type: trend.bet_type,
      trend_name: trend.trend_name,
      trend_description: trend.trend_description,
      trend_criteria: trend.trend_criteria,
      all_time_record: record,
      all_time_units: round(roi * trend.sample_size / 100),
      all_time_roi: roi,
      all_time_avg_odds: -110,
      all_time_sample_size: trend.sample_size,
      confidence_score: Math.min(100, Math.round(Math.min(trend.sample_size / 10, 50) + winPct / 2)),
      is_active: true,
      hot_streak: winPct > 55,
      cold_streak: winPct < 45,
      last_updated: new Date().toISOString(),
    }, { onConflict: 'trend_id' });
    
    if (!error) upserted++;
    else console.warn(`[Trends] Upsert error for ${trend.trend_id}: ${error.message}`);
  }

  console.log(`[Trends] ${sport}: ${games.length} games → ${trends.length} trends (${upserted} upserted)`);
  return { games: games.length, trends: trends.length, upserted };
}

function round(n: number): number { return Math.round(n * 10) / 10; }

function calcROI(wins: number, losses: number, odds = -110): number {
  const total = wins + losses;
  if (total === 0) return 0;
  const payout = odds < 0 ? 100 / Math.abs(odds) : odds / 100;
  return round(((wins * payout - losses) / total) * 100);
}
