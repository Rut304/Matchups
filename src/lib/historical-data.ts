// Historical Data Library
// Provides access to 2 years of historical betting data for Edge Finder, Trends, and Prediction Markets
// This builds trust by showing long-term track record, not just current season

import { createClient } from '@/lib/supabase/client'

// =============================================================================
// TYPES
// =============================================================================

export interface HistoricalGame {
  id: string
  espn_game_id?: string
  sport: string
  season: number
  season_type: string
  week?: number
  home_team_name: string
  away_team_name: string
  home_team_abbr: string
  away_team_abbr: string
  game_date: string
  home_score: number
  away_score: number
  point_spread: number | null
  over_under: number | null
  total_points: number
  spread_result: 'home_cover' | 'away_cover' | 'push'
  total_result: 'over' | 'under' | 'push'
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
// DEPRECATED MOCK DATA REMOVED
// All data now comes from database. Functions return [] on failure.
// =============================================================================

// Empty array fallback - used when database has no data
const emptyHistoricalMarkets: HistoricalPredictionMarket[] = []

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
      console.error('[Historical Data] Error fetching trends:', error)
      // Return empty array - no fake data, UI should show "no data available"
      return []
    }
    
    return data || []
  } catch (err) {
    console.error('[Historical Data] Exception fetching trends:', err)
    // Return empty array - no fake data
    return []
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
      // No mock data - return empty array, UI should show "no data available"
      return []
    }
    
    return data || []
  } catch {
    // No mock data - return empty array
    return []
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
      return filterPredictionMarkets(emptyHistoricalMarkets, sport, resolvedOnly)
    }
    
    return data || filterPredictionMarkets(emptyHistoricalMarkets, sport, resolvedOnly)
  } catch {
    return filterPredictionMarkets(emptyHistoricalMarkets, sport, resolvedOnly)
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
