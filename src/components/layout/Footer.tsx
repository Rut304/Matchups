'use client'

import Link from 'next/link'
import { Settings } from 'lucide-react'

export function Footer() {
  return (
    <footer className="border-t" style={{ background: '#050508', borderColor: 'rgba(255,255,255,0.06)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Sports */}
          <div>
            <h4 className="font-bold mb-4" style={{ color: '#FFF' }}>Sports</h4>
            <div className="space-y-2">
              {[
                { label: '🏈 NFL', href: '/nfl' },
                { label: '🏀 NBA', href: '/nba' },
                { label: '🏒 NHL', href: '/nhl' },
                { label: '⚾ MLB', href: '/mlb' },
              ].map((link) => (
                <Link key={link.href} href={link.href} 
                      className="block text-sm transition-colors hover:text-white"
                      style={{ color: '#808090' }}>
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
          
          {/* Features */}
          <div>
            <h4 className="font-bold mb-4" style={{ color: '#FFF' }}>Features</h4>
            <div className="space-y-2">
              {[
                { label: '📈 Markets', href: '/markets' },
                { label: '📊 Trends', href: '/trends' },
                { label: '🏆 Leaderboard', href: '/leaderboard' },
              ].map((link) => (
                <Link key={link.href} href={link.href}
                      className="block text-sm transition-colors hover:text-white"
                      style={{ color: '#808090' }}>
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
          
          {/* Company */}
          <div>
            <h4 className="font-bold mb-4" style={{ color: '#FFF' }}>Company</h4>
            <div className="space-y-2">
              {[
                { label: 'About', href: '#' },
                { label: 'Contact', href: '#' },
                { label: 'Privacy', href: '#' },
                { label: 'Terms', href: '#' },
              ].map((link) => (
                <Link key={link.label} href={link.href}
                      className="block text-sm transition-colors hover:text-white"
                      style={{ color: '#808090' }}>
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
          
          {/* Admin (Bottom Left concept - leftmost column) */}
          <div>
            <h4 className="font-bold mb-4" style={{ color: '#FFF' }}>Tools</h4>
            <div className="space-y-2">
              <Link href="/admin" 
                    className="flex items-center gap-2 text-sm transition-colors hover:text-white"
                    style={{ color: '#606070' }}>
                <Settings style={{ width: '14px', height: '14px' }} />
                Admin Dashboard
              </Link>
              <Link href="/admin/docs" 
                    className="flex items-center gap-2 text-sm transition-colors hover:text-white"
                    style={{ color: '#606070' }}>
                📄 Documentation
              </Link>
            </div>
          </div>
        </div>
        
        {/* Bottom Bar */}
        <div className="mt-8 pt-8 flex flex-col md:flex-row items-center justify-between gap-4"
             style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded flex items-center justify-center"
                 style={{ background: 'linear-gradient(135deg, #FF6B00, #FF3366)' }}>
              <span className="text-xs">⚡</span>
            </div>
            <span className="text-sm font-bold" style={{ color: '#FFF' }}>Matchups</span>
          </div>
          <p className="text-xs" style={{ color: '#606070' }}>
            © 2026 Matchups. Sports betting analysis & trends.
          </p>
        </div>
      </div>
    </footer>
  )
}
