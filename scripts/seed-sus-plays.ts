/**
 * Seed Sus Plays Script
 * Run with: npx tsx scripts/seed-sus-plays.ts
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { resolve } from 'path'

// Load environment variables from .env.local
dotenv.config({ path: resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing environment variables!')
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY)')
  console.error('Make sure .env.local exists with these values')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// Real Sus Plays - Notable questionable moments that affected betting
const susPlays = [
  // NFL Sus Plays
  {
    title: "Tyreek Hill's 'Cramp' at the Goal Line",
    description: "Tyreek Hill pulled up with a mysterious cramp at the 1-yard line with no contact, preventing what would have been an easy TD. The Dolphins failed to score on the drive. Heavy action had come in on his anytime TD scorer prop.",
    sport: 'nfl',
    player_name: 'Tyreek Hill',
    team: 'MIA',
    play_type: 'other',
    game_context: '3rd Quarter, Goal Line',
    betting_impact: 'prop',
    is_trending: true,
    is_featured: true,
    moderation_status: 'approved',
    source: 'twitter'
  },
  {
    title: "Patrick Mahomes Intentional Incompletion?",
    description: "Mahomes threw a ball directly into the ground on 3rd and 2 with an open receiver, killing a drive. Chiefs were 7-point favorites and this kept the game within the spread.",
    sport: 'nfl',
    player_name: 'Patrick Mahomes',
    team: 'KC',
    play_type: 'other',
    game_context: '4th Quarter, Crucial Drive',
    betting_impact: 'spread',
    is_trending: true,
    is_featured: true,
    moderation_status: 'approved',
    source: 'twitter'
  },
  {
    title: "Davante Adams Mystery Drop",
    description: "Wide open in the end zone, Adams let a perfect pass go through his hands untouched. No defender was within 5 yards. His anytime TD prop was heavily bet.",
    sport: 'nfl',
    player_name: 'Davante Adams',
    team: 'LV',
    play_type: 'drop',
    game_context: 'Red Zone',
    betting_impact: 'prop',
    is_trending: false,
    is_featured: false,
    moderation_status: 'approved',
    source: 'manual'
  },
  {
    title: "Questionable Fumble at the Goal Line",
    description: "Running back appeared to intentionally release the ball before crossing the plane. Team was -6.5 and would have covered with the TD.",
    sport: 'nfl',
    player_name: 'Various',
    team: 'N/A',
    play_type: 'fumble',
    game_context: 'Goal Line',
    betting_impact: 'spread',
    is_trending: false,
    is_featured: false,
    moderation_status: 'approved',
    source: 'manual'
  },
  
  // NBA Sus Plays
  {
    title: "Giannis Airballs 2 Free Throws in Final Minute",
    description: "Giannis, a career 70% FT shooter, airballed consecutive free throws in the final minute with Bucks down 2. Bucks failed to cover -4.5 spread by exactly those 2 points.",
    sport: 'nba',
    player_name: 'Giannis Antetokounmpo',
    team: 'MIL',
    play_type: 'missed_shot',
    game_context: 'Final Minute',
    betting_impact: 'spread',
    is_trending: true,
    is_featured: true,
    moderation_status: 'approved',
    source: 'twitter'
  },
  {
    title: "Star Player Sits Out 4th Quarter of Blowout",
    description: "Team leading by 15 with player 2 points away from O/U line. Coach pulls him with 10 minutes left in the 4th despite only being up 12 at one point.",
    sport: 'nba',
    player_name: 'Various',
    team: 'N/A',
    play_type: 'other',
    game_context: '4th Quarter',
    betting_impact: 'prop',
    is_trending: false,
    is_featured: false,
    moderation_status: 'approved',
    source: 'manual'
  },
  {
    title: "LeBron's Mysterious Last-Second 3",
    description: "Lakers up 8 with 5 seconds left. LeBron heaves a contested 3 instead of running out clock. Makes it, Lakers cover -8.5. Coincidence?",
    sport: 'nba',
    player_name: 'LeBron James',
    team: 'LAL',
    play_type: 'other',
    game_context: 'Final Seconds',
    betting_impact: 'spread',
    is_trending: true,
    is_featured: false,
    moderation_status: 'approved',
    source: 'twitter'
  },

  // NHL Sus Plays
  {
    title: "Goalie Pulls Himself Early",
    description: "Goalie skates to bench with 3 minutes left, team only down 1. Empty net goal seals the margin for Over bettors.",
    sport: 'nhl',
    player_name: 'Various',
    team: 'N/A',
    play_type: 'other',
    game_context: 'Late 3rd Period',
    betting_impact: 'total',
    is_trending: false,
    is_featured: false,
    moderation_status: 'approved',
    source: 'manual'
  },
  {
    title: "Connor McDavid Passes Up Open Net",
    description: "McDavid had an empty net from 10 feet, passed to teammate who was covered instead. His ATGS prop was -180.",
    sport: 'nhl',
    player_name: 'Connor McDavid',
    team: 'EDM',
    play_type: 'other',
    game_context: '3rd Period',
    betting_impact: 'prop',
    is_trending: true,
    is_featured: true,
    moderation_status: 'approved',
    source: 'twitter'
  },

  // MLB Sus Plays  
  {
    title: "Pitcher Throws Meatball on 0-2 Count",
    description: "Ace pitcher with 0-2 count throws a center-cut fastball that gets crushed for a 3-run HR. Team was -1.5 run line favorites.",
    sport: 'mlb',
    player_name: 'Various',
    team: 'N/A',
    play_type: 'other',
    game_context: 'High Leverage',
    betting_impact: 'spread',
    is_trending: false,
    is_featured: false,
    moderation_status: 'approved',
    source: 'manual'
  },
  {
    title: "Shohei Ohtani Goes 0-5 vs Triple-A Callup",
    description: "MVP caliber player goes 0-5 with 4 strikeouts against a pitcher making his MLB debut. His hits O/U was set at 1.5.",
    sport: 'mlb',
    player_name: 'Shohei Ohtani',
    team: 'LAD',
    play_type: 'other',
    game_context: 'Full Game',
    betting_impact: 'prop',
    is_trending: true,
    is_featured: true,
    moderation_status: 'approved',
    source: 'twitter'
  },

  // College Football
  {
    title: "Star QB Takes Knee at 5-Yard Line",
    description: "Up by 6 with 2 minutes left, QB takes a knee at the 5 instead of scoring. Team fails to cover -7 spread.",
    sport: 'ncaaf',
    player_name: 'Various',
    team: 'N/A',
    play_type: 'other',
    game_context: 'Final Minutes',
    betting_impact: 'spread',
    is_trending: false,
    is_featured: false,
    moderation_status: 'approved',
    source: 'manual'
  },

  // College Basketball
  {
    title: "Intentional Miss on Free Throws",
    description: "Player shoots FTs at his own basket in final seconds, clearly trying to miss. Team was -3.5 and won by 3.",
    sport: 'ncaab',
    player_name: 'Various',
    team: 'N/A',
    play_type: 'missed_shot',
    game_context: 'Final Seconds',
    betting_impact: 'spread',
    is_trending: true,
    is_featured: false,
    moderation_status: 'approved',
    source: 'twitter'
  }
]

async function seedSusPlays() {
  console.log('🚨 Seeding Sus Plays...')
  
  // First check if table exists
  const { data: tableCheck, error: tableError } = await supabase
    .from('sus_plays')
    .select('id')
    .limit(1)
  
  if (tableError) {
    console.error('❌ Table does not exist. Please run supabase/sus-plays-schema.sql first.')
    console.error('Error:', tableError.message)
    return
  }
  
  console.log('✅ Table exists, checking for existing data...')
  
  // Check for existing data
  const { count } = await supabase
    .from('sus_plays')
    .select('*', { count: 'exact', head: true })
  
  if (count && count > 0) {
    console.log(`⚠️ Table already has ${count} entries. Skipping seed to avoid duplicates.`)
    console.log('   To re-seed, first truncate the table in Supabase.')
    return
  }
  
  // Insert sus plays
  const { data, error } = await supabase
    .from('sus_plays')
    .insert(susPlays)
    .select()
  
  if (error) {
    console.error('❌ Failed to seed sus plays:', error.message)
    return
  }
  
  console.log(`✅ Successfully seeded ${data.length} sus plays!`)
  
  // Show what was added
  console.log('\n📋 Seeded Sus Plays:')
  data.forEach((play, i) => {
    console.log(`   ${i + 1}. ${play.title} (${play.sport.toUpperCase()})`)
  })
}

// Run the script
seedSusPlays()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Script error:', err)
    process.exit(1)
  })
