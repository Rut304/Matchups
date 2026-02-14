'use client'

import { useState, useEffect } from 'react'
import { Cloud, Wind, Droplets, Thermometer, AlertTriangle, Sun, CloudRain, Snowflake, Building } from 'lucide-react'

interface WeatherData {
  location: string
  isOutdoor: boolean
  isDome: boolean
  forecast: {
    temp_f: number
    feels_like_f: number
    condition: string
    wind_mph: number
    wind_dir: string
    humidity: number
    precip_chance: number
    visibility_miles: number
  }
  bettingImpact: {
    scoringImpact: 'higher' | 'lower' | 'neutral'
    passingImpact: 'favorable' | 'unfavorable' | 'neutral'
    overUnderLean: 'over' | 'under' | 'neutral'
    keyFactors: string[]
    confidence: 'high' | 'medium' | 'low'
  }
  summary?: {
    icon: string
    temp: string
    wind: string
    condition: string
    alert: string | null
  }
}

interface WeatherPanelProps {
  venue: string
  city: string
  gameDate: string
  gameTime?: string
  sport: string
  compact?: boolean
}

function getWeatherIcon(condition: string) {
  const c = condition.toLowerCase()
  if (c.includes('sunny') || c.includes('clear')) return <Sun className="w-5 h-5 text-yellow-400" />
  if (c.includes('rain') || c.includes('drizzle')) return <CloudRain className="w-5 h-5 text-blue-400" />
  if (c.includes('snow')) return <Snowflake className="w-5 h-5 text-blue-200" />
  if (c.includes('cloud') || c.includes('overcast')) return <Cloud className="w-5 h-5 text-slate-400" />
  return <Sun className="w-5 h-5 text-yellow-400" />
}

export function WeatherPanel({ venue, city, gameDate, gameTime, sport, compact = false }: WeatherPanelProps) {
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    async function fetchWeather() {
      try {
        const params = new URLSearchParams({
          venue: venue || '',
          city: city || '',
          date: gameDate,
          sport: sport
        })
        if (gameTime) params.set('time', gameTime)
        
        const res = await fetch(`/api/weather?${params}`)
        if (res.ok) {
          const data = await res.json()
          setWeather(data)
        }
      } catch (err) {
        console.error('Weather fetch error:', err)
      } finally {
        setLoading(false)
      }
    }
    
    if (venue || city) {
      fetchWeather()
    } else {
      setLoading(false)
    }
  }, [venue, city, gameDate, gameTime, sport])
  
  if (loading) {
    return (
      <div className="animate-pulse p-3 bg-slate-900/50 rounded-lg border border-slate-800">
        <div className="h-12 bg-slate-800 rounded"></div>
      </div>
    )
  }
  
  if (!weather) {
    return null
  }
  
  // Indoor sports or dome - minimal display
  if (weather.isDome || !weather.isOutdoor) {
    if (compact) return null // Don't show for indoor in compact mode
    return (
      <div className="p-3 bg-slate-900/50 rounded-lg border border-slate-800">
        <div className="flex items-center gap-2 text-slate-400 text-sm">
          <Building className="w-4 h-4" />
          <span>Indoor / Climate Controlled</span>
        </div>
      </div>
    )
  }
  
  const { forecast, bettingImpact, summary } = weather
  
  // Compact mode for game cards
  if (compact) {
    return (
      <div className="flex items-center gap-2 text-xs">
        {getWeatherIcon(forecast.condition)}
        <span className="text-slate-300">{Math.round(forecast.temp_f)}°F</span>
        {forecast.wind_mph >= 10 && (
          <span className="flex items-center gap-1 text-slate-400">
            <Wind className="w-3 h-3" />
            {Math.round(forecast.wind_mph)}mph
          </span>
        )}
        {bettingImpact.overUnderLean !== 'neutral' && (
          <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
            bettingImpact.overUnderLean === 'over' ? 'bg-green-500/20 text-green-400' : 'bg-amber-500/20 text-amber-400'
          }`}>
            {bettingImpact.overUnderLean.toUpperCase()}
          </span>
        )}
      </div>
    )
  }
  
  // Full weather panel
  return (
    <div className="rounded-xl p-4 bg-slate-900/50 border border-slate-800">
      <h3 className="flex items-center gap-2 text-sm font-bold text-white mb-3">
        <Cloud className="w-4 h-4 text-blue-400" />
        Game Weather
      </h3>
      
      {/* Current conditions */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        <div className="text-center">
          <div className="flex justify-center mb-1">
            <Thermometer className="w-4 h-4 text-orange-400" />
          </div>
          <p className="text-lg font-bold text-white">{Math.round(forecast.temp_f)}°F</p>
          <p className="text-xs text-slate-500">Feels {Math.round(forecast.feels_like_f)}°</p>
        </div>
        
        <div className="text-center">
          <div className="flex justify-center mb-1">
            <Wind className="w-4 h-4 text-cyan-400" />
          </div>
          <p className="text-lg font-bold text-white">{Math.round(forecast.wind_mph)}</p>
          <p className="text-xs text-slate-500">mph {forecast.wind_dir}</p>
        </div>
        
        <div className="text-center">
          <div className="flex justify-center mb-1">
            <Droplets className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-lg font-bold text-white">{forecast.precip_chance || 0}%</p>
          <p className="text-xs text-slate-500">precip</p>
        </div>
        
        <div className="text-center">
          <div className="flex justify-center mb-1">
            {getWeatherIcon(forecast.condition)}
          </div>
          <p className="text-sm font-medium text-white truncate">{forecast.condition}</p>
        </div>
      </div>
      
      {/* Betting impact */}
      {bettingImpact.keyFactors.length > 0 && bettingImpact.keyFactors[0] !== 'Favorable conditions - no significant weather impact expected' && (
        <div className="p-3 bg-amber-500/10 rounded-lg border border-amber-500/20">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <span className="text-sm font-medium text-amber-400">Weather Impact</span>
          </div>
          
          <div className="grid grid-cols-3 gap-2 mb-2 text-center text-xs">
            <div>
              <p className="text-slate-500">Scoring</p>
              <p className={`font-bold ${
                bettingImpact.scoringImpact === 'lower' ? 'text-red-400' :
                bettingImpact.scoringImpact === 'higher' ? 'text-green-400' : 'text-slate-300'
              }`}>
                {bettingImpact.scoringImpact.toUpperCase()}
              </p>
            </div>
            <div>
              <p className="text-slate-500">Passing</p>
              <p className={`font-bold ${
                bettingImpact.passingImpact === 'unfavorable' ? 'text-red-400' :
                bettingImpact.passingImpact === 'favorable' ? 'text-green-400' : 'text-slate-300'
              }`}>
                {bettingImpact.passingImpact === 'unfavorable' ? 'HURT' : 
                 bettingImpact.passingImpact === 'favorable' ? 'HELP' : 'NEUTRAL'}
              </p>
            </div>
            <div>
              <p className="text-slate-500">O/U Lean</p>
              <p className={`font-bold ${
                bettingImpact.overUnderLean === 'under' ? 'text-amber-400' :
                bettingImpact.overUnderLean === 'over' ? 'text-green-400' : 'text-slate-300'
              }`}>
                {bettingImpact.overUnderLean.toUpperCase()}
              </p>
            </div>
          </div>
          
          <ul className="text-xs text-slate-300 space-y-1">
            {bettingImpact.keyFactors.slice(0, 3).map((factor, i) => (
              <li key={i}>• {factor}</li>
            ))}
          </ul>
        </div>
      )}
      
      {/* No impact message */}
      {(!bettingImpact.keyFactors.length || bettingImpact.keyFactors[0] === 'Favorable conditions - no significant weather impact expected') && (
        <div className="text-center text-sm text-slate-400">
          <span className="text-green-400">✓</span> Good conditions - no weather concerns
        </div>
      )}
    </div>
  )
}
