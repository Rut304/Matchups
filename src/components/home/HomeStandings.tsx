'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Medal, ChevronRight } from 'lucide-react'
import { getStandings, type SportKey, type ESPNStanding } from '@/lib/api/espn'

interface StandingTeam {
  name: string
  abbrev: string
  record: string
  wins: number
  losses: number
}

export function HomeStandings() {
  const [nflStandings, setNflStandings] = useState<StandingTeam[]>([])
  const [nbaStandings, setNbaStandings] = useState<StandingTeam[]>([])
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch from our API which wraps ESPN
        const [nflRes, nbaRes] = await Promise.all([
          fetch('/api/standings?sport=NFL'),
          fetch('/api/standings?sport=NBA'),
        ])
        
        const nflData = await nflRes.json()
        const nbaData = await nbaRes.json()
        
        // Transform and sort by wins
        const transformStandings = (data: { standings?: ESPNStanding[] }) => {
          return (data.standings || [])
            .map((s: ESPNStanding) => {
              const winsLosses = s.stats?.find(stat => stat.name === 'wins' || stat.name === 'overall')?.displayValue || '0-0'
              const [wins, losses] = winsLosses.split('-').map(Number)
              return {
                name: s.team.displayName,
                abbrev: s.team.abbreviation,
                record: winsLosses,
                wins: wins || 0,
                losses: losses || 0,
              }
            })
            .sort((a: StandingTeam, b: StandingTeam) => b.wins - a.wins)
            .slice(0, 4)
        }
        
        setNflStandings(transformStandings(nflData))
        setNbaStandings(transformStandings(nbaData))
      } catch (error) {
        console.error('Error fetching standings:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])
  
  if (loading) {
    return (
      <div className="rounded-2xl p-5 bg-[#0c0c14] border border-white/5">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-700/30 rounded w-32 mb-4"></div>
          {[1,2,3,4].map(i => (
            <div key={i} className="h-8 bg-gray-700/20 rounded mb-2"></div>
          ))}
        </div>
      </div>
    )
  }
  
  return (
    <div className="rounded-2xl p-5 bg-[#0c0c14] border border-white/5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Medal className="w-[18px] h-[18px] text-blue-400" />
          <h3 className="font-bold text-white">Standings</h3>
        </div>
        <Link href="/stats?view=standings" className="text-xs font-semibold text-blue-400">
          Full Standings
        </Link>
      </div>
      
      <div className="max-h-[320px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
        {/* NFL Standings */}
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <span>🏈</span>
            <span className="text-xs font-semibold text-orange-500">NFL LEADERS</span>
          </div>
          <div className="space-y-1">
            {nflStandings.length === 0 ? (
              <p className="text-gray-500 text-xs">No NFL standings available</p>
            ) : (
              nflStandings.map((team, i) => (
                <Link key={team.abbrev} href={`/nfl?team=${team.abbrev}`}
                      className={`flex items-center justify-between py-1.5 px-2 rounded transition-all hover:bg-white/10 ${i === 0 ? 'bg-orange-500/10' : ''}`}>
                  <div className="flex items-center gap-2">
                    <span className="w-4 text-xs text-center text-gray-500">{i + 1}</span>
                    <span className="font-semibold text-white">{team.abbrev}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="text-gray-400">{team.record}</span>
                    <ChevronRight className="w-3 h-3 text-gray-600" />
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
        
        {/* NBA Standings */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span>🏀</span>
            <span className="text-xs font-semibold text-blue-400">NBA LEADERS</span>
          </div>
          <div className="space-y-1">
            {nbaStandings.length === 0 ? (
              <p className="text-gray-500 text-xs">No NBA standings available</p>
            ) : (
              nbaStandings.map((team, i) => (
                <Link key={team.abbrev} href={`/nba?team=${team.abbrev}`}
                      className={`flex items-center justify-between py-1.5 px-2 rounded transition-all hover:bg-white/10 ${i === 0 ? 'bg-blue-500/10' : ''}`}>
                  <div className="flex items-center gap-2">
                    <span className="w-4 text-xs text-center text-gray-500">{i + 1}</span>
                    <span className="font-semibold text-white">{team.abbrev}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="text-gray-400">{team.record}</span>
                    <ChevronRight className="w-3 h-3 text-gray-600" />
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
