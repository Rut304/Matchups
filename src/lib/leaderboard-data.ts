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
]

// ===========================================
// PICKS DATA (Sample - would be much larger in real DB)
// ===========================================

const generatePicks = (): Pick[] => {
  const picks: Pick[] = []
  
  // Stephen A. Smith picks - mostly bad NFL/NBA picks
  const stephenAPicks: Partial<Pick>[] = [
    { sport: 'NFL', betType: 'spread', pickDescription: 'Cowboys -7', teamPicked: 'DAL', spreadLine: -7, oddsAtPick: -110, result: 'loss', pickedAt: '2025-01-02T14:00:00Z', gameDate: '2025-01-02' },
    { sport: 'NFL', betType: 'spread', pickDescription: 'Cowboys -3.5', teamPicked: 'DAL', spreadLine: -3.5, oddsAtPick: -110, result: 'loss', pickedAt: '2024-12-29T12:00:00Z', gameDate: '2024-12-29' },
    { sport: 'NFL', betType: 'moneyline', pickDescription: 'Cowboys ML', teamPicked: 'DAL', moneylineOdds: -180, oddsAtPick: -180, result: 'loss', pickedAt: '2024-12-22T12:00:00Z', gameDate: '2024-12-22' },
    { sport: 'NBA', betType: 'spread', pickDescription: 'Knicks -4.5', teamPicked: 'NYK', spreadLine: -4.5, oddsAtPick: -110, result: 'loss', pickedAt: '2024-12-20T18:00:00Z', gameDate: '2024-12-20' },
    { sport: 'NFL', betType: 'spread', pickDescription: 'Giants +7', teamPicked: 'NYG', spreadLine: 7, oddsAtPick: -110, result: 'win', pickedAt: '2024-12-15T12:00:00Z', gameDate: '2024-12-15' },
    { sport: 'NBA', betType: 'moneyline', pickDescription: 'Lakers ML', teamPicked: 'LAL', moneylineOdds: +150, oddsAtPick: +150, result: 'loss', pickedAt: '2024-12-14T20:00:00Z', gameDate: '2024-12-14' },
  ]
  
  // Skip Bayless picks - Cowboys homer, very bad
  const skipPicks: Partial<Pick>[] = [
    { sport: 'NFL', betType: 'spread', pickDescription: 'Cowboys -10', teamPicked: 'DAL', spreadLine: -10, oddsAtPick: -110, result: 'loss', pickedAt: '2025-01-02T10:00:00Z', gameDate: '2025-01-02' },
    { sport: 'NFL', betType: 'moneyline', pickDescription: 'Cowboys ML', teamPicked: 'DAL', moneylineOdds: -250, oddsAtPick: -250, result: 'loss', pickedAt: '2024-12-29T10:00:00Z', gameDate: '2024-12-29' },
    { sport: 'NFL', betType: 'spread', pickDescription: 'Cowboys -6.5', teamPicked: 'DAL', spreadLine: -6.5, oddsAtPick: -110, result: 'loss', pickedAt: '2024-12-22T10:00:00Z', gameDate: '2024-12-22' },
    { sport: 'NFL', betType: 'spread', pickDescription: 'Cowboys -3', teamPicked: 'DAL', spreadLine: -3, oddsAtPick: -110, result: 'loss', pickedAt: '2024-12-15T10:00:00Z', gameDate: '2024-12-15' },
    { sport: 'NFL', betType: 'spread', pickDescription: 'Cowboys -7.5', teamPicked: 'DAL', spreadLine: -7.5, oddsAtPick: -110, result: 'loss', pickedAt: '2024-12-08T10:00:00Z', gameDate: '2024-12-08' },
    { sport: 'NFL', betType: 'spread', pickDescription: 'Cowboys -4', teamPicked: 'DAL', spreadLine: -4, oddsAtPick: -110, result: 'loss', pickedAt: '2024-12-01T10:00:00Z', gameDate: '2024-12-01' },
    { sport: 'NFL', betType: 'spread', pickDescription: 'Cowboys PK', teamPicked: 'DAL', spreadLine: 0, oddsAtPick: -110, result: 'loss', pickedAt: '2024-11-24T10:00:00Z', gameDate: '2024-11-24' },
  ]
  
  // Tony Romo picks - Actually good, especially NFL
  const romoPicks: Partial<Pick>[] = [
    { sport: 'NFL', betType: 'spread', pickDescription: 'Chiefs -2.5', teamPicked: 'KC', spreadLine: -2.5, oddsAtPick: -110, result: 'win', pickedAt: '2025-01-02T16:00:00Z', gameDate: '2025-01-02' },
    { sport: 'NFL', betType: 'spread', pickDescription: 'Bills -3', teamPicked: 'BUF', spreadLine: -3, oddsAtPick: -110, result: 'win', pickedAt: '2024-12-29T16:00:00Z', gameDate: '2024-12-29' },
    { sport: 'NFL', betType: 'spread', pickDescription: 'Eagles -6.5', teamPicked: 'PHI', spreadLine: -6.5, oddsAtPick: -110, result: 'win', pickedAt: '2024-12-22T16:00:00Z', gameDate: '2024-12-22' },
    { sport: 'NFL', betType: 'moneyline', pickDescription: 'Lions ML', teamPicked: 'DET', moneylineOdds: -150, oddsAtPick: -150, result: 'win', pickedAt: '2024-12-15T16:00:00Z', gameDate: '2024-12-15' },
    { sport: 'NFL', betType: 'spread', pickDescription: 'Ravens -4.5', teamPicked: 'BAL', spreadLine: -4.5, oddsAtPick: -110, result: 'loss', pickedAt: '2024-12-08T16:00:00Z', gameDate: '2024-12-08' },
  ]
  
  // Billy Walters - Sharp legend, excellent
  const waltersPicks: Partial<Pick>[] = [
    { sport: 'NFL', betType: 'spread', pickDescription: 'Vikings +4', teamPicked: 'MIN', spreadLine: 4, oddsAtPick: -110, result: 'win', pickedAt: '2025-01-02T12:00:00Z', gameDate: '2025-01-02' },
    { sport: 'NFL', betType: 'spread', pickDescription: 'Bengals +3', teamPicked: 'CIN', spreadLine: 3, oddsAtPick: -110, result: 'win', pickedAt: '2024-12-29T12:00:00Z', gameDate: '2024-12-29' },
    { sport: 'NBA', betType: 'spread', pickDescription: 'Thunder -4.5', teamPicked: 'OKC', spreadLine: -4.5, oddsAtPick: -110, result: 'win', pickedAt: '2024-12-28T19:00:00Z', gameDate: '2024-12-28' },
    { sport: 'NFL', betType: 'spread', pickDescription: 'Steelers +6.5', teamPicked: 'PIT', spreadLine: 6.5, oddsAtPick: -110, result: 'win', pickedAt: '2024-12-22T12:00:00Z', gameDate: '2024-12-22' },
    { sport: 'NFL', betType: 'spread', pickDescription: 'Broncos +7', teamPicked: 'DEN', spreadLine: 7, oddsAtPick: -110, result: 'loss', pickedAt: '2024-12-15T12:00:00Z', gameDate: '2024-12-15' },
    { sport: 'NBA', betType: 'spread', pickDescription: 'Celtics -3', teamPicked: 'BOS', spreadLine: -3, oddsAtPick: -110, result: 'win', pickedAt: '2024-12-14T19:00:00Z', gameDate: '2024-12-14' },
  ]
  
  // Charles Barkley - Bad NBA picks
  const barkleyPicks: Partial<Pick>[] = [
    { sport: 'NBA', betType: 'spread', pickDescription: 'Suns -2', teamPicked: 'PHX', spreadLine: -2, oddsAtPick: -110, result: 'loss', pickedAt: '2025-01-02T20:00:00Z', gameDate: '2025-01-02' },
    { sport: 'NBA', betType: 'spread', pickDescription: 'Suns -4.5', teamPicked: 'PHX', spreadLine: -4.5, oddsAtPick: -110, result: 'loss', pickedAt: '2024-12-30T20:00:00Z', gameDate: '2024-12-30' },
    { sport: 'NBA', betType: 'moneyline', pickDescription: 'Suns ML', teamPicked: 'PHX', moneylineOdds: -140, oddsAtPick: -140, result: 'loss', pickedAt: '2024-12-28T20:00:00Z', gameDate: '2024-12-28' },
    { sport: 'NBA', betType: 'spread', pickDescription: 'Lakers -3', teamPicked: 'LAL', spreadLine: -3, oddsAtPick: -110, result: 'loss', pickedAt: '2024-12-25T20:00:00Z', gameDate: '2024-12-25' },
    { sport: 'NBA', betType: 'spread', pickDescription: 'Warriors -2.5', teamPicked: 'GSW', spreadLine: -2.5, oddsAtPick: -110, result: 'loss', pickedAt: '2024-12-22T20:00:00Z', gameDate: '2024-12-22' },
    { sport: 'NBA', betType: 'spread', pickDescription: 'Nuggets -5', teamPicked: 'DEN', spreadLine: -5, oddsAtPick: -110, result: 'win', pickedAt: '2024-12-20T20:00:00Z', gameDate: '2024-12-20' },
  ]
  
  // Add all picks with IDs
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
  
  addPicks('1', stephenAPicks) // Stephen A
  addPicks('8', skipPicks) // Skip
  addPicks('14', romoPicks) // Romo
  addPicks('19', waltersPicks) // Billy Walters
  addPicks('11', barkleyPicks) // Barkley
  
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

export function getLeaderboardEntries(filters?: {
  capperType?: string
  betType?: string
  sport?: string
  sortBy?: string
}): LeaderboardEntry[] {
  let filteredCappers = cappers.filter(c => c.isActive)
  
  // Filter by capper type
  if (filters?.capperType && filters.capperType !== 'all') {
    filteredCappers = filteredCappers.filter(c => c.capperType === filters.capperType)
  }
  
  // Map to leaderboard entries
  const entries: LeaderboardEntry[] = filteredCappers.map(capper => {
    const stats = capperStats[capper.id]
    const lastPick = picks.filter(p => p.capperId === capper.id).sort((a, b) => 
      new Date(b.pickedAt).getTime() - new Date(a.pickedAt).getTime()
    )[0]
    
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
      record: `${stats?.totalWins || 0}-${stats?.totalLosses || 0}`,
      winPct: stats?.winPercentage || 0,
      units: stats?.netUnits || 0,
      roi: stats?.roiPercentage || 0,
      streak: stats?.currentStreak || 'N/A',
      rank: stats?.overallRank || 99,
      rankChange: stats?.rankChange || 0,
      lastPick: lastPick?.pickDescription,
      lastPickResult: lastPick?.result as 'win' | 'loss' | 'push' | undefined,
    }
  })
  
  // Sort
  const sortBy = filters?.sortBy || 'units'
  entries.sort((a, b) => {
    switch(sortBy) {
      case 'winPct': return b.winPct - a.winPct
      case 'roi': return b.roi - a.roi
      case 'picks': 
        const aStats = capperStats[a.id]
        const bStats = capperStats[b.id]
        return (bStats?.totalPicks || 0) - (aStats?.totalPicks || 0)
      default: return b.units - a.units
    }
  })
  
  // Update ranks based on sort
  entries.forEach((e, i) => { e.rank = i + 1 })
  
  return entries
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
}): Pick[] {
  let filtered = picks.filter(p => p.capperId === capperId)
  
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
