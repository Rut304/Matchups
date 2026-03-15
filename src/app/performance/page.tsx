// =============================================================================
// PERFORMANCE DASHBOARD - System Status & Methodology
// Shows real system stats and how The Edge works
// =============================================================================

import Link from 'next/link'
import { 
  TrendingUp, 
  Target, 
  DollarSign, 
  BarChart3,
  ChevronRight,
  Brain,
  Activity,
  Crosshair,
  Zap,
  Database,
  Wifi,
  Clock,
} from 'lucide-react'

const SPORTS = [
  { key: 'NBA', icon: '🏀', color: '#FF6B00' },
  { key: 'NHL', icon: '🏒', color: '#00A8FF' },
  { key: 'MLB', icon: '⚾', color: '#00FF88' },
  { key: 'NCAAB', icon: '🏀', color: '#FFD700' },
]

async function getSystemStats() {
  const base = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const results: Record<string, { games: number; splits: number; sharpSignals: number }> = {}

  await Promise.all(
    SPORTS.map(async (s) => {
      const [gamesRes, splitsRes] = await Promise.all([
        fetch(`${base}/api/games?sport=${s.key.toLowerCase()}`, { next: { revalidate: 300 } }).catch(() => null),
        fetch(`${base}/api/betting-splits?sport=${s.key}`, { next: { revalidate: 300 } }).catch(() => null),
      ])
      const games = gamesRes?.ok ? await gamesRes.json().catch(() => []) : []
      const splits = splitsRes?.ok ? await splitsRes.json().catch(() => ({ splits: [] })) : { splits: [] }
      const splitArr = Array.isArray(splits) ? splits : (splits.splits || [])
      results[s.key] = {
        games: Array.isArray(games) ? games.length : 0,
        splits: splitArr.length,
        sharpSignals: splitArr.filter((sp: { sharpSignal?: boolean }) => sp.sharpSignal).length,
      }
    })
  )

  let edgeCount = 0
  try {
    const edgesRes = await fetch(`${base}/api/edges/today`, { next: { revalidate: 300 } })
    if (edgesRes.ok) {
      const edges = await edgesRes.json()
      edgeCount = Array.isArray(edges) ? edges.length : (edges.edges?.length || 0)
    }
  } catch {}

  return { sports: results, edgeCount }
}

export default async function PerformancePage() {
  const { sports, edgeCount } = await getSystemStats()
  
  const totalGames = Object.values(sports).reduce((s, v) => s + v.games, 0)
  const totalSplits = Object.values(sports).reduce((s, v) => s + v.splits, 0)
  const totalSharp = Object.values(sports).reduce((s, v) => s + v.sharpSignals, 0)

  return (
    <div className="min-h-screen bg-[#050508]">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#0a0a12] to-[#050508]">
        <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full opacity-20 blur-3xl pointer-events-none bg-gradient-to-r from-orange-500 to-transparent" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4 bg-green-500/10 border border-green-500/30">
              <Activity className="w-4 h-4 text-green-400" />
              <span className="text-green-400 font-bold text-sm">SYSTEM LIVE</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-black text-white mb-4">
              The Edge — System Status
            </h1>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto">
              Real-time data feeds powering today&apos;s analysis. Pick tracking &amp; historical performance coming soon.
            </p>
          </div>

          {/* Live System Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            <div className="rounded-xl p-4 text-center bg-zinc-900/80 border border-white/5">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Wifi className="w-3 h-3 text-green-400" />
                <span className="text-xs text-gray-500">GAMES TRACKED</span>
              </div>
              <div className="text-3xl font-black text-white">{totalGames}</div>
            </div>
            <div className="rounded-xl p-4 text-center bg-zinc-900/80 border border-orange-500/20">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Database className="w-3 h-3 text-orange-400" />
                <span className="text-xs text-gray-500">SPLITS ANALYZED</span>
              </div>
              <div className="text-3xl font-black text-orange-500">{totalSplits}</div>
            </div>
            <div className="rounded-xl p-4 text-center bg-zinc-900/80 border border-yellow-500/20">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Zap className="w-3 h-3 text-yellow-400" />
                <span className="text-xs text-gray-500">SHARP SIGNALS</span>
              </div>
              <div className="text-3xl font-black text-yellow-400">{totalSharp}</div>
            </div>
            <div className="rounded-xl p-4 text-center bg-zinc-900/80 border border-green-500/20">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Target className="w-3 h-3 text-green-400" />
                <span className="text-xs text-gray-500">EDGES TODAY</span>
              </div>
              <div className="text-3xl font-black text-green-400">{edgeCount}</div>
            </div>
          </div>

          {/* CLV Tracker CTA */}
          <div className="max-w-4xl mx-auto mt-6">
            <Link
              href="/performance/clv"
              className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-green-500/10 to-blue-500/10 border border-green-500/20 hover:border-green-500/40 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                  <Crosshair className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <div className="font-semibold text-white">CLV Tracker</div>
                  <div className="text-sm text-gray-400">Track your Closing Line Value — the #1 indicator of edge</div>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-green-400 group-hover:translate-x-1 transition-all" />
            </Link>
          </div>
        </div>
      </section>

      {/* Sport-by-Sport Data Feed */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center gap-2 mb-6">
          <Activity className="w-5 h-5 text-orange-500" />
          <h2 className="text-xl font-bold text-white">Data Feeds by Sport</h2>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {SPORTS.map(({ key, icon, color }) => {
            const data = sports[key] || { games: 0, splits: 0, sharpSignals: 0 }
            return (
              <Link
                key={key}
                href={`/${key.toLowerCase()}`}
                className="rounded-xl p-5 bg-zinc-900/80 border border-white/5 hover:border-orange-500/30 transition-all group"
              >
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-2xl">{icon}</span>
                  <span className="font-bold text-white text-lg">{key}</span>
                  <span className="ml-auto flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: data.games > 0 ? '#00FF88' : '#FF4455' }} />
                    <span className="text-xs" style={{ color: data.games > 0 ? '#00FF88' : '#FF4455' }}>
                      {data.games > 0 ? 'LIVE' : 'NO DATA'}
                    </span>
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">Games</span>
                    <span className="font-bold text-white">{data.games}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">Betting Splits</span>
                    <span className="font-bold" style={{ color }}>{data.splits}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">Sharp Signals</span>
                    <span className="font-bold text-yellow-400">{data.sharpSignals}</span>
                  </div>
                </div>

                {/* Mini bar showing splits coverage */}
                <div className="mt-4 h-1.5 rounded-full bg-white/5 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${data.games > 0 ? Math.min(100, (data.splits / data.games) * 100) : 0}%`,
                      background: color,
                    }}
                  />
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  {data.games > 0 ? `${Math.round((data.splits / data.games) * 100)}% splits coverage` : 'Waiting for games'}
                </div>
              </Link>
            )
          })}
        </div>
      </section>

      {/* Pick Tracking Coming Soon */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="rounded-xl p-8 text-center bg-zinc-900/50 border border-dashed border-white/10">
          <Clock className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">Pick Tracking Coming Soon</h3>
          <p className="text-gray-400 max-w-lg mx-auto mb-6">
            Every edge we surface will be tracked with full transparency — win rate, ROI, units, CLV.
            No fake numbers. We earn credibility by showing real results over time.
          </p>
          <div className="grid grid-cols-3 gap-4 max-w-md mx-auto">
            <div className="p-3 rounded-lg bg-white/[0.03]">
              <div className="text-xs text-gray-500">Win Rate</div>
              <div className="font-bold text-gray-600">—</div>
            </div>
            <div className="p-3 rounded-lg bg-white/[0.03]">
              <div className="text-xs text-gray-500">ROI</div>
              <div className="font-bold text-gray-600">—</div>
            </div>
            <div className="p-3 rounded-lg bg-white/[0.03]">
              <div className="text-xs text-gray-500">Units</div>
              <div className="font-bold text-gray-600">—</div>
            </div>
          </div>
        </div>
      </section>

      {/* Methodology Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="rounded-xl p-6 bg-gradient-to-r from-orange-500/10 to-blue-500/10 border border-orange-500/20">
          <div className="flex items-center gap-3 mb-4">
            <Brain className="w-6 h-6 text-orange-500" />
            <h2 className="text-xl font-bold text-white">How We Calculate The Edge</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-green-400" />
                <span className="font-semibold text-white">Trend Alignment (40%)</span>
              </div>
              <p className="text-sm text-gray-400">
                How many historical trends match the current game situation. More aligned trends = higher edge.
              </p>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-4 h-4 text-yellow-400" />
                <span className="font-semibold text-white">Sharp Money (30%)</span>
              </div>
              <p className="text-sm text-gray-400">
                Where professional bettors are placing their money, especially reverse line movement indicators.
              </p>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 className="w-4 h-4 text-blue-400" />
                <span className="font-semibold text-white">Value Indicator (30%)</span>
              </div>
              <p className="text-sm text-gray-400">
                Mathematical edge based on closing line value, implied probability gaps, and market efficiency.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pb-24">
        <div className="text-center">
          <h3 className="text-2xl font-bold text-white mb-4">Ready to Find Today&apos;s Edges?</h3>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-lg transition-all hover:scale-105 bg-gradient-to-r from-orange-500 to-pink-500 text-white shadow-[0_0_30px_rgba(255,107,0,0.4)]"
          >
            <Target className="w-5 h-5" />
            View Today&apos;s Top Edges
            <ChevronRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  )
}
