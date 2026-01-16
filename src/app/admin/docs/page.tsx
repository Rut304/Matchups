'use client'

import { useState } from 'react'
import Link from 'next/link'
import { 
  ArrowLeft, Server, GitBranch, Layers, Database, Globe, Zap, 
  Users, BarChart3, Activity, Shield, Clock, Code, RefreshCw,
  CheckCircle, Play, Workflow, BookOpen, ExternalLink, Copy
} from 'lucide-react'

export default function AdminDocsPage() {
  const [copiedCommand, setCopiedCommand] = useState<string | null>(null)
  
  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedCommand(id)
    setTimeout(() => setCopiedCommand(null), 2000)
  }

  return (
    <div className="min-h-screen" style={{ background: '#050508' }}>
      {/* Header */}
      <section className="border-b" style={{ borderColor: 'rgba(255,255,255,0.06)', background: '#0a0a12' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Link href="/admin" className="flex items-center gap-2 text-sm mb-4" style={{ color: '#808090' }}>
            <ArrowLeft style={{ width: '16px', height: '16px' }} />
            Back to Admin
          </Link>
          <h1 className="text-3xl font-black" style={{ color: '#FFF' }}>📄 Matchups Documentation</h1>
          <p style={{ color: '#808090' }}>Complete technical reference, workflow diagrams, and system architecture</p>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Table of Contents */}
        <div className="rounded-2xl p-6 mb-8" style={{ background: '#0c0c14', border: '1px solid rgba(255,107,0,0.3)' }}>
          <div className="flex items-center gap-2 mb-4">
            <BookOpen style={{ color: '#FF6B00', width: '24px', height: '24px' }} />
            <h2 className="text-xl font-bold" style={{ color: '#FFF' }}>Table of Contents</h2>
          </div>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
            {[
              { label: '🌐 Production URL', href: '#production' },
              { label: '🏗️ System Architecture', href: '#architecture' },
              { label: '📊 Data Flow Diagram', href: '#dataflow' },
              { label: '💾 Database Schema', href: '#database' },
              { label: '📁 Project Structure', href: '#structure' },
              { label: '🔌 API & Data Sources', href: '#apis' },
              { label: '✨ Features Overview', href: '#features' },
              { label: '⚙️ Tech Stack', href: '#techstack' },
              { label: '� Recent Updates', href: '#changelog' },
              { label: '�🚀 Deployment', href: '#deployment' },
            ].map(item => (
              <a key={item.href} href={item.href} 
                 className="px-4 py-2 rounded-lg text-sm hover:bg-white/5 transition-colors"
                 style={{ background: 'rgba(255,255,255,0.02)', color: '#A0A0B0' }}>
                {item.label}
              </a>
            ))}
          </div>
        </div>
        
        {/* Production URL */}
        <div id="production" className="rounded-2xl p-6 mb-8" style={{ background: '#0c0c14', border: '1px solid rgba(0,255,136,0.3)' }}>
          <div className="flex items-center gap-2 mb-4">
            <Globe style={{ color: '#00FF88', width: '24px', height: '24px' }} />
            <h2 className="text-xl font-bold" style={{ color: '#FFF' }}>🌐 Production URL</h2>
          </div>
          <div className="p-4 rounded-lg font-mono text-lg" style={{ background: 'rgba(0,255,136,0.1)' }}>
            <a href="https://matchups-eta.vercel.app" target="_blank" rel="noopener noreferrer"
               className="flex items-center gap-2" style={{ color: '#00FF88' }}>
              https://matchups-eta.vercel.app
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
          <p className="mt-3 text-sm" style={{ color: '#808090' }}>
            Deployed on Vercel Edge Network with automatic CI/CD from GitHub.
          </p>
        </div>

        {/* System Architecture Flowchart */}
        <div id="architecture" className="rounded-2xl p-6 mb-8" style={{ background: '#0c0c14', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-2 mb-6">
            <Workflow style={{ color: '#FF6B00', width: '24px', height: '24px' }} />
            <h2 className="text-xl font-bold" style={{ color: '#FFF' }}>🏗️ System Architecture Flowchart</h2>
          </div>
          
          <div className="p-4 rounded-xl font-mono text-xs sm:text-sm overflow-x-auto" style={{ background: 'rgba(255,255,255,0.02)' }}>
            <pre style={{ color: '#A0A0B0' }}>
{`
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                              MATCHUPS SYSTEM ARCHITECTURE                                │
└─────────────────────────────────────────────────────────────────────────────────────────┘

                              ┌─────────────────────┐
                              │    USER BROWSER     │
                              │  (Mobile/Desktop)   │
                              └──────────┬──────────┘
                                         │
                                         │ HTTPS Request
                                         ▼
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                   VERCEL EDGE NETWORK                                    │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐   │
│  │   CDN Cache     │  │   Edge Runtime  │  │  ISR Rendering  │  │ Image Optimizer │   │
│  │  (Static SSG)   │  │  (SSR/API)      │  │  (Incremental)  │  │   (next/image)  │   │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  └─────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────────────────┘
                                         │
                        ┌────────────────┴────────────────┐
                        │                                  │
                        ▼                                  ▼
┌─────────────────────────────────────┐    ┌─────────────────────────────────────┐
│         NEXT.JS APP ROUTER          │    │          EXTERNAL APIS              │
│  ┌───────────────────────────────┐  │    │  ┌───────────────────────────────┐  │
│  │     Server Components        │  │    │  │     ESPN Sports API           │  │
│  │  • Data fetching at edge     │  │    │  │  • Live game scores           │  │
│  │  • SEO optimized rendering   │  │    │  │  • Schedules & standings      │  │
│  │  • No client JS overhead     │  │    │  │  • Team/player data           │  │
│  └───────────────────────────────┘  │    │  └───────────────────────────────┘  │
│  ┌───────────────────────────────┐  │    │  ┌───────────────────────────────┐  │
│  │     Client Components        │  │    │  │     The Odds API              │  │
│  │  • Interactive UI elements   │  │    │  │  • Real-time betting odds     │  │
│  │  • React hooks & state       │  │    │  │  • Line movements             │  │
│  │  • Live polling/refresh      │  │    │  │  • Multiple sportsbooks       │  │
│  └───────────────────────────────┘  │    │  └───────────────────────────────┘  │
│  ┌───────────────────────────────┐  │    │  ┌───────────────────────────────┐  │
│  │      API Routes              │  │    │  │     Polymarket API            │  │
│  │  • /api/games                │  │    │  │  • Prediction markets         │  │
│  │  • /api/odds                 │  │    │  │  • Political & sports events  │  │
│  │  • /api/cappers              │  │    │  │  • Real-time odds             │  │
│  └───────────────────────────────┘  │    │  └───────────────────────────────┘  │
└─────────────────────────────────────┘    │  ┌───────────────────────────────┐  │
                        │                   │  │     Kalshi API                │  │
                        │                   │  │  • Event contracts            │  │
                        │                   │  │  • Market data                │  │
                        │                   │  │  • Trading volume             │  │
                        │                   │  └───────────────────────────────┘  │
                        ▼                   └─────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                SUPABASE (PostgreSQL)                                     │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐   │
│  │     cappers     │  │      picks      │  │   capper_stats  │  │  site_settings  │   │
│  │  • 124+ pros    │  │  • 15k+ picks   │  │  • Live stats   │  │  • Edge toggles │   │
│  │  • Profiles     │  │  • Historical   │  │  • Auto-calc    │  │  • AI configs   │   │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  └─────────────────┘   │
│                                                                                          │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐   │
│  │                         PostgreSQL Triggers & Functions                          │   │
│  │   picks_stats_update: Auto-recalculate win_rate, ROI, streak on pick insert     │   │
│  └─────────────────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────────────────┘
`}
            </pre>
          </div>
        </div>

        {/* Data Flow Diagram */}
        <div id="dataflow" className="rounded-2xl p-6 mb-8" style={{ background: '#0c0c14', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-2 mb-6">
            <Activity style={{ color: '#00FF88', width: '24px', height: '24px' }} />
            <h2 className="text-xl font-bold" style={{ color: '#FFF' }}>📊 Data Flow Diagram</h2>
          </div>
          
          <div className="p-4 rounded-xl font-mono text-xs sm:text-sm overflow-x-auto" style={{ background: 'rgba(255,255,255,0.02)' }}>
            <pre style={{ color: '#A0A0B0' }}>
{`
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                              USER JOURNEY DATA FLOW                                      │
└─────────────────────────────────────────────────────────────────────────────────────────┘

STEP 1: User visits /nfl or /nba or /leaderboard
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   User Request                  Next.js App Router              Vercel Edge
   ───────────►                  ─────────────────►              ────────────►
                                 Route matching:                  Cache check:
                                 • /nfl → page.tsx               • Hit: Return cached
                                 • Server Component               • Miss: SSR render

STEP 2: Data Fetching (Server Components)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   ┌────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
   │  page.tsx  │ ──► │  useGames()  │ ──► │  ESPN API    │ ──► │  Live Scores │
   │  (SSR)     │     │  hook        │     │  Fetch       │     │  + Odds      │
   └────────────┘     └──────────────┘     └──────────────┘     └──────────────┘
         │
         │            ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
         └──────────► │ getCappers() │ ──► │  Supabase    │ ──► │ Leaderboard  │
                      │  server fn   │     │  Query       │     │  Rankings    │
                      └──────────────┘     └──────────────┘     └──────────────┘

STEP 3: Client Hydration & Interactivity
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   Server HTML ──► Browser Render ──► React Hydration ──► Interactive UI
        │                                                       │
        └───── Static shell loads instantly (good LCP) ────────┘
                                                                │
                                                                ▼
   ┌─────────────────────────────────────────────────────────────────────────┐
   │                        CLIENT INTERACTIVITY                              │
   │  • Filter toggles (Sport, Date, Bet Type)                               │
   │  • Sort controls (Win %, ROI, Streak)                                   │
   │  • Live polling for scores (30s intervals)                              │
   │  • Mobile menu navigation                                               │
   │  • Infinite scroll pagination                                           │
   └─────────────────────────────────────────────────────────────────────────┘

STEP 4: Leaderboard Data Pipeline
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   ┌───────────────┐     ┌───────────────┐     ┌───────────────┐
   │   seed-      │     │   picks       │     │   Postgres    │
   │   cappers.ts │ ──► │   table       │ ──► │   Trigger     │
   │   (124 pros) │     │   insert      │     │   (auto-calc) │
   └───────────────┘     └───────────────┘     └───────────────┘
                                                      │
                                                      ▼
                              ┌─────────────────────────────────────┐
                              │         capper_stats table          │
                              │  • total_picks (count)              │
                              │  • win_rate (calculated %)          │
                              │  • total_profit (sum units)         │
                              │  • current_streak (W/L tracking)    │
                              │  • best_streak (max ever)           │
                              └─────────────────────────────────────┘
`}
            </pre>
          </div>
        </div>

        {/* Infrastructure Stack */}
        <div id="techstack" className="rounded-2xl p-6 mb-8" style={{ background: '#0c0c14', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-2 mb-6">
            <Server style={{ color: '#FF6B00', width: '24px', height: '24px' }} />
            <h2 className="text-xl font-bold" style={{ color: '#FFF' }}>⚙️ Technology Stack</h2>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { icon: '⚡', name: 'Next.js 16.1.1', desc: 'App Router, RSC, Server Actions', color: '#FFF', tech: 'react 19, turbopack' },
              { icon: '🔺', name: 'Vercel', desc: 'Edge deployment & hosting', color: '#FFF', tech: 'CDN, ISR, Image Opt' },
              { icon: '🗄️', name: 'Supabase', desc: 'PostgreSQL database', color: '#00FF88', tech: 'PostgREST, Triggers' },
              { icon: '🎨', name: 'Tailwind CSS', desc: 'Utility-first styling', color: '#38BDF8', tech: 'JIT, dark mode' },
              { icon: '📝', name: 'TypeScript', desc: 'Type-safe development', color: '#3178C6', tech: 'strict mode' },
              { icon: '🧪', name: 'Playwright', desc: 'E2E testing framework', color: '#45BA4B', tech: 'multi-browser' },
              { icon: '🔍', name: 'ESLint', desc: 'Code linting', color: '#4B32C3', tech: 'next/core-web-vitals' },
              { icon: '💳', name: 'Stripe', desc: 'Payment processing', color: '#635BFF', tech: 'subscriptions ready' },
              { icon: '🤖', name: 'Gemini AI', desc: 'AI predictions', color: '#FF6B00', tech: 'edge analysis' },
            ].map((tech) => (
              <div key={tech.name} className="p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)' }}>
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{tech.icon}</span>
                  <div>
                    <div className="font-bold" style={{ color: tech.color }}>{tech.name}</div>
                    <div className="text-sm" style={{ color: '#808090' }}>{tech.desc}</div>
                    {tech.tech && <div className="text-xs mt-1" style={{ color: '#606070' }}>{tech.tech}</div>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Features Overview */}
        <div id="features" className="rounded-2xl p-6 mb-8" style={{ background: '#0c0c14', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-2 mb-6">
            <CheckCircle style={{ color: '#00FF88', width: '24px', height: '24px' }} />
            <h2 className="text-xl font-bold" style={{ color: '#FFF' }}>✨ Features Overview</h2>
          </div>
          
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { 
                title: '🏆 Capper Leaderboards', 
                desc: '124+ professional sports bettors ranked by win rate, ROI, and streak',
                viral: true,
                features: ['Real-time stats', 'Sport filters', 'Profile pages', 'Historical picks']
              },
              { 
                title: '📊 Live Odds & Scores', 
                desc: 'Real-time data from ESPN, The Odds API for all major sports',
                features: ['Live score ticker', 'Line movements', 'Multi-book odds', '30s auto-refresh']
              },
              { 
                title: '📈 Prediction Markets', 
                desc: 'Polymarket & Kalshi integration for political and sports events',
                features: ['Real-time prices', 'Volume tracking', 'Market categories', 'Trending events']
              },
              { 
                title: '🎯 Edge Detection', 
                desc: 'AI-powered betting edges and sharp money indicators',
                features: ['Line value alerts', 'Steam moves', 'Sharp action', 'Consensus plays']
              },
              { 
                title: '📱 Mobile-First Design', 
                desc: 'Responsive UI optimized for mobile sports betting experience',
                features: ['Touch-friendly', 'Fast loading', 'PWA ready', 'Dark mode']
              },
              { 
                title: '🔐 Admin Dashboard', 
                desc: 'Full control over site settings, data, and analytics',
                features: ['Seeding tools', 'Edge toggles', 'System status', 'Documentation']
              },
            ].map((feature) => (
              <div key={feature.title} className="p-4 rounded-xl relative" style={{ background: 'rgba(255,255,255,0.02)' }}>
                {feature.viral && (
                  <span className="absolute -top-2 -right-2 px-2 py-1 text-xs font-bold rounded-full bg-green-500/20 text-green-400">
                    VIRAL 🔥
                  </span>
                )}
                <div className="font-bold mb-2" style={{ color: '#FFF' }}>{feature.title}</div>
                <p className="text-sm mb-3" style={{ color: '#808090' }}>{feature.desc}</p>
                <div className="flex flex-wrap gap-2">
                  {feature.features.map(f => (
                    <span key={f} className="px-2 py-1 text-xs rounded" style={{ background: 'rgba(255,255,255,0.05)', color: '#A0A0B0' }}>
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* API & Data Sources */}
        <div id="apis" className="rounded-2xl p-6 mb-8" style={{ background: '#0c0c14', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-2 mb-6">
            <RefreshCw style={{ color: '#FF6B00', width: '24px', height: '24px' }} />
            <h2 className="text-xl font-bold" style={{ color: '#FFF' }}>🔌 API & Data Sources</h2>
          </div>
          
          <div className="space-y-4">
            {[
              {
                name: 'ESPN API',
                url: 'site.api.espn.com',
                provides: ['Live scores', 'Game schedules', 'Team standings', 'Player stats'],
                color: '#FF3366',
                usedBy: ['NFL', 'NBA', 'NHL', 'MLB pages']
              },
              {
                name: 'The Odds API',
                url: 'api.the-odds-api.com',
                provides: ['Betting odds', 'Line movements', 'Multiple sportsbooks', 'Historical lines'],
                color: '#00FF88',
                usedBy: ['All sports pages', 'Edge detection']
              },
              {
                name: 'Polymarket',
                url: 'polymarket.com/api',
                provides: ['Prediction markets', 'Political events', 'Sports futures', 'Real-time prices'],
                color: '#7C3AED',
                usedBy: ['Markets page']
              },
              {
                name: 'Kalshi',
                url: 'api.kalshi.com',
                provides: ['Event contracts', 'Binary options', 'Market depth', 'Settlement data'],
                color: '#3B82F6',
                usedBy: ['Markets page']
              },
              {
                name: 'Supabase (Internal)',
                url: 'supabase.co/project',
                provides: ['Capper profiles', 'Historical picks', 'Site settings', 'Analytics'],
                color: '#00FF88',
                usedBy: ['Leaderboard', 'Admin', 'Profile pages']
              },
            ].map((api) => (
              <div key={api.name} className="p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)' }}>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ background: api.color }} />
                    <span className="font-bold" style={{ color: '#FFF' }}>{api.name}</span>
                  </div>
                  <code className="text-xs px-2 py-1 rounded" style={{ background: 'rgba(255,255,255,0.05)', color: '#606070' }}>
                    {api.url}
                  </code>
                </div>
                <div className="grid sm:grid-cols-2 gap-2 mt-3">
                  <div>
                    <span className="text-xs font-bold" style={{ color: '#808090' }}>PROVIDES:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {api.provides.map(p => (
                        <span key={p} className="px-2 py-0.5 text-xs rounded" style={{ background: `${api.color}20`, color: api.color }}>
                          {p}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <span className="text-xs font-bold" style={{ color: '#808090' }}>USED BY:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {api.usedBy.map(u => (
                        <span key={u} className="px-2 py-0.5 text-xs rounded" style={{ background: 'rgba(255,255,255,0.05)', color: '#A0A0B0' }}>
                          {u}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Workflow Diagram */}
        <div className="rounded-2xl p-6 mb-8" style={{ background: '#0c0c14', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-2 mb-6">
            <GitBranch style={{ color: '#00A8FF', width: '24px', height: '24px' }} />
            <h2 className="text-xl font-bold" style={{ color: '#FFF' }}>Development & Deployment Workflow</h2>
          </div>
          
          {/* Workflow Diagram */}
          <div className="p-6 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)' }}>
            <pre className="text-sm overflow-x-auto" style={{ color: '#A0A0B0' }}>
{`
┌─────────────────────────────────────────────────────────────────────────┐
│                         DEVELOPMENT WORKFLOW                              │
└─────────────────────────────────────────────────────────────────────────┘

  ┌──────────┐      ┌──────────┐      ┌──────────┐      ┌──────────┐
  │  LOCAL   │      │   GIT    │      │  VERCEL  │      │   PROD   │
  │   DEV    │ ───► │  COMMIT  │ ───► │  BUILD   │ ───► │  DEPLOY  │
  └──────────┘      └──────────┘      └──────────┘      └──────────┘
       │                                    │
       │                                    │
       ▼                                    ▼
  ┌──────────┐                        ┌──────────┐
  │ npm run  │                        │  Edge    │
  │   dev    │                        │ Network  │
  │ :3000    │                        │  (CDN)   │
  └──────────┘                        └──────────┘


┌─────────────────────────────────────────────────────────────────────────┐
│                         DATA ARCHITECTURE                                 │
└─────────────────────────────────────────────────────────────────────────┘

  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
  │   EXTERNAL   │     │   SUPABASE   │     │   VERCEL     │
  │    APIs      │     │  PostgreSQL  │     │    EDGE      │
  └──────────────┘     └──────────────┘     └──────────────┘
         │                    │                    │
         │                    │                    │
         ▼                    ▼                    ▼
  ┌──────────────────────────────────────────────────────┐
  │                   Next.js App Router                  │
  │  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐     │
  │  │ Server │  │ Client │  │  API   │  │ Static │     │
  │  │ Comps  │  │ Comps  │  │ Routes │  │ Assets │     │
  │  └────────┘  └────────┘  └────────┘  └────────┘     │
  └──────────────────────────────────────────────────────┘
                          │
                          ▼
  ┌──────────────────────────────────────────────────────┐
  │                    USER BROWSER                       │
  │         React Hydration + Client Interactivity        │
  └──────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────────┐
│                         API INTEGRATIONS                                  │
└─────────────────────────────────────────────────────────────────────────┘

  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
  │  Polymarket │    │   Kalshi    │    │  Sports     │
  │     API     │    │    API      │    │  Data API   │
  └─────────────┘    └─────────────┘    └─────────────┘
         │                 │                  │
         └─────────────────┼──────────────────┘
                           │
                           ▼
                  ┌─────────────────┐
                  │  /api/markets   │
                  │  /api/games     │
                  │  /api/trends    │
                  └─────────────────┘
`}
            </pre>
          </div>
        </div>

        {/* File Structure */}
        <div className="rounded-2xl p-6 mb-8" style={{ background: '#0c0c14', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-2 mb-6">
            <Layers style={{ color: '#FF3366', width: '24px', height: '24px' }} />
            <h2 className="text-xl font-bold" style={{ color: '#FFF' }}>Project Structure</h2>
          </div>
          
          <div className="p-4 rounded-xl font-mono text-sm" style={{ background: 'rgba(255,255,255,0.02)' }}>
            <pre style={{ color: '#A0A0B0' }}>
{`matchups/
├── src/
│   ├── app/
│   │   ├── page.tsx          # Homepage with matchup cards
│   │   ├── layout.tsx        # Root layout with Navbar/Footer
│   │   ├── nfl/page.tsx      # NFL games & trends
│   │   ├── nba/page.tsx      # NBA games & trends
│   │   ├── nhl/page.tsx      # NHL games & trends
│   │   ├── mlb/page.tsx      # MLB games & trends
│   │   ├── markets/page.tsx  # Polymarket/Kalshi markets
│   │   ├── trends/page.tsx   # Betting trends analysis
│   │   ├── leaderboard/      # 🏆 Cappers leaderboard (VIRAL)
│   │   └── admin/
│   │       ├── page.tsx      # Admin dashboard
│   │       └── docs/page.tsx # This documentation
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Navbar.tsx    # Top navigation
│   │   │   └── Footer.tsx    # Footer with admin link
│   │   └── ui/               # Reusable UI components
│   └── lib/
│       └── utils.ts          # Utility functions
├── supabase/
│   └── schema.sql            # Database schema
├── tests/
│   └── e2e/                  # Playwright E2E tests
├── .env.local                # Environment variables
└── vercel.json               # Vercel config`}
            </pre>
          </div>
        </div>

        {/* Database Schema */}
        <div className="rounded-2xl p-6 mb-8" style={{ background: '#0c0c14', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-2 mb-6">
            <Database style={{ color: '#00FF88', width: '24px', height: '24px' }} />
            <h2 className="text-xl font-bold" style={{ color: '#FFF' }}>Database Tables (Supabase)</h2>
          </div>
          
          <div className="grid md:grid-cols-2 gap-4">
            {[
              { name: 'games', desc: 'All sports matchups with odds', fields: 'id, sport, teams, spread, total, ml' },
              { name: 'picks', desc: 'AI and user predictions', fields: 'id, game_id, pick, confidence, result' },
              { name: 'trends', desc: 'Betting trends data', fields: 'id, sport, description, record, roi' },
              { name: 'markets', desc: 'Polymarket/Kalshi markets', fields: 'id, question, yes_price, volume' },
              { name: 'users', desc: 'Capper profiles', fields: 'id, username, record, units, roi' },
              { name: 'leaderboard', desc: 'Rankings & stats', fields: 'user_id, sport, period, rank, streak' },
              { name: 'edge_alerts', desc: 'Edge detection signals', fields: 'id, type, game_id, severity, confidence' },
              { name: 'site_settings', desc: 'Admin config & edge toggles', fields: 'edge_*_enabled, edge_*_min_confidence' },
            ].map((table) => (
              <div key={table.name} className="p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)' }}>
                <div className="font-mono font-bold" style={{ color: '#00FF88' }}>{table.name}</div>
                <div className="text-sm mt-1" style={{ color: '#A0A0B0' }}>{table.desc}</div>
                <div className="text-xs mt-2 font-mono" style={{ color: '#606070' }}>{table.fields}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Updates Changelog */}
        <div id="changelog" className="rounded-2xl p-6 mb-8" style={{ background: '#0c0c14', border: '1px solid rgba(139,92,246,0.3)' }}>
          <div className="flex items-center gap-2 mb-6">
            <RefreshCw style={{ color: '#8B5CF6', width: '24px', height: '24px' }} />
            <h2 className="text-xl font-bold" style={{ color: '#FFF' }}>🔄 Recent Updates</h2>
          </div>
          
          <div className="space-y-6">
            {/* Latest Update */}
            <div className="p-4 rounded-xl" style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)' }}>
              <div className="flex items-center gap-2 mb-3">
                <span className="px-2 py-1 rounded text-xs font-bold" style={{ background: '#8B5CF6', color: '#FFF' }}>LATEST</span>
                <span className="text-sm" style={{ color: '#808090' }}>January 2025</span>
              </div>
              <h3 className="font-bold text-lg mb-3" style={{ color: '#FFF' }}>Navigation & News Improvements</h3>
              <ul className="space-y-2 text-sm" style={{ color: '#A0A0B0' }}>
                <li className="flex items-start gap-2">
                  <span style={{ color: '#00FF88' }}>✓</span>
                  <span><strong>Admin Access Restructured:</strong> Removed admin link from footer. Admin Dashboard now only appears in user dropdown for authenticated admin users.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span style={{ color: '#00FF88' }}>✓</span>
                  <span><strong>User Menu Enhanced:</strong> Added Control Panel and Alerts links to user dropdown for quick access to personalized features.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span style={{ color: '#00FF88' }}>✓</span>
                  <span><strong>News Page Filtering:</strong> Added comprehensive filtering with sport tabs, team dropdown, date sorting (newest/oldest/popular), and player/text search.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span style={{ color: '#00FF88' }}>✓</span>
                  <span><strong>Footer Tools Section:</strong> Added quick links to Calculators, Alerts, and Documentation.</span>
                </li>
              </ul>
            </div>

            {/* Previous Updates */}
            <div className="p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)' }}>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-sm" style={{ color: '#808090' }}>December 2024</span>
              </div>
              <h3 className="font-bold mb-2" style={{ color: '#FFF' }}>Game Matchup Page Improvements</h3>
              <ul className="space-y-1 text-sm" style={{ color: '#A0A0B0' }}>
                <li className="flex items-start gap-2">
                  <span style={{ color: '#00FF88' }}>✓</span>
                  <span>Fixed H2H data to fetch actual historical game data instead of mock records</span>
                </li>
                <li className="flex items-start gap-2">
                  <span style={{ color: '#00FF88' }}>✓</span>
                  <span>Redesigned betting splits UI with proper green/red color coding</span>
                </li>
                <li className="flex items-start gap-2">
                  <span style={{ color: '#00FF88' }}>✓</span>
                  <span>Fixed NaN score displays and team stats calculation issues</span>
                </li>
                <li className="flex items-start gap-2">
                  <span style={{ color: '#00FF88' }}>✓</span>
                  <span>Enhanced mobile responsiveness for game detail pages</span>
                </li>
              </ul>
            </div>

            <div className="p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)' }}>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-sm" style={{ color: '#808090' }}>November 2024</span>
              </div>
              <h3 className="font-bold mb-2" style={{ color: '#FFF' }}>Data Layer & API Improvements</h3>
              <ul className="space-y-1 text-sm" style={{ color: '#A0A0B0' }}>
                <li className="flex items-start gap-2">
                  <span style={{ color: '#00FF88' }}>✓</span>
                  <span>Props correlations API uses research-based betting patterns (labeled as pattern-based data)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span style={{ color: '#00FF88' }}>✓</span>
                  <span>Historical data service with graceful fallback to research patterns when database unavailable</span>
                </li>
                <li className="flex items-start gap-2">
                  <span style={{ color: '#00FF88' }}>✓</span>
                  <span>Edge detection uses real-time odds data where available</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Commands */}
        <div className="rounded-2xl p-6" style={{ background: '#0c0c14', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-2 mb-6">
            <Zap style={{ color: '#FF6B00', width: '24px', height: '24px' }} />
            <h2 className="text-xl font-bold" style={{ color: '#FFF' }}>Quick Commands</h2>
          </div>
          
          <div className="space-y-3">
            {[
              { cmd: 'npm run dev', desc: 'Start local dev server at localhost:3000' },
              { cmd: 'npm run build', desc: 'Build for production' },
              { cmd: 'npm run test', desc: 'Run Playwright E2E tests' },
              { cmd: 'vercel --prod', desc: 'Deploy to production' },
              { cmd: 'vercel logs', desc: 'View deployment logs' },
              { cmd: 'vercel env pull', desc: 'Sync environment variables' },
            ].map((item) => (
              <div key={item.cmd} className="flex items-center gap-4 p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.02)' }}>
                <code className="font-mono text-sm px-3 py-1 rounded" style={{ background: 'rgba(255,107,0,0.15)', color: '#FF6B00' }}>
                  {item.cmd}
                </code>
                <span className="text-sm" style={{ color: '#808090' }}>{item.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
