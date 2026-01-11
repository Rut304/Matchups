import { NextResponse } from 'next/server';
import * as espn from '@/lib/api/espn';
import { createClient } from '@supabase/supabase-js';

// This route is called by Vercel Cron every minute during game times
// Cron schedule defined in vercel.json

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

type SportKey = 'NFL' | 'NBA' | 'NHL' | 'MLB';

// Check if we're in active game hours (cost saving)
function isActiveHours(): boolean {
  const now = new Date();
  const hour = now.getUTCHours();
  const dayOfWeek = now.getUTCDay(); // 0 = Sunday
  
  // NFL: Thursday night, Sunday all day, Monday night
  // NBA/NHL/MLB: Typically 6PM-midnight ET (11PM-5AM UTC)
  
  // Core hours: 10AM-2AM ET (3PM-7AM UTC) - covers most games
  // Reduced hours: 2AM-10AM ET (7AM-3PM UTC) - minimal activity
  
  // Always active: 3PM UTC (10AM ET) to 7AM UTC (2AM ET next day)
  if (hour >= 15 || hour < 7) return true;
  
  // Weekend afternoons (more early games)
  if ((dayOfWeek === 0 || dayOfWeek === 6) && hour >= 12) return true;
  
  return false;
}

// Get which sports have active games right now
async function getActiveSports(): Promise<SportKey[]> {
  const activeSports: SportKey[] = [];
  const allSports: SportKey[] = ['NFL', 'NBA', 'NHL', 'MLB'];
  
  for (const sport of allSports) {
    try {
      const scoreboard = await espn.getScoreboard(sport);
      const hasLiveGame = scoreboard.events?.some(
        event => event.status?.type?.state === 'in'
      );
      if (hasLiveGame) {
        activeSports.push(sport);
      }
    } catch {
      // Skip sport if error
    }
  }
  
  return activeSports.length > 0 ? activeSports : allSports.slice(0, 2); // Default to NFL/NBA
}

export async function GET(request: Request) {
  // Verify this is a cron request (Vercel adds this header)
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    // In development, allow without auth
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }
  
  const supabase = getSupabase();
  const startTime = Date.now();
  const results: Record<string, unknown> = {};
  
  try {
    // Check if we should run full updates or reduced
    const fullUpdate = isActiveHours();
    
    if (!fullUpdate) {
      // During quiet hours, only update if there are live games
      const activeSports = await getActiveSports();
      if (activeSports.length === 0) {
        return NextResponse.json({
          status: 'skipped',
          reason: 'No active games during quiet hours',
          nextCheck: 'In 5 minutes'
        });
      }
      
      // Only update active sports
      for (const sport of activeSports) {
        results[sport] = await updateSport(sport, supabase);
      }
    } else {
      // Full update for all sports
      const sports: SportKey[] = ['NFL', 'NBA', 'NHL', 'MLB'];
      
      for (const sport of sports) {
        results[sport] = await updateSport(sport, supabase);
      }
    }
    
    const duration = Date.now() - startTime;
    
    return NextResponse.json({
      status: 'success',
      fullUpdate,
      results,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Cron update error:', error);
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

async function updateSport(sport: SportKey, supabase: ReturnType<typeof getSupabase>) {
  const updates: Record<string, unknown> = {};
  
  try {
    // 1. Fetch current scoreboard
    const scoreboard = await espn.getScoreboard(sport);
    const games = scoreboard.events || [];
    
    updates.gamesFound = games.length;
    
    // 2. Update games in database
    const gameUpdates = [];
    for (const game of games) {
      const competition = game.competitions?.[0];
      if (!competition) continue;
      
      const homeTeam = competition.competitors?.find(c => c.homeAway === 'home');
      const awayTeam = competition.competitors?.find(c => c.homeAway === 'away');
      
      if (!homeTeam || !awayTeam) continue;
      
      const status = mapGameStatus(game.status?.type?.state || 'pre');
      
      gameUpdates.push({
        external_id: game.id,
        sport,
        status,
        home_score: parseInt(homeTeam.score || '0'),
        away_score: parseInt(awayTeam.score || '0'),
        period: game.status?.displayClock || `P${game.status?.period || 0}`,
        updated_at: new Date().toISOString()
      });
    }
    
    if (gameUpdates.length > 0) {
      // Upsert games - update scores if exists, otherwise we'd need full game data
      for (const update of gameUpdates) {
        await supabase
          .from('games')
          .update({
            status: update.status,
            home_score: update.home_score,
            away_score: update.away_score,
            period: update.period,
            updated_at: update.updated_at
          })
          .eq('external_id', update.external_id);
      }
      updates.gamesUpdated = gameUpdates.length;
    }
    
    // 3. Grade any completed picks
    const completedGames = games.filter(g => g.status?.type?.state === 'post');
    if (completedGames.length > 0) {
      updates.completedGames = completedGames.length;
      // TODO: Implement pick grading logic
    }
    
    return { success: true, ...updates };
    
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

function mapGameStatus(state: string): 'scheduled' | 'live' | 'final' {
  switch (state) {
    case 'in': return 'live';
    case 'post': return 'final';
    default: return 'scheduled';
  }
}
