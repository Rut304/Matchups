'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  BookOpen,
  Calculator,
  Shield,
  Zap,
  Target,
  GraduationCap,
  ChevronRight,
  ExternalLink,
  Info,
  CheckCircle,
  XCircle,
  Percent
} from 'lucide-react'
import { BANKROLL_MANAGEMENT_SYSTEMS, RECOMMENDED_BY_LEVEL, SYSTEMS_TO_AVOID, type StakingSystem } from '@/lib/data/bankroll-management-systems'

type SortField = 'name' | 'category' | 'difficulty' | 'riskLevel'
type SortDirection = 'asc' | 'desc'

const difficultyOrder = { beginner: 1, intermediate: 2, advanced: 3, expert: 4 }
const riskOrder = { low: 1, medium: 2, high: 3, extreme: 4 }

const difficultyColors = {
  beginner: { bg: 'rgba(0,255,136,0.15)', text: '#00FF88' },
  intermediate: { bg: 'rgba(0,168,255,0.15)', text: '#00A8FF' },
  advanced: { bg: 'rgba(255,215,0,0.15)', text: '#FFD700' },
  expert: { bg: 'rgba(155,89,182,0.15)', text: '#9B59B6' }
}

const riskColors = {
  low: { bg: 'rgba(0,255,136,0.15)', text: '#00FF88' },
  medium: { bg: 'rgba(255,215,0,0.15)', text: '#FFD700' },
  high: { bg: 'rgba(255,107,0,0.15)', text: '#FF6B00' },
  extreme: { bg: 'rgba(255,68,85,0.15)', text: '#FF4455' }
}

const categoryIcons: Record<string, React.ReactNode> = {
  progressive: <TrendingUp className="w-4 h-4" />,
  fixed: <Shield className="w-4 h-4" />,
  proportional: <Percent className="w-4 h-4" />,
  recovery: <AlertTriangle className="w-4 h-4" />,
  value: <Target className="w-4 h-4" />
}

function StakingSystemCard({ system, expanded, onToggle }: { system: StakingSystem; expanded: boolean; onToggle: () => void }) {
  const isAvoid = SYSTEMS_TO_AVOID.includes(system.id)
  
  return (
    <div 
      className={`rounded-2xl overflow-hidden transition-all ${expanded ? 'ring-2' : ''}`}
      style={{ 
        background: '#0c0c14', 
        border: isAvoid ? '1px solid rgba(255,68,85,0.3)' : '1px solid rgba(255,255,255,0.06)',
        ['--tw-ring-color' as string]: expanded ? (isAvoid ? '#FF4455' : '#00A8FF') : 'transparent'
      }}
    >
      {/* Header */}
      <button 
        onClick={onToggle}
        className="w-full p-4 text-left flex items-center gap-4 hover:bg-white/5 transition-colors"
      >
        {/* Category Icon */}
        <div 
          className="p-3 rounded-xl"
          style={{ background: `${riskColors[system.riskLevel].bg}` }}
        >
          <span style={{ color: riskColors[system.riskLevel].text }}>
            {categoryIcons[system.category]}
          </span>
        </div>
        
        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-bold text-white">{system.name}</h3>
            {isAvoid && (
              <span className="px-2 py-0.5 rounded text-xs font-bold" style={{ background: 'rgba(255,68,85,0.2)', color: '#FF4455' }}>
                ⚠️ NOT RECOMMENDED
              </span>
            )}
          </div>
          <p className="text-sm line-clamp-1" style={{ color: '#808090' }}>{system.description}</p>
        </div>
        
        {/* Badges */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <span 
            className="px-2 py-1 rounded-lg text-xs font-bold"
            style={{ background: difficultyColors[system.difficulty].bg, color: difficultyColors[system.difficulty].text }}
          >
            {system.difficulty.toUpperCase()}
          </span>
          <span 
            className="px-2 py-1 rounded-lg text-xs font-bold"
            style={{ background: riskColors[system.riskLevel].bg, color: riskColors[system.riskLevel].text }}
          >
            {system.riskLevel.toUpperCase()} RISK
          </span>
        </div>
        
        <ChevronRight 
          className={`w-5 h-5 transition-transform ${expanded ? 'rotate-90' : ''}`} 
          style={{ color: '#606070' }} 
        />
      </button>
      
      {/* Expanded Content */}
      {expanded && (
        <div className="px-4 pb-4 space-y-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          {/* Warning Message */}
          {system.warningMessage && (
            <div className="mt-4 p-3 rounded-xl flex items-start gap-3" style={{ background: 'rgba(255,68,85,0.1)', border: '1px solid rgba(255,68,85,0.3)' }}>
              <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#FF4455' }} />
              <p className="text-sm" style={{ color: '#FF4455' }}>{system.warningMessage}</p>
            </div>
          )}
          
          {/* How It Works */}
          <div className="mt-4">
            <h4 className="font-bold text-sm mb-2" style={{ color: '#FFD700' }}>How It Works</h4>
            <p className="text-sm" style={{ color: '#A0A0B0' }}>{system.howItWorks}</p>
          </div>
          
          {/* Formula */}
          {system.formula && (
            <div className="p-3 rounded-xl" style={{ background: 'rgba(0,168,255,0.1)', border: '1px solid rgba(0,168,255,0.2)' }}>
              <div className="flex items-center gap-2 mb-1">
                <Calculator className="w-4 h-4" style={{ color: '#00A8FF' }} />
                <span className="text-xs font-bold" style={{ color: '#00A8FF' }}>FORMULA</span>
              </div>
              <code className="text-sm font-mono" style={{ color: '#FFF' }}>{system.formula}</code>
            </div>
          )}
          
          {/* Pros & Cons */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-3 rounded-xl" style={{ background: 'rgba(0,255,136,0.05)', border: '1px solid rgba(0,255,136,0.1)' }}>
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-4 h-4" style={{ color: '#00FF88' }} />
                <span className="text-xs font-bold" style={{ color: '#00FF88' }}>PROS</span>
              </div>
              <ul className="space-y-1">
                {system.pros.map((pro, i) => (
                  <li key={i} className="text-sm flex items-start gap-2" style={{ color: '#A0A0B0' }}>
                    <span style={{ color: '#00FF88' }}>•</span>
                    {pro}
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="p-3 rounded-xl" style={{ background: 'rgba(255,68,85,0.05)', border: '1px solid rgba(255,68,85,0.1)' }}>
              <div className="flex items-center gap-2 mb-2">
                <XCircle className="w-4 h-4" style={{ color: '#FF4455' }} />
                <span className="text-xs font-bold" style={{ color: '#FF4455' }}>CONS</span>
              </div>
              <ul className="space-y-1">
                {system.cons.map((con, i) => (
                  <li key={i} className="text-sm flex items-start gap-2" style={{ color: '#A0A0B0' }}>
                    <span style={{ color: '#FF4455' }}>•</span>
                    {con}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          
          {/* Best For */}
          <div className="p-3 rounded-xl" style={{ background: 'rgba(255,215,0,0.05)', border: '1px solid rgba(255,215,0,0.1)' }}>
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4" style={{ color: '#FFD700' }} />
              <span className="text-xs font-bold" style={{ color: '#FFD700' }}>BEST FOR</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {system.bestFor.map((use, i) => (
                <span key={i} className="px-2 py-1 rounded text-xs" style={{ background: 'rgba(255,215,0,0.1)', color: '#FFD700' }}>
                  {use}
                </span>
              ))}
            </div>
          </div>
          
          {/* Example Sequence */}
          <div>
            <h4 className="font-bold text-sm mb-2" style={{ color: '#00A8FF' }}>Example Sequence (Starting Bankroll: ${system.example.bankroll.toLocaleString()})</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                    <th className="text-left py-2 px-3" style={{ color: '#606070' }}>Bet #</th>
                    <th className="text-left py-2 px-3" style={{ color: '#606070' }}>Bet Amount</th>
                    <th className="text-left py-2 px-3" style={{ color: '#606070' }}>Outcome</th>
                    <th className="text-right py-2 px-3" style={{ color: '#606070' }}>Bankroll After</th>
                  </tr>
                </thead>
                <tbody>
                  {system.example.sequence.map((step, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td className="py-2 px-3" style={{ color: '#A0A0B0' }}>{i + 1}</td>
                      <td className="py-2 px-3 font-mono" style={{ color: '#FFF' }}>${step.bet.toLocaleString()}</td>
                      <td className="py-2 px-3">
                        <span 
                          className="px-2 py-0.5 rounded text-xs font-bold"
                          style={{ 
                            background: step.outcome === 'win' ? 'rgba(0,255,136,0.2)' : 'rgba(255,68,85,0.2)',
                            color: step.outcome === 'win' ? '#00FF88' : '#FF4455'
                          }}
                        >
                          {step.outcome.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-right font-mono" style={{ color: step.bankroll >= system.example.bankroll ? '#00FF88' : '#FF4455' }}>
                        ${step.bankroll.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          {/* Source */}
          <div className="flex items-center justify-between pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <span className="text-xs" style={{ color: '#606070' }}>Source: {system.source}</span>
            <a 
              href={system.sourceUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs hover:underline"
              style={{ color: '#00A8FF' }}
            >
              Learn More <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      )}
    </div>
  )
}

export default function BankrollSystemsPage() {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [sortField, setSortField] = useState<SortField>('riskLevel')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all')
  
  const sortedSystems = useMemo(() => {
    let filtered = BANKROLL_MANAGEMENT_SYSTEMS
    
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(s => s.category === categoryFilter)
    }
    
    if (difficultyFilter !== 'all') {
      filtered = filtered.filter(s => s.difficulty === difficultyFilter)
    }
    
    return [...filtered].sort((a, b) => {
      let comparison = 0
      
      switch (sortField) {
        case 'name':
          comparison = a.name.localeCompare(b.name)
          break
        case 'category':
          comparison = a.category.localeCompare(b.category)
          break
        case 'difficulty':
          comparison = difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty]
          break
        case 'riskLevel':
          comparison = riskOrder[a.riskLevel] - riskOrder[b.riskLevel]
          break
      }
      
      return sortDirection === 'asc' ? comparison : -comparison
    })
  }, [sortField, sortDirection, categoryFilter, difficultyFilter])
  
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }
  
  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="w-3 h-3 opacity-50" />
    return sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
  }
  
  return (
    <main className="min-h-screen pb-24" style={{ background: 'linear-gradient(180deg, #08080f 0%, #0c0c14 100%)' }}>
      {/* Hero Section */}
      <section className="relative overflow-hidden pb-6">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-[-50%] left-[-25%] w-[150%] h-[200%] opacity-30"
               style={{ 
                 background: 'radial-gradient(ellipse at center, rgba(0,168,255,0.15) 0%, transparent 50%)',
                 animation: 'pulse 8s ease-in-out infinite'
               }} />
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 relative z-10">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-3">
              <DollarSign className="w-10 h-10" style={{ color: '#00FF88' }} />
              <h1 className="text-4xl sm:text-5xl font-black tracking-tight" 
                  style={{ 
                    background: 'linear-gradient(135deg, #00FF88 0%, #00A8FF 50%, #00FF88 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                  }}>
                BANKROLL SYSTEMS
              </h1>
            </div>
            <p className="text-lg" style={{ color: '#808090' }}>
              Professional staking strategies to manage your betting bankroll
            </p>
            <p className="text-sm mt-2" style={{ color: '#606070' }}>
              Sourced from <a href="https://bettoringreen.com/betting/" target="_blank" rel="noopener noreferrer" className="underline hover:text-white">bettoringreen.com</a> • {BANKROLL_MANAGEMENT_SYSTEMS.length} systems documented
            </p>
          </div>
          
          {/* Quick Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <div className="p-4 rounded-2xl text-center" style={{ background: 'rgba(0,255,136,0.1)', border: '1px solid rgba(0,255,136,0.2)' }}>
              <Shield className="w-6 h-6 mx-auto mb-2" style={{ color: '#00FF88' }} />
              <div className="text-2xl font-bold" style={{ color: '#00FF88' }}>{RECOMMENDED_BY_LEVEL.beginner.length}</div>
              <div className="text-xs" style={{ color: '#A0A0B0' }}>Beginner Friendly</div>
            </div>
            <div className="p-4 rounded-2xl text-center" style={{ background: 'rgba(0,168,255,0.1)', border: '1px solid rgba(0,168,255,0.2)' }}>
              <GraduationCap className="w-6 h-6 mx-auto mb-2" style={{ color: '#00A8FF' }} />
              <div className="text-2xl font-bold" style={{ color: '#00A8FF' }}>{RECOMMENDED_BY_LEVEL.advanced.length}</div>
              <div className="text-xs" style={{ color: '#A0A0B0' }}>Advanced Systems</div>
            </div>
            <div className="p-4 rounded-2xl text-center" style={{ background: 'rgba(155,89,182,0.1)', border: '1px solid rgba(155,89,182,0.2)' }}>
              <Target className="w-6 h-6 mx-auto mb-2" style={{ color: '#9B59B6' }} />
              <div className="text-2xl font-bold" style={{ color: '#9B59B6' }}>{RECOMMENDED_BY_LEVEL.expert.length}</div>
              <div className="text-xs" style={{ color: '#A0A0B0' }}>Expert/Value Systems</div>
            </div>
            <div className="p-4 rounded-2xl text-center" style={{ background: 'rgba(255,68,85,0.1)', border: '1px solid rgba(255,68,85,0.2)' }}>
              <AlertTriangle className="w-6 h-6 mx-auto mb-2" style={{ color: '#FF4455' }} />
              <div className="text-2xl font-bold" style={{ color: '#FF4455' }}>{SYSTEMS_TO_AVOID.length}</div>
              <div className="text-xs" style={{ color: '#A0A0B0' }}>Systems to Avoid</div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Main Content */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Filters & Sort */}
        <div className="flex flex-wrap items-center gap-4 mb-6">
          {/* Category Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold" style={{ color: '#606070' }}>CATEGORY:</span>
            <div className="flex gap-1">
              {['all', 'fixed', 'progressive', 'proportional', 'recovery', 'value'].map(cat => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                  style={{
                    background: categoryFilter === cat ? 'rgba(0,168,255,0.2)' : 'rgba(255,255,255,0.05)',
                    color: categoryFilter === cat ? '#00A8FF' : '#808090',
                    border: categoryFilter === cat ? '1px solid rgba(0,168,255,0.3)' : '1px solid transparent'
                  }}
                >
                  {cat === 'all' ? 'All' : cat.charAt(0).toUpperCase() + cat.slice(1)}
                </button>
              ))}
            </div>
          </div>
          
          {/* Difficulty Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold" style={{ color: '#606070' }}>LEVEL:</span>
            <div className="flex gap-1">
              {['all', 'beginner', 'intermediate', 'advanced', 'expert'].map(diff => (
                <button
                  key={diff}
                  onClick={() => setDifficultyFilter(diff)}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                  style={{
                    background: difficultyFilter === diff 
                      ? (diff === 'all' ? 'rgba(0,168,255,0.2)' : difficultyColors[diff as keyof typeof difficultyColors].bg)
                      : 'rgba(255,255,255,0.05)',
                    color: difficultyFilter === diff 
                      ? (diff === 'all' ? '#00A8FF' : difficultyColors[diff as keyof typeof difficultyColors].text)
                      : '#808090',
                    border: difficultyFilter === diff ? '1px solid rgba(255,255,255,0.2)' : '1px solid transparent'
                  }}
                >
                  {diff === 'all' ? 'All Levels' : diff.charAt(0).toUpperCase() + diff.slice(1)}
                </button>
              ))}
            </div>
          </div>
          
          {/* Sort Buttons */}
          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs font-bold" style={{ color: '#606070' }}>SORT:</span>
            {[
              { field: 'riskLevel', label: 'Risk' },
              { field: 'difficulty', label: 'Difficulty' },
              { field: 'name', label: 'Name' },
            ].map(({ field, label }) => (
              <button
                key={field}
                onClick={() => handleSort(field as SortField)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                style={{
                  background: sortField === field ? 'rgba(255,215,0,0.2)' : 'rgba(255,255,255,0.05)',
                  color: sortField === field ? '#FFD700' : '#808090'
                }}
              >
                {label} <SortIcon field={field as SortField} />
              </button>
            ))}
          </div>
        </div>
        
        {/* Recommended Section */}
        <div className="mb-6 p-4 rounded-2xl" style={{ background: 'rgba(0,255,136,0.05)', border: '1px solid rgba(0,255,136,0.1)' }}>
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle className="w-5 h-5" style={{ color: '#00FF88' }} />
            <h3 className="font-bold" style={{ color: '#00FF88' }}>Recommended Starting Points</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {RECOMMENDED_BY_LEVEL.beginner.map(id => {
              const sys = BANKROLL_MANAGEMENT_SYSTEMS.find(s => s.id === id)
              return sys ? (
                <button
                  key={id}
                  onClick={() => setExpandedId(expandedId === id ? null : id)}
                  className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all hover:bg-white/10"
                  style={{ background: 'rgba(0,255,136,0.15)', color: '#00FF88' }}
                >
                  {sys.name}
                </button>
              ) : null
            })}
          </div>
        </div>
        
        {/* Systems List */}
        <div className="space-y-3">
          {sortedSystems.map(system => (
            <StakingSystemCard 
              key={system.id}
              system={system}
              expanded={expandedId === system.id}
              onToggle={() => setExpandedId(expandedId === system.id ? null : system.id)}
            />
          ))}
        </div>
        
        {/* Navigation */}
        <div className="mt-8 flex items-center justify-center gap-4">
          <Link 
            href="/marketplace"
            className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all hover:scale-105"
            style={{ background: 'linear-gradient(135deg, #FF6B00 0%, #FF8C40 100%)', color: '#FFF' }}
          >
            Browse Betting Systems <ChevronRight className="w-4 h-4" />
          </Link>
          <Link 
            href="/systems"
            className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all hover:bg-white/10"
            style={{ background: 'rgba(255,255,255,0.05)', color: '#A0A0B0', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            Create Custom System <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </main>
  )
}
