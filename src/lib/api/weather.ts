/**
 * WEATHER API INTEGRATION
 * Uses WeatherAPI.com (1M free calls/month)
 * 
 * Features:
 * - Current conditions for outdoor sports (NFL, MLB, NCAAF)
 * - Game time forecasts
 * - Wind, precipitation, and temperature data
 * - Betting implications (weather impacts scoring)
 */

const WEATHER_API_KEY = process.env.WEATHER_API_KEY
const BASE_URL = 'https://api.weatherapi.com/v1'

// =============================================================================
// TYPES
// =============================================================================

export interface GameWeather {
  location: string
  gameTime: string
  current: WeatherConditions
  forecast: WeatherConditions  // Forecast for game time
  bettingImpact: {
    scoringImpact: 'higher' | 'lower' | 'neutral'
    passingImpact: 'favorable' | 'unfavorable' | 'neutral'
    overUnderLean: 'over' | 'under' | 'neutral'
    keyFactors: string[]
    confidence: 'high' | 'medium' | 'low'
  }
  isOutdoor: boolean
  isDome: boolean
}

export interface WeatherConditions {
  temp_f: number
  temp_c: number
  feels_like_f: number
  condition: string
  condition_icon: string
  wind_mph: number
  wind_dir: string
  humidity: number
  precip_in: number
  precip_chance: number
  visibility_miles: number
  uv: number
  is_day: boolean
}

interface WeatherAPIResponse {
  location: {
    name: string
    region: string
    country: string
    localtime: string
  }
  current: {
    temp_f: number
    temp_c: number
    feelslike_f: number
    condition: { text: string; icon: string }
    wind_mph: number
    wind_dir: string
    humidity: number
    precip_in: number
    vis_miles: number
    uv: number
    is_day: number
  }
  forecast?: {
    forecastday: Array<{
      date: string
      hour: Array<{
        time: string
        temp_f: number
        temp_c: number
        feelslike_f: number
        condition: { text: string; icon: string }
        wind_mph: number
        wind_dir: string
        humidity: number
        precip_in: number
        chance_of_rain: number
        chance_of_snow: number
        vis_miles: number
        uv: number
        is_day: number
      }>
    }>
  }
}

// Known dome stadiums (no weather impact)
const DOME_STADIUMS: Record<string, boolean> = {
  // NFL
  'AT&T Stadium': true, 'Cowboys Stadium': true,
  'Caesars Superdome': true, 'Mercedes-Benz Superdome': true,
  'Lucas Oil Stadium': true,
  'Ford Field': true,
  'US Bank Stadium': true,
  'Mercedes-Benz Stadium': true,
  'Allegiant Stadium': true,
  'State Farm Stadium': true, // Retractable
  'SoFi Stadium': true,
  'NRG Stadium': true, // Retractable
  // College
  'Carrier Dome': true, 'JMA Wireless Dome': true,
  'Georgia Dome': true,
  'Alamodome': true,
}

// =============================================================================
// API FUNCTIONS
// =============================================================================

/**
 * Get current weather for a location
 */
async function getCurrentWeather(location: string): Promise<WeatherAPIResponse | null> {
  if (!WEATHER_API_KEY) {
    console.warn('WEATHER_API_KEY not set')
    return null
  }
  
  try {
    const url = `${BASE_URL}/current.json?key=${WEATHER_API_KEY}&q=${encodeURIComponent(location)}&aqi=no`
    const res = await fetch(url, { next: { revalidate: 1800 } }) // Cache 30 min
    
    if (!res.ok) {
      console.error(`Weather API error: ${res.status}`)
      return null
    }
    
    return await res.json()
  } catch (error) {
    console.error('Weather fetch error:', error)
    return null
  }
}

/**
 * Get forecast for a specific date/time
 */
async function getForecast(location: string, date: string): Promise<WeatherAPIResponse | null> {
  if (!WEATHER_API_KEY) {
    console.warn('WEATHER_API_KEY not set')
    return null
  }
  
  try {
    const url = `${BASE_URL}/forecast.json?key=${WEATHER_API_KEY}&q=${encodeURIComponent(location)}&dt=${date}&aqi=no`
    const res = await fetch(url, { next: { revalidate: 3600 } }) // Cache 1 hour
    
    if (!res.ok) {
      console.error(`Weather API error: ${res.status}`)
      return null
    }
    
    return await res.json()
  } catch (error) {
    console.error('Weather forecast error:', error)
    return null
  }
}

/**
 * Get weather for a game
 */
export async function getGameWeather(
  venue: string,
  city: string,
  gameDate: string,
  gameTime?: string,
  sport?: string
): Promise<GameWeather | null> {
  const venueLower = venue?.toLowerCase() || ''
  
  // Check if dome
  const isDome = DOME_STADIUMS[venue] || venueLower.includes('dome')
  
  // NHL outdoor events (Winter Classic, Stadium Series, Heritage Classic)
  const nhlOutdoorVenues = [
    'wrigley field', 'notre dame stadium', 'michigan stadium', 
    'cotton bowl', 'target field', 'fenway park', 'yankee stadium',
    'commonwealth stadium', 'tim hortons field', 'mosaic stadium'
  ]
  const isNHLOutdoor = sport?.toLowerCase() === 'nhl' && nhlOutdoorVenues.some(v => venueLower.includes(v))
  
  // Indoor sports don't need weather (except NHL outdoor games)
  const indoorSports = ['nba', 'nhl', 'ncaab']
  const sportLower = sport?.toLowerCase() || ''
  
  if (sportLower && indoorSports.includes(sportLower) && !isNHLOutdoor) {
    return {
      location: `${venue}, ${city}`,
      gameTime: gameTime || '',
      current: getDefaultIndoorConditions(),
      forecast: getDefaultIndoorConditions(),
      bettingImpact: {
        scoringImpact: 'neutral',
        passingImpact: 'neutral',
        overUnderLean: 'neutral',
        keyFactors: ['Indoor game - weather not a factor'],
        confidence: 'high'
      },
      isOutdoor: false,
      isDome: true
    }
  }
  
  // Get location string
  const location = city || venue
  
  // Fetch weather data
  const [currentData, forecastData] = await Promise.all([
    getCurrentWeather(location),
    getForecast(location, gameDate)
  ])
  
  if (!currentData) {
    return null
  }
  
  // Parse current conditions
  const current = parseConditions(currentData.current)
  
  // Get forecast for game time
  let forecast = current
  if (forecastData?.forecast?.forecastday?.[0]?.hour && gameTime) {
    const gameHour = parseInt(gameTime.split(':')[0])
    const hourForecast = forecastData.forecast.forecastday[0].hour.find(h => {
      const hour = new Date(h.time).getHours()
      return hour === gameHour
    })
    if (hourForecast) {
      forecast = parseHourConditions(hourForecast)
    }
  }
  
  // Calculate betting impact
  const bettingImpact = calculateBettingImpact(
    isDome ? getDefaultIndoorConditions() : forecast,
    sport || 'nfl',
    isDome
  )
  
  return {
    location: `${venue}, ${city}`,
    gameTime: gameTime || currentData.location.localtime,
    current,
    forecast: isDome ? getDefaultIndoorConditions() : forecast,
    bettingImpact,
    isOutdoor: !isDome,
    isDome
  }
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function parseConditions(data: WeatherAPIResponse['current']): WeatherConditions {
  return {
    temp_f: data.temp_f,
    temp_c: data.temp_c,
    feels_like_f: data.feelslike_f,
    condition: data.condition.text,
    condition_icon: data.condition.icon,
    wind_mph: data.wind_mph,
    wind_dir: data.wind_dir,
    humidity: data.humidity,
    precip_in: data.precip_in,
    precip_chance: 0,
    visibility_miles: data.vis_miles,
    uv: data.uv,
    is_day: data.is_day === 1
  }
}

function parseHourConditions(data: {
  temp_f: number
  temp_c: number
  feelslike_f: number
  condition: { text: string; icon: string }
  wind_mph: number
  wind_dir: string
  humidity: number
  precip_in: number
  chance_of_rain: number
  chance_of_snow: number
  vis_miles: number
  uv: number
  is_day: number
}): WeatherConditions {
  return {
    temp_f: data.temp_f,
    temp_c: data.temp_c,
    feels_like_f: data.feelslike_f,
    condition: data.condition.text,
    condition_icon: data.condition.icon,
    wind_mph: data.wind_mph,
    wind_dir: data.wind_dir,
    humidity: data.humidity,
    precip_in: data.precip_in,
    precip_chance: Math.max(data.chance_of_rain, data.chance_of_snow),
    visibility_miles: data.vis_miles,
    uv: data.uv,
    is_day: data.is_day === 1
  }
}

function getDefaultIndoorConditions(): WeatherConditions {
  return {
    temp_f: 72,
    temp_c: 22,
    feels_like_f: 72,
    condition: 'Indoor / Climate Controlled',
    condition_icon: '',
    wind_mph: 0,
    wind_dir: 'N/A',
    humidity: 50,
    precip_in: 0,
    precip_chance: 0,
    visibility_miles: 10,
    uv: 0,
    is_day: true
  }
}

/**
 * Calculate how weather impacts betting
 */
function calculateBettingImpact(
  conditions: WeatherConditions,
  sport: string,
  isDome: boolean
): GameWeather['bettingImpact'] {
  if (isDome) {
    return {
      scoringImpact: 'neutral',
      passingImpact: 'neutral',
      overUnderLean: 'neutral',
      keyFactors: ['Dome/indoor game - weather not a factor'],
      confidence: 'high'
    }
  }
  
  const keyFactors: string[] = []
  let scoringImpact: 'higher' | 'lower' | 'neutral' = 'neutral'
  let passingImpact: 'favorable' | 'unfavorable' | 'neutral' = 'neutral'
  let overUnderLean: 'over' | 'under' | 'neutral' = 'neutral'
  let confidenceScore = 0
  
  // WIND - Major factor
  if (conditions.wind_mph >= 20) {
    keyFactors.push(`High winds (${conditions.wind_mph} mph) - hurts passing & kicking`)
    passingImpact = 'unfavorable'
    scoringImpact = 'lower'
    overUnderLean = 'under'
    confidenceScore += 3
  } else if (conditions.wind_mph >= 15) {
    keyFactors.push(`Moderate wind (${conditions.wind_mph} mph) - may affect deep passes`)
    passingImpact = 'unfavorable'
    confidenceScore += 1
  }
  
  // PRECIPITATION
  if (conditions.precip_chance >= 60 || conditions.precip_in > 0.1) {
    keyFactors.push(`Precipitation likely (${conditions.precip_chance}% chance) - expect more runs`)
    passingImpact = 'unfavorable'
    if (overUnderLean !== 'under') overUnderLean = 'under'
    confidenceScore += 2
  }
  
  // TEMPERATURE
  if (conditions.temp_f <= 32) {
    keyFactors.push(`Freezing temps (${conditions.temp_f}°F) - grip issues, more turnovers`)
    scoringImpact = 'lower'
    overUnderLean = 'under'
    confidenceScore += 2
  } else if (conditions.temp_f >= 90) {
    keyFactors.push(`Hot conditions (${conditions.temp_f}°F) - fatigue factor in 4th quarter`)
    confidenceScore += 1
  }
  
  // VISIBILITY
  if (conditions.visibility_miles < 3) {
    keyFactors.push(`Low visibility (${conditions.visibility_miles} mi) - affects all phases`)
    scoringImpact = 'lower'
    confidenceScore += 2
  }
  
  // Sport-specific adjustments
  if (sport.toLowerCase() === 'mlb') {
    if (conditions.wind_mph >= 15) {
      // Check wind direction for baseball
      if (['N', 'NE', 'NW'].includes(conditions.wind_dir)) {
        keyFactors.push(`Wind blowing in - fewer home runs`)
        overUnderLean = 'under'
      } else if (['S', 'SE', 'SW'].includes(conditions.wind_dir)) {
        keyFactors.push(`Wind blowing out - more home runs`)
        overUnderLean = 'over'
        scoringImpact = 'higher'
      }
    }
    
    if (conditions.humidity > 70) {
      keyFactors.push(`High humidity (${conditions.humidity}%) - ball travels less`)
    }
  }
  
  // Default message if no impactful weather
  if (keyFactors.length === 0) {
    keyFactors.push('Favorable conditions - no significant weather impact expected')
  }
  
  const confidence = confidenceScore >= 4 ? 'high' : confidenceScore >= 2 ? 'medium' : 'low'
  
  return {
    scoringImpact,
    passingImpact,
    overUnderLean,
    keyFactors,
    confidence
  }
}

/**
 * Get simplified weather summary for UI
 */
export function getWeatherSummary(weather: GameWeather): {
  icon: string
  temp: string
  wind: string
  condition: string
  alert: string | null
} {
  const { forecast, isDome } = weather
  
  if (isDome) {
    return {
      icon: '🏟️',
      temp: '72°F',
      wind: 'N/A',
      condition: 'Dome',
      alert: null
    }
  }
  
  let alert: string | null = null
  if (forecast.wind_mph >= 15) alert = `Wind: ${forecast.wind_mph} mph`
  if (forecast.precip_chance >= 50) alert = `Rain: ${forecast.precip_chance}%`
  if (forecast.temp_f <= 32) alert = `Cold: ${forecast.temp_f}°F`
  
  return {
    icon: getWeatherEmoji(forecast.condition),
    temp: `${Math.round(forecast.temp_f)}°F`,
    wind: `${Math.round(forecast.wind_mph)} mph ${forecast.wind_dir}`,
    condition: forecast.condition,
    alert
  }
}

function getWeatherEmoji(condition: string): string {
  const c = condition.toLowerCase()
  if (c.includes('sunny') || c.includes('clear')) return '☀️'
  if (c.includes('cloud')) return '☁️'
  if (c.includes('rain') || c.includes('drizzle')) return '🌧️'
  if (c.includes('snow')) return '🌨️'
  if (c.includes('thunder')) return '⛈️'
  if (c.includes('fog') || c.includes('mist')) return '🌫️'
  if (c.includes('wind')) return '💨'
  if (c.includes('overcast')) return '🌥️'
  return '🌤️'
}
