import { NextResponse } from 'next/server'
import { 
  generateSocialPost, 
  generateCrossplatformPosts,
  generateWeeklyRecap,
  generatePredictionVsReality,
  getOptimalPostingTimes,
  type Platform,
  type PostType,
  type VerifiedExpertRecord,
  VERIFICATION_DISCLAIMER
} from '@/lib/services/social-media-content'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action') || 'times'
  const platform = (searchParams.get('platform') || 'twitter') as Platform

  try {
    switch (action) {
      case 'times':
        // Get optimal posting times
        const times = getOptimalPostingTimes(platform)
        return NextResponse.json({ 
          platform, 
          optimalTimes: times.map(t => t.toISOString()),
          disclaimer: VERIFICATION_DISCLAIMER
        })
        
      case 'disclaimer':
        return NextResponse.json({ 
          disclaimer: VERIFICATION_DISCLAIMER 
        })
        
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Social content API error:', error)
    return NextResponse.json({ error: 'Request failed' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { action, expert, experts, postType, platform, platforms, prediction, weekNumber } = body

    // Validate expert data has verification info
    const validateExpert = (e: VerifiedExpertRecord): boolean => {
      return !!(e.name && e.verification?.source && e.verification?.dateRange)
    }

    switch (action) {
      case 'generate':
        // Generate single post
        if (!expert || !postType || !platform) {
          return NextResponse.json({ 
            error: 'Missing required fields: expert, postType, platform' 
          }, { status: 400 })
        }
        
        if (!validateExpert(expert)) {
          return NextResponse.json({ 
            error: 'Expert data must include verification source and date range' 
          }, { status: 400 })
        }
        
        const post = await generateSocialPost(
          expert as VerifiedExpertRecord,
          postType as PostType,
          platform as Platform
        )
        
        return NextResponse.json({ 
          post,
          disclaimer: VERIFICATION_DISCLAIMER 
        })
        
      case 'crossplatform':
        // Generate posts for multiple platforms
        if (!expert || !postType) {
          return NextResponse.json({ 
            error: 'Missing required fields: expert, postType' 
          }, { status: 400 })
        }
        
        if (!validateExpert(expert)) {
          return NextResponse.json({ 
            error: 'Expert data must include verification source and date range' 
          }, { status: 400 })
        }
        
        const crossPosts = await generateCrossplatformPosts(
          expert as VerifiedExpertRecord,
          postType as PostType,
          (platforms as Platform[]) || ['twitter', 'instagram', 'threads']
        )
        
        return NextResponse.json({ 
          posts: crossPosts,
          disclaimer: VERIFICATION_DISCLAIMER 
        })
        
      case 'weekly-recap':
        // Generate weekly recap
        if (!experts || !Array.isArray(experts) || experts.length === 0) {
          return NextResponse.json({ 
            error: 'Missing required field: experts (array)' 
          }, { status: 400 })
        }
        
        // Validate all experts have verification
        for (const e of experts) {
          if (!validateExpert(e)) {
            return NextResponse.json({ 
              error: `Expert "${e.name}" missing verification data` 
            }, { status: 400 })
          }
        }
        
        const recap = await generateWeeklyRecap(
          experts as VerifiedExpertRecord[],
          weekNumber || Math.ceil((Date.now() - new Date('2026-01-01').getTime()) / (7 * 24 * 60 * 60 * 1000)),
          (platform as Platform) || 'twitter'
        )
        
        return NextResponse.json({ 
          post: recap,
          disclaimer: VERIFICATION_DISCLAIMER 
        })
        
      case 'prediction-reality':
        // Generate prediction vs reality post
        if (!expert || !prediction) {
          return NextResponse.json({ 
            error: 'Missing required fields: expert, prediction' 
          }, { status: 400 })
        }
        
        if (!prediction.quote || !prediction.actualOutcome) {
          return NextResponse.json({ 
            error: 'Prediction must include: quote, actualOutcome' 
          }, { status: 400 })
        }
        
        if (!validateExpert(expert)) {
          return NextResponse.json({ 
            error: 'Expert data must include verification source and date range' 
          }, { status: 400 })
        }
        
        const pvr = await generatePredictionVsReality(
          expert as VerifiedExpertRecord,
          prediction,
          (platform as Platform) || 'twitter'
        )
        
        return NextResponse.json({ 
          post: pvr,
          warning: '⚠️ VERIFY QUOTE ACCURACY BEFORE POSTING. Misquoting can be defamatory.',
          disclaimer: VERIFICATION_DISCLAIMER 
        })
        
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Social content POST error:', error)
    return NextResponse.json({ 
      error: 'Request failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
