'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  Search, 
  TrendingUp, 
  TrendingDown, 
  Filter,
  RefreshCw,
  ChevronRight,
  Target,
  Zap,
  BarChart3,
  Users,
  Clock
} from 'lucide-react'

interface PropLine {
  book: string
  line: number
  overOdds: number
  underOdds: number
}

interface PlayerProp {
  gameId: string
  player: string
  team: string
  position: string
  propType: string
  propDisplayName: string
  line: number
  books: PropLine[]
  bestOver: { book: string; odds: number } | null
  bestUnder: { book: string; odds: number } | null
  seasonAvg: number
  last5Avg: number
  hitRate: number
  edge: 'over' | 'under' | 'neutral'
  edgeStrength: number
}

interface Game {
  id: string
  homeTeam: string
  awayTeam: string
  time: string
  props: PlayerProp[]
}

type SportKey = 'NFL' | 'NBA' | 'NHL' | 'MLB' | 'NCAAF' | 'NCAAB'

const PROP_CATEGORIES: Record<string, string[]> = {
  NFL: ['All', 'Passing', 'Rushing', 'Receiving', 'TD Scorer'],
  NBA: ['All', 'Points', 'Rebounds', 'Assists', 'Combos', '3-Pointers'],
  NHL: ['All', 'Goals', 'Assists', 'Shots', 'Saves'],
  MLB: ['All', 'Hits', 'Runs', 'Strikeouts', 'Pitching'],
  NCAAF: ['All', 'Passing', 'Rushing', 'Receiving'],
  NCAAB: ['All', 'Points', 'Rebounds', 'Assists'],
}

export default function PropsPage() {
  const [sport, setSport] = useState<SportKey>('NFL')
  const [category, setCategory] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [games, setGames] = useState<Game[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedGame, setSelectedGame] = useState<string | null>(null)

  // Fetch games with props
  useEffect(() => {
    const fetchProps = async () => {
      setLoading(true)
      setError(null)
      try {
        // Fetch today's games for the sport
        const gamesRes = await fetch(`/api/games?sport=${sport}`)
        const gamesData = await gamesRes.json()
        
        const gamesWithProps: Game[] = []
        
        // For each game, try to fetch props
        for (const game of (gamesData.games || []).slice(0, 6)) {
          try {
            const propsRes = await fetch(`/api/games/${game.id}/props?sport=${sport}`)
            const propsData = await propsRes.json()
            
            gamesWithProps.push({
              id: game.id,
              homeTeam: game.homeTeam?.abbreviation || game.home?.abbreviation || 'HOME',
              awayTeam: game.awayTeam?.abbreviation || game.away?.abbreviation || 'AWAY',
              time: game.scheduledAt ? new Date(game.scheduledAt).toLocaleTimeString('en-US', { 
                hour: 'numeric', 
                minute: '2-digit',
                timeZone: 'America/New_York'
              }) : 'TBD',
              props: propsData.props || []
            })
          } catch {
            gamesWithProps.push({
              id: game.id,
              homeTeam: game.homeTeam?.abbreviation || 'HOME',
              awayTeam: game.awayTeam?.abbreviation || 'AWAY',
              time: game.scheduledAt ? new Date(game.scheduledAt).toLocaleTimeString('en-US', { 
                hour: 'numeric', 
                minute: '2-digit' 
              }) : 'TBD',
              props: []
            })
          }
        }
        
        setGames(gamesWithProps)
        if (gamesWithProps.length > 0 && !selectedGame) {
          setSelectedGame(gamesWithProps[0].id)
        }
      } catch (err) {
        console.error('Error fetching props:', err)
        setError('Failed to load props')
      } finally {
        setLoading(false)
      }
    }

    fetchProps()
  }, [sport])

  // Get current game's props
  const currentGame = games.find(g => g.id === selectedGame)
  const filteredProps = currentGame?.props.filter(p => {
    if (category !== 'All') {
      const catLower = category.toLowerCase()
      if (!p.propType.toLowerCase().includes(catLower) && 
          !p.propDisplayName.toLowerCase().includes(catLower)) {
        return false
      }
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      if (!p.player.toLowerCase().includes(q) && 
          !p.team.toLowerCase().includes(q)) {
        return false
      }
    }
    return true
  }) || []

  // Calculate edge props
  const edgeProps = filteredProps.filter(p => p.edge !== 'neutral' && p.edgeStrength > 60)

  const formatOdds = (odds: number) => odds > 0 ? `+${odds}` : `${odds}`

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Target className="w-6 h-6 text-orange-500" />
              <h1 className="text-xl font-bold">Player Props</h1>
            </div>
            
            {/* Sport Selector */}
            <div className="flex gap-2">
              {(['NFL', 'NBA', 'NHL', 'MLB'] as SportKey[]).map(s => (
                <button
                  key={s}
                  onClick={() => { setSport(s); setCategory('All'); }}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                    sport === s 
                      ? 'bg-orange-500 text-white' 
                      : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-12 gap-6">
          {/* Sidebar - Games */}
          <div className="col-span-3">
            <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
              <div className="p-4 border-b border-zinc-800">
                <h2 className="font-semibold text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-orange-500" />
                  Today's Games
                </h2>
              </div>
              
              {loading ? (
                <div className="p-4 text-center text-zinc-500">Loading games...</div>
              ) : games.length === 0 ? (
                <div className="p-4 text-center text-zinc-500">No games today</div>
              ) : (
                <div className="divide-y divide-zinc-800">
                  {games.map(game => (
                    <button
                      key={game.id}
                      onClick={() => setSelectedGame(game.id)}
                      className={`w-full p-3 text-left transition-colors ${
                        selectedGame === game.id 
                          ? 'bg-orange-500/10 border-l-2 border-orange-500' 
                          : 'hover:bg-zinc-800/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-white">
                            {game.awayTeam} @ {game.homeTeam}
                          </div>
                          <div className="text-xs text-zinc-500">{game.time} ET</div>
                        </div>
                        <div className="text-xs text-zinc-500">
                          {game.props.length > 0 ? `${game.props.length} props` : 'No props'}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Links */}
            <div className="mt-4 space-y-2">
              <Link 
                href="/props/correlations"
                className="flex items-center justify-between p-3 bg-zinc-900 rounded-lg border border-zinc-800 hover:bg-zinc-800 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-500" />
                  <span className="text-sm font-medium">Prop Correlations</span>
                </div>
                <ChevronRight className="w-4 h-4 text-zinc-500" />
              </Link>
              
              <Link 
                href="/trends"
                className="flex items-center justify-between p-3 bg-zinc-900 rounded-lg border border-zinc-800 hover:bg-zinc-800 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-blue-500" />
                  <span className="text-sm font-medium">Betting Trends</span>
                </div>
                <ChevronRight className="w-4 h-4 text-zinc-500" />
              </Link>
            </div>
          </div>

          {/* Main Content - Props */}
          <div className="col-span-9">
            {/* Filters */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                {PROP_CATEGORIES[sport].map(cat => (
                  <button
                    key={cat}
                    onClick={() => setCategory(cat)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      category === cat 
                        ? 'bg-white text-black' 
                        : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
              
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Search players..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>

            {/* Edge Picks */}
            {edgeProps.length > 0 && (
              <div className="mb-6 p-4 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-xl">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="w-5 h-5 text-green-400" />
                  <h3 className="font-semibold text-green-400">Edge Picks</h3>
                  <span className="text-xs text-zinc-400">Props with historical edge</span>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {edgeProps.slice(0, 3).map((prop, i) => (
                    <div key={i} className="bg-black/30 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-white">{prop.player}</span>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                          prop.edge === 'over' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                        }`}>
                          {prop.edge.toUpperCase()}
                        </span>
                      </div>
                      <div className="text-sm text-zinc-400">{prop.propDisplayName}</div>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-white font-semibold">{prop.line}</span>
                        <span className="text-xs text-zinc-500">
                          Avg: {prop.seasonAvg} | Hit: {prop.hitRate}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Props List */}
            {loading ? (
              <div className="text-center py-12 text-zinc-500">
                <RefreshCw className="w-8 h-8 mx-auto mb-3 animate-spin" />
                Loading player props...
              </div>
            ) : error ? (
              <div className="text-center py-12 text-red-400">
                {error}
              </div>
            ) : !currentGame ? (
              <div className="text-center py-12 text-zinc-500">
                Select a game to view props
              </div>
            ) : filteredProps.length === 0 ? (
              <div className="text-center py-12">
                <Target className="w-12 h-12 mx-auto mb-4 text-zinc-600" />
                <p className="text-zinc-400 mb-2">No props available yet</p>
                <p className="text-sm text-zinc-600">
                  Props typically become available 1-2 hours before game time
                </p>
              </div>
            ) : (
              <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-zinc-800 text-left">
                      <th className="p-3 text-xs font-semibold text-zinc-500 uppercase">Player</th>
                      <th className="p-3 text-xs font-semibold text-zinc-500 uppercase">Prop</th>
                      <th className="p-3 text-xs font-semibold text-zinc-500 uppercase text-center">Line</th>
                      <th className="p-3 text-xs font-semibold text-zinc-500 uppercase text-center">Best Over</th>
                      <th className="p-3 text-xs font-semibold text-zinc-500 uppercase text-center">Best Under</th>
                      <th className="p-3 text-xs font-semibold text-zinc-500 uppercase text-center">Avg</th>
                      <th className="p-3 text-xs font-semibold text-zinc-500 uppercase text-center">L5</th>
                      <th className="p-3 text-xs font-semibold text-zinc-500 uppercase text-center">Hit%</th>
                      <th className="p-3 text-xs font-semibold text-zinc-500 uppercase text-center">Edge</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800">
                    {filteredProps.map((prop, idx) => (
                      <tr key={idx} className="hover:bg-zinc-800/50 transition-colors">
                        <td className="p-3">
                          <div className="font-medium text-white">{prop.player}</div>
                          <div className="text-xs text-zinc-500">{prop.team} • {prop.position}</div>
                        </td>
                        <td className="p-3 text-zinc-300">{prop.propDisplayName}</td>
                        <td className="p-3 text-center font-semibold text-white">{prop.line}</td>
                        <td className="p-3 text-center">
                          {prop.bestOver ? (
                            <div>
                              <span className="text-green-400 font-medium">{formatOdds(prop.bestOver.odds)}</span>
                              <div className="text-xs text-zinc-600">{prop.bestOver.book}</div>
                            </div>
                          ) : '-'}
                        </td>
                        <td className="p-3 text-center">
                          {prop.bestUnder ? (
                            <div>
                              <span className="text-red-400 font-medium">{formatOdds(prop.bestUnder.odds)}</span>
                              <div className="text-xs text-zinc-600">{prop.bestUnder.book}</div>
                            </div>
                          ) : '-'}
                        </td>
                        <td className="p-3 text-center text-zinc-300">{prop.seasonAvg?.toFixed(1) || '-'}</td>
                        <td className="p-3 text-center text-zinc-300">{prop.last5Avg?.toFixed(1) || '-'}</td>
                        <td className="p-3 text-center">
                          <span className={prop.hitRate >= 60 ? 'text-green-400' : prop.hitRate <= 40 ? 'text-red-400' : 'text-zinc-400'}>
                            {prop.hitRate}%
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          {prop.edge !== 'neutral' ? (
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-bold ${
                              prop.edge === 'over' 
                                ? 'bg-green-500/20 text-green-400' 
                                : 'bg-red-500/20 text-red-400'
                            }`}>
                              {prop.edge === 'over' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                              {prop.edge.toUpperCase()}
                            </span>
                          ) : (
                            <span className="text-zinc-600">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
