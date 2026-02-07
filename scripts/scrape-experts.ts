#!/usr/bin/env npx tsx
/**
 * Expert Picks Scheduler
 * 
 * Run this script via cron or your scheduler of choice
 * 
 * Recommended schedule (all times ET):
 * - Morning:    8:00 AM  - Get early picks before games
 * - Pre-game:   11:00 AM - NFL Sunday, 6:30 PM weekdays
 * - Post-game:  11:30 PM - Capture final results
 * 
 * Example crontab entries:
 * 0 8 * * * cd /path/to/matchups && npx tsx scripts/scrape-experts.ts morning
 * 0 11 * * 0 cd /path/to/matchups && npx tsx scripts/scrape-experts.ts pregame-nfl
 * 30 18 * * 1-5 cd /path/to/matchups && npx tsx scripts/scrape-experts.ts pregame-weekday
 * 30 23 * * * cd /path/to/matchups && npx tsx scripts/scrape-experts.ts postgame
 */

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const API_BASE = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

async function callAPI(action: string, options: Record<string, any> = {}) {
  const response = await fetch(`${API_BASE}/api/expert-picks/scrape`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, ...options }),
  });
  
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }
  
  return response.json();
}

async function scrapeTwitter(handle?: string) {
  try {
    console.log(handle ? `Scraping X @${handle}...` : 'Scraping all X experts...');
    const result = await callAPI('scrape-x', { handle });
    console.log('X scrape result:', result.twitter);
    return result;
  } catch (error) {
    console.error('X scrape failed:', error);
    return null;
  }
}

async function scrapeESPN(sports: string[]) {
  try {
    console.log(`Scraping ESPN for: ${sports.join(', ')}...`);
    const result = await callAPI('scrape-espn', { sports });
    console.log('ESPN result:', result);
    return result;
  } catch (error) {
    console.error('ESPN scrape failed:', error);
    return null;
  }
}

async function scrapeCovers(sports: string[]) {
  try {
    console.log(`Scraping Covers for: ${sports.join(', ')}...`);
    const result = await callAPI('scrape-covers', { sports });
    console.log('Covers result:', result);
    return result;
  } catch (error) {
    console.error('Covers scrape failed:', error);
    return null;
  }
}

// Determine what sports are in season
function getActiveSports(): string[] {
  const month = new Date().getMonth() + 1; // 1-12
  const sports: string[] = [];
  
  // NFL: Sept-Feb
  if (month >= 9 || month <= 2) sports.push('NFL');
  
  // NBA: Oct-June
  if (month >= 10 || month <= 6) sports.push('NBA');
  
  // MLB: March-Oct
  if (month >= 3 && month <= 10) sports.push('MLB');
  
  // NHL: Oct-June
  if (month >= 10 || month <= 6) sports.push('NHL');
  
  // NCAAF: Aug-Jan
  if (month >= 8 || month <= 1) sports.push('NCAAF');
  
  // NCAAB: Nov-April (March Madness)
  if (month >= 11 || month <= 4) sports.push('NCAAB');
  
  return sports;
}

async function runSchedule(schedule: string) {
  const activeSports = getActiveSports();
  console.log(`\n=== Expert Picks Scraper: ${schedule.toUpperCase()} ===`);
  console.log(`Active sports: ${activeSports.join(', ')}`);
  console.log(`Time: ${new Date().toISOString()}\n`);
  
  const results: Record<string, any> = {};
  
  switch (schedule) {
    case 'morning':
      // Morning scrape - get X/Twitter picks and Covers consensus
      console.log('Morning scrape: X + Covers');
      results.twitter = await scrapeTwitter();
      await new Promise(r => setTimeout(r, 2000));
      results.covers = await scrapeCovers(activeSports);
      break;
      
    case 'pregame':
    case 'pregame-nfl':
    case 'pregame-weekday':
      // Pre-game scrape - all sources
      console.log('Pre-game scrape: All sources');
      results.twitter = await scrapeTwitter();
      await new Promise(r => setTimeout(r, 2000));
      results.espn = await scrapeESPN(activeSports);
      await new Promise(r => setTimeout(r, 2000));
      results.covers = await scrapeCovers(activeSports);
      break;
      
    case 'postgame':
    case 'results':
      // Post-game scrape - capture final picks and prepare for result grading
      console.log('Post-game scrape: X + results');
      results.twitter = await scrapeTwitter();
      // TODO: Add result grading
      results.message = 'Result grading will be implemented next';
      break;
      
    case 'twitter-only':
    case 'x-only':
      // Just X/Twitter
      results.twitter = await scrapeTwitter();
      break;
      
    case 'espn-only':
      results.espn = await scrapeESPN(activeSports);
      break;
      
    case 'covers-only':
      results.covers = await scrapeCovers(activeSports);
      break;
      
    case 'all':
    case 'full':
      // Full scrape - everything
      console.log('Full scrape: All sources');
      results.twitter = await scrapeTwitter();
      await new Promise(r => setTimeout(r, 3000));
      results.espn = await scrapeESPN(activeSports);
      await new Promise(r => setTimeout(r, 3000));
      results.covers = await scrapeCovers(activeSports);
      break;
      
    default:
      // Check if it's a Twitter handle
      if (schedule.startsWith('@')) {
        const handle = schedule.slice(1);
        results.twitter = await scrapeTwitter(handle);
      } else {
        console.log('Unknown schedule. Options:');
        console.log('  morning     - X + Covers (pre-picks)');
        console.log('  pregame     - All sources');
        console.log('  postgame    - X + prepare results');
        console.log('  twitter-only / x-only');
        console.log('  espn-only');
        console.log('  covers-only');
        console.log('  all / full  - Everything');
        console.log('  @handle     - Specific Twitter user');
        process.exit(1);
      }
  }
  
  console.log('\n=== Scrape Complete ===');
  console.log('Results summary:', JSON.stringify(results, null, 2));
  
  return results;
}

// Main
const schedule = process.argv[2] || 'all';
runSchedule(schedule)
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Scrape failed:', err);
    process.exit(1);
  });
