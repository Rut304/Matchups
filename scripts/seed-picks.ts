/**
 * Seed Picks for Cappers in Supabase
 * Run with: npx tsx scripts/seed-picks.ts
 */

import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables')
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Generate realistic picks for cappers
const sports = ['NFL', 'NBA', 'NHL', 'MLB'] as const
const betTypes = ['spread', 'moneyline', 'over_under', 'prop'] as const
const results = ['win', 'loss', 'push'] as const

// Real NFL teams for realistic pick descriptions
const nflTeams = ['Chiefs', 'Bills', 'Eagles', 'Lions', 'Ravens', '49ers', 'Cowboys', 'Dolphins', 'Packers', 'Texans']
const nbaTeams = ['Celtics', 'Thunder', 'Cavaliers', 'Knicks', 'Nuggets', 'Bucks', 'Heat', 'Warriors', 'Lakers', 'Suns']

function randomTeam(sport: string): string {
  return sport === 'NFL' ? nflTeams[Math.floor(Math.random() * nflTeams.length)] : 
         sport === 'NBA' ? nbaTeams[Math.floor(Math.random() * nbaTeams.length)] :
         'Team ' + Math.floor(Math.random() * 30)
}

function generatePickDescription(sport: string, betType: string): string {
  const team = randomTeam(sport)
  const spread = (Math.floor(Math.random() * 14) - 7) + 0.5
  const total = sport === 'NBA' ? 210 + Math.floor(Math.random() * 30) : 42 + Math.floor(Math.random() * 10)
  
  switch (betType) {
    case 'spread':
      return `${team} ${spread > 0 ? '+' : ''}${spread}`
    case 'moneyline':
      return `${team} ML`
    case 'over_under':
      return `${Math.random() > 0.5 ? 'Over' : 'Under'} ${total}`
    case 'prop':
      return `${team} 1H ${spread > 0 ? '+' : ''}${spread}`
    default:
      return `${team} ${spread}`
  }
}

// Win rate configs for different capper types (to make it realistic)
const winRateConfigs: Record<string, { baseRate: number, variance: number }> = {
  // Sharps have better records
  'haralabos-voulgaris': { baseRate: 0.58, variance: 0.08 },
  'billy-walters': { baseRate: 0.60, variance: 0.07 },
  'warren-sharp': { baseRate: 0.56, variance: 0.09 },
  'steve-fezzik': { baseRate: 0.57, variance: 0.08 },
  'captain-jack': { baseRate: 0.59, variance: 0.07 },
  'gadget': { baseRate: 0.58, variance: 0.08 },
  'el-tracker': { baseRate: 0.56, variance: 0.09 },
  
  // Celebrities have varying records (some good, some bad)
  'stephen-a-smith': { baseRate: 0.42, variance: 0.15 }, // Worse - famous for bad takes
  'charles-barkley': { baseRate: 0.38, variance: 0.12 }, // Much worse - "Guarantee" jinx
  'shannon-sharpe': { baseRate: 0.48, variance: 0.10 },
  'pat-mcafee': { baseRate: 0.51, variance: 0.10 },
  'skip-bayless': { baseRate: 0.44, variance: 0.12 },
  'shaq': { baseRate: 0.40, variance: 0.15 },
  'tony-romo': { baseRate: 0.54, variance: 0.08 }, // Better - actual knowledge
  'peyton-manning': { baseRate: 0.55, variance: 0.09 },
  'bill-simmons': { baseRate: 0.47, variance: 0.10 },
  
  // BARSTOOL - Fan favorites with varying records
  'dave-portnoy': { baseRate: 0.43, variance: 0.18 }, // Volatile - "One Bite" picks
  'big-cat': { baseRate: 0.46, variance: 0.15 }, // PMT host - decent but memes
  'stu-feiner': { baseRate: 0.52, variance: 0.10 }, // "Stu Gotz" - veteran
  'frank-the-tank': { baseRate: 0.39, variance: 0.20 }, // Wild swings
  'brandon-walker': { baseRate: 0.45, variance: 0.12 },
  
  // College analysts (good on their sports)
  'kirk-herbstreit': { baseRate: 0.55, variance: 0.08 },
  'lee-corso': { baseRate: 0.50, variance: 0.12 },
  'nick-saban': { baseRate: 0.58, variance: 0.07 },
  'jay-bilas': { baseRate: 0.54, variance: 0.09 },
  'dick-vitale': { baseRate: 0.48, variance: 0.12 },
  
  // Podcasters
  'jason-kelce': { baseRate: 0.52, variance: 0.10 },
  'travis-kelce': { baseRate: 0.51, variance: 0.11 },
  'ryen-russillo': { baseRate: 0.50, variance: 0.10 },
  
  // AI should be decent
  'matchups-ai': { baseRate: 0.54, variance: 0.06 },
  
  // Default
  'default': { baseRate: 0.48, variance: 0.10 }
}

function getResult(capperSlug: string): 'win' | 'loss' | 'push' {
  const config = winRateConfigs[capperSlug] || winRateConfigs['default']
  const winRate = config.baseRate + (Math.random() - 0.5) * config.variance
  const rand = Math.random()
  
  if (rand < 0.02) return 'push' // 2% push rate
  return rand < winRate ? 'win' : 'loss'
}

async function seedPicks() {
  console.log('Fetching cappers from database...')
  
  const { data: cappers, error: capperError } = await supabase
    .from('cappers')
    .select('id, slug, name, capper_type')
  
  if (capperError || !cappers?.length) {
    console.error('Error fetching cappers:', capperError)
    return
  }
  
  console.log(`Found ${cappers.length} cappers. Generating picks...`)
  
  // Generate picks for the last 6 months
  const now = new Date()
  const sixMonthsAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000)
  
  const allPicks: any[] = []
  
  for (const capper of cappers) {
    // Generate 50-200 picks per capper
    const numPicks = Math.floor(Math.random() * 150) + 50
    
    for (let i = 0; i < numPicks; i++) {
      const pickDate = new Date(
        sixMonthsAgo.getTime() + Math.random() * (now.getTime() - sixMonthsAgo.getTime())
      )
      
      const sport = sports[Math.floor(Math.random() * sports.length)]
      const betType = betTypes[Math.floor(Math.random() * betTypes.length)]
      const result = getResult(capper.slug)
      
      // Calculate units (wins get 1 unit, losses lose 1.1 units for juice)
      const units = result === 'win' ? 1.0 : result === 'loss' ? -1.1 : 0
      
      allPicks.push({
        capper_id: capper.id,
        sport,
        bet_type: betType,
        pick_description: generatePickDescription(sport, betType),
        units: 1.0,
        result,
        picked_at: pickDate.toISOString(),
        game_date: pickDate.toISOString().split('T')[0],
        source_type: 'manual',
        odds_at_pick: -110
      })
    }
  }
  
  console.log(`Generated ${allPicks.length} picks. Inserting into database...`)
  
  // Insert in batches of 500
  const batchSize = 500
  for (let i = 0; i < allPicks.length; i += batchSize) {
    const batch = allPicks.slice(i, i + batchSize)
    const { error } = await supabase.from('picks').insert(batch)
    
    if (error) {
      console.error(`Error inserting batch ${i / batchSize + 1}:`, error.message)
    } else {
      console.log(`✓ Inserted batch ${i / batchSize + 1} (${batch.length} picks)`)
    }
  }
  
  console.log('\n=== Pick Generation Complete ===')
  
  // Verify counts
  const { count } = await supabase
    .from('picks')
    .select('*', { count: 'exact', head: true })
  
  console.log(`Total picks in database: ${count}`)
  
  // Show sample stats
  const { data: stats } = await supabase
    .from('picks')
    .select('capper_id, result')
  
  if (stats) {
    const byResult = stats.reduce((acc, p) => {
      acc[p.result] = (acc[p.result] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    console.log('Results distribution:', byResult)
  }
}

async function main() {
  // Check if picks already exist
  const { count } = await supabase
    .from('picks')
    .select('*', { count: 'exact', head: true })
  
  if (count && count > 0) {
    console.log(`Database already has ${count} picks. Clearing old data...`)
    await supabase.from('picks').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    console.log('Cleared existing picks.')
  }
  
  await seedPicks()
}

main().catch(console.error)
