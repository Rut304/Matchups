// News Analytics Integration - Real-time news for betting edge
// Integrates NEWS_API, ALPHA_VANTAGE, FINNHUB for comprehensive market intelligence

export type NewsSport = 'NFL' | 'NBA' | 'NHL' | 'MLB' | 'all'
export type NewsCategory = 'injury' | 'lineup' | 'weather' | 'coaching' | 'trade' | 'sentiment' | 'betting_line' | 'general'

export interface NewsArticle {
  id: string
  title: string
  summary: string
  source: string
  url: string
  publishedAt: string
  sport: NewsSport
  category: NewsCategory
  sentiment: 'bullish' | 'bearish' | 'neutral'
  impactedTeams: string[]
  bettingRelevance: 1 | 2 | 3 | 4 | 5 // How relevant to betting decisions
  keyPlayers?: string[]
  aiAnalysis?: string // Gemini analysis of betting impact
}

export interface InjuryReport {
  id: string
  playerName: string
  team: string
  sport: NewsSport
  status: 'out' | 'doubtful' | 'questionable' | 'probable' | 'gtd'
  injury: string
  updatedAt: string
  lineImpact?: number // Expected line movement in points
  aiRecommendation?: string
}

export interface WeatherImpact {
  gameId: string
  teams: { home: string; away: string }
  sport: 'NFL' | 'MLB'
  temperature: number
  wind: number // mph
  precipitation: number // % chance
  conditions: string
  bettingImpact: {
    totalAdjustment: number // Points to adjust total
    recommendation: string
    confidence: 1 | 2 | 3 | 4 | 5
  }
}

export interface SentimentAnalysis {
  topic: string
  sport: NewsSport
  sentiment: number // -100 to +100
  volume: number // Number of mentions
  trending: boolean
  relatedNews: string[]
  bettingAngle?: string
  timestamp: string
}

// =============================================================================
// NEWS DATA - Mock for now, will connect to APIs
// =============================================================================

export const latestNews: NewsArticle[] = [
  {
    id: 'news-1',
    title: 'Patrick Mahomes limited in practice with ankle injury',
    summary: 'Chiefs QB Patrick Mahomes was limited in Wednesday practice with an ankle injury sustained in Week 17. Officially listed as questionable for divisional round.',
    source: 'ESPN',
    url: 'https://espn.com',
    publishedAt: '2026-01-03T14:00:00Z',
    sport: 'NFL',
    category: 'injury',
    sentiment: 'bearish',
    impactedTeams: ['KC'],
    bettingRelevance: 5,
    keyPlayers: ['Patrick Mahomes'],
    aiAnalysis: 'Line has moved from KC -7 to KC -5.5. If Mahomes is limited, expect further movement to -4.5. EDGE: Wait for game-time decision, then hammer Chiefs if Mahomes active at deflated line.'
  },
  {
    id: 'news-2',
    title: 'Joel Embiid to rest against Celtics in nationally televised game',
    summary: '76ers star Joel Embiid will sit out Saturday\'s game against Boston for load management. This is his 3rd rest day in January.',
    source: 'The Athletic',
    url: 'https://theathletic.com',
    publishedAt: '2026-01-03T12:30:00Z',
    sport: 'NBA',
    category: 'lineup',
    sentiment: 'bearish',
    impactedTeams: ['PHI', 'BOS'],
    bettingRelevance: 5,
    keyPlayers: ['Joel Embiid'],
    aiAnalysis: 'Embiid rest games: 76ers are 4-11 ATS without him this season. Celtics opened -5.5, now -9.5. EDGE: Line is overreacting - take PHI +9.5 as 4-point move is excessive.'
  },
  {
    id: 'news-3',
    title: 'Bills expected to be without Josh Allen for Wild Card round',
    summary: 'BREAKING: Josh Allen listed as doubtful with elbow injury. Mitchell Trubisky likely to start Wild Card game.',
    source: 'NFL Network',
    url: 'https://nfl.com',
    publishedAt: '2026-01-03T11:00:00Z',
    sport: 'NFL',
    category: 'injury',
    sentiment: 'bearish',
    impactedTeams: ['BUF'],
    bettingRelevance: 5,
    keyPlayers: ['Josh Allen', 'Mitchell Trubisky'],
    aiAnalysis: 'This is a MASSIVE edge. Bills opened -7, if Allen is ruled out, line will crash to -1 or even pick. EDGE: If you have Bills -7, hedge. Fade Bills at current line if Allen confirmation comes.'
  },
  {
    id: 'news-4',
    title: 'Severe winter storm expected in Green Bay for Sunday\'s game',
    summary: 'AccuWeather forecasts 20+ mph winds and potential snow for Packers vs Lions. Temperature expected to be -5°F at kickoff.',
    source: 'AccuWeather',
    url: 'https://accuweather.com',
    publishedAt: '2026-01-03T10:00:00Z',
    sport: 'NFL',
    category: 'weather',
    sentiment: 'neutral',
    impactedTeams: ['GB', 'DET'],
    bettingRelevance: 4,
    aiAnalysis: 'Extreme cold + wind = UNDERS. Total opened 47, expect movement to 42-44. EDGE: Hammer Under 47 NOW before market adjusts. Wind will kill passing game for both teams.'
  },
  {
    id: 'news-5',
    title: 'Shohei Ohtani contract details reveal opt-out clause',
    summary: 'Newly released contract details show Ohtani can opt out after 2028 season. Dodgers future market implications.',
    source: 'MLB Network',
    url: 'https://mlb.com',
    publishedAt: '2026-01-03T09:00:00Z',
    sport: 'MLB',
    category: 'trade',
    sentiment: 'neutral',
    impactedTeams: ['LAD'],
    bettingRelevance: 2,
    aiAnalysis: 'Futures impact only. No immediate betting edge but worth monitoring for 2028+ World Series odds.'
  },
  {
    id: 'news-6',
    title: 'Connor McDavid day-to-day with lower body injury',
    summary: 'Oilers star Connor McDavid missed practice Thursday with a lower body injury. Status uncertain for weekend games.',
    source: 'TSN',
    url: 'https://tsn.ca',
    publishedAt: '2026-01-03T16:00:00Z',
    sport: 'NHL',
    category: 'injury',
    sentiment: 'bearish',
    impactedTeams: ['EDM'],
    bettingRelevance: 5,
    keyPlayers: ['Connor McDavid'],
    aiAnalysis: 'McDavid is 35% of Oilers offense. Without him: Oilers are 2-7 SU, 3-6 ATS. EDGE: Fade Oilers until McDavid confirmed. Puckline value on opponents.'
  },
  {
    id: 'news-7',
    title: 'Sharp money hammering Thunder -6.5 vs Nuggets',
    summary: 'Per Action Network, 78% of money on OKC despite only 45% of tickets. Classic sharp vs public split.',
    source: 'Action Network',
    url: 'https://actionnetwork.com',
    publishedAt: '2026-01-03T15:00:00Z',
    sport: 'NBA',
    category: 'betting_line',
    sentiment: 'bullish',
    impactedTeams: ['OKC', 'DEN'],
    bettingRelevance: 4,
    aiAnalysis: 'Reverse line movement detected. Line opened OKC -5, now -6.5 despite public on Denver. EDGE: Follow the money - OKC -6.5 is sharp play.'
  },
  {
    id: 'news-8',
    title: 'Lakers announce lineup changes: Austin Reaves to start at PG',
    summary: 'D\'Angelo Russell moved to bench in favor of Reaves. Ham says change is permanent going forward.',
    source: 'Lakers Nation',
    url: 'https://lakersnation.com',
    publishedAt: '2026-01-03T13:00:00Z',
    sport: 'NBA',
    category: 'lineup',
    sentiment: 'bullish',
    impactedTeams: ['LAL'],
    bettingRelevance: 3,
    keyPlayers: ['Austin Reaves', 'D\'Angelo Russell'],
    aiAnalysis: 'Reaves as starter improves Lakers defense. Monitor Lakers spreads next 5 games for market adjustment period. Slight bullish lean.'
  }
]

export const injuryReports: InjuryReport[] = [
  { id: 'inj-1', playerName: 'Patrick Mahomes', team: 'KC', sport: 'NFL', status: 'questionable', injury: 'Ankle', updatedAt: '2026-01-03T14:00:00Z', lineImpact: 2.5, aiRecommendation: 'Wait for game-time decision' },
  { id: 'inj-2', playerName: 'Josh Allen', team: 'BUF', sport: 'NFL', status: 'doubtful', injury: 'Elbow', updatedAt: '2026-01-03T11:00:00Z', lineImpact: 7.0, aiRecommendation: 'Fade Bills if Allen out' },
  { id: 'inj-3', playerName: 'Joel Embiid', team: 'PHI', sport: 'NBA', status: 'out', injury: 'Rest', updatedAt: '2026-01-03T12:30:00Z', lineImpact: 4.0, aiRecommendation: 'Take PHI +9.5 - overreaction' },
  { id: 'inj-4', playerName: 'Connor McDavid', team: 'EDM', sport: 'NHL', status: 'gtd', injury: 'Lower Body', updatedAt: '2026-01-03T16:00:00Z', lineImpact: 1.5, aiRecommendation: 'Fade Oilers puckline' },
  { id: 'inj-5', playerName: 'Ja Morant', team: 'MEM', sport: 'NBA', status: 'questionable', injury: 'Shoulder', updatedAt: '2026-01-03T10:00:00Z', lineImpact: 3.0, aiRecommendation: 'Wait for update' },
  { id: 'inj-6', playerName: 'Davante Adams', team: 'NYJ', sport: 'NFL', status: 'probable', injury: 'Knee', updatedAt: '2026-01-03T09:00:00Z', lineImpact: 0.5, aiRecommendation: 'No significant impact' },
  { id: 'inj-7', playerName: 'Tyreek Hill', team: 'MIA', sport: 'NFL', status: 'questionable', injury: 'Ankle', updatedAt: '2026-01-03T13:00:00Z', lineImpact: 2.0, aiRecommendation: 'Monitor - affects total more than spread' },
  { id: 'inj-8', playerName: 'LeBron James', team: 'LAL', sport: 'NBA', status: 'probable', injury: 'Ankle', updatedAt: '2026-01-03T12:00:00Z', lineImpact: 1.0, aiRecommendation: 'Expected to play' },
]

export const weatherImpacts: WeatherImpact[] = [
  {
    gameId: 'weather-1',
    teams: { home: 'GB', away: 'DET' },
    sport: 'NFL',
    temperature: -5,
    wind: 22,
    precipitation: 40,
    conditions: 'Snow likely, extreme cold',
    bettingImpact: {
      totalAdjustment: -5,
      recommendation: 'STRONG UNDER - Hammer Under 47 before line moves',
      confidence: 5
    }
  },
  {
    gameId: 'weather-2',
    teams: { home: 'CHI', away: 'MIN' },
    sport: 'NFL',
    temperature: 15,
    wind: 18,
    precipitation: 10,
    conditions: 'Cold, windy',
    bettingImpact: {
      totalAdjustment: -3,
      recommendation: 'Lean Under - wind affects both passing games',
      confidence: 3
    }
  },
  {
    gameId: 'weather-3',
    teams: { home: 'CLE', away: 'PIT' },
    sport: 'NFL',
    temperature: 28,
    wind: 8,
    precipitation: 0,
    conditions: 'Cold but calm',
    bettingImpact: {
      totalAdjustment: 0,
      recommendation: 'No significant weather impact',
      confidence: 2
    }
  }
]

export const sentimentData: SentimentAnalysis[] = [
  {
    topic: 'Celtics Championship odds',
    sport: 'NBA',
    sentiment: 72,
    volume: 45000,
    trending: true,
    relatedNews: ['news-1'],
    bettingAngle: 'Public heavily on Celtics futures - possible value in fading',
    timestamp: '2025-02-11T15:00:00Z'
  },
  {
    topic: 'Thunder MVP race (SGA)',
    sport: 'NBA',
    sentiment: 85,
    volume: 23000,
    trending: true,
    relatedNews: ['news-7'],
    bettingAngle: 'Thunder receiving sharp money consistently - follow the trend',
    timestamp: '2026-01-03T14:00:00Z'
  },
  {
    topic: 'Bills playoff hopes',
    sport: 'NFL',
    sentiment: -45,
    volume: 67000,
    trending: true,
    relatedNews: ['news-3'],
    bettingAngle: 'Massive negative sentiment on Bills - contrarian buy low opportunity if Allen plays',
    timestamp: '2026-01-03T12:00:00Z'
  },
  {
    topic: 'Oilers Stanley Cup odds',
    sport: 'NHL',
    sentiment: 15,
    volume: 12000,
    trending: false,
    relatedNews: ['news-6'],
    bettingAngle: 'McDavid injury dampening sentiment - monitor for futures value',
    timestamp: '2026-01-03T16:00:00Z'
  }
]

// =============================================================================
// AI TREND DISCOVERY - Recursive learning patterns
// =============================================================================

export interface DiscoveredTrend {
  id: string
  title: string
  pattern: string
  confidence: number // 0-100
  sampleSize: number
  winRate: number
  roi: number
  discoveredAt: string
  status: 'new' | 'verified' | 'monitoring' | 'expired'
  aiExplanation: string
  actionable: boolean
}

export const aiDiscoveredTrends: DiscoveredTrend[] = [
  {
    id: 'ai-trend-1',
    title: 'Thursday TNT Games First Quarter Overs',
    pattern: 'TNT Thursday NBA games: 1Q overs hit 62.4% (83-50) when both teams rank top-15 in pace',
    confidence: 78,
    sampleSize: 133,
    winRate: 62.4,
    roi: 11.2,
    discoveredAt: '2026-01-02T00:00:00Z',
    status: 'verified',
    aiExplanation: 'Nationally televised games feature faster pace early as teams "show off" for audience. Books set 1Q totals based on season averages, not accounting for TNT effect.',
    actionable: true
  },
  {
    id: 'ai-trend-2',
    title: 'Post All-Star Break Road Dogs in Pacific Time',
    pattern: 'NBA road underdogs from Eastern Conference playing in Pacific timezone after All-Star break cover 57.8% ATS',
    confidence: 71,
    sampleSize: 147,
    winRate: 57.8,
    roi: 8.4,
    discoveredAt: '2026-01-01T00:00:00Z',
    status: 'verified',
    aiExplanation: 'East teams more focused post-ASB. Pacific timezone road games have lower public interest, creating inflated lines on home favorites.',
    actionable: true
  },
  {
    id: 'ai-trend-3',
    title: 'Monday Night Football Under After Bye Week',
    pattern: 'MNF unders hit 64% when one team is coming off bye and total is 47+',
    confidence: 68,
    sampleSize: 89,
    winRate: 64.0,
    roi: 12.8,
    discoveredAt: '2025-12-28T00:00:00Z',
    status: 'verified',
    aiExplanation: 'Post-bye teams often start slow despite public expecting explosive offense. High totals (47+) indicate public overreaction to "rested team" narrative.',
    actionable: true
  },
  {
    id: 'ai-trend-4',
    title: 'NHL Back-to-Back Puckline Dogs',
    pattern: 'Home underdogs on 2nd night of back-to-back: +1.5 puckline hits 71.2% when opponent traveled 500+ miles',
    confidence: 82,
    sampleSize: 156,
    winRate: 71.2,
    roi: 14.6,
    discoveredAt: '2026-01-03T00:00:00Z',
    status: 'new',
    aiExplanation: 'Market undervalues home ice advantage when team is fatigued. Travel-weary favorites often win but fail to cover -1.5. Elite +EV spot.',
    actionable: true
  },
  {
    id: 'ai-trend-5',
    title: 'MLB Day Game After Night Game Unders',
    pattern: 'Day game unders after night game (both teams): F5 under hits 58.3%',
    confidence: 65,
    sampleSize: 234,
    winRate: 58.3,
    roi: 7.2,
    discoveredAt: '2025-12-30T00:00:00Z',
    status: 'monitoring',
    aiExplanation: 'Quick turnaround affects pitcher stamina and hitter timing. F5 (first 5 innings) isolates starting pitcher effect before bullpens.',
    actionable: true
  },
  {
    id: 'ai-trend-6',
    title: 'NFL Divisional Playoff Underdogs',
    pattern: 'Divisional round underdogs +6 or more: 62% ATS over last 10 seasons',
    confidence: 88,
    sampleSize: 42,
    winRate: 62.0,
    roi: 15.4,
    discoveredAt: '2026-01-03T00:00:00Z',
    status: 'verified',
    aiExplanation: 'Wild Card winners playing with house money. Public overrates top seeds after bye week. Books shade lines toward favorites, creating value on dogs.',
    actionable: true
  }
]

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

export const getNewsBySport = (sport: NewsSport): NewsArticle[] => {
  if (sport === 'all') return latestNews
  return latestNews.filter(n => n.sport === sport)
}

export const getNewsByCategory = (category: NewsCategory): NewsArticle[] => {
  return latestNews.filter(n => n.category === category)
}

export const getHighImpactNews = (minRelevance: number = 4): NewsArticle[] => {
  return latestNews.filter(n => n.bettingRelevance >= minRelevance)
}

export const getInjuriesBySport = (sport: NewsSport): InjuryReport[] => {
  if (sport === 'all') return injuryReports
  return injuryReports.filter(i => i.sport === sport)
}

export const getCriticalInjuries = (): InjuryReport[] => {
  return injuryReports.filter(i => i.status === 'out' || i.status === 'doubtful')
}

export const getActionableTrends = (): DiscoveredTrend[] => {
  return aiDiscoveredTrends.filter(t => t.actionable && t.status !== 'expired')
}

export const getNewTrends = (): DiscoveredTrend[] => {
  return aiDiscoveredTrends.filter(t => t.status === 'new')
}

// News summary for dashboard
export const newsSummary = {
  totalArticles: latestNews.length,
  highImpact: latestNews.filter(n => n.bettingRelevance >= 4).length,
  injuries: injuryReports.length,
  criticalInjuries: injuryReports.filter(i => i.status === 'out' || i.status === 'doubtful').length,
  weatherAlerts: weatherImpacts.filter(w => w.bettingImpact.confidence >= 4).length,
  trendingTopics: sentimentData.filter(s => s.trending).length,
  aiDiscoveredTrends: aiDiscoveredTrends.length,
  newTrends: aiDiscoveredTrends.filter(t => t.status === 'new').length
}
