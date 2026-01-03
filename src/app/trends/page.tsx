'use client'

import { useState } from 'react'
import Link from 'next/link'
import { 
  TrendingUp, 
  TrendingDown,
  Flame,
  BarChart3,
  Target,
  Filter
} from 'lucide-react'

type Sport = 'all' | 'nfl' | 'nba' | 'nhl' | 'mlb'
type TrendType = 'all' | 'ats' | 'totals' | 'ml'

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
]

const hotTrends = trends.filter(t => t.isHot)

export default function TrendsPage() {
  const [sport, setSport] = useState<Sport>('all')
  const [trendType, setTrendType] = useState<TrendType>('all')

  const filteredTrends = trends.filter(t => {
    if (sport !== 'all' && t.sport !== sport) return false
    if (trendType !== 'all' && t.type !== trendType) return false
    return true
  })

  return (
    <div className="min-h-screen" style={{ background: '#050508' }}>
      {/* Hero Header */}
      <section className="relative overflow-hidden" style={{ background: 'linear-gradient(180deg, #0a0a12 0%, #050508 100%)' }}>
        <div className="absolute top-0 right-1/3 w-96 h-96 rounded-full opacity-15 blur-3xl pointer-events-none" 
             style={{ background: 'radial-gradient(circle, #00FF88 0%, transparent 70%)' }} />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <span className="text-4xl">📊</span>
              <div>
                <h1 className="text-3xl font-black" style={{ color: '#FFF' }}>Betting Trends</h1>
                <p style={{ color: '#808090' }}>Data-driven edges across all sports</p>
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
            </div>
          </div>
          
          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
            <div className="p-3 rounded-xl text-center" style={{ background: 'rgba(0,255,136,0.1)', border: '1px solid rgba(0,255,136,0.2)' }}>
              <div className="text-2xl font-black" style={{ color: '#00FF88' }}>847</div>
              <div className="text-xs" style={{ color: '#808090' }}>Active Trends</div>
            </div>
            <div className="p-3 rounded-xl text-center" style={{ background: 'rgba(255,107,0,0.1)', border: '1px solid rgba(255,107,0,0.2)' }}>
              <div className="text-2xl font-black" style={{ color: '#FF6B00' }}>24</div>
              <div className="text-xs" style={{ color: '#808090' }}>Hot Trends</div>
            </div>
            <div className="p-3 rounded-xl text-center" style={{ background: 'rgba(0,168,255,0.1)', border: '1px solid rgba(0,168,255,0.2)' }}>
              <div className="text-2xl font-black" style={{ color: '#00A8FF' }}>+18.4%</div>
              <div className="text-xs" style={{ color: '#808090' }}>Avg ROI</div>
            </div>
            <div className="p-3 rounded-xl text-center" style={{ background: 'rgba(255,51,102,0.1)', border: '1px solid rgba(255,51,102,0.2)' }}>
              <div className="text-2xl font-black" style={{ color: '#FF3366' }}>58.2%</div>
              <div className="text-xs" style={{ color: '#808090' }}>Win Rate</div>
            </div>
          </div>
        </div>
      </section>

      {/* Trends Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-6">
          
          {/* Trends List */}
          <div className="lg:col-span-2 space-y-4">
            {filteredTrends.map((trend) => (
              <div key={trend.id} className="rounded-2xl overflow-hidden transition-all hover:scale-[1.01]"
                   style={{ 
                     background: '#0c0c14',
                     border: trend.isHot ? '1px solid rgba(0,255,136,0.4)' : '1px solid rgba(255,255,255,0.06)'
                   }}>
                <div className="p-5">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{trend.icon}</span>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs uppercase font-semibold" style={{ color: '#808090' }}>{trend.sport}</span>
                          <span className="text-xs px-2 py-0.5 rounded"
                                style={{ 
                                  background: trend.type === 'ats' ? 'rgba(0,168,255,0.15)' : trend.type === 'totals' ? 'rgba(255,107,0,0.15)' : 'rgba(0,255,136,0.15)',
                                  color: trend.type === 'ats' ? '#00A8FF' : trend.type === 'totals' ? '#FF6B00' : '#00FF88'
                                }}>
                            {trend.type === 'ats' ? 'ATS' : trend.type === 'totals' ? 'O/U' : 'ML'}
                          </span>
                          {trend.isHot && (
                            <span className="flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded"
                                  style={{ background: 'rgba(0,255,136,0.2)', color: '#00FF88' }}>
                              <Flame style={{ width: '10px', height: '10px' }} /> HOT
                            </span>
                          )}
                        </div>
                        <h3 className="font-bold text-lg" style={{ color: '#FFF' }}>{trend.trend}</h3>
                      </div>
                    </div>
                  </div>
                  
                  {/* Stats */}
                  <div className="grid grid-cols-4 gap-4">
                    <div className="text-center p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)' }}>
                      <div className="text-2xl font-black" style={{ color: '#00FF88' }}>{trend.record}</div>
                      <div className="text-xs" style={{ color: '#606070' }}>Record</div>
                    </div>
                    <div className="text-center p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)' }}>
                      <div className="text-2xl font-black" style={{ color: trend.roi.startsWith('-') ? '#FF4455' : '#00FF88' }}>{trend.roi}</div>
                      <div className="text-xs" style={{ color: '#606070' }}>ROI</div>
                    </div>
                    <div className="text-center p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)' }}>
                      <div className="text-2xl font-black" style={{ color: trend.edge.startsWith('-') ? '#FF4455' : '#FF6B00' }}>{trend.edge}</div>
                      <div className="text-xs" style={{ color: '#606070' }}>Edge</div>
                    </div>
                    <div className="text-center p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)' }}>
                      <div className="text-2xl font-black" style={{ color: '#00A8FF' }}>{trend.confidence}%</div>
                      <div className="text-xs" style={{ color: '#606070' }}>Confidence</div>
                    </div>
                  </div>
                  
                  {/* Confidence Bar */}
                  <div className="mt-4">
                    <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
                      <div className="h-full rounded-full transition-all" 
                           style={{ 
                             width: `${trend.confidence}%`, 
                             background: trend.confidence > 85 ? 'linear-gradient(90deg, #00FF88, #00CC6A)' : 
                                        trend.confidence > 75 ? 'linear-gradient(90deg, #FF6B00, #FF8534)' : 
                                        'linear-gradient(90deg, #00A8FF, #0088CC)'
                           }} />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Sidebar */}
          <div className="space-y-6">
            {/* Hot Trends */}
            <div className="rounded-2xl p-5" style={{ background: '#0c0c14', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="flex items-center gap-2 mb-4">
                <Flame style={{ color: '#FF6B00', width: '18px', height: '18px' }} />
                <h3 className="font-bold" style={{ color: '#FFF' }}>🔥 Hot Right Now</h3>
              </div>
              
              <div className="space-y-3">
                {hotTrends.slice(0, 4).map((t) => (
                  <div key={t.id} className="p-3 rounded-lg" style={{ background: 'rgba(255,107,0,0.05)' }}>
                    <div className="flex items-center gap-2 mb-1">
                      <span>{t.icon}</span>
                      <span className="text-sm font-semibold" style={{ color: '#FFF' }}>{t.sport.toUpperCase()}</span>
                    </div>
                    <div className="text-sm" style={{ color: '#A0A0B0' }}>{t.trend}</div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-sm font-mono" style={{ color: '#00FF88' }}>{t.record}</span>
                      <span className="font-black" style={{ color: '#FF6B00' }}>{t.edge}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* By Sport */}
            <div className="rounded-2xl p-5" style={{ background: '#0c0c14', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 style={{ color: '#00A8FF', width: '18px', height: '18px' }} />
                <h3 className="font-bold" style={{ color: '#FFF' }}>Trends by Sport</h3>
              </div>
              
              <div className="space-y-3">
                {[
                  { sport: 'NFL', icon: '🏈', count: 234, roi: '+22.4%' },
                  { sport: 'NBA', icon: '🏀', count: 186, roi: '+18.2%' },
                  { sport: 'NHL', icon: '🏒', count: 142, roi: '+15.8%' },
                  { sport: 'MLB', icon: '⚾', count: 285, roi: '+12.4%' },
                ].map((s) => (
                  <div key={s.sport} className="flex items-center justify-between p-3 rounded-lg"
                       style={{ background: 'rgba(255,255,255,0.02)' }}>
                    <div className="flex items-center gap-2">
                      <span>{s.icon}</span>
                      <span className="font-semibold" style={{ color: '#FFF' }}>{s.sport}</span>
                      <span className="text-xs" style={{ color: '#606070' }}>{s.count} trends</span>
                    </div>
                    <span className="font-bold" style={{ color: '#00FF88' }}>{s.roi}</span>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Quick Links */}
            <div className="rounded-2xl p-5" style={{ background: '#0c0c14', border: '1px solid rgba(255,255,255,0.06)' }}>
              <h3 className="font-bold mb-4" style={{ color: '#FFF' }}>Quick Links</h3>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: '🏈 NFL', href: '/nfl' },
                  { label: '🏀 NBA', href: '/nba' },
                  { label: '📈 Markets', href: '/markets' },
                  { label: '🏆 Leaderboard', href: '/leaderboard' },
                ].map((link) => (
                  <Link key={link.href} href={link.href}
                        className="p-3 rounded-lg text-center text-sm font-semibold transition-all hover:scale-105"
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
