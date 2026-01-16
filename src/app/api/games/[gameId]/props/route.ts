/**
 * Player Props API for a specific game
 * Returns player props with multi-book odds comparison
 */

import { NextRequest, NextResponse } from 'next/server'

const ODDS_API_KEY = process.env.THE_ODDS_API_KEY

// Sport key mapping for The Odds API
const SPORT_KEYS: Record<string, string> = {
  'NFL': 'americanfootball_nfl',
  'NCAAF': 'americanfootball_ncaaf',
  'NBA': 'basketball_nba',
  'NCAAB': 'basketball_ncaab',
  'NHL': 'icehockey_nhl',
  'MLB': 'baseball_mlb',
  'WNBA': 'basketball_wnba',
  'WNCAAB': 'basketball_wncaab',
}

// Player prop market types per sport
const PROP_MARKETS: Record<string, string[]> = {
  NFL: [
    'player_pass_yds', 'player_pass_tds', 'player_pass_completions', 'player_pass_attempts', 'player_interceptions',
    'player_rush_yds', 'player_rush_attempts', 'player_rush_tds',
    'player_reception_yds', 'player_receptions', 'player_reception_tds',
    'player_anytime_td'
  ],
  NBA: [
    'player_points', 'player_rebounds', 'player_assists',
    'player_points_rebounds', 'player_points_assists', 'player_rebounds_assists',
    'player_points_rebounds_assists',
    'player_threes', 'player_steals', 'player_blocks', 'player_turnovers'
  ],
  NHL: [
    'player_points', 'player_goals', 'player_assists',
    'player_shots_on_goal', 'player_blocked_shots',
    'player_power_play_points'
  ],
  MLB: [
    'batter_hits', 'batter_total_bases', 'batter_rbis', 'batter_runs_scored',
    'batter_home_runs', 'batter_walks', 'batter_stolen_bases',
    'pitcher_strikeouts', 'pitcher_outs', 'pitcher_earned_runs', 'pitcher_hits_allowed'
  ],
  NCAAF: ['player_pass_yds', 'player_rush_yds', 'player_reception_yds', 'player_anytime_td'],
  NCAAB: ['player_points', 'player_rebounds', 'player_assists', 'player_threes'],
  WNBA: ['player_points', 'player_rebounds', 'player_assists'],
  WNCAAB: ['player_points', 'player_rebounds', 'player_assists'],
}

// Display names for prop types
const PROP_DISPLAY_NAMES: Record<string, string> = {
  'player_pass_yds': 'Passing Yards',
  'player_pass_tds': 'Passing TDs',
  'player_pass_completions': 'Completions',
  'player_pass_attempts': 'Pass Attempts',
  'player_interceptions': 'Interceptions',
  'player_rush_yds': 'Rushing Yards',
  'player_rush_attempts': 'Carries',
  'player_rush_tds': 'Rushing TDs',
  'player_reception_yds': 'Receiving Yards',
  'player_receptions': 'Receptions',
  'player_reception_tds': 'Receiving TDs',
  'player_anytime_td': 'Anytime TD',
  'player_points': 'Points',
  'player_rebounds': 'Rebounds',
  'player_assists': 'Assists',
  'player_points_rebounds': 'Points + Rebounds',
  'player_points_assists': 'Points + Assists',
  'player_rebounds_assists': 'Rebounds + Assists',
  'player_points_rebounds_assists': 'Pts + Reb + Ast',
  'player_threes': '3-Pointers Made',
  'player_steals': 'Steals',
  'player_blocks': 'Blocks',
  'player_turnovers': 'Turnovers',
  'player_goals': 'Goals',
  'player_shots_on_goal': 'Shots on Goal',
  'player_blocked_shots': 'Blocked Shots',
  'player_power_play_points': 'Power Play Points',
  'batter_hits': 'Hits',
  'batter_total_bases': 'Total Bases',
  'batter_rbis': 'RBIs',
  'batter_runs_scored': 'Runs Scored',
  'batter_home_runs': 'Home Runs',
  'batter_walks': 'Walks',
  'batter_stolen_bases': 'Stolen Bases',
  'pitcher_strikeouts': 'Strikeouts',
  'pitcher_outs': 'Outs Recorded',
  'pitcher_earned_runs': 'Earned Runs',
  'pitcher_hits_allowed': 'Hits Allowed',
}

interface PlayerPropLine {
  player: string
  team: string
  propType: string
  propDisplayName: string
  line: number
  books: {
    name: string
    over: { odds: number; price: number }
    under: { odds: number; price: number }
  }[]
  bestOver: { book: string; odds: number } | null
  bestUnder: { book: string; odds: number } | null
  overUnderSplit: number // Percentage favoring over
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ gameId: string }> }
) {
  const { gameId } = await params
  const { searchParams } = new URL(request.url)
  const sport = searchParams.get('sport')?.toUpperCase() || 'NFL'
  
  try {
    // Get sport key for The Odds API
    const sportKey = SPORT_KEYS[sport]
    if (!sportKey || !ODDS_API_KEY) {
      // Return demo data if no API key
      return NextResponse.json({
        success: true,
        gameId,
        sport,
        props: generateDemoProps(sport, gameId),
        source: 'demo',
        message: 'Demo data - configure THE_ODDS_API_KEY for live props'
      })
    }

    // Fetch player props from The Odds API
    const markets = PROP_MARKETS[sport] || ['player_points']
    const marketsParam = markets.slice(0, 5).join(',') // Limit to save API calls
    
    const url = `https://api.the-odds-api.com/v4/sports/${sportKey}/events/${gameId}/odds?apiKey=${ODDS_API_KEY}&regions=us&markets=${marketsParam}&oddsFormat=american`
    
    const response = await fetch(url, { next: { revalidate: 300 } }) // Cache for 5 min
    
    if (!response.ok) {
      // Return demo data on API error
      return NextResponse.json({
        success: true,
        gameId,
        sport,
        props: generateDemoProps(sport, gameId),
        source: 'demo',
        message: 'API unavailable - showing demo data'
      })
    }
    
    const data = await response.json()
    
    // Parse the odds data into player props
    const props = parseOddsApiProps(data, sport)
    
    return NextResponse.json({
      success: true,
      gameId,
      sport,
      props,
      source: 'the-odds-api',
      lastUpdated: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('Error fetching player props:', error)
    return NextResponse.json({
      success: true,
      gameId,
      sport,
      props: generateDemoProps(sport, gameId),
      source: 'demo',
      error: 'Failed to fetch live props'
    })
  }
}

function parseOddsApiProps(data: any, sport: string): PlayerPropLine[] {
  const props: PlayerPropLine[] = []
  const propMap = new Map<string, PlayerPropLine>()
  
  if (!data.bookmakers) return generateDemoProps(sport, data.id || '')
  
  for (const bookmaker of data.bookmakers) {
    for (const market of bookmaker.markets || []) {
      const propType = market.key
      const displayName = PROP_DISPLAY_NAMES[propType] || propType.replace(/_/g, ' ')
      
      for (const outcome of market.outcomes || []) {
        const playerName = outcome.description || outcome.name
        const key = `${playerName}-${propType}`
        
        if (!propMap.has(key)) {
          propMap.set(key, {
            player: playerName,
            team: '', // Would need to match from roster data
            propType,
            propDisplayName: displayName,
            line: outcome.point || 0,
            books: [],
            bestOver: null,
            bestUnder: null,
            overUnderSplit: 50
          })
        }
        
        const prop = propMap.get(key)!
        const isOver = outcome.name === 'Over'
        const existingBook = prop.books.find(b => b.name === bookmaker.title)
        
        if (existingBook) {
          if (isOver) {
            existingBook.over = { odds: outcome.price, price: outcome.point }
          } else {
            existingBook.under = { odds: outcome.price, price: outcome.point }
          }
        } else {
          prop.books.push({
            name: bookmaker.title,
            over: isOver ? { odds: outcome.price, price: outcome.point } : { odds: -110, price: outcome.point },
            under: !isOver ? { odds: outcome.price, price: outcome.point } : { odds: -110, price: outcome.point }
          })
        }
        
        if (outcome.point) {
          prop.line = outcome.point
        }
      }
    }
  }
  
  // Calculate best odds for each prop
  for (const prop of propMap.values()) {
    let bestOver = { book: '', odds: -10000 }
    let bestUnder = { book: '', odds: -10000 }
    
    for (const book of prop.books) {
      if (book.over.odds > bestOver.odds) {
        bestOver = { book: book.name, odds: book.over.odds }
      }
      if (book.under.odds > bestUnder.odds) {
        bestUnder = { book: book.name, odds: book.under.odds }
      }
    }
    
    prop.bestOver = bestOver.odds > -10000 ? bestOver : null
    prop.bestUnder = bestUnder.odds > -10000 ? bestUnder : null
    
    // Estimate over/under split based on odds
    const avgOverOdds = prop.books.reduce((sum, b) => sum + b.over.odds, 0) / prop.books.length
    const avgUnderOdds = prop.books.reduce((sum, b) => sum + b.under.odds, 0) / prop.books.length
    prop.overUnderSplit = 50 + Math.round((avgUnderOdds - avgOverOdds) / 10)
  }
  
  return Array.from(propMap.values()).slice(0, 20)
}

function generateDemoProps(sport: string, gameId: string): PlayerPropLine[] {
  // Generate realistic demo props based on sport
  const demoPlayers: Record<string, { players: string[], propTypes: string[] }> = {
    NFL: {
      players: ['Patrick Mahomes', 'Travis Kelce', 'Isiah Pacheco', 'Jalen Hurts', 'A.J. Brown', 'DeVonta Smith'],
      propTypes: ['player_pass_yds', 'player_rush_yds', 'player_reception_yds', 'player_receptions', 'player_anytime_td']
    },
    NBA: {
      players: ['LeBron James', 'Anthony Davis', 'Jayson Tatum', 'Jaylen Brown', 'Stephen Curry', 'Draymond Green'],
      propTypes: ['player_points', 'player_rebounds', 'player_assists', 'player_points_rebounds_assists', 'player_threes']
    },
    NHL: {
      players: ['Connor McDavid', 'Leon Draisaitl', 'Nathan MacKinnon', 'Cale Makar', 'Auston Matthews'],
      propTypes: ['player_points', 'player_goals', 'player_assists', 'player_shots_on_goal']
    },
    MLB: {
      players: ['Shohei Ohtani', 'Mike Trout', 'Mookie Betts', 'Aaron Judge', 'Gerrit Cole'],
      propTypes: ['batter_hits', 'batter_total_bases', 'pitcher_strikeouts', 'batter_runs_scored']
    },
    NCAAF: {
      players: ['QB #1', 'RB #2', 'WR #3', 'QB #4', 'RB #5'],
      propTypes: ['player_pass_yds', 'player_rush_yds', 'player_reception_yds']
    },
    NCAAB: {
      players: ['Guard #1', 'Forward #2', 'Center #3', 'Guard #4'],
      propTypes: ['player_points', 'player_rebounds', 'player_assists']
    },
    WNBA: {
      players: ['A\'ja Wilson', 'Breanna Stewart', 'Sabrina Ionescu', 'Caitlin Clark'],
      propTypes: ['player_points', 'player_rebounds', 'player_assists']
    },
    WNCAAB: {
      players: ['Guard #1', 'Forward #2', 'Center #3'],
      propTypes: ['player_points', 'player_rebounds', 'player_assists']
    }
  }
  
  const sportData = demoPlayers[sport] || demoPlayers.NBA
  const props: PlayerPropLine[] = []
  
  for (const player of sportData.players.slice(0, 4)) {
    for (const propType of sportData.propTypes.slice(0, 2)) {
      const baseOdds = -110
      const variance = () => Math.floor(Math.random() * 20) - 10
      
      props.push({
        player,
        team: '',
        propType,
        propDisplayName: PROP_DISPLAY_NAMES[propType] || propType,
        line: getDefaultLine(propType),
        books: [
          { name: 'DraftKings', over: { odds: baseOdds + variance(), price: getDefaultLine(propType) }, under: { odds: baseOdds + variance(), price: getDefaultLine(propType) } },
          { name: 'FanDuel', over: { odds: baseOdds + variance(), price: getDefaultLine(propType) }, under: { odds: baseOdds + variance(), price: getDefaultLine(propType) } },
          { name: 'BetMGM', over: { odds: baseOdds + variance(), price: getDefaultLine(propType) }, under: { odds: baseOdds + variance(), price: getDefaultLine(propType) } },
          { name: 'Caesars', over: { odds: baseOdds + variance(), price: getDefaultLine(propType) }, under: { odds: baseOdds + variance(), price: getDefaultLine(propType) } },
        ],
        bestOver: { book: 'DraftKings', odds: -105 },
        bestUnder: { book: 'FanDuel', odds: -105 },
        overUnderSplit: 45 + Math.floor(Math.random() * 20)
      })
    }
  }
  
  return props
}

function getDefaultLine(propType: string): number {
  const defaults: Record<string, number> = {
    'player_pass_yds': 250.5,
    'player_pass_tds': 1.5,
    'player_rush_yds': 55.5,
    'player_reception_yds': 50.5,
    'player_receptions': 4.5,
    'player_anytime_td': 0.5,
    'player_points': 22.5,
    'player_rebounds': 7.5,
    'player_assists': 5.5,
    'player_points_rebounds_assists': 35.5,
    'player_threes': 2.5,
    'player_goals': 0.5,
    'player_shots_on_goal': 3.5,
    'batter_hits': 0.5,
    'batter_total_bases': 1.5,
    'pitcher_strikeouts': 5.5,
  }
  return defaults[propType] || 0.5
}
