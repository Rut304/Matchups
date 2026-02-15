'use client'

import { useState, useEffect } from 'react'
import { Trophy, TrendingUp, TrendingDown, Minus, Shield, Swords, Zap } from 'lucide-react'

interface TeamRating {
  team: string
  name: string
  elo: number
  rank: number
  power: number
  offense: number
  defense: number
  record: string
  trend: 'hot' | 'cold' | 'steady'
  last5Change: number
}

interface PowerRatingsProps {
  sport: string
  homeTeam: string
  awayTeam: string
  compact?: boolean
}

export function PowerRatingsComparison({ 
  sport, 
  homeTeam, 
  awayTeam,
  compact = false 
}: PowerRatingsProps) {
  const [homeRating, setHomeRating] = useState<TeamRating | null>(null)
  const [awayRating, setAwayRating] = useState<TeamRating | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  useEffect(() => {
    async function fetchRatings() {
      try {
        const [homeRes, awayRes] = await Promise.all([
          fetch(`/api/team-ratings?sport=${sport}&team=${homeTeam}`),
          fetch(`/api/team-ratings?sport=${sport}&team=${awayTeam}`)
        ])
        
        if (homeRes.ok) {
          const homeData = await homeRes.json()
          if (homeData.ratings?.length > 0) {
            setHomeRating(homeData.ratings[0])
          }
        }
        
        if (awayRes.ok) {
          const awayData = await awayRes.json()
          if (awayData.ratings?.length > 0) {
            setAwayRating(awayData.ratings[0])
          }
        }
      } catch (err) {
        setError('Failed to load ratings')
      } finally {
        setLoading(false)
      }
    }
    
    if (homeTeam && awayTeam && sport) {
      fetchRatings()
    }
  }, [sport, homeTeam, awayTeam])
  
  if (loading) {
    return (
      <div className="animate-pulse p-4 bg-slate-900/50 rounded-xl border border-slate-800">
        <div className="h-20 bg-slate-800 rounded"></div>
      </div>
    )
  }
  
  if (!homeRating && !awayRating) {
    return null // Don't show section if no ratings available
  }
  
  const eloDiff = (homeRating?.elo || 1500) - (awayRating?.elo || 1500)
  const powerDiff = (homeRating?.power || 0) - (awayRating?.power || 0)
  
  // If no ratings data available, don't render the component
  if (!awayRating?.elo && !homeRating?.elo) return null
  
  // Calculate predicted spread from Elo (rough approximation)
  // Every 25 Elo points ≈ 1 point spread, plus home advantage (~3 points)
  const predictedSpread = -(eloDiff / 25 + 3)
  
  const TrendIcon = ({ trend, change }: { trend: string; change: number }) => {
    if (trend === 'hot' || change > 5) return <TrendingUp className="w-3 h-3 text-green-400" />
    if (trend === 'cold' || change < -5) return <TrendingDown className="w-3 h-3 text-red-400" />
    return <Minus className="w-3 h-3 text-slate-500" />
  }
  
  if (compact) {
    return (
      <div className="flex items-center justify-between p-2 bg-slate-900/50 rounded-lg border border-slate-800 text-xs">
        <div className="text-center">
          <span className="text-slate-500">Away</span>
          <p className="font-bold text-white">{awayRating?.elo || '—'}</p>
          <span className="text-slate-500">#{awayRating?.rank || '—'}</span>
        </div>
        <div className="text-center px-3">
          <span className="text-orange-500 font-bold">Elo</span>
          <p className="text-xs text-slate-400">
            {Math.abs(eloDiff) < 50 ? 'Even' : 
             eloDiff > 0 ? `Home +${Math.round(eloDiff)}` : 
             `Away +${Math.round(Math.abs(eloDiff))}`}
          </p>
        </div>
        <div className="text-center">
          <span className="text-slate-500">Home</span>
          <p className="font-bold text-white">{homeRating?.elo || '—'}</p>
          <span className="text-slate-500">#{homeRating?.rank || '—'}</span>
        </div>
      </div>
    )
  }
  
  return (
    <div className="rounded-xl p-4 bg-slate-900/50 border border-slate-800">
      <h3 className="flex items-center gap-2 text-sm font-bold text-white mb-3">
        <Trophy className="w-4 h-4 text-yellow-500" />
        Power Ratings
      </h3>
      
      {/* Elo Comparison */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        {/* Away Team */}
        <div className="text-center">
          <p className="text-xs text-slate-500 mb-1">{awayRating?.name || awayTeam}</p>
          <p className="text-2xl font-black text-white">{awayRating?.elo || '—'}</p>
          <div className="flex items-center justify-center gap-1 text-xs">
            <span className="text-slate-500">#{awayRating?.rank || '—'}</span>
            {awayRating && <TrendIcon trend={awayRating.trend} change={awayRating.last5Change} />}
          </div>
        </div>
        
        {/* vs / diff */}
        <div className="flex flex-col items-center justify-center">
          <p className="text-xs text-slate-500 mb-1">ELO DIFF</p>
          <p className={`text-lg font-bold ${
            Math.abs(eloDiff) < 50 ? 'text-slate-400' :
            eloDiff > 0 ? 'text-green-400' : 'text-red-400'
          }`}>
            {eloDiff > 0 ? '+' : ''}{Math.round(eloDiff)}
          </p>
          <p className="text-xs text-slate-500">
            {Math.abs(eloDiff) < 50 ? 'Even' : 
             eloDiff > 0 ? 'Home Edge' : 'Away Edge'}
          </p>
        </div>
        
        {/* Home Team */}
        <div className="text-center">
          <p className="text-xs text-slate-500 mb-1">{homeRating?.name || homeTeam}</p>
          <p className="text-2xl font-black text-white">{homeRating?.elo || '—'}</p>
          <div className="flex items-center justify-center gap-1 text-xs">
            <span className="text-slate-500">#{homeRating?.rank || '—'}</span>
            {homeRating && <TrendIcon trend={homeRating.trend} change={homeRating.last5Change} />}
          </div>
        </div>
      </div>
      
      {/* Power Ratings Breakdown */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        {/* Offense */}
        <div className="p-2 bg-slate-800/50 rounded flex items-center gap-2">
          <Swords className="w-3 h-3 text-orange-400" />
          <div className="flex-1">
            <p className="text-slate-500">Offense</p>
            <div className="flex justify-between">
              <span className={awayRating && awayRating.offense > (homeRating?.offense || 0) ? 'text-green-400 font-bold' : 'text-slate-300'}>
                {awayRating?.offense !== undefined ? (awayRating.offense > 0 ? '+' : '') + awayRating.offense : '—'}
              </span>
              <span className={homeRating && homeRating.offense > (awayRating?.offense || 0) ? 'text-green-400 font-bold' : 'text-slate-300'}>
                {homeRating?.offense !== undefined ? (homeRating.offense > 0 ? '+' : '') + homeRating.offense : '—'}
              </span>
            </div>
          </div>
        </div>
        
        {/* Defense */}
        <div className="p-2 bg-slate-800/50 rounded flex items-center gap-2">
          <Shield className="w-3 h-3 text-blue-400" />
          <div className="flex-1">
            <p className="text-slate-500">Defense</p>
            <div className="flex justify-between">
              <span className={awayRating && awayRating.defense > (homeRating?.defense || 0) ? 'text-green-400 font-bold' : 'text-slate-300'}>
                {awayRating?.defense !== undefined ? (awayRating.defense > 0 ? '+' : '') + awayRating.defense : '—'}
              </span>
              <span className={homeRating && homeRating.defense > (awayRating?.defense || 0) ? 'text-green-400 font-bold' : 'text-slate-300'}>
                {homeRating?.defense !== undefined ? (homeRating.defense > 0 ? '+' : '') + homeRating.defense : '—'}
              </span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Predicted spread from Elo */}
      {(homeRating && awayRating) && (
        <div className="mt-3 p-2 bg-orange-500/10 rounded border border-orange-500/20 text-center">
          <div className="flex items-center justify-center gap-2">
            <Zap className="w-3 h-3 text-orange-500" />
            <span className="text-xs text-orange-400">Elo-Based Spread</span>
          </div>
          <p className="text-sm font-bold text-white mt-1">
            {predictedSpread > 0 ? `${awayTeam} ${Math.abs(predictedSpread).toFixed(1)}` : 
             predictedSpread < 0 ? `${homeTeam} ${Math.abs(predictedSpread).toFixed(1)}` :
             'Pick\'em'}
          </p>
        </div>
      )}
    </div>
  )
}
