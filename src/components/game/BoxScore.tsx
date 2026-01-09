// =============================================================================
// BOX SCORE COMPONENT - Display final scores and game wrap-up
// =============================================================================

'use client'

import { 
  Trophy, 
  TrendingUp, 
  TrendingDown,
  Target,
  CheckCircle,
  XCircle,
  Minus,
  Star,
  Zap,
  Brain,
  BarChart3
} from 'lucide-react'
import { type GameDetail, type GameResult, type BoxScoreQuarter, type TopPerformer } from '@/lib/api/games'

interface BoxScoreProps {
  game: GameDetail
}

// Result badge styling
function ResultBadge({ result, label }: { result: 'win' | 'loss' | 'push'; label: string }) {
  const styles = {
    win: { bg: 'rgba(0,255,136,0.2)', border: 'rgba(0,255,136,0.4)', color: '#00FF88', icon: CheckCircle },
    loss: { bg: 'rgba(255,68,85,0.2)', border: 'rgba(255,68,85,0.4)', color: '#FF4455', icon: XCircle },
    push: { bg: 'rgba(255,170,0,0.2)', border: 'rgba(255,170,0,0.4)', color: '#FFAA00', icon: Minus },
  }
  const style = styles[result]
  const Icon = style.icon

  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold"
          style={{ background: style.bg, border: `1px solid ${style.border}`, color: style.color }}>
      <Icon className="w-4 h-4" />
      {label}
    </span>
  )
}

// Quarter-by-quarter score table
function QuarterScoreTable({ 
  homeQuarters, 
  awayQuarters, 
  homeTeam, 
  awayTeam,
  sport
}: { 
  homeQuarters: BoxScoreQuarter
  awayQuarters: BoxScoreQuarter
  homeTeam: { abbr: string; emoji: string; name: string }
  awayTeam: { abbr: string; emoji: string; name: string }
  sport: string
}) {
  // Determine period labels based on sport
  const getPeriodLabels = () => {
    if (sport === 'NHL') return ['1st', '2nd', '3rd', 'OT', 'F']
    if (sport === 'MLB') return ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'F']
    return ['Q1', 'Q2', 'Q3', 'Q4', 'OT', 'F']
  }

  const labels = getPeriodLabels()

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            <th className="text-left py-3 px-3 text-xs font-semibold" style={{ color: '#606070' }}>TEAM</th>
            {['Q1', 'Q2', 'Q3', 'Q4'].map((q, i) => (
              <th key={q} className="text-center py-3 px-3 text-xs font-semibold" style={{ color: '#606070' }}>
                {labels[i]}
              </th>
            ))}
            {homeQuarters.ot !== undefined && (
              <th className="text-center py-3 px-3 text-xs font-semibold" style={{ color: '#FFAA00' }}>OT</th>
            )}
            <th className="text-center py-3 px-3 text-xs font-bold" style={{ color: '#FFF' }}>FINAL</th>
          </tr>
        </thead>
        <tbody>
          {/* Away Team */}
          <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <td className="py-3 px-3">
              <div className="flex items-center gap-2">
                <span className="text-lg">{awayTeam.emoji}</span>
                <span className="font-semibold" style={{ color: awayQuarters.final > homeQuarters.final ? '#FFF' : '#808090' }}>
                  {awayTeam.abbr}
                </span>
              </div>
            </td>
            <td className="text-center py-3 px-3 text-sm" style={{ color: '#A0A0B0' }}>{awayQuarters.q1}</td>
            <td className="text-center py-3 px-3 text-sm" style={{ color: '#A0A0B0' }}>{awayQuarters.q2}</td>
            <td className="text-center py-3 px-3 text-sm" style={{ color: '#A0A0B0' }}>{awayQuarters.q3}</td>
            <td className="text-center py-3 px-3 text-sm" style={{ color: '#A0A0B0' }}>{awayQuarters.q4}</td>
            {awayQuarters.ot !== undefined && (
              <td className="text-center py-3 px-3 text-sm" style={{ color: '#FFAA00' }}>{awayQuarters.ot}</td>
            )}
            <td className="text-center py-3 px-3">
              <span className="text-xl font-black" style={{ color: awayQuarters.final > homeQuarters.final ? '#00FF88' : '#FFF' }}>
                {awayQuarters.final}
              </span>
            </td>
          </tr>
          {/* Home Team */}
          <tr>
            <td className="py-3 px-3">
              <div className="flex items-center gap-2">
                <span className="text-lg">{homeTeam.emoji}</span>
                <span className="font-semibold" style={{ color: homeQuarters.final > awayQuarters.final ? '#FFF' : '#808090' }}>
                  {homeTeam.abbr}
                </span>
              </div>
            </td>
            <td className="text-center py-3 px-3 text-sm" style={{ color: '#A0A0B0' }}>{homeQuarters.q1}</td>
            <td className="text-center py-3 px-3 text-sm" style={{ color: '#A0A0B0' }}>{homeQuarters.q2}</td>
            <td className="text-center py-3 px-3 text-sm" style={{ color: '#A0A0B0' }}>{homeQuarters.q3}</td>
            <td className="text-center py-3 px-3 text-sm" style={{ color: '#A0A0B0' }}>{homeQuarters.q4}</td>
            {homeQuarters.ot !== undefined && (
              <td className="text-center py-3 px-3 text-sm" style={{ color: '#FFAA00' }}>{homeQuarters.ot}</td>
            )}
            <td className="text-center py-3 px-3">
              <span className="text-xl font-black" style={{ color: homeQuarters.final > awayQuarters.final ? '#00FF88' : '#FFF' }}>
                {homeQuarters.final}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}

// Top Performer Card
function PerformerCard({ performer, isTop }: { performer: TopPerformer; isTop?: boolean }) {
  return (
    <div className="p-3 rounded-lg" style={{ 
      background: isTop ? 'rgba(255,215,0,0.1)' : 'rgba(255,255,255,0.03)',
      border: isTop ? '1px solid rgba(255,215,0,0.3)' : '1px solid transparent'
    }}>
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          {isTop && <Star className="w-4 h-4" style={{ color: '#FFD700' }} />}
          <span className="font-bold text-sm" style={{ color: '#FFF' }}>{performer.player}</span>
        </div>
        <span className="text-xs px-2 py-0.5 rounded" style={{ background: 'rgba(255,255,255,0.1)', color: '#A0A0B0' }}>
          {performer.team} • {performer.position}
        </span>
      </div>
      <p className="text-sm font-mono" style={{ color: '#A0A0B0' }}>{performer.stats}</p>
      {performer.highlight && (
        <p className="text-xs mt-1" style={{ color: '#00FF88' }}>⚡ {performer.highlight}</p>
      )}
    </div>
  )
}

// Main BoxScore Component
export function BoxScore({ game }: BoxScoreProps) {
  if (!game.result || game.status !== 'final') {
    return null
  }

  const { result } = game
  const totalScore = result.homeScore + result.awayScore
  const margin = Math.abs(result.homeScore - result.awayScore)
  
  // Determine spread cover
  const spreadValue = game.spread.line
  const favoriteWon = game.spread.favorite === game.home.abbr 
    ? result.homeScore > result.awayScore 
    : result.awayScore > result.homeScore
  const coverMargin = game.spread.favorite === game.home.abbr
    ? result.homeScore - result.awayScore
    : result.awayScore - result.homeScore

  return (
    <div className="space-y-6">
      {/* FINAL SCORE BANNER */}
      <div className="rounded-2xl overflow-hidden" style={{ background: '#0c0c14', border: '1px solid rgba(255,255,255,0.06)' }}>
        {/* Header */}
        <div className="px-5 py-3 flex items-center justify-between" style={{ background: 'rgba(255,215,0,0.1)', borderBottom: '1px solid rgba(255,215,0,0.2)' }}>
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5" style={{ color: '#FFD700' }} />
            <span className="font-bold" style={{ color: '#FFD700' }}>FINAL SCORE</span>
          </div>
          <span className="text-xs" style={{ color: '#808090' }}>{game.date}</span>
        </div>

        {/* Quarter by Quarter */}
        <div className="p-5">
          <QuarterScoreTable 
            homeQuarters={result.homeQuarters}
            awayQuarters={result.awayQuarters}
            homeTeam={game.home}
            awayTeam={game.away}
            sport={game.sport}
          />
        </div>
      </div>

      {/* BETTING RESULTS */}
      <div className="rounded-2xl p-5" style={{ background: '#0c0c14', border: '1px solid rgba(255,255,255,0.06)' }}>
        <h3 className="flex items-center gap-2 text-lg font-bold mb-4" style={{ color: '#FFF' }}>
          <BarChart3 className="w-5 h-5" style={{ color: '#FF6B00' }} />
          Betting Results
        </h3>
        
        <div className="grid sm:grid-cols-3 gap-4 mb-4">
          {/* Spread Result */}
          <div className="p-4 rounded-xl text-center" style={{ background: 'rgba(255,255,255,0.03)' }}>
            <p className="text-xs mb-2" style={{ color: '#606070' }}>SPREAD</p>
            <p className="text-sm font-bold mb-2" style={{ color: '#A0A0B0' }}>
              {game.spread.favorite} {game.spread.line > 0 ? '+' : ''}{game.spread.line}
            </p>
            <ResultBadge 
              result={result.spreadResult === 'away_cover' ? (game.spread.favorite === game.away.abbr ? 'win' : 'loss') : (game.spread.favorite === game.home.abbr ? 'win' : 'loss')}
              label={result.spreadResult === 'push' ? 'PUSH' : result.spreadResult === 'away_cover' ? `${game.away.abbr} COVERS` : `${game.home.abbr} COVERS`}
            />
          </div>

          {/* Total Result */}
          <div className="p-4 rounded-xl text-center" style={{ background: 'rgba(255,255,255,0.03)' }}>
            <p className="text-xs mb-2" style={{ color: '#606070' }}>TOTAL</p>
            <p className="text-sm font-bold mb-2" style={{ color: '#A0A0B0' }}>O/U {game.total}</p>
            <ResultBadge 
              result={result.totalResult === 'push' ? 'push' : (result.totalResult === 'over' ? 'win' : 'loss')}
              label={result.totalResult === 'push' ? 'PUSH' : result.totalResult === 'over' 
                ? `OVER (${totalScore})` 
                : `UNDER (${totalScore})`}
            />
          </div>

          {/* Moneyline Result */}
          <div className="p-4 rounded-xl text-center" style={{ background: 'rgba(255,255,255,0.03)' }}>
            <p className="text-xs mb-2" style={{ color: '#606070' }}>MONEYLINE</p>
            <p className="text-sm font-bold mb-2" style={{ color: '#A0A0B0' }}>
              {game.away.abbr} {game.moneyline.away > 0 ? '+' : ''}{game.moneyline.away} / {game.home.abbr} {game.moneyline.home > 0 ? '+' : ''}{game.moneyline.home}
            </p>
            <ResultBadge 
              result={result.winner === 'tie' ? 'push' : 'win'}
              label={result.winner === 'home' ? `${game.home.abbr} WINS` : result.winner === 'away' ? `${game.away.abbr} WINS` : 'TIE'}
            />
          </div>
        </div>

        {/* Opening vs Closing Lines */}
        {game.openingSpread && (
          <div className="p-3 rounded-lg flex items-center justify-between" style={{ background: 'rgba(255,255,255,0.03)' }}>
            <div>
              <p className="text-xs" style={{ color: '#606070' }}>LINE MOVEMENT</p>
              <p className="text-sm" style={{ color: '#A0A0B0' }}>
                Open: <span className="font-mono">{game.openingSpread.favorite} {game.openingSpread.line > 0 ? '+' : ''}{game.openingSpread.line}</span>
                {' → '}
                Close: <span className="font-mono">{game.spread.favorite} {game.spread.line > 0 ? '+' : ''}{game.spread.line}</span>
              </p>
            </div>
            {game.openingTotal && (
              <div className="text-right">
                <p className="text-xs" style={{ color: '#606070' }}>TOTAL MOVEMENT</p>
                <p className="text-sm" style={{ color: '#A0A0B0' }}>
                  <span className="font-mono">{game.openingTotal}</span> → <span className="font-mono">{game.total}</span>
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* AI PICK RESULT */}
      <div className="rounded-2xl overflow-hidden" style={{ 
        background: result.aiResult === 'win' 
          ? 'linear-gradient(135deg, rgba(0,255,136,0.1) 0%, rgba(0,100,50,0.1) 100%)'
          : result.aiResult === 'loss'
          ? 'linear-gradient(135deg, rgba(255,68,85,0.1) 0%, rgba(100,20,25,0.1) 100%)'
          : 'linear-gradient(135deg, rgba(255,170,0,0.1) 0%, rgba(100,85,0,0.1) 100%)',
        border: `1px solid ${result.aiResult === 'win' ? 'rgba(0,255,136,0.3)' : result.aiResult === 'loss' ? 'rgba(255,68,85,0.3)' : 'rgba(255,170,0,0.3)'}`
      }}>
        <div className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Brain className="w-5 h-5" style={{ color: '#FF6B00' }} />
              <span className="font-bold" style={{ color: '#FFF' }}>Matchups AI Pick</span>
            </div>
            {result.aiResult && (
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold"
                    style={{ 
                      background: result.aiResult === 'win' ? 'rgba(0,255,136,0.2)' : result.aiResult === 'loss' ? 'rgba(255,68,85,0.2)' : 'rgba(255,170,0,0.2)',
                      color: result.aiResult === 'win' ? '#00FF88' : result.aiResult === 'loss' ? '#FF4455' : '#FFAA00'
                    }}>
                {result.aiResult === 'win' ? <CheckCircle className="w-4 h-4" /> : result.aiResult === 'loss' ? <XCircle className="w-4 h-4" /> : <Minus className="w-4 h-4" />}
                {result.aiResult.toUpperCase()}
              </span>
            )}
          </div>
          
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="p-3 rounded-lg" style={{ background: 'rgba(0,0,0,0.3)' }}>
              <p className="text-xs mb-1" style={{ color: '#606070' }}>AI PICK</p>
              <p className="text-lg font-bold" style={{ color: '#FF6B00' }}>{game.aiPick}</p>
              <p className="text-xs" style={{ color: '#808090' }}>{game.aiConfidence}% confidence</p>
            </div>
            <div className="p-3 rounded-lg" style={{ background: 'rgba(0,0,0,0.3)' }}>
              <p className="text-xs mb-1" style={{ color: '#606070' }}>ANALYSIS</p>
              <p className="text-sm" style={{ color: '#A0A0B0' }}>{game.aiAnalysis.slice(0, 150)}...</p>
            </div>
          </div>
        </div>
      </div>

      {/* TOP PERFORMERS */}
      <div className="rounded-2xl p-5" style={{ background: '#0c0c14', border: '1px solid rgba(255,255,255,0.06)' }}>
        <h3 className="flex items-center gap-2 text-lg font-bold mb-4" style={{ color: '#FFF' }}>
          <Star className="w-5 h-5" style={{ color: '#FFD700' }} />
          Top Performers
        </h3>
        <div className="grid sm:grid-cols-2 gap-3">
          {result.topPerformers.map((performer, i) => (
            <PerformerCard key={performer.player} performer={performer} isTop={i === 0} />
          ))}
        </div>
      </div>

      {/* GAME SUMMARY */}
      {result.summary && (
        <div className="rounded-2xl p-5" style={{ background: '#0c0c14', border: '1px solid rgba(255,255,255,0.06)' }}>
          <h3 className="flex items-center gap-2 text-lg font-bold mb-3" style={{ color: '#FFF' }}>
            <Zap className="w-5 h-5" style={{ color: '#FF6B00' }} />
            Game Wrap-Up
          </h3>
          <p className="text-sm leading-relaxed" style={{ color: '#A0A0B0' }}>
            {result.summary}
          </p>
        </div>
      )}
    </div>
  )
}

export default BoxScore
