import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const VALID_SPORTS = ['NFL', 'NBA', 'NHL', 'MLB', 'NCAAF', 'NCAAB', 'ALL']

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const sportParam = searchParams.get('sport')?.toUpperCase() || 'ALL'
  const teamParam = searchParams.get('team')?.toUpperCase()
  const category = searchParams.get('category')
  const limit = parseInt(searchParams.get('limit') || '20', 10)
  const hotOnly = searchParams.get('hot') === 'true'
  
  // Validate sport
  if (!VALID_SPORTS.includes(sportParam)) {
    return NextResponse.json(
      { error: `Invalid sport. Valid sports: ${VALID_SPORTS.join(', ')}` },
      { status: 400 }
    )
  }
  
  try {
    const supabase = await createClient()
    
    // Build query
    let query = supabase
      .from('historical_trends')
      .select('*')
      .eq('is_active', true)
      .order('confidence_score', { ascending: false })
    
    // Sport filter
    if (sportParam !== 'ALL') {
      query = query.or(`sport.eq.${sportParam},sport.eq.ALL`)
    }
    
    // Category filter
    if (category) {
      query = query.eq('category', category)
    }
    
    // Hot streaks only
    if (hotOnly) {
      query = query.eq('hot_streak', true)
    }
    
    // Team filter - search in trend_criteria JSONB or trend_name/description
    if (teamParam) {
      // This is a basic implementation - trends may reference teams in various ways
      query = query.or(
        `trend_name.ilike.%${teamParam}%,trend_description.ilike.%${teamParam}%`
      )
    }
    
    const { data, error } = await query.limit(limit)
    
    if (error) {
      console.error('Trends query error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch trends' },
        { status: 500 }
      )
    }
    
    // Transform for frontend
    const trends = (data || []).map(trend => ({
      id: trend.trend_id,
      name: trend.trend_name,
      description: trend.trend_description,
      sport: trend.sport,
      category: trend.category,
      betType: trend.bet_type,
      confidence: trend.confidence_score,
      
      // Records
      record: trend.all_time_record,
      roi: trend.all_time_roi,
      sampleSize: trend.all_time_sample_size,
      units: trend.all_time_units,
      
      // Recent performance
      last30Record: trend.l30_record,
      last30ROI: trend.l30_roi,
      
      // Status
      isHot: trend.hot_streak,
      isCold: trend.cold_streak,
      
      // Display text
      text: trend.trend_description || trend.trend_name,
      edge: trend.all_time_roi > 0 ? trend.all_time_roi.toFixed(1) : undefined,
    }))
    
    return NextResponse.json({
      sport: sportParam,
      team: teamParam,
      trends,
      count: trends.length,
      filters: {
        category,
        hotOnly,
        limit,
      }
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600'
      }
    })
    
  } catch (error) {
    console.error('Trends API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
