/**
 * Seed Supabase with initial capper data
 * Run with: npx ts-node scripts/seed-supabase.ts
 */

import { createClient } from '@supabase/supabase-js'

// Direct connection with service role key for seeding
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://cdfdmkntdsfylososgwo.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

// Sample cappers data - key personalities to seed
const seedCappers = [
  // ESPN
  { slug: 'stephen-a-smith', name: 'Stephen A. Smith', avatar_emoji: '📺', verified: true, capper_type: 'celebrity', network: 'ESPN', role: 'First Take Host', followers_count: '6.2M', is_active: true, is_featured: true },
  { slug: 'shannon-sharpe', name: 'Shannon Sharpe', avatar_emoji: '🏈', verified: true, capper_type: 'celebrity', network: 'ESPN', role: 'First Take', followers_count: '4.1M', is_active: true, is_featured: true },
  { slug: 'pat-mcafee', name: 'Pat McAfee', avatar_emoji: '🎙️', verified: true, capper_type: 'celebrity', network: 'ESPN', role: 'Pat McAfee Show', followers_count: '5.8M', is_active: true, is_featured: true },
  { slug: 'mina-kimes', name: 'Mina Kimes', avatar_emoji: '🧠', verified: true, capper_type: 'celebrity', network: 'ESPN', role: 'NFL Live', followers_count: '890K', is_active: true, is_featured: false },
  { slug: 'max-kellerman', name: 'Max Kellerman', avatar_emoji: '🥊', verified: true, capper_type: 'celebrity', network: 'ESPN', role: 'This Just In', followers_count: '1.1M', is_active: true, is_featured: false },
  { slug: 'peyton-manning', name: 'Peyton Manning', avatar_emoji: '🏈', verified: true, capper_type: 'celebrity', network: 'ESPN', role: 'ManningCast', followers_count: '3.8M', is_active: true, is_featured: true },
  
  // FOX/FS1
  { slug: 'skip-bayless', name: 'Skip Bayless', avatar_emoji: '🎤', verified: true, capper_type: 'celebrity', network: 'FS1', role: 'Undisputed', followers_count: '3.8M', is_active: true, is_featured: true },
  { slug: 'colin-cowherd', name: 'Colin Cowherd', avatar_emoji: '📻', verified: true, capper_type: 'celebrity', network: 'FS1', role: 'The Herd', followers_count: '2.9M', is_active: true, is_featured: false },
  { slug: 'nick-wright', name: 'Nick Wright', avatar_emoji: '🔥', verified: true, capper_type: 'celebrity', network: 'FS1', role: 'First Things First', followers_count: '1.2M', is_active: true, is_featured: false },
  
  // TNT
  { slug: 'charles-barkley', name: 'Charles Barkley', avatar_emoji: '🏆', verified: true, capper_type: 'celebrity', network: 'TNT', role: 'Inside the NBA', followers_count: '3.2M', is_active: true, is_featured: true },
  { slug: 'shaq', name: 'Shaq', avatar_emoji: '🎯', verified: true, capper_type: 'celebrity', network: 'TNT', role: 'Inside the NBA', followers_count: '24.8M', is_active: true, is_featured: true },
  
  // CBS
  { slug: 'tony-romo', name: 'Tony Romo', avatar_emoji: '🎯', verified: true, capper_type: 'celebrity', network: 'CBS', role: 'NFL Analyst', followers_count: '2.1M', is_active: true, is_featured: true },
  
  // Podcasters
  { slug: 'bill-simmons', name: 'Bill Simmons', avatar_emoji: '🏀', verified: true, capper_type: 'celebrity', network: 'Podcast', role: 'The Ringer', followers_count: '5.4M', is_active: true, is_featured: true },
  { slug: 'dave-portnoy', name: 'Dave Portnoy', avatar_emoji: '🍕', verified: true, capper_type: 'celebrity', network: 'Barstool', role: 'Founder', followers_count: '4.8M', is_active: true, is_featured: true },
  
  // Pro Sharps
  { slug: 'haralabos-voulgaris', name: 'Haralabos Voulgaris', avatar_emoji: '📊', verified: true, capper_type: 'pro', network: 'Independent', role: 'NBA Sharp', followers_count: '245K', is_active: true, is_featured: true },
  { slug: 'billy-walters', name: 'Billy Walters', avatar_emoji: '💰', verified: true, capper_type: 'pro', network: 'Independent', role: 'Legendary Sharp', followers_count: '178K', is_active: true, is_featured: true },
  { slug: 'warren-sharp', name: 'Warren Sharp', avatar_emoji: '📈', verified: true, capper_type: 'pro', network: 'The Athletic', role: 'Analytics Expert', followers_count: '312K', is_active: true, is_featured: true },
  
  // AI
  { slug: 'matchups-ai', name: 'Matchups AI', avatar_emoji: '🤖', verified: true, capper_type: 'ai', network: 'Website', role: 'AI Prediction Engine', followers_count: '∞', is_active: true, is_featured: true },
]

async function runSeed() {
  console.log('Seeding cappers...')
  
  for (const capper of seedCappers) {
    const { error } = await supabase
      .from('cappers')
      .upsert(capper, { onConflict: 'slug' })
    
    if (error) {
      console.error(`Error seeding ${capper.name}:`, error.message)
    } else {
      console.log(`✓ Seeded: ${capper.name}`)
    }
  }
  
  console.log('\nSeeding complete!')
}

async function main() {
  // Check if service role key is set
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('SUPABASE_SERVICE_ROLE_KEY not set. Please set it in .env.local')
    process.exit(1)
  }
  
  await runSeed()
  
  // Verify
  const { count } = await supabase
    .from('cappers')
    .select('*', { count: 'exact', head: true })
  
  console.log(`\nTotal cappers in database: ${count}`)
}

main().catch(console.error)
