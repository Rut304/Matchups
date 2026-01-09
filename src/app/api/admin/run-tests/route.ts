import { NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'
import * as fs from 'fs/promises'
import * as path from 'path'

const execAsync = promisify(exec)

interface PlaywrightResult {
  config: unknown
  suites: PlaywrightSuite[]
  errors: unknown[]
  stats: {
    startTime: string
    duration: number
    expected: number
    skipped: number
    unexpected: number
    flaky: number
  }
}

interface PlaywrightSuite {
  title: string
  file: string
  column: number
  line: number
  specs: PlaywrightSpec[]
  suites?: PlaywrightSuite[]
}

interface PlaywrightSpec {
  title: string
  ok: boolean
  tests: PlaywrightTest[]
}

interface PlaywrightTest {
  timeout: number
  annotations: unknown[]
  expectedStatus: string
  projectId: string
  projectName: string
  results: PlaywrightTestResult[]
  status: 'expected' | 'unexpected' | 'skipped' | 'flaky'
}

interface PlaywrightTestResult {
  workerIndex: number
  status: 'passed' | 'failed' | 'timedOut' | 'skipped'
  duration: number
  errors: { message: string }[]
  stderr: string[]
  stdout: string[]
  retry: number
  startTime: string
  attachments: unknown[]
}

interface TestResult {
  name: string
  status: 'passed' | 'failed'
  duration: number
  error?: string
  category: string
}

interface TestCategory {
  name: string
  tests: TestResult[]
  passed: number
  failed: number
  total: number
}

// Map test titles to categories
function getCategoryForTest(specTitle: string, suiteTitle: string): string {
  const title = `${suiteTitle} ${specTitle}`.toLowerCase()
  
  if (title.includes('homepage') || title.includes('page load')) return 'Page Load Tests'
  if (title.includes('navigation') || title.includes('nav')) return 'Navigation Tests'
  if (title.includes('nfl') || title.includes('nba') || title.includes('mlb') || title.includes('nhl') || title.includes('ncaa')) return 'Sports Page Tests'
  if (title.includes('leaderboard') || title.includes('expert')) return 'Feature Tests'
  if (title.includes('market') || title.includes('picks')) return 'Feature Tests'
  if (title.includes('calculator') || title.includes('builder')) return 'Feature Tests'
  if (title.includes('admin')) return 'Admin Tests'
  if (title.includes('mobile') || title.includes('viewport')) return 'Mobile Responsiveness'
  if (title.includes('api') || title.includes('endpoint')) return 'API Tests'
  if (title.includes('link') || title.includes('broken')) return 'Link Verification'
  if (title.includes('performance') || title.includes('load')) return 'Performance'
  
  return 'General Tests'
}

// Parse Playwright JSON output into our format
function parsePlaywrightResults(results: PlaywrightResult): TestCategory[] {
  const categories: Map<string, TestResult[]> = new Map()
  
  function processSuite(suite: PlaywrightSuite, parentTitle: string = '') {
    const suiteTitle = parentTitle ? `${parentTitle} > ${suite.title}` : suite.title
    
    for (const spec of suite.specs || []) {
      for (const test of spec.tests || []) {
        const result = test.results[0] // Get first result
        if (!result) continue
        
        const category = getCategoryForTest(spec.title, suiteTitle)
        const testResult: TestResult = {
          name: spec.title,
          status: result.status === 'passed' ? 'passed' : 'failed',
          duration: result.duration,
          error: result.errors?.length > 0 ? result.errors[0].message?.substring(0, 100) : undefined,
          category
        }
        
        if (!categories.has(category)) {
          categories.set(category, [])
        }
        categories.get(category)!.push(testResult)
      }
    }
    
    // Process nested suites
    for (const nestedSuite of suite.suites || []) {
      processSuite(nestedSuite, suiteTitle)
    }
  }
  
  // Process all suites
  for (const suite of results.suites || []) {
    processSuite(suite)
  }
  
  // Convert to TestCategory array
  const categoryArray: TestCategory[] = []
  for (const [name, tests] of categories) {
    const passed = tests.filter(t => t.status === 'passed').length
    const failed = tests.filter(t => t.status === 'failed').length
    categoryArray.push({
      name,
      tests,
      passed,
      failed,
      total: tests.length
    })
  }
  
  // Sort by category name
  categoryArray.sort((a, b) => a.name.localeCompare(b.name))
  
  return categoryArray
}

export async function POST(request: Request) {
  try {
    const { testFile } = await request.json().catch(() => ({}))
    
    // Determine which test file to run
    const testPath = testFile || 'e2e/full-site.spec.ts'
    const outputPath = path.join(process.cwd(), 'test-results', 'results.json')
    
    // Ensure test-results directory exists
    await fs.mkdir(path.join(process.cwd(), 'test-results'), { recursive: true })
    
    // Ensure Playwright browsers are installed
    console.log('Ensuring Playwright browsers are installed...')
    try {
      await execAsync('npx playwright install chromium', {
        cwd: process.cwd(),
        timeout: 120000, // 2 minute timeout for install
        env: {
          ...process.env,
          PLAYWRIGHT_BROWSERS_PATH: '0', // Use default browser location
        }
      })
      console.log('Playwright browsers ready')
    } catch (installError) {
      console.log('Playwright install check completed (may already be installed)')
    }
    
    // Run Playwright tests with JSON reporter
    const command = `npx playwright test ${testPath} --reporter=json --output=${path.dirname(outputPath)}`
    
    console.log(`Running: ${command}`)
    
    let stdout = ''
    let stderr = ''
    
    try {
      const result = await execAsync(command, {
        cwd: process.cwd(),
        timeout: 300000, // 5 minute timeout
        maxBuffer: 50 * 1024 * 1024, // 50MB buffer
        env: {
          ...process.env,
          CI: 'true', // Helps Playwright know it's in CI mode
        }
      })
      stdout = result.stdout
      stderr = result.stderr
    } catch (execError) {
      // Playwright exits with non-zero code if tests fail, but still outputs results
      const error = execError as { stdout?: string; stderr?: string; message?: string }
      stdout = error.stdout || ''
      stderr = error.stderr || ''
      
      // Only throw if there's no output at all (indicates a real error)
      if (!stdout && !stderr) {
        throw new Error(error.message || 'Failed to run tests')
      }
    }
    
    // Parse the JSON output from stdout
    let results: TestCategory[] = []
    
    // Playwright outputs JSON to stdout with --reporter=json
    if (stdout) {
      try {
        // Find the JSON in the output (sometimes there's extra text)
        const jsonMatch = stdout.match(/\{[\s\S]*"config"[\s\S]*\}/)
        if (jsonMatch) {
          const playwrightResults: PlaywrightResult = JSON.parse(jsonMatch[0])
          results = parsePlaywrightResults(playwrightResults)
        }
      } catch (parseError) {
        console.error('Failed to parse Playwright JSON:', parseError)
      }
    }
    
    // If we couldn't parse results, try to read from file
    if (results.length === 0) {
      try {
        const fileContent = await fs.readFile(outputPath, 'utf-8')
        const playwrightResults: PlaywrightResult = JSON.parse(fileContent)
        results = parsePlaywrightResults(playwrightResults)
      } catch {
        // File doesn't exist or isn't valid JSON
      }
    }
    
    // If still no results, return empty with error
    if (results.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Could not parse test results',
        stdout: stdout.substring(0, 1000),
        stderr: stderr.substring(0, 1000),
        categories: []
      })
    }
    
    // Calculate totals
    const totals = results.reduce(
      (acc, cat) => ({
        passed: acc.passed + cat.passed,
        failed: acc.failed + cat.failed,
        total: acc.total + cat.total
      }),
      { passed: 0, failed: 0, total: 0 }
    )
    
    return NextResponse.json({
      success: true,
      categories: results,
      totals,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Test execution error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to run tests',
        categories: []
      },
      { status: 500 }
    )
  }
}

// GET endpoint to check if tests are available
export async function GET() {
  try {
    // Check if Playwright is installed
    const testFilePath = path.join(process.cwd(), 'e2e', 'full-site.spec.ts')
    
    try {
      await fs.access(testFilePath)
    } catch {
      return NextResponse.json({
        available: false,
        error: 'Test file not found',
        testFile: 'e2e/full-site.spec.ts'
      })
    }
    
    // Check for playwright
    const playwrightPath = path.join(process.cwd(), 'node_modules', '@playwright', 'test')
    try {
      await fs.access(playwrightPath)
    } catch {
      return NextResponse.json({
        available: false,
        error: 'Playwright not installed',
        suggestion: 'Run: npm install -D @playwright/test'
      })
    }
    
    return NextResponse.json({
      available: true,
      testFile: 'e2e/full-site.spec.ts',
      message: 'E2E tests are ready to run'
    })
  } catch (error) {
    return NextResponse.json({
      available: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
