// =============================================================================
// EDGE DASHBOARD WITH FILTERS WRAPPER - Server Component that wraps the filtered client component
// =============================================================================

import { EdgeDashboardFiltered, EdgeCard } from './EdgeDashboardFiltered'

interface TodayEdgesResponse {
  edges: EdgeCard[]
  total: number
  isDemo?: boolean
}

async function getTodayEdges(): Promise<TodayEdgesResponse> {
  // During CI/build time (Vercel sets CI=1), return demo data to prevent API failures
  // At runtime (when CI is not set), fetch real data
  if (process.env.CI === '1') {
    return { edges: getDemoEdges(), total: 12, isDemo: true }
  }
  
  try {
    // In production, this would be the full URL
    const baseUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    
    const res = await fetch(`${baseUrl}/api/edges/today?limit=12&minScore=60`, {
      next: { revalidate: 300 }, // Revalidate every 5 minutes
      signal: AbortSignal.timeout(10000) // 10 second timeout
    })
    
    if (!res.ok) {
      console.error('Failed to fetch today edges:', res.status)
      return { edges: getDemoEdges(), total: 0, isDemo: true }
    }
    
    return res.json()
  } catch (error) {
    console.error('Error fetching today edges:', error)
    // Return demo data on error
    return {
      edges: getDemoEdges(),
      total: 12,
      isDemo: true
    }
  }
}

// Demo data fallback - extended with more sports diversity
function getDemoEdges(): EdgeCard[] {
  return [
    // NFL Edges
    {
      gameId: 'demo-nfl-1',
      sport: 'NFL',
      sportIcon: '🏈',
      matchup: 'Commanders @ Eagles',
      gameTime: '1:00 PM',
      pick: 'Eagles -6',
      odds: '-110',
      edgeScore: 84,
      confidence: 84,
      trendCount: 4,
      topTrends: [
        'Home favorites in playoffs: 72% ATS',
        'Division rivalry games: 68% ATS'
      ],
      publicPct: 68,
      publicSide: 'away',
      sharpSide: 'home',
      lineMovement: '-1.5',
      isRLM: true,
      h2hRecord: '5-1 ATS L6',
      category: 'sports'
    },
    {
      gameId: 'demo-nfl-2',
      sport: 'NFL',
      sportIcon: '🏈',
      matchup: 'Ravens @ Bills',
      gameTime: '4:25 PM',
      pick: 'Bills +2.5',
      odds: '-105',
      edgeScore: 81,
      confidence: 81,
      trendCount: 5,
      topTrends: [
        'Home dogs +3 or less: 68% ATS',
        'Josh Allen at home: 71% ATS'
      ],
      publicPct: 74,
      publicSide: 'away',
      sharpSide: 'home',
      lineMovement: '+0.5',
      isRLM: true,
      h2hRecord: '4-2 ATS L6',
      category: 'sports'
    },
    {
      gameId: 'demo-nfl-3',
      sport: 'NFL',
      sportIcon: '🏈',
      matchup: 'Lions @ Vikings',
      gameTime: '8:15 PM',
      pick: 'Lions -3.5',
      odds: '-115',
      edgeScore: 77,
      confidence: 77,
      trendCount: 3,
      topTrends: [
        'Road favorites: 62% cover',
        'High-scoring teams in primetime: 59%'
      ],
      publicPct: 64,
      publicSide: 'away',
      h2hRecord: '3-1 ATS L4',
      category: 'sports'
    },
    // NBA Edges
    {
      gameId: 'demo-nba-1',
      sport: 'NBA',
      sportIcon: '🏀',
      matchup: 'Lakers @ Celtics',
      gameTime: '7:30 PM',
      pick: 'Under 224.5',
      odds: '-108',
      edgeScore: 78,
      confidence: 78,
      trendCount: 3,
      topTrends: [
        'Back-to-back unders: 64% hit rate',
        'Heavy favorite unders: 59% ATS'
      ],
      publicPct: 72,
      publicSide: 'away',
      lineMovement: '-2.5',
      h2hRecord: '3-2 U L5',
      category: 'sports'
    },
    {
      gameId: 'demo-nba-2',
      sport: 'NBA',
      sportIcon: '🏀',
      matchup: 'Warriors @ Suns',
      gameTime: '9:00 PM',
      pick: 'Warriors +5.5',
      odds: '-110',
      edgeScore: 76,
      confidence: 76,
      trendCount: 4,
      topTrends: [
        'Road dogs 5-7: 62% ATS',
        'Sharp money on dog: 65% win'
      ],
      publicPct: 65,
      publicSide: 'home',
      sharpSide: 'away',
      isRLM: true,
      h2hRecord: '3-1 ATS L4',
      category: 'sports'
    },
    {
      gameId: 'demo-nba-3',
      sport: 'NBA',
      sportIcon: '🏀',
      matchup: 'Thunder @ Cavs',
      gameTime: '5:00 PM',
      pick: 'Cavs -2.5',
      odds: '-105',
      edgeScore: 73,
      confidence: 73,
      trendCount: 3,
      topTrends: [
        'Home favorites short line: 58%',
        'Top seeds at home: 66% ATS'
      ],
      publicPct: 51,
      publicSide: 'away',
      h2hRecord: '2-2 ATS L4',
      category: 'sports'
    },
    // NHL Edges
    {
      gameId: 'demo-nhl-1',
      sport: 'NHL',
      sportIcon: '🏒',
      matchup: 'Maple Leafs @ Bruins',
      gameTime: '7:00 PM',
      pick: 'Bruins -1.5',
      odds: '+150',
      edgeScore: 72,
      confidence: 72,
      trendCount: 3,
      topTrends: [
        'Home favorites -1.5+: 58% cover',
        'Division rivalry games: 61% home'
      ],
      publicPct: 55,
      publicSide: 'home',
      sharpSide: 'home',
      h2hRecord: '2-3 PL L5',
      category: 'sports'
    },
    {
      gameId: 'demo-nhl-2',
      sport: 'NHL',
      sportIcon: '🏒',
      matchup: 'Oilers @ Kings',
      gameTime: '10:00 PM',
      pick: 'Over 6.5',
      odds: '-105',
      edgeScore: 70,
      confidence: 70,
      trendCount: 2,
      topTrends: [
        'High-scoring matchups: 62% over',
        'Pacific division games: 58% over'
      ],
      publicPct: 58,
      publicSide: 'away',
      h2hRecord: '4-1 O L5',
      category: 'sports'
    },
    // MLB Edges
    {
      gameId: 'demo-mlb-1',
      sport: 'MLB',
      sportIcon: '⚾',
      matchup: 'Yankees @ Red Sox',
      gameTime: '4:05 PM',
      pick: 'Over 9.5',
      odds: '-105',
      edgeScore: 69,
      confidence: 69,
      trendCount: 2,
      topTrends: [
        'Day game overs: 57% hit rate',
        'Rivalry games total movement'
      ],
      publicPct: 61,
      publicSide: 'home',
      lineMovement: '+0.5',
      category: 'sports'
    },
    {
      gameId: 'demo-mlb-2',
      sport: 'MLB',
      sportIcon: '⚾',
      matchup: 'Dodgers @ Giants',
      gameTime: '7:15 PM',
      pick: 'Dodgers -1.5',
      odds: '+135',
      edgeScore: 68,
      confidence: 68,
      trendCount: 2,
      topTrends: [
        'Heavy favorites run line: 54%',
        'West Coast night games: 56%'
      ],
      publicPct: 67,
      publicSide: 'away',
      h2hRecord: '3-2 RL L5',
      category: 'sports'
    },
    // NCAAF Edges
    {
      gameId: 'demo-ncaaf-1',
      sport: 'NCAAF',
      sportIcon: '🏈',
      matchup: 'Ohio State @ Michigan',
      gameTime: '12:00 PM',
      pick: 'Michigan +3.5',
      odds: '-110',
      edgeScore: 79,
      confidence: 79,
      trendCount: 4,
      topTrends: [
        'Home dogs rivalry: 66% ATS',
        'Big Ten at home: 61% cover'
      ],
      publicPct: 71,
      publicSide: 'away',
      sharpSide: 'home',
      isRLM: true,
      h2hRecord: '3-2 ATS L5',
      category: 'sports'
    },
    // NCAAB Edges  
    {
      gameId: 'demo-ncaab-1',
      sport: 'NCAAB',
      sportIcon: '🏀',
      matchup: 'Duke @ UNC',
      gameTime: '6:00 PM',
      pick: 'UNC +2',
      odds: '-105',
      edgeScore: 75,
      confidence: 75,
      trendCount: 3,
      topTrends: [
        'Home dogs ACC: 59% ATS',
        'Rivalry home teams: 63% cover'
      ],
      publicPct: 62,
      publicSide: 'away',
      sharpSide: 'home',
      h2hRecord: '4-2 ATS L6',
      category: 'sports'
    }
  ]
}

export async function EdgeDashboardWithFiltersWrapper() {
  const { edges } = await getTodayEdges()
  
  return <EdgeDashboardFiltered edges={edges} title="Today's Top Edges" showViewAll={true} />
}

export default EdgeDashboardWithFiltersWrapper
