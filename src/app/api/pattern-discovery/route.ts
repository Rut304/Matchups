import { NextResponse } from 'next/server'
import { 
  discoverNewPatterns, 
  getDiscoveredPatterns, 
  improveExistingPatterns,
  saveDiscoveredPattern,
  runPatternDiscoveryCycle
} from '@/lib/services/pattern-discovery'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action') || 'list'
  const sport = searchParams.get('sport') || undefined
  const category = searchParams.get('category') || undefined
  const minConfidence = parseInt(searchParams.get('minConfidence') || '0')
  const validationStatus = searchParams.get('validationStatus') || undefined

  try {
    switch (action) {
      case 'list':
        // Get existing discovered patterns
        const patterns = await getDiscoveredPatterns({
          sport,
          category,
          validationStatus,
          minConfidence: minConfidence > 0 ? minConfidence : undefined
        })
        
        return NextResponse.json({
          patterns,
          count: patterns.length,
          filters: { sport, category, minConfidence, validationStatus }
        })
        
      case 'discover':
        // Trigger new pattern discovery
        const newPatterns = await discoverNewPatterns({
          sports: sport ? [sport.toUpperCase()] : ['NFL', 'NBA', 'MLB', 'NHL'],
          minSampleSize: 50,
          minWinRate: 52,
          minROI: 3,
          includeExperimental: true
        })
        
        return NextResponse.json({
          discoveredPatterns: newPatterns,
          count: newPatterns.length,
          message: `Discovered ${newPatterns.length} potential new patterns`
        })
        
      case 'improve':
        // Run RCI improvement cycle
        const improvements = await improveExistingPatterns()
        
        return NextResponse.json({
          improvements,
          count: improvements.length,
          message: `Analyzed ${improvements.length} patterns for improvements`
        })
        
      case 'cycle':
        // Run full discovery cycle (for cron)
        const cycleResult = await runPatternDiscoveryCycle()
        
        return NextResponse.json({
          result: cycleResult,
          message: 'Discovery cycle completed'
        })
        
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Pattern discovery API error:', error)
    return NextResponse.json({ 
      error: 'Pattern discovery failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { action, pattern, patternIds } = body

    switch (action) {
      case 'save':
        // Save a discovered pattern
        if (!pattern) {
          return NextResponse.json({ error: 'Pattern required' }, { status: 400 })
        }
        
        const saveResult = await saveDiscoveredPattern(pattern)
        
        if (!saveResult.success) {
          return NextResponse.json({ 
            error: 'Failed to save pattern',
            details: saveResult.error 
          }, { status: 500 })
        }
        
        return NextResponse.json({
          success: true,
          id: saveResult.id,
          message: 'Pattern saved successfully'
        })
        
      case 'improve':
        // Improve specific patterns
        const improvements = await improveExistingPatterns(patternIds)
        
        return NextResponse.json({
          improvements,
          count: improvements.length
        })
        
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Pattern discovery POST error:', error)
    return NextResponse.json({ 
      error: 'Request failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
