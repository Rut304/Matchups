/**
 * Social Media Content Generator for "Check The Experts"
 * Creates engaging posts with attention-grabbing headlines about expert pick accuracy
 * 
 * IMPORTANT: All data MUST be verified before posting to avoid defamation
 */

import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

// Post types
export type PostType = 
  | 'expert_streak'        // Hot/cold streak alerts
  | 'weekly_recap'         // Weekly performance summary
  | 'upset_alert'          // Expert got big upset wrong
  | 'lock_failure'         // Someone's "lock" pick lost
  | 'consensus_fade'       // When fading consensus worked
  | 'head_to_head'         // Expert vs Expert comparison
  | 'prediction_vs_reality' // What they said vs what happened
  | 'best_worst_week'      // Best/worst performing experts

// Platform-specific formatting
export type Platform = 'twitter' | 'instagram' | 'tiktok' | 'threads'

// Verified expert record for posting
export interface VerifiedExpertRecord {
  name: string
  platform: string // Where they make picks (ESPN, Action Network, etc.)
  sport: string
  record: {
    wins: number
    losses: number
    pushes: number
    winRate: number
    units: number // Profit/loss in units
  }
  verification: {
    source: string // Where we tracked the picks from
    dateRange: string // e.g., "Jan 1 - Jan 31, 2026"
    picksVerified: number // How many picks we tracked
    methodology: string // How we verified (e.g., "Recorded from ESPN broadcast")
  }
  streak?: {
    type: 'hot' | 'cold'
    length: number
    sport: string
  }
}

// Generated post content
export interface SocialPost {
  platform: Platform
  postType: PostType
  headline: string
  body: string
  hashtags: string[]
  mediaCaption?: string
  verificationNote: string // Always include data source
  scheduledFor?: Date
  priority: 'high' | 'medium' | 'low'
  engagementPrediction: number // 1-100
}

// Headline templates for different scenarios
const HEADLINE_TEMPLATES: Record<PostType, string[]> = {
  expert_streak: [
    "🔥 {name} is ON FIRE: {streak}W streak in {sport}",
    "❄️ ICE COLD: {name} drops to {record} this {period}",
    "📈 {name} can't miss right now - {winRate}% hit rate",
    "😬 {name} fading fast: {losses} straight L's",
  ],
  weekly_recap: [
    "📊 WEEK IN REVIEW: Who actually knows what they're talking about?",
    "🏆 This Week's Expert Leaderboard - The TRUTH",
    "💰 The REAL records of your favorite talking heads",
    "🎯 Expert Picks Report Card: Week {week}",
  ],
  upset_alert: [
    "🚨 {name} said THIS couldn't lose... it lost.",
    "📉 Every expert picked {favorite}. {underdog} had other plans.",
    "🤯 The upset NOBODY saw coming (except our data)",
  ],
  lock_failure: [
    "🔒➡️💀 '{name}' called this a LOCK. It wasn't.",
    "⚠️ LOCK ALERT FAILED: {name}'s can't-miss pick... missed",
    "When 'GUARANTEED' meets reality: {name}'s lock busted",
  ],
  consensus_fade: [
    "📊 90% of experts picked {team}. We faded. We won.",
    "🔄 The Contrarian Play CASHES: Fading the consensus = 💵",
    "When EVERYONE agrees... be suspicious. Today's proof:",
  ],
  head_to_head: [
    "🥊 {expert1} vs {expert2}: Who's actually better?",
    "📊 TALE OF THE TAPE: {expert1} ({record1}) vs {expert2} ({record2})",
    "The definitive comparison you've been waiting for",
  ],
  prediction_vs_reality: [
    "🎤 What they SAID vs ❌ What HAPPENED",
    "'{quote}' - {name}, {date}. The result? 😬",
    "We pulled the tape. Here's what {name} actually said:",
  ],
  best_worst_week: [
    "👑 EXPERT OF THE WEEK: {name} ({record})",
    "🗑️ Rough week for {name}: {record} this week",
    "The Hero and The Villain of this week's expert picks",
  ],
}

// Platform-specific character limits and formats
const PLATFORM_SPECS: Record<Platform, { maxChars: number; format: string; hashtagLimit: number }> = {
  twitter: { maxChars: 280, format: 'concise', hashtagLimit: 3 },
  instagram: { maxChars: 2200, format: 'detailed', hashtagLimit: 30 },
  tiktok: { maxChars: 150, format: 'ultra-short', hashtagLimit: 5 },
  threads: { maxChars: 500, format: 'medium', hashtagLimit: 5 },
}

/**
 * Generate social media post content using AI
 */
export async function generateSocialPost(
  expertData: VerifiedExpertRecord,
  postType: PostType,
  platform: Platform
): Promise<SocialPost> {
  const specs = PLATFORM_SPECS[platform]
  const templates = HEADLINE_TEMPLATES[postType]
  
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })
  
  const prompt = `You are a viral social media content creator for a sports betting accountability platform called "Check The Experts".

GOAL: Create an engaging ${platform.toUpperCase()} post about this expert's performance.

EXPERT DATA (VERIFIED):
- Name: ${expertData.name}
- Platform: ${expertData.platform}
- Sport: ${expertData.sport}
- Record: ${expertData.record.wins}-${expertData.record.losses}-${expertData.record.pushes} (${expertData.record.winRate}%)
- Units: ${expertData.record.units > 0 ? '+' : ''}${expertData.record.units}
${expertData.streak ? `- Current Streak: ${expertData.streak.length} ${expertData.streak.type === 'hot' ? 'wins' : 'losses'} in ${expertData.streak.sport}` : ''}

DATA VERIFICATION:
- Source: ${expertData.verification.source}
- Date Range: ${expertData.verification.dateRange}
- Picks Verified: ${expertData.verification.picksVerified}

POST TYPE: ${postType}
PLATFORM: ${platform} (max ${specs.maxChars} chars, ${specs.format} format)

HEADLINE TEMPLATES FOR INSPIRATION:
${templates.join('\n')}

REQUIREMENTS:
1. Use attention-grabbing emoji (but not excessive)
2. Be factual - only use the verified data provided
3. Include a subtle call to action (follow, check profile, etc.)
4. Stay under ${specs.maxChars} characters for main text
5. Create ${Math.min(specs.hashtagLimit, 5)} relevant hashtags
6. Be engaging but NOT defamatory - state facts, not accusations

TONE: Playful accountability, not mean-spirited. We're tracking public predictions, not attacking people.

Respond with JSON:
{
  "headline": "Attention-grabbing first line",
  "body": "Rest of the post content",
  "hashtags": ["#Hashtag1", "#Hashtag2"],
  "engagementPrediction": 75,
  "priority": "high/medium/low"
}`

  try {
    const result = await model.generateContent(prompt)
    const response = result.response.text()
    
    const jsonMatch = response.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('No JSON in response')
    }
    
    const generated = JSON.parse(jsonMatch[0])
    
    return {
      platform,
      postType,
      headline: generated.headline,
      body: generated.body,
      hashtags: generated.hashtags || [],
      verificationNote: `Data verified from ${expertData.verification.source} (${expertData.verification.dateRange})`,
      priority: generated.priority || 'medium',
      engagementPrediction: generated.engagementPrediction || 50,
    }
  } catch (error) {
    console.error('Social post generation error:', error)
    
    // Fallback to template-based generation
    const template = templates[0]
    const headline = template
      .replace('{name}', expertData.name)
      .replace('{sport}', expertData.sport)
      .replace('{streak}', String(expertData.streak?.length || 0))
      .replace('{record}', `${expertData.record.wins}-${expertData.record.losses}`)
      .replace('{winRate}', String(expertData.record.winRate))
      .replace('{losses}', String(expertData.record.losses))
    
    return {
      platform,
      postType,
      headline,
      body: `${expertData.name} (${expertData.platform}): ${expertData.record.wins}-${expertData.record.losses} in ${expertData.sport}\n\nTrack the real records at Check The Experts.`,
      hashtags: ['#CheckTheExperts', '#SportsBetting', `#${expertData.sport}`],
      verificationNote: `Data verified from ${expertData.verification.source}`,
      priority: 'medium',
      engagementPrediction: 50,
    }
  }
}

/**
 * Generate a batch of posts for different platforms
 */
export async function generateCrossplatformPosts(
  expertData: VerifiedExpertRecord,
  postType: PostType,
  platforms: Platform[] = ['twitter', 'instagram', 'threads']
): Promise<SocialPost[]> {
  const posts = await Promise.all(
    platforms.map(platform => generateSocialPost(expertData, postType, platform))
  )
  
  return posts
}

/**
 * Generate weekly recap post for multiple experts
 */
export async function generateWeeklyRecap(
  experts: VerifiedExpertRecord[],
  weekNumber: number,
  platform: Platform = 'twitter'
): Promise<SocialPost> {
  // Sort by win rate
  const sorted = [...experts].sort((a, b) => b.record.winRate - a.record.winRate)
  const top3 = sorted.slice(0, 3)
  const bottom3 = sorted.slice(-3).reverse()
  
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })
  
  const prompt = `Create a WEEK ${weekNumber} recap post for ${platform.toUpperCase()}.

TOP PERFORMERS:
${top3.map((e, i) => `${i + 1}. ${e.name} (${e.platform}): ${e.record.wins}-${e.record.losses} (${e.record.winRate}%)`).join('\n')}

BOTTOM PERFORMERS:
${bottom3.map((e, i) => `${i + 1}. ${e.name} (${e.platform}): ${e.record.wins}-${e.record.losses} (${e.record.winRate}%)`).join('\n')}

Create an engaging weekly recap. Be factual but entertaining. Max ${PLATFORM_SPECS[platform].maxChars} chars.

Respond with JSON:
{
  "headline": "Attention-grabbing headline",
  "body": "Main content",
  "hashtags": ["#Weekly", "#Recap"],
  "engagementPrediction": 80
}`

  try {
    const result = await model.generateContent(prompt)
    const response = result.response.text()
    
    const jsonMatch = response.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const generated = JSON.parse(jsonMatch[0])
      
      return {
        platform,
        postType: 'weekly_recap',
        headline: generated.headline,
        body: generated.body,
        hashtags: generated.hashtags || ['#CheckTheExperts', '#WeeklyRecap'],
        verificationNote: 'All records verified from public broadcasts and published picks',
        priority: 'high',
        engagementPrediction: generated.engagementPrediction || 70,
      }
    }
  } catch (error) {
    console.error('Weekly recap generation error:', error)
  }
  
  // Fallback
  return {
    platform,
    postType: 'weekly_recap',
    headline: `📊 WEEK ${weekNumber} EXPERT REPORT CARD`,
    body: `🏆 Top: ${top3[0].name} (${top3[0].record.winRate}%)\n📉 Bottom: ${bottom3[0].name} (${bottom3[0].record.winRate}%)\n\nFull breakdown in bio.`,
    hashtags: ['#CheckTheExperts', '#SportsBetting', '#WeeklyRecap'],
    verificationNote: 'All records verified from public broadcasts',
    priority: 'high',
    engagementPrediction: 70,
  }
}

/**
 * Generate "Prediction vs Reality" post when expert gets it wrong
 */
export async function generatePredictionVsReality(
  expert: VerifiedExpertRecord,
  prediction: {
    quote: string
    date: string
    game: string
    predictedOutcome: string
    actualOutcome: string
    wasConfident: boolean // Did they call it a "lock" or "guarantee"?
  },
  platform: Platform = 'twitter'
): Promise<SocialPost> {
  const specs = PLATFORM_SPECS[platform]
  
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })
  
  const prompt = `Create a "Prediction vs Reality" post comparing what an expert said to what happened.

EXPERT: ${expert.name} (${expert.platform})
QUOTE: "${prediction.quote}"
DATE: ${prediction.date}
GAME: ${prediction.game}
PREDICTED: ${prediction.predictedOutcome}
ACTUAL: ${prediction.actualOutcome}
WAS CONFIDENT: ${prediction.wasConfident ? 'Yes (called it a lock/guarantee)' : 'No'}

CURRENT RECORD: ${expert.record.wins}-${expert.record.losses} (${expert.record.winRate}%)

Create a post that:
1. Shows the original prediction/quote
2. Shows what actually happened
3. Is factual, not mean (we're tracking accountability, not bullying)
4. Stays under ${specs.maxChars} characters
5. Includes a verification note

Respond with JSON:
{
  "headline": "First attention line",
  "body": "Main content",
  "hashtags": ["#Check", "#Experts"],
  "engagementPrediction": 85
}`

  try {
    const result = await model.generateContent(prompt)
    const response = result.response.text()
    
    const jsonMatch = response.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const generated = JSON.parse(jsonMatch[0])
      
      return {
        platform,
        postType: 'prediction_vs_reality',
        headline: generated.headline,
        body: generated.body,
        hashtags: generated.hashtags || ['#CheckTheExperts', '#PredictionVsReality'],
        verificationNote: `Quote recorded from ${expert.platform} on ${prediction.date}. Outcome verified via official game results.`,
        priority: prediction.wasConfident ? 'high' : 'medium',
        engagementPrediction: generated.engagementPrediction || 75,
      }
    }
  } catch (error) {
    console.error('Prediction vs reality generation error:', error)
  }
  
  // Fallback
  return {
    platform,
    postType: 'prediction_vs_reality',
    headline: `🎤 "${prediction.quote.slice(0, 50)}..."`,
    body: `- ${expert.name}, ${prediction.date}\n\n❌ ${prediction.game}: ${prediction.actualOutcome}\n\nCurrent record: ${expert.record.wins}-${expert.record.losses}`,
    hashtags: ['#CheckTheExperts', '#Receipts'],
    verificationNote: `Quote from ${expert.platform}`,
    priority: 'medium',
    engagementPrediction: 70,
  }
}

/**
 * Get optimal posting times for engagement
 */
export function getOptimalPostingTimes(platform: Platform): Date[] {
  const times: Date[] = []
  const now = new Date()
  
  // Platform-specific optimal times (in local timezone)
  const optimalHours: Record<Platform, number[]> = {
    twitter: [8, 12, 17, 21], // Morning, lunch, after work, evening
    instagram: [11, 14, 19], // Mid-morning, early afternoon, evening
    tiktok: [19, 21, 23], // Evening hours
    threads: [9, 12, 18], // Morning, lunch, evening
  }
  
  const hours = optimalHours[platform]
  
  // Generate next 3 optimal posting times
  hours.forEach(hour => {
    const postTime = new Date(now)
    postTime.setHours(hour, 0, 0, 0)
    
    // If time already passed today, schedule for tomorrow
    if (postTime < now) {
      postTime.setDate(postTime.getDate() + 1)
    }
    
    times.push(postTime)
  })
  
  return times.sort((a, b) => a.getTime() - b.getTime()).slice(0, 3)
}

/**
 * Content queue for scheduled posts
 */
export interface PostQueue {
  posts: Array<SocialPost & { scheduledFor: Date; status: 'pending' | 'posted' | 'failed' }>
}

/**
 * Create a content calendar for the week
 */
export async function generateWeeklyContentCalendar(
  experts: VerifiedExpertRecord[],
  startDate: Date = new Date()
): Promise<PostQueue> {
  const queue: PostQueue = { posts: [] }
  
  // Monday: Weekly recap from previous week
  const mondayPosts = await generateCrossplatformPosts(
    experts[0], // Top performer
    'expert_streak',
    ['twitter', 'instagram']
  )
  
  // Wednesday: Head-to-head comparison
  // Friday: Best/Worst of week preview
  // Sunday: Big game previews
  
  // Schedule posts at optimal times
  for (const post of mondayPosts) {
    const optimalTimes = getOptimalPostingTimes(post.platform)
    queue.posts.push({
      ...post,
      scheduledFor: optimalTimes[0],
      status: 'pending'
    })
  }
  
  return queue
}

// Export utility for verification disclaimer
export const VERIFICATION_DISCLAIMER = `
⚠️ VERIFICATION POLICY
All expert records are tracked from public broadcasts, published articles, and social media posts.
We only track picks that are:
- Made BEFORE game time
- Publicly available (not paywalled "locks")
- Clearly stated (not vague predictions)

If you believe our tracking is incorrect, contact us with evidence.
`.trim()
