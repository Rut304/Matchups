'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Sparkles, ChevronRight } from 'lucide-react'

const EXAMPLE_QUESTIONS = [
  "NFL playoff underdogs cover rate?",
  "Both teams score rushing & passing TD?",
  "NBA back-to-back games ATS?",
]

export function TrendFinderSearch() {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [focused, setFocused] = useState(false)

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      router.push(`/trend-finder?q=${encodeURIComponent(query.trim())}`)
    }
  }

  const handleExampleClick = (example: string) => {
    router.push(`/trend-finder?q=${encodeURIComponent(example)}`)
  }

  return (
    <div className="max-w-3xl mx-auto mb-6">
      <form onSubmit={handleSubmit} className="relative">
        <div className={`p-1 rounded-2xl transition-all duration-300 ${
          focused 
            ? 'bg-gradient-to-r from-green-500/30 via-emerald-500/30 to-teal-500/30 shadow-[0_0_40px_rgba(16,185,129,0.3)]' 
            : 'bg-gradient-to-r from-green-500/10 via-emerald-500/10 to-teal-500/10'
        }`}>
          <div className="relative bg-[#0a0a12] rounded-xl">
            {/* Header */}
            <div className="flex items-center gap-2 px-4 pt-3 pb-1">
              <Sparkles className="w-4 h-4 text-green-400" />
              <span className="text-xs font-bold text-green-400 tracking-wide">TREND FINDER</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/20 text-green-300">AI-Powered</span>
            </div>
            
            {/* Search Input */}
            <div className="flex items-center gap-3 px-4 pb-3">
              <Search className="w-5 h-5 text-gray-500 flex-shrink-0" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                placeholder="Ask any sports betting question... e.g., 'How often do NFL playoff underdogs cover?'"
                className="flex-1 bg-transparent text-white placeholder-gray-500 text-sm focus:outline-none py-2"
              />
              <button
                type="submit"
                disabled={!query.trim()}
                className="px-4 py-2 rounded-lg font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-400 hover:to-emerald-400 flex items-center gap-1"
              >
                Search
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            
            {/* Example Questions */}
            <div className="px-4 pb-3 flex flex-wrap items-center gap-2">
              <span className="text-[10px] text-gray-500">Try:</span>
              {EXAMPLE_QUESTIONS.map((example) => (
                <button
                  key={example}
                  type="button"
                  onClick={() => handleExampleClick(example)}
                  className="text-[11px] px-2.5 py-1 rounded-full bg-white/5 text-gray-400 hover:bg-green-500/20 hover:text-green-300 transition-colors"
                >
                  {example}
                </button>
              ))}
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
