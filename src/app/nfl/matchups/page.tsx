'use client'

import { useState } from 'react'
import Link from 'next/link'
import { 
  Calendar, Clock, ChevronRight, TrendingUp, Target, 
  Filter, Star, Flame, Activity
} from 'lucide-react'

// =============================================================================
// TYPES & DATA
// =============================================================================

interface Matchup {
  id: string
  homeTeam: { abbr: string; name: string; record: string; emoji: string }
  awayTeam: { abbr: string; name: string; record: string; emoji: string }
  time: string
  broadcast: string
  spread: string
  total: string
  publicSpread: number
  isHot: boolean
  aiPick?: string
}

const todaysGames: Matchup[] = [
  {
    id: 'phi-dal',
    awayTeam: { abbr: 'PHI', name: 'Eagles', record: '13-3', emoji: '🦅' },
    homeTeam: { abbr: 'DAL', name: 'Cowboys', record: '7-9', emoji: '⭐' },
    time: '4:25 PM ET',
    broadcast: 'CBS',
    spread: 'PHI -7',
    total: '48.5',
    publicSpread: 65,
    isHot: true,
    aiPick: 'PHI -7'
  },
  {
    id: 'det-min',
    awayTeam: { abbr: 'DET', name: 'Lions', record: '14-2', emoji: '🦁' },
    homeTeam: { abbr: 'MIN', name: 'Vikings', record: '13-3', emoji: '⚔️' },
    time: '8:20 PM ET',
    broadcast: 'NBC',
    spread: 'DET -3',
    total: '52.5',
    publicSpread: 72,
    isHot: true,
    aiPick: 'OVER 52.5'
  },
  {
    id: 'buf-mia',
    awayTeam: { abbr: 'BUF', name: 'Bills', record: '12-4', emoji: '🦬' },
    homeTeam: { abbr: 'MIA', name: 'Dolphins', record: '8-8', emoji: '🐬' },
    time: '1:00 PM ET',
    broadcast: 'FOX',
    spread: 'BUF -6.5',
    total: '45.5',
    publicSpread: 58,
    isHot: false,
    aiPick: 'BUF -6.5'
  },
  {
    id: 'kc-den',
    awayTeam: { abbr: 'KC', name: 'Chiefs', record: '14-2', emoji: '🏈' },
    homeTeam: { abbr: 'DEN', name: 'Broncos', record: '9-7', emoji: '🐴' },
    time: '4:25 PM ET',
    broadcast: 'CBS',
    spread: 'KC -9',
    total: '43.5',
    publicSpread: 68,
    isHot: false
  },
  {
    id: 'sf-ari',
    awayTeam: { abbr: 'SF', name: '49ers', record: '6-10', emoji: '🔴' },
    homeTeam: { abbr: 'ARI', name: 'Cardinals', record: '7-9', emoji: '🐦' },
    time: '4:25 PM ET',
    broadcast: 'FOX',
    spread: 'ARI -2.5',
    total: '44',
    publicSpread: 45,
    isHot: false
  },
]

// =============================================================================
// COMPONENT
// =============================================================================

export default function NFLMatchupsPage() {
  const [view, setView] = useState<'today' | 'week'>('today')

  return (
    <div className="min-h-screen bg-[#050508]">
      {/* Header */}
      <div className="border-b border-white/5 bg-[#0a0a12]">
        <div className="max-w-[1400px] mx-auto px-4 py-6">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-4xl">🏈</span>
            <div>
              <h1 className="text-3xl font-black text-white">NFL Matchups</h1>
              <p className="text-sm text-gray-500">Complete game analysis with odds, trends & AI picks</p>
            </div>
          </div>

          {/* View Toggle */}
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => setView('today')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                view === 'today' ? 'bg-orange-500 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
            >
              <Calendar className="w-4 h-4" /> Today
            </button>
            <button
              onClick={() => setView('week')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                view === 'week' ? 'bg-orange-500 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
            >
              <Calendar className="w-4 h-4" /> Full Week
            </button>
          </div>
        </div>
      </div>

      {/* Games List */}
      <div className="max-w-[1400px] mx-auto px-4 py-6">
        <div className="space-y-4">
          {todaysGames.map((game) => (
            <Link 
              key={game.id}
              href={`/nfl/matchups/${game.id}`}
              className="block rounded-xl bg-[#0c0c14] border border-white/10 hover:border-orange-500/30 transition-all overflow-hidden group"
            >
              <div className="p-4">
                <div className="flex items-center justify-between">
                  {/* Away Team */}
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-14 h-14 rounded-xl bg-white/5 flex items-center justify-center text-3xl">
                      {game.awayTeam.emoji}
                    </div>
                    <div>
                      <div className="font-bold text-white text-lg">{game.awayTeam.name}</div>
                      <div className="text-sm text-gray-500">{game.awayTeam.record}</div>
                    </div>
                  </div>

                  {/* Game Info */}
                  <div className="text-center px-6">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Clock className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-400">{game.time}</span>
                      <span className="text-xs px-2 py-0.5 rounded bg-white/10 text-gray-400">{game.broadcast}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-center">
                        <div className="text-xs text-gray-500">SPREAD</div>
                        <div className="font-bold text-orange-500">{game.spread}</div>
                      </div>
                      <div className="w-px h-8 bg-white/10" />
                      <div className="text-center">
                        <div className="text-xs text-gray-500">TOTAL</div>
                        <div className="font-bold text-blue-500">{game.total}</div>
                      </div>
                    </div>
                    {game.isHot && (
                      <div className="flex items-center justify-center gap-1 mt-2">
                        <Flame className="w-4 h-4 text-orange-500" />
                        <span className="text-xs text-orange-500 font-semibold">Hot Game</span>
                      </div>
                    )}
                  </div>

                  {/* Home Team */}
                  <div className="flex items-center gap-4 flex-1 justify-end">
                    <div className="text-right">
                      <div className="font-bold text-white text-lg">{game.homeTeam.name}</div>
                      <div className="text-sm text-gray-500">{game.homeTeam.record}</div>
                    </div>
                    <div className="w-14 h-14 rounded-xl bg-white/5 flex items-center justify-center text-3xl">
                      {game.homeTeam.emoji}
                    </div>
                  </div>

                  {/* Arrow */}
                  <ChevronRight className="w-6 h-6 text-gray-600 group-hover:text-orange-500 ml-4 transition-colors" />
                </div>

                {/* Bottom Bar */}
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/5">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">Public:</span>
                      <span className={`text-xs font-bold ${game.publicSpread > 60 ? 'text-green-400' : 'text-gray-400'}`}>
                        {game.publicSpread}% on {game.spread.split(' ')[0]}
                      </span>
                    </div>
                  </div>
                  {game.aiPick && (
                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/30">
                      <Target className="w-3 h-3 text-orange-500" />
                      <span className="text-xs font-bold text-orange-500">AI Pick: {game.aiPick}</span>
                    </div>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
          <Link href="/nfl/players" className="p-4 rounded-xl bg-[#0c0c14] border border-white/10 hover:border-white/20 transition-all">
            <Activity className="w-6 h-6 text-green-500 mb-2" />
            <div className="font-semibold text-white">Player Stats</div>
            <div className="text-xs text-gray-500">Full stats & props</div>
          </Link>
          <Link href="/nfl/trends" className="p-4 rounded-xl bg-[#0c0c14] border border-white/10 hover:border-white/20 transition-all">
            <TrendingUp className="w-6 h-6 text-orange-500 mb-2" />
            <div className="font-semibold text-white">Betting Trends</div>
            <div className="text-xs text-gray-500">ATS & O/U trends</div>
          </Link>
          <Link href="/nfl" className="p-4 rounded-xl bg-[#0c0c14] border border-white/10 hover:border-white/20 transition-all">
            <Star className="w-6 h-6 text-yellow-500 mb-2" />
            <div className="font-semibold text-white">Team Analytics</div>
            <div className="text-xs text-gray-500">Deep team analysis</div>
          </Link>
          <Link href="/injuries" className="p-4 rounded-xl bg-[#0c0c14] border border-white/10 hover:border-white/20 transition-all">
            <Activity className="w-6 h-6 text-red-500 mb-2" />
            <div className="font-semibold text-white">Injuries</div>
            <div className="text-xs text-gray-500">Impact ratings</div>
          </Link>
        </div>
      </div>
    </div>
  )
}
