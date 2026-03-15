import Link from 'next/link'
import { 
  TrendingUp, 
  Target,
  Trophy,
  ChevronRight,
  Zap,
  Calculator,
  ShoppingBag,
  AlertTriangle,
  BarChart3,
  Search
} from 'lucide-react'
import { EdgeDashboardWithFiltersWrapper } from '@/components/edge'
import { SplitsHeatMap } from '@/components/home/SplitsHeatMap'
import { TodaysBoard } from '@/components/home/TodaysBoard'
import { FeaturedEdge, NoEdgeState } from '@/components/home/FeaturedEdge'
import { TrendFinderSearch } from '@/components/home/TrendFinderSearch'
import { getSteamMoveAlerts } from '@/lib/services/real-analytics'

// Force dynamic rendering - homepage needs live data from APIs
export const dynamic = 'force-dynamic'
export const revalidate = 60

// Fetch top edge server-side
async function getTopEdge() {
  const isBuildTime = process.env.NEXT_PHASE === 'phase-production-build'
  if (isBuildTime) return null
  try {
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    const res = await fetch(`${baseUrl}/api/edges/today?limit=1&minScore=70`, {
      next: { revalidate: 60 },
      signal: AbortSignal.timeout(10000),
      cache: 'no-store'
    })
    if (!res.ok) return null
    const ct = res.headers.get('content-type')
    if (!ct?.includes('application/json')) return null
    const data = await res.json()
    return data.edges?.[0] || null
  } catch {
    return null
  }
}

export default async function Home() {
  const [steamAlerts, topEdge] = await Promise.all([
    getSteamMoveAlerts().catch(() => []),
    getTopEdge(),
  ])

  return (
    <div className="min-h-screen bg-[#050508]">
      {/* STEAM TICKER — stays, it's useful real-time data */}
      <div className="bg-[#0a0a12] border-b border-white/5 overflow-hidden whitespace-nowrap py-2 flex items-center">
        <div className="px-4 flex items-center gap-2 text-xs font-bold text-orange-500 uppercase tracking-wider border-r border-white/10 shrink-0">
          <Zap className="w-3 h-3" /> Live
        </div>
        <div className="flex animate-marquee items-center gap-8 px-4">
          {steamAlerts.length > 0 ? steamAlerts.map((alert) => (
            <span key={alert.id} className="text-xs font-mono text-gray-300 flex items-center gap-2">
              <span className="text-red-400">STEAM:</span> {alert.teams} {alert.movement > 0 ? '+' : ''}{alert.movement}
            </span>
          )) : (
            <span className="text-xs font-mono text-slate-500">Monitoring markets for sharp moves...</span>
          )}
        </div>
      </div>

      {/* COMPACT HERO — brand + quick nav + search */}
      <section className="relative overflow-hidden border-b border-white/5">
        <div className="absolute inset-0 bg-gradient-to-b from-green-500/[0.03] via-transparent to-transparent pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 relative">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Brand */}
            <div className="text-center sm:text-left">
              <h1 className="text-3xl font-black text-white tracking-tight">
                <span className="text-green-400">MATCHUPS</span>
              </h1>
              <p className="text-sm text-slate-500">Where the smart money is going</p>
            </div>

            {/* Quick nav pills */}
            <div className="flex flex-wrap justify-center gap-2">
              <Link href="/sus" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold hover:bg-red-500/20 transition-colors">
                <AlertTriangle className="w-3 h-3" /> Sus Plays
              </Link>
              <Link href="/leaderboard" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold hover:bg-amber-500/20 transition-colors">
                <Trophy className="w-3 h-3" /> Experts
              </Link>
              <Link href="/calculators" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold hover:bg-blue-500/20 transition-colors">
                <Calculator className="w-3 h-3" /> Tools
              </Link>
              <Link href="/lineshop" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold hover:bg-emerald-500/20 transition-colors">
                <ShoppingBag className="w-3 h-3" /> Line Shop
              </Link>
            </div>
          </div>

          {/* Search bar */}
          <div className="mt-4 max-w-2xl mx-auto sm:mx-0">
            <TrendFinderSearch />
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* THE EDGE — Featured pick (only shows at 70+ confidence)   */}
      {/* ========================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-2">
        {topEdge ? <FeaturedEdge edge={topEdge} /> : <NoEdgeState />}
      </section>

      {/* ========================================================= */}
      {/* BETTING SPLITS HEAT MAP — THE MAIN EVENT                  */}
      {/* Public vs Sharp money for every game, sorted by divergence */}
      {/* ========================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <SplitsHeatMap sports={['NBA', 'NHL', 'MLB', 'NCAAB']} />
      </section>

      {/* ========================================================= */}
      {/* ALL EDGES — Grid of edge picks                            */}
      {/* ========================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8 border-t border-white/5 pt-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/10 border border-green-500/20 flex items-center justify-center">
              <Target className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Today's Edges</h2>
              <p className="text-xs text-slate-500">All plays with an edge score above 55</p>
            </div>
          </div>
          <Link href="/markets/edge" className="flex items-center gap-1 text-xs font-bold text-green-400 hover:text-green-300">
            View All <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <EdgeDashboardWithFiltersWrapper />
      </section>

      {/* ========================================================= */}
      {/* TODAY'S SCOREBOARD — Quick glance at all games             */}
      {/* ========================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8 border-t border-white/5 pt-8">
        <TodaysBoard />
      </section>

      {/* ========================================================= */}
      {/* SPORT QUICK LINKS — Easy navigation to sport-specific     */}
      {/* ========================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 border-t border-white/5 pt-8">
        <h2 className="text-lg font-bold text-white mb-4">Dive Into a Sport</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { sport: 'NBA', icon: '🏀', color: 'from-blue-500/20 to-blue-500/5', border: 'border-blue-500/20', text: 'text-blue-400', href: '/nba' },
            { sport: 'NHL', icon: '🏒', color: 'from-cyan-500/20 to-cyan-500/5', border: 'border-cyan-500/20', text: 'text-cyan-400', href: '/nhl' },
            { sport: 'MLB', icon: '⚾', color: 'from-emerald-500/20 to-emerald-500/5', border: 'border-emerald-500/20', text: 'text-emerald-400', href: '/mlb' },
            { sport: 'NCAAB', icon: '🏀', color: 'from-amber-500/20 to-amber-500/5', border: 'border-amber-500/20', text: 'text-amber-400', href: '/ncaab' },
            { sport: 'NFL', icon: '🏈', color: 'from-orange-500/20 to-orange-500/5', border: 'border-orange-500/20', text: 'text-orange-400', href: '/nfl' },
            { sport: 'NCAAF', icon: '🏈', color: 'from-red-500/20 to-red-500/5', border: 'border-red-500/20', text: 'text-red-400', href: '/ncaaf' },
          ].map(s => (
            <Link key={s.sport} href={s.href}>
              <div className={`rounded-xl p-4 text-center bg-gradient-to-br ${s.color} border ${s.border} hover:scale-[1.03] transition-all cursor-pointer`}>
                <span className="text-2xl block mb-1">{s.icon}</span>
                <span className={`text-sm font-bold ${s.text}`}>{s.sport}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
