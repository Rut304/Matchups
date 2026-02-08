// =============================================================================
// PERFORMANCE DASHBOARD - 20-Year Track Record Visualization
// Shows historical performance metrics for The Edge system
// =============================================================================

import Link from 'next/link'
import { 
  TrendingUp, 
  Target, 
  DollarSign, 
  Calendar,
  BarChart3,
  Percent,
  ChevronRight,
  Award,
  ArrowUpRight,
  ArrowDownRight,
  Brain,
  Flame,
  Shield,
  Crosshair
} from 'lucide-react'

// Simulated historical performance data (in production, this comes from Supabase)
const yearlyPerformance = [
  { year: 2024, picks: 2847, wins: 1678, losses: 1169, pushes: 0, winPct: 58.9, roi: 9.8, units: 284.7 },
  { year: 2023, picks: 2912, wins: 1699, losses: 1213, pushes: 0, winPct: 58.3, roi: 8.7, units: 253.3 },
  { year: 2022, picks: 2756, wins: 1598, losses: 1158, pushes: 0, winPct: 58.0, roi: 8.2, units: 226.0 },
  { year: 2021, picks: 2634, wins: 1543, losses: 1091, pushes: 0, winPct: 58.6, roi: 9.1, units: 239.7 },
  { year: 2020, picks: 1987, wins: 1173, losses: 814, pushes: 0, winPct: 59.0, roi: 10.1, units: 200.7 },
  { year: 2019, picks: 2789, wins: 1622, losses: 1167, pushes: 0, winPct: 58.2, roi: 8.4, units: 234.3 },
  { year: 2018, picks: 2654, wins: 1542, losses: 1112, pushes: 0, winPct: 58.1, roi: 8.3, units: 220.3 },
  { year: 2017, picks: 2543, wins: 1486, losses: 1057, pushes: 0, winPct: 58.4, roi: 8.9, units: 226.3 },
  { year: 2016, picks: 2398, wins: 1391, losses: 1007, pushes: 0, winPct: 58.0, roi: 8.2, units: 196.6 },
  { year: 2015, picks: 2287, wins: 1326, losses: 961, pushes: 0, winPct: 58.0, roi: 8.1, units: 185.2 },
  { year: 2014, picks: 2156, wins: 1258, losses: 898, pushes: 0, winPct: 58.3, roi: 8.7, units: 187.6 },
  { year: 2013, picks: 2043, wins: 1192, losses: 851, pushes: 0, winPct: 58.3, roi: 8.8, units: 179.8 },
  { year: 2012, picks: 1987, wins: 1152, losses: 835, pushes: 0, winPct: 58.0, roi: 8.2, units: 163.0 },
  { year: 2011, picks: 1876, wins: 1097, losses: 779, pushes: 0, winPct: 58.5, roi: 9.0, units: 168.8 },
  { year: 2010, picks: 1765, wins: 1024, losses: 741, pushes: 0, winPct: 58.0, roi: 8.2, units: 144.7 },
  { year: 2009, picks: 1654, wins: 964, losses: 690, pushes: 0, winPct: 58.3, roi: 8.7, units: 143.9 },
  { year: 2008, picks: 1543, wins: 897, losses: 646, pushes: 0, winPct: 58.1, roi: 8.4, units: 129.6 },
  { year: 2007, picks: 1432, wins: 838, losses: 594, pushes: 0, winPct: 58.5, roi: 9.0, units: 128.9 },
  { year: 2006, picks: 1321, wins: 767, losses: 554, pushes: 0, winPct: 58.1, roi: 8.4, units: 110.9 },
]

const sportBreakdown = [
  { sport: 'NFL', icon: '🏈', picks: 12543, winPct: 59.2, roi: 10.2, bestTrend: 'Home Dogs +3 or less', trendWinPct: 67.4 },
  { sport: 'NBA', icon: '🏀', picks: 14876, winPct: 57.8, roi: 7.8, bestTrend: 'B2B Road Dogs', trendWinPct: 62.1 },
  { sport: 'NHL', icon: '🏒', picks: 8234, winPct: 58.5, roi: 9.1, bestTrend: 'Division Rivals Under', trendWinPct: 61.8 },
  { sport: 'MLB', icon: '⚾', picks: 5199, winPct: 57.4, roi: 7.2, bestTrend: 'Day Game Overs', trendWinPct: 58.9 },
]

const pickTypeBreakdown = [
  { type: 'Spread', picks: 18234, winPct: 58.6, roi: 8.9, color: '#FF6B00' },
  { type: 'Totals', picks: 12543, winPct: 57.8, roi: 7.8, color: '#00A8FF' },
  { type: 'Moneyline', picks: 6789, winPct: 59.4, roi: 11.2, color: '#00FF88' },
  { type: 'Props', picks: 3286, winPct: 56.9, roi: 6.8, color: '#FFD700' },
]

export default function PerformancePage() {
  // Calculate totals
  const totals = yearlyPerformance.reduce((acc, year) => ({
    picks: acc.picks + year.picks,
    wins: acc.wins + year.wins,
    losses: acc.losses + year.losses,
    units: acc.units + year.units
  }), { picks: 0, wins: 0, losses: 0, units: 0 })
  
  const overallWinPct = ((totals.wins / totals.picks) * 100).toFixed(1)
  const overallRoi = ((totals.units / totals.picks) * 100).toFixed(1)
  
  return (
    <div className="min-h-screen bg-[#050508]">
      {/* DEMO DATA WARNING BANNER */}
      <div className="bg-yellow-500/20 border-b border-yellow-500/40 py-3 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-center gap-3">
          <span className="text-2xl">⚠️</span>
          <p className="text-yellow-400 font-bold text-center">
            DEMO DATA - This page displays simulated performance data for demonstration purposes only. 
            Real tracking begins when you start making picks.
          </p>
          <span className="text-2xl">⚠️</span>
        </div>
      </div>

      {/* Hero Header */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#0a0a12] to-[#050508]">
        <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full opacity-20 blur-3xl pointer-events-none bg-gradient-to-r from-orange-500 to-transparent" />
        <div className="absolute top-20 right-1/4 w-80 h-80 rounded-full opacity-15 blur-3xl pointer-events-none bg-gradient-to-r from-green-500 to-transparent" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4 bg-yellow-500/10 border border-yellow-500/30">
              <Shield className="w-4 h-4 text-yellow-400" />
              <span className="text-yellow-400 font-bold text-sm">DEMO MODE</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-black text-white mb-4">
              20-Year Performance
            </h1>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto">
              This page shows what performance tracking will look like when The Edge has real historical data.
              Numbers shown are simulated for demonstration purposes.
            </p>
          </div>
          
          {/* Lifetime Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            <div className="rounded-xl p-4 text-center bg-zinc-900/80 border border-white/5">
              <div className="text-xs text-gray-500 mb-1">TOTAL PICKS</div>
              <div className="text-3xl font-black text-white">{totals.picks.toLocaleString()}</div>
            </div>
            <div className="rounded-xl p-4 text-center bg-zinc-900/80 border border-green-500/20">
              <div className="text-xs text-gray-500 mb-1">WIN RATE</div>
              <div className="text-3xl font-black text-green-400">{overallWinPct}%</div>
            </div>
            <div className="rounded-xl p-4 text-center bg-zinc-900/80 border border-orange-500/20">
              <div className="text-xs text-gray-500 mb-1">ROI</div>
              <div className="text-3xl font-black text-orange-500">+{overallRoi}%</div>
            </div>
            <div className="rounded-xl p-4 text-center bg-zinc-900/80 border border-yellow-500/20">
              <div className="text-xs text-gray-500 mb-1">TOTAL UNITS</div>
              <div className="text-3xl font-black text-yellow-400">+{totals.units.toFixed(0)}</div>
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
                  <div className="text-sm text-gray-400">Track your Closing Line Value - the #1 indicator of edge</div>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-green-400 group-hover:translate-x-1 transition-all" />
            </Link>
          </div>
        </div>
      </section>
      
      {/* Year by Year Performance */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center gap-2 mb-6">
          <Calendar className="w-5 h-5 text-orange-500" />
          <h2 className="text-xl font-bold text-white">Year-by-Year Results</h2>
        </div>
        
        <div className="rounded-xl overflow-hidden border border-white/5">
          <table className="w-full">
            <thead className="bg-zinc-900/80">
              <tr>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500">YEAR</th>
                <th className="text-center py-3 px-4 text-xs font-semibold text-gray-500">PICKS</th>
                <th className="text-center py-3 px-4 text-xs font-semibold text-gray-500">RECORD</th>
                <th className="text-center py-3 px-4 text-xs font-semibold text-gray-500">WIN %</th>
                <th className="text-center py-3 px-4 text-xs font-semibold text-gray-500">ROI</th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500">UNITS</th>
              </tr>
            </thead>
            <tbody>
              {yearlyPerformance.map((year, i) => (
                <tr 
                  key={year.year} 
                  className={`border-t border-white/5 hover:bg-white/[0.02] transition-colors ${i === 0 ? 'bg-orange-500/5' : ''}`}
                >
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white">{year.year}</span>
                      {i === 0 && (
                        <span className="px-1.5 py-0.5 rounded text-xs font-bold bg-orange-500/20 text-orange-400">
                          CURRENT
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center text-gray-400">{year.picks.toLocaleString()}</td>
                  <td className="py-3 px-4 text-center font-mono text-gray-300">
                    {year.wins}-{year.losses}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className={`font-bold ${year.winPct >= 58 ? 'text-green-400' : 'text-gray-400'}`}>
                      {year.winPct}%
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="flex items-center justify-center gap-1 text-green-400 font-bold">
                      <ArrowUpRight className="w-3 h-3" />
                      {year.roi}%
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-yellow-400">
                    +{year.units.toFixed(1)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-zinc-900/80 border-t border-white/10">
              <tr>
                <td className="py-4 px-4 font-bold text-white">TOTALS</td>
                <td className="py-4 px-4 text-center font-bold text-white">{totals.picks.toLocaleString()}</td>
                <td className="py-4 px-4 text-center font-mono font-bold text-white">
                  {totals.wins}-{totals.losses}
                </td>
                <td className="py-4 px-4 text-center font-bold text-green-400">{overallWinPct}%</td>
                <td className="py-4 px-4 text-center font-bold text-green-400">+{overallRoi}%</td>
                <td className="py-4 px-4 text-right font-bold text-yellow-400">+{totals.units.toFixed(0)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </section>
      
      {/* Sport Breakdown */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center gap-2 mb-6">
          <Flame className="w-5 h-5 text-orange-500" />
          <h2 className="text-xl font-bold text-white">Performance by Sport</h2>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {sportBreakdown.map((sport) => (
            <div 
              key={sport.sport}
              className="rounded-xl p-4 bg-zinc-900/80 border border-white/5 hover:border-orange-500/30 transition-all"
            >
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">{sport.icon}</span>
                <span className="font-bold text-white">{sport.sport}</span>
              </div>
              
              <div className="grid grid-cols-3 gap-2 mb-3">
                <div>
                  <div className="text-xs text-gray-500">Picks</div>
                  <div className="font-bold text-white">{sport.picks.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Win %</div>
                  <div className="font-bold text-green-400">{sport.winPct}%</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">ROI</div>
                  <div className="font-bold text-orange-500">+{sport.roi}%</div>
                </div>
              </div>
              
              <div className="p-2 rounded-lg bg-white/[0.03]">
                <div className="text-xs text-gray-500 mb-1">Best Trend</div>
                <div className="text-sm text-white font-medium">{sport.bestTrend}</div>
                <div className="text-xs text-green-400 mt-1">{sport.trendWinPct}% win rate</div>
              </div>
            </div>
          ))}
        </div>
      </section>
      
      {/* Pick Type Breakdown */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center gap-2 mb-6">
          <Target className="w-5 h-5 text-orange-500" />
          <h2 className="text-xl font-bold text-white">Performance by Pick Type</h2>
        </div>
        
        <div className="grid md:grid-cols-4 gap-4">
          {pickTypeBreakdown.map((type) => (
            <div 
              key={type.type}
              className="rounded-xl p-4 bg-zinc-900/80"
              style={{ border: `1px solid ${type.color}30` }}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="font-bold text-white">{type.type}</span>
                <span 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: type.color }}
                />
              </div>
              
              <div className="text-3xl font-black mb-2" style={{ color: type.color }}>
                {type.winPct}%
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">{type.picks.toLocaleString()} picks</span>
                <span className="text-green-400">+{type.roi}% ROI</span>
              </div>
            </div>
          ))}
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
