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
  AlertCircle
} from 'lucide-react'
import { EdgeDashboardWithFiltersWrapper } from '@/components/edge'
import { TopMatchups } from '@/components/home/TopMatchups'
import { TrendFinderSearch } from '@/components/home/TrendFinderSearch'
import { HomeLeaderboard } from '@/components/home/HomeLeaderboard'
import { HomeTrends } from '@/components/home/HomeTrends'
import { HomeInjuries } from '@/components/home/HomeInjuries'
import { HomeStandings } from '@/components/home/HomeStandings'
import { SharpMoneySummary } from '@/components/betting'

// Force dynamic rendering - homepage needs live data from APIs
export const dynamic = 'force-dynamic'
export const revalidate = 60 // Revalidate every minute for fresh data

export default function Home() {
  return (
    <div className="min-h-screen bg-[#050508]">
      {/* Hero Section - Clearer Value Prop */}
      <section className="relative overflow-hidden" style={{ background: 'linear-gradient(180deg, #0a0a12 0%, #050508 100%)' }}>
        {/* Animated gradient orbs */}
        <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full opacity-20 blur-3xl pointer-events-none bg-gradient-to-r from-orange-500 to-transparent" />
        <div className="absolute top-20 right-1/4 w-80 h-80 rounded-full opacity-15 blur-3xl pointer-events-none bg-gradient-to-r from-blue-500 to-transparent" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 relative z-10">
          <div className="text-center max-w-4xl mx-auto">

            
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black mb-6 text-white tracking-tight leading-tight">
              Sports Betting{' '}
              <span className="bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(255,107,0,0.5)]">
                Intelligence
              </span>
            </h1>
            
            <p className="text-xl mb-8 text-gray-400 max-w-2xl mx-auto">
              Real-time odds, betting trends, expert picks, and market analysis. 
              Everything you need to make informed decisions — all in one place.
            </p>

            {/* What We Offer - Clear Value Props */}
            <div className="grid sm:grid-cols-3 gap-4 max-w-3xl mx-auto mb-10">
              <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                <BarChart3 className="w-6 h-6 text-blue-400 mx-auto mb-2" />
                <div className="font-bold text-white text-sm mb-1">Live Odds & Lines</div>
                <p className="text-xs text-gray-500">Compare lines across all major sportsbooks in real-time</p>
              </div>
              <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                <TrendingUp className="w-6 h-6 text-green-400 mx-auto mb-2" />
                <div className="font-bold text-white text-sm mb-1">Betting Trends</div>
                <p className="text-xs text-gray-500">ATS records, public betting %, and sharp money indicators</p>
              </div>
              <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                <Image src="/wrong-stamp.jpeg" alt="Wrong" width={32} height={24} className="mx-auto mb-2 -rotate-6" />
                <div className="font-bold text-white text-sm mb-1">Expert Tracker</div>
                <p className="text-xs text-gray-500">See how the "experts" actually perform — receipts included</p>
              </div>
            </div>
            
            {/* Primary CTAs - Much Clearer */}
            <div className="flex flex-wrap justify-center gap-4 mb-6">
              <Link href="/scores"
                    className="inline-flex items-center gap-3 px-8 py-4 rounded-xl font-bold text-lg transition-all hover:scale-105 bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-[0_0_30px_rgba(59,130,246,0.4)]">
                <Clock className="w-5 h-5" />
                Today&apos;s Scores & Odds
              </Link>
              <Link href="/leaderboard"
                    className="inline-flex items-center gap-3 px-8 py-4 rounded-xl font-bold text-lg transition-all hover:scale-105 bg-gradient-to-r from-yellow-500 to-orange-500 text-black shadow-[0_0_30px_rgba(255,215,0,0.4)]">
                <Image src="/wrong-stamp.jpeg" alt="Wrong" width={28} height={20} className="-rotate-6" />
                Expert Tracker 🧾
              </Link>
            </div>

            {/* Trend Finder - Interactive Search */}
            <TrendFinderSearch />
            
            {/* Pro Tip */}
            <p className="text-xs text-center text-gray-500 mb-4">
              💡 <span className="text-gray-400">Pro tip:</span> The books set lines to maximize their profit, not yours. 
              <Link href="/lineshop" className="underline hover:text-gray-300">Always shop for the best odds</Link>.
            </p>
            
            {/* Secondary CTAs - Unique features */}
            <div className="flex flex-wrap justify-center gap-3">
              <Link href="/sus"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-sm transition-all hover:scale-105 bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20">
                <AlertCircle className="w-4 h-4" />
                Sus Plays
                <span className="text-xs text-red-400/70 hidden sm:inline">— Who&apos;s his Mizuhara?</span>
              </Link>
              <Link href="/edge"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-sm transition-all hover:scale-105 bg-purple-500/10 border border-purple-500/30 text-purple-400 hover:bg-purple-500/20">
                <Target className="w-4 h-4" />
                Sharp Money
                <span className="text-xs text-purple-400/70 hidden sm:inline">— Follow the pros</span>
              </Link>
              <Link href="/markets"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-sm transition-all hover:scale-105 bg-blue-500/10 border border-blue-500/30 text-blue-400 hover:bg-blue-500/20">
                <BarChart3 className="w-4 h-4" />
                Prediction Markets
                <span className="text-xs text-blue-400/70 hidden sm:inline">— Polymarket + Kalshi</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* TOP MATCHUPS - DYNAMIC FROM API */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-orange-500/10 border border-orange-500/20">
              <Flame className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Top Matchups</h2>
              <p className="text-xs text-gray-500">Biggest games with live odds • Playoffs highlighted</p>
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

      {/* TODAY'S TOP EDGES - AI-Powered Analysis with Filters */}
      <EdgeDashboardWithFiltersWrapper />

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
