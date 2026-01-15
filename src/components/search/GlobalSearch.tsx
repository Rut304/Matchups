'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Search, X, ArrowRight, Command, Loader2 } from 'lucide-react'

interface SearchResult {
  id: string
  title: string
  subtitle: string
  type: 'sport' | 'feature' | 'team' | 'player' | 'game'
  path: string
  icon: string
  meta?: Record<string, string>
}

export function GlobalSearch() {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Handle keyboard shortcut to open search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K to open search
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setIsOpen(true)
      }
      // Escape to close
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false)
        setQuery('')
        setResults([])
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  // Search with debounce
  const search = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setResults([])
      return
    }

    setIsLoading(true)
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}&limit=10`)
      const data = await res.json()
      setResults(data.results || [])
      setSelectedIndex(0)
    } catch (error) {
      console.error('Search failed:', error)
      setResults([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    debounceRef.current = setTimeout(() => {
      search(query)
    }, 200)

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [query, search])

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(prev => Math.min(prev + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(prev => Math.max(prev - 1, 0))
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      e.preventDefault()
      navigateTo(results[selectedIndex].path)
    }
  }

  const navigateTo = (path: string) => {
    setIsOpen(false)
    setQuery('')
    setResults([])
    router.push(path)
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'sport': return '#FF6B00'
      case 'feature': return '#00A8FF'
      case 'team': return '#00FF88'
      case 'player': return '#FFD700'
      default: return '#808090'
    }
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-all hover:bg-white/10"
        style={{ background: 'rgba(255,255,255,0.05)', color: '#808090' }}
      >
        <Search className="w-4 h-4" />
        <span className="hidden sm:inline">Search...</span>
        <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-mono"
             style={{ background: 'rgba(255,255,255,0.1)', color: '#606060' }}>
          <Command className="w-3 h-3" />K
        </kbd>
      </button>
    )
  }

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={() => {
          setIsOpen(false)
          setQuery('')
          setResults([])
        }}
      />
      
      {/* Search Modal */}
      <div className="absolute top-[15%] left-1/2 -translate-x-1/2 w-full max-w-2xl px-4">
        <div className="rounded-2xl overflow-hidden shadow-2xl border border-white/10"
             style={{ background: '#0a0a12' }}>
          {/* Search Input */}
          <div className="flex items-center gap-3 p-4 border-b border-white/10">
            <Search className="w-5 h-5 text-gray-500" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search players, teams, games, features..."
              className="flex-1 bg-transparent text-white text-lg placeholder-gray-500 outline-none"
            />
            {isLoading && <Loader2 className="w-5 h-5 text-orange-500 animate-spin" />}
            <button
              onClick={() => {
                setIsOpen(false)
                setQuery('')
                setResults([])
              }}
              className="p-1 rounded hover:bg-white/10 text-gray-500"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Results */}
          {results.length > 0 && (
            <div className="max-h-[50vh] overflow-y-auto p-2">
              {results.map((result, idx) => (
                <button
                  key={result.id}
                  onClick={() => navigateTo(result.path)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all ${
                    idx === selectedIndex ? 'bg-white/10' : 'hover:bg-white/5'
                  }`}
                >
                  <span className="text-2xl">{result.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-white truncate">{result.title}</div>
                    <div className="text-sm text-gray-500 truncate">{result.subtitle}</div>
                  </div>
                  <span 
                    className="text-[10px] px-2 py-1 rounded-full uppercase font-bold"
                    style={{ 
                      background: `${getTypeColor(result.type)}20`,
                      color: getTypeColor(result.type)
                    }}
                  >
                    {result.type}
                  </span>
                  <ArrowRight className="w-4 h-4 text-gray-600" />
                </button>
              ))}
            </div>
          )}

          {/* Empty State */}
          {query.length >= 2 && !isLoading && results.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              <p>No results found for &quot;{query}&quot;</p>
              <p className="text-sm mt-1">Try searching for teams, players, or features</p>
            </div>
          )}

          {/* Initial State */}
          {query.length < 2 && (
            <div className="p-4">
              <div className="text-xs text-gray-500 mb-3 uppercase font-semibold">Quick Links</div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { icon: '🏈', label: 'NFL', path: '/nfl' },
                  { icon: '🏀', label: 'NBA', path: '/nba' },
                  { icon: '🏒', label: 'NHL', path: '/nhl' },
                  { icon: '⚾', label: 'MLB', path: '/mlb' },
                  { icon: '🛒', label: 'Line Shop', path: '/lineshop' },
                  { icon: '🏆', label: 'Experts', path: '/leaderboard' },
                  { icon: '📈', label: 'Trends', path: '/trend-finder' },
                  { icon: '📺', label: 'Scores', path: '/scores' },
                ].map(link => (
                  <button
                    key={link.path}
                    onClick={() => navigateTo(link.path)}
                    className="flex items-center gap-2 p-2 rounded-lg text-sm hover:bg-white/10 transition-all"
                    style={{ background: 'rgba(255,255,255,0.03)' }}
                  >
                    <span>{link.icon}</span>
                    <span className="text-white font-medium">{link.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="p-3 border-t border-white/5 flex items-center justify-between text-xs text-gray-600">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-white/5">↑↓</kbd> Navigate
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-white/5">Enter</kbd> Select
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-white/5">Esc</kbd> Close
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
