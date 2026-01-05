import { NextResponse } from 'next/server'
import { edgeFinder, backtestResults, fetchRelevantNews } from '@/lib/api/edge-finder'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type') // 'edges' | 'news' | 'backtest'
  const edgeType = searchParams.get('edgeType') // 'bias' | 'volume' | 'news' | 'arbitrage' | 'time'
  const limit = parseInt(searchParams.get('limit') || '20')
  const highConfidenceOnly = searchParams.get('highConfidence') === 'true'
  
  try {
    if (type === 'backtest') {
      return NextResponse.json({
        success: true,
        data: backtestResults
      })
    }
    
    if (type === 'news') {
      const keywords = searchParams.get('keywords')?.split(',') || ['economy', 'fed', 'politics', 'crypto']
      const news = await fetchRelevantNews(keywords)
      return NextResponse.json({
        success: true,
        data: news
      })
    }
    
    // Default: return edges
    let edges
    
    if (highConfidenceOnly) {
      edges = await edgeFinder.getHighConfidenceAlerts()
    } else if (edgeType && ['bias', 'volume', 'news', 'arbitrage', 'time'].includes(edgeType)) {
      edges = await edgeFinder.getEdgesByType(edgeType as any)
    } else {
      edges = await edgeFinder.getTopEdges(limit)
    }
    
    return NextResponse.json({
      success: true,
      data: edges,
      meta: {
        total: edges.length,
        timestamp: new Date().toISOString(),
        filters: {
          type: edgeType || 'all',
          highConfidenceOnly,
          limit
        }
      }
    })
  } catch (error) {
    console.error('Edge finder API error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch edge signals' },
      { status: 500 }
    )
  }
}
