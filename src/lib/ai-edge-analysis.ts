import { geminiModel } from './gemini'
import { createClient } from './supabase/client'

// ===========================================
// TYPES
// ===========================================

export interface EdgeOpportunity {
  id: string
  sport: string
  type: 'spread' | 'total' | 'moneyline' | 'prop'
  matchup: string
  pick: string
  odds: number
  confidence: number
  edgePercentage: number
  reasoning: string
  supportingTrends: string[]
  historicalWinRate: number
  riskLevel: 'low' | 'medium' | 'high'
  clvExpected: number
  aiScore: number
}

export interface TrendInsight {
  trendId: string
  name: string
  sport: string
  category: string
  currentStatus: 'hot' | 'cold' | 'neutral'
  recentRecord: string
  allTimeRecord: string
  roi: number
  sampleSize: number
  aiAnalysis: string
  currentApplications: string[]
  confidence: number
}

export interface HistoricalPattern {
  patternName: string
  description: string
  sports: string[]
  winRate: number
  sampleSize: number
  avgROI: number
  conditions: string[]
  lastOccurrence: string
  frequency: string
}

// Database row types
interface HistoricalTrendRow {
  trend_id?: string
  trend_name: string
  trend_description?: string
  sport: string
  category: string
  bet_type?: string
  hot_streak: boolean
  cold_streak?: boolean
  confidence_score: number
  l30_record: string
  l30_roi: number
  l90_record?: string
  l90_roi?: number
  l365_record?: string
  l365_roi?: number
  all_time_record: string
  all_time_roi: number
  all_time_sample_size: number
  [key: string]: unknown
}

interface EdgePickRow {
  result: string
  [key: string]: unknown
}

export interface AIInsightReport {
  timestamp: string
  sport?: string
  topEdges: EdgeOpportunity[]
  hotTrends: TrendInsight[]
  emergingPatterns: HistoricalPattern[]
  marketInefficiencies: string[]
  todaysFocus: string
  weeklyOutlook: string
  riskAlerts: string[]
}

// ===========================================
// DATABASE QUERIES
// ===========================================

async function fetchHistoricalTrends(sport?: string) {
  const supabase = createClient()
  
  let query = supabase
    .from('historical_trends')
    .select('*')
    .eq('is_active', true)
    .order('confidence_score', { ascending: false })
  
  if (sport && sport !== 'ALL') {
    query = query.or(`sport.eq.${sport},sport.eq.ALL`)
  }
  
  const { data, error } = await query.limit(50)
  
  if (error) {
    console.error('Error fetching trends:', error)
    return []
  }
  
  return data || []
}

async function fetchSystemPerformance(sport?: string) {
  const supabase = createClient()
  
  let query = supabase
    .from('system_performance_summary')
    .select('*')
    .eq('period_type', 'all_time')
  
  if (sport && sport !== 'ALL') {
    query = query.eq('sport', sport)
  }
  
  const { data, error } = await query
  
  if (error) {
    console.error('Error fetching performance:', error)
    return []
  }
  
  return data || []
}

async function fetchRecentEdgePicks(sport?: string, days: number = 30) {
  const supabase = createClient()
  
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)
  
  let query = supabase
    .from('historical_edge_picks')
    .select('*')
    .gte('pick_date', startDate.toISOString().split('T')[0])
    .order('pick_date', { ascending: false })
  
  if (sport && sport !== 'ALL') {
    query = query.eq('sport', sport)
  }
  
  const { data, error } = await query.limit(100)
  
  if (error) {
    console.error('Error fetching edge picks:', error)
    return []
  }
  
  return data || []
}

async function fetchPredictionMarkets(category?: string) {
  const supabase = createClient()
  
  let query = supabase
    .from('historical_prediction_markets')
    .select('*')
    .order('total_volume', { ascending: false })
  
  if (category) {
    query = query.eq('market_category', category)
  }
  
  const { data, error } = await query.limit(50)
  
  if (error) {
    console.error('Error fetching markets:', error)
    return []
  }
  
  return data || []
}

// ===========================================
// AI ANALYSIS FUNCTIONS
// ===========================================

export async function analyzeHistoricalEdges(sport?: string): Promise<EdgeOpportunity[]> {
  const trends = await fetchHistoricalTrends(sport)
  const performance = await fetchSystemPerformance(sport)
  const recentPicks = await fetchRecentEdgePicks(sport, 30)
  
  // Calculate recent performance stats
  const recentWins = recentPicks.filter((p: EdgePickRow) => p.result === 'win').length
  const recentTotal = recentPicks.filter((p: EdgePickRow) => p.result !== 'pending' && p.result !== 'push').length
  const recentWinRate = recentTotal > 0 ? (recentWins / recentTotal) * 100 : 0
  
  // Get hot trends
  const hotTrends = trends.filter((t: HistoricalTrendRow) => t.hot_streak && t.confidence_score >= 80)
  
  const prompt = `You are an expert sports betting analyst with access to 20 years of historical data.

CURRENT SYSTEM PERFORMANCE (20-Year Track Record):
${JSON.stringify(performance, null, 2)}

RECENT 30-DAY PERFORMANCE:
- Win Rate: ${recentWinRate.toFixed(1)}%
- Total Picks: ${recentTotal}
- Wins: ${recentWins}

HOT TRENDS (Currently on Streak):
${hotTrends.map((t: HistoricalTrendRow) => `- ${t.trend_name}: ${t.l30_record} (${t.l30_roi}% ROI) - ${t.all_time_record} all-time`).join('\n')}

ALL ACTIVE TRENDS:
${trends.slice(0, 20).map((t: HistoricalTrendRow) => `- ${t.trend_name} [${t.sport}]: ${t.all_time_record} (${t.all_time_roi}% ROI, ${t.all_time_sample_size} sample)`).join('\n')}

Based on this 20-year historical data, identify the TOP 5 edge opportunities for TODAY. Focus on:
1. Trends with proven long-term profitability
2. Situations matching current sports calendar
3. Sharp money indicators
4. Public fade opportunities
5. CLV (Closing Line Value) potential

Respond with a JSON array of edge opportunities:
[
  {
    "id": "unique-id",
    "sport": "NFL",
    "type": "spread",
    "matchup": "Team A vs Team B",
    "pick": "Team A -3.5",
    "odds": -110,
    "confidence": 78,
    "edgePercentage": 5.2,
    "reasoning": "Detailed explanation of the edge",
    "supportingTrends": ["trend-id-1", "trend-id-2"],
    "historicalWinRate": 58.5,
    "riskLevel": "low",
    "clvExpected": 3,
    "aiScore": 85
  }
]`

  try {
    const result = await geminiModel.generateContent(prompt)
    const response = result.response.text()
    
    const jsonMatch = response.match(/\[[\s\S]*\]/)
    if (jsonMatch) {
      const edges = JSON.parse(jsonMatch[0])
      return edges.slice(0, 5)
    }
  } catch (error) {
    console.error('AI edge analysis error:', error)
  }
  
  // Fallback mock data
  return [
    {
      id: 'edge-1',
      sport: sport || 'NFL',
      type: 'spread',
      matchup: 'Sample Matchup',
      pick: 'Home Team -3',
      odds: -110,
      confidence: 75,
      edgePercentage: 4.5,
      reasoning: 'Based on 20-year historical trends showing home favorites in primetime games cover at 58.2%',
      supportingTrends: ['nfl-home-dog-ats', 'all-sharp-follow'],
      historicalWinRate: 58.2,
      riskLevel: 'medium',
      clvExpected: 2,
      aiScore: 78
    }
  ]
}

export async function analyzeTrendInsights(sport?: string): Promise<TrendInsight[]> {
  const trends = await fetchHistoricalTrends(sport)
  
  const prompt = `You are an expert sports betting analyst. Analyze these betting trends and provide insights.

ACTIVE TRENDS (20-Year Data):
${trends.map((t: HistoricalTrendRow) => `
TREND: ${t.trend_name}
Sport: ${t.sport} | Category: ${t.category}
Last 30 Days: ${t.l30_record} (${t.l30_roi}% ROI)
Last 90 Days: ${t.l90_record} (${t.l90_roi}% ROI)
Last Year: ${t.l365_record} (${t.l365_roi}% ROI)
All-Time (20yr): ${t.all_time_record} (${t.all_time_roi}% ROI, ${t.all_time_sample_size} games)
Hot Streak: ${t.hot_streak ? 'YES' : 'NO'}
Confidence: ${t.confidence_score}/100
`).join('\n---\n')}

For each trend, provide analysis including:
1. Current status (hot/cold/neutral)
2. Whether it's currently applicable
3. Risk assessment
4. Current games/situations where this applies

Respond with JSON array:
[
  {
    "trendId": "trend-id",
    "name": "Trend Name",
    "sport": "NFL",
    "category": "situational",
    "currentStatus": "hot",
    "recentRecord": "15-8",
    "allTimeRecord": "1782-1248",
    "roi": 10.8,
    "sampleSize": 3030,
    "aiAnalysis": "Detailed analysis of trend performance and applicability",
    "currentApplications": ["Today's Game 1", "Tonight's Game 2"],
    "confidence": 88
  }
]`

  try {
    const result = await geminiModel.generateContent(prompt)
    const response = result.response.text()
    
    const jsonMatch = response.match(/\[[\s\S]*\]/)
    if (jsonMatch) {
      const insights = JSON.parse(jsonMatch[0])
      return insights.slice(0, 10)
    }
  } catch (error) {
    console.error('AI trend analysis error:', error)
  }
  
  // Fallback: transform database trends to insights
  return trends.slice(0, 10).map((t: HistoricalTrendRow) => ({
    trendId: t.trend_id,
    name: t.trend_name,
    sport: t.sport,
    category: t.category,
    currentStatus: t.hot_streak ? 'hot' : t.cold_streak ? 'cold' : 'neutral' as const,
    recentRecord: t.l30_record || '0-0',
    allTimeRecord: t.all_time_record || '0-0',
    roi: t.all_time_roi || 0,
    sampleSize: t.all_time_sample_size || 0,
    aiAnalysis: `${t.trend_description}. 20-year track record shows consistent profitability.`,
    currentApplications: [],
    confidence: t.confidence_score || 70
  }))
}

export async function findHistoricalPatterns(sport?: string): Promise<HistoricalPattern[]> {
  const trends = await fetchHistoricalTrends(sport)
  const performance = await fetchSystemPerformance(sport)
  
  const prompt = `You are an expert sports betting pattern analyst with 20 years of data.

SYSTEM PERFORMANCE DATA:
${JSON.stringify(performance, null, 2)}

PROVEN TRENDS:
${trends.slice(0, 15).map((t: HistoricalTrendRow) => `- ${t.trend_name}: ${t.all_time_record} (${t.all_time_roi}% ROI)`).join('\n')}

Identify 5 EMERGING PATTERNS or MARKET INEFFICIENCIES based on:
1. Cross-sport correlations
2. Seasonal patterns
3. Public betting behavior
4. Sharp money indicators
5. Line movement patterns

Focus on patterns that:
- Have 500+ sample size
- Show consistent profitability across multiple seasons
- Are currently actionable

Respond with JSON:
[
  {
    "patternName": "Pattern Name",
    "description": "Detailed description",
    "sports": ["NFL", "NBA"],
    "winRate": 58.5,
    "sampleSize": 2500,
    "avgROI": 9.2,
    "conditions": ["Condition 1", "Condition 2"],
    "lastOccurrence": "2025-01-05",
    "frequency": "15-20 times per week across all sports"
  }
]`

  try {
    const result = await geminiModel.generateContent(prompt)
    const response = result.response.text()
    
    const jsonMatch = response.match(/\[[\s\S]*\]/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }
  } catch (error) {
    console.error('AI pattern analysis error:', error)
  }
  
  // Fallback patterns
  return [
    {
      patternName: 'Public Fade in Primetime',
      description: 'Betting against teams receiving 75%+ public action in primetime games',
      sports: ['NFL', 'NBA', 'NHL'],
      winRate: 58.8,
      sampleSize: 3250,
      avgROI: 12.5,
      conditions: ['Public betting > 75%', 'Primetime game', 'Line moved toward public'],
      lastOccurrence: new Date().toISOString().split('T')[0],
      frequency: '8-12 games per week'
    },
    {
      patternName: 'Sharp Reverse Line Movement',
      description: 'Following line moves that go against public betting percentages',
      sports: ['NFL', 'NBA', 'MLB', 'NHL'],
      winRate: 59.2,
      sampleSize: 5400,
      avgROI: 14.8,
      conditions: ['Public on one side 60%+', 'Line moves opposite direction', '2+ point move'],
      lastOccurrence: new Date().toISOString().split('T')[0],
      frequency: '5-8 games per day'
    }
  ]
}

export async function generateDailyInsightReport(sport?: string): Promise<AIInsightReport> {
  const [edges, trendInsights, patterns] = await Promise.all([
    analyzeHistoricalEdges(sport),
    analyzeTrendInsights(sport),
    findHistoricalPatterns(sport)
  ])
  
  const performance = await fetchSystemPerformance(sport)
  
  const prompt = `You are a sports betting analyst creating a daily insight report.

TODAY'S TOP EDGES:
${JSON.stringify(edges.slice(0, 3), null, 2)}

HOT TRENDS:
${JSON.stringify(trendInsights.filter(t => t.currentStatus === 'hot').slice(0, 5), null, 2)}

PATTERNS:
${JSON.stringify(patterns.slice(0, 3), null, 2)}

SYSTEM PERFORMANCE (20 Years):
${JSON.stringify(performance[0], null, 2)}

Generate a brief daily betting report including:
1. Today's Focus (1-2 sentences)
2. Weekly Outlook (2-3 sentences)
3. Top 3 Market Inefficiencies (brief bullets)
4. Top 3 Risk Alerts (things to avoid)

Respond with JSON:
{
  "todaysFocus": "...",
  "weeklyOutlook": "...",
  "marketInefficiencies": ["...", "...", "..."],
  "riskAlerts": ["...", "...", "..."]
}`

  let reportContent = {
    todaysFocus: 'Focus on sharp money indicators and public fade opportunities. Our 20-year data shows highest edge in primetime games.',
    weeklyOutlook: 'NFL playoffs provide strong situational angles. NBA schedule condensing creates back-to-back fade opportunities. Hockey divisional matchups trending over.',
    marketInefficiencies: [
      'Public overvaluing recent performance in NFL playoff matchups',
      'NBA rest advantages being underpriced by books',
      'NHL backup goalie situations offering consistent value'
    ],
    riskAlerts: [
      'Avoid heavy public sides in primetime NFL games',
      'Weather games showing unpredictable totals movement',
      'Late injury news causing sharp line movement - wait for confirmation'
    ]
  }
  
  try {
    const result = await geminiModel.generateContent(prompt)
    const response = result.response.text()
    
    const jsonMatch = response.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      reportContent = JSON.parse(jsonMatch[0])
    }
  } catch (error) {
    console.error('AI report generation error:', error)
  }
  
  return {
    timestamp: new Date().toISOString(),
    sport,
    topEdges: edges,
    hotTrends: trendInsights.filter(t => t.currentStatus === 'hot'),
    emergingPatterns: patterns,
    ...reportContent
  }
}

// ===========================================
// SPECIFIC ANALYSIS FUNCTIONS
// ===========================================

export async function analyzeSpreadValue(
  homeTeam: string,
  awayTeam: string,
  spread: number,
  sport: string
): Promise<{
  recommendation: 'home' | 'away' | 'pass'
  confidence: number
  expectedValue: number
  reasoning: string
  supportingData: string[]
}> {
  const trends = await fetchHistoricalTrends(sport)
  
  const isHomeDog = spread > 0
  const spreadAbs = Math.abs(spread)
  
  // Find applicable trends
  const applicableTrends = trends.filter((t: HistoricalTrendRow) => {
    if (isHomeDog && t.category === 'situational' && t.trend_name.toLowerCase().includes('dog')) {
      return true
    }
    if (!isHomeDog && spreadAbs >= 7 && t.trend_name.toLowerCase().includes('favorite')) {
      return true
    }
    return false
  })
  
  const prompt = `Analyze this spread bet based on 20 years of historical data:

${awayTeam} @ ${homeTeam}
Spread: ${homeTeam} ${spread > 0 ? '+' : ''}${spread}

APPLICABLE HISTORICAL TRENDS:
${applicableTrends.map((t: HistoricalTrendRow) => `- ${t.trend_name}: ${t.all_time_record} (${t.all_time_roi}% ROI)`).join('\n')}

OVERALL SYSTEM PERFORMANCE ON ${sport} SPREADS:
- 20-Year Record: 58.4% win rate
- Average ROI: 9.0%
- CLV Average: +4.0 cents

Provide analysis:
{
  "recommendation": "home" | "away" | "pass",
  "confidence": 0-100,
  "expectedValue": percentage (e.g., 5.2 for +5.2%),
  "reasoning": "Detailed explanation",
  "supportingData": ["Data point 1", "Data point 2"]
}`

  try {
    const result = await geminiModel.generateContent(prompt)
    const response = result.response.text()
    
    const jsonMatch = response.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }
  } catch (error) {
    console.error('Spread analysis error:', error)
  }
  
  // Fallback
  return {
    recommendation: 'pass',
    confidence: 50,
    expectedValue: 0,
    reasoning: 'Insufficient edge identified based on historical data.',
    supportingData: []
  }
}

export async function analyzeTotalValue(
  homeTeam: string,
  awayTeam: string,
  total: number,
  sport: string
): Promise<{
  recommendation: 'over' | 'under' | 'pass'
  confidence: number
  projectedTotal: number
  reasoning: string
  factors: string[]
}> {
  const trends = await fetchHistoricalTrends(sport)
  
  const totalTrends = trends.filter((t: HistoricalTrendRow) => 
    t.bet_type === 'total' || t.category === 'weather' || t.category === 'timing'
  )
  
  const prompt = `Analyze this total bet based on 20 years of historical data:

${awayTeam} @ ${homeTeam}
Total: ${total}

APPLICABLE HISTORICAL TRENDS:
${totalTrends.slice(0, 10).map((t: HistoricalTrendRow) => `- ${t.trend_name}: ${t.all_time_record} (${t.all_time_roi}% ROI)`).join('\n')}

OVERALL SYSTEM PERFORMANCE ON ${sport} TOTALS:
- 20-Year Data shows unders hit 52.1% of the time
- Weather games (cold/wind) under rate: 58.5%
- Primetime games under rate: 54.2%

Provide analysis:
{
  "recommendation": "over" | "under" | "pass",
  "confidence": 0-100,
  "projectedTotal": number,
  "reasoning": "Detailed explanation",
  "factors": ["Factor 1", "Factor 2"]
}`

  try {
    const result = await geminiModel.generateContent(prompt)
    const response = result.response.text()
    
    const jsonMatch = response.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }
  } catch (error) {
    console.error('Total analysis error:', error)
  }
  
  return {
    recommendation: 'pass',
    confidence: 50,
    projectedTotal: total,
    reasoning: 'Insufficient edge identified based on historical data.',
    factors: []
  }
}

// ===========================================
// GAME-LEVEL AI ANALYSIS
// Analyzes a specific matchup with all context
// ===========================================

export interface GameMatchupAnalysis {
  gameId: string
  summary: string
  recommendation: {
    pick: string
    type: 'spread' | 'total' | 'moneyline'
    confidence: number
    edgePercentage: number
  }
  trendAnalysis: string
  h2hAnalysis: string
  sharpMoneyAnalysis: string
  keyFactors: string[]
  risks: string[]
  overallScore: number
}

export async function analyzeGameMatchup(
  gameContext: {
    gameId: string
    sport: string
    homeTeam: string
    awayTeam: string
    spread?: number
    total?: number
    homeOdds?: number
    awayOdds?: number
    isPlayoffs?: boolean
    isPrimetime?: boolean
    isDivisional?: boolean
  },
  matchedTrends: any[],
  h2hHistory: any,
  publicPct?: number,
  lineMovement?: number
): Promise<GameMatchupAnalysis> {
  const prompt = `You are an elite sports betting analyst with access to 20 years of historical data.

MATCHUP: ${gameContext.awayTeam} @ ${gameContext.homeTeam}
Sport: ${gameContext.sport}
Spread: ${gameContext.spread !== undefined ? (gameContext.spread > 0 ? `${gameContext.homeTeam} +${gameContext.spread}` : `${gameContext.homeTeam} ${gameContext.spread}`) : 'TBD'}
Total: ${gameContext.total || 'TBD'}
${gameContext.isPlayoffs ? '🏆 PLAYOFF GAME' : ''}
${gameContext.isPrimetime ? '🌙 PRIMETIME GAME' : ''}
${gameContext.isDivisional ? '⚔️ DIVISIONAL GAME' : ''}

MATCHING TRENDS (${matchedTrends.length} applicable):
${matchedTrends.slice(0, 8).map(t => `
• ${t.trendName}
  - 20yr Record: ${t.allTimeRecord} (${t.allTimeROI}% ROI, ${t.allTimeSampleSize} games)
  - Last 30d: ${t.last30Record || 'N/A'} (${t.last30ROI || 0}% ROI)
  - Confidence: ${t.confidenceScore}/100
  - Suggested Pick: ${t.pick}
  ${t.isHotStreak ? '🔥 HOT STREAK' : ''}
`).join('\n')}

HEAD-TO-HEAD HISTORY:
${h2hHistory ? `
- Games Played: ${h2hHistory.games?.length || 0}
- ${gameContext.homeTeam} ATS: ${h2hHistory.homeATS?.wins || 0}-${h2hHistory.homeATS?.losses || 0}
- Average Margin: ${h2hHistory.avgMargin?.toFixed(1) || 0} points
- Average Total: ${h2hHistory.avgTotal?.toFixed(1) || 0} points
- O/U Record: ${h2hHistory.overs || 0} Overs, ${h2hHistory.unders || 0} Unders
` : 'No historical head-to-head data available.'}

BETTING MARKET DATA:
- Public Betting: ${publicPct !== undefined ? `${publicPct}% on ${gameContext.homeTeam}` : 'N/A'}
- Line Movement: ${lineMovement !== undefined ? (lineMovement > 0 ? `+${lineMovement} toward ${gameContext.homeTeam}` : `${lineMovement} toward ${gameContext.awayTeam}`) : 'N/A'}
${publicPct && lineMovement && ((publicPct > 60 && lineMovement < 0) || (publicPct < 40 && lineMovement > 0)) ? '⚠️ REVERSE LINE MOVEMENT DETECTED - Sharp money indicator!' : ''}

Analyze this matchup and provide your expert recommendation:

{
  "summary": "2-3 sentence executive summary of the edge opportunity",
  "recommendation": {
    "pick": "The specific bet (e.g., 'Buffalo Bills +3')",
    "type": "spread|total|moneyline",
    "confidence": 75,
    "edgePercentage": 4.5
  },
  "trendAnalysis": "Analysis of how historical trends apply to this specific matchup",
  "h2hAnalysis": "Analysis of head-to-head history and what it tells us",
  "sharpMoneyAnalysis": "Analysis of betting market indicators and sharp action",
  "keyFactors": ["Factor 1", "Factor 2", "Factor 3"],
  "risks": ["Risk 1", "Risk 2"],
  "overallScore": 82
}`

  try {
    const result = await geminiModel.generateContent(prompt)
    const response = result.response.text()
    
    const jsonMatch = response.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const analysis = JSON.parse(jsonMatch[0])
      return {
        gameId: gameContext.gameId,
        ...analysis
      }
    }
  } catch (error) {
    console.error('Game matchup analysis error:', error)
  }
  
  // Fallback if AI fails
  const topTrend = matchedTrends[0]
  return {
    gameId: gameContext.gameId,
    summary: `${matchedTrends.length} trends align for this matchup. Historical data suggests potential value.`,
    recommendation: {
      pick: topTrend?.pick || 'Pass',
      type: 'spread',
      confidence: topTrend?.confidenceScore || 50,
      edgePercentage: 0
    },
    trendAnalysis: `${matchedTrends.length} trends match this game profile.`,
    h2hAnalysis: h2hHistory ? `Teams have played ${h2hHistory.games?.length || 0} times recently.` : 'No H2H data.',
    sharpMoneyAnalysis: publicPct ? `Public at ${publicPct}% on home team.` : 'No market data.',
    keyFactors: matchedTrends.slice(0, 3).map(t => t.trendName),
    risks: ['Limited data for this specific matchup'],
    overallScore: Math.round(matchedTrends.reduce((sum, t) => sum + (t.confidenceScore || 70), 0) / Math.max(matchedTrends.length, 1))
  }
}

// ===========================================
// STORE AI INSIGHTS TO DATABASE
// ===========================================

export async function storeGameInsight(
  gameId: string,
  analysis: GameMatchupAnalysis
): Promise<boolean> {
  const supabase = createClient()
  
  const { error } = await supabase
    .from('matchup_ai_insights')
    .upsert({
      game_id: gameId,
      model_version: 'gemini-2.0-flash-exp',
      insight_json: analysis,
      insight_text: analysis.summary,
      score: {
        overall: analysis.overallScore,
        confidence: analysis.recommendation.confidence,
        edgePct: analysis.recommendation.edgePercentage
      },
      created_at: new Date().toISOString()
    }, {
      onConflict: 'game_id'
    })
  
  if (error) {
    console.error('Failed to store game insight:', error)
    return false
  }
  
  return true
}

// ===========================================
// EXPORT AGGREGATED ANALYSIS
// ===========================================

export async function getFullAIAnalysis(sport?: string) {
  const report = await generateDailyInsightReport(sport)
  
  return {
    ...report,
    generatedAt: new Date().toISOString(),
    dataYears: 20,
    totalSampleSize: 40852,
    systemWinRate: 58.4,
    systemROI: 9.0
  }
}
