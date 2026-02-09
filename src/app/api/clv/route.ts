import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const timeRange = searchParams.get('timeRange') || '30d' // 7d, 30d, 90d, all
  const sport = searchParams.get('sport') || 'all'
  const betType = searchParams.get('betType') || 'all'
  
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      // NO MOCK DATA - return empty data for non-authenticated users
      return NextResponse.json({
        summary: {
          totalPicks: 0,
          avgClv: 0,
          clvPositive: 0,
          clvNegative: 0,
          clvPositiveRate: 0,
          totalClvCents: 0,
          estimatedEdge: 0,
        },
        distribution: [],
        recentPicks: [],
        trendData: [],
        sportBreakdown: [],
        betTypeBreakdown: [],
        message: 'Please sign in to track your CLV data'
      })
    }
    
    // Calculate date range
    let dateFilter = new Date()
    switch (timeRange) {
      case '7d':
        dateFilter.setDate(dateFilter.getDate() - 7)
        break
      case '30d':
        dateFilter.setDate(dateFilter.getDate() - 30)
        break
      case '90d':
        dateFilter.setDate(dateFilter.getDate() - 90)
        break
      case 'all':
        dateFilter = new Date('2020-01-01')
        break
    }
    
    // Get user's capper profile
    const { data: capper } = await supabase
      .from('cappers')
      .select('id')
      .eq('user_id', user.id)
      .single()
    
    if (!capper) {
      return NextResponse.json({ error: 'No capper profile found' }, { status: 404 })
    }
    
    // Build query for picks with CLV data
    let query = supabase
      .from('picks')
      .select('*')
      .eq('capper_id', capper.id)
      .not('close_line', 'is', null)
      .gte('created_at', dateFilter.toISOString())
      .order('created_at', { ascending: false })
    
    if (sport !== 'all') {
      query = query.eq('sport', sport.toLowerCase())
    }
    
    if (betType !== 'all') {
      query = query.eq('bet_type', betType)
    }
    
    const { data: picks, error } = await query
    
    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    // Calculate CLV statistics
    const picksWithClv = picks?.filter(p => p.clv !== null) || []
    const totalPicks = picksWithClv.length
    const avgClv = totalPicks > 0 
      ? picksWithClv.reduce((sum, p) => sum + (p.clv || 0), 0) / totalPicks 
      : 0
    const clvPositive = picksWithClv.filter(p => (p.clv || 0) > 0).length
    const clvNegative = picksWithClv.filter(p => (p.clv || 0) < 0).length
    const totalClvCents = picksWithClv.reduce((sum, p) => sum + (p.clv || 0) * 100, 0)
    
    // Distribution buckets
    const distribution = [
      { range: '-5+ cents', count: 0, percentage: 0 },
      { range: '-2 to -5 cents', count: 0, percentage: 0 },
      { range: '-0.5 to -2 cents', count: 0, percentage: 0 },
      { range: '-0.5 to +0.5 cents', count: 0, percentage: 0 },
      { range: '+0.5 to +2 cents', count: 0, percentage: 0 },
      { range: '+2 to +5 cents', count: 0, percentage: 0 },
      { range: '+5+ cents', count: 0, percentage: 0 },
    ]
    
    picksWithClv.forEach(pick => {
      const clvCents = (pick.clv || 0) * 100
      if (clvCents <= -5) distribution[0].count++
      else if (clvCents <= -2) distribution[1].count++
      else if (clvCents <= -0.5) distribution[2].count++
      else if (clvCents <= 0.5) distribution[3].count++
      else if (clvCents <= 2) distribution[4].count++
      else if (clvCents <= 5) distribution[5].count++
      else distribution[6].count++
    })
    
    distribution.forEach(d => {
      d.percentage = totalPicks > 0 ? (d.count / totalPicks) * 100 : 0
    })
    
    // Sport breakdown
    const sportBreakdownMap: Record<string, { picks: number; totalClv: number; positive: number }> = {}
    picksWithClv.forEach(pick => {
      const s = pick.sport?.toUpperCase() || 'OTHER'
      if (!sportBreakdownMap[s]) {
        sportBreakdownMap[s] = { picks: 0, totalClv: 0, positive: 0 }
      }
      sportBreakdownMap[s].picks++
      sportBreakdownMap[s].totalClv += pick.clv || 0
      if ((pick.clv || 0) > 0) sportBreakdownMap[s].positive++
    })
    
    const sportBreakdown = Object.entries(sportBreakdownMap).map(([sport, data]) => ({
      sport,
      picks: data.picks,
      avgClv: data.picks > 0 ? data.totalClv / data.picks : 0,
      positiveRate: data.picks > 0 ? (data.positive / data.picks) * 100 : 0,
    }))
    
    // Bet type breakdown
    const betTypeMap: Record<string, { picks: number; totalClv: number; positive: number }> = {}
    picksWithClv.forEach(pick => {
      const bt = pick.bet_type || 'other'
      if (!betTypeMap[bt]) {
        betTypeMap[bt] = { picks: 0, totalClv: 0, positive: 0 }
      }
      betTypeMap[bt].picks++
      betTypeMap[bt].totalClv += pick.clv || 0
      if ((pick.clv || 0) > 0) betTypeMap[bt].positive++
    })
    
    const betTypeBreakdown = Object.entries(betTypeMap).map(([type, data]) => ({
      type,
      picks: data.picks,
      avgClv: data.picks > 0 ? data.totalClv / data.picks : 0,
      positiveRate: data.picks > 0 ? (data.positive / data.picks) * 100 : 0,
    }))
    
    // Recent picks (last 10)
    const recentPicks = picksWithClv.slice(0, 10).map(p => ({
      id: p.id,
      sport: p.sport?.toUpperCase(),
      pickTeam: `${p.pick_team} ${p.line > 0 ? '+' : ''}${p.line}`,
      openLine: p.open_line,
      closeLine: p.close_line,
      clv: p.clv,
      result: p.result,
      date: p.created_at,
    }))
    
    // Trend data (weekly averages)
    const weeklyData: Record<string, { total: number; count: number }> = {}
    picksWithClv.forEach(pick => {
      const week = new Date(pick.created_at)
      week.setDate(week.getDate() - week.getDay())
      const weekKey = week.toISOString().split('T')[0]
      if (!weeklyData[weekKey]) {
        weeklyData[weekKey] = { total: 0, count: 0 }
      }
      weeklyData[weekKey].total += pick.clv || 0
      weeklyData[weekKey].count++
    })
    
    let cumulative = 0
    const trendData = Object.entries(weeklyData)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, data]) => {
        const avgClv = data.count > 0 ? data.total / data.count : 0
        cumulative += avgClv
        return { date, avgClv, cumulative }
      })
    
    return NextResponse.json({
      summary: {
        totalPicks,
        avgClv: Math.round(avgClv * 100) / 100,
        clvPositive,
        clvNegative,
        clvPositiveRate: totalPicks > 0 ? Math.round((clvPositive / totalPicks) * 1000) / 10 : 0,
        totalClvCents: Math.round(totalClvCents),
        estimatedEdge: Math.round(avgClv * 200) / 100, // CLV ~= edge/2
      },
      distribution,
      recentPicks,
      trendData,
      sportBreakdown,
      betTypeBreakdown,
    })
  } catch (error) {
    console.error('CLV API error:', error)
    return NextResponse.json({ error: 'Failed to fetch CLV data' }, { status: 500 })
  }
}
