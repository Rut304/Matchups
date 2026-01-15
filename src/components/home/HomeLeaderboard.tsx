'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Users } from 'lucide-react'

interface CapperData {
  rank: number
  id: string
  slug: string
  name: string
  avatarEmoji: string
  avatarUrl?: string
  verified: boolean
  capperType: string
  record: { wins: number; losses: number; pushes: number }
  winRate: number
  roi: number
  units: number
  streak: string
}

export function HomeLeaderboard() {
  const [cappers, setCappers] = useState<CapperData[]>([])
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/leaderboard?limit=5')
        const data = await res.json()
        setCappers(data.leaderboard || [])
      } catch (error) {
        console.error('Error fetching leaderboard:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])
  
  if (loading) {
    return (
      <div className="rounded-2xl p-6" style={{ 
        background: 'linear-gradient(135deg, #0c0c14 0%, #101018 100%)',
        border: '1px solid rgba(255,215,0,0.2)'
      }}>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-700/30 rounded w-48 mb-6"></div>
          {[1,2,3,4,5].map(i => (
            <div key={i} className="h-12 bg-gray-700/20 rounded mb-2"></div>
          ))}
        </div>
      </div>
    )
  }
  
  return (
    <div className="rounded-2xl p-6" style={{ 
      background: 'linear-gradient(135deg, #0c0c14 0%, #101018 100%)',
      border: '1px solid rgba(255,215,0,0.2)'
    }}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg" style={{ background: 'rgba(255,215,0,0.15)' }}>
            <Image src="/wrong-stamp.jpeg" alt="Wrong" width={32} height={24} className="-rotate-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold" style={{ color: '#FFF' }}>Expert Tracker</h2>
            <p className="text-xs" style={{ color: '#808090' }}>How the "experts" are actually doing • Receipts don't lie</p>
          </div>
        </div>
        <Link href="/leaderboard" className="flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-all hover:scale-105"
              style={{ background: 'rgba(255,215,0,0.15)', color: '#FFD700', border: '1px solid rgba(255,215,0,0.3)' }}>
          <Users style={{ width: '16px', height: '16px' }} />
          Full Rankings
        </Link>
      </div>
      
      {/* Leaderboard Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <th className="text-left py-3 px-2 text-xs font-semibold" style={{ color: '#606070' }}>RANK</th>
              <th className="text-left py-3 px-2 text-xs font-semibold" style={{ color: '#606070' }}>CAPPER</th>
              <th className="text-center py-3 px-2 text-xs font-semibold" style={{ color: '#606070' }}>RECORD</th>
              <th className="text-center py-3 px-2 text-xs font-semibold" style={{ color: '#606070' }}>WIN %</th>
              <th className="text-center py-3 px-2 text-xs font-semibold" style={{ color: '#606070' }}>UNITS</th>
              <th className="text-center py-3 px-2 text-xs font-semibold" style={{ color: '#606070' }}>STREAK</th>
            </tr>
          </thead>
          <tbody>
            {cappers.map((capper) => (
              <tr key={capper.id} className="transition-all hover:bg-white/[0.02]" 
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                <td className="py-3 px-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold"
                       style={{ 
                         background: capper.rank === 1 ? 'rgba(255,215,0,0.2)' : 
                                    capper.rank === 2 ? 'rgba(192,192,192,0.2)' : 
                                    capper.rank === 3 ? 'rgba(205,127,50,0.2)' : 'rgba(255,255,255,0.05)',
                         color: capper.rank === 1 ? '#FFD700' : 
                                capper.rank === 2 ? '#C0C0C0' : 
                                capper.rank === 3 ? '#CD7F32' : '#808090'
                       }}>
                    {capper.rank === 1 ? '🥇' : capper.rank === 2 ? '🥈' : capper.rank === 3 ? '🥉' : capper.rank}
                  </div>
                </td>
                <td className="py-3 px-2">
                  <Link href={`/leaderboard/${capper.slug}`} className="flex items-center gap-2 hover:text-orange-400">
                    <span className="text-lg">{capper.avatarEmoji}</span>
                    <div>
                      <div className="font-semibold flex items-center gap-1" style={{ color: '#FFF' }}>
                        {capper.name}
                        {capper.verified && <span className="text-blue-400 text-xs">✓</span>}
                      </div>
                      <div className="text-xs" style={{ color: '#606070' }}>{capper.capperType}</div>
                    </div>
                  </Link>
                </td>
                <td className="py-3 px-2 text-center font-mono font-semibold" style={{ color: '#A0A0B0' }}>
                  {capper.record.wins}-{capper.record.losses}
                </td>
                <td className="py-3 px-2 text-center">
                  <span className="font-bold" style={{ color: capper.winRate >= 60 ? '#00FF88' : capper.winRate >= 55 ? '#FFD700' : '#A0A0B0' }}>
                    {capper.winRate.toFixed(1)}%
                  </span>
                </td>
                <td className="py-3 px-2 text-center">
                  <span className="font-bold" style={{ color: capper.units > 0 ? '#00FF88' : '#FF4455' }}>
                    {capper.units > 0 ? '+' : ''}{capper.units.toFixed(1)}
                  </span>
                </td>
                <td className="py-3 px-2 text-center">
                  <span className="px-2 py-1 rounded text-xs font-bold"
                        style={{ 
                          background: capper.streak.startsWith('W') ? 'rgba(0,255,136,0.15)' : 'rgba(255,68,85,0.15)',
                          color: capper.streak.startsWith('W') ? '#00FF88' : '#FF4455'
                        }}>
                    {capper.streak || '-'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* CTA */}
      <div className="mt-6 pt-4 flex items-center justify-between" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <span className="text-sm" style={{ color: '#808090' }}>No more hiding — every pick is tracked</span>
        <Link href="/leaderboard" className="text-sm font-bold" style={{ color: '#FFD700' }}>
          Check the Receipts →
        </Link>
      </div>
    </div>
  )
}
