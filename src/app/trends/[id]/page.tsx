'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  MinusCircle,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Calendar,
  ExternalLink,
  Info,
  AlertCircle,
  BarChart3,
  Target,
  Clock,
  Shield
} from 'lucide-react'

// Trend data with backing results
const trendData: Record<string, {
  id: string
  sport: string
  icon: string
  trend: string
  record: string
  roi: string
  edge: string
  confidence: number
  type: string
  isHot: boolean
  description: string
  methodology: string[]
  keyFactors: string[]
  historicalContext: string
  sampleSize: number
  dateRange: string
  lastUpdated: string
  results: {
    date: string
    matchup: string
    pick: string
    line: string
    result: 'win' | 'loss' | 'push'
    score: string
    margin: string
  }[]
}> = {
  '1': {
    id: '1',
    sport: 'NFL',
    icon: '🏈',
    trend: 'Home underdogs 18-6 ATS this season',
    record: '18-6',
    roi: '+28.4%',
    edge: '+12.4%',
    confidence: 92,
    type: 'ats',
    isHot: true,
    description: 'NFL home underdogs have covered the spread at a 75% rate this season, significantly outperforming historical averages of 52.4%.',
    methodology: [
      'Tracked all NFL home underdogs of 3+ points',
      'Results include regular season games only (through Week 17)',
      'Line taken from market consensus at close',
      'Push counted as no-decision (excluded from record)'
    ],
    keyFactors: [
      'Home field advantage undervalued by market in 2025-26',
      'Public heavily betting road favorites, creating value',
      'Sharp money has been consistently on home dogs',
      'Weather games favor home teams'
    ],
    historicalContext: 'Historical home underdog ATS win rate is 52.4% (2015-2024). This season\'s 75% is a significant positive deviation that may regress.',
    sampleSize: 24,
    dateRange: 'Sep 5, 2025 - Jan 2, 2026',
    lastUpdated: 'Jan 4, 2026 8:00 AM ET',
    results: [
      { date: 'Jan 2', matchup: 'Bears vs Lions', pick: 'Bears +7', line: '+7', result: 'win', score: '24-28', margin: '+3' },
      { date: 'Dec 29', matchup: 'Giants vs Eagles', pick: 'Giants +6.5', line: '+6.5', result: 'win', score: '21-24', margin: '+3.5' },
      { date: 'Dec 28', matchup: 'Panthers vs Bucs', pick: 'Panthers +4', line: '+4', result: 'loss', score: '14-31', margin: '-13' },
      { date: 'Dec 22', matchup: 'Titans vs Colts', pick: 'Titans +3', line: '+3', result: 'win', score: '27-24', margin: '+6' },
      { date: 'Dec 21', matchup: 'Broncos vs Chargers', pick: 'Broncos +5.5', line: '+5.5', result: 'win', score: '31-28', margin: '+8.5' },
      { date: 'Dec 15', matchup: 'Raiders vs Chiefs', pick: 'Raiders +10', line: '+10', result: 'win', score: '17-24', margin: '+3' },
      { date: 'Dec 14', matchup: 'Jets vs Bills', pick: 'Jets +7.5', line: '+7.5', result: 'loss', score: '10-28', margin: '-10.5' },
      { date: 'Dec 8', matchup: 'Browns vs Steelers', pick: 'Browns +6', line: '+6', result: 'win', score: '20-21', margin: '+5' },
      { date: 'Dec 7', matchup: 'Cardinals vs Seahawks', pick: 'Cardinals +3.5', line: '+3.5', result: 'win', score: '24-21', margin: '+6.5' },
      { date: 'Nov 28', matchup: 'Bears vs Packers', pick: 'Bears +4', line: '+4', result: 'win', score: '17-20', margin: '+1' },
      { date: 'Nov 24', matchup: 'Jags vs Texans', pick: 'Jags +6.5', line: '+6.5', result: 'win', score: '21-24', margin: '+3.5' },
      { date: 'Nov 17', matchup: 'Saints vs Falcons', pick: 'Saints +3', line: '+3', result: 'win', score: '28-24', margin: '+7' },
      { date: 'Nov 10', matchup: 'Patriots vs Bills', pick: 'Patriots +14', line: '+14', result: 'loss', score: '7-35', margin: '-14' },
      { date: 'Nov 3', matchup: 'Bengals vs Ravens', pick: 'Bengals +5.5', line: '+5.5', result: 'win', score: '27-30', margin: '+2.5' },
      { date: 'Oct 27', matchup: 'Giants vs Commanders', pick: 'Giants +4.5', line: '+4.5', result: 'win', score: '18-17', margin: '+5.5' },
      { date: 'Oct 20', matchup: 'Colts vs Jaguars', pick: 'Colts +3', line: '+3', result: 'win', score: '24-21', margin: '+6' },
      { date: 'Oct 13', matchup: 'Panthers vs Saints', pick: 'Panthers +5', line: '+5', result: 'loss', score: '10-24', margin: '-9' },
      { date: 'Oct 6', matchup: 'Titans vs Bills', pick: 'Titans +9.5', line: '+9.5', result: 'loss', score: '14-31', margin: '-7.5' },
      { date: 'Sep 29', matchup: 'Broncos vs Raiders', pick: 'Broncos +3.5', line: '+3.5', result: 'win', score: '17-14', margin: '+6.5' },
      { date: 'Sep 22', matchup: 'Bears vs Colts', pick: 'Bears +4', line: '+4', result: 'win', score: '21-16', margin: '+9' },
      { date: 'Sep 15', matchup: 'Cardinals vs Rams', pick: 'Cardinals +5.5', line: '+5.5', result: 'win', score: '27-24', margin: '+8.5' },
      { date: 'Sep 14', matchup: 'Giants vs Vikings', pick: 'Giants +6', line: '+6', result: 'loss', score: '14-28', margin: '-8' },
      { date: 'Sep 8', matchup: 'Titans vs Bears', pick: 'Titans +3.5', line: '+3.5', result: 'win', score: '17-10', margin: '+10.5' },
      { date: 'Sep 5', matchup: 'Broncos vs Seahawks', pick: 'Broncos +4', line: '+4', result: 'win', score: '21-17', margin: '+8' },
    ]
  },
  '2': {
    id: '2',
    sport: 'NBA',
    icon: '🏀',
    trend: 'OKC Thunder 15-3 ATS in last 18 games',
    record: '15-3',
    roi: '+24.2%',
    edge: '+18.2%',
    confidence: 88,
    type: 'ats',
    isHot: true,
    description: 'The Oklahoma City Thunder have covered at an 83.3% rate over their last 18 games, dominating the spread despite being heavily favored in most matchups.',
    methodology: [
      'Tracked Thunder ATS results from Dec 1, 2025 onward',
      'Line taken at market close (-110 juice assumed)',
      'Includes home and road games',
      'Push counted as no-decision'
    ],
    keyFactors: [
      'SGA playing at MVP level - 32.4 PPG in this stretch',
      'Chet Holmgren defensive impact undervalued',
      'Thunder #1 in net rating during this stretch (+12.8)',
      'Market slow to adjust to their dominance'
    ],
    historicalContext: 'The Thunder\'s 83.3% ATS rate is the best 18-game stretch for any team this season. League average ATS is 50%.',
    sampleSize: 18,
    dateRange: 'Dec 1, 2025 - Jan 3, 2026',
    lastUpdated: 'Jan 4, 2026 9:30 AM ET',
    results: [
      { date: 'Jan 3', matchup: 'Thunder @ Celtics', pick: 'Thunder +2', line: '+2', result: 'win', score: '118-112', margin: '+8' },
      { date: 'Jan 1', matchup: 'Thunder vs Suns', pick: 'Thunder -8.5', line: '-8.5', result: 'win', score: '127-110', margin: '+8.5' },
      { date: 'Dec 30', matchup: 'Thunder @ Mavs', pick: 'Thunder -4', line: '-4', result: 'win', score: '121-108', margin: '+9' },
      { date: 'Dec 28', matchup: 'Thunder vs Lakers', pick: 'Thunder -7', line: '-7', result: 'win', score: '134-115', margin: '+12' },
      { date: 'Dec 26', matchup: 'Thunder @ Nuggets', pick: 'Thunder +1.5', line: '+1.5', result: 'loss', score: '108-119', margin: '-9.5' },
      { date: 'Dec 23', matchup: 'Thunder vs Wolves', pick: 'Thunder -5.5', line: '-5.5', result: 'win', score: '115-104', margin: '+5.5' },
      { date: 'Dec 21', matchup: 'Thunder @ Kings', pick: 'Thunder -3', line: '-3', result: 'win', score: '122-110', margin: '+9' },
      { date: 'Dec 19', matchup: 'Thunder vs Clippers', pick: 'Thunder -9', line: '-9', result: 'win', score: '131-112', margin: '+10' },
      { date: 'Dec 17', matchup: 'Thunder @ Warriors', pick: 'Thunder -2.5', line: '-2.5', result: 'win', score: '119-108', margin: '+8.5' },
      { date: 'Dec 15', matchup: 'Thunder vs Rockets', pick: 'Thunder -6', line: '-6', result: 'loss', score: '105-109', margin: '-10' },
      { date: 'Dec 13', matchup: 'Thunder @ Grizzlies', pick: 'Thunder -4.5', line: '-4.5', result: 'win', score: '128-118', margin: '+5.5' },
      { date: 'Dec 11', matchup: 'Thunder vs Heat', pick: 'Thunder -8', line: '-8', result: 'win', score: '125-110', margin: '+7' },
      { date: 'Dec 9', matchup: 'Thunder @ Pelicans', pick: 'Thunder -7.5', line: '-7.5', result: 'win', score: '133-115', margin: '+10.5' },
      { date: 'Dec 7', matchup: 'Thunder vs Spurs', pick: 'Thunder -11', line: '-11', result: 'win', score: '140-122', margin: '+7' },
      { date: 'Dec 5', matchup: 'Thunder @ Jazz', pick: 'Thunder -9.5', line: '-9.5', result: 'win', score: '129-108', margin: '+11.5' },
      { date: 'Dec 3', matchup: 'Thunder vs Pistons', pick: 'Thunder -14', line: '-14', result: 'loss', score: '110-105', margin: '-19' },
      { date: 'Dec 2', matchup: 'Thunder @ Blazers', pick: 'Thunder -10', line: '-10', result: 'win', score: '138-119', margin: '+9' },
      { date: 'Dec 1', matchup: 'Thunder vs Hornets', pick: 'Thunder -12.5', line: '-12.5', result: 'win', score: '141-118', margin: '+10.5' },
    ]
  },
  // Default fallback for trends not yet detailed
}

// Default trend data for IDs without specific data
const getDefaultTrend = (id: string) => ({
  id,
  sport: 'NFL',
  icon: '🏈',
  trend: 'Sample trend - data being compiled',
  record: '0-0',
  roi: '0%',
  edge: '0%',
  confidence: 50,
  type: 'ats',
  isHot: false,
  description: 'Detailed data for this trend is currently being compiled. Check back soon for full results breakdown.',
  methodology: ['Data collection in progress'],
  keyFactors: ['Analysis pending'],
  historicalContext: 'Historical context will be added once data is compiled.',
  sampleSize: 0,
  dateRange: 'TBD',
  lastUpdated: 'Coming soon',
  results: []
})

export default function TrendDetailPage() {
  const params = useParams()
  const id = params.id as string
  const trend = trendData[id] || getDefaultTrend(id)
  
  const [showAllResults, setShowAllResults] = useState(false)
  
  const wins = trend.results.filter(r => r.result === 'win').length
  const losses = trend.results.filter(r => r.result === 'loss').length
  const pushes = trend.results.filter(r => r.result === 'push').length
  const displayedResults = showAllResults ? trend.results : trend.results.slice(0, 10)

  return (
    <div className="min-h-screen pt-20 pb-12 bg-[#050508]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Navigation */}
        <Link 
          href="/trends" 
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Trends
        </Link>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-4xl">{trend.icon}</span>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-bold text-gray-400 uppercase">{trend.sport}</span>
                <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                  trend.type === 'ats' ? 'bg-blue-500/20 text-blue-400' :
                  trend.type === 'totals' ? 'bg-orange-500/20 text-orange-400' :
                  'bg-green-500/20 text-green-400'
                }`}>
                  {trend.type === 'ats' ? 'ATS' : trend.type === 'totals' ? 'O/U' : 'ML'}
                </span>
                {trend.isHot && (
                  <span className="px-2 py-0.5 rounded text-xs font-bold bg-green-500/20 text-green-400">
                    🔥 HOT
                  </span>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white">{trend.trend}</h1>
            </div>
          </div>
          <p className="text-gray-400 max-w-3xl">{trend.description}</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="p-4 rounded-2xl bg-green-500/10 border border-green-500/20">
            <div className="text-3xl font-black text-green-400">{trend.record}</div>
            <div className="text-xs text-gray-400">Record</div>
          </div>
          <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20">
            <div className="text-3xl font-black text-blue-400">{trend.roi}</div>
            <div className="text-xs text-gray-400">ROI</div>
          </div>
          <div className="p-4 rounded-2xl bg-orange-500/10 border border-orange-500/20">
            <div className="text-3xl font-black text-orange-400">{trend.edge}</div>
            <div className="text-xs text-gray-400">Edge vs Market</div>
          </div>
          <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20">
            <div className="text-3xl font-black text-purple-400">{trend.confidence}%</div>
            <div className="text-xs text-gray-400">Confidence</div>
          </div>
        </div>

        {/* Results Table */}
        <div className="rounded-2xl bg-[#0c0c14] border border-white/10 mb-8">
          <div className="p-4 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BarChart3 className="w-5 h-5 text-green-400" />
              <h2 className="font-bold text-white">Results Breakdown</h2>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <span className="text-green-400">{wins}W</span>
              <span className="text-red-400">{losses}L</span>
              {pushes > 0 && <span className="text-gray-400">{pushes}P</span>}
            </div>
          </div>
          
          {trend.results.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/5">
                      <th className="text-left p-3 text-gray-500 font-semibold">Date</th>
                      <th className="text-left p-3 text-gray-500 font-semibold">Matchup</th>
                      <th className="text-left p-3 text-gray-500 font-semibold">Pick</th>
                      <th className="text-center p-3 text-gray-500 font-semibold">Result</th>
                      <th className="text-left p-3 text-gray-500 font-semibold">Score</th>
                      <th className="text-right p-3 text-gray-500 font-semibold">Margin</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayedResults.map((result, i) => (
                      <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <td className="p-3 text-gray-400">{result.date}</td>
                        <td className="p-3 text-white font-medium">{result.matchup}</td>
                        <td className="p-3">
                          <span className="px-2 py-1 rounded bg-white/5 text-gray-300 font-mono text-xs">
                            {result.pick}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          {result.result === 'win' ? (
                            <CheckCircle className="w-5 h-5 text-green-400 inline" />
                          ) : result.result === 'loss' ? (
                            <XCircle className="w-5 h-5 text-red-400 inline" />
                          ) : (
                            <MinusCircle className="w-5 h-5 text-gray-400 inline" />
                          )}
                        </td>
                        <td className="p-3 text-gray-300 font-mono">{result.score}</td>
                        <td className={`p-3 text-right font-bold font-mono ${
                          result.result === 'win' ? 'text-green-400' : 
                          result.result === 'loss' ? 'text-red-400' : 'text-gray-400'
                        }`}>
                          {result.margin}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {trend.results.length > 10 && (
                <div className="p-4 border-t border-white/5">
                  <button
                    onClick={() => setShowAllResults(!showAllResults)}
                    className="text-sm text-orange-400 hover:text-orange-300 font-semibold"
                  >
                    {showAllResults ? 'Show Less' : `Show All ${trend.results.length} Results`}
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="p-8 text-center">
              <AlertCircle className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">Results data is being compiled. Check back soon.</p>
            </div>
          )}
        </div>

        {/* Two Column Info */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Methodology */}
          <div className="rounded-2xl bg-[#0c0c14] border border-white/10 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-5 h-5 text-blue-400" />
              <h2 className="font-bold text-white">Methodology</h2>
            </div>
            <ul className="space-y-2">
              {trend.methodology.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-400">
                  <ChevronRight className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Key Factors */}
          <div className="rounded-2xl bg-[#0c0c14] border border-white/10 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Target className="w-5 h-5 text-green-400" />
              <h2 className="font-bold text-white">Key Factors</h2>
            </div>
            <ul className="space-y-2">
              {trend.keyFactors.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-400">
                  <ChevronRight className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Historical Context */}
        <div className="rounded-2xl bg-gradient-to-r from-orange-500/10 to-yellow-500/10 border border-orange-500/20 p-6 mb-8">
          <div className="flex items-center gap-2 mb-3">
            <Info className="w-5 h-5 text-orange-400" />
            <h2 className="font-bold text-white">Historical Context</h2>
          </div>
          <p className="text-gray-300">{trend.historicalContext}</p>
        </div>

        {/* Meta Info */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-white/5 text-sm text-gray-500">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {trend.dateRange}
            </span>
            <span className="flex items-center gap-1">
              <BarChart3 className="w-4 h-4" />
              {trend.sampleSize} games
            </span>
          </div>
          <span className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            Updated: {trend.lastUpdated}
          </span>
        </div>

        {/* Disclaimer */}
        <div className="mt-8 p-4 rounded-xl bg-red-500/10 border border-red-500/20">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 shrink-0" />
            <div>
              <h3 className="font-bold text-white mb-1">Important Disclaimer</h3>
              <p className="text-sm text-gray-400">
                Past performance does not guarantee future results. All trends are for informational 
                purposes only and should not be considered financial advice. Always bet responsibly 
                and within your means. Trends may experience regression toward the mean over time.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
