#!/usr/bin/env npx tsx
/**
 * Test script for Trend Finder API
 * Tests both local and production endpoints
 * Usage: npx tsx scripts/test-trend-finder.ts
 */

const PRODUCTION_URL = 'https://matchups.vercel.app'
const LOCAL_URL = 'http://localhost:3000'

const TEST_QUERIES = [
  "How many times in the past 10 years of the NFL have both teams scored a rushing TD and passing TD in both halves?",
  "NFL playoff underdogs cover rate?",
  "What percentage of NBA games go over when total is above 230?",
  "How often do home teams cover a spread of 7 or more in NFL?",
]

async function testTrendFinder(baseUrl: string, query: string): Promise<{
  success: boolean
  response?: string
  historicalData?: any
  error?: string
  latency: number
}> {
  const start = Date.now()
  
  try {
    const res = await fetch(`${baseUrl}/api/trend-finder`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    })
    
    const latency = Date.now() - start
    
    if (!res.ok) {
      const errorText = await res.text()
      return { success: false, error: `HTTP ${res.status}: ${errorText}`, latency }
    }
    
    const data = await res.json()
    return {
      success: true,
      response: data.response,
      historicalData: data.historicalData,
      latency
    }
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : 'Unknown error',
      latency: Date.now() - start
    }
  }
}

async function runTests() {
  console.log('='.repeat(80))
  console.log('TREND FINDER API TEST')
  console.log('='.repeat(80))
  console.log()
  
  // Test health endpoint first
  console.log('Testing health endpoint...')
  try {
    const healthRes = await fetch(`${PRODUCTION_URL}/api/trend-finder`)
    if (healthRes.ok) {
      const health = await healthRes.json()
      console.log('✅ Health check passed:', health)
    } else {
      console.log('⚠️ Health endpoint returned:', healthRes.status)
    }
  } catch (e) {
    console.log('❌ Health check failed:', e)
  }
  console.log()
  
  // Test with the key question
  const keyQuery = TEST_QUERIES[0]
  console.log('='.repeat(80))
  console.log('KEY TEST: NFL Rushing/Passing TD Question')
  console.log('='.repeat(80))
  console.log(`Query: "${keyQuery}"`)
  console.log()
  
  const result = await testTrendFinder(PRODUCTION_URL, keyQuery)
  
  if (result.success) {
    console.log(`✅ Response received in ${result.latency}ms`)
    console.log()
    console.log('--- RESPONSE ---')
    console.log(result.response)
    console.log()
    
    if (result.historicalData) {
      console.log('--- HISTORICAL DATA ---')
      console.log(`Total Games: ${result.historicalData.totalGames}`)
      console.log(`Matching Games: ${result.historicalData.matchingGames}`)
      console.log(`Percentage: ${result.historicalData.percentage}`)
      if (result.historicalData.sampleGames?.length) {
        console.log('Sample Games:')
        result.historicalData.sampleGames.forEach((g: any) => {
          console.log(`  - ${g.date}: ${g.matchup} (${g.score})`)
        })
      }
    }
  } else {
    console.log(`❌ Error: ${result.error}`)
  }
  
  console.log()
  console.log('='.repeat(80))
  console.log('Additional Tests')
  console.log('='.repeat(80))
  
  for (const query of TEST_QUERIES.slice(1)) {
    console.log()
    console.log(`Query: "${query}"`)
    const r = await testTrendFinder(PRODUCTION_URL, query)
    if (r.success) {
      console.log(`✅ ${r.latency}ms - ${r.response?.substring(0, 150)}...`)
    } else {
      console.log(`❌ ${r.error}`)
    }
  }
  
  console.log()
  console.log('='.repeat(80))
  console.log('TEST COMPLETE')
  console.log('='.repeat(80))
}

runTests().catch(console.error)
