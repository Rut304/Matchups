import { NextResponse } from 'next/server'
import { getScoreboard, transformESPNGame, type SportKey } from '@/lib/api/espn'
import { getWeatherForVenue, analyzeWeatherImpact, DOME_VENUES as DOME_VENUES_SET } from '@/lib/weather'

// Outdoor venue database - list of NFL/MLB stadiums that are outdoors
const OUTDOOR_VENUES: Record<string, boolean> = {
  // NFL Outdoor Stadiums
  'lambeau field': true,
  'soldier field': true,
  'highmark stadium': true,
  'hard rock stadium': true,
  'empower field at mile high': true,
  'acrisure stadium': true,
  'firstenergy stadium': true,
  'heinz field': true,
  'gillette stadium': true,
  'fedexfield': true,
  'levi\'s stadium': true,
  'lincoln financial field': true,
  'metlife stadium': true,
  'bank of america stadium': true,
  'tiaa bank field': true,
  'raymond james stadium': true,
  'nissan stadium': true,
  'paycor stadium': true,
  'm&t bank stadium': true,
  'arrowhead stadium': true,
  'huntington bank field': true,
  // MLB - all outdoor except domes
  'fenway park': true,
  'wrigley field': true,
  'yankee stadium': true,
  'dodger stadium': true,
  'petco park': true,
  'oracle park': true,
  'coors field': true,
  'busch stadium': true,
  'citizens bank park': true,
  'pnc park': true,
  'camden yards': true,
  'guaranteed rate field': true,
  'kauffman stadium': true,
  'target field': true,
  'comerica park': true,
  'progressive field': true,
  'great american ball park': true,
}

// Dome venues (weather not a factor)
const DOME_VENUES: Record<string, boolean> = {
  'mercedes-benz stadium': true,
  'at&t stadium': true,
  'caesars superdome': true,
  'u.s. bank stadium': true,
  'ford field': true,
  'lucas oil stadium': true,
  'state farm stadium': true,
  'allegiant stadium': true,
  'sofi stadium': true,
  'nrg stadium': true,
  'tropicana field': true,
  't-mobile park': true,
  'chase field': true,
  'minute maid park': true,
  'rogers centre': true,
  'globe life field': true,
  'loanDepot park': true,
  'american family field': true,
}

interface GameWeather {
  id: string
  sport: 'NFL' | 'MLB'
  game: string
  homeTeam: string
  awayTeam: string
  venue: string
  isOutdoor: boolean
  gameTime: string
  weather: {
    temperature: number | null
    conditions: string
    windSpeed: number | null
    windDirection: string
    precipitation: number
    humidity: number
  }
  bettingImpact: {
    level: 'none' | 'low' | 'medium' | 'high'
    description: string
    affectedBets: string[]
  }
}

function isOutdoorVenue(venueName: string): boolean {
  const normalized = venueName.toLowerCase()
  if (DOME_VENUES[normalized] || DOME_VENUES_SET.has(normalized)) return false
  return OUTDOOR_VENUES[normalized] ?? true // Default to outdoor if unknown
}

function calculateBettingImpact(weather: GameWeather['weather'], sport: string): GameWeather['bettingImpact'] {
  const { temperature, windSpeed, precipitation, conditions } = weather
  const affectedBets: string[] = []
  let level: 'none' | 'low' | 'medium' | 'high' = 'none'
  let description = 'Good playing conditions. No significant weather impact expected.'

  // Check for high-impact conditions
  if (precipitation > 60 || conditions.toLowerCase().includes('rain') || conditions.toLowerCase().includes('snow')) {
    level = 'high'
    affectedBets.push('totals', 'passing props')
    description = 'Precipitation expected - favors the under and running game.'
  }

  if (windSpeed && windSpeed > 20) {
    level = level === 'high' ? 'high' : 'medium'
    affectedBets.push('passing props', 'kicker props')
    description = `High winds (${windSpeed} mph) will impact passing and kicking game.`
    if (sport === 'MLB') {
      description = `Strong winds may affect ball flight - check wind direction for over/under edge.`
    }
  }

  if (temperature && temperature < 32 && sport === 'NFL') {
    level = level === 'high' ? 'high' : 'medium'
    affectedBets.push('totals')
    description = `Cold temperatures (${temperature}°F) - historically favors unders and home teams.`
  }

  if (temperature && temperature > 85 && sport === 'NFL') {
    level = level === 'none' ? 'low' : level
    description = `Hot conditions may impact conditioning. Monitor team depth and injury reports.`
  }

  if (conditions.toLowerCase().includes('snow')) {
    level = 'high'
    affectedBets.push('totals', 'rushing props', 'turnover props')
    description = 'Snow conditions favor running game and increase turnover risk. Strong under lean.'
  }

  return { level, description, affectedBets: [...new Set(affectedBets)] }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const sport = searchParams.get('sport')?.toUpperCase() as 'NFL' | 'MLB' | 'ALL' | null
  const outdoorOnly = searchParams.get('outdoorOnly')
  const minImpact = searchParams.get('minImpact')

  const gameWeathers: GameWeather[] = []
  
  // Determine which sports to fetch (only NFL and MLB have weather impact)
  const sportsToFetch: SportKey[] = sport === 'NFL' ? ['NFL'] 
    : sport === 'MLB' ? ['MLB'] 
    : ['NFL', 'MLB']

  // Fetch games from ESPN, then enrich with OpenWeatherMap
  await Promise.all(
    sportsToFetch.map(async (s) => {
      try {
        const scoreboard = await getScoreboard(s as SportKey)
        
        for (const event of scoreboard.events) {
          const game = transformESPNGame(event, s as SportKey)
          const venue = game.venue || 'Unknown Venue'
          const isOutdoor = isOutdoorVenue(venue)
          
          // ESPN provides basic weather (temp + condition text only)
          const espnWeather = event.competitions[0]?.weather
          
          // Try OpenWeatherMap for detailed weather (wind, humidity, precipitation)
          const owmForecast = isOutdoor 
            ? await getWeatherForVenue(venue, game.scheduledAt)
            : null
          
          let weather: GameWeather['weather']
          let bettingImpact: GameWeather['bettingImpact']
          
          if (owmForecast) {
            // Real weather from OpenWeatherMap
            weather = {
              temperature: owmForecast.temperature,
              conditions: owmForecast.conditions,
              windSpeed: owmForecast.windSpeed,
              windDirection: owmForecast.windDirection,
              precipitation: owmForecast.precipitation,
              humidity: owmForecast.humidity,
            }
            const analysis = analyzeWeatherImpact(owmForecast, s as 'NFL' | 'MLB', venue)
            bettingImpact = {
              level: analysis.level,
              description: analysis.insights.join(' '),
              affectedBets: analysis.affectedBets,
            }
          } else {
            // Fallback to ESPN data
            weather = {
              temperature: espnWeather?.temperature ?? game.weather?.temp ?? null,
              conditions: espnWeather?.displayValue || game.weather?.condition || (isOutdoor ? 'Clear' : 'Indoor (Dome)'),
              windSpeed: null,
              windDirection: 'N/A',
              precipitation: 0,
              humidity: 50,
            }
            bettingImpact = isOutdoor 
              ? calculateBettingImpact(weather, s)
              : { level: 'none' as const, description: 'Indoor stadium - weather not a factor.', affectedBets: [] }
          }

          gameWeathers.push({
            id: game.id,
            sport: s as 'NFL' | 'MLB',
            game: `${game.away.abbreviation} @ ${game.home.abbreviation}`,
            homeTeam: game.home.name || '',
            awayTeam: game.away.name || '',
            venue,
            isOutdoor,
            gameTime: game.scheduledAt,
            weather,
            bettingImpact,
          })
        }
      } catch (error) {
        console.error(`Error fetching ${s} weather:`, error)
      }
    })
  )

  // Apply filters
  let filteredData = gameWeathers

  // Filter outdoor only
  if (outdoorOnly === 'true') {
    filteredData = filteredData.filter(w => w.isOutdoor)
  }

  // Filter by minimum impact level
  if (minImpact) {
    const impactLevels = ['none', 'low', 'medium', 'high']
    const minIndex = impactLevels.indexOf(minImpact)
    if (minIndex >= 0) {
      filteredData = filteredData.filter(w => 
        impactLevels.indexOf(w.bettingImpact.level) >= minIndex
      )
    }
  }

  return NextResponse.json({
    games: filteredData,
    count: filteredData.length,
    lastUpdated: new Date().toISOString(),
    source: process.env.OPENWEATHER_API_KEY ? 'openweathermap+espn' : 'espn'
  })
}
