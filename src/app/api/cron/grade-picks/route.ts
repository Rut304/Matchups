/**
 * Cron Job: Grade Picks
 * Runs 3x daily to grade completed picks and update capper stats
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import * as espn from '@/lib/api/espn';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const supabase = getSupabase();
  const startTime = Date.now();
  
  try {
    // Get all pending picks from the last 7 days
    const { data: pendingPicks, error } = await supabase
      .from('picks')
      .select(`
        id,
        capper_id,
        game_id,
        sport,
        bet_type,
        pick_team,
        line,
        units,
        odds,
        home_team,
        away_team,
        game_time
      `)
      .eq('result', 'pending')
      .lt('game_time', new Date().toISOString())
      .order('game_time', { ascending: true });
    
    if (error) throw error;
    
    if (!pendingPicks || pendingPicks.length === 0) {
      return NextResponse.json({
        status: 'success',
        message: 'No pending picks to grade',
        timestamp: new Date().toISOString()
      });
    }
    
    const gradedPicks: string[] = [];
    const failedPicks: string[] = [];
    
    for (const pick of pendingPicks) {
      try {
        const result = await gradePick(pick);
        
        if (result) {
          // Update pick in database
          const { error: updateError } = await supabase
            .from('picks')
            .update({
              result: result.result,
              actual_score_home: result.homeScore,
              actual_score_away: result.awayScore,
              profit_loss: result.profitLoss,
              graded_at: new Date().toISOString()
            })
            .eq('id', pick.id);
          
          if (!updateError) {
            gradedPicks.push(pick.id);
            
            // Update capper stats
            await updateCapperStats(pick.capper_id, result, supabase);
          } else {
            failedPicks.push(pick.id);
          }
        }
      } catch {
        failedPicks.push(pick.id);
      }
    }
    
    const duration = Date.now() - startTime;
    
    return NextResponse.json({
      status: 'success',
      pendingPicks: pendingPicks.length,
      gradedPicks: gradedPicks.length,
      failedPicks: failedPicks.length,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('[Cron] Grade picks error:', error);
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

interface Pick {
  id: string;
  capper_id: string;
  game_id: string;
  sport: string;
  bet_type: string;
  pick_team: string;
  line: number | null;
  units: number;
  odds: number;
  home_team: string;
  away_team: string;
  game_time: string;
}

interface GradeResult {
  result: 'win' | 'loss' | 'push';
  homeScore: number;
  awayScore: number;
  profitLoss: number;
}

async function gradePick(pick: Pick): Promise<GradeResult | null> {
  // Get game result from ESPN
  const sport = pick.sport as 'NFL' | 'NBA' | 'NHL' | 'MLB';
  
  try {
    const scoreboard = await espn.getScoreboard(sport);
    const events = scoreboard.events || [];
    
    // Find the game
    const game = events.find(e => e.id === pick.game_id);
    
    if (!game || game.status?.type?.state !== 'post') {
      // Game not found or not complete
      return null;
    }
    
    const competition = game.competitions?.[0];
    if (!competition) return null;
    
    const homeTeam = competition.competitors?.find(c => c.homeAway === 'home');
    const awayTeam = competition.competitors?.find(c => c.homeAway === 'away');
    
    if (!homeTeam || !awayTeam) return null;
    
    const homeScore = parseInt(homeTeam.score || '0');
    const awayScore = parseInt(awayTeam.score || '0');
    const scoreDiff = homeScore - awayScore;
    
    let result: 'win' | 'loss' | 'push';
    
    switch (pick.bet_type) {
      case 'spread': {
        // Home team spread
        const isHomePick = pick.pick_team.toLowerCase().includes(pick.home_team.toLowerCase());
        const line = pick.line || 0;
        
        if (isHomePick) {
          // Home team covering
          const cover = scoreDiff + line;
          if (cover > 0) result = 'win';
          else if (cover < 0) result = 'loss';
          else result = 'push';
        } else {
          // Away team covering
          const cover = -scoreDiff + (-line);
          if (cover > 0) result = 'win';
          else if (cover < 0) result = 'loss';
          else result = 'push';
        }
        break;
      }
      
      case 'total': {
        const total = homeScore + awayScore;
        const line = pick.line || 0;
        const isOver = pick.pick_team.toLowerCase().includes('over');
        
        if (isOver) {
          if (total > line) result = 'win';
          else if (total < line) result = 'loss';
          else result = 'push';
        } else {
          if (total < line) result = 'win';
          else if (total > line) result = 'loss';
          else result = 'push';
        }
        break;
      }
      
      case 'moneyline': {
        const isHomePick = pick.pick_team.toLowerCase().includes(pick.home_team.toLowerCase());
        
        if (isHomePick) {
          result = homeScore > awayScore ? 'win' : homeScore < awayScore ? 'loss' : 'push';
        } else {
          result = awayScore > homeScore ? 'win' : awayScore < homeScore ? 'loss' : 'push';
        }
        break;
      }
      
      default:
        return null;
    }
    
    // Calculate profit/loss
    const units = pick.units || 1;
    const odds = pick.odds || -110;
    
    let profitLoss: number;
    if (result === 'push') {
      profitLoss = 0;
    } else if (result === 'win') {
      // Calculate payout
      profitLoss = odds < 0 
        ? units * (100 / Math.abs(odds))
        : units * (odds / 100);
    } else {
      profitLoss = -units;
    }
    
    return {
      result,
      homeScore,
      awayScore,
      profitLoss
    };
    
  } catch {
    return null;
  }
}

async function updateCapperStats(capperId: string, result: GradeResult, supabase: ReturnType<typeof getSupabase>): Promise<void> {
  // The trigger in the database handles stat updates
  // This is just for additional logic if needed
  
  // Update streak
  const { data: capper } = await supabase
    .from('cappers')
    .select('current_streak')
    .eq('id', capperId)
    .single();
  
  if (capper) {
    let newStreak = capper.current_streak || 0;
    
    if (result.result === 'win') {
      newStreak = newStreak >= 0 ? newStreak + 1 : 1;
    } else if (result.result === 'loss') {
      newStreak = newStreak <= 0 ? newStreak - 1 : -1;
    }
    
    await supabase
      .from('cappers')
      .update({ current_streak: newStreak })
      .eq('id', capperId);
  }
}
