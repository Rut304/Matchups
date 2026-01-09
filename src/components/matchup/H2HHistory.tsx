// =============================================================================
// HEAD-TO-HEAD HISTORY COMPONENT
// Shows historical matchup record between two teams
// =============================================================================

import { Trophy, TrendingUp, Calendar, Percent, Target, ChevronRight } from 'lucide-react'

export interface H2HGame {
  date: string
  homeTeam: string
  awayTeam: string
  homeScore: number
  awayScore: number
  spread: number
  covered: boolean
  total: number
  overUnder: 'over' | 'under' | 'push'
  winner: 'home' | 'away'
}

export interface H2HStats {
  team1: string
  team2: string
  team1Wins: number
  team2Wins: number
  team1AtsWins: number
  team2AtsWins: number
  overCount: number
  underCount: number
  pushCount: number
  avgTotal: number
  avgMargin: number
  recentGames: H2HGame[]
}

interface H2HHistoryProps {
  stats: H2HStats
  team1Logo?: string
  team2Logo?: string
}

// Result badge component
function ResultBadge({ result }: { result: 'win' | 'loss' | 'cover' | 'miss' | 'over' | 'under' | 'push' }) {
  const configs = {
    win: { bg: 'bg-green-400/20', text: 'text-green-400', label: 'W' },
    loss: { bg: 'bg-red-400/20', text: 'text-red-400', label: 'L' },
    cover: { bg: 'bg-green-400/20', text: 'text-green-400', label: 'COV' },
    miss: { bg: 'bg-red-400/20', text: 'text-red-400', label: 'MISS' },
    over: { bg: 'bg-orange-400/20', text: 'text-orange-400', label: 'O' },
    under: { bg: 'bg-blue-400/20', text: 'text-blue-400', label: 'U' },
    push: { bg: 'bg-gray-400/20', text: 'text-gray-400', label: 'P' }
  }
  
  const config = configs[result]
  return (
    <span className={`px-1.5 py-0.5 rounded text-xs font-bold ${config.bg} ${config.text}`}>
      {config.label}
    </span>
  )
}

export function H2HHistory({ stats, team1Logo, team2Logo }: H2HHistoryProps) {
  const totalGames = stats.team1Wins + stats.team2Wins
  const team1WinPct = totalGames > 0 ? ((stats.team1Wins / totalGames) * 100).toFixed(0) : '0'
  const team1AtsPct = totalGames > 0 ? ((stats.team1AtsWins / totalGames) * 100).toFixed(0) : '0'
  const totalOU = stats.overCount + stats.underCount + stats.pushCount
  const overPct = totalOU > 0 ? ((stats.overCount / totalOU) * 100).toFixed(0) : '0'
  
  return (
    <div className="rounded-xl p-4 bg-zinc-900/80 border border-white/5">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <Trophy className="w-5 h-5 text-yellow-400" />
        <h3 className="font-bold text-white">Head-to-Head History</h3>
        <span className="text-xs text-gray-500">Last {totalGames} meetings</span>
      </div>
      
      {/* Main Matchup Visual */}
      <div className="flex items-center justify-between mb-4 p-3 rounded-lg bg-white/[0.03]">
        <div className="text-center flex-1">
          <div className="text-2xl font-black text-white">{stats.team1}</div>
          <div className="text-3xl font-black text-green-400 mt-1">{stats.team1Wins}</div>
          <div className="text-xs text-gray-500">WINS</div>
        </div>
        <div className="px-4 text-2xl font-black text-gray-600">vs</div>
        <div className="text-center flex-1">
          <div className="text-2xl font-black text-white">{stats.team2}</div>
          <div className="text-3xl font-black text-green-400 mt-1">{stats.team2Wins}</div>
          <div className="text-xs text-gray-500">WINS</div>
        </div>
      </div>
      
      {/* Quick Stats Row */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="rounded-lg p-2 text-center bg-white/[0.03]">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Percent className="w-3 h-3 text-gray-500" />
            <span className="text-xs text-gray-500">{stats.team1} Win %</span>
          </div>
          <div className="text-lg font-bold text-white">{team1WinPct}%</div>
        </div>
        <div className="rounded-lg p-2 text-center bg-white/[0.03]">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Target className="w-3 h-3 text-gray-500" />
            <span className="text-xs text-gray-500">{stats.team1} ATS</span>
          </div>
          <div className="text-lg font-bold text-white">{team1AtsPct}%</div>
        </div>
        <div className="rounded-lg p-2 text-center bg-white/[0.03]">
          <div className="flex items-center justify-center gap-1 mb-1">
            <TrendingUp className="w-3 h-3 text-gray-500" />
            <span className="text-xs text-gray-500">Over %</span>
          </div>
          <div className="text-lg font-bold text-white">{overPct}%</div>
        </div>
      </div>
      
      {/* Summary Stats */}
      <div className="p-3 rounded-lg mb-4 bg-orange-500/10 border border-orange-500/20">
        <div className="text-xs font-medium text-orange-400 mb-1">KEY INSIGHT</div>
        <p className="text-sm text-gray-300">
          Avg Total: <span className="font-bold text-white">{stats.avgTotal.toFixed(1)}</span> | 
          Avg Margin: <span className="font-bold text-white">{stats.avgMargin > 0 ? '+' : ''}{stats.avgMargin.toFixed(1)}</span> ({stats.team1})
        </p>
      </div>
      
      {/* Recent Games Table */}
      <div className="text-xs font-semibold text-gray-500 mb-2 flex items-center gap-1">
        <Calendar className="w-3 h-3" />
        Recent Meetings
      </div>
      <div className="space-y-2 max-h-48 overflow-y-auto">
        {stats.recentGames.map((game, i) => (
          <div 
            key={i} 
            className="flex items-center justify-between p-2 rounded-lg bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
          >
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-600 w-20">
                {new Date(game.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })}
              </span>
              <div className="flex items-center gap-1">
                <span className={`font-semibold ${game.winner === 'away' ? 'text-white' : 'text-gray-500'}`}>
                  {game.awayTeam}
                </span>
                <span className="text-gray-600">@</span>
                <span className={`font-semibold ${game.winner === 'home' ? 'text-white' : 'text-gray-500'}`}>
                  {game.homeTeam}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm text-gray-300">
                {game.awayScore}-{game.homeScore}
              </span>
              <ResultBadge result={game.covered ? 'cover' : 'miss'} />
              <ResultBadge result={game.overUnder} />
            </div>
          </div>
        ))}
      </div>
      
      {/* View More Link */}
      <div className="mt-3 pt-3 border-t border-white/5">
        <button className="w-full flex items-center justify-center gap-1 text-xs font-medium text-orange-500 hover:text-orange-400 transition-colors">
          View Full History <ChevronRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  )
}

// Compact version for sidebar
export function H2HCompact({ stats }: { stats: H2HStats }) {
  return (
    <div className="rounded-lg p-3 bg-white/[0.02]">
      <div className="flex items-center gap-2 mb-2">
        <Trophy className="w-4 h-4 text-yellow-400" />
        <span className="text-sm font-semibold text-white">H2H: {stats.team1} vs {stats.team2}</span>
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-400">
          Record: <span className="text-white font-bold">{stats.team1Wins}-{stats.team2Wins}</span>
        </span>
        <span className="text-gray-400">
          ATS: <span className="text-white font-bold">{stats.team1AtsWins}-{stats.team2AtsWins}</span>
        </span>
      </div>
    </div>
  )
}

export default H2HHistory
