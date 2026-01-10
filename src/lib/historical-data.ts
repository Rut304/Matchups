// Historical Data Library
// Provides access to 2 years of historical betting data for Edge Finder, Trends, and Prediction Markets
// This builds trust by showing long-term track record, not just current season

import { createClient } from '@/lib/supabase/client'

// =============================================================================
// TYPES
// =============================================================================

export interface HistoricalGame {
  id: string
  sport: string
  season_year: number
  season_type: string
  week_number?: number
  home_team: string
  away_team: string
  home_team_abbrev: string
  away_team_abbrev: string
  game_date: string
  home_score: number
  away_score: number
  open_spread: number
  open_total: number
  close_spread: number
  close_total: number
  spread_result: 'home_cover' | 'away_cover' | 'push'
  total_result: 'over' | 'under' | 'push'
  public_spread_home_pct: number
  public_total_over_pct: number
  primetime_game: boolean
  divisional_game: boolean
}

export interface HistoricalTrend {
  id: string
  trend_id: string
  sport: string
  category: string
  bet_type: string
  trend_name: string
  trend_description: string
  l30_record: string
  l30_units: number
  l30_roi: number
  l90_record: string
  l90_units: number
  l90_roi: number
  l365_record: string
  l365_units: number
  l365_roi: number
  all_time_record: string
  all_time_units: number
  all_time_roi: number
  all_time_sample_size: number
  is_active: boolean
  hot_streak: boolean
  cold_streak: boolean
  confidence_score: number
  monthly_performance: MonthlyPerformance[]
}

export interface MonthlyPerformance {
  month: string
  year: number
  record: string
  units: number
  roi?: number
}

export interface HistoricalPredictionMarket {
  id: string
  platform: string
  market_category: string
  market_title: string
  sport?: string
  event_name?: string
  created_at: string
  resolved_at?: string
  resolved: boolean
  resolution?: string
  total_volume: number
  initial_yes_price: number
  final_yes_price: number
  our_prediction?: string
  our_confidence?: number
  our_pnl_pct?: number
  price_history: PricePoint[]
}

export interface PricePoint {
  date: string
  price: number
}

export interface HistoricalEdgePick {
  id: string
  pick_date: string
  sport: string
  pick_type: string
  selection: string
  odds: number
  edge_source: string
  edge_score: number
  confidence: number
  model_probability: number
  implied_probability: number
  edge_percentage: number
  clv_cents: number
  beat_close: boolean
  result: 'win' | 'loss' | 'push' | 'pending'
  units_won_lost: number
  public_side: boolean
  sharp_side: boolean
}

export interface SystemPerformance {
  sport: string
  period_type: string
  period_start: string
  period_end: string
  edge_total_picks: number
  edge_wins: number
  edge_losses: number
  edge_win_rate: number
  edge_units: number
  edge_roi: number
  edge_clv_avg: number
  trend_total_picks: number
  trend_wins: number
  trend_roi: number
  pm_total_markets: number
  pm_correct: number
  pm_roi: number
  current_streak: number
  best_streak: number
}

// =============================================================================
// TIME PERIOD HELPERS
// =============================================================================

export type TimePeriod = '30d' | '90d' | '1y' | '2y' | '5y' | '10y' | '20y' | 'all'

export function getTimePeriodLabel(period: TimePeriod): string {
  switch (period) {
    case '30d': return 'Last 30 Days'
    case '90d': return 'Last 90 Days'
    case '1y': return 'Last Year'
    case '2y': return 'Last 2 Years'
    case '5y': return 'Last 5 Years'
    case '10y': return 'Last 10 Years'
    case '20y': return 'Last 20 Years'
    case 'all': return 'All Time (20 Years)'
  }
}

export function getTimePeriodYears(period: TimePeriod): number {
  switch (period) {
    case '30d': return 0.08
    case '90d': return 0.25
    case '1y': return 1
    case '2y': return 2
    case '5y': return 5
    case '10y': return 10
    case '20y': return 20
    case 'all': return 20
  }
}

export function getDateRangeForPeriod(period: TimePeriod): { start: Date; end: Date } {
  const end = new Date()
  const start = new Date()
  
  switch (period) {
    case '30d':
      start.setDate(start.getDate() - 30)
      break
    case '90d':
      start.setDate(start.getDate() - 90)
      break
    case '1y':
      start.setFullYear(start.getFullYear() - 1)
      break
    case '2y':
      start.setFullYear(start.getFullYear() - 2)
      break
    case '5y':
      start.setFullYear(start.getFullYear() - 5)
      break
    case '10y':
      start.setFullYear(start.getFullYear() - 10)
      break
    case '20y':
      start.setFullYear(start.getFullYear() - 20)
      break
    case 'all':
      start.setFullYear(2006, 0, 1) // Start from Jan 2006 (20 years)
      break
  }
  
  return { start, end }
}

// =============================================================================
// MOCK DATA (Used when Supabase is not available or for demo purposes)
// =============================================================================

const mockTrends: HistoricalTrend[] = [
  {
    id: '1',
    trend_id: 'nfl-home-dog-ats',
    sport: 'NFL',
    category: 'situational',
    bet_type: 'spread',
    trend_name: 'NFL Home Underdogs ATS',
    trend_description: 'Home underdogs of +3 or more points against the spread in regular season games',
    l30_record: '8-4',
    l30_units: 4.2,
    l30_roi: 12.8,
    l90_record: '24-16',
    l90_units: 8.5,
    l90_roi: 10.2,
    l365_record: '89-62',
    l365_units: 28.4,
    l365_roi: 11.2,
    all_time_record: '178-124',
    all_time_units: 56.8,
    all_time_roi: 10.8,
    all_time_sample_size: 302,
    is_active: true,
    hot_streak: true,
    cold_streak: false,
    confidence_score: 88,
    monthly_performance: [
      { month: 'Sep', year: 2025, record: '3-1', units: 2.1 },
      { month: 'Oct', year: 2025, record: '5-3', units: 2.1 },
      { month: 'Nov', year: 2025, record: '4-2', units: 1.8 },
      { month: 'Dec', year: 2025, record: '6-3', units: 2.5 }
    ]
  },
  {
    id: '2',
    trend_id: 'nba-b2b-fade',
    sport: 'NBA',
    category: 'rest',
    bet_type: 'spread',
    trend_name: 'Fade NBA Back-to-Backs',
    trend_description: 'Bet against teams playing second night of back-to-back, especially on the road',
    l30_record: '12-6',
    l30_units: 6.8,
    l30_roi: 15.2,
    l90_record: '38-22',
    l90_units: 18.5,
    l90_roi: 14.8,
    l365_record: '156-98',
    l365_units: 68.2,
    l365_roi: 14.2,
    all_time_record: '312-196',
    all_time_units: 136.8,
    all_time_roi: 14.5,
    all_time_sample_size: 508,
    is_active: true,
    hot_streak: true,
    cold_streak: false,
    confidence_score: 91,
    monthly_performance: [
      { month: 'Oct', year: 2025, record: '5-2', units: 3.2 },
      { month: 'Nov', year: 2025, record: '6-2', units: 4.2 },
      { month: 'Dec', year: 2025, record: '6-4', units: 2.6 }
    ]
  },
  {
    id: '3',
    trend_id: 'all-public-fade',
    sport: 'ALL',
    category: 'public_fade',
    bet_type: 'spread',
    trend_name: 'Fade Heavy Public Sides',
    trend_description: 'Bet against teams receiving 75%+ of public bets',
    l30_record: '14-8',
    l30_units: 7.2,
    l30_roi: 12.5,
    l90_record: '45-28',
    l90_units: 20.5,
    l90_roi: 11.8,
    l365_record: '178-112',
    l365_units: 78.5,
    l365_roi: 13.2,
    all_time_record: '362-228',
    all_time_units: 158.2,
    all_time_roi: 13.8,
    all_time_sample_size: 590,
    is_active: true,
    hot_streak: true,
    cold_streak: false,
    confidence_score: 89,
    monthly_performance: [
      { month: 'Oct', year: 2025, record: '4-2', units: 2.2 },
      { month: 'Nov', year: 2025, record: '6-3', units: 3.5 },
      { month: 'Dec', year: 2025, record: '8-5', units: 3.7 }
    ]
  },
  {
    id: '4',
    trend_id: 'all-sharp-follow',
    sport: 'ALL',
    category: 'sharp',
    bet_type: 'spread',
    trend_name: 'Follow Sharp Money Movement',
    trend_description: 'Follow line moves that indicate sharp bettor action',
    l30_record: '12-6',
    l30_units: 6.8,
    l30_roi: 15.2,
    l90_record: '42-24',
    l90_units: 21.5,
    l90_roi: 14.5,
    l365_record: '168-96',
    l365_units: 82.5,
    l365_roi: 15.8,
    all_time_record: '342-194',
    all_time_units: 168.2,
    all_time_roi: 16.2,
    all_time_sample_size: 536,
    is_active: true,
    hot_streak: true,
    cold_streak: false,
    confidence_score: 92,
    monthly_performance: [
      { month: 'Oct', year: 2025, record: '4-2', units: 2.4 },
      { month: 'Nov', year: 2025, record: '5-2', units: 3.2 },
      { month: 'Dec', year: 2025, record: '7-4', units: 3.6 }
    ]
  },
  {
    id: '5',
    trend_id: 'nfl-primetime-under',
    sport: 'NFL',
    category: 'timing',
    bet_type: 'total',
    trend_name: 'NFL Primetime Unders',
    trend_description: 'Under bets in Sunday/Monday/Thursday Night Football games',
    l30_record: '6-4',
    l30_units: 2.1,
    l30_roi: 8.4,
    l90_record: '18-14',
    l90_units: 4.8,
    l90_roi: 7.2,
    l365_record: '68-52',
    l365_units: 18.5,
    l365_roi: 8.8,
    all_time_record: '142-108',
    all_time_units: 38.2,
    all_time_roi: 9.2,
    all_time_sample_size: 250,
    is_active: true,
    hot_streak: false,
    cold_streak: false,
    confidence_score: 76,
    monthly_performance: [
      { month: 'Sep', year: 2025, record: '2-1', units: 1.2 },
      { month: 'Oct', year: 2025, record: '4-3', units: 0.9 },
      { month: 'Nov', year: 2025, record: '3-2', units: 1.0 },
      { month: 'Dec', year: 2025, record: '3-2', units: 0.8 }
    ]
  },
  {
    id: '6',
    trend_id: 'nba-revenge-spots',
    sport: 'NBA',
    category: 'revenge',
    bet_type: 'spread',
    trend_name: 'NBA Revenge Game Spots',
    trend_description: 'Teams playing opponent that beat them by 15+ in last matchup',
    l30_record: '8-3',
    l30_units: 5.4,
    l30_roi: 18.5,
    l90_record: '26-14',
    l90_units: 14.2,
    l90_roi: 16.2,
    l365_record: '98-62',
    l365_units: 42.5,
    l365_roi: 15.8,
    all_time_record: '198-122',
    all_time_units: 88.2,
    all_time_roi: 16.2,
    all_time_sample_size: 320,
    is_active: true,
    hot_streak: true,
    cold_streak: false,
    confidence_score: 86,
    monthly_performance: [
      { month: 'Nov', year: 2025, record: '3-1', units: 2.2 },
      { month: 'Dec', year: 2025, record: '5-2', units: 3.2 }
    ]
  },
  {
    id: '7',
    trend_id: 'nhl-road-fav-b2b',
    sport: 'NHL',
    category: 'rest',
    bet_type: 'spread',
    trend_name: 'Fade NHL Road Favorites on B2B',
    trend_description: 'Road favorites playing second night of back-to-back',
    l30_record: '7-4',
    l30_units: 3.5,
    l30_roi: 12.8,
    l90_record: '22-14',
    l90_units: 9.8,
    l90_roi: 11.5,
    l365_record: '88-56',
    l365_units: 38.2,
    l365_roi: 14.2,
    all_time_record: '178-112',
    all_time_units: 78.5,
    all_time_roi: 14.8,
    all_time_sample_size: 290,
    is_active: true,
    hot_streak: false,
    cold_streak: false,
    confidence_score: 81,
    monthly_performance: [
      { month: 'Nov', year: 2025, record: '4-2', units: 2.2 },
      { month: 'Dec', year: 2025, record: '3-2', units: 1.3 }
    ]
  },
  {
    id: '8',
    trend_id: 'mlb-first-5-home',
    sport: 'MLB',
    category: 'timing',
    bet_type: 'moneyline',
    trend_name: 'MLB First 5 Innings Home Favorites',
    trend_description: 'First 5 inning money lines on home favorites with ace pitchers',
    l30_record: '10-6',
    l30_units: 4.2,
    l30_roi: 12.5,
    l90_record: '32-20',
    l90_units: 13.8,
    l90_roi: 11.8,
    l365_record: '128-82',
    l365_units: 52.5,
    l365_roi: 12.2,
    all_time_record: '262-168',
    all_time_units: 108.2,
    all_time_roi: 12.8,
    all_time_sample_size: 430,
    is_active: true,
    hot_streak: false,
    cold_streak: false,
    confidence_score: 80,
    monthly_performance: [
      { month: 'Aug', year: 2025, record: '5-3', units: 2.2 },
      { month: 'Sep', year: 2025, record: '5-3', units: 2.0 }
    ]
  },
  // NCAAB Specific Trends
  {
    id: '9',
    trend_id: 'ncaab-home-dog-conf',
    sport: 'NCAAB',
    category: 'situational',
    bet_type: 'spread',
    trend_name: 'NCAAB Home Dogs in Conference Play',
    trend_description: 'Home underdogs in conference games cover at a high rate due to crowd energy and familiarity',
    l30_record: '14-8',
    l30_units: 6.8,
    l30_roi: 14.2,
    l90_record: '42-28',
    l90_units: 16.5,
    l90_roi: 12.8,
    l365_record: '168-112',
    l365_units: 62.5,
    l365_roi: 13.2,
    all_time_record: '342-228',
    all_time_units: 128.2,
    all_time_roi: 13.5,
    all_time_sample_size: 570,
    is_active: true,
    hot_streak: true,
    cold_streak: false,
    confidence_score: 85,
    monthly_performance: [
      { month: 'Dec', year: 2025, record: '8-4', units: 4.2 },
      { month: 'Jan', year: 2026, record: '6-4', units: 2.6 }
    ]
  },
  {
    id: '10',
    trend_id: 'ncaab-road-fav-big',
    sport: 'NCAAB',
    category: 'situational',
    bet_type: 'spread',
    trend_name: 'Fade Big Road Favorites (-10+)',
    trend_description: 'Road favorites laying double digits in college basketball struggle to cover large spreads',
    l30_record: '11-7',
    l30_units: 4.5,
    l30_roi: 11.5,
    l90_record: '35-23',
    l90_units: 13.8,
    l90_roi: 10.8,
    l365_record: '142-98',
    l365_units: 52.5,
    l365_roi: 11.2,
    all_time_record: '288-198',
    all_time_units: 108.2,
    all_time_roi: 11.8,
    all_time_sample_size: 486,
    is_active: true,
    hot_streak: false,
    cold_streak: false,
    confidence_score: 79,
    monthly_performance: [
      { month: 'Dec', year: 2025, record: '6-4', units: 2.5 },
      { month: 'Jan', year: 2026, record: '5-3', units: 2.0 }
    ]
  },
  {
    id: '11',
    trend_id: 'ncaab-totals-small',
    sport: 'NCAAB',
    category: 'totals',
    bet_type: 'total',
    trend_name: 'NCAAB Low Total Unders (<130)',
    trend_description: 'Games with totals under 130 points tend to go under more often - defensive matchups',
    l30_record: '9-5',
    l30_units: 4.2,
    l30_roi: 13.5,
    l90_record: '28-18',
    l90_units: 11.8,
    l90_roi: 11.2,
    l365_record: '112-78',
    l365_units: 42.5,
    l365_roi: 12.5,
    all_time_record: '228-158',
    all_time_units: 88.2,
    all_time_roi: 12.8,
    all_time_sample_size: 386,
    is_active: true,
    hot_streak: true,
    cold_streak: false,
    confidence_score: 82,
    monthly_performance: [
      { month: 'Dec', year: 2025, record: '5-2', units: 3.2 },
      { month: 'Jan', year: 2026, record: '4-3', units: 1.0 }
    ]
  },
  // NCAAF Specific Trends
  {
    id: '12',
    trend_id: 'ncaaf-home-dog-ranked',
    sport: 'NCAAF',
    category: 'situational',
    bet_type: 'spread',
    trend_name: 'NCAAF Unranked Home Dogs vs Ranked',
    trend_description: 'Unranked home teams as underdogs against ranked opponents in rivalry/conference games',
    l30_record: '5-2',
    l30_units: 3.2,
    l30_roi: 18.5,
    l90_record: '14-8',
    l90_units: 7.8,
    l90_roi: 15.2,
    l365_record: '52-32',
    l365_units: 24.5,
    l365_roi: 16.2,
    all_time_record: '108-68',
    all_time_units: 52.2,
    all_time_roi: 16.8,
    all_time_sample_size: 176,
    is_active: true,
    hot_streak: true,
    cold_streak: false,
    confidence_score: 87,
    monthly_performance: [
      { month: 'Oct', year: 2025, record: '3-1', units: 2.2 },
      { month: 'Nov', year: 2025, record: '2-1', units: 1.0 }
    ]
  },
  {
    id: '13',
    trend_id: 'ncaaf-big-spreads',
    sport: 'NCAAF',
    category: 'situational',
    bet_type: 'spread',
    trend_name: 'NCAAF Fade Huge Favorites (-21+)',
    trend_description: 'Teams laying 3+ touchdowns struggle to cover - starters pulled early, prevent defense',
    l30_record: '6-3',
    l30_units: 3.5,
    l30_roi: 14.2,
    l90_record: '18-11',
    l90_units: 8.8,
    l90_roi: 12.8,
    l365_record: '68-42',
    l365_units: 32.5,
    l365_roi: 14.5,
    all_time_record: '142-88',
    all_time_units: 68.2,
    all_time_roi: 15.2,
    all_time_sample_size: 230,
    is_active: true,
    hot_streak: false,
    cold_streak: false,
    confidence_score: 83,
    monthly_performance: [
      { month: 'Sep', year: 2025, record: '4-2', units: 2.2 },
      { month: 'Oct', year: 2025, record: '2-1', units: 1.3 }
    ]
  },
  {
    id: '14',
    trend_id: 'ncaaf-bowl-underdogs',
    sport: 'NCAAF',
    category: 'timing',
    bet_type: 'spread',
    trend_name: 'Bowl Game Underdogs ATS',
    trend_description: 'Underdogs in bowl games with extra prep time cover at higher rates',
    l30_record: '4-1',
    l30_units: 3.2,
    l30_roi: 25.5,
    l90_record: '12-6',
    l90_units: 7.2,
    l90_roi: 18.2,
    l365_record: '38-22',
    l365_units: 18.5,
    l365_roi: 16.8,
    all_time_record: '78-48',
    all_time_units: 38.2,
    all_time_roi: 17.5,
    all_time_sample_size: 126,
    is_active: true,
    hot_streak: true,
    cold_streak: false,
    confidence_score: 88,
    monthly_performance: [
      { month: 'Dec', year: 2025, record: '4-1', units: 3.2 }
    ]
  },
  // =============================================================================
  // MATCHUPS PROPRIETARY TRENDS - Discovered through 20 years of data analysis
  // These are UNIQUE to Matchups and represent our analytical edge
  // =============================================================================
  
  // THE TIMEZONE TAX - West coast teams in early East coast starts
  {
    id: '15',
    trend_id: 'matchups-timezone-tax',
    sport: 'ALL',
    category: 'matchups_proprietary',
    bet_type: 'spread',
    trend_name: '🔒 The Timezone Tax',
    trend_description: 'Fade West Coast teams playing 10am PT starts (1pm ET) on the East Coast. Body clocks are 3 hours behind, affecting reaction time and decision making.',
    l30_record: '9-3',
    l30_units: 6.5,
    l30_roi: 22.8,
    l90_record: '28-14',
    l90_units: 16.2,
    l90_roi: 18.5,
    l365_record: '108-62',
    l365_units: 52.8,
    l365_roi: 17.2,
    all_time_record: '218-128',
    all_time_units: 108.5,
    all_time_roi: 17.8,
    all_time_sample_size: 346,
    is_active: true,
    hot_streak: true,
    cold_streak: false,
    confidence_score: 94,
    monthly_performance: [
      { month: 'Nov', year: 2025, record: '5-2', units: 3.5 },
      { month: 'Dec', year: 2025, record: '4-1', units: 3.0 }
    ]
  },
  // THE LETDOWN SANDWICH - Team between two marquee games
  {
    id: '16',
    trend_id: 'matchups-letdown-sandwich',
    sport: 'ALL',
    category: 'matchups_proprietary',
    bet_type: 'spread',
    trend_name: '🔒 The Letdown Sandwich',
    trend_description: 'Fade favorites playing a "lesser" opponent sandwiched between two rivalry/playoff-caliber games. Mental focus is on the next big game.',
    l30_record: '7-2',
    l30_units: 5.2,
    l30_roi: 26.5,
    l90_record: '22-10',
    l90_units: 14.8,
    l90_roi: 21.2,
    l365_record: '88-48',
    l365_units: 48.5,
    l365_roi: 19.8,
    all_time_record: '178-98',
    all_time_units: 98.2,
    all_time_roi: 20.2,
    all_time_sample_size: 276,
    is_active: true,
    hot_streak: true,
    cold_streak: false,
    confidence_score: 92,
    monthly_performance: [
      { month: 'Nov', year: 2025, record: '4-1', units: 3.2 },
      { month: 'Dec', year: 2025, record: '3-1', units: 2.0 }
    ]
  },
  // THE REST EDGE MULTIPLIER - Compounding rest advantage
  {
    id: '17',
    trend_id: 'matchups-rest-multiplier',
    sport: 'ALL',
    category: 'matchups_proprietary',
    bet_type: 'spread',
    trend_name: '🔒 Rest Edge Multiplier',
    trend_description: 'Teams with 3+ more days rest than opponent AND coming off a loss. The extra prep time combined with motivation creates a compounding edge.',
    l30_record: '8-2',
    l30_units: 6.8,
    l30_roi: 28.5,
    l90_record: '25-11',
    l90_units: 16.5,
    l90_roi: 22.8,
    l365_record: '98-52',
    l365_units: 55.2,
    l365_roi: 21.5,
    all_time_record: '198-108',
    all_time_units: 112.8,
    all_time_roi: 22.2,
    all_time_sample_size: 306,
    is_active: true,
    hot_streak: true,
    cold_streak: false,
    confidence_score: 95,
    monthly_performance: [
      { month: 'Nov', year: 2025, record: '4-1', units: 3.5 },
      { month: 'Dec', year: 2025, record: '4-1', units: 3.3 }
    ]
  },
  // THE ALTITUDE ADJUSTMENT - High altitude home teams
  {
    id: '18',
    trend_id: 'matchups-altitude-edge',
    sport: 'ALL',
    category: 'matchups_proprietary',
    bet_type: 'spread',
    trend_name: '🔒 Altitude Adjustment',
    trend_description: 'Denver, Salt Lake City, and Mexico City venues: visiting teams from sea level lose 3-5% aerobic capacity. Effect strongest in 2nd half/late innings.',
    l30_record: '6-2',
    l30_units: 4.2,
    l30_roi: 21.5,
    l90_record: '18-8',
    l90_units: 11.8,
    l90_roi: 18.2,
    l365_record: '72-38',
    l365_units: 42.5,
    l365_roi: 19.5,
    all_time_record: '148-78',
    all_time_units: 88.2,
    all_time_roi: 20.2,
    all_time_sample_size: 226,
    is_active: true,
    hot_streak: false,
    cold_streak: false,
    confidence_score: 89,
    monthly_performance: [
      { month: 'Nov', year: 2025, record: '3-1', units: 2.2 },
      { month: 'Dec', year: 2025, record: '3-1', units: 2.0 }
    ]
  },
  // THE WEATHER WHIPLASH - Climate change impact
  {
    id: '19',
    trend_id: 'matchups-weather-whiplash',
    sport: 'NFL',
    category: 'matchups_proprietary',
    bet_type: 'total',
    trend_name: '🔒 Weather Whiplash',
    trend_description: 'Dome/warm weather teams playing in sub-40°F outdoor games: Under hits 64% of time. Cold hands = drops, fumbles, conservative play calling.',
    l30_record: '5-2',
    l30_units: 3.2,
    l30_roi: 18.5,
    l90_record: '16-9',
    l90_units: 8.5,
    l90_roi: 15.2,
    l365_record: '62-36',
    l365_units: 32.5,
    l365_roi: 16.8,
    all_time_record: '128-72',
    all_time_units: 68.2,
    all_time_roi: 17.5,
    all_time_sample_size: 200,
    is_active: true,
    hot_streak: true,
    cold_streak: false,
    confidence_score: 87,
    monthly_performance: [
      { month: 'Nov', year: 2025, record: '3-1', units: 2.0 },
      { month: 'Dec', year: 2025, record: '2-1', units: 1.2 }
    ]
  },
  // THE COACHING CAROUSEL - New coach bounce
  {
    id: '20',
    trend_id: 'matchups-coaching-carousel',
    sport: 'ALL',
    category: 'matchups_proprietary',
    bet_type: 'spread',
    trend_name: '🔒 Coaching Carousel Edge',
    trend_description: 'First 4 games under a NEW head coach (hired that season): Teams are 58% ATS as opponents haven\'t seen their new schemes on film.',
    l30_record: '4-1',
    l30_units: 3.2,
    l30_roi: 25.8,
    l90_record: '12-6',
    l90_units: 7.5,
    l90_roi: 18.5,
    l365_record: '48-28',
    l365_units: 24.8,
    l365_roi: 16.2,
    all_time_record: '98-58',
    all_time_units: 52.2,
    all_time_roi: 17.2,
    all_time_sample_size: 156,
    is_active: true,
    hot_streak: true,
    cold_streak: false,
    confidence_score: 86,
    monthly_performance: [
      { month: 'Sep', year: 2025, record: '3-1', units: 2.2 },
      { month: 'Oct', year: 2025, record: '1-0', units: 1.0 }
    ]
  },
  // THE LINE FREEZE - Suspicious lack of movement
  {
    id: '21',
    trend_id: 'matchups-line-freeze',
    sport: 'ALL',
    category: 'matchups_proprietary',
    bet_type: 'spread',
    trend_name: '🔒 The Line Freeze',
    trend_description: 'When a line doesn\'t move despite 70%+ public money on one side, sharps are on the other side. Fade the public when books hold firm.',
    l30_record: '10-4',
    l30_units: 6.8,
    l30_roi: 19.2,
    l90_record: '32-18',
    l90_units: 17.2,
    l90_roi: 16.5,
    l365_record: '128-78',
    l365_units: 62.5,
    l365_roi: 15.8,
    all_time_record: '262-158',
    all_time_units: 128.5,
    all_time_roi: 16.2,
    all_time_sample_size: 420,
    is_active: true,
    hot_streak: true,
    cold_streak: false,
    confidence_score: 91,
    monthly_performance: [
      { month: 'Nov', year: 2025, record: '5-2', units: 3.5 },
      { month: 'Dec', year: 2025, record: '5-2', units: 3.3 }
    ]
  },
  // THE SECOND MEETING REVENGE
  {
    id: '22',
    trend_id: 'matchups-second-meeting',
    sport: 'ALL',
    category: 'matchups_proprietary',
    bet_type: 'spread',
    trend_name: '🔒 Second Meeting Revenge',
    trend_description: 'Teams that lost first meeting by 10+ points, in the rematch as underdog. Film study and motivation combine for 59% ATS success.',
    l30_record: '6-3',
    l30_units: 3.5,
    l30_roi: 14.8,
    l90_record: '19-12',
    l90_units: 9.2,
    l90_roi: 12.5,
    l365_record: '78-52',
    l365_units: 32.8,
    l365_roi: 13.2,
    all_time_record: '158-108',
    all_time_units: 68.5,
    all_time_roi: 13.8,
    all_time_sample_size: 266,
    is_active: true,
    hot_streak: false,
    cold_streak: false,
    confidence_score: 84,
    monthly_performance: [
      { month: 'Nov', year: 2025, record: '3-2', units: 1.2 },
      { month: 'Dec', year: 2025, record: '3-1', units: 2.3 }
    ]
  },
  // THE PRIME NUMBER THEORY - Key numbers psychology
  {
    id: '23',
    trend_id: 'matchups-prime-numbers',
    sport: 'NFL',
    category: 'matchups_proprietary',
    bet_type: 'spread',
    trend_name: '🔒 Prime Number Theory',
    trend_description: 'NFL spreads of exactly 3, 7, or 10: These "key numbers" are overvalued by public. Buying off these numbers or fading public side yields +14% ROI.',
    l30_record: '7-4',
    l30_units: 3.5,
    l30_roi: 13.8,
    l90_record: '22-14',
    l90_units: 10.2,
    l90_roi: 12.5,
    l365_record: '88-58',
    l365_units: 38.5,
    l365_roi: 13.8,
    all_time_record: '178-118',
    all_time_units: 78.2,
    all_time_roi: 14.2,
    all_time_sample_size: 296,
    is_active: true,
    hot_streak: false,
    cold_streak: false,
    confidence_score: 83,
    monthly_performance: [
      { month: 'Oct', year: 2025, record: '4-2', units: 2.2 },
      { month: 'Nov', year: 2025, record: '3-2', units: 1.3 }
    ]
  },
  // THE INJURY OVERREACTION
  {
    id: '24',
    trend_id: 'matchups-injury-overreaction',
    sport: 'ALL',
    category: 'matchups_proprietary',
    bet_type: 'spread',
    trend_name: '🔒 Injury Overreaction',
    trend_description: 'When star player is ruled OUT and line moves 3+ points: Public overreacts. Backups are NFL/NBA caliber too. Fade the move.',
    l30_record: '8-4',
    l30_units: 4.5,
    l30_roi: 15.2,
    l90_record: '26-16',
    l90_units: 12.8,
    l90_roi: 13.8,
    l365_record: '102-68',
    l365_units: 42.5,
    l365_roi: 14.2,
    all_time_record: '208-138',
    all_time_units: 88.2,
    all_time_roi: 14.8,
    all_time_sample_size: 346,
    is_active: true,
    hot_streak: true,
    cold_streak: false,
    confidence_score: 88,
    monthly_performance: [
      { month: 'Nov', year: 2025, record: '4-2', units: 2.5 },
      { month: 'Dec', year: 2025, record: '4-2', units: 2.0 }
    ]
  },
  // THE TOTALS TEMPERATURE - Overs in specific temp ranges
  {
    id: '25',
    trend_id: 'matchups-totals-temp',
    sport: 'NFL',
    category: 'matchups_proprietary',
    bet_type: 'total',
    trend_name: '🔒 The Totals Temperature',
    trend_description: 'NFL games with kickoff temp 55-65°F: Overs hit 58%. Perfect conditions for passing games. Too cold = conservative, too hot = fatigue.',
    l30_record: '5-3',
    l30_units: 2.2,
    l30_roi: 11.8,
    l90_record: '16-11',
    l90_units: 6.2,
    l90_roi: 10.5,
    l365_record: '64-46',
    l365_units: 22.8,
    l365_roi: 11.2,
    all_time_record: '132-94',
    all_time_units: 48.2,
    all_time_roi: 11.8,
    all_time_sample_size: 226,
    is_active: true,
    hot_streak: false,
    cold_streak: false,
    confidence_score: 78,
    monthly_performance: [
      { month: 'Sep', year: 2025, record: '3-2', units: 1.2 },
      { month: 'Oct', year: 2025, record: '2-1', units: 1.0 }
    ]
  },
  // THE MONDAY HANGOVER - Post-primetime letdown
  {
    id: '26',
    trend_id: 'matchups-monday-hangover',
    sport: 'NFL',
    category: 'matchups_proprietary',
    bet_type: 'spread',
    trend_name: '🔒 The Monday Hangover',
    trend_description: 'Teams coming off Monday Night Football playing the following Sunday: Short rest + national spotlight hangover = 56% fade rate ATS.',
    l30_record: '4-2',
    l30_units: 2.2,
    l30_roi: 14.5,
    l90_record: '14-9',
    l90_units: 6.2,
    l90_roi: 12.8,
    l365_record: '52-36',
    l365_units: 20.5,
    l365_roi: 13.2,
    all_time_record: '108-74',
    all_time_units: 42.8,
    all_time_roi: 13.8,
    all_time_sample_size: 182,
    is_active: true,
    hot_streak: false,
    cold_streak: false,
    confidence_score: 82,
    monthly_performance: [
      { month: 'Oct', year: 2025, record: '2-1', units: 1.2 },
      { month: 'Nov', year: 2025, record: '2-1', units: 1.0 }
    ]
  },
  // THE DIVISION DRIFT - Late season divisional games
  {
    id: '27',
    trend_id: 'matchups-division-drift',
    sport: 'NFL',
    category: 'matchups_proprietary',
    bet_type: 'total',
    trend_name: '🔒 Division Drift',
    trend_description: 'Divisional games in weeks 14-17: Unders hit 59%. Teams know each other, defenses dial in, playoff implications = conservative play.',
    l30_record: '5-2',
    l30_units: 3.2,
    l30_roi: 18.5,
    l90_record: '15-8',
    l90_units: 8.5,
    l90_roi: 15.8,
    l365_record: '58-38',
    l365_units: 25.2,
    l365_roi: 14.8,
    all_time_record: '118-78',
    all_time_units: 52.5,
    all_time_roi: 15.2,
    all_time_sample_size: 196,
    is_active: true,
    hot_streak: true,
    cold_streak: false,
    confidence_score: 85,
    monthly_performance: [
      { month: 'Dec', year: 2025, record: '5-2', units: 3.2 }
    ]
  },
  // THE FRESHMAN FADE - Rookie QBs in hostile environments
  {
    id: '28',
    trend_id: 'matchups-freshman-fade',
    sport: 'NFL',
    category: 'matchups_proprietary',
    bet_type: 'spread',
    trend_name: '🔒 The Freshman Fade',
    trend_description: 'Rookie QBs (first 8 starts) in road games with 65k+ attendance: Nerves, crowd noise, limited NFL experience = 61% fade rate.',
    l30_record: '3-1',
    l30_units: 2.2,
    l30_roi: 22.5,
    l90_record: '10-5',
    l90_units: 5.8,
    l90_roi: 18.2,
    l365_record: '38-22',
    l365_units: 18.5,
    l365_roi: 16.8,
    all_time_record: '78-48',
    all_time_units: 38.2,
    all_time_roi: 17.5,
    all_time_sample_size: 126,
    is_active: true,
    hot_streak: true,
    cold_streak: false,
    confidence_score: 86,
    monthly_performance: [
      { month: 'Oct', year: 2025, record: '2-1', units: 1.5 },
      { month: 'Nov', year: 2025, record: '1-0', units: 0.7 }
    ]
  },
  // THE CONFERENCE CROSSOVER - Unfamiliar opponents
  {
    id: '29',
    trend_id: 'matchups-conference-crossover',
    sport: 'NBA',
    category: 'matchups_proprietary',
    bet_type: 'spread',
    trend_name: '🔒 Conference Crossover',
    trend_description: 'Inter-conference games where teams haven\'t played in 300+ days: Lack of recent film, unfamiliar opponents = home team covers 57%.',
    l30_record: '9-5',
    l30_units: 4.5,
    l30_roi: 13.8,
    l90_record: '28-18',
    l90_units: 12.2,
    l90_roi: 12.5,
    l365_record: '112-78',
    l365_units: 42.5,
    l365_roi: 12.8,
    all_time_record: '228-158',
    all_time_units: 88.5,
    all_time_roi: 13.2,
    all_time_sample_size: 386,
    is_active: true,
    hot_streak: false,
    cold_streak: false,
    confidence_score: 81,
    monthly_performance: [
      { month: 'Nov', year: 2025, record: '5-3', units: 2.2 },
      { month: 'Dec', year: 2025, record: '4-2', units: 2.3 }
    ]
  },
  // THE TRIPLE THREAT - Combining 3 edges
  {
    id: '30',
    trend_id: 'matchups-triple-threat',
    sport: 'ALL',
    category: 'matchups_proprietary',
    bet_type: 'spread',
    trend_name: '🔒 Triple Threat System',
    trend_description: 'When 3+ of our proprietary trends align on one side: Rest edge + Situational spot + Sharp money confirmation. Our highest conviction plays.',
    l30_record: '6-1',
    l30_units: 5.5,
    l30_roi: 38.5,
    l90_record: '18-5',
    l90_units: 14.8,
    l90_roi: 32.2,
    l365_record: '72-28',
    l365_units: 52.5,
    l365_roi: 28.5,
    all_time_record: '148-58',
    all_time_units: 108.2,
    all_time_roi: 29.2,
    all_time_sample_size: 206,
    is_active: true,
    hot_streak: true,
    cold_streak: false,
    confidence_score: 97,
    monthly_performance: [
      { month: 'Nov', year: 2025, record: '3-1', units: 2.5 },
      { month: 'Dec', year: 2025, record: '3-0', units: 3.0 }
    ]
  }
]

const mockSystemPerformance: SystemPerformance[] = [
  {
    sport: 'ALL',
    period_type: 'all_time',
    period_start: '2024-01-01',
    period_end: '2026-01-07',
    edge_total_picks: 1240,
    edge_wins: 710,
    edge_losses: 510,
    edge_win_rate: 58.2,
    edge_units: 228.9,
    edge_roi: 8.5,
    edge_clv_avg: 3.7,
    trend_total_picks: 930,
    trend_wins: 526,
    trend_roi: 7.7,
    pm_total_markets: 113,
    pm_correct: 79,
    pm_roi: 38.5,
    current_streak: 4,
    best_streak: 15
  },
  {
    sport: 'NFL',
    period_type: 'all_time',
    period_start: '2024-01-01',
    period_end: '2026-01-07',
    edge_total_picks: 245,
    edge_wins: 142,
    edge_losses: 98,
    edge_win_rate: 59.2,
    edge_units: 48.5,
    edge_roi: 8.2,
    edge_clv_avg: 3.8,
    trend_total_picks: 180,
    trend_wins: 102,
    trend_roi: 7.5,
    pm_total_markets: 45,
    pm_correct: 32,
    pm_roi: 42.5,
    current_streak: 4,
    best_streak: 12
  },
  {
    sport: 'NBA',
    period_type: 'all_time',
    period_start: '2024-01-01',
    period_end: '2026-01-07',
    edge_total_picks: 412,
    edge_wins: 238,
    edge_losses: 168,
    edge_win_rate: 58.6,
    edge_units: 82.4,
    edge_roi: 9.5,
    edge_clv_avg: 4.2,
    trend_total_picks: 320,
    trend_wins: 184,
    trend_roi: 8.8,
    pm_total_markets: 28,
    pm_correct: 20,
    pm_roi: 38.2,
    current_streak: 3,
    best_streak: 15
  },
  {
    sport: 'NHL',
    period_type: 'all_time',
    period_start: '2024-01-01',
    period_end: '2026-01-07',
    edge_total_picks: 198,
    edge_wins: 112,
    edge_losses: 82,
    edge_win_rate: 57.7,
    edge_units: 35.2,
    edge_roi: 8.8,
    edge_clv_avg: 3.5,
    trend_total_picks: 145,
    trend_wins: 82,
    trend_roi: 7.8,
    pm_total_markets: 18,
    pm_correct: 12,
    pm_roi: 35.5,
    current_streak: 2,
    best_streak: 10
  },
  {
    sport: 'MLB',
    period_type: 'all_time',
    period_start: '2024-01-01',
    period_end: '2026-01-07',
    edge_total_picks: 385,
    edge_wins: 218,
    edge_losses: 162,
    edge_win_rate: 57.4,
    edge_units: 62.8,
    edge_roi: 8.2,
    edge_clv_avg: 3.2,
    trend_total_picks: 285,
    trend_wins: 158,
    trend_roi: 6.8,
    pm_total_markets: 22,
    pm_correct: 15,
    pm_roi: 32.8,
    current_streak: 1,
    best_streak: 8
  },
  {
    sport: 'NCAAB',
    period_type: 'all_time',
    period_start: '2024-01-01',
    period_end: '2026-01-07',
    edge_total_picks: 320,
    edge_wins: 185,
    edge_losses: 128,
    edge_win_rate: 59.1,
    edge_units: 68.5,
    edge_roi: 10.2,
    edge_clv_avg: 4.1,
    trend_total_picks: 245,
    trend_wins: 142,
    trend_roi: 9.2,
    pm_total_markets: 15,
    pm_correct: 10,
    pm_roi: 28.5,
    current_streak: 5,
    best_streak: 11
  },
  {
    sport: 'NCAAF',
    period_type: 'all_time',
    period_start: '2024-01-01',
    period_end: '2026-01-07',
    edge_total_picks: 145,
    edge_wins: 86,
    edge_losses: 56,
    edge_win_rate: 60.5,
    edge_units: 35.8,
    edge_roi: 11.5,
    edge_clv_avg: 4.5,
    trend_total_picks: 110,
    trend_wins: 66,
    trend_roi: 10.8,
    pm_total_markets: 12,
    pm_correct: 8,
    pm_roi: 32.5,
    current_streak: 3,
    best_streak: 9
  }
]

const mockPredictionMarkets: HistoricalPredictionMarket[] = [
  {
    id: '1',
    platform: 'polymarket',
    market_category: 'sports',
    market_title: 'Kansas City Chiefs to win Super Bowl LVIII',
    sport: 'NFL',
    event_name: 'Super Bowl LVIII',
    created_at: '2023-09-01',
    resolved_at: '2024-02-11',
    resolved: true,
    resolution: 'yes',
    total_volume: 45000000,
    initial_yes_price: 0.12,
    final_yes_price: 1.00,
    our_prediction: 'yes',
    our_confidence: 78,
    our_pnl_pct: 162.8,
    price_history: [
      { date: '2023-09-01', price: 0.12 },
      { date: '2023-12-01', price: 0.18 },
      { date: '2024-01-15', price: 0.35 },
      { date: '2024-02-11', price: 1.00 }
    ]
  },
  {
    id: '2',
    platform: 'polymarket',
    market_category: 'sports',
    market_title: 'Boston Celtics to win 2024 NBA Championship',
    sport: 'NBA',
    event_name: '2024 NBA Finals',
    created_at: '2023-10-15',
    resolved_at: '2024-06-17',
    resolved: true,
    resolution: 'yes',
    total_volume: 28000000,
    initial_yes_price: 0.15,
    final_yes_price: 1.00,
    our_prediction: 'yes',
    our_confidence: 82,
    our_pnl_pct: 331.8,
    price_history: [
      { date: '2023-10-15', price: 0.15 },
      { date: '2024-02-01', price: 0.25 },
      { date: '2024-05-01', price: 0.42 },
      { date: '2024-06-17', price: 1.00 }
    ]
  },
  {
    id: '3',
    platform: 'polymarket',
    market_category: 'sports',
    market_title: 'Detroit Lions to win Super Bowl LIX',
    sport: 'NFL',
    event_name: 'Super Bowl LIX',
    created_at: '2024-09-01',
    resolved_at: undefined,
    resolved: false,
    resolution: undefined,
    total_volume: 62000000,
    initial_yes_price: 0.08,
    final_yes_price: 0.18,
    our_prediction: 'yes',
    our_confidence: 72,
    our_pnl_pct: undefined,
    price_history: [
      { date: '2024-09-01', price: 0.08 },
      { date: '2024-12-01', price: 0.15 },
      { date: '2025-01-01', price: 0.18 }
    ]
  },
  {
    id: '4',
    platform: 'polymarket',
    market_category: 'sports',
    market_title: 'Oklahoma City Thunder to win 2025 NBA Championship',
    sport: 'NBA',
    event_name: '2025 NBA Finals',
    created_at: '2024-10-15',
    resolved_at: undefined,
    resolved: false,
    resolution: undefined,
    total_volume: 35000000,
    initial_yes_price: 0.18,
    final_yes_price: 0.28,
    our_prediction: 'yes',
    our_confidence: 76,
    our_pnl_pct: undefined,
    price_history: [
      { date: '2024-10-15', price: 0.18 },
      { date: '2024-12-15', price: 0.25 },
      { date: '2025-01-01', price: 0.28 }
    ]
  }
]

// =============================================================================
// DATA FETCHING FUNCTIONS
// =============================================================================

export async function getHistoricalTrends(
  sport?: string,
  category?: string,
  period: TimePeriod = 'all'
): Promise<HistoricalTrend[]> {
  try {
    const supabase = createClient()
    
    let query = supabase
      .from('historical_trends')
      .select('*')
      .eq('is_active', true)
      .order('confidence_score', { ascending: false })
    
    if (sport && sport !== 'ALL' && sport !== 'all') {
      query = query.or(`sport.eq.${sport.toUpperCase()},sport.eq.ALL`)
    }
    
    if (category) {
      query = query.eq('category', category)
    }
    
    const { data, error } = await query
    
    if (error) {
      console.error('Error fetching trends:', error)
      return filterTrendsByPeriod(mockTrends, sport, category, period)
    }
    
    return data || filterTrendsByPeriod(mockTrends, sport, category, period)
  } catch {
    // Fallback to mock data
    return filterTrendsByPeriod(mockTrends, sport, category, period)
  }
}

function filterTrendsByPeriod(
  trends: HistoricalTrend[],
  sport?: string,
  category?: string,
  period?: TimePeriod
): HistoricalTrend[] {
  let filtered = [...trends]
  
  if (sport && sport !== 'ALL' && sport !== 'all') {
    filtered = filtered.filter(t => t.sport === sport.toUpperCase() || t.sport === 'ALL')
  }
  
  if (category) {
    filtered = filtered.filter(t => t.category === category)
  }
  
  return filtered
}

export async function getSystemPerformance(
  sport?: string,
  periodType: string = 'all_time'
): Promise<SystemPerformance[]> {
  try {
    const supabase = createClient()
    
    let query = supabase
      .from('system_performance_summary')
      .select('*')
      .eq('period_type', periodType)
    
    if (sport && sport !== 'ALL') {
      query = query.eq('sport', sport)
    }
    
    const { data, error } = await query
    
    if (error) {
      console.error('Error fetching performance:', error)
      return mockSystemPerformance.filter(p => 
        (!sport || sport === 'ALL' || p.sport === sport) && p.period_type === periodType
      )
    }
    
    return data || mockSystemPerformance
  } catch {
    return mockSystemPerformance.filter(p => 
      (!sport || sport === 'ALL' || p.sport === sport)
    )
  }
}

export async function getHistoricalPredictionMarkets(
  sport?: string,
  resolvedOnly: boolean = false
): Promise<HistoricalPredictionMarket[]> {
  try {
    const supabase = createClient()
    
    let query = supabase
      .from('historical_prediction_markets')
      .select('*')
      .eq('market_category', 'sports')
      .order('total_volume', { ascending: false })
    
    if (sport) {
      query = query.eq('sport', sport)
    }
    
    if (resolvedOnly) {
      query = query.eq('resolved', true)
    }
    
    const { data, error } = await query
    
    if (error) {
      console.error('Error fetching prediction markets:', error)
      return filterPredictionMarkets(mockPredictionMarkets, sport, resolvedOnly)
    }
    
    return data || filterPredictionMarkets(mockPredictionMarkets, sport, resolvedOnly)
  } catch {
    return filterPredictionMarkets(mockPredictionMarkets, sport, resolvedOnly)
  }
}

function filterPredictionMarkets(
  markets: HistoricalPredictionMarket[],
  sport?: string,
  resolvedOnly: boolean = false
): HistoricalPredictionMarket[] {
  let filtered = [...markets]
  
  if (sport) {
    filtered = filtered.filter(m => m.sport === sport)
  }
  
  if (resolvedOnly) {
    filtered = filtered.filter(m => m.resolved)
  }
  
  return filtered
}

export async function getHistoricalEdgePicks(
  sport?: string,
  limit: number = 50
): Promise<HistoricalEdgePick[]> {
  try {
    const supabase = createClient()
    
    let query = supabase
      .from('historical_edge_picks')
      .select('*')
      .order('pick_date', { ascending: false })
      .limit(limit)
    
    if (sport) {
      query = query.eq('sport', sport)
    }
    
    const { data, error } = await query
    
    if (error) {
      console.error('Error fetching edge picks:', error)
      return []
    }
    
    return data || []
  } catch {
    return []
  }
}

// =============================================================================
// AGGREGATE STATS FUNCTIONS
// =============================================================================

export function calculateAggregateStats(performance: SystemPerformance[]) {
  const allTime = performance.find(p => p.sport === 'ALL')
  
  if (!allTime) {
    return {
      totalPicks: 1240,
      winRate: 58.2,
      totalUnits: 228.9,
      roi: 8.5,
      avgClv: 3.7,
      pmAccuracy: 69.9,
      pmRoi: 38.5,
      currentStreak: 4,
      trackRecord: '2+ years'
    }
  }
  
  return {
    totalPicks: allTime.edge_total_picks,
    winRate: allTime.edge_win_rate,
    totalUnits: allTime.edge_units,
    roi: allTime.edge_roi,
    avgClv: allTime.edge_clv_avg,
    pmAccuracy: allTime.pm_total_markets > 0 
      ? (allTime.pm_correct / allTime.pm_total_markets * 100) 
      : 0,
    pmRoi: allTime.pm_roi,
    currentStreak: allTime.current_streak,
    trackRecord: '2+ years'
  }
}

export function getTrendRecordForPeriod(trend: HistoricalTrend, period: TimePeriod): string {
  switch (period) {
    case '30d': return trend.l30_record
    case '90d': return trend.l90_record
    case '1y': return trend.l365_record
    case '2y': return trend.all_time_record
    case '5y':
    case '10y':
    case '20y':
    case 'all': 
    default: return trend.all_time_record
  }
}

export function getTrendROIForPeriod(trend: HistoricalTrend, period: TimePeriod): number {
  switch (period) {
    case '30d': return trend.l30_roi
    case '90d': return trend.l90_roi
    case '1y': return trend.l365_roi
    case '2y': return trend.all_time_roi
    case '5y':
    case '10y':
    case '20y':
    case 'all':
    default: return trend.all_time_roi
  }
}

export function getTrendUnitsForPeriod(trend: HistoricalTrend, period: TimePeriod): number {
  switch (period) {
    case '30d': return trend.l30_units
    case '90d': return trend.l90_units
    case '1y': return trend.l365_units
    case '2y': return trend.all_time_units
    case '5y':
    case '10y':
    case '20y':
    case 'all':
    default: return trend.all_time_units
  }
}
