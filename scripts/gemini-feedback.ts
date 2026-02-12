#!/usr/bin/env npx tsx
/**
 * Gemini Collaboration Script
 * Uses Gemini API to get feedback on the site and suggest improvements
 * 
 * Usage: npx tsx scripts/gemini-feedback.ts
 */

import { GoogleGenerativeAI } from '@google/generative-ai'

const GEMINI_API_KEY = process.env.GEMINI_API_KEY

if (!GEMINI_API_KEY) {
  console.error('Error: GEMINI_API_KEY environment variable not set')
  process.exit(1)
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY)
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

// Current site structure for context
const SITE_CONTEXT = `
# Matchups - Sports Gambler Intelligence Platform

## Current Features:
1. **Homepage** - Redesigned with hero section featuring Trend Finder AI search
2. **Sports Pages** - NFL, NBA, NHL, MLB with matchup analysis, odds, trends
3. **Trend Finder** - AI-powered historical sports data queries using Gemini
4. **Leaderboard** - Track cappers and their performance
5. **Markets** - Prediction markets (Polymarket, Kalshi integration)
6. **Marketplace** - Share and discover betting systems
7. **Systems Builder** - Create custom betting systems with rules
8. **Dashboard** - User personalization (favorites, systems, alerts)
9. **Profile** - User settings and preferences
10. **Admin Panel** - Full site management with tabs:
    - Overview, Data, Diagnostics, Users, Scrapers, Ads, Edge, Infrastructure, Settings, API usage

## Technical Stack:
- Next.js 16 with App Router
- Supabase (auth + database)
- Tailwind CSS with custom dark theme
- Vercel deployment with cron jobs

## User Customization Available:
- Follow games, teams, players
- Create and save betting systems
- Set notification preferences
- Customize display preferences

## Admin Capabilities:
- User management
- Ad configuration
- Scraper control
- Edge feature toggles
- Marketplace settings
- Maintenance mode

## Key Questions for Improvement:
1. How well does the Trend Finder answer complex queries like "how many times in the past 10 years of the NFL have both teams scored a rushing TD and passing TD in both halves?"
2. What features should be prioritized for bettors?
3. How can we improve user engagement?
4. What admin capabilities are missing?
`

async function askGemini(question: string): Promise<string> {
  const prompt = `${SITE_CONTEXT}

---

Question: ${question}

Please provide specific, actionable recommendations. Focus on what would make this the best sports betting intelligence platform.`

  const result = await model.generateContent(prompt)
  return result.response.text()
}

async function runFeedbackSession() {
  console.log('=' .repeat(80))
  console.log('GEMINI COLLABORATION SESSION')
  console.log('=' .repeat(80))
  console.log()
  
  const questions = [
    // Test the trend finder capability
    "Can you analyze the question 'How many times in the past 10 years of the NFL have both teams scored a rushing TD and passing TD in both halves?' - What data would we need to answer this accurately? What's missing from typical play-by-play data?",
    
    // Site feedback
    "Review the site structure. What are the top 3 features we should prioritize building or improving for serious sports bettors?",
    
    // Admin panel
    "What admin capabilities should we add to manage a sports betting intelligence platform effectively?",
    
    // User engagement
    "How can we increase user engagement and retention? What notifications or features would bring users back daily?",
    
    // Data strategy
    "What historical data sources should we prioritize integrating for comprehensive trend analysis?",
  ]
  
  for (const question of questions) {
    console.log('-'.repeat(80))
    console.log(`Q: ${question}`)
    console.log('-'.repeat(80))
    
    try {
      const answer = await askGemini(question)
      console.log()
      console.log(answer)
      console.log()
    } catch (error) {
      console.error('Error:', error)
    }
    
    // Rate limit
    await new Promise(r => setTimeout(r, 1000))
  }
  
  console.log('=' .repeat(80))
  console.log('SESSION COMPLETE')
  console.log('=' .repeat(80))
}

// Run specific analysis
async function analyzeSpecificFeature(feature: string) {
  console.log(`\nAnalyzing: ${feature}`)
  const response = await askGemini(`Provide detailed recommendations for improving: ${feature}`)
  console.log(response)
}

// Main execution
const args = process.argv.slice(2)
if (args[0] === '--feature') {
  analyzeSpecificFeature(args.slice(1).join(' '))
} else {
  runFeedbackSession()
}
