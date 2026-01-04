'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Target,
  BarChart3,
  Calendar,
  Flame,
  Clock,
  Trophy,
  Activity,
  Zap,
  Brain,
  Users,
  DollarSign,
  ChevronRight,
  AlertTriangle,
  CheckCircle,
  Percent,
  Timer,
  Star,
  Shield,
  Swords,
  LineChart,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  Info
} from 'lucide-react'
import { getGameById, type GameDetail } from '@/lib/api/games'

// Tabs for the game detail view
type Tab = 'overview' | 'trends' | 'betting' | 'matchup' | 'ai'

export default function GameDetailPage() {
  const params = useParams()
  const gameId = params.id as string
  
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [game, setGame] = useState<GameDetail | null>(null)
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    const loadGame = async () => {
      const data = await getGameById(gameId)
      setGame(data)
      setLoading(false)
    }
    loadGame()
  }, [gameId])

  if (loading) {
    return (
      <main className="min-h-screen" style={{ background: '#06060c' }}>
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-pulse text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full" style={{ background: 'rgba(255,107,0,0.2)' }} />
              <p style={{ color: '#808090' }}>Loading matchup data...</p>
            </div>
          </div>
        </div>
      </main>
    )
  }

  if (!game) {
    return (
      <main className="min-h-screen" style={{ background: '#06060c' }}>
        <div className="max-w-6xl mx-auto px-4 py-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6" style={{ color: '#808090' }}>
            <ArrowLeft style={{ width: '16px', height: '16px' }} />
            Back to Games
          </Link>
          <div className="text-center py-12">
            <AlertTriangle style={{ color: '#FF4455', width: '48px', height: '48px', margin: '0 auto' }} />
            <h1 className="text-2xl font-bold mt-4" style={{ color: '#FFF' }}>Game Not Found</h1>
            <p className="mt-2" style={{ color: '#808090' }}>This matchup may have ended or doesn&apos;t exist.</p>
          </div>
        </div>
      </main>
    )
  }

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Overview', icon: <Target style={{ width: '16px', height: '16px' }} /> },
    { id: 'trends', label: 'Trends', icon: <TrendingUp style={{ width: '16px', height: '16px' }} /> },
    { id: 'betting', label: 'Betting', icon: <DollarSign style={{ width: '16px', height: '16px' }} /> },
    { id: 'matchup', label: 'Matchup', icon: <Swords style={{ width: '16px', height: '16px' }} /> },
    { id: 'ai', label: 'AI Analysis', icon: <Brain style={{ width: '16px', height: '16px' }} /> },
  ]

  return (
    <main className="min-h-screen" style={{ background: '#06060c' }}>
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Back Navigation */}
        <Link href={`/${game.sport.toLowerCase()}`} 
              className="inline-flex items-center gap-2 mb-6 hover:opacity-80 transition-opacity" 
              style={{ color: '#808090' }}>
          <ArrowLeft style={{ width: '16px', height: '16px' }} />
          Back to {game.sport} Games
        </Link>

        {/* Header Card - Matchup Overview */}
        <div className="rounded-2xl p-6 mb-6" style={{ background: '#0c0c14', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{game.sportIcon}</span>
              <div>
                <p className="text-sm font-semibold" style={{ color: '#808090' }}>{game.league}</p>
                <div className="flex items-center gap-2">
                  <Clock style={{ color: '#FF6B00', width: '14px', height: '14px' }} />
                  <span className="text-sm" style={{ color: '#A0A0B0' }}>{game.date} • {game.time}</span>
                </div>
              </div>
            </div>
            {game.isHot && (
              <span className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold"
                    style={{ background: 'rgba(255,107,0,0.2)', color: '#FF6B00' }}>
                <Flame style={{ width: '12px', height: '12px' }} /> HIGH ACTION
              </span>
            )}
          </div>

          {/* Teams */}
          <div className="grid grid-cols-3 gap-4 items-center">
            {/* Away Team */}
            <div className="text-center">
              <div className="text-4xl mb-2">{game.away.emoji}</div>
              <h2 className="text-xl font-bold" style={{ color: '#FFF' }}>{game.away.city}</h2>
              <p className="text-2xl font-bold" style={{ color: '#FFF' }}>{game.away.name}</p>
              <p className="text-sm" style={{ color: '#808090' }}>{game.away.record}</p>
              <div className="flex items-center justify-center gap-2 mt-2">
                <span className="text-xs" style={{ color: '#606070' }}>ATS:</span>
                <span className="text-sm font-semibold" style={{ color: '#A0A0B0' }}>{game.away.ats}</span>
              </div>
            </div>

            {/* VS & Lines */}
            <div className="text-center">
              <div className="text-lg font-bold mb-3" style={{ color: '#606070' }}>VS</div>
              <div className="space-y-2">
                <div className="rounded-lg p-3" style={{ background: 'rgba(255,107,0,0.1)' }}>
                  <p className="text-xs" style={{ color: '#808090' }}>SPREAD</p>
                  <p className="text-xl font-bold font-mono" style={{ color: '#FF6B00' }}>
                    {game.spread.favorite} {game.spread.line > 0 ? '+' : ''}{game.spread.line}
                  </p>
                </div>
                <div className="rounded-lg p-3" style={{ background: 'rgba(0,255,136,0.1)' }}>
                  <p className="text-xs" style={{ color: '#808090' }}>TOTAL</p>
                  <p className="text-xl font-bold font-mono" style={{ color: '#00FF88' }}>
                    O/U {game.total}
                  </p>
                </div>
              </div>
            </div>

            {/* Home Team */}
            <div className="text-center">
              <div className="text-4xl mb-2">{game.home.emoji}</div>
              <h2 className="text-xl font-bold" style={{ color: '#FFF' }}>{game.home.city}</h2>
              <p className="text-2xl font-bold" style={{ color: '#FFF' }}>{game.home.name}</p>
              <p className="text-sm" style={{ color: '#808090' }}>{game.home.record}</p>
              <div className="flex items-center justify-center gap-2 mt-2">
                <span className="text-xs" style={{ color: '#606070' }}>ATS:</span>
                <span className="text-sm font-semibold" style={{ color: '#A0A0B0' }}>{game.home.ats}</span>
              </div>
            </div>
          </div>

          {/* AI Confidence Bar */}
          <div className="mt-6 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Brain style={{ color: '#FF6B00', width: '16px', height: '16px' }} />
                <span className="text-sm font-semibold" style={{ color: '#FFF' }}>AI Prediction</span>
              </div>
              <span className="text-sm" style={{ color: '#808090' }}>{game.aiPick}</span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
              <div 
                className="h-full rounded-full transition-all"
                style={{ 
                  width: `${game.aiConfidence}%`,
                  background: game.aiConfidence >= 70 ? '#00FF88' : game.aiConfidence >= 55 ? '#FF6B00' : '#FF4455'
                }}
              />
            </div>
            <p className="text-xs mt-1" style={{ color: '#606070' }}>{game.aiConfidence}% confidence</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm whitespace-nowrap transition-all"
              style={{
                background: activeTab === tab.id ? '#FF6B00' : 'rgba(255,255,255,0.05)',
                color: activeTab === tab.id ? '#FFF' : '#808090',
              }}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content - 2 cols */}
          <div className="lg:col-span-2 space-y-6">
            {activeTab === 'overview' && <OverviewTab game={game} />}
            {activeTab === 'trends' && <TrendsTab game={game} />}
            {activeTab === 'betting' && <BettingTab game={game} />}
            {activeTab === 'matchup' && <MatchupTab game={game} />}
            {activeTab === 'ai' && <AITab game={game} />}
          </div>

          {/* Sidebar - 1 col */}
          <div className="space-y-6">
            {/* Quick Bet Signals */}
            <div className="rounded-xl p-5" style={{ background: '#0c0c14', border: '1px solid rgba(255,255,255,0.06)' }}>
              <h3 className="flex items-center gap-2 text-lg font-bold mb-4" style={{ color: '#FFF' }}>
                <Zap style={{ color: '#FF6B00', width: '18px', height: '18px' }} />
                Quick Signals
              </h3>
              <div className="space-y-3">
                {game.signals.map((signal, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-lg" 
                       style={{ background: 'rgba(255,255,255,0.03)' }}>
                    <div className="mt-0.5">
                      {signal.type === 'bullish' ? (
                        <TrendingUp style={{ color: '#00FF88', width: '16px', height: '16px' }} />
                      ) : signal.type === 'bearish' ? (
                        <TrendingDown style={{ color: '#FF4455', width: '16px', height: '16px' }} />
                      ) : (
                        <Info style={{ color: '#FF6B00', width: '16px', height: '16px' }} />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: '#FFF' }}>{signal.title}</p>
                      <p className="text-xs" style={{ color: '#808090' }}>{signal.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Injury Report */}
            <div className="rounded-xl p-5" style={{ background: '#0c0c14', border: '1px solid rgba(255,255,255,0.06)' }}>
              <h3 className="flex items-center gap-2 text-lg font-bold mb-4" style={{ color: '#FFF' }}>
                <AlertTriangle style={{ color: '#FF4455', width: '18px', height: '18px' }} />
                Injury Report
              </h3>
              {game.injuries.length > 0 ? (
                <div className="space-y-2">
                  {game.injuries.map((injury, i) => (
                    <div key={i} className="flex items-center justify-between p-2 rounded"
                         style={{ background: 'rgba(255,68,85,0.1)' }}>
                      <div>
                        <p className="text-sm font-semibold" style={{ color: '#FFF' }}>{injury.player}</p>
                        <p className="text-xs" style={{ color: '#808090' }}>{injury.team} • {injury.position}</p>
                      </div>
                      <span className="text-xs font-bold px-2 py-1 rounded"
                            style={{ 
                              background: injury.status === 'Out' ? 'rgba(255,68,85,0.2)' : 'rgba(255,170,0,0.2)',
                              color: injury.status === 'Out' ? '#FF4455' : '#FFAA00'
                            }}>
                        {injury.status}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm" style={{ color: '#808090' }}>No significant injuries reported</p>
              )}
            </div>

            {/* Weather (if outdoor) */}
            {game.weather && (
              <div className="rounded-xl p-5" style={{ background: '#0c0c14', border: '1px solid rgba(255,255,255,0.06)' }}>
                <h3 className="flex items-center gap-2 text-lg font-bold mb-4" style={{ color: '#FFF' }}>
                  🌤️ Weather
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)' }}>
                    <p className="text-2xl font-bold" style={{ color: '#FFF' }}>{game.weather.temp}°F</p>
                    <p className="text-xs" style={{ color: '#808090' }}>Temperature</p>
                  </div>
                  <div className="text-center p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)' }}>
                    <p className="text-2xl font-bold" style={{ color: '#FFF' }}>{game.weather.wind} mph</p>
                    <p className="text-xs" style={{ color: '#808090' }}>Wind</p>
                  </div>
                </div>
                <p className="text-center text-sm mt-3" style={{ color: '#A0A0B0' }}>{game.weather.condition}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}

// Tab Components
function OverviewTab({ game }: { game: GameDetail }) {
  return (
    <>
      {/* Key Metrics */}
      <div className="rounded-xl p-5" style={{ background: '#0c0c14', border: '1px solid rgba(255,255,255,0.06)' }}>
        <h3 className="text-lg font-bold mb-4" style={{ color: '#FFF' }}>Key Betting Metrics</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard label="Line Movement" value={game.metrics.lineMovement} trend={game.metrics.lineDirection} />
          <MetricCard label="Public %" value={`${game.metrics.publicPct}%`} sublabel={game.metrics.publicSide} />
          <MetricCard label="Sharp Action" value={game.metrics.sharpMoney} trend={game.metrics.sharpTrend} />
          <MetricCard label="Handle %" value={`${game.metrics.handlePct}%`} sublabel={game.metrics.handleSide} />
        </div>
      </div>

      {/* H2H History */}
      <div className="rounded-xl p-5" style={{ background: '#0c0c14', border: '1px solid rgba(255,255,255,0.06)' }}>
        <h3 className="text-lg font-bold mb-4" style={{ color: '#FFF' }}>Head-to-Head History</h3>
        <div className="space-y-3">
          {game.h2h.map((match, i) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-lg"
                 style={{ background: 'rgba(255,255,255,0.03)' }}>
              <div>
                <p className="text-sm font-semibold" style={{ color: '#FFF' }}>{match.date}</p>
                <p className="text-xs" style={{ color: '#808090' }}>{match.score}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold" style={{ color: match.atsResult === 'W' ? '#00FF88' : '#FF4455' }}>
                  {match.winner} ATS: {match.atsResult}
                </p>
                <p className="text-xs" style={{ color: '#808090' }}>O/U: {match.ouResult}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}

function TrendsTab({ game }: { game: GameDetail }) {
  return (
    <div className="rounded-xl p-5" style={{ background: '#0c0c14', border: '1px solid rgba(255,255,255,0.06)' }}>
      <h3 className="text-lg font-bold mb-4" style={{ color: '#FFF' }}>Betting Trends</h3>
      <div className="grid md:grid-cols-2 gap-6">
        {/* Home Team Trends */}
        <div>
          <h4 className="text-sm font-bold mb-3" style={{ color: '#FF6B00' }}>{game.home.name} Trends</h4>
          <div className="space-y-2">
            {game.homeTrends.map((trend, i) => (
              <div key={i} className="flex items-start gap-2 p-2 rounded"
                   style={{ background: 'rgba(255,255,255,0.03)' }}>
                <CheckCircle style={{ color: '#00FF88', width: '14px', height: '14px', marginTop: '2px', flexShrink: 0 }} />
                <p className="text-sm" style={{ color: '#A0A0B0' }}>{trend}</p>
              </div>
            ))}
          </div>
        </div>
        
        {/* Away Team Trends */}
        <div>
          <h4 className="text-sm font-bold mb-3" style={{ color: '#FF6B00' }}>{game.away.name} Trends</h4>
          <div className="space-y-2">
            {game.awayTrends.map((trend, i) => (
              <div key={i} className="flex items-start gap-2 p-2 rounded"
                   style={{ background: 'rgba(255,255,255,0.03)' }}>
                <CheckCircle style={{ color: '#00FF88', width: '14px', height: '14px', marginTop: '2px', flexShrink: 0 }} />
                <p className="text-sm" style={{ color: '#A0A0B0' }}>{trend}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function BettingTab({ game }: { game: GameDetail }) {
  return (
    <>
      {/* Line Movement Chart Placeholder */}
      <div className="rounded-xl p-5" style={{ background: '#0c0c14', border: '1px solid rgba(255,255,255,0.06)' }}>
        <h3 className="flex items-center gap-2 text-lg font-bold mb-4" style={{ color: '#FFF' }}>
          <LineChart style={{ color: '#FF6B00', width: '18px', height: '18px' }} />
          Line Movement
        </h3>
        <div className="h-48 flex items-center justify-center rounded-lg" style={{ background: 'rgba(255,255,255,0.03)' }}>
          <div className="text-center">
            <p className="text-sm" style={{ color: '#808090' }}>Line movement chart</p>
            <p className="text-xs mt-1" style={{ color: '#606070' }}>
              Open: {game.betting.openSpread} → Current: {game.betting.currentSpread}
            </p>
          </div>
        </div>
      </div>

      {/* Betting Splits */}
      <div className="rounded-xl p-5" style={{ background: '#0c0c14', border: '1px solid rgba(255,255,255,0.06)' }}>
        <h3 className="flex items-center gap-2 text-lg font-bold mb-4" style={{ color: '#FFF' }}>
          <PieChart style={{ color: '#FF6B00', width: '18px', height: '18px' }} />
          Betting Splits
        </h3>
        <div className="space-y-4">
          <BettingSplit 
            label="Spread" 
            leftTeam={game.away.abbr} 
            rightTeam={game.home.abbr}
            leftPct={game.betting.spreadPcts.away}
            rightPct={game.betting.spreadPcts.home}
          />
          <BettingSplit 
            label="Moneyline" 
            leftTeam={game.away.abbr} 
            rightTeam={game.home.abbr}
            leftPct={game.betting.mlPcts.away}
            rightPct={game.betting.mlPcts.home}
          />
          <BettingSplit 
            label="Total" 
            leftTeam="OVER" 
            rightTeam="UNDER"
            leftPct={game.betting.totalPcts.over}
            rightPct={game.betting.totalPcts.under}
          />
        </div>
      </div>
    </>
  )
}

function MatchupTab({ game }: { game: GameDetail }) {
  return (
    <div className="rounded-xl p-5" style={{ background: '#0c0c14', border: '1px solid rgba(255,255,255,0.06)' }}>
      <h3 className="flex items-center gap-2 text-lg font-bold mb-4" style={{ color: '#FFF' }}>
        <Swords style={{ color: '#FF6B00', width: '18px', height: '18px' }} />
        Matchup Analysis
      </h3>
      <div className="space-y-6">
        {/* Offensive vs Defensive Rankings */}
        <div>
          <h4 className="text-sm font-bold mb-3" style={{ color: '#808090' }}>OFFENSE VS DEFENSE</h4>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-sm font-semibold" style={{ color: '#FFF' }}>{game.away.abbr}</p>
              <p className="text-2xl font-bold" style={{ color: '#00FF88' }}>#{game.matchup.awayOffRank}</p>
              <p className="text-xs" style={{ color: '#808090' }}>Off Rank</p>
            </div>
            <div className="text-center">
              <p className="text-sm font-bold" style={{ color: '#606070' }}>vs</p>
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold" style={{ color: '#FFF' }}>{game.home.abbr}</p>
              <p className="text-2xl font-bold" style={{ color: '#FF4455' }}>#{game.matchup.homeDefRank}</p>
              <p className="text-xs" style={{ color: '#808090' }}>Def Rank</p>
            </div>
          </div>
        </div>

        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '1rem' }}>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-sm font-semibold" style={{ color: '#FFF' }}>{game.home.abbr}</p>
              <p className="text-2xl font-bold" style={{ color: '#00FF88' }}>#{game.matchup.homeOffRank}</p>
              <p className="text-xs" style={{ color: '#808090' }}>Off Rank</p>
            </div>
            <div className="text-center">
              <p className="text-sm font-bold" style={{ color: '#606070' }}>vs</p>
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold" style={{ color: '#FFF' }}>{game.away.abbr}</p>
              <p className="text-2xl font-bold" style={{ color: '#FF4455' }}>#{game.matchup.awayDefRank}</p>
              <p className="text-xs" style={{ color: '#808090' }}>Def Rank</p>
            </div>
          </div>
        </div>

        {/* Key Matchup Points */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '1rem' }}>
          <h4 className="text-sm font-bold mb-3" style={{ color: '#808090' }}>KEY MATCHUP POINTS</h4>
          <div className="space-y-2">
            {game.matchup.keyPoints.map((point, i) => (
              <div key={i} className="flex items-start gap-2">
                <Star style={{ color: '#FF6B00', width: '14px', height: '14px', marginTop: '2px', flexShrink: 0 }} />
                <p className="text-sm" style={{ color: '#A0A0B0' }}>{point}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function AITab({ game }: { game: GameDetail }) {
  return (
    <div className="space-y-6">
      {/* AI Summary */}
      <div className="rounded-xl p-5" style={{ background: '#0c0c14', border: '1px solid rgba(255,107,0,0.3)' }}>
        <h3 className="flex items-center gap-2 text-lg font-bold mb-4" style={{ color: '#FFF' }}>
          <Brain style={{ color: '#FF6B00', width: '18px', height: '18px' }} />
          AI Analysis Summary
        </h3>
        <p className="text-sm leading-relaxed" style={{ color: '#A0A0B0' }}>{game.aiAnalysis}</p>
      </div>

      {/* AI Picks */}
      <div className="rounded-xl p-5" style={{ background: '#0c0c14', border: '1px solid rgba(255,255,255,0.06)' }}>
        <h3 className="text-lg font-bold mb-4" style={{ color: '#FFF' }}>AI Recommended Plays</h3>
        <div className="space-y-3">
          {game.aiPicks.map((pick, i) => (
            <div key={i} className="flex items-center justify-between p-4 rounded-lg"
                 style={{ background: 'rgba(255,107,0,0.1)' }}>
              <div>
                <p className="font-bold" style={{ color: '#FFF' }}>{pick.pick}</p>
                <p className="text-sm" style={{ color: '#808090' }}>{pick.reasoning}</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold" style={{ color: '#FF6B00' }}>{pick.confidence}%</p>
                <p className="text-xs" style={{ color: '#606070' }}>confidence</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Helper Components
function MetricCard({ label, value, trend, sublabel }: { 
  label: string
  value: string
  trend?: 'up' | 'down' | 'stable'
  sublabel?: string
}) {
  return (
    <div className="p-4 rounded-lg text-center" style={{ background: 'rgba(255,255,255,0.03)' }}>
      <p className="text-xs mb-1" style={{ color: '#606070' }}>{label}</p>
      <div className="flex items-center justify-center gap-1">
        <span className="text-xl font-bold" style={{ color: '#FFF' }}>{value}</span>
        {trend && (
          trend === 'up' ? <ArrowUpRight style={{ color: '#00FF88', width: '16px', height: '16px' }} /> :
          trend === 'down' ? <ArrowDownRight style={{ color: '#FF4455', width: '16px', height: '16px' }} /> :
          null
        )}
      </div>
      {sublabel && <p className="text-xs mt-1" style={{ color: '#808090' }}>{sublabel}</p>}
    </div>
  )
}

function BettingSplit({ label, leftTeam, rightTeam, leftPct, rightPct }: {
  label: string
  leftTeam: string
  rightTeam: string
  leftPct: number
  rightPct: number
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-semibold" style={{ color: '#A0A0B0' }}>{label}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs font-bold w-12" style={{ color: '#FFF' }}>{leftTeam}</span>
        <div className="flex-1 h-6 rounded-full overflow-hidden flex" style={{ background: 'rgba(255,255,255,0.1)' }}>
          <div 
            className="h-full flex items-center justify-center text-xs font-bold"
            style={{ width: `${leftPct}%`, background: '#FF6B00', color: '#FFF' }}
          >
            {leftPct}%
          </div>
          <div 
            className="h-full flex items-center justify-center text-xs font-bold"
            style={{ width: `${rightPct}%`, background: 'rgba(255,255,255,0.2)', color: '#FFF' }}
          >
            {rightPct}%
          </div>
        </div>
        <span className="text-xs font-bold w-12 text-right" style={{ color: '#FFF' }}>{rightTeam}</span>
      </div>
    </div>
  )
}
