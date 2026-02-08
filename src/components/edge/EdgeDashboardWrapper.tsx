// =============================================================================
// EDGE DASHBOARD WRAPPER - Server Component for fetching today's edges
// =============================================================================

import { EdgeDashboard, EdgeCard } from './EdgeDashboard'

interface TodayEdgesResponse {
  edges: EdgeCard[]
  total: number
  isDemo?: boolean
}

async function getTodayEdges(): Promise<TodayEdgesResponse> {
  try {
    // In production, this would be the full URL
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    
    const res = await fetch(`${baseUrl}/api/edges/today?limit=6&minScore=60`, {
      next: { revalidate: 300 } // Revalidate every 5 minutes
    })
    
    if (!res.ok) {
      console.error('Failed to fetch today edges:', res.status)
      return { edges: [], total: 0 }
    }
    
    return res.json()
  } catch (error) {
    console.error('Error fetching today edges:', error)
    // Return empty - NO fake data
    return {
      edges: [],
      total: 0,
      isDemo: false
    }
  }
}

// DEPRECATED: Demo data removed - was showing fake games
function getDemoEdges_REMOVED(): EdgeCard[] {
  return [
    {
      gameId: 'demo-1',
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
        'Home favorites in playoff: 72% ATS',
        'Division rivalry games: 68% ATS'
      ],
      publicPct: 68,
      publicSide: 'away',
      sharpSide: 'home',
      lineMovement: '-1.5',
      isRLM: true,
      h2hRecord: '5-1 ATS L6'
    },
    {
      gameId: 'demo-2',
      sport: 'NBA',
      sportIcon: '🏀',
      matchup: 'Cavaliers @ Celtics',
      gameTime: '7:30 PM',
      pick: 'Under 224.5',
      odds: '-108',
      edgeScore: 78,
      confidence: 78,
      trendCount: 3,
      topTrends: [
        'Back-to-back unders: 64% hit rate',
        'Top teams defense: 59% under'
      ],
      publicPct: 72,
      publicSide: 'away',
      lineMovement: '-2.5',
      h2hRecord: '3-2 U L5'
    },
    {
      gameId: 'demo-3',
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
      h2hRecord: '2-3 PL L5'
    },
    {
      gameId: 'demo-4',
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
      lineMovement: '+0.5'
    },
    {
      gameId: 'demo-5',
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
      h2hRecord: '3-1 ATS L4'
    },
    {
      gameId: 'demo-6',
      sport: 'NFL',
      sportIcon: '🏈',
      matchup: 'Eagles @ Cowboys',
      gameTime: '4:25 PM',
      pick: 'Cowboys +3',
      odds: '-105',
      edgeScore: 81,
      confidence: 81,
      trendCount: 5,
      topTrends: [
        'Home dogs divisional: 68% ATS',
        'Prime time contrarian: 64% ATS'
      ],
      publicPct: 74,
      publicSide: 'away',
      sharpSide: 'home',
      lineMovement: '+0.5',
      isRLM: true,
      h2hRecord: '4-2 ATS L6'
    }
  ]
}

export async function EdgeDashboardWrapper() {
  const { edges } = await getTodayEdges()
  
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <EdgeDashboard edges={edges} title="Today's Top Edges" showViewAll={true} />
    </section>
  )
}

export default EdgeDashboardWrapper
