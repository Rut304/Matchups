'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { 
  Menu,
  X,
  Zap,
  ChevronDown,
  TrendingUp,
  BarChart3,
  Users,
  Trophy,
  Target,
  Calculator,
  Bell,
  AlertTriangle,
  LineChart,
  PieChart,
  Star,
  Shield,
  Activity,
  Flame,
  Globe,
  Bitcoin,
  DollarSign,
  Vote,
  Tv,
  Cpu,
  Newspaper,
  User,
  LogOut,
  LayoutDashboard,
  Sparkles,
  Search
} from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useIsAdmin } from '@/components/auth/AdminGuard'
import { GlobalSearch } from '@/components/search/GlobalSearch'

// Sports organized by category for cleaner navigation
const proSportsNav = [
  { 
    name: 'NFL', 
    href: '/nfl', 
    emoji: '🏈',
    color: 'from-green-600 to-green-800',
    subItems: [
      { name: 'Matchups', href: '/nfl/matchups', icon: Target },
    ]
  },
  { 
    name: 'NBA', 
    href: '/nba', 
    emoji: '🏀',
    color: 'from-orange-600 to-red-600',
    subItems: [
      { name: 'Matchups', href: '/nba/matchups', icon: Target },
      { name: 'Player Stats', href: '/nba/players', icon: Users },
      { name: 'Team Rankings', href: '/nba/rankings', icon: BarChart3 },
    ]
  },
  { 
    name: 'NHL', 
    href: '/nhl', 
    emoji: '🏒',
    color: 'from-blue-600 to-blue-800',
    subItems: [
      { name: 'Matchups', href: '/nhl/matchups', icon: Target },
    ]
  },
  { 
    name: 'MLB', 
    href: '/mlb', 
    emoji: '⚾',
    color: 'from-red-600 to-red-800',
    subItems: [
      { name: 'Matchups', href: '/mlb/matchups', icon: Target },
    ]
  },
  { 
    name: 'WNBA', 
    href: '/wnba', 
    emoji: '🏀',
    color: 'from-orange-500 to-pink-500',
    subItems: [
      { name: 'Matchups', href: '/wnba/matchups', icon: Target },
      { name: 'Player Stats', href: '/wnba/players', icon: Users },
      { name: 'Team Rankings', href: '/wnba/rankings', icon: BarChart3 },
    ]
  },
]

const collegeSportsNav = [
  { 
    name: 'NCAAF', 
    href: '/ncaaf', 
    emoji: '🏈',
    fullName: 'College Football',
    color: 'from-amber-600 to-amber-800',
    subItems: [
      { name: 'Matchups', href: '/ncaaf/matchups', icon: Target },
      { name: 'Player Stats', href: '/ncaaf/players', icon: Users },
      { name: 'Team Rankings', href: '/ncaaf/rankings', icon: BarChart3 },
    ]
  },
  { 
    name: 'NCAAB', 
    href: '/ncaab', 
    emoji: '🏀',
    fullName: "Men's Basketball",
    color: 'from-indigo-600 to-indigo-800',
    subItems: [
      { name: 'Matchups', href: '/ncaab/matchups', icon: Target },
      { name: 'Player Stats', href: '/ncaab/players', icon: Users },
      { name: 'Team Rankings', href: '/ncaab/rankings', icon: BarChart3 },
    ]
  },
  { 
    name: 'WNCAAB', 
    href: '/wncaab', 
    emoji: '🏀',
    fullName: "Women's Basketball",
    color: 'from-pink-500 to-purple-600',
    subItems: [
      { name: 'Matchups', href: '/wncaab/matchups', icon: Target },
      { name: 'Player Stats', href: '/wncaab/players', icon: Users },
      { name: 'Team Rankings', href: '/wncaab/rankings', icon: BarChart3 },
    ]
  },
]

// Combined for mobile menu
const sportsNav = [...proSportsNav, ...collegeSportsNav]

const toolsNav = [
  { name: 'Trend Finder', href: '/trend-finder', icon: Sparkles, desc: 'AI-powered trend analysis' },
  { name: 'Prop Correlations', href: '/props/correlations', icon: Activity, desc: 'Build smart same-game parlays' },
  { name: 'Pattern Matcher', href: '/patterns', icon: PieChart, desc: 'Match historical betting patterns' },
  { name: 'Marketplace', href: '/marketplace', icon: TrendingUp, desc: 'Copy winning systems' },
  { name: 'Line Shop', href: '/lineshop', icon: PieChart, desc: 'Best odds across sportsbooks' },
  { name: 'CLV Tracker', href: '/performance/clv', icon: Target, desc: 'Track closing line value' },
  { name: 'Calculators', href: '/calculators', icon: Calculator, desc: 'Parlay & hedge calculators' },
  { name: 'Alerts', href: '/alerts', icon: Bell, desc: 'Line moves & sharp action' },
  { name: 'Trends', href: '/trends', icon: TrendingUp, desc: 'Betting systems & angles' },
  { name: 'Analytics', href: '/analytics', icon: LineChart, desc: 'Advanced metrics' },
  { name: 'News', href: '/news', icon: Newspaper, desc: 'Latest sports news & updates' },
]

// Markets Navigation - Major section
const marketsNav = [
  { 
    name: 'All Markets', 
    href: '/markets', 
    icon: Globe,
    emoji: '🎯',
    color: 'from-purple-600 to-pink-600',
    desc: 'Browse all prediction markets'
  },
  { 
    name: 'Politics', 
    href: '/markets/politics', 
    icon: Vote,
    emoji: '🗳️',
    color: 'from-red-600 to-red-800',
    desc: 'Elections, policy & government'
  },
  { 
    name: 'Crypto', 
    href: '/markets/crypto', 
    icon: Bitcoin,
    emoji: '₿',
    color: 'from-orange-500 to-yellow-500',
    desc: 'Bitcoin, ETH & crypto prices'
  },
  { 
    name: 'Entertainment', 
    href: '/markets/entertainment', 
    icon: Tv,
    emoji: '🎬',
    color: 'from-pink-500 to-purple-500',
    desc: 'Movies, TV & pop culture'
  },
  { 
    name: 'Tech & AI', 
    href: '/markets/tech', 
    icon: Cpu,
    emoji: '🤖',
    color: 'from-cyan-500 to-blue-500',
    desc: 'Tech companies & AI predictions'
  },
  { 
    name: 'Economics', 
    href: '/markets/economics', 
    icon: DollarSign,
    emoji: '📈',
    color: 'from-green-500 to-emerald-500',
    desc: 'Interest rates, GDP & markets'
  },
]

const marketsTools = [
  { name: 'Hot Markets', href: '/markets/trending', icon: Flame, desc: 'Biggest movers today' },
  { name: 'The Edge', href: '/markets/edge', icon: Target, desc: 'AI-powered edges & alerts' },
  { name: 'Insights', href: '/markets/insights', icon: BarChart3, desc: 'Research-backed analytics' },
  { name: 'News & Events', href: '/markets/news', icon: Newspaper, desc: 'Market-moving events' },
]

export function Navbar() {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const { user, loading: authLoading, signOut } = useAuth()
  const { isAdmin } = useIsAdmin()

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setActiveDropdown(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  const handleMouseEnter = (dropdown: string) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    setActiveDropdown(dropdown)
  }

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => setActiveDropdown(null), 150)
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a12]/95 backdrop-blur-xl border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo + FREE Badge */}
          <Link href="/" className="flex items-center gap-3 shrink-0 group">
            <div className="w-9 h-9 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/20 group-hover:scale-105 transition-transform">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div className="hidden sm:flex flex-col">
              <span className="text-lg font-bold text-white leading-none">Matchups</span>
              <span className="text-[10px] font-bold text-orange-400 tracking-wider">SPORTS GAMBLER INTEL</span>
            </div>
          </Link>

          {/* Desktop Navigation - Clean & Simple */}
          <div className="hidden lg:flex items-center gap-0.5" ref={dropdownRef}>
            {/* Sports Dropdown */}
            <div 
              className="relative"
              onMouseEnter={() => handleMouseEnter('sports')}
              onMouseLeave={handleMouseLeave}
            >
              <button
                className={cn(
                  'flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all',
                  activeDropdown === 'sports' 
                    ? 'bg-white/10 text-white' 
                    : 'text-gray-300 hover:text-white hover:bg-white/5'
                )}
              >
                Sports <ChevronDown className={cn('w-4 h-4 transition-transform', activeDropdown === 'sports' && 'rotate-180')} />
              </button>
              {activeDropdown === 'sports' && (
                <div 
                  className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-[780px] p-5 rounded-2xl bg-[#0c0c14]/98 backdrop-blur-xl border border-white/10 shadow-2xl"
                  onMouseEnter={() => handleMouseEnter('sports')}
                  onMouseLeave={handleMouseLeave}
                >
                  <div className="grid grid-cols-2 gap-6">
                    {/* Pro Sports */}
                    <div>
                      <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 px-1">Pro Sports</h3>
                      <div className="grid grid-cols-2 gap-2">
                        {proSportsNav.map((sport) => (
                          <Link 
                            key={sport.name}
                            href={sport.href} 
                            onClick={() => setActiveDropdown(null)} 
                            className={cn(
                              'flex items-center gap-2 px-3 py-2 rounded-xl font-semibold text-white transition-all',
                              'bg-gradient-to-r hover:scale-[1.02] text-sm',
                              sport.color
                            )}
                          >
                            <span className="text-lg">{sport.emoji}</span>
                            <span>{sport.name}</span>
                          </Link>
                        ))}
                      </div>
                    </div>
                    
                    {/* College Sports */}
                    <div>
                      <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 px-1">College Sports</h3>
                      <div className="space-y-2">
                        {collegeSportsNav.map((sport) => (
                          <Link 
                            key={sport.name}
                            href={sport.href} 
                            onClick={() => setActiveDropdown(null)} 
                            className={cn(
                              'flex items-center gap-2 px-3 py-2 rounded-xl font-semibold text-white transition-all',
                              'bg-gradient-to-r hover:scale-[1.02] text-sm',
                              sport.color
                            )}
                          >
                            <span className="text-lg">{sport.emoji}</span>
                            <span className="flex-1">{sport.name}</span>
                            <span className="text-xs text-white/60">{sport.fullName}</span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  {/* Quick Links */}
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <div className="flex items-center gap-4">
                      <Link 
                        href="/live" 
                        onClick={() => setActiveDropdown(null)}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-all text-sm font-medium"
                      >
                        <Activity className="w-4 h-4" />
                        Live Games
                      </Link>
                      <Link 
                        href="/trends" 
                        onClick={() => setActiveDropdown(null)}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 text-gray-300 hover:bg-white/10 transition-all text-sm font-medium"
                      >
                        <TrendingUp className="w-4 h-4" />
                        All Trends
                      </Link>
                      <Link 
                        href="/analytics" 
                        onClick={() => setActiveDropdown(null)}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 text-gray-300 hover:bg-white/10 transition-all text-sm font-medium"
                      >
                        <BarChart3 className="w-4 h-4" />
                        Analytics
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Markets Dropdown - Major Section */}
            <div 
              className="relative"
              onMouseEnter={() => handleMouseEnter('markets')}
              onMouseLeave={handleMouseLeave}
            >
              <button
                className={cn(
                  'flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all',
                  activeDropdown === 'markets' 
                    ? 'bg-purple-500/20 text-purple-300' 
                    : 'text-gray-300 hover:text-white hover:bg-white/5'
                )}
              >
                <Star className="w-4 h-4 text-purple-400" />
                Markets <ChevronDown className={cn('w-4 h-4 transition-transform', activeDropdown === 'markets' && 'rotate-180')} />
              </button>
              {activeDropdown === 'markets' && (
                <div 
                  className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-[580px] p-5 rounded-2xl bg-[#0c0c14]/98 backdrop-blur-xl border border-purple-500/20 shadow-2xl"
                  onMouseEnter={() => handleMouseEnter('markets')}
                  onMouseLeave={handleMouseLeave}
                >
                  {/* Header */}
                  <div className="flex items-center gap-2 mb-4 pb-3 border-b border-white/10">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                      <Globe className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white">Prediction Markets</div>
                      <div className="text-xs text-gray-500">Polymarket & Kalshi data</div>
                    </div>
                    <Link 
                      href="/markets"
                      onClick={() => setActiveDropdown(null)}
                      className="ml-auto px-3 py-1.5 rounded-lg bg-purple-500/20 text-purple-300 text-xs font-semibold hover:bg-purple-500/30 transition-all"
                    >
                      View All →
                    </Link>
                  </div>
                  
                  {/* Categories Grid */}
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    {marketsNav.slice(1).map((market) => (
                      <Link 
                        key={market.href}
                        href={market.href}
                        onClick={() => setActiveDropdown(null)}
                        className={cn(
                          'flex items-center gap-2 px-3 py-2.5 rounded-xl font-semibold text-white transition-all hover:scale-[1.02]',
                          'bg-gradient-to-r',
                          market.color
                        )}
                      >
                        <span className="text-lg">{market.emoji}</span>
                        <span className="text-sm">{market.name}</span>
                      </Link>
                    ))}
                  </div>
                  
                  {/* Tools */}
                  <div className="grid grid-cols-3 gap-2 pt-3 border-t border-white/10">
                    {marketsTools.map((tool) => (
                      <Link 
                        key={tool.href}
                        href={tool.href}
                        onClick={() => setActiveDropdown(null)}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-all"
                      >
                        <tool.icon className="w-4 h-4 text-purple-400" />
                        {tool.name}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Tools Dropdown */}
            <div 
              className="relative"
              onMouseEnter={() => handleMouseEnter('tools')}
              onMouseLeave={handleMouseLeave}
            >
              <button 
                className={cn(
                  'flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all',
                  activeDropdown === 'tools' 
                    ? 'bg-white/10 text-white' 
                    : 'text-gray-300 hover:text-white hover:bg-white/5'
                )}
              >
                Tools <ChevronDown className={cn('w-4 h-4 transition-transform', activeDropdown === 'tools' && 'rotate-180')} />
              </button>
              {activeDropdown === 'tools' && (
                <div 
                  className="absolute top-full left-0 mt-2 w-72 p-3 rounded-2xl bg-[#0c0c14]/98 backdrop-blur-xl border border-white/10 shadow-2xl"
                  onMouseEnter={() => handleMouseEnter('tools')}
                  onMouseLeave={handleMouseLeave}
                >
                  {toolsNav.map((item) => (
                    <Link 
                      key={item.href} 
                      href={item.href} 
                      onClick={() => setActiveDropdown(null)} 
                      className="flex items-start gap-3 px-3 py-3 rounded-xl hover:bg-white/5 transition-all group/tool"
                    >
                      <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-orange-500/20 to-red-500/20 flex items-center justify-center group-hover/tool:from-orange-500/30 group-hover/tool:to-red-500/30 transition-all">
                        <item.icon className="w-4 h-4 text-orange-500" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-white">{item.name}</div>
                        <div className="text-xs text-gray-500">{item.desc}</div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Direct Links */}
            <Link 
              href="/scores" 
              className={cn(
                'flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all',
                pathname === '/scores' 
                  ? 'bg-green-500/20 text-green-400' 
                  : 'text-gray-300 hover:text-white hover:bg-white/5'
              )}
            >
              <Activity className="w-4 h-4" />
              Scores
            </Link>

            {/* Expert Tracker - Gold Button in Nav */}
            <Link 
              href="/leaderboard" 
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-bold hover:scale-105 transition-all whitespace-nowrap"
              style={{ background: 'linear-gradient(135deg, #FFD700, #FF8C00)', color: '#000' }}
            >
              <Trophy className="w-4 h-4" />
              <span>&quot;Experts&quot;</span>
            </Link>
          </div>

          {/* Right side CTAs */}
          <div className="flex items-center gap-2">
            {/* Global Search */}
            <GlobalSearch />

            {/* The Edge - Primary CTA */}
            <Link 
              href="/markets/edge" 
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-bold text-white hover:scale-105 transition-all shadow-lg shadow-purple-500/20"
              style={{ background: 'linear-gradient(135deg, #9B59B6, #6B46C1)' }}
            >
              <Target className="w-4 h-4" />
              <span>The Edge</span>
            </Link>

            {/* Sus Plays - Secondary CTA */}
            <Link 
              href="/sus" 
              className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-bold text-white hover:scale-105 transition-all shadow-lg shadow-red-500/20"
              style={{ background: 'linear-gradient(135deg, #FF3366, #FF6B00)' }}
            >
              <AlertTriangle className="w-4 h-4" />
              <span>Sus Plays</span>
            </Link>

            {/* User Auth Section */}
            {!authLoading && (
              user ? (
                <div 
                  className="relative hidden lg:block"
                  onMouseEnter={() => handleMouseEnter('user')}
                  onMouseLeave={handleMouseLeave}
                >
                  <button
                    title="User menu"
                    className={cn(
                      'flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition-all',
                      activeDropdown === 'user' 
                        ? 'bg-green-500/20 text-green-400' 
                        : 'text-gray-300 hover:text-white hover:bg-white/5'
                    )}
                  >
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                      <User className="w-4 h-4 text-white" />
                    </div>
                    <ChevronDown className={cn('w-4 h-4 transition-transform', activeDropdown === 'user' && 'rotate-180')} />
                  </button>
                  {activeDropdown === 'user' && (
                    <div 
                      className="absolute top-full right-0 mt-2 w-56 p-2 rounded-xl bg-[#0c0c14]/98 backdrop-blur-xl border border-white/10 shadow-2xl"
                      onMouseEnter={() => handleMouseEnter('user')}
                      onMouseLeave={handleMouseLeave}
                    >
                      <div className="px-3 py-2 border-b border-white/10 mb-2">
                        <p className="text-xs text-gray-500">Signed in as</p>
                        <p className="text-sm font-medium text-white truncate">{user.email}</p>
                      </div>
                      <Link 
                        href="/dashboard" 
                        onClick={() => setActiveDropdown(null)}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/5 transition-all text-gray-300 hover:text-white"
                      >
                        <LayoutDashboard className="w-4 h-4 text-green-400" />
                        <span className="text-sm font-medium">Dashboard</span>
                      </Link>
                      <Link 
                        href="/control-panel" 
                        onClick={() => setActiveDropdown(null)}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/5 transition-all text-gray-300 hover:text-white"
                      >
                        <Target className="w-4 h-4 text-blue-400" />
                        <span className="text-sm font-medium">Control Panel</span>
                      </Link>
                      <Link 
                        href="/alerts" 
                        onClick={() => setActiveDropdown(null)}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/5 transition-all text-gray-300 hover:text-white"
                      >
                        <Bell className="w-4 h-4 text-yellow-400" />
                        <span className="text-sm font-medium">Alerts & Notifications</span>
                      </Link>
                      {isAdmin && (
                        <Link 
                          href="/admin" 
                          onClick={() => setActiveDropdown(null)}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-purple-500/10 transition-all text-gray-300 hover:text-purple-400"
                        >
                          <Shield className="w-4 h-4 text-purple-400" />
                          <span className="text-sm font-medium">Admin Dashboard</span>
                        </Link>
                      )}
                      <div className="border-t border-white/10 mt-2 pt-2">
                        <button 
                          onClick={() => {
                            signOut()
                            setActiveDropdown(null)
                          }}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-red-500/10 transition-all text-gray-300 hover:text-red-400"
                        >
                          <LogOut className="w-4 h-4" />
                          <span className="text-sm font-medium">Sign Out</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <Link 
                  href="/auth" 
                  className="hidden lg:flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-white/10 hover:bg-white/20 transition-all"
                >
                  <User className="w-4 h-4" />
                  <span>Sign In</span>
                </Link>
              )
            )}

            {/* Mobile menu button */}
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
              onTouchEnd={(e) => {
                e.preventDefault()
                setMobileMenuOpen(!mobileMenuOpen)
              }}
              className="lg:hidden p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-all touch-manipulation"
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation - Full Screen */}
      <div 
        className={cn(
          "lg:hidden fixed inset-0 top-16 bg-[#0a0a12] overflow-y-auto transition-all duration-300 ease-in-out",
          mobileMenuOpen 
            ? "opacity-100 visible" 
            : "opacity-0 invisible pointer-events-none"
        )}
        style={{ zIndex: 9999 }}
      >
        <div className="px-4 py-6 space-y-6">
            {/* FREE Banner */}
            <div className="text-center py-3 rounded-xl bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30">
              <span className="text-green-400 font-bold text-lg">✨ 100% FREE - No Sign Up Required ✨</span>
            </div>

            {/* Primary CTAs */}
            <div className="grid grid-cols-2 gap-3">
              <Link 
                href="/sus" 
                onClick={() => setMobileMenuOpen(false)} 
                className="flex items-center justify-center gap-2 py-4 rounded-xl font-bold text-white shadow-lg"
                style={{ background: 'linear-gradient(135deg, #FF3366, #FF6B00)' }}
              >
                <AlertTriangle className="w-5 h-5" /> Sus Plays
              </Link>
              <Link 
                href="/leaderboard" 
                onClick={() => setMobileMenuOpen(false)} 
                className="flex items-center justify-center gap-2 py-4 rounded-xl font-bold shadow-lg"
                style={{ background: 'linear-gradient(135deg, #FFD700, #FF8C00)', color: '#000' }}
              >
                <Trophy className="w-5 h-5" /> Expert Tracker
              </Link>
            </div>

            {/* Sports Grid */}
            <div>
              <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Sports</div>
              <div className="grid grid-cols-3 gap-3">
                {sportsNav.map((sport) => (
                  <Link 
                    key={sport.href} 
                    href={sport.href} 
                    onClick={() => setMobileMenuOpen(false)} 
                    className={cn(
                      'flex flex-col items-center gap-2 py-4 rounded-xl transition-all bg-gradient-to-br',
                      sport.color
                    )}
                  >
                    <span className="text-3xl">{sport.emoji}</span>
                    <span className="text-xs font-bold text-white">{sport.name}</span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Prediction Markets */}
            <div>
              <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Prediction Markets</div>
              <div className="grid grid-cols-3 gap-3">
                {marketsNav.slice(0, 6).map((market) => (
                  <Link 
                    key={market.href} 
                    href={market.href} 
                    onClick={() => setMobileMenuOpen(false)} 
                    className={cn(
                      'flex flex-col items-center gap-2 py-4 rounded-xl transition-all bg-gradient-to-br',
                      market.color
                    )}
                  >
                    <span className="text-2xl">{market.emoji}</span>
                    <span className="text-xs font-bold text-white">{market.name}</span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Quick Links</div>
              <div className="grid grid-cols-2 gap-2">
                <Link 
                  href="/scores" 
                  onClick={() => setMobileMenuOpen(false)} 
                  className="flex items-center gap-3 p-4 rounded-xl bg-green-500/10 border border-green-500/20 hover:bg-green-500/20 transition-all"
                >
                  <Activity className="w-5 h-5 text-green-400" />
                  <span className="text-sm font-semibold text-white">Live Scores</span>
                </Link>
                <Link 
                  href="/markets" 
                  onClick={() => setMobileMenuOpen(false)} 
                  className="flex items-center gap-3 p-4 rounded-xl bg-purple-500/10 border border-purple-500/20 hover:bg-purple-500/20 transition-all"
                >
                  <Star className="w-5 h-5 text-purple-400" />
                  <span className="text-sm font-semibold text-white">All Markets</span>
                </Link>
              </div>
            </div>

            {/* Tools */}
            <div>
              <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Tools & Analytics</div>
              <div className="grid grid-cols-2 gap-2">
                {toolsNav.map((item) => (
                  <Link 
                    key={item.href} 
                    href={item.href} 
                    onClick={() => setMobileMenuOpen(false)} 
                    className="flex items-center gap-3 p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-all"
                  >
                    <item.icon className="w-5 h-5 text-orange-500" />
                    <span className="text-sm font-semibold text-white">{item.name}</span>
                  </Link>
                ))}
              </div>
            </div>

            {/* User Account Section - Mobile */}
            <div>
              <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Account</div>
              {!authLoading && (
                user ? (
                  <div className="space-y-2">
                    <div className="p-4 rounded-xl bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20">
                      <p className="text-xs text-gray-500">Signed in as</p>
                      <p className="text-sm font-medium text-white truncate">{user.email}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Link 
                        href="/dashboard" 
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-3 p-4 rounded-xl bg-green-500/10 border border-green-500/20 hover:bg-green-500/20 transition-all"
                      >
                        <LayoutDashboard className="w-5 h-5 text-green-400" />
                        <span className="text-sm font-semibold text-white">Dashboard</span>
                      </Link>
                      <Link 
                        href="/control-panel" 
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-3 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20 transition-all"
                      >
                        <Target className="w-5 h-5 text-blue-400" />
                        <span className="text-sm font-semibold text-white">Control Panel</span>
                      </Link>
                      <Link 
                        href="/alerts" 
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-3 p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20 hover:bg-yellow-500/20 transition-all"
                      >
                        <Bell className="w-5 h-5 text-yellow-400" />
                        <span className="text-sm font-semibold text-white">Alerts</span>
                      </Link>
                      {isAdmin && (
                        <Link 
                          href="/admin" 
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center gap-3 p-4 rounded-xl bg-purple-500/10 border border-purple-500/20 hover:bg-purple-500/20 transition-all"
                        >
                          <Shield className="w-5 h-5 text-purple-400" />
                          <span className="text-sm font-semibold text-white">Admin</span>
                        </Link>
                      )}
                    </div>
                    <button 
                      onClick={() => {
                        signOut()
                        setMobileMenuOpen(false)
                      }}
                      className="w-full flex items-center justify-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 transition-all"
                    >
                      <LogOut className="w-5 h-5 text-red-400" />
                      <span className="text-sm font-semibold text-white">Sign Out</span>
                    </button>
                  </div>
                ) : (
                  <Link 
                    href="/auth" 
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-center gap-2 p-4 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold shadow-lg"
                  >
                    <User className="w-5 h-5" />
                    <span>Sign In / Sign Up</span>
                  </Link>
                )
              )}
            </div>
          </div>
        </div>
    </nav>
  )
}
