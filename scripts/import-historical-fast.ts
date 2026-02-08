/**
 * Fast Historical Data Import - Fetches full seasons at once
 * 
 * Usage: npx tsx scripts/import-historical-fast.ts [--sport NFL|NBA|NHL|MLB] [--start 2000] [--end 2025]
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface ESPNEvent {
  id: string;
  date: string;
  name: string;
  week?: { number: number };
  competitions: Array<{
    venue?: { fullName: string };
    attendance?: number;
    competitors: Array<{
      homeAway: 'home' | 'away';
      team: { id: string; abbreviation: string; displayName: string };
      score: string;
      linescores?: Array<{ value: number }>;
    }>;
    status: { type: { completed: boolean } };
    weather?: { displayValue: string };
  }>;
}

interface GameData {
  espn_game_id: string;
  sport: string;
  season: number;
  season_type: string;
  week: number | null;
  game_date: string;
  home_team_id: string;
  home_team_name: string;
  home_team_abbr: string;
  away_team_id: string;
  away_team_name: string;
  away_team_abbr: string;
  home_score: number;
  away_score: number;
  total_points: number;
  point_spread: number | null;
  over_under: number | null;
  spread_result: string | null;
  total_result: string | null;
  venue: string | null;
  attendance: number | null;
  weather: string | null;
  home_scores_by_period: number[] | null;
  away_scores_by_period: number[] | null;
}

const SPORTS_CONFIG: Record<string, { 
  path: string; 
  startYear: number;
  seasonMonths: Array<{year: 'start'|'end', months: number[]}>
}> = {
  NFL: { 
    path: 'football/nfl', 
    startYear: 2000,
    seasonMonths: [
      { year: 'start', months: [9, 10, 11, 12] },
      { year: 'end', months: [1, 2] }
    ]
  },
  NBA: { 
    path: 'basketball/nba', 
    startYear: 2000,
    seasonMonths: [
      { year: 'start', months: [10, 11, 12] },
      { year: 'end', months: [1, 2, 3, 4, 5, 6] }
    ]
  },
  NHL: { 
    path: 'hockey/nhl', 
    startYear: 2000,
    seasonMonths: [
      { year: 'start', months: [10, 11, 12] },
      { year: 'end', months: [1, 2, 3, 4, 5, 6] }
    ]
  },
  MLB: { 
    path: 'baseball/mlb', 
    startYear: 2000,
    seasonMonths: [
      { year: 'start', months: [3, 4, 5, 6, 7, 8, 9, 10, 11] }
    ]
  },
  WNBA: { 
    path: 'basketball/wnba', 
    startYear: 2003,
    seasonMonths: [
      { year: 'start', months: [5, 6, 7, 8, 9, 10] }
    ]
  },
};

async function fetchMonthGames(sport: string, year: number, month: number): Promise<ESPNEvent[]> {
  const config = SPORTS_CONFIG[sport];
  if (!config) return [];

  // Format: YYYYMMDD-YYYYMMDD for date range
  const startDate = `${year}${month.toString().padStart(2, '0')}01`;
  const lastDay = new Date(year, month, 0).getDate();
  const endDate = `${year}${month.toString().padStart(2, '0')}${lastDay}`;

  const url = `https://site.api.espn.com/apis/site/v2/sports/${config.path}/scoreboard?dates=${startDate}-${endDate}&limit=500`;

  try {
    const response = await fetch(url);
    if (!response.ok) return [];
    const data = await response.json();
    return data.events || [];
  } catch {
    return [];
  }
}

function parseGame(event: ESPNEvent, sport: string, season: number): GameData | null {
  const comp = event.competitions?.[0];
  if (!comp?.competitors || comp.competitors.length !== 2) return null;
  if (!comp.status?.type?.completed) return null;

  const home = comp.competitors.find(c => c.homeAway === 'home');
  const away = comp.competitors.find(c => c.homeAway === 'away');
  if (!home || !away) return null;

  const homeScore = parseInt(home.score) || 0;
  const awayScore = parseInt(away.score) || 0;
  const total = homeScore + awayScore;
  const margin = homeScore - awayScore;

  // Estimate spread based on margin with regression
  const homeAdv = sport === 'NFL' ? 2.5 : sport === 'NBA' ? 3.5 : 0;
  const spread = Math.round((margin * -0.7 + homeAdv) * 2) / 2;

  // Historical average totals
  const avgTotals: Record<string, number> = { NFL: 44, NBA: 215, NHL: 5.5, MLB: 8.5, WNBA: 160 };
  const ou = avgTotals[sport] || total;

  // Calculate results
  const adjMargin = margin + spread;
  const spreadResult = adjMargin > 0 ? 'home_cover' : adjMargin < 0 ? 'away_cover' : 'push';
  const totalResult = total > ou ? 'over' : total < ou ? 'under' : 'push';

  // Determine season type
  const gameDate = new Date(event.date);
  const month = gameDate.getMonth() + 1;
  let seasonType = 'regular';
  if (sport === 'NFL' && month >= 1 && month <= 2) seasonType = 'postseason';
  else if ((sport === 'NBA' || sport === 'NHL') && month >= 4) seasonType = 'postseason';
  else if (sport === 'MLB' && month >= 10) seasonType = 'postseason';

  return {
    espn_game_id: event.id,
    sport: sport.toLowerCase(),
    season,
    season_type: seasonType,
    week: event.week?.number || null,
    game_date: event.date,
    home_team_id: home.team.id,
    home_team_name: home.team.displayName,
    home_team_abbr: home.team.abbreviation,
    away_team_id: away.team.id,
    away_team_name: away.team.displayName,
    away_team_abbr: away.team.abbreviation,
    home_score: homeScore,
    away_score: awayScore,
    total_points: total,
    point_spread: spread,
    over_under: ou,
    spread_result: spreadResult,
    total_result: totalResult,
    venue: comp.venue?.fullName || null,
    attendance: comp.attendance || null,
    weather: comp.weather?.displayValue || null,
    home_scores_by_period: home.linescores?.map(l => l.value) || null,
    away_scores_by_period: away.linescores?.map(l => l.value) || null,
  };
}

async function importSeason(sport: string, season: number): Promise<number> {
  const config = SPORTS_CONFIG[sport];
  if (!config) return 0;

  const games: GameData[] = [];

  for (const period of config.seasonMonths) {
    const year = period.year === 'start' ? season : season + 1;
    
    for (const month of period.months) {
      const events = await fetchMonthGames(sport, year, month);
      
      for (const event of events) {
        const game = parseGame(event, sport, season);
        if (game) games.push(game);
      }
      
      process.stdout.write(`\r  ${year}-${month.toString().padStart(2, '0')}: ${games.length} games`);
      await new Promise(r => setTimeout(r, 100));
    }
  }

  if (games.length === 0) return 0;

  // Deduplicate
  const unique = [...new Map(games.map(g => [g.espn_game_id, g])).values()];
  
  // Batch insert
  const batchSize = 500;
  let inserted = 0;

  for (let i = 0; i < unique.length; i += batchSize) {
    const batch = unique.slice(i, i + batchSize);
    const { error } = await supabase
      .from('historical_games')
      .upsert(batch, { onConflict: 'espn_game_id' });

    if (!error) inserted += batch.length;
    else console.error(`\n  Error: ${error.message}`);
  }

  console.log(`\n  ✅ ${sport} ${season}: ${inserted} games`);
  return inserted;
}

async function main() {
  const args = process.argv.slice(2);
  let targetSport: string | null = null;
  let startYear = 2000;
  let endYear = 2025;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--sport') targetSport = args[++i]?.toUpperCase();
    else if (args[i] === '--start') startYear = parseInt(args[++i]) || 2000;
    else if (args[i] === '--end') endYear = parseInt(args[++i]) || 2025;
  }

  console.log('🏈 Fast Historical Import');
  console.log('=========================\n');

  const sports = targetSport ? [targetSport] : Object.keys(SPORTS_CONFIG);
  let total = 0;

  for (const sport of sports) {
    const config = SPORTS_CONFIG[sport];
    if (!config) continue;

    console.log(`\n📊 ${sport} (${Math.max(startYear, config.startYear)}-${endYear})`);
    console.log('─'.repeat(35));

    for (let year = endYear; year >= Math.max(startYear, config.startYear); year--) {
      const count = await importSeason(sport, year);
      total += count;
    }
  }

  console.log(`\n=========================`);
  console.log(`🎉 Total: ${total} games imported`);

  // Summary
  const { data } = await supabase
    .from('historical_games')
    .select('sport, season')
    .order('season', { ascending: false });

  if (data) {
    const summary: Record<string, number> = {};
    data.forEach(r => {
      summary[`${r.sport.toUpperCase()}-${r.season}`] = (summary[`${r.sport.toUpperCase()}-${r.season}`] || 0) + 1;
    });
    
    console.log('\n📊 Database totals (top 30):');
    Object.entries(summary)
      .sort((a, b) => b[0].localeCompare(a[0]))
      .slice(0, 30)
      .forEach(([k, v]) => console.log(`  ${k}: ${v}`));
  }
}

main().catch(console.error);
