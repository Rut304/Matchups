// Mock data store for leaderboard - simulates database
// This will be replaced with actual Supabase queries

import { 
  Capper, 
  Pick, 
  CapperStats, 
  LeaderboardEntry, 
  CapperStatsBySport,
  CapperStatsByBetType,
  BetType,
  Sport,
  PickResult
} from '@/types/leaderboard'

// Re-export types for convenience
export type { LeaderboardEntry, Capper, Pick, CapperStats, BetType, Sport }

// ===========================================
// CAPPERS DATA
// ===========================================

export const cappers: Capper[] = [
  // CELEBRITIES - ESPN
  { id: '1', slug: 'stephen-a-smith', name: 'Stephen A. Smith', avatarEmoji: '📺', verified: true, capperType: 'celebrity', network: 'ESPN', role: 'First Take Host', followersCount: '6.2M', isActive: true, isFeatured: true, createdAt: '2024-01-01', updatedAt: '2025-01-03' },
  { id: '2', slug: 'shannon-sharpe', name: 'Shannon Sharpe', avatarEmoji: '🏈', verified: true, capperType: 'celebrity', network: 'ESPN', role: 'First Take', followersCount: '4.1M', isActive: true, isFeatured: true, createdAt: '2024-01-01', updatedAt: '2025-01-03' },
  { id: '3', slug: 'pat-mcafee', name: 'Pat McAfee', avatarEmoji: '🎙️', verified: true, capperType: 'celebrity', network: 'ESPN', role: 'Pat McAfee Show', followersCount: '5.8M', isActive: true, isFeatured: true, createdAt: '2024-01-01', updatedAt: '2025-01-03' },
  { id: '4', slug: 'mina-kimes', name: 'Mina Kimes', avatarEmoji: '🧠', verified: true, capperType: 'celebrity', network: 'ESPN', role: 'NFL Live', followersCount: '890K', isActive: true, isFeatured: false, createdAt: '2024-01-01', updatedAt: '2025-01-03' },
  { id: '5', slug: 'max-kellerman', name: 'Max Kellerman', avatarEmoji: '🥊', verified: true, capperType: 'celebrity', network: 'ESPN', role: 'This Just In', followersCount: '1.1M', isActive: true, isFeatured: false, createdAt: '2024-01-01', updatedAt: '2025-01-03' },
  { id: '6', slug: 'peyton-manning', name: 'Peyton Manning', avatarEmoji: '🏈', verified: true, capperType: 'celebrity', network: 'ESPN', role: 'ManningCast', followersCount: '3.8M', isActive: true, isFeatured: true, createdAt: '2024-01-01', updatedAt: '2025-01-03' },
  { id: '7', slug: 'ryan-clark', name: 'Ryan Clark', avatarEmoji: '🔰', verified: true, capperType: 'celebrity', network: 'ESPN', role: 'Get Up', followersCount: '980K', isActive: true, isFeatured: false, createdAt: '2024-01-01', updatedAt: '2025-01-03' },
  
  // CELEBRITIES - FOX/FS1
  { id: '8', slug: 'skip-bayless', name: 'Skip Bayless', avatarEmoji: '🎤', verified: true, capperType: 'celebrity', network: 'FS1', role: 'Undisputed', followersCount: '3.8M', isActive: true, isFeatured: true, createdAt: '2024-01-01', updatedAt: '2025-01-03' },
  { id: '9', slug: 'colin-cowherd', name: 'Colin Cowherd', avatarEmoji: '📻', verified: true, capperType: 'celebrity', network: 'FS1', role: 'The Herd', followersCount: '2.9M', isActive: true, isFeatured: false, createdAt: '2024-01-01', updatedAt: '2025-01-03' },
  { id: '10', slug: 'nick-wright', name: 'Nick Wright', avatarEmoji: '🔥', verified: true, capperType: 'celebrity', network: 'FS1', role: 'First Things First', followersCount: '1.2M', isActive: true, isFeatured: false, createdAt: '2024-01-01', updatedAt: '2025-01-03' },
  
  // CELEBRITIES - TNT
  { id: '11', slug: 'charles-barkley', name: 'Charles Barkley', avatarEmoji: '🏆', verified: true, capperType: 'celebrity', network: 'TNT', role: 'Inside the NBA', followersCount: '3.2M', isActive: true, isFeatured: true, createdAt: '2024-01-01', updatedAt: '2025-01-03' },
  { id: '12', slug: 'shaq', name: 'Shaq', avatarEmoji: '🎯', verified: true, capperType: 'celebrity', network: 'TNT', role: 'Inside the NBA', followersCount: '24.8M', isActive: true, isFeatured: true, createdAt: '2024-01-01', updatedAt: '2025-01-03' },
  { id: '13', slug: 'kenny-smith', name: 'Kenny Smith', avatarEmoji: '✈️', verified: true, capperType: 'celebrity', network: 'TNT', role: 'Inside the NBA', followersCount: '1.8M', isActive: true, isFeatured: false, createdAt: '2024-01-01', updatedAt: '2025-01-03' },
  
  // CELEBRITIES - CBS/NBC
  { id: '14', slug: 'tony-romo', name: 'Tony Romo', avatarEmoji: '🎯', verified: true, capperType: 'celebrity', network: 'CBS', role: 'NFL Analyst', followersCount: '2.1M', isActive: true, isFeatured: true, createdAt: '2024-01-01', updatedAt: '2025-01-03' },
  { id: '15', slug: 'michael-irvin', name: 'Michael Irvin', avatarEmoji: '⭐', verified: true, capperType: 'celebrity', network: 'NFL Network', role: 'NFL GameDay', followersCount: '1.4M', isActive: true, isFeatured: false, createdAt: '2024-01-01', updatedAt: '2025-01-03' },
  
  // CELEBRITIES - Podcast/Independent
  { id: '16', slug: 'bill-simmons', name: 'Bill Simmons', avatarEmoji: '🏀', verified: true, capperType: 'celebrity', network: 'Podcast', role: 'The Ringer', followersCount: '5.4M', isActive: true, isFeatured: true, createdAt: '2024-01-01', updatedAt: '2025-01-03' },
  { id: '17', slug: 'dan-le-batard', name: 'Dan Le Batard', avatarEmoji: '😎', verified: true, capperType: 'celebrity', network: 'Podcast', role: 'Le Batard Show', followersCount: '1.5M', isActive: true, isFeatured: false, createdAt: '2024-01-01', updatedAt: '2025-01-03' },
  
  // PRO SHARPS
  { id: '18', slug: 'haralabos-voulgaris', name: 'Haralabos Voulgaris', avatarEmoji: '📊', verified: true, capperType: 'pro', network: 'Independent', role: 'NBA Sharp', followersCount: '245K', isActive: true, isFeatured: true, createdAt: '2024-01-01', updatedAt: '2025-01-03' },
  { id: '19', slug: 'billy-walters', name: 'Billy Walters', avatarEmoji: '💰', verified: true, capperType: 'pro', network: 'Independent', role: 'Legendary Sharp', followersCount: '178K', isActive: true, isFeatured: true, createdAt: '2024-01-01', updatedAt: '2025-01-03' },
  { id: '20', slug: 'ras', name: 'RAS', avatarEmoji: '🎯', verified: true, capperType: 'pro', network: 'Action Network', role: 'Pro Bettor', followersCount: '89K', isActive: true, isFeatured: false, createdAt: '2024-01-01', updatedAt: '2025-01-03' },
  { id: '21', slug: 'steve-fezzik', name: 'Steve Fezzik', avatarEmoji: '🏆', verified: true, capperType: 'pro', network: 'Independent', role: 'Westgate Champ', followersCount: '67K', isActive: true, isFeatured: false, createdAt: '2024-01-01', updatedAt: '2025-01-03' },
  { id: '22', slug: 'warren-sharp', name: 'Warren Sharp', avatarEmoji: '📈', verified: true, capperType: 'pro', network: 'The Athletic', role: 'Analytics Expert', followersCount: '312K', isActive: true, isFeatured: true, createdAt: '2024-01-01', updatedAt: '2025-01-03' },
  
  // COMMUNITY CAPPERS
  { id: '23', slug: 'sharpshooter-mike', name: 'SharpShooter_Mike', avatarEmoji: '🎯', verified: true, capperType: 'community', isActive: true, isFeatured: false, createdAt: '2024-01-01', updatedAt: '2025-01-03' },
  { id: '24', slug: 'vegas-vince', name: 'VegasVince', avatarEmoji: '🎰', verified: true, capperType: 'community', isActive: true, isFeatured: false, createdAt: '2024-01-01', updatedAt: '2025-01-03' },
  { id: '25', slug: 'hoops-guru', name: 'HoopsGuru', avatarEmoji: '🏀', verified: false, capperType: 'community', isActive: true, isFeatured: false, createdAt: '2024-01-01', updatedAt: '2025-01-03' },
  { id: '26', slug: 'ice-cold-picks', name: 'IceColdPicks', avatarEmoji: '🏒', verified: true, capperType: 'community', isActive: true, isFeatured: false, createdAt: '2024-01-01', updatedAt: '2025-01-03' },
  { id: '27', slug: 'parlay-pete', name: 'ParlayPete', avatarEmoji: '🎲', verified: false, capperType: 'community', isActive: true, isFeatured: false, createdAt: '2024-01-01', updatedAt: '2025-01-03' },
  
  // ADDITIONAL CELEBRITIES - MORE NETWORKS
  { id: '28', slug: 'joe-buck', name: 'Joe Buck', avatarEmoji: '🎙️', verified: true, capperType: 'celebrity', network: 'ESPN', role: 'Monday Night Football', followersCount: '1.8M', isActive: true, isFeatured: false, createdAt: '2024-01-01', updatedAt: '2025-01-03' },
  { id: '29', slug: 'troy-aikman', name: 'Troy Aikman', avatarEmoji: '⭐', verified: true, capperType: 'celebrity', network: 'ESPN', role: 'MNF Analyst', followersCount: '1.2M', isActive: true, isFeatured: true, createdAt: '2024-01-01', updatedAt: '2025-01-03' },
  { id: '30', slug: 'kirk-herbstreit', name: 'Kirk Herbstreit', avatarEmoji: '🏈', verified: true, capperType: 'celebrity', network: 'ESPN', role: 'College GameDay', followersCount: '2.4M', isActive: true, isFeatured: true, createdAt: '2024-01-01', updatedAt: '2025-01-03' },
  { id: '31', slug: 'rex-ryan', name: 'Rex Ryan', avatarEmoji: '👟', verified: true, capperType: 'celebrity', network: 'ESPN', role: 'NFL Analyst', followersCount: '890K', isActive: true, isFeatured: false, createdAt: '2024-01-01', updatedAt: '2025-01-03' },
  { id: '32', slug: 'matt-hasselbeck', name: 'Matt Hasselbeck', avatarEmoji: '🏈', verified: true, capperType: 'celebrity', network: 'ESPN', role: 'NFL Live', followersCount: '456K', isActive: true, isFeatured: false, createdAt: '2024-01-01', updatedAt: '2025-01-03' },
  
  // FOX/FS1 ADDITIONS
  { id: '33', slug: 'joy-taylor', name: 'Joy Taylor', avatarEmoji: '💎', verified: true, capperType: 'celebrity', network: 'FS1', role: 'The Herd', followersCount: '567K', isActive: true, isFeatured: false, createdAt: '2024-01-01', updatedAt: '2025-01-03' },
  { id: '34', slug: 'emmanuel-acho', name: 'Emmanuel Acho', avatarEmoji: '🎯', verified: true, capperType: 'celebrity', network: 'FS1', role: 'Speak', followersCount: '1.1M', isActive: true, isFeatured: true, createdAt: '2024-01-01', updatedAt: '2025-01-03' },
  { id: '35', slug: 'kevin-wildes', name: 'Kevin Wildes', avatarEmoji: '📊', verified: true, capperType: 'celebrity', network: 'FS1', role: 'First Things First', followersCount: '234K', isActive: true, isFeatured: false, createdAt: '2024-01-01', updatedAt: '2025-01-03' },
  
  // NBA SPECIFIC
  { id: '36', slug: 'jj-redick', name: 'JJ Redick', avatarEmoji: '🏀', verified: true, capperType: 'celebrity', network: 'ESPN', role: 'NBA Analyst', followersCount: '2.1M', isActive: true, isFeatured: true, createdAt: '2024-01-01', updatedAt: '2025-01-03' },
  { id: '37', slug: 'richard-jefferson', name: 'Richard Jefferson', avatarEmoji: '😂', verified: true, capperType: 'celebrity', network: 'ESPN', role: 'NBA Countdown', followersCount: '1.3M', isActive: true, isFeatured: false, createdAt: '2024-01-01', updatedAt: '2025-01-03' },
  { id: '38', slug: 'perk', name: 'Kendrick Perkins', avatarEmoji: '🔥', verified: true, capperType: 'celebrity', network: 'ESPN', role: 'First Take', followersCount: '1.8M', isActive: true, isFeatured: true, createdAt: '2024-01-01', updatedAt: '2025-01-03' },
  { id: '39', slug: 'draymond-green', name: 'Draymond Green', avatarEmoji: '💚', verified: true, capperType: 'celebrity', network: 'TNT', role: 'Inside the NBA', followersCount: '4.2M', isActive: true, isFeatured: true, createdAt: '2024-01-01', updatedAt: '2025-01-03' },
  
  // PODCASTERS/YOUTUBE
  { id: '40', slug: 'pmt-big-cat', name: 'Big Cat (PMT)', avatarEmoji: '🐱', verified: true, capperType: 'celebrity', network: 'Podcast', role: 'Pardon My Take', followersCount: '3.5M', isActive: true, isFeatured: true, createdAt: '2024-01-01', updatedAt: '2025-01-03' },
  { id: '41', slug: 'pft-commenter', name: 'PFT Commenter', avatarEmoji: '🎭', verified: true, capperType: 'celebrity', network: 'Podcast', role: 'Pardon My Take', followersCount: '2.8M', isActive: true, isFeatured: false, createdAt: '2024-01-01', updatedAt: '2025-01-03' },
  { id: '42', slug: 'dave-portnoy', name: 'Dave Portnoy', avatarEmoji: '🍕', verified: true, capperType: 'celebrity', network: 'Barstool', role: 'Founder', followersCount: '4.8M', isActive: true, isFeatured: true, createdAt: '2024-01-01', updatedAt: '2025-01-03' },
  
  // MORE PRO SHARPS
  { id: '43', slug: 'cj-nitkowski', name: 'CJ Nitkowski', avatarEmoji: '⚾', verified: true, capperType: 'pro', network: 'Twitter', role: 'MLB Sharp', followersCount: '156K', isActive: true, isFeatured: false, createdAt: '2024-01-01', updatedAt: '2025-01-03' },
  { id: '44', slug: 'professional-bettor', name: 'Captain Jack', avatarEmoji: '🏴‍☠️', verified: true, capperType: 'pro', network: 'Independent', role: 'NFL Sharp', followersCount: '89K', isActive: true, isFeatured: true, createdAt: '2024-01-01', updatedAt: '2025-01-03' },
  { id: '45', slug: 'gadget-guru', name: 'Gadget', avatarEmoji: '🎮', verified: true, capperType: 'pro', network: 'Twitter', role: 'Props Sharp', followersCount: '234K', isActive: true, isFeatured: true, createdAt: '2024-01-01', updatedAt: '2025-01-03' },
  { id: '46', slug: 'el-tracker', name: 'ElTracker', avatarEmoji: '📈', verified: true, capperType: 'pro', network: 'Action Network', role: 'CLV Specialist', followersCount: '112K', isActive: true, isFeatured: true, createdAt: '2024-01-01', updatedAt: '2025-01-03' },
  { id: '47', slug: 'spanky', name: 'Spanky', avatarEmoji: '🎲', verified: true, capperType: 'pro', network: 'Covers', role: 'Multi-Sport Sharp', followersCount: '78K', isActive: true, isFeatured: false, createdAt: '2024-01-01', updatedAt: '2025-01-03' },
  
  // NHL SPECIFIC
  { id: '48', slug: 'ray-ferraro', name: 'Ray Ferraro', avatarEmoji: '🏒', verified: true, capperType: 'celebrity', network: 'TSN', role: 'NHL Analyst', followersCount: '245K', isActive: true, isFeatured: false, createdAt: '2024-01-01', updatedAt: '2025-01-03' },
  { id: '49', slug: 'button-craig', name: 'Craig Button', avatarEmoji: '🏒', verified: true, capperType: 'celebrity', network: 'TSN', role: 'NHL Scout', followersCount: '189K', isActive: true, isFeatured: false, createdAt: '2024-01-01', updatedAt: '2025-01-03' },
  
  // MLB SPECIFIC
  { id: '50', slug: 'david-ortiz', name: 'David Ortiz', avatarEmoji: '💪', verified: true, capperType: 'celebrity', network: 'FOX', role: 'MLB Analyst', followersCount: '2.8M', isActive: true, isFeatured: true, createdAt: '2024-01-01', updatedAt: '2025-01-03' },
  { id: '51', slug: 'arod', name: 'Alex Rodriguez', avatarEmoji: '⚾', verified: true, capperType: 'celebrity', network: 'ESPN', role: 'MLB Analyst', followersCount: '4.5M', isActive: true, isFeatured: true, createdAt: '2024-01-01', updatedAt: '2025-01-03' },
]

// ===========================================
// PICKS DATA - Comprehensive 2025/2026 focused with history
// ===========================================

// Helper to generate dates
const date = (daysAgo: number): string => {
  const d = new Date('2026-01-03')
  d.setDate(d.getDate() - daysAgo)
  return d.toISOString()
}

const generatePicks = (): Pick[] => {
  const picks: Pick[] = []
  let pickId = 1
  
  const addPicks = (capperId: string, picksData: Partial<Pick>[]) => {
    picksData.forEach(p => {
      picks.push({
        id: `pick-${pickId++}`,
        capperId,
        sport: p.sport as Sport,
        betType: p.betType as BetType,
        pickDescription: p.pickDescription || '',
        teamPicked: p.teamPicked,
        spreadLine: p.spreadLine,
        moneylineOdds: p.moneylineOdds,
        totalLine: p.totalLine,
        overUnder: p.overUnder,
        units: p.units || 1,
        pickedAt: p.pickedAt || new Date().toISOString(),
        gameDate: p.gameDate,
        oddsAtPick: p.oddsAtPick || -110,
        result: p.result as PickResult,
        isHidden: false,
      })
    })
  }
  
  // =============================================
  // STEPHEN A. SMITH - Cowboys/Knicks homer, mostly losing
  // =============================================
  addPicks('1', [
    // 2026
    { sport: 'NFL', betType: 'spread', pickDescription: 'Cowboys +7 (Wild Card)', teamPicked: 'DAL', spreadLine: 7, oddsAtPick: -110, result: 'loss', pickedAt: date(1), gameDate: date(1) },
    { sport: 'NBA', betType: 'spread', pickDescription: 'Knicks -3.5 vs Celtics', teamPicked: 'NYK', spreadLine: -3.5, oddsAtPick: -110, result: 'loss', pickedAt: date(2), gameDate: date(2) },
    // 2025 December
    { sport: 'NFL', betType: 'spread', pickDescription: 'Cowboys -3', teamPicked: 'DAL', spreadLine: -3, oddsAtPick: -110, result: 'loss', pickedAt: date(5), gameDate: date(5) },
    { sport: 'NBA', betType: 'moneyline', pickDescription: 'Knicks ML', teamPicked: 'NYK', moneylineOdds: -140, oddsAtPick: -140, result: 'win', pickedAt: date(7), gameDate: date(7) },
    { sport: 'NFL', betType: 'spread', pickDescription: 'Cowboys -7', teamPicked: 'DAL', spreadLine: -7, oddsAtPick: -110, result: 'loss', pickedAt: date(12), gameDate: date(12) },
    { sport: 'NBA', betType: 'spread', pickDescription: 'Knicks -5.5', teamPicked: 'NYK', spreadLine: -5.5, oddsAtPick: -110, result: 'loss', pickedAt: date(14), gameDate: date(14) },
    { sport: 'NFL', betType: 'moneyline', pickDescription: 'Cowboys ML', teamPicked: 'DAL', moneylineOdds: -180, oddsAtPick: -180, result: 'loss', pickedAt: date(19), gameDate: date(19) },
    { sport: 'NBA', betType: 'spread', pickDescription: 'Lakers -2', teamPicked: 'LAL', spreadLine: -2, oddsAtPick: -110, result: 'loss', pickedAt: date(21), gameDate: date(21) },
    // 2025 November
    { sport: 'NFL', betType: 'spread', pickDescription: 'Cowboys -4.5', teamPicked: 'DAL', spreadLine: -4.5, oddsAtPick: -110, result: 'loss', pickedAt: date(35), gameDate: date(35) },
    { sport: 'NBA', betType: 'spread', pickDescription: 'Knicks -6', teamPicked: 'NYK', spreadLine: -6, oddsAtPick: -110, result: 'win', pickedAt: date(40), gameDate: date(40) },
    { sport: 'NFL', betType: 'spread', pickDescription: 'Giants +10', teamPicked: 'NYG', spreadLine: 10, oddsAtPick: -110, result: 'loss', pickedAt: date(45), gameDate: date(45) },
    { sport: 'NBA', betType: 'moneyline', pickDescription: 'Lakers ML', teamPicked: 'LAL', moneylineOdds: +145, oddsAtPick: +145, result: 'loss', pickedAt: date(50), gameDate: date(50) },
  ])

  // =============================================
  // SKIP BAYLESS - Ultimate Cowboys homer, terrible
  // =============================================
  addPicks('8', [
    // 2026
    { sport: 'NFL', betType: 'spread', pickDescription: 'Cowboys ML (Wild Card)', teamPicked: 'DAL', moneylineOdds: +280, oddsAtPick: +280, result: 'loss', pickedAt: date(1), gameDate: date(1) },
    { sport: 'NFL', betType: 'spread', pickDescription: 'Cowboys +3', teamPicked: 'DAL', spreadLine: 3, oddsAtPick: -110, result: 'loss', pickedAt: date(2), gameDate: date(2) },
    // 2025 December
    { sport: 'NFL', betType: 'spread', pickDescription: 'Cowboys -7', teamPicked: 'DAL', spreadLine: -7, oddsAtPick: -110, result: 'loss', pickedAt: date(5), gameDate: date(5) },
    { sport: 'NFL', betType: 'spread', pickDescription: 'Cowboys -3.5', teamPicked: 'DAL', spreadLine: -3.5, oddsAtPick: -110, result: 'loss', pickedAt: date(12), gameDate: date(12) },
    { sport: 'NFL', betType: 'moneyline', pickDescription: 'Cowboys ML', teamPicked: 'DAL', moneylineOdds: -200, oddsAtPick: -200, result: 'loss', pickedAt: date(19), gameDate: date(19) },
    { sport: 'NFL', betType: 'spread', pickDescription: 'Cowboys -4', teamPicked: 'DAL', spreadLine: -4, oddsAtPick: -110, result: 'loss', pickedAt: date(26), gameDate: date(26) },
    // 2025 November/October
    { sport: 'NFL', betType: 'spread', pickDescription: 'Cowboys -6.5', teamPicked: 'DAL', spreadLine: -6.5, oddsAtPick: -110, result: 'loss', pickedAt: date(33), gameDate: date(33) },
    { sport: 'NFL', betType: 'spread', pickDescription: 'Cowboys -3', teamPicked: 'DAL', spreadLine: -3, oddsAtPick: -110, result: 'win', pickedAt: date(40), gameDate: date(40) },
    { sport: 'NFL', betType: 'spread', pickDescription: 'Cowboys -7.5', teamPicked: 'DAL', spreadLine: -7.5, oddsAtPick: -110, result: 'loss', pickedAt: date(47), gameDate: date(47) },
    { sport: 'NFL', betType: 'moneyline', pickDescription: 'Cowboys ML', teamPicked: 'DAL', moneylineOdds: -300, oddsAtPick: -300, result: 'loss', pickedAt: date(54), gameDate: date(54) },
  ])

  // =============================================
  // TONY ROMO - Actually good NFL analysis
  // =============================================
  addPicks('14', [
    // 2026
    { sport: 'NFL', betType: 'spread', pickDescription: 'Chiefs -3 (Wild Card)', teamPicked: 'KC', spreadLine: -3, oddsAtPick: -110, result: 'win', pickedAt: date(1), gameDate: date(1) },
    { sport: 'NFL', betType: 'spread', pickDescription: 'Bills -7', teamPicked: 'BUF', spreadLine: -7, oddsAtPick: -110, result: 'win', pickedAt: date(2), gameDate: date(2) },
    // 2025 December
    { sport: 'NFL', betType: 'spread', pickDescription: 'Eagles -5.5', teamPicked: 'PHI', spreadLine: -5.5, oddsAtPick: -110, result: 'win', pickedAt: date(5), gameDate: date(5) },
    { sport: 'NFL', betType: 'moneyline', pickDescription: 'Lions ML', teamPicked: 'DET', moneylineOdds: -180, oddsAtPick: -180, result: 'win', pickedAt: date(7), gameDate: date(7) },
    { sport: 'NFL', betType: 'spread', pickDescription: 'Ravens -4', teamPicked: 'BAL', spreadLine: -4, oddsAtPick: -110, result: 'win', pickedAt: date(12), gameDate: date(12) },
    { sport: 'NFL', betType: 'spread', pickDescription: '49ers +3.5', teamPicked: 'SF', spreadLine: 3.5, oddsAtPick: -110, result: 'loss', pickedAt: date(19), gameDate: date(19) },
    { sport: 'NFL', betType: 'spread', pickDescription: 'Bengals -2.5', teamPicked: 'CIN', spreadLine: -2.5, oddsAtPick: -110, result: 'win', pickedAt: date(26), gameDate: date(26) },
    // 2025 November
    { sport: 'NFL', betType: 'spread', pickDescription: 'Packers +4', teamPicked: 'GB', spreadLine: 4, oddsAtPick: -110, result: 'win', pickedAt: date(33), gameDate: date(33) },
    { sport: 'NFL', betType: 'moneyline', pickDescription: 'Texans ML', teamPicked: 'HOU', moneylineOdds: +125, oddsAtPick: +125, result: 'win', pickedAt: date(40), gameDate: date(40) },
    { sport: 'NFL', betType: 'spread', pickDescription: 'Broncos +7', teamPicked: 'DEN', spreadLine: 7, oddsAtPick: -110, result: 'win', pickedAt: date(47), gameDate: date(47) },
    { sport: 'NFL', betType: 'spread', pickDescription: 'Steelers -3', teamPicked: 'PIT', spreadLine: -3, oddsAtPick: -110, result: 'loss', pickedAt: date(54), gameDate: date(54) },
    { sport: 'NFL', betType: 'spread', pickDescription: 'Vikings +6.5', teamPicked: 'MIN', spreadLine: 6.5, oddsAtPick: -110, result: 'win', pickedAt: date(61), gameDate: date(61) },
  ])

  // =============================================
  // BILLY WALTERS - Sharp legend, excellent
  // =============================================
  addPicks('19', [
    // 2026
    { sport: 'NFL', betType: 'spread', pickDescription: 'Chargers +4 (Wild Card)', teamPicked: 'LAC', spreadLine: 4, oddsAtPick: -110, result: 'win', pickedAt: date(1), gameDate: date(1) },
    { sport: 'NBA', betType: 'spread', pickDescription: 'Thunder -5.5', teamPicked: 'OKC', spreadLine: -5.5, oddsAtPick: -110, result: 'win', pickedAt: date(2), gameDate: date(2) },
    // 2025 December
    { sport: 'NFL', betType: 'spread', pickDescription: 'Vikings +3', teamPicked: 'MIN', spreadLine: 3, oddsAtPick: -110, result: 'win', pickedAt: date(5), gameDate: date(5) },
    { sport: 'NBA', betType: 'spread', pickDescription: 'Celtics -4', teamPicked: 'BOS', spreadLine: -4, oddsAtPick: -110, result: 'win', pickedAt: date(7), gameDate: date(7) },
    { sport: 'NFL', betType: 'spread', pickDescription: 'Bengals +2.5', teamPicked: 'CIN', spreadLine: 2.5, oddsAtPick: -110, result: 'win', pickedAt: date(12), gameDate: date(12) },
    { sport: 'NBA', betType: 'spread', pickDescription: 'Cavaliers -6', teamPicked: 'CLE', spreadLine: -6, oddsAtPick: -110, result: 'win', pickedAt: date(14), gameDate: date(14) },
    { sport: 'NFL', betType: 'spread', pickDescription: 'Steelers +6.5', teamPicked: 'PIT', spreadLine: 6.5, oddsAtPick: -110, result: 'win', pickedAt: date(19), gameDate: date(19) },
    { sport: 'NBA', betType: 'spread', pickDescription: 'Nuggets +2', teamPicked: 'DEN', spreadLine: 2, oddsAtPick: -110, result: 'loss', pickedAt: date(21), gameDate: date(21) },
    { sport: 'NFL', betType: 'spread', pickDescription: 'Broncos +7', teamPicked: 'DEN', spreadLine: 7, oddsAtPick: -110, result: 'win', pickedAt: date(26), gameDate: date(26) },
    // 2025 November
    { sport: 'NBA', betType: 'spread', pickDescription: 'Heat +4.5', teamPicked: 'MIA', spreadLine: 4.5, oddsAtPick: -110, result: 'win', pickedAt: date(35), gameDate: date(35) },
    { sport: 'NFL', betType: 'spread', pickDescription: 'Raiders +10', teamPicked: 'LV', spreadLine: 10, oddsAtPick: -110, result: 'push', pickedAt: date(40), gameDate: date(40) },
    { sport: 'NBA', betType: 'moneyline', pickDescription: 'Pacers ML', teamPicked: 'IND', moneylineOdds: +135, oddsAtPick: +135, result: 'win', pickedAt: date(45), gameDate: date(45) },
  ])

  // =============================================
  // CHARLES BARKLEY - Bad NBA picks, Suns homer
  // =============================================
  addPicks('11', [
    // 2026
    { sport: 'NBA', betType: 'spread', pickDescription: 'Suns -3 vs Lakers', teamPicked: 'PHX', spreadLine: -3, oddsAtPick: -110, result: 'loss', pickedAt: date(1), gameDate: date(1) },
    { sport: 'NBA', betType: 'moneyline', pickDescription: 'Warriors ML', teamPicked: 'GSW', moneylineOdds: +160, oddsAtPick: +160, result: 'loss', pickedAt: date(2), gameDate: date(2) },
    // 2025 December
    { sport: 'NBA', betType: 'spread', pickDescription: 'Suns -4.5', teamPicked: 'PHX', spreadLine: -4.5, oddsAtPick: -110, result: 'loss', pickedAt: date(5), gameDate: date(5) },
    { sport: 'NBA', betType: 'spread', pickDescription: 'Lakers -2', teamPicked: 'LAL', spreadLine: -2, oddsAtPick: -110, result: 'loss', pickedAt: date(8), gameDate: date(8) },
    { sport: 'NBA', betType: 'spread', pickDescription: 'Nuggets -5', teamPicked: 'DEN', spreadLine: -5, oddsAtPick: -110, result: 'win', pickedAt: date(12), gameDate: date(12) },
    { sport: 'NBA', betType: 'moneyline', pickDescription: 'Suns ML', teamPicked: 'PHX', moneylineOdds: -150, oddsAtPick: -150, result: 'loss', pickedAt: date(18), gameDate: date(18) },
    { sport: 'NBA', betType: 'spread', pickDescription: 'Warriors -3', teamPicked: 'GSW', spreadLine: -3, oddsAtPick: -110, result: 'loss', pickedAt: date(22), gameDate: date(22) },
    { sport: 'NBA', betType: 'spread', pickDescription: 'Kings +2.5', teamPicked: 'SAC', spreadLine: 2.5, oddsAtPick: -110, result: 'win', pickedAt: date(28), gameDate: date(28) },
    // 2025 November
    { sport: 'NBA', betType: 'spread', pickDescription: 'Suns -6', teamPicked: 'PHX', spreadLine: -6, oddsAtPick: -110, result: 'loss', pickedAt: date(35), gameDate: date(35) },
    { sport: 'NBA', betType: 'spread', pickDescription: 'Clippers +4', teamPicked: 'LAC', spreadLine: 4, oddsAtPick: -110, result: 'loss', pickedAt: date(42), gameDate: date(42) },
  ])

  // =============================================
  // SHANNON SHARPE - NFL/NBA mix, decent
  // =============================================
  addPicks('2', [
    // 2026
    { sport: 'NFL', betType: 'spread', pickDescription: 'Chiefs -3.5', teamPicked: 'KC', spreadLine: -3.5, oddsAtPick: -110, result: 'win', pickedAt: date(1), gameDate: date(1) },
    { sport: 'NBA', betType: 'spread', pickDescription: 'Lakers -2', teamPicked: 'LAL', spreadLine: -2, oddsAtPick: -110, result: 'loss', pickedAt: date(2), gameDate: date(2) },
    // 2025 December
    { sport: 'NFL', betType: 'spread', pickDescription: 'Ravens -6', teamPicked: 'BAL', spreadLine: -6, oddsAtPick: -110, result: 'win', pickedAt: date(5), gameDate: date(5) },
    { sport: 'NBA', betType: 'moneyline', pickDescription: 'Nuggets ML', teamPicked: 'DEN', moneylineOdds: -140, oddsAtPick: -140, result: 'win', pickedAt: date(8), gameDate: date(8) },
    { sport: 'NFL', betType: 'spread', pickDescription: 'Broncos +3', teamPicked: 'DEN', spreadLine: 3, oddsAtPick: -110, result: 'win', pickedAt: date(12), gameDate: date(12) },
    { sport: 'NBA', betType: 'spread', pickDescription: 'Lakers +4.5', teamPicked: 'LAL', spreadLine: 4.5, oddsAtPick: -110, result: 'loss', pickedAt: date(15), gameDate: date(15) },
    { sport: 'NFL', betType: 'spread', pickDescription: 'Titans +7.5', teamPicked: 'TEN', spreadLine: 7.5, oddsAtPick: -110, result: 'loss', pickedAt: date(19), gameDate: date(19) },
    { sport: 'NBA', betType: 'spread', pickDescription: 'Heat -3', teamPicked: 'MIA', spreadLine: -3, oddsAtPick: -110, result: 'win', pickedAt: date(22), gameDate: date(22) },
  ])

  // =============================================
  // PAT MCAFEE - NFL focus, entertaining picks
  // =============================================
  addPicks('3', [
    // 2026
    { sport: 'NFL', betType: 'spread', pickDescription: 'Colts +6 (Wild Card)', teamPicked: 'IND', spreadLine: 6, oddsAtPick: -110, result: 'win', pickedAt: date(1), gameDate: date(1) },
    { sport: 'NFL', betType: 'over_under', pickDescription: 'Over 48.5 Chiefs/Texans', totalLine: 48.5, overUnder: 'over', oddsAtPick: -110, result: 'win', pickedAt: date(2), gameDate: date(2) },
    // 2025 December
    { sport: 'NFL', betType: 'spread', pickDescription: 'Packers +3.5', teamPicked: 'GB', spreadLine: 3.5, oddsAtPick: -110, result: 'win', pickedAt: date(5), gameDate: date(5) },
    { sport: 'NFL', betType: 'spread', pickDescription: 'Bears +10', teamPicked: 'CHI', spreadLine: 10, oddsAtPick: -110, result: 'loss', pickedAt: date(12), gameDate: date(12) },
    { sport: 'NFL', betType: 'moneyline', pickDescription: 'Vikings ML', teamPicked: 'MIN', moneylineOdds: +120, oddsAtPick: +120, result: 'win', pickedAt: date(19), gameDate: date(19) },
    { sport: 'NFL', betType: 'spread', pickDescription: 'Lions -7', teamPicked: 'DET', spreadLine: -7, oddsAtPick: -110, result: 'win', pickedAt: date(26), gameDate: date(26) },
    // 2025 November
    { sport: 'NFL', betType: 'over_under', pickDescription: 'Under 44.5 Bears/Packers', totalLine: 44.5, overUnder: 'under', oddsAtPick: -110, result: 'win', pickedAt: date(35), gameDate: date(35) },
    { sport: 'NFL', betType: 'spread', pickDescription: 'Colts +4', teamPicked: 'IND', spreadLine: 4, oddsAtPick: -110, result: 'win', pickedAt: date(42), gameDate: date(42) },
  ])

  // =============================================
  // JJ REDICK - NBA expert, analytical
  // =============================================
  addPicks('36', [
    // 2026
    { sport: 'NBA', betType: 'spread', pickDescription: 'Celtics -4.5', teamPicked: 'BOS', spreadLine: -4.5, oddsAtPick: -110, result: 'win', pickedAt: date(1), gameDate: date(1) },
    { sport: 'NBA', betType: 'spread', pickDescription: 'Thunder -6', teamPicked: 'OKC', spreadLine: -6, oddsAtPick: -110, result: 'win', pickedAt: date(2), gameDate: date(2) },
    // 2025 December
    { sport: 'NBA', betType: 'spread', pickDescription: 'Cavaliers -5.5', teamPicked: 'CLE', spreadLine: -5.5, oddsAtPick: -110, result: 'win', pickedAt: date(4), gameDate: date(4) },
    { sport: 'NBA', betType: 'moneyline', pickDescription: 'Knicks ML', teamPicked: 'NYK', moneylineOdds: -130, oddsAtPick: -130, result: 'win', pickedAt: date(7), gameDate: date(7) },
    { sport: 'NBA', betType: 'spread', pickDescription: 'Nuggets +3', teamPicked: 'DEN', spreadLine: 3, oddsAtPick: -110, result: 'loss', pickedAt: date(12), gameDate: date(12) },
    { sport: 'NBA', betType: 'spread', pickDescription: 'Bucks -4', teamPicked: 'MIL', spreadLine: -4, oddsAtPick: -110, result: 'win', pickedAt: date(18), gameDate: date(18) },
    { sport: 'NBA', betType: 'spread', pickDescription: 'Timberwolves -2.5', teamPicked: 'MIN', spreadLine: -2.5, oddsAtPick: -110, result: 'win', pickedAt: date(22), gameDate: date(22) },
    { sport: 'NBA', betType: 'spread', pickDescription: 'Magic +6', teamPicked: 'ORL', spreadLine: 6, oddsAtPick: -110, result: 'win', pickedAt: date(28), gameDate: date(28) },
    // 2025 November
    { sport: 'NBA', betType: 'moneyline', pickDescription: 'Pacers ML', teamPicked: 'IND', moneylineOdds: +140, oddsAtPick: +140, result: 'win', pickedAt: date(35), gameDate: date(35) },
    { sport: 'NBA', betType: 'spread', pickDescription: 'Rockets +5', teamPicked: 'HOU', spreadLine: 5, oddsAtPick: -110, result: 'win', pickedAt: date(42), gameDate: date(42) },
  ])

  // =============================================
  // TROY AIKMAN - NFL analyst, good
  // =============================================
  addPicks('29', [
    // 2026
    { sport: 'NFL', betType: 'spread', pickDescription: 'Eagles -5 (Wild Card)', teamPicked: 'PHI', spreadLine: -5, oddsAtPick: -110, result: 'win', pickedAt: date(1), gameDate: date(1) },
    { sport: 'NFL', betType: 'spread', pickDescription: 'Lions -3.5', teamPicked: 'DET', spreadLine: -3.5, oddsAtPick: -110, result: 'win', pickedAt: date(2), gameDate: date(2) },
    // 2025 December
    { sport: 'NFL', betType: 'spread', pickDescription: 'Chiefs -4', teamPicked: 'KC', spreadLine: -4, oddsAtPick: -110, result: 'win', pickedAt: date(5), gameDate: date(5) },
    { sport: 'NFL', betType: 'spread', pickDescription: 'Bills -6.5', teamPicked: 'BUF', spreadLine: -6.5, oddsAtPick: -110, result: 'win', pickedAt: date(12), gameDate: date(12) },
    { sport: 'NFL', betType: 'spread', pickDescription: 'Ravens -3', teamPicked: 'BAL', spreadLine: -3, oddsAtPick: -110, result: 'win', pickedAt: date(19), gameDate: date(19) },
    { sport: 'NFL', betType: 'moneyline', pickDescription: 'Packers ML', teamPicked: 'GB', moneylineOdds: +130, oddsAtPick: +130, result: 'loss', pickedAt: date(26), gameDate: date(26) },
    // 2025 November
    { sport: 'NFL', betType: 'spread', pickDescription: '49ers +2.5', teamPicked: 'SF', spreadLine: 2.5, oddsAtPick: -110, result: 'win', pickedAt: date(35), gameDate: date(35) },
    { sport: 'NFL', betType: 'spread', pickDescription: 'Cowboys +7', teamPicked: 'DAL', spreadLine: 7, oddsAtPick: -110, result: 'loss', pickedAt: date(42), gameDate: date(42) },
  ])

  // =============================================
  // DRAYMOND GREEN - NBA insider, decent
  // =============================================
  addPicks('39', [
    // 2026
    { sport: 'NBA', betType: 'spread', pickDescription: 'Warriors +5', teamPicked: 'GSW', spreadLine: 5, oddsAtPick: -110, result: 'win', pickedAt: date(1), gameDate: date(1) },
    { sport: 'NBA', betType: 'spread', pickDescription: 'Celtics -3', teamPicked: 'BOS', spreadLine: -3, oddsAtPick: -110, result: 'win', pickedAt: date(2), gameDate: date(2) },
    // 2025 December
    { sport: 'NBA', betType: 'moneyline', pickDescription: 'Thunder ML', teamPicked: 'OKC', moneylineOdds: -160, oddsAtPick: -160, result: 'win', pickedAt: date(5), gameDate: date(5) },
    { sport: 'NBA', betType: 'spread', pickDescription: 'Warriors -2', teamPicked: 'GSW', spreadLine: -2, oddsAtPick: -110, result: 'loss', pickedAt: date(10), gameDate: date(10) },
    { sport: 'NBA', betType: 'spread', pickDescription: 'Cavaliers -4.5', teamPicked: 'CLE', spreadLine: -4.5, oddsAtPick: -110, result: 'win', pickedAt: date(18), gameDate: date(18) },
    { sport: 'NBA', betType: 'spread', pickDescription: 'Grizzlies +3', teamPicked: 'MEM', spreadLine: 3, oddsAtPick: -110, result: 'loss', pickedAt: date(25), gameDate: date(25) },
  ])

  // =============================================
  // CAPTAIN JACK - NFL Sharp
  // =============================================
  addPicks('44', [
    // 2026
    { sport: 'NFL', betType: 'spread', pickDescription: 'Chargers +3.5 (Wild Card)', teamPicked: 'LAC', spreadLine: 3.5, oddsAtPick: -110, result: 'win', pickedAt: date(1), gameDate: date(1) },
    { sport: 'NFL', betType: 'spread', pickDescription: 'Broncos +7', teamPicked: 'DEN', spreadLine: 7, oddsAtPick: -110, result: 'win', pickedAt: date(2), gameDate: date(2) },
    // 2025 December
    { sport: 'NFL', betType: 'spread', pickDescription: 'Vikings +3', teamPicked: 'MIN', spreadLine: 3, oddsAtPick: -110, result: 'win', pickedAt: date(5), gameDate: date(5) },
    { sport: 'NFL', betType: 'spread', pickDescription: 'Bengals +2.5', teamPicked: 'CIN', spreadLine: 2.5, oddsAtPick: -110, result: 'win', pickedAt: date(8), gameDate: date(8) },
    { sport: 'NFL', betType: 'spread', pickDescription: 'Steelers +6.5', teamPicked: 'PIT', spreadLine: 6.5, oddsAtPick: -110, result: 'win', pickedAt: date(12), gameDate: date(12) },
    { sport: 'NFL', betType: 'spread', pickDescription: 'Cardinals +10', teamPicked: 'ARI', spreadLine: 10, oddsAtPick: -110, result: 'loss', pickedAt: date(19), gameDate: date(19) },
    { sport: 'NFL', betType: 'spread', pickDescription: 'Colts +4', teamPicked: 'IND', spreadLine: 4, oddsAtPick: -110, result: 'win', pickedAt: date(26), gameDate: date(26) },
    // 2025 November
    { sport: 'NFL', betType: 'spread', pickDescription: 'Raiders +10.5', teamPicked: 'LV', spreadLine: 10.5, oddsAtPick: -110, result: 'win', pickedAt: date(35), gameDate: date(35) },
    { sport: 'NFL', betType: 'spread', pickDescription: 'Titans +8', teamPicked: 'TEN', spreadLine: 8, oddsAtPick: -110, result: 'push', pickedAt: date(42), gameDate: date(42) },
    { sport: 'NFL', betType: 'spread', pickDescription: 'Jaguars +6.5', teamPicked: 'JAX', spreadLine: 6.5, oddsAtPick: -110, result: 'win', pickedAt: date(49), gameDate: date(49) },
  ])

  // =============================================
  // DAVE PORTNOY - High volume, volatile
  // =============================================
  addPicks('42', [
    // 2026
    { sport: 'NFL', betType: 'spread', pickDescription: 'Eagles -6', teamPicked: 'PHI', spreadLine: -6, oddsAtPick: -110, result: 'loss', pickedAt: date(1), gameDate: date(1) },
    { sport: 'NBA', betType: 'spread', pickDescription: 'Celtics -8', teamPicked: 'BOS', spreadLine: -8, oddsAtPick: -110, result: 'loss', pickedAt: date(2), gameDate: date(2) },
    { sport: 'NFL', betType: 'moneyline', pickDescription: 'Patriots ML', teamPicked: 'NE', moneylineOdds: +350, oddsAtPick: +350, result: 'loss', pickedAt: date(3), gameDate: date(3) },
    // 2025 December
    { sport: 'NBA', betType: 'spread', pickDescription: 'Celtics -5.5', teamPicked: 'BOS', spreadLine: -5.5, oddsAtPick: -110, result: 'win', pickedAt: date(5), gameDate: date(5) },
    { sport: 'NFL', betType: 'spread', pickDescription: 'Patriots +14', teamPicked: 'NE', spreadLine: 14, oddsAtPick: -110, result: 'loss', pickedAt: date(8), gameDate: date(8) },
    { sport: 'NBA', betType: 'moneyline', pickDescription: 'Celtics ML', teamPicked: 'BOS', moneylineOdds: -200, oddsAtPick: -200, result: 'win', pickedAt: date(12), gameDate: date(12) },
    { sport: 'NFL', betType: 'spread', pickDescription: 'Eagles -3', teamPicked: 'PHI', spreadLine: -3, oddsAtPick: -110, result: 'loss', pickedAt: date(19), gameDate: date(19) },
    { sport: 'NBA', betType: 'spread', pickDescription: 'Knicks +2', teamPicked: 'NYK', spreadLine: 2, oddsAtPick: -110, result: 'loss', pickedAt: date(22), gameDate: date(22) },
  ])

  // =============================================
  // GADGET - Props sharp
  // =============================================
  addPicks('45', [
    // 2026
    { sport: 'NFL', betType: 'over_under', pickDescription: 'Travis Kelce O 65.5 rec yds', totalLine: 65.5, overUnder: 'over', oddsAtPick: -115, result: 'win', pickedAt: date(1), gameDate: date(1) },
    { sport: 'NBA', betType: 'over_under', pickDescription: 'SGA O 28.5 pts', totalLine: 28.5, overUnder: 'over', oddsAtPick: -110, result: 'win', pickedAt: date(2), gameDate: date(2) },
    // 2025 December
    { sport: 'NFL', betType: 'over_under', pickDescription: 'Lamar Jackson O 245.5 pass yds', totalLine: 245.5, overUnder: 'under', oddsAtPick: -110, result: 'win', pickedAt: date(5), gameDate: date(5) },
    { sport: 'NBA', betType: 'over_under', pickDescription: 'Jayson Tatum O 26.5 pts', totalLine: 26.5, overUnder: 'over', oddsAtPick: -115, result: 'win', pickedAt: date(8), gameDate: date(8) },
    { sport: 'NFL', betType: 'over_under', pickDescription: 'Josh Allen O 2.5 TDs', totalLine: 2.5, overUnder: 'under', oddsAtPick: +100, result: 'win', pickedAt: date(12), gameDate: date(12) },
    { sport: 'NBA', betType: 'over_under', pickDescription: 'LeBron O 7.5 assists', totalLine: 7.5, overUnder: 'over', oddsAtPick: -105, result: 'loss', pickedAt: date(18), gameDate: date(18) },
    { sport: 'NFL', betType: 'over_under', pickDescription: 'CeeDee Lamb O 85.5 rec yds', totalLine: 85.5, overUnder: 'under', oddsAtPick: -110, result: 'win', pickedAt: date(22), gameDate: date(22) },
  ])

  // =============================================
  // BIG CAT (PMT) - Entertainment picks
  // =============================================
  addPicks('40', [
    // 2026
    { sport: 'NFL', betType: 'spread', pickDescription: 'Bears +14 (Wild Card)', teamPicked: 'CHI', spreadLine: 14, oddsAtPick: -110, result: 'loss', pickedAt: date(1), gameDate: date(1) },
    { sport: 'NBA', betType: 'spread', pickDescription: 'Bulls +8', teamPicked: 'CHI', spreadLine: 8, oddsAtPick: -110, result: 'loss', pickedAt: date(2), gameDate: date(2) },
    // 2025 December
    { sport: 'NFL', betType: 'spread', pickDescription: 'Bears +7', teamPicked: 'CHI', spreadLine: 7, oddsAtPick: -110, result: 'loss', pickedAt: date(5), gameDate: date(5) },
    { sport: 'NFL', betType: 'moneyline', pickDescription: 'Packers ML', teamPicked: 'GB', moneylineOdds: -140, oddsAtPick: -140, result: 'win', pickedAt: date(12), gameDate: date(12) },
    { sport: 'NBA', betType: 'spread', pickDescription: 'Bulls +10', teamPicked: 'CHI', spreadLine: 10, oddsAtPick: -110, result: 'win', pickedAt: date(19), gameDate: date(19) },
    { sport: 'NFL', betType: 'spread', pickDescription: 'Lions -6.5', teamPicked: 'DET', spreadLine: -6.5, oddsAtPick: -110, result: 'win', pickedAt: date(26), gameDate: date(26) },
  ])

  // Add more sharps with 2025/2026 data
  // EL TRACKER - CLV specialist
  addPicks('46', [
    { sport: 'NFL', betType: 'spread', pickDescription: 'Commanders +5.5', teamPicked: 'WAS', spreadLine: 5.5, oddsAtPick: -110, result: 'win', pickedAt: date(1), gameDate: date(1) },
    { sport: 'NBA', betType: 'spread', pickDescription: 'Rockets +7', teamPicked: 'HOU', spreadLine: 7, oddsAtPick: -110, result: 'win', pickedAt: date(3), gameDate: date(3) },
    { sport: 'NFL', betType: 'spread', pickDescription: 'Panthers +13.5', teamPicked: 'CAR', spreadLine: 13.5, oddsAtPick: -110, result: 'win', pickedAt: date(7), gameDate: date(7) },
    { sport: 'NBA', betType: 'spread', pickDescription: 'Pistons +11', teamPicked: 'DET', spreadLine: 11, oddsAtPick: -110, result: 'win', pickedAt: date(12), gameDate: date(12) },
    { sport: 'NFL', betType: 'spread', pickDescription: 'Giants +9', teamPicked: 'NYG', spreadLine: 9, oddsAtPick: -110, result: 'loss', pickedAt: date(19), gameDate: date(19) },
    { sport: 'NBA', betType: 'spread', pickDescription: 'Hornets +12', teamPicked: 'CHA', spreadLine: 12, oddsAtPick: -110, result: 'win', pickedAt: date(26), gameDate: date(26) },
  ])

  return picks
}

export const picks: Pick[] = generatePicks()

// ===========================================
// COMPUTED STATS
// ===========================================

// Pre-computed stats for each capper
export const capperStats: Record<string, CapperStats> = {
  '1': { capperId: '1', totalPicks: 323, totalWins: 134, totalLosses: 189, totalPushes: 0, winPercentage: 41.5, totalUnitsWagered: 323, totalUnitsWon: -67.2, netUnits: -67.2, roiPercentage: -18.2, currentStreak: 'L4', overallRank: 15, rankChange: -3, picksThisWeek: 4, picksThisMonth: 18 },
  '2': { capperId: '2', totalPicks: 309, totalWins: 167, totalLosses: 142, totalPushes: 0, winPercentage: 54.0, totalUnitsWagered: 309, totalUnitsWon: 12.3, netUnits: 12.3, roiPercentage: 4.2, currentStreak: 'W2', overallRank: 8, rankChange: 2, picksThisWeek: 3, picksThisMonth: 15 },
  '3': { capperId: '3', totalPicks: 379, totalWins: 201, totalLosses: 178, totalPushes: 0, winPercentage: 53.0, totalUnitsWagered: 379, totalUnitsWon: 8.7, netUnits: 8.7, roiPercentage: 3.1, currentStreak: 'W1', overallRank: 9, rankChange: 1, picksThisWeek: 5, picksThisMonth: 22 },
  '4': { capperId: '4', totalPicks: 345, totalWins: 189, totalLosses: 156, totalPushes: 0, winPercentage: 54.8, totalUnitsWagered: 345, totalUnitsWon: 22.4, netUnits: 22.4, roiPercentage: 7.5, currentStreak: 'W1', overallRank: 6, rankChange: 2, picksThisWeek: 4, picksThisMonth: 19 },
  '5': { capperId: '5', totalPicks: 257, totalWins: 112, totalLosses: 145, totalPushes: 0, winPercentage: 43.6, totalUnitsWagered: 257, totalUnitsWon: -41.2, netUnits: -41.2, roiPercentage: -16.8, currentStreak: 'L6', overallRank: 14, rankChange: -8, picksThisWeek: 3, picksThisMonth: 14 },
  '6': { capperId: '6', totalPicks: 301, totalWins: 167, totalLosses: 134, totalPushes: 0, winPercentage: 55.5, totalUnitsWagered: 301, totalUnitsWon: 28.9, netUnits: 28.9, roiPercentage: 11.2, currentStreak: 'W5', overallRank: 4, rankChange: 3, picksThisWeek: 2, picksThisMonth: 10 },
  '7': { capperId: '7', totalPicks: 246, totalWins: 134, totalLosses: 112, totalPushes: 0, winPercentage: 54.5, totalUnitsWagered: 246, totalUnitsWon: 18.9, netUnits: 18.9, roiPercentage: 8.1, currentStreak: 'W4', overallRank: 7, rankChange: 5, picksThisWeek: 3, picksThisMonth: 12 },
  '8': { capperId: '8', totalPicks: 254, totalWins: 98, totalLosses: 156, totalPushes: 0, winPercentage: 38.6, totalUnitsWagered: 254, totalUnitsWon: -89.4, netUnits: -89.4, roiPercentage: -24.1, currentStreak: 'L7', overallRank: 17, rankChange: -5, picksThisWeek: 4, picksThisMonth: 18 },
  '9': { capperId: '9', totalPicks: 246, totalWins: 112, totalLosses: 134, totalPushes: 0, winPercentage: 45.5, totalUnitsWagered: 246, totalUnitsWon: -34.2, netUnits: -34.2, roiPercentage: -11.8, currentStreak: 'L2', overallRank: 13, rankChange: -2, picksThisWeek: 3, picksThisMonth: 14 },
  '10': { capperId: '10', totalPicks: 201, totalWins: 89, totalLosses: 112, totalPushes: 0, winPercentage: 44.3, totalUnitsWagered: 201, totalUnitsWon: -28.7, netUnits: -28.7, roiPercentage: -13.4, currentStreak: 'L3', overallRank: 12, rankChange: -1, picksThisWeek: 2, picksThisMonth: 11 },
  '11': { capperId: '11', totalPicks: 156, totalWins: 67, totalLosses: 89, totalPushes: 0, winPercentage: 42.9, totalUnitsWagered: 156, totalUnitsWon: -31.2, netUnits: -31.2, roiPercentage: -15.6, currentStreak: 'L5', overallRank: 16, rankChange: -4, picksThisWeek: 3, picksThisMonth: 14 },
  '12': { capperId: '12', totalPicks: 156, totalWins: 71, totalLosses: 85, totalPushes: 0, winPercentage: 45.5, totalUnitsWagered: 156, totalUnitsWon: -19.8, netUnits: -19.8, roiPercentage: -8.9, currentStreak: 'L2', overallRank: 11, rankChange: -1, picksThisWeek: 2, picksThisMonth: 10 },
  '13': { capperId: '13', totalPicks: 170, totalWins: 92, totalLosses: 78, totalPushes: 0, winPercentage: 54.1, totalUnitsWagered: 170, totalUnitsWon: 11.4, netUnits: 11.4, roiPercentage: 6.2, currentStreak: 'W2', overallRank: 10, rankChange: 2, picksThisWeek: 2, picksThisMonth: 9 },
  '14': { capperId: '14', totalPicks: 279, totalWins: 156, totalLosses: 123, totalPushes: 0, winPercentage: 55.9, totalUnitsWagered: 279, totalUnitsWon: 24.6, netUnits: 24.6, roiPercentage: 9.4, currentStreak: 'W3', overallRank: 5, rankChange: 6, picksThisWeek: 2, picksThisMonth: 10 },
  '15': { capperId: '15', totalPicks: 199, totalWins: 87, totalLosses: 112, totalPushes: 0, winPercentage: 43.7, totalUnitsWagered: 199, totalUnitsWon: -32.8, netUnits: -32.8, roiPercentage: -14.2, currentStreak: 'L3', overallRank: 18, rankChange: -2, picksThisWeek: 2, picksThisMonth: 10 },
  '16': { capperId: '16', totalPicks: 334, totalWins: 178, totalLosses: 156, totalPushes: 0, winPercentage: 53.3, totalUnitsWagered: 334, totalUnitsWon: 15.6, netUnits: 15.6, roiPercentage: 5.8, currentStreak: 'W3', overallRank: 7, rankChange: 4, picksThisWeek: 4, picksThisMonth: 20 },
  '17': { capperId: '17', totalPicks: 312, totalWins: 145, totalLosses: 167, totalPushes: 0, winPercentage: 46.5, totalUnitsWagered: 312, totalUnitsWon: -18.9, netUnits: -18.9, roiPercentage: -7.2, currentStreak: 'L1', overallRank: 11, rankChange: 0, picksThisWeek: 3, picksThisMonth: 15 },
  // Sharps
  '18': { capperId: '18', totalPicks: 412, totalWins: 234, totalLosses: 178, totalPushes: 0, winPercentage: 56.8, totalUnitsWagered: 412, totalUnitsWon: 67.4, netUnits: 67.4, roiPercentage: 14.2, currentStreak: 'W4', overallRank: 2, rankChange: 0, picksThisWeek: 5, picksThisMonth: 24 },
  '19': { capperId: '19', totalPicks: 546, totalWins: 312, totalLosses: 234, totalPushes: 0, winPercentage: 57.1, totalUnitsWagered: 546, totalUnitsWon: 89.2, netUnits: 89.2, roiPercentage: 15.8, currentStreak: 'W2', overallRank: 1, rankChange: 1, picksThisWeek: 4, picksThisMonth: 18 },
  '20': { capperId: '20', totalPicks: 343, totalWins: 198, totalLosses: 145, totalPushes: 0, winPercentage: 57.7, totalUnitsWagered: 343, totalUnitsWon: 54.3, netUnits: 54.3, roiPercentage: 13.9, currentStreak: 'W6', overallRank: 3, rankChange: 3, picksThisWeek: 4, picksThisMonth: 19 },
  '21': { capperId: '21', totalPicks: 401, totalWins: 223, totalLosses: 178, totalPushes: 0, winPercentage: 55.6, totalUnitsWagered: 401, totalUnitsWon: 45.8, netUnits: 45.8, roiPercentage: 11.4, currentStreak: 'W3', overallRank: 4, rankChange: 2, picksThisWeek: 3, picksThisMonth: 16 },
  '22': { capperId: '22', totalPicks: 379, totalWins: 212, totalLosses: 167, totalPushes: 0, winPercentage: 55.9, totalUnitsWagered: 379, totalUnitsWon: 42.1, netUnits: 42.1, roiPercentage: 11.2, currentStreak: 'W4', overallRank: 5, rankChange: 4, picksThisWeek: 4, picksThisMonth: 18 },
  // Community
  '23': { capperId: '23', totalPicks: 254, totalWins: 156, totalLosses: 98, totalPushes: 0, winPercentage: 61.4, totalUnitsWagered: 254, totalUnitsWon: 42.3, netUnits: 42.3, roiPercentage: 16.7, currentStreak: 'W5', overallRank: 1, rankChange: 0, picksThisWeek: 4, picksThisMonth: 18 },
  '24': { capperId: '24', totalPicks: 141, totalWins: 89, totalLosses: 52, totalPushes: 0, winPercentage: 63.1, totalUnitsWagered: 141, totalUnitsWon: 38.7, netUnits: 38.7, roiPercentage: 18.2, currentStreak: 'W3', overallRank: 2, rankChange: 1, picksThisWeek: 3, picksThisMonth: 12 },
  '25': { capperId: '25', totalPicks: 211, totalWins: 124, totalLosses: 87, totalPushes: 0, winPercentage: 58.8, totalUnitsWagered: 211, totalUnitsWon: 28.4, netUnits: 28.4, roiPercentage: 12.4, currentStreak: 'L1', overallRank: 3, rankChange: -1, picksThisWeek: 4, picksThisMonth: 19 },
  '26': { capperId: '26', totalPicks: 112, totalWins: 67, totalLosses: 45, totalPushes: 0, winPercentage: 59.8, totalUnitsWagered: 112, totalUnitsWon: 22.1, netUnits: 22.1, roiPercentage: 14.8, currentStreak: 'W7', overallRank: 4, rankChange: 2, picksThisWeek: 3, picksThisMonth: 10 },
  '27': { capperId: '27', totalPicks: 62, totalWins: 34, totalLosses: 28, totalPushes: 0, winPercentage: 54.8, totalUnitsWagered: 62, totalUnitsWon: 14.2, netUnits: 14.2, roiPercentage: 22.4, currentStreak: 'W2', overallRank: 5, rankChange: 5, picksThisWeek: 2, picksThisMonth: 8 },
  // NEW CELEBRITIES - ESPN
  '28': { capperId: '28', totalPicks: 189, totalWins: 98, totalLosses: 91, totalPushes: 0, winPercentage: 51.9, totalUnitsWagered: 189, totalUnitsWon: 4.2, netUnits: 4.2, roiPercentage: 2.1, currentStreak: 'W1', overallRank: 10, rankChange: 1, picksThisWeek: 2, picksThisMonth: 10 },
  '29': { capperId: '29', totalPicks: 267, totalWins: 152, totalLosses: 115, totalPushes: 0, winPercentage: 56.9, totalUnitsWagered: 267, totalUnitsWon: 38.2, netUnits: 38.2, roiPercentage: 14.3, currentStreak: 'W3', overallRank: 4, rankChange: 2, picksThisWeek: 3, picksThisMonth: 14 },
  '30': { capperId: '30', totalPicks: 312, totalWins: 167, totalLosses: 145, totalPushes: 0, winPercentage: 53.5, totalUnitsWagered: 312, totalUnitsWon: 18.9, netUnits: 18.9, roiPercentage: 6.1, currentStreak: 'W2', overallRank: 7, rankChange: 3, picksThisWeek: 4, picksThisMonth: 18 },
  '31': { capperId: '31', totalPicks: 234, totalWins: 112, totalLosses: 122, totalPushes: 0, winPercentage: 47.9, totalUnitsWagered: 234, totalUnitsWon: -15.6, netUnits: -15.6, roiPercentage: -6.7, currentStreak: 'L2', overallRank: 11, rankChange: -2, picksThisWeek: 3, picksThisMonth: 13 },
  '32': { capperId: '32', totalPicks: 178, totalWins: 89, totalLosses: 89, totalPushes: 0, winPercentage: 50.0, totalUnitsWagered: 178, totalUnitsWon: -8.9, netUnits: -8.9, roiPercentage: -5.0, currentStreak: 'L1', overallRank: 12, rankChange: 0, picksThisWeek: 2, picksThisMonth: 9 },
  // FOX/FS1
  '33': { capperId: '33', totalPicks: 156, totalWins: 82, totalLosses: 74, totalPushes: 0, winPercentage: 52.6, totalUnitsWagered: 156, totalUnitsWon: 8.4, netUnits: 8.4, roiPercentage: 5.4, currentStreak: 'W4', overallRank: 8, rankChange: 4, picksThisWeek: 2, picksThisMonth: 8 },
  '34': { capperId: '34', totalPicks: 201, totalWins: 98, totalLosses: 103, totalPushes: 0, winPercentage: 48.8, totalUnitsWagered: 201, totalUnitsWon: -12.1, netUnits: -12.1, roiPercentage: -6.0, currentStreak: 'L3', overallRank: 13, rankChange: -3, picksThisWeek: 3, picksThisMonth: 12 },
  '35': { capperId: '35', totalPicks: 145, totalWins: 67, totalLosses: 78, totalPushes: 0, winPercentage: 46.2, totalUnitsWagered: 145, totalUnitsWon: -18.9, netUnits: -18.9, roiPercentage: -13.0, currentStreak: 'L5', overallRank: 16, rankChange: -4, picksThisWeek: 2, picksThisMonth: 7 },
  // NBA
  '36': { capperId: '36', totalPicks: 289, totalWins: 162, totalLosses: 127, totalPushes: 0, winPercentage: 56.1, totalUnitsWagered: 289, totalUnitsWon: 32.4, netUnits: 32.4, roiPercentage: 11.2, currentStreak: 'W5', overallRank: 5, rankChange: 3, picksThisWeek: 4, picksThisMonth: 20 },
  '37': { capperId: '37', totalPicks: 212, totalWins: 112, totalLosses: 100, totalPushes: 0, winPercentage: 52.8, totalUnitsWagered: 212, totalUnitsWon: 9.8, netUnits: 9.8, roiPercentage: 4.6, currentStreak: 'W2', overallRank: 9, rankChange: 1, picksThisWeek: 3, picksThisMonth: 14 },
  '38': { capperId: '38', totalPicks: 278, totalWins: 126, totalLosses: 152, totalPushes: 0, winPercentage: 45.3, totalUnitsWagered: 278, totalUnitsWon: -34.2, netUnits: -34.2, roiPercentage: -12.3, currentStreak: 'L4', overallRank: 15, rankChange: -5, picksThisWeek: 4, picksThisMonth: 18 },
  '39': { capperId: '39', totalPicks: 134, totalWins: 72, totalLosses: 62, totalPushes: 0, winPercentage: 53.7, totalUnitsWagered: 134, totalUnitsWon: 11.2, netUnits: 11.2, roiPercentage: 8.4, currentStreak: 'W3', overallRank: 8, rankChange: 2, picksThisWeek: 2, picksThisMonth: 9 },
  // PODCASTERS
  '40': { capperId: '40', totalPicks: 412, totalWins: 198, totalLosses: 214, totalPushes: 0, winPercentage: 48.1, totalUnitsWagered: 412, totalUnitsWon: -24.8, netUnits: -24.8, roiPercentage: -6.0, currentStreak: 'L2', overallRank: 14, rankChange: -1, picksThisWeek: 5, picksThisMonth: 24 },
  '41': { capperId: '41', totalPicks: 389, totalWins: 189, totalLosses: 200, totalPushes: 0, winPercentage: 48.6, totalUnitsWagered: 389, totalUnitsWon: -18.9, netUnits: -18.9, roiPercentage: -4.9, currentStreak: 'W1', overallRank: 13, rankChange: 0, picksThisWeek: 5, picksThisMonth: 22 },
  '42': { capperId: '42', totalPicks: 523, totalWins: 234, totalLosses: 289, totalPushes: 0, winPercentage: 44.7, totalUnitsWagered: 523, totalUnitsWon: -67.8, netUnits: -67.8, roiPercentage: -13.0, currentStreak: 'L6', overallRank: 18, rankChange: -4, picksThisWeek: 6, picksThisMonth: 28 },
  // MORE SHARPS
  '43': { capperId: '43', totalPicks: 345, totalWins: 198, totalLosses: 147, totalPushes: 0, winPercentage: 57.4, totalUnitsWagered: 345, totalUnitsWon: 52.3, netUnits: 52.3, roiPercentage: 15.2, currentStreak: 'W4', overallRank: 3, rankChange: 2, picksThisWeek: 4, picksThisMonth: 18 },
  '44': { capperId: '44', totalPicks: 456, totalWins: 262, totalLosses: 194, totalPushes: 0, winPercentage: 57.5, totalUnitsWagered: 456, totalUnitsWon: 72.4, netUnits: 72.4, roiPercentage: 15.9, currentStreak: 'W6', overallRank: 2, rankChange: 1, picksThisWeek: 5, picksThisMonth: 22 },
  '45': { capperId: '45', totalPicks: 567, totalWins: 312, totalLosses: 255, totalPushes: 0, winPercentage: 55.0, totalUnitsWagered: 567, totalUnitsWon: 48.9, netUnits: 48.9, roiPercentage: 8.6, currentStreak: 'W3', overallRank: 6, rankChange: 3, picksThisWeek: 7, picksThisMonth: 32 },
  '46': { capperId: '46', totalPicks: 389, totalWins: 224, totalLosses: 165, totalPushes: 0, winPercentage: 57.6, totalUnitsWagered: 389, totalUnitsWon: 62.1, netUnits: 62.1, roiPercentage: 16.0, currentStreak: 'W4', overallRank: 3, rankChange: 2, picksThisWeek: 4, picksThisMonth: 20 },
  '47': { capperId: '47', totalPicks: 298, totalWins: 164, totalLosses: 134, totalPushes: 0, winPercentage: 55.0, totalUnitsWagered: 298, totalUnitsWon: 29.8, netUnits: 29.8, roiPercentage: 10.0, currentStreak: 'W2', overallRank: 7, rankChange: 1, picksThisWeek: 3, picksThisMonth: 15 },
  // NHL
  '48': { capperId: '48', totalPicks: 234, totalWins: 128, totalLosses: 106, totalPushes: 0, winPercentage: 54.7, totalUnitsWagered: 234, totalUnitsWon: 21.4, netUnits: 21.4, roiPercentage: 9.1, currentStreak: 'W3', overallRank: 6, rankChange: 2, picksThisWeek: 3, picksThisMonth: 14 },
  '49': { capperId: '49', totalPicks: 189, totalWins: 98, totalLosses: 91, totalPushes: 0, winPercentage: 51.9, totalUnitsWagered: 189, totalUnitsWon: 6.8, netUnits: 6.8, roiPercentage: 3.6, currentStreak: 'W1', overallRank: 9, rankChange: 0, picksThisWeek: 2, picksThisMonth: 11 },
  // MLB
  '50': { capperId: '50', totalPicks: 312, totalWins: 167, totalLosses: 145, totalPushes: 0, winPercentage: 53.5, totalUnitsWagered: 312, totalUnitsWon: 18.7, netUnits: 18.7, roiPercentage: 6.0, currentStreak: 'W2', overallRank: 8, rankChange: 1, picksThisWeek: 3, picksThisMonth: 16 },
  '51': { capperId: '51', totalPicks: 345, totalWins: 162, totalLosses: 183, totalPushes: 0, winPercentage: 47.0, totalUnitsWagered: 345, totalUnitsWon: -28.4, netUnits: -28.4, roiPercentage: -8.2, currentStreak: 'L3', overallRank: 14, rankChange: -3, picksThisWeek: 4, picksThisMonth: 18 },
}

// Stats by sport for each capper
export const capperStatsBySport: Record<string, CapperStatsBySport[]> = {
  '1': [
    { capperId: '1', sport: 'NFL', totalPicks: 189, wins: 78, losses: 111, pushes: 0, winPercentage: 41.3, netUnits: -42.1, roiPercentage: -19.8 },
    { capperId: '1', sport: 'NBA', totalPicks: 134, wins: 56, losses: 78, pushes: 0, winPercentage: 41.8, netUnits: -25.1, roiPercentage: -16.2 },
  ],
  '8': [
    { capperId: '8', sport: 'NFL', totalPicks: 220, wins: 82, losses: 138, pushes: 0, winPercentage: 37.3, netUnits: -78.2, roiPercentage: -26.4 },
    { capperId: '8', sport: 'NBA', totalPicks: 34, wins: 16, losses: 18, pushes: 0, winPercentage: 47.1, netUnits: -11.2, roiPercentage: -12.8 },
  ],
  '14': [
    { capperId: '14', sport: 'NFL', totalPicks: 279, wins: 156, losses: 123, pushes: 0, winPercentage: 55.9, netUnits: 24.6, roiPercentage: 9.4 },
  ],
  '19': [
    { capperId: '19', sport: 'NFL', totalPicks: 312, wins: 178, losses: 134, pushes: 0, winPercentage: 57.1, netUnits: 52.3, roiPercentage: 14.8 },
    { capperId: '19', sport: 'NBA', totalPicks: 234, wins: 134, losses: 100, pushes: 0, winPercentage: 57.3, netUnits: 36.9, roiPercentage: 16.9 },
  ],
}

// Stats by bet type for each capper
export const capperStatsByBetType: Record<string, CapperStatsByBetType[]> = {
  '1': [
    { capperId: '1', betType: 'spread', totalPicks: 245, wins: 98, losses: 147, pushes: 0, winPercentage: 40.0, netUnits: -58.2, roiPercentage: -21.2 },
    { capperId: '1', betType: 'moneyline', totalPicks: 78, wins: 36, losses: 42, pushes: 0, winPercentage: 46.2, netUnits: -9.0, roiPercentage: -10.1 },
  ],
  '8': [
    { capperId: '8', betType: 'spread', totalPicks: 198, wins: 72, losses: 126, pushes: 0, winPercentage: 36.4, netUnits: -72.1, roiPercentage: -28.2 },
    { capperId: '8', betType: 'moneyline', totalPicks: 56, wins: 26, losses: 30, pushes: 0, winPercentage: 46.4, netUnits: -17.3, roiPercentage: -15.4 },
  ],
  '19': [
    { capperId: '19', betType: 'spread', totalPicks: 412, wins: 234, losses: 178, pushes: 0, winPercentage: 56.8, netUnits: 67.4, roiPercentage: 14.2 },
    { capperId: '19', betType: 'moneyline', totalPicks: 89, wins: 52, losses: 37, pushes: 0, winPercentage: 58.4, netUnits: 14.8, roiPercentage: 18.2 },
    { capperId: '19', betType: 'over_under', totalPicks: 45, wins: 26, losses: 19, pushes: 0, winPercentage: 57.8, netUnits: 7.0, roiPercentage: 16.1 },
  ],
}

// ===========================================
// HELPER FUNCTIONS
// ===========================================

// Year filter helper - returns start of given year
const getYearStart = (year: number): Date => new Date(`${year}-01-01T00:00:00Z`)
const getYearEnd = (year: number): Date => new Date(`${year + 1}-01-01T00:00:00Z`)

// Current season filter (defaults to 2025/2026 season)
export const CURRENT_SEASON_START = new Date('2025-05-01') // Start of 2025/2026 betting season
export const CURRENT_YEAR = 2025

// Filter picks by year
export function filterPicksByYear(picksToFilter: Pick[], year?: number | 'current' | 'all'): Pick[] {
  if (!year || year === 'all') return picksToFilter
  
  const targetYear = year === 'current' ? CURRENT_YEAR : year
  const yearStart = getYearStart(targetYear)
  const yearEnd = getYearEnd(targetYear)
  
  return picksToFilter.filter(p => {
    const pickDate = new Date(p.pickedAt)
    return pickDate >= yearStart && pickDate < yearEnd
  })
}

// Calculate stats from picks dynamically
export function calculateStatsFromPicks(picksToAnalyze: Pick[]): {
  wins: number
  losses: number
  pushes: number
  totalPicks: number
  winPercentage: number
  netUnits: number
  roiPercentage: number
} {
  const wins = picksToAnalyze.filter(p => p.result === 'win').length
  const losses = picksToAnalyze.filter(p => p.result === 'loss').length
  const pushes = picksToAnalyze.filter(p => p.result === 'push').length
  const totalPicks = wins + losses + pushes
  const decidedPicks = wins + losses
  
  // Calculate units (simplified: win = +1 unit at -110, loss = -1.1 units)
  const unitsWon = wins * 1.0
  const unitsLost = losses * 1.1
  const netUnits = unitsWon - unitsLost
  
  return {
    wins,
    losses,
    pushes,
    totalPicks,
    winPercentage: decidedPicks > 0 ? (wins / decidedPicks) * 100 : 0,
    netUnits: Math.round(netUnits * 10) / 10,
    roiPercentage: totalPicks > 0 ? (netUnits / totalPicks) * 100 : 0
  }
}

// Get stats for a capper filtered by year
export function getCapperYearStats(capperId: string, year?: number | 'current' | 'all'): {
  capperId: string
  year: number | 'all'
  wins: number
  losses: number
  pushes: number
  totalPicks: number
  winPercentage: number
  netUnits: number
  roiPercentage: number
  recentForm: string
  lastPick?: Pick
} {
  const capperPicks = picks.filter(p => p.capperId === capperId)
  const filteredPicks = filterPicksByYear(capperPicks, year)
  const stats = calculateStatsFromPicks(filteredPicks)
  
  // Calculate recent form (last 5 picks)
  const last5 = filteredPicks.slice(0, 5)
  const recentForm = last5.map(p => p.result === 'win' ? 'W' : p.result === 'loss' ? 'L' : 'P').join('')
  
  // Get last pick
  const lastPick = filteredPicks[0]
  
  return {
    capperId,
    year: year === 'current' ? CURRENT_YEAR : (year || 'all'),
    ...stats,
    recentForm,
    lastPick
  }
}

export function getLeaderboardEntries(filters?: {
  capperType?: string
  betType?: string
  sport?: string
  sortBy?: string
  year?: number | 'current' | 'all'
}): LeaderboardEntry[] {
  let filteredCappers = cappers.filter(c => c.isActive)
  
  // Filter by capper type
  if (filters?.capperType && filters.capperType !== 'all') {
    filteredCappers = filteredCappers.filter(c => c.capperType === filters.capperType)
  }
  
  // Get the year filter (default to current)
  const yearFilter = filters?.year ?? 'current'
  
  // Map to leaderboard entries
  const entries: LeaderboardEntry[] = filteredCappers.map(capper => {
    // Get year-filtered stats
    const yearStats = getCapperYearStats(capper.id, yearFilter)
    
    // Get historical stats for context
    const allTimeStats = capperStats[capper.id]
    
    return {
      id: capper.id,
      slug: capper.slug,
      name: capper.name,
      avatarEmoji: capper.avatarEmoji,
      avatarUrl: capper.avatarUrl,
      verified: capper.verified,
      capperType: capper.capperType,
      network: capper.network as any,
      role: capper.role,
      followersCount: capper.followersCount,
      // Use year-filtered stats
      record: `${yearStats.wins}-${yearStats.losses}`,
      winPct: yearStats.winPercentage,
      units: yearStats.netUnits,
      roi: yearStats.roiPercentage,
      streak: yearStats.recentForm || 'N/A',
      rank: 0, // Will be set after sorting
      rankChange: allTimeStats?.rankChange || 0,
      lastPick: yearStats.lastPick?.pickDescription,
      lastPickResult: yearStats.lastPick?.result as 'win' | 'loss' | 'push' | undefined,
      // Additional year context
      totalPicks: yearStats.totalPicks,
      yearFiltered: yearFilter !== 'all',
    }
  })
  
  // Only include cappers with picks in the filtered year
  const entriesWithPicks = entries.filter(e => (e.totalPicks ?? 0) > 0)
  
  // Sort
  const sortBy = filters?.sortBy || 'units'
  entriesWithPicks.sort((a, b) => {
    switch(sortBy) {
      case 'winPct': return b.winPct - a.winPct
      case 'roi': return b.roi - a.roi
      case 'picks': return (b.totalPicks ?? 0) - (a.totalPicks ?? 0)
      default: return b.units - a.units
    }
  })
  
  // Update ranks based on sort
  entriesWithPicks.forEach((e, i) => { e.rank = i + 1 })
  
  return entriesWithPicks
}

export function getCapperBySlug(slug: string): Capper | undefined {
  return cappers.find(c => c.slug === slug)
}

export function getCapperStats(capperId: string): CapperStats | undefined {
  return capperStats[capperId]
}

export function getCapperPicks(capperId: string, filters?: {
  sport?: string
  betType?: string
  result?: string
  limit?: number
  year?: number | 'current' | 'all'
}): Pick[] {
  let filtered = picks.filter(p => p.capperId === capperId)
  
  // Apply year filter (default to current)
  const yearFilter = filters?.year ?? 'current'
  filtered = filterPicksByYear(filtered, yearFilter)
  
  if (filters?.sport && filters.sport !== 'all') {
    filtered = filtered.filter(p => p.sport === filters.sport)
  }
  if (filters?.betType && filters.betType !== 'all') {
    filtered = filtered.filter(p => p.betType === filters.betType)
  }
  if (filters?.result && filters.result !== 'all') {
    filtered = filtered.filter(p => p.result === filters.result)
  }
  
  // Sort by date descending
  filtered.sort((a, b) => new Date(b.pickedAt).getTime() - new Date(a.pickedAt).getTime())
  
  if (filters?.limit) {
    filtered = filtered.slice(0, filters.limit)
  }
  
  return filtered
}

export function getCapperStatsBySport(capperId: string): CapperStatsBySport[] {
  return capperStatsBySport[capperId] || []
}

export function getCapperStatsByBetType(capperId: string): CapperStatsByBetType[] {
  return capperStatsByBetType[capperId] || []
}
