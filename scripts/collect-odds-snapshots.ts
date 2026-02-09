/**
 * Odds Snapshot Collector for CLV Tracking
 * 
 * Captures current odds using Action Network (primary) and ESPN (backup)
 * Run via cron every 30 minutes to build line history for CLV calculation
 * 
 * Usage: 
 *   npx tsx scripts/collect-odds-snapshots.ts [--sport NFL|NBA|ALL]
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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
  raw_data: object;
}

const ESPN_SPORTS: Record<string, string> = {
  NFL: 'football/nfl',
  NBA: 'basketball/nba',
  NHL: 'hockey/nhl',
  MLB: 'baseball/mlb',
};

// Action Network - PRIMARY SOURCE (has line movement data)
async function fetchActionNetworkOdds(sport: string): Promise<OddsSnapshot[]> {
  const snapshots: OddsSnapshot[] = [];
  try {
    const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const url = `https://api.actionnetwork.com/web/v2/scoreboard/${sport.toLowerCase()}?date=${today}&periods=event`;
    
    console.log(`[ActionNetwork] Fetching ${sport} odds (PRIMARY)...`);
    const res = await fetch(url, { 
      headers: { 
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'application/json',
        'Referer': 'https://www.actionnetwork.com/'
      }
    });
    
    if (!res.ok) {
      console.log(`[ActionNetwork] Response: ${res.status} ${res.statusText}`);
      return [];
    }

    const data = await res.json();
    const games = data.games || [];
    console.log(`[ActionNetwork] Found ${games.length} ${sport} games`);

    for (const game of games) {
      const bestOdds = game.best_odds || game.odds || {};
      const teams = game.teams || {};
      
      snapshots.push({
        game_id: `an_${game.id || game.game_id}`,
        sport: sport.toUpperCase(),
        game_date: game.start_time || game.datetime,
        home_team: teams.home?.full_name || teams.home?.name || '',
        away_team: teams.away?.full_name || teams.away?.name || '',
        provider: 'action_network',
        spread_home: bestOdds.spread?.current?.home_spread ?? bestOdds.spread?.home_spread ?? null,
        spread_home_odds: bestOdds.spread?.current?.home_odds ?? bestOdds.spread?.home_odds ?? -110,
        spread_away: bestOdds.spread?.current?.away_spread ?? bestOdds.spread?.away_spread ?? null,
        spread_away_odds: bestOdds.spread?.current?.away_odds ?? bestOdds.spread?.away_odds ?? -110,
        total_line: bestOdds.total?.current?.total ?? bestOdds.total?.total ?? null,
        total_over_odds: bestOdds.total?.current?.over_odds ?? bestOdds.total?.over_odds ?? -110,
        total_under_odds: bestOdds.total?.current?.under_odds ?? bestOdds.total?.under_odds ?? -110,
        home_ml: bestOdds.moneyline?.current?.home_ml ?? bestOdds.moneyline?.home_ml ?? null,
        away_ml: bestOdds.moneyline?.current?.away_ml ?? bestOdds.moneyline?.away_ml ?? null,
        is_opening: false,
        is_closing: false,
        raw_data: game,
      });
    }
  } catch (e) {
    console.error('[ActionNetwork] Error:', e);
  }
  return snapshots;
}

// ESPN Pickcenter - BACKUP SOURCE
async function fetchESPNOdds(sport: string): Promise<OddsSnapshot[]> {
  const snapshots: OddsSnapshot[] = [];
  const sportPath = ESPN_SPORTS[sport.toUpperCase()];
  if (!sportPath) return [];

  try {
    const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const url = `https://site.api.espn.com/apis/site/v2/sports/${sportPath}/scoreboard?dates=${today}`;
    
    console.log(`[ESPN] Fetching ${sport} odds (BACKUP)...`);
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' }});
    if (!res.ok) return [];

    const data = await res.json();
    const events = data.events || [];
    console.log(`[ESPN] Found ${events.length} ${sport} events`);

    for (const event of events) {
      const comp = event.competitions?.[0];
      if (!comp) continue;
      
      const home = comp.competitors?.find((c: any) => c.homeAway === 'home');
      const away = comp.competitors?.find((c: any) => c.homeAway === 'away');
      const odds = comp.odds?.[0] || {};

      snapshots.push({
        game_id: `espn_${event.id}`,
        sport: sport.toUpperCase(),
        game_date: event.date,
        home_team: home?.team?.displayName || '',
        away_team: away?.team?.displayName || '',
        provider: odds.provider?.name || 'espn',
        spread_home: odds.spread ? parseFloat(odds.spread) : null,
        spread_home_odds: -110,
        spread_away: odds.spread ? -parseFloat(odds.spread) : null,
        spread_away_odds: -110,
        total_line: odds.overUnder ? parseFloat(odds.overUnder) : null,
        total_over_odds: -110,
        total_under_odds: -110,
        home_ml: odds.homeTeamOdds?.moneyLine ? parseInt(odds.homeTeamOdds.moneyLine) : null,
        away_ml: odds.awayTeamOdds?.moneyLine ? parseInt(odds.awayTeamOdds.moneyLine) : null,
        is_opening: false,
        is_closing: false,
        raw_data: { event, odds },
      });
    }
  } catch (e) {
    console.error('[ESPN] Error:', e);
  }
  return snapshots;
}

async function saveSnapshots(snapshots: OddsSnapshot[]): Promise<number> {
  let saved = 0;
  for (const snap of snapshots) {
    if (!snap.spread_home && !snap.total_line && !snap.home_ml) continue;
    
    const { count } = await supabase
      .from('line_snapshots')
      .select('*', { count: 'exact', head: true })
      .eq('game_id', snap.game_id)
      .eq('provider', snap.provider);
    
    const { error } = await supabase.from('line_snapshots').insert({
      ...snap,
      is_opening: count === 0,
      snapshot_ts: new Date().toISOString(),
    });
    
    if (!error) saved++;
  }
  return saved;
}

async function main() {
  const sportArg = process.argv.find(a => a.startsWith('--sport='))?.split('=')[1] || 'ALL';
  console.log(`\n=== ODDS SNAPSHOT COLLECTOR ===`);
  console.log(`Time: ${new Date().toISOString()}, Sport: ${sportArg}`);
  console.log(`Priority: Action Network (primary), ESPN (backup)\n`);
  
  const sports = sportArg === 'ALL' ? ['NFL', 'NBA', 'NHL', 'MLB'] : [sportArg.toUpperCase()];
  let total = 0;
  
  for (const sport of sports) {
    // Try Action Network first (PRIMARY)
    let actionNetwork = await fetchActionNetworkOdds(sport);
    
    // Only use ESPN as backup if Action Network fails or returns no games
    let espn: OddsSnapshot[] = [];
    if (actionNetwork.length === 0) {
      console.log(`[${sport}] Action Network returned 0 games, falling back to ESPN...`);
      espn = await fetchESPNOdds(sport);
    }
    
    const allSnapshots = [...actionNetwork, ...espn];
    const saved = await saveSnapshots(allSnapshots);
    console.log(`${sport}: AN=${actionNetwork.length}, ESPN=${espn.length}, Saved=${saved}`);
    total += saved;
  }
  
  console.log(`\nTOTAL SAVED: ${total} snapshots\n`);
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
