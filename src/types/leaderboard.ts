// Leaderboard & Capper Types

export type CapperType = 'celebrity' | 'pro' | 'community' | 'ai'
export type BetType = 'spread' | 'moneyline' | 'over_under' | 'prop' | 'parlay' | 'teaser' | 'futures'
export type PickResult = 'win' | 'loss' | 'push' | 'pending' | 'void'
export type Sport = 'NFL' | 'NBA' | 'NHL' | 'MLB' | 'NCAAF' | 'NCAAB' | 'Soccer' | 'Other'
export type Network = 
  | 'ESPN' 
  | 'FOX' 
  | 'CBS' 
  | 'NBC'
  | 'TNT' 
  | 'FS1' 
  | 'NFL Network' 
  | 'NBA TV'
  | 'Podcast' 
  | 'YouTube' 
  | 'X/Twitter' 
  | 'The Athletic' 
  | 'Action Network' 
  | 'Independent' 
  | 'Barstool' 
  | 'Twitter' 
  | 'TSN' 
  | 'Covers'
  | 'VSiN'
  | 'Bleacher Report'
  | 'Sports Illustrated'
  | 'Website'
  | 'Las Vegas'

export interface Capper {
  id: string
  slug: string
  name: string
  avatarEmoji: string
  avatarUrl?: string
  verified: boolean
  capperType: CapperType
  network?: Network
  role?: string
  twitterHandle?: string
  followersCount?: string
  isActive: boolean
  isFeatured: boolean
  bio?: string
  createdAt: string
  updatedAt: string
}

export interface Pick {
  id: string
  capperId: string
  gameId?: string
  sport: Sport
  eventName?: string
  betType: BetType
  pickDescription: string
  teamPicked?: string
  spreadLine?: number
  moneylineOdds?: number
  totalLine?: number
  overUnder?: 'over' | 'under'
  propType?: string
  propPlayer?: string
  propLine?: number
  parlayLegs?: ParlayLeg[]
  parlayOdds?: number
  units: number
  pickedAt: string
  gameDate?: string
  oddsAtPick?: number
  sourceUrl?: string
  sourceType?: 'tv' | 'podcast' | 'twitter' | 'article' | 'manual' | 'other'
  result?: PickResult
  resultNotes?: string
  settledAt?: string
  verifiedBy?: string
  verifiedAt?: string
  isHidden: boolean
}

export interface ParlayLeg {
  sport: Sport
  team: string
  betType: BetType
  line?: number
  odds?: number
  result?: PickResult
}

export interface CapperStats {
  capperId: string
  totalPicks: number
  totalWins: number
  totalLosses: number
  totalPushes: number
  winPercentage: number
  totalUnitsWagered: number
  totalUnitsWon: number
  netUnits: number
  roiPercentage: number
  currentStreak: string
  bestStreak?: string
  worstStreak?: string
  overallRank: number
  previousRank?: number
  rankChange: number
  lastPickAt?: string
  picksThisWeek: number
  picksThisMonth: number
}

export interface CapperStatsBySport {
  capperId: string
  sport: Sport
  totalPicks: number
  wins: number
  losses: number
  pushes: number
  winPercentage: number
  netUnits: number
  roiPercentage: number
}

export interface CapperStatsByBetType {
  capperId: string
  betType: BetType
  totalPicks: number
  wins: number
  losses: number
  pushes: number
  winPercentage: number
  netUnits: number
  roiPercentage: number
}

// Combined view for leaderboard display
export interface LeaderboardEntry {
  id: string
  slug: string
  name: string
  avatarEmoji: string
  avatarUrl?: string
  verified: boolean
  capperType: CapperType
  network?: Network
  role?: string
  followersCount?: string
  
  // Stats
  record: string // "134-89"
  winPct: number
  units: number
  roi: number
  streak: string
  rank: number
  rankChange: number
  lastPick?: string
  
  // For display
  lastPickResult?: 'win' | 'loss' | 'push'
  
  // Year filtering context
  totalPicks?: number
  yearFiltered?: boolean
}

// Filter options for leaderboard
export interface LeaderboardFilters {
  capperType?: CapperType | 'all'
  sport?: Sport | 'all'
  betType?: BetType | 'all'
  network?: Network | 'all'
  timeframe?: 'today' | 'week' | 'month' | 'season' | 'all'
  minPicks?: number
  sortBy?: 'units' | 'winPct' | 'roi' | 'picks'
}

// For admin pick entry
export interface CreatePickInput {
  capperId: string
  sport: Sport
  betType: BetType
  pickDescription: string
  teamPicked?: string
  spreadLine?: number
  moneylineOdds?: number
  totalLine?: number
  overUnder?: 'over' | 'under'
  propType?: string
  propPlayer?: string
  propLine?: number
  parlayLegs?: ParlayLeg[]
  parlayOdds?: number
  units?: number
  pickedAt?: string
  gameDate?: string
  oddsAtPick?: number
  sourceUrl?: string
  sourceType?: 'tv' | 'podcast' | 'twitter' | 'article' | 'manual' | 'other'
  eventName?: string
}

export interface UpdatePickInput {
  id: string
  result?: PickResult
  resultNotes?: string
  pickDescription?: string
  units?: number
  oddsAtPick?: number
  isHidden?: boolean
}

// Modification record for audit
export interface RecordModification {
  id: string
  capperId: string
  pickId?: string
  modificationType: 'add_pick' | 'edit_pick' | 'delete_pick' | 'change_result' | 'bulk_update' | 'manual_adjustment'
  fieldChanged?: string
  oldValue?: string
  newValue?: string
  reason?: string
  modifiedBy: string
  createdAt: string
}
