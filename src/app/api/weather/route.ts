import { NextResponse } from 'next/server'

interface GameWeather {
  id: string
  sport: 'NFL' | 'MLB'
  game: string
  venue: string
  isOutdoor: boolean
  gameTime: string
  weather: {
    temperature: number
    conditions: string
    windSpeed: number
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

// Mock weather data - in production, connect to weather API
const generateWeatherData = (): GameWeather[] => {
  return [
    {
      id: '1',
      sport: 'NFL',
      game: 'Packers @ Bears',
      venue: 'Soldier Field',
      isOutdoor: true,
      gameTime: '2025-01-05T18:00:00Z',
      weather: {
        temperature: 18,
        conditions: 'Snow',
        windSpeed: 22,
        windDirection: 'NW',
        precipitation: 65,
        humidity: 85
      },
      bettingImpact: {
        level: 'high',
        description: 'Cold temps and snow favor the under. Wind affects passing game.',
        affectedBets: ['totals', 'passing props', 'kicker props']
      }
    },
    {
      id: '2',
      sport: 'NFL',
      game: 'Bills @ Dolphins',
      venue: 'Hard Rock Stadium',
      isOutdoor: true,
      gameTime: '2025-01-05T13:00:00Z',
      weather: {
        temperature: 78,
        conditions: 'Partly Cloudy',
        windSpeed: 8,
        windDirection: 'SE',
        precipitation: 10,
        humidity: 72
      },
      bettingImpact: {
        level: 'low',
        description: 'Good playing conditions. Slight home field advantage for Dolphins in heat.',
        affectedBets: []
      }
    },
    {
      id: '3',
      sport: 'NFL',
      game: 'Chiefs @ Raiders',
      venue: 'Allegiant Stadium',
      isOutdoor: false,
      gameTime: '2025-01-05T16:25:00Z',
      weather: {
        temperature: 72,
        conditions: 'Indoor (Dome)',
        windSpeed: 0,
        windDirection: 'N/A',
        precipitation: 0,
        humidity: 45
      },
      bettingImpact: {
        level: 'none',
        description: 'Indoor stadium - weather not a factor.',
        affectedBets: []
      }
    },
    {
      id: '4',
      sport: 'NFL',
      game: 'Browns @ Steelers',
      venue: 'Acrisure Stadium',
      isOutdoor: true,
      gameTime: '2025-01-05T13:00:00Z',
      weather: {
        temperature: 32,
        conditions: 'Rain/Sleet Mix',
        windSpeed: 15,
        windDirection: 'W',
        precipitation: 80,
        humidity: 90
      },
      bettingImpact: {
        level: 'high',
        description: 'Wet conditions increase fumble risk. Under is historically +15% ROI in these conditions.',
        affectedBets: ['totals', 'rushing props', 'turnover props']
      }
    },
    {
      id: '5',
      sport: 'MLB',
      game: 'Cubs @ Cardinals',
      venue: 'Busch Stadium',
      isOutdoor: true,
      gameTime: '2025-04-15T19:15:00Z',
      weather: {
        temperature: 55,
        conditions: 'Windy',
        windSpeed: 25,
        windDirection: 'Out to LF',
        precipitation: 5,
        humidity: 55
      },
      bettingImpact: {
        level: 'high',
        description: 'Strong wind blowing out favors hitters. Over is +EV.',
        affectedBets: ['totals', 'home run props', 'first 5 innings']
      }
    }
  ]
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const sport = searchParams.get('sport')
  const outdoorOnly = searchParams.get('outdoorOnly')
  const minImpact = searchParams.get('minImpact')

  let weatherData = generateWeatherData()

  // Filter by sport
  if (sport && sport !== 'all') {
    weatherData = weatherData.filter(w => w.sport.toLowerCase() === sport.toLowerCase())
  }

  // Filter outdoor only
  if (outdoorOnly === 'true') {
    weatherData = weatherData.filter(w => w.isOutdoor)
  }

  // Filter by minimum impact level
  if (minImpact) {
    const impactLevels = ['none', 'low', 'medium', 'high']
    const minIndex = impactLevels.indexOf(minImpact)
    if (minIndex >= 0) {
      weatherData = weatherData.filter(w => 
        impactLevels.indexOf(w.bettingImpact.level) >= minIndex
      )
    }
  }

  return NextResponse.json({
    games: weatherData,
    count: weatherData.length,
    lastUpdated: new Date().toISOString()
  })
}
