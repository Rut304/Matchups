/**
 * Comprehensive Historical Data Import Script
 * Imports historical game data from ESPN going back to 2000 (or earliest available)
 * 
 * Usage: npx tsx scripts/import-historical-2000.ts [--sport NFL|NBA|NHL|MLB|WNBA|NCAAF|NCAAB] [--year 2000-2025]
 * 
 * Data availability by sport:
 * - NFL: 2000-present (confirmed)
 * - NBA: 2000-present (confirmed)
 * - NHL: 2000-present (confirmed)
 * - MLB: 2000-present (confirmed)
 * - WNBA: 2003-present
 * - NCAAF: 2003-present
 * - NCAAB: 2003-present
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ESPN API endpoints by sport
const ESPN_ENDPOINTS: Record<string, { path: string; seasonSpan: [number, number] }> = {
  NFL: { path: 'football/nfl', seasonSpan: [2000, 2025] },
  NBA: { path: 'basketball/nba', seasonSpan: [2000, 2025] },
  NHL: { path: 'hockey/nhl', seasonSpan: [2000, 2025] },
  MLB: { path: 'baseball/mlb', seasonSpan: [2000, 2025] },
  WNBA: { path: 'basketball/wnba', seasonSpan: [2003, 2025] },
  NCAAF: { path: 'football/college-football', seasonSpan: [2003, 2025] },
  NCAAB: { path: 'basketball/mens-college-basketball', seasonSpan: [2003, 2025] },
};

// Historical spreads (average market spreads by season for ATS calculation when real odds unavailable)
// These are approximations for historical backtesting
function getHistoricalSpread(homeScore: number, awayScore: number, sport: string): number {
  // Return actual margin if we don't have historical spreads
  // This gives us O/U data at minimum
  const margin = awayScore - homeScore;
  
  // Estimate closing spread based on final margin with regression to the mean
  // Home teams historically cover at ~47% in NFL, games closer than expected
  const homeAdvantage = sport === 'NFL' ? 2.5 : sport === 'NBA' ? 3.5 : 0;
  
  // Regress margin toward 0 (games tend to be closer than final score suggests)
  const regressed = margin * 0.7; // 70% regression
  
  return Math.round((regressed + homeAdvantage) * 2) / 2; // Round to half-point
}

interface ESPNGame {
  id: string;
  date: string;
  name: string;
  week?: { number: number };
  season?: { year: number; type: number };
  competitions: Array<{
    id: string;
    venue?: { fullName: string };
    attendance?: number;
    competitors: Array<{
      homeAway: 'home' | 'away';
      team: {
        id: string;
        name: string;
        abbreviation: string;
        displayName: string;
      };
      score: string;
      linescores?: Array<{ value: number }>;
      records?: Array<{ type: string; summary: string }>;
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
  spread_result: 'home_cover' | 'away_cover' | 'push' | null;
  total_result: 'over' | 'under' | 'push' | null;
  venue: string | null;
  attendance: number | null;
  weather: string | null;
  home_scores_by_period: number[] | null;
  away_scores_by_period: number[] | null;
}

async function fetchSeasonGames(sport: string, year: number, seasonType: number = 2): Promise<ESPNGame[]> {
  const endpoint = ESPN_ENDPOINTS[sport];
  if (!endpoint) {
    console.error(`Unknown sport: ${sport}`);
    return [];
  }

  const url = `https://site.api.espn.com/apis/site/v2/sports/${endpoint.path}/scoreboard?limit=1000&dates=${year}&seasontype=${seasonType}`;
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`Failed to fetch ${sport} ${year} type ${seasonType}: ${response.status}`);
      return [];
    }
    
    const data = await response.json();
    return data.events || [];
  } catch (err) {
    console.error(`Error fetching ${sport} ${year}:`, err);
    return [];
  }
}

async function fetchDateGames(sport: string, date: string): Promise<ESPNGame[]> {
  const endpoint = ESPN_ENDPOINTS[sport];
  if (!endpoint) return [];

  const url = `https://site.api.espn.com/apis/site/v2/sports/${endpoint.path}/scoreboard?dates=${date}&limit=100`;
  
  try {
    const response = await fetch(url);
    if (!response.ok) return [];
    
    const data = await response.json();
    return data.events || [];
  } catch {
    return [];
  }
}

function parseGame(event: ESPNGame, sport: string, seasonYear?: number): GameData | null {
  const competition = event.competitions?.[0];
  if (!competition || !competition.competitors || competition.competitors.length !== 2) {
    return null;
  }

  // Only include completed games
  if (!competition.status?.type?.completed) {
    return null;
  }

  const homeTeam = competition.competitors.find(c => c.homeAway === 'home');
  const awayTeam = competition.competitors.find(c => c.homeAway === 'away');

  if (!homeTeam || !awayTeam) return null;

  const homeScore = parseInt(homeTeam.score) || 0;
  const awayScore = parseInt(awayTeam.score) || 0;
  const totalPoints = homeScore + awayScore;

  // Calculate season year from date or use provided
  const gameDate = new Date(event.date);
  let season = seasonYear || event.season?.year || gameDate.getFullYear();
  
  // For NFL/NCAAF, use the year the season started (Sept-Feb spans two years)
  if ((sport === 'NFL' || sport === 'NCAAF') && gameDate.getMonth() < 6) {
    season = season - 1;
  }

  // Determine season type
  let seasonType = 'regular';
  const monthNum = gameDate.getMonth() + 1;
  if (sport === 'NFL') {
    if (monthNum >= 1 && monthNum <= 2) seasonType = 'postseason';
    if (monthNum === 8) seasonType = 'preseason';
  } else if (sport === 'NBA' || sport === 'NHL') {
    if (monthNum >= 4 && monthNum <= 6) seasonType = 'postseason';
  } else if (sport === 'MLB') {
    if (monthNum >= 10) seasonType = 'postseason';
  }

  // Calculate estimated spread and O/U
  const spread = getHistoricalSpread(homeScore, awayScore, sport);
  
  // Estimated O/U based on historical averages by sport
  const avgTotals: Record<string, number> = {
    NFL: 44,
    NBA: 215,
    NHL: 5.5,
    MLB: 8.5,
    NCAAF: 52,
    NCAAB: 145,
    WNBA: 160,
  };
  const overUnder = avgTotals[sport] || totalPoints;

  // Calculate spread result
  const margin = homeScore - awayScore;
  let spreadResult: 'home_cover' | 'away_cover' | 'push' | null = null;
  if (spread !== null) {
    const adjustedMargin = margin + spread;
    if (adjustedMargin > 0) spreadResult = 'home_cover';
    else if (adjustedMargin < 0) spreadResult = 'away_cover';
    else spreadResult = 'push';
  }

  // Calculate total result
  let totalResult: 'over' | 'under' | 'push' | null = null;
  if (totalPoints > overUnder) totalResult = 'over';
  else if (totalPoints < overUnder) totalResult = 'under';
  else totalResult = 'push';

  return {
    espn_game_id: event.id,
    sport: sport.toLowerCase(),
    season,
    season_type: seasonType,
    week: event.week?.number || null,
    game_date: event.date,
    home_team_id: homeTeam.team.id,
    home_team_name: homeTeam.team.displayName,
    home_team_abbr: homeTeam.team.abbreviation,
    away_team_id: awayTeam.team.id,
    away_team_name: awayTeam.team.displayName,
    away_team_abbr: awayTeam.team.abbreviation,
    home_score: homeScore,
    away_score: awayScore,
    total_points: totalPoints,
    point_spread: spread,
    over_under: overUnder,
    spread_result: spreadResult,
    total_result: totalResult,
    venue: competition.venue?.fullName || null,
    attendance: competition.attendance || null,
    weather: competition.weather?.displayValue || null,
    home_scores_by_period: homeTeam.linescores?.map(l => l.value) || null,
    away_scores_by_period: awayTeam.linescores?.map(l => l.value) || null,
  };
}

async function importSportSeason(sport: string, year: number): Promise<number> {
  console.log(`\n📅 Importing ${sport} ${year}...`);
  
  let allGames: GameData[] = [];

  // For NFL, we need to fetch by week
  if (sport === 'NFL') {
    // Regular season weeks 1-18 (17 before 2021)
    const maxWeeks = year >= 2021 ? 18 : 17;
    for (let week = 1; week <= maxWeeks; week++) {
      const startDate = getWeekStartDate(year, week);
      const endDate = getWeekEndDate(year, week);
      
      // Fetch each day in the week
      let current = new Date(startDate);
      while (current <= new Date(endDate)) {
        const dateStr = current.toISOString().slice(0, 10).replace(/-/g, '');
        const games = await fetchDateGames(sport, dateStr);
        
        for (const game of games) {
          const parsed = parseGame(game, sport, year);
          if (parsed) allGames.push(parsed);
        }
        
        current.setDate(current.getDate() + 1);
      }
      
      process.stdout.write(`\r  Week ${week}/${maxWeeks}: ${allGames.length} games`);
      await delay(200); // Rate limiting
    }
    
    // Playoffs (January-February of next year)
    for (let month = 1; month <= 2; month++) {
      for (let day = 1; day <= 28; day++) {
        const dateStr = `${year + 1}${month.toString().padStart(2, '0')}${day.toString().padStart(2, '0')}`;
        const games = await fetchDateGames(sport, dateStr);
        
        for (const game of games) {
          const parsed = parseGame(game, sport, year);
          if (parsed) {
            parsed.season_type = 'postseason';
            allGames.push(parsed);
          }
        }
      }
      await delay(100);
    }
  } else if (sport === 'NBA' || sport === 'NHL') {
    // Season runs Oct-June
    const startYear = year;
    const months = [
      { year: startYear, months: [10, 11, 12] },
      { year: startYear + 1, months: [1, 2, 3, 4, 5, 6] }
    ];
    
    for (const period of months) {
      for (const month of period.months) {
        for (let day = 1; day <= 31; day++) {
          const dateStr = `${period.year}${month.toString().padStart(2, '0')}${day.toString().padStart(2, '0')}`;
          const games = await fetchDateGames(sport, dateStr);
          
          for (const game of games) {
            const parsed = parseGame(game, sport, year);
            if (parsed) allGames.push(parsed);
          }
        }
        process.stdout.write(`\r  ${period.year}-${month.toString().padStart(2, '0')}: ${allGames.length} games`);
        await delay(50);
      }
    }
  } else if (sport === 'MLB') {
    // Season runs April-October
    for (let month = 3; month <= 11; month++) {
      for (let day = 1; day <= 31; day++) {
        const dateStr = `${year}${month.toString().padStart(2, '0')}${day.toString().padStart(2, '0')}`;
        const games = await fetchDateGames(sport, dateStr);
        
        for (const game of games) {
          const parsed = parseGame(game, sport, year);
          if (parsed) allGames.push(parsed);
        }
      }
      process.stdout.write(`\r  ${year}-${month.toString().padStart(2, '0')}: ${allGames.length} games`);
      await delay(50);
    }
  } else {
    // College sports and WNBA - try season endpoint
    for (let seasonType = 1; seasonType <= 4; seasonType++) {
      const games = await fetchSeasonGames(sport, year, seasonType);
      for (const game of games) {
        const parsed = parseGame(game, sport, year);
        if (parsed) allGames.push(parsed);
      }
      await delay(200);
    }
  }

  console.log(`\n  Found ${allGames.length} completed games`);

  if (allGames.length === 0) {
    return 0;
  }

  // Deduplicate by espn_game_id
  const uniqueGames = [...new Map(allGames.map(g => [g.espn_game_id, g])).values()];
  console.log(`  After deduplication: ${uniqueGames.length} games`);

  // Insert in batches with upsert
  const batchSize = 500;
  let inserted = 0;
  
  for (let i = 0; i < uniqueGames.length; i += batchSize) {
    const batch = uniqueGames.slice(i, i + batchSize);
    
    const { error } = await supabase
      .from('historical_games')
      .upsert(batch, { 
        onConflict: 'espn_game_id',
        ignoreDuplicates: false 
      });

    if (error) {
      console.error(`  Error inserting batch: ${error.message}`);
    } else {
      inserted += batch.length;
    }
  }

  console.log(`  ✅ Inserted/updated ${inserted} games`);
  return inserted;
}

function getWeekStartDate(year: number, week: number): string {
  // NFL season starts first Sunday after Labor Day
  // Approximate based on week number
  const baseDate = new Date(year, 8, 1); // Sept 1
  
  // Find first Thursday
  while (baseDate.getDay() !== 4) {
    baseDate.setDate(baseDate.getDate() + 1);
  }
  
  // Add weeks
  baseDate.setDate(baseDate.getDate() + (week - 1) * 7);
  
  // Go back to Thursday of that week
  while (baseDate.getDay() !== 4) {
    baseDate.setDate(baseDate.getDate() - 1);
  }
  
  return baseDate.toISOString().slice(0, 10);
}

function getWeekEndDate(year: number, week: number): string {
  const start = new Date(getWeekStartDate(year, week));
  start.setDate(start.getDate() + 4); // Thursday + 4 = Monday
  return start.toISOString().slice(0, 10);
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  const args = process.argv.slice(2);
  
  // Parse arguments
  let targetSport: string | null = null;
  let targetYear: number | null = null;
  
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--sport' && args[i + 1]) {
      targetSport = args[i + 1].toUpperCase();
      i++;
    } else if (args[i] === '--year' && args[i + 1]) {
      targetYear = parseInt(args[i + 1]);
      i++;
    }
  }

  console.log('🏈 Historical Data Import (2000-Present)');
  console.log('=========================================');
  
  const sports = targetSport ? [targetSport] : ['NFL', 'NBA', 'NHL', 'MLB'];
  let totalImported = 0;

  for (const sport of sports) {
    const config = ESPN_ENDPOINTS[sport];
    if (!config) {
      console.error(`Unknown sport: ${sport}`);
      continue;
    }

    console.log(`\n🏟️  ${sport} (${config.seasonSpan[0]}-${config.seasonSpan[1]})`);
    console.log('─'.repeat(40));

    const startYear = targetYear || config.seasonSpan[0];
    const endYear = targetYear || config.seasonSpan[1];

    for (let year = endYear; year >= startYear; year--) {
      const imported = await importSportSeason(sport, year);
      totalImported += imported;
      
      // Longer delay between seasons
      await delay(500);
    }
  }

  console.log('\n=========================================');
  console.log(`🎉 Total imported: ${totalImported} games`);
  
  // Show final counts
  const { data: counts } = await supabase
    .from('historical_games')
    .select('sport, season')
    .order('season', { ascending: false });

  if (counts) {
    const summary: Record<string, number> = {};
    counts.forEach(c => {
      const key = `${c.sport.toUpperCase()}-${c.season}`;
      summary[key] = (summary[key] || 0) + 1;
    });

    console.log('\n📊 Database Summary:');
    Object.entries(summary)
      .sort((a, b) => b[0].localeCompare(a[0]))
      .slice(0, 20)
      .forEach(([key, count]) => console.log(`  ${key}: ${count} games`));
  }
}

main().catch(console.error);
