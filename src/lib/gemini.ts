import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export const geminiModel = genAI.getGenerativeModel({ 
  model: 'gemini-2.5-flash',
  generationConfig: {
    temperature: 0.7,
    topP: 0.95,
    topK: 40,
    maxOutputTokens: 8192,
  }
})

export async function analyzeMatchup(matchupData: {
  sport: string
  homeTeam: string
  awayTeam: string
  stats: Record<string, unknown>
  injuries: string[]
  trends: string[]
}) {
  const prompt = `You are an expert sports betting analyst. Analyze this ${matchupData.sport} matchup and provide betting insights.

MATCHUP: ${matchupData.awayTeam} @ ${matchupData.homeTeam}

STATS:
${JSON.stringify(matchupData.stats, null, 2)}

INJURIES:
${matchupData.injuries.join('\n')}

TRENDS:
${matchupData.trends.join('\n')}

Provide analysis in this JSON format:
{
  "summary": "Brief 2-3 sentence overview",
  "winProbability": { "home": 0.55, "away": 0.45 },
  "projectedScore": { "home": 24, "away": 21 },
  "spreadPick": { "pick": "HOME -3", "confidence": 0.65, "reasoning": "..." },
  "totalPick": { "pick": "OVER 45.5", "confidence": 0.60, "reasoning": "..." },
  "propPicks": [
    { "player": "...", "prop": "Over 75.5 rush yards", "confidence": 0.70, "reasoning": "..." }
  ],
  "keyEdges": ["Edge 1", "Edge 2"],
  "risks": ["Risk 1", "Risk 2"]
}`

  const result = await geminiModel.generateContent(prompt)
  const response = result.response.text()
  
  try {
    // Extract JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }
  } catch (e) {
    console.error('Failed to parse AI response:', e)
  }
  
  return null
}

export async function analyzePredictionMarket(marketData: {
  question: string
  currentPrice: number
  volume: number
  endDate: string
  recentTrend: string
}) {
  const prompt = `Analyze this prediction market for betting value:

MARKET: ${marketData.question}
CURRENT PRICE: ${marketData.currentPrice}% YES
VOLUME: $${marketData.volume.toLocaleString()}
END DATE: ${marketData.endDate}
RECENT TREND: ${marketData.recentTrend}

Provide analysis in JSON:
{
  "summary": "Brief analysis",
  "fairValue": 0.55,
  "edge": 0.05,
  "recommendation": "BUY YES" | "BUY NO" | "HOLD",
  "confidence": 0.65,
  "reasoning": "..."
}`

  const result = await geminiModel.generateContent(prompt)
  const response = result.response.text()
  
  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }
  } catch (e) {
    console.error('Failed to parse AI response:', e)
  }
  
  return null
}
