'use client'

import { MapPin, Tv, Clock, Cloud, Thermometer, Wind } from 'lucide-react'
import type { Game, WeatherData } from '@/types/sports'

interface GameInfoProps {
  game: Game
  weather?: WeatherData | null
  showWeather?: boolean
}

export default function GameInfo({ game, weather, showWeather = true }: GameInfoProps) {
  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('en-US', {
      weekday: 'long',
      month: 'long', 
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZone: 'America/New_York'
    }) + ' ET'
  }

  const isOutdoorSport = ['nfl', 'mlb', 'ncaaf'].includes(game.sport)

  return (
    <div className="bg-[#0c0c14] rounded-xl border border-white/10 p-6">
      <h3 className="text-lg font-bold text-white mb-4">Game Info</h3>
      
      <div className="space-y-3 text-sm">
        {/* Date/Time */}
        <div className="flex items-center gap-2 text-gray-400">
          <Clock className="w-4 h-4" />
          <span>{formatDateTime(game.scheduledAt || game.startTime)}</span>
        </div>
        
        {/* Venue */}
        {game.venue && (
          <div className="flex items-center gap-2 text-gray-400">
            <MapPin className="w-4 h-4" />
            <span>{game.venue}</span>
          </div>
        )}
        
        {/* Broadcast */}
        {game.broadcast && (
          <div className="flex items-center gap-2 text-gray-400">
            <Tv className="w-4 h-4" />
            <span>{game.broadcast}</span>
          </div>
        )}
      </div>
      
      {/* Weather for outdoor sports */}
      {showWeather && isOutdoorSport && (weather || game.weather) && (
        <div className="mt-4 pt-4 border-t border-white/5">
          <h4 className="text-sm font-semibold text-gray-400 mb-3 flex items-center gap-2">
            <Cloud className="w-4 h-4" />
            Weather Conditions
          </h4>
          <div className="grid grid-cols-2 gap-3 text-sm">
            {(weather?.temp || game.weather?.temp) && (
              <div className="flex items-center gap-2 text-gray-400">
                <Thermometer className="w-4 h-4 text-orange-400" />
                <span>{weather?.temp || game.weather?.temp}°F</span>
              </div>
            )}
            {(weather?.condition || game.weather?.condition) && (
              <div className="flex items-center gap-2 text-gray-400">
                <Cloud className="w-4 h-4 text-blue-400" />
                <span>{weather?.condition || game.weather?.condition}</span>
              </div>
            )}
            {(weather?.wind || game.weather?.wind) && (
              <div className="flex items-center gap-2 text-gray-400">
                <Wind className="w-4 h-4 text-cyan-400" />
                <span>{weather?.wind || game.weather?.wind}</span>
              </div>
            )}
            {(weather?.precipitation !== undefined || game.weather?.precipitation !== undefined) && (
              <div className="flex items-center gap-2 text-gray-400">
                <span className="text-blue-400">💧</span>
                <span>{weather?.precipitation || game.weather?.precipitation}% precip</span>
              </div>
            )}
          </div>
          
          {/* Weather impact note */}
          {(weather?.wind || game.weather?.wind) && (
            <div className="mt-3 text-xs text-gray-500">
              {(weather?.wind || game.weather?.wind || '').includes('20+') && (
                <span className="text-amber-400">⚠️ High winds may impact passing/kicking game</span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
