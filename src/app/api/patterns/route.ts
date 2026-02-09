import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Historical pattern types
interface HistoricalPattern {
  id: string
  name: string
  description: string
  sport: string
  category: 'situational' | 'trend' | 'revenge' | 'rest' | 'weather' | 'divisional'
  conditions: string[]
  historicalRecord: {
    wins: number
    losses: number
    pushes: number
    winRate: number
    roi: number
  }
  sampleSize: number
  lastHit: string
  currentMatches: MatchingGame[]
  confidenceScore: number
}

interface MatchingGame {
  gameId: string
  sport: string
  homeTeam: string
  awayTeam: string
  gameTime: string
  matchedConditions: string[]
  recommendedBet: string
  edge: number
}

// DEPRECATED: Static patterns - now fetched from historical_trends table in Supabase
// Keeping ARCHIVED_PATTERNS for reference only - NOT EXPORTED
const ARCHIVED_HISTORICAL_PATTERNS: Record<string, HistoricalPattern[]> = {
  NFL: [
    {
      id: 'nfl-home-dog-div',
      name: 'Home Dogs in Divisional Games',
      description: 'Home underdogs of 3+ points in divisional matchups',
      sport: 'NFL',
      category: 'divisional',
      conditions: ['Home team', 'Underdog +3 or more', 'Divisional opponent'],
      historicalRecord: { wins: 287, losses: 234, pushes: 12, winRate: 55.0, roi: 8.2 },
      sampleSize: 533,
      lastHit: '2026-01-12',
      currentMatches: [],
      confidenceScore: 78,
    },
    {
      id: 'nfl-primetime-under',
      name: 'Primetime Game Unders',
      description: 'Unders in nationally televised games (SNF/MNF/TNF)',
      sport: 'NFL',
      category: 'situational',
      conditions: ['Primetime game', 'Total > 44', 'Both teams above .500'],
      historicalRecord: { wins: 156, losses: 132, pushes: 8, winRate: 54.2, roi: 6.4 },
      sampleSize: 296,
      lastHit: '2026-01-09',
      currentMatches: [],
      confidenceScore: 72,
    },
    {
      id: 'nfl-revenge-spot',
      name: 'Revenge Game ATS',
      description: 'Team facing opponent that beat them earlier this season',
      sport: 'NFL',
      category: 'revenge',
      conditions: ['Lost to opponent earlier in season', 'At home', 'Spread within 7'],
      historicalRecord: { wins: 198, losses: 167, pushes: 9, winRate: 54.3, roi: 6.8 },
      sampleSize: 374,
      lastHit: '2026-01-05',
      currentMatches: [],
      confidenceScore: 70,
    },
    {
      id: 'nfl-short-week-dog',
      name: 'Short Week Dogs',
      description: 'Road underdogs on short rest (TNF following Sunday)',
      sport: 'NFL',
      category: 'rest',
      conditions: ['Thursday game', 'Road underdog', 'Short week'],
      historicalRecord: { wins: 89, losses: 71, pushes: 4, winRate: 55.6, roi: 9.1 },
      sampleSize: 164,
      lastHit: '2026-01-02',
      currentMatches: [],
      confidenceScore: 75,
    },
    {
      id: 'nfl-cold-weather-under',
      name: 'Cold Weather Unders',
      description: 'Games played in sub-32°F temperatures',
      sport: 'NFL',
      category: 'weather',
      conditions: ['Temperature below 32°F', 'Outdoor stadium', 'Wind > 10mph'],
      historicalRecord: { wins: 134, losses: 108, pushes: 6, winRate: 55.4, roi: 7.9 },
      sampleSize: 248,
      lastHit: '2026-01-12',
      currentMatches: [],
      confidenceScore: 74,
    },
  ],
  NBA: [
    {
      id: 'nba-b2b-road',
      name: 'Back-to-Back Road Dogs',
      description: 'Road underdogs on second night of back-to-back',
      sport: 'NBA',
      category: 'rest',
      conditions: ['Second night of B2B', 'Road team', 'Underdog'],
      historicalRecord: { wins: 892, losses: 798, pushes: 34, winRate: 52.7, roi: 4.2 },
      sampleSize: 1724,
      lastHit: '2026-01-13',
      currentMatches: [],
      confidenceScore: 68,
    },
    {
      id: 'nba-revenge-home',
      name: 'Home Revenge Games',
      description: 'Home team lost to opponent by 15+ on the road',
      sport: 'NBA',
      category: 'revenge',
      conditions: ['Home team', 'Lost previous matchup by 15+', 'Within 30 days'],
      historicalRecord: { wins: 345, losses: 278, pushes: 12, winRate: 55.4, roi: 7.8 },
      sampleSize: 635,
      lastHit: '2026-01-11',
      currentMatches: [],
      confidenceScore: 73,
    },
    {
      id: 'nba-3-in-4-fade',
      name: '3 Games in 4 Nights Fade',
      description: 'Fade favorites playing 3rd game in 4 nights',
      sport: 'NBA',
      category: 'rest',
      conditions: ['3rd game in 4 nights', 'Favorite', 'Spread > 5'],
      historicalRecord: { wins: 234, losses: 189, pushes: 8, winRate: 55.3, roi: 7.4 },
      sampleSize: 431,
      lastHit: '2026-01-10',
      currentMatches: [],
      confidenceScore: 71,
    },
    {
      id: 'nba-altitude',
      name: 'Mile High Advantage',
      description: 'Denver/Utah home dogs at altitude',
      sport: 'NBA',
      category: 'situational',
      conditions: ['Denver or Utah home', 'Underdog', 'Opponent sea level team'],
      historicalRecord: { wins: 167, losses: 134, pushes: 5, winRate: 55.5, roi: 8.3 },
      sampleSize: 306,
      lastHit: '2026-01-08',
      currentMatches: [],
      confidenceScore: 74,
    },
  ],
  MLB: [
    {
      id: 'mlb-ace-fade',
      name: 'Fade Public Ace',
      description: 'Fade heavily bet aces at home vs underdog',
      sport: 'MLB',
      category: 'situational',
      conditions: ['Home ace pitcher', 'Line > -180', 'Public % > 70%'],
      historicalRecord: { wins: 456, losses: 398, pushes: 0, winRate: 53.4, roi: 5.2 },
      sampleSize: 854,
      lastHit: '2025-10-15',
      currentMatches: [],
      confidenceScore: 66,
    },
    {
      id: 'mlb-day-after-night',
      name: 'Day Game After Night',
      description: 'Road team in day game after night game',
      sport: 'MLB',
      category: 'rest',
      conditions: ['Day game', 'Road team played night game prior', 'Underdog'],
      historicalRecord: { wins: 623, losses: 567, pushes: 0, winRate: 52.4, roi: 3.8 },
      sampleSize: 1190,
      lastHit: '2025-10-12',
      currentMatches: [],
      confidenceScore: 62,
    },
    {
      id: 'mlb-wind-blowing-out',
      name: 'Wind Blowing Out Overs',
      description: 'Overs when wind blowing out > 12mph',
      sport: 'MLB',
      category: 'weather',
      conditions: ['Wind blowing out', 'Speed > 12mph', 'Day game'],
      historicalRecord: { wins: 289, losses: 243, pushes: 0, winRate: 54.3, roi: 6.7 },
      sampleSize: 532,
      lastHit: '2025-09-28',
      currentMatches: [],
      confidenceScore: 69,
    },
  ],
  NHL: [
    {
      id: 'nhl-b2b-home',
      name: 'Home Team B2B Fade',
      description: 'Fade home favorites on back-to-back',
      sport: 'NHL',
      category: 'rest',
      conditions: ['Home favorite', 'Second night of B2B', 'Line > -150'],
      historicalRecord: { wins: 178, losses: 156, pushes: 0, winRate: 53.3, roi: 4.8 },
      sampleSize: 334,
      lastHit: '2026-01-11',
      currentMatches: [],
      confidenceScore: 65,
    },
    {
      id: 'nhl-goalie-revenge',
      name: 'Goalie Revenge Game',
      description: 'Goalie facing former team first time',
      sport: 'NHL',
      category: 'revenge',
      conditions: ['Starting goalie vs former team', 'First meeting of season'],
      historicalRecord: { wins: 123, losses: 98, pushes: 0, winRate: 55.7, roi: 9.2 },
      sampleSize: 221,
      lastHit: '2026-01-09',
      currentMatches: [],
      confidenceScore: 72,
    },
    {
      id: 'nhl-travel-under',
      name: 'Cross-Country Travel Under',
      description: 'Unders when team travels 2+ time zones',
      sport: 'NHL',
      category: 'rest',
      conditions: ['Road team traveled 2+ time zones', 'First game of road trip'],
      historicalRecord: { wins: 145, losses: 121, pushes: 0, winRate: 54.5, roi: 6.9 },
      sampleSize: 266,
      lastHit: '2026-01-07',
      currentMatches: [],
      confidenceScore: 68,
    },
  ],
}

// Note: generateCurrentMatches removed - NO FAKE DATA policy
// Current matching games should be determined by actual game schedule and conditions
// For now, return patterns without fake current matches
function addEmptyMatchesField(patterns: HistoricalPattern[]): HistoricalPattern[] {
  return patterns.map(pattern => ({
    ...pattern,
    currentMatches: [] // Empty until real game-matching logic is implemented
  }))
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const sport = searchParams.get('sport') || 'all'
  const category = searchParams.get('category') || 'all'
  const minConfidence = parseInt(searchParams.get('minConfidence') || '0')
  const withMatches = searchParams.get('withMatches') === 'true'
  
  try {
    const supabase = await createClient()
    
    // Fetch patterns from historical_trends table (REAL DATA from database)
    let query = supabase
      .from('historical_trends')
      .select('*')
    
    if (sport !== 'all') {
      query = query.eq('sport', sport.toUpperCase())
    }
    
    if (category !== 'all') {
      query = query.eq('category', category)
    }
    
    if (minConfidence > 0) {
      query = query.gte('confidence_score', minConfidence)
    }

    const { data: trends, error } = await query.order('confidence_score', { ascending: false })
    
    if (error) {
      console.error('Error fetching patterns from DB:', error)
      return NextResponse.json({ 
        patterns: [], 
        meta: { totalPatterns: 0, totalMatches: 0, avgWinRate: 0, avgRoi: 0, categories: [] },
        error: 'Database error - no patterns available' 
      })
    }
    
    if (!trends || trends.length === 0) {
      return NextResponse.json({ 
        patterns: [], 
        meta: { totalPatterns: 0, totalMatches: 0, avgWinRate: 0, avgRoi: 0, categories: [] },
        message: 'No patterns found in database - run trend discovery cron to populate' 
      })
    }
    
    // Transform DB rows to HistoricalPattern format
    const patterns: HistoricalPattern[] = trends.map(t => {
      // Parse record string like "1782-1423" to get wins/losses
      const recordParts = (t.all_time_record || '0-0').split('-').map(Number)
      const wins = recordParts[0] || 0
      const losses = recordParts[1] || 0
      const pushes = recordParts[2] || 0
      
      return {
        id: t.trend_id,
        name: t.trend_name,
        description: t.trend_description || '',
        sport: t.sport,
        category: t.category as HistoricalPattern['category'],
        conditions: t.conditions || [],
        historicalRecord: {
          wins,
          losses,
          pushes,
          winRate: wins + losses > 0 ? (wins / (wins + losses)) * 100 : 0,
          roi: t.all_time_roi || 0
        },
        sampleSize: t.all_time_sample_size || wins + losses + pushes,
        lastHit: t.last_hit_date || '',
        currentMatches: [], // Real game matching TBD
        confidenceScore: t.confidence_score || 50
      }
    })
    
    // Filter to only patterns with matches if requested
    if (withMatches) {
      // No patterns have matches yet (game matching not implemented)
      return NextResponse.json({ 
        patterns: [], 
        meta: { totalPatterns: 0, totalMatches: 0, avgWinRate: 0, avgRoi: 0 },
        message: 'No matched games for today' 
      })
    }
    
    // Sort by confidence score
    patterns.sort((a, b) => b.confidenceScore - a.confidenceScore)
    
    // Calculate summary stats
    const totalPatterns = patterns.length
    const totalMatches = patterns.reduce((sum, p) => sum + p.currentMatches.length, 0)
    const avgWinRate = patterns.length > 0 
      ? patterns.reduce((sum, p) => sum + p.historicalRecord.winRate, 0) / patterns.length 
      : 0
    const avgRoi = patterns.length > 0 
      ? patterns.reduce((sum, p) => sum + p.historicalRecord.roi, 0) / patterns.length 
      : 0
    
    return NextResponse.json({
      patterns,
      meta: {
        totalPatterns,
        totalMatches,
        avgWinRate: Math.round(avgWinRate * 10) / 10,
        avgRoi: Math.round(avgRoi * 10) / 10,
        categories: ['situational', 'trend', 'revenge', 'rest', 'weather', 'divisional'],
      },
    })
  } catch (error) {
    console.error('Historical patterns API error:', error)
    return NextResponse.json({ error: 'Failed to fetch patterns' }, { status: 500 })
  }
}
