import Link from 'next/link'
import { 
  TrendingUp, 
  Flame,
  Target,
  Trophy,
  ChevronRight,
  Zap,
  Sparkles,
  Calculator,
  ShoppingBag,
  Activity,
  AlertTriangle
} from 'lucide-react'
import { EdgeDashboardWithFiltersWrapper } from '@/components/edge'
import { TopMatchups } from '@/components/home/TopMatchups'
import { TrendFinderSearch } from '@/components/home/TrendFinderSearch'
import { HomeLeaderboard } from '@/components/home/HomeLeaderboard'
import { HomeTrends } from '@/components/home/HomeTrends'
import { HomeInjuries } from '@/components/home/HomeInjuries'
import { DataSourceLabel } from '@/components/ui/DataSourceLabel'
import { SharpMoneySummary } from '@/components/betting'
import { getSteamMoveAlerts } from '@/lib/services/real-analytics'

// Force dynamic rendering - homepage needs live data from APIs
export const dynamic = 'force-dynamic'
export const revalidate = 60 // Revalidate every minute for fresh data

export default async function Home() {
  // Fetch steam alerts for the ticker
  const steamAlerts = await getSteamMoveAlerts().catch(() => [])

  return (
    <div className="min-h-screen bg-[#050508]">
      {/* MARKET PULSE TICKER */}
      <div className="bg-[#0a0a12] border-b border-white/5 overflow-hidden whitespace-nowrap py-2 flex items-center">
        <div className="px-4 flex items-center gap-2 text-xs font-bold text-orange-500 uppercase tracking-wider border-r border-white/10">
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

      {/* HERO SECTION - Trend Finder is THE STAR */}
      <section className="relative overflow-hidden">
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-b from-orange-500/5 via-transparent to-transparent pointer-events-none" />
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center relative">
          {/* Brand */}
          <div className="mb-6">
            <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-2">
              <span className="text-orange-500">MATCHUPS</span>
            </h1>
            <p className="text-lg text-gray-400 font-medium">Sports Gambler Intelligence</p>
          </div>
          
          {/* Trend Finder - THE HERO */}
          <div className="mb-8">
            <TrendFinderSearch />
          </div>
          
          {/* Quick Action Buttons */}
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/leaderboard" className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-sm font-semibold hover:bg-yellow-500/20 transition-colors">
              <Trophy className="w-4 h-4" /> Expert Tracker
            </Link>
            <Link href="/sus" className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-semibold hover:bg-red-500/20 transition-colors">
              <AlertTriangle className="w-4 h-4" /> Sus Plays
            </Link>
            <Link href="/calculators" className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-sm font-semibold hover:bg-blue-500/20 transition-colors">
              <Calculator className="w-4 h-4" /> Calculators
            </Link>
            <Link href="/lineshop" className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/30 text-green-400 text-sm font-semibold hover:bg-green-500/20 transition-colors">
              <ShoppingBag className="w-4 h-4" /> Line Shop
            </Link>
          </div>
        </div>
      </section>

      {/* TOP EDGES - Primary Value */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/10 border border-green-500/20 flex items-center justify-center">
              <Target className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Today's Edges</h2>
              <p className="text-xs text-gray-500">Sharp money signals & value plays</p>
            </div>
          </div>
          <DataSourceLabel source="Action Network" />
        </div>
        <EdgeDashboardWithFiltersWrapper />
      </section>

      {/* TWO COLUMN: Matchups + Sharp Money */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 border-t border-white/5">
        <div className="grid lg:grid-cols-5 gap-6">
          {/* Matchups - 3 columns */}
          <div className="lg:col-span-3">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500/20 to-red-500/10 border border-orange-500/20 flex items-center justify-center">
                  <Flame className="w-5 h-5 text-orange-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Top Matchups</h2>
                  <p className="text-xs text-gray-500">High-action games today</p>
                </div>
              </div>
              <Link href="/scores" className="flex items-center gap-1 text-sm font-semibold text-orange-400 hover:text-orange-300">
                All Scores <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <TopMatchups />
          </div>
          
          {/* Sharp Money - 2 columns */}
          <div className="lg:col-span-2 space-y-4">
            <SharpMoneySummary 
              sports={['NBA', 'NHL', 'NFL', 'NCAAB']} 
              limit={5}
              showHeader={true}
            />
            
            {/* Live indicator */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-red-500/10 to-orange-500/5 border border-red-500/20">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                <span className="text-sm font-bold text-white">Live Action</span>
              </div>
              <p className="text-xs text-gray-400 mb-3">
                NBA, NHL, and college basketball in full swing.
              </p>
              <Link href="/live" className="inline-flex items-center gap-1 text-xs font-semibold text-red-400 hover:text-red-300">
                <Activity className="w-3 h-3" /> View Live Games <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* LEADERBOARD */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 border-t border-white/5">
        <HomeLeaderboard />
      </section>

      {/* BOTTOM: Trends + Injuries */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 border-t border-white/5 pt-8">
        <div className="grid lg:grid-cols-2 gap-6">
          <HomeTrends />
          <HomeInjuries />
        </div>
      </section>
    </div>
  )
}
