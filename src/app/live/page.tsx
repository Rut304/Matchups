'use client'

import { GamesSection, LiveScoresTicker } from '@/components/game'
import type { SportKey } from '@/lib/api/data-layer'

const SPORTS: { key: SportKey; name: string; icon: string }[] = [
  { key: 'NFL', name: 'Football', icon: '🏈' },
  { key: 'NBA', name: 'Basketball', icon: '🏀' },
  { key: 'NHL', name: 'Hockey', icon: '🏒' },
  { key: 'MLB', name: 'Baseball', icon: '⚾' },
]

export default function LivePage() {
  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Live Scores Ticker */}
      <LiveScoresTicker />
      
      {/* Page Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Live Scoreboard</h1>
          <p className="text-zinc-400">Real-time scores and odds powered by ESPN &amp; The Odds API</p>
        </div>
        
        {/* Games Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {SPORTS.map(sport => (
            <GamesSection 
              key={sport.key} 
              sport={sport.key} 
              title={`${sport.icon} ${sport.name}`}
              limit={5}
            />
          ))}
        </div>
        
        {/* Data Source Info */}
        <div className="mt-8 p-4 rounded-xl bg-zinc-900 border border-zinc-800">
          <h3 className="text-sm font-semibold text-zinc-400 mb-2">Data Sources</h3>
          <div className="flex flex-wrap gap-4 text-xs text-zinc-500">
            <span>📡 ESPN API (Schedules, Scores, Standings)</span>
            <span>📊 The Odds API (40+ Sportsbooks)</span>
            <span>🔄 Auto-refresh every 60s</span>
          </div>
        </div>
      </div>
    </div>
  )
}
