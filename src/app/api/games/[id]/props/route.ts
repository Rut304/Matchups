/**
 * Player Props API for a specific game
 * Returns player props with multi-book odds comparison
 * 
 * Note: Game-specific props require The Odds API
 * Free sources (DraftKings, FanDuel) are used for batch collection
 */

import { NextRequest, NextResponse } from 'next/server'

const ODDS_API_KEY = process.env.ODDS_API_KEY || process.env.THE_ODDS_API_KEY

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
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: gameId } = await params
  const { searchParams } = new URL(request.url)
  const sport = searchParams.get('sport')?.toUpperCase() || 'NFL'
  
  try {
    // Game-specific props require The Odds API
    // Free sources (DraftKings, FanDuel) only support batch collection by sport
    
    const sportKey = SPORT_KEYS[sport]
    if (!sportKey) {
      return NextResponse.json({
        success: false,
        gameId,
        sport,
        props: [],
        source: null,
        message: `Sport '${sport}' not supported for player props.`,
      })
    }
    
    if (!ODDS_API_KEY) {
      return NextResponse.json({
        success: false,
        gameId,
        sport,
        props: [],
        source: null,
        message: 'Player props not available. THE_ODDS_API_KEY required for game-specific props.',
        apiKeyConfigured: false,
      })
    }
    
    const markets = PROP_MARKETS[sport] || ['player_points']
    const marketsParam = markets.slice(0, 5).join(',') // Limit to save API calls
    
    const url = `https://api.the-odds-api.com/v4/sports/${sportKey}/events/${gameId}/odds?apiKey=${ODDS_API_KEY}&regions=us&markets=${marketsParam}&oddsFormat=american`
    
    const response = await fetch(url, { next: { revalidate: 300 } }) // Cache for 5 min
    
    if (!response.ok) {
      return NextResponse.json({
        success: false,
        gameId,
        sport,
        props: [],
        source: null,
        message: `The Odds API returned status ${response.status}. Props not available for this game.`,
      })
    }
    
    const data = await response.json()
    const props = parseOddsApiProps(data, sport)
    
    if (props.length === 0) {
      return NextResponse.json({
        success: false,
        gameId,
        sport,
        props: [],
        source: 'the-odds-api',
        message: 'No player props available for this game yet.',
      })
    }
    
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
      success: false,
      gameId,
      sport,
      props: [],
      source: null,
      error: 'Failed to fetch player props',
      message: 'Unable to load player props. Please try again later.'
    })
  }
}

function parseOddsApiProps(data: any, sport: string): PlayerPropLine[] {
  const props: PlayerPropLine[] = []
  const propMap = new Map<string, PlayerPropLine>()
  
  // Return empty array if no bookmaker data - NO FAKE DATA
  if (!data.bookmakers) return []
  
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

// generateDemoProps and getDefaultLine removed - NO FAKE DATA policy
