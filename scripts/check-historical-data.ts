import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkData() {
  // Check total count by season - use correct column names
  const { data: seasons, error: seasonsErr } = await supabase
    .from('historical_games')
    .select('season, sport')
    .order('season', { ascending: false });

  if (seasonsErr) {
    console.error('Error:', seasonsErr);
    return;
  }

  // Group by season and sport
  const counts: Record<string, number> = {};
  seasons?.forEach(g => {
    const key = `${g.sport}-${g.season}`;
    counts[key] = (counts[key] || 0) + 1;
  });

  console.log('\n=== Historical Games by Sport/Season ===');
  Object.entries(counts)
    .sort((a, b) => b[0].localeCompare(a[0]))
    .forEach(([key, count]) => {
      console.log(`${key}: ${count} games`);
    });

  // Check NFL 2025 specifically with correct schema
  const { data: nfl2025, error: nfl2025Err } = await supabase
    .from('historical_games')
    .select('home_team_abbr, away_team_abbr, game_date, spread_result')
    .eq('sport', 'nfl')
    .eq('season', 2025)
    .order('game_date', { ascending: true });

  if (nfl2025Err) {
    console.error('NFL 2025 Error:', nfl2025Err);
    return;
  }

  console.log(`\n=== NFL 2025 Season: ${nfl2025?.length} games ===`);
  
  // Get unique teams
  const teams = new Set<string>();
  nfl2025?.forEach(g => {
    teams.add(g.home_team_abbr);
    teams.add(g.away_team_abbr);
  });
  console.log(`Teams: ${teams.size}`);
  console.log([...teams].sort().join(', '));

  // Check games per team
  const teamGames: Record<string, number> = {};
  nfl2025?.forEach(g => {
    teamGames[g.home_team_abbr] = (teamGames[g.home_team_abbr] || 0) + 1;
    teamGames[g.away_team_abbr] = (teamGames[g.away_team_abbr] || 0) + 1;
  });

  console.log('\n=== Games per team (NFL 2025) ===');
  Object.entries(teamGames)
    .sort((a, b) => b[1] - a[1])
    .forEach(([team, count]) => {
      console.log(`${team}: ${count} games`);
    });

  // Check for Patriots and Seahawks specifically
  console.log('\n=== NE & SEA Games ===');
  const neGames = nfl2025?.filter(g => 
    g.home_team_abbr === 'NE' || g.away_team_abbr === 'NE'
  );
  console.log(`NE games: ${neGames?.length}`);
  neGames?.forEach(g => console.log(`  ${g.game_date}: ${g.away_team_abbr} @ ${g.home_team_abbr} | spread: ${g.spread_result}`));

  const seaGames = nfl2025?.filter(g => 
    g.home_team_abbr === 'SEA' || g.away_team_abbr === 'SEA'
  );
  console.log(`\nSEA games: ${seaGames?.length}`);
  seaGames?.forEach(g => console.log(`  ${g.game_date}: ${g.away_team_abbr} @ ${g.home_team_abbr} | spread: ${g.spread_result}`));
}

checkData();
