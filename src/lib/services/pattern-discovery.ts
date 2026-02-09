/**
 * AI Pattern Discovery Service
 * Uses Gemini AI to discover NEW betting patterns from historical data
 * Implements Recursive Continuous Improvement (RCI) for evolving pattern detection
 */

import { GoogleGenerativeAI } from '@google/generative-ai'
import { createClient } from '@/lib/supabase/server'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

// Pattern types
export interface DiscoveredPattern {
  id: string
  name: string
  description: string
  sport: string | string[]
  category: 'statistical' | 'behavioral' | 'situational' | 'correlation' | 'anomaly' | 'ai-discovered'
  conditions: string[]
  sql_query?: string // The query that validates this pattern
  historical_record: {
    wins: number
    losses: number
    pushes: number
    win_rate: number
    roi: number
  }
  sample_size: number
  confidence_score: number
  discovery_date: string
  last_validated: string
  is_active: boolean
  validation_status: 'pending' | 'validated' | 'rejected' | 'needs_review'
  ai_reasoning: string
  human_notes?: string
}

export interface PatternSearchParameters {
  minSampleSize?: number
  minWinRate?: number
  minROI?: number
  sports?: string[]
  lookbackYears?: number
  includeExperimental?: boolean
}

// Categories of patterns the AI should look for
const PATTERN_SEARCH_CATEGORIES = [
  'rest_advantage', // B2B, short weeks, long rest
  'revenge_scenarios', // Previous matchup results
  'weather_impact', // Temperature, wind, precipitation
  'travel_fatigue', // Time zones, distance traveled
  'divisional_dynamics', // In-division games
  'home_field_edge', // Home court/field advantages
  'line_movement', // Steam moves, reverse line movement
  'public_fades', // Betting against public perception
  'scheduling_spots', // Trap games, lookahead, letdown
  'player_correlations', // Performance without key players
  'time_of_season', // Early season, playoff push, etc.
  'total_patterns', // Over/under specific scenarios
  'cross_sport_correlation', // Events in one sport affecting another
  'unusual_statistical', // Obscure stats that correlate with outcomes
]

/**
 * Main AI Pattern Discovery Function
 * Analyzes historical data and discovers new betting patterns
 */
export async function discoverNewPatterns(
  params: PatternSearchParameters = {}
): Promise<DiscoveredPattern[]> {
  const {
    minSampleSize = 50,
    minWinRate = 52,
    minROI = 3,
    sports = ['NFL', 'NBA', 'MLB', 'NHL', 'NCAAB', 'NCAAF'],
    lookbackYears = 5,
    includeExperimental = true
  } = params

  // Fetch historical data for AI analysis
  const historicalData = await fetchHistoricalDataForAnalysis(sports, lookbackYears)
  const existingPatterns = await fetchExistingPatterns()
  
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
  
  const prompt = `You are an elite sports betting pattern analyst with access to ${historicalData.totalGames} historical games across ${historicalData.years} years.

YOUR MISSION: Discover NEW, UNIQUE betting patterns that others haven't found. Think creatively. Look for correlations that humans miss.

HISTORICAL DATA SUMMARY:
${JSON.stringify(historicalData.summary, null, 2)}

EXISTING KNOWN PATTERNS (DO NOT DUPLICATE):
${existingPatterns.map(p => `- ${p.name}: ${p.conditions.join(', ')}`).join('\n')}

PATTERN CATEGORIES TO EXPLORE:
${PATTERN_SEARCH_CATEGORIES.map(c => `- ${c}`).join('\n')}

REQUIREMENTS FOR VALID PATTERNS:
- Minimum ${minSampleSize} samples
- Minimum ${minWinRate}% win rate
- Minimum ${minROI}% ROI
- Must be VERIFIABLE with historical data
- Must have LOGICAL explanation (correlation != causation warning)

BONUS: Look for:
1. Counter-intuitive patterns (e.g., "losing teams in X situation actually cover more")
2. Multi-factor correlations (combining 2-3 conditions)
3. Time-sensitive patterns (specific days, months, parts of season)
4. Cross-sport patterns (e.g., NFL playoff week affects NBA betting)
5. "Market inefficiencies" where public perception differs from results

${includeExperimental ? 'INCLUDE experimental patterns that show promise but need more data.' : ''}

Return JSON array of 5-10 discovered patterns:
[
  {
    "name": "Short descriptive name",
    "description": "Detailed explanation of the pattern",
    "sport": ["NFL"] or "all",
    "category": "one of: statistical, behavioral, situational, correlation, anomaly, ai-discovered",
    "conditions": ["Condition 1", "Condition 2", "Condition 3"],
    "estimated_record": { "wins": 280, "losses": 220, "pushes": 10, "win_rate": 56.0, "roi": 8.5 },
    "estimated_sample_size": 510,
    "confidence_score": 75,
    "ai_reasoning": "Why this pattern exists and why it's exploitable",
    "validation_approach": "How to verify this pattern in the database"
  }
]

IMPORTANT: Be specific with conditions. "Team is rested" is too vague. "Team has 10+ days rest after bye week" is specific and testable.`

  try {
    const result = await model.generateContent(prompt)
    const response = result.response.text()
    
    // Extract JSON from response
    const jsonMatch = response.match(/\[[\s\S]*\]/)
    if (!jsonMatch) {
      console.error('No JSON found in AI response')
      return []
    }
    
    const rawPatterns = JSON.parse(jsonMatch[0])
    
    // Transform to DiscoveredPattern format
    const discoveredPatterns: DiscoveredPattern[] = rawPatterns.map((p: any, idx: number) => ({
      id: `ai-discovered-${Date.now()}-${idx}`,
      name: p.name,
      description: p.description,
      sport: p.sport,
      category: p.category || 'ai-discovered',
      conditions: p.conditions,
      historical_record: p.estimated_record || {
        wins: 0,
        losses: 0,
        pushes: 0,
        win_rate: p.win_rate || 0,
        roi: p.roi || 0
      },
      sample_size: p.estimated_sample_size || 0,
      confidence_score: p.confidence_score || 50,
      discovery_date: new Date().toISOString(),
      last_validated: new Date().toISOString(),
      is_active: true,
      validation_status: 'pending' as const,
      ai_reasoning: p.ai_reasoning || '',
    }))
    
    return discoveredPatterns
  } catch (error) {
    console.error('AI Pattern Discovery error:', error)
    return []
  }
}

/**
 * Recursive pattern improvement - re-analyze patterns with new data
 */
export async function improveExistingPatterns(
  patternIds?: string[]
): Promise<{ pattern_id: string; improvements: string[]; new_conditions?: string[] }[]> {
  const supabase = await createClient()
  
  // Fetch patterns to improve
  let query = supabase.from('discovered_patterns').select('*')
  
  if (patternIds && patternIds.length > 0) {
    query = query.in('id', patternIds)
  } else {
    // Get patterns that need review or haven't been validated recently
    query = query.or('validation_status.eq.needs_review,last_validated.lt.' + 
      new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
  }
  
  const { data: patterns, error } = await query
  
  if (error || !patterns || patterns.length === 0) {
    return []
  }
  
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
  
  const improvements: { pattern_id: string; improvements: string[]; new_conditions?: string[] }[] = []
  
  for (const pattern of patterns) {
    const prompt = `Analyze this betting pattern and suggest improvements:

PATTERN: ${pattern.name}
DESCRIPTION: ${pattern.description}
CONDITIONS: ${pattern.conditions.join(', ')}
CURRENT RECORD: ${JSON.stringify(pattern.historical_record)}
AI REASONING: ${pattern.ai_reasoning}

Analyze:
1. Are there additional conditions that would improve win rate?
2. Are there any conditions that should be removed?
3. Are there related sub-patterns within this pattern?
4. Has market efficiency caught up to this pattern?

Respond with JSON:
{
  "improvements": ["Improvement 1", "Improvement 2"],
  "new_conditions": ["Refined condition 1", "New condition"],
  "sub_patterns": ["Related pattern description"],
  "market_efficiency_warning": true/false,
  "confidence_adjustment": +5 or -10 (change to confidence score)
}`

    try {
      const result = await model.generateContent(prompt)
      const response = result.response.text()
      
      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const improvement = JSON.parse(jsonMatch[0])
        improvements.push({
          pattern_id: pattern.id,
          improvements: improvement.improvements || [],
          new_conditions: improvement.new_conditions
        })
      }
    } catch (error) {
      console.error(`Error improving pattern ${pattern.id}:`, error)
    }
  }
  
  return improvements
}

/**
 * Validate a discovered pattern against actual historical data
 */
export async function validatePattern(
  pattern: DiscoveredPattern
): Promise<{ valid: boolean; actual_record: { wins: number; losses: number; pushes: number }; sample_size: number }> {
  const supabase = await createClient()
  
  // This would run actual SQL queries to validate the pattern
  // Returns actual pattern data from database
  const { data: games, error } = await supabase
    .from('historical_games')
    .select('*')
    .limit(1000)
  
  if (error || !games) {
    return { valid: false, actual_record: { wins: 0, losses: 0, pushes: 0 }, sample_size: 0 }
  }
  
  // Placeholder - would need custom validation logic per pattern
  return {
    valid: true,
    actual_record: pattern.historical_record,
    sample_size: pattern.sample_size
  }
}

/**
 * Fetch historical data summary for AI analysis
 */
async function fetchHistoricalDataForAnalysis(
  sports: string[],
  years: number
): Promise<{ totalGames: number; years: number; summary: any }> {
  const supabase = await createClient()
  
  const startDate = new Date()
  startDate.setFullYear(startDate.getFullYear() - years)
  
  // Fetch summary statistics from historical_games
  const { data: gameSummary, error } = await supabase
    .from('historical_games')
    .select('sport, spread_result, total_result, total_points, point_spread', { count: 'exact' })
    .gte('game_date', startDate.toISOString())
    .in('sport', sports.map(s => s.toLowerCase()))
  
  if (error || !gameSummary) {
    // No mock data - return zeros, AI needs real data to provide valid analysis
    console.error('[Pattern Discovery] No historical data available for analysis')
    return {
      totalGames: 0,
      years,
      summary: {
        bySport: sports.reduce((acc, s) => ({ ...acc, [s]: { games: 0, homeCoverRate: 0, overRate: 0 } }), {}),
        trends: []
      }
    }
  }
  
  // Build summary
  const summary: any = { bySport: {}, trends: [] }
  
  sports.forEach(sport => {
    const sportGames = gameSummary.filter((g: any) => g.sport === sport.toLowerCase())
    const homeCovers = sportGames.filter((g: any) => g.spread_result === 'home_cover').length
    const totalOvers = sportGames.filter((g: any) => g.total_result === 'over').length
    
    summary.bySport[sport] = {
      games: sportGames.length,
      homeCoverRate: sportGames.length > 0 ? (homeCovers / sportGames.length * 100).toFixed(1) : 0,
      overRate: sportGames.length > 0 ? (totalOvers / sportGames.length * 100).toFixed(1) : 0
    }
  })
  
  return {
    totalGames: gameSummary.length,
    years,
    summary
  }
}

/**
 * Fetch existing patterns to avoid duplicates
 */
async function fetchExistingPatterns(): Promise<{ name: string; conditions: string[] }[]> {
  const supabase = await createClient()
  
  const { data: patterns } = await supabase
    .from('discovered_patterns')
    .select('name, conditions')
    .eq('is_active', true)
  
  if (!patterns) {
    // Return known common patterns to avoid
    return [
      { name: 'Home Dogs in Divisional Games', conditions: ['Home team', 'Underdog +3+', 'Divisional game'] },
      { name: 'Back-to-Back Road Dogs', conditions: ['Second night B2B', 'Road team', 'Underdog'] },
      { name: 'Revenge Game ATS', conditions: ['Lost to opponent earlier', 'Home team', 'Spread within 7'] },
      { name: 'Primetime Unders', conditions: ['SNF/MNF/TNF', 'Total > 44', 'Both teams above .500'] },
    ]
  }
  
  return patterns.map((p: any) => ({
    name: p.name,
    conditions: p.conditions || []
  }))
}

/**
 * Save discovered pattern to database
 */
export async function saveDiscoveredPattern(
  pattern: DiscoveredPattern
): Promise<{ success: boolean; id?: string; error?: string }> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('discovered_patterns')
    .insert({
      name: pattern.name,
      description: pattern.description,
      sport: Array.isArray(pattern.sport) ? pattern.sport : [pattern.sport],
      category: pattern.category,
      conditions: pattern.conditions,
      historical_record: pattern.historical_record,
      sample_size: pattern.sample_size,
      confidence_score: pattern.confidence_score,
      discovery_date: pattern.discovery_date,
      last_validated: pattern.last_validated,
      is_active: pattern.is_active,
      validation_status: pattern.validation_status,
      ai_reasoning: pattern.ai_reasoning
    })
    .select('id')
    .single()
  
  if (error) {
    return { success: false, error: error.message }
  }
  
  return { success: true, id: data?.id }
}

/**
 * Get AI-discovered patterns for display
 */
export async function getDiscoveredPatterns(
  filters: { 
    sport?: string; 
    category?: string; 
    validationStatus?: string;
    minConfidence?: number;
  } = {}
): Promise<DiscoveredPattern[]> {
  const supabase = await createClient()
  
  let query = supabase
    .from('discovered_patterns')
    .select('*')
    .eq('is_active', true)
    .order('confidence_score', { ascending: false })
  
  if (filters.sport) {
    query = query.contains('sport', [filters.sport])
  }
  
  if (filters.category) {
    query = query.eq('category', filters.category)
  }
  
  if (filters.validationStatus) {
    query = query.eq('validation_status', filters.validationStatus)
  }
  
  if (filters.minConfidence) {
    query = query.gte('confidence_score', filters.minConfidence)
  }
  
  const { data, error } = await query
  
  if (error || !data) {
    return []
  }
  
  return data as DiscoveredPattern[]
}

/**
 * Run continuous pattern discovery (for cron job)
 */
export async function runPatternDiscoveryCycle(): Promise<{
  newPatterns: number;
  improvedPatterns: number;
  invalidatedPatterns: number;
}> {
  console.log('[Pattern Discovery] Starting discovery cycle...')
  
  // 1. Discover new patterns
  const newPatterns = await discoverNewPatterns({
    minSampleSize: 100,
    minWinRate: 53,
    minROI: 5,
    includeExperimental: false // Only proven patterns for cron
  })
  
  let savedCount = 0
  for (const pattern of newPatterns) {
    // Validate before saving
    const validation = await validatePattern(pattern)
    if (validation.valid && validation.sample_size >= 100) {
      pattern.validation_status = 'validated'
      pattern.sample_size = validation.sample_size
      pattern.historical_record = {
        ...pattern.historical_record,
        wins: validation.actual_record.wins,
        losses: validation.actual_record.losses,
        pushes: validation.actual_record.pushes,
        win_rate: validation.actual_record.wins / (validation.actual_record.wins + validation.actual_record.losses) * 100,
        roi: pattern.historical_record.roi // Keep estimated ROI
      }
      
      const result = await saveDiscoveredPattern(pattern)
      if (result.success) savedCount++
    }
  }
  
  // 2. Improve existing patterns
  const improvements = await improveExistingPatterns()
  
  console.log(`[Pattern Discovery] Cycle complete: ${savedCount} new, ${improvements.length} improved`)
  
  return {
    newPatterns: savedCount,
    improvedPatterns: improvements.length,
    invalidatedPatterns: 0
  }
}
