/**
 * OpenWeatherMap Integration for Betting Weather Intelligence
 * 
 * Provides real wind speed, humidity, precipitation probability, and detailed
 * forecast data that ESPN doesn't provide. Essential for totals and prop betting.
 * 
 * Free tier: 1,000 calls/day (plenty for ~30 games/day)
 * Requires OPENWEATHER_API_KEY env var
 */

// Stadium coordinates for weather lookups
// Only outdoor venues matter for betting - dome venues skip weather entirely
export const STADIUM_COORDS: Record<string, { lat: number; lon: number; name: string; sport: string }> = {
  // ===== NFL OUTDOOR STADIUMS =====
  'lambeau field': { lat: 44.5013, lon: -88.0622, name: 'Lambeau Field', sport: 'NFL' },
  'soldier field': { lat: 41.8623, lon: -87.6167, name: 'Soldier Field', sport: 'NFL' },
  'highmark stadium': { lat: 42.7738, lon: -78.7870, name: 'Highmark Stadium', sport: 'NFL' },
  'hard rock stadium': { lat: 25.9580, lon: -80.2389, name: 'Hard Rock Stadium', sport: 'NFL' },
  'empower field at mile high': { lat: 39.7439, lon: -105.0201, name: 'Empower Field', sport: 'NFL' },
  'acrisure stadium': { lat: 40.4468, lon: -80.0158, name: 'Acrisure Stadium', sport: 'NFL' },
  'firstenergy stadium': { lat: 41.5061, lon: -81.6995, name: 'FirstEnergy Stadium', sport: 'NFL' },
  'huntington bank field': { lat: 41.5061, lon: -81.6995, name: 'Huntington Bank Field', sport: 'NFL' },
  'gillette stadium': { lat: 42.0909, lon: -71.2643, name: 'Gillette Stadium', sport: 'NFL' },
  'fedexfield': { lat: 38.9076, lon: -76.8645, name: 'FedExField', sport: 'NFL' },
  'northwest stadium': { lat: 38.9076, lon: -76.8645, name: 'Northwest Stadium', sport: 'NFL' },
  'levi\'s stadium': { lat: 37.4033, lon: -121.9694, name: "Levi's Stadium", sport: 'NFL' },
  'lincoln financial field': { lat: 39.9008, lon: -75.1675, name: 'Lincoln Financial Field', sport: 'NFL' },
  'metlife stadium': { lat: 40.8128, lon: -74.0742, name: 'MetLife Stadium', sport: 'NFL' },
  'bank of america stadium': { lat: 35.2258, lon: -80.8528, name: 'Bank of America Stadium', sport: 'NFL' },
  'tiaa bank field': { lat: 30.3239, lon: -81.6373, name: 'TIAA Bank Field', sport: 'NFL' },
  'everbank stadium': { lat: 30.3239, lon: -81.6373, name: 'EverBank Stadium', sport: 'NFL' },
  'raymond james stadium': { lat: 27.9759, lon: -82.5033, name: 'Raymond James Stadium', sport: 'NFL' },
  'nissan stadium': { lat: 36.1665, lon: -86.7713, name: 'Nissan Stadium', sport: 'NFL' },
  'paycor stadium': { lat: 39.0954, lon: -84.5160, name: 'Paycor Stadium', sport: 'NFL' },
  'm&t bank stadium': { lat: 39.2780, lon: -76.6227, name: 'M&T Bank Stadium', sport: 'NFL' },
  'arrowhead stadium': { lat: 39.0489, lon: -94.4839, name: 'Arrowhead Stadium', sport: 'NFL' },
  'geha field at arrowhead stadium': { lat: 39.0489, lon: -94.4839, name: 'Arrowhead Stadium', sport: 'NFL' },

  // ===== MLB OUTDOOR STADIUMS =====
  'fenway park': { lat: 42.3467, lon: -71.0972, name: 'Fenway Park', sport: 'MLB' },
  'wrigley field': { lat: 41.9484, lon: -87.6553, name: 'Wrigley Field', sport: 'MLB' },
  'yankee stadium': { lat: 40.8296, lon: -73.9262, name: 'Yankee Stadium', sport: 'MLB' },
  'dodger stadium': { lat: 34.0739, lon: -118.2400, name: 'Dodger Stadium', sport: 'MLB' },
  'petco park': { lat: 32.7076, lon: -117.1570, name: 'Petco Park', sport: 'MLB' },
  'oracle park': { lat: 37.7786, lon: -122.3893, name: 'Oracle Park', sport: 'MLB' },
  'coors field': { lat: 39.7559, lon: -104.9942, name: 'Coors Field', sport: 'MLB' },
  'busch stadium': { lat: 38.6226, lon: -90.1928, name: 'Busch Stadium', sport: 'MLB' },
  'citizens bank park': { lat: 39.9061, lon: -75.1665, name: 'Citizens Bank Park', sport: 'MLB' },
  'pnc park': { lat: 40.4469, lon: -80.0057, name: 'PNC Park', sport: 'MLB' },
  'camden yards': { lat: 39.2838, lon: -76.6218, name: 'Camden Yards', sport: 'MLB' },
  'oriole park at camden yards': { lat: 39.2838, lon: -76.6218, name: 'Camden Yards', sport: 'MLB' },
  'guaranteed rate field': { lat: 41.8299, lon: -87.6338, name: 'Guaranteed Rate Field', sport: 'MLB' },
  'rate field': { lat: 41.8299, lon: -87.6338, name: 'Rate Field', sport: 'MLB' },
  'kauffman stadium': { lat: 39.0517, lon: -94.4803, name: 'Kauffman Stadium', sport: 'MLB' },
  'target field': { lat: 44.9817, lon: -93.2776, name: 'Target Field', sport: 'MLB' },
  'comerica park': { lat: 42.3390, lon: -83.0485, name: 'Comerica Park', sport: 'MLB' },
  'progressive field': { lat: 41.4962, lon: -81.6852, name: 'Progressive Field', sport: 'MLB' },
  'great american ball park': { lat: 39.0974, lon: -84.5082, name: 'Great American Ball Park', sport: 'MLB' },
  'angel stadium': { lat: 33.8003, lon: -117.8827, name: 'Angel Stadium', sport: 'MLB' },
  'oakland coliseum': { lat: 37.7516, lon: -122.2005, name: 'Oakland Coliseum', sport: 'MLB' },
  'citi field': { lat: 40.7571, lon: -73.8458, name: 'Citi Field', sport: 'MLB' },
  'nationals park': { lat: 38.8730, lon: -77.0075, name: 'Nationals Park', sport: 'MLB' },
  't-mobile park': { lat: 47.5914, lon: -122.3325, name: 'T-Mobile Park', sport: 'MLB' }, // Retractable roof
}

export const DOME_VENUES = new Set([
  'mercedes-benz stadium', 'at&t stadium', 'caesars superdome', 'u.s. bank stadium',
  'ford field', 'lucas oil stadium', 'state farm stadium', 'allegiant stadium',
  'sofi stadium', 'nrg stadium', 'tropicana field', 'chase field',
  'minute maid park', 'rogers centre', 'globe life field', 'loandepot park',
  'american family field', 'unified field',
])

export interface WeatherForecast {
  temperature: number        // °F
  feelsLike: number          // °F
  humidity: number           // 0-100%
  windSpeed: number          // mph
  windGust: number | null    // mph
  windDirection: string      // N, NE, E, etc.
  precipitation: number      // probability 0-100%
  conditions: string         // "Clear", "Rain", "Snow", etc.
  icon: string               // OpenWeatherMap icon code
  visibility: number         // miles
  pressure: number           // hPa
}

function degToCompass(deg: number): string {
  const sectors = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW']
  return sectors[Math.round(deg / 22.5) % 16]
}

function kelvinToFahrenheit(k: number): number {
  return Math.round((k - 273.15) * 9/5 + 32)
}

function mpsToMph(mps: number): number {
  return Math.round(mps * 2.237)
}

/**
 * Fetch weather for a venue from OpenWeatherMap
 * Uses forecast endpoint to get weather at game time (not just current)
 */
export async function getWeatherForVenue(
  venueName: string, 
  gameTime?: string
): Promise<WeatherForecast | null> {
  const apiKey = process.env.OPENWEATHER_API_KEY
  if (!apiKey) return null

  const normalized = venueName.toLowerCase()
  
  // Skip dome venues
  if (DOME_VENUES.has(normalized)) return null
  
  const coords = STADIUM_COORDS[normalized]
  if (!coords) return null

  try {
    // If game is within 5 days, use 3-hour forecast endpoint
    // Otherwise use current weather
    const gameDate = gameTime ? new Date(gameTime) : new Date()
    const hoursFromNow = (gameDate.getTime() - Date.now()) / (1000 * 60 * 60)
    
    if (hoursFromNow > 0 && hoursFromNow < 120) {
      // Use 5-day/3-hour forecast (free tier)
      const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${coords.lat}&lon=${coords.lon}&appid=${apiKey}`
      const res = await fetch(url, { next: { revalidate: 1800 } }) // Cache 30 min
      if (!res.ok) return null
      
      const data = await res.json()
      
      // Find the forecast closest to game time
      const targetTs = gameDate.getTime() / 1000
      let closest = data.list?.[0]
      let closestDiff = Infinity
      
      for (const entry of data.list || []) {
        const diff = Math.abs(entry.dt - targetTs)
        if (diff < closestDiff) {
          closestDiff = diff
          closest = entry
        }
      }
      
      if (!closest) return null
      
      return {
        temperature: kelvinToFahrenheit(closest.main.temp),
        feelsLike: kelvinToFahrenheit(closest.main.feels_like),
        humidity: closest.main.humidity,
        windSpeed: mpsToMph(closest.wind.speed),
        windGust: closest.wind.gust ? mpsToMph(closest.wind.gust) : null,
        windDirection: degToCompass(closest.wind.deg),
        precipitation: Math.round((closest.pop || 0) * 100),
        conditions: closest.weather?.[0]?.main || 'Clear',
        icon: closest.weather?.[0]?.icon || '01d',
        visibility: Math.round((closest.visibility || 10000) / 1609), // meters to miles
        pressure: closest.main.pressure,
      }
    } else {
      // Current weather
      const url = `https://api.openweathermap.org/data/2.5/weather?lat=${coords.lat}&lon=${coords.lon}&appid=${apiKey}`
      const res = await fetch(url, { next: { revalidate: 1800 } })
      if (!res.ok) return null
      
      const data = await res.json()
      
      return {
        temperature: kelvinToFahrenheit(data.main.temp),
        feelsLike: kelvinToFahrenheit(data.main.feels_like),
        humidity: data.main.humidity,
        windSpeed: mpsToMph(data.wind.speed),
        windGust: data.wind.gust ? mpsToMph(data.wind.gust) : null,
        windDirection: degToCompass(data.wind.deg || 0),
        precipitation: data.rain ? 80 : data.clouds?.all > 80 ? 30 : 0,
        conditions: data.weather?.[0]?.main || 'Clear',
        icon: data.weather?.[0]?.icon || '01d',
        visibility: Math.round((data.visibility || 10000) / 1609),
        pressure: data.main.pressure,
      }
    }
  } catch (err) {
    console.error('[OpenWeather] Error fetching for', venueName, err)
    return null
  }
}

/**
 * Analyze weather impact on betting
 * Returns actionable insights for totals and props
 */
export function analyzeWeatherImpact(
  weather: WeatherForecast, 
  sport: 'NFL' | 'MLB',
  venueName?: string
): {
  level: 'none' | 'low' | 'medium' | 'high'
  totalLean: 'over' | 'under' | 'neutral'
  insights: string[]
  affectedBets: string[]
  score: number  // 0-100, higher = more impact
} {
  const insights: string[] = []
  const affectedBets: string[] = []
  let score = 0
  let totalLean: 'over' | 'under' | 'neutral' = 'neutral'

  // Wind analysis
  if (weather.windSpeed >= 25) {
    score += 30
    insights.push(`${weather.windSpeed} mph winds (gusts ${weather.windGust || '?'} mph) — major passing/kicking impact`)
    affectedBets.push('totals', 'passing props', 'kicker props', 'FG props')
    totalLean = 'under'
  } else if (weather.windSpeed >= 15) {
    score += 15
    insights.push(`${weather.windSpeed} mph winds — moderate impact on deep passing`)
    affectedBets.push('passing props', 'kicker props')
    if (sport === 'MLB') {
      // Wind direction matters for MLB
      const outBlowing = ['S', 'SW', 'SSW'].includes(weather.windDirection)
      if (outBlowing) {
        insights.push(`Wind blowing OUT (${weather.windDirection}) — favors hitters`)
        totalLean = 'over'
      } else if (['N', 'NW', 'NNW'].includes(weather.windDirection)) {
        insights.push(`Wind blowing IN (${weather.windDirection}) — suppresses offense`)
        totalLean = 'under'
      }
    }
  }

  // Temperature analysis
  if (weather.temperature < 32) {
    score += 20
    insights.push(`Freezing temps (${weather.temperature}°F, feels ${weather.feelsLike}°F) — ball harder to grip/catch`)
    affectedBets.push('totals', 'passing props')
    totalLean = 'under'
  } else if (weather.temperature < 40) {
    score += 10
    insights.push(`Cold conditions (${weather.temperature}°F) — slight edge to under`)
  } else if (weather.temperature > 90 && sport === 'NFL') {
    score += 10
    insights.push(`Heat advisory (${weather.temperature}°F) — conditioning factor in 4th quarter`)
  }

  // Precipitation
  if (weather.precipitation >= 60) {
    score += 25
    insights.push(`${weather.precipitation}% precipitation chance (${weather.conditions}) — slippery conditions`)
    affectedBets.push('totals', 'fumble props')
    totalLean = 'under'
    if (weather.conditions === 'Snow') {
      score += 15
      insights.push('SNOW GAME — historically strong under indicator, rushing game dominates')
      affectedBets.push('rushing props')
    }
  } else if (weather.precipitation >= 30) {
    score += 10
    insights.push(`${weather.precipitation}% rain chance — monitor closer to game time`)
  }

  // Humidity (mostly MLB relevant)
  if (sport === 'MLB' && weather.humidity < 30) {
    insights.push(`Low humidity (${weather.humidity}%) — ball carries farther`)
    totalLean = 'over'
    score += 5
  }

  // Altitude (Coors Field special case)
  if (venueName?.toLowerCase() === 'coors field') {
    score += 10
    insights.push('Mile-high altitude — ball carries 5-10% farther, inflated totals')
    totalLean = 'over'
    affectedBets.push('totals', 'HR props')
  }

  // Determine level
  let level: 'none' | 'low' | 'medium' | 'high' = 'none'
  if (score >= 40) level = 'high'
  else if (score >= 20) level = 'medium'
  else if (score >= 5) level = 'low'

  if (insights.length === 0) {
    insights.push('Good playing conditions — no significant weather impact')
  }

  return {
    level,
    totalLean,
    insights,
    affectedBets: [...new Set(affectedBets)],
    score: Math.min(score, 100),
  }
}
