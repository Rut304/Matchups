import { NextResponse } from 'next/server'
import { getSystemHealth, generateHealthReport, determineHealingAction } from '@/lib/health'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const format = searchParams.get('format') || 'json'
  const includeHealing = searchParams.get('healing') === 'true'
  
  try {
    const health = await getSystemHealth()
    
    // Add healing actions if requested
    if (includeHealing) {
      const healingReport = health.services.map(service => ({
        service: service.name,
        status: service.status,
        actions: determineHealingAction(service),
      }))
      
      if (format === 'markdown') {
        const report = generateHealthReport(health)
        return new NextResponse(report, {
          headers: { 
            'Content-Type': 'text/markdown',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
          },
        })
      }
      
      return NextResponse.json({
        ...health,
        healing: healingReport,
      }, {
        headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' },
      })
    }
    
    if (format === 'markdown') {
      const report = generateHealthReport(health)
      return new NextResponse(report, {
        headers: { 
          'Content-Type': 'text/markdown',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      })
    }
    
    // For CI/CD - return non-200 if system is unhealthy
    const statusCode = health.status === 'unhealthy' ? 503 : 200
    
    return NextResponse.json(health, { 
      status: statusCode,
      headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' },
    })
  } catch (error) {
    console.error('[Health API] Error:', error)
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { 
      status: 500,
      headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' },
    })
  }
}
