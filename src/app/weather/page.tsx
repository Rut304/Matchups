'use client'

import { useState, useEffect } from 'react'
import {
  Cloud,
  Sun,
  CloudRain,
  CloudSnow,
  Wind,
  Thermometer,
  Droplets,
  AlertTriangle,
  RefreshCw
} from 'lucide-react'

interface WeatherData {
  temp: number
  feelsLike: number
  condition: 'sunny' | 'cloudy' | 'rain' | 'snow' | 'wind'
  description: string
  humidity: number
  windSpeed: number
  windDirection: string
  precipitation: number
  visibility: number
}

interface GameWeather {
  gameId: string
  homeTeam: string
  awayTeam: string
  venue: string
  gameTime: string
  sport: 'NFL' | 'MLB'
  isOutdoor: boolean
  weather: WeatherData
  bettingImpact: string
}

const getWeatherIcon = (condition: string) => {
  switch (condition) {
    case 'sunny': return <Sun className="w-8 h-8" style={{ color: '#FFD700' }} />
    case 'cloudy': return <Cloud className="w-8 h-8" style={{ color: '#808090' }} />
    case 'rain': return <CloudRain className="w-8 h-8" style={{ color: '#00A8FF' }} />
    case 'snow': return <CloudSnow className="w-8 h-8" style={{ color: '#E0E0FF' }} />
    case 'wind': return <Wind className="w-8 h-8" style={{ color: '#00FF88' }} />
    default: return <Cloud className="w-8 h-8" style={{ color: '#808090' }} />
  }
}

const getImpactColor = (condition: string) => {
  switch (condition) {
    case 'sunny': return '#00FF88'
    case 'cloudy': return '#808090'
    case 'rain': return '#00A8FF'
    case 'snow': return '#FF3366'
    case 'wind': return '#FFD700'
    default: return '#808090'
  }
}

const getImpactLevel = (weather: WeatherData): { level: 'low' | 'medium' | 'high', label: string } => {
  if (weather.condition === 'snow' || weather.windSpeed > 25 || weather.temp < 20) {
    return { level: 'high', label: 'High Impact' }
  }
  if (weather.condition === 'rain' || weather.windSpeed > 15 || weather.temp < 35) {
    return { level: 'medium', label: 'Medium Impact' }
  }
  return { level: 'low', label: 'Low Impact' }
}

export function WeatherWidget({ compact = false }: { compact?: boolean }) {
  const [games, setGames] = useState<GameWeather[]>([])
  const [selectedSport, setSelectedSport] = useState<'all' | 'NFL' | 'MLB'>('all')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchWeather() {
      setIsLoading(true)
      try {
        const res = await fetch('/api/weather?sport=all')
        const data = await res.json()
        // Transform API response to match component interface
        const transformed: GameWeather[] = (data.games || []).map((g: Record<string, unknown>) => ({
          gameId: g.gameId || g.id || String(Math.random()),
          homeTeam: g.homeTeam as string || '',
          awayTeam: g.awayTeam as string || '',
          venue: g.venue as string || '',
          gameTime: g.gameTime as string || '',
          sport: (g.sport as 'NFL' | 'MLB') || 'NFL',
          isOutdoor: g.isOutdoor !== false,
          weather: {
            temp: (g.weather as Record<string, unknown>)?.temp as number || 70,
            feelsLike: (g.weather as Record<string, unknown>)?.feelsLike as number || 70,
            condition: (g.weather as Record<string, unknown>)?.condition as 'sunny' | 'cloudy' | 'rain' | 'snow' | 'wind' || 'sunny',
            description: (g.weather as Record<string, unknown>)?.description as string || 'Clear',
            humidity: (g.weather as Record<string, unknown>)?.humidity as number || 50,
            windSpeed: (g.weather as Record<string, unknown>)?.windSpeed as number || 5,
            windDirection: (g.weather as Record<string, unknown>)?.windDirection as string || 'N',
            precipitation: (g.weather as Record<string, unknown>)?.precipitation as number || 0,
            visibility: (g.weather as Record<string, unknown>)?.visibility as number || 10
          },
          bettingImpact: g.bettingImpact as string || 'No significant weather impact'
        }))
        setGames(transformed)
      } catch (error) {
        console.error('Failed to fetch weather:', error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchWeather()
  }, [])

  const filteredGames = games.filter(g => 
    selectedSport === 'all' || g.sport === selectedSport
  )

  const handleRefresh = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/weather?sport=all')
      const data = await res.json()
      const transformed: GameWeather[] = (data.games || []).map((g: Record<string, unknown>) => ({
        gameId: g.gameId || g.id || String(Math.random()),
        homeTeam: g.homeTeam as string || '',
        awayTeam: g.awayTeam as string || '',
        venue: g.venue as string || '',
        gameTime: g.gameTime as string || '',
        sport: (g.sport as 'NFL' | 'MLB') || 'NFL',
        isOutdoor: g.isOutdoor !== false,
        weather: {
          temp: (g.weather as Record<string, unknown>)?.temp as number || 70,
          feelsLike: (g.weather as Record<string, unknown>)?.feelsLike as number || 70,
          condition: (g.weather as Record<string, unknown>)?.condition as 'sunny' | 'cloudy' | 'rain' | 'snow' | 'wind' || 'sunny',
          description: (g.weather as Record<string, unknown>)?.description as string || 'Clear',
          humidity: (g.weather as Record<string, unknown>)?.humidity as number || 50,
          windSpeed: (g.weather as Record<string, unknown>)?.windSpeed as number || 5,
          windDirection: (g.weather as Record<string, unknown>)?.windDirection as string || 'N',
          precipitation: (g.weather as Record<string, unknown>)?.precipitation as number || 0,
          visibility: (g.weather as Record<string, unknown>)?.visibility as number || 10
        },
        bettingImpact: g.bettingImpact as string || 'No significant weather impact'
      }))
      setGames(transformed)
    } catch (error) {
      console.error('Failed to refresh weather:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (compact) {
    // Compact mode for sidebar/dashboard widgets
    return (
      <div className="rounded-xl p-4" style={{ background: '#12121A' }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-white flex items-center gap-2">
            <Cloud className="w-5 h-5" style={{ color: '#00A8FF' }} />
            Weather Report
          </h3>
          <button onClick={handleRefresh} className="p-1 rounded hover:bg-white/5">
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} style={{ color: '#808090' }} />
          </button>
        </div>
        <div className="space-y-3">
          {filteredGames.slice(0, 3).map((game) => {
            const impact = getImpactLevel(game.weather)
            return (
              <div key={game.gameId} className="p-3 rounded-lg" style={{ background: '#0A0A0F' }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-white">{game.awayTeam.split(' ').pop()} @ {game.homeTeam.split(' ').pop()}</span>
                  {getWeatherIcon(game.weather.condition)}
                </div>
                <div className="flex items-center gap-3 text-xs" style={{ color: '#808090' }}>
                  <span>{game.weather.temp}°F</span>
                  <span>{game.weather.windSpeed} mph</span>
                  <span className="px-2 py-0.5 rounded"
                    style={{
                      background: impact.level === 'high' ? '#FF336620' : impact.level === 'medium' ? '#FFD70020' : '#00FF8820',
                      color: impact.level === 'high' ? '#FF3366' : impact.level === 'medium' ? '#FFD700' : '#00FF88'
                    }}
                  >
                    {impact.label}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // Full weather view
  return (
    <div className="min-h-screen" style={{ background: '#0A0A0F' }}>
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-xl" style={{ background: 'linear-gradient(135deg, #00A8FF, #00FF88)' }}>
                <Cloud className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-black text-white">Weather Impact</h1>
                <p style={{ color: '#808090' }} className="text-sm">Game-time conditions for outdoor venues</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex gap-2">
              {(['all', 'NFL', 'MLB'] as const).map((sport) => (
                <button
                  key={sport}
                  onClick={() => setSelectedSport(sport)}
                  className="px-4 py-2 rounded-xl font-medium transition-all"
                  style={{
                    background: selectedSport === sport ? '#00A8FF' : '#12121A',
                    color: selectedSport === sport ? '#FFF' : '#808090'
                  }}
                >
                  {sport === 'all' ? 'All' : sport}
                </button>
              ))}
            </div>
            <button
              onClick={handleRefresh}
              className="p-2 rounded-xl transition-all hover:bg-white/5"
              style={{ background: '#12121A' }}
            >
              <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} style={{ color: '#808090' }} />
            </button>
          </div>
        </div>

        {/* Impact Legend */}
        <div className="flex flex-wrap gap-4 mb-6 p-4 rounded-xl" style={{ background: '#12121A' }}>
          <span className="text-sm" style={{ color: '#808090' }}>Impact Legend:</span>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full" style={{ background: '#00FF88' }}></span>
            <span className="text-sm text-white">Low</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full" style={{ background: '#FFD700' }}></span>
            <span className="text-sm text-white">Medium</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full" style={{ background: '#FF3366' }}></span>
            <span className="text-sm text-white">High</span>
          </div>
        </div>

        {/* Games Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {filteredGames.map((game) => {
            const impact = getImpactLevel(game.weather)
            return (
              <div
                key={game.gameId}
                className="rounded-2xl overflow-hidden"
                style={{ background: '#12121A' }}
              >
                {/* Game Header */}
                <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <div>
                    <span className="text-xs font-semibold px-2 py-1 rounded-full" style={{ background: '#FF6B0020', color: '#FF6B00' }}>
                      {game.sport}
                    </span>
                    <p className="text-lg font-bold text-white mt-2">{game.awayTeam} @ {game.homeTeam}</p>
                    <p className="text-sm" style={{ color: '#808090' }}>{game.venue} • {game.gameTime}</p>
                  </div>
                  <div className="text-center">
                    {getWeatherIcon(game.weather.condition)}
                    <p className="text-xs mt-1" style={{ color: '#808090' }}>{game.weather.description}</p>
                  </div>
                </div>

                {/* Weather Details */}
                <div className="p-6">
                  <div className="grid grid-cols-4 gap-4 mb-4">
                    <div className="text-center">
                      <Thermometer className="w-5 h-5 mx-auto mb-1" style={{ color: '#FF6B00' }} />
                      <p className="text-lg font-bold text-white">{game.weather.temp}°</p>
                      <p className="text-xs" style={{ color: '#808090' }}>Feels {game.weather.feelsLike}°</p>
                    </div>
                    <div className="text-center">
                      <Wind className="w-5 h-5 mx-auto mb-1" style={{ color: '#00A8FF' }} />
                      <p className="text-lg font-bold text-white">{game.weather.windSpeed}</p>
                      <p className="text-xs" style={{ color: '#808090' }}>mph {game.weather.windDirection}</p>
                    </div>
                    <div className="text-center">
                      <Droplets className="w-5 h-5 mx-auto mb-1" style={{ color: '#00FF88' }} />
                      <p className="text-lg font-bold text-white">{game.weather.precipitation}%</p>
                      <p className="text-xs" style={{ color: '#808090' }}>precip</p>
                    </div>
                    <div className="text-center">
                      <Cloud className="w-5 h-5 mx-auto mb-1" style={{ color: '#808090' }} />
                      <p className="text-lg font-bold text-white">{game.weather.humidity}%</p>
                      <p className="text-xs" style={{ color: '#808090' }}>humidity</p>
                    </div>
                  </div>

                  {/* Impact Assessment */}
                  <div className="p-4 rounded-xl" style={{ 
                    background: impact.level === 'high' ? 'rgba(255,51,102,0.1)' : 
                               impact.level === 'medium' ? 'rgba(255,215,0,0.1)' : 'rgba(0,255,136,0.1)'
                  }}>
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="w-4 h-4" style={{ 
                        color: impact.level === 'high' ? '#FF3366' : 
                               impact.level === 'medium' ? '#FFD700' : '#00FF88'
                      }} />
                      <span className="font-semibold text-sm" style={{ 
                        color: impact.level === 'high' ? '#FF3366' : 
                               impact.level === 'medium' ? '#FFD700' : '#00FF88'
                      }}>
                        {impact.label} Weather
                      </span>
                    </div>
                    <p className="text-sm" style={{ color: '#808090' }}>
                      {game.bettingImpact}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {filteredGames.length === 0 && (
          <div className="text-center py-12">
            <Sun className="w-12 h-12 mx-auto mb-4" style={{ color: '#808090' }} />
            <p className="text-lg text-white mb-2">No outdoor games scheduled</p>
            <p style={{ color: '#808090' }}>Check back closer to game day</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default function WeatherPage() {
  return <WeatherWidget />
}
