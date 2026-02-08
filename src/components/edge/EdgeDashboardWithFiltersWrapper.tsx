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
  // Return empty during static generation/build - edges will be loaded client-side
  // VERCEL_ENV is 'production' during builds AND runtime, so we can't distinguish
  // Instead, we check if we're in a server component during build by trying to detect SSG
  const isBuildTime = process.env.NEXT_PHASE === 'phase-production-build'
  if (isBuildTime) {
    return { edges: [], total: 0, isDemo: false }
  }
  
  try {
    // In production, this would be the full URL
    const baseUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    
    const res = await fetch(`${baseUrl}/api/edges/today?limit=12&minScore=50`, {
      next: { revalidate: 60 }, // Revalidate every minute for fresh edges
      signal: AbortSignal.timeout(10000), // 10 second timeout
      cache: 'no-store' // Don't cache during build to prevent stale data
    })
    
    if (!res.ok) {
      console.error('Failed to fetch today edges:', res.status)
      return { edges: [], total: 0, isDemo: false }
    }
    
    // Check content-type to avoid parsing HTML error pages
    const contentType = res.headers.get('content-type')
    if (!contentType?.includes('application/json')) {
      console.error('API returned non-JSON response:', contentType)
      return { edges: [], total: 0, isDemo: false }
    }
    
    const text = await res.text()
    // Additional safety: make sure response starts with { or [
    if (!text.startsWith('{') && !text.startsWith('[')) {
      console.error('Response is not JSON:', text.substring(0, 100))
      return { edges: [], total: 0, isDemo: false }
    }
    
    return JSON.parse(text)
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

// DEMO DATA REMOVED - No fake games ever shown
// All data comes from /api/edges/today or returns empty

export async function EdgeDashboardWithFiltersWrapper() {
  const { edges } = await getTodayEdges()
  
  return <EdgeDashboardFiltered edges={edges} title="Today's Top Edges" showViewAll={true} />
}

export default EdgeDashboardWithFiltersWrapper
