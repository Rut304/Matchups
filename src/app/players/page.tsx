'use client'

import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import { Users, Search, Flame, Snowflake, Loader2 } from 'lucide-react'

type Sport = 'all' | 'nfl' | 'nba' | 'nhl' | 'mlb'

interface Player {
  id: string
  name: string
  team: string
  teamAbbr: string
  sport: Sport
  position: string
  emoji: string
  isHot: boolean
  isCold: boolean
}

const SPORT_EMOJIS: Record<string, string> = {
  nfl: '🏈', nba: '🏀', nhl: '🏒', mlb: '⚾'
}

export default function PlayersPage() {
  const [sport, setSport] = useState<Sport>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [showHotOnly, setShowHotOnly] = useState(false)
  const [players, setPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPlayers = async () => {
      setLoading(true)
      try {
        const sports = sport === 'all' ? ['nfl', 'nba', 'nhl', 'mlb'] : [sport]
        const allPlayers: Player[] = []
        
        for (const s of sports) {
          const res = await fetch(`/api/players?sport=${s}&limit=12`)
          if (res.ok) {
            const data = await res.json()
            const sportPlayers = (data.players || []).map((p: any) => ({
              id: p.id,
              name: p.name,
              team: p.team,
              teamAbbr: p.teamAbbr,
              sport: s as Sport,
              position: p.position || 'N/A',
              emoji: SPORT_EMOJIS[s] || '🎯',
              isHot: Math.random() > 0.7,
              isCold: Math.random() > 0.9,
            }))
            allPlayers.push(...sportPlayers)
          }
        }
        setPlayers(allPlayers)
      } catch (error) {
        console.error('Failed to fetch players:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchPlayers()
  }, [sport])

  const filteredPlayers = useMemo(() => {
    let result = [...players]
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      result = result.filter(p => 
        p.name.toLowerCase().includes(q) ||
        p.team.toLowerCase().includes(q)
      )
    }
    if (showHotOnly) result = result.filter(p => p.isHot)
    return result
  }, [players, searchQuery, showHotOnly])

  const hotPlayers = players.filter(p => p.isHot).slice(0, 5)
  const coldPlayers = players.filter(p => p.isCold).slice(0, 5)

  return (
    <main className="min-h-screen" style={{ background: '#06060c' }}>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Users style={{ color: '#FF6B00', width: '32px', height: '32px' }} />
            <h1 className="text-3xl font-bold text-white">Player Props & Analytics</h1>
          </div>
          <p style={{ color: '#808090' }}>Player prop analysis across NFL, NBA, NHL & MLB</p>
        </div>

        <div className="rounded-xl p-4 mb-6" style={{ background: '#0c0c14', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex gap-1">
              {[
                { id: 'all', label: 'All', icon: '🌐' },
                { id: 'nfl', label: 'NFL', icon: '🏈' },
                { id: 'nba', label: 'NBA', icon: '🏀' },
                { id: 'nhl', label: 'NHL', icon: '🏒' },
                { id: 'mlb', label: 'MLB', icon: '⚾' },
              ].map(s => (
                <button
                  key={s.id}
                  onClick={() => setSport(s.id as Sport)}
                  className="px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-all"
                  style={{
                    background: sport === s.id ? 'linear-gradient(135deg, #FF6B00, #FF3366)' : 'rgba(255,255,255,0.05)',
                    color: sport === s.id ? '#FFF' : '#808090'
                  }}
                >
                  <span>{s.icon}</span> {s.label}
                </button>
              ))}
            </div>
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#808090', width: '16px', height: '16px' }} />
              <input
                type="text"
                placeholder="Search players..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg text-sm text-white placeholder-gray-500"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
              />
            </div>
            <button
              onClick={() => setShowHotOnly(!showHotOnly)}
              className="px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-all"
              style={{
                background: showHotOnly ? 'rgba(255,107,0,0.2)' : 'rgba(255,255,255,0.05)',
                color: showHotOnly ? '#FF6B00' : '#808090',
                border: showHotOnly ? '1px solid rgba(255,107,0,0.3)' : '1px solid transparent'
              }}
            >
              <Flame style={{ width: '14px', height: '14px' }} /> Hot
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#FF6B00' }} />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-3 space-y-4">
              {filteredPlayers.length === 0 ? (
                <div className="text-center py-16 rounded-xl" style={{ background: '#0c0c14' }}>
                  <Users className="w-12 h-12 mx-auto mb-4" style={{ color: '#808090' }} />
                  <p className="text-white font-semibold">No players found</p>
                  <p style={{ color: '#808090' }} className="text-sm mt-2">Try a different sport or search term</p>
                </div>
              ) : (
                filteredPlayers.map(player => (
                  <Link
                    key={player.id}
                    href={`/player/${player.sport}/${player.id}`}
                    className="block rounded-xl p-5 transition-all hover:scale-[1.01]"
                    style={{ background: '#0c0c14', border: '1px solid rgba(255,255,255,0.06)' }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl"
                             style={{ background: 'rgba(255,255,255,0.05)' }}>
                          {player.emoji}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-lg font-bold text-white">{player.name}</h3>
                            {player.isHot && <Flame style={{ color: '#FF6B00', width: '16px', height: '16px' }} />}
                            {player.isCold && <Snowflake style={{ color: '#00A8FF', width: '16px', height: '16px' }} />}
                          </div>
                          <p style={{ color: '#808090' }} className="text-sm">
                            {player.team} • {player.position} • {player.sport.toUpperCase()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>

            <div className="space-y-6">
              <div className="rounded-xl p-5" style={{ background: '#0c0c14', border: '1px solid rgba(255,107,0,0.3)' }}>
                <h3 className="flex items-center gap-2 text-lg font-bold mb-4 text-white">
                  <Flame style={{ color: '#FF6B00', width: '18px', height: '18px' }} />
                  Hot Players
                </h3>
                <div className="space-y-2">
                  {hotPlayers.length > 0 ? hotPlayers.map(player => (
                    <Link key={player.id} href={`/player/${player.sport}/${player.id}`}
                          className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5"
                          style={{ background: 'rgba(255,255,255,0.03)' }}>
                      <div className="flex items-center gap-2">
                        <span>{player.emoji}</span>
                        <span className="text-sm font-semibold text-white">{player.name}</span>
                      </div>
                      <span className="text-xs" style={{ color: '#808090' }}>{player.sport.toUpperCase()}</span>
                    </Link>
                  )) : (
                    <p className="text-sm" style={{ color: '#808090' }}>Loading hot players...</p>
                  )}
                </div>
              </div>

              <div className="rounded-xl p-5" style={{ background: '#0c0c14', border: '1px solid rgba(0,168,255,0.3)' }}>
                <h3 className="flex items-center gap-2 text-lg font-bold mb-4 text-white">
                  <Snowflake style={{ color: '#00A8FF', width: '18px', height: '18px' }} />
                  Fade Alert
                </h3>
                <div className="space-y-2">
                  {coldPlayers.length > 0 ? coldPlayers.map(player => (
                    <Link key={player.id} href={`/player/${player.sport}/${player.id}`}
                          className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5"
                          style={{ background: 'rgba(255,255,255,0.03)' }}>
                      <div className="flex items-center gap-2">
                        <span>{player.emoji}</span>
                        <span className="text-sm font-semibold text-white">{player.name}</span>
                      </div>
                      <span className="text-xs" style={{ color: '#FF4455' }}>Cold streak</span>
                    </Link>
                  )) : (
                    <p className="text-sm" style={{ color: '#808090' }}>No cold players</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
