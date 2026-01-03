'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Target,
  BarChart3,
  Calendar,
  Flame,
  Snowflake,
  Home,
  Plane,
  Clock,
  Trophy,
  Activity,
  Zap,
  Brain,
  ChevronRight
} from 'lucide-react'

// Mock team data - in production, fetch from API based on params
const getTeamData = (sport: string, team: string) => {
  const teamMap: Record<string, Record<string, any>> = {
    nfl: {
      det: {
        name: 'Lions',
        city: 'Detroit',
        abbr: 'DET',
        emoji: '🦁',
        conference: 'NFC North',
        record: '15-2',
        ats: { wins: 12, losses: 5, pct: 70.6 },
        ou: { overs: 10, unders: 7, pct: 58.8 },
        ml: { wins: 13, losses: 4, pct: 76.5 },
        streak: 'W7',
        isHot: true,
        homeAts: '7-1',
        awayAts: '5-4',
        favAts: '10-4',
        dogAts: '2-1',
        primetimeAts: '5-1',
        divisionalAts: '4-2',
        aiSummary: 'Detroit has been the best ATS team in the NFL this season. Their high-powered offense consistently covers, especially at Ford Field where they are 7-1 ATS. The Lions are a top follow in primetime games.',
        trends: [
          'Lions are 10-3 ATS in their last 13 games',
          '7-1 ATS at home this season',
          'OVER 6-1 in last 7 primetime games',
          'Cover 75% when favored by 3-7 points',
        ],
        schedule: [
          { opp: 'MIN', date: 'Jan 5', line: '-3.5', result: null },
          { opp: '@GB', date: 'Dec 31', line: '-2.5', result: 'W' },
          { opp: 'CHI', date: 'Dec 25', line: '-10', result: 'W' },
        ],
      },
      kc: {
        name: 'Chiefs',
        city: 'Kansas City',
        abbr: 'KC',
        emoji: '🏈',
        conference: 'AFC West',
        record: '14-3',
        ats: { wins: 9, losses: 8, pct: 52.9 },
        ou: { overs: 7, unders: 10, pct: 41.2 },
        ml: { wins: 14, losses: 3, pct: 82.4 },
        streak: 'W3',
        isHot: false,
        homeAts: '5-3',
        awayAts: '4-5',
        favAts: '7-7',
        dogAts: '2-1',
        primetimeAts: '3-4',
        divisionalAts: '3-3',
        aiSummary: 'Kansas City is winning games but not covering spreads consistently. The UNDER has been profitable as their defense has improved while offense relies on short drives. Fade them as big favorites.',
        trends: [
          'Chiefs are 4-8 ATS as favorites of 7+ points',
          'UNDER 7-3 in last 10 games',
          '2-5 ATS in their last 7 road games',
          'Win but fail to cover in close matchups',
        ],
        schedule: [
          { opp: 'DEN', date: 'Jan 5', line: '-9.5', result: null },
          { opp: '@LV', date: 'Dec 31', line: '-7', result: 'L' },
          { opp: 'CIN', date: 'Dec 25', line: '-5.5', result: 'W' },
        ],
      },
    },
    nba: {
      bos: {
        name: 'Celtics',
        city: 'Boston',
        abbr: 'BOS',
        emoji: '☘️',
        conference: 'Eastern Conference',
        record: '32-8',
        ats: { wins: 24, losses: 16, pct: 60.0 },
        ou: { overs: 22, unders: 18, pct: 55.0 },
        ml: { wins: 30, losses: 10, pct: 75.0 },
        streak: 'W5',
        isHot: true,
        homeAts: '15-5',
        awayAts: '9-11',
        favAts: '20-14',
        dogAts: '4-2',
        primetimeAts: '6-2',
        divisionalAts: '8-4',
        aiSummary: 'Boston is elite at home (15-5 ATS) but struggles to cover on the road. Target them at TD Garden and fade on road back-to-backs. Their defense leads to unders more often than the public expects.',
        trends: [
          'Celtics 15-5 ATS at home',
          '9-11 ATS on the road',
          'OVER 6-2 in last 8 home games',
          'Cover 75% vs teams below .500',
        ],
        schedule: [
          { opp: 'MIA', date: 'Jan 5', line: '-8.5', result: null },
          { opp: '@PHI', date: 'Jan 3', line: '-5', result: 'W' },
          { opp: 'CLE', date: 'Jan 1', line: '-3', result: 'L' },
        ],
      },
    },
    nhl: {
      wpg: {
        name: 'Jets',
        city: 'Winnipeg',
        abbr: 'WPG',
        emoji: '✈️',
        conference: 'Western Conference',
        record: '29-10-3',
        ats: { wins: 25, losses: 17, pct: 59.5 },
        ou: { overs: 23, unders: 19, pct: 54.8 },
        ml: { wins: 28, losses: 14, pct: 66.7 },
        streak: 'W4',
        isHot: true,
        homeAts: '14-6',
        awayAts: '11-11',
        favAts: '18-10',
        dogAts: '7-7',
        primetimeAts: '5-2',
        divisionalAts: '9-5',
        aiSummary: 'Winnipeg has been the surprise of the NHL. They cover the puckline 59.5% - one of the best marks in the league. Back them at home and in divisional games where they dominate.',
        trends: [
          'Jets 14-6 on puckline at home',
          'OVER 8-3 in last 11 games',
          'Cover 64% vs Central Division',
          'Elite goaltending keeps games close',
        ],
        schedule: [
          { opp: 'VGK', date: 'Jan 5', line: '-1.5', result: null },
          { opp: '@MIN', date: 'Jan 3', line: '+1.5', result: 'W' },
          { opp: 'COL', date: 'Jan 1', line: '-1.5', result: 'W' },
        ],
      },
    },
    mlb: {
      lad: {
        name: 'Dodgers',
        city: 'Los Angeles',
        abbr: 'LAD',
        emoji: '💙',
        conference: 'NL West',
        record: '98-64',
        ats: { wins: 90, losses: 72, pct: 55.6 },
        ou: { overs: 85, unders: 77, pct: 52.5 },
        ml: { wins: 95, losses: 67, pct: 58.6 },
        streak: 'W2',
        isHot: false,
        homeAts: '52-29',
        awayAts: '38-43',
        favAts: '70-58',
        dogAts: '20-14',
        primetimeAts: '28-15',
        divisionalAts: '35-27',
        aiSummary: 'LA is elite at Dodger Stadium (52-29 RL) but struggles on the road. Target home runline and fade road favorites. Their bullpen inconsistency leads to overs in late innings.',
        trends: [
          'Dodgers 52-29 on runline at home',
          'Only 38-43 RL on road',
          'OVER 60% when facing teams with ERA > 4.00',
          'Cover 64% in divisional play',
        ],
        schedule: [
          { opp: 'SD', date: 'Mar 28', line: '-1.5', result: null },
          { opp: '@SF', date: 'Mar 30', line: '-1.5', result: null },
        ],
      },
    },
  }
  
  const sportData = teamMap[sport.toLowerCase()]
  if (!sportData) return null
  return sportData[team.toLowerCase()] || null
}

export default function TeamDetailPage() {
  const params = useParams()
  const sport = params.sport as string
  const team = params.team as string
  
  const [activeTab, setActiveTab] = useState<'overview' | 'trends' | 'schedule'>('overview')
  
  const teamData = getTeamData(sport, team)
  
  if (!teamData) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#050508' }}>
        <div className="text-center">
          <p className="text-6xl mb-4">🤷</p>
          <h1 className="text-2xl font-bold mb-2" style={{ color: '#FFF' }}>Team Not Found</h1>
          <p className="mb-4" style={{ color: '#808090' }}>We don&apos;t have data for this team yet.</p>
          <Link href={`/${sport}`} className="text-sm font-bold" style={{ color: '#00A8FF' }}>
            ← Back to {sport.toUpperCase()}
          </Link>
        </div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen" style={{ background: '#050508' }}>
      {/* Hero */}
      <section className="relative overflow-hidden" style={{ background: 'linear-gradient(180deg, #0a0a12 0%, #050508 100%)' }}>
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full opacity-15 blur-[100px] pointer-events-none" 
               style={{ background: teamData.isHot ? 'radial-gradient(circle, #00FF88 0%, transparent 70%)' : 'radial-gradient(circle, #00A8FF 0%, transparent 70%)' }} />
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
          <Link href={`/${sport}`} className="inline-flex items-center gap-2 mb-4 text-sm transition-all hover:opacity-80" style={{ color: '#808090' }}>
            <ArrowLeft className="w-4 h-4" />
            Back to {sport.toUpperCase()}
          </Link>
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <span className="text-6xl">{teamData.emoji}</span>
            <div>
              <h1 className="text-4xl font-black" style={{ color: '#FFF' }}>{teamData.city} {teamData.name}</h1>
              <p className="text-sm" style={{ color: '#808090' }}>{teamData.conference} • {teamData.record}</p>
            </div>
            {teamData.isHot && (
              <div className="flex items-center gap-1 px-3 py-1.5 rounded-full" style={{ background: 'rgba(0,255,136,0.2)', border: '1px solid rgba(0,255,136,0.3)' }}>
                <Flame className="w-4 h-4" style={{ color: '#00FF88' }} />
                <span className="text-xs font-bold" style={{ color: '#00FF88' }}>HOT {teamData.streak}</span>
              </div>
            )}
          </div>
          
          {/* Quick Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
            <QuickStat 
              label={sport === 'nhl' ? 'Puckline' : sport === 'mlb' ? 'Runline' : 'ATS'} 
              value={`${teamData.ats.wins}-${teamData.ats.losses}`} 
              pct={teamData.ats.pct}
            />
            <QuickStat label="O/U" value={`${teamData.ou.overs}-${teamData.ou.unders}`} pct={teamData.ou.pct} isOU />
            <QuickStat label="Moneyline" value={`${teamData.ml.wins}-${teamData.ml.losses}`} pct={teamData.ml.pct} />
            <div className="p-4 rounded-xl text-center" style={{ background: '#0c0c14', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: '#606070' }}>Streak</div>
              <div className="text-2xl font-black" style={{ color: teamData.streak.startsWith('W') ? '#00FF88' : '#FF4455' }}>{teamData.streak}</div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Tabs */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-2 mb-6">
          {(['overview', 'trends', 'schedule'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="px-4 py-2 rounded-lg text-sm font-semibold capitalize transition-all"
              style={{
                background: activeTab === tab ? 'rgba(0,168,255,0.2)' : 'rgba(255,255,255,0.05)',
                color: activeTab === tab ? '#00A8FF' : '#808090',
                border: activeTab === tab ? '1px solid rgba(0,168,255,0.3)' : '1px solid rgba(255,255,255,0.1)',
              }}
            >
              {tab}
            </button>
          ))}
        </div>
        
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {activeTab === 'overview' && (
              <>
                {/* AI Summary */}
                <div className="rounded-2xl p-5" style={{ background: 'rgba(155,89,182,0.1)', border: '1px solid rgba(155,89,182,0.3)' }}>
                  <div className="flex items-center gap-2 mb-3">
                    <Brain className="w-5 h-5" style={{ color: '#9B59B6' }} />
                    <h2 className="font-bold" style={{ color: '#9B59B6' }}>AI Analysis</h2>
                  </div>
                  <p className="text-sm leading-relaxed" style={{ color: '#E0E0E0' }}>{teamData.aiSummary}</p>
                </div>
                
                {/* Situational Splits */}
                <div className="rounded-2xl overflow-hidden" style={{ background: '#0c0c14', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="p-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <h2 className="font-bold" style={{ color: '#FFF' }}>Situational Splits</h2>
                  </div>
                  <div className="grid sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                    <div className="p-4 space-y-3">
                      <SplitRow icon={<Home className="w-4 h-4" />} label="Home" value={teamData.homeAts} />
                      <SplitRow icon={<Plane className="w-4 h-4" />} label="Away" value={teamData.awayAts} />
                      <SplitRow icon={<TrendingUp className="w-4 h-4" />} label="As Favorite" value={teamData.favAts} />
                    </div>
                    <div className="p-4 space-y-3">
                      <SplitRow icon={<TrendingDown className="w-4 h-4" />} label="As Underdog" value={teamData.dogAts} />
                      <SplitRow icon={<Clock className="w-4 h-4" />} label="Primetime" value={teamData.primetimeAts} />
                      <SplitRow icon={<Trophy className="w-4 h-4" />} label="Divisional" value={teamData.divisionalAts} />
                    </div>
                  </div>
                </div>
              </>
            )}
            
            {activeTab === 'trends' && (
              <div className="rounded-2xl overflow-hidden" style={{ background: '#0c0c14', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="p-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <h2 className="font-bold" style={{ color: '#FFF' }}>Betting Trends</h2>
                </div>
                <div className="p-4 space-y-3">
                  {teamData.trends.map((trend: string, idx: number) => (
                    <div key={idx} className="flex items-start gap-3 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)' }}>
                      <Zap className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#FF6B00' }} />
                      <span className="text-sm" style={{ color: '#E0E0E0' }}>{trend}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {activeTab === 'schedule' && (
              <div className="rounded-2xl overflow-hidden" style={{ background: '#0c0c14', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="p-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <h2 className="font-bold" style={{ color: '#FFF' }}>Recent & Upcoming</h2>
                </div>
                <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.03)' }}>
                  {teamData.schedule.map((game: any, idx: number) => (
                    <div key={idx} className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="font-bold" style={{ color: '#FFF' }}>{game.opp}</span>
                        <span className="text-xs" style={{ color: '#808090' }}>{game.date}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm" style={{ color: '#808090' }}>{game.line}</span>
                        {game.result && (
                          <span className="px-2 py-1 rounded text-xs font-bold"
                                style={{ 
                                  background: game.result === 'W' ? 'rgba(0,255,136,0.2)' : 'rgba(255,68,85,0.2)',
                                  color: game.result === 'W' ? '#00FF88' : '#FF4455'
                                }}>
                            {game.result}
                          </span>
                        )}
                        {!game.result && (
                          <span className="px-2 py-1 rounded text-xs font-bold" style={{ background: 'rgba(255,215,0,0.2)', color: '#FFD700' }}>
                            UPCOMING
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          {/* Sidebar */}
          <div className="space-y-6">
            {/* Recommendation */}
            <div className="rounded-2xl p-5" style={{ background: teamData.ats.pct >= 55 ? 'rgba(0,255,136,0.1)' : teamData.ats.pct <= 45 ? 'rgba(255,68,85,0.1)' : 'rgba(255,215,0,0.1)', border: `1px solid ${teamData.ats.pct >= 55 ? 'rgba(0,255,136,0.3)' : teamData.ats.pct <= 45 ? 'rgba(255,68,85,0.3)' : 'rgba(255,215,0,0.3)'}` }}>
              <div className="flex items-center gap-2 mb-3">
                <Target className="w-5 h-5" style={{ color: teamData.ats.pct >= 55 ? '#00FF88' : teamData.ats.pct <= 45 ? '#FF4455' : '#FFD700' }} />
                <h2 className="font-bold" style={{ color: teamData.ats.pct >= 55 ? '#00FF88' : teamData.ats.pct <= 45 ? '#FF4455' : '#FFD700' }}>
                  {teamData.ats.pct >= 55 ? 'FOLLOW' : teamData.ats.pct <= 45 ? 'FADE' : 'SELECTIVE'}
                </h2>
              </div>
              <p className="text-sm" style={{ color: '#E0E0E0' }}>
                {teamData.ats.pct >= 55 
                  ? `${teamData.name} are a top betting team. Back them especially in the situations highlighted above.`
                  : teamData.ats.pct <= 45
                  ? `${teamData.name} are a fade candidate. Consider betting against them, especially on the road.`
                  : `${teamData.name} are average ATS. Be selective based on situational spots.`}
              </p>
            </div>
            
            {/* Best Bet */}
            <div className="rounded-2xl p-5" style={{ background: '#0c0c14', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="flex items-center gap-2 mb-3">
                <Zap className="w-5 h-5" style={{ color: '#FF6B00' }} />
                <h2 className="font-bold" style={{ color: '#FFF' }}>Best Spot</h2>
              </div>
              <div className="p-3 rounded-xl" style={{ background: 'rgba(255,107,0,0.1)', border: '1px solid rgba(255,107,0,0.2)' }}>
                <p className="text-sm font-bold" style={{ color: '#FF6B00' }}>
                  {teamData.homeAts.split('-')[0] > teamData.awayAts.split('-')[0] 
                    ? `${teamData.name} at Home` 
                    : `${teamData.name} on the Road`}
                </p>
                <p className="text-xs mt-1" style={{ color: '#808090' }}>
                  {teamData.homeAts.split('-')[0] > teamData.awayAts.split('-')[0]
                    ? `${teamData.homeAts} ATS at home`
                    : `${teamData.awayAts} ATS on road`}
                </p>
              </div>
            </div>
            
            {/* Related Teams */}
            <div className="rounded-2xl p-5" style={{ background: '#0c0c14', border: '1px solid rgba(255,255,255,0.06)' }}>
              <h2 className="font-bold mb-3" style={{ color: '#FFF' }}>More {sport.toUpperCase()} Teams</h2>
              <div className="space-y-2">
                <Link href={`/team/${sport}/det`} className="flex items-center justify-between p-2 rounded-lg transition-all hover:bg-white/5">
                  <div className="flex items-center gap-2">
                    <span>🦁</span>
                    <span className="text-sm" style={{ color: '#FFF' }}>Lions</span>
                  </div>
                  <ChevronRight className="w-4 h-4" style={{ color: '#606070' }} />
                </Link>
                <Link href={`/team/${sport}/kc`} className="flex items-center justify-between p-2 rounded-lg transition-all hover:bg-white/5">
                  <div className="flex items-center gap-2">
                    <span>🏈</span>
                    <span className="text-sm" style={{ color: '#FFF' }}>Chiefs</span>
                  </div>
                  <ChevronRight className="w-4 h-4" style={{ color: '#606070' }} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

function QuickStat({ label, value, pct, isOU = false }: { label: string; value: string; pct: number; isOU?: boolean }) {
  const color = pct >= 55 ? '#00FF88' : pct >= 50 ? '#FFD700' : '#FF4455'
  return (
    <div className="p-4 rounded-xl text-center" style={{ background: '#0c0c14', border: '1px solid rgba(255,255,255,0.06)' }}>
      <div className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: '#606070' }}>{label}</div>
      <div className="text-2xl font-black" style={{ color }}>{value}</div>
      <div className="text-xs" style={{ color }}>{pct.toFixed(1)}% {isOU ? 'Over' : ''}</div>
    </div>
  )
}

function SplitRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  const [wins, losses] = value.split('-').map(Number)
  const pct = wins / (wins + losses) * 100
  const color = pct >= 60 ? '#00FF88' : pct >= 50 ? '#FFD700' : '#FF4455'
  
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span style={{ color: '#606070' }}>{icon}</span>
        <span className="text-sm" style={{ color: '#A0A0B0' }}>{label}</span>
      </div>
      <span className="font-bold text-sm" style={{ color }}>{value}</span>
    </div>
  )
}
