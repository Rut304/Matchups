'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { 
  Home, 
  TrendingUp, 
  BarChart3, 
  Settings,
  Menu,
  X,
  Zap,
  AlertTriangle
} from 'lucide-react'
import { useState } from 'react'

const navigation = [
  { name: 'Dashboard', href: '/', icon: Home },
  { name: 'NFL', href: '/nfl', icon: () => <span className="text-lg">🏈</span> },
  { name: 'NBA', href: '/nba', icon: () => <span className="text-lg">🏀</span> },
  { name: 'NHL', href: '/nhl', icon: () => <span className="text-lg">🏒</span> },
  { name: 'MLB', href: '/mlb', icon: () => <span className="text-lg">⚾</span> },
  { name: 'Sus Plays', href: '/sus', icon: AlertTriangle, highlight: true },
  { name: 'Markets', href: '/markets', icon: BarChart3 },
]

export function Navbar() {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background-secondary/80 backdrop-blur-xl border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-accent to-highlight rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-background" />
            </div>
            <span className="text-xl font-bold text-text-primary">
              Matchups
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href || 
                (item.href !== '/' && pathname.startsWith(item.href))
              const Icon = item.icon
              const isHighlight = 'highlight' in item && item.highlight

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all',
                    isHighlight
                      ? 'text-white hover:scale-105'
                      : isActive
                        ? 'bg-accent/10 text-accent'
                        : 'text-text-secondary hover:text-text-primary hover:bg-background-tertiary'
                  )}
                  style={isHighlight ? { background: 'linear-gradient(135deg, #FF3366, #FF6B00)' } : undefined}
                >
                  <Icon className="w-4 h-4" />
                  {item.name}
                </Link>
              )
            })}
          </div>

          {/* Right side - valuable real estate for future features */}
          <div className="flex items-center gap-4">
            <Link
              href="/leaderboard"
              className="hidden md:flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-bold transition-all hover:scale-105"
              style={{ background: 'linear-gradient(135deg, #FF6B00, #FF3366)', color: '#000' }}
            >
              🎯 Check the Experts
            </Link>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-background-tertiary"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-background-secondary">
          <div className="px-4 py-3 space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href || 
                (item.href !== '/' && pathname.startsWith(item.href))
              const Icon = item.icon
              const isHighlight = 'highlight' in item && item.highlight

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all',
                    isHighlight
                      ? 'text-white'
                      : isActive
                        ? 'bg-accent/10 text-accent'
                        : 'text-text-secondary hover:text-text-primary hover:bg-background-tertiary'
                  )}
                  style={isHighlight ? { background: 'linear-gradient(135deg, #FF3366, #FF6B00)' } : undefined}
                >
                  <Icon className="w-4 h-4" />
                  {item.name}
                </Link>
              )
            })}
            <Link
              href="/leaderboard"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-bold transition-all"
              style={{ background: 'linear-gradient(135deg, #FF6B00, #FF3366)', color: '#000' }}
            >
              🏆 Leaderboard
            </Link>
          </div>
        </div>
      )}
    </nav>
  )
}
