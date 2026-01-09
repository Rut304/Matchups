'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  Play,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Zap,
  Activity,
  Terminal,
  Globe,
  Navigation,
  Smartphone,
  Link2,
  Gauge,
  TestTube,
  Server,
  Shield,
  Download
} from 'lucide-react'

// Test result types
interface TestResult {
  name: string
  status: 'passed' | 'failed' | 'skipped' | 'pending'
  duration: number
  error?: string
  category: string
}

interface TestCategory {
  name: string
  icon: React.ElementType
  tests: TestResult[]
  passed: number
  failed: number
  total: number
}

interface APITestCategory {
  name: string
  tests: TestResult[]
  passed: number
  failed: number
  total: number
}

// Map category names to icons
const categoryIcons: Record<string, React.ElementType> = {
  'Page Load Tests': Globe,
  'Navigation Tests': Navigation,
  'Sports Page Tests': Activity,
  'Feature Tests': Zap,
  'Admin Tests': Terminal,
  'Mobile Responsiveness': Smartphone,
  'API Tests': Server,
  'Link Verification': Link2,
  'Performance': Gauge,
  'General Tests': TestTube
}

// Mock test data structure - In production this would be fetched from test results
const generateMockTestResults = (): TestCategory[] => {
  const categories: TestCategory[] = [
    {
      name: 'Page Load Tests',
      icon: Globe,
      tests: [
        { name: 'Homepage loads successfully', status: 'passed', duration: 1823, category: 'Page Load' },
        { name: 'NFL Page loads successfully', status: 'passed', duration: 1654, category: 'Page Load' },
        { name: 'NBA Page loads successfully', status: 'passed', duration: 1721, category: 'Page Load' },
        { name: 'NHL Page loads successfully', status: 'passed', duration: 1589, category: 'Page Load' },
        { name: 'MLB Page loads successfully', status: 'passed', duration: 1645, category: 'Page Load' },
        { name: 'NCAAF Page loads successfully', status: 'failed', duration: 2012, error: 'Console error detected', category: 'Page Load' },
        { name: 'NCAAB Page loads successfully', status: 'failed', duration: 1987, error: 'Console error detected', category: 'Page Load' },
        { name: 'Prediction Markets loads', status: 'passed', duration: 1456, category: 'Page Load' },
        { name: 'Betting Trends loads', status: 'passed', duration: 1234, category: 'Page Load' },
        { name: 'Expert Tracker loads', status: 'passed', duration: 1567, category: 'Page Load' },
        { name: 'Analytics Dashboard loads', status: 'passed', duration: 1789, category: 'Page Load' },
        { name: 'Live Center loads', status: 'passed', duration: 1654, category: 'Page Load' },
        { name: 'System Builder loads', status: 'passed', duration: 1432, category: 'Page Load' },
        { name: 'Betting Calculators loads', status: 'passed', duration: 1321, category: 'Page Load' },
        { name: 'My Picks Tracker loads', status: 'passed', duration: 1456, category: 'Page Load' },
        { name: 'Sus Plays loads', status: 'passed', duration: 1234, category: 'Page Load' },
        { name: 'Admin Dashboard loads', status: 'passed', duration: 1123, category: 'Page Load' },
      ],
      passed: 15,
      failed: 2,
      total: 17
    },
    {
      name: 'Navigation Tests',
      icon: Navigation,
      tests: [
        { name: 'Navbar contains all sport links', status: 'passed', duration: 892, category: 'Navigation' },
        { name: 'Sport links navigate correctly', status: 'passed', duration: 2341, category: 'Navigation' },
        { name: 'Logo navigates to homepage', status: 'passed', duration: 654, category: 'Navigation' },
        { name: 'Feature pages accessible', status: 'passed', duration: 1876, category: 'Navigation' },
        { name: 'Cross-page links work', status: 'passed', duration: 3421, category: 'Navigation' },
      ],
      passed: 5,
      failed: 0,
      total: 5
    },
    {
      name: 'Sports Page Tests',
      icon: Activity,
      tests: [
        { name: 'NFL page has game cards', status: 'passed', duration: 1234, category: 'Sports' },
        { name: 'NBA page has game cards', status: 'passed', duration: 1345, category: 'Sports' },
        { name: 'NHL page has game cards', status: 'passed', duration: 1256, category: 'Sports' },
        { name: 'MLB page has game cards', status: 'passed', duration: 1189, category: 'Sports' },
        { name: 'AI Picks toggle works', status: 'passed', duration: 876, category: 'Sports' },
        { name: 'Filters work correctly', status: 'passed', duration: 765, category: 'Sports' },
      ],
      passed: 6,
      failed: 0,
      total: 6
    },
    {
      name: 'Feature Page Tests',
      icon: Zap,
      tests: [
        { name: 'Live Center loads with data', status: 'passed', duration: 1567, category: 'Features' },
        { name: 'System Builder UI works', status: 'passed', duration: 1234, category: 'Features' },
        { name: 'My Picks stats display', status: 'passed', duration: 987, category: 'Features' },
        { name: 'Calculators accept input', status: 'passed', duration: 654, category: 'Features' },
        { name: 'Leaderboard filters work', status: 'passed', duration: 1432, category: 'Features' },
        { name: 'Sus Plays voting works', status: 'passed', duration: 876, category: 'Features' },
        { name: 'Markets search works', status: 'passed', duration: 765, category: 'Features' },
        { name: 'Trends filters work', status: 'passed', duration: 654, category: 'Features' },
      ],
      passed: 8,
      failed: 0,
      total: 8
    },
    {
      name: 'Mobile Responsiveness',
      icon: Smartphone,
      tests: [
        { name: 'Homepage renders on mobile', status: 'passed', duration: 1234, category: 'Mobile' },
        { name: 'Mobile navigation works', status: 'failed', duration: 987, error: 'Menu button not found', category: 'Mobile' },
        { name: 'Sport pages render mobile', status: 'passed', duration: 2345, category: 'Mobile' },
        { name: 'Calculators usable mobile', status: 'passed', duration: 876, category: 'Mobile' },
      ],
      passed: 3,
      failed: 1,
      total: 4
    },
    {
      name: 'Error Handling',
      icon: AlertTriangle,
      tests: [
        { name: '404 page for invalid routes', status: 'passed', duration: 543, category: 'Errors' },
        { name: 'Invalid dynamic routes', status: 'passed', duration: 654, category: 'Errors' },
        { name: 'Slow network handling', status: 'passed', duration: 3456, category: 'Errors' },
      ],
      passed: 3,
      failed: 0,
      total: 3
    },
    {
      name: 'Performance',
      icon: Gauge,
      tests: [
        { name: 'Homepage loads under 5s', status: 'passed', duration: 2341, category: 'Performance' },
        { name: 'Critical pages under 5s', status: 'passed', duration: 4567, category: 'Performance' },
      ],
      passed: 2,
      failed: 0,
      total: 2
    },
    {
      name: 'Link Verification',
      icon: Link2,
      tests: [
        { name: 'No broken internal links', status: 'failed', duration: 5678, error: 'Broken: /scores, /lineshop', category: 'Links' },
        { name: 'External links configured', status: 'passed', duration: 1234, category: 'Links' },
      ],
      passed: 1,
      failed: 1,
      total: 2
    },
  ]

  return categories
}

type FilterType = 'all' | 'passed' | 'failed'
type TestMode = 'mock' | 'real'

export default function DiagnosticsPage() {
  const [isRunning, setIsRunning] = useState(false)
  const [testResults, setTestResults] = useState<TestCategory[]>([])
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [filter, setFilter] = useState<FilterType>('all')
  const [lastRun, setLastRun] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  const [testMode, setTestMode] = useState<TestMode>('mock')
  const [isPlaywrightAvailable, setIsPlaywrightAvailable] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Check if Playwright is available
  useEffect(() => {
    const checkPlaywright = async () => {
      try {
        const response = await fetch('/api/admin/run-tests')
        const data = await response.json()
        setIsPlaywrightAvailable(data.available)
      } catch {
        setIsPlaywrightAvailable(false)
      }
    }
    checkPlaywright()
  }, [])

  useEffect(() => {
    // Load initial mock results
    const results = generateMockTestResults()
    setTestResults(results)
    setLastRun(new Date().toLocaleString())
  }, [])

  // Convert API response to TestCategory with icons
  const mapAPIResultsToCategories = useCallback((apiCategories: APITestCategory[]): TestCategory[] => {
    return apiCategories.map(cat => ({
      ...cat,
      icon: categoryIcons[cat.name] || TestTube
    }))
  }, [])

  const runTests = async () => {
    setIsRunning(true)
    setProgress(0)
    setTestResults([])
    setErrorMessage(null)

    if (testMode === 'mock') {
      // Simulate test progress for mock mode
      for (let i = 0; i <= 100; i += 2) {
        await new Promise(resolve => setTimeout(resolve, 50))
        setProgress(i)
      }
      setTestResults(generateMockTestResults())
      setLastRun(new Date().toLocaleString())
      setIsRunning(false)
    } else {
      // Run real Playwright tests via API
      try {
        setProgress(10)
        const response = await fetch('/api/admin/run-tests', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ testFile: 'e2e/full-site.spec.ts' })
        })
        
        setProgress(50)
        const data = await response.json()
        setProgress(90)
        
        if (data.success && data.categories) {
          const categoriesWithIcons = mapAPIResultsToCategories(data.categories)
          setTestResults(categoriesWithIcons)
          setLastRun(new Date().toLocaleString())
        } else {
          setErrorMessage(data.error || 'Failed to run tests')
          // Still show mock results as fallback
          setTestResults(generateMockTestResults())
        }
        
        setProgress(100)
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : 'Failed to run tests')
        // Show mock results as fallback
        setTestResults(generateMockTestResults())
      }
      
      setIsRunning(false)
    }
  }

  const toggleCategory = (name: string) => {
    const newExpanded = new Set(expandedCategories)
    if (newExpanded.has(name)) {
      newExpanded.delete(name)
    } else {
      newExpanded.add(name)
    }
    setExpandedCategories(newExpanded)
  }

  const expandAll = () => {
    setExpandedCategories(new Set(testResults.map(c => c.name)))
  }

  const collapseAll = () => {
    setExpandedCategories(new Set())
  }

  // Calculate totals
  const totals = testResults.reduce(
    (acc, cat) => ({
      passed: acc.passed + cat.passed,
      failed: acc.failed + cat.failed,
      total: acc.total + cat.total
    }),
    { passed: 0, failed: 0, total: 0 }
  )

  const passRate = totals.total > 0 ? ((totals.passed / totals.total) * 100).toFixed(1) : '0'

  // Filter tests
  const filterTests = (tests: TestResult[]): TestResult[] => {
    if (filter === 'all') return tests
    return tests.filter(t => 
      filter === 'passed' ? t.status === 'passed' : t.status === 'failed'
    )
  }

  return (
    <div className="min-h-screen" style={{ background: '#0A0A0F' }}>
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl" style={{ background: 'linear-gradient(135deg, #00FF88, #00A8FF)' }}>
              <Terminal className="w-6 h-6 text-black" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-white">E2E Test Diagnostics</h1>
              <p style={{ color: '#808090' }}>
                Run and monitor Playwright end-to-end tests
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="px-4 py-2 rounded-xl font-medium transition-all"
              style={{ background: '#12121A', color: '#808090' }}
            >
              ← Back to Admin
            </Link>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <div className="p-4 rounded-xl" style={{ background: '#12121A' }}>
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-4 h-4" style={{ color: '#00A8FF' }} />
              <span className="text-xs" style={{ color: '#808090' }}>Total Tests</span>
            </div>
            <p className="text-2xl font-bold text-white">{totals.total}</p>
          </div>
          <div className="p-4 rounded-xl" style={{ background: '#12121A' }}>
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-4 h-4" style={{ color: '#00FF88' }} />
              <span className="text-xs" style={{ color: '#808090' }}>Passed</span>
            </div>
            <p className="text-2xl font-bold" style={{ color: '#00FF88' }}>{totals.passed}</p>
          </div>
          <div className="p-4 rounded-xl" style={{ background: '#12121A' }}>
            <div className="flex items-center gap-2 mb-2">
              <XCircle className="w-4 h-4" style={{ color: '#FF3366' }} />
              <span className="text-xs" style={{ color: '#808090' }}>Failed</span>
            </div>
            <p className="text-2xl font-bold" style={{ color: '#FF3366' }}>{totals.failed}</p>
          </div>
          <div className="p-4 rounded-xl" style={{ background: '#12121A' }}>
            <div className="flex items-center gap-2 mb-2">
              <Gauge className="w-4 h-4" style={{ color: '#FFD700' }} />
              <span className="text-xs" style={{ color: '#808090' }}>Pass Rate</span>
            </div>
            <p className="text-2xl font-bold" style={{ color: parseFloat(passRate) >= 90 ? '#00FF88' : parseFloat(passRate) >= 70 ? '#FFD700' : '#FF3366' }}>
              {passRate}%
            </p>
          </div>
          <div className="p-4 rounded-xl" style={{ background: '#12121A' }}>
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4" style={{ color: '#808090' }} />
              <span className="text-xs" style={{ color: '#808090' }}>Last Run</span>
            </div>
            <p className="text-sm font-medium text-white truncate">{lastRun || 'Never'}</p>
          </div>
        </div>

        {/* Error Message */}
        {errorMessage && (
          <div className="mb-4 p-4 rounded-xl flex items-center gap-3" style={{ background: 'rgba(255, 51, 102, 0.1)', border: '1px solid #FF3366' }}>
            <AlertTriangle className="w-5 h-5" style={{ color: '#FF3366' }} />
            <span style={{ color: '#FF3366' }}>{errorMessage}</span>
            <button 
              onClick={() => setErrorMessage(null)}
              className="ml-auto text-sm underline"
              style={{ color: '#808090' }}
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Actions Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            {/* Test Mode Toggle */}
            <div className="flex items-center gap-1 p-1 rounded-xl" style={{ background: '#12121A' }}>
              <button
                onClick={() => setTestMode('mock')}
                className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
                style={{
                  background: testMode === 'mock' ? '#FF6B00' : 'transparent',
                  color: testMode === 'mock' ? '#FFF' : '#808090'
                }}
              >
                Mock
              </button>
              <button
                onClick={() => setTestMode('real')}
                disabled={!isPlaywrightAvailable}
                className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all disabled:opacity-50"
                style={{
                  background: testMode === 'real' ? '#00FF88' : 'transparent',
                  color: testMode === 'real' ? '#000' : '#808090'
                }}
                title={isPlaywrightAvailable ? 'Run real Playwright tests' : 'Playwright not available'}
              >
                E2E
              </button>
            </div>

            <button
              onClick={runTests}
              disabled={isRunning}
              className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
              style={{ background: 'linear-gradient(135deg, #00FF88, #00A8FF)', color: '#000' }}
            >
              {isRunning ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  Running... {progress}%
                </>
              ) : (
                <>
                  <Play className="w-5 h-5" />
                  Run {testMode === 'real' ? 'E2E' : 'Mock'} Tests
                </>
              )}
            </button>
            
            <button
              onClick={expandAll}
              className="px-4 py-2 rounded-xl font-medium transition-all"
              style={{ background: '#12121A', color: '#808090' }}
            >
              Expand All
            </button>
            <button
              onClick={collapseAll}
              className="px-4 py-2 rounded-xl font-medium transition-all"
              style={{ background: '#12121A', color: '#808090' }}
            >
              Collapse All
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 p-1 rounded-xl" style={{ background: '#12121A' }}>
              <button
                onClick={() => setFilter('all')}
                className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
                style={{
                  background: filter === 'all' ? '#FF6B00' : 'transparent',
                  color: filter === 'all' ? '#FFF' : '#808090'
                }}
              >
                All
              </button>
              <button
                onClick={() => setFilter('passed')}
                className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
                style={{
                  background: filter === 'passed' ? '#00FF88' : 'transparent',
                  color: filter === 'passed' ? '#000' : '#808090'
                }}
              >
                Passed
              </button>
              <button
                onClick={() => setFilter('failed')}
                className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
                style={{
                  background: filter === 'failed' ? '#FF3366' : 'transparent',
                  color: filter === 'failed' ? '#FFF' : '#808090'
                }}
              >
                Failed
              </button>
            </div>
          </div>
        </div>

        {/* Progress Bar (when running) */}
        {isRunning && (
          <div className="mb-6">
            <div className="h-2 rounded-full overflow-hidden" style={{ background: '#12121A' }}>
              <div 
                className="h-full transition-all duration-300"
                style={{ 
                  width: `${progress}%`,
                  background: 'linear-gradient(90deg, #00FF88, #00A8FF)'
                }}
              />
            </div>
          </div>
        )}

        {/* Test Categories */}
        <div className="space-y-4">
          {testResults.map((category) => {
            const filteredTests = filterTests(category.tests)
            if (filter !== 'all' && filteredTests.length === 0) return null

            const isExpanded = expandedCategories.has(category.name)
            const CategoryIcon = category.icon

            return (
              <div 
                key={category.name}
                className="rounded-xl overflow-hidden"
                style={{ background: '#12121A' }}
              >
                {/* Category Header */}
                <button
                  onClick={() => toggleCategory(category.name)}
                  className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-all"
                >
                  <div className="flex items-center gap-3">
                    {isExpanded ? (
                      <ChevronDown className="w-5 h-5" style={{ color: '#808090' }} />
                    ) : (
                      <ChevronRight className="w-5 h-5" style={{ color: '#808090' }} />
                    )}
                    <div className="p-2 rounded-lg" style={{ background: 'rgba(255,107,0,0.1)' }}>
                      <CategoryIcon className="w-4 h-4" style={{ color: '#FF6B00' }} />
                    </div>
                    <span className="font-bold text-white">{category.name}</span>
                    <span className="text-sm" style={{ color: '#808090' }}>
                      ({filteredTests.length} tests)
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" style={{ color: '#00FF88' }} />
                      <span className="font-medium" style={{ color: '#00FF88' }}>{category.passed}</span>
                    </div>
                    {category.failed > 0 && (
                      <div className="flex items-center gap-2">
                        <XCircle className="w-4 h-4" style={{ color: '#FF3366' }} />
                        <span className="font-medium" style={{ color: '#FF3366' }}>{category.failed}</span>
                      </div>
                    )}
                    {/* Mini progress bar */}
                    <div className="w-24 h-2 rounded-full overflow-hidden" style={{ background: '#1A1A24' }}>
                      <div 
                        className="h-full"
                        style={{ 
                          width: `${(category.passed / category.total) * 100}%`,
                          background: category.failed > 0 
                            ? 'linear-gradient(90deg, #00FF88, #FFD700)' 
                            : '#00FF88'
                        }}
                      />
                    </div>
                  </div>
                </button>

                {/* Tests List */}
                {isExpanded && (
                  <div className="border-t" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                    {filteredTests.map((test, idx) => (
                      <div 
                        key={idx}
                        className="flex items-center justify-between px-6 py-3 hover:bg-white/5 transition-all"
                        style={{ borderBottom: idx < filteredTests.length - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none' }}
                      >
                        <div className="flex items-center gap-3">
                          {test.status === 'passed' ? (
                            <CheckCircle className="w-4 h-4" style={{ color: '#00FF88' }} />
                          ) : test.status === 'failed' ? (
                            <XCircle className="w-4 h-4" style={{ color: '#FF3366' }} />
                          ) : (
                            <Clock className="w-4 h-4" style={{ color: '#808090' }} />
                          )}
                          <div>
                            <span className="text-white">{test.name}</span>
                            {test.error && (
                              <p className="text-xs mt-1" style={{ color: '#FF3366' }}>
                                {test.error}
                              </p>
                            )}
                          </div>
                        </div>
                        <span className="text-sm font-mono" style={{ color: '#808090' }}>
                          {test.duration}ms
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Quick Links */}
        <div className="mt-8 p-6 rounded-xl" style={{ background: '#12121A' }}>
          <h3 className="font-bold text-white mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link
              href="/admin/manage"
              className="flex items-center gap-2 px-4 py-3 rounded-xl transition-all hover:bg-white/5"
              style={{ background: '#1A1A24', color: '#808090' }}
            >
              <Shield className="w-4 h-4" />
              Content Management
            </Link>
            <Link
              href="/admin"
              className="flex items-center gap-2 px-4 py-3 rounded-xl transition-all hover:bg-white/5"
              style={{ background: '#1A1A24', color: '#808090' }}
            >
              <Activity className="w-4 h-4" />
              System Overview
            </Link>
            <a
              href="https://playwright.dev/docs/test-reporters"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-3 rounded-xl transition-all hover:bg-white/5"
              style={{ background: '#1A1A24', color: '#808090' }}
            >
              <Globe className="w-4 h-4" />
              Playwright Docs
            </a>
            <button
              className="flex items-center gap-2 px-4 py-3 rounded-xl transition-all hover:bg-white/5"
              style={{ background: '#1A1A24', color: '#808090' }}
            >
              <Download className="w-4 h-4" />
              Export Report
            </button>
          </div>
        </div>

        {/* Failed Tests Summary */}
        {totals.failed > 0 && (
          <div className="mt-8 p-6 rounded-xl" style={{ background: 'rgba(255,51,102,0.1)', border: '1px solid rgba(255,51,102,0.2)' }}>
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-5 h-5" style={{ color: '#FF3366' }} />
              <h3 className="font-bold" style={{ color: '#FF3366' }}>Failed Tests Summary</h3>
            </div>
            <div className="space-y-2">
              {testResults.flatMap(cat => 
                cat.tests
                  .filter(t => t.status === 'failed')
                  .map(t => (
                    <div key={t.name} className="flex items-center justify-between p-3 rounded-lg" style={{ background: 'rgba(0,0,0,0.3)' }}>
                      <div>
                        <span className="text-white">{t.name}</span>
                        {t.error && (
                          <p className="text-xs mt-1" style={{ color: '#FF3366' }}>{t.error}</p>
                        )}
                      </div>
                      <span className="text-xs font-mono" style={{ color: '#808090' }}>{t.category}</span>
                    </div>
                  ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
