import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

const trendFinderModel = genAI.getGenerativeModel({ 
  model: 'gemini-2.0-flash-exp',
  generationConfig: {
    temperature: 0.3, // Lower temp for more factual responses
    topP: 0.9,
    topK: 40,
    maxOutputTokens: 4096,
  }
})

// System prompt for the trend finder AI
const SYSTEM_PROMPT = `You are an expert sports statistician and betting analyst with access to comprehensive historical sports data. Your role is to answer detailed statistical questions about sports betting trends, game outcomes, and player/team performance.

IMPORTANT GUIDELINES:
1. When you don't have exact data, provide educated estimates based on known trends and patterns, but ALWAYS disclose when data is estimated vs confirmed.
2. For questions about specific historical scenarios, break down the analysis logically.
3. Include relevant context about why certain trends exist.
4. Format numerical data clearly with percentages and counts.
5. Suggest related trends the user might find interesting.
6. Be honest about data limitations.

SPORTS COVERED:
- NFL (including playoffs, Super Bowls since 1966)
- NBA (including playoffs since 1946)
- MLB (including playoffs, World Series)
- NHL (including playoffs, Stanley Cup)
- College Football (NCAAF)
- College Basketball (NCAAB)
- WNBA

When answering trend questions, structure your response with:
1. Direct Answer: The specific answer to the query
2. Data Breakdown: Supporting statistics
3. Context: Why this trend exists or is significant
4. Betting Implications: How this information could be used
5. Related Trends: Other interesting patterns to explore`

export async function POST(request: NextRequest) {
  try {
    const { query, conversationHistory } = await request.json()

    if (!query || typeof query !== 'string') {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 })
    }

    // Build the conversation context
    const messages = [
      { role: 'user', parts: [{ text: SYSTEM_PROMPT }] },
      { role: 'model', parts: [{ text: 'I understand. I\'m ready to help analyze sports trends and statistics. I\'ll provide detailed, data-driven answers while being transparent about any estimations. What would you like to explore?' }] },
    ]

    // Add conversation history if provided
    if (conversationHistory && Array.isArray(conversationHistory)) {
      for (const msg of conversationHistory) {
        messages.push({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.content }]
        })
      }
    }

    // Add the current query
    messages.push({ role: 'user', parts: [{ text: query }] })

    // Start chat session
    const chat = trendFinderModel.startChat({
      history: messages.slice(0, -1) as any, // All but the last message
    })

    // Send the current query
    const result = await chat.sendMessage(query)
    const response = result.response.text()

    // Extract any statistical data mentioned for structured display
    const extractedStats = extractStatistics(response)

    return NextResponse.json({
      success: true,
      response,
      extractedStats,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Trend finder error:', error)
    return NextResponse.json(
      { error: 'Failed to process query. Please try again.' },
      { status: 500 }
    )
  }
}

// Helper to extract key statistics from the response
function extractStatistics(text: string): { label: string; value: string }[] {
  const stats: { label: string; value: string }[] = []
  
  // Look for percentage patterns
  const percentMatches = text.match(/(\d+(?:\.\d+)?%)/g)
  
  // Look for count patterns like "X games" or "X times"
  const countMatches = text.match(/(\d+)\s+(games?|times?|instances?|occurrences?|matchups?)/gi)
  
  // Look for record patterns like "X-Y"
  const recordMatches = text.match(/(\d+-\d+(?:-\d+)?)\s+(record|ATS|O\/U|SU)/gi)

  if (percentMatches && percentMatches.length > 0) {
    stats.push({ label: 'Key Percentage', value: percentMatches[0] })
  }
  
  if (countMatches && countMatches.length > 0) {
    stats.push({ label: 'Sample Size', value: countMatches[0] })
  }

  if (recordMatches && recordMatches.length > 0) {
    stats.push({ label: 'Record', value: recordMatches[0] })
  }

  return stats
}

// GET endpoint for health check
export async function GET() {
  return NextResponse.json({ 
    status: 'ok', 
    service: 'trend-finder',
    capabilities: ['NFL', 'NBA', 'MLB', 'NHL', 'NCAAF', 'NCAAB', 'WNBA']
  })
}
