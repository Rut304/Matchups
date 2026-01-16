'use client'

import { useState, useRef, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { 
  Search, Send, Loader2, Sparkles, TrendingUp, History, 
  ChevronRight, BarChart3, Lightbulb, RefreshCw, Copy, Check,
  ArrowLeft, Zap, Target, Database, Bookmark, Save, X
} from 'lucide-react'
import { useAuth } from '@/lib/auth-context'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  extractedStats?: { label: string; value: string }[]
}

// Save System Modal Component
interface SaveSystemModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: SaveSystemData) => void
  defaultQuery: string
  loading: boolean
}

interface SaveSystemData {
  name: string
  description: string
  sport: string
  bet_type: string
  custom_prompt: string
}

function SaveSystemModal({ isOpen, onClose, onSave, defaultQuery, loading }: SaveSystemModalProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [sport, setSport] = useState('NFL')
  const [betType, setBetType] = useState('spread')

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    onSave({
      name,
      description,
      sport,
      bet_type: betType,
      custom_prompt: defaultQuery
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-md mx-4 bg-[#0f0f18] border border-white/10 rounded-2xl p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center">
              <Bookmark className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-lg font-bold text-white">Save System</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white" aria-label="Close modal">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">System Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., NFL Playoff Unders System"
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-orange-500/50"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your system and its edge..."
              rows={3}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-orange-500/50 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="sport-select" className="block text-sm text-gray-400 mb-2">Sport</label>
              <select
                id="sport-select"
                value={sport}
                onChange={(e) => setSport(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-orange-500/50"
              >
                <option value="NFL">NFL</option>
                <option value="NBA">NBA</option>
                <option value="NHL">NHL</option>
                <option value="MLB">MLB</option>
                <option value="NCAAF">College Football</option>
                <option value="NCAAB">College Basketball</option>
                <option value="ALL">All Sports</option>
              </select>
            </div>
            <div>
              <label htmlFor="bet-type-select" className="block text-sm text-gray-400 mb-2">Bet Type</label>
              <select
                id="bet-type-select"
                value={betType}
                onChange={(e) => setBetType(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-orange-500/50"
              >
                <option value="spread">Spread</option>
                <option value="total">Total (O/U)</option>
                <option value="moneyline">Moneyline</option>
                <option value="prop">Props</option>
                <option value="mixed">Mixed</option>
              </select>
            </div>
          </div>

          <div className="p-3 bg-white/5 rounded-xl">
            <label className="block text-xs text-gray-500 mb-1">Original Query</label>
            <p className="text-sm text-gray-300 line-clamp-2">{defaultQuery}</p>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-white/5 text-white rounded-xl hover:bg-white/10 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Save System
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Example queries to help users get started
const EXAMPLE_QUERIES = [
  {
    category: 'NFL Playoffs',
    queries: [
      "How many games in the NFL playoffs since 2000 have both teams scored 1 rushing TD and 1 passing TD in both halves?",
      "What's the ATS record of underdogs by 7+ points in NFL playoff games since 2010?",
      "How often do NFL playoff games go over the total when played in cold weather stadiums?",
    ]
  },
  {
    category: 'NBA Trends',
    queries: [
      "What's the over/under record for Game 7s in NBA playoff series since 2000?",
      "How do teams perform ATS after a loss by 20+ points in the playoffs?",
      "What's the home team's winning percentage in NBA Finals games since 2010?",
    ]
  },
  {
    category: 'College Sports',
    queries: [
      "How do ranked teams perform ATS as road favorites in college football?",
      "What's the upset rate in March Madness first round games (12 vs 5 seeds)?",
      "How often does the team that scores first win in college football bowl games?",
    ]
  },
  {
    category: 'System Queries',
    queries: [
      "Find games where the favorite was -3 to -7, the total was under 45, and both teams had losing records",
      "What's the ATS record for teams on 3+ game losing streaks facing teams on 3+ game winning streaks?",
      "How do primetime NFL games (SNF/MNF) compare to early Sunday games for overs?",
    ]
  }
]

export default function TrendFinderPage() {
  return (
    <Suspense fallback={<TrendFinderLoading />}>
      <TrendFinderContent />
    </Suspense>
  )
}

function TrendFinderLoading() {
  return (
    <div className="min-h-screen bg-[#050508] flex items-center justify-center">
      <div className="flex items-center gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-green-500" />
        <span className="text-gray-400">Loading Trend Finder...</span>
      </div>
    </div>
  )
}

function TrendFinderContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [showExamples, setShowExamples] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const [initialQueryProcessed, setInitialQueryProcessed] = useState(false)
  
  // Save system state
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [saveQuery, setSaveQuery] = useState('')
  const [savingSystem, setSavingSystem] = useState(false)
  const [savedSuccess, setSavedSuccess] = useState<string | null>(null)

  // Handle query param from home page search
  useEffect(() => {
    const queryParam = searchParams.get('q')
    if (queryParam && !initialQueryProcessed) {
      setInitialQueryProcessed(true)
      // Auto-submit the query from URL
      handleSubmit(queryParam)
    }
  }, [searchParams, initialQueryProcessed])

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto'
      inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 150) + 'px'
    }
  }, [input])

  const handleSubmit = async (query: string = input) => {
    if (!query.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: query.trim(),
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)
    setShowExamples(false)

    try {
      // Build conversation history for context
      const conversationHistory = messages.map(m => ({
        role: m.role,
        content: m.content
      }))

      const response = await fetch('/api/trend-finder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          query: query.trim(),
          conversationHistory 
        })
      })

      const data = await response.json()

      if (data.success) {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.response,
          timestamp: new Date(),
          extractedStats: data.extractedStats
        }
        setMessages(prev => [...prev, assistantMessage])
      } else {
        throw new Error(data.error || 'Failed to get response')
      }
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error processing your query. Please try again or rephrase your question.',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleExampleClick = (query: string) => {
    setInput(query)
    inputRef.current?.focus()
  }

  const handleCopy = async (content: string, id: string) => {
    await navigator.clipboard.writeText(content)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleClear = () => {
    setMessages([])
    setShowExamples(true)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const handleOpenSaveModal = (query: string) => {
    if (!user) {
      router.push('/auth?redirect=/trend-finder')
      return
    }
    setSaveQuery(query)
    setShowSaveModal(true)
  }

  const handleSaveSystem = async (data: SaveSystemData) => {
    setSavingSystem(true)
    try {
      const response = await fetch('/api/user/systems', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          criteria: [data.custom_prompt],
          stats: {
            record: '0-0-0',
            wins: 0,
            losses: 0,
            pushes: 0,
            winPct: 0,
            roi: 0,
            units: 0,
            avgOdds: -110,
            clv: 0,
            maxDrawdown: 0,
            sharpeRatio: 0,
            kellyPct: 0
          }
        })
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to save system')
      }
      
      setShowSaveModal(false)
      setSavedSuccess(saveQuery)
      setTimeout(() => setSavedSuccess(null), 3000)
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to save system')
    } finally {
      setSavingSystem(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#050508] flex flex-col">
      {/* Save System Modal */}
      <SaveSystemModal
        isOpen={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        onSave={handleSaveSystem}
        defaultQuery={saveQuery}
        loading={savingSystem}
      />

      {/* Success Toast */}
      {savedSuccess && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 bg-emerald-500/20 border border-emerald-500/30 rounded-xl text-emerald-400 animate-in fade-in slide-in-from-top-2">
          <Check className="w-5 h-5" />
          <span className="text-sm font-medium">System saved to your dashboard!</span>
          <Link href="/dashboard?tab=systems" className="text-xs underline hover:no-underline">View</Link>
        </div>
      )}

      {/* Header */}
      <div className="border-b border-white/5 bg-[#0a0a12]">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="text-gray-400 hover:text-white transition-colors" aria-label="Go back">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">Trend Finder</h1>
                  <p className="text-xs text-gray-500">AI-Powered Sports Analytics</p>
                </div>
              </div>
            </div>
            
            {messages.length > 0 && (
              <button
                onClick={handleClear}
                className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                New Chat
              </button>
            )}
          </div>
        </div>
      </div>

      {/* PROMINENT SEARCH BAR AT TOP */}
      <div className="bg-gradient-to-b from-[#0f0f18] to-transparent py-6 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="relative flex items-end gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask any sports trend question... (e.g., 'What's the ATS record for NFL underdogs in playoff games?')"
                className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white text-lg placeholder-gray-500 resize-none focus:outline-none focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/30 transition-all shadow-lg"
                rows={1}
                disabled={isLoading}
              />
            </div>
            <button
              onClick={() => handleSubmit()}
              disabled={!input.trim() || isLoading}
              className="px-6 py-4 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 disabled:from-gray-700 disabled:to-gray-700 disabled:cursor-not-allowed text-white rounded-2xl transition-all flex items-center gap-2 font-semibold shadow-lg shadow-orange-500/20"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Search
                </>
              )}
            </button>
          </div>
          <div className="flex items-center justify-center mt-3 text-xs text-gray-500 gap-4">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-gray-400">Enter</kbd>
              to send
            </span>
            <span className="flex items-center gap-1">
              <Zap className="w-3 h-3" />
              Powered by Gemini AI
            </span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col max-w-5xl mx-auto w-full">
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto px-4 py-6">
          {showExamples && messages.length === 0 ? (
            <div className="space-y-8">
              {/* Welcome Section */}
              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-orange-500/20 to-amber-500/20 flex items-center justify-center">
                  <Database className="w-8 h-8 text-orange-500" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Ask Any Sports Trend Question</h2>
                <p className="text-gray-400 max-w-lg mx-auto">
                  Query historical sports data with natural language. Find betting edges, 
                  analyze patterns, and discover trends across NFL, NBA, MLB, NHL, and college sports.
                </p>
              </div>

              {/* Capabilities */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { icon: TrendingUp, label: 'Historical Trends', desc: 'ATS records, O/U patterns, situational analysis' },
                  { icon: Target, label: 'System Building', desc: 'Find profitable betting angles and edges' },
                  { icon: BarChart3, label: 'Statistical Analysis', desc: 'Deep dive into team and player performance' },
                ].map((cap, i) => (
                  <div key={i} className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                    <cap.icon className="w-5 h-5 text-orange-500 mb-2" />
                    <div className="text-sm font-medium text-white">{cap.label}</div>
                    <div className="text-xs text-gray-500">{cap.desc}</div>
                  </div>
                ))}
              </div>

              {/* Example Queries */}
              <div className="space-y-6">
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <Lightbulb className="w-4 h-4" />
                  <span>Try asking something like:</span>
                </div>

                {EXAMPLE_QUERIES.map((category, idx) => (
                  <div key={idx} className="space-y-2">
                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      {category.category}
                    </div>
                    <div className="space-y-2">
                      {category.queries.map((query, qIdx) => (
                        <button
                          key={qIdx}
                          onClick={() => handleExampleClick(query)}
                          className="w-full text-left p-3 rounded-lg bg-white/[0.02] border border-white/5 hover:border-orange-500/30 hover:bg-white/[0.04] transition-all group"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-300 group-hover:text-white transition-colors">
                              {query}
                            </span>
                            <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-orange-500 transition-colors flex-shrink-0 ml-2" />
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] ${
                      message.role === 'user'
                        ? 'bg-orange-500/20 border border-orange-500/30'
                        : 'bg-white/[0.03] border border-white/5'
                    } rounded-2xl p-4`}
                  >
                    {message.role === 'assistant' && (
                      <div className="flex items-center gap-2 mb-2 pb-2 border-b border-white/5">
                        <Sparkles className="w-4 h-4 text-orange-500" />
                        <span className="text-xs font-medium text-gray-400">AI Analysis</span>
                      </div>
                    )}
                    
                    <div className="text-sm text-gray-200 whitespace-pre-wrap leading-relaxed">
                      {message.content}
                    </div>

                    {/* Extracted Stats */}
                    {message.extractedStats && message.extractedStats.length > 0 && (
                      <div className="mt-4 pt-3 border-t border-white/5">
                        <div className="flex flex-wrap gap-2">
                          {message.extractedStats.map((stat, i) => (
                            <div key={i} className="px-3 py-1.5 rounded-lg bg-orange-500/10 border border-orange-500/30">
                              <span className="text-xs text-gray-400">{stat.label}: </span>
                              <span className="text-sm font-bold text-orange-400">{stat.value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-white/5">
                      <span className="text-xs text-gray-600">
                        {message.timestamp.toLocaleTimeString()}
                      </span>
                      <div className="flex items-center gap-2">
                        {/* Save as System button for user queries */}
                        {message.role === 'user' && (
                          savedSuccess === message.content ? (
                            <span className="flex items-center gap-1 text-xs text-emerald-400">
                              <Check className="w-3.5 h-3.5" />
                              Saved
                            </span>
                          ) : (
                            <button
                              onClick={() => handleOpenSaveModal(message.content)}
                              className="flex items-center gap-1 text-xs text-gray-500 hover:text-orange-400 transition-colors"
                              title="Save as system"
                            >
                              <Bookmark className="w-3.5 h-3.5" />
                              <span>Save</span>
                            </button>
                          )
                        )}
                        <button
                          onClick={() => handleCopy(message.content, message.id)}
                          className="text-gray-500 hover:text-white transition-colors"
                          title="Copy to clipboard"
                        >
                          {copiedId === message.id ? (
                            <Check className="w-4 h-4 text-green-500" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-4">
                    <div className="flex items-center gap-3">
                      <Loader2 className="w-5 h-5 text-orange-500 animate-spin" />
                      <span className="text-sm text-gray-400">Analyzing trends...</span>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Area - Sticky at bottom when in conversation */}
        {messages.length > 0 && (
          <div className="border-t border-white/5 bg-[#0a0a12] p-4">
            <div className="max-w-4xl mx-auto">
              <div className="relative flex items-end gap-2">
                <div className="flex-1 relative">
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Follow-up question..."
                    className="w-full px-4 py-3 pr-12 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 resize-none focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/50 transition-all"
                    rows={1}
                    disabled={isLoading}
                  />
                  <div className="absolute right-3 bottom-3">
                    <Search className="w-5 h-5 text-gray-600" />
                  </div>
                </div>
                <button
                  onClick={() => handleSubmit()}
                  disabled={!input.trim() || isLoading}
                  className="px-4 py-3 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-xl transition-colors flex items-center gap-2"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
