/**
 * Cron Job: Capture Odds Snapshots for CLV Tracking
 * 
 * Runs every 30 minutes via Vercel Cron
 * Captures current odds from DraftKings/FanDuel and stores in Supabase
 * 
 * Vercel cron config in vercel.json: schedule every 30 minutes
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// =============================================================================
// UTILITY TYPES & HELPERS
// =============================================================================

interface OddsSnapshot {
  game_id: string;
  sport: string;
  game_date: string | null;
  home_team: string;
  away_team: string;
  provider: string;
  spread_home: number | null;
  spread_home_odds: number | null;
  spread_away: number | null;
  spread_away_odds: number | null;
  total_line: number | null;
  total_over_odds: number | null;
  total_under_odds: number | null;
  home_ml: number | null;
  away_ml: number | null;
  is_opening: boolean;
  is_closing: boolean;
}

const DK_SPORT_IDS: Record<string, string> = {
  NFL: '1', NBA: '3', MLB: '84', NHL: '2'
};

const FD_SPORT_KEYS: Record<string, string> = {
  NFL: 'nfl', NBA: 'nba', MLB: 'mlb', NHL: 'nhl'
};

// =============================================================================
// DRAFTKINGS FETCHER
// =============================================================================

async function fetchDraftKingsOdds(sport: string): Promise<OddsSnapshot[]> {
  const snapshots: OddsSnapshot[] = [];
  const sportId = DK_SPORT_IDS[sport];
  if (!sportId) return [];

  try {
    const url = `https://sportsbook.draftkings.com/sites/US-SB/api/v5/eventgroups/${sportId}?format=json`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' },
      next: { revalidate: 0 }
    });

    if (!res.ok) return [];
    const data = await res.json();
    const events = data.eventGroup?.events || data.events || [];

    for (const event of events) {
      try {
        const homeTeam = event.teamName1 || '';
        const awayTeam = event.teamName2 || '';
        const gameId = event.eventId?.toString();
        if (!gameId || !homeTeam) continue;

        const offers = event.displayGroups?.[0]?.markets || [];
        let spread_home = null, spread_away = null;
        let spread_home_odds = null, spread_away_odds = null;
        let total_line = null, total_over_odds = null, total_under_odds = null;
        let home_ml = null, away_ml = null;

        for (const market of offers) {
          const type = (market.marketType || '').toLowerCase();
          const outcomes = market.outcomes || [];
          
          if (type.includes('moneyline')) {
            for (const o of outcomes) {
              if (o.label?.includes(homeTeam)) home_ml = parseInt(o.oddsAmerican) || null;
              else away_ml = parseInt(o.oddsAmerican) || null;
            }
          }
          if (type.includes('spread')) {
            for (const o of outcomes) {
              if (o.label?.includes(homeTeam)) {
                spread_home = parseFloat(o.line) || null;
                spread_home_odds = parseInt(o.oddsAmerican) || null;
              } else {
                spread_away = parseFloat(o.line) || null;
                spread_away_odds = parseInt(o.oddsAmerican) || null;
              }
            }
          }
          if (type.includes('total')) {
            for (const o of outcomes) {
              if (o.label?.toLowerCase().includes('over')) {
                total_line = parseFloat(o.line) || null;
                total_over_odds = parseInt(o.oddsAmerican) || null;
              } else {
                total_under_odds = parseInt(o.oddsAmerican) || null;
              }
            }
          }
        }

        snapshots.push({
          game_id: `dk_${gameId}`,
          sport,
          game_date: event.startDate || null,
          home_team: homeTeam,
          away_team: awayTeam,
          provider: 'draftkings',
          spread_home, spread_home_odds, spread_away, spread_away_odds,
          total_line, total_over_odds, total_under_odds,
          home_ml, away_ml,
          is_opening: false,
          is_closing: false
        });
      } catch { /* continue */ }
    }
  } catch (e) {
    console.error('[DK Error]', e);
  }
  return snapshots;
}

// =============================================================================
// FANDUEL FETCHER
// =============================================================================

async function fetchFanDuelOdds(sport: string): Promise<OddsSnapshot[]> {
  const snapshots: OddsSnapshot[] = [];
  const sportKey = FD_SPORT_KEYS[sport];
  if (!sportKey) return [];

  try {
    const url = `https://sbapi.ny.sportsbook.fanduel.com/api/content-managed-page?page=CUSTOM&customPageId=${sportKey}&_ak=FhMFpcPWXMeyZxOx`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' },
      next: { revalidate: 0 }
    });

    if (!res.ok) return [];
    const data = await res.json();
    const attachments = data.attachments || {};
    const events = Object.values(attachments.events || {}) as any[];
    const markets = attachments.markets || {};

    for (const event of events) {
      try {
        const home = event.participants?.[0]?.name || '';
        const away = event.participants?.[1]?.name || '';
        const gameId = event.eventId?.toString();
        if (!gameId || !home) continue;

        let spread_home = null, spread_away = null;
        let spread_home_odds = null, spread_away_odds = null;
        let total_line = null, total_over_odds = null, total_under_odds = null;
        let home_ml = null, away_ml = null;

        const eventMarkets = Object.values(markets).filter((m: any) => m.eventId === event.eventId) as any[];
        for (const market of eventMarkets) {
          const type = market.marketType || '';
          const runners = market.runners || [];
          
          if (type === 'MATCH_ODDS') {
            for (const r of runners) {
              const odds = Math.round(r.winRunnerOdds?.americanOdds || 0);
              if (r.runnerName?.includes(home)) home_ml = odds;
              else away_ml = odds;
            }
          }
          if (type === 'HANDICAP') {
            for (const r of runners) {
              const line = r.handicap;
              const odds = Math.round(r.winRunnerOdds?.americanOdds || 0);
              if (r.runnerName?.includes(home)) { spread_home = line; spread_home_odds = odds; }
              else { spread_away = line; spread_away_odds = odds; }
            }
          }
          if (type === 'TOTAL_POINTS') {
            for (const r of runners) {
              const odds = Math.round(r.winRunnerOdds?.americanOdds || 0);
              if (r.runnerName?.toLowerCase().includes('over')) {
                total_line = r.handicap;
                total_over_odds = odds;
              } else total_under_odds = odds;
            }
          }
        }

        snapshots.push({
          game_id: `fd_${gameId}`,
          sport,
          game_date: event.openDate || null,
          home_team: home,
          away_team: away,
          provider: 'fanduel',
          spread_home, spread_home_odds, spread_away, spread_away_odds,
          total_line, total_over_odds, total_under_odds,
          home_ml, away_ml,
          is_opening: false,
          is_closing: false
        });
      } catch { /* continue */ }
    }
  } catch (e) {
    console.error('[FD Error]', e);
  }
  return snapshots;
}

// =============================================================================
// SAVE TO DATABASE
// =============================================================================

async function saveSnapshots(snapshots: OddsSnapshot[]): Promise<number> {
  let saved = 0;
  const now = new Date().toISOString();

  for (const snap of snapshots) {
    // Check if this is opening line
    const { count } = await supabase
      .from('line_snapshots')
      .select('*', { count: 'exact', head: true })
      .eq('game_id', snap.game_id)
      .eq('provider', snap.provider);

    const { error } = await supabase
      .from('line_snapshots')
      .insert({
        ...snap,
        is_opening: count === 0,
        snapshot_ts: now
      });

    if (!error) saved++;
  }
  return saved;
}

// =============================================================================
// HANDLER
// =============================================================================

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}` && process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const sports = ['NFL', 'NBA', 'NHL', 'MLB'];
  const results: Record<string, number> = {};
  let totalSaved = 0;

  for (const sport of sports) {
    const [dk, fd] = await Promise.all([
      fetchDraftKingsOdds(sport),
      fetchFanDuelOdds(sport)
    ]);

    const allSnaps = [...dk, ...fd];
    const saved = await saveSnapshots(allSnaps);
    results[sport] = saved;
    totalSaved += saved;
  }

  return NextResponse.json({
    success: true,
    timestamp: new Date().toISOString(),
    total_saved: totalSaved,
    by_sport: results
  });
}
