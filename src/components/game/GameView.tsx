'use client'

import { useState, useEffect } from 'react'
import { type UnifiedGame } from '@/lib/api/data-layer'
import { getRealEdgeAlerts, type EdgeAlert } from '@/lib/edge-features'

interface MatchupAnalytics {
  trends?: {
    matched: number
    aggregateConfidence: number
    topPick?: { selection: string; confidence: number; supportingTrends: number } | null
    spreadTrends?: { description: string; confidence: number }[]
  }
  h2h?: {
    gamesPlayed: number
    homeATSRecord: string
    avgTotal: number
  }
  edgeScore?: {
    overall: number
    trendAlignment: number
    sharpSignal: number
  }
  topDataPoints?: { label: string; value: string; confidence: number }[]
}

interface GameViewProps {
  game: UnifiedGame
  expanded?: boolean
  showEdge?: boolean
  showAnalytics?: boolean
}

export function GameView({ game, expanded = false, showEdge = true, showAnalytics = true }: GameViewProps) {
  const [isExpanded, setIsExpanded] = useState(expanded)
  const [liveData, setLiveData] = useState(game)
  const [edgeAlerts, setEdgeAlerts] = useState<EdgeAlert[]>([])
  const [analytics, setAnalytics] = useState<MatchupAnalytics | null>(null)
  const [loadingAnalytics, setLoadingAnalytics] = useState(false)
  
  // Auto-refresh for live games
  useEffect(() => {
    if (game.status !== 'live') return
    
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/games/${game.id}`)
        if (res.ok) {
          const data = await res.json()
          setLiveData(data)
        }
      } catch (error) {
        console.error('Failed to refresh game:', error)
      }
    }, 30000) // Refresh every 30 seconds
    
    return () => clearInterval(interval)
  }, [game.id, game.status])
  
  // Load edge alerts for the game - fetch real data
  useEffect(() => {
    if (!showEdge) return
    const loadAlerts = async () => {
      try {
        const alerts = await getRealEdgeAlerts(game.sport || 'NFL')
        // Filter alerts for this specific game
        const gameAlerts = alerts.filter(a => a.gameId === game.id)
        setEdgeAlerts(gameAlerts)
      } catch (error) {
        console.error('Failed to fetch edge alerts:', error)
      }
    }
    loadAlerts()
  }, [game.id, game.sport, showEdge])
  
  // Fetch full analytics when expanded
  useEffect(() => {
    if (!isExpanded || !showAnalytics || analytics) return
    
    const fetchAnalytics = async () => {
      setLoadingAnalytics(true)
      try {
        const res = await fetch(`/api/matchup/${game.id}/analytics?intelligence=true&ou=false`)
        if (res.ok) {
          const data = await res.json()
          setAnalytics(data)
        }
      } catch (error) {
        console.error('Failed to fetch analytics:', error)
      } finally {
        setLoadingAnalytics(false)
      }
    }
    
    fetchAnalytics()
  }, [isExpanded, showAnalytics, analytics, game.id])
  
  const isLive = liveData.status === 'live'
  const isFinal = liveData.status === 'final'
  
  return (
    <div className={`bg-zinc-900 rounded-lg border ${isLive ? 'border-green-500' : 'border-zinc-800'} overflow-hidden`}>
      {/* Game Header */}
      <div 
        className="p-4 cursor-pointer hover:bg-zinc-800/50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between mb-3">
          {/* Status Badge */}
          <div className="flex items-center gap-2">
            {isLive && (
              <span className="flex items-center gap-1.5 px-2 py-0.5 bg-green-500/20 text-green-400 text-xs font-medium rounded">
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                LIVE
              </span>
            )}
            {isFinal && (
              <span className="px-2 py-0.5 bg-zinc-700 text-zinc-400 text-xs font-medium rounded">
                FINAL
              </span>
            )}
            {!isLive && !isFinal && (
              <span className="text-xs text-zinc-500">
                {new Date(liveData.scheduledAt).toLocaleTimeString('en-US', { 
                  hour: 'numeric', 
                  minute: '2-digit',
                  timeZone: 'America/New_York'
                })} ET
              </span>
            )}
            {liveData.period && liveData.clock && (
              <span className="text-xs text-zinc-400">
                {liveData.period} • {liveData.clock}
              </span>
            )}
          </div>
          
          {/* Broadcast */}
          {liveData.broadcast && (
            <span className="text-xs text-zinc-500">{liveData.broadcast}</span>
          )}
        </div>
        
        {/* Teams */}
        <div className="space-y-2">
          {/* Away Team */}
          {liveData.awayTeam && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {liveData.awayTeam.logo && (
                  <img 
                    src={liveData.awayTeam.logo} 
                    alt={liveData.awayTeam.name}
                    className="w-8 h-8 object-contain"
                  />
                )}
                <div>
                  <span className="font-semibold text-white">{liveData.awayTeam.name}</span>
                  {liveData.awayTeam.record && (
                    <span className="ml-2 text-xs text-zinc-500">({liveData.awayTeam.record})</span>
                  )}
                </div>
              </div>
              <span className={`text-2xl font-bold ${
                isFinal && (liveData.awayTeam.score ?? 0) > (liveData.homeTeam?.score ?? 0) 
                  ? 'text-white' 
                  : 'text-zinc-400'
              }`}>
                {liveData.awayTeam.score ?? '-'}
              </span>
            </div>
          )}
          
          {/* Home Team */}
          {liveData.homeTeam && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {liveData.homeTeam.logo && (
                  <img 
                    src={liveData.homeTeam.logo} 
                    alt={liveData.homeTeam.name}
                    className="w-8 h-8 object-contain"
                  />
                )}
                <div>
                  <span className="font-semibold text-white">{liveData.homeTeam.name}</span>
                  {liveData.homeTeam.record && (
                    <span className="ml-2 text-xs text-zinc-500">({liveData.homeTeam.record})</span>
                  )}
                </div>
              </div>
              <span className={`text-2xl font-bold ${
                isFinal && (liveData.homeTeam.score ?? 0) > (liveData.awayTeam?.score ?? 0) 
                  ? 'text-white' 
                  : 'text-zinc-400'
              }`}>
                {liveData.homeTeam.score ?? '-'}
              </span>
            </div>
          )}
        </div>
        
        {/* Quick Odds Preview */}
        {liveData.odds && !isFinal && (
          <div className="flex items-center gap-4 mt-3 pt-3 border-t border-zinc-800 text-xs text-zinc-400">
            <span>Spread: {liveData.odds.spread > 0 ? '+' : ''}{liveData.odds.spread}</span>
            <span>O/U: {liveData.odds.total}</span>
            <span>ML: {liveData.odds.homeML > 0 ? '+' : ''}{liveData.odds.homeML}</span>
          </div>
        )}
        
        {/* Edge Alert Badge - Show when game has edge alerts */}
        {edgeAlerts.length > 0 && !isFinal && (
          <div className="flex items-center gap-2 mt-2">
            {edgeAlerts.some(a => a.severity === 'critical') && (
              <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-xs font-medium rounded flex items-center gap-1">
                🚨 Edge Alert
              </span>
            )}
            {edgeAlerts.some(a => a.type === 'rlm') && (
              <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs font-medium rounded">
                RLM
              </span>
            )}
            {edgeAlerts.some(a => a.type === 'sharp-public') && (
              <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs font-medium rounded">
                Sharp Split
              </span>
            )}
          </div>
        )}
      </div>
      
      {/* Expanded View */}
      {isExpanded && (
        <div className="border-t border-zinc-800 p-4 space-y-4">
          {/* Betting Lines Detail */}
          {liveData.odds && (
            <div>
              <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-2">Betting Lines</h4>
              <div className="grid grid-cols-3 gap-4">
                {/* Spread */}
                <div className="bg-zinc-800 rounded-lg p-3">
                  <div className="text-xs text-zinc-500 mb-1">Spread</div>
                  <div className="text-white font-semibold">
                    {liveData.awayTeam?.abbreviation ?? 'Away'} {liveData.odds.spread > 0 ? '+' : ''}{-liveData.odds.spread}
                  </div>
                  <div className="text-white font-semibold">
                    {liveData.homeTeam?.abbreviation ?? 'Home'} {liveData.odds.spread > 0 ? '+' : ''}{liveData.odds.spread}
                  </div>
                </div>
                
                {/* Total */}
                <div className="bg-zinc-800 rounded-lg p-3">
                  <div className="text-xs text-zinc-500 mb-1">Total</div>
                  <div className="text-white font-semibold">
                    O {liveData.odds.total} ({formatOdds(liveData.odds.overOdds)})
                  </div>
                  <div className="text-white font-semibold">
                    U {liveData.odds.total} ({formatOdds(liveData.odds.underOdds)})
                  </div>
                </div>
                
                {/* Moneyline */}
                <div className="bg-zinc-800 rounded-lg p-3">
                  <div className="text-xs text-zinc-500 mb-1">Moneyline</div>
                  <div className="text-white font-semibold">
                    {liveData.awayTeam?.abbreviation ?? 'Away'} {formatOdds(liveData.odds.awayML)}
                  </div>
                  <div className="text-white font-semibold">
                    {liveData.homeTeam?.abbreviation ?? 'Home'} {formatOdds(liveData.odds.homeML)}
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Consensus */}
          {liveData.consensus && (
            <div>
              <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-2">
                Consensus ({liveData.consensus.bookmakerCount} books)
              </h4>
              <div className="flex gap-4 text-sm">
                <span className="text-zinc-400">
                  Spread: <span className="text-white">{liveData.consensus.spread?.toFixed(1)}</span>
                </span>
                <span className="text-zinc-400">
                  Total: <span className="text-white">{liveData.consensus.total?.toFixed(1)}</span>
                </span>
              </div>
            </div>
          )}
          
          {/* Edge Alerts - THE EDGE */}
          {edgeAlerts.length > 0 && !isFinal && (
            <div>
              <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-2 flex items-center gap-2">
                <span className="text-amber-400">⚡</span> The Edge
              </h4>
              <div className="space-y-2">
                {edgeAlerts.map(alert => (
                  <div 
                    key={alert.id}
                    className={`rounded-lg p-3 ${
                      alert.severity === 'critical' 
                        ? 'bg-red-500/10 border border-red-500/30' 
                        : alert.severity === 'major'
                        ? 'bg-amber-500/10 border border-amber-500/30'
                        : 'bg-zinc-800'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-semibold text-white text-sm">{alert.title}</div>
                        <div className="text-xs text-zinc-400 mt-1">{alert.description}</div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className={`text-xs font-medium ${
                          alert.confidence >= 75 ? 'text-green-400' : 
                          alert.confidence >= 50 ? 'text-amber-400' : 'text-zinc-400'
                        }`}>
                          {alert.confidence}% conf
                        </div>
                        {alert.expectedValue && (
                          <div className="text-xs text-green-400">
                            +{alert.expectedValue}% EV
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Analytics Section - Trends, H2H, AI Insights */}
          {showAnalytics && !isFinal && (
            <div>
              {loadingAnalytics ? (
                <div className="text-xs text-zinc-500 animate-pulse">Loading analysis...</div>
              ) : analytics ? (
                <div className="space-y-3">
                  {/* Top Pick / AI Recommendation */}
                  {analytics.trends?.topPick && (
                    <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-green-400">🎯</span>
                        <h4 className="text-xs font-semibold text-green-400 uppercase">Top Pick</h4>
                      </div>
                      <div className="text-white font-semibold">{analytics.trends.topPick.selection}</div>
                      <div className="text-xs text-zinc-400 mt-1">
                        {analytics.trends.topPick.confidence}% confidence • {analytics.trends.topPick.supportingTrends} supporting trends
                      </div>
                    </div>
                  )}
                  
                  {/* Matched Trends Summary */}
                  {analytics.trends && analytics.trends.matched > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-2 flex items-center gap-2">
                        <span className="text-blue-400">📊</span> Trends ({analytics.trends.matched} matched)
                      </h4>
                      <div className="space-y-1">
                        {analytics.trends.spreadTrends?.slice(0, 3).map((trend, i) => (
                          <div key={i} className="text-xs text-zinc-400 flex items-center gap-2">
                            <span className={trend.confidence >= 70 ? 'text-green-400' : 'text-amber-400'}>•</span>
                            <span>{trend.description}</span>
                            <span className="text-zinc-600 ml-auto">{trend.confidence}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* H2H Summary */}
                  {analytics.h2h && analytics.h2h.gamesPlayed > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-1 flex items-center gap-2">
                        <span className="text-purple-400">🏆</span> Head-to-Head
                      </h4>
                      <div className="text-xs text-zinc-400">
                        {analytics.h2h.gamesPlayed} games • ATS: {analytics.h2h.homeATSRecord} • Avg Total: {analytics.h2h.avgTotal?.toFixed(1)}
                      </div>
                    </div>
                  )}
                  
                  {/* Edge Score */}
                  {analytics.edgeScore && analytics.edgeScore.overall > 0 && (
                    <div className="flex items-center gap-3 pt-2 border-t border-zinc-800">
                      <div className="text-xs text-zinc-500">Edge Score:</div>
                      <div className={`text-sm font-bold ${
                        analytics.edgeScore.overall >= 70 ? 'text-green-400' :
                        analytics.edgeScore.overall >= 50 ? 'text-amber-400' : 'text-zinc-400'
                      }`}>
                        {analytics.edgeScore.overall}/100
                      </div>
                      <div className="flex gap-2 text-xs text-zinc-500">
                        <span>Trends: {analytics.edgeScore.trendAlignment}</span>
                        <span>Sharp: {analytics.edgeScore.sharpSignal}</span>
                      </div>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          )}
          
          {/* Game Info */}
          <div className="flex flex-wrap gap-4 text-xs text-zinc-500">
            {liveData.venue && (
              <span>📍 {liveData.venue}</span>
            )}
            {liveData.weather && (
              <span>🌡️ {liveData.weather.temp}°F - {liveData.weather.condition}</span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function formatOdds(odds: number): string {
  if (odds > 0) return `+${odds}`
  return String(odds)
}

// Game List Component
interface GameListProps {
  games: UnifiedGame[]
  title?: string
  showEmpty?: boolean
}

export function GameList({ games, title, showEmpty = true }: GameListProps) {
  if (games.length === 0 && !showEmpty) return null
  
  return (
    <div className="space-y-4">
      {title && (
        <h3 className="text-lg font-semibold text-white">{title}</h3>
      )}
      
      {games.length === 0 ? (
        <div className="text-center py-8 text-zinc-500">
          No games scheduled
        </div>
      ) : (
        <div className="space-y-3">
          {games.map(game => (
            <GameView key={game.id} game={game} />
          ))}
        </div>
      )}
    </div>
  )
}

// Score Ticker for live games
interface ScoreTickerProps {
  games: UnifiedGame[]
}

export function ScoreTicker({ games }: ScoreTickerProps) {
  const liveGames = games.filter(g => g.status === 'live')
  
  if (liveGames.length === 0) return null
  
  return (
    <div className="bg-zinc-900 border-b border-zinc-800 overflow-hidden">
      <div className="flex items-center animate-marquee whitespace-nowrap py-2">
        {liveGames.map(game => (
          <div key={game.id} className="inline-flex items-center gap-4 px-6 border-r border-zinc-800">
            <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
            <span className="text-sm">
              <span className="text-zinc-400">{game.awayTeam.abbreviation}</span>
              <span className="mx-2 font-bold text-white">{game.awayTeam.score}</span>
              <span className="text-zinc-600">@</span>
              <span className="mx-2 font-bold text-white">{game.homeTeam.score}</span>
              <span className="text-zinc-400">{game.homeTeam.abbreviation}</span>
              <span className="ml-2 text-xs text-zinc-500">{game.period} {game.clock}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
