import Link from 'next/link'
import Image from 'next/image'
import { 
  TrendingUp, 
  Clock,
  BarChart3,
  Flame,
  Target,
  Trophy,
  ChevronRight,
  AlertCircle,
  Zap
} from 'lucide-react'
import { EdgeDashboardWithFiltersWrapper } from '@/components/edge'
import { TopMatchups } from '@/components/home/TopMatchups'
import { TrendFinderSearch } from '@/components/home/TrendFinderSearch'
import { HomeLeaderboard } from '@/components/home/HomeLeaderboard'
import { HomeTrends } from '@/components/home/HomeTrends'
import { HomeInjuries } from '@/components/home/HomeInjuries'
import { HomeStandings } from '@/components/home/HomeStandings'
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
      {/* MARKET PULSE TICKER - The "Terminal" Feel */}
      <div className="bg-[#0a0a12] border-b border-white/5 overflow-hidden whitespace-nowrap py-2 flex items-center">
        <div className="px-4 flex items-center gap-2 text-xs font-bold text-orange-500 uppercase tracking-wider border-r border-white/10">
          <Zap className="w-3 h-3" /> Market Pulse
        </div>
        <div className="flex animate-marquee items-center gap-8 px-4">
          {steamAlerts.length > 0 ? steamAlerts.map((alert) => (
            <span key={alert.id} className="text-xs font-mono text-gray-300 flex items-center gap-2">
              <span className="text-red-400">STEAM:</span> {alert.teams} {alert.movement > 0 ? '+' : ''}{alert.movement}
            </span>
          )) : (
            <span className="text-xs font-mono text-slate-500 flex items-center gap-2">
              <span className="text-slate-600">—</span> Monitoring markets for sharp moves...
            </span>
          )}
        </div>
      </div>

      {/* SEARCH & NAV - Compact */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <h1 className="text-2xl font-black text-white tracking-tight">
            MATCHUPS <span className="text-orange-500">TERMINAL</span>
          </h1>
          <div className="w-full md:w-auto flex-1 max-w-xl">
            <TrendFinderSearch />
          </div>
          <div className="flex gap-2">
             <Link href="/sus" className="px-3 py-1.5 rounded bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold uppercase hover:bg-red-500/20">
               Sus Plays
             </Link>
             <Link href="/leaderboard" className="px-3 py-1.5 rounded bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-xs font-bold uppercase hover:bg-yellow-500/20">
               Expert Tracker
             </Link>
          </div>
        </div>
      </div>

      {/* ZONE 1: TOP EDGES (VALUE FIRST) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <div className="flex items-center gap-2 mb-4">
          <Target className="w-5 h-5 text-green-400" />
          <h2 className="text-lg font-bold text-white">Market Edges</h2>
        </div>
        <EdgeDashboardWithFiltersWrapper />
      </section>

      {/* ZONE 2: TOP MATCHUPS (POPULARITY SECOND) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-orange-500/10 border border-orange-500/20">
              <Flame className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Major Markets</h2>
              <p className="text-xs text-gray-500">High liquidity events • Super Bowl LX</p>
            </div>
          </div>
          <Link href="/scores" className="flex items-center gap-1 text-sm font-semibold text-orange-400 hover:text-orange-300">
            All Games <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Dynamic Top Matchups */}
          <div>
            <TopMatchups />
          </div>
          
          {/* Quick Stats Sidebar */}
          <div className="space-y-4">
            {/* Live Games Alert */}
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                <span className="text-sm font-bold text-red-400">🏆 SUPER BOWL WEEKEND</span>
              </div>
              <p className="text-xs text-gray-400">
                Super Bowl LX is Sunday! Plus NBA, NHL, and college hoops action all weekend. Click any game for full matchup analysis.
              </p>
            </div>
            
            {/* Super Bowl Countdown */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-yellow-500/20 to-orange-500/10 border border-yellow-500/30">
              <div className="flex items-center gap-2 mb-3">
                <Trophy className="w-5 h-5 text-yellow-400" />
                <span className="text-sm font-bold text-yellow-400">Super Bowl LX</span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">🏈 Super Bowl LX</span>
                  <span className="text-yellow-400 font-bold">Sun, Feb 8</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">📍 Allegiant Stadium</span>
                  <span className="text-white">Las Vegas</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">⏰ Kickoff</span>
                  <span className="text-white">6:30 PM ET</span>
                </div>
                <div className="mt-2 pt-2 border-t border-white/10">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">🏀 NBA All-Star</span>
                    <span className="text-white">Feb 16</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Sharp vs Public - LIVE DATA */}
            <SharpMoneySummary 
              sports={['NBA', 'NHL', 'NFL', 'NCAAB']} 
              limit={4}
              showHeader={true}
            />
          </div>
        </div>
      </section>

      {/* LEADERBOARD - THE VIRAL FEATURE - Now with real data */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <HomeLeaderboard />
      </section>

      {/* Three Column Layout: Trends, Standings, Injuries */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="grid lg:grid-cols-3 gap-6">
          
          {/* Hot Trends - Real data from API */}
          <HomeTrends />
          
          {/* League Standings - Real data from ESPN */}
          <HomeStandings />
          
          {/* Sidebar - Injuries & Quick Links */}
          <div className="space-y-4">
            {/* Key Injuries - Real data from ESPN */}
            <HomeInjuries />
            
            {/* Quick Links - Bettor Decision Tools */}
            <div className="rounded-2xl p-5 bg-[#0c0c14] border border-white/5">
              <h3 className="font-bold mb-4 text-white">Bettor Tools</h3>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: '🎯 Sharp Money', href: '/edge', desc: 'Follow pro action' },
                  { label: '🛒 Line Shop', href: '/lineshop', desc: 'Best odds' },
                  { label: '📈 Trends', href: '/trends', desc: 'Hot systems' },
                  { label: '🎲 Props', href: '/props/correlations', desc: 'Correlations' },
                  { label: '🏥 Injuries', href: '/injuries', desc: 'Impact reports' },
                  { label: '🧾 Experts', href: '/leaderboard', desc: 'Track records' },
                ].map((link) => (
                  <Link key={link.href} href={link.href}
                        className="p-2.5 rounded-lg text-left transition-all hover:scale-105 hover:bg-white/10 bg-white/[0.03] group">
                    <div className="text-sm font-semibold text-white">{link.label}</div>
                    <div className="text-[10px] text-gray-500 group-hover:text-gray-400">{link.desc}</div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
