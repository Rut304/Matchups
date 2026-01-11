'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Database,
  Server,
  Globe,
  Clock,
  Zap,
  RefreshCw,
  FileText,
  Code,
  Network,
  Layers,
  Shield,
  Terminal,
  BookOpen,
  Copy,
  Check,
  ChevronDown,
  ChevronRight,
  ExternalLink
} from 'lucide-react'

type Tab = 'overview' | 'data-flow' | 'api' | 'database' | 'cron' | 'troubleshooting'

export default function AdminArchitecturePage() {
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['overview']))

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedCode(id)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  const toggleSection = (id: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const tabs = [
    { id: 'overview' as Tab, label: 'Overview', icon: Layers },
    { id: 'data-flow' as Tab, label: 'Data Flow', icon: Network },
    { id: 'api' as Tab, label: 'API Routes', icon: Server },
    { id: 'database' as Tab, label: 'Database', icon: Database },
    { id: 'cron' as Tab, label: 'Cron Jobs', icon: Clock },
    { id: 'troubleshooting' as Tab, label: 'Troubleshooting', icon: Terminal },
  ]

  return (
    <div className="min-h-screen" style={{ background: '#050508' }}>
      {/* Header */}
      <div className="sticky top-0 z-50 border-b" style={{ background: '#0a0a12', borderColor: 'rgba(255,255,255,0.1)' }}>
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link 
                href="/admin" 
                className="p-2 rounded-lg transition-colors hover:bg-white/5"
              >
                <ArrowLeft className="w-5 h-5 text-gray-400" />
              </Link>
              <div>
                <h1 className="text-xl font-bold text-white flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-blue-400" />
                  System Architecture
                </h1>
                <p className="text-sm text-gray-500">Technical documentation & data flow</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">Last Updated: Jan 11, 2026</span>
            </div>
          </div>
        </div>
        
        {/* Tabs */}
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto pb-1">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-white/10 text-white border-b-2 border-blue-500'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Architecture Diagram */}
            <div className="rounded-xl p-6" style={{ background: '#0c0c14', border: '1px solid rgba(255,255,255,0.1)' }}>
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Layers className="w-5 h-5 text-purple-400" />
                System Architecture
              </h2>
              <pre className="text-xs text-gray-300 overflow-x-auto font-mono bg-black/50 p-4 rounded-lg">
{`┌─────────────────────────────────────────────────────────────────────────────┐
│                           MATCHUPS ARCHITECTURE                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌───────────┐ │
│  │   ESPN API   │    │  Odds API    │    │  Twitter/X   │    │ Polymarket│ │
│  │   (Games)    │    │  (Lines)     │    │  (News)      │    │ (Markets) │ │
│  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘    └─────┬─────┘ │
│         │                   │                   │                  │        │
│         ▼                   ▼                   ▼                  ▼        │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                    NEXT.JS API ROUTES (/api/*)                        │  │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────────────┐ │  │
│  │  │ /games  │ │ /odds   │ │ /news   │ │/markets │ │ /cron/* (8 jobs)│ │  │
│  │  └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘ └────────┬────────┘ │  │
│  └───────┼───────────┼───────────┼───────────┼───────────────┼──────────┘  │
│          │           │           │           │               │             │
│          ▼           ▼           ▼           ▼               ▼             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                         SUPABASE (PostgreSQL)                         │  │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────────────┐ │  │
│  │  │ games   │ │  odds   │ │ cappers │ │ markets │ │ historical_data │ │  │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────────────┘ │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                    │                                        │
│                                    ▼                                        │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                         FRONTEND (Next.js 16)                         │  │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────────────┐ │  │
│  │  │ Sports  │ │ Edge    │ │ Leader- │ │ Markets │ │ Dashboard       │ │  │
│  │  │ Pages   │ │ Finder  │ │ board   │ │         │ │                 │ │  │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────────────┘ │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘`}
              </pre>
            </div>

            {/* External Data Sources */}
            <div className="rounded-xl p-6" style={{ background: '#0c0c14', border: '1px solid rgba(255,255,255,0.1)' }}>
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Globe className="w-5 h-5 text-green-400" />
                External Data Sources
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { name: 'ESPN API', type: 'Free', purpose: 'Games, scores, standings, injuries', cache: '30s-1hr' },
                  { name: 'The Odds API', type: '500 req/mo', purpose: 'Betting odds from 40+ sportsbooks', cache: '5min' },
                  { name: 'Twitter/X API', type: 'Rate Limited', purpose: 'Social sentiment, breaking news', cache: '5min' },
                  { name: 'Polymarket', type: 'Free', purpose: 'Sports prediction markets', cache: '5min' },
                  { name: 'Kalshi', type: 'Free', purpose: 'Event contracts', cache: '5min' },
                ].map(api => (
                  <div key={api.name} className="p-4 rounded-lg bg-white/5">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-white">{api.name}</span>
                      <span className="text-xs px-2 py-1 rounded bg-blue-500/20 text-blue-400">{api.type}</span>
                    </div>
                    <p className="text-sm text-gray-400 mb-2">{api.purpose}</p>
                    <p className="text-xs text-gray-500">Cache: {api.cache}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Links */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link href="/admin/health" className="p-4 rounded-xl transition-all hover:scale-[1.02]" style={{ background: '#0c0c14', border: '1px solid rgba(255,255,255,0.1)' }}>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-500/20">
                    <Shield className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">Health Check</h3>
                    <p className="text-sm text-gray-400">Service status</p>
                  </div>
                </div>
              </Link>
              <Link href="/admin/diagnostics" className="p-4 rounded-xl transition-all hover:scale-[1.02]" style={{ background: '#0c0c14', border: '1px solid rgba(255,255,255,0.1)' }}>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-500/20">
                    <Terminal className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">Diagnostics</h3>
                    <p className="text-sm text-gray-400">Run tests</p>
                  </div>
                </div>
              </Link>
              <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer" className="p-4 rounded-xl transition-all hover:scale-[1.02]" style={{ background: '#0c0c14', border: '1px solid rgba(255,255,255,0.1)' }}>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-orange-500/20">
                    <Database className="w-5 h-5 text-orange-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white flex items-center gap-1">
                      Supabase <ExternalLink className="w-3 h-3" />
                    </h3>
                    <p className="text-sm text-gray-400">Database admin</p>
                  </div>
                </div>
              </a>
            </div>
          </div>
        )}

        {activeTab === 'data-flow' && (
          <div className="space-y-6">
            {/* Edge Cards Flow */}
            <CollapsibleSection
              id="edge-flow"
              title="Homepage Edge Cards"
              icon={Zap}
              color="orange"
              isOpen={expandedSections.has('edge-flow')}
              onToggle={() => toggleSection('edge-flow')}
            >
              <pre className="text-xs text-gray-300 overflow-x-auto font-mono bg-black/50 p-4 rounded-lg">
{`1. Page Load
   └─► EdgeDashboardWithFiltersWrapper (Server Component)

2. Data Fetch
   └─► GET /api/edges/today?limit=12&minScore=60

3. API Route Processing
   ├─► Fetch games from ESPN
   ├─► Fetch odds from The Odds API
   ├─► Fetch betting splits from Supabase
   └─► Run edge detection algorithm

4. Edge Detection Algorithm (ai-edge-analysis.ts)
   ├─► Calculate line movement (RLM detection)
   ├─► Compare public vs sharp money
   ├─► Match historical trends
   ├─► Score confidence (0-100)
   └─► Return sorted edges

5. Render
   └─► EdgeDashboardFiltered (Client Component)
       └─► EdgeCard components with filters`}
              </pre>
            </CollapsibleSection>

            {/* Matchups Flow */}
            <CollapsibleSection
              id="matchups-flow"
              title="Sport Matchups Pages"
              icon={Globe}
              color="blue"
              isOpen={expandedSections.has('matchups-flow')}
              onToggle={() => toggleSection('matchups-flow')}
            >
              <pre className="text-xs text-gray-300 overflow-x-auto font-mono bg-black/50 p-4 rounded-lg">
{`1. Page Load
   └─► /nfl/matchups (Client Component)

2. useEffect Data Fetch
   └─► GET /api/games?sport=nfl

3. API Route Processing (/api/games)
   ├─► Check cache (30 second TTL)
   ├─► If miss: ESPN API /scoreboard?sport=football
   ├─► If miss: Odds API /odds?sport=americanfootball
   └─► Merge & normalize response

4. Data Structure
   {
     games: [
       {
         id, status, scheduledAt, venue, broadcast,
         homeTeam: { id, name, abbrev, logo, score },
         awayTeam: { id, name, abbrev, logo, score },
         odds: { spread, total, homeML, awayML }
       }
     ]
   }

5. Auto-Refresh
   └─► setInterval(fetchGames, 60000) // 1 minute`}
              </pre>
            </CollapsibleSection>

            {/* Leaderboard Flow */}
            <CollapsibleSection
              id="leaderboard-flow"
              title="Leaderboard"
              icon={Database}
              color="purple"
              isOpen={expandedSections.has('leaderboard-flow')}
              onToggle={() => toggleSection('leaderboard-flow')}
            >
              <pre className="text-xs text-gray-300 overflow-x-auto font-mono bg-black/50 p-4 rounded-lg">
{`1. Page Load
   └─► /leaderboard (Server Component)

2. Data Fetch
   └─► GET /api/leaderboard
       └─► Supabase query:
           SELECT c.*, cs.*
           FROM cappers c
           JOIN capper_stats cs ON c.id = cs.capper_id
           ORDER BY cs.net_units DESC

3. Filtering/Sorting (Client-side)
   ├─► By sport (All, NFL, NBA, NHL, MLB)
   ├─► By timeframe (7d, 30d, Season, All-time)
   └─► By metric (Units, Win%, ROI)`}
              </pre>
            </CollapsibleSection>
          </div>
        )}

        {activeTab === 'api' && (
          <div className="space-y-6">
            {/* API Routes Table */}
            <div className="rounded-xl overflow-hidden" style={{ background: '#0c0c14', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div className="p-4 border-b border-white/10">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Server className="w-5 h-5 text-blue-400" />
                  API Routes
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10 text-left">
                      <th className="px-4 py-3 text-xs font-semibold text-gray-400">Route</th>
                      <th className="px-4 py-3 text-xs font-semibold text-gray-400">Method</th>
                      <th className="px-4 py-3 text-xs font-semibold text-gray-400">Description</th>
                      <th className="px-4 py-3 text-xs font-semibold text-gray-400">Source</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {[
                      { route: '/api/games', method: 'GET', desc: 'All games by sport/date', source: 'ESPN + Odds' },
                      { route: '/api/games/[id]', method: 'GET', desc: 'Single game details', source: 'ESPN + Odds' },
                      { route: '/api/scores', method: 'GET', desc: 'Live scores', source: 'ESPN' },
                      { route: '/api/live', method: 'GET', desc: 'In-progress games', source: 'ESPN' },
                      { route: '/api/odds', method: 'GET', desc: 'Current betting odds', source: 'The Odds API' },
                      { route: '/api/edges/today', method: 'GET', desc: 'Today\'s top edges', source: 'Algorithm' },
                      { route: '/api/leaderboard', method: 'GET', desc: 'Top cappers', source: 'Supabase' },
                      { route: '/api/markets', method: 'GET', desc: 'Prediction markets', source: 'Polymarket' },
                      { route: '/api/health', method: 'GET', desc: 'System health check', source: 'Internal' },
                    ].map((api, i) => (
                      <tr key={i} className="border-b border-white/5 hover:bg-white/5">
                        <td className="px-4 py-3 font-mono text-blue-400">{api.route}</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-1 text-xs rounded bg-green-500/20 text-green-400">{api.method}</span>
                        </td>
                        <td className="px-4 py-3 text-gray-300">{api.desc}</td>
                        <td className="px-4 py-3 text-gray-500">{api.source}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'database' && (
          <div className="space-y-6">
            {/* Database Schema */}
            <div className="rounded-xl p-6" style={{ background: '#0c0c14', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Database className="w-5 h-5 text-orange-400" />
                  Database Tables
                </h2>
                <a 
                  href="https://supabase.com/dashboard/project/cdfdmkntdsfylososgwo/editor" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1"
                >
                  Open in Supabase <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { name: 'cappers', desc: 'Capper profiles', cols: 'id, slug, name, capper_type, verified' },
                  { name: 'capper_stats', desc: 'Aggregated stats', cols: 'capper_id, total_picks, win_pct, net_units' },
                  { name: 'picks', desc: 'Individual picks', cols: 'capper_id, game_id, pick, odds, result' },
                  { name: 'games', desc: 'Game schedule', cols: 'id, sport, home_team, away_team, status' },
                  { name: 'odds', desc: 'Betting lines', cols: 'game_id, spread, total, home_ml, away_ml' },
                  { name: 'prediction_markets', desc: 'Market data', cols: 'title, yes_price, volume, end_date' },
                ].map(table => (
                  <div key={table.name} className="p-4 rounded-lg bg-white/5">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-mono font-semibold text-orange-400">{table.name}</span>
                    </div>
                    <p className="text-sm text-gray-400 mb-2">{table.desc}</p>
                    <p className="text-xs text-gray-500 font-mono">{table.cols}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* SQL Fix Scripts */}
            <div className="rounded-xl p-6" style={{ background: '#0c0c14', border: '1px solid rgba(255,255,255,0.1)' }}>
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Code className="w-5 h-5 text-green-400" />
                Fix Scripts
              </h2>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-white">Fix Leaderboard Relationship</span>
                    <button
                      onClick={() => copyToClipboard(
                        `-- Run in Supabase SQL Editor
SELECT 'cappers' as tbl, count(*) FROM cappers
UNION ALL SELECT 'capper_stats', count(*) FROM capper_stats;`,
                        'sql-check'
                      )}
                      className="text-xs px-2 py-1 rounded bg-white/10 text-gray-300 hover:bg-white/20 flex items-center gap-1"
                    >
                      {copiedCode === 'sql-check' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      Copy
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mb-2">
                    If leaderboard shows errors, run <code className="text-orange-400">fix-leaderboard.sql</code> in Supabase
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'cron' && (
          <div className="space-y-6">
            {/* Cron Jobs */}
            <div className="rounded-xl p-6" style={{ background: '#0c0c14', border: '1px solid rgba(255,255,255,0.1)' }}>
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-cyan-400" />
                Scheduled Jobs
              </h2>
              <div className="space-y-3">
                {[
                  { route: '/api/cron/update-scores', schedule: 'Every 1 min*', desc: 'Live score updates', active: true },
                  { route: '/api/cron/refresh-scores', schedule: 'Every 2 min*', desc: 'Full score refresh', active: true },
                  { route: '/api/cron/refresh-odds', schedule: 'Every 5 min', desc: 'Fetch latest odds', active: true },
                  { route: '/api/cron/sync-games', schedule: 'Every 15 min', desc: 'Sync game schedule', active: true },
                  { route: '/api/cron/refresh-injuries', schedule: 'Every 6 hrs', desc: 'Update injury reports', active: true },
                  { route: '/api/cron/refresh-standings', schedule: 'Every 6 hrs', desc: 'Update standings', active: true },
                  { route: '/api/cron/grade-picks', schedule: '3x daily', desc: 'Grade completed picks', active: true },
                  { route: '/api/cron/discover-trends', schedule: 'Daily 4AM', desc: 'Run trend discovery', active: true },
                ].map((job, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${job.active ? 'bg-green-500' : 'bg-gray-500'}`} />
                      <div>
                        <code className="text-sm text-cyan-400">{job.route}</code>
                        <p className="text-xs text-gray-500">{job.desc}</p>
                      </div>
                    </div>
                    <span className="text-xs px-2 py-1 rounded bg-white/10 text-gray-400">{job.schedule}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-4">* Only during active game hours</p>
            </div>
          </div>
        )}

        {activeTab === 'troubleshooting' && (
          <div className="space-y-6">
            {/* Common Issues */}
            <div className="rounded-xl p-6" style={{ background: '#0c0c14', border: '1px solid rgba(255,255,255,0.1)' }}>
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Terminal className="w-5 h-5 text-red-400" />
                Common Issues & Fixes
              </h2>
              <div className="space-y-4">
                {[
                  {
                    issue: 'Leaderboard returns 500 error',
                    cause: 'Missing database relationship between capper_stats and cappers',
                    fix: 'Run fix-leaderboard.sql in Supabase SQL Editor'
                  },
                  {
                    issue: 'Odds showing as "N/A"',
                    cause: 'ODDS_API_KEY not configured or rate limited',
                    fix: 'Check Vercel env vars, wait for rate limit reset'
                  },
                  {
                    issue: 'News page rate limited',
                    cause: 'Twitter/X API 429 error',
                    fix: 'Page uses force-dynamic, will recover on next request'
                  },
                  {
                    issue: 'Build fails with timeout',
                    cause: 'API call during static generation',
                    fix: 'Ensure CI=1 bailout is in place for server components'
                  },
                  {
                    issue: 'Edge cards showing demo data',
                    cause: 'Build-time bailout active (normal during deploy)',
                    fix: 'Data will be live after deployment completes'
                  },
                ].map((item, i) => (
                  <div key={i} className="p-4 rounded-lg bg-white/5">
                    <h4 className="font-semibold text-red-400 mb-2">{item.issue}</h4>
                    <p className="text-sm text-gray-400 mb-2"><strong className="text-gray-300">Cause:</strong> {item.cause}</p>
                    <p className="text-sm text-green-400"><strong className="text-gray-300">Fix:</strong> {item.fix}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Environment Variables */}
            <div className="rounded-xl p-6" style={{ background: '#0c0c14', border: '1px solid rgba(255,255,255,0.1)' }}>
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-yellow-400" />
                Required Environment Variables
              </h2>
              <div className="space-y-2 font-mono text-sm">
                {[
                  { key: 'NEXT_PUBLIC_SUPABASE_URL', status: 'required' },
                  { key: 'NEXT_PUBLIC_SUPABASE_ANON_KEY', status: 'required' },
                  { key: 'SUPABASE_SERVICE_ROLE_KEY', status: 'required' },
                  { key: 'ODDS_API_KEY', status: 'required' },
                  { key: 'X_BEARER_TOKEN', status: 'optional' },
                  { key: 'GEMINI_API_KEY', status: 'optional' },
                ].map(env => (
                  <div key={env.key} className="flex items-center justify-between p-2 rounded bg-white/5">
                    <code className="text-yellow-400">{env.key}</code>
                    <span className={`text-xs px-2 py-1 rounded ${
                      env.status === 'required' ? 'bg-red-500/20 text-red-400' : 'bg-gray-500/20 text-gray-400'
                    }`}>
                      {env.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Collapsible Section Component
function CollapsibleSection({
  id,
  title,
  icon: Icon,
  color,
  isOpen,
  onToggle,
  children
}: {
  id: string
  title: string
  icon: React.ElementType
  color: string
  isOpen: boolean
  onToggle: () => void
  children: React.ReactNode
}) {
  const colorClasses: Record<string, string> = {
    orange: 'text-orange-400 bg-orange-500/20',
    blue: 'text-blue-400 bg-blue-500/20',
    purple: 'text-purple-400 bg-purple-500/20',
    green: 'text-green-400 bg-green-500/20',
  }

  return (
    <div className="rounded-xl overflow-hidden" style={{ background: '#0c0c14', border: '1px solid rgba(255,255,255,0.1)' }}>
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
            <Icon className="w-5 h-5" />
          </div>
          <span className="font-semibold text-white">{title}</span>
        </div>
        {isOpen ? <ChevronDown className="w-5 h-5 text-gray-400" /> : <ChevronRight className="w-5 h-5 text-gray-400" />}
      </button>
      {isOpen && (
        <div className="p-4 pt-0">
          {children}
        </div>
      )}
    </div>
  )
}
