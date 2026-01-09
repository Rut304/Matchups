'use client'

import { useState } from 'react'
import { Activity, BarChart3, ChevronDown } from 'lucide-react'

export type MainCategory = 'sports' | 'markets'
export type SportFilter = 'all' | 'nfl' | 'nba' | 'nhl' | 'mlb' | 'ncaaf' | 'ncaab'
export type MarketFilter = 'all' | 'politics' | 'crypto' | 'economics' | 'entertainment' | 'world'

interface CategoryFilterProps {
  mainCategory: MainCategory
  onMainCategoryChange: (category: MainCategory) => void
  sportFilter: SportFilter
  onSportFilterChange: (sport: SportFilter) => void
  marketFilter: MarketFilter
  onMarketFilterChange: (market: MarketFilter) => void
  showSubFilter?: boolean
  compact?: boolean
}

const sportOptions: { value: SportFilter; label: string; emoji: string }[] = [
  { value: 'all', label: 'All Sports', emoji: '📊' },
  { value: 'nfl', label: 'NFL', emoji: '🏈' },
  { value: 'nba', label: 'NBA', emoji: '🏀' },
  { value: 'nhl', label: 'NHL', emoji: '🏒' },
  { value: 'mlb', label: 'MLB', emoji: '⚾' },
  { value: 'ncaaf', label: 'NCAAF', emoji: '🏈' },
  { value: 'ncaab', label: 'NCAAB', emoji: '🏀' },
]

const marketOptions: { value: MarketFilter; label: string; emoji: string }[] = [
  { value: 'all', label: 'All Markets', emoji: '🎯' },
  { value: 'politics', label: 'Politics', emoji: '🏛️' },
  { value: 'crypto', label: 'Crypto', emoji: '₿' },
  { value: 'economics', label: 'Economics', emoji: '📈' },
  { value: 'entertainment', label: 'Entertainment', emoji: '🎬' },
  { value: 'world', label: 'World Events', emoji: '🌍' },
]

export function CategoryFilter({
  mainCategory,
  onMainCategoryChange,
  sportFilter,
  onSportFilterChange,
  marketFilter,
  onMarketFilterChange,
  showSubFilter = true,
  compact = false,
}: CategoryFilterProps) {
  const [showSportDropdown, setShowSportDropdown] = useState(false)
  const [showMarketDropdown, setShowMarketDropdown] = useState(false)

  const currentSport = sportOptions.find(s => s.value === sportFilter)
  const currentMarket = marketOptions.find(m => m.value === marketFilter)

  return (
    <div className={`flex flex-wrap items-center gap-2 ${compact ? '' : 'gap-3'}`}>
      {/* Main Category Toggle */}
      <div className="flex items-center gap-1 p-1 rounded-lg bg-white/5 border border-white/10">
        <button
          onClick={() => onMainCategoryChange('sports')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold transition-all ${
            mainCategory === 'sports'
              ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-black'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Activity className="w-4 h-4" />
          Sports
        </button>
        <button
          onClick={() => onMainCategoryChange('markets')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold transition-all ${
            mainCategory === 'markets'
              ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          Prediction Markets
        </button>
      </div>

      {/* Sub-filter Dropdown */}
      {showSubFilter && (
        <div className="relative">
          {mainCategory === 'sports' ? (
            <div className="relative">
              <button
                onClick={() => setShowSportDropdown(!showSportDropdown)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-sm font-medium text-white hover:bg-white/10 transition-all"
              >
                <span>{currentSport?.emoji}</span>
                <span>{currentSport?.label}</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${showSportDropdown ? 'rotate-180' : ''}`} />
              </button>
              
              {showSportDropdown && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setShowSportDropdown(false)} 
                  />
                  <div className="absolute top-full mt-1 left-0 z-50 min-w-[160px] rounded-lg bg-[#0c0c14] border border-white/10 shadow-xl overflow-hidden">
                    {sportOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          onSportFilterChange(option.value)
                          setShowSportDropdown(false)
                        }}
                        className={`w-full flex items-center gap-2 px-4 py-2.5 text-sm transition-all ${
                          sportFilter === option.value
                            ? 'bg-green-500/20 text-green-400'
                            : 'text-gray-300 hover:bg-white/5'
                        }`}
                      >
                        <span>{option.emoji}</span>
                        <span>{option.label}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="relative">
              <button
                onClick={() => setShowMarketDropdown(!showMarketDropdown)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-sm font-medium text-white hover:bg-white/10 transition-all"
              >
                <span>{currentMarket?.emoji}</span>
                <span>{currentMarket?.label}</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${showMarketDropdown ? 'rotate-180' : ''}`} />
              </button>
              
              {showMarketDropdown && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setShowMarketDropdown(false)} 
                  />
                  <div className="absolute top-full mt-1 left-0 z-50 min-w-[180px] rounded-lg bg-[#0c0c14] border border-white/10 shadow-xl overflow-hidden">
                    {marketOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          onMarketFilterChange(option.value)
                          setShowMarketDropdown(false)
                        }}
                        className={`w-full flex items-center gap-2 px-4 py-2.5 text-sm transition-all ${
                          marketFilter === option.value
                            ? 'bg-purple-500/20 text-purple-400'
                            : 'text-gray-300 hover:bg-white/5'
                        }`}
                      >
                        <span>{option.emoji}</span>
                        <span>{option.label}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Simple inline sports filter for pages that only need sports
export function SportFilterInline({
  value,
  onChange,
}: {
  value: SportFilter
  onChange: (sport: SportFilter) => void
}) {
  return (
    <div className="flex items-center gap-1 p-1 rounded-lg bg-white/5">
      {sportOptions.slice(0, 5).map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
            value === option.value
              ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-black'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          {option.value === 'all' ? 'All' : option.value.toUpperCase()}
        </button>
      ))}
    </div>
  )
}

// Hook for managing filter state
export function useCategoryFilter(defaultCategory: MainCategory = 'sports') {
  const [mainCategory, setMainCategory] = useState<MainCategory>(defaultCategory)
  const [sportFilter, setSportFilter] = useState<SportFilter>('all')
  const [marketFilter, setMarketFilter] = useState<MarketFilter>('all')

  return {
    mainCategory,
    setMainCategory,
    sportFilter,
    setSportFilter,
    marketFilter,
    setMarketFilter,
  }
}
