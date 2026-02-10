import { NextResponse } from 'next/server';
import { scrapeESPNExperts, scrapeAllESPNExperts, getESPNExpertLeaderboard } from '@/lib/scrapers/espn-experts-scraper';
import { 
  fetchExpertTweets, 
  fetchAllExpertTweets, 
  getExpertsXSummary,
  testXConnection,
  searchGamePicks
} from '@/lib/scrapers/x-twitter-scraper';
import { BETTING_EXPERTS, EXPERT_STATS, getExpertsByNetwork, getHighPriorityExperts } from '@/lib/data/betting-experts';

export const dynamic = 'force-dynamic';
export const revalidate = 3600; // Cache for 1 hour

/**
 * GET /api/experts
 * 
 * Returns REAL expert picks and records from ESPN and X/Twitter
 * 
 * Query params:
 * - sport: nfl, nba, ncaaf, ncaab (default: nfl)
 * - all: true to get all sports
 * - leaderboard: true to get combined leaderboard
 * - source: espn, x, database (default: espn)
 * - network: filter by network (espn, fox, cbs, etc)
 * - list: true to get full expert database
 * - xtest: true to test X API connection
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sport = searchParams.get('sport') || 'nfl';
    const source = searchParams.get('source') || 'espn';
    const network = searchParams.get('network');
    const getAll = searchParams.get('all') === 'true';
    const getLeaderboard = searchParams.get('leaderboard') === 'true';
    const getList = searchParams.get('list') === 'true';
    const xTest = searchParams.get('xtest') === 'true';
    const handle = searchParams.get('handle');

    // ============================================
    // X/TWITTER ENDPOINTS
    // ============================================
    
    // Test X API connection
    if (xTest) {
      const result = await testXConnection();
      return NextResponse.json({
        success: result.success,
        source: 'X/Twitter',
        message: result.rateLimited 
          ? 'X API token is valid! Currently rate limited - wait before more requests'
          : (result.success ? 'X API connection successful' : 'X API connection failed'),
        error: result.error,
        rateLimited: result.rateLimited,
        user: result.user,
        timestamp: new Date().toISOString(),
      });
    }

    // Get tweets from specific expert handle
    if (source === 'x' && handle) {
      const expert = BETTING_EXPERTS.find(e => 
        e.xHandle?.toLowerCase() === handle.toLowerCase() ||
        e.id === handle.toLowerCase()
      );
      
      if (!expert || !expert.xHandle) {
        return NextResponse.json({
          success: false,
          error: `Expert with handle @${handle} not found in database`,
        }, { status: 404 });
      }
      
      const tweetData = await fetchExpertTweets(expert);
      return NextResponse.json({
        success: true,
        source: 'X/Twitter',
        ...tweetData,
      });
    }

    // Get X summary for all experts
    if (source === 'x' && getLeaderboard) {
      const summaries = await getExpertsXSummary();
      return NextResponse.json({
        success: true,
        source: 'X/Twitter',
        type: 'x-leaderboard',
        experts: summaries,
        count: summaries.length,
        updatedAt: new Date().toISOString(),
      });
    }

    // Get all expert tweets (limited by priority)
    if (source === 'x' && getAll) {
      const tweetData = await fetchAllExpertTweets({
        minPriority: 4,
        sports: sport !== 'all' ? [sport.toUpperCase()] : undefined,
        limit: 20 // Limit to avoid rate limits
      });
      
      return NextResponse.json({
        success: true,
        source: 'X/Twitter',
        type: 'all-tweets',
        data: tweetData,
        count: tweetData.length,
        updatedAt: new Date().toISOString(),
      });
    }

    // ============================================
    // DATABASE/LIST ENDPOINTS
    // ============================================
    
    // Return full expert database
    if (getList) {
      let experts = BETTING_EXPERTS;
      
      if (network) {
        experts = getExpertsByNetwork(network);
      }
      
      return NextResponse.json({
        success: true,
        source: 'Database',
        type: 'expert-list',
        experts,
        stats: EXPERT_STATS,
        count: experts.length,
        updatedAt: new Date().toISOString(),
      });
    }

    // ============================================
    // ESPN ENDPOINTS (default)
    // ============================================
    
    if (getLeaderboard) {
      const leaderboard = await getESPNExpertLeaderboard();
      return NextResponse.json({
        success: true,
        source: 'ESPN',
        type: 'leaderboard',
        experts: leaderboard,
        count: leaderboard.length,
        updatedAt: new Date().toISOString(),
      });
    }

    if (getAll) {
      const allData = await scrapeAllESPNExperts();
      const sports = Object.entries(allData)
        .filter(([_, data]) => data !== null)
        .map(([sport, data]) => ({
          sport,
          expertCount: data?.experts.length || 0,
          data,
        }));

      return NextResponse.json({
        success: true,
        source: 'ESPN',
        type: 'all-sports',
        sports,
        updatedAt: new Date().toISOString(),
      });
    }

    const data = await scrapeESPNExperts(sport);
    
    if (!data) {
      return NextResponse.json({
        success: false,
        error: `Failed to fetch ${sport.toUpperCase()} expert picks`,
        source: 'ESPN',
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      source: 'ESPN',
      ...data,
    });
  } catch (error) {
    console.error('Error in experts API:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
    }, { status: 500 });
  }
}
