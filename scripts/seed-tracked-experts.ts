/**
 * Seed tracked_experts table with the experts we want to track
 * Run with: npx tsx scripts/seed-tracked-experts.ts
 */

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

// Real experts to track - TV personalities, podcasters, sharps
const trackedExperts = [
  // ESPN
  { slug: 'stephen-a-smith', name: 'Stephen A. Smith', x_handle: 'stephenasmith', network: 'ESPN', shows: ['First Take'], sports: ['NFL', 'NBA'], expert_type: 'tv', priority: 5 },
  { slug: 'shannon-sharpe', name: 'Shannon Sharpe', x_handle: 'ShannonSharpe', network: 'ESPN', shows: ['First Take'], sports: ['NFL', 'NBA'], expert_type: 'tv', priority: 5 },
  { slug: 'pat-mcafee', name: 'Pat McAfee', x_handle: 'PatMcAfeeShow', network: 'ESPN', shows: ['Pat McAfee Show'], sports: ['NFL', 'CFB'], expert_type: 'tv', priority: 5 },
  { slug: 'mina-kimes', name: 'Mina Kimes', x_handle: 'minakimes', network: 'ESPN', shows: ['NFL Live'], sports: ['NFL'], expert_type: 'tv', priority: 4 },
  { slug: 'max-kellerman', name: 'Max Kellerman', x_handle: 'maxkellerman', network: 'ESPN', shows: ['This Just In'], sports: ['NFL', 'NBA'], expert_type: 'tv', priority: 3 },
  { slug: 'kendrick-perkins', name: 'Kendrick Perkins', x_handle: 'KendrickPerkins', network: 'ESPN', shows: ['First Take', 'NBA Today'], sports: ['NBA'], expert_type: 'tv', priority: 4 },
  { slug: 'ryan-clark', name: 'Ryan Clark', x_handle: 'Realrclark25', network: 'ESPN', shows: ['Get Up'], sports: ['NFL'], expert_type: 'tv', priority: 3 },
  { slug: 'rex-ryan', name: 'Rex Ryan', x_handle: null, network: 'ESPN', shows: ['Get Up'], sports: ['NFL'], expert_type: 'tv', priority: 3 },
  { slug: 'kirk-herbstreit', name: 'Kirk Herbstreit', x_handle: 'KirkHerbstreit', network: 'ESPN', shows: ['College GameDay'], sports: ['CFB'], expert_type: 'tv', priority: 5 },
  { slug: 'desmond-howard', name: 'Desmond Howard', x_handle: 'DesmondHoward', network: 'ESPN', shows: ['College GameDay'], sports: ['CFB'], expert_type: 'tv', priority: 4 },
  { slug: 'jj-redick', name: 'JJ Redick', x_handle: 'jaborijr', network: 'ESPN', shows: ['NBA Countdown'], sports: ['NBA'], expert_type: 'tv', priority: 4 },
  
  // FOX/FS1
  { slug: 'skip-bayless', name: 'Skip Bayless', x_handle: 'RealSkipBayless', network: 'FS1', shows: ['Undisputed'], sports: ['NFL', 'NBA'], expert_type: 'tv', priority: 5 },
  { slug: 'colin-cowherd', name: 'Colin Cowherd', x_handle: 'ColinCowherd', network: 'FS1', shows: ['The Herd'], sports: ['NFL', 'NBA', 'CFB'], expert_type: 'tv', priority: 5 },
  { slug: 'nick-wright', name: 'Nick Wright', x_handle: 'gaborikjosh', network: 'FS1', shows: ['First Things First'], sports: ['NFL', 'NBA'], expert_type: 'tv', priority: 4 },
  { slug: 'emmanuel-acho', name: 'Emmanuel Acho', x_handle: 'EmmanuelAcho', network: 'FS1', shows: ['Speak'], sports: ['NFL'], expert_type: 'tv', priority: 4 },
  { slug: 'joy-taylor', name: 'Joy Taylor', x_handle: 'JoyTaylorTalks', network: 'FS1', shows: ['The Herd'], sports: ['NFL', 'NBA'], expert_type: 'tv', priority: 3 },
  { slug: 'craig-carton', name: 'Craig Carton', x_handle: 'craigcartonlive', network: 'FS1', shows: ['The Carton Show'], sports: ['NFL', 'NBA', 'MLB'], expert_type: 'tv', priority: 3 },
  
  // TNT
  { slug: 'charles-barkley', name: 'Charles Barkley', x_handle: null, network: 'TNT', shows: ['Inside the NBA'], sports: ['NBA'], expert_type: 'tv', priority: 5 },
  { slug: 'shaquille-oneal', name: 'Shaquille O\'Neal', x_handle: 'SHAQ', network: 'TNT', shows: ['Inside the NBA'], sports: ['NBA'], expert_type: 'tv', priority: 5 },
  { slug: 'kenny-smith', name: 'Kenny Smith', x_handle: 'TheJetOnTNT', network: 'TNT', shows: ['Inside the NBA'], sports: ['NBA'], expert_type: 'tv', priority: 4 },
  { slug: 'draymond-green', name: 'Draymond Green', x_handle: 'Money23Green', network: 'TNT', shows: ['Inside the NBA'], sports: ['NBA'], expert_type: 'tv', priority: 4 },
  
  // CBS
  { slug: 'tony-romo', name: 'Tony Romo', x_handle: null, network: 'CBS', shows: ['NFL on CBS'], sports: ['NFL'], expert_type: 'tv', priority: 5 },
  { slug: 'phil-simms', name: 'Phil Simms', x_handle: 'PhilSimmsQB', network: 'CBS', shows: ['NFL on CBS'], sports: ['NFL'], expert_type: 'tv', priority: 3 },
  { slug: 'boomer-esiason', name: 'Boomer Esiason', x_handle: '7BOOMERESIASON', network: 'CBS', shows: ['The NFL Today'], sports: ['NFL'], expert_type: 'tv', priority: 4 },
  
  // NBC
  { slug: 'chris-simms', name: 'Chris Simms', x_handle: 'CSimmsQB', network: 'NBC', shows: ['PFT Live'], sports: ['NFL'], expert_type: 'tv', priority: 4 },
  { slug: 'mike-florio', name: 'Mike Florio', x_handle: 'ProFootballTalk', network: 'NBC', shows: ['PFT Live'], sports: ['NFL'], expert_type: 'tv', priority: 4 },
  
  // Podcasters/Media
  { slug: 'bill-simmons', name: 'Bill Simmons', x_handle: 'BillSimmons', network: 'The Ringer', shows: ['The Bill Simmons Podcast'], sports: ['NFL', 'NBA'], expert_type: 'podcast', priority: 5 },
  { slug: 'dave-portnoy', name: 'Dave Portnoy', x_handle: 'stloospirtnoy', network: 'Barstool', shows: ['Barstool Pizza Reviews'], sports: ['NFL', 'NBA', 'MLB'], expert_type: 'podcast', priority: 5 },
  { slug: 'big-cat', name: 'Big Cat (Dan Katz)', x_handle: 'baaborstoolbigcat', network: 'Barstool', shows: ['Pardon My Take'], sports: ['NFL', 'NBA', 'CFB'], expert_type: 'podcast', priority: 5 },
  { slug: 'pft-commenter', name: 'PFT Commenter', x_handle: 'PFTCommenter', network: 'Barstool', shows: ['Pardon My Take'], sports: ['NFL', 'CFB'], expert_type: 'podcast', priority: 4 },
  { slug: 'dan-le-batard', name: 'Dan Le Batard', x_handle: 'LeBatardShow', network: 'Meadowlark', shows: ['The Dan Le Batard Show'], sports: ['NFL', 'NBA', 'MLB'], expert_type: 'podcast', priority: 4 },
  
  // Pro Sharps / Betting Industry
  { slug: 'warren-sharp', name: 'Warren Sharp', x_handle: 'SharpFootball', network: 'Sharp Football', shows: [], sports: ['NFL'], expert_type: 'sharp', priority: 5 },
  { slug: 'haralabos-voulgaris', name: 'Haralabos Voulgaris', x_handle: 'haaboralabob', network: 'Independent', shows: [], sports: ['NBA'], expert_type: 'sharp', priority: 5 },
  { slug: 'rufus-peabody', name: 'Rufus Peabody', x_handle: 'RufusPeabody', network: 'Independent', shows: [], sports: ['NFL', 'CFB', 'NBA', 'CBB'], expert_type: 'sharp', priority: 5 },
  { slug: 'chad-millman', name: 'Chad Millman', x_handle: 'ChadMillman', network: 'Action Network', shows: [], sports: ['NFL', 'NBA'], expert_type: 'writer', priority: 4 },
  { slug: 'darren-rovell', name: 'Darren Rovell', x_handle: 'darrenrovell', network: 'Action Network', shows: [], sports: ['NFL', 'NBA', 'MLB'], expert_type: 'writer', priority: 4 },
  { slug: 'todd-fuhrman', name: 'Todd Fuhrman', x_handle: 'ToddFuhrman', network: 'CBS Sports', shows: [], sports: ['NFL', 'NBA', 'CFB', 'CBB'], expert_type: 'sharp', priority: 4 },
  
  // ESPN Bet / Betting Shows
  { slug: 'stanford-steve', name: 'Stanford Steve', x_handle: 'StanfordSteve82', network: 'ESPN', shows: ['ESPN BET Live'], sports: ['CFB', 'NFL'], expert_type: 'tv', priority: 4 },
  { slug: 'joe-fortenbaugh', name: 'Joe Fortenbaugh', x_handle: 'JoeFortenbauagh', network: 'ESPN', shows: ['ESPN BET Live'], sports: ['NFL', 'CFB'], expert_type: 'tv', priority: 4 },
  { slug: 'jonathan-coachman', name: 'Jonathan Coachman', x_handle: 'TheCoach', network: 'ESPN', shows: ['ESPN BET Live'], sports: ['NFL', 'NBA'], expert_type: 'tv', priority: 3 },
  
  // College Sports
  { slug: 'paul-finebaum', name: 'Paul Finebaum', x_handle: 'Finebaum', network: 'ESPN', shows: ['The Paul Finebaum Show'], sports: ['CFB'], expert_type: 'tv', priority: 4 },
  { slug: 'lee-corso', name: 'Lee Corso', x_handle: null, network: 'ESPN', shows: ['College GameDay'], sports: ['CFB'], expert_type: 'tv', priority: 5 },
  { slug: 'rece-davis', name: 'Rece Davis', x_handle: 'ReceDavis', network: 'ESPN', shows: ['College GameDay'], sports: ['CFB', 'CBB'], expert_type: 'tv', priority: 4 },
  { slug: 'jay-bilas', name: 'Jay Bilas', x_handle: 'JayBilas', network: 'ESPN', shows: ['College GameDay'], sports: ['CBB'], expert_type: 'tv', priority: 5 },
  { slug: 'seth-greenberg', name: 'Seth Greenberg', x_handle: 'SethOnHoops', network: 'ESPN', shows: ['College Basketball'], sports: ['CBB'], expert_type: 'tv', priority: 4 },
  
  // Additional X/Twitter personalities
  { slug: 'rnr-picks', name: 'RNR Picks', x_handle: 'RNRPicks', network: 'Twitter', shows: [], sports: ['NFL', 'NBA', 'MLB'], expert_type: 'social', priority: 3 },
  { slug: 'sports-gambling-podcast', name: 'Sports Gambling Podcast', x_handle: 'GambsP', network: 'Podcast', shows: ['Sports Gambling Podcast'], sports: ['NFL', 'NBA', 'MLB', 'NHL'], expert_type: 'podcast', priority: 3 },
]

async function seedTrackedExperts() {
  console.log('🚀 Seeding tracked_experts table...\n')
  
  let success = 0
  let failed = 0
  
  for (const expert of trackedExperts) {
    const { error } = await supabase
      .from('tracked_experts')
      .upsert({
        ...expert,
        is_active: true,
      }, { onConflict: 'slug' })
    
    if (error) {
      console.error(`❌ Failed: ${expert.name} - ${error.message}`)
      failed++
    } else {
      console.log(`✅ ${expert.name} (@${expert.x_handle || 'no handle'})`)
      success++
    }
  }
  
  console.log(`\n📊 Results: ${success} succeeded, ${failed} failed`)
  
  // Verify count
  const { count } = await supabase
    .from('tracked_experts')
    .select('*', { count: 'exact', head: true })
  
  console.log(`\n🎯 Total tracked experts in database: ${count}`)
}

// Also initialize all-time stats records for each expert
async function initExpertStats() {
  console.log('\n📈 Initializing tracked_expert_stats records...\n')
  
  const { data: experts } = await supabase
    .from('tracked_experts')
    .select('slug')
  
  if (!experts) {
    console.log('No experts found')
    return
  }
  
  const today = new Date().toISOString().split('T')[0]
  
  for (const expert of experts) {
    const { error } = await supabase
      .from('tracked_expert_stats')
      .upsert({
        expert_slug: expert.slug,
        period_type: 'all_time',
        period_start: '2020-01-01',
        period_end: today,
        sport: null,
        bet_type: null,
        wins: 0,
        losses: 0,
        pushes: 0,
        total_picks: 0,
        win_pct: 0,
        units_won: 0,
        units_wagered: 0,
        roi: 0,
      }, { onConflict: 'expert_slug,period_type,period_start,sport,bet_type' })
    
    if (error && !error.message.includes('duplicate')) {
      console.error(`Stats init failed for ${expert.slug}: ${error.message}`)
    }
  }
  
  console.log(`✅ Initialized stats for ${experts.length} experts`)
}

async function main() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Missing Supabase credentials. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
    process.exit(1)
  }
  
  await seedTrackedExperts()
  await initExpertStats()
  
  console.log('\n✅ Done!')
}

main().catch(console.error)
