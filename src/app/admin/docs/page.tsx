'use client'

import Link from 'next/link'
import { ArrowLeft, Server, GitBranch, Layers, Database, Globe, Zap } from 'lucide-react'

export default function AdminDocsPage() {
  return (
    <div className="min-h-screen" style={{ background: '#050508' }}>
      {/* Header */}
      <section className="border-b" style={{ borderColor: 'rgba(255,255,255,0.06)', background: '#0a0a12' }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Link href="/admin" className="flex items-center gap-2 text-sm mb-4" style={{ color: '#808090' }}>
            <ArrowLeft style={{ width: '16px', height: '16px' }} />
            Back to Admin
          </Link>
          <h1 className="text-3xl font-black" style={{ color: '#FFF' }}>📄 Documentation</h1>
          <p style={{ color: '#808090' }}>Infrastructure, workflow, and technical reference</p>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Production URL */}
        <div className="rounded-2xl p-6 mb-8" style={{ background: '#0c0c14', border: '1px solid rgba(0,255,136,0.3)' }}>
          <div className="flex items-center gap-2 mb-4">
            <Globe style={{ color: '#00FF88', width: '24px', height: '24px' }} />
            <h2 className="text-xl font-bold" style={{ color: '#FFF' }}>Production URL</h2>
          </div>
          <div className="p-4 rounded-lg font-mono text-lg" style={{ background: 'rgba(0,255,136,0.1)' }}>
            <a href="https://matchups-rut304s-projects.vercel.app" target="_blank" rel="noopener noreferrer"
               style={{ color: '#00FF88' }}>
              https://matchups-rut304s-projects.vercel.app
            </a>
          </div>
          <p className="mt-3 text-sm" style={{ color: '#808090' }}>
            This is the permanent Vercel subdomain until a custom domain is configured.
          </p>
        </div>

        {/* Infrastructure Overview */}
        <div className="rounded-2xl p-6 mb-8" style={{ background: '#0c0c14', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-2 mb-6">
            <Server style={{ color: '#FF6B00', width: '24px', height: '24px' }} />
            <h2 className="text-xl font-bold" style={{ color: '#FFF' }}>Infrastructure Stack</h2>
          </div>
          
          <div className="grid md:grid-cols-2 gap-4">
            {[
              { icon: '⚡', name: 'Next.js 16.1.1', desc: 'React framework with App Router', color: '#FFF' },
              { icon: '🔺', name: 'Vercel', desc: 'Edge deployment & hosting', color: '#FFF' },
              { icon: '🗄️', name: 'Supabase', desc: 'PostgreSQL database & auth', color: '#00FF88' },
              { icon: '🎨', name: 'Tailwind CSS', desc: 'Utility-first styling', color: '#00A8FF' },
              { icon: '📝', name: 'TypeScript', desc: 'Type-safe development', color: '#3178C6' },
              { icon: '🧪', name: 'Playwright', desc: 'E2E testing (23 tests)', color: '#FF6B00' },
            ].map((tech) => (
              <div key={tech.name} className="p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)' }}>
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{tech.icon}</span>
                  <div>
                    <div className="font-bold" style={{ color: tech.color }}>{tech.name}</div>
                    <div className="text-sm" style={{ color: '#808090' }}>{tech.desc}</div>
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
