'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { 
  Flame,
  BarChart3,
  RefreshCw,
  ChevronRight,
  Zap
} from 'lucide-react'

type Sport = 'all' | 'nfl' | 'nba' | 'nhl' | 'mlb'
type TrendType = 'all' | 'ats' | 'totals' | 'ml'

// Extended trends data
const trends = [
  { id: '1', sport: 'nfl', icon: '🏈', trend: 'Home underdogs 18-6 ATS this season', record: '18-6', roi: '+28.4%', edge: '+12.4%', confidence: 92, type: 'ats', isHot: true },
  { id: '2', sport: 'nba', icon: '🏀', trend: 'OKC Thunder 15-3 ATS in last 18 games', record: '15-3', roi: '+24.2%', edge: '+18.2%', confidence: 88, type: 'ats', isHot: true },
  { id: '3', sport: 'nfl', icon: '🏈', trend: 'Road favorites 15-9 ATS in playoffs', record: '15-9', roi: '+16.8%', edge: '+8.2%', confidence: 85, type: 'ats', isHot: false },
  { id: '4', sport: 'nhl', icon: '🏒', trend: 'Oilers 8-2 O/U in last 10 road games', record: '8-2', roi: '+22.5%', edge: '+12.4%', confidence: 84, type: 'totals', isHot: true },
  { id: '5', sport: 'nba', icon: '🏀', trend: 'Celtics 2-6 ATS as 8+ point favorites', record: '2-6', roi: '-18.4%', edge: '-12.4%', confidence: 82, type: 'ats', isHot: true },
  { id: '6', sport: 'mlb', icon: '⚾', trend: 'Yankees 8-2 vs Red Sox this season', record: '8-2', roi: '+21.2%', edge: '+14.2%', confidence: 80, type: 'ml', isHot: false },
  { id: '7', sport: 'nfl', icon: '🏈', trend: 'Unders 24-12 in Week 18 historically', record: '24-12', roi: '+18.6%', edge: '+6.8%', confidence: 78, type: 'totals', isHot: false },
  { id: '8', sport: 'nba', icon: '🏀', trend: 'Heat 8-2 ATS as road underdogs', record: '8-2', roi: '+24.8%', edge: '+14.5%', confidence: 76, type: 'ats', isHot: false },
  { id: '9', sport: 'nhl', icon: '🏒', trend: 'Bruins 4-8 ATS at home vs playoff teams', record: '4-8', roi: '-14.2%', edge: '-8.5%', confidence: 75, type: 'ats', isHot: false },
  { id: '10', sport: 'mlb', icon: '⚾', trend: 'Dodgers 12-4 on run line vs NL West', record: '12-4', roi: '+19.4%', edge: '+12.8%', confidence: 74, type: 'ats', isHot: false },
  { id: '11', sport: 'nba', icon: '🏀', trend: 'Lakers 10-4 1Q unders at home', record: '10-4', roi: '+18.2%', edge: '+10.1%', confidence: 73, type: 'totals', isHot: false },
  { id: '12', sport: 'nfl', icon: '🏈', trend: 'Chiefs 9-3 ATS as road favorites', record: '9-3', roi: '+21.5%', edge: '+15.2%', confidence: 72, type: 'ats', isHot: true },
  { id: '13', sport: 'nhl', icon: '🏒', trend: 'Jets 11-5 totals under at home', record: '11-5', roi: '+16.8%', edge: '+9.4%', confidence: 71, type: 'totals', isHot: false },
  { id: '14', sport: 'nba', icon: '🏀', trend: 'Nuggets 7-2 ATS off 2+ day rest', record: '7-2', roi: '+22.4%', edge: '+13.8%', confidence: 70, type: 'ats', isHot: false },
  { id: '15', sport: 'mlb', icon: '⚾', trend: 'Braves 14-6 totals over vs AL teams', record: '14-6', roi: '+14.2%', edge: '+8.5%', confidence: 69, type: 'totals', isHot: false },
  { id: '16', sport: 'nfl', icon: '🏈', trend: 'Ravens 8-4 ATS in primetime games', record: '8-4', roi: '+15.8%', edge: '+9.2%', confidence: 68, type: 'ats', isHot: false },
  { id: '17', sport: 'nba', icon: '🏀', trend: 'Cavs 12-3 ATS last 15 home games', record: '12-3', roi: '+26.8%', edge: '+16.2%', confidence: 89, type: 'ats', isHot: true },
  { id: '18', sport: 'nhl', icon: '🏒', trend: 'Panthers 9-2 ML vs Metro division', record: '9-2', roi: '+18.4%', edge: '+11.2%', confidence: 77, type: 'ml', isHot: false },
]

const hotTrends = trends.filter(t => t.isHot)

function TrendsContent() {
  const searchParams = useSearchParams()
  const urlSport = searchParams.get('sport')?.toLowerCase() as Sport | null
  
  const [sport, setSport] = useState<Sport>(urlSport || 'all')
  const [trendType, setTrendType] = useState<TrendType>('all')
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Sync with URL params on mount and when URL changes
  useEffect(() => {
    if (urlSport && ['nfl', 'nba', 'nhl', 'mlb'].includes(urlSport)) {
      setSport(urlSport as Sport)
    }
  }, [urlSport])

  const filteredTrends = trends.filter(t => {
    if (sport !== 'all' && t.sport !== sport) return false
    if (trendType !== 'all' && t.type !== trendType) return false
    return true
  })

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await new Promise(r => setTimeout(r, 1000))
    setIsRefreshing(false)
  }

  return (
    <div className="min-h-screen" style={{ background: '#050508' }}>
      {/* Hero Header - Compact */}
      <section className="relative overflow-hidden" style={{ background: 'linear-gradient(180deg, #0a0a12 0%, #050508 100%)' }}>
        <div className="absolute top-0 right-1/3 w-96 h-96 rounded-full opacity-15 blur-3xl pointer-events-none" 
             style={{ background: 'radial-gradient(circle, #00FF88 0%, transparent 70%)' }} />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 relative z-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-3xl">📊</span>
              <div>
                <h1 className="text-2xl font-black" style={{ color: '#FFF' }}>Betting Trends</h1>
                <p className="text-sm" style={{ color: '#808090' }}>Data-driven edges across all sports</p>
              </div>
            </div>
            
            {/* Filters */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1 p-1 rounded-lg" style={{ background: 'rgba(255,255,255,0.05)' }}>
                {(['all', 'nfl', 'nba', 'nhl', 'mlb'] as Sport[]).map((s) => (
                  <button key={s} onClick={() => setSport(s)}
                          className="px-3 py-1.5 rounded-md text-xs font-semibold uppercase transition-all"
                          style={{ 
                            background: sport === s ? 'linear-gradient(135deg, #00FF88, #00CC6A)' : 'transparent',
                            color: sport === s ? '#000' : '#808090'
                          }}>
                    {s === 'all' ? 'All' : s}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-1 p-1 rounded-lg" style={{ background: 'rgba(255,255,255,0.05)' }}>
                {(['all', 'ats', 'totals', 'ml'] as TrendType[]).map((t) => (
                  <button key={t} onClick={() => setTrendType(t)}
                          className="px-3 py-1.5 rounded-md text-xs font-semibold uppercase transition-all"
                          style={{ 
                            background: trendType === t ? 'rgba(255,255,255,0.1)' : 'transparent',
                            color: trendType === t ? '#FFF' : '#808090'
                          }}>
                    {t === 'all' ? 'All' : t === 'ml' ? 'ML' : t === 'ats' ? 'ATS' : 'O/U'}
                  </button>
                ))}
              </div>
              <button onClick={handleRefresh}
                      className="p-2 rounded-lg transition-all hover:bg-white/10"
                      style={{ background: 'rgba(255,255,255,0.05)' }}>
                <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} style={{ color: '#808090' }} />
              </button>
            </div>
          </div>
          
          {/* Quick Stats - More Compact */}
          <div className="grid grid-cols-4 gap-2 mt-4">
            <div className="p-2 rounded-lg text-center" style={{ background: 'rgba(0,255,136,0.1)' }}>
              <div className="text-xl font-black" style={{ color: '#00FF88' }}>847</div>
              <div className="text-[10px]" style={{ color: '#808090' }}>Active Trends</div>
            </div>
            <div className="p-2 rounded-lg text-center" style={{ background: 'rgba(255,107,0,0.1)' }}>
              <div className="text-xl font-black" style={{ color: '#FF6B00' }}>24</div>
              <div className="text-[10px]" style={{ color: '#808090' }}>Hot Trends</div>
            </div>
            <div className="p-2 rounded-lg text-center" style={{ background: 'rgba(0,168,255,0.1)' }}>
              <div className="text-xl font-black" style={{ color: '#00A8FF' }}>+18.4%</div>
              <div className="text-[10px]" style={{ color: '#808090' }}>Avg ROI</div>
            </div>
            <div className="p-2 rounded-lg text-center" style={{ background: 'rgba(255,51,102,0.1)' }}>
              <div className="text-xl font-black" style={{ color: '#FF3366' }}>58.2%</div>
              <div className="text-[10px]" style={{ color: '#808090' }}>Win Rate</div>
            </div>
          </div>
        </div>
      </section>

      {/* Trends Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid lg:grid-cols-4 gap-4">
          
          {/* Trends List - Now 3 columns */}
          <div className="lg:col-span-3">
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
              {filteredTrends.map((trend) => (
                <Link key={trend.id} href={`/trends/${trend.id}`}
                      className="rounded-xl overflow-hidden transition-all hover:scale-[1.02] cursor-pointer group"
                     style={{ 
                       background: '#0c0c14',
                       border: trend.isHot ? '1px solid rgba(0,255,136,0.3)' : '1px solid rgba(255,255,255,0.06)'
                     }}>
                  <div className="p-3">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{trend.icon}</span>
                        <span className="text-xs uppercase font-bold" style={{ color: '#808090' }}>{trend.sport}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded"
                              style={{ 
                                background: trend.type === 'ats' ? 'rgba(0,168,255,0.15)' : trend.type === 'totals' ? 'rgba(255,107,0,0.15)' : 'rgba(0,255,136,0.15)',
                                color: trend.type === 'ats' ? '#00A8FF' : trend.type === 'totals' ? '#FF6B00' : '#00FF88'
                              }}>
                          {trend.type === 'ats' ? 'ATS' : trend.type === 'totals' ? 'O/U' : 'ML'}
                        </span>
                      </div>
                      {trend.isHot && (
                        <span className="flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded"
                              style={{ background: 'rgba(0,255,136,0.2)', color: '#00FF88' }}>
                          <Flame style={{ width: '8px', height: '8px' }} /> HOT
                        </span>
                      )}
                    </div>
                    
                    {/* Trend Text */}
                    <h3 className="font-semibold text-sm mb-3 line-clamp-2" style={{ color: '#FFF' }}>{trend.trend}</h3>
                    
                    {/* Stats - Compact 4-col Grid */}
                    <div className="grid grid-cols-4 gap-2">
                      <div className="text-center">
                        <div className="text-base font-black" style={{ color: '#00FF88' }}>{trend.record}</div>
                        <div className="text-[9px]" style={{ color: '#606070' }}>Record</div>
                      </div>
                      <div className="text-center">
                        <div className="text-base font-black" style={{ color: trend.roi.startsWith('-') ? '#FF4455' : '#00FF88' }}>{trend.roi}</div>
                        <div className="text-[9px]" style={{ color: '#606070' }}>ROI</div>
                      </div>
                      <div className="text-center">
                        <div className="text-base font-black" style={{ color: trend.edge.startsWith('-') ? '#FF4455' : '#FF6B00' }}>{trend.edge}</div>
                        <div className="text-[9px]" style={{ color: '#606070' }}>Edge</div>
                      </div>
                      <div className="text-center">
                        <div className="text-base font-black" style={{ color: '#00A8FF' }}>{trend.confidence}%</div>
                        <div className="text-[9px]" style={{ color: '#606070' }}>Conf</div>
                      </div>
                    </div>
                    
                    {/* Confidence Bar - Thinner */}
                    <div className="mt-2">
                      <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
                        <div className="h-full rounded-full transition-all" 
                             style={{ 
                               width: `${trend.confidence}%`, 
                               background: trend.confidence > 85 ? '#00FF88' : trend.confidence > 75 ? '#FF6B00' : '#00A8FF'
                             }} />
                      </div>
                    </div>
                    
                    {/* View Details Link */}
                    <div className="mt-2 flex items-center justify-end gap-1 text-[10px] font-semibold opacity-0 group-hover:opacity-100 transition-opacity"
                         style={{ color: '#FF6B00' }}>
                      View Results <ChevronRight size={10} />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            
            {/* No results */}
            {filteredTrends.length === 0 && (
              <div className="text-center py-12">
                <div className="text-4xl mb-4">🔍</div>
                <h3 className="text-lg font-bold mb-2" style={{ color: '#FFF' }}>No trends found</h3>
                <p style={{ color: '#606070' }}>Try adjusting your filters</p>
              </div>
            )}
          </div>
          
          {/* Sidebar - Single Column */}
          <div className="space-y-4">
            {/* Hot Trends Sidebar */}
            <div className="rounded-xl p-4" style={{ background: '#0c0c14', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="flex items-center gap-2 mb-3">
                <Flame style={{ color: '#FF6B00', width: '16px', height: '16px' }} />
                <h3 className="font-bold text-sm" style={{ color: '#FFF' }}>🔥 Hot Right Now</h3>
              </div>
              
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {hotTrends.map((t) => (
                  <div key={t.id} className="p-2 rounded-lg hover:bg-white/5 cursor-pointer transition-all" 
                       style={{ background: 'rgba(255,107,0,0.05)' }}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm">{t.icon}</span>
                      <span className="text-xs font-bold" style={{ color: '#FFF' }}>{t.sport.toUpperCase()}</span>
                    </div>
                    <div className="text-xs line-clamp-2" style={{ color: '#A0A0B0' }}>{t.trend}</div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs font-mono" style={{ color: '#00FF88' }}>{t.record}</span>
                      <span className="text-xs font-black" style={{ color: '#FF6B00' }}>{t.edge}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* By Sport */}
            <div className="rounded-xl p-4" style={{ background: '#0c0c14', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="flex items-center gap-2 mb-3">
                <BarChart3 style={{ color: '#00A8FF', width: '16px', height: '16px' }} />
                <h3 className="font-bold text-sm" style={{ color: '#FFF' }}>By Sport</h3>
              </div>
              
              <div className="space-y-2">
                {[
                  { sport: 'NFL', icon: '🏈', count: 234, roi: '+22.4%', href: '/trends?sport=nfl' },
                  { sport: 'NBA', icon: '🏀', count: 186, roi: '+18.2%', href: '/trends?sport=nba' },
                  { sport: 'NHL', icon: '🏒', count: 142, roi: '+15.8%', href: '/trends?sport=nhl' },
                  { sport: 'MLB', icon: '⚾', count: 285, roi: '+12.4%', href: '/trends?sport=mlb' },
                ].map((s) => (
                  <Link key={s.sport} href={s.href}
                        className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 transition-all"
                        style={{ background: 'rgba(255,255,255,0.02)' }}>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{s.icon}</span>
                      <span className="font-semibold text-sm" style={{ color: '#FFF' }}>{s.sport}</span>
                      <span className="text-[10px]" style={{ color: '#606070' }}>{s.count}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-bold" style={{ color: '#00FF88' }}>{s.roi}</span>
                      <ChevronRight size={12} style={{ color: '#606070' }} />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
            
            {/* AI Analysis Promo */}
            <div className="rounded-xl p-4" style={{ background: 'linear-gradient(135deg, rgba(255,107,0,0.1), rgba(0,168,255,0.1))', border: '1px solid rgba(255,107,0,0.2)' }}>
              <div className="flex items-center gap-2 mb-2">
                <Zap style={{ color: '#FF6B00', width: '16px', height: '16px' }} />
                <h3 className="font-bold text-sm" style={{ color: '#FFF' }}>AI Trend Discovery</h3>
              </div>
              <p className="text-xs mb-3" style={{ color: '#A0A0B0' }}>
                Our AI analyzes millions of data points to find edges others miss.
              </p>
              <Link href="/analytics" 
                    className="block text-center text-xs font-bold py-2 rounded-lg transition-all hover:scale-105"
                    style={{ background: 'linear-gradient(135deg, #FF6B00, #FF3366)', color: '#000' }}>
                View Full Analytics →
              </Link>
            </div>
            
            {/* Quick Links */}
            <div className="rounded-xl p-4" style={{ background: '#0c0c14', border: '1px solid rgba(255,255,255,0.06)' }}>
              <h3 className="font-bold text-sm mb-3" style={{ color: '#FFF' }}>Quick Links</h3>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: '📊 Stats', href: '/stats' },
                  { label: '📈 Markets', href: '/markets' },
                  { label: '🎯 Experts', href: '/leaderboard' },
                  { label: '🏠 Home', href: '/' },
                ].map((link) => (
                  <Link key={link.href} href={link.href}
                        className="p-2 rounded-lg text-center text-xs font-semibold transition-all hover:scale-105 hover:bg-white/10"
                        style={{ background: 'rgba(255,255,255,0.03)', color: '#FFF' }}>
                    {link.label}
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

export default function TrendsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#050508' }}>
        <div className="animate-spin w-8 h-8 border-2 rounded-full" style={{ borderColor: '#00FF88', borderTopColor: 'transparent' }} />
      </div>
    }>
      <TrendsContent />
    </Suspense>
  )
}
