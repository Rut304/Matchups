import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const range = searchParams.get('range') || '7d' // 1d, 7d, 30d, all
    
    // Calculate date range
    const now = new Date()
    let since = new Date()
    switch (range) {
      case '1d': since.setDate(now.getDate() - 1); break
      case '7d': since.setDate(now.getDate() - 7); break
      case '30d': since.setDate(now.getDate() - 30); break
      case 'all': since = new Date('2024-01-01'); break
    }
    const sinceStr = since.toISOString()
    
    // Parallel queries for dashboard data
    const [
      pageviewsResult,
      uniqueVisitorsResult,
      sessionsResult,
      topPagesResult,
      recentEventsResult,
      deviceBreakdownResult,
      browserBreakdownResult,
      referrersResult,
      countryResult,
      hourlyResult,
    ] = await Promise.all([
      // Total pageviews
      supabase
        .from('analytics_events')
        .select('id', { count: 'exact', head: true })
        .eq('event_type', 'pageview')
        .gte('created_at', sinceStr),
      
      // Unique visitors (by visitor_id)
      supabase
        .from('analytics_events')
        .select('visitor_id')
        .eq('event_type', 'pageview')
        .gte('created_at', sinceStr),
      
      // Unique sessions
      supabase
        .from('analytics_events')
        .select('session_id')
        .eq('event_type', 'session_start')
        .gte('created_at', sinceStr),
      
      // Top pages (get all pageviews and aggregate client-side)
      supabase
        .from('analytics_events')
        .select('page')
        .eq('event_type', 'pageview')
        .gte('created_at', sinceStr)
        .limit(5000),
      
      // Recent events
      supabase
        .from('analytics_events')
        .select('*')
        .gte('created_at', sinceStr)
        .order('created_at', { ascending: false })
        .limit(50),
      
      // Device type breakdown
      supabase
        .from('analytics_events')
        .select('is_mobile, is_tablet')
        .eq('event_type', 'pageview')
        .gte('created_at', sinceStr)
        .limit(5000),
      
      // Browser breakdown
      supabase
        .from('analytics_events')
        .select('browser')
        .eq('event_type', 'pageview')
        .gte('created_at', sinceStr)
        .limit(5000),
      
      // Top referrers
      supabase
        .from('analytics_events')
        .select('referrer')
        .eq('event_type', 'pageview')
        .gte('created_at', sinceStr)
        .not('referrer', 'is', null)
        .not('referrer', 'eq', '')
        .limit(5000),
      
      // Country breakdown
      supabase
        .from('analytics_events')
        .select('country')
        .eq('event_type', 'pageview')
        .gte('created_at', sinceStr)
        .not('country', 'is', null)
        .limit(5000),
      
      // Hourly distribution (last 24h)
      supabase
        .from('analytics_events')
        .select('created_at')
        .eq('event_type', 'pageview')
        .gte('created_at', new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()),
    ])
    
    // Aggregate unique visitors
    const uniqueVisitors = new Set(
      uniqueVisitorsResult.data?.map(r => r.visitor_id) || []
    ).size
    
    // Aggregate sessions
    const totalSessions = new Set(
      sessionsResult.data?.map(r => r.session_id) || []
    ).size
    
    // Aggregate top pages
    const pageCounts: Record<string, number> = {}
    for (const row of topPagesResult.data || []) {
      pageCounts[row.page] = (pageCounts[row.page] || 0) + 1
    }
    const topPages = Object.entries(pageCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 20)
      .map(([page, views]) => ({ page, views }))
    
    // Device breakdown
    let mobile = 0, tablet = 0, desktop = 0
    for (const row of deviceBreakdownResult.data || []) {
      if (row.is_mobile) mobile++
      else if (row.is_tablet) tablet++
      else desktop++
    }
    
    // Browser breakdown
    const browserCounts: Record<string, number> = {}
    for (const row of browserBreakdownResult.data || []) {
      const b = row.browser || 'unknown'
      browserCounts[b] = (browserCounts[b] || 0) + 1
    }
    const browsers = Object.entries(browserCounts)
      .sort(([, a], [, b]) => b - a)
      .map(([browser, count]) => ({ browser, count }))
    
    // Top referrers
    const refCounts: Record<string, number> = {}
    for (const row of referrersResult.data || []) {
      try {
        const host = new URL(row.referrer).hostname || row.referrer
        refCounts[host] = (refCounts[host] || 0) + 1
      } catch {
        if (row.referrer) refCounts[row.referrer] = (refCounts[row.referrer] || 0) + 1
      }
    }
    const topReferrers = Object.entries(refCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([referrer, count]) => ({ referrer, count }))
    
    // Country breakdown
    const countryCounts: Record<string, number> = {}
    for (const row of countryResult.data || []) {
      const c = row.country || 'Unknown'
      countryCounts[c] = (countryCounts[c] || 0) + 1
    }
    const topCountries = Object.entries(countryCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([country, count]) => ({ country, count }))
    
    // Hourly distribution
    const hourly = new Array(24).fill(0)
    for (const row of hourlyResult.data || []) {
      const hour = new Date(row.created_at).getHours()
      hourly[hour]++
    }
    
    return NextResponse.json({
      range,
      since: sinceStr,
      overview: {
        totalPageviews: pageviewsResult.count || 0,
        uniqueVisitors,
        totalSessions,
        avgPagesPerSession: totalSessions > 0 
          ? Math.round((pageviewsResult.count || 0) / totalSessions * 10) / 10 
          : 0,
      },
      topPages,
      devices: { mobile, tablet, desktop },
      browsers,
      topReferrers,
      topCountries,
      hourlyDistribution: hourly,
      recentEvents: (recentEventsResult.data || []).map(e => ({
        type: e.event_type,
        page: e.page,
        browser: e.browser,
        os: e.os,
        country: e.country,
        city: e.city,
        isMobile: e.is_mobile,
        referrer: e.referrer,
        createdAt: e.created_at,
        data: e.event_data,
      })),
    })
  } catch (error) {
    console.error('[Analytics API]', error)
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 })
  }
}
